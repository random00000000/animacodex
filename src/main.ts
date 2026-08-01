import Phaser from "phaser";
import "./styles.css";
import { GAME_HEIGHT, GAME_WIDTH } from "./game/config";
import { BootScene } from "./game/scenes/BootScene";
import { WorldScene } from "./game/scenes/WorldScene";
import { BattleScene } from "./game/scenes/BattleScene";
import { GameState, SAVE_SLOT_COUNT } from "./game/state/gameState";
import { speciesDex } from "./game/data/species";
import { BattleController, type BattlePresentationEvent } from "./game/systems/battle";
import { loadSceneGeometryConfig } from "./game/data/sceneGeometryConfig";

declare global {
  interface Window {
    __animaCodexDebug?: {
      gameState: GameState;
      switchScene: (sceneId: string) => void;
    };
  }
}

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root not found.");
}

app.innerHTML = `
  <div class="game-shell">
    <button type="button" class="front-door-launcher" data-front-door-action="open">Menu</button>
    <button type="button" class="dev-panel-launcher" data-front-door-action="toggle-dev-panel" aria-label="Toggle dev panel" title="Toggle dev panel">⚙</button>
    <div class="front-door-overlay visible" role="dialog" aria-modal="true" aria-labelledby="front-door-title">
      <section class="front-door-card">
        <p class="front-door-kicker">Anima Codex</p>
        <h1 id="front-door-title">Field Log</h1>
        <nav class="game-menu-nav" aria-label="Game menu">
          <button type="button" data-front-door-action="select-menu" data-front-door-menu="fieldLog">Field Log</button>
          <button type="button" data-front-door-action="select-menu" data-front-door-menu="vivos">Vivos</button>
          <button type="button" data-front-door-action="select-menu" data-front-door-menu="codex">Codex</button>
          <button type="button" data-front-door-action="select-menu" data-front-door-menu="pack">Pack</button>
          <button type="button" data-front-door-action="select-menu" data-front-door-menu="options">Options</button>
          <button type="button" data-front-door-action="select-menu" data-front-door-menu="dev">Dev</button>
        </nav>
        <div class="front-door-slots" data-front-door-field="slots" aria-label="Save slots"></div>
        <div class="front-door-copy" data-front-door-field="summary">Checking saved route...</div>
        <div class="front-door-actions" data-front-door-field="actions">
          <button type="button" data-front-door-action="continue">Continue</button>
          <button type="button" data-front-door-action="load">Load</button>
          <button type="button" data-front-door-action="save">Save</button>
          <button type="button" data-front-door-action="delete">Delete</button>
        </div>
        <div class="front-door-delete-confirm" data-front-door-field="deleteConfirm">
          <p>This deletes the selected save slot and starts that slot again.</p>
          <div>
            <button type="button" data-front-door-action="confirm-delete">Confirm delete</button>
            <button type="button" data-front-door-action="cancel-delete">Cancel</button>
          </div>
        </div>
        <p class="front-door-status" data-front-door-field="status"></p>
      </section>
    </div>
    <main class="game-layout" aria-label="Anima Codex playable game">
      <section class="playfield-panel" aria-label="Painted world">
        <div id="game-root"></div>
      </section>
      <aside id="hud" class="hud-panel"></aside>
    </main>
  </div>
`;

const hudRoot = document.querySelector<HTMLDivElement>("#hud");
const gameRoot = document.querySelector<HTMLDivElement>("#game-root");
const frontDoorOverlay = document.querySelector<HTMLDivElement>(".front-door-overlay");
const frontDoorTitle = document.querySelector<HTMLHeadingElement>("#front-door-title");
const frontDoorSlots = document.querySelector<HTMLDivElement>('[data-front-door-field="slots"]');
const frontDoorSummary = document.querySelector<HTMLDivElement>('[data-front-door-field="summary"]');
const frontDoorStatus = document.querySelector<HTMLParagraphElement>('[data-front-door-field="status"]');
const frontDoorActions = document.querySelector<HTMLDivElement>('[data-front-door-field="actions"]');
const frontDoorDeleteConfirm = document.querySelector<HTMLDivElement>('[data-front-door-field="deleteConfirm"]');
const frontDoorContinueButton = document.querySelector<HTMLButtonElement>('[data-front-door-action="continue"]');
const frontDoorLoadButton = document.querySelector<HTMLButtonElement>('[data-front-door-action="load"]');
const frontDoorSaveButton = document.querySelector<HTMLButtonElement>('[data-front-door-action="save"]');
const frontDoorDeleteButton = document.querySelector<HTMLButtonElement>('[data-front-door-action="delete"]');
const devPanelLauncher = document.querySelector<HTMLButtonElement>(".dev-panel-launcher");

