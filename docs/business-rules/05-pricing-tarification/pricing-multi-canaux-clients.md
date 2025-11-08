# 💰 Règles Métier - Système Pricing Multi-Canaux & Clients

**Date**: 10 octobre 2025
**Statut**: ✅ Implémenté - Phase 1
**Version**: 1.0.0

---

## 🎯 Objectifs Business

### **Vision Stratégique**

Permettre une tarification flexible et intelligente pour s'adapter aux différents segments clients et canaux de distribution :

1. **Prix par Canal de Vente** : Tarifs différenciés selon le canal (retail, wholesale, ecommerce, b2b)
2. **Prix par Client** : Contrats spécifiques avec tarifs négociés et validés
3. **Remises Promotionnelles** : Campagnes RFA (Remise Fin d'Affaire) sur commande totale
4. **Waterfall Pricing** : Système de priorités intelligent pour calcul prix optimal

---

## 🏗️ Architecture Système

### **Tables Créées**

#### 1. **`sales_channels`** - Définition Canaux de Vente

```sql
id                      UUID PRIMARY KEY
code                    VARCHAR(50) UNIQUE  -- 'retail', 'wholesale', 'ecommerce', 'b2b'
name                    VARCHAR(100)
default_discount_rate   DECIMAL(4,3)       -- Remise par défaut (ex: 0.150 = 15%)
is_active               BOOLEAN
min_order_value         DECIMAL(10,2)      -- Montant minimum commande
display_order           INTEGER
icon_name               VARCHAR(50)
```

**Canaux Initiaux (Seed Data)** :

- `retail` : Vente Détail (magasin physique/showroom)
- `wholesale` : Vente en Gros (MOQ élevé, -20% discount par défaut)
- `ecommerce` : E-Commerce B2C (particuliers)
- `b2b` : Plateforme B2B (-15% discount par défaut)

#### 2. **`channel_pricing`** - Prix Produits par Canal

```sql
id                UUID PRIMARY KEY
product_id        UUID REFERENCES products(id)
channel_id        UUID REFERENCES sales_channels(id)
custom_price_ht   DECIMAL(10,2)  -- Prix fixe spécifique
discount_rate     DECIMAL(4,3)   -- OU remise sur prix base
markup_rate       DECIMAL(4,3)   -- OU majoration sur prix base
min_quantity      INTEGER        -- Palier quantité
valid_from        DATE
valid_until       DATE
is_active         BOOLEAN
```

**Modes Tarifaires Exclusifs** :

- `custom_price_ht` : Prix fixe (ex: 150.00€ HT)
- `discount_rate` : Remise (ex: 0.20 = -20%)
- `markup_rate` : Majoration (ex: 0.30 = +30%)
- `NULL` : Hériter prix base produit

**Contrainte** : Un seul mode actif par ligne (exclusivité mutuelle)

#### 3. **`customer_pricing`** - Prix Clients Spécifiques

```sql
id                  UUID PRIMARY KEY
customer_id         UUID             -- Polymorphic (organisations OU individual_customers)
customer_type       VARCHAR(20)      -- 'organization' ou 'individual'
product_id          UUID REFERENCES products(id)
custom_price_ht     DECIMAL(10,2)    -- Prix fixe contractuel
discount_rate       DECIMAL(4,3)     -- OU remise contractuelle
contract_reference  VARCHAR(100)     -- Référence contrat cadre
min_quantity        INTEGER          -- MOQ contrat
valid_from          DATE             -- Début validité contrat
valid_until         DATE             -- Fin validité (NULL = indéfini)
is_active           BOOLEAN
approval_status     VARCHAR(20)      -- 'pending', 'approved', 'rejected'
approved_by         UUID REFERENCES auth.users(id)
approved_at         TIMESTAMPTZ
```

**Workflow Validation** :

1. Commercial crée customer_pricing (`approval_status = 'pending'`)
2. Admin/Owner approuve (`approval_status = 'approved'`)
3. Prix devient actif et prioritaire sur autres tarifs
4. Traçabilité complète (approved_by, approved_at)

#### 4. **`order_discounts`** - Remises RFA (Remise Fin d'Affaire)

```sql
id                          UUID PRIMARY KEY
code                        VARCHAR(50) UNIQUE  -- 'RFA-2025-Q1', 'WINTER-SALE'
name                        VARCHAR(100)
discount_type               VARCHAR(20)         -- 'percentage' ou 'fixed_amount'
discount_value              DECIMAL(10,2)       -- Valeur remise
min_order_amount            DECIMAL(10,2)       -- Montant minimum éligible
max_discount_amount         DECIMAL(10,2)       -- Plafond remise
applicable_channels         UUID[]              -- Canaux éligibles (NULL = tous)
applicable_customer_types   VARCHAR(20)[]       -- Types clients éligibles
valid_from                  DATE
valid_until                 DATE
max_uses_total              INTEGER             -- Limite globale
max_uses_per_customer       INTEGER             -- Limite par client
current_uses                INTEGER             -- Usage actuel
is_active                   BOOLEAN
requires_code               BOOLEAN             -- Si code promo à saisir
is_combinable               BOOLEAN             -- Cumulable avec autres remises
```

**Exemples Remises** :

- **RFA-2025-Q1** : 15% sur commandes >1000€, wholesale uniquement, 100 utilisations max
- **WINTER-SALE** : 50€ de remise fixe sur commandes >500€, tous canaux, cumulable
- **B2B-LAUNCH** : 20% sur première commande B2B, non cumulable, code requis

---

## ⚡ Waterfall Pricing - Règles de Priorité

### **Algorithme de Calcul Prix**

Fonction PostgreSQL : `calculate_product_price()`

```
PRIORITÉ 1: customer_pricing (prix client spécifique)
  ├─ Si contrat actif ET approuvé ET date valide ET quantité ≥ min_quantity
  ├─ Retourne custom_price_ht OU (base_price × (1 - discount_rate))
  └─ Source: 'customer_pricing'

PRIORITÉ 2: channel_pricing (prix par canal)
  ├─ Si pricing canal actif ET date valide ET quantité ≥ min_quantity
  ├─ Retourne custom_price_ht OU (base_price × (1 - discount_rate)) OU (base_price × (1 + markup_rate))
  └─ Source: 'channel_pricing'

PRIORITÉ 3: product_packages (conditionnement avec discount)
  ├─ Si package actif ET quantité ≥ base_quantity
  ├─ Retourne unit_price_ht OU (base_price × (1 - discount_rate))
  └─ Source: 'package'

FALLBACK: products.price_ht (prix de base)
  ├─ Prix base produit sans remise
  └─ Source: 'base'
```

### **Exemple Concret**

**Produit** : Fauteuil FMIL-BEIGE-05, `price_ht = 250.00€`

**Contexte 1** : Client particulier, canal e-commerce, quantité 1

- ✅ Pas de customer_pricing
- ✅ Pas de channel_pricing (ecommerce hérite prix base)
- ✅ Pas de package (quantité 1)
- **Résultat** : `250.00€` (source: 'base')

**Contexte 2** : Client B2B sans contrat, canal b2b, quantité 1

- ✅ Pas de customer_pricing
- ✅ Channel b2b : `default_discount_rate = 0.15` (-15%)
- ✅ Pas de pricing spécifique produit dans channel_pricing
- **Résultat** : `212.50€` (250 × 0.85, source: 'channel_pricing')

**Contexte 3** : Client B2B avec contrat cadre, quantité 10

- ✅ `customer_pricing` actif : `discount_rate = 0.25` (-25%), `min_quantity = 5`
- **Résultat** : `187.50€` (250 × 0.75, source: 'customer_pricing')
- 🚫 Ignore channel_pricing (priorité inférieure)

**Contexte 4** : Client wholesale, quantité 50

- ✅ Pas de customer_pricing
- ✅ `channel_pricing` wholesale : `custom_price_ht = 180.00€`, `min_quantity = 20`
- **Résultat** : `180.00€` (source: 'channel_pricing')

---

## 🔐 Sécurité & Permissions

### **Row Level Security (RLS)**

#### **sales_channels**

- **SELECT** : Tous utilisateurs authentifiés
- **INSERT/UPDATE/DELETE** : Owner + Admin uniquement

#### **channel_pricing**

- **SELECT** : Tous utilisateurs authentifiés
- **INSERT/UPDATE/DELETE** : Owner + Admin + Catalog Manager

#### **customer_pricing**

- **SELECT** : Tous utilisateurs authentifiés
- **INSERT/UPDATE/DELETE** : Owner + Admin uniquement (validation requise)

#### **order_discounts**

- **SELECT** : Tous utilisateurs authentifiés
- **INSERT/UPDATE/DELETE** : Owner + Admin uniquement

### **Validation Workflow**

**Customer Pricing** :

1. Commercial crée contrat (`approval_status = 'pending'`)
2. Admin/Owner review et approuve
3. État passe à `'approved'` avec traçabilité
4. Prix devient actif immédiatement

**Sécurité Fonction RPC** :

- `calculate_product_price()` : `SECURITY DEFINER`
- Accessible via Supabase RPC authentifié
- Logs automatiques de tous calculs

---

## 📊 Cas d'Usage Métier

### **Cas 1 : Client B2B avec Contrat Annuel**

**Besoin** : Fournisseur de décoration "Déco Pro" avec contrat cadre 2025

**Configuration** :

```sql
INSERT INTO customer_pricing (
  customer_id, customer_type, product_id,
  discount_rate, contract_reference,
  valid_from, valid_until,
  approval_status
) VALUES (
  'uuid-deco-pro', 'organization', 'uuid-fauteuil',
  0.30, 'CONTRAT-2025-DECOPRO',
  '2025-01-01', '2025-12-31',
  'approved'
);
```

**Résultat** :

- Toutes commandes Déco Pro = -30% automatique
- Valide uniquement année 2025
- Priorité MAX (ignore canal et packages)

### **Cas 2 : Canal Wholesale avec Paliers Quantités**

**Besoin** : Prix dégressifs wholesale selon quantités

**Configuration** :

```sql
-- Palier 1: 20-49 unités = -20%
INSERT INTO channel_pricing (
  product_id, channel_id,
  discount_rate, min_quantity
) VALUES (
  'uuid-fauteuil', 'uuid-wholesale',
  0.20, 20
);

-- Palier 2: 50+ unités = prix fixe 180€
INSERT INTO channel_pricing (
  product_id, channel_id,
  custom_price_ht, min_quantity
) VALUES (
  'uuid-fauteuil', 'uuid-wholesale',
  180.00, 50
);
```

**Résultat** :

- 1-19 unités : Prix base (ou discount canal par défaut)
- 20-49 unités : -20%
- 50+ unités : 180€ fixe

### **Cas 3 : Campagne RFA Fin de Saison**

**Besoin** : Liquidation stock hiver 2025

**Configuration** :

```sql
INSERT INTO order_discounts (
  code, name, discount_type, discount_value,
  min_order_amount, applicable_channels,
  valid_from, valid_until,
  max_uses_total, is_combinable
) VALUES (
  'RFA-HIVER-2025', 'Remise Fin Saison Hiver',
  'percentage', 25.00,
  500.00, ARRAY['retail', 'ecommerce']::UUID[],
  '2025-02-01', '2025-02-28',
  200, FALSE
);
```

**Résultat** :

- 25% remise sur commande totale
- Minimum 500€ de commande
- Retail + E-commerce uniquement
- 200 utilisations max
- Non cumulable avec autres remises

---

## 🚀 API & Intégration

### **Hook React : `use-pricing.ts`**

```typescript
import { useProductPrice, useSalesChannels } from '@/hooks/use-pricing';

// Calcul prix single product
const { data: pricing, isLoading } = useProductPrice({
  productId: 'uuid-product',
  customerId: 'uuid-customer',
  customerType: 'organization',
  channelId: 'uuid-channel',
  quantity: 10,
});

// Résultat:
// pricing = {
//   final_price_ht: 187.50,
//   pricing_source: 'customer_pricing',
//   discount_applied: 0.25,
//   original_price_ht: 250.00
// }
```

### **API Route : `/api/pricing/calculate`**

#### **POST - Batch Pricing**

```bash
POST /api/pricing/calculate
Content-Type: application/json

{
  "items": [
    {
      "productId": "uuid-1",
      "customerId": "uuid-customer",
      "channelId": "uuid-channel",
      "quantity": 10
    },
    {
      "productId": "uuid-2",
      "quantity": 1
    }
  ]
}

# Response:
{
  "success": true,
  "results": [
    {
      "productId": "uuid-1",
      "pricing": {
        "final_price_ht": 187.50,
        "pricing_source": "customer_pricing",
        "discount_applied": 0.25,
        "original_price_ht": 250.00
      }
    },
    {
      "productId": "uuid-2",
      "pricing": {
        "final_price_ht": 120.00,
        "pricing_source": "base",
        "discount_applied": 0.00,
        "original_price_ht": 120.00
      }
    }
  ],
  "stats": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "duration": 245
  }
}
```

#### **GET - Single Product**

```bash
GET /api/pricing/calculate?productId=uuid-1&customerId=uuid-customer&channelId=uuid-channel&quantity=10

# Response:
{
  "success": true,
  "productId": "uuid-1",
  "pricing": {
    "final_price_ht": 187.50,
    "pricing_source": "customer_pricing",
    "discount_applied": 0.25,
    "original_price_ht": 250.00
  },
  "duration": 123
}
```

---

## 📈 Performance & Index

### **Index Critiques Créés**

```sql
-- Lookup pricing par customer (queries fréquentes)
CREATE INDEX idx_customer_pricing_lookup ON customer_pricing(
  customer_id, customer_type, product_id, approval_status, is_active
) WHERE approval_status = 'approved' AND is_active = TRUE;

-- Lookup pricing par channel (queries fréquentes)
CREATE INDEX idx_channel_pricing_lookup ON channel_pricing(
  product_id, channel_id, min_quantity, is_active
) WHERE is_active = TRUE;

-- Validité temporelle (date range queries)
CREATE INDEX idx_customer_pricing_validity ON customer_pricing(
  valid_from, valid_until
) WHERE is_active = TRUE;

CREATE INDEX idx_channel_pricing_validity ON channel_pricing(
  valid_from, valid_until
) WHERE is_active = TRUE;
```

### **Targets Performance**

- Fonction `calculate_product_price()` : **<50ms** (1 produit)
- Hook `useProductPrice` cache : **5 minutes** stale time
- API batch pricing : **<500ms** (10 produits parallèles)
- Query planning optimal via index composés

---

## ✅ Validation & Tests

### **Checklist Implémentation**

- [x] Migration SQL créée (`20251010_001_sales_channels_pricing_system.sql`)
- [x] 4 tables créées (sales_channels, channel_pricing, customer_pricing, order_discounts)
- [x] Fonction `calculate_product_price()` opérationnelle
- [x] RLS policies activées et testées
- [x] Seed data 4 canaux par défaut
- [x] Hook React `use-pricing.ts` avec cache
- [x] API route `/api/pricing/calculate` (GET + POST)
- [x] Index performance optimisés
- [x] Documentation manifests complète

### **Tests à Effectuer**

#### **Test 1 : Waterfall Pricing**

```sql
-- Base price
SELECT * FROM calculate_product_price(
  p_product_id := 'uuid-product',
  p_quantity := 1
);
-- Résultat attendu: source='base', prix=250.00

-- Channel pricing
SELECT * FROM calculate_product_price(
  p_product_id := 'uuid-product',
  p_channel_id := 'uuid-b2b',
  p_quantity := 1
);
-- Résultat attendu: source='channel_pricing', prix=212.50 (-15%)

-- Customer pricing (priorité)
SELECT * FROM calculate_product_price(
  p_product_id := 'uuid-product',
  p_customer_id := 'uuid-customer',
  p_customer_type := 'organization',
  p_channel_id := 'uuid-b2b',
  p_quantity := 10
);
-- Résultat attendu: source='customer_pricing', prix=187.50 (-25%)
```

#### **Test 2 : Paliers Quantités**

```sql
-- Quantité 1 : prix base
SELECT * FROM calculate_product_price('uuid-product', quantity := 1);

-- Quantité 25 : discount 20%
SELECT * FROM calculate_product_price('uuid-product', 'uuid-wholesale', quantity := 25);

-- Quantité 50+ : prix fixe 180€
SELECT * FROM calculate_product_price('uuid-product', 'uuid-wholesale', quantity := 50);
```

#### **Test 3 : Validation Workflow**

```sql
-- 1. Créer customer pricing pending
INSERT INTO customer_pricing (..., approval_status = 'pending');

-- 2. Vérifier non actif
SELECT * FROM calculate_product_price(...);
-- Résultat: customer_pricing ignoré (pas approved)

-- 3. Approuver
UPDATE customer_pricing SET approval_status = 'approved', approved_by = auth.uid();

-- 4. Vérifier actif
SELECT * FROM calculate_product_price(...);
-- Résultat: customer_pricing actif
```

---

## 🔮 Phase 2 - Fonctionnalités Futures

### **Hors Périmètre Actuel** (À implémenter plus tard)

1. **Points Fidélité** (Clients Particuliers)
   - Système accumulation points par commande
   - Conversion points → remises
   - Paliers fidélité (bronze, argent, or)

2. **Système Affiliation/Franchise**
   - Marge revendeur configurable par client
   - Calcul automatique commission
   - Paiement différentiel (ex: produit 100€, vendu 110€, versement 10€)

3. **Prix Dynamiques**
   - Ajustement automatique selon demande
   - Pricing saisonnier intelligent
   - A/B testing tarification

---

## 📚 Références

### **Fichiers Clés**

- Migration : `supabase/migrations/20251010_001_sales_channels_pricing_system.sql`
- Hook React : `src/hooks/use-pricing.ts`
- API Route : `src/app/api/pricing/calculate/route.ts`
- Documentation : `manifests/business-rules/pricing-multi-canaux-clients.md`

### **Business Rules Connexes**

- `manifests/business-rules/conditionnements-packages.md` (product_packages)
- `manifests/business-rules/roles-permissions-v1.md` (RLS policies)
- `manifests/prd/catalogue-partageable-mvp.md` (collections sans prix)

---

**Dernière mise à jour** : 10 octobre 2025
**Auteur** : Claude Code - Vérone Back Office
**Statut** : ✅ Phase 1 Implémentée et Documentée
