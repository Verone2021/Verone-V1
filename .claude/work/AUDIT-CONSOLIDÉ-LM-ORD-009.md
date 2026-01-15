# Audit Consolidé LM-ORD-009

**Date**: 2026-01-15
**Objectif**: Analyser l'état actuel vs le plan LM-ORD-009
**Scope**: Front-end (OrderFormUnified.tsx) + Back-end (RPC + DB) + Page détail commande

---

## 📊 ÉTAT ACTUEL (Baseline)

### Front-End : OrderFormUnified.tsx (2120 lignes)

**Workflow actuel** : 4 étapes
1. **Restaurant** : Sélection existant OU nouveau (nom, adresse)
2. **Propriétaire** : Type (succursale/franchise) + Contact + Société
3. **Facturation** : Contact facturation + Adresse
4. **Validation** : Récapitulatif + Panier + Modal confirmation

**Problèmes identifiés** :
- ❌ Pas d'étape "Demandeur"
- ❌ Pas d'étape "Livraison"
- ❌ Ownership type à l'étape 2 (devrait être en étape 2 restaurant)
- ❌ Terminologie "Propriétaire" (devrait être "Responsable")
- ❌ UI rudimentaire pour sélection restaurant (dropdown basique)
- ❌ Pas de sélection de contacts existants (uniquement création)
- ❌ Pas d'option organisation mère pour facturation

**Interface TypeScript actuelle** :
```typescript
interface OrderFormUnifiedData {
  isNewRestaurant: boolean | null;
  existingOrganisationId: string | null;
  newRestaurant: { tradeName, city, address, postalCode, latitude, longitude };
  owner: { type, contactSameAsRequester, name, email, phone, companyLegalName, companyTradeName, siret, kbisUrl };
  billing: { contactSource, name, email, phone, address, postalCode, city, latitude, longitude };
  notes: string;
}
```

### Back-End : RPC create_public_linkme_order

**Signature actuelle** (7 paramètres) :
```sql
CREATE OR REPLACE FUNCTION create_public_linkme_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_cart JSONB,
  p_requester JSONB,      -- {type, name, email, phone, position}
  p_organisation JSONB,   -- {existing_id} OU {is_new, trade_name, city, ...}
  p_owner JSONB,          -- {type, same_as_requester, name, email, phone}
  p_billing JSONB         -- {contact_source, delivery_date, mall_form_required}
)
```

**Fonctionnalités actuelles** :
- ✅ Création automatique des contacts (owner + billing)
- ✅ Gestion organisation existante vs nouvelle
- ✅ Mapping ownership_type (propre → succursale)
- ✅ Support géolocalisation (latitude/longitude)
- ✅ Gestion doublons contacts via ON CONFLICT

**Manque** :
- ❌ Pas de paramètre `p_delivery` (livraison)
- ❌ Pas de support sélection contact existant (toujours création)
- ❌ Pas de support organisation mère facturation

### Base de Données : sales_order_linkme_details (33 colonnes)

**Colonnes existantes** (audit database-architect complet) :
```sql
-- Demandeur
requester_type TEXT
requester_name TEXT
requester_email TEXT
requester_phone TEXT
requester_position TEXT

-- Responsable (actuellement nommé "owner")
owner_type TEXT                      -- 'succursale', 'franchise', 'propre' (legacy)
owner_contact_same_as_requester BOOLEAN
owner_name TEXT
owner_email TEXT
owner_phone TEXT
owner_contact_id UUID (NOUVEAU - depuis 2026-01-14)

-- Facturation
billing_contact_source TEXT          -- 'step1', 'step2', 'custom'
billing_contact_id UUID (NOUVEAU - depuis 2026-01-14)

-- Livraison (EXISTANTES !)
desired_delivery_date DATE
delivery_terms_accepted BOOLEAN
mall_form_required BOOLEAN

-- Autres
is_new_restaurant BOOLEAN
sales_order_id UUID (FK)
created_at TIMESTAMP
updated_at TIMESTAMP
```

**DÉCOUVERTE CRITIQUE** :
✅ Les colonnes `owner_contact_id` et `billing_contact_id` **EXISTENT DÉJÀ** !
✅ Les colonnes de livraison de base **EXISTENT DÉJÀ** !

