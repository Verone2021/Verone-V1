/**
 * Lint-staged Configuration
 *
 * Runs linting and formatting on staged files before commit.
 *
 * Strategy:
 * - ESLint ERRORS (async bugs) will BLOCK commits
 * - ESLint WARNINGS (type-safety) are tolerated during gradual migration
 * - Prettier formats all files
 *
 * @see https://github.com/lint-staged/lint-staged
 */
export default {
  // TypeScript/JavaScript files
  '**/*.{ts,tsx,js,jsx}': [
    'eslint --fix', // Fix what can be fixed, block ERRORS only
    'prettier --write',
  ],
  // JSON/Markdown
  '**/*.{json,md}': ['prettier --write'],
};
