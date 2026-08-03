# Anima Codex Game Spec

## Product Shape

`Anima Codex` is a premium 2D creature RPG for Steam. It combines Pokemon-like play with a gorgeous illustrated storybook world and engineered lifeform lore.

The game should not feel like a retro pixel homage. It should feel like a modern illustrated RPG where every explored area is a composed painting and every creature has a strict art-design logic.

## Core Fantasy

The player rescues, raises, transforms, battles, and bonds with engineered lifeforms called Vivos. The government is confiscating Vivos from citizens, and the player's journey begins after saving one.

Long-term arc:

- Receive or rescue the first Vivo.
- Travel through a large connected region.
- Capture and train Vivos.
- Defeat 10 specialist gyms.
- Challenge the top league.
- Push the world toward Vivo freedom.

## Story Structure

`Anima Codex` should have a cohesive beginning and ending, not only a systems loop.

Beginning:

- Open with a strong playable premise around receiving or saving the first Vivo.
- Establish that Vivos are engineered lifeforms people bond with, not disposable products.
- Show the government-confiscation threat early through a playable scene, dialogue, or witnessed event.
- Make the player's first choice feel protective: the journey begins because a Vivo needs freedom, safety, or a handler who will not surrender it.

Middle:

- Carry the Vivo freedom conflict through gyms, towns, sanctuary spaces, government pressure, and biome discoveries.
- Use gym leaders, field researchers, caretakers, patrols, and rescued creatures to show competing views of what Vivos are.
- Let biome discoveries reveal that Vivos belong to the world, not only to labs or officials.
- Tell the story primarily through focused dialogue scenes in playable context: conversations, confrontations, gym leader speeches, rescue moments, government encounters, and companion reactions.
- Avoid detached lore dumps. The player should receive the story because something is happening to them, their Vivos, their route, or their current goal.

Ending:

- Build toward the league as both a battle challenge and a public argument over the fate of Vivos.
- After the league, resolve or meaningfully change the government-confiscation conflict.
- The ending should make the player's bond, roster, rescues, and exploration feel like they mattered.

## Traversal

The world is a connected graph of painted top-down scenes.

Each scene should define:

- Background painting.
- Walkable mask.
- Collision mask.
- Screen-edge exits.
- Door/path/cave/town transitions.
- Encounter zones.
- NPC markers.
- Interactable markers.
- Foreground occlusion layers when useful.

Scenes should feel like paintings, but behave like authored game boards.

Authored exits should win over decorative or boundary collision when the next player step enters an open transition zone. Locked exits still stop movement and show their blocker copy, but valid doors, screen edges, cave mouths, and route gates must never become unreachable because nearby collision masks overlap the trigger area.

Walking should feel forgiving around painted-scene geometry. If a diagonal movement step clips a collider, the player should slide along the open axis instead of losing the whole input, so trees, fences, door frames, and soft authored boundaries do not feel sticky.

Playtesting must support whole-map roaming without deleting authored progression. Development/admin boots can enable a playtest free-roam mode that bypasses exit requirements, trainer battle gates, progression-cleared blockers, and collision masks, while keeping each gate's requirement, blocked label, collision rectangle, and blocker copy in scene data so the same doors and paths can be locked again later. Normal non-admin play must still use the authored collision and progression rules.

The first playable should prefer exploration over strict quest gating. Early territories such as Sanctuary Trail, Glassroot Burrow, Moonfen Marsh, Starglass Roost, Ember Hollow, and Frostglass Orchard should be reachable for roaming, capture, leveling, and art/playtest discovery even when local mentor lessons are unfinished. Trainer lessons can still teach tactics, grant stewardship, and gate gym readiness, but they should not trap the player in Briar Town or Lantern Nursery while the surrounding biome content exists.

Trainer battles must be reachable from the walkable board state in which they are meant to be fought. If a gym ring, route barrier, or progression-cleared blocker gates movement, at least one opponent that opens or teaches that gate must stand in a reachable approach lane, and later opponents should become reachable once the authored blocker clears.

Traversal authoring should be editable while the game is running. Admin geometry mode should stay closed by default, with a subtle development-only entry point and a keyboard shortcut, then let a designer select collisions, exits, and encounter zones with the mouse, drag or resize their rectangles over the painted scene, and save the result into a JSON geometry config that the runtime loads on boot. This editor is for fast human correction of blocked doors, bad collision masks, and patch placement, not for replacing the authored scene spec or art bible.

When editing exits in admin geometry mode, a selected door or route exit can be marked open for admin testing, closed for admin testing, or set to follow the authored lock. This per-exit test state is saved with geometry config for playtest convenience, but normal non-admin traversal must ignore it and continue using the authored progression requirements.

Development/admin builds should also include a central Vivo registry drawer that audits every species and form against production needs: portrait coverage, learnset validity, move-role gaps, encounter/trainer placement, and simple recommendations for missing art or underpowered kits. This registry is a development surface, not normal player HUD, and should stay hidden behind an admin entry point.

Agentic content authoring should have a repo-local CLI for data-first additions such as attacks, potions, capture tools, and future battle-use items. The CLI should write a structured authored-content config, validate ids and gameplay fields, feed the same runtime data modules the game uses, and maintain an agent manual linked from `AGENTS.md` so future agents can extend content without rediscovering file formats.

## Encounters

Encounters are random but predictable by habitat.

Examples:

- Tall grass: random wild Vivo encounters while walking in grass.
- Caves: ambient encounter zones across cave paths.
- Water/reeds/swamps: water or marsh encounter tables.
- Labs/ruins: escaped or unstable engineered Vivos.
- Roads, towns, and safe interiors: no random encounters unless scripted.

Encounter zone data should include:

- Zone shape or mask.
- Biome type.
- Encounter rate.
- Step-counter range.
- Encounter table.
- Level range.
- Rarity.
- Conditions such as time, badge count, weather, or story flags.

## Biome-Driven Exploration

Exploration should be driven by beautiful, distinct biomes. Each biome should feel like a reason to travel because it changes the art, traversal texture, encounter tables, elemental pressure, and available creatures.

Long-term world target: roughly 60 different walkable, combat-capable scenes. Each scene should be explorable and should support fights when its biome calls for encounters, trainers, rescues, or gym challenges.

Detailed future scene targets, biome families, and elemental habitat hooks live in [`docs/biome_roadmap.md`](biome_roadmap.md). Use that roadmap when choosing the next scene to generate or wire so new areas support future creature lines instead of becoming isolated backgrounds.

Current runtime proof: `Glassroot Burrow` now carries an authored `umbraRoots` shadow pocket with its own battlefield condition, attunement landmark, and the live `Shadecub` encounter line, so the first playable now includes a real shadow-element habitat instead of only light, fire, steel, and water pressures.

Current rare-creature proof: `Frostglass Orchard` now carries `Leafstalker`, an adult-only high-level grass tiger found through a narrow overgrown leaf blind and a one-time level 12 rescue fight. This proves the roster can include hard-to-get apex Vivos that are not baby evolution lines and that require stronger battle control before joining the player.

Current element-expansion proof: `Stone` is now a live battle element instead of only an art descriptor. `Basalthorn` proves it with stone-type attacks, a Glassroot Burrow quarry habitat, a stone attunement landmark, and a trainer fight slot that lets players battle against the new matchup profile.

