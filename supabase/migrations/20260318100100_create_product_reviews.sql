-- Product reviews / ratings system
CREATE TABLE product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX idx_product_reviews_status ON product_reviews(status);

-- RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved reviews
CREATE POLICY "public_read_approved_reviews" ON product_reviews
  FOR SELECT TO anon, authenticated
  USING (
    status = 'approved'
    OR (SELECT auth.uid()) = user_id
    OR is_backoffice_user()
  );

-- Authenticated users can submit reviews
CREATE POLICY "users_insert_reviews" ON product_reviews
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Staff can update review status (moderate)
CREATE POLICY "staff_update_reviews" ON product_reviews
  FOR UPDATE TO authenticated
  USING (is_backoffice_user());

-- Staff can delete reviews
CREATE POLICY "staff_delete_reviews" ON product_reviews
  FOR DELETE TO authenticated
  USING (is_backoffice_user());
