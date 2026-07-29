# Elemental Creature Packets

Use this document for strong elemental creature concepts before they become runtime species, imagegen prompts, move data, encounter entries, or evolution records.

Each packet should define:

- Common name and registry name.
- Element and route biome.
- Intended start level and availability.
- Battle role such as tank, bruiser, skirmisher, focus striker, guard breaker, or boss rescue.
- Evolution stages and level targets.
- Image description for battle portrait generation.
- Signature attacks and learnset idea.
- Runtime data hooks needed for implementation.

These creatures should follow the `Leafstalker` standard: the animal must read as powerful first, with elemental biology grown into the body instead of pasted on as an effect.

## Stormhide Mammoth

- Common name: `Stormhide Mammoth`
- Registry name: `Fulgur Elephas`
- Element: `electric`
- Biome fit: Thunderhead Mesa, Coppervine Runoff, future storm highlands.
- Start level: 13-16 as a rare late-first-playable or early-midgame wild encounter.
- Availability: rare wild encounter, optional boss rescue, or storm-route guardian after the player has at least one badge.
- Battle role: electric tank and heavy bruiser.
- Disposition: steadfast.
- Stat shape: very high HP and defense, high attack, medium focus, very low speed.
- Tactical identity: survives first contact, braces under charge, then breaks guarded targets with tusk and stomp pressure.

### Evolution Line

1. `Stormcalf`
   - Registry: `Fulgur Elephas`
   - Element: electric
   - Start level: 8-10
   - Role: young but heavy storm calf, tank-in-training.
   - Visual: smaller body, oversized charged ears, short translucent tusks, wool already storing dangerous static.

2. `Stormhide Mammoth`
   - Required level: 16
   - Requirement: 3 electric bond marks and 2 victories against electric or water-aligned habitat pressure.
   - Role: full heavy tank and guard breaker.
   - Unlock move: `Thunder Tusk`.

3. `Tempestodon`
   - Required level: 32
   - Requirement: 6 electric bond marks, storm-route attunement landmark, and at least one trainer win while braced.
   - Role: boss-scale storm guardian.
   - Unlock move: `Skybreak Trample`.

### Image Description

A massive woolly mammoth Vivo in a painted naturalist field-guide pose, standing broadside with its head lowered like it is about to charge. Its dark storm-gray wool is thick and matted with living copper-blue conductive vines, and blue-white static crawls through the wool in branching patterns like lightning trapped under fur. The tusks are huge, curved, and semi-translucent, with glowing storm veins inside them. Its forehead is heavy, eyes narrow and intelligent, not friendly, with a calm but dangerous expression. The hooves are planted hard into wet earth, surrounded by small sparks and charged grass bending away from its body. It should feel ancient, heavy, protective, and terrifying when angered. Cozy-biotech storybook illustration, strong readable silhouette, no armor, no robot parts, no normal mammoth with lightning pasted on.

### Attack Ideas

- `Static Fleece`: support guard. Braces the user and slightly improves the next electric attack read.
- `Volt Trunk`: focus electric attack. Medium power, reliable accuracy, good against exposed targets.
- `Thunder Tusk`: impact electric attack. Heavy guard-breaking tusk strike, bonus into guarded targets.
- `Grounding Stomp`: support expose. Low speed move that exposes the foe if the user is braced.
- `Skybreak Trample`: evolved impact electric finisher. Very heavy damage, stronger after a guard turn.

### Runtime Data Needed

- Species entries for `stormcalf`, `stormhideMammoth`, and later `tempestodon`.
- Electric moves above in `moves.ts` or authored content.
- Portrait assets for each live stage.
- Encounter placement in Thunderhead Mesa and Coppervine Runoff.
- Optional storm attunement landmark for evolution.
- Battle trait candidate: `Stormhide Bulk`, bracing once when first hit by a faster attacker.

## Cinderspine Lion

- Common name: `Cinderspine Lion`
- Registry name: `Ignis Leo`
- Element: `fire`
- Biome fit: Ember Hollow, Magmaheart Caldera, Cinderlake Basin, future volcanic sanctuary.
- Start level: 14-18 as a rare fire-route apex predator.
- Availability: rare wild encounter or scripted rescue in a hot route after the player has learned guard and calm rescue pacing.
- Battle role: fire bruiser and boss predator.
- Disposition: wary.
- Stat shape: high attack, high HP, medium defense, medium speed, low focus.
- Tactical identity: builds heat through guarded pressure, then converts exposed openings into brutal pounces.

### Evolution Line

1. `Cinderkit`
   - Registry: `Ignis Leo`
   - Element: fire
   - Start level: 7-9
   - Role: dangerous lion cub, not cute by default; early fire skirmisher.
   - Visual: oversized paws, serious eyes, ember glands under a short dark mane.

2. `Cinderspine Lion`
   - Required level: 17
   - Requirement: 3 fire bond marks and 2 fire victories.
   - Role: strong fire bruiser.
   - Unlock move: `Mane Furnace`.

3. `Ashcrown Leo`
   - Required level: 34
   - Requirement: 6 fire bond marks, volcanic attunement landmark, and a boss/trainer win after using a fire guard.
   - Role: late fire apex and gym-leader-grade threat.
   - Unlock move: `Crownfire Maul`.

### Image Description

A powerful adult lion Vivo with a low stalking posture and a huge ember-organic mane made from dark fur, coal-red moss, heat vents, and biological flame-shaped hair masses. The mane should not be literal fire everywhere; it should look like living furnace biology, glowing from within through cracks, glands, and ember roots. Its shoulders are oversized, paws heavy, claws black and heat-polished, with faint smoke curling from the ground where it steps. The face is serious and regal, with narrowed amber eyes and a scar-like glowing chest mark. The tail ends in a thick ember gland instead of a simple flame. It should feel like a guardian predator from an old volcanic sanctuary, strong enough to stand as a boss or rare rescue. Premium cozy-biotech storybook creature plate, no hellhound or demon language, no armor, no cartoon smile.

### Attack Ideas

- `Ember Mane Guard`: support guard. Braces and raises fire pressure for the next hit.
- `Coal Rake`: impact fire attack. Reliable early claw strike.
- `Mane Furnace`: support focus or guard. The mane glows hotter; next fire impact gains bonus damage.
- `Cinder Pounce`: impact fire attack. Bonus against exposed targets.
- `Crownfire Maul`: evolved impact fire finisher. Huge damage after a guard or expose setup.

### Runtime Data Needed

- Species entries for `cinderkit`, `cinderspineLion`, and later `ashcrownLeo`.
- Fire move entries and evolution unlock moves.
- Portrait assets for active stages.
- Encounter placement in Ember Hollow or Magmaheart Caldera side pockets.
- Optional scripted rescue requiring `Calm Signal` before capture.
- Battle trait candidate: `Furnace Pride`, first guard turn primes the next impact fire move.

## Frostmantle Elk

- Common name: `Frostmantle Elk`
- Registry name: `Glacies Cervus`
- Element: `ice`
- Biome fit: Frostglass Orchard, Aurorashard Tundra, future whitebell pass.
- Start level: 12-15 as a rare ice-route guardian.
- Availability: rare wild encounter, recovery-anchor guardian, or frost attunement landmark encounter.
- Battle role: ice bruiser, guard breaker, and anti-speed anchor.
- Disposition: steadfast.
- Stat shape: high HP, high attack, medium-high defense, low focus, medium speed.
- Tactical identity: punishes fast attackers by planting its hooves, then breaks open the fight with antler charges.

### Evolution Line

1. `Rimefawn`
   - Registry: `Glacies Cervus`
   - Element: ice
   - Start level: 6-8
   - Role: young frost deer with dangerous antler buds and serious posture.
   - Visual: not fragile or cute; narrow eyes, heavy hooves, frostglass antler nubs.

2. `Frostmantle Elk`
   - Required level: 15
   - Requirement: 3 ice bond marks and one clean calm capture or careful retreat in an ice habitat.
   - Role: strong midgame ice bruiser.
   - Unlock move: `Antler Shatter`.

3. `Aurorastag Cervus`
   - Required level: 31
   - Requirement: 6 ice bond marks, Aurorashard attunement, and a win while braced.
   - Role: noble late ice guardian with light-adjacent aurora pressure.
   - Unlock move: `Aurora Rack`.

### Image Description

A tall, muscular elk Vivo with a proud but wary stance, covered in layered winter fur, frostglass plates, and hanging ice-lichen. Its antlers are enormous branching crystal-bone structures, partly translucent, with pale blue light running through them like frozen sap. The shoulders and chest are heavy, built for ramming through snow, while its legs are lean and sharp enough to imply speed. Frost grows naturally from the spine and antler roots, not as armor pieces, and long white-blue moss hangs from the neck like a frozen mantle. Its eyes are cold, watchful, and almost judgmental. The hooves crack the ice beneath it, and small snow crystals drift around the body. It should feel noble, dangerous, and hard to earn, like a late-route ice sanctuary creature. Painted storybook field-guide style, readable RPG battle portrait, no photorealism, no cute deer mascot.

### Attack Ideas

- `Frost Mantle`: support guard. Braces and reduces the next incoming impact hit.
- `Hoarfrost Charge`: impact ice attack. Medium power, stronger if the user is slower.
- `Antler Shatter`: impact ice attack. Guard breaker with bonus against guarded targets.
- `Whitebell Stand`: support guard/focus hybrid. Braces and improves next ice attack accuracy.
- `Aurora Rack`: evolved ice attack with light-like focus pressure. Stronger after a calm or guard turn.

### Runtime Data Needed

- Species entries for `rimefawn`, `frostmantleElk`, and later `aurorastagCervus`.
- Ice moves above, plus optional light-adjacent late move if dual pressure is supported later.
- Portrait assets for active stages.
- Encounter placement in Frostglass Orchard and Aurorashard Tundra.
- Frost or aurora attunement landmark requirement.
- Battle trait candidate: `Winter Crown`, first time a faster foe hits it, the elk braces and marks the foe for an antler counter.

## Venom Crown Cobra

- Common name: `Venom Crown Cobra`
- Registry name: `Toxica Naja`
- Element: `poison` once poison is live, otherwise temporary `grass` with poison status moves.
- Biome fit: Sporebell Garden, Cadence Lab Annex, Mireglass Swamp, future toxic flower routes.
- Start level: 10-13 as a dangerous status-control encounter.
- Availability: rare wild encounter in beautiful but unsafe grass or lab habitats.
- Battle role: fast status controller and poison finisher.
- Disposition: wary.
- Stat shape: high speed and focus, medium attack, low HP and defense.
- Tactical identity: applies poison early, marks the target, then converts poisoned openings into expose and finisher pressure.