**Ce qui MANQUE vraiment** :
- ❌ Colonnes détaillées livraison (contact, adresse complète, centre commercial, etc.)
- ❌ Colonne `parent_organisation_id` pour facturation org mère

### Table organisations (68 colonnes)

**Colonnes clés** :
```sql
id UUID PRIMARY KEY
legal_name TEXT NOT NULL
trade_name TEXT
ownership_type organisation_ownership_type  -- ENUM: 'succursale', 'franchise'
enseigne_id UUID REFERENCES enseignes(id)
is_enseigne_parent BOOLEAN DEFAULT FALSE    -- ✅ EXISTE DÉJÀ !
approval_status TEXT
type TEXT                                    -- 'customer', 'supplier', etc.
address_line1, postal_code, city, latitude, longitude
email TEXT
```

**DÉCOUVERTE CRITIQUE** :
✅ `is_enseigne_parent` **EXISTE DÉJÀ** au lieu de `parent_organisation_id` !
→ L'organisation mère est identifiée par `enseigne_id + is_enseigne_parent = true`

### Table enseignes (9 colonnes)

```sql
id UUID PRIMARY KEY
name TEXT NOT NULL
logo_url TEXT
address TEXT
website TEXT
description TEXT
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**CE QUI MANQUE** :
- ❌ Pas de colonne `parent_organisation_id`

**MAIS** :
- ✅ La relation inverse existe : `organisations.enseigne_id` + `is_enseigne_parent`

### Table contacts (27 colonnes)

**Colonnes clés** :
```sql
id UUID PRIMARY KEY
organisation_id UUID REFERENCES organisations(id)
enseigne_id UUID REFERENCES enseignes(id)     -- Support multi-propriétaires
first_name TEXT NOT NULL
last_name TEXT NOT NULL
email TEXT NOT NULL
phone TEXT
mobile TEXT
is_primary_contact BOOLEAN DEFAULT FALSE
is_billing_contact BOOLEAN DEFAULT FALSE
is_commercial_contact BOOLEAN DEFAULT FALSE
is_active BOOLEAN DEFAULT TRUE
owner_type TEXT                                -- 'organisation', 'enseigne', NULL
```

**DÉCOUVERTE CRITIQUE** :
✅ Support multi-propriétaires : `organisation_id` OU `enseigne_id`
✅ Flags de type : `is_primary_contact`, `is_billing_contact`
✅ Contrainte unique : `(organisation_id, email) WHERE is_active = true`

---

## 🎯 PLAN LM-ORD-009 (Objectifs)

### Workflow cible : 6 étapes

1. **Demandeur** : Nom, email, téléphone, rôle, notes
2. **Restaurant** : Sélection (recherche + cartes) OU nouveau (ownership type ICI)
3. **Responsable** : Sélection contact existant OU nouveau
4. **Facturation** : Organisation mère (propre uniquement) OU custom
5. **Livraison** : Contact, adresse, date, centre commercial, semi-remorque
6. **Validation** : Récapitulatif complet + Panier

### Terminologie : "Responsable" partout

**Remplacements requis** :
- `owner` → `responsable` (code front uniquement)
- "Propriétaire" → "Responsable" (UI labels)
- **CONSERVER** les noms DB : `owner_type`, `owner_contact_id` (ne pas changer)

### UI/UX améliorée

- **Recherche** restaurant existant (barre de recherche)
- **Cartes visuelles** avec détails complets
- **Sélection contacts** existants (radio buttons + option "Nouveau")
- **Organisation mère** pré-cochée pour restaurants propres

---

## 🔍 GAPS ANALYSIS (Ce qui doit changer)

### ❌ CE QU'ON NE FAIT PAS (Audit DB = Déjà complet)

1. **Migration `parent_organisation_id` sur enseignes** → **NON NÉCESSAIRE**
   - Utiliser `organisations.enseigne_id + is_enseigne_parent = true` (existe déjà)

2. **Migration colonnes delivery dans sales_order_linkme_details** → **PARTIELLEMENT NÉCESSAIRE**
   - ✅ Existe : `desired_delivery_date`, `mall_form_required`, `delivery_terms_accepted`
   - ❌ Manque : `delivery_contact_name`, `delivery_contact_email`, `delivery_contact_phone`, `delivery_address`, `delivery_postal_code`, `delivery_city`, `delivery_latitude`, `delivery_longitude`, `is_mall_delivery`, `mall_email`, `access_form_required`, `access_form_url`, `semi_trailer_accessible`, `delivery_notes`

3. **Migration bucket Storage `linkme-delivery-forms`** → **À CRÉER**

4. **Migration modifier RPC** → **À MODIFIER** (ajouter p_delivery, support contact_id existant)

### ✅ CE QU'ON FAIT (Code Front + RPC uniquement)

#### Front-End : OrderFormUnified.tsx

**Changements structurels** :
1. Passer de 4 à 6 étapes
2. Créer `OpeningStep1Requester` (NOUVEAU)
3. Modifier `OpeningStep1` → `OpeningStep2Restaurant` (ajouter recherche + cartes)
4. Modifier `OpeningStep2` → `OpeningStep3Responsable` (sélection contacts existants)
5. Modifier `OpeningStep3` → `OpeningStep4Billing` (option org mère)
6. Créer `OpeningStep5Delivery` (NOUVEAU)
7. Renommer `OpeningStep4` → `OpeningStep6Validation`

**Changements terminologie** :
- `owner` → `responsable` (toutes les variables code)
- `OPENING_STEPS[1].title` : "Propriétaire" → "Responsable"

**Changements interface TypeScript** :
```typescript
interface OrderFormUnifiedData {
  // Étape 1 : Demandeur (NOUVEAU)
  requester: {
    name: string;
    email: string;
    phone: string;
    position: string;
    notes: string;
  };

