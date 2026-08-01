# Release Readiness

## Windows packaging

The game ships as an x64 portable Windows executable hosted by Electron.

- Build command: `npm run package:windows`
- Output: `release/Anima-Codex-<version>-Windows-x64.exe`
- Version source: the `version` field in `package.json`
- Runtime content: the validated Vite production build under `dist/`
- OneDrive-safe staging: packaging uses a temporary local directory and copies the
  completed portable executable into `release/`

Before creating a candidate, update the package version, run the full build, package
Windows, and smoke-test the generated executable on a clean Windows user profile.
The portable target is suitable for internal candidates; Steam depot packaging can
consume the unpacked application or a later installer target once the Steamworks
application identity is available.

## Release outcome tracker

- [x] Reproducible Windows executable packaging path
- [x] Local packaged-executable launch smoke test
- [x] Custom Windows application icon embedded and shell-verified
- [x] Reproducible isolated-profile Windows verification command
- [ ] Clean-machine Windows executable verification
- [x] Five rendered 16:9 Steam screenshot candidates
- [x] Five Steam screenshots approved after presentation cleanup
- [x] Internal Steam store copy, capsule plan, feature list, and metadata draft
- [ ] Steam store data approved against final scope and entered in Steamworks
- [ ] Release-candidate balance pass
- [ ] Complete first-to-final progression QA
- [ ] Steamworks depot and launch-option configuration

## Latest verification

2026-07-29:

- `npm run build` passed content validation, TypeScript compilation, and Vite production bundling.
- Portable artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`
- Size: `374,951,800` bytes
- SHA-256: `714AB0A7EDC2612E069C469F49058587E38B4D70FF0B7ACDA45D73EEEA611B62`
- Launch smoke: process remained healthy for 15 seconds and was deliberately terminated by the test.
- Known packaging debt: custom Windows icon and code-signing identity are not configured.
- Dependency audit originally reported 20 findings (1 low, 19 high).

2026-07-30 dependency and packaging verification:

- Upgraded the shipped desktop runtime from Electron 37 to Electron 43.2.0 and
  updated electron-builder/Vite to their maintained releases.
- `npm audit --omit=dev` reports zero vulnerabilities in the shipped dependency
  surface. The full development audit reports 16 high findings, all inherited
  through electron-builder's packaging-only dependency graph; npm's suggested
  forced fix is an obsolete electron-builder major downgrade and is not accepted.
- Portable packaging now uses store-mode compression. This avoids the recurring
  multi-minute 7-Zip stall on the image-heavy payload and completed the full
  build/package path in 47 seconds on the release workstation.
- Refreshed portable artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`
- Size: `827,563,395` bytes
- SHA-256: `9B9AAC924A2991EE90C5DF9EB9B038C5B63E391C03E48C1E530292DC18D793A0`
- Launch smoke: the Electron 43 portable process remained healthy for 15 seconds
  and its test process tree was deliberately terminated afterward.
- At that point, packaging debt still included a custom Windows icon, code-signing
  identity, clean-profile verification, and upstream packaging-tool audit findings.

2026-07-30 Windows icon verification:

- Generated a production icon source at
  [`build/anima-codex-icon-source-v1.png`](../build/anima-codex-icon-source-v1.png)
  from the approved Dogemox identity and cozy-biotech storybook direction.
- Wired [`build/icon.png`](../build/icon.png) into electron-builder's Windows target.
- `npm run package:windows` passed the full content validation, TypeScript, Vite,
  and portable packaging path in 54 seconds.
