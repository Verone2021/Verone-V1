#!/bin/bash
# ============================================================================
# repo-doctor.sh - Diagnostic de santé du repository Verone
# ============================================================================
# Mode : READ-ONLY (aucune action destructrice)
# Usage : ./scripts/repo-doctor.sh
# ============================================================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Compteurs
WARNINGS=0
ERRORS=0

echo ""
echo "=============================================="
echo "  REPO DOCTOR - Diagnostic Verone Monorepo"
echo "=============================================="
echo ""

# ----------------------------------------------------------------------------
# 1. Vérification Auth GitHub
# ----------------------------------------------------------------------------
echo -e "${BLUE}[1/6] Vérification authentification GitHub...${NC}"

if gh auth status &>/dev/null; then
    ACCOUNT=$(gh auth status 2>&1 | grep "Logged in" | head -1 | sed 's/.*account //' | sed 's/ .*//')
    echo -e "  ${GREEN}✓${NC} Authentifié comme: $ACCOUNT"
else
    echo -e "  ${RED}✗${NC} Non authentifié GitHub CLI"
    echo "    → Exécuter: gh auth login --web"
    ((ERRORS++))
fi

# ----------------------------------------------------------------------------
# 2. Vérification branche courante
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[2/6] Vérification branche courante...${NC}"

CURRENT_BRANCH=$(git branch --show-current)
echo "  Branche courante: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "  ${GREEN}✓${NC} Sur branche principale"
elif [[ "$CURRENT_BRANCH" == feature/* ]] || [[ "$CURRENT_BRANCH" == fix/* ]] || [[ "$CURRENT_BRANCH" == chore/* ]]; then
    echo -e "  ${GREEN}✓${NC} Branche de travail valide"
else
    echo -e "  ${YELLOW}!${NC} Branche non standard (préfixe manquant?)"
    ((WARNINGS++))
fi

# ----------------------------------------------------------------------------
# 3. Vérification commits non poussés
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[3/6] Vérification commits non poussés...${NC}"

UNPUSHED=$(git log origin/$CURRENT_BRANCH..$CURRENT_BRANCH --oneline 2>/dev/null | wc -l | tr -d ' ')

if [ "$UNPUSHED" = "0" ]; then
    echo -e "  ${GREEN}✓${NC} Tous les commits sont poussés"
else
    echo -e "  ${YELLOW}!${NC} $UNPUSHED commit(s) non poussé(s)"
    git log origin/$CURRENT_BRANCH..$CURRENT_BRANCH --oneline 2>/dev/null | head -5 | sed 's/^/    /'
    ((WARNINGS++))
fi

# ----------------------------------------------------------------------------
# 4. Vérification changements non commités
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[4/6] Vérification changements non commités...${NC}"

STAGED=$(git diff --cached --name-only | wc -l | tr -d ' ')
UNSTAGED=$(git diff --name-only | wc -l | tr -d ' ')
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')

if [ "$STAGED" = "0" ] && [ "$UNSTAGED" = "0" ]; then
    echo -e "  ${GREEN}✓${NC} Working directory propre"
else
    if [ "$STAGED" != "0" ]; then
        echo -e "  ${YELLOW}!${NC} $STAGED fichier(s) stagé(s)"
        ((WARNINGS++))
    fi
    if [ "$UNSTAGED" != "0" ]; then
        echo -e "  ${YELLOW}!${NC} $UNSTAGED fichier(s) modifié(s) non stagé(s)"
        ((WARNINGS++))
    fi
fi

if [ "$UNTRACKED" != "0" ]; then
    echo -e "  ${YELLOW}!${NC} $UNTRACKED fichier(s) non suivi(s)"
fi

# ----------------------------------------------------------------------------
# 5. Vérification branches locales
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[5/6] Vérification branches locales...${NC}"

LOCAL_BRANCHES=$(git branch | wc -l | tr -d ' ')
MERGED_BRANCHES=$(git branch --merged main 2>/dev/null | grep -v "main" | grep -v "production" | wc -l | tr -d ' ')

echo "  Branches locales: $LOCAL_BRANCHES"

if [ "$MERGED_BRANCHES" != "0" ]; then
    echo -e "  ${YELLOW}!${NC} $MERGED_BRANCHES branche(s) mergée(s) à nettoyer:"
    git branch --merged main 2>/dev/null | grep -v "main" | grep -v "production" | sed 's/^/    /'
    echo "    → Nettoyer avec: git branch -d <branch>"
    ((WARNINGS++))
else
    echo -e "  ${GREEN}✓${NC} Pas de branches mergées à nettoyer"
fi

# ----------------------------------------------------------------------------
# 6. Vérification branches remote
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[6/6] Vérification branches remote...${NC}"

git fetch --prune &>/dev/null || true

REMOTE_BRANCHES=$(git branch -r | grep -v HEAD | wc -l | tr -d ' ')
echo "  Branches remote: $REMOTE_BRANCHES"

# Liste des branches attendues
EXPECTED_BRANCHES=("origin/main" "origin/production")
for branch in $(git branch -r | grep -v HEAD | sed 's/^ *//'); do
    if [[ ! " ${EXPECTED_BRANCHES[@]} " =~ " ${branch} " ]]; then
        echo -e "  ${YELLOW}!${NC} Branche inattendue: $branch"
        ((WARNINGS++))
    fi
done

if [ "$REMOTE_BRANCHES" = "2" ]; then
    echo -e "  ${GREEN}✓${NC} Nombre de branches remote optimal (2)"
fi

# ----------------------------------------------------------------------------
# Résumé
# ----------------------------------------------------------------------------
echo ""
echo "=============================================="
echo "  RÉSUMÉ"
echo "=============================================="
echo ""

if [ "$ERRORS" = "0" ] && [ "$WARNINGS" = "0" ]; then
    echo -e "${GREEN}✓ REPO EN BONNE SANTÉ${NC}"
    echo "  Aucune erreur, aucun warning"
    exit 0
elif [ "$ERRORS" = "0" ]; then
    echo -e "${YELLOW}! REPO OK AVEC WARNINGS${NC}"
    echo "  Erreurs: 0"
    echo "  Warnings: $WARNINGS"
    exit 0
else
    echo -e "${RED}✗ REPO NÉCESSITE ATTENTION${NC}"
    echo "  Erreurs: $ERRORS"
    echo "  Warnings: $WARNINGS"
    exit 1
fi
