/**
 * Lint-staged Configuration
 *
 * Runs linting and formatting on staged files before commit.
 *
 * Strategy (Ratchet Effect Progressif - Migration Mode):
 * - ESLint auto-fixes what it can
 * - Progressive Ratchet: ALLOWS commit if warnings DECREASE or STABLE (not forced to 0)
 * - Baseline tracking: .eslint-baseline.json stores current warnings per file
 * - BLOCKS commit if warnings INCREASE (regression protection)
 * - Forces gradual improvement: can't make it worse, encouraged to make it better
 * - Post-migration: Will revert to strict --max-warnings=0 once 0 warnings achieved
 *
 * @see scripts/eslint-ratchet-progressive.sh
 * @see docs/current/eslint-progressive-ratchet.md
 * @see https://martinfowler.com/articles/qa-in-production.html#ratcheting
 */
const config = {
  // TypeScript/JavaScript files - PROGRESSIVE RATCHET EFFECT (MIGRATION MODE)
  '**/*.{ts,tsx,js,jsx}': [
    // Auto-fix what ESLint can; exit 0 regardless so ratchet handles the gate decision
    files =>
      `bash -c 'eslint --fix ${files.map(f => `"${f}"`).join(' ')} || true'`,
    'bash scripts/eslint-ratchet-progressive.sh', // Progressive validation (allows reduction, blocks increase)
    'prettier --write',
  ],
  // JSON/Markdown
  '**/*.{json,md}': ['prettier --write'],
};

export default config;
