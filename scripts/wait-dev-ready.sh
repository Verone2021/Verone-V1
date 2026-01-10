#!/bin/bash
# ============================================================================
# wait-dev-ready.sh - Attend que les serveurs dev soient prets
# ============================================================================
# Usage : ./scripts/wait-dev-ready.sh [timeout_seconds]
# Pour les lanes Playwright: appeler AVANT toute navigation
# ============================================================================

TIMEOUT=${1:-60}
PORTS=(3000 3001 3002)
APPS=("back-office" "site-internet" "linkme")

echo ""
echo "========================================"
echo "Attente des serveurs dev"
echo "========================================"
echo "Timeout: ${TIMEOUT}s"
echo ""

ALL_READY=true

for i in "${!PORTS[@]}"; do
  port=${PORTS[$i]}
  app=${APPS[$i]}

  elapsed=0
  printf "%-15s (port %s): " "$app" "$port"

  while ! curl -s --connect-timeout 1 "http://localhost:$port" > /dev/null 2>&1; do
    if [ $elapsed -ge $TIMEOUT ]; then
      echo "TIMEOUT"
      ALL_READY=false
      break
    fi
    printf "."
    sleep 1
    elapsed=$((elapsed + 1))
  done

  if [ $elapsed -lt $TIMEOUT ]; then
    echo "OK (${elapsed}s)"
  fi
done

echo ""

if [ "$ALL_READY" = true ]; then
  echo "========================================"
  echo "Tous les serveurs sont prets!"
  echo "========================================"
  echo ""
  exit 0
else
  echo "========================================"
  echo "ERREUR: Certains serveurs non disponibles"
  echo "========================================"
  echo ""
  echo "Verifiez que le Dev Runner est lance:"
  echo "  pnpm run dev"
  echo ""
  exit 1
fi
