import { moveDex } from "../data/moves";
import { speciesDex } from "../data/species";
import type { GameState } from "../state/gameState";
import type {
  BattlefieldCondition,
  BattleGoalDefinition,
  BattleActionResult,
  ElementType,
  MoveDefinition,
  RescueEncounterState,
  SupportEffect,
  TrainerBattleDebrief,
  TrainerDefinition,
  VivoInstance,
} from "../state/types";

const effectivenessChart: Record<ElementType, Partial<Record<ElementType, number>>> = {
  neutral: { stone: 0.9, electric: 0.95 },
  electric: { water: 1.35, steel: 1.1, light: 1.05, grass: 0.75, stone: 0.75, electric: 0.8 },
  fire: { grass: 1.4, ice: 1.35, light: 0.9, fire: 0.8, steel: 1.25, stone: 0.75, water: 0.75 },
  grass: { fire: 0.75, ice: 0.8, neutral: 1.1, shadow: 0.9, steel: 0.75, stone: 1.2, water: 1.25, electric: 1.05 },
  ice: { grass: 1.25, water: 0.9, fire: 0.75, ice: 0.8, stone: 1.1, electric: 0.9 },
  light: { fire: 1.1, grass: 1.2, ice: 1.05, shadow: 1.25 },
  shadow: { grass: 1.1, light: 1.3, shadow: 0.8, steel: 0.8, electric: 0.95 },
  steel: { grass: 1.15, ice: 1.25, light: 1.1, shadow: 1.15, fire: 0.75, steel: 0.8, stone: 0.8, water: 0.9 },
  stone: { fire: 1.25, ice: 1.15, light: 0.9, electric: 1.35, grass: 0.75, steel: 1.15, stone: 0.8, water: 0.8 },
  water: { fire: 1.35, steel: 1.1, stone: 1.25, grass: 0.75, electric: 0.75, ice: 0.9, water: 0.8 },
};

export interface BattleSetup {
  type: "wild" | "trainer";
  enemyTeam: VivoInstance[];
  label: string;
  trainer?: TrainerDefinition;
  battleGoals?: BattleGoalDefinition[];
  allowCapture?: boolean;
  rescueEncounter?: RescueEncounterState;
  fieldCondition?: BattlefieldCondition;
  initialTempo?: InitialTempoState | InitialTempoState[];
}

interface BattleTempoState {
  guardMultiplier?: number;
  focusMultiplier?: number;
  exposedMultiplier?: number;
  exposureCount?: number;
}

type TempoEffectLabel = "guarded" | "focused" | "exposed";

export interface InitialTempoState {
  side: "player" | "enemy";
  effects: TempoEffectLabel[];
  log: string;
  cueLabel?: string;
}

interface BattleGoalProgress {
  definition: BattleGoalDefinition;
  current: number;
}

interface EnemyIntentPreview {
  label: string;
  summary: string;
  detail: string;
  stance: "steady" | "warning" | "danger";
}

interface ForecastChip {
  label: string;
  tone: "steady" | "good" | "caution" | "risk";
}

interface ActionForecast {
  chips: ForecastChip[];
  detail: string;
}

interface BattleGoalForecast {
  chips: ForecastChip[];
  detail?: string;
}

interface DeferredTrainerReward {
  enemySpeciesId: string;
  enemyLevel: number;
  enemyElement: ElementType;
  finisherId: string;
  participantIds: string[];
}

export type BattlePresentationEvent =
  | {
      type: "attack";
      side: "player" | "enemy";
      targetSide: "player" | "enemy";
      moveName: string;
      attackStyle: "impact" | "focus";
      element: ElementType;
      hit: boolean;
      damage: number;
      effectiveness: "strong" | "weak" | "neutral";
      guarded: boolean;
      exploitedOpening: boolean;
      fainted: boolean;
    }
  | {
      type: "support";
      side: "player" | "enemy";
      targetSide: "player" | "enemy";
      moveName: string;
      effectType: SupportEffect["type"];
    }
  | {
      type: "switch";
      side: "player" | "enemy";
      vivoName: string;
      forced: boolean;
    }
  | {
      type: "capture";
      success: boolean;
      readiness: "resisting" | "wavering" | "fragile";
    }
  | {
      type: "faint";
      side: "player" | "enemy";
      vivoName: string;
    }
  | {
      type: "trait";
      side: "player" | "enemy";
      traitName: string;
      cue: string;
      tint: number;
    }
  | {
      type: "tempoShift";
      side: "player" | "enemy";
      label: string;
      cue: string;
      tint: number;
    }
  | {
      type: "levelUp";
      vivoName: string;
      level: number;
    }
  | {
      type: "moveUnlock";
      vivoName: string;
      moveName: string;
      pendingChoice: boolean;
    };

type EnemyDecision =
  | {
      type: "move";
      move: MoveDefinition;
    }
  | {
      type: "switch";
      targetIndex: number;
      summary: string;
    }
  | {
      type: "retreat";
      chance: number;
      summary: string;
    };

export class BattleController {
  readonly type: BattleSetup["type"];
  readonly enemyTeam: VivoInstance[];
  readonly trainer?: TrainerDefinition;
  readonly fieldCondition?: BattlefieldCondition;
  private readonly allowCapture: boolean;
  private readonly rescueEncounter?: RescueEncounterState;
  private readonly gameState: GameState;
  private readonly log: string[] = [];
  private readonly battleStates = new Map<string, BattleTempoState>();
  private readonly playerParticipants = new Set<string>();
  private lastCaptureAttemptLevel = -1;
  private lastCaptureExposureCount = -1;
  private pendingForcedSwitch = false;
  private enemySwitchLock = false;
  private calmSignals = 0;
  private originCalmSignalBondGranted = false;
  private promiseCalmSignalBondGranted = false;
  private promiseSignalHoldTurns = 0;
  private readonly battleGoals: BattleGoalProgress[];
  private presentationEvents: BattlePresentationEvent[] = [];
  private readonly triggeredTraitVivoIds = new Set<string>();
  private readonly memoryHandoffVivoIds = new Set<string>();
  private readonly memoryHandoffDebriefNotes: string[] = [];
  private readonly deferredTrainerRewards: DeferredTrainerReward[] = [];
  private readonly openingReadNote?: string;
  private commandMenu: "root" | "fight" | "team" | "bag" = "root";

  constructor(gameState: GameState, setup: BattleSetup) {
    this.gameState = gameState;
    this.type = setup.type;
    this.enemyTeam = setup.enemyTeam;
    this.trainer = setup.trainer;
    this.fieldCondition = setup.fieldCondition;
    this.allowCapture = setup.allowCapture ?? setup.type === "wild";
    this.rescueEncounter = setup.rescueEncounter;
    this.playerParticipants.add(this.playerActive.id);
    this.battleGoals = (
      setup.trainer?.battleGoals ??
      setup.battleGoals ??
      setup.rescueEncounter?.battleGoals ??
      []
    ).map((definition) => ({
      definition,
      current: 0,
    }));
    this.log.push(setup.label);
    const initialTempoStates = Array.isArray(setup.initialTempo)
      ? setup.initialTempo
      : setup.initialTempo
        ? [setup.initialTempo]
        : [];
    this.openingReadNote = this.describeOpeningRead(initialTempoStates);
    for (const initialTempo of initialTempoStates) {
      this.applyInitialTempo(initialTempo);
    }
  }

  get playerActive(): VivoInstance {
    return this.gameState.party[0];
  }

  get enemyActive(): VivoInstance {
    return this.enemyTeam[0];
  }

  consumePresentationEvents(): BattlePresentationEvent[] {
    const events = this.presentationEvents;
    this.presentationEvents = [];
    return events;
  }

  private describeOpeningRead(initialTempoStates: InitialTempoState[]): string | undefined {
    if (initialTempoStates.length === 0) {
      return undefined;
    }

    return initialTempoStates
      .map((tempo) => `${tempo.cueLabel ?? "Opening"}: ${tempo.log}`)
      .join(" ");
  }

  setCommandMenu(commandMenu: "root" | "fight" | "team" | "bag") {
    this.commandMenu = this.pendingForcedSwitch ? "team" : commandMenu;
  }

  renderControls(): string {
    const pendingMoveStudy = this.gameState.getPendingMoveChoices();
    if (pendingMoveStudy.length > 0) {
      return this.renderMoveStudyControls(pendingMoveStudy);
    }

    const player = this.playerActive;
    const enemy = this.enemyActive;
    const rescueReadiness =
      this.type === "wild" && (this.allowCapture || this.rescueEncounter)
        ? this.getCaptureReadiness()
        : undefined;
    const retreatReadiness = this.type === "wild" ? this.getRetreatReadiness() : undefined;
    const playerStatusMarkup = this.renderTempoMarkup(player, "Lead");
    const enemyStatusMarkup = this.renderTempoMarkup(enemy, "Target");
    const enemyIntent = this.getEnemyIntentPreview();
    const forecastEnemyDecision = this.getForecastEnemyDecision();
    const captureForecast = this.getCaptureForecast(rescueReadiness, forecastEnemyDecision);
    const retreatForecast = this.getRetreatForecast(retreatReadiness);
    const traitMarkup = this.renderTraitMarkup();
    let controlIndex = 0;
    const nextHotkey = () => {
      controlIndex += 1;
      return controlIndex === 10 ? "0" : String(controlIndex);
    };
    const renderActionButton = (
      bodyClass: string,
      action: string,
      payload: string | undefined,
      title: string,
      detail: string,
      forecastMarkup: string,
    ) => {
      const hotkey = nextHotkey();
      const payloadAttributes =
        action === "move"
          ? ` data-move-id="${payload ?? ""}"`
          : action === "switch"
            ? ` data-party-index="${payload ?? ""}"`
            : "";
      return `<button class="battle-button battle-command-${action}${bodyClass ? ` ${bodyClass}` : ""}" data-action="${action}" data-hotkey="${hotkey}"${payloadAttributes}>
          <span class="battle-button-title-row"><span>${title}</span><span class="battle-hotkey">${hotkey}</span></span>
          ${forecastMarkup}
          <small>${detail}</small>
        </button>`;
    };
    const renderMenuButton = (
      bodyClass: string,
      menu: "root" | "fight" | "team" | "bag",
      title: string,
      detail: string,
    ) => {
      const hotkey = nextHotkey();
      return `<button class="battle-button battle-command-${menu}${bodyClass ? ` ${bodyClass}` : ""}" data-menu="${menu}" data-hotkey="${hotkey}">
          <span class="battle-button-title-row"><span>${title}</span><span class="battle-hotkey">${hotkey}</span></span>
          <small>${detail}</small>
        </button>`;
    };

    const moveButtons = this.pendingForcedSwitch
      ? ""
      : player.knownMoveIds
          .map((moveId) => {
            const move = moveDex[moveId];
            const forecast = this.getMoveForecast(move, forecastEnemyDecision);
            return renderActionButton(
              "",
              "move",
              move.id,
              move.name,
              forecast.detail,
              `<div class="battle-forecast-row">${this.renderForecastChips(forecast.chips)}</div>`,
            );
          })
          .join("");

    controlIndex = 0;
    const captureButton =
      !this.pendingForcedSwitch && this.type === "wild" && (this.allowCapture || this.rescueEncounter)
        ? renderActionButton(
            "alt",
            "capture",
            undefined,
            this.rescueEncounter && !this.allowCapture ? "Rescue Pulse" : "Rescue Capsule",
            captureForecast.detail,
            `<div class="battle-forecast-row">${this.renderForecastChips(captureForecast.chips)}</div>`,
          )
        : "";
    const calmSignalForecast =
      !this.pendingForcedSwitch && this.type === "wild" && (this.allowCapture || this.rescueEncounter)
        ? this.getCalmSignalForecast()
        : undefined;
    const calmSignalButton = calmSignalForecast
        ? renderActionButton(
            "alt",
            "calm",
            undefined,
            "Calm Signal",
            calmSignalForecast.detail,
            `<div class="battle-forecast-row">${this.renderForecastChips(calmSignalForecast.chips)}</div>`,
          )
        : "";
    const retreatButton =
      !this.pendingForcedSwitch && this.type === "wild"
        ? renderActionButton(
            "alt",
            "retreat",
            undefined,
            "Retreat",
            retreatForecast.detail,
            `<div class="battle-forecast-row">${this.renderForecastChips(retreatForecast.chips)}</div>`,
          )
        : "";
    controlIndex = 0;
    const switchButtons = this.gameState.party
      .map((vivo, index) =>
        index === 0 || vivo.currentHp <= 0
          ? ""
          : (() => {
              const forecast = this.getSwitchForecast(vivo, forecastEnemyDecision);
              return renderActionButton(
                "alt",
                "switch",
                String(index),
                `${this.pendingForcedSwitch ? "Send out" : "Switch to"} ${vivo.nickname}`,
                forecast.detail,
                `<div class="battle-forecast-row">${this.renderForecastChips(forecast.chips)}</div>`,
              );
            })(),
      )
      .join("");
    const hasTeamOptions = switchButtons.trim().length > 0;
    const bagButtons = `${captureButton}${calmSignalButton}`;
    const hasBagOptions = bagButtons.trim().length > 0;
    const backButton = this.pendingForcedSwitch
      ? ""
      : `<button class="battle-button battle-command-back" data-menu="root" data-hotkey="0">
          <span class="battle-button-title-row"><span>Back</span><span class="battle-hotkey">0</span></span>
          <small>Return to the main battle choices.</small>
        </button>`;
    const commandMarkup = (() => {
      if (this.pendingForcedSwitch) {
        return switchButtons;
      }
      if (this.commandMenu === "fight") {
        return `${moveButtons}${backButton}`;
      }
      if (this.commandMenu === "team") {
        return `${hasTeamOptions ? switchButtons : `<div class="battle-empty-command">No healthy backup is ready.</div>`}${backButton}`;
      }
      if (this.commandMenu === "bag") {
        return `${hasBagOptions ? bagButtons : `<div class="battle-empty-command">No rescue tools are available in this battle.</div>`}${backButton}`;
      }
      controlIndex = 0;
      const renderRootRetreatButton = () =>
        this.type === "wild"
          ? renderActionButton("root", "retreat", undefined, "Run", retreatForecast.detail, "")
          : `<button class="battle-button battle-command-retreat disabled" data-menu="root" data-hotkey="${nextHotkey()}">
              <span class="battle-button-title-row"><span>Run</span><span class="battle-hotkey">${controlIndex === 10 ? "0" : controlIndex}</span></span>
              <small>Trainer battles must be answered.</small>
            </button>`;
      return `
        ${renderMenuButton("root", "fight", "Fight", "Choose one of the active Vivo's learned moves.")}
        ${renderMenuButton("root", "bag", "Bag", hasBagOptions ? "Use rescue gear or a calm signal." : "No rescue tools are available.")}
        ${renderMenuButton("root", "team", "Team", hasTeamOptions ? "Switch to a healthy bonded Vivo." : "No healthy backup is ready.")}
        ${renderRootRetreatButton()}
      `;
    })();

    const enemyName = this.getOpponentDisplayName(enemy);
    const battleTitle = this.pendingForcedSwitch
      ? `${player.nickname} needs relief`
      : `${player.nickname} vs ${enemyName}`;
    const battleCopy = this.pendingForcedSwitch
      ? `${player.nickname} can no longer battle. Choose another bonded Vivo to keep the match alive.`
      : `${player.nickname} HP ${player.currentHp}/${this.gameState.getMaxHp(player)} | ${enemyName} HP ${enemy.currentHp}/${this.gameState.getMaxHp(enemy)}`;

    const latestLog = this.log.slice(-2).join("<br />");

    return `
      <div class="battle-rpg-shell" aria-label="${battleTitle}">
        <section class="battle-rpg-prompt">
          <p class="battle-rpg-question">What will ${player.nickname} do?</p>
          <p class="battle-rpg-state">${battleCopy}</p>
          ${latestLog ? `<p class="battle-rpg-log">${latestLog}</p>` : ""}
        </section>
        <section class="battle-rpg-menu" aria-label="Battle commands">
          <div class="battle-moves">
            ${commandMarkup}
          </div>
        </section>
        <section class="battle-rpg-readouts">
          <div class="battle-status-grid">
            ${playerStatusMarkup}
            ${enemyStatusMarkup}
          </div>
          ${this.renderEnemyIntentMarkup(enemyIntent)}
          ${this.renderFieldConditionMarkup()}
          ${this.renderOpeningReadMarkup()}
          ${this.renderBattleGoalsMarkup()}
          ${traitMarkup}
          ${
            rescueReadiness
              ? `<p class="hud-mini">Rescue: ${rescueReadiness.label} - ${rescueReadiness.detail}</p>`
              : ""
          }
          ${
            retreatReadiness
              ? `<p class="hud-mini">Retreat: ${retreatReadiness.label} - ${retreatReadiness.detail}</p>`
              : ""
          }
          <p class="battle-command-help">Arrow/W/S select. Enter confirms. C rescue, M calm, R retreat.</p>
        </section>
      </div>
    `;
  }

