# Automation Notes

Use this file for project-specific automation guidance that should persist across recurring runs.

## Early Target

`start with Dogemox, explore early painted scenes, capture wild Vivos, level up, learn stronger attacks, trigger at least one evolution or elemental form change, and beat a challenging first gym through emergent battle strategy`

## Current Automation Focus

- Build toward a first playable where the player can beat the first gym through capturing, leveling, move learning, switching, elemental advantages, and at least one evolution or elemental form change.
- Keep the game playable at all times. Movement, scene transitions, encounter triggering, battle entry, attack selection, turn resolution, progress rewards, and return-to-exploration flow are mandatory before broadening scope.
- Prioritize gameplay verbs, battle depth, traversal readability, encounter tuning, capture flow, leveling, move learning, and scene-to-scene exploration over decorative UI polish unless UI is required to make the slice playable.
- Validate progress through playtesting when useful.
- Record durable decisions in `docs/`.

## Project-Specific Constraints

- Art is not a skin. The project should be developed as an art-driven Steam product, using the Codex `imagegen` skill rather than direct OpenAI API calls, plus a strict art bible to make every scene and Vivo feel cohesive and premium.
- Use painted top-down scene traversal instead of tilemap-first world construction unless a later decision explicitly changes this. Each scene needs a background image, walkable mask, collision, exits, encounter zones, NPC markers, and interactables.
- New scene art and wiring: the game goal is 60 walkable, combat-capable painted scenes, and automation runs should steadily move the project toward that target. When adding a scene, create the full AI art set in one coordinated batch: the traversable exploration painting plus its matching battle background from another angle, then wire both into gameplay with walk masks, collision, exits, encounter zones, native creatures, interactables, and readable reasons to explore.
- New elemental creature art and wiring: the game goal is 150 obtainable creatures/forms, and automation runs should steadily move the project toward that target, starting with about 20 strong early elemental lines including Dogemox, Lumen Corvus, and Ignis Canis. When adding a creature line, create the full AI art set in one coordinated batch: one image for each planned evolution or form stage, usually baby/juvenile, middle, and optional final form, then wire the line into encounters, capture/rescue, roster use, leveling, move learning, evolutions, elemental transformations, and battle roles. Animal-inspired Vivos must look threatening or full of dangerous potential even as babies; they should not smile or read as harmless pets, and should imply future mass, predatory power, elemental danger, or the need for guidance.
- Do not let art generation or documentation replace core playability. A development run should preserve or improve the ability to move and fight.
- Gameplay should remain Pokemon-like in the first version: 1v1 turn-based battles, six active Vivos, wild random encounters, levels, attacks, move learning, evolutions, type matchups, gyms, and league progression.
- Use traditional elements for readability. Elemental transformation should emerge from exposure, training, environment, and battle history.
- Keep all project files, art specs, generated assets, and experiments inside this project folder.

## Recommended Run Order

1. Read `AGENTS.md`, `DIRECTIVES.md`, `docs/game_spec.md`, `docs/art_direction.md`, and `docs/species_registry.md`.
2. If the task touches art, use the imagegen skill and update `docs/art_direction.md` with any locked style rules before generating more assets.
3. If the task touches core architecture, use Game Studio foundations and keep simulation state separate from rendering.
4. For implementation, prefer a Phaser, TypeScript, and Vite path unless a later decision replaces the runtime.
5. For verification, run the game and capture a screenshot of the visible result whenever possible.