if (!hudRoot || !gameRoot || !frontDoorOverlay || !frontDoorSlots || !frontDoorSummary || !frontDoorStatus || !frontDoorActions || !frontDoorDeleteConfirm) {
  throw new Error("HUD or game root missing.");
}

const searchParams = new URLSearchParams(window.location.search);
if (searchParams.get("capture") === "1") {
  document.body.classList.add("release-capture");
}
await loadSceneGeometryConfig();
const hasDebugBoot =
  [...searchParams.keys()].some((key) => key.startsWith("debug")) ||
  searchParams.get("debugOpenSanctuary") === "1";
const playtestOpenRoutes =
  searchParams.get("admin") === "1" ||
  searchParams.get("debugOpenRoutes") === "1" ||
  searchParams.get("playtestOpenRoutes") === "1";
type PlayerSettings = {
  battleAudio: boolean;
  reducedMotion: boolean;
  largeText: boolean;
};
const SETTINGS_KEY = "anima-codex-player-settings-v1";
const defaultPlayerSettings: PlayerSettings = {
  battleAudio: true,
  reducedMotion: false,
  largeText: false,
};
const loadPlayerSettings = (): PlayerSettings => {
  try {
    return { ...defaultPlayerSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "{}") };
  } catch {
    return { ...defaultPlayerSettings };
  }
};
let playerSettings = loadPlayerSettings();
const applyPlayerSettings = () => {
  document.body.classList.toggle("reduced-motion", playerSettings.reducedMotion);
  document.body.classList.toggle("large-text", playerSettings.largeText);
  document.body.dataset.battleAudio = playerSettings.battleAudio ? "on" : "off";
};
const savePlayerSettings = () => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(playerSettings));
  applyPlayerSettings();
};
applyPlayerSettings();
const gameState = new GameState(hudRoot, {
  enablePersistence: !hasDebugBoot,
  playtestOpenRoutes,
});
let selectedSaveSlot = 1;
let deleteConfirmOpen = false;
let activeMenuPane: "fieldLog" | "vivos" | "codex" | "pack" | "options" | "dev" = "fieldLog";
if (searchParams.get("debugMenu") === "options") {
  activeMenuPane = "options";
}

if (playtestOpenRoutes) {
  gameState.setMessage(
    "Playtest free roam is on: progression doors, route blockers, and collision masks are bypassed so you can inspect the whole current map.",
  );
}

const formatSaveTime = (savedAt?: string) =>
  savedAt
    ? new Date(savedAt).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "No saved field log";

