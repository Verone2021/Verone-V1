#!/bin/bash
# check-config-integrity.sh
#
# Verifie l'integrite de la config .claude/ :
# 1. Tous les chemins referencés dans CLAUDE.md/.claude/**/apps/*/CLAUDE.md existent
# 2. Si une PR modifie .claude/, il y a une entrée dans DECISIONS.md
#
# Appelé :
# - Manuellement : bash scripts/check-config-integrity.sh
# - En CI via .github/workflows/ (à activer en Phase 3)
# - Optionnellement en pre-commit via .husky/pre-commit
#
# Exit 0 = OK, Exit 1 = violation detectee

set -e

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "==================================================="
echo " Check config integrity — Verone"
echo "==================================================="
echo ""

# --- Check 1 : Chemins .claude/ référencés mais inexistants -------------------

echo "▸ Check 1 : Chemins .claude/ référencés dans la config…"

FILES_TO_SCAN=(
  "CLAUDE.md"
  "apps/back-office/CLAUDE.md"
  "apps/linkme/CLAUDE.md"
  "apps/site-internet/CLAUDE.md"
  ".husky/pre-commit"
  ".husky/commit-msg"
  ".husky/pre-push"
)

# Ajouter tous les fichiers .md dans .claude/ (hors work/ qui est gitignored)
while IFS= read -r f; do
  FILES_TO_SCAN+=("$f")
done < <(find .claude -type f -name "*.md" \
  -not -path ".claude/work/*" \
  -not -path ".claude/scratch/*" \
  -not -path ".claude/reports/*" \
  -not -path ".claude/backups/*" \
  -not -path ".claude/audits/generated/*" \
  -not -path ".claude/logs/*" \
  2>/dev/null || true)

declare -a BROKEN_PATHS

for file in "${FILES_TO_SCAN[@]}"; do
  [ -f "$file" ] || continue

  # Extraire les chemins .claude/... référencés
  # Motif : .claude/ suivi de caractères non-espaces, non-fin-de-ligne, non-backtick
  while IFS= read -r path; do
    # Nettoyer : retirer trailing punctuation, backticks, parentheses
    cleaned=$(echo "$path" | sed -E 's/[`)",;:]+$//')
    # Ignorer les chemins avec wildcards/patterns
    if [[ "$cleaned" == *"*"* ]] || [[ "$cleaned" == *"{"* ]]; then
      continue
    fi
    # Vérifier l'existence
    if [ ! -e "$cleaned" ]; then
      # Ignorer certains chemins qui sont des placeholders / templates
      if [[ "$cleaned" == *"YYYY-MM-DD"* ]] \
      || [[ "$cleaned" == *"YYYYMMDD"* ]] \
      || [[ "$cleaned" == *"[app]"* ]] \
      || [[ "$cleaned" == *"[page]"* ]] \
      || [[ "$cleaned" == *"[Entity]"* ]] \
      || [[ "$cleaned" == *"NNN"* ]] \
      || [[ "$cleaned" == *"{date}"* ]] \
      || [[ "$cleaned" == *"<"* ]] \
      || [[ "$cleaned" == *"%"* ]]; then
        continue
      fi
      BROKEN_PATHS+=("$file: $cleaned")
    fi
  done < <(grep -oE '\.claude/[A-Za-z0-9/_.-]+' "$file" 2>/dev/null | sort -u)
done

