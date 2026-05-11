-- [SITE-CAT-001] Normalisation des valeurs filtres produits
-- Date : 2026-05-11
--
-- Contexte : la sidebar du catalogue site-internet affichait 52 entrées
-- couleurs (dont ~30 doublons d'orthographe ou pastilles grises) et 11
-- pièces avec un doublon "salon_sejour" / "salon".
--
-- Cause : les couleurs (variant_attributes->>'color') et les pièces
-- (suitable_rooms) sont des champs en saisie libre dans le formulaire
-- produit back-office. Les saisies ont accumulé des variantes de casse
-- ("beige" / "Beige"), d'accents ("écru" / "Ecru") et des valeurs
-- composées ("Beige,Blanc") sur plusieurs mois.
--
-- Cette migration :
--   1. Normalise la casse des couleurs dans variant_attributes (Title Case)
--      pour fusionner les doublons stricts. Les variantes orthographiques
--      (Chrome / Chromé) restent distinctes — vocabulaire contrôlé prévu
--      dans un sprint dédié ultérieur.
--   2. Fusionne la pièce "salon_sejour" dans "salon" car les deux valeurs
--      désignent le même espace.

-- 1. Normalisation casse des couleurs (variant_attributes->>'color')
UPDATE products
SET variant_attributes = jsonb_set(
  variant_attributes,
  '{color}',
  to_jsonb(initcap(lower(variant_attributes->>'color')))
)
WHERE variant_attributes ? 'color'
  AND variant_attributes->>'color' IS NOT NULL
  AND variant_attributes->>'color' <> ''
  AND variant_attributes->>'color' <> initcap(lower(variant_attributes->>'color'));

-- 2. Fusion salon_sejour → salon dans suitable_rooms
UPDATE products
SET suitable_rooms = ARRAY(
  SELECT DISTINCT CASE WHEN r = 'salon_sejour' THEN 'salon' ELSE r END
  FROM unnest(suitable_rooms) AS r
)
WHERE 'salon_sejour' = ANY(suitable_rooms);

-- 3. Fusion finale des doublons orthographiques résiduels après initcap
--    (variantes avec/sans accent, avec/sans tiret)
UPDATE products
SET variant_attributes = jsonb_set(variant_attributes, '{color}', '"Écru"')
WHERE variant_attributes->>'color' = 'Ecru';

UPDATE products
SET variant_attributes = jsonb_set(variant_attributes, '{color}', '"Bleu-Vert"')
WHERE variant_attributes->>'color' = 'Bleu Vert';

UPDATE products
SET variant_attributes = jsonb_set(variant_attributes, '{color}', '"Chromé"')
WHERE variant_attributes->>'color' = 'Chrome';
