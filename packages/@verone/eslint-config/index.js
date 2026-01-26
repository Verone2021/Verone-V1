/**
 * @verone/eslint-config
 *
 * DEPRECATED: Ce package est obsolete depuis la migration vers ESLint 9 Flat Config.
 *
 * La configuration ESLint est maintenant centralisee dans `/eslint.config.mjs`
 * a la racine du monorepo.
 *
 * Ce fichier existe uniquement pour la retrocompatibilite.
 * Il sera supprime dans une version future.
 *
 * @deprecated Utilisez eslint.config.mjs a la racine du projet
 */

console.warn(
  '\x1b[33m[DEPRECATED] @verone/eslint-config est obsolete.\n' +
    'La configuration ESLint est maintenant dans /eslint.config.mjs\x1b[0m'
);

// Export vide pour retrocompatibilite (eslintrc format)
module.exports = {
  rules: {},
};
