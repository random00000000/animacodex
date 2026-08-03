# Redglass Saltpan Walking V2 Packet

## Correction target

Replace `redglass-saltpan-painted-v1.png` non-destructively with
`redglass-saltpan-painted-v2.png`. V1 remains available for rollback, but its
visual certification is reopened at 7/10 because the distant horizon violates
the exploration-camera hard gate. Keep `redglass-saltpan-battle-v1.png` unchanged
as the approved low-camera same-place target.

## Reference roles

- `redglass-saltpan-painted-v1.png`: exact-place identity, looped route,
  landmark distribution, palette, salt materials, and sunlight reference. Do
  not copy its horizon or shallow camera.
- `redglass-saltpan-battle-v1.png`: exact-place landmark, ruin silhouette,
  lighting, and material reference only. Do not copy its low battle camera.
- `docs/environment_perspective_standard.md`: authoritative exploration camera,
  scale, ground-coverage, and rejection rules.

## Camera and composition lock

- Canvas: exactly `1536x1024`.
- Camera: one orthographic-like high three-quarter projection at a 55-degree
  downward pitch.
- Horizon: none. Sky may not occupy any part of the frame.
- Ground: at least 75% readable traversable ground plane.
- Axes: one coherent projection; arches and waystone remain vertical without
  fisheye, dutch angle, tilt-shift, or isometric rotation.
- Player scale: a player-sized figure would occupy 5–8% of canvas height.
- Runtime crop: the central `960x640` crop must preserve the route loop, redglass
  basin, caretaker post, and ruin approach.

## Route and gameplay lock

- Preserve one broad pale-sand loop around the central redglass crust basin.
- Keep the west/lower-left route visibly continuing to the image edge for the
  authored Sunspindle Dunes exit and player spawn.
- Keep the route 96–160 source pixels wide with no required walking over crystal
  clusters, ruin faces, deep blue-white seams, or vertical ledges.
- Preserve three broad encounter habitats: central redglass crust, western pink
  salt mirror, and eastern ruin salt flats.
- Keep collision masses visually legible as red crystal clusters, broken ruin
  arches, dark rock shelves, and crust pools rather than noisy scattered detail.

## Shared anchors

1. Hero landmark: central cracked red-glass mineral basin, broad and oval.
2. Structural landmark: half-swallowed sandstone ruin arches in the upper-right.
3. Habitat landmark: pink salt polygons crossed by blue-white mirage seams.
4. Navigation landmark: pale-sand loop with a lower-left screen-edge exit.
5. Light landmark: caretaker shade canopy and dark sanctuary waystone with a
   warm hanging lantern near the lower-left route.

Secondary invariants: red crystal clusters around the basin and ruins, dry gold
grass at the darker rock margins, clear peach daylight, and right-side sun
direction matching the approved battle view.

## Imagegen generation prompt

```text
Use case: stylized-concept
Asset type: production exploration background for a premium 2D creature RPG
Primary request: regenerate Redglass Saltpan as a true top-down playable walking
scene while preserving the exact location identity and route topology of the
references.
Input images: Image 1 is the exact-place V1 exploration reference for palette,
materials, looped route, and landmark layout but NOT camera; Image 2 is the
approved low battle reference for same-place landmarks and lighting but NOT
framing or perspective.
Scene/backdrop: a surreal dried salt lake with a broad central cracked red-glass
mineral basin, pink salt polygons, blue-white mirage seams, red crystal growths,
half-swallowed sandstone ruin arches, and sparse dry gold grass.
Style/medium: premium cozy-biotech storybook painted 2D game art, controlled
brushwork, warm emotionally rich illustration, readable board-game staging.
Camera lock: high three-quarter orthographic-like playable board, 55-degree
downward pitch, absolutely no visible horizon and no sky, one coherent axis
system, vertical structures remain vertical, natural scale, no fisheye, no dutch
angle, no low cinematic view. At least 75 percent of the frame is readable ground.
Composition/framing: preserve a broad pale-sand loop around the central redglass
basin; the lower-left branch visibly reaches the screen edge; keep the
half-swallowed ruin arches upper-right; keep a caretaker shade canopy, dark
sanctuary waystone, and warm hanging lantern beside the lower-left route; keep
red crystal clusters distributed around the basin and ruins. Compose for a
centered 960x640 gameplay crop within a 1536x1024 source.
Lighting/mood: clear peach daylight from the right, warm sun-struck saltpan,
soft readable shadows, beautiful but mildly uncanny heat shimmer.
Color palette: coral red glass, blush-pink salt, pale sand, blue-white mineral
seams, warm sandstone, restrained dry gold grass.
Constraints: one continuous 96–160 pixel-wide walkable sand route; three broad
readable habitat patches; exact 1536x1024 output; no people or creatures.
Avoid: horizon, sky, distant landscape vista, shallow oblique camera, battle
camera, isometric axes, aerial satellite map, fisheye, dutch angle, miniature
tilt-shift, blocked routes, dense noisy crystals, invented buildings, arena
markings, text, labels, UI, logo, watermark, pixel art, photorealism, generic
mobile-game gloss, or comparison sheet.
```

## Rejection gates

Reject immediately if any of these are true:

- Any horizon, sky band, or distant landscape vista is visible.
- Less than 70% of the frame reads as ground plane.
- The lower-left exit or continuous sand loop is missing or blocked.
- The caretaker canopy/waystone or upper-right ruin arches are absent.
- The central basin is replaced by an invented arena circle or podium.
- Local structures use conflicting projections or melted geometry.
- Lighting no longer matches the approved warm daylight battle view.

## Promotion gate

V2 must pass every hard gate and score at least 9/10. After selection, resize or
crop only if necessary to exact `1536x1024`, integrate under a new V2 asset key,
rebind Redglass runtime geometry to the painted route, capture walking and battle
screenshots at the same viewport, update the hash manifest, and return the pair
validator to 32/32 before promoting V2.
