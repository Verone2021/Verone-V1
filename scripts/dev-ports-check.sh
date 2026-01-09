#!/bin/bash
# ============================================================================
# dev-ports-check.sh - Verifie les ports dev Verone (3000, 3001, 3002)
# ============================================================================
# Usage : ./scripts/dev-ports-check.sh
#         pnpm run ports:check
# ============================================================================

echo ""
echo "=== Ports Verone Dev ==="
echo ""

ALL_FREE=true

# Port 3000 - back-office
pid=$(lsof -ti :3000 2>/dev/null)
if [ -n "$pid" ]; then
  process=$(ps -p $pid -o comm= 2>/dev/null)
  echo "Port 3000 (back-office): OCCUPE - PID $pid ($process)"
  ALL_FREE=false
else
  echo "Port 3000 (back-office): libre"
fi

# Port 3001 - site-internet
pid=$(lsof -ti :3001 2>/dev/null)
if [ -n "$pid" ]; then
  process=$(ps -p $pid -o comm= 2>/dev/null)
  echo "Port 3001 (site-internet): OCCUPE - PID $pid ($process)"
  ALL_FREE=false
else
  echo "Port 3001 (site-internet): libre"
fi

# Port 3002 - linkme
pid=$(lsof -ti :3002 2>/dev/null)
if [ -n "$pid" ]; then
  process=$(ps -p $pid -o comm= 2>/dev/null)
  echo "Port 3002 (linkme): OCCUPE - PID $pid ($process)"
  ALL_FREE=false
else
  echo "Port 3002 (linkme): libre"
fi

echo ""

if [ "$ALL_FREE" = true ]; then
  echo "Tous les ports sont libres. Tu peux lancer: pnpm run dev"
else
  echo "Certains ports sont occupes. Pour les liberer: pnpm run ports:kill"
fi

echo ""
