# Audit ESLint - Synthèse Exécutive

**Date** : 2026-02-01  
**Scope** : `@verone/back-office`

---

## 📊 Vue d'Ensemble

<<<<<<< Updated upstream
| Métrique | Valeur |
|----------|--------|
| **Total fichiers** | 177 |
| **Total warnings** | 2,712 |
| **Moyenne warnings/fichier** | 15.3 |
| **Médiane warnings/fichier** | 10 |
=======
| Métrique                     | Valeur |
| ---------------------------- | ------ |
| **Total fichiers**           | 177    |
| **Total warnings**           | 2,712  |
| **Moyenne warnings/fichier** | 15.3   |
| **Médiane warnings/fichier** | 10     |
>>>>>>> Stashed changes

---

## 🎯 Top 5 Règles ESLint (Impact Majeur)

<<<<<<< Updated upstream
| Rang | Règle | Occurrences | Fichiers | % Total |
|------|-------|-------------|----------|---------|
| 1 | `@typescript-eslint/no-unsafe-member-access` | 1,102 | 110 | 40.6% |
| 2 | `@typescript-eslint/no-unsafe-assignment` | 556 | 132 | 20.5% |
| 3 | `@typescript-eslint/no-unsafe-call` | 297 | 80 | 10.9% |
| 4 | `@typescript-eslint/no-explicit-any` | 214 | 83 | 7.9% |
| 5 | `prettier/prettier` | 167 | 117 | 6.2% |
=======
| Rang | Règle                                        | Occurrences | Fichiers | % Total |
| ---- | -------------------------------------------- | ----------- | -------- | ------- |
| 1    | `@typescript-eslint/no-unsafe-member-access` | 1,102       | 110      | 40.6%   |
| 2    | `@typescript-eslint/no-unsafe-assignment`    | 556         | 132      | 20.5%   |
| 3    | `@typescript-eslint/no-unsafe-call`          | 297         | 80       | 10.9%   |
| 4    | `@typescript-eslint/no-explicit-any`         | 214         | 83       | 7.9%    |
| 5    | `prettier/prettier`                          | 167         | 117      | 6.2%    |
>>>>>>> Stashed changes

**Total Top 5** : 2,336 warnings (86.1% du total)

---

## 🔥 Top 10 Fichiers Critiques

<<<<<<< Updated upstream
| Rang | Fichier | Warnings | Impact |
|------|---------|----------|--------|
| 1 | `stocks/receptions/page.tsx` | 210 | 🔴 CRITIQUE |
| 2 | `stocks/expeditions/page.tsx` | 165 | 🔴 CRITIQUE |
| 3 | `canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx` | 67 | 🔴 ÉLEVÉ |
| 4 | `parametres/notifications/actions.ts` | 59 | 🔴 ÉLEVÉ |
| 5 | `canaux-vente/linkme/components/EnseignesSection.tsx` | 58 | 🔴 ÉLEVÉ |
| 6 | `prises-contact/[id]/page.tsx` | 57 | 🔴 ÉLEVÉ |
| 7 | `api/google-merchant/test-connection/route.ts` | 57 | 🔴 ÉLEVÉ |
| 8 | `canaux-vente/linkme/hooks/use-linkme-storage.ts` | 55 | 🔴 ÉLEVÉ |
| 9 | `api/google-merchant/sync-product/[id]/route.ts` | 55 | 🔴 ÉLEVÉ |
| 10 | `canaux-vente/linkme/components/AffiliatesSection.tsx` | 52 | 🔴 ÉLEVÉ |
=======
| Rang | Fichier                                                     | Warnings | Impact      |
| ---- | ----------------------------------------------------------- | -------- | ----------- |
| 1    | `stocks/receptions/page.tsx`                                | 210      | 🔴 CRITIQUE |
| 2    | `stocks/expeditions/page.tsx`                               | 165      | 🔴 CRITIQUE |
| 3    | `canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx` | 67       | 🔴 ÉLEVÉ    |
| 4    | `parametres/notifications/actions.ts`                       | 59       | 🔴 ÉLEVÉ    |
| 5    | `canaux-vente/linkme/components/EnseignesSection.tsx`       | 58       | 🔴 ÉLEVÉ    |
| 6    | `prises-contact/[id]/page.tsx`                              | 57       | 🔴 ÉLEVÉ    |
| 7    | `api/google-merchant/test-connection/route.ts`              | 57       | 🔴 ÉLEVÉ    |
| 8    | `canaux-vente/linkme/hooks/use-linkme-storage.ts`           | 55       | 🔴 ÉLEVÉ    |
| 9    | `api/google-merchant/sync-product/[id]/route.ts`            | 55       | 🔴 ÉLEVÉ    |
| 10   | `canaux-vente/linkme/components/AffiliatesSection.tsx`      | 52       | 🔴 ÉLEVÉ    |
>>>>>>> Stashed changes

**Total Top 10** : 835 warnings (30.8% du total)

