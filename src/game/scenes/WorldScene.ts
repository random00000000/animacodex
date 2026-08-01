import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config";
import {
  battleBackdropBySceneId,
  creaturePortraitByFormName,
  creaturePortraitBySpeciesId,
  type SceneArtKey,
} from "../data/assets";
import { speciesDex } from "../data/species";
import { sceneDex } from "../data/scenes";
import {
  createSceneGeometryConfig,
  SCENE_GEOMETRY_SAVE_URL,
  type SceneGeometryConfig,
} from "../data/sceneGeometryConfig";
import {
  buildAdminCreatureAudits,
  describeAdminMove,
  type AdminCreatureAudit,
} from "../data/adminCreatureAudit";
import type { GameState } from "../state/gameState";
import type {
  ElementType,
  EncounterZone,
  Interactable,
  SceneExit,
  SceneObstacle,
  TrainerDefinition,
  VivoInstance,
} from "../state/types";
import {
  ensureBattleBackdropLoaded,
  ensureCreaturePortraitLoaded,
  ensureSceneArtLoaded,
} from "./runtimeAssetLoader";

const SPEED = 170;
const PLAYER_SIZE = 18;
const COMPANION_LAG = 0.09;
const MOVEMENT_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "a",
  "A",
  "d",
  "D",
  "w",
  "W",
  "s",
  "S",
]);
const FIELD_LEAD_HOTKEYS = new Set(["1", "2", "3", "4", "5", "6"]);
const ELEMENT_TYPES: ElementType[] = [
  "neutral",
  "electric",
  "fire",
  "grass",
  "ice",
  "light",
  "shadow",
  "steel",
  "stone",
  "water",
];
type AdminLayer = "obstacles" | "exits" | "encounterZones";
type EditableRect = SceneObstacle | SceneExit | EncounterZone;

interface AdminSelection {
  layer: AdminLayer;
  index: number;
}

interface AdminDrag {
  selection: AdminSelection;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  original: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class WorldScene extends Phaser.Scene {
  private gameState!: GameState;
  private backgroundImage!: Phaser.GameObjects.Image;
  private player!: Phaser.GameObjects.Container;
  private companion!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private infoText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private sceneGraphics!: Phaser.GameObjects.Graphics;
  private adminGraphics!: Phaser.GameObjects.Graphics;
  private dialogueGraphics!: Phaser.GameObjects.Graphics;
  private dialogueSpeakerText!: Phaser.GameObjects.Text;
  private dialogueBodyText!: Phaser.GameObjects.Text;
  private dialogueHintText!: Phaser.GameObjects.Text;
  private companionSignature = "";
  private interactionLocked = false;
  private lastFacing = new Phaser.Math.Vector2(1, 0);
  private lastBlockedExitId?: string;
  private heldKeys = new Set<string>();
  private moveTarget?: Phaser.Math.Vector2;
  private boundKeyDown?: (event: KeyboardEvent) => void;
  private boundKeyUp?: (event: KeyboardEvent) => void;
  private adminMode = false;
  private adminLayer: AdminLayer = "obstacles";
  private adminSelection?: AdminSelection;
  private adminDrag?: AdminDrag;
  private adminPanel?: HTMLDivElement;
  private adminLauncher?: HTMLButtonElement;
  private creatureAdminLauncher?: HTMLButtonElement;
  private creatureAdminPanel?: HTMLDivElement;
  private creatureAdminFilter: "all" | "art" | "moves" | "unused" = "all";
  private adminAvailable = false;
  private adminStatus = "Press ` to toggle admin editing.";

  constructor() {
    super("world");
  }

  create() {
    this.gameState = this.registry.get("gameState") as GameState;
    this.backgroundImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "");
    this.backgroundImage.setVisible(false);
    this.sceneGraphics = this.add.graphics();
    this.adminGraphics = this.add.graphics().setDepth(60);
    this.dialogueGraphics = this.add.graphics().setDepth(42);
    this.player = this.buildPlayerRig();
    this.companion = this.buildCompanionRig(this.gameState.getPartyLead());

    this.infoText = this.add
      .text(24, 20, "", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#fff7e9",
        wordWrap: { width: 560 },
      })
      .setDepth(20);
    this.infoText.setBackgroundColor("rgba(15, 18, 22, 0.64)");
    this.infoText.setPadding(12, 8, 12, 8);

    this.promptText = this.add
      .text(0, 0, "", {
        fontFamily: "Georgia, serif",
        fontSize: "15px",
        color: "#fff7e9",
        align: "center",
      })
      .setOrigin(0.5, 1)
      .setDepth(30);
    this.promptText.setBackgroundColor("rgba(21, 23, 28, 0.78)");
    this.promptText.setPadding(10, 6, 10, 6);

    this.dialogueSpeakerText = this.add
      .text(52, GAME_HEIGHT - 150, "", {
        fontFamily: "Georgia, serif",
        fontSize: "18px",
        color: "#223146",
      })
      .setDepth(45)
      .setVisible(false);

    this.dialogueBodyText = this.add
      .text(52, GAME_HEIGHT - 116, "", {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#334b86",
        lineSpacing: 8,
        wordWrap: { width: 650 },
      })
      .setDepth(45)
      .setVisible(false);

