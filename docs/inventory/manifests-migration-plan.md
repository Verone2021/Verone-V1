# Phase 3B - Migration manifests/ → docs/

**Date**: 2026-01-20
**Objectif**: Migrer tout le contenu utile de manifests/ vers docs/ (source de vérité unique)

## Audit manifests/

**Taille**: 9,164 lignes total (19 fichiers .md)

**Structure actuelle**:
```
manifests/
├── architecture/          (4 fichiers)
├── database-standards/    (1 fichier)
├── development-standards/ (1 fichier)
├── features/              (3 fichiers)
├── prd/current/           (6 fichiers PRD)
├── technical-specs/       (2 fichiers)
└── technical-workflows/   (2 fichiers)
```

**Références code**: 13 fichiers référencent manifests/ (voir grep output)

---

## Catégorisation du contenu

### ✅ KEEP & MIGRATE (17 fichiers)

#### 1. PRD (6 fichiers) → `docs/prd/`
- `PRD-ADMIN-PRICING-CURRENT.md`
- `PRD-CATALOGUE-CURRENT.md`
- `PRD-COMMANDES-CURRENT.md`
- `PRD-DASHBOARD-CURRENT.md`
- `PRD-FINANCE-CURRENT.md`
- `PRD-STOCKS-CURRENT.md`

**Action**: Migrer vers `docs/prd/current/` (structure identique)

#### 2. Standards (2 fichiers) → `docs/engineering/standards/`
- `database-standards/CRITICAL-TABLES-PROTECTION.md` → `docs/engineering/standards/database/`
- `development-standards/DATA-STATUS-BADGE-RULES.md` → `docs/engineering/standards/ui/`

**Raison**: Ces docs sont des standards officiels Vérone (marqués "✅ Standard officiel")

#### 3. Architecture (4 fichiers) → `docs/architecture/`
- `feeds-specifications-google.md`
- `feeds-specifications-facebook.md`
- `stock-orders-system-architecture.md`
- `database-schema-corrections-v2.md`

**Action**: Migrer vers `docs/architecture/` (merge si redondance)

#### 4. Features (3 fichiers) → `docs/features/`
- `SYSTEME-EXPEDITIONS-MULTI-METHODES.md`
- `SYSTEME-EXPEDITIONS-MULTI-TRANSPORTEURS-V2.md`
- `SYSTEME-RAPPORTS-STOCK-COMPLET.md`

**Raison**: Specs fonctionnelles, référencées dans code (StockReportsModal.tsx)

#### 5. Technical Specs (2 fichiers) → `docs/integrations/`
- `google-merchant-setup.md` → `docs/integrations/google-merchant/`
- `performance-targets.md` → `docs/engineering/performance/`

### ⚠️ OBSOLETE (2 fichiers)

#### Technical Workflows (2 fichiers)
- `memory-bank-organization-2025.md` → OBSOLETE (remplacé par structure .claude/)
- `mcp-testing-automation-2025.md` → OBSOLETE (remplacé par tests/README.md)

**Action**: NE PAS MIGRER

---

## Plan de migration

### Étape 1: Créer structure cible dans docs/

```bash
mkdir -p docs/prd/current
mkdir -p docs/engineering/standards/database
mkdir -p docs/engineering/standards/ui
mkdir -p docs/engineering/performance
mkdir -p docs/features
mkdir -p docs/integrations/google-merchant
```

### Étape 2: Migrer fichiers par catégorie

**PRD**:
```bash
cp manifests/prd/current/*.md docs/prd/current/
```

**Standards**:
```bash
cp manifests/database-standards/CRITICAL-TABLES-PROTECTION.md \
   docs/engineering/standards/database/

cp manifests/development-standards/DATA-STATUS-BADGE-RULES.md \
   docs/engineering/standards/ui/
```

**Architecture**:
```bash
cp manifests/architecture/*.md docs/architecture/
```

**Features**:
```bash
cp manifests/features/*.md docs/features/
```

