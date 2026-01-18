# AUDIT COMPLET : Workflow Création Commande LinkMe (LM-ORD-005)

**Date** : 2026-01-14
**Fichier audité** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
**Lignes** : 860+ lignes

---

## 📊 RÉSUMÉ EXÉCUTIF

### ✅ Implémenté correctement
1. **Modal en deux parties** (produits + panier) ✅ **CONFORME**
2. **Récapitulatif final étape 5** ✅ **CONFORME**
3. **Gestion du panier** ✅ **FONCTIONNEL**
4. **Étapes 1-2-3-4-5** pour nouveau restaurant ✅ **STRUCTURE OK**

### ❌ Problèmes critiques identifiés
1. **CRITIQUE** : Demandeur (p_requester) = Propriétaire au lieu de l'utilisateur authentifié
2. **MAJEUR** : Aucune récupération des données utilisateur authentifié (useAuth non utilisé)
3. **MOYEN** : Pas d'affichage du demandeur dans le récapitulatif étape 5
4. **MOYEN** : Étape 2 ne distingue pas "Propriétaire" vs "Responsable" selon le type

---

## 🔍 ANALYSE DÉTAILLÉE

### 1. Récupération données utilisateur authentifié

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Code actuel** :
```typescript
// Ligne 178
const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
```

**Problème** :
- Le modal utilise uniquement `useUserAffiliate()` pour récupérer l'affilié (Pokawa)
- **AUCUNE** utilisation de `useAuth()` pour récupérer les données de l'utilisateur authentifié
- Les données du demandeur ne sont PAS pré-remplies automatiquement

**Impact** :
- L'utilisateur qui passe la commande n'est pas identifié automatiquement
- Les données du demandeur sont mélangées avec celles du propriétaire du restaurant

**Solution requise** :
```typescript
import { useAuth } from '@/contexts/AuthContext';

// Dans CreateOrderModal
const { user } = useAuth(); // Récupérer l'utilisateur authentifié

// Créer un objet requester depuis user
const requester = {
  type: 'responsable_enseigne',
  name: user?.user_metadata?.full_name || '',
  email: user?.email || '',
  phone: user?.user_metadata?.phone || '',
  position: null,
};
```

---

### 2. Demandeur (p_requester) dans handleSubmitNew

**Statut** : ❌ **INCORRECTEMENT IMPLÉMENTÉ**

**Code actuel** (lignes 460-467) :
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

**Problème** :
- Le demandeur (`p_requester`) est rempli avec les données du **PROPRIÉTAIRE du restaurant** (étape 2)
- Devrait être rempli avec les données de **l'utilisateur authentifié** qui passe la commande
- Commentaire trompeur : `// Demandeur = Propriétaire` (FAUX !)

**Impact** :
- ❌ On ne sait pas QUI a passé la commande
- ❌ Confusion entre la personne qui commande (utilisateur Pokawa) et le propriétaire du restaurant

**Solution requise** :
```typescript
// Demandeur = Utilisateur authentifié qui passe la commande
const p_requester = {
  type: 'responsable_enseigne',
  name: user?.user_metadata?.full_name || `${user?.email}`, // Utilisateur connecté
  email: user?.email || '',
  phone: user?.user_metadata?.phone || '',
  position: user?.user_metadata?.position || null,
};
```

---

### 3. Récapitulatif étape 5 - Section Demandeur absente

**Statut** : ❌ **MANQUANT**

**Code actuel** (lignes 1954-2180) :
L'étape 5 affiche :
- ✅ Restaurant (nom, type, adresse)
- ✅ Propriétaire (nom, email, téléphone, raison sociale)
- ✅ Facturation (dénomination sociale, SIRET, adresse, contact)
- ✅ Panier (produits, quantités, prix, marges, totaux)
- ❌ **DEMANDEUR** (qui passe la commande) **ABSENT**

**Problème** :
- L'utilisateur ne peut pas vérifier qui est enregistré comme demandeur
- Impossible de détecter l'erreur avant soumission

**Solution requise** :
Ajouter une section "Demandeur" dans le récapitulatif étape 5 :

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
      <p className="font-medium">{user?.user_metadata?.full_name || user?.email}</p>
    </div>
    <div>
      <p className="text-gray-500">Email</p>
      <p className="font-medium">{user?.email}</p>
    </div>
    {user?.user_metadata?.phone && (
      <div>
        <p className="text-gray-500">Téléphone</p>
        <p className="font-medium">{user.user_metadata.phone}</p>
      </div>
    )}
  </div>
  <div className="mt-2 p-2 bg-blue-100 rounded text-xs text-blue-700">
    ℹ️ Cette personne sera enregistrée comme le demandeur de la commande
  </div>
