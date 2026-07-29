# Anima Codex Biome And Scene Roadmap

This roadmap defines future explorable scenes and biomes for `Anima Codex`. It is meant to guide imagegen scene batches, runtime scene metadata, encounter tables, elemental attunement, creature-line planning, and gym-route structure.

The target is not just more backgrounds. Each new combat-capable scene should become a paired exploration-and-battle location with walkable lanes, collision, exits, encounter zones, at least one reason to explore, and creature or transformation hooks that can support future elemental Vivos.

## Scene Packet Requirements

Every new scene should be planned as one packet before production art is generated:

Scene image production rules are locked in [`docs/scene_art_requirements.md`](scene_art_requirements.md). Use that document for dimensions, separate exploration/battle file requirements, camera expectations, and same-place landmark validation.

- Exploration painting: top-down or high three-quarter painted scene with readable walk lanes, exits, obstacles, encounter patches, and landmarks.
- Battle backdrop: same location from a closer fight angle with one player-side lane, one enemy-side lane, and a shared landmark from the exploration scene.
- Gameplay metadata: walkable region, collision blockers, exits, encounter zones, interactables, trainers or rescues, recovery points when needed, and battlefield condition.
- Elemental pressure: primary element, secondary element if useful, and any attunement landmark.
- Creature hooks: native existing Vivos, placeholder future lines, rarity role, and whether the route supports capture, rescue, trainer release, or form change.
- Exploration payoff: shortcut, rare Vivo, rescue event, gym prep lesson, recovery anchor, story pressure, or transformation landmark.

## Current World Coverage

These scenes are already established production or production-proof locations:

| Scene | Biome Role | Element Hooks | Notes |
| --- | --- | --- | --- |
| Briar Town | hub town and public pressure space | neutral | recovery, sanctuary ledger, confiscation pressure, gym access |
| Lantern Nursery | sanctuary prep and training refuge | grass, light | early rescue training, Mossprig rescue, route gate lesson |
| Sanctuary Trail | overgrown sanctuary route | neutral, grass, fire | early wilds, Needlehare rescue, audit pressure |
| Glassroot Burrow | hidden root cave refuge | steel, light | Lumen Corvus rescue, Grimweld rarity, burrow shortcut |
| Quartzroot Vault | mineral cave system | steel, stone, light | larger cave route, Grimweld/Basalthorn habitat, quartz-root battle backdrop |
| Tideglass Grotto | flooded water cave | water, light, stone | water-cave route, Mirejaw/Tidecalf habitat, waterfall battle backdrop |
| Moonmilk Cavern | quiet limestone healing cave | water, stone, light | gentle cave screenshot scene, Fenlight/Tidecalf habitat, moonmilk basin battle backdrop |
| Prismfall Cavern | prismatic crystal cave | light, stone, steel | crystal-cave route, Prismkid/Grimweld habitat, split-spire battle backdrop |
| Prismfall Ravine | prismatic canyon waterfall | stone, light, water | rainbow waterfall screenshot route, Prismkid/Tidecalf habitat, mist-bridge battle backdrop |
| Starglass Roost | luminous observatory upland | light | Lumen Corvus, Prismkid, Lanterncat, light attunement |
| Echobloom Canopy | bioluminescent living forest | grass, light, water | alien-nature screenshot scene, Mossquirl/Fenlight habitat, living-root battle backdrop |
| Lumenveil Grove | nocturnal bioluminescent forest | light, grass, water | glowing forest screenshot scene, Fenlight/Lanterncat habitat, mirror-pool battle backdrop |
| Ember Hollow | warm basalt pocket | fire, grass | Dogemox fire route, Ignis Canis proof |
| Magmaheart Caldera | molten volcanic basin | fire, stone, grass | magma route, Magmadon/Cinderhoof habitat, heart-vent battle backdrop |
| Basalt Bloom Caldera | cooled volcanic flower crater | fire, grass, stone | volcanic bloom screenshot scene, heat-vine habitat, bloom-fracture battle backdrop |
| Cinderlake Basin | broad magma lake | fire, stone, grass | magma-lake screenshot scene, Magmadon habitat, lake-rim battle backdrop |
| Cindershore Strand | black glass-sand magma beach | fire, stone, grass | magma-beach screenshot scene, tide-pool and heatglass shell habitat |
| Asterwake Shoals | living starfish beach | water, light, neutral | starfish-beach screenshot scene, Bellcrab/Reedotter habitat, five-point tidepool battle backdrop |
| Sunspindle Dunes | heat-glass sand crossing | stone, fire, neutral | desert screenshot scene, Basalthorn/Bouldermaw habitat, future sand-form landmark |
| Redglass Saltpan | surreal dried salt lake | fire, stone, light | pink salt and red mineral-crust screenshot scene, mirage/sun transformation habitat |
| Thunderhead Mesa | storm desert plateau | electric, stone, future flying | dramatic storm screenshot scene, Voltpip/Stormwool/Lumen Corvus habitat, lightning-rod battle backdrop |
| Moonfen Marsh | calm wetland refuge | water, light, grass | Fenlight, Tidecalf, water attunement, rescue calm |
| Mirrorfen Flats | glass-still reflective wetland | water, future psychic, neutral | mirror-pool screenshot scene, focus/illusion pressure, amphibian and trickster habitat |
| Mireglass Swamp | deep blackwater swamp | water, grass, future poison | dedicated swamp route and fight scene, Mirejaw/Glarefin habitat |
| Frostglass Orchard | frozen crystal-fruit orchard | future ice, grass, water | winter screenshot scene, frostgrass habitats, future ice-form landmark |
| Aurorashard Tundra | aurora crystal polar plain | ice, light | aurora screenshot scene, ice/light habitat, crystal-ridge battle backdrop |
| Coppervine Runoff | charged drainage channel | future electric, water, grass | wet blue/copper screenshot scene, charged runoff habitats, future electric-form landmark |
| Gloamrail Cut | abandoned rail trench | shadow, neutral | moody rail route, Shadecub habitat, shadow attunement landmark |
| Sporebell Garden | gorgeous spore flower field | future poison, grass | beautiful-but-unsafe garden route, Venivy habitat, future poison-form landmark |
| Cadence Lab Annex | reclaimed containment facility | electric, light, future poison | engineered-life money shot, Voltpip/Venivy habitat, lab-origin hooks |
| Briar Gym | first gym interior | grass, light, neutral | adaptation lesson, Senka battle |

