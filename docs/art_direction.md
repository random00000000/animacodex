# Anima Codex Art Direction

## North Star

`Anima Codex` should be an art masterclass: a premium illustrated creature RPG where the world, creatures, UI, and story presentation are visually cohesive enough to challenge the assumption that AI-assisted art cannot be production-grade.

OpenAI imagegen is a core production workflow, not an optional concept-art toy.

## Primary Style

Beacon Pines-inspired cozy biotech storybook.

Use that as a directional reference for:

- Cute unease.
- Storybook staging.
- Rounded readable silhouettes.
- Beautiful illustrated scenes.
- Dark story pressure beneath a charming surface.

Do not clone Beacon Pines assets, characters, exact compositions, or UI.

## Supporting References

- Spiritfarer: warmth, emotional softness, character appeal.
- Wytchwood: storybook texture and shape language.
- Naturalist field guides: Vivo documentation, creature plates, lore framing.
- Premium illustrated board-game art: polished portraits, icons, and field-guide presentation.

## Visual Rules

- No pixel art as the final style.
- No photorealism.
- No generic mobile-game gloss.
- No noisy AI detail that hurts readability.
- No direct copying of any existing game asset style.
- Every scene should read well as a full painting and as a navigable top-down game board.
- Every Vivo should be cute or beautiful first, engineered second.
- Every production Vivo or evolved form should ultimately have a paired transparent portrait set: a front three-quarter field-guide/enemy view and a matching rear three-quarter player-battle view. Preserve identity, proportions, markings, and organic organs across both angles so lower-left allies visibly face upper-right opponents instead of displaying a mirrored front plate.
- Before integrating any generated creature angle, explicitly count limbs and trace every visible leg or wing back to its anatomical attachment. Reject duplicated paws, central belly limbs, merged joints, or any silhouette whose anatomy cannot be explained by perspective.
- Vivos should show engineered biology through organic details: glowing glands, unusual fur patterns, translucent fins, petal organs, mineral growths, conductive feathers, horn structures, light organs, and other biological features.
- Avoid hard sci-fi armor and robot language unless a specific Vivo line calls for it.
- Most early Vivos should begin as baby or juvenile forms. Their silhouettes can be small and bondable, but every animal-inspired Vivo must still look threatening or full of dangerous potential.
- Avoid smiling, harmless pet-only designs. A baby dog should already imply it will grow into a massive powerful guardian that needs guidance; a cat should suggest something uncanny or predatory, such as future panther, tiger, or other dangerous lineage potential.
- Use posture, eyes, brow angle, proportions, claws, teeth, horns, shoulder mass, elemental organs, markings, and behavior cues to show future danger even in young forms.

## Application Icon Direction

The Windows application icon source is
[`build/anima-codex-icon-source-v1.png`](../build/anima-codex-icon-source-v1.png).
It combines Dogemox's alert head and dark ear silhouette with an open naturalist
codex and a living sprout/DNA glyph.

- Preserve the deep forest teal, parchment, ink brown, and restrained gold palette.
- Keep Dogemox vigilant and bondable, with a closed mouth and visible future strength.
- Prioritize the head, ears, amber eyes, and warm center glow at taskbar sizes.
- Do not add title text or fine decorative detail that disappears below 32px.

## Scene Art Model

Each scene is a full illustrated background with authored gameplay metadata.

Runtime-ready scene image requirements, including dimensions, file pairing, camera angles, and same-place landmark rules, are locked in [`docs/scene_art_requirements.md`](scene_art_requirements.md). Use that document before generating or integrating new exploration paintings or battle backdrops.

Version-specific certification progress is tracked in
[`docs/environment_pair_audit.md`](environment_pair_audit.md). Preserve pairs marked
`Certified`; regenerate only when a concrete camera, staging, continuity, style,
or geometry defect is documented.

When a playable scene is meant to be one whole AI-generated picture, use the imagegen skill to create the actual scene image and store it inside the project. Do not leave these scenes as abstract placeholders once implementation reaches that area.

Scene assets should eventually include:

- `background`
- `walk_mask`
- `collision_mask`
- `foreground_layers`
- `exit_markers`
- `encounter_zones`
- `npc_markers`
- `interactable_markers`

The player should walk through paintings and transition scene-to-scene through visible image-authored paths, screen corners, doors, caves, bridges, trails, and town gates.

Scene integration workflow:

1. Generate the full illustrated scene image with imagegen.
2. Move or copy the chosen image into the project asset folder.
3. Author or generate walkable and collision masks for that image.
4. Place exit markers where the picture visually implies paths, doors, corners, bridges, caves, or gates.
5. Place encounter-zone metadata over readable habitat regions such as grass, reeds, cave floors, or lab overgrowth.
6. Verify the player can walk through the image as a scene, not just view it as background art.

## Paired Exploration And Battle Art

Double down on the current strength: the fight scene should feel like the same place the player was just exploring, viewed from a more dramatic battle angle.

For every new combat-capable scene, prefer creating an art pair:

- Exploration painting: top-down or high three-quarter view, authored for walking, exits, collision, encounter zones, and interactables.
- Battle painting: same location from a lower, closer, more cinematic angle, authored for a readable 1v1 fight layout with foreground and enemy-side staging lanes.

Generate or plan these together when possible. They should share landmarks, palette, lighting, biome identity, and story details so the transition into combat feels grounded in the world instead of moving to a generic arena.

This paired-art approach is a core advantage of the imagegen workflow and should be used to extend the world with many beautiful locations.

Current production proof:

