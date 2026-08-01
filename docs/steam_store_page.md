# Anima Codex — Steam Store Page Draft

Status: internal review draft. This prepares store data only; it does not authorize
publication or promise content absent from the release candidate.

## Store identity

- **Name:** Anima Codex
- **Developer / publisher:** TBD
- **Release date display:** Coming soon
- **Primary genre:** Creature-collecting RPG
- **Perspective:** 2D top-down, scene-based exploration
- **Mode / platform:** Single-player; Windows 10/11 64-bit
- **Language:** English interface and on-screen text
- **Controller support:** Do not claim until controller acceptance passes
- **Verified settings:** Battle audio on/off, reduced motion, and larger text
- **Verified windowed layouts:** 1280×720, 1366×768, and 1600×900
- **Release model:** Do not select Early Access or announce a date until scope and
  schedule are approved

## Short description

Rescue engineered creatures called Vivos, explore a hand-painted storybook world, and
build a bonded team for tactical turn-based battles against the forces confiscating
them.

## About This Game

The government has decided that Vivos are too dangerous to remain free.

In **Anima Codex**, you begin with Dogemox, a young engineered lifeform whose future
depends on the places it survives and the bond you build together. Travel through a
connected world of authored paintings, find Vivos in their natural habitats, and
protect them from becoming tools of the people hunting them.

### Raise a team shaped by its journey

Vivos are more than animals with an element attached. Their biology, attacks, and
forms reflect their habitat and training history. Exposure to fire, light, steel,
water, and other forces can open new transformations.

### Fight with intent

Battle one-on-one with a party of up to six Vivos. Speed, elemental matchups, impact
and focus attacks, guards, setup moves, switching, and battlefield conditions all
matter. Read an opponent's plan, create an opening, and choose when to press an
advantage or protect a partner.

### Rescue instead of simply collecting

Calm frightened Vivos, judge when trust is possible, and bring rescued companions
into your active team or sanctuary reserve. Every rescue preserves a memory of where
and how that bond began.

### Explore a painted world

Walk through scene-sized illustrations connected by trails, caves, marshes, gardens,
town gates, and hidden habitat routes. Each place pairs its encounter ecology with a
matching illustrated battle arena, creating a consistent storybook world without a
moving 3D camera.

### Stand between Vivos and confiscation

Train for tactical trials, challenge specialist trainers, and overcome Briar Town's
first gym to prove that power guided by trust does not belong to the state. Your
roster, rescues, transformations, and victories shape the argument for Vivo freedom.

## Feature bullets

- Explore connected, hand-painted top-down scenes and elemental habitats.
- Rescue and raise engineered lifeforms with serious, dangerous potential.
- Build an active party of six and keep additional rescued Vivos in reserve.
- Fight tactical 1v1 battles with switching, support moves, and type matchups.
- Learn attacks through leveling and make explicit four-move loadout choices.
- Transform Vivos through environmental exposure, battle history, and bond milestones.
- Challenge authored trainers and Briar Town's first gym through readable tactical lessons.
- Continue across three local save slots with automatic route-progress saving.

## Suggested Steam tags

Validate order against comparable live store pages before publication:

1. Creature Collector
2. RPG
3. Turn-Based Combat
4. Exploration
5. Story Rich
6. Singleplayer
7. 2D
8. Hand-drawn
9. Atmospheric
10. Cute
11. Adventure
12. Strategy
13. Fantasy
14. Nature
15. Emotional

Avoid `Pokémon-like` in public metadata. Describe Anima Codex on its own terms.

## Five-screenshot shot list

Final images must be native 16:9 captures from a release-candidate Windows build,
without debug UI, browser chrome, or temporary copy. Keep the stable top-down view;
avoid tilted cameras, lens distortion, motion blur, and simulated handheld framing.

1. **World promise — Sanctuary Trail:** Dogemox and player on a readable painted path
   with habitat depth and a clear landmark.
2. **Battle clarity — elemental matchup:** two distinctive Vivos in a scene-matched
   arena with HP plates and the Fight/Team/Bag/Run surface visible.
3. **Rescue identity — trust-first encounter:** a wavering wild Vivo with Calm Signal
   or Rescue Pulse available.
4. **Transformation payoff:** Ignis Canis or Astra Corvus in a biome that explains the
   awakened form.
5. **Gym stakes — Briar Gym:** leader battle with battlefield condition, party pips,
   and tactical forecast, avoiding spoiler-heavy dialogue.

Capture two alternates per slot. Approve the five as a set: varied places and Vivos,
consistent UI scale, no repeated composition, clipping, or obscured gameplay verb.

## Capsule and library art brief

Use purpose-built key art, not a cropped gameplay screenshot.

- Dogemox in a guarded three-quarter stance beside the handler, two evolved
  silhouettes behind them, and a distant confiscation patrol.
- Sanctuary foliage transitions into engineered glass or containment geometry.
- Cozy biotech storybook with protective urgency; bondable, not plush-toy cheerful.
- One strong focal triangle, broad value groups, clean title space, and silhouettes
  readable at small capsule sizes.
