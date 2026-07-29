#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const contentPath = path.join(projectRoot, "src", "game", "data", "authoredContent.json");
const movesSourcePath = path.join(projectRoot, "src", "game", "data", "moves.ts");
const speciesSourcePath = path.join(projectRoot, "src", "game", "data", "species.ts");
const scenesSourcePath = path.join(projectRoot, "src", "game", "data", "scenes.ts");
const sceneGeometryConfigPath = path.join(projectRoot, "public", "config", "scene-geometry-overrides.json");
const contentAssetRoot = path.join(projectRoot, "public", "content-assets");

const ELEMENTS = new Set(["neutral", "electric", "fire", "grass", "ice", "light", "shadow", "steel", "stone", "water"]);
const MOVE_KINDS = new Set(["attack", "support"]);
const ATTACK_STYLES = new Set(["impact", "focus"]);
const SUPPORT_TYPES = new Set(["guard", "focus", "expose"]);
const ITEM_CATEGORIES = new Set(["healing", "capture", "battle", "key"]);
const ASSET_KINDS = new Set(["scene", "battle", "portrait"]);
const WILD_DISPOSITIONS = new Set(["steadfast", "wary", "flighty"]);
const BATTLE_TRAIT_IDS = new Set([
  "sanctuaryHeart",
  "rootedShelter",
  "prismEcho",
  "cutlineRush",
  "stillwaterLungs",
  "ironDefiance",
]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const usage = `Anima Codex content CLI

Usage:
  npm run content -- list
  npm run content -- validate
  npm run content -- add-move --id <id> --name <name> --element <element> --kind <attack|support> [options]
  npm run content -- add-item --id <id> --name <name> --category <healing|capture|battle|key> --description <text> [options]
  npm run content -- add-potion --id <id> --name <name> --hp <number> --description <text>
  npm run content -- add-asset --id <id> --kind <scene|battle|portrait> --file <path> [--assign-scene <sceneId>] [--assign-species <speciesId>] [--assign-form <formName>]
  npm run content -- assign-asset --asset <id> [--scene <sceneId>] [--species <speciesId>] [--form <formName>]
  npm run content -- add-species --id <id> --name <name> --registry-name <name> --element <element> --trait-id <traitId> --trait-name <name> --trait-summary <text> --hp <n> --attack <n> --defense <n> --focus <n> --speed <n> --learnset <move:level,...> [options]
  npm run content -- set-species-stats --id <speciesId> --hp <n> --attack <n> --defense <n> --focus <n> --speed <n>
  npm run content -- list-spawns [--scene <sceneId>] [--element <element>]
  npm run content -- sprinkle-spawns --scenes <sceneId,...> (--species <speciesId,...>|--element <element>) --weight <n> [options]

Move options:
  --power <number>            Default 0 for support, required for attacks
  --accuracy <0-1>            Default 1
  --attack-style <impact|focus>
  --description <text>
  --priority <number>         Default 0
  --support <guard|focus|expose>
  --shield <number>           Guard multiplier, default 0.6
  --focus <number>            Focus power multiplier, default 1.2
  --expose <number>           Expose damage multiplier, default 1.3

Item options:
  --hp <number>               Healing amount
  --capture-modifier <number> Capture multiplier
  --calm-modifier <number>    Calm multiplier

Species options:
  --wild-disposition <value>   steadfast, wary, or flighty. Default wary
  --primary <hex>              Palette primary, for example #7fb86a or 0x7fb86a
  --secondary <hex>            Palette secondary
  --glow <hex>                 Palette glow
  --portrait <assetId>         Assign a configured portrait asset to the species

Spawn balancing options:
  --zones <all|attuned|id,...>  Default all. attuned limits to zones matching --element
  --mode <add|set>              add preserves other species, set replaces zone tables. Default add
  --replace-element <element>   Remove existing species of that element before adding
  --level-min <number>          Optionally lower/raise the zone level range minimum
  --level-max <number>          Optionally lower/raise the zone level range maximum
  --dry-run                     Preview matched zones without writing
`;

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const parseArgs = (argv) => {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      parsed._.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }
    parsed[key] = next;
    index += 1;
  }
  return parsed;
};

const readContent = async () => JSON.parse(await fs.readFile(contentPath, "utf8"));

const readSceneGeometryConfig = async () => JSON.parse(await fs.readFile(sceneGeometryConfigPath, "utf8"));

