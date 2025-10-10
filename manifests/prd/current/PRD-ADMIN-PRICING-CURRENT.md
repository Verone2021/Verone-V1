# PRD Admin Pricing Multi-Canaux Current — État Actuel Implémenté

> **Version**: Production 2025-10-10
> **Statut**: ✅ COMPLET - EN PRODUCTION
> **Fichier Source**: `src/app/admin/pricing/lists/[id]/page.tsx`
> **SLO Performance**: <2s chargement

---

## 🎯 Vue d'Ensemble

### Description Actuelle
Système complet de pricing multi-canaux permettant différenciation tarifaire par canal vente (B2B, B2C, retail, wholesale), tarifs clients spécifiques contractuels, groupes clients, et résolution priorité automatique. Architecture waterfall pricing avec fallback intelligent.

### Données Production
- **5 listes de prix** actives (2025-10-10)
- **57 items prix** configurés
- **4 canaux vente** : b2b, ecommerce, retail, wholesale
- **5 groupes clients** configurés
- **8 liens canal ↔ price list**
- **0 prix clients** spécifiques (feature prête, données à venir)

### Scope Implémenté
- ✅ **Listes de prix multiples** (base, channel, customer, group)
- ✅ **Prix par canal vente** (4 canaux configurés)
- ✅ **Prix clients spécifiques** (contrats personnalisés)
- ✅ **Groupes clients** (tarifs groupés)
- ✅ **Système priorités** (résolution automatique prix)
- ✅ **Dates validité** (prix temporaires start/end)
- ✅ **Interface admin** (CRUD listes + items)

---

## 📊 Features Implémentées

### 1. Listes de Prix (Price Lists)
```typescript
type PriceListType =
  | 'base'      // Prix catalogue de base (fallback)
  | 'channel'   // Prix spécifique canal vente
  | 'customer'  // Prix client individuel
  | 'group'     // Prix groupe clients

interface PriceList {
  id: string
  code: string              // WHOLESALE_STANDARD_2025
  name: string              // "Wholesale Standard 2025"
  list_type: PriceListType
  priority: number          // Plus bas = priorité haute
  currency: 'EUR'
  is_active: boolean
  valid_from?: Date
  valid_until?: Date
  description?: string
}
```

**Listes Production** :
- `WHOLESALE_STANDARD_2025` (priority: 150, type: channel)
- `B2B_STANDARD_2025` (priority: 180, type: channel)
- `RETAIL_STANDARD_2025` (priority: 200, type: channel)
- `ECOMMERCE_STANDARD_2025` (priority: 200, type: channel)
- `CATALOG_BASE_2025` (priority: 1000, type: base) ← Fallback

### 2. Items Prix (Price List Items)
```typescript
interface PriceListItem {
  id: string
  price_list_id: string
  product_id: string
  price_ht: number          // Prix HT fixe
  min_quantity?: number     // Palier quantité (ex: 10+ unités)
  valid_from?: Date
  valid_until?: Date
  is_active: boolean

  // Relations
  products: Product
  price_lists: PriceList
}
```

**57 items configurés** (2025-10-10) répartis sur 5 listes

### 3. Canaux Vente (Sales Channels)
```typescript
interface SalesChannel {
  id: string
  code: string              // 'b2b', 'retail', 'wholesale', 'ecommerce'
  name: string
  default_discount_rate: number  // 0.15 = 15% remise
  min_order_value?: number       // Montant minimum commande
  is_active: boolean
  display_order: number
  icon_name?: string
}
```

**4 canaux production** :
- `b2b` : Plateforme B2B professionnelle
- `ecommerce` : E-Commerce B2C particuliers
- `retail` : Vente détail magasin/showroom
- `wholesale` : Vente en gros (MOQ élevé)

### 4. Channel Price Lists (Liens Canal ↔ Liste Prix)
```typescript
interface ChannelPriceList {
  id: string
  channel_id: string
  price_list_id: string
  priority: number          // Ordre résolution (100 = priorité haute)
  is_default: boolean       // Liste par défaut canal
  is_active: boolean
}
```

**Configuration production** :
```sql
-- Chaque canal a 2 listes :
-- 1. Liste spécifique canal (priority: 100, is_default: true)
-- 2. Catalogue Base fallback (priority: 1000, is_default: false)

b2b → B2B_STANDARD_2025 (100) → CATALOG_BASE_2025 (1000)
ecommerce → ECOMMERCE_STANDARD_2025 (100) → CATALOG_BASE_2025 (1000)
retail → RETAIL_STANDARD_2025 (100) → CATALOG_BASE_2025 (1000)
wholesale → WHOLESALE_STANDARD_2025 (100) → CATALOG_BASE_2025 (1000)
```

