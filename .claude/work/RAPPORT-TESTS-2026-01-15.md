# Rapport Tests LinkMe - Session 2026-01-15

**Agent** : READ1 (Playwright lane-1)
**Contexte** : Tests manuels demandés par utilisateur
**Durée** : ~45 min
**Status** : ⚠️ INTERROMPU (bugs critiques détectés)

---

## 🎯 Tests Demandés

1. ✅ Connexion LinkMe (utilisateur Pokawa) - **OK**
2. ⚠️ Créer commande "Pokawa test 1" (nouveau restaurant) - **BLOQUÉ**
3. ⚠️ Créer commande "Pokawa test 2" (restaurant existant) - **BLOQUÉ**
4. ⏸️ Créer commande depuis sélection publique - **PAS FAIT**
5. ⏸️ Vérifier commandes dans back-office - **PAS FAIT**

---

## 🔴 BUGS CRITIQUES DÉTECTÉS

### BUG #1 : Rafraîchissement Pages (Récurrent)

**Symptôme** :
- Page `/commandes` charge avec 0 données
- Nécessite **rafraîchissement F5** pour voir les données
- **Récurrent sur plusieurs pages** LinkMe et Back-Office

**Cause identifiée** :

```typescript
// apps/linkme/src/app/(main)/commandes/page.tsx (ligne 91-96)
const { data: affiliate } = useUserAffiliate();
const { data: orders } = useLinkMeOrders(affiliate?.id ?? null, false);
```

**Problème** : Waterfall loading sans protection

```typescript
// apps/linkme/src/hooks/use-linkme-orders.ts (ligne 110-118)
export function useLinkMeOrders(affiliateId: string | null, fetchAll: boolean = false) {
  return useQuery({
    queryKey: ['linkme-orders', fetchAll ? 'all' : affiliateId],
    // ❌ MANQUE : enabled: fetchAll || affiliateId !== null,
    queryFn: async (): Promise<LinkMeOrder[]> => {
      if (!fetchAll && !affiliateId) return [];  // ← Retourne [] si affiliateId null
      // ...
    }
  });
}
```

**Impact** :
- ❌ UX dégradée (utilisateur doit rafraîchir)
- ❌ Problème sur ~20 hooks (grep détecté 20 fichiers avec useQuery)

**Solution** :
```typescript
return useQuery({
  queryKey: ['linkme-orders', fetchAll ? 'all' : affiliateId],
  enabled: fetchAll || affiliateId !== null,  // ✅ AJOUTER
  queryFn: async (): Promise<LinkMeOrder[]> => {
```

**Fichiers à auditer** (20 hooks détectés) :
- `use-linkme-orders.ts`
- `use-organisation-detail.ts`
- `use-organisation-contacts.ts`
- `use-affiliate-commissions.ts`
- `use-enseigne-organisations.ts`
- `use-affiliate-analytics.ts`
- `use-affiliate-products.ts`
- `use-organisation-stats.ts`
- `use-affiliate-branding.ts`
- `use-all-products-stats.ts`
- `use-affiliate-commission-stats.ts`
- `use-linkme-catalog.ts`
- `use-linkme-public.ts`
- `use-user-selection.ts`
- `use-product-images.ts`
- `use-user-profile.ts`
- `use-payment-requests.ts`
- `use-affiliate-storage.ts`
- `use-affiliate-network.ts`
- `use-affiliate-orders.ts`

---

### BUG #2 : LM-ORD-006 Implémentation Incomplète

**Plan initial** : `.claude/work/PLAN-LM-ORD-006-PRODUCT-SELECTION-UX.md`
**Commit** : `59b9d2c9, df39f4a8` (~700 lignes)

**Ce qui devait être implémenté** :
- ✅ Layout 2 colonnes (Catalogue + Panier) - **PARTIEL**
- ✅ Grille responsive - **OK**
- ✅ Pagination - **OK**
- ❌ **Barre de recherche produits** - **ABSENT**
- ❌ **Filtres catégories/sous-catégories** - **ABSENT**

**Evidence** :
- Screenshot : `.claude/reports/test-LM-ORD-006-top-of-modal.png`
- Flow testé : "Restaurant existant" → "Collection Mobilier Pokawa" (31 produits)

**Ce qui apparaît** :
```
┌─────────────────────────────────────────────────────┐
│ Sélection de produits — Collection Mobilier Pokawa │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Produit 1] [Produit 2] [Produit 3]               │
│ (grille 3 colonnes)                                │
│                                                     │
│ [Pagination : 1 2 3]                               │
└─────────────────────────────────────────────────────┘
```

