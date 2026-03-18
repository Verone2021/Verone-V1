-- Customer addresses for site-internet users
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Domicile',
  first_name text NOT NULL,
  last_name text NOT NULL,
  address text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  country text NOT NULL DEFAULT 'FR',
  phone text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own addresses
CREATE POLICY "users_own_addresses"
  ON public.customer_addresses
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Staff can read all
CREATE POLICY "staff_read_addresses"
  ON public.customer_addresses
  FOR SELECT TO authenticated
  USING (is_backoffice_user());

CREATE INDEX idx_customer_addresses_user_id ON public.customer_addresses(user_id);