### 5. Groupes Clients (Customer Groups)
```typescript
interface CustomerGroup {
  id: string
  code: string              // 'VIP_GOLD', 'DISTRIBUTORS'
  name: string
  default_discount_rate: number  // Remise groupe
  min_order_value?: number
  is_active: boolean
  description?: string
}
```

**5 groupes production** (configurés, données clients à venir)

### 6. Prix Clients Spécifiques (Customer Price Lists)
```typescript
interface CustomerPriceList {
  id: string
  customer_id: string       // FK organisations/individual_customers
  customer_type: 'organization' | 'individual'
  price_list_id: string
  priority: number          // Plus bas = priorité haute
  is_active: boolean
  valid_from?: Date
  valid_until?: Date
}
```

**Status** : Table créée, aucune donnée production (feature prête)

### 7. Système Priorités (Waterfall Pricing)

**Algorithme Résolution Prix** :
```typescript
// Ordre priorité (1 = priorité max)
1. Prix client spécifique (customer_price_lists) ← Contrat
2. Prix groupe client (customer_groups)
3. Prix canal vente (channel_price_lists)
4. Prix base catalogue (CATALOG_BASE_2025) ← Fallback

// Fonction résolution
function resolvePrice(
  productId: string,
  customerId?: string,
  channelCode?: string,
  quantity = 1
): number {
  // 1. Check customer-specific price
  if (customerId) {
    const customerPrice = getCustomerPrice(productId, customerId, quantity)
    if (customerPrice) return customerPrice
  }

  // 2. Check customer group price
  if (customerId) {
    const groupPrice = getGroupPrice(productId, customerId, quantity)
    if (groupPrice) return groupPrice
  }

  // 3. Check channel price
  if (channelCode) {
    const channelPrice = getChannelPrice(productId, channelCode, quantity)
    if (channelPrice) return channelPrice
  }

  // 4. Fallback: base catalog price
  return getBaseCatalogPrice(productId, quantity)
}
```

**Conditions Validation** :
- Prix actif : `is_active = true`
- Dates valides : `NOW() BETWEEN valid_from AND valid_until`
- Quantité suffisante : `quantity >= min_quantity`

---

## 🎨 Design System Appliqué

### Composants UI
- **Table Listes Prix** : Dense, tri, filtres, pagination
- **Form Items Prix** : Ajout/édition items inline
- **Badge Priorités** : Couleur conditionnelle par type
- **Modal Détails** : Liste complète + configuration

### Icons Lucide
- `DollarSign` - Pricing
- `Tag` - Listes prix
- `Users` - Groupes clients
- `Percent` - Remises
- `Calendar` - Dates validité
- `TrendingUp` - Prix canal
- `Award` - Prix VIP

### Couleurs Types
```typescript
priceListTypeColors = {
  base: 'gray',
  channel: 'blue',
  customer: 'purple',
  group: 'green'
}

priorityBadge = priority < 100 ? 'red' : priority < 500 ? 'yellow' : 'green'
```

---

## 🔧 Implémentation Technique

### Hook Principal
```typescript
const {
  priceLists,           // PriceList[] actives
  priceListItems,       // PriceListItem[] pour liste sélectionnée
  channels,             // SalesChannel[] 4 canaux
  customerGroups,       // CustomerGroup[] 5 groupes
  loading,
  error,
  createPriceList,      // (data) => Promise
  updatePriceListItem,  // (itemId, data) => Promise
  deletePriceListItem,  // (itemId) => Promise
  resolvePriceForProduct // (productId, context) => number
} = usePricingSystem()
```

### Tables BDD Complètes

**price_lists** (listes maîtres) :
```sql
Colonnes clés:
- code (unique, ex: WHOLESALE_STANDARD_2025)
- name, list_type, priority
- currency (EUR défaut)
- is_active, valid_from, valid_until
```

**price_list_items** (57+ items) :
```sql
Colonnes:
- price_list_id (FK price_lists)
- product_id (FK products)
- price_ht (montant HT)
- min_quantity (palier quantité, nullable)
- valid_from, valid_until
- is_active
```

**sales_channels** (4 canaux) :
```sql
Colonnes:
- code (unique: b2b, ecommerce, retail, wholesale)
- name, default_discount_rate
- min_order_value, is_active
- display_order, icon_name
```

**channel_price_lists** (8 liens) :
```sql
Colonnes:
- channel_id (FK sales_channels)
- price_list_id (FK price_lists)
- priority (100 = défaut, 1000 = fallback)
- is_default, is_active
```