const renderFrontDoor = (status = "") => {
  const summaries = Array.from({ length: SAVE_SLOT_COUNT }, (_, index) => gameState.getFieldLogSummary(index + 1));
  const summary = summaries[selectedSaveSlot - 1] ?? summaries[0];
  if (frontDoorTitle) {
    frontDoorTitle.textContent =
      {
        fieldLog: "Field Log",
        vivos: "Vivos",
        codex: "Codex",
        pack: "Pack",
        options: "Options",
        dev: "Dev Tools",
      }[activeMenuPane] ?? "Field Log";
  }
  document.querySelectorAll<HTMLButtonElement>("[data-front-door-menu]").forEach((button) => {
    button.classList.toggle("active", button.dataset.frontDoorMenu === activeMenuPane);
  });
  const fieldLogOpen = activeMenuPane === "fieldLog";
  frontDoorSlots.classList.toggle("hidden", !fieldLogOpen);
  frontDoorSlots.innerHTML = summaries
    .map(
      (slotSummary) => `
        <button type="button" class="${slotSummary.slot === selectedSaveSlot ? "active" : ""}" data-front-door-action="select-slot" data-front-door-slot="${slotSummary.slot}">
          <strong>Slot ${slotSummary.slot}</strong>
          <span>${slotSummary.hasSave ? `${slotSummary.sceneName} / ${formatSaveTime(slotSummary.savedAt)}` : "Empty"}</span>
        </button>
      `,
    )
    .join("");
  frontDoorSummary.innerHTML = renderMenuPane(summary);
  frontDoorStatus.textContent = summary.persistenceEnabled ? status : "Save and load are paused during debug boots.";
  frontDoorDeleteConfirm.classList.toggle("visible", deleteConfirmOpen);
  if (frontDoorContinueButton) {
    frontDoorContinueButton.textContent = summary.hasSave ? "Continue" : "New";
  }
  if (frontDoorLoadButton) {
    frontDoorLoadButton.disabled = !summary.persistenceEnabled || !summary.hasSave || Boolean(gameState.battle);
  }
  if (frontDoorSaveButton) {
    frontDoorSaveButton.disabled = !summary.persistenceEnabled || Boolean(gameState.battle);
  }
  if (frontDoorDeleteButton) {
    frontDoorDeleteButton.disabled = !summary.persistenceEnabled || !summary.hasSave || Boolean(gameState.battle);
  }
  devPanelLauncher?.classList.toggle("active", document.body.classList.contains("dev-panel-open"));
  frontDoorActions.classList.toggle("hidden", !fieldLogOpen);
  frontDoorDeleteConfirm.classList.toggle("hidden", !fieldLogOpen);
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const renderMenuPane = (summary: ReturnType<typeof gameState.getFieldLogSummary>) => {
  if (activeMenuPane === "fieldLog") {
    return summary.hasSave
      ? `<p>Slot ${selectedSaveSlot}: ${summary.sceneName}, ${summary.partyCount} active Vivo${summary.partyCount === 1 ? "" : "s"}, ${summary.reserveCount} in reserve, ${summary.badges} badge${summary.badges === 1 ? "" : "s"} (${formatSaveTime(summary.savedAt)}).</p>`
      : `<p>Slot ${selectedSaveSlot} is empty. Start a new route, then save here to create it.</p>`;
  }

  if (activeMenuPane === "vivos") {
    return `
      <div class="game-menu-list">
        ${gameState.party
          .map((vivo, index) => {
            const species = speciesDex[vivo.speciesId];
            const maxHp = gameState.getMaxHp(vivo);
            return `
              <article class="game-menu-row">
                <strong>${index === 0 ? ">" : ""}${escapeHtml(vivo.nickname)}</strong>
                <span>Lv ${vivo.level} ${escapeHtml(species.name)} / ${vivo.element.toUpperCase()}</span>
                <meter min="0" max="${maxHp}" value="${vivo.currentHp}"></meter>
                <em>${vivo.currentHp} / ${maxHp} HP</em>
              </article>
            `;
          })
          .join("")}
        <article class="game-menu-row muted"><strong>Reserve</strong><span>${gameState.reserve.length} Vivo${gameState.reserve.length === 1 ? "" : "s"} resting in sanctuary.</span></article>
      </div>
    `;
  }

  if (activeMenuPane === "codex") {
    return `<p>${Object.keys(speciesDex).length} Vivo records are registered. Use the Dev pane for the full audit drawer while this player Codex gets built out.</p>`;
  }

  if (activeMenuPane === "pack") {
    return `<p>The pack is ready for field tools, rescue capsules, and healing items. Item inventory is not wired into the player menu yet.</p>`;
  }

  if (activeMenuPane === "options") {
    return `
      <div class="options-menu" aria-label="Player settings">
        <article class="option-row">
          <div><strong>Battle audio</strong><span>Generated battle cues and confirmation tones.</span></div>
          <button type="button" data-front-door-action="toggle-setting" data-setting="battleAudio" aria-pressed="${playerSettings.battleAudio}">${playerSettings.battleAudio ? "On" : "Off"}</button>
        </article>
        <article class="option-row">
          <div><strong>Reduced motion</strong><span>Removes interface animation, shake, and decorative transitions.</span></div>
          <button type="button" data-front-door-action="toggle-setting" data-setting="reducedMotion" aria-pressed="${playerSettings.reducedMotion}">${playerSettings.reducedMotion ? "On" : "Off"}</button>
        </article>
        <article class="option-row">
          <div><strong>Larger text</strong><span>Increases menu and HUD copy for easier reading.</span></div>
          <button type="button" data-front-door-action="toggle-setting" data-setting="largeText" aria-pressed="${playerSettings.largeText}">${playerSettings.largeText ? "On" : "Off"}</button>
        </article>
        <p class="options-help">Keyboard: arrows or WASD to move; Space or Enter to interact. Settings persist independently of save slots.</p>
      </div>
    `;
  }

  return `
    <p>The detailed right-side panel is now treated as a dev drawer instead of the default player UI.</p>
    <div class="front-door-actions dev-menu-actions">
      <button type="button" data-front-door-action="toggle-dev-panel">${document.body.classList.contains("dev-panel-open") ? "Hide" : "Show"} dev panel</button>
    </div>
  `;
};

const setFrontDoorOpen = (open: boolean, status = "") => {
  renderFrontDoor(status);
  frontDoorOverlay.classList.toggle("visible", open);
};

document.body.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>("[data-front-door-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.frontDoorAction;
  if (action === "open") {
    deleteConfirmOpen = false;
    setFrontDoorOpen(true);
  } else if (action === "select-menu") {
    const nextPane = button.dataset.frontDoorMenu;
    if (
      nextPane === "fieldLog" ||
      nextPane === "vivos" ||
      nextPane === "codex" ||
      nextPane === "pack" ||
      nextPane === "options" ||
      nextPane === "dev"
    ) {
      activeMenuPane = nextPane;
      deleteConfirmOpen = false;
      renderFrontDoor();
    }
  } else if (action === "toggle-dev-panel") {
    document.body.classList.toggle("dev-panel-open");
    renderFrontDoor(document.body.classList.contains("dev-panel-open") ? "Dev panel opened." : "Dev panel hidden.");
  } else if (action === "toggle-setting") {
    const setting = button.dataset.setting as keyof PlayerSettings | undefined;
    if (setting && setting in playerSettings) {
      playerSettings = { ...playerSettings, [setting]: !playerSettings[setting] };
      savePlayerSettings();
      renderFrontDoor(`${button.closest(".option-row")?.querySelector("strong")?.textContent ?? "Setting"} updated.`);
    }
  } else if (action === "continue") {
    deleteConfirmOpen = false;
    const summary = gameState.getFieldLogSummary(selectedSaveSlot);
    if (!summary.hasSave && summary.persistenceEnabled) {
      const started = gameState.startNewProgressSlot(selectedSaveSlot);
      if (!started) {
        renderFrontDoor(`Could not start slot ${selectedSaveSlot}.`);
        return;
      }
      gameState.setMessage(`Started a new route in save slot ${selectedSaveSlot}.`);
    }
    setFrontDoorOpen(false);
  } else if (action === "select-slot") {
    selectedSaveSlot = Math.min(
      SAVE_SLOT_COUNT,
      Math.max(1, Number(button.dataset.frontDoorSlot) || selectedSaveSlot),
    );
    deleteConfirmOpen = false;
    renderFrontDoor();
  } else if (action === "save") {
    deleteConfirmOpen = false;
    const saved = gameState.saveProgressToSlot(selectedSaveSlot);
    renderFrontDoor(saved ? `Saved slot ${selectedSaveSlot}.` : "Could not save right now.");
  } else if (action === "load") {
    deleteConfirmOpen = false;
    const loaded = gameState.loadProgressFromStorage(selectedSaveSlot);
    if (loaded) {
      gameState.setMessage(`Loaded save slot ${selectedSaveSlot}.`);
      setFrontDoorOpen(false);
    } else {
      renderFrontDoor(`Could not load slot ${selectedSaveSlot}.`);
    }
  } else if (action === "delete") {
    deleteConfirmOpen = true;
    renderFrontDoor(`Confirm deleting slot ${selectedSaveSlot}.`);
  } else if (action === "cancel-delete") {
    deleteConfirmOpen = false;
    renderFrontDoor();
  } else if (action === "confirm-delete") {
    const deleted = gameState.deleteProgressSlot(selectedSaveSlot);
    deleteConfirmOpen = false;
    renderFrontDoor(deleted ? `Deleted slot ${selectedSaveSlot}.` : `Could not delete slot ${selectedSaveSlot}.`);
  }
});

