#!/bin/bash
# Script de validation de l'environnement avant démarrage dev
# Usage: ./scripts/validate-env.sh

set -e

# Charger nvm et activer la version par défaut (Node 20 LTS)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && nvm use default --silent 2>/dev/null

echo "🔍 Validation de l'environnement de développement..."
echo ""

ISSUES=0

# 1. Vérifier Node.js version
echo "📦 Node.js version:"
NODE_VERSION=$(node -v)
echo "   $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v20 ]]; then
  echo "   ⚠️  Warning: Version attendue Node 20.x, vous avez $NODE_VERSION"
  ISSUES=$((ISSUES+1))
fi
echo ""

# 2. Vérifier pnpm version
echo "📦 pnpm version:"
PNPM_VERSION=$(pnpm -v)
echo "   $PNPM_VERSION"
if [[ ! "$PNPM_VERSION" =~ ^10 ]]; then
  echo "   ⚠️  Warning: Version attendue pnpm 10.x, vous avez $PNPM_VERSION"
  ISSUES=$((ISSUES+1))
fi
echo ""

# 3. Vérifier que les ports sont libres
echo "🔌 Vérification des ports..."
for port in 3000 3001 3002; do
  if lsof -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
    echo "   ❌ Port $port déjà utilisé"
    echo "      → Exécutez: lsof -ti:$port | xargs kill -9"
    ISSUES=$((ISSUES+1))
  else
    echo "   ✅ Port $port libre"
  fi
done
echo ""

# 4. Vérifier les fichiers .env.local
echo "🔐 Vérification des fichiers .env.local..."
for app in back-office linkme site-internet; do
  if [ ! -f "apps/$app/.env.local" ]; then
    echo "   ❌ Manquant: apps/$app/.env.local"
    echo "      → Créez-le à partir de .env.example"
    ISSUES=$((ISSUES+1))
  else
    # Vérifier les variables critiques
    ENV_FILE="apps/$app/.env.local"
    REQUIRED_VARS=(
      "NEXT_PUBLIC_SUPABASE_URL"
      "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )

    MISSING_VARS=0
    for var in "${REQUIRED_VARS[@]}"; do
      if ! grep -q "^$var=" "$ENV_FILE"; then
        if [ $MISSING_VARS -eq 0 ]; then
          echo "   ⚠️  apps/$app/.env.local - Variables manquantes:"
        fi
        echo "      - $var"
        MISSING_VARS=$((MISSING_VARS+1))
      fi
    done

    if [ $MISSING_VARS -eq 0 ]; then
      echo "   ✅ apps/$app/.env.local complet"
    else
      ISSUES=$((ISSUES+1))
    fi
  fi
done
echo ""

# 5. Vérifier les dépendances critiques (pnpm workspace hoisting)
echo "🔗 Vérification des dépendances..."

# Avec pnpm workspace, les packages sont dans node_modules/ racine (hoisting)
DEPS_OK=true
for pkg in next react typescript; do
  if [ -e "node_modules/.bin/$pkg" ] || [ -d "node_modules/$pkg" ]; then
    echo "   ✅ $pkg installé"
  else
    echo "   ❌ $pkg manquant"
    DEPS_OK=false
  fi
done

if [ "$DEPS_OK" = false ]; then
  echo "   → Exécutez: pnpm install"
  ISSUES=$((ISSUES+1))
fi
echo ""

# 6. Vérifier l'état Git
echo "📝 État Git:"
BRANCH=$(git branch --show-current)
echo "   Branche: $BRANCH"
UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "   ⚠️  $UNCOMMITTED fichier(s) modifié(s) non commité(s)"
else
  echo "   ✅ Working directory propre"
fi
echo ""

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$ISSUES" -eq 0 ]; then
  echo "✅ Environnement prêt - Aucun problème détecté"
  echo ""
  echo "Vous pouvez démarrer avec: pnpm dev"
  exit 0
else
  echo "⚠️  $ISSUES problème(s) détecté(s)"
  echo ""
  echo "💡 Actions recommandées:"
  if lsof -iTCP:3000,3001,3002 -sTCP:LISTEN > /dev/null 2>&1; then
    echo "   1. Arrêter les serveurs: pnpm dev:stop"
  fi
  echo "   2. Nettoyer le cache: pnpm dev:clean"
  echo "   3. Réinstaller si symlinks cassés: pnpm install --force"
  echo "   4. Relancer: pnpm dev"
  exit 1
fi
