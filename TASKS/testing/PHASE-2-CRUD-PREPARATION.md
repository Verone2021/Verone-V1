# 🧪 PHASE 2 : CRUD OPERATIONS - PRÉPARATION TECHNIQUE

**Date** : 2025-10-11
**Module** : Organisation (Fournisseurs, Clients, Prestataires, Contacts)
**Statut** : 📋 **PRÉPARATION COMPLÈTE - PRÊT POUR TESTS BROWSER**

---

## 🎯 OBJECTIF PHASE 2

Tester toutes les opérations CRUD (Create, Read, Update, Delete) pour :
- **Organisations** : Fournisseurs, Clients Pro, Prestataires
- **Contacts** : Contacts liés aux organisations

---

## 📊 ANALYSE CODE CRUD - ORGANISATIONS

### Hook : `useOrganisations`

**Fichier** : `src/hooks/use-organisations.ts`

**Fonctions CRUD Disponibles** :

```typescript
// ✅ CREATE
createOrganisation(data: CreateOrganisationData): Promise<Organisation | null>
// Génère slug automatiquement depuis le nom
// Insertion avec colonnes validées en BDD

// ✅ READ
getOrganisationById(id: string): Promise<Organisation | null>
// Récupération organisation avec tous ses champs

// ✅ UPDATE
updateOrganisation(data: UpdateOrganisationData): Promise<Organisation | null>
// Update avec filtrage colonnes autorisées uniquement

// ✅ DELETE (Hard Delete)
hardDeleteOrganisation(id: string): Promise<boolean>
// Suppression définitive sans vérification archive

// ✅ ARCHIVE (Soft Delete)
archiveOrganisation(id: string): Promise<boolean>
// Set archived_at = NOW() + is_active = false
// Condition: archived_at IS NULL (pas déjà archivé)

// ✅ RESTORE (Unarchive)
unarchiveOrganisation(id: string): Promise<boolean>
// Set archived_at = NULL + is_active = true
// Condition: archived_at IS NOT NULL (déjà archivé)

// ✅ TOGGLE STATUS
toggleOrganisationStatus(id: string): Promise<boolean>
// Inverse is_active (true ↔ false)

// ✅ REFETCH
refetch(): Promise<void>
// Recharge la liste après modification
```

### Colonnes BDD Utilisées par le Hook

**Table** : `organisations` (49 colonnes totales)

**Colonnes AUTORISÉES par `updateOrganisation`** :
```typescript
const allowedFields = [
  // Base
  'name', 'type', 'email', 'country', 'is_active',

  // Adresse Facturation
  'billing_address_line1', 'billing_address_line2', 'billing_postal_code',
  'billing_city', 'billing_region', 'billing_country',

  // Adresse Livraison
  'shipping_address_line1', 'shipping_address_line2', 'shipping_postal_code',
  'shipping_city', 'shipping_region', 'shipping_country',
  'has_different_shipping_address',

  // Classification Client
  'customer_type', 'prepayment_required',

  // Clients Particuliers
  'first_name', 'mobile_phone', 'date_of_birth',
  'nationality', 'preferred_language', 'communication_preference',
  'marketing_consent'
]
```

**Colonnes EXISTANTES en BDD mais NON UTILISÉES par le hook** :
```sql
-- Coordonnées (NON utilisées par hook actuel)
phone, website, secondary_email,
address_line1, address_line2, postal_code, city, region,

-- Informations Légales (NON utilisées)
siret, vat_number, legal_form,

-- Fournisseurs (NON utilisées)
industry_sector, supplier_segment, supplier_category,
payment_terms, delivery_time_days, minimum_order_amount, currency,
rating, certification_labels, preferred_supplier,

-- Autres
notes, abby_customer_id, default_channel_id
```

**⚠️ IMPORTANT** : Le hook `createOrganisation` et `updateOrganisation` **filtrent activement** les colonnes pour n'utiliser que celles listées dans `allowedFields`. Les autres colonnes BDD existent mais ne sont **pas modifiables via le hook**.

---

## 📊 ANALYSE CODE CRUD - CONTACTS

### Hook : `useContacts`

**Fichier** : `src/hooks/use-contacts.ts`

**Fonctions CRUD Disponibles** :

