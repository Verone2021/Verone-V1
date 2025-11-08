# Plan Orchestration - Résolution 224 Erreurs TypeScript

**Date** : 2025-11-07
**Statut** : 224 erreurs restantes (975 → 573 → 224)
**Objectif** : Réduction systématique vers 0 erreur

---

## Contexte Historique Prouvé

### Succès Antérieurs

- **JOUR 4** : Scripts automatisés → 975 → 573 erreurs (-41%)
- **Agent typescript-fixer** : Corrections TS2307 → 573 → 224 erreurs (-61%)
- **Patterns qui ONT FONCTIONNÉ** :
  1. Scripts automatisés (fix-all-hook-imports.js, generate-missing-reexports.js)
  2. Barrel exports complets avec types (index.ts)
  3. Re-exports pour backward compatibility
  4. Mapping exhaustif hooks → modules

### Contraintes ABSOLUES

- ❌ NE PAS inventer de nouveaux patterns
- ❌ NE PAS utiliser `any` (types stricts uniquement)
- ✅ S'inspirer des scripts existants dans /scripts/
- ✅ Utiliser patterns barrel exports prouvés
- ✅ Compléter les exports manquants comme fait pour hooks

---

## Distribution Actuelle des Erreurs

```
TS2339 : 122 erreurs (54.5%) - Property does not exist
TS2345 : 42 erreurs  (18.8%) - Argument type not assignable
TS2305 : 21 erreurs  (9.4%)  - No exported member
TS2322 : 9 erreurs   (4.0%)  - Type not assignable
TS2769 : 3 erreurs   (1.3%)  - No overload matches
TS2724 : 3 erreurs   (1.3%)  - No exported member (named)
TS2304 : 1 erreur    (0.4%)  - Cannot find name
TS2552 : 4 erreurs   (1.8%)  - Cannot find name (typo)
Autres : ~19 erreurs (8.5%)
```

### Analyse par Module

- **Notifications** : 36 erreurs (TS2339 - Notification type conflict)
- **Orders** : 45+ erreurs (exports manquants + types)
- **Customers** : 20+ erreurs (Contact type mismatch)
- **Products** : 15+ erreurs (exports manquants)
- **Admin** : 10+ erreurs (type assignability)
- **Autres modules** : ~98 erreurs

---

## PHASE P0 - EXPORTS MANQUANTS (PRIORITÉ CRITIQUE)

**Objectif** : Résoudre les 21 erreurs TS2305 (No exported member)
**Impact attendu** : 224 → ~200 erreurs (-24 erreurs via effet cascade)
**Durée estimée** : 2-3 heures

### Erreurs Ciblées

#### Orders Module (10 erreurs)

```typescript
// src/shared/modules/orders/hooks/index.ts
❌ CreatePurchaseOrderData    (use-purchase-orders.ts)
❌ CreateSalesOrderData        (use-sales-orders.ts - trouve implémentation réelle)
❌ SalesOrderForShipment       (use-sales-shipments.ts)
❌ OrderItem                   (use-order-items.ts)
❌ useSalesOrders             (use-sales-orders.ts - re-export circulaire)
❌ SalesOrder                 (use-sales-orders.ts)
❌ SalesOrderStatus           (use-sales-orders.ts)
❌ SalesOrderItem             (use-sales-orders.ts)
❌ SalesShipmentFilters       (use-sales-shipments.ts)
```

#### Organisations Module (1 erreur)

```typescript
// src/shared/modules/organisations/hooks/index.ts
❌ CreateOrganisationData      (use-organisations.ts)
```

#### Products Module (3 erreurs)

```typescript
// src/shared/modules/products/hooks/index.ts
❌ Product                     (use-products.ts)

// src/shared/modules/products/components/modals/index.ts
❌ SourcingProductModal        (EditSourcingProductModal.tsx - renommage)

// src/shared/modules/common/hooks/index.ts
❌ Product                     (re-export depuis products)
```

#### Wizard Components (7 erreurs)

```typescript
// src/components/business/complete-product-wizard.tsx
❌ WizardFormData              (manquant ou non exporté)
```

#### Customers Module (1 erreur)

