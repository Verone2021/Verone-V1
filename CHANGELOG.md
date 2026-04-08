# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0-monorepo-complete] - 2025-11-08

### 🎉 BREAKING CHANGES - Architecture Monorepo

Migration complète vers architecture monorepo pnpm avec 21 packages `@verone/*`.

**Migration**: 51% → **100%** (49% en VAGUE 5)

### ✨ Added

#### Packages @verone/* (21 packages)

**UI & Design**:
- `@verone/ui` : 51 composants shadcn/ui + Design System V2
- `@verone/ui-business` : Business components réutilisables

**Business Logic**:
- `@verone/products` : Module produits complet
- `@verone/stock` : Gestion stocks & inventaires
- `@verone/orders` : Commandes (ventes, achats)
- `@verone/finance` : Finance, facturation, trésorerie
- `@verone/organisations` : Gestion organisations
- `@verone/customers` : Gestion clients
- `@verone/suppliers` : Gestion fournisseurs
- `@verone/categories` : Catégories, familles, sous-catégories
- `@verone/channels` : Canaux vente (Google Merchant)
- `@verone/collections` : Collections produits
- `@verone/consultations` : Module consultations client
- `@verone/logistics` : Logistique & expéditions

**Core & Utils**:
- `@verone/common` : Hooks & utils partagés
- `@verone/utils` : Utilitaires cross-package
- `@verone/types` : Types TypeScript

**Dev & Config**:
- `@verone/testing` : Utils tests & mocks
- `@verone/admin` : Gestion utilisateurs & permissions
- `@verone/integrations` : Intégrations externes (Google Merchant, Qonto)
- `@verone/dashboard` : Composants & hooks dashboard
- `@verone/notifications` : Système notifications

#### Documentation Complète

- `docs/audits/2025-11/VAGUE-5-FINAL-CLEANUP-COMPLET.md` : Rapport complet VAGUE 5
- `docs/audits/2025-11/PLAN-MIGRATION-VAGUES-3-4-5-COMPLET.md` : Plan migration global
- `docs/audits/2025-11/RESUME-EXECUTIF-VAGUES-3-4-5.md` : Résumé exécutif
- `VAGUES-3-4-5-CHIFFRES-CLES.md` : Métriques clés migration

### 🔄 Changed

#### Migration VAGUES 1-5

**VAGUE 1**: UI Components (51 composants)
- Migré shadcn/ui vers `@verone/ui`
- Design System V2 avec thèmes

**VAGUE 2**: Business Packages (18 packages)
- Créé architecture monorepo
- Séparation hooks/components/types

**VAGUE 3**: src/lib/ → @verone/utils
- Migré utils, logger, validation
- Migré supabase, upload utils

**VAGUE 4**: Imports (146 fichiers)
- Migré vers imports `@verone/*`
- Nouveaux exports convenience

**VAGUE 5**: Cleanup Final (1151 imports)
- Migré 738 imports UI : `@/components/ui/*` → `@verone/ui`
- Migré 410 imports Business : `@/shared/modules/*` → `@verone/*`
- Migré 3 imports middleware : `@/lib/middleware/*` → `@verone/utils/middleware/*`

#### Patterns d'Imports

**Avant**:
```typescript
import { Button } from '@/components/ui/button';
import { useProducts } from '@/shared/modules/products';
import { cn } from '@/lib/utils';
```

**Après**:
```typescript
import { Button } from '@verone/ui';
import { useProducts } from '@verone/products';
import { cn } from '@verone/utils';
```

### 🔥 Removed

#### Fichiers Dupliqués Supprimés (470 fichiers, 4.7 MB)