- `Briar Town` now uses a stored imagegen hub painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/briar-town-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/briar-town-painted-v1.png).
- Its gym frontage, sanctuary-ledger cottage, confiscation notice board, bridge entry, and east route gate are now rebound through authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts).
- Briar Town battles now use `src/assets/battle/briar-town-battle-v2.png`, a standardized `1536x1024` low-camera plaza view. It removes the legacy generic tent, vehicle, barricade, and watchtower, then carries the walking scene's creek bridge, green curved roofs, round-window civic hall, blank public notice board, sanctuary cottage, flower beds, autumn canopy, and amber caretaker lanterns into the fight view. The broad foreground plaza remains clear for player, enemy, and effect staging.
- `Sanctuary Trail` now uses a stored imagegen route painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/sanctuary-trail-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/sanctuary-trail-painted-v1.png).
- Its authored collision, exits, encounter patches, shrine marker, and trainer placement remain separate runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts).
- Early runtime rule update: production scene paintings should keep subtle metadata overlays during development so route tuning remains legible without hiding the art.
- Sanctuary Trail battles now use `src/assets/battle/sanctuary-trail-battle-v2.png`, a standardized `1536x1024` low-camera view of the exact habitat boundary. The walking scene's healthy green woodland, pale-golden seed grass, claw-split fallen root, mossy boulders, forked tan trail, ember shrubs, twisted boundary tree, dark stone shelf, and single caretaker lantern now frame the battle lanes instead of the legacy uniformly golden clearing and invented paired lamps.
- `Ember Hollow` now uses a stored imagegen hollow painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/ember-hollow-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/ember-hollow-painted-v1.png).
- Its route metadata was rebound so the west entry, upper basalt shelf, cinder-reed basin, warm-moss basin, vent shrine, and Ash Scout Iven align with the actual illustration instead of abstract blockout geometry.
- Ember Hollow battles now use `src/assets/battle/ember-hollow-battle-v2.png`, a standardized `1536x1024` low-camera view that carries the pale round-opening vent shrine, warm-leaved tree, olive moss, cinder reeds, heat-seamed basalt columns, and steaming shelf out of the exploration painting. The open lower-left and upper-right lanes follow the paired-camera template in `docs/environment_perspective_standard.md`; the legacy generic arena remains registered only for rollback.
- `Starglass Roost` now uses a stored imagegen observatory-route painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/starglass-roost-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/starglass-roost-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the observatory ring blocked, the silvergrass and lantern-reed patches readable, the cliff descent visible, and the prism telescope usable as a light-attunement landmark.
- Early scene-art rule addition: observatory or shrine scenes should place the attunement landmark where it is visually obvious from the main path so the growth route reads as authored environmental storytelling instead of an invisible system.
- Starglass Roost battles now use `src/assets/battle/starglass-roost-battle-v2.png`, a standardized `1536x1024` low-camera view of the exact observatory terrace. The walking scene's antique brass telescope, broken pale-stone dome ribs, dark crossbars, amber globe lamps, terrace steps, cliff bench, silvergrass, flowers, twisted tree, and blue-green ravine replace the legacy cold crystal-ring arena while preserving broad battle staging.
- `Briar Gym` now uses a stored imagegen adaptation-hall painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/briar-gym-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/briar-gym-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the south entrance, central carpet, left practice ring, right bench lane, and north leader dais aligned with the illustration so the first gym reads like a real navigable interior instead of a town-side battle token.
- Early interior-scene rule addition: gyms and civic interiors should preserve one obvious central travel lane from the entrance to the leader or service point, with side pockets reserved for trainers, benches, or interactables, so navigation stays readable even under painterly detail.
- Briar Gym battles now use `src/assets/battle/briar-gym-battle-v2.png`, a standardized `1536x1024` low-camera view of that exact adaptation hall. The long green carpet, separate left rope practice ring, asymmetric right bench-and-planter lane, compact chair dais, arched leaf-bud window, paired green banners, mossed stone, dark timber, vines, and amber lamps replace the legacy symmetrical wooden arena and oversized central floor circle.
- `Lantern Nursery` now uses a stored imagegen sanctuary-side prep painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/lantern-nursery-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/lantern-nursery-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the south town gate, east sanctuary crossing, moss-bed pens, lantern reeds, and central training ring readable as a low-pressure pre-gym board.
- Early nursery-scene rule addition: sanctuary prep areas should reserve one obvious circular or straight training lane where players can immediately understand how to spar, swap, and regroup before re-entering the harsher route scenes.
- Lantern Nursery battles now use `src/assets/battle/lantern-nursery-battle-v2.png`, a standardized `1536x1024` low-camera view of the exact working yard. The offset teal barrel-vault greenhouse, overlapping cream canvas care canopy, small moss training ring, irregular timber habitat pen, mossy hollow logs, shallow pool, glass cold frame, pale lantern reeds, split paths, amber-red caretaker lamps, and autumn enclosure replace the legacy symmetrical greenhouse arena and ornamental paired basins.
- `Glassroot Burrow` now uses a stored imagegen hidden-burrow painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/glassroot-burrow-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/glassroot-burrow-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the lower trail descent, central glassroot cradle, guarded upper stair, glow-pool habitats, and rootbed pockets readable as a cave-like rescue refuge instead of a generic dungeon room.
- Early burrow-scene rule addition: hidden cave or root-warren scenes should still preserve one wide central safety lane, with encounter pools and side pockets pushed outward so the area reads as a sanctuary hideaway first and a grind chamber second.
- `Moonfen Marsh`'s existing `moonfen-marsh-painted-v1.png` and `moonfen-marsh-battle-v1.png` pair is certified unchanged against the paired-camera standard. The high exploration board and low battle view share the watchtower, gnarled root bridges, turquoise still pools, silver reeds, warm lantern blooms, central moss lane, and plank crossings; both remain the active production assets.
- `Quartzroot Vault` now uses a stored imagegen cave-system painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/quartzroot-vault-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/quartzroot-vault-painted-v1.png).
- Quartzroot's existing `quartzroot-vault-battle-v1.png` is certified as the low-camera extension of the walking board. The heart-shaped quartz-root arch, turquoise pool, bronze lantern towers, cyan-violet crystal ledges, rope-bridge hints, fossilized roots, and stone paths recur without generic cave-arena additions.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the lower Glassroot entrance, looped stone path, quartz-root bridge, blue pool ledges, crystal chasms, heart-shaped root arch, bronze caretaker lantern, and Glassroot Burrow return aligned with the generated board.
- Early cave-system rule addition: large cave routes should feel more vertical and networked than burrow refuges, using ledges, bridges, chasms, mineral pools, and repeated crystal-root landmarks while preserving obvious walkable stone lanes.
- `Tideglass Grotto` now uses a stored imagegen water-cave painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/tideglass-grotto-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/tideglass-grotto-painted-v1.png).
- Tideglass Grotto's existing `tideglass-grotto-battle-v1.png` is certified as the low-camera extension of the walking board. The crescent tideglass fountain, turquoise pool, amber caretaker lanterns, crystal clusters, rope posts, wet masonry, and hanging cave growth remain unmistakably the same location.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the lower Quartzroot entrance, central stepping-stone causeway, crescent blue-glass waterfall arch, luminous pool, rope bridge, turquoise channel pockets, and Quartzroot Vault return aligned with the generated board.
- Early water-cave rule addition: flooded caves should read as water routes first and caves second, using reflective turquoise channels, slick stone shelves, visible safe stepping paths, warm lantern posts, and repeated waterfall or bridge landmarks so players can parse traversal under heavy visual detail.
- `Moonmilk Cavern` now uses a stored imagegen limestone healing-cave painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/moonmilk-cavern-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/moonmilk-cavern-painted-v1.png).
- Moonmilk Cavern's existing `moonmilk-cavern-battle-v1.png` is certified as the low-camera extension of the walking board. The central healing basin, dripping limestone curtains, blue fungi, crescent glass shelf, sanctuary waystone, amber lantern clusters, and pale stone floor preserve exact-place continuity.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Tideglass branch, central moonmilk basin, pale limestone shelf loop, white mineral curtains, soft blue fungi, glassy crescent shelf, caretaker lantern cluster, sanctuary waystone, and Tideglass return aligned with the generated board.
- Early moonmilk-cave rule addition: gentle healing caves should use pale limestone, milky water, soft fungi light, and wide quiet shelves so they feel ancient and restorative, not like horror caves or another high-saturation crystal biome.
- `Prismfall Cavern` now uses a stored imagegen crystal-cave painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/prismfall-cavern-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/prismfall-cavern-painted-v1.png).
- Prismfall Cavern's existing `prismfall-cavern-battle-v1.png` is certified as the low-camera extension of the walking board. The split rainbow spire and circular pool, glassroot bridge, bronze lantern, faceted floor, crystal clusters, and illuminated arched exit remain exact-place anchors.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the lower Quartzroot entrance, faceted crystal path, split rainbow spire, circular mirror pool, broken glassroot bridge, prismatic shelves, and Quartzroot Vault return aligned with the generated board.
- Early crystal-cave rule addition: prismatic caves should emphasize refraction, mirror pools, faceted walking surfaces, and readable crystal-wall collision, with one bold spire or prism landmark repeated between traversal and battle.
- `Prismfall Ravine` now uses a stored imagegen prismatic canyon painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/prismfall-ravine-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/prismfall-ravine-painted-v1.png).
- Prismfall Ravine's existing `prismfall-ravine-battle-v1.png` is certified as the low-camera extension of the walking board. The stacked prism waterfalls, rainbow mist, arched stone bridge, turquoise pool, caretaker posts, violet cliff walls, and moss-lined paths establish exact-place continuity.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Prismfall Cavern branch, stacked prism waterfall shelves, mist bridge, turquoise pool, moss-glass ledges, faceted cliff walls, and caretaker posts aligned with the generated board.
- Early prismatic-ravine rule addition: outdoor crystal canyon scenes should use waterfall direction, mist bridges, and glowing pools to make traversal readable, while repeating the strongest waterfall/crystal landmarks in battle so the location does not collapse into a generic crystal arena.
- `Echobloom Canopy` now uses a stored imagegen bioluminescent nature painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/echobloom-canopy-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/echobloom-canopy-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the lower Starglass entrance, living-root bridge, spiral-root tree, blue bell flowers, glowing pool, vine crossings, and Starglass Roost return aligned with the generated board.
- Early alien-nature rule addition: otherworldly forest scenes should feel original to Anima Codex by leaning on sanctuary waystones, caretaker lanterns, engineered listening roots, bond-responsive moss, and Vivo habitat logic instead of copying any specific external franchise ecology.
- `Lumenveil Grove` now uses a stored imagegen nocturnal bioluminescent forest painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/lumenveil-grove-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/lumenveil-grove-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Echobloom branch, teal glowmoss path, luminous root arch, mirror pool, giant blue mushrooms, violet spore pods, warm caretaker lanterns, sanctuary waystones, and Echobloom return aligned with the generated board.
- Early bioluminescent-forest rule addition: repeated glowing-forest biomes need a clear route identity; Lumenveil should read as nocturnal glowmoss, lantern fungi, and mirror-pool light rather than repeating Echobloom's spiral canopy and alien bellflower language.
- `Moonfen Marsh` now uses a stored imagegen wetland-refuge painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/moonfen-marsh-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/moonfen-marsh-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the left boardwalk return, central moss lane, silver-reed pools, lantern-bloom shallows, and stillwater recovery cot aligned with the painting so the marsh reads as a sanctuary calm-space rather than another generic combat route.
- Early wetland-scene rule addition: capture-friendly marsh or reed refuge scenes should preserve one obvious calm island or dry lane in the center, with reeds and shallow water wrapping the edges so the player immediately reads the biome as a place to settle frightened Vivos instead of only a place to grind.
- `Mirrorfen Flats` now uses a stored imagegen reflective-wetland painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/mirrorfen-flats-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/mirrorfen-flats-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the S-shaped mudflat path, crescent mirror pool, floating seed-pod islands, silver reed curtains, caretaker mirror post, upside-down tree silhouette, and Moonfen Marsh return aligned with the generated board.
- Early mirror-wetland rule addition: dreamlike or future-psychic wetlands should stay beautiful and readable first, using glass-still reflections, delayed lantern reflections, underwater silhouettes, and clean pale mudflat lanes instead of abstract visual noise.
- Mirrorfen's existing `mirrorfen-flats-battle-v1.png` is certified as the paired low-camera extension of the exploration board. It preserves the crescent pool, pale mudflat lane, seed-pod islands, silver reeds, amber mirror post, and submerged tree silhouette without introducing unrelated arena architecture.
- `Mireglass Swamp` now uses a stored imagegen blackwater-swamp painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/mireglass-swamp-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/mireglass-swamp-painted-v1.png).
- Mireglass's existing `mireglass-swamp-battle-v1.png` is certified as the low-camera extension of its walking board. The blackwater pool, mossy broken log bridge, cypress-root arch, lantern fungi, glassy algae mats, half-sunk sanctuary marker, and central mud lane recur without generic swamp-arena additions.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the crescent blackwater pool, mossy log bridge, blue-green lantern fungus, crooked cypress root arch, glassy algae mats, half-sunk sanctuary marker, and Moonfen Marsh return aligned with the generated board.
- Early swamp-scene rule addition: true swamp routes should feel heavier and more dangerous than calm marsh refuges, using blackwater, cypress knees, log crossings, algae sheen, and fungus light while preserving readable mud-island lanes.
- `Sunspindle Dunes` now uses a stored imagegen sand-dune painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/sunspindle-dunes-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/sunspindle-dunes-painted-v1.png).
- Sunspindle's existing `sunspindle-dunes-battle-v1.png` is certified as the low-camera extension of the walking board. The crescent fossil-root arch, amber heat-glass obelisk, blue shade awning, sandstone ribs, dry shelter grass, heat-glass crystal clusters, and packed-sand lane recur without generic coliseum additions.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the packed-sand S-lane, fossil-root arch, amber heat-glass obelisk, blue shade awning, dry grass shelters, heatglass dune pockets, and Ember Hollow return aligned with the generated board.
- Early desert-scene rule addition: sand biomes should avoid empty beige fields by using engineered landmarks, blue shade fabric, amber heat-glass, fossil-root ribs, dry grass pockets, and clear packed-sand lanes so the route reads as playable habitat rather than backdrop.
- `Redglass Saltpan` now uses a stored imagegen dried-lakebed painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/redglass-saltpan-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/redglass-saltpan-painted-v1.png).
- Redglass's existing `redglass-saltpan-battle-v1.png` is certified as the low-camera extension of its walking board. The cracked red mineral sheet, pink salt polygons, blue-white mirage seams, caretaker shade canopy, sanctuary waystone, red crystal clusters, and half-swallowed ruin arches recur without unrelated arena additions.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Sunspindle branch, central red-glass mineral crust, pink salt polygon flats, blue-white mirage pools, lower-left caretaker shade marker, half-swallowed ruin arches, and Sunspindle Dunes return aligned with the generated board.
- Early saltpan-scene rule addition: salt-desert variants should separate themselves from sand dunes by emphasizing cracked pink lakebed geometry, reflective mineral crust, mirage light veins, half-buried ruins, and clear pale walk lanes around bold glassy collision masses.
- `Thunderhead Mesa` now uses a stored imagegen storm-desert painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/thunderhead-mesa-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/thunderhead-mesa-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Sunspindle branch, central lightning rod array, wind-carved orange stone towers, dry stormgrass, charged dust lanes, blue ground veins, storm vane, sanctuary waystone, and Sunspindle Dunes return aligned with the generated board.
- Early storm-desert rule addition: electric desert scenes should contrast blue-white storm light against warm orange rock, using lightning rods, wind-carved towers, charged dust, and dry grass so the biome reads as storm habitat rather than either generic desert or wet electric runoff.
- `Magmaheart Caldera` now uses a stored imagegen magma painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/magmaheart-caldera-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/magmaheart-caldera-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the lower Ember entrance, basalt causeway, heart-shaped magma vent, heat-cage lantern, obsidian rib arch, magma-river pockets, and Ember Hollow return aligned with the generated board.
- Early magma-scene rule addition: lava biomes should preserve black basalt walkable lanes against high-intensity orange magma, using repeated obsidian ribs, heat cages, vent rings, and cooling shelves so the board stays playable under dramatic firelight.
- `Basalt Bloom Caldera` now uses a stored imagegen volcanic-flower painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/basalt-bloom-caldera-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/basalt-bloom-caldera-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the looped crater path, central red bloom fracture, cracked basalt plate ring, bronze steam cages, heat-vine mats, ember moss, sanctuary waystone, and Magmaheart Caldera return aligned with the generated board.
- Early volcanic-bloom rule addition: fire/grass crater scenes should make living heat ecology the first read, using red flowers, ember moss, vine mats, cooled basalt, and contained steam rather than relying on open lava as the only spectacle.
- `Cinderlake Basin` now uses a stored imagegen magma-lake painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/cinderlake-basin-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/cinderlake-basin-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Magmaheart descent, broad magma lake, crescent basalt causeway, obsidian rib arch, heat-cage lantern, red crystal clusters, ashgrass pockets, half-buried waystone, and Magmaheart return aligned with the generated board.
- Early magma-lake rule addition: magma lake scenes should feel broader and more dangerous than river or vent scenes, using one unmistakable molten body as the hero landmark while keeping dark rim paths and lantern-marked safe shelves readable.
- `Cindershore Strand` now uses a stored imagegen magma-beach painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/cindershore-strand-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/cindershore-strand-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Cinderlake branch, black glass-sand beach lane, crescent molten shoreline, basalt tide pools, fossil-root driftwood arch, heatglass shell beds, caretaker lanterns, and Cinderlake return aligned with the generated board.
- Early magma-beach rule addition: magma beaches should read as shorelines first, using black glass sand, molten surf, tide-pool rims, heatglass shells, and fossil-root driftwood instead of repeating the caldera, lake, or cave language.
- `Asterwake Shoals` now uses a stored imagegen starfish-beach painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/asterwake-shoals-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/asterwake-shoals-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the Tidegate branch, pale sand walk lanes, crescent driftwood arch wrapped in living starfish, five-point tidepool, starfish nursery beds, shell tidegrass, caretaker lantern, sanctuary waystone, and Tidegate return aligned with the generated board.
- Early starfish-beach rule addition: coastal water/light scenes should avoid generic tropical beach reads by making the native biology the hero landmark; living starfish beds, tide-pool geometry, shell paths, tidegrass, and caretaker markers should imply a habitat, not a vacation postcard.
- `Frostglass Orchard` now uses a stored imagegen winter-orchard painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/frostglass-orchard-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/frostglass-orchard-painted-v1.png).
- Frostglass Orchard's existing `frostglass-orchard-battle-v1.png` is certified as the low-camera extension of that walking board. The frostglass well, crystal-fruit trees, blue-scarf scarecrow, broken orchard gate, warm caretaker lamp, blue frostgrass, and packed-snow lane remain consistent across both perspectives.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the snow-packed orchard lane, crystal-fruit tree rows, frostglass well, blue-scarf scarecrow, buried caretaker sign, frostgrass patches, and Starglass Roost return aligned with the generated board.
- Early frost-scene rule addition: ice-adjacent biomes should avoid flat snowfield reads by using authored living details such as crystal fruit, frost organs, warm caretaker lamps, and still-green frostgrass patches that can later justify ice-form transformations.
- `Aurorashard Tundra` now uses a stored imagegen aurora-tundra painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/aurorashard-tundra-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/aurorashard-tundra-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the S-shaped packed-snow lane, crescent aurora crystal ridge, glowing blue ice-vein path, frostgrass meadow, half-buried caretaker posts, and Frostglass Orchard return aligned with the generated board.
- Early aurora-tundra rule addition: polar ice/light scenes should use aurora color as reflected gameplay lighting, not just sky decoration; repeat the crystal ridge, blue ice veins, and amber caretaker markers between walking and battle views so the fight feels anchored to the exact same snow route.
- Aurorashard's existing `aurorashard-tundra-battle-v1.png` is certified as the low-camera extension of the exploration board. The crescent shard ridge, branching blue ice veins, three amber posts, frostgrass, bent polar limb, packed-snow lane, and green-pink aurora all remain recognizable without unrelated arena additions.
- `Coppervine Runoff` now uses a stored imagegen charged-drainage painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/coppervine-runoff-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/coppervine-runoff-painted-v1.png).
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the wet-stone maintenance path, cracked sluice box, tilted gutter arch, blue runoff pools, coppervine mats, half-sunk caretaker lantern, and Moonfen Marsh return aligned with the generated board.
- Early charged-water rule addition: electric-adjacent biomes should read as organic conductivity rather than cyberpunk machinery, using living copper roots, blue mineral runoff, storm reflections, gutter hardware, and caretaker lamps so future electric forms feel grown by habitat pressure.
- Coppervine's existing `coppervine-runoff-battle-v1.png` is certified as the low-camera extension of the walking board. The cracked sluice structure, broken gutter arch, blue runoff, living copper roots, barred drain, half-sunk caretaker lamp, and wet-stone lane recur without unrelated arena architecture.
- `Gloamrail Cut` now uses a stored imagegen abandoned-rail painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/gloamrail-cut-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/gloamrail-cut-painted-v1.png).
- Gloamrail's existing `gloamrail-cut-battle-v1.png` is certified as the low-camera extension of the walking board. Wet rails, broken sleepers, the bent signal, amber warning lamps, bramble-covered masonry, barred sanctuary crawlspace, and damp stone trench recur without unrelated arena structures.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the wet sleeper path, bramble trench walls, amber patrol lamp, bent signal post, shadow-grass pockets, sanctuary crawlspace, and Glassroot Burrow return aligned with the generated board.
- Early shadow-route rule addition: shadow habitats should feel like shelter under pressure rather than generic evil, using patrol-light edges, hidden crawlspaces, wet reflections, and living dark grass so dangerous Vivos feel protected and watchful.
- `Sporebell Garden` now uses a stored imagegen flower-field painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/sporebell-garden-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/sporebell-garden-painted-v1.png).
- Sporebell's existing `sporebell-garden-battle-v1.png` is certified as the low-camera extension of its walking board. Giant lavender bell blooms, red warning ribbons, the stone pollinator basin, crooked garden arch, violet spore grass, golden pollen haze, and pale dirt paths recur without unrelated arena additions.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the S-shaped garden path, giant bell-bloom clusters, warning ribbon stakes, cracked pollinator basin, crooked garden arch, violet spore-grass pockets, and Lantern Nursery return aligned with the generated board.
- Early poison-adjacent garden rule addition: poison-support habitats should look beautiful first and unsafe second, using pollen haze, warning ribbons, swollen plant organs, and violet spore pockets instead of sludge, skull motifs, or generic toxic-swamp language.
- `Cadence Lab Annex` now uses a stored imagegen reclaimed-containment painting at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/cadence-lab-annex-painted-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/environment/cadence-lab-annex-painted-v1.png).
- Cadence's existing `cadence-lab-annex-battle-v1.png` is certified as the low-camera extension of the walking board. Cracked habitat glass, the amber-blue warning-light tree, cable-root nests, violet canisters, open containment door, nursery overgrowth, and fractured pale tiles recur without unrelated laboratory architecture.
- Its authored runtime metadata in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/game/data/scenes.ts) keeps the cracked crescent habitat tank, warning-light tree, electric root nest, violet canister rack, open containment door, cable-root encounter patch, and Sporebell Garden return aligned with the generated board.
- Early lab-scene rule addition: engineered-life facilities should feel quiet, specific, and biologically reclaimed rather than hard sci-fi, using cracked habitat glass, nursery plants, soft warning lights, living cables, and dosage-colored canisters as the core identity.
- Early creature-presentation proof now lives in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures), where imagegen portraits for `Dogemox`, `Ignis Canis`, `Lumen Corvus`, `Astra Corvus`, and `Mossprig` feed the battle scene instead of abstract shapes.
- `Briarback Mustela` now completes Mossprig's first-rescue line with a transparent production portrait at `src/assets/creatures/briarback-mustela-portrait-v1.png`. Preserve the cream mustelid face and moss pelt while maturing the body into a low, broad sanctuary guardian with root-wrapped limbs, thorn mantle, seedpod glands, and a hooked living branch tail. Avoid mascot ferret softness, decorative leaf clothing, hard armor, or mechanical plant parts.
- Early creature-presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/needlehare-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/needlehare-portrait-v1.png), giving the new `Velox Lepus` / `Needlehare` line the same portrait-backed battle and roster treatment as the other early sanctuary Vivos.
- `Razorjack Lepus` now completes that line with a transparent mature portrait at `src/assets/creatures/razorjack-lepus-portrait-v1.png`: swept blade-split reed ears, heavy spring legs, seedpod tail, amber gland lines, and a low launch posture make the evolution feel bondable but legitimately difficult to contain. Preserve tawny/cream family resemblance and avoid metal blades, mascot smiles, ordinary rabbit softness, or decorative glow without anatomical purpose.
- Early creature-presentation proof now also includes the steel wolf line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/grimweld-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/grimweld-portrait-v1.png), [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/ironjaw-lupus-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/ironjaw-lupus-portrait-v1.png), and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/titan-lupus-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/titan-lupus-portrait-v1.png), establishing a moody puppy, compact steel adolescent, and rideable final guardian progression for `Ferrum Lupus`.
- Early creature-presentation proof now also includes the water buffalo line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/tidecalf-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/tidecalf-portrait-v1.png) and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/tidehorn-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/tidehorn-portrait-v1.png), establishing a sturdy young water buffalo and a broad adult water guardian for `Aqua Bubalus`.
- Early creature-presentation proof now also includes the massive water crocodile: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/mirejaw-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/mirejaw-portrait-v1.png), giving `Aqua Crocodylus` a low heavy ambush profile with water organs, huge jaws, armored scutes, and tail-weight instead of a cute reptile read.
- `Faultcrown Rhinoceros` now completes Basalthorn's stone-growth line with a transparent production portrait at `src/assets/creatures/faultcrown-rhinoceros-portrait-v1.png`. Preserve the rhino's biological face and planted quarry weight while escalating its horn into an amber faultglass core ringed by grown basalt, its shoulders into eroded standing stones, and its limb seams into visible root tendons. Avoid armor, mecha language, rider gear, or generic crystal-beast noise.
- Early creature-presentation proof now also includes the swamp-water bear line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/mirecub-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/mirecub-portrait-v1.png) and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/bogmantle-ursus-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/bogmantle-ursus-portrait-v1.png), giving `Aqua Ursus` a young intimidating blackwater cub and a formidable adult swamp bear whose roots, lily pads, moss, and blue-green water channels read as swamp biology wrapped around a water creature.
- Early creature-presentation proof now also includes the ice polar bear: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/frosthulk-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/frosthulk-portrait-v1.png), giving `Glacies Ursus` a massive snow-coated body, glacier plates, icicle beard, and heavy paw silhouette for Frostglass Orchard.
- Early creature-presentation proof now also includes the evil-looking ice penguin line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/glarefin-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/glarefin-portrait-v1.png) and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/dreadfin-spheniscus-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/dreadfin-spheniscus-portrait-v1.png), giving `Glacies Spheniscus` a wicked small stage and a larger evolved ice-realm predator with a taller frostglass crown, blade flippers, hooked ice beak, and mean blue-eyed command read.
- Early creature-presentation proof now also includes the massive ice walrus: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/gloomtusk-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/gloomtusk-portrait-v1.png), giving `Glacies Odobenus` an intimidating frost-fat body, glacier back plates, ice-whisker mass, brutal tusks, and low heavy ice-realm bruiser read.
- Early creature-presentation proof now also includes the ice snow leopard line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/snowshade-cub-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/snowshade-cub-portrait-v1.png) and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/frostmane-leopard-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/frostmane-leopard-portrait-v1.png), giving `Glacies Uncia` a bad-tempered cub and a larger fluffy but intimidating evolved predator with frostglass whiskers, ice-spine plates, and huge cold-weather paws.
- Early creature-presentation proof now also includes the ice boar: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/rimeboar-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/rimeboar-portrait-v1.png), giving `Glacies Aper` a low charging stance, frostglass bristles, ice-crusted hooves, heavy shoulders, and curved translucent tusks for a stubborn ice-realm bruiser read.
- Early creature-presentation proof now also includes the fire horse line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/cinderhoof-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/cinderhoof-portrait-v1.png), giving `Ignis Equus` a portrait-backed Ember Hollow encounter with biological ember organs, coal hooves, and a readable equine silhouette.
- Early creature-presentation proof now also includes the magma-biome elephant: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/magmadon-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/magmadon-portrait-v1.png), giving `Ignis Elephas` a basalt-plated body, lava-veined trunk, magma-spray profile, and massive fire-route silhouette.
- Early creature-presentation proof now also includes the electric pigeon: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/voltpip-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/voltpip-portrait-v1.png), giving `Fulgur Columba` a cute round body, conductive feather veins, shoulder charge organs, and one clearly dangerous stored-bolt wing.
- Early creature-presentation proof now also includes the electric sheep: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/stormwool-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/stormwool-portrait-v1.png), giving `Fulgur Ovis` a braced wool mass, conductive horns, static fleece, and a sturdier electric route silhouette.
- Early creature-presentation proof now also includes the grass squirrel line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/mossquirl-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/mossquirl-portrait-v1.png), giving `Flora Sciurus` a portrait-backed nursery and sungrass encounter with a fern-frond tail, seed bristles, root claws, and a serious ready-to-spring posture.
- Early creature-presentation proof now also includes the venomous grass snake line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/venivy-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/venivy-portrait-v1.png) and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/verdaconda-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/verdaconda-portrait-v1.png), giving `Flora Viperis` a small venomous first form and a large anaconda-style evolved plate with stronger venom organs.
- Early creature-presentation proof now also includes the carnivorous plant: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/snapmaw-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/snapmaw-portrait-v1.png), giving `Flora Dentata` a trap-jaw bloom, thorn teeth, vine limbs, nectar organs, and a beautiful-but-unsafe Sporebell predator read.
- Early creature-presentation proof now also includes the adult-only leaf tiger: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/leafstalker-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/leafstalker-portrait-v1.png), giving `Flora Tigris` a high-level grass predator plate with a living ghillie-suit coat, heavy claws, and a powerful non-baby silhouette.
- Early creature-presentation proof now also includes the stone rhino: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/basalthorn-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/basalthorn-portrait-v1.png), giving `Petra Rhinoceros` a mineral-grown body, basalt horn, heavy hooves, and a stubborn stone-tank silhouette.
- Early creature-presentation proof now also includes the stone bear: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/bouldermaw-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/bouldermaw-portrait-v1.png), giving `Petra Ursus` a massive living-quarry body, slate shoulder plates, moss seams, basalt claws, and amber mineral glow.
- Early creature-presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/prismkid-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/prismkid-portrait-v1.png), giving the `Lumen Capra` line a parchment-backed storybook plate that matches the current creature-portrait workflow used by battle and roster surfaces.
- Early creature-presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/prismur-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/prismur-portrait-v1.png), completing the evolved `Lumen Capra` payoff so `Prismkid` can mature into a prism-ram silhouette without falling back to runtime-generated art.
- Early creature-presentation proof now also includes the light-cat line: [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lanterncat-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lanterncat-portrait-v1.png) and [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lantern-panthera-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lantern-panthera-portrait-v1.png), giving `Lumen Felis` a full juvenile-to-panther portrait pair for `Starglass Roost` and other light-route encounters.
- Runtime rule addition: early creature portraits should use single-subject storybook plates with generous padding, restrained parchment-vignette backdrops, and clean silhouette priority so the same asset can survive battle framing, Codex panels, and later roster surfaces.
- Early neutral-line rule addition: even non-elemental sanctuary Vivos should still carry one memorable engineered-organic hook, such as reed quills, translucent membranes, or gland-light patterning, so "neutral" never reads like an unauthored ordinary animal.
- Battle presentation proof now lives in [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle), where imagegen backdrops for `Briar Town`, `Sanctuary Trail`, `Starglass Roost`, `Ember Hollow`, and `Briar Gym` replace the old generic combat gradient with scene-authored encounter staging.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/lantern-nursery-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/lantern-nursery-battle-v1.png), so the new sanctuary prep board carries its teal-glass nursery identity into battle instead of collapsing into a generic fallback.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/glassroot-burrow-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/glassroot-burrow-battle-v1.png), so the special encounter refuge keeps its root-cradle and bioluminescent pool identity when cave battles trigger.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/quartzroot-vault-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/quartzroot-vault-battle-v1.png), so Quartzroot Vault carries its heart-shaped quartz root arch, blue pool, bronze caretaker lantern, crystal ledges, rope-bridge hints, and fossilized roots into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/tideglass-grotto-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/tideglass-grotto-battle-v1.png), so Tideglass Grotto carries its crescent blue-glass waterfall arch, luminous pool, bronze caretaker lantern, rope bridge stump, wet stone shelves, and turquoise cave channels into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/moonmilk-cavern-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/moonmilk-cavern-battle-v1.png), so Moonmilk Cavern carries its central healing basin, dripping limestone curtains, soft blue fungi, crescent glassy shelf, caretaker lantern cluster, and sanctuary waystone into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/prismfall-cavern-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/prismfall-cavern-battle-v1.png), so Prismfall Cavern carries its split rainbow spire, circular mirror pool, bronze lantern, broken glassroot bridge, and faceted crystal floor into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/prismfall-ravine-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/prismfall-ravine-battle-v1.png), so Prismfall Ravine carries its stacked prism waterfall shelves, mist bridge, turquoise pool, faceted cliff walls, mossy ledges, and caretaker lamps into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/echobloom-canopy-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/echobloom-canopy-battle-v1.png), so Echobloom Canopy carries its spiral-root tree, blue bell flowers, glowing pool, caretaker lantern, vine bridge hints, and mossy-root floor into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/lumenveil-grove-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/lumenveil-grove-battle-v1.png), so Lumenveil Grove carries its luminous root arch, giant blue mushrooms, mirror pool, violet spore pods, caretaker lantern, sanctuary waystone, and glowmoss path into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/briar-town-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/briar-town-battle-v1.png), so `Patrol Auditor Rhis` no longer drags the confiscation standoff back onto a generic fallback and instead fights in a lantern square with visible patrol hardware and sanctuary witness space.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/moonfen-marsh-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/moonfen-marsh-battle-v1.png), so the new wetland branch carries its still pools, silver reeds, and derelict marsh watchtower into battle instead of collapsing back into a generic field.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/mireglass-swamp-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/mireglass-swamp-battle-v1.png), so Mireglass Swamp carries its blackwater pool, mossy log bridge, cypress root arch, lantern fungus, glassy algae, and half-sunk sanctuary marker into a dedicated swamp fight scene.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/sunspindle-dunes-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/sunspindle-dunes-battle-v1.png), so Sunspindle Dunes carries its crescent fossil-root arch, amber glass obelisk, blue shade awning, sandstone ribs, dry grass, and heat-glass crystals into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/redglass-saltpan-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/redglass-saltpan-battle-v1.png), so Redglass Saltpan carries its cracked red-glass mineral sheet, pink salt polygons, blue-white mirage veins, caretaker shade marker, sanctuary waystone, and half-swallowed ruin arches into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/thunderhead-mesa-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/thunderhead-mesa-battle-v1.png), so Thunderhead Mesa carries its lightning rod array, twin wind-carved towers, blue-white storm forks, dry grass, charged orange stone, storm vane, and sanctuary waystone into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/magmaheart-caldera-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/magmaheart-caldera-battle-v1.png), so Magmaheart Caldera carries its heart-shaped magma vent, heat-cage lantern, obsidian rib arch, magma rivers, red crystals, and black basalt lanes into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/cinderlake-basin-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/cinderlake-basin-battle-v1.png), so Cinderlake Basin carries its broad magma lake, crescent basalt causeway, obsidian rib arch, heat-cage lantern, red crystals, and half-buried waystone into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/cindershore-strand-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/cindershore-strand-battle-v1.png), so Cindershore Strand carries its molten beach surf, black glass sand, basalt tide pools, fossil-root driftwood arch, heatglass shells, caretaker lantern, and sanctuary marker into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/asterwake-shoals-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/asterwake-shoals-battle-v1.png), so Asterwake Shoals carries its crescent starfish driftwood arch, luminous five-point tidepool, caretaker lantern, sanctuary waystone, tidegrass, shell beds, black rocks, and living starfish clusters into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/frostglass-orchard-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/frostglass-orchard-battle-v1.png), so Frostglass Orchard carries its crystal-fruit rows, frostglass well, blue-scarf scarecrow, broken orchard gate, and warm caretaker lamp into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/coppervine-runoff-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/coppervine-runoff-battle-v1.png), so Coppervine Runoff carries its cracked sluice box, gutter arch, blue runoff pool, coppervine roots, storm-drain gate, and half-sunk lantern into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/gloamrail-cut-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/gloamrail-cut-battle-v1.png), so Gloamrail Cut carries its wet tracks, broken sleepers, bramble walls, amber lamps, bent signal post, and sanctuary crawlspace into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/sporebell-garden-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/sporebell-garden-battle-v1.png), so Sporebell Garden carries its giant bell blooms, warning ribbons, pollinator basin, garden arch, pollen haze, and violet spore grass into fights from a lower battle perspective.
- Battle presentation proof now also includes [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/cadence-lab-annex-battle-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/battle/cadence-lab-annex-battle-v1.png), so Cadence Lab Annex carries its cracked habitat glass, warning lights, cable-root nests, open containment door, nursery overgrowth, and violet canisters into fights from a lower battle perspective.
- Runtime rule addition: battle backdrops should preserve one clear foreground lane for the player side, one readable midground lane for the enemy side, and softer distant landmarks so creature portraits can sit over the art without obscuring all place identity.
- Runtime rule addition: civic or town-square backdrops should show the pressure source at the edge of the frame, such as patrol tents, restraint gear, or seizure postings, while preserving a calm central lane where the rescue bond visually holds its ground.
- Runtime rule addition: while dedicated field sprites are still in progress, the overworld should use stylized storybook tokens for the handler, lead companion, trainers, exits, and interactables rather than anonymous circles or debug rectangles, so traversal still feels like authored play inside the painting.