Current ice-habitat proof: `Ice` is now a live battle element instead of only a visual cue. `Frosthulk` appears in Frostglass Orchard as a massive snow-coated polar bear with ice attacks, ice bond marks from the frostglass well, and an orchard battlefield rule that boosts ice pressure.

Current shoreline-evolution proof: the common coastal `Bellcrab` now grows into `Carillon Pagurus` at level 18 after a steel win and three steel bond marks. Asterwake Shoals' shell tidegrass provides a habitat-authored steel training lane, and the evolved form awakens `Carillon Clamp`, a resonant focus attack that breaks prepared focus and regathers guard after converting an exposed opening.

Target biome directions include:

- Snowfields and frost gardens.
- Lava hollows and ash routes.
- Forest sanctuaries.
- Cave refuges and root burrows.
- Wetlands, reeds, and tide pools.
- Green overgrown routes.
- Flower fields and gardens.
- Earthy mineral places and clay ravines.
- Magical or luminous places.
- Cursed-looking places.
- Ruins and abandoned civic spaces.
- Labs and containment facilities.
- Coastlines and river crossings.
- Highland observatories and prism ridges.
- Towns, sanctuaries, gyms, and league spaces.

Each biome should define:

- Scene-art identity.
- Matching battle-backdrop identity.
- Encounter-zone visual language.
- Native creature lines.
- Possible elemental forms or attunements.
- One reason to explore beyond raw grinding, such as a rare creature, shortcut, gym prep, story event, sanctuary rescue, or transformation landmark.

## Battle

First version battle model:

- Classic turn-based 1v1.
- Six active Vivos in the party.
- One active battler and five immediate backups.
- Switching is strategic.
- Wild battles and trainer battles use the same foundation.
- Trainer battles cannot capture.
- Authored trainer tactics can discourage exact consecutive move repetition when a signature opener would otherwise dominate every switch. This pacing stays data-driven per trainer and preserves the shared enemy move scorer.
- Authored evolved trainer and wild forms must enter battle with their awakened signature move already equipped even when the base species has a full four-move kit. Player-owned evolutions still preserve the normal field-study replacement choice.

Baseline stats:

- HP
- Attack
- Defense
- Special or Focus
- Speed
- Element
- Species/form
- Four active moves

First slice combat needs:

- Damage.
- Distinct impact and focus attack lanes so brute species and special-pressure species do not collapse into one offense stat.
- Speed-based turn order.
- Type effectiveness.
- A small support-move layer that creates real tactical choices through guarding, setup, and opening targets for follow-up hits.
- Move-specific follow-through riders on key attacks, so the early roster can punish focus lines, crack guarded stances, chain into second bursts, or stabilize after cashing in an exposed target instead of reducing every attack to raw damage math.
- Species-specific bond instincts that create readable one-line tactical identities on top of move kits, so early Vivos do not collapse into interchangeable stat blocks.
- Explicit battlefield readouts for temporary support tempo states so guarding, setup, and exposed openings are legible without relying only on the battle log.
- Battle-read telegraphing for the current enemy line, especially trainer counter-switches and likely next actions, so authored lesson fights can be played around deliberately instead of guessed from hindsight.
- Player-side action forecasts on battle commands, so likely turn order, rough damage, and capture or retreat pressure are visible before the player locks a move.
- Player-side action forecasts should name the active battlefield condition when that board is already changing projected attack damage or support setup value, so habitat tactics are visible before commitment instead of only after the turn resolves.
- Command-level lesson telegraphing, so battle actions that advance a trainer's authored guard, switch, focus, elemental-strike, or exposed-finish lesson are called out directly on the relevant command cards before commitment.
- Post-battle lesson debriefs that persist the latest trainer result, so lesson-gated wins or losses leave an explicit checklist of what held, what failed, and what the player should prove on the next run instead of collapsing into one long banner sentence.
- Keyboard-native battle commands, with persistent command selection, number-key hotkeys, and confirm-first navigation so the first playable can be driven like a real RPG battle surface instead of mouse-only DOM UI.
- Core rescue verbs should also have direct battle shortcuts once they become part of the normal route loop: `C` for Rescue Pulse or Rescue Capture, `M` for Calm Signal, and `R` for Retreat in wild battles.
- Battle commands should lock briefly while turn-presentation events are playing, so rapid keyboard or mouse input cannot skip hit reactions, rescue rings, switch callouts, or field-read cues before the next decision.
- Authored battlefield conditions tied to scenes or habitats, so nurseries, roosts, burrows, hollows, and gyms shape tactics instead of only changing the backdrop art.
- Level-up rewards should land inside battle presentation with a distinct rising chime, on-canvas cue text, and enough delay that XP growth feels like a reward beat instead of another log line.
- Newly unlocked moves should be resolved in the fight UI when they arrive from battle XP. If a Vivo already knows four moves, the battle command deck should ask which move to replace, or let the player keep the current kit, before returning to exploration.
- Experience.
- Leveling.
- Move learning by level.
- Switching.
- Wild capture or rescue.
- First gym trainer AI.
- Authored trainer lesson goals for the nursery, route mentors, and first gym, so progression wins can explicitly demand guarding, switching, focus setups, elemental strikes, and exposed conversions instead of letting flavor text carry the whole teaching load.
- Authored trainer lessons can require a specific attack lane such as focus-style or impact-style strikes, so mentors like Moonfen Keeper Orla can ask for an actual calm burst instead of only checking that the player used a setup move.
- Authored lesson fights should only convert into full route growth when the tactic is actually proven. Incomplete lesson wins can grant a little practice XP, but they should not award full elemental victory progress or become the fastest way to grind past the intended team-play gate.
- Authored scripted rescues should be able to end through a rescue pulse once the calming lesson is proven and the target is at least wavering, so guaranteed sanctuary partners can join through trust instead of requiring every rescue beat to finish as a knockout.
- Trust-first scripted rescues should award bonded-team growth when completed before a knockout, so the intended calming route is not mechanically worse than defeating the frightened Vivo.
- Scripted sanctuary rescues should also expose `Calm Signal` as a non-damaging stewardship verb; it braces the lead, counts as a protective guard hold for guard-style rescue lessons, and improves the next trust-pulse read before the frightened Vivo gets its turn.
- Roster growth that rewards switching and bonded team play, not only one permanently overleveled lead.

## Fight Scene Presentation

The fight scene should become a polished game-native battle presentation, not a placeholder screen.

Battle presentation should include:

- Readable 1v1 layout.
- Reserved composition lanes so the scene label, battlefield-condition board, and creature plaques do not overlap each other on the painted surface.
- Imagegen-produced battle backdrops keyed to scene or biome.
- Clear Vivo portraits, sprites, or illustrated combat poses.
- Player-side Vivos should prefer a dedicated rear three-quarter portrait when one is authored, while opponents retain their front three-quarter portrait. This two-perspective contract keeps both battlers facing into the arena; forms without a rear asset may temporarily retain the shared portrait fallback while the library is produced.
- Battle entry must never leave the player in a half-battle state where the DOM command deck is active while the walking scene is still visible. `WorldScene` should hand off to `BattleScene` immediately once combat starts.
- `BattleScene` owns battle-art streaming. It should render a playable fight immediately with stable fallback bodies/backdrop if needed, then swap in the local battle painting and Vivo portraits as textures settle.
- Attack selection that feels like a game command surface.
- HP and status feedback, including on-canvas nameplates and live bars so health reads stay attached to the painted fight surface.
- Hit reactions.
- Elemental effect readability.
- Turn narration.
- Capture and rescue prompts.
- Enough animation, sound, and visual feedback that fights feel like a core product feature.

