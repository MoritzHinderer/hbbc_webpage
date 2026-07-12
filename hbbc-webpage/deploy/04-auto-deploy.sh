#!/usr/bin/env bash
# Checks for a new version tag (vX.Y.Z) on the remote and, if found,
# deploys exactly that tagged commit — same build/restart steps as
# 02-deploy.sh, just tag-driven instead of following `main`. Meant to be
# run periodically by the hbbc-webpage-autodeploy.timer systemd unit, but
# safe to run by hand too (it's a no-op if already caught up).
#
# Usage: bash hbbc_webpage/hbbc-webpage/deploy/04-auto-deploy.sh
set -euo pipefail

REPO_DIR="$HOME/hbbc_webpage"
APP_DIR="$REPO_DIR/hbbc-webpage"
STATE_FILE="$HOME/.hbbc-deployed-tag"

if [ "$(id -un)" = "root" ]; then
  echo "Run this as the 'hbbc' user, not root (su - hbbc first)." >&2
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Expected a git checkout at $REPO_DIR — clone the repo there first." >&2
  exit 1
fi

cd "$REPO_DIR"
git fetch --tags --quiet

# Only ever consider real version tags (vX.Y.Z), sorted by version order
# (not creation date or alphabetically) — an unrelated tag can't
# accidentally trigger a deploy.
LATEST_TAG="$(git tag -l 'v[0-9]*.[0-9]*.[0-9]*' | sort -V | tail -1)"

if [ -z "$LATEST_TAG" ]; then
  echo "No version tags found yet — nothing to deploy."
  exit 0
fi

DEPLOYED_TAG="$(cat "$STATE_FILE" 2>/dev/null || echo '')"

if [ "$LATEST_TAG" = "$DEPLOYED_TAG" ]; then
  # Already up to date — quiet on purpose so hourly timer runs don't spam
  # the journal when there's nothing to do.
  exit 0
fi

echo "==> New version detected: $LATEST_TAG (currently deployed: ${DEPLOYED_TAG:-none})"
git checkout "$LATEST_TAG"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env — aborting deploy of $LATEST_TAG." >&2
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building frontend"
npm run build

echo "==> Restarting service"
sudo /usr/local/bin/hbbc-webpage-ctl restart
sudo /usr/local/bin/hbbc-webpage-ctl status

# Only record success once the service has actually restarted on the new
# build — if npm ci/npm run build failed above, `set -e` already aborted
# before this line, so the state file still points at the last good tag
# and the next timer run retries $LATEST_TAG instead of skipping it.
echo "$LATEST_TAG" > "$STATE_FILE"
echo "==> Deployed $LATEST_TAG successfully."
