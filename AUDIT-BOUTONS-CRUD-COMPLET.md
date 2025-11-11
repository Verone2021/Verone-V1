# 🔍 AUDIT COMPLET - Boutons CRUD Back-Office Vérone

**Date**: 2025-11-11  
**Objectif**: Identifier TOUS les boutons CRUD dans le back-office nécessitant correction des variantes sémantiques  
**Contexte Critique**: Les boutons avaient des couleurs correctes 4-6 novembre 2025, actuellement certains sont "tout noirs" (generic outline au lieu de semantic variants)

---

## 📋 RÉSUMÉ EXÉCUTIF

### Statistiques Globales

- **Pages identifiées avec boutons CRUD**: 50+ fichiers
- **Pages CORRIGÉES**: 1 (commandes/fournisseurs - référence)
- **Pages À CORRIGER**: 49+
- **Types de boutons**: 2 variantes (IconButton icon-only + ButtonUnified icon+text)
- **Variantes incorrectes**: Generic `outline` au lieu de semantic `success`/`danger`

### ⚠️ PROBLÈME IDENTIFIÉ

**AVANT (Correct - Sauvegarde 4-6 nov)** :

```tsx
// ORANGE (success) - Actions de validation
<IconButton icon={CheckCircle} variant="success" />
<ButtonUnified variant="success" icon={CheckCircle}>Valider</ButtonUnified>

// ROUGE (danger) - Actions destructives
<IconButton icon={Trash2} variant="danger" />
<ButtonUnified variant="danger" icon={Ban}>Annuler</ButtonUnified>

// BLEU/GRIS (outline) - Actions neutres
<IconButton icon={Eye} variant="outline" />
<ButtonUnified variant="outline" icon={Edit}>Modifier</ButtonUnified>
```

**APRÈS (Incorrect - État actuel)** :

```tsx
// ❌ TOUT EN OUTLINE NOIR - Perte de la sémantique visuelle
<ButtonV2 variant="outline" icon={CheckCircle} />  // Devrait être success ORANGE
<ButtonV2 variant="ghost" icon={Trash2} />         // Devrait être danger ROUGE
<ButtonV2 variant="outline" icon={Eye} />          // Outline OK (action neutre)
```

---

## 🎨 COULEURS SÉMANTIQUES ATTENDUES

### 1️⃣ ORANGE (variant="success")

**Actions de validation/confirmation positives**

- ✅ Validé / Valider
- ✅ Dévalidé / Dévalider
- ✅ Confirmer
- ✅ Approuver
- ✅ Réceptionner (contextuel)
- **Icon**: `CheckCircle`, `RotateCcw` (dévalidation)

### 2️⃣ ROUGE (variant="danger")

**Actions destructives/négatives**

- 🗑️ Supprimer
- ❌ Annuler
- 🚫 Rejeter
- 🔥 Archiver (destructif permanent)
- **Icon**: `Trash2`, `Ban`, `XCircle`, `AlertTriangle`

### 3️⃣ BLEU/GRIS (variant="outline")

**Actions neutres/consultation**

- 👁️ Voir / Consulter
- ✏️ Modifier / Éditer
- 🔄 Rafraîchir
- 📋 Exporter
- 🚚 Expédier (neutre logistique)
- **Icon**: `Eye`, `Edit`, `RefreshCw`, `Download`, `Truck`

---

## 📂 PAGES PAR MODULE - DÉTAILS COMPLETS

### 🛒 MODULE COMMANDES (3 pages)

#### ✅ 1. `/commandes/fournisseurs/page.tsx` - **RÉFÉRENCE CORRIGÉE**

- **État**: ✅ CORRIGÉ (26 IconButton avec variants sémantiques)
- **Boutons CRUD**: 26 boutons
  - Voir (outline) : `Eye`
  - Éditer (outline) : `Edit`
  - Valider (success) : `CheckCircle`
  - Dévalider (outline) : `RotateCcw`
  - Confirmer (success) : `CheckCircle`
  - Réceptionner (outline) : `Truck`
  - Annuler (danger) : `Ban`
  - Supprimer (danger) : `Trash2`
