# 🚀 Migrations à Appliquer - 2025-11-18

## ⚠️ CRITIQUE - 3 migrations requises pour fix prix + réduction

### 📋 Ordre d'Application (RESPECTER L'ORDRE)

```sql
1. 20251118_001_channel_pricing_history.sql
2. 20251118_002_fix_site_internet_rpc_filter_eligible_only.sql
3. 20251118_003_fix_channel_pricing_constraint_allow_price_and_discount.sql ⭐ CRITIQUE
```

---

## 🎯 Migration 1/3 : Historique Pricing

**Fichier** : `20251118_001_channel_pricing_history.sql`

**But** : Tracer historique modifications pricing canal

**Action** :

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter

---

## 🎯 Migration 2/3 : RPC discount_rate

**Fichier** : `20251118_002_fix_site_internet_rpc_filter_eligible_only.sql`

**But** : Ajouter champ `discount_rate` au RPC `get_site_internet_products()`

**Action** :

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter

---

## 🔴 Migration 3/3 : Fix Contrainte DB (BLOQUEUR ACTUEL)

**Fichier** : `20251118_003_fix_channel_pricing_constraint_allow_price_and_discount.sql`

**But** : Autoriser `custom_price_ht` + `discount_rate` simultanés

**Problème Résolu** :

- ❌ AVANT : Erreur 23514 lors sauvegarde prix 200€ + réduction 20%
- ✅ APRÈS : Prix custom + réduction autorisés (cas d'usage valide)

**Action** :

1. Ouvrir Supabase Dashboard → SQL Editor
2. Copier-coller le contenu du fichier
3. Exécuter

---

## ✅ Validation Post-Migration

Après avoir appliqué les 3 migrations :

1. Retourner sur http://localhost:3000/canaux-vente/site-internet
2. Cliquer "Éditer" sur produit "Fauteuil Milo - Beige"
3. Onglet "Tarification"
4. Entrer :
   - Prix HT custom canal : 200€
   - Taux de réduction : 20%
5. Vérifier preview :
   - Badge : "🏷️ PROMO -20%"
   - Prix original HT : 200.00 €
   - Prix réduit HT : 160.00 €
   - Prix TTC final : 192.00 €
6. Cliquer "Sauvegarder"
7. ✅ Devrait sauvegarder SANS erreur

---

## 🔗 Accès Dashboard Supabase

**URL** : https://supabase.com/dashboard/project/dmwcnbcussoqychafcjg

**Navigation** :

1. Sélectionner projet "Vérone Back Office"
2. Aller dans "SQL Editor" (menu gauche)
3. Créer nouvelle query
4. Copier-coller migration
5. Run (Ctrl+Enter)

---

## 📊 Diagnostic Si Erreur Persiste

```sql
-- Vérifier contraintes actuelles sur channel_pricing
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'channel_pricing'
  AND con.contype = 'c'
ORDER BY con.conname;
```

**Résultat attendu** :

- ✅ `pricing_mode_flexible` doit exister
- ❌ `pricing_mode_exclusive` ne doit PLUS exister

---

## 🆘 Alternative : Appliquer via CLI

Si Dashboard ne fonctionne pas :

```bash
# 1. Démarrer Docker Desktop
# 2. Lancer Supabase local
supabase start

# 3. Appliquer migrations
supabase db push

# 4. Vérifier
supabase db diff
```
