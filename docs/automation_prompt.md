# Automation Prompt Draft

This is an automated development workflow for `Anima Codex`.

Project folder: `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex`

WARNING: This is a recurring automation. As the final step of each run, use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger this automation again, then verify it started before ending the run.

Use [@game-studio](plugin://game-studio@openai-curated) for game-development workflows.

Use [$imagegen](C:\Users\Javier\.codex\skills\.system\imagegen\SKILL.md) whenever the work involves generated bitmap art, concept art, painted scene backgrounds, Vivo concepts, field-guide plates, or visual style exploration.

## Product Direction

Read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\AGENTS.md` first. That file is the source of truth for the game vision, constraints, and execution rules.

Then read `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\DIRECTIVES.md`. Treat directives as the current product-shaping instructions from the developer.

Then read:

- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\AUTOMATION.md`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\docs\game_spec.md`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\docs\art_direction.md`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\docs\species_registry.md`
- `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex\docs\decision_making_document.md`

## Operating Rules

- This is a Steam-quality, art-first creature RPG. Do not treat art as placeholder garnish.
- Use the Codex `imagegen` skill for art direction and asset generation tasks; do not call the OpenAI API directly for image generation.
- New scene art and wiring: the game goal is 60 walkable, combat-capable painted scenes, and automation runs should steadily move the project toward that target. When adding a scene, create the full AI art set in one coordinated batch: the traversable exploration painting plus its matching battle background from another angle, then wire both into gameplay with walk masks, collision, exits, encounter zones, native creatures, interactables, and readable reasons to explore.
- New elemental creature art and wiring: the game goal is 150 obtainable creatures/forms, and automation runs should steadily move the project toward that target, starting with about 20 strong early elemental lines including Dogemox, Lumen Corvus, and Ignis Canis. When adding a creature line, create the full AI art set in one coordinated batch: one image for each planned evolution or form stage, usually baby/juvenile, middle, and optional final form, then wire the line into encounters, capture/rescue, roster use, leveling, move learning, evolutions, elemental transformations, and battle roles. Animal-inspired Vivos must look threatening or full of dangerous potential even as babies; they should not smile or read as harmless pets, and should imply future mass, predatory power, elemental danger, or the need for guidance.
- Keep the game playable at all times. Prioritize an end-to-end loop where the player can move through scenes, transition between areas, trigger encounters, enter fights, choose attacks, resolve turns, gain progress, and return to exploration.
- Do not let art generation or documentation work replace movement and combat functionality.
- Keep the game Pokemon-like in the first version: top-down exploration, random encounter zones, 1v1 turn-based battles, six active Vivos, leveling, move learning, evolutions, elemental type matchups, gyms, and league progression.
- Keep the world scene-based: the player walks through illustrated paintings and transitions between scenes through authored exits.
- Prioritize the first playable: Dogemox starter, early painted scenes, capture, leveling, move learning, evolution or elemental form change, and a challenging first gym.
- Prefer coherent, shippable progress over scattered experiments.
- Keep all project artifacts inside `C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex`.
- When useful, playtest and inspect the game visually before and after changes.
- Float decisions in the decision document when human input is needed.

## Workflow Steps

1. Read the project docs listed above.
2. Use [@game-studio](plugin://game-studio@openai-curated) for `Game Studio` workflow planning and early browser-game routing.
3. Use [$game-studio:web-game-foundations](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\web-game-foundations\SKILL.md) when architecture, engine choice, simulation boundaries, asset organization, save boundaries, or debug surfaces need to be clarified.
4. Use [$game-studio:phaser-2d-game](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\phaser-2d-game\SKILL.md) when implementing the 2D Phaser, TypeScript, and Vite gameplay slice.
5. Use [$game-studio:game-ui-frontend](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\game-ui-frontend\SKILL.md) only when UI is needed for the playable slice.
6. Use [$game-studio:sprite-pipeline](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\sprite-pipeline\SKILL.md) when character or Vivo sprite generation, normalization, or animation sheets are needed.
7. Use [$game-studio:game-playtest](C:\Users\Javier\.codex\plugins\cache\openai-curated\game-studio\2032fd0291961d866feca472adc8ed6a8cddafc6\skills\game-playtest\SKILL.md) when verification, frontend QA, or screenshot-based review would improve quality.
8. Use [$imagegen](C:\Users\Javier\.codex\skills\.system\imagegen\SKILL.md) for style boards, final scene paintings, Vivo concept sheets, battle backdrops, portraits, field-guide plates, and visual production tests.
9. Implement one or more cohesive improvements that directly advance active directives.
10. Update docs when a durable art, gameplay, architecture, or product decision changes.
11. Take a screenshot of visible work when possible and include it in the final output.
12. Use [$force-automation-run](C:\Users\Javier\.codex\skills\force-automation-run\SKILL.md) to trigger `Anima Codex Weekly Development` again and confirm it is running before ending the run.

## Schedule

Default schedule after the Codex project is manually added: Sunday at 9:00 AM local time.

When creating the automation, bind it to this exact project path:

`C:\Users\Javier\Desktop\CodexCLI\2d-game-engine\projects\anima-codex`