setFrontDoorOpen(!hasDebugBoot || searchParams.has("debugMenu"));

const debugScene = searchParams.get("debugScene");
if (debugScene && gameState.getSceneById(debugScene)) {
  const scene = gameState.getSceneById(debugScene);
  gameState.switchScene(debugScene, scene.playerSpawn.x, scene.playerSpawn.y);
}

const debugPlayerPosition = searchParams.get("debugPlayerPosition");
if (debugPlayerPosition) {
  const [xText, yText] = debugPlayerPosition.split(":");
  const x = Number(xText);
  const y = Number(yText);
  if (!Number.isNaN(x) && !Number.isNaN(y)) {
    gameState.movePlayer(x, y);
  }
}

const debugParty = searchParams.get("debugParty");
if (debugParty) {
  if (searchParams.get("debugPartyMode") === "replace") {
    gameState.party.splice(0, gameState.party.length);
  }
  for (const entry of debugParty.split(",")) {
    const [speciesId, levelText, nickname] = entry.split(":");
    if (!speciesId || !levelText || !speciesDex[speciesId]) {
      continue;
    }
    const level = Number(levelText);
    if (Number.isNaN(level)) {
      continue;
    }
    const vivo = gameState.createVivo(speciesId, level, nickname);
    gameState.addCapturedVivo(vivo);
  }
  if (gameState.party.length === 0) {
    gameState.party.push(gameState.createVivo("dogemox", 4, "Dogemox"));
  }
}

