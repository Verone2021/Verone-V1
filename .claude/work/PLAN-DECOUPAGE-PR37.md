# Plan de Découpage PR #37

**Date** : 2026-01-15
**Branche source** : `fix/multi-bugs-2026-01`
**Total commits** : 195 (56 avec Task ID, 48 chore(plan), 91 autres)

---

## 📊 Analyse des Task IDs

| Task ID | Commits | Description | Statut |
|---------|---------|-------------|--------|
| **LM-ORD-009** | 12 | Refonte OrderFormUnified (6 steps) | ⚠️ INCOMPLET (1 fichier non commité) |
| **BO-FORM-001** | 8 | Form submission system (Resend emails) | ✅ COMPLET |
| **BO-WORK-001-005** | 5 | Workflow infrastructure + ACTIVE.md | ✅ COMPLET |
| **LM-ORD-005** | 3 | Workflow création commande | ✅ COMPLET |
| **LM-ADDR-001** | 3 | Géolocalisation adresses | ✅ COMPLET |
| **LM-ORD-004** | 3 | Pré-remplissage contacts | ✅ COMPLET |
| **LM-SEL-003** | 2 | Optimisation sélections publiques | ✅ COMPLET |
| **LM-ORD-007** | 2 | Fix owner_type + RLS | ✅ COMPLET |
| **LM-ORD-006** | 2 | Refonte UX sélection produits | ✅ COMPLET |
| **LM-ORG-001-003** | 3 | Organisations (map, reseau) | ✅ COMPLET |
| **LM-AUTH-001** | 1 | Fix spinner infini | ✅ COMPLET |
| **BO-SENTRY-001** | 1 | + 4 NO-TASK | ✅ COMPLET (Sentry setup + config) |
| **WEB-DEV-001** | 1 | Fix symlinks site-internet | ✅ COMPLET |
| **LM-SEL-001** | 1 | Pagination sélections | ✅ COMPLET |
| **Sans Task ID** | ~90 | Dashboard improvements, fixes divers | ⚠️ À regrouper |

---

## 🎯 Stratégie de Découpage

### Option 1 : CONSERVATRICE (Recommandée)
**12 PRs** créées depuis main, une par fonctionnalité cohérente

### Option 2 : AGRESSIVE
**20+ PRs** une par Task ID individuel

### Option 3 : HYBRIDE
**8 PRs** regroupées par domaine (Back-Office, LinkMe Orders, LinkMe Organisations, etc.)

---

## 📋 Plan Détaillé - Option 1 (RECOMMANDÉE)

### Groupe 1 : Infrastructure & Workflow
**PR** : `chore/workflow-infrastructure`
**Task IDs** : BO-WORK-001 à BO-WORK-005
**Commits** : 5
**Priorité** : 🔴 HAUTE (fondation pour les autres PRs)

```bash
# Commits à cherry-pick
738dcc67 [BO-WORK-001] feat(workflow): implement Claude Code workflow
df2bbf09 [BO-WORK-001] fix(workflow): skip sync check for chore(plan)
ff74fdaa [BO-WORK-002] fix(workflow): improve Stop hook robustness
d695ad88 [BO-WORK-003] docs(workflow): document Task ID workflow
b447c5ef [BO-WORK-004] chore(workflow): add READ→WRITE handoff mailbox
9afe8fb2 [BO-WORK-005] feat(workflow): implement multi-agent workflow
```

**Dépendances** : AUCUNE
**Ordre de merge** : #1

---

### Groupe 2 : Monitoring Sentry
**PR** : `feat/sentry-monitoring-complete`
**Task IDs** : BO-SENTRY-001 + NO-TASK (sentry)
**Commits** : 5
**Priorité** : 🟠 MOYENNE

```bash
# Commits à cherry-pick
0368aeca [BO-SENTRY-001] feat(monitoring): add Sentry expert setup
eb313d50 [NO-TASK] fix(sentry): update org/project to verone-4q
6a167e22 [NO-TASK] fix(sentry): migrate automaticVercelMonitors
8184e314 [NO-TASK] fix(sentry): migrate to Next.js 15 instrumentation
125f3ee8 [NO-TASK] fix(sentry): add onRouterTransitionStart hook
```

