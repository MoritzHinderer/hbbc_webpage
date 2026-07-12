#!/usr/bin/env bash
# One-time bootstrap for a fresh Ubuntu 24.04 VPS. Run once as root
# (e.g. straight after first SSH login): `bash 01-server-setup.sh`
#
# Installs Node.js 24 (matches the dev environment this app was built in
# — required for node:sqlite, see server/db.ts), nginx, certbot, and git;
# creates a dedicated non-root user to actually run the app; opens the
# firewall for SSH/HTTP/HTTPS only.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Run this as root (e.g. via sudo)." >&2
  exit 1
fi

echo "==> Updating system packages"
apt-get update
apt-get upgrade -y

echo "==> Installing base packages (nginx, certbot, git, build tools)"
apt-get install -y nginx certbot python3-certbot-nginx git build-essential ufw

echo "==> Installing Node.js 24.x (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y nodejs
node --version
npm --version

echo "==> Creating dedicated 'hbbc' user to run the app (no root needed)"
if ! id -u hbbc >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" hbbc
fi

# Narrow, passwordless sudo — only for restarting/checking this one
# service, so deploy/02-deploy.sh can restart the app after a build
# without the 'hbbc' user having any broader root access.
echo "==> Granting 'hbbc' passwordless sudo for just this service"
cat > /etc/sudoers.d/hbbc-webpage <<'EOF'
hbbc ALL=(root) NOPASSWD: /bin/systemctl restart hbbc-webpage, /bin/systemctl status hbbc-webpage
EOF
chmod 440 /etc/sudoers.d/hbbc-webpage
visudo -cf /etc/sudoers.d/hbbc-webpage

echo "==> Configuring firewall (SSH + HTTP + HTTPS only)"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Done. Next steps (see deploy/README.md):"
echo "  1. su - hbbc"
echo "  2. git clone <your repo url> hbbc_webpage"
echo "  3. Create hbbc_webpage/hbbc-webpage/.env (see .env.example)"
echo "  4. Run deploy/02-deploy.sh (as hbbc) for the first build + start"
echo "  5. Install the nginx config + systemd service (as root, see README)"
echo "  6. Run certbot for HTTPS"
