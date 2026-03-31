-- Migration: Propagate enseigne logo_url to child organisations on UPDATE
-- When an enseigne's logo_url is changed, all linked organisations
-- that don't have their own custom logo get the new enseigne logo.
-- Complements the existing INSERT trigger (20260305140000).

-- 1. Create trigger function for propagation on enseigne update
CREATE OR REPLACE FUNCTION propagate_enseigne_logo_to_orgs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only propagate if logo_url actually changed
  IF OLD.logo_url IS DISTINCT FROM NEW.logo_url THEN
    -- Update all child organisations:
    -- - that belong to this enseigne
    -- - that had the OLD logo (inherited) or had no logo
    -- This preserves any custom logo an org might have set independently
    UPDATE organisations
    SET logo_url = NEW.logo_url,
        updated_at = now()
    WHERE enseigne_id = NEW.id
      AND (logo_url IS NULL OR logo_url = OLD.logo_url);
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Create trigger on UPDATE of enseignes
CREATE TRIGGER trg_propagate_enseigne_logo_on_update
  AFTER UPDATE OF logo_url ON enseignes
  FOR EACH ROW
  EXECUTE FUNCTION propagate_enseigne_logo_to_orgs();
