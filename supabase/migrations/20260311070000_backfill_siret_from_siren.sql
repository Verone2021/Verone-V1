-- Backfill SIRET for 7 organisations that only have SIREN
-- SIRET = SIREN (9 digits) + NIC (5 digits for siege social)
-- Source: https://recherche-entreprises.api.gouv.fr

UPDATE organisations SET siret = '88518352500033' WHERE siren = '885183525' AND siret IS NULL;
UPDATE organisations SET siret = '91370943200011' WHERE siren = '913709432' AND siret IS NULL;
UPDATE organisations SET siret = '33081473200062' WHERE siren = '330814732' AND siret IS NULL;
UPDATE organisations SET siret = '94152593300011' WHERE siren = '941525933' AND siret IS NULL;
UPDATE organisations SET siret = '88997054700036' WHERE siren = '889970547' AND siret IS NULL;
UPDATE organisations SET siret = '87826830900027' WHERE siren = '878268309' AND siret IS NULL;
UPDATE organisations SET siret = '80312593900022' WHERE siren = '803125939' AND siret IS NULL;
