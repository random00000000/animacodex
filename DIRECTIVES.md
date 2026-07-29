# Directives

These directives shape development over time. They are not required to be completed in a single run.

## Critical Directives

- Keep the game playable at all times. Prioritize an end-to-end playable loop where the player can move through scenes, transition between areas, trigger encounters, enter fights, choose attacks, resolve turns, gain progress, and return to exploration; do not let art generation or documentation work replace movement and combat functionality.
- Create and integrate actual AI art through the Codex `imagegen` skill, not by calling the OpenAI API directly. If a scene is represented by one whole AI-generated picture, use the Codex `imagegen` skill to produce the scene image, then wire it into traversal, collision, exits, and encounter-zone metadata instead of leaving placeholder art.
- Make this a Steam-quality product direction, not a throwaway prototype. Every system should build toward a premium creature RPG that can be marketed through art, exploration, battling, and rescue fantasy.
- Treat art as the first product pillar. Use the Codex `imagegen` skill through a strict art-bible workflow to create a cohesive, amazing, Beacon Pines-inspired storybook world; do not accept generic placeholder-style visuals as the target, and do not use direct OpenAI API image calls.
- Preserve Pokemon-like play fundamentals: top-down exploration, random habitat encounters, 1v1 turn-based battles, six-Vivo active roster, leveling, move learning, evolutions, elemental type matchups, 10 gyms, and final league progression.
- Build the first playable around beating the first gym by capturing Vivos, leveling them, learning better attacks, evolving or elementalizing at least one Vivo, and discovering emergent battle strategies.
- New scene art and wiring: the game goal is 60 walkable, combat-capable painted scenes, and automation runs should steadily move the project toward that target. Scenes should span varied biomes such as caves, ice, overgrown green routes, flower fields, water routes, mineral places, luminous magic areas, cursed places, labs, ruins, towns, sanctuaries, and gyms. When adding a scene, create the full AI art set in one coordinated batch: the traversable exploration painting plus its matching battle background from another angle, then wire both into gameplay with walk masks, collision, exits, encounter zones, native creatures, interactables, and readable reasons to explore.

## Moderate Directives

- New elemental creature art and wiring: the game goal is 150 obtainable creatures/forms, and automation runs should steadily move the project toward that target, starting with about 20 strong early elemental lines including Dogemox, Lumen Corvus, and Ignis Canis. When adding a creature line, create the full AI art set in one coordinated batch: one image for each planned evolution or form stage, usually baby/juvenile, middle, and optional final form, then wire the line into encounters, capture/rescue, roster use, leveling, move learning, evolutions, elemental transformations, and battle roles. Animal-inspired Vivos must look threatening or full of dangerous potential even as babies; they should not smile or read as harmless pets, and should imply future mass, predatory power, elemental danger, or the need for guidance.

## Notes

- Add new directives here as the user clarifies the game.
- Keep directives durable and product-shaping, not task-sized.