World expansion target:

- Near-term expansion can target roughly 20 additional beautiful explorable scenes.
- Long-term, grow the game toward roughly 60 different walkable, combat-capable scenes.
- Combat-capable scenes should each receive a matching dedicated battle backdrop.
- New scenes should add meaningful route variety: caves, ice places, green overgrown routes, flower fields, gardens, waterways, wetlands, earthy mineral places, magical or luminous places, cursed-looking places, civic spaces, wild routes, sanctuaries, observatories, labs, patrol spaces, gyms, towns, ruins, and elemental habitats.
- Scene production should use [`docs/biome_roadmap.md`](biome_roadmap.md) for the next planned biome packets, especially when creating habitats for future elemental creatures.

Biome art rule:

- Use imagegen to make biomes visually distinct and memorable.
- Snow, lava, forest, cave, wetland, ruin, lab, coast, and observatory scenes should not feel like palette swaps of the same board.
- Each biome should imply its native creatures through environmental storytelling: nests, tracks, shed feathers, heat vents, frost crystals, reed beds, containment glass, mineral organs, or sanctuary signs.
- When possible, generate exploration and battle art for a biome as a paired set so the same landmark appears from both traversal and fight-scene angles.

## Encounter Zone Language

Encounter zones must be beautiful and readable.

