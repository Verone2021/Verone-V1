#!/bin/bash
# Surveillance continue avec alertes automatiques
# Usage: ./scripts/monitor-health.sh [interval_seconds]

INTERVAL=${1:-60}  # Défaut: 60 secondes

# Seuils d'alerte
CPU_THRESHOLD=150    # 150% CPU max
RAM_THRESHOLD=12000  # 12 GB max (sur 16 GB)
FILES_THRESHOLD=10000  # 10k file descriptors max

echo "🔍 Monitoring Verone (interval: ${INTERVAL}s)"
echo "   Thresholds: CPU ${CPU_THRESHOLD}% | RAM ${RAM_THRESHOLD}MB | Files ${FILES_THRESHOLD}"
echo "---"

while true; do
  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  # 1. CPU Check
  MAX_CPU=$(ps aux | grep -E 'node|ccusage' | grep -v grep | awk '{print $3}' | sort -rn | head -1 | cut -d. -f1)
  if [ ! -z "$MAX_CPU" ] && [ "$MAX_CPU" -gt "$CPU_THRESHOLD" ]; then
    echo "⚠️  [$TIMESTAMP] HIGH CPU: ${MAX_CPU}%"
    ps aux | grep -E 'node|ccusage' | grep -v grep | head -5
  fi

  # 2. RAM Check
  NODE_RAM=$(ps aux | grep node | grep -v grep | awk '{sum+=$6} END {print int(sum/1024)}')
  if [ ! -z "$NODE_RAM" ] && [ "$NODE_RAM" -gt "$RAM_THRESHOLD" ]; then
    echo "⚠️  [$TIMESTAMP] HIGH RAM: ${NODE_RAM} MB"
    ps aux | grep node | grep -v grep | sort -k6 -rn | head -5
  fi

  # 3. ccusage Leak Check (CRITIQUE)
  CCUSAGE_COUNT=$(ps aux | grep ccusage | grep -v grep | wc -l | tr -d ' ')
  if [ "$CCUSAGE_COUNT" -gt "0" ]; then
    echo "🚨 [$TIMESTAMP] ccusage LEAK DETECTED: ${CCUSAGE_COUNT} processes"
    pkill -9 -f ccusage
    echo "   → Action: Killed all ccusage processes"
  fi

  # 4. File Descriptors Check
  OPEN_FILES=$(lsof -u romeodossantos 2>/dev/null | wc -l | tr -d ' ')
  if [ "$OPEN_FILES" -gt "$FILES_THRESHOLD" ]; then
    echo "⚠️  [$TIMESTAMP] HIGH FDs: ${OPEN_FILES}"
  fi

  # Status OK
  echo "✅ [$TIMESTAMP] Normal (CPU: ${MAX_CPU:-0}% | RAM: ${NODE_RAM:-0}MB | Files: ${OPEN_FILES})"

  sleep "$INTERVAL"
done