## Near-Term Expansion Spine

These are the next scenes that should be created before the world sprawls. They widen elemental coverage while staying close enough to the first playable that they can feed actual battles and captures.

| Scene Id | Scene Name | Biome | Primary Elements | Why It Exists |
| --- | --- | --- | --- | --- |
| `gloamrailCut` | Gloamrail Cut | abandoned rail trench, thorn shadows | shadow, neutral | Implemented as the first outdoor shadow route branching from Glassroot Burrow. |
| `coppervineRunoff` | Coppervine Runoff | rain gutters, conductive vines, puddled machine runoff | electric, water | Introduces electric pressure without making a hard sci-fi lab yet. |
| `frostglassOrchard` | Frostglass Orchard | frozen fruit rows, glassy frost grass, silent scarecrows | ice, grass | Opens ice forms through beauty and unease instead of generic snowfields. |
| `aurorashardTundra` | Aurorashard Tundra | aurora-lit snow plains, broken crystal ridges, blue ice veins | ice, light | Implemented as a polar screenshot extension from Frostglass Orchard, carrying ice forms into a more cinematic light-pressure route. |
| `quartzrootVault` | Quartzroot Vault | mineral cave network, quartz roots, blue pools | steel, stone, light | Implemented as the first larger cave-system route branching from Glassroot Burrow. |
| `tideglassGrotto` | Tideglass Grotto | flooded cave channels, stepping stones, blue-glass waterfall | water, light, stone | Implemented as the first dedicated water-cave route branching from Quartzroot Vault. |
| `moonmilkCavern` | Moonmilk Cavern | pale mineral pools, limestone curtains, blue fungi, glassy shelves | water, stone, light | Implemented as a calm limestone healing cave branching from Tideglass Grotto. |
| `prismfallCavern` | Prismfall Cavern | rainbow crystal spires, mirror pools, faceted shelves | light, stone, steel | Implemented as the first dedicated prismatic crystal-cave route branching from Quartzroot Vault. |
| `prismfallRavine` | Prismfall Ravine | rainbow waterfalls, mineral shelves, mist bridge, glowing pool | stone, light, water | Implemented as an outdoor prismatic canyon extension branching from Prismfall Cavern. |
| `echobloomCanopy` | Echobloom Canopy | spiral root terraces, blue bell flowers, listening moss | grass, light, water | Implemented as the first bioluminescent alien-nature route branching from Starglass Roost. |
| `lumenveilGrove` | Lumenveil Grove | glowmoss lanes, lantern mushrooms, mirror pool | light, grass, water | Implemented as the nocturnal bioluminescent forest extension branching from Echobloom Canopy. |
| `clayhornRavine` | Clayhorn Ravine | clay cliffs, fossil roots, hoof-carved switchbacks | earth, steel | Supports bulky herd, burrow, and mineral Vivos after the player learns basic team rotation. |
| `sporebellGarden` | Sporebell Garden | overgrown flower field with pulsing pollen bells | grass, poison | Implemented as a nursery-side poison-support garden using live grass mechanics for now. |
| `tidegateCauseway` | Tidegate Causeway | river crossing, sluice gates, wet stone paths | water, electric | Turns water travel into authored scene traversal before any full surf-like system exists. |
| `asterwakeShoals` | Asterwake Shoals | living starfish beach, five-point tidepool, shell paths | water, light, neutral | Implemented as the first dedicated starfish-beach route branching from Tidegate Causeway. |
| `mirrorfenFlats` | Mirrorfen Flats | still mirror pools, floating seed pods, silver reeds | water, neutral, future psychic | Implemented as a dreamlike wetland extension branching from Moonfen Marsh, using focus-surge mechanics until psychic exists. |
| `mireglassSwamp` | Mireglass Swamp | blackwater pools, cypress knees, lantern fungus | water, grass, poison | Implemented as the first dedicated true-swamp route and fight scene. |
| `magmaheartCaldera` | Magmaheart Caldera | magma rivers, black basalt causeways, obsidian ribs | fire, stone, grass | Implemented as the dedicated magma biome branching from Ember Hollow. |
| `basaltBloomCaldera` | Basalt Bloom Caldera | cooled crater, red heat flowers, ember moss, cracked basalt plates | fire, grass, stone | Implemented as a volcanic flower side route branching from Magmaheart Caldera. |
| `cinderlakeBasin` | Cinderlake Basin | broad magma lake, crescent basalt causeway, heat-cage lanterns | fire, stone, grass | Implemented as the magma-lake extension branching from Magmaheart Caldera. |
| `cindershoreStrand` | Cindershore Strand | black glass-sand beach, molten surf, basalt tide pools | fire, stone, grass | Implemented as the magma-beach extension branching from Cinderlake Basin. |
| `sunspindleDunes` | Sunspindle Dunes | amber heat-glass, fossil-root arches, blue shade awnings | stone, fire, neutral | Implemented as the first dedicated sand-dune route and fight scene branching from Ember Hollow. |
| `redglassSaltpan` | Redglass Saltpan | pink salt flats, red glass crust, half-swallowed ruins, heat shimmer | fire, stone, light | Implemented as a surreal desert saltpan branch from Sunspindle Dunes. |
| `thunderheadMesa` | Thunderhead Mesa | storm clouds, lightning rods, dry grass, wind-carved stone towers | electric, stone, future flying | Implemented as a high-desert storm plateau branching from Sunspindle Dunes. |
| `cadenceLabAnnex` | Cadence Lab Annex | quiet containment lab overtaken by nursery plants | electric, light, poison | Implemented as the first explicit engineered-life facility, using live electric/light mechanics and future poison pressure. |
| `mournrootSanctum` | Mournroot Sanctum | old shrine roots, blue-black leaves, memorial lanterns | dark, light | Makes cursed-looking spaces emotionally tender, not purely evil. |

