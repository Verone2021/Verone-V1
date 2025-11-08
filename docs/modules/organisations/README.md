# Module Organisations & Contacts

**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-23
**Coverage** : 100% critical flows

---

## 📊 Vue d'Ensemble

Module central pour gérer **tous les partenaires** de l'écosystème Vérone :

- Fournisseurs (suppliers)
- Clients B2B (customers)
- Clients B2C (individual_customers)
- Partenaires (partners)
- Organisation interne (internal)

**Architecture** : Table polymorphe `organisations` avec `type` discriminant.

---

## ✅ Features Validées

### CRUD Organisations

- ✅ Création fournisseur avec catégories
- ✅ Création client B2B
- ✅ Création client B2C (via `individual_customers`)
- ✅ Modification organisation (nom légal, nom commercial, SIREN)
- ✅ Archivage/Restauration
- ✅ Toggle favoris (coeur)

### Gestion Contacts

- ✅ Ajout contacts multi-organisations
- ✅ Rôles contacts (Principal, Facturation, Commercial, etc.)
- ✅ Association emails/téléphones
- ✅ Préférences communication

### UI/UX

- ✅ Vue grille 4×3 cards responsive
- ✅ Vue liste (tableau)
- ✅ Pagination 1, 2, 3, 4, 5 avec navigation
- ✅ Filtres : Type, Favoris, Archivés
- ✅ Recherche par nom

---

## 📁 Structure Fichiers

```
src/app/contacts-organisations/
└── page.tsx                    # Page principale

src/hooks/
├── use-organisations.ts        # CRUD organisations (principal)
├── use-contacts.ts             # CRUD contacts
├── use-customers.ts            # Clients B2B/B2C spécifique
├── use-suppliers.ts            # Fournisseurs spécifique
└── use-toggle-favorite.ts      # Toggle favoris

src/components/business/
├── organisation-card.tsx       # Card grille
├── organisation-list-view.tsx  # Vue liste
├── organisation-form-modal.tsx # CRUD modal
├── organisation-logo.tsx       # Upload logo
├── contact-*.tsx               # Composants contacts (7 fichiers)
└── customer-*.tsx              # Composants clients (3 fichiers)
```

---

## 🎯 Hooks (5)

### `use-organisations.ts` (Principal)

**CRUD complet** :

```typescript
const {
  organisations, // Organisation[]
  loading, // boolean
  error, // Error | null
  createOrganisation, // (data) => Promise<Organisation>
  updateOrganisation, // (id, data) => Promise<Organisation>
  deleteOrganisation, // (id) => Promise<void>
  toggleFavorite, // (id) => Promise<void>
  archiveOrganisation, // (id) => Promise<void>
  restoreOrganisation, // (id) => Promise<void>
} = useOrganisations({ type: 'supplier' | 'customer' });
```

**Tables Supabase** :

- `organisations` (polymorphe avec `type`)
- `organisation_favorites` (toggle favoris)

### `use-contacts.ts`

**CRUD contacts** :

```typescript
const {
  contacts, // Contact[]
  loading,
  createContact, // (data) => Promise<Contact>
  updateContact, // (id, data) => Promise<Contact>
  deleteContact, // (id) => Promise<void>
} = useContacts({ organisationId: 'uuid' });
```

**Tables Supabase** :

- `contacts`

### `use-customers.ts`

**Spécialisation clients B2B/B2C** :

```typescript
const {
  customers, // Organisation[] (type='customer')
  createB2BCustomer, // organisations uniquement
  createB2CCustomer, // organisations + individual_customers
} = useCustomers();
```

### `use-suppliers.ts`

**Spécialisation fournisseurs** :

```typescript
const {
  suppliers, // Organisation[] (type='supplier')
  supplierCategories, // Catégories fournisseurs
} = useSuppliers();
```

### `use-toggle-favorite.ts`

**Toggle favori universel** :

```typescript
const { toggleFavorite, isFavorite } = useToggleFavorite({
  itemId: 'uuid',
  itemType: 'organisation',
  userId: 'uuid',
});
```

---

## 🗄️ Database Schema

### Table `organisations`

