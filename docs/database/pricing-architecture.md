# Architecture Pricing Multi-Canal - Vérone CRM/ERP

**Dernière mise à jour** : 2025-10-25 (Ajout système ristourne)
**Pattern** : Pricing centralisé dans price_list_items (séparé de products)
**Canaux supportés** : 5 canaux actifs (B2B, E-Commerce, Wholesale, Retail, Base Catalog)

---

## 📊 VUE D'ENSEMBLE

### Principe Architectural

**Séparation Prix / Produits** :
```
products (données produit)
  ↓ NO direct price columns

price_list_items (tous les prix)
  ├─ cost_price (prix achat)
  ├─ price_ht (prix vente HT)
  ├─ suggested_retail_price (prix conseillé)
  └─ price_list_id (canal: B2B, B2C, etc.)
```

**Avantages** :
- ✅ Pricing multi-canal (prix différents par canal/client)
- ✅ Historique prix (versioning via price_list_history)
- ✅ Flexibilité promos/tarifs spéciaux
- ✅ Scalabilité internationale (multi-devise)
- ✅ Prix par quantité (tiered pricing)

---

## 🗄️ STRUCTURE DATABASE

### Table: price_list_items

**Colonnes (21 au total)** :

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| `price_list_id` | uuid | NO | - | FK vers price_lists.id (canal pricing) |
| `product_id` | uuid | NO | - | FK vers products.id |
| `price_ht` | numeric | NO | - | **Prix vente HT (obligatoire)** |
| `cost_price` | numeric | YES | - | Prix achat fournisseur (optionnel) |
| `suggested_retail_price` | numeric | YES | - | Prix conseillé public (optionnel) |
| `min_quantity` | integer | YES | 1 | Quantité minimum pour ce prix |
| `max_quantity` | integer | YES | - | Quantité maximum (NULL = illimité) |
| `currency` | varchar | YES | - | Devise (EUR par défaut si NULL) |
| `discount_rate` | numeric | YES | - | Taux remise (%) |
| `margin_rate` | numeric | YES | - | Taux marge (%) |
| `valid_from` | date | YES | - | Date début validité |
| `valid_until` | date | YES | - | Date fin validité |
| `is_active` | boolean | YES | true | Actif/Inactif |
| `notes` | text | YES | - | Notes internes |
| `tags` | text[] | YES | - | Tags pour filtrage |
| `attributes` | jsonb | YES | '{}' | Attributs custom JSON |
| `created_at` | timestamptz | YES | now() | Date création |
| `updated_at` | timestamptz | YES | now() | Date modification |
| `created_by` | uuid | YES | - | Utilisateur créateur |
| `updated_by` | uuid | YES | - | Utilisateur modificateur |

**Foreign Keys** :
```sql
price_list_items_price_list_id_fkey
  → price_lists(id) ON DELETE CASCADE

price_list_items_product_id_fkey
  → products(id) ON DELETE CASCADE
```

**Indexes (9 au total)** :
```sql
-- Index primaire
price_list_items_pkey (id) UNIQUE

-- Index unicité tiering prix
unique_price_tier (price_list_id, product_id, min_quantity) UNIQUE

-- Indexes performance
idx_price_items_lookup (product_id, price_list_id, min_quantity) WHERE is_active
idx_price_items_product (product_id) WHERE is_active
idx_price_items_list (price_list_id) WHERE is_active
idx_price_items_validity (valid_from, valid_until) WHERE is_active
idx_price_items_quantity (min_quantity, max_quantity)

-- Index BRIN pour archivage
idx_price_items_created_brin (created_at) USING BRIN

-- Index covering pour performance
idx_price_items_context_lookup
  (product_id, min_quantity, is_active)
  INCLUDE (price_ht, price_list_id)
  WHERE is_active
```

---

### Table: price_lists

**Colonnes (18 au total)** :

