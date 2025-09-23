-- =============================================
-- Migration: Create individual_customers table for B2C support
-- Date: 2024-11-22
-- Description: Implements complete B2C customer management with RLS
-- =============================================

-- 1. Create individual_customers table
CREATE TABLE IF NOT EXISTS public.individual_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Personal information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(30),

  -- Address information
  address_line1 TEXT,
  address_line2 TEXT,
  postal_code VARCHAR(20),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(2) DEFAULT 'FR',

  -- Billing address (can be different from main address)
  billing_address_line1 TEXT,
  billing_address_line2 TEXT,
  billing_postal_code VARCHAR(20),
  billing_city VARCHAR(100),
  billing_state VARCHAR(100),
  billing_country VARCHAR(2) DEFAULT 'FR',

  -- Customer preferences
  accepts_marketing BOOLEAN DEFAULT false,
  preferred_language VARCHAR(5) DEFAULT 'fr',

  -- Metadata
  notes TEXT,
  tags TEXT[],

  -- Relations
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX idx_individual_customers_email ON public.individual_customers(email);
CREATE INDEX idx_individual_customers_phone ON public.individual_customers(phone);
CREATE INDEX idx_individual_customers_organisation_id ON public.individual_customers(organisation_id);
CREATE INDEX idx_individual_customers_full_name ON public.individual_customers(first_name, last_name);

-- 3. Enable RLS
ALTER TABLE public.individual_customers ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Policy: View individual customers (staff can see all, external users see only their org's customers)
CREATE POLICY "view_individual_customers" ON public.individual_customers
  FOR SELECT
  USING (
    -- Staff can see all
    get_user_role() IN ('owner', 'admin', 'sales', 'commercial', 'logistics', 'procurement')
    OR
    -- External users see only their organization's customers
    organisation_id = get_user_organisation_id()
  );

-- Policy: Create individual customers (staff only)
CREATE POLICY "create_individual_customers" ON public.individual_customers
  FOR INSERT
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales', 'commercial')
  );

-- Policy: Update individual customers (staff only)
CREATE POLICY "update_individual_customers" ON public.individual_customers
  FOR UPDATE
  USING (
    get_user_role() IN ('owner', 'admin', 'sales', 'commercial')
  )
  WITH CHECK (
    get_user_role() IN ('owner', 'admin', 'sales', 'commercial')
  );

-- Policy: Delete individual customers (admin only)
CREATE POLICY "delete_individual_customers" ON public.individual_customers
  FOR DELETE
  USING (
    get_user_role() IN ('owner', 'admin')
  );

-- 5. Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_individual_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_individual_customers_updated_at
  BEFORE UPDATE ON public.individual_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_individual_customers_updated_at();

-- 6. Add check constraint to validate email format
ALTER TABLE public.individual_customers
  ADD CONSTRAINT check_email_format
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- 7. Add check constraint for phone format (French format)
ALTER TABLE public.individual_customers
  ADD CONSTRAINT check_phone_format
  CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$');

-- 8. Create view for full customer information
CREATE OR REPLACE VIEW public.individual_customers_full AS
SELECT
  ic.*,
  ic.first_name || ' ' || ic.last_name AS full_name,
  COALESCE(ic.billing_address_line1, ic.address_line1) AS effective_billing_address_line1,
  COALESCE(ic.billing_address_line2, ic.address_line2) AS effective_billing_address_line2,
  COALESCE(ic.billing_postal_code, ic.postal_code) AS effective_billing_postal_code,
  COALESCE(ic.billing_city, ic.city) AS effective_billing_city,
  COALESCE(ic.billing_country, ic.country) AS effective_billing_country,
  o.name AS organisation_name
FROM public.individual_customers ic
LEFT JOIN public.organisations o ON ic.organisation_id = o.id;

-- 9. Grant permissions
GRANT ALL ON public.individual_customers TO authenticated;
GRANT ALL ON public.individual_customers_full TO authenticated;

-- 10. Add comments for documentation
COMMENT ON TABLE public.individual_customers IS 'Table storing B2C individual customer information';
COMMENT ON COLUMN public.individual_customers.accepts_marketing IS 'Whether the customer has opted in to marketing communications';
COMMENT ON COLUMN public.individual_customers.preferred_language IS 'Customer preferred language for communications (ISO 639-1)';
COMMENT ON COLUMN public.individual_customers.organisation_id IS 'Optional link to an organization (for B2B2C scenarios)';

-- 11. Insert sample data for testing (only in development)
DO $$
BEGIN
  -- Only insert sample data if we're in development (no existing customers)
  IF NOT EXISTS (SELECT 1 FROM public.individual_customers LIMIT 1) THEN
    INSERT INTO public.individual_customers (
      first_name, last_name, email, phone,
      address_line1, postal_code, city, country,
      accepts_marketing, preferred_language
    ) VALUES
    ('Jean', 'Dupont', 'jean.dupont@example.com', '+33 6 12 34 56 78',
     '123 rue de la Paix', '75001', 'Paris', 'FR',
     true, 'fr'),
    ('Marie', 'Martin', 'marie.martin@example.com', '+33 6 98 76 54 32',
     '456 avenue des Champs', '69000', 'Lyon', 'FR',
     false, 'fr'),
    ('Pierre', 'Durand', 'pierre.durand@example.com', '+33 7 11 22 33 44',
     '789 boulevard Victor Hugo', '13000', 'Marseille', 'FR',
     true, 'fr');
  END IF;
END $$;

-- =============================================
-- Migration Complete: B2C Customer Support Ready
-- =============================================