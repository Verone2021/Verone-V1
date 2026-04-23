#!/bin/bash
# cleanup-scratchpad.sh
#
# Archivage automatique des scratchpads selon l'age et le type.
# Inspire des pratiques Google/Meta : ephemeral artifacts auto-cleaned.
# Source de verite de la convention : docs/scratchpad/README.md + ADR-014.
#
# Regles :
#   - Pipeline agent > 14 jours (dev-plan, dev-report, verify-report, review-report, deploy-report) -> archive
#   - Prefixes secondaires > 14 jours (rapport, bug, fix, handoff, plan, diagnostic, cleanup, CLAUDE-*proposed) -> archive
#   - session-*.md > 30 jours -> archive
#   - archive/ > 90 jours -> SUPPRIME definitivement
#   - Candidats promotion vers docs/current/ (audit, post-mortem, protocole, decision, dette, coherence, documentation) > 7 jours -> ALERTE
#
# Lance automatiquement :
#   - Apres Bash(gh pr merge*) via hook PostToolUse dans .claude/settings.json
#   - Apres Bash(git push*) via hook PostToolUse dans .claude/settings.json
# Peut etre lance manuellement : bash .claude/scripts/cleanup-scratchpad.sh

# Fallback si CLAUDE_PROJECT_DIR n'est pas defini (lance hors Claude Code)
if [ -z "$CLAUDE_PROJECT_DIR" ]; then
  CLAUDE_PROJECT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi

SCRATCHPAD="$CLAUDE_PROJECT_DIR/docs/scratchpad"
ARCHIVE_ROOT="$SCRATCHPAD/archive"
CURRENT_MONTH=$(date +%Y-%m)
ARCHIVE_DIR="$ARCHIVE_ROOT/$CURRENT_MONTH"

if [ ! -d "$SCRATCHPAD" ]; then
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"

ARCHIVED=0

# ---- 1. ARCHIVE : fichiers courts lived > 14 jours ----
# Pipeline agent + prefixes secondaires autorises (cf docs/scratchpad/README.md)
PATTERNS_14D=(
  "dev-plan-*"
  "dev-report-*"
  "verify-report-*"
  "review-report-*"
  "deploy-report-*"
  "rapport-*"
  "bug-*"
  "fix-*"
  "handoff-*"
  "plan-*"
  "diagnostic-*"
  "cleanup-*"
  "CLAUDE-*proposed*"
)

for pattern in "${PATTERNS_14D[@]}"; do
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    mv "$file" "$ARCHIVE_DIR/" 2>/dev/null && ARCHIVED=$((ARCHIVED + 1))
  done < <(find "$SCRATCHPAD" -maxdepth 1 -name "$pattern" -type f -mtime +14 2>/dev/null)
done

# ---- 2. ARCHIVE : session reports > 30 jours ----
while IFS= read -r file; do
  [ -z "$file" ] && continue
  mv "$file" "$ARCHIVE_DIR/" 2>/dev/null && ARCHIVED=$((ARCHIVED + 1))
done < <(find "$SCRATCHPAD" -maxdepth 1 -name "session-*" -type f -mtime +30 2>/dev/null)

# ---- 3. SUPPRESSION : archives > 90 jours ----
if [ -d "$ARCHIVE_ROOT" ]; then
  find "$ARCHIVE_ROOT" -type f -mtime +90 -delete 2>/dev/null
  find "$ARCHIVE_ROOT" -type d -empty -delete 2>/dev/null
fi

# ---- 4. ALERTE PROMOTION : candidats a promouvoir vers docs/current/ ----
PROMOTION_CANDIDATES=$(find "$SCRATCHPAD" -maxdepth 1 -type f \
  \( -name "audit-*" \
  -o -name "post-mortem-*" \
  -o -name "protocole-*" \
  -o -name "decision-*" \
  -o -name "dette-*" \
  -o -name "coherence-*" \
  -o -name "documentation-*" \
  \) -mtime +7 2>/dev/null | head -10)

if [ -n "$PROMOTION_CANDIDATES" ]; then
  echo ""
  echo "CANDIDATS A PROMOUVOIR vers docs/current/ (relire puis deplacer) :"
  echo "$PROMOTION_CANDIDATES" | while read -r file; do
    echo "   - $(basename "$file")"
  done
  echo "   -> Deplacer avec: git mv <file> docs/current/<domaine>/"
  echo ""
fi

# ---- 5. ALERTE PREFIXES NON-STANDARDS ----
UNKNOWN_PREFIX=$(find "$SCRATCHPAD" -maxdepth 1 -type f -name "*.md" \
  ! -name "README.md" \
  ! -name "dev-plan-*" ! -name "dev-report-*" \
  ! -name "verify-report-*" ! -name "review-report-*" ! -name "deploy-report-*" \
  ! -name "rapport-*" ! -name "bug-*" ! -name "fix-*" ! -name "handoff-*" \
  ! -name "plan-*" ! -name "diagnostic-*" ! -name "cleanup-*" \
  ! -name "session-*" ! -name "audit-*" ! -name "post-mortem-*" \
  ! -name "protocole-*" ! -name "decision-*" ! -name "dette-*" \
  ! -name "coherence-*" ! -name "documentation-*" \
  ! -name "CLAUDE-*" \
  2>/dev/null | head -5)

if [ -n "$UNKNOWN_PREFIX" ]; then
  echo ""
  echo "ATTENTION : fichiers avec prefixe non-standard (cf docs/scratchpad/README.md) :"
  echo "$UNKNOWN_PREFIX" | while read -r file; do
    echo "   - $(basename "$file")"
  done
  echo "   -> Renommer avec un prefixe autorise ou deplacer vers docs/current/"
  echo ""
fi

# ---- 6. Rapport ----
REMAINING=$(find "$SCRATCHPAD" -maxdepth 1 -type f -name "*.md" ! -name "README.md" 2>/dev/null | wc -l | tr -d ' ')
ARCHIVED_TOTAL=$(find "$ARCHIVE_ROOT" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

echo "Scratchpad cleanup : $REMAINING fichiers actifs, $ARCHIVED_TOTAL en archive. (archives ce run : $ARCHIVED)"

exit 0
