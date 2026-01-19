#!/usr/bin/env bash
# ==============================================================================
# session-token-report.sh - Wrapper de compatibilité (Stop hook)
# ==============================================================================
# Ce script est appelé par Claude Code à la fin d'une session (Stop hook).
# Il délègue au script réel si présent, sinon skip proprement.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TARGET="$PROJECT_ROOT/scripts/claude/session-token-report.sh"

# Si le script cible existe, l'appeler
if [ -f "$TARGET" ] && [ -x "$TARGET" ]; then
  exec "$TARGET" "$@"
fi

# Sinon, log et exit proprement
echo "[session-token-report] SKIP: $TARGET not found or not executable" >&2
exit 0
