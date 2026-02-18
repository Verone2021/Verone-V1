# Audit Complet : Workflow Commissions LinkMe

**Date** : 2026-02-10
**Contexte** : Investigation avant correction des statuts commandes importées
**Agent** : Claude Sonnet 4.5

---

## 🎯 DÉCOUVERTES CRITIQUES

### 1. **Workflow Commission Actuel (VALIDÉ)**

```
┌─────────────────────────────────────────────────────────────────┐
│                   WORKFLOW COMMISSION LINKME                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Commande livrée → status = 'delivered'                     │
│     ↓                                                           │
│  2. TRIGGER crée commission                                     │
│     - Si payment_status = 'paid' → commission.status = 'payable'│
│     - Sinon → commission.status = 'pending'                     │
│     ↓                                                           │
│  3. Plus tard : Client paie → payment_status = 'paid'          │
│     ↓                                                           │
│  4. TRIGGER met à jour commission.status = 'payable'           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. **Statuts Commission (Enum Actuel)**

| Statut        | Signification                          | Workflow                                        |
| ------------- | -------------------------------------- | ----------------------------------------------- |
| `pending`     | Client n'a pas payé                    | Créée à la livraison si payment_status ≠ 'paid' |
| `validated`   | ⚠️ NON UTILISÉ                         | (Ancien workflow, deprecated)                   |
| **`payable`** | **Client a payé, commission éligible** | **Statut cible actuel**                         |
| `paid`        | Affilié a reçu son argent              | (Futur : quand Verone paie l'affilié)           |
| `cancelled`   | Commission annulée                     | (Edge case)                                     |

### 3. **Triggers Actifs sur `sales_orders`**

| Trigger                          | Condition                 | Action                              |
| -------------------------------- | ------------------------- | ----------------------------------- |
| `trg_create_linkme_commission`   | `status = 'delivered'`    | Crée commission (UPSERT idempotent) |
| `trg_sync_commission_on_payment` | `payment_status → 'paid'` | Met commission à 'payable'          |

**Code Source** : `supabase/migrations/20251218_003_fix_commission_idempotence.sql`

### 4. **Données Actuelles (État Réel)**

```sql
-- Distribution commissions
payable : 96  ✅ Client a payé, commission éligible
pending : 3   ⏳ Client n'a pas payé

-- Commandes LinkMe sans commission
1 seule : [TEST]-CMD-001 (commande test récente, pas import)

-- Corrélation parfaite (100%)
payment_status = 'paid'    → commission.status = 'payable' (96)
payment_status = 'pending' → commission.status = 'pending' (3)
```

---

## 🔍 ANALYSE : Impact Migration `shipped → delivered`

### Question Initiale

> **Romeo** : "Si je migre les 99 commandes de `shipped` vers `delivered`, est-ce que ça va créer des problèmes avec le stock ou les commissions ?"

### Réponse : NON, Aucun Impact Négatif

#### ✅ **Stock : AUCUN IMPACT**

Les triggers stock s'exécutent UNIQUEMENT sur ces transitions :

- `draft → validated` : Réserve stock forecasted_out
- `validated → draft` : Libère stock forecasted_out
- `→ cancelled` : Rollback stock

**Transition `shipped → delivered` = Changement administratif UNIQUEMENT** (pas de mouvement stock)

#### ✅ **Commissions : DÉJÀ CRÉÉES**

- 99 commandes importées LinkMe
- 98 ont DÉJÀ leur commission créée (seulement 1 commande test sans commission)
- Migration vers `delivered` = UPSERT idempotent (pas de doublon grâce à contrainte UNIQUE)

**Trigger UPSERT** :

```sql
INSERT INTO linkme_commissions (...)
VALUES (...)
ON CONFLICT (order_id) DO UPDATE SET
  affiliate_commission = EXCLUDED.affiliate_commission,
  status = EXCLUDED.status,
  updated_at = NOW();
