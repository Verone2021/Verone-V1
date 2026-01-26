#!/bin/bash
# ==============================================================================
# validate-critical-files.sh - Vérifie les modifications de fichiers critiques
# ==============================================================================
# Ce script alerte quand des fichiers critiques sont modifiés.
# À utiliser en pre-commit ou manuellement.
# ==============================================================================

set -euo pipefail

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fichiers modifiés (staged pour git, ou tous les fichiers passés en argument)
if [ $# -gt 0 ]; then
  MODIFIED="$*"
else
  MODIFIED=$(git diff --cached --name-only 2>/dev/null || echo "")
fi

if [ -z "$MODIFIED" ]; then
  echo "Aucun fichier modifié détecté."
  exit 0
fi

# Patterns critiques
CRITICAL_PATTERNS=(
  "middleware.ts"
  "_rls_"
  "_auth_"
  "app/login"
  "app/(auth)"
)

CRITICAL_FOUND=0

for pattern in "${CRITICAL_PATTERNS[@]}"; do
  MATCHES=$(echo "$MODIFIED" | grep "$pattern" || true)
  if [ -n "$MATCHES" ]; then
    echo -e "${YELLOW}⚠️ FICHIER CRITIQUE MODIFIÉ:${NC} $pattern"
    echo "$MATCHES" | while read -r file; do
      echo "   → $file"
    done
    CRITICAL_FOUND=1
  fi
done

if [ $CRITICAL_FOUND -eq 1 ]; then
  echo ""
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}ATTENTION: Fichiers critiques modifiés!${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo "Checklist obligatoire:"
  echo "  [ ] J'ai lu le fichier existant ENTIÈREMENT"
  echo "  [ ] J'ai documenté les patterns actuels"
  echo "  [ ] J'ai identifié les risques de régression"
  echo "  [ ] J'ai demandé approbation si nécessaire"
  echo ""
fi

exit 0
