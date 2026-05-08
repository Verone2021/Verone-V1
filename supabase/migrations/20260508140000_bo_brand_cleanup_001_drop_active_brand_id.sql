-- [BO-BRAND-CLEANUP-001] Drop user_profiles.active_brand_id
--
-- Decision Romeo (2026-05-08): le filtre marque global au header n'a aucun
-- sens metier. Un utilisateur back-office a acces a tous les produits, toutes
-- les marques. La relation legitime est marque <-> produit (N-N via
-- products.brand_ids), jamais utilisateur <-> marque.
--
-- Audit safe: aucune query metier (commandes, factures, stock, RLS) ne lit
-- cette colonne. Seul le hook use-active-brand.ts (supprime dans le meme PR)
-- la touchait.

ALTER TABLE user_profiles DROP COLUMN IF EXISTS active_brand_id;