```

**Effet attendu** : Mise à jour status commission selon `payment_status` actuel (96 → 'payable', 3 → 'pending')

---

## 🚨 INCOHÉRENCE DÉTECTÉE : Workflow Déclaré vs Réalité

### Ce que Romeo a dit

> "Commission payable = quand commande PAYÉE (payment_status = 'paid')"

### Ce que le trigger fait

✅ **CONFORME** : Le trigger crée la commission sur `delivered` ET son statut dépend de `payment_status`

### Workflow Officiel (Documenté)

```
pending → validated → requested → paid
```

### Workflow Réel (Données)

```
pending → payable → paid
```

**Statut `validated` n'est JAMAIS utilisé** dans les données actuelles (0 commissions).

**Conclusion** : Il y a eu une évolution du workflow après décembre 2025. Le statut `payable` a remplacé `validated`.

**Source des incohérences** :

- Migration `20251217_002` voulait utiliser `validated`
- Migration postérieure (non trouvée) a changé pour `payable`
- Check constraint actuel : `['pending', 'validated', 'payable', 'paid', 'cancelled']`

---

## 📋 RECOMMANDATIONS

### 1. **Migration `shipped → delivered` : GO**

**Commandes à corriger** : 99 commandes avec `delivered_at` renseigné

```sql
UPDATE sales_orders
SET
  status = 'delivered',
  closed_at = COALESCE(closed_at, delivered_at, NOW()),
  updated_at = NOW()
WHERE status = 'shipped'
  AND delivered_at IS NOT NULL;
```

**Impact attendu** :

- ✅ Statut cohérent avec `delivered_at`
- ✅ Commissions déjà créées (UPSERT = mise à jour sans doublon)
- ✅ Aucun impact stock (transition administrative)
- ⚠️ **Notifications désactivées temporairement** (éviter spam)

### 2. **Clarifier Workflow Commission**

**Options** :

**Option A** : Garder `payable` (statut actuel)

- ✅ Conforme aux données existantes
- ✅ Nom explicite ("payable" = éligible pour paiement)
- ❌ Incohérent avec doc `20251217_002`

**Option B** : Migrer `payable → validated`

- ✅ Conforme à la doc officielle
- ❌ Nécessite migration + update triggers
- ❌ Breaking change pour frontend ?

**Recommandation** : **Option A** (garder `payable`)

- Workflow actuel fonctionne
- Pas de breaking change
- Documenter que `payable` = statut officiel (supprimer `validated` du check constraint)

### 3. **Documentation à Mettre à Jour**

Fichiers à corriger :

- `supabase/migrations/20251217_002_fix_commission_workflow.sql` : Commentaires obsolètes
- `docs/database/sales-order-status-correction-2026-02-10.md` : Nouveau fichier à créer
- `.serena/memories/linkme-commission-workflow` : Mémoire Serena à créer

---

## ✅ VALIDATIONS PRÉ-MIGRATION

### Checklist Sécurité

- [x] Stock inchangé si migration `shipped → delivered` ✅
- [x] Commissions déjà créées (99/100, 1 commande test OK) ✅
- [x] Trigger UPSERT = idempotent (pas de doublon) ✅
- [x] Workflow `payment_status → commission.status` validé ✅
- [ ] Décision Romeo : Désactiver notifications pendant migration ?
- [ ] Décision Romeo : Garder `payable` ou migrer vers `validated` ?

---

## 📊 REQUÊTES AUDIT UTILISÉES

```sql
-- 1. Schéma linkme_commissions
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'linkme_commissions'
ORDER BY ordinal_position;

-- 2. Distribution statuts commissions
SELECT status, COUNT(*) as count
FROM linkme_commissions
GROUP BY status;

-- 3. Corrélation payment_status ↔ commission_status
SELECT lc.status as commission_status, so.payment_status, COUNT(*)
FROM linkme_commissions lc
JOIN sales_orders so ON lc.order_id = so.id
GROUP BY lc.status, so.payment_status;

-- 4. Commandes LinkMe sans commission
SELECT so.id, so.order_number, so.status, so.payment_status
FROM sales_orders so
WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  AND NOT EXISTS (SELECT 1 FROM linkme_commissions lc WHERE lc.order_id = so.id);

-- 5. Triggers actifs
SELECT tgname, tgenabled, proname
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'sales_orders'::regclass
  AND tgname ILIKE '%commission%';
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Décision Romeo** : Valider l'approche (Option A ou B pour workflow commission)
2. **Créer migration** : `20260210_003_fix_delivered_status_imported_orders.sql`
3. **Appliquer migration** : Via MCP Supabase (avec validations pré/post)
4. **Commit + Push** : Sauvegarder migration dans repo
5. **Documentation** : Mettre à jour workflow officiel

---

**Fin du rapport**
