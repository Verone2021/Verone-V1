-- Re-declaration explicite des FK ambassador_codes/attributions -> individual_customers
--
-- Contexte : la migration 20260507_unify_ambassador_to_individual_customer.sql
-- utilise la syntaxe inline `REFERENCES individual_customers(id) ON DELETE
-- CASCADE` lors du `ADD COLUMN customer_id`. Cette syntaxe est valide Postgres
-- mais n'est pas reconnue par le script `scripts/db-drift-check.py` qui scanne
-- les migrations pour les patterns `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN
-- KEY ...`. Resultat : drift detecte = "undeclared_in_migrations" -> CI fail
-- bloquant sur toutes les PRs.
--
-- Fix : DROP la FK existante (creee inline) et RECREATE avec ALTER TABLE ADD
-- CONSTRAINT explicite, format detecte par le script drift.
-- Aucun changement comportemental -- juste re-declaration cosmetique pour
-- aligner sur le format attendu.

BEGIN;

-- ambassador_codes.customer_id -> individual_customers(id) ON DELETE CASCADE
ALTER TABLE ambassador_codes
  DROP CONSTRAINT IF EXISTS ambassador_codes_customer_id_fkey;

ALTER TABLE ambassador_codes
  ADD CONSTRAINT ambassador_codes_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES individual_customers(id) ON DELETE CASCADE;

-- ambassador_attributions.customer_id -> individual_customers(id) ON DELETE CASCADE
ALTER TABLE ambassador_attributions
  DROP CONSTRAINT IF EXISTS ambassador_attributions_customer_id_fkey;

ALTER TABLE ambassador_attributions
  ADD CONSTRAINT ambassador_attributions_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES individual_customers(id) ON DELETE CASCADE;

COMMIT;