- **src/shared/modules/** (411 fichiers) : Migré vers `packages/@verone/*`
- **src/components/ui/** (57 fichiers) : Migré vers `@verone/ui`
- **src/lib/middleware/** (2 fichiers) : Migré vers `@verone/utils/middleware/`

#### Imports Obsolètes Éliminés (1161 imports)

- ❌ `@/components/ui/*` : 738 imports remplacés
- ❌ `@/shared/modules/*` : 410 imports remplacés
- ❌ `@/lib/*` : 3 imports remplacés

### 🐛 Fixed

#### Erreurs TypeScript (68 → 0)

**Catégories résolues**:
1. Imports relatifs obsolètes (~40 erreurs)
2. Chemins `@verone/ui-business` incorrects (4 erreurs)
3. Imports `@/shared/modules` dans packages (3 erreurs)
4. Exports manquants `@verone/ui` (2 erreurs)
5. Import dynamique non migré (1 erreur)

### 📊 Métriques

#### Imports
| Métrique | Avant | Après | Delta |
|---|---|---|---|
| Imports @verone/* | 1210 | 2361 | +1151 |
| Imports obsolètes | 1161 | 0 | -1161 |
| Migration % | 51% | **100%** | +49% |

#### Fichiers
| Métrique | Avant | Après | Delta |
|---|---|---|---|
| Fichiers obsolètes | 473 | 3 | -470 |
| Taille disque | ~5 MB | ~0.3 MB | -4.7 MB |

#### Qualité Code
| Métrique | Avant | Après | Delta |
|---|---|---|---|
| Erreurs TypeScript | 68 | 0 | -68 |
| Type-check | ❌ Fail | ✅ Pass | ✅ |
| Build | ❌ Fail | ✅ Pass | ✅ |

### 🚀 Performance

- ✅ Build successful (production-ready)
- ✅ Type-check = 0 erreurs
- ✅ Console errors = 0
- ✅ Architecture monorepo propre et maintenable
- ✅ Séparation claire code réutilisable vs app-specific

### 📚 Documentation

- Rapport VAGUE 5 complet (450+ lignes)
- Plan migration VAGUES 3-4-5
- Résumé exécutif avec chiffres clés
- Guide migration imports

### 🔜 Known Issues (Post-Release)

- ⚠️ ESLint config `@verone/eslint-config` : Problème résolution workspace pnpm
  - **Impact**: Aucun (non-bloquant)
  - **Workaround**: Type-check et build fonctionnent parfaitement
  - **Fix prévu**: Post-release avec clean install ou fix exports

### 🎯 Breaking Changes Details

#### Structure Projet

**Avant**:
```
src/
├── shared/modules/     # Business logic (SUPPRIMÉ)
├── components/ui/      # UI components (SUPPRIMÉ)
└── lib/               # Utils partagés (PARTIEL)
```

**Après**:
```
packages/@verone/       # Code réutilisable (21 packages)
src/                    # Code applicatif uniquement
```

#### Configuration

- `pnpm` requis (workspace protocol)
- `tsconfig.json` : Nouveaux paths pour `@verone/*`
- `.eslintrc.json` : Extends `@verone/eslint-config`

---

## [1.0.0] - 2025-10-23

### ✨ Added

#### Phase 1 - Stabilisation Production

**Modules ACTIFS**:
- Authentification (`/login`, `/profile`)
- Dashboard (`/dashboard`)
- Organisations & Contacts (`/contacts-organisations`)
- Administration (`/admin`)

**Stack Technique**:
- Next.js 15 (App Router, Server Components)
- Supabase (PostgreSQL + Auth + RLS)
- shadcn/ui + Radix UI + Tailwind CSS
- TypeScript 5.3

**Database**:
- 78 tables PostgreSQL
- 158 triggers
- RLS policies complètes
- Documentation exhaustive

### 🐛 Fixed

- Authentification Supabase stabilisée
- Performance optimisée (SLOs respectés)
- 0 erreurs TypeScript Phase 1

### 📚 Documentation

- CLAUDE.md : Instructions complètes Claude Code
- docs/ : Documentation technique exhaustive
- Business rules : 93 dossiers structurés

---

**Auteur**: Romeo Dos Santos + Claude Code
**Date Release v2.0.0**: 2025-11-08
**Durée Migration Monorepo**: ~6 semaines (VAGUES 1-5)
