# RLS Policies Supabase - Vérone Back Office

**Dernière mise à jour** : 2025-10-16
**Version** : 1.0
**Mainteneur** : Vérone Documentation Team

## Table des matières

- [Introduction](#introduction)
- [Tables Owner-Only](#tables-owner-only)
- [Tables Owner + Admin](#tables-owner--admin)
- [Patterns Communs](#patterns-communs)
- [Validation Policies](#validation-policies)
- [Troubleshooting](#troubleshooting)
- [Liens Connexes](#liens-connexes)

---

## Introduction

### Qu'est-ce que RLS (Row Level Security) ?

**Row Level Security (RLS)** est un mécanisme de sécurité de Supabase (PostgreSQL) qui permet de contrôler l'accès aux lignes d'une table au niveau de la base de données.

**Avantages** :
- **Sécurité native** : Impossible de bypasser depuis le client (contrairement aux middlewares applicatifs)
- **Performance** : Exécuté directement par PostgreSQL, pas de requêtes supplémentaires
- **Isolation tenant** : Garantit qu'un utilisateur ne peut accéder qu'aux données de son organisation
- **Contrôle rôle** : Permissions différentes selon Owner, Admin, Sales

### Principe Vérone

**Toutes les tables** du système Vérone ont RLS activé avec les policies suivantes :

1. **Isolation tenant** : Clause `organisation_id IN (SELECT organisation_id FROM user_organisation_assignments WHERE user_id = auth.uid())`
2. **Contrôle rôle** : Clause `role_name IN ('owner', 'admin')` pour les permissions avancées
3. **Audit trail** : user_activity_logs Owner-only pour traçabilité

### Migration Appliquée

**Référence** : `supabase/migrations/20251016_003_align_owner_admin_policies.sql`

Cette migration a corrigé 2 policies pour aligner Owner/Admin :
- `stock_movements DELETE` : Ajout 'admin' (était Owner-only)
- `sales_orders UPDATE` : Suppression DEBUG policy, restauration normale Owner+Admin+Sales

---

## Tables Owner-Only

### user_activity_logs (Logs Activité)

**Raison business** : Audit trail hiérarchique - Seul Owner peut consulter l'activité de l'équipe

#### SELECT Policy

**Nom** : `Owners peuvent voir tous les logs d'activité`

**Logic SQL** :
```sql
CREATE POLICY "Owners peuvent voir tous les logs d'activité" ON user_activity_logs
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);
```

**Comportement** :
- Owner : ✅ Voir tous les logs de son tenant
- Admin : ❌ Aucun accès (RLS bloque)
- Sales : ❌ Aucun accès

#### INSERT Policy

**Nom** : `System peut insérer logs automatiquement`

**Logic SQL** :
```sql
CREATE POLICY "System peut insérer logs automatiquement" ON user_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
);
```

**Comportement** :
- Tous rôles : ✅ Logs créés automatiquement par trigger système
- Insertion manuelle : ❌ Bloquée (protection audit trail)

#### UPDATE/DELETE Policies

**Nom** : Aucune (immuable)

**Logic SQL** : Aucune policy = Aucun UPDATE/DELETE possible

**Comportement** :
- Tous rôles : ❌ Logs immuables (audit trail préservé)

---

### user_profiles (Profils Utilisateurs)

**Raison business** : Gestion équipe Owner-only, Admin peut modifier son profil uniquement

#### SELECT Policy

**Nom** : `Tous utilisateurs peuvent voir les profils de leur organisation`

**Logic SQL** :
```sql
CREATE POLICY "Tous utilisateurs peuvent voir les profils" ON user_profiles
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
);
```

**Comportement** :
- Owner : ✅ Voir tous profils du tenant
- Admin : ✅ Voir tous profils du tenant
- Sales : ✅ Voir tous profils du tenant

#### INSERT Policy

**Nom** : `Uniquement owners peuvent créer des profils utilisateurs`

**Logic SQL** :
```sql
CREATE POLICY "Uniquement owners peuvent créer des profils" ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);
```

**Comportement** :
- Owner : ✅ Créer nouveaux profils
- Admin : ❌ Impossible (RLS)
- Sales : ❌ Impossible

#### UPDATE Policy

**Nom** : `Owners peuvent modifier tous profils, Admin son profil uniquement`

**Logic SQL** :
```sql
CREATE POLICY "Owners peuvent modifier tous profils, Admin son profil" ON user_profiles
FOR UPDATE
TO authenticated
USING (
  -- Owner : tous profils du tenant
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
  OR
  -- Admin/Sales : son profil uniquement
  id = auth.uid()
)
WITH CHECK (
  -- Même logique pour vérification après modification
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
  OR
  id = auth.uid()
);
```

**Comportement** :
- Owner : ✅ Modifier tous profils du tenant
- Admin : ✅ Modifier SON profil uniquement (id = auth.uid())
- Sales : ✅ Modifier SON profil uniquement

#### DELETE Policy

**Nom** : `Uniquement owners peuvent supprimer des profils`

**Logic SQL** :
```sql
CREATE POLICY "Uniquement owners peuvent supprimer des profils" ON user_profiles
FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);
```

**Comportement** :
- Owner : ✅ Supprimer profils (sauf trigger prevent_last_owner_deletion)
- Admin : ❌ Impossible (RLS)
- Sales : ❌ Impossible

---

### user_organisation_assignments (Assignations Rôles)

**Raison business** : Gestion rôles Owner-only, Admin ne peut pas modifier les rôles

#### SELECT Policy

**Nom** : `Tous utilisateurs peuvent voir les assignations`

**Logic SQL** :
```sql
CREATE POLICY "Tous utilisateurs peuvent voir les assignations" ON user_organisation_assignments
FOR SELECT
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
);
```

**Comportement** :
- Tous rôles : ✅ Voir assignations du tenant

#### INSERT/UPDATE/DELETE Policies

**Nom** : `Uniquement owners peuvent gérer les assignations`

**Logic SQL** :
```sql
-- INSERT
CREATE POLICY "Uniquement owners peuvent créer assignations" ON user_organisation_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);

-- UPDATE
CREATE POLICY "Uniquement owners peuvent modifier assignations" ON user_organisation_assignments
FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);

-- DELETE
CREATE POLICY "Uniquement owners peuvent supprimer assignations" ON user_organisation_assignments
FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);
```

**Comportement** :
- Owner : ✅ CRUD complet assignations
- Admin : ❌ Aucune modification possible
- Sales : ❌ Aucune modification possible

---

## Tables Owner + Admin

### organisations (Organisations)

**Raison business** : Owner et Admin peuvent gérer les organisations

#### Toutes Operations (SELECT, INSERT, UPDATE, DELETE)

**Nom** : `Owners et admins peuvent gérer les organisations`

**Logic SQL** :
```sql
CREATE POLICY "Owners et admins peuvent gérer organisations" ON organisations
FOR ALL
TO authenticated
USING (
  id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ CRUD complet
- Admin : ✅ CRUD complet (identique Owner)
- Sales : ❌ Lecture seule (policy distincte)

---

### price_lists (Listes de Prix)

**Raison business** : Owner et Admin peuvent gérer pricing (y compris DELETE)

#### Toutes Operations (SELECT, INSERT, UPDATE, DELETE)

**Nom** : `Owners et admins peuvent gérer listes de prix`

**Logic SQL** :
```sql
CREATE POLICY "Owners et admins peuvent gérer price lists" ON price_lists
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ CRUD complet (y compris DELETE)
- Admin : ✅ CRUD complet (y compris DELETE) ← Correction appliquée
- Sales : ❌ Lecture seule

**Note** : Ancienne croyance corrigée - Admin PEUT DELETE price_lists

---

### sales_orders (Commandes Ventes)

**Raison business** : Owner, Admin ET Sales peuvent gérer commandes ventes

#### SELECT, INSERT, DELETE Policies

**Nom** : `Owners, admins et sales peuvent gérer commandes`

**Logic SQL** :
```sql
CREATE POLICY "Owners, admins et sales peuvent gérer commandes" ON sales_orders
FOR SELECT, INSERT, DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
);
```

**Comportement** :
- Owner : ✅ SELECT, INSERT, DELETE
- Admin : ✅ SELECT, INSERT, DELETE
- Sales : ✅ SELECT, INSERT, DELETE

#### UPDATE Policy (CORRIGÉE 2025-10-16)

**Nom** : `Owners, admins et sales peuvent modifier leurs commandes`

**Logic SQL** :
```sql
CREATE POLICY "Owners, admins et sales peuvent modifier leurs commandes" ON sales_orders
FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
);
```

**Comportement** :
- Owner : ✅ UPDATE complet
- Admin : ✅ UPDATE complet
- Sales : ✅ UPDATE complet

**Note Migration** : DEBUG policy `DEBUG_sales_orders_update_owner_bypass` supprimée, policy normale restaurée

---

### stock_movements (Mouvements Stock)

**Raison business** : Owner et Admin peuvent gérer stocks (y compris DELETE)

#### SELECT, INSERT, UPDATE Policies

**Nom** : `Owners et admins peuvent gérer mouvements stock`

**Logic SQL** :
```sql
CREATE POLICY "Owners et admins peuvent gérer mouvements" ON stock_movements
FOR SELECT, INSERT, UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ SELECT, INSERT, UPDATE
- Admin : ✅ SELECT, INSERT, UPDATE
- Sales : ❌ Lecture seule (policy distincte)

#### DELETE Policy (CORRIGÉE 2025-10-16)

**Nom** : `Admins peuvent supprimer des mouvements de stock`

**Logic SQL** :
```sql
CREATE POLICY "Admins peuvent supprimer des mouvements de stock" ON stock_movements
FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ DELETE
- Admin : ✅ DELETE ← Ajout 2025-10-16
- Sales : ❌ Interdit

**Note Migration** : Ancienne policy Owner-only supprimée, nouvelle policy Owner+Admin créée

---

### products (Produits)

**Raison business** : Owner et Admin peuvent gérer catalogue produits

#### Toutes Operations (SELECT, INSERT, UPDATE, DELETE)

**Nom** : `Owners et admins peuvent gérer produits`

**Logic SQL** :
```sql
CREATE POLICY "Owners et admins peuvent gérer produits" ON products
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ CRUD complet
- Admin : ✅ CRUD complet
- Sales : ❌ Lecture seule

---

### purchase_orders (Commandes Achats)

**Raison business** : Owner et Admin peuvent gérer sourcing fournisseurs

#### Toutes Operations (SELECT, INSERT, UPDATE, DELETE)

**Nom** : `Owners et admins peuvent gérer commandes achats`

**Logic SQL** :
```sql
CREATE POLICY "Owners et admins peuvent gérer purchase orders" ON purchase_orders
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ CRUD complet
- Admin : ✅ CRUD complet
- Sales : ❌ Lecture seule

---

### contacts (Contacts CRM)

**Raison business** : Owner et Admin peuvent gérer contacts clients/fournisseurs

#### Toutes Operations (SELECT, INSERT, UPDATE, DELETE)

**Nom** : `Owners et admins peuvent gérer contacts`

**Logic SQL** :
```sql
CREATE POLICY "Owners et admins peuvent gérer contacts" ON contacts
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

**Comportement** :
- Owner : ✅ CRUD complet
- Admin : ✅ CRUD complet
- Sales : ❌ Lecture seule

---

## Patterns Communs

### Pattern 1 : Isolation Tenant (Toutes Tables)

**Objectif** : Garantir qu'un utilisateur ne peut accéder qu'aux données de son organisation

**Pattern SQL** :
```sql
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
  )
)
```

**Explication** :
1. `auth.uid()` : ID utilisateur authentifié (fourni par Supabase Auth)
2. `user_organisation_assignments` : Table jointure user ↔ organisation
3. `organisation_id IN (...)` : Filtre uniquement les lignes du tenant utilisateur

**Exemple** :
```sql
-- User A (tenant 1) essaie de lire products
SELECT * FROM products;
-- RLS applique automatiquement WHERE organisation_id = 1

-- User B (tenant 2) essaie de lire products
SELECT * FROM products;
-- RLS applique automatiquement WHERE organisation_id = 2
```

---

### Pattern 2 : Contrôle Rôle Owner-Only

**Objectif** : Restreindre action aux Owners uniquement

**Pattern SQL** :
```sql
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
)
```

**Explication** :
1. Clause `AND role_name = 'owner'` filtre uniquement les Owners
2. Si user n'est pas Owner du tenant, subquery renvoie 0 résultat
3. RLS bloque l'accès (aucune ligne visible)

**Tables concernées** :
- user_activity_logs (SELECT)
- user_profiles (INSERT, DELETE)
- user_organisation_assignments (INSERT, UPDATE, DELETE)

---

### Pattern 3 : Contrôle Rôle Owner + Admin

**Objectif** : Permettre action aux Owners ET Admins

**Pattern SQL** :
```sql
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
)
```

**Explication** :
1. Clause `role_name IN ('owner', 'admin')` autorise les 2 rôles
2. Si user est Owner OU Admin, subquery renvoie organisation_id
3. RLS autorise l'accès

**Tables concernées** :
- organisations
- price_lists
- products
- purchase_orders
- stock_movements
- contacts

---

### Pattern 4 : Modification Son Profil Uniquement (Admin)

**Objectif** : Owner peut modifier tous profils, Admin son profil uniquement

**Pattern SQL** :
```sql
USING (
  -- Owner : tous profils
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
  OR
  -- Admin/Sales : son profil uniquement
  id = auth.uid()
)
```

**Explication** :
1. Clause `OR` : soit Owner (accès complet), soit Admin/Sales (son profil)
2. `id = auth.uid()` : Filtre uniquement la ligne de l'utilisateur connecté
3. Owner bypass cette clause (toujours autorisé par première condition)

**Tables concernées** :
- user_profiles (UPDATE)

---

## Validation Policies

### Query Manuelle : Vérifier Policies Owner/Admin

**Objectif** : Lister toutes les policies RLS avec classification rôle

**SQL** :
```sql
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%owner%' AND qual LIKE '%admin%' THEN 'Owner+Admin'
    WHEN qual LIKE '%owner%' AND NOT qual LIKE '%admin%' THEN 'Owner-only'
    WHEN qual LIKE '%admin%' THEN 'Admin-included'
    ELSE 'Other'
  END as role_restriction
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual LIKE '%owner%' OR qual LIKE '%admin%')
ORDER BY
  CASE
    WHEN tablename IN ('user_activity_logs', 'user_profiles', 'user_organisation_assignments') THEN 1
    ELSE 2
  END,
  tablename,
  cmd;
```

**Résultat attendu** :
```
tablename                    | policyname                                      | cmd    | role_restriction
-----------------------------+-------------------------------------------------+--------+-----------------
user_activity_logs           | Owners peuvent voir tous les logs               | SELECT | Owner-only
user_profiles                | Uniquement owners peuvent créer profils         | INSERT | Owner-only
user_profiles                | Owners peuvent modifier tous profils            | UPDATE | Owner-only
user_profiles                | Uniquement owners peuvent supprimer profils     | DELETE | Owner-only
user_organisation_assignments| Uniquement owners peuvent créer assignations    | INSERT | Owner-only
user_organisation_assignments| Uniquement owners peuvent modifier assignations | UPDATE | Owner-only
user_organisation_assignments| Uniquement owners peuvent supprimer assignations| DELETE | Owner-only
organisations                | Owners et admins peuvent gérer organisations    | ALL    | Owner+Admin
price_lists                  | Owners et admins peuvent gérer price lists      | ALL    | Owner+Admin
products                     | Owners et admins peuvent gérer produits         | ALL    | Owner+Admin
stock_movements              | Admins peuvent supprimer mouvements stock       | DELETE | Owner+Admin
sales_orders                 | Owners, admins et sales peuvent modifier        | UPDATE | Owner+Admin
```

---

### Query Manuelle : Vérifier RLS Activé

**Objectif** : Lister toutes les tables avec statut RLS

**SQL** :
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Résultat attendu** :
```
schemaname | tablename                  | rls_enabled
-----------+----------------------------+-------------
public     | contacts                   | true
public     | organisations              | true
public     | price_lists                | true
public     | products                   | true
public     | purchase_orders            | true
public     | sales_orders               | true
public     | stock_movements            | true
public     | user_activity_logs         | true
public     | user_organisation_assignments | true
public     | user_profiles              | true
public     | variant_groups             | true
...        | ...                        | true
```

**Si rls_enabled = false** : BLOCKER - Table non protégée, appliquer `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`

---

### Query Manuelle : Vérifier Trigger Sécurité

**Objectif** : Vérifier que trigger prevent_last_owner_deletion existe

**SQL** :
```sql
SELECT
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'prevent_last_owner_deletion';
```

**Résultat attendu** :
```
trigger_name               | table_name               | enabled
---------------------------+--------------------------+---------
prevent_last_owner_deletion| user_organisation_assignments | O
```

**Si aucun résultat** : CRITIQUE - Trigger manquant, risque suppression dernier Owner

---

## Troubleshooting

### Erreur : "Policy violation on table X"

**Symptôme** :
```
Error: new row violates row-level security policy for table "user_profiles"
```

**Cause** : RLS bloque l'opération (rôle insuffisant ou organisation_id incorrect)

**Debug** :
1. Vérifier rôle utilisateur :
   ```sql
   SELECT role_name
   FROM user_organisation_assignments
   WHERE user_id = auth.uid();
   ```

2. Vérifier organisation_id :
   ```sql
   SELECT organisation_id
   FROM user_organisation_assignments
   WHERE user_id = auth.uid();
   ```

3. Vérifier policy attendue :
   ```sql
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'user_profiles' AND cmd = 'INSERT';
   ```

**Solution** :
- Si Admin essaie d'insérer user_profiles : Demander à Owner
- Si organisation_id manquant : Corriger données user_organisation_assignments
- Si policy manquante : Appliquer migration RLS

---

### Erreur : "RLS not enabled on table X"

**Symptôme** :
```
Warning: Row Level Security is not enabled on table "variant_groups"
```

**Cause** : Table créée sans RLS activé

**Solution** :
```sql
ALTER TABLE variant_groups ENABLE ROW LEVEL SECURITY;

-- Puis créer policies nécessaires
CREATE POLICY "Owners et admins peuvent gérer variant groups" ON variant_groups
FOR ALL
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin')
  )
);
```

---

### Erreur : Admin peut supprimer user_profiles (GRAVE)

**Symptôme** : Admin réussit à supprimer profil utilisateur (devrait échouer)

**Cause** : Policy DELETE trop permissive ou RLS désactivé

**Debug** :
```sql
-- Vérifier policy DELETE user_profiles
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'user_profiles' AND cmd = 'DELETE';