```typescript
// ✅ CREATE
createContact(data: CreateContactData): Promise<Contact | null>
// Création contact lié à organisation
// Nettoyage champs vides → null

// ✅ READ
fetchContact(contactId: string): Promise<Contact | null>
fetchOrganisationContacts(organisationId: string): Promise<void>
fetchPrimaryContact(organisationId: string): Promise<Contact | null>

// ✅ UPDATE
updateContact(contactId: string, data: UpdateContactData): Promise<Contact | null>

// ✅ SOFT DELETE
deactivateContact(contactId: string): Promise<Contact | null>
// Set is_active = false

// ✅ RESTORE
activateContact(contactId: string): Promise<Contact | null>
// Set is_active = true

// ✅ HARD DELETE
deleteContact(contactId: string): Promise<void>
// Suppression définitive

// ✅ UTILITAIRES
setPrimaryContact(contactId: string): Promise<Contact | null>
updateLastContactDate(contactId: string): Promise<Contact | null>
getContactFullName(contact: Contact): string
getContactDisplayEmail(contact: Contact): string
getContactRoles(contact: Contact): string
```

### Colonnes BDD Contacts

**Table** : `contacts` (25 colonnes)

**Colonnes REQUISES (NOT NULL)** :
- `id` (uuid, auto)
- `organisation_id` (uuid, FK → organisations.id)
- `first_name` (varchar)
- `last_name` (varchar)
- `email` (varchar, unique par organisation)

**Colonnes OPTIONNELLES** :
```sql
-- Informations Personnelles
title, department

-- Contact Principal
phone, mobile, secondary_email, direct_line

-- Rôles & Responsabilités
is_primary_contact (default: false)
is_billing_contact (default: false)
is_technical_contact (default: false)
is_commercial_contact (default: true) -- ⭐ TRUE par défaut

-- Préférences Communication
preferred_communication_method (default: 'email')
accepts_marketing (default: true)
accepts_notifications (default: true)
language_preference (default: 'fr')

-- Métadonnées
notes, is_active (default: true), last_contact_date

-- Audit
created_by, created_at (auto), updated_at (auto)
```

---

## 🧪 PLAN TESTS CRUD - ORGANISATIONS

### Test CREATE Organisation

**Endpoint UI** : Modal "Nouveau [Fournisseur|Client|Prestataire]"

**Données Test Fournisseur** :
```json
{
  "name": "TEST Fournisseur CRUD Phase 2",
  "type": "supplier",
  "email": "test.supplier.crud@verone-tests.com",
  "country": "FR",
  "is_active": true,
  "billing_address_line1": "123 Rue Test",
  "billing_postal_code": "75001",
  "billing_city": "Paris",
  "billing_country": "FR"
}
```

**Données Test Client Pro** :
```json
{
  "name": "TEST Client Pro CRUD Phase 2",
  "type": "customer",
  "customer_type": "professional",
  "email": "test.customer.crud@verone-tests.com",
  "country": "FR",
  "is_active": true,
  "billing_address_line1": "456 Avenue Test",
  "billing_postal_code": "69001",
  "billing_city": "Lyon",
  "billing_country": "FR"
}
```

**Données Test Prestataire** :
```json
{
  "name": "TEST Prestataire CRUD Phase 2",
  "type": "partner",
  "email": "test.partner.crud@verone-tests.com",
  "country": "FR",
  "is_active": true
}
```

**Validation Attendue** :
- ✅ Slug généré automatiquement (ex: "test-fournisseur-crud-phase-2")
- ✅ Organisation visible dans liste après création
- ✅ Stats cards mises à jour (+1)
- ✅ Console 0 erreur
- ✅ BDD : Vérification row exists

**SQL Vérification** :
```sql
SELECT id, name, slug, type, email, created_at
FROM organisations
WHERE name LIKE '%TEST%CRUD%Phase 2%'
ORDER BY created_at DESC;
```

---

### Test READ Organisation

**Endpoint UI** : `/contacts-organisations/[type]/[id]`

**Actions** :
1. Cliquer "Voir Détails" sur organisation test
2. Vérifier affichage toutes sections :
   - ✅ Informations Contact
   - ✅ Adresses (Facturation + Livraison)
   - ✅ Conditions Commerciales
   - ✅ Performance & Qualité
3. Vérifier stats (Produits, Créé le, Modifié le)
4. Vérifier onglets (Contacts, Commandes, Factures, Produits)

**Validation Attendue** :
- ✅ Toutes données affichées correctement
- ✅ Boutons "MODIFIER" présents sur chaque section
- ✅ Breadcrumb navigation correct
- ✅ Console 0 erreur

---

### Test UPDATE Organisation (Édition Inline)

**Endpoint UI** : Bouton "MODIFIER" sur chaque section

**Sections à Tester** :

#### 1. Informations Contact
```json
{
  "name": "TEST Fournisseur CRUD Phase 2 - MODIFIÉ",
  "email": "test.supplier.crud.updated@verone-tests.com"
}
```

