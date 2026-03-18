-- Migration: Create site_orders table for e-commerce orders
CREATE TABLE IF NOT EXISTS public.site_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  stripe_session_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded')),
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text,
  shipping_address text,
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'eur',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_orders ENABLE ROW LEVEL SECURITY;

-- Staff full access
CREATE POLICY "staff_full_access_site_orders"
  ON public.site_orders
  FOR ALL
  TO authenticated
  USING (is_backoffice_user());

-- Authenticated users can read their own orders
CREATE POLICY "users_read_own_orders"
  ON public.site_orders
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Anon can insert (for guest checkout)
CREATE POLICY "anon_insert_orders"
  ON public.site_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_site_orders_user_id ON public.site_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_site_orders_stripe_session_id ON public.site_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_site_orders_status ON public.site_orders(status);
CREATE INDEX IF NOT EXISTS idx_site_orders_created_at ON public.site_orders(created_at DESC);
