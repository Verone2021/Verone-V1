-- 🔒 Ajout Policy DELETE pour table products
-- Fix: Impossible de supprimer les produits car policy DELETE manquante

CREATE POLICY "products_delete_authenticated" ON products
  FOR DELETE TO authenticated
  USING (true); -- Suppression autorisée pour utilisateurs authentifiés

-- Commentaire: Policy alignée sur les autres (SELECT/INSERT/UPDATE)
-- Autorise suppression définitive pour tous les utilisateurs authentifiés