| Colonne | Type | Nullable | Default | Description |
|---------|------|----------|---------|-------------|
| `id` | uuid | NO | gen_random_uuid() | PK |
| `code` | varchar | NO | - | Code unique (ex: B2B_STANDARD_2025) |
| `name` | varchar | NO | - | Nom affichage |
| `description` | text | YES | - | Description liste prix |
| `list_type` | varchar | NO | - | Type: 'base', 'channel', 'customer', 'group' |
| `priority` | integer | NO | 100 | Priorité calcul (plus bas = priorité haute) |
| `currency` | varchar | YES | 'EUR' | Devise par défaut |
| `includes_tax` | boolean | YES | false | Prix TTC ou HT |
| `valid_from` | date | YES | - | Date début validité |
| `valid_until` | date | YES | - | Date fin validité |
| `is_active` | boolean | YES | true | Actif/Inactif |
| `requires_approval` | boolean | YES | false | Nécessite validation |
| `config` | jsonb | YES | '{}' | Configuration JSON |
| `product_count` | integer | YES | 0 | Nombre produits (dénormalisé) |
| `created_at` | timestamptz | YES | now() | Date création |
| `updated_at` | timestamptz | YES | now() | Date modification |
| `created_by` | uuid | YES | - | Utilisateur créateur |
| `updated_by` | uuid | YES | - | Utilisateur modificateur |

**Canaux configurés (au 2025-10-17)** :

| ID | Code | Name | Type | Active | Produits |
|----|------|------|------|--------|----------|
| `b379b981...` | CATALOG_BASE_2025 | Catalogue Base 2025 | base | ✅ | 16 |
| `06c85627...` | B2B_STANDARD_2025 | B2B Standard 2025 | channel | ✅ | 16 |
| `9e13c06d...` | WHOLESALE_STANDARD_2025 | Wholesale Standard 2025 | channel | ✅ | 16 |
| `15166345...` | RETAIL_STANDARD_2025 | Retail Standard 2025 | channel | ✅ | 0 |
| `dd9eee15...` | ECOMMERCE_STANDARD_2025 | E-Commerce Standard 2025 | channel | ✅ | 0 |

---

## 💰 BUSINESS RULES PRICING

### Règle 1 : Prix Multi-Canal

**Pattern** : Un produit peut avoir plusieurs prix selon le canal
```sql
-- Exemple : Produit X avec 3 prix différents
SELECT
  p.name,
  pl.code AS canal,
  pli.price_ht,
  pli.min_quantity,
  pli.max_quantity
FROM products p
JOIN price_list_items pli ON pli.product_id = p.id
JOIN price_lists pl ON pl.id = pli.price_list_id
WHERE p.id = 'product-uuid-example'
AND pli.is_active = true
ORDER BY pl.priority, pli.min_quantity;

-- Résultat attendu :
-- Product A | CATALOG_BASE_2025      | 150.00€ | 1   | NULL
-- Product A | B2B_STANDARD_2025      | 120.00€ | 1   | 99
-- Product A | B2B_STANDARD_2025      | 100.00€ | 100 | NULL
-- Product A | WHOLESALE_STANDARD_2025| 110.00€ | 1   | NULL
```

### Règle 2 : Calcul Prix Dynamique (RPC)

**Fonction** : `calculate_product_price_v2()`

**Signature** :
```sql
calculate_product_price_v2(
  p_product_id UUID,
  p_quantity INTEGER DEFAULT 1,
  p_channel_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_customer_type VARCHAR DEFAULT NULL,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  price_ht NUMERIC,
  original_price NUMERIC,
  discount_rate NUMERIC,
  price_list_id UUID,
  price_list_name VARCHAR,
  price_source VARCHAR,
  min_quantity INTEGER,
  max_quantity INTEGER,
  currency VARCHAR,
  margin_rate NUMERIC,
  notes TEXT
)
```

**Logique Priorité** :
1. **Prix Client** (customer_pricing) - PRIORITÉ MAX
2. **Prix Groupe Client** (group_price_lists)
3. **Prix Canal** (channel_pricing ou channel_price_lists)
4. **Prix Base** (price_list avec list_type='base')