**Ce qui MANQUE** :
```
[🔍 Recherche produits...]        ← ABSENT
[Tout] [Mobilier] [Déco]          ← ABSENT
```

**Impact utilisateur** :
- ❌ Catalogue 31 produits **difficile à parcourir**
- ❌ Pas de filtre → utilisateur doit **scroller tous les produits**
- ❌ Pas de recherche rapide par nom/SKU

---

## 💡 Solution Architecture (Directives Utilisateur)

### ⚠️ Clarification Importante : Modal vs Page Publique

**DIFFÉRENCE FONDAMENTALE** :

**Page Publique** (`/s/[id]`) :
- 🛒 **Catalogue e-commerce libre** (exploration → panier → checkout)
- ✅ L'utilisateur browse librement, sans contraintes
- ✅ Pas d'étapes structurées
- ✅ UX : Découverte de produits

**Modal CreateOrderModal** (professionnel) :
- 📋 **Workflow structuré avec ÉTAPES**
- ✅ Processus guidé, plus direct
- ✅ UX : Efficacité professionnelle
- ✅ Pas de navigation libre → parcours optimisé

**➡️ Solution** : Modal de qualité avec étapes intermédiaires (pas copie de la page publique)

### Problème Actuel

**Flow "Restaurant existant"** : Tout sur 1 écran compressé
- Sélection produits (gauche)
- Restaurant (droite)
- ❌ **Trop chargé**, pas de place pour barre recherche + filtres

**Flow "Nouveau restaurant"** : 5 étapes
- Étape 4 "Produits" : **Même problème** (pas de search/filtres)

### Architecture Correcte : Modal Multi-Étapes de Qualité

**4 ÉTAPES PROFESSIONNELLES** :

**Étape 1 : Restaurant + Sélection Produits**
```
┌─────────────────────────────────────────────────────┐
│ Pour quel restaurant ?                              │
│ ○ Pokawa Bourgoin Jallieu                          │
│ ○ Pokawa Saint Maximin                             │
│ ○ [Nouveau restaurant]                             │
│                                                     │
│ Quelle sélection de produits ?                     │
│ ○ Collection Mobilier Pokawa (31 produits)         │
│                                                     │
│                    [Suivant →]                      │
└─────────────────────────────────────────────────────┘
```

**Étape 2 : Organisation/Contact/Facturation**
```
┌─────────────────────────────────────────────────────┐
│ Informations contact                                │
│ [Nom] [Email] [Téléphone]                          │
│                                                     │
│ Informations facturation                           │
│ [Raison sociale] [SIRET]                           │
│ [Adresse facturation]                              │
│                                                     │
│ [← Retour]              [Suivant →]                │
└─────────────────────────────────────────────────────┘
```

**Étape 3 : SÉLECTION PRODUITS (PLEIN ÉCRAN - Cœur du Modal)**

```
┌──────────────────────────────────────────────────────────────┐
│ Étape 3/4 : Sélection Produits                              │
│ Restaurant: Pokawa Bourgoin │ Collection Mobilier Pokawa     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ [75% CATALOGUE]                    │ [25% PANIER MINI]      │
│ ┌──────────────────────────────────┬─────────────────────┐  │
│ │ [🔍 Recherche produits...]       │ ┌─────────────────┐ │  │
│ │                                  │ │ Panier          │ │  │
│ │ [Tout] [Mobilier] [Déco]        │ │ 5 articles      │ │  │
│ │ [Luminaires] [Textile]           │ │ 245 € TTC       │ │  │
│ │                                  │ │                 │ │  │
│ │ ┌──┐ ┌──┐ ┌──┐ ┌──┐            │ │ [Produit 1]     │ │  │
│ │ │  │ │  │ │  │ │  │            │ │ x2 → 50 €       │ │  │
│ │ └──┘ └──┘ └──┘ └──┘            │ │ [Produit 2]     │ │  │
│ │ ┌──┐ ┌──┐ ┌──┐ ┌──┐            │ │ x1 → 35 €       │ │  │
│ │ │  │ │  │ │  │ │  │            │ │ ...             │ │  │
│ │ └──┘ └──┘ └──┘ └──┘            │ │                 │ │  │
│ │ ┌──┐ ┌──┐ ┌──┐ ┌──┐            │ │ Commission:     │ │  │
│ │ │  │ │  │ │  │ │  │            │ │ +25,00 €        │ │  │
│ │ └──┘ └──┘ └──┘ └──┘            │ └─────────────────┘ │  │
│ │                                  │                     │  │
│ │ [Pagination : 1 2 3 >]          │                     │  │
│ └──────────────────────────────────┴─────────────────────┘  │
│                                                              │
│ [← Retour]                              [Valider panier →]  │
└──────────────────────────────────────────────────────────────┘
```