**Dépendances** : AUCUNE
**Ordre de merge** : #2

---

### Groupe 3 : Form Submission System
**PR** : `feat/form-submission-system`
**Task IDs** : BO-FORM-001
**Commits** : 8
**Priorité** : 🟢 BASSE (feature isolée)

```bash
# Commits à cherry-pick
84b9216b [BO-FORM-001] feat(forms): create extensible form system - Phase 1
0a18fcba [BO-FORM-001] feat(forms): implement API routes - Phase 2
d9d4c604 [BO-FORM-001] feat(forms): integrate ContactForm - Phase 3
655cf546 [BO-FORM-001] feat(forms): create back-office UI - Phase 4
a5be00fe [BO-FORM-001] feat(forms): implement conversion actions - Phase 5
4d8d64a6 [BO-FORM-001] fix(emails): make email sending optional
c1f00f4a [BO-FORM-001] docs(linkme): add Resend config guide
cc9f6930 [BO-FORM-001] feat(forms): implement notification settings - Phase 6
```

**Dépendances** : AUCUNE
**Ordre de merge** : #3

---

### Groupe 4 : LinkMe Organisations
**PR** : `feat/linkme-organisations-improvements`
**Task IDs** : LM-ORG-001, LM-ORG-002, LM-ORG-003
**Commits** : 3
**Priorité** : 🟠 MOYENNE

```bash
# Commits à cherry-pick
e3930d65 [LM-ORG-001] refactor(linkme): move /reseau to /organisations
7a48a74d [LM-ORG-002] fix(linkme): restore map view features
8a44b70f [LM-ORG-003] feat: improve map popup design
```

**Dépendances** : AUCUNE
**Ordre de merge** : #4

---

### Groupe 5 : LinkMe Sélections Publiques
**PR** : `feat/linkme-public-selections-ux`
**Task IDs** : LM-SEL-001, LM-SEL-003
**Commits** : 3
**Priorité** : 🟠 MOYENNE

```bash
# Commits à cherry-pick
ae83cc67 [LM-SEL-001] feat: add pagination and tab navigation
8e482ddb [LM-SEL-003] feat: optimize UX with category bar
abaae16a [LM-SEL-003] fix: reduce pagination button size
```

**Dépendances** : AUCUNE
**Ordre de merge** : #5

---

### Groupe 6 : LinkMe Address Geolocation
**PR** : `feat/linkme-address-geolocation`
**Task IDs** : LM-ADDR-001
**Commits** : 3
**Priorité** : 🟡 MOYENNE-HAUTE (dépendance pour LM-ORD-*)

```bash
# Commits à cherry-pick
3d7cdbc6 [LM-ADDR-001] feat: integrate AddressAutocomplete in CreateOrderModal
2e6fe258 [LM-ADDR-001] feat: integrate AddressAutocomplete in OrderFormUnified
45da14be [LM-ADDR-001] feat: add geolocation support to public orders
```

**Dépendances** : AUCUNE
**Ordre de merge** : #6

---

### Groupe 7 : LinkMe Orders Basic Workflow
**PR** : `feat/linkme-orders-workflow-improvements`
**Task IDs** : LM-ORD-004, LM-ORD-005
**Commits** : 6
**Priorité** : 🟡 MOYENNE-HAUTE

```bash
# Commits à cherry-pick
53b5809c [LM-ORD-004] feat: auto-fill contact data
880af835 [LM-ORD-004] feat: auto-fill in CreateOrderModal
9329ba7e [LM-ORD-004] feat: add localStorage cache for requester
8ef01629 [LM-ORD-005] fix: correct requester in workflow (phases 1-3)
67b776e7 [LM-ORD-005] feat: complete workflow with labels (phases 4-5)
55225ab2 [LM-ORD-005] feat: auto-create contacts in CRM
```

**Dépendances** : Groupe 6 (LM-ADDR-001)
**Ordre de merge** : #7

---

