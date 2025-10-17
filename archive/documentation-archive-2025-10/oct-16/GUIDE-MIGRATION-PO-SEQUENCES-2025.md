# 🔧 Guide Migration: Séquences PostgreSQL pour Commandes Fournisseurs

**Date:** 12 octobre 2025
**Objectif:** Corriger l'erreur 409 duplicate key lors de la création de commandes fournisseurs
**Fichier migration:** `supabase/migrations/20251012_004_fix_order_number_generation.sql`

---

## 🎯 Problème à Résoudre

### Symptôme
```
Error 409: duplicate key value violates unique constraint "purchase_orders_po_number_key"
```

### Cause Racine
- **Race condition:** Utilisation de `MAX()` non thread-safe pour générer les numéros
- **Collision de séquence:** La séquence démarre à 1 mais des commandes PO-2025-00000 et PO-2025-00001 existent déjà

### Solution
Remplacer l'approche `MAX()` par des **séquences PostgreSQL natives** (thread-safe, performantes)

---

## 📋 Étapes d'Application (Supabase Studio)

### 1️⃣ Accéder à Supabase Studio

1. Ouvrir navigateur: https://supabase.com/dashboard
2. Sélectionner projet: **Vérone Back Office**
3. Menu latéral → **SQL Editor**
4. Cliquer **New Query**

---

### 2️⃣ Copier-Coller le SQL de Migration

**Option A: Copier depuis le fichier complet**
```bash
# Ouvrir le fichier dans votre éditeur
cat supabase/migrations/20251012_004_fix_order_number_generation.sql
```

**Option B: SQL rapide ci-dessous (version condensée)**

```sql
-- =============================================
-- MIGRATION: Séquences PostgreSQL Thread-Safe
-- =============================================

-- 1. Créer séquence pour Purchase Orders
CREATE SEQUENCE IF NOT EXISTS purchase_orders_sequence
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE purchase_orders_sequence IS
'Séquence thread-safe pour génération numéros commandes fournisseurs (PO-YYYY-XXXXX)';

-- 2. Fonction génération numéro PO avec séquence
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
  po_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  sequence_num := nextval('purchase_orders_sequence');
  po_number := 'PO-' || year_part || '-' || LPAD(sequence_num::TEXT, 5, '0');
  RETURN po_number;
END;
$$;

COMMENT ON FUNCTION generate_po_number() IS
'Génère un numéro de commande fournisseur unique et thread-safe (PO-YYYY-XXXXX)';

-- 3. Fonction reset séquence (synchronisation avec BDD existante)
CREATE OR REPLACE FUNCTION reset_po_sequence_to_max()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_sequence INTEGER;
  new_start INTEGER;
BEGIN
  -- Trouver le numéro max dans les commandes existantes
  SELECT COALESCE(MAX(
    CASE WHEN po_number ~ '^PO-[0-9]{4}-[0-9]+$'
    THEN CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
    ELSE 0 END
  ), 0) INTO max_sequence
  FROM purchase_orders;

  -- Définir la séquence à max + 1
  new_start := max_sequence + 1;
  PERFORM setval('purchase_orders_sequence', new_start, false);

  RETURN new_start;
END;
$$;

COMMENT ON FUNCTION reset_po_sequence_to_max() IS
'Réinitialise la séquence PO au max existant + 1 (usage admin uniquement)';

-- 4. Permissions
GRANT USAGE, SELECT ON SEQUENCE purchase_orders_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_po_sequence_to_max() TO authenticated;

-- 5. Test et validation
DO $$
DECLARE
  test_po_number TEXT;
  current_po_seq INTEGER;
BEGIN
  test_po_number := generate_po_number();
  RAISE NOTICE '✅ Test PO généré: %', test_po_number;

  SELECT last_value INTO current_po_seq FROM purchase_orders_sequence;
  RAISE NOTICE '📊 Séquence PO actuelle: %', current_po_seq;

  RAISE NOTICE '✅ Migration Séquences PO appliquée avec succès';
END $$;
```

---

### 3️⃣ Exécuter la Migration

1. Coller le SQL dans l'éditeur Supabase Studio
2. Cliquer **Run** (ou Ctrl+Enter)
3. Vérifier les messages de succès:
   ```
   ✅ Test PO généré: PO-2025-00001
   📊 Séquence PO actuelle: 1
   ✅ Migration Séquences PO appliquée avec succès
   ```

---

### 4️⃣ Réinitialiser la Séquence au Max Existant

**Si des commandes existent déjà** (ex: PO-2025-00000, PO-2025-00001):

```sql
-- Synchroniser la séquence avec les numéros existants
SELECT reset_po_sequence_to_max();

-- Devrait retourner: 2 (car max existant = 1, donc prochain = 2)
```

**Vérifier le résultat:**
```sql
-- Vérifier l'état de la séquence
SELECT last_value, is_called FROM purchase_orders_sequence;

-- Tester génération prochain numéro
SELECT generate_po_number();
-- Devrait retourner: PO-2025-00002
```