  private renderMoveStudyControls(
    pendingMoveStudy: ReturnType<GameState["getPendingMoveChoices"]>,
  ): string {
    const [{ vivo, choice }] = pendingMoveStudy;
    const nextMove = moveDex[choice.moveId];
    const moveButtons = vivo.knownMoveIds
      .map((moveId, index) => {
        const move = moveDex[moveId];
        const hotkey = String(index + 1);
        return `<button class="battle-button battle-command-study" data-study-action="learn" data-vivo-id="${vivo.id}" data-move-id="${choice.moveId}" data-replace-move-id="${moveId}" data-hotkey="${hotkey}">
          <span class="battle-button-title-row"><span>Replace ${move.name}</span><span class="battle-hotkey">${hotkey}</span></span>
          <small>${this.describeBattleMove(move)}</small>
        </button>`;
      })
      .join("");
    const keepHotkey = String(vivo.knownMoveIds.length + 1);
    return `
      <div class="battle-rpg-shell battle-study-shell" aria-label="Battle move study">
        <section class="battle-rpg-prompt battle-study-prompt">
          <p class="battle-rpg-question">${vivo.nickname} can learn ${nextMove.name}.</p>
          <p class="battle-rpg-state">Lv. ${choice.sourceLevel} field lesson</p>
          <p class="battle-rpg-log">${this.describeBattleMove(nextMove)}</p>
        </section>
        <section class="battle-rpg-menu" aria-label="Choose a move to replace">
          <div class="battle-moves">
            ${moveButtons}
            <button class="battle-button battle-command-back" data-study-action="decline" data-vivo-id="${vivo.id}" data-move-id="${choice.moveId}" data-hotkey="${keepHotkey}">
              <span class="battle-button-title-row"><span>Keep current kit</span><span class="battle-hotkey">${keepHotkey}</span></span>
              <small>Pass on ${nextMove.name} and keep the current four moves.</small>
            </button>
          </div>
        </section>
        <section class="battle-rpg-readouts">
          <p class="battle-command-help">Choose now. The fight scene will return after move study is settled.</p>
        </section>
      </div>
    `;
  }

  private describeBattleMove(move: MoveDefinition): string {
    if (move.kind === "support") {
      return `${this.formatElementName(move.element)} support - ${move.description}`;
    }

    return `${this.formatElementName(move.element)} ${move.attackStyle ?? "impact"} ${move.power} power - ${move.description}`;
  }

  private formatElementName(element: ElementType): string {
    return element.charAt(0).toUpperCase() + element.slice(1);
  }

  private renderTraitMarkup(): string {
    const playerTrait = this.gameState.getBattleTrait(this.playerActive);
    const enemyTrait = this.gameState.getBattleTrait(this.enemyActive);
    return `
      <div class="battle-traits">
        <article class="battle-goal-card">
          <p class="battle-goal-label">Lead instinct</p>
          <h3 class="battle-goal-title">${playerTrait.name}</h3>
          <p class="hud-mini">${playerTrait.summary}</p>
        </article>
        <article class="battle-goal-card">
          <p class="battle-goal-label">Target instinct</p>
          <h3 class="battle-goal-title">${enemyTrait.name}</h3>
          <p class="hud-mini">${enemyTrait.summary}</p>
        </article>
      </div>
    `;
  }

  private renderFieldConditionMarkup(): string {
    if (!this.fieldCondition) {
      return "";
    }

    return `<article class="battle-intent-card steady">
      <p class="battle-goal-label">Field condition</p>
      <h3 class="battle-goal-title">${this.fieldCondition.name}</h3>
      <p class="hud-copy">${this.fieldCondition.summary}</p>
      <p class="hud-mini">${this.fieldCondition.detail}</p>
    </article>`;
  }

  private renderOpeningReadMarkup(): string {
    const routeReadNote = this.getRouteReadDebriefNote();
    if (!routeReadNote) {
      return "";
    }

    const signalNote = this.getLiveCalmSignalReadNote();
    return `<article class="battle-intent-card steady">
      <p class="battle-goal-label">Opening read</p>
      <h3 class="battle-goal-title">${
        signalNote
          ? "Calm signal holding"
          : this.memoryHandoffDebriefNotes.length > 0
            ? "Route memory holding"
            : "Route pressure carried in"
      }</h3>
      <p class="hud-mini">${routeReadNote}</p>
      ${signalNote ? `<p class="hud-mini">${signalNote}</p>` : ""}
    </article>`;
  }

  private getLiveCalmSignalReadNote(): string | undefined {
    if (this.calmSignals <= 0) {
      return undefined;
    }

    const notes = [
      `${this.calmSignals} Calm Signal${this.calmSignals === 1 ? "" : "s"} sent; rescue and retreat reads are softer for this encounter.`,
    ];
    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    if (memoryRead) {
      notes.push(
        memoryRead.elementMatch
          ? "Origin memory is adding a focused brace to the lead."
          : "Rescue memory is keeping the lead braced.",
      );
    }
    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    if (promiseStrength > 0) {
      notes.push(
        promiseStrength >= 2
          ? "Origin promise can still pin the next bolt beat."
          : "Rescue promise can still pin the next bolt beat.",
      );
    }

    return notes.join(" ");
  }

  private renderBattleGoalsMarkup(): string {
    if (this.battleGoals.length === 0) {
      return "";
    }

    const goalMarkup = this.battleGoals
      .map(({ definition, current }) => {
        const target = definition.count;
        const complete = current >= target;
        return `<article class="battle-goal-card${complete ? " complete" : ""}">
          <p class="battle-goal-label">${complete ? "Lesson held" : "Trial lesson"}</p>
          <h3 class="battle-goal-title">${definition.label}</h3>
          <p class="hud-mini">${definition.hint}</p>
          <p class="battle-goal-progress">${Math.min(current, target)}/${target}</p>
        </article>`;
      })
      .join("");

    return `<div class="battle-goals">${goalMarkup}</div>`;
  }

  private renderEnemyIntentMarkup(intent: EnemyIntentPreview): string {
    return `<article class="battle-intent-card ${intent.stance}">
      <p class="battle-goal-label">Field read</p>
      <h3 class="battle-goal-title">${intent.label}</h3>
      <p class="hud-copy">${intent.summary}</p>
      <p class="hud-mini">${intent.detail}</p>
    </article>`;
  }

  private renderForecastChips(chips: ForecastChip[]): string {
    return chips
      .map(
        (chip) =>
          `<span class="battle-forecast-chip ${chip.tone}">${chip.label}</span>`,
      )
      .join("");
  }

  handleDomAction(action: string, moveId?: string): BattleActionResult {
    if (this.pendingForcedSwitch && action !== "switch") {
      return {
        log: ["That Vivo has fainted. Send another bonded Vivo into the field."],
        finished: false,
      };
    }
    if (action === "capture") {
      return this.attemptCapture(moveId !== "miss");
    }
    if (action === "calm") {
      return this.performCalmSignal();
    }
    if (action === "retreat") {
      return this.attemptRetreat();
    }
    if (action === "switch") {
      return this.performSwitch(Number(moveId));
    }
    if (!moveId) {
      return { log: ["No move selected."], finished: false };
    }
    return this.performTurn(moveId);
  }

  private performTurn(moveId: string): BattleActionResult {
    const playerMove = moveDex[moveId];
    const enemyDecision = this.chooseEnemyAction(this.enemyActive, this.playerActive);
    const log: string[] = [];

    const playerTempo =
      this.gameState.getSpeed(this.playerActive) +
      this.getMoveTempoBonus(this.playerActive, this.enemyActive, playerMove);
    const enemyTempo =
      enemyDecision.type === "switch"
        ? 5000
        : enemyDecision.type === "retreat"
          ? this.gameState.getSpeed(this.enemyActive) + 1800
        : this.gameState.getSpeed(this.enemyActive) +
          this.getMoveTempoBonus(this.enemyActive, this.playerActive, enemyDecision.move);
    const playerFirst = playerTempo >= enemyTempo;
    const sequence = playerFirst
      ? [
          { side: "player" as const, move: playerMove },
          { side: "enemy" as const, decision: enemyDecision },
        ]
      : [
          { side: "enemy" as const, decision: enemyDecision },
          { side: "player" as const, move: playerMove },
        ];

    for (const step of sequence) {
      if ("move" in step) {
        const move = step.move;
        if (!move) {
          continue;
        }
        const attacker = step.side === "player" ? this.playerActive : this.enemyActive;
        const defender = step.side === "player" ? this.enemyActive : this.playerActive;
        if (attacker.currentHp <= 0 || defender.currentHp <= 0) {
          continue;
        }
        log.push(...this.resolveMove(attacker, defender, move));
        if (defender.currentHp <= 0) {
          break;
        }
        continue;
      }

      const attacker = this.enemyActive;
      const defender = this.playerActive;

      if (attacker.currentHp <= 0) {
        continue;
      }

      if (step.decision.type === "switch") {
        const switchLog = this.performEnemySwitch(step.decision.targetIndex, step.decision.summary);
        if (switchLog.length > 0) {
          log.push(...switchLog);
        }
        continue;
      }

      if (step.decision.type === "retreat") {
        const retreatResult = this.performEnemyRetreat(step.decision.summary);
        log.push(...retreatResult.log);
        if (retreatResult.finished) {
          const retreatLogLength = retreatResult.log.length;
          if (log.length > retreatLogLength) {
            this.log.push(...log.slice(0, log.length - retreatLogLength));
          }
          return { ...retreatResult, log };
        }
        continue;
      }

      if (defender.currentHp <= 0) {
        continue;
      }

      log.push(...this.resolveMove(attacker, defender, step.decision.move));
      if (defender.currentHp <= 0) {
        break;
      }
    }

    if (enemyDecision.type === "switch") {
      this.enemySwitchLock = true;
    } else if (this.enemySwitchLock) {
      this.enemySwitchLock = false;
    }

    this.log.push(...log);
    return this.resolveBattleEnd(log);
  }

  private resolveMove(attacker: VivoInstance, defender: VivoInstance, move: MoveDefinition): string[] {
    if (move.kind === "support") {
      return this.resolveSupportMove(attacker, defender, move);
    }
    return this.resolveAttack(attacker, defender, move);
  }

  private resolveAttack(attacker: VivoInstance, defender: VivoInstance, move: MoveDefinition): string[] {
    const side = attacker === this.playerActive ? "player" : "enemy";
    const targetSide = side === "player" ? "enemy" : "player";
    if (Math.random() > move.accuracy) {
      this.presentationEvents.push({
        type: "attack",
        side,
        targetSide,
        moveName: move.name,
        attackStyle: move.attackStyle ?? "impact",
        element: move.element,
        hit: false,
        damage: 0,
        effectiveness: "neutral",
        guarded: false,
        exploitedOpening: false,
        fainted: false,
      });
      return [`${attacker.nickname}'s ${move.name} missed.`];
    }

    const attackStyle = move.attackStyle ?? "impact";
    const attackerPower =
      attackStyle === "focus" ? this.gameState.getFocus(attacker) : this.gameState.getAttack(attacker);
    const defenderPower = this.gameState.getDefense(defender);
    const effectiveness =
      effectivenessChart[move.element]?.[defender.element] ??
      effectivenessChart[move.element]?.[speciesDex[defender.speciesId].element] ??
      1;
    const attackerState = this.ensureBattleState(attacker);
    const defenderState = this.ensureBattleState(defender);
    const focusMultiplier = attackerState.focusMultiplier ?? 1;
    const guardMultiplier = defenderState.guardMultiplier ?? 1;
    const exposedMultiplier = defenderState.exposedMultiplier ?? 1;
    const targetWasGuarded = guardMultiplier < 1;
    const targetWasExposed = exposedMultiplier > 1;
    const targetWasFocused = (defenderState.focusMultiplier ?? 1) > 1;
    const traitMultiplier = this.getTraitAttackMultiplier(
      attacker,
      defender,
      move,
      focusMultiplier,
      exposedMultiplier,
    );
    const damage = Math.max(
      3,
      Math.round(
        (move.power + attackerPower * 0.8 - defenderPower * 0.45) *
          effectiveness *
          focusMultiplier *
          guardMultiplier *
          exposedMultiplier *
          traitMultiplier *
          this.getFieldAttackMultiplier(move),
      ),
    );
    defender.currentHp = Math.max(0, defender.currentHp - damage);
    attackerState.focusMultiplier = undefined;
    defenderState.guardMultiplier = undefined;
    defenderState.exposedMultiplier = undefined;
    const fainted = defender.currentHp <= 0;
    this.presentationEvents.push({
      type: "attack",
      side,
      targetSide,
      moveName: move.name,
      attackStyle,
      element: move.element,
      hit: true,
      damage,
      effectiveness:
        effectiveness >= 1.25 ? "strong" : effectiveness <= 0.85 ? "weak" : "neutral",
      guarded: guardMultiplier < 1,
      exploitedOpening: exposedMultiplier > 1,
      fainted,
    });
    if (fainted) {
      this.presentationEvents.push({
        type: "faint",
        side: targetSide,
        vivoName: defender.nickname,
      });
    }
    if (attacker === this.playerActive) {
      this.advanceAttackGoals(move);
    }
    const followUpNotes = fainted
      ? []
      : this.applyAttackFollowUpEffects(attacker, defender, move, {
          targetWasGuarded,
          targetWasExposed,
          targetWasFocused,
        });

    const reaction =
      effectiveness >= 1.25 ? " It's super effective." : effectiveness <= 0.85 ? " It glances off." : "";
    const tempoNotes: string[] = [];
    if (focusMultiplier > 1) {
      tempoNotes.push("The prepared strike lands harder.");
    }
    if (guardMultiplier < 1) {
      tempoNotes.push("The guard softens the blow.");
    }
    if (exposedMultiplier > 1) {
      tempoNotes.push("The opening is exploited cleanly.");
    }
    if (traitMultiplier > 1 && this.getBattleTrait(attacker).id === "prismEcho") {
      tempoNotes.push("Prism Echo sharpens the focused lane.");
    }
    if (traitMultiplier > 1 && this.getBattleTrait(attacker).id === "cutlineRush") {
      tempoNotes.push("Cutline Rush steals the opening.");
    }
    if (this.isFieldAttackBoosted(move)) {
      tempoNotes.push(`${this.fieldCondition?.name} sharpens the strike.`);
    }
    const styleNote = this.describeAttackStyle(attackStyle);
    const notes = [
      `${attacker.nickname} used ${move.name} for ${damage} damage.${reaction}${styleNote ? ` ${styleNote}` : ""}${tempoNotes.length ? ` ${tempoNotes.join(" ")}` : ""}`,
    ];
    notes.push(...followUpNotes);
    notes.push(...this.tryTriggerIronDefiance(defender, attacker, targetWasGuarded));
    notes.push(...this.tryTriggerSanctuaryHeart(defender));
    return notes;
  }

  private attemptCapture(toolHit = true): BattleActionResult {
    if (this.type !== "wild") {
      return { log: ["Trainer Vivos cannot be captured."], finished: false };
    }
    if (!toolHit) {
      const text = "The rescue capsule sails wide of the target mark and fails to deploy.";
      this.log.push(text);
      const retaliation = this.performEnemyOnlyTurn();
      retaliation.log.unshift(text);
      return retaliation;
    }
    if (!this.allowCapture) {
      return this.attemptScriptedRescuePulse();
    }

    const readiness = this.getCaptureReadiness();
    if (!this.hasFreshCaptureOpening(readiness)) {
      return {
        log: [
          "That rescue opening has already been spent. Weaken the Vivo further or create a fresh expose before trying again.",
        ],
        finished: false,
      };
    }

    const enemy = this.enemyActive;
    const chance = readiness.chance;
    const success = Math.random() <= chance;
    this.lastCaptureAttemptLevel = readiness.level;
    this.lastCaptureExposureCount = readiness.exposureCount;
    this.presentationEvents.push({
      type: "capture",
      success,
      readiness: readiness.label as "resisting" | "wavering" | "fragile",
    });
    if (success) {
      const captured = this.gameState.createVivo(enemy.speciesId, enemy.level);
      const rescueBondNote = this.gameState.imprintCapturedRescueBond(captured, readiness.level, this.calmSignals);
      const message = this.gameState.addCapturedVivo(captured);
      const aftermath = this.gameState.recordWildEncounterAftermath("capture", {
        targetName: speciesDex[enemy.speciesId].name,
        rescueRead: `${readiness.label} pulse at ${Math.round(readiness.chance * 100)}% after ${this.calmSignals} calm signal${this.calmSignals === 1 ? "" : "s"}`,
        bondNote: rescueBondNote,
        openingNote: this.getRouteReadDebriefNote(),
      });
      const text = `${speciesDex[enemy.speciesId].name} settled into your field capsule. ${rescueBondNote ? `${rescueBondNote} ` : ""}${message}${aftermath ? ` ${aftermath}` : ""}`;
      this.log.push(text);
      this.gameState.finishBattle(text);
      return { log: [text], finished: true, winner: "player" };
    }

    const enemyState = this.ensureBattleState(enemy);
    enemyState.exposedMultiplier = undefined;
    this.log.push("The Vivo resists the capture pulse and rallies.");
    return this.performEnemyOnlyTurn();
  }

