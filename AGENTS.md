# Anima Codex

This project is a long-running agentic game build inside the 2D game engine workspace.

## Game Identity

- Working title: `Anima Codex`
- Slug: `anima-codex`
- Core fantasy: `rescue, raise, transform, battle, and bond with engineered lifeforms in a beautiful painted world where the government is confiscating them`
- Primary loop: `walk through connected painted scenes, enter habitat encounter zones, capture and train Vivos, level them, learn attacks, evolve or elementalize them, defeat 10 gyms, and challenge the league`

## Product Target

`Anima Codex` is intended to become a premium Steam-quality creature RPG. It should play in the familiar creature-collector lineage while building its own identity around engineered lifeforms, painted scene traversal, and an uncompromising art pipeline.

The game must not become a generic prototype with placeholder-feeling visuals. Art direction is a core mechanic of the product: every explored scene should feel like a composed illustration, every Vivo should feel deliberately designed, and the world should convince skeptical players that AI-assisted art can be cohesive, beautiful, and production-grade when controlled by a strict art bible.

## Design Pillars

- `Art first: use OpenAI imagegen as a core production workflow to create a cohesive, premium illustrated world that is an art masterclass`
- `Pokemon-like play: top-down exploration, random habitat encounters, 1v1 turn-based battles, six-Vivo roster, leveling, move learning, evolutions, type matchups, gyms, and league progression`
- `Painted scene traversal: every landscape is an amazing authored painting with walkable paths, screen-edge exits, collision masks, encounter zones, and scene-to-scene world travel`

## Non-Negotiables

- Use OpenAI imagegen deliberately for final art direction, concept art, painted scene backgrounds, Vivo concepts, field-guide plates, battle backdrops, and style exploration.
- Build toward a Beacon Pines-inspired storybook tone without cloning its exact assets, characters, compositions, or UI.
- Keep the world top-down and scene-based: the player walks through authored painted environments and exits through screen edges, doors, paths, bridges, cave mouths, town gates, and other image-authored transitions.
- Preserve Pokemon-like fundamentals: wild encounter zones, 1v1 turn-based battles, six active party slots, levels up to 100, move learning, evolutions, type matchups, 10 gyms, and a final league.
- Let Vivos transform through environmental exposure and training history. A neutral Vivo can become fire, water, electric, grass, and other traditional elemental forms through where it lives, what it survives, and how it battles.
- Treat Dogemox as the first starter species and proof of the form system. It should support breed/form variants over time rather than being only one fixed dog creature.
- Include dialogue and narrated dialogue as a product pillar. Early text-to-speech can be rough, but the long-term target is strong AI voiceover.

## Art Direction

Primary direction: cozy biotech storybook.

Reference feel:
- Beacon Pines-inspired illustrated staging, cute unease, and storybook readability.
- Spiritfarer-like warmth and emotional softness where useful.
- Wytchwood-like storybook texture where useful.
- Naturalist field-guide presentation for Vivos and engineered-life lore.

Avoid:
- Pixel art as the final style.
- Generic mobile-game gloss.
- Photorealism.
- Noisy AI detail that makes gameplay unreadable.
- Direct copying of Pokemon, Beacon Pines, or any other game's assets, characters, creature silhouettes, maps, or UI.

Each scene should be beautiful as a standalone painting and authored like a game board. Store walkable regions, collision, exits, encounter zones, NPC markers, and interactables separately from the background image.

## Animal Design Intent

Vivos may be inspired by familiar animals, but they must never read as ordinary pets with an element pasted on. The animal is the ancestry signal, not the whole design.

Every animal-inspired Vivo should communicate three things at once:

- It is young, bondable, and worth protecting.
- It has engineered or elemental biology that makes it more than a normal animal.
- It carries visible dangerous potential that will need guidance as it grows.

Baby and juvenile forms can be small and emotionally readable, but they should not be smiling mascot pets or harmless household animals. They should look serious, alert, uncanny, guarded, hungry, watchful, or barely-contained. A baby canine should already suggest future mass, bite force, heat, guarding instinct, or difficult strength. A small feline should make the player wonder what is behind the eyes: panther, tiger, shadow predator, or something stranger. A bird should imply future talons, speed, omen-like intelligence, or sky control. A grazing creature should still suggest weight, horns, charge power, spores, toxins, armor, or territorial force.

