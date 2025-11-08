# @verone/eslint-config

Configuration ESLint stricte partagée pour le monorepo Vérone.

## 🎯 Caractéristiques

- ✅ **TypeScript Strict Mode** : `plugin:@typescript-eslint/recommended`
- ✅ **Next.js** : `next/core-web-vitals`
- ✅ **Storybook** : `plugin:storybook/recommended`
- ✅ **Prettier** : `plugin:prettier/recommended` (désactive conflits)
- ✅ **Naming conventions** strictes
- ✅ **Import organization** automatique
- ✅ **Overrides** pour tests, configs, scripts

## 📦 Installation

```bash
npm install --save-dev @verone/eslint-config
```

**Peer dependencies** (déjà installées dans le monorepo) :

- `eslint ^8.57.0`
- `eslint-config-next ^15.0.0`
- `eslint-config-prettier ^9.0.0`
- `eslint-plugin-prettier ^5.0.0`
- `eslint-plugin-storybook ^9.0.0`
- `prettier ^3.0.0`
- `typescript ^5.0.0`

## 🚀 Usage

Créer `.eslintrc.json` :

```json
{
  "extends": "@verone/eslint-config"
}
```

C'est tout ! Toutes les règles strictes sont activées par défaut.

## 📋 Règles Principales

### TypeScript Strict

- `@typescript-eslint/no-explicit-any`: `error`
- `@typescript-eslint/explicit-function-return-type`: `warn`
- `@typescript-eslint/consistent-type-imports`: `error`
- `@typescript-eslint/no-floating-promises`: `error`

### React & Next.js

- `react-hooks/rules-of-hooks`: `error`
- `@next/next/no-img-element`: `error`
- `react/self-closing-comp`: `error`

### Code Quality

- `prefer-const`: `error`
- `no-var`: `error`
- `no-console`: `warn` (autorise `warn` et `error`)
- `no-debugger`: `error`

### Prettier Integration

- Formatage automatique via ESLint
- Conflits désactivés automatiquement

## 🔧 Overrides

### Fichiers de tests

```typescript
// any autorisé, console.log autorisé
// **/*.test.ts, **/*.spec.ts
```

### Fichiers de config

```typescript
// require() autorisé, export default anonyme autorisé
// *.config.ts, *.config.js
```

### Scripts

```typescript
// console.log autorisé, any en warning
// scripts/**/*.ts
```

## 📚 Documentation

Voir [CLAUDE.md](../../../CLAUDE.md) pour le workflow complet.

## 🔄 Versions

- **1.0.0** : Configuration initiale (2025-11-07)
  - TypeScript strict mode
  - Prettier integration
  - Next.js + Storybook
  - Naming conventions

## 👨‍💻 Auteur

Romeo Dos Santos - Vérone Back Office Team
