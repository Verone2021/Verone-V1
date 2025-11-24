# Verone Back Office - Claude Code 2025

**CRM/ERP modulaire** | Next.js 15 + Supabase + Turborepo
**Phase 4** : 3 apps | 26 packages @verone/\* | 86 composants | 78 tables | 158 triggers

---

## GOLDEN RULES (Tables DO/DON'T)

### Règle 1 : Paths Turborepo

| DO                          | DON'T                         |
| --------------------------- | ----------------------------- |
| `apps/back-office/src/app/` | `src/app/` (n'existe plus)    |
| `apps/site-internet/src/`   | `src/components/` (obsolète)  |
| `apps/linkme/src/`          | `src/shared/modules/` (migré) |
| `packages/@verone/*/src/`   | Chemins Phase 1-3             |

### Règle 2 : Console Zero Tolerance

| Situation        | Action                                      |
| ---------------- | ------------------------------------------- |
| 1 erreur console | **STOP COMPLET** - Corriger avant continuer |
| Build échoue     | **STOP COMPLET** - Corriger avant continuer |
| Type error       | **STOP COMPLET** - Corriger avant continuer |

### Règle 3 : Catalogue Before Create

| Avant de créer | Vérifier d'abord                                            |
| -------------- | ----------------------------------------------------------- |
| Composant UI   | `docs/architecture/COMPOSANTS-CATALOGUE.md` (86 composants) |
| Table DB       | Schema existant via `mcp__supabase__list_tables`            |
| Hook           | Packages existants `packages/@verone/hooks/`                |

### Règle 4 : Test Before & After

| Phase              | Commandes                                     | Critère     |
| ------------------ | --------------------------------------------- | ----------- |
| **AVANT** modifier | `npm run build`                               | Doit passer |
| **APRÈS** modifier | `npm run type-check && npm run build`         | 0 erreurs   |
| **Console**        | `mcp__playwright__browser_console_messages()` | 0 erreurs   |

### Règle 5 : Never Commit Without Permission

| État                    | Action                                           |
| ----------------------- | ------------------------------------------------ |
| Modifications terminées | **STOP** → Demander "Voulez-vous que je commit?" |
| Réponse "OUI" explicite | Procéder au commit                               |
| Autre réponse / Silence | **NE PAS** commit                                |

### Règle 6 : Anti-Hallucination Database

| Ne PAS créer                         | Utiliser à la place                   |
| ------------------------------------ | ------------------------------------- |
| Table `suppliers`                    | `organisations WHERE type='supplier'` |
| Table `customers`                    | `organisations WHERE type='customer'` |
| Table `brands`                       | `organisations WHERE type='brand'`    |
| Colonne `products.stock_qty`         | Calculé par triggers automatiques     |
| Colonne `products.primary_image_url` | JOIN avec `product_images`            |

### Règle 7 : No Test Data

| Interdit                          | Raison                         |
| --------------------------------- | ------------------------------ |
| Créer seed data sans permission   | Base de données production     |
| Ajouter mock data sans permission | Pollution données réelles      |
| INSERT données test               | Autorisation EXPLICITE requise |

---

## Structure Projet Turborepo

### Applications (apps/)

| App             | Port | Description            |
| --------------- | ---- | ---------------------- |
| `back-office`   | 3000 | CRM/ERP complet        |
| `site-internet` | 3001 | E-commerce public      |
| `linkme`        | 3002 | Commissions apporteurs |

### Packages (@verone/\*)

| Package             | Contenu                       |
| ------------------- | ----------------------------- |
| `@verone/ui`        | 54 composants Design System   |
| `@verone/products`  | Produits, images, variantes   |
| `@verone/orders`    | Commandes achat/vente         |
| `@verone/stock`     | Stock, alertes, mouvements    |
| `@verone/types`     | Types Supabase centralisés    |
| `@verone/customers` | Gestion clients               |
| `@verone/suppliers` | Gestion fournisseurs          |
| `@verone/hooks`     | Hooks partagés                |
| `@verone/utils`     | Utilitaires (cn, formatPrice) |

### Imports Corrects

```typescript
// UI Components
import { Button, Card, Dialog } from '@verone/ui';

// Business Components
import { ProductCard, ProductThumbnail } from '@verone/products';
import { StockAlertCard } from '@verone/stock';

// Types
import type { Database } from '@verone/types';

// Utils
import { cn, formatPrice } from '@verone/utils';
```

---

## Workflow Universel (4 Phases)

### Phase 1 : THINK

| Action                | Détail                                   |
| --------------------- | ---------------------------------------- |
| Lire documentation    | Consulter docs pertinents AVANT modifier |
| Identifier edge cases | Minimum 3 cas limites                    |
| Vérifier existant     | Composant/hook existe déjà ?             |
| Sequential Thinking   | Si >3 étapes complexes                   |

### Phase 2 : TEST BEFORE

| Vérification | Commande                                          |
| ------------ | ------------------------------------------------- |
| Build actuel | `npm run build`                                   |
| Console      | `mcp__playwright__browser_console_messages()`     |
| Feature      | Naviguer vers la feature, vérifier fonctionnement |

### Phase 3 : CODE

| Principe               | Application                    |
| ---------------------- | ------------------------------ |
| Code minimal           | Uniquement ce qui est demandé  |
| TypeScript strict      | Pas de `any`, types explicites |
| Patterns existants     | Suivre conventions du projet   |
| Pas d'over-engineering | Simple > Complexe              |

### Phase 4 : VALIDATE AFTER

| Vérification | Commande                 | Critère                      |
| ------------ | ------------------------ | ---------------------------- |
| Types        | `npm run type-check`     | 0 erreurs                    |
| Build        | `npm run build`          | Succès                       |
| Console      | Browser console          | 0 erreurs                    |
| Permission   | Demander à l'utilisateur | "OUI" explicite avant commit |

---

## Composants Critiques

### ProductThumbnail (le plus oublié)

```typescript
import { ProductThumbnail } from '@verone/products';

<ProductThumbnail
  src={product.primary_image_url}
  alt={product.name}
  size="md" // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
/>
```

### Composants Essentiels

| Composant                 | Package          | Usage                         |
| ------------------------- | ---------------- | ----------------------------- |
| `Button`                  | @verone/ui       | Bouton standard avec variants |
| `Dialog`                  | @verone/ui       | Modal dialog                  |
| `Card`                    | @verone/ui       | Container card                |
| `KpiCardUnified`          | @verone/ui       | KPI avec tendance             |
| `ProductCard`             | @verone/products | Carte produit complète        |
| `ProductThumbnail`        | @verone/products | Miniature produit             |
| `StockAlertCard`          | @verone/stock    | Alerte stock                  |
| `QuickPurchaseOrderModal` | @verone/orders   | Commande rapide               |

### Documentation Composants

**Référence complète** : `docs/architecture/COMPOSANTS-CATALOGUE.md` (1600 lignes, 86 composants)

---

## Stack Technique

| Couche     | Technologie                                  |
| ---------- | -------------------------------------------- |
| Frontend   | Next.js 15 (App Router, RSC, Server Actions) |
| UI         | shadcn/ui + Radix UI + Tailwind CSS          |
| Database   | Supabase (PostgreSQL + Auth + RLS)           |
| Validation | Zod + React Hook Form                        |
| Testing    | Vitest + Playwright + Storybook              |
| Monorepo   | Turborepo v2.6 + pnpm workspaces             |
| Deploy     | Vercel (auto-deploy production-stable)       |

### Commandes Essentielles

| Commande             | Action                         |
| -------------------- | ------------------------------ |
| `npm run dev`        | Développement (localhost:3000) |
| `npm run build`      | Build production               |
| `npm run type-check` | Validation TypeScript          |
| `npm run lint:fix`   | Auto-fix linting               |
| `npm run format`     | Formatage Prettier             |

### Commande Types Supabase

```bash
supabase gen types typescript --local > packages/@verone/types/src/supabase.ts
```

---

## MCP & Contextes

### Charger Contexte Selon Tâche

| Tâche                 | Fichier Contexte                    | Commande      |
| --------------------- | ----------------------------------- | ------------- |
| Database / Migrations | `.claude/contexts/database.md`      | `/db`         |
| UI / Composants       | `.claude/contexts/design-system.md` | `/feature-ui` |
| Architecture          | `.claude/contexts/monorepo.md`      | `/audit-arch` |
| Déploiement           | `.claude/contexts/deployment.md`    | -             |
| KPI / Métriques       | `.claude/contexts/kpi.md`           | -             |

### Agents Spécialisés

| Agent                       | Usage                           |
| --------------------------- | ------------------------------- |
| `verone-orchestrator`       | Tâches multi-domaines complexes |
| `database-architect`        | Migrations, schema, RLS         |
| `frontend-architect`        | UI, composants, pages           |
| `verone-debug-investigator` | Debug erreurs, investigation    |

### Slash Commands

| Commande       | Action                       |
| -------------- | ---------------------------- |
| `/db`          | Opérations Supabase rapides  |
| `/feature-ui`  | Workflow création feature UI |
| `/feature-db`  | Workflow création feature DB |
| `/audit-arch`  | Audit architecture           |
| `/update-docs` | Mise à jour documentation    |

---

## Git Workflow

### Branches

| Branche             | Usage                           |
| ------------------- | ------------------------------- |
| `production-stable` | Production Vercel (auto-deploy) |
| `main`              | Staging / Development           |

### Format Commit

```
feat(module): Description concise

- Detail 1
- Detail 2

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Règles Git Critiques

| Interdit                                  | Raison                    |
| ----------------------------------------- | ------------------------- |
| `git push --force`                        | Destructif, perte données |
| `git commit --amend` sur commits d'autres | Dangereux                 |
| Commit sans "OUI" explicite               | Violation workflow        |
| Skip hooks (`--no-verify`)                | Contourne validations     |

### Workflow Commit

```
1. ✅ Modifications terminées
2. ✅ npm run type-check (0 erreurs)
3. ✅ npm run build (succès)
4. ✅ Console errors = 0
5. ⏸️ STOP - Demander autorisation
6. ✅ Si "OUI" → git add, commit, push
7. ❌ Si autre → NE PAS commit
```

---

## Anti-Hallucination Workflow

### Avant Modifier Code Existant

```bash
# Vérifier historique
git log --since="1 week ago" --oneline -- [file-path]
git show [commit-sha]:[file-path]

# Si fonctionnait avant → Restaurer, puis appliquer corrections
```

### Avant Créer Fichier

| Vérification | Action                                          |
| ------------ | ----------------------------------------------- |
| Chemin       | Utiliser `apps/` ou `packages/` (JAMAIS `src/`) |
| Composant    | Vérifier catalogue (86 existants)               |
| Table DB     | Vérifier schema existant                        |
| Hook         | Vérifier `@verone/hooks`                        |

---

## Documentation Navigation

| Dossier                | Contenu                     |
| ---------------------- | --------------------------- |
| `docs/architecture/`   | Turborepo, composants, ADR  |
| `docs/database/`       | 78 tables, triggers, RLS    |
| `docs/business-rules/` | Règles métier (93 dossiers) |
| `docs/workflows/`      | Workflows métier            |
| `docs/guides/`         | Guides développement        |

### Ressources Critiques

| Ressource                                   | Usage                  |
| ------------------------------------------- | ---------------------- |
| `docs/architecture/COMPOSANTS-CATALOGUE.md` | Anti-hallucination UI  |
| `.claude/contexts/database.md`              | Anti-hallucination DB  |
| `.serena/memories/`                         | Mémoires projet Serena |

---

## Success Metrics

| Métrique       | Cible                    |
| -------------- | ------------------------ |
| Console errors | **0** (tolérance zéro)   |
| Dashboard LCP  | < 2s                     |
| Pages LCP      | < 3s                     |
| Build time     | < 20s                    |
| Test coverage  | > 80% (nouveaux modules) |

---

## Langue

| Contexte                    | Langue   |
| --------------------------- | -------- |
| Communication               | Français |
| Documentation               | Français |
| Code (variables, fonctions) | Anglais  |
| Commits                     | Français |

---

**Version** : 5.0.0 | **Date** : 2025-11-24 | **Mainteneur** : Romeo Dos Santos