- Stable storybook staging; no fisheye, dutch angles, speed blur, or extreme lenses.
- Produce all current Steam capsule and library formats after confirming Valve's
  dimensions at production time.

## Preliminary system requirements

Placeholders for benchmarking, not publication-ready claims:

| | Minimum | Recommended |
|---|---|---|
| OS | Windows 10 64-bit | Windows 11 64-bit |
| Processor | Dual-core 2.5 GHz | Quad-core 3.0 GHz |
| Memory | 4 GB RAM | 8 GB RAM |
| Graphics | DirectX 11 compatible integrated | DirectX 11 compatible dedicated or modern integrated |
| Storage | 2 GB available | 2 GB available |

Measure clean-machine performance, final depot size, and hardware coverage before
publishing these values.

Local reference evidence now exists in `release/qa/windows-local-benchmark.json`: the promoted portable candidate reached a verified first frame in a 16.752-second median across three isolated-profile launches on the available Windows 10 / Core i7-10750H / approximately 8 GB RAM host. This includes portable self-extraction and does not authorize minimum or recommended claims.

## Pre-publication decisions and evidence

- Confirm developer and publisher names.
- Reconcile store promises with final campaign scope; trim gym/ending language if the
  candidate stops at the first gym.
- Approve release-date strategy and Early Access decision.
- Complete controller, accessibility, audio, resolution, and clean-profile checks.
- Capture and approve five final screenshots from the packaged candidate.
- Produce and approve capsule/library artwork and logo.
- Benchmark minimum/recommended hardware and final depot size.
- Complete Steam content survey, ratings, legal, privacy, and AI-disclosure review
  using final shipped content and Valve's then-current forms.

## Structured Steamworks handoff

- Machine-readable data: [`release/steam-store-data.json`](../release/steam-store-data.json)
- Validation command: `npm run validate:store`
- Full local candidate check: `npm run release:check`
- The structured package deliberately keeps publication authorization false and leaves developer/publisher, release model, controller support, hardware benchmarks, capsule approval, final scope, and compliance review unresolved.
- Validation follows current Steamworks guidance: short copy is plain, concise, and free of time-sensitive claims or links; the ordered tag list contains 15 entries with the first five carrying the clearest identity; all five approved images are actual game screenshots and are hash-bound to the current executable.

## Capsule Artwork Status — 2026-07-30

A textless key-art master has been selected: `src/assets/marketing/anima-codex-steam-key-art-master-v2.png`. Its provenance and review constraints are recorded in `src/assets/marketing/anima-codex-steam-key-art-manifest-v1.json`. The composition provides clean title space, a readable juvenile Dogemox and handler bond, evolved-form promise, and visible confiscation pressure without unstable camera cues.

This closes the source-composition gap only. Exact Steam-format crops, controlled logo placement, thumbnail-scale checks, and final approval are still required before any store submission.

An additional internal-review comparison now exists at `src/assets/marketing/anima-codex-steam-key-art-dogemox-juvenile-v3.png`. It gives Dogemox a clearer young-starter silhouette without changing the established framing. The validated V2 derivative set remains the release candidate until V2/V3 brand comparison and crop checks authorize a promotion.

## Steam Artwork Derivative Set — 2026-07-30

Exact-size local review candidates now exist under `src/assets/marketing/steam/` for the header, small, main, and vertical store capsules plus the library capsule, header, hero, and transparent logo. The source and SHA-256 inventory are recorded in `src/assets/marketing/steam/steam-artwork-manifest-v1.json`.

The set follows the current Steamworks rules checked on 2026-07-30: capsules use game artwork and the game title only; the library hero is textless; and the separate library logo contains only the title on transparency. A contact-sheet review caught and corrected logo-edge clipping and portrait crops that hid too much of Dogemox. These remain local review candidates pending final brand approval and upload authorization.

## Unified Candidate Audit — 2026-07-30

Run `npm run validate:release` to verify that the promoted executable, five approved screenshots, structured Steam copy, and eight store/library artwork assets still form one intact internal-review candidate. The current report is written to `release/qa/release-candidate-report.json`. It deliberately requires publication authorization to remain false and hardware requirements to remain provisional until the outstanding decisions and benchmarks are completed.

## Campaign Scope Audit — 2026-07-30

The current candidate implements one authored gym leader, Senka, and ends its release arc after the first gym and patrol resolution. Public copy now says “first gym” and no longer implies multiple shipped gyms or a league. `npm run validate:store` writes `release/qa/campaign-scope-report.json` and rejects copy that exceeds this implemented scope.

Owner review subsequently found that the main capsule still clipped the final `X` and the standalone library logo clipped its outer letters. All seven title-bearing derivatives were rebuilt with explicit margins at their native Steam dimensions; the textless hero was unchanged. The rejected files and their prior manifest are preserved under `src/assets/marketing/steam/archive/title-clipped-v1/`.