### Groupe 8 : LinkMe Product Selection UX
**PR** : `feat/linkme-product-selection-refactor`
**Task IDs** : LM-ORD-006
**Commits** : 2
**Priorité** : 🟠 MOYENNE

```bash
# Commits à cherry-pick
59b9d2c9 [LM-ORD-006] feat: refactor product selection UX - Phases 1-3
df39f4a8 [LM-ORD-006] feat: complete refactor - Phase 4-5
```

**Dépendances** : AUCUNE
**Ordre de merge** : #8

---

### Groupe 9 : LinkMe Order Fixes
**PR** : `fix/linkme-order-owner-type-rls`
**Task IDs** : LM-ORD-007
**Commits** : 2
**Priorité** : 🔴 HAUTE (fix critique)

```bash
# Commits à cherry-pick
363d8ac7 [LM-ORD-007] fix: resolve anonymous order creation RLS
e8463feb [LM-ORD-007] fix: update owner_type constraint to accept 'succursale'
```

**Dépendances** : Groupe 7 (LM-ORD-004/005)
**Ordre de merge** : #9

---

### Groupe 10 : LinkMe Auth Fix
**PR** : `fix/linkme-infinite-loading`
**Task IDs** : LM-AUTH-001
**Commits** : 1
**Priorité** : 🔴 HAUTE (fix critique)

```bash
# Commits à cherry-pick
20658534 [LM-AUTH-001] fix: resolve infinite loading in dashboard
```

**Dépendances** : AUCUNE
**Ordre de merge** : #10

---

### Groupe 11 : Site Internet Dependencies Fix
**PR** : `fix/site-internet-dependencies`
**Task IDs** : WEB-DEV-001
**Commits** : 1
**Priorité** : 🟢 BASSE

```bash
# Commits à cherry-pick
25f97a3d [WEB-DEV-001] fix: reinstall dependencies to fix Next.js symlinks
```

**Dépendances** : AUCUNE
**Ordre de merge** : #11

---

### Groupe 12 : Dashboard & Misc Improvements
**PR** : `feat/dashboard-improvements-batch`
**Task IDs** : Aucun (commits sans Task ID)
**Commits** : ~15 principaux
**Priorité** : 🟢 BASSE

```bash
# Commits à cherry-pick (sélection)
af615d90 feat(organisations): add GPS coordinates
eeab3cf2 feat(linkme): migrate to MapLibre GL
55bf8878 feat(dashboard): connect KPIs to real data
11071703 feat(linkme): add OrganisationDetailSheet
81bb5e70 chore: fix linting and type exports
d33c6c8c feat(dashboard): add 6-column layout
3f7b7b79 feat(dashboard): implement Dashboard V2
3326652a fix(linkme): search contacts by enseigne_id
c10ad941 feat(linkme): refactor public selection into tabs
c2cb04a8 fix(linkme): multiple bug fixes
dd99b005 feat(linkme): add quick edit modals
8671f359 fix(linkme): fix contacts display
631db0de fix(dashboard,linkme): dashboard improvements
f370534e feat(dashboard): implement Recharts charts
a6abfccd fix(dashboard): fix 6 critical bugs
2e210996 fix(dashboard): fix 4 persistent bugs
```

**Dépendances** : Groupes 4, 5 (LinkMe organisations/sélections)
**Ordre de merge** : #12

---

## ⚠️ EXCLUSION : LM-ORD-009

**Task ID** : LM-ORD-009 (Refonte OrderFormUnified)
**Commits** : 12
**Statut** : ⚠️ **INCOMPLET**

**Raison d'exclusion** :
- 1 fichier non commité : `apps/linkme/src/components/OrderFormUnified.tsx`
- Travail en cours selon ACTIVE.md
- Phases 1-9 complétées mais phase 10 (tests) reste à faire
- Dépend de plusieurs autres features (LM-ORD-004, LM-ORD-005, LM-ORD-007, LM-ADDR-001)

**Recommandation** :
1. **Finir LM-ORD-009 d'abord** (compléter tests, commiter fichier modifié)
2. **OU** créer une nouvelle branche propre depuis main après merge des dépendances
3. **OU** laisser dans PR #37 et merger les autres features d'abord

