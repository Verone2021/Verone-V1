-- Backfill: Copier les adresses legacy -> shipping + billing
-- pour les organisations qui n'ont pas encore de shipping/billing renseigne
-- mais qui ont des donnees dans les champs legacy (address_line1, city, etc.)
--
-- Root cause: Les champs shipping_*/billing_* ont ete ajoutes apres la creation
-- des organisations initiales. Les anciennes orgs ont uniquement les champs legacy.
-- LinkMe lit uniquement shipping_*/billing_* -> affiche "A completer" alors que
-- l'adresse existe dans les champs legacy.

-- 1. Backfill shipping_address (si vide et legacy existe)
UPDATE organisations
SET
  shipping_address_line1 = address_line1,
  shipping_address_line2 = address_line2,
  shipping_city = city,
  shipping_postal_code = postal_code,
  shipping_country = COALESCE(country, 'France')
WHERE address_line1 IS NOT NULL
  AND shipping_address_line1 IS NULL;

-- 2. Backfill billing_address (si vide et legacy existe)
UPDATE organisations
SET
  billing_address_line1 = address_line1,
  billing_address_line2 = address_line2,
  billing_city = city,
  billing_postal_code = postal_code,
  billing_country = COALESCE(country, 'France')
WHERE address_line1 IS NOT NULL
  AND billing_address_line1 IS NULL;
