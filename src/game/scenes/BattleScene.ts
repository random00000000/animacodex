import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import { battleBackdropBySceneId } from "../data/assets";
import {
  creaturePortraitByFormName,
  creaturePortraitBySpeciesId,
  creatureRearPortraitByFormName,
  creatureRearPortraitBySpeciesId,
  type CreaturePortraitKey,
} from "../data/assets";
import { speciesDex } from "../data/species";
import type { BattlePresentationEvent } from "../systems/battle";
import type { GameState } from "../state/gameState";
import type { ElementType, VivoInstance } from "../state/types";
import {
  ensureBattleBackdropLoaded,
  ensureCreaturePortraitLoaded,
} from "./runtimeAssetLoader";
import type { BattlefieldCondition } from "../state/types";

const CAPTURE_MAX_PULL = 180;
const CAPTURE_LAUNCH_POWER = 0.19;
const CAPTURE_GRAVITY = 0.055;
const CAPTURE_TIME_STEP = 1;
const CAPTURE_HIT_RADIUS = 34;
const CAPTURE_GRAZE_RADIUS = 54;

export class BattleScene extends Phaser.Scene {
  private gameState!: GameState;
  private loadingGraphics?: Phaser.GameObjects.Graphics;
  private loadingText?: Phaser.GameObjects.Text;
  private background!: Phaser.GameObjects.Graphics;
  private backdropImage!: Phaser.GameObjects.Image;
  private fieldConditionGraphics!: Phaser.GameObjects.Graphics;
  private plaqueGraphics!: Phaser.GameObjects.Graphics;
  private vignette!: Phaser.GameObjects.Graphics;
  private statusGraphics!: Phaser.GameObjects.Graphics;
  private playerBody!: Phaser.GameObjects.Container;
  private enemyBody!: Phaser.GameObjects.Container;
  private battleText!: Phaser.GameObjects.Text;
  private playerStatusText!: Phaser.GameObjects.Text;
  private enemyStatusText!: Phaser.GameObjects.Text;
  private playerPlaqueText!: Phaser.GameObjects.Text;
  private enemyPlaqueText!: Phaser.GameObjects.Text;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private playerHpLabelText!: Phaser.GameObjects.Text;
  private enemyHpLabelText!: Phaser.GameObjects.Text;
  private enemyIntentText!: Phaser.GameObjects.Text;
  private fieldConditionText!: Phaser.GameObjects.Text;
  private effectLayer!: Phaser.GameObjects.Container;
  private boundClick?: (event: Event) => void;
  private boundKeyDown?: (event: KeyboardEvent) => void;
  private lastPlayerHp?: number;
  private lastEnemyHp?: number;
  private lastPresentationDuration = 0;
  private presentationToken = 0;
  private battleEnding = false;
  private battleViewReady = false;
  private selectedCommandIndex = 0;
  private commandLockedUntil = 0;
  private commandUnlockTimer?: Phaser.Time.TimerEvent;
  private captureThrow?: {
    active: boolean;
    dragging: boolean;
    origin: Phaser.Math.Vector2;
    target: Phaser.Math.Vector2;
    pull?: Phaser.Math.Vector2;
  };
  private captureThrowLayer?: Phaser.GameObjects.Container;
  private captureThrowGraphics?: Phaser.GameObjects.Graphics;
  private captureThrowText?: Phaser.GameObjects.Text;
  private audioContext?: AudioContext;
  private renderingBattle = false;
  private queuedBattleRender = false;

  constructor() {
    super("battle");
  }

  create() {
    this.resetBattleLifecycleState();
    this.gameState = this.registry.get("gameState") as GameState;
    if (!this.gameState.battle) {
      this.scene.start("world");
      return;
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
    this.prepareBattleView();
  }

  shutdown() {
    this.commandUnlockTimer?.remove(false);
    this.commandUnlockTimer = undefined;
    this.battleViewReady = false;
    this.battleEnding = false;
    this.renderingBattle = false;
    this.queuedBattleRender = false;
    this.commandLockedUntil = 0;
    this.selectedCommandIndex = 0;
    this.clearCaptureThrow();
    this.destroyLoadingView();
    if (this.boundClick) {
      this.gameState.hudRoot.removeEventListener("click", this.boundClick);
      this.boundClick = undefined;
    }
    if (this.boundKeyDown) {
      window.removeEventListener("keydown", this.boundKeyDown);
      this.boundKeyDown = undefined;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      void this.audioContext.close();
    }
    this.audioContext = undefined;
  }

  private resetBattleLifecycleState() {
    this.commandUnlockTimer?.remove(false);
    this.commandUnlockTimer = undefined;
    this.battleEnding = false;
    this.battleViewReady = false;
    this.renderingBattle = false;
    this.queuedBattleRender = false;
    this.commandLockedUntil = 0;
    this.selectedCommandIndex = 0;
    this.clearCaptureThrow();
  }

  private prepareBattleView() {
    const battle = this.gameState.battle;
    if (!battle) {
      this.scene.start("world");
      return;
    }

    this.streamBattleAssets();
    this.buildBattleView();
  }

  private showLoadingView() {
    if (!this.loadingGraphics) {
      this.loadingGraphics = this.add.graphics().setDepth(2);
    }
    this.loadingGraphics.clear();
    this.loadingGraphics.fillGradientStyle(0x131722, 0x131722, 0x344034, 0x20261f, 1);
    this.loadingGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.loadingGraphics.lineStyle(3, 0xebddb8, 0.4);
    this.loadingGraphics.strokeRoundedRect(120, 192, GAME_WIDTH - 240, 208, 28);
    this.loadingGraphics.fillStyle(0x11151d, 0.82);
    this.loadingGraphics.fillRoundedRect(134, 206, GAME_WIDTH - 268, 180, 24);

    if (!this.loadingText) {
      this.loadingText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT / 2, "", {
          fontFamily: "Georgia, serif",
          fontSize: "20px",
          color: "#f8efdb",
          align: "center",
          wordWrap: { width: 420 },
        })
        .setOrigin(0.5, 0.5)
        .setDepth(3);
    }
    this.loadingText.setText(
      "Settling the painted battle plate...\nLoading current Vivo portraits and field backdrop.",
    );
  }

  private destroyLoadingView() {
    this.loadingGraphics?.destroy();
    this.loadingGraphics = undefined;
    this.loadingText?.destroy();
    this.loadingText = undefined;
  }

  private buildBattleView() {
    this.destroyLoadingView();

    if (!this.battleViewReady) {
      this.background = this.add.graphics();
      this.backdropImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "");
      this.backdropImage.setVisible(false);
      this.fieldConditionGraphics = this.add.graphics();
      this.plaqueGraphics = this.add.graphics().setDepth(17);
      this.vignette = this.add.graphics();
      this.statusGraphics = this.add.graphics();
      this.battleText = this.add.text(32, 26, "", {
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: "14px",
        color: "#efe2b9",
        wordWrap: { width: 320 },
      });
      this.battleText.setDepth(18);
      this.battleText.setBackgroundColor("rgba(22, 24, 31, 0.74)");
      this.battleText.setPadding(12, 8, 12, 8);
      this.battleText.setVisible(false);
      this.playerStatusText = this.addStatusText(218, 528);
      this.enemyStatusText = this.addStatusText(710, 178);
      this.playerPlaqueText = this.addPlaqueText(588, 378, "left");
      this.enemyPlaqueText = this.addPlaqueText(54, 50, "left");
      this.playerHpText = this.addPlaqueSubText(722, 444, "right");
      this.enemyHpText = this.addPlaqueSubText(186, 104, "right");
      this.playerHpLabelText = this.addHpLabelText();
      this.enemyHpLabelText = this.addHpLabelText();
      this.enemyIntentText = this.add
        .text(674, 388, "", {
          fontFamily: "Georgia, serif",
          fontSize: "14px",
          color: "#f8efdb",
          align: "center",
          wordWrap: { width: 220 },
        })
        .setOrigin(0.5, 0.5)
        .setDepth(16)
        .setBackgroundColor("rgba(23, 27, 35, 0.76)")
        .setPadding(12, 10, 12, 10);
      this.enemyIntentText.setVisible(false);
      this.fieldConditionText = this.add
        .text(GAME_WIDTH / 2, 78, "", {
          fontFamily: "Georgia, serif",
          fontSize: "13px",
          color: "#f8efdb",
          align: "center",
          wordWrap: { width: 240 },
        })
        .setOrigin(0.5, 0.5)
        .setDepth(16)
        .setBackgroundColor("rgba(23, 27, 35, 0.8)")
        .setPadding(10, 8, 10, 8);
      this.fieldConditionText.setVisible(false);
      this.effectLayer = this.add.container(0, 0).setDepth(28);

      const battle = this.gameState.battle;
      if (!battle) {
        this.scene.start("world");
        return;
      }
      this.playerBody = this.buildVivoBody(222, 406, battle.playerActive, true);
      this.enemyBody = this.buildVivoBody(708, 218, battle.enemyActive, false);
      this.bindHudActions();
      this.battleViewReady = true;
    }

