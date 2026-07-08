# HBBC Webpage

<div align="center">
  <img src="hbbc-webpage/src/assets/hbbc_logo.png" alt="HBBC Logo" width="200"/>
</div>

Official website for the **Hamburger Böblinger Banausenchor und VFB Fanclub** (HBBC) - an official fanclub of VfB Stuttgart.

## 🌐 About HBBC

HBBC is an interregional fanclub that brings together passionate VfB Stuttgart supporters from Hamburg and the Böblingen region. The club combines friendship, music, and football passion in a welcoming community.

**Key Values:**
- Open and inclusive community
- Respect and tolerance
- Support for VfB Stuttgart
- Music and singing traditions
- Interregional connection

## 🚀 Features

- **Modern Responsive Design** - Beautiful UI with gradient backgrounds and glass morphism effects
- **Home Page** - Parallax scrolling hero section, animated member/founding-year stats, and a testimonials carousel drawn from member bios
- **Members Page** - Display all club members with their photos, roles, and joining dates, a membership-growth chart, and a map of where members are based. Includes a call-to-action card to join the club
- **Events/Termine** - Two tabs: VfB Stuttgart's full official match schedule with live/final scores, auto-fetched and public to everyone; and 🔒 Fanclub-Termine (admin-managed meetups, with .ics calendar export, members only)
- **Gallery/Galerie** 🔒 - Photo gallery grouped into member-creatable albums, with a Swiper-powered slideshow (coverflow transitions + autoplay). Members can upload photos (queued for admin approval before going live); admins moderate uploads and manage albums (members only)
- **Accounts & Admin approval** - Visitors can request an account; a club admin approves/rejects requests in an in-site dashboard (`/admin`) before Events/Gallery become accessible
- **Admin content management** - The `/admin` dashboard also lets admins create/edit/delete Members (with photo upload), Events, Gallery photos, and Downloads directly on the site — no more hand-editing JSON files or dropping files into folders
- **Downloads** - Easily accessible download section for important documents (member application forms, club info)
- **Contact/Kontakt** - Contact form that emails the club via the backend below
- **Newsletter** - Registered members opt in from `/profile`; admins compose a branded HTML newsletter with a WYSIWYG editor at `/admin` (Newsletter tab), send a test to themselves, then send to all subscribers, with a send history
- **Navigation Bar** - Modern navbar with smooth animations and active route detection
- **Mobile Friendly** - Fully responsive design for tablets and mobile devices
- **Network Access** - Access from any device on the same network using your computer's IP

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS v4** - Utility-first CSS framework with modern PostCSS integration
- **Vue Router** - Client-side routing (lazy-loaded routes)
- **Vite** - Next-generation frontend build tool
- **Headless UI** - Unstyled accessible components
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Chart.js** - Membership growth chart
- **Leaflet + OpenStreetMap** - Member location map (no API key required)
- **Swiper** - Gallery slideshow (coverflow transitions, autoplay/"Diashow" toggle)
- **OpenLigaDB** - Free, keyless public API for VfB Stuttgart's match schedule + live/final scores on the Termine page
- **Express + Nodemailer** - Small backend for the contact form, newsletter, and account system (`server/`)
- **`node:sqlite`** - Node's built-in SQLite module for user accounts/sessions/newsletter history — no database server or extra dependency needed
- **`node:crypto`** - Password hashing (scrypt) and session tokens — no auth dependency needed either
- **Multer** - Handles the photo/PDF uploads in the admin content-management API
- **Tiptap** - WYSIWYG rich-text editor for composing newsletters (admin-only, no markdown/HTML knowledge required)

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

## 🎯 Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd hbbc_webpage/hbbc-webpage
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure the backend (optional, for contact form + newsletter):**
   ```bash
   cp .env.example .env
   # then fill in SMTP_HOST / SMTP_USER / SMTP_PASS / CONTACT_TO_EMAIL
   ```
   Without a configured `.env`, the contact form and newsletter sending still
   work end-to-end in dev — submissions/sends are just logged to the server
   console instead of emailed.

4. **Start the development server (frontend + backend):**
   ```bash
   npm run dev:all
   ```
   Or run them separately: `npm run dev` (frontend only, Vite) and `npm run server` (backend only, Express).

