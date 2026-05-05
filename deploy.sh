#!/usr/bin/env bash
set -euo pipefail

# ---- Configuration ----
DEPLOY_DIR="/opt/webhook3"
SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=9089
LOG_FILE="${DEPLOY_DIR}/server.log"

echo "=== Deploying webhook3 ==="
echo "Source:  ${SRC_DIR}"
echo "Target:  ${DEPLOY_DIR}"

# ---- 1. Kill existing server process on port 9089 ----
echo ""
echo "[1/4] Stopping existing server..."
PIDS=$(lsof -ti tcp:${PORT} 2>/dev/null || fuser ${PORT}/tcp 2>/dev/null | tr -s ' ' '\n' || true)
if [ -n "$PIDS" ]; then
  echo "  Found process(es) on port ${PORT}: $(echo $PIDS | tr '\n' ' ')"
  # Graceful kill
  echo $PIDS | xargs kill 2>/dev/null || true
  # Wait up to 5 seconds for graceful shutdown
  for i in $(seq 1 10); do
    REMAINING=$(lsof -ti tcp:${PORT} 2>/dev/null || fuser ${PORT}/tcp 2>/dev/null | tr -s ' ' '\n' || true)
    if [ -z "$REMAINING" ]; then
      break
    fi
    sleep 0.5
  done
  # Force kill if still running
  REMAINING=$(lsof -ti tcp:${PORT} 2>/dev/null || fuser ${PORT}/tcp 2>/dev/null | tr -s ' ' '\n' || true)
  if [ -n "$REMAINING" ]; then
    echo "  Force killing remaining process(es)"
    echo $REMAINING | xargs kill -9 2>/dev/null || true
  fi
  echo "  Server stopped."
else
  echo "  No server running on port ${PORT}."
fi

# ---- 2. Sync files (preserve node_modules) ----
echo ""
echo "[2/4] Syncing files to ${DEPLOY_DIR}..."
rsync -av --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'deploy.sh' \
  --exclude 'codes_*.csv' \
  --exclude '*.log' \
  --exclude '*.tex' \
  --exclude 'README.md' \
  --exclude 'WhatsApp Group UI Design' \
  --exclude 'WhatsApp Chat with Family.txt' \
  --exclude '_chat.txt' \
  --exclude 'scripts/' \
  "${SRC_DIR}/" "${DEPLOY_DIR}/"
echo "  Files synced."

# ---- 3. Verify node_modules exist ----
echo ""
echo "[3/4] Checking dependencies..."
if [ ! -d "${DEPLOY_DIR}/node_modules/express" ]; then
  echo "  ERROR: node_modules missing in ${DEPLOY_DIR}."
  echo "  Run: cd ${DEPLOY_DIR} && npm install express compression mongodb"
  exit 1
fi
echo "  Dependencies OK."

# ---- 4. Start new server ----
echo ""
echo "[4/4] Starting server..."
cd "${DEPLOY_DIR}"
nohup node server.js >> "${LOG_FILE}" 2>&1 &
NEW_PID=$!
sleep 1

# Verify it started
if kill -0 "$NEW_PID" 2>/dev/null; then
  echo "  Server started (PID: ${NEW_PID})"
  echo "  Logs: ${LOG_FILE}"
  echo ""
  echo "=== Deploy complete ==="
else
  echo "  ERROR: Server failed to start. Check ${LOG_FILE}"
  tail -20 "${LOG_FILE}"
  exit 1
fi