### Evolution Line

1. `Crownling`
   - Registry: `Toxica Naja`
   - Element: poison
   - Start level: 6-8
   - Role: small hooded snake with dangerous venom glands.
   - Visual: narrow serious eyes, small raised hood, bright venom sacs under translucent scale membranes.

2. `Venom Crown Cobra`
   - Required level: 14
   - Requirement: 3 poison bond marks or 3 victories in poison-adjacent habitats.
   - Role: fast poison controller.
   - Unlock move: `Crown Venom`.

3. `Sovereign Naja`
   - Required level: 30
   - Requirement: 6 poison bond marks, Sporebell or lab attunement, and a win where poison damage mattered.
   - Role: late status boss that spreads pressure across long fights.
   - Unlock move: `Royal Venom Bloom`.

### Image Description

A tall hooded cobra Vivo in a painted naturalist field-guide pose, body lifted in an S-curve with the hood spread wide like a living crown. Its hood has translucent green venom sacs, thorn-like fang roots, black-gold scale patterns, and glowing toxin veins under the skin. The face should be elegant, cold, and lethal, with narrow eyes and no comic expression. The fangs are visible but not gory, and the tail ends in a seed-pod venom organ. The element should feel grown through the body: venom membranes, toxic scale patterns, and biological warning colors instead of slime or generic green glow. Premium cozy-biotech storybook creature plate, no gross horror, no cartoon snake, no hard armor.

### Attack Ideas

- `Venom Pin`: poison support. Applies `poisoned` and lightly lowers rescue stability if used by a wild Vivo.
- `Hood Hypnosis`: support expose. Marks a poisoned target and makes the next hit more accurate.
- `Crown Venom`: focus poison attack. Medium damage and guaranteed poison on clean hit.
- `Royal Coil`: support control. Exposes poisoned targets and weakens their next impact attack.
- `Royal Venom Bloom`: evolved poison finisher. Heavy damage against poisoned targets and refreshes poison duration.

### Runtime Data Needed

- New `poison` element or poison-status support on grass moves.
- Status hooks for `poisoned` and `venomMarked`.
- Species entries for `crownling`, `venomCrownCobra`, and later `sovereignNaja`.
- Portrait assets for active stages.
- Encounter placement in Sporebell Garden and Cadence Lab Annex.
- Battle trait candidate: `Crowned Venom`, poisoned targets become easier to expose.

## Thunderjaw Hyena

- Common name: `Thunderjaw Hyena`
- Registry name: `Fulgur Crocuta`
- Element: `electric`
- Biome fit: Thunderhead Mesa, Coppervine Runoff, future storm grasslands.
- Start level: 9-12 as a fast electric route predator.
- Availability: uncommon wild encounter or trainer pressure creature.
- Battle role: stun skirmisher and exposed-target punisher.
- Disposition: flighty.
- Stat shape: high speed, high attack, medium focus, low defense.
- Tactical identity: steals tempo with jolts, then punishes targets that are already exposed or delayed.

### Evolution Line

1. `Joltkit Crocuta`
   - Registry: `Fulgur Crocuta`
   - Element: electric
   - Start level: 5-7
   - Role: young hyena with unstable bite charge and nervous pack energy.
   - Visual: lean body, oversized ears, copper jaw veins, raised static mane.

2. `Thunderjaw Hyena`
   - Required level: 13
   - Requirement: 3 electric bond marks and one battle where it strikes before a faster foe after setup.
   - Role: electric stun skirmisher.
   - Unlock move: `Breaker Laugh`.

3. `Stormcackle Crocuta`
   - Required level: 29
   - Requirement: 6 electric bond marks, Thunderhead attunement, and a win after stunning or jolting a target.
   - Role: high-speed disruption predator.
   - Unlock move: `Packbolt Rend`.

### Image Description

A lean hyena Vivo with oversized shoulders, jagged copper-blue jaw organs, raised static fur, and bright predatory eyes. Its mane should stand up with electric pressure, and its mouth should look like it can lock electricity into a target through the bite. The body is wiry and dangerous rather than bulky, with long legs, cracked storm markings across the hide, and sparks crawling along the teeth and claws. It should feel like a pack predator that laughs only when the fight has already turned. Cozy-biotech storybook creature plate, no robot parts, no generic lightning stickers, no goofy hyena comedy.

### Attack Ideas

- `Static Nip`: impact electric attack. Low damage with a small chance to apply `jolted`.
- `Breaker Laugh`: support control. Applies `jolted`; if the target is exposed, upgrades to `stunned`.
- `Thunder Jaw`: impact electric attack. Bonus against jolted targets.
- `Cackle Feint`: support expose. Steals tempo and exposes a target that missed last turn.
- `Packbolt Rend`: evolved electric finisher. Heavy impact damage and guaranteed stun against exposed or jolted targets.

### Runtime Data Needed

- Status hooks for `jolted` and `stunned`.
- Species entries for `joltkitCrocuta`, `thunderjawHyena`, and later `stormcackleCrocuta`.
- Electric move entries and stun validation.
- Portrait assets for active stages.
- Encounter placement in Thunderhead Mesa.
- Battle trait candidate: `Jaw Static`, first hit against an exposed target applies jolt.

## Sleepmoss Sloth

- Common name: `Sleepmoss Sloth`
- Registry name: `Flora Bradypus`
- Element: `grass`
- Biome fit: Lumenveil Grove, Echobloom Canopy, Moonmilk Cavern, future quiet canopy routes.
- Start level: 11-14 as a slow rare support creature.
- Availability: rare wild encounter in calm or healing biomes.
- Battle role: slow disruptor and sustain tank.
- Disposition: steadfast.
- Stat shape: very high HP, high defense, medium focus, very low speed.
- Tactical identity: survives long enough to make enemies drowsy, heals while guarded, then lets the team capitalize on sleeping targets.

### Evolution Line

1. `Mossdoze`
   - Registry: `Flora Bradypus`
   - Element: grass
   - Start level: 7-9
   - Role: young but heavy sloth with hook claws and medicinal moss.
   - Visual: sleepy eyes that still feel unsettling, shoulder moss, long claws, hanging vines.

2. `Sleepmoss Sloth`
   - Required level: 15
   - Requirement: 3 grass bond marks and one careful retreat or calm capture in a quiet habitat.
   - Role: sustain tank and sleep setup.
   - Unlock move: `Drowsy Spores`.

3. `Dreambark Bradypus`
   - Required level: 33
   - Requirement: 6 grass bond marks, Lumenveil or Moonmilk attunement, and a win after an enemy slept.
   - Role: late-game control tank.
   - Unlock move: `Ancient Nap`.

### Image Description

A huge moss-covered sloth Vivo hanging low on its knuckles with long hook claws, heavy shoulders, medicinal vines, and fungus blooms growing from its back. Its eyes are half-lidded but unsettling, as if it is perfectly aware of the fight while moving slowly. Thick green moss forms a living mantle over the arms and spine, with pale spores drifting around its body. The claws should look powerful enough to tear bark and stone if it finally swings. It should feel gentle only from a distance, like a slow sanctuary guardian that wins by exhausting danger. Cozy-biotech storybook creature plate, no comedy sloth, no plush softness, no gross fungus horror.

### Attack Ideas

- `Moss Rest`: support guard. Braces and heals a small amount.
- `Drowsy Spores`: support status. Applies `drowsy`; repeated use or follow-up pressure can become `asleep`.
- `Hookroot Swipe`: impact grass attack. Bonus against drowsy or sleeping targets.
- `Spore Blanket`: support control. Lowers foe speed and improves capture calm.
- `Ancient Nap`: evolved support. Strong heal and guard; sleeping enemies stay asleep longer.

### Runtime Data Needed

- Status hooks for `drowsy` and `asleep`.
- Species entries for `mossdoze`, `sleepmossSloth`, and later `dreambarkBradypus`.
- Grass support moves with healing and status effects.
- Portrait assets for active stages.
- Encounter placement in Lumenveil Grove and Moonmilk Cavern.
- Battle trait candidate: `Slow Breath`, healing is stronger when the user moves last.

## Glassfang Mantis

- Common name: `Glassfang Mantis`
- Registry name: `Lumen Mantodea`
- Element: `light`
- Biome fit: Prismfall Cavern, Prismfall Ravine, Starglass Roost, Cadence Lab Annex.
- Start level: 12-15 as a rare precision attacker.
- Availability: rare wild encounter or trainer ace.
- Battle role: precision crit assassin and blind setup attacker.
- Disposition: wary.
- Stat shape: high speed, high focus, medium attack, low HP and defense.
- Tactical identity: marks the target, blinds it, then uses prism blades for high-risk burst turns.

### Evolution Line

1. `Shardnymph`
   - Registry: `Lumen Mantodea`
   - Element: light
   - Start level: 7-9
   - Role: small prism mantis with blade buds.
   - Visual: thin limbs, glass forearm growths, watchful alien face, translucent wing nubs.

2. `Glassfang Mantis`
   - Required level: 16
   - Requirement: 3 light bond marks and one win after a focus setup.
   - Role: light crit assassin.
   - Unlock move: `Glassfang Cut`.

3. `Prismreaver Mantodea`
   - Required level: 34
   - Requirement: 6 light bond marks, Prismfall attunement, and a marked-target finisher.
   - Role: late precision sweeper.
   - Unlock move: `Refractor Scythe`.

### Image Description

A tall praying mantis Vivo with prism-glass forearms, translucent wing panels, and a narrow alien face. The blade arms should look like organic crystal keratin, not metal weapons. Its body is pale green, cream, and opal-gold, with light organs glowing inside the chest and wing veins. The pose should be tense and surgical, one forearm raised like it has already chosen the exact place to cut. The eyes are large, cold, and reflective. It should feel elegant, brittle, and terrifyingly precise. Premium cozy-biotech storybook creature plate, no robot insect, no angel symbolism, no generic fantasy blade monster.

### Attack Ideas