- Refreshed portable artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`
- Size: `827,963,267` bytes
- SHA-256: `1174E594CFDBDF94AADC99638287680CDC45F462881A83DD390FB3D1928A7FC6`
- Extracted the associated icon from the packaged executable and visually verified
  that Dogemox's head remains recognizable at the native 32x32 shell size.
- Launch smoke: six portable/runtime processes remained responsive for 15 seconds
  and were deliberately terminated afterward.
- Remaining packaging debt: code-signing identity, clean-profile verification, and
  upstream development-only packaging-tool audit findings.

## 2026-07-30 managed-session clean-profile attempt

- The portable artifact still has a passing native launch smoke, but this managed
  automation session could not certify the untouched first-boot screen.
- Workspace shell startup was denied before execution by
  `codex-windows-sandbox-setup.exe`; the fallback Node child could inspect the
  workspace but Vite/esbuild was denied while resolving parent directories.
- Direct Electron capture from the approved unpacked candidate failed before first
  paint because the managed session terminated the GPU subprocess with Windows exit
  code `-1073741515`. `--disable-gpu` and `--disable-gpu-compositing` reached the
  same process boundary.
- No screenshot was accepted, no clean-machine checkbox was marked complete, and no
  product rendering defect is inferred from this host restriction.
- Evidence: [`release/qa/clean-profile-blocker-2026-07-30.json`](../release/qa/clean-profile-blocker-2026-07-30.json).
- Next verification: launch a freshly packaged candidate from an unrestricted clean
  Windows user profile, capture the save-slot front door, start slot 1, confirm input,
  then relaunch and verify the slot persists.

## 2026-07-30 offline packaging and clean-profile attempt

- Made Windows packaging deterministic without network access by directing
  electron-builder to the installed Electron 43.2.0 distribution under
  `node_modules/electron/dist` and the existing local builder caches.
- The refreshed portable package completed successfully and produced
  `release/Anima-Codex-0.1.0-Windows-x64.exe` at `831,121,924`
  bytes with SHA-256 `9006CBC224F4D18AFD048879AEC19F777BFC5A8FCAC5CA0E99D0607B7C328387`.
- Clean-profile visual certification remains open. This managed session terminated
  Electron's GPU subprocess before first paint with Windows status `0xC0000135`;
  software-rendering flags reached the same host restriction.
- No screenshot was accepted and no product rendering defect is inferred from the
  managed-session failure. Evidence is recorded in
  [`release/qa/clean-profile-blocker-2026-07-30.json`](../release/qa/clean-profile-blocker-2026-07-30.json).
- Next verification: use an unrestricted clean Windows user profile, capture the
  save-slot front door, start slot 1, confirm input, then relaunch and verify the
  slot persists.

2026-07-30 clean-profile QA harness:

- Added `npm run verify:windows:clean` to launch a Windows build against a newly
  created empty user-data directory, capture the real first-boot save-slot front
  door, validate its PNG dimensions, count initialized profile files, write a JSON
  report, and clean up the temporary profile.
- The desktop host accepts isolated user-data and capture settings through both
  environment variables and direct arguments, while preserving the existing Steam
  screenshot workflow.
- Windows packaging now points electron-builder at the installed Electron 43.2.0
  distribution and local builder caches, allowing release builds without a network
  download.
- Content validation, TypeScript, and the Vite production build passed. Vite used its
  runner config loader because this managed pulse denied esbuild's parent-directory
  scan. The offline Windows package also completed successfully.
- Refreshed local artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`
- Size: `831,121,924` bytes
- SHA-256: `9006CBC224F4D18AFD048879AEC19F777BFC5A8FCAC5CA0E99D0607B7C328387`
- This rebuild is not promoted as a release candidate yet. The managed sandbox could
  not start Electron's GPU subprocess (Windows status `0xC0000135`) and the normal
  workspace shell remained unavailable because `codex-windows-sandbox-setup.exe`
  was denied. No first-boot screenshot was produced.
- Keep clean-machine verification unchecked until `npm run verify:windows:clean`
  passes in a normal Windows session and its captured front door is visually reviewed.

## Store-page preparation

The internal review draft lives in [`docs/steam_store_page.md`](steam_store_page.md).
It includes feature copy, preliminary metadata, a five-shot screenshot plan, capsule
direction, provisional requirements, and the evidence and decisions still required
before publication.

## Steam screenshot capture

Run `npm run capture:steam` after `npm run package:windows`. The command boots the
packaged Windows executable five times in a hidden 1920x1080 capture viewport and
writes deterministic, debug-chrome-free PNGs to `release/steam-screenshots/`.
The five presets cover Sanctuary Trail, an elemental matchup, a rescue encounter,
Ignis Canis in its fire habitat, and the Briar Gym. Captures are candidates until a
human approves composition, spoilers, and store-page suitability.

2026-07-30 capture verification:

- All five presets completed from a freshly built unpacked Windows application.
- Each PNG is native 16:9 (1831x1030 under the current Windows DPI frame) and
  contains its intended painted scene or battle backdrop.
- Hidden WebGL windows were unreliable, so release capture now renders an off-screen
  visible window with background throttling disabled and an isolated temporary
  profile. Each child capture also has a 30-second timeout to prevent stale,
  orphaned runs.
- Visual review initially found scrollbars and lower-edge text clipping in the
  command panel.

2026-07-30 presentation-cleanup verification:

- The battle HUD now overrides the base drawer width cap, spans the native viewport,
  reserves a 206px command tray, and keeps its two command rows inside the frame.
- A fresh unpacked Windows build recaptured all five presets successfully.
- Visual review confirms that shots 02-05 no longer contain command scrollbars or
  clipped lower-edge text and are clean release candidates.
- Shot 01 still exposes translucent traversal-authoring regions and placeholder-like
  field tokens. Replace or presentation-clean that exploration shot before approving
  the complete five-image store set.

2026-07-30 exploration-capture cleanup:

- Release capture now suppresses collision, encounter-zone, exit, interactable, and
  trainer authoring shapes while preserving the painted scene, player, and companion.
