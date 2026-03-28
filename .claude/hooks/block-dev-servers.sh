#!/bin/bash
# ============================================================
# block-dev-servers.sh — Bloque tout lancement de serveur dev
# ============================================================
# Seul Romeo peut lancer les serveurs manuellement.
# Exit 2 = BLOQUE la commande + message renvoye a Claude.
# Exit 0 = commande autorisee.
# ============================================================

# Lire le JSON depuis stdin (methode officielle Claude Code)
INPUT=$(cat 2>/dev/null || echo "")
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Fallback sur $TOOL_INPUT si stdin vide
if [ -z "$COMMAND" ]; then
  COMMAND="${TOOL_INPUT:-}"
fi

# Rien a verifier
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Normaliser : minuscules + espaces condenses
NORMALIZED=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]' | tr -s ' ')

# Pattern 1 : pnpm/npm/yarn/bun/turbo/next + dev/start
# Pattern 2 : pnpm/npm/yarn run dev/start
# Pattern 3 : npx/bunx turbo/next dev/start
# Pattern 4 : turbo run dev/start
# Pattern 5 : next dev/start standalone
# Pattern 6 : node server.js/ts

if echo "$NORMALIZED" | grep -qE \
  '(^|\s|&&|\|\||;)(pnpm|npm|yarn|bun|bunx|npx|turbo|next)\s+(dev|start)\b'; then
  BLOCKED=true
elif echo "$NORMALIZED" | grep -qE \
  '(^|\s|&&|\|\||;)(pnpm|npm|yarn|bun)\s+run\s+(dev|start)\b'; then
  BLOCKED=true
elif echo "$NORMALIZED" | grep -qE \
  '(^|\s|&&|\|\||;)(npx|bunx)\s+(turbo|next)\s+(dev|start)\b'; then
  BLOCKED=true
elif echo "$NORMALIZED" | grep -qE \
  '(^|\s|&&|\|\||;)turbo\s+run\s+(dev|start)\b'; then
  BLOCKED=true
elif echo "$NORMALIZED" | grep -qE \
  '(^|\s|&&|\|\||;)node\s+.*server\.(js|ts|mjs)\b'; then
  BLOCKED=true
else
  BLOCKED=false
fi

if [ "$BLOCKED" = true ]; then
  echo "BLOQUE: Lancement serveur INTERDIT pour les agents Claude." >&2
  echo "" >&2
  echo "Seul Romeo peut demarrer les serveurs depuis son terminal." >&2
  echo "Ports: back-office=3000, site-internet=3001, linkme=3002" >&2
  echo "" >&2
  echo "Pour verifier une page, utilise Playwright MCP." >&2
  exit 2
fi

exit 0