```typescript
// src/components/business/customer-selector.tsx
❌ UnifiedCustomer             (manquant ou non exporté)
```

### Stratégie (Pattern Prouvé : Barrel Exports)

**Script automatique à créer** : `/scripts/fix-missing-type-exports.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping: Module → Fichier source → Types manquants
const MISSING_EXPORTS = {
  'src/shared/modules/orders/hooks/index.ts': [
    { file: 'use-purchase-orders.ts', types: ['CreatePurchaseOrderData'] },
    { file: 'use-sales-shipments.ts', types: ['SalesOrderForShipment'] },
    { file: 'use-order-items.ts', types: ['OrderItem'] },
  ],
  'src/shared/modules/organisations/hooks/index.ts': [
    { file: 'use-organisations.ts', types: ['CreateOrganisationData'] },
  ],
  'src/shared/modules/products/hooks/index.ts': [
    { file: 'use-products.ts', types: ['Product'] },
  ],
};

// Logique:
// 1. Lire fichier source
// 2. Détecter types exportés (export type X, export interface Y)
// 3. Vérifier présence dans barrel index.ts
// 4. Ajouter lignes manquantes au format:
//    export { useHook, type Type1, type Type2 } from './file'
```

### Actions Manuelles (Cas Spéciaux)

#### 1. use-sales-orders.ts (Re-export circulaire)

```bash
# Problème: use-sales-orders.ts fait 213 octets = re-export uniquement
# Action: Trouver implémentation réelle

# Recherche
find src/hooks -name "*sales-orders*"
grep -r "export.*useSalesOrders" src/ --exclude-dir=node_modules

# Si implémentation dans src/hooks/use-sales-orders.ts:
# → Copier types vers src/shared/modules/orders/hooks/use-sales-orders.ts
# → Mettre à jour barrel export
```

#### 2. WizardFormData (7 erreurs wizard sections)

```bash
# Vérifier export dans complete-product-wizard.tsx
grep "export.*WizardFormData" src/components/business/complete-product-wizard.tsx

# Si type existe mais pas exporté:
# → Ajouter export type WizardFormData = ...

# Si type n'existe pas:
# → Créer interface WizardFormData basée sur usage dans sections
```

#### 3. UnifiedCustomer (customer-selector.tsx)

```bash
# Vérifier définition
grep "UnifiedCustomer" src/components/business/customer-selector.tsx

# Action: Exporter type manquant
```

### Critères de Validation

```bash
# 1. Type-check après chaque fix
npm run type-check 2>&1 | grep "TS2305" | wc -l
# Doit diminuer progressivement

# 2. Vérification import résolu
npm run type-check 2>&1 | grep "CreatePurchaseOrderData"
# Ne doit plus apparaître

# 3. Build success
npm run build
# Doit passer sans erreur

# 4. Export final count
npm run type-check 2>&1 | tee ts-errors-post-p0.log
# Comparer avec ts-errors-current.log
```

### Résultat Attendu

- ✅ 21 erreurs TS2305 résolues directement
- ✅ ~3-5 erreurs TS2339 résolues en cascade (types maintenant disponibles)
- ✅ État final : ~200 erreurs
- ✅ Tous les barrel exports complets avec types nécessaires

---

## PHASE P1 - NOTIFICATION TYPE CONFLICT (CRITIQUE)

**Objectif** : Résoudre les 36 erreurs TS2339 sur type Notification
**Impact attendu** : ~200 → ~165 erreurs (-35 erreurs)
**Durée estimée** : 3-4 heures

### Problème Identifié

**Conflit entre 2 types Notification** :

#### Type UI (NotificationWidget.tsx)

```typescript
export interface Notification {
  id: string;
  type: NotificationType; // ← 'success' | 'warning' | 'error' | 'info'
  title: string;
  message: string;
  timestamp: string; // ← Pas created_at
  dismissed?: boolean; // ← Pas read
  autoClose?: boolean;
  duration?: number;
  action?: {
    // ← Objet, pas action_url/action_label
    label: string;
    handler: () => void;
  };
}
```

#### Type Database (Supabase - supposé)

