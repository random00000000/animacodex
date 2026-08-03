# Progression Roadmap

## Purpose

This roadmap closes the gap between the current first-gym vertical slice and the product promise of ten gyms, a final league, and a resolved Vivo-freedom story. It is the progression source of truth for implementation sequencing; encounter, art, and release work should not imply a later chapter is playable until its completion gate below is wired and verified.

The live Peter profile refers to a Hub Terminal, Crafting Station, and Q-key building menu. Anima Codex has no base-building machine loop. The closest product-native surfaces are:

- **Sanctuary ledger:** roster custody, rescued-Vivo reserve, chapter records, and public support.
- **Field log:** current objective, route lessons, discoveries, and next unlock.
- **Battle study:** move learning, transformation preparation, and tactical loadout decisions.

These are the progression surfaces to extend unless the owner explicitly authorizes a base-building pivot.

## Current Playable Baseline

The runtime currently supports a complete opening slice:

1. Start with Dogemox.
2. Explore the Briar region and connected habitats.
3. Rescue and train Vivos, learn moves, and awaken a form.
4. Complete at least one route mentor lesson.
5. Defeat Leader Senka at Briar Gym.
6. Drive off Patrol Rhis and reclaim the seized Vivo.

The current final goal banner, `Carry Sporebell's habitat evidence toward the next sanctuary`, is a Gym 2-complete holding state—not the game ending.

## Campaign Spine

Target first-completion time: **24–32 hours**, with another **8–15 hours** for optional rescues, rare forms, and mastery rematches. Chapters should average 2–3 hours after the opening, with no mandatory level-grind wall longer than one natural route pass plus one trainer rematch.

| Chapter | Player level band | Required climax | Permanent unlock | Story movement | Completion evidence |
| --- | ---: | --- | --- | --- | --- |
| Prologue | 1–5 | First sanctuary rescue | Sanctuary ledger | Dogemox is protected from confiscation | Starter, first rescue, and save/reload persist |
| Gym 1: Briar | 5–15 | Senka + Patrol Rhis | Steward badge; reserve access | Briar publicly resists the first seizure | Existing first-gym and patrol flags |
| Gym 2: Sporebell | 11–15 | Cadence field study + Warden Tamsin | Adaptation badge; Cadence habitat record | Evidence shows Vivos stabilize habitats outside containment | Badge, evidence, route gate, and chapter dialogue persist |
| Gym 3 | 18–30 | Rescue under environmental pressure | Advanced rescue tool | A confiscation transport is intercepted | Trust-first rescue path is mechanically viable |
| Gym 4 | 25–38 | Multi-form tactical trial | Form recall at sanctuary | Government presents weaponization evidence | At least two form paths solve the trial |
| Gym 5 | 32–45 | Midpoint civic gym | Regional travel permit | A town votes on Vivo custody | Player rescues change at least one dialogue outcome |
| Gym 6 | 40–55 | Attrition and switching trial | Expanded reserve services | Sanctuary network becomes organized | Six-Vivo roster rotation is required and persisted |
| Gym 7 | 50–65 | Rare-habitat guardian | Apex habitat access | Free Vivos visibly defend a community | Optional apex rescue affects climax support |
| Gym 8 | 60–75 | Government research complex | Transformation stabilization | Origin of engineered life is revealed | Lab route, boss, and discovery records persist |
| Gym 9 | 70–85 | Rival sanctuary trial | Mastery rematches | Competing freedom strategies confront each other | More than raw level determines eligibility |
| Gym 10 | 80–95 | National stewardship hearing/battle | League invitation | Public case for Vivo autonomy is assembled | Ten badges and required rescue evidence validated |
| League | 90–100 | Elite bracket + final public champion | Postgame sanctuary charter | Confiscation policy is overturned or materially changed | Ending state, credits, and postgame save persist |

Gym names, leaders, and exact regions remain content decisions. The functional order and unlock cadence above can be implemented without prematurely locking those names.

## Progression State Contract

Campaign progression must be stored as simulation data and survive save/reload:

- `chapterId` and chapter completion flags.
- Ten badge identifiers rather than a single badge count only.
- Defeated required trainers and completed tactical lesson goals.
- Public-support or stewardship evidence earned from rescues and discoveries.
- Route permits and sanctuary-service unlocks.
- Ending choice/result and credits completion.

Every chapter transition must have exactly one authoritative requirement evaluator. UI surfaces may explain that evaluator but must not duplicate progression rules.

## Balance Guardrails

- The intended chapter cap rises roughly 8–12 levels per gym and reaches 90–100 only at the league.
- A player who clears normal encounters and required trainers should enter each gym within two levels of its target floor.
- Optional rescues and habitat mastery grant tactical breadth, not an unavoidable raw-stat advantage.
- At least two viable elemental or tactical answers must exist for every required gym.
- Gym rematches may accelerate recovery from under-leveling, but cannot be the optimal infinite grind.
- No required progression check may depend on an untelegraphed hidden counter.