- Normal gameplay and the scene-geometry editor retain their existing render paths.
- A fresh unpacked Windows build produced all five shots successfully. Visual review
  approved the set: no authoring geometry, placeholder field tokens, command-panel
  overflow, clipped copy, or debug-only battle wording remains.
- Formed Vivos now use their form name consistently on battle plaques and capture
  prompts; the Ignis Canis shot identifies the transformation instead of Dogemox.

## 2026-07-30 isolated-profile QA harness

- Added `npm run verify:windows:clean` to launch a Windows candidate with an
  explicit empty user-data directory, capture the untouched save-slot front door,
  validate the PNG dimensions and runtime profile creation, write
  `release/qa/clean-profile-report.json`, and clean up the temporary profile.
- The Electron host accepts explicit user-data, capture-output, and capture-query
  command-line arguments while preserving the existing environment-driven Steam
  capture path.
- Content validation, TypeScript, and the Vite production build passed using Vite's
  runner config loader, which avoids the managed session's blocked parent-directory
  scan.
- The managed Persona sandbox prevented a refreshed electron-builder package and
  caused the approved candidate's GPU subprocess to exit with Windows code
  `0xC0000135` before capture. No screenshot or passing report is claimed.
- Clean-machine Windows verification remains open. Rerun the normal package command
  and then `npm run verify:windows:clean` from an unrestricted Windows session.

## 2026-07-30 current-content Windows package

- Rebuilt the portable Windows artifact after the progression-integrity gate and
  latest Carillon Pagurus content landed, so the executable now matches the current
  production source and asset set.
- Authored-content validation, all 32 scene checks, TypeScript compilation, Vite
  production bundling, Electron packaging, and portable executable creation passed.
- Current artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`
- Size: `832,671,638` bytes
- SHA-256: `8B4459305E7E45E3CBE6208040535F4C09FA49E659A7C7BEC4DA469E50556B45`
- Clean-profile first-boot certification remains open; the new artifact is built and
  hashed but should not be promoted until `npm run verify:windows:clean` passes in a
  normal Windows session.

## 2026-07-30 clean-profile promotion

- Rebuilt the portable artifact after the latest Weirfang Lutra content, then ran it
  from an empty temporary Windows profile.
- The executable initialized 40 runtime profile files and captured the untouched
  1831x1030 save-slot front door. Visual review confirmed readable controls, correct
  empty-slot and disabled-button states, no overflow, and no debug chrome.
- Hardened the verifier after visual review caught one transient all-black capture:
  PNG luminance diversity and non-dark coverage are now mandatory, so dimensions and
  file validity alone cannot produce a false pass.
- Promoted artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`
- Size: `832,671,749` bytes
- SHA-256: `11A3E7363BC11FE6F6189B5E73B4CABCDF2512BA3D2AF9E9322C63F7406CF0AB`
- Machine-readable evidence: `release/qa/clean-profile-report.json` and
  `release/windows-portable-manifest.json`.

## 2026-07-30 packaged persistence verification

- Added `npm run verify:windows:persistence`, which owns an empty temporary Windows
  profile across two packaged-app launches.
- Launch one uses the real game-state save API to start slot 1, move to Moonfen Marsh,
  and save. The executable exits completely.
- Launch two reuses the same isolated profile without fixture creation and captures
  the restored Field Log.
- Visual review confirmed slot 1 restored as Moonfen Marsh with one active Vivo,
  zero reserve, zero badges, and enabled Continue, Load, Save, and Delete actions.
- Current promoted artifact: 832,674,323 bytes, SHA-256
  `1470F8CDD7382E0FC7A2BBEB95F5FAFFCC9246C69D7C55043D48C925C0BDFAC4`.
- Machine-readable evidence: `release/qa/persistence-profile-report.json`.

## 2026-07-30 current-source candidate refresh

- Rebuilt after the Maris/Weirfang pacing changes so the executable, persistence
  report, and Steam screenshots all refer to the same source state.
- Current promoted artifact: 832,674,543 bytes, SHA-256
  `BC93E7F21F07F17A4CC69CFC4599B6290BA7601352E25D0946C3F81E3476579D`.
- Packaged save/relaunch verification passed again from an empty profile.
- Recaptured and visually reviewed all five Steam candidates. The set has stable
  perspective, five distinct player-facing promises, no debug geometry or browser
  chrome, complete command trays, and no clipped copy.
- `release/steam-screenshots/manifest.json` binds each approved PNG by filename,
  dimensions, byte size, and SHA-256 to this exact executable hash.

## 2026-07-30 Windows release manifest

- Windows packaging now writes `release/windows-portable-manifest.json` after the executable copy succeeds.
- The manifest records version, platform, architecture, packaging type, filename, byte size, SHA-256, UTC build time, promotion state, and the remaining promotion command.
- The verified current artifact is 832,671,749 bytes with SHA-256 `11A3E7363BC11FE6F6189B5E73B4CABCDF2512BA3D2AF9E9322C63F7406CF0AB`.
- New packages are deliberately marked unpromoted until isolated-profile first-boot verification passes.

