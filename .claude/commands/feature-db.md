# WORKFLOW: EXPERT DATABASE & STOCK

**Mode activé :** Expert Base de Données & Gestion Stock
**Objectif :** Modifier la structure de données ou les triggers sans casser la logique métier existante.

---

## 🚨 RÈGLE D'OR : "READ BEFORE WRITE"

**INTERDICTION FORMELLE** de proposer une migration ou du code SQL sans analyse préalable complète.

---

## 📋 CHECKLIST OBLIGATOIRE (5 ÉTAPES)

### 1️⃣ SYNC & ANALYSE SOURCE DE VÉRITÉ

**Actions à exécuter :**

```bash
# Lire la source de vérité TypeScript
cat packages/@verone/types/src/supabase.ts | grep -A 20 "nom_table"

# Vérifier les dernières migrations appliquées
ls -lt supabase/migrations/ | head -10

# Si disponible : Vérifier l'état cloud
# /db migrations status
```

**Questions à répondre :**

- ✅ La table existe-t-elle déjà ?
- ✅ Y a-t-il des colonnes similaires (éviter les doublons) ?
- ✅ Quels sont les types de données existants (Enum, Jsonb, etc.) ?
- ✅ Y a-t-il des migrations récentes sur cette table (risque de conflit) ?

---

### 2️⃣ AUDIT TRIGGERS & CONTRAINTES

**Actions à exécuter :**

```bash
# Lister les triggers sur la table cible (via /db si disponible)
# /db query "SELECT * FROM pg_trigger WHERE tgrelid = 'nom_table'::regclass"

# Vérifier les contraintes
# /db schema nom_table
```

**⚠️ ATTENTION CRITIQUE : STOCK & CALCULS**

Si la modification touche à :

- `products` (stock, forecasted_stock)
- `purchase_orders` (quantity_ordered, quantity_received)
- `sales_orders` (quantity)
- `stock_movements` (quantity_after)

**Tu DOIS vérifier :**

- Les triggers de recalcul automatique (maintain_stock_coherence, handle_purchase_order_forecast, etc.)
- Les risques de boucles infinies (trigger → update → trigger)
- Les règles de validation (valid_quantity_logic, check_reorder_threshold)

**Règle Stock :** Les calculs critiques doivent être faits en **SQL (Triggers)** pour garantir l'ACIDité, pas en TypeScript.

---

### 3️⃣ VÉRIFIER DOUBLONS & RÉUTILISATION

**Actions à exécuter :**

```bash
# Chercher si une fonction RPC existe déjà pour ce besoin
grep -r "CREATE OR REPLACE FUNCTION" supabase/migrations/ | grep "nom_besoin"

# Vérifier si une colonne similaire existe déjà
# Exemple : Ne pas créer `tel_client` si `phone` existe déjà
cat packages/@verone/types/src/supabase.ts | grep -i "phone\|tel\|mobile"
```

**Questions à répondre :**

- ✅ Existe-t-il déjà une fonction RPC pour ce calcul ?
- ✅ Puis-je réutiliser une colonne existante ?
- ✅ Y a-t-il un pattern similaire dans une autre table ?

---

### 4️⃣ PLANIFIER LA MODIFICATION

**Rédiger un plan détaillé :**

```markdown
## PLAN DE MODIFICATION

**Table(s) impactée(s) :** `nom_table`

**Changements :**

1. Ajouter colonne `nouvelle_colonne` (type: `enum`, valeurs: ['A', 'B', 'C'])
2. Créer trigger `nom_trigger` pour recalculer `champ_X`
3. Mettre à jour RLS policy `nom_policy`

**Impacts :**

- ⚠️ Impact sur trigger existant `ancien_trigger` (risque de conflit)
- ✅ Pas d'impact sur stock_movements (validation OK)

**Fichiers à créer/modifier :**

- `supabase/migrations/YYYYMMDD_XXX_description.sql`
- Mettre à jour `packages/@verone/types/src/supabase.ts` via `npm run generate:types`

**Tests de validation :**

- Tester insertion avec nouvelle enum
- Vérifier recalcul automatique via trigger
- Tester RLS policy avec utilisateur authentifié
```

---

### 5️⃣ STOP & VALIDATION

**🛑 ARRÊT OBLIGATOIRE**

**NE GÉNÈRE AUCUN FICHIER SQL OU TYPESCRIPT.**

Présente le plan complet au développeur et attends son **"GO"** explicite.

**Questions de validation :**

- Le plan est-il clair et complet ?
- Tous les impacts ont-ils été identifiés ?
- Les risques sont-ils documentés ?
- La stratégie de test est-elle définie ?

**Seulement après validation :**

1. Créer le fichier de migration `YYYYMMDD_XXX_description.sql`
2. Exécuter la migration (Supabase Studio ou CLI)
3. Lancer `npm run generate:types` (depuis la racine)
4. Tester les modifications
5. Mettre à jour la documentation avec `/update-docs`

---

## 🎯 EXEMPLES DE CAS D'USAGE

### Cas 1 : Ajouter une colonne Enum

**Mauvais workflow :**
❌ "Je vais créer une migration pour ajouter `status` dans `orders`"

**Bon workflow :**

1. ✅ Lire `supabase.ts` → Découvrir que `order_status` existe déjà
2. ✅ Vérifier migrations → Voir qu'un enum `order_status_enum` existe déjà
3. ✅ Plan : Réutiliser l'enum existant au lieu d'en créer un nouveau
4. ✅ STOP → Présenter le plan
5. ✅ Après GO → Créer la migration

### Cas 2 : Modifier un calcul de stock

**Mauvais workflow :**
❌ "Je vais ajouter du code TypeScript pour recalculer le stock"

**Bon workflow :**

1. ✅ Lire `supabase.ts` → Identifier `forecasted_stock` calculé par trigger
2. ✅ Vérifier migrations → Trouver `maintain_stock_coherence`
3. ✅ Audit triggers → Comprendre la logique actuelle
4. ✅ Plan : Modifier le trigger SQL (pas TypeScript) pour garantir ACID
5. ✅ STOP → Présenter le plan avec analyse de risques
6. ✅ Après GO → Créer la migration + Tests

---

## ⚙️ OUTILS COMPLÉMENTAIRES

Une fois le workflow terminé, utilise ces outils pour valider :

- **`/db migrations status`** - Vérifier l'état des migrations
- **`/db schema nom_table`** - Inspecter la structure
- **`/db advisors security`** - Vérifier les RLS policies
- **`/db advisors performance`** - Vérifier les indexes
- **`/db rls-test nom_table authenticated`** - Tester les RLS

---

## 🚫 ANTI-PATTERNS À ÉVITER

❌ **Créer une migration sans lire `supabase.ts`**
→ Risque de doublon ou de conflit

❌ **Modifier un trigger sans comprendre son rôle**
→ Risque de casser les calculs de stock

❌ **Utiliser `Text` au lieu de `Enum` pour les statuts**
→ Perte de validation type-safe

❌ **Faire des calculs critiques en TypeScript au lieu de SQL**
→ Perte de garanties ACID

❌ **Ignorer les migrations récentes**
→ Risque d'écraser une logique fraîchement ajoutée

---

**MODE EXPERT DATABASE ACTIVÉ.**
Procède maintenant avec la checklist ci-dessus. Ne génère aucun code avant l'étape 5 (STOP & VALIDATION).
