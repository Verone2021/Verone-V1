# 🗄️ Database Documentation - Vérone Back Office

**Source de vérité unique** pour l'architecture database PostgreSQL/Supabase

**Dernière extraction** : 2025-10-17
**Version Database** : PostgreSQL 15+ (Supabase)
**Project ID** : aorroydfjsrygmosnzrl

---

## 📊 Vue d'Ensemble

Cette documentation complète couvre **100% de la base de données** Vérone :

- ✅ **78 tables** exhaustivement documentées (colonnes, types, contraintes)
- ✅ **158 triggers** automatiques (10 interdépendants pour stock)
- ✅ **239 RLS policies** (sécurité par rôle Owner/Admin/Catalog Manager/Sales) - Mis à jour 2025-10-17
- ✅ **254 fonctions PostgreSQL** (89 triggers, 72 RPC, 45 helpers)
- ✅ **34 types enum** avec 194 valeurs possibles
- ✅ **143 foreign keys** (intégrité référentielle complète) - Mis à jour 2025-10-17

**Objectif** : Prévenir les **hallucinations IA** qui créent tables/colonnes en double.

---

## 🎯 Démarrage Rapide

### Pour Nouveaux Développeurs

**Ordre de lecture recommandé** :

1. **[SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md)** - Vue d'ensemble 78 tables (15 min)
2. **[best-practices.md](./best-practices.md)** - Règles anti-hallucination (10 min)
3. **[enums.md](./enums.md)** - Types enum disponibles (5 min)
4. **[triggers.md](./triggers.md)** - Colonnes auto-calculées (10 min)

**Total** : 40 minutes pour maîtriser l'architecture database.

### Pour Agents IA

**WORKFLOW OBLIGATOIRE avant toute modification** :

```typescript
// ⚠️ MANDATORY - Consulter AVANT création table/colonne

// 1. Lire schéma complet
Read('docs/database/SCHEMA-REFERENCE.md');

// 2. Lire guide anti-hallucination
Read('docs/database/best-practices.md');

// 3. Rechercher structure similaire
mcp__serena__search_for_pattern({
  pattern: 'supplier|customer|price',
  relative_path: 'docs/database/',
});

// 4. Si doute → Demander confirmation
AskUserQuestion({
  question: 'Table X existe-t-elle déjà sous autre forme?',
});

// 5. Migration SQL documentée
// Fichier: supabase/migrations/YYYYMMDD_NNN_description.sql
```

---

## 📁 Documentation Complète (7 Fichiers)

### 1️⃣ SCHEMA-REFERENCE.md (Source Vérité)

**📄 [SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md)**

> Documentation exhaustive des **78 tables** avec toutes colonnes, types, contraintes, relations

**Contenu** :

- 78 tables organisées par module (Produits, Commandes, Finance, Stocks, etc.)
- Toutes colonnes avec type, nullable, default, description
- Colonnes calculées automatiquement (triggers)
- Relations FK entre tables
- Index de performance
- Contraintes UNIQUE/CHECK

**Quand consulter** :

- ✅ Avant créer nouvelle table
- ✅ Avant ajouter colonne à table existante
- ✅ Pour comprendre architecture module
- ✅ Pour voir relations entre tables

**Taille** : ~2500 lignes, lecture 15 min

---

### 2️⃣ best-practices.md (Anti-Hallucination)

**📄 [best-practices.md](./best-practices.md)**

> Guide OBLIGATOIRE pour prévenir hallucinations IA (tables/colonnes en double)

**Contenu** :

- ❌ 6 tables à NE JAMAIS créer (`suppliers`, `customers`, `products_pricing`, etc.)
- ❌ 6 colonnes à NE JAMAIS ajouter (`cost_price`, `primary_image_url`, `stock_quantity`, etc.)
- ✅ Workflow consultation documentation (4 étapes)
- ✅ Checklist modification database (9 points)
- ✅ Exemples réels hallucinations évitées
- ✅ Règles d'or à mémoriser

