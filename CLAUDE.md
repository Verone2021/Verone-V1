# 🚀 Vérone Back Office - Claude Code 2025

**CRM/ERP modulaire** pour décoration et mobilier d'intérieur haut de gamme
**Stack** : Next.js 15 (App Router) + Supabase + shadcn/ui

---

## 🎯 PHASE ACTUELLE : PHASE 4 - MULTI-FRONTENDS TURBOREPO ✅

**Date** : 2025-11-08
**État** : Production multi-frontends avec 25 packages partagés @verone/\*

### 🏗️ ARCHITECTURE TURBOREPO

**3 Applications Déployées** :

1. **back-office** (Port 3000) - CRM/ERP Complet
   - ✅ Authentification + Dashboard
   - ✅ Organisations & Contacts (customers, suppliers, partners)
   - ✅ Produits (catalogue, sourcing, variantes, packages)
   - ✅ Stocks (mouvements, alertes, inventaire, backorders)
   - ✅ Commandes (clients, fournisseurs, expéditions)
   - ✅ Finance (trésorerie, rapprochement bancaire)
   - ✅ Factures (clients, fournisseurs)
   - ✅ Canaux Vente (Google Merchant, prix clients)
   - ✅ Administration (users, activité)

2. **site-internet** (Port 3001) - E-commerce Public
   - ✅ Catalogue produits avec filtres
   - ✅ Pages produits détaillées
   - ✅ Panier & Checkout
   - ✅ Compte client

3. **linkme** (Port 3002) - Commissions Apporteurs
   - ✅ Suivi ventes apportées
   - ✅ Calcul commissions
   - ✅ Statistiques performances

**25 Packages Partagés** (@verone/\*) :

- `@verone/ui` : 54 composants Design System (Button, Dialog, Card, KPI...)
- `@verone/products` : 32 composants produits (ProductThumbnail, ProductCard...)
- `@verone/orders`, `@verone/stock`, `@verone/customers`, `@verone/suppliers`
- `@verone/categories`, `@verone/collections`, `@verone/channels`
- `@verone/dashboard`, `@verone/notifications`, `@verone/admin`
- `@verone/types`, `@verone/utils`, `@verone/testing`
- Plus 10 autres packages métiers

**Chiffres Clés Phase 4** :

- 🏗️ **25 packages** @verone/\* partagés (Turborepo monorepo)
- 🎨 **86 composants** React documentés (54 UI + 32 Products)
- 📦 **3 apps** déployées (back-office, site-internet, linkme)
- 🗄️ **78 tables** database (schema stable)
- 🔧 **158 triggers** automatiques
- 🛡️ **239 RLS policies** sécurité

### ✅ TOUS MODULES ACTIFS (Production)

**AUCUN module désactivé** - Tous les modules sont en production et accessibles après authentification.

---

## 🏗️ ARCHITECTURE MULTI-FRONTENDS - ISOLATION UI

**RÈGLE ABSOLUE** : Chaque app possède ses propres composants UI, styles, et charte graphique. **Aucun mélange autorisé entre apps.**

### 🎯 TROIS APPLICATIONS DISTINCTES

**Configuration Architecture** :

