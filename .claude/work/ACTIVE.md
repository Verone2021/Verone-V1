# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-15 (8ef01629)

## 📋 Session 2026-01-14 (22:00-00:00) - LM-ORG-004 + LM-SEL-003 Complétés

### ✅ LM-ORG-004 — Refonte Gestion Organisations (3 Phases)

**Statut** : ✅ TERMINÉ (8e482ddb)
**Temps réel** : ~90 minutes

### ✅ LM-SEL-003 — Optimiser UX Sélections Publiques (5 Phases)

**Statut** : ✅ CODE TERMINÉ (8e482ddb) - Tests visuels requis
**Commit** : `[LM-SEL-003]` (8e482ddb)
**Temps réel** : ~60 minutes

#### Phases Complétées

**Phase 1: Corrections rapides** ✅
- Pagination: Confirmée à 12 produits/page
- Bouton "Ajouter": Réduit (h-3.5 w-3.5 text-xs, gap-1, px-2.5)

**Phase 2: Données** ✅
- Interface ICategory: Supporte déjà subcategories
- Aucune modification RPC nécessaire

**Phase 3: Composants créés** ✅
- `SelectionCategoryBar.tsx` (140 lignes) - Barre sticky avec badges
- `SelectionCategoryDropdown.tsx` (155 lignes) - Dropdown élégant
- Exports mis à jour dans index.ts

**Phase 4: Intégration** ✅
- Remplacé CategoryTabs par SelectionCategoryBar
- Ajouté SelectionCategoryDropdown conditionnel
- ESLint: 0 erreurs, 0 warnings

**Phase 5: Validation** ✅
- Type-check: 0 erreurs (30/30 tasks)
- Tests visuels: À faire par l'utilisateur

**Fichiers**:
- Modifiés: 2 (page.tsx, index.ts)
- Créés: 2 (SelectionCategoryBar, SelectionCategoryDropdown)
- Total: ~300 lignes

---

### ⚠️ site-internet/.env.local Obsolète

**Statut** : Documentation fournie (permissions bloquent auto-sync)
**Fichier** : Backup créé `.env.local.backup-20260114-*`

**Variables manquantes** (depuis 9 nov 2024):
- `NEXT_PUBLIC_GEOAPIFY_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`
- `PACKLINK_ENVIRONMENT`, `QONTO_AUTH_MODE`
- `VERCEL_*` (mis à jour)

**Action manuelle requise**:
```bash
cp apps/back-office/.env.local apps/site-internet/.env.local
```

---

## 📋 LM-ORG-004 — Détails Techniques

**Statut** : ✅ TERMINÉ
**Temps réel** : ~90 minutes

#### Phase 1 : Refonte OrganisationDetailSheet → Édition Inline

**Problème** : Modal séparée (EditOrganisationModal) = mauvaise UX, composant supplémentaire
**Solution** : Édition inline directement dans OrganisationDetailSheet

**Fichiers modifiés** :
- `apps/linkme/src/components/organisations/OrganisationDetailSheet.tsx` (+150 lignes)
  - Ajout state management (isEditing, formData, errors)
  - Intégration AddressAutocomplete (BAN + Geoapify)
  - Validation inline avec messages d'erreur
  - Mutation Supabase pour sauvegarde
  - Boutons Modifier/Enregistrer/Annuler dans header

**Fichiers supprimés** :
- `apps/linkme/src/components/organisations/EditOrganisationModal.tsx` (obsolète)

**Pattern utilisé** : EditConsultationModal comme référence

#### Phase 2 : Réorganisation UI (Séparation Actions/Filtres)

**Problème** : Actions et filtres mélangés, hiérarchie visuelle confuse
**Solution** : Composants séparés pour meilleure UX

**Fichiers créés** :
- `apps/linkme/src/components/organisations/OrganisationActionsBar.tsx` (40 lignes)
  - Bouton "Nouvelle organisation"
  - Justifié à droite, séparé des filtres
- `apps/linkme/src/components/organisations/OrganisationFilterTabs.tsx` (110 lignes)
  - Onglets : Tout / Succursales / Franchises / Incomplet / Vue Carte
  - Badges avec compteurs dynamiques
  - Icons lucide-react

**Fichiers modifiés** :
- `apps/linkme/src/app/(main)/organisations/page.tsx`
  - Intégration OrganisationActionsBar + OrganisationFilterTabs
  - Suppression code inline tabs
- `apps/linkme/src/components/organisations/index.ts`
  - Exports mis à jour

#### Phase 3 : Fix Routing Notifications (Paramètre ?highlight)

**Problème** : Pas de deep linking, notifications ne peuvent pas pointer vers une org spécifique
**Solution** : URL parameter `?highlight=org-id` avec auto-open + effet visuel

**Fichiers modifiés** :
- `apps/linkme/src/app/(main)/organisations/page.tsx`
  - Import useSearchParams
  - State highlightedOrgId
  - useEffect pour lire ?highlight et auto-open DetailSheet
  - Effet visuel : `animate-pulse ring-4 ring-linkme-turquoise`
  - Cleanup URL après ouverture avec router.replace
  - Auto-removal highlight après 3 secondes

**Code clé ajouté** :
```typescript
const highlightParam = searchParams?.get('highlight');
if (highlightParam && organisations) {
  const orgExists = organisations.some(org => org.id === highlightParam);
  if (orgExists) {
    setDetailSheetOrgId(highlightParam);
    setHighlightedOrgId(highlightParam);
    // Clean URL
    router.replace(newUrl);
    // Remove highlight after 3s
    setTimeout(() => setHighlightedOrgId(null), 3000);
  }
}
```