## Long-Term Biome Families

### Green Sanctuary Biomes

Purpose: early safety, grass attunement, rescue lessons, and bondable-but-dangerous juvenile Vivos.

Candidate scenes:

- `bramblegateCommons`: town-edge green route with bramble arches, confiscation notices half-covered by vines, common grass and neutral encounters.
- `sporebellGarden`: implemented flower field where pollen bells create poison-support terrain and teach the player that beautiful habitats can still be dangerous.
- `elderfernSteps`: terraced old-growth steps leading toward a midgame forest gym or sanctuary.

Creature hooks:

- Existing: Mossprig, Needlehare, Dogemox.
- Future: Flora Cervus deer line, Venom Erinaceus hedgehog line, Flora Mantodea mantis line.

Battlefield condition ideas:

- `Pollen Veil`: poison and grass support moves last longer, but reckless impact attacks slightly raise wild bolt pressure.
- `Rooted Lane`: grass attacks and expose setups hold more cleanly.

### Luminous And Observatory Biomes

Purpose: light forms, focus tactics, prism organs, careful setup battles, and rare elegant Vivos.

Candidate scenes:

- `starglassRoost`: current light-route proof.
- `prismbellTerrace`: a higher observatory garden where glass bells hum with wind and light.
- `auroraSwitchyard`: abandoned signal towers that bend dawn light across old rails.

Creature hooks:

- Existing: Lumen Corvus, Prismkid, Lanterncat, Fenlight.
- Future: Lumen Vulpes fox line, Lumen Cervus stag line, Lumen Papilio moth line.

Battlefield condition ideas:

- `Prism Draft`: light focus setups intensify, and focused light attacks hit harder.
- `Signal Gleam`: faster Vivos get clearer turn-order reads, supporting speed lessons.

### Fire, Ash, And Heat Biomes

Purpose: Dogemox and Ignis Canis transformation pressure, bold impact battles, heat-risk rescue pacing, and warm industrial edges.

Candidate scenes:

- `emberHollow`: current fire-route proof.
- `kilnrootWorks`: old ceramic works where roots grow through warm brick ovens.
- `ashpetalSlope`: flowered volcanic hillside with ash brush and hot springs.

Creature hooks:

- Existing: Dogemox, Ignis Canis.
- Future: Ignis Mustela marten line, Ignis Chiroptera ash-bat line, Ignis Salamandra ember-newt line.

Battlefield condition ideas:

- `Ember Current`: fire attacks hit harder while vents breathe hot.
- `Heat Nerve`: wild Vivos bolt faster if rescue pulses fail, but Calm Signal has stronger value.

### Wetlands, Rivers, And Tide Pools

Purpose: water forms, rescue calm, slow powerful Vivos, careful retreat, and travel through boardwalks and causeways.

Candidate scenes:

- `moonfenMarsh`: current wetland proof.
- `tidegateCauseway`: river crossing with sluice gates, mossed stones, and patrol-control hardware at the far bank.
- `brackenthreadDocks`: quiet dock settlement where sanctuary boats hide rescued Vivos under reed awnings.

Creature hooks:

- Existing: Fenlight, Tidecalf, Tidehorn Bubalus.
- Future: Aqua Lutra otter line, Aqua Cancer crab line, Aqua Canis river-dog form.

Battlefield condition ideas:

- `Stillwater Calm`: capture attempts hold more easily and wild Vivos flee less often.
- `Tide Pull`: heavy impact moves gain value after guard turns, supporting slow bruisers.

### Mineral, Cave, And Earth Biomes

Purpose: steel and earth lines, hidden refuges, shortcuts, bulky battle roles, and underground sanctuary pressure.

Candidate scenes:

- `glassrootBurrow`: current burrow proof.
- `clayhornRavine`: open ravine with hoof paths, clay cliffs, and fossil-root shelves.
- `quartzrootVault`: midgame cave where mineral growths behave like living organs.