**Alternative Layout** (suggérée par utilisateur) :
- Catalogue en haut (75% hauteur)
- Panier en bas (25% hauteur)

**Éléments Obligatoires** :
- ✅ Barre de recherche (filtre texte rapide)
- ✅ Menus/rubriques (filtres catégories/sous-catégories)
- ✅ Grille produits spacieuse (3-4 colonnes)
- ✅ Mini-modal panier **toujours visible** (ou panneau dédié)
- ✅ Pagination si > 12 produits

**Étape 4 : Validation Finale**
```
┌─────────────────────────────────────────────────────┐
│ Récapitulatif de la commande                        │
│                                                     │
│ Restaurant: Pokawa Bourgoin Jallieu                │
│ Contact: Sophie Martin (sophie.martin@...)         │
│                                                     │
│ Produits (5 articles):                             │
│ - Plateau bois 20x30 cm × 2                        │
│ - Coussin Bleu × 1                                 │
│ - ...                                              │
│                                                     │
│ Total HT: 200,00 €                                 │
│ TVA (20%): 40,00 €                                 │
│ Total TTC: 245,00 €                                │
│ Votre commission: +25,00 €                         │
│                                                     │
│ [← Retour]              [Créer la commande]        │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Composants à Réutiliser

**Référence** : `apps/linkme/src/components/OrderFormUnified.tsx` + page publique `/s/[id]`

Ces composants **fonctionnent déjà parfaitement** :
- ✅ `ProductFilters` (barre recherche)
- ✅ `CategoryTabs` (onglets catégories)
- ✅ `Pagination`
- ✅ Layout 2 colonnes (Catalogue + Panier sticky)
- ✅ Logique filtrage (search + category + pagination)

**Fichiers** :
- `apps/linkme/src/components/public-selection/ProductFilters.tsx`
- `apps/linkme/src/components/public-selection/CategoryTabs.tsx`
- `apps/linkme/src/components/public-selection/Pagination.tsx`
- `apps/linkme/src/app/(public)/s/[id]/page.tsx` (lignes 212-629)

---

## 📊 Tests Effectués

### ✅ Test 1 : Connexion LinkMe

**URL** : http://localhost:3002
**Login** : Utilisateur Pokawa
**Status** : ✅ OK

### ⚠️ Test 2 : Flow "Nouveau restaurant" (Pokawa test 1)

**Steps** :
1. ✅ Cliquer "Nouvelle vente"
2. ✅ Sélectionner "Nouveau restaurant"
3. ✅ Étape 1 : Remplir nom + adresse + type (Franchisé)
4. ✅ Étape 2 : Remplir contact propriétaire (Sophie Martin)
5. ✅ Étape 3 : Remplir facturation (Pokawa Test 1 SAS)
6. ⚠️ Étape 4 : **BLOQUÉ** - Sélection produits vide (aucune sélection active)

**Observation** :
- L'utilisateur Pokawa n'a pas de sélection de produits active
- Étape 4 affiche uniquement le titre "Sélection de produits" avec un loader
- Aucun catalogue ne se charge

**Action** : Fermeture modal, rafraîchissement page F5

### ⚠️ Test 3 : Flow "Restaurant existant"

**Steps** :
1. ✅ Rafraîchir page /commandes (données chargées)
2. ✅ Cliquer "Nouvelle vente"
3. ✅ Sélectionner "Restaurant existant"
4. ✅ Voir sélection "Collection Mobilier Pokawa" (31 produits)
5. ✅ Cliquer sur la sélection → **produits chargés**
6. ❌ **BUG CRITIQUE** : Pas de barre de recherche
7. ❌ **BUG CRITIQUE** : Pas de filtres catégories

**Evidence** :
- Screenshot : `.claude/reports/test-LM-ORD-006-top-of-modal.png`
- Grille 3 colonnes visible
- Pagination visible (1, 2, 3)
- Panier vide state visible à droite

**Conclusion** : **Tests bloqués** - Impossible de continuer sans :
1. Barre de recherche fonctionnelle
2. Filtres catégories fonctionnels

---

## 📝 Observations LM-ORD-004 (Pré-remplissage contacts)

**Test effectué** : Flow "Nouveau restaurant" - Étape 2 (Propriétaire)

**Observation** :
- ❌ Champs **vides** (pas de pré-remplissage depuis profil utilisateur)
- Champs testés : Prénom, Nom, Email, Téléphone

**Attendu** (selon LM-ORD-004) :
- ✅ Prénom : pré-rempli depuis `user.user_metadata.full_name`
- ✅ Email : pré-rempli depuis `user.email`
- ✅ Téléphone : pré-rempli depuis `user.user_metadata.phone`

**Conclusion** : **LM-ORD-004 non vérifié** (pré-remplissage absent)

**Cause possible** :
- Hook `useAuth()` non utilisé dans CreateOrderModal
- État `requester` non initialisé

---

## 🔄 Tests Non Effectués

### ⏸️ Test : Commande depuis sélection publique

**Raison** : Bloqué par BUG #2 (LM-ORD-006 incomplet)

**URL prévue** : `http://localhost:3002/s/[id]` (sélection publique Pokawa)