- `Prism Mark`: support status. Applies `marked` and improves the next light hit.
- `Glassfang Cut`: focus light attack. High crit chance against marked targets.
- `Dazzle Wing`: support status. Applies `blinded`, lowering enemy accuracy.
- `Mirror Lunge`: impact light attack. Acts faster if the target is blinded.
- `Refractor Scythe`: evolved focus finisher. Heavy damage with crit bonus against marked or blinded targets.

### Runtime Data Needed

- Status hooks for `marked` and `blinded`.
- Species entries for `shardnymph`, `glassfangMantis`, and later `prismreaverMantodea`.
- Light moves with crit, accuracy, and mark effects.
- Portrait assets for active stages.
- Encounter placement in Prismfall Cavern or Ravine.
- Battle trait candidate: `Glass Precision`, first attack against a marked target gains crit chance.

## Mirebell Toad

- Common name: `Mirebell Toad`
- Registry name: `Toxica Bufo`
- Element: `poison` once live, otherwise temporary `water` with poison and weaken moves.
- Biome fit: Mireglass Swamp, Moonfen Marsh, Sporebell Garden.
- Start level: 8-11 as a capture-helper support creature.
- Availability: uncommon wild encounter in wet poison-adjacent zones.
- Battle role: debuff support and rescue/capture helper.
- Disposition: steadfast.
- Stat shape: high HP and defense, medium focus, low attack and speed.
- Tactical identity: weakens wild Vivos without knocking them out, making rescue lines more deliberate.

### Evolution Line

1. `Belltoad`
   - Registry: `Toxica Bufo`
   - Element: poison
   - Start level: 5-7
   - Role: small warning-color toad with swollen throat sacs.
   - Visual: squat body, violet-green sacs, wet reed frills, alert eyes.

2. `Mirebell Toad`
   - Required level: 13
   - Requirement: 3 poison or water bond marks and one calm capture in a swamp or marsh habitat.
   - Role: debuff support and capture helper.
   - Unlock move: `Toxic Lull`.

3. `Bellgrave Bufo`
   - Required level: 29
   - Requirement: 6 poison bond marks and a scripted rescue completed without knockout.
   - Role: late rescue-control specialist.
   - Unlock move: `Mire Dirge`.

### Image Description

A squat heavy toad Vivo with swollen violet-green throat sacs, warning spots, wet reed frills, and thick rooted forefeet. Its skin should look damp and biological, with soft toxin veins under the surface and bell-shaped glands along the back. The expression is patient but not silly, with broad watchful eyes and a mouth line that feels ancient and serious. It should look like a living warning sign from a swamp sanctuary, useful for calming but dangerous if handled roughly. Cozy-biotech storybook creature plate, no comedic frog energy, no gore, no photoreal pond toad.

### Attack Ideas

- `Weakening Croak`: support debuff. Lowers foe attack.
- `Toxic Lull`: support status. Applies `weakened` and improves capture or rescue pulse odds.
- `Mire Spit`: focus poison or water attack. Low damage, may poison.
- `Bell Guard`: support guard. Braces and lowers wild bolt pressure.
- `Mire Dirge`: evolved support. Applies weakened, improves calm capture, and suppresses one bolt attempt.

### Runtime Data Needed

- Status hooks for `weakened` and poison.
- Capture modifier support from status effects.
- Species entries for `belltoad`, `mirebellToad`, and later `bellgraveBufo`.
- Portrait assets for active stages.
- Encounter placement in Mireglass Swamp and Moonfen Marsh.
- Battle trait candidate: `Warning Throat`, Calm Signal and capture moves are stronger after it uses a croak move.

## Ironspike Pangolin

- Common name: `Ironspike Pangolin`
- Registry name: `Ferrum Manis`
- Element: `steel`
- Biome fit: Quartzroot Vault, Glassroot Burrow, Cadence Lab Annex.
- Start level: 10-13 as a defensive steel encounter.
- Availability: uncommon wild encounter in mineral tunnels.
- Battle role: counter tank and chip-damage wall.
- Disposition: steadfast.
- Stat shape: high defense, high HP, medium attack, low speed and focus.
- Tactical identity: curls into a guard, punishes contact, and bleeds or wounds reckless attackers.

### Evolution Line

1. `Rivetpup Manis`
   - Registry: `Ferrum Manis`
   - Element: steel
   - Start level: 6-8
   - Role: small armored burrower with sharp scale edges.
   - Visual: curled posture, amber eyes, oversized digging claws, organic steel scale buds.

2. `Ironspike Pangolin`
   - Required level: 15
   - Requirement: 3 steel bond marks and one battle won after guarding twice.
   - Role: counter tank.
   - Unlock move: `Spine Curl`.

3. `Bulwark Manis`
   - Required level: 31
   - Requirement: 6 steel bond marks, Ironroot attunement, and a trainer win using counter damage.
   - Role: late defensive wall.
   - Unlock move: `Bastion Roll`.

### Image Description

A curled pangolin Vivo with overlapping organic steel scales, heavy foreclaws, amber eyes, and thorny scale edges. Its plates should look grown like keratin and mineral, not manufactured armor, with moss and root dust caught between the ridges. The body is compact but heavy, with a tail coiled protectively around the feet and spike edges catching pale cave light. It should look like striking it bare-handed would be a mistake. Cozy-biotech storybook creature plate, no robot armor, no medieval shield animal, no cute pet expression.

### Attack Ideas

- `Spine Curl`: support guard. Strong brace that prepares counter damage.
- `Scale Wound`: impact steel attack. Applies `wounded` if the user was guarded.
- `Iron Roll`: impact steel attack. Stronger after guarding.
- `Rivet Snare`: support expose. Exposes attackers that hit into the guard.
- `Bastion Roll`: evolved impact steel finisher. Heavy damage and applies wounded to exposed targets.

### Runtime Data Needed

- Status hook for `wounded`, a small chip after actions or impact attacks.
- Species entries for `rivetpupManis`, `ironspikePangolin`, and later `bulwarkManis`.
- Steel guard and counter moves.
- Portrait assets for active stages.
- Encounter placement in Quartzroot Vault and Glassroot Burrow.
- Battle trait candidate: `Spike Counter`, first guarded contact wounds the attacker.

## Ashveil Owl

- Common name: `Ashveil Owl`
- Registry name: `Ignis Strix`
- Element: `fire`
- Biome fit: Ember Hollow, Gloamrail Cut, Cindershore Strand, future ash forests.
- Start level: 9-12 as a fire focus attacker.
- Availability: uncommon night or ash-route encounter.
- Battle role: focus attacker and accuracy disruptor.
- Disposition: flighty.
- Stat shape: high focus and speed, low defense, medium HP.
- Tactical identity: fills the fight with ash, makes enemies miss, then burns them when they overreach.

### Evolution Line

1. `Sootlet Strix`
   - Registry: `Ignis Strix`
   - Element: fire
   - Start level: 5-7
   - Role: small ash owl with hot eye organs and soot feathers.
   - Visual: broad eyes, ash face disc, ember feather veins, sharp talons.

2. `Ashveil Owl`
   - Required level: 14
   - Requirement: 3 fire bond marks and one win after an enemy misses.
   - Role: accuracy disruptor.
   - Unlock move: `Ash Veil`.

3. `Cinderseer Strix`
   - Required level: 30
   - Requirement: 6 fire bond marks, ash-route attunement, and a burn finish.
   - Role: late evasive fire caster.
   - Unlock move: `Coal-Eye Dive`.

### Image Description

A broad-winged owl Vivo with soot-black feathers, ember eyes, ash-gray facial discs, and warm glow under layered wing feathers. Its wings should look soft and smoky but still powerful, with talons curved like blackened hooks and faint orange heat lines under the chest. The expression is quiet and ominous, as if it has already seen the attack coming. Ash drifts around the body, partially veiling the lower feathers. Cozy-biotech storybook creature plate, no cartoon fire bird, no phoenix cliche, no hard armor.

### Attack Ideas

- `Ash Veil`: support status. Applies `smoked`, lowering enemy accuracy.
- `Coal-Eye Peck`: focus fire attack. Bonus if the target is smoked.
- `Soot Wing`: support guard. Braces and improves dodge or miss chance.
- `Cinder Hex`: focus fire attack. Applies `burned` if the target missed this battle.
- `Coal-Eye Dive`: evolved focus fire finisher. Heavy damage and guaranteed burn against smoked targets.

### Runtime Data Needed

- Status hooks for `smoked` and `burned`.
- Species entries for `sootletStrix`, `ashveilOwl`, and later `cinderseerStrix`.
- Fire focus moves and accuracy modifiers.
- Portrait assets for active stages.
- Encounter placement in Ember Hollow and Cindershore Strand.
- Battle trait candidate: `Ash Reading`, first enemy miss primes the next fire focus attack.

## Riftback Tortoise

- Common name: `Riftback Tortoise`
- Registry name: `Petra Testudo`
- Element: `stone`
- Biome fit: Sunspindle Dunes, Quartzroot Vault, Prismfall Ravine, Clayhorn Ravine if added.
- Start level: 12-15 as a battlefield-control creature.
- Availability: rare wild encounter on mineral or ravine routes.
- Battle role: terrain setter and slow team anchor.
- Disposition: steadfast.
- Stat shape: very high defense and HP, medium attack, very low speed.
- Tactical identity: creates rubble terrain that slows fast enemies and gives slower teams time to set up.

### Evolution Line

1. `Crackback`
   - Registry: `Petra Testudo`
   - Element: stone
   - Start level: 7-9
   - Role: small but immovable tortoise with cracked shell plates.
   - Visual: canyon-like shell cracks, heavy feet, amber mineral glow.

2. `Riftback Tortoise`
   - Required level: 16
   - Requirement: 3 stone bond marks and one battle where it moved last and survived.
   - Role: battlefield setter.
   - Unlock move: `Rubble Field`.

3. `Mesaheart Testudo`
   - Required level: 34
   - Requirement: 6 stone bond marks, desert or ravine attunement, and a trainer win with rubble active.
   - Role: late terrain fortress.
   - Unlock move: `Faultline Citadel`.

### Image Description

A massive tortoise Vivo with a cracked stone shell like a small canyon, moss in the fissures, glowing amber mineral organs, and huge planted feet. The shell should feel like living geology grown through the body, with layered slate, root seams, and tiny mineral pools in the cracks. Its head is broad and calm, but the beak and foreclaws are heavy enough to imply real force. The ground under it is broken into small stone plates. It should feel ancient, immovable, and strategic rather than merely slow. Cozy-biotech storybook creature plate, no manufactured armor, no cute turtle mascot, no generic rock shell pasted on.