Creature hooks:

- Existing: Grimweld, Ironjaw Lupus.
- Future: Terra Capra ram line, Ferrum Cervus antler line, Terra Testudo tortoise line.

Battlefield condition ideas:

- `Ironroot Seam`: steel and guarded impact lines punish reckless attacks.
- `Clay Anchor`: switching is safer, but speed advantages matter less.

### Ice And Frost Biomes

Purpose: ice forms, quiet danger, brittle terrain, and weather-shaped evolution without relying on generic snowy fields.

Candidate scenes:

- `frostglassOrchard`: frozen orchard with crystal fruit, frost grass, and old caretaker signs.
- `snowmeltHollow`: thawing cave where ice and water attunement overlap.
- `whitebellPass`: mountain pass with soft bells, white reeds, and patrol lanterns dimmed by snow.

Creature hooks:

- Future: Glacies Lepus snow hare line, Glacies Corvus winter raven form, Glacies Ursus cub line.

Battlefield condition ideas:

- `Frost Nerve`: expose states last longer, but failed rescue pulses make wilds more likely to bolt.
- `Snowmelt Guard`: water and ice moves gain extra value after a guard turn.

### Electric And Storm Biomes

Purpose: electric forms, fast pressure, turn-order lessons, conductive habitats, and machine-runoff routes that are still organic.

Candidate scenes:

- `coppervineRunoff`: conductive vines, rain puddles, and old sensor posts.
- `stormreedPylon`: wet reed field under humming towers.
- `batteryMossSubstation`: overgrown civic substation where moss stores charge like a living battery.

Creature hooks:

- Future: Fulgur Lepus electric hare form, Fulgur Muris mouse line, Fulgur Corvus storm-corvid form.

Battlefield condition ideas:

- `Copper Static`: electric attacks may sharpen speed reads or expose guarded targets.
- `Stormstep`: switching into electric terrain grants one tempo cue but raises wild escape pressure.

### Dark, Cursed, And Memorial Biomes

Purpose: shadow forms, government fear, emotionally heavy rescue spaces, and dangerous-but-bondable nocturnal creatures.

Candidate scenes:

- `gloamrailCut`: overgrown rail trench with shadow grass, warning lamps, and patrol signs.
- `mournrootSanctum`: memorial roots, black leaves, blue lanterns, and sanctuary names carved into stones.
- `inkcapUnderpass`: town underpass where fungal caps and old civic murals make a safe-looking route feel watched.

Creature hooks:

- Existing runtime hook: Shadecub / Noctis Panthera assets should belong here once their species data and encounter placement are formalized.
- Future: Noctis Felis shadow-cat line, Noctis Vulpes fox line, Umbra Strix owl line.

Battlefield condition ideas:

- `Gloam Cover`: dark attacks and switch-ins gain value, but unguarded rescues feel less stable.
- `Memorial Quiet`: Calm Signal is stronger, and knockouts should feel narratively discouraged.

### Labs, Civic Spaces, And Containment Biomes

Purpose: story pressure, escaped engineered Vivos, government confiscation, poison or electric forms, and major authored rescues.

Candidate scenes:

- `cadenceLabAnnex`: implemented overgrown containment annex with nursery plants breaking through glass.
- `registryCourt`: civic filing hall where confiscation hearings become trainer battles.
- `whitecoatDepot`: patrol supply depot with restraint gear at the edges and rescued Vivos hiding in service tunnels.

Creature hooks:

- Future: synthetic poison moth line, electric mouse line, unstable neutral chimeric line, rare lab-origin forms for existing species.

Battlefield condition ideas:

- `Containment Echo`: wild Vivos start more volatile, but rescue memory has a stronger calming effect.
- `Audit Floor`: trainer battles reward switching and guarding under public pressure.

## First 20 New Scene Targets

These should be treated as the next major world-expansion batch. They are ordered to add elemental coverage and route variety while still supporting the first playable's rescue, leveling, and gym-prep loop.

1. `gloamrailCut` - implemented as the first outdoor shadow route for Shadecub and future Noctis forms.
2. `coppervineRunoff` - implemented as the first electric-water visual route, with water/grass mechanics until electric becomes a live element.
3. `frostglassOrchard` - implemented as the first ice-grass visual route, with grass/water mechanics until ice becomes a live element.
4. `clayhornRavine` - earth-steel ravine for bulky herd and mineral lines.
5. `sporebellGarden` - implemented as the first grass-poison visual route, with grass mechanics until poison becomes a live element.
6. `tidegateCauseway` - water crossing that connects Moonfen to a wider region.
7. `cadenceLabAnnex` - implemented as the first containment facility with electric/light mechanics and escaped lab-origin visual hooks.
8. `mournrootSanctum` - dark-light memorial sanctuary with gentler cursed tone.
9. `kilnrootWorks` - fire-industrial route that expands Ignis Canis pressure.
10. `brackenthreadDocks` - river dock refuge and water roster expansion point.
11. `prismbellTerrace` - higher light route for evolved Lumen encounters.
12. `batteryMossSubstation` - overgrown electric civic utility scene.
13. `quartzrootVault` - mineral cave for steel and earth forms.
14. `snowmeltHollow` - ice-water cave with thaw pressure.
15. `inkcapUnderpass` - dark-poison civic underpass near town.
16. `elderfernSteps` - forest ascent toward a later grass or sanctuary gym.
17. `stormreedPylon` - storm field that teaches speed and switching pressure.
18. `registryCourt` - civic battle interior for confiscation hearings.
19. `ashpetalSlope` - fire-grass hillside with safer heat training than Ember Hollow.
20. `whitebellPass` - mountain pass that opens the next region after first-gym fallout.

