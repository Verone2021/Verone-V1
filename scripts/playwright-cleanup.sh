#!/bin/bash
# Nettoyage complet des artifacts Playwright MCP (screenshots, console logs, traces)

MCP_DIR=".playwright-mcp"
DAYS_OLD=7

echo "Nettoyage artifacts Playwright (> ${DAYS_OLD} jours)..."

if [ ! -d "$MCP_DIR" ]; then
  echo "Dossier $MCP_DIR n'existe pas"
  exit 0
fi

# Screenshots
SCREENSHOTS=$(find "$MCP_DIR" -name "*.png" -o -name "*.jpg" | wc -l | tr -d ' ')
find "$MCP_DIR" -name "*.png" -mtime +${DAYS_OLD} -delete 2>/dev/null
find "$MCP_DIR" -name "*.jpg" -mtime +${DAYS_OLD} -delete 2>/dev/null
SCREENSHOTS_AFTER=$(find "$MCP_DIR" -name "*.png" -o -name "*.jpg" | wc -l | tr -d ' ')

# Console logs
LOGS=$(find "$MCP_DIR" -name "console-*.log" | wc -l | tr -d ' ')
find "$MCP_DIR" -name "console-*.log" -mtime +${DAYS_OLD} -delete 2>/dev/null
LOGS_AFTER=$(find "$MCP_DIR" -name "console-*.log" | wc -l | tr -d ' ')

# Traces
TRACES=$(find "$MCP_DIR" -name "*.zip" -o -name "*.trace" | wc -l | tr -d ' ')
find "$MCP_DIR" -name "*.zip" -mtime +${DAYS_OLD} -delete 2>/dev/null
find "$MCP_DIR" -name "*.trace" -mtime +${DAYS_OLD} -delete 2>/dev/null

echo "Screenshots: $((SCREENSHOTS - SCREENSHOTS_AFTER)) supprimes, $SCREENSHOTS_AFTER conserves"
echo "Console logs: $((LOGS - LOGS_AFTER)) supprimes, $LOGS_AFTER conserves"
echo "Traces: $TRACES trouves (anciens supprimes)"
echo "Nettoyage termine."
