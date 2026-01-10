#!/bin/bash
# ============================================================================
# ports-assert.sh - Verifie que les ports dev sont LIBRES (fail fast)
# ============================================================================
# Usage : ./scripts/ports-assert.sh
# Exit 1 immediatement si un port est occupe
# ============================================================================

PORTS=(3000 3001 3002)
APPS=("back-office" "site-internet" "linkme")

for i in "${!PORTS[@]}"; do
  port=${PORTS[$i]}
  app=${APPS[$i]}
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    process=$(ps -p $pid -o comm= 2>/dev/null)
    echo ""
    echo "========================================"
    echo "ERREUR: Port $port ($app) occupe"
    echo "========================================"
    echo "PID: $pid ($process)"
    echo ""
    echo "Dev deja en cours. N'essaie PAS de relancer."
    echo ""
    echo "Options:"
    echo "  1. Utilise le terminal Dev Runner existant"
    echo "  2. Pour forcer: pnpm run ports:kill"
    echo ""
    exit 1
  fi
done

echo "Tous les ports libres (3000, 3001, 3002)"
exit 0