  // Étape 2 : Restaurant (ownership_type DÉPLACÉ ICI)
  isNewRestaurant: boolean | null;
  existingOrganisationId: string | null;
  newRestaurant: {
    ownershipType: 'succursale' | 'franchise' | null;  // DÉPLACÉ depuis step 3
    tradeName: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    optionalContactName: string;  // NOUVEAU
  };

  // Étape 3 : Responsable (NOUVEAU : sélection contact)
  existingContact: {
    selectedContactId: string | null;  // ID contact existant OU 'new'
    isNewContact: boolean;
  };
  responsable: {  // Renommé de "owner"
    name: string;
    email: string;
    phone: string;
    companyLegalName: string;
    companyTradeName: string;
    siret: string;
    kbisFile: File | null;
  };

  // Étape 4 : Facturation (NOUVEAU : org mère)
  billing: {
    useParentOrganisation: boolean;  // NOUVEAU
    contactSource: 'responsable' | 'custom';  // Renommé de 'owner'
    name: string;
    email: string;
    phone: string;
    companyLegalName: string;  // NOUVEAU
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    siret: string;  // NOUVEAU
  };

  // Étape 5 : Livraison (NOUVEAU)
  delivery: {
    useResponsableContact: boolean;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    postalCode: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    deliveryDate: string;
    isMallDelivery: boolean;
    mallEmail: string;
    accessFormRequired: boolean;
    accessFormUrl: string | null;
    semiTrailerAccessible: boolean;
    notes: string;
  };