    this.renderBattleSafely();
  }

  private bindHudActions() {
    this.boundClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      this.primeBattleAudio();
      const button = target.closest<HTMLButtonElement>("[data-action]");
      const menuButton = target.closest<HTMLButtonElement>("[data-menu]");
      const studyButton = target.closest<HTMLButtonElement>("[data-study-action]");
      if (studyButton) {
        event.preventDefault();
        this.handleMoveStudyAction(studyButton);
        return;
      }
      if ((!button && !menuButton) || !this.gameState.battle) {
        return;
      }
      if (this.isCommandLocked()) {
        event.preventDefault();
        return;
      }
      if (menuButton && !button) {
        this.rememberSelectedButton(menuButton);
        const menu = menuButton.dataset.menu;
        if (menu === "root" || menu === "fight" || menu === "team" || menu === "bag") {
          this.gameState.battle.setCommandMenu(menu);
          this.selectedCommandIndex = 0;
          this.renderBattleSafely();
        }
        return;
      }
      this.rememberSelectedButton(button!);

      const action = button!.dataset.action;
      if (action === "capture") {
        event.preventDefault();
        this.beginCaptureThrow();
        return;
      }
      const payload = button!.dataset.moveId ?? button!.dataset.partyIndex;
      const battle = this.gameState.battle;
      const result = battle.handleDomAction(action ?? "", payload);
      if (result.finished) {
        this.finishAndReturnToWorld(battle);
        return;
      }
      this.renderBattleSafely();
    };
    this.gameState.hudRoot.addEventListener("click", this.boundClick);
    this.boundKeyDown = (event: KeyboardEvent) => this.handleBattleKeydown(event);
    window.addEventListener("keydown", this.boundKeyDown, { passive: false });
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handleCapturePointerDown(pointer));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.handleCapturePointerMove(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.handleCapturePointerUp(pointer));
  }

  private renderBattleSafely() {
    if (this.renderingBattle) {
      this.requestBattleRender();
      return;
    }

    this.renderingBattle = true;
    try {
      this.renderBattle();
    } catch (error) {
      console.error("Battle render failed; falling back to stable battle view.", error);
      this.renderFallbackBattleView(error);
    } finally {
      this.renderingBattle = false;
    }
  }

  private requestBattleRender() {
    if (this.queuedBattleRender || !this.scene.isActive("battle")) {
      return;
    }

    this.queuedBattleRender = true;
    this.time.delayedCall(0, () => {
      this.queuedBattleRender = false;
      if (this.scene.isActive("battle")) {
        this.renderBattleSafely();
      }
    });
  }

  private renderBattle() {
    const battle = this.gameState.battle;
    if (!battle) {
      this.scene.start("world");
      return;
    }

    const player = battle.playerActive;
    const enemy = battle.enemyActive;
    const enemySpecies = speciesDex[enemy.speciesId];
    const battleScene = this.gameState.getScene();
    const battleBackdrop = battleBackdropBySceneId[this.gameState.currentSceneId];

    this.streamBattleAssets();

    this.background.clear();
    if (battleBackdrop && this.setImageTextureSafely(this.backdropImage, battleBackdrop)) {
      this.backdropImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      this.backdropImage.setVisible(true);
      this.background.fillStyle(0x101319, 0.18);
      this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    } else {
      this.backdropImage.setVisible(false);
      this.drawGeneratedBattleBackdrop(player, enemy);
    }
    this.background.fillStyle(0xf2d68d, 0.18);
    this.background.fillEllipse(232, 470, 340, 152);
    this.background.fillEllipse(716, 256, 306, 132);
    this.background.fillStyle(0x1e241b, 0.18);
    this.background.fillEllipse(224, 506, 250, 60);
    this.background.fillEllipse(710, 278, 218, 48);
    this.renderBattlePlaques(player, enemy);
    this.renderFieldConditionView(battle.fieldCondition);
    this.vignette.clear();
    this.vignette.fillGradientStyle(0x0f1016, 0x0f1016, 0x0f1016, 0x0f1016, 0.08);
    this.vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.vignette.lineStyle(2, 0xf3e8cf, 0.22);
    this.vignette.strokeRect(14, 14, GAME_WIDTH - 28, GAME_HEIGHT - 28);

    this.updateVivoBody(this.playerBody, player, true);
    this.updateVivoBody(this.enemyBody, enemy, false);
    this.playerBody.setScale(Math.min(1.28, 1.04 + player.level * 0.018));
    this.enemyBody.setScale(Math.min(1.22, 1 + enemy.level * 0.016));
    this.renderTempoReadouts();
    this.renderIntentReadout();
    this.animateImpactDeltas(player.currentHp, enemy.currentHp);
    this.lastPresentationDuration = this.playPresentationEvents(battle.consumePresentationEvents());

    this.battleText.setText(`${battleScene.name} - ${enemySpecies.name} encounter`);

    this.gameState.renderHud();
    this.syncHudCommandSelection();
  }

  private renderFallbackBattleView(error: unknown) {
    const battle = this.gameState.battle;
    if (!battle || !this.background) {
      this.scene.start("world");
      return;
    }

    try {
      this.backdropImage?.setVisible(false);
      this.background.clear();
      this.background.fillGradientStyle(0x222838, 0x222838, 0x60765e, 0x303b2c, 1);
      this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.background.fillStyle(0xf2d68d, 0.2);
      this.background.fillEllipse(232, 470, 340, 152);
      this.background.fillEllipse(716, 256, 306, 132);
      this.battleText?.setText(
        [
          "Battle view recovered.",
          error instanceof Error ? error.message : "A late texture was not ready.",
        ].join("\n"),
      );
      this.battleText?.setVisible(true);
      this.updateVivoBody(this.playerBody, battle.playerActive, true);
      this.updateVivoBody(this.enemyBody, battle.enemyActive, false);
      this.renderBattlePlaques(battle.playerActive, battle.enemyActive);
      this.gameState.renderHud();
      this.syncHudCommandSelection();
    } catch (fallbackError) {
      console.error("Battle fallback render failed.", fallbackError);
      this.background.clear();
      this.background.fillGradientStyle(0x222838, 0x222838, 0x60765e, 0x303b2c, 1);
      this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      this.gameState.renderHud();
    }
  }

  private isTextureReady(key: string) {
    if (!this.textures.exists(key)) {
      return false;
    }
    const texture = this.textures.get(key) as Phaser.Textures.Texture | undefined;
    return Boolean(texture && texture.key === key && texture.source?.[0]);
  }

  private setImageTextureSafely(image: Phaser.GameObjects.Image, key: string) {
    if (!this.isTextureReady(key)) {
      return false;
    }

    try {
      image.setTexture(key);
      return true;
    } catch (error) {
      console.warn(`Texture '${key}' was not ready for battle rendering; falling back.`, error);
      return false;
    }
  }

  private finishAndReturnToWorld(battle: GameState["battle"]) {
    if (this.battleEnding) {
      return;
    }

    this.battleEnding = true;
    const resultText = this.gameState.currentMessage;
    const finalPresentationDuration = battle
      ? this.playPresentationEvents(battle.consumePresentationEvents())
      : 0;
    this.renderBattleEndHud(resultText);
    if (this.gameState.getPendingMoveChoices().length > 0) {
      this.time.delayedCall(Math.max(1450, finalPresentationDuration + 900), () => {
        this.renderBattleMoveStudyHud();
      });
      return;
    }
    this.time.delayedCall(Math.max(1800, finalPresentationDuration + 1100), () => {
      this.scene.start("world");
    });
  }

  private renderBattleEndHud(resultText: string) {
    document.body.classList.add("battle-active");
    this.gameState.hudRoot.classList.add("battle-hud-panel");
    this.gameState.hudRoot.innerHTML = `
      <div class="battle-rpg-shell battle-end-shell" aria-label="Battle result">
        <section class="battle-rpg-prompt battle-end-prompt">
          <p class="battle-rpg-question">The fight ended.</p>
          <p class="battle-rpg-log">${this.escapeHtml(resultText)}</p>
        </section>
        <section class="battle-rpg-menu battle-end-menu" aria-label="Battle result summary">
          <div class="battle-end-card">
            <p class="battle-end-label">Result</p>
            <p class="battle-end-copy">${this.escapeHtml(resultText)}</p>
          </div>
        </section>
      </div>
    `;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private getHudCommandButtons() {
    return Array.from(
      this.gameState.hudRoot.querySelectorAll<HTMLButtonElement>(
        ".battle-button[data-action], .battle-button[data-menu], .battle-button[data-study-action]",
      ),
    );
  }

  private handleMoveStudyAction(button: HTMLButtonElement) {
    const vivoId = button.dataset.vivoId;
    const moveId = button.dataset.moveId;
    if (!vivoId || !moveId) {
      return;
    }

    const action = button.dataset.studyAction;
    const message =
      action === "learn"
        ? this.gameState.learnPendingMove(vivoId, moveId, button.dataset.replaceMoveId ?? "")
        : this.gameState.declinePendingMove(vivoId, moveId);
    this.playMoveStudyConfirmSound(action === "learn");
    this.spawnCueText(GAME_WIDTH / 2, 120, message, action === "learn" ? 0xf6df9a : 0xe8dcc2, 16);

    if (this.gameState.getPendingMoveChoices().length > 0) {
      if (this.gameState.battle && !this.battleEnding) {
        this.renderBattleSafely();
      } else {
        this.renderBattleMoveStudyHud();
      }
      return;
    }

    if (this.gameState.battle && !this.battleEnding) {
      this.renderBattleSafely();
      return;
    }

    this.scene.start("world");
  }

  private renderBattleMoveStudyHud() {
    document.body.classList.add("battle-active");
    this.gameState.hudRoot.classList.add("battle-hud-panel");
    this.gameState.hudRoot.innerHTML = this.renderBattleMoveStudyMarkup();
    this.selectedCommandIndex = 0;
    this.syncHudCommandSelection();
  }

  private renderBattleMoveStudyMarkup() {
    const [pending] = this.gameState.getPendingMoveChoices();
    if (!pending) {
      return "";
    }

    const { vivo, choice } = pending;
    const nextMove = this.gameState.getMove(choice.moveId);
    const moveButtons = vivo.knownMoveIds
      .map((moveId, index) => {
        const move = this.gameState.getMove(moveId);
        const hotkey = String(index + 1);
        return `<button class="battle-button battle-command-study" data-study-action="learn" data-vivo-id="${vivo.id}" data-move-id="${choice.moveId}" data-replace-move-id="${moveId}" data-hotkey="${hotkey}">
          <span class="battle-button-title-row"><span>Replace ${move.name}</span><span class="battle-hotkey">${hotkey}</span></span>
          <small>${this.describeMoveForStudy(move)}</small>
        </button>`;
      })
      .join("");
    const keepHotkey = String(vivo.knownMoveIds.length + 1);
    return `
      <div class="battle-rpg-shell battle-study-shell" aria-label="Battle move study">
        <section class="battle-rpg-prompt battle-study-prompt">
          <p class="battle-rpg-question">${vivo.nickname} can learn ${nextMove.name}.</p>
          <p class="battle-rpg-state">Lv. ${choice.sourceLevel} field lesson</p>
          <p class="battle-rpg-log">${this.describeMoveForStudy(nextMove)}</p>
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
          <p class="battle-command-help">Choose now. The field returns after move study is settled.</p>
        </section>
      </div>
    `;
  }

  private describeMoveForStudy(move: ReturnType<GameState["getMove"]>) {
    if (move.kind === "support") {
      return `${this.formatElementName(move.element)} support - ${move.description}`;
    }

    return `${this.formatElementName(move.element)} ${move.attackStyle ?? "impact"} ${move.power} power - ${move.description}`;
  }

  private rememberSelectedButton(button: HTMLButtonElement) {
    const buttons = this.getHudCommandButtons();
    const index = buttons.indexOf(button);
    if (index >= 0) {
      this.selectedCommandIndex = index;
    }
  }

  private syncHudCommandSelection() {
    const buttons = this.getHudCommandButtons();
    if (buttons.length === 0) {
      this.selectedCommandIndex = 0;
      return;
    }

    this.selectedCommandIndex = Phaser.Math.Wrap(this.selectedCommandIndex, 0, buttons.length);
    buttons.forEach((button, index) => {
      const active = index === this.selectedCommandIndex;
      const locked = this.isCommandLocked();
      button.classList.toggle("active", active);
      button.classList.toggle("locked", locked);
      button.tabIndex = active ? 0 : -1;
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.setAttribute("aria-disabled", locked ? "true" : "false");
      if (active) {
        button.focus({ preventScroll: true });
      }
    });
  }

  private moveHudCommandSelection(direction: 1 | -1) {
    const buttons = this.getHudCommandButtons();
    if (buttons.length === 0) {
      return;
    }

    this.selectedCommandIndex = Phaser.Math.Wrap(
      this.selectedCommandIndex + direction,
      0,
      buttons.length,
    );
    this.syncHudCommandSelection();
  }

  private triggerHudCommand(button: HTMLButtonElement | undefined) {
    if (!button || this.isCommandLocked() || this.captureThrow?.active) {
      return;
    }
    button.click();
  }

  private triggerHudCommandByHotkey(hotkey: string) {
    const button = this.getHudCommandButtons().find((candidate) => candidate.dataset.hotkey === hotkey);
    if (!button) {
      return false;
    }
    this.rememberSelectedButton(button);
    this.triggerHudCommand(button);
    return true;
  }

  private handleBattleKeydown(event: KeyboardEvent) {
    const resolvingMoveStudy = this.gameState.getPendingMoveChoices().length > 0;
    if (
      !this.scene.isActive("battle") ||
      (!this.gameState.battle && !resolvingMoveStudy) ||
      (this.battleEnding && !resolvingMoveStudy)
    ) {
      return;
    }

    if (this.captureThrow?.active) {
      if (event.key === "Escape") {
        event.preventDefault();
        this.clearCaptureThrow();
        this.setHudCommandsLocked(false);
        this.syncHudCommandSelection();
      }
      return;
    }

    const activeTag = (document.activeElement as HTMLElement | null)?.tagName;
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      this.moveHudCommandSelection(event.shiftKey ? -1 : 1);
      return;
    }

    if (event.key === "ArrowUp" || event.key === "w" || event.key === "W") {
      event.preventDefault();
      this.moveHudCommandSelection(-1);
      return;
    }

    if (event.key === "ArrowDown" || event.key === "s" || event.key === "S") {
      event.preventDefault();
      this.moveHudCommandSelection(1);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (this.isCommandLocked()) {
        return;
      }
      const button = this.getHudCommandButtons()[this.selectedCommandIndex];
      this.triggerHudCommand(button);
      return;
    }

    if (/^[0-9]$/.test(event.key)) {
      event.preventDefault();
      if (this.isCommandLocked()) {
        return;
      }
      this.triggerHudCommandByHotkey(event.key);
      return;
    }

    if (resolvingMoveStudy) {
      return;
    }

    if ((event.key === "c" || event.key === "C") && this.triggerHudCommandByAction("capture")) {
      event.preventDefault();
      return;
    }

    if ((event.key === "m" || event.key === "M") && this.triggerHudCommandByAction("calm")) {
      event.preventDefault();
      return;
    }

    if ((event.key === "r" || event.key === "R") && this.triggerHudCommandByAction("retreat")) {
      event.preventDefault();
    }
  }

  private triggerHudCommandByAction(action: string) {
    if (this.isCommandLocked()) {
      return false;
    }
    const button = this.getHudCommandButtons().find((candidate) => candidate.dataset.action === action);
    if (!button) {
      return false;
    }
    this.rememberSelectedButton(button);
    this.triggerHudCommand(button);
    return true;
  }

  private isCommandLocked() {
    return this.time.now < this.commandLockedUntil || Boolean(this.captureThrow?.active);
  }

  private lockCommandsForPresentation(duration: number) {
    this.commandUnlockTimer?.remove(false);
    this.commandUnlockTimer = undefined;

    if (duration <= 0 || !this.gameState?.battle) {
      this.commandLockedUntil = 0;
      return;
    }

    this.commandLockedUntil = this.time.now + duration;
    this.setHudCommandsLocked(true);
    this.commandUnlockTimer = this.time.delayedCall(duration, () => {
      this.commandLockedUntil = 0;
      this.setHudCommandsLocked(false);
      this.syncHudCommandSelection();
    });
  }

  private setHudCommandsLocked(locked: boolean) {
    for (const button of this.getHudCommandButtons()) {
      button.classList.toggle("locked", locked);
      button.setAttribute("aria-disabled", locked ? "true" : "false");
    }
  }

  private beginCaptureThrow() {
    if (!this.gameState.battle || this.isCommandLocked()) {
      return;
    }

    const origin = new Phaser.Math.Vector2(this.playerBody.x + 74, this.playerBody.y - 84);
    const target = new Phaser.Math.Vector2(this.enemyBody.x + 12, this.enemyBody.y - 92);
    this.captureThrow = {
      active: true,
      dragging: false,
      origin,
      target,
    };
    this.setHudCommandsLocked(true);
    this.renderCaptureThrowOverlay();
  }

  private clearCaptureThrow() {
    this.captureThrow = undefined;
    this.captureThrowLayer?.destroy(true);
    this.captureThrowLayer = undefined;
    this.captureThrowGraphics = undefined;
    this.captureThrowText = undefined;
  }

  private renderCaptureThrowOverlay() {
    const captureThrow = this.captureThrow;
    if (!captureThrow) {
      return;
    }

    if (!this.captureThrowLayer) {
      this.captureThrowLayer = this.add.container(0, 0).setDepth(45);
      this.captureThrowGraphics = this.add.graphics();
      this.captureThrowText = this.add
        .text(GAME_WIDTH / 2, GAME_HEIGHT - 108, "", {
          fontFamily: "Georgia, serif",
          fontSize: "18px",
          color: "#fff4dc",
          align: "center",
          wordWrap: { width: 520 },
        })
        .setOrigin(0.5, 0.5)
        .setBackgroundColor("rgba(22, 24, 31, 0.82)")
        .setPadding(14, 9, 14, 9);
      this.captureThrowLayer.add([this.captureThrowGraphics, this.captureThrowText]);
    }

    const graphics = this.captureThrowGraphics!;
    graphics.clear();
    graphics.fillStyle(0x111318, 0.22);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.drawBullseye(graphics, captureThrow.target.x, captureThrow.target.y);
    this.drawCaptureCapsule(graphics, captureThrow.origin.x, captureThrow.origin.y, captureThrow.dragging);

    if (captureThrow.pull) {
      const trajectory = this.getCaptureTrajectory(captureThrow.origin, captureThrow.pull);
      const aim = this.getCaptureAimRead(trajectory, captureThrow.target);
      const pullStrength = Phaser.Math.Clamp(
        Phaser.Math.Distance.Between(
          captureThrow.origin.x,
          captureThrow.origin.y,
          captureThrow.pull.x,
          captureThrow.pull.y,
        ) / CAPTURE_MAX_PULL,
        0,
        1,
      );
      graphics.lineStyle(5, aim.tint, 0.88);
      graphics.strokeLineShape(
        new Phaser.Geom.Line(captureThrow.origin.x, captureThrow.origin.y, captureThrow.pull.x, captureThrow.pull.y),
      );
      graphics.lineStyle(3, aim.tint, 0.56);
      for (const [index, point] of trajectory.entries()) {
        if (index % 2 === 0) {
          graphics.strokeCircle(point.x, point.y, 4 + pullStrength * 2);
        }
      }
      graphics.lineStyle(3, aim.tint, 0.72);
      graphics.strokeCircle(captureThrow.target.x, captureThrow.target.y, aim.radius);
      this.captureThrowText?.setText(
        `Power ${Math.round(pullStrength * 100)}% - ${aim.label}. Release when the dotted arc crosses the bullseye.`,
      );
      return;
    }

    this.captureThrowText?.setText(
      captureThrow.dragging
        ? "Pull farther back to build power, then release when the arc lines up."
        : "Drag the rescue capsule backward and downward, then release. Esc cancels.",
    );
  }

  private drawBullseye(graphics: Phaser.GameObjects.Graphics, x: number, y: number) {
    graphics.lineStyle(5, 0xfff3c5, 0.95);
    graphics.strokeCircle(x, y, 24);
    graphics.lineStyle(4, 0xe05f55, 0.95);
    graphics.strokeCircle(x, y, 15);
    graphics.fillStyle(0xfff3c5, 0.92);
    graphics.fillCircle(x, y, 5);
    graphics.lineStyle(2, 0x14151a, 0.72);
    graphics.strokeLineShape(new Phaser.Geom.Line(x - 32, y, x - 12, y));
    graphics.strokeLineShape(new Phaser.Geom.Line(x + 12, y, x + 32, y));
    graphics.strokeLineShape(new Phaser.Geom.Line(x, y - 32, x, y - 12));
    graphics.strokeLineShape(new Phaser.Geom.Line(x, y + 12, x, y + 32));
  }

  private drawCaptureCapsule(graphics: Phaser.GameObjects.Graphics, x: number, y: number, active: boolean) {
    graphics.fillStyle(active ? 0xf7d98e : 0xe8d7ad, 0.98);
    graphics.fillCircle(x, y, 17);
    graphics.fillStyle(0x8fc8b2, 0.95);
    graphics.fillCircle(x, y, 9);
    graphics.lineStyle(3, 0x26251e, 0.76);
    graphics.strokeCircle(x, y, 17);
    graphics.strokeLineShape(new Phaser.Geom.Line(x - 15, y, x + 15, y));
  }

  private handleCapturePointerDown(pointer: Phaser.Input.Pointer) {
    const captureThrow = this.captureThrow;
    if (!captureThrow?.active) {
      return;
    }
    const point = this.getCapturePointerBoardPosition(pointer);
    if (Phaser.Math.Distance.Between(point.x, point.y, captureThrow.origin.x, captureThrow.origin.y) > 48) {
      return;
    }
    captureThrow.dragging = true;
    captureThrow.pull = point;
    this.renderCaptureThrowOverlay();
  }

  private handleCapturePointerMove(pointer: Phaser.Input.Pointer) {
    const captureThrow = this.captureThrow;
    if (!captureThrow?.active || !captureThrow.dragging) {
      return;
    }
    const pull = this.getCapturePointerBoardPosition(pointer);
    const fromOrigin = pull.clone().subtract(captureThrow.origin);
    if (fromOrigin.length() > CAPTURE_MAX_PULL) {
      fromOrigin.setLength(CAPTURE_MAX_PULL);
      pull.copy(captureThrow.origin.clone().add(fromOrigin));
    }
    captureThrow.pull = pull;
    this.renderCaptureThrowOverlay();
  }

  private handleCapturePointerUp(pointer: Phaser.Input.Pointer) {
    const captureThrow = this.captureThrow;
    if (!captureThrow?.active || !captureThrow.dragging) {
      return;
    }
    captureThrow.dragging = false;
    captureThrow.pull = captureThrow.pull ?? this.getCapturePointerBoardPosition(pointer);
    this.resolveCaptureThrow();
  }

  private getCapturePointerBoardPosition(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    const event = pointer.event as PointerEvent | MouseEvent | TouchEvent | undefined;
    const touch =
      typeof TouchEvent !== "undefined" && event instanceof TouchEvent
        ? event.touches[0] ?? event.changedTouches[0]
        : undefined;
    const clientX =
      touch?.clientX ??
      (event instanceof MouseEvent || event instanceof PointerEvent ? event.clientX : undefined);
    const clientY =
      touch?.clientY ??
      (event instanceof MouseEvent || event instanceof PointerEvent ? event.clientY : undefined);

    if (clientX === undefined || clientY === undefined) {
      return new Phaser.Math.Vector2(pointer.x, pointer.y);
    }

    const rect = this.game.canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / Math.max(1, rect.width);
    const scaleY = GAME_HEIGHT / Math.max(1, rect.height);
    return new Phaser.Math.Vector2(
      Phaser.Math.Clamp((clientX - rect.left) * scaleX, 0, GAME_WIDTH),
      Phaser.Math.Clamp((clientY - rect.top) * scaleY, 0, GAME_HEIGHT),
    );
  }

  private resolveCaptureThrow() {
    const captureThrow = this.captureThrow;
    const battle = this.gameState.battle;
    if (!captureThrow || !battle || !captureThrow.pull) {
      this.clearCaptureThrow();
      this.setHudCommandsLocked(false);
      return;
    }

    const trajectory = this.getCaptureTrajectory(captureThrow.origin, captureThrow.pull, 58);
    const aim = this.getCaptureAimRead(trajectory, captureThrow.target);
    const hit = aim.distance <= CAPTURE_HIT_RADIUS;
    this.animateCaptureProjectile(trajectory, hit, () => {
      const result = battle.handleDomAction("capture", hit ? "hit" : "miss");
      this.clearCaptureThrow();
      if (result.finished) {
        this.finishAndReturnToWorld(battle);
        return;
      }
      this.commandLockedUntil = 0;
      this.renderBattleSafely();
    });
  }

  private getCaptureTrajectory(
    origin: Phaser.Math.Vector2,
    pull: Phaser.Math.Vector2,
    steps = 24,
  ): Phaser.Math.Vector2[] {
    const velocity = origin.clone().subtract(pull).scale(CAPTURE_LAUNCH_POWER);
    return Array.from({ length: steps }, (_, index) => {
      const t = index * CAPTURE_TIME_STEP;
      return new Phaser.Math.Vector2(
        origin.x + velocity.x * t,
        origin.y + velocity.y * t + CAPTURE_GRAVITY * t * t,
      );
    }).filter((point) => point.x >= -40 && point.x <= GAME_WIDTH + 40 && point.y >= -40 && point.y <= GAME_HEIGHT + 80);
  }

  private getCaptureAimRead(
    trajectory: Phaser.Math.Vector2[],
    target: Phaser.Math.Vector2,
  ): { distance: number; label: string; radius: number; tint: number } {
    const distance = trajectory.reduce(
      (closest, point) => Math.min(closest, Phaser.Math.Distance.Between(point.x, point.y, target.x, target.y)),
      Number.POSITIVE_INFINITY,
    );
    if (distance <= CAPTURE_HIT_RADIUS) {
      return { distance, label: "clean capture line", radius: CAPTURE_HIT_RADIUS, tint: 0x9ee6a4 };
    }
    if (distance <= CAPTURE_GRAZE_RADIUS) {
      return { distance, label: "near miss", radius: CAPTURE_GRAZE_RADIUS, tint: 0xf6df9a };
    }
    return { distance, label: "short or wide", radius: CAPTURE_GRAZE_RADIUS, tint: 0xf0ae91 };
  }

  private animateCaptureProjectile(points: Phaser.Math.Vector2[], hit: boolean, onComplete: () => void) {
    const capsule = this.add.graphics().setDepth(48);
    this.effectLayer.add(capsule);
    let index = 0;
    const drawAt = (point: Phaser.Math.Vector2) => {
      capsule.clear();
      this.drawCaptureCapsule(capsule, point.x, point.y, true);
    };
    const timer = this.time.addEvent({
      delay: 14,
      repeat: Math.max(0, points.length - 1),
      callback: () => {
        drawAt(points[Math.min(index, points.length - 1)]);
        index += 1;
      },
    });
    this.time.delayedCall(Math.max(180, points.length * 14 + 80), () => {
      timer.remove(false);
      const finalPoint = points[Math.min(points.length - 1, Math.max(0, index - 1))];
      if (hit) {
        this.spawnCueText(finalPoint.x, finalPoint.y - 28, "Bullseye", 0xfff3c5, 18);
      } else {
        this.spawnCueText(finalPoint.x, finalPoint.y - 28, "Missed mark", 0xf0ae91, 16);
      }
      capsule.destroy();
      onComplete();
    });
  }

  private streamBattleAssets() {
    const battle = this.gameState.battle;
    if (!battle) {
      return;
    }

    const battleBackdrop = battleBackdropBySceneId[this.gameState.currentSceneId];
    if (battleBackdrop) {
      if (!this.isTextureReady(battleBackdrop)) {
        ensureBattleBackdropLoaded(this, battleBackdrop, () => {
          if (this.scene.isActive("battle")) {
            this.requestBattleRender();
          }
        });
      }
    }

    for (const [vivo, useRearPortrait] of [
      [battle.playerActive, true],
      [battle.enemyActive, false],
    ] as const) {
      const portraitKey = this.getPortraitKey(vivo, useRearPortrait);
      if (!portraitKey || this.isTextureReady(portraitKey)) {
        continue;
      }

      ensureCreaturePortraitLoaded(this, portraitKey, () => {
        if (this.scene.isActive("battle")) {
          this.requestBattleRender();
        }
      });
    }
  }

  private addStatusText(x: number, y: number): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, "", {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: "#fef6e9",
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(16);
  }

  private addPlaqueText(
    x: number,
    y: number,
    align: "left" | "center" | "right",
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, "", {
        fontFamily: "Georgia, serif",
        fontSize: "25px",
        color: "#191812",
        fontStyle: "bold",
        align,
        wordWrap: { width: 250 },
      })
      .setDepth(18);
  }

  private addPlaqueSubText(
    x: number,
    y: number,
    align: "left" | "center" | "right",
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, "", {
        fontFamily: "Georgia, serif",
        fontSize: "23px",
        color: "#191812",
        align,
        wordWrap: { width: 250 },
      })
      .setDepth(18);
  }

  private addHpLabelText(): Phaser.GameObjects.Text {
    return this.add
      .text(0, 0, "HP", {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: "20px",
        color: "#3d4249",
        fontStyle: "bold",
      })
      .setDepth(19);
  }

  private renderBattlePlaques(player: VivoInstance, enemy: VivoInstance) {
    this.plaqueGraphics.clear();

    this.drawStatusPlaque({
      x: 568,
      y: 320,
      width: 350,
      height: 122,
      plaqueSide: "player",
      vivo: player,
      title: this.getBattlePlaqueTitle(player),
      subtitle: this.getPlaqueSubtitle(player),
      hpText: `HP ${player.currentHp}/${this.gameState.getMaxHp(player)}`,
      align: "left",
    });
    this.drawPartyPips(636, 456);

    this.drawStatusPlaque({
      x: 42,
      y: 62,
      width: 338,
      height: 94,
      plaqueSide: "enemy",
      vivo: enemy,
      title: this.getBattlePlaqueTitle(enemy),
      subtitle: this.getPlaqueSubtitle(enemy),
      hpText: `HP ${enemy.currentHp}/${this.gameState.getMaxHp(enemy)}`,
      align: "left",
    });
  }

  private drawPartyPips(x: number, y: number) {
    const size = 26;
    const gap = 7;
    this.plaqueGraphics.fillStyle(0x1c2019, 0.58);
    this.plaqueGraphics.fillRoundedRect(x - 10, y - 7, size * 6 + gap * 5 + 20, 28, 14);
    this.gameState.party.slice(0, 6).forEach((vivo, index) => {
      const cx = x + index * (size + gap) + size / 2;
      const healthy = vivo.currentHp > 0;
      const active = index === 0;
      this.plaqueGraphics.fillStyle(active ? 0xb8792b : healthy ? 0x242820 : 0x6c5f56, 1);
      this.plaqueGraphics.fillCircle(cx, y + 7, size / 2);
      this.plaqueGraphics.lineStyle(active ? 4 : 3, active ? 0xf1db9a : 0xc9bea2, 0.94);
      this.plaqueGraphics.strokeCircle(cx, y + 7, size / 2);
      if (healthy) {
        this.plaqueGraphics.fillStyle(active ? 0xf1db9a : 0x87a45c, 0.95);
        this.plaqueGraphics.fillCircle(cx - 3, y + 4, 4);
      }
    });
    for (let index = this.gameState.party.length; index < 6; index += 1) {
      const cx = x + index * (size + gap) + size / 2;
      this.plaqueGraphics.fillStyle(0x242820, 0.45);
      this.plaqueGraphics.fillCircle(cx, y + 7, size / 2);
      this.plaqueGraphics.lineStyle(2, 0xc9bea2, 0.48);
      this.plaqueGraphics.strokeCircle(cx, y + 7, size / 2);
    }
  }

  private drawStatusPlaque({
    x,
    y,
    width,
    height,
    plaqueSide,
    vivo,
    title,
    subtitle,
    hpText,
    align,
  }: {
    x: number;
    y: number;
    width: number;
    height: number;
    plaqueSide: "player" | "enemy";
    vivo: VivoInstance;
    title: string;
    subtitle: string;
    hpText: string;
    align: "left" | "right";
  }) {
    const accent = this.getElementTint(vivo.element);
    const hpRatio = Phaser.Math.Clamp(vivo.currentHp / Math.max(1, this.gameState.getMaxHp(vivo)), 0, 1);
    const hpBarTone = hpRatio <= 0.25 ? 0xe78f78 : hpRatio <= 0.55 ? 0xe2c37d : 0x5ed43f;
    const textAnchorX = align === "left" ? x + 22 : x + width - 22;
    const titleText = plaqueSide === "player" ? this.playerPlaqueText : this.enemyPlaqueText;
    const hpTextObject = plaqueSide === "player" ? this.playerHpText : this.enemyHpText;
    const hpLabelText = plaqueSide === "player" ? this.playerHpLabelText : this.enemyHpLabelText;

    this.plaqueGraphics.fillStyle(0x1e211c, 0.38);
    this.plaqueGraphics.fillRoundedRect(x + 9, y + 9, width, height, 20);
    this.plaqueGraphics.fillStyle(0xf3e5bd, 0.96);
    this.plaqueGraphics.fillRoundedRect(x, y, width, height, 20);
    this.plaqueGraphics.lineStyle(5, 0x34342a, 0.96);
    this.plaqueGraphics.strokeRoundedRect(x, y, width, height, 20);
    this.plaqueGraphics.lineStyle(3, 0xb59a67, 0.9);
    this.plaqueGraphics.strokeRoundedRect(x + 8, y + 8, width - 16, height - 16, 14);
    this.plaqueGraphics.fillStyle(accent, 0.12);
    this.plaqueGraphics.fillRoundedRect(x + 16, y + height - 28, width - 32, 16, 8);

    const barX = x + 88;
    const barY = y + (plaqueSide === "player" ? 56 : 56);
    const barWidth = width - 130;
    this.plaqueGraphics.fillStyle(0x2b3027, 1);
    this.plaqueGraphics.fillRoundedRect(barX, barY, barWidth, 15, 8);
    this.plaqueGraphics.fillStyle(hpBarTone, 1);
    this.plaqueGraphics.fillRoundedRect(barX + 4, barY + 4, Math.max(5, (barWidth - 8) * hpRatio), 7, 4);
    this.plaqueGraphics.lineStyle(2, 0x171a16, 0.8);
    this.plaqueGraphics.strokeRoundedRect(barX, barY, barWidth, 15, 8);

    hpLabelText.setPosition(x + 32, barY - 4);
    hpLabelText.setVisible(true);

    titleText.setPosition(textAnchorX, y + 17);
    titleText.setOrigin(align === "left" ? 0 : 1, 0);
    titleText.setAlign(align);
    titleText.setColor("#191812");
    const titleLine = `${title} Lv. ${vivo.level}`;
    titleText.setFontSize(titleLine.length > 24 ? 19 : titleLine.length > 18 ? 22 : 25);
    titleText.setWordWrapWidth(width - 44);
    titleText.setText(titleLine);

    hpTextObject.setPosition(x + width - 30, barY + 18);
    hpTextObject.setOrigin(1, 0);
    hpTextObject.setAlign("right");
    hpTextObject.setColor("#191812");
    hpTextObject.setText(plaqueSide === "player" ? hpText.replace("HP ", "") : "");

    if (plaqueSide === "player") {
      const expY = y + 91;
      this.plaqueGraphics.fillStyle(0x282a23, 0.95);
      this.plaqueGraphics.fillRoundedRect(barX, expY, barWidth, 10, 5);
      this.plaqueGraphics.fillStyle(0x5fc3d1, 0.95);
      this.plaqueGraphics.fillRoundedRect(barX + 3, expY + 3, Math.max(14, barWidth * 0.22), 4, 3);
      this.plaqueGraphics.lineStyle(1, 0x11120f, 0.7);
      this.plaqueGraphics.strokeRoundedRect(barX, expY, barWidth, 10, 5);
    }
  }

  private getPlaqueSubtitle(vivo: VivoInstance) {
    const species = speciesDex[vivo.speciesId];
    const currentName = vivo.formName ?? species.name;
    const registryName = species.registryName ?? species.name;
    return `${currentName} | ${registryName}`;
  }

  private getBattlePlaqueTitle(vivo: VivoInstance) {
    const species = speciesDex[vivo.speciesId];
    if (vivo.formName && vivo.nickname === species.name) {
      return vivo.formName;
    }
    return vivo.nickname;
  }

  private buildVivoBody(
    x: number,
    y: number,
    vivo: VivoInstance,
    faceRight: boolean,
  ): Phaser.GameObjects.Container {
    const species = speciesDex[vivo.speciesId];
    const body = this.add.container(x, y);
    const torso = this.add.ellipse(0, 0, 126, 86, species.palette.primary);
    const head = this.add.circle(48, -26, 34, species.palette.secondary);
    const glow = this.add.circle(-18, -10, 18, species.palette.glow, 0.7);
    const eye = this.add.circle(58, -32, 4, 0x1b1a16);
    const tail = this.add.ellipse(-62, 4, 52, 28, species.palette.secondary);
    const fallbackShape = this.add.container(0, 0, [tail, torso, glow, head, eye]);
    const portraitFrame = this.add.image(0, 0, this.createPortraitFrameTexture()).setVisible(false);
    const portrait = this.add.image(0, -20, this.createPortraitFrameTexture()).setVisible(false);
    this.fitPortraitImage(portrait);
    portraitFrame.setDisplaySize(230, 230);
    body.add([fallbackShape, portrait, portraitFrame]);
    if (!faceRight) {
      portrait.setFlipX(true);
      fallbackShape.setScale(-1, 1);
    }
    this.updateVivoBody(body, vivo, faceRight);
    return body;
  }

  private updateVivoBody(
    container: Phaser.GameObjects.Container,
    vivo: VivoInstance,
    faceRight: boolean,
  ) {
    const species = speciesDex[vivo.speciesId];
    const [fallbackShape, portrait, portraitFrame] = container.list as [
      Phaser.GameObjects.Container,
      Phaser.GameObjects.Image,
      Phaser.GameObjects.Image,
    ];
    const [tail, torso, glowPart, head] = fallbackShape.list as Phaser.GameObjects.Shape[];
    tail.fillColor = species.palette.secondary;
    torso.fillColor = species.palette.primary;
    glowPart.fillColor = species.palette.glow;
    head.fillColor = species.palette.secondary;

    const portraitKey = this.getPortraitKey(vivo, faceRight);
    const hasPortrait = portraitKey ? this.isTextureReady(portraitKey) : false;
    if (hasPortrait && portraitKey) {
      if (this.setImageTextureSafely(portrait, portraitKey)) {
        fallbackShape.setVisible(false);
        portrait.setVisible(true);
        portraitFrame.setVisible(true);
        this.fitPortraitImage(portrait);
        portrait.setFlipX(!faceRight);
        portraitFrame.setTint(faceRight ? 0xe7d7b0 : 0xd8c2a4);
        return;
      }
    }

    const generatedPlateKey = this.createElementalVivoPlateTexture(vivo);
    if (this.setImageTextureSafely(portrait, generatedPlateKey)) {
      fallbackShape.setVisible(false);
      portrait.setVisible(true);
      portraitFrame.setVisible(true);
      portrait.setDisplaySize(204, 204);
      portrait.setFlipX(!faceRight);
      portraitFrame.setTint(this.getElementPalette(vivo.element).frame);
      return;
    }

    fallbackShape.setVisible(true);
    portrait.setVisible(false);
    portraitFrame.setVisible(false);
  }

  private fitPortraitImage(portrait: Phaser.GameObjects.Image) {
    const maxWidth = 204;
    const maxHeight = 204;
    const frameWidth = portrait.frame.realWidth || maxWidth;
    const frameHeight = portrait.frame.realHeight || maxHeight;
    const scale = Math.min(maxWidth / frameWidth, maxHeight / frameHeight);
    portrait.setDisplaySize(frameWidth * scale, frameHeight * scale);
  }

  private getPortraitKey(
    vivo: VivoInstance,
    useRearPortrait = false,
  ): CreaturePortraitKey | undefined {
    if (useRearPortrait && vivo.formName) {
      const rearPortrait = creatureRearPortraitByFormName[vivo.formName];
      if (rearPortrait) {
        return rearPortrait;
      }
    }
    if (useRearPortrait) {
      const rearPortrait = creatureRearPortraitBySpeciesId[vivo.speciesId];
      if (rearPortrait) {
        return rearPortrait;
      }
    }
    if (vivo.formName) {
      const formPortrait = creaturePortraitByFormName[vivo.formName];
      if (formPortrait) {
        return formPortrait;
      }
    }
    return creaturePortraitBySpeciesId[vivo.speciesId];
  }

  private createPortraitFrameTexture(): string {
    const key = "battlePortraitFrame";
    if (this.textures.exists(key)) {
      return key;
    }

    const graphics = this.add.graphics();
    graphics.lineStyle(8, 0xe8d7ad, 0.9);
    graphics.strokeRoundedRect(4, 4, 222, 222, 30);
    graphics.fillStyle(0xe8d7ad, 0.9);
    graphics.fillCircle(28, 28, 6);
    graphics.fillCircle(202, 28, 6);
    graphics.fillCircle(28, 202, 6);
    graphics.fillCircle(202, 202, 6);
    graphics.generateTexture(key, 230, 230);
    graphics.destroy();
    return key;
  }

  private drawGeneratedBattleBackdrop(player: VivoInstance, enemy: VivoInstance) {
    const playerPalette = this.getElementPalette(player.element);
    const enemyPalette = this.getElementPalette(enemy.element);
    this.background.fillGradientStyle(
      playerPalette.backdropTop,
      enemyPalette.backdropTop,
      playerPalette.backdropBottom,
      enemyPalette.backdropBottom,
      1,
    );
    this.background.fillRect(0, 0, this.scale.width, this.scale.height);
    this.background.fillStyle(0xf6e6b7, 0.08);
    this.background.fillCircle(176, 112, 90);
    this.background.fillCircle(796, 92, 76);
    this.background.lineStyle(2, playerPalette.ring, 0.18);
    for (let i = 0; i < 4; i += 1) {
      this.background.strokeEllipse(236, 468, 360 + i * 34, 148 + i * 16);
    }
    this.background.lineStyle(2, enemyPalette.ring, 0.18);
    for (let i = 0; i < 4; i += 1) {
      this.background.strokeEllipse(716, 252, 320 + i * 30, 128 + i * 14);
    }
    this.background.fillStyle(0x12151c, 0.24);
    this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createElementalVivoPlateTexture(vivo: VivoInstance): string {
    const species = speciesDex[vivo.speciesId];
    const formKey = vivo.formName?.replace(/[^a-z0-9]+/gi, "-").toLowerCase() ?? "base";
    const key = `generated-vivo-plate-${vivo.speciesId}-${formKey}-${vivo.element}`;
    if (this.textures.exists(key)) {
      return key;
    }

    const palette = this.getElementPalette(vivo.element);
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(palette.plateTop, palette.plateTop, palette.plateBottom, palette.plateBottom, 1);
    graphics.fillRoundedRect(0, 0, 230, 230, 30);
    graphics.lineStyle(7, palette.frame, 0.95);
    graphics.strokeRoundedRect(7, 7, 216, 216, 26);
    graphics.fillStyle(0xfff4c7, 0.18);
    graphics.fillCircle(62, 52, 36);
    graphics.fillCircle(172, 58, 24);
    graphics.fillStyle(species.palette.glow, 0.18);
    graphics.fillCircle(116, 120, 78);

    this.drawElementGlyph(graphics, vivo.element, 115, 58, 0.76);
    this.drawGeneratedCreatureSilhouette(graphics, species.palette.primary, species.palette.secondary, species.palette.glow);

    graphics.lineStyle(2, 0x2b261b, 0.35);
    graphics.strokeEllipse(114, 178, 120, 18);
    graphics.generateTexture(key, 230, 230);
    graphics.destroy();
    return key;
  }

  private drawGeneratedCreatureSilhouette(
    graphics: Phaser.GameObjects.Graphics,
    primary: number,
    secondary: number,
    glow: number,
  ) {
    graphics.fillStyle(0x161814, 0.2);
    graphics.fillEllipse(112, 178, 128, 28);
    graphics.fillStyle(primary, 0.98);
    graphics.fillEllipse(104, 134, 112, 76);
    graphics.fillStyle(secondary, 0.98);
    graphics.fillCircle(148, 102, 35);
    graphics.fillEllipse(54, 130, 50, 25);
    graphics.fillTriangle(135, 74, 148, 40, 158, 76);
    graphics.fillTriangle(162, 78, 185, 52, 176, 92);
    graphics.fillStyle(glow, 0.82);
    graphics.fillCircle(92, 126, 18);
    graphics.fillCircle(153, 102, 7);
    graphics.fillStyle(0x12120f, 0.9);
    graphics.fillCircle(159, 96, 4);
    graphics.lineStyle(5, secondary, 0.95);
    graphics.lineBetween(62, 112, 28, 88);
    graphics.lineBetween(126, 164, 142, 198);
    graphics.lineBetween(82, 164, 68, 198);
  }

  private drawElementGlyph(
    graphics: Phaser.GameObjects.Graphics,
    element: ElementType,
    x: number,
    y: number,
    alpha = 1,
  ) {
    const palette = this.getElementPalette(element);
    graphics.fillStyle(palette.glyph, alpha);
    graphics.lineStyle(4, palette.glyphLine, alpha);
    switch (element) {
      case "electric":
        graphics.fillCircle(x, y, 22);
        graphics.lineBetween(x - 8, y - 34, x + 10, y - 2);
        graphics.lineBetween(x + 10, y - 2, x - 2, y - 2);
        graphics.lineBetween(x - 2, y - 2, x + 9, y + 34);
        break;
      case "fire":
        graphics.fillTriangle(x, y - 34, x - 24, y + 28, x + 22, y + 28);
        graphics.fillCircle(x + 4, y + 8, 18);
        break;
      case "grass":
        graphics.fillEllipse(x - 12, y, 34, 58);
        graphics.fillEllipse(x + 14, y + 4, 30, 50);
        graphics.lineBetween(x - 20, y + 28, x + 24, y - 22);
        break;
      case "light":
        graphics.fillCircle(x, y, 22);
        for (let i = 0; i < 8; i += 1) {
          const angle = (Math.PI * 2 * i) / 8;
          graphics.lineBetween(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30, x + Math.cos(angle) * 42, y + Math.sin(angle) * 42);
        }
        break;
      case "shadow":
        graphics.fillCircle(x, y, 24);
        graphics.fillCircle(x + 10, y - 4, 16);
        graphics.strokeCircle(x, y, 34);
        graphics.lineBetween(x - 20, y + 12, x + 18, y - 16);
        break;
      case "water":
        graphics.fillCircle(x, y + 8, 22);
        graphics.fillTriangle(x, y - 36, x - 22, y + 2, x + 22, y + 2);
        graphics.strokeCircle(x, y + 8, 28);
        graphics.lineBetween(x - 14, y + 24, x + 18, y - 18);
        break;
      case "steel":
        graphics.fillRoundedRect(x - 30, y - 24, 60, 48, 8);
        graphics.strokeRoundedRect(x - 30, y - 24, 60, 48, 8);
        graphics.lineBetween(x - 18, y - 10, x + 18, y + 10);
        graphics.lineBetween(x + 18, y - 10, x - 18, y + 10);
        break;
      default:
        graphics.fillCircle(x, y, 24);
        graphics.strokeCircle(x, y, 34);
        break;
    }
  }

  private getElementPalette(element: ElementType) {
    switch (element) {
      case "electric":
        return {
          plateTop: 0xaadff0,
          plateBottom: 0x435066,
          frame: 0xd4edf0,
          glyph: 0x9decff,
          glyphLine: 0x5b4b2c,
          backdropTop: 0x203047,
          backdropBottom: 0x5f704f,
          ring: 0x9ceaff,
        };
      case "fire":
        return {
          plateTop: 0xf4b05f,
          plateBottom: 0x7c3428,
          frame: 0xf5cf86,
          glyph: 0xffdd82,
          glyphLine: 0x6c2c21,
          backdropTop: 0x3b2d36,
          backdropBottom: 0x7d5130,
          ring: 0xf1a85f,
        };
      case "grass":
        return {
          plateTop: 0xb8d996,
          plateBottom: 0x315f3f,
          frame: 0xddeab7,
          glyph: 0xd8ed9c,
          glyphLine: 0x2f5a38,
          backdropTop: 0x24313a,
          backdropBottom: 0x566f3f,
          ring: 0xb6d97c,
        };
      case "light":
        return {
          plateTop: 0xf2e9b6,
          plateBottom: 0x66778f,
          frame: 0xf5e8ae,
          glyph: 0xfff0a8,
          glyphLine: 0x52647c,
          backdropTop: 0x30354e,
          backdropBottom: 0x7b8065,
          ring: 0xf1e7a4,
        };
      case "shadow":
        return {
          plateTop: 0x9180b3,
          plateBottom: 0x211d2d,
          frame: 0xb9a7da,
          glyph: 0xc8b8ea,
          glyphLine: 0x261f34,
          backdropTop: 0x191721,
          backdropBottom: 0x43324f,
          ring: 0xa895cf,
        };
      case "steel":
        return {
          plateTop: 0xb5c3c5,
          plateBottom: 0x48545a,
          frame: 0xd8e1dd,
          glyph: 0xd7e0df,
          glyphLine: 0x344047,
          backdropTop: 0x242a34,
          backdropBottom: 0x596163,
          ring: 0xc8d3d6,
        };
      case "water":
        return {
          plateTop: 0xa7d4df,
          plateBottom: 0x31576a,
          frame: 0xc7edf0,
          glyph: 0x9ee4ef,
          glyphLine: 0x244b5c,
          backdropTop: 0x223447,
          backdropBottom: 0x3f7180,
          ring: 0x96d8e2,
        };
      default:
        return {
          plateTop: 0xe4d4a7,
          plateBottom: 0x806b4a,
          frame: 0xe8d7ad,
          glyph: 0xf3dfad,
          glyphLine: 0x5d4c35,
          backdropTop: 0x2c2e3f,
          backdropBottom: 0x72886b,
          ring: 0xf2d68d,
        };
    }
  }

  private renderTempoReadouts() {
    const battle = this.gameState.battle;
    if (!battle) {
      return;
    }

    const playerEffects = battle.getTempoEffects(battle.playerActive);
    const enemyEffects = battle.getTempoEffects(battle.enemyActive);
    this.playerStatusText.setVisible(false);
    this.enemyStatusText.setVisible(false);
    this.playerStatusText.setText(this.describeTempoEffects(playerEffects));
    this.enemyStatusText.setText(this.describeTempoEffects(enemyEffects));

    this.statusGraphics.clear();
    this.drawTempoEffects(this.playerBody.x, this.playerBody.y, playerEffects, true);
    this.drawTempoEffects(this.enemyBody.x, this.enemyBody.y, enemyEffects, false);
  }

  private renderIntentReadout() {
    const battle = this.gameState.battle;
    if (!battle) {
      return;
    }

    const intent = battle.getEnemyIntentPreview();
    this.enemyIntentText.setVisible(false);
    this.enemyIntentText.setText([intent.label, intent.summary]);
    switch (intent.stance) {
      case "danger":
        this.enemyIntentText.setColor("#ffe0d2");
        this.enemyIntentText.setBackgroundColor("rgba(88, 35, 27, 0.82)");
        break;
      case "warning":
        this.enemyIntentText.setColor("#f8efdb");
        this.enemyIntentText.setBackgroundColor("rgba(77, 63, 30, 0.82)");
        break;
      default:
        this.enemyIntentText.setColor("#e4f0de");
        this.enemyIntentText.setBackgroundColor("rgba(30, 56, 46, 0.78)");
        break;
    }
  }

  private renderFieldConditionView(fieldCondition: BattlefieldCondition | undefined) {
    this.fieldConditionGraphics.clear();
    if (!fieldCondition) {
      this.fieldConditionText.setVisible(false);
      return;
    }

    const accent = this.getFieldConditionTint(fieldCondition);
    this.fieldConditionText.setVisible(false);
    this.fieldConditionText.setText([fieldCondition.name, fieldCondition.summary]);
    this.fieldConditionText.setColor("#fff4dc");
    this.fieldConditionText.setBackgroundColor("rgba(23, 27, 35, 0.82)");

    const effect = fieldCondition.effect;
    if (effect.type === "switchGuard") {
      this.fieldConditionGraphics.lineStyle(4, accent, 0.42);
      this.fieldConditionGraphics.strokeEllipse(224, 468, 320, 152);
      this.fieldConditionGraphics.strokeEllipse(712, 252, 286, 132);
      this.fieldConditionGraphics.lineStyle(2, accent, 0.36);
      this.fieldConditionGraphics.beginPath();
      this.fieldConditionGraphics.arc(
        224,
        468,
        168,
        Phaser.Math.DegToRad(205),
        Phaser.Math.DegToRad(332),
        false,
      );
      this.fieldConditionGraphics.strokePath();
      this.fieldConditionGraphics.beginPath();
      this.fieldConditionGraphics.arc(
        712,
        252,
        150,
        Phaser.Math.DegToRad(205),
        Phaser.Math.DegToRad(332),
        false,
      );
      this.fieldConditionGraphics.strokePath();
      return;
    }

    if (effect.type === "focusSurge") {
      this.fieldConditionGraphics.lineStyle(4, accent, 0.32);
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(480, 44, 612, 182));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(480, 44, 710, 214));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(480, 44, 808, 182));
      this.fieldConditionGraphics.fillStyle(accent, 0.18);
      this.fieldConditionGraphics.fillCircle(480, 44, 18);
      this.fieldConditionGraphics.fillCircle(612, 182, 10);
      this.fieldConditionGraphics.fillCircle(710, 214, 10);
      this.fieldConditionGraphics.fillCircle(808, 182, 10);
      return;
    }

    if (effect.type === "captureCalm") {
      this.fieldConditionGraphics.lineStyle(3, accent, 0.28);
      this.fieldConditionGraphics.strokeEllipse(224, 468, 300, 132);
      this.fieldConditionGraphics.strokeEllipse(712, 252, 264, 116);
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(110, 496, 338, 496));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(584, 278, 830, 278));
      this.fieldConditionGraphics.fillStyle(accent, 0.12);
      this.fieldConditionGraphics.fillCircle(188, 438, 18);
      this.fieldConditionGraphics.fillCircle(742, 220, 16);
      this.fieldConditionGraphics.fillCircle(784, 246, 10);
      this.fieldConditionGraphics.fillCircle(248, 490, 10);
      return;
    }

    if (effect.type === "elementBoost" && effect.element === "fire") {
      this.fieldConditionGraphics.fillStyle(accent, 0.18);
      for (const [x, y, radius] of [
        [164, 402, 10],
        [242, 366, 8],
        [678, 206, 10],
        [744, 184, 8],
        [790, 226, 6],
      ] as const) {
        this.fieldConditionGraphics.fillCircle(x, y, radius);
      }
      this.fieldConditionGraphics.lineStyle(3, accent, 0.3);
      this.fieldConditionGraphics.strokeEllipse(224, 468, 308, 138);
      this.fieldConditionGraphics.strokeEllipse(712, 252, 272, 120);
      return;
    }

    if (effect.type === "elementBoost" && effect.element === "electric") {
      this.fieldConditionGraphics.lineStyle(4, accent, 0.34);
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(148, 514, 240, 448));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(240, 448, 204, 392));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(660, 292, 746, 238));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(746, 238, 804, 282));
      this.fieldConditionGraphics.fillStyle(accent, 0.12);
      this.fieldConditionGraphics.fillCircle(224, 468, 42);
      this.fieldConditionGraphics.fillCircle(712, 252, 36);
      return;
    }

    if (effect.type === "elementBoost" && effect.element === "grass") {
      this.fieldConditionGraphics.lineStyle(4, accent, 0.32);
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(118, 536, 186, 472));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(186, 472, 248, 502));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(654, 298, 714, 246));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(714, 246, 782, 278));
      this.fieldConditionGraphics.fillStyle(accent, 0.14);
      this.fieldConditionGraphics.fillEllipse(224, 468, 300, 130);
      this.fieldConditionGraphics.fillEllipse(712, 252, 262, 112);
      return;
    }

    if (effect.type === "elementBoost" && effect.element === "shadow") {
      this.fieldConditionGraphics.lineStyle(4, accent, 0.3);
      this.fieldConditionGraphics.strokeEllipse(224, 468, 304, 132);
      this.fieldConditionGraphics.strokeEllipse(712, 252, 268, 116);
      this.fieldConditionGraphics.fillStyle(accent, 0.1);
      this.fieldConditionGraphics.fillCircle(170, 434, 22);
      this.fieldConditionGraphics.fillCircle(760, 222, 18);
      this.fieldConditionGraphics.lineStyle(3, accent, 0.22);
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(138, 498, 286, 432));
      this.fieldConditionGraphics.strokeLineShape(new Phaser.Geom.Line(642, 284, 790, 216));
    }
  }

  private describeTempoEffects(effects: Array<"guarded" | "focused" | "exposed">): string {
    if (effects.length === 0) {
      return "Steady footing";
    }

    return effects
      .map((effect) => {
        switch (effect) {
          case "guarded":
            return "Guard up";
          case "focused":
            return "Focus primed";
          case "exposed":
            return "Exposed";
        }
      })
      .join(" | ");
  }

  private drawTempoEffects(
    x: number,
    y: number,
    effects: Array<"guarded" | "focused" | "exposed">,
    playerSide: boolean,
  ) {
    if (effects.includes("guarded")) {
      this.statusGraphics.lineStyle(4, 0x8fc8b2, 0.9);
      this.statusGraphics.strokeEllipse(x, y + 2, 206, 142);
    }

    if (effects.includes("focused")) {
      this.statusGraphics.lineStyle(3, 0xf6df9a, 0.92);
      this.statusGraphics.strokeCircle(x + (playerSide ? 88 : -88), y - 70, 20);
      this.statusGraphics.fillStyle(0xf6df9a, 0.9);
      this.statusGraphics.fillCircle(x + (playerSide ? 88 : -88), y - 70, 4);
      this.statusGraphics.fillCircle(x + (playerSide ? 68 : -68), y - 50, 3);
      this.statusGraphics.fillCircle(x + (playerSide ? 106 : -106), y - 44, 3);
    }

    if (effects.includes("exposed")) {
      this.statusGraphics.lineStyle(3, 0xe9967a, 0.95);
      this.statusGraphics.strokeRect(x - 112, y - 98, 224, 176);
      this.statusGraphics.strokeLineShape(
        new Phaser.Geom.Line(x - 126, y, x - 94, y),
      );
      this.statusGraphics.strokeLineShape(
        new Phaser.Geom.Line(x + 94, y, x + 126, y),
      );
      this.statusGraphics.strokeLineShape(
        new Phaser.Geom.Line(x, y - 112, x, y - 80),
      );
      this.statusGraphics.strokeLineShape(
        new Phaser.Geom.Line(x, y + 60, x, y + 92),
      );
    }
  }

  private animateImpactDeltas(playerHp: number, enemyHp: number) {
    const playerDelta = this.lastPlayerHp === undefined ? 0 : playerHp - this.lastPlayerHp;
    const enemyDelta = this.lastEnemyHp === undefined ? 0 : enemyHp - this.lastEnemyHp;
    const playerLostHp = playerDelta < 0;
    const enemyLostHp = enemyDelta < 0;

    if (playerLostHp) {
      this.tweens.add({
        targets: this.playerBody,
        x: this.playerBody.x - 18,
        duration: 75,
        yoyo: true,
        ease: "Sine.easeOut",
      });
      this.cameras.main.shake(90, 0.003);
    }

    if (enemyLostHp) {
      this.tweens.add({
        targets: this.enemyBody,
        x: this.enemyBody.x + 18,
        duration: 75,
        yoyo: true,
        ease: "Sine.easeOut",
      });
    }

    if (playerLostHp || enemyLostHp) {
      this.background.fillStyle(playerLostHp ? 0x7a1f1f : 0xf3d69a, playerLostHp ? 0.14 : 0.1);
      this.background.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }

    if (playerDelta !== 0) {
      this.spawnCueText(196, 408, this.formatHpDelta(playerDelta), playerDelta > 0 ? 0x8fd3a3 : 0xf0ae91, 15);
    }
    if (enemyDelta !== 0) {
      this.spawnCueText(702, 34, this.formatHpDelta(enemyDelta), enemyDelta > 0 ? 0x8fd3a3 : 0xf0ae91, 15);
    }

    this.lastPlayerHp = playerHp;
    this.lastEnemyHp = enemyHp;
  }

  private formatHpDelta(delta: number) {
    return delta > 0 ? `+${delta} HP` : `${delta} HP`;
  }

  private playPresentationEvents(events: BattlePresentationEvent[]): number {
    this.presentationToken += 1;
    const token = this.presentationToken;
    this.effectLayer.removeAll(true);

    if (events.length === 0) {
      this.lockCommandsForPresentation(0);
      return 0;
    }

    let delay = 0;
    for (const event of events) {
      this.time.delayedCall(delay, () => {
        if (token !== this.presentationToken) {
          return;
        }
        this.playPresentationEvent(event);
      });
      delay += this.getPresentationDelay(event);
    }

    this.lockCommandsForPresentation(delay);
    return delay;
  }

  private getPresentationDelay(event: BattlePresentationEvent): number {
    switch (event.type) {
      case "attack":
        return event.fainted ? 430 : 280;
      case "capture":
        return event.success ? 460 : 260;
      case "levelUp":
        return 520;
      case "moveUnlock":
        return 420;
      case "faint":
        return 260;
      default:
        return 220;
    }
  }

  private playPresentationEvent(event: BattlePresentationEvent) {
    switch (event.type) {
      case "attack":
        this.playAttackEvent(event);
        return;
      case "support":
        this.playSupportEvent(event);
        return;
      case "switch":
        this.playSwitchEvent(event);
        return;
      case "capture":
        this.playCaptureEvent(event);
        return;
      case "faint":
        this.playFaintEvent(event);
        return;
      case "trait":
        this.playTraitEvent(event);
        return;
      case "tempoShift":
        this.playTempoShiftEvent(event);
        return;
      case "levelUp":
        this.playLevelUpEvent(event);
        return;
      case "moveUnlock":
        this.playMoveUnlockEvent(event);
        return;
    }
  }

  private playAttackEvent(event: Extract<BattlePresentationEvent, { type: "attack" }>) {
    const attackerBody = event.side === "player" ? this.playerBody : this.enemyBody;
    const defenderBody = event.targetSide === "player" ? this.playerBody : this.enemyBody;
    const direction = event.side === "player" ? 1 : -1;
    const tint = this.getElementTint(event.element);

    this.tweens.add({
      targets: attackerBody,
      x: attackerBody.x + direction * 20,
      duration: 88,
      yoyo: true,
      ease: "Sine.easeInOut",
    });

    const strike = this.add.graphics().setDepth(27);
    strike.lineStyle(event.attackStyle === "focus" ? 8 : 12, tint, 0.92);
    strike.beginPath();
    strike.moveTo(attackerBody.x + direction * 32, attackerBody.y - 18);
    strike.lineTo(defenderBody.x - direction * 42, defenderBody.y - 8);
    strike.strokePath();
    if (event.attackStyle === "focus") {
      strike.fillStyle(tint, 0.28);
      strike.fillCircle(defenderBody.x, defenderBody.y - 6, 46);
    }
    this.effectLayer.add(strike);
    this.tweens.add({
      targets: strike,
      alpha: 0,
      duration: 180,
      onComplete: () => strike.destroy(),
    });

    if (event.hit) {
      this.tweens.add({
        targets: defenderBody,
        x: defenderBody.x - direction * 16,
        duration: 70,
        yoyo: true,
        ease: "Sine.easeOut",
      });
      this.cameras.main.flash(90, 255, 244, 220, false);
      if (event.targetSide === "player") {
        this.cameras.main.shake(90, 0.0035);
      }

      const note = `${event.damage}`;
      this.spawnCueText(defenderBody.x, defenderBody.y - 86, note, tint, 22);

      if (event.effectiveness === "strong") {
        this.spawnCueText(defenderBody.x, defenderBody.y - 118, "Strong hit", 0xffd6aa, 14);
      } else if (event.effectiveness === "weak") {
        this.spawnCueText(defenderBody.x, defenderBody.y - 118, "Blunted", 0xc9dfd0, 14);
      } else if (!event.hit) {
        this.spawnCueText(defenderBody.x, defenderBody.y - 118, "Miss", 0xe8e2d3, 14);
      }

      if (event.guarded) {
        this.spawnCueText(defenderBody.x, defenderBody.y - 52, "Guard held", 0x9bd1c1, 14);
      }
      if (event.exploitedOpening) {
        this.spawnCueText(defenderBody.x, defenderBody.y - 34, "Opening punished", 0xf0b18d, 14);
      }
    } else {
      this.spawnCueText(defenderBody.x, defenderBody.y - 92, "Miss", 0xe8e2d3, 16);
    }
  }

  private playSupportEvent(event: Extract<BattlePresentationEvent, { type: "support" }>) {
    const body = event.targetSide === "player" ? this.playerBody : this.enemyBody;
    const tint =
      event.effectType === "guard" ? 0x8fc8b2 : event.effectType === "focus" ? 0xf6df9a : 0xe9967a;
    const glyph = this.add.graphics().setDepth(27);

    if (event.effectType === "guard") {
      glyph.lineStyle(5, tint, 0.92);
      glyph.strokeEllipse(body.x, body.y + 2, 220, 150);
      this.spawnCueText(body.x, body.y - 86, "Guard up", tint, 16);
    } else if (event.effectType === "focus") {
      glyph.lineStyle(4, tint, 0.94);
      glyph.strokeCircle(body.x, body.y - 12, 42);
      glyph.fillStyle(tint, 0.88);
      glyph.fillCircle(body.x, body.y - 12, 7);
      this.spawnCueText(body.x, body.y - 86, "Focus primed", tint, 16);
    } else {
      glyph.lineStyle(4, tint, 0.96);
      glyph.strokeRect(body.x - 104, body.y - 86, 208, 152);
      glyph.strokeLineShape(new Phaser.Geom.Line(body.x - 116, body.y, body.x - 86, body.y));
      glyph.strokeLineShape(new Phaser.Geom.Line(body.x + 86, body.y, body.x + 116, body.y));
      this.spawnCueText(body.x, body.y - 86, "Exposed", tint, 16);
    }

    this.effectLayer.add(glyph);
    this.tweens.add({
      targets: glyph,
      alpha: 0,
      duration: 260,
      onComplete: () => glyph.destroy(),
    });
  }

  private playSwitchEvent(event: Extract<BattlePresentationEvent, { type: "switch" }>) {
    const body = event.side === "player" ? this.playerBody : this.enemyBody;
    const tint = event.side === "player" ? 0xe8d7ad : 0xd9c0a7;
    const ring = this.add.graphics().setDepth(27);
    ring.lineStyle(5, tint, 0.92);
    ring.strokeCircle(body.x, body.y - 8, 52);
    this.effectLayer.add(ring);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 1.25,
      scaleY: 1.25,
      duration: 220,
      onComplete: () => ring.destroy(),
    });
    this.spawnCueText(
      body.x,
      body.y - 94,
      event.forced ? `${event.vivoName} rushes in` : `${event.vivoName} rotates in`,
      tint,
      16,
    );
  }

  private playCaptureEvent(event: Extract<BattlePresentationEvent, { type: "capture" }>) {
    const body = this.enemyBody;
    const tint = event.success ? 0xf7d98e : event.readiness === "fragile" ? 0xf0c5a6 : 0xd8d5cf;
    const capsule = this.add.graphics().setDepth(27);
    capsule.lineStyle(6, tint, 0.94);
    capsule.strokeCircle(body.x, body.y - 10, 48);
    capsule.lineStyle(3, tint, 0.7);
    capsule.strokeCircle(body.x, body.y - 10, 28);
    this.effectLayer.add(capsule);
    this.tweens.add({
      targets: capsule,
      alpha: 0,
      duration: event.success ? 360 : 220,
      onComplete: () => capsule.destroy(),
    });
    this.spawnCueText(
      body.x,
      body.y - 94,
      event.success ? "Capture held" : "Capture resisted",
      tint,
      16,
    );
  }

  private playFaintEvent(event: Extract<BattlePresentationEvent, { type: "faint" }>) {
    const body = event.side === "player" ? this.playerBody : this.enemyBody;
    const ghost = this.add.rectangle(body.x, body.y, 180, 150, 0x101318, 0.28).setDepth(27);
    this.effectLayer.add(ghost);
    this.tweens.add({
      targets: [body, ghost],
      alpha: { from: 1, to: 0.35 },
      duration: 180,
      yoyo: true,
      onComplete: () => ghost.destroy(),
    });
    this.spawnCueText(body.x, body.y - 102, `${event.vivoName} falters`, 0xf6d0c0, 16);
  }

  private playTraitEvent(event: Extract<BattlePresentationEvent, { type: "trait" }>) {
    const body = event.side === "player" ? this.playerBody : this.enemyBody;
    const ring = this.add.graphics().setDepth(27);
    ring.lineStyle(4, event.tint, 0.92);
    ring.strokeCircle(body.x, body.y - 8, 58);
    this.effectLayer.add(ring);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 260,
      onComplete: () => ring.destroy(),
    });
    this.spawnCueText(body.x, body.y - 112, event.traitName, event.tint, 15);
    this.spawnCueText(body.x, body.y - 88, event.cue, event.tint, 14);
  }

  private playTempoShiftEvent(event: Extract<BattlePresentationEvent, { type: "tempoShift" }>) {
    const body = event.side === "player" ? this.playerBody : this.enemyBody;
    const ring = this.add.graphics().setDepth(27);
    ring.lineStyle(4, event.tint, 0.88);
    ring.strokeEllipse(body.x, body.y - 6, 146, 108);
    this.effectLayer.add(ring);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 240,
      onComplete: () => ring.destroy(),
    });
    this.spawnCueText(body.x, body.y - 110, event.label, event.tint, 15);
    this.spawnCueText(body.x, body.y - 86, event.cue, event.tint, 13);
  }

  private playLevelUpEvent(event: Extract<BattlePresentationEvent, { type: "levelUp" }>) {
    this.playLevelUpSound();
    this.cameras.main.flash(140, 255, 237, 178, false);
    this.spawnCueText(
      this.playerBody.x,
      this.playerBody.y - 132,
      `${event.vivoName} Lv. ${event.level}`,
      0xf6df9a,
      18,
    );
  }

  private playMoveUnlockEvent(event: Extract<BattlePresentationEvent, { type: "moveUnlock" }>) {
    this.playMoveUnlockSound();
    this.spawnCueText(
      this.playerBody.x,
      this.playerBody.y - 112,
      event.pendingChoice ? `Study ${event.moveName}` : `Learned ${event.moveName}`,
      0x9ad2bf,
      16,
    );
  }

  private spawnCueText(x: number, y: number, text: string, color: number, size: number) {
    const cue = this.add
      .text(x, y, text, {
        fontFamily: "Georgia, serif",
        fontSize: `${size}px`,
        color: Phaser.Display.Color.IntegerToColor(color).rgba,
        stroke: "#1b1715",
        strokeThickness: 5,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(29);
    this.effectLayer.add(cue);
    this.tweens.add({
      targets: cue,
      y: y - 18,
      alpha: 0,
      duration: 520,
      ease: "Sine.easeOut",
      onComplete: () => cue.destroy(),
    });
  }

  private getElementTint(element: ElementType) {
    switch (element) {
      case "electric":
        return 0x8de8ff;
      case "fire":
        return 0xf19c5b;
      case "grass":
        return 0x8fcf7a;
      case "light":
        return 0xf6df9a;
      case "shadow":
        return 0xb996ea;
      case "steel":
        return 0xb8c4ca;
      case "water":
        return 0x8bd6e2;
      default:
        return 0xe8dcc2;
    }
  }

  private formatElementName(element: ElementType): string {
    return element.charAt(0).toUpperCase() + element.slice(1);
  }

  private playLevelUpSound() {
    this.playToneSequence([
      [392, 0.08, 0],
      [523.25, 0.1, 0.07],
      [659.25, 0.12, 0.15],
      [783.99, 0.18, 0.26],
    ], 0.085);
  }

  private playMoveUnlockSound() {
    this.playToneSequence([
      [440, 0.07, 0],
      [554.37, 0.08, 0.08],
      [739.99, 0.16, 0.17],
    ], 0.065);
  }

  private playMoveStudyConfirmSound(learned: boolean) {
    this.playToneSequence(
      learned
        ? [
            [523.25, 0.07, 0],
            [659.25, 0.08, 0.08],
            [880, 0.14, 0.18],
          ]
        : [
            [392, 0.08, 0],
            [329.63, 0.12, 0.09],
          ],
      learned ? 0.06 : 0.045,
    );
  }

  private playToneSequence(notes: Array<[frequency: number, duration: number, offset: number]>, volume: number) {
    const context = this.getBattleAudioContext();
    if (!context) {
      return;
    }
    void context.resume();
    const start = context.currentTime + 0.01;
    notes.forEach(([frequency, duration, offset]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, start + offset);
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(volume, start + offset + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + duration + 0.03);
    });
  }

  private primeBattleAudio() {
    const context = this.getBattleAudioContext();
    if (context?.state === "suspended") {
      void context.resume();
    }
  }

  private getBattleAudioContext(): AudioContext | undefined {
    if (document.body.dataset.battleAudio === "off") {
      return undefined;
    }
    if (this.audioContext) {
      return this.audioContext;
    }

    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return undefined;
    }

    this.audioContext = new AudioContextClass();
    return this.audioContext;
  }

  private getFieldConditionTint(fieldCondition: BattlefieldCondition): number {
    const effect = fieldCondition.effect;
    if (effect.type === "switchGuard") {
      return 0x9ad2bf;
    }
    if (effect.type === "captureCalm") {
      return 0xc8e5d7;
    }
    if (effect.type === "focusSurge") {
      return 0xf4df97;
    }
    if (effect.type === "elementBoost" && effect.element === "fire") {
      return 0xf2a260;
    }
    if (effect.type === "elementBoost" && effect.element === "electric") {
      return 0x8de8ff;
    }
    if (effect.type === "elementBoost" && effect.element === "grass") {
      return 0x8fcb7b;
    }
    if (effect.type === "elementBoost" && effect.element === "steel") {
      return 0xb8c4ca;
    }
    if (effect.type === "elementBoost" && effect.element === "water") {
      return 0x8bd6e2;
    }
    if (effect.type === "elementBoost" && effect.element === "shadow") {
      return 0xb996ea;
    }
    return 0xe8dcc2;
  }
}
