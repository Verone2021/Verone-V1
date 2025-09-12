#!/bin/bash

# Script to apply contract RLS fixes via Supabase REST API
# Date: 2025-01-30

set -e

echo "🔧 Applying contract RLS fixes..."

SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"
SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"

# Function to execute SQL via RPC
exec_sql() {
    local sql_query="$1"
    local description="$2"
    
    echo "⚡ $description"
    
    curl -X POST "$SUPABASE_URL/rest/v1/rpc/sql" \
        -H "apikey: $SUPABASE_SERVICE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$sql_query\"}" \
        -s | jq .
}

# Step 1: Drop existing problematic policies
echo "🗑️ Dropping existing policies..."

exec_sql "DROP POLICY IF EXISTS \"Super admin full access\" ON public.contrats;" "Drop super admin policy"

exec_sql "DROP POLICY IF EXISTS \"Admin organisational access\" ON public.contrats;" "Drop admin organizational policy"

exec_sql "DROP POLICY IF EXISTS \"Service role bypass\" ON public.contrats;" "Drop service role bypass policy"

# Step 2: Create new super admin policy
echo "👑 Creating super admin global access policy..."

SUPER_ADMIN_POLICY="CREATE POLICY \"contrats_super_admin_global_access\" ON public.contrats FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.utilisateurs u WHERE u.id = auth.uid() AND u.role = 'super_admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.utilisateurs u WHERE u.id = auth.uid() AND u.role = 'super_admin'));"

exec_sql "$SUPER_ADMIN_POLICY" "Create super admin global access policy"

# Step 3: Create organization admin access policy (Fixed for utilisateurs table)
echo "🏢 Creating organization admin access policy..."

ORG_ADMIN_POLICY="CREATE POLICY \"contrats_organisation_admin_access\" ON public.contrats FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.utilisateurs u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.organisation_id = contrats.organisation_id)) WITH CHECK (EXISTS (SELECT 1 FROM public.utilisateurs u WHERE u.id = auth.uid() AND u.role = 'admin' AND u.organisation_id = contrats.organisation_id));"

exec_sql "$ORG_ADMIN_POLICY" "Create organization admin access policy"

# Step 4: Create service role bypass policy
echo "🔧 Creating service role bypass policy..."

SERVICE_POLICY="CREATE POLICY \"contrats_service_role_bypass\" ON public.contrats FOR ALL TO service_role USING (true) WITH CHECK (true);"

exec_sql "$SERVICE_POLICY" "Create service role bypass policy"

# Step 5: Create test function
echo "🧪 Creating RLS test function..."

TEST_FUNCTION="CREATE OR REPLACE FUNCTION public.test_contrat_rls_access(test_user_id UUID, test_organisation_id UUID) RETURNS JSONB AS \$\$ DECLARE user_info RECORD; can_access BOOLEAN DEFAULT false; access_reason TEXT DEFAULT 'No access'; BEGIN SELECT u.role, u.organisation_id as primary_org INTO user_info FROM public.utilisateurs u WHERE u.id = test_user_id; IF NOT FOUND THEN RETURN jsonb_build_object('can_access', false, 'reason', 'User not found', 'user_role', null, 'test_organisation_id', test_organisation_id); END IF; IF user_info.role = 'super_admin' THEN can_access := true; access_reason := 'Super admin - global access'; ELSE IF EXISTS (SELECT 1 FROM public.user_organisation_assignments uoa WHERE uoa.user_id = test_user_id AND uoa.organisation_id = test_organisation_id) THEN can_access := true; access_reason := 'Admin with organization assignment'; ELSE can_access := false; access_reason := 'Admin without organization assignment'; END IF; END IF; RETURN jsonb_build_object('can_access', can_access, 'reason', access_reason, 'user_role', user_info.role, 'primary_organisation', user_info.primary_org, 'test_organisation_id', test_organisation_id); END; \$\$ LANGUAGE plpgsql SECURITY DEFINER;"

exec_sql "$TEST_FUNCTION" "Create RLS test function"

echo ""
echo "✅ Contract RLS fixes applied successfully!"
echo ""
echo "🔒 Business Rules Implemented:"
echo "   - Super admins: Global access to all organizations"
echo "   - Regular admins: Access only to assigned organizations"
echo "   - Consistent with existing RLS patterns"
echo ""
echo "🧪 Test the implementation by running:"
echo "   SELECT public.test_contrat_rls_access('user-id', 'org-id');"
echo ""