const writeSceneGeometryConfig = async (config) => {
  config.updatedAt = new Date().toISOString();
  await fs.writeFile(sceneGeometryConfigPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
};

const writeContent = async (content) => {
  content.assets ??= [];
  content.species ??= [];
  content.speciesOverrides ??= [];
  content.portraitAssignments ??= [];
  content.battleBackdropAssignments ??= [];
  content.assets.sort((a, b) => a.id.localeCompare(b.id));
  content.species.sort((a, b) => a.id.localeCompare(b.id));
  content.speciesOverrides.sort((a, b) => a.id.localeCompare(b.id));
  content.portraitAssignments.sort((a, b) =>
    `${a.speciesId ?? ""}${a.formName ?? ""}`.localeCompare(`${b.speciesId ?? ""}${b.formName ?? ""}`),
  );
  content.battleBackdropAssignments.sort((a, b) => a.sceneId.localeCompare(b.sceneId));
  content.moves.sort((a, b) => a.id.localeCompare(b.id));
  content.items.sort((a, b) => a.id.localeCompare(b.id));
  await fs.writeFile(contentPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
};

const toNumber = (value, label, fallback) => {
  if (value === undefined) {
    if (fallback !== undefined) return fallback;
    fail(`Missing required --${label}.`);
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    fail(`--${label} must be a number.`);
  }
  return number;
};

const requireText = (args, key) => {
  const value = args[key];
  if (!value || value === "true") {
    fail(`Missing required --${key}.`);
  }
  return value;
};

const assertId = (id) => {
  if (!/^[a-z][a-zA-Z0-9]*$/.test(id)) {
    fail(`Invalid id '${id}'. Use lower camelCase, for example fieldPoultice.`);
  }
};

const toOptionalNumber = (value, label) => (value === undefined ? undefined : toNumber(value, label));

const parseColor = (value, label, fallback) => {
  if (value === undefined) return fallback;
  const normalized = String(value).trim();
  const hex = normalized.startsWith("#")
    ? normalized.slice(1)
    : normalized.startsWith("0x")
      ? normalized.slice(2)
      : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    fail(`--${label} must be a six-digit color, for example #7fb86a or 0x7fb86a.`);
  }
  return Number.parseInt(hex, 16);
};

const parseLearnset = (value) => {
  if (!value || value === "true") {
    fail("Missing required --learnset. Use moveId:level pairs, for example tackle:1,emberNeedle:4.");
  }
  return value.split(",").map((entry) => {
    const [moveId, levelText] = entry.split(":").map((part) => part.trim());
    assertId(moveId);
    const level = Number(levelText);
    if (!Number.isInteger(level) || level < 1) {
      fail(`Invalid learnset entry '${entry}'. Use moveId:positiveInteger.`);
    }
    return { level, moveId };
  });
};

const getBuiltInMoveIds = async () => {
  const source = await fs.readFile(movesSourcePath, "utf8");
  return new Set([...source.matchAll(/^\s{2}([a-z][a-zA-Z0-9]*): makeMove\(/gm)].map((match) => match[1]));
};

const getBuiltInSpeciesIds = async () => {
  const source = await fs.readFile(speciesSourcePath, "utf8");
  return new Set([...source.matchAll(/^\s{2}([a-z][a-zA-Z0-9]*): \{\r?\n\s{4}id: "\1"/gm)].map((match) => match[1]));
};

const getBuiltInSpeciesElements = async () => {
  const source = await fs.readFile(speciesSourcePath, "utf8");
  const elements = new Map();
  for (const match of source.matchAll(/^\s{2}([a-z][a-zA-Z0-9]*): \{\r?\n\s{4}id: "\1",[\s\S]*?\r?\n\s{4}element: "([a-z]+)"/gm)) {
    elements.set(match[1], match[2]);
  }
  return elements;
};

const getKnownSpeciesElements = async (content) => {
  content ??= await readContent();
  const elements = await getBuiltInSpeciesElements();
  for (const species of content.species ?? []) {
    if (species.id && species.element) elements.set(species.id, species.element);
  }
  return elements;
};

const getBuiltInSceneIds = async () => {
  const source = await fs.readFile(scenesSourcePath, "utf8");
  return new Set([...source.matchAll(/id: "([a-z][a-zA-Z0-9]*)"/g)].map((match) => match[1]));
};

const validateContent = async (content) => {
  const failures = [];
  if (content.version !== 1) {
    failures.push("authoredContent.version must be 1.");
  }
  if (!Array.isArray(content.moves)) {
    failures.push("authoredContent.moves must be an array.");
  }
  if (!Array.isArray(content.items)) {
    failures.push("authoredContent.items must be an array.");
  }
  if (content.assets !== undefined && !Array.isArray(content.assets)) {
    failures.push("authoredContent.assets must be an array.");
  }
  if (content.species !== undefined && !Array.isArray(content.species)) {
    failures.push("authoredContent.species must be an array.");
  }
  if (content.speciesOverrides !== undefined && !Array.isArray(content.speciesOverrides)) {
    failures.push("authoredContent.speciesOverrides must be an array.");
  }
  if (content.portraitAssignments !== undefined && !Array.isArray(content.portraitAssignments)) {
    failures.push("authoredContent.portraitAssignments must be an array.");
  }
  if (content.battleBackdropAssignments !== undefined && !Array.isArray(content.battleBackdropAssignments)) {
    failures.push("authoredContent.battleBackdropAssignments must be an array.");
  }
  if (failures.length > 0) return failures;

  const builtInMoveIds = await getBuiltInMoveIds();
  const builtInSpeciesIds = await getBuiltInSpeciesIds();
  const builtInSceneIds = await getBuiltInSceneIds();
  const moveIds = new Set();
  const itemIds = new Set();
  const assetIds = new Set();
  const speciesIds = new Set(builtInSpeciesIds);
  const allMoveIds = new Set(builtInMoveIds);
  for (const move of content.moves) {
    if (move?.id) allMoveIds.add(move.id);
  }

  for (const asset of content.assets ?? []) {
    if (!asset.id || !/^[a-z][a-zA-Z0-9]*$/.test(asset.id)) failures.push(`Asset has invalid id '${asset.id}'.`);
    if (assetIds.has(asset.id)) failures.push(`Duplicate asset id '${asset.id}'.`);
    assetIds.add(asset.id);
    if (!ASSET_KINDS.has(asset.kind)) failures.push(`Asset '${asset.id}' has invalid kind '${asset.kind}'.`);
    if (!asset.path || typeof asset.path !== "string" || !asset.path.startsWith("/content-assets/")) {
      failures.push(`Asset '${asset.id}' path must point under /content-assets/.`);
    }
  }

  for (const move of content.moves) {
    if (!move.id || !/^[a-z][a-zA-Z0-9]*$/.test(move.id)) failures.push(`Move has invalid id '${move.id}'.`);
    if (moveIds.has(move.id)) failures.push(`Duplicate configured move id '${move.id}'.`);
    if (builtInMoveIds.has(move.id)) failures.push(`Configured move '${move.id}' duplicates a built-in move.`);
    moveIds.add(move.id);
    if (!move.name) failures.push(`Move '${move.id}' is missing name.`);
    if (!ELEMENTS.has(move.element)) failures.push(`Move '${move.id}' has invalid element '${move.element}'.`);
    if (!MOVE_KINDS.has(move.kind)) failures.push(`Move '${move.id}' has invalid kind '${move.kind}'.`);
    if (move.kind === "attack" && !ATTACK_STYLES.has(move.attackStyle)) {
      failures.push(`Attack move '${move.id}' needs attackStyle impact or focus.`);
    }
    if (move.kind === "support" && move.attackStyle !== undefined) {
      failures.push(`Support move '${move.id}' should not set attackStyle.`);
    }
    if (typeof move.power !== "number" || move.power < 0) failures.push(`Move '${move.id}' has invalid power.`);
    if (typeof move.accuracy !== "number" || move.accuracy < 0 || move.accuracy > 1) {
      failures.push(`Move '${move.id}' accuracy must be between 0 and 1.`);
    }
    if (!move.description) failures.push(`Move '${move.id}' is missing description.`);
    if (move.supportEffect && !SUPPORT_TYPES.has(move.supportEffect.type)) {
      failures.push(`Move '${move.id}' has invalid supportEffect type '${move.supportEffect.type}'.`);
    }
  }

  for (const item of content.items) {
    if (!item.id || !/^[a-z][a-zA-Z0-9]*$/.test(item.id)) failures.push(`Item has invalid id '${item.id}'.`);
    if (itemIds.has(item.id)) failures.push(`Duplicate item id '${item.id}'.`);
    itemIds.add(item.id);
    if (!item.name) failures.push(`Item '${item.id}' is missing name.`);
    if (!ITEM_CATEGORIES.has(item.category)) failures.push(`Item '${item.id}' has invalid category '${item.category}'.`);
    if (!item.description) failures.push(`Item '${item.id}' is missing description.`);
    if (item.battleUse?.type === "heal" && (!(item.battleUse.hp > 0))) {
      failures.push(`Healing item '${item.id}' needs battleUse.hp above 0.`);
    }
    if (item.battleUse?.type === "capture" && (!(item.battleUse.captureModifier > 0))) {
      failures.push(`Capture item '${item.id}' needs battleUse.captureModifier above 0.`);
    }
    if (item.battleUse?.type === "calm" && (!(item.battleUse.calmModifier > 0))) {
      failures.push(`Calm item '${item.id}' needs battleUse.calmModifier above 0.`);
    }
  }

  for (const species of content.species ?? []) {
    if (!species.id || !/^[a-z][a-zA-Z0-9]*$/.test(species.id)) failures.push(`Species has invalid id '${species.id}'.`);
    if (builtInSpeciesIds.has(species.id)) failures.push(`Configured species '${species.id}' duplicates a built-in species. Use set-species-stats for tuning.`);
    if (speciesIds.has(species.id)) failures.push(`Duplicate species id '${species.id}'.`);
    speciesIds.add(species.id);
    if (!species.name) failures.push(`Species '${species.id}' is missing name.`);
    if (!species.registryName) failures.push(`Species '${species.id}' is missing registryName.`);
    if (!ELEMENTS.has(species.element)) failures.push(`Species '${species.id}' has invalid element '${species.element}'.`);
    if (species.wildDisposition && !WILD_DISPOSITIONS.has(species.wildDisposition)) {
      failures.push(`Species '${species.id}' has invalid wildDisposition '${species.wildDisposition}'.`);
    }
    if (!species.battleTrait?.id || !BATTLE_TRAIT_IDS.has(species.battleTrait.id)) {
      failures.push(`Species '${species.id}' needs a supported battleTrait.id.`);
    }
    for (const stat of ["hp", "attack", "defense", "focus", "speed"]) {
      if (!(species.statBias?.[stat] >= 1)) failures.push(`Species '${species.id}' needs statBias.${stat} above 0.`);
    }
    for (const color of ["primary", "secondary", "glow"]) {
      if (!Number.isInteger(species.palette?.[color])) failures.push(`Species '${species.id}' needs numeric palette.${color}.`);
    }
    if (!Array.isArray(species.learnset) || species.learnset.length === 0) {
      failures.push(`Species '${species.id}' needs at least one learnset entry.`);
    } else {
      for (const entry of species.learnset) {
        if (!allMoveIds.has(entry.moveId)) failures.push(`Species '${species.id}' learns unknown move '${entry.moveId}'.`);
        if (!Number.isInteger(entry.level) || entry.level < 1) failures.push(`Species '${species.id}' has invalid learnset level.`);
      }
    }
  }

  for (const override of content.speciesOverrides ?? []) {
    if (!override.id || !speciesIds.has(override.id)) failures.push(`Species override '${override.id}' does not target a known species.`);
    for (const stat of ["hp", "attack", "defense", "focus", "speed"]) {
      if (override.statBias?.[stat] !== undefined && !(override.statBias[stat] >= 1)) {
        failures.push(`Species override '${override.id}' has invalid statBias.${stat}.`);
      }
    }
  }

  for (const assignment of content.portraitAssignments ?? []) {
    if (!assetIds.has(assignment.assetId)) failures.push(`Portrait assignment references unknown asset '${assignment.assetId}'.`);
    const asset = (content.assets ?? []).find((candidate) => candidate.id === assignment.assetId);
    if (asset && asset.kind !== "portrait") failures.push(`Portrait assignment '${assignment.assetId}' must reference a portrait asset.`);
    if (!assignment.speciesId && !assignment.formName) failures.push(`Portrait assignment '${assignment.assetId}' needs speciesId or formName.`);
    if (assignment.speciesId && !speciesIds.has(assignment.speciesId)) {
      failures.push(`Portrait assignment targets unknown species '${assignment.speciesId}'.`);
    }
  }

  for (const assignment of content.battleBackdropAssignments ?? []) {
    if (!assetIds.has(assignment.assetId)) failures.push(`Battle assignment references unknown asset '${assignment.assetId}'.`);
    const asset = (content.assets ?? []).find((candidate) => candidate.id === assignment.assetId);
    if (asset && asset.kind !== "battle") failures.push(`Battle assignment '${assignment.assetId}' must reference a battle asset.`);
    if (!builtInSceneIds.has(assignment.sceneId)) failures.push(`Battle assignment targets unknown scene '${assignment.sceneId}'.`);
  }

  return failures;
};

const addMove = async (args) => {
  const content = await readContent();
  const id = requireText(args, "id");
  assertId(id);
  const kind = requireText(args, "kind");
  if (!MOVE_KINDS.has(kind)) fail("--kind must be attack or support.");
  const element = requireText(args, "element");
  if (!ELEMENTS.has(element)) fail(`--element must be one of ${[...ELEMENTS].join(", ")}.`);
  if (content.moves.some((move) => move.id === id)) fail(`Configured move '${id}' already exists.`);
  if ((await getBuiltInMoveIds()).has(id)) fail(`Move '${id}' already exists as a built-in move.`);

  const move = {
    id,
    name: requireText(args, "name"),
    element,
    kind,
    power: toNumber(args.power, "power", kind === "support" ? 0 : undefined),
    accuracy: toNumber(args.accuracy, "accuracy", 1),
    description: requireText(args, "description"),
    priority: toNumber(args.priority, "priority", 0),
  };

  if (kind === "attack") {
    const attackStyle = args["attack-style"] ?? args.attackStyle;
    if (!ATTACK_STYLES.has(attackStyle)) fail("--attack-style must be impact or focus for attack moves.");
    move.attackStyle = attackStyle;
  } else if (args.support) {
    if (!SUPPORT_TYPES.has(args.support)) fail("--support must be guard, focus, or expose.");
    if (args.support === "guard") {
      move.supportEffect = { type: "guard", target: "self", shieldMultiplier: toNumber(args.shield, "shield", 0.6) };
    } else if (args.support === "focus") {
      move.supportEffect = { type: "focus", target: "self", powerMultiplier: toNumber(args.focus, "focus", 1.2) };
    } else {
      move.supportEffect = { type: "expose", target: "foe", damageMultiplier: toNumber(args.expose, "expose", 1.3) };
    }
  }

  content.moves.push(move);
  const failures = await validateContent(content);
  if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
  await writeContent(content);
  console.log(`Added move '${id}' to ${path.relative(projectRoot, contentPath)}.`);
};

const getItemBattleUse = (args, category) => {
  if (args.hp !== undefined || category === "healing") {
    return { type: "heal", hp: toNumber(args.hp, "hp", undefined) };
  }
  if (args["capture-modifier"] !== undefined || category === "capture") {
    return {
      type: "capture",
      captureModifier: toNumber(args["capture-modifier"], "capture-modifier", 1),
    };
  }
  if (args["calm-modifier"] !== undefined) {
    return { type: "calm", calmModifier: toNumber(args["calm-modifier"], "calm-modifier", 1) };
  }
  return undefined;
};

const addItem = async (args) => {
  const content = await readContent();
  const id = requireText(args, "id");
  assertId(id);
  if (content.items.some((item) => item.id === id)) fail(`Item '${id}' already exists.`);
  const category = requireText(args, "category");
  if (!ITEM_CATEGORIES.has(category)) fail(`--category must be one of ${[...ITEM_CATEGORIES].join(", ")}.`);
  const item = {
    id,
    name: requireText(args, "name"),
    category,
    description: requireText(args, "description"),
  };
  const battleUse = getItemBattleUse(args, category);
  if (battleUse) item.battleUse = battleUse;
  content.items.push(item);
  const failures = await validateContent(content);
  if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
  await writeContent(content);
  console.log(`Added item '${id}' to ${path.relative(projectRoot, contentPath)}.`);
};

const addPotion = async (args) => {
  args.category = "healing";
  await addItem(args);
};

const upsertPortraitAssignment = (content, assignment) => {
  content.portraitAssignments ??= [];
  const index = content.portraitAssignments.findIndex((existing) =>
    assignment.speciesId
      ? existing.speciesId === assignment.speciesId
      : existing.formName === assignment.formName,
  );
  if (index >= 0) {
    content.portraitAssignments[index] = assignment;
  } else {
    content.portraitAssignments.push(assignment);
  }
};

const upsertBattleAssignment = (content, assignment) => {
  content.battleBackdropAssignments ??= [];
  const index = content.battleBackdropAssignments.findIndex((existing) => existing.sceneId === assignment.sceneId);
  if (index >= 0) {
    content.battleBackdropAssignments[index] = assignment;
  } else {
    content.battleBackdropAssignments.push(assignment);
  }
};

const addAsset = async (args) => {
  const content = await readContent();
  content.assets ??= [];
  const id = requireText(args, "id");
  assertId(id);
  if (content.assets.some((asset) => asset.id === id)) fail(`Asset '${id}' already exists.`);
  const kind = requireText(args, "kind");
  if (!ASSET_KINDS.has(kind)) fail(`--kind must be one of ${[...ASSET_KINDS].join(", ")}.`);
  const sourceFile = path.resolve(projectRoot, requireText(args, "file"));
  let stat;
  try {
    stat = await fs.stat(sourceFile);
  } catch {
    fail(`Asset file not found: ${sourceFile}`);
  }
  if (!stat.isFile()) fail(`Asset file is not a regular file: ${sourceFile}`);
  const extension = path.extname(sourceFile).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) fail(`Asset file must be one of ${[...IMAGE_EXTENSIONS].join(", ")}.`);
  const targetDirectory = path.join(contentAssetRoot, kind);
  await fs.mkdir(targetDirectory, { recursive: true });
  const targetFile = path.join(targetDirectory, `${id}${extension}`);
  await fs.copyFile(sourceFile, targetFile);
  const publicPath = `/content-assets/${kind}/${id}${extension}`;
  content.assets.push({ id, kind, path: publicPath, source: path.relative(projectRoot, sourceFile).replace(/\\/g, "/") });

  if (args["assign-scene"]) {
    if (kind !== "battle") fail("--assign-scene currently assigns battle backdrop assets; use --kind battle.");
    upsertBattleAssignment(content, { sceneId: args["assign-scene"], assetId: id });
  }
  if (args["assign-species"]) {
    if (kind !== "portrait") fail("--assign-species requires --kind portrait.");
    upsertPortraitAssignment(content, { speciesId: args["assign-species"], assetId: id });
  }
  if (args["assign-form"]) {
    if (kind !== "portrait") fail("--assign-form requires --kind portrait.");
    upsertPortraitAssignment(content, { formName: args["assign-form"], assetId: id });
  }

  const failures = await validateContent(content);
  if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
  await writeContent(content);
  console.log(`Added ${kind} asset '${id}' at ${publicPath}.`);
};

const assignAsset = async (args) => {
  const content = await readContent();
  const assetId = requireText(args, "asset");
  const asset = (content.assets ?? []).find((candidate) => candidate.id === assetId);
  if (!asset) fail(`Unknown configured asset '${assetId}'.`);
  if (args.scene) {
    if (asset.kind !== "battle") fail("--scene requires a battle asset.");
    upsertBattleAssignment(content, { sceneId: args.scene, assetId });
  } else if (args.species) {
    if (asset.kind !== "portrait") fail("--species requires a portrait asset.");
    upsertPortraitAssignment(content, { speciesId: args.species, assetId });
  } else if (args.form) {
    if (asset.kind !== "portrait") fail("--form requires a portrait asset.");
    upsertPortraitAssignment(content, { formName: args.form, assetId });
  } else {
    fail("assign-asset needs --scene, --species, or --form.");
  }
  const failures = await validateContent(content);
  if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
  await writeContent(content);
  console.log(`Assigned asset '${assetId}'.`);
};

const makeSpeciesFromArgs = (args) => {
  const id = requireText(args, "id");
  assertId(id);
  const element = requireText(args, "element");
  if (!ELEMENTS.has(element)) fail(`--element must be one of ${[...ELEMENTS].join(", ")}.`);
  const wildDisposition = args["wild-disposition"] ?? "wary";
  if (!WILD_DISPOSITIONS.has(wildDisposition)) fail("--wild-disposition must be steadfast, wary, or flighty.");
  const traitId = requireText(args, "trait-id");
  if (!BATTLE_TRAIT_IDS.has(traitId)) {
    fail(`--trait-id must be one of ${[...BATTLE_TRAIT_IDS].join(", ")} until new battle trait code is added.`);
  }
  return {
    id,
    name: requireText(args, "name"),
    registryName: requireText(args, "registry-name"),
    element,
    wildDisposition,
    battleTrait: {
      id: traitId,
      name: requireText(args, "trait-name"),
      summary: requireText(args, "trait-summary"),
    },
    palette: {
      primary: parseColor(args.primary, "primary", 0x8fbf9f),
      secondary: parseColor(args.secondary, "secondary", 0x33433b),
      glow: parseColor(args.glow, "glow", 0xf2dda8),
    },
    statBias: {
      hp: toNumber(args.hp, "hp"),
      attack: toNumber(args.attack, "attack"),
      defense: toNumber(args.defense, "defense"),
      focus: toNumber(args.focus, "focus"),
      speed: toNumber(args.speed, "speed"),
    },
    learnset: parseLearnset(args.learnset),
  };
};

const addSpecies = async (args) => {
  const content = await readContent();
  content.species ??= [];
  const species = makeSpeciesFromArgs(args);
  if (content.species.some((entry) => entry.id === species.id)) fail(`Configured species '${species.id}' already exists.`);
  if ((await getBuiltInSpeciesIds()).has(species.id)) fail(`Species '${species.id}' already exists. Use set-species-stats to tune it.`);
  content.species.push(species);
  if (args.portrait) {
    upsertPortraitAssignment(content, { speciesId: species.id, assetId: args.portrait });
  }
  const failures = await validateContent(content);
  if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
  await writeContent(content);
  console.log(`Added species '${species.id}' to ${path.relative(projectRoot, contentPath)}.`);
};

const setSpeciesStats = async (args) => {
  const content = await readContent();
  content.speciesOverrides ??= [];
  const id = requireText(args, "id");
  assertId(id);
  const existing = content.speciesOverrides.find((override) => override.id === id) ?? { id };
  existing.statBias = {
    ...(existing.statBias ?? {}),
    ...Object.fromEntries(
      [
        ["hp", toOptionalNumber(args.hp, "hp")],
        ["attack", toOptionalNumber(args.attack, "attack")],
        ["defense", toOptionalNumber(args.defense, "defense")],
        ["focus", toOptionalNumber(args.focus, "focus")],
        ["speed", toOptionalNumber(args.speed, "speed")],
      ].filter(([, value]) => value !== undefined),
    ),
  };
  if (Object.keys(existing.statBias).length === 0) fail("set-species-stats needs at least one stat flag.");
  if (!content.speciesOverrides.includes(existing)) content.speciesOverrides.push(existing);
  const failures = await validateContent(content);
  if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
  await writeContent(content);
  console.log(`Updated species stats for '${id}'.`);
};

const parseCsv = (value, label) => {
  if (!value || value === "true") fail(`Missing required --${label}.`);
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const pickSpawnZoneIds = (scene, args) => {
  const selector = args.zones ?? "all";
  if (selector === "all") {
    return new Set(scene.encounterZones.map((zone) => zone.id));
  }
  if (selector === "attuned") {
    const element = requireText(args, "element");
    return new Set(
      scene.encounterZones
        .filter((zone) => zone.attunementElement === element)
        .map((zone) => zone.id),
    );
  }
  return new Set(parseCsv(selector, "zones"));
};

const formatSpawnEntry = (entry, speciesElements) => {
  const element = speciesElements.get(entry.speciesId) ?? "unknown";
  return `${entry.speciesId}(${element}) w${entry.weight}`;
};

const listSpawns = async (args) => {
  const config = await readSceneGeometryConfig();
  const speciesElements = await getKnownSpeciesElements();
  const sceneFilter = args.scene;
  const elementFilter = args.element;
  if (elementFilter && !ELEMENTS.has(elementFilter)) fail(`--element must be one of ${[...ELEMENTS].join(", ")}.`);
  for (const [sceneId, scene] of Object.entries(config.scenes ?? {})) {
    if (sceneFilter && sceneId !== sceneFilter) continue;
    const zones = scene.encounterZones ?? [];
    if (zones.length === 0) continue;
    const lines = [];
    for (const zone of zones) {
      const table = zone.encounterTable ?? [];
      const matchingTable = elementFilter
        ? table.filter((entry) => speciesElements.get(entry.speciesId) === elementFilter)
        : table;
      if (elementFilter && matchingTable.length === 0 && zone.attunementElement !== elementFilter) continue;
      lines.push(
        `- ${zone.id}: ${zone.biome}, attune ${zone.attunementElement ?? "none"}, Lv ${zone.levelRange?.[0] ?? "?"}-${zone.levelRange?.[1] ?? "?"}, ${matchingTable.map((entry) => formatSpawnEntry(entry, speciesElements)).join(", ") || "no matching spawns"}`,
      );
    }
    if (lines.length > 0) {
      console.log(`${sceneId}:`);
      for (const line of lines) console.log(line);
    }
  }
};

const sprinkleSpawns = async (args) => {
  const content = await readContent();
  const config = await readSceneGeometryConfig();
  const speciesElements = await getKnownSpeciesElements(content);
  const sceneIds = parseCsv(args.scenes, "scenes");
  const mode = args.mode ?? "add";
  if (!["add", "set"].includes(mode)) fail("--mode must be add or set.");
  const weight = toNumber(args.weight, "weight");
  if (!(weight > 0)) fail("--weight must be above 0.");
  const element = args.element;
  if (element && !ELEMENTS.has(element)) fail(`--element must be one of ${[...ELEMENTS].join(", ")}.`);
  const speciesIds = args.species
    ? parseCsv(args.species, "species")
    : [...speciesElements.entries()].filter(([, speciesElement]) => speciesElement === element).map(([speciesId]) => speciesId);
  if (speciesIds.length === 0) fail("No species selected. Provide --species or an --element with known species.");
  for (const speciesId of speciesIds) {
    if (!speciesElements.has(speciesId)) fail(`Unknown species '${speciesId}'.`);
    if (element && speciesElements.get(speciesId) !== element) {
      fail(`Species '${speciesId}' is ${speciesElements.get(speciesId)}, not ${element}.`);
    }
  }
  const replaceElement = args["replace-element"];
  if (replaceElement && !ELEMENTS.has(replaceElement)) fail(`--replace-element must be one of ${[...ELEMENTS].join(", ")}.`);
  const levelMin = toOptionalNumber(args["level-min"], "level-min");
  const levelMax = toOptionalNumber(args["level-max"], "level-max");
  if ((levelMin === undefined) !== (levelMax === undefined)) fail("Use --level-min and --level-max together.");
  if (levelMin !== undefined && (!(levelMin > 0) || !(levelMax >= levelMin))) {
    fail("--level-min/--level-max must be positive and ordered.");
  }

  const touched = [];
  for (const sceneId of sceneIds) {
    const scene = config.scenes?.[sceneId];
    if (!scene) fail(`Unknown scene '${sceneId}' in ${path.relative(projectRoot, sceneGeometryConfigPath)}.`);
    const zoneIds = pickSpawnZoneIds(scene, args);
    for (const zone of scene.encounterZones ?? []) {
      if (!zoneIds.has(zone.id)) continue;
      if (mode === "set") {
        zone.encounterTable = [];
      } else if (replaceElement) {
        zone.encounterTable = (zone.encounterTable ?? []).filter(
          (entry) => speciesElements.get(entry.speciesId) !== replaceElement,
        );
      }
      for (const speciesId of speciesIds) {
        const existing = (zone.encounterTable ?? []).find((entry) => entry.speciesId === speciesId);
        if (existing) {
          existing.weight = weight;
        } else {
          zone.encounterTable ??= [];
          zone.encounterTable.push({ speciesId, weight });
        }
      }
      zone.encounterTable.sort((a, b) => a.speciesId.localeCompare(b.speciesId));
      if (levelMin !== undefined) {
        zone.levelRange = [levelMin, levelMax];
      }
      touched.push(`${sceneId}.${zone.id}`);
    }
  }
  if (touched.length === 0) fail("No encounter zones matched the requested scenes/zones.");
  if (args["dry-run"] === "true") {
    console.log(`Would update ${touched.length} encounter zone${touched.length === 1 ? "" : "s"}:`);
    for (const zoneId of touched) console.log(`- ${zoneId}`);
    return;
  }
  await writeSceneGeometryConfig(config);
  console.log(`Updated ${touched.length} encounter zone${touched.length === 1 ? "" : "s"} in ${path.relative(projectRoot, sceneGeometryConfigPath)}.`);
};

const listContent = async () => {
  const content = await readContent();
  console.log(`Configured assets (${(content.assets ?? []).length}):`);
  for (const asset of content.assets ?? []) {
    console.log(`- ${asset.id}: ${asset.kind} ${asset.path}`);
  }
  console.log(`Configured species (${(content.species ?? []).length}):`);
  for (const species of content.species ?? []) {
    console.log(`- ${species.id}: ${species.name} (${species.element})`);
  }
  console.log(`Species stat overrides (${(content.speciesOverrides ?? []).length}):`);
  for (const override of content.speciesOverrides ?? []) {
    console.log(`- ${override.id}: ${Object.entries(override.statBias ?? {}).map(([stat, value]) => `${stat} ${value}`).join(", ")}`);
  }
  console.log(`Configured moves (${content.moves.length}):`);
  for (const move of content.moves) {
    console.log(`- ${move.id}: ${move.name} (${move.element} ${move.kind})`);
  }
  console.log(`Configured items (${content.items.length}):`);
  for (const item of content.items) {
    console.log(`- ${item.id}: ${item.name} (${item.category})`);
  }
};

const main = async () => {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (!command || command === "help" || command === "--help") {
    console.log(usage);
    return;
  }

  if (command === "add-move") return addMove(args);
  if (command === "add-item") return addItem(args);
  if (command === "add-potion") return addPotion(args);
  if (command === "add-asset") return addAsset(args);
  if (command === "assign-asset") return assignAsset(args);
  if (command === "add-species") return addSpecies(args);
  if (command === "set-species-stats") return setSpeciesStats(args);
  if (command === "list-spawns") return listSpawns(args);
  if (command === "sprinkle-spawns") return sprinkleSpawns(args);
  if (command === "list") return listContent();
  if (command === "validate") {
    const failures = await validateContent(await readContent());
    if (failures.length > 0) fail(`Content validation failed:\n- ${failures.join("\n- ")}`);
    console.log("Content validation passed.");
    return;
  }

  fail(`Unknown command '${command}'.\n\n${usage}`);
};

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
