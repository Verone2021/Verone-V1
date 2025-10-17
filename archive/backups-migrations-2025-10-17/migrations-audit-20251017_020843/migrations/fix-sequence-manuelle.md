# 🔧 FIX MANUEL: Réinitialiser Séquence SO

## Problème
Erreur 409 Duplicate Key lors de création commande client:
```
duplicate key value violates unique constraint "sales_orders_order_number_key"
```

## Cause
La séquence `sales_orders_sequence` essaie de générer un numéro déjà utilisé.

## Solution Manuelle (via Supabase Studio)

### 1. Se connecter à Supabase Studio
- Aller sur https://supabase.com/dashboard
- Projet: Vérone Back Office
- Section: SQL Editor

### 2. Exécuter cette requête pour voir l'état actuel:
```sql
-- Voir les 15 dernières commandes
SELECT order_number, status, created_at
FROM sales_orders
ORDER BY created_at DESC
LIMIT 15;

-- Voir l'état de la séquence
SELECT last_value, is_called FROM sales_orders_sequence;

-- Trouver le max numéro
SELECT MAX(
  CASE WHEN order_number ~ '^SO-[0-9]{4}-[0-9]+$'
  THEN CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)
  ELSE 0 END
) as max_order_num
FROM sales_orders;
```

### 3. Réinitialiser la séquence au bon numéro:
```sql
-- Si max_order_num = 10, alors:
SELECT setval('sales_orders_sequence', 11, false);

-- OU utiliser la fonction automatique:
SELECT reset_so_sequence_to_max();
```

### 4. Vérifier que ça fonctionne:
```sql
-- Tester génération:
SELECT generate_so_number();
-- Devrait retourner: SO-2025-00011 (ou le prochain numéro libre)
```

## Alternative: Script Node.js Temporaire

Si impossible d'accéder à Supabase Studio, exécuter ce script:

```typescript
// Créer: scripts/fix-sequence.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key requis
)

async function fixSequence() {
  // Appeler la fonction reset
  const { data, error } = await supabase.rpc('reset_so_sequence_to_max')

  if (error) {
    console.error('Erreur:', error)
  } else {
    console.log(`✅ Séquence réinitialisée. Prochain numéro: SO-2025-${String(data).padStart(5, '0')}`)
  }
}

fixSequence()
```

Puis exécuter:
```bash
tsx scripts/fix-sequence.ts
```

## Vérification Post-Fix

Une fois la séquence corrigée, retester la création de commande via l'interface.
