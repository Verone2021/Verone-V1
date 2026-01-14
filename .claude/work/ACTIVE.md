# Plan Actif

**Branche**: `fix/multi-bugs-2026-01`
**Last sync**: 2026-01-14 (53b5809c)

## Regles

- Task ID obligatoire: `[APP]-[DOMAIN]-[NNN]` (ex: BO-DASH-001, LM-ORD-002, WEB-CMS-001)
- Bypass: `[NO-TASK]` dans le message de commit (rare)
- Apres commit avec Task ID: `pnpm plan:sync` puis `git commit -am "chore(plan): sync"`

## Taches


---

## Audit - LM-ORD-004 (2026-01-14)

**Demande utilisateur** : Audit complet des formulaires de commande et proposition d'alignement entre utilisateur authentifié et utilisateur public.

### Context

**2 workflows de commande** :
1. **Utilisateur authentifié** (`/commandes` - CreateOrderModal) : Affilié Pokawa passant commande
2. **Utilisateur public** (sélection publique `/s/[id]` - OrderFormUnified) : Client anonyme commandant depuis sélection partagée

**Problème actuel** :
- Utilisateur authentifié a déjà ses données (nom, prénom, email, téléphone) dans son profil
- Ces données ne sont PAS pré-remplies dans le formulaire
- Utilisateur doit saisir manuellement les informations du restaurant client (pas les siennes)

### Fichiers analysés

1. **Page Commandes** : `apps/linkme/src/app/(main)/commandes/page.tsx` (581 lignes)
2. **Modal création** : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx` (>25000 tokens)
3. **Page sélection publique** : `apps/linkme/src/app/(public)/s/[id]/page.tsx` (754 lignes)
4. **Formulaire unifié** : `apps/linkme/src/components/OrderFormUnified.tsx` (analysé partiellement)

### État actuel - CreateOrderModal (utilisateur authentifié)

**Workflow** :
1. Question initiale : "Restaurant existant ou nouveau ?"
2. Si **restaurant existant** :
   - Sélectionner restaurant dans liste clients (`useAffiliateCustomers`)
   - Sélectionner sélection (catalogue)
   - Ajouter produits au panier
   - Remplir contacts (ContactsSection)
   - Notes optionnelles
   - → Crée commande en BROUILLON

3. Si **nouveau restaurant** (stepper 5 étapes) :
   - **Étape 1 - Livraison** : tradeName, city, address, postalCode, ownerType
   - **Étape 2 - Propriétaire** : ownerFirstName, ownerLastName, ownerEmail, ownerPhone, ownerCompanyName, ownerKbisUrl
   - **Étape 3 - Facturation** : billingSameAsOwner, billingUseSameAddress, billlingCompanyName, billingFirstName, billingLastName, billingEmail, billingPhone, billingAddress, billingPostalCode, billingCity, billingSiret, billingKbisUrl
   - **Étape 4 - Produits** : sélection + panier
   - **Étape 5 - Validation** : → Crée commande en APPROBATION

**Données demandées** :
```typescript
interface NewRestaurantFormState {
  // Étape 1 - Livraison
  tradeName: string;
  city: string;
  address: string;
  postalCode: string;
  ownerType: 'succursale' | 'franchise' | null;
  // Étape 2 - Propriétaire
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerCompanyName: string; // Raison sociale si franchise
  ownerKbisUrl: string;
  // Étape 3 - Facturation
  billingSameAsOwner: boolean;
  billingUseSameAddress: boolean;
  billingCompanyName: string;
  billingFirstName: string;
  billingLastName: string;
  billingEmail: string;
  billingPhone: string;
  billingAddress: string;
  billingPostalCode: string;
  billingCity: string;
  billingSiret: string;
  billingKbisUrl: string;
}
```

**❌ Problème** : Aucun pré-remplissage avec les données de l'affilié connecté

### État actuel - OrderFormUnified (sélection publique)

**Workflow identique** :
1. Question : "Est-ce une ouverture de restaurant ?"
2. Si **restaurant existant** :
   - Sélectionner restaurant dans liste organisations de l'enseigne
   - Produits déjà dans panier (ajoutés depuis catalogue)
   - → BROUILLON

3. Si **nouveau restaurant** (stepper 3 étapes) :
   - **Step 1 - Restaurant** : tradeName, city, address, postalCode
   - **Step 2 - Propriétaire** : type, contactSameAsRequester, name, email, phone, companyLegalName, companyTradeName, siret, kbisUrl
   - **Step 3 - Facturation** : contactSource ('owner' | 'custom'), name, email, phone, address, postalCode, city, companyLegalName, siret
   - **Step 4 - Validation** : → APPROBATION

**Données demandées** :
```typescript
export interface OrderFormUnifiedData {
  isNewRestaurant: boolean | null;
  existingOrganisationId: string | null;
  newRestaurant: {
    tradeName: string;
    city: string;
    address: string;
    postalCode: string;
  };
  owner: {
    type: 'succursale' | 'franchise' | null;
    contactSameAsRequester: boolean;  // ← CHECKBOX important !
    name: string;
    email: string;
    phone: string;
    companyLegalName: string;
    companyTradeName: string;
    siret: string;
    kbisUrl: string | null;
  };
  billing: {
    contactSource: 'owner' | 'custom';  // ← CHOIX important !
    name: string;
    email: string;
    phone: string;
    address: string;
    postalCode: string;
    city: string;
    companyLegalName: string;
    siret: string;
  };
  deliveryTermsAccepted: boolean;
  notes: string;
}
```

**❌ Problème** : Utilisateur anonyme doit TOUT remplir manuellement

### Comparaison des deux formulaires

| Aspect | CreateOrderModal (auth) | OrderFormUnified (public) |
|--------|------------------------|--------------------------|
| **Question initiale** | "Restaurant existant ou nouveau ?" | "Est-ce une ouverture de restaurant ?" |
| **Workflow** | Identique (existant vs nouveau) | Identique |
| **Étapes nouveau** | 5 étapes | 4 étapes (3 + validation) |
| **Champs demandés** | ~20 champs | ~18 champs |
| **Pré-remplissage** | ❌ Aucun | ❌ Aucun |
| **Backend** | ✅ Identique (`linkme_orders`) | ✅ Identique |

**Points communs** :
- Même logique métier
- Même structure de données
- Même workflow backend
- Même distinction restaurant existant/nouveau

**Différences** :
- Noms de variables légèrement différents
- Ordre des étapes
- CreateOrderModal plus complexe (5 étapes vs 4)
- OrderFormUnified a `contactSameAsRequester` checkbox (intelligent !)

### Clarification du besoin utilisateur

**Ce qui doit être pré-rempli** :
- ❌ PAS les informations de l'utilisateur authentifié (l'affilié)
- ✅ Les informations du **contact demandeur** pour un nouveau restaurant

**Cas d'usage réel** :
1. **Utilisateur public** (sélection partagée) :
   - Client restaurant appelle Pokawa : "Je veux ouvrir un restaurant"
   - Il navigue sur sélection Pokawa publique
   - Ajoute produits au panier
   - Doit remplir ses propres infos (nom, email, téléphone) → **Normal, pas de compte**

2. **Utilisateur authentifié** (affilié) :
   - Commercial Pokawa passe commande pour un client
   - Client appelle : "Je m'appelle Jean Dupont, mon email est..."
   - Commercial doit RE-SAISIR toutes ces infos manuellement → **❌ Perte de temps !**
   - **Solution** : Si le client a déjà un compte/profil → pré-remplir avec ses données

**Vrai problème identifié** :
- Quand l'utilisateur authentifié (commercial Pokawa) passe commande pour un **client existant/récurrent**
- Les coordonnées du contact (nom, email, téléphone) doivent être pré-remplies depuis le profil du client
- Pas besoin de tout re-saisir à chaque commande

### Recommandations professionnelles

#### Option 1 : Pré-remplissage depuis profil utilisateur (limité)

**Pour** : OrderFormUnified (sélection publique uniquement)

**Principe** :
- Si l'utilisateur public a déjà passé commande (cookie/session)
- Stocker temporairement : `{ lastName: string, firstName: string, email: string, phone: string }`
- Au prochain retour, pré-remplir ces champs avec option "C'est toujours moi ?"

**Implémentation** :
```typescript
// LocalStorage key
const REQUESTER_CACHE_KEY = 'linkme_requester_cache';

interface RequesterCache {
  name: string;
  email: string;
  phone: string;
  expiresAt: number; // 30 jours
}