```typescript
// Propriétés utilisées dans le code mais non présentes dans type UI
interface NotificationDB {
  severity: string; // ← Utilisé, n'existe pas dans UI type
  created_at: string; // ← Utilisé, n'existe pas dans UI type
  read: boolean; // ← Utilisé, n'existe pas dans UI type
  action_url?: string; // ← Utilisé, n'existe pas dans UI type
  action_label?: string; // ← Utilisé, n'existe pas dans UI type
}
```

### Erreurs Détectées (36 total)

#### Dans /app/notifications/page.tsx (12 erreurs)

```typescript
notification.severity; // TS2339: Property 'severity' does not exist
notification.created_at; // TS2339: Property 'created_at' does not exist
notification.read; // TS2339: Property 'read' does not exist
notification.action_url; // TS2339: Property 'action_url' does not exist
notification.action_label; // TS2339: Property 'action_label' does not exist
useNotifications().unreadCount; // TS2339: Property 'unreadCount' does not exist
useNotifications().loading; // TS2339: Property 'loading' does not exist
useNotifications().markAsRead; // TS2339: Property 'markAsRead' does not exist
useNotifications().markAllAsRead; // TS2339: Property 'markAllAsRead' does not exist
useNotifications().deleteNotification; // TS2339: Property 'deleteNotification' does not exist
```

#### Dans NotificationsDropdown.tsx (24 erreurs)

Même pattern d'erreurs que page.tsx

### Stratégie (Pattern Prouvé : Type Unification)

**Option 1 - Unified Type (RECOMMANDÉ)**

Créer un type unifié qui gère les deux cas d'usage :

```typescript
// src/shared/modules/notifications/types/notification.ts

export type NotificationType = 'success' | 'warning' | 'error' | 'info';
export type NotificationSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Type unifié Notification
 * Supporte à la fois UI (NotificationWidget) et Database (Supabase)
 */
export interface Notification {
  // Champs communs
  id: string;
  title: string;
  message: string;

  // UI fields (avec fallback database)
  type: NotificationType;
  timestamp: string; // UI primary, fallback created_at
  dismissed?: boolean; // UI primary, fallback !read

  // Database fields (optionnels pour UI)
  severity?: NotificationSeverity;
  created_at?: string; // Database primary
  read?: boolean; // Database primary
  action_url?: string;
  action_label?: string;

  // UI-only fields
  autoClose?: boolean;
  duration?: number;
  action?: {
    label: string;
    handler: () => void;
  };
}

/**
 * Helper: Convertir DB → UI
 */
export function notificationDbToUi(db: any): Notification {
  return {
    id: db.id,
    title: db.title,
    message: db.message,
    type: severityToType(db.severity),
    timestamp: db.created_at,
    dismissed: !db.read,
    severity: db.severity,
    created_at: db.created_at,
    read: db.read,
    action_url: db.action_url,
    action_label: db.action_label,
  };
}

function severityToType(severity?: string): NotificationType {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    default:
      return 'info';
  }
}
```

**Option 2 - Separate Types with Discriminated Union**

Si les cas d'usage sont vraiment distincts :

```typescript
export type NotificationUI = {
  source: 'ui';
  id: string;
  type: NotificationType;
  timestamp: string;
  dismissed?: boolean;
  // ... UI fields
};

export type NotificationDB = {
  source: 'db';
  id: string;
  severity: NotificationSeverity;
  created_at: string;
  read: boolean;
  // ... DB fields
};

export type Notification = NotificationUI | NotificationDB;
```

### Actions Détaillées

#### 1. Créer le type unifié

```bash
# Créer fichier types
mkdir -p src/shared/modules/notifications/types
touch src/shared/modules/notifications/types/notification.ts

# Implémenter type unifié (voir ci-dessus)
```

#### 2. Mettre à jour NotificationWidget.tsx

```typescript
// AVANT
export interface Notification { ... }

// APRÈS
import { Notification, NotificationType } from '../../types/notification'
export type { Notification, NotificationType } // Re-export
```

#### 3. Mettre à jour use-notifications.ts

```typescript
// AVANT
export {
  useNotifications,
  type Notification,
} from '../components/widgets/NotificationWidget';

// APRÈS
export { useNotifications } from '../components/widgets/NotificationWidget';
export type { Notification, NotificationType } from '../types/notification';
```