**Quand consulter** :

- ✅ **TOUJOURS** avant créer table/colonne
- ✅ Si AI propose créer nouvelle structure
- ✅ En cas de doute sur architecture
- ✅ Pour comprendre systèmes polymorphes (organisations, pricing, stock)

**Taille** : ~800 lignes, lecture 10 min

---

### 3️⃣ triggers.md (Automatisations)

**📄 [triggers.md](./triggers.md)**

> Documentation complète des **158 triggers** PostgreSQL automatiques

**Contenu** :

- 158 triggers organisés par table (59 tables)
- 10 triggers critiques interdépendants (stock)
- 42 triggers `update_updated_at` (timestamp auto)
- 18 triggers validation données
- 15 triggers pricing/calculs
- Définitions SQL complètes

**Quand consulter** :

- ✅ Avant modifier colonne calculée (`stock_quantity`, `total_amount`, etc.)
- ✅ Pour comprendre pourquoi colonne se met à jour automatiquement
- ✅ Avant créer nouveau trigger (éviter doublons)
- ✅ Pour débugger valeurs inattendues

**Points critiques** :

- ⚠️ `maintain_stock_totals()` : 10 triggers interdépendants (NE PAS dupliquer)
- ⚠️ Colonnes calculées : `products.stock_quantity`, `sales_orders.total_amount`

**Taille** : ~950 lignes, lecture 10 min

---

### 4️⃣ rls-policies.md (Sécurité)

**📄 [rls-policies.md](./rls-policies.md)**

> Documentation exhaustive des **217 RLS policies** (Row-Level Security)

**Contenu** :

- 217 policies sur 73 tables
- Matrice rôles (Owner, Admin, Catalog Manager, Sales, User)
- Policies par commande : 92 SELECT, 47 INSERT, 42 UPDATE, 24 DELETE, 12 ALL
- Fonction critique `get_user_role()` utilisée par 80%+ policies
- Clauses USING / WITH CHECK détaillées

**Quand consulter** :

- ✅ Avant créer nouvelle table (RLS obligatoire)
- ✅ Pour comprendre droits par rôle
- ✅ Pour débugger erreurs 403 Forbidden
- ✅ Avant ajouter nouveau rôle utilisateur

**Point critique** :

- ⚠️ Fonction `get_user_role()` utilisée par 217 policies (NE PAS modifier)

**Taille** : ~1100 lignes, lecture 15 min

---

### 5️⃣ functions-rpc.md (Logique Métier)

**📄 [functions-rpc.md](./functions-rpc.md)**

> Documentation complète des **254 fonctions** PostgreSQL

**Contenu** :

- 254 fonctions organisées par type :
  - 89 TRIGGER functions (35.0%)
  - 72 RPC functions appelables client (28.3%)
  - 45 HELPER functions internes (17.7%)
  - 28 CALCULATION functions (11.0%)
  - 15 VALIDATION functions (5.9%)
  - 5 SYSTEM functions (2.0%)
- Top 10 fonctions critiques avec code SQL complet
- Exemples TypeScript pour RPC calls
- Index alphabétique 109 fonctions principales

**Quand consulter** :

- ✅ Avant créer fonction RPC (éviter doublons)
- ✅ Pour comprendre logique métier (pricing, stock, calculs)
- ✅ Pour appeler RPC depuis Next.js client
- ✅ Pour débugger erreurs fonctions

**Points critiques** :

- ⚠️ `calculate_product_price_v2()` : Pricing multi-canal (channel > customer)
- ⚠️ `maintain_stock_totals()` : Calcul stock automatique
- ⚠️ `get_user_role()` : Utilisé par 217 RLS policies

**Taille** : ~950 lignes, lecture 12 min

---

### 6️⃣ enums.md (Types Contraints)

**📄 [enums.md](./enums.md)**