| Application       | Port | Domaine Futur         | Charte Graphique                                                 | Package UI Dédié        |
| ----------------- | ---- | --------------------- | ---------------------------------------------------------------- | ----------------------- |
| **back-office**   | 3000 | backoffice.verone.com | CRM/ERP haut de gamme (Fonts: Monarch, Balgin / Colors: #000000) | `@verone/ui-backoffice` |
| **site-internet** | 3001 | verone.com            | E-commerce public (Fonts: Inter / Colors: #ef4444)               | `@verone/ui-site`       |
| **linkme**        | 3002 | linkme.verone.com     | Dashboard vendeurs (Fonts: Inter / Colors: #3b82f6)              | `@verone/ui-linkme`     |

**Base de Données Partagée** : Toutes les apps utilisent la même base Supabase via authentification/RLS, mais **code UI et design strictement séparés**.

---

### 📦 PACKAGES UI DÉDIÉS PAR APP (CRITIQUE - Priority P0)

**Problème Actuel** : `@verone/ui` avec 54 composants est partagé par TOUTES les apps → Risque de mélange styles.

**Solution Obligatoire** :

```typescript
// ARCHITECTURE PACKAGES UI
packages/@verone/
├── ui/                    // ✅ Composants BASE vraiment partagés uniquement
│   ├── button.tsx         //    (Button, Input, Dialog, Select, Checkbox...)
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...                //    MAX 15-20 composants génériques
│
├── ui-backoffice/         // 🏢 Composants back-office CRM/ERP
│   ├── kpi-card-unified.tsx
│   ├── dashboard-widget.tsx
│   ├── admin-table.tsx
│   └── ...
│
├── ui-site/               // 🛍️ Composants site-internet e-commerce
│   ├── product-card-ecommerce.tsx
│   ├── cart-button.tsx
│   ├── checkout-form.tsx
│   └── ...
│
└── ui-linkme/             // 💼 Composants linkme affiliation
    ├── commission-card.tsx
    ├── vendor-stats.tsx
    └── ...
```

**Règles Import Strictes** :

```typescript
// ✅ CORRECT - back-office
import { Button } from '@verone/ui'; // Composant shared OK
import { KpiCardUnified } from '@verone/ui-backoffice'; // Composant back-office OK

// ❌ INTERDIT - site-internet
import { KpiCardUnified } from '@verone/ui-backoffice'; // ERREUR ESLint bloquante!

// ✅ CORRECT - site-internet
import { Button } from '@verone/ui'; // Composant shared OK
import { ProductCardEcommerce } from '@verone/ui-site'; // Composant site OK
```

**Composants @verone/ui BASE (Shared Uniquement)** :

```typescript
// ✅ LISTE EXHAUSTIVE Composants Vraiment Partagés
@verone/ui:
- Button, Input, Textarea, Label
- Select, Checkbox, Radio, Switch
- Dialog, Popover, Dropdown, Tooltip, Alert
- Card (basique sans branding), Separator, Table
- Form components (FormField, FormMessage, FormLabel)

// ❌ Tout le Reste → Créer dans @verone/ui-{app}
// Exemples composants APP-SPECIFIC:
- KpiCardUnified → @verone/ui-backoffice
- ProductThumbnail → @verone/ui-backoffice (catalogue CRM)
- ProductCardEcommerce → @verone/ui-site
- CommissionCard → @verone/ui-linkme
```

---

### 🎨 TAILWIND CONFIG ISOLATION (CRITIQUE - Priority P0)

**Problème** : 3 apps utilisent classes Tailwind identiques → Conflits CSS garantis (`bg-primary` défini 3 fois différemment).

**Solution Obligatoire : PREFIX PAR APP** :

```javascript
// apps/back-office/tailwind.config.js
module.exports = {
  prefix: 'bo-', // ✅ OBLIGATOIRE
  presets: [require('@verone/tailwind-preset')],
  theme: {
    extend: {
      colors: {
        primary: '#000000', // Noir haut de gamme
      },
      fontFamily: {
        logo: ['Balgin Light SM Expanded', 'serif'],
        heading: ['Monarch Regular', 'serif'],
        body: ['Fieldwork 10 Geo Regular', 'sans-serif'],
      },
    },
  },
};

// apps/site-internet/tailwind.config.js
module.exports = {
  prefix: 'site-', // ✅ OBLIGATOIRE
  presets: [require('@verone/tailwind-preset')],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#ef4444' }, // Rouge e-commerce
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};

// apps/linkme/tailwind.config.js
module.exports = {
  prefix: 'lm-', // ✅ OBLIGATOIRE
  presets: [require('@verone/tailwind-preset')],
  theme: {
    extend: {
      colors: {
        primary: { 500: '#3b82f6' }, // Bleu vendeurs
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
};
```

**Usage Classes Tailwind** :

```tsx
// ✅ CORRECT - back-office
<div className="bo-bg-primary bo-text-white bo-font-heading">
  Dashboard CRM
</div>

// ✅ CORRECT - site-internet
<div className="site-bg-primary-500 site-text-white site-font-sans">
  Boutique en ligne
</div>

// ❌ INTERDIT - Classes non-préfixées dans composants app-specific
<div className="bg-primary text-white">  // ERREUR: Conflit entre apps!
```

**Shared Tailwind Preset** :

```javascript
// packages/@verone/tailwind-preset/index.js
module.exports = {
  theme: {
    extend: {
      spacing: {
        // Spacing commun à toutes apps
      },
      boxShadow: {
        // Shadows communs
      },
      borderRadius: {
        // Borders communs
      },
    },
  },
};
```

---

### 🛡️ ESLINT NO-RESTRICTED-IMPORTS (CRITIQUE - Priority P0)

**Objectif** : Bloquer techniquement les imports cross-app avec ESLint.

**Configuration par App** :

```javascript
// apps/back-office/.eslintrc.js
module.exports = {
  extends: '@verone/eslint-config',
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@verone/ui-site', '@verone/ui-site/*'],
            message: '❌ INTERDIT: Composants site-internet dans back-office',
          },
          {
            group: ['@verone/ui-linkme', '@verone/ui-linkme/*'],
            message: '❌ INTERDIT: Composants linkme dans back-office',
          },
        ],
      },
    ],
  },
};

// apps/site-internet/.eslintrc.js
module.exports = {
  extends: '@verone/eslint-config',
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@verone/ui-backoffice', '@verone/ui-backoffice/*'],
            message: '❌ INTERDIT: Composants back-office dans site-internet',
          },
          {
            group: ['@verone/ui-linkme', '@verone/ui-linkme/*'],
            message: '❌ INTERDIT: Composants linkme dans site-internet',
          },
        ],
      },
    ],
  },
};

// apps/linkme/.eslintrc.js
module.exports = {
  extends: '@verone/eslint-config',
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@verone/ui-backoffice', '@verone/ui-backoffice/*'],
            message: '❌ INTERDIT: Composants back-office dans linkme',
          },
          {
            group: ['@verone/ui-site', '@verone/ui-site/*'],
            message: '❌ INTERDIT: Composants site-internet dans linkme',
          },
        ],
      },
    ],
  },
};
```

**Validation Build** : ESLint bloque le build si import interdit détecté.

---

### 🎨 DESIGN TOKENS ARCHITECTURE (Priority P1)

**Objectif** : Centraliser couleurs/fonts/spacing dans fichiers JSON, générer CSS Custom Properties par app.

**Structure** :

```
packages/@verone/design-tokens/
├── tokens-backoffice.json     # Monarch, Balgin, #000000
├── tokens-site.json           # Inter, #ef4444
├── tokens-linkme.json         # Inter, #3b82f6
└── tokens-shared.json         # Spacing, shadows communs
```

**Exemple tokens-backoffice.json** :

```json
{
  "color": {
    "primary": "#000000",
    "secondary": "#ffffff",
    "accent": "#d4af37"
  },
  "font": {
    "logo": "Balgin Light SM Expanded",
    "heading": "Monarch Regular",
    "body": "Fieldwork 10 Geo Regular"
  },
  "spacing": {
    "base": "8px",
    "lg": "16px"
  }
}
```

**Génération CSS Custom Properties** :

```css
/* apps/back-office/src/styles/tokens.css (auto-généré) */
:root {
  --bo-primary: #000000;
  --bo-secondary: #ffffff;
  --bo-font-heading: 'Monarch Regular';
  --bo-font-body: 'Fieldwork 10 Geo Regular';
}

/* apps/site-internet/src/styles/tokens.css */
:root {
  --site-primary: #ef4444;
  --site-font-sans: 'Inter';
}
```

**Usage** :

```tsx
<h1 style={{ fontFamily: 'var(--bo-font-heading)' }}>Back Office</h1>
<h1 style={{ fontFamily: 'var(--site-font-sans)' }}>Site Internet</h1>
```

---

### 📖 DOCUMENTATION COMPOSANTS [SHARED] vs [APP-ONLY] (Priority P1)

**Objectif** : Taguer TOUS les composants dans `COMPOSANTS-CATALOGUE.md` pour éviter confusion.

**Format Obligatoire** :

````markdown
## @verone/ui - Composants Shared

#### ButtonUnified [SHARED]

✅ **Utilisable dans** : back-office, site-internet, linkme
📦 **Package** : `@verone/ui`

```typescript
import { ButtonUnified } from '@verone/ui';
```
````

---

## @verone/ui-backoffice - Composants Back-Office

#### KpiCardUnified [BACKOFFICE-ONLY]

✅ **Utilisable dans** : back-office
❌ **INTERDIT dans** : site-internet, linkme
⚠️ **ESLint Rule** : Blocked by no-restricted-imports
📦 **Package** : `@verone/ui-backoffice`

```typescript
import { KpiCardUnified } from '@verone/ui-backoffice';
```

---

## @verone/ui-site - Composants Site Internet

#### ProductCardEcommerce [SITE-ONLY]

✅ **Utilisable dans** : site-internet
❌ **INTERDIT dans** : back-office, linkme
📦 **Package** : `@verone/ui-site`

````

**Workflow Claude** :

```typescript
// 1. Lire catalogue
Read('docs/architecture/COMPOSANTS-CATALOGUE.md');

// 2. Identifier tag [SHARED] ou [APP-ONLY]
// Exemple: KpiCardUnified [BACKOFFICE-ONLY]

// 3. Vérifier app cible
if (targetApp === 'site-internet' && component.tag === 'BACKOFFICE-ONLY') {
  throw new Error('❌ INTERDIT: KpiCardUnified est back-office-only');
}

// 4. Utiliser composant si autorisé
````

---

### 📚 STORYBOOK PAR APP (Priority P2)

**Objectif** : Séparer documentation UI par app pour éviter confusion.

**Option 1 : Storybook Dédié par App** :

```
apps/back-office/.storybook/
apps/site-internet/.storybook/
apps/linkme/.storybook/
```

**Option 2 : Storybook Unifié avec Filtres Tags** :

```typescript
// KpiCardUnified.stories.tsx
export default {
  title: 'Back-Office/KPI',
  component: KpiCardUnified,
  tags: ['backoffice-only'], // Filtre dans Storybook
};

// ButtonUnified.stories.tsx
export default {
  title: 'Shared/Button',
  component: ButtonUnified,
  tags: ['shared'], // Visible dans tous Storybooks
};
```

**Configuration Storybook** :

```javascript
// .storybook/main.js
module.exports = {
  stories: [
    '../packages/@verone/ui/**/*.stories.tsx', // Shared
    '../packages/@verone/ui-backoffice/**/*.stories.tsx', // Back-office only
  ],
  // Filtrer par tags dans UI
};
```

---

### 📦 PACKAGE.JSON DEPENDENCY CONSTRAINTS (Priority P2)

**Objectif** : Définir clairement quelles deps installer par app.

**Configuration** :

```json
// apps/back-office/package.json
{
  "name": "@verone/back-office",
  "dependencies": {
    "@verone/ui": "workspace:*",              // ✅ Composants shared
    "@verone/ui-backoffice": "workspace:*",   // ✅ Composants back-office
    "@verone/products": "workspace:*",        // ✅ Logic métier produits
    // ❌ NE JAMAIS installer @verone/ui-site ou @verone/ui-linkme
  }
}

// apps/site-internet/package.json
{
  "name": "@verone/site-internet",
  "dependencies": {
    "@verone/ui": "workspace:*",              // ✅ Composants shared
    "@verone/ui-site": "workspace:*",         // ✅ Composants site
    "@verone/products": "workspace:*",        // ✅ Logic métier produits
    // ❌ NE JAMAIS installer @verone/ui-backoffice ou @verone/ui-linkme
  }
}

// apps/linkme/package.json
{
  "name": "@verone/linkme",
  "dependencies": {
    "@verone/ui": "workspace:*",              // ✅ Composants shared
    "@verone/ui-linkme": "workspace:*",       // ✅ Composants linkme
    // ❌ NE JAMAIS installer @verone/ui-backoffice ou @verone/ui-site
  }
}
```

**Validation** : Script `scripts/validate-dependencies.ts` vérifie aucune dep cross-app.

---

### 🧪 BUILD VALIDATION SCRIPTS (Priority P3)

**Objectif** : Valider isolation UI AVANT chaque build.

**Script** : `scripts/validate-ui-isolation.ts`

```typescript
import { glob } from 'glob';
import fs from 'fs';

// 1. Vérifier imports par app
const backofficeFiles = await glob('apps/back-office/src/**/*.{ts,tsx}');
for (const file of backofficeFiles) {
  const content = fs.readFileSync(file, 'utf-8');

  // ❌ Bloquer imports cross-app
  if (
    content.includes('@verone/ui-site') ||
    content.includes('@verone/ui-linkme')
  ) {
    throw new Error(`❌ ERREUR: ${file} importe composants cross-app`);
  }
}

// 2. Vérifier classes Tailwind non-préfixées dans composants app-specific
const uiBackofficeFiles = await glob(
  'packages/@verone/ui-backoffice/src/**/*.{ts,tsx}'
);
for (const file of uiBackofficeFiles) {
  const content = fs.readFileSync(file, 'utf-8');

  // ❌ Bloquer classes non-préfixées
  if (content.match(/className="(?!bo-).*bg-primary/)) {
    throw new Error(
      `❌ ERREUR: ${file} utilise classes Tailwind non-préfixées`
    );
  }
}

// 3. Vérifier tokens design cross-app
// 4. Vérifier aucun conflit CSS Custom Properties
```

**Integration Turborepo** :

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["validate:ui-isolation", "^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "validate:ui-isolation": {
      "cache": false
    }
  }
}
```

**Commande** :

```bash
# Avant build
npm run validate:ui-isolation

# Build avec validation automatique
turbo build  # Exécute validate:ui-isolation d'abord
```

---

## ✅ CHECKLIST AVANT CRÉER/MODIFIER COMPOSANT UI

**Workflow Obligatoire** :

- [ ] **1. Identifier app cible** : back-office / site-internet / linkme ?
- [ ] **2. Consulter catalogue** : `Read('docs/architecture/COMPOSANTS-CATALOGUE.md')`
- [ ] **3. Vérifier si composant existe** dans `@verone/ui` (shared)
- [ ] **4. Si app-specific** : Créer dans `@verone/ui-{app}` correspondant
- [ ] **5. Utiliser prefix Tailwind correct** : `bo-`, `site-`, ou `lm-`
- [ ] **6. Taguer composant** : `[SHARED]` ou `[APP-ONLY]` dans documentation
- [ ] **7. Configurer ESLint** : Ajouter rule `no-restricted-imports` si besoin
- [ ] **8. Tester isolation** : Vérifier aucun import cross-app possible
- [ ] **9. Documenter props** : Ajouter au `COMPOSANTS-CATALOGUE.md`
- [ ] **10. Valider build** : `npm run validate:ui-isolation && turbo build`

---

## 🚨 RÈGLES D'OR ISOLATION MULTI-FRONTENDS

1. **Packages UI Dédiés** : 1 package par app (`ui-backoffice`, `ui-site`, `ui-linkme`)
2. **Tailwind Prefix** : Toujours préfixer classes (`bo-`, `site-`, `lm-`)
3. **ESLint Protection** : `no-restricted-imports` configuré dans toutes apps
4. **Documentation Taggée** : Tous composants `[SHARED]` ou `[APP-ONLY]`
5. **Design Tokens** : Couleurs/fonts centralisés dans fichiers JSON
6. **Build Validation** : Script `validate-ui-isolation` bloque build si erreur
7. **Storybook Filtré** : Stories taggées par app ou Storybook dédié
8. **Dependencies Strictes** : Aucune dep cross-app dans `package.json`
9. **Catalogue First** : TOUJOURS consulter catalogue AVANT créer composant
10. **Zero Tolerance** : 1 import cross-app = ÉCHEC COMPLET, retour correction

---

## 🔧 STACK TECHNIQUE

```typescript
Frontend  : Next.js 15 (App Router, RSC, Server Actions)
UI        : shadcn/ui + Radix UI + Tailwind CSS
Database  : Supabase (PostgreSQL + Auth + RLS)
Validation: Zod + React Hook Form
Testing   : Vitest + Playwright + Storybook
Monorepo  : Turborepo v2.6.0 + pnpm workspaces
Deploy    : Vercel (auto-deploy production-stable)
```

---

## 📦 PACKAGES @VERONE/\* - COMPOSANTS CATALOGUE

**RÈGLE ABSOLUE** : **TOUJOURS consulter le catalogue composants AVANT créer/utiliser composant**

### 🚨 WORKFLOW ANTI-HALLUCINATION OBLIGATOIRE

```typescript
// ÉTAPE 1 : Consulter catalogue AVANT tout
Read('docs/architecture/COMPOSANTS-CATALOGUE.md');

// ÉTAPE 2 : Chercher composant existant (Ctrl+F dans catalogue)
// Exemple : "Je cherche un composant pour afficher miniature produit"
// → Trouver "ProductThumbnail" dans catalogue

// ÉTAPE 3 : Vérifier props TypeScript EXACTES dans catalogue
interface ProductThumbnailProps {
  src: string | null | undefined;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  priority?: boolean;
}

// ÉTAPE 4 : Si besoin détails supplémentaires, consulter source
mcp__serena__get_symbols_overview('packages/@verone/products/src/components/images/ProductThumbnail.tsx');

// ÉTAPE 5 : Utiliser composant avec props exactes
<ProductThumbnail
  src={product.primary_image_url}
  alt={product.name}
  size="md"
/>
```

### ⚠️ RÈGLES STRICTES

**❌ INTERDIT :**

- Créer composant SANS vérifier catalogue (ex: créer `ProductImage` alors que `ProductThumbnail` existe)
- Inventer props inexistantes (ex: `<ProductThumbnail variant="rounded" />` alors que prop `variant` n'existe pas)
- Dupliquer code UI déjà dans @verone/ui (ex: créer bouton custom alors que `ButtonUnified` existe)
- Oublier imports depuis packages (ex: `import { Button } from '../components/ui/button'` au lieu de `import { Button } from '@verone/ui'`)

**✅ OBLIGATOIRE :**

- Lire `docs/architecture/COMPOSANTS-CATALOGUE.md` EN PREMIER
- Utiliser composants existants @verone/\* (86 composants documentés)
- Respecter props TypeScript exactes (pas d'invention)
- Importer depuis packages : `import { X } from '@verone/[package]'`
- Demander autorisation utilisateur si composant manquant

### 📚 Composants Critiques (Usage Fréquent)

#### ProductThumbnail ⭐ COMPOSANT LE PLUS OUBLIÉ

```typescript
import { ProductThumbnail } from '@verone/products';

// Props EXACTES (ne PAS inventer d'autres props)
<ProductThumbnail
  src={product.primary_image_url}  // string | null | undefined
  alt={product.name}                // string
  size="md"                         // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className="custom-class"          // string (optionnel)
  priority={true}                   // boolean (optionnel)
/>

// Tailles disponibles :
// xs: 32x32px, sm: 48x48px, md: 64x64px, lg: 96x96px, xl: 128x128px
```

#### ButtonUnified

```typescript
import { ButtonUnified } from '@verone/ui';

<ButtonUnified
  variant="default"  // 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size="lg"          // 'default' | 'sm' | 'lg' | 'icon'
  loading={isSubmitting}
  icon={<Save />}
>
  Enregistrer
</ButtonUnified>
```

#### KpiCardUnified

```typescript
import { KpiCardUnified } from '@verone/ui';

<KpiCardUnified
  title="Produits actifs"
  value={1245}
  description="Total produits catalogue"
  trend={{ value: 12, direction: 'up' }}
  variant="success"
  icon={<Package />}
/>
```

#### QuickPurchaseOrderModal

```typescript
import { QuickPurchaseOrderModal } from '@verone/orders';

<QuickPurchaseOrderModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  productId={productId}
  shortageQuantity={10}
  onSuccess={() => {
    toast.success('Commande créée');
    refetchStock();
  }}
/>
```

#### StockAlertCard

```typescript
import { StockAlertCard } from '@verone/stock';

<StockAlertCard
  alert={alert}  // Interface StockAlert (12 props documentées)
  onActionClick={(action) => {
    if (action === 'create_order') {
      // Ouvrir modal commande
    }
  }}
/>
```

#### Dialog

```typescript
import { Dialog } from '@verone/ui';

<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Créer produit"
  description="Remplir informations produit"
  size="lg"  // 'sm' | 'md' | 'lg' | 'xl' | 'full'
>
  <ProductForm />
</Dialog>
```

### 📖 Documentation Complète

**Fichier référence** : `docs/architecture/COMPOSANTS-CATALOGUE.md` (1600 lignes)

**Contenu** :

- **54 composants** @verone/ui (Button, Form, Layout, Feedback, Overlay, KPI, Navigation...)
- **32 composants** @verone/products (Images, Cards, Modals, Wizards, Selectors...)
- **Composants** @verone/orders (QuickPurchaseOrderModal...)
- **Composants** @verone/stock (StockAlertCard...)
- **Composants** @verone/categories (CategorySelector, CategorizeModal...)
- **Composants** @verone/notifications (NotificationsDropdown...)
- **Hooks** @verone/dashboard (useCompleteDashboardMetrics...)

**Format pour chaque composant** :

- Interface Props TypeScript complète
- Description props (type, valeurs possibles)
- Exemples utilisation
- Cas d'usage

### 🔍 Cas d'Usage Communs → Composants

| Besoin                      | Composant                       | Package            |
| --------------------------- | ------------------------------- | ------------------ |
| Miniature produit           | `ProductThumbnail`              | @verone/products   |
| Card produit                | `ProductCard`                   | @verone/products   |
| Bouton avec loading         | `ButtonUnified`                 | @verone/ui         |
| Modal dialog                | `Dialog`                        | @verone/ui         |
| KPI avec tendance           | `KpiCardUnified`                | @verone/ui         |
| Alerte stock                | `StockAlertCard`                | @verone/stock      |
| Commande fournisseur rapide | `QuickPurchaseOrderModal`       | @verone/orders     |
| Sélecteur catégorie         | `CategorySelector`              | @verone/categories |
| Badge statut                | `Badge` / `DataStatusBadge`     | @verone/ui         |
| Form input                  | `Input` / `Textarea` / `Select` | @verone/ui         |
| Accordion                   | `Accordion`                     | @verone/ui         |
| Tabs                        | `Tabs`                          | @verone/ui         |
| Tooltip                     | `Tooltip`                       | @verone/ui         |
| Dropdown menu               | `DropdownMenu`                  | @verone/ui         |
| Calendar                    | `Calendar`                      | @verone/ui         |
| Avatar                      | `Avatar`                        | @verone/ui         |

### 🎯 Impact Modifications Packages

**RÈGLE CRITIQUE** : Modification dans `packages/@verone/*` = IMPACTE TOUS LES FRONTENDS

```typescript
// ❌ DANGER : Modifier props ProductThumbnail
// Fichier : packages/@verone/products/src/components/images/ProductThumbnail.tsx
interface ProductThumbnailProps {
  src: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  newProp?: string; // ❌ Ajout prop = CASSER tous usages existants
}

// Impact :
// - apps/back-office/ : 45 fichiers utilisent ProductThumbnail
// - apps/site-internet/ : 12 fichiers utilisent ProductThumbnail
// - apps/linkme/ : 3 fichiers utilisent ProductThumbnail
// → Total : 60 fichiers cassés si prop obligatoire

// ✅ Solution sûre : Prop optionnelle + backward compatible
interface ProductThumbnailProps {
  src: string | null;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  newProp?: string; // ✅ Optionnelle = pas de breaking change
}
```

**Workflow modifications packages** :

1. ✅ Modifier composant packages/@verone/[module]/
2. ✅ Tests unitaires composant
3. ✅ `turbo build` (valider 3 apps compilent)
4. ✅ Grep tous usages : `Grep({ pattern: "ProductThumbnail", path: "apps/" })`
5. ✅ Tests manuels 3 apps (back-office, site-internet, linkme)
6. ✅ Demander autorisation commit

### 📋 Checklist Avant Créer Composant

**AVANT de créer un composant, vérifier OBLIGATOIREMENT :**

```typescript
// ✅ ÉTAPE 1 : Consulter catalogue
Read('docs/architecture/COMPOSANTS-CATALOGUE.md');

// ✅ ÉTAPE 2 : Rechercher dans packages
Glob({ pattern: '**/*[NomComposant]*.tsx', path: 'packages/@verone' });

// ✅ ÉTAPE 3 : Grep usages similaires
Grep({
  pattern: 'button|Button',
  path: 'packages/@verone/ui',
  output_mode: 'files_with_matches',
});

// ✅ ÉTAPE 4 : Consulter Serena si trouvé
mcp__serena__get_symbols_overview(
  'packages/@verone/ui/src/components/ui/button.tsx'
);

// ✅ ÉTAPE 5 : Si composant existe → RÉUTILISER
// ❌ ÉTAPE 6 : Si n'existe pas → DEMANDER AUTORISATION utilisateur

// ✅ ÉTAPE 7 : Après création → METTRE À JOUR CATALOGUE
// Fichier : docs/architecture/COMPOSANTS-CATALOGUE.md
```

**Ressource anti-hallucination** : `docs/architecture/COMPOSANTS-CATALOGUE.md` (TOUJOURS lire EN PREMIER)

---

## 🇫🇷 LANGUE

**TOUJOURS communiquer en français**

- Messages, docs, commit messages, PR
- Exceptions : Code (variables, fonctions en anglais)

---

## 🚀 WORKFLOW UNIVERSEL 2025

**Philosophy Core** : Think → Test → Code → Re-test

**Applicable à** : Formulaires, Pages, Composants, Boutons, Hooks, Business Logic, Database, API

---

### 🧠 PHASE 1 : THINK (Analyse & Planification)

**Durée** : 5-15 minutes | **Objectif** : Comprendre COMPLÈTEMENT avant de coder

**Actions Obligatoires** :

```typescript
// 1. Sequential Thinking (si tâche >3 étapes)
mcp__sequential - thinking__sequentialthinking;

// 2. Analyse Code Existant (Serena - MANDATORY)
mcp__serena__read_memory('context-previous');
mcp__serena__get_symbols_overview(targetFile); // TOUJOURS en premier
mcp__serena__find_referencing_symbols(symbol); // Impact analysis

// 3. Documentation Officielle (Context7)
mcp__context7__get - library - docs({ library: 'next.js', topic: '...' });

// 4. Database Schema (si modification data)
Read('docs/database/SCHEMA-REFERENCE.md');

// 5. Business Rules (si logique métier)
Read('docs/business-rules/[module]/');
```

**Checklist** :

- [ ] Sequential Thinking exécuté (si >3 étapes)
- [ ] Serena `get_symbols_overview` sur fichiers impactés
- [ ] Context7 consulté pour patterns framework
- [ ] Documentation database lue (si applicable)
- [ ] Business rules vérifiées (si applicable)
- [ ] Edge cases identifiés (minimum 3)
- [ ] Plan technique rédigé

---

### 🧪 PHASE 2 : TEST (Validation Hypothèses)

**Durée** : 5-10 minutes | **Objectif** : Tester environnement actuel AVANT modifier

**Actions Obligatoires** :

```typescript
// 1. Console Error Checking (RÈGLE SACRÉE)
mcp__playwright__browser_navigate("http://localhost:3000/page")
mcp__playwright__browser_console_messages()
// Si erreurs → STOP complet

// 2. Test Fonctionnel Existant
mcp__playwright__browser_click("[data-testid='button']")
mcp__playwright__browser_take_screenshot("before-changes.png")

// 3. Database Validation (si applicable)
mcp__supabase__execute_sql("SELECT * FROM table LIMIT 1")
mcp__supabase__get_advisors("security")

// 4. Build Validation
npm run build  // Doit passer SANS erreurs
```

**Checklist** :

- [ ] Console = 0 errors sur page cible
- [ ] Feature existante fonctionne (si modification)
- [ ] Build passe sans erreurs
- [ ] Screenshot "before" capturé
- [ ] Performance baseline mesurée

---

### ⚙️ PHASE 3 : CODE (Implémentation)

**Durée** : 20-40 minutes | **Objectif** : Code MINIMAL avec Serena

**Actions Obligatoires** :

```typescript
// 1. Édition Symbolique Précise (Serena - MANDATORY)
mcp__serena__replace_symbol_body({
  symbol_name: "MyComponent",
  new_body: `// Implementation`
})

// 2. Database Migration (si applicable)
// Fichier: supabase/migrations/YYYYMMDD_NNN_description.sql
CREATE TABLE IF NOT EXISTS new_table (...);  // Idempotent

// 3. TypeScript Types Update
mcp__supabase__generate_typescript_types()
```

**Checklist** :

- [ ] Code minimal fonctionnel
- [ ] Serena utilisé pour toutes modifications
- [ ] Types TypeScript stricts (pas de `any`)
- [ ] Migration SQL idempotente (si DB)
- [ ] Commentaires business logic ajoutés
- [ ] Pas de secrets/credentials

---

### 🔄 PHASE 4 : RE-TEST (Validation Finale)

**Durée** : 10-20 minutes | **Objectif** : Validation COMPLÈTE sans régression

**Actions Obligatoires (ORDRE STRICT)** :

```typescript
// 1. Type Check
npm run type-check  // = 0 erreurs

// 2. Build Validation
npm run build  // Doit passer

// 3. Console Error Checking (RÈGLE SACRÉE)
// RÈGLE ABSOLUE: 1 erreur = ÉCHEC COMPLET
mcp__playwright__browser_navigate("/feature-modifiée")
mcp__playwright__browser_console_messages()

// 4. Test Fonctionnel Workflow Complet
mcp__playwright__browser_click("[data-testid='submit']")
mcp__playwright__browser_take_screenshot("after-changes.png")

// 5. Database Validation (si applicable)
mcp__supabase__execute_sql("SELECT * FROM new_table")
mcp__supabase__get_advisors("performance")
```

**Checklist** :

- [ ] Type check = 0 erreurs
- [ ] Build successful
- [ ] Console = 0 errors (TOUTES pages impactées)
- [ ] Feature fonctionne (workflow complet)
- [ ] Screenshot "after" capturé
- [ ] Database constraints validées (si applicable)
- [ ] Performance SLO respectés (<2s dashboard, <3s pages)
- [ ] Aucune régression détectée

**Si Erreur Détectée** → STOP IMMÉDIAT → Retour PHASE 3 → Fix ALL → Re-test

---

### 📝 PHASE 5 : DOCUMENT (Préservation Context)

**Durée** : 5 minutes | **Objectif** : Sauvegarder décisions pour sessions futures

**Actions Obligatoires** :

```typescript
// 1. Serena Memory
mcp__serena__write_memory({
  key: 'feature-[nom]',
  content: `
    ## Décisions Architecturales
    - [décision 1]

    ## Edge Cases Résolus
    - [edge case 1]

    ## Learnings
    - [learning 1]
  `,
});

// 2. Update Documentation (si applicable)
Write('docs/business-rules/[module]/[feature].md');
Update('docs/database/SCHEMA-REFERENCE.md');
```

**Checklist** :

- [ ] Serena memory écrite avec décisions clés
- [ ] Documentation business rules mise à jour (si applicable)
- [ ] SCHEMA-REFERENCE.md mis à jour (si DB modifiée)

---

### 🚀 PHASE 6 : COMMIT & DEPLOY (Autorisation Obligatoire)

**Durée** : 2 minutes | **RÈGLE ABSOLUE** : JAMAIS sans autorisation EXPLICITE

**Workflow Obligatoire** :

```typescript
// 1. ✅ Préparation
git status && git diff

// 2. ⏸️ STOP - DEMANDER AUTORISATION
"Voulez-vous que je commit et push maintenant ?"
// ATTENDRE réponse EXPLICITE

// 3. ✅ Si "OUI" → Commit structuré
git add [files]
git commit -m "$(cat <<'EOF'
feat(module): Description concise

- Detail 1
- Detail 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

// 4. ✅ Push
git push origin [branch]
```

**Checklist** :

- [ ] Autorisation utilisateur obtenue EXPLICITEMENT
- [ ] Commit message structuré avec émoji
- [ ] Tests passés (console = 0 errors)
- [ ] Build successful

---

## 🚨 RÈGLES D'OR (À MÉMORISER)

1. **Documentation First** : TOUJOURS consulter documentation AVANT toute modification
2. **Console Zero Tolerance** : 1 erreur console = ÉCHEC COMPLET, retour PHASE 3
3. **Serena Before Code** : TOUJOURS `get_symbols_overview` AVANT modifier fichier
4. **Test Before Code** : TOUJOURS valider que existant fonctionne AVANT modifier
5. **Build Always** : TOUJOURS vérifier build passe AVANT et APRÈS modifications
6. **Authorization Always** : JAMAIS commit sans autorisation EXPLICITE utilisateur
7. **ANTI-HALLUCINATION** : JAMAIS inventer, TOUJOURS vérifier les commits précédents pour voir comment c'était codé avant

### 🛡️ RÈGLE ANTI-HALLUCINATION (CRITICAL)

**AVANT toute modification de code existant** :

```typescript
// 1. Vérifier Git History
git log --since="[date]" --oneline -- [file-path]

// 2. Lire le CODE EXACT du dernier commit stable
git show [commit-sha]:[file-path]

// 3. Comparer avec l'état actuel
git diff [commit-sha] HEAD -- [file-path]

// 4. Faire UNIQUEMENT les modifications demandées
// 5. Ne JAMAIS inventer de solution
// 6. Ne JAMAIS supprimer des fonctionnalités existantes
```

**Si quelque chose fonctionnait avant** :

- ✅ Chercher comment c'était codé dans Git
- ✅ Restaurer le code fonctionnel
- ✅ Appliquer SEULEMENT les corrections demandées
- ❌ NE JAMAIS inventer une nouvelle implémentation
- ❌ NE JAMAIS supprimer des fonctions utiles

**Exemple** : Si un bouton existait et fonctionnait → `git show HEAD~5:path/file.tsx` → Voir comment il était codé → Restaurer exactement pareil

---

## 📋 CHECKLIST UNIVERSELLE (Pour TOUT type de feature)

### AVANT DE COMMENCER

- [ ] Objective clairement défini
- [ ] Complexité évaluée (simple/moyen/complexe)
- [ ] Durée estimée (<1h / 1-3h / >3h)

### PHASE 1: THINK ✅

- [ ] Sequential Thinking (si >3 étapes)
- [ ] Serena get_symbols_overview
- [ ] Context7 documentation
- [ ] Edge cases identifiés (min 3)
- [ ] Plan technique rédigé

### PHASE 2: TEST ✅

- [ ] Console = 0 errors
- [ ] Build passe
- [ ] Screenshot "before"

### PHASE 3: CODE ✅

- [ ] Serena symbolic editing
- [ ] Types TypeScript stricts
- [ ] Code minimal

### PHASE 4: RE-TEST ✅

- [ ] Type check = 0 errors
- [ ] Build successful
- [ ] Console = 0 errors (TOUTES pages)
- [ ] Feature fonctionne
- [ ] Screenshot "after"
- [ ] Aucune régression

### PHASE 5: DOCUMENT ✅

- [ ] Serena memory écrite
- [ ] Documentation à jour

### PHASE 6: COMMIT ✅

- [ ] Autorisation obtenue EXPLICITEMENT
- [ ] Commit structuré
- [ ] Push effectué

---

**Exemples détaillés** : Voir `.claude/workflows/universal-workflow-examples.md`
**Checklist rapide** : Voir `.claude/workflows/universal-workflow-checklist.md`

---

## 🚫 GIT WORKFLOW - AUTORISATION OBLIGATOIRE

**RÈGLE ABSOLUE** : **JAMAIS commit, push, ou toute opération git SANS demander autorisation EXPLICITE de l'utilisateur.**

### Workflow Obligatoire

```typescript
1. ✅ Effectuer modifications demandées
2. ✅ Tester localhost (MCP Playwright Browser)
3. ✅ Vérifier build (npm run build)
4. ✅ Vérifier console errors = 0
5. ⏸️ **STOP - DEMANDER AUTORISATION** :
   - Présenter résumé modifications
   - Message : "Voulez-vous que je commit et push maintenant ?"
   - **ATTENDRE réponse EXPLICITE**
6. ✅ Si "OUI" → git add, commit, push
7. ❌ Si "NON" ou ambiguë → NE PAS commit
```

**AUCUNE EXCEPTION** - Même si tout est validé.

### Branch Strategy (Production)

**Configuration actuelle** :

```typescript
// Branches principales
production-stable  → Production Vercel (auto-deploy)
main              → Staging/Development (tests)

// Workflow déploiement
1. Développement → Commit sur feature/* ou main
2. Tests validation → PR validation (15min)
3. Merge main → Tests staging
4. Validation staging → Merge main → production-stable
5. Auto-deploy production → Health checks automatiques
```

**Protection branches** :

- `production-stable` : Protected, require PR review
- `main` : Protected, require PR validation pass

**Hotfixes** :

- Si bug critique production → Cherry-pick fix sur `production-stable`
- Puis backport sur `main` pour sync

---

## 🚀 POST-PRODUCTION WORKFLOWS

**Contexte** : Phase post-déploiement avec données réelles.

**Objectif** : Corrections/features rapides SANS régression.

### Smoke Tests Post-Deployment (3min)

**Déclenchement** : Automatique après déploiement Vercel production.

**Tests critiques** :

```typescript
// 1. Health Check Endpoints
curl -f https://verone-v1.vercel.app/api/health || exit 1

// 2. Auth Flow Test
mcp__playwright__browser_navigate("https://verone-v1.vercel.app/login")
mcp__playwright__browser_console_messages()  // = 0 errors

// 3. Dashboard Load Test
mcp__playwright__browser_navigate("https://verone-v1.vercel.app/dashboard")
mcp__playwright__browser_console_messages()  // = 0 errors
mcp__playwright__browser_take_screenshot("smoke-dashboard.png")

// 4. Database Connection Test
PGPASSWORD="..." psql -h aws-1-eu-west-3.pooler.supabase.com \
  -c "SELECT 1 FROM users LIMIT 1"
```

**Workflow** :

1. Vercel deployment success → Trigger smoke tests
2. Wait 30s (stabilisation)
3. Execute 4 tests critiques
4. Si ÉCHEC → Auto-rollback + Alert
5. Si SUCCESS → Monitor 24h

**Implémentation future** : `.github/workflows/post-deploy-smoke-tests.yml`

### Health Checks + Auto-Rollback (30s)

**Protection production** : Rollback automatique si erreurs détectées.

**Checks executés** :

```typescript
// 1. Console Errors = 0 (RÈGLE SACRÉE)
mcp__playwright__browser_navigate("/dashboard")
const errors = await mcp__playwright__browser_console_messages()
if (errors.length > 0) → ROLLBACK

// 2. Performance SLOs respectés
const lcp = await measureLCP("/dashboard")
if (lcp > 2000ms) → WARNING (pas rollback immédiat)

// 3. Database queries OK
const dbHealth = await supabase.rpc('health_check')
if (!dbHealth) → ROLLBACK

// 4. Auth working
const authTest = await testLoginFlow()
if (!authTest) → ROLLBACK
```

**Rollback automatique** :

```bash
# Si health checks FAILED
vercel promote [previous-deployment-url] --token=$VERCEL_TOKEN

# Créer GitHub Issue automatique
gh issue create --title "🚨 AUTO-ROLLBACK: Health Checks Failed" \
  --label "critical,production" \
  --body "Deployment [sha] rolled back automatically..."
```

### Performance SLOs Tracking

**SLOs définis** :

- ✅ **Dashboard** : LCP <2s (Largest Contentful Paint)
- ✅ **Pages** : LCP <3s
- ✅ **Build** : <20s
- ✅ **API Response** : <500ms (p95)

**Monitoring continu** :

```typescript
// Vercel Analytics (actif)
import { Analytics } from '@vercel/analytics/react'

// Lighthouse CI (à implémenter)
// .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "largest-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```

**Alertes** :

- Régression >10% metrics → GitHub Issue automatique
- Console errors production → Slack alert immediate
- Performance SLO non respecté → Weekly report

### Canary Deployments (Progressive Rollout)

**Pattern** : Déployer code SANS activer feature (découplage deploy ≠ release).

**Implementation Feature Flags** :

```typescript
// .env.local / Vercel Environment Variables
NEXT_PUBLIC_FEATURE_NEW_DASHBOARD = false; // Production OFF
NEXT_PUBLIC_FEATURE_ROLLOUT_PERCENT = 0; // 0-100%

// src/lib/feature-flags.ts
export const featureFlags = {
  newDashboard: process.env.NEXT_PUBLIC_FEATURE_NEW_DASHBOARD === 'true',
  rolloutPercent: parseInt(
    process.env.NEXT_PUBLIC_FEATURE_ROLLOUT_PERCENT || '0'
  ),
};

// Usage avec distribution stable
export function shouldEnableFeature(userId: string): boolean {
  const rollout = featureFlags.rolloutPercent;
  if (rollout === 0) return false;
  if (rollout === 100) return true;

  // Hash stable basé userId
  const hash = hashString(userId) % 100;
  return hash < rollout;
}
```

**Workflow Canary** :

```typescript
1. Deploy code feature OFF (ROLLOUT=0)
   → 100% users version stable

2. Activate 10% users (ROLLOUT=10)
   → Monitor metrics 24h (errors, performance, engagement)

3. Si OK → Increase 50% (ROLLOUT=50)
   → Monitor 48h

4. Si OK → Rollout 100% (ROLLOUT=100)
   → Monitor 1 semaine

5. Cleanup feature flag (après 2 semaines validation)
   → Supprimer code conditionnel, garder seulement nouvelle version
```

**Kill-Switch** : Si problème détecté → `ROLLOUT=0` immédiat (pas besoin rollback deployment).

### Tests Ciblés Post-Production (20 critiques)

**Philosophy** : Tests rapides (5min) vs suite complète (45min).

**20 Tests Critiques** :

```typescript
// Auth (3 tests)
✅ Login flow
✅ Logout flow
✅ Protected routes redirect

// Dashboard (5 tests)
✅ KPIs load
✅ Charts render
✅ Recent activity
✅ Console = 0 errors
✅ Performance <2s

// Organisations (4 tests)
✅ List organisations
✅ Create organisation
✅ Edit organisation
✅ Search organisations

// Contacts (3 tests)
✅ List contacts
✅ Create contact
✅ Link contact → organisation

// Database (3 tests)
✅ Connection OK
✅ RLS policies enforced
✅ Triggers functional

// Build & Deploy (2 tests)
✅ Build success
✅ No TypeScript errors
```

**Exécution** :

```bash
# PR Validation (15min - 20 tests ciblés)
npm run test:critical

# Nightly (45min - 677 tests complets)
npm run test:all
```

---

## 🔧 TYPESCRIPT FIXES WORKFLOW - BEST PRACTICES 2025

**Approche Professionnelle** : Clustering + Batch Corrections par Famille

### Règles Absolues

**❌ INTERDIT :**

- Correction une par une sans plan
- Commits sans tests préalables
- Modifications sans classification famille

**✅ OBLIGATOIRE :**

- Export exhaustif erreurs : `npm run type-check 2>&1 > ts-errors-raw.log`
- Clustering automatique par famille
- Correction COMPLÈTE d'une famille avant passage suivante
- Tests MCP Browser AVANT chaque commit
- Fichier suivi : `TS_ERRORS_PLAN.md` à la racine

### Workflow Standard

```typescript
1. Export erreurs → ts-errors-raw.log
2. Clustering → error-clusters.json
3. Priorisation → TS_ERRORS_PLAN.md
4. Pour chaque famille :
   - Identifier pattern
   - Corriger TOUTE la famille
   - Tests (type-check + build + MCP Browser)
   - Commit structuré
   - Push
5. Répéter jusqu'à 0 erreurs
```

### Priorisation

- **P0 - BLOCKING** : Bloque build (0 actuellement)
- **P1 - CRITICAL** : Type safety critique (null/undefined, property missing core)
- **P2 - HIGH** : Type incompatibilities non-critiques
- **P3 - LOW** : Implicit any, warnings

### Commit Format

```
fix(types): [CODE-PATTERN] Description - X erreurs résolues (avant→après)

Famille : TS2322 - Null/Undefined incompatibility
Fichiers : 15 modifiés
Stratégie : Null coalescing operator (??)
Tests : ✅ MCP Browser 0 errors
Build : ✅ Success

Avant : 975 erreurs
Après : 825 erreurs
Delta : -150 erreurs
```

### Fichiers Clés

- `TS_ERRORS_PLAN.md` : Suivi progression par famille
- `ts-errors-raw.log` : Export brut erreurs TypeScript
- `error-clusters.json` : Clustering automatique
- `scripts/cluster-ts-errors.js` : Script clustering
- `TYPESCRIPT_FIXES_CHANGELOG.md` : Historique décisions

### Commandes Slash

- `/typescript-cluster` : Lance clustering erreurs
- `/typescript-fix <famille>` : Démarre correction famille
- `/typescript-status` : Affiche progression globale

---

## 🎨 FORMATAGE & LINTING (Best Practices 2025)

**Approche Moderne** : ESLint + Prettier découplés, configs monorepo partagées

### Stack

- **Prettier 3.6.2** : Formatage automatique (80 cols, single quotes, LF)
- **ESLint 8.57** : Linting + TypeScript strict mode
- **eslint-config-prettier** : Désactive règles conflictuelles (approche moderne 2025)
- **eslint-plugin-prettier** : Prettier comme règle ESLint (`plugin:prettier/recommended`)

### Architecture Monorepo

**Packages partagés** :

```
packages/@verone/
├── eslint-config/           # Config ESLint stricte partagée
│   ├── package.json
│   ├── index.js             # Extends: next, @typescript-eslint/recommended, storybook, prettier
│   └── README.md
└── prettier-config/         # Config Prettier partagée
    ├── package.json
    ├── index.json           # Config recommandée 2025
    └── README.md
```

**Usage dans apps** :

```json
// .eslintrc.json
{
  "extends": "@verone/eslint-config"
}

// .prettierrc
"@verone/prettier-config"
```

### Règles ESLint Strictes (Par Défaut)

**TypeScript Strict** :

- `@typescript-eslint/no-explicit-any`: `error`
- `@typescript-eslint/explicit-function-return-type`: `warn`
- `@typescript-eslint/consistent-type-imports`: `error` (prefer `type` imports)
- `@typescript-eslint/no-floating-promises`: `error`

**React & Next.js** :

- `react-hooks/rules-of-hooks`: `error`
- `@next/next/no-img-element`: `error` (utiliser next/image)
- `react/self-closing-comp`: `error`

**Code Quality** :

- `prefer-const`: `error`
- `no-var`: `error`
- `no-console`: `warn` (autorise `console.warn` et `console.error`)
- `no-debugger`: `error`

**Import Organization** :

```typescript
// Ordre automatique alphabétique avec groupes :
// 1. react
// 2. next/**
// 3. external packages
// 4. internal (@/**)
// 5. parent/sibling
```

### Commandes

```bash
# Prettier
npm run format          # Formater tout le code
npm run format:check    # Vérifier formatage sans modifier

# ESLint
npm run lint            # ESLint strict par défaut (@verone/eslint-config)
npm run lint:fix        # Auto-fix erreurs ESLint

# Type check
npm run type-check      # TypeScript validation (AVANT commit)

# All-in-one
npm run validate:all    # type-check + validations custom
```

### Pre-Commit Automatique (Husky + Lint-Staged)

**Workflow déclenché sur `git commit`** :

```bash
# .husky/pre-commit
1. ✅ Type check (tsc --noEmit)
2. ✅ Prettier → ESLint (lint-staged - ordre optimisé)
3. ✅ Naming conventions validation
4. ✅ Database type alignment check
```

**.lintstagedrc.json** :

```json
{
  "*.{ts,tsx}": [
    "prettier --write", // 1. Formater AVANT
    "eslint --fix" // 2. Linter APRÈS
  ]
}
```

**Ordre important** : Prettier d'abord (formatage), puis ESLint (qualité code).

### Validation Build (Strict Mode)

**next.config.js** :

```javascript
eslint: {
  dirs: ['src', 'app']; // Valide code source au build
}
// Build ÉCHOUE si erreurs ESLint ou TypeScript
```

**Protection production** : Zero tolerance pour erreurs.

### Fichiers Ignore

**.prettierignore** :

```
node_modules, .next, dist, *.generated.ts, src/types/supabase.ts
```

**.eslintignore** :

```
node_modules, .next, dist, *.generated.ts, next.config.js
```

### Extensions Recommandées

**Plugins ESLint actifs** :

- `plugin:@typescript-eslint/recommended` (types stricts)
- `plugin:prettier/recommended` (formatage comme règle)
- `plugin:storybook/recommended` (composants UI)
- `next/core-web-vitals` (performance)

### Overrides par Type de Fichier

**Tests** (`**/*.test.ts`, `**/*.spec.ts`) :

- `@typescript-eslint/no-explicit-any`: `off`
- `no-console`: `off`

**Configs** (`*.config.ts`, `*.config.js`) :

- `@typescript-eslint/no-var-requires`: `off`

**Scripts** (`scripts/**/*.ts`) :

- `no-console`: `off`
- `@typescript-eslint/no-explicit-any`: `warn`

### Best Practices 2025

**✅ DO** :

- Utiliser `type` imports : `import type { User } from './types'`
- Déclarer return types : `function foo(): string {}`
- Prefer const : `const x = 1` (pas `let`)
- Utiliser next/image : `<Image />` (pas `<img />`)
- Formater avant commit : Pre-commit automatique actif

**❌ DON'T** :

- `any` explicite (erreur bloquante)
- `var` (erreur bloquante)
- `console.log` sans raison (warning)
- Ignorer erreurs Prettier (commit bloqué)
- Bypass pre-commit hooks (--no-verify)

### Troubleshooting

**Erreur "Prettier conflicts with ESLint"** :

- ✅ Vérifier : `eslint-config-prettier` installé
- ✅ Vérifier : `.eslintrc.json` extends `@verone/eslint-config`
- ✅ Vérifier : `plugin:prettier/recommended` en DERNIER dans extends

**Pre-commit bloqué** :

```bash
# Formatter manuellement
npm run format

# Linter avec auto-fix
npm run lint:fix

# Vérifier type errors
npm run type-check

# Re-commit
git add . && git commit
```

**Build échoue sur ESLint/TypeScript** :

- Temporaire : Commenter validation dans `next.config.js`
- Permanent : Corriger TOUTES erreurs (approche professionnelle)

---

## 🤖 MCP AGENTS - USAGE PRIORITAIRE

### Serena - Code Intelligence

```typescript
mcp__serena__get_symbols_overview; // Explorer fichier AVANT modification
mcp__serena__find_symbol; // Localiser symboles
mcp__serena__replace_symbol_body; // Édition précise
mcp__serena__search_for_pattern; // Recherche patterns
```

**Best practice** : TOUJOURS `get_symbols_overview` avant éditer fichier

### Supabase - Database

```typescript
// 🔑 Credentials : Read .env.local ligne 19
// Connection : aws-1-eu-west-3.pooler.supabase.com:5432

mcp__supabase__execute_sql; // Queries directes
mcp__supabase__get_advisors; // Sécurité/performance
mcp__supabase__generate_typescript_types; // Types après migrations
```

### Playwright - Browser Testing

```typescript
mcp__playwright__browser_navigate;
mcp__playwright__browser_console_messages;
mcp__playwright__browser_click;
mcp__playwright__browser_take_screenshot;
```

---

## 📖 CONTEXTES SPÉCIALISÉS

**Charger à la demande selon tâche** :

```typescript
// 🗄️ Travail database (migrations, schema, queries)
Read('.claude/contexts/database.md');

// 🚀 Déploiement (CI/CD, Vercel, rollback, PR)
Read('.claude/contexts/deployment.md');

// 📊 KPI (métriques, documentation YAML)
Read('.claude/contexts/kpi.md');

// 🎨 Design/UI (composants, Storybook, design V2)
Read('.claude/contexts/design-system.md');

// 🏗️ Monorepo (architecture, migration progressive)
Read('.claude/contexts/monorepo.md');
```

**Principe** : Ne charger que le contexte nécessaire pour éviter token overhead.

---

## 📁 STRUCTURE REPOSITORY

```
src/                     # Next.js app
  ├── app/               # App Router pages
  ├── components/        # React components
  │   ├── ui/            # shadcn/ui base
  │   └── ui-v2/         # Design System V2
  ├── hooks/             # Custom hooks
  ├── lib/               # Utils, Supabase client
  └── types/             # TypeScript types

docs/                    # Documentation technique exhaustive
  ├── auth/              # Rôles, permissions, RLS
  ├── database/          # Schema, triggers, functions (78 tables)
  ├── metrics/           # KPI, calculs, triggers
  ├── workflows/         # Business workflows
  └── ci-cd/             # Déploiement, rollback

.claude/
  ├── contexts/          # Contextes spécialisés (chargés à la demande)
  └── commands/          # Custom slash commands

packages/                # KPI docs YAML, future monorepo
supabase/migrations/     # Database migrations
```

---

## ⚡ COMMANDES ESSENTIELLES

```bash
# Développement
npm run dev              # Next.js dev server (localhost:3000)
npm run build            # Production build (validation ESLint + TypeScript)
npm run type-check       # TypeScript check (AVANT commit)

# Formatage & Linting
npm run format           # Prettier : formater tout le code
npm run format:check     # Vérifier formatage sans modifier
npm run lint             # ESLint strict (@verone/eslint-config)
npm run lint:fix         # Auto-fix erreurs ESLint

# Validation
npm run validate:all     # type-check + validations custom (hooks, naming, DB types)

# Audit
npm run audit:all        # Tous audits (duplicates, cycles, deadcode, spelling)

# Database
supabase db push         # Appliquer migrations
supabase gen types typescript --local > src/types/supabase.ts
```

---

## 🎯 SUCCESS METRICS (SLOS)

- ✅ **Zero console errors** (tolérance zéro)
- ✅ **Dashboard** : <2s
- ✅ **Build** : <20s
- ✅ **Test coverage** : >80% (nouveaux modules)

---

## 📚 NAVIGATION DOCUMENTATION

**Documentation exhaustive** : `/docs/`

- **Auth** : `docs/auth/` (Rôles, permissions, RLS)
- **Database** : `docs/database/` (78 tables, 158 triggers, anti-hallucination)
- **Metrics** : `docs/metrics/` (KPI, calculs)
- **Workflows** : `docs/workflows/` (Business workflows)
- **CI/CD** : `docs/ci-cd/` (Déploiement, rollback)

**Best Practices** :

- Naming : `kebab-case.md`
- Profondeur : Max 2 niveaux
- README obligatoire par section

---

## 📋 BUSINESS RULES - STRUCTURE COMPLÈTE

**Nouvelle organisation modulaire** : `docs/business-rules/`

### Organisation

Structure complète **93 dossiers** correspondant aux **19 modules applicatifs** + aspects transverses.

```
docs/business-rules/
├── 01-authentification/          # /login, /profile
├── 02-dashboard/                 # /dashboard
├── 03-organisations-contacts/    # /contacts-organisations
│   ├── organisations/
│   ├── contacts/
│   ├── customers/
│   ├── suppliers/
│   └── partners/
├── 04-produits/                  # /produits
│   ├── catalogue/
│   │   ├── categories/
│   │   ├── families/
│   │   ├── collections/
│   │   ├── products/
│   │   ├── variants/
│   │   ├── packages/
│   │   └── images/
│   └── sourcing/
├── 05-pricing-tarification/      # Pricing multi-canaux
├── 06-stocks/                    # /stocks
│   ├── movements/
│   ├── inventaire/
│   ├── alertes/
│   ├── receptions/
│   ├── expeditions/
│   ├── entrees/
│   ├── sorties/
│   └── backorders/
├── 07-commandes/                 # /commandes
│   ├── clients/
│   ├── fournisseurs/
│   └── expeditions/
├── 08-consultations/             # /consultations
├── 09-ventes/                    # /ventes
├── 10-finance/                   # /finance
│   ├── depenses/
│   ├── rapprochement/
│   └── accounting/
├── 11-factures/                  # /factures
├── 12-tresorerie/                # /tresorerie
├── 13-canaux-vente/              # /canaux-vente
│   ├── google-merchant/
│   ├── prix-clients/
│   └── integrations/
├── 14-admin/                     # /admin
│   ├── users/
│   └── activite-utilisateurs/
├── 15-notifications/             # /notifications
├── 16-parametres/                # /parametres
├── 17-organisation/              # /organisation
├── 98-ux-ui/                     # Design patterns transverses
└── 99-transverses/               # Aspects cross-module
    ├── workflows/
    ├── integrations/
    ├── data-quality/
    └── compliance/
```

### Règles de Classification Automatique

**Pour ajouter une nouvelle business rule** :

1. **Identifier le module** : Quel route dans `src/app/` ?
2. **Placer dans dossier numéroté** : 01-17 selon module
3. **Si multi-module** : `99-transverses/workflows/`
4. **Si UX/Design** : `98-ux-ui/`

**Exemples** :

```typescript
// Règle remises clients → Pricing
'docs/business-rules/05-pricing-tarification/discount-rules.md';

// Workflow commande→expédition → Transverse
'docs/business-rules/99-transverses/workflows/order-to-shipment.md';

// Pattern modal → UX
'docs/business-rules/98-ux-ui/modal-pattern.md';

// Règle stock minimum → Stocks/Alertes
'docs/business-rules/06-stocks/alertes/minimum-stock-rules.md';
```

**Ressource complète** : `docs/business-rules/README.md` (index exhaustif avec statistiques)

---

## 📊 CLASSIFICATION AUTOMATIQUE RAPPORTS

**Système organisé pour tous types de rapports**

### Rapports d'Audit

**Structure** : `docs/audits/`

```typescript
// Audits par phase
docs/audits/phases/
├── phase-a-baseline/    // Audit initial baseline
├── phase-b-testing/     // Tests exhaustifs
├── phase-c-security/    // Audits sécurité
└── phase-d-final/       // Audit final pré-production

// Rapports mensuels
docs/audits/YYYY-MM/
├── RAPPORT-AUDIT-COMPLET-2025-10-25.md
├── RAPPORT-ERREURS-TYPESCRIPT-2025-10-25.md
└── RAPPORT-FIXES-PHASE-1-2-2025-10-25.md
```

**Règles de placement** :

1. **Rapports d'audit phase** → `docs/audits/phases/phase-{x}-{nom}/`
2. **Rapports finaux** → `docs/audits/YYYY-MM/RAPPORT-{TYPE}-{DATE}.md`
3. **Fichiers temporaires** → Supprimer après consolidation

### Rapports Techniques

**Structure** : `docs/workflows/` ou dossier spécifique

```typescript
// Rapports performance
docs/metrics/performance-reports/
└── perf-report-2025-10-26.md

// Rapports sécurité
docs/security/security-audits/
└── security-scan-2025-10-26.md

// Rapports database
docs/database/schema-reports/
└── schema-analysis-2025-10-26.md
```

### Workflow Automatique Claude

**Quand vous générez un rapport** :

```typescript
// 1. Identifier le type
const reportType = detectReportType(content);

// 2. Classification automatique
switch (reportType) {
  case 'audit-phase':
    path = `docs/audits/phases/phase-${phase}-${name}/`;
    break;
  case 'audit-monthly':
    path = `docs/audits/${YYYY - MM}/RAPPORT-${TYPE}-${DATE}.md`;
    break;
  case 'performance':
    path = `docs/metrics/performance-reports/`;
    break;
  case 'security':
    path = `docs/security/security-audits/`;
    break;
  case 'database':
    path = `docs/database/schema-reports/`;
    break;
  case 'business-rule':
    path = `docs/business-rules/${module}/`;
    break;
}

// 3. Créer fichier au bon endroit
await createReport(path, content);

// 4. Nettoyer racine projet
await cleanupProjectRoot();
```

**Convention naming** :

- **Dates** : `YYYY-MM-DD` (ISO 8601)
- **Format** : `{TYPE}-{DESCRIPTION}-{DATE}.md`
- **Exemples** :
  - `RAPPORT-AUDIT-COMPLET-2025-10-26.md`
  - `perf-analysis-dashboard-2025-10-26.md`
  - `security-scan-pre-deploy-2025-10-26.md`

**RÈGLE ABSOLUE** : **Aucun fichier .md à la racine projet** (sauf CLAUDE.md, README.md, CHANGELOG.md)

---

**Version** : 3.2.0 (Post-Production Workflows + README Professionnel 2025)
**Dernière mise à jour** : 2025-10-30
**Mainteneur** : Romeo Dos Santos

**Changelog 3.2.0** :

- ✅ Section "POST-PRODUCTION WORKFLOWS" ajoutée (smoke tests, health checks, SLOs, canary deployments)
- ✅ Section "Branch Strategy" documentée (production-stable vs main)
- ✅ README.md professionnel créé (Quick start, Tech stack, Project status Phase 1→4)
- ✅ Tests ciblés post-production définis (20 critiques vs 677 complets)
- ✅ Performance SLOs tracking documenté (Lighthouse CI)