**customer_price_lists** (0 items - prêt) :
```sql
Colonnes:
- customer_id (polymorphique)
- customer_type ('organization' | 'individual')
- price_list_id (FK price_lists)
- priority, is_active
- valid_from, valid_until
```

**customer_groups** (5 groupes) :
```sql
Colonnes:
- code (unique: VIP_GOLD, DISTRIBUTORS, etc.)
- name, default_discount_rate
- min_order_value, is_active
- description
```

---

## 📋 Business Rules Appliquées

### Règle 1 : Priorités Strictes (Waterfall)
```typescript
// Ordre résolution OBLIGATOIRE
1. Customer-specific (priority 1-49)
2. Customer group (priority 50-99)
3. Channel (priority 100-499)
4. Base catalog (priority 1000)

// Jamais skip de niveau sauf si inactif/invalide
```

### Règle 2 : Dates Validité
```typescript
// Prix valide si
valid_from <= NOW() <= valid_until
// OU
valid_from <= NOW() AND valid_until IS NULL
// OU
valid_from IS NULL AND valid_until >= NOW()
```

### Règle 3 : Paliers Quantité
```typescript
// Prix item si
quantity >= min_quantity
// OU
min_quantity IS NULL (aucune contrainte)

// Si multiples items match (différents paliers)
→ Sélectionner palier le plus élevé <= quantity
```

### Règle 4 : Canaux Isolation
```typescript
// Chaque canal a liste indépendante
b2b → Liste B2B (pas accès retail/wholesale)
retail → Liste Retail (pas accès b2b)
...

// Éviter pricing wars entre canaux
```

### Règle 5 : Fallback Obligatoire
```typescript
// Catalogue Base (CATALOG_BASE_2025)
- priority: 1000 (plus bas)
- Tous produits DOIVENT avoir prix base
- Garantit résolution prix TOUJOURS réussie
```

**Business Rules File** : `manifests/business-rules/pricing-multi-canaux-clients.md`

---

## 🚧 Limitations Connues & Roadmap

### Limitations Actuelles
- ❌ Pas de pricing dynamique (ML forecasting)
- ❌ Pas de remises promotionnelles temporaires (RFA)
- ❌ Pas de pricing par variante produit
- ❌ Pas de prix dégressifs automatiques (quantité)

### Roadmap 2025-Q4

**Priorité 1** (2 semaines) :
- [ ] Remises promotionnelles (RFA - Remise Fin d'Affaire)
- [ ] Prix dégressifs par quantité (paliers automatiques)
- [ ] Import/export Excel listes prix

**Priorité 2** (1 mois) :
- [ ] Pricing par variante produit
- [ ] Historique modifications prix (audit trail)
- [ ] Simulation pricing (preview prix avant activation)

**Priorité 3** (3 mois) :
- [ ] Pricing dynamique ML (optimisation marge)
- [ ] Pricing concurrence (monitoring marché)
- [ ] Analytics pricing (performance listes)

---

## 🔗 Dépendances & Relations

### Modules Liés
- **Catalogue** (`/catalogue`) - Affichage prix par canal
- **Commandes** (`/commandes/clients`) - Application prix résolu
- **Organisations** (`/contacts-organisations`) - Clients B2B pricing
- **Finance** (`/finance`) - CA par liste prix

### Composants Utilisés
- `ChannelSelector` - Sélection canal dans catalogue
- `PriceDisplay` - Affichage prix résolu avec badge canal
- `PricingTable` - Table items prix admin

---

## 🧪 Tests & Validation

### Tests Actuels
- ✅ Résolution prix multi-canal validée
- ✅ Fallback catalogue base testé
- ✅ Dates validité fonctionnelles
- ✅ Paliers quantité validés

### Tests Manquants
- ⏳ Tests E2E workflow complet (création liste → ajout items → résolution)
- ⏳ Tests edge cases (prix égaux multi-listes, dates overlap)
- ⏳ Tests performance (10 000+ items prix)

---

## 📚 Documentation Associée

### Fichiers Clés
- **Page** : `src/app/admin/pricing/lists/[id]/page.tsx`
- **Hook** : `src/hooks/use-pricing-system.ts`
- **Composants** : `src/components/business/channel-selector.tsx`
- **Business Rules** : `manifests/business-rules/pricing-multi-canaux-clients.md`

### Sessions
- `MEMORY-BANK/sessions/2025-10-10-MISSION-COMPLETE-systeme-prix-multi-canaux.md` - Implémentation système complet

---

**Dernière Mise à Jour** : 2025-10-10
**Maintenu Par** : Équipe Vérone
**Next Review** : 2025-10-24 (remises RFA + prix dégressifs)