## Latest Production Scenes

`redglassSaltpan` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down dried lakebed with a central cracked red-glass mineral crust, broad pink salt polygons, blue-white mirage reflection pools, a lower-left caretaker shade marker, and half-swallowed ruin arches across the upper-right flats.
- Battle backdrop: lower saltpan fight scene with the same red-glass sheet, cracked pink salt foreground, blue-white light veins, caretaker shade marker, sanctuary waystone, and ruin arches carried into combat.
- Runtime metadata: branches from `Sunspindle Dunes`, returns through the left saltpan trail, and uses `redglassCrust`, `pinkSaltMirage`, and `ruinSaltFlats` encounter zones.
- Primary element: fire.
- Secondary elements: stone and light, representing the requested earth / light pressure through live runtime elements.
- Native hooks: Magmadon, Cinderhoof, Dogemox, Embermarten, Ashbat, Basalthorn, Prismkid, Glintmoth, Lumen Corvus, Lanterncat, Needlehare, Bouldermaw, and Grimweld.
- Battlefield condition: `Redglass Mirage`, a fire boost that makes sun glare and red mineral crust feel like a transformation pressure.
- Payoff: a surreal desert screenshot biome that is distinct from Sunspindle's sand dunes and Thunderhead Mesa's storm plateau.

`moonmilkCavern` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down quiet limestone cave with a central moonmilk basin, pale mineral pools, dripping white curtains, soft blue fungi, glassy water shelves, caretaker lanterns, and a half-buried sanctuary waystone.
- Battle backdrop: lower limestone fight scene with the same moonmilk healing basin, white mineral curtains, blue fungi, crescent glassy shelf, lantern cluster, and waystone carried into combat.
- Runtime metadata: branches from `Tideglass Grotto`, returns through the left cave shelf, and uses `moonmilkBasinRim`, `blueFungusBeds`, and `limestoneShelfPockets` encounter zones.
- Primary element: water.
- Secondary elements: stone and light, representing the requested rock / fairy-light pressure through live runtime elements.
- Native hooks: Fenlight, Tidecalf, Glarefin, Bellcrab, Reedotter, Mirecub, Glintmoth, Lanterncat, Prismkid, Basalthorn, Bouldermaw, and Grimweld.
- Battlefield condition: `Moonmilk Stillness`, a capture-calm field that makes the cave feel restorative and good for gentle nocturnal forms rather than dangerous.
- Payoff: a quiet ancient healing-cave screenshot biome that is distinct from Tideglass's flooded channels, Quartzroot's mineral network, and Prismfall's high-spectacle crystals.

`thunderheadMesa` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down high desert mesa with permanent storm clouds, wind-carved orange stone towers, caretaker lightning rods, blue-white ground charge, dry grass patches, charged dust lanes, a storm vane, and a half-buried sanctuary waystone.
- Battle backdrop: lower storm-plateau fight scene with the same lightning rod array, twin stone towers, thunderhead cloud bank, electric ground veins, dry grass, storm vane, and waystone carried into combat.
- Runtime metadata: branches from `Sunspindle Dunes`, returns through the left mesa trail, and uses `chargedDustRun`, `stormgrassPatches`, and `windTowerShelves` encounter zones.
- Primary element: electric.
- Secondary elements: stone and future flying pressure through storm-bird habitat framing.
- Native hooks: Voltpip, Stormwool, Needlehare, Lumen Corvus, Glintmoth, Ashbat, Basalthorn, Bouldermaw, Cinderhoof, and Dogemox.
- Battlefield condition: `Thunderhead Static`, an electric boost that makes blue-white storm charge crawl through dry grass and cracked orange stone.
- Payoff: a storm-desert screenshot biome with dramatic blue lightning against orange rock, distinct from Sunspindle's dry heat-glass dunes and Coppervine's wet runoff electricity.

`asterwakeShoals` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down low-tide beach with pale sand paths, shallow turquoise pools, a crescent driftwood arch wrapped in living starfish, a luminous five-point tidepool, shell beds, black rocks, tidegrass, a caretaker lantern, and a half-buried sanctuary waystone.
- Battle backdrop: lower coastal fight scene with the same crescent starfish driftwood arch, luminous five-point tidepool, caretaker lantern, sanctuary waystone, tidegrass, shell beds, black rocks, and living starfish clusters carried into combat.
- Runtime metadata: branches from `Tidegate Causeway`, returns through the left beach trail, and uses `starfishNurseryBeds`, `fivePointTidepool`, and `shellTidegrass` encounter zones.
- Primary element: water.
- Secondary elements: light and neutral.
- Native hooks: Bellcrab, Reedotter, Tidecalf, Fenlight, Mirejaw, Glarefin, Prismkid, Lanterncat, Glintmoth, Lumen Corvus, Mirecub, Needlehare, and Dogemox.
- Battlefield condition: `Starwake Tide`, a water boost that makes engineered starfish beds and five-point tide pools carry pressure through the beach.
- Payoff: a bright coastal screenshot biome that reads as a starfish habitat instead of a generic beach or another wetland.

