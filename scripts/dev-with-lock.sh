#!/bin/bash
# ============================================================================
# dev-with-lock.sh - Lance turbo dev avec lockfile OS-level
# ============================================================================
# Usage : ./scripts/dev-with-lock.sh
# Empeche plusieurs instances de turbo dev simultanees
# Compatible macOS et Linux
# ============================================================================

LOCKFILE="/tmp/verone-dev.lock"

# Verifier d'abord que les ports sont libres
./scripts/ports-assert.sh
if [ $? -ne 0 ]; then
  exit 1
fi

# Fonction pour verifier si un PID est actif
is_process_running() {
  kill -0 "$1" 2>/dev/null
}

# Verifier si un lock existe deja
if [ -f "$LOCKFILE" ]; then
  OLD_PID=$(cat "$LOCKFILE" 2>/dev/null)
  if [ -n "$OLD_PID" ] && is_process_running "$OLD_PID"; then
    echo ""
    echo "========================================"
    echo "ERREUR: Dev Runner deja actif (PID: $OLD_PID)"
    echo "========================================"
    echo "Lockfile: $LOCKFILE"
    echo ""
    echo "Options:"
    echo "  1. Ferme l'autre terminal Dev Runner"
    echo "  2. Si orphelin: rm $LOCKFILE"
    echo ""
    exit 1
  else
    # Lock orphelin, le supprimer
    rm -f "$LOCKFILE"
  fi
fi

# Creer le lockfile avec notre PID
echo $$ > "$LOCKFILE"

# Cleanup automatique a la sortie (meme si crash/Ctrl+C)
cleanup() {
  rm -f "$LOCKFILE"
  exit 0
}
trap cleanup EXIT INT TERM

echo ""
echo "========================================"
echo "Dev Runner actif (lock acquis)"
echo "========================================"
echo "Ports: 3000 (back-office), 3001 (site), 3002 (linkme)"
echo "Lockfile: $LOCKFILE"
echo ""

# Lancer turbo dev
exec turbo dev
