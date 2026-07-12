#!/usr/bin/env bash
# Builds and (re)starts the app. Run this for the first deploy AND every
# time you want to ship new changes. Run as the 'hbbc' user, from
# anywhere (it cd's into the repo itself).
#
# Usage: bash hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh
set -euo pipefail

REPO_DIR="$HOME/hbbc_webpage"
APP_DIR="$REPO_DIR/hbbc-webpage"

if [ "$(id -un)" = "root" ]; then
  echo "Run this as the 'hbbc' user, not root (su - hbbc first)." >&2
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Expected a git checkout at $REPO_DIR — clone the repo there first." >&2
  exit 1
fi

echo "==> Pulling latest code"
cd "$REPO_DIR"
git pull

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env — copy .env.example, fill in real values, and re-run." >&2
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building frontend"
npm run build

echo "==> Restarting service"
sudo systemctl restart hbbc-webpage
sudo systemctl --no-pager status hbbc-webpage
