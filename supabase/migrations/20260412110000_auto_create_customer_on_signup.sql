-- =============================================================================
-- Migration: Auto-create individual_customer on site-internet signup
-- Date: 2026-04-12
-- Description:
--   Trigger on auth.users that creates an individual_customer record
--   when a user signs up from the site-internet (source = 'site-internet').
--   Also handles Google OAuth signups.
-- =============================================================================

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
  v_first_name := COALESCE(NEW.raw_user_meta_data ->> 'first_name', NEW.raw_user_meta_data ->> 'full_name', 'Client');
  v_last_name := COALESCE(NEW.raw_user_meta_data ->> 'last_name', '');
  v_phone := NEW.raw_user_meta_data ->> 'phone';

  -- For Google OAuth: parse full_name into first/last
  IF v_first_name = 'Client' AND NEW.raw_user_meta_data ->> 'full_name' IS NOT NULL THEN
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

  -- Check if customer already exists by email (avoid duplicates from checkout)
  SELECT id INTO v_existing_id
  FROM public.individual_customers
  WHERE email = NEW.email
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- Customer exists (likely created during a previous checkout)
    RETURN NEW;
  END IF;

  -- Create the individual_customer
  INSERT INTO public.individual_customers (
    first_name,
    last_name,
    email,
    phone,
    source_type,
    is_active
  ) VALUES (
    v_first_name,
    v_last_name,
    NEW.email,
    v_phone,
    'site-internet',
    true
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Race condition: customer was just created by another process
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log but don't block signup
    RAISE WARNING '[handle_site_internet_signup] Error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on auth.users INSERT
DROP TRIGGER IF EXISTS trg_site_internet_signup ON auth.users;
CREATE TRIGGER trg_site_internet_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_site_internet_signup();

COMMENT ON FUNCTION public.handle_site_internet_signup() IS 'Auto-creates individual_customer when a user signs up from site-internet (email or Google OAuth)';
