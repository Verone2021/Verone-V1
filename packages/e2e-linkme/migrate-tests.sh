#!/bin/bash

# Script to migrate E2E tests from apps/linkme/e2e/ to packages/e2e-linkme/tests/
# Adapts imports to use new typed fixtures

set -e

# Source directory
SRC_DIR="../../apps/linkme/e2e"

# Function to adapt test file
adapt_test_file() {
  local src=$1
  local dest=$2

  echo "Migrating $src -> $dest"

  # Copy file and adapt imports
  cat "$src" | \
    # Replace main imports
    sed "s|import { test, expect } from '@playwright/test';|import { test, expect, CREDENTIALS, generateTestProductName, generateTestCustomerName } from '../../fixtures';|" | \
    # Remove old fixture imports
    sed '/^import {$/,/^} from/d' | \
    # Adapt function calls to use fixtures from test context
    sed 's/await loginLinkMe(page, /await loginLinkMe(/g' | \
    sed 's/await loginBackOffice(page)/await loginBackOffice()/g' | \
    sed 's/await getProductById(/await db.getProductById(/g' | \
    sed 's/await getOrderById(/await db.getOrderById(/g' | \
    sed 's/await getCommissionByOrderId(/await db.getCommissionByOrderId(/g' | \
    sed 's/await getAffiliateByEnseigneId(/await db.getAffiliateByEnseigneId(/g' | \
    sed 's/await getAffiliateByOrganizationId(/await db.getAffiliateByOrganizationId(/g' | \
    sed 's/await getLinkmeeChannelId()/await db.getLinkmeeChannelId()/g' | \
    sed 's/await createTestProduct(/await db.createTestProduct(/g' | \
    sed 's/await createTestOrder(/await db.createTestOrder(/g' | \
    sed 's/await updateProductApprovalStatus(/await db.updateProductApprovalStatus(/g' | \
    sed 's/await waitForCondition(/await db.waitForCondition(/g' | \
    sed 's/await cleanupTestData()/await db.cleanupTestData()/g' | \
    # Add fixtures to test context where needed
    sed 's/async ({ page })/async ({ page, loginLinkMe, loginBackOffice, db })/g' | \
    sed 's/async ({$/async ({ page, loginLinkMe, loginBackOffice, db })/g' \
    > "$dest"

  echo "✅ Migrated $dest"
}

# Migrate files
adapt_test_file "$SRC_DIR/product-creation.spec.ts" "tests/product-management/creation.spec.ts"
adapt_test_file "$SRC_DIR/product-editing-restrictions.spec.ts" "tests/product-management/editing-restrictions.spec.ts"
adapt_test_file "$SRC_DIR/approval-workflow.spec.ts" "tests/approval-workflow/workflow.spec.ts"
adapt_test_file "$SRC_DIR/data-isolation.spec.ts" "tests/security/data-isolation.spec.ts"

echo ""
echo "✅ All tests migrated successfully!"
echo ""
echo "Next steps:"
echo "1. Review migrated files manually"
echo "2. Run: npm run test:e2e"
echo "3. Fix any remaining issues"