#### Résumé Technique

**5 fichiers modifiés** :
- OrganisationDetailSheet.tsx (refactor majeur)
- page.tsx (intégration + routing)
- index.ts (exports)
- OrganisationActionsBar.tsx (créé)
- OrganisationFilterTabs.tsx (créé)

**1 fichier supprimé** :
- EditOrganisationModal.tsx

**Technologies** :
- React 18 hooks (useState, useEffect, useMemo, useSearchParams)
- TanStack Query (useMutation, useQueryClient)
- Supabase client mutations
- AddressAutocomplete (BAN + Geoapify)
- Tailwind CSS animations
- Next.js 15 App Router

**Tests** :
- ✅ `pnpm type-check` : 0 erreurs
- ⚠️ ESLint : 8 warnings (style preferences, non-bloquant)

---

## 🔄 Tâches Restantes (Par Ordre de Priorité)

### 🔥 HAUTE PRIORITÉ

1. **LM-ORD-006** : Refonte UX Sélection Produits (CreateOrderModal)
   - Statut: 📋 PLAN COMPLET prêt
   - Effort: ~6h
   - Plan: `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`

2. **LM-ORD-005** : Workflow Création Commande (Contact & Facturation)
   - Statut: 📋 PLAN DÉTAILLÉ (8 phases)
   - Effort: ~50 min (phases critiques) à 2h30 (complet)
   - Audit: `.claude/work/AUDIT-LM-ORD-005.md`

### MOYENNE PRIORITÉ

3. **LM-ORD-004** : Pré-remplissage Contacts (Phase 3-5)
   - Contexte: Phases 1-2 terminées
   - Reste: OrderFormUnified + Tests
   - Effort: ~30-45 min

4. **LM-ORG-003** : Améliorer Popup Carte Organisations
   - Effort: ~45 min (8 tâches)
   - Route: `/organisations?tab=map`

5. **WEB-DEV-001** : Symlink cassé node_modules/next
   - Impact: Empêche démarrage site-internet
   - Effort: ~10 min (pnpm install --force)

---

## 📋 PLAN GLOBAL DES TÂCHES RESTANTES

### Vue d'ensemble

**Total tâches**: 5
**Effort total estimé**: ~9h30 à 12h
**Prochaine action recommandée**: LM-ORD-005 (phases critiques, 50 min)

---

### TASK 1: LM-ORD-006 — Refonte UX Sélection Produits 🔥

**Contexte**: CreateOrderModal (utilisateurs authentifiés) a une UX insuffisante vs page publique

**Problèmes**:
- ❌ Pas de filtres par catégories
- ❌ Pas de pagination (tous les produits chargés)
- ❌ Liste verticale (pas de grille)
- ❌ Panier en dessous (scroll nécessaire)
- ⚠️ Recherche basique

**Solution**: Refonte complète Step 4 avec:
- Réutilisation composants publics (ProductFilters, CategoryTabs, Pagination)
- Layout 2 colonnes: Catalogue 60% + Panier sticky 40%
- Grille responsive (3 cols desktop → 1 mobile)
- Pagination 12 produits/page
- Filtrage multi-critères

**Fichier principal**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx` (lignes 870-1950)

**Plan détaillé**: `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`

**Effort**: ~6h

**Priorité**: 🔥 HAUTE (UX critique pour utilisateurs)

---

### TASK 2: LM-ORD-005 — Workflow Création Commande 🔥

**Contexte**: Correction workflow de création commande dans LinkMe

**Problèmes critiques**:
1. ❌ **CRITIQUE**: Demandeur (p_requester) = Propriétaire au lieu de l'utilisateur authentifié
2. ❌ **MAJEUR**: useAuth() non utilisé - pas de récupération données utilisateur
3. ❌ **MAJEUR**: Section "Demandeur" absente du récapitulatif étape 5
4. ⚠️ **MOYEN**: Labels étape 2 non conditionnels (Propriétaire/Responsable)

**Audit complet**: `.claude/work/AUDIT-LM-ORD-005.md` (860 lignes analysées)

**Plan d'implémentation** (8 phases):

**Phase 1: Récupération utilisateur authentifié** (CRITIQUE - 15 min)

**Phase 2: Corriger handleSubmitNew** (CRITIQUE - 5 min)

**Phase 3: Section Demandeur dans récapitulatif** (MAJEUR - 30 min)

**Phase 4: Labels conditionnels étape 2** (MOYEN - 15 min)

**Phase 5: Section Notes dans récapitulatif** (MAJEUR - 10 min)

**Phase 6-8: Vérification & Tests** (20 min)

**Fichier principal**: `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Effort**: ~50 min (phases critiques 1-3) à 2h30 (complet)

**Priorité**: 🔥 HAUTE (bug critique - mauvais demandeur enregistré)

**Recommendation**: Commencer par phases 1-3 (50 min) pour corriger le bug critique

---

### TASK 3: LM-ORD-004 — Pré-remplissage Contacts (Phase 3-5)

**Contexte**: Feature pré-remplissage automatique des contacts depuis DB

**Statut**: Phases 1-2 terminées (CreateOrderModal)

**Reste à faire**:

**Phase 3: Modifier OrderFormUnified** (sélection publique)
- [ ] LM-ORD-004-5: Importer et utiliser hook `useOrganisationContacts`
- [ ] LM-ORD-004-6: Pré-remplir quand organisation existante sélectionnée

