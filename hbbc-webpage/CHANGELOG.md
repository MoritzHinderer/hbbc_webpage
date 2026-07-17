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
