# Changelog

All notable changes to this project are documented here, following the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Version
numbers follow [Semantic Versioning](https://semver.org/): `vMAJOR.MINOR.PATCH`.

To ship a release: move the relevant `[Unreleased]` entries under a new
`## [X.Y.Z] - YYYY-MM-DD` heading, commit, then

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

The VPS picks up the new tag automatically within the hour (or run
`deploy/04-auto-deploy.sh` on the server to deploy it immediately) — see
`deploy/README.md`.

## [Unreleased]

## [0.6.1] - 2026-07-18

Fixed the home page hero logo's size/position visibly jumping around
while overscrolling on mobile/iPad (closes #12), via two changes.
First, `window.scrollY` briefly goes negative during the browser's own
elastic "rubber-band" overscroll bounce (pulling past the top); the
scroll-progress calculation driving the logo's scale/translateY was only
clamped on the upper bound, so a negative `scrollY` fed a negative
progress into those formulas and overshot them. Fixed by flooring
`scrollY` at 0 before computing progress — confirmed fixed on a real
iPhone. That alone wasn't enough on iPad, where the same visible glitch
persisted (tracking the bounce smoothly rather than jumping — pointing
at the browser's live bounce rendering itself, not just the JS math).
Second fix: `overscroll-behavior-y: none` on `html`/`body` disables the
elastic bounce outright (supported since Safari 16), sidestepping the
question of what `scrollY` does mid-bounce on any given device. That
eliminated the bounce itself, but a third, distinct bug remained: the
logo's size still swung unpredictably with scroll depth (independent of
any bounce), because `handleScroll()` read `window.innerHeight` fresh on
every scroll event to compute both the progress ratio's denominator and
the logo's vertical centering — and iOS/iPadOS Safari's collapsible
toolbar animates `window.innerHeight` over the course of an ordinary
scroll gesture, making that denominator a moving target against the also-
changing `scrollY` numerator. Fixed by caching the viewport height once
and only refreshing it on `resize` (which already existed as a listener
for this exact toolbar behavior, just wasn't feeding the cache), so
`handleScroll()` no longer reacts to the toolbar's live height changes
mid-scroll. Still not enough on a real iPad — user confirmed the size
still swung with scroll depth even with both prior fixes in place, which
research (see PR #15 for sources) tied to a distinct, documented WebKit
issue: `position: fixed` elements can flicker/mis-render while iOS/
iPadOS Safari's own toolbar hide/show animation is in progress,
independent of whatever CSS values are applied to them. Fourth fix:
force the logo's fixed container onto its own GPU compositor layer via
`translateZ(0)` (appended to its existing transform) and
`will-change: transform` — the standard workaround for this class of
bug. Desktop mice/trackwheels on this OS never produce a negative
`scrollY`, don't rubber-band, and don't have a collapsible toolbar, so
all four changes are no-ops there, matching the issue's "computer
browser should stay as is" requirement. Still not enough — user provided
a screen recording plus two screenshots showing `logoScale` at two
different values (1.190 and 2.000) despite `scrollY`, `innerHeight`, and
`visualViewport.height` all reading identically between them, which
ruled out every scroll-position-dependent explanation above and pointed
at the one-time "correction factor" the code computes once (at mount and
on every `resize`) to keep the logo from overlapping the heading text
below it. Fifth fix, the actual root cause: `onResize`'s handler cleared
its `resizeTicking` guard *synchronously*, immediately after merely
*starting* `computeLogoScaleCorrectionFactor()` — an async function with
its own multi-frame loop — rather than waiting for it to finish. iPad
Safari's toolbar hide/show can fire several `resize` events in quick
succession while it animates and settles, so a second `resize` event
arriving while the first computation was still mid-flight started a
second, overlapping computation racing the first over the same shared
`logoScaleCorrectionFactor` ref (which each call unconditionally resets
to `1` at its start) — exactly matching the evidence: sometimes the
correct corrected value, sometimes stuck at the uncorrected default,
independent of scroll position. Fixed by awaiting the full chain in
`onResize` and adding an internal reentrancy guard directly inside
`computeLogoScaleCorrectionFactor()` (protecting every caller, including
the image's own `load` handler, not just `onResize`). Confirmed via a
Playwright reproduction: firing rapid, overlapping `resize` events at a
viewport size that genuinely requires correction — 15 rounds all
converged on the same correct scale with the fix, versus not reliably
reproducible as a synthetic automated test even against the pre-fix
code, since real Safari's event timing under an actual animated toolbar
isn't fully replicable in a headless browser. Confidence here rests on
the code-level proof (the synchronous guard-clear) and the user's own
hard evidence, not an automated repro. Still not enough — user confirmed
the fifth fix also didn't resolve it, so a temporary diagnostic overlay
was re-added exposing `logoScaleCorrectionFactor` directly plus counters
for how many times the correction computation starts/gets blocked by the
reentrancy guard/completes. Four fresh screenshots showed the actual bug
clearly for the first time: "correction calls blocked" stayed at `0`
through 2, 4, 6, and 12 `resize` events — the reentrancy guard was never
even engaging, meaning fix #5's race-condition diagnosis, while a real
and valid fix in its own right, was not the (or not the only) actual
cause. Yet `correctionFactor` still flip-flopped between the correct
value and the uncorrected default across separate, fully sequential
(non-overlapping, guard-confirmed) calls, at an identical, already-
settled `innerHeight`. Sixth fix: only recompute the correction factor
on a genuine viewport **width** change (a real orientation change/window
resize), not on every `resize` — iPadOS Safari's toolbar hide/show only
ever changes height, never width, so it no longer retriggers this
measurement at all, sidestepping whatever exact WebKit-specific
layout/paint timing was producing the bad reads (unreproducible even
with genuine Playwright viewport resizes in headless Chromium, which
appears to complete its layout synchronously in a way Safari's
*animated* toolbar transition does not). This also matches the
correction factor's own original design intent, predating any of these
six fixes: a one-time, worst-case "resting state" value, never meant to
reactively track a transient browser-chrome fluctuation. **Confirmed
fixed on a real iPad** — debug overlay removed.

## [0.6.0] - 2026-07-18

Phase 3 of automated testing (further progress on #7, still not closed —
frontend component tests remain, roughly 30 views/components with
essentially no coverage yet). Every backend route now has real
integration test coverage: contact, downloads (per-file auth gating),
the member-only events/Fanclub-Termine list, gallery (approved-only
filtering, uploads, albums), profile (member-card CRUD, newsletter
toggle), and the OpenLigaDB-backed public vfb-matches schedule (fetch
mocked, cache behavior and external-API resilience exercised
deterministically via a faked Date). Backend test count: 114 -> 150.
Also caught and fixed a real order-dependent flakiness bug: a new
profile.test.ts left member cards behind in the shared test content
directory with a fanclub_member_id that isn't guaranteed unique across
test files, occasionally causing a false-positive conflict in an
unrelated test — fixed by cleaning up each created card, same
discipline already used in members.test.ts.

## [0.5.0] - 2026-07-18

Phase 2 of automated testing (further progress on #7, still not closed —
Phase 3 continues with the remaining backend routes and the bulk of the
frontend component tests). Backend test count: 45 → 114. Covers every
public read-only route, every admin CRUD route (events, downloads, news,
users, gallery, members — including real multipart file uploads via
supertest), account-request approval, the analytics dashboard, and
newsletter sending. Along the way, fixed several routes that hardcoded
their content-file paths directly to server/content/ (or, for the
downloads manifest, the git-tracked public/downloads/) — real risk that
a CRUD test would read and write actual live site content — by
introducing a shared, env-var-driven override (CONTENT_DIR/PUBLIC_DIR)
that every content route now uses.

## [0.4.0] - 2026-07-17

Phase 1 of automated testing + CI (progress on #7, not yet closed — see
the issue for the phased roadmap toward >90% coverage). Vitest for
backend (45 tests: password/session/validation units, register/login/
forgot-password and one representative admin-CRUD route as supertest
integration tests) and frontend (8 component tests), plus a small
Playwright e2e suite (6 tests) covering login, the full forgot-password
flow, and navigation/404. New GitHub Actions CI pipeline runs all of it
on every push and PR — coverage is reported, not a merge-blocking gate,
since it's climbing from zero rather than already near the target.

## [0.3.0] - 2026-07-17

Added a "CSV exportieren" button to the Fanclub-Mitglieder admin tab
(closes #8): downloads every fanclub member's name/email/joined-date/
notes as a plain CSV, with a text banner line and UTF-8 BOM so Excel
opens umlauts correctly.

## [0.2.0] - 2026-07-14

Added a "forgot password" self-service flow (closes #1): a "Passwort
vergessen?" link on `/login` leads to `/forgot-password` (request a reset
link by email, always shows the same confirmation regardless of whether
the email matches an account) and `/reset-password?token=...` (set a new
password). Resetting invalidates every existing session for that
account and sends a "your password was just changed" notification
email. Reset links are single-use and expire after 30 minutes.

## [0.1.2] - 2026-07-14

Replaced the Impressum/Datenschutzerklärung address and "vertreten durch"
placeholders with real data (closes #2). The real name/address/phone live
only in `.env` (never in git) and are served through a new public
`GET /api/impressum` endpoint, the same pattern already used for SMTP/
contact config — so no personal data ends up in the repo's commit
history. Also fixed invalid nested `<p>` markup left over from an
earlier manual edit.

## [0.1.1] - 2026-07-12

Fixed double "v" in verison tag in footer

## [0.1.0] - 2026-07-12

First versioned release — covers everything built up to this point.

### Added

- Public site: Home, News, Events (VfB Stuttgart schedule/scores), Downloads, Gallery, Members
- Member-only areas: Fanclub-Termine, Galerie-Uploads, Profil
- Accounts: registration with admin approval, login/logout, role-based access (member/admin)
- Fanclub-Mitglieder as the central club-roster entity, with accounts and member cards each optionally linked to one
- Admin area: content management for members, events, gallery, downloads, news; user &amp; fanclub-member management with search; newsletter composer with branded HTML template and send history; simple analytics dashboard
- Contact form and newsletter subscription, both via branded email
- Interactive member map, animated stat counters, testimonials carousel
- Impressum and Datenschutzerklärung pages
- Versioning (this file, and a version string shown in the site footer) and automatic deployment to the VPS on new version tags

### Known gaps

- Impressum is missing a real address (currently a placeholder) — must be filled in before this is legally complete
- No "forgot password" recovery flow yet