The fight scene must still preserve playability: attack choice, turn resolution, progress rewards, and return-to-exploration flow come before decorative polish.

Fight-scene UI should lean JRPG-style:

- Battle HUD, command menus, HP/status panels, move lists, targeting prompts, turn narration, capture/rescue prompts, and win/loss feedback should look like videogame interface surfaces.
- The default battle command presentation should read like a painted premium creature-RPG fight: enemy HP plaque top-left, player HP plaque lower-right, and a bottom parchment prompt/menu asking what the active Vivo should do. The root menu should expose `Fight`, `Team`, `Bag`, and `Run`, with submenus preserving actual moves, switches, rescue tools, and keyboard hotkeys.
- Battle-scene polish should protect the painted arena: persistent tactical text should not float over creature portraits, player party pips should live with the player HP plate, and command tiles should stay large, symbolic, and readable at browser-game scale.
- Battle resolution must hold a readable end beat before returning to exploration. One-shot knockouts, captures, trainer wins, and losses should keep the fight UI up long enough to say the fight ended and show the actual result text, rather than immediately dropping the player into the field HUD.
- Use compact, legible command panels and selection states rather than website-like cards or scrolling layouts.
- Keep the style integrated with Anima Codex's storybook, field-guide, registry, and illustrated battle-backdrop direction.
- Battle UI should make the fight more readable and satisfying, not cover the art or slow down turns.

## Progression

The implementation sequence, chapter gates, time targets, balance guardrails, and ending acceptance criteria are maintained in [`progression_roadmap.md`](progression_roadmap.md). The current runtime is a Gym 2 chapter-complete slice, not the full campaign ending.

Campaign chapter status has one runtime owner in `GameState`: trainer results and readiness state feed the campaign evaluator, while the field log and save snapshot consume its result. Do not duplicate chapter rules in renderer or UI code.

Save-slot cards and sanctuary-ledger progression summaries must consume `GameState` chapter metadata. They may present chapter title, objective, and completion state, but must never maintain their own badge or trainer requirement tables.

`npm run validate:campaign` is the deterministic progression contract check and is part of the production build. Any new chapter boundary must add at least one expected-state case to the shared `GameState` audit.

Campaign pacing must use the active-playtime value in the shared save contract. Hidden-window time is excluded; save-slot and sanctuary summaries may format this value but must not maintain their own clocks.

Each completed campaign chapter records its first completion time in the shared campaign milestone map. Replays must not overwrite the original clear time, and older complete saves must migrate from cumulative active time when no milestone exists.

Chapter pacing verdicts must also come from `GameState`. Gym 1 currently targets 3–5 active hours from a fresh save through the Rhis aftermath; save and sanctuary renderers may display the shared verdict but must not duplicate that timing band or comparison logic.

Campaign badges are stored as unique IDs in `GameState`; badge count is a derived compatibility/display value. Gym trainer rewards add their mapped ID idempotently, and older saves with only a count or trainer-clear state migrate through the shared snapshot reader. UI surfaces may display badge titles but must not award or infer them independently.

Stewardship evidence is stored as unique IDs beside campaign badges. Authored scripted rescues award the Sanctuary Rescue Record and the Gym 1 aftermath awards Briar Defense Testimony through their existing resolution paths. Save and sanctuary surfaces consume shared titles; older saves derive evidence from resolved rescue and trainer flags. The final league must evaluate these durable records alongside badges.

Gym 2 begins only after Patrol Rhis opens Sporebell Garden. The player must inspect Cadence Lab Annex's Warning Light Tree before Garden Warden Tamsin accepts the adaptation trial. Tamsin's two-Vivo level 11–13 team awards the Sporebell Adaptation Badge and Habitat Adaptation Study through the shared badge/evidence paths. Chapter evaluation, milestone timing, route gating, battle gating, saving, and legacy derivation must remain authoritative in `GameState` and scene requirements.

Long-term progression target:

- Levels 1-100.
- Roughly 150 obtainable creatures or forms.
- 10 gyms.
- Final league.
- Evolutions.
- Baby or juvenile starting forms for most elemental lines.
- Elemental forms.
- Better moves at higher levels.
- Rare or hidden forms discovered through play.

First playable target:

- Dogemox starter.
- 8-12 wild Vivo species.
- 15-25 total forms or variants.
- Level cap around 15-20.
- One town.
- Two or three route scenes.
- One cave or special encounter area.
- One first gym with trainers and leader.
- At least one evolution or elemental transformation.

## Playability Floor

The project should stay playable as it evolves. Art generation, docs, and content planning must not displace the minimum playable loop.

Mandatory end-to-end loop:

1. Move through a scene.
2. Transition to another scene.
3. Enter an encounter zone.
4. Trigger a wild or trainer encounter.
5. Enter battle.
6. Choose attacks or switch.
7. Resolve turns.
8. Gain progress such as experience, capture, move learning, or story state.
9. Return to exploration.

If a run must choose between adding non-integrated art and preserving movement/combat, preserve and improve movement/combat first.

The first playable should also preserve serializable route progress across reloads. Save scene position, roster state, rescued Vivos, trainer clears, badges, recovery anchor, encounter pacing, attunement marks, and move-study choices as simulation data rather than renderer state.

## Growth And Evolution

Most elemental lines should begin as baby or juvenile forms. Early-game Vivos should feel small, vulnerable, cute, and promising, like a companion the player is raising rather than a finished monster.

The desired feeling is similar to classic starter-monster progression:

- Early form: baby or juvenile, readable ancestry, simple elemental hint, low move complexity.
- Middle form: clearer role, stronger silhouette, more obvious elemental biology, better attacks.
- Final form: fully realized battle identity, strong elemental expression, premium illustrated presence.

Elemental identity can exist from the start, but it should usually be understated in the baby form. A baby fire canine should have ember glands, warm markings, or tiny heat vents before it becomes an imposing fire-aligned adult.

Do not make baby forms helpless mascots only. They still need combat utility, personality, and strategic reasons to care about them.

New elemental creature lines should be considered for 2 or 3 evolution stages. Use three stages for starters, flagship discoveries, gym-relevant lines, and biome-defining creatures; use two stages when the concept is cleaner or the species is supporting the roster.

## Long-Term Roster Target

The long-term creature goal is roughly 150 obtainable creatures or forms.

This does not require 150 unrelated base animals. The roster can combine:

- Base species.
- Evolution stages.
- Elemental forms.
- Breed-like variants.
- Rare biome variants.
- Story rescue variants.
- Gym or league signature forms.

Players should be able to discover, fight, rescue or capture, collect, train, evolve, and use these creatures through biome encounters, story rescues, gyms, rare conditions, and elemental transformations.

## Starter And Early Species

The opening should eventually offer three starter candidates from a larger pool, rather than a permanently fixed trio. This makes each playthrough feel slightly discovered while preserving creature-RPG clarity.

Two early species are now real, not just examples:

- **Lumen Corvus**: a light-aligned raven-line Vivo. It should feel elegant, watchful, clever, and slightly sacred without becoming magical instead of biological.
- **Ignis Canis**: a fire-aligned canine-line Vivo. This is the Latin-style fire dog direction and may either become Dogemox's official registry name or define one of Dogemox's first elemental forms.