#### 2. Adresses
```json
{
  "billing_address_line1": "789 Boulevard Modifié",
  "billing_postal_code": "75002",
  "billing_city": "Paris",
  "billing_country": "FR",
  "has_different_shipping_address": true,
  "shipping_address_line1": "321 Rue Livraison",
  "shipping_postal_code": "75003",
  "shipping_city": "Paris",
  "shipping_country": "FR"
}
```

**Validation Attendue** :
- ✅ Modifications enregistrées en BDD
- ✅ Affichage mis à jour immédiatement
- ✅ Toast "Succès" affiché
- ✅ Console 0 erreur
- ✅ BDD : `updated_at` timestamp mis à jour

**SQL Vérification** :
```sql
SELECT name, email, billing_address_line1, updated_at
FROM organisations
WHERE id = '[test-id]';
```

---

### Test ARCHIVE Organisation (Soft Delete)

**Endpoint UI** : Bouton "ARCHIVER"

**Actions** :
1. Cliquer bouton "ARCHIVER" sur organisation test
2. Confirmer action (si modal confirmation)
3. Vérifier organisation disparue de liste active
4. Activer filtre "Inclure archivés" (si disponible)
5. Vérifier badge "Archivé" affiché

**Validation Attendue** :
- ✅ Organisation non visible dans liste par défaut
- ✅ `archived_at` timestamp enregistré en BDD
- ✅ `is_active` = false
- ✅ Stats cards mises à jour (-1 actif)
- ✅ Console 0 erreur

**SQL Vérification** :
```sql
SELECT name, is_active, archived_at
FROM organisations
WHERE id = '[test-id]';

-- Résultat attendu:
-- is_active = false
-- archived_at = '2025-10-11 XX:XX:XX+00'
```

---

### Test RESTORE Organisation (Unarchive)

**Endpoint UI** : Bouton "RESTAURER" (sur organisation archivée)

**Actions** :
1. Activer filtre "Inclure archivés"
2. Localiser organisation test archivée
3. Cliquer bouton "RESTAURER"
4. Vérifier organisation réapparue dans liste active

**Validation Attendue** :
- ✅ Organisation visible dans liste active
- ✅ `archived_at` = NULL
- ✅ `is_active` = true
- ✅ Badge "Archivé" retiré
- ✅ Stats cards mises à jour (+1 actif)
- ✅ Console 0 erreur

**SQL Vérification** :
```sql
SELECT name, is_active, archived_at
FROM organisations
WHERE id = '[test-id]';

-- Résultat attendu:
-- is_active = true
-- archived_at = NULL
```

---

### Test DELETE Organisation (Hard Delete)

**Endpoint UI** : Bouton "SUPPRIMER"

**Actions** :
1. Cliquer bouton "SUPPRIMER" sur organisation test
2. Confirmer suppression définitive dans modal
3. Vérifier organisation disparue de liste
4. Vérifier stats cards mises à jour

**Validation Attendue** :
- ✅ Organisation supprimée de la liste
- ✅ Row supprimée de BDD (pas seulement archivée)
- ✅ Stats cards mises à jour (-1 total)
- ✅ Console 0 erreur
- ✅ Toast "Supprimé définitivement" affiché

**SQL Vérification (Cleanup Confirmé)** :
```sql
SELECT COUNT(*) as remaining
FROM organisations
WHERE id = '[test-id]';

-- Résultat attendu: 0 (zero rows)
```

**⚠️ IMPORTANT** : Vérifier que les contacts liés sont gérés (cascade delete ou blocage).

---

## 🧪 PLAN TESTS CRUD - CONTACTS

### Test CREATE Contact

**Endpoint UI** : Bouton "+ NOUVEAU CONTACT" (sur page détail organisation)

**Données Test Contact** :
```json
{
  "organisation_id": "[id-organisation-test]",
  "first_name": "Jean",
  "last_name": "TEST Contact CRUD",
  "email": "jean.test.crud@verone-contacts.com",
  "title": "Responsable Test",
  "department": "Tests",
  "phone": "01.23.45.67.89",
  "mobile": "06.12.34.56.78",
  "is_primary_contact": true,
  "is_commercial_contact": true,
  "is_billing_contact": true,
  "preferred_communication_method": "email",
  "language_preference": "fr",
  "accepts_marketing": true,
  "accepts_notifications": true
}
```

**Validation Attendue** :
- ✅ Contact créé visible dans liste organisation
- ✅ Badges rôles affichés (⭐ Principal, 💼 Commercial, 💳 Facturation)
- ✅ Stats contacts mises à jour (+1 total, +1 principaux)
- ✅ Console 0 erreur
- ✅ BDD : Row exists avec organisation_id correct