### Attack Ideas

- `Rubble Field`: support terrain. Applies a battlefield condition that slows fast enemies and strengthens stone guard moves.
- `Fault Bite`: impact stone attack. Bonus while rubble terrain is active.
- `Shell Ridge`: support guard. Strong brace, better under rubble terrain.
- `Quake Step`: support expose. Exposes targets that are slowed.
- `Faultline Citadel`: evolved terrain support. Sets stronger rubble and grants the user a guard.

### Runtime Data Needed

- Terrain or battlefield-condition hooks for `rubbleField`.
- Status hook for `slowed` if terrain applies it directly.
- Species entries for `crackback`, `riftbackTortoise`, and later `mesaheartTestudo`.
- Stone support and terrain moves.
- Portrait assets for active stages.
- Encounter placement in Sunspindle Dunes and Quartzroot Vault.
- Battle trait candidate: `Living Fault`, first terrain setup also braces the user.

## Frostbite Weasel

- Common name: `Frostbite Weasel`
- Registry name: `Glacies Mustela`
- Element: `ice`
- Biome fit: Frostglass Orchard, Aurorashard Tundra, Moonmilk Cavern.
- Start level: 7-10 as a fast early ice predator.
- Availability: uncommon wild encounter in frostgrass or ice lanes.
- Battle role: fast anti-healer and freeze setup skirmisher.
- Disposition: flighty.
- Stat shape: high speed, medium attack, medium focus, low HP and defense.
- Tactical identity: applies frostbite to weaken recovery, then chains into slow or freeze pressure.

### Evolution Line

1. `Rimekit Mustela`
   - Registry: `Glacies Mustela`
   - Element: ice
   - Start level: 4-6
   - Role: small dangerous frost weasel.
   - Visual: long low body, ice whiskers, sharp black paws, mean blue eyes.

2. `Frostbite Weasel`
   - Required level: 12
   - Requirement: 2 ice bond marks and one battle where the target was slowed or exposed.
   - Role: fast ice skirmisher.
   - Unlock move: `Frostbite Fang`.

3. `Whitefang Mustela`
   - Required level: 28
   - Requirement: 5 ice bond marks, frost attunement, and one win against a healed or guarded foe.
   - Role: anti-sustain predator.
   - Unlock move: `Deepfreeze Latch`.

### Image Description

A long white weasel Vivo with ice whiskers, sharp black paws, blue frostglass teeth, and a low stalking pose. The body should be sleek and fast, with frost plates grown along the spine like small blade buds and pale blue cold veins under the fur. Its eyes are narrow and mean, and the mouth is slightly open enough to show dangerous frozen teeth. The tail curls like a snowdrift but ends in a sharp frost organ. It should look small compared with bears and elk, but far from harmless. Cozy-biotech storybook creature plate, no plush weasel, no generic ice glow, no photoreal wildlife.

### Attack Ideas

- `Chill Nip`: impact ice attack. May apply `slowed`.
- `Frostbite Fang`: impact ice attack. Applies `frostbitten`, reducing healing and calm recovery.
- `Snowline Feint`: support expose. Exposes slower targets.
- `Freeze Latch`: impact ice attack. Chance to apply `frozen` if the target is frostbitten.
- `Deepfreeze Latch`: evolved ice finisher. Heavy damage and stronger freeze chance against frostbitten targets.

### Runtime Data Needed

- Status hooks for `frostbitten`, `slowed`, and `frozen`.
- Species entries for `rimekitMustela`, `frostbiteWeasel`, and later `whitefangMustela`.
- Ice skirmisher moves and anti-heal behavior.
- Portrait assets for active stages.
- Encounter placement in Frostglass Orchard.
- Battle trait candidate: `Cold Bite`, first attack against a slowed target applies frostbite.

## Gloomhorn Ram

- Common name: `Gloomhorn Ram`
- Registry name: `Umbra Aries`
- Element: `shadow`
- Biome fit: Gloamrail Cut, Glassroot Burrow shadow pockets, Mournroot Sanctum if added.
- Start level: 11-14 as a rare shadow bruiser.
- Availability: rare wild encounter or memorial-route guardian.
- Battle role: fear bruiser and morale breaker.
- Disposition: steadfast.
- Stat shape: high attack and defense, high HP, low focus, low-medium speed.
- Tactical identity: uses fear to weaken retaliation, then breaks exposed or frightened targets with horn charges.

### Evolution Line

1. `Dreadkid Aries`
   - Registry: `Umbra Aries`
   - Element: shadow
   - Start level: 6-8
   - Role: young black ram with oversized shadow-glass horn buds.
   - Visual: lowered head, violet vein glow, heavy hooves, guarded eyes.

2. `Gloomhorn Ram`
   - Required level: 15
   - Requirement: 3 shadow bond marks and one clean retreat or calm capture in a shadow habitat.
   - Role: shadow bruiser and fear setup.
   - Unlock move: `Dread Bellow`.

3. `Mournhorn Aries`
   - Required level: 32
   - Requirement: 6 shadow bond marks, memorial or shadow attunement, and a win without knocking out a frightened wild Vivo.
   - Role: late guardian that uses fear without cruelty.
   - Unlock move: `Horn of Quiet`.

### Image Description

A muscular black ram Vivo with curling shadow-glass horns, dim violet veins, heavy hooves, and a lowered head. Its wool should look dense and light-swallowing, with small blue-black leaves and rootlike shadow growths caught in the fleece. The horns are partly translucent at the edges, like dark glass holding faint starlight. The eyes are watchful and severe, not demonic, and the stance should make it feel like a nightmare herd guardian that protects a quiet route. Cozy-biotech storybook creature plate, no demon horns, no skull imagery, no ordinary goat with purple glow.

### Attack Ideas

- `Dread Bellow`: support status. Applies `feared`, lowering enemy damage or wild confidence.
- `Gloom Charge`: impact shadow attack. Bonus against feared targets.
- `Quiet Hooves`: support guard. Braces and lowers wild bolt pressure.
- `Hollow Horn`: support expose. Exposes feared targets.
- `Horn of Quiet`: evolved impact shadow finisher. Heavy damage against feared or exposed targets and can calm wild bolt pressure after hit.

### Runtime Data Needed

- Status hook for `feared`.
- Species entries for `dreadkidAries`, `gloomhornRam`, and later `mournhornAries`.
- Shadow moves with fear, expose, and bolt-pressure behavior.
- Portrait assets for active stages.
- Encounter placement in Gloamrail Cut and future Mournroot Sanctum.
- Battle trait candidate: `Herd Dread`, first guard turn applies a weak fear read to the opponent.

## Sporecrown Stag

- Common name: `Sporecrown Stag`
- Registry name: `Toxica Cervus`
- Element: `poison` once poison is live, otherwise temporary `grass`.
- Biome fit: Sporebell Garden, Echobloom Canopy, Cadence Lab Annex.
- Start level: 12-15 as a rare garden guardian.
- Availability: rare wild encounter in spore-heavy flower fields or a scripted rescue near warning ribbons.
- Battle role: poison field setter and debuff bruiser.
- Disposition: steadfast.
- Stat shape: high HP and defense, medium attack, medium focus, low speed.
- Tactical identity: sets pollen poison, weakens attackers, and turns beautiful garden pressure into a dangerous long fight.

### Evolution Line

1. `Sporefawn`
   - Registry: `Toxica Cervus`
   - Element: poison
   - Start level: 6-8
   - Role: wary young deer with small fungal antler buds.
   - Visual: thin legs, serious eyes, pale green spots, tiny bell fungi along the shoulders.

2. `Sporecrown Stag`
   - Required level: 16
   - Requirement: 3 poison or grass bond marks and one battle where poison or weaken status mattered.
   - Role: garden poison bruiser.
   - Unlock move: `Pollen Crown`.

3. `Mycoking Cervus`
   - Required level: 33
   - Requirement: 6 poison bond marks, Sporebell attunement, and a win while poison terrain is active.
   - Role: late poison-terrain guardian.
   - Unlock move: `Crownrot Charge`.

### Image Description

A tall stag Vivo with powerful shoulders, narrow watchful eyes, and antlers overgrown with bell-shaped poisonous fungi. Its coat is deep moss brown and cream, crossed by luminous green spore veins and velvet antler roots that look alive. The antlers should feel like a dangerous organic crown, with pollen drifting from hanging bell caps. Hooves are dark and heavy, crushing violet spore grass underfoot. It should feel beautiful, noble, and unsafe to approach, like the living ruler of Sporebell Garden. Cozy-biotech storybook creature plate, no zombie rot, no cute deer mascot, no mushroom hat pasted on.

### Attack Ideas

- `Pollen Crown`: support terrain. Creates spore pollen that can poison or weaken enemies after actions.
- `Toxic Antler`: impact poison attack. Bonus against weakened targets.
- `Velvet Guard`: support guard. Braces and lowers incoming focus damage.
- `Spore Stamp`: support debuff. Applies `weakened` and may apply `poisoned`.
- `Crownrot Charge`: evolved impact poison finisher. Heavy damage against poisoned targets.

### Runtime Data Needed

- Poison element or poison status support.
- Battlefield condition hook for short-lived `pollenCrown`.
- Species entries for `sporefawn`, `sporecrownStag`, and later `mycokingCervus`.
- Portrait assets for active stages.
- Encounter placement in Sporebell Garden.
- Battle trait candidate: `Pollen Crown`, first guard turn seeds weak poison pressure.

## Mirrorjaw Otter

- Common name: `Mirrorjaw Otter`
- Registry name: `Aqua Lutra`
- Element: `water`, with future psychic or illusion pressure.
- Biome fit: Mirrorfen Flats, Moonfen Marsh, Tidegate Causeway.
- Start level: 8-11 as a clever wetland skirmisher.
- Availability: uncommon wild encounter in reflective pools.
- Battle role: evasion trickster and false-image setup.
- Disposition: flighty.
- Stat shape: high speed, medium focus, medium attack, low defense.
- Tactical identity: creates a reflection decoy, dodges one line, then strikes exposed targets from the waterline.

### Evolution Line

1. `Mirrorpup`
   - Registry: `Aqua Lutra`
   - Element: water
   - Start level: 4-6
   - Role: sharp-eyed otter kit that hides in reflections.
   - Visual: slick fur, crescent mask markings, small mirror-glass whisker organs.

