# Architecture Verone

**Derniere mise a jour:** 2026-01-09

CRM/ERP modulaire pour decoration et mobilier d'interieur haut de gamme.

---

## Vue d'Ensemble

```
verone-back-office-V1/
├── apps/                          # 3 applications Next.js
│   ├── back-office/               # CRM/ERP (port 3000)
│   ├── site-internet/             # E-commerce public (port 3001)
│   └── linkme/                    # Commissions affilies (port 3002)
│
├── packages/@verone/              # 26 packages partages
│   ├── ui/                        # Design System (54 composants)
│   ├── types/                     # Types TypeScript + Supabase
│   ├── utils/                     # Utilitaires communs
│   ├── products/                  # Composants produits
│   ├── orders/                    # Composants commandes
│   ├── stock/                     # Composants stock
│   ├── customers/                 # Composants clients
│   ├── organisations/             # Composants organisations
│   ├── finance/                   # Composants finance
│   ├── integrations/              # Qonto, Google Merchant
│   └── ...                        # Autres packages
│
├── supabase/                      # Database
│   └── migrations/                # Migrations SQL (source de verite)
│
├── tests/                         # Tests E2E Playwright
├── docs/current/                  # Documentation (source de verite)
├── turbo.json                     # Config Turborepo
├── pnpm-workspace.yaml            # Config workspaces
└── CLAUDE.md                      # Instructions Claude Code
```

---

## Applications

| App             | Port | Description          | Status     |
| --------------- | ---- | -------------------- | ---------- |
| `back-office`   | 3000 | CRM/ERP complet      | Production |
| `site-internet` | 3001 | E-commerce public    | Planifie   |
| `linkme`        | 3002 | Commissions affilies | Production |

---

## Packages (@verone/\*)

### UI & Design System

- `@verone/ui` - 54 composants shadcn/ui
- `@verone/ui-business` - Composants metier

### Business Logic

- `@verone/products` - Logique produits
- `@verone/orders` - Logique commandes
- `@verone/stock` - Logique stock
- `@verone/customers` - Logique clients
- `@verone/organisations` - Logique organisations
- `@verone/suppliers` - Logique fournisseurs
- `@verone/finance` - Logique finance (factures, devis)
- `@verone/logistics` - Logique expeditions
- `@verone/notifications` - Notifications

### Infrastructure

- `@verone/types` - Types TypeScript + Supabase generated
- `@verone/utils` - Helpers, Supabase client
- `@verone/integrations` - APIs externes (Qonto, etc.)
- `@verone/eslint-config` - Config ESLint
- `@verone/prettier-config` - Config Prettier

---

## Patterns

### Server Components (RSC)

```typescript
// Page = Server Component par defaut
export default async function ProductsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('products').select('*');
  return <ProductList products={data} />;
}
```

### Server Actions

```typescript
// actions.ts
'use server';

export async function createProduct(formData: FormData) {
  const supabase = await createClient();
  // ... validation, insert
  revalidatePath('/produits');
}
```

### Client Components

```typescript
'use client';

export function ProductForm({ onSubmit }: Props) {
  // Hooks React, interactivite
}
```

---

## Commandes Turbo

```bash
npm run dev           # turbo dev (toutes apps)
npm run build         # turbo build
npm run type-check    # turbo type-check
npm run lint:fix      # turbo lint --fix
```

---

## Anti-Patterns (INTERDIT)

| Ancien Pattern                  | Realite Actuelle                                           |
| ------------------------------- | ---------------------------------------------------------- |
| `yarn install`                  | `pnpm install`                                             |
| `npm install`                   | `pnpm install`                                             |
| Import relatif profond `../../` | Import package `@verone/*`                                 |
| `src/components/` (racine)      | `apps/[app]/src/components/` ou `packages/@verone/ui/src/` |

---

_Voir [database.md](./database.md) pour le schema_

# Turborepo Remote Cache

**Status** : NON CONFIGURÉ (cache local suffisant)

## État Actuel

- ✅ Cache local fonctionne parfaitement (`.turbo/cache/` 396KB)
- ⚠️ Warnings remote cache car TURBO_TOKEN/TURBO_TEAM non définis
- ⏱️ Cache local = 3-5x speedup sur rebuilds

## Quand Activer Remote Cache

Activer UNIQUEMENT si :

1. Plusieurs développeurs sur le même repo
2. Pipelines CI/CD doivent partager cache
3. Cache local insuffisant

## Setup (Si Nécessaire)

```bash
# Lier projet Vercel
npx turbo link

# Vérifier config
cat .turbo/config.json
```

## Coût/Bénéfice

- **Local** : Gratuit, rapide, privé
- **Remote** : Coût Vercel, latence réseau, partage équipe

**Décision** : Garder local cache jusqu'à croissance équipe

## Warnings Informationnels

Ces warnings sont ACCEPTABLES :

```
[WARN] TURBO_TOKEN is configured but not in allowlist
[WARN] TURBO_TEAM is configured but not in allowlist
```

Aucune action requise - informationnels uniquement.

---
