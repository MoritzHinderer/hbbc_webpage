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
