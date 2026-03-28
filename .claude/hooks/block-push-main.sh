#!/bin/bash
# ============================================================
# block-push-main.sh — Bloque push/commit/PR sur main
# ============================================================
# Tout doit passer par staging. Jamais de push direct sur main.
# Exit 2 = BLOQUE. Exit 0 = autorise.
# ============================================================

INPUT=$(cat 2>/dev/null || echo "")
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

if [ -z "$COMMAND" ]; then
  COMMAND="${TOOL_INPUT:-}"
fi

if [ -z "$COMMAND" ]; then
  exit 0
fi

# --- Bloquer push sur main/master ---
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*\b(main|master)\b'; then
  echo "BLOQUE: Push sur main/master INTERDIT." >&2
  echo "" >&2
  echo "Workflow: feature-branch -> PR --base staging -> validation -> main" >&2
  echo "Utilise: git push origin <feature-branch>" >&2
  exit 2
fi

# --- Bloquer commit sur main/master ---
BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
if echo "$COMMAND" | grep -qE 'git\s+commit' && { [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; }; then
  echo "BLOQUE: Commit sur $BRANCH INTERDIT." >&2
  echo "" >&2
  echo "Cree une feature branch: git checkout -b feat/APP-DOMAIN-NNN-description" >&2
  exit 2
fi

# --- Bloquer PR vers main ---
if echo "$COMMAND" | grep -qE 'gh\s+pr\s+create.*--base\s+main'; then
  echo "BLOQUE: PR vers main INTERDITE." >&2
  echo "" >&2
  echo "Les PRs doivent cibler staging: gh pr create --base staging" >&2
  exit 2
fi

# --- Bloquer merge de PR ---
if echo "$COMMAND" | grep -qE 'gh\s+pr\s+merge'; then
  echo "BLOQUE: Merge de PR INTERDIT pour les agents." >&2
  echo "" >&2
  echo "Seul Romeo decide quand merger. Attendre son autorisation." >&2
  exit 2
fi

# --- Bloquer --no-verify ---
if echo "$COMMAND" | grep -qE '\-\-no-verify'; then
  echo "BLOQUE: --no-verify INTERDIT." >&2
  echo "" >&2
  echo "Corrige les erreurs au lieu de les contourner." >&2
  exit 2
fi

# --- Bloquer force push (sauf --force-with-lease) ---
if echo "$COMMAND" | grep -qE 'git\s+push\s+.*--force\b' \
  && ! echo "$COMMAND" | grep -qE '\-\-force-with-lease'; then
  echo "BLOQUE: git push --force INTERDIT." >&2
  echo "" >&2
  echo "Utilise --force-with-lease si absolument necessaire." >&2
  exit 2
fi

# --- Bloquer git reset --hard ---
if echo "$COMMAND" | grep -qE 'git\s+reset\s+--hard'; then
  echo "BLOQUE: git reset --hard detruit le travail non commite." >&2
  echo "" >&2
  echo "Utilise git stash ou git reset --soft." >&2
  exit 2
fi

# --- Bloquer git clean -f ---
if echo "$COMMAND" | grep -qE 'git\s+clean\s+.*-[a-zA-Z]*f'; then
  echo "BLOQUE: git clean -f supprime les fichiers non suivis." >&2
  echo "" >&2
  echo "Utilise git clean -n (dry run) d abord." >&2
  exit 2
fi

exit 0