## Ending Acceptance Criteria

The game has a cohesive ending only when all of these pass in a normal, non-admin Windows build:

1. A fresh save can reach all ten gyms and the league without debug bypasses.
2. The final league checks badges plus player-earned stewardship evidence.
3. The final sequence resolves the confiscation conflict and acknowledges the player's roster/rescues.
4. Credits play and return to a postgame sanctuary state.
5. Saving after the ending and relaunching preserves the ending result and postgame access.
6. A campaign smoke report records completion time, final roster, badge set, ending result, and any blocker encountered.

## Next Implementation Increment

Implement the chapter-state contract and migrate the existing Senka/Rhis flags into a `gym1Complete` chapter boundary without changing current player outcomes. Then expose the resulting chapter summary in the sanctuary ledger and field log. This creates one reusable progression path before Gym 2 content is authored.

### Implemented: Gym 1 chapter contract

`GameState` now owns a single campaign evaluator for the opening rescue, Gym 1 preparation, Senka's trial, the Rhis aftermath, and `gym1Complete`. The existing trainer flags and first-gym readiness rules remain authoritative inputs. The evaluated chapter is shown in the field log, refreshed before saving, stored in the existing save snapshot, and reconciled from authoritative flags when an older save loads. Future chapters should extend this evaluator and its data contract instead of adding UI-specific progression checks.

Save-slot summaries and the sanctuary ledger now consume that same evaluated chapter metadata. A saved route identifies its chapter by title and completion state before loading, while the open sanctuary ledger shows the current chapter objective beside roster rotation. Neither surface inspects trainer flags directly.

The production build now runs a deterministic desktop campaign audit after bundling. It exercises six authoritative states—opening, nursery preparation, mentor-without-awakening, mentor-plus-awakening, Senka cleared, and Rhis cleared—and writes `release/qa/campaign-progression-report.json`. New chapters must extend this case table so every campaign boundary has a regression check before packaging.

Save slots now accumulate active playtime for pacing analysis. The clock advances while the game window is active, pauses while hidden, persists through the existing save snapshot, and appears in save-slot and sanctuary-ledger summaries. Older saves begin at zero without migration failure. The campaign audit verifies pause stability plus isolated save/summary persistence, giving chapter playtests a trustworthy duration measure against the 24–32 hour campaign target.

Completed chapters now record a one-time milestone against that same active-playtime clock. Gym 1 records `gym1Complete` when Patrol Rhis is first cleared, exposes the clear time in save-slot and sanctuary summaries, and preserves it across reload. Older Gym 1-complete saves backfill the milestone from their cumulative active time. Future chapter definitions should record their own completion key through this same map.

The provisional pacing target for the opening through the Gym 1 aftermath is **3–5 active hours**. `GameState` compares the persistent `gym1Complete` milestone against that band and reports faster-than-target, on-target, or slower-than-target through the same save-slot and sanctuary surfaces. This is an instrumentation target, not a player-facing penalty; revise it only after representative fresh-save playtests. The production campaign audit covers the unmeasured state and both inclusive boundary values so later UI work cannot silently change the comparison.

Campaign badges now have durable identifiers rather than existing only as a count. Senka awards `briarSteward` once through the shared trainer-reward path; the numeric badge count is derived from the earned-ID set. Save slots and the sanctuary ledger name the Briar Steward Badge, while version-1 saves that only carried the legacy count or Senka clear flag migrate automatically. Future gyms should add one badge ID and trainer mapping instead of incrementing a counter in bespoke code.

The first league-facing stewardship evidence is also live. Completing any authored scripted rescue records `sanctuaryRescueRecord`, while defeating Patrol Rhis records `briarDefenseTestimony`. Both are unique, persist in the shared save, appear by title in the sanctuary ledger, and are summarized in the field log. Older saves derive them from resolved rescue IDs and the Rhis clear flag. Future chapters should add evidence IDs at existing outcome paths; the eventual league gate must inspect this set rather than invent a support-point counter.

### Implemented: Gym 2 Sporebell adaptation chapter

Defeating Rhis now opens the previously ungated Sporebell Garden exit from Lantern Nursery and advances the campaign into Chapter 2. Tamsin will not begin her trial until the player crosses the garden, enters Cadence Lab Annex, and studies the living Warning Light Tree. Returning with that field observation unlocks a level 11–13 two-Vivo adaptation trial. Victory awards the persistent `sporebellAdaptation` badge, records `habitatAdaptationStudy`, stores the `gym2Complete` milestone, and advances the field log to the Gym 2 holding state.

The shared campaign audit now covers eight boundaries from the opening through Cadence field study and Tamsin clear. Gym 2 targets 5–8 cumulative active hours; like the Gym 1 band, this is provisional until representative clean-save playtests establish actual pacing.
