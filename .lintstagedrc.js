module.exports = {
  '*.{ts,tsx}': [
    'prettier --write',
    'eslint --max-warnings=0 --no-warn-ignored --fix',
  ],
  '*.{js,jsx,json,md,yml,yaml}': ['prettier --write'],
};