`prismfallRavine` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down prismatic ravine with stacked mineral waterfall shelves, rainbow mist, a narrow bridge, glowing turquoise pool, faceted violet-blue cliff walls, mossy ledges, and bronze caretaker posts.
- Battle backdrop: lower canyon fight scene with the same prism waterfall, mist bridge, turquoise pool, faceted cliffs, slick wet stone, moss patches, and caretaker lamps carried into combat.
- Encounter zones: `rainbowMistBridge`, `turquoisePoolRim`, and `mossGlassLedges`.
- Primary element: light.
- Secondary elements: water and stone.
- Native hooks: Prismkid, Lumen Corvus, Lanterncat, Glarefin, Tidecalf, Fenlight, Mirejaw, Basalthorn, Bouldermaw, Grimweld.
- Payoff: magical-nature screenshot biome that reads instantly as a rainbow waterfall canyon while expanding Prismfall beyond cave interiors.

`lumenveilGrove` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down nocturnal bioluminescent forest with teal glowmoss lanes, a luminous root arch, mirror pool, giant blue lantern mushrooms, violet spore pods, warm caretaker lanterns, and sanctuary waystones.
- Battle backdrop: lower glowing-forest fight scene with the same luminous root arch, giant blue mushrooms, mirror pool, violet spore pods, caretaker lantern, sanctuary waystone, and glowmoss lane carried into combat.
- Runtime metadata: branches from `Echobloom Canopy`, returns through the left glowmoss trail, and uses `glowmossLane`, `lanternMushroomBeds`, and `mirrorPoolRim` encounter zones.
- Primary element: light.
- Secondary elements: grass and water.
- Native hooks: Fenlight, Lumen Corvus, Prismkid, Lanterncat, Mossprig, Mossquirl, Venivy, Snapmaw, Tidecalf, Mirejaw, Glintmoth, and Needlehare.
- Battlefield condition: `Lumenveil Gleam`, a light boost that makes the living mushrooms and mirror pool carry light pressure through the grove.
- Payoff: a dedicated bioluminescent forest screenshot biome that feels darker, more nocturnal, and more fungal than Echobloom Canopy.

`mirrorfenFlats` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down reflective wetland with an S-shaped pale mudflat path, crescent mirror pool, silver reed curtains, floating seed-pod islands, half-submerged caretaker mirror post, and an upside-down tree silhouette under the water.
- Battle backdrop: lower wetland fight scene with the same crescent mirror pool, seed-pod islands, silver reeds, amber mirror post, and submerged upside-down tree silhouette carried into combat.
- Runtime metadata: branches from `Moonfen Marsh`, returns through the lower-left mudflat path, and uses `crescentMirrorPool`, `floatingSeedPods`, and `silverReedCurtain` encounter zones.
- Primary live elements: water, neutral, and light as a psychic-like illusion stand-in.
- Future element pressure: psychic, once the runtime adds that type.
- Native hooks: Fenlight, Tidecalf, Mirecub, Mirejaw, Glarefin, Needlehare, Prismkid, Lanterncat, Mossprig, Venivy, Lumen Corvus, and Dogemox.
- Battlefield condition: `Mirrorfen Veil`, an elementless focus-surge condition that rewards waiting through false reflections before striking.
- Payoff: a beautiful, eerie mirror-wetland screenshot biome that feels dreamlike without becoming unreadable as a walking board.

`basaltBloomCaldera` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down cooled volcanic crater with a looped basalt path, crescent ring of cracked plates, central red bloom fracture, steam vent heat cages, heat-vine mats, ember moss, and a half-buried sanctuary waystone.
- Battle backdrop: lower crater fight scene with the same central red bloom fracture, cracked basalt ring, steam cages, vine crossing, ember moss, lava-lit cracks, and sanctuary waystone carried into combat.
- Runtime metadata: branches from `Magmaheart Caldera`, returns through the lower-left crater path, and uses `redBloomFracture`, `emberMossVents`, and `crackedBasaltShelves` encounter zones.
- Primary elements: fire, grass, and stone.
- Native hooks: Mossprig, Mossquirl, Venivy, Snapmaw, Cinderhoof, Magmadon, Embermarten, Embernewt, Ashbat, Basalthorn, Bouldermaw, and Grimweld.
- Battlefield condition: `Basalt Bloom`, a grass boost that makes heat-loving vines and red bloom roots the main identity instead of another pure lava field.
- Payoff: a volcanic biome that reads as dangerous living crater ecology rather than a generic lava cave.

`aurorashardTundra` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: high three-quarter aurora tundra with an S-shaped packed-snow lane, crescent crystal ridge, glowing blue ice-vein path, frostgrass meadow, three amber caretaker posts, and a bent polar tree limb.
- Battle backdrop: lower fight scene with the same crescent crystal ridge, blue ice veins, amber caretaker posts, frostgrass foreground, bent polar tree limb, and green-pink aurora sky carried into combat.
- Runtime metadata: branches from `Frostglass Orchard`, returns to the orchard through the lower-left snow trail, and uses `frostgrassMeadow`, `blueIceVein`, and `auroraShardFlats` encounter zones.
- Primary elements: ice and light.
- Native hooks: Snowshade, Rimeboar, Glarefin, Frosthulk, Gloomtusk, Prismkid, Lumen Corvus, Lanterncat, and Needlehare.
- Battlefield condition: `Aurorashard Gleam`, a light focus-surge condition that rewards careful setup under aurora-reflected crystal glare.
- Payoff: a polar aurora screenshot biome that extends the ice route beyond Frostglass Orchard without becoming a generic snowfield.