Both should support juvenile early forms before stronger evolutions.

Use common names and registry names together when useful. For example, the player-facing common name can remain warmer, while the Codex entry uses Latin-style taxonomy.

## Anima Codex

Vivos are engineered biological lifeforms. They are not robots, not ordinary animals, and not generic monsters.

Design model:

- Species identity.
- Animal ancestry influence.
- Elemental expression.
- Engineered biological trait.
- Training or bond path.

The player should see named species, not labels like "fire dog" or "water crab."

Example starter:

- Dogemox: canine-influenced Vivo starter.
- Future variants can support different breed-like forms and elemental transformations.
- Ignis Canis: fire-aligned canine registry line, likely connected to Dogemox or its fire form.
- Lumen Corvus: light-aligned raven registry line.

## Elemental Transformation

Use traditional elements for readability.

Examples:

- Normal
- Fire
- Water
- Grass
- Electric
- Ice
- Rock
- Ground
- Poison
- Psychic
- Dark
- Light or Fairy-like equivalent

Transformation should feel emergent:

- A neutral Vivo exposed to fire-heavy environments can become fire-aligned.
- A Vivo trained around ocean, rain, tide caves, or water battles can become water-aligned.
- A Vivo trained around storms, power facilities, or electric battles can become electric-aligned.
- Habitat traversal, shrine resonance, and elemental victories should all be valid attunement vectors. The player should be able to intentionally shape a Vivo's growth path by where they walk and what pressures they overcome, not just by hidden battle flags.
- Authored hero-form awakenings should pay off immediately in battle. When a first-playable bond path resolves into a form such as `Ignis Canis` or `Astra Corvus`, the Vivo should gain a visible stat bump and an immediate signature-move reward or study choice rather than reading like a nameplate swap only.
- Authored route mentors, gym leaders, and later scripted rescues should also be able to field awakened forms, so the world demonstrates what a mature bond path looks like instead of leaving hero forms as player-only proof.

Implementation should support authored hero forms first, then systemic variants where full custom art is not available yet.

## Dialogue And Voice

Dialogue is part of the game identity. The game should include story dialogue, gym leader dialogue, government pressure, rescue scenes, and Vivo bonding beats.

Narrated dialogue is a non-negotiable product pillar. Early development may use rough TTS. Long-term target is high-quality AI voiceover.

Storytelling should take the player's focus through authored dialogue beats. Dialogue should be used to frame stakes, reveal character, explain conflict, and make rescues or gym victories feel meaningful while the player is still inside the playable flow.

## UI Direction

The UI should look and feel like a game, not a website.

Core surfaces:

- Battle commands.
- Party management.
- Anima Codex entries.
- Dialogue boxes.
- Capture and rescue prompts.
- Inventory and move-learning prompts.
- Gym challenge and league progression screens.

UI rules:

- Use game-native panels, command lists, tabs, prompts, and selection states.
- In the fight scene, lean into JRPG-style battle HUD patterns: command windows, HP/status plates, move lists, targeting prompts, and compact turn narration.
- Keep text readable and compact.
- Avoid scrolling website-like layouts for core gameplay screens.
- Support keyboard and controller-friendly navigation where practical.
- Player options now persist independently of save slots and include battle-audio on/off, reduced-motion suppression for interface animation and transitions, and larger menu/HUD text. Do not claim controller support, remapping, color-vision modes, screen-reader support, or full voiceover until those receive separate implementation and acceptance evidence.
- Align visual language with storybook, field-guide, registry, and government-document motifs.
- UI polish must support playability, not replace movement, encounters, or battle functionality.

## Current Vertical Slice Runtime

The current implementation path is now locked to:

- Phaser for the playfield runtime
- TypeScript for gameplay code
- Vite for local iteration and builds
- DOM HUD on the right side of the playfield instead of dense in-canvas text UI
- Local field-log persistence for normal boots, so the first playable resumes scene position, roster growth, rescues, trainer clears, badges, recovery anchor, and move-study state after reloads while debug URL boots stay isolated from the live route log

Current playable slice present in the codebase:

- `Briar Town` as the safe hub and first gym scene
- `Briar Town` now uses a stored imagegen-painted town hub that anchors the gym loop, reserve ledger, bridge approach, and confiscation-notice premise in one authored board
- `Lantern Nursery` as a sanctuary-side prep scene off Briar Town, giving the first playable a gentler capture-and-training board before the route and gym climb
- `Briar Town` now keeps the direct outer-trail gate shut until `Nursery Tender Sola` clears the nursery lesson, making that prep board the true first route ramp instead of optional flavor
- `Briar Gym` as a dedicated painted first-gym interior, letting the Senka challenge happen in its own authored hall instead of directly on the town board
- `Sanctuary Trail` as the first habitat route with multiple encounter biomes and a stored imagegen-painted background integrated into the runtime
- `Glassroot Burrow` as a hidden painted sanctuary cave under the trail, finally giving the slice a true special encounter area with its own rescue-hideaway identity and a guarded shortcut toward Starglass Roost
- `Moonfen Marsh` as a painted wetland sanctuary branch off `Sanctuary Trail`, giving the first playable a quieter capture-and-recovery biome where frightened wilds settle more easily than they do on the open road
- `Moonfen Marsh` now also introduces `Fenlight` / `Lumen Bufo` as a native light-amphibian line with a guaranteed rescue beat and a calm-first battle identity, so the wetland branch expands both roster variety and route-specific tactics instead of only adding scenery
- `Fenlight Broodling` now uses authored scripted-rescue goals instead of resolving on any knockout, requiring the player to guard once and land a focus-style answer before the guaranteed Moonfen partner joins the roster
- `Fenlight` can now awaken into `Lunaris Bufo` through light attunement, light-aligned wins, and level growth, immediately gaining `Moonwell Pulse` as a steadier focus finisher that can re-form a guard after converting an exposed opening
- `Starglass Roost` as a painted observatory branch off Sanctuary Trail, giving the light-corvid line a dedicated bond-growth route before the first gym
- `Ember Hollow` as a hotter side-path that escalates levels, now backed by a stored imagegen-painted hollow scene, and makes Dogemox's fire-growth path more deliberate
- `Lantern Nursery` now also has its own stored imagegen battle backdrop, so the new prep loop keeps its place identity when early capture or sparring battles break out beside the glasshouse pens
- Lightweight staged dialogue in the HUD, so trainer intros, gym rewards, town notices, and sanctuary beats can land as speaker-tagged scenes instead of single flat status strings
- Wild encounters in authored habitat rectangles
- Scripted rescue encounters in sanctuary spaces, so the first playable can guarantee key early partners through authored calming battles instead of leaving the whole gym route to encounter luck
- Scripted rescue encounters can now carry the same battle-goal checklist as trainer lessons, letting sanctuary rescues demand species-specific calming behavior and remain retryable when the player wins by pressure instead of trust
- Scripted rescue encounters now expose a `Rescue Pulse` battle command when normal capture is disabled. The pulse only holds after the authored calming goals are complete and the target has a real opening, letting rescues such as Fenlight Broodling resolve through trust before a knockout.
- Scripted rescue pulses now grant trust XP to the active rescuer and participating teammates when the Vivo joins before a knockout, making calm rescue a real progression verb instead of only a kinder ending.
- The earliest guaranteed rescue partners now each teach a distinct calming tactic before they join: `Nursery Mossling` asks for guarding plus an exposed finish, `Reedrunner Leveret` asks for a switch plus an exposed finish, and `Rootbound Corvid` asks for focus setup plus a focus-style hit.
- Scene-art proof: route paintings can now be preloaded as runtime backgrounds while collisions, exits, encounter zones, shrines, and trainers stay authored as separate gameplay metadata
- Runtime asset-streaming proof: the illustrated slice no longer hard-blocks boot on every painted scene, battle backdrop, and portrait plate; the first scene now opens on a minimal preload, while adjacent scene paintings, active battle backdrops, and relevant creature portraits stream in as the player approaches them
- Traversal-identity proof: the field now uses a stylized sanctuary handler avatar, lead-specific companion silhouettes, and storybook token markers for exits, trainers, and interactables instead of plain debug circles and blocks
- Creature-art proof: early battle presentation can now swap from species and form state into stored imagegen portraits, letting `Ignis Canis` and `Astra Corvus` read as real authored creatures during combat instead of only text-level transformations
- Battle-backdrop proof: wild encounters and the first gym can now swap into stored imagegen battle paintings keyed to the active scene, so route and gym fights inherit actual place identity instead of a generic combat room
- Combat-feedback proof: battle resolution now also emits structured presentation cues for hits, support setups, switches, captures, and faints, letting the painted battle view itself communicate the lesson-state rhythm instead of leaving all turn readability to the side journal
- HP-plaque proof: the painted battle surface now also carries storybook nameplates, registry-aware subtitle lines, live HP bars, and floating HP delta callouts for both battlers, so health swings stay near the creatures instead of only in top-line text or the right journal
- Habitat-combat proof: authored battlefield conditions now let specific boards change the actual tactics layer, with sanctuary handoff boards cushioning switch-ins, roost glass amplifying light focus lines, and root or ember habitats pushing their favored element harder
- Rescue-board proof: `Moonfen Marsh` now adds a `Stillwater Calm` wetland rule that makes rescue pulses steadier and cuts down wild bolt pressure, so one biome in the first playable is explicitly about calming and holding frightened Vivos instead of only dealing damage faster
- Water-line proof: `Tidecalf` now appears in Moonfen's silver-reed pools, gathers water attunement from `Tidehoof Pool`, learns water attacks as it levels, evolves into `Tidehorn Bubalus`, and can be fought as Orla's adult wetland bruiser
- Water-crocodile proof: `Mirejaw` now appears in Moonfen Marsh and Coppervine Runoff as a massive water ambush bruiser, with water attacks that emphasize jaws, body weight, and riptide rolling instead of caster-style water blasts
- Water-swamp-bear proof: `Mirecub` now appears in Moonfen Marsh and Mireglass Swamp as a water creature that visually reads as blackwater swamp biology, starts as a young intimidating bear, learns bog-pressure attacks as it levels, and evolves into `Bogmantle Ursus`, a formidable adult bear with plants integrated into its coat and stronger water bruiser tools
- Ice-bear proof: `Frosthulk` now appears in Frostglass Orchard as a massive polar bear that likes being coated in snow and ice, using `Snowmantle Brace`, `Iceclaw Maul`, and `Glacier Crash` to make ice feel like armor and body weight rather than only a ranged cold effect
- Ice-penguin proof: `Glarefin` now appears in Frostglass Orchard as an evil-looking ice-realm penguin that can evolve into `Dreadfin Spheniscus`, using `Wicked Glare`, `Shard Flipper`, `Spite Slide`, and evolved `Dreadfin Execution` to make ice feel mean, quick, and predatory instead of only tanky
- Ice-walrus proof: `Gloomtusk` now appears in Frostglass Orchard as a massive, fat, intimidating ice-realm walrus, using `Blubber Brace`, `Tusk Ram`, and `Iceberg Bellyflop` to make ice feel like crushing body mass and territorial cold pressure
- Ice-leopard proof: `Snowshade` now appears in Frostglass Orchard as an intimidating baby snow leopard that can evolve into fluffy but dangerous `Frostmane Uncia` through ice bond growth, using `Snowveil Stalk`, `Rime Claw`, `Frost Pounce`, and `Frostmane Rend` to make ice feel like ambush predation
- Ice-boar proof: `Rimeboar` now appears in Frostglass Orchard as a stubborn ice-realm boar, using `Ice Bristle Brace`, `Tuskbreaker Charge`, and `Whiteout Gore` to make ice feel like hooves, bristles, tusks, and forward pressure
- Stone-bear proof: `Bouldermaw` now appears in Glassroot Burrow's quarry shelf as a massive stone bear, using `Slab Shoulder`, `Cavern Maul`, and `Bedrock Crash` to make stone feel like living weight, braced impact, and cave pressure
- Fire-horse proof: `Cinderhoof` now appears in Ember Hollow's cinder reeds, uses a stored portrait plate, learns horse-specific fire attacks, and can be fought on Ash Scout Iven's team so the hot route demonstrates more than Dogemox's fire form
- Magma-elephant proof: `Magmadon` now appears in Ember Hollow as a magma-biome fire bruiser with a stored portrait plate, trunk-fired magma attacks, basalt guarding, and a trainer-team slot on Ash Scout Iven so players can find, fight, and later use a heavy fire-route Vivo
- Electric-pigeon proof: `Voltpip` now promotes electric into a live element, appears in Coppervine Runoff's charged habitats, uses a stored portrait plate, and keeps its battle identity intentionally narrow with one powerful electric move, `Stormcache Bolt`
- Electric-sheep proof: `Stormwool` now appears in Coppervine Runoff as a sturdier electric bruiser, using `Static Fleece` to brace and `Thunder Ram` to turn conductive horns into guarded impact pressure
- Grass-squirrel proof: `Mossquirl` now appears in Lantern Nursery moss beds and Sanctuary Trail sungrass, uses a stored portrait plate, learns squirrel-specific grass setup and skirmish attacks, and can be fought on Sola's team
- Venom-snake proof: `Venivy` now appears in Moonfen Marsh's lantern shallows, evolves into `Verdaconda` through grass bond growth, gains venom-focused grass attacks, and can be fought as Orla's evolved anaconda-style line
- Electric-crane proof: `Stormchick Grus` now appears rarely at levels 8-11 in Thunderhead Mesa, learns a functional priority/focus/guard-breaking kit, evolves into `Thunderplume Crane` at level 15 and `Stormspire Grus` at level 32 through electric attunement, and has production portrait art for all three silhouettes
- Electric-crane aspiration proof: Thunderhead Mesa now culminates in `Storm Tender Kael`, whose lead level 11 `Thunderplume Crane` previews the rare juvenile's first evolution without putting the level 32 apex form into the early route; the lesson opens on the promised crane pressure, asks players to guard through it, and then answer with a focus-style attack. The showcase form is deliberately below its player evolution threshold: level 15 prevented the required counterattack, while an exact three-Vivo route-party test showed level 12 could make the entire two-opponent battle hinge on Mossprig landing one 94%-accuracy attack.
- Honest guard timing proof: `Guard Howl` carries enough defensive priority to brace before priority-one attacks such as `Plume Jolt`, while Thunderplume's priority-two `Static Step` can still seize the opening setup beat; Kael's lesson therefore protects the player when it reports the guard objective as complete
- Multi-stage evolution safety: when more than one form transition exists, level-up now selects the highest eligible forward transition and never regresses an apex form to an earlier stage
- Carnivorous-plant proof: `Snapmaw` now appears in Sporebell Garden as a grass-element trap predator, using `Nectar Lure`, `Trapjaw Snap`, and `Root Gorge` to turn the garden's beauty into actual bite-pressure gameplay
- Route-stewardship proof: clearing early biome mentors and confiscation-audit checks now gives their taught or defended habitat a persistent calmer read, improving future rescue pulses and slowing wild bolt pressure there so trainer lessons and public custody wins change how a biome behaves after the fight. Current reads cover Sola's nursery, Vale's trail audit reprieve, Nera's trail read, Tovin's burrow, Miren's roost, Iven's ember hollow, and Orla's marsh. Multiple local reads can combine, capped so one route cannot become risk-free.
- Civic-board proof: `Briar Town` now carries its own `Witness Square` battle rule, so the post-gym confiscation standoff reads as a public neutral-pressure duel instead of borrowing a route or gym rule
- Special-area proof: `Glassroot Burrow` now adds the first true cave-like rescue refuge to the vertical slice, with mixed light and grass habitat pressure, its own guarded trainer checkpoint, and a hidden route connection that makes the sanctuary feel less like a flat corridor
- Habitat encounters now use authored stride bands per zone, giving each biome a more predictable low/high step window before the next wild battle
- Habitat encounter pacing now also respects each zone's authored encounter-rate pressure, so hotter patches burn through their stride window faster while calmer nursery or sanctuary pockets breathe longer
- Habitat aftermath now persists per encounter patch, so wild battle outcomes can leave a patch settled, steady, spooked, or fully scattered instead of resetting the route to neutral after every fight
- Habitat aftermath now also prints into the battle result banner, and calm captures or careful retreats in elemental habitat patches add one matching bond mark to the current lead Vivo, making careful rescue work a visible route-growth verb instead of a hidden mood modifier
- Wild encounter aftermath now also persists as an overworld `Rescue Debrief` card with the target, patch, habitat temper, rescue read, earned bond traces, and next route-side correction, so wild capture decisions remain legible after the battle closes
- Habitat aftermath now changes the next wild battle's opening tempo: settled patches can expose a gentle rescue opening or brace the lead, while spooked and scattered patches let wild Vivos start guarded or focused so route stewardship affects the first turn instead of only the scout card
- Habitat scouting in the HUD so each encounter patch advertises its likely species mix and level range
- Habitat scouting in the HUD now also forecasts the approximate remaining strides until the next wild surge and labels whether a patch is slow-breathing, steady, or fast-stirring
- Habitat scouting now also reports each patch's aftermath temper, making it clear when the player has overpressured a route or successfully calmed it before the next rescue push
- Sanctuary Trail now carries ambient audit pressure while `Trail Auditor Vale` remains undefeated: its encounter patches read one step more spooked, wild battle opening reads name the seizure review, and Habitat Scout explains that answering Vale's audit battle removes the extra pressure.
- Calm captures or careful retreats should settle a patch and make the next rescue easier, while knockouts, route breaks, or wild escapes should scatter a patch, slow the next encounter, and raise bolt pressure until the player changes pace
- Habitat scouting and tactical prep now also surface each patch or trainer board's battlefield condition before the fight starts, so route planning includes switch-cover, prism, root, or ember rule reads instead of discovering them only after battle entry
- Active-roster planning now supports overworld lead reassignment directly from both the journal and number-key field hotkeys, so the player can intentionally choose which Vivo absorbs habitat bond marks and fronts the next rescue push without waiting for an in-battle switch or a slow HUD click path
- The DOM journal now also exposes each Vivo's current move kit, authored tactical role, and the next route or gym lesson cards with party-specific prep notes, so beating Sola, Nera, Pella, Senka, or Rhis depends on readable planning instead of hidden loadouts
- Briar Town now opens into a softer pre-route training loop: `Lantern Nursery` mixes grass and light encounter pens, one light-attunement landmark, and `Nursery Tender Sola` as a switch-and-finish checkpoint before the route climb
- Elemental attunement now accumulates through specific habitats, shrine interactables, and elemental wins, making Dogemox's `Ignis Canis` route legible in traversal instead of battle-only
- Lumen Corvus now has its own authored light-growth route: `Starglass Roost` feeds light attunement, supports light-element victories, and can push the juvenile raven into `Astra Corvus`
- 1v1 turn-based battles with speed-based order, elemental effectiveness, and lightweight support tempo states
- Battle intent telegraphing in both the HUD and canvas layer, so trainer counter-switches and likely next actions stay readable while the player is choosing a response
- Battle board identity now reads on the painted fight surface itself, with condition plaques and ambient lane cues that show sanctuary cover, prism surges, root hold, or ember pressure without relying only on journal text
- Battle-backdrop proof now covers the post-gym town defense as well, with a dedicated `Briar Town` combat painting that keeps the confiscation notice board, patrol tent, and lantern-square witness lane visible during Rhis's fight
- Battle command buttons now also forecast likely initiative, rough attack damage, and wild capture or retreat odds before commitment, so the first gym route's tactical lessons read as planned lines instead of blind button picks
- Battle command forecasts now also label active battlefield-condition boosts on attack and focus cards, so `Prism Draft`, `Rooted Lane`, `Ember Current`, and similar boards are visible in the decision surface before the player commits the turn
- Key early attacks now also carry authored tactical riders: `Bark Burst` can shatter prepared focus into exposure, `Gleam Peck` can crack guarded stances open, `Halo Flit` can prime the next luminous burst, and `Feint Hop` or `Vine Jab` can regather guard after converting an exposed opening
- Party continuity during battles: a lead Vivo fainting now forces a replacement swap instead of ending the fight when a healthy backup exists; if the whole roster is down, the battle must resolve through the recovery-anchor flow instead of presenting an empty switch state
- Rescue capture flow for wild Vivos, with clearer success windows when a target is weakened or left exposed
- Rescue capture pacing that lets failed pulses be retried only after the player earns a genuinely stronger opening through lower HP or a fresh expose setup
- Rescue command forecasts now explicitly show whether the current pulse is fresh, spent, locked behind the authored lesson, or ready to resolve, so capture timing is readable before the player gives the wild or frightened Vivo another turn
- The first normal capture tool is the basic `Rescue Capsule`: it is intentionally hands-on and harder than later tools, but it must feel strong enough to reach the target. Choosing it in battle should add a bullseye target to the wild Vivo's portrait, then ask the player to pull the capsule backward and downward to build power and release along a visible arc. The arc should preview whether the shot is short, near, or clean. Only a clean bullseye line triggers the existing rescue-capture hold chance; missing the mark spends the beat and lets the wild Vivo answer.
- Wild and scripted sanctuary rescue battles now include a non-damaging `Calm Signal` rescue verb, letting the player spend a turn to brace the lead, improve the current capture or trust-pulse read, lower bolt pressure in normal wild fights, and advance guard-style rescue lessons in authored rescues before committing to a pulse
- `Calm Signal` can also refresh a spent rescue-pulse read after a failed capture or trust pulse, so the player can recover through a visible stewardship turn instead of being forced into damage or expose-only retry lines. The forecast must show `Fresh read` before commitment, and the battle log should confirm that the next pulse can use the calmer opening.
- Active habitat patches now expose an overworld `Hold field call` rescue verb, letting the player deliberately steady a spooked patch before the next encounter instead of only repairing habitat temper through battle outcomes
- Habitat Scout cards now expose each patch's route-pressure percentage and relative encounter rarity labels for likely Vivos, so random encounters are predictable enough for intentional capture, leveling, and bond-route planning instead of feeling like opaque RNG
- Route-side rescue preparation is keyboard-native: pressing `F` while standing in an active habitat patch now performs `Hold field call`, matching the battle rescue shortcuts and keeping rescue pacing playable without journal clicks.
- A held field call now carries into the next wild battle in that patch: the lead opens braced, rescue capture pressure improves slightly, wild bolt pressure drops slightly, and the held call clears when that encounter resolves
- `Hold field call` now also grants the current lead one bond mark from the active habitat's attunement element, making careful route study a small transformation-planning verb instead of only a hidden encounter-temper adjustment.
- Held field-call influence must be visible in battle forecasts, not only in hidden math: rescue pulse details, Calm Signal cards, and wild bolt reads should explicitly name when the held call is making the first exchange steadier
- Held field calls should resonate when the active lead's rescue memory matches the patch's origin element, calming habitat temper harder and carrying a stronger braced-plus-focused opening into the next wild battle.
- Deterministic wild-battle debug boots must preserve the same habitat opening stack as live encounters, including both patch temper and any held field call, so automation can verify rescue pacing without bypassing the real route rules
- Deterministic debug boots should also enter the playable field or battle state immediately instead of forcing the front-door Field Log overlay open first; the menu can remain reopenable, but debug-route and debug-battle URLs must be one-step verification links.
- Normal wild captures now imprint the rescued Vivo with its habitat's elemental rescue-bond marks when the patch has an attunement element, with clean fragile captures or Calm Signal lines leaving a stronger two-mark start, so newly rescued partners carry a memory of where and how trust was earned
- Authored sanctuary rescues now also imprint explicit origin bond marks on the rescued Vivo, and completing the rescue through a trust-first pulse before a knockout adds an extra mark, so scripted partners carry a mechanical memory of the calming lesson instead of joining as plain roster rewards
- Rescued Vivos should carry a visible rescue memory in their roster card that records whether they joined as the starter, wild capture, sanctuary rescue, or trainer release, plus the place and method of that bond. This keeps rescue context attached to the creature after the battle debrief disappears.
- Rescue memories should also matter tactically when a Vivo leads in a matching origin patch again: the Habitat Scout should forecast the memory read, and the next wild battle should open with the lead braced, adding focus as well when the memory's bond element matches the patch's attunement element.
- Roster cards should preview current-scene rescue-memory routes for every party member, not only the active lead, so the player can choose which saved Vivo should front a matching habitat before the next wild surge.
- Rescue-memory influence must stay visible after battle entry: capture and Calm Signal forecasts should name the active memory brace or origin-focus read when the lead's rescue history is shaping the current wild exchange, including command chips for rescue memory, origin memory, held field calls, rescue promises, and origin promises before the player commits.
- Rescue-memory influence should also affect the actual wild rescue exchange, not only the opening stance: a matching memory steadies capture pulses and suppresses bolt pressure slightly, while an element-matched origin memory applies a stronger version of that modifier.
- Rescue-memory influence now also makes mid-battle party switching meaningful: in wild fights, switching to a Vivo whose rescue memory answers the active habitat creates a one-time memory handoff that braces the incoming lead, and an origin-element match also focuses its next strike. Those handoff reads stay visible in the live `Opening read` card after the switch and are preserved in the post-battle Rescue Debrief, so the player can connect a calm outcome back to the partner switch that steadied it.
- Rescue-memory influence should also change route growth after calm outcomes: if the lead resolves a capture or careful retreat in a matching habitat, the lead earns an extra bond mark, and an origin-element match earns two extra marks, so routing rescued Vivos back through familiar pressure accelerates intentional form planning.
- Field-lead reassignment inside an active habitat should immediately report the current patch read, including whether the new lead has a matching rescue memory, whether a held call is active, and whether a rescue promise is waiting, so players can route rescues through keyboard lead swaps without reopening the journal.
- Wild bolt reads should name rescue-memory suppression directly when the current lead is holding the line, including the stronger origin-memory case, so the player can understand why a frightened target is less likely to flee.
- Origin-matched rescue memories should also resonate through `Calm Signal`: when the current lead's bond element matches the active patch, the signal braces the lead, focuses its next strike, and grants one once-per-battle habitat bond mark so returning a rescued Vivo to its home pressure creates both an intentional mid-battle setup verb and a transformation-planning beat.
- Careful retreat now uses the same stewardship stack as rescue pulses: calm battlefields, Calm Signal, held field calls, rescue memory, origin memory, and current patch temper all shape the retreat forecast and chance, so backing off cleanly is a deliberate rescue-route tactic rather than a raw speed check.
- Wild-battle opening cues now label the actual source of the first tempo state on the fight canvas: settled or spooked habitat, lead rescue memory, origin memory, held field call, or origin call. The player should be able to tell why a first exchange began guarded, focused, or exposed without reverse-engineering the HUD.
- The live battle HUD now carries an `Opening read` card whenever route pressure shaped the fight entry, and that card updates after mid-battle memory handoffs or Calm Signal turns, so rescue memory, origin calls, held field calls, rescue promises, stewardship, patch temper, switch-earned handoff reads, and live signal holds stay visible while the player chooses commands instead of only appearing in the post-battle debrief.
- Rescue Debrief cards should preserve the actual battle-entry opening read after battle, including held field calls, origin calls, lead rescue memories, local stewardship, and patch temper, so players can connect route preparation to the final rescue outcome after returning to exploration without the read being recomputed after aftermath cleanup changes the patch state.
- Clean wild captures and careful retreats now leave a one-encounter `Rescue promise` on that habitat patch, so the next wild battle there opens with the lead braced, improves rescue pulse steadiness, suppresses bolt pressure slightly, and names the promise in Habitat Scout, battle forecasts, opening cues, and Rescue Debrief. If the player answers that promised line with another calm capture or careful retreat, the lead earns an extra bond mark; origin promises pay two extra marks because the returning Vivo is holding a stronger home-pressure read.
- Rescue promises now also respond to `Calm Signal` inside the promised battle: spending the calm turn exposes the wild target slightly, or more strongly for an origin promise, and prevents the immediate retaliation from bolting so the player can convert route-side stewardship into a visible rescue window instead of only receiving hidden capture math.
- Promise-backed `Calm Signal` now names the actual pin when it prevents a wild bolt: the battle log and on-canvas tempo cue distinguish `Rescue promise pin` from the stronger `Origin promise pin` before the wild Vivo acts, so the player can tell the route promise bought a playable rescue beat.
- Promise-backed `Calm Signal` also grants the active lead once-per-battle habitat bond growth when the promised calm turn is spent: one mark for a normal rescue promise and two marks for an origin promise, with command chips and battle-log copy naming the promised bond payout before and after commitment.
- Wild escape pressure in normal encounters, so flighty or badly pressured Vivos can bolt if the player overextends damage, burns turns on setup, or spooks them with a failed rescue pulse
- Wild retreat flow, so route training does not trap the player in every bad matchup and faster or cleaner lines can disengage more reliably
- Recovery-anchor flow, so a full wipe now falls back to the last sanctuary refuge or caretaker stop the player deliberately stabilized instead of always hard-resetting to the opening town bridge, and the player must always regain control after the battle closes
- Party growth through XP, level-ups, move learning, lead switching, and element-triggered form checks
- Four-move mastery with explicit field-study choices once a Vivo outgrows its current loadout, so pre-gym move planning is a player decision instead of an automatic overwrite
- Battle XP now follows the bonded-team fantasy: the Vivo that lands the win gets the full payout, earlier field participants share a strong support cut, and other conscious party members receive a smaller witness cut so six-slot roster play stays viable in the first gym slice
- Attack styles now split into impact and focus lanes, so Lumen Corvus's light-pressure tools can scale from its higher focus bias instead of using the same offense formula as Dogemox
- First transformation proof: Dogemox can become `Ignis Canis` on the same level-up sequence that also satisfies its required fire victory
- Form-payoff proof: `Ignis Canis`, `Astra Corvus`, and `Lunaris Bufo` now grant authored stat bonuses and immediately surface their signature finishers as live move rewards, so awakening a bond path changes the first-gym tactics layer instead of only changing portrait and element text
- Steel wolf proof: `Grimweld` now adds a steel-element puppy-to-mount evolution line, rare wild availability in `Glassroot Burrow`, a steel-attuned `Ironroot Seam`, immediate evolved signature attacks (`Lockjaw Bite` and `Anvil Pounce`), and an `Ironjaw Lupus` gym-ring opponent through `Gym Keeper Pella`
- Early tactical roles: Dogemox can brace with `Guard Howl`, Mossprig can create openings with `Root Snare`, and Lumen Corvus can set up burst turns with `Prism Veil`
- Early bond-instinct proof: Dogemox now auto-braces once when pushed below half HP, Mossprig's first expose setup knits back a little HP, Lumen Corvus turns primed focus attacks into sharper bursts, Needlehare steals tempo plus extra damage against exposed targets, Fenlight gathers a steadier luminous burst behind its first guard, and Grimweld's Iron Defiance can punish guarded hits by exposing the attacker.
- Authored trainer tactics now sit on top of those move roles, letting key opponents score attacks, prefer support setups, and counter-switch into better matchups instead of standing still in bad ones
- Trainer counter-switches now fully retarget queued enemy-facing moves onto the Vivo that actually enters the field, so adaptation battles do not ghost-hit a partner that already withdrew
- Deterministic combat-presentation debug support now exists through `debugBattleShowcase=<event,event,...>`, so automation can capture live battle-feedback states without having to land a precise mid-turn input sequence by hand
- Trainer ramp proof: route and gym warmup trainers now lead the player from habitat reading into Senka's adaptation-focused battle
- Trainer progression proof: Nursery Tender Sola now truly keeps Lantern Nursery's east gate shut until the player clears the switch-training warmup, Warden Nera now truly opens the Ember Hollow climb after the first route lesson, Gym Keeper Pella now physically unlatches the inner Briar Gym lane, and Senka now holds the badge trial itself until the player has both cleared one outer-route mentor and awakened one active Vivo form
- Sanctuary checkpoint proof: Warden Nera, Burrow Warden Tovin, and Patrol Auditor Rhis now also carry explicit battle lessons, so the route climb, hidden burrow stair, and post-gym town defense only clear when the player proves the intended rescue-bond tactic instead of brute-forcing a win
- Moonfen lesson proof: `Moonfen Keeper Orla` now checks for a real focus-style attack landing after the line steadies, making the wetland mentor teach calm-then-burst battle execution instead of rewarding setup-only play
- Lesson-growth proof: authored trainer lessons now only cash out full elemental victory progress and full bonded-team XP after the named tactic is satisfied in the winning run; unfinished spar wins only pay reduced practice XP so the first gym route still asks for strategy instead of brute-force trainer farming
- Lesson-debrief proof: the overworld journal now preserves the latest trainer-battle lesson outcome, including held versus missing checklist items and the next corrective step, so route and gym gates stay readable after the fight ends
- First gym proof: `Leader Senka` can now be challenged inside `Briar Gym` only after the route has already changed the roster in a visible way, with a two-Vivo adaptive team built around exposed targets, prepared follow-up hits, and counter-switching that preserves her best answer to the player's current lead
- Post-gym fallout proof: beating Senka now immediately surfaces `Patrol Auditor Rhis` in `Briar Town`, turning the confiscation premise into a live badge-gated battle instead of a background note
- Rescue-from-trainers proof: authored trainer rewards can now release a seized Vivo directly into the player's roster flow, and Rhis uses that path to hand back a confiscated `Needlehare` after the patrol loses control of the square
- Trainer-released Vivos can now carry an authored rescue-memory source and release bond marks, so Rhis's seized `Needlehare` remembers `Sanctuary Trail` after joining and can participate in the same route-memory planning loop as wild and sanctuary rescues
- Briar Town now exposes a `Sanctuary Ledger` reserve-management point so rescued Vivos can rotate into the active six before route pushes and gym attempts
- Briar Town now also exposes a `Caretaker Hearth` recovery stop, giving the first playable a story-grounded heal point before route pushes and gym retries
- `Lantern Nursery` now guarantees one authored `Mossprig` rescue beat in the training ring, and that rescue asks the player to guard once before finishing an exposed target so the first support-line partner joins through a real calming tactic
- `Glassroot Burrow` now guarantees one authored `Lumen Corvus` rescue beat near the glow pools, and that rescue asks for focus setup plus a focus-style attack so the light-corvid line is earned through controlled light pressure instead of route RNG
- `Sanctuary Trail` now also guarantees one authored `Needlehare` rescue beat in the sungrass bend, and that rescue asks for a switch plus an exposed finish so the fast neutral skirmisher teaches pacing before joining
- `Sanctuary Trail` now also stages the first route-side confiscation audit through `Trail Auditor Vale` after Lantern Nursery clears, turning government pressure into an early playable guard-and-habitat-proof battle instead of waiting until the post-gym Rhis standoff

This runtime uses authored painterly blockout Vivos for readability and system proving. `Briar Town`, `Lantern Nursery`, `Sanctuary Trail`, `Glassroot Burrow`, `Starglass Roost`, `Ember Hollow`, and `Briar Gym` have now crossed into production-scene proof, while creature presentation is still not at the final imagegen-produced production art target.

Current exception:

- World traversal now has a first authored field-presence pass, but future towns, facilities, and routes should keep replacing generic token logic with richer per-scene character, prop, and creature presentation that matches the production paintings more closely.
- Creature presentation now has battle-portrait proof, but field sprites, roster portraits, and Codex-style creature plates still need the same controlled imagegen production pass.
- Creature presentation now has battle-portrait proof for `Needlehare` as well, but field sprites and dedicated Codex-style multi-creature plates still need the same controlled imagegen production pass.
- The DOM journal now surfaces portrait-backed roster cards with registry naming and bond-mark summaries, but field sprites and dedicated Codex-style creature plates still need the same controlled imagegen production pass.
- Battle presentation now has backdrop proof for the current vertical-slice scenes, but future routes and civic interiors should keep adding dedicated battle paintings so scene identity survives the transition from traversal into combat.
