#!/bin/bash
# ============================================================================
# dev-ports-kill.sh - Libere les ports dev Verone (3000, 3001, 3002)
# ============================================================================
# Usage : ./scripts/dev-ports-kill.sh
#         pnpm run ports:kill
# ============================================================================

echo ""
echo "=== Kill Ports Verone Dev ==="
echo ""

KILLED=0

# Port 3000 - back-office
pid=$(lsof -ti :3000 2>/dev/null)
if [ -n "$pid" ]; then
  process=$(ps -p $pid -o comm= 2>/dev/null)
  echo "Killing port 3000 (back-office): PID $pid ($process)"
  kill -9 $pid 2>/dev/null
  KILLED=$((KILLED + 1))
fi

# Port 3001 - site-internet
pid=$(lsof -ti :3001 2>/dev/null)
if [ -n "$pid" ]; then
  process=$(ps -p $pid -o comm= 2>/dev/null)
  echo "Killing port 3001 (site-internet): PID $pid ($process)"
  kill -9 $pid 2>/dev/null
  KILLED=$((KILLED + 1))
fi

# Port 3002 - linkme
pid=$(lsof -ti :3002 2>/dev/null)
if [ -n "$pid" ]; then
  process=$(ps -p $pid -o comm= 2>/dev/null)
  echo "Killing port 3002 (linkme): PID $pid ($process)"
  kill -9 $pid 2>/dev/null
  KILLED=$((KILLED + 1))
fi

echo ""

if [ "$KILLED" -eq 0 ]; then
  echo "Aucun processus a tuer. Tous les ports sont deja libres."
else
  echo "$KILLED processus tue(s). Ports liberes."
fi

echo ""