`cindershoreStrand` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down magma beach with black glass sand, crescent molten shoreline, glowing basalt tide pools, heatglass shell clusters, fossil-root driftwood arch, ashgrass dunes, red crystals, caretaker lanterns, and a half-buried sanctuary marker.
- Battle backdrop: lower shore fight scene with the same molten surf, black sand, basalt tide pools, driftwood arch, heatglass shells, caretaker lantern, and sanctuary marker carried into combat.
- Encounter zones: `moltenFoamShore`, `heatglassShellBeds`, and `ashgrassDunes`.
- Primary element: fire.
- Secondary elements: stone and grass.
- Native hooks: Magmadon, Cinderhoof, Dogemox / Ignis Canis, Embermarten, Ashbat, Embernewt, Basalthorn, Bouldermaw, Grimweld.
- Payoff: magma-beach screenshot biome that reads as shoreline instead of another caldera, lake, cave, or desert route.

`cinderlakeBasin` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down magma lake basin with a broad glowing molten lake, crescent black-basalt causeway, obsidian rib arch, red crystal clusters, ashgrass pockets, heat-cage lanterns, and a half-buried sanctuary waystone.
- Battle backdrop: lower lake-rim fight scene with the same magma lake, crescent basalt shelf, obsidian ribs, heat-cage lantern, red crystals, and waystone carried into combat.
- Encounter zones: `moltenLakeShore`, `basaltRim`, and `ashgrassLanterns`.
- Primary element: fire.
- Secondary elements: stone and grass.
- Native hooks: Magmadon, Cinderhoof, Dogemox / Ignis Canis, Embermarten, Ashbat, Embernewt, Basalthorn, Bouldermaw, Grimweld.
- Payoff: magma-lake screenshot biome that feels broader and more dangerous than Magmaheart's vent-and-river caldera.

`magmaheartCaldera` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down magma caldera with black basalt causeways, magma rivers, obsidian ribs, heart-shaped vent ring, red crystals, ashgrass shelves, and heat-cage lanterns.
- Battle backdrop: lower magma fight scene with the same heart-shaped vent, heat-cage lantern, obsidian rib arch, basalt shelves, magma rivers, and red crystal clusters carried into combat.
- Encounter zones: `magmaRivers`, `obsidianRibs`, and `ashgrassShelf`.
- Primary element: fire.
- Secondary elements: stone and grass.
- Native hooks: Magmadon, Cinderhoof, Dogemox / Ignis Canis, Embermarten, Ashbat, Embernewt, Basalthorn, Bouldermaw, Grimweld.
- Payoff: dedicated magma screenshot biome that escalates Ember Hollow without replacing it.

`echobloomCanopy` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down bioluminescent living forest with spiral roots, blue bell flowers, glowing pool, vine crossings, translucent leaves, and caretaker lanterns.
- Battle backdrop: lower living-root fight scene with the same spiral-root tree, blue bell flowers, glowing pool, caretaker lantern, vine bridge hints, and mossy-root floor carried into combat.
- Encounter zones: `listeningMoss`, `bellflowerGrove`, and `canopyPool`.
- Primary element: grass.
- Secondary elements: light and water.
- Native hooks: Mossprig, Mossquirl, Venivy, Snapmaw, Fenlight, Lumen Corvus, Prismkid, Lanterncat, Tidecalf.
- Payoff: first lush alien-nature screenshot biome, built from Anima Codex sanctuary language rather than copying an external world.

`prismfallCavern` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down crystal cave with rainbow spires, mirror pools, faceted shelves, broken glassroot bridges, prismatic columns, and glowing crystal ribs.
- Battle backdrop: lower crystal-cave fight scene with the same split rainbow spire, circular mirror pool, bronze lantern, broken bridge, and prismatic floor carried into combat.
- Encounter zones: `mirrorPoolRim`, `splitSpireGrove`, and `glassrootBridge`.
- Primary element: light.
- Secondary elements: stone and steel.
- Native hooks: Prismkid, Lumen Corvus, Lanterncat, Grimweld, Basalthorn, Bouldermaw, Shadecub.
- Payoff: first dedicated crystal-cave environment and fight backdrop, distinct from Quartzroot's broader mineral route and Tideglass's flooded cave route.

`tideglassGrotto` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down flooded cave with turquoise channels, stepping-stone shelves, rope bridge hints, blue-glass waterfall arch, luminous pool, lantern posts, and bioluminescent algae.
- Battle backdrop: lower water-cave fight scene with the same crescent waterfall arch, luminous pool, bronze caretaker lantern, rope bridge stump, wet stone shelves, and turquoise cave channels carried into combat.
- Encounter zones: `turquoiseChannels`, `blueGlassFalls`, and `slickCrystalShelves`.
- Primary element: water.
- Secondary elements: light and stone.
- Native hooks: Mirejaw, Tidecalf, Fenlight, Glarefin, Bellcrab, Reedotter, Prismkid, Lumen Corvus, Basalthorn.
- Payoff: first dedicated water-cave environment and fight backdrop, expanding the cave network beyond mineral caverns into a reflective aquatic route.

