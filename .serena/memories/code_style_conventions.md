# Code Style & Conventions Vérone

## 📝 Formatting (Prettier)
```json
{
  "semi": true,
  "trailingComma": "es5", 
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "jsxBracketSameLine": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

## 🔍 Linting (ESLint)
- **Extends** : next/core-web-vitals + @typescript-eslint/recommended + prettier
- **Parser** : @typescript-eslint/parser (ECMAScript 2021, JSX support)
- **Key Rules** :
  - `prettier/prettier`: "error" (Prettier formatting enforced)
  - `@typescript-eslint/no-unused-vars`: "error"
  - `@typescript-eslint/no-explicit-any`: "warn" (avoid any types)
  - `react/react-in-jsx-scope`: "off" (React 18 automatic import)
  - `import/order`: Enforced with groups (builtin, external, internal, parent, sibling, index)

## 📦 Import Organization
1. **builtin** : Node.js core modules
2. **external** : npm packages  
3. **internal** : Monorepo packages (@verone/*)
4. **parent** : ../components, ../lib
5. **sibling** : ./component, ./utils
6. **index** : ./index

## 🏗️ TypeScript Guidelines
- **Strict Mode** : TypeScript 5.3.3 avec configuration stricte
- **Function Return Types** : Off (inférence automatique préférée)
- **Module Boundary Types** : Off (flexibilité composants)
- **No Any** : Warning (éviter any, préférer unknown ou types spécifiques)

## 📁 Naming Conventions
- **Files** : kebab-case pour fichiers (product-form.tsx)
- **Components** : PascalCase (ProductForm)
- **Variables/Functions** : camelCase (formatPrice, isValidEmail)
- **Constants** : SCREAMING_SNAKE_CASE (VERONE_SLOS)
- **Types/Interfaces** : PascalCase avec suffixe approprié (ProductFormData, ApiResponse)

## 🎯 Component Patterns
- **Shared UI** : Composants réutilisables dans packages/shared-ui/
- **Business Components** : Composants métier spécifiques dans apps/
- **Hooks** : Custom hooks préfixés use- (useProductForm, useSupabaseClient)
- **Utilities** : Pure functions dans packages/utils/ ou lib/

## 🔧 Git Hooks (lint-staged)
**Pre-commit automatique** :
- **JS/TS files** : ESLint --fix + Prettier --write
- **JSON/MD files** : Prettier --write uniquement