2. `Mirrorjaw Otter`
   - Required level: 13
   - Requirement: 3 water bond marks and one successful careful retreat or decoy turn.
   - Role: water trickster skirmisher.
   - Unlock move: `False Ripple`.

3. `Doubleslip Lutra`
   - Required level: 28
   - Requirement: 5 water bond marks, Mirrorfen attunement, and a win after a foe missed a decoy.
   - Role: late evasion and counter attacker.
   - Unlock move: `Twinjaw Undertow`.

### Image Description

A sleek otter Vivo crouched on a mirror pool edge, with wet dark fur, pale crescent face markings, and glassy whisker organs reflecting a second false face in the water below. Its jaws are stronger than a normal otter's, with small translucent water teeth and webbed claws gripping the mud. The posture is playful only at first glance; the eyes should look clever, predatory, and hard to read. Reflections ripple around its paws like living decoys. Cozy-biotech storybook creature plate, no goofy otter mascot, no ordinary otter with blue glow, no photoreal fur.

### Attack Ideas

- `False Ripple`: support decoy. Applies `mirrored`, causing the next incoming attack to lose accuracy.
- `Glassjaw Bite`: impact water attack. Bonus after the target misses.
- `Reflection Slip`: support speed. Raises evasion and improves retreat chance.
- `Mudline Trip`: support expose. Exposes targets that are slowed or missed last turn.
- `Twinjaw Undertow`: evolved water finisher. Strikes twice if mirrored is active.

### Runtime Data Needed

- Status hook for `mirrored` or `decoy`.
- Species entries for `mirrorpup`, `mirrorjawOtter`, and later `doubleslipLutra`.
- Water moves with miss/counter interaction.
- Portrait assets for active stages.
- Encounter placement in Mirrorfen Flats.
- Battle trait candidate: `False Body`, first decoy turn also improves careful retreat.

## Thunderplume Crane

- Common name: `Thunderplume Crane`
- Registry name: `Fulgur Grus`
- Element: `electric`, future flying pressure.
- Biome fit: Thunderhead Mesa, Coppervine Runoff, Starglass Roost.
- Start level: 11-14 as a rare storm bird.
- Availability: rare wild encounter near lightning rods or high ridges.
- Battle role: fast stun support and turn-order manipulator.
- Disposition: wary.
- Stat shape: very high speed, high focus, low HP, low defense.
- Tactical identity: controls initiative, jolts slower enemies, and sets up clean switches.

### Evolution Line

1. `Stormchick Grus`
   - Registry: `Fulgur Grus`
   - Element: electric
   - Start level: 6-8
   - Role: long-legged juvenile storm bird.
   - Visual: awkward but serious, charged crest down the neck, tiny lightning-rod beak organ.

2. `Thunderplume Crane`
   - Required level: 15
   - Requirement: 3 electric bond marks and one win where it moved first three turns.
   - Role: speed-control electric striker.
   - Unlock move: `Plume Jolt`.

3. `Stormspire Grus`
   - Required level: 32
   - Requirement: 6 electric bond marks, Thunderhead attunement, and one stunned-target finish.
   - Role: late electric tempo controller.
   - Unlock move: `Stormspire Spear`.

### Image Description

A tall crane Vivo standing in dry storm grass with long black legs, a blade-like beak, and a crest of blue-white conductive feathers running from head to back. Its wing feathers are elegant but dangerous, tipped with copper filaments that arc with static. The body should be slender and graceful, but the eyes are severe and the beak points like a spear. Lightning rod organs grow organically from the crest and shoulder feathers. It should feel like a fast storm sentinel, not a soft bird. Cozy-biotech storybook creature plate, no robot bird, no thunder god costume, no ordinary crane with sparks pasted on.

### Attack Ideas

- `Plume Jolt`: focus electric attack. Applies `jolted` on clean hit.
- `Static Step`: support speed. Guarantees the next action acts earlier unless stunned.
- `Rod Wing`: support guard. Braces and stores charge if hit.
- `Spear Beak`: impact electric attack. Bonus against jolted targets.
- `Stormspire Spear`: evolved focus electric finisher. Heavy damage and chance to stun.

### Runtime Data Needed

- Status hooks for `jolted` and `stunned`.
- Species entries for `stormchickGrus`, `thunderplumeCrane`, and later `stormspireGrus`.
- Electric speed-control move support.
- Portrait assets for active stages.
- Encounter placement in Thunderhead Mesa.
- Battle trait candidate: `Storm Stride`, first electric setup gives a one-turn speed read.

## Railshade Ferret

- Common name: `Railshade Ferret`
- Registry name: `Umbra Mustela`
- Element: `shadow`
- Biome fit: Gloamrail Cut, Glassroot Burrow, future underpass routes.
- Start level: 7-10 as an early shadow skirmisher.
- Availability: uncommon wild encounter in rail thorns and shadow grass.
- Battle role: fast fear/expose skirmisher.
- Disposition: flighty.
- Stat shape: high speed, medium attack, medium focus, low defense.
- Tactical identity: darts through cover, frightens the target, and punishes exposed lines.

### Evolution Line

1. `Shadekit Mustela`
   - Registry: `Umbra Mustela`
   - Element: shadow
   - Start level: 4-6
   - Role: small black ferret with rail-shadow markings.
   - Visual: low body, bright eyes, violet whisker roots, bramble burrs in fur.

2. `Railshade Ferret`
   - Required level: 12
   - Requirement: 2 shadow bond marks and one careful retreat in a shadow habitat.
   - Role: fast shadow status skirmisher.
   - Unlock move: `Track Flicker`.

3. `Underrail Mustela`
   - Required level: 27
   - Requirement: 5 shadow bond marks, Gloamrail attunement, and a win after fear or expose.
   - Role: late evasive shadow finisher.
   - Unlock move: `Blacktrack Ambush`.

### Image Description

A long low ferret Vivo standing between wet rail sleepers, with dark fur that swallows lantern light, violet whisker roots, and bramble-thorn markings running down its spine. Its paws are narrow and quick, claws hooked into old wood, and its eyes should look alert, clever, and a little cruel. The tail is smoky but still biological, with shadow membranes only at the edges. It should feel like a dangerous little ambush creature that can vanish into rail shadows. Cozy-biotech storybook creature plate, no demon smoke monster, no cute pet ferret, no generic purple glow.

### Attack Ideas

- `Track Flicker`: support evasion. Applies `hidden`, lowering the next incoming attack accuracy.
- `Gloam Nip`: impact shadow attack. Bonus against feared targets.
- `Rail Skitter`: support expose. Exposes a target after the user dodges or moves first.
- `Startle Hiss`: support status. Applies weak `feared`.
- `Blacktrack Ambush`: evolved shadow finisher. Heavy damage from hidden and exposes on hit.

### Runtime Data Needed

- Status hooks for `hidden` and `feared`.
- Species entries for `shadekitMustela`, `railshadeFerret`, and later `underrailMustela`.
- Shadow evasion/expose moves.
- Portrait assets for active stages.
- Encounter placement in Gloamrail Cut.
- Battle trait candidate: `Rail Flicker`, first missed attack against it exposes the foe.

## Containment Hound

- Common name: `Containment Hound`
- Registry name: `Fulgur Canis`
- Element: `electric`
- Biome fit: Cadence Lab Annex, Briar Town patrol fights, future whitecoat depot.
- Start level: 13-16 as a lab-origin or trainer-release creature.
- Availability: scripted rescue from patrol or rare lab encounter.
- Battle role: stun bruiser and anti-switch pressure.
- Disposition: wary.
- Stat shape: high attack, medium speed, medium defense, medium HP.
- Tactical identity: pins targets with restraint-like electric biology, stunning or slowing enemies that try to reposition.

### Evolution Line

1. `Latchpup`
   - Registry: `Fulgur Canis`
   - Element: electric
   - Start level: 7-9
   - Role: lab-raised hound juvenile with restraint gland biology.
   - Visual: serious eyes, clamp-like jaw muscles, conductive collar-like fur growths that are biological, not gear.

2. `Containment Hound`
   - Required level: 16
   - Requirement: 3 electric bond marks and a rescue memory from a lab or patrol scene.
   - Role: electric bruiser and stun pin.
   - Unlock move: `Latch Current`.

3. `Freebolt Canis`
   - Required level: 34
   - Requirement: 6 electric bond marks, lab-origin rescue memory, and a win against a trainer without using capture tools.
   - Role: reclaimed anti-patrol guardian.
   - Unlock move: `Breaker Howl`.

### Image Description

A powerful hound Vivo with a low guarded stance, thick shoulders, and electric restraint organs grown through the neck and jaw like living conductive fur rather than equipment. Its coat is charcoal, cream, and blue-white, with warning-light pulses under the skin and clamp-strong jaws held slightly open. The expression should be tense and mistrustful, as if it was built to contain other Vivos but is learning to protect them instead. It should look strong, tragic, and dangerous. Cozy-biotech storybook creature plate, no police dog gear, no metal collar, no robot dog.

### Attack Ideas

- `Latch Current`: impact electric attack. Applies `jolted` and lowers switch safety.
- `Restraint Snarl`: support status. Applies `pinned`, reducing retreat and switch benefits.
- `Breaker Bite`: impact electric attack. Bonus against pinned targets.
- `Free Step Guard`: support guard. Braces and clears one negative control status from self.
- `Breaker Howl`: evolved support. Clears pinned/fear from allies and jolts the foe.

### Runtime Data Needed

- Status hooks for `pinned` and `jolted`.
- Species entries for `latchpup`, `containmentHound`, and later `freeboltCanis`.
- Lab rescue memory hooks.
- Portrait assets for active stages.
- Encounter or trainer-release placement in Cadence Lab Annex.
- Battle trait candidate: `Broken Leash`, becomes stronger after being freed from status.

## Moonmilk Tapir

- Common name: `Moonmilk Tapir`
- Registry name: `Aqua Tapirus`
- Element: `water`, with calm/healing pressure.
- Biome fit: Moonmilk Cavern, Moonfen Marsh, Mirrorfen Flats.
- Start level: 9-12 as a gentle but bulky support Vivo.
- Availability: uncommon wild encounter in healing caves.
- Battle role: healer, sleep support, and capture stabilizer.
- Disposition: steadfast.
- Stat shape: high HP, high focus, medium defense, low speed and attack.
- Tactical identity: heals allies, calms wild targets, and uses dreamlike mist to make fights safer.

