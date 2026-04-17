-- BO-FIN-019 : DROP FUNCTION create_purchase_order (dead code)
--
-- Contexte : cette fonction PL/pgSQL executait un INSERT INTO purchase_orders (..., tva_amount, ...)
-- mais la colonne `purchase_orders.tva_amount` N'EXISTE PAS. Tout appel provoquerait l'erreur
-- `column "tva_amount" of relation "purchase_orders" does not exist`.
--
-- Verifications pre-drop (2026-04-18) :
-- - pg_stat_user_functions : 0 calls (aucune utilisation live)
-- - Grep applicatif apps/ + packages/ : 0 reference (hors types auto-generes supabase.ts)
-- - 24 PO creees sur les 90 derniers jours via d'autres chemins (UI directe) sans erreur
--
-- Audit prerequis : docs/scratchpad/audit-consommateurs-tva-amount.md (section 2a.bis)
-- Signature : create_purchase_order(uuid, jsonb, jsonb, text) RETURNS purchase_orders

DROP FUNCTION IF EXISTS public.create_purchase_order(uuid, jsonb, jsonb, text);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.proname = 'create_purchase_order'
      AND p.pronamespace = 'public'::regnamespace
  ) THEN
    RAISE EXCEPTION 'BO-FIN-019 DROP a echoue : fonction create_purchase_order toujours presente';
  END IF;
  RAISE NOTICE 'BO-FIN-019 OK : create_purchase_order supprimee';
END $$;