if [ "${#BROKEN_PATHS[@]}" -gt 0 ]; then
  echo -e "${RED}✗ Chemins .claude/ cassés :${NC}"
  for p in "${BROKEN_PATHS[@]}"; do
    echo "    $p"
  done
  ERRORS=$((ERRORS + ${#BROKEN_PATHS[@]}))
else
  echo -e "${GREEN}✓ Tous les chemins .claude/ référencés existent${NC}"
fi

# --- Check 2 : Scripts référencés mais inexistants ---------------------------

echo ""
echo "▸ Check 2 : Scripts .claude/scripts/ et scripts/ référencés…"

declare -a BROKEN_SCRIPTS

for file in "${FILES_TO_SCAN[@]}"; do
  [ -f "$file" ] || continue
  while IFS= read -r path; do
    cleaned=$(echo "$path" | sed -E 's/[`)",;:]+$//')
    if [ ! -e "$cleaned" ]; then
      BROKEN_SCRIPTS+=("$file: $cleaned")
    fi
  done < <(grep -oE '(scripts/|\.claude/scripts/)[A-Za-z0-9_.-]+\.sh' "$file" 2>/dev/null | sort -u)
done

if [ "${#BROKEN_SCRIPTS[@]}" -gt 0 ]; then
  echo -e "${RED}✗ Scripts référencés inexistants :${NC}"
  for s in "${BROKEN_SCRIPTS[@]}"; do
    echo "    $s"
  done
  ERRORS=$((ERRORS + ${#BROKEN_SCRIPTS[@]}))
else
  echo -e "${GREEN}✓ Tous les scripts référencés existent${NC}"
fi

# --- Check 3 : Scripts exécutables -------------------------------------------

echo ""
echo "▸ Check 3 : Scripts ont le flag exécutable…"

declare -a NOT_EXECUTABLE

for sh in .claude/scripts/*.sh scripts/*.sh .husky/pre-commit .husky/commit-msg .husky/pre-push .husky/post-merge 2>/dev/null; do
  [ -f "$sh" ] || continue
  if [ ! -x "$sh" ]; then
    NOT_EXECUTABLE+=("$sh")
  fi
done

if [ "${#NOT_EXECUTABLE[@]}" -gt 0 ]; then
  echo -e "${YELLOW}⚠ Scripts sans flag exécutable :${NC}"
  for s in "${NOT_EXECUTABLE[@]}"; do
    echo "    $s"
    echo "      Fix : chmod +x $s"
  done
  WARNINGS=$((WARNINGS + ${#NOT_EXECUTABLE[@]}))
else
  echo -e "${GREEN}✓ Tous les scripts sont exécutables${NC}"
fi

# --- Check 4 : PR modifiant .claude/ a une entrée dans DECISIONS.md ---------

echo ""
echo "▸ Check 4 : PR touchant .claude/ a une entrée dans DECISIONS.md…"

# Seulement si on est dans un contexte PR (variable GITHUB_EVENT_NAME ou base de comparaison)
BASE_REF="${BASE_REF:-origin/staging}"
if git rev-parse --verify "$BASE_REF" &>/dev/null; then
  CLAUDE_CHANGES=$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null | \
    grep -E '^\.claude/' | \
    grep -vE '^\.claude/(work|scratch|reports|backups|audits/generated|logs|plans/.*-agent-.*|settings\.local\.json)' || true)

  if [ -n "$CLAUDE_CHANGES" ]; then
    echo "  PR modifie .claude/ :"
    echo "$CLAUDE_CHANGES" | sed 's/^/    /'

    DECISIONS_CHANGED=$(git diff --name-only "$BASE_REF"...HEAD 2>/dev/null | \
      grep -E '^\.claude/DECISIONS\.md$' || true)

    if [ -z "$DECISIONS_CHANGED" ]; then
      echo -e "${RED}✗ PR touche .claude/ mais DECISIONS.md n'est pas modifié${NC}"
      echo "    Règle ADR-004 ajustement #3 : toute modif .claude/ doit être documentée dans DECISIONS.md"
      ERRORS=$((ERRORS + 1))
    else
      echo -e "${GREEN}✓ DECISIONS.md mis à jour${NC}"
    fi
  else
    echo -e "${GREEN}✓ PR ne modifie pas .claude/ (ou hors scope versionné)${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Pas de base de comparaison ($BASE_REF) — check 4 skippé${NC}"
fi

# --- Résumé ------------------------------------------------------------------

echo ""
echo "==================================================="
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo -e "${GREEN}✓ Config integrity : PASS (0 erreur, 0 warning)${NC}"
  exit 0
elif [ "$ERRORS" -eq 0 ]; then
  echo -e "${YELLOW}⚠ Config integrity : PASS avec $WARNINGS warning(s)${NC}"
  exit 0
else
  echo -e "${RED}✗ Config integrity : FAIL — $ERRORS erreur(s), $WARNINGS warning(s)${NC}"
  echo ""
  echo "Corriger les erreurs ci-dessus avant de commit/merger."
  exit 1
fi