5. **Open in browser:**
   - Local: `http://localhost:5173`
   - Network: Check terminal output for network URL

## 📱 Network Access (iPad & Other Devices)

To access the webpage from another device on the same network:

1. **Find your computer's IP address:**
   ```bash
   hostname -I  # Linux/Mac
   ipconfig     # Windows
   ```

2. **On the other device, open:**
   ```
   http://YOUR_IP_ADDRESS:5173
   ```
   Replace `YOUR_IP_ADDRESS` with the IP from step 1.

**Example:** `http://192.168.1.100:5173`

## 📦 Build for Production

```bash
npm run build
```

Generated files will be in the `dist/` folder.

Preview the frontend build only (no API routes):
```bash
npm run preview
```

To run the full app (static frontend + API) as one process, e.g. on a VPS:
```bash
npm run build
npm start
```
`npm start` runs the Express server in production mode, which serves the
built `dist/` folder and the `/api/*` routes together on `PORT` (default 3001).

## 📁 Project Structure

```
hbbc-webpage/
├── src/
│   ├── components/
│   │   ├── NavBar.vue           # Navigation bar with route detection
│   │   ├── MembersChart.vue     # Membership growth chart (Chart.js)
│   │   ├── MembersMap.vue       # Member location map (Leaflet)
│   │   ├── StatsSection.vue     # Animated counter stats (Home)
│   │   ├── AnimatedCounter.vue  # Count-up-on-scroll number
│   │   ├── TestimonialsCarousel.vue # Rotating member quotes (Home)
│   │   └── admin/                # One component per Admin.vue tab
│   │       ├── AdminRequests.vue    # Approve/reject pending account requests
│   │       ├── AdminMembersUsers.vue # Manage users (role/status/delete) + member cards, and link them together
│   │       ├── AdminEvents.vue      # Create/edit/delete events
│   │       ├── AdminGallery.vue     # Upload/caption/delete gallery photos
│   │       ├── AdminDownloads.vue   # Upload/edit/delete downloadable docs
│   │       └── AdminNewsletter.vue  # Compose (Tiptap), preview, test-send, send-to-all, history
│   ├── views/
│   │   ├── Home.vue             # Home page with parallax hero section
│   │   ├── Downloads.vue        # Downloads page for documents
│   │   ├── Members.vue          # Members gallery with photos
│   │   ├── Events.vue           # VfB-Spiele: full season schedule + scores (public)
│   │   ├── ClubEvents.vue       # Fanclub-Termine: admin-managed meetups (members only)
│   │   ├── Gallery.vue          # Photo gallery with lightbox (members only)
│   │   ├── Contact.vue          # Contact form
│   │   ├── Login.vue            # Login form
│   │   ├── Register.vue         # Account request form
│   │   ├── Profile.vue          # Self-service: create/edit/delete your own member card
│   │   ├── Admin.vue            # Admin dashboard: tab shell over admin/*.vue
│   │   ├── NotFound.vue         # 404 page
│   │   └── Footer.vue           # Footer component
│   ├── router/
│   │   └── index.ts             # Vue Router configuration (lazy routes, auth guards)
│   ├── composables/
│   │   └── useIcsDownload.ts    # Shared .ics-file download helper (VfB-Spiele + Fanclub-Termine)
│   ├── auth.ts                   # Frontend auth state (currentUser, login/logout/register)
│   ├── App.vue                  # Root component
│   └── main.ts                  # Application entry point
├── server/                      # Express backend
│   ├── index.ts                 # App entrypoint (also serves dist/ in production)
│   ├── db.ts                    # SQLite (node:sqlite) setup + schema
│   ├── mailer.ts                # Nodemailer transport (plain text + HTML/CID)
│   ├── newsletter-template.ts   # Branded HTML email wrapper (logo, colors, footer)
│   ├── newsletter-migration.ts  # One-time migration of legacy JSON subscribers to users.newsletter_subscribed
│   ├── validation.ts            # Shared input validation
│   ├── content-store.ts         # Generic JSON-array read/write + id backfill
│   ├── members-shared.ts        # Member type + picture helpers, shared by admin + self-service routes
│   ├── gallery-shared.ts        # Photo/album types + read/write helpers, shared by admin + self-service gallery routes
│   ├── uploads.ts               # Multer configs (member pictures, gallery photos, downloads)
│   ├── auth/
│   │   ├── password.ts          # Password hashing (scrypt)
│   │   ├── session.ts           # Session tokens + cookie helpers
│   │   └── middleware.ts        # attachUser / requireAuth / requireAdmin
│   ├── routes/
│   │   ├── contact.ts
│   │   ├── auth.ts              # register/login/logout/me
│   │   ├── admin.ts             # list/approve/reject account requests
│   │   ├── admin-users.ts       # admin: list all users, change role/status, delete
│   │   ├── admin-members.ts     # admin CRUD for members.json + pictures
│   │   ├── admin-events.ts      # admin CRUD for events.json
│   │   ├── admin-gallery.ts     # admin: moderate pending photos, CRUD photos/albums
│   │   ├── admin-downloads.ts   # admin CRUD for downloads.json + files
│   │   ├── admin-newsletter.ts  # admin: subscribers/history/send
│   │   ├── profile.ts           # self-service: GET/POST/PUT/DELETE /api/profile/member (your own card) + PUT /api/profile/newsletter
│   │   ├── events.ts            # GET /api/events (requires login)
│   │   ├── vfb-matches.ts       # GET /api/vfb-matches — VfB Stuttgart's season fixtures + scores via OpenLigaDB (public)
│   │   ├── gallery.ts           # GET /api/gallery (approved only) + photos; member self-service upload/album creation
│   │   └── downloads.ts         # GET /api/downloads/:file (per-file conditional login)
│   ├── content/                 # Events/gallery/downloads data — NOT in public/,
│   │   │                        # only reachable through the routes above
│   │   ├── events.json
│   │   ├── gallery.json
│   │   ├── albums.json          # Gallery albums (member-creatable)
│   │   ├── gallery-photos/
│   │   └── downloads/           # The actual PDF files (manifest stays in public/, see below)
│   ├── assets/
│   │   └── hbbc-logo-email.png  # Email-safe PNG logo, embedded as a CID attachment
│   ├── scripts/
│   │   └── create-admin.ts      # One-off CLI to bootstrap the first admin
│   └── data/                    # Runtime data: app.db (gitignored)
├── scripts/
│   ├── optimize-images.mjs      # Re-run after replacing a source image in src/assets
│   └── generate-email-logo.mjs  # Re-run after replacing the logo, to regenerate server/assets/hbbc-logo-email.png
├── public/
│   ├── downloads/downloads.json # Downloads manifest (public; files themselves are not)
│   ├── member_pictures/         # Member photos (snake_case naming)
│   └── members/members.json     # Member data
├── index.html                   # HTML entry point
├── package.json                 # Dependencies
├── vite.config.ts              # Vite configuration (dev proxy to backend)
├── tailwind.config.js          # Tailwind CSS configuration
└── postcss.config.js           # PostCSS configuration
```

