-- =====================================================================
-- [BO-SOURCING-P3B-001] Interdire la suppression d'un produit qui a un historique
-- =====================================================================
-- Décision Roméo D1 (audit sourcing 2026-09-12, Q3) : un produit qui a servi
-- se RETIRE, il ne se supprime pas.
--
-- Avant : ON DELETE CASCADE sur les 4 liens ci-dessous. Supprimer un produit
-- effaçait en silence ses lignes de consultation, ses lignes de commandes
-- fournisseurs ET clients, et ses mouvements de stock (chaque mouvement
-- effacé déclenchait en plus l'inversion de stock). Seules une réception ou
-- une expédition bloquaient déjà la suppression (NO ACTION).
--
-- Après : ON DELETE RESTRICT. La base refuse la suppression dès qu'une ligne
-- existe dans l'une de ces tables ; l'écran propose « Retirer » à la place.
--
-- Hors périmètre (volontairement inchangé) : images, prix canaux, sélections
-- LinkMe, journal sourcing, etc. restent en CASCADE — ce ne sont pas des
-- documents commerciaux, et les bloquer rendrait impossible la suppression
-- d'un brouillon qui a une photo.
--
-- Aucun déclencheur modifié (règle stock-triggers-protected) : seule la règle
-- de suppression des clés étrangères change. Volumes au 2026-09-12 :
-- consultation_products 6 lignes, purchase_order_items 194,
-- sales_order_items 540, stock_movements 404 — revalidation instantanée.
--
-- Application : via execute_sql après accord écrit de Roméo (« OK P3b »),
-- jamais `supabase db push`. Types TS inchangés (aucune colonne, aucune
-- fonction), régénération quand même lancée pour le contrôle de dérive.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.consultation_products
  DROP CONSTRAINT consultation_products_product_id_fkey,
  ADD CONSTRAINT consultation_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE public.purchase_order_items
  DROP CONSTRAINT purchase_order_items_product_id_fkey,
  ADD CONSTRAINT purchase_order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE public.sales_order_items
  DROP CONSTRAINT sales_order_items_product_id_fkey,
  ADD CONSTRAINT sales_order_items_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

ALTER TABLE public.stock_movements
  DROP CONSTRAINT fk_stock_movements_product_id,
  ADD CONSTRAINT fk_stock_movements_product_id
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;

COMMENT ON CONSTRAINT consultation_products_product_id_fkey ON public.consultation_products IS
  'RESTRICT (BO-SOURCING-P3B-001) : un produit présent dans une consultation se retire, il ne se supprime pas.';
COMMENT ON CONSTRAINT purchase_order_items_product_id_fkey ON public.purchase_order_items IS
  'RESTRICT (BO-SOURCING-P3B-001) : un produit commandé à un fournisseur ne se supprime pas.';
COMMENT ON CONSTRAINT sales_order_items_product_id_fkey ON public.sales_order_items IS
  'RESTRICT (BO-SOURCING-P3B-001) : un produit vendu ne se supprime pas.';
COMMENT ON CONSTRAINT fk_stock_movements_product_id ON public.stock_movements IS
  'RESTRICT (BO-SOURCING-P3B-001) : un produit avec mouvements de stock ne se supprime pas (historique et déclencheurs stock préservés).';

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (à n'exécuter que sur décision de Roméo) :
-- ---------------------------------------------------------------------
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- ALTER TABLE public.consultation_products
--   DROP CONSTRAINT consultation_products_product_id_fkey,
--   ADD CONSTRAINT consultation_products_product_id_fkey
--     FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
-- ALTER TABLE public.purchase_order_items
--   DROP CONSTRAINT purchase_order_items_product_id_fkey,
--   ADD CONSTRAINT purchase_order_items_product_id_fkey
--     FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
-- ALTER TABLE public.sales_order_items
--   DROP CONSTRAINT sales_order_items_product_id_fkey,
--   ADD CONSTRAINT sales_order_items_product_id_fkey
--     FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
-- ALTER TABLE public.stock_movements
--   DROP CONSTRAINT fk_stock_movements_product_id,
--   ADD CONSTRAINT fk_stock_movements_product_id
--     FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
-- COMMIT;