**Phase 4: LocalStorage cache** (optionnel)
- [ ] LM-ORD-004-7: Ajouter cache localStorage dans OrderFormUnified

**Phase 5: Tests**
- [ ] LM-ORD-004-8: Tester CreateOrderModal (utilisateur authentifié)
- [ ] LM-ORD-004-9: Tester OrderFormUnified (sélection publique)
- [ ] LM-ORD-004-10: Tester cache localStorage

**Fichier principal**: `apps/linkme/src/components/OrderFormUnified.tsx`

**Effort**: ~30-45 min

**Priorité**: MOYENNE (amélioration UX)

---

### TASK 4: LM-ORG-003 — Améliorer Popup Carte Organisations

**Contexte**: Le popup de la carte `/organisations?tab=map` est trop basique

**Plan d'implémentation** (8 tâches):
- [ ] LM-ORG-003-1: Étendre interface Organisation
- [ ] LM-ORG-003-2: Créer composant MapPopupCard
- [ ] LM-ORG-003-3: Design détaillé du popup
- [ ] LM-ORG-003-4: Intégrer MapPopupCard dans MapLibreMapView
- [ ] LM-ORG-003-5: Fallback logo intelligent
- [ ] LM-ORG-003-6: Fonction utilitaire formatAddress
- [ ] LM-ORG-003-7: Tester le popup
- [ ] LM-ORG-003-8: Tester responsive

**Route**: `http://localhost:3002/organisations?tab=map`

**Effort**: ~45 min

**Priorité**: MOYENNE (amélioration visuelle)

---

### TASK 5: WEB-DEV-001 — Symlink cassé node_modules/next

**Contexte**: Symlink cassé empêche démarrage site-internet

**Plan**:
- [ ] WEB-DEV-001-1: Réinstaller les dépendances (`pnpm install --force`)
- [ ] WEB-DEV-001-2: Vérifier symlink
- [ ] WEB-DEV-001-3: Tester démarrage des 3 apps

**Commandes**:
```bash
cd /Users/romeodossantos/verone-back-office-V1
pnpm install --force
pnpm dev
```

**Effort**: ~10 min

**Priorité**: MOYENNE (bloque site-internet uniquement)

---

## Ordre Recommandé d'Exécution

### Option A: Fixes Critiques en Premier (Recommandé)
1. ✅ **LM-ORD-005** (50 min) - Phases 1-3 critiques → Bug demandeur corrigé
2. ✅ **LM-ORD-004** (30-45 min) - Pré-remplissage contacts
3. ✅ **WEB-DEV-001** (10 min) - Fix symlink
4. ⏸️ **LM-ORG-003** (45 min) - Popup carte
5. ⏸️ **LM-ORD-006** (6h) - Refonte UX produits (grande feature)

**Temps total**: ~2h30 pour corriger tous les bugs critiques

### Option B: Feature Prioritaire en Premier
1. ✅ **LM-ORD-006** (6h) - Refonte UX produits
2. ✅ **LM-ORD-005** (50 min) - Fix demandeur
3. ✅ **LM-ORD-004** (30-45 min) - Pré-remplissage
4. ✅ **LM-ORG-003** (45 min) - Popup carte
5. ✅ **WEB-DEV-001** (10 min) - Fix symlink

**Temps total**: ~8h30 pour tout terminer

