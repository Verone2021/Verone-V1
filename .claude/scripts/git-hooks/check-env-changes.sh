#!/bin/bash
# Git Hook: Détecte les modifications de .env.local
# Usage: Appelé automatiquement par pre-commit hook

set -e

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Vérifier si des fichiers .env.local sont modifiés
ENV_FILES=$(git diff --cached --name-only | grep "\.env\.local$" || true)

if [ -z "$ENV_FILES" ]; then
  # Aucun fichier .env.local modifié
  exit 0
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⚠️  Fichiers .env.local modifiés détectés${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Créer un backup automatique de chaque fichier modifié
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
BACKED_UP=0

for file in $ENV_FILES; do
  if [ -f "$file" ]; then
    BACKUP_FILE="${file}.backup-${TIMESTAMP}"
    cp "$file" "$BACKUP_FILE"
    echo -e "${GREEN}✓${NC} Backup créé: ${BACKUP_FILE}"
    BACKED_UP=$((BACKED_UP+1))
  fi
done

echo ""
echo -e "${YELLOW}📝 Important:${NC}"
echo "   1. Les fichiers .env.local ne doivent JAMAIS être committés"
echo "   2. Vérifiez que vous ne committez pas de secrets"
echo "   3. Après ce commit, redémarrez les serveurs:"
echo ""
echo -e "      ${GREEN}pnpm dev:stop${NC}"
echo -e "      ${GREEN}pnpm dev${NC}"
echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# IMPORTANT: Ne pas bloquer le commit, juste avertir
# Si vous voulez bloquer, changez exit 0 en exit 1
exit 0
