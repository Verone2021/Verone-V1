#!/usr/bin/env bash
#
# Audit Component Advanced - Best Practices 2026
# Détecte composants non utilisés en complément de Knip
#
# Usage: ./audit-component-advanced.sh <component-path>
# Example: ./audit-component-advanced.sh apps/back-office/src/components/forms/image-upload.tsx
#
# shellcheck disable=SC2155

set -euo pipefail
IFS=$'\n\t'

# =====================================================================
# CONFIGURATION
# =====================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly LOG_FILE="${PROJECT_ROOT}/.audit-component.log"

# Colors (ANSI)
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# =====================================================================
# HELPERS
# =====================================================================

log() {
  local level="$1"
  shift
  local message="$*"
  local timestamp
  timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[${timestamp}] [${level}] ${message}" >> "${LOG_FILE}"
}

error() {
  echo -e "${RED}❌ ERROR: $*${NC}" >&2
  log "ERROR" "$*"
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠️  WARNING: $*${NC}" >&2
  log "WARN" "$*"
}

info() {
  echo -e "${BLUE}ℹ️  $*${NC}"
  log "INFO" "$*"
}

success() {
  echo -e "${GREEN}✅ $*${NC}"
  log "INFO" "$*"
}

# Cleanup trap
cleanup() {
  local exit_code=$?
  # Exit codes 1-2 are normal verdicts (REVIEW REQUIRED, SAFE TO DELETE)
  # Only exit code > 2 or signals are real errors
  if [[ ${exit_code} -gt 2 ]]; then
    echo -e "${RED}❌ ERROR: Script failed with exit code ${exit_code}. Check ${LOG_FILE} for details.${NC}" >&2
    log "ERROR" "Script failed with exit code ${exit_code}"
  fi
}
trap cleanup EXIT INT TERM

# =====================================================================
# VALIDATION
# =====================================================================

validate_args() {
  if [[ $# -eq 0 ]]; then
    error "Usage: $0 <component-file-path>"
  fi

  local component_file="$1"

  if [[ ! -f "${component_file}" ]]; then
    error "File not found: ${component_file}"
  fi

  if [[ ! "${component_file}" =~ \.(tsx|ts|jsx|js)$ ]]; then
    error "File must be .ts, .tsx, .js, or .jsx: ${component_file}"
  fi
}

# =====================================================================
# AUDIT FUNCTIONS
# =====================================================================

get_component_name() {
  local file="$1"
  basename "${file}" | sed 's/\.(tsx|ts|jsx|js)$//'
}

check_deprecated_markers() {
  local file="$1"
  info "Checking deprecated markers..."

  if grep -qE "@deprecated|@legacy|TODO.*remove|FIXME.*obsolete" "${file}"; then
    warn "Component has deprecated markers"
    grep -n -E "@deprecated|@legacy|TODO.*remove|FIXME.*obsolete" "${file}" || true
    return 1
  fi

  success "No deprecated markers"
  return 0
}

check_static_imports() {
  local component_name="$1"
  info "Checking static imports..."

  local count
  count=$(grep -r \
    --include="*.ts" \
    --include="*.tsx" \
    --include="*.js" \
    --include="*.jsx" \
    -E "from ['\"].*${component_name}|import.*${component_name}" \
    "${PROJECT_ROOT}/apps" \
    "${PROJECT_ROOT}/packages" 2>/dev/null | \
    grep -v "${component_name}\.(tsx|ts|jsx|js):" | \
    wc -l | \
    tr -d ' ')

  if [[ ${count} -gt 0 ]]; then
    success "Found ${count} static import(s)"
    return 0
  else
    warn "No static imports found"
    return 1
  fi
}

check_dynamic_imports() {
  local component_name="$1"
  info "Checking dynamic imports (next/dynamic, React.lazy)..."

  if grep -rq \
    --include="*.ts" \
    --include="*.tsx" \
    -E "dynamic\(.*${component_name}|lazy\(.*${component_name}" \
    "${PROJECT_ROOT}/apps" \
    "${PROJECT_ROOT}/packages" 2>/dev/null; then
    success "Found dynamic import(s)"
    grep -rn \
      --include="*.ts" \
      --include="*.tsx" \
      -E "dynamic\(.*${component_name}|lazy\(.*${component_name}" \
      "${PROJECT_ROOT}/apps" \
      "${PROJECT_ROOT}/packages" 2>/dev/null || true
    return 0
  else
    warn "No dynamic imports found"
    return 1
  fi
}

check_api_routes() {
  local component_name="$1"
  info "Checking API routes..."

  if grep -rq \
    --include="*.ts" \
    "${component_name}" \
    "${PROJECT_ROOT}"/apps/*/src/app/api 2>/dev/null; then
    success "Referenced in API routes"
    return 0
  else
    warn "Not referenced in API routes"
    return 1
  fi
}

check_e2e_tests() {
  local component_name="$1"
  info "Checking E2E tests..."

  if grep -rq \
    --include="*.ts" \
    --include="*.spec.ts" \
    "${component_name}" \
    "${PROJECT_ROOT}"/packages/e2e-* \
    "${PROJECT_ROOT}"/tests 2>/dev/null; then
    success "Referenced in E2E tests"
    return 0
  else
    warn "Not referenced in E2E tests"
    return 1
  fi
}

check_git_history() {
  local file="$1"
  info "Checking git history..."

  local last_commit_date
  last_commit_date=$(git log -1 --format="%ai" -- "${file}" 2>/dev/null || echo "unknown")

  if [[ "${last_commit_date}" == "unknown" ]]; then
    warn "File not in git history (new file?)"
    return 1
  fi

  local commit_count
  commit_count=$(git log --oneline --all -- "${file}" 2>/dev/null | wc -l | tr -d ' ')

  info "Last modified: ${last_commit_date}"
  info "Total commits: ${commit_count}"

  # Show last 3 commits
  git log --oneline --all -3 -- "${file}" 2>/dev/null || true

  return 0
}

# =====================================================================
# VERDICT
# =====================================================================

compute_verdict() {
  local checks_passed="$1"
  local checks_failed="$2"

  echo ""
  echo "========================================="
  echo "VERDICT"
  echo "========================================="

  if [[ ${checks_passed} -eq 0 ]]; then
    error "Component appears UNUSED (0 references found)"
    echo "🗑️  SAFE TO DELETE (after manual review)"
    return 2
  elif [[ ${checks_failed} -gt 3 ]]; then
    warn "Component has FEW references (${checks_passed} found)"
    echo "⚠️  REVIEW REQUIRED (may be deprecated)"
    return 1
  else
    success "Component is ACTIVELY USED (${checks_passed} references)"
    echo "✅ KEEP (component in use)"
    return 0
  fi
}

# =====================================================================
# MAIN
# =====================================================================

main() {
  validate_args "$@"

  local component_file="$1"
  local component_name
  component_name=$(get_component_name "${component_file}")

  echo "========================================="
  echo "AUDIT: ${component_name}"
  echo "========================================="
  echo "File: ${component_file}"
  echo "Project Root: ${PROJECT_ROOT}"
  echo ""

  local checks_passed=0
  local checks_failed=0

  # Run all checks (don't exit on failure)
  set +e

  check_deprecated_markers "${component_file}" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  check_static_imports "${component_name}" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  check_dynamic_imports "${component_name}" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  check_api_routes "${component_name}" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  check_e2e_tests "${component_name}" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  check_git_history "${component_file}" && ((checks_passed++)) || ((checks_failed++))
  echo ""

  set -e

  compute_verdict ${checks_passed} ${checks_failed}
}

main "$@"
