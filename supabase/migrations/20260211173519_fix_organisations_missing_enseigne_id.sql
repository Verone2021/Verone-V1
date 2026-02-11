-- Fix: Link Pokawa organisations missing enseigne_id
-- 5 Pokawa orgs (DESMAFOOD, PK PRADO, POKAWA AIX-EN-PROVENCE, Pokawa Mazarine - Paris 8, Pokawa Puteaux)
-- have NULL enseigne_id while they clearly belong to Pokawa enseigne

-- Pokawa enseigne ID: de1bcbd7-0086-4632-aedb-ece0a5b3d358

UPDATE organisations
SET
  enseigne_id = 'de1bcbd7-0086-4632-aedb-ece0a5b3d358',
  customer_type = COALESCE(customer_type, 'professional'),
  updated_at = now()
WHERE id IN (
  '98921efb-57a1-47c3-9988-b275d13ecfc5',  -- DESMAFOOD (Pokawa Cormeilles-en-Parisis)
  'e00951af-d24c-4c1c-acde-4a8c077dbdac',  -- PK PRADO (Pokawa Marseille Prado)
  '912d83c3-11f3-4bc3-b4f5-85f30775b042',  -- POKAWA AIX-EN-PROVENCE
  '09cd4718-058f-46d9-88f3-dcf402388184',  -- Pokawa Mazarine - Paris 8
  '9c9cc38a-4dc7-4e4e-b6fe-96472f881dff'   -- Pokawa Puteaux
);

-- Update Pokawa enseigne member_count
UPDATE enseignes
SET
  member_count = (
    SELECT count(*) FROM organisations
    WHERE enseigne_id = 'de1bcbd7-0086-4632-aedb-ece0a5b3d358'
      AND is_enseigne_parent = false
  ),
  updated_at = now()
WHERE id = 'de1bcbd7-0086-4632-aedb-ece0a5b3d358';
