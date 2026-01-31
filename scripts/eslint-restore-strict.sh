#!/bin/bash
# ESLint - Restaurer Mode Strict
#
# Une fois 0 warnings atteint globalement, ce script restaure
# le mode strict original (--max-warnings=0) dans .lintstagedrc.js
#
# Usage: bash scripts/eslint-restore-strict.sh

set -e

echo "🔍 Vérification finale des warnings ESLint..."
echo ""

# Compter warnings globalement
LINT_OUTPUT=$(pnpm lint 2>&1 || true)
echo "$LINT_OUTPUT"
echo ""

# Extraire nombre de warnings
WARNING_COUNT=$(echo "$LINT_OUTPUT" | grep -oE '[0-9]+ warnings' | grep -oE '[0-9]+' | head -1 || echo "999")

if [ "$WARNING_COUNT" -eq 0 ]; then
  echo "✅ 0 warnings atteint ! Restauration du mode strict..."
  echo ""

  # Restaurer .lintstagedrc.js au mode strict
  cat > .lintstagedrc.js << 'EOF'
/**
 * Lint-staged Configuration
 *
 * Runs linting and formatting on staged files before commit.
 *
 * Strategy (Ratchet Effect - STRICT MODE):
 * - ESLint auto-fixes what it can
 * - BLOCKS commit if ANY warnings remain on modified files (--max-warnings=0)
 * - Forces "Boy Scout Rule": modified files MUST be cleaner after edit
 * - Prevents technical debt from EVER increasing
 * - Prettier formats all files
 *
 * @see https://github.com/lint-staged/lint-staged
 * @see https://eslint.org/docs/latest/use/command-line-interface#--max-warnings
 * @see https://martinfowler.com/articles/qa-in-production.html#ratcheting
 */
const config = {
  // TypeScript/JavaScript files - RATCHET EFFECT ENABLED (STRICT)
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix', // Fix what can be fixed automatically
    'eslint --max-warnings=0', // BLOCK if warnings remain (Ratchet Effect)
    'prettier --write',
  ],
  // JSON/Markdown
  '**/*.{json,md}': ['prettier --write'],
};

export default config;
EOF

  # Supprimer baseline (plus nécessaire)
  if [ -f ".eslint-baseline.json" ]; then
    rm -f .eslint-baseline.json
    echo "🗑️  Baseline supprimée (.eslint-baseline.json)"
  fi

  # Supprimer script progressif (plus nécessaire)
  if [ -f "scripts/eslint-ratchet-progressive.sh" ]; then
    rm -f scripts/eslint-ratchet-progressive.sh
    echo "🗑️  Script progressif supprimé"
  fi

  # Stage changements
  git add .lintstagedrc.js .gitignore

  echo ""
  echo "✅ Configuration restaurée au mode strict (--max-warnings=0)"
  echo ""
  echo "📝 Prêt à commit:"
  echo "   git commit -m \"[NO-TASK] chore: restore strict ESLint ratchet (0 warnings achieved)\""
  echo ""
  echo "🎉 Migration ESLint terminée avec succès !"

else
  echo "❌ Des warnings restent ($WARNING_COUNT warnings détectés)"
  echo ""
  echo "Continuer la migration ESLint avant de restaurer le mode strict."
  echo "Voir .plans/eslint-5690-warnings-plan.md pour le plan de correction."
  exit 1
fi
