import { moveDex } from "../data/moves";
import { sceneDex } from "../data/scenes";
import { speciesDex } from "../data/species";
import {
  creaturePortraitByFormName,
  creaturePortraitBySpeciesId,
  creaturePortraitManifest,
} from "../data/assets";
import type {
  BattlefieldCondition,
  BattleTraitDefinition,
  DialogueLine,
  ElementType,
  EncounterZone,
  Interactable,
  PendingMoveChoice,
  RescueEncounterState,
  MoveDefinition,
  SceneRequirement,
  SceneDefinition,
  StatBias,
  TrainerBattleDebrief,
  TrainerDefinition,
  TrainerRewardVivo,
  VivoInstance,
  WildEncounterDebrief,
} from "./types";
import { BattleController, type BattleSetup, type InitialTempoState } from "../systems/battle";

const XP_PER_LEVEL = 28;
const ATTUNEMENT_STRIDE = 160;
export const SAVE_STORAGE_KEY = "anima-codex-save-v1";
export const SAVE_SLOT_COUNT = 3;
const SAVE_STORAGE_PREFIX = "anima-codex-save-slot";
export const getSaveStorageKey = (slot: number) =>
  slot === 1 ? SAVE_STORAGE_KEY : `${SAVE_STORAGE_PREFIX}-${slot}`;
const FIRST_GYM_ROUTE_MENTOR_IDS = [
  "trailAuditorVale",
  "trailWardenNera",
  "burrowWardenTovin",
  "roostWatcherMiren",
  "ashScoutIven",
  "moonfenKeeperOrla",
] as const;

type CampaignChapterId =
  | "openingRescue"
  | "gym1Preparation"
  | "gym1Trial"
  | "gym1Aftermath"
  | "gym1Complete"
  | "gym2FieldStudy"
  | "gym2Trial"
  | "gym2Complete";

type CampaignBadgeId = "briarSteward" | "sporebellAdaptation";
type StewardshipEvidenceId =
  | "sanctuaryRescueRecord"
  | "briarDefenseTestimony"
  | "habitatAdaptationStudy";

interface CampaignProgression {
  chapterId: CampaignChapterId;
  chapterNumber: number;
  chapterTitle: string;
  objective: string;
  summary: string;
  complete: boolean;
}

type CampaignPacingStatus = "unmeasured" | "tooFast" | "onTarget" | "tooSlow";

interface CampaignPacingAssessment {
  status: CampaignPacingStatus;
  label: string;
  actualSeconds?: number;
  minimumSeconds: number;
  maximumSeconds: number;
}

const CAMPAIGN_CHAPTER_TITLES: Record<CampaignChapterId, string> = {
  openingRescue: "A Vivo Needs Shelter",
  gym1Preparation: "The Briar Stewardship Trial",
  gym1Trial: "The Briar Stewardship Trial",
  gym1Aftermath: "The Seizure Ledger",
  gym1Complete: "Briar Holds Its Ground",
  gym2FieldStudy: "The Garden Breathes",
  gym2Trial: "The Garden Breathes",
  gym2Complete: "Sporebell Trusts the Wild",
};

const CAMPAIGN_BADGE_TITLES: Record<CampaignBadgeId, string> = {
  briarSteward: "Briar Steward Badge",
  sporebellAdaptation: "Sporebell Adaptation Badge",
};

const TRAINER_BADGE_REWARDS: Partial<Record<string, CampaignBadgeId>> = {
  gymLeaderSenka: "briarSteward",
  sporebellWardenTamsin: "sporebellAdaptation",
};

const STEWARDSHIP_EVIDENCE_TITLES: Record<StewardshipEvidenceId, string> = {
  sanctuaryRescueRecord: "Sanctuary Rescue Record",
  briarDefenseTestimony: "Briar Defense Testimony",
  habitatAdaptationStudy: "Habitat Adaptation Study",
};

const TRAINER_EVIDENCE_REWARDS: Partial<Record<string, StewardshipEvidenceId>> = {
  townPatrolRhis: "briarDefenseTestimony",
  sporebellWardenTamsin: "habitatAdaptationStudy",
};

const CAMPAIGN_COMPLETION_TARGETS: Partial<
  Record<CampaignChapterId, { minimumSeconds: number; maximumSeconds: number }>
> = {
  gym1Complete: { minimumSeconds: 3 * 60 * 60, maximumSeconds: 5 * 60 * 60 },
  gym2Complete: { minimumSeconds: 5 * 60 * 60, maximumSeconds: 8 * 60 * 60 },
};

const randomId = () => Math.random().toString(36).slice(2, 10);

interface SaveSnapshot {
  version: 1;
  currentSceneId: string;
  playerPosition: {
    x: number;
    y: number;
  };
  recoveryAnchor: {
    sceneId: string;
    sceneName: string;
    label: string;
    x: number;
    y: number;
  };
  party: VivoInstance[];
  reserve: VivoInstance[];
  currentMessage: string;
  defeatedTrainerIds: string[];
  badges: number;
  badgeIds?: CampaignBadgeId[];
  stewardshipEvidenceIds?: StewardshipEvidenceId[];
  campaignChapterId?: CampaignChapterId;
  playTimeSeconds?: number;
  campaignMilestones?: Partial<Record<CampaignChapterId, number>>;
  encounterStepBudgets: Partial<Record<string, number>>;
  encounterMoodByZoneId: Partial<Record<string, number>>;
  pendingFieldCallByZoneId?: Partial<Record<string, number>>;
  rescuePromiseByZoneId?: Partial<Record<string, number>>;
  usedInteractableIds: string[];
  resolvedRescueEncounterIds: string[];
  lastBattleSummary?: string;
  latestTrainerDebrief?: TrainerBattleDebrief;
  latestWildDebrief?: WildEncounterDebrief;
  savedAt: string;
}

interface GameStateOptions {
  enablePersistence?: boolean;
  playtestOpenRoutes?: boolean;
  saveSlot?: number;
}

interface VivoCreateOptions {
  formName?: string;
}

const baseStat = (level: number, bias: number, scale: number) =>
  Math.round(level * scale + bias * 2);

export class GameState {
  currentSceneId = "briarTown";
  playerPosition = { ...sceneDex.briarTown.playerSpawn };
  recoveryAnchor = {
    sceneId: "briarTown",
    sceneName: sceneDex.briarTown.name,
    label: "Briar Town bridge",
    x: sceneDex.briarTown.playerSpawn.x,
    y: sceneDex.briarTown.playerSpawn.y,
  };
  party: VivoInstance[];
  reserve: VivoInstance[] = [];
  currentMessage =
    "Drill through Lantern Nursery, then push into Sanctuary Trail, Starglass Roost, or Ember Hollow to shape a bond path before Briar Gym.";
  activeEncounterZoneId?: string;
  battle?: BattleController;
  defeatedTrainerIds = new Set<string>();
  badgeIds = new Set<CampaignBadgeId>();
  stewardshipEvidenceIds = new Set<StewardshipEvidenceId>();
  campaignChapterId: CampaignChapterId = "openingRescue";
  private persistedPlayTimeSeconds = 0;
  private playSessionStartedAt = Date.now();
  private playSessionActive = true;
  campaignMilestones: Partial<Record<CampaignChapterId, number>> = {};
  lastBattleSummary?: string;
  latestTrainerDebrief?: TrainerBattleDebrief;
  latestWildDebrief?: WildEncounterDebrief;
  sceneVersion = 0;
  encounterStepBudgets: Partial<Record<string, number>> = {};
  encounterMoodByZoneId: Partial<Record<string, number>> = {};
  pendingFieldCallByZoneId: Partial<Record<string, number>> = {};
  rescuePromiseByZoneId: Partial<Record<string, number>> = {};
  usedInteractableIds = new Set<string>();
  resolvedRescueEncounterIds = new Set<string>();
  sanctuaryState:
    | {
        selectedPartyIndex?: number;
        selectedReserveIndex?: number;
      }
    | undefined;
  activeRescueEncounter?: RescueEncounterState;
  activeDialogue:
    | {
        lines: DialogueLine[];
        index: number;
      }
    | undefined;
  hudRoot: HTMLDivElement;
  onWorldRefresh?: () => void;
  private dialogueOnComplete?: () => void;
  private readonly enablePersistence: boolean;
  private playtestOpenRoutes: boolean;
  private saveSlot: number;
  private saveTimeoutId?: number;
  private lastSavedAt?: string;
  private saveStatus: "ready" | "saved" | "error" | "disabled" = "ready";

  constructor(hudRoot: HTMLDivElement, options?: GameStateOptions) {
    this.hudRoot = hudRoot;
    this.enablePersistence = options?.enablePersistence ?? true;
    this.playtestOpenRoutes = options?.playtestOpenRoutes ?? false;
    this.saveSlot = this.normalizeSaveSlot(options?.saveSlot ?? 1);
    this.party = [this.createVivo("dogemox", 4, "Dogemox")];
    if (this.enablePersistence) {
      this.restoreProgress();
    } else {
      this.saveStatus = "disabled";
    }
    this.renderHud();
  }

  get currentScene(): SceneDefinition {
    return sceneDex[this.currentSceneId];
  }

  getPartyLead(): VivoInstance {
    return this.party[0];
  }

  get badges(): number {
    return this.badgeIds.size;
  }

  getMove(moveId: string): MoveDefinition {
    return moveDex[moveId];
  }

  getScene(): SceneDefinition {
    return {
      ...this.currentScene,
      obstacles: this.currentScene.obstacles.filter(
        (obstacle) =>
          !obstacle.clearsWhen ||
          (!this.isRouteRequirementBypassed() && !this.isRequirementMet(obstacle.clearsWhen)),
      ),
      interactables: this.currentScene.interactables.filter(
        (interactable) =>
          (!interactable.requirement || this.isRequirementMet(interactable.requirement)) &&
          !(
            interactable.scriptedEncounter?.hideAfterResolution &&
            this.resolvedRescueEncounterIds.has(interactable.id)
          ),
      ),
      trainers: this.currentScene.trainers.filter(
        (trainer) =>
          this.isRouteRequirementBypassed() ||
          !trainer.requirement ||
          this.isRequirementMet(trainer.requirement),
      ),
    };
  }

  getSceneById(sceneId: string): SceneDefinition {
    return sceneDex[sceneId];
  }

  isRequirementMet(requirement?: SceneRequirement): boolean {
    if (!requirement) {
      return true;
    }

    if (requirement.defeatedTrainerId && !this.defeatedTrainerIds.has(requirement.defeatedTrainerId)) {
      return false;
    }

    if (requirement.badgeCountAtLeast !== undefined && this.badges < requirement.badgeCountAtLeast) {
      return false;
    }

    if (
      requirement.defeatedTrainerIdsAll?.some((trainerId) => !this.defeatedTrainerIds.has(trainerId))
    ) {
      return false;
    }

    if (
      requirement.defeatedTrainerIdsAny?.length &&
      !requirement.defeatedTrainerIdsAny.some((trainerId) => this.defeatedTrainerIds.has(trainerId))
    ) {
      return false;
    }

    if (
      requirement.partyFormCountAtLeast !== undefined &&
      this.getAwakenedPartyCount() < requirement.partyFormCountAtLeast
    ) {
      return false;
    }

    if (
      requirement.usedInteractableIdsAll?.some(
        (interactableId) => !this.usedInteractableIds.has(interactableId),
      )
    ) {
      return false;
    }

    return true;
  }

  canUseExit(exit: { requirement?: SceneRequirement; adminTestState?: "open" | "closed" | "authored" }): boolean {
    if (this.playtestOpenRoutes) {
      if (exit.adminTestState === "closed") {
        return false;
      }
      if (exit.adminTestState === "authored") {
        return this.isRequirementMet(exit.requirement);
      }
      return true;
    }
    return this.isRequirementMet(exit.requirement);
  }

  isPlaytestRouteAccessEnabled(): boolean {
    return this.playtestOpenRoutes;
  }

  setPlaytestRouteAccess(enabled: boolean) {
    this.playtestOpenRoutes = enabled;
    this.sceneVersion += 1;
    this.renderHud();
    this.onWorldRefresh?.();
  }

  private isRouteRequirementBypassed(): boolean {
    return this.playtestOpenRoutes;
  }

  createVivo(speciesId: string, level: number, nickname?: string, options?: VivoCreateOptions): VivoInstance {
    const species = speciesDex[speciesId];
    const knownMoveIds = species.learnset
      .filter((entry) => entry.level <= level)
      .slice(-4)
      .map((entry) => entry.moveId);
    const vivo: VivoInstance = {
      id: randomId(),
      speciesId,
      nickname: nickname ?? species.name,
      level,
      xp: 0,
      currentHp: 1,
      element: species.element,
      knownMoveIds,
      winsByElement: {},
      attunementByElement: {},
      habitatStrideByElement: {},
      pendingMoveChoices: [],
    };
    if (options?.formName) {
      this.applyFormName(vivo, options.formName);
      if (!nickname) {
        vivo.nickname = options.formName;
      }
    }
    if (speciesId === "dogemox" && nickname === "Dogemox") {
      vivo.rescueMemory = {
        source: "Briar Town",
        method: "starter",
        note: "First sanctuary partner saved before the confiscation road opened.",
      };
    }
    vivo.currentHp = this.getMaxHp(vivo);
    return vivo;
  }

  getMaxHp(vivo: VivoInstance): number {
    return baseStat(vivo.level, this.getCurrentStatBias(vivo).hp, 5.4);
  }

  getMaxHpFromSpecies(speciesId: string, level: number): number {
    return baseStat(level, speciesDex[speciesId].statBias.hp, 5.4);
  }

  getAttack(vivo: VivoInstance): number {
    return baseStat(vivo.level, this.getCurrentStatBias(vivo).attack, 2.4);
  }

  getDefense(vivo: VivoInstance): number {
    return baseStat(vivo.level, this.getCurrentStatBias(vivo).defense, 2.1);
  }

  getFocus(vivo: VivoInstance): number {
    return baseStat(vivo.level, this.getCurrentStatBias(vivo).focus, 2.3);
  }

  getSpeed(vivo: VivoInstance): number {
    return baseStat(vivo.level, this.getCurrentStatBias(vivo).speed, 1.7);
  }

  setMessage(message: string) {
    this.currentMessage = message;
    this.renderHud();
  }

  healParty() {
    for (const vivo of this.party) {
      vivo.currentHp = this.getMaxHp(vivo);
    }
    this.scheduleProgressSave();
  }

  movePlayer(nextX: number, nextY: number) {
    this.playerPosition = { x: nextX, y: nextY };
    this.sceneVersion += 1;
    this.scheduleProgressSave();
  }

  switchLead(index: number): string {
    if (index <= 0 || index >= this.party.length) {
      return "No alternate Vivo available.";
    }
    const next = this.party[index];
    if (next.currentHp <= 0) {
      return `${next.nickname} is too hurt to switch in.`;
    }
    const [chosen] = this.party.splice(index, 1);
    this.party.unshift(chosen);
    this.renderHud();
    return `${chosen.nickname} takes the front line.`;
  }

  setFieldLead(index: number): string {
    if (index < 0 || index >= this.party.length) {
      return "That field assignment is not available.";
    }
    if (index === 0) {
      return `${this.party[0].nickname} is already leading the field line.`;
    }

    const next = this.party[index];
    if (next.currentHp <= 0) {
      return `${next.nickname} is too hurt to lead the field right now.`;
    }

    const [chosen] = this.party.splice(index, 1);
    this.party.unshift(chosen);
    this.renderHud();
    this.scheduleProgressSave();
    const routeRead = this.describeActiveLeadAssignmentRead();
    return `${chosen.nickname} now leads the field party for habitat scouting and bond growth.${routeRead ? ` ${routeRead}` : ""}`;
  }

  switchScene(sceneId: string, x: number, y: number) {
    this.currentSceneId = sceneId;
    this.playerPosition = { x, y };
    this.activeEncounterZoneId = undefined;
    this.sanctuaryState = undefined;
    this.activeDialogue = undefined;
    this.dialogueOnComplete = undefined;
    this.sceneVersion += 1;
    this.setMessage(sceneDex[sceneId].description);
    this.scheduleProgressSave();
  }

  startWildBattle(zone: EncounterZone) {
    this.sanctuaryState = undefined;
    this.activeRescueEncounter = undefined;
    const encounter = this.rollEncounter(zone);
    const enemy = this.createVivo(encounter.speciesId, encounter.level);
    this.battle = new BattleController(this, {
      type: "wild",
      enemyTeam: [enemy],
      label: `${speciesDex[enemy.speciesId].name} emerges from the ${zone.biome}.`,
      fieldCondition: zone.battlefieldCondition ?? this.currentScene.battlefieldCondition,
      initialTempo: this.getWildBattleInitialTempo(zone),
    });
    this.renderHud();
  }

  startTrainerBattle(trainer: TrainerDefinition) {
    this.sanctuaryState = undefined;
    this.activeRescueEncounter = undefined;
    const team = trainer.team.map((entry) =>
      this.createVivo(entry.speciesId, entry.level, entry.nickname, { formName: entry.formName }),
    );
    this.battle = new BattleController(this, {
      type: "trainer",
      enemyTeam: team,
      label: `${trainer.name} challenges you.`,
      trainer,
      fieldCondition: this.currentScene.battlefieldCondition,
    });
    this.renderHud();
  }

  startScriptedRescueEncounter(interactable: Interactable) {
    const scriptedEncounter = interactable.scriptedEncounter;
    if (!scriptedEncounter) {
      return false;
    }

    this.sanctuaryState = undefined;
    this.activeRescueEncounter = {
      interactableId: interactable.id,
      speciesId: scriptedEncounter.speciesId,
      level: scriptedEncounter.level,
      formName: scriptedEncounter.formName,
      battleGoals: scriptedEncounter.battleGoals,
      rescueBond: scriptedEncounter.rescueBond,
      rewardText: scriptedEncounter.rewardText,
      rewardDialogue: scriptedEncounter.rewardDialogue,
      retryText: scriptedEncounter.retryText,
      retryDialogue: scriptedEncounter.retryDialogue,
      hideAfterResolution: scriptedEncounter.hideAfterResolution,
    };
    const enemy = this.createVivo(scriptedEncounter.speciesId, scriptedEncounter.level, undefined, {
      formName: scriptedEncounter.formName,
    });
    this.battle = new BattleController(this, {
      type: "wild",
      enemyTeam: [enemy],
      label: scriptedEncounter.label,
      battleGoals: scriptedEncounter.battleGoals,
      allowCapture: false,
      rescueEncounter: this.activeRescueEncounter,
      fieldCondition: this.currentScene.battlefieldCondition,
    });
    this.renderHud();
    return true;
  }

  finishBattle(resultText: string, dialogueLines?: DialogueLine[]) {
    this.lastBattleSummary = resultText;
    this.battle = undefined;
    this.setMessage(resultText);
    if (dialogueLines?.length) {
      this.openDialogue(dialogueLines);
    }
    this.scheduleProgressSave();
  }