### Evolution Line

1. `Milkveil Calf`
   - Registry: `Aqua Tapirus`
   - Element: water
   - Start level: 5-7
   - Role: young cave tapir with pale mineral markings.
   - Visual: rounded but serious, crescent nose organ, moonmilk drops along the back.

2. `Moonmilk Tapir`
   - Required level: 14
   - Requirement: 3 water bond marks and one calm capture or careful retreat in Moonmilk Cavern.
   - Role: healing support and drowsy setup.
   - Unlock move: `Moonmilk Mist`.

3. `Dreamwell Tapirus`
   - Required level: 30
   - Requirement: 6 water bond marks, Moonmilk attunement, and one battle won after healing an ally.
   - Role: late sustain support.
   - Unlock move: `Dreamwell Surge`.

### Image Description

A sturdy tapir Vivo with pale blue-gray hide, soft mineral-white striping, and a crescent trunk organ that drips glowing moonmilk water. Its body is broad and calm, but the hooves are heavy and the eyes are deeply watchful. Milky water sacs and limestone-like plates grow along the shoulders and hips, with soft blue fungi light reflecting in the wet skin. It should feel restorative without becoming harmless, like a cave guardian that can put a fight to sleep if forced. Cozy-biotech storybook creature plate, no cute plush tapir, no medical equipment, no photorealism.

### Attack Ideas

- `Moonmilk Mist`: support heal. Restores HP and lowers wild bolt pressure.
- `Drowsing Spray`: support status. Applies `drowsy`.
- `Mineral Shoulder`: impact water attack. Medium damage, bonus while guarded.
- `Still Basin`: support guard. Braces and improves the next heal or capture pulse.
- `Dreamwell Surge`: evolved support. Strong heal and chance to turn drowsy into asleep.

### Runtime Data Needed

- Status hooks for `drowsy` and `asleep`.
- Healing support moves usable in battle.
- Species entries for `milkveilCalf`, `moonmilkTapir`, and later `dreamwellTapirus`.
- Portrait assets for active stages.
- Encounter placement in Moonmilk Cavern.
- Battle trait candidate: `Quiet Basin`, first heal also grants a small guard.

## Starhook Crab

- Common name: `Starhook Crab`
- Registry name: `Aqua Cancer`
- Element: `water`
- Biome fit: Asterwake Shoals, Tidegate Causeway, Tideglass Grotto.
- Start level: 8-11 as a coastal guard breaker.
- Availability: common to uncommon wild encounter in starfish beds and shell paths.
- Battle role: water guard breaker and trapper.
- Disposition: steadfast.
- Stat shape: high defense, medium attack, medium HP, low speed.
- Tactical identity: clamps down, pins targets, and cracks guards with hook claws.

### Evolution Line

1. `Starclaw`
   - Registry: `Aqua Cancer`
   - Element: water
   - Start level: 4-6
   - Role: small tidepool crab with star-shaped shell growth.
   - Visual: one oversized hook claw, bright tidepool eyes, living starfish patterning.

2. `Starhook Crab`
   - Required level: 13
   - Requirement: 3 water bond marks and one battle won in Asterwake Shoals.
   - Role: water trapper and guard breaker.
   - Unlock move: `Hook Clamp`.

3. `Reefhook Cancer`
   - Required level: 28
   - Requirement: 5 water bond marks, Asterwake attunement, and a win after pinning a target.
   - Role: late coastal wallbreaker.
   - Unlock move: `Fivepoint Crush`.

### Image Description

A broad crab Vivo with a star-shaped living shell pattern, one huge hook claw, and smaller precise grasping claws. Its shell is pale coral, dark blue, and gold, with engineered starfish growths fused into the carapace like living armor grown from tidepool biology. The eyes are bright and alert on short stalks, not silly. Wet shell ridges and barnacle-like light organs make it feel native to Asterwake Shoals. It should look sturdy, useful, and dangerous when it clamps down. Cozy-biotech storybook creature plate, no cartoon crab smile, no pirate motifs, no hard metal armor.

### Attack Ideas

- `Hook Clamp`: impact water attack. Applies `pinned`.
- `Shell Guard`: support guard. Braces and reduces impact damage.
- `Tide Snip`: impact water attack. Bonus against guarded targets.
- `Starfish Hold`: support control. Improves capture odds by lowering bolt pressure.
- `Fivepoint Crush`: evolved impact water finisher. Heavy damage against pinned targets.

### Runtime Data Needed

- Status hook for `pinned`.
- Species entries for `starclaw`, `starhookCrab`, and later `reefhookCancer`.
- Water clamp/control moves.
- Portrait assets for active stages.
- Encounter placement in Asterwake Shoals.
- Battle trait candidate: `Tide Clamp`, first guard-breaking hit pins the target.

## Prismscale Basilisk

- Common name: `Prismscale Basilisk`
- Registry name: `Lumen Basiliscus`
- Element: `light`
- Biome fit: Prismfall Cavern, Prismfall Ravine, Starglass Roost.
- Start level: 13-16 as a rare crystal predator.
- Availability: rare wild encounter around mirror pools and prism spires.
- Battle role: blind/paralyze focus predator.
- Disposition: wary.
- Stat shape: high focus, high speed, medium attack, low defense.
- Tactical identity: blinds enemies with reflected glare, then locks them into exposed mistakes.

### Evolution Line

1. `Glareling`
   - Registry: `Lumen Basiliscus`
   - Element: light
   - Start level: 7-9
   - Role: small prism lizard with dangerous eye organs.
   - Visual: long crest, crystal scale ridges, intense reflective eyes.

2. `Prismscale Basilisk`
   - Required level: 16
   - Requirement: 3 light bond marks and one win after blinding or marking a target.
   - Role: focus predator and blind setup.
   - Unlock move: `Basilisk Glare`.

3. `Refractyl Basiliscus`
   - Required level: 34
   - Requirement: 6 light bond marks, Prismfall attunement, and a marked-target finisher.
   - Role: late light-control sweeper.
   - Unlock move: `Refracted Lock`.

### Image Description

A sleek basilisk lizard Vivo with prism scales, a high glassy crest, and reflective eyes that look dangerous to meet directly. Its body is long and athletic, with translucent scale plates along the spine and forelimbs, and pale rainbow light running through the throat and eye organs. The claws grip wet crystal stone, and its tail curves like a lens catching sunlight. It should feel fast, predatory, and hypnotic rather than magical in a generic way. Cozy-biotech storybook creature plate, no dragon, no medieval basilisk monster, no angel symbolism.

### Attack Ideas

- `Basilisk Glare`: support status. Applies `blinded` and `marked`.
- `Prism Bite`: focus light attack. Bonus against marked targets.
- `Lens Sprint`: support speed. Moves earlier next turn and improves evasion.
- `Glass Tail Lash`: impact light attack. Exposes blinded targets.
- `Refracted Lock`: evolved focus finisher. Heavy damage and extends blind on hit.

### Runtime Data Needed

- Status hooks for `blinded` and `marked`.
- Species entries for `glareling`, `prismscaleBasilisk`, and later `refractylBasiliscus`.
- Light status and focus moves.
- Portrait assets for active stages.
- Encounter placement in Prismfall Cavern or Ravine.
- Battle trait candidate: `Eye Lens`, first focus setup also marks the foe.

## Saltglass Scorpion

- Common name: `Saltglass Scorpion`
- Registry name: `Petra Scorpio`
- Element: `stone`, with fire/light mirage pressure.
- Biome fit: Redglass Saltpan, Sunspindle Dunes.
- Start level: 10-13 as a desert ambush creature.
- Availability: uncommon wild encounter in red mineral crust and salt flats.
- Battle role: trapper, wound applier, and anti-retreat predator.
- Disposition: wary.
- Stat shape: high attack, medium defense, medium speed, low focus.
- Tactical identity: pins targets in glassy salt, wounds them with tail strikes, and punishes retreat attempts.

### Evolution Line

1. `Saltsting`
   - Registry: `Petra Scorpio`
   - Element: stone
   - Start level: 5-7
   - Role: small glass-salt scorpion.
   - Visual: translucent tail bulb, red mineral plates, sharp claws, flat ambush posture.

2. `Saltglass Scorpion`
   - Required level: 14
   - Requirement: 3 stone bond marks and one win in Redglass Saltpan.
   - Role: desert trapper and wound striker.
   - Unlock move: `Glass Sting`.

3. `Miragesting Scorpio`
   - Required level: 30
   - Requirement: 6 stone bond marks, Redglass attunement, and a hit against a retreating or pinned target.
   - Role: late desert ambush finisher.
   - Unlock move: `Saltpan Mirage`.

### Image Description

A low scorpion Vivo with red glass mineral plates, pale salt-crystal claws, and a high curved tail ending in a translucent venom-stone bulb. Its body should look like it grew from cracked salt flats and red mineral crust, with heat shimmer bending around the tail. The claws are angular but organic, and the eyes are tiny, bright, and predatory. It should look like an ambush danger hidden in beautiful desert glass. Cozy-biotech storybook creature plate, no robot scorpion, no horror gore, no generic desert monster.

### Attack Ideas

- `Glass Sting`: impact stone attack. Applies `wounded`.
- `Salt Snare`: support control. Applies `pinned` or lowers retreat chance.
- `Redglass Claw`: impact stone attack. Bonus against wounded targets.
- `Mirage Skitter`: support evasion. Raises evasion and exposes missed attackers.
- `Saltpan Mirage`: evolved support/attack. Applies pinned and then strikes with bonus damage if the target is wounded.

### Runtime Data Needed

- Status hooks for `wounded` and `pinned`.
- Species entries for `saltsting`, `saltglassScorpion`, and later `miragestingScorpio`.
- Stone trapper moves.
- Portrait assets for active stages.
- Encounter placement in Redglass Saltpan.
- Battle trait candidate: `Glass Ambush`, first hit against a retreating target applies wound.

## Magmafin Ray

- Common name: `Magmafin Ray`
- Registry name: `Ignis Batoidea`
- Element: `fire`, with molten shore ecology.
- Biome fit: Cindershore Strand, Cinderlake Basin, Magmaheart Caldera.
- Start level: 12-15 as a rare molten-shore creature.
- Availability: rare encounter in molten surf or magma lake edges.
- Battle role: fire focus attacker and burn terrain user.
- Disposition: wary.
- Stat shape: high focus, medium HP, medium defense, low speed.
- Tactical identity: glides through heat, burns targets, and turns shore terrain into sustained fire pressure.