Use consistent visual vocabulary:

- Tall grass.
- Reeds.
- Cave floors.
- Lab overgrowth.
- Ruined gardens.
- Swamp moss.
- Frost grass.
- Ash brush.
- Electric runoff grass.

Players should quickly learn that walking in these areas can trigger wild Vivos.

## Imagegen Workflow

Before producing production assets:

1. Generate style boards, not isolated final assets.
2. Lock palette behavior, line weight, texture level, camera angle, lighting, and shape language.
3. Create a small art bible page for each asset class.
4. Generate a controlled vertical-slice set.
5. Reject images that are beautiful but not game-readable.

First imagegen test set:

- Cozy town street with subtle government presence.
- Forest route with tall grass and a hidden sanctuary path.
- Dogemox / Ignis Canis concept sheet with base canine lineage and fire-aligned form logic.
- Lumen Corvus concept sheet for the light raven line.
- Battle screen mockup with painterly Vivos and clean command UI.
- First gym exterior or leader-room concept.

## Locked Early Vivo Art Targets

### Lumen Corvus

Light-aligned raven-line Vivo.

Art goals:

- The earliest form should read as a baby or juvenile corvid: small body, expressive eyes, slightly oversized head or feet, and subtle light traits.
- Raven ancestry should be readable through beak, wing, feather, and perched silhouette language.
- It must not look like a normal raven with a glow pasted on.
- Use engineered organic light details: luminous feather veins, soft eye glow, pale crest structures, translucent feather tips, or biological prism organs.
- Mood: clever, watchful, elegant, slightly sacred, storybook-readable.
- Avoid angel wings, halos, religious symbols, robot parts, or generic fantasy familiar cliches.