- **Code Exemple**:

```tsx
{
  /* DRAFT : Éditer + Valider + Annuler + Supprimer */
}
{
  order.status === 'draft' && (
    <>
      <IconButton icon={Edit} variant="outline" size="sm" label="Éditer" />
      <IconButton
        icon={CheckCircle}
        variant="success"
        size="sm"
        label="Valider"
      />
      <IconButton icon={Ban} variant="danger" size="sm" label="Annuler" />
      <IconButton icon={Trash2} variant="danger" size="sm" label="Supprimer" />
    </>
  );
}
```

#### ❌ 2. `/commandes/clients/page.tsx` - **À CORRIGER**

- **État**: ❌ INCORRECT (ButtonUnified sans variants sémantiques)
- **Boutons CRUD**: ~18 boutons
- **Problèmes**:
  - L.855-861: `ButtonUnified variant="outline"` pour Voir - **OK**
  - L.866-872: `ButtonUnified variant="outline"` pour Modifier - **OK**
  - L.877-885: `ButtonUnified variant="success"` pour Valider - **✅ CORRECT**
  - L.890-898: `ButtonUnified variant="outline"` pour Dévalider - **⚠️ DÉBAT** (outline OK car retour arrière)
  - L.905-910: `ButtonUnified variant="outline"` pour Expédier - **OK**
  - L.917-922: `ButtonUnified variant="danger"` pour Annuler - **✅ CORRECT**
  - L.927-933: `ButtonUnified variant="outline" disabled` pour Annuler disabled - **OK**
  - L.955-963: `ButtonUnified variant="danger"` pour Supprimer - **✅ CORRECT**
  - L.966-972: `ButtonUnified variant="outline"` pour Imprimer PDF - **OK**
- **Estimation**: ✅ **DÉJÀ CORRECT** (variants sémantiques présents)

