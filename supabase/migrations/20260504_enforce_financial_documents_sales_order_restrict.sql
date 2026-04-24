-- ============================================================================
-- ADR-018 — Rétroactive : officialise ON DELETE RESTRICT
-- ============================================================================
--
-- Contexte :
--   La FK `financial_documents.sales_order_id` → `sales_orders(id)` a été
--   définie comme `ON DELETE SET NULL` dans la migration d'origine
--   `20251222_012_create_financial_tables.sql:221`.
--
--   Elle a ensuite été modifiée en `ON DELETE RESTRICT` directement en DB
--   (via SQL Editor Supabase), sans migration versionnée. Le 2026-04-24
--   `scripts/db-drift-check.py` a détecté ce drift.
--
--   Discussion avec Romeo (2026-04-24) : le comportement RESTRICT est en
--   réalité celui souhaité. Il force à passer par le pipeline officiel
--   d'annulation (`POST /api/sales-orders/[id]/cancel` +
--   `cascade-cancel-linked-docs.ts`, introduit par BO-FIN-023) qui applique
--   les règles métier :
--     - Facture unpaid/paid/overdue → REFUSE (créer un avoir d'abord)
--     - Devis accepté → CASCADE_CONFIRM (modal rouge)
--     - Devis draft/finalized/expired + proforma draft → CASCADE_AUTO
--
--   Un `SET NULL` accidentel permettrait à un DELETE SQL brut de contourner
--   ces règles → traçabilité comptable cassée.
--
-- Décision (ADR-018, Option B) :
--   Officialiser RESTRICT dans une migration versionnée. Aucun changement
--   de comportement prod — on documente ce qui est déjà en place.
--
-- Effet :
--   - `db-drift-check.py` arrête de signaler ce drift au prochain run.
--   - Le hook `deleteOrder` (packages/@verone/orders/src/hooks/
--     use-sales-orders-mutations.ts) continue à purger les
--     `financial_documents.sales_order_id` soft-deletés avant DELETE —
--     c'est le contournement légitime pour supprimer une commande annulée.
-- ============================================================================

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_sales_order_id_fkey;

ALTER TABLE financial_documents
  ADD CONSTRAINT financial_documents_sales_order_id_fkey
  FOREIGN KEY (sales_order_id)
  REFERENCES sales_orders(id)
  ON DELETE RESTRICT;

COMMENT ON CONSTRAINT financial_documents_sales_order_id_fkey ON financial_documents IS
  'ADR-018 (2026-04-24) : RESTRICT officialisé. Force le passage par le pipeline cascade-cancel-linked-docs (BO-FIN-023) avant toute suppression de commande liée. Voir .claude/DECISIONS.md.';