**SQL Vérification** :
```sql
SELECT
  first_name, last_name, email,
  is_primary_contact, is_commercial_contact, is_billing_contact,
  organisation_id
FROM contacts
WHERE email = 'jean.test.crud@verone-contacts.com';
```

---

### Test READ Contact

**Endpoint UI** : `/contacts-organisations/contacts/[id]`

**Actions** :
1. Cliquer "Voir détails" (icône œil) sur contact test
2. Vérifier affichage toutes sections :
   - ✅ Informations Personnelles (Prénom, Nom, Titre, Département)
   - ✅ Rôles & Responsabilités (Principal, Commercial, Facturation, Technique)
   - ✅ Coordonnées (Email, Téléphone, Mobile)
   - ✅ Préférences Communication (Méthode, Langue, Marketing, Notifications)
3. Vérifier organisation liée affichée (sidebar)
4. Vérifier dates (Créé le, Modifié le)

**Validation Attendue** :
- ✅ Toutes données affichées correctement
- ✅ Boutons "MODIFIER" présents sur chaque section
- ✅ Badges rôles affichés dans header
- ✅ Lien organisation fonctionnel
- ✅ Console 0 erreur

---

### Test UPDATE Contact (Édition Inline)

**Sections à Tester** :

#### 1. Informations Personnelles
```json
{
  "first_name": "Jean",
  "last_name": "TEST Contact CRUD - MODIFIÉ",
  "title": "Directeur Test",
  "department": "Tests Avancés"
}
```

#### 2. Rôles & Responsabilités
```json
{
  "is_primary_contact": true,
  "is_commercial_contact": false,
  "is_billing_contact": true,
  "is_technical_contact": true
}
```

#### 3. Coordonnées
```json
{
  "email": "jean.test.crud.updated@verone-contacts.com",
  "phone": "01.98.76.54.32",
  "mobile": "06.87.65.43.21"
}
```

#### 4. Préférences Communication
```json
{
  "preferred_communication_method": "phone",
  "language_preference": "en",
  "accepts_marketing": false,
  "accepts_notifications": true
}
```

**Validation Attendue** :
- ✅ Modifications enregistrées en BDD
- ✅ Affichage mis à jour immédiatement
- ✅ Badges rôles mis à jour
- ✅ Toast "Succès" affiché
- ✅ Console 0 erreur
- ✅ BDD : `updated_at` timestamp mis à jour

**SQL Vérification** :
```sql
SELECT
  first_name, last_name, title, email,
  is_primary_contact, is_commercial_contact, is_billing_contact, is_technical_contact,
  preferred_communication_method, language_preference,
  updated_at
FROM contacts
WHERE id = '[test-id]';
```

---

### Test DEACTIVATE Contact (Soft Delete)

**Endpoint UI** : Bouton "DÉSACTIVER"

**Actions** :
1. Cliquer bouton "DÉSACTIVER" sur contact test
2. Confirmer action
3. Vérifier contact disparue de liste active
4. Vérifier badge "Inactif" (si filtre inclure inactifs activé)

**Validation Attendue** :
- ✅ Contact non visible dans liste par défaut
- ✅ `is_active` = false
- ✅ Stats contacts mises à jour (-1 actif)
- ✅ Console 0 erreur

**SQL Vérification** :
```sql
SELECT first_name, last_name, is_active
FROM contacts
WHERE id = '[test-id]';

-- Résultat attendu: is_active = false
```

---

### Test ACTIVATE Contact (Restore)

**Endpoint UI** : Bouton "ACTIVER" (sur contact désactivé)

**Actions** :
1. Activer filtre "Inclure inactifs"
2. Localiser contact test désactivé
3. Cliquer bouton "ACTIVER"
4. Vérifier contact réapparu dans liste active

**Validation Attendue** :
- ✅ Contact visible dans liste active
- ✅ `is_active` = true
- ✅ Badge "Inactif" retiré
- ✅ Stats contacts mises à jour (+1 actif)
- ✅ Console 0 erreur

**SQL Vérification** :
```sql
SELECT first_name, last_name, is_active
FROM contacts
WHERE id = '[test-id]';

-- Résultat attendu: is_active = true
```

---

### Test DELETE Contact (Hard Delete)

**Endpoint UI** : Bouton "SUPPRIMER"

**Actions** :
1. Cliquer bouton "SUPPRIMER" sur contact test
2. Confirmer suppression définitive
3. Vérifier contact disparu de liste
4. Vérifier stats contacts mises à jour

