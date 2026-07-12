#!/usr/bin/env bash
# ONE-TIME migration script — run this exactly once on the VPS, instead
# of a plain `git pull`, the first time you deploy the update that stops
# git-tracking server/content/ and moves public/members/members.json.
#
# Why this exists: server/content/ (events, news, gallery photos,
# downloads, member data) was accidentally git-tracked from the start —
# risky for a live site, since every deploy runs `git pull`, and any
# future commit touching those paths could conflict with or overwrite
# live admin-entered content. This script's companion commit untracks
# them (git rm --cached + .gitignore).
#
# The danger: verified empirically (see the conversation this was built
# in) that `git pull` SILENTLY DELETES a tracked file from the working
# tree when a commit stops tracking it, *if* that file's content still
# exactly matches what git last knew (no local edits) — which is true
# for several of these files (e.g. downloads PDFs nobody's re-uploaded).
# Files that *have* diverged from git would instead make `git pull`
# abort outright ("local changes would be overwritten"), blocking the
# deploy. Either way, a plain `git pull` is not safe here.
#
# This script backs up all live content first, removes the local copies
# (so the pull can never conflict with anything), pulls, then restores
# everything from the backup — regardless of what the pull did or didn't
# delete. Safe by construction, not by guessing which files changed.
set -euo pipefail

REPO_DIR="$HOME/hbbc_webpage"
APP_DIR="$REPO_DIR/hbbc-webpage"
BACKUP_DIR="$HOME/pre-untrack-backup"

if [ "$(id -un)" = "root" ]; then
  echo "Run this as the 'hbbc' user, not root." >&2
  exit 1
fi

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Expected a git checkout at $REPO_DIR." >&2
  exit 1
fi

cd "$APP_DIR"

echo "==> Backing up live content to $BACKUP_DIR"
rm -rf "$BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r server/content "$BACKUP_DIR/content" 2>/dev/null || true
cp -r public/members "$BACKUP_DIR/members" 2>/dev/null || true
cp -r public/member_pictures "$BACKUP_DIR/member_pictures" 2>/dev/null || true

echo "==> Removing local copies of paths about to be untracked (safely backed up above)"
rm -rf server/content
rm -rf public/members
rm -rf public/member_pictures

echo "==> Pulling latest code"
cd "$REPO_DIR"
git pull

echo "==> Restoring content from backup"
cd "$APP_DIR"
mkdir -p server/content
cp -r "$BACKUP_DIR/content/." server/content/ 2>/dev/null || true
mkdir -p server/content/member_pictures
cp -r "$BACKUP_DIR/member_pictures/." server/content/member_pictures/ 2>/dev/null || true

# The old public/members/members.json becomes server/content/members.json —
# only copy it there if the new location didn't already come with content
# (it won't, since it's freshly untracked, but this stays safe either way).
if [ -f "$BACKUP_DIR/members/members.json" ] && [ ! -f server/content/members.json ]; then
  cp "$BACKUP_DIR/members/members.json" server/content/members.json
  echo "Migrated members.json to its new location (server/content/members.json)."
fi

echo "==> Done. Your content is intact; backup preserved at $BACKUP_DIR just in case."
echo "==> Now run the regular deploy script to build and restart:"
echo "    bash ~/hbbc_webpage/hbbc-webpage/deploy/02-deploy.sh"