## 2026-07-30 structured Steamworks handoff

- Added `release/steam-store-data.json` as the machine-readable handoff for approved copy, features, ordered tags, provisional requirements, languages, modes, and screenshot evidence.
- Added `npm run validate:store`, which blocks overlong or multiline short copy, encoding corruption, links, insufficient or duplicate tags, unresolved claims being silently promoted, stale screenshot hashes, missing images, and non-16:9 captures.
- Validation passed with a 175-character short description, 1,723-character About section, 15 tags, eight feature bullets, and five approved screenshots tied to the promoted Windows hash.
- Added `npm run release:check` to combine the production build, store-data validation, and packaged persistence verification.
- Publication remains unauthorized; developer/publisher identity, release model, final campaign scope, controller support, benchmarks, capsule approval, and compliance forms still require decisions or evidence.

## 2026-07-30 — Steam Key-Art Master

- Selected `src/assets/marketing/anima-codex-steam-key-art-master-v2.png` as the textless source for capsule and library artwork.
- Rejected the first generated pass because Dogemox looked too mature; the corrected pass restores juvenile, broad-pawed starter proportions while retaining a serious engineered-lifeform identity.
- Verified a stable, cohesive storybook perspective with no motion effects and reserved upper-left logo space.
- Recorded source dimensions, SHA-256, review notes, and derivative constraints in `src/assets/marketing/anima-codex-steam-key-art-manifest-v1.json`.
- Remaining: produce exact Steam-format derivatives, apply the approved logo system, test thumbnail readability, and obtain approval before submission.

## 2026-07-30 — Exact Steam Artwork Candidates

- Produced exact current-format candidates for four store capsules and four library assets from the selected key-art master.
- Kept capsule copy to the game title only and the library hero fully textless.
- Corrected title safe margins and portrait subject crops after visual contact-sheet review.
- Verified every PNG's dimensions and recorded byte counts and SHA-256 values in `src/assets/marketing/steam/steam-artwork-manifest-v1.json`.
- Remaining: owner brand approval, optional bespoke lettering refinement, and authorized upload in Steamworks.

## 2026-07-30 — Unified Release Candidate Gate

- Added `npm run validate:release` to audit the promoted Windows executable, packaged persistence evidence, artifact-bound five-shot set, structured store handoff, and eight exact-format Steam artwork assets as one candidate.
- The validator independently re-hashes every executable, screenshot, and artwork file and verifies dimensions, promotion state, manifest bindings, library-hero text policy, logo transparency intent, and provisional hardware claims.
- Current result: 23/23 checks passed with status `ready-for-internal-review`.
- Machine-readable evidence: `release/qa/release-candidate-report.json`.
- `npm run release:check` now ends with this unified gate after build, store validation, and packaged persistence verification. Publication and hardware claims remain deliberately unapproved.

## 2026-07-30 — Current-Source Windows Promotion

- Detected that the previously promoted executable predated the latest creature and encounter content, so it was not allowed to remain the release candidate merely because its hashes were internally consistent.
- Rebuilt from current source with content validation, all 32 scene checks, TypeScript compilation, Vite production bundling, Electron packaging, and portable Windows creation passing.
- Restored the runner-based Vite config loader required by the managed Windows session.
- New promoted artifact: `release/Anima-Codex-0.1.0-Windows-x64.exe`, 835,714,843 bytes, SHA-256 `ACB65C861B752D36179E3B5CC1B0A36EF2E280EBDB814BD21C260592CC535786`.
- Clean-profile first boot passed at 1831x1030 with 40 runtime profile files. Two-launch save persistence passed with slot 1 restored from Moonfen Marsh.
- Rejected the first refreshed Steam capture because managed-session GPU disabling produced black battle canvases. Recaptured with GPU rendering enabled, visually approved all five shots, and hash-bound them to the new executable.
- Structured store validation and the unified release gate both pass; the latter reports 23/23 checks.

## 2026-07-30 — Steam Title Safe-Area Correction

- Re-audited all title-bearing assets at native Steam dimensions after owner feedback identified incomplete letters.
- Confirmed the main capsule clipped the final `X` and the transparent library logo clipped both outer glyphs.
- Rebuilt the header, small, main, vertical, library capsule, library header, and library logo with explicit title margins while preserving the approved key-art direction.
- Archived the rejected files under `src/assets/marketing/steam/archive/title-clipped-v1/` and updated every corrected byte count and SHA-256 in the active artwork manifest.
- The textless library hero was not changed. Upload remains unauthorized pending final brand approval.

## 2026-07-30 — Local Windows Startup Benchmark

