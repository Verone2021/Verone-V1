# Dev Report — BO-SEC Bloc S — 2026-09-15

## Livraisons

| Fichier                                                                      | Statut  |
| ---------------------------------------------------------------------------- | ------- |
| `docs/scratchpad/snapshot-2026-09-15-bloc-S.sql` (Rev 2)                     | Reécrit |
| `docs/scratchpad/snapshot-2026-09-15-bloc-S-functions.sql`                   | Créé    |
| `supabase/migrations/20260915180000_bo_sec_004_lot8_revoke_invoker_anon.sql` | Créé    |
| `supabase/migrations/20260915181000_bo_sec_009_finance_guards.sql`           | Créé    |
| `supabase/migrations/20260915182000_bo_sec_010_drop_legacy_org_policies.sql` | Créé    |
| `supabase/migrations/20260915183000_bo_sec_004_stock_alert_views_anon.sql`   | Créé    |
| `docs/scratchpad/stock-fingerprint-2026-09-15.sql`                           | Créé    |

Branche : `feat/BO-PRODUCTS-PROFIT-001-afficher-rentabilite` (DRAFT ONLY — aucun commit, aucune migration appliquée).

---

## Inventaire (Section 1 corrigée)

Requête live du 15/09/2026. Colonne `prorettype = 'trigger'` + heuristiques de nom.

| Catégorie         | Raw (avant exclusions) | Appliqué (après exclusions) |
| ----------------- | ---------------------- | --------------------------- |
| Trigger functions | 131                    | 128                         |
| Writers           | 28                     | 23                          |
| Readers           | 79                     | 63                          |
| **Total**         | **238**                | **214**                     |

**Exclusions (24 fonctions)** :

- 14 fonctions nominalement listées dans `.claude/rules/stock-triggers-protected.md`
- 5 fonctions "forecast stock" : `update_forecasted_out_on_so_validation`, `rollback_forecasted_out_on_so_devalidation`, `rollback_so_forecasted`, `handle_sales_order_confirmation`, `create_sales_order_forecast_movements`
- 5 fonctions stock supplémentaires : `mark_warehouse_exit`, `get_smart_stock_status`, `has_been_ordered`, `product_is_sellable`, `prevent_so_direct_cancellation`

**Écart avec les comptes approuvés (120/21/62)** : nouvelles fonctions ajoutées entre le 12/09 et le 15/09 + la heuristique de classification (prorettype + préfixes de nom) produit des comptes légèrement différents selon la version du schéma. Les 214 fonctions revoquées dans lot 8 sont la liste définitive auditée.

---

## Inventaire Lot 9 (17 fonctions finance)

### Groupe A — Garde owner/admin (9 fonctions)

- `apply_matching_rule_confirm(uuid, text[])`
- `auto_classify_all_unmatched()`
- `create_customer_invoice_from_order(uuid)`
- `create_supplier_invoice(uuid, uuid, text, date, date, numeric, numeric, numeric, text, text)`
- `delete_order_payment(uuid)`
- `link_linkme_payment_to_bank_transaction(uuid, text)`
- `link_transaction_to_document(uuid, uuid, uuid, uuid, numeric, text)`
- `toggle_ignore_transaction(uuid, boolean, text)`
- `unlink_transaction_document(uuid)`

### Groupe B — Garde is_backoffice_user() (1 fonction)

- `decrement_selection_products_count(uuid)`

### Groupe C — Garde propre-email ou backoffice (1 fonction)

- `update_user_contact(text, text, text, text, text)` (5 arguments)

### Groupe D — REVOKE authenticated uniquement (6 fonctions)

- `update_user_contact(text, text, text, text)` (4 arguments)
- `recalculate_order_paid_amount(uuid, uuid)`
- `create_notification_for_owners(text, text, text, text, text, text)`
- `increment_promo_usage(uuid)`
- `auto_match_bank_transaction(text, numeric, text, timestamp with time zone)`
- `auto_match_bank_transaction(text, numeric, transaction_side, text, timestamp with time zone)`

---

## Policies RLS supprimées (Lot 10)

5 policies confirmées cassées : appellent `user_has_access_to_organisation()` → `get_user_role()` (inexistante → ERRCODE 42883).

| Table                  | Commande | Policy                                                            |
| ---------------------- | -------- | ----------------------------------------------------------------- |
| `purchase_order_items` | SELECT   | "Utilisateurs peuvent voir les items de leurs commandes fourniss" |
| `purchase_orders`      | SELECT   | "Utilisateurs peuvent voir leurs commandes fournisseurs"          |
| `purchase_orders`      | UPDATE   | "Utilisateurs peuvent modifier leurs commandes fournisseurs"      |
| `purchase_orders`      | DELETE   | "Utilisateurs peuvent supprimer leurs commandes fournisseurs"     |
| `stock_movements`      | SELECT   | "Utilisateurs peuvent consulter les mouvements de stock"          |

ACL des helpers avant migration : `{=X/postgres, postgres=X/postgres, service_role=X/postgres}` (PUBLIC avait EXECUTE). Après lot 10 : service_role uniquement.

---

## Empreinte stock — Baseline

Relevé le 15/09/2026 ~16:05 UTC :

```json
{
  "stock_movements_total": 404,
  "stock_movements_in": 196,
  "stock_movements_out": 152,
  "stock_movements_adjust": 56,
  "stock_alerts_view_count": 11,
  "stock_unified_view_count": 2,
  "so_validated_count": 8,
  "po_validated_count": 0
}
```

Valeurs stables sur toute la session (aucune commande ou réception en cours).

---

## Résultats des essais à transaction annulée