#### 4. Enrichir le hook useNotifications

```typescript
// Ajouter méthodes manquantes
interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number; // ← AJOUTER
  loading: boolean; // ← AJOUTER
  markAsRead: (id: string) => void; // ← AJOUTER
  markAllAsRead: () => void; // ← AJOUTER
  deleteNotification: (id: string) => void; // ← AJOUTER
  // ... méthodes existantes
}
```

#### 5. Adapter le code consommateur

```typescript
// Dans /app/notifications/page.tsx et NotificationsDropdown.tsx

// AVANT
notification.severity; // ❌ erreur
notification.created_at; // ❌ erreur
notification.read; // ❌ erreur

// APRÈS (avec type unifié)
notification.severity; // ✅ string | undefined
notification.created_at; // ✅ string | undefined
notification.read; // ✅ boolean | undefined

// Avec fallbacks sécurisés
const displayTime = notification.timestamp || notification.created_at;
const isRead = notification.dismissed ?? !notification.read;
```

### Critères de Validation

```bash
# 1. Zero TS2339 sur Notification
npm run type-check 2>&1 | grep "Notification.*TS2339"
# Doit être vide

# 2. Type-check global
npm run type-check 2>&1 | grep "TS2339" | wc -l
# Doit passer de 122 → ~86

# 3. Test fonctionnel notifications
# → Ouvrir /notifications
# → Vérifier affichage correct
# → Console = 0 errors
```

### Résultat Attendu

- ✅ 36 erreurs TS2339 sur Notification résolues
- ✅ Type unifié Notification réutilisable
- ✅ Hook useNotifications complet (unreadCount, loading, etc.)
- ✅ État final : ~165 erreurs

---

## PHASE P2 - CONTACT TYPE MISMATCH (HIGH PRIORITY)

**Objectif** : Résoudre les ~20 erreurs TS2322/TS2345 sur type Contact
**Impact attendu** : ~165 → ~145 erreurs (-20 erreurs)
**Durée estimée** : 2-3 heures

### Problème Identifié

**Type Contact incomplet** - Champs manquants détectés :

```typescript
// Erreurs indiquent que Contact utilisé manque:
preferred_communication_method;
accepts_marketing;
accepts_notifications;
language_preference;
// ... (2 autres champs)
```

### Erreurs Ciblées

#### ContactFormModal (2 erreurs)

```typescript
// src/components/business/contact-form-modal-wrapper.tsx(59,7)
// src/shared/modules/customers/components/sections/OrganisationContactsManager.tsx(262,11)
Type 'Contact | null' is not assignable to type 'Contact | null | undefined'.
  Type 'Contact' is missing properties from type 'Contact':
    preferred_communication_method, accepts_marketing, accepts_notifications,
    language_preference, ...
```

#### Contact Role Filters (16 erreurs)

```typescript
// Multiple fichiers utilisent contact roles comme "never" type
Argument of type '"Principal"' is not assignable to parameter of type 'never'
Argument of type '"Commercial"' is not assignable to parameter of type 'never'
Argument of type '"Facturation"' is not assignable to parameter of type 'never'
Argument of type '"Technique"' is not assignable to parameter of type 'never'
```

**Fichiers concernés** :

- `src/app/contacts-organisations/contacts/[contactId]/page.tsx` (4 erreurs)
- `src/app/contacts-organisations/contacts/page.tsx` (4 erreurs)
- `src/app/organisation/components/contacts-tab.tsx` (4 erreurs)
- `src/shared/modules/customers/components/sections/ContactRolesEditSection.tsx` (4 erreurs)

### Stratégie (Pattern Prouvé : Type Completion)

#### 1. Vérifier type Contact dans Supabase

```bash
# Extraire définition complète
grep -A 50 "contacts:" src/types/supabase.ts | head -60

# Comparer avec type utilisé
grep -A 30 "export.*Contact" src/shared/modules/organisations/hooks/use-contacts.ts
```

#### 2. Compléter le type Contact

