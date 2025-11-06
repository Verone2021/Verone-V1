# CONFIGURATIONS MONOREPO - TEMPLATES

**Date** : 2025-11-06  
**Objectif** : Templates de configuration pour migration monorepo Vérone

---

## 📦 STRUCTURE MONOREPO FINALE

```
verone-monorepo/
├── package.json                    # Root package
├── pnpm-workspace.yaml             # Workspace config
├── turbo.json                      # Turborepo config
├── .gitignore                      # Git ignore
├── README.md                       # README monorepo
├── packages/
│   ├── apps/
│   │   ├── backoffice/
│   │   │   ├── package.json
│   │   │   ├── next.config.js
│   │   │   ├── tailwind.config.ts
│   │   │   ├── tsconfig.json
│   │   │   └── src/
│   │   └── website/
│   │       ├── package.json
│   │       ├── next.config.js
│   │       ├── tailwind.config.ts
│   │       ├── tsconfig.json
│   │       └── src/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
└── docs/                           # Documentation racine
```

---

## 🔧 FICHIERS DE CONFIGURATION

### 1. package.json (Root)

```json
{
  "name": "@verone/monorepo",
  "version": "1.0.0",
  "private": true,
  "description": "Vérone Monorepo - Back-Office + Website + Shared Packages",
  "workspaces": [
    "packages/*",
    "packages/apps/*",
    "packages/shared/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "prettier": "^3.6.2",
    "turbo": "^2.0.0",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### 2. pnpm-workspace.yaml

```yaml
packages:
  # Apps
  - 'packages/apps/*'
  
  # Shared packages
  - 'packages/shared'
  - 'packages/shared/*'
  
  # Exclude patterns
  - '!**/node_modules'
  - '!**/.next'
  - '!**/dist'
```

### 3. turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"],
      "env": [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "NODE_ENV"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 4. .gitignore (Root)

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Next.js
.next/
out/
build/
dist/

# Turbo
.turbo/

# Environment
.env
.env.local
.env.*.local
!.env.example

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
pnpm-debug.log*

# Misc
*.tsbuildinfo
.eslintcache
```

---

## 📦 PACKAGES CONFIGURATIONS

### packages/shared/package.json

```json
{
  "name": "@verone/shared",
  "version": "1.0.0",
  "description": "Shared components, hooks, utils for Vérone apps",
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./components/ui": {
      "import": "./dist/components/ui/index.mjs",
      "require": "./dist/components/ui/index.js",
      "types": "./dist/components/ui/index.d.ts"
    },
    "./components/business": {
      "import": "./dist/components/business/index.mjs",
      "require": "./dist/components/business/index.js",
      "types": "./dist/components/business/index.d.ts"
    },
    "./design-system": {
      "import": "./dist/design-system/index.mjs",
      "require": "./dist/design-system/index.js",
      "types": "./dist/design-system/index.d.ts"
    },
    "./hooks": {
      "import": "./dist/hooks/index.mjs",
      "require": "./dist/hooks/index.js",
      "types": "./dist/hooks/index.d.ts"
    },
    "./utils": {
      "import": "./dist/utils/index.mjs",
      "require": "./dist/utils/index.js",
      "types": "./dist/utils/index.d.ts"
    },
    "./providers": {
      "import": "./dist/providers/index.mjs",
      "require": "./dist/providers/index.js",
      "types": "./dist/providers/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist .turbo node_modules"
  },
  "peerDependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "dependencies": {
    "@radix-ui/react-accordion": "^1.2.12",
    "@radix-ui/react-alert-dialog": "^1.1.15",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-collapsible": "^1.1.12",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.15",
    "@radix-ui/react-scroll-area": "^1.2.10",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "@radix-ui/react-tooltip": "^1.2.8",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.309.0",
    "tailwind-merge": "^2.2.1",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "eslint": "^8.56.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.3"
  }
}
```

### packages/shared/tsconfig.json

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

### packages/apps/backoffice/package.json

