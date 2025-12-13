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
# 0. Vérification tokens env (DOIT être vide - OAuth keychain only)
# ----------------------------------------------------------------------------
echo -e "${BLUE}[0/8] Vérification tokens environnement...${NC}"

TOKEN_LEAK=0
if [ -n "${GH_TOKEN:-}" ]; then
    echo -e "  ${RED}✗${NC} GH_TOKEN est défini (utiliser OAuth keychain à la place)"
    echo "    → Supprimer de ~/.zshrc ou ~/.bashrc"
    echo "    → Pour cette session: unset GH_TOKEN"
    TOKEN_LEAK=1
    ((ERRORS++))
fi

if [ -n "${GITHUB_TOKEN:-}" ]; then
    echo -e "  ${RED}✗${NC} GITHUB_TOKEN est défini (utiliser OAuth keychain à la place)"
    echo "    → Supprimer de ~/.zshrc ou ~/.bashrc"
    echo "    → Pour cette session: unset GITHUB_TOKEN"
    TOKEN_LEAK=1
    ((ERRORS++))
fi

if [ "$TOKEN_LEAK" = "0" ]; then
    echo -e "  ${GREEN}✓${NC} Aucun token dans l'environnement (OAuth keychain actif)"
fi

# ----------------------------------------------------------------------------
# 1. Vérification Auth GitHub
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[1/8] Vérification authentification GitHub...${NC}"

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
echo -e "${BLUE}[2/8] Vérification branche courante...${NC}"

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
echo -e "${BLUE}[3/8] Vérification commits non poussés...${NC}"

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
echo -e "${BLUE}[4/8] Vérification changements non commités...${NC}"

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
echo -e "${BLUE}[5/8] Vérification branches locales...${NC}"

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
echo -e "${BLUE}[6/8] Vérification branches remote...${NC}"

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
# 7. Scan anti-secrets (fichiers trackés)
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[7/8] Scan anti-secrets dans fichiers trackés...${NC}"

# Patterns de secrets à détecter (READ-ONLY - diagnostic uniquement)
SECRET_PATTERNS=(
    "ghp_[a-zA-Z0-9]{36}"           # GitHub Personal Access Token
    "gho_[a-zA-Z0-9]{36}"           # GitHub OAuth Token
    "github_pat_[a-zA-Z0-9_]{82}"   # GitHub Fine-grained PAT
    "sk_live_[a-zA-Z0-9]{24,}"      # Stripe Live Key
    "sk_test_[a-zA-Z0-9]{24,}"      # Stripe Test Key
    "eyJhbGciOiJ[a-zA-Z0-9_-]{100,}" # JWT tokens (service_role, etc.)
    "service_role.*eyJ"             # Supabase service role
    "SUPABASE_SERVICE_ROLE_KEY=eyJ" # Explicit service role
    "xoxb-[0-9]{10,13}-[a-zA-Z0-9-]+" # Slack Bot Token
    "xoxp-[0-9]{10,13}-[a-zA-Z0-9-]+" # Slack User Token
)

SECRETS_FOUND=0

for pattern in "${SECRET_PATTERNS[@]}"; do
    # Scan uniquement fichiers trackés, exclure .env.example et binaires
    MATCHES=$(git ls-files | xargs grep -lE "$pattern" 2>/dev/null | grep -v ".env.example" | grep -v "node_modules" | head -5)
    if [ -n "$MATCHES" ]; then
        echo -e "  ${RED}✗${NC} Pattern suspect trouvé: ${pattern:0:20}..."
        echo "$MATCHES" | sed 's/^/    → /'
        SECRETS_FOUND=1
        ((ERRORS++))
    fi
done

if [ "$SECRETS_FOUND" = "0" ]; then
    echo -e "  ${GREEN}✓${NC} Aucun secret détecté dans les fichiers trackés"
fi

# ----------------------------------------------------------------------------
# 8. Vérification .env.example (pas de vraies valeurs)
# ----------------------------------------------------------------------------
echo ""
echo -e "${BLUE}[8/8] Vérification .env.example...${NC}"

if [ -f ".env.example" ]; then
    # Chercher des valeurs qui ressemblent à de vrais secrets
    REAL_VALUES=$(grep -E "^[A-Z_]+=.{20,}" .env.example 2>/dev/null | grep -v "your_" | grep -v "_here" | grep -v "placeholder" | grep -v "example" | head -3)
    if [ -n "$REAL_VALUES" ]; then
        echo -e "  ${YELLOW}!${NC} Valeurs suspectes dans .env.example:"
        echo "$REAL_VALUES" | sed 's/^/    /'
        ((WARNINGS++))
    else
        echo -e "  ${GREEN}✓${NC} .env.example contient des placeholders (OK)"
    fi
else
    echo -e "  ${YELLOW}!${NC} Pas de .env.example trouvé"
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
