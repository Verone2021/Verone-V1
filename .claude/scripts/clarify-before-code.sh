#!/bin/bash

# Hook UserPromptSubmit : Rappel TEACH-FIRST + Documentation avant modification code
# Note: Le prompt utilisateur est passe via stdin par Claude Code hooks

# Lire le prompt depuis stdin (si disponible)
PROMPT=""
if [ -t 0 ]; then
  # stdin est un terminal, pas de donnees pipees
  # Fallback : utiliser $USER_PROMPT si defini
  PROMPT="${USER_PROMPT:-}"
else
  # Lire depuis stdin
  PROMPT=$(cat -)
fi

# Si prompt vide, pas de rappel (evite spam)
if [ -z "$PROMPT" ]; then
  exit 0
fi

# Detecte mots-cles ESLint/warnings
if echo "$PROMPT" | grep -qiE "(eslint|warning|lint|fix-warning|warnings)"; then
  cat <<'EOF'

📖 DOCUMENTATION OBLIGATOIRE - ESLINT/WARNINGS

AVANT de corriger des warnings, tu DOIS lire:
  → .claude/commands/fix-warnings.md (690 lignes, ~10 min)

Workflow requis:
  ✅ Un fichier → Tous warnings → Self-verify → Commit
  ❌ INTERDIT: Batch par règle, --no-verify, corrections partielles

Pour débloquer: .claude/scripts/confirm-docs-read.sh

EOF
fi

# Detecte mots-cles TypeScript errors
if echo "$PROMPT" | grep -qiE "(type.?error|typescript|ts.?error|type.?check)"; then
  cat <<'EOF'

📖 DOCUMENTATION OBLIGATOIRE - TYPESCRIPT

AVANT de corriger des erreurs TypeScript, tu DOIS lire:
  → .claude/guides/typescript-errors-debugging.md (~8 min)

Pour débloquer: .claude/scripts/confirm-docs-read.sh

EOF
fi

# Detecte mots-cles modification code (case insensitive)
if echo "$PROMPT" | grep -qiE "(add|create|implement|fix|update|modify|change|refactor|build|write|code|develop)"; then
  cat <<'EOF'

RAPPEL TEACH-FIRST (CLAUDE.md) :

1. INVESTIGUER : Pattern officiel (MCP Context7)
2. ANALYSER : Patterns existants projet (Serena/Grep)
3. CHALLENGER : Demande != best practice? -> Expliquer pourquoi
4. EDUQUER : Alternatives avec exemples concrets
5. ATTENDRE : Confirmation utilisateur AVANT de coder
6. IMPLEMENTER : Uniquement apres validation

EOF
fi

exit 0