```typescript
// src/shared/modules/organisations/hooks/use-contacts.ts

export interface Contact {
  // Champs existants
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  organisation_id: string;

  // Champs manquants (ajouter depuis Supabase types)
  preferred_communication_method?: string | null;
  accepts_marketing?: boolean | null;
  accepts_notifications?: boolean | null;
  language_preference?: string | null;
  is_primary_contact?: boolean | null;
  is_billing_contact?: boolean | null;
  is_commercial_contact?: boolean | null;
  is_technical_contact?: boolean | null;

  // Autres champs
  created_at?: string | null;
  updated_at?: string | null;
}
```

#### 3. Créer type ContactRole

```typescript
// src/shared/modules/organisations/types/contact-role.ts

export type ContactRole =
  | 'Principal'
  | 'Commercial'
  | 'Facturation'
  | 'Technique';

export const CONTACT_ROLES: ContactRole[] = [
  'Principal',
  'Commercial',
  'Facturation',
  'Technique',
];

export function isContactRole(value: string): value is ContactRole {
  return CONTACT_ROLES.includes(value as ContactRole);
}
```

#### 4. Mettre à jour les filtres de rôles

```typescript
// Dans chaque fichier avec erreurs "never"

// AVANT
const principalContacts = contacts.filter(
  c => c.is_primary_contact // Type inféré comme never
);

// APRÈS
import { ContactRole } from '@/shared/modules/organisations/types/contact-role';

const principalContacts = contacts.filter(
  (c): c is Contact & { is_primary_contact: true } =>
    c.is_primary_contact === true
);

// Ou utiliser helper
function filterByRole(contacts: Contact[], role: ContactRole): Contact[] {
  switch (role) {
    case 'Principal':
      return contacts.filter(c => c.is_primary_contact);
    case 'Commercial':
      return contacts.filter(c => c.is_commercial_contact);
    case 'Facturation':
      return contacts.filter(c => c.is_billing_contact);
    case 'Technique':
      return contacts.filter(c => c.is_technical_contact);
  }
}
```

### Actions Détaillées

```bash
# 1. Créer fichier types
mkdir -p src/shared/modules/organisations/types
touch src/shared/modules/organisations/types/contact-role.ts

# 2. Mettre à jour type Contact
# → Éditer src/shared/modules/organisations/hooks/use-contacts.ts
# → Ajouter champs manquants depuis Supabase types

# 3. Créer script fix-contact-role-filters.js
# → Scanner fichiers avec pattern filter(c => c.is_*_contact)
# → Remplacer par helper filterByRole()

# 4. Mettre à jour barrel exports
# → src/shared/modules/organisations/hooks/index.ts
#   export type { Contact, ContactRole } from './use-contacts'
```

### Critères de Validation

```bash
# 1. Zero TS2322 sur Contact
npm run type-check 2>&1 | grep "Contact.*TS2322"

# 2. Zero type never sur roles
npm run type-check 2>&1 | grep "never.*Principal\|Commercial\|Facturation\|Technique"

# 3. Type-check global
npm run type-check 2>&1 | grep "TS2345\|TS2322" | wc -l
# Doit diminuer de ~20
```

### Résultat Attendu

- ✅ Type Contact complet avec tous les champs
- ✅ ContactRole type défini et utilisé
- ✅ 20 erreurs TS2322/TS2345 résolues
- ✅ État final : ~145 erreurs

---

## PHASE P3 - REMAINING TYPE INCOMPATIBILITIES (CLEANUP)

**Objectif** : Résoudre les ~145 erreurs restantes
**Impact attendu** : ~145 → 0 erreurs
**Durée estimée** : 5-8 heures

### Erreurs par Famille

#### Famille A : Orders Module (~40 erreurs)

```typescript
// PurchaseOrderFormModal.tsx
Property 'eco_tax_vat_rate' does not exist on type PurchaseOrder

// SalesOrderFormModal.tsx
Cannot find name 'setProductSearchTerm'
Cannot find name 'products'

// UniversalOrderDetailsModal.tsx
Property 'customer_type' does not exist (après fix eco_tax_vat_rate)
Property 'customer_id' does not exist

// ShippingManagerModal.tsx (5 erreurs TS2322)
Type '{ selected: string | null; onSelect: ... }' not assignable
Type '{ order: SalesOrder; onComplete: ... }' not assignable
```