  // Étape 6 : Validation
  deliveryTermsAccepted: boolean;
  finalNotes: string;
}
```

#### Back-End : RPC create_public_linkme_order

**Modifier signature** (7 → 8 paramètres) :
```sql
CREATE OR REPLACE FUNCTION create_public_linkme_order(
  p_affiliate_id UUID,
  p_selection_id UUID,
  p_cart JSONB,
  p_requester JSONB,      -- {name, email, phone, position, notes}
  p_organisation JSONB,   -- {existing_id} OU {is_new, trade_name, address, ..., ownership_type}
  p_responsable JSONB,    -- {contact_id} OU {is_new, name, email, phone, company_legal_name?, siret?}
  p_billing JSONB,        -- {use_parent, contact_source, ...}
  p_delivery JSONB        -- {contact_name, address, delivery_date, is_mall_delivery, ...}
)
```

**Logique à ajouter** :
1. Si `p_responsable.contact_id` fourni → utiliser contact existant (ne pas créer)
2. Si `p_billing.use_parent = true` → récupérer org mère via :
   ```sql
   SELECT id FROM organisations
   WHERE enseigne_id = v_enseigne_id
     AND is_enseigne_parent = TRUE
   LIMIT 1;
   ```
3. Insérer colonnes `p_delivery` dans `sales_order_linkme_details`

#### Hooks (Front-end)

**Créer nouveaux hooks** :
1. `useEnseigneParentOrganisation(enseigneId)` → Récupère org mère
2. `useEnseigneId()` → Récupère enseigne_id depuis context
3. Modifier `useOrganisationContacts(organisationId)` → Ajouter `allContacts` au retour

#### Hook : use-submit-unified-order.ts

**Modifier préparation RPC** :
1. Ajouter `p_requester` complet (actuellement = owner)
2. Modifier `p_owner` → `p_responsable`
3. Ajouter `p_delivery`
4. Gérer `billing.useParentOrganisation`
5. Gérer `existingContact.selectedContactId`

---

## 🚨 IMPACTS SUR PAGE DÉTAIL COMMANDE (Back-Office)

### Fichier concerné

`apps/back-office/src/app/(main)/commandes/[id]/page.tsx`

### Affichage actuel (à vérifier)

**Sections affichées** :
1. En-tête : Numéro commande, statut, client, total
2. Informations commande :
   - Demandeur (requester_*)
   - Organisation client
   - Type restaurant (owner_type)
   - Contact responsable (owner_*)
   - Contact facturation (billing_*)
3. Panier : Produits + quantités + prix
4. Notes

### Modifications requises (CRITIQUE)

**Sections à ajouter/modifier** :
1. **Section Demandeur** : Afficher `requester_position` + `notes`
2. **Section Responsable** :
   - Renommer "Propriétaire" → "Responsable"
   - Afficher lien vers contact si `owner_contact_id` existe
3. **Section Facturation** :
   - Afficher si org mère utilisée
   - Afficher lien vers contact si `billing_contact_id` existe
4. **Section Livraison** (NOUVELLE) :
   - Contact livraison
   - Adresse complète
   - Date souhaitée
   - Centre commercial ? (Oui/Non)
   - Email centre commercial
   - Formulaire d'accès (lien Storage)
   - Accessible semi-remorque ? (Oui/Non)
   - Notes livraison

**Query Supabase à modifier** :
```typescript
const { data: order } = await supabase
  .from('sales_orders')
  .select(`
    *,
    customer:customer_id(
      legal_name,
      trade_name,
      address_line1,
      postal_code,
      city
    ),
    linkme_details:sales_order_linkme_details(
      *,
      owner_contact:owner_contact_id(first_name, last_name, email, phone),
      billing_contact:billing_contact_id(first_name, last_name, email, phone)
    ),
    items:sales_order_items(*)
  `)
  .eq('id', orderId)
  .single();
