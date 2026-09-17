-- [BO-CONSULT-IMG-001] Adresse d'affichage des photos de consultation
--
-- Contexte (17/09/2026) : `product_images` possede depuis longtemps le
-- declencheur `generate_product_image_url`, qui remplit `public_url` a partir
-- de `cloudflare_image_id`. `consultation_images` n'a jamais eu l'equivalent.
-- Consequence : `public_url` restait vide et le code retombait sur une adresse
-- publique du seau `product-images`, qui est **prive** -> 400, photos cassees
-- a l'ecran alors que les fichiers etaient bien presents.
--
-- Ce declencheur aligne les deux tables. Meme hash Cloudflare et meme variante
-- `public` que `generate_product_image_url`, pour ne pas creer une seconde
-- source de verite.

CREATE OR REPLACE FUNCTION public.generate_consultation_image_url()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.cloudflare_image_id IS NOT NULL THEN
    NEW.public_url = 'https://imagedelivery.net/a-LEt3vfWH1BG-ME-lftDA/' || NEW.cloudflare_image_id || '/public';
  ELSE
    -- Compat ascendante : les photos anterieures au 17/09/2026 pointent un
    -- fichier du seau `product-images`. Le seau etant prive, cette adresse
    -- n'affiche rien : ces trois photos historiques sont a re-deposer.
    NEW.public_url = 'https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/public/product-images/' || NEW.storage_path;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Declencheur : aucun droit d'execution a accorder (R-GRANT regle 4).
REVOKE EXECUTE ON FUNCTION public.generate_consultation_image_url() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS consultation_images_generate_url ON public.consultation_images;

CREATE TRIGGER consultation_images_generate_url
  BEFORE INSERT OR UPDATE ON public.consultation_images
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_consultation_image_url();