**Stratégie** :

1. Vérifier schema Supabase pour eco_tax_vat_rate
2. Compléter types PurchaseOrder et SalesOrder
3. Fixer variables manquantes (products, setProductSearchTerm)
4. Typer correctement props components shipping

#### Famille B : Customers Module (~15 erreurs)

```typescript
// CustomerFormModal.tsx (3 erreurs)
Type '{ name: string; type: "customer"; email: string | null; ... }'
  not assignable to 'UpdateOrganisationData'
  → email: string | null vs string | undefined

Property 'legal_name' missing in type

Resolver type incompatibility

// create-individual-customer-modal.tsx
Partial<CreateIndividualCustomerData>[] not assignable
  → email: string | undefined vs string

// OrganisationListView.tsx
Type '"xs"' not assignable to '"sm" | "md" | "lg" | "xl"'
```

**Stratégie** :

1. Harmoniser null vs undefined (choisir undefined partout)
2. Ajouter legal_name obligatoire dans CreateOrganisationData
3. Fixer Resolver type avec correct typing
4. Ajouter "xs" au type size accepté

#### Famille C : Products & UI (~20 erreurs)

```typescript
// Wizard sections (7 erreurs) → Résolues en P0 normalement
// QuickVariantForm.tsx (4 erreurs)
Argument of type 'string' not assignable to parameter of type 'never'

// CollectionFormModal.tsx
Property 'onImageUpload' does not exist

// ProductCard.tsx
Module has no exported member 'ProductCard' (did you mean ProductCardV2?)

// SubcategorySearchSelector.tsx
Argument of type 'string' not assignable to 'never'

// IdentifiersCompleteEditSection.tsx
Type '"default"' not assignable to Button variant
```

**Stratégie** :

1. Typer correctement arrays dans QuickVariantForm
2. Ajouter onImageUpload prop à CollectionImageUpload
3. Renommer import ProductCard → ProductCardV2
4. Fixer type inference dans SubcategorySearchSelector
5. Remplacer "default" → "secondary" dans Button variant

#### Famille D : Admin & Testing (~10 erreurs)

```typescript
// use-automation-triggers.ts
Argument of type 'any' not assignable to 'never'
Argument of type '{ action: ...; success: ...; }' not assignable to 'never'

// use-mcp-resolution.ts
Argument of type '{ type: string; message: string; }' not assignable to 'never'
```

**Stratégie** :

1. Définir types AutomationResult, AutomationLog
2. Définir type MCPResolutionEvent
3. Remplacer array inférés comme never[] par typed arrays

#### Famille E : Miscellaneous (~15 erreurs)

```typescript
// admin/users/page.tsx (6 erreurs)
Map constructor type incompatibility
Property 'id', 'email', etc. does not exist on type '{}'

// ConsultationOrderInterface.tsx
Module has no exported member 'ConsultationItem'
Module has no exported member 'SourcingProductModal'

// AddressInput.tsx
Module has no exported member 'UnifiedCustomer' → Résolu en P0

// EditableOrderItemRow.tsx
Module has no exported member 'OrderItem' → Résolu en P0
```

**Stratégie** :

1. Typer correctement userRoleMap avec explicit types
2. Exporter ConsultationItem depuis hooks
3. Renommer SourcingProductModal → EditSourcingProductModal
4. Vérifier résolution P0 pour exports manquants

### Plan d'Exécution P3

```typescript
// Ordre recommandé (du plus impactant au moins)

1. Orders Module (40 erreurs)
   - Compléter schema types (eco_tax_vat_rate, customer_*)
   - Fixer variables manquantes
   - Typer props shipping modals

2. Customers Module (15 erreurs)
   - Standardiser null → undefined
   - Compléter CreateOrganisationData
   - Fixer Resolver typing

3. Products & UI (20 erreurs)
   - Arrays typing (QuickVariantForm)
   - Props missing (CollectionFormModal)
   - Import renames (ProductCard)

4. Admin & Testing (10 erreurs)
   - Créer types events/logs
   - Remplacer never[] par typed arrays

5. Miscellaneous (15 erreurs)
   - User roles Map typing
   - Exports manquants restants
   - Variant types corrections
```