  addCapturedVivo(vivo: VivoInstance): string {
    vivo.currentHp = this.getMaxHp(vivo);
    if (this.party.length < 6) {
      this.party.push(vivo);
      this.renderHud();
      this.scheduleProgressSave();
      return `${vivo.nickname} joined your active roster.`;
    }
    this.reserve.push(vivo);
    this.renderHud();
    this.scheduleProgressSave();
    return `${vivo.nickname} was rescued and sent to reserve.`;
  }

  imprintCapturedRescueBond(vivo: VivoInstance, readinessLevel: number, calmSignals: number): string | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = this.currentScene.encounterZones.find((candidate) => candidate.id === this.activeEncounterZoneId);
    if (!zone) {
      return undefined;
    }

    const source = `${this.currentScene.name} - ${this.formatBiomeName(zone.biome)}`;
    const steadyLine =
      readinessLevel >= 2 || calmSignals > 0
        ? "joined through a steadied rescue pulse"
        : "joined through a narrow rescue pulse";
    if (!zone.attunementElement) {
      this.stampRescueMemory(vivo, {
        source,
        method: "wildCapture",
        note: `${speciesDex[vivo.speciesId].name} ${steadyLine} in the ${zone.biome}.`,
      });
      return undefined;
    }

    const amount = readinessLevel >= 2 || calmSignals > 0 ? 2 : 1;
    const total = this.grantAttunement(vivo, zone.attunementElement, amount);
    const elementName = this.formatElementName(zone.attunementElement).toLowerCase();
    this.stampRescueMemory(vivo, {
      source,
      method: "wildCapture",
      note: `${speciesDex[vivo.speciesId].name} ${steadyLine} and carries ${amount} ${elementName} bond mark${amount === 1 ? "" : "s"} from this patch.`,
      bondElement: zone.attunementElement,
      bondAmount: amount,
    });
    return `${vivo.nickname} keeps ${amount} ${elementName} rescue bond mark${amount === 1 ? "" : "s"} from the ${zone.biome}, now holding ${total}.`;
  }

  addReserveVivo(speciesId: string, level: number, nickname?: string): VivoInstance {
    const vivo = this.createVivo(speciesId, level, nickname);
    vivo.currentHp = this.getMaxHp(vivo);
    this.reserve.push(vivo);
    this.renderHud();
    this.scheduleProgressSave();
    return vivo;
  }

  awardTrainerRewardVivo(reward: TrainerRewardVivo): string {
    const rescued = this.createVivo(reward.speciesId, reward.level, reward.nickname, {
      formName: reward.formName,
    });
    const source = reward.rescueMemorySource ?? this.currentScene.name;
    const bondText = reward.rescueBond
      ? (() => {
          const total = this.grantAttunement(rescued, reward.rescueBond.element, reward.rescueBond.amount);
          const elementName = this.formatElementName(reward.rescueBond.element).toLowerCase();
          return `${rescued.nickname} keeps ${reward.rescueBond.amount} ${elementName} release bond mark${reward.rescueBond.amount === 1 ? "" : "s"} from ${source}, now holding ${total}.`;
        })()
      : undefined;
    this.stampRescueMemory(rescued, {
      source,
      method: "trainerRelease",
      note: reward.rescueBond
        ? `${rescued.nickname} was released from a trainer or patrol hold and still recognizes ${source} as the place its bond line was defended.`
        : `${rescued.nickname} was released from a trainer or patrol hold after the battle line held.`,
      bondElement: reward.rescueBond?.element,
      bondAmount: reward.rescueBond?.amount,
    });
    const rosterMessage = this.addCapturedVivo(rescued);
    return bondText ? `${bondText} ${rosterMessage}` : rosterMessage;
  }

  grantExperience(vivo: VivoInstance, amount: number): string[] {
    const notes: string[] = [];
    vivo.xp += amount;
    while (vivo.xp >= XP_PER_LEVEL) {
      vivo.xp -= XP_PER_LEVEL;
      vivo.level += 1;
      vivo.currentHp = this.getMaxHp(vivo);
      notes.push(`${vivo.nickname} reached level ${vivo.level}.`);

      const species = speciesDex[vivo.speciesId];
      for (const entry of species.learnset) {
        const alreadyKnown = vivo.knownMoveIds.includes(entry.moveId);
        const alreadyPending = vivo.pendingMoveChoices.some((choice) => choice.moveId === entry.moveId);
        if (entry.level === vivo.level && !alreadyKnown && !alreadyPending) {
          if (vivo.knownMoveIds.length < 4) {
            vivo.knownMoveIds = [...vivo.knownMoveIds, entry.moveId];
            notes.push(`${vivo.nickname} learned ${moveDex[entry.moveId].name}.`);
          } else {
            vivo.pendingMoveChoices.push({
              moveId: entry.moveId,
              sourceLevel: vivo.level,
            });
            notes.push(
              `${vivo.nickname} can study ${moveDex[entry.moveId].name}. Choose a move to replace in the field journal.`,
            );
          }
        }
      }

      const transitions = species.formTransitions ?? [];
      const currentTransitionIndex = transitions.findIndex(
        (transition) => transition.name === vivo.formName,
      );
      const transformation = transitions
        .map((transition, index) => ({ transition, index }))
        .filter(({ transition, index }) => {
          const requiredWins = vivo.winsByElement[transition.requiredWinsInElement] ?? 0;
          const requiredAttunementElement =
            transition.requiredAttunementInElement ?? transition.requiredWinsInElement;
          const requiredAttunement = transition.requiredAttunement ?? 0;
          const currentAttunement = vivo.attunementByElement[requiredAttunementElement] ?? 0;
          return (
            index > currentTransitionIndex &&
            transition.requiredLevel <= vivo.level &&
            requiredWins >= 1 &&
            currentAttunement >= requiredAttunement
          );
        })
        .at(-1)?.transition;
      if (transformation) {
        vivo.formName = transformation.name;
        vivo.element = transformation.newElement;
        vivo.currentHp = this.getMaxHp(vivo);
        notes.push(`${vivo.nickname} transformed into ${transformation.name}.`);
        if (transformation.awakenMoveId) {
          notes.push(...this.applyAwakenedMove(vivo, transformation.awakenMoveId));
        }
      }
    }
    this.renderHud();
    this.scheduleProgressSave();
    return notes;
  }

  markVictoryAgainstElement(vivo: VivoInstance, element: ElementType) {
    vivo.winsByElement[element] = (vivo.winsByElement[element] ?? 0) + 1;
    this.grantAttunement(vivo, element, 1);
  }

  debugPrimeLeadEvolution(formName: string): string[] {
    const lead = this.getPartyLead();
    const transition = speciesDex[lead.speciesId].formTransitions?.find(
      (candidate) => candidate.name === formName,
    );
    if (!transition) {
      return [];
    }

    lead.level = Math.max(1, transition.requiredLevel - 1);
    lead.xp = 0;
    lead.winsByElement[transition.requiredWinsInElement] = Math.max(
      1,
      lead.winsByElement[transition.requiredWinsInElement] ?? 0,
    );
    const attunementElement =
      transition.requiredAttunementInElement ?? transition.requiredWinsInElement;
    lead.attunementByElement[attunementElement] = Math.max(
      transition.requiredAttunement ?? 0,
      lead.attunementByElement[attunementElement] ?? 0,
    );
    return this.grantExperience(lead, XP_PER_LEVEL);
  }

  advanceLeadAttunement(zone: EncounterZone, distance: number) {
    if (!zone.attunementElement) {
      return;
    }

    const lead = this.getPartyLead();
    const element = zone.attunementElement;
    const nextStride = (lead.habitatStrideByElement[element] ?? 0) + distance;
    const gained = Math.floor(nextStride / ATTUNEMENT_STRIDE);
    lead.habitatStrideByElement[element] = nextStride % ATTUNEMENT_STRIDE;
    if (gained > 0) {
      this.grantAttunement(lead, element, gained);
    }
  }

  inspectInteractable(interactable: Interactable): string {
    if (interactable.action === "manageReserve") {
      if (this.reserve.length === 0) {
        this.sanctuaryState = undefined;
        this.renderHud();
        return "No rescued reserve Vivos are waiting yet.";
      }

      this.sanctuaryState = {
        selectedPartyIndex: 0,
        selectedReserveIndex: 0,
      };
      this.renderHud();
      this.scheduleProgressSave();
      return "Choose an active Vivo and a reserve partner to swap before the next route push.";
    }

    const notes: string[] = [];
    let needsRender = false;

    if (interactable.action === "healParty") {
      this.healParty();
      notes.push("Your active roster is restored and ready for the next push.");
      needsRender = true;
    }

    if (interactable.recoveryPoint) {
      const recoveryLabel = this.setRecoveryAnchor(
        interactable,
        interactable.recoveryPoint.healParty
          ? "The recovery line now falls back here after a full wipe."
          : "The recovery line now falls back here if the route overwhelms the party.",
      );
      notes.push(recoveryLabel);
      needsRender = true;
    }

    if (interactable.attunement) {
      const lead = this.getPartyLead();
      if (this.usedInteractableIds.has(interactable.id)) {
        const currentAttunement = lead.attunementByElement[interactable.attunement.element] ?? 0;
        notes.push(
          `${lead.nickname} still carries ${currentAttunement} ${interactable.attunement.element} bond marks.`,
        );
      } else {
        this.usedInteractableIds.add(interactable.id);
        const total = this.grantAttunement(
          lead,
          interactable.attunement.element,
          interactable.attunement.amount,
        );
        notes.push(
          `${lead.nickname} gains ${interactable.attunement.amount} ${interactable.attunement.element} bond mark${interactable.attunement.amount === 1 ? "" : "s"} and now holds ${total}.`,
        );
        needsRender = true;
      }
    }

    if (needsRender) {
      this.refreshCampaignChapter();
      this.renderHud();
      this.scheduleProgressSave();
    }

    return notes.length > 0 ? notes.join(" ") : interactable.text;
  }

  markTrainerDefeated(trainerId: string) {
    if (!this.defeatedTrainerIds.has(trainerId)) {
      this.defeatedTrainerIds.add(trainerId);
      const badgeReward = TRAINER_BADGE_REWARDS[trainerId];
      if (badgeReward) {
        this.badgeIds.add(badgeReward);
      }
      const evidenceReward = TRAINER_EVIDENCE_REWARDS[trainerId];
      if (evidenceReward) {
        this.stewardshipEvidenceIds.add(evidenceReward);
      }
      if (trainerId === "gymLeaderSenka") {
        this.currentMessage =
          "Senka's lantern badge holds, but Briar's first confiscation patrol is already leaning on the town notice board. Return to the square and hold the line.";
      } else if (trainerId === "townPatrolRhis") {
        this.currentMessage =
          "The first patrol backed down. Sporebell Garden is open through Lantern Nursery; cross it and document the living habitat inside Cadence Lab Annex.";
        this.recordCampaignMilestone("gym1Complete");
      } else if (trainerId === "sporebellWardenTamsin") {
        this.currentMessage =
          "Tamsin records the habitat study and awards Sporebell's adaptation badge. The sanctuary now carries proof that free Vivos can stabilize living environments.";
        this.recordCampaignMilestone("gym2Complete");
      } else if (trainerId === "trailAuditorVale") {
        this.currentMessage =
          "Trail Auditor Vale closed the seizure ledger for now. The sanctuary route still needs a mentor lesson, an awakened form, and a clean first-gym plan.";
      }
    }
    this.refreshCampaignChapter();
    this.renderHud();
    this.scheduleProgressSave();
  }

  setActiveEncounterZone(zoneId?: string) {
    if (!zoneId && this.battle) {
      return;
    }
    if (this.activeEncounterZoneId === zoneId) {
      return;
    }
    this.activeEncounterZoneId = zoneId;
    this.renderHud();
  }

  handleHudAction(action: string, value?: string): string | undefined {
    if (action === "save-field-log") {
      return this.persistProgressNow()
        ? "Field log updated. This route will resume from the saved journal."
        : "Field log could not be updated right now.";
    }

    if (action === "advance-dialogue") {
      this.advanceDialogue();
      return undefined;
    }

    if (this.activeDialogue) {
      return undefined;
    }

    if (action === "learn-study-move") {
      if (!value) {
        return undefined;
      }

      const [vivoId, moveId, replaceMoveId] = value.split("|");
      if (!vivoId || !moveId || !replaceMoveId) {
        return undefined;
      }

      return this.learnPendingMove(vivoId, moveId, replaceMoveId);
    }

    if (action === "decline-study-move") {
      if (!value) {
        return undefined;
      }

      const [vivoId, moveId] = value.split("|");
      if (!vivoId || !moveId) {
        return undefined;
      }

      return this.declinePendingMove(vivoId, moveId);
    }

    if (action === "set-field-lead") {
      const index = Number(value);
      if (Number.isNaN(index)) {
        return undefined;
      }
      return this.setFieldLead(index);
    }

    if (action === "steady-habitat") {
      return this.steadyActiveEncounterZone();
    }

    if (!this.sanctuaryState) {
      return undefined;
    }

    if (action === "close-sanctuary") {
      this.sanctuaryState = undefined;
      this.renderHud();
      this.scheduleProgressSave();
      return "The sanctuary ledger closes. Your current field roster stands.";
    }

    if (action === "select-party-slot") {
      const index = Number(value);
      if (Number.isNaN(index) || index < 0 || index >= this.party.length) {
        return undefined;
      }
      this.sanctuaryState.selectedPartyIndex = index;
      this.renderHud();
      this.scheduleProgressSave();
      return `${this.party[index].nickname} is marked for field-duty rotation.`;
    }

    if (action === "select-reserve-slot") {
      const index = Number(value);
      if (Number.isNaN(index) || index < 0 || index >= this.reserve.length) {
        return undefined;
      }
      this.sanctuaryState.selectedReserveIndex = index;
      this.renderHud();
      this.scheduleProgressSave();
      return `${this.reserve[index].nickname} is ready to rotate in from reserve.`;
    }

    if (action === "swap-sanctuary-slot") {
      const partyIndex = this.sanctuaryState.selectedPartyIndex;
      const reserveIndex = this.sanctuaryState.selectedReserveIndex;
      if (partyIndex === undefined || reserveIndex === undefined) {
        return "Pick one active Vivo and one reserve Vivo first.";
      }

      const partyVivo = this.party[partyIndex];
      const reserveVivo = this.reserve[reserveIndex];
      if (!partyVivo || !reserveVivo) {
        return "That rotation is no longer available.";
      }

      this.party[partyIndex] = reserveVivo;
      this.reserve[reserveIndex] = partyVivo;
      this.sanctuaryState = {
        selectedPartyIndex: partyIndex,
        selectedReserveIndex: reserveIndex,
      };
      this.renderHud();
      this.scheduleProgressSave();
      return `${reserveVivo.nickname} joins the active roster while ${partyVivo.nickname} rests in reserve.`;
    }

    return undefined;
  }

  debugDefeatTrainer(trainerId: string): boolean {
    const trainer = Object.values(sceneDex)
      .flatMap((scene) => scene.trainers)
      .find((candidate) => candidate.id === trainerId);
    if (!trainer) {
      return false;
    }

    this.markTrainerDefeated(trainerId);
    return true;
  }

  debugAuditCampaignProgression(): {
    status: "passed" | "failed";
    cases: Array<{ name: string; expected: CampaignChapterId; actual: CampaignChapterId; passed: boolean }>;
    pacingCases: Array<{
      name: string;
      expected: CampaignPacingStatus;
      actual: CampaignPacingStatus;
      passed: boolean;
    }>;
  } {
    const unawakenedParty = this.party.map((vivo) => ({ ...vivo, formName: undefined }));
    const awakenedParty = unawakenedParty.map((vivo, index) =>
      index === 0 ? { ...vivo, formName: "Audit Form" } : vivo,
    );
    const scenarios: Array<{
      name: string;
      trainers: string[];
      party: VivoInstance[];
      usedInteractables?: string[];
      expected: CampaignChapterId;
    }> = [
      { name: "opening", trainers: [], party: unawakenedParty, expected: "openingRescue" },
      {
        name: "nursery lesson",
        trainers: ["nurseryTenderSola"],
        party: unawakenedParty,
        expected: "gym1Preparation",
      },
      {
        name: "mentor without awakening",
        trainers: ["nurseryTenderSola", "trailAuditorVale"],
        party: unawakenedParty,
        expected: "gym1Preparation",
      },
      {
        name: "mentor plus awakening",
        trainers: ["trailAuditorVale"],
        party: awakenedParty,
        expected: "gym1Trial",
      },
      {
        name: "Senka cleared",
        trainers: ["gymLeaderSenka"],
        party: awakenedParty,
        expected: "gym1Aftermath",
      },
      {
        name: "Rhis cleared",
        trainers: ["gymLeaderSenka", "townPatrolRhis"],
        party: awakenedParty,
        expected: "gym2FieldStudy",
      },
      {
        name: "Cadence field study",
        trainers: ["gymLeaderSenka", "townPatrolRhis"],
        party: awakenedParty,
        usedInteractables: ["warningLightTree"],
        expected: "gym2Trial",
      },
      {
        name: "Tamsin cleared",
        trainers: ["gymLeaderSenka", "townPatrolRhis", "sporebellWardenTamsin"],
        party: awakenedParty,
        usedInteractables: ["warningLightTree"],
        expected: "gym2Complete",
      },
    ];
    const cases = scenarios.map((scenario) => {
      const actual = this.evaluateCampaignChapterState(
        new Set(scenario.trainers),
        scenario.party,
        new Set(scenario.usedInteractables ?? []),
      );
      return { ...scenario, actual, passed: actual === scenario.expected };
    });
    const pacingCases = [
      { name: "Gym 1 unmeasured", chapterId: "gym1Complete" as const, seconds: undefined, expected: "unmeasured" as const },
      { name: "Gym 1 below lower bound", chapterId: "gym1Complete" as const, seconds: 3 * 60 * 60 - 1, expected: "tooFast" as const },
      { name: "Gym 1 at lower bound", chapterId: "gym1Complete" as const, seconds: 3 * 60 * 60, expected: "onTarget" as const },
      { name: "Gym 1 at upper bound", chapterId: "gym1Complete" as const, seconds: 5 * 60 * 60, expected: "onTarget" as const },
      { name: "Gym 1 above upper bound", chapterId: "gym1Complete" as const, seconds: 5 * 60 * 60 + 1, expected: "tooSlow" as const },
      { name: "Gym 2 unmeasured", chapterId: "gym2Complete" as const, seconds: undefined, expected: "unmeasured" as const },
      { name: "Gym 2 below lower bound", chapterId: "gym2Complete" as const, seconds: 5 * 60 * 60 - 1, expected: "tooFast" as const },
      { name: "Gym 2 at lower bound", chapterId: "gym2Complete" as const, seconds: 5 * 60 * 60, expected: "onTarget" as const },
      { name: "Gym 2 at upper bound", chapterId: "gym2Complete" as const, seconds: 8 * 60 * 60, expected: "onTarget" as const },
      { name: "Gym 2 above upper bound", chapterId: "gym2Complete" as const, seconds: 8 * 60 * 60 + 1, expected: "tooSlow" as const },
    ].map(({ name, chapterId, seconds, expected }) => {
      const actual = this.assessCampaignPacing(chapterId, seconds)?.status ?? "unmeasured";
      return { name, expected, actual, passed: actual === expected };
    });
    return {
      status:
        cases.every((entry) => entry.passed) && pacingCases.every((entry) => entry.passed)
          ? "passed"
          : "failed",
      cases: cases.map(({ name, expected, actual, passed }) => ({ name, expected, actual, passed })),
      pacingCases,
    };
  }

  debugResolveRescueEncounter(interactableId: string): boolean {
    const interactable = Object.values(sceneDex)
      .flatMap((scene) => scene.interactables)
      .find((candidate) => candidate.id === interactableId && candidate.scriptedEncounter);
    if (!interactable) {
      return false;
    }

    this.resolvedRescueEncounterIds.add(interactableId);
    this.stewardshipEvidenceIds.add("sanctuaryRescueRecord");
    this.sceneVersion += 1;
    this.renderHud();
    return true;
  }

  debugSetRecoveryAnchor(interactableId: string): boolean {
    const match = Object.entries(sceneDex).find(([, scene]) =>
      scene.interactables.some(
        (candidate) => candidate.id === interactableId && candidate.recoveryPoint,
      ),
    );
    if (!match) {
      return false;
    }

    const [sceneId, scene] = match;
    const interactable = scene.interactables.find((candidate) => candidate.id === interactableId);
    if (!interactable?.recoveryPoint) {
      return false;
    }

    this.recoveryAnchor = {
      sceneId,
      sceneName: scene.name,
      label: interactable.recoveryPoint.label,
      x: interactable.recoveryPoint.spawnX,
      y: interactable.recoveryPoint.spawnY,
    };
    this.renderHud();
    return true;
  }

  debugSetTrainerDebrief(trainerId: string, result: "full" | "practice" | "defeat"): boolean {
    const match = Object.values(sceneDex).find((scene) =>
      scene.trainers.some((candidate) => candidate.id === trainerId),
    );
    const trainer = match?.trainers.find((candidate) => candidate.id === trainerId);
    if (!match || !trainer) {
      return false;
    }

    this.recordTrainerBattleDebrief({
      trainerId: trainer.id,
      trainerName: trainer.name,
      sceneName: match.name,
      result,
      battlefieldConditionName: match.battlefieldCondition?.name,
      summary:
        result === "full"
          ? `${trainer.name}'s lesson held cleanly and the sanctuary counted the route growth.`
          : result === "practice"
            ? `${trainer.name}'s spar ended in a win, but the tactical lesson did not fully hold.`
            : `${trainer.name}'s pressure broke the line before the lesson could be proven.`,
      nextStep:
        result === "full"
          ? trainer.rewardText
          : result === "practice"
            ? `Return to ${match.name} and prove the missing lesson point in one clean win.`
            : `Recover the line and return to ${match.name} with a steadier bench.`,
      goals: (trainer.battleGoals ?? []).map((goal, index, goals) => {
        const current =
          result === "full"
            ? goal.count
            : result === "defeat"
              ? 0
              : index === goals.length - 1
                ? Math.max(0, goal.count - 1)
                : goal.count;
        return {
          label: goal.label,
          hint: goal.hint,
          current,
          target: goal.count,
          complete: current >= goal.count,
        };
      }),
    });
    return true;
  }

  returnPartyToRecoveryAnchor(): {
    sceneId: string;
    sceneName: string;
    label: string;
  } {
    this.healParty();
    this.clearActiveRescueEncounter();
    this.switchScene(
      this.recoveryAnchor.sceneId,
      this.recoveryAnchor.x,
      this.recoveryAnchor.y,
    );
    return {
      sceneId: this.recoveryAnchor.sceneId,
      sceneName: this.recoveryAnchor.sceneName,
      label: this.recoveryAnchor.label,
    };
  }

  recordTrainerBattleDebrief(debrief: TrainerBattleDebrief) {
    this.latestTrainerDebrief = debrief;
    this.renderHud();
    this.scheduleProgressSave();
  }

  recordWildEncounterAftermath(
    outcome: "capture" | "calmedRetreat" | "wildRetreat" | "wildDefeat" | "partyBreak",
    context?: {
      targetName?: string;
      rescueRead?: string;
      bondNote?: string;
      openingNote?: string;
    },
  ): string | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = Object.values(sceneDex)
      .flatMap((scene) => scene.encounterZones)
      .find((candidate) => candidate.id === this.activeEncounterZoneId);
    const openingNote = context?.openingNote ?? (zone ? this.describeWildOpeningInfluence(zone) : undefined);
    const delta =
      outcome === "capture" || outcome === "calmedRetreat"
        ? -1
        : outcome === "wildRetreat"
          ? 2
          : 1;
    delete this.pendingFieldCallByZoneId[this.activeEncounterZoneId];
    const consumedPromiseStrength = zone
      ? clamp(this.rescuePromiseByZoneId[this.activeEncounterZoneId] ?? 0, 0, 2)
      : 0;
    const promiseNote = zone ? this.updateRescuePromiseAftermath(this.activeEncounterZoneId, zone, outcome) : undefined;
    this.adjustEncounterMood(this.activeEncounterZoneId, delta);
    const mood = this.getEncounterMood(this.activeEncounterZoneId);
    const notes: string[] = [];
    const earnedBondNotes: string[] = [];

    if ((outcome === "capture" || outcome === "calmedRetreat") && zone?.attunementElement) {
      const lead = this.getPartyLead();
      const memoryRead = this.getLeadRescueMemoryRead(zone);
      const memoryBonus = memoryRead ? (memoryRead.elementMatch ? 2 : 1) : 0;
      const promiseBonus = consumedPromiseStrength;
      const total = this.grantAttunement(
        lead,
        zone.attunementElement,
        1 + memoryBonus + promiseBonus,
      );
      earnedBondNotes.push(
        `${lead.nickname}'s careful ${this.formatElementName(zone.attunementElement).toLowerCase()} rescue work leaves ${total} bond mark${total === 1 ? "" : "s"} on that path.`,
      );
      if (memoryRead) {
        earnedBondNotes.push(
          memoryRead.elementMatch
            ? `${memoryRead.shortLabel} resonates with the home pressure, adding two extra origin-memory marks.`
            : `${memoryRead.shortLabel} answers the route, adding one extra rescue-memory mark.`,
        );
      }
      if (promiseBonus > 0) {
        earnedBondNotes.push(
          promiseBonus >= 2
            ? "The held origin promise paid off, adding two extra bond marks for answering the calmer return line."
            : "The held rescue promise paid off, adding one extra bond mark for keeping the next line calm.",
        );
      }
      notes.push(...earnedBondNotes);
    }

    notes.push(`Habitat aftermath: ${mood.summary} ${mood.paceNote}`);
    this.latestWildDebrief = this.createWildEncounterDebrief(outcome, mood, zone, {
      targetName: context?.targetName,
      rescueRead: context?.rescueRead,
      bondNote: [context?.bondNote, ...earnedBondNotes].filter(Boolean).join(" "),
      openingNote,
      promiseNote,
    });
    this.renderHud();
    this.scheduleProgressSave();
    return notes.join(" ");
  }

  private createWildEncounterDebrief(
    outcome: WildEncounterDebrief["outcome"],
    mood: {
      label: "steady" | "settled" | "spooked" | "scattered";
      summary: string;
      paceNote: string;
    },
    zone: EncounterZone | undefined,
    context?: {
      targetName?: string;
      rescueRead?: string;
      bondNote?: string;
      openingNote?: string;
      promiseNote?: string;
    },
  ): WildEncounterDebrief {
    const targetText = context?.targetName ? context.targetName : "The wild Vivo";
    const outcomeCopy: Record<
      WildEncounterDebrief["outcome"],
      {
        resultLabel: string;
        summary: string;
        nextStep: string;
      }
    > = {
      capture: {
        resultLabel: "Rescue held",
        summary: `${targetText} joined the sanctuary line, and the local habitat settled around the calmer rescue read.`,
        nextStep: "Set the right lead before the next patch so new bond marks land where you want them.",
      },
      calmedRetreat: {
        resultLabel: "Careful retreat",
        summary: `The line backed away without cornering ${targetText.toLowerCase()} and left the patch easier to approach.`,
        nextStep: "Return after healing or lead-swapping; this patch should answer more gently next time.",
      },
      wildRetreat: {
        resultLabel: "Wild line broke",
        summary: `${targetText} escaped into cover, scattering the local route rhythm.`,
        nextStep: "Use Calm Signal, a held field call, or lower pressure before the next rescue pulse.",
      },
      wildDefeat: {
        resultLabel: "Pressure win",
        summary: `${targetText} was beaten back, but the habitat remembers the harder finish.`,
        nextStep: "Let the patch breathe or use a field call before chasing another rescue there.",
      },
      partyBreak: {
        resultLabel: "Line broke",
        summary: `The party fell back from ${zone ? this.formatBiomeName(zone.biome) : "the habitat"} and left the wild line unsettled.`,
        nextStep: "Recover at the anchor, then return with a healthier lead and a steadier opening plan.",
      },
    };
    const copy = outcomeCopy[outcome];
    return {
      sceneName: this.currentScene.name,
      zoneName: zone ? this.formatBiomeName(zone.biome) : undefined,
      targetName: context?.targetName,
      outcome,
      resultLabel: copy.resultLabel,
      summary: copy.summary,
      nextStep: copy.nextStep,
      moodLabel: mood.label,
      moodSummary: `${mood.summary} ${mood.paceNote}`,
      bondNote: context?.bondNote || undefined,
      rescueRead: context?.rescueRead,
      openingNote: context?.openingNote,
      promiseNote: context?.promiseNote,
    };
  }

  private updateRescuePromiseAftermath(
    zoneId: string,
    zone: EncounterZone,
    outcome: WildEncounterDebrief["outcome"],
  ): string | undefined {
    if (outcome === "capture" || outcome === "calmedRetreat") {
      const memoryRead = this.getLeadRescueMemoryRead(zone);
      const strength = memoryRead?.elementMatch ? 2 : 1;
      this.rescuePromiseByZoneId[zoneId] = strength;
      return strength >= 2
        ? `${memoryRead?.shortLabel ?? "The lead"} turns the clean rescue into an origin promise; the next wild line here starts braced and focused.`
        : "The clean rescue leaves a sanctuary promise in this patch; the next wild line here starts braced.";
    }

    delete this.rescuePromiseByZoneId[zoneId];
    return undefined;
  }

  private describeWildOpeningInfluence(zone: EncounterZone): string | undefined {
    const notes: string[] = [];
    const memoryRead = this.getLeadRescueMemoryRead(zone);
    const fieldCallStrength = clamp(this.pendingFieldCallByZoneId[zone.id] ?? 0, 0, 2);
    const promiseStrength = clamp(this.rescuePromiseByZoneId[zone.id] ?? 0, 0, 2);
    const stewardship = this.getEncounterStewardshipBonus(zone.id);
    const ambientPressure = this.getAmbientEncounterPressure(zone.id);
    const moodLevel = this.getEncounterMoodLevel(zone.id);

    if (memoryRead) {
      notes.push(
        memoryRead.elementMatch
          ? `${memoryRead.shortLabel} gave the lead an origin-memory brace and focus read.`
          : `${memoryRead.shortLabel} gave the lead a rescue-memory brace.`,
      );
    }

    if (fieldCallStrength > 0) {
      notes.push(
        fieldCallStrength >= 2
          ? "The held origin call carried a stronger braced-plus-focused opening into the fight."
          : "The held field call kept the first exchange steadier.",
      );
    }

    if (promiseStrength > 0) {
      notes.push(
        promiseStrength >= 2
          ? "A prior clean rescue left an origin promise, bracing and focusing the next exchange."
          : "A prior clean rescue left a sanctuary promise, bracing the next exchange.",
      );
    }

    if (stewardship.label) {
      notes.push(`${stewardship.label} softened the local rescue pressure.`);
    }

    if (ambientPressure) {
      notes.push(ambientPressure.openingNote);
    }

    if (moodLevel !== 0) {
      const mood = this.getEncounterMood(zone.id);
      notes.push(`The patch entered the fight ${mood.summary.toLowerCase()}`);
    }

    return notes.length ? notes.join(" ") : undefined;
  }

  getActiveEncounterCaptureModifier(): number {
    if (!this.activeEncounterZoneId) {
      return 0;
    }

    const mentorBonus = this.getActiveEncounterStewardshipBonus();
    const fieldCallBonus = this.getActiveFieldCallStrength() * 0.04;
    const memoryBonus = this.getActiveRescueMemoryStrength() * 0.03;
    const promiseBonus = this.getActiveRescuePromiseStrength() * 0.03;
    switch (this.getEncounterMoodLevel(this.activeEncounterZoneId)) {
      case -2:
        return 0.12 + mentorBonus.captureBonus + fieldCallBonus + memoryBonus + promiseBonus;
      case -1:
        return 0.06 + mentorBonus.captureBonus + fieldCallBonus + memoryBonus + promiseBonus;
      case 1:
        return -0.05 + mentorBonus.captureBonus + fieldCallBonus + memoryBonus + promiseBonus;
      case 2:
        return -0.1 + mentorBonus.captureBonus + fieldCallBonus + memoryBonus + promiseBonus;
      default:
        return mentorBonus.captureBonus + fieldCallBonus + memoryBonus + promiseBonus;
    }
  }

  getActiveEncounterRetreatModifier(): number {
    if (!this.activeEncounterZoneId) {
      return 0;
    }

    const mentorBonus = this.getActiveEncounterStewardshipBonus();
    const fieldCallModifier = this.getActiveFieldCallStrength() * -0.04;
    const memoryModifier = this.getActiveRescueMemoryStrength() * -0.03;
    const promiseModifier = this.getActiveRescuePromiseStrength() * -0.03;
    switch (this.getEncounterMoodLevel(this.activeEncounterZoneId)) {
      case -2:
        return -0.1 + mentorBonus.retreatModifier + fieldCallModifier + memoryModifier + promiseModifier;
      case -1:
        return -0.05 + mentorBonus.retreatModifier + fieldCallModifier + memoryModifier + promiseModifier;
      case 1:
        return 0.08 + mentorBonus.retreatModifier + fieldCallModifier + memoryModifier + promiseModifier;
      case 2:
        return 0.16 + mentorBonus.retreatModifier + fieldCallModifier + memoryModifier + promiseModifier;
      default:
        return mentorBonus.retreatModifier + fieldCallModifier + memoryModifier + promiseModifier;
    }
  }

  hasActiveHeldFieldCall(): boolean {
    return Boolean(
      this.activeEncounterZoneId && this.pendingFieldCallByZoneId[this.activeEncounterZoneId],
    );
  }

  getActiveFieldCallStrength(): number {
    if (!this.activeEncounterZoneId) {
      return 0;
    }

    return clamp(this.pendingFieldCallByZoneId[this.activeEncounterZoneId] ?? 0, 0, 2);
  }

  getActiveRescueMemoryStrength(): number {
    const read = this.getActiveEncounterRescueMemoryRead();
    if (!read) {
      return 0;
    }

    return read.elementMatch ? 2 : 1;
  }

  getActiveRescuePromiseStrength(): number {
    if (!this.activeEncounterZoneId) {
      return 0;
    }

    return clamp(this.rescuePromiseByZoneId[this.activeEncounterZoneId] ?? 0, 0, 2);
  }

  getActiveEncounterRescueMemoryRead():
    | {
        shortLabel: string;
        detail: string;
        elementMatch: boolean;
      }
    | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = this.currentScene.encounterZones.find(
      (candidate) => candidate.id === this.activeEncounterZoneId,
    );
    return zone ? this.getLeadRescueMemoryRead(zone) : undefined;
  }

  getActiveEncounterRescueMemoryReadForVivo(
    vivo: VivoInstance,
  ):
    | {
        shortLabel: string;
        detail: string;
        elementMatch: boolean;
      }
    | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = this.currentScene.encounterZones.find(
      (candidate) => candidate.id === this.activeEncounterZoneId,
    );
    return zone ? this.getVivoRescueMemoryRead(vivo, zone) : undefined;
  }

  grantActiveOriginCalmSignalBond(): string | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = this.currentScene.encounterZones.find(
      (candidate) => candidate.id === this.activeEncounterZoneId,
    );
    if (!zone?.attunementElement) {
      return undefined;
    }

    const lead = this.getPartyLead();
    const memoryRead = this.getLeadRescueMemoryRead(zone);
    if (!memoryRead?.elementMatch) {
      return undefined;
    }

    const total = this.grantAttunement(lead, zone.attunementElement, 1);
    this.renderHud();
    this.scheduleProgressSave();
    return `${memoryRead.shortLabel} leaves ${lead.nickname} with ${total} ${this.formatElementName(zone.attunementElement).toLowerCase()} bond mark${total === 1 ? "" : "s"} from the calm signal.`;
  }

  grantActiveRescuePromiseCalmSignalBond(): string | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = this.currentScene.encounterZones.find(
      (candidate) => candidate.id === this.activeEncounterZoneId,
    );
    if (!zone?.attunementElement) {
      return undefined;
    }

    const promiseStrength = this.getActiveRescuePromiseStrength();
    if (promiseStrength <= 0) {
      return undefined;
    }

    const lead = this.getPartyLead();
    const amount = promiseStrength >= 2 ? 2 : 1;
    const total = this.grantAttunement(lead, zone.attunementElement, amount);
    const promiseLabel = promiseStrength >= 2 ? "origin promise" : "rescue promise";
    const elementName = this.formatElementName(zone.attunementElement).toLowerCase();
    this.renderHud();
    this.scheduleProgressSave();
    return `The held ${promiseLabel} leaves ${lead.nickname} with ${total} ${elementName} bond mark${total === 1 ? "" : "s"} from the calm signal.`;
  }

  private describeActiveLeadAssignmentRead(): string | undefined {
    if (!this.activeEncounterZoneId) {
      return undefined;
    }

    const zone = this.currentScene.encounterZones.find(
      (candidate) => candidate.id === this.activeEncounterZoneId,
    );
    if (!zone) {
      return undefined;
    }

    const notes: string[] = [];
    const lead = this.getPartyLead();
    const memoryRead = this.getLeadRescueMemoryRead(zone);
    const promiseStrength = clamp(this.rescuePromiseByZoneId[zone.id] ?? 0, 0, 2);
    const heldCallStrength = clamp(this.pendingFieldCallByZoneId[zone.id] ?? 0, 0, 2);

    if (memoryRead) {
      notes.push(
        memoryRead.elementMatch
          ? `${memoryRead.shortLabel} resonates here, so ${lead.nickname} can open the next wild battle braced and focused.`
          : `${memoryRead.shortLabel} matches this patch, so ${lead.nickname} can open the next wild battle braced.`,
      );
    } else if (zone.attunementElement) {
      notes.push(
        `${this.formatBiomeName(zone.biome)} grows ${this.formatElementName(zone.attunementElement).toLowerCase()} bond marks, but ${lead.nickname} has no matching rescue memory here yet.`,
      );
    }

    if (heldCallStrength > 0) {
      notes.push(
        heldCallStrength >= 2
          ? "The held origin call will carry a stronger first exchange."
          : "The held field call will still brace the next opening.",
      );
    }

    if (promiseStrength > 0) {
      notes.push(
        promiseStrength >= 2
          ? "An origin promise is waiting in this patch."
          : "A rescue promise is waiting in this patch.",
      );
    }

    return notes.join(" ");
  }

  private getActiveEncounterStewardshipBonus(): {
    captureBonus: number;
    retreatModifier: number;
    label?: string;
  } {
    if (!this.activeEncounterZoneId) {
      return {
        captureBonus: 0,
        retreatModifier: 0,
      };
    }

    return this.getEncounterStewardshipBonus(this.activeEncounterZoneId);
  }

  private getEncounterStewardshipBonus(zoneId: string): {
    captureBonus: number;
    retreatModifier: number;
    label?: string;
  } {
    const sceneMatch = Object.values(sceneDex).find((scene) =>
      scene.encounterZones.some((zone) => zone.id === zoneId),
    );

    const stewardshipRules: Array<{
      sceneIds: string[];
      trainerId: string;
      captureBonus: number;
      retreatModifier: number;
      label: string;
    }> = [
      {
        sceneIds: ["lanternNursery"],
        trainerId: "nurseryTenderSola",
        captureBonus: 0.04,
        retreatModifier: -0.05,
        label: "Sola's nursery read",
      },
      {
        sceneIds: ["sanctuaryTrail"],
        trainerId: "trailAuditorVale",
        captureBonus: 0.03,
        retreatModifier: -0.04,
        label: "Vale's audit reprieve",
      },
      {
        sceneIds: ["sanctuaryTrail"],
        trainerId: "trailWardenNera",
        captureBonus: 0.04,
        retreatModifier: -0.05,
        label: "Nera's trail read",
      },
      {
        sceneIds: ["glassrootBurrow"],
        trainerId: "burrowWardenTovin",
        captureBonus: 0.05,
        retreatModifier: -0.06,
        label: "Tovin's burrow read",
      },
      {
        sceneIds: ["starglassRoost"],
        trainerId: "roostWatcherMiren",
        captureBonus: 0.05,
        retreatModifier: -0.06,
        label: "Miren's roost read",
      },
      {
        sceneIds: ["emberHollow"],
        trainerId: "ashScoutIven",
        captureBonus: 0.05,
        retreatModifier: -0.06,
        label: "Iven's ember read",
      },
      {
        sceneIds: ["moonfenMarsh"],
        trainerId: "moonfenKeeperOrla",
        captureBonus: 0.06,
        retreatModifier: -0.08,
        label: "Orla's marsh read",
      },
    ];

    const activeRules = stewardshipRules.filter(
      (candidate) =>
        sceneMatch &&
        candidate.sceneIds.includes(sceneMatch.id) &&
        this.defeatedTrainerIds.has(candidate.trainerId),
    );

    if (activeRules.length > 0) {
      const captureBonus = activeRules.reduce((total, rule) => total + rule.captureBonus, 0);
      const retreatModifier = activeRules.reduce((total, rule) => total + rule.retreatModifier, 0);
      return {
        captureBonus: Math.min(0.08, captureBonus),
        retreatModifier: Math.max(-0.11, retreatModifier),
        label: activeRules.map((rule) => rule.label).join(" + "),
      };
    }

    return {
      captureBonus: 0,
      retreatModifier: 0,
    };
  }

  debugSetEncounterMood(
    zoneId: string,
    mood: "settled" | "steady" | "spooked" | "scattered",
  ): boolean {
    const zoneExists = Object.values(sceneDex).some((scene) =>
      scene.encounterZones.some((candidate) => candidate.id === zoneId),
    );
    if (!zoneExists) {
      return false;
    }

    const valueByMood = {
      settled: -1,
      steady: 0,
      spooked: 1,
      scattered: 2,
    } as const;
    this.encounterMoodByZoneId[zoneId] = valueByMood[mood];
    this.renderHud();
    return true;
  }

  openSanctuaryLedger() {
    if (this.reserve.length === 0) {
      this.sanctuaryState = undefined;
      this.renderHud();
      return "No rescued reserve Vivos are waiting yet.";
    }

    this.sanctuaryState = {
      selectedPartyIndex: 0,
      selectedReserveIndex: 0,
    };
    this.renderHud();
    this.scheduleProgressSave();
    return "Choose an active Vivo and a reserve partner to swap before the next route push.";
  }

  openDialogue(lines: DialogueLine[], onComplete?: () => void) {
    if (lines.length === 0) {
      onComplete?.();
      return;
    }

    this.activeDialogue = {
      lines,
      index: 0,
    };
    this.dialogueOnComplete = onComplete;
    this.renderHud();
  }

  advanceDialogue() {
    if (!this.activeDialogue) {
      return;
    }

    if (this.activeDialogue.index < this.activeDialogue.lines.length - 1) {
      this.activeDialogue.index += 1;
      this.renderHud();
      return;
    }

    this.activeDialogue = undefined;
    const onComplete = this.dialogueOnComplete;
    this.dialogueOnComplete = undefined;
    onComplete?.();
    this.renderHud();
    this.scheduleProgressSave();
  }

  advanceEncounterZone(zone: EncounterZone, distance: number): boolean {
    this.advanceLeadAttunement(zone, distance);
    const nextBudget =
      (this.encounterStepBudgets[zone.id] ?? this.rollEncounterBudget(zone)) -
      this.getEncounterStrideDrain(zone, distance);
    this.encounterStepBudgets[zone.id] = nextBudget;
    if (nextBudget > 0) {
      this.renderHud();
      return false;
    }

    this.encounterStepBudgets[zone.id] = this.rollEncounterBudget(zone);
    this.startWildBattle(zone);
    return true;
  }

  getEncounterPressure(zoneId: string): "calm" | "stirring" | "imminent" | "unknown" {
    const zone = this.currentScene.encounterZones.find((candidate) => candidate.id === zoneId);
    if (!zone) {
      return "unknown";
    }
    const budget = this.encounterStepBudgets[zoneId];
    if (budget === undefined) {
      return "calm";
    }

    const [, maxSteps] = zone.stepRange;
    const ratio = clamp(budget / maxSteps, 0, 1);
    if (ratio <= 0.28) {
      return "imminent";
    }
    if (ratio <= 0.62) {
      return "stirring";
    }
    return "calm";
  }

  getEncounterForecast(zoneId: string):
    | {
        remainingStrides: number;
        paceMultiplier: number;
      }
    | undefined {
    const zone = this.currentScene.encounterZones.find((candidate) => candidate.id === zoneId);
    if (!zone) {
      return undefined;
    }

    const paceMultiplier = this.getEncounterPaceMultiplier(zone);
    return {
      remainingStrides: Math.max(
        0,
        Math.ceil(this.encounterStepBudgets[zoneId] ?? (zone.stepRange[0] + zone.stepRange[1]) / 2),
      ),
      paceMultiplier,
    };
  }

  getEncounterMood(zoneId: string): {
    label: "settled" | "steady" | "spooked" | "scattered";
    summary: string;
    paceNote: string;
  } {
    switch (this.getEncounterMoodLevel(zoneId)) {
      case -2:
        return {
          label: "settled",
          summary: "The habitat is calm and rescue lines are holding close.",
          paceNote: "Wilds are surfacing sooner and capture lines are steadier here.",
        };
      case -1:
        return {
          label: "settled",
          summary: "The patch is settling after a careful exchange.",
          paceNote: "Wilds are easier to approach and less likely to bolt.",
        };
      case 1:
        return {
          label: "spooked",
          summary: "The patch is restless after the last clash.",
          paceNote: "Wilds are harder to settle and more likely to break away.",
        };
      case 2:
        return {
          label: "scattered",
          summary: "The habitat is scattered and the local line is avoiding pressure.",
          paceNote: "Encounters take longer to stir and frightened targets bolt faster.",
        };
      default:
        return {
          label: "steady",
          summary: "The habitat is holding a normal sanctuary rhythm.",
          paceNote: "Wilds are moving through the patch at their authored baseline.",
        };
    }
  }

  getWildBattleOpeningTempo(zone: EncounterZone): BattleSetup["initialTempo"] {
    const mood = this.getEncounterMoodLevel(zone.id);
    const biomeName = this.formatBiomeName(zone.biome).toLowerCase();

    if (mood <= -2) {
      return {
        side: "enemy",
        effects: ["exposed"],
        log: `The settled ${biomeName} lets the rescue line approach gently; the wild Vivo starts with a readable opening.`,
        cueLabel: "Settled habitat",
      };
    }

    if (mood === -1) {
      return {
        side: "player",
        effects: ["guarded"],
        log: `The calming ${biomeName} gives your lead a steady first handoff.`,
        cueLabel: "Calm habitat",
      };
    }

    if (mood === 1) {
      return {
        side: "enemy",
        effects: ["guarded"],
        log: `The spooked ${biomeName} makes the wild Vivo brace against the first approach.`,
        cueLabel: "Spooked habitat",
      };
    }

    if (mood >= 2) {
      return {
        side: "enemy",
        effects: ["guarded", "focused"],
        log: `The scattered ${biomeName} pushes the wild Vivo into a guarded, frantic first line.`,
        cueLabel: "Scattered habitat",
      };
    }

    return undefined;
  }

  getWildBattleInitialTempo(zone: EncounterZone): BattleSetup["initialTempo"] {
    const initialTempo = [
      this.getWildBattleOpeningTempo(zone),
      this.getRescueMemoryOpeningTempo(zone),
      this.getFieldCallOpeningTempo(zone),
      this.getRescuePromiseOpeningTempo(zone),
    ].filter((tempo): tempo is InitialTempoState => Boolean(tempo));

    return initialTempo.length > 0 ? initialTempo : undefined;
  }

  getRescueMemoryOpeningTempo(zone: EncounterZone): BattleSetup["initialTempo"] {
    const lead = this.getPartyLead();
    const memoryRead = this.getLeadRescueMemoryRead(zone);
    if (!memoryRead) {
      return undefined;
    }

    const elementMatch =
      lead.rescueMemory?.bondElement &&
      zone.attunementElement &&
      lead.rescueMemory.bondElement === zone.attunementElement;

    return {
      side: "player",
      effects: elementMatch ? ["guarded", "focused"] : ["guarded"],
      log: elementMatch
        ? `${lead.nickname}'s ${memoryRead.shortLabel.toLowerCase()} memory answers the ${this.formatBiomeName(zone.biome).toLowerCase()}; the lead opens braced and focused.`
        : `${lead.nickname} recognizes ${memoryRead.shortLabel.toLowerCase()} and opens the wild exchange braced.`,
      cueLabel: elementMatch ? "Origin memory" : "Lead memory",
    };
  }

  getFieldCallOpeningTempo(zone: EncounterZone): BattleSetup["initialTempo"] {
    const fieldCallStrength = clamp(this.pendingFieldCallByZoneId[zone.id] ?? 0, 0, 2);
    if (fieldCallStrength <= 0) {
      return undefined;
    }

    return {
      side: "player",
      effects: fieldCallStrength >= 2 ? ["guarded", "focused"] : ["guarded"],
      log:
        fieldCallStrength >= 2
          ? `The held field call resonates with your lead's rescue memory in the ${this.formatBiomeName(zone.biome).toLowerCase()}; the line opens braced and focused.`
          : `The held field call carries into the ${this.formatBiomeName(zone.biome).toLowerCase()}; your lead opens braced while the wild line reads the calmer wrap.`,
      cueLabel: fieldCallStrength >= 2 ? "Origin call" : "Field call",
    };
  }

  getRescuePromiseOpeningTempo(zone: EncounterZone): BattleSetup["initialTempo"] {
    const promiseStrength = clamp(this.rescuePromiseByZoneId[zone.id] ?? 0, 0, 2);
    if (promiseStrength <= 0) {
      return undefined;
    }

    return {
      side: "player",
      effects: promiseStrength >= 2 ? ["guarded", "focused"] : ["guarded"],
      log:
        promiseStrength >= 2
          ? `The last clean rescue left an origin promise in the ${this.formatBiomeName(zone.biome).toLowerCase()}; your lead opens braced and focused.`
          : `The last clean rescue left a sanctuary promise in the ${this.formatBiomeName(zone.biome).toLowerCase()}; your lead opens braced.`,
      cueLabel: promiseStrength >= 2 ? "Origin promise" : "Rescue promise",
    };
  }

  private getLeadRescueMemoryRead(zone: EncounterZone):
    | {
        shortLabel: string;
        detail: string;
        elementMatch: boolean;
      }
    | undefined {
    return this.getVivoRescueMemoryRead(this.getPartyLead(), zone);
  }

  private getVivoRescueMemoryRead(
    vivo: VivoInstance,
    zone: EncounterZone,
  ):
    | {
        shortLabel: string;
        detail: string;
        elementMatch: boolean;
      }
    | undefined {
    const memory = vivo.rescueMemory;
    if (!memory) {
      return undefined;
    }

    const source = memory.source.toLowerCase();
    const sceneMatch = source.includes(this.currentScene.name.toLowerCase());
    const biomeMatch = source.includes(this.formatBiomeName(zone.biome).toLowerCase());
    const elementMatch =
      memory.bondElement !== undefined &&
      zone.attunementElement !== undefined &&
      memory.bondElement === zone.attunementElement;

    if (!sceneMatch && !biomeMatch && !elementMatch) {
      return undefined;
    }

    const label = sceneMatch || biomeMatch ? memory.source : `${this.formatElementName(memory.bondElement!)} rescue line`;
    const detail = elementMatch
      ? `${vivo.nickname}'s origin bond matches this patch, so the next wild battle opens guarded and focused.`
      : `${vivo.nickname}'s rescue memory matches this place, so the next wild battle opens guarded.`;
    return {
      shortLabel: label,
      detail,
      elementMatch,
    };
  }

  private renderLeadRescueMemoryReadMarkup(zone: EncounterZone): string {
    const read = this.getLeadRescueMemoryRead(zone);
    if (!read) {
      return "";
    }

    return `<p class="prep-tag ready"><strong>Lead memory:</strong> ${read.detail}</p>`;
  }

  private renderRosterRescueMemoryRouteMarkup(vivo: VivoInstance, index: number): string {
    if (!vivo.rescueMemory || this.currentScene.encounterZones.length === 0) {
      return "";
    }

    const reads = this.currentScene.encounterZones
      .map((zone) => ({
        zone,
        read: this.getVivoRescueMemoryRead(vivo, zone),
      }))
      .filter(
        (
          entry,
        ): entry is {
          zone: EncounterZone;
          read: { shortLabel: string; detail: string; elementMatch: boolean };
        } => Boolean(entry.read),
      )
      .sort((left, right) => Number(right.read.elementMatch) - Number(left.read.elementMatch));

    if (reads.length === 0) {
      return "";
    }

    const strongest = reads[0];
    const leadCopy =
      index === 0
        ? "Keep this Vivo leading before the next wild surge."
        : `Use field hotkey ${index + 1} or Take lead before entering that patch.`;
    const resonance = strongest.read.elementMatch ? "Origin route" : "Memory route";
    return `<p class="roster-memory route-read"><strong>${resonance}:</strong> ${strongest.read.shortLabel} answers ${this.formatBiomeName(strongest.zone.biome)} here. ${leadCopy}</p>`;
  }

  debugHoldFieldCall(zoneId: string): boolean {
    const zone = Object.values(sceneDex)
      .flatMap((scene) => scene.encounterZones)
      .find((candidate) => candidate.id === zoneId);
    if (!zone) {
      return false;
    }

    this.pendingFieldCallByZoneId[zoneId] = this.getLeadRescueMemoryRead(zone)?.elementMatch ? 2 : 1;
    this.renderHud();
    return true;
  }

  debugPrimeRescuePromise(zoneId: string, strength = 1): boolean {
    const zoneExists = Object.values(sceneDex).some((scene) =>
      scene.encounterZones.some((candidate) => candidate.id === zoneId),
    );
    if (!zoneExists) {
      return false;
    }

    this.rescuePromiseByZoneId[zoneId] = clamp(strength, 1, 2);
    this.renderHud();
    return true;
  }

  debugStampLeadRescueMemory(source: string, bondElement?: ElementType): boolean {
    return this.debugStampPartyRescueMemory(0, source, bondElement);
  }

  debugStampPartyRescueMemory(index: number, source: string, bondElement?: ElementType): boolean {
    const vivo = this.party[index];
    if (!vivo) {
      return false;
    }

    this.stampRescueMemory(vivo, {
      source,
      method: "debug",
      note: `${vivo.nickname} carries a debug rescue memory from ${source}.`,
      bondElement,
      bondAmount: bondElement ? 2 : undefined,
    });
    if (bondElement) {
      this.grantAttunement(vivo, bondElement, 2);
    }
    this.renderHud();
    return true;
  }

  steadyActiveEncounterZone(): string {
    if (!this.activeEncounterZoneId) {
      return "Step into a habitat patch before calling the line to stillness.";
    }

    const zone = this.currentScene.encounterZones.find(
      (candidate) => candidate.id === this.activeEncounterZoneId,
    );
    if (!zone) {
      return "This habitat read has drifted out of range.";
    }

    const before = this.getEncounterMoodLevel(zone.id);
    if (before <= -2) {
      return `${this.formatBiomeName(zone.biome)} is already settled. Keep moving gently or choose the next rescue line.`;
    }

    const memoryRead = this.getLeadRescueMemoryRead(zone);
    const fieldCallStrength = memoryRead?.elementMatch ? 2 : 1;
    this.adjustEncounterMood(zone.id, -fieldCallStrength);
    this.pendingFieldCallByZoneId[zone.id] = fieldCallStrength;
    const lead = this.getPartyLead();
    const bondLine = zone.attunementElement
      ? ` ${lead.nickname}'s careful field call leaves ${this.grantAttunement(lead, zone.attunementElement, 1)} ${this.formatElementName(zone.attunementElement).toLowerCase()} bond mark${(lead.attunementByElement[zone.attunementElement] ?? 0) === 1 ? "" : "s"} on the route.`
      : "";
    this.encounterStepBudgets[zone.id] = Math.max(
      this.encounterStepBudgets[zone.id] ?? zone.stepRange[0],
      Math.round(zone.stepRange[0] * (fieldCallStrength >= 2 ? 0.85 : 0.65)),
    );
    const after = this.getEncounterMood(zone.id);
    this.renderHud();
    this.scheduleProgressSave();
    const memoryLine = memoryRead?.elementMatch
      ? ` ${memoryRead.shortLabel} answers the call, so the next wild battle starts with a stronger origin read.`
      : memoryRead
        ? ` ${memoryRead.shortLabel} helps the lead keep the line from fraying.`
        : "";
    return `You hold the field call low and give ${this.formatBiomeName(zone.biome)} room to breathe.${memoryLine}${bondLine} ${after.summary} ${after.paceNote}`;
  }

  renderHud() {
    const isBattleActive = Boolean(this.battle);
    this.hudRoot.classList.toggle("battle-hud-panel", isBattleActive);
    document.body.classList.toggle("battle-active", isBattleActive);

    const saveMarkup = this.renderSaveMarkup();
    const dialogueMarkup = this.renderDialogueMarkup();
    const sanctuaryMarkup = this.renderSanctuaryMarkup();
    const lessonDebriefMarkup = this.renderLessonDebriefMarkup();
    const wildDebriefMarkup = this.renderWildDebriefMarkup();
    const tacticalPrepMarkup = this.renderTacticalPrepMarkup();
    const partyMarkup = this.party
      .map((vivo, index) => {
        const selected = this.sanctuaryState?.selectedPartyIndex === index;
        return this.renderRosterCard(vivo, {
          scope: "party",
          index,
          selected,
          showLeadButton: !this.sanctuaryState && !this.battle && !this.activeDialogue,
        });
      })
      .join("");

    const reserveMarkup =
      this.reserve.length === 0
        ? "<p class=\"hud-mini\">No rescued reserve Vivos yet.</p>"
        : `<div class="roster-grid">${this.reserve
            .map((vivo, index) =>
              this.renderRosterCard(vivo, {
                scope: "reserve",
                index,
                selected: this.sanctuaryState?.selectedReserveIndex === index,
              }),
            )
            .join("")}</div>`;
    const habitatGuide = this.currentScene.encounterZones.length
      ? `<div class="study-grid">${this.currentScene.encounterZones
          .map((zone) => {
            const totalEncounterWeight = zone.encounterTable.reduce(
              (total, entry) => total + entry.weight,
              0,
            );
            const speciesList = zone.encounterTable
              .slice()
              .sort((left, right) => right.weight - left.weight)
              .map((entry) => {
                const share = totalEncounterWeight > 0 ? entry.weight / totalEncounterWeight : 0;
                return `${speciesDex[entry.speciesId].name} ${this.formatEncounterRarity(share)}`;
              })
              .join(", ");
            const activeTag = zone.id === this.activeEncounterZoneId ? "Underfoot now" : "Scout ahead";
            const pressure = this.getEncounterPressure(zone.id);
            const forecast = this.getEncounterForecast(zone.id);
            const mood = this.getEncounterMood(zone.id);
            const attunementLine = zone.attunementElement
              ? `${this.formatElementName(zone.attunementElement)} bond path grows here.`
              : "No authored bond path tied to this patch.";
            const forecastLine = forecast
              ? `Next surge in about ${forecast.remainingStrides} strides through a ${this.describeEncounterPace(forecast.paceMultiplier)}.`
              : "Encounter pressure is still settling.";
            const stewardship = this.getEncounterStewardshipBonus(zone.id);
            const stewardshipMarkup = stewardship.label
              ? `<p class="prep-tag ready"><strong>Stewardship:</strong> ${stewardship.label} steadies rescue pulses and keeps wilds from bolting as quickly.</p>`
              : "";
            const ambientPressure = this.getAmbientEncounterPressure(zone.id);
            const ambientPressureMarkup = ambientPressure
              ? `<p class="prep-tag warning"><strong>${ambientPressure.label}:</strong> ${ambientPressure.scoutNote}</p>`
              : "";
            const rescuePromiseStrength = clamp(this.rescuePromiseByZoneId[zone.id] ?? 0, 0, 2);
            const rescuePromiseMarkup = rescuePromiseStrength
              ? `<p class="prep-tag ready"><strong>Rescue promise:</strong> ${
                  rescuePromiseStrength >= 2
                    ? "A clean origin rescue is still holding here; the next wild battle opens braced and focused."
                    : "A clean rescue is still holding here; the next wild battle opens with your lead braced."
                }</p>`
              : "";
            const steadyActionMarkup =
              zone.id === this.activeEncounterZoneId
                ? `<button class="inline-hud-button habitat-call" data-world-action="steady-habitat">Hold field call</button>`
                : "";
            return `
              <article class="prep-card scout-card${zone.id === this.activeEncounterZoneId ? " active" : ""}">
                <p class="prep-meta">${activeTag}</p>
                <h3 class="prep-title">${this.formatBiomeName(zone.biome)}</h3>
                <p class="hud-copy">Lv ${zone.levelRange[0]}-${zone.levelRange[1]} wilds. ${this.formatEncounterPressure(pressure)} at ${Math.round(zone.encounterRate * 100)}% route pressure.</p>
                <p class="hud-mini">${zone.stepRange[0]}-${zone.stepRange[1]} stride band. ${forecastLine}</p>
                <div class="prep-tools">
                  <p class="prep-tag ${this.getEncounterMoodTone(mood.label)}"><strong>Habitat temper:</strong> ${mood.summary}</p>
                  <p class="prep-tag ${this.getEncounterMoodTone(mood.label)}"><strong>Aftermath:</strong> ${mood.paceNote}</p>
                  ${
                    this.pendingFieldCallByZoneId[zone.id]
                      ? `<p class="prep-tag ready"><strong>Held call:</strong> ${
                          (this.pendingFieldCallByZoneId[zone.id] ?? 0) >= 2
                            ? "Origin memory is resonating; the next wild battle opens braced and focused with a stronger rescue read."
                            : "The next wild battle opens with your lead braced and rescue pressure steadier."
                        }</p>`
                      : ""
                  }
                  ${rescuePromiseMarkup}
                  ${ambientPressureMarkup}
                  ${stewardshipMarkup}
                  ${this.renderLeadRescueMemoryReadMarkup(zone)}
                </div>
                ${steadyActionMarkup}
                <p class="hud-mini">${attunementLine}</p>
                <p class="hud-mini"><strong>Likely Vivos:</strong> ${speciesList}</p>
                ${this.renderBattlefieldReadMarkup(
                  zone.battlefieldCondition ?? this.currentScene.battlefieldCondition,
                )}
              </article>
            `;
          })
          .join("")}</div>`
      : "<p class=\"hud-mini\">No random habitat encounters in this scene.</p>";

    const lead = this.getPartyLead();
    const leadSpecies = speciesDex[lead.speciesId];
    const fieldStudyMarkup = this.renderFieldStudyMarkup();
    const bondPathMarkup = leadSpecies.formTransitions?.length
      ? `<ul class="hud-list">${leadSpecies.formTransitions
          .map((transition) => {
            const winCount = lead.winsByElement[transition.requiredWinsInElement] ?? 0;
            const attunementElement =
              transition.requiredAttunementInElement ?? transition.requiredWinsInElement;
            const attunementCount = lead.attunementByElement[attunementElement] ?? 0;
            const attunementRequirement = transition.requiredAttunement ?? 0;
            const bonusSummary = this.describeFormBonuses(transition);
            const awakenMove = transition.awakenMoveId
              ? ` - Awakens ${moveDex[transition.awakenMoveId].name}`
              : "";
            return `<li><strong>${transition.name}</strong> - Lv ${lead.level}/${transition.requiredLevel} - ${this.formatElementName(transition.requiredWinsInElement)} wins ${winCount}/1 - ${this.formatElementName(attunementElement)} bond ${attunementCount}/${attunementRequirement}${bonusSummary}${awakenMove}</li>`;
          })
          .join("")}</ul>`
      : `<p class="hud-mini">${lead.nickname} has no authored form path yet.</p>`;

    let battleMarkup = "";
    if (this.battle) {
      battleMarkup = this.battle.renderControls();
      this.hudRoot.innerHTML = battleMarkup;
      return;
    } else {
      const campaign = this.getCampaignProgression();
      battleMarkup = `
        <div class="hud-section">
          <p class="hud-label">Campaign · Chapter ${campaign.chapterNumber}</p>
          <h2 class="hud-title">${campaign.objective}</h2>
          <p class="hud-copy">${this.currentMessage}</p>
          <div class="banner"><strong>${campaign.chapterTitle}</strong> · ${campaign.summary}</div>
        </div>
      `;
    }

    const fieldCommandsMarkup = this.battle
      ? ""
      : `
        <div class="hud-section">
          <p class="hud-label">Field Commands</p>
          <h2 class="hud-title">Route-side quick controls</h2>
          <p class="hud-copy">Keep route planning in motion without digging through the whole journal between encounters.</p>
          <div class="pill-row hotkey-pills">
            <span class="pill hotkey-pill">Space / Enter interact</span>
            <span class="pill hotkey-pill">1-6 set field lead</span>
            <span class="pill hotkey-pill">F hold field call</span>
            <span class="pill hotkey-pill">Lead slot absorbs habitat bond marks</span>
          </div>
        </div>
      `;

    this.hudRoot.innerHTML = `
      ${dialogueMarkup}
      ${saveMarkup}
      <div class="hud-section">
        <p class="hud-label">Scene</p>
        <h2 class="hud-title">${this.currentScene.name}</h2>
        <p class="hud-copy">${this.currentScene.description}</p>
        <p class="hud-mini">Badges: ${this.badges} - Lead bond form: ${lead.formName ?? "Unawakened"}</p>
      </div>
      ${battleMarkup}
      ${fieldStudyMarkup}
      ${lessonDebriefMarkup}
      ${wildDebriefMarkup}
      ${fieldCommandsMarkup}
      ${sanctuaryMarkup}
      <div class="hud-section">
        <p class="hud-label">Bond Path</p>
        <p class="hud-copy">${lead.nickname} grows through habitat exposure, shrine resonance, and elemental victories.</p>
        ${bondPathMarkup}
      </div>
      <div class="hud-section">
        <p class="hud-label">Active Roster</p>
        <p class="hud-copy">Set the lead before a route push to control who absorbs habitat bond marks and who stands first in the next rescue battle. Press the matching number key while exploring to promote a healthy active Vivo instantly, then press F inside a patch to hold a field call.</p>
        <div class="roster-grid">${partyMarkup}</div>
      </div>
      <div class="hud-section">
        <p class="hud-label">Reserve Sanctuary</p>
        <p class="hud-copy">Keep extra rescues close enough to rotate into the active six before the next route lesson or gym push.</p>
        ${reserveMarkup}
      </div>
      <div class="hud-section">
        <p class="hud-label">Habitat Scout</p>
        <p class="hud-copy">Each encounter patch keeps its own Vivo mix and level band so you can plan captures and elemental growth.</p>
        ${habitatGuide}
      </div>
      ${tacticalPrepMarkup}
      <div class="hud-section">
        <p class="hud-label">Recovery Route</p>
        <h2 class="hud-title">${this.recoveryAnchor.label}</h2>
        <p class="hud-copy">A full party wipe now retreats to ${this.recoveryAnchor.sceneName} instead of always hard-resetting to the opening town bridge.</p>
        <p class="hud-mini">Current fallback scene: ${this.recoveryAnchor.sceneName}</p>
      </div>
      <div class="hud-section">
        <p class="hud-label">Play Verbs</p>
        <div class="pill-row">
          <span class="pill">Traverse painted scenes</span>
          <span class="pill">Trigger habitat encounters</span>
          <span class="pill">Capture wild Vivos</span>
          <span class="pill">Learn stronger attacks</span>
          <span class="pill">Brace, expose, and punish openings</span>
          <span class="pill">Evolve through elemental victories</span>
        </div>
      </div>
    `;
  }

  flushProgressSave() {
    this.persistProgressNow();
  }

  saveProgressNow(): boolean {
    return this.persistProgressNow();
  }

  saveProgressToSlot(slot: number): boolean {
    this.saveSlot = this.normalizeSaveSlot(slot);
    return this.persistProgressNow();
  }

  startNewProgressSlot(slot: number): boolean {
    if (!this.enablePersistence || this.battle) {
      return false;
    }
    const normalizedSlot = this.normalizeSaveSlot(slot);
    window.localStorage.removeItem(getSaveStorageKey(normalizedSlot));
    this.resetToNewGame(normalizedSlot);
    return this.persistProgressNow();
  }

  loadProgressFromStorage(slot = this.saveSlot): boolean {
    if (!this.enablePersistence || this.battle) {
      return false;
    }
    this.saveSlot = this.normalizeSaveSlot(slot);
    this.activeDialogue = undefined;
    this.activeRescueEncounter = undefined;
    this.restoreProgress();
    this.renderHud();
    this.onWorldRefresh?.();
    return this.saveStatus === "saved";
  }

  deleteProgressSlot(slot: number): boolean {
    if (!this.enablePersistence || this.battle) {
      return false;
    }
    const normalizedSlot = this.normalizeSaveSlot(slot);
    window.localStorage.removeItem(getSaveStorageKey(normalizedSlot));
    if (normalizedSlot === this.saveSlot) {
      this.resetToNewGame(normalizedSlot);
    }
    return true;
  }

  getFieldLogSummary(slot = this.saveSlot): {
    persistenceEnabled: boolean;
    hasSave: boolean;
    slot: number;
    savedAt?: string;
    sceneName: string;
    partyCount: number;
    reserveCount: number;
    badges: number;
    badgeIds: CampaignBadgeId[];
    badgeTitles: string[];
    stewardshipEvidenceIds: StewardshipEvidenceId[];
    stewardshipEvidenceTitles: string[];
    chapterId: CampaignChapterId;
    chapterTitle: string;
    chapterComplete: boolean;
    playTimeSeconds: number;
    chapterCompletedAtSeconds?: number;
    chapterPacing?: CampaignPacingAssessment;
  } {
    const normalizedSlot = this.normalizeSaveSlot(slot);
    const fallback = {
      persistenceEnabled: this.enablePersistence,
      hasSave: false,
      slot: normalizedSlot,
      sceneName: this.currentScene.name,
      partyCount: this.party.length,
      reserveCount: this.reserve.length,
      badges: this.badges,
      badgeIds: this.getBadgeIds(),
      badgeTitles: this.getBadgeIds().map((badgeId) => CAMPAIGN_BADGE_TITLES[badgeId]),
      stewardshipEvidenceIds: this.getStewardshipEvidenceIds(),
      stewardshipEvidenceTitles: this.getStewardshipEvidenceIds().map(
        (evidenceId) => STEWARDSHIP_EVIDENCE_TITLES[evidenceId],
      ),
      chapterId: this.getCampaignProgression().chapterId,
      chapterTitle: this.getCampaignProgression().chapterTitle,
      chapterComplete: this.getCampaignProgression().complete,
      playTimeSeconds: this.getPlayTimeSeconds(),
      chapterCompletedAtSeconds: this.campaignMilestones[this.getCampaignProgression().chapterId],
      chapterPacing: this.getCampaignPacingAssessment(),
    };

    if (!this.enablePersistence) {
      return fallback;
    }

    try {
      const raw = window.localStorage.getItem(getSaveStorageKey(normalizedSlot));
      if (!raw) {
        return fallback;
      }
      const snapshot = JSON.parse(raw) as Partial<SaveSnapshot>;
      const scene = snapshot.currentSceneId ? sceneDex[snapshot.currentSceneId] : undefined;
      if (snapshot.version !== 1 || !scene) {
        return fallback;
      }
      const chapterId = this.evaluateCampaignChapterState(
        new Set(snapshot.defeatedTrainerIds ?? []),
        snapshot.party ?? [],
        new Set(snapshot.usedInteractableIds ?? []),
      );
      return {
        persistenceEnabled: true,
        hasSave: true,
        slot: normalizedSlot,
        savedAt: snapshot.savedAt,
        sceneName: scene.name,
        partyCount: snapshot.party?.length ?? 0,
        reserveCount: snapshot.reserve?.length ?? 0,
        badges: this.getSnapshotBadgeIds(snapshot).length,
        badgeIds: this.getSnapshotBadgeIds(snapshot),
        badgeTitles: this.getSnapshotBadgeIds(snapshot).map(
          (badgeId) => CAMPAIGN_BADGE_TITLES[badgeId],
        ),
        stewardshipEvidenceIds: this.getSnapshotStewardshipEvidenceIds(snapshot),
        stewardshipEvidenceTitles: this.getSnapshotStewardshipEvidenceIds(snapshot).map(
          (evidenceId) => STEWARDSHIP_EVIDENCE_TITLES[evidenceId],
        ),
        chapterId,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES[chapterId],
        chapterComplete: chapterId === "gym1Complete" || chapterId === "gym2Complete",
        playTimeSeconds:
          typeof snapshot.playTimeSeconds === "number" ? Math.max(0, snapshot.playTimeSeconds) : 0,
        chapterCompletedAtSeconds: snapshot.campaignMilestones?.[chapterId],
        chapterPacing: this.assessCampaignPacing(chapterId, snapshot.campaignMilestones?.[chapterId]),
      };
    } catch {
      return fallback;
    }
  }

  private normalizeSaveSlot(slot: number): number {
    if (!Number.isFinite(slot)) {
      return 1;
    }
    return Math.min(SAVE_SLOT_COUNT, Math.max(1, Math.round(slot)));
  }

  private resetToNewGame(slot = this.saveSlot) {
    this.saveSlot = this.normalizeSaveSlot(slot);
    this.currentSceneId = "briarTown";
    this.playerPosition = { ...sceneDex.briarTown.playerSpawn };
    this.recoveryAnchor = {
      sceneId: "briarTown",
      sceneName: sceneDex.briarTown.name,
      label: "Briar Town bridge",
      x: sceneDex.briarTown.playerSpawn.x,
      y: sceneDex.briarTown.playerSpawn.y,
    };
    this.party = [this.createVivo("dogemox", 4, "Dogemox")];
    this.reserve = [];
    this.currentMessage =
      "Drill through Lantern Nursery, then push into Sanctuary Trail, Starglass Roost, or Ember Hollow to shape a bond path before Briar Gym.";
    this.activeEncounterZoneId = undefined;
    this.battle = undefined;
    this.defeatedTrainerIds = new Set<string>();
    this.badgeIds = new Set<CampaignBadgeId>();
    this.stewardshipEvidenceIds = new Set<StewardshipEvidenceId>();
    this.campaignChapterId = "openingRescue";
    this.persistedPlayTimeSeconds = 0;
    this.playSessionStartedAt = Date.now();
    this.campaignMilestones = {};
    this.lastBattleSummary = undefined;
    this.latestTrainerDebrief = undefined;
    this.latestWildDebrief = undefined;
    this.encounterStepBudgets = {};
    this.encounterMoodByZoneId = {};
    this.pendingFieldCallByZoneId = {};
    this.rescuePromiseByZoneId = {};
    this.usedInteractableIds = new Set<string>();
    this.resolvedRescueEncounterIds = new Set<string>();
    this.sanctuaryState = undefined;
    this.activeRescueEncounter = undefined;
    this.activeDialogue = undefined;
    this.lastSavedAt = undefined;
    this.saveStatus = this.enablePersistence ? "ready" : "disabled";
    this.sceneVersion += 1;
    this.renderHud();
    this.onWorldRefresh?.();
  }

  private renderDialogueMarkup(): string {
    return "";
  }

  private renderSanctuaryMarkup(): string {
    if (!this.sanctuaryState) {
      return "";
    }

    const activeChoice =
      this.sanctuaryState.selectedPartyIndex !== undefined
        ? this.party[this.sanctuaryState.selectedPartyIndex]?.nickname
        : undefined;
    const reserveChoice =
      this.sanctuaryState.selectedReserveIndex !== undefined
        ? this.reserve[this.sanctuaryState.selectedReserveIndex]?.nickname
        : undefined;
    const campaign = this.getCampaignProgression();
    const chapterPacing = this.getCampaignPacingAssessment();
    const badgeNames = this.getBadgeIds().map((badgeId) => CAMPAIGN_BADGE_TITLES[badgeId]);
    const evidenceNames = this.getStewardshipEvidenceIds().map(
      (evidenceId) => STEWARDSHIP_EVIDENCE_TITLES[evidenceId],
    );

    return `
      <div class="hud-section">
        <p class="hud-label">Sanctuary Ledger</p>
        <h2 class="hud-title">Rotate the active six</h2>
        <p class="hud-copy">Use Briar Town's reserve ledger to promote rescued Vivos into the field before trainer and gym battles.</p>
        <div class="banner"><strong>Chapter ${campaign.chapterNumber}: ${campaign.chapterTitle}</strong> · ${campaign.objective}${campaign.complete ? " · Chapter complete" : ""}</div>
        <p class="hud-mini">Active route time: ${this.formatPlayTime(this.getPlayTimeSeconds())}</p>
        ${campaign.complete && this.campaignMilestones[campaign.chapterId] !== undefined ? `<p class="hud-mini">Chapter cleared at ${this.formatPlayTime(this.campaignMilestones[campaign.chapterId] ?? 0)}.</p>` : ""}
        ${campaign.complete && chapterPacing ? `<p class="hud-mini">Pacing: ${chapterPacing.label}.</p>` : ""}
        <p class="hud-mini">Steward badges: ${badgeNames.length > 0 ? badgeNames.join(", ") : "none yet"}.</p>
        <p class="hud-mini">Stewardship evidence: ${evidenceNames.length > 0 ? evidenceNames.join(", ") : "none recorded"}.</p>
        <p class="hud-mini">Active choice: ${activeChoice ?? "none"} | Reserve choice: ${reserveChoice ?? "none"}</p>
        <div class="battle-moves">
          <button class="battle-button alt" data-world-action="swap-sanctuary-slot">Swap selected Vivos<small>Trade one active roster slot for a reserve partner.</small></button>
          <button class="battle-button alt" data-world-action="close-sanctuary">Close ledger<small>Keep the current field roster.</small></button>
        </div>
      </div>
    `;
  }

  private renderFieldStudyMarkup(): string {
    const pendingChoices = this.getPendingMoveChoices();
    if (pendingChoices.length === 0) {
      return "";
    }

    const cards = pendingChoices
      .map(({ vivo, choice }) => {
        const nextMove = moveDex[choice.moveId];
        const currentMoves = vivo.knownMoveIds
          .map((moveId) => {
            const move = moveDex[moveId];
            return `
              <button class="battle-button alt" data-world-action="learn-study-move" data-world-value="${vivo.id}|${choice.moveId}|${moveId}">
                Replace ${move.name}
                <small>${this.describeHudMove(moveId)}</small>
              </button>
            `;
          })
          .join("");

        return `
          <article class="study-card">
            <p class="study-meta">${vivo.nickname} reached Lv ${choice.sourceLevel}</p>
            <h3 class="study-title">${nextMove.name}</h3>
            <p class="hud-copy">${this.describeHudMove(choice.moveId)}</p>
            <p class="hud-mini">Choose one current move to set aside, or keep the current kit for now.</p>
            <div class="battle-moves">
              ${currentMoves}
              <button class="battle-button alt" data-world-action="decline-study-move" data-world-value="${vivo.id}|${choice.moveId}">
                Keep current kit
                <small>Pass on ${nextMove.name} and preserve the existing four-move loadout.</small>
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    return `
      <div class="hud-section">
        <p class="hud-label">Field Study</p>
        <h2 class="hud-title">Choose new move loadouts</h2>
        <p class="hud-copy">Fifth moves now arrive as explicit study choices so gym prep depends on your decisions, not silent forgetting.</p>
        <div class="study-grid">${cards}</div>
      </div>
    `;
  }

  private renderLessonDebriefMarkup(): string {
    if (this.battle || !this.latestTrainerDebrief) {
      return "";
    }

    const resultLabel =
      this.latestTrainerDebrief.result === "full"
        ? "Lesson proved"
        : this.latestTrainerDebrief.result === "practice"
          ? "Win, but lesson missed"
          : "Line broke";
    const resultTone = this.latestTrainerDebrief.result === "full" ? "ready" : "warning";
    const goalMarkup =
      this.latestTrainerDebrief.goals.length > 0
        ? `<div class="battle-goals">${this.latestTrainerDebrief.goals
            .map(
              (goal) => `
                <article class="battle-goal-card${goal.complete ? " complete" : ""}">
                  <p class="battle-goal-label">${goal.complete ? "Held" : "Still missing"}</p>
                  <h3 class="battle-goal-title">${goal.label}</h3>
                  <p class="hud-mini">${goal.hint}</p>
                  <p class="battle-goal-progress">${Math.min(goal.current, goal.target)}/${goal.target}</p>
                </article>
              `,
            )
            .join("")}</div>`
        : "<p class=\"hud-mini\">This spar had no authored lesson checklist.</p>";

    return `
      <div class="hud-section">
        <p class="hud-label">Lesson Debrief</p>
        <h2 class="hud-title">${this.latestTrainerDebrief.trainerName}</h2>
        <p class="hud-copy">${this.latestTrainerDebrief.summary}</p>
        <div class="prep-tools">
          <p class="prep-tag ${resultTone}"><strong>${resultLabel}:</strong> ${this.latestTrainerDebrief.sceneName}${this.latestTrainerDebrief.battlefieldConditionName ? ` - ${this.latestTrainerDebrief.battlefieldConditionName}` : ""}</p>
          <p class="prep-tag ${resultTone}"><strong>Next step:</strong> ${this.latestTrainerDebrief.nextStep}</p>
        </div>
        ${goalMarkup}
      </div>
    `;
  }

  private renderWildDebriefMarkup(): string {
    if (this.battle || !this.latestWildDebrief) {
      return "";
    }

    const resultTone =
      this.latestWildDebrief.outcome === "capture" || this.latestWildDebrief.outcome === "calmedRetreat"
        ? "ready"
        : "warning";
    const zone = this.latestWildDebrief.zoneName
      ? `${this.latestWildDebrief.sceneName} - ${this.latestWildDebrief.zoneName}`
      : this.latestWildDebrief.sceneName;
    const targetMarkup = this.latestWildDebrief.targetName
      ? `<p class="prep-tag ${resultTone}"><strong>Target:</strong> ${this.latestWildDebrief.targetName}</p>`
      : "";

    return `
      <div class="hud-section">
        <p class="hud-label">Rescue Debrief</p>
        <h2 class="hud-title">${this.latestWildDebrief.resultLabel}</h2>
        <p class="hud-copy">${this.latestWildDebrief.summary}</p>
        <div class="prep-tools">
          <p class="prep-tag ${resultTone}"><strong>Patch:</strong> ${zone}</p>
          ${targetMarkup}
          <p class="prep-tag ${this.getEncounterMoodTone(this.latestWildDebrief.moodLabel)}"><strong>Habitat temper:</strong> ${this.latestWildDebrief.moodSummary}</p>
          ${
            this.latestWildDebrief.rescueRead
              ? `<p class="prep-tag ${resultTone}"><strong>Rescue read:</strong> ${this.latestWildDebrief.rescueRead}</p>`
              : ""
          }
          ${
            this.latestWildDebrief.openingNote
              ? `<p class="prep-tag ready"><strong>Opening read:</strong> ${this.latestWildDebrief.openingNote}</p>`
              : ""
          }
          ${
            this.latestWildDebrief.promiseNote
              ? `<p class="prep-tag ready"><strong>Rescue promise:</strong> ${this.latestWildDebrief.promiseNote}</p>`
              : ""
          }
          ${
            this.latestWildDebrief.bondNote
              ? `<p class="prep-tag ready"><strong>Bond trace:</strong> ${this.latestWildDebrief.bondNote}</p>`
              : ""
          }
          <p class="prep-tag ${resultTone}"><strong>Next step:</strong> ${this.latestWildDebrief.nextStep}</p>
        </div>
      </div>
    `;
  }

  private renderTacticalPrepMarkup(): string {
    if (this.battle) {
      return "";
    }

    const upcomingLessons = this.getUpcomingBattleLessons();
    if (upcomingLessons.length === 0) {
      return `
        <div class="hud-section">
          <p class="hud-label">Tactical Prep</p>
          <h2 class="hud-title">Sanctuary line holding</h2>
          <p class="hud-copy">The first route lessons are cleared. Keep the roster sharp and carry the sanctuary outward.</p>
        </div>
      `;
    }

    const cards = upcomingLessons
      .map(({ trainer, sceneName, fieldCondition }) => {
        const goalMarkup = trainer.battleGoals?.length
          ? `<ul class="hud-list">${trainer.battleGoals
              .map((goal) => `<li><strong>${goal.label}</strong> - ${this.describeGoalPrep(goal.type)}</li>`)
              .join("")}</ul>`
          : "<p class=\"hud-mini\">No authored tactical lesson on this spar.</p>";
        const toolMarkup = `<div class="prep-tools">${this.describeTrainerPrepTools(trainer).join("")}</div>`;

        return `
          <article class="prep-card">
            <p class="prep-meta">${sceneName}</p>
            <h3 class="prep-title">${trainer.name}</h3>
            <p class="hud-copy">${trainer.intro}</p>
            ${goalMarkup}
            ${this.renderBattlefieldReadMarkup(fieldCondition)}
            ${toolMarkup}
          </article>
        `;
      })
      .join("");

    return `
      <div class="hud-section">
        <p class="hud-label">Tactical Prep</p>
        <h2 class="hud-title">Route and gym lessons</h2>
        <p class="hud-copy">The next gate only opens when the right tactic is actually shown in one clean win. Use the live move kits below to plan the handoff before you walk into the battle.</p>
        <div class="study-grid">${cards}</div>
      </div>
    `;
  }

  private renderSaveMarkup(): string {
    const disabled = !this.enablePersistence;
    const statusTone =
      this.saveStatus === "error"
        ? "warning"
        : this.saveStatus === "saved"
          ? "ready"
          : "";
    const savedAt = this.lastSavedAt
      ? new Date(this.lastSavedAt).toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "No journal entry yet.";
    const copy = disabled
      ? "Debug boot detected. Field-log autosave is paused so test states do not overwrite the live route."
      : "The field log stores scene position, roster, rescues, badges, battle-study choices, and route progress for reload-safe play.";
    const status = disabled
      ? "Autosave paused for debug."
      : this.saveStatus === "saved"
        ? `Last journaled ${savedAt}.`
        : this.saveStatus === "error"
          ? "The last save attempt failed in this browser."
          : "Autosave waiting for the next durable change.";

    return `
      <div class="hud-section">
        <p class="hud-label">Field Log</p>
        <h2 class="hud-title">Route persistence</h2>
        <p class="hud-copy">${copy}</p>
        <div class="prep-tools">
          <p class="prep-tag ${statusTone}"><strong>Status:</strong> ${status}</p>
        </div>
        ${
          disabled
            ? ""
            : `<div class="battle-moves">
                <button class="battle-button alt" data-world-action="save-field-log">
                  Save field log now
                  <small>Write the current route state to the local journal immediately.</small>
                </button>
              </div>`
        }
      </div>
    `;
  }

  private setRecoveryAnchor(interactable: Interactable, message: string): string {
    if (!interactable.recoveryPoint) {
      return message;
    }

    this.recoveryAnchor = {
      sceneId: this.currentSceneId,
      sceneName: this.currentScene.name,
      label: interactable.recoveryPoint.label,
      x: interactable.recoveryPoint.spawnX,
      y: interactable.recoveryPoint.spawnY,
    };
    this.scheduleProgressSave();
    return `${this.recoveryAnchor.label} is marked as your recovery line. ${message}`;
  }

  private renderRosterCard(
    vivo: VivoInstance,
    options: {
      scope: "party" | "reserve";
      index: number;
      selected?: boolean;
      showLeadButton?: boolean;
    },
  ): string {
    const species = speciesDex[vivo.speciesId];
    const portraitUrl = this.getPortraitUrl(vivo);
    const currentName = vivo.formName ?? species.name;
    const registryName = vivo.formName ?? species.registryName;
    const attunementSummary = this.describeAttunement(vivo);
    const roleSummary = this.describeVivoRole(vivo);
    const trait = this.getBattleTrait(vivo);
    const rescueMemoryMarkup = vivo.rescueMemory
      ? `<p class="roster-memory"><strong>${this.describeRescueMemoryMethod(vivo.rescueMemory.method)}:</strong> ${vivo.rescueMemory.note}</p>`
      : "";
    const rescueMemoryRouteMarkup = this.renderRosterRescueMemoryRouteMarkup(vivo, options.index);
    const moveMarkup = vivo.knownMoveIds
      .map((moveId) => {
        const move = moveDex[moveId];
        const kindLabel =
          move.kind === "support"
            ? this.describeSupportLabel(moveId)
            : `${this.formatElementName(move.element)} ${move.attackStyle ?? "impact"}`;
        return `<li><strong>${move.name}</strong> - ${kindLabel}</li>`;
      })
      .join("");
    const selectionButton =
      this.sanctuaryState && options.scope === "party"
        ? `<button class="inline-hud-button${options.selected ? " active" : ""}" data-world-action="select-party-slot" data-world-value="${options.index}">${options.selected ? "Selected" : "Mark swap"}</button>`
        : this.sanctuaryState && options.scope === "reserve"
          ? `<button class="inline-hud-button${options.selected ? " active" : ""}" data-world-action="select-reserve-slot" data-world-value="${options.index}">${options.selected ? "Selected" : "Rotate in"}</button>`
          : "";
    const leadButton =
      options.showLeadButton && options.index > 0
        ? `<button class="inline-hud-button" data-world-action="set-field-lead" data-world-value="${options.index}">Take lead (${options.index + 1})</button>`
        : "";
    const fieldHotkeyMarkup =
      options.scope === "party" && options.showLeadButton
        ? `<p class="roster-hotkey">Field hotkey: ${options.index + 1}${options.index === 0 ? " (current lead)" : ""}</p>`
        : "";

    return `
      <article class="roster-card${options.scope === "party" && options.index === 0 ? " lead" : ""}">
        <div class="roster-card-media">
          ${
            portraitUrl
              ? `<img class="roster-portrait" src="${portraitUrl}" alt="${currentName} portrait" />`
              : `<div class="roster-portrait fallback">${currentName.slice(0, 2).toUpperCase()}</div>`
          }
        </div>
        <div class="roster-card-body">
          <p class="roster-meta">${options.scope === "party" && options.index === 0 ? "Field lead" : options.scope === "party" ? "Active slot" : "Reserve slot"}</p>
          <h3 class="roster-name">${vivo.nickname}</h3>
          <p class="roster-form">${currentName}</p>
          <p class="roster-registry">${registryName}</p>
          <p class="roster-stats">Lv ${vivo.level} | ${this.formatElementName(vivo.element)} | HP ${vivo.currentHp}/${this.getMaxHp(vivo)}</p>
          ${fieldHotkeyMarkup}
          <p class="roster-role">${roleSummary}</p>
          <p class="roster-trait"><strong>${trait.name}:</strong> ${trait.summary}</p>
          ${rescueMemoryMarkup}
          ${rescueMemoryRouteMarkup}
          <p class="roster-bond">${attunementSummary}</p>
          <ul class="roster-moves">${moveMarkup}</ul>
          <div class="roster-actions">
            ${selectionButton}
            ${leadButton}
          </div>
        </div>
      </article>
    `;
  }

  private rollEncounter(zone: EncounterZone): { speciesId: string; level: number } {
    const totalWeight = zone.encounterTable.reduce((sum, entry) => sum + entry.weight, 0);
    let roll = Math.random() * totalWeight;
    let speciesId = zone.encounterTable[0].speciesId;
    for (const entry of zone.encounterTable) {
      roll -= entry.weight;
      if (roll <= 0) {
        speciesId = entry.speciesId;
        break;
      }
    }
    const [minLevel, maxLevel] = zone.levelRange;
    const level = minLevel + Math.floor(Math.random() * (maxLevel - minLevel + 1));
    return { speciesId, level };
  }

  private rollEncounterBudget(zone: EncounterZone): number {
    const [minSteps, maxSteps] = zone.stepRange;
    return minSteps + Math.floor(Math.random() * (maxSteps - minSteps + 1));
  }

  private getEncounterStrideDrain(zone: EncounterZone, distance: number): number {
    return distance * this.getEncounterPaceMultiplier(zone);
  }

  private getEncounterPaceMultiplier(zone: EncounterZone): number {
    return clamp(
      (zone.encounterRate / 0.12) * this.getEncounterMoodPaceMultiplier(zone.id),
      0.65,
      1.8,
    );
  }

  private formatBiomeName(biome: string): string {
    return biome
      .split(/(?=[A-Z])|[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private formatEncounterPressure(pressure: "calm" | "stirring" | "imminent" | "unknown"): string {
    switch (pressure) {
      case "calm":
        return "encounters calm";
      case "stirring":
        return "encounters stirring";
      case "imminent":
        return "encounter nearly upon you";
      case "unknown":
        return "encounter pressure unknown";
    }
  }

  private formatEncounterRarity(share: number): string {
    if (share >= 0.5) {
      return "(common)";
    }
    if (share >= 0.25) {
      return "(uncommon)";
    }
    return "(rare)";
  }

  private describeEncounterPace(paceMultiplier: number): string {
    if (paceMultiplier >= 1.25) {
      return "fast stirring patch";
    }
    if (paceMultiplier <= 0.9) {
      return "slow-breathing patch";
    }
    return "steady stirring patch";
  }

  private getEncounterMoodTone(mood: "settled" | "steady" | "spooked" | "scattered") {
    if (mood === "settled") {
      return "ready";
    }
    if (mood === "steady") {
      return "steady";
    }
    return "warning";
  }

  private getEncounterMoodLevel(zoneId: string): -2 | -1 | 0 | 1 | 2 {
    const level = (this.encounterMoodByZoneId[zoneId] ?? 0) + this.getAmbientEncounterPressureLevel(zoneId);
    return clamp(level, -2, 2) as -2 | -1 | 0 | 1 | 2;
  }

  private getAmbientEncounterPressureLevel(zoneId: string): number {
    const sceneMatch = Object.values(sceneDex).find((scene) =>
      scene.encounterZones.some((zone) => zone.id === zoneId),
    );

    if (sceneMatch?.id === "sanctuaryTrail" && !this.defeatedTrainerIds.has("trailAuditorVale")) {
      return 1;
    }

    return 0;
  }

  private getAmbientEncounterPressure(zoneId: string):
    | {
        label: string;
        scoutNote: string;
        openingNote: string;
      }
    | undefined {
    if (this.getAmbientEncounterPressureLevel(zoneId) <= 0) {
      return undefined;
    }

    return {
      label: "Audit pressure",
      scoutNote:
        "Vale's active seizure review is making this trail read one step more spooked until the audit battle is answered.",
      openingNote:
        "Vale's active seizure review pushed the habitat into a sharper opening read before the fight began.",
    };
  }

  private getEncounterMoodPaceMultiplier(zoneId: string): number {
    switch (this.getEncounterMoodLevel(zoneId)) {
      case -2:
        return 1.16;
      case -1:
        return 1.08;
      case 1:
        return 0.9;
      case 2:
        return 0.78;
      default:
        return 1;
    }
  }

  private adjustEncounterMood(zoneId: string, delta: number) {
    const next = clamp((this.encounterMoodByZoneId[zoneId] ?? 0) + delta, -2, 2);
    this.encounterMoodByZoneId[zoneId] = next;
  }

  private grantAttunement(vivo: VivoInstance, element: ElementType, amount: number): number {
    const next = (vivo.attunementByElement[element] ?? 0) + amount;
    vivo.attunementByElement[element] = next;
    return next;
  }

  private stampRescueMemory(vivo: VivoInstance, memory: NonNullable<VivoInstance["rescueMemory"]>) {
    vivo.rescueMemory = memory;
  }

  private describeRescueMemoryMethod(method: NonNullable<VivoInstance["rescueMemory"]>["method"]): string {
    switch (method) {
      case "starter":
        return "First bond";
      case "wildCapture":
        return "Wild rescue";
      case "scriptedRescue":
        return "Sanctuary rescue";
      case "trainerRelease":
        return "Released Vivo";
      case "debug":
        return "Debug rescue";
      default:
        return "Rescue memory";
    }
  }

  private getPortraitUrl(vivo: VivoInstance): string | undefined {
    const formPortraitKey = vivo.formName ? creaturePortraitByFormName[vivo.formName] : undefined;
    if (formPortraitKey) {
      return creaturePortraitManifest[formPortraitKey];
    }

    const speciesPortraitKey = creaturePortraitBySpeciesId[vivo.speciesId];
    if (speciesPortraitKey) {
      return creaturePortraitManifest[speciesPortraitKey];
    }

    return undefined;
  }

  private describeAttunement(vivo: VivoInstance): string {
    const attunement = Object.entries(vivo.attunementByElement)
      .filter((entry): entry is [ElementType, number] => typeof entry[1] === "number" && entry[1] > 0)
      .sort((left, right) => right[1] - left[1]);

    if (attunement.length === 0) {
      return "No bond marks yet.";
    }

    return attunement
      .map(([element, value]) => `${this.formatElementName(element)} ${value}`)
      .join(" | ");
  }

  getPendingMoveChoices(): Array<{ vivo: VivoInstance; choice: PendingMoveChoice }> {
    return [...this.party, ...this.reserve].flatMap((vivo) =>
      vivo.pendingMoveChoices.map((choice) => ({ vivo, choice })),
    );
  }

  learnPendingMove(vivoId: string, moveId: string, replaceMoveId: string): string {
    const vivo = this.findTrackedVivo(vivoId);
    if (!vivo) {
      return "That field-study target is no longer available.";
    }

    const choiceIndex = vivo.pendingMoveChoices.findIndex((choice) => choice.moveId === moveId);
    if (choiceIndex < 0) {
      return `${vivo.nickname} is no longer studying that move.`;
    }

    const knownIndex = vivo.knownMoveIds.indexOf(replaceMoveId);
    if (knownIndex < 0) {
      return `${vivo.nickname} no longer knows that move.`;
    }

    vivo.knownMoveIds.splice(knownIndex, 1, moveId);
    vivo.pendingMoveChoices.splice(choiceIndex, 1);
    this.renderHud();
    this.scheduleProgressSave();
    return `${vivo.nickname} set aside ${moveDex[replaceMoveId].name} and learned ${moveDex[moveId].name}.`;
  }

  declinePendingMove(vivoId: string, moveId: string): string {
    const vivo = this.findTrackedVivo(vivoId);
    if (!vivo) {
      return "That field-study target is no longer available.";
    }

    const choiceIndex = vivo.pendingMoveChoices.findIndex((choice) => choice.moveId === moveId);
    if (choiceIndex < 0) {
      return `${vivo.nickname} is no longer studying that move.`;
    }

    vivo.pendingMoveChoices.splice(choiceIndex, 1);
    this.renderHud();
    this.scheduleProgressSave();
    return `${vivo.nickname} kept the current move kit and passed on ${moveDex[moveId].name}.`;
  }

  private scheduleProgressSave() {
    if (!this.enablePersistence) {
      return;
    }

    if (this.saveTimeoutId !== undefined) {
      window.clearTimeout(this.saveTimeoutId);
    }

    this.saveTimeoutId = window.setTimeout(() => {
      this.persistProgressNow();
    }, 400);
  }

  private persistProgressNow(): boolean {
    if (!this.enablePersistence || this.battle) {
      return false;
    }

    if (this.saveTimeoutId !== undefined) {
      window.clearTimeout(this.saveTimeoutId);
      this.saveTimeoutId = undefined;
    }

    try {
      this.refreshCampaignChapter();
      this.syncPlayTime();
      const snapshot: SaveSnapshot = {
        version: 1,
        currentSceneId: this.currentSceneId,
        playerPosition: { ...this.playerPosition },
        recoveryAnchor: { ...this.recoveryAnchor },
        party: JSON.parse(JSON.stringify(this.party)) as VivoInstance[],
        reserve: JSON.parse(JSON.stringify(this.reserve)) as VivoInstance[],
        currentMessage: this.currentMessage,
        defeatedTrainerIds: [...this.defeatedTrainerIds],
        badges: this.badges,
        badgeIds: this.getBadgeIds(),
        stewardshipEvidenceIds: this.getStewardshipEvidenceIds(),
        campaignChapterId: this.campaignChapterId,
        playTimeSeconds: this.persistedPlayTimeSeconds,
        campaignMilestones: { ...this.campaignMilestones },
        encounterStepBudgets: { ...this.encounterStepBudgets },
        encounterMoodByZoneId: { ...this.encounterMoodByZoneId },
        pendingFieldCallByZoneId: { ...this.pendingFieldCallByZoneId },
        rescuePromiseByZoneId: { ...this.rescuePromiseByZoneId },
        usedInteractableIds: [...this.usedInteractableIds],
        resolvedRescueEncounterIds: [...this.resolvedRescueEncounterIds],
        lastBattleSummary: this.lastBattleSummary,
        latestTrainerDebrief: this.latestTrainerDebrief,
        latestWildDebrief: this.latestWildDebrief,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(getSaveStorageKey(this.saveSlot), JSON.stringify(snapshot));
      this.lastSavedAt = snapshot.savedAt;
      this.saveStatus = "saved";
      this.renderHud();
      return true;
    } catch {
      this.saveStatus = "error";
      this.renderHud();
      return false;
    }
  }

  private restoreProgress() {
    try {
      const raw = window.localStorage.getItem(getSaveStorageKey(this.saveSlot));
      if (!raw) {
        this.saveStatus = "ready";
        return;
      }

      const snapshot = JSON.parse(raw) as Partial<SaveSnapshot>;
      if (snapshot.version !== 1) {
        this.saveStatus = "ready";
        return;
      }

      const scene = snapshot.currentSceneId ? sceneDex[snapshot.currentSceneId] : undefined;
      if (!scene) {
        this.saveStatus = "ready";
        return;
      }

      const restoredParty = this.restoreRoster(snapshot.party);
      if (restoredParty.length > 0) {
        this.party = restoredParty;
      }
      this.reserve = this.restoreRoster(snapshot.reserve);
      this.currentSceneId = scene.id;
      this.playerPosition = this.clampPosition(
        snapshot.playerPosition?.x ?? scene.playerSpawn.x,
        snapshot.playerPosition?.y ?? scene.playerSpawn.y,
      );
      this.recoveryAnchor =
        snapshot.recoveryAnchor && sceneDex[snapshot.recoveryAnchor.sceneId]
          ? { ...snapshot.recoveryAnchor }
          : this.recoveryAnchor;
      this.currentMessage = snapshot.currentMessage || this.currentMessage;
      this.defeatedTrainerIds = new Set(snapshot.defeatedTrainerIds ?? []);
      this.badgeIds = new Set(this.getSnapshotBadgeIds(snapshot));
      this.stewardshipEvidenceIds = new Set(this.getSnapshotStewardshipEvidenceIds(snapshot));
      this.usedInteractableIds = new Set(snapshot.usedInteractableIds ?? []);
      this.campaignChapterId = this.evaluateCampaignChapter();
      this.persistedPlayTimeSeconds =
        typeof snapshot.playTimeSeconds === "number" ? Math.max(0, snapshot.playTimeSeconds) : 0;
      this.playSessionStartedAt = Date.now();
      this.campaignMilestones = { ...(snapshot.campaignMilestones ?? {}) };
      if (
        this.defeatedTrainerIds.has("townPatrolRhis") &&
        this.campaignMilestones.gym1Complete === undefined
      ) {
        this.campaignMilestones.gym1Complete = this.persistedPlayTimeSeconds;
      }
      if (
        this.defeatedTrainerIds.has("sporebellWardenTamsin") &&
        this.campaignMilestones.gym2Complete === undefined
      ) {
        this.campaignMilestones.gym2Complete = this.persistedPlayTimeSeconds;
      }
      this.encounterStepBudgets = snapshot.encounterStepBudgets ?? {};
      this.encounterMoodByZoneId = snapshot.encounterMoodByZoneId ?? {};
      this.pendingFieldCallByZoneId = snapshot.pendingFieldCallByZoneId ?? {};
      this.rescuePromiseByZoneId = snapshot.rescuePromiseByZoneId ?? {};
      this.resolvedRescueEncounterIds = new Set(snapshot.resolvedRescueEncounterIds ?? []);
      this.lastBattleSummary = snapshot.lastBattleSummary;
      this.latestTrainerDebrief = snapshot.latestTrainerDebrief;
      this.latestWildDebrief = snapshot.latestWildDebrief;
      this.lastSavedAt = snapshot.savedAt;
      this.saveStatus = "saved";
      this.sceneVersion += 1;
    } catch {
      this.saveStatus = "error";
    }
  }

  private restoreRoster(snapshotRoster?: VivoInstance[]): VivoInstance[] {
    if (!snapshotRoster?.length) {
      return [];
    }

    return snapshotRoster
      .filter((entry) => Boolean(entry?.speciesId && speciesDex[entry.speciesId]))
      .map((entry) => {
        const species = speciesDex[entry.speciesId];
        const level = Math.max(1, entry.level);
        const maxHp = this.getMaxHpFromSpecies(entry.speciesId, level);
        return {
          id: entry.id || randomId(),
          speciesId: entry.speciesId,
          nickname: entry.nickname || species.name,
          level,
          xp: Math.max(0, entry.xp ?? 0),
          currentHp: Math.max(0, Math.min(typeof entry.currentHp === "number" ? entry.currentHp : maxHp, maxHp)),
          element: entry.element ?? species.element,
          knownMoveIds: entry.knownMoveIds.filter((moveId) => Boolean(moveDex[moveId])).slice(0, 4),
          formName: entry.formName,
          winsByElement: entry.winsByElement ?? {},
          attunementByElement: entry.attunementByElement ?? {},
          habitatStrideByElement: entry.habitatStrideByElement ?? {},
          pendingMoveChoices: (entry.pendingMoveChoices ?? []).filter((choice) => Boolean(moveDex[choice.moveId])),
          rescueMemory: entry.rescueMemory,
        } satisfies VivoInstance;
      });
  }

  private clampPosition(x: number, y: number) {
    return {
      x: clamp(x, 20, 940),
      y: clamp(y, 20, 620),
    };
  }

  private findTrackedVivo(vivoId: string): VivoInstance | undefined {
    return [...this.party, ...this.reserve].find((candidate) => candidate.id === vivoId);
  }

  private getUpcomingBattleLessons(): Array<{
    trainer: TrainerDefinition;
    sceneName: string;
    fieldCondition: BattlefieldCondition | undefined;
  }> {
    type UpcomingLesson = {
      trainer: TrainerDefinition;
      sceneName: string;
      fieldCondition: BattlefieldCondition | undefined;
    };
    const progressionTrainerIds = [
      "nurseryTenderSola",
      "trailAuditorVale",
      "trailWardenNera",
      "burrowWardenTovin",
      "roostWatcherMiren",
      "ashScoutIven",
      "moonfenKeeperOrla",
      "gymKeeperPella",
      "gymLeaderSenka",
      "townPatrolRhis",
    ];

    return progressionTrainerIds
      .filter((trainerId) => !this.defeatedTrainerIds.has(trainerId))
      .map((trainerId) => {
        const match = Object.values(sceneDex).find((scene) =>
          scene.trainers.some((trainer) => trainer.id === trainerId),
        );
        if (!match) {
          return undefined;
        }

        const trainer = match.trainers.find((candidate) => candidate.id === trainerId);
        if (!trainer) {
          return undefined;
        }

        return {
          trainer,
          sceneName: match.name,
          fieldCondition: match.battlefieldCondition,
        } satisfies UpcomingLesson;
      })
      .filter((entry): entry is UpcomingLesson => Boolean(entry))
      .slice(0, 3);
  }

  private describeTrainerPrepTools(trainer: TrainerDefinition): string[] {
    const goalTypes = new Set((trainer.battleGoals ?? []).map((goal) => goal.type));
    const tags: string[] = [];

    if (goalTypes.has("useGuard")) {
      const guardUsers = this.party.filter((vivo) =>
        vivo.knownMoveIds.some((moveId) => moveDex[moveId]?.supportEffect?.type === "guard"),
      );
      tags.push(
        this.renderPrepTag(
          "Guard tool",
          guardUsers.length > 0
            ? `${guardUsers.map((vivo) => vivo.nickname).join(", ")} can brace the first hit.`
            : "No active Vivo currently knows a guard move.",
          guardUsers.length > 0,
        ),
      );
    }

    if (goalTypes.has("switchParty")) {
      const healthyBench = this.party.filter((vivo, index) => index > 0 && vivo.currentHp > 0);
      tags.push(
        this.renderPrepTag(
          "Switch tool",
          healthyBench.length > 0
            ? `${healthyBench.map((vivo) => vivo.nickname).join(", ")} can take a live handoff.`
            : "No healthy backup is ready to rotate in.",
          healthyBench.length > 0,
        ),
      );
    }

    if (goalTypes.has("useFocus")) {
      const focusUsers = this.party.filter((vivo) =>
        vivo.knownMoveIds.some((moveId) => moveDex[moveId]?.supportEffect?.type === "focus"),
      );
      tags.push(
        this.renderPrepTag(
          "Focus tool",
          focusUsers.length > 0
            ? `${focusUsers.map((vivo) => vivo.nickname).join(", ")} can prime the next strike with a focus setup.`
            : "No active Vivo currently knows a focus setup move.",
          focusUsers.length > 0,
        ),
      );
    }

    if (goalTypes.has("landAttackStyle")) {
      for (const attackStyle of ["impact", "focus"] as const) {
        const styleGoals = (trainer.battleGoals ?? []).filter(
          (goal) => goal.type === "landAttackStyle" && goal.attackStyle === attackStyle,
        );
        if (styleGoals.length === 0) {
          continue;
        }

        const attackers = this.party.filter((vivo) =>
          vivo.knownMoveIds.some((moveId) => {
            const move = moveDex[moveId];
            return move?.kind === "attack" && (move.attackStyle ?? "impact") === attackStyle;
          }),
        );
        const label = attackStyle === "focus" ? "Focus strike" : "Impact strike";
        const styleText = attackStyle === "focus" ? "focus-style" : "impact-style";
        tags.push(
          this.renderPrepTag(
            label,
            attackers.length > 0
              ? `${attackers.map((vivo) => vivo.nickname).join(", ")} can land a ${styleText} attack for this lesson.`
              : `No active Vivo currently has a ${styleText} attack loaded.`,
            attackers.length > 0,
          ),
        );
      }
    }

    if (goalTypes.has("finishExposedTarget")) {
      const exposeUsers = this.party.filter((vivo) =>
        vivo.knownMoveIds.some((moveId) => moveDex[moveId]?.supportEffect?.type === "expose"),
      );
      const finishers = this.party.filter((vivo) =>
        vivo.knownMoveIds.some((moveId) => {
          const move = moveDex[moveId];
          return move?.kind === "attack" && move.power >= 12;
        }),
      );
      const exposeText =
        exposeUsers.length > 0
          ? `${exposeUsers.map((vivo) => vivo.nickname).join(", ")} can open the target.`
          : "No active Vivo currently knows an expose setup.";
      const finisherText =
        finishers.length > 0
          ? `${finishers.map((vivo) => vivo.nickname).join(", ")} can cash in the opening.`
          : "No active Vivo has a strong follow-up loaded.";
      tags.push(this.renderPrepTag("Expose tool", `${exposeText} ${finisherText}`, exposeUsers.length > 0));
    }

    for (const goal of trainer.battleGoals ?? []) {
      if (goal.type !== "landElementAttack") {
        continue;
      }

      const attackers = this.party.filter((vivo) =>
        vivo.knownMoveIds.some((moveId) => {
          const move = moveDex[moveId];
          return move?.kind === "attack" && move.element === goal.element;
        }),
      );
      const elementName = this.formatElementName(goal.element);
      tags.push(
        this.renderPrepTag(
          `${elementName} strike`,
          attackers.length > 0
            ? `${attackers.map((vivo) => vivo.nickname).join(", ")} can land ${elementName.toLowerCase()} pressure for this lesson.`
            : `No active Vivo currently has a ${elementName.toLowerCase()} attack loaded.`,
          attackers.length > 0,
        ),
      );
    }

    if (tags.length === 0) {
      tags.push(this.renderPrepTag("Open spar", "This battle is mostly a straight test of levels and move choice.", true));
    }

    return tags;
  }

  private renderPrepTag(title: string, text: string, ready: boolean): string {
    return `<p class="prep-tag${ready ? " ready" : " warning"}"><strong>${title}:</strong> ${text}</p>`;
  }

  private renderBattlefieldReadMarkup(fieldCondition: BattlefieldCondition | undefined): string {
    if (!fieldCondition) {
      return `<div class="prep-tools">${this.renderPrepTag(
        "Battlefield read",
        "No special board rule is shaping this exchange yet.",
        false,
      )}</div>`;
    }

    return `<div class="prep-tools">${this.renderPrepTag(
      "Battlefield read",
      `${fieldCondition.name}: ${fieldCondition.summary} ${fieldCondition.detail}`,
      true,
    )}</div>`;
  }

  private describeGoalPrep(
    goalType:
      | "useGuard"
      | "useFocus"
      | "switchParty"
      | "finishExposedTarget"
      | "landAttackStyle"
      | "landElementAttack",
  ): string {
    switch (goalType) {
      case "useGuard":
        return "Bring a guard user into the active six and spend one turn bracing before the punish.";
      case "useFocus":
        return "Bring a focus user so the route can see one calm setup turn before the burst.";
      case "switchParty":
        return "Keep at least one healthy bench Vivo ready so the field can change hands cleanly.";
      case "finishExposedTarget":
        return "Open the target with an expose move, then close the knockout with a stronger follow-up.";
      case "landAttackStyle":
        return "Bring a Vivo with the requested attack lane and land that strike during the exchange.";
      case "landElementAttack":
        return "Carry the taught route element into battle and land one clean elemental strike.";
      default:
        return "Prove the authored lesson in one clean run.";
    }
  }

  private describeVivoRole(vivo: VivoInstance): string {
    const moveIds = new Set(vivo.knownMoveIds);
    if (moveIds.has("guardHowl")) {
      return "Guard anchor for stabilizing the first exchange.";
    }
    if (moveIds.has("rootSnare")) {
      return "Expose support that creates clean finish windows.";
    }
    if (moveIds.has("prismVeil")) {
      return "Focus setup line that sharpens the next strike.";
    }
    if (moveIds.has("stillwaterHum")) {
      return "Calm marsh bulwark that guards first and answers with a lantern burst.";
    }
    if (moveIds.has("feintHop")) {
      return "Tempo finisher built to steal the last clean hit.";
    }
    if (vivo.formName === "Ignis Canis") {
      return "Fire-bond striker that pushes harder once the route heats up.";
    }
    if (vivo.formName === "Astra Corvus") {
      return "Light-bond burst line that turns calm setup into clean punishment.";
    }
    return "General rescue battler for steady route work.";
  }

  getBattleTrait(vivo: VivoInstance): BattleTraitDefinition {
    return speciesDex[vivo.speciesId].battleTrait;
  }

  private getCurrentStatBias(vivo: VivoInstance): StatBias {
    const baseBias = speciesDex[vivo.speciesId].statBias;
    const activeForm = this.getActiveFormTransition(vivo);
    if (!activeForm?.statBonuses) {
      return baseBias;
    }

    return {
      hp: baseBias.hp + (activeForm.statBonuses.hp ?? 0),
      attack: baseBias.attack + (activeForm.statBonuses.attack ?? 0),
      defense: baseBias.defense + (activeForm.statBonuses.defense ?? 0),
      focus: baseBias.focus + (activeForm.statBonuses.focus ?? 0),
      speed: baseBias.speed + (activeForm.statBonuses.speed ?? 0),
    };
  }

  private getActiveFormTransition(vivo: VivoInstance) {
    if (!vivo.formName) {
      return undefined;
    }

    return speciesDex[vivo.speciesId].formTransitions?.find(
      (transition) => transition.name === vivo.formName,
    );
  }

  private applyFormName(vivo: VivoInstance, formName: string): boolean {
    const transition = speciesDex[vivo.speciesId].formTransitions?.find(
      (candidate) => candidate.name === formName,
    );
    if (!transition) {
      return false;
    }

    vivo.formName = transition.name;
    vivo.element = transition.newElement;
    if (transition.awakenMoveId) {
      this.applyAwakenedMove(vivo, transition.awakenMoveId, true);
    }
    return true;
  }

  private applyAwakenedMove(
    vivo: VivoInstance,
    moveId: string,
    forceAuthoredFormKit = false,
  ): string[] {
    const move = moveDex[moveId];
    if (!move || vivo.knownMoveIds.includes(moveId)) {
      return [];
    }

    if (vivo.knownMoveIds.length < 4) {
      vivo.knownMoveIds = [...vivo.knownMoveIds, moveId];
      return [`${vivo.nickname} awakened ${move.name} immediately.`];
    }

    const basicMoveId = speciesDex[vivo.speciesId].learnset.find((entry) => entry.level === 1)?.moveId;
    const replaceableMoveId = vivo.knownMoveIds.includes("tackle") ? "tackle" : basicMoveId;
    const replaceIndex = replaceableMoveId ? vivo.knownMoveIds.indexOf(replaceableMoveId) : -1;
    if (replaceIndex >= 0 && replaceableMoveId) {
      const nextMoveIds = [...vivo.knownMoveIds];
      nextMoveIds[replaceIndex] = moveId;
      vivo.knownMoveIds = nextMoveIds;
      return [
        `${vivo.nickname} awakened ${move.name} immediately, replacing ${moveDex[replaceableMoveId].name} with its new form's signature attack.`,
      ];
    }

    if (forceAuthoredFormKit && vivo.knownMoveIds.length > 0) {
      const replacedMoveId = vivo.knownMoveIds[0];
      vivo.knownMoveIds = [moveId, ...vivo.knownMoveIds.slice(1)];
      vivo.pendingMoveChoices = vivo.pendingMoveChoices.filter(
        (choice) => choice.moveId !== moveId,
      );
      return [
        `${vivo.nickname} carries ${move.name} in its authored form kit, replacing ${moveDex[replacedMoveId].name}.`,
      ];
    }

    const alreadyPending = vivo.pendingMoveChoices.some((choice) => choice.moveId === moveId);
    if (!alreadyPending) {
      vivo.pendingMoveChoices.push({
        moveId,
        sourceLevel: vivo.level,
      });
    }
    return [
      `${vivo.nickname} awakened ${move.name}, but its move kit is full. Resolve the new field-study choice in the journal.`,
    ];
  }

  private describeFormBonuses(transition: {
    statBonuses?: Partial<StatBias>;
  }): string {
    const entries = Object.entries(transition.statBonuses ?? {}).filter(
      (entry): entry is [keyof StatBias, number] => typeof entry[1] === "number" && entry[1] > 0,
    );
    if (entries.length === 0) {
      return "";
    }

    const labels: Record<keyof StatBias, string> = {
      hp: "HP",
      attack: "Atk",
      defense: "Def",
      focus: "Foc",
      speed: "Spd",
    };
    const summary = entries
      .map(([stat, value]) => `+${value} ${labels[stat]}`)
      .join(", ");
    return ` - ${summary}`;
  }

  private describeSupportLabel(moveId: string): string {
    const move = moveDex[moveId];
    switch (move.supportEffect?.type) {
      case "guard":
        return "Neutral guard";
      case "focus":
        return "Light focus setup";
      case "expose":
        return "Grass expose setup";
      default:
        return `${this.formatElementName(move.element)} support`;
    }
  }

  private describeHudMove(moveId: string): string {
    const move = moveDex[moveId];
    if (!move) {
      return "Unknown move.";
    }

    if (move.kind === "support") {
      return `${this.formatElementName(move.element)} support - ${move.description}`;
    }

    return `${this.formatElementName(move.element)} ${move.attackStyle ?? "impact"} ${move.power} power - ${move.description}`;
  }

  resolveActiveRescueEncounter(completion: "battleYield" | "trustPulse" = "battleYield"):
    | { text: string; dialogue: DialogueLine[]; retryText?: string; retryDialogue?: DialogueLine[] }
    | undefined {
    const activeEncounter = this.activeRescueEncounter;
    if (!activeEncounter) {
      return undefined;
    }

    const rescued = this.createVivo(activeEncounter.speciesId, activeEncounter.level, undefined, {
      formName: activeEncounter.formName,
    });
    const rescueBondText = this.applyScriptedRescueBond(rescued, activeEncounter, completion);
    const bondElement = activeEncounter.rescueBond?.element;
    const bondAmount = activeEncounter.rescueBond
      ? activeEncounter.rescueBond.amount +
        (completion === "trustPulse" ? (activeEncounter.rescueBond.trustPulseBonus ?? 0) : 0)
      : undefined;
    this.stampRescueMemory(rescued, {
      source: this.currentScene.name,
      method: "scriptedRescue",
      note:
        completion === "trustPulse"
          ? `${rescued.nickname} joined through a trust-first pulse before a knockout in ${this.currentScene.name}.`
          : `${rescued.nickname} joined after the sanctuary lesson was proven in ${this.currentScene.name}.`,
      bondElement,
      bondAmount,
    });
    const rosterMessage = this.addCapturedVivo(rescued);
    if (activeEncounter.hideAfterResolution) {
      this.resolvedRescueEncounterIds.add(activeEncounter.interactableId);
    }
    this.stewardshipEvidenceIds.add("sanctuaryRescueRecord");
    this.activeRescueEncounter = undefined;
    this.sceneVersion += 1;
    return {
      text: `${activeEncounter.rewardText} ${rescueBondText ? `${rescueBondText} ` : ""}${rosterMessage}`,
      dialogue:
        activeEncounter.rewardDialogue ??
        [{ speaker: "Field Note", text: `${activeEncounter.rewardText} ${rescueBondText ? `${rescueBondText} ` : ""}${rosterMessage}` }],
    };
  }

  private applyScriptedRescueBond(
    vivo: VivoInstance,
    activeEncounter: RescueEncounterState,
    completion: "battleYield" | "trustPulse",
  ): string | undefined {
    if (!activeEncounter.rescueBond) {
      return undefined;
    }

    const amount =
      activeEncounter.rescueBond.amount +
      (completion === "trustPulse" ? (activeEncounter.rescueBond.trustPulseBonus ?? 0) : 0);
    if (amount <= 0) {
      return undefined;
    }

    const total = this.grantAttunement(vivo, activeEncounter.rescueBond.element, amount);
    const elementName = this.formatElementName(activeEncounter.rescueBond.element).toLowerCase();
    const trustLine =
      completion === "trustPulse" && (activeEncounter.rescueBond.trustPulseBonus ?? 0) > 0
        ? " because the rescue ended through trust before a knockout"
        : "";
    return `${vivo.nickname} keeps ${amount} ${elementName} rescue bond mark${amount === 1 ? "" : "s"} from this sanctuary beat${trustLine}, now holding ${total}.`;
  }

  clearActiveRescueEncounter() {
    this.activeRescueEncounter = undefined;
  }

  private formatElementName(element: ElementType): string {
    return element.charAt(0).toUpperCase() + element.slice(1);
  }

  getCampaignProgression(): CampaignProgression {
    const chapterId = this.evaluateCampaignChapter();
    const chapters: Record<CampaignChapterId, Omit<CampaignProgression, "chapterId">> = {
      openingRescue: {
        chapterNumber: 1,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.openingRescue,
        objective: "Explore the open sanctuary routes and build a stronger team.",
        summary:
          "Briar's outer trail is open. Learn the nursery rescue lesson, find wild Vivos, and decide who will stand beside Dogemox.",
        complete: false,
      },
      gym1Preparation: {
        chapterNumber: 1,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym1Preparation,
        objective: "Awaken one route-tested bond before Senka's trial.",
        summary: this.getFirstGymReadinessBanner(),
        complete: false,
      },
      gym1Trial: {
        chapterNumber: 1,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym1Trial,
        objective: "Beat the first gym through rescue-bond strategy.",
        summary: "Leader Senka awaits inside Briar Gym.",
        complete: false,
      },
      gym1Aftermath: {
        chapterNumber: 1,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym1Aftermath,
        objective: "Drive off the confiscation patrol in Briar Town.",
        summary:
          "A confiscation patrol has reached Briar's notice board. Hold the line and reclaim the seized Vivo.",
        complete: false,
      },
      gym1Complete: {
        chapterNumber: 1,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym1Complete,
        objective: "Carry the sanctuary forward.",
        summary:
          "Gym 1 and its aftermath are complete. The next campaign chapter will open the route beyond Briar.",
        complete: true,
      },
      gym2FieldStudy: {
        chapterNumber: 2,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym2FieldStudy,
        objective: "Study how living habitats adapt inside Cadence Lab Annex.",
        summary:
          "Rhis is gone and Sporebell Garden is open from Lantern Nursery. Cross the garden, inspect the living Warning Light Tree in Cadence Lab Annex, then report back to Tamsin.",
        complete: false,
      },
      gym2Trial: {
        chapterNumber: 2,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym2Trial,
        objective: "Return to Sporebell Garden and pass Tamsin's adaptation trial.",
        summary:
          "The Warning Light Tree proves containment biology can choose its own stable rhythm. Tamsin is ready to test whether your team can protect that adaptation without controlling it.",
        complete: false,
      },
      gym2Complete: {
        chapterNumber: 2,
        chapterTitle: CAMPAIGN_CHAPTER_TITLES.gym2Complete,
        objective: "Carry Sporebell's habitat evidence toward the next sanctuary.",
        summary:
          "Tamsin's trial is complete. The Sporebell Adaptation Badge and Habitat Adaptation Study now strengthen the public case for free Vivos.",
        complete: true,
      },
    };
    return { chapterId, ...chapters[chapterId] };
  }

  private evaluateCampaignChapter(): CampaignChapterId {
    return this.evaluateCampaignChapterState(
      this.defeatedTrainerIds,
      this.party,
      this.usedInteractableIds,
    );
  }

  private evaluateCampaignChapterState(
    defeatedTrainerIds: ReadonlySet<string>,
    party: VivoInstance[],
    usedInteractableIds: ReadonlySet<string>,
  ): CampaignChapterId {
    if (defeatedTrainerIds.has("sporebellWardenTamsin")) {
      return "gym2Complete";
    }
    if (defeatedTrainerIds.has("townPatrolRhis") && usedInteractableIds.has("warningLightTree")) {
      return "gym2Trial";
    }
    if (defeatedTrainerIds.has("townPatrolRhis")) {
      return "gym2FieldStudy";
    }
    if (defeatedTrainerIds.has("gymLeaderSenka")) {
      return "gym1Aftermath";
    }
    const hasRouteMentor = FIRST_GYM_ROUTE_MENTOR_IDS.some((trainerId) =>
      defeatedTrainerIds.has(trainerId),
    );
    const hasAwakenedForm = party.some((vivo) => Boolean(vivo.formName));
    if (hasRouteMentor && hasAwakenedForm) {
      return "gym1Trial";
    }
    if (defeatedTrainerIds.has("nurseryTenderSola")) {
      return "gym1Preparation";
    }
    return "openingRescue";
  }

  private refreshCampaignChapter() {
    this.campaignChapterId = this.evaluateCampaignChapter();
  }

  private recordCampaignMilestone(chapterId: CampaignChapterId) {
    if (this.campaignMilestones[chapterId] !== undefined) return;
    this.syncPlayTime();
    this.campaignMilestones[chapterId] = this.persistedPlayTimeSeconds;
  }

  setPlaySessionActive(active: boolean) {
    if (this.playSessionActive === active) {
      return;
    }
    this.syncPlayTime();
    this.playSessionActive = active;
    this.playSessionStartedAt = Date.now();
  }

  getPlayTimeSeconds(): number {
    const activeSeconds = this.playSessionActive
      ? Math.max(0, Math.floor((Date.now() - this.playSessionStartedAt) / 1000))
      : 0;
    return this.persistedPlayTimeSeconds + activeSeconds;
  }

  getCampaignMilestones(): Partial<Record<CampaignChapterId, number>> {
    return { ...this.campaignMilestones };
  }

  getBadgeIds(): CampaignBadgeId[] {
    return [...this.badgeIds];
  }

  getStewardshipEvidenceIds(): StewardshipEvidenceId[] {
    return [...this.stewardshipEvidenceIds];
  }

  private getSnapshotBadgeIds(snapshot: Partial<SaveSnapshot>): CampaignBadgeId[] {
    const savedIds = (snapshot.badgeIds ?? []).filter(
      (badgeId): badgeId is CampaignBadgeId => badgeId in CAMPAIGN_BADGE_TITLES,
    );
    if (savedIds.length > 0) {
      return [...new Set(savedIds)];
    }
    const migratedIds: CampaignBadgeId[] = [];
    if (
      snapshot.defeatedTrainerIds?.includes("gymLeaderSenka") ||
      (typeof snapshot.badges === "number" && snapshot.badges > 0)
    ) {
      migratedIds.push("briarSteward");
    }
    if (
      snapshot.defeatedTrainerIds?.includes("sporebellWardenTamsin") ||
      (typeof snapshot.badges === "number" && snapshot.badges > 1)
    ) {
      migratedIds.push("sporebellAdaptation");
    }
    return migratedIds;
  }

  private getSnapshotStewardshipEvidenceIds(
    snapshot: Partial<SaveSnapshot>,
  ): StewardshipEvidenceId[] {
    const savedIds = (snapshot.stewardshipEvidenceIds ?? []).filter(
      (evidenceId): evidenceId is StewardshipEvidenceId =>
        evidenceId in STEWARDSHIP_EVIDENCE_TITLES,
    );
    if (savedIds.length > 0) {
      return [...new Set(savedIds)];
    }
    const migratedIds: StewardshipEvidenceId[] = [];
    if ((snapshot.resolvedRescueEncounterIds?.length ?? 0) > 0) {
      migratedIds.push("sanctuaryRescueRecord");
    }
    if (snapshot.defeatedTrainerIds?.includes("townPatrolRhis")) {
      migratedIds.push("briarDefenseTestimony");
    }
    if (snapshot.defeatedTrainerIds?.includes("sporebellWardenTamsin")) {
      migratedIds.push("habitatAdaptationStudy");
    }
    return migratedIds;
  }

  getCampaignPacingAssessment(
    chapterId: CampaignChapterId = this.getCampaignProgression().chapterId,
  ): CampaignPacingAssessment | undefined {
    return this.assessCampaignPacing(chapterId, this.campaignMilestones[chapterId]);
  }

  private assessCampaignPacing(
    chapterId: CampaignChapterId,
    actualSeconds?: number,
  ): CampaignPacingAssessment | undefined {
    const target = CAMPAIGN_COMPLETION_TARGETS[chapterId];
    if (!target) return undefined;
    const targetLabel = `${this.formatPlayTime(target.minimumSeconds)}-${this.formatPlayTime(target.maximumSeconds)}`;
    if (actualSeconds === undefined) {
      return { ...target, status: "unmeasured", label: `${targetLabel} target; not yet measured` };
    }
    const status: CampaignPacingStatus =
      actualSeconds < target.minimumSeconds
        ? "tooFast"
        : actualSeconds > target.maximumSeconds
          ? "tooSlow"
          : "onTarget";
    const verdict =
      status === "tooFast" ? "faster than target" : status === "tooSlow" ? "slower than target" : "on target";
    return { ...target, actualSeconds, status, label: `${targetLabel} target; ${verdict}` };
  }

  private syncPlayTime() {
    if (this.playSessionActive) {
      this.persistedPlayTimeSeconds = this.getPlayTimeSeconds();
    }
    this.playSessionStartedAt = Date.now();
  }

  private formatPlayTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  private getAwakenedPartyCount(): number {
    return this.party.filter((vivo) => vivo.formName).length;
  }

  private isFirstGymReady(): boolean {
    if (this.defeatedTrainerIds.has("gymLeaderSenka")) {
      return true;
    }

    return this.isRequirementMet({
      defeatedTrainerIdsAny: [...FIRST_GYM_ROUTE_MENTOR_IDS],
      partyFormCountAtLeast: 1,
    });
  }

  private getFirstGymReadinessBanner(): string {
    const missingSteps: string[] = [];
    const clearedMentorId = FIRST_GYM_ROUTE_MENTOR_IDS.find((trainerId) =>
      this.defeatedTrainerIds.has(trainerId),
    );

    if (!clearedMentorId) {
      missingSteps.push(
        "Clear one outer-route pressure test such as Vale, Nera, Tovin, Miren, Iven, or Orla so Briar sees your line hold outside the nursery.",
      );
    }

    if (this.getAwakenedPartyCount() < 1) {
      missingSteps.push(
        "Awaken one active Vivo form before the badge trial. Dogemox can reach Ignis Canis through fire bond marks and a fire win, Lumen Corvus can reach Astra Corvus through light growth, and Grimweld can reach Ironjaw Lupus through steel bond marks from Glassroot Burrow plus a steel win.",
      );
    }

    return `Senka keeps the badge trial in reserve until your roster proves real route growth. ${missingSteps.join(" ")}`;
  }
}

export type { BattleSetup };

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