```json
{
  "name": "@verone/backoffice",
  "version": "1.0.0",
  "private": true,
  "description": "Vérone Back-Office - CRM/ERP Management Interface",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next .turbo node_modules"
  },
  "dependencies": {
    "@verone/shared": "workspace:*",
    "@supabase/ssr": "^0.7.0",
    "@supabase/supabase-js": "^2.57.4",
    "@tanstack/react-query": "^5.20.1",
    "@tanstack/react-table": "^8.21.3",
    "@hookform/resolvers": "^5.2.2",
    "exceljs": "^4.4.0",
    "jspdf": "^3.0.3",
    "next": "^15.2.2",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "react-hook-form": "^7.64.0",
    "recharts": "^3.2.1",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^20.11.17",
    "@types/react": "^18.2.55",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.3",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

### packages/apps/backoffice/tsconfig.json

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "ES2020"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@verone/shared": ["../../shared/src"],
      "@verone/shared/*": ["../../shared/src/*"]
    },
    "target": "ES2020"
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### packages/apps/website/package.json (Futur)

```json
{
  "name": "@verone/website",
  "version": "1.0.0",
  "private": true,
  "description": "Vérone Website - Public E-commerce Site",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf .next .turbo node_modules"
  },
  "dependencies": {
    "@verone/shared": "workspace:*",
    "@tanstack/react-query": "^5.20.1",
    "next": "^15.2.2",
    "react": "18.3.1",
    "react-dom": "18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.17",
    "@types/react": "^18.2.55",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "eslint-config-next": "^15.0.3",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3"
  }
}
```

---

## 🔧 CONFIGURATIONS PARTAGÉES

### tsconfig.base.json (Root)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Vérone Monorepo Base",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true
  },
  "exclude": [
    "node_modules"
  ]
}
```

### .prettierrc (Root)

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### .eslintrc.json (Root)

```json
{
  "root": true,
  "extends": [
    "next/core-web-vitals",
    "prettier"
  ],
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

---

## 📝 README.md (Root Monorepo)

```markdown
# Vérone Monorepo

CRM/ERP modulaire pour décoration et mobilier d'intérieur haut de gamme.

## 📦 Structure

```
verone-monorepo/
├── packages/
│   ├── apps/
│   │   ├── backoffice/    # Back-office admin (Next.js 15)
│   │   └── website/       # Site public e-commerce (Next.js 15)
│   └── shared/            # Code partagé (components, hooks, utils)
└── docs/                  # Documentation
```

## 🚀 Quick Start

### Prérequis

- Node.js >= 18
- pnpm >= 9.0.0

### Installation

```bash
# Installer pnpm (si pas déjà installé)
npm install -g pnpm

# Installer dépendances
pnpm install
```

### Développement

```bash
# Lancer tous les apps en dev
pnpm dev

# Lancer uniquement back-office
pnpm --filter @verone/backoffice dev

# Lancer uniquement website
pnpm --filter @verone/website dev
```

### Build

```bash
# Build tous les packages
pnpm build

# Build uniquement back-office
pnpm --filter @verone/backoffice build
```

### Lint & Type-check

```bash
# Lint tous les packages
pnpm lint

# Type-check tous les packages
pnpm type-check
```

## 📦 Packages

### @verone/shared

Code partagé entre back-office et website :
- Composants UI (shadcn/ui)
- Design System
- Hooks
- Utils
- Providers

### @verone/backoffice

Application back-office admin/gestion :
- Dashboard analytics
- Gestion produits/stocks
- CRM
- Commandes/factures
- Finance/trésorerie

### @verone/website (Futur)

Site public e-commerce :
- Catalogue produits
- Panier/Checkout
- Compte client

## 🔧 Technologies

- **Framework** : Next.js 15 (App Router)
- **UI** : shadcn/ui + Radix UI + Tailwind CSS
- **Database** : Supabase (PostgreSQL)
- **State** : TanStack Query
- **Forms** : React Hook Form + Zod
- **Monorepo** : pnpm workspaces + Turborepo

## 📚 Documentation

