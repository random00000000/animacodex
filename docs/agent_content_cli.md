# Anima Codex Agent Content CLI

This manual is for future agents adding configurable gameplay content. Keep it updated whenever `scripts/anima-content-cli.mjs`, `src/game/data/authoredContent.json`, move fields, item fields, or validation rules change.

## Purpose

Use the content CLI when adding simple data-driven content:

- attacks / moves
- items
- potions
- capture tools
- future battle-use consumables
- configured image assets copied into `public/content-assets`
- portrait and battle-backdrop assignments
- new data-authored Vivo species
- stat tuning overrides for existing or configured Vivos
- fast encounter spawn balancing across authored scene zones

The CLI writes `src/game/data/authoredContent.json`. Runtime data modules merge that config into the game:

- configured moves are merged into `moveDex` from `src/game/data/moves.ts`
- configured items are exposed through `itemDex` from `src/game/data/items.ts`
- configured species are merged into `speciesDex` from `src/game/data/species.ts`
- configured asset records are merged into the manifests in `src/game/data/assets.ts`
- portrait assignments update `creaturePortraitBySpeciesId` / `creaturePortraitByFormName`
- battle-backdrop assignments update `battleBackdropBySceneId`
- spawn balancing commands write `public/config/scene-geometry-overrides.json`, which the game already loads for live encounter zones
- the Vivo admin registry reads the same move and item data for audits

For scenes, trainers, maps, geometry, encounter zones, or complex battle mechanics, edit the relevant TypeScript/data files directly and update this manual only if the CLI begins to manage those surfaces.

## Commands

Run commands from the project root.

```bash
npm run content -- list
npm run content -- validate
```

Add an attack:

```bash
npm run content -- add-move --id emberNeedle --name "Ember Needle" --element fire --kind attack --attack-style impact --power 16 --accuracy 0.9 --description "A quick heated jab for early fire forms."
```

Add a support move:

```bash
npm run content -- add-move --id mossCover --name "Moss Cover" --element grass --kind support --support guard --shield 0.58 --priority 1 --description "A soft moss guard braces the user before the next hit."
```

Add a potion:

```bash
npm run content -- add-potion --id smallPoultice --name "Small Poultice" --hp 20 --description "Restores 20 HP during route testing."
```

Add a capture item:

```bash
npm run content -- add-item --id steadyCapsule --name "Steady Capsule" --category capture --capture-modifier 1.15 --description "A calmer rescue capsule with a modest capture bonus."
```

Copy and register a generated portrait image, then assign it to a species:

```bash
npm run content -- add-asset --id duskcalfPortraitV1 --kind portrait --file docs/generated/duskcalf.png --assign-species duskcalf
```

Copy and register a battle backdrop, then assign it to an existing scene:

```bash
npm run content -- add-asset --id moonfenDuskBattleV1 --kind battle --file docs/generated/moonfen-dusk-battle.png --assign-scene moonfenMarsh
```

Assign an already configured asset:

```bash
npm run content -- assign-asset --asset duskcalfPortraitV1 --species duskcalf
npm run content -- assign-asset --asset moonfenDuskBattleV1 --scene moonfenMarsh
```

Add a new data-authored Vivo species:

```bash
npm run content -- add-species --id duskcalf --name "Duskcalf" --registry-name "Umbra Bubalus" --element shadow --wild-disposition wary --trait-id sanctuaryHeart --trait-name "Dusk Weight" --trait-summary "The first hard hit makes it plant its hooves and brace instead of bolting." --primary "#4b5364" --secondary "#252936" --glow "#b8a6ff" --hp 5 --attack 4 --defense 5 --focus 3 --speed 2 --learnset tackle:1,guardHowl:3
```

Tune stats on an existing or configured Vivo:

```bash
npm run content -- set-species-stats --id dogemox --hp 6 --attack 6 --defense 4 --focus 3 --speed 4
```

List current spawn tables for one scene:

```bash
npm run content -- list-spawns --scene moonfenMarsh
```

Find scenes or zones that already carry, or are attuned for, a specific element:

```bash
npm run content -- list-spawns --element fire
```

Preview a balancing sprinkle before writing:

```bash
npm run content -- sprinkle-spawns --scenes sanctuaryTrail,emberHollow --element fire --species cinderhoof --zones attuned --weight 4 --level-min 4 --level-max 6 --dry-run
```

Apply the same sprinkle after reviewing the matched zones:

```bash
npm run content -- sprinkle-spawns --scenes sanctuaryTrail,emberHollow --element fire --species cinderhoof --zones attuned --weight 4 --level-min 4 --level-max 6
```

## Move Fields

Required:

- `id`: lower camelCase, unique across built-in and configured moves
- `name`
- `element`: `neutral`, `electric`, `fire`, `grass`, `ice`, `light`, `shadow`, `steel`, `stone`, or `water`
- `kind`: `attack` or `support`
- `description`

Attack-only:

- `attackStyle`: `impact` or `focus`
- `power`: positive number recommended
- `accuracy`: `0` through `1`

Support options:

- `--support guard --shield <number>` creates a self guard multiplier
- `--support focus --focus <number>` creates a self focus multiplier
- `--support expose --expose <number>` creates a foe exposure multiplier

## Item Fields

Required:

- `id`: lower camelCase
- `name`
- `category`: `healing`, `capture`, `battle`, or `key`
- `description`

Battle-use options:

- healing item: `--hp <number>`
- capture item: `--capture-modifier <number>`
- calm item: `--calm-modifier <number>`

Items are data-authored now. Only items already wired into battle systems will have player-facing effects. When adding a new item behavior, update `src/game/data/items.ts`, the battle systems that consume it, the CLI validation rules, and this manual.

## Asset Fields

Use `add-asset` for image files that should be available without TypeScript imports.

Required:

- `id`: lower camelCase, unique across configured assets
- `kind`: `scene`, `battle`, or `portrait`
- `file`: path to a local `.png`, `.jpg`, `.jpeg`, or `.webp`

Behavior:

- The CLI copies the file into `public/content-assets/<kind>/<id>.<ext>`.
- The authored config stores a browser path such as `/content-assets/portrait/duskcalfPortraitV1.png`.
- `scene` assets are registered in `sceneArtManifest`, but assigning them to scene `backgroundArtKey` still requires editing scene data.
- `battle` assets can be assigned with `--assign-scene <sceneId>` or later with `assign-asset --scene <sceneId>`.
- `portrait` assets can be assigned with `--assign-species <speciesId>`, `--assign-form <formName>`, or later with `assign-asset`.

## Species Fields

Use `add-species` for simple data-authored Vivos whose behavior can be expressed with existing battle traits and moves.

Required:

- `id`: lower camelCase, unique across built-in and configured species
- `name`
- `registry-name`
- `element`: any legal element listed under Move Fields
- `trait-id`: one existing battle trait id: `sanctuaryHeart`, `rootedShelter`, `prismEcho`, `cutlineRush`, `stillwaterLungs`, or `ironDefiance`
- `trait-name`
- `trait-summary`
- `hp`, `attack`, `defense`, `focus`, `speed`: positive stat bias numbers
- `learnset`: comma-separated `moveId:level` pairs, and each move must exist as a built-in or configured move

Options:

- `--wild-disposition`: `steadfast`, `wary`, or `flighty`; default `wary`
- `--primary`, `--secondary`, `--glow`: six-digit colors such as `#7fb86a` or `0x7fb86a`
- `--portrait <assetId>`: assign a configured portrait asset while adding the species

Use `set-species-stats` when the goal is balancing an existing Vivo. It writes `speciesOverrides` instead of copying the whole species definition, so future TypeScript changes to learnsets, traits, or forms are not overwritten by a stale CLI record.

## Spawn Balancing

Use `list-spawns` and `sprinkle-spawns` for fast balancing passes when a request says to add specific elementals to key scenes.

`list-spawns` reads `public/config/scene-geometry-overrides.json` and prints scene encounter zones with biome, attunement element, level band, species, element, and weight.

`sprinkle-spawns` updates the same geometry override file. It does not move or resize zones; it only changes `encounterTable` entries and optionally the zone `levelRange`.

Required:

- `--scenes`: comma-separated scene ids
- either `--species`: comma-separated species ids, or `--element`: add all known species of that element
- `--weight`: spawn weight to set for each selected species

Options:

- `--zones all`: update every encounter zone in each scene; this is the default
- `--zones attuned`: update only zones whose `attunementElement` matches `--element`
- `--zones id1,id2`: update specific zone ids inside each selected scene
- `--mode add`: preserve other species and add or retune selected species; this is the default
- `--mode set`: replace each matched zone's encounter table with only the selected species
- `--replace-element <element>`: remove existing species of that element from matched zones before adding the selected species
- `--level-min` and `--level-max`: set the matched zone level band
- `--dry-run`: print matched zones without writing

Recommended balancing workflow:

1. Run `list-spawns --element <element>` to find holes or wrong-level elemental pressure.
2. Run `sprinkle-spawns ... --dry-run` to confirm the target zones.
3. Run the same command without `--dry-run`.
4. Run `npm run validate:scenes` because spawn balancing edits scene geometry config.
5. Run `npm run build`.

## Validation

Always run:

```bash
npm run validate:content
npm run validate:scenes
npm run build
```

`npm run build` already runs content validation before TypeScript and Vite build.

Validation checks:

- JSON config shape and version
- duplicate ids
- configured moves do not duplicate built-in move ids
- legal elements, move kinds, attack styles, support effect types, item categories, asset kinds, species traits, and wild dispositions
- numeric accuracy, power, healing, capture, and calm values
- asset paths stay under `/content-assets/`
- configured species do not duplicate built-in species ids
- species learnsets reference known built-in or configured move ids
- portrait assignments target portrait assets and known species when a species id is supplied
- battle assignments target battle assets and known scene ids

`validate:content` does not validate scene reachability. When using `sprinkle-spawns`, also run `npm run validate:scenes` because the command writes the scene geometry override file.

## Agent Workflow

1. Use the CLI for straightforward attacks, potions, capture items, and similar data-only additions.
2. Run `npm run content -- validate`.
3. If the new move should be learned by a CLI-authored Vivo, include it in `--learnset`; for built-in Vivos, either use a small direct TypeScript edit or extend the CLI intentionally.
4. If adding a portrait or battle image, use `add-asset` so the file is copied into `public/content-assets` and the manifest is updated through JSON.
5. If the new item should appear in battle or the field, wire it into the relevant system and document the behavior.
6. If changing spawn tables, run `npm run validate:scenes`.
7. Run `npm run build`.
8. Update `wiki/README.md` with what changed.
9. Update this manual whenever CLI behavior, config schema, or content validation changes.