---

## 📅 Ordre de Merge Recommandé

| Ordre | PR | Priorité | Raison |
|-------|-----|----------|--------|
| 1 | Infrastructure & Workflow | 🔴 HAUTE | Fondation pour workflow |
| 2 | Monitoring Sentry | 🟠 MOYENNE | Monitoring production |
| 3 | LinkMe Auth Fix | 🔴 HAUTE | Fix critique utilisateur |
| 4 | LinkMe Address Geolocation | 🟡 HAUTE | Dépendance pour orders |
| 5 | LinkMe Orders Workflow | 🟡 HAUTE | Feature principale |
| 6 | LinkMe Order Fixes (RLS) | 🔴 HAUTE | Fix critique après workflow |
| 7 | LinkMe Organisations | 🟠 MOYENNE | Amélioration UX |
| 8 | LinkMe Sélections | 🟠 MOYENNE | Amélioration UX |
| 9 | LinkMe Product Selection | 🟠 MOYENNE | Amélioration UX |
| 10 | Form Submission System | 🟢 BASSE | Feature isolée |
| 11 | Site Internet Fix | 🟢 BASSE | Fix app séparée |
| 12 | Dashboard Improvements | 🟢 BASSE | Batch de petites améliorations |

---

## 🛠️ Procédure de Création des PRs

### Étape 1 : Synchroniser le plan actuel

```bash
# Sur fix/multi-bugs-2026-01
git add apps/linkme/src/components/OrderFormUnified.tsx
git commit -m "[LM-ORD-009] wip: save current OrderFormUnified state"
pnpm plan:sync
git commit -am "chore(plan): sync before PR split"
git push origin fix/multi-bugs-2026-01
```

### Étape 2 : Créer les branches

```bash
# S'assurer d'être sur main à jour
git checkout main
git pull origin main

# Créer chaque branche
git checkout -b chore/workflow-infrastructure main
git checkout -b feat/sentry-monitoring-complete main
git checkout -b feat/form-submission-system main
git checkout -b feat/linkme-organisations-improvements main
git checkout -b feat/linkme-public-selections-ux main
git checkout -b feat/linkme-address-geolocation main
git checkout -b feat/linkme-orders-workflow-improvements main
git checkout -b feat/linkme-product-selection-refactor main
git checkout -b fix/linkme-order-owner-type-rls main
git checkout -b fix/linkme-infinite-loading main
git checkout -b fix/site-internet-dependencies main
git checkout -b feat/dashboard-improvements-batch main
```

### Étape 3 : Cherry-pick par groupe

**Exemple pour Groupe 1 (Infrastructure)**

```bash
git checkout chore/workflow-infrastructure

# Cherry-pick dans l'ordre chronologique
git cherry-pick 738dcc67  # BO-WORK-001
git cherry-pick df2bbf09  # BO-WORK-001
git cherry-pick ff74fdaa  # BO-WORK-002
git cherry-pick d695ad88  # BO-WORK-003
git cherry-pick b447c5ef  # BO-WORK-004
git cherry-pick 9afe8fb2  # BO-WORK-005

# Résoudre conflits si nécessaire

# Tester
npm run type-check
npm run build

# Pousser
git push origin chore/workflow-infrastructure
```

**Répéter pour chaque groupe.**

### Étape 4 : Créer les PRs sur GitHub

```bash
# Pour chaque branche
gh pr create \
  --base main \
  --head chore/workflow-infrastructure \
  --title "chore: implement Claude Code workflow infrastructure" \
  --body "## Summary

- Implement Claude Code workflow with ACTIVE.md as single source of truth
- Add Task ID workflow enforcement
- Improve Stop hook robustness
- Add READ→WRITE handoff mailbox
- Document multi-agent workflow

## Task IDs
- BO-WORK-001 to BO-WORK-005

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify workflow hooks work correctly
- [ ] Verify ACTIVE.md sync works

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

### Étape 5 : Fermer PR #37

```bash
# Une fois toutes les PRs créées
gh pr close 37 --comment "Fermée et découpée en 12 PRs plus petites pour faciliter la review :