> Documentation exhaustive des **34 types enum** PostgreSQL (194 valeurs)

**Contenu** :

- 34 types enum organisés par module :
  - 9 enums Produits & Catalogue
  - 3 enums Commandes & Ventes
  - 4 enums Stock & Logistique
  - 5 enums Finance & Comptabilité
  - 4 enums Organisations & Utilisateurs
  - 3 enums Feeds & Exports
  - 6 enums Technique & Système
- Valeurs complètes avec numéro ordre (enumsortorder)
- Tables utilisatrices pour chaque enum
- Template ajout valeur enum sécurisé

**Quand consulter** :

- ✅ Avant créer colonne avec contrainte valeurs
- ✅ Pour voir valeurs possibles d'un enum
- ✅ Avant ajouter nouvelle valeur à enum existant
- ✅ Pour comprendre workflow statuts (sales_order_status, etc.)

**Points critiques** :

- ⚠️ `user_role_type` : 5 rôles utilisés par 217 RLS policies
- ⚠️ `organisation_type` : Table polymorphe (supplier, customer, partner)
- ⚠️ `stock_reason_code` : 25 motifs traçabilité stock

**Taille** : ~850 lignes, lecture 8 min

---

### 7️⃣ foreign-keys.md (Relations)

**📄 [foreign-keys.md](./foreign-keys.md)**

> Documentation complète des **85 contraintes FK** (intégrité référentielle)

**Contenu** :

- 85 foreign keys sur 52 tables sources → 27 tables référencées
- ON DELETE / ON UPDATE rules détaillées
- Diagrammes relations principales (hiérarchie catalogue, workflows, pricing)
- Tables centrales (hub) : `products` (16 FK entrants), `organisations` (10 FK)
- Points critiques CASCADE/RESTRICT/SET NULL

**Quand consulter** :

- ✅ Avant ajouter relation entre tables
- ✅ Pour comprendre impact suppression (CASCADE, RESTRICT)
- ✅ Pour voir tables liées à une table centrale
- ✅ Pour débugger erreurs FK constraint violated

**Points critiques** :

- ⚠️ CASCADE destructeurs : `products` → `stock_movements` (perte historique)
- ⚠️ RESTRICT bloquants : `sales_orders` si `invoices` existe
- ⚠️ SET NULL dangereux : `stock_movements.performed_by` (perte traçabilité)

**Taille** : ~700 lignes, lecture 10 min

---

## 🚫 Anti-Hallucination - Tables/Colonnes Interdites

### ❌ NE JAMAIS CRÉER CES TABLES