### Evolution Line

1. `Emberray`
   - Registry: `Ignis Batoidea`
   - Element: fire
   - Start level: 7-9
   - Role: small molten tidepool ray.
   - Visual: flat body, glowing fin edges, coal-dark spots, serious eyes.

2. `Magmafin Ray`
   - Required level: 16
   - Requirement: 3 fire bond marks and one battle won in Cindershore or Cinderlake.
   - Role: fire focus attacker.
   - Unlock move: `Molten Glide`.

3. `Calderamanta`
   - Required level: 34
   - Requirement: 6 fire bond marks, magma attunement, and a burn finish.
   - Role: late lava-field focus sweeper.
   - Unlock move: `Manta Eruption`.

### Image Description

A broad ray Vivo floating just above black glass sand and molten surf, with wide wing-like fins edged in ember glow and dark basalt spotting across the back. Its body should look soft and organic, but heat organs pulse beneath the skin like lava under thin stone. The tail is long and whip-like with a glowing furnace barb, and the face is calm but unreadable. It should feel beautiful, strange, and dangerous, like a creature that swims through magma tide pools. Cozy-biotech storybook creature plate, no dragon ray, no mechanical hover, no generic flame wings.

### Attack Ideas

- `Molten Glide`: focus fire attack. Bonus while fire battlefield conditions are active.
- `Heat Haze`: support status. Applies `smoked`, lowering enemy accuracy.
- `Furnace Barb`: impact fire attack. May apply `burned`.
- `Lava Skim`: support speed/guard. Braces and improves next fire hit.
- `Manta Eruption`: evolved focus fire finisher. Heavy damage and stronger against burned targets.

### Runtime Data Needed

- Status hooks for `burned` and `smoked`.
- Species entries for `emberray`, `magmafinRay`, and later `calderamanta`.
- Fire focus moves.
- Portrait assets for active stages.
- Encounter placement in Cindershore Strand and Cinderlake Basin.
- Battle trait candidate: `Molten Drift`, fire battlefield boosts also improve its guard.

## Auroraclaw Lynx

- Common name: `Auroraclaw Lynx`
- Registry name: `Glacies Lynx`
- Element: `ice`, with light-adjacent aurora pressure.
- Biome fit: Aurorashard Tundra, Frostglass Orchard.
- Start level: 13-16 as a rare polar predator.
- Availability: rare wild encounter under aurora crystal ridges.
- Battle role: ice ambusher and mark finisher.
- Disposition: wary.
- Stat shape: high attack and speed, medium focus, low defense.
- Tactical identity: marks prey under aurora light, then hits hard with ice claws before the target can reset.

### Evolution Line

1. `Aurorakit Lynx`
   - Registry: `Glacies Lynx`
   - Element: ice
   - Start level: 7-9
   - Role: serious lynx kitten with heavy paws and aurora ear tufts.
   - Visual: cold eyes, oversized paws, frostglass whiskers, glowing ear membranes.

2. `Auroraclaw Lynx`
   - Required level: 16
   - Requirement: 3 ice bond marks and one marked-target hit.
   - Role: ice ambush predator.
   - Unlock move: `Aurora Mark`.

3. `Skyfrost Lynx`
   - Required level: 33
   - Requirement: 6 ice bond marks, Aurorashard attunement, and a win after marking prey.
   - Role: late ice/light predator.
   - Unlock move: `Skyfrost Rake`.

### Image Description

A muscular lynx Vivo crouched in aurora snow, with huge paws, frostglass whiskers, glowing ear membranes, and pale green-blue aurora veins under thick winter fur. Its face is serious and predatory, with sharp cheek fur and cold eyes fixed forward. Ice plates grow naturally along the shoulders and spine, while the claws glow faintly like frozen light. It should look beautiful but clearly dangerous, a snowfield hunter rather than a pet cat. Cozy-biotech storybook creature plate, no smiling kitten, no generic white tiger, no photoreal wildlife.

### Attack Ideas

- `Aurora Mark`: support status. Applies `marked` and improves ice attack accuracy.
- `Frostclaw Rake`: impact ice attack. Bonus against marked targets.
- `Snowblind Leap`: support status. Applies `blinded` if the user moves first.
- `Pounce Through`: impact ice attack. Exposes targets that are blinded or marked.
- `Skyfrost Rake`: evolved impact ice finisher. Heavy damage against marked targets.

### Runtime Data Needed

- Status hooks for `marked` and `blinded`.
- Species entries for `aurorakitLynx`, `auroraclawLynx`, and later `skyfrostLynx`.
- Ice mark and ambush moves.
- Portrait assets for active stages.
- Encounter placement in Aurorashard Tundra.
- Battle trait candidate: `Aurora Stalk`, first mark also grants a small speed read.

## Tideglass Seahorse

- Common name: `Tideglass Seahorse`
- Registry name: `Aqua Hippocampus`
- Element: `water`, with light support pressure.
- Biome fit: Tideglass Grotto, Asterwake Shoals, Moonmilk Cavern.
- Start level: 7-10 as a delicate support encounter.
- Availability: uncommon wild encounter in luminous pools.
- Battle role: focus support, healing, and accuracy control.
- Disposition: flighty.
- Stat shape: high focus, high speed, low HP and attack.
- Tactical identity: supports the party with clear-water focus, then uses glassy bursts to punish marked enemies.

### Evolution Line

1. `Glassfoal`
   - Registry: `Aqua Hippocampus`
   - Element: water
   - Start level: 4-6
   - Role: tiny but alert seahorse with glass fins.
   - Visual: curled tail, translucent crest, glowing water sac.

2. `Tideglass Seahorse`
   - Required level: 12
   - Requirement: 2 water bond marks and one battle where it used a support move before attacking.
   - Role: water focus support.
   - Unlock move: `Tideglass Focus`.

3. `Prismtide Hippocampus`
   - Required level: 27
   - Requirement: 5 water bond marks, Tideglass attunement, and a marked-target finish.
   - Role: late water/light support striker.
   - Unlock move: `Prismtide Jet`.

### Image Description

A delicate but serious seahorse Vivo hovering in luminous cave water, with translucent glass fins, a curled tail gripping a blue crystal reed, and glowing water sacs along the chest. Its head crest is sharp and crown-like, not cute, and the eyes are watchful. The body should be small but jewel-like, with water and light biology integrated into glassy membranes and fin veins. It should feel rare, elegant, and useful in battle through precision rather than bulk. Cozy-biotech storybook creature plate, no cartoon seahorse, no mermaid/fantasy accessory, no photoreal fish.

### Attack Ideas

- `Tideglass Focus`: support focus. Boosts the user's next focus attack or ally-style future support.
- `Clearwater Dart`: focus water attack. Reliable low damage.
- `Glass Bubble`: support guard. Braces and may apply `marked` if struck.
- `Refraction Jet`: focus water attack. Bonus against marked targets.
- `Prismtide Jet`: evolved focus finisher. Heavy water damage and improves next capture pulse in wild fights.

### Runtime Data Needed

- Status hook for `marked`.
- Species entries for `glassfoal`, `tideglassSeahorse`, and later `prismtideHippocampus`.
- Water focus support moves.
- Portrait assets for active stages.
- Encounter placement in Tideglass Grotto and Asterwake Shoals.
- Battle trait candidate: `Clearwater Read`, first focus setup also improves capture forecast.

## Quartzback Gorilla

- Common name: `Quartzback Gorilla`
- Registry name: `Petra Gorilla`
- Element: `stone`
- Biome fit: Quartzroot Vault, Glassroot Burrow, Prismfall Cavern.
- Start level: 14-18 as a rare cave bruiser.
- Availability: rare wild encounter or cave guardian rescue.
- Battle role: heavy stone bruiser and setup breaker.
- Disposition: steadfast.
- Stat shape: very high attack and HP, high defense, very low speed.
- Tactical identity: shrugs off setup, pounds through guards, and protects cave routes by force.

### Evolution Line

1. `Quartzkid Gorilla`
   - Registry: `Petra Gorilla`
   - Element: stone
   - Start level: 8-10
   - Role: young but massive-armed cave ape.
   - Visual: heavy fists, quartz knuckle growths, suspicious eyes, broad chest.

2. `Quartzback Gorilla`
   - Required level: 18
   - Requirement: 3 stone bond marks and one win after breaking a guard.
   - Role: cave bruiser and guard breaker.
   - Unlock move: `Quartz Knuckle`.

3. `Vaultback Gorilla`
   - Required level: 36
   - Requirement: 6 stone bond marks, Quartzroot attunement, and a trainer win without switching.
   - Role: late immovable cave boss.
   - Unlock move: `Vaultbreaker Slam`.

### Image Description

A massive gorilla Vivo with quartz crystal growths across its back, shoulders, and knuckles, standing in a low protective stance. Its arms are enormous, fists planted on the ground, with living stone plates and root seams grown through dark fur. The face is stern and intelligent, not monstrous, with amber mineral glow in the chest and eyes. Quartz spines rise from the back like a natural crown of cave crystal. It should feel like a route guardian that can cave in a wall with one punch. Cozy-biotech storybook creature plate, no armor, no ordinary gorilla with rocks glued on, no cartoon ape.

### Attack Ideas

- `Quartz Knuckle`: impact stone attack. Breaks guard and may expose.
- `Vault Chest`: support guard. Strong brace, lowers focus damage.
- `Rootstone Roar`: support status. Applies `feared` to frail or faster foes.
- `Cave-In Punch`: impact stone attack. Bonus against guarded or setup-primed targets.
- `Vaultbreaker Slam`: evolved impact finisher. Heavy damage and clears enemy guard/focus.

### Runtime Data Needed

- Status hook for `feared` if used.
- Species entries for `quartzkidGorilla`, `quartzbackGorilla`, and later `vaultbackGorilla`.
- Stone guard-breaker moves.
- Portrait assets for active stages.
- Encounter placement in Quartzroot Vault.
- Battle trait candidate: `Vaultbreaker`, first hit into a guarded target also exposes.

## Glowroot Axolotl