- #XX : Infrastructure & Workflow
- #XX : Monitoring Sentry
- #XX : Form Submission System
- #XX : LinkMe Organisations
- #XX : LinkMe Sélections
- #XX : LinkMe Address Geolocation
- #XX : LinkMe Orders Workflow
- #XX : LinkMe Product Selection
- #XX : LinkMe Order Fixes
- #XX : LinkMe Auth Fix
- #XX : Site Internet Fix
- #XX : Dashboard Improvements

LM-ORD-009 sera traité dans une PR séparée une fois les dépendances mergées."
```

---

## ⏱️ Estimation de Temps

| Étape | Durée |
|-------|-------|
| Synchroniser plan actuel | 10 min |
| Créer 12 branches | 5 min |
| Cherry-pick Groupe 1-6 | 2-3h (conflits possibles) |
| Cherry-pick Groupe 7-12 | 2-3h (conflits possibles) |
| Tests de chaque PR | 3-4h (type-check, build) |
| Créer 12 PRs sur GitHub | 1-2h (descriptions) |
| **TOTAL** | **8-12h** |

---

## 🚨 Risques & Mitigations

### Risque 1 : Conflits de cherry-pick
**Probabilité** : HAUTE (features se touchent)
**Impact** : MOYEN (résolution manuelle)
**Mitigation** : Cherry-pick dans l'ordre chronologique, résoudre au fur et à mesure

### Risque 2 : Dépendances circulaires
**Probabilité** : MOYENNE
**Impact** : ÉLEVÉ (bloque merge)
**Mitigation** : Respecter strictement l'ordre de merge recommandé

### Risque 3 : Tests échouent sur certaines PRs
**Probabilité** : ÉLEVÉE (checks actuels échouent)
**Impact** : BLOQUANT
**Mitigation** : Fixer TypeScript/Build sur CHAQUE PR avant de créer la suivante

### Risque 4 : LM-ORD-009 orphelin
**Probabilité** : MOYENNE
**Impact** : MOYEN (travail à refaire)
**Mitigation** : Créer branche propre depuis main après merge des dépendances

---

## ✅ Checklist de Validation

### Avant de commencer
- [ ] Backup branche actuelle : `git branch backup/fix-multi-bugs-2026-01-full`
- [ ] Commiter tous les fichiers modifiés
- [ ] Synchroniser ACTIVE.md
- [ ] Main à jour : `git checkout main && git pull origin main`

### Pour chaque PR
- [ ] Cherry-pick commits dans l'ordre chronologique
- [ ] Résoudre conflits
- [ ] `npm run type-check` = 0 erreurs
- [ ] `npm run build` = Build succeeded
- [ ] Description PR complète (Task IDs, dependencies, test plan)
- [ ] Pousser branche
- [ ] Créer PR sur GitHub
- [ ] Vérifier checks CI/CD passent au vert

### Après toutes les PRs
- [ ] Fermer PR #37 avec commentaire explicatif
- [ ] Décider du sort de LM-ORD-009 (finir ou refaire)
- [ ] Nettoyer branches locales obsolètes
- [ ] Documenter leçons apprises

---

## 📚 Alternatives Considérées

### Alternative A : Squash & Merge PR #37 telle quelle
❌ **Rejeté** : Impossible (checks CI/CD échouent), difficile à review, pas de rollback granulaire

### Alternative B : Fix checks puis merge PR #37
❌ **Rejeté** : PR trop grosse, review impossible, risque de bugs non détectés

### Alternative C : Découper en 20+ PRs (une par Task ID)
❌ **Rejeté** : Trop de PRs, overhead de management, certains Task IDs trop petits

### Alternative D : Découper en 8 PRs (par domaine)
✅ **Possible** : Compromis entre granularité et nombre de PRs, mais moins contrôle

### Alternative E : Découper en 12 PRs (Option 1)
✅ **RETENU** : Équilibre optimal entre granularité, review, et effort

---

**Prochaine étape** : Obtenir validation utilisateur avant de commencer le découpage.