### Script Automatique P3

```javascript
// scripts/fix-remaining-type-errors.js

const FIXES = {
  // Null → Undefined standardization
  nullToUndefined: {
    pattern: /email:\s*string\s*\|\s*null/g,
    replacement: 'email: string | undefined',
  },

  // Button variant "default" → "secondary"
  buttonVariant: {
    pattern: /variant="default"/g,
    replacement: 'variant="secondary"',
  },

  // Import renames
  imports: [
    { from: 'ProductCard', to: 'ProductCardV2', module: 'product-card-v2' },
    {
      from: 'SourcingProductModal',
      to: 'EditSourcingProductModal',
      module: 'EditSourcingProductModal',
    },
  ],
};

// Logique similaire à fix-all-hook-imports.js
// → Scan + Replace + Validate
```

### Critères de Validation P3

```bash
# Après chaque sous-famille (A, B, C, D, E)
npm run type-check 2>&1 | tee ts-errors-p3-progress.log

# Validation finale
npm run type-check
# → 0 errors

npm run build
# → Build successful

# Console errors test
# → MCP Playwright Browser test sur pages principales
# → Console = 0 errors
```

### Résultat Attendu

- ✅ TOUTES les 224 erreurs TypeScript résolues
- ✅ Build successful
- ✅ Type safety complet
- ✅ Console = 0 errors sur toutes les pages

---

## Ressources & Scripts

### Scripts Existants à Réutiliser

```bash
/scripts/fix-all-hook-imports.js           # Pattern: Import replacement
/scripts/generate-missing-reexports.js     # Pattern: Barrel exports
```

### Nouveaux Scripts à Créer

```bash
/scripts/fix-missing-type-exports.js       # P0: Exports types manquants
/scripts/fix-contact-role-filters.js       # P2: Contact role typing
/scripts/fix-remaining-type-errors.js      # P3: Corrections automatisables
/scripts/cluster-ts-errors-by-family.js    # Utilitaire: Clustering erreurs
```

### Fichiers de Suivi

```bash
ts-errors-current.log                      # État initial (224 erreurs)
ts-errors-post-p0.log                      # Post P0 (~200 erreurs)
ts-errors-post-p1.log                      # Post P1 (~165 erreurs)
ts-errors-post-p2.log                      # Post P2 (~145 erreurs)
ts-errors-final.log                        # Post P3 (0 erreurs)

TS_ERRORS_PROGRESS.md                      # Suivi détaillé par phase
```

---

## Timeline Estimée

| Phase                  | Durée      | Erreurs Start | Erreurs End | Delta    |
| ---------------------- | ---------- | ------------- | ----------- | -------- |
| P0 - Exports manquants | 2-3h       | 224           | ~200        | -24      |
| P1 - Notification type | 3-4h       | ~200          | ~165        | -35      |
| P2 - Contact type      | 2-3h       | ~165          | ~145        | -20      |
| P3 - Remaining         | 5-8h       | ~145          | 0           | -145     |
| **TOTAL**              | **12-18h** | **224**       | **0**       | **-224** |

---

## Critères de Succès Globaux

### Techniques

- ✅ `npm run type-check` → 0 erreurs
- ✅ `npm run build` → Success
- ✅ `npm run lint` → 0 errors
- ✅ Tous les barrel exports complets avec types

### Fonctionnels

- ✅ Console = 0 errors sur toutes les pages testées
- ✅ Aucune régression fonctionnelle
- ✅ Performance maintenue (<2s dashboard)

### Documentation

- ✅ TS_ERRORS_PROGRESS.md à jour
- ✅ Scripts documentés dans /scripts/README.md
- ✅ Types exportés documentés dans barrel index.ts
- ✅ Learnings capturés dans process-learnings/

---

## Workflow d'Exécution

### Pour Chaque Phase (P0 → P3)

