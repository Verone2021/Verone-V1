#!/usr/bin/env bash
set -euo pipefail

BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
TABLE_COUNT=$(grep -c "^## " docs/current/database/schema/00-SUMMARY.md 2>/dev/null || echo "?")
COMPONENT_COUNT=$(grep -c "| \`" docs/current/INDEX-COMPOSANTS-FORMULAIRES.md 2>/dev/null || echo "?")

cat << EOF
{"additionalContext": "RAPPELS CRITIQUES SESSION:
1. Branche: $BRANCH
2. Documentation DB: docs/current/database/schema/ ($TABLE_COUNT sections) — LIRE le fichier du domaine concerné AVANT tout travail DB
3. Index composants: docs/current/INDEX-COMPOSANTS-FORMULAIRES.md ($COMPONENT_COUNT composants) — LIRE AVANT de créer un composant
4. Carte dépendances: docs/current/DEPENDANCES-PACKAGES.md — LIRE AVANT de modifier les imports
5. RÈGLE ABSOLUE: Consulter la documentation AVANT de coder. Ne JAMAIS deviner la structure.
6. Si tu crées une migration SQL, exécuter après: python scripts/generate-db-docs.py"}
EOF
