# HBBC Webpage

<div align="center">
  <img src="hbbc-webpage/src/assets/hbbc_logo.webp" alt="HBBC Logo" width="200"/>
</div>

Official website for the **Hamburger Böblinger Banausenchor und VFB Fanclub** (HBBC), an official fanclub of VfB Stuttgart. Vue 3 + TypeScript frontend with a small Express backend for accounts, content management, and email.

## Features

- **Public pages** — Home, News, Members, VfB-Spiele (auto-fetched match schedule + live scores), Downloads, Contact, Impressum/Datenschutz
- **Member-only** (🔒 login required) — Fanclub-Termine, Galerie (member photo uploads with admin approval)
- **Accounts** — request → admin approval → login, with self-service profile management at `/profile`
- **Admin dashboard** (`/admin`) — manage members, fanclub-membership, events, gallery, downloads, news, and a WYSIWYG newsletter composer, all without hand-editing files
- **Versioning** — the footer shows the deployed version; the VPS auto-deploys new `vX.Y.Z` git tags (see [`deploy/README.md`](hbbc-webpage/deploy/README.md))

## Tech stack

Vue 3 + TypeScript + Vite + Tailwind CSS v4 on the frontend; Express + Nodemailer on the backend; `node:sqlite` for accounts/sessions (no external database); Chart.js, Leaflet, and Swiper for the members chart/map/gallery slideshow. See `package.json` for the full dependency list.

## Getting started

```bash
cd hbbc-webpage
npm install
cp .env.example .env   # optional — fill in SMTP_* to actually send mail; without it, sends are just logged
npm run dev:all        # frontend (Vite) + backend (Express), both with hot reload
```

Open `http://localhost:5173`.

**First admin account** (chicken-and-egg: you need an admin to approve accounts, but none exist yet):

```bash
npm run create-admin -- "Your Name" you@example.com yourpassword
```

Safe to re-run — running it again with an existing email promotes that account to admin instead of erroring.

## Available scripts

Run from `hbbc-webpage/`:

- `npm run dev:all` — frontend + backend together (recommended for local dev)
- `npm run build` — typecheck + production build
- `npm start` — run the built app in production mode (serves the frontend and `/api/*` from one process)
- `npm run create-admin -- "Name" email password` — bootstrap or promote an admin

## Project structure

- **`src/`** — Vue app: `views/` (pages), `components/` (incl. `admin/`, one component per Admin tab), `router/`, `auth.ts` (frontend auth state)
- **`server/`** — Express app: `routes/` (one file per resource), `auth/` (password hashing, sessions), `content/` (admin-editable JSON + uploads, gitignored — lives only on disk, never in git), `data/` (SQLite database, gitignored)
- **`deploy/`** — VPS provisioning and deploy scripts, see [`deploy/README.md`](hbbc-webpage/deploy/README.md)

## Deployment

See [`deploy/README.md`](hbbc-webpage/deploy/README.md) for VPS setup and shipping updates (including tag-based auto-deploy).

## Contributors

- Joshua Hörtkorn (Vorsitzender)
- Moritz Hinderer (Stellvertretender Vorsitzender)
- Paul Otto Georg Lussier (Kassenwart)
- Roman Güven (Schriftführer)

## License

No license has been chosen yet — all rights reserved by default.

---

Open work is tracked in [GitHub Issues](https://github.com/MoritzHinderer/hbbc_webpage/issues), not in this file.
