-- Migration: Create shopping_carts table for site-internet e-commerce
-- Supports both anonymous (session_id) and authenticated (user_id) users

CREATE TABLE IF NOT EXISTS public.shopping_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_group_id UUID REFERENCES public.variant_groups(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 99),
  include_assembly BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Either user_id or session_id must be set
  CONSTRAINT shopping_carts_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL),

  -- Unique per user+product and session+product
  CONSTRAINT shopping_carts_user_product_unique UNIQUE (user_id, product_id),
  CONSTRAINT shopping_carts_session_product_unique UNIQUE (session_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON public.shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_session_id ON public.shopping_carts(session_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_product_id ON public.shopping_carts(product_id);

-- RLS
ALTER TABLE public.shopping_carts ENABLE ROW LEVEL SECURITY;

-- Staff back-office: full access
CREATE POLICY "staff_full_access_shopping_carts" ON public.shopping_carts
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Authenticated users: CRUD on own cart items
CREATE POLICY "users_own_cart_select" ON public.shopping_carts
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "users_own_cart_insert" ON public.shopping_carts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "users_own_cart_update" ON public.shopping_carts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "users_own_cart_delete" ON public.shopping_carts
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Anonymous users: CRUD via session_id (anon role)
CREATE POLICY "anon_cart_select" ON public.shopping_carts
  FOR SELECT TO anon
  USING (session_id IS NOT NULL);

CREATE POLICY "anon_cart_insert" ON public.shopping_carts
  FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL AND user_id IS NULL);

CREATE POLICY "anon_cart_update" ON public.shopping_carts
  FOR UPDATE TO anon
  USING (session_id IS NOT NULL AND user_id IS NULL);

CREATE POLICY "anon_cart_delete" ON public.shopping_carts
  FOR DELETE TO anon
  USING (session_id IS NOT NULL AND user_id IS NULL);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_shopping_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shopping_carts_updated_at
  BEFORE UPDATE ON public.shopping_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shopping_carts_updated_at();
