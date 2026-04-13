-- =============================================================================
-- Migration: Add auth_user_id to individual_customers
-- Date: 2026-04-12
-- Description:
--   Links individual_customers to auth.users via a direct FK.
--   Replaces fragile email-matching with a solid auth_user_id reference.
--   Updates the signup trigger to store this link.
-- =============================================================================

-- 1. Add auth_user_id column
ALTER TABLE individual_customers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;

COMMENT ON COLUMN individual_customers.auth_user_id IS 'FK to auth.users.id — links customer profile to auth account';

-- 2. Backfill existing customers by email match
UPDATE individual_customers ic
SET auth_user_id = au.id
FROM auth.users au
WHERE ic.email = au.email
  AND ic.auth_user_id IS NULL;

-- 3. Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_individual_customers_auth_user_id
  ON individual_customers(auth_user_id);

-- 4. Update the signup trigger to store auth_user_id
CREATE OR REPLACE FUNCTION public.handle_site_internet_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
  v_existing_id UUID;
BEGIN
  -- Only process site-internet signups
  v_source := NEW.raw_user_meta_data ->> 'source';
  IF v_source IS NULL OR v_source <> 'site-internet' THEN
    RETURN NEW;
  END IF;

  -- Extract user metadata
  v_first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Client');
  v_last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');
  v_phone := NEW.raw_user_meta_data ->> 'phone';

  -- For Google OAuth: parse full_name into first/last
  IF NEW.raw_user_meta_data ->> 'full_name' IS NOT NULL AND v_first_name = 'Client' THEN
    v_first_name := split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1);
    v_last_name := COALESCE(
      NULLIF(
        substr(
          NEW.raw_user_meta_data ->> 'full_name',
          length(split_part(NEW.raw_user_meta_data ->> 'full_name', ' ', 1)) + 2
        ),
        ''
      ),
      ''
    );
  END IF;

  -- Check if customer already exists by email (e.g. created during checkout)
  SELECT id INTO v_existing_id
  FROM public.individual_customers
  WHERE email = NEW.email
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Link existing customer to auth account
    UPDATE public.individual_customers
    SET auth_user_id = NEW.id
    WHERE id = v_existing_id AND auth_user_id IS NULL;
    RETURN NEW;
  END IF;

  -- Create new individual_customer linked to auth account
  INSERT INTO public.individual_customers (
    first_name,
    last_name,
    email,
    phone,
    source_type,
    is_active,
    auth_user_id
  ) VALUES (
    v_first_name,
    v_last_name,
    NEW.email,
    v_phone,
    'site-internet',
    true,
    NEW.id
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
  WHEN OTHERS THEN
    RAISE WARNING '[handle_site_internet_signup] Error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
