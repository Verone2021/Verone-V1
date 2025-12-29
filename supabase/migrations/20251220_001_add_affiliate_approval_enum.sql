-- Migration: Add affiliate product approval status enum
-- Description: Creates enum for tracking affiliate-created product approval workflow

-- Create the enum for affiliate product approval status
CREATE TYPE affiliate_product_approval_status AS ENUM (
  'draft',            -- Product is being created/edited by affiliate
  'pending_approval', -- Submitted for admin review
  'approved',         -- Approved by admin, visible in catalog
  'rejected'          -- Rejected by admin with reason
);

-- Add comment for documentation
COMMENT ON TYPE affiliate_product_approval_status IS
  'Workflow status for products created by affiliates: draft -> pending_approval -> approved/rejected';