---

## 📈 Distribution des Warnings

<<<<<<< Updated upstream
| Catégorie | Fichiers | % Total |
|-----------|----------|---------|
| **1-5 warnings** | 52 | 29.4% |
| **6-10 warnings** | 35 | 19.8% |
| **11-20 warnings** | 42 | 23.7% |
| **21-50 warnings** | 34 | 19.2% |
| **50+ warnings** (CRITIQUE) | 14 | 7.9% |
=======
| Catégorie                   | Fichiers | % Total |
| --------------------------- | -------- | ------- |
| **1-5 warnings**            | 52       | 29.4%   |
| **6-10 warnings**           | 35       | 19.8%   |
| **11-20 warnings**          | 42       | 23.7%   |
| **21-50 warnings**          | 34       | 19.2%   |
| **50+ warnings** (CRITIQUE) | 14       | 7.9%    |
>>>>>>> Stashed changes

---

## 🎯 Recommandations Stratégiques

### 1. Quick Wins (ROI Élevé)

**Règle : `prettier/prettier` (167 occurrences)**
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- ✅ **Fixable automatiquement** : `pnpm lint --fix`
- ⏱️ **Temps estimé** : 5 minutes
- 📉 **Impact** : -6.2% warnings

**Action** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
```bash
pnpm --filter @verone/back-office lint --fix
```

### 2. Refactoring Type-Safety (Impact Majeur)

**Règles : `no-unsafe-*` (1,955 occurrences, 72% du total)**

**Cible 1 : Fichiers Critiques (Top 10)**
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- 🎯 **Focus** : `stocks/receptions/page.tsx` (210 warnings)
- 🎯 **Focus** : `stocks/expeditions/page.tsx` (165 warnings)
- ⏱️ **Temps estimé** : 4-6 heures (typages explicites)
- 📉 **Impact** : -13.8% warnings (375 occurrences)

**Cible 2 : Hooks & Storage**
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- 🎯 **Focus** : `use-linkme-storage.ts`, `use-linkme-orders.ts`
- ⏱️ **Temps estimé** : 2-3 heures
- 📉 **Impact** : Améliore type-safety transversale

**Action** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- Utiliser `/fix-warnings` pour workflow intelligent
- Démarrer par les fichiers avec le plus de `no-explicit-any`
- Ajouter types explicites (`Record<string, unknown>` vs `any`)

### 3. Patterns API (Mutualisation)

**Cible : Routes API Google Merchant**
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- `api/google-merchant/test-connection/route.ts` (57 warnings)
- `api/google-merchant/sync-product/[id]/route.ts` (55 warnings)

**Action** :
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
- Créer types partagés pour Google Merchant API
- Centraliser dans `packages/@verone/types/google-merchant.ts`
- Refactorer routes pour utiliser types explicites

---

## 🚀 Plan d'Action (3 Phases)

### Phase 1 : Quick Wins (1 jour)

- [x] Audit complet généré
- [ ] Fix automatique prettier : `pnpm lint --fix`
- [ ] Commit : `[BO-LINT-000] chore: auto-fix prettier warnings`

**Objectif** : -167 warnings (-6.2%)

### Phase 2 : Fichiers Critiques (1 semaine)

- [ ] Refactor `stocks/receptions/page.tsx` (210 → 0)
- [ ] Refactor `stocks/expeditions/page.tsx` (165 → 0)
- [ ] Refactor CreateLinkMeOrderModal (67 → 0)
- [ ] Tests après chaque refactor

**Objectif** : -442 warnings (-16.3%)

### Phase 3 : Type-Safety Générale (2-3 semaines)

- [ ] Créer types Google Merchant API
- [ ] Refactor hooks LinkMe
- [ ] Refactor routes API
- [ ] Migration progressive `any` → types explicites

**Objectif** : -1,000+ warnings (-37%)

---

## 📁 Rapports Détaillés

1. **[Warnings Détaillés par Fichier](./eslint-warnings-detailed-2026-02-01.md)** (250 KB)
   - Tous les warnings ligne par ligne

2. **[Warnings par Règle ESLint](./eslint-warnings-by-rule-2026-02-01.md)**
   - Analyse par type de problème

3. **[Fichiers Critiques (Top 50)](./eslint-critical-files-2026-02-01.md)**
   - Priorisation refactoring

---

## 📊 Objectif 2026

**Cible Q1 2026** : < 1,000 warnings (-63%)
**Cible Q2 2026** : < 500 warnings (-82%)
**Cible Q3 2026** : 0 warnings (clean build)

---

## 🛠️ Outils Disponibles

```bash
# Workflow intelligent Claude
/fix-warnings

# Fix automatique
pnpm --filter @verone/back-office lint --fix

# Audit continu
pnpm --filter @verone/back-office lint | grep "warning"
```

---

**Généré par** : Claude Code (Audit ESLint Automatisé)  
**Prochaine révision** : 2026-02-15