### Ignis Canis

Fire-aligned canine-line Vivo.

Art goals:

- The earliest form should feel like a baby or juvenile starter companion, with cute proportions and restrained fire biology.
- Even as a baby, it should imply future mass, force, and guardian danger rather than reading as a harmless puppy.
- Canine ancestry should be readable through stance, muzzle, ears, paws, tail, and loyal companion energy.
- It must not look like a normal dog on fire.
- Use engineered organic fire details: ember glands, warm internal glow, coal-dark paw pads, heat vents in fur tufts, furnace-like chest markings, or flame-shaped but biological fur masses.
- Mood: brave, bonded, intense, protective, starter-worthy.
- Avoid literal burning pain, horror, armor plating, or generic hellhound language.

### Fenlight / Lumen Bufo

Moonfen light-amphibian Vivo.

Art goals:

- The earliest form should read as a juvenile marsh toad: compact body, broad eyes, rooted forefeet, and a poised amphibian silhouette that can hold the field without reading bulky or old.
- Amphibian ancestry should be obvious through mouth line, limbs, crouched posture, throat sac, and damp skin texture, but it must still feel like an engineered sanctuary lifeform rather than a normal frog.
- Use engineered organic light details: a lantern throat sac, translucent reed frills, soft vein-glow under wet skin, and marsh-gold nodes along the back or jaw line.
- Mood: patient, strange, calm, slightly uncanny, and quietly protective.
- Avoid gore, realistic pond-slime ugliness, cartoon frog comedy, or heavy mechanical plating.