const debugReserve = searchParams.get("debugReserve");
if (debugReserve) {
  for (const entry of debugReserve.split(",")) {
    const [speciesId, levelText, nickname] = entry.split(":");
    if (!speciesId || !levelText) {
      continue;
    }
    const level = Number(levelText);
    if (Number.isNaN(level)) {
      continue;
    }
    gameState.addReserveVivo(speciesId, level, nickname);
  }
}

const debugLeadIndex = searchParams.get("debugLeadIndex");
if (debugLeadIndex) {
  const leadIndex = Number(debugLeadIndex);
  if (!Number.isNaN(leadIndex)) {
    gameState.setFieldLead(leadIndex);
  }
}

if (searchParams.get("debugOpenSanctuary") === "1") {
  gameState.setMessage(gameState.openSanctuaryLedger());
}

const debugDefeatedTrainers = searchParams.get("debugDefeatedTrainers");
if (debugDefeatedTrainers) {
  for (const trainerId of debugDefeatedTrainers.split(",")) {
    gameState.debugDefeatTrainer(trainerId);
  }
}

const debugResolvedRescues = searchParams.get("debugResolvedRescues");
if (debugResolvedRescues) {
  for (const interactableId of debugResolvedRescues.split(",")) {
    gameState.debugResolveRescueEncounter(interactableId);
  }
}

const debugRecoveryAnchor = searchParams.get("debugRecoveryAnchor");
if (debugRecoveryAnchor) {
  gameState.debugSetRecoveryAnchor(debugRecoveryAnchor);
}

const debugEncounterMood = searchParams.get("debugEncounterMood");
if (debugEncounterMood) {
  for (const entry of debugEncounterMood.split(",")) {
    const [zoneId, mood] = entry.split(":");
    if (
      zoneId &&
      (mood === "settled" || mood === "steady" || mood === "spooked" || mood === "scattered")
    ) {
      gameState.debugSetEncounterMood(zoneId, mood);
    }
  }
}

const debugActiveEncounterZone = searchParams.get("debugActiveEncounterZone");
if (debugActiveEncounterZone) {
  const activeZone = gameState
    .getScene()
    .encounterZones.find((candidate) => candidate.id === debugActiveEncounterZone);
  if (activeZone) {
    gameState.movePlayer(activeZone.x + activeZone.width / 2, activeZone.y + activeZone.height / 2);
    gameState.setActiveEncounterZone(debugActiveEncounterZone);
  }
}

const debugLeadRescueMemory = searchParams.get("debugLeadRescueMemory");
if (debugLeadRescueMemory) {
  const [source, bondElement] = debugLeadRescueMemory.split(":");
  if (source) {
    gameState.debugStampLeadRescueMemory(
      source,
      bondElement === "fire" || bondElement === "grass" || bondElement === "ice" || bondElement === "light" || bondElement === "shadow" || bondElement === "steel" || bondElement === "stone" || bondElement === "water" || bondElement === "neutral"
        ? bondElement
        : undefined,
    );
  }
}

const debugPartyRescueMemory = searchParams.get("debugPartyRescueMemory");
if (debugPartyRescueMemory) {
  for (const entry of debugPartyRescueMemory.split(",")) {
    const [indexText, source, bondElement] = entry.split(":");
    const index = Number(indexText);
    if (!Number.isNaN(index) && source) {
      gameState.debugStampPartyRescueMemory(
        index,
        source,
        bondElement === "fire" || bondElement === "grass" || bondElement === "ice" || bondElement === "light" || bondElement === "shadow" || bondElement === "steel" || bondElement === "stone" || bondElement === "water" || bondElement === "neutral"
          ? bondElement
          : undefined,
      );
    }
  }
}