</div>
```

---

### 4. Étape 2 - Distinction Propriétaire/Responsable

**Statut** : ⚠️ **PARTIELLEMENT OK**

**Code actuel** (lignes 1412+) :
```typescript
{newRestaurantStep === 2 && (
  // Étape 2 : Propriétaire / Contact du restaurant
```

**Problème** :
- Le label affiché n'est pas conditionnel selon le type (franchise vs propre)
- Devrait afficher "Propriétaire" si franchisé, "Responsable" si restaurant propre

**Solution requise** :
```typescript
<h3 className="text-lg font-semibold text-gray-900 mb-4">
  {newRestaurantForm.ownerType === 'franchise'
    ? 'Propriétaire du restaurant'
    : 'Responsable du restaurant'}
</h3>
```

---

### 5. Modal Produits en deux parties

**Statut** : ✅ **CONFORME**

**Code actuel** (lignes 868-1180) :

**Structure** :
1. **Section Produits** (ligne 868) :
   - Grille de produits disponibles
   - Bouton "Ajouter" pour chaque produit
   - Contrôles +/- si produit déjà dans le panier
   - Recherche par nom/SKU

2. **Section Récapitulatif** (ligne 1006) :
   - S'affiche uniquement si `cart.length > 0`
   - Tableau détaillé du panier :
     - Produit (nom + SKU)
     - Quantité (avec +/-)
     - Prix HT unitaire
     - Total HT ligne
     - Marge ligne
     - Bouton supprimer
   - Totaux (HT, TVA détaillée, TTC, Commission)

**Verdict** : ✅ **IMPLÉMENTATION CONFORME** - Pas de modification nécessaire

---

### 6. Récapitulatif final étape 5

**Statut** : ✅ **STRUCTURE OK** - ❌ **DEMANDEUR MANQUANT**

**Code actuel** (lignes 1954-2180) :

**Sections présentes** :
1. ✅ Restaurant (nom commercial, type, adresse livraison)
2. ✅ Propriétaire (nom, email, téléphone, raison sociale si franchise)
3. ✅ Facturation (dénomination sociale, SIRET, adresse, contact)
4. ✅ Panier (tableau produits avec totaux)

**Sections manquantes** :
1. ❌ **Demandeur** (qui passe la commande)
2. ❌ **Notes** (si renseignées)

**Verdict** : Structure complète mais manque section Demandeur + Notes

---

### 7. Flow "Restaurant existant" vs "Nouveau restaurant"

**Restaurant existant** (lignes 693-1180) :
- ✅ Sélection du restaurant dans une liste
- ✅ Chargement automatique des contacts depuis DB
- ✅ Section ContactsSection pour modifier/compléter
- ❌ **PROBLÈME** : Si contacts vides, pas de pré-remplissage depuis utilisateur
- ✅ Sélection produits + panier
- ❌ **PAS de récapitulatif final** avant soumission

**Nouveau restaurant** (lignes 1193-2282) :
- ✅ Stepper 5 étapes visuellement clair
- ✅ Étape 1 : Restaurant (nom, adresse, type)
- ✅ Étape 2 : Propriétaire (contact + raison sociale si franchise)
- ✅ Étape 3 : Facturation (dénomination sociale, SIRET, contact, adresse)
- ✅ Étape 4 : Produits (sélection + panier)
- ✅ Étape 5 : Récapitulatif complet
- ❌ **PROBLÈME** : Demandeur absent du récapitulatif

---

## 📋 PLAN DE CORRECTION

### Phase 1 : Récupération utilisateur authentifié (CRITIQUE)

**Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Tâches** :
1. Importer `useAuth` depuis `@/contexts/AuthContext`
2. Appeler `const { user } = useAuth()` dans CreateOrderModal
3. Créer un objet `requester` depuis `user.user_metadata` et `user.email`
4. Stocker dans un state local `const [requester, setRequester] = useState(...)`

**Code** :
```typescript
// Ligne 17 : Ajouter import
import { useAuth } from '@/contexts/AuthContext';

// Ligne 178 : Après useUserAffiliate()
const { user } = useAuth();

// Créer state pour le demandeur
const [requester, setRequester] = useState({
  type: 'responsable_enseigne',
  name: user?.user_metadata?.full_name || user?.email || '',
  email: user?.email || '',
  phone: user?.user_metadata?.phone || '',
  position: user?.user_metadata?.position || null,
});

// Mettre à jour quand user change
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

---

### Phase 2 : Corriger handleSubmitNew (CRITIQUE)

**Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Ligne** : 460-467

**Avant** :
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

**Après** :
```typescript
// Demandeur = Utilisateur authentifié qui passe la commande
const p_requester = requester;
```

---

### Phase 3 : Ajouter section Demandeur dans récapitulatif étape 5 (MAJEUR)

**Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Ligne** : Après ligne 1988 (après récap Restaurant, avant récap Propriétaire)

**Code à insérer** :
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

---

### Phase 4 : Corriger labels étape 2 (MOYEN)

**Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Ligne** : ~1412

**Avant** :
```typescript
<h3 className="text-lg font-semibold text-gray-900 mb-4">
  Contact du restaurant
</h3>
```

**Après** :
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

---

### Phase 5 : Ajouter récapitulatif dans flow "Restaurant existant" (MOYEN)

**Problème** : Le flow "Restaurant existant" n'a pas de page de récapitulatif avant soumission

**Solution** : Ajouter une modal de confirmation avec récapitulatif avant `handleSubmitExisting()`

**Code à ajouter** :
```typescript
// State pour afficher modal confirmation
const [showConfirmModalExisting, setShowConfirmModalExisting] = useState(false);

// Modifier le bouton "Créer la commande" pour ouvrir le modal confirmation
// Au lieu d'appeler handleSubmitExisting() directement

// Créer un nouveau composant ConfirmationModalExisting qui affiche :
// - Restaurant sélectionné
// - Contacts
// - Produits du panier
// - Totaux
// - Demandeur
// - Bouton "Confirmer la commande"
```

---

### Phase 6 : Ajouter section Notes dans récapitulatif (OPTIONNEL)

**Fichier** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`

**Ligne** : Après ligne 2168 (après récap Panier)

**Code à insérer** :
```typescript
{notes && (
  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
    <h4 className="font-medium text-gray-900 flex items-center gap-2">
      <FileText className="h-4 w-4 text-gray-600" />
      Notes
    </h4>
    <p className="text-sm text-gray-700 whitespace-pre-wrap">{notes}</p>
  </div>
)}
```

---

## 🎯 PRIORITÉS

### CRITIQUE (À faire immédiatement)
1. ✅ **Phase 1** : Récupération utilisateur authentifié
2. ✅ **Phase 2** : Corriger p_requester dans handleSubmitNew

### MAJEUR (À faire avant tests)
3. ✅ **Phase 3** : Ajouter section Demandeur dans récapitulatif

### MOYEN (Améliorations UX)
4. ✅ **Phase 4** : Corriger labels étape 2
5. ⚠️ **Phase 5** : Récapitulatif flow "Restaurant existant"

### OPTIONNEL
6. ⚠️ **Phase 6** : Section Notes dans récapitulatif

---

## ✅ VALIDATION

### Tests requis après corrections

**Test 1 : Nouveau restaurant (utilisateur authentifié Pokawa)**
1. Se connecter avec `pokawa-test@verone.io`
2. Créer nouvelle commande → Nouveau restaurant
3. Remplir étapes 1-4
4. Vérifier étape 5 :
   - ✅ Section "Demandeur" affiche les infos de l'utilisateur Pokawa
   - ✅ Section "Propriétaire" affiche les infos du franchisé/responsable
   - ✅ Panier correct
5. Valider la commande
6. Vérifier en DB que `p_requester` contient les données de l'utilisateur Pokawa

**Test 2 : Restaurant existant**
1. Se connecter avec `pokawa-test@verone.io`
2. Créer nouvelle commande → Restaurant existant
3. Sélectionner un restaurant
4. Ajouter produits au panier
5. Vérifier modal de confirmation (si Phase 5 implémentée)
6. Valider la commande
7. Vérifier en DB que `p_requester` contient les données de l'utilisateur Pokawa

**Test 3 : Page sélection publique (utilisateur non authentifié)**
- **Important** : Vérifier que le comportement est différent
- L'utilisateur doit renseigner ses coordonnées (formulaire OrderFormUnified)
- Pas de pré-remplissage automatique

---

## 📊 ESTIMATION

**Temps total** : ~2h30

| Phase | Tâches | Temps | Priorité |
|-------|--------|-------|----------|
| Phase 1 | Import useAuth + state requester | 15 min | CRITIQUE |
| Phase 2 | Corriger p_requester | 5 min | CRITIQUE |
| Phase 3 | Section Demandeur récap | 30 min | MAJEUR |
| Phase 4 | Labels conditionnels | 15 min | MOYEN |
| Phase 5 | Modal confirmation restaurant existant | 60 min | MOYEN |
| Phase 6 | Section Notes | 10 min | OPTIONNEL |
| **Tests** | Tests complets | **30 min** | **CRITIQUE** |

---

## 📝 NOTES IMPORTANTES

1. **Utilisateur authentifié vs non authentifié** :
   - LinkMe (utilisateur connecté) : Demandeur = utilisateur authentifié (AUTO)
   - Page sélection publique : Demandeur = client qui remplit le formulaire (MANUEL)

2. **Propriétaire vs Responsable** :
   - Franchisé → "Propriétaire"
   - Restaurant propre → "Responsable"
   - Ce sont les coordonnées du **restaurant**, PAS du demandeur

3. **p_requester vs p_owner** :
   - `p_requester` : Qui passe la commande (utilisateur Pokawa)
   - `p_owner` : Qui possède/gère le restaurant (franchisé ou responsable)

4. **Nom légal vs Nom commercial** :
   - Nom commercial (tradeName) : Enseigne visible
   - Nom légal (billingCompanyName / legal_name) : Raison sociale KBIS
   - Peuvent être identiques ou différents

---

_Audit réalisé le 2026-01-14_
_Auditeur : Claude Code (READ1 mode)_
