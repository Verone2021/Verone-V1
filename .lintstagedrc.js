module.exports = {
  '*.{ts,tsx}': ['prettier --write', 'eslint --no-warn-ignored --fix'],
  '*.{js,jsx,json,md,yml,yaml}': ['prettier --write'],
};