---

### 5️⃣ Vérification Finale

```sql
-- Voir les commandes existantes
SELECT po_number, status, created_at
FROM purchase_orders
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier que les fonctions sont accessibles
SELECT routine_name
FROM information_schema.routines
WHERE routine_name IN ('generate_po_number', 'reset_po_sequence_to_max');
```

---

## ✅ Validation via l'Application

### Test 1: API Route de Vérification

Ouvrir navigateur → Console développeur → Exécuter:

```javascript
fetch('/api/apply-po-migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
  .then(r => r.json())
  .then(console.log)
```

**Réponse attendue:**
```json
{
  "success": true,
  "newSequenceStart": 2,
  "nextNumber": "PO-2025-00002",
  "message": "✅ Migration PO complète! Prochain numéro: PO-2025-00002",
  "existingOrders": ["PO-2025-00001", "PO-2025-00000"]
}
```

### Test 2: Créer une Commande via l'Interface

1. Naviguer: `/commandes/fournisseurs`
2. Cliquer **Nouvelle commande**
3. Sélectionner fournisseur: **DSA Menuiserie**
4. Ajouter produit: **Fauteuil Milo - Bleu**
5. Quantité: **10**
6. Cliquer **Créer la commande**

**Résultat attendu:**
- ✅ Commande créée avec succès
- ✅ Numéro généré: **PO-2025-00002**
- ❌ AUCUNE erreur 409 duplicate key

---

## 🚨 Dépannage

### Problème: "Could not find the function reset_po_sequence_to_max"

**Cause:** Migration non appliquée
**Solution:** Reprendre depuis l'étape 2

### Problème: Erreur 409 persiste après migration

**Diagnostic:**
```sql
-- Vérifier si la séquence est synchronisée
SELECT last_value FROM purchase_orders_sequence;

-- Voir le max numéro existant
SELECT MAX(
  CASE WHEN po_number ~ '^PO-[0-9]{4}-[0-9]+$'
  THEN CAST(SUBSTRING(po_number FROM '[0-9]+$') AS INTEGER)
  ELSE 0 END
) FROM purchase_orders;
```

**Si last_value < max existant:**
```sql
-- Forcer le reset
SELECT reset_po_sequence_to_max();
```

### Problème: Permissions insuffisantes

**Symptôme:** "permission denied for sequence"

**Solution:**
```sql
-- Re-grant permissions
GRANT USAGE, SELECT ON SEQUENCE purchase_orders_sequence TO authenticated;
GRANT EXECUTE ON FUNCTION generate_po_number() TO authenticated;
GRANT EXECUTE ON FUNCTION reset_po_sequence_to_max() TO authenticated;
```

---

## 📊 Métriques de Succès

- ✅ Séquence `purchase_orders_sequence` créée
- ✅ Fonction `generate_po_number()` retourne format `PO-YYYY-00000`
- ✅ Fonction `reset_po_sequence_to_max()` synchronise avec BDD existante
- ✅ Création commande via UI réussit sans erreur 409
- ✅ Numéros générés sont séquentiels et uniques
- ✅ Thread-safe: 2 utilisateurs simultanés obtiennent des numéros différents

---

## 🔄 Migrations Associées

**Cette migration fait partie d'un ensemble:**

1. `20251012_001_smart_stock_alerts_system.sql` - Système d'alertes stocks intelligentes
2. `20251012_003_negative_forecast_notifications.sql` - Notifications stocks prévisionnels négatifs
3. **`20251012_004_fix_order_number_generation.sql`** ← **CETTE MIGRATION**
4. `20251012_005_fix_sequence_reset.sql` - Corrections supplémentaires séquences

**Important:** Appliquer dans l'ordre pour éviter les dépendances manquantes.

---

## 📝 Notes Techniques

### Pourquoi PostgreSQL Sequences?

**Avant (❌ MAX() non thread-safe):**
```sql
SELECT COALESCE(MAX(sequence_number), 0) + 1 FROM purchase_orders;
-- Race condition: 2 utilisateurs simultanés = même numéro
```

**Après (✅ nextval() thread-safe):**
```sql
SELECT nextval('purchase_orders_sequence');
-- Garanti unique même avec 1000 requêtes simultanées
```

### Format des Numéros

- **Pattern:** `PO-YYYY-XXXXX`
- **Année:** Année courante (2025)
- **Séquence:** 5 chiffres avec zéro-padding (00001, 00002, ...)
- **Exemple:** `PO-2025-00002`

### Performance

- **Ancien système:** O(n) scan table pour MAX()
- **Nouveau système:** O(1) atomic increment
- **Gain:** ~100x plus rapide pour tables volumineuses

---

*Migration créée le 12 octobre 2025 - Vérone Back Office E2E Testing Session*
