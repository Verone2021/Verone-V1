#!/bin/bash

# Clean Test Artifacts
# Removes playwright reports, test results, screenshots, and other test artifacts
# Usage: ./scripts/maintenance/clean-test-artifacts.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

echo "🧹 Cleaning test artifacts..."

# Playwright artifacts
if [ -d "playwright-report" ]; then
  echo "  - Removing playwright-report/"
  rm -rf playwright-report
fi

if [ -d "test-results" ]; then
  echo "  - Removing test-results/"
  rm -rf test-results
fi

# App-specific test artifacts
for app_dir in apps/*/; do
  if [ -d "${app_dir}playwright-report" ]; then
    echo "  - Removing ${app_dir}playwright-report/"
    rm -rf "${app_dir}playwright-report"
  fi

  if [ -d "${app_dir}test-results" ]; then
    echo "  - Removing ${app_dir}test-results/"
    rm -rf "${app_dir}test-results"
  fi

  # Screenshots from failed tests
  if [ -d "${app_dir}screenshots" ]; then
    echo "  - Removing ${app_dir}screenshots/"
    rm -rf "${app_dir}screenshots"
  fi
done

# Coverage reports (if any)
if [ -d "coverage" ]; then
  echo "  - Removing coverage/"
  rm -rf coverage
fi

# Turborepo cache (optional, uncomment if needed)
# if [ -d ".turbo" ]; then
#   echo "  - Removing .turbo/"
#   rm -rf .turbo
# fi

echo "✅ Test artifacts cleaned"
echo ""
echo "Artifacts removed:"
echo "  - playwright-report/"
echo "  - test-results/"
echo "  - apps/*/playwright-report/"
echo "  - apps/*/test-results/"
echo "  - apps/*/screenshots/"
echo "  - coverage/"