`quartzrootVault` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down mineral cave system with looped stone paths, rope bridge hints, crystal chasms, quartz-root bridges, blue pool ledges, warm lantern fungi, and a heart-shaped quartz root arch.
- Battle backdrop: lower cave fight scene with the same heart-shaped quartz root arch, blue glowing pool, bronze caretaker lantern, fossil roots, crystal ledges, and distant cave tunnels carried into combat.
- Encounter zones: `crystalChasms`, `quartzPoolLedges`, and `mineralRootBridge`.
- Primary element: steel.
- Secondary elements: stone and light.
- Native hooks: Grimweld, Basalthorn, Bouldermaw, Lumen Corvus, Prismkid, Lanterncat, Shadecub, Needlehare.
- Payoff: first larger cave-system route, visually and mechanically distinct from Glassroot Burrow's small hidden refuge.

`sunspindleDunes` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down sand dunes with a packed S-lane, fossil-root arches, amber heat-glass crystals, dry grass shelters, blue shade awnings, and half-buried sanctuary waystones.
- Battle backdrop: lower desert fight scene with the same crescent fossil-root arch, amber glass obelisk, blue shade awning, sandstone ribs, dry grass, and heat-glass crystals carried into combat.
- Encounter zones: `heatglassDunes`, `dryGrassShelters`, and `shadeAwnings`.
- Primary element: stone.
- Secondary elements: fire and neutral through sun-baked shelter pockets.
- Native hooks: Basalthorn, Bouldermaw, Magmadon, Cinderhoof, Needlehare, Dogemox, Prismkid.
- Payoff: first dedicated sand-dune environment and fight backdrop, adding a warm desert screenshot biome without becoming a generic empty sandfield.

`mireglassSwamp` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down blackwater swamp with cypress knees, mud-island lanes, a mossy log bridge, lantern fungus, glassy algae, and a half-sunk sanctuary marker.
- Battle backdrop: lower swamp-bank fight scene with the same crescent blackwater pool, fallen log bridge, root arch, fungus lights, algae sheen, and sanctuary marker carried into combat.
- Encounter zones: `blackwaterPools`, `glassyAlgaeMats`, and `lanternFungusKnees`.
- Primary element: water.
- Secondary elements: grass, light, and future poison pressure through algae sheen and swamp spores.
- Native hooks: Mirejaw, Glarefin, Tidecalf, Fenlight, Venivy, Snapmaw, Reedotter, Bellcrab.
- Payoff: a dedicated swamp environment and dedicated swamp fight backdrop that contrasts with Moonfen Marsh's calmer refuge identity.

`cadenceLabAnnex` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down reclaimed containment annex with cracked glass habitat tanks, living cable roots, nursery plants, soft warning lights, violet canisters, and an open pale containment door.
- Battle backdrop: lower lab-aisle view with the same crescent habitat glass, cable-root nest, warning-light tree, vines through tile, canisters, and pale doorway carried into combat.
- Encounter zones: `livingCableNest`, `sporeCanisterOvergrowth`, and `warningLightNursery`.
- Primary elements: electric and light.
- Secondary element: poison as visual and future-system pressure.
- Native hooks: Voltpip, Venivy / Verdaconda, Lumen Corvus, Prismkid, Lanterncat, Grimweld, future synthetic poison and electric lines.
- Payoff: first explicit engineered-lifeform facility, making Anima Codex feel more specific than a normal fantasy creature RPG.

`sporebellGarden` is now implemented as a production scene pair.

Implemented packet:

- Exploration painting: top-down storybook garden with oversized bell blooms, golden pollen haze, warning ribbon stakes, violet spore grass, a cracked pollinator basin, and a crooked garden arch.
- Battle backdrop: low angle in the same flower field, with a clear foreground path, enemy-side spore grass, warning ribbons, bell blooms, arch, and basin carrying over.
- Encounter zones: `violetSporeGrass`, `bellBloomRows`, and `warningStakePatch`.
- Primary element: grass.
- Secondary element: poison as visual and future-system pressure.
- Native hooks: Venivy / Verdaconda, Mossprig, Mossquirl, Needlehare, Fenlight, future poison-support pollinator lines.
- Payoff: first poison-adjacent route that stays beautiful and sanctuary-grown instead of reading as a generic toxic swamp.

`gloamrailCut` is now implemented as a production scene pair.

Why it was prioritized:

- It creates a home for the already hinted shadow-cat assets and future dark-element lines.
- It expands the emotional palette without abandoning the cozy storybook tone.
- It branches naturally from Glassroot Burrow after the player finds the first shadow pocket.
- It gives future Noctis forms a habitat, encounter table, battlefield condition, and story reason before they become just another portrait in the roster.

Implemented packet:

- Exploration painting: top-down storybook rail trench with bramble-shadow grass, a bent signal post, wet sleepers, a hidden sanctuary crawlspace, and amber patrol lamps.
- Battle backdrop: low angle in the rail cut, with the player side near mossy sleepers, enemy side near shadow grass, and the bent signal post visible behind the enemy lane.
- Encounter zones: `shadowGrass`, `railThorns`, and a rare `signalNest`.
- Primary element: shadow.
- Secondary element: neutral or poison.
- Native hooks: Shadecub / Noctis Panthera, Needlehare, Dogemox, Lanterncat, future Umbra Strix.
- Payoff: outdoor shadow attunement landmark and a patrol-pressure route that gives Shadecub a real habitat beyond the burrow pocket.