**Exemple usage TypeScript** :
```typescript
const { data, error } = await supabase.rpc('calculate_product_price_v2', {
  p_product_id: 'uuid-produit',
  p_quantity: 50,
  p_channel_id: 'uuid-canal-b2b',
  p_customer_id: 'uuid-client-vip',  // Optionnel
  p_customer_type: 'professional',   // Optionnel
  p_date: '2025-10-17'               // Optionnel (défaut: aujourd'hui)
});

// Retour :
// {
//   price_ht: 100.00,
//   original_price: 120.00,
//   discount_rate: 16.67,
//   price_list_id: 'uuid...',
//   price_list_name: 'B2B Standard 2025',
//   price_source: 'channel',
//   min_quantity: 50,
//   max_quantity: null,
//   currency: 'EUR',
//   margin_rate: 35.5,
//   notes: 'Prix dégressif à partir de 50 unités'
// }
```

### Règle 3 : Tiered Pricing (Prix par Quantité)

**Pattern** : Prix différents selon quantité commandée
```sql
-- Configuration tiered pricing
INSERT INTO price_list_items (price_list_id, product_id, price_ht, min_quantity, max_quantity)
VALUES
  ('b2b-list-id', 'product-id', 150.00, 1, 49),      -- 1-49 unités : 150€
  ('b2b-list-id', 'product-id', 120.00, 50, 99),     -- 50-99 unités : 120€
  ('b2b-list-id', 'product-id', 100.00, 100, NULL);  -- 100+ unités : 100€

-- RPC calculate_product_price_v2() sélectionne automatiquement
-- le prix correspondant à la quantité demandée
```

### Règle 4 : Validité Temporelle

**Pattern** : Prix limités dans le temps (promotions)
```sql
-- Prix promo valide du 01/11 au 30/11/2025
INSERT INTO price_list_items (
  price_list_id, product_id, price_ht,
  valid_from, valid_until
) VALUES (
  'promo-list-id', 'product-id', 99.99,
  '2025-11-01', '2025-11-30'
);

-- RPC calculate_product_price_v2(p_date := '2025-11-15')
-- retournera 99.99€ si appelé dans la période
```

### Règle 5 : Fallback Prix

