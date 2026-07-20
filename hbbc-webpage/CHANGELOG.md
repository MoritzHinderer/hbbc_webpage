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

## [0.6.2] - 2026-07-20

Fixed the "Gründungsmitglieder" stat tile's label overflowing past the
tile border on mobile (closes #16) — a long, unbreakable German compound
word in a narrow two-column mobile grid. Added a soft hyphen so it wraps
as "Gründungs-/mitglieder" only if it needs to, plus `break-words` as a
general safety net for the other stat labels.

## [0.6.1] - 2026-07-18

Fixed the home page hero logo's size and position changing
unpredictably while scrolling on iPad/iPhone Safari (closes #12).

The logo shrinks slightly on some screen sizes so it doesn't overlap the
heading below it — a "correction factor" measured once on page load. The
code also recomputed that measurement on every window `resize`, which is
correct for a real orientation change or window resize, but iPadOS
Safari's own URL/tab bar also fires `resize` every time it hides while
scrolling down and reappears scrolling up. That meant the "one-time"
measurement was actually being redone throughout an ordinary scroll
session, and each individual remeasurement could land on a different,
sometimes-wrong result depending on the exact instant it ran relative to
the browser's own toolbar animation. Fixed by only recomputing on a
genuine viewport *width* change — the toolbar hide/show never changes
width, so it no longer retriggers this measurement at all.

Also fixed a smaller, related bug affecting iPhone: `window.scrollY`
briefly goes negative during the browser's own elastic "rubber-band"
overscroll bounce (pulling past the top), which fed an out-of-range
value into the same scroll-progress math and briefly overshot the
logo's scale/position. Now floored at 0.

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
