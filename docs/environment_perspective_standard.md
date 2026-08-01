# Environment Perspective Standard

This is the production camera template for every generated exploration/battle
pair in `Anima Codex`. It supplements `scene_art_requirements.md`; when a scene
prompt says only "top-down" or "lower cinematic," this document supplies the
measurable camera and staging constraints.

## Pair Contract

One location has two deliberately different cameras:

| View | Camera band | Ground visibility | Required staging |
| --- | --- | --- | --- |
| Exploration | high three-quarter orthographic-like board, 50–60° downward pitch | at least 70% of the frame | one continuous walkable route, readable collision masses, screen-edge transitions |
| Battle | ground-adjacent storybook stage, 10–18° downward pitch, 45–55 mm equivalent rectilinear lens | 45–60% of the frame | empty player lane in lower-left, empty enemy lane in upper-right midground, open effect corridor between them |

The exploration view must not show a horizon. The battle view must show clear
depth compression toward a horizon or vanishing area in the upper third. Both
views keep vertical architecture vertical: no dutch angle, fisheye, miniature
tilt-shift, or rotating isometric axes.

## Exploration Template

- Canvas: `1536x1024` (3:2), composed to survive a centered `960x640` runtime crop.
- Pitch: 50–60° downward; yaw may change to support the route, but must stay
  consistent within the whole painting.
- Scale: a player-sized figure would occupy roughly 5–8% of canvas height.
- Route: reserve a continuous 96–160 px source-width lane; never require walking
  across visually vertical faces, water, dense vegetation, or roof planes.
- Occlusion: foreground collision masses may overlap the bottom 8% of the frame;
  they must not hide the main route or exits.
- Exits: every authored exit needs an image-visible continuation to an edge,
  doorway, bridge, stair, gate, or cave mouth.
- Encounter habitat: use broad, visually distinct patches rather than scattered
  decoration that cannot support a stable runtime rectangle.

Prompt camera block:

```text
Camera lock: high three-quarter orthographic-like playable board, 55-degree
downward pitch, no visible horizon, one coherent axis system, vertical structures
remain vertical, natural scale, no fisheye, no dutch angle, no low cinematic view.
At least 70 percent of the frame is readable ground plane. Preserve one continuous
walkable route and visible screen-edge transitions.
```

## Battle Template

- Canvas: `1536x1024` (3:2), composed for a centered `960x640` runtime crop.
- Camera height: approximately 1.2–1.6 m in world terms.
- Pitch: 10–18° downward; horizon or vanishing area in the upper 25–35%.
- Lens: stable rectilinear 45–55 mm equivalent; foreground objects must read
  larger than matching midground objects without exaggerated wide-angle stretch.
- Player staging zone: lower-left, centered near 28% canvas width / 68% height.
- Enemy staging zone: upper-right midground, centered near 70% width / 44% height.
- Effect corridor: keep the diagonal between those centers open and lower contrast.
- HUD safety: keep critical landmarks out of the bottom 18% and top 12%.
- Do not paint circles, rings, podiums, or arena markings unless the exploration
  location already contains them.

Prompt camera block:

```text
Camera lock: ground-adjacent cinematic battle view, camera 1.2 to 1.6 meters high,
10 to 18-degree downward pitch, visible vanishing area in the upper third, stable
rectilinear 45 to 55 mm lens. This must look substantially lower and closer than
the exploration board. Reserve an empty player lane at lower-left and a distinct
empty enemy lane at upper-right midground with an open diagonal effects corridor.
Reject top-down, high three-quarter, isometric, aerial, map-board, fisheye, dutch,
or ultra-wide compositions.
```

## Same-Place Lock

Define five anchors before generating either view:

1. Hero landmark — the unique silhouette that names the place.
2. Structural landmark — bridge, shelf, ruin, building, or cave formation.
3. Habitat landmark — reeds, grass, pool, ash bed, root field, or similar.
4. Navigation landmark — exit, stair, gate, path fork, or crossing.
5. Light landmark — lantern, vent, reflective pool, glow organ, or window.

At least three anchors must appear unmistakably in both images. The hero landmark
must keep the same material, color, major proportions, and adjacent feature. A
battle image that shares only palette and biome is a generic arena and fails.

## Perspective QA Gate

Score each candidate before integration. Every hard gate must pass.

### Hard gates

- Exact `1536x1024` dimensions unless a documented exception exists.
- One coherent projection with no locally conflicting vanishing directions.
- Exploration has no horizon and at least 70% readable ground.
- Battle has a low camera, visible depth toward the upper third, and two empty lanes.
- At least three shared anchors, including the hero landmark.
- No people, creatures, text, UI, logo, watermark, or invented arena markings.

### Review score (10 points)

- 2: camera matches its numerical band.
- 2: navigation or battle staging remains readable at `960x640`.
- 2: shared anchors prove same-place continuity.
- 2: palette, brushwork, lighting, and material language match the pair.
- 2: geometry is plausible, with no melted stairs, impossible walls, or mixed axes.

Require 9/10 for production. A failed camera hard gate cannot be offset by a high
style score. Keep failed drafts only as review evidence; never register them in
runtime assets.

## Generation Sequence

1. Write the scene packet and five anchors.
2. Generate exploration first with the exploration camera block.
3. Verify its walkable board before using it as a reference.
4. Generate battle with the exploration image as the location reference and an
   approved battle backdrop as framing-only reference.
5. State each reference role explicitly; never let a battle reference override
   the new location's landmarks.
6. Run the hard gates and score at runtime crop size.
7. Save non-destructively as `-v2` or later until runtime integration is verified.

## First Audit Finding: Ember Hollow

The current exploration painting is a strong high-three-quarter board. Its legacy
battle backdrop uses a valid low camera but is `1693x929` and loses the pale vent
shrine, warm-leaved tree, and olive moss/cinder-reed contrast. Two July 31, 2026
correction drafts preserved the location anchors but remained high three-quarter;
they were rejected under the battle-camera hard gate. The next Ember Hollow pass
must use the battle template above and may not be promoted until the camera reads
lower than the exploration view at a glance.
