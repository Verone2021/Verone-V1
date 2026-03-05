-- Migration: organisations inherit enseigne logo_url on creation
-- When a new organisation is created under an enseigne, if logo_url is NULL,
-- automatically copy the enseigne's logo_url as default.

-- 1. Create trigger function
CREATE OR REPLACE FUNCTION set_org_logo_from_enseigne()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only set logo if org has no logo and belongs to an enseigne
  IF NEW.logo_url IS NULL AND NEW.enseigne_id IS NOT NULL THEN
    SELECT logo_url INTO NEW.logo_url
    FROM enseignes
    WHERE id = NEW.enseigne_id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create trigger on INSERT
CREATE TRIGGER trg_org_inherit_enseigne_logo
  BEFORE INSERT ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION set_org_logo_from_enseigne();

-- 3. Fix existing organisations: copy enseigne logo where org logo is NULL
UPDATE organisations o
SET logo_url = e.logo_url
FROM enseignes e
WHERE o.enseigne_id = e.id
  AND o.logo_url IS NULL
  AND e.logo_url IS NOT NULL;