  private attemptScriptedRescuePulse(): BattleActionResult {
    if (!this.rescueEncounter) {
      return { log: ["This rescue has to be earned by calming the Vivo in battle."], finished: false };
    }

    const readiness = this.getCaptureReadiness();
    if (!this.areBattleGoalsComplete()) {
      const text = `${speciesDex[this.enemyActive.speciesId].name} watches the field wrap but will not leave cover yet. ${this.describeMissingBattleGoals()} Calm the whole exchange before sending another pulse.`;
      this.log.push(text);
      const retaliation = this.performEnemyOnlyTurn();
      retaliation.log.unshift(text);
      return retaliation;
    }

    if (!this.hasFreshCaptureOpening(readiness)) {
      return {
        log: [
          "That rescue opening has already been spent. Weaken the Vivo further or create a fresh expose before sending another pulse.",
        ],
        finished: false,
      };
    }

    this.lastCaptureAttemptLevel = readiness.level;
    this.lastCaptureExposureCount = readiness.exposureCount;
    this.presentationEvents.push({
      type: "capture",
      success: readiness.level >= 1,
      readiness: readiness.label as "resisting" | "wavering" | "fragile",
    });

    if (readiness.level < 1) {
      const text = `${speciesDex[this.enemyActive.speciesId].name} hears the pulse, but the opening is still too raw. Lower its pressure or expose the line before asking it to trust the wrap.`;
      this.log.push(text);
      const enemyState = this.ensureBattleState(this.enemyActive);
      enemyState.exposedMultiplier = undefined;
      const retaliation = this.performEnemyOnlyTurn();
      retaliation.log.unshift(text);
      return retaliation;
    }

    const trustNotes = this.distributeScriptedRescueTrustExperience(this.enemyActive, this.playerActive);
    const rescueResolution = this.gameState.resolveActiveRescueEncounter("trustPulse");
    if (!rescueResolution) {
      return { log: [], finished: true, winner: "player" };
    }

    const text = `${speciesDex[this.enemyActive.speciesId].name} settles before the knockout and accepts the rescue wrap. ${rescueResolution.text}${trustNotes.length ? ` ${trustNotes.join(" ")}` : ""}`;
    this.log.push(text);
    this.gameState.finishBattle(text, rescueResolution.dialogue);
    return { log: [text], finished: true, winner: "player" };
  }

  private performCalmSignal(): BattleActionResult {
    if (this.type !== "wild" || (!this.allowCapture && !this.rescueEncounter)) {
      return { log: ["This signal is for wild rescue encounters."], finished: false };
    }

    this.calmSignals += 1;
    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    const originBondNote =
      memoryRead?.elementMatch && !this.originCalmSignalBondGranted
        ? this.gameState.grantActiveOriginCalmSignalBond()
        : undefined;
    const promiseBondNote =
      promiseStrength > 0 && !this.promiseCalmSignalBondGranted
        ? this.gameState.grantActiveRescuePromiseCalmSignalBond()
        : undefined;
    if (originBondNote) {
      this.originCalmSignalBondGranted = true;
    }
    if (promiseBondNote) {
      this.promiseCalmSignalBondGranted = true;
    }
    const playerState = this.ensureBattleState(this.playerActive);
    const enemyState = this.ensureBattleState(this.enemyActive);
    playerState.guardMultiplier = Math.min(playerState.guardMultiplier ?? 1, 0.82);
    if (memoryRead?.elementMatch) {
      playerState.focusMultiplier = Math.max(playerState.focusMultiplier ?? 1, 1.28);
    }
    const refreshedSpentPulse = this.lastCaptureAttemptLevel >= 0;
    if (refreshedSpentPulse) {
      enemyState.exposureCount = (enemyState.exposureCount ?? 0) + 1;
    }
    if (promiseStrength > 0) {
      enemyState.exposedMultiplier = Math.max(
        enemyState.exposedMultiplier ?? 1,
        promiseStrength >= 2 ? 1.26 : 1.16,
      );
      enemyState.exposureCount = (enemyState.exposureCount ?? 0) + 1;
      this.promiseSignalHoldTurns = Math.max(this.promiseSignalHoldTurns, 1);
    }
    if (this.rescueEncounter) {
      this.advanceBattleGoal("useGuard");
    }
    this.presentationEvents.push({
      type: "support",
      side: "player",
      targetSide: "player",
      moveName: "Calm Signal",
      effectType: "guard",
    });
    this.presentationEvents.push({
      type: "tempoShift",
      side: "enemy",
      label: "Signal read",
      cue: "The wild line hesitates instead of bolting",
      tint: 0xc8e5d7,
    });
    if (memoryRead?.elementMatch) {
      this.presentationEvents.push({
        type: "tempoShift",
        side: "player",
        label: "Origin focus",
        cue: `${this.playerActive.nickname}'s rescue memory answers the call`,
        tint: 0xf6d58f,
      });
    }
    if (promiseStrength > 0) {
      this.presentationEvents.push({
        type: "tempoShift",
        side: "enemy",
        label: promiseStrength >= 2 ? "Origin promise" : "Rescue promise",
        cue:
          promiseStrength >= 2
            ? "The promised route line opens into a clear rescue window"
            : "The promised route line gives the target a softer opening",
        tint: promiseStrength >= 2 ? 0xf6d58f : 0xc8e5d7,
      });
    }
    if (refreshedSpentPulse) {
      this.presentationEvents.push({
        type: "tempoShift",
        side: "enemy",
        label: "Fresh read",
        cue: "The spent rescue opening is readable again",
        tint: 0xc8e5d7,
      });
    }

    const memoryLine = memoryRead?.elementMatch
      ? ` ${this.playerActive.nickname}'s origin memory answers the signal and focuses the next strike.`
      : memoryRead
        ? ` ${this.playerActive.nickname}'s rescue memory keeps the line braced.`
        : "";
    const originBondLine = originBondNote ? ` ${originBondNote}` : "";
    const promiseBondLine = promiseBondNote ? ` ${promiseBondNote}` : "";
    const refreshedPulseLine = refreshedSpentPulse
      ? " The signal refreshes the spent pulse read, so the next rescue attempt can use this calmer opening."
      : "";
    const promiseLine =
      promiseStrength >= 2
        ? " The origin promise answers the signal and opens the target for a steadier rescue pulse."
        : promiseStrength === 1
          ? " The rescue promise answers the signal and gives the target a small exposed opening."
          : "";
    const text =
      `${this.playerActive.nickname} lowers the field wrap and gives ${speciesDex[this.enemyActive.speciesId].name} a calmer read. ` +
      (this.rescueEncounter
        ? `The sanctuary lesson reads that as a protective hold, and the next trust pulse should be steadier.${memoryLine}${originBondLine}${promiseBondLine}${refreshedPulseLine}${promiseLine} The frightened Vivo still gets a turn.`
        : `The next rescue pulse should hold more cleanly, but the wild Vivo still gets a turn.${memoryLine}${originBondLine}${promiseBondLine}${refreshedPulseLine}${promiseLine}`);
    this.log.push(text);
    const retaliation = this.performEnemyOnlyTurn();
    retaliation.log.unshift(text);
    return retaliation;
  }

  private attemptRetreat(): BattleActionResult {
    if (this.type !== "wild") {
      return { log: ["Trainer battles will not let your line retreat."], finished: false };
    }

    const retreat = this.getRetreatReadiness();
    if (Math.random() <= retreat.chance) {
      if (this.rescueEncounter) {
        this.gameState.clearActiveRescueEncounter();
      }
      const aftermath = this.gameState.recordWildEncounterAftermath("calmedRetreat", {
        targetName: speciesDex[this.enemyActive.speciesId].name,
        rescueRead: `${retreat.label} retreat at ${Math.round(retreat.chance * 100)}%`,
        openingNote: this.getRouteReadDebriefNote(),
      });
      const text =
        this.rescueEncounter
          ? `You back the line away carefully and give the frightened Vivo space. The rescue can be attempted again once your team is steadier.${aftermath ? ` ${aftermath}` : ""}`
          : `You slip out of the wild surge and return to the route before the line breaks.${aftermath ? ` ${aftermath}` : ""}`;
      this.log.push(text);
      this.gameState.finishBattle(text);
      return { log: [text], finished: true, winner: "player" };
    }

    const failureText =
      retreat.label === "tight"
        ? "The wild Vivo cuts off the escape lane and presses the line back into battle."
        : "Your line hesitates on the retreat and the wild Vivo surges to punish it.";
    this.log.push(failureText);
    const retaliation = this.performEnemyOnlyTurn();
    retaliation.log.unshift(failureText);
    return retaliation;
  }

  private performSwitch(index: number): BattleActionResult {
    const previousLeadId = this.playerActive.id;
    const wasForced = this.pendingForcedSwitch;
    const message = this.gameState.switchLead(index);
    const switched = this.playerActive.id !== previousLeadId;
    this.log.push(message);
    if (!switched) {
      this.gameState.renderHud();
      return { log: [message], finished: false };
    }
    if (switched) {
      this.presentationEvents.push({
        type: "switch",
        side: "player",
        vivoName: this.playerActive.nickname,
        forced: wasForced,
      });
      const fieldNote = this.tryApplySwitchGuard(this.playerActive);
      if (fieldNote) {
        this.log.push(fieldNote);
      }
      const memoryHandoffNote = this.tryApplyRescueMemoryHandoff(this.playerActive);
      if (memoryHandoffNote) {
        this.log.push(memoryHandoffNote);
      }
    }
    this.playerParticipants.add(this.playerActive.id);
    if (!wasForced) {
      this.advanceBattleGoal("switchParty");
    }
    if (wasForced) {
      this.pendingForcedSwitch = false;
      this.gameState.renderHud();
      return { log: [message], finished: false };
    }
    const retaliation = this.performEnemyOnlyTurn();
    retaliation.log.unshift(message);
    return retaliation;
  }

  private performEnemyOnlyTurn(): BattleActionResult {
    const enemy = this.enemyActive;
    const player = this.playerActive;
    if (enemy.currentHp <= 0) {
      return { log: [], finished: false };
    }

    const suppressWildRetreat = this.promiseSignalHoldTurns > 0;
    if (suppressWildRetreat) {
      this.promiseSignalHoldTurns -= 1;
    }
    const promisePinRead = suppressWildRetreat ? this.getPromisePinRead(enemy, player) : undefined;
    const decision = this.chooseEnemyAction(enemy, player, suppressWildRetreat);
    if (decision.type === "retreat") {
      return this.performEnemyRetreat(decision.summary);
    }

    const log =
      decision.type === "switch"
        ? this.performEnemySwitch(decision.targetIndex, decision.summary)
        : this.resolveMove(enemy, player, decision.move);
    if (promisePinRead) {
      log.unshift(promisePinRead.log);
      this.presentationEvents.unshift({
        type: "tempoShift",
        side: "enemy",
        label: promisePinRead.label,
        cue: promisePinRead.cue,
        tint: promisePinRead.tint,
      });
    }
    if (decision.type === "switch") {
      this.enemySwitchLock = true;
    } else if (this.enemySwitchLock) {
      this.enemySwitchLock = false;
    }
    this.log.push(...log);
    return this.resolveBattleEnd(log);
  }

  private getPromisePinRead(
    enemy: VivoInstance,
    player: VivoInstance,
  ): { label: string; cue: string; tint: number; log: string } | undefined {
    const threatenedRetreat = this.chooseWildRetreat(enemy, player, true);
    if (!threatenedRetreat) {
      return undefined;
    }

    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    if (promiseStrength >= 2) {
      return {
        label: "Origin promise pin",
        cue: "The origin promise holds the wild Vivo in the exchange",
        tint: 0xf6d58f,
        log: "The origin promise pins the bolt pressure for one beat, keeping the wild Vivo in reach after Calm Signal.",
      };
    }

    return {
      label: "Rescue promise pin",
      cue: "The rescue promise holds the wild Vivo in the exchange",
      tint: 0xc8e5d7,
      log: "The rescue promise pins the bolt pressure for one beat, keeping the wild Vivo from breaking immediately after Calm Signal.",
    };
  }

  private resolveBattleEnd(log: string[]): BattleActionResult {
    const player = this.playerActive;
    const enemy = this.enemyActive;

    if (enemy.currentHp <= 0) {
      this.advanceBattleGoalFromKnockout(enemy);
      if (this.type === "trainer" && this.trainer) {
        this.deferTrainerReward(enemy, player);
      } else {
        this.gameState.markVictoryAgainstElement(player, enemy.element);
        log.push(...this.distributeImmediateBattleExperience(enemy, player));
      }

      if (this.enemyTeam.length > 1) {
        this.enemyTeam.shift();
        this.presentationEvents.push({
          type: "switch",
          side: "enemy",
          vivoName: this.enemyActive.nickname,
          forced: true,
        });
        this.log.push(...log, `${speciesDex[this.enemyActive.speciesId].name} enters the field.`);
        this.gameState.renderHud();
        return { log, finished: false };
      }

      if (this.type === "trainer" && this.trainer) {
        if (!this.areBattleGoalsComplete()) {
          const practiceNotes = this.distributeDeferredTrainerRewards("practice");
          log.push(...practiceNotes);
          const retryText = `${this.trainer.name} calls the lesson unfinished. ${this.describeMissingBattleGoals()} You won the spar, but Briar's gate stays shut until the tactic is proven in one clean run.`;
          const retryDialogue = [
            {
              speaker: this.trainer.name,
              text: `Power is not the lesson. ${this.describeMissingBattleGoals()} Show me that, and the route will open.`,
            },
          ];
          if (practiceNotes.length > 0) {
            retryDialogue.push({
              speaker: "Field Note",
              text: "The spar still sharpens the line a little, but the sanctuary will only count full route growth once the lesson itself holds cleanly.",
            });
          }
          this.gameState.recordTrainerBattleDebrief(
            this.createTrainerBattleDebrief(
              "practice",
              retryText,
              `Return to ${this.gameState.currentScene.name} and prove the missing lesson points in one clean win.`,
            ),
          );
          this.log.push(retryText);
          this.gameState.finishBattle(retryText, retryDialogue);
          return { log: [...log, retryText], finished: true, winner: "player" };
        }

        log.push(...this.distributeDeferredTrainerRewards("full"));
        this.gameState.recordTrainerBattleDebrief(
          this.createTrainerBattleDebrief(
            "full",
            `${this.trainer.name}'s lesson held cleanly and the sanctuary counted the route growth.`,
            this.trainer.rewardText,
          ),
        );
        this.gameState.markTrainerDefeated(this.trainer.id);
        const rewardNotes = [this.trainer.rewardText];
        const rewardDialogue =
          this.trainer.rewardDialogue ?? [{ speaker: this.trainer.name, text: this.trainer.rewardText }];

        if (this.trainer.rewardVivo) {
          const rescuedSpecies = speciesDex[this.trainer.rewardVivo.speciesId];
          const rosterMessage = this.gameState.awardTrainerRewardVivo(this.trainer.rewardVivo);
          rewardNotes.push(
            `${rescuedSpecies.name} is released from the patrol harness. ${rosterMessage}`,
          );
        }

        const text = rewardNotes.join(" ");
        this.log.push(...rewardNotes);
        this.gameState.finishBattle(
          text,
          this.trainer.rewardVivo
            ? [
                ...rewardDialogue,
                {
                  speaker: "Field Note",
                  text: rewardNotes[rewardNotes.length - 1],
                },
              ]
            : rewardDialogue,
        );
        return { log: [...log, ...rewardNotes], finished: true, winner: "player" };
      }

      if (this.rescueEncounter) {
        if (!this.areBattleGoalsComplete()) {
          const retryText =
            this.rescueEncounter.retryText ??
            `${speciesDex[enemy.speciesId].name} yields for a breath, then slips back into cover. ${this.describeMissingBattleGoals()} The rescue can be attempted again once your line proves it can calm the whole exchange.`;
          this.gameState.clearActiveRescueEncounter();
          this.log.push(retryText);
          this.gameState.finishBattle(
            retryText,
            this.rescueEncounter.retryDialogue ?? [
              {
                speaker: "Field Note",
                text: retryText,
              },
            ],
          );
          return { log: [...log, retryText], finished: true, winner: "player" };
        }
        const rescueResolution = this.gameState.resolveActiveRescueEncounter("battleYield");
        if (!rescueResolution) {
          return { log, finished: true, winner: "player" };
        }
        this.log.push(rescueResolution.text);
        this.gameState.finishBattle(rescueResolution.text, rescueResolution.dialogue);
        return { log: [...log, rescueResolution.text], finished: true, winner: "player" };
      }

      const aftermath = this.gameState.recordWildEncounterAftermath("wildDefeat", {
        targetName: speciesDex[enemy.speciesId].name,
        openingNote: this.getRouteReadDebriefNote(),
      });
      const text = `${player.nickname} held the line and returned from the encounter stronger.${aftermath ? ` ${aftermath}` : ""}`;
      this.gameState.finishBattle(text);
      return { log: [...log, text], finished: true, winner: "player" };
    }

    if (player.currentHp <= 0) {
      const replacementIndex = this.getHealthyReplacementIndex();
      if (replacementIndex !== undefined) {
        const text = `${player.nickname} can no longer battle. Choose another bonded Vivo to continue.`;
        this.pendingForcedSwitch = true;
        this.log.push(text);
        this.gameState.renderHud();
        return { log: [...log, text], finished: false };
      }
      const recoveryAnchor = this.gameState.returnPartyToRecoveryAnchor();
      const text = `${player.nickname} is overwhelmed and the whole party falls back. The sanctuary route guide carries everyone to ${recoveryAnchor.label} in ${recoveryAnchor.sceneName} to recover.`;
      if (this.type === "trainer" && this.trainer) {
        this.gameState.recordTrainerBattleDebrief(
          this.createTrainerBattleDebrief(
            "defeat",
            `${this.trainer.name}'s pressure broke the line before the lesson was proven.`,
            `Recover at ${recoveryAnchor.label}, then return with a healthier bench and the missing tactic ready.`,
          ),
        );
      }
      if (this.type === "wild") {
        const aftermath = this.gameState.recordWildEncounterAftermath("partyBreak", {
          targetName: speciesDex[enemy.speciesId].name,
          openingNote: this.getRouteReadDebriefNote(),
        });
        const resultText = aftermath ? `${text} ${aftermath}` : text;
        this.gameState.finishBattle(resultText);
        return { log: [...log, resultText], finished: true, winner: "enemy" };
      }
      this.gameState.finishBattle(text);
      return { log: [...log, text], finished: true, winner: "enemy" };
    }

    this.gameState.renderHud();
    return { log, finished: false };
  }