**Si produit sans prix dans price_list_items** :
1. RPC cherche prix liste par défaut (priority le plus bas)
2. Si aucun prix trouvé → Retourne NULL (pas d'erreur)
3. Frontend affiche "Prix non disponible" ou "Nous consulter"
4. Log warning dans monitoring (Sentry) pour tracking

### Règle 6 : Ristourne (Commission per-line) ⭐ NOUVEAU

**Pattern** : Commission % calculée par LIGNE de commande (pas par commande totale)

**Tables impliquées** :
- `customer_pricing.retrocession_rate` (configuration: 0-100%)
- `sales_order_items.retrocession_rate` (snapshot au moment commande)
- `sales_order_items.retrocession_amount` (montant calculé automatiquement)

**Business Logic** :
```sql
-- 1. Configuration ristourne au niveau client/produit
INSERT INTO customer_pricing (
  customer_id,
  product_id,
  custom_price_ht,
  retrocession_rate  -- ⭐ NOUVEAU : Taux de commission %
) VALUES (
  'client-uuid',
  'product-uuid',
  120.00,
  5.00  -- 5% de commission sur chaque ligne
);

-- 2. Lors de la création d'une ligne de commande:
-- Le trigger calculate_retrocession_amount() calcule automatiquement:
-- retrocession_amount = total_ht × (retrocession_rate / 100)

-- Exemple: Ligne à 1000€ HT avec 5% ristourne
-- → retrocession_amount = 1000 × 0.05 = 50.00€
```

**Calcul Automatique** :
```sql
-- Trigger: trg_calculate_retrocession (BEFORE INSERT/UPDATE)
-- Fonction: calculate_retrocession_amount()
-- Sur table: sales_order_items

-- Formule appliquée:
NEW.retrocession_amount := ROUND(
  NEW.total_ht * (NEW.retrocession_rate / 100),
  2
);

-- Si retrocession_rate NULL ou 0 → retrocession_amount = 0.00
```

**Commission Totale Commande** :
```sql
-- Fonction RPC: get_order_total_retrocession(order_id)
SELECT get_order_total_retrocession('uuid-commande');
-- Retourne: SUM(retrocession_amount) de toutes les lignes

-- Exemple commande avec 3 lignes:
-- Ligne 1: 1000€ HT × 5% = 50€
-- Ligne 2: 500€ HT × 5% = 25€
-- Ligne 3: 800€ HT × 3% = 24€
-- Commission totale = 99€
```

**Exemple Usage TypeScript** :
```typescript
// 1. Récupérer taux ristourne client/produit
const { data: pricing } = await supabase
  .from('customer_pricing')
  .select('retrocession_rate')
  .eq('customer_id', customerId)
  .eq('product_id', productId)
  .single();

// 2. Créer ligne commande (trigger calcule automatiquement)
const { data: orderLine } = await supabase
  .from('sales_order_items')
  .insert({
    sales_order_id: orderId,
    product_id: productId,
    quantity: 10,
    unit_price_ht: 120.00,
    total_ht: 1200.00,
    retrocession_rate: pricing.retrocession_rate || 0  // 5.00%
    // retrocession_amount sera calculé automatiquement = 60.00€
  })
  .select()
  .single();

// 3. Obtenir commission totale commande
const { data: totalCommission } = await supabase
  .rpc('get_order_total_retrocession', {
    p_order_id: orderId
  });

console.log(`Commission totale: ${totalCommission}€`);
```

**Contraintes Business** :
- ✅ Taux ristourne : 0-100% (contrainte CHECK)
- ✅ Montant ristourne : ≥ 0 (contrainte CHECK)
- ✅ Calcul automatique (trigger BEFORE INSERT/UPDATE)
- ✅ Commission par ligne (pas globale)
- ✅ Snapshot taux au moment commande (traçabilité)

**Migration Supabase** :
```sql
-- Ajoutée: 2025-10-25
-- Fichier: supabase/migrations/20251025_002_add_retrocession_system.sql
-- Colonnes: 3 nouvelles (1 customer_pricing + 2 sales_order_items)
-- Triggers: 1 nouveau (calculate_retrocession_amount)
-- Fonctions: 1 nouvelle RPC (get_order_total_retrocession)
```

**Cas d'usage B2B** :
1. **Revendeur avec commission fixe** : 5% sur tous produits
2. **Partenaire avec taux variable** : 3-10% selon produit
3. **Programme fidélité** : Taux évolutif selon volume
4. **Marketplace** : Commission plateforme par transaction

---

## 🔍 QUERIES COURANTES

### Query 1 : Prix produit par canal
```sql
SELECT
  p.id,
  p.name,
  p.sku,
  pl.code AS price_list_code,
  pl.name AS price_list_name,
  pli.price_ht,
  pli.cost_price,
  pli.suggested_retail_price,
  pli.min_quantity,
  pli.max_quantity,
  pli.currency
FROM products p
JOIN price_list_items pli ON pli.product_id = p.id
JOIN price_lists pl ON pl.id = pli.price_list_id
WHERE p.id = 'product-uuid'
  AND pli.is_active = true
  AND (pli.valid_from IS NULL OR pli.valid_from <= CURRENT_DATE)
  AND (pli.valid_until IS NULL OR pli.valid_until >= CURRENT_DATE)
ORDER BY pl.priority, pli.min_quantity;
```

### Query 2 : Produits sans prix (Data Quality)
```sql
SELECT
  p.id,
  p.name,
  p.sku,
  p.status,
  p.created_at
FROM products p
LEFT JOIN price_list_items pli ON pli.product_id = p.id
WHERE pli.id IS NULL
ORDER BY p.created_at DESC;

-- Résultat au 2025-10-17 : 2 produits sans prix
-- (produits de test/draft)
```

### Query 3 : Prix minimum/maximum par canal
```sql
SELECT
  pl.code AS canal,
  pl.name AS canal_name,
  MIN(pli.price_ht) AS prix_min,
  MAX(pli.price_ht) AS prix_max,
  AVG(pli.price_ht)::NUMERIC(10,2) AS prix_moyen,
  COUNT(DISTINCT pli.product_id) AS nb_produits
FROM price_list_items pli
JOIN price_lists pl ON pl.id = pli.price_list_id
WHERE pli.price_ht > 0
  AND pli.is_active = true
  AND pl.is_active = true
GROUP BY pl.id, pl.code, pl.name, pl.priority
ORDER BY pl.priority;
```

### Query 4 : Historique prix produit
```sql
-- Via price_list_history (si activé)
SELECT
  plh.changed_at,
  plh.old_price_ht,
  plh.new_price_ht,
  plh.change_reason,
  up.email AS changed_by_user
FROM price_list_history plh
JOIN price_list_items pli ON plh.price_list_item_id = pli.id
JOIN user_profiles up ON plh.changed_by = up.id
WHERE pli.product_id = 'product-uuid'
ORDER BY plh.changed_at DESC
LIMIT 10;
```

### Query 5 : Prix avec marge calculée
```sql
SELECT
  p.name,
  pl.code,
  pli.cost_price,
  pli.price_ht,
  pli.margin_rate AS margin_configured,
  CASE
    WHEN pli.cost_price > 0 AND pli.price_ht > 0
    THEN ROUND(((pli.price_ht - pli.cost_price) / pli.cost_price * 100)::NUMERIC, 2)
    ELSE NULL
  END AS margin_actual
FROM products p
JOIN price_list_items pli ON pli.product_id = p.id
JOIN price_lists pl ON pl.id = pli.price_list_id
WHERE pli.cost_price IS NOT NULL
  AND pli.cost_price > 0
ORDER BY margin_actual DESC;
```

---

## 📈 WORKFLOW GESTION PRIX

### Créer Prix Produit (Frontend)

```typescript
// Hook: use-pricing.ts
const { data, error } = await supabase
  .from('price_list_items')
  .insert({
    product_id: productId,
    price_list_id: priceListId,  // Ex: B2B_STANDARD_2025
    price_ht: 150.00,
    cost_price: 90.00,
    suggested_retail_price: 180.00,
    min_quantity: 1,
    max_quantity: null,  // Illimité
    currency: 'EUR',
    is_active: true,
    notes: 'Prix initial catalogue 2025'
  })
  .select();
```

### Mettre à Jour Prix (avec historique)

```typescript
// 1. Récupérer prix actuel
const { data: currentPrice } = await supabase
  .from('price_list_items')
  .select('*')
  .eq('product_id', productId)
  .eq('price_list_id', priceListId)
  .single();

// 2. Créer entrée historique (optionnel)
await supabase
  .from('price_list_history')
  .insert({
    price_list_item_id: currentPrice.id,
    old_price_ht: currentPrice.price_ht,
    new_price_ht: newPrice,
    change_reason: 'Ajustement saisonnier',
    changed_by: userId
  });

// 3. Mettre à jour prix
const { data, error } = await supabase
  .from('price_list_items')
  .update({
    price_ht: newPrice,
    updated_at: new Date().toISOString(),
    updated_by: userId
  })
  .eq('id', currentPrice.id);
```

### Obtenir Prix Display (Frontend)

```typescript
// Option 1 : RPC (RECOMMANDÉ - Gère priorités et tiering)
const { data: pricing } = await supabase.rpc('calculate_product_price_v2', {
  p_product_id: productId,
  p_quantity: quantity,
  p_channel_id: channelId,
  p_customer_id: customerId  // Optionnel
});

const displayPrice = pricing?.price_ht;
const priceSource = pricing?.price_source; // 'customer', 'channel', 'base'

// Option 2 : JOIN direct (si pas de calcul priorité nécessaire)
const { data } = await supabase
  .from('products')
  .select(`
    id, name, sku,
    price_list_items!inner (
      price_ht,
      cost_price,
      min_quantity,
      max_quantity,
      price_lists!inner (code, name)
    )
  `)
  .eq('id', productId)
  .eq('price_list_items.price_lists.code', 'B2B_STANDARD_2025')
  .eq('price_list_items.is_active', true)
  .single();

const displayPrice = data.price_list_items[0].price_ht;
```

### Créer Liste Prix Complète (Batch)

```typescript
// Créer nouvelle liste prix canal
const { data: newPriceList } = await supabase
  .from('price_lists')
  .insert({
    code: 'PROMO_BLACK_FRIDAY_2025',
    name: 'Promotion Black Friday 2025',
    list_type: 'channel',
    priority: 50,  // Priorité haute
    valid_from: '2025-11-25',
    valid_until: '2025-11-30',
    is_active: true
  })
  .select()
  .single();

// Batch insert prix pour tous produits (-20% sur base)
const { data: basePrice } = await supabase
  .from('price_list_items')
  .select('product_id, price_ht')
  .eq('price_list_id', 'CATALOG_BASE_2025');

const promoItems = basePrice.map(item => ({
  price_list_id: newPriceList.id,
  product_id: item.product_id,
  price_ht: item.price_ht * 0.8,  // -20%
  min_quantity: 1,
  currency: 'EUR',
  is_active: true,
  notes: 'Black Friday -20%'
}));

await supabase
  .from('price_list_items')
  .insert(promoItems);
```

---

## ⚠️ ANTI-PATTERNS À ÉVITER

### ❌ NE PAS ajouter champs prix dans products

**Interdit** :
```sql
ALTER TABLE products
ADD COLUMN price NUMERIC;        -- ❌ NON !
ADD COLUMN cost_price NUMERIC;   -- ❌ NON ! (Migration 20251017_003)
ADD COLUMN base_price NUMERIC;   -- ❌ NON !
```

**Raison** :
- Brise architecture multi-canal
- Pas de gestion priorités client/canal
- Pas d'historique prix
- Pas de tiered pricing
- Duplication données

**Utiliser** : `price_list_items` (déjà existant) ✅

**Historique hallucination** :
- **17 octobre 2025** : Agent a ajouté `products.cost_price`
- **Impact** : Incohérence données, confusion frontend
- **Fix** : Migration `20251017_003_remove_cost_price_column.sql`
- **Lesson** : TOUJOURS consulter `docs/database/best-practices.md` AVANT modification

### ❌ NE PAS bypasser calculate_product_price_v2

**Mauvais** :
```typescript
// ❌ Fragile - Pas de gestion priorités/tiering
const price = product.price_list_items?.[0]?.price_ht;
```

**Bon** :
```typescript
// ✅ Robuste - Gère priorités, tiering, validité
const { data: price } = await supabase.rpc('calculate_product_price_v2', {
  p_product_id: productId,
  p_quantity: quantity,
  p_channel_id: channelId
});
```

### ❌ NE PAS modifier prix manuellement sans historique

**Mauvais** :
```sql
-- ❌ Perte traçabilité
UPDATE price_list_items
SET price_ht = 99.99
WHERE id = 'uuid';
```

**Bon** :
```sql
-- ✅ Avec historique
BEGIN;

-- 1. Créer entrée historique
INSERT INTO price_list_history (
  price_list_item_id, old_price_ht, new_price_ht,
  change_reason, changed_by
)
SELECT id, price_ht, 99.99, 'Ajustement marché', 'user-uuid'
FROM price_list_items
WHERE id = 'uuid';

-- 2. Mettre à jour prix
UPDATE price_list_items
SET price_ht = 99.99, updated_at = now(), updated_by = 'user-uuid'
WHERE id = 'uuid';

COMMIT;
```

### ❌ NE PAS créer table `products_pricing` séparée

**Interdit** :
```sql
CREATE TABLE products_pricing (  -- ❌ NON !
  product_id UUID,
  price NUMERIC
);
```

**Raison** : Table `price_list_items` existe déjà avec architecture complète

**Utiliser** :
- `price_list_items` pour prix par canal/client
- `calculate_product_price_v2()` pour calcul dynamique

---

## 📊 STATISTIQUES ACTUELLES

**Données au 2025-10-17** :

- **Produits total** : 18
- **Produits avec prix** : 16 (88.9%)
- **Produits sans prix** : 2 (11.1% - produits draft/test)
- **Prix enregistrés** : 48 (dans price_list_items)
- **Canaux actifs** : 5 (price_lists)
- **Prix moyen** : Varie par canal (B2B < Wholesale < Retail)

**Canaux et couverture** :
```
CATALOG_BASE_2025       : 16 produits (base de référence)
B2B_STANDARD_2025       : 16 produits (prix professionnels)
WHOLESALE_STANDARD_2025 : 16 produits (prix grossistes)
RETAIL_STANDARD_2025    :  0 produits (à configurer)
ECOMMERCE_STANDARD_2025 :  0 produits (à configurer)
```

**Cohérence données** :
- ✅ **0 prix invalides** (≤ 0 ou NULL)
- ✅ **0 anomalies coût** (cost_price négatif)
- ✅ **RPC fonctionnel** (test validé)
- ✅ **Indexes optimisés** (9 indexes sur price_list_items)

**Performance** :
- Index covering `idx_price_items_context_lookup` pour queries fréquentes
- Index BRIN `idx_price_items_created_brin` pour archivage efficace
- Contrainte UNIQUE `unique_price_tier` prévient duplicatas

---

## 🔗 LIENS CONNEXES

### Documentation Database
- **[SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md)** - Structure complète 78 tables (voir § Pricing Multi-Canal)
- **[functions-rpc.md](./functions-rpc.md)** - RPC calculate_product_price_v2 détaillé
- **[best-practices.md](./best-practices.md)** - Anti-patterns pricing (§3 Prix Produits)
- **[triggers.md](./triggers.md)** - Triggers update_updated_at sur price_list_items
- **[foreign-keys.md](./foreign-keys.md)** - Relations price_lists ↔ price_list_items

### Modules Liés
- **Channel Pricing** : `channel_price_lists`, `channel_pricing`
- **Customer Pricing** : `customer_price_lists`, `customer_pricing`
- **Group Pricing** : `group_price_lists`
- **Historique** : `price_list_history`

### Architecture Système
```
price_lists (canaux)
  ↓ one-to-many
price_list_items (prix par produit/canal)
  ↓ many-to-one
products

Priorité calcul (calculate_product_price_v2):
1. customer_pricing (prix client individuel)
2. group_price_lists (prix groupe client)
3. channel_pricing (prix canal)
4. price_list_items (prix liste standard)
5. base price_list (fallback)
```

---

## 🚀 ÉVOLUTIONS FUTURES

### Phase 2 (Q1 2026) : Multi-Devise Complète
- Currency conversion automatique (API taux change)
- Prix par pays/région
- Gestion TVA multi-pays

### Phase 3 (Q2 2026) : Dynamic Pricing
- Pricing algorithmique (demande, stock, concurrence)
- A/B testing prix
- Pricing prédictif ML

### Phase 4 (Q3 2026) : Customer Intelligence
- Pricing personnalisé (historique achats)
- Recommandations prix optimaux
- Analytics marge par segment client

---

**Document créé** : 2025-10-17
**Dernière révision** : 2025-10-25 (v1.1 - Système ristourne)
**Auteur** : verone-database-architect agent
**Status** : ✅ Complet et validé

*Vérone Back Office - Architecture Pricing Multi-Canal 2025*