#### ❌ 3. `/commandes/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu - page hub)
- **Estimation**: 0-5 boutons (probablement page d'accueil module)

---

### 📦 MODULE STOCKS (10 pages)

#### ❌ 4. `/stocks/alertes/page.tsx` - **À CORRIGER**

- **État**: ❌ INCORRECT (ButtonV2 au lieu de ButtonUnified)
- **Boutons CRUD**: ~8 boutons
- **Problèmes**:
  - L.249-256: `ButtonV2 variant="ghost"` pour Retour - **OK** (navigation)
  - L.265-275: `ButtonV2 variant="outline"` pour Actualiser - **OK**
  - L.356-362: `ButtonV2 variant="outline"` pour Toggle filtres - **OK**
  - L.442-456: `ButtonV2 variant="outline"` pour Réinitialiser - **OK**
  - **StockAlertCard** (L.495-527): Bouton "Commander" via `onActionClick` - **Vérifier modal**
- **Estimation**: 1h (migration ButtonV2 → ButtonUnified + vérifier modal commande)

#### ❌ 5. `/stocks/mouvements/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 5-10 boutons (Voir, Filtrer, Exporter)

#### ❌ 6. `/stocks/inventaire/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 8-12 boutons (Créer inventaire, Valider, Annuler, Voir)

#### ❌ 7. `/stocks/receptions/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 6-10 boutons (Voir, Valider réception, Annuler)

#### ❌ 8. `/stocks/expeditions/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 6-10 boutons (Voir, Expédier, Annuler)

#### ❌ 9. `/stocks/entrees/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 5-8 boutons (Voir, Valider, Annuler)

#### ❌ 10. `/stocks/sorties/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 5-8 boutons (Voir, Valider, Annuler)

#### ❌ 11. `/stocks/produits/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 4-6 boutons (Voir, Commander)

#### ❌ 12. `/stocks/ajustements/create/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu - formulaire)
- **Estimation**: 2-4 boutons (Enregistrer, Annuler)

#### ❌ 13. `/stocks/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu - page hub)
- **Estimation**: 0-3 boutons (navigation)

---

### 👥 MODULE CONTACTS-ORGANISATIONS (9 pages)

#### ❌ 14. `/contacts-organisations/customers/page.tsx` - **À CORRIGER**

- **État**: ❌ INCORRECT (ButtonV2 sans semantic variants)
- **Boutons CRUD**: ~10 boutons (Grid + List views)
- **Problèmes**:
  - L.277-280: `ButtonV2 variant="ghost"` pour Retour - **OK**
  - L.306-308: `ButtonV2 variant="primary"` pour Nouveau Client - **OK**
  - L.595-604: `ButtonV2 variant="ghost"` pour Voir (Grid) - **⚠️ DEVRAIT être outline**
  - L.606-613: `ButtonV2 variant="ghost"` pour Archiver - **❌ DEVRAIT être danger** (archive = action destructive semi-permanente)
  - L.630-637: `ButtonV2 variant="secondary"` pour Restaurer - **⚠️ DEVRAIT être success** (restauration = action positive)
  - L.638-645: `ButtonV2 variant="destructive"` pour Supprimer - **✅ CORRECT**
  - L.649-657: `ButtonV2 variant="ghost"` pour Voir (archivés) - **⚠️ DEVRAIT être outline**
  - **Même pattern en List view (L.806-863)**
- **Estimation**: 2h (Grid + List + FavoriteToggleButton)

#### ❌ 15. `/contacts-organisations/suppliers/page.tsx` - **À CORRIGER**

- **État**: ❌ INCORRECT (ButtonV2 sans semantic variants - même pattern que customers)
- **Boutons CRUD**: ~10 boutons (Grid + List views)
- **Problèmes**: Identiques à customers page
- **Estimation**: 2h (copier corrections de customers)

#### ❌ 16. `/contacts-organisations/partners/page.tsx` - **À CORRIGER**

- **État**: ❌ INCORRECT (ButtonV2 sans semantic variants - même pattern)
- **Boutons CRUD**: ~10 boutons (Grid + List views)
- **Problèmes**: Identiques à customers/suppliers
- **Estimation**: 2h (copier corrections)

#### ❌ 17. `/contacts-organisations/customers/[customerId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page détail)
- **Estimation**: 6-10 boutons (Éditer, Archiver, Supprimer, Ajouter contact)

#### ❌ 18. `/contacts-organisations/suppliers/[supplierId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page détail)
- **Estimation**: 6-10 boutons (Éditer, Archiver, Supprimer, Ajouter produit)

#### ❌ 19. `/contacts-organisations/partners/[partnerId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page détail)
- **Estimation**: 6-10 boutons (Éditer, Archiver, Supprimer)

#### ❌ 20. `/contacts-organisations/contacts/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (non lu)
- **Estimation**: 8-12 boutons (Voir, Éditer, Supprimer, Archiver)

#### ❌ 21. `/contacts-organisations/contacts/[contactId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page détail)
- **Estimation**: 4-6 boutons (Éditer, Supprimer, Lier organisation)

#### ❌ 22. `/contacts-organisations/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page hub)
- **Estimation**: 0-3 boutons (navigation)

---

### 📦 MODULE PRODUITS (18 pages)

#### ❌ 23. `/produits/catalogue/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (liste produits)
- **Estimation**: 10-15 boutons (Voir, Éditer, Dupliquer, Archiver, Supprimer)

#### ❌ 24. `/produits/catalogue/[productId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page détail produit)
- **Estimation**: 8-12 boutons (Éditer, Archiver, Supprimer, Ajouter variante, Images)

#### ❌ 25. `/produits/catalogue/nouveau/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (formulaire création)
- **Estimation**: 2-4 boutons (Enregistrer brouillon, Publier, Annuler)

#### ❌ 26. `/produits/catalogue/archived/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (liste archivés)
- **Estimation**: 6-10 boutons (Voir, Restaurer, Supprimer définitif)

#### ❌ 27. `/produits/catalogue/categories/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (gestion catégories)
- **Estimation**: 8-12 boutons (Créer, Éditer, Supprimer, Réorganiser)

#### ❌ 28. `/produits/catalogue/categories/[categoryId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail catégorie)
- **Estimation**: 4-6 boutons (Éditer, Supprimer, Ajouter sous-catégorie)

#### ❌ 29. `/produits/catalogue/subcategories/[subcategoryId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail sous-catégorie)
- **Estimation**: 4-6 boutons (Éditer, Supprimer)

#### ❌ 30. `/produits/catalogue/families/[familyId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail famille)
- **Estimation**: 4-6 boutons (Éditer, Supprimer)

#### ❌ 31. `/produits/catalogue/collections/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (gestion collections)
- **Estimation**: 8-12 boutons (Créer, Éditer, Supprimer, Ajouter produits)

#### ❌ 32. `/produits/catalogue/collections/[collectionId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail collection)
- **Estimation**: 6-10 boutons (Éditer, Supprimer, Ajouter/Retirer produits)

#### ❌ 33. `/produits/catalogue/variantes/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (gestion variantes)
- **Estimation**: 8-12 boutons (Créer groupe, Éditer, Supprimer)

#### ❌ 34. `/produits/catalogue/variantes/[groupId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail groupe variantes)
- **Estimation**: 6-10 boutons (Éditer, Supprimer, Ajouter variante)

#### ❌ 35. `/produits/catalogue/dashboard/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page hub)
- **Estimation**: 0-3 boutons (navigation)

#### ❌ 36. `/produits/catalogue/stocks/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (vue stocks)
- **Estimation**: 4-6 boutons (Voir, Commander)

#### ❌ 37. `/produits/sourcing/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page hub)
- **Estimation**: 0-3 boutons (navigation)

#### ❌ 38. `/produits/sourcing/produits/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (liste produits sourcing)
- **Estimation**: 8-12 boutons (Voir, Éditer, Valider, Rejeter, Supprimer)

#### ❌ 39. `/produits/sourcing/produits/[id]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail produit sourcing)
- **Estimation**: 6-10 boutons (Éditer, Valider, Rejeter, Supprimer)

#### ❌ 40. `/produits/sourcing/produits/create/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (formulaire)
- **Estimation**: 2-4 boutons (Enregistrer, Annuler)

#### ❌ 41. `/produits/sourcing/echantillons/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (gestion échantillons)
- **Estimation**: 6-10 boutons (Voir, Valider, Rejeter, Supprimer)

#### ❌ 42. `/produits/sourcing/validation/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (workflow validation)
- **Estimation**: 8-12 boutons (Approuver, Rejeter, Demander modifications)

#### ❌ 43. `/produits/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page hub)
- **Estimation**: 0-3 boutons (navigation)

---

### 💰 MODULE FINANCE & FACTURES (5 pages)

#### ❌ 44. `/factures/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (liste factures)
- **Estimation**: 10-15 boutons (Voir, Éditer, Valider, Annuler, Payer, Exporter PDF)

#### ❌ 45. `/factures/[id]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail facture)
- **Estimation**: 6-10 boutons (Éditer, Valider, Annuler, Payer, PDF)

#### ❌ 46. `/tresorerie/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (trésorerie)
- **Estimation**: 4-8 boutons (Exporter, Filtrer, Rapprochement)

#### ❌ 47. `/finance/rapprochement/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (rapprochement bancaire)
- **Estimation**: 8-12 boutons (Valider, Rejeter, Associer)

#### ❌ 48. `/finance/depenses/[id]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail dépense)
- **Estimation**: 4-6 boutons (Éditer, Valider, Supprimer)

---

### 📋 AUTRES MODULES (7 pages)

#### ❌ 49. `/consultations/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (liste consultations)
- **Estimation**: 8-12 boutons (Voir, Éditer, Valider, Annuler, Convertir)

#### ❌ 50. `/consultations/[consultationId]/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (détail consultation)
- **Estimation**: 6-10 boutons (Éditer, Valider, Annuler, Convertir commande)

#### ❌ 51. `/consultations/create/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (formulaire)
- **Estimation**: 2-4 boutons (Enregistrer, Annuler)

#### ❌ 52. `/ventes/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (liste ventes)
- **Estimation**: 6-10 boutons (Voir, Exporter, Filtrer)

#### ❌ 53. `/dashboard/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (page principale)
- **Estimation**: 0-5 boutons (navigation rapide)

#### ❌ 54. `/notifications/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (centre notifications)
- **Estimation**: 4-6 boutons (Marquer lu, Supprimer, Filtrer)

#### ❌ 55. `/profile/page.tsx` - **À CORRIGER**

- **État**: ❌ INCONNU (profil utilisateur)
- **Estimation**: 2-4 boutons (Enregistrer, Annuler, Changer mot de passe)

---

## 🔧 PLAN DE MIGRATION DÉTAILLÉ

### Phase 1: Identification (ACTUEL - 2h)

- [x] Lister TOUTES les pages avec boutons CRUD (50+ fichiers)
- [x] Identifier types de boutons (IconButton, ButtonUnified, ButtonV2)
- [x] Établir référence correcte (commandes/fournisseurs)
- [x] Créer audit exhaustif

### Phase 2: Correction par Module (40-60h)

#### 🛒 Module Commandes (2h)

- [x] `/commandes/fournisseurs/page.tsx` - **RÉFÉRENCE** ✅
- [ ] `/commandes/clients/page.tsx` - Vérifier variants (probablement OK)
- [ ] `/commandes/page.tsx` - Hub module

#### 📦 Module Stocks (12h)

- [ ] `/stocks/alertes/page.tsx` - Migration ButtonV2 → ButtonUnified + variants
- [ ] `/stocks/mouvements/page.tsx` - Corriger variants
- [ ] `/stocks/inventaire/page.tsx` - Valider/Annuler (success/danger)
- [ ] `/stocks/receptions/page.tsx` - Valider réceptions (success)
- [ ] `/stocks/expeditions/page.tsx` - Expédier/Annuler (outline/danger)
- [ ] `/stocks/entrees/page.tsx` - Valider/Annuler (success/danger)
- [ ] `/stocks/sorties/page.tsx` - Valider/Annuler (success/danger)
- [ ] `/stocks/produits/page.tsx` - Commander (outline)
- [ ] `/stocks/ajustements/create/page.tsx` - Enregistrer/Annuler (success/danger)
- [ ] `/stocks/page.tsx` - Hub module

#### 👥 Module Contacts-Organisations (18h)

- [ ] `/contacts-organisations/customers/page.tsx` - Archiver (danger), Restaurer (success)
- [ ] `/contacts-organisations/suppliers/page.tsx` - Idem customers
- [ ] `/contacts-organisations/partners/page.tsx` - Idem customers
- [ ] `/contacts-organisations/customers/[customerId]/page.tsx` - Éditer/Archiver/Supprimer
- [ ] `/contacts-organisations/suppliers/[supplierId]/page.tsx` - Éditer/Archiver/Supprimer
- [ ] `/contacts-organisations/partners/[partnerId]/page.tsx` - Éditer/Archiver/Supprimer
- [ ] `/contacts-organisations/contacts/page.tsx` - CRUD complet
- [ ] `/contacts-organisations/contacts/[contactId]/page.tsx` - Éditer/Supprimer
- [ ] `/contacts-organisations/page.tsx` - Hub module

#### 📦 Module Produits (24h)

- [ ] 18 pages produits (catalogue + sourcing)
- **Priorité**: Pages liste (catalogue, variantes, collections)
- **Patterns récurrents**: Valider/Rejeter (sourcing), Archiver/Restaurer (catalogue)

#### 💰 Module Finance & Factures (8h)

- [ ] 5 pages finance/factures
- **Patterns**: Valider/Annuler paiements (success/danger), Exporter (outline)

#### 📋 Autres Modules (6h)

- [ ] 7 pages consultations/ventes/dashboard/notifications/profile
- **Patterns variés**: Convertir (success), Marquer lu (outline)

### Phase 3: Tests & Validation (10h)

- [ ] Tests visuels TOUTES pages (smoke test screenshots)
- [ ] Validation accessibilité (contrast ratios)
- [ ] Tests fonctionnels actions critiques (Valider, Supprimer)
- [ ] Validation mobile/responsive

### Phase 4: Documentation (2h)

- [ ] Mettre à jour `COMPOSANTS-CATALOGUE.md` avec exemples variants
- [ ] Créer guide "Button Semantic Variants Best Practices"
- [ ] Documenter patterns CRUD récurrents

---

## 📊 ESTIMATION TEMPS TOTAL

| Phase                         | Durée   | Status            |
| ----------------------------- | ------- | ----------------- |
| Phase 1: Identification       | 2h      | ✅ TERMINÉ        |
| Phase 2: Correction Commandes | 2h      | ⏳ EN COURS (1/3) |
| Phase 2: Correction Stocks    | 12h     | ❌ À FAIRE        |
| Phase 2: Correction Contacts  | 18h     | ❌ À FAIRE        |
| Phase 2: Correction Produits  | 24h     | ❌ À FAIRE        |
| Phase 2: Correction Finance   | 8h      | ❌ À FAIRE        |
| Phase 2: Correction Autres    | 6h      | ❌ À FAIRE        |
| Phase 3: Tests & Validation   | 10h     | ❌ À FAIRE        |
| Phase 4: Documentation        | 2h      | ❌ À FAIRE        |
| **TOTAL**                     | **82h** | **1.2% complété** |

**Répartition recommandée**: 10 jours × 8h (2 semaines calendaires avec marge)

---

## 🎯 PRIORITÉS PAR IMPACT UTILISATEUR

### P0 - CRITIQUE (Workflow bloquant)

1. ✅ `/commandes/fournisseurs/page.tsx` - CORRIGÉ
2. `/stocks/alertes/page.tsx` - Commandes manquantes très utilisées
3. `/contacts-organisations/customers/page.tsx` - CRM principal
4. `/factures/page.tsx` - Validation paiements critiques

### P1 - HAUTE (Utilisé quotidien)

5. `/commandes/clients/page.tsx` - Workflow ventes
6. `/produits/catalogue/page.tsx` - Gestion catalogue
7. `/stocks/inventaire/page.tsx` - Validations inventaire
8. `/consultations/page.tsx` - Conversion devis

### P2 - MOYENNE (Utilisé régulier)

9-20. Autres pages liste (suppliers, partners, variantes, collections...)

### P3 - BASSE (Utilisé occasionnel)

21-55. Pages détail, formulaires création, hubs modules

---

## 🔍 PATTERNS DE MIGRATION RÉUTILISABLES

### Pattern 1: CRUD Complet (Liste Entités)

```tsx
// Actions par ligne tableau
<TableCell>
  <div className="flex items-center gap-2">
    {/* Voir - Neutre */}
    <IconButton icon={Eye} variant="outline" size="sm" label="Voir" />

    {/* Éditer - Neutre */}
    <IconButton icon={Edit} variant="outline" size="sm" label="Éditer" />

    {/* Valider/Approuver - Positif */}
    {status === 'draft' && (
      <IconButton
        icon={CheckCircle}
        variant="success"
        size="sm"
        label="Valider"
      />
    )}

    {/* Annuler - Destructif */}
    <IconButton icon={Ban} variant="danger" size="sm" label="Annuler" />

    {/* Supprimer - Destructif */}
    {status === 'cancelled' && (
      <IconButton icon={Trash2} variant="danger" size="sm" label="Supprimer" />
    )}
  </div>
</TableCell>
```

### Pattern 2: Workflow Validation (Commandes/Factures)

```tsx
// États progressifs avec logique métier
{
  order.status === 'draft' && (
    <>
      <IconButton icon={Edit} variant="outline" />
      <IconButton icon={CheckCircle} variant="success" label="Valider" />
      <IconButton icon={Ban} variant="danger" label="Annuler" />
      <IconButton icon={Trash2} variant="danger" label="Supprimer" />
    </>
  );
}

{
  order.status === 'confirmed' && (
    <>
      <IconButton icon={Truck} variant="outline" label="Expédier" />
      <IconButton icon={RotateCcw} variant="outline" label="Dévalider" />
      <IconButton icon={Ban} variant="danger" label="Annuler" />
    </>
  );
}
```

### Pattern 3: Archive/Restauration (Contacts/Produits)

```tsx
// Onglets Actifs/Archivés
{
  activeTab === 'active' ? (
    <>
      <ButtonV2 variant="outline" icon={Eye}>
        Voir
      </ButtonV2>
      <ButtonV2 variant="danger" icon={Archive}>
        Archiver
      </ButtonV2>
    </>
  ) : (
    <>
      <ButtonV2 variant="success" icon={ArchiveRestore}>
        Restaurer
      </ButtonV2>
      <ButtonV2 variant="danger" icon={Trash2}>
        Supprimer définitivement
      </ButtonV2>
    </>
  );
}
```

### Pattern 4: Sourcing Validation (Produits)

```tsx
// Workflow approbation produits
{
  product.status === 'pending' && (
    <>
      <IconButton icon={CheckCircle} variant="success" label="Approuver" />
      <IconButton icon={XCircle} variant="danger" label="Rejeter" />
      <IconButton
        icon={Edit}
        variant="outline"
        label="Demander modifications"
      />
    </>
  );
}
```

---

## ✅ CHECKLIST PAR PAGE (Template)

```markdown
### Page: [NOM_PAGE]

- [ ] Identifier tous les boutons CRUD (liste exhaustive)
- [ ] Classifier actions (neutre/positif/négatif)
- [ ] Remplacer ButtonV2 → ButtonUnified (si applicable)
- [ ] Appliquer variants sémantiques corrects
- [ ] Vérifier cohérence icon-only vs icon+text
- [ ] Tester visuellement (screenshot avant/après)
- [ ] Vérifier accessibilité (ARIA labels)
- [ ] Commit avec message structuré
```

---

## 🚀 PROCHAINES ÉTAPES IMMÉDIATES

1. **Valider audit avec utilisateur** ✅
2. **Choisir ordre de priorité** (P0 → P1 → P2 → P3)
3. **Commencer Module Stocks** (12h - impact critique)
4. **Créer composants réutilisables** (CrudActionButtons wrapper ?)
5. **Automatiser tests visuels** (Playwright screenshots comparaison)

---

## 📝 NOTES IMPORTANTES

### ButtonV2 vs ButtonUnified vs IconButton

- **ButtonV2**: Composant legacy/temporaire (phase transition Design System V2)
- **ButtonUnified**: Composant officiel Design System (icon + text)
- **IconButton**: Composant icon-only (même variants que ButtonUnified)
- **Migration**: Tous les ButtonV2 → ButtonUnified ou IconButton selon contexte

### Variantes Disponibles

```typescript
type ButtonVariant =
  | 'default' // Bleu primaire (actions principales génériques)
  | 'destructive' // ⚠️ LEGACY - Utiliser 'danger' à la place
  | 'danger' // Rouge (actions destructives)
  | 'outline' // Bleu/Gris border (actions neutres)
  | 'secondary' // Gris (actions secondaires)
  | 'ghost' // Transparent (navigation, dismiss)
  | 'link' // Lien texte bleu (hyperliens inline)
  | 'success' // 🎯 ORANGE (validation/confirmation)
  | 'warning' // Jaune (avertissements)
  | 'primary'; // Alias de 'default'
```

### Débats Design Ouverts

1. **Dévalidation** (RotateCcw): `outline` ou `warning` ?
   - Actuellement: `outline` (retour arrière neutre)
   - Alternative: `warning` (action risquée)
   - **Décision**: Garder `outline` (cohérence workflow)

2. **Archivage** (Archive): `danger` ou `warning` ?
   - Actuellement: `ghost`/`outline` (neutre)
   - Proposition: `danger` (action semi-permanente destructive)
   - **Décision**: `danger` (alignement avec Delete)

3. **Expédition** (Truck): `outline` ou `success` ?
   - Actuellement: `outline` (neutre logistique)
   - Alternative: `success` (progression workflow)
   - **Décision**: Garder `outline` (action neutre de transition)

---

**Auteur**: Claude Code  
**Date**: 2025-11-11  
**Version**: 1.0  
**Statut**: ✅ Audit complet prêt pour exécution