Use posture, eye shape, brow angle, limb weight, claws, teeth, shoulders, horns, tails, markings, elemental organs, and behavior cues to show future danger. The desired feeling is: "This creature is young and bondable, but it is not safe by default. It will become powerful, and the player's job is to bond with it, guide it, and help it become free without becoming a weapon for the wrong people."

Avoid:
- Normal dog/cat/bird/cow designs with only a glow, flame, leaf, or color swap.
- Plush-toy mascots with no implied adult power.
- Designs that feel like harmless household pets.
- Big cheerful smiles that make the creature read as a friendly cartoon pet rather than a dangerous young lifeform.
- Overly edgy monsters that lose the bondable creature-RPG appeal.

The sweet spot is companion plus future threat: creature lines should feel bondable and commercially appealing, while still making players believe the government fears what free Vivos may become.

## World And Story

People now raise, study, battle, and bond with engineered lifeforms called Vivos. The government no longer trusts citizens with them and is confiscating them. The player saves one Vivo, begins a journey, and works toward freeing Vivos by defeating the 10 gyms and eventually challenging the league.

Use the darker premise carefully. The game can include confiscation, fear, and institutional pressure, but it should also provide beauty, bonding, rescue, sanctuary, and wonder.

## First Playable Target

The first playable must let the player:

- Start with Dogemox.
- Traverse multiple painted top-down scenes.
- Move between scenes through authored exits.
- Walk through grass and other encounter zones.
- Enter random wild Vivo battles.
- Capture or rescue wild Vivos.
- Maintain a six-Vivo active roster.
- Level Vivos.
- Learn stronger attacks by level.
- Trigger at least one evolution or elemental form change.
- Use emergent battle strategy to beat a challenging first gym.

## Local Rules

- Keep work contained inside this project folder.
- Favor player-facing improvements. This does not mean UI work. It means making gameplay verbs more playable: stronger combat feedback, attacks and interactions that do more, clearer reactions, better traversal feel, and more believable consequences in moment-to-moment play.
- Do not default to HUD, menu, overlay, or interface polish unless a directive explicitly asks for UI or the gameplay slice is blocked without it.
- Use directives to shape the game over multiple runs.
- Avoid feature drift that breaks the core fantasy.
- Use Game Studio workflows when they help planning, implementation, or playtesting.
- Use the imagegen skill whenever the work involves generated bitmap art, concept art, scene paintings, creature plates, or visual style exploration.
- Before generating production assets, update or consult `docs/art_direction.md`.
- Before changing core systems, update or consult `docs/game_spec.md`.

## Current State

This project has been scaffolded and customized from the first product intake. It still needs the initial implementation stack, strict art bible, and first playable vertical slice.

## Agent Surfaces

- Project wiki: [wiki/README.md](wiki/README.md)
- Game spec: [docs/game_spec.md](docs/game_spec.md)
- Art direction: [docs/art_direction.md](docs/art_direction.md)
- Scene art requirements: [docs/scene_art_requirements.md](docs/scene_art_requirements.md)
- Biome and scene roadmap: [docs/biome_roadmap.md](docs/biome_roadmap.md)
- Species registry: [docs/species_registry.md](docs/species_registry.md)
- Agent content CLI manual: [docs/agent_content_cli.md](docs/agent_content_cli.md)
- Automation prompt draft: [docs/automation_prompt.md](docs/automation_prompt.md)
- After code changes, update and maintain the wiki so future agents have current documentation.
- Before generating or integrating exploration scene images or fight-scene backdrops, consult [docs/scene_art_requirements.md](docs/scene_art_requirements.md) for dimensions, style, separate-file pairing, and same-place landmark rules.
- When changing the content CLI, authored content config schema, item fields, move fields, or content validation rules, update [docs/agent_content_cli.md](docs/agent_content_cli.md) in the same change.