### ⏸️ Test : Vérification back-office

**Raison** : Aucune commande créée (tests bloqués)

**URL prévue** : `http://localhost:3000/sales-orders`

---

## 🎯 Actions Recommandées (Par Priorité)

### 🔴 CRITIQUE #1 : Fixer BUG Rafraîchissement (Récurrent)

**Impact** : ~20 pages concernées (LinkMe + Back-Office)

**Plan** :
1. Auditer les 20 hooks détectés
2. Ajouter `enabled` dans React Query
3. Tester pages principales :
   - `/commandes` (LinkMe)
   - `/organisations` (LinkMe)
   - `/ma-selection` (LinkMe)
   - `/dashboard` (LinkMe)
   - `/sales-orders` (Back-Office)
   - `/customers` (Back-Office)

**Effort** : ~2-3h (audit + corrections)

### 🔴 CRITIQUE #2 : Re-architecturer LM-ORD-006

**Plan** :
1. Créer composant `ProductSelector` (réutilisable)
2. Implémenter architecture 3 étapes (utilisateur)
3. Intégrer composants existants (ProductFilters, CategoryTabs, Pagination)
4. Layout 75% catalogue + 25% panier mini-modal

**Effort** : ~6h

### 🟠 MAJEUR #3 : Vérifier LM-ORD-004 (Pré-remplissage)

**Plan** :
1. Vérifier hook `useAuth()` dans CreateOrderModal
2. Vérifier initialisation état `requester`
3. Tester auto-fill étape 2

**Effort** : ~30 min

---

## 📚 Documentation Créée

- ✅ `.claude/work/BUG-LM-ORD-006-INCOMPLETE.md` - Analyse détaillée bug LM-ORD-006
- ✅ `.claude/work/RAPPORT-TESTS-2026-01-15.md` - Ce rapport

**Screenshots** :
- `.claude/reports/test-pokawa1-step4-loading.png`
- `.claude/reports/test-modal-opened.png`
- `.claude/reports/test-restaurant-existant-step.png`
- `.claude/reports/test-LM-ORD-006-layout-2-colonnes.png`
- `.claude/reports/test-LM-ORD-006-grille-produits.png`
- `.claude/reports/test-LM-ORD-006-top-of-modal.png`

---

## 🔍 Audit Général Demandé

L'utilisateur a demandé un **audit général** des pages principales (LinkMe + Back-Office) pour identifier tous les problèmes de rafraîchissement.

**Méthode** :
1. Tester chaque page principale sans rafraîchissement F5
2. Noter si données se chargent au premier rendu
3. Identifier hooks responsables
4. Proposer corrections globales

**Pages à auditer** :

**LinkMe** :
- `/dashboard`
- `/commandes`
- `/organisations`
- `/ma-selection`
- `/mes-produits`
- `/commissions`
- `/parametres`

**Back-Office** :
- `/dashboard`
- `/sales-orders`
- `/customers`
- `/inventory`
- `/products`
- `/organisations`

---

**Rapport terminé** : 2026-01-15
**Agent** : READ1 (Playwright lane-1)
**Status** : Tests interrompus (bugs critiques)
**Prochaine étape** : Audit général OU Corrections LM-ORD-006 (décision utilisateur)
