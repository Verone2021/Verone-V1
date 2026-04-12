-- =============================================================================
-- Migration: Create wishlist_items table
-- Date: 2026-04-12
-- Description:
--   Stores user product favorites (wishlist) for the site-internet.
--   Linked to auth.users via user_id and products via product_id.
-- =============================================================================

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One favorite per product per user
  CONSTRAINT wishlist_items_unique_user_product UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id
  ON wishlist_items(user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id
  ON wishlist_items(product_id);

COMMENT ON TABLE wishlist_items IS 'Product favorites/wishlist for site-internet users. user_id = auth.uid()';

-- RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Users can read their own wishlist
CREATE POLICY "users_read_own_wishlist"
  ON wishlist_items FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Users can add to their own wishlist
CREATE POLICY "users_insert_own_wishlist"
  ON wishlist_items FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Users can remove from their own wishlist
CREATE POLICY "users_delete_own_wishlist"
  ON wishlist_items FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Staff can see all wishlists (analytics)
CREATE POLICY "staff_read_all_wishlists"
  ON wishlist_items FOR SELECT TO authenticated
  USING (is_backoffice_user());