**Technical Specs**:
```bash
cp manifests/technical-specs/google-merchant-setup.md \
   docs/integrations/google-merchant/setup.md

cp manifests/technical-specs/performance-targets.md \
   docs/engineering/performance/targets.md
```

### Étape 3: Mettre à jour références code

**13 fichiers à mettre à jour**:

1. `packages/@verone/utils/src/business-rules/naming-rules.ts` (line 3)
2. `packages/@verone/common/src/utils/naming-rules.ts` (line 3)
3. `packages/@verone/stock/src/components/modals/StockReportsModal.tsx` (line 54)
4. `manifests/prd/current/PRD-DASHBOARD-CURRENT.md` (lines 345-346)
5. `manifests/prd/current/PRD-CATALOGUE-CURRENT.md` (lines 224, 292)
6. `manifests/prd/current/PRD-STOCKS-CURRENT.md` (lines 222-223, 284)
7. `manifests/prd/current/PRD-COMMANDES-CURRENT.md` (lines 302, 379)
8. `manifests/prd/current/PRD-ADMIN-PRICING-CURRENT.md` (lines 398, 474)
9. `manifests/database-standards/CRITICAL-TABLES-PROTECTION.md` (line 697)
10. `apps/back-office/src/app/(protected)/produits/catalogue/README.md` (lines 290-291)
11. `apps/back-office/src/app/(protected)/commandes/README.md` (line 286)
12. `apps/back-office/src/app/(protected)/stocks/README.md` (line 295)
13. `apps/back-office/src/app/(protected)/contacts-organisations/README.md` (line 268)

**Pattern de remplacement**:
```bash
# manifests/prd/ → docs/prd/
# manifests/business-rules/ → docs/engineering/business-rules/ (à créer si existe)
# manifests/database-standards/ → docs/engineering/standards/database/
# manifests/features/ → docs/features/
```

**Note**: Plusieurs refs pointent vers `manifests/business-rules/` qui n'existe PAS actuellement → ces refs sont DÉJÀ CASSÉES

### Étape 4: Mettre à jour docs/README.md

Ajouter section "Product Requirements (PRD)" avec liens vers:
- `docs/prd/current/`
- `docs/features/`
- `docs/architecture/`

### Étape 5: Supprimer manifests/

```bash
git rm -r manifests/
```

---

## Références cassées existantes

**PROBLÈME DÉTECTÉ**: 10+ fichiers référencent `manifests/business-rules/` qui N'EXISTE PAS:
- `manifests/business-rules/WORKFLOWS.md`
- `manifests/business-rules/catalogue.md`
- `manifests/business-rules/stock-movements-workflow.md`
- `manifests/business-rules/orders-lifecycle-management.md`
- `manifests/business-rules/pricing-multi-canaux-clients.md`

**Action**: Ces business rules doivent être créées dans `docs/engineering/business-rules/` ou les refs supprimées si obsolètes

---

## Checklist exécution

- [ ] Créer structure docs/ (mkdir)
- [ ] Migrer 17 fichiers (cp)
- [ ] Mettre à jour 13 références code (Edit tool)
- [ ] Créer/documenter business-rules/ manquantes OU supprimer refs cassées
- [ ] Mettre à jour docs/README.md
- [ ] Supprimer manifests/ (git rm -r)
- [ ] Commit: `[NO-TASK] refactor: migrate manifests/ to docs/ (single source of truth)`

---

## Impact

**Bénéfices**:
- ✅ Source de vérité unique: docs/
- ✅ Structure plus logique (standards → engineering/standards/)
- ✅ Découverte de refs cassées existantes (business-rules/)

**Risques**:
- ⚠️ 13 fichiers à mettre à jour (risque typo)
- ⚠️ Refs cassées business-rules/ à traiter

**Mitigation**:
- Utiliser Edit tool pour chaque modif (atomic)
- Tester type-check après chaque modif
- Commits petits et fréquents
