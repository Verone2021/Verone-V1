-- Migration: Fix trigger update_product_stock_status pour produits sourcing
-- Date: 2025-10-26
-- Description: Les produits en sourcing (creation_mode='sourcing') doivent garder
--              le statut 'sourcing' et ne pas être automatiquement changés en 'out_of_stock'
--              par le trigger basé sur le stock.

CREATE OR REPLACE FUNCTION public.update_product_stock_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Exception: Produits en sourcing ne sont PAS soumis au calcul automatique de statut
    -- Ils gardent leur statut 'sourcing' jusqu'à validation manuelle
    IF NEW.creation_mode = 'sourcing' AND NEW.status = 'sourcing' THEN
        RETURN NEW; -- Ne pas modifier le statut
    END IF;

    -- Pour tous les autres produits : calculer le statut basé sur stock_real
    NEW.status := calculate_stock_status(COALESCE(NEW.stock_real, 0));

    RETURN NEW;
END;
$function$;

-- Commentaire de documentation
COMMENT ON FUNCTION public.update_product_stock_status() IS
'Trigger qui met à jour automatiquement le statut du produit basé sur le stock réel.
EXCEPTION: Les produits en sourcing (creation_mode=sourcing, status=sourcing) gardent
leur statut sourcing et ne sont pas affectés par ce trigger.
FIX 2025-10-26: Ajout exception pour produits sourcing.';
