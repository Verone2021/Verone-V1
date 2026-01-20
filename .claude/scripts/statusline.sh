#!/usr/bin/env bash
# ==============================================================================
# statusline.sh - Wrapper pour Claude Code statusline
# ==============================================================================
# Ce wrapper délègue au script réel dans scripts/claude/
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

exec "$REPO_ROOT/scripts/claude/statusline-fixed.sh" "$@"