**Validation Attendue** :
- ✅ Contact supprimé de la liste
- ✅ Row supprimée de BDD
- ✅ Stats contacts mises à jour (-1 total)
- ✅ Console 0 erreur
- ✅ Toast "Supprimé définitivement" affiché

**SQL Vérification (Cleanup Confirmé)** :
```sql
SELECT COUNT(*) as remaining
FROM contacts
WHERE id = '[test-id]';

-- Résultat attendu: 0 (zero rows)
```

---

## 📋 CHECKLIST TESTS CRUD PHASE 2

### Organisations (3 types × 6 opérations = 18 tests)

#### Fournisseurs
- [ ] CREATE Fournisseur + vérification BDD
- [ ] READ Détails fournisseur (4 sections affichées)
- [ ] UPDATE Informations Contact
- [ ] UPDATE Adresses (Facturation + Livraison)
- [ ] ARCHIVE Fournisseur (soft delete)
- [ ] RESTORE Fournisseur (unarchive)
- [ ] DELETE Fournisseur (hard delete + cleanup)

#### Clients Professionnels
- [ ] CREATE Client Pro + vérification BDD
- [ ] READ Détails client (4 sections affichées)
- [ ] UPDATE Informations Contact
- [ ] UPDATE Adresses (Facturation + Livraison)
- [ ] ARCHIVE Client (soft delete)
- [ ] RESTORE Client (unarchive)
- [ ] DELETE Client (hard delete + cleanup)

#### Prestataires (Partners)
- [ ] CREATE Prestataire + vérification BDD
- [ ] READ Détails prestataire (4 sections affichées)
- [ ] UPDATE Informations Contact
- [ ] ARCHIVE Prestataire (soft delete)
- [ ] RESTORE Prestataire (unarchive)
- [ ] DELETE Prestataire (hard delete + cleanup)

### Contacts (1 type × 7 opérations = 7 tests)

- [ ] CREATE Contact + vérification BDD
- [ ] READ Détails contact (4 sections affichées)
- [ ] UPDATE Informations Personnelles
- [ ] UPDATE Rôles & Responsabilités
- [ ] UPDATE Coordonnées
- [ ] UPDATE Préférences Communication
- [ ] DEACTIVATE Contact (soft delete)
- [ ] ACTIVATE Contact (restore)
- [ ] DELETE Contact (hard delete + cleanup)

**Total Tests Phase 2** : **25 tests CRUD**

---

## ✅ CRITÈRES DE SUCCÈS PHASE 2

### Console Error Checking (Règle Sacrée)

| Opération | Console Errors | Status |
|-----------|----------------|--------|
| CREATE | 0 | ✅ |
| READ | 0 | ✅ |
| UPDATE | 0 | ✅ |
| ARCHIVE | 0 | ✅ |
| RESTORE | 0 | ✅ |
| DELETE | 0 | ✅ |

**Résultat Attendu** : ✅ **100% CONSOLE CLEAN POLICY**

### BDD Validation (Systematic)

| Opération | BDD Check | Expected |
|-----------|-----------|----------|
| CREATE | Row exists | ✅ 1 row |
| READ | Data matches | ✅ Consistent |
| UPDATE | updated_at changed | ✅ Timestamp > before |
| ARCHIVE | archived_at NOT NULL | ✅ Timestamp set |
| RESTORE | archived_at IS NULL | ✅ NULL restored |
| DELETE | Row deleted | ✅ 0 rows |

**Résultat Attendu** : ✅ **100% BDD CLEANUP CONFIRMÉ**

### UI/UX Validation

| Fonctionnalité | Status |
|----------------|--------|
| Modal forms fonctionnels | ✅ |
| Édition inline sauvegarde | ✅ |
| Toast notifications affichés | ✅ |
| Stats cards mises à jour | ✅ |
| Badges visuels cohérents | ✅ |
| Boutons CRUD visibles | ✅ |

---

## 🚀 PRÊT POUR TESTS BROWSER

**Statut Préparation** : ✅ **100% COMPLÈTE**

**Documents Générés** :
- ✅ Analyse hooks CRUD (organisations + contacts)
- ✅ Structure BDD complète (49 colonnes organisations, 25 colonnes contacts)
- ✅ Plan tests détaillé (25 tests CRUD)
- ✅ Requêtes SQL validation prêtes
- ✅ Données test préparées

**Prochaine Étape** : **Attendre disponibilité MCP Playwright Browser** pour exécuter les 25 tests CRUD.

---

**Document créé** : 2025-10-11
**Auteur** : Claude Code + Workflow 2025

*Vérone Back Office - Professional AI-Assisted Testing Excellence*