## 🎨 Design Features

- **Color Scheme**: Dark gray to deep burgundy gradient with red accents
- **Glass Morphism**: Frosted glass effect on cards and overlays
- **Parallax Scrolling**: Dynamic logo animation on the home page
- **Responsive Grid**: Adapts from 1 to 3 columns based on screen size
- **Smooth Animations**: Hover effects and transitions throughout
- **Modern Typography**: Clean, readable font hierarchy

## 📄 Member Data Structure

Manage members at `/admin` ("Mitglieder & Nutzer" tab) — add/edit/delete,
with an optional photo upload. That's the recommended way now; hand-editing
the file below still works too, it's just what the admin UI reads and writes.

Members are defined in `public/members/members.json`:

```json
{
  "member": [
    {
      "id": 1,
      "name": "Member Name",
      "role": "Position/Role",
      "joined": "YYYY-MM-DD",
      "about_me": "Bio/description",
      "location": "City name (optional, used for the member map)",
      "user_id": null
    }
  ]
}
```
`id` is used by the admin API to address a specific member for edit/delete;
if you hand-edit this file without one, the first admin request that reads
it will backfill ids automatically and save the file.

**Linking a card to a login (`user_id`):** a card can optionally be linked
to a `users` row, letting that person manage their own card at `/profile`
instead of only through admin. `user_id` is `null`/absent by default (an
admin-only card, same as before). An admin links/unlinks a card to a user
from the merged admin tab (`PUT /api/admin/members/:id/link`); a user with
no card yet can also create their own directly from `/profile`, which
links it to themselves automatically. Linked members can freely edit their
own `name`, `about_me`, `location`, and photo from `/profile` — `role`
(their official title) and `joined` stay admin-only, so a member can't
self-declare a title. Deleting a linked user account clears the link
(`user_id` back to `null`) rather than deleting the card — the public bio
survives, only the self-service ownership goes away.

