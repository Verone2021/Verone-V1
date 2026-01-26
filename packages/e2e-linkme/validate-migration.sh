#!/bin/bash

# Validation script for E2E migration
# Checks that all required files are in place

set -e

echo "🔍 Validating E2E migration structure..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check file exists
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
    ((ERRORS++))
  fi
}

# Function to check directory exists
check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
  else
    echo -e "${RED}✗${NC} $1/ (MISSING)"
    ((ERRORS++))
  fi
}

echo "📦 Package Files:"
check_file "package.json"
check_file "tsconfig.json"
check_file "playwright.config.ts"
check_file "global-setup.ts"
check_file "global-teardown.ts"
check_file "README.md"
check_file "MIGRATION.md"
echo ""

echo "🧪 Test Directories:"
check_dir "tests"
check_dir "tests/data-consistency"
check_dir "tests/product-management"
check_dir "tests/approval-workflow"
check_dir "tests/security"
echo ""

echo "📄 Test Files:"
check_file "tests/data-consistency/bo-linkme-sync.spec.ts"
check_file "tests/product-management/creation.spec.ts"
check_file "tests/product-management/editing-restrictions.spec.ts"
check_file "tests/approval-workflow/workflow.spec.ts"
check_file "tests/security/data-isolation.spec.ts"
echo ""

echo "🔧 Fixture Files:"
check_file "fixtures/auth.fixture.ts"
check_file "fixtures/database.fixture.ts"
check_file "fixtures/test-data.fixture.ts"
check_file "fixtures/index.ts"
echo ""

# Check package.json scripts
echo "📜 Checking package.json scripts:"
if grep -q '"test:e2e"' package.json; then
  echo -e "${GREEN}✓${NC} test:e2e script found"
else
  echo -e "${RED}✗${NC} test:e2e script missing"
  ((ERRORS++))
fi

if grep -q '"test:e2e:ui"' package.json; then
  echo -e "${GREEN}✓${NC} test:e2e:ui script found"
else
  echo -e "${RED}✗${NC} test:e2e:ui script missing"
  ((ERRORS++))
fi
echo ""

# Check imports in test files
echo "🔗 Checking test file imports:"
if grep -q "from '../../fixtures'" tests/data-consistency/bo-linkme-sync.spec.ts; then
  echo -e "${GREEN}✓${NC} Correct fixture imports in bo-linkme-sync.spec.ts"
else
  echo -e "${RED}✗${NC} Incorrect fixture imports in bo-linkme-sync.spec.ts"
  ((ERRORS++))
fi

if grep -q "from '../../fixtures'" tests/product-management/creation.spec.ts; then
  echo -e "${GREEN}✓${NC} Correct fixture imports in creation.spec.ts"
else
  echo -e "${RED}✗${NC} Incorrect fixture imports in creation.spec.ts"
  ((ERRORS++))
fi
echo ""

# Check environment variables
echo "🔐 Checking environment variables:"
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo -e "${RED}✗${NC} NEXT_PUBLIC_SUPABASE_URL not set"
  ((ERRORS++))
else
  echo -e "${GREEN}✓${NC} NEXT_PUBLIC_SUPABASE_URL set"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}✗${NC} SUPABASE_SERVICE_ROLE_KEY not set"
  ((ERRORS++))
else
  echo -e "${GREEN}✓${NC} SUPABASE_SERVICE_ROLE_KEY set"
fi
echo ""

# Check old directory archived
echo "🗄️ Checking old files archived:"
if [ -d "../../apps/linkme/e2e" ]; then
  echo -e "${RED}✗${NC} Old e2e directory still exists at apps/linkme/e2e"
  ((ERRORS++))
else
  echo -e "${GREEN}✓${NC} Old e2e directory removed from apps/linkme"
fi

if [ -d "../../docs/archive/2026-01-21/linkme-e2e-old" ]; then
  echo -e "${GREEN}✓${NC} Old e2e directory archived"
else
  echo -e "${RED}✗${NC} Old e2e directory not archived"
  ((ERRORS++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Install dependencies: pnpm install"
  echo "2. Start applications: pnpm dev (from root - Turborepo démarre TOUT automatiquement)"
  echo "3. Run tests: pnpm test:e2e"
  exit 0
else
  echo -e "${RED}❌ $ERRORS error(s) found${NC}"
  echo ""
  echo "Please fix the errors above before running tests."
  exit 1
fi
