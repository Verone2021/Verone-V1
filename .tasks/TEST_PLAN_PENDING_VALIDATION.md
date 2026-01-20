# Plan de Test - Invariant pending_admin_validation

**Date**: 2026-01-20
**Related Task**: Audit et correction de l'invariant `pending_admin_validation`

## Modifications Apportées

### 1. Fix Back-Office (Priority 1)
- **Fichier**: `apps/back-office/.../use-linkme-order-actions.ts:254`
- **Change**: Ajout de `pending_admin_validation: false` dans approveOrder
- **Impact**: Les commandes approuvées seront maintenant correctement marquées

### 2. Fix Documentation (Priority 1)
- **Fichier**: `apps/linkme/src/lib/hooks/use-submit-unified-order.ts:8-12`
- **Change**: Correction commentaire (toutes les commandes → `pending_admin_validation = true`)
- **Impact**: Documentation cohérente avec la réalité du code

### 3. RLS Policy UPDATE (Priority 2 - Sécurité)
- **Fichier**: `supabase/migrations/20260120_001_add_update_policy_sales_orders.sql`
- **Change**: Nouvelle policy permettant UPDATE uniquement aux staff
- **Impact**: Empêche bypass de l'invariant par users non-admin

### 4. Trigger Hardcore (Priority 2 - Sécurité)
- **Fichier**: `supabase/migrations/20260120_002_trigger_enforce_pending_validation.sql`
- **Change**: Trigger BEFORE UPDATE qui valide admin/owner pour `pending_admin_validation: false`
- **Impact**: Protection ultime contre tout bypass (même via SECURITY DEFINER)

---

## Tests À Exécuter Après Déploiement

### Test 1: Back-Office Approval Fonctionne
**Objectif**: Vérifier que `pending_admin_validation` passe à `false` après approval

**Étapes**:
1. Créer une commande LinkMe (public ou authentifié)
2. Vérifier dans DB:
   ```sql
   SELECT id, order_number, pending_admin_validation, status
   FROM sales_orders
   WHERE order_number = 'LNK-260120-XXXXXX';
   -- Résultat attendu: pending_admin_validation = true, status = 'draft'
   ```
3. Approuver via back-office (UI)
4. Vérifier dans DB:
   ```sql
   SELECT id, order_number, pending_admin_validation, status
   FROM sales_orders
   WHERE order_number = 'LNK-260120-XXXXXX';
   -- Résultat attendu: pending_admin_validation = false, status = 'validated'
   ```

**Résultat attendu**: ✅ `pending_admin_validation = false` ET `status = 'validated'`

---

### Test 2: RLS Policy Bloque Non-Admin
**Objectif**: Vérifier qu'un user non-staff ne peut PAS bypasser l'invariant

**Étapes**:
1. Se connecter comme user LinkMe (role = `enseigne_admin`)
2. Essayer de modifier directement via console browser:
   ```typescript
   const { error } = await supabase
     .from('sales_orders')
     .update({ pending_admin_validation: false })
     .eq('id', 'UUID-quelconque');

   console.log(error);
   ```
3. Vérifier l'erreur

**Résultat attendu**: ❌ Erreur RLS Policy violation (code 42501)

---

### Test 3: Trigger Bloque Non-Admin (Même via RPC)
**Objectif**: Vérifier que le trigger empêche bypass même via SECURITY DEFINER

**Étapes**:
1. Créer temporairement une RPC SECURITY DEFINER de test:
   ```sql
   CREATE OR REPLACE FUNCTION test_bypass_rpc(p_order_id UUID)
   RETURNS BOOLEAN AS $$
   BEGIN
     UPDATE sales_orders
     SET pending_admin_validation = false
     WHERE id = p_order_id;
     RETURN true;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```
2. Appeler depuis user non-admin
3. Vérifier l'exception

**Résultat attendu**: ❌ Exception `[INVARIANT VIOLATION]`

**Cleanup**:
```sql
DROP FUNCTION IF EXISTS test_bypass_rpc(UUID);
```

---

### Test 4: Admin Peut Toujours Approuver
**Objectif**: Vérifier que les admins peuvent toujours approuver normalement

**Étapes**:
1. Se connecter comme admin back-office
2. Créer commande LinkMe
3. Approuver via UI
4. Vérifier DB

**Résultat attendu**: ✅ Approbation réussit, `pending_admin_validation = false`

---

### Test 5: Page "/commandes/validees" Fonctionne
**Objectif**: Vérifier que le filtre `.eq('pending_admin_validation', false)` fonctionne

**Étapes**:
1. Créer 2 commandes LinkMe
2. Approuver une seule (via back-office)
3. Aller sur `/canaux-vente/linkme/commandes/validees`
4. Vérifier que SEULE la commande approuvée apparaît

**Résultat attendu**: ✅ 1 commande visible (celle approuvée)

---

## Vérifications SQL Post-Déploiement

### Vérifier Policy Existe
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'sales_orders'
  AND policyname = 'Staff can update sales_orders';
```

**Résultat attendu**: 1 ligne avec cmd = 'UPDATE'

---

### Vérifier Trigger Existe
```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales_orders'
  AND trigger_name = 'trg_enforce_pending_validation';
```

**Résultat attendu**: 1 ligne avec event_manipulation = 'UPDATE'

---

### Vérifier Fonction Trigger Existe
```sql
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'enforce_pending_admin_validation';
```

**Résultat attendu**: 1 ligne avec security_type = 'DEFINER'

---

## Rollback Plan (Si Problème)

### 1. Rollback TypeScript
```bash
git revert <commit-hash-typescript>
```

### 2. Rollback Migrations (Dans l'ordre inverse)
```sql
-- Supprimer trigger
DROP TRIGGER IF EXISTS trg_enforce_pending_validation ON sales_orders;
DROP FUNCTION IF EXISTS enforce_pending_admin_validation();

-- Supprimer policy
DROP POLICY IF EXISTS "Staff can update sales_orders" ON sales_orders;
```

---

## Checklist Validation

- [ ] Test 1: Back-Office Approval met `pending_admin_validation = false`
- [ ] Test 2: RLS Policy bloque non-admin
- [ ] Test 3: Trigger bloque bypass RPC
- [ ] Test 4: Admin peut approuver normalement
- [ ] Test 5: Page "/commandes/validees" fonctionne
- [ ] Vérification SQL: Policy existe
- [ ] Vérification SQL: Trigger existe
- [ ] Vérification SQL: Fonction existe

---

**Status**: 🟡 EN ATTENTE DE DÉPLOIEMENT ET TESTS MANUELS
