#!/bin/bash
# Hook UserPromptSubmit : Injecte du contexte avant chaque prompt
# Le JSON du prompt est passe via stdin

INPUT=$(cat 2>/dev/null || echo "")
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

if [ -z "$PROMPT" ]; then
  exit 0
fi

# Si le prompt demande une modification de code
if echo "$PROMPT" | grep -qiE "(add|create|implement|fix|update|modify|change|refactor|build|write|develop|ajoute|cree|implemente|corrige|modifie)"; then
  cat <<'EOF'
AVANT DE CODER — Checklist obligatoire :
1. Verifier le schema DB des tables concernees (mcp__supabase__execute_sql)
2. Verifier le code existant (Grep/Serena) — ne pas reinventer
3. Verifier les composants partages dans packages/@verone/ (voir docs/current/architecture-packages.md)
4. Comprendre le flux utilisateur concerne AVANT de modifier
5. Si doute, utiliser /research <domaine> AVANT toute modification
EOF
fi

exit 0