| ❌ Table Hallucination | ✅ Utiliser À La Place                                         | Documentation                                                              |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `suppliers`            | `organisations WHERE type='supplier'`                          | [SCHEMA-REFERENCE.md § Organisations](./SCHEMA-REFERENCE.md#organisations) |
| `customers`            | `organisations WHERE type='customer'` + `individual_customers` | [SCHEMA-REFERENCE.md § Organisations](./SCHEMA-REFERENCE.md#organisations) |
| `products_pricing`     | `price_list_items` + `calculate_product_price_v2()`            | [best-practices.md § Pricing](./best-practices.md#pricing)                 |
| `product_stock`        | `stock_movements` (triggers calculent auto)                    | [triggers.md § Stock](./triggers.md#stock)                                 |
| `user_roles`           | `user_profiles.role` (enum `user_role_type`)                   | [enums.md § user_role_type](./enums.md#user-role-type)                     |

### ❌ NE JAMAIS AJOUTER CES COLONNES

| ❌ Colonne Hallucination     | ✅ Utiliser À La Place                              | Documentation                                                     |
| ---------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| `products.cost_price`        | `price_list_items.cost_price`                       | [best-practices.md § Pricing](./best-practices.md#pricing)        |
| `products.sale_price`        | `calculate_product_price_v2()` RPC                  | [functions-rpc.md § Pricing](./functions-rpc.md#pricing)          |
| `products.primary_image_url` | `product_images WHERE is_primary=true`              | [best-practices.md § Images](./best-practices.md#images)          |
| `products.stock_quantity`    | Calculé par trigger `maintain_stock_totals()`       | [triggers.md § Stock](./triggers.md#maintain-stock-totals)        |
| `sales_orders.total_amount`  | Calculé par trigger `calculate_sales_order_total()` | [triggers.md § Orders](./triggers.md#calculate-sales-order-total) |

**Guide complet** : [best-practices.md](./best-practices.md)

---

## 📖 Guides Thématiques

### 🏗️ Architecture Database

**Questions** :

- _Comment est organisée la base de données?_
- _Quels sont les modules principaux?_
- _Quelles tables sont centrales (hub)?_

**Réponse** : [SCHEMA-REFERENCE.md § Organisation par Module](./SCHEMA-REFERENCE.md#organisation-par-module)

**Modules principaux** :

- Catalogue & Produits (11 tables)
- Commandes Ventes (7 tables)
- Commandes Achats (4 tables)
- Stock & Logistique (6 tables)
- Finance & Comptabilité (8 tables)
- Organisations & Contacts (5 tables)
- Pricing Multi-Canal (7 tables)

---

### 🔐 Sécurité & RLS

**Questions** :

- _Quels rôles existent dans le système?_
- _Qui peut voir/modifier quelles tables?_
- _Comment ajouter RLS à nouvelle table?_

**Réponse** : [rls-policies.md](./rls-policies.md)

**Rôles système** :

- `owner` : Tous droits (super-admin)
- `admin` : Quasi tous droits (gestion quotidienne)
- `catalog_manager` : Produits, fournisseurs, pricing
- `sales` : Commandes clients, consultations
- `user` : Lecture limitée

---

### 💰 Système Pricing Multi-Canal

**Questions** :

- _Comment sont gérés les prix produits?_
- _Comment calculer prix final avec canal/client?_
- _Où stocker nouveaux prix?_

**Réponse** : **[pricing-architecture.md](./pricing-architecture.md)** (documentation complète) + [best-practices.md § Pricing](./best-practices.md#pricing)

**Architecture Pricing** :

```
price_list_items (tous les prix)
  ├─ cost_price (prix achat)
  ├─ price_ht (prix vente HT)
  ├─ suggested_retail_price (prix conseillé)
  └─ price_list_id (canal: B2B, B2C, etc.)

Priorité Calcul (calculate_product_price_v2):
1. customer_pricing (prix client individuel) ← PRIORITÉ MAX
2. group_price_lists (prix groupe client)
3. channel_pricing (prix canal)
4. price_list_items (prix liste standard)
5. base price_list (fallback)
```

**RPC Call** :

```typescript
const { data } = await supabase.rpc('calculate_product_price_v2', {
  p_product_id: 'uuid',
  p_quantity: 50, // Tiered pricing
  p_channel_id: 'uuid',
  p_customer_id: 'uuid', // Optionnel
  p_date: '2025-10-17', // Optionnel
});
```

**5 canaux actifs** : B2B Standard, Wholesale, Retail, E-Commerce, Catalogue Base

**Documentation complète** : [pricing-architecture.md](./pricing-architecture.md)

---

### 📦 Gestion Stock Automatique

**Questions** :

- _Comment est calculé le stock produit?_
- _Pourquoi `products.stock_quantity` se met à jour automatiquement?_
- _Comment créer mouvement de stock?_

**Réponse** : [triggers.md § Stock](./triggers.md#stock) + [best-practices.md § Stock](./best-practices.md#stock)

**Système Stock** :

- ❌ JAMAIS modifier `products.stock_quantity` manuellement
- ✅ TOUJOURS créer `stock_movement`
- ⚡ Trigger `maintain_stock_totals()` calcule automatiquement :
  - `stock_real` (somme IN/OUT)
  - `stock_forecasted_in` (somme FORECASTED_IN)
  - `stock_forecasted_out` (somme FORECASTED_OUT)
  - `stock_quantity` = stock_real + forecasted_in - forecasted_out

**Code** :

```sql
-- ✅ BON: Créer mouvement
INSERT INTO stock_movements (
  product_id, movement_type, quantity, reason_code, performed_by
) VALUES (
  'product_uuid', 'OUT', -10, 'sale', 'user_uuid'
);
-- Trigger met à jour products.stock_quantity automatiquement

-- ❌ MAUVAIS: Modifier stock direct
UPDATE products SET stock_quantity = stock_quantity - 10;
-- Désynchronisation avec stock_movements!
```

---

### 🏢 Organisations Polymorphes

**Questions** :

- _Comment gérer fournisseurs/clients/partenaires?_
- _Pourquoi pas de table `suppliers` séparée?_
- _Comment différencier B2B/B2C?_

**Réponse** : [best-practices.md § Organisations](./best-practices.md#organisations)

**Architecture Organisations** :

```
organisations (table polymorphe)
  ├── type = 'supplier' → Fournisseurs
  ├── type = 'customer' + individual_customers → Clients B2C
  ├── type = 'customer' → Clients B2B
  ├── type = 'partner' → Partenaires
  └── type = 'internal' → Organisation interne
```

**Avantages table polymorphe** :

- Vision unifiée tous partenaires
- Contacts uniques (table `contacts` → `organisations`)
- Documents financiers unifiés (`partner_id` → `organisations`)

---

### 🖼️ Images Produits (One-to-Many)

**Questions** :

- _Comment stocker images produits?_
- _Comment récupérer image principale?_
- _Pourquoi pas `products.primary_image_url`?_

**Réponse** : [best-practices.md § Images](./best-practices.md#images)

**Architecture Images** :

```
product_images (table dédiée)
  ├── product_id → products
  ├── public_url (URL Supabase Storage)
  ├── image_type (primary, gallery, technical, lifestyle, thumbnail)
  ├── is_primary (boolean)
  ├── display_order
  └── alt_text
```

**Query Pattern** :

```typescript
// ✅ BON: LEFT JOIN product_images
const { data } = await supabase.from('products').select(`
    *,
    product_images!left (public_url, is_primary)
  `);

// Enrichissement frontend obligatoire
const enriched = data.map(p => ({
  ...p,
  primary_image_url: p.product_images?.[0]?.public_url || null,
}));
```

---

## 🔧 Migrations Database

### Convention Naming (Supabase)

**Format obligatoire** : `YYYYMMDD_NNN_description.sql`

```bash
# ✅ CORRECTS
supabase/migrations/20251017_001_add_tax_rate_column.sql
supabase/migrations/20251017_002_create_invoices_rpc.sql

# ❌ INCORRECTS
20251017_add_tax_rate.sql       # Manque _NNN_
add-tax-rate.sql                # Pas de date
20251017-create-table.sql       # Séparateur incorrect
```

### Template Migration

```sql
-- Migration: 20251017_001_add_supplier_segment.sql

-- Ajouter colonne à table existante
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS supplier_segment supplier_segment_type DEFAULT 'approved';

-- Commentaire explicatif
COMMENT ON COLUMN organisations.supplier_segment IS
'Segmentation fournisseurs: strategic, preferred, approved, commodity, artisan. Utilisé uniquement si type=''supplier''.';

-- Index performance
CREATE INDEX IF NOT EXISTS idx_organisations_supplier_segment
ON organisations(supplier_segment) WHERE type = 'supplier';

-- Valider
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'organisations' AND column_name = 'supplier_segment';
```

---

## ❓ FAQ (Questions Fréquentes)

### Q1: Comment vérifier si table existe déjà?

**Réponse** :

```sql
-- Query PostgreSQL
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename LIKE '%supplier%';
```

**Alternative** : Lire [SCHEMA-REFERENCE.md](./SCHEMA-REFERENCE.md) section concernée

---

### Q2: Comment savoir si colonne est calculée par trigger?

**Réponse** : Lire [triggers.md](./triggers.md)

**Colonnes calculées automatiquement** :

- `products.stock_quantity` → trigger `maintain_stock_totals()`
- `products.stock_real` → trigger `maintain_stock_totals()`
- `products.updated_at` → trigger `update_updated_at()`
- `sales_orders.total_amount` → trigger `calculate_sales_order_total()`

---

### Q3: Quelle est la différence entre CASCADE et RESTRICT?

**Réponse** : Lire [foreign-keys.md § ON DELETE Rules](./foreign-keys.md#on-delete-rules)

- **CASCADE** : Suppression parent → supprime enfants automatiquement (⚠️ destructeur)
- **RESTRICT** : Suppression parent → BLOQUÉE si enfants existent (🔒 protecteur)
- **SET NULL** : Suppression parent → colonne FK enfant devient NULL (⚠️ perte traçabilité)
- **NO ACTION** : Similaire RESTRICT (bloque suppression)

---

### Q4: Comment appeler fonction RPC depuis Next.js?

**Réponse** : Lire [functions-rpc.md § Usage Client](./functions-rpc.md#usage-client)

```typescript
const { data, error } = await supabase.rpc('calculate_product_price_v2', {
  product_id: 'uuid',
  channel_id: 'uuid',
  customer_id: 'uuid',
});
```

---

### Q5: Pourquoi erreur 403 Forbidden sur requête Supabase?

**Réponse** : Lire [rls-policies.md](./rls-policies.md)

**Causes fréquentes** :

1. RLS policy manquante pour votre rôle
2. Fonction `get_user_role()` retourne NULL (user non authentifié)
3. Clause USING policy ne matche pas vos données
4. RLS activé mais aucune policy SELECT (DENY par défaut)

**Debug** :

```sql
-- Vérifier rôle utilisateur
SELECT get_user_role();

-- Vérifier policies sur table
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'products';
```

---

## 🔗 Liens Connexes

### Documentation Vérone

- **[docs/README.md](../README.md)** - Index principal documentation
- **[docs/auth/rls-policies.md](../auth/rls-policies.md)** - RLS Policies détaillées par rôle
- **[docs/metrics/database-triggers.md](../metrics/database-triggers.md)** - Triggers métriques
- **[CLAUDE.md](../../CLAUDE.md)** - Instructions projet complètes

### Supabase Resources

- **[Supabase Database Docs](https://supabase.com/docs/guides/database)** - Guide officiel
- **[PostgreSQL 15 Docs](https://www.postgresql.org/docs/15/)** - Documentation PostgreSQL
- **[RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)** - Row-Level Security

---

## 📞 Support & Contribution

### Mise à Jour Documentation

**Si changement database (migration)** :

1. ✅ Appliquer migration: `supabase/migrations/YYYYMMDD_NNN_description.sql`
2. ✅ Extraire nouveau schéma: `PGPASSWORD=... psql ...`
3. ✅ Mettre à jour fichiers docs/database/
4. ✅ Tester cohérence documentation
5. ✅ Créer rapport session: `MEMORY-BANK/sessions/RAPPORT-*.md`

### Signaler Erreur Documentation

Si documentation incorrecte/obsolète :

1. Vérifier date dernière extraction (haut de chaque fichier)
2. Comparer avec database réelle (query PostgreSQL)
3. Signaler dans MEMORY-BANK avec preuve
4. Créer issue GitHub si pertinent

---

**Documentation générée** : 2025-10-17
**Source** : Extraction PostgreSQL Database `aorroydfjsrygmosnzrl`
**Maintenu par** : Vérone Documentation Team
**Version** : 2.0 (Extraction Complète)

_Vérone Back Office - Professional Database Documentation_
