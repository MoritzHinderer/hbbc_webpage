# Deploying to the IONOS VPS

One-time setup to get `hbbc-fanclub.de` running on the VPS (IONOS VPS
Linux S+, Ubuntu 24.04), plus how to ship future updates.

The app runs as **one process**: `npm start` serves both the built
frontend and `/api/*` together (see `server/index.ts`), on port 3001
internally. nginx sits in front of it for TLS and the public :80/:443
ports. SQLite (`server/data/`) and all uploaded content (gallery photos,
downloads, member pictures, news images) live on the VPS's own disk under
the app's checkout — nothing ephemeral, nothing to configure for that.

## 0. Prerequisites

- The VPS is booked and running; you have its **public IP address** and
  root SSH access (IONOS emails/shows you this after provisioning).
- The repo (`https://github.com/MoritzHinderer/hbbc_webpage`) is public,
  so no deploy keys or tokens are needed to clone it.

## 1. First login — system setup (as root)

```bash
ssh root@<VPS_IP>

curl -fsSL https://raw.githubusercontent.com/MoritzHinderer/hbbc_webpage/main/hbbc-webpage/deploy/01-server-setup.sh -o setup.sh
bash setup.sh
```

This installs Node.js 24, nginx, certbot, git, opens the firewall
(SSH/80/443 only), and creates a dedicated `hbbc` user to actually run the
app (never root) — with narrow, passwordless sudo scoped to *only*
restarting/checking the app's own systemd service.

## 2. Clone the app and configure secrets (as the `hbbc` user)

```bash
su - hbbc
git clone https://github.com/MoritzHinderer/hbbc_webpage.git
cp hbbc_webpage/hbbc-webpage/.env.example hbbc_webpage/hbbc-webpage/.env
nano hbbc_webpage/hbbc-webpage/.env   # fill in real SMTP_*/CONTACT_* values
```

Use the same SMTP credentials already configured in your local `.env` —
copy them over rather than retyping (they're not committed to git,
exactly so this step is manual).

## 3. First build + start (as `hbbc`)

```bash
bash ~/hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh
```

This runs `npm ci && npm run build`, then starts the app. It'll fail on
`systemctl restart` right now since the service isn't installed yet —
that's expected, continue to step 4, then re-run this script.

## 4. Install the systemd service (as root)

```bash
exit   # back to root
cp /home/hbbc/hbbc_webpage/hbbc-webpage/deploy/hbbc-webpage.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable hbbc-webpage
su - hbbc -c 'bash ~/hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh'
```

The last command re-runs the deploy script, which will now successfully
start the service. Check it's actually up:

```bash
curl http://127.0.0.1:3001/api/health   # {"ok":true}
```

## 5. Point DNS at the VPS

In the IONOS DNS panel for `hbbc-fanclub.de`, update the **A record**
for `@` (and `www`) to this VPS's public IP — see the earlier
conversation for exactly which entries to leave alone (all the
mail-related MX/SPF/DKIM/DMARC ones). Wait for propagation before
continuing (check with `dig hbbc-fanclub.de` or just try loading it).

## 6. nginx + HTTPS (as root)

```bash
cp /home/hbbc/hbbc_webpage/hbbc-webpage/deploy/nginx.conf /etc/nginx/sites-available/hbbc-fanclub.de
ln -s /etc/nginx/sites-available/hbbc-fanclub.de /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

certbot --nginx -d hbbc-fanclub.de -d www.hbbc-fanclub.de
```

Certbot rewrites the nginx config in place to add the HTTPS server block
and an HTTP→HTTPS redirect, and sets up automatic renewal. Requires DNS
(step 5) to already be pointing here — Let's Encrypt validates ownership
by fetching a file over plain HTTP from the domain.

## 7. Verify

Visit `https://hbbc-fanclub.de` — should load the real site, not a
static/broken shell. Log in, check `/admin`, confirm `/api/*` calls
succeed (no more 404s like the Deploy Now attempt had).

## One-time: migrating content out of git tracking

`server/content/` (events, news, gallery photos, downloads, member data)
and the old `public/members/members.json` were originally committed to
git by mistake — risky for a live site, since a deploy runs `git pull`,
and any future commit touching those paths could conflict with or
silently overwrite live admin-entered content. If you deployed before
this was fixed, run this **once**, in place of a normal deploy, to pick
up the fix safely:

```bash
bash ~/hbbc_webpage/hbbc-webpage/deploy/03-migrate-content-tracking.sh
bash ~/hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh
```

The first script backs up all live content, pulls, and restores it —
safe regardless of whether any individual file had been modified or not
(a plain `git pull` here can silently delete unmodified-but-newly-
untracked files — verified empirically before writing this). New
deploys after this one-time step are back to just `02-deploy.sh`.

## Shipping future updates

From then on, every update is just:

```bash
su - hbbc -c 'bash ~/hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh'
```

Pulls latest `main`, rebuilds, restarts the service. SQLite data and all
uploaded content are untouched (they're gitignored, so `git pull` never
touches them).

## Troubleshooting

**`sudo: a password is required` when `02-deploy.sh` tries to restart the
service.** The `hbbc` user has no password at all (created with
`--disabled-password`), so if the passwordless sudo rule isn't matching
for any reason, there's no password you can type to get past it — this
means `01-server-setup.sh` didn't finish installing
`/usr/local/bin/hbbc-webpage-ctl` and its sudoers rule correctly (or ran
an older version of this script). Re-run just that part as root:

```bash
cat > /usr/local/bin/hbbc-webpage-ctl <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
case "${1:-}" in
  restart) exec systemctl restart hbbc-webpage ;;
  status) exec systemctl --no-pager status hbbc-webpage ;;
  *) echo "Usage: hbbc-webpage-ctl {restart|status}" >&2; exit 1 ;;
esac
EOF
chmod 755 /usr/local/bin/hbbc-webpage-ctl
chown root:root /usr/local/bin/hbbc-webpage-ctl

cat > /etc/sudoers.d/hbbc-webpage <<'EOF'
hbbc ALL=(root) NOPASSWD: /usr/local/bin/hbbc-webpage-ctl
EOF
chmod 440 /etc/sudoers.d/hbbc-webpage
visudo -cf /etc/sudoers.d/hbbc-webpage
```

(Earlier versions of this script granted sudo on `systemctl restart
hbbc-webpage` directly — sudoers matches the full command *and its exact
arguments*, which is fragile. The fixed-path wrapper above sidesteps
that entirely.)