- Common name: `Glowroot Axolotl`
- Registry name: `Lumen Ambystoma`
- Element: `light`, with water healing pressure.
- Biome fit: Moonfen Marsh, Lumenveil Grove, Moonmilk Cavern.
- Start level: 6-9 as an early support creature.
- Availability: uncommon rescue or wild encounter in calm luminous pools.
- Battle role: regeneration support and rescue-calm helper.
- Disposition: steadfast.
- Stat shape: medium HP, high focus, medium defense, low attack.
- Tactical identity: regenerates under calm pressure, improves rescue outcomes, and supports slower teams.

### Evolution Line

1. `Glowtad`
   - Registry: `Lumen Ambystoma`
   - Element: light
   - Start level: 3-5
   - Role: small luminous axolotl juvenile.
   - Visual: serious wide eyes, frilled gills, tiny glowing root buds.

2. `Glowroot Axolotl`
   - Required level: 12
   - Requirement: 2 light bond marks and one trust-first rescue.
   - Role: calm healer and light support.
   - Unlock move: `Glowroot Mend`.

3. `Sanctuary Ambystoma`
   - Required level: 28
   - Requirement: 5 light bond marks, Moonfen or Moonmilk rescue memory, and a battle won after healing.
   - Role: late rescue support.
   - Unlock move: `Sanctuary Bloom`.

### Image Description

A luminous axolotl Vivo standing in shallow moonlit water, with translucent frilled gills shaped like soft roots and small glowing bulbs along the spine. Its body is pale rose, cream, and warm gold, with gentle but serious eyes and sturdy little limbs. The gills and tail should look biologically engineered for healing light and water filtration, not decorative angel parts. It should feel precious and bondable, but still strange and powerful in a sanctuary way. Cozy-biotech storybook creature plate, no smiling mascot, no medical symbol, no photoreal amphibian.

### Attack Ideas

- `Glowroot Mend`: support heal. Restores HP and adds a small guard if the target is below half HP.
- `Lantern Gill`: focus light attack. Low damage, improves calm read.
- `Rootlight Guard`: support guard. Braces and improves next heal.
- `Trust Pulse`: support rescue. Improves capture or scripted rescue trust pulse.
- `Sanctuary Bloom`: evolved support. Strong heal and clears one poison/burn/fear-style status.

### Runtime Data Needed

- Healing and status-clear support.
- Species entries for `glowtad`, `glowrootAxolotl`, and later `sanctuaryAmbystoma`.
- Portrait assets for active stages.
- Encounter placement in Moonfen Marsh and Moonmilk Cavern.
- Battle trait candidate: `Regrowth Light`, first heal also grants one calm read in wild fights.

## Emberglass Gazelle

- Common name: `Emberglass Gazelle`
- Registry name: `Ignis Gazella`
- Element: `fire`
- Biome fit: Sunspindle Dunes, Redglass Saltpan, Ember Hollow.
- Start level: 8-11 as a desert speed creature.
- Availability: uncommon wild encounter in heat-glass dunes.
- Battle role: fast fire skirmisher and burn-and-retreat specialist.
- Disposition: flighty.
- Stat shape: very high speed, medium attack, medium focus, low defense.
- Tactical identity: darts through heat shimmer, burns or exposes, then retreats cleanly from bad matchups.

### Evolution Line

1. `Emberkid Gazella`
   - Registry: `Ignis Gazella`
   - Element: fire
   - Start level: 4-6
   - Role: young desert gazelle with sharp heat-glass horn buds.
   - Visual: serious eyes, long legs, amber glass hooves, heat shimmer organs.

2. `Emberglass Gazelle`
   - Required level: 13
   - Requirement: 3 fire bond marks and one careful retreat in a desert route.
   - Role: fire speed skirmisher.
   - Unlock move: `Mirage Bound`.

3. `Sunspindle Gazella`
   - Required level: 29
   - Requirement: 6 fire bond marks, Sunspindle attunement, and a win after a retreat forecast was favorable.
   - Role: late hit-and-run fire striker.
   - Unlock move: `Sunspindle Kick`.

### Image Description

A lean gazelle Vivo with long legs, amber heat-glass hooves, small sharp translucent horns, and ember markings along the flanks. Its body should look fast and nervous but not fragile, with tense shoulder muscles and a focused desert stare. Heat shimmer organs glow under the skin around the chest and ankles, bending the air as it moves. The hooves should look hot enough to cut glassy sand. Cozy-biotech storybook creature plate, no cute deer mascot, no normal antelope with flame stickers, no unicorn language.

### Attack Ideas

- `Mirage Bound`: support speed/evasion. Raises speed read and improves retreat chance.
- `Glasshoof Kick`: impact fire attack. Bonus if the user moves first.
- `Heat Feint`: support expose. Exposes a target that missed or is slower.
- `Ember Dash`: impact fire attack. May apply `burned`.
- `Sunspindle Kick`: evolved impact finisher. Heavy damage and safe-retreat bonus after hit.

### Runtime Data Needed

- Status hook for `burned`.
- Species entries for `emberkidGazella`, `emberglassGazelle`, and later `sunspindleGazella`.
- Fire speed and retreat-support moves.
- Portrait assets for active stages.
- Encounter placement in Sunspindle Dunes and Redglass Saltpan.
- Battle trait candidate: `Heatglass Sprint`, first speed setup improves careful retreat.

## Coppervine Gecko

- Common name: `Coppervine Gecko`
- Registry name: `Fulgur Gekko`
- Element: `electric`
- Biome fit: Coppervine Runoff, Cadence Lab Annex, Thunderhead Mesa.
- Start level: 5-8 as an early electric wall-climber.
- Availability: common to uncommon encounter in charged gutters and cable roots.
- Battle role: sticky debuffer and stun setup.
- Disposition: flighty.
- Stat shape: high speed, medium focus, low HP, low defense.
- Tactical identity: sticks charge to targets, slows them, then sets up bigger electric attackers.

### Evolution Line

1. `Copperling`
   - Registry: `Fulgur Gekko`
   - Element: electric
   - Start level: 3-5
   - Role: tiny charged gecko with sticky conductive toes.
   - Visual: big serious eyes, copper toe pads, blue runoff stripe.

2. `Coppervine Gecko`
   - Required level: 11
   - Requirement: 2 electric bond marks and one jolt setup.
   - Role: electric debuffer.
   - Unlock move: `Sticky Charge`.

3. `Circuitail Gekko`
   - Required level: 26
   - Requirement: 5 electric bond marks, Coppervine attunement, and a win after slowing a target.
   - Role: late electric setup support.
   - Unlock move: `Circuit Tail Snap`.

### Image Description

A small gecko Vivo clinging to a coppervine root, with bright blue conductive stripes, sticky copper toe pads, and a long tail shaped like a living cable root. Its eyes are large but focused, not cute, and tiny static arcs run between its toes and tail. The skin should look organic and damp from charged runoff, with vine-like electric glands along the sides. It should feel quick, clever, and hard to catch. Cozy-biotech storybook creature plate, no robot lizard, no ordinary gecko with lightning decals, no mascot grin.

### Attack Ideas

- `Sticky Charge`: support status. Applies `jolted` and may apply `slowed`.
- `Cable Tail`: focus electric attack. Bonus against slowed targets.
- `Wall Skitter`: support evasion. Improves dodge and retreat odds.
- `Ground Zap`: support expose. Exposes jolted targets.
- `Circuit Tail Snap`: evolved focus finisher. Heavy electric damage and guaranteed slow against jolted targets.

### Runtime Data Needed

- Status hooks for `jolted` and `slowed`.
- Species entries for `copperling`, `coppervineGecko`, and later `circuitailGekko`.
- Electric debuff moves.
- Portrait assets for active stages.
- Encounter placement in Coppervine Runoff.
- Battle trait candidate: `Sticky Toes`, first jolt also lowers target speed.

## Mournroot Heron

- Common name: `Mournroot Heron`
- Registry name: `Umbra Ardea`
- Element: `shadow`, with light-calm contrast.
- Biome fit: Gloamrail Cut, Moonfen Marsh, future Mournroot Sanctum.
- Start level: 12-15 as a rare memorial-route creature.
- Availability: rare wild encounter near quiet water or shrine roots.
- Battle role: fear/calm hybrid and anti-bolt support.
- Disposition: wary.
- Stat shape: high focus, medium speed, medium HP, low attack.
- Tactical identity: applies fear gently, then turns fear into calm capture pressure instead of pure damage.

### Evolution Line

1. `Mourning Chick`
   - Registry: `Umbra Ardea`
   - Element: shadow
   - Start level: 6-8
   - Role: tall juvenile heron with dim lantern organs.
   - Visual: thin legs, dark blue feathers, pale mask, serious eyes.

2. `Mournroot Heron`
   - Required level: 15
   - Requirement: 3 shadow bond marks and one careful retreat or trust-first rescue.
   - Role: shadow calm support.
   - Unlock move: `Still Bell Call`.

3. `Memorial Ardea`
   - Required level: 32
   - Requirement: 6 shadow bond marks, memorial attunement, and one wild battle ended without knockout after fear.
   - Role: late capture-control specialist.
   - Unlock move: `Griefwater Wing`.

### Image Description

A tall heron Vivo with dark blue-black feathers, long rootlike legs, pale mourning-mask markings, and a dim lantern organ glowing in its chest. Its wings carry blue-black leaf growths and soft shadow membranes, while the beak is long, sharp, and ivory. The posture is solemn and still, like it is guarding a memorial pool. It should feel sad, elegant, and dangerous, not evil. Cozy-biotech storybook creature plate, no skull imagery, no angel symbolism, no ordinary heron with purple glow.

### Attack Ideas

- `Still Bell Call`: support status. Applies weak `feared` and lowers wild bolt pressure.
- `Griefwater Peck`: focus shadow attack. Bonus against feared targets.
- `Rootstep Guard`: support guard. Braces and improves careful retreat.
- `Quiet Wing`: support calm. Improves capture pulse odds after fear.
- `Griefwater Wing`: evolved focus finisher. Deals shadow damage and converts feared into calm pressure in wild fights.

### Runtime Data Needed

- Status hook for `feared`.
- Fear-to-calm rescue interaction.
- Species entries for `mourningChick`, `mournrootHeron`, and later `memorialArdea`.
- Portrait assets for active stages.
- Encounter placement in Gloamrail Cut or future Mournroot Sanctum.
- Battle trait candidate: `Solemn Guard`, feared wild targets are less likely to bolt.
