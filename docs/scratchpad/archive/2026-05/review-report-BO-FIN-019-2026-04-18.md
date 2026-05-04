Verdict : PASS

# Review Report — BO-FIN-019 DROP create_purchase_order + cleanup ACTIVE.md

Branche : `chore/BO-FIN-019-drop-create-purchase-order`

## Scope

1. Migration SQL `20260425_bo_fin_019_drop_create_purchase_order.sql` : drop de la fonction PL/pgSQL dead code.
2. Mise a jour `ACTIVE.md` : marquer BO-FIN-017/019 RESOLUS, retirer BO-FIN-021 (deja resolu via BO-FIN-022).

## Verifications dead code (pre-drop)

- `pg_stat_user_functions WHERE funcname = 'create_purchase_order'` : **0 entree** (0 calls lifetime).
- Grep apps/ + packages/ hors `supabase.ts` : **0 reference applicative**.
- 2 references dans `apps/back-office/src/types/supabase.d.ts` : types auto-generes uniquement, pas de call.
- 24 PO creees sur 90 derniers jours via d'autres chemins : la fonction n'est PAS le chemin actif.
- Colonne `purchase_orders.tva_amount` n'existe pas : toute invocation aurait leve une erreur SQL.

## Verification post-drop

- `SELECT 1 FROM pg_proc WHERE proname = 'create_purchase_order' AND pronamespace = 'public'::regnamespace` : 0 ligne ✓
- DO $$ de verification integre dans la migration RAISE si la fonction persiste.

## ACTIVE.md

- BO-FIN-017 : section mise a jour, RESOLU (proforma soft-deleted 2026-04-17 20:24 UTC).
- BO-FIN-019 : section mise a jour, RESOLU (drop applique).
- BO-FIN-021 : retire (doublon de BO-FIN-022 deja merge dans PR #643).
- BO-FIN-018 / BO-FIN-020 : conserves (non bloquants, en backlog).

## PR autorisee

Chore DB + doc, aucun impact runtime. Dead code elimine, ACTIVE.md nettoye.