// Au chargement du formulaire
useEffect(() => {
  const cached = localStorage.getItem(REQUESTER_CACHE_KEY);
  if (cached) {
    const data: RequesterCache = JSON.parse(cached);
    if (Date.now() < data.expiresAt) {
      // Pré-remplir avec option de modifier
      setData(prev => ({
        ...prev,
        owner: {
          ...prev.owner,
          name: data.name,
          email: data.email,
          phone: data.phone,
        }
      }));
    }
  }
}, []);

// Après soumission réussie
const saveRequesterCache = (name: string, email: string, phone: string) => {
  const cache: RequesterCache = {
    name,
    email,
    phone,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 jours
  };
  localStorage.setItem(REQUESTER_CACHE_KEY, JSON.stringify(cache));
};
```

**Avantages** :
- ✅ Simple à implémenter
- ✅ Améliore UX pour clients récurrents
- ✅ Pas de compte requis
- ✅ RGPD-friendly (local, pas de tracking)

**Inconvénients** :
- ❌ Limité au même navigateur
- ❌ Effacé si cookies supprimés
- ❌ Ne résout pas le problème de l'utilisateur authentifié

#### Option 2 : Pré-remplissage depuis clients existants (PRO)

**Pour** : CreateOrderModal (utilisateur authentifié) ET OrderFormUnified

**Principe** :
- Quand l'affilié sélectionne un **restaurant existant**
- Charger automatiquement les contacts déjà enregistrés pour ce restaurant
- Pré-remplir les champs avec ces données
- Permettre modification si besoin

**Implémentation** :
```typescript
// Hook pour charger les contacts d'une organisation
function useOrganisationContacts(organisationId: string | null) {
  return useQuery({
    queryKey: ['organisation-contacts', organisationId],
    queryFn: async () => {
      if (!organisationId) return null;

      const supabase = createClient();
      const { data, error } = await supabase
        .from('organisation_contacts')
        .select('*')
        .eq('organisation_id', organisationId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!organisationId,
  });
}

// Dans le composant
const { data: contacts } = useOrganisationContacts(selectedCustomerId);

useEffect(() => {
  if (contacts && contacts.length > 0) {
    const primaryContact = contacts.find(c => c.is_primary) || contacts[0];

    // Pré-remplir automatiquement
    setData(prev => ({
      ...prev,
      owner: {
        ...prev.owner,
        name: `${primaryContact.first_name} ${primaryContact.last_name}`,
        email: primaryContact.email,
        phone: primaryContact.phone,
      }
    }));
  }
}, [contacts, selectedCustomerId]);
```

**Avantages** :
- ✅ ✅ ✅ Solution professionnelle
- ✅ Pas de re-saisie pour clients récurrents
- ✅ Données toujours à jour (DB)
- ✅ Fonctionne pour affiliés authentifiés
- ✅ Applicable aux deux formulaires

**Inconvénients** :
- ⚠️ Requiert que les contacts soient bien maintenus en DB
- ⚠️ Besoin d'interface pour mettre à jour contacts

#### Option 3 : Unification complète avec OrderFormUnified (BEST)

**Principe** :
- Remplacer CreateOrderModal par OrderFormUnified partout
- Ajouter prop `authenticatedUser` pour pré-remplissage
- Un seul composant, deux modes d'utilisation

**Implémentation** :
```typescript
interface OrderFormUnifiedProps {
  // ... props existantes

  // NOUVEAU - Utilisateur authentifié (optionnel)
  authenticatedUser?: {
    name: string;
    email: string;
    phone: string;
  } | null;

  // NOUVEAU - Mode de fonctionnement
  mode: 'public' | 'authenticated';
}

// Dans le composant
useEffect(() => {
  if (mode === 'authenticated' && authenticatedUser) {
    // Pré-remplir avec les données de l'affilié
    setData(prev => ({
      ...prev,
      owner: {
        ...prev.owner,
        contactSameAsRequester: false, // Par défaut
        // PAS de pré-remplissage ici, l'utilisateur entre les données du CLIENT
      }
    }));
  }
}, [mode, authenticatedUser]);

// Mais quand on sélectionne un client existant
useEffect(() => {
  if (selectedCustomer && customerContacts) {
    const primary = customerContacts.find(c => c.is_primary);
    if (primary) {
      setData(prev => ({
        ...prev,
        owner: {
          ...prev.owner,
          name: primary.name,
          email: primary.email,
          phone: primary.phone,
        },
        billing: {
          ...prev.billing,
          contactSource: 'owner', // Par défaut, reprendre le contact propriétaire
          name: primary.name,
          email: primary.email,
          phone: primary.phone,
        }
      }));
    }
  }
}, [selectedCustomer, customerContacts]);
```

**Avantages** :
- ✅ ✅ ✅ ✅ Un seul composant à maintenir
- ✅ ✅ ✅ Logique identique partout
- ✅ ✅ Pré-remplissage intelligent
- ✅ ✅ DRY (Don't Repeat Yourself)
- ✅ Tests plus faciles

**Inconvénients** :
- ⚠️ Refactoring important
- ⚠️ Risque de régression si mal fait

### Proposition finale : Approche hybride (Quick Win + Long Term)

#### Phase 1 - Quick Win (2-3h) : Pré-remplissage contacts existants

**Objectif** : Résoudre le problème immédiat sans refactoring majeur

**Actions** :
1. Créer hook `useOrganisationContacts(organisationId)`
2. Dans CreateOrderModal, quand l'utilisateur sélectionne un client existant :
   - Charger automatiquement les contacts
   - Pré-remplir les champs `ownerFirstName`, `ownerLastName`, `ownerEmail`, `ownerPhone`
   - Afficher badge "Données pré-remplies depuis le profil client" (modifiables)
3. Même logique dans OrderFormUnified pour organisations existantes

**Résultat** :
- ✅ Plus besoin de re-saisir les coordonnées des clients récurrents
- ✅ Fonctionne dans les deux formulaires
- ✅ Pas de changement architectural

#### Phase 2 - Long Term (1-2 jours) : Unification complète

**Objectif** : Éliminer la duplication, un seul composant

**Actions** :
1. Migrer CreateOrderModal vers OrderFormUnified
2. Ajouter prop `mode: 'public' | 'authenticated'`
3. Adapter l'UI selon le mode
4. Tests complets
5. Déprécier CreateOrderModal

**Résultat** :
- ✅ Un seul composant à maintenir
- ✅ Logique unifiée
- ✅ Plus facile à faire évoluer

### Analyse technique approfondie

#### Tables DB concernées

1. **`auth.users`** : Utilisateurs (affiliés)
   - Champs : `id`, `email`
   - Pas de téléphone ni nom stockés ici

2. **`user_profiles`** : Profils utilisateurs étendus
   - Champs : `user_id`, `first_name`, `last_name`, `phone`
   - **❓ À VÉRIFIER** : Existe-t-elle ? Utilisée ?

3. **`organisations`** : Restaurants clients
   - Champs : `id`, `legal_name`, `trade_name`, `city`, `shipping_address_line1`, `ownership_type`, etc.
   - Contact principal stocké où ?

4. **`organisation_contacts`** : Contacts des organisations
   - Champs : `id`, `organisation_id`, `first_name`, `last_name`, `email`, `phone`, `is_primary`, `is_billing`
   - **✅ TABLE CLÉ** pour pré-remplissage

5. **`linkme_orders`** : Commandes
   - Champs : `id`, `affiliate_id`, `organisation_id`, `status`, `total_ht`, `total_ttc`, etc.
   - Lien vers organisation cliente

#### Hooks existants à utiliser

1. **`useUserAffiliate()`** : Récupère l'affilié connecté
   - Retourne : `{ id, enseigne_id, user_id }`
   - Utilisé dans CreateOrderModal

2. **`useAffiliateCustomers(affiliateId)`** : Liste des clients de l'affilié
   - Retourne : Liste des organisations
   - Utilisé dans CreateOrderModal

3. **`useOrganisationContacts(organisationId)`** : ❌ N'EXISTE PAS
   - **À CRÉER** : Hook pour charger les contacts d'une organisation
   - Fichier : `apps/linkme/src/lib/hooks/use-organisation-contacts.ts`

4. **`useUpdateOrganisationContacts()`** : ✅ EXISTE
   - Fichier : `apps/linkme/src/lib/hooks/use-organisation-contacts.ts`
   - Permet de mettre à jour les contacts

#### Composants concernés

1. **`CreateOrderModal`** (apps/linkme/src/app/(main)/commandes/components/)
   - ~25000 tokens
   - Workflow complexe avec stepper
   - Utilise `ContactsSection` pour gérer contacts

2. **`OrderFormUnified`** (apps/linkme/src/components/)
   - Formulaire unifié pour public
   - Plus simple, plus moderne
   - Pas de gestion contacts avancée

3. **`ContactsSection`** (apps/linkme/src/components/)
   - Composant réutilisable pour gérer contacts
   - Utilisé dans CreateOrderModal
   - À analyser en détail

#### Flux de données actuel

```
┌─────────────────────────────────────────────────────────────┐
│ UTILISATEUR AUTHENTIFIÉ (Affilié Pokawa)                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ /commandes → CreateOrderModal                                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Question: "Restaurant existant ou nouveau ?"                 │
└─────────────────────────────────────────────────────────────┘
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│ EXISTANT         │              │ NOUVEAU          │
│ (Brouillon)      │              │ (Approbation)    │
└──────────────────┘              └──────────────────┘
         │                                  │
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│ 1. Sélection     │              │ Stepper 5 étapes │
│    client        │              │                  │
│ (dropdown)       │              │ 1. Livraison     │
│                  │              │ 2. Propriétaire  │
│ ❌ PAS de        │              │ 3. Facturation   │
│    pré-remplir   │              │ 4. Produits      │
│    contacts      │              │ 5. Validation    │
│                  │              │                  │
│ 2. ContactsSection│             │ ❌ Tout manuel   │
│    (MANUEL)      │              │                  │
│                  │              │                  │
│ 3. Produits      │              │                  │
│                  │              │                  │
│ 4. Soumission    │              │                  │
└──────────────────┘              └──────────────────┘
         │                                  │
         └────────────────┬─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ linkme_orders                                                │
│ + organisation_contacts (si nouveau restaurant)              │
└─────────────────────────────────────────────────────────────┘
```

#### Flux de données proposé (avec pré-remplissage)

```
┌─────────────────────────────────────────────────────────────┐
│ UTILISATEUR AUTHENTIFIÉ (Affilié Pokawa)                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ /commandes → CreateOrderModal (ou OrderFormUnified)         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ Question: "Restaurant existant ou nouveau ?"                 │
└─────────────────────────────────────────────────────────────┘
         ┌────────────────┴────────────────┐
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│ EXISTANT         │              │ NOUVEAU          │
│ (Brouillon)      │              │ (Approbation)    │
└──────────────────┘              └──────────────────┘
         │                                  │
         │                                  │
         ▼                                  ▼
┌──────────────────┐              ┌──────────────────┐
│ 1. Sélection     │              │ Stepper          │
│    client        │              │                  │
│ (dropdown)       │              │ Tout manuel      │
│                  │              │ (normal)         │
│ 2. ✅ AUTO-LOAD  │              │                  │
│    contacts      │              │                  │
│    depuis DB     │              │                  │
│                  │              │                  │
│ 3. ✅ PRÉ-REMPLIR│              │                  │
│    formulaire    │              │                  │
│    avec données  │              │                  │
│    contact       │              │                  │
│    principal     │              │                  │
│                  │              │                  │
│ 4. Badge:        │              │                  │
│    "Pré-rempli"  │              │                  │
│    (modifiable)  │              │                  │
│                  │              │                  │
│ 5. Produits      │              │                  │
│                  │              │                  │
│ 6. Soumission    │              │                  │
└──────────────────┘              └──────────────────┘
         │                                  │
         └────────────────┬─────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ linkme_orders                                                │
│ + organisation_contacts (mis à jour si modifié)              │
└─────────────────────────────────────────────────────────────┘
```

---

## Plan d'implémentation - LM-ORD-004

**Recommandation** : Phase 1 (Quick Win) - Pré-remplissage contacts clients existants

### Phase 1 : Créer le hook useOrganisationContacts

- [ ] **LM-ORD-004-1** : Créer hook useOrganisationContacts
  - Fichier : `apps/linkme/src/lib/hooks/use-organisation-contacts.ts` (vérifier s'il existe déjà)
  - Si existe déjà : vérifier qu'il a une fonction de lecture
  - Sinon, créer :
    ```typescript
    export function useOrganisationContacts(organisationId: string | null) {
      return useQuery({
        queryKey: ['organisation-contacts', organisationId],
        queryFn: async () => {
          if (!organisationId) return null;

          const supabase = createClient();
          const { data, error } = await supabase
            .from('organisation_contacts')
            .select('id, first_name, last_name, email, phone, is_primary, is_billing, role')
            .eq('organisation_id', organisationId)
            .order('is_primary', { ascending: false });

          if (error) throw error;
          return data;
        },
        enabled: !!organisationId,
      });
    }
    ```

### Phase 2 : Modifier CreateOrderModal (restaurant existant)

- [ ] **LM-ORD-004-2** : Importer et utiliser le hook
  - Fichier : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
  - Ligne : ~165-180 (section HOOKS)
  - Ajouter :
    ```typescript
    const { data: selectedCustomerContacts } = useOrganisationContacts(
      selectedCustomerId && selectedCustomerType === 'organization' ? selectedCustomerId : null
    );
    ```

- [ ] **LM-ORD-004-3** : Pré-remplir les champs du stepper (nouveau restaurant)
  - Fichier : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
  - Chercher où `selectedCustomerId` change
  - Ajouter `useEffect` :
    ```typescript
    // Pré-remplir les données du propriétaire quand un client est sélectionné
    useEffect(() => {
      if (selectedCustomerContacts && selectedCustomerContacts.length > 0) {
        const primaryContact = selectedCustomerContacts.find(c => c.is_primary) || selectedCustomerContacts[0];

        setNewRestaurantForm(prev => ({
          ...prev,
          ownerFirstName: primaryContact.first_name || '',
          ownerLastName: primaryContact.last_name || '',
          ownerEmail: primaryContact.email || '',
          ownerPhone: primaryContact.phone || '',
        }));
      }
    }, [selectedCustomerContacts]);
    ```

- [ ] **LM-ORD-004-4** : Afficher badge "Données pré-remplies"
  - Fichier : `apps/linkme/src/app/(main)/commandes/components/CreateOrderModal.tsx`
  - Dans le formulaire propriétaire (étape 2)
  - Ajouter au-dessus des champs :
    ```tsx
    {selectedCustomerContacts && selectedCustomerContacts.length > 0 && (
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <p className="text-sm text-blue-700">
          Données pré-remplies depuis le profil client (modifiables)
        </p>
      </div>
    )}
    ```

### Phase 3 : Modifier OrderFormUnified (sélection publique)

- [ ] **LM-ORD-004-5** : Importer et utiliser le hook
  - Fichier : `apps/linkme/src/components/OrderFormUnified.tsx`
  - Ligne : ~176-187 (section HOOKS)
  - Ajouter :
    ```typescript
    const { data: organisationContacts } = useOrganisationContacts(
      data.existingOrganisationId
    );
    ```

- [ ] **LM-ORD-004-6** : Pré-remplir quand organisation existante sélectionnée
  - Fichier : `apps/linkme/src/components/OrderFormUnified.tsx`
  - Ajouter `useEffect` :
    ```typescript
    useEffect(() => {
      if (data.existingOrganisationId && organisationContacts && organisationContacts.length > 0) {
        const primary = organisationContacts.find(c => c.is_primary) || organisationContacts[0];

        setData(prev => ({
          ...prev,
          owner: {
            ...prev.owner,
            name: `${primary.first_name} ${primary.last_name}`,
            email: primary.email || '',
            phone: primary.phone || '',
          },
          billing: {
            ...prev.billing,
            contactSource: 'owner',
            name: `${primary.first_name} ${primary.last_name}`,
            email: primary.email || '',
            phone: primary.phone || '',
          }
        }));
      }
    }, [data.existingOrganisationId, organisationContacts]);
    ```

### Phase 4 : LocalStorage pour utilisateurs publics (optionnel)

- [ ] **LM-ORD-004-7** : Ajouter cache localStorage dans OrderFormUnified
  - Fichier : `apps/linkme/src/components/OrderFormUnified.tsx`
  - Constante : `const REQUESTER_CACHE_KEY = 'linkme_requester_cache';`
  - Créer interface :
    ```typescript
    interface RequesterCache {
      name: string;
      email: string;
      phone: string;
      expiresAt: number;
    }
    ```
  - Au montage, charger depuis localStorage (si pas d'organisation existante)
  - Après soumission réussie, sauvegarder dans localStorage

### Phase 5 : Tests

- [ ] **LM-ORD-004-8** : Tester CreateOrderModal (utilisateur authentifié)
  - Se connecter avec Pokawa
  - Aller sur `/commandes`
  - Cliquer "Nouvelle vente"
  - Sélectionner "Restaurant existant"
  - Choisir un client dans la liste
  - **Vérifier** : Les champs du contact sont pré-remplis automatiquement
  - **Vérifier** : Badge "Données pré-remplies" affiché
  - **Vérifier** : Les données sont modifiables
  - Soumettre la commande
  - **Vérifier** : Commande créée avec succès

- [ ] **LM-ORD-004-9** : Tester OrderFormUnified (sélection publique)
  - Aller sur sélection Pokawa publique
  - Ajouter produits au panier
  - Ouvrir formulaire commande
  - Sélectionner "Restaurant existant"
  - Choisir organisation dans liste
  - **Vérifier** : Les champs sont pré-remplis
  - Soumettre commande
  - **Vérifier** : Commande créée

- [ ] **LM-ORD-004-10** : Tester cache localStorage
  - En navigation privée, aller sur sélection publique
  - Passer commande pour nouveau restaurant
  - Noter nom, email, téléphone saisis
  - Recharger la page
  - Ajouter produits et ouvrir formulaire
  - **Vérifier** : Les données sont pré-remplies depuis localStorage
  - Effacer cookies et recharger
  - **Vérifier** : Plus de pré-remplissage

### Notes techniques

**Table `organisation_contacts`** :
- Champs : `id`, `organisation_id`, `first_name`, `last_name`, `email`, `phone`, `is_primary`, `is_billing`, `role`
- Clé : `is_primary = true` indique le contact principal
- Un restaurant peut avoir plusieurs contacts

**Stratégie de pré-remplissage** :
1. Priorité au contact `is_primary = true`
2. Sinon, prendre le premier contact de la liste
3. Si pas de contacts, laisser vide (formulaire vierge)

**Comportement souhaité** :
- Pré-remplissage = suggestion intelligente, PAS blocage
- Utilisateur peut toujours modifier les valeurs
- Badge visible pour indiquer que c'est pré-rempli
- Si l'utilisateur modifie → mettre à jour les contacts en DB (optionnel)

**Différence CreateOrderModal vs OrderFormUnified** :
- CreateOrderModal : Champs séparés (firstName, lastName)
- OrderFormUnified : Champ unique (name = "Prénom Nom")
- Adapter le formatage selon le composant

**Risques** :
- ⚠️ Si contacts DB obsolètes → données incorrectes
- ⚠️ Si plusieurs contacts → lequel choisir ?
- ⚠️ Performance si beaucoup de requêtes

**Mitigation** :
- Permettre toujours la modification
- Afficher clairement la source des données
- Cache React Query pour éviter requêtes multiples

---

## Observations READ1 - LM-ORG-003 (2026-01-14)

**Demande utilisateur** : Améliorer le design du popup qui s'affiche quand on clique sur un marqueur de la carte dans `/organisations` (onglet Vue Carte).

**URL testée** : `http://localhost:3002/organisations?tab=map` (serveur dev en erreur, lecture code uniquement)

**Fichiers analysés** :
- `apps/linkme/src/app/(main)/organisations/page.tsx` (654 lignes)
- `apps/linkme/src/components/shared/MapLibreMapView.tsx` (430 lignes)

### État actuel du popup (MapLibreMapView.tsx L381-423)

**Composant** : `<Popup>` de react-map-gl/maplibre

**Contenu actuel** (très basique) :
```tsx
<div className="min-w-[180px] p-1">
  <p className="font-semibold text-gray-900">{selectedOrg.trade_name || selectedOrg.legal_name}</p>
  {selectedOrg.city && <p className="text-gray-500 text-sm">{selectedOrg.city}</p>}
  <p className="text-xs mt-2">
    <span className={`inline-block px-2 py-0.5 rounded-full text-white ${isPropre ? 'bg-blue-500' : 'bg-orange-500'}`}>
      {isPropre ? 'Restaurant propre' : 'Franchise'}
    </span>
  </p>
  <button onClick={() => onViewDetails(selectedOrg.id)}
    className="mt-3 w-full px-3 py-1.5 text-sm font-medium text-white bg-[#5DBEBB] rounded-lg hover:bg-[#4DAEAB] transition-colors">
    Voir les détails
  </button>
</div>
```

### Problèmes identifiés

1. **Pas de logo** : Aucun logo de l'enseigne affiché
2. **Bouton fermeture laid** : Croix par défaut de MapLibre (pas stylée)
3. **Design minimaliste** : Trop simple, "à pleurer" selon utilisateur
4. **Informations incomplètes** : Pas l'adresse complète, juste la ville
5. **Hiérarchie visuelle faible** : Tout au même niveau

### Demandes utilisateur

**Popup amélioré doit contenir** :
- ✅ Petit logo (enseigne ou icône générique)
- ✅ Nom du restaurant
- ✅ Adresse complète (pas juste ville)
- ✅ Bouton de fermeture (croix) bien designé
- ✅ Design moderne et synthétisé

**Comportement** :
- Clic sur marqueur → ouvre popup compact
- Clic sur popup (ou bouton) → ouvre modal complet avec détails

### Données disponibles (interface Organisation)

```typescript
interface Organisation {
  id: string;
  trade_name: string | null;
  legal_name: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ownership_type?: 'propre' | 'franchise' | 'succursale' | null;
}
```

**Données manquantes dans le popup** :
- Adresse complète (street, postal_code)
- Logo de l'enseigne

**Note** : Le composant reçoit des organisations via `useEnseigneOrganisations` qui peut contenir plus de champs que l'interface minimale.

### Interface complète disponible (EnseigneOrganisation)

```typescript
export interface EnseigneOrganisation {
  id: string;
  legal_name: string;
  trade_name: string | null;
  city: string | null;
  postal_code: string | null;
  shipping_address_line1: string | null;  // ✅ Adresse dispo
  shipping_city: string | null;
  shipping_postal_code: string | null;
  logo_url: string | null;  // ✅ Logo dispo
  ownership_type: OrganisationOwnershipType | null;
  latitude: number | null;
  longitude: number | null;
}
```

**Toutes les données nécessaires sont déjà chargées !**

---

## Plan d'implémentation - LM-ORG-003

**Objectif** : Améliorer le design du popup de carte (petit, synthétisé, beau)

### Phase 1 : Enrichir l'interface Organisation dans MapLibreMapView

- [ ] **LM-ORG-003-1** : Étendre interface Organisation
  - Fichier : `apps/linkme/src/components/shared/MapLibreMapView.tsx`
  - Ligne : 30-38
  - Ajouter champs manquants :
    ```typescript
    interface Organisation {
      id: string;
      trade_name: string | null;
      legal_name: string;
      city: string | null;
      postal_code: string | null;  // NOUVEAU
      shipping_address_line1: string | null;  // NOUVEAU
      shipping_city: string | null;  // NOUVEAU
      shipping_postal_code: string | null;  // NOUVEAU
      logo_url: string | null;  // NOUVEAU
      latitude: number | null;
      longitude: number | null;
      ownership_type?: 'propre' | 'franchise' | 'succursale' | null;
    }
    ```

### Phase 2 : Redesigner le popup

- [ ] **LM-ORG-003-2** : Créer composant MapPopupCard
  - Fichier : `apps/linkme/src/components/shared/MapPopupCard.tsx` (NOUVEAU)
  - Props :
    ```typescript
    interface MapPopupCardProps {
      organisation: {
        id: string;
        logo_url: string | null;
        trade_name: string | null;
        legal_name: string;
        shipping_address_line1: string | null;
        shipping_postal_code: string | null;
        shipping_city: string | null;
        ownership_type?: 'propre' | 'franchise' | 'succursale' | null;
      };
      onViewDetails: (id: string) => void;
      onClose: () => void;
    }
    ```
  - **Design moderne** :
    - Header avec logo (rond, 40x40px) + nom
    - Adresse complète (icône MapPin + texte gris)
    - Badge type (Propre/Franchise) - discret
    - Bouton "Voir plus" stylé (pas tout le width, icône Arrow)
    - Bouton fermeture (X) en haut à droite - bien visible, hover effect
    - Padding généreux : p-4
    - Border shadow subtile
    - Max-width: 280px

- [ ] **LM-ORG-003-3** : Design détaillé du popup
  - **Structure** :
    ```
    ┌─────────────────────────────┐
    │ [Logo] Nom Restaurant    [X]│  ← Header avec logo + close button
    │ ─────────────────────────── │
    │ 📍 123 Rue Example          │  ← Adresse ligne 1
    │    75001 Paris              │  ← Code postal + ville
    │                             │
    │ [Badge: Propre/Franchise]   │  ← Badge discret
    │                             │
    │         [Voir plus →]       │  ← Bouton centré, pas full width
    └─────────────────────────────┘
    ```
  - **Couleurs** :
    - Background : bg-white
    - Logo fallback : bg-gray-100 avec icône Building2
    - Texte nom : text-gray-900 font-semibold
    - Texte adresse : text-gray-600 text-sm
    - Bouton "Voir plus" : bg-linkme-turquoise hover:bg-linkme-turquoise/90
    - Bouton close : text-gray-400 hover:text-gray-600
  - **Espacements** :
    - Padding général : p-4
    - Gap entre sections : space-y-3
    - Logo size : h-10 w-10 rounded-full
    - Close button : absolute top-2 right-2

- [ ] **LM-ORG-003-4** : Intégrer MapPopupCard dans MapLibreMapView
  - Fichier : `apps/linkme/src/components/shared/MapLibreMapView.tsx`
  - Lignes : 381-423 (remplacer le contenu du Popup)
  - Importer MapPopupCard
  - Passer les props complètes
  - Gérer closeButton={false} sur Popup (on gère notre propre bouton X)

### Phase 3 : Gestion du logo

- [ ] **LM-ORG-003-5** : Fallback logo intelligent
  - Si `logo_url` existe → afficher `<img src={logo_url} />`
  - Si null → afficher icône `<Building2>` dans un cercle gris
  - Classes : `h-10 w-10 rounded-full object-cover`
  - Container fallback : `bg-gray-100 flex items-center justify-center`

### Phase 4 : Formattage adresse

- [ ] **LM-ORG-003-6** : Fonction utilitaire formatAddress
  - Fichier : `apps/linkme/src/components/shared/MapPopupCard.tsx`
  - Logique :
    ```typescript
    function formatAddress(org: Organisation): { line1: string | null, line2: string | null } {
      const line1 = org.shipping_address_line1;
      const line2 = org.shipping_postal_code && org.shipping_city
        ? `${org.shipping_postal_code} ${org.shipping_city}`
        : org.shipping_city || org.city || null;
      return { line1, line2 };
    }
    ```
  - Afficher sur 2 lignes si line1 existe
  - Sinon juste line2

### Phase 5 : Tests

- [ ] **LM-ORG-003-7** : Tester le popup
  - Aller sur `/organisations?tab=map`
  - Cliquer sur un marqueur
  - Vérifier :
    - Logo s'affiche (ou fallback Building2)
    - Nom du restaurant
    - Adresse sur 2 lignes
    - Badge discret
    - Bouton "Voir plus" centré
    - Bouton X fonctionnel et bien visible
    - Design moderne, pas "à pleurer" ✅

- [ ] **LM-ORG-003-8** : Tester responsive
  - Mobile : popup doit rester lisible (max-width adaptive)
  - Logo pas trop gros
  - Texte pas trop petit

### Notes techniques

**Composant Popup de MapLibre** :
- `closeButton={false}` pour gérer notre propre bouton X
- `closeOnClick={false}` déjà présent
- `anchor="bottom"` déjà correct
- `offset={35}` peut être ajusté si besoin

**Icônes à utiliser** :
- Logo fallback : `Building2` de lucide-react
- Adresse : `MapPin` de lucide-react
- Bouton voir plus : `ArrowRight` de lucide-react
- Close button : `X` de lucide-react

**Hiérarchie visuelle** :
1. Logo + Nom (plus gros, bold)
2. Adresse (moyen, gris)
3. Badge (petit, coloré mais discret)
4. Bouton action (centré, turquoise)

**Différence avec modal** :
- Popup = rapide, synthétique, juste les infos clés
- Modal (après clic "Voir plus") = complet avec tous les détails

---

## Plan d'implémentation - LM-SEL-003

**Demandes utilisateur consolidées** :
1. ✅ Réduire pagination : 16 → 12 produits/page (3 lignes au lieu de 4)
2. ✅ Bouton "Ajouter" plus petit
3. ✅ Barre de catégorisation identique au catalogue LinkMe (catégories + sous-catégories)

**✅ PLAN FINALISÉ basé sur observation du catalogue réel** (`http://localhost:3002/catalogue`)

**Structure catalogue observée** :
- CategoryBar : Boutons arrondis turquoise "Tous 33 | Éclairage 9 | Linge de maison 6 | Mobilier 3 | Objets décoratifs 6" + "Filtrer"
- CategoryDropdown : "Toutes les catégories" (dropdown multi-niveau)
- Barre recherche : "Rechercher un produit..."
- Compteur : "33 produits trouvés"
- Grille 4 colonnes avec badges

**Fichier principal** : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
**Fichiers référence** :
- `apps/linkme/src/app/(main)/catalogue/components/CategoryBar.tsx` (125 lignes)
- `apps/linkme/src/app/(main)/catalogue/components/CategoryDropdown.tsx` (271 lignes)

### Phase 1 : Corrections rapides (pagination + bouton)

- [ ] **LM-SEL-003-1** : Réduire pagination à 12 produits/page
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Chercher : Constante de pagination (probablement `PRODUCTS_PER_PAGE`)
  - Modifier : `16` → `12`
  - Résultat : 3 pages (12 + 12 + 7 produits) au lieu de 2

- [ ] **LM-SEL-003-2** : Réduire taille bouton "Ajouter"
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Localiser : Bouton "Ajouter" dans la grille produits (ligne ~567-574)
  - Modifier classes : `py-2 px-4` → `py-1.5 px-3`, `text-base` → `text-sm`
  - Vérifier l'icône `Plus` reste bien dimensionnée (`h-4 w-4`)

### Phase 2 : Enrichir les données (RPC)

- [ ] **LM-SEL-003-3** : Modifier RPC `get_public_selection`
  - Fichier : `supabase/migrations/` (trouver la RPC)
  - Ajouter jointures :
    - `linkme_selection_items` → `products` (déjà fait)
    - `products` → `product_categories_arborescence`
  - Retourner dans items :
    - `category_id` (si pas déjà présent)
    - `category_name` (enrichi depuis arborescence)
    - `subcategory_id`
    - `subcategory_name`
  - **Note** : Le champ `category` actuel est un simple string, il faut l'enrichir avec les données de l'arborescence

- [ ] **LM-SEL-003-4** : Mettre à jour interface ISelectionItem
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Interface actuelle (ligne 38-51) :
    ```typescript
    interface ISelectionItem {
      // ...existant
      category: string | null; // ← Renommer ou enrichir
      // Ajouter :
      category_id?: string | null;
      category_name?: string | null;
      subcategory_id?: string | null;
      subcategory_name?: string | null;
    }
    ```

### Phase 3 : Créer composants barre de catégorisation

- [ ] **LM-SEL-003-5** : Créer SelectionCategoryBar.tsx
  - Fichier : `apps/linkme/src/components/public-selection/SelectionCategoryBar.tsx`
  - Copier/adapter `apps/linkme/src/app/(main)/catalogue/components/CategoryBar.tsx`
  - Adaptations :
    - Props : `items: ISelectionItem[]` au lieu de `products: LinkMeCatalogProduct[]`
    - Extraire catégories depuis `item.category_name` (ou `item.category`)
    - **Branding** : Remplacer `linkme-turquoise` par `branding.primary_color` (passé en props)
    - Même UI : boutons arrondis (rounded-full), scrollable, compteurs
  - Props interface :
    ```typescript
    interface SelectionCategoryBarProps {
      items: ISelectionItem[];
      selectedCategory: string | undefined;
      onCategorySelect: (category: string | undefined) => void;
      branding: IBranding;
    }
    ```

- [ ] **LM-SEL-003-6** : Créer SelectionCategoryDropdown.tsx
  - Fichier : `apps/linkme/src/components/public-selection/SelectionCategoryDropdown.tsx`
  - Copier/adapter `apps/linkme/src/app/(main)/catalogue/components/CategoryDropdown.tsx`
  - Adaptations :
    - Props : `items: ISelectionItem[]`
    - Construire hiérarchie depuis `category_name`, `subcategory_id`, `subcategory_name`
    - Branding dynamique
  - Props interface :
    ```typescript
    interface SelectionCategoryDropdownProps {
      items: ISelectionItem[];
      selectedCategory: string | undefined;
      selectedSubcategory: string | undefined;
      onCategorySelect: (category: string | undefined) => void;
      onSubcategorySelect: (subcategoryId: string | undefined) => void;
      branding: IBranding;
    }
    ```

- [ ] **LM-SEL-003-7** : Exporter les composants
  - Fichier : `apps/linkme/src/components/public-selection/index.ts`
  - Ajouter :
    ```typescript
    export { SelectionCategoryBar } from './SelectionCategoryBar';
    export { SelectionCategoryDropdown } from './SelectionCategoryDropdown';
    ```

### Phase 4 : Intégrer dans la page

- [ ] **LM-SEL-003-8** : Ajouter states et imports
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Imports :
    ```typescript
    import { SelectionCategoryBar, SelectionCategoryDropdown } from '@/components/public-selection';
    ```
  - States (déjà `selectedCategory` existe ligne 145, ajouter) :
    ```typescript
    const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
    ```

- [ ] **LM-SEL-003-9** : Remplacer CategoryTabs par SelectionCategoryBar
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - **Supprimer** : `CategoryTabs` (ligne 408-416)
  - **Supprimer** : Import `CategoryTabs` (ligne 21)
  - **Insérer** `SelectionCategoryBar` **entre** `SelectionHero` (L396) et `ProductFilters` (L398) :
    ```tsx
    </SelectionHero>

    {/* Barre de catégorisation */}
    <SelectionCategoryBar
      items={items}
      selectedCategory={selectedCategory}
      onCategorySelect={setSelectedCategory}
      branding={branding}
    />

    <ProductFilters ... />
    ```

- [ ] **LM-SEL-003-10** : Ajouter SelectionCategoryDropdown dans section filtres
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - **Créer** une nouvelle section sticky (après SelectionCategoryBar, avant ProductFilters) :
    ```tsx
    {/* Barre filtres horizontale sticky */}
    <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3">
        {/* Dropdown catégorie/sous-catégorie */}
        <SelectionCategoryDropdown
          items={items}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          onCategorySelect={setSelectedCategory}
          onSubcategorySelect={setSelectedSubcategory}
          branding={branding}
        />

        {/* Barre de recherche existante (ProductFilters) */}
        <ProductFilters ... />
      </div>
    </div>
    ```
  - **Ou** intégrer dans ProductFilters si composant le permet

- [ ] **LM-SEL-003-11** : Mettre à jour logique de filtrage
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - `filteredItems` useMemo (ligne 209-235) :
    ```typescript
    const filteredItems = useMemo(() => {
      let filtered = items;

      // Filtre par recherche (existant)
      if (searchQuery.trim()) { ... }

      // Filtre par catégorie (existant - améliorer)
      if (selectedCategory) {
        filtered = filtered.filter(
          item => (item.category_name ?? item.category ?? 'Autres') === selectedCategory
        );
      }

      // Filtre par sous-catégorie (NOUVEAU)
      if (selectedSubcategory) {
        filtered = filtered.filter(
          item => item.subcategory_id === selectedSubcategory
        );
      }

      return filtered;
    }, [items, searchQuery, selectedCategory, selectedSubcategory]);
    ```
  - Reset de `currentPage` à 1 quand filtres changent (déjà géré dans `useEffect`)

- [ ] **LM-SEL-003-12** : Supprimer ancien code CategoryTabs
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Supprimer `categories` useMemo (ligne 186-206) qui extrait les catégories basiques
  - Nettoyer imports inutilisés

### Phase 5 : Tests

- [ ] **LM-SEL-003-13** : Tester pagination
  - Page 1 : 12 produits (3 lignes × 4 colonnes)
  - Page 2 : 12 produits
  - Page 3 : 7 produits
  - Navigation : Précédent | 1 | 2 | 3 | Suivant
  - Reset page 1 quand filtre change

- [ ] **LM-SEL-003-14** : Tester bouton "Ajouter"
  - Taille réduite (pas trop imposant)
  - Toujours lisible et cliquable
  - Icône Plus bien dimensionnée

- [ ] **LM-SEL-003-15** : Tester barre de catégorisation
  - SelectionCategoryBar affiche les catégories des 31 produits Pokawa
  - Bouton "Tous" fonctionne
  - Clic sur une catégorie → filtre les produits
  - Compteurs corrects
  - Style cohérent avec le branding de la sélection

- [ ] **LM-SEL-003-16** : Tester dropdown sous-catégories
  - Dropdown s'ouvre et affiche la hiérarchie
  - Sélection d'une sous-catégorie → affine le filtre
  - Compteurs corrects à chaque niveau
  - Bouton "Toutes les catégories" reset les filtres

- [ ] **LM-SEL-003-17** : Vérifier responsive
  - Barre de catégories scrollable horizontal sur mobile
  - Dropdown accessible
  - Grille produits s'adapte (déjà responsive)

### Notes importantes

**✅ VALIDATION VISUELLE CATALOGUE** :
- Screenshot : `catalogue-pokawa-loaded.png`
- URL testée : `http://localhost:3002/catalogue` avec user Pokawa (Admin Enseigne)
- Catégories observées : "Tous 33", "Éclairage 9", "Linge de maison 6", "Mobilier 3", "Objets décoratifs 6"
- Composants confirmés : CategoryBar (boutons rounded-full turquoise) + CategoryDropdown + SearchBar

**Arborescence DB** :
- Produits → liés à **sous-catégorie** (table `product_categories_arborescence`)
- Arborescence : **Famille** → **Catégorie** → **Sous-catégorie**
- **Ne pas afficher les familles**, seulement catégories + sous-catégories

**Données dynamiques** :
- La barre affiche **uniquement** les catégories/sous-catégories **présentes dans la sélection**
- Ex : Sélection Pokawa (31 produits) → afficher LEURS catégories, pas toutes les catégories de la DB
- Autre sélection → autre menu

**Branding** :
- Utiliser `branding.primary_color` au lieu de `linkme-turquoise` codé en dur
- Permet à chaque sélection d'avoir son propre thème
- Exemple catalogue : turquoise (#0D9488) pour LinkMe interne

**Position dans le layout** :
```
SelectionHeader (sticky top)
SelectionHero (hero image avec bannière)
→ SelectionCategoryBar (NOUVEAU - scrolle avec page)
→ [Barre filtres sticky : CategoryDropdown + SearchBar]
[Supprimé: CategoryTabs "Tous/Autres"]
Produits (grid paginée - 12 par page)
Pagination (Précédent | 1 | 2 | 3 | Suivant)
```

**Compatibilité avec tabs (LM-SEL-001)** :
- Barre de catégorisation visible **uniquement dans tab Catalogue**
- Pas dans tabs FAQ/Contact

**Classes CSS clés à réutiliser** (depuis CategoryBar.tsx) :
- Bouton actif : `bg-linkme-turquoise text-white shadow-sm rounded-full`
- Bouton inactif : `bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full`
- Container scrollable : `overflow-x-auto scrollbar-hide`
- Badge compteur actif : `bg-white/20 text-white`
- Badge compteur inactif : `bg-white text-gray-500`

---

## Observations READ1 - LM-SEL-001 (2026-01-13)

**URL testée**: `http://localhost:3002/s/collection-mobilier-pokawa`
**Utilisateur**: Pokawa (Collection Mobilier Pokawa - 31 produits)

### Problèmes identifiés

#### 1. Absence de pagination sur les produits
**État actuel**:
- Tous les 31 produits affichés en une seule page
- Scroll continu du début à la fin
- Pas de contrôles de pagination visibles

**Attendu**:
- Pagination avec **4 lignes maximum** par page
- Contrôles de navigation entre les pages

#### 2. Section FAQ affichée dans la page Catalogue
**État actuel**:
- Section "Questions fréquentes" affichée directement après les 31 produits
- Contient les questions : "Comment passer une commande ?", "Quels sont les délais de livraison ?", etc.
- Sidebar "Une question ?" visible

**Attendu**:
- FAQ doit être dans une **page FAQ séparée** accessible via l'onglet "FAQ" du header
- Page Catalogue ne doit contenir **que les produits**

#### 3. Formulaire de contact affiché dans la page Catalogue
**État actuel**:
- Section "Nous contacter" (formulaire complet) affichée après le FAQ
- Formulaire avec : Prénom, Nom, Email, Entreprise, Fonction, Téléphone, Message, bouton "Envoyer le message"

**Attendu**:
- Formulaire de contact doit être dans une **page Contact séparée** accessible via l'onglet "Contact" du header
- Page Catalogue ne doit contenir **que les produits**

### Structure actuelle (incorrecte)
```
Page Catalogue (/s/collection-mobilier-pokawa):
├── Header (Catalogue, FAQ, Contact)
├── Bannière sélection
├── Onglets (Tous, Autres)
├── 31 produits (tous affichés)
├── Section FAQ (Questions fréquentes)
└── Section Contact (Formulaire "Nous contacter")
```

### Structure attendue (correcte)
```
Page Catalogue (/s/collection-mobilier-pokawa):
├── Header (Catalogue, FAQ, Contact)
├── Bannière sélection
├── Onglets (Tous, Autres)
├── Produits (4 lignes max)
└── Pagination

Page FAQ (/s/collection-mobilier-pokawa?tab=faq ou route dédiée):
├── Header
└── Section FAQ uniquement

Page Contact (/s/collection-mobilier-pokawa?tab=contact ou route dédiée):
├── Header
└── Formulaire de contact uniquement
```

### Screenshots disponibles
- `linkme-dashboard-view.png` - Dashboard LinkMe back-office
- `selection-pokawa-catalogue.png` - Vue Catalogue complète
- `selection-pokawa-bottom.png` - Formulaire de contact dans Catalogue
- `selection-pokawa-faq-check.png` - Section FAQ dans Catalogue

---

## Plan d'implémentation - LM-SEL-001

### Architecture actuelle identifiée
**Fichier principal** : `apps/linkme/src/app/(public)/s/[id]/page.tsx` (754 lignes)

**Structure actuelle** :
- Page unique avec 4 sections : Catalogue (L419-606), Points de vente (L609-617), FAQ (L619-630), Contact (L632-639)
- Navigation par smooth scroll avec refs (catalogueRef, faqRef, contactRef, storesRef)
- Tous les produits affichés en une fois (L447-580, grid 4 colonnes)
- État `activeSection` (L142) pour highlighting du menu

**Composants disponibles** :
- `SelectionHeader.tsx` - Header avec navigation
- `FAQSection.tsx` - Section FAQ
- `ContactForm.tsx` - Formulaire de contact
- Autres : SelectionHero, CategoryTabs, ProductFilters, StoreLocatorMap

### Checklist d'implémentation

#### Phase 1 : Pagination des produits catalogue
- [ ] **LM-SEL-001-1** : Créer composant `Pagination.tsx`
  - Fichier : `apps/linkme/src/components/public-selection/Pagination.tsx`
  - Props : `currentPage`, `totalPages`, `onPageChange`, `branding`
  - UI : Boutons Précédent/Suivant + numéros de pages
  - Style : Cohérent avec le branding de la sélection

- [ ] **LM-SEL-001-2** : Ajouter logique de pagination dans page.tsx
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Ajouter state : `const [currentPage, setCurrentPage] = useState(1)`
  - Constante : `const PRODUCTS_PER_PAGE = 16` (4 lignes × 4 colonnes)
  - Calculer : `totalPages = Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE)`
  - Slice items : `const paginatedItems = filteredItems.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE)`
  - Remplacer `filteredItems.map()` par `paginatedItems.map()` (L448)
  - Reset `currentPage` à 1 quand filtres changent

- [ ] **LM-SEL-001-3** : Intégrer composant Pagination
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Position : Après la grille de produits (après L605)
  - Condition : Afficher uniquement si `totalPages > 1`
  - Props : passer currentPage, totalPages, setCurrentPage, branding

#### Phase 2 : Séparation des sections en tabs
- [ ] **LM-SEL-001-4** : Ajouter gestion de tab via query param
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Utiliser `useSearchParams` et `useRouter` de Next.js
  - État : `const searchParams = useSearchParams(); const activeTab = searchParams.get('tab') ?? 'catalogue'`
  - Remplacer `activeSection` par `activeTab`
  - Fonction : `handleTabChange(tab: string)` qui fait `router.push(?tab=${tab})`

- [ ] **LM-SEL-001-5** : Modifier navigation pour utiliser les tabs
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Remplacer `handleNavClick` (L297-311) par `handleTabChange`
  - Mettre à jour `navItems` pour pointer vers `?tab=catalogue`, `?tab=faq`, `?tab=contact`
  - Passer `activeTab` au lieu de `activeSection` à `SelectionHeader`

- [ ] **LM-SEL-001-6** : Affichage conditionnel des sections
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Wrapper chaque section avec condition :
    - Catalogue (L419-606) : `{activeTab === 'catalogue' && <div>...</div>}`
    - Points de vente (L609-617) : `{activeTab === 'points-de-vente' && showPointsDeVente && <div>...</div>}`
    - FAQ (L619-630) : `{activeTab === 'faq' && <div>...</div>}`
    - Contact (L632-639) : `{activeTab === 'contact' && <div>...</div>}`
  - Supprimer les refs (catalogueRef, faqRef, contactRef, storesRef) devenues inutiles

- [ ] **LM-SEL-001-7** : Ajuster SelectionHeader si nécessaire
  - Fichier : `apps/linkme/src/components/public-selection/SelectionHeader.tsx`
  - Vérifier que le composant accepte des `href` normaux (ex: `?tab=faq`)
  - Si smooth scroll codé en dur, remplacer par navigation Next.js normale
  - Prop `activeSection` → renommer en `activeTab` pour clarté

#### Phase 3 : Tests et ajustements
- [ ] **LM-SEL-001-8** : Tester navigation entre tabs
  - Catalogue → FAQ : contenu change instantanément
  - FAQ → Contact : idem
  - Vérifier que l'URL change bien (?tab=catalogue, ?tab=faq, ?tab=contact)
  - Tester le back button du navigateur

- [ ] **LM-SEL-001-9** : Tester pagination
  - Catalogue avec 31 produits → 2 pages (16 + 15)
  - Boutons Précédent/Suivant fonctionnels
  - Changement de filtre/recherche → reset page 1
  - Compteur "X résultats" cohérent avec pagination

- [ ] **LM-SEL-001-10** : Vérifier que FAQ et Contact ne sont plus dans Catalogue
  - Onglet Catalogue → uniquement produits + pagination
  - Onglet FAQ → uniquement FAQSection
  - Onglet Contact → uniquement ContactForm
  - Pas de scroll infini

### Notes techniques
- **Performance** : Pas de changement, pagination côté client suffit (31 produits)
- **SEO** : Les sections FAQ/Contact restent crawlables via les onglets
- **Responsive** : Grille déjà responsive (sm:2, lg:3, xl:4 colonnes), pagination s'adapte
- **État du panier** : Non affecté par le changement de tab

### Dépendances
- Aucune nouvelle dépendance npm requise
- Utiliser `useSearchParams` et `useRouter` de `next/navigation` (déjà disponible)

---

## Observations READ1 - LM-SEL-002 (2026-01-13)

**Demande utilisateur** : Ajouter une barre de menu de catégorisation identique à celle du catalogue LinkMe dans la page de sélection partagée.

**Composants catalogue analysés** :
- `apps/linkme/src/app/(main)/catalogue/components/CategoryBar.tsx` - Barre horizontale avec boutons catégories
- `apps/linkme/src/app/(main)/catalogue/components/CategoryDropdown.tsx` - Dropdown multi-niveau catégorie/sous-catégorie

### Composant CategoryBar (catalogue)

**Fonctionnalités** :
- Extrait automatiquement les catégories uniques des produits
- Affiche "Tous" + un bouton par catégorie avec compteur de produits
- Style : boutons arrondis (rounded-full), scrollable horizontal
- État actif : bg-linkme-turquoise
- Filtre les produits par catégorie sélectionnée

**Données requises** :
- Utilise `product.category_name` de `LinkMeCatalogProduct`

### Composant CategoryDropdown (catalogue)

**Fonctionnalités** :
- Dropdown multi-niveau : catégorie → sous-catégories
- Construit hiérarchie automatiquement depuis les produits
- Affiche compteurs pour chaque niveau
- Gère sélection catégorie ET sous-catégorie simultanée

**Données requises** :
- `product.category_name`
- `product.subcategory_id`
- `product.subcategory_name`

### État actuel sélection partagée

**Fichier** : `apps/linkme/src/app/(public)/s/[id]/page.tsx`

**Structure données `ISelectionItem`** (ligne 38-51) :
```typescript
interface ISelectionItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_image: string | null;
  base_price_ht: number;
  selling_price_ht: number;
  selling_price_ttc: number;
  margin_rate: number;
  stock_quantity: number;
  category: string | null;  // ⚠️ Simple string, pas subcategory
  is_featured: boolean;
}
```

**Composant actuel** : `CategoryTabs` (ligne 408-416)
- Composant basique avec onglets "Tous" / "Autres"
- Ne reflète PAS les vraies catégories des produits
- Extrait categories depuis `item.category ?? 'Autres'` (ligne 186-206)

### Problème identifié

**Données manquantes** : `ISelectionItem` ne contient pas :
- `subcategory_id`
- `subcategory_name`

Ces données doivent être ajoutées par la RPC `get_public_selection` (ou `get_public_selection_by_slug`).

### Arborescence DB produits

Selon les règles établies, chaque produit est lié à une **sous-catégorie** qui est elle-même dans une **arborescence** :
- **Famille** → **Catégorie** → **Sous-catégorie**

La table `product_categories_arborescence` contient cette hiérarchie complète.

---

## Plan d'implémentation - LM-SEL-002

### Phase 1 : Enrichir les données de sélection

- [ ] **LM-SEL-002-1** : Modifier la RPC pour inclure subcategory
  - Fichier : Identifier la RPC `get_public_selection` dans Supabase
  - Ajouter jointure vers `product_categories_arborescence`
  - Retourner dans les items : `subcategory_id`, `subcategory_name`, `category_name` (enrichi)
  - **Note** : Le champ `category` actuel dans ISelectionItem doit devenir `category_name` cohérent

- [ ] **LM-SEL-002-2** : Mettre à jour interface ISelectionItem
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Ajouter : `subcategory_id: string | null`
  - Ajouter : `subcategory_name: string | null`
  - Renommer `category` en `category_name` (ou adapter le code)

### Phase 2 : Créer composants adaptés pour sélection

- [ ] **LM-SEL-002-3** : Créer SelectionCategoryBar.tsx
  - Fichier : `apps/linkme/src/components/public-selection/SelectionCategoryBar.tsx`
  - Adapter `CategoryBar` du catalogue pour :
    - Utiliser `ISelectionItem[]` au lieu de `LinkMeCatalogProduct[]`
    - Extraire catégories depuis `item.category_name`
    - Même UI : boutons arrondis, scrollable, compteurs
    - Branding : utiliser `branding.primary_color` au lieu de linkme-turquoise

- [ ] **LM-SEL-002-4** : Créer SelectionCategoryDropdown.tsx
  - Fichier : `apps/linkme/src/components/public-selection/SelectionCategoryDropdown.tsx`
  - Adapter `CategoryDropdown` du catalogue pour :
    - Utiliser `ISelectionItem[]`
    - Construire hiérarchie depuis `category_name`, `subcategory_id`, `subcategory_name`
    - Branding cohérent avec la sélection

- [ ] **LM-SEL-002-5** : Exporter les nouveaux composants
  - Fichier : `apps/linkme/src/components/public-selection/index.ts`
  - Ajouter : `export { SelectionCategoryBar } from './SelectionCategoryBar'`
  - Ajouter : `export { SelectionCategoryDropdown } from './SelectionCategoryDropdown'`

### Phase 3 : Intégrer dans la page sélection

- [ ] **LM-SEL-002-6** : Remplacer CategoryTabs par SelectionCategoryBar
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Supprimer l'import et l'utilisation de `CategoryTabs` (ligne 408-416)
  - Importer `SelectionCategoryBar` et `SelectionCategoryDropdown`
  - Ajouter state : `const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)`
  - Insérer `SelectionCategoryBar` **entre** le `SelectionHero` et les `ProductFilters`
  - Position exacte : après ligne 396 (après SelectionHero), avant ligne 398 (ProductFilters)

- [ ] **LM-SEL-002-7** : Ajouter SelectionCategoryDropdown dans la barre de filtres
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Créer une section de filtres horizontale similaire au catalogue (après CategoryBar)
  - Inclure : SelectionCategoryDropdown + SearchBar existant
  - Aligner avec le design du catalogue (flex horizontal, sticky top)

- [ ] **LM-SEL-002-8** : Mettre à jour la logique de filtrage
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Modifier `filteredItems` (ligne 209-235) pour inclure :
    - Filtre par `selectedCategory` (déjà existant)
    - Filtre par `selectedSubcategory` (nouveau)
  - Logique : Si subcategory sélectionnée, filtrer par `item.subcategory_id === selectedSubcategory`

- [ ] **LM-SEL-002-9** : Supprimer l'ancien logic categorization
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Supprimer `categories` useMemo (ligne 186-206) si remplacé par SelectionCategoryBar
  - Nettoyer les states inutilisés

### Phase 4 : Tests et ajustements

- [ ] **LM-SEL-002-10** : Tester la catégorisation
  - Vérifier que la barre affiche les bonnes catégories (depuis les 31 produits Pokawa)
  - Cliquer sur une catégorie → filtre les produits
  - Dropdown : sélectionner une sous-catégorie → affine le filtre
  - Compteurs corrects à chaque niveau

- [ ] **LM-SEL-002-11** : Vérifier le branding
  - Couleurs de la sélection appliquées (branding.primary_color)
  - Style cohérent avec le reste de la page
  - Responsive : scrollable horizontal sur mobile

- [ ] **LM-SEL-002-12** : Tester avec pagination (LM-SEL-001)
  - Si LM-SEL-001 implémenté : vérifier que pagination reset sur changement de catégorie
  - Compteurs cohérents entre catégorisation et pagination

### Notes techniques

**Compatibilité avec LM-SEL-001** :
- La barre de catégorisation doit être visible dans TOUS les tabs (Catalogue, FAQ, Contact)
- Ou uniquement dans le tab Catalogue selon décision utilisateur
- Par défaut : uniquement dans Catalogue (même logique que les ProductFilters)

**Position dans le layout** :
```
SelectionHeader (sticky top)
SelectionHero (hero image)
SelectionCategoryBar (nouvelle - scroll avec page)
[Barre filtres : CategoryDropdown + Search] (sticky top-2)
CategoryTabs (Tous/Autres) → À REMPLACER ou SUPPRIMER
Produits (grid)
```

**Branding** :
- Remplacer toutes les références `linkme-turquoise` par `branding.primary_color`
- Adapter les styles pour être génériques (utilisable par toute sélection)

### Dépendances

**Base de données** :
- Modifier RPC `get_public_selection` (Supabase)
- Jointure avec `product_categories_arborescence` ou table équivalente

**Code** :
- Utiliser les mêmes patterns que `CategoryBar` et `CategoryDropdown` du catalogue
- Adapter pour les types `ISelectionItem` et le branding dynamique

---

## Observations READ1 - LM-SEL-001-FIX (2026-01-13)

**Demande utilisateur** : Réduire le nombre de produits par page - trop de produits affichés actuellement.

**État actuel** :
- **16 produits par page** (4 lignes × 4 colonnes)
- Pagination : Page 1 (16 produits) + Page 2 (15 produits) = 31 total

**État souhaité** :
- **12 produits par page** (3 lignes × 4 colonnes)
- Pagination : Page 1 (12) + Page 2 (12) + Page 3 (7) = 31 total

**Fichier concerné** : `apps/linkme/src/app/(public)/s/[id]/page.tsx`

**Constante à modifier** : `PRODUCTS_PER_PAGE = 16` → `PRODUCTS_PER_PAGE = 12`

### Plan de correction

- [ ] **LM-SEL-001-FIX-1** : Modifier la constante PRODUCTS_PER_PAGE
  - Fichier : `apps/linkme/src/app/(public)/s/[id]/page.tsx`
  - Ligne à trouver : `const PRODUCTS_PER_PAGE = 16`
  - Remplacer par : `const PRODUCTS_PER_PAGE = 12`
  - Vérifier que la pagination se recalcule automatiquement (totalPages = Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE))

- [ ] **LM-SEL-001-FIX-2** : Tester la nouvelle pagination
  - Page 1 : 12 produits (3 lignes)
  - Page 2 : 12 produits (3 lignes)
  - Page 3 : 7 produits (dernière page)
  - Navigation : Précédent | 1 | 2 | 3 | Suivant

**Note** : Changement trivial, une seule constante à modifier.

---

## Done

<!-- Taches completees automatiquement deplacees ici -->