const debugHeldFieldCall = searchParams.get("debugHeldFieldCall");
if (debugHeldFieldCall) {
  for (const zoneId of debugHeldFieldCall.split(",")) {
    gameState.debugHoldFieldCall(zoneId);
  }
}

if (searchParams.get("debugSteadyActiveEncounter") === "1") {
  gameState.handleHudAction("steady-habitat");
}

const debugRescuePromise = searchParams.get("debugRescuePromise");
if (debugRescuePromise) {
  for (const entry of debugRescuePromise.split(",")) {
    const [zoneId, strengthText = "1"] = entry.split(":");
    if (zoneId) {
      gameState.debugPrimeRescuePromise(zoneId, Number(strengthText) >= 2 ? 2 : 1);
    }
  }
}

const debugLeadForm = searchParams.get("debugLeadForm");
if (debugLeadForm) {
  const lead = gameState.getPartyLead();
  const transition = speciesDex[lead.speciesId].formTransitions?.find(
    (candidate) => candidate.name === debugLeadForm,
  );
  if (transition) {
    if (lead.nickname === speciesDex[lead.speciesId].name) {
      lead.nickname = transition.name;
    }
    lead.formName = transition.name;
    lead.element = transition.newElement;
    lead.currentHp = gameState.getMaxHp(lead);
  }
}

const debugLeadEvolution = searchParams.get("debugLeadEvolution");
if (debugLeadEvolution) {
  gameState.debugPrimeLeadEvolution(debugLeadEvolution);
}

const debugWildBattle = searchParams.get("debugWildBattle");
if (debugWildBattle) {
  const [speciesId, levelText, ...formParts] = debugWildBattle.split(":");
  const level = Number(levelText);
  if (speciesId && speciesDex[speciesId] && !Number.isNaN(level)) {
    const enemy = gameState.createVivo(speciesId, level, undefined, {
      formName: formParts.length > 0 ? formParts.join(":") : undefined,
    });
    const activeZone = gameState.activeEncounterZoneId
      ? gameState.getScene().encounterZones.find(
          (candidate) => candidate.id === gameState.activeEncounterZoneId,
        )
      : undefined;
    gameState.battle = new BattleController(gameState, {
      type: "wild",
      enemyTeam: [enemy],
      label:
        searchParams.get("capture") === "1"
          ? `${enemy.formName ?? speciesDex[enemy.speciesId].name} emerges from ${gameState.currentScene.name}.`
          : `${enemy.formName ?? speciesDex[enemy.speciesId].name} emerges for a debug battle.`,
      fieldCondition: activeZone?.battlefieldCondition ?? gameState.currentScene.battlefieldCondition,
      initialTempo: activeZone ? gameState.getWildBattleInitialTempo(activeZone) : undefined,
    });
    gameState.renderHud();
  }
}

const debugBattleAction = searchParams.get("debugBattleAction");
if (debugBattleAction && gameState.battle) {
  const result = gameState.battle.handleDomAction(debugBattleAction);
  gameState.setMessage(result.log[0] ?? "Debug battle action resolved.");
  gameState.renderHud();
}

const debugTrainerBattle = searchParams.get("debugTrainerBattle");
if (debugTrainerBattle) {
  const trainer = gameState.currentScene.trainers.find((candidate) => candidate.id === debugTrainerBattle);
  if (trainer) {
    gameState.setMessage(`${trainer.name}: ${trainer.intro}`);
    gameState.startTrainerBattle(trainer);
  }
}

const debugBattleTempo = searchParams.get("debugBattleTempo");
if (debugBattleTempo && gameState.battle) {
  for (const entry of debugBattleTempo.split(",")) {
    const [side, effectsText] = entry.split(":");
    if ((side !== "player" && side !== "enemy") || !effectsText) {
      continue;
    }

    const effects = effectsText
      .split("+")
      .map((effect) => effect.trim())
      .filter(
        (effect): effect is "guarded" | "focused" | "exposed" =>
          effect === "guarded" || effect === "focused" || effect === "exposed",
      );
    if (effects.length > 0) {
      gameState.battle.debugPrimeTempo(side, effects);
    }
  }
  gameState.renderHud();
}

