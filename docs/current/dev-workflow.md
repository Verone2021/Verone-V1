# Workflow Developpement Verone

**Derniere mise a jour:** 2026-01-09

---

## Quickstart

### Prerequis

- Node.js 20+
- pnpm 10+
- Git
- Acces Supabase (demander credentials)

### Installation

```bash
# Cloner le repo
git clone git@github.com:Verone2021/Verone-V1.git
cd Verone-V1

# Installer dependencies
pnpm install

# Configurer environnement
cp apps/back-office/.env.example apps/back-office/.env.local
# Remplir les variables (demander au team lead)
```

### Lancer en dev

```bash
# Toutes les apps
npm run dev

# Ou une seule app
cd apps/back-office && npm run dev
```

---

## Workflow Quotidien

### Matin

```bash
git checkout main
git pull origin main
pnpm install          # Si package.json a change
npm run dev
```

### Developpement

```bash
git checkout -b feature/nom-feature    # Nouvelle branche
# ... coder ...
npm run type-check                      # Verification TypeScript
npm run build                           # Build test
```

### Avant commit

**OBLIGATOIRE:**

```bash
npm run type-check   # Doit = 0 erreurs
npm run build        # Doit = Build succeeded
```

### Commit

```bash
git add .
git commit -m "feat(module): description"
git push origin feature/nom-feature
```

### Convention commits

```
feat(module): nouvelle fonctionnalite
fix(module): correction bug
docs: mise a jour documentation
chore: maintenance, config
refactor(module): refactoring sans changement fonctionnel
```

---

## Branches

| Branche     | Usage                           |
| ----------- | ------------------------------- |
| `main`      | Production (auto-deploy Vercel) |
| `feature/*` | Developpement features          |
| `fix/*`     | Corrections bugs                |

---

## Verification Pre-Merge

### Checklist

- [ ] `npm run type-check` = 0 erreurs
- [ ] `npm run build` = succes
- [ ] Console browser = 0 erreurs critiques
- [ ] Tests UI si composants modifies

### Definition Console Zero

**BLOQUANT:**

- `console.error()`
- Unhandled promise rejection
- React/Next.js error overlay

**OK (pas bloquant):**

- `console.log`, `console.warn`
- Deprecation warnings tiers

---

## Structure Imports

```typescript
// Depuis une app, importer un package
import { Button } from '@verone/ui';
import { useProducts } from '@verone/products';
import type { Database } from '@verone/types';

// Local a l'app
import { Sidebar } from '@/components/Sidebar';
```

---

## Ou Mettre Quoi

| Type                   | Emplacement                            |
| ---------------------- | -------------------------------------- |
| Page/Route             | `apps/[app]/src/app/`                  |
| Composant app-specific | `apps/[app]/src/components/`           |
| Composant partage      | `packages/@verone/ui/src/`             |
| Hook partage           | `packages/@verone/[domain]/src/hooks/` |
| Type TypeScript        | `packages/@verone/types/src/`          |
| Migration SQL          | `supabase/migrations/`                 |
| Test E2E               | `tests/`                               |

---

## Troubleshooting

| Probleme        | Solution                            |
| --------------- | ----------------------------------- |
| Types obsoletes | `supabase gen types typescript`     |
| Imports casses  | `pnpm install`, verifier tsconfig   |
| Build echoue    | Verifier logs, `npm run type-check` |
| Port occupe     | Kill process, changer port          |

---

_Voir [architecture.md](./architecture.md) pour la structure complete_