    this.dialogueHintText = this.add
      .text(GAME_WIDTH - 56, GAME_HEIGHT - 36, "", {
        fontFamily: "Trebuchet MS, Verdana, sans-serif",
        fontSize: "13px",
        color: "#5c6380",
      })
      .setOrigin(1, 0.5)
      .setDepth(45)
      .setVisible(false);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("W,A,S,D,SPACE,ENTER") as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.keyboard!.on("keydown-SPACE", () => this.tryInteract());
    this.input.keyboard!.on("keydown-ENTER", () => this.tryInteract());
    this.bindWindowMovementKeys();
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.adminMode) {
        this.handleAdminPointerDown(pointer);
        return;
      }
      if (this.gameState.activeDialogue) {
        this.gameState.advanceDialogue();
        this.updateDialogueOverlay();
        return;
      }
      if (this.gameState.battle) {
        return;
      }
      this.moveTarget = new Phaser.Math.Vector2(
        Phaser.Math.Clamp(pointer.x, 20, GAME_WIDTH - 20),
        Phaser.Math.Clamp(pointer.y, 20, GAME_HEIGHT - 20),
      );
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.handleAdminPointerMove(pointer));
    this.input.on("pointerup", () => this.handleAdminPointerUp());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());

    this.gameState.onWorldRefresh = () => {
      this.drawScene();
      this.syncPlayer();
    };

    const searchParams = new URLSearchParams(window.location.search);
    this.adminAvailable = import.meta.env.DEV || searchParams.get("admin") === "1";
    this.streamCurrentStateAssets();
    this.createAdminPanel();
    this.setAdminMode(false);
    this.drawScene();
    this.syncPlayer();
  }

  update(_time: number, delta: number) {
    if (this.gameState.battle) {
      this.streamActiveBattleAssets();
      this.scene.start("battle");
      return;
    }

    if (this.gameState.activeDialogue) {
      this.updateDialogueOverlay();
      this.updateText();
      this.updatePrompt();
      return;
    }

    if (this.adminMode) {
      this.moveTarget = undefined;
      this.ensureCompanionMatchesLead();
      this.updateCompanion(delta);
      this.updateText();
      this.updatePrompt();
      this.drawAdminOverlay();
      return;
    }

    const movement = this.getKeyboardMovement();
    if (this.cursors.left.isDown || this.keys.A.isDown) movement.x -= 1;
    if (this.cursors.right.isDown || this.keys.D.isDown) movement.x += 1;
    if (this.cursors.up.isDown || this.keys.W.isDown) movement.y -= 1;
    if (this.cursors.down.isDown || this.keys.S.isDown) movement.y += 1;

    if (movement.lengthSq() > 0) {
      this.moveTarget = undefined;
      this.lastFacing = movement.clone().normalize();
      this.tryMoveBy(movement.normalize().scale((SPEED * delta) / 1000));
    } else if (this.moveTarget) {
      const toTarget = this.moveTarget.clone().subtract(new Phaser.Math.Vector2(this.player.x, this.player.y));
      const distance = toTarget.length();
      if (distance <= 5) {
        this.moveTarget = undefined;
      } else {
        const step = Math.min(distance, (SPEED * delta) / 1000);
        this.lastFacing = toTarget.clone().normalize();
        this.tryMoveBy(toTarget.normalize().scale(step));
      }
    }

    this.ensureCompanionMatchesLead();
    this.updateCompanion(delta);
    this.updateText();
    this.updatePrompt();
    this.updateDialogueOverlay();
  }

  private updateDialogueOverlay() {
    this.dialogueGraphics.clear();
    const dialogue = this.gameState.activeDialogue;
    if (!dialogue) {
      this.dialogueSpeakerText.setVisible(false);
      this.dialogueBodyText.setVisible(false);
      this.dialogueHintText.setVisible(false);
      return;
    }

    const line = dialogue.lines[dialogue.index];
    const isFinalLine = dialogue.index === dialogue.lines.length - 1;
    const boxX = 24;
    const boxY = GAME_HEIGHT - 156;
    const boxWidth = GAME_WIDTH - 48;
    const boxHeight = 132;
    const portraitX = GAME_WIDTH - 182;
    const portraitY = GAME_HEIGHT - 236;

    this.dialogueGraphics.fillStyle(0x0f1318, 0.34);
    this.dialogueGraphics.fillRoundedRect(0, 0, GAME_WIDTH, GAME_HEIGHT, 0);

    this.drawDialoguePortrait(portraitX, portraitY, line.speaker);

    this.dialogueGraphics.fillStyle(0x213340, 0.96);
    this.dialogueGraphics.fillRoundedRect(boxX - 6, boxY - 6, boxWidth + 12, boxHeight + 12, 4);
    this.dialogueGraphics.fillStyle(0xd05f48, 0.9);
    this.dialogueGraphics.fillRect(boxX - 2, boxY, 8, boxHeight);
    this.dialogueGraphics.fillStyle(0xf8f2ed, 1);
    this.dialogueGraphics.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 3);
    this.dialogueGraphics.lineStyle(3, 0x2b3646, 0.95);
    this.dialogueGraphics.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 3);
    this.dialogueGraphics.lineStyle(1, 0xc9d5e8, 0.9);
    this.dialogueGraphics.strokeRoundedRect(boxX + 8, boxY + 8, boxWidth - 16, boxHeight - 16, 2);

    this.dialogueSpeakerText
      .setText(line.speaker.toUpperCase())
      .setPosition(boxX + 28, boxY + 18)
      .setVisible(true);
    this.dialogueBodyText
      .setText(line.text)
      .setPosition(boxX + 28, boxY + 48)
      .setVisible(true);
    this.dialogueHintText
      .setText(isFinalLine ? "Space / Enter to close" : "Space / Enter to continue")
      .setPosition(boxX + boxWidth - 28, boxY + boxHeight - 24)
      .setVisible(true);
  }

  private drawDialoguePortrait(x: number, y: number, speaker: string) {
    const hash = [...speaker].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const hairColors = [0x7b4b31, 0x283348, 0x66513d, 0xb47a4b, 0x384f42];
    const accentColors = [0x6fa8b4, 0xc98f64, 0x8fae72, 0x9b83b7, 0xce6f6a];
    const hair = hairColors[hash % hairColors.length];
    const accent = accentColors[hash % accentColors.length];
    const isVivoSpeaker = Boolean(speciesDex[this.findSpeakerSpeciesId(speaker) ?? ""]);

    this.dialogueGraphics.fillStyle(0x101318, 0.42);
    this.dialogueGraphics.fillEllipse(x + 76, y + 128, 138, 24);

    if (isVivoSpeaker) {
      this.dialogueGraphics.fillStyle(accent, 0.94);
      this.dialogueGraphics.fillEllipse(x + 72, y + 80, 104, 74);
      this.dialogueGraphics.fillStyle(0xf8e0b8, 0.84);
      this.dialogueGraphics.fillCircle(x + 48, y + 68, 14);
      this.dialogueGraphics.fillCircle(x + 96, y + 68, 14);
      this.dialogueGraphics.fillStyle(0x17202c, 1);
      this.dialogueGraphics.fillCircle(x + 54, y + 80, 5);
      this.dialogueGraphics.fillCircle(x + 90, y + 80, 5);
      this.dialogueGraphics.fillStyle(0xf6d27d, 0.76);
      this.dialogueGraphics.fillCircle(x + 74, y + 102, 12);
      return;
    }

    this.dialogueGraphics.fillStyle(hair, 0.98);
    this.dialogueGraphics.fillRoundedRect(x + 16, y + 10, 112, 130, 48);
    this.dialogueGraphics.fillStyle(0xf0c49b, 1);
    this.dialogueGraphics.fillRoundedRect(x + 42, y + 28, 72, 86, 30);
    this.dialogueGraphics.fillStyle(hair, 1);
    this.dialogueGraphics.fillEllipse(x + 78, y + 36, 86, 44);
    this.dialogueGraphics.fillStyle(0x1f2430, 1);
    this.dialogueGraphics.fillCircle(x + 62, y + 70, 4);
    this.dialogueGraphics.fillCircle(x + 94, y + 70, 4);
    this.dialogueGraphics.lineStyle(3, 0x7f4e43, 0.7);
    this.dialogueGraphics.beginPath();
    this.dialogueGraphics.arc(x + 78, y + 86, 16, 0.15, Math.PI - 0.15, false);
    this.dialogueGraphics.strokePath();
    this.dialogueGraphics.fillStyle(accent, 0.96);
    this.dialogueGraphics.fillRoundedRect(x + 34, y + 112, 90, 52, 16);
    this.dialogueGraphics.fillStyle(0xf0c49b, 1);
    this.dialogueGraphics.fillRect(x + 68, y + 104, 20, 18);
  }

  private findSpeakerSpeciesId(speaker: string) {
    const normalized = speaker.toLowerCase();
    return Object.values(speciesDex).find(
      (species) =>
        normalized.includes(species.name.toLowerCase()) ||
        normalized.includes(species.registryName.toLowerCase()),
    )?.id;
  }

  private drawScene() {
    const scene = this.gameState.getScene();
    const presentationCapture = document.body.classList.contains("release-capture");
    this.streamCurrentStateAssets();
    this.sceneGraphics.clear();
    if (scene.backgroundArtKey && this.textures.exists(scene.backgroundArtKey)) {
      this.backgroundImage.setTexture(scene.backgroundArtKey);
      this.backgroundImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      this.backgroundImage.setVisible(true);
    } else {
      this.backgroundImage.setVisible(false);
      this.sceneGraphics.fillGradientStyle(
        scene.background.sky,
        scene.background.sky,
        scene.background.ground,
        scene.background.ground,
        1,
      );
      this.sceneGraphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      this.sceneGraphics.fillStyle(scene.background.accent, 0.95);
      this.sceneGraphics.fillEllipse(GAME_WIDTH * 0.28, GAME_HEIGHT * 0.68, 310, 180);
      this.sceneGraphics.fillEllipse(GAME_WIDTH * 0.74, GAME_HEIGHT * 0.34, 260, 140);
    }

    if (!presentationCapture) {
      this.sceneGraphics.fillStyle(scene.background.detail, scene.backgroundArtKey ? 0.2 : 0.92);
      for (const obstacle of scene.obstacles) {
        this.sceneGraphics.fillRoundedRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 18);
      }

      for (const zone of scene.encounterZones) {
      const color =
        zone.biome === "ashbrush" || zone.biome === "cinderReeds"
          ? 0xb56f3b
          : zone.biome === "warmMoss"
            ? 0x7aa26a
            : 0x6ca565;
        this.sceneGraphics.fillStyle(color, scene.backgroundArtKey ? 0.16 : 0.65);
        this.sceneGraphics.fillRoundedRect(zone.x, zone.y, zone.width, zone.height, 22);
        this.sceneGraphics.lineStyle(2, 0xe9e1be, scene.backgroundArtKey ? 0.5 : 0.4);
        this.sceneGraphics.strokeRoundedRect(zone.x, zone.y, zone.width, zone.height, 22);
      }

      for (const exit of scene.exits) {
        this.sceneGraphics.lineStyle(3, 0xf4ebc7, scene.backgroundArtKey ? 0.36 : 0.5);
        this.sceneGraphics.strokeRect(exit.x, exit.y, exit.width, exit.height);
        this.drawExitMarker(exit);
      }

      for (const interactable of scene.interactables) {
        this.sceneGraphics.fillStyle(0xe4d4a2, scene.backgroundArtKey ? 0.1 : 0.2);
        this.sceneGraphics.fillRoundedRect(interactable.x, interactable.y, interactable.width, interactable.height, 12);
        this.drawInteractableMarker(interactable);
      }

      for (const trainer of scene.trainers) {
        const defeated = this.gameState.defeatedTrainerIds.has(trainer.id);
        this.sceneGraphics.fillStyle(defeated ? 0x93b4a1 : 0xc78264, scene.backgroundArtKey ? 0.14 : 0.24);
        this.sceneGraphics.fillRoundedRect(trainer.x, trainer.y, trainer.width, trainer.height, 12);
        this.drawTrainerMarker(trainer, defeated);
      }
    }

    this.updateText();
    this.drawAdminOverlay();
  }

  private syncPlayer() {
    this.player.setPosition(this.gameState.playerPosition.x, this.gameState.playerPosition.y);
    this.ensureCompanionMatchesLead();
  }

  private streamCurrentStateAssets() {
    const scene = this.gameState.getScene();

    if (scene.backgroundArtKey) {
      const sceneArtKey = scene.backgroundArtKey as SceneArtKey;
      if (!this.textures.exists(sceneArtKey)) {
        ensureSceneArtLoaded(this, sceneArtKey, () => {
          if (this.scene.isActive("world")) {
            this.drawScene();
          }
        });
      }
    }

    const battleBackdropKey = battleBackdropBySceneId[scene.id];
    if (battleBackdropKey && !this.textures.exists(battleBackdropKey)) {
      ensureBattleBackdropLoaded(this, battleBackdropKey);
    }

    for (const exit of scene.exits) {
      const targetScene = sceneDex[exit.targetSceneId];
      if (targetScene?.backgroundArtKey) {
        ensureSceneArtLoaded(this, targetScene.backgroundArtKey as SceneArtKey);
      }
    }

    for (const vivo of [...this.gameState.party, ...this.gameState.reserve]) {
      this.streamPortraitForVivo(vivo);
    }

    this.streamActiveBattleAssets();
  }

  private streamActiveBattleAssets() {
    const battle = this.gameState.battle;
    if (!battle) {
      return;
    }

    const battleBackdropKey = battleBackdropBySceneId[this.gameState.currentSceneId];
    if (battleBackdropKey && !this.textures.exists(battleBackdropKey)) {
      ensureBattleBackdropLoaded(this, battleBackdropKey);
    }

    for (const vivo of [...this.gameState.party, ...battle.enemyTeam]) {
      this.streamPortraitForVivo(vivo);
    }
  }

  private streamPortraitForVivo(vivo: VivoInstance) {
    const formPortraitKey = vivo.formName ? creaturePortraitByFormName[vivo.formName] : undefined;
    if (formPortraitKey) {
      if (!this.textures.exists(formPortraitKey)) {
        ensureCreaturePortraitLoaded(this, formPortraitKey, () => {
          if (this.scene.isActive("world")) {
            this.ensureCompanionMatchesLead();
          }
        });
      }
      return;
    }

    const speciesPortraitKey = creaturePortraitBySpeciesId[vivo.speciesId];
    if (speciesPortraitKey && !this.textures.exists(speciesPortraitKey)) {
      ensureCreaturePortraitLoaded(this, speciesPortraitKey, () => {
        if (this.scene.isActive("world")) {
          this.ensureCompanionMatchesLead();
        }
      });
    }
  }

  private shutdown() {
    this.adminLauncher?.remove();
    this.adminLauncher = undefined;
    this.creatureAdminLauncher?.remove();
    this.creatureAdminLauncher = undefined;
    this.adminPanel?.remove();
    this.adminPanel = undefined;
    this.creatureAdminPanel?.remove();
    this.creatureAdminPanel = undefined;
    if (this.boundKeyDown) {
      window.removeEventListener("keydown", this.boundKeyDown);
      this.boundKeyDown = undefined;
    }
    if (this.boundKeyUp) {
      window.removeEventListener("keyup", this.boundKeyUp);
      this.boundKeyUp = undefined;
    }
    this.heldKeys.clear();
  }

  private bindWindowMovementKeys() {
    this.boundKeyDown = (event: KeyboardEvent) => {
      if (this.tryHandleAdminHotkey(event)) {
        return;
      }
      if (this.adminMode) {
        if (!this.isAdminTextInput(event.target)) {
          event.preventDefault();
        }
        return;
      }
      if (this.tryHandleFieldLeadHotkey(event)) {
        return;
      }
      if (this.tryHandleFieldCallHotkey(event)) {
        return;
      }
      if (MOVEMENT_KEYS.has(event.key)) {
        this.heldKeys.add(event.key);
        event.preventDefault();
      }
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
      }
    };
    this.boundKeyUp = (event: KeyboardEvent) => {
      if (this.adminMode) {
        if (!this.isAdminTextInput(event.target)) {
          event.preventDefault();
        }
        return;
      }
      if (MOVEMENT_KEYS.has(event.key)) {
        this.heldKeys.delete(event.key);
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", this.boundKeyDown, { passive: false });
    window.addEventListener("keyup", this.boundKeyUp, { passive: false });
  }

  private tryHandleAdminHotkey(event: KeyboardEvent) {
    if (!this.adminAvailable) {
      return false;
    }

    if (this.isAdminTextInput(event.target)) {
      return false;
    }

    if (event.code === "Backquote" || event.key === "`") {
      event.preventDefault();
      this.setAdminMode(!this.adminMode);
      return true;
    }

    if (!this.adminMode) {
      return false;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.deleteAdminSelection();
      return true;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      this.adminSelection = undefined;
      this.adminDrag = undefined;
      this.syncAdminPanel();
      this.drawAdminOverlay();
      return true;
    }

    return false;
  }

  private isAdminTextInput(target: EventTarget | null) {
    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
  }

  private tryHandleFieldLeadHotkey(event: KeyboardEvent) {
    if (!FIELD_LEAD_HOTKEYS.has(event.key)) {
      return false;
    }

    if (this.gameState.battle || this.gameState.activeDialogue || this.gameState.sanctuaryState) {
      return false;
    }

    const index = Number(event.key) - 1;
    if (Number.isNaN(index) || index >= this.gameState.party.length) {
      return false;
    }

    event.preventDefault();
    this.moveTarget = undefined;
    this.gameState.setMessage(this.gameState.setFieldLead(index));
    this.ensureCompanionMatchesLead();
    return true;
  }

  private tryHandleFieldCallHotkey(event: KeyboardEvent) {
    if (event.key !== "f" && event.key !== "F") {
      return false;
    }

    if (this.gameState.battle || this.gameState.activeDialogue || this.gameState.sanctuaryState) {
      return false;
    }

    event.preventDefault();
    this.moveTarget = undefined;
    this.gameState.setMessage(this.gameState.steadyActiveEncounterZone());
    return true;
  }

  private getKeyboardMovement(): Phaser.Math.Vector2 {
    const movement = new Phaser.Math.Vector2(0, 0);
    if (this.heldKeys.has("ArrowLeft") || this.heldKeys.has("a") || this.heldKeys.has("A")) movement.x -= 1;
    if (this.heldKeys.has("ArrowRight") || this.heldKeys.has("d") || this.heldKeys.has("D")) movement.x += 1;
    if (this.heldKeys.has("ArrowUp") || this.heldKeys.has("w") || this.heldKeys.has("W")) movement.y -= 1;
    if (this.heldKeys.has("ArrowDown") || this.heldKeys.has("s") || this.heldKeys.has("S")) movement.y += 1;
    return movement;
  }

  private tryMoveBy(movement: Phaser.Math.Vector2) {
    const startX = this.player.x;
    const startY = this.player.y;
    const candidates = this.getMovementCandidates(startX, startY, movement);
    for (const candidate of candidates) {
      if (candidate.distance <= 0) {
        continue;
      }
      if (this.tryExitAt(candidate.x, candidate.y)) {
        return;
      }
      if (this.collides(candidate.x, candidate.y)) {
        continue;
      }
      this.gameState.movePlayer(candidate.x, candidate.y);
      this.syncPlayer();
      this.checkExit();
      this.checkEncounter(candidate.distance);
      return;
    }

    this.moveTarget = undefined;
  }

  private getMovementCandidates(startX: number, startY: number, movement: Phaser.Math.Vector2) {
    const fullX = Phaser.Math.Clamp(startX + movement.x, 20, GAME_WIDTH - 20);
    const fullY = Phaser.Math.Clamp(startY + movement.y, 20, GAME_HEIGHT - 20);
    const xOnly = {
      x: fullX,
      y: startY,
      distance: Math.abs(fullX - startX),
    };
    const yOnly = {
      x: startX,
      y: fullY,
      distance: Math.abs(fullY - startY),
    };
    const axisCandidates = Math.abs(movement.x) >= Math.abs(movement.y) ? [xOnly, yOnly] : [yOnly, xOnly];
    return [
      {
        x: fullX,
        y: fullY,
        distance: Phaser.Math.Distance.Between(startX, startY, fullX, fullY),
      },
      ...axisCandidates,
    ];
  }

  private updateText() {
    const scene = this.gameState.getScene();
    const routeAccessLabel = this.gameState.isPlaytestRouteAccessEnabled() ? " [Free roam]" : "";
    this.infoText.setText([
      `Anima Codex - ${scene.name}${routeAccessLabel}${this.adminMode ? " [Admin geometry]" : ""}`,
      this.gameState.currentMessage,
    ]);
  }

  private collides(x: number, y: number): boolean {
    if (this.gameState.isPlaytestRouteAccessEnabled()) {
      return false;
    }

    return this.gameState.getScene().obstacles.some(
      (obstacle) =>
        x > obstacle.x - PLAYER_SIZE &&
        x < obstacle.x + obstacle.width + PLAYER_SIZE &&
        y > obstacle.y - PLAYER_SIZE &&
        y < obstacle.y + obstacle.height + PLAYER_SIZE,
    );
  }

  private checkExit() {
    this.tryExitAt(this.player.x, this.player.y);
  }

  private tryExitAt(x: number, y: number): boolean {
    const exit = this.gameState
      .getScene()
      .exits.find((candidate) => this.pointInside(x, y, candidate));
    if (!exit) {
      this.lastBlockedExitId = undefined;
      return false;
    }
    if (!this.gameState.canUseExit(exit)) {
      if (this.lastBlockedExitId !== exit.id) {
        this.lastBlockedExitId = exit.id;
        this.gameState.setMessage(exit.blockedText ?? `${exit.label} is not open yet.`);
      }
      return true;
    }
    this.lastBlockedExitId = undefined;
    this.gameState.switchScene(exit.targetSceneId, exit.targetX, exit.targetY);
    this.drawScene();
    this.syncPlayer();
    return true;
  }

  private checkEncounter(distance: number) {
    const zone = this.gameState
      .getScene()
      .encounterZones.find((candidate) => this.pointInside(this.player.x, this.player.y, candidate));

    if (!zone) {
      this.gameState.setActiveEncounterZone(undefined);
      this.interactionLocked = false;
      return;
    }

    this.gameState.setActiveEncounterZone(zone.id);
    if (this.gameState.advanceEncounterZone(zone, distance)) {
      this.moveTarget = undefined;
      this.streamActiveBattleAssets();
      this.scene.start("battle");
    }
  }

  private tryInteract() {
    if (this.interactionLocked || this.gameState.battle) {
      return;
    }

    if (this.gameState.activeDialogue) {
      this.gameState.advanceDialogue();
      this.updateText();
      return;
    }

    const interactable = this.closestInteractive(this.gameState.getScene().interactables);
    if (interactable) {
      if (interactable.scriptedEncounter) {
        const introDialogue = interactable.dialogue ?? [{ speaker: interactable.label, text: interactable.text }];
        this.gameState.openDialogue(introDialogue, () => {
          this.gameState.setMessage(interactable.text);
          this.gameState.startScriptedRescueEncounter(interactable);
        });
        this.updateText();
        return;
      }

      const outcome = this.gameState.inspectInteractable(interactable);
      const dialogue = interactable.dialogue ?? [{ speaker: interactable.label, text: interactable.text }];
      const lastLine = dialogue[dialogue.length - 1];
      const needsOutcomeLine = lastLine?.text !== outcome;
      this.gameState.openDialogue(
        needsOutcomeLine ? [...dialogue, { speaker: "Field Note", text: outcome }] : dialogue,
      );
      this.updateText();
      return;
    }

    const trainer = this.closestInteractive(this.gameState.getScene().trainers);
    if (trainer && !this.gameState.defeatedTrainerIds.has(trainer.id)) {
      if (
        trainer.battleRequirement &&
        !this.gameState.isPlaytestRouteAccessEnabled() &&
        !this.gameState.isRequirementMet(trainer.battleRequirement)
      ) {
        const blockedText =
          trainer.blockedText ?? `${trainer.name} is not ready to begin this trial yet.`;
        const blockedDialogue =
          trainer.blockedDialogue ?? [{ speaker: trainer.name, text: blockedText }];
        this.gameState.setMessage(blockedText);
        this.gameState.openDialogue(blockedDialogue);
        this.updateText();
        return;
      }

      const introDialogue = trainer.introDialogue ?? [{ speaker: trainer.name, text: trainer.intro }];
      this.gameState.openDialogue(introDialogue, () => {
        this.gameState.setMessage(`${trainer.name}: ${trainer.intro}`);
        this.gameState.startTrainerBattle(trainer);
      });
    }
  }

  private closestInteractive<T extends Interactable | TrainerDefinition>(items: T[]): T | undefined {
    return items.find((item) => Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x + item.width / 2, item.y + item.height / 2) < 74);
  }

  private buildCompanion(): Phaser.GameObjects.Container {
    return this.buildCompanionRig(this.gameState.getPartyLead());
  }

  private updateCompanion(delta: number) {
    const targetX = this.player.x - this.lastFacing.x * 34;
    const targetY = this.player.y - this.lastFacing.y * 24 + 24;
    const t = 1 - Math.pow(1 - COMPANION_LAG, delta / 16.67);
    this.companion.x = Phaser.Math.Linear(this.companion.x, targetX, t);
    this.companion.y = Phaser.Math.Linear(this.companion.y, targetY, t);
    this.companion.setScale(this.lastFacing.x < 0 ? -1 : 1, 1);
  }

  private buildPlayerRig(): Phaser.GameObjects.Container {
    const shadow = this.add.ellipse(0, 18, 48, 16, 0x101318, 0.34);
    const aura = this.add.circle(0, 3, 19, 0xf4deb4, 0.12);
    const coat = this.add.ellipse(0, 5, 26, 30, 0x5d7a64, 0.98);
    const satchel = this.add.rectangle(8, 8, 9, 12, 0x6b4c35, 0.96);
    const scarf = this.add.rectangle(-1, -4, 14, 5, 0xe2b88d, 0.94);
    const head = this.add.circle(0, -13, 10, 0xf0d7bd, 0.98);
    const hair = this.add.ellipse(0, -17, 14, 8, 0x48352b, 0.96);
    const lantern = this.add.circle(-12, 8, 4, 0xf3d79c, 0.82);
    const container = this.add.container(this.gameState.playerPosition.x, this.gameState.playerPosition.y, [
      shadow,
      aura,
      coat,
      satchel,
      scarf,
      head,
      hair,
      lantern,
    ]);
    container.setDepth(7);
    return container;
  }

  private buildCompanionRig(vivo: VivoInstance): Phaser.GameObjects.Container {
    const signature = this.getLeadSignature(vivo);
    const palette = this.getCompanionPalette(vivo);
    const shadow = this.add.ellipse(0, 14, 34, 12, 0x101318, 0.28);
    const glow = this.add.circle(0, 1, 18, palette.glow, 0.16);
    const parts: Phaser.GameObjects.GameObject[] = [shadow, glow];

    if (vivo.speciesId === "lumenCorvus") {
      const wing = this.add.ellipse(-2, 2, 22, 16, palette.secondary, 0.96);
      const body = this.add.ellipse(2, 2, 18, 14, palette.primary, 0.98);
      const tail = this.add.triangle(-10, 4, 0, 0, 10, 4, 0, 10, palette.secondary, 0.94);
      const beak = this.add.triangle(12, -1, 0, 0, 8, 3, 0, 6, 0xf0d7ad, 0.96);
      const crest = this.add.triangle(2, -9, 0, 8, 6, 8, 3, 0, palette.glow, 0.92);
      const eye = this.add.circle(7, -2, 2, 0x1d1a18, 1);
      parts.push(tail, wing, body, crest, beak, eye);
    } else if (vivo.speciesId === "voltpip") {
      const body = this.add.ellipse(0, 4, 24, 22, palette.primary, 0.98);
      const chest = this.add.ellipse(2, 8, 14, 12, 0xf0dfbd, 0.86);
      const wing = this.add.ellipse(11, 0, 18, 10, palette.secondary, 0.96).setRotation(-0.24);
      const chargedWing = this.add.ellipse(-8, 0, 18, 10, palette.glow, 0.62).setRotation(0.28);
      const crest = this.add.triangle(1, -13, 0, 10, 8, 0, 13, 10, palette.glow, 0.86);
      const beak = this.add.triangle(11, 0, 0, 0, 7, 3, 0, 6, 0xd8a85b, 0.96);
      const spark = this.add.rectangle(-14, -5, 2, 15, palette.glow, 0.82).setRotation(-0.48);
      const eye = this.add.circle(7, -3, 2, 0x15191d, 1);
      parts.push(chargedWing, wing, body, chest, crest, beak, spark, eye);
    } else if (vivo.speciesId === "stormwool") {
      const body = this.add.ellipse(-2, 6, 34, 22, palette.primary, 0.98);
      const woolFront = this.add.circle(9, 3, 13, palette.primary, 0.96);
      const head = this.add.ellipse(14, -4, 16, 12, palette.secondary, 0.98);
      const hornLeft = this.add.ellipse(6, -12, 11, 8, palette.glow, 0.72).setRotation(-0.55);
      const hornRight = this.add.ellipse(17, -13, 11, 8, palette.glow, 0.64).setRotation(0.42);
      const chestCharge = this.add.circle(4, 6, 5, palette.glow, 0.76);
      const sparkA = this.add.rectangle(-10, -5, 2, 14, palette.glow, 0.78).setRotation(-0.55);
      const sparkB = this.add.rectangle(2, -11, 2, 12, palette.glow, 0.62).setRotation(0.45);
      const foreHoof = this.add.rectangle(10, 17, 7, 4, palette.secondary, 0.95);
      const hindHoof = this.add.rectangle(-11, 17, 7, 4, palette.secondary, 0.9);
      const eye = this.add.circle(17, -6, 2, 0x101418, 1);
      parts.push(body, woolFront, hornLeft, hornRight, head, chestCharge, sparkA, sparkB, foreHoof, hindHoof, eye);
    } else if (vivo.speciesId === "needlehare") {
      const body = this.add.ellipse(0, 4, 22, 14, palette.primary, 0.98);
      const hindLeg = this.add.ellipse(-7, 10, 12, 6, palette.secondary, 0.96);
      const head = this.add.circle(8, -4, 7, palette.secondary, 0.98);
      const earLeft = this.add.ellipse(6, -17, 6, 18, palette.glow, 0.96);
      const earRight = this.add.ellipse(12, -16, 6, 18, palette.glow, 0.9);
      const quillA = this.add.triangle(-6, -6, 0, 8, 8, 8, 3, 0, palette.glow, 0.9);
      const quillB = this.add.triangle(-1, -8, 0, 8, 8, 8, 3, 0, palette.secondary, 0.88);
      const eye = this.add.circle(11, -5, 2, 0x1d1a18, 1);
      parts.push(hindLeg, body, quillA, quillB, head, earLeft, earRight, eye);
    } else if (vivo.speciesId === "fenlight") {
      const body = this.add.ellipse(0, 6, 26, 18, palette.primary, 0.98);
      const throat = this.add.ellipse(1, 8, 13, 11, palette.glow, 0.78);
      const head = this.add.ellipse(2, -1, 20, 15, palette.secondary, 0.98);
      const eyeLeft = this.add.circle(-5, -5, 3, palette.glow, 0.94);
      const eyeRight = this.add.circle(9, -5, 3, palette.glow, 0.94);
      const pupilLeft = this.add.circle(-5, -5, 1, 0x1d1a18, 1);
      const pupilRight = this.add.circle(9, -5, 1, 0x1d1a18, 1);
      const frillLeft = this.add.triangle(-11, -2, 0, 6, 10, 0, 0, -6, palette.glow, 0.76);
      const frillRight = this.add.triangle(16, -2, 0, 6, 10, 0, 0, -6, palette.glow, 0.76);
      const foreFootLeft = this.add.ellipse(-9, 16, 8, 4, palette.secondary, 0.94);
      const foreFootRight = this.add.ellipse(8, 16, 8, 4, palette.secondary, 0.94);
      parts.push(
        body,
        throat,
        frillLeft,
        frillRight,
        head,
        eyeLeft,
        eyeRight,
        pupilLeft,
        pupilRight,
        foreFootLeft,
        foreFootRight,
      );
    } else if (vivo.speciesId === "grimweld") {
      const body = this.add.ellipse(0, 4, 27, 16, palette.primary, 0.98);
      const chest = this.add.ellipse(4, 6, 11, 9, palette.glow, 0.32);
      const head = this.add.circle(10, -3, 8, palette.secondary, 0.98);
      const earLeft = this.add.triangle(5, -14, 0, 9, 8, 9, 4, 0, palette.secondary, 0.96);
      const earRight = this.add.triangle(13, -13, 0, 9, 8, 9, 4, 0, palette.primary, 0.95);
      const brow = this.add.rectangle(12, -7, 10, 3, palette.glow, 0.78).setRotation(-0.25);
      const tail = this.add.ellipse(-13, 2, 12, 6, palette.secondary, 0.96);
      const clawA = this.add.triangle(11, 12, 0, 0, 5, 8, 10, 0, palette.glow, 0.92);
      const clawB = this.add.triangle(1, 13, 0, 0, 5, 8, 10, 0, palette.glow, 0.86);
      const eye = this.add.circle(13, -5, 2, 0xf0a44b, 1);
      parts.push(tail, body, chest, head, earLeft, earRight, brow, clawA, clawB, eye);
    } else if (vivo.speciesId === "tidecalf") {
      const body = this.add.ellipse(-1, 6, 31, 18, palette.primary, 0.98);
      const shoulder = this.add.ellipse(5, 4, 15, 13, palette.secondary, 0.96);
      const head = this.add.ellipse(12, -3, 16, 12, palette.secondary, 0.98);
      const hornLeft = this.add.triangle(7, -9, 0, 7, 14, 6, 5, 0, palette.glow, 0.9);
      const hornRight = this.add.triangle(17, -8, 0, 6, 12, 5, 5, 0, palette.glow, 0.84);
      const waterSac = this.add.ellipse(-7, 6, 10, 9, palette.glow, 0.42);
      const foreHoof = this.add.rectangle(9, 15, 6, 4, palette.secondary, 0.95);
      const hindHoof = this.add.rectangle(-9, 15, 6, 4, palette.secondary, 0.95);
      const eye = this.add.circle(15, -5, 2, 0x172125, 1);
      parts.push(body, waterSac, shoulder, head, hornLeft, hornRight, foreHoof, hindHoof, eye);
    } else if (vivo.speciesId === "mirejaw") {
      const tail = this.add.ellipse(-19, 5, 25, 8, palette.secondary, 0.94).setRotation(0.24);
      const body = this.add.ellipse(-3, 6, 44, 17, palette.primary, 0.98);
      const backScuteA = this.add.triangle(-12, -9, 0, 10, 7, 0, 15, 10, palette.secondary, 0.92);
      const backScuteB = this.add.triangle(1, -11, 0, 10, 7, 0, 15, 10, palette.secondary, 0.86);
      const backScuteC = this.add.triangle(14, -9, 0, 9, 7, 0, 14, 9, palette.secondary, 0.78);
      const jaw = this.add.ellipse(18, -2, 26, 10, palette.secondary, 0.98).setRotation(-0.06);
      const throatSac = this.add.ellipse(12, 3, 13, 8, palette.glow, 0.42);
      const fin = this.add.triangle(-4, -13, 0, 12, 8, 0, 18, 12, palette.glow, 0.62).setRotation(0.12);
      const foreClaw = this.add.rectangle(11, 16, 10, 4, palette.secondary, 0.92).setRotation(-0.12);
      const hindClaw = this.add.rectangle(-10, 16, 9, 4, palette.secondary, 0.86).setRotation(0.1);
      const eye = this.add.circle(22, -5, 2, 0xbfefff, 1);
      parts.push(tail, body, backScuteA, backScuteB, backScuteC, fin, jaw, throatSac, foreClaw, hindClaw, eye);
    } else if (vivo.speciesId === "mirecub") {
      const body = this.add.ellipse(-3, 7, 38, 20, palette.primary, 0.98);
      const shoulder = this.add.ellipse(6, 2, 21, 17, palette.secondary, 0.45);
      const head = this.add.ellipse(17, -5, 18, 14, palette.primary, 0.98);
      const earA = this.add.circle(11, -15, 4, palette.secondary, 0.9);
      const earB = this.add.circle(21, -14, 4, palette.secondary, 0.84);
      const waterChest = this.add.ellipse(5, 7, 13, 10, palette.glow, 0.36);
      const mossBack = this.add.ellipse(-4, -8, 32, 9, 0x6f8c4b, 0.58);
      const reedA = this.add.rectangle(-8, -18, 2, 17, 0x7c8b4e, 0.72).setRotation(-0.12);
      const reedB = this.add.rectangle(2, -19, 2, 16, 0x7c8b4e, 0.66).setRotation(0.1);
      const foreClaw = this.add.rectangle(11, 17, 12, 4, palette.secondary, 0.9).setRotation(-0.14);
      const hindClaw = this.add.rectangle(-11, 17, 11, 4, palette.secondary, 0.84).setRotation(0.12);
      const drip = this.add.ellipse(25, 4, 5, 10, palette.glow, 0.3);
      const eye = this.add.circle(20, -7, 2, 0xaadf8a, 1);
      parts.push(
        body,
        shoulder,
        waterChest,
        mossBack,
        reedA,
        reedB,
        head,
        earA,
        earB,
        foreClaw,
        hindClaw,
        drip,
        eye,
      );
    } else if (vivo.speciesId === "frosthulk") {
      const body = this.add.ellipse(-3, 6, 44, 24, palette.primary, 0.98);
      const shoulder = this.add.ellipse(8, 1, 25, 22, palette.secondary, 0.74);
      const snowMantle = this.add.ellipse(-5, -8, 40, 14, 0xf2f7f4, 0.82);
      const head = this.add.ellipse(17, -8, 18, 14, palette.primary, 0.98).setRotation(-0.08);
      const ear = this.add.circle(12, -17, 4, palette.secondary, 0.82);
      const icePlateA = this.add.triangle(-12, -17, 0, 14, 8, 0, 17, 14, palette.glow, 0.72);
      const icePlateB = this.add.triangle(2, -19, 0, 15, 8, 0, 17, 15, palette.glow, 0.64);
      const breath = this.add.ellipse(27, -9, 11, 6, palette.glow, 0.28);
      const foreClaws = this.add.rectangle(12, 18, 13, 4, 0xd9f7ff, 0.9).setRotation(-0.1);
      const hindClaws = this.add.rectangle(-12, 18, 11, 4, 0xd9f7ff, 0.84).setRotation(0.12);
      const eye = this.add.circle(21, -10, 2, 0x1e5064, 1);
      parts.push(body, shoulder, snowMantle, icePlateA, icePlateB, head, ear, breath, foreClaws, hindClaws, eye);
    } else if (vivo.speciesId === "glarefin") {
      const body = this.add.ellipse(0, 5, 26, 25, palette.primary, 0.98);
      const belly = this.add.ellipse(4, 8, 14, 17, palette.secondary, 0.9);
      const head = this.add.ellipse(4, -8, 22, 17, palette.primary, 0.98);
      const browLeft = this.add.rectangle(-2, -13, 10, 3, 0xf2fbff, 0.92).setRotation(-0.32);
      const browRight = this.add.rectangle(9, -13, 10, 3, 0xf2fbff, 0.88).setRotation(0.26);
      const beak = this.add.triangle(15, -7, 0, 0, 10, 4, 0, 8, 0xb7eaff, 0.92);
      const crest = this.add.triangle(0, -23, 0, 17, 8, 0, 16, 17, palette.glow, 0.8);
      const flipperA = this.add.ellipse(-13, 1, 7, 24, palette.glow, 0.58).setRotation(0.36);
      const flipperB = this.add.ellipse(14, 2, 7, 22, palette.glow, 0.52).setRotation(-0.3);
      const footA = this.add.rectangle(-6, 18, 8, 4, palette.secondary, 0.86).setRotation(0.12);
      const footB = this.add.rectangle(8, 18, 8, 4, palette.secondary, 0.86).setRotation(-0.12);
      const eye = this.add.circle(8, -10, 2, palette.glow, 1);
      parts.push(body, belly, flipperA, flipperB, head, browLeft, browRight, crest, beak, footA, footB, eye);
    } else if (vivo.speciesId === "gloomtusk") {
      const body = this.add.ellipse(-3, 7, 52, 28, palette.primary, 0.98);
      const belly = this.add.ellipse(1, 10, 31, 17, 0xdce9e7, 0.78);
      const shoulderPlate = this.add.ellipse(-6, -5, 40, 14, palette.secondary, 0.46);
      const head = this.add.ellipse(18, -5, 23, 18, palette.primary, 0.98);
      const muzzle = this.add.ellipse(22, -1, 17, 12, palette.secondary, 0.78);
      const tuskA = this.add.triangle(18, 1, 0, 0, 5, 24, 10, 0, palette.glow, 0.92).setRotation(0.18);
      const tuskB = this.add.triangle(27, 0, 0, 0, 5, 24, 10, 0, palette.glow, 0.86).setRotation(-0.1);
      const icePlateA = this.add.triangle(-19, -18, 0, 12, 8, 0, 16, 12, palette.glow, 0.58);
      const icePlateB = this.add.triangle(-4, -20, 0, 14, 8, 0, 17, 14, palette.glow, 0.66);
      const icePlateC = this.add.triangle(10, -17, 0, 11, 7, 0, 15, 11, palette.glow, 0.52);
      const flipperA = this.add.rectangle(11, 20, 18, 6, palette.secondary, 0.9).setRotation(-0.12);
      const flipperB = this.add.rectangle(-17, 19, 17, 6, palette.secondary, 0.82).setRotation(0.16);
      const breath = this.add.ellipse(32, -6, 12, 7, palette.glow, 0.26);
      const eye = this.add.circle(22, -8, 2, palette.glow, 1);
      parts.push(
        body,
        belly,
        shoulderPlate,
        icePlateA,
        icePlateB,
        icePlateC,
        head,
        muzzle,
        tuskA,
        tuskB,
        flipperA,
        flipperB,
        breath,
        eye,
      );
    } else if (vivo.speciesId === "snowshade") {
      const tail = this.add.ellipse(-17, 0, 11, 31, palette.secondary, 0.92).setRotation(-0.62);
      const body = this.add.ellipse(-2, 6, 36, 15, palette.primary, 0.98);
      const shoulder = this.add.ellipse(6, 2, 18, 13, palette.secondary, 0.5);
      const head = this.add.ellipse(16, -4, 15, 11, palette.primary, 0.98);
      const earA = this.add.triangle(11, -14, 0, 8, 7, 8, 4, 0, palette.secondary, 0.94);
      const earB = this.add.triangle(19, -13, 0, 8, 7, 8, 4, 0, palette.secondary, 0.86);
      const backIceA = this.add.triangle(-10, -11, 0, 9, 7, 0, 15, 9, palette.glow, 0.58);
      const backIceB = this.add.triangle(2, -13, 0, 10, 7, 0, 15, 10, palette.glow, 0.66);
      const whiskerA = this.add.rectangle(22, -4, 12, 1, palette.glow, 0.72).setRotation(-0.18);
      const whiskerB = this.add.rectangle(22, -1, 11, 1, palette.glow, 0.58).setRotation(0.12);
      const foreClaw = this.add.rectangle(12, 16, 12, 4, palette.glow, 0.85).setRotation(-0.18);
      const hindClaw = this.add.rectangle(-10, 16, 10, 4, palette.glow, 0.72).setRotation(0.12);
      const eye = this.add.circle(18, -6, 2, palette.glow, 1);
      parts.push(
        tail,
        body,
        shoulder,
        backIceA,
        backIceB,
        head,
        earA,
        earB,
        whiskerA,
        whiskerB,
        foreClaw,
        hindClaw,
        eye,
      );
    } else if (vivo.speciesId === "rimeboar") {
      const body = this.add.ellipse(-3, 7, 43, 22, palette.primary, 0.98);
      const shoulder = this.add.ellipse(9, 3, 24, 20, palette.secondary, 0.42);
      const head = this.add.ellipse(17, -3, 22, 15, palette.primary, 0.98).setRotation(-0.08);
      const snout = this.add.ellipse(27, 0, 14, 9, palette.secondary, 0.72);
      const tuskA = this.add.triangle(23, 2, 0, 0, 5, 17, 10, 0, palette.glow, 0.92).setRotation(0.6);
      const tuskB = this.add.triangle(30, 1, 0, 0, 5, 16, 10, 0, palette.glow, 0.84).setRotation(-0.38);
      const bristleA = this.add.triangle(-15, -15, 0, 13, 8, 0, 17, 13, palette.glow, 0.62);
      const bristleB = this.add.triangle(-2, -18, 0, 15, 8, 0, 17, 15, palette.glow, 0.72);
      const bristleC = this.add.triangle(12, -15, 0, 12, 8, 0, 16, 12, palette.glow, 0.6);
      const hoofA = this.add.rectangle(11, 18, 10, 5, palette.secondary, 0.9).setRotation(-0.1);
      const hoofB = this.add.rectangle(-11, 18, 10, 5, palette.secondary, 0.84).setRotation(0.12);
      const breath = this.add.ellipse(36, -3, 11, 6, palette.glow, 0.26);
      const eye = this.add.circle(20, -6, 2, palette.glow, 1);
      parts.push(
        body,
        shoulder,
        bristleA,
        bristleB,
        bristleC,
        head,
        snout,
        tuskA,
        tuskB,
        hoofA,
        hoofB,
        breath,
        eye,
      );
    } else if (vivo.speciesId === "shadecub") {
      const body = this.add.ellipse(0, 5, 28, 16, palette.primary, 0.98);
      const chestVoid = this.add.circle(2, 5, 6, palette.glow, 0.34);
      const head = this.add.ellipse(10, -3, 16, 12, palette.secondary, 0.98);
      const earLeft = this.add.triangle(6, -16, 0, 10, 8, 10, 4, 0, palette.glow, 0.86);
      const earRight = this.add.triangle(14, -15, 0, 10, 8, 10, 4, 0, palette.glow, 0.8);
      const tail = this.add.ellipse(-13, 1, 14, 7, palette.secondary, 0.94);
      const whiskerA = this.add.rectangle(16, -3, 10, 1, palette.glow, 0.7).setRotation(-0.2);
      const whiskerB = this.add.rectangle(15, 0, 9, 1, palette.glow, 0.6).setRotation(0.15);
      const eye = this.add.circle(13, -4, 2, palette.glow, 0.9);
      parts.push(tail, body, chestVoid, head, earLeft, earRight, whiskerA, whiskerB, eye);
    } else if (vivo.speciesId === "cinderhoof") {
      const body = this.add.ellipse(-1, 4, 31, 15, palette.primary, 0.98);
      const chestGlow = this.add.ellipse(4, 2, 10, 9, palette.glow, 0.46);
      const neck = this.add.ellipse(9, -4, 9, 18, palette.secondary, 0.96).setRotation(-0.42);
      const head = this.add.ellipse(16, -10, 14, 9, palette.secondary, 0.98).setRotation(-0.18);
      const mane = this.add.triangle(7, -17, 0, 12, 8, 0, 14, 12, palette.glow, 0.88);
      const tail = this.add.triangle(-17, 1, 0, 0, 15, 4, 3, 11, palette.glow, 0.82);
      const foreLeg = this.add.rectangle(8, 14, 4, 12, palette.secondary, 0.95).setRotation(-0.14);
      const hindLeg = this.add.rectangle(-9, 14, 4, 12, palette.secondary, 0.95).setRotation(0.16);
      const eye = this.add.circle(19, -11, 2, 0xffd68a, 1);
      parts.push(tail, body, chestGlow, neck, mane, head, foreLeg, hindLeg, eye);
    } else if (vivo.speciesId === "magmadon") {
      const body = this.add.ellipse(-3, 6, 43, 24, palette.primary, 0.98);
      const basaltShell = this.add.ellipse(-2, 1, 38, 18, palette.secondary, 0.86);
      const ear = this.add.ellipse(9, -7, 18, 19, palette.secondary, 0.78).setRotation(-0.2);
      const head = this.add.ellipse(18, -5, 18, 14, palette.primary, 0.98);
      const trunk = this.add.ellipse(24, 1, 8, 26, palette.primary, 0.98).setRotation(-0.48);
      const trunkGlow = this.add.rectangle(24, 0, 3, 24, palette.glow, 0.7).setRotation(-0.48);
      const tusk = this.add.triangle(24, 1, 0, 4, 16, 7, 2, 12, 0xffd6a0, 0.88).setRotation(-0.08);
      const lavaBackA = this.add.triangle(-12, -14, 0, 12, 8, 0, 17, 12, palette.glow, 0.64);
      const lavaBackB = this.add.triangle(3, -16, 0, 12, 8, 0, 17, 12, palette.glow, 0.56);
      const foreFoot = this.add.rectangle(10, 18, 10, 5, palette.secondary, 0.94);
      const hindFoot = this.add.rectangle(-13, 18, 10, 5, palette.secondary, 0.88);
      const eye = this.add.circle(20, -8, 2, 0xffb066, 1);
      parts.push(body, basaltShell, lavaBackA, lavaBackB, ear, head, trunk, trunkGlow, tusk, foreFoot, hindFoot, eye);
    } else if (vivo.speciesId === "mossquirl") {
      const body = this.add.ellipse(0, 5, 23, 14, palette.primary, 0.98);
      const mossRuff = this.add.ellipse(5, 1, 12, 10, palette.glow, 0.4);
      const head = this.add.ellipse(11, -4, 13, 10, palette.secondary, 0.98);
      const ear = this.add.triangle(10, -13, 0, 8, 7, 0, 12, 8, palette.secondary, 0.96);
      const tail = this.add.ellipse(-11, -1, 12, 30, palette.glow, 0.82).setRotation(-0.58);
      const seedA = this.add.circle(-14, -8, 2, 0xd8c079, 0.92);
      const seedB = this.add.circle(-8, -14, 2, 0xd8c079, 0.86);
      const foreClaw = this.add.rectangle(9, 14, 5, 3, palette.secondary, 0.95).setRotation(-0.22);
      const hindClaw = this.add.rectangle(-5, 15, 6, 3, palette.secondary, 0.95).setRotation(0.18);
      const eye = this.add.circle(14, -5, 2, 0xbce88f, 1);
      parts.push(tail, seedA, seedB, body, mossRuff, head, ear, foreClaw, hindClaw, eye);
    } else if (vivo.speciesId === "venivy") {
      const coil = this.add.ellipse(-3, 8, 26, 12, palette.primary, 0.96);
      const body = this.add.ellipse(2, 3, 28, 9, palette.primary, 0.98).setRotation(-0.16);
      const neck = this.add.ellipse(10, -4, 9, 18, palette.secondary, 0.96).setRotation(-0.42);
      const head = this.add.ellipse(16, -10, 14, 10, palette.secondary, 0.98);
      const leafHood = this.add.triangle(11, -16, 0, 9, 10, 0, 18, 9, palette.glow, 0.74);
      const venomSac = this.add.circle(19, -7, 3, palette.glow, 0.76);
      const tailPod = this.add.ellipse(-16, 7, 7, 4, 0xd4bc68, 0.92);
      const tongue = this.add.rectangle(23, -10, 8, 1, 0xb8ee69, 0.78);
      const eye = this.add.circle(18, -12, 2, 0x10180d, 1);
      parts.push(coil, body, neck, leafHood, head, venomSac, tailPod, tongue, eye);
    } else if (vivo.speciesId === "leafstalker") {
      const tail = this.add.ellipse(-20, 2, 22, 7, palette.secondary, 0.9).setRotation(-0.18);
      const body = this.add.ellipse(-2, 5, 43, 21, palette.primary, 0.98);
      const shoulder = this.add.ellipse(8, 1, 22, 18, palette.secondary, 0.96);
      const leafMantle = this.add.ellipse(-5, -3, 39, 19, palette.glow, 0.44);
      const head = this.add.ellipse(19, -7, 18, 13, palette.secondary, 0.98).setRotation(-0.12);
      const earLeft = this.add.triangle(14, -19, 0, 10, 8, 0, 12, 10, palette.primary, 0.94);
      const earRight = this.add.triangle(23, -18, 0, 9, 8, 0, 12, 9, palette.primary, 0.88);
      const frondA = this.add.triangle(0, -18, 0, 14, 8, 0, 17, 11, palette.glow, 0.84);
      const frondB = this.add.triangle(-11, -13, 0, 12, 7, 0, 15, 10, palette.glow, 0.74).setRotation(-0.35);
      const foreClaw = this.add.rectangle(13, 17, 10, 4, 0xd4d4a8, 0.92).setRotation(-0.12);
      const hindClaw = this.add.rectangle(-12, 17, 9, 4, 0xd4d4a8, 0.86).setRotation(0.12);
      const eye = this.add.circle(23, -9, 2, 0xf0d36b, 1);
      parts.push(tail, body, shoulder, leafMantle, frondA, frondB, head, earLeft, earRight, foreClaw, hindClaw, eye);
    } else if (vivo.speciesId === "snapmaw") {
      const rootBody = this.add.ellipse(-3, 8, 30, 16, palette.primary, 0.98);
      const jawBack = this.add.ellipse(8, -5, 25, 22, palette.secondary, 0.96).setRotation(-0.12);
      const jawTop = this.add.triangle(10, -15, 0, 14, 22, 2, 11, 0, palette.primary, 0.95);
      const jawBottom = this.add.triangle(11, 6, 0, 0, 22, 12, 9, 18, palette.primary, 0.92);
      const trapLeafA = this.add.ellipse(-14, 3, 16, 8, palette.secondary, 0.78).setRotation(0.25);
      const trapLeafB = this.add.ellipse(22, 4, 15, 7, palette.secondary, 0.72).setRotation(-0.42);
      const nectar = this.add.circle(-1, 1, 5, palette.glow, 0.78);
      const tendril = this.add.rectangle(4, -20, 2, 16, palette.glow, 0.68).setRotation(0.38);
      const foreRoot = this.add.rectangle(9, 17, 12, 4, 0xcfc184, 0.86).setRotation(-0.16);
      const hindRoot = this.add.rectangle(-13, 17, 11, 4, 0xcfc184, 0.78).setRotation(0.2);
      const eyeLeft = this.add.circle(6, -4, 2, 0xf4d86b, 1);
      const eyeRight = this.add.circle(14, -4, 2, 0xf4d86b, 1);
      parts.push(rootBody, trapLeafA, trapLeafB, jawBack, jawTop, jawBottom, nectar, tendril, foreRoot, hindRoot, eyeLeft, eyeRight);
    } else if (vivo.speciesId === "basalthorn") {
      const body = this.add.ellipse(-2, 6, 42, 22, palette.primary, 0.98);
      const shoulder = this.add.ellipse(7, 2, 24, 20, palette.secondary, 0.96);
      const head = this.add.ellipse(18, -6, 19, 13, palette.secondary, 0.98).setRotation(-0.12);
      const horn = this.add.triangle(28, -9, 0, 5, 20, 8, 3, 13, palette.glow, 0.9).setRotation(-0.08);
      const backPlateA = this.add.triangle(-10, -12, 0, 14, 8, 0, 17, 14, palette.secondary, 0.94);
      const backPlateB = this.add.triangle(2, -15, 0, 15, 8, 0, 17, 15, palette.secondary, 0.9);
      const backPlateC = this.add.triangle(14, -13, 0, 13, 8, 0, 16, 13, palette.secondary, 0.84);
      const foreHoof = this.add.rectangle(12, 17, 10, 5, palette.secondary, 0.94);
      const hindHoof = this.add.rectangle(-12, 17, 10, 5, palette.secondary, 0.88);
      const crackGlow = this.add.rectangle(4, 1, 16, 2, palette.glow, 0.62).setRotation(-0.2);
      const eye = this.add.circle(21, -8, 2, 0x1d1710, 1);
      parts.push(body, shoulder, crackGlow, backPlateA, backPlateB, backPlateC, head, horn, foreHoof, hindHoof, eye);
    } else if (vivo.speciesId === "bouldermaw") {
      const body = this.add.ellipse(-4, 7, 46, 25, palette.primary, 0.98);
      const shoulder = this.add.ellipse(4, 1, 30, 24, palette.secondary, 0.9);
      const head = this.add.ellipse(18, -7, 20, 14, palette.secondary, 0.98).setRotation(-0.08);
      const muzzle = this.add.ellipse(25, -5, 10, 7, palette.primary, 0.95);
      const earA = this.add.circle(10, -17, 5, palette.secondary, 0.88);
      const earB = this.add.circle(22, -16, 4, palette.secondary, 0.82);
      const backPlateA = this.add.triangle(-12, -14, 0, 14, 8, 0, 17, 14, palette.secondary, 0.92);
      const backPlateB = this.add.triangle(3, -18, 0, 16, 9, 0, 18, 15, palette.secondary, 0.88);
      const chestGlow = this.add.rectangle(6, 5, 18, 3, palette.glow, 0.6).setRotation(0.18);
      const foreClaw = this.add.rectangle(14, 18, 12, 4, 0xd2c49a, 0.9).setRotation(-0.08);
      const hindClaw = this.add.rectangle(-13, 18, 11, 4, 0xd2c49a, 0.84).setRotation(0.1);
      const eye = this.add.circle(20, -9, 2, 0x18140e, 1);
      parts.push(body, shoulder, backPlateA, backPlateB, chestGlow, head, muzzle, earA, earB, foreClaw, hindClaw, eye);
    } else if (vivo.speciesId === "mossprig") {
      const body = this.add.ellipse(0, 4, 24, 15, palette.primary, 0.98);
      const head = this.add.circle(9, -2, 8, palette.secondary, 0.98);
      const leafA = this.add.triangle(2, -12, 0, 10, 8, 10, 4, 0, palette.glow, 0.92);
      const leafB = this.add.triangle(8, -14, 0, 10, 8, 10, 4, 0, palette.primary, 0.9);
      const tail = this.add.ellipse(-11, 5, 10, 5, palette.secondary, 0.95);
      const eye = this.add.circle(12, -3, 2, 0x1d1a18, 1);
      parts.push(tail, body, leafA, leafB, head, eye);
    } else {
      const body = this.add.ellipse(0, 3, 24, 15, palette.primary, 0.98);
      const chestGlow = this.add.circle(0, 2, 7, palette.glow, 0.56);
      const head = this.add.circle(9, -4, 8, palette.secondary, 0.98);
      const earLeft = this.add.triangle(4, -14, 0, 8, 8, 8, 4, 0, palette.secondary, 0.96);
      const earRight = this.add.triangle(12, -13, 0, 8, 8, 8, 4, 0, palette.secondary, 0.92);
      const tail = this.add.ellipse(-12, 3, 12, 6, palette.secondary, 0.95);
      const ember = signature.includes("ignis")
        ? this.add.triangle(-3, -11, 0, 10, 8, 10, 4, 0, palette.glow, 0.92)
        : this.add.circle(-3, -8, 3, palette.glow, 0.42);
      const eye = this.add.circle(12, -5, 2, 0x1d1a18, 1);
      parts.push(tail, body, chestGlow, ember, head, earLeft, earRight, eye);
    }

    const companion = this.add.container(
      this.gameState.playerPosition.x - 34,
      this.gameState.playerPosition.y + 28,
      parts,
    );
    companion.setDepth(6);
    this.companionSignature = signature;
    return companion;
  }

  private ensureCompanionMatchesLead() {
    const lead = this.gameState.getPartyLead();
    const signature = this.getLeadSignature(lead);
    if (signature === this.companionSignature) {
      return;
    }

    const { x, y, scaleX, scaleY } = this.companion;
    this.companion.destroy(true);
    this.companion = this.buildCompanionRig(lead);
    this.companion.setPosition(x, y);
    this.companion.setScale(scaleX, scaleY);
  }

  private updatePrompt() {
    const interactable = this.closestInteractive(this.gameState.getScene().interactables);
    const trainer = this.closestInteractive(this.gameState.getScene().trainers);
    const exit = this.gameState
      .getScene()
      .exits.find((candidate) => this.pointInside(this.player.x, this.player.y, candidate));

    if (this.gameState.activeDialogue) {
      this.promptText.setText("Space / Enter");
      this.promptText.setPosition(this.player.x, this.player.y - 42);
      this.promptText.setVisible(true);
      return;
    }

    const label =
      interactable?.label ??
      (trainer && !this.gameState.defeatedTrainerIds.has(trainer.id) ? trainer.name : undefined) ??
      (exit ? (this.gameState.canUseExit(exit) ? exit.label : exit.blockedLabel ?? exit.label) : undefined);
    if (!label) {
      this.promptText.setVisible(false);
      return;
    }

    this.promptText.setText(label);
    this.promptText.setPosition(this.player.x, this.player.y - 42);
    this.promptText.setVisible(true);
  }

  private drawExitMarker(exit: SceneExit) {
    const x = exit.x + exit.width / 2;
    const y = exit.y + exit.height / 2;
    const isOpen = this.gameState.canUseExit(exit);
    const fill = isOpen ? 0xf5e6bd : 0xcf8f6d;
    this.sceneGraphics.fillStyle(fill, isOpen ? 0.34 : 0.46);
    this.sceneGraphics.fillRoundedRect(x - 16, y - 12, 32, 24, 10);
    this.sceneGraphics.fillTriangle(x - 6, y - 8, x + 7, y, x - 6, y + 8);
    this.sceneGraphics.lineStyle(2, 0x221b18, 0.34);
    this.sceneGraphics.strokeRoundedRect(x - 16, y - 12, 32, 24, 10);
  }

  private drawInteractableMarker(interactable: Interactable) {
    const x = interactable.x + interactable.width / 2;
    const y = interactable.y + interactable.height / 2;

    if (interactable.action === "manageReserve") {
      this.sceneGraphics.fillStyle(0xf0ddad, 0.9);
      this.sceneGraphics.fillRoundedRect(x - 12, y - 12, 24, 18, 4);
      this.sceneGraphics.lineStyle(2, 0x7a593d, 0.86);
      this.sceneGraphics.strokeRoundedRect(x - 12, y - 12, 24, 18, 4);
      this.sceneGraphics.strokeLineShape(new Phaser.Geom.Line(x, y - 12, x, y + 6));
      return;
    }

    if (interactable.action === "healParty") {
      this.sceneGraphics.fillStyle(0xe39c66, 0.92);
      this.sceneGraphics.fillCircle(x, y - 4, 7);
      this.sceneGraphics.fillStyle(0xf5d59c, 0.44);
      this.sceneGraphics.fillCircle(x, y - 4, 14);
      this.sceneGraphics.lineStyle(2, 0x5e4030, 0.7);
      this.sceneGraphics.strokeLineShape(new Phaser.Geom.Line(x - 10, y + 8, x + 10, y + 8));
      return;
    }

    if (interactable.scriptedEncounter) {
      this.sceneGraphics.fillStyle(0x90b77f, 0.92);
      this.sceneGraphics.fillCircle(x - 6, y, 8);
      this.sceneGraphics.fillCircle(x + 4, y - 2, 9);
      this.sceneGraphics.fillStyle(0xf2e3b8, 0.92);
      this.sceneGraphics.fillCircle(x + 12, y - 8, 3);
      return;
    }

    if (interactable.attunement) {
      this.sceneGraphics.fillStyle(0xd9d3b8, 0.94);
      this.sceneGraphics.fillRoundedRect(x - 7, y - 16, 14, 26, 6);
      this.sceneGraphics.fillStyle(0xf4d99e, 0.34);
      this.sceneGraphics.fillCircle(x, y - 8, 14);
      return;
    }

    this.sceneGraphics.fillStyle(0xe6d7ab, 0.92);
    this.sceneGraphics.fillRoundedRect(x - 5, y - 13, 10, 24, 4);
    this.sceneGraphics.fillTriangle(x + 5, y - 10, x + 22, y - 4, x + 5, y + 2);
  }

  private drawTrainerMarker(trainer: TrainerDefinition, defeated: boolean) {
    const x = trainer.x + trainer.width / 2;
    const y = trainer.y + trainer.height / 2;
    const coatColor = defeated ? 0x8ca59b : 0xca7c5f;
    const accentColor = defeated ? 0xc9ddcb : 0xf0d7ac;
    this.sceneGraphics.fillStyle(0x101318, 0.2);
    this.sceneGraphics.fillEllipse(x, y + 18, 28, 10);
    this.sceneGraphics.fillStyle(coatColor, 0.96);
    this.sceneGraphics.fillTriangle(x - 12, y + 14, x + 12, y + 14, x, y - 10);
    this.sceneGraphics.fillStyle(accentColor, 0.94);
    this.sceneGraphics.fillCircle(x, y - 14, 7);
    this.sceneGraphics.fillCircle(x + 12, y + 2, 3);
    this.sceneGraphics.lineStyle(2, 0x2d221c, 0.4);
    this.sceneGraphics.strokeCircle(x, y - 14, 7);
  }

  private pointInside(
    x: number,
    y: number,
    zone: Pick<EncounterZone, "x" | "y" | "width" | "height"> | SceneExit,
  ): boolean {
    return x >= zone.x && x <= zone.x + zone.width && y >= zone.y && y <= zone.y + zone.height;
  }

  private createAdminPanel() {
    if (!this.adminAvailable) {
      return;
    }

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "admin-launcher map-admin-launcher";
    launcher.title = "Open scene map and encounter editor (`)";
    launcher.setAttribute("aria-label", "Open scene map and encounter editor");
    launcher.textContent = "Edit map";
    launcher.addEventListener("click", () => this.setAdminMode(true));
    document.body.appendChild(launcher);
    this.adminLauncher = launcher;

    const creatureLauncher = document.createElement("button");
    creatureLauncher.type = "button";
    creatureLauncher.className = "admin-launcher creature-admin-launcher";
    creatureLauncher.title = "Open Vivo registry admin";
    creatureLauncher.setAttribute("aria-label", "Open Vivo registry admin");
    creatureLauncher.textContent = "Vivos";
    creatureLauncher.addEventListener("click", () => this.setCreatureAdminOpen(true));
    document.body.appendChild(creatureLauncher);
    this.creatureAdminLauncher = creatureLauncher;

    const panel = document.createElement("div");
    panel.className = "admin-panel";
    panel.innerHTML = `
      <div class="admin-panel-header">
        <strong>Scene Admin</strong>
        <button type="button" data-admin-action="toggle">Close</button>
      </div>
      <label class="admin-control">
        <span>Layer</span>
        <select data-admin-field="layer">
          <option value="obstacles">Collisions</option>
          <option value="exits">Doors / exits</option>
          <option value="encounterZones">Encounter zones</option>
        </select>
      </label>
      <div class="admin-button-row">
        <button type="button" data-admin-action="add">Add</button>
        <button type="button" data-admin-action="delete">Delete</button>
        <button type="button" data-admin-action="save">Save config</button>
      </div>
      <div class="admin-inspector">
        <p data-admin-field="selection">No rectangle selected.</p>
        <div class="admin-grid">
          <label><span>X</span><input data-admin-number="x" type="number" step="1" /></label>
          <label><span>Y</span><input data-admin-number="y" type="number" step="1" /></label>
          <label><span>W</span><input data-admin-number="width" type="number" step="1" min="8" /></label>
          <label><span>H</span><input data-admin-number="height" type="number" step="1" min="8" /></label>
        </div>
        <div class="admin-exit-controls" data-admin-field="exitControls">
          <label class="admin-control">
            <span>Admin door state</span>
            <select data-admin-field="adminExitState">
              <option value="open">Open for admin testing</option>
              <option value="closed">Closed for admin testing</option>
              <option value="authored">Follow authored lock</option>
            </select>
          </label>
          <p data-admin-field="exitRead"></p>
        </div>
        <div class="admin-encounter-controls" data-admin-field="encounterControls"></div>
      </div>
      <p class="admin-status" data-admin-field="status"></p>
    `;
    document.body.appendChild(panel);
    this.adminPanel = panel;

    panel.querySelector<HTMLButtonElement>('[data-admin-action="toggle"]')?.addEventListener("click", () => {
      this.setAdminMode(false);
    });
    panel.querySelector<HTMLButtonElement>('[data-admin-action="add"]')?.addEventListener("click", () => {
      this.addAdminRect();
    });
    panel.querySelector<HTMLButtonElement>('[data-admin-action="delete"]')?.addEventListener("click", () => {
      this.deleteAdminSelection();
    });
    panel.querySelector<HTMLButtonElement>('[data-admin-action="save"]')?.addEventListener("click", () => {
      void this.saveAdminConfig();
    });
    panel.querySelector<HTMLSelectElement>('[data-admin-field="layer"]')?.addEventListener("change", (event) => {
      const target = event.target as HTMLSelectElement;
      this.adminLayer = target.value as AdminLayer;
      this.adminSelection = undefined;
      this.adminStatus = `Editing ${this.getAdminLayerLabel(this.adminLayer)}.`;
      this.syncAdminPanel();
      this.drawAdminOverlay();
    });

    for (const input of panel.querySelectorAll<HTMLInputElement>("[data-admin-number]")) {
      input.addEventListener("input", () => this.updateSelectedRectFromInputs());
    }
    panel.querySelector<HTMLSelectElement>('[data-admin-field="adminExitState"]')?.addEventListener("change", (event) => {
      this.updateSelectedExitAdminState((event.target as HTMLSelectElement).value);
    });
    panel.addEventListener("input", (event) => this.handleEncounterAdminInput(event));
    panel.addEventListener("change", (event) => this.handleEncounterAdminInput(event));
    panel.addEventListener("click", (event) => this.handleEncounterAdminClick(event));
    this.createCreatureAdminPanel();
    this.syncAdminPanel();
  }

  private createCreatureAdminPanel() {
    const panel = document.createElement("div");
    panel.className = "creature-admin-panel";
    document.body.appendChild(panel);
    this.creatureAdminPanel = panel;
    this.renderCreatureAdminPanel();
  }

  private setCreatureAdminOpen(open: boolean) {
    this.creatureAdminPanel?.classList.toggle("visible", open);
    this.creatureAdminLauncher?.classList.toggle("hidden", open);
    if (open) {
      this.setAdminMode(false);
      this.renderCreatureAdminPanel();
    }
  }

  private renderCreatureAdminPanel() {
    if (!this.creatureAdminPanel) {
      return;
    }
    const audits = buildAdminCreatureAudits();
    const filteredAudits = audits.filter((audit) => {
      if (this.creatureAdminFilter === "art") return audit.artStatus === "missing";
      if (this.creatureAdminFilter === "moves") return audit.moveStatus === "review";
      if (this.creatureAdminFilter === "unused") return audit.usageStatus === "unused";
      return true;
    });
    const missingArtCount = audits.filter((audit) => audit.artStatus === "missing").length;
    const moveReviewCount = audits.filter((audit) => audit.moveStatus === "review").length;
    const unusedCount = audits.filter((audit) => audit.usageStatus === "unused").length;

    this.creatureAdminPanel.innerHTML = `
      <div class="creature-admin-header">
        <div>
          <p class="creature-admin-kicker">Development Registry</p>
          <h2>Vivo Admin</h2>
        </div>
        <button type="button" data-creature-admin-action="close">Close</button>
      </div>
      <div class="creature-admin-summary" aria-label="Vivo registry status">
        ${this.renderCreatureAdminMetric("Species", String(audits.length))}
        ${this.renderCreatureAdminMetric("Needs art", String(missingArtCount))}
        ${this.renderCreatureAdminMetric("Move review", String(moveReviewCount))}
        ${this.renderCreatureAdminMetric("Unused", String(unusedCount))}
      </div>
      <div class="creature-admin-filters" aria-label="Vivo registry filters">
        ${this.renderCreatureAdminFilterButton("all", "All")}
        ${this.renderCreatureAdminFilterButton("art", "Needs art")}
        ${this.renderCreatureAdminFilterButton("moves", "Move review")}
        ${this.renderCreatureAdminFilterButton("unused", "Unused")}
      </div>
      <div class="creature-admin-list">
        ${
          filteredAudits.length > 0
            ? filteredAudits.map((audit) => this.renderCreatureAdminCard(audit)).join("")
            : `<p class="creature-admin-empty">No Vivos match this filter.</p>`
        }
      </div>
    `;

    this.creatureAdminPanel
      .querySelector<HTMLButtonElement>('[data-creature-admin-action="close"]')
      ?.addEventListener("click", () => this.setCreatureAdminOpen(false));
    for (const button of this.creatureAdminPanel.querySelectorAll<HTMLButtonElement>("[data-creature-filter]")) {
      button.addEventListener("click", () => {
        const filter = button.dataset.creatureFilter;
        if (filter === "all" || filter === "art" || filter === "moves" || filter === "unused") {
          this.creatureAdminFilter = filter;
          this.renderCreatureAdminPanel();
        }
      });
    }
  }

  private renderCreatureAdminMetric(label: string, value: string) {
    return `
      <div class="creature-admin-metric">
        <strong>${this.escapeHtml(value)}</strong>
        <span>${this.escapeHtml(label)}</span>
      </div>
    `;
  }

  private renderCreatureAdminFilterButton(filter: typeof this.creatureAdminFilter, label: string) {
    const active = this.creatureAdminFilter === filter ? " active" : "";
    return `<button type="button" class="${active}" data-creature-filter="${filter}">${this.escapeHtml(label)}</button>`;
  }

  private renderCreatureAdminCard(audit: AdminCreatureAudit) {
    const portrait = audit.portraitUrl
      ? `<img src="${audit.portraitUrl}" alt="${this.escapeHtml(audit.name)} portrait" />`
      : `<div class="creature-admin-portrait-missing">No portrait</div>`;
    const issueList = audit.issues.length
      ? audit.issues.map((issue) => `<li>${this.escapeHtml(issue)}</li>`).join("")
      : "<li>No blocking data issues.</li>";
    const recommendations = audit.recommendations.length
      ? audit.recommendations.map((recommendation) => `<li>${this.escapeHtml(recommendation)}</li>`).join("")
      : "<li>No move or usage recommendations.</li>";
    const appearances = audit.appearances.length
      ? audit.appearances
          .map(
            (appearance) =>
              `<li><strong>${this.escapeHtml(appearance.label)}</strong><span>${this.escapeHtml(appearance.detail)}</span></li>`,
          )
          .join("")
      : "<li><span>Not placed in the current game slice.</span></li>";
    const learnset = audit.learnset
      .map(
        (entry) =>
          `<li><span>Lv. ${entry.level}</span><strong>${this.escapeHtml(describeAdminMove(entry.move))}</strong></li>`,
      )
      .join("");
    const forms = audit.forms.length
      ? audit.forms
          .map((form) => {
            const formPortrait = form.portraitUrl
              ? `<img src="${form.portraitUrl}" alt="${this.escapeHtml(form.name)} portrait" />`
              : `<span>No form art</span>`;
            return `
              <li>
                ${formPortrait}
                <div>
                  <strong>${this.escapeHtml(form.name)}</strong>
                  <span>${this.escapeHtml(this.formatElementName(form.element))}${form.awakenMoveName ? ` / ${this.escapeHtml(form.awakenMoveName)}` : ""}</span>
                </div>
              </li>
            `;
          })
          .join("")
      : `<li><span>No alternate forms yet.</span></li>`;

    return `
      <article class="creature-admin-card">
        <div class="creature-admin-card-top">
          <div class="creature-admin-portrait">${portrait}</div>
          <div>
            <p class="creature-admin-meta">${this.escapeHtml(audit.speciesId)} / ${this.escapeHtml(this.formatElementName(audit.element))}</p>
            <h3>${this.escapeHtml(audit.name)}</h3>
            <p class="creature-admin-registry">${this.escapeHtml(audit.registryName)}</p>
            <div class="creature-admin-tags">
              ${audit.statusTags.map((tag) => `<span>${this.escapeHtml(tag)}</span>`).join("")}
            </div>
          </div>
        </div>
        <p class="creature-admin-trait">${this.escapeHtml(audit.trait)}</p>
        <p class="creature-admin-statline">${this.escapeHtml(audit.statLine)}</p>
        <div class="creature-admin-columns">
          <section>
            <h4>Learnset</h4>
            <ul class="creature-admin-learnset">${learnset}</ul>
          </section>
          <section>
            <h4>Forms</h4>
            <ul class="creature-admin-forms">${forms}</ul>
          </section>
          <section>
            <h4>Placement</h4>
            <ul class="creature-admin-appearances">${appearances}</ul>
          </section>
          <section>
            <h4>Admin Notes</h4>
            <ul>${issueList}${recommendations}</ul>
          </section>
        </div>
      </article>
    `;
  }

  private setAdminMode(enabled: boolean) {
    this.adminMode = this.adminAvailable && enabled;
    document.body.classList.toggle("admin-active", this.adminMode);
    this.adminPanel?.classList.toggle("visible", this.adminMode);
    this.adminLauncher?.classList.toggle("hidden", this.adminMode);
    this.creatureAdminLauncher?.classList.toggle("hidden", this.adminMode);
    this.moveTarget = undefined;
    this.adminStatus = this.adminMode
      ? "Drag rectangles to move. Select encounter zones to edit spawns. Save writes public/config/scene-geometry-overrides.json."
      : "Press ` to toggle admin editing.";
    this.syncAdminPanel();
    this.drawAdminOverlay();
  }

  private formatElementName(element: string) {
    return `${element.charAt(0).toUpperCase()}${element.slice(1)}`;
  }

  private escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private getAdminLayerLabel(layer: AdminLayer) {
    if (layer === "obstacles") return "collisions";
    if (layer === "exits") return "doors / exits";
    return "encounter zones";
  }

  private getAdminItems(layer: AdminLayer = this.adminLayer): EditableRect[] {
    const scene = this.gameState.getSceneById(this.gameState.currentSceneId);
    if (layer === "obstacles") return scene.obstacles;
    if (layer === "exits") return scene.exits;
    return scene.encounterZones;
  }

  private getSelectedAdminRect(): EditableRect | undefined {
    if (!this.adminSelection) {
      return undefined;
    }
    return this.getAdminItems(this.adminSelection.layer)[this.adminSelection.index];
  }

  private handleAdminPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gameState.battle) {
      return;
    }
    const selection = this.findAdminRectAt(pointer.x, pointer.y);
    this.adminSelection = selection;
    const rect = this.getSelectedAdminRect();
    if (selection && rect) {
      this.adminDrag = {
        selection,
        mode: this.isNearResizeHandle(pointer.x, pointer.y, rect) ? "resize" : "move",
        startX: pointer.x,
        startY: pointer.y,
        original: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    } else {
      this.adminDrag = undefined;
    }
    this.syncAdminPanel();
    this.drawAdminOverlay();
  }

  private handleAdminPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.adminMode || !this.adminDrag) {
      return;
    }
    const rect = this.getSelectedAdminRect();
    if (!rect) {
      return;
    }
    const dx = pointer.x - this.adminDrag.startX;
    const dy = pointer.y - this.adminDrag.startY;
    if (this.adminDrag.mode === "move") {
      rect.x = this.snap(Phaser.Math.Clamp(this.adminDrag.original.x + dx, 0, GAME_WIDTH - rect.width));
      rect.y = this.snap(Phaser.Math.Clamp(this.adminDrag.original.y + dy, 0, GAME_HEIGHT - rect.height));
    } else {
      rect.width = this.snap(Phaser.Math.Clamp(this.adminDrag.original.width + dx, 12, GAME_WIDTH - rect.x));
      rect.height = this.snap(Phaser.Math.Clamp(this.adminDrag.original.height + dy, 12, GAME_HEIGHT - rect.y));
    }
    this.syncAdminPanel();
    this.drawScene();
  }

  private handleAdminPointerUp() {
    if (!this.adminMode) {
      return;
    }
    this.adminDrag = undefined;
  }

  private findAdminRectAt(x: number, y: number): AdminSelection | undefined {
    const items = this.getAdminItems();
    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (this.pointInside(x, y, items[index])) {
        return { layer: this.adminLayer, index };
      }
    }
    return undefined;
  }

  private isNearResizeHandle(x: number, y: number, rect: EditableRect) {
    return Math.abs(x - (rect.x + rect.width)) <= 16 && Math.abs(y - (rect.y + rect.height)) <= 16;
  }

  private addAdminRect() {
    const scene = this.gameState.getSceneById(this.gameState.currentSceneId);
    const x = this.snap(Phaser.Math.Clamp(this.player.x - 48, 0, GAME_WIDTH - 96));
    const y = this.snap(Phaser.Math.Clamp(this.player.y - 36, 0, GAME_HEIGHT - 72));

    if (this.adminLayer === "obstacles") {
      scene.obstacles.push({ x, y, width: 96, height: 72 });
    } else if (this.adminLayer === "exits") {
      scene.exits.push({
        id: `${scene.id}Exit${Date.now().toString(36)}`,
        x,
        y,
        width: 96,
        height: 72,
        targetSceneId: scene.id,
        targetX: Math.round(this.player.x),
        targetY: Math.round(this.player.y),
        label: "New exit",
      });
    } else {
      scene.encounterZones.push({
        id: `${scene.id}Zone${Date.now().toString(36)}`,
        x,
        y,
        width: 128,
        height: 96,
        biome: "newPatch",
        encounterRate: 0.08,
        stepRange: [80, 120],
        levelRange: [3, 5],
        encounterTable: [{ speciesId: "dogemox", weight: 1 }],
      });
    }

    this.adminSelection = { layer: this.adminLayer, index: this.getAdminItems().length - 1 };
    this.adminStatus = `Added ${this.getAdminLayerLabel(this.adminLayer)} rectangle.`;
    this.syncAdminPanel();
    this.drawScene();
  }

  private deleteAdminSelection() {
    if (!this.adminSelection) {
      this.adminStatus = "Select a rectangle before deleting.";
      this.syncAdminPanel();
      return;
    }
    const items = this.getAdminItems(this.adminSelection.layer);
    items.splice(this.adminSelection.index, 1);
    this.adminStatus = "Deleted selected rectangle.";
    this.adminSelection = undefined;
    this.syncAdminPanel();
    this.drawScene();
  }

  private updateSelectedRectFromInputs() {
    const rect = this.getSelectedAdminRect();
    if (!rect || !this.adminPanel) {
      return;
    }

    for (const field of ["x", "y", "width", "height"] as const) {
      const input = this.adminPanel.querySelector<HTMLInputElement>(`[data-admin-number="${field}"]`);
      const value = Number(input?.value);
      if (!Number.isNaN(value)) {
        rect[field] = field === "width" || field === "height" ? Math.max(12, value) : value;
      }
    }
    rect.x = Phaser.Math.Clamp(rect.x, 0, GAME_WIDTH - rect.width);
    rect.y = Phaser.Math.Clamp(rect.y, 0, GAME_HEIGHT - rect.height);
    this.drawScene();
  }

  private updateSelectedExitAdminState(value: string) {
    if (!this.adminSelection || this.adminSelection.layer !== "exits") {
      return;
    }
    const exit = this.getSelectedAdminRect() as SceneExit | undefined;
    if (!exit) {
      return;
    }
    exit.adminTestState = value === "closed" || value === "authored" ? value : "open";
    this.adminStatus =
      exit.adminTestState === "closed"
        ? `${exit.label} is closed for admin testing.`
        : exit.adminTestState === "authored"
          ? `${exit.label} now follows its authored progression lock.`
          : `${exit.label} is open for admin testing.`;
    this.syncAdminPanel();
    this.drawScene();
  }

  private syncAdminPanel() {
    if (!this.adminPanel) {
      return;
    }
    const layerSelect = this.adminPanel.querySelector<HTMLSelectElement>('[data-admin-field="layer"]');
    if (layerSelect) {
      layerSelect.value = this.adminLayer;
    }

    const selectionText = this.adminPanel.querySelector<HTMLElement>('[data-admin-field="selection"]');
    const rect = this.getSelectedAdminRect();
    if (selectionText) {
      selectionText.textContent = rect
        ? `${this.getAdminLayerLabel(this.adminSelection!.layer)} #${this.adminSelection!.index + 1}${"id" in rect && rect.id ? `: ${rect.id}` : ""}`
        : "No rectangle selected.";
    }

    for (const field of ["x", "y", "width", "height"] as const) {
      const input = this.adminPanel.querySelector<HTMLInputElement>(`[data-admin-number="${field}"]`);
      if (input) {
        input.disabled = !rect;
        input.value = rect ? String(Math.round(rect[field])) : "";
      }
    }

    const exitControls = this.adminPanel.querySelector<HTMLElement>('[data-admin-field="exitControls"]');
    const exitState = this.adminPanel.querySelector<HTMLSelectElement>('[data-admin-field="adminExitState"]');
    const exitRead = this.adminPanel.querySelector<HTMLElement>('[data-admin-field="exitRead"]');
    const selectedExit = this.adminSelection?.layer === "exits" ? (rect as SceneExit | undefined) : undefined;
    if (exitControls) {
      exitControls.classList.toggle("visible", Boolean(selectedExit));
    }
    if (exitState) {
      exitState.disabled = !selectedExit;
      exitState.value = selectedExit?.adminTestState ?? "open";
    }
    if (exitRead) {
      exitRead.textContent = selectedExit
        ? this.getExitAdminRead(selectedExit)
        : "Select a door or exit to set its admin test state.";
    }

    const encounterControls = this.adminPanel.querySelector<HTMLElement>('[data-admin-field="encounterControls"]');
    const selectedZone = this.adminSelection?.layer === "encounterZones" ? (rect as EncounterZone | undefined) : undefined;
    if (encounterControls) {
      encounterControls.classList.toggle("visible", Boolean(selectedZone));
      encounterControls.innerHTML = selectedZone ? this.renderEncounterAdminControls(selectedZone) : "";
    }

    const status = this.adminPanel.querySelector<HTMLElement>('[data-admin-field="status"]');
    if (status) {
      status.textContent = this.adminStatus;
    }
  }

  private renderEncounterAdminControls(zone: EncounterZone) {
    const [stepMin, stepMax] = zone.stepRange;
    const [levelMin, levelMax] = zone.levelRange;
    const attunementOptions = [
      `<option value="">None</option>`,
      ...ELEMENT_TYPES.map(
        (element) =>
          `<option value="${element}"${zone.attunementElement === element ? " selected" : ""}>${this.escapeHtml(
            this.formatElementName(element),
          )}</option>`,
      ),
    ].join("");
    const rows = zone.encounterTable
      .map((entry, index) => this.renderEncounterTableRow(entry.speciesId, entry.weight, index))
      .join("");

    return `
      <section class="admin-spawn-editor" aria-label="Encounter spawn editor">
        <div class="admin-spawn-heading">
          <strong>Spawn Table</strong>
          <button type="button" data-admin-spawn-action="add">Add spawn</button>
        </div>
        <div class="admin-grid admin-grid-two">
          <label><span>Biome</span><input data-admin-zone-field="biome" type="text" value="${this.escapeHtml(zone.biome)}" /></label>
          <label><span>Element</span><select data-admin-zone-field="attunementElement">${attunementOptions}</select></label>
          <label><span>Rate</span><input data-admin-zone-field="encounterRate" type="number" min="0" max="1" step="0.01" value="${zone.encounterRate}" /></label>
          <label><span>Lv min</span><input data-admin-zone-field="levelMin" type="number" min="1" max="100" step="1" value="${levelMin}" /></label>
          <label><span>Lv max</span><input data-admin-zone-field="levelMax" type="number" min="1" max="100" step="1" value="${levelMax}" /></label>
          <label><span>Steps min</span><input data-admin-zone-field="stepMin" type="number" min="1" step="1" value="${stepMin}" /></label>
          <label><span>Steps max</span><input data-admin-zone-field="stepMax" type="number" min="1" step="1" value="${stepMax}" /></label>
        </div>
        <div class="admin-spawn-table">
          ${rows}
        </div>
        <p>${this.escapeHtml(this.describeEncounterZone(zone))}</p>
      </section>
    `;
  }

  private renderEncounterTableRow(speciesId: string, weight: number, index: number) {
    const options = Object.values(speciesDex)
      .map((species) => {
        const selected = species.id === speciesId ? " selected" : "";
        return `<option value="${species.id}"${selected}>${this.escapeHtml(species.name)} (${this.escapeHtml(
          this.formatElementName(species.element),
        )})</option>`;
      })
      .join("");
    const species = speciesDex[speciesId];
    const element = species ? this.formatElementName(species.element) : "Unknown";
    return `
      <div class="admin-spawn-row">
        <select data-admin-spawn-index="${index}" data-admin-spawn-field="speciesId">${options}</select>
        <input data-admin-spawn-index="${index}" data-admin-spawn-field="weight" type="number" min="0" step="1" value="${weight}" aria-label="Spawn weight" />
        <span>${this.escapeHtml(element)}</span>
        <button type="button" data-admin-spawn-action="delete" data-admin-spawn-index="${index}" aria-label="Remove spawn">Remove</button>
      </div>
    `;
  }

  private describeEncounterZone(zone: EncounterZone) {
    const totalWeight = zone.encounterTable.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
    const elementCounts = new Map<ElementType, number>();
    for (const entry of zone.encounterTable) {
      const element = speciesDex[entry.speciesId]?.element;
      if (element) {
        elementCounts.set(element, (elementCounts.get(element) ?? 0) + Math.max(0, entry.weight));
      }
    }
    const mix = [...elementCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([element, weight]) => {
        const percent = totalWeight > 0 ? Math.round((weight / totalWeight) * 100) : 0;
        return `${this.formatElementName(element)} ${percent}%`;
      })
      .join(", ");
    return `Effective mix: ${mix || "no valid weighted spawns"}.`;
  }

  private handleEncounterAdminInput(event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    if (!target) {
      return;
    }
    const shouldSync =
      event.type === "change" ||
      target.dataset.adminSpawnField === "speciesId" ||
      target.dataset.adminZoneField === "attunementElement";
    if (target.dataset.adminZoneField) {
      this.updateSelectedEncounterField(target.dataset.adminZoneField, target.value, shouldSync);
    } else if (target.dataset.adminSpawnField && target.dataset.adminSpawnIndex) {
      this.updateSelectedEncounterSpawn(
        Number(target.dataset.adminSpawnIndex),
        target.dataset.adminSpawnField,
        target.value,
        shouldSync,
      );
    }
  }

  private handleEncounterAdminClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-admin-spawn-action]");
    if (!button) {
      return;
    }
    const action = button.dataset.adminSpawnAction;
    if (action === "add") {
      this.addSelectedEncounterSpawn();
    } else if (action === "delete" && button.dataset.adminSpawnIndex) {
      this.deleteSelectedEncounterSpawn(Number(button.dataset.adminSpawnIndex));
    }
  }

  private getSelectedEncounterZone(): EncounterZone | undefined {
    if (!this.adminSelection || this.adminSelection.layer !== "encounterZones") {
      return undefined;
    }
    return this.getSelectedAdminRect() as EncounterZone | undefined;
  }

  private updateSelectedEncounterField(field: string, value: string, shouldSync = true) {
    const zone = this.getSelectedEncounterZone();
    if (!zone) {
      return;
    }
    if (field === "biome") {
      zone.biome = value.trim() || "newPatch";
    } else if (field === "attunementElement") {
      zone.attunementElement = ELEMENT_TYPES.includes(value as ElementType) ? (value as ElementType) : undefined;
    } else if (field === "encounterRate") {
      const nextRate = Number(value);
      if (Number.isFinite(nextRate)) {
        zone.encounterRate = Phaser.Math.Clamp(nextRate, 0, 1);
      }
    } else if (field === "levelMin" || field === "levelMax") {
      const next = Math.max(1, Math.min(100, Math.round(Number(value))));
      const current = [...zone.levelRange] as [number, number];
      current[field === "levelMin" ? 0 : 1] = Number.isFinite(next) ? next : current[field === "levelMin" ? 0 : 1];
      zone.levelRange = [Math.min(current[0], current[1]), Math.max(current[0], current[1])];
    } else if (field === "stepMin" || field === "stepMax") {
      const next = Math.max(1, Math.round(Number(value)));
      const current = [...zone.stepRange] as [number, number];
      current[field === "stepMin" ? 0 : 1] = Number.isFinite(next) ? next : current[field === "stepMin" ? 0 : 1];
      zone.stepRange = [Math.min(current[0], current[1]), Math.max(current[0], current[1])];
    }
    this.adminStatus = `Updated ${zone.id} spawn settings. Save config when the balance pass is ready.`;
    if (shouldSync) {
      this.syncAdminPanel();
    } else {
      this.syncAdminStatusText();
    }
    this.drawScene();
  }

  private updateSelectedEncounterSpawn(index: number, field: string, value: string, shouldSync = true) {
    const zone = this.getSelectedEncounterZone();
    const entry = zone?.encounterTable[index];
    if (!zone || !entry) {
      return;
    }
    if (field === "speciesId" && speciesDex[value]) {
      entry.speciesId = value;
    } else if (field === "weight") {
      const nextWeight = Math.max(0, Math.round(Number(value)));
      entry.weight = Number.isFinite(nextWeight) ? nextWeight : entry.weight;
    }
    this.adminStatus = `Updated ${zone.id} spawn table. Save config to keep it.`;
    if (shouldSync) {
      this.syncAdminPanel();
    } else {
      this.syncAdminStatusText();
    }
  }

  private addSelectedEncounterSpawn() {
    const zone = this.getSelectedEncounterZone();
    if (!zone) {
      return;
    }
    const fallbackSpeciesId =
      Object.values(speciesDex).find((species) => species.element === zone.attunementElement)?.id ?? "dogemox";
    zone.encounterTable.push({ speciesId: fallbackSpeciesId, weight: 6 });
    this.adminStatus = `Added a spawn row to ${zone.id}.`;
    this.syncAdminPanel();
  }

  private deleteSelectedEncounterSpawn(index: number) {
    const zone = this.getSelectedEncounterZone();
    if (!zone) {
      return;
    }
    if (zone.encounterTable.length <= 1) {
      this.adminStatus = "Each encounter zone needs at least one spawn row.";
      this.syncAdminPanel();
      return;
    }
    zone.encounterTable.splice(index, 1);
    this.adminStatus = `Removed a spawn row from ${zone.id}.`;
    this.syncAdminPanel();
  }

  private syncAdminStatusText() {
    const status = this.adminPanel?.querySelector<HTMLElement>('[data-admin-field="status"]');
    if (status) {
      status.textContent = this.adminStatus;
    }
  }

  private getExitAdminRead(exit: SceneExit) {
    const authoredOpen = this.gameState.isRequirementMet(exit.requirement);
    const currentOpen = this.gameState.canUseExit(exit);
    const state = exit.adminTestState ?? "open";
    const stateLabel =
      state === "closed" ? "closed for admin" : state === "authored" ? "following authored lock" : "open for admin";
    return `${exit.label}: ${stateLabel}. Authored state is ${authoredOpen ? "open" : "locked"}; current admin traversal is ${
      currentOpen ? "open" : "closed"
    }.`;
  }

  private async saveAdminConfig() {
    const config = createSceneGeometryConfig();
    this.adminStatus = "Saving scene map and encounter config...";
    this.syncAdminPanel();
    try {
      const response = await fetch(SCENE_GEOMETRY_SAVE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.adminStatus = "Saved to public/config/scene-geometry-overrides.json.";
      this.gameState.setMessage("Admin scene config saved. Reloading will keep these rectangles and encounter spawns.");
    } catch {
      this.downloadAdminConfig(config);
      this.adminStatus = "Dev save endpoint was unavailable; downloaded scene-geometry-overrides.json instead.";
    }
    this.syncAdminPanel();
  }

  private downloadAdminConfig(config: SceneGeometryConfig) {
    const blob = new Blob([`${JSON.stringify(config, null, 2)}\n`], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "scene-geometry-overrides.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  private drawAdminOverlay() {
    this.adminGraphics.clear();
    if (!this.adminMode) {
      return;
    }

    const layerColor = this.adminLayer === "obstacles" ? 0xff5f57 : this.adminLayer === "exits" ? 0xf7d36a : 0x64d98a;
    const items = this.getAdminItems();
    items.forEach((rect, index) => {
      const selected = this.adminSelection?.layer === this.adminLayer && this.adminSelection.index === index;
      this.adminGraphics.fillStyle(layerColor, selected ? 0.28 : 0.12);
      this.adminGraphics.fillRect(rect.x, rect.y, rect.width, rect.height);
      this.adminGraphics.lineStyle(selected ? 4 : 2, selected ? 0xffffff : layerColor, selected ? 0.95 : 0.72);
      this.adminGraphics.strokeRect(rect.x, rect.y, rect.width, rect.height);
      this.adminGraphics.fillStyle(selected ? 0xffffff : layerColor, 0.95);
      this.adminGraphics.fillRect(rect.x + rect.width - 10, rect.y + rect.height - 10, 10, 10);
      if ("id" in rect && rect.id) {
        this.adminGraphics.fillStyle(0x101318, 0.72);
        this.adminGraphics.fillRoundedRect(rect.x + 4, rect.y + 4, Math.min(220, rect.id.length * 7 + 18), 20, 4);
      }
    });
  }

  private snap(value: number) {
    return Math.round(value / 4) * 4;
  }

  private getLeadSignature(vivo: VivoInstance): string {
    return `${vivo.speciesId}:${vivo.formName ?? "base"}`.toLowerCase();
  }

  private getCompanionPalette(vivo: VivoInstance): {
    primary: number;
    secondary: number;
    glow: number;
  } {
    if (vivo.formName === "Ignis Canis") {
      return {
        primary: 0xe3a468,
        secondary: 0x6a3e2a,
        glow: 0xffc26d,
      };
    }

    if (vivo.formName === "Astra Corvus") {
      return {
        primary: 0xe1ebff,
        secondary: 0x526a86,
        glow: 0xf6f0b5,
      };
    }

    const species = speciesDex[vivo.speciesId];
    return {
      primary: species.palette.primary,
      secondary: species.palette.secondary,
      glow: species.palette.glow,
    };
  }
}
