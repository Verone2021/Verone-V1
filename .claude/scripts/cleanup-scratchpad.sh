#!/bin/bash
# cleanup-scratchpad.sh
#
# Archivage automatique des scratchpads selon l'age et le type.
# Inspire des pratiques Google/Meta : ephemeral artifacts auto-cleaned.
#
# Regles :
#   - dev-plan-*, dev-report-*, verify-report-*, review-report-* > 14 jours  -> archive
#   - session-*.md, *.prompt.md > 30 jours -> archive
#   - archive/ > 90 jours -> SUPPRIME definitivement
#   - audits, post-mortems, protocoles -> PROMOTION vers docs/current/
#
# Lance automatiquement apres merge PR (hook post-merge).
# Peut etre lance manuellement : bash .claude/scripts/cleanup-scratchpad.sh

SCRATCHPAD="$CLAUDE_PROJECT_DIR/docs/scratchpad"
ARCHIVE_ROOT="$SCRATCHPAD/archive"
CURRENT_MONTH=$(date +%Y-%m)
ARCHIVE_DIR="$ARCHIVE_ROOT/$CURRENT_MONTH"

if [ ! -d "$SCRATCHPAD" ]; then
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"

ARCHIVED=0
DELETED=0
PROMOTED=0

# ---- 1. ARCHIVE : fichiers courts lived > 14 jours ----
# dev-plan, dev-report, verify-report, review-report
for pattern in "dev-plan-*" "dev-report-*" "verify-report-*" "review-report-*" "deploy-report-*"; do
  find "$SCRATCHPAD" -maxdepth 1 -name "$pattern" -type f -mtime +14 2>/dev/null | while read -r file; do
    mv "$file" "$ARCHIVE_DIR/" 2>/dev/null && ARCHIVED=$((ARCHIVED+1))
  done
done

# ---- 2. ARCHIVE : session reports > 30 jours ----
find "$SCRATCHPAD" -maxdepth 1 -name "session-*" -type f -mtime +30 2>/dev/null | while read -r file; do
  mv "$file" "$ARCHIVE_DIR/" 2>/dev/null && ARCHIVED=$((ARCHIVED+1))
done

# ---- 3. SUPPRESSION : archives > 90 jours ----
if [ -d "$ARCHIVE_ROOT" ]; then
  find "$ARCHIVE_ROOT" -type f -mtime +90 -delete 2>/dev/null
  # Supprimer les dossiers mois vides
  find "$ARCHIVE_ROOT" -type d -empty -delete 2>/dev/null
fi

# ---- 4. ALERTE PROMOTION : audits importants a migrer manuellement ----
# On ne deplace PAS automatiquement, on alerte. Les audits sont souvent
# des references metier qu'il faut relire avant de promouvoir.
PROMOTION_CANDIDATES=$(find "$SCRATCHPAD" -maxdepth 1 -type f \( -name "audit-*" -o -name "post-mortem-*" -o -name "protocole-*" -o -name "decision-*" \) -mtime +7 2>/dev/null | head -5)

if [ -n "$PROMOTION_CANDIDATES" ]; then
  echo ""
  echo "📋 CANDIDATS A PROMOUVOIR vers docs/current/ (relire puis deplacer) :"
  echo "$PROMOTION_CANDIDATES" | while read -r file; do
    echo "   - $(basename "$file")"
  done
  echo ""
fi

# ---- 5. Rapport ----
REMAINING=$(find "$SCRATCHPAD" -maxdepth 1 -type f -name "*.md" ! -name "README.md" 2>/dev/null | wc -l | tr -d ' ')
ARCHIVED_TOTAL=$(find "$ARCHIVE_ROOT" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')

echo "🧹 Scratchpad cleanup : $REMAINING fichiers actifs, $ARCHIVED_TOTAL en archive."

exit 0