---

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]` (ex: BO-DASH-001, LM-ORD-002, WEB-CMS-001)
- Bypass: `[NO-TASK]` dans le message de commit (rare)
- Apres commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

## Taches Actives

---

## TASK: LM-ORD-006 — Refonte UX Sélection Produits (CreateOrderModal)

**Statut**: 📋 PLAN COMPLET (READ1)
**Plan détaillé**: `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`
**Priorité**: 🔥 HAUTE
**Effort estimé**: ~6h

### Résumé Problème

CreateOrderModal (utilisateurs authentifiés LinkMe) a une UX de sélection de produits **insuffisante** comparée à la page publique :
- ❌ **Pas de filtres par catégories** → difficile de naviguer dans un large catalogue
- ❌ **Pas de pagination** → tous les produits chargés (performance)
- ❌ **Liste verticale** → pas de vue d'ensemble (grille manquante)
- ❌ **Panier en dessous** → l'utilisateur doit scroller pour voir le total
- ⚠️ **Recherche basique** → pas de feedback visuel

### Solution Proposée

**Refonte complète** de la section "Produits" (Step 4) avec :
1. ✅ Réutilisation composants publics (`ProductFilters`, `CategoryTabs`, `Pagination`)
2. ✅ Layout 2 colonnes : **Catalogue 60%** + **Panier sticky 40%**
3. ✅ Grille responsive (3 colonnes desktop → 1 mobile)
4. ✅ Pagination 12 produits/page
5. ✅ Filtrage multi-critères (recherche + catégories)

### Fichiers Concernés

- `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx` (lignes 870-1950)
- Composants à importer : `apps/linkme/src/components/public-selection/*.tsx`

### Voir aussi

- Analyse comparative page publique vs CreateOrderModal (dans le plan détaillé)
- Best practices Baymard Institute 2025 (sources dans le plan)
- `.claude/work/AUDIT-LM-ORD-005.md` (audit workflow commande)

---

## TASK: LM-ORD-005 — Workflow création commande - Contact & Facturation

### Contexte
Investigation et correction du workflow de création de commande dans LinkMe.

**Audit complet** : `.claude/work/AUDIT-LM-ORD-005.md` (860 lignes de code analysées)

**Problèmes critiques identifiés** :
1. ❌ **CRITIQUE** : Demandeur (p_requester) = Propriétaire au lieu de l'utilisateur authentifié
2. ❌ **MAJEUR** : useAuth() non utilisé - pas de récupération des données utilisateur
3. ❌ **MAJEUR** : Section "Demandeur" absente du récapitulatif étape 5
4. ⚠️ **MOYEN** : Labels étape 2 non conditionnels (Propriétaire/Responsable)
5. ⚠️ **MOYEN** : Pas de récapitulatif dans flow "Restaurant existant"

### Steps to Reproduce
1. Aller sur http://localhost:3002
2. S'authentifier avec Pokawa (`pokawa-test@verone.io`)
3. Aller sur `/commandes` (nécessite un rafraîchissement F5 - BUG)
4. Cliquer sur "Nouvelle vente"
5. **Flow "Restaurant existant"** :
   - Sélectionner "Restaurant existant"
   - Sélectionner un restaurant (ex: Pokawa Bourgoin Jallieu)
   - Observer la section "Contacts du restaurant"
6. **Flow "Nouveau restaurant"** :
   - Sélectionner "Nouveau restaurant"
   - Naviguer à travers les 5 étapes

### Expected vs Actual

**Expected** (selon demande utilisateur) :
- ✅ Les champs de contact doivent être pré-remplis depuis le profil de l'utilisateur authentifié
- ✅ Label doit indiquer "Propriétaire" pour franchisé, "Responsable" pour restaurant propre
- ✅ Étape 2 : contact du responsable
- ✅ Étape 3 : facturation avec nom légal (obligatoire) et nom commercial (facultatif si différent)
- ✅ Pas de doublon entre nom légal étape 2 et étape 3

**Actual** (observé) :
- ❌ **Flow "Restaurant existant"** :
  - Champs de contact complètement vides (pas de pré-remplissage)
  - Label générique "Propriétaire / Responsable" (pas de distinction)
  - Section "Responsable Facturation" avec checkbox "Même contact que le propriétaire" (cochée)
  - Aucun champ visible pour nom légal vs nom commercial
  - Alerte : "Contacts incomplets - veuillez compléter les informations"

- ❌ **Flow "Nouveau restaurant"** (5 étapes) :
  - Étape 1 : Nom commercial + Adresse + Type (Propre/Franchisé) ✅
  - Étape 2 : Propriétaire (non testé - autocomplete adresse cassé)
  - Étape 3 : Facturation (non testé)
  - Étape 4 : Produits
  - Étape 5 : Validation

### Evidence

**Screenshots** :
- `.claude/reports/linkme-create-order-modal-20260114.png` : Modal initial
- `.claude/reports/linkme-create-order-step1-20260114.png` : Étape 1 - Sélection restaurant existant
- `.claude/reports/linkme-contacts-section-20260114.png` : Section contacts (champs vides)
- `.claude/reports/linkme-contacts-billing-20260114.png` : Section contacts + facturation
- `.claude/reports/linkme-new-restaurant-step1-20260114.png` : Nouveau restaurant - Étape 1/5

**Console errors** : Aucune

**Network errors** : Aucune

**Fichiers analysés** :
- `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx` : Modal principal (>800 lignes)
- `apps/linkme/src/components/ContactsSection.tsx` : Composant de gestion des contacts

### Hypothèses (fichiers/causes probables)

**1. Pré-remplissage des contacts manquant**
- **Fichier** : `apps/linkme/src/components/ContactsSection.tsx`
- **Cause** : Le composant charge les contacts depuis `useOrganisationContacts(organisationId)` (ligne 70)
- **Problème** : Il charge les contacts de l'**organisation** (restaurant), pas du **profil utilisateur authentifié**
- **Solution probable** : Ajouter logique pour pré-remplir depuis le profil utilisateur si contacts organisation vides

**2. Distinction franchisé/restaurant propre absente**
- **Fichier** : `apps/linkme/src/components/ContactsSection.tsx` ligne 266
- **Code actuel** : `<span className="font-medium">Propriétaire / Responsable</span>`
- **Problème** : Label statique, pas de logique conditionnelle
- **Solution probable** :
  - Passer `ownerType` depuis CreateOrderModal
  - Afficher "Propriétaire" si `ownerType === 'franchise'`
  - Afficher "Responsable" si `ownerType === 'succursale'`

**3. Nom légal vs nom commercial (confusion/doublons)**
- **Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
- **Problème constaté** :
  - Étape 1 (Restaurant) : champ "Nom commercial" (tradeName)
  - Étape 2 (Propriétaire) : champs contact (firstName, lastName, email, phone) + ownerCompanyName (raison sociale si franchise)
  - Étape 3 (Facturation) : billingCompanyName (dénomination sociale)
- **Risque de doublon** :
  - `ownerCompanyName` (étape 2) vs `billingCompanyName` (étape 3)
  - Si franchisé : raison sociale peut être la même
  - Si restaurant propre : pas de raison sociale à l'étape 2
- **Solution probable** :
  - Clarifier la distinction :
    - Nom légal = raison sociale officielle (KBIS)
    - Nom commercial = enseigne/marque (peut être différent ou identique)
  - Ajouter logique pour éviter la saisie en double
  - Si `billingSameAsOwner` ET franchisé : reprendre `ownerCompanyName`

**4. Bug page /commandes nécessite rafraîchissement**
- **Fichier** : Probablement lié au routage ou au state management
- **Symptôme** : En arrivant sur `/commandes` pour la première fois, la page semble bloquée, nécessite F5
- **Solution probable** : Investiguer le chargement des hooks (useUserAffiliate, useAffiliateCustomers)

### Findings Audit (résumé)

**✅ Ce qui fonctionne correctement** :
- Modal produits en deux parties (sélection + panier) ✅
- Récapitulatif étape 5 avec toutes les sections sauf Demandeur ✅
- Gestion du panier (ajout/suppression/quantités) ✅
- Calculs des totaux et marges ✅
- Structure 5 étapes pour nouveau restaurant ✅

**❌ Ce qui doit être corrigé** :
1. **p_requester** est rempli avec les données du **propriétaire du restaurant** (étape 2) au lieu de l'**utilisateur authentifié**
2. **useAuth()** n'est pas utilisé → pas de récupération des données utilisateur connecté
3. Section **"Demandeur"** absente du récapitulatif étape 5
4. Flow "Restaurant existant" n'a pas de récapitulatif avant soumission

### Fix Proposé (détaillé dans AUDIT-LM-ORD-005.md)

**Phase 1 : Récupération utilisateur authentifié (CRITIQUE)**
- Importer `useAuth` depuis `@/contexts/AuthContext`
- Créer state `requester` depuis `user.user_metadata` et `user.email`
- **Fichier** : `CreateOrderModal.tsx` lignes 17, 178
- **Temps** : 15 min

**Phase 2 : Corriger handleSubmitNew (CRITIQUE)**
- Remplacer `p_requester` (actuellement = propriétaire) par `requester` (utilisateur authentifié)
- **Fichier** : `CreateOrderModal.tsx` ligne 460-467
- **Temps** : 5 min

**Phase 3 : Section Demandeur dans récapitulatif (MAJEUR)**
- Ajouter section "Demandeur de la commande" dans l'étape 5
- Afficher nom, email, téléphone de l'utilisateur authentifié
- Insérer après ligne 1988 (après récap Restaurant)
- **Fichier** : `CreateOrderModal.tsx`
- **Temps** : 30 min

**Phase 4 : Labels conditionnels étape 2 (MOYEN)**
- Afficher "Propriétaire" si franchise, "Responsable" si propre
- **Fichier** : `CreateOrderModal.tsx` ligne ~1412
- **Temps** : 15 min

**Phase 5 : Modal confirmation restaurant existant (OPTIONNEL)**
- Ajouter récapitulatif avant soumission dans flow "Restaurant existant"
- **Temps** : 60 min

**Phase 6 : Section Notes (OPTIONNEL)**
- Afficher les notes dans le récapitulatif si renseignées
- **Temps** : 10 min

**TOTAL CRITIQUE + MAJEUR** : ~50 min
**TOTAL COMPLET** : ~2h30

---

### Plan d'Implémentation (checklist pour agent WRITE)

**Fichier principal** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

#### Phase 1 : Récupération utilisateur authentifié (CRITIQUE - 15 min)

- [ ] **LM-ORD-005-1** : Importer `useAuth` depuis `@/contexts/AuthContext`
  - Ligne 17 : Ajouter `import { useAuth } from '@/contexts/AuthContext';`

- [ ] **LM-ORD-005-2** : Appeler `useAuth()` dans CreateOrderModal
  - Ligne 178 : Après `const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();`
  - Ajouter `const { user } = useAuth();`

- [ ] **LM-ORD-005-3** : Créer state `requester` depuis données utilisateur
  - Après ligne 172 (après `const [searchQuery, setSearchQuery] = useState('');`)
  - Ajouter :
  ```typescript
  // Demandeur = utilisateur authentifié qui passe la commande
  const [requester, setRequester] = useState({
    type: 'responsable_enseigne',
    name: '',
    email: '',
    phone: '',
    position: null,
  });
  ```

- [ ] **LM-ORD-005-4** : Ajouter useEffect pour initialiser `requester` depuis `user`
  - Après le state `requester`
  - Ajouter :
  ```typescript
  // Initialiser le demandeur depuis l'utilisateur authentifié
  useEffect(() => {
    if (user) {
      setRequester({
        type: 'responsable_enseigne',
        name: user.user_metadata?.full_name || user.email || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        position: user.user_metadata?.position || null,
      });
    }
  }, [user]);
  ```

#### Phase 2 : Corriger handleSubmitNew (CRITIQUE - 5 min)

- [ ] **LM-ORD-005-5** : Remplacer `p_requester` par `requester`
  - Lignes 460-467
  - **Avant** :
  ```typescript
  // Demandeur = Propriétaire
  const p_requester = {
    type: 'responsable_enseigne',
    name: `${newRestaurantForm.ownerFirstName} ${newRestaurantForm.ownerLastName}`,
    email: newRestaurantForm.ownerEmail,
    phone: newRestaurantForm.ownerPhone || null,
    position: null,
  };
  ```
  - **Après** :
  ```typescript
  // Demandeur = Utilisateur authentifié qui passe la commande
  const p_requester = requester;
  ```

#### Phase 3 : Ajouter section Demandeur dans récapitulatif étape 5 (MAJEUR - 30 min)

- [ ] **LM-ORD-005-6** : Insérer section "Demandeur" dans récapitulatif
  - **Position** : Après ligne 1988 (après `{/* Récap Restaurant */}`)
  - **Avant** : Section Propriétaire
  - **Code à insérer** :
  ```typescript
  {/* Récap Demandeur */}
  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
    <h4 className="font-medium text-gray-900 flex items-center gap-2">
      <User className="h-4 w-4 text-blue-600" />
      Demandeur de la commande
    </h4>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-gray-500">Nom complet</p>
        <p className="font-medium">{requester.name}</p>
      </div>
      <div>
        <p className="text-gray-500">Email</p>
        <p className="font-medium">{requester.email}</p>
      </div>
      {requester.phone && (
        <div>
          <p className="text-gray-500">Téléphone</p>
          <p className="font-medium">{requester.phone}</p>
        </div>
      )}
    </div>
    <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
      ℹ️ Cette personne sera enregistrée comme le demandeur de la commande
    </div>
  </div>
  ```

#### Phase 4 : Labels conditionnels étape 2 (MOYEN - 15 min)

- [ ] **LM-ORD-005-7** : Modifier titre étape 2 selon type restaurant
  - **Position** : Ligne ~1420 (dans `{newRestaurantStep === 2 && (`)
  - **Trouver** : `<h3 className="text-lg font-semibold text-gray-900 mb-4">`
  - **Remplacer par** :
  ```typescript
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    {newRestaurantForm.ownerType === 'franchise'
      ? 'Propriétaire du restaurant (Franchisé)'
      : 'Responsable du restaurant'}
  </h3>
  <p className="text-sm text-gray-500 mb-4">
    {newRestaurantForm.ownerType === 'franchise'
      ? 'Informations du propriétaire franchisé'
      : 'Informations du responsable de ce restaurant'}
  </p>
  ```

#### Phase 5 : Section Notes dans récapitulatif (MAJEUR - 10 min)

**Contexte UX** : Le champ Notes existe DÉJÀ à l'étape 5 (ligne 2163-2175), juste avant le bouton de validation ✅
- ✅ Placement optimal selon best practices (Amazon, Uber Eats, Shopify)
- ✅ Optionnel, pas intrusif
- ✅ Pas de modal de confirmation supplémentaire nécessaire

**Ce qui manque** : Section de RELECTURE des notes dans le récapitulatif visuel
- L'utilisateur saisit ses notes mais ne les REVOIT PAS avant validation
- Solution : Ajouter une card grise qui affiche les notes (si renseignées)

**Voir** : `.claude/work/UX-NOTES-ANALYSIS.md` (analyse complète)

- [ ] **LM-ORD-005-8** : Ajouter section Notes de relecture (preview temps réel)
  - **Position** : Après ligne 2175 (après champ textarea Notes, avant message validation)
  - **Effet** : L'utilisateur tape ses notes → voit immédiatement un aperçu formaté en-dessous
  - **Code à insérer** :
  ```typescript
  {/* Preview Notes en temps réel */}
  {notes && notes.trim() !== '' && (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
      <h4 className="text-xs font-medium text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        Aperçu de vos notes
      </h4>
      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{notes}</p>
    </div>
  )}
  ```

#### Vérification finale

- [ ] **LM-ORD-005-9** : `pnpm type-check` → 0 erreurs
- [ ] **LM-ORD-005-10** : `pnpm build` → Build réussi
- [ ] **LM-ORD-005-11** : Tester manuellement :
  - Se connecter avec Pokawa
  - Créer commande → Nouveau restaurant → Type Franchisé
  - Vérifier étape 5 : Section Demandeur visible avec infos utilisateur
  - Valider commande
  - Vérifier en DB que `p_requester.email` = email utilisateur connecté

---

### Acceptance Criteria

**Phase 1-2 (CRITIQUE)** :
- [ ] useAuth() importé et utilisé dans CreateOrderModal
- [ ] State `requester` créé depuis `user.user_metadata`
- [ ] `p_requester` dans handleSubmitNew utilise `requester` (pas propriétaire)
- [ ] Test : Créer commande → vérifier en DB que `p_requester.email` = email utilisateur connecté

**Phase 3 (MAJEUR)** :
- [ ] Section "Demandeur de la commande" visible dans récapitulatif étape 5
- [ ] Affiche nom, email, téléphone de l'utilisateur authentifié
- [ ] Message info : "Cette personne sera enregistrée comme le demandeur"

**Phase 4 (MOYEN)** :
- [ ] Étape 2 : Label "Propriétaire du restaurant (Franchisé)" si type=franchise
- [ ] Étape 2 : Label "Responsable du restaurant" si type=propre

**Tests complets** :
- [ ] Nouveau restaurant franchisé :
  - Se connecter avec Pokawa
  - Créer commande → Nouveau restaurant → Type Franchisé
  - Vérifier étape 5 : Section Demandeur = utilisateur Pokawa
  - Vérifier étape 5 : Section Propriétaire = franchisé
  - Valider → vérifier en DB `p_requester`
- [ ] Restaurant existant :
  - Sélectionner restaurant
  - Ajouter produits
  - Valider → vérifier en DB `p_requester`
- [ ] Console Zero (0 erreurs)
- [ ] Type-check OK
- [ ] Build OK

---

## TASK: LM-ORD-004 — Pré-remplissage contacts clients (Phase 3-5)

**Contexte** : Feature pré-remplissage automatique des données contacts depuis la DB quand un client existant est sélectionné.

**Phase 1-2** : ✅ Terminées (CreateOrderModal)
**Phase 3-5** : En cours (OrderFormUnified + Tests)

### Phase 3 : Modifier OrderFormUnified (sélection publique)

- [ ] **LM-ORD-004-5** : Importer et utiliser le hook useOrganisationContacts
- [ ] **LM-ORD-004-6** : Pré-remplir quand organisation existante sélectionnée

### Phase 4 : LocalStorage pour utilisateurs publics (optionnel)

- [ ] **LM-ORD-004-7** : Ajouter cache localStorage dans OrderFormUnified

### Phase 5 : Tests

- [ ] **LM-ORD-004-8** : Tester CreateOrderModal (utilisateur authentifié)
- [ ] **LM-ORD-004-9** : Tester OrderFormUnified (sélection publique)
- [ ] **LM-ORD-004-10** : Tester cache localStorage

---

## TASK: LM-ORG-003 — Améliorer popup carte organisations (8 tâches, ~45 min)

**Contexte** : Le popup de la carte `/organisations?tab=map` est trop basique.

- [ ] **LM-ORG-003-1** : Étendre interface Organisation
- [ ] **LM-ORG-003-2** : Créer composant MapPopupCard
- [ ] **LM-ORG-003-3** : Design détaillé du popup
- [ ] **LM-ORG-003-4** : Intégrer MapPopupCard dans MapLibreMapView
- [ ] **LM-ORG-003-5** : Fallback logo intelligent
- [ ] **LM-ORG-003-6** : Fonction utilitaire formatAddress
- [ ] **LM-ORG-003-7** : Tester le popup
- [ ] **LM-ORG-003-8** : Tester responsive

---

## TASK: LM-SEL-003 — Optimiser UX sélections publiques (17 tâches, ~1h30)

**Contexte** : Améliorer pagination + barre de catégorisation.

### Phase 1 : Corrections rapides

- [ ] **LM-SEL-003-1** : Réduire pagination à 12 produits/page
- [ ] **LM-SEL-003-2** : Réduire taille bouton "Ajouter"

### Phase 2 : Enrichir les données

- [ ] **LM-SEL-003-3** : Modifier RPC `get_public_selection`
- [ ] **LM-SEL-003-4** : Mettre à jour interface ISelectionItem

### Phase 3 : Créer composants

- [ ] **LM-SEL-003-5** : Créer SelectionCategoryBar.tsx
- [ ] **LM-SEL-003-6** : Créer SelectionCategoryDropdown.tsx
- [ ] **LM-SEL-003-7** : Exporter les composants

### Phase 4 : Intégrer dans la page

- [ ] **LM-SEL-003-8** : Ajouter states et imports
- [ ] **LM-SEL-003-9** : Remplacer CategoryTabs par SelectionCategoryBar
- [ ] **LM-SEL-003-10** : Ajouter SelectionCategoryDropdown dans section filtres
- [ ] **LM-SEL-003-11** : Mettre à jour logique de filtrage
- [ ] **LM-SEL-003-12** : Supprimer ancien code CategoryTabs

### Phase 5 : Tests

- [ ] **LM-SEL-003-13** : Tester pagination
- [ ] **LM-SEL-003-14** : Tester bouton "Ajouter"
- [ ] **LM-SEL-003-15** : Tester barre de catégorisation
- [ ] **LM-SEL-003-16** : Tester dropdown sous-catégories
- [ ] **LM-SEL-003-17** : Vérifier responsive

---

## TASK: WEB-DEV-001 — Symlink cassé node_modules/next

**Contexte** : Symlink cassé empêche démarrage site-internet.

- [ ] **WEB-DEV-001-1** : Réinstaller les dépendances (`pnpm install --force`)
- [ ] **WEB-DEV-001-2** : Vérifier symlink
- [ ] **WEB-DEV-001-3** : Tester démarrage des 3 apps

---

## TASK: [NO-TASK] — site-internet/.env.local OBSOLÈTE + Processus READ1 illégitimes (CRITIQUE)

### Contexte
L'utilisateur essaie de lancer `pnpm dev` et obtient des erreurs `EADDRINUSE` sur les ports 3001, 3002, et back-office démarre sur port 3003 au lieu de 3000.

### Steps to Reproduce
1. Utilisateur lance `pnpm dev` dans son terminal
2. Observe les erreurs :
   ```
   ⨯ Failed to start server
   Error: listen EADDRINUSE: address already in use :::3002
   ⨯ Failed to start server
   Error: listen EADDRINUSE: address already in use :::3001
   ⚠ Port 3000 is in use by process 69603, using available port 3003 instead.
   ```

### Expected vs Actual
- **Expected**: 3 apps démarrent sur ports 3000, 3001, 3002
- **Actual**: Erreurs EADDRINUSE, back-office démarre sur 3003

### Evidence
```bash
$ ls -lah apps/*/\.env.local
-rw-r--r--@ 1 romeodossantos staff 8.5K Jan 14 10:36 apps/back-office/.env.local
-rw-r--r--@ 1 romeodossantos staff 8.0K Jan 14 10:36 apps/linkme/.env.local
-rw-r--r--@ 1 romeodossantos staff 7.1K Nov  9 07:14 apps/site-internet/.env.local
```

### Causes Root (CONFIRMÉES)

**1. Session READ1 a lancé pnpm dev en arrière-plan (VIOLATION RÈGLES)**
- ❌ Mode READ1 ne doit **JAMAIS** lancer de serveurs
- ❌ Mode READ1 ne doit écrire QUE dans ACTIVE.md
- ✅ Processus tués maintenant

**2. site-internet/.env.local OBSOLÈTE depuis 2 MOIS**
- ⚠️ Dernière modif : **9 novembre 2024** (2 mois)
- ✅ back-office/.env.local : Modifié aujourd'hui 10h36
- ✅ linkme/.env.local : Modifié aujourd'hui 10h36
- ❌ site-internet manque : variables récentes (Geoapify, Sentry DSN, Resend)

### Impact

🟢 **RÉSOLU** : Processus READ1 illégitimes arrêtés
- ✅ Ports 3000, 3001, 3002 maintenant libres
- ✅ L'utilisateur peut lancer `pnpm dev` normalement

⚠️ **MEDIUM** : site-internet/.env.local obsolète
- Manque variables ajoutées depuis novembre : Geoapify, Sentry DSN, Resend
- Fonctionnalités potentiellement cassées (géolocalisation, monitoring, emails)

### Fix Proposé (haut niveau)

**Pour site-internet/.env.local** :
- Copier depuis back-office/.env.local (modifié aujourd'hui)
- Adapter les variables spécifiques au site-internet si besoin
- Ou copier depuis linkme/.env.local (aussi modifié aujourd'hui)

**Commande** :
```bash
# Backup de l'ancien
cp apps/site-internet/.env.local apps/site-internet/.env.local.backup-obsolete

# Copier depuis back-office (base commune)
cp apps/back-office/.env.local apps/site-internet/.env.local

# Vérifier/adapter les variables spécifiques
# nano apps/site-internet/.env.local
```

### Acceptance Criteria
- [ ] ✅ Processus READ1 arrêtés (FAIT)
- [ ] L'utilisateur peut lancer `pnpm dev` sans EADDRINUSE
- [ ] site-internet/.env.local synchronisé avec variables récentes
- [ ] site-internet fonctionne avec géolocalisation + Sentry

_[Sections LM-AUTH-001 et Configuration Sentry archivées - voir fin du document]_

---

## TASK: [NO-TASK] — Correction serveurs dev multiples (RÉSOLU)

### Contexte
Les serveurs ne recompilaient pas. Plusieurs instances de `next dev` tournaient simultanément, causant des conflits.

### Steps to Reproduce
1. Lancer `pnpm dev`
2. Modifier du code dans n'importe quelle app
3. Observer que les changements ne se recompilent pas
4. Vérifier avec `ps aux | grep "next dev"` → plusieurs processus identiques

### Expected vs Actual
- **Expected**: 1 processus par app (3 total : back-office, linkme, site-internet)
- **Actual**: 4-5 processus dont 2 pour back-office → conflits de recompilation

### Evidence
- Processus multiples détectés : `43815`, `56758` (back-office), `43849` (linkme), `43850` (site-internet)
- Ports utilisés correctement mais processus en double

### Fix Appliqué
1. ✅ Tué tous les processus `next dev` avec `pkill -9 -f "next dev"`
2. ✅ Libéré les ports 3000, 3001, 3002
3. ✅ Nettoyé les builds `.next` de chaque app
4. ✅ Relancé `pnpm dev` proprement

### Résultat (2026-01-14 20:31)
✅ **RÉSOLU** - Serveurs lancés correctement :
- **back-office** : http://localhost:3000 (PID 59500)
- **site-internet** : http://localhost:3001 (PID 59503)
- **linkme** : http://localhost:3002 (PID 59504)

### Commandes Utiles (pour l'avenir)
```bash
# Arrêter proprement
pnpm dev:stop

# Nettoyer et redémarrer
pnpm dev:clean && pnpm dev

# Vérifier les ports
lsof -i :3000 -i :3001 -i :3002 | grep LISTEN
```

---

## ✅ Tâches Complétées (Archivées - Session 2026-01-14)

### LM-AUTH-001 : Fix spinner infini LinkMe (20658534) ✅
- Problème : Dashboard LinkMe bloqué sur spinner infini (React StrictMode)
- Solution : Suppression pattern `initializedRef`, ajout pattern `cancelled`
- Fichier : `apps/linkme/src/contexts/AuthContext.tsx`
- Statut : ✅ CODE IMPLÉMENTÉ

### Configuration Sentry : Migration Next.js 15 (8184e314 + 125f3ee8) ✅
- Problème : Warnings Sentry au démarrage (onRequestError, deprecated config)
- Solution :
  - Ajout hook `onRequestError` dans `instrumentation.ts`
  - Création `instrumentation-client.ts` (Turbopack compatible)
  - Ajout hook `onRouterTransitionStart` pour navigation tracking
  - Suppression `sentry.client.config.ts` (obsolète)
- Fichiers : `apps/back-office/*`, `apps/linkme/*`
- Statut : ✅ VALIDÉ PAR UTILISATEUR (0 warnings)

### Commits de Session 2026-01-14

```
5f117ef4 chore(plan): mark Sentry config as fully validated
125f3ee8 [NO-TASK] fix(sentry): add onRouterTransitionStart hook
c26f6798 chore(plan): mark Sentry config migration as completed
8184e314 [NO-TASK] fix(sentry): migrate to Next.js 15 instrumentation
3864e3d1 chore(plan): sync
20658534 [LM-AUTH-001] fix: resolve infinite loading in dashboard
```

---

## Notes

**Fichiers archivés** : `.claude/archive/plans-2026-01/ACTIVE-backup-*.md`

**Priorités actuelles** :
1. 🔥 **LM-ORD-006** : Refonte UX Sélection Produits (PLAN COMPLET prêt)
2. 🔥 **LM-ORD-005** : Workflow création commande (8 phases détaillées)
3. **LM-ORD-004** : Pré-remplissage contacts (Phase 3-5)

**Sentry DSN** : ✅ Configuré manuellement dans `.env.local`