| Colonne       | Type                | Description                           |
| ------------- | ------------------- | ------------------------------------- |
| `id`          | `uuid`              | PK                                    |
| `type`        | `organisation_type` | supplier, customer, partner, internal |
| `legal_name`  | `text`              | Nom légal officiel                    |
| `trade_name`  | `text`              | Nom commercial                        |
| `siren`       | `text`              | SIREN (9 chiffres)                    |
| `logo_url`    | `text`              | URL logo Supabase Storage             |
| `archived_at` | `timestamptz`       | Date archivage (NULL si actif)        |
| `created_at`  | `timestamptz`       | Date création                         |

**RLS Policies** :

- Owner : CRUD complet
- Admin : CRUD complet
- Sales : SELECT, UPDATE limité
- User : SELECT uniquement

### Table `contacts`

| Colonne           | Type                | Description                          |
| ----------------- | ------------------- | ------------------------------------ |
| `id`              | `uuid`              | PK                                   |
| `organisation_id` | `uuid`              | FK → organisations                   |
| `first_name`      | `text`              | Prénom                               |
| `last_name`       | `text`              | Nom                                  |
| `email`           | `text`              | Email principal                      |
| `phone`           | `text`              | Téléphone principal                  |
| `role`            | `contact_role_type` | principal, billing, commercial, etc. |

### Table `individual_customers`

| Colonne           | Type   | Description                          |
| ----------------- | ------ | ------------------------------------ |
| `id`              | `uuid` | PK                                   |
| `organisation_id` | `uuid` | FK → organisations (type='customer') |
| `first_name`      | `text` | Prénom client B2C                    |
| `last_name`       | `text` | Nom client B2C                       |
| `email`           | `text` | Email                                |
| `phone`           | `text` | Téléphone                            |

---

## 🧪 Tests Validés

### E2E Tests (Playwright)

✅ **test-organisations.spec.ts** :

- Création fournisseur avec catégorie
- Création client B2B
- Modification organisation
- Toggle favori
- Archivage/Restauration
- Navigation pagination

**Console Errors** : ✅ 0 errors
**Performance** : ✅ Page load <1.5s

---

## 🎨 UI/UX Patterns

### Grid Layout 4×3

```typescript
// Grille responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {organisations.map(org => (
    <OrganisationCard key={org.id} organisation={org} />
  ))}
</div>
```

### Pagination Custom

```typescript
// Boutons 1, 2, 3, 4, 5 au lieu de Previous/Next
<div className="flex gap-2">
  {[1, 2, 3, 4, 5].map(page => (
    <Button onClick={() => setPage(page)}>
      {page}
    </Button>
  ))}
</div>
```

### Toggle Favoris

```typescript
// Coeur plein/vide
<Button onClick={() => toggleFavorite(org.id)}>
  {isFavorite ? <Heart fill="red" /> : <Heart />}
</Button>
```

---

## 📚 Best Practices

### Naming Database vs Frontend

```typescript
// ✅ BON : Utiliser noms database
legal_name  → legalName  (frontend camelCase)
trade_name  → tradeName
siren       → siren

// ❌ MAUVAIS : Créer colonnes alternatives
company_name (n'existe pas dans DB)
```

### Types Supabase Générés

```typescript
// ✅ BON
import { Database } from '@/types/supabase';
type Organisation = Database['public']['Tables']['organisations']['Row'];

// ❌ MAUVAIS
type Organisation = { id: string; name: string }; // Type manuel
```

### Réutilisation Hooks

```typescript
// ✅ BON : use-organisations pour tout
const { organisations } = useOrganisations({ type: 'supplier' });
const { organisations: customers } = useOrganisations({ type: 'customer' });

// ❌ MAUVAIS : Créer use-suppliers-list, use-customers-list (duplication)
```

---

## 🔒 Protection

**Ce module est VERROUILLÉ** (voir `PROTECTED_FILES.json` + `.github/CODEOWNERS`).

Toute modification requiert :

1. Autorisation @owner ou @tech-lead
2. PR avec review obligatoire
3. Tests E2E validés
4. Console errors = 0

---

## 🚀 Next Steps (Hors Phase 1)

- [ ] Export CSV organisations
- [ ] Import CSV contacts
- [ ] Historique modifications
- [ ] Notes & annotations
- [ ] Documents attachés (factures, contrats)

---

**Dernière Mise à Jour** : 2025-10-24
**Précision** : 100% (basé sur code validé Phase 1)
**Mainteneur** : Vérone Dev Team