```bash
# 1. ANALYSE
npm run type-check 2>&1 | grep "TS230X" > ts-errors-phase-X.log
# Analyser erreurs ciblées

# 2. IMPLÉMENTATION
# → Créer/exécuter scripts automatiques
# → Corrections manuelles si nécessaire

# 3. VALIDATION INCRÉMENTALE
npm run type-check 2>&1 | wc -l
# Vérifier diminution progressive

# 4. VALIDATION FINALE PHASE
npm run type-check 2>&1 | tee ts-errors-post-pX.log
npm run build
# Build doit passer

# 5. TEST FONCTIONNEL
# MCP Playwright Browser sur pages modifiées
# Console = 0 errors

# 6. DOCUMENTATION
# Mettre à jour TS_ERRORS_PROGRESS.md
# Capturer learnings

# 7. COMMIT (AVEC AUTORISATION)
git add .
git commit -m "fix(types): Phase PX - Description"
# ATTENDRE autorisation explicite avant push
```

### Pattern de Commit par Phase

```bash
# P0
git commit -m "fix(types): Complete barrel exports with missing types - 224→200 errors

- Add CreatePurchaseOrderData, SalesOrderForShipment exports
- Add CreateOrganisationData to organisations barrel
- Add Product type to products/common barrels
- Export WizardFormData from complete-product-wizard
- Fix use-sales-orders circular re-export

Phase: P0 - Exports manquants
Errors: 224 → ~200 (-24)
"

# P1
git commit -m "fix(types): Unify Notification type for UI and Database - 200→165 errors

- Create unified Notification type with UI + DB fields
- Add useNotifications missing methods (unreadCount, loading, markAsRead)
- Update NotificationWidget to use unified type
- Add notificationDbToUi converter helper

Phase: P1 - Notification type conflict
Errors: ~200 → ~165 (-35)
"

# P2
git commit -m "fix(types): Complete Contact type and add ContactRole - 165→145 errors

- Add missing Contact fields from Supabase schema
- Create ContactRole type for role filters
- Fix contact role filters type inference
- Update ContactFormModal with complete type

Phase: P2 - Contact type mismatch
Errors: ~165 → ~145 (-20)
"

# P3
git commit -m "fix(types): Resolve all remaining type incompatibilities - 145→0 errors

Orders:
- Add eco_tax_vat_rate to PurchaseOrder type
- Fix SalesOrderFormModal missing variables
- Type ShippingManagerModal props correctly

Customers:
- Standardize null → undefined for optional fields
- Add legal_name to CreateOrganisationData
- Fix Resolver type incompatibility

Products & UI:
- Type QuickVariantForm arrays correctly
- Add onImageUpload prop to CollectionImageUpload
- Rename ProductCard → ProductCardV2 imports

Admin & Testing:
- Create AutomationResult and MCPResolutionEvent types
- Replace inferred never[] with typed arrays

Miscellaneous:
- Type userRoleMap explicitly in admin/users
- Export ConsultationItem and fix import renames

Phase: P3 - Remaining type incompatibilities
Errors: ~145 → 0 (-145)

🎉 TypeScript errors: 975 → 573 → 224 → 0 (100% résolu)
"
```

---

## Notes Importantes

### Règles d'Or

1. **JAMAIS** utiliser `any` - types stricts uniquement
2. **TOUJOURS** valider avec `npm run type-check` après chaque modification
3. **TOUJOURS** tester fonctionnellement avec MCP Browser
4. **TOUJOURS** demander autorisation AVANT commit/push
5. **TOUJOURS** documenter dans TS_ERRORS_PROGRESS.md

### En Cas de Blocage

1. Revenir au pattern qui a fonctionné (scripts + barrel exports)
2. Analyser erreur avec contexte complet (fichier source + usage)
3. Chercher pattern similaire résolu dans commits précédents
4. Ne pas inventer de nouveau pattern - adapter l'existant

### Validation Continue

```bash
# Après chaque fix significatif
npm run type-check 2>&1 | head -20
# Vérifier que nouvelles erreurs n'apparaissent pas

# Test build régulier
npm run build
# Ne doit jamais échouer
```

---

**Version** : 1.0.0
**Date création** : 2025-11-07
**Auteur** : Claude Code (Vérone Orchestrator)
**Basé sur** : Patterns prouvés migration monorepo JOUR 4 + typescript-fixer agent
