#!/usr/bin/env bash
#
# Validate Audit Setup - Vérification Installation
# Vérifie que tous les prérequis et fichiers sont présents
#
# Usage: ./validate-audit-setup.sh

set -euo pipefail
IFS=$'\n\t'

# Colors
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# =====================================================================
# CHECKS
# =====================================================================

check_file() {
  local file="$1"
  local description="$2"

  if [[ -f "${PROJECT_ROOT}/${file}" ]]; then
    echo -e "${GREEN}✅${NC} ${description}: ${file}"
    return 0
  else
    echo -e "${RED}❌${NC} ${description}: ${file} (MISSING)"
    return 1
  fi
}

check_executable() {
  local file="$1"
  local description="$2"

  if [[ -x "${PROJECT_ROOT}/${file}" ]]; then
    echo -e "${GREEN}✅${NC} ${description}: ${file} (executable)"
    return 0
  else
    echo -e "${YELLOW}⚠️${NC} ${description}: ${file} (not executable)"
    echo -e "   ${BLUE}Fix: chmod +x ${file}${NC}"
    return 1
  fi
}

check_command() {
  local cmd="$1"
  local description="$2"
  local install_hint="$3"

  if command -v "${cmd}" &> /dev/null; then
    local version
    version=$("${cmd}" --version 2>&1 | head -1)
    echo -e "${GREEN}✅${NC} ${description}: ${cmd} (${version})"
    return 0
  else
    echo -e "${RED}❌${NC} ${description}: ${cmd} (NOT INSTALLED)"
    echo -e "   ${BLUE}Install: ${install_hint}${NC}"
    return 1
  fi
}

check_npm_script() {
  local script="$1"
  local description="$2"

  if grep -q "\"${script}\":" "${PROJECT_ROOT}/package.json"; then
    echo -e "${GREEN}✅${NC} ${description}: pnpm ${script}"
    return 0
  else
    echo -e "${RED}❌${NC} ${description}: pnpm ${script} (MISSING)"
    return 1
  fi
}

# =====================================================================
# MAIN
# =====================================================================

main() {
  local checks_passed=0
  local checks_failed=0

  echo "========================================="
  echo "VALIDATION: Audit Setup"
  echo "========================================="
  echo "Project: ${PROJECT_ROOT}"
  echo ""

  # Check files
  echo "1. Configuration Files"
  echo "-----------------------------------"
  check_file "knip.json" "Knip config" && ((checks_passed++)) || ((checks_failed++))
  check_file "AUDIT-SETUP.md" "Setup guide" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  # Check scripts
  echo "2. Scripts"
  echo "-----------------------------------"
  check_executable "scripts/audit-component-advanced.sh" "Component audit script" && ((checks_passed++)) || ((checks_failed++))
  check_executable "scripts/audit-all-components.sh" "Batch audit script" && ((checks_passed++)) || ((checks_failed++))
  check_file "scripts/README-AUDIT.md" "Scripts README" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  # Check documentation
  echo "3. Documentation"
  echo "-----------------------------------"
  check_file "docs/current/component-audit-guidelines.md" "Guidelines équipe" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  # Check CLI tools
  echo "4. CLI Tools"
  echo "-----------------------------------"
  check_command "shellcheck" "ShellCheck" "brew install shellcheck" && ((checks_passed++)) || ((checks_failed++))
  check_command "jq" "jq (JSON parser)" "brew install jq" && ((checks_passed++)) || ((checks_failed++))
  check_command "npx" "npx (Node package runner)" "npm install -g npm" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  # Check NPM scripts
  echo "5. NPM Scripts"
  echo "-----------------------------------"
  check_npm_script "audit:deadcode" "Knip scan" && ((checks_passed++)) || ((checks_failed++))
  check_npm_script "audit:deadcode:json" "Knip JSON export" && ((checks_passed++)) || ((checks_failed++))
  check_npm_script "audit:component" "Component audit" && ((checks_passed++)) || ((checks_failed++))
  check_npm_script "audit:batch" "Batch audit" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  # Check Knip installation
  echo "6. Dependencies"
  echo "-----------------------------------"
  if [[ -d "${PROJECT_ROOT}/node_modules/knip" ]]; then
    echo -e "${GREEN}✅${NC} Knip installed in node_modules"
    ((checks_passed++))
  else
    echo -e "${RED}❌${NC} Knip not found in node_modules"
    echo -e "   ${BLUE}Install: pnpm install${NC}"
    ((checks_failed++))
  fi
  echo ""

  # Summary
  echo "========================================="
  echo "SUMMARY"
  echo "========================================="
  echo -e "Checks passed: ${GREEN}${checks_passed}${NC}"
  echo -e "Checks failed: ${RED}${checks_failed}${NC}"
  echo ""

  if [[ ${checks_failed} -eq 0 ]]; then
    echo -e "${GREEN}🎉 All checks passed! Setup is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run baseline audit: pnpm audit:deadcode:json"
    echo "  2. Test component audit: pnpm audit:component <file>"
    echo "  3. Read documentation: cat AUDIT-SETUP.md"
    echo ""
    return 0
  else
    echo -e "${YELLOW}⚠️  Some checks failed. Please fix the issues above.${NC}"
    echo ""
    echo "Quick fixes:"
    echo "  - Install tools: brew install shellcheck jq"
    echo "  - Make scripts executable: chmod +x scripts/audit-*.sh"
    echo "  - Install dependencies: pnpm install"
    echo ""
    return 1
  fi
}

main "$@"
