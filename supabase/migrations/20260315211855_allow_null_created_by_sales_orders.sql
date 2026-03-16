-- Allow NULL created_by for anonymous public orders
-- created_by is an audit field, NOT used by any RLS policy
-- RLS filters use created_by_affiliate_id instead
ALTER TABLE sales_orders ALTER COLUMN created_by DROP NOT NULL;
