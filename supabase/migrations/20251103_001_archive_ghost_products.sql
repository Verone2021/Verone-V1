-- Migration: Archivage 16 produits fantômes (stock > 0 mais 0 mouvements)
-- Date: 2025-11-03
-- Auteur: Claude Code
-- Context: KPI faussés par produits avec stock_real > 0 mais sans mouvements réels
--
-- Problème: 16 produits ont stock_real > 0 mais n'ont JAMAIS eu de mouvements
-- Impact: KPI affichent 17 produits au lieu de 1, 1529 unités au lieu de 8
-- Solution: Archiver ces 16 "fantômes" pour qu'ils n'apparaissent plus dans KPI

BEGIN;

-- Archiver les 16 produits fantômes identifiés
UPDATE products
SET
  archived_at = NOW(),
  updated_at = NOW()
WHERE id IN (
  '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55', -- FMIL-BEIGE-05 (250u, 27250€)
  'c189cf72-c980-4ed6-9ee7-3de805c6ab9a', -- FMIL-BLANC-12 (3u)
  'cd10eeb2-5e9b-4016-bdeb-a7119d935956', -- FMIL-BLEUI-09 (5u)
  '6e679b0a-70b8-48cd-a407-c28383770cca', -- FMIL-BLEU-15 (125u, 13625€)
  'cb45e989-981a-46fe-958d-bd3b81f12e8b', -- FMIL-BLEUV-16 (3u)
  '7e448349-f1e7-4254-84be-7df0b0f73abe', -- FMIL-CARAME-07 (3u)
  '3b1f8a81-c85a-4d8d-843b-f067299a16ee', -- FMIL-JAUNE-06 (3u)
  '0baf3960-9bc2-47e1-a5d5-a3659a767b38', -- FMIL-KAKI-14 (8u)
  '5a05855a-e3d4-40c9-8043-3f504c1b73a7', -- FMIL-MARRO-03 (5u)
  '22424f3c-ed79-4dc6-a583-13c9eb4dc9a5', -- FMIL-ORANG-13 (3u)
  '809a2a10-0107-4908-96a5-a67ad88f5f41', -- FMIL-ROSE-08 (5u)
  '5952985b-3f1b-450a-b186-6347d176ded8', -- FMIL-ORANG-10 (5u)
  '3a267383-3c4d-48c1-b0d5-6f64cdb4df3e', -- FMIL-VERT-01 (5u)
  '4a9c6ee2-edf9-4a82-986b-ee52a36b16a1', -- FMIL-VERT-22 (1040u, 5200€)
  '3fc2f8e6-5e60-42db-9356-e8fe8c27f76d', -- FMIL-VERTF-11 (3u)
  '6cc1a5d4-3b3a-4303-85c3-947435977e3c'  -- FMIL-VIOLE-04 (5u)
)
AND archived_at IS NULL; -- Sécurité: ne pas re-archiver des produits déjà archivés

-- Vérification: 16 produits doivent être archivés
DO $$
DECLARE
  archived_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO archived_count
  FROM products
  WHERE id IN (
    '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55',
    'c189cf72-c980-4ed6-9ee7-3de805c6ab9a',
    'cd10eeb2-5e9b-4016-bdeb-a7119d935956',
    '6e679b0a-70b8-48cd-a407-c28383770cca',
    'cb45e989-981a-46fe-958d-bd3b81f12e8b',
    '7e448349-f1e7-4254-84be-7df0b0f73abe',
    '3b1f8a81-c85a-4d8d-843b-f067299a16ee',
    '0baf3960-9bc2-47e1-a5d5-a3659a767b38',
    '5a05855a-e3d4-40c9-8043-3f504c1b73a7',
    '22424f3c-ed79-4dc6-a583-13c9eb4dc9a5',
    '809a2a10-0107-4908-96a5-a67ad88f5f41',
    '5952985b-3f1b-450a-b186-6347d176ded8',
    '3a267383-3c4d-48c1-b0d5-6f64cdb4df3e',
    '4a9c6ee2-edf9-4a82-986b-ee52a36b16a1',
    '3fc2f8e6-5e60-42db-9356-e8fe8c27f76d',
    '6cc1a5d4-3b3a-4303-85c3-947435977e3c'
  )
  AND archived_at IS NOT NULL;

  IF archived_count <> 16 THEN
    RAISE EXCEPTION 'Erreur migration: % produits archivés au lieu de 16 attendus', archived_count;
  END IF;

  RAISE NOTICE '✅ Migration réussie: 16 produits fantômes archivés';
  RAISE NOTICE '   Produits actifs restants: devrait être 1 (Fauteuil Milo Ocre)';
END $$;

COMMIT;
