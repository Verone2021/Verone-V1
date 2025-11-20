# 🗄️ DATABASE CONTEXT - Vérone Back Office

**Chargement** : Uniquement si travail database (migrations, schema, queries)
**Source de vérité** : `/docs/database/` (extraction complète 2025-10-17)

---

## 📊 STATISTIQUES DATABASE

- **78 tables** exhaustivement documentées
- **158 triggers** avec 10 interdépendants (stock)
- **217 RLS policies** (sécurité par rôle)
- **254 fonctions PostgreSQL** (89 triggers, 72 RPC, 45 helpers)
- **34 types enum** (194 valeurs)
- **85 foreign keys** (intégrité référentielle)

---

## 🚫 RÈGLE ANTI-HALLUCINATION

**Problème historique** :

> _"À chaque fois, mon agent hallucine et crée des tables en plus. Par exemple, il créé une table `suppliers` alors qu'on a déjà `organisations`."_

**WORKFLOW OBLIGATOIRE avant toute modification database** :

```typescript
// ÉTAPE 1 : TOUJOURS consulter documentation AVANT création
Read('docs/database/SCHEMA-REFERENCE.md'); // 78 tables
Read('docs/database/best-practices.md'); // Anti-hallucination guide

// ÉTAPE 2 : Rechercher structure similaire existante
mcp__serena__search_for_pattern({
  pattern: 'supplier|customer|price',
  relative_path: 'docs/database/',
});

// ÉTAPE 3 : Si doute → Demander confirmation utilisateur
AskUserQuestion({
  question: 'Table `suppliers` existe-t-elle déjà sous autre forme ?',
});

// ÉTAPE 4 : Migration SQL documentée uniquement
// Fichier : supabase/migrations/YYYYMMDD_NNN_description.sql
```

---

## ❌ TABLES À NE JAMAIS CRÉER (Hallucinations Fréquentes)

| ❌ NE PAS Créer    | ✅ Utiliser À La Place                                         |
| ------------------ | -------------------------------------------------------------- |
| `suppliers`        | `organisations WHERE type='supplier'`                          |
| `customers`        | `organisations WHERE type='customer'` + `individual_customers` |
| `products_pricing` | `price_list_items` + `calculate_product_price_v2()`            |
| `product_stock`    | `stock_movements` (triggers calculent automatiquement)         |
| `user_roles`       | `user_profiles.role` (enum user_role_type)                     |

## ❌ COLONNES À NE JAMAIS AJOUTER (Hallucinations Fréquentes)

| ❌ NE PAS Ajouter            | ✅ Utiliser À La Place                              |
| ---------------------------- | --------------------------------------------------- |
| `products.cost_price`        | `price_list_items.cost_price`                       |
| `products.sale_price`        | `calculate_product_price_v2()` (RPC multi-canal)    |
| `products.primary_image_url` | `product_images WHERE is_primary=true` (LEFT JOIN)  |
| `products.stock_quantity`    | Calculé par trigger `maintain_stock_totals()`       |
| `sales_orders.total_amount`  | Calculé par trigger `calculate_sales_order_total()` |

---

## ⚠️ CHECKLIST MODIFICATION DATABASE (MANDATORY)

Avant toute création table/colonne/trigger :

- [ ] Lire SCHEMA-REFERENCE.md section concernée
- [ ] Vérifier enums.md si ajout contrainte
- [ ] Vérifier foreign-keys.md si ajout relation
- [ ] Vérifier triggers.md si modification colonne calculée
- [ ] Vérifier functions-rpc.md si modification logique métier
- [ ] Rechercher structure similaire existante (search_for_pattern)
- [ ] AskUserQuestion si doute sur architecture
- [ ] Créer migration YYYYMMDD_NNN_description.sql
- [ ] Tester migration sur dev AVANT production

---

## 📖 DOCUMENTATION DATABASE COMPLÈTE

```
docs/database/
├── SCHEMA-REFERENCE.md        # 78 tables exhaustives (SOURCE VÉRITÉ)
├── triggers.md                # 158 triggers documentés
├── rls-policies.md            # 217 RLS policies
├── functions-rpc.md           # 254 fonctions PostgreSQL
├── enums.md                   # 34 types enum (194 valeurs)
├── foreign-keys.md            # 85 contraintes FK
└── best-practices.md          # Guide anti-hallucination
```

---

## 🔄 WORKFLOW AUTOMATISÉ AUDIT DATABASE

```typescript
// ✅ WORKFLOW OBLIGATOIRE avant toute modification database
1. mcp__supabase__get_database_schema     // Schema live
2. Compare avec docs/database/SCHEMA-REFERENCE.md
3. mcp__supabase__generate_typescript_types → src/types/supabase.ts
4. Détection drift (supabase db diff)
5. Update documentation si drift détecté
6. CI check sur chaque PR
```

### Script d'Audit

**Emplacement** : `tools/scripts/audit-database.js`

**Usage manuel** :

```bash
# Audit complet avec rapport HTML
node tools/scripts/audit-database.js --report=html

# Audit + auto-fix documentation
node tools/scripts/audit-database.js --fix --report=both

# Mode CI (exit code 1 si drift)
node tools/scripts/audit-database.js --ci
```

---

## 📝 MIGRATIONS CONVENTION (SUPABASE)

```typescript
// 📁 EMPLACEMENT : supabase/migrations/
// 📝 NAMING OBLIGATOIRE : YYYYMMDD_NNN_description.sql

// ✅ EXEMPLES CORRECTS :
20251021_001_add_tax_rate_column.sql
20251021_002_create_invoices_rpc.sql
20251021_003_add_rls_policies_stock_movements.sql

// ❌ EXEMPLES INCORRECTS :
20251021_add_tax_rate.sql              // Manque _NNN_
add-tax-rate.sql                       // Pas de date
202510215_005_create_table.sql         // Date invalide (9 chiffres)
20251021-create-table.sql              // Séparateur incorrect

// 🔑 FORMAT DÉTAILLÉ :
// YYYYMMDD : Date création (ex : 20251021)
// NNN      : Numéro séquentiel du jour (001, 002, 003...)
// description : Description kebab-case (snake_case accepté)
// .sql     : Extension obligatoire

// 📋 RÈGLES :
// 1. TOUJOURS utiliser supabase/migrations/ (jamais docs/, scripts/, etc.)
// 2. Une migration = Un fichier SQL pur (pas de bash, python, etc.)
// 3. Idempotent (IF NOT EXISTS, IF EXISTS) quand possible
// 4. Commentaires explicatifs obligatoires
// 5. Archiver (pas supprimer) migrations obsolètes → archive/migrations-YYYY-MM/
```

---

## 🔑 CREDENTIALS SUPABASE (MCP)

```typescript
// 🔑 CREDENTIALS : TOUJOURS lire depuis .env.local (ligne 19)
// Fichier : /Users/romeodossantos/verone-back-office-V1/.mcp.env (ou .env.local)
// Connection : aws-1-eu-west-3.pooler.supabase.com:5432
// Password : Disponible dans DATABASE_URL (variable env)

// Workflow automatisé :
1. Read .env.local pour DATABASE_URL
2. Essayer Session Pooler (5432) en priorité
3. Si échec → Direct Connection (6543)
4. JAMAIS demander credentials manuellement
```

---

**Dernière mise à jour** : 2025-10-23
**Mainteneur** : Romeo Dos Santos