- Added `npm run benchmark:windows` to launch the promoted portable executable three times against fresh isolated profiles and measure time to a verified first rendered frame.
- On the available Windows 10 reference host (Intel Core i7-10750H, 12 logical CPUs, approximately 8 GB RAM), first-render samples were 16.314 s, 16.752 s, and 21.626 s; median 16.752 s.
- Portable self-extraction is included. The evidence is bound to executable SHA-256 `ACB65C861B752D36179E3B5CC1B0A36EF2E280EBDB814BD21C260592CC535786`.
- Results live in `release/qa/windows-local-benchmark.json`; the release validator rejects stale or unqualified benchmark evidence.
- This is single-host reference data only. Minimum and recommended requirements remain provisional until representative lower-end and target systems receive sustained gameplay, GPU, thermal, and controller testing.

## 2026-07-30 — Commercial Scope Honesty Gate

- Audited the current executable's campaign against Steam-facing copy.
- The authored source contains one gym leader, Senka, and the runtime explicitly closes the current arc after the first gym.
- Replaced plural “gyms” claims with the implemented Briar Town first-gym scope.
- `npm run validate:store` now writes `release/qa/campaign-scope-report.json` and fails if public copy promises multiple gyms or a league before those are shipped.
- Commercial approval of this first-gym scope remains a product decision; the candidate no longer misrepresents what is currently playable.

## 2026-07-30 — Packaged Player Settings

- Replaced the Options placeholder with persistent Battle Audio, Reduced Motion, and Larger Text controls.
- Battle audio is disabled at the audio-context boundary; reduced motion suppresses interface animations and transitions; larger text scales menu and HUD copy.
- Rebuilt and promoted executable SHA-256 `E0FAD953DA0EFAF409B8FD64949B86909E46108DB3FF924636195D9AF8F70C6B`.
- Clean-profile startup, save/relaunch persistence, refreshed five-shot Steam capture, and local benchmark all passed against the new artifact.
- Packaged visual evidence and supported-feature limits are recorded in `release/qa/player-settings-report.json`. Controller, remapping, color-vision, screen-reader, and full-voiceover claims remain unapproved.

## 2026-07-30 — Packaged Resolution Matrix

- Added exact CSS-viewport QA controls to the Electron shell and normalized saved evidence independently of Windows display scaling.
- The first strict run caught an aspect-lock sizing defect; capture mode now sets exact content size while the normal player window retains its 16:9 lock.
- Packaged Options-layout captures pass at 1280×720, 1366×768, and 1600×900 with no clipped controls or copy.
- Evidence is recorded in `release/qa/windows-resolution-report.json` and bound to executable SHA-256 `C43610E5A5FA20924DA0DD239C1CCC106066D0FBCA6E94B4F7C5D90B038D5525`.
- A true 1920×1080 windowed content viewport remains uncertified on this host because Windows reserves work-area space. Fullscreen, ultrawide, 4K scaling, and multi-monitor transitions also remain open.

## 2026-07-30 — Runtime Source Drift Gate

- Windows packaging now records a deterministic SHA-256 over every file under `src/`, `public/`, and `desktop/` plus package metadata, dependency lockfile, TypeScript configuration, and Vite configuration.
- `npm run validate:release` recomputes the same 165-file fingerprint and fails if gameplay, assets, packaged configuration, desktop code, or build inputs have changed since packaging.
- The first live use caught concurrent Briar Lynx rear-sprite integration after the prior candidate was built and correctly failed validation.
- A replacement executable was built and promoted only after clean startup, save/relaunch, three-resolution QA, refreshed five-shot capture, benchmarking, and store validation passed.
- Current executable SHA-256: `C85512C0EB52361A3275552B9B2FB5AB50D2DE0EF4CDE1F81E5E2492E66B0028`.
- Current runtime-source fingerprint: `0469ED17AD74168CCA9D54A6EBF7B448613528430C7A95D804F446716D86DC2A`.
- Documentation and release-management scripts can still evolve without falsely invalidating the executable because they are not shipped runtime inputs.

## 2026-07-31 — Current-Source Candidate Promotion

- The runtime-source gate caught a second legitimate drift set: new Copperling and Stormvault Columba production art plus current battle-scene integration.
- Rebuilt and promoted the portable Windows executable from the resulting 168-file runtime fingerprint instead of accepting stale release evidence.
- Clean-profile startup, save/relaunch persistence, exact 1280×720, 1366×768, and 1600×900 viewport checks, all five Steam captures, store validation, and a three-launch startup benchmark passed.
- Current executable SHA-256: `D63C6D9F602E25E7B31ADC214184A1AD40234DF357364D1460A43D41CAEA8A03`.
- Current runtime-source fingerprint: `0D68B5C468B236A00971DC192FEF05C6E14B3E060710C5E1B1466CC5E0AADC1D`.
- The unified internal-review gate passes 28/28 checks. External Steam submission remains unauthorized.

