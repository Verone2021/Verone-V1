# =� Database Best Practices - Anti-Hallucination Guide

**Guide de r�f�rence OBLIGATOIRE** pour toute modification de la base de donn�es V�rone.

---

## <� OBJECTIF

Pr�venir les **hallucinations IA** qui cr�ent :

- L Tables en double (`suppliers`, `customers`, etc.)
- L Colonnes en double (`cost_price`, `primary_image_url`, etc.)
- L Triggers/fonctions redondantes
- L Enums/contraintes dupliqu�es

**Probl�me historique rapport�** :

> _"� chaque fois, mon agent hallucine et cr�e des tables en plus. Par exemple, il cr�� une table `suppliers` alors qu'on a d�j� `organisations`."_

---

## =� WORKFLOW OBLIGATOIRE AVANT MODIFICATION

### �TAPE 1: CONSULTATION DOCUMENTATION (MANDATORY)

**TOUJOURS consulter dans cet ordre** :

```typescript
// 1. Lire SCHEMA-REFERENCE.md
Read('/Users/.../docs/database/SCHEMA-REFERENCE.md');

// 2. Rechercher table/colonne similaire
mcp__serena__search_for_pattern({
  pattern: 'supplier|customer|price',
  relative_path: 'docs/database/',
});

// 3. V�rifier triggers si modification colonnes calcul�es
Read('/Users/.../docs/database/triggers.md');

// 4. V�rifier FK si ajout relations
Read('/Users/.../docs/database/foreign-keys.md');

// 5. V�rifier enums si ajout contraintes
Read('/Users/.../docs/database/enums.md');
```

### �TAPE 2: VALIDATION AVEC UTILISATEUR

**SI DOUTE sur l'existence d'une structure** � DEMANDER CONFIRMATION

```typescript
AskUserQuestion({
  questions: [
    {
      question:
        "Je veux cr�er une table `suppliers`. J'ai vu `organisations WHERE type='supplier'` dans le sch�ma. Dois-je :",
      header: 'Table Supplier',
      options: [
        {
          label: 'Utiliser organisations',
          description:
            "Utiliser organisations avec type='supplier' (RECOMMAND�)",
        },
        {
          label: 'Cr�er nouvelle table',
          description:
            'Cr�er table suppliers s�par�e (NE PAS FAIRE sauf si explicite)',
        },
      ],
      multiSelect: false,
    },
  ],
});
```

### �TAPE 3: MIGRATION DOCUMENT�E

**JAMAIS modifier sch�ma sans migration SQL** :

```sql
-- Migration: supabase/migrations/YYYYMMDD_NNN_description.sql

--  BON EXEMPLE
-- 20251017_001_add_supplier_segment_to_organisations.sql

-- Ajouter colonne � table existante
ALTER TABLE organisations
ADD COLUMN supplier_segment supplier_segment_type DEFAULT 'approved';

-- Commentaire explicatif
COMMENT ON COLUMN organisations.supplier_segment IS
'Segmentation fournisseurs: strategic, preferred, approved, commodity, artisan. Utilis� uniquement si type=''supplier''.';
```

```sql
-- L MAUVAIS EXEMPLE
-- create_suppliers_table.sql (HALLUCINATION!)

CREATE TABLE suppliers (  -- L Table en double!
  id UUID PRIMARY KEY,
  name TEXT,
  segment TEXT           -- L Devrait utiliser enum existant
);
```

---

## =� ANTI-PATTERNS CRITIQUES

### 1. TABLES EN DOUBLE (HALLUCINATION FR�QUENTE)

#### L JAMAIS CR�ER CES TABLES

| Table Hallucination    |  Utiliser � La Place                                           | Raison                               |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------ |
| `suppliers`            | `organisations WHERE type='supplier'`                          | Table polymorphe existante           |
| `customers`            | `organisations WHERE type='customer'` + `individual_customers` | Syst�me dual B2B/B2C                 |
| `products_pricing`     | `price_list_items`                                             | Syst�me pricing multi-canal existant |
| `product_stock`        | `stock_movements` + triggers                                   | Stock calcul� automatiquement        |
| `user_roles`           | `user_profiles.role` (enum)                                    | Colonne + enum existant              |
| `categories_hierarchy` | `families` � `categories` � `subcategories`                    | Hi�rarchie 3 niveaux existante       |