  private chooseEnemyAction(
    attacker: VivoInstance,
    defender: VivoInstance,
    suppressWildRetreat = false,
  ): EnemyDecision {
    const switchDecision = this.chooseEnemySwitch(attacker, defender);
    if (switchDecision) {
      return switchDecision;
    }

    const retreatDecision = suppressWildRetreat ? undefined : this.chooseWildRetreat(attacker, defender, false);
    if (retreatDecision) {
      return retreatDecision;
    }

    return {
      type: "move",
      move: this.selectEnemyMove(attacker, defender, false) ?? moveDex[attacker.knownMoveIds[0]],
    };
  }

  private selectEnemyMove(
    attacker: VivoInstance,
    defender: VivoInstance,
    deterministic: boolean,
  ): MoveDefinition | undefined {
    const moves = attacker.knownMoveIds.map((moveId) => moveDex[moveId]);
    if (moves.length === 0) {
      return undefined;
    }
    const tactics = this.trainer?.tactics;
    const attackerState = this.ensureBattleState(attacker);
    const defenderState = this.ensureBattleState(defender);
    const hpRatio = attacker.currentHp / this.gameState.getMaxHp(attacker);
    const scoredMoves = moves.map((move) => ({
      move,
      score: move.kind === "support"
        ? this.scoreSupportMove(move, attacker, defender, hpRatio, attackerState, defenderState)
        : this.scoreAttackMove(move, attacker, defender),
    }));
    scoredMoves.sort((left, right) => right.score - left.score);

    if (!tactics) {
      const topScore = scoredMoves[0]?.score ?? 0;
      const closeMoves = scoredMoves.filter((entry) => entry.score >= topScore - 2);
      if (deterministic) {
        return closeMoves[0]?.move ?? moves[0];
      }
      return closeMoves[Math.floor(Math.random() * closeMoves.length)]?.move ?? moves[0];
    }

    if (tactics.style === "steady") {
      return scoredMoves[0]?.move ?? moves[0];
    }

    if (tactics.style === "opportunist") {
      const finisher = scoredMoves.find((entry) => entry.move.kind === "attack" && entry.score >= 30);
      return finisher?.move ?? scoredMoves[0]?.move ?? moves[0];
    }

    const preferredFinisher =
      tactics.preferredFinisherSpeciesId === attacker.speciesId
        ? scoredMoves.find((entry) => entry.move.kind === "attack")
        : undefined;
    return preferredFinisher?.move ?? scoredMoves[0]?.move ?? moves[0];
  }

  private resolveSupportMove(attacker: VivoInstance, defender: VivoInstance, move: MoveDefinition): string[] {
    if (Math.random() > move.accuracy || !move.supportEffect) {
      return [`${attacker.nickname}'s ${move.name} fizzled.`];
    }

    const effectTarget = move.supportEffect.target === "self" ? attacker : defender;
    const state = this.ensureBattleState(effectTarget);
    this.presentationEvents.push({
      type: "support",
      side: attacker === this.playerActive ? "player" : "enemy",
      targetSide: effectTarget === this.playerActive ? "player" : "enemy",
      moveName: move.name,
      effectType: move.supportEffect.type,
    });
    switch (move.supportEffect.type) {
      case "guard":
        state.guardMultiplier = move.supportEffect.shieldMultiplier;
        if (attacker === this.playerActive) {
          this.advanceBattleGoal("useGuard");
        }
        return [
          `${attacker.nickname} used ${move.name}. The next hit will be cushioned.`,
          ...this.tryTriggerStillwaterLungs(attacker),
        ];
      case "focus":
        state.focusMultiplier = move.supportEffect.powerMultiplier + this.getFieldFocusBonus(move);
        if (attacker === this.playerActive) {
          this.advanceBattleGoal("useFocus");
        }
        return [
          `${attacker.nickname} used ${move.name}. Its next attack is sharpened.${this.isFieldFocusBoosted(move) ? ` ${this.fieldCondition?.name} carries the setup further.` : ""}`,
        ];
      case "expose":
        state.exposedMultiplier = move.supportEffect.damageMultiplier;
        state.exposureCount = (state.exposureCount ?? 0) + 1;
        return [
          `${attacker.nickname} used ${move.name}. ${defender.nickname} is left exposed.`,
          ...this.tryTriggerRootedShelter(attacker),
        ];
    }
  }

  private getForecastEnemyDecision(): EnemyDecision {
    const attacker = this.enemyActive;
    const defender = this.playerActive;
    const switchDecision = this.chooseEnemySwitch(attacker, defender);
    if (switchDecision) {
      return switchDecision;
    }

    const retreatDecision = this.chooseWildRetreat(attacker, defender, true);
    if (retreatDecision) {
      return retreatDecision;
    }

    return {
      type: "move",
      move: this.selectEnemyMove(attacker, defender, true) ?? moveDex[attacker.knownMoveIds[0]],
    };
  }