## 2026-07-31 — Paired Dogemox Candidate Refresh

- Source-fingerprint validation rejected the previous candidate after Dogemox received matched front and rear production battle art.
- Rebuilt the portable executable from the resulting 170-file runtime source and visually confirmed the rear-view sprite in the packaged Moonfen encounter.
- Clean-profile startup, save/relaunch persistence, exact three-resolution QA, all five refreshed Steam captures, store validation, and the three-launch startup benchmark passed.
- Current executable SHA-256: `2927BE7093B461C7F19270F99A1220F04214AA069AE5C833874B5A6A310D1EE2`.
- Current runtime-source fingerprint: `E7F6F106C4DD31CE3BF261AC5A53D85C7DFC4011C10FB4E2B760238DE79E1B86`.
- The unified internal-review gate remains green at 28/28. Broader hardware coverage and any external submission still require separate action.

## 2026-07-31 — Anatomy Correction and QA Reliability

- Promoted the corrected four-limbed Briar Lynx rear view and the new paired Faultcrown Rhinoceros rear battle art into the current portable executable.
- Hardened packaged QA against real Windows behavior: portable launches now allow 60–90 seconds where appropriate, timed-out process trees are terminated, and Chromium profile deletion retries transient file locks.
- Clean startup, persistence, three target resolutions, five Steam captures, store validation, and three fresh benchmark launches all passed.
- Current executable SHA-256: `3DCEA134C392E003662DD00A796715B30930185B65BDA6F6541D711AA09C0716`.
- Current runtime-source fingerprint: `9F503B52D0EC720E977D16A66123BEF2312BAC34E0C9F0E9760FCC86B4EF4742`.
- Unified status: 28/28 checks passed; external publishing remains unauthorized.

## 2026-07-31 — Steam-Depot Windows Package

- Added a repeatable unpacked Windows package at `release/windows-depot/`, modeling the directory Steam would install rather than a self-extracting portable wrapper.
- The depot contains 76 files totaling 847,650,483 bytes and launches through `Anima Codex.exe`.
- Three isolated-profile launches reached first render in 15.754 s, 17.718 s, and 22.242 s; median 17.718 s versus 31.350 s for the current portable wrapper on the same host.
- This indicates that much of the observed portable startup cost is self-extraction overhead. It does not yet establish minimum hardware requirements or sustained gameplay performance.
- Depot executable SHA-256: `0806A0539A2612430A31F2DB7F3567A8927AF138F62B990A5EA10ED90BE757A1`.
- The unified release validator now binds the depot and its benchmark to the same current-source fingerprint, expanding the gate to 30/30 checks.

## 2026-07-31 — Razorjack Paired-Perspective Promotion

- Added Razorjack Lepus's authored rear battle view to both Windows distributions, completing another cohesive front/rear creature presentation.
- Rebuilt the portable executable and unpacked Steam-style depot from the same 173-file runtime fingerprint.
- Clean startup, save/relaunch persistence, three-resolution QA, five refreshed Steam captures, store validation, and both three-launch benchmarks passed.
- Current portable SHA-256: `F0F200B899E5342BE0BF7120AF4D7E875F4788783D35165462F8267BC6E252D8`.
- Current depot executable SHA-256: `C90C25A9ADF96C9E225D64587D3160DC69636F67AA200F2B64A95CDE1208C4FD`.
- Runtime fingerprint: `768F74221882F3C55598B5EE8AD3ACA04D8A223A749555D93E19AE6049634874`.
- The depot reached a 12.325-second median first render on the reference host; the source-bound unified gate passes 30/30 checks.

## 2026-07-31 — Kilncrest Paired-Perspective Promotion

- Added Kilncrest Equus's authored rear battle view to both Windows distributions, preserving a coherent three-quarter staging angle instead of mirroring its field-guide portrait.
- Portable and Steam-style depot packages now share the same 174-file runtime fingerprint.
- Clean startup, persistence, three resolutions, five refreshed Steam screenshots, store validation, and both launch benchmarks passed.
- Portable SHA-256: `CE5433200081F53759EC10F3A3635B1111679FA75FBC53B1500617E4C070C6AE`.
- Depot executable SHA-256: `97B807F7047A474E8E9CA4B78A2F4E03954EEADA4C50CFEF4C13892AB9E29ADD`.
- Runtime fingerprint: `E3CE71A8F8BC996740D327A62C8159486B69FBA215EF97EDFC13292BB4C18B8F`.
- Direct-launch depot median first render: 12.203 seconds. Unified status: 30/30 checks passed.

## 2026-07-31 — Briarback Paired-Perspective Promotion

