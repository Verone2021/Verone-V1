-- Wishlist / Favoris for site-internet customers
CREATE TABLE wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- RLS
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Users can read their own wishlist
CREATE POLICY "users_read_own_wishlist" ON wishlist_items
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    OR is_backoffice_user()
  );

-- Users can insert their own wishlist items
CREATE POLICY "users_insert_own_wishlist" ON wishlist_items
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own wishlist items
CREATE POLICY "users_delete_own_wishlist" ON wishlist_items
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
