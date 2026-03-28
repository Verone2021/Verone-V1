#!/bin/bash
# ============================================================
# block-typescript-any.sh — Bloque TypeScript any dans le code
# ============================================================
# Zero tolerance pour any. Utiliser unknown + Zod.
# Exit 2 = BLOQUE. Exit 0 = autorise.
# ============================================================

INPUT=$(cat 2>/dev/null || echo "")

# Extraire le contenu ecrit (new_string pour Edit, content pour Write)
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty' 2>/dev/null)

# Fallback sur $TOOL_INPUT
if [ -z "$CONTENT" ]; then
  CONTENT=$(echo "${TOOL_INPUT:-}" | jq -r '.new_string // .content // empty' 2>/dev/null)
fi

if [ -z "$CONTENT" ]; then
  exit 0
fi

# Verifier les patterns any interdits
# Note: on exclut les faux positifs courants (company, many, any- dans les noms CSS, etc.)
if echo "$CONTENT" | grep -qE '(:\s*any\s*[;,\)\}\]|=]|:\s*any$|as\s+any\s*[;,\)\}\]|]|as\s+any$|<any>|any\[\]|eslint-disable.*no-explicit-any)'; then
  echo "BLOQUE: TypeScript 'any' detecte." >&2
  echo "" >&2
  echo "Patterns interdits:" >&2
  echo "  - : any" >&2
  echo "  - as any" >&2
  echo "  - any[]" >&2
  echo "  - eslint-disable no-explicit-any" >&2
  echo "" >&2
  echo "Solutions:" >&2
  echo "  1. Types DB: Database['public']['Tables']['table']['Row']" >&2
  echo "  2. unknown + validation Zod" >&2
  echo "  3. Type specifique ou generique" >&2
  exit 2
fi

exit 0
