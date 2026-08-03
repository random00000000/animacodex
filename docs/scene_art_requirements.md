# Scene Art Requirements

This document locks the expected image style, dimensions, pairing rules, and deliverables for `Anima Codex` scene art.

Future agents must follow this before generating or integrating new exploration scenes or fight-scene backdrops.

The measurable camera bands, screen-space staging zones, prompt blocks, and
perspective QA score are locked in
[`docs/environment_perspective_standard.md`](environment_perspective_standard.md).
Use that template for every new generation or perspective correction.

## Required Asset Pair

Every combat-capable location needs two separate image files:

- Exploration scene painting: stored in `src/assets/environment`.
- Battle backdrop painting: stored in `src/assets/battle`.

Do not create a single two-panel concept sheet as the final game asset. Two-panel sheets are acceptable only for brainstorming. Runtime-ready work needs separate files so Phaser can load the walking scene and battle scene independently.

Recommended naming:

- `src/assets/environment/<scene-slug>-painted-v1.png`
- `src/assets/battle/<scene-slug>-battle-v1.png`

Example:

- `src/assets/environment/gloamrail-cut-painted-v1.png`
- `src/assets/battle/gloamrail-cut-battle-v1.png`

## Locked Dimensions

The runtime canvas is `960x640`, but source scene art should be larger.

Default production dimensions:

- Exploration paintings: `1536x1024`
- Battle backdrops: `1536x1024`

Existing battle backdrops may also use a wider `1672x941` format, but new scene pairs should default to `1536x1024` unless there is a specific composition reason to use the wider battle format.

Square `1254x1254` assets exist for a few interiors, but new outdoor route, biome, town, cave, marsh, lab, and overworld scenes should use `1536x1024`.

## Exploration Scene Camera

Exploration scene paintings must read as playable top-down boards.

Hard camera gate: use the 50–60° downward exploration band in
[`docs/environment_perspective_standard.md`](environment_perspective_standard.md);
"top-down" by itself is not a sufficient production prompt.

Use:

- Top-down or high three-quarter view.
- Clear walkable lanes.
- Screen-edge exits or visible door/path/cave/bridge transitions.
- Distinct collision masses such as walls, trees, rocks, buildings, water, rail edges, bramble walls, furniture, or machinery.
- Distinct encounter-zone visual language such as grass, reeds, frost grass, shadow grass, ash brush, cave floor, lab overgrowth, or electric runoff.
- Landmarks placed where runtime interactables, attunement points, trainers, or rescues can be authored.

Avoid:

- Low cinematic camera for walking scenes.
- Beautiful but unwalkable compositions.
- Tiny maze clutter that makes collision unreadable.
- Symmetrical decorative maps with no authored route logic.
- Text, labels, UI, logos, watermarks, or readable signage that imagegen may misspell.

## Battle Backdrop Camera

Battle backdrops must feel like the same place from a different perspective.

Hard camera gate: use the 10–18° downward battle band, upper-third vanishing area,
and fixed player/enemy staging zones in
[`docs/environment_perspective_standard.md`](environment_perspective_standard.md).
Reject any battle candidate that remains high three-quarter even when its style
and landmarks are otherwise correct.

Use:

- Lower, wider, more cinematic perspective.
- Clear foreground/player-side staging lane.
- Clear midground/enemy-side staging lane.
- Soft but readable background landmarks.
- Enough empty ground for creature portraits, hit reactions, HP plaques, command surfaces, and effects.
- Matching lighting, palette, and landmarks from the exploration painting.
- Matching authored time of day, weather, key-light direction, shadow softness,
  and dominant temperature. Unexplained day/night changes fail pair cohesion.

The battle view should not be a generic arena. It must preserve the location identity from the walking scene.

## Same-Place Landmark Rule

The exploration and battle images must share multiple unmistakable landmarks.

For every scene pair, define at least three shared landmarks before generation. The battle backdrop must include those same landmarks from its lower angle.

Examples:

- `Gloamrail Cut`: broken rail sleepers, bent signal post, amber patrol warning lamp, bramble trench walls, hidden sanctuary crawlspace.
- `Moonfen Marsh`: root bridge, silver reeds, lantern flowers, marsh watchtower, still pools.
- `Ember Hollow`: basalt columns, ember reeds, heat vents, vent shrine, cracked lava-lit stone.

If the battle backdrop could belong to a different location, regenerate or revise it.

## Style Lock

The style is premium cozy-biotech storybook.

Use:

- Painterly illustrated 2D game art.
- Beacon Pines-inspired storybook staging without copying assets, characters, UI, silhouettes, or exact compositions.
- Spiritfarer-like warmth where useful.
- Wytchwood-like texture where useful.
- Naturalist field-guide clarity for authored environmental details.
- Controlled detail and readable silhouettes.
- Soft, composed lighting with a clear gameplay path.
- Organic engineered-life cues: lantern glands, prism glass, living roots, conductive vines, frost organs, containment glass, mineral growths, and other biological-world details.

Avoid:

- Pixel art.
- Photorealism.
- Generic mobile-game gloss.
- Overly sharp hard sci-fi machinery unless the scene is explicitly a lab or civic facility.
- Noisy AI detail that hides traversal or encounter zones.
- Direct copying of any existing game.
- In-image text, labels, logos, UI, or watermarks.

## Scene Packet Before Generation

Before generating production art, define the scene packet:

- Scene id and display name.
- Biome and elemental pressure.
- Exploration painting landmarks.
- Battle backdrop landmarks.
- Walkable route shape.
- Collision masses.
- Exits and target scenes.
- Encounter zones and likely native Vivos.
- Interactables, attunement landmarks, trainers, rescues, or recovery points.
- Battlefield condition idea.
- Why the player explores this place.

Use `docs/biome_roadmap.md` when choosing future biome scenes.

## Integration Checklist

When adding a new production scene pair:

1. Generate the exploration painting as its own image.
2. Generate the battle backdrop as its own image.
3. Copy final assets into `src/assets/environment` and `src/assets/battle`.
4. Register both assets in `src/game/data/assets.ts`.
5. Add or update scene metadata in `src/game/data/scenes.ts`.
6. Author collision, exits, encounter zones, interactables, trainers, and battle condition.
7. Verify the exploration image appears in the world scene.
8. Verify wild or trainer battles in that scene use the matching battle backdrop.
9. Update `docs/art_direction.md`, `docs/biome_roadmap.md` if needed, and `wiki/README.md`.

## Prompt Requirements

Every imagegen prompt for scene assets must include:

- Intended game use: exploration scene or battle backdrop.
- Exact target dimension expectation: `1536x1024`.
- Camera: top-down/high three-quarter for exploration, lower cinematic angle for battle.
- Scene id/name and biome.
- Shared landmarks.
- Style lock: premium cozy-biotech storybook, painted 2D game art.
- Readability requirements.
- Avoid list: no text, no UI, no logo, no watermark, no pixel art, no photorealism, no generic mobile gloss.

For paired assets, generate the exploration image first, then generate the battle backdrop using the same landmark list and a prompt that explicitly says it is the same place from a lower battle perspective.