####  V�RIFICATION AVANT CR�ATION TABLE

```sql
-- TOUJOURS ex�cuter ces requ�tes AVANT de cr�er une table

-- 1. V�rifier si table existe d�j�
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%supplier%';

-- 2. V�rifier si colonne dans table polymorphe
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%type%'
ORDER BY table_name;

-- 3. V�rifier enum pour valeurs contraintes
SELECT t.typname, e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%type%'
ORDER BY t.typname, e.enumsortorder;
```

---

### 2. COLONNES EN DOUBLE (HALLUCINATION FR�QUENTE)

#### L JAMAIS AJOUTER CES COLONNES

| Colonne Hallucination        |  Utiliser � La Place                                           | Raison                                                 |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| `products.cost_price`        | `price_list_items.cost_price`                                  | Prix dans syst�me price_lists (Migration 20251017_003) |
| `products.price_ht`          | `price_list_items.price_ht`                                    | Prix dans syst�me price_lists (N'A JAMAIS EXIST�)      |
| `products.base_price`        | `price_list_items.price_ht`                                    | Prix dans syst�me price_lists (N'A JAMAIS EXIST�)      |
| `products.sale_price`        | `price_list_items.sale_price` + `calculate_product_price_v2()` | Pricing multi-canal dynamique                          |
| `products.primary_image_url` | `product_images WHERE is_primary=true`                         | Images dans table d�di�e                               |
| `products.stock_quantity`    | Calcul� par trigger `maintain_stock_totals()`                  | Colonne calcul�e automatiquement                       |
| `sales_orders.total_amount`  | Calcul� par trigger `calculate_sales_order_total()`            | Colonne calcul�e automatiquement                       |
| `organisations.is_supplier`  | `organisations.type = 'supplier'`                              | Enum type existant                                     |

####  V�RIFICATION AVANT AJOUT COLONNE

```sql
-- TOUJOURS ex�cuter AVANT d'ajouter une colonne

-- 1. V�rifier colonnes existantes dans table
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'products'
ORDER BY ordinal_position;

-- 2. V�rifier si colonne calcul�e par trigger
SELECT
  t.event_object_table,
  t.trigger_name,
  t.action_statement
FROM information_schema.triggers t
WHERE t.event_object_table = 'products'
  AND t.action_statement LIKE '%stock%';

-- 3. V�rifier fonctions RPC li�es
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%product%price%';
```

---

### 3. PRIX PRODUITS (ERREUR ARCHITECTURALE FR�QUENTE)

**Syst�me de pricing V�rone** : Multi-canal avec priorit�s

#### L ANTI-PATTERN PRIX

```sql
-- L NE JAMAIS FAIRE
ALTER TABLE products
ADD COLUMN cost_price NUMERIC,
ADD COLUMN sale_price NUMERIC;

-- Probl�me: Pas de gestion multi-canal, pas de priorit�s client/channel
```

####  PATTERN CORRECT PRIX

```sql
--  UTILISER LE SYST�ME EXISTANT

-- 1. Prix de base (obligatoire)
products.base_price           -- Prix de r�f�rence

-- 2. Prix sp�cifiques canaux (optionnel)
price_list_items              -- Prix par price_list
channel_price_lists           -- Association channel � price_list
channel_pricing               -- Prix direct par channel

-- 3. Prix sp�cifiques clients (priorit� max)
customer_pricing              -- Prix client override channel

-- 4. Calcul prix final (RPC)
SELECT * FROM calculate_product_price_v2(
  product_id := 'uuid',
  channel_id := 'uuid',
  customer_id := 'uuid'  -- Si pr�sent, override channel pricing
);
```

**Architecture Pricing** :

```
Base Price (products.base_price)
  �
Channel Pricing (channel_pricing OU price_list_items)
  �
Customer Pricing (customer_pricing) � PRIORIT� MAX
  �
calculate_product_price_v2() � Prix final
```

---

### 4. STOCK MANAGEMENT (COLONNES CALCUL�ES)

**Syst�me de stock V�rone** : Colonnes auto-calcul�es par triggers

#### L ANTI-PATTERN STOCK

```sql
-- L NE JAMAIS FAIRE
UPDATE products
SET stock_quantity = stock_quantity - 10;

-- Probl�me: D�synchronisation avec stock_movements
```

####  PATTERN CORRECT STOCK

```sql
--  TOUJOURS CR�ER STOCK_MOVEMENT

-- 1. Cr�er mouvement de stock
INSERT INTO stock_movements (
  product_id,
  movement_type,    -- 'IN', 'OUT', 'ADJUST', 'TRANSFER'
  quantity,
  reason_code,      -- stock_reason_code enum (25 valeurs)
  performed_by
) VALUES (
  'product_uuid',
  'OUT',
  -10,              -- N�gatif pour sortie
  'sale',           -- Raison: vente client
  'user_uuid'
);

-- 2. Trigger maintain_stock_totals() s'ex�cute automatiquement
-- 3. Met � jour products.stock_real, stock_forecasted_in, stock_forecasted_out
-- 4. Calcule products.stock_quantity = stock_real + forecasted_in - forecasted_out
```

**Colonnes calcul�es automatiquement** :

- `products.stock_real` (somme mouvements IN/OUT)
- `products.stock_forecasted_in` (somme FORECASTED_IN)
- `products.stock_forecasted_out` (somme FORECASTED_OUT)
- `products.stock_quantity` (stock_real + forecasted_in - forecasted_out)

� **JAMAIS modifier ces colonnes manuellement** � Cr�er stock_movement

---

### 5. IMAGES PRODUITS (RELATION ONE-TO-MANY)

**Syst�me images V�rone** : Table d�di�e avec types

#### L ANTI-PATTERN IMAGES

```sql
-- L NE JAMAIS FAIRE
ALTER TABLE products
ADD COLUMN primary_image_url TEXT,
ADD COLUMN gallery_images TEXT[];  -- Array d'URLs

-- Probl�me: Pas de m�tadonn�es, pas de types, difficile � g�rer
```

####  PATTERN CORRECT IMAGES

```sql
--  UTILISER TABLE D�DI�E

-- 1. Table product_images
product_images (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  public_url TEXT NOT NULL,
  storage_path TEXT,
  image_type image_type_enum,  -- primary, gallery, technical, lifestyle, thumbnail
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER,
  alt_text TEXT,
  created_at TIMESTAMPTZ
);

-- 2. R�cup�ration avec jointure LEFT JOIN
SELECT
  p.*,
  pi.public_url AS primary_image_url
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true;

-- 3. Enrichissement frontend obligatoire
const enriched = data.map(p => ({
  ...p,
  primary_image_url: p.product_images?.[0]?.public_url || null
}));
```

**Business Rule BR-TECH-002** :

-  Toujours LEFT JOIN product_images dans queries produits
-  Enrichissement frontend mandatory pour primary_image_url
- L JAMAIS utiliser products.primary_image_url (colonne supprim�e)

---

### 6. ORGANISATIONS POLYMORPHES (SUPPLIERS/CUSTOMERS)

**Syst�me organisations V�rone** : Table polymorphe avec type enum

#### L ANTI-PATTERN ORGANISATIONS

```sql
-- L NE JAMAIS FAIRE
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  name TEXT,
  segment TEXT
);

CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name TEXT,
  type TEXT  -- B2B/B2C
);

-- Probl�me: Duplication, pas de vision unifi�e partenaires
```

####  PATTERN CORRECT ORGANISATIONS

```sql
--  UTILISER TABLE POLYMORPHE

-- 1. Table organisations (hub central)
organisations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type organisation_type,  -- internal, supplier, customer, partner
  is_active BOOLEAN,
  ...
);

-- 2. Table sp�cifique B2C
individual_customers (
  id UUID PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  ...
);

-- 3. Requ�tes par type
-- Fournisseurs
SELECT * FROM organisations WHERE type = 'supplier' AND is_active = true;

-- Clients B2B
SELECT * FROM organisations WHERE type = 'customer' AND is_active = true;

-- Clients B2C
SELECT
  o.*,
  ic.first_name,
  ic.last_name,
  ic.email
FROM organisations o
LEFT JOIN individual_customers ic ON o.id = ic.id
WHERE o.type = 'customer' AND o.is_active = true;
```

**Avantages table polymorphe** :

- Vision unifi�e tous partenaires
- Contacts uniques (table contacts � organisations)
- Adresses uniques
- Documents financiers unifi�s (partner_id � organisations)

---

### 7. TRIGGERS & FONCTIONS CALCUL�ES

**Triggers V�rone** : 158 triggers dont 10 interd�pendants pour stock

#### L ANTI-PATTERN TRIGGERS

```sql
-- L NE JAMAIS FAIRE
-- Cr�er trigger qui modifie colonne d�j� g�r�e par trigger existant

CREATE TRIGGER update_stock_on_sale
AFTER INSERT ON sales_order_items
FOR EACH ROW
EXECUTE FUNCTION decrement_product_stock();  -- L Conflit!

-- Probl�me: Conflit avec trigger maintain_stock_totals() existant
```

####  V�RIFICATION AVANT TRIGGER

```sql
-- 1. Lister tous triggers sur table
SELECT
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products'
ORDER BY action_timing, trigger_name;

-- 2. Lire d�finition compl�te trigger
SELECT pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = 'maintain_stock_totals_trigger';

-- 3. V�rifier fonctions appel�es
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%stock%';
```

**Triggers critiques � NE PAS dupliquer** :

- `maintain_stock_totals()` (10 triggers interd�pendants)
- `update_updated_at()` (42 tables)
- `calculate_sales_order_total()` (calcul totaux commandes)
- `calculate_product_price_v2()` (calcul prix dynamique)

---

##  WORKFLOW MODIFICATION SCH�MA

### CHECKLIST COMPL�TE (MANDATORY)

```markdown
## Avant toute modification database:

### �TAPE 1: RECHERCHE DOCUMENTATION

- [ ] Lire SCHEMA-REFERENCE.md section concern�e
- [ ] V�rifier enums.md si ajout contrainte
- [ ] V�rifier foreign-keys.md si ajout relation
- [ ] V�rifier triggers.md si modification colonne calcul�e
- [ ] V�rifier functions-rpc.md si modification logique m�tier

### �TAPE 2: V�RIFICATION EXISTANT

- [ ] Query PostgreSQL: table existe d�j�?
- [ ] Query PostgreSQL: colonne existe dans autre table?
- [ ] Query PostgreSQL: enum existe pour cette contrainte?
- [ ] Query PostgreSQL: trigger calcule d�j� cette valeur?

### �TAPE 3: VALIDATION UTILISATEUR

- [ ] AskUserQuestion si doute sur architecture
- [ ] Expliquer alternative trouv�e (table polymorphe, etc.)
- [ ] Attendre confirmation AVANT cr�ation

### �TAPE 4: MIGRATION SQL

- [ ] Cr�er fichier YYYYMMDD_NNN_description.sql
- [ ] Migrations idempotentes (IF NOT EXISTS, IF EXISTS)
- [ ] Commentaires explicatifs SQL
- [ ] Tester migration sur dev AVANT production

### �TAPE 5: VALIDATION POST-MIGRATION

- [ ] V�rifier contraintes cr��es correctement
- [ ] Tester RLS policies si table cr��e
- [ ] Tester triggers si colonne ajout�e
- [ ] Update documentation (SCHEMA-REFERENCE.md, etc.)
```

---

## =� EXEMPLES R�ELS HALLUCINATIONS �VIT�ES

### Exemple 1: Table `suppliers`

**Hallucination AI** :

```sql
-- L HALLUCINATION D�TECT�E
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  contact_email TEXT,
  segment TEXT,
  is_active BOOLEAN DEFAULT true
);
```

**Correction appliqu�e** :

```typescript
//  RECHERCHE DOCUMENTATION
const schema = await Read('docs/database/SCHEMA-REFERENCE.md');

//  D�COUVERTE
// Table organisations existe avec type='supplier'

//  QUESTION UTILISATEUR
await AskUserQuestion({
  question:
    "Table `organisations` existe avec type enum. Dois-je l'utiliser pour les fournisseurs?",
});

//  SOLUTION
// Utiliser organisations WHERE type='supplier'
// Ajouter colonne supplier_segment si besoin
```

### Exemple 2: Colonne `products.cost_price`

**Hallucination AI** :

```sql
-- L HALLUCINATION D�TECT�E
ALTER TABLE products
ADD COLUMN cost_price NUMERIC(10,2);
```

**Correction appliqu�e** :

```typescript
//  RECHERCHE DOCUMENTATION
const schema = await Read('docs/database/SCHEMA-REFERENCE.md');

//  D�COUVERTE
// Table price_list_items existe avec cost_price
// Syst�me multi-canal avec calculate_product_price_v2()

//  SOLUTION
// Utiliser price_list_items.cost_price
// RPC calculate_product_price_v2() pour prix final
```

### Exemple 3: Trigger `update_product_stock`

**Hallucination AI** :

```sql
-- L HALLUCINATION D�TECT�E
CREATE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_on_movement
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_product_stock();
```

**Correction appliqu�e** :

```typescript
//  RECHERCHE DOCUMENTATION
const triggers = await Read('docs/database/triggers.md');

//  D�COUVERTE
// Trigger maintain_stock_totals() existe d�j�
// 10 triggers interd�pendants sur stock_movements

//  SOLUTION
// Ne RIEN cr�er, trigger existant g�re tout
// Simplement cr�er stock_movement, trigger s'ex�cute auto
```

---

## <� R�GLES D'OR (� M�MORISER)

### 1. Documentation First

**TOUJOURS consulter docs/database/ AVANT toute modification**

### 2. Search Before Create

**TOUJOURS rechercher table/colonne similaire dans sch�ma existant**

### 3. Ask When Unsure

**TOUJOURS demander utilisateur si doute sur architecture**

### 4. Migration Always

**JAMAIS modifier sch�ma sans migration SQL document�e**

### 5. Verify After

**TOUJOURS v�rifier contraintes/triggers cr��s correctement**

---

## = LIENS CONNEXES

- **Schema Reference** : [SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md)
- **Triggers** : [triggers.md](./triggers.md)
- **RLS Policies** : [rls-policies.md](./rls-policies.md)
- **Functions** : [functions-rpc.md](./functions-rpc.md)
- **Enums** : [enums.md](./enums.md)
- **Foreign Keys** : [foreign-keys.md](./foreign-keys.md)

---

## =� EN CAS DE DOUTE

**SI vous �tes un agent IA et vous h�sitez sur l'architecture** :

1. � **STOP** - Ne cr�ez RIEN
2. =� **READ** - Lisez SCHEMA-REFERENCE.md + fichier concern�
3. =
   **SEARCH** - Recherchez structure similaire existante
4. S **ASK** - Posez question � l'utilisateur avec AskUserQuestion
5.  **VALIDATE** - Attendez confirmation explicite AVANT cr�ation

**Citation utilisateur** :

> _"� chaque fois, mon agent hallucine et cr�e des tables en plus"_

**Ne soyez PAS cet agent. Consultez la documentation AVANT de cr�er.**

---

**Documentation cr��e** : 2025-10-17
**Objectif** : Pr�venir hallucinations IA sur database V�rone
**Bas�e sur** : Retours utilisateur + Extraction compl�te database
**V�rone Back Office** - Anti-Hallucination Guide v1.0
