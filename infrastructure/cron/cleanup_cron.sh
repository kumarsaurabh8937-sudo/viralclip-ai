#!/usr/bin/env bash
# ============================================================
# ViralClip AI — Cleanup Cron Script
# Triggers the backend cleanup endpoint to delete expired videos
# from Cloudflare R2 and mark jobs as expired in Firestore.
#
# Schedule this via system cron or a CI cron job:
#   0 2 * * * /path/to/cleanup_cron.sh >> /var/log/viralclip_cleanup.log 2>&1
#
# Environment variables (set in the environment or .env):
#   BACKEND_URL   — internal backend URL (default: http://localhost:8000)
#   ADMIN_SECRET  — must match the ADMIN_SECRET in backend/.env
# ============================================================

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
ADMIN_SECRET="${ADMIN_SECRET:-}"
ENDPOINT="${BACKEND_URL}/api/v1/admin/cleanup"
LOG_PREFIX="[ViralClip Cleanup $(date '+%Y-%m-%d %H:%M:%S UTC')]"

if [[ -z "$ADMIN_SECRET" ]]; then
  echo "${LOG_PREFIX} ERROR: ADMIN_SECRET is not set. Aborting."
  exit 1
fi

echo "${LOG_PREFIX} Triggering cleanup → ${ENDPOINT}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${ENDPOINT}" \
  -H "X-Admin-Secret: ${ADMIN_SECRET}" \
  -H "Content-Type: application/json" \
  --max-time 60)

HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "${LOG_PREFIX} SUCCESS (HTTP ${HTTP_CODE}): ${HTTP_BODY}"
else
  echo "${LOG_PREFIX} FAILED (HTTP ${HTTP_CODE}): ${HTTP_BODY}"
  exit 1
fi