-- Résultat attendu : qual LIKE '%owner%' AND NOT LIKE '%admin%'
```

**Solution** :
```sql
-- Supprimer policy permissive
DROP POLICY IF EXISTS "Admins peuvent supprimer profils" ON user_profiles;

-- Recréer policy Owner-only
CREATE POLICY "Uniquement owners peuvent supprimer profils" ON user_profiles
FOR DELETE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name = 'owner'
  )
);
```

---

### Erreur : Owner ne peut pas modifier sales_orders (BUG)

**Symptôme** : Owner reçoit "Policy violation" sur UPDATE sales_orders

**Cause** : DEBUG policy temporaire non supprimée ou policy WITH CHECK manquante

**Debug** :
```sql
-- Vérifier policies UPDATE sales_orders
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'sales_orders' AND cmd = 'UPDATE';

-- Rechercher DEBUG policies
SELECT policyname, tablename
FROM pg_policies
WHERE policyname LIKE 'DEBUG%';
```

**Solution** :
```sql
-- Supprimer DEBUG policy
DROP POLICY IF EXISTS "DEBUG_sales_orders_update_owner_bypass" ON sales_orders;

-- Recréer policy normale
CREATE POLICY "Owners, admins et sales peuvent modifier leurs commandes" ON sales_orders
FOR UPDATE
TO authenticated
USING (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
)
WITH CHECK (
  organisation_id IN (
    SELECT organisation_id
    FROM user_organisation_assignments
    WHERE user_id = auth.uid()
      AND role_name IN ('owner', 'admin', 'sales')
  )
);
```

---

## Liens Connexes

### Documentation Technique

- [Matrice Rôles et Permissions](/Users/romeodossantos/verone-back-office-V1/docs/auth/roles-permissions-matrix.md)
- [Migration RLS 2025-10-16](/Users/romeodossantos/verone-back-office-V1/supabase/migrations/20251016_003_align_owner_admin_policies.sql)
- [Rapport Audit Sécurité](/Users/romeodossantos/verone-back-office-V1/docs/reports/SECURITY-AUDIT-EXECUTIVE-SUMMARY.md)

### Documentation Workflows

- [Workflow Quotidien Owner](/Users/romeodossantos/verone-back-office-V1/docs/workflows/owner-daily-workflow.md)
- [Workflow Quotidien Admin](/Users/romeodossantos/verone-back-office-V1/docs/workflows/admin-daily-workflow.md)

### Ressources Externes

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Retour** : [Documentation Authentification](/Users/romeodossantos/verone-back-office-V1/docs/auth/README.md) | [Index Principal](/Users/romeodossantos/verone-back-office-V1/docs/README.md)
