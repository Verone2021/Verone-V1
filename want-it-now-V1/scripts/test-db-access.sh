#!/bin/bash

# Script to test database access and check organizations
echo "🔍 Testing database access and checking organizations..."

# Test with service role to bypass RLS
PGPASSWORD='Want2025!' psql -h aws-0-eu-north-1.pooler.supabase.com -p 5432 -U postgres.ptqwayandsfhciitjnhb -d postgres -c "
SET ROLE service_role;
SELECT 'Organizations:' as info;
SELECT id, nom, pays, is_active FROM organisations LIMIT 5;

SELECT 'Users:' as info;
SELECT id, email, role FROM utilisateurs WHERE role = 'super_admin' LIMIT 3;

SELECT 'RLS Status:' as info;
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'organisations';
"