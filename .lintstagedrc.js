/**
 * Lint-staged Configuration
 *
 * Runs linting and formatting on staged files before commit.
 *
 * Strategy (Ratchet Effect):
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
  // TypeScript/JavaScript files - RATCHET EFFECT ENABLED
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix', // Fix what can be fixed automatically
    'eslint --max-warnings=0', // BLOCK if warnings remain (Ratchet Effect)
    'prettier --write',
  ],
  // JSON/Markdown
  '**/*.{json,md}': ['prettier --write'],
};

export default config;