- Added Briarback Mustela's dedicated rear battle view to both Windows distributions.
- Portable and depot packages share runtime fingerprint `9AD0413372DD98A18E3F3EFCB86F766FF8D6CEEAA643F36CD4151EEBCA77C911` across 175 files.
- Portable SHA-256: `B2E9A6CE3C00E72232833DDE6F9DD7453C87C55FB3B082DA6C0213C7786721AF`; depot executable SHA-256: `F46103585551ACAD33D380EA8109B870D11CE3F111C7A69BAF0A62DB665E7E8E`.
- Clean boot, persistence, three resolutions, five Steam captures, store validation, and both benchmarks passed. Depot median first render: 11.171 seconds; unified gate: 30/30.

## 2026-07-31 — Carillon Paired-Perspective Promotion

- Added Carillon Pagurus's dedicated rear battle view to portable and Steam-style depot builds.
- Both distributions match the 176-file runtime fingerprint `3F718651285C7A4C93AAE34CC73C7CF58A406DC86F485DC42F4D6F6D792C0F92`.
- Portable SHA-256: `82918025968C25F827E02C5ABEAA8689151338CF0DE8EA1D3194A3D50AB5FC8E`; depot executable SHA-256: `B2913A17D2185DEFBA8C1DD32F78E7A30B1FC7AED4EE9E9F5CD7DA7D72B9EEFB`.
- Clean boot, persistence, resolution matrix, five Steam captures, store checks, and both benchmarks passed. Depot median: 10.196 seconds; unified gate: 30/30.

## 2026-07-31 — Weirfang Paired-Perspective Promotion

- Added Weirfang Lutra's dedicated rear battle view to both Windows distributions.
- Both packages match the 177-file runtime fingerprint `891337B2F99B0FA128A4F3C850D1D5A50504AD88DF8A278CFE1FD54F20E8E8ED`.
- Portable SHA-256: `55B7DFC4E492B65B68C8B20134C045E08E326A807A2EDDD1A47F91C479553871`; depot executable SHA-256: `FBA208D1EC88B1EE69100845B0E05C3276FFCB35EBB6901BF87EC55844F93261`.
- Clean boot, persistence, three resolutions, five Steam captures, store validation, and both benchmarks passed. A transient depot packaging failure was rejected and the successful retry produced a 17.705-second median; unified gate: 30/30.

## 2026-07-31 — Thunderplume and Stormspire Paired-Art Promotion

- Consolidated revised Thunderplume Crane and Stormspire Grus front portraits plus their dedicated rear battle views into both Windows distributions.
- Both packages match the 181-file runtime fingerprint `DFC6369C5F91F1E8144AFA25B966A1D95170BB37B08749908962F9A9508F4C45`.
- Portable SHA-256: `771695CD18EA353B9FD02AA5180455879C8785370E0D5D7968165DFE29761B93`; depot executable SHA-256: `C7AFE18137FA678201BFEDFC85D07F30F5EC508B0A1A9EF1C0BE4E5A7B85F8BA`.
- Clean boot, persistence, three resolutions, five Steam captures, store validation, and both benchmarks passed. Depot median: 9.897 seconds; unified gate: 30/30.

## 2026-08-01 — Thornvault Paired-Art Promotion

- Added Thornvault Sciurus's revised front portrait and dedicated rear battle view to both Windows distributions.
- Both packages match the 183-file runtime fingerprint `4C2CA35295D2C24E4E65160BEFB84507E80F7FCC1E9722116D4B939763293EE3`.
- Portable SHA-256: `050EA7D498DFFE125C39F4E5D85712EF8F3204D49D3C7CDD9EDC6E9C9D33C949`; depot executable SHA-256: `C55EE029E3A78BEFC9DB2BD177C649CB7AB4FE139F6D828F0F9548FFEF034E24`.
- Clean boot, persistence, resolution matrix, five Steam captures, store validation, and both benchmarks passed. Depot median: 10.376 seconds; unified gate: 30/30.

## 2026-08-01 — Ignis and Cohesive Battle-Backdrop Promotion

- Added Ignis Canis's revised front portrait and dedicated rear view, plus revised Ember Hollow and Briar Town battle backdrops with more coherent battle staging.
- Both Windows distributions match the 187-file runtime fingerprint `E1EBABA18DAFF82AFE0E34F8F125B83E84F3C726B0A2265AF9F505035239E26A`.
- Portable SHA-256: `9167805AF85B57EEEB99CC2D26EB24091038BAA32093A891DD5B1C99B405FB38`; depot executable SHA-256: `2E735C5CD22357B2AFCFCB94B5B7BAB07EE8847C5591B9B08021E4968E44FB26`.
- Clean boot, persistence, three resolutions, five Steam captures, store validation, and both benchmarks passed. Depot median: 10.854 seconds; unified gate: 30/30.
- Final revalidation then detected a newly arrived, not-yet-integrated `starglass-roost-battle-v2.png`; the 187-file candidate is therefore retained as verified historical evidence but is not the current promotable candidate.

