-- BO-MKT-DAM-002 : lier chaque photo de la DAM à un produit ou à une variante.
-- Romeo veut zéro photo "en vrac" : à l'upload, l'attribution sera obligatoire.
-- Migration douce : colonnes nullables pour rétro-compat des 460 photos existantes
-- (qui seront affichées dans une section "À attribuer" dans l'UI).

-- 1. Colonne product_id (FK soft, ON DELETE SET NULL pour pas casser la photo si produit supprimé)
-- Note : on n'utilise pas le préfixe `public.` après REFERENCES pour rester
-- compatible avec le parser regex de scripts/db-drift-check.py (FK_INLINE_PATTERN).
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS product_id UUID
  REFERENCES products(id) ON DELETE SET NULL;

-- 2. Colonne variant_group_id (cas où on attribue à un groupe de variantes plutôt
-- qu'à un produit individuel — utile quand toutes les variantes partagent une photo)
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS variant_group_id UUID
  REFERENCES variant_groups(id) ON DELETE SET NULL;

-- 3. Index partiels pour les regroupements UI (filtrage rapide par produit/variante)
CREATE INDEX IF NOT EXISTS idx_media_assets_product_id
  ON public.media_assets(product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_assets_variant_group_id
  ON public.media_assets(variant_group_id)
  WHERE variant_group_id IS NOT NULL;

-- 4. Backfill : pour les media_assets déjà liés à un product_image, hériter du
-- product_id de ce product_image. Permet d'afficher tout de suite les photos
-- existantes regroupées par produit.
UPDATE public.media_assets m
SET product_id = pi.product_id
FROM public.product_images pi
WHERE m.source_product_image_id = pi.id
  AND m.product_id IS NULL
  AND pi.product_id IS NOT NULL;

-- 5. Commentaires colonnes (documentation auto via Supabase)
COMMENT ON COLUMN public.media_assets.product_id IS
  'Produit auquel la photo est rattachée. NULL = photo "à attribuer" dans la DAM.';
COMMENT ON COLUMN public.media_assets.variant_group_id IS
  'Variante (groupe) à laquelle la photo est rattachée. Mutuellement exclusif avec product_id en pratique mais pas contraint en DB.';