**Member Pictures:**
- Uploaded automatically when you add/edit a member with a photo in `/admin`
- Or save manually in `/public/member_pictures/` using snake_case naming: `Member_Name.png` or `Member_Name.jpeg`
- Supports `.png`, `.jpeg`, `.jpg`, and `.webp` formats
- If no picture exists, a user icon placeholder is shown

**Member map:** `location` must match a city name known to `MembersMap.vue`'s
`CITY_COORDS` lookup (currently Hamburg, Böblingen, Stuttgart, Sindelfingen,
Berlin, München, Köln, Frankfurt). Add new cities there as needed.

## 📅 Events Data Structure

Manage events at `/admin` (Termine tab). Events and Gallery are members-only,
so their data lives in `server/content/` (not `public/`) and is served
through authenticated API routes rather than static files — see
[Backend / API](#-backend--api) below.

Events are defined in `server/content/events.json`:

```json
{
  "events": [
    {
      "id": 1,
      "title": "VfB Stuttgart vs. ...",
      "date": "YYYY-MM-DD",
      "time": "15:30",
      "location": "Optional venue",
      "type": "match",
      "description": "Optional description"
    }
  ]
}
```
`type` is `"match"` or `"meetup"`. Past events (by date/time) are shown in a
collapsed list; upcoming events show prominently with an "add to calendar" (.ics) button.
Like members, `id` is backfilled automatically if missing.

**VfB Stuttgart's full match schedule** lives on its own public page,
`/events` (Vue component `Events.vue`, nav label "VfB-Spiele") — separate
from `/fanclub-termine` (`ClubEvents.vue`, the admin-curated meetups above,
members only) — and needs no manual entry at all: `GET /api/vfb-matches`
fetches it from [OpenLigaDB](https://www.openligadb.de/) (a free, keyless public
API for German football) and returns every remaining league match for the
season, each with both teams' crests, the matchday, a computed `status`
(`upcoming` / `live` / `finished`, based on kickoff time), and current
`score` where available. Both top divisions (`bl1`/`bl2`) are checked so
this keeps working across relegation/promotion without a code change.
Responses are cached in memory for 10 minutes to avoid hitting the external
API on every page load; if OpenLigaDB is unreachable, the route degrades to
an empty list rather than breaking the page. This route is public — VfB's
match schedule is public sports data, unlike `/api/events` (the fanclub's
own meetups), which still requires login. Clicking a match card reveals an
"add to calendar" (.ics) button for it too, same as the Fanclub-Termine
events.

## 🖼️ Gallery Data Structure

Photos come from two places: admins uploading directly at `/admin` (Galerie
tab — auto-approved, no review needed), and members uploading from `/gallery`
itself (queued for admin approval before anyone else sees them). Either way,
photos land in `server/content/gallery.json`, with image files in
`server/content/gallery-photos/`:

```json
{
  "photos": [
    {
      "file": "matchday_2025.jpg",
      "caption": "Optional caption",
      "albumId": 1,
      "uploadedBy": 4,
      "status": "approved",
      "uploadedAt": "2026-07-08T20:17:55.017Z"
    }
  ]
}
```
Photos are keyed by `file` (already unique — uploads get a generated name),
not a numeric id. `albumId`/`uploadedBy`/`status`/`uploadedAt` are all
optional — photos from before this feature existed (or admin uploads) have
none of them and are treated as approved and ungrouped
(`server/gallery-shared.ts`'s `isApproved()`), so no data migration was
needed.

**Albums** are member-creatable groupings, stored in
`server/content/albums.json`:
```json
{ "albums": [{ "id": 1, "name": "Sommerfest 2026", "createdBy": 4, "createdAt": "2026-07-08T20:17:29.864Z" }] }
```
Any logged-in member can create a new album while uploading a photo (or pick
an existing one, or leave it ungrouped); admins can delete an album from
`/admin` — its photos become ungrouped ("Ohne Album") rather than being
deleted. The gallery page groups approved photos by album, and the
slideshow (Swiper, coverflow effect + an autoplay "Diashow" toggle) browses
through all of them in that same grouped order regardless of which
thumbnail was clicked.

**Moderation:** member uploads start as `status: "pending"` and are invisible
on `/gallery` until an admin approves them from `/admin` → Galerie →
"Ausstehende Fotos", which also shows who uploaded each one. Admin uploads
skip this entirely (`status: "approved"` immediately).

## 📥 Downloads Data Structure

Manage downloads at `/admin` (Downloads tab) — upload a PDF with a name and
description, edit metadata, replace the file, or delete it. A checkbox
("Nur für angemeldete Mitglieder") marks a document as members-only.

The manifest, `public/downloads/downloads.json`, stays public (so the list —
names and descriptions — is visible to everyone, including which documents
require login), but the actual PDF files live in `server/content/downloads/`
(not `public/`) and are only served through `GET /api/downloads/:file`,
which checks that specific file's `requiresAuth` flag against the current
session before sending it. This is the same reasoning as Events/Gallery:
a checkbox in the admin UI can't be the real security boundary if the file
itself is still sitting at a guessable public URL.

```json
{
  "downloads": [
    { "id": 1, "name": "Satzung 2025", "description": "Club Constitution (PDF)", "href": "/api/downloads/Satzung_2025.pdf", "requiresAuth": false }
  ]
}
```

## 🔗 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home.vue | Home page with club introduction |
| `/members` | Members.vue | Club members gallery |
| `/events` | Events.vue | VfB-Spiele: full match schedule + scores |
| `/fanclub-termine` | ClubEvents.vue | Fanclub-Termine 🔒 requires login |
| `/gallery` | Gallery.vue | Photo gallery 🔒 requires login |
| `/downloads` | Downloads.vue | Downloadable documents |
| `/contact` | Contact.vue | Contact form |
| `/login` | Login.vue | Log in |
| `/register` | Register.vue | Request an account |
| `/profile` | Profile.vue | Manage your own member card + newsletter subscription 🔒 requires login |
| `/admin` | Admin.vue | Manage account requests, users + member cards, events, gallery, downloads, newsletter 🔒 admin only |
| `*` | NotFound.vue | 404 page |

## 🎯 Available Scripts

- `npm run dev` - Start Vite dev server (frontend only)
- `npm run server` - Start the Express backend only (`tsx watch`)
- `npm run dev:all` - Start frontend + backend together (recommended for local dev)
- `npm run build` - Type-check and build the frontend for production
- `npm run preview` - Preview the production frontend build (no API)
- `npm start` - Run the Express server in production mode (serves `dist/` + `/api/*`)
- `npm run create-admin -- "Name" email password` - Bootstrap (or promote) an admin account — see [Accounts & Admin Approval](#-accounts--admin-approval)

## 📧 Backend / API

`server/` is a small Express app: the contact form, newsletter, and
the account system. Everything else on the site is static.

- `POST /api/contact` — `{ name, email, message }`, emails `CONTACT_TO_EMAIL` via Nodemailer, `replyTo` set to the sender.
- `POST /api/auth/register` — `{ name, email, password, message? }`, creates a `pending` account and emails `CONTACT_TO_EMAIL` so the admin knows to review it.
- `POST /api/auth/login` — `{ email, password }`, sets an httpOnly session cookie on success. Fails with a specific message if the account is still `pending` or was `rejected`.
- `POST /api/auth/logout`, `GET /api/auth/me` — end the session / check current login state.
- `GET /api/admin/requests`, `POST /api/admin/requests/:id/approve`, `POST /api/admin/requests/:id/reject` — admin-only, manage pending account requests.
- `GET /api/admin/users`, `PUT /api/admin/users/:id` (`{ role, status }`), `DELETE /api/admin/users/:id` — admin-only, manage every registered user regardless of status. `GET` includes each user's linked `memberCardId` (if any). An admin can't edit or delete their own account through this endpoint (avoids locking yourself out); use `npm run create-admin` to fix that class of mistake if it ever happens. Deleting a user clears (doesn't cascade-delete) any member card linked to them.
- `GET/POST /api/admin/members`, `PUT/DELETE /api/admin/members/:id` — admin-only CRUD for members, `POST`/`PUT` accept a multipart `picture` field. `PUT /api/admin/members/:id/link` (`{ user_id: number | null }`) attaches/detaches a card to/from a user account.
- `GET/POST/PUT/DELETE /api/profile/member` — login-only (any approved user, not admin-only); always scoped to `req.user.id` server-side, so there's no `:id` to tamper with. Lets a member create, view, edit, or delete their *own* card. `role` and `joined` aren't accepted here — they're admin-assigned via the routes above.
- `GET/POST /api/admin/events`, `PUT/DELETE /api/admin/events/:id` — admin-only CRUD for events.
- `GET/POST /api/admin/gallery`, `PUT/DELETE /api/admin/gallery/:file` — admin-only CRUD for gallery photos (`GET` includes pending ones + resolved `uploaderName`; `POST` accepts a multipart `photo` field and is auto-approved; `PUT` also accepts `albumId`). `POST /api/admin/gallery/:file/approve` — admin-only, approves a pending photo. `GET /api/admin/gallery/albums`, `DELETE /api/admin/gallery/albums/:id` — admin-only album visibility/cleanup (deleting one ungroups its photos, doesn't delete them).
- `GET/POST /api/admin/downloads`, `PUT/DELETE /api/admin/downloads/:id` — admin-only CRUD for downloadable documents, `POST`/`PUT` accept a multipart `file` field (PDF only) and a `requiresAuth` field (the members-only checkbox).
- `GET /api/admin/newsletter/subscribers` — admin-only, subscribed + approved users (id/name/email).
- `GET /api/admin/newsletter/history` — admin-only, past sends (subject, recipient count, timestamp).
- `POST /api/admin/newsletter/send` — admin-only, `{ subject, bodyHtml, testOnly? }`. Wraps `bodyHtml` (from the Tiptap editor) in the branded template and sends via Nodemailer with the club logo as a CID attachment. `testOnly: true` sends only to the calling admin's own address and isn't recorded in history; otherwise it sends to every subscribed + approved user and records one row in the `newsletters` table.
- `PUT /api/profile/newsletter` — login-only, `{ subscribed: boolean }`; toggles the current user's own subscription.
- `GET /api/events`, `GET /api/gallery`, `GET /api/gallery/photos/:file` — login-only; these read from `server/content/` (not `public/`), so the data is never reachable by URL without a valid session. `GET /api/gallery` only returns approved photos.
- `POST /api/gallery/photos` — login-only, multipart `photo` field + optional `caption`/`albumId`; any member's upload, always created as `status: "pending"`. `POST /api/gallery/albums` — login-only, `{ name }`; any member can create an album.
- `GET /api/vfb-matches` — public; VfB Stuttgart's season fixtures + scores, proxied from OpenLigaDB and cached in memory for 10 minutes.
- `GET /api/downloads/:file` — *not* blanket login-only like the two above; it looks up that specific file's `requiresAuth` flag in the (public) manifest and only requires a session if that flag is set. Public documents stay a one-hop download for everyone.
- `/api/contact` and `/api/auth/register` are rate-limited (5–10 requests / 15 min / IP); `/api/auth/login` gets a more generous 30 / 15 min since mistyped passwords are normal and shouldn't lock someone out.
- SMTP credentials go in `.env` (see `.env.example`); without them, mail-sending routes still respond successfully but just log what would have been sent.
- In dev, Vite proxies `/api/*` to `http://localhost:3001` (see `vite.config.ts`). In production, `npm start` serves the frontend and API from the same Express process.

## 👤 Accounts & Admin Approval

Anyone can request an account at `/register` (name, email, password, optional
message). The account starts `pending` and can't log in yet. An admin (or any
of the club officers, once promoted) reviews it at `/admin` and clicks
Freischalten (approve) or Ablehnen (reject). Approved users get an email and
can then log in and see `/events` and `/gallery`; rejected/pending users get a
clear message explaining why login failed, but no automatic rejection email
(the admin can follow up personally).

**Bootstrapping the first admin** — there's a chicken-and-egg problem
(you need an admin to approve accounts, but no accounts exist yet), solved
with a one-off CLI script:

```bash
npm run create-admin -- "Your Name" you@example.com yourpassword
```

Run it once per admin you want to create. Running it again with an email
that already has an account promotes that account to admin and marks it
approved, instead of erroring.

**Storage:** accounts and sessions live in `server/data/app.db`, a SQLite
database file using Node's built-in `node:sqlite` module — no separate
database server, no extra npm dependency. Passwords are hashed with
`node:crypto`'s `scrypt` (never stored in plain text); sessions are random
tokens in an httpOnly cookie, checked against the database on every request.
You'll see one `ExperimentalWarning: SQLite is an experimental feature...`
line in the server log on startup — this is expected and harmless, not an
error.

## 📧 Newsletter

Only registered accounts can subscribe — there's no anonymous signup. A
logged-in user toggles it themselves from `/profile`; an admin can see who's
subscribed in the `/admin` "Mitglieder & Nutzer" user list (a small badge per
user) and manages everything else about the newsletter from the dedicated
`/admin` "Newsletter" tab:

- **Compose** with a WYSIWYG editor ([Tiptap](https://tiptap.dev/)) —
  bold/italic/heading/lists/link buttons, no markdown or HTML knowledge
  needed. A live preview shows exactly what subscribers will receive,
  including the club's branded header (logo + colors) and footer.
- **Test-mail** sends the current draft only to the admin's own address
  before committing to a real send.
- **Send to all subscribers** requires confirming the exact recipient count
  first, then sends one-by-one (never CC/BCC) and records the send (subject,
  recipient count, timestamp) in a history list below the composer.

The club logo is embedded as a CID attachment (`server/assets/hbbc-logo-email.png`,
regenerate with `node scripts/generate-email-logo.mjs` after replacing the
source logo) rather than linked by URL, since most email clients can't fetch
`localhost`-hosted images and render WebP inconsistently.

If you're upgrading from before this feature existed: the old anonymous
footer signup list (`server/data/newsletter-subscribers.json`) is migrated
automatically on server startup — each stored email is matched against
existing `users` rows and marked subscribed, then the file is renamed to
`newsletter-subscribers.migrated.json` so this only happens once.

## ♿ Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast compliance
- Focus indicators on all interactive elements

## 🚀 Performance

- **Vite**: Lightning-fast cold start and hot module replacement
- **Vue 3**: Smaller bundle size with Composition API
- **Tailwind CSS v4**: Optimized CSS with PostCSS
- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: Proper handling of member photos

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

[Add your license here]

## 👥 Contributors

- Joshua Hörtkorn (Vorsitzender)
- Moritz Hinderer (Stellvertretender Vorsitzender)
- Paul Otto Georg Lussier (Kassenwart)
- Roman Güven (Schriftführer)

## 📞 Contact

For inquiries about HBBC, please contact through the website or email.

## 🔄 Development Workflow

1. Create a new branch for features
2. Make changes in development mode (`npm run dev`)
3. Test responsive design and cross-browser compatibility
4. Build and preview (`npm run build && npm run preview`)
5. Commit and push changes
6. Create pull request

## 🐛 Known Issues & Future Improvements

- [x] Add event calendar for upcoming matches and events
- [x] Implement animated counter stats on home page
- [x] Add member map showing geographic distribution
- [x] Create testimonials carousel
- [x] Add contact form
- [x] Implement newsletter signup
- [x] Add an account system (request → admin approval → login) gating Events/Gallery
- [x] Let the admin manage members/events/gallery/downloads from the website instead of hand-editing files
- [x] Admin newsletter composer (WYSIWYG, branded template, test-send, send history) with per-account opt-in
- [x] Auto-fetch VfB Stuttgart's full match schedule with live/final scores (OpenLigaDB) on the Termine page
- [x] Member gallery uploads with admin approval, member-creatable albums, and a Swiper-powered slideshow
- [ ] No automated tests or CI pipeline yet

## 🎓 Learning Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vue Router Documentation](https://router.vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)

---

**Made with ❤️ for the HBBC Community**
