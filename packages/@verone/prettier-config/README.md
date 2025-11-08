# @verone/prettier-config

Configuration Prettier recommandée pour le monorepo Vérone.

## 🎯 Caractéristiques

- ✅ **Semi-colons** : Activés (consistency)
- ✅ **Single quotes** : Activées (lisibilité)
- ✅ **Print width** : 80 caractères (lisibilité)
- ✅ **Tab width** : 2 espaces (standard JS/TS)
- ✅ **Arrow parens** : Évités si possible (concision)
- ✅ **End of line** : LF (Unix standard)
- ✅ **Trailing commas** : ES5 (compatibilité)

## 📦 Installation

```bash
npm install --save-dev @verone/prettier-config
```

**Peer dependency** :

- `prettier ^3.0.0`

## 🚀 Usage

### Option 1 : Package.json (Recommandé)

Ajouter dans `package.json` :

```json
{
  "prettier": "@verone/prettier-config"
}
```

### Option 2 : .prettierrc.json

Créer `.prettierrc.json` :

```json
"@verone/prettier-config"
```

### Option 3 : Étendre la config

Créer `.prettierrc.json` :

```json
{
  "...": "@verone/prettier-config",
  "printWidth": 100
}
```

## 📋 Configuration Complète

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "proseWrap": "preserve",
  "htmlWhitespaceSensitivity": "css",
  "embeddedLanguageFormatting": "auto",
  "quoteProps": "as-needed"
}
```

## 🔧 Scripts Recommandés

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

## 🚫 .prettierignore

Créer `.prettierignore` :

```
node_modules
.next
dist
build
*.generated.ts
src/types/supabase.ts
.pnpm-store
```

## 📚 Documentation

Voir [CLAUDE.md](../../../CLAUDE.md) pour le workflow complet.

## 🔄 Versions

- **1.0.0** : Configuration initiale (2025-11-07)
  - Configuration recommandée 2025
  - Compatibilité ESLint + Prettier
  - Support monorepo

## 👨‍💻 Auteur

Romeo Dos Santos - Vérone Back Office Team