Current production proof:

- `Fenlight` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/fenlight-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/fenlight-portrait-v1.png) as the first Moonfen-native creature plate for `Lumen Bufo`.
- `Lunaris Bufo` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lunaris-bufo-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lunaris-bufo-portrait-v1.png), completing the awakened Moonfen line so `Moonfen Keeper Orla` and player Fenlight evolutions no longer fall back to generic battle shapes.

### Lanterncat / Lumen Felis

Light-aligned feline Vivo.

Art goals:

- The earliest form should read as a juvenile lynx-panther hybrid: small enough to bond with immediately, but already tense, sharp-eyed, and visibly dangerous.
- Feline ancestry should be obvious through crouched posture, oversized paws, ear shape, cheek fur, and tail carriage, but it must not read as a normal cat with glow pasted on.
- Use engineered organic light details: luminous whisker roots, translucent ear membranes, prism-like throat or shoulder organs, and faint warm-gold vein glow under the fur.
- The awakened form should feel like a sleek young panther guardian rather than a full-grown giant, preserving agility and threat over bulk.
- Mood: watchful, uncanny, protective, and predatory in a controlled way.
- Avoid smiling pet-cat energy, plush mascot softness, angel symbolism, hard armor, or generic magical familiar shorthand.

Current production proof:

- `Lanterncat` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lanterncat-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lanterncat-portrait-v1.png), giving the juvenile `Lumen Felis` line a runtime-ready storybook plate for wild encounters.
- `Lantern Panthera` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lantern-panthera-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/lantern-panthera-portrait-v1.png), completing the awakened light-cat pair so future evolved encounters and player awakenings no longer fall back to generated combat bodies.