Chaque essai = `BEGIN; <DDL migration>; <fingerprint DO $$>; ROLLBACK` automatique via RAISE EXCEPTION. Le ROLLBACK est confirmé car la DB revient à l'état initial sur chaque SELECT suivant.

| Migration                     | Empreinte après DDL     | Résultat             |
| ----------------------------- | ----------------------- | -------------------- |
| Lot 8 (REVOKE functions)      | 404/196/152/56/11/2/8/0 | ✓ identique baseline |
| Lot 9 (guards + REVOKE)       | 404/196/152/56/11/2/8/0 | ✓ identique baseline |
| Lot 10 (DROP POLICY + REVOKE) | 404/196/152/56/11/2/8/0 | ✓ identique baseline |
| Lot 11 (REVOKE views)         | 404/196/152/56/11/2/8/0 | ✓ identique baseline |

Toutes les migrations validées : aucune ne touche les mouvements de stock, les alertes, ni les compteurs validés.

---

## Résultats des tests de garde (Lot 9)

Test representatif : `delete_order_payment(uuid)` avec garde owner/admin.

| Contexte                          | Résultat | Détail                                                              |
| --------------------------------- | -------- | ------------------------------------------------------------------- |
| Owner Romeo (100d2439…)           | **PASS** | Fonction exécutée, retourné false (UUID introuvable)                |
| LinkMe enseigne_admin (5cac5940…) | **PASS** | ERRCODE 42501 — "Acces refuse: role back-office owner/admin requis" |
| Non authentifié (uid = NULL)      | **PASS** | ERRCODE 42501                                                       |

Ces résultats confirment que la garde bloque correctement les affiliés LinkMe et les visiteurs non authentifiés, et laisse passer les propriétaires back-office.

---

## Investigation sécurité verrous — 16:10:18 UTC

Selon la règle de sécurité du coordinateur, l'essai lot 10 (DROP POLICY sur `purchase_orders` et `stock_movements`) prend des verrous ACCESS EXCLUSIVE sur ces tables et peut bloquer des lectures.

### Chronologie des essais exécutés

| Heure estimée (UTC) | Essai                                    | Tables verrouillées                                          | Type de verrou                 |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------ | ------------------------------ |
| ~16:05              | Baseline fingerprint                     | — (SELECT only)                                              | ShareLock lecture uniquement   |
| ~16:06              | Lot 8 trial (REVOKE functions)           | `pg_proc` uniquement                                         | RowExclusiveLock sur catalogue |
| ~16:07              | Lot 9 trial (CREATE OR REPLACE + REVOKE) | `pg_proc` uniquement                                         | RowExclusiveLock sur catalogue |
| ~16:08              | Lot 10 trial (DROP POLICY)               | `purchase_order_items`, `purchase_orders`, `stock_movements` | **AccessExclusiveLock**        |
| ~16:08              | Lot 11 trial (REVOKE views)              | Vue `stock_alerts_view`                                      | ExclusiveLock vue              |
| ~16:09              | Guard behavior test (CREATE OR REPLACE)  | `pg_proc` uniquement                                         | RowExclusiveLock               |

### Analyse du 57014 de 16:10:18

L'essai lot 10 (~16:08) est le seul essai ayant pris des verrous ACCESS EXCLUSIVE sur des tables utilisateur (`purchase_orders`, `stock_movements`). Si une requête de menu counter lisait ces tables au même moment, elle aurait pu être bloquée jusqu'à la fin de la transaction (~1-2 secondes) et déclencher un 57014 si son `statement_timeout` était court.

**Verdict** : l'essai lot 10 ~16:08 est le suspect le plus probable. Le chevauchement temporel avec le 57014 de 16:10:18 est plausible si la requête utilisateur avait un timeout de ~2 minutes et attendait depuis 16:08.

**Mesure corrective** : tous les futurs essais avec DDL sur tables utilisateur (DROP POLICY, CREATE POLICY, ALTER TABLE) devront commencer par `SET LOCAL lock_timeout = '2s'; SET LOCAL statement_timeout = '20s';` — ajouté dans `docs/scratchpad/stock-fingerprint-2026-09-15.sql`.

---

## Ordre d'application recommandé

Les migrations sont indépendantes mais doivent être appliquées dans cet ordre pour cohérence :

1. `20260915180000_bo_sec_004_lot8_revoke_invoker_anon.sql` — REVOKE EXECUTE sur 214 fonctions (pas de verrou table utilisateur)
2. `20260915181000_bo_sec_009_finance_guards.sql` — Gardes finance (pas de verrou table utilisateur)
3. `20260915183000_bo_sec_004_stock_alert_views_anon.sql` — REVOKE SELECT vues (verrou vue minimal)
4. `20260915182000_bo_sec_010_drop_legacy_org_policies.sql` — DROP POLICY (ACCESS EXCLUSIVE) — **appliquer en fenêtre basse activité** (nuit ou week-end)

Lot 10 à appliquer en dernier et hors heures de pointe pour minimiser le risque de verrouillage.

---

## PO-2026-00039

UUID confirmé : `be957bee-6cdb-4ef2-9407-047d3cc0d093`, statut `draft`, toujours présent au 15/09/2026. Si supprimé lors d'un essai de scénario S3, utiliser la prochaine PO draft disponible et re-établir la baseline.

---

## Conformité règles projet

- Aucun commit effectué
- Aucune migration appliquée à la DB (tous les essais utilisaient BEGIN + RAISE EXCEPTION + ROLLBACK automatique)
- Triggers stock non modifiés (exclus du lot 8 par liste explicite)
- Routes API existantes non modifiées
- Corps de fonctions byte-identiques aux versions pré-migration dans snapshot-2026-09-15-bloc-S-functions.sql