const debugWildPressure = searchParams.get("debugWildPressure");
if (debugWildPressure && gameState.battle) {
  const options: { enemyHp?: number; spookedByCapture?: boolean } = {};
  for (const entry of debugWildPressure.split(",")) {
    const [key, value] = entry.split(":");
    if (key === "hp") {
      const hp = Number(value);
      if (!Number.isNaN(hp)) {
        options.enemyHp = hp;
      }
    }
    if (key === "spooked" && value === "1") {
      options.spookedByCapture = true;
    }
  }
  gameState.battle.debugSetWildPressure(options);
  gameState.renderHud();
}

const debugCapturedRescueBond = searchParams.get("debugCapturedRescueBond");
if (debugCapturedRescueBond) {
  const [speciesId, levelText, readinessText = "2", calmSignalsText = "1"] = debugCapturedRescueBond.split(":");
  const level = Number(levelText);
  if (speciesId && speciesDex[speciesId] && !Number.isNaN(level)) {
    const rescued = gameState.createVivo(speciesId, level);
    const rescueBondNote = gameState.imprintCapturedRescueBond(
      rescued,
      Number(readinessText) || 1,
      Number(calmSignalsText) || 0,
    );
    const rosterMessage = gameState.addCapturedVivo(rescued);
    const aftermath = gameState.recordWildEncounterAftermath("capture", {
      targetName: speciesDex[speciesId].name,
      rescueRead: `debug ${readinessText} readiness with ${calmSignalsText} calm signal${calmSignalsText === "1" ? "" : "s"}`,
      bondNote: rescueBondNote,
    });
    gameState.finishBattle(
      `${speciesDex[speciesId].name} settled into your field capsule. ${rescueBondNote ? `${rescueBondNote} ` : ""}${rosterMessage}${aftermath ? ` ${aftermath}` : ""}`,
    );
  }
}

const debugBattleShowcase = searchParams.get("debugBattleShowcase");
if (debugBattleShowcase && gameState.battle) {
  const showcaseEvents: BattlePresentationEvent[] = [];
  for (const entry of debugBattleShowcase.split(",").map((value) => value.trim())) {
    switch (entry) {
      case "playerAttack":
        showcaseEvents.push({
          type: "attack",
          side: "player",
          targetSide: "enemy",
          moveName: "Demo Strike",
          attackStyle: "impact",
          element: gameState.battle.playerActive.element,
          hit: true,
          damage: 18,
          effectiveness: "strong",
          guarded: false,
          exploitedOpening: true,
          fainted: false,
        });
        break;
      case "enemyAttack":
        showcaseEvents.push({
          type: "attack",
          side: "enemy",
          targetSide: "player",
          moveName: "Demo Strike",
          attackStyle: "focus",
          element: gameState.battle.enemyActive.element,
          hit: true,
          damage: 14,
          effectiveness: "neutral",
          guarded: true,
          exploitedOpening: false,
          fainted: false,
        });
        break;
      case "guard":
        showcaseEvents.push({
          type: "support",
          side: "player",
          targetSide: "player",
          moveName: "Guard Howl",
          effectType: "guard",
        });
        break;
      case "focus":
        showcaseEvents.push({
          type: "support",
          side: "enemy",
          targetSide: "enemy",
          moveName: "Prism Veil",
          effectType: "focus",
        });
        break;
      case "expose":
        showcaseEvents.push({
          type: "support",
          side: "player",
          targetSide: "enemy",
          moveName: "Root Snare",
          effectType: "expose",
        });
        break;
      case "playerSwitch":
        showcaseEvents.push({
          type: "switch",
          side: "player",
          vivoName: gameState.battle.playerActive.nickname,
          forced: false,
        });
        break;
      case "enemySwitch":
        showcaseEvents.push({
          type: "switch",
          side: "enemy",
          vivoName: gameState.battle.enemyActive.nickname,
          forced: false,
        });
        break;
      case "captureFail":
        showcaseEvents.push({
          type: "capture",
          success: false,
          readiness: "wavering",
        });
        break;
      case "captureSuccess":
        showcaseEvents.push({
          type: "capture",
          success: true,
          readiness: "fragile",
        });
        break;
      case "enemyFaint":
        showcaseEvents.push({
          type: "faint",
          side: "enemy",
          vivoName: gameState.battle.enemyActive.nickname,
        });
        break;
      case "playerFaint":
        showcaseEvents.push({
          type: "faint",
          side: "player",
          vivoName: gameState.battle.playerActive.nickname,
        });
        break;
    }
  }
  if (showcaseEvents.length > 0) {
    gameState.battle.debugQueuePresentationEvents(showcaseEvents);
  }
}

