#!/usr/bin/env bash
# ONE-TIME migration script — run this exactly once on the VPS, instead
# of a plain `git pull`, the first time you deploy the update that stops
# git-tracking public/downloads/downloads.json.
#
# Why this exists: public/downloads/downloads.json was accidentally left
# git-tracked when server/content/ and public/members/ were untracked
# (see 03-migrate-content-tracking.sh) — same risk: a deploy runs
# `git pull`, and if this file has since diverged from git's tracked
# version (e.g. an admin uploaded/edited downloads through the live site),
# a plain `git pull` would abort with "local changes would be
# overwritten" and block the deploy. If it hasn't diverged, `git pull`
# would instead silently delete it from the working tree.
#
# This script backs up the live file first, removes the local copy (so
# the pull can never conflict with it), pulls, then restores it from the
# backup — safe regardless of whether it has diverged or not.
set -euo pipefail

REPO_DIR="$HOME/hbbc_webpage"
APP_DIR="$REPO_DIR/hbbc-webpage"
BACKUP_FILE="$HOME/pre-untrack-downloads-json-backup.json"

if [ "$(id -un)" = "root" ]; then
  echo "Run this as the 'hbbc' user, not root." >&2
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Expected a git checkout at $REPO_DIR." >&2
  exit 1
fi

cd "$APP_DIR"

echo "==> Backing up live public/downloads/downloads.json to $BACKUP_FILE"
cp public/downloads/downloads.json "$BACKUP_FILE" 2>/dev/null || echo "(no existing file to back up — continuing)"

echo "==> Removing local copy (safely backed up above, if it existed)"
rm -f public/downloads/downloads.json

echo "==> Pulling latest code"
cd "$REPO_DIR"
git pull

echo "==> Restoring downloads.json from backup"
cd "$APP_DIR"
mkdir -p public/downloads
if [ -f "$BACKUP_FILE" ]; then
  cp "$BACKUP_FILE" public/downloads/downloads.json
else
  echo '{"downloads": []}' > public/downloads/downloads.json
fi

echo "==> Done. Your downloads manifest is intact; backup preserved at $BACKUP_FILE just in case."
echo "==> Now run the regular deploy script to build and restart:"
echo "    bash ~/hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh"