  private getMoveForecast(move: MoveDefinition, enemyDecision: EnemyDecision): ActionForecast {
    const player = this.playerActive;
    const enemy = this.enemyActive;
    const playerTempo = this.gameState.getSpeed(player) + this.getMoveTempoBonus(player, enemy, move);

    if (enemyDecision.type === "switch") {
      const incoming = this.enemyTeam[enemyDecision.targetIndex];
      const chips: ForecastChip[] = [
        { label: "Counter-switch", tone: "caution" },
        { label: "Acts after swap", tone: "risk" },
      ];
      const goalForecast = this.getBattleGoalForecastForMove(move, incoming);
      chips.push(...goalForecast.chips);

      if (move.kind === "attack") {
        const swappedDamage = this.estimateProjectedAttackDamage(move, player, incoming);
        const fieldForecast = this.getFieldMoveForecast(move);
        chips.push(...fieldForecast.chips);
        chips.push({ label: `~${swappedDamage} dmg`, tone: "steady" });
        return {
          chips,
          detail: `${this.describeMove(move)} Expect ${incoming.nickname} to enter first; the strike then lands into the new line.${fieldForecast.detail ? ` ${fieldForecast.detail}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
        };
      }

      return {
        chips,
        detail: `${this.describeMove(move)} The setup lands after ${incoming.nickname} takes the field, so the next exchange changes shape first.${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
      };
    }

    if (enemyDecision.type === "retreat") {
      const actsFirst = playerTempo >= this.gameState.getSpeed(enemy) + 1800;
      const chips: ForecastChip[] = [
        { label: actsFirst ? "Acts first" : "Acts second", tone: actsFirst ? "good" : "risk" },
        {
          label: `${Math.round(enemyDecision.chance * 100)}% bolt`,
          tone: enemyDecision.chance >= 0.58 ? "risk" : "caution",
        },
      ];

      if (move.kind === "attack") {
        const estimatedDamage = this.estimateProjectedAttackDamage(move, player, enemy);
        const canFinish = estimatedDamage >= enemy.currentHp;
        const fieldForecast = this.getFieldMoveForecast(move);
        chips.push(...fieldForecast.chips);
        chips.push({
          label: canFinish ? "Stop escape" : `~${estimatedDamage} dmg`,
          tone: canFinish ? "good" : "steady",
        });
        return {
          chips,
          detail: actsFirst
            ? `${this.describeMove(move)} The target looks ready to bolt, but this line should land before it can run.${canFinish ? " If the estimate holds, the escape ends here." : ""}${fieldForecast.detail ? ` ${fieldForecast.detail}` : ""}`
            : `${this.describeMove(move)} The target looks ready to bolt and may break away before this line lands.${fieldForecast.detail ? ` ${fieldForecast.detail}` : ""}`,
        };
      }

      return {
        chips,
        detail: actsFirst
          ? `${this.describeMove(move)} The setup should land first, but the target may still flee immediately after if it survives.`
          : `${this.describeMove(move)} This setup risks giving the target room to bolt before you land another clean hit.`,
      };
    }

    const enemyMove = enemyDecision.move;
    const enemyTempo =
      this.gameState.getSpeed(enemy) + this.getMoveTempoBonus(enemy, player, enemyMove);
    const actsFirst = playerTempo >= enemyTempo;
    const chips: ForecastChip[] = [
      { label: actsFirst ? "Acts first" : "Acts second", tone: actsFirst ? "good" : "risk" },
    ];

    if (move.kind === "attack") {
      const estimatedDamage = this.estimateProjectedAttackDamage(move, player, enemy);
      const effectiveness = this.getEffectiveness(move.element, enemy);
      const fieldForecast = this.getFieldMoveForecast(move);
      const enemyReply =
        enemyMove.kind === "attack"
          ? this.estimateProjectedAttackDamage(enemyMove, enemy, player)
          : undefined;
      const canFinish = estimatedDamage >= enemy.currentHp;
      const traitForecast = this.getTraitCounterForecastForMove(move, enemy, canFinish);

      chips.push({
        label: canFinish ? "Finisher" : `~${estimatedDamage} dmg`,
        tone: canFinish ? "good" : effectiveness >= 1.2 ? "good" : "steady",
      });
      chips.push({
        label:
          effectiveness >= 1.2 ? "Strong hit" : effectiveness <= 0.85 ? "Blunted hit" : "Even hit",
        tone: effectiveness >= 1.2 ? "good" : effectiveness <= 0.85 ? "caution" : "steady",
      });
      const goalForecast = this.getBattleGoalForecastForMove(move, enemy, estimatedDamage);
      chips.push(...fieldForecast.chips);
      chips.push(...traitForecast.chips);
      chips.push(...goalForecast.chips);

      const replyText = canFinish
        ? "If the estimate holds, the target should not answer back."
        : enemyMove.kind === "attack" && enemyReply !== undefined
          ? `Likely answer: ${enemyMove.name} for about ${enemyReply} damage.`
          : `Likely answer: ${enemyMove.name} to ${this.describeSupportEffect(enemyMove.supportEffect!)}.`;

      return {
        chips,
        detail: `${this.describeMove(move)} ${replyText}${fieldForecast.detail ? ` ${fieldForecast.detail}` : ""}${traitForecast.detail ? ` ${traitForecast.detail}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
      };
    }

    const incomingDamage =
      enemyMove.kind === "attack"
        ? this.estimateProjectedAttackDamage(enemyMove, enemy, player)
        : undefined;
    const goalForecast = this.getBattleGoalForecastForMove(move, enemy);
    switch (move.supportEffect?.type) {
      case "guard": {
        const guardedDamage =
          enemyMove.kind === "attack"
            ? this.estimateProjectedAttackDamage(enemyMove, enemy, player, {
                defenderGuardMultiplier: move.supportEffect.shieldMultiplier,
              })
            : undefined;
        chips.push({ label: "Brace", tone: "good" });
        chips.push(...goalForecast.chips);
        if (guardedDamage !== undefined) {
          chips.push({
            label: actsFirst ? `${incomingDamage}->${guardedDamage}` : `~${incomingDamage} in`,
            tone: actsFirst ? "good" : "risk",
          });
        }
        return {
          chips,
          detail:
            enemyMove.kind === "attack" && guardedDamage !== undefined
              ? actsFirst
                ? `${this.describeMove(move)} It should cushion ${enemyMove.name} from about ${incomingDamage} down to ${guardedDamage}.${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`
                : `${this.describeMove(move)} ${enemyMove.name} likely lands for about ${incomingDamage} before the guard is up.${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`
              : `${this.describeMove(move)} Expect the next exchange to be safer once the guard settles.${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
        };
      }
      case "focus":
        const fieldForecast = this.getFieldMoveForecast(move);
        chips.push({ label: "Prime burst", tone: "good" });
        chips.push(...fieldForecast.chips);
        chips.push(...goalForecast.chips);
        if (incomingDamage !== undefined) {
          chips.push({ label: `~${incomingDamage} back`, tone: actsFirst ? "caution" : "risk" });
        }
        return {
          chips,
          detail:
            incomingDamage !== undefined
              ? `${this.describeMove(move)} It loads the next strike, then likely invites ${enemyMove.name} for about ${incomingDamage} damage.${fieldForecast.detail ? ` ${fieldForecast.detail}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`
              : `${this.describeMove(move)} It loads a stronger follow-up without spending the turn on raw damage.${fieldForecast.detail ? ` ${fieldForecast.detail}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
        };
      case "expose":
        chips.push({ label: "Open target", tone: "good" });
        chips.push(...goalForecast.chips);
        if (incomingDamage !== undefined) {
          chips.push({ label: `~${incomingDamage} back`, tone: actsFirst ? "caution" : "risk" });
        }
        return {
          chips,
          detail:
            incomingDamage !== undefined
              ? `${this.describeMove(move)} It marks the target for a heavier follow-up, then likely invites ${enemyMove.name} for about ${incomingDamage} damage.${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`
              : `${this.describeMove(move)} It does no damage now, but makes the next clean hit much harsher.${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
        };
    }

    return {
      chips: [...chips, ...goalForecast.chips],
      detail: `${this.describeMove(move)}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
    };
  }

  private getSwitchForecast(vivo: VivoInstance, enemyDecision: EnemyDecision): ActionForecast {
    const chips: ForecastChip[] = [];
    const goalForecast = this.getBattleGoalForecastForSwitch();
    chips.push(...goalForecast.chips);

    const fieldNote =
      this.fieldCondition?.effect.type === "switchGuard"
        ? `${this.fieldCondition.name} cushions the next hit after the handoff.`
        : undefined;
    const memoryRead =
      this.type === "wild" ? this.gameState.getActiveEncounterRescueMemoryReadForVivo(vivo) : undefined;
    const memoryNote = memoryRead
      ? memoryRead.elementMatch
        ? `${memoryRead.shortLabel} can catch this handoff as an origin-memory brace and focus.`
        : `${memoryRead.shortLabel} can catch this handoff as a rescue-memory brace.`
      : undefined;
    if (memoryRead) {
      chips.push({
        label: memoryRead.elementMatch ? "Origin handoff" : "Memory handoff",
        tone: "good",
      });
    }

    if (enemyDecision.type === "switch") {
      chips.push({ label: "Enemy swaps", tone: "caution" });
      if (fieldNote) {
        chips.push({ label: "Safe handoff", tone: "good" });
      }
      return {
        chips,
        detail: `Lv ${vivo.level} | ${vivo.element} | HP ${vivo.currentHp}/${this.gameState.getMaxHp(vivo)}. ${enemyDecision.summary}${fieldNote ? ` ${fieldNote}` : ""}${memoryNote ? ` ${memoryNote}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
      };
    }

    if (enemyDecision.type === "retreat") {
      chips.push({
        label: `${Math.round(enemyDecision.chance * 100)}% bolt`,
        tone: enemyDecision.chance >= 0.58 ? "risk" : "caution",
      });
      return {
        chips,
        detail: `Lv ${vivo.level} | ${vivo.element} | HP ${vivo.currentHp}/${this.gameState.getMaxHp(vivo)}. Switching here risks giving ${speciesDex[this.enemyActive.speciesId].name} the breathing room to flee before you can close the rescue window.${memoryNote ? ` ${memoryNote}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
      };
    }

    const enemyMove = enemyDecision.move;
    if (enemyMove.kind === "attack") {
      const incomingDamage = this.estimateProjectedAttackDamage(enemyMove, this.enemyActive, vivo, {
        defenderGuardMultiplier:
          this.fieldCondition?.effect.type === "switchGuard"
            ? this.fieldCondition.effect.guardMultiplier
            : undefined,
      });
      chips.push({
        label: `~${incomingDamage} in`,
        tone: incomingDamage >= vivo.currentHp * 0.6 ? "risk" : incomingDamage >= vivo.currentHp * 0.35 ? "caution" : "good",
      });
    } else {
      chips.push({ label: "Setup coming", tone: "steady" });
    }

    if (fieldNote) {
      chips.push({ label: "Safe handoff", tone: "good" });
    }

    const replyDetail =
      enemyMove.kind === "attack"
        ? `${enemyMove.name} likely meets the switch for about ${this.estimateProjectedAttackDamage(enemyMove, this.enemyActive, vivo, {
            defenderGuardMultiplier:
              this.fieldCondition?.effect.type === "switchGuard"
                ? this.fieldCondition.effect.guardMultiplier
                : undefined,
          })} damage.`
        : `${enemyMove.name} likely shapes the board before your new lead acts.`;

    return {
      chips,
      detail: `Lv ${vivo.level} | ${vivo.element} | HP ${vivo.currentHp}/${this.gameState.getMaxHp(vivo)}. ${replyDetail}${fieldNote ? ` ${fieldNote}` : ""}${memoryNote ? ` ${memoryNote}` : ""}${goalForecast.detail ? ` ${goalForecast.detail}` : ""}`,
    };
  }

  private getCaptureForecast(
    readiness:
      | {
          chance: number;
          label: string;
          summary: string;
          detail: string;
          level: number;
          exposureCount: number;
        }
      | undefined,
    enemyDecision: EnemyDecision,
  ): ActionForecast {
    if (!readiness) {
      return {
        chips: [{ label: "Unavailable", tone: "risk" }],
        detail: "Capture only opens in wild rescue battles.",
      };
    }

    const chips: ForecastChip[] = [
      {
        label: `${Math.round(readiness.chance * 100)}% hold`,
        tone: readiness.chance >= 0.6 ? "good" : readiness.chance >= 0.45 ? "caution" : "risk",
      },
      { label: readiness.label, tone: readiness.chance >= 0.6 ? "good" : "steady" },
    ];
    let detail = readiness.detail;
    const freshOpening = this.hasFreshCaptureOpening(readiness);
    if (!this.rescueEncounter || this.allowCapture) {
      chips.push({
        label: "Bullseye throw",
        tone: "caution",
      });
      detail = `${detail} The basic Rescue Capsule is manual: drag back, release, and hit the small bullseye on the Vivo before the capture pulse can even try to hold.`;
    }

    if (!freshOpening) {
      chips.push({
        label: "Opening spent",
        tone: "risk",
      });
      detail = `${detail} This exact opening has already been used; create a stronger HP read or a fresh exposed line before another pulse will hold.`;
    }

    if (this.calmSignals > 0) {
      chips.push({
        label: "Calmed read",
        tone: "good",
      });
    }

    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    if (memoryRead) {
      chips.push({
        label: memoryRead.elementMatch ? "Origin memory" : "Rescue memory",
        tone: "good",
      });
    }

    const fieldCallStrength = this.gameState.getActiveFieldCallStrength();
    if (fieldCallStrength > 0) {
      chips.push({
        label: fieldCallStrength >= 2 ? "Origin call" : "Field call",
        tone: "good",
      });
    }

    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    if (promiseStrength > 0) {
      chips.push({
        label: promiseStrength >= 2 ? "Origin promise" : "Rescue promise",
        tone: "good",
      });
    }

    if (this.rescueEncounter && !this.allowCapture) {
      const lessonComplete = this.areBattleGoalsComplete();
      const pulseReady = lessonComplete && readiness.label !== "resisting" && freshOpening;
      chips.push({
        label: lessonComplete ? "Lesson held" : "Lesson missing",
        tone: lessonComplete ? "good" : "risk",
      });
      chips.push({
        label: pulseReady ? "Pulse ready" : readiness.label === "resisting" ? "Needs wavering" : "Pulse locked",
        tone: pulseReady ? "good" : "risk",
      });
      detail = lessonComplete
        ? `${detail} The authored calming lesson is complete; a rescue pulse can end this encounter once the target is at least wavering and the opening is fresh.`
        : `${detail} The rescue pulse will not hold until the authored calming lesson is complete. ${this.describeMissingBattleGoals()}`;
    } else if (freshOpening) {
      chips.push({
        label: readiness.label === "resisting" ? "Chip first" : "Fresh pulse",
        tone: readiness.label === "resisting" ? "caution" : "good",
      });
    }

    if (enemyDecision.type === "retreat") {
      chips.push({
        label: enemyDecision.chance >= 0.58 ? "Now or never" : "May bolt",
        tone: enemyDecision.chance >= 0.58 ? "risk" : "caution",
      });
      detail = `${detail} ${speciesDex[this.enemyActive.speciesId].name} also looks ready to bolt if the pressure stays on.`;
    }

    return {
      chips,
      detail,
    };
  }

  private getCalmSignalForecast(): ActionForecast {
    const nextSignalCount = this.calmSignals + 1;
    const bonus = Math.round(Math.min(0.18, nextSignalCount * 0.09) * 100);
    const retreatHold = Math.round(Math.min(0.18, nextSignalCount * 0.09) * 100);
    const heldFieldCall = this.gameState.hasActiveHeldFieldCall();
    const fieldCallStrength = this.gameState.getActiveFieldCallStrength();
    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    const scriptedRescue = Boolean(this.rescueEncounter && !this.allowCapture);
    const heldFieldCallDetail = heldFieldCall
      ? fieldCallStrength >= 2
        ? " The held field call is already resonating with an origin memory."
        : " The held field call is already keeping this first exchange steadier."
      : "";
    const promiseDetail = promiseStrength
      ? promiseStrength >= 2
        ? " The origin promise can turn this calm signal into a clean exposed rescue opening."
        : " The rescue promise can turn this calm signal into a small exposed opening."
      : "";
    const spentPulseDetail =
      this.lastCaptureAttemptLevel >= 0
        ? " The last rescue pulse spent its opening; this signal will refresh the read so the next pulse can be attempted from the calmer state."
        : "";
    return {
      chips: [
        { label: `+${bonus}% hold`, tone: "good" },
        { label: scriptedRescue ? "Protective hold" : `-${retreatHold}% bolt`, tone: "steady" },
        ...(this.lastCaptureAttemptLevel >= 0
          ? [{ label: "Fresh read", tone: "good" as const }]
          : []),
        ...(scriptedRescue ? [{ label: "Counts as guard", tone: "good" as const }] : []),
        ...(heldFieldCall
          ? [{ label: fieldCallStrength >= 2 ? "Origin call" : "Field call held", tone: "good" as const }]
          : []),
        ...(memoryRead
          ? [{ label: memoryRead.elementMatch ? "Origin focus" : "Memory brace", tone: "good" as const }]
          : []),
        ...(memoryRead?.elementMatch && !this.originCalmSignalBondGranted
          ? [{ label: "Origin bond", tone: "good" as const }]
          : []),
        ...(promiseStrength
          ? [{ label: promiseStrength >= 2 ? "Promise opens" : "Promise nudge", tone: "good" as const }]
          : []),
        ...(promiseStrength && !this.promiseCalmSignalBondGranted
          ? [{ label: promiseStrength >= 2 ? "Origin promise bond" : "Promise bond", tone: "good" as const }]
          : []),
      ],
      detail:
        scriptedRescue
          ? `Spend a turn lowering the field wrap. The lead braces, guard-style rescue lessons advance, and the next trust pulse gets a calmer read.${spentPulseDetail}${memoryRead?.elementMatch ? " The matching origin memory will focus the lead's next strike and leave one bond mark if this battle has not already claimed it." : ""}${promiseStrength && !this.promiseCalmSignalBondGranted ? " The held rescue promise will also leave bond growth when the signal is spent carefully." : ""}${heldFieldCallDetail}${promiseDetail}${memoryRead ? ` ${memoryRead.detail}` : ""}`
          : `Spend a turn lowering the field wrap. The lead braces, capture odds improve for this encounter, and the wild Vivo is less likely to bolt from pressure.${spentPulseDetail}${memoryRead?.elementMatch ? " The matching origin memory will focus the lead's next strike and leave one bond mark if this battle has not already claimed it." : ""}${promiseStrength && !this.promiseCalmSignalBondGranted ? " The held rescue promise will also leave bond growth when the signal is spent carefully." : ""}${heldFieldCallDetail}${promiseDetail}${memoryRead ? ` ${memoryRead.detail}` : ""}`,
    };
  }

  private getRetreatForecast(
    readiness:
      | {
          chance: number;
          label: "clear" | "contested" | "tight";
          summary: string;
          detail: string;
        }
      | undefined,
  ): ActionForecast {
    if (!readiness) {
      return {
        chips: [{ label: "Unavailable", tone: "risk" }],
        detail: "Retreat only applies in wild encounters.",
      };
    }

    const supportContext = this.describeRetreatSupportContext();
    return {
      chips: [
        {
          label: `${Math.round(readiness.chance * 100)}% break`,
          tone: readiness.chance >= 0.6 ? "good" : readiness.chance >= 0.45 ? "caution" : "risk",
        },
        {
          label: readiness.label,
          tone: readiness.chance >= 0.6 ? "good" : readiness.label === "tight" ? "risk" : "steady",
        },
        ...supportContext.chips,
      ],
      detail: readiness.detail,
    };
  }

  private describeRetreatSupportContext(): {
    bonus: number;
    notes: string[];
    chips: ForecastChip[];
  } {
    const fieldBonus = this.fieldCondition?.effect.type === "captureCalm" ? 0.08 : 0;
    const calmBonus = Math.min(0.12, this.calmSignals * 0.06);
    const fieldCallStrength = this.gameState.getActiveFieldCallStrength();
    const fieldCallBonus = fieldCallStrength * 0.04;
    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    const memoryBonus = memoryRead ? (memoryRead.elementMatch ? 0.08 : 0.04) : 0;
    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    const promiseBonus = promiseStrength * 0.04;
    const habitatModifier = -this.gameState.getActiveEncounterRetreatModifier() * 0.45;
    const chips: ForecastChip[] = [];
    const notes: string[] = [];

    if (fieldBonus > 0) {
      chips.push({ label: "Calm board", tone: "good" });
      notes.push(`${this.fieldCondition?.name} gives the retreat line a softer edge.`);
    }

    if (calmBonus > 0) {
      chips.push({ label: "Calm Signal", tone: "good" });
      notes.push("Your Calm Signal keeps the exit from feeling like another panic break.");
    }

    if (fieldCallStrength > 0) {
      chips.push({
        label: fieldCallStrength >= 2 ? "Origin call" : "Field call",
        tone: "good",
      });
      notes.push(
        fieldCallStrength >= 2
          ? "The held origin call steadies the retreat more than a normal field call."
          : "The held field call leaves a cleaner way back to the route.",
      );
    }

    if (memoryRead) {
      chips.push({
        label: memoryRead.elementMatch ? "Origin memory" : "Rescue memory",
        tone: "good",
      });
      notes.push(
        memoryRead.elementMatch
          ? "The lead's origin memory recognizes the habitat pressure and helps peel away cleanly."
          : "The lead's rescue memory keeps the wild line readable while you back off.",
      );
    }

    if (promiseStrength > 0) {
      chips.push({
        label: promiseStrength >= 2 ? "Origin promise" : "Rescue promise",
        tone: "good",
      });
      notes.push(
        promiseStrength >= 2
          ? "The prior clean rescue left an origin promise that keeps the exit line readable."
          : "The prior clean rescue left a sanctuary promise that steadies this retreat.",
      );
    }

    if (habitatModifier > 0.01) {
      chips.push({ label: "Calm patch", tone: "good" });
      notes.push("The local habitat temper is calm enough to make a careful retreat easier.");
    } else if (habitatModifier < -0.01) {
      chips.push({ label: "Spooked patch", tone: "risk" });
      notes.push("The local habitat temper is fighting the retreat and wants to scatter.");
    }

    return {
      bonus: fieldBonus + calmBonus + fieldCallBonus + memoryBonus + promiseBonus + habitatModifier,
      notes,
      chips,
    };
  }

  private getMoveTempoBonus(attacker: VivoInstance, defender: VivoInstance, move: MoveDefinition): number {
    const priority = (move.priority ?? 0) + this.getTraitPriorityBonus(attacker, defender, move);
    return priority * 1000;
  }

  private getOpponentDisplayName(vivo: VivoInstance): string {
    const species = speciesDex[vivo.speciesId];
    if (vivo.formName && vivo.nickname === species.name) {
      return vivo.formName;
    }
    return vivo.nickname;
  }

  private getTraitPriorityBonus(attacker: VivoInstance, defender: VivoInstance, move: MoveDefinition): number {
    const trait = this.getBattleTrait(attacker);
    if (trait.id !== "cutlineRush" || move.kind !== "attack") {
      return 0;
    }

    const defenderState = this.ensureBattleState(defender);
    return defenderState.exposedMultiplier ? 1 : 0;
  }

  private getTraitAttackMultiplier(
    attacker: VivoInstance,
    defender: VivoInstance,
    move: MoveDefinition,
    focusMultiplier: number,
    exposedMultiplier: number,
  ): number {
    const trait = this.getBattleTrait(attacker);
    if (trait.id === "prismEcho" && move.attackStyle === "focus" && focusMultiplier > 1) {
      return 1.16;
    }

    if (trait.id === "cutlineRush" && move.kind === "attack" && exposedMultiplier > 1) {
      return 1.18;
    }

    return 1;
  }

  private applyAttackFollowUpEffects(
    attacker: VivoInstance,
    defender: VivoInstance,
    move: MoveDefinition,
    context: {
      targetWasGuarded: boolean;
      targetWasExposed: boolean;
      targetWasFocused: boolean;
    },
  ): string[] {
    if (!move.attackEffects?.length) {
      return [];
    }

    const notes: string[] = [];
    const attackerState = this.ensureBattleState(attacker);
    const defenderState = this.ensureBattleState(defender);
    const attackerSide = attacker === this.playerActive ? "player" : "enemy";
    const defenderSide = defender === this.playerActive ? "player" : "enemy";

    for (const effect of move.attackEffects) {
      switch (effect.type) {
        case "shatterFocus":
          if (!context.targetWasFocused) {
            break;
          }
          defenderState.focusMultiplier = undefined;
          if (effect.exposeMultiplier) {
            defenderState.exposedMultiplier = effect.exposeMultiplier;
            defenderState.exposureCount = (defenderState.exposureCount ?? 0) + 1;
          }
          this.presentationEvents.push({
            type: "tempoShift",
            side: defenderSide,
            label: "Focus shattered",
            cue: `${move.name} broke the prepared line`,
            tint: 0xf0b18d,
          });
          notes.push(`${move.name} shatters ${defender.nickname}'s prepared focus line into a fresh opening.`);
          break;
        case "crackGuard":
          if (!context.targetWasGuarded) {
            break;
          }
          defenderState.exposedMultiplier = effect.exposeMultiplier ?? 1.18;
          defenderState.exposureCount = (defenderState.exposureCount ?? 0) + 1;
          this.presentationEvents.push({
            type: "tempoShift",
            side: defenderSide,
            label: "Guard cracked",
            cue: `${move.name} opened the stance`,
            tint: 0xf0b18d,
          });
          notes.push(`${move.name} cracks the guarded stance and leaves ${defender.nickname} exposed.`);
          break;
        case "selfGuardOnExposedHit":
          if (!context.targetWasExposed) {
            break;
          }
          attackerState.guardMultiplier = Math.min(
            attackerState.guardMultiplier ?? 1,
            effect.guardMultiplier,
          );
          this.presentationEvents.push({
            type: "tempoShift",
            side: attackerSide,
            label: "Guard gathered",
            cue: `${move.name} reset the line`,
            tint: 0x8fc8b2,
          });
          notes.push(`${move.name} lets ${attacker.nickname} settle back behind a light guard.`);
          break;
        case "selfFocusOnHit":
          attackerState.focusMultiplier = Math.max(
            attackerState.focusMultiplier ?? 1,
            effect.powerMultiplier,
          );
          this.presentationEvents.push({
            type: "tempoShift",
            side: attackerSide,
            label: "Second burst primed",
            cue: `${move.name} loaded the next strike`,
            tint: 0xf6df9a,
          });
          notes.push(`${move.name} leaves ${attacker.nickname}'s next attack primed for a sharper burst.`);
          break;
      }
    }

    return notes;
  }

  private tryTriggerSanctuaryHeart(defender: VivoInstance): string[] {
    const trait = this.getBattleTrait(defender);
    if (trait.id !== "sanctuaryHeart" || this.triggeredTraitVivoIds.has(defender.id) || defender.currentHp <= 0) {
      return [];
    }

    const threshold = Math.floor(this.gameState.getMaxHp(defender) / 2);
    if (defender.currentHp > threshold) {
      return [];
    }

    const state = this.ensureBattleState(defender);
    state.guardMultiplier = Math.min(state.guardMultiplier ?? 1, 0.6);
    this.triggeredTraitVivoIds.add(defender.id);
    this.presentationEvents.push({
      type: "trait",
      side: defender === this.playerActive ? "player" : "enemy",
      traitName: trait.name,
      cue: "Guard caught",
      tint: 0x8fc8b2,
    });
    return [`${defender.nickname}'s ${trait.name} catches the line and braces the next hit.`];
  }

  private tryTriggerRootedShelter(attacker: VivoInstance): string[] {
    const trait = this.getBattleTrait(attacker);
    if (trait.id !== "rootedShelter" || this.triggeredTraitVivoIds.has(attacker.id)) {
      return [];
    }

    const maxHp = this.gameState.getMaxHp(attacker);
    const heal = Math.max(4, Math.round(maxHp * 0.18));
    const healed = Math.min(maxHp, attacker.currentHp + heal) - attacker.currentHp;
    if (healed <= 0) {
      return [];
    }

    attacker.currentHp += healed;
    this.triggeredTraitVivoIds.add(attacker.id);
    this.presentationEvents.push({
      type: "trait",
      side: attacker === this.playerActive ? "player" : "enemy",
      traitName: trait.name,
      cue: `+${healed} HP`,
      tint: 0x8fcf7a,
    });
    return [`${attacker.nickname}'s ${trait.name} settles its bark and recovers ${healed} HP.`];
  }

  private tryTriggerStillwaterLungs(attacker: VivoInstance): string[] {
    const trait = this.getBattleTrait(attacker);
    if (trait.id !== "stillwaterLungs" || this.triggeredTraitVivoIds.has(attacker.id)) {
      return [];
    }

    const state = this.ensureBattleState(attacker);
    state.focusMultiplier = Math.max(state.focusMultiplier ?? 1, 1.16);
    this.triggeredTraitVivoIds.add(attacker.id);
    this.presentationEvents.push({
      type: "trait",
      side: attacker === this.playerActive ? "player" : "enemy",
      traitName: trait.name,
      cue: "Next burst steadied",
      tint: 0xf0dda2,
    });
    return [`${attacker.nickname}'s ${trait.name} gathers a calmer luminous burst behind the guard.`];
  }

  private tryTriggerIronDefiance(
    defender: VivoInstance,
    attacker: VivoInstance,
    targetWasGuarded: boolean,
  ): string[] {
    const trait = this.getBattleTrait(defender);
    if (
      trait.id !== "ironDefiance" ||
      this.triggeredTraitVivoIds.has(defender.id) ||
      !targetWasGuarded ||
      defender.currentHp <= 0
    ) {
      return [];
    }

    const attackerState = this.ensureBattleState(attacker);
    attackerState.exposedMultiplier = Math.max(attackerState.exposedMultiplier ?? 1, 1.16);
    attackerState.exposureCount = (attackerState.exposureCount ?? 0) + 1;
    this.triggeredTraitVivoIds.add(defender.id);
    this.presentationEvents.push({
      type: "trait",
      side: defender === this.playerActive ? "player" : "enemy",
      traitName: trait.name,
      cue: "Counterline opened",
      tint: 0xc8d2dc,
    });
    this.presentationEvents.push({
      type: "tempoShift",
      side: attacker === this.playerActive ? "player" : "enemy",
      label: "Exposed",
      cue: `${defender.nickname}'s plates caught the hit`,
      tint: 0xf0b18d,
    });
    return [
      `${defender.nickname}'s ${trait.name} catches the guarded hit and leaves ${attacker.nickname} exposed.`,
    ];
  }

  private getBattleTrait(vivo: VivoInstance) {
    return this.gameState.getBattleTrait(vivo);
  }

  private ensureBattleState(vivo: VivoInstance): BattleTempoState {
    let state = this.battleStates.get(vivo.id);
    if (!state) {
      state = {};
      this.battleStates.set(vivo.id, state);
    }
    return state;
  }

  private applyInitialTempo(initialTempo: InitialTempoState) {
    this.primeTempoState(initialTempo.side, initialTempo.effects);
    this.log.push(initialTempo.log);

    const primaryEffect = initialTempo.effects.includes("exposed")
      ? "exposed"
      : initialTempo.effects.includes("focused")
        ? "focused"
        : initialTempo.effects.includes("guarded")
          ? "guarded"
          : undefined;
    if (!primaryEffect) {
      return;
    }

    const tint =
      primaryEffect === "guarded" ? 0x8fc8b2 : primaryEffect === "focused" ? 0xf6df9a : 0xe9967a;
    this.presentationEvents.push({
      type: "tempoShift",
      side: initialTempo.side,
      label: initialTempo.cueLabel ?? "Habitat opening",
      cue: initialTempo.log,
      tint,
    });
  }

  private primeTempoState(side: "player" | "enemy", effects: TempoEffectLabel[]) {
    const vivo = side === "player" ? this.playerActive : this.enemyActive;
    const state = this.ensureBattleState(vivo);
    state.guardMultiplier = undefined;
    state.focusMultiplier = undefined;
    state.exposedMultiplier = undefined;
    state.exposureCount = 0;

    for (const effect of effects) {
      switch (effect) {
        case "guarded":
          state.guardMultiplier = 0.55;
          break;
        case "focused":
          state.focusMultiplier = 1.25;
          break;
        case "exposed":
          state.exposedMultiplier = 1.35;
          state.exposureCount = Math.max(state.exposureCount ?? 0, 1);
          break;
      }
    }
  }

  getTempoEffects(vivo: VivoInstance): TempoEffectLabel[] {
    const state = this.ensureBattleState(vivo);
    const effects: TempoEffectLabel[] = [];
    if (state.guardMultiplier !== undefined) {
      effects.push("guarded");
    }
    if (state.focusMultiplier !== undefined) {
      effects.push("focused");
    }
    if (state.exposedMultiplier !== undefined) {
      effects.push("exposed");
    }
    return effects;
  }

  getEnemyIntentPreview(): EnemyIntentPreview {
    if (this.pendingForcedSwitch) {
      return {
        label: "Forced handoff",
        summary: `${this.playerActive.nickname} must leave the field before the enemy commits to another line.`,
        detail: "Send out a healthy backup to restore the battle rhythm.",
        stance: "warning",
      };
    }

    const attacker = this.enemyActive;
    const defender = this.playerActive;
    const switchDecision = this.getForecastEnemyDecision();
    if (switchDecision?.type === "switch") {
      const incoming = this.enemyTeam[switchDecision.targetIndex];
      return {
        label: "Counter-switch likely",
        summary: `${this.trainer?.name ?? speciesDex[attacker.speciesId].name} is poised to rotate into ${incoming.nickname}.`,
        detail: switchDecision.summary,
        stance: "warning",
      };
    }

    if (switchDecision?.type === "retreat") {
      return {
        label: switchDecision.chance >= 0.58 ? "Bolt likely" : "Wild line shaking",
        summary: `${speciesDex[attacker.speciesId].name} is looking for a gap to flee the encounter.`,
        detail: switchDecision.summary,
        stance: switchDecision.chance >= 0.58 ? "danger" : "warning",
      };
    }

    const plannedMove = this.selectEnemyMove(attacker, defender, true);
    if (!plannedMove) {
      return {
        label: "Field pressure",
        summary: "The opposing line is not telegraphing a clean action yet.",
        detail: "Expect the next exchange to settle once the matchup changes.",
        stance: "steady",
      };
    }

    if (this.type !== "trainer" || !this.trainer) {
      return {
        label: "Wild pressure",
        summary: `${speciesDex[attacker.speciesId].name} is leaning toward ${plannedMove.name}.`,
        detail: `${this.describeMoveThreat(plannedMove)} Wild Vivos can still break pattern if the exchange shifts.`,
        stance: this.classifyIntentStance(plannedMove, attacker, defender),
      };
    }

    return {
      label: "Likely line",
      summary: `${this.trainer.name} is setting up ${plannedMove.name} next.`,
      detail: this.describeMoveIntent(plannedMove, attacker, defender),
      stance: this.classifyIntentStance(plannedMove, attacker, defender),
    };
  }

  debugPrimeTempo(side: "player" | "enemy", effects: TempoEffectLabel[]) {
    this.primeTempoState(side, effects);
  }

  debugQueuePresentationEvents(events: BattlePresentationEvent[]) {
    this.presentationEvents.push(...events);
  }

  debugSetWildPressure(options: { enemyHp?: number; spookedByCapture?: boolean }) {
    const enemy = this.enemyActive;
    if (typeof options.enemyHp === "number") {
      enemy.currentHp = clamp(options.enemyHp, 1, this.gameState.getMaxHp(enemy));
    }
    if (options.spookedByCapture) {
      const readiness = this.getCaptureReadiness();
      this.lastCaptureAttemptLevel = readiness.level;
      this.lastCaptureExposureCount = readiness.exposureCount;
    }
  }

  private describeMove(move: MoveDefinition): string {
    if (move.kind === "support" && move.supportEffect) {
      return `${move.element} support | ${this.describeSupportEffect(move.supportEffect)} | ${move.description}`;
    }
    return `${move.element} ${move.attackStyle ?? "impact"} attack | Power ${move.power} | ${move.description}${this.describeAttackEffects(move)}`;
  }

  private describeSupportEffect(effect: SupportEffect): string {
    switch (effect.type) {
      case "guard":
        return "brace the next hit";
      case "focus":
        return "boost the next attack";
      case "expose":
        return "open the target to heavier damage";
    }
  }

  private describeAttackEffects(move: MoveDefinition): string {
    if (!move.attackEffects?.length) {
      return "";
    }

    const notes = move.attackEffects.map((effect) => {
      switch (effect.type) {
        case "shatterFocus":
          return "shatters focus into exposure";
        case "crackGuard":
          return "cracks guarded lines open";
        case "selfGuardOnExposedHit":
          return "regathers guard after a clean opening hit";
        case "selfFocusOnHit":
          return "primes the next burst on hit";
      }
    });

    return ` | ${notes.join("; ")}`;
  }

  private renderTempoMarkup(vivo: VivoInstance, label: string): string {
    const effects = this.getTempoEffects(vivo);
    const pillMarkup = effects.length
      ? effects
          .map(
            (effect) =>
              `<span class="battle-status-pill ${effect}">${this.formatTempoLabel(effect)}</span>`,
          )
          .join("")
      : `<span class="battle-status-pill idle">steady</span>`;
    return `
      <div class="battle-status-card">
        <p class="hud-label">${label}</p>
        <p class="hud-mini"><strong>${vivo.nickname}</strong></p>
        <div class="pill-row battle-pill-row">${pillMarkup}</div>
      </div>
    `;
  }

  private formatTempoLabel(effect: TempoEffectLabel): string {
    switch (effect) {
      case "guarded":
        return "Guard up";
      case "focused":
        return "Focus primed";
      case "exposed":
        return "Exposed";
    }
  }

  private getHealthyReplacementIndex(): number | undefined {
    const replacementIndex = this.gameState.party.findIndex(
      (vivo, index) => index > 0 && vivo.currentHp > 0,
    );
    return replacementIndex >= 0 ? replacementIndex : undefined;
  }

  private getBattleGoalForecastForMove(
    move: MoveDefinition,
    target: VivoInstance,
    estimatedDamage?: number,
  ): BattleGoalForecast {
    const pendingGoals = this.battleGoals.filter((goal) => goal.current < goal.definition.count);
    if (pendingGoals.length === 0) {
      return { chips: [] };
    }

    const chips: ForecastChip[] = [];
    const detailParts: string[] = [];
    const targetEffects = this.getTempoEffects(target);

    for (const goal of pendingGoals) {
      let progresses = false;
      switch (goal.definition.type) {
        case "useGuard":
          progresses = move.supportEffect?.type === "guard";
          break;
        case "useFocus":
          progresses = move.supportEffect?.type === "focus";
          break;
        case "switchParty":
          progresses = false;
          break;
        case "finishExposedTarget":
          progresses =
            move.kind === "attack" &&
            targetEffects.includes("exposed") &&
            (estimatedDamage ?? this.estimateProjectedAttackDamage(move, this.playerActive, target)) >=
              target.currentHp;
          break;
        case "landAttackStyle":
          progresses =
            move.kind === "attack" &&
            (move.attackStyle ?? "impact") === goal.definition.attackStyle;
          break;
        case "landElementAttack":
          progresses = move.kind === "attack" && move.element === goal.definition.element;
          break;
      }

      if (!progresses) {
        continue;
      }

      const clearsGoal = goal.current + 1 >= goal.definition.count;
      chips.push({
        label: clearsGoal ? "Lesson clear" : "Lesson +",
        tone: "good",
      });
      detailParts.push(
        clearsGoal
          ? `${goal.definition.label} should complete if this line lands.`
          : `${goal.definition.label} should advance to ${goal.current + 1}/${goal.definition.count}.`,
      );
    }

    return {
      chips,
      detail: detailParts.length > 0 ? detailParts.join(" ") : undefined,
    };
  }

  private getBattleGoalForecastForSwitch(): BattleGoalForecast {
    if (this.pendingForcedSwitch) {
      return {
        chips: [{ label: "Keep battle alive", tone: "good" }],
        detail: "A healthy backup is required to restore the line before the enemy can press again.",
      };
    }

    const switchGoal = this.battleGoals.find(
      (goal) => goal.current < goal.definition.count && goal.definition.type === "switchParty",
    );
    if (!switchGoal) {
      return { chips: [] };
    }

    const clearsGoal = switchGoal.current + 1 >= switchGoal.definition.count;
    return {
      chips: [{ label: clearsGoal ? "Lesson clear" : "Lesson +", tone: "good" }],
      detail: clearsGoal
        ? `${switchGoal.definition.label} should complete on this handoff.`
        : `${switchGoal.definition.label} should advance to ${switchGoal.current + 1}/${switchGoal.definition.count}.`,
    };
  }

  private advanceBattleGoal(type: BattleGoalDefinition["type"]) {
    for (const goal of this.battleGoals) {
      if (goal.definition.type !== type || goal.current >= goal.definition.count) {
        continue;
      }
      goal.current += 1;
      this.log.push(`Lesson held: ${goal.definition.label}.`);
      break;
    }
  }

  private advanceAttackGoals(move: MoveDefinition) {
    if (move.kind !== "attack") {
      return;
    }

    for (const goal of this.battleGoals) {
      if (goal.current >= goal.definition.count) {
        continue;
      }

      if (
        goal.definition.type === "landAttackStyle" &&
        goal.definition.attackStyle !== (move.attackStyle ?? "impact")
      ) {
        continue;
      }

      if (goal.definition.type === "landElementAttack" && goal.definition.element !== move.element) {
        continue;
      }

      if (goal.definition.type === "landAttackStyle" || goal.definition.type === "landElementAttack") {
        goal.current += 1;
        this.log.push(`Lesson held: ${goal.definition.label}.`);
        break;
      }
    }
  }

  private advanceBattleGoalFromKnockout(enemy: VivoInstance) {
    const enemyState = this.ensureBattleState(enemy);
    if ((enemyState.exposureCount ?? 0) <= 0) {
      return;
    }
    this.advanceBattleGoal("finishExposedTarget");
  }

  private areBattleGoalsComplete(): boolean {
    return this.battleGoals.every((goal) => goal.current >= goal.definition.count);
  }

  private describeMissingBattleGoals(): string {
    const remaining = this.battleGoals.filter((goal) => goal.current < goal.definition.count);
    if (remaining.length === 0) {
      return "The lesson held.";
    }

    return remaining.map((goal) => goal.definition.hint).join(" ");
  }

  private chooseEnemySwitch(attacker: VivoInstance, defender: VivoInstance): EnemyDecision | undefined {
    if (this.type !== "trainer" || !this.trainer?.tactics?.switchOnDisadvantage || this.enemySwitchLock) {
      return undefined;
    }

    if (this.enemyTeam.length <= 1) {
      return undefined;
    }

    const currentScore = this.scoreMatchup(attacker, defender);
    const hpRatio = attacker.currentHp / this.gameState.getMaxHp(attacker);
    const benchCandidates = this.enemyTeam
      .map((candidate, index) => ({ candidate, index }))
      .filter(({ index, candidate }) => index > 0 && candidate.currentHp > 0)
      .map(({ candidate, index }) => ({
        candidate,
        index,
        score: this.scoreMatchup(candidate, defender),
      }))
      .sort((left, right) => right.score - left.score);
    const bestBench = benchCandidates[0];
    if (!bestBench) {
      return undefined;
    }

    const trainerStyle = this.trainer.tactics.style;
    const threshold = trainerStyle === "adaptive" ? 6 : 9;
    const needsRelief = hpRatio <= 0.33;
    const badMatchup = currentScore + threshold < bestBench.score;
    const protectFinisher =
      this.trainer.tactics.preferredFinisherSpeciesId === attacker.speciesId && hpRatio <= 0.45;
    if (!needsRelief && !badMatchup && !protectFinisher) {
      return undefined;
    }

    const reason = protectFinisher
      ? `${this.trainer.name} pulls ${speciesDex[attacker.speciesId].name} back to preserve a cleaner finisher.`
      : `${this.trainer.name} changes formation and sends out ${speciesDex[bestBench.candidate.speciesId].name} for a better answer.`;

    return {
      type: "switch",
      targetIndex: bestBench.index,
      summary: reason,
    };
  }

  private chooseWildRetreat(
    attacker: VivoInstance,
    defender: VivoInstance,
    deterministic: boolean,
  ): EnemyDecision | undefined {
    if (this.type !== "wild" || this.rescueEncounter || !this.allowCapture) {
      return undefined;
    }

    const species = speciesDex[attacker.speciesId];
    const attackerState = this.ensureBattleState(attacker);
    const hpRatio = attacker.currentHp / this.gameState.getMaxHp(attacker);
    const exposureCount = attackerState.exposureCount ?? 0;
    const playerSpeed = this.gameState.getSpeed(defender);
    const enemySpeed = this.gameState.getSpeed(attacker);
    const speedPressure = playerSpeed > enemySpeed ? Math.min(0.12, (playerSpeed - enemySpeed) / 200) : 0;
    const failedPulsePressure = this.lastCaptureAttemptLevel >= 0 ? 0.08 : 0;
    const dispositionBias =
      species.wildDisposition === "flighty"
        ? 0.18
        : species.wildDisposition === "wary"
          ? 0.1
          : -0.08;

    const chance = clamp(
      0.06 +
        dispositionBias +
        (hpRatio <= 0.55 ? 0.14 : 0) +
        (hpRatio <= 0.32 ? 0.18 : 0) +
        exposureCount * 0.09 +
        speedPressure +
        failedPulsePressure -
        this.getCalmSignalRetreatPenalty() -
        this.getFieldRetreatPenalty() +
        this.gameState.getActiveEncounterRetreatModifier(),
      0,
      0.82,
    );

    if (chance < 0.34) {
      return undefined;
    }

    if (!deterministic && Math.random() >= chance) {
      return undefined;
    }

    const dispositionText =
      species.wildDisposition === "flighty"
        ? "The line looks panic-fast and ready to break for cover."
        : species.wildDisposition === "wary"
          ? "The line is reading for a safe escape lane."
          : "Even this usually steady line is starting to give ground.";
    const pressureText =
      hpRatio <= 0.32
        ? "It is badly weakened."
        : exposureCount > 0
          ? "The opening you created has it looking for a way out."
          : "The exchange is turning against it.";
    const captureText =
      this.lastCaptureAttemptLevel >= 0
        ? "The last rescue pulse also spooked it."
        : "";
    const fieldText =
      this.getFieldRetreatPenalty() > 0
        ? ` ${this.fieldCondition?.name} is keeping the reeds calmer than usual.`
        : "";
    const calmSignalText =
      this.getCalmSignalRetreatPenalty() > 0
        ? " Your calm signal is keeping it from bolting at the first opening."
        : "";
    const habitatText =
      this.gameState.getActiveEncounterRetreatModifier() > 0
        ? " The surrounding patch is already spooked and ready to scatter."
        : this.gameState.getActiveEncounterRetreatModifier() < 0
          ? " The surrounding patch is calm enough to hold the line a little longer."
          : "";
    const fieldCallStrength = this.gameState.getActiveFieldCallStrength();
    const fieldCallText =
      fieldCallStrength >= 2
        ? " The held origin call is slowing the break toward cover more than a normal field call."
        : fieldCallStrength > 0
          ? " The held field call is slowing the break toward cover."
          : "";
    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    const memoryText = memoryRead
      ? memoryRead.elementMatch
        ? " The lead's origin memory is suppressing the bolt pressure."
        : " The lead's rescue memory is helping the wild line stay readable."
      : "";
    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    const promiseText =
      promiseStrength >= 2
        ? " The last clean rescue left an origin promise that makes bolting less certain."
        : promiseStrength > 0
          ? " The last clean rescue left a sanctuary promise that steadies this wild line."
          : "";

    return {
      type: "retreat",
      chance,
      summary: `${pressureText} ${dispositionText}${captureText ? ` ${captureText}` : ""}${fieldText}${calmSignalText}${habitatText}${fieldCallText}${memoryText}${promiseText}`,
    };
  }

  private performEnemySwitch(index: number, summary: string): string[] {
    if (index <= 0 || index >= this.enemyTeam.length) {
      return [];
    }

    const [chosen] = this.enemyTeam.splice(index, 1);
    this.enemyTeam.unshift(chosen);
    this.presentationEvents.push({
      type: "switch",
      side: "enemy",
      vivoName: chosen.nickname,
      forced: false,
    });
    const fieldNote = this.tryApplySwitchGuard(chosen);
    return fieldNote ? [summary, fieldNote] : [summary];
  }

  private performEnemyRetreat(summary: string): BattleActionResult {
    const enemySpecies = speciesDex[this.enemyActive.speciesId];
    const aftermath = this.gameState.recordWildEncounterAftermath("wildRetreat", {
      targetName: enemySpecies.name,
      openingNote: this.getRouteReadDebriefNote(),
    });
    const text = `${enemySpecies.name} breaks from the encounter and disappears back into the habitat. ${summary}${aftermath ? ` ${aftermath}` : ""}`;
    this.presentationEvents.push({
      type: "switch",
      side: "enemy",
      vivoName: this.enemyActive.nickname,
      forced: false,
    });
    this.log.push(text);
    this.gameState.clearActiveRescueEncounter();
    this.gameState.finishBattle(text);
    return { log: [text], finished: true, winner: "enemy" };
  }

  private getFieldMoveForecast(move: MoveDefinition): ActionForecast {
    if (!this.fieldCondition) {
      return { chips: [], detail: "" };
    }

    if (move.kind === "attack" && this.isFieldAttackBoosted(move)) {
      return {
        chips: [{ label: this.fieldCondition.name, tone: "good" }],
        detail: `${this.fieldCondition.name} is already included in the damage estimate.`,
      };
    }

    if (move.kind === "support" && this.isFieldFocusBoosted(move)) {
      return {
        chips: [{ label: "Field focus", tone: "good" }],
        detail: `${this.fieldCondition.name} will carry that focus setup farther.`,
      };
    }

    return { chips: [], detail: "" };
  }

  private getTraitCounterForecastForMove(
    move: MoveDefinition,
    defender: VivoInstance,
    canFinish: boolean,
  ): ActionForecast {
    if (move.kind !== "attack" || canFinish) {
      return { chips: [], detail: "" };
    }

    const defenderTrait = this.getBattleTrait(defender);
    const defenderState = this.ensureBattleState(defender);
    if (
      defenderTrait.id !== "ironDefiance" ||
      this.triggeredTraitVivoIds.has(defender.id) ||
      !defenderState.guardMultiplier
    ) {
      return { chips: [], detail: "" };
    }

    return {
      chips: [{ label: "Iron Defiance", tone: "risk" }],
      detail: `${defender.nickname}'s guarded plates can answer this hit by exposing your lead.`,
    };
  }

  private tryApplySwitchGuard(vivo: VivoInstance): string | undefined {
    if (this.fieldCondition?.effect.type !== "switchGuard") {
      return undefined;
    }

    const state = this.ensureBattleState(vivo);
    state.guardMultiplier = Math.min(state.guardMultiplier ?? 1, this.fieldCondition.effect.guardMultiplier);
    return `${this.fieldCondition.name} steadies ${vivo.nickname} on the handoff and cushions the next hit.`;
  }

  private tryApplyRescueMemoryHandoff(vivo: VivoInstance): string | undefined {
    if (this.type !== "wild" || this.memoryHandoffVivoIds.has(vivo.id)) {
      return undefined;
    }

    const memoryRead = this.gameState.getActiveEncounterRescueMemoryReadForVivo(vivo);
    if (!memoryRead) {
      return undefined;
    }

    const state = this.ensureBattleState(vivo);
    state.guardMultiplier = Math.min(state.guardMultiplier ?? 1, 0.62);
    if (memoryRead.elementMatch) {
      state.focusMultiplier = Math.max(state.focusMultiplier ?? 1, 1.18);
    }
    this.memoryHandoffVivoIds.add(vivo.id);
    this.memoryHandoffDebriefNotes.push(
      memoryRead.elementMatch
        ? `${vivo.nickname}'s ${memoryRead.shortLabel.toLowerCase()} memory caught a mid-battle handoff, adding an origin brace and focus read.`
        : `${vivo.nickname}'s ${memoryRead.shortLabel.toLowerCase()} memory caught a mid-battle handoff and braced the rescue line.`,
    );
    this.presentationEvents.push({
      type: "tempoShift",
      side: "player",
      label: memoryRead.elementMatch ? "Origin handoff" : "Memory handoff",
      cue: memoryRead.elementMatch
        ? `${memoryRead.shortLabel} steadies and focuses ${vivo.nickname}`
        : `${memoryRead.shortLabel} steadies ${vivo.nickname}`,
      tint: memoryRead.elementMatch ? 0xf6df9a : 0x8fc8b2,
    });
    return memoryRead.elementMatch
      ? `${vivo.nickname}'s ${memoryRead.shortLabel.toLowerCase()} memory catches the switch, bracing and focusing the new line.`
      : `${vivo.nickname}'s ${memoryRead.shortLabel.toLowerCase()} memory catches the switch and braces the new line.`;
  }

  private getRouteReadDebriefNote(): string | undefined {
    const notes = [this.openingReadNote, ...this.memoryHandoffDebriefNotes].filter(Boolean);
    return notes.length > 0 ? notes.join(" ") : undefined;
  }

  private getFieldAttackMultiplier(move: MoveDefinition): number {
    const effect = this.fieldCondition?.effect;
    if (!effect || move.kind !== "attack") {
      return 1;
    }

    if (effect.type === "elementBoost" && move.element === effect.element) {
      return effect.attackMultiplier;
    }

    if (effect.type === "focusSurge" && move.attackStyle === "focus") {
      if (!effect.element || move.element === effect.element) {
        return effect.attackMultiplier;
      }
    }

    return 1;
  }

  private getFieldFocusBonus(move: MoveDefinition): number {
    const effect = this.fieldCondition?.effect;
    if (!effect || effect.type !== "focusSurge" || move.supportEffect?.type !== "focus") {
      return 0;
    }

    if (effect.element && move.element !== effect.element) {
      return 0;
    }

    return effect.focusMultiplierBonus;
  }

  private isFieldAttackBoosted(move: MoveDefinition): boolean {
    return this.getFieldAttackMultiplier(move) > 1;
  }

  private isFieldFocusBoosted(move: MoveDefinition): boolean {
    return this.getFieldFocusBonus(move) > 0;
  }

  private scoreAttackMove(move: MoveDefinition, attacker: VivoInstance, defender: VivoInstance): number {
    const estimatedDamage = this.estimateAttackDamage(move, attacker, defender);
    const defenderHp = Math.max(defender.currentHp, 1);
    const killBonus = estimatedDamage >= defenderHp ? 14 : 0;
    const priorityBonus = (move.priority ?? 0) * 3;
    return (
      estimatedDamage +
      killBonus +
      priorityBonus +
      this.scoreAttackFollowUpEffects(move, attacker, defender)
    );
  }

  private scoreAttackFollowUpEffects(
    move: MoveDefinition,
    attacker: VivoInstance,
    defender: VivoInstance,
  ): number {
    if (!move.attackEffects?.length) {
      return 0;
    }

    const attackerState = this.ensureBattleState(attacker);
    const defenderState = this.ensureBattleState(defender);
    const attackerHpRatio = attacker.currentHp / this.gameState.getMaxHp(attacker);
    let score = 0;

    for (const effect of move.attackEffects) {
      switch (effect.type) {
        case "shatterFocus":
          if (defenderState.focusMultiplier !== undefined) {
            score += 12;
          }
          break;
        case "crackGuard":
          if (defenderState.guardMultiplier !== undefined) {
            score += 10;
          }
          break;
        case "selfGuardOnExposedHit":
          if (defenderState.exposedMultiplier !== undefined) {
            score += attackerHpRatio <= 0.65 ? 8 : 5;
          }
          break;
        case "selfFocusOnHit":
          if (attackerState.focusMultiplier === undefined) {
            score += 8;
          }
          break;
      }
    }

    return score;
  }

  private scoreSupportMove(
    move: MoveDefinition,
    attacker: VivoInstance,
    defender: VivoInstance,
    hpRatio: number,
    attackerState: BattleTempoState,
    defenderState: BattleTempoState,
  ): number {
    const supportType = move.supportEffect?.type;
    if (supportType === "guard") {
      return attackerState.guardMultiplier === undefined
        ? hpRatio <= 0.45
          ? 24
          : 10
        : 1;
    }
    if (supportType === "focus") {
      return attackerState.focusMultiplier === undefined && defenderState.guardMultiplier === undefined
        ? 18 + this.bestAttackDamage(attacker, defender) * 0.2
        : 3;
    }
    if (supportType === "expose") {
      return defenderState.exposedMultiplier === undefined
        ? 16 + this.bestAttackDamage(attacker, defender) * 0.18
        : 2;
    }
    return 0;
  }

  private scoreMatchup(attacker: VivoInstance, defender: VivoInstance): number {
    const bestAttack = this.bestAttackDamage(attacker, defender);
    const incomingPressure = this.bestAttackDamage(defender, attacker);
    const hpRatio = attacker.currentHp / this.gameState.getMaxHp(attacker);
    return bestAttack - incomingPressure * 0.55 + hpRatio * 10;
  }

  private bestAttackDamage(attacker: VivoInstance, defender: VivoInstance): number {
    return attacker.knownMoveIds
      .map((moveId) => moveDex[moveId])
      .filter((move) => move.kind === "attack")
      .reduce((best, move) => Math.max(best, this.estimateProjectedAttackDamage(move, attacker, defender)), 0);
  }

  private estimateAttackDamage(move: MoveDefinition, attacker: VivoInstance, defender: VivoInstance): number {
    return this.estimateProjectedAttackDamage(move, attacker, defender);
  }

  private estimateProjectedAttackDamage(
    move: MoveDefinition,
    attacker: VivoInstance,
    defender: VivoInstance,
    overrides?: {
      attackerFocusMultiplier?: number;
      defenderGuardMultiplier?: number;
      defenderExposedMultiplier?: number;
    },
  ): number {
    const attackStyle = move.attackStyle ?? "impact";
    const attackerPower =
      attackStyle === "focus" ? this.gameState.getFocus(attacker) : this.gameState.getAttack(attacker);
    const defenderPower = this.gameState.getDefense(defender);
    const effectiveness = this.getEffectiveness(move.element, defender);
    const attackerState = this.ensureBattleState(attacker);
    const defenderState = this.ensureBattleState(defender);
    const focusMultiplier = overrides?.attackerFocusMultiplier ?? attackerState.focusMultiplier ?? 1;
    const guardMultiplier = overrides?.defenderGuardMultiplier ?? defenderState.guardMultiplier ?? 1;
    const exposedMultiplier =
      overrides?.defenderExposedMultiplier ?? defenderState.exposedMultiplier ?? 1;
    const traitMultiplier = this.getTraitAttackMultiplier(
      attacker,
      defender,
      move,
      focusMultiplier,
      exposedMultiplier,
    );
    return Math.max(
      3,
      Math.round(
        (move.power + attackerPower * 0.8 - defenderPower * 0.45) *
          effectiveness *
          focusMultiplier *
          guardMultiplier *
          exposedMultiplier *
          traitMultiplier *
          this.getFieldAttackMultiplier(move) *
          move.accuracy,
      ),
    );
  }

  private describeAttackStyle(style: "impact" | "focus"): string {
    return style === "focus"
      ? "The focused discharge lands through disciplined control."
      : "The strike lands with bodily force.";
  }

  private describeMoveThreat(move: MoveDefinition): string {
    if (move.kind === "support" && move.supportEffect) {
      return `${move.name} will ${this.describeSupportEffect(move.supportEffect)}.`;
    }

    const styleText = move.attackStyle === "focus" ? "focus pressure" : "impact pressure";
    return `${move.name} carries ${styleText} at ${move.power} power.${this.describeAttackEffects(move)}`;
  }

  private describeMoveIntent(move: MoveDefinition, attacker: VivoInstance, defender: VivoInstance): string {
    if (move.kind === "support" && move.supportEffect) {
      return `${speciesDex[attacker.speciesId].name} is reading toward ${move.name} to ${this.describeSupportEffect(move.supportEffect)}.`;
    }

    const effectiveness = this.getEffectiveness(move.element, defender);
    const estimatedDamage = this.estimateAttackDamage(move, attacker, defender);
    const effectivenessLine =
      effectiveness >= 1.2
        ? "It lines up a favorable element hit."
        : effectiveness <= 0.85
          ? "Its element is awkward, but the trainer still likes the tempo."
          : "It is a neutral line with stable pressure.";
    return `${this.describeMoveThreat(move)} Roughly ${estimatedDamage} damage into the current lead. ${effectivenessLine}`;
  }

  private classifyIntentStance(
    move: MoveDefinition,
    attacker: VivoInstance,
    defender: VivoInstance,
  ): EnemyIntentPreview["stance"] {
    if (move.kind === "support") {
      return move.supportEffect?.type === "focus" || move.supportEffect?.type === "expose"
        ? "warning"
        : "steady";
    }

    const effectiveness = this.getEffectiveness(move.element, defender);
    const estimatedDamage = this.estimateAttackDamage(move, attacker, defender);
    const hpRatio = estimatedDamage / Math.max(1, defender.currentHp);
    if (effectiveness >= 1.2 || hpRatio >= 0.65) {
      return "danger";
    }
    if (hpRatio >= 0.4) {
      return "warning";
    }
    return "steady";
  }

  private getEffectiveness(element: ElementType, defender: VivoInstance): number {
    return (
      effectivenessChart[element]?.[defender.element] ??
      effectivenessChart[element]?.[speciesDex[defender.speciesId].element] ??
      1
    );
  }

  private getCaptureReadiness(): {
    chance: number;
    level: number;
    label: string;
    summary: string;
    detail: string;
    exposureCount: number;
  } {
    const enemy = this.enemyActive;
    const enemyState = this.ensureBattleState(enemy);
    const hpRatio = enemy.currentHp / this.gameState.getMaxHp(enemy);
    const exposureBonus = enemyState.exposedMultiplier ? 0.12 : 0;
    const captureCalmBonus = this.getFieldCaptureBonus();
    const calmSignalBonus = this.getCalmSignalCaptureBonus();
    const habitatCaptureModifier = this.gameState.getActiveEncounterCaptureModifier();
    const chance = clamp(
      0.22 +
        (1 - hpRatio) * 0.65 +
        exposureBonus +
        captureCalmBonus +
        calmSignalBonus +
        habitatCaptureModifier,
      0.18,
      0.92,
    );
    const exposureCount = enemyState.exposureCount ?? 0;
    const fieldDetail =
      captureCalmBonus > 0
        ? ` ${this.fieldCondition?.name} makes the rescue pulse hold more easily here.`
        : "";
    const habitatLine =
      habitatCaptureModifier > 0
        ? " The local line is settled and easier to calm."
        : habitatCaptureModifier < 0
          ? " The local line is spooked and resisting your approach."
          : "";
    const fieldCallStrength = this.gameState.getActiveFieldCallStrength();
    const fieldCallLine = fieldCallStrength > 0
      ? fieldCallStrength >= 2
        ? " The held field call is resonating with the lead's origin memory, making this rescue read steadier."
        : " The held field call is still carrying into this rescue."
      : "";
    const promiseStrength = this.gameState.getActiveRescuePromiseStrength();
    const promiseLine = promiseStrength > 0
      ? promiseStrength >= 2
        ? " The previous clean rescue left an origin promise, so this pulse starts from a stronger read."
        : " The previous clean rescue left a sanctuary promise, so this pulse starts steadier."
      : "";
    const memoryRead = this.gameState.getActiveEncounterRescueMemoryRead();
    const memoryLine = memoryRead
      ? memoryRead.elementMatch
        ? " The lead's origin memory is actively bracing and focusing this rescue line."
        : " The lead's rescue memory is actively bracing this first exchange."
      : "";
    const calmSignalLine =
      calmSignalBonus > 0
        ? " Your calm signal makes the field wrap feel less like another trap."
        : "";

    if (chance >= 0.72) {
      return {
        chance,
        level: 2,
        label: "fragile",
        summary: "A weakened or exposed Vivo is likely to settle.",
        detail:
          `Heavy damage or Root Snare-style openings make the rescue pulse much steadier. A failed pulse here still needs a weaker target or a fresh expose.${fieldDetail}${habitatLine}${fieldCallLine}${promiseLine}${memoryLine}${calmSignalLine}`,
        exposureCount,
      };
    }
    if (chance >= 0.48) {
      return {
        chance,
        level: 1,
        label: "wavering",
        summary: "The target is starting to yield.",
        detail:
          `Lower its HP a little more or create an opening before attempting the capture pulse. Failed rescue tries must earn a fresher opening.${fieldDetail}${habitatLine}${fieldCallLine}${promiseLine}${memoryLine}${calmSignalLine}`,
        exposureCount,
      };
    }
    return {
      chance,
      level: 0,
      label: "resisting",
      summary: "This Vivo still has plenty of fight left.",
      detail:
        `Chip it down first. Exposed wild Vivos are easier to rescue than guarded ones, and each failed pulse needs a new opening before you can try again.${fieldDetail}${habitatLine}${fieldCallLine}${promiseLine}${memoryLine}${calmSignalLine}`,
      exposureCount,
    };
  }

  private hasFreshCaptureOpening(readiness: {
    level: number;
    exposureCount: number;
  }): boolean {
    if (this.lastCaptureAttemptLevel < 0) {
      return true;
    }

    if (readiness.level > this.lastCaptureAttemptLevel) {
      return true;
    }

    return readiness.exposureCount > this.lastCaptureExposureCount;
  }

  private getRetreatReadiness(): {
    chance: number;
    label: "clear" | "contested" | "tight";
    summary: string;
    detail: string;
  } {
    const playerSpeed = this.gameState.getSpeed(this.playerActive);
    const enemySpeed = this.gameState.getSpeed(this.enemyActive);
    const enemyHpRatio = this.enemyActive.currentHp / this.gameState.getMaxHp(this.enemyActive);
    const enemyState = this.ensureBattleState(this.enemyActive);
    const speedPressure = (playerSpeed - enemySpeed) / Math.max(enemySpeed, 1);
    const exposedBonus = enemyState.exposedMultiplier ? 0.12 : 0;
    const supportContext = this.describeRetreatSupportContext();
    const chance = clamp(
      0.38 + speedPressure * 0.28 + (1 - enemyHpRatio) * 0.22 + exposedBonus + supportContext.bonus,
      0.18,
      0.9,
    );
    const supportDetail = supportContext.notes.length ? ` ${supportContext.notes.join(" ")}` : "";

    if (chance >= 0.66) {
      return {
        chance,
        label: "clear",
        summary: "Your lead has enough room to peel back from this surge cleanly.",
        detail:
          `Faster leads, weakened wilds, and exposed targets open the safest path back to exploration.${supportDetail}`,
      };
    }

    if (chance >= 0.45) {
      return {
        chance,
        label: "contested",
        summary: "You can try to disengage, but the wild Vivo may still keep pressure on the line.",
        detail:
          `A little more damage or a cleaner speed edge will make the retreat feel steadier.${supportDetail}`,
      };
    }

    return {
      chance,
      label: "tight",
      summary: "The route is cramped and the wild Vivo still controls the pace.",
      detail:
        `Retreat is risky while the target is healthy or faster. Weaken it first or create an opening before breaking away.${supportDetail}`,
    };
  }

  private getFieldCaptureBonus(): number {
    const effect = this.fieldCondition?.effect;
    return effect?.type === "captureCalm" ? effect.captureChanceBonus : 0;
  }

  private getFieldRetreatPenalty(): number {
    const effect = this.fieldCondition?.effect;
    return effect?.type === "captureCalm" ? effect.retreatChancePenalty : 0;
  }

  private getCalmSignalCaptureBonus(): number {
    return Math.min(0.18, this.calmSignals * 0.09);
  }

  private getCalmSignalRetreatPenalty(): number {
    return Math.min(0.18, this.calmSignals * 0.09);
  }

  private deferTrainerReward(enemy: VivoInstance, finisher: VivoInstance) {
    this.deferredTrainerRewards.push({
      enemySpeciesId: enemy.speciesId,
      enemyLevel: enemy.level,
      enemyElement: enemy.element,
      finisherId: finisher.id,
      participantIds: [...this.playerParticipants],
    });
  }

  private distributeDeferredTrainerRewards(mode: "full" | "practice"): string[] {
    if (this.deferredTrainerRewards.length === 0) {
      return [];
    }

    const notes: string[] = [];
    for (const reward of this.deferredTrainerRewards) {
      const finisher = this.gameState.party.find((candidate) => candidate.id === reward.finisherId);
      if (!finisher) {
        continue;
      }

      if (mode === "full") {
        this.gameState.markVictoryAgainstElement(finisher, reward.enemyElement);
      }

      notes.push(
        ...this.distributeBattleExperience(
          reward.enemySpeciesId,
          reward.enemyLevel,
          finisher,
          reward.participantIds,
          mode,
        ),
      );
    }

    this.deferredTrainerRewards.length = 0;
    return notes;
  }

  private distributeImmediateBattleExperience(enemy: VivoInstance, finisher: VivoInstance): string[] {
    return this.distributeBattleExperience(
      enemy.speciesId,
      enemy.level,
      finisher,
      [...this.playerParticipants],
      "full",
    );
  }

  private distributeScriptedRescueTrustExperience(enemy: VivoInstance, finisher: VivoInstance): string[] {
    const xp = 10 + enemy.level * 3;
    const supportShare = Math.max(5, Math.round(xp * 0.55));
    const notes = [
      `${finisher.nickname} earned ${xp} trust XP by completing the rescue before a knockout.`,
      ...this.awardExperience(finisher, xp),
    ];
    const awarded = new Set([finisher.id]);

    for (const vivo of this.gameState.party) {
      if (awarded.has(vivo.id) || !this.playerParticipants.has(vivo.id) || vivo.currentHp <= 0) {
        continue;
      }
      notes.push(`${vivo.nickname} shared ${supportShare} trust XP from the calm rescue.`);
      notes.push(...this.awardExperience(vivo, supportShare));
      awarded.add(vivo.id);
    }

    return notes;
  }

  private distributeBattleExperience(
    enemySpeciesId: string,
    enemyLevel: number,
    finisher: VivoInstance,
    participantIds: string[],
    mode: "full" | "practice",
  ): string[] {
    const fullXp = 14 + enemyLevel * 4;
    const xp = mode === "full" ? fullXp : Math.max(4, Math.round(fullXp * 0.22));
    const notes: string[] = [];
    const awarded = new Set<string>();
    const participantSet = new Set(participantIds);

    const finisherNotes = this.awardExperience(finisher, xp);
    notes.push(
      mode === "full"
        ? `${speciesDex[enemySpeciesId].name} was defeated. ${finisher.nickname} gained ${xp} XP.`
        : `${speciesDex[enemySpeciesId].name} was steadied in practice. ${finisher.nickname} gained ${xp} practice XP.`,
    );
    notes.push(...finisherNotes);
    awarded.add(finisher.id);

    const supportShare =
      mode === "full" ? Math.max(6, Math.round(xp * 0.65)) : Math.max(3, Math.round(xp * 0.5));
    const witnessShare = Math.max(4, Math.round(xp * 0.3));

    for (const vivo of this.gameState.party) {
      if (awarded.has(vivo.id) || !participantSet.has(vivo.id)) {
        continue;
      }
      notes.push(
        mode === "full"
          ? `${vivo.nickname} shared ${supportShare} bond XP from the fight.`
          : `${vivo.nickname} shared ${supportShare} practice XP from the spar.`,
      );
      notes.push(...this.awardExperience(vivo, supportShare));
      awarded.add(vivo.id);
    }

    if (mode !== "full") {
      return notes;
    }

    for (const vivo of this.gameState.party) {
      if (awarded.has(vivo.id) || vivo.currentHp <= 0) {
        continue;
      }
      notes.push(`${vivo.nickname} learned from the exchange and gained ${witnessShare} witness XP.`);
      notes.push(...this.awardExperience(vivo, witnessShare));
      awarded.add(vivo.id);
    }

    return notes;
  }

  private awardExperience(vivo: VivoInstance, amount: number): string[] {
    const beforeLevel = vivo.level;
    const beforeKnownMoves = new Set(vivo.knownMoveIds);
    const beforePendingMoves = new Set(vivo.pendingMoveChoices.map((choice) => choice.moveId));
    const notes = this.gameState.grantExperience(vivo, amount);

    for (let level = beforeLevel + 1; level <= vivo.level; level += 1) {
      this.presentationEvents.push({
        type: "levelUp",
        vivoName: vivo.nickname,
        level,
      });
    }

    for (const moveId of vivo.knownMoveIds) {
      if (!beforeKnownMoves.has(moveId)) {
        this.presentationEvents.push({
          type: "moveUnlock",
          vivoName: vivo.nickname,
          moveName: moveDex[moveId].name,
          pendingChoice: false,
        });
      }
    }

    for (const choice of vivo.pendingMoveChoices) {
      if (!beforePendingMoves.has(choice.moveId)) {
        this.presentationEvents.push({
          type: "moveUnlock",
          vivoName: vivo.nickname,
          moveName: moveDex[choice.moveId].name,
          pendingChoice: true,
        });
      }
    }

    return notes;
  }

  private createTrainerBattleDebrief(
    result: TrainerBattleDebrief["result"],
    summary: string,
    nextStep: string,
  ): TrainerBattleDebrief {
    return {
      trainerId: this.trainer?.id ?? "unknown",
      trainerName: this.trainer?.name ?? "Unknown trainer",
      sceneName: this.gameState.currentScene.name,
      result,
      battlefieldConditionName: this.fieldCondition?.name,
      summary,
      nextStep,
      goals: this.battleGoals.map(({ definition, current }) => ({
        label: definition.label,
        hint: definition.hint,
        current,
        target: definition.count,
        complete: current >= definition.count,
      })),
    };
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