const debugDialogue = searchParams.get("debugDialogue");
if (debugDialogue) {
  const [subjectId, phase] = debugDialogue.split(":");
  const scene = gameState.getScene();
  const interactable = scene.interactables.find((candidate) => candidate.id === subjectId);
  if (interactable) {
    const outcome = gameState.inspectInteractable(interactable);
    const dialogue = interactable.dialogue ?? [{ speaker: interactable.label, text: interactable.text }];
    const lastLine = dialogue[dialogue.length - 1];
    gameState.openDialogue(
      lastLine?.text === outcome ? dialogue : [...dialogue, { speaker: "Field Note", text: outcome }],
    );
  }

  const trainer = scene.trainers.find((candidate) => candidate.id === subjectId);
  if (trainer) {
    if (phase === "blocked") {
      gameState.openDialogue(
        trainer.blockedDialogue ?? [{ speaker: trainer.name, text: trainer.blockedText ?? trainer.intro }],
      );
      gameState.setMessage(trainer.blockedText ?? trainer.intro);
    } else if (phase === "reward") {
      gameState.openDialogue(
        trainer.rewardDialogue ?? [{ speaker: trainer.name, text: trainer.rewardText }],
      );
      gameState.setMessage(trainer.rewardText);
    } else {
      gameState.openDialogue(
        trainer.introDialogue ?? [{ speaker: trainer.name, text: trainer.intro }],
      );
      gameState.setMessage(`${trainer.name}: ${trainer.intro}`);
    }
  }
}

const debugPendingMove = searchParams.get("debugPendingMove");
if (debugPendingMove) {
  for (const entry of debugPendingMove.split(",")) {
    const [scopeText, indexText, moveId] = entry.split(":");
    const scope = scopeText === "reserve" ? "reserve" : "party";
    const index = Number(indexText);
    const roster = scope === "reserve" ? gameState.reserve : gameState.party;
    const vivo = roster[index];
    if (!vivo || !moveId) {
      continue;
    }

    const alreadyKnown = vivo.knownMoveIds.includes(moveId);
    const alreadyPending = vivo.pendingMoveChoices.some((choice) => choice.moveId === moveId);
    if (!alreadyKnown && !alreadyPending) {
      vivo.pendingMoveChoices.push({
        moveId,
        sourceLevel: vivo.level,
      });
    }
  }
  gameState.renderHud();
}

const debugTrainerDebrief = searchParams.get("debugTrainerDebrief");
if (debugTrainerDebrief) {
  const [trainerId, resultText] = debugTrainerDebrief.split(":");
  if (
    trainerId &&
    (resultText === "full" || resultText === "practice" || resultText === "defeat")
  ) {
    gameState.debugSetTrainerDebrief(trainerId, resultText);
  }
}

const debugScriptedEncounter = searchParams.get("debugScriptedEncounter");
if (debugScriptedEncounter) {
  const interactable = gameState
    .getScene()
    .interactables.find((candidate) => candidate.id === debugScriptedEncounter);
  if (interactable?.scriptedEncounter) {
    gameState.setMessage(interactable.text);
    gameState.startScriptedRescueEncounter(interactable);
  }
}

hudRoot.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;
  if (!target || gameState.battle) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("[data-world-action]");
  if (!button) {
    return;
  }

  const nextMessage = gameState.handleHudAction(
    button.dataset.worldAction ?? "",
    button.dataset.worldValue,
  );
  if (nextMessage) {
    gameState.setMessage(nextMessage);
  }
});

window.__animaCodexDebug = {
  gameState,
  switchScene: (sceneId: string) => {
    const scene = gameState.getSceneById(sceneId);
    gameState.switchScene(sceneId, scene.playerSpawn.x, scene.playerSpawn.y);
  },
};

window.addEventListener("beforeunload", () => {
  gameState.flushProgressSave();
});

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: gameRoot,
  backgroundColor: "#12131c",
  scene: [BootScene, WorldScene, BattleScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  callbacks: {
    postBoot: (game) => {
      game.registry.set("gameState", gameState);
    },
  },
});