```

**Action lier contact → organisation** (demandée par utilisateur) :
- Ajouter bouton "Lier ce contact à l'organisation"
- Logique : Si `owner_contact_id` ou `billing_contact_id` existe, proposer de le lier
- Si non lié, créer le contact avec `organisation_id` + flags appropriés

---

## 📝 CHECKLIST VALIDATION ALIGNEMENT

### Front-End (OrderFormUnified.tsx)

- [ ] 6 étapes implémentées (Demandeur, Restaurant, Responsable, Facturation, Livraison, Validation)
- [ ] Terminologie "Responsable" partout (0 occurrence de "Propriétaire")
- [ ] Ownership type à l'étape 2 (Restaurant)
- [ ] Sélection contacts existants (étape 3)
- [ ] Option organisation mère (étape 4, propre uniquement)
- [ ] Recherche + cartes visuelles restaurants (étape 2)
- [ ] Upload formulaire accès (étape 5)

### Front-End (CreateOrderModal.tsx - Page /commandes)

- [ ] Étape 1 auto-remplie depuis profil utilisateur
- [ ] Étapes 2-6 identiques à sélection publique

### Back-End (RPC)

- [ ] Signature 8 paramètres (+ p_delivery)
- [ ] Support `p_responsable.contact_id` (contact existant)
- [ ] Support `p_billing.use_parent` (org mère)
- [ ] Insert colonnes delivery dans sales_order_linkme_details
- [ ] Retour : `owner_contact_id`, `billing_contact_id`, `parent_organisation_id`

### Base de Données

- [ ] Migration colonnes delivery (14 colonnes)
- [ ] Bucket Storage `linkme-delivery-forms` créé
- [ ] Policies Storage (read public, upload authenticated)

### Page Détail Commande (Back-Office)

- [ ] Section "Demandeur" complète (position, notes)
- [ ] Section "Responsable" (renommée, lien contact)
- [ ] Section "Facturation" (org mère, lien contact)
- [ ] Section "Livraison" (NOUVELLE, tous les champs)
- [ ] Bouton "Lier contact → organisation" (si applicable)
- [ ] Query Supabase avec joins contacts

### Tests E2E

- [ ] Test 1 : Restaurant existant + contact existant
- [ ] Test 2 : Restaurant existant + nouveau contact
- [ ] Test 3 : Nouveau restaurant propre + org mère facturation
- [ ] Test 4 : Nouveau restaurant propre + facturation custom
- [ ] Test 5 : Nouveau restaurant franchise + société
- [ ] Test 6 : Livraison centre commercial + formulaire accès
- [ ] Test 7 : Page détail commande affiche tous les champs
- [ ] Test 8 : Console Zero (0 erreurs)
- [ ] Test 9 : `pnpm type-check` → 0 erreurs
- [ ] Test 10 : `pnpm build` → Build succeeded

---

## 🎯 PROCHAINES ÉTAPES

### Phase 1 : Migrations DB (30-45 min)

1. Créer migration colonnes delivery
2. Créer bucket Storage + policies
3. Modifier RPC (ajouter p_delivery, support contact_id, org mère)
4. Appliquer migrations
5. Tester RPC en SQL direct

### Phase 2 : Hooks Front-End (15-20 min)

1. Créer `useEnseigneParentOrganisation`
2. Créer `useEnseigneId`
3. Modifier `useOrganisationContacts` (ajouter `allContacts`)

### Phase 3 : Interface TypeScript (30 min)

1. Remplacer `OrderFormUnifiedData`
2. Mettre à jour `INITIAL_DATA`
3. Mettre à jour `OPENING_STEPS` (6 étapes)

### Phase 4 : Composants Steps (3-4h)

1. Créer `OpeningStep1Requester`
2. Modifier `OpeningStep2Restaurant`
3. Modifier `OpeningStep3Responsable`
4. Modifier `OpeningStep4Billing`
5. Créer `OpeningStep5Delivery`
6. Renommer/modifier `OpeningStep6Validation`

### Phase 5 : Navigation & Validation (1h)

1. Créer fonctions validation (validateStep1-6)
2. Modifier `handleNext()` pour 6 étapes
3. Modifier conditions stepper

### Phase 6 : Soumission RPC (1h)

1. Préparer 8 paramètres JSONB
2. Appeler RPC modifié
3. Gérer réponse + toast + redirection

### Phase 7 : Page Détail Commande (1-2h)

1. Ajouter section "Livraison"
2. Modifier query Supabase (joins contacts)
3. Renommer "Propriétaire" → "Responsable"
4. Afficher liens contacts
5. Ajouter bouton "Lier contact"

### Phase 8 : Tests (2-3h)

1. Tests E2E complets (10 scénarios)
2. Vérification Console Zero
3. Type-check + Build

---

## 📊 EFFORT ESTIMÉ FINAL

| Phase | Temps | Complexité |
|-------|-------|------------|
| Phase 1 : Migrations DB | 30-45 min | Moyenne |
| Phase 2 : Hooks | 15-20 min | Faible |
| Phase 3 : Interface TS | 30 min | Faible |
| Phase 4 : Composants Steps | 3-4h | Élevée |
| Phase 5 : Navigation | 1h | Moyenne |
| Phase 6 : Soumission RPC | 1h | Moyenne |
| Phase 7 : Page Détail | 1-2h | Moyenne |
| Phase 8 : Tests | 2-3h | Moyenne |
| **TOTAL** | **10-14h** | **Refonte majeure** |

---

**Rapport créé le 2026-01-15**
**Auteur**: Claude Code WRITE (Agent database-architect + analyse code)