### Shadecub / Umbra Panthera

Shadow-aligned panther Vivo.

Art goals:

- The earliest form should read as a juvenile panther cub: small enough to rescue and bond with, but already low, tense, and visibly dangerous.
- Panther ancestry should be obvious through shoulder line, paw size, cheek shape, tail carriage, and crouched silhouette, but it must not read as a normal black cat with violet glow pasted on.
- Use engineered organic shadow details: a void-dark chest organ, dim vein glow under the fur, light-swallowing whisker roots, and ear membranes that look translucent only at the edges of lantern light.
- The awakened form should feel like a sleek shadow-realm hunter rather than a demonic caricature, preserving stealth, speed, and watchfulness over bulk.
- Mood: predatory, uncanny, patient, and bondable only because the handler learns when not to force light onto it.
- Avoid smiling pet-cat softness, plush mascot energy, devil-horn fantasy shorthand, hard armor, or generic smoke-monster silhouettes.

Current production proof:

- `Shadecub` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/shadecub-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/shadecub-portrait-v1.png), giving the juvenile `Umbra Panthera` line a runtime-ready storybook plate for rare burrow encounters.
- `Noctis Panthera` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/noctis-panthera-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/noctis-panthera-portrait-v1.png), completing the awakened shadow-cat pair so shadow evolution payoffs no longer fall back to generated combat bodies.