## 2026-08-01 — Astra and Four-Backdrop Current Promotion

- Integrated the previously in-flight Starglass Roost backdrop together with revised Sanctuary Trail, Briar Gym, and Lantern Nursery battle stages and Astra Corvus's revised front/rear pair.
- Both Windows distributions match the 193-file runtime fingerprint `E1FD6588586DEE356BDFD5FB87B5D9367883CF13D68F4D56651D8028CBCCC602`.
- Portable SHA-256: `5D2C2DC709F6311F4C70D78ADBF7BA1FC975B1C9135BCE8436294AFC5A672C96`; depot executable SHA-256: `ACDF6BA45E844C2DCF13C6BD0D6C68AFD42030DA510B9C9753E38CDBDE33FCE8`.
- Clean boot, persistence, three resolutions, five refreshed Steam captures, store validation, and both benchmarks passed. Depot median: 9.831 seconds; unified gate: 30/30.

## 2026-08-01 — Ironjaw Paired-Art Promotion

- Added Ironjaw Lupus's revised front portrait and dedicated rear battle view to both Windows distributions.
- Both packages match the 195-file runtime fingerprint `8F9D9A978269B4F17F3AC30305CCF70D089ACF4D4743A5735F922D1B0EFC6CB1`.
- Portable SHA-256: `CDE391BFA4B828C3AEE3A0AF7AF9873C10209EE865A8312AD01FBF2986E9634A`; depot executable SHA-256: `D18F721DF860398BDCFA7ACDE6C3D3E49A922C8E329FBE74FC1050C737081CAC`.
- Clean boot, persistence, resolution matrix, five Steam captures, store validation, and both benchmarks passed. Depot median: 10.147 seconds; unified gate: 30/30.

## 2026-08-01 — Lunaris Paired-Art Promotion

- Added Lunaris Bufo's revised front portrait and dedicated rear battle view to both Windows distributions.
- Both packages match the 197-file runtime fingerprint `FB329E773AB223A5CB0CD55F4B405A2268A9CE62D6D786EE6ED48A01212BDC9E`.
- Portable SHA-256: `496A621EA8801203DE8E6167D4C299451C59F0D9FAE9E7641E0FAEB841DACC47`; depot executable SHA-256: `4449E68E83E5F98D78C73ECB22A6BBA3B67A9566294FF60BA26BC27D5D0431BA`.
- Clean boot, persistence, resolution matrix, five refreshed Steam captures, store validation, and both benchmarks passed. Depot median: 10.321 seconds; unified gate: 30/30.

## 2026-08-01 — Tidehorn Paired-Art Promotion

- Added Tidehorn's revised front portrait and dedicated rear battle view to both Windows distributions.
- Both packages match the 199-file runtime fingerprint `5426D1A94DF6983B59C8324FA4821F8BB164B436FE860ED9807F847B4200BF74`.
- Portable SHA-256: `3F388FC5D8891E0DE5F453FB892B0F9DC68655A03628D4F6379E9B53F6BA911E`; depot executable SHA-256: `A40A842874C024E973307C424A263381A2ECF856203F306DDFEEA8C67E5AC028`.
- Clean boot, persistence, three resolutions, five refreshed Steam captures, store validation, and both benchmarks passed. Depot median: 10.400 seconds; unified gate: 30/30.

## 2026-08-01 — Verdaconda Paired-Art Promotion

- Added Verdaconda's revised front portrait and dedicated rear battle view to both Windows distributions.
- Both packages match the 201-file runtime fingerprint `0443DCBE079314EA27696557882AD84D1DA3DB5233EF692FCE7C950C98FBC952`.
- Portable SHA-256: `DBC2EC8C13FE191210E8D1CFC2A5FB4C02E69FD08F64D12629C455484738136E`; depot executable SHA-256: `ABE36E6D38F54F286CE8B322EE6085D48E9AE36998CCEE4471C5A0B4CAEF33AE`.
- Clean boot, persistence, three resolutions, five refreshed Steam captures, store validation, and both benchmarks passed. Depot median: 11.757 seconds; unified gate: 30/30.

## 2026-08-01 — Magmadon Paired-Art Promotion

- Added Magmadon's revised front portrait and dedicated rear battle view to both Windows distributions.
- Both packages match the 203-file runtime fingerprint `03FCA472C80B6993FA67E7E05EA26E96F59D2F9B32CD69E8670AEE7A673718FA`.
- Portable SHA-256: `DA24B4AE241E5201EF17B2F0B728AA07D17342B3A068A27D9394A67247A55183`; depot executable SHA-256: `1E530AC7C0B98F87CE305AC3672BA9CFCF4CA1C1DC7DFDEF4DBA753DB3920971`.
- Clean boot, persistence, three resolutions, five refreshed Steam captures, store validation, and both benchmarks passed. Depot median: 11.145 seconds; unified gate: 30/30.
