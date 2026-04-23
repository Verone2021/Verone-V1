#!/bin/bash
# cleanup-scratchpad.sh
#
# Archivage automatique des scratchpads selon l'age et le type.
# Source de verite de la convention : docs/scratchpad/README.md + ADR-014.
#
# Regles :
#   - Pipeline agent > 14 jours (dev-plan, dev-report, verify-report, review-report, deploy-report) -> archive
#   - Prefixes secondaires > 14 jours (rapport, bug, fix, handoff, plan, diagnostic, cleanup, CLAUDE-*proposed) -> archive
#   - session-*.md > 30 jours -> archive
#   - archive/ > 90 jours -> SUPPRIME definitivement
#   - Candidats promotion vers docs/current/ (audit, post-mortem, protocole, decision, dette, coherence, documentation) > 7 jours -> ALERTE
#
# IMPORTANT : l'age est calcule depuis la DATE DANS LE NOM (YYYY-MM-DD), pas depuis
# le mtime filesystem. Raison : un `git rebase` ou `git pull` reset les mtimes de tous
# les fichiers tracked, ce qui ferait "rajeunir" artificiellement les vieux fichiers et
# casserait l'archivage. La date metier reste celle du nom.
#
# Lance automatiquement via hook PostToolUse (.claude/settings.json) apres :
#   - Bash(gh pr merge*)
#   - Bash(git push*)
# Peut etre lance manuellement : bash .claude/scripts/cleanup-scratchpad.sh

# Fallback si CLAUDE_PROJECT_DIR n'est pas defini
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

# Python inline : retourne l'age en jours calcule depuis la date YYYY-MM-DD
# trouvee dans le nom du fichier. Retourne -1 si pas de date dans le nom.
# Fallback sur mtime si aucune date trouvee.
age_days_from_name() {
  local filepath="$1"
  python3 - "$filepath" << 'PYEOF'
import os, re, sys
from datetime import datetime
filepath = sys.argv[1]
name = os.path.basename(filepath)
# Cherche YYYY-MM-DD dans le nom
m = re.search(r'(\d{4})-(\d{2})-(\d{2})', name)
if m:
    try:
        file_date = datetime.strptime('-'.join(m.groups()), '%Y-%m-%d')
        age = (datetime.now() - file_date).days
        print(age)
        sys.exit(0)
    except ValueError:
        pass
# Fallback mtime
try:
    mtime = os.path.getmtime(filepath)
    age = (datetime.now() - datetime.fromtimestamp(mtime)).days
    print(age)
except Exception:
    print(-1)
PYEOF
}

ARCHIVED=0

archive_if_old() {
  local pattern="$1"
  local threshold_days="$2"
  for file in "$SCRATCHPAD"/$pattern; do
    [ ! -f "$file" ] && continue
    age=$(age_days_from_name "$file")
    if [ -n "$age" ] && [ "$age" -gt "$threshold_days" ]; then
      mv "$file" "$ARCHIVE_DIR/" 2>/dev/null && ARCHIVED=$((ARCHIVED + 1))
    fi
  done
}

# ---- 1. ARCHIVE : pipeline agent + prefixes secondaires > 14 jours ----
PATTERNS_14D=(
  "dev-plan-*.md"
  "dev-report-*.md"
  "verify-report-*.md"
  "review-report-*.md"
  "deploy-report-*.md"
  "rapport-*.md"
  "bug-*.md"
  "fix-*.md"
  "handoff-*.md"
  "plan-*.md"
  "diagnostic-*.md"
  "cleanup-*.md"
  "CLAUDE-*proposed*.md"
)

for pattern in "${PATTERNS_14D[@]}"; do
  archive_if_old "$pattern" 14
done

# ---- 2. ARCHIVE : session reports > 30 jours ----
archive_if_old "session-*.md" 30

# ---- 3. SUPPRESSION : archives > 90 jours (mtime OK ici, archive/ est stable) ----
if [ -d "$ARCHIVE_ROOT" ]; then
  find "$ARCHIVE_ROOT" -type f -mtime +90 -delete 2>/dev/null
  find "$ARCHIVE_ROOT" -type d -empty -delete 2>/dev/null
fi

# ---- 4. ALERTE PROMOTION : candidats a promouvoir vers docs/current/ ----
PROMOTION_CANDIDATES=""
for pattern in "audit-*" "post-mortem-*" "protocole-*" "decision-*" "dette-*" "coherence-*" "documentation-*"; do
  for file in "$SCRATCHPAD"/$pattern; do
    [ ! -f "$file" ] && continue
    age=$(age_days_from_name "$file")
    if [ -n "$age" ] && [ "$age" -gt 7 ]; then
      PROMOTION_CANDIDATES="$PROMOTION_CANDIDATES$(basename "$file")\n"
    fi
  done
done

if [ -n "$PROMOTION_CANDIDATES" ]; then
  echo ""
  echo "CANDIDATS A PROMOUVOIR vers docs/current/ (relire puis deplacer) :"
  echo -e "$PROMOTION_CANDIDATES" | head -10 | while read -r f; do
    [ -n "$f" ] && echo "   - $f"
  done
  echo "   -> Deplacer avec: git mv docs/scratchpad/<file> docs/current/<domaine>/"
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