### Reedotter / Flora Lutra

Grass-water otter Vivo.

Art goals:

- The portrait should read as a quick wetland predator, not a playful pet otter.
- Otter ancestry should be obvious through low agile body, paws, muzzle, whiskers, and river-slick fur silhouette.
- Grass biology should grow through the body as reed-frond tail mass, shoulder frills, and rootlike whiskers rather than loose leaf accessories.
- Mood: alert, slippery, clever, and dangerous in motion.
- Avoid mascot softness, smiling family-friendly otter comedy, hard armor, or a normal otter with reeds pasted on.

Current production proof:

- `Kilncrest Equus` portrait art now lives at `src/assets/creatures/kilncrest-equus-portrait-v1.png` as a transparent production cutout. It evolves Cinderhoof's coal hide and ember organs into a heavier adult charger with integrated obsidian vent fins and furnace ribs, preserving a readable equine silhouette without saddle, armor, or hellhorse shorthand.
- `Reedotter` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/reedotter-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/reedotter-portrait-v1.png), giving the Tidegate, Asterwake, Moonfen, and Tideglass water-route branch a runtime-ready storybook plate instead of a generated fallback body.
- `Weirfang Lutra` portrait art now lives at `src/assets/creatures/weirfang-lutra-portrait-v1.png` as a transparent production cutout, extending the line into a heavier saw-tail wetland hunter while preserving organic reed biology and strong silhouette readability.

### Needlehare / Razorjack Lepus

Neutral engineered hare line.

Art goals:

- Keep Needlehare's tawny route-runner ancestry readable while making the mature form a serious containment risk rather than a larger pet rabbit.
- Razorjack's long ears divide into swept organic reed-quill blades, its hindquarters become visibly spring-loaded, and amber gland-light cutlines trace the muscle groups that discharge during a launch.
- The mature silhouette should read as speed held under tension: low posture, forward claws, aerodynamic ears, and enough shoulder mass to sell a guard-breaking collision.
- Keep every dangerous feature biological. Avoid steel blades, worn armor, mechanical joints, cheerful mascot expressions, or a normal hare with glowing stripes.

Current production proof:

- `Razorjack Lepus` portrait art now lives at `src/assets/creatures/razorjack-lepus-portrait-v1.png` as a transparent production cutout, completing the widely encountered Needlehare line with a mature route-hunter silhouette and restrained amber engineered biology.

### Bellcrab / Ferrum Pagurus

Steel hermit-crab Vivo.

Art goals:

- The portrait should read as a defensive shoreline bruiser with real claw danger, not a novelty beach crab.
- Hermit-crab ancestry should be obvious through shell carry, stance, antennae, and asymmetrical claw weight.
- Steel biology should feel grown into the shell as resonant ridges, bell-dome curvature, and warm glow seams rather than bolted armor.
- The evolved `Carillon Pagurus` should widen into a low shoreline fortress with three nested shell chambers, fluted tide-worn ridges, one enormous crushing claw, and a silhouette that clearly advances beyond the compact Bellcrab stage.
- Mood: watchful, stubborn, and ready to punish contact.
- Avoid cartoon beach humor, hard robot plating, or a normal crab with metal pasted on.

Current production proof:

- `Bellcrab` portrait art now lives at [`C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/bellcrab-portrait-v1.png`](C:/Users/Javier/Desktop/CodexCLI/2d-game-engine/projects/anima-codex/src/assets/creatures/bellcrab-portrait-v1.png), giving the live coastal and flooded-cave routes a runtime-ready steel-habitat creature plate instead of a generated fallback body.
- `Carillon Pagurus` portrait art now lives at [`C:/Users/javie/OneDrive/Documents/AnimaCodex/src/assets/creatures/carillon-pagurus-portrait-v2.png`](C:/Users/javie/OneDrive/Documents/AnimaCodex/src/assets/creatures/carillon-pagurus-portrait-v2.png), completing the evolved shoreline steel pair with nested resonant shell chambers, warm biological seam light, and a heavier asymmetric claw silhouette. The production plate has a clean transparent background so the creature remains cohesive across painted habitats, battle staging, and roster presentation.

## Prompting Constraints

Every imagegen prompt should specify:

- Intended game use.
- Top-down or presentation angle.
- Beacon Pines-inspired cozy storybook direction.
- Engineered biological lifeform setting.
- No pixel art.
- No photorealism.
- No text, logos, or watermark unless the asset specifically needs readable text.
- Strong gameplay readability.
- Cohesive palette and controlled detail.

## Open Art Decisions

- Final palette rules.
- Final linework thickness.
- Whether characters use full hand-drawn animation, skeletal cutout animation, or limited frame sets.
- Battle creature pose format.
- How much government visual language appears in ordinary scenes.

## Current Runtime Art Rule

Until the first imagegen vertical-slice boards land, the playable runtime should use:

- soft painterly color masses instead of tilemaps
- clear obstacle and encounter-zone separation
- storybook silhouettes over noisy detail
- temporary abstract Vivo shapes that preserve element and species readability

This is a readability-first blockout rule, not permission to ship with placeholder-feeling visuals. Replace these runtime blockouts with controlled imagegen scene art and creature presentation as the next art-heavy milestone.

## Steam Key-Art Master (2026-07-30)

The selected textless Steam key-art source is `src/assets/marketing/anima-codex-steam-key-art-master-v2.png`. The first pass was rejected because Dogemox read as a mature wolf rather than the young, bondable starter. V2 preserves the stable storybook staging, sanctuary-versus-containment value split, handler bond, evolved silhouettes, patrol pressure, and upper-left title-safe area while restoring Dogemox's juvenile proportions and serious temperament.

This is a source composition, not a submission-ready capsule. Required Steam crops, logo typography, small-size readability checks, and owner approval remain separate production steps. Preserve the fixed perspective and avoid motion effects in every derivative.

### Juvenile Dogemox comparison

`src/assets/marketing/anima-codex-steam-key-art-dogemox-juvenile-v3.png` is an internal-review comparison that pushes the starter read further through a shorter muzzle, compact body, oversized broad paws, and a serious alert expression. It preserves the selected composition's fixed camera, title-safe space, handler bond, evolved silhouettes, and sanctuary-to-containment split.

V3 is not promoted over the selected V2 master yet. Compare both at capsule size before changing the validated derivative set; preserve V2 and its hashes until that brand decision is made.
