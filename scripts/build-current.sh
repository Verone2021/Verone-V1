#!/usr/bin/env bash
# build-current.sh - Build sélectif pour un package spécifique
# Usage: ./scripts/build-current.sh <package> [command]
#   package: back-office | linkme | site-internet | <package-name>
#   command: build | type-check | lint (default: build)

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'aide
show_help() {
  echo -e "${BLUE}Build Sélectif Turborepo${NC}"
  echo ""
  echo "Usage: $0 <package> [command]"
  echo ""
  echo "Packages disponibles:"
  echo "  back-office    → @verone/back-office"
  echo "  linkme         → @verone/linkme"
  echo "  site-internet  → @verone/site-internet"
  echo "  ui             → @verone/ui"
  echo "  types          → @verone/types"
  echo "  <custom>       → @verone/<custom>"
  echo ""
  echo "Commandes disponibles:"
  echo "  build          → Compile le package (default)"
  echo "  type-check     → Vérifie les types TypeScript"
  echo "  lint           → Lint le code"
  echo ""
  echo "Exemples:"
  echo "  $0 back-office"
  echo "  $0 linkme type-check"
  echo "  $0 ui build"
  echo ""
  echo -e "${YELLOW}⚠️  ÉVITER 'pnpm build' (build TOUT = 3-5 min)${NC}"
  echo -e "${GREEN}✅ UTILISER ce script (build 1 package = 30-60 sec)${NC}"
}

# Vérifier arguments
if [ $# -eq 0 ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  show_help
  exit 0
fi

PACKAGE_SHORT=$1
COMMAND=${2:-build}

# Mapping package court → package complet
case $PACKAGE_SHORT in
  back-office)
    PACKAGE_FULL="@verone/back-office"
    ;;
  linkme)
    PACKAGE_FULL="@verone/linkme"
    ;;
  site-internet)
    PACKAGE_FULL="@verone/site-internet"
    ;;
  ui|types|products|customers|orders|organisations|suppliers|auth|linkme-core)
    PACKAGE_FULL="@verone/$PACKAGE_SHORT"
    ;;
  @verone/*)
    PACKAGE_FULL=$PACKAGE_SHORT
    ;;
  *)
    echo -e "${RED}❌ Package inconnu: $PACKAGE_SHORT${NC}"
    echo ""
    show_help
    exit 1
    ;;
esac

# Valider commande
case $COMMAND in
  build|type-check|lint)
    ;;
  *)
    echo -e "${RED}❌ Commande inconnue: $COMMAND${NC}"
    echo -e "Commandes valides: build, type-check, lint"
    exit 1
    ;;
esac

# Afficher ce qui va être exécuté
echo -e "${BLUE}🚀 Build Sélectif${NC}"
echo -e "Package: ${GREEN}$PACKAGE_FULL${NC}"
echo -e "Command: ${GREEN}$COMMAND${NC}"
echo ""

# Exécuter
CMD="pnpm --filter $PACKAGE_FULL $COMMAND"
echo -e "${YELLOW}▶ $CMD${NC}"
echo ""

$CMD

# Succès
echo ""
echo -e "${GREEN}✅ $COMMAND terminé avec succès pour $PACKAGE_FULL${NC}"
echo ""
echo -e "${YELLOW}💡 Temps économisé vs 'pnpm build' complet: ~2-4 minutes${NC}"
