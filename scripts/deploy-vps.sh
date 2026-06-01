#!/usr/bin/env bash
set -euo pipefail

# Deploy Elevated Learning Hub to a VPS over SSH.
#
# Required:
#   VPS_HOST   — e.g. 203.0.113.10 or my.server.com
#
# Optional:
#   VPS_USER   — SSH user (default: root)
#   REMOTE_DIR — app directory on the VPS (default: /opt/elevated-learning-hub)
#   SSH_KEY    — path to private key (default: use ssh-agent / default key)
#
# Usage:
#   export VPS_HOST=203.0.113.10
#   ./scripts/deploy-vps.sh

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

: "${VPS_HOST:?Set VPS_HOST to your server hostname or IP}"

VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/opt/elevated-learning-hub}"
SSH_OPTS=(-o StrictHostKeyChecking=accept-new)
if [[ -n "${SSH_KEY:-}" ]]; then
  SSH_OPTS+=(-i "$SSH_KEY")
fi

RSYNC_SSH="ssh ${SSH_OPTS[*]}"
REMOTE="${VPS_USER}@${VPS_HOST}"

echo "→ Syncing project to ${REMOTE}:${REMOTE_DIR}"
rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude .env \
  -e "$RSYNC_SSH" \
  ./ "${REMOTE}:${REMOTE_DIR}/"

if [[ -f .env ]]; then
  echo "→ Uploading .env"
  scp "${SSH_OPTS[@]}" .env "${REMOTE}:${REMOTE_DIR}/.env"
else
  echo "→ No local .env; ensure ${REMOTE_DIR}/.env exists on the VPS"
fi

echo "→ Building and starting containers on VPS"
ssh "${SSH_OPTS[@]}" "$REMOTE" bash -s <<EOF
set -euo pipefail
cd "${REMOTE_DIR}"
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed on the VPS. Install Docker Engine first:"
  echo "  https://docs.docker.com/engine/install/"
  exit 1
fi
docker compose up -d --build
docker compose ps
EOF

echo "✓ Deployed. App should be on http://${VPS_HOST}:\${PORT:-3000} (or your reverse proxy)."