Voir `/docs` pour documentation complète :
- Architecture monorepo
- Guide migration
- Standards de code
- Workflows

## 🤝 Contribution

1. Créer branche feature
2. Commit changements
3. Tests (type-check, build, lint)
4. Créer PR

## 📄 License

Proprietary - Vérone 2025
```

---

## 🚀 COMMANDES UTILES MONOREPO

### Développement

```bash
# Dev tous les apps
pnpm dev

# Dev app spécifique
pnpm --filter @verone/backoffice dev
pnpm --filter @verone/website dev

# Dev shared package (watch mode)
pnpm --filter @verone/shared dev
```

### Build

```bash
# Build tous
pnpm build

# Build app spécifique
pnpm --filter @verone/backoffice build

# Build avec dépendances
pnpm --filter @verone/backoffice... build
```

### Tests

```bash
# Type-check tous
pnpm type-check

# Type-check app spécifique
pnpm --filter @verone/backoffice type-check

# Lint tous
pnpm lint
```

### Nettoyage

```bash
# Clean tous node_modules + builds
pnpm clean

# Clean app spécifique
pnpm --filter @verone/backoffice clean
```

### Ajout dépendances

```bash
# Ajouter dépendance au root
pnpm add -w <package>

# Ajouter dépendance à un package
pnpm --filter @verone/backoffice add <package>

# Ajouter dépendance dev
pnpm --filter @verone/backoffice add -D <package>

# Ajouter workspace package (lien interne)
pnpm --filter @verone/backoffice add @verone/shared@workspace:*
```

### Mise à jour

```bash
# Update toutes dépendances
pnpm update --recursive

# Update dépendance spécifique
pnpm update <package> --recursive
```

---

## ✅ CHECKLIST SETUP MONOREPO

### Phase 0: Création Structure

- [ ] Créer dossier `verone-monorepo/`
- [ ] Créer `package.json` root
- [ ] Créer `pnpm-workspace.yaml`
- [ ] Créer `turbo.json`
- [ ] Créer `tsconfig.base.json`
- [ ] Créer `.gitignore`
- [ ] Créer `.prettierrc`
- [ ] Créer `.eslintrc.json`
- [ ] Créer `README.md`

### Phase 1: Setup Shared Package

- [ ] Créer `packages/shared/`
- [ ] Créer `packages/shared/package.json`
- [ ] Créer `packages/shared/tsconfig.json`
- [ ] Créer structure `src/` (components, hooks, utils...)
- [ ] Installer dépendances : `pnpm install`

### Phase 2: Setup Backoffice App

- [ ] Créer `packages/apps/backoffice/`
- [ ] Créer `packages/apps/backoffice/package.json`
- [ ] Créer `packages/apps/backoffice/tsconfig.json`
- [ ] Ajouter dépendance shared : `pnpm add @verone/shared@workspace:*`
- [ ] Copier Next.js config
- [ ] Copier Tailwind config
- [ ] Installer dépendances

### Phase 3: Validation

- [ ] Installer toutes dépendances : `pnpm install`
- [ ] Build shared : `pnpm --filter @verone/shared build`
- [ ] Dev backoffice : `pnpm --filter @verone/backoffice dev`
- [ ] Type-check : `pnpm type-check`
- [ ] Build tous : `pnpm build`

### Phase 4: Migration Code

- [ ] Migrer Design System → shared
- [ ] Migrer Utils → shared
- [ ] Migrer Composants UI → shared
- [ ] Migrer Hooks → shared
- [ ] Migrer App Back-office
- [ ] Mettre à jour imports

### Phase 5: Tests & Validation

- [ ] Tests type-check OK
- [ ] Build successful
- [ ] Console 0 errors
- [ ] Tests E2E critiques OK
- [ ] Performance SLO respectés

---

**Prochaines étapes** :
1. Créer structure monorepo vide
2. Configurer outils (pnpm, Turborepo)
3. Migrer packages par phase

**Date** : 2025-11-06  
**Auteur** : Claude Code
