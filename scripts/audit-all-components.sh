#!/usr/bin/env bash
#
# Audit All Components - Batch Processing
# Audite tous les composants détectés comme unused par Knip
#
# Usage: ./audit-all-components.sh [knip-report.json]
# Example: ./audit-all-components.sh knip-report.json
#
# Si aucun fichier n'est fourni, génère un rapport Knip frais

set -euo pipefail
IFS=$'\n\t'

# =====================================================================
# CONFIGURATION
# =====================================================================

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
readonly KNIP_REPORT="${1:-${PROJECT_ROOT}/knip-report.json}"
readonly AUDIT_SCRIPT="${SCRIPT_DIR}/audit-component-advanced.sh"
readonly OUTPUT_DIR="${PROJECT_ROOT}/reports/audit-$(date +%Y%m%d-%H%M%S)"

# Colors
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# =====================================================================
# MAIN
# =====================================================================

main() {
  echo "========================================="
  echo "BATCH AUDIT - All Components"
  echo "========================================="
  echo ""

  # Créer output directory
  mkdir -p "${OUTPUT_DIR}"

  # Générer rapport Knip si nécessaire
  if [[ ! -f "${KNIP_REPORT}" ]]; then
    echo -e "${BLUE}ℹ️  Generating fresh Knip report...${NC}"
    npx knip --reporter json > "${KNIP_REPORT}" 2>/dev/null || {
      echo -e "${YELLOW}⚠️  Warning: Knip failed, skipping batch audit${NC}"
      exit 0
    }
  fi

  echo -e "${BLUE}ℹ️  Using Knip report: ${KNIP_REPORT}${NC}"
  echo ""

  # Vérifier si jq est installé
  if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: jq not installed. Install with: brew install jq${NC}"
    exit 1
  fi

  # Extraire fichiers avec unused exports
  local files
  files=$(jq -r '.files[] | select(.exports | length > 0) | .exports[].filePath' "${KNIP_REPORT}" 2>/dev/null | sort -u)

  if [[ -z "${files}" ]]; then
    echo -e "${GREEN}✅ No unused exports found! Codebase is clean.${NC}"
    exit 0
  fi

  local total_files
  total_files=$(echo "${files}" | wc -l | tr -d ' ')

  echo -e "${BLUE}ℹ️  Found ${total_files} file(s) with unused exports${NC}"
  echo ""

  # Auditer chaque fichier
  local count=0
  local safe_to_delete=0
  local review_required=0
  local keep=0

  while IFS= read -r file; do
    ((count++))
    echo "========================================="
    echo "[${count}/${total_files}] Auditing: ${file}"
    echo "========================================="

    # Exécuter audit
    local exit_code=0
    "${AUDIT_SCRIPT}" "${file}" > "${OUTPUT_DIR}/$(basename "${file}").log" 2>&1 || exit_code=$?

    # Compter par verdict
    case ${exit_code} in
      0)
        ((keep++))
        echo -e "${GREEN}✅ KEEP${NC}"
        ;;
      1)
        ((review_required++))
        echo -e "${YELLOW}⚠️  REVIEW REQUIRED${NC}"
        ;;
      2)
        ((safe_to_delete++))
        echo -e "${BLUE}🗑️  SAFE TO DELETE${NC}"
        ;;
      *)
        echo -e "${YELLOW}⚠️  ERROR (exit code ${exit_code})${NC}"
        ;;
    esac

    echo ""
  done <<< "${files}"

  # Résumé final
  echo "========================================="
  echo "SUMMARY"
  echo "========================================="
  echo "Total files audited: ${count}"
  echo -e "${GREEN}✅ KEEP: ${keep}${NC}"
  echo -e "${YELLOW}⚠️  REVIEW REQUIRED: ${review_required}${NC}"
  echo -e "${BLUE}🗑️  SAFE TO DELETE: ${safe_to_delete}${NC}"
  echo ""
  echo "Detailed logs: ${OUTPUT_DIR}/"
  echo ""

  # Générer liste des fichiers à supprimer
  if [[ ${safe_to_delete} -gt 0 ]]; then
    echo "Files safe to delete:"
    grep -l "SAFE TO DELETE" "${OUTPUT_DIR}"/*.log | while read -r log; do
      local component
      component=$(basename "${log}" .log)
      echo "  - ${component}"
    done | tee "${OUTPUT_DIR}/safe-to-delete.txt"
    echo ""
    echo "Saved to: ${OUTPUT_DIR}/safe-to-delete.txt"
  fi
}

main "$@"
