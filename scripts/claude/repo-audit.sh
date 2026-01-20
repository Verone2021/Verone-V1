#!/bin/bash
# =============================================================================
# repo-audit.sh - Automated Repository Contradiction Detector
# =============================================================================
# Purpose: Scan the repo for documentation contradictions and inconsistencies
# Mode: READ-ONLY (no modifications)
# Usage: ./scripts/repo-audit.sh [--json] [--verbose]
#
# Output:
#   - Terminal summary with color-coded results
#   - reports/repo-audit-report.md (human-readable)
#   - reports/repo-audit-report.json (machine-readable, if --json flag)
#
# Exit codes:
#   0 - No critical contradictions found
#   1 - Critical contradictions detected
#   2 - Script error
# =============================================================================

set -uo pipefail
# Note: Not using -e because grep returns exit 1 when no match found

# Colors for terminal output
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORTS_DIR="${REPO_ROOT}/reports"
REPORT_MD="${REPORTS_DIR}/repo-audit-report.md"
REPORT_JSON="${REPORTS_DIR}/repo-audit-report.json"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Counters
CRITICAL_COUNT=0
MAJOR_COUNT=0
MINOR_COUNT=0
INFO_COUNT=0

# Arrays for findings
declare -a FINDINGS=()

# Parse arguments
JSON_OUTPUT=false
VERBOSE=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --json) JSON_OUTPUT=true; shift ;;
        --verbose|-v) VERBOSE=true; shift ;;
        --help|-h)
            echo "Usage: $0 [--json] [--verbose]"
            echo "  --json     Generate JSON report"
            echo "  --verbose  Show detailed output"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 2 ;;
    esac
done

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[CRITICAL]${NC} $1"
}

add_finding() {
    local severity="$1"  # CRITICAL, MAJOR, MINOR, INFO
    local id="$2"
    local description="$3"
    local file_a="$4"
    local file_b="$5"
    local recommendation="$6"

    FINDINGS+=("${severity}|${id}|${description}|${file_a}|${file_b}|${recommendation}")

    case $severity in
        CRITICAL) ((CRITICAL_COUNT++)) ;;
        MAJOR) ((MAJOR_COUNT++)) ;;
        MINOR) ((MINOR_COUNT++)) ;;
        INFO) ((INFO_COUNT++)) ;;
    esac
}

# =============================================================================
# Contradiction Detection Functions
# =============================================================================

check_coauthored_by_claude() {
    log_info "Checking for Co-Authored-By Claude patterns..."

    # Check CLAUDE.md for the problematic pattern
    if grep -q "Co-Authored-By.*Claude" "${REPO_ROOT}/CLAUDE.md" 2>/dev/null; then
        add_finding "CRITICAL" "C-01" \
            "CLAUDE.md contains Co-Authored-By Claude (blocks Vercel)" \
            "CLAUDE.md" \
            ".serena/memories/git-commits-no-coauthor-claude.md" \
            "Remove Co-Authored-By Claude from CLAUDE.md"
        log_error "C-01: Co-Authored-By Claude found in CLAUDE.md"
    else
        log_success "No Co-Authored-By Claude in CLAUDE.md"
    fi

    # Check .claude/commands/ for the pattern
    if grep -rq "Co-Authored-By.*Claude" "${REPO_ROOT}/.claude/commands/" 2>/dev/null; then
        local files=$(grep -rl "Co-Authored-By.*Claude" "${REPO_ROOT}/.claude/commands/" 2>/dev/null | xargs -n1 basename)
        add_finding "MAJOR" "C-01b" \
            "Co-Authored-By Claude found in commands: ${files}" \
            ".claude/commands/*.md" \
            "N/A" \
            "Remove Co-Authored-By patterns from command files"
        log_warning "C-01b: Co-Authored-By found in commands"
    fi
}

check_branch_strategy() {
    log_info "Checking branch strategy consistency..."

    # Check if CLAUDE.md mentions production-stable as production branch
    if grep -q "production-stable.*Production" "${REPO_ROOT}/CLAUDE.md" 2>/dev/null; then
        # Verify against canon docs
        if grep -q "main.*Production" "${REPO_ROOT}/docs/BRANCHING.md" 2>/dev/null; then
            add_finding "MAJOR" "C-03" \
                "CLAUDE.md says 'production-stable = Production' but BRANCHING.md says 'main = Production'" \
                "CLAUDE.md" \
                "docs/BRANCHING.md" \
                "Update CLAUDE.md to use 'main' as production branch"
            log_warning "C-03: Branch strategy mismatch"
        fi
    else
        log_success "Branch strategy consistent"
    fi
}

check_deployment_strategy() {
    log_info "Checking deployment strategy consistency..."

    # Check for "manual deployment only" memory vs auto-deploy docs
    local manual_memory="${REPO_ROOT}/.serena/memories/vercel-manual-deployment-only.md"
    if [[ -f "$manual_memory" ]]; then
        if grep -q "auto-deploy" "${REPO_ROOT}/docs/DEPLOYMENT.md" 2>/dev/null; then
            add_finding "MAJOR" "C-02" \
                "Memory says 'manual deployment only' but DEPLOYMENT.md says 'auto-deploy'" \
                ".serena/memories/vercel-manual-deployment-only.md" \
                "docs/DEPLOYMENT.md" \
                "Delete obsolete memory (docs are newer and correct)"
            log_warning "C-02: Deployment strategy contradiction"
        fi
    else
        log_success "No obsolete manual-deployment memory found"
    fi
}

check_vercel_status_checks() {
    log_info "Checking Vercel status check configuration..."

    # Get expected checks from GITHUB-RULESETS.md
    local rulesets_file="${REPO_ROOT}/docs/governance/GITHUB-RULESETS.md"
    if [[ -f "$rulesets_file" ]]; then
        local has_backoffice=$(grep -c "Vercel – verone-back-office" "$rulesets_file" 2>/dev/null || echo "0")
        local has_linkme=$(grep -c "Vercel – linkme" "$rulesets_file" 2>/dev/null || echo "0")

        if [[ "$has_backoffice" -gt 0 ]] && [[ "$has_linkme" -gt 0 ]]; then
            log_success "Both Vercel status checks documented"
        else
            add_finding "INFO" "I-01" \
                "Status checks may be incomplete in GITHUB-RULESETS.md" \
                "docs/governance/GITHUB-RULESETS.md" \
                "N/A" \
                "Verify all deployed apps have status checks documented"
            log_info "I-01: Status checks documentation incomplete"
        fi
    else
        add_finding "MINOR" "M-01" \
            "GITHUB-RULESETS.md not found" \
            "docs/governance/GITHUB-RULESETS.md" \
            "N/A" \
            "Create governance documentation"
        log_warning "M-01: Rulesets documentation missing"
    fi
}

check_obsolete_memories() {
    log_info "Checking for obsolete Serena memories..."

    local memories_dir="${REPO_ROOT}/.serena/memories"
    if [[ -d "$memories_dir" ]]; then
        # Check for Oct 2025 deployment memories (likely obsolete)
        local old_memories=$(find "$memories_dir" -name "*2025-10*" -type f 2>/dev/null | wc -l)
        if [[ "$old_memories" -gt 0 ]]; then
            add_finding "MINOR" "M-02" \
                "Found ${old_memories} memories from Oct 2025 (may be obsolete)" \
                ".serena/memories/*2025-10*" \
                "N/A" \
                "Review and archive old memories"
            log_warning "M-02: Old memories found"
        fi

        # Count total memories
        local total_memories=$(find "$memories_dir" -name "*.md" -type f 2>/dev/null | wc -l)
        log_info "Total Serena memories: ${total_memories}"
    fi
}

check_commit_workflow_consistency() {
    log_info "Checking commit workflow consistency..."

    local commit_cmd="${REPO_ROOT}/.claude/commands/commit.md"
    local claude_md="${REPO_ROOT}/CLAUDE.md"

    if [[ -f "$commit_cmd" ]] && [[ -f "$claude_md" ]]; then
        # Check if commit.md says "NO signatures"
        local no_signatures
        no_signatures=$(grep -c "NO.*signature" "$commit_cmd" 2>/dev/null | tr -d '[:space:]' || echo "0")
        [[ -z "$no_signatures" ]] && no_signatures=0
        # Check if CLAUDE.md has signatures
        local has_signatures
        has_signatures=$(grep -c "Generated with" "$claude_md" 2>/dev/null | tr -d '[:space:]' || echo "0")
        [[ -z "$has_signatures" ]] && has_signatures=0

        if [[ "$no_signatures" -gt 0 ]] && [[ "$has_signatures" -gt 0 ]]; then
            add_finding "MINOR" "M-03" \
                "Commit workflow inconsistency: /commit says 'no signatures' but CLAUDE.md includes signatures" \
                ".claude/commands/commit.md" \
                "CLAUDE.md" \
                "Clarify when to use /commit (speed) vs full workflow (formal)"
            log_warning "M-03: Commit workflow inconsistency"
        fi
    fi
}

check_canon_docs_exist() {
    log_info "Verifying canon documentation exists..."

    local canon_docs=(
        "docs/DEPLOYMENT.md"
        "docs/BRANCHING.md"
        "docs/governance/GITHUB-RULESETS.md"
    )

    for doc in "${canon_docs[@]}"; do
        if [[ -f "${REPO_ROOT}/${doc}" ]]; then
            log_success "Canon doc exists: ${doc}"
        else
            add_finding "CRITICAL" "C-CANON" \
                "Canon document missing: ${doc}" \
                "${doc}" \
                "N/A" \
                "Create missing canon document"
            log_error "Canon doc missing: ${doc}"
        fi
    done
}

check_hardcoded_project_ids() {
    log_info "Checking for hardcoded Supabase project IDs..."

    # Known project ID pattern
    local project_id="aorroydfjsrygmosnzrl"
    local count=$(grep -r "$project_id" "${REPO_ROOT}/.claude/" "${REPO_ROOT}/docs/" 2>/dev/null | wc -l | tr -d ' \n' || echo "0")

    if [[ "$count" -gt 0 ]]; then
        add_finding "INFO" "I-02" \
            "Hardcoded Supabase project ID found in ${count} locations (not portable for forks)" \
            "Various files" \
            "N/A" \
            "Consider using environment variables for project ID"
        log_info "I-02: Hardcoded project IDs found (not critical)"
    fi
}

# =============================================================================
# Report Generation
# =============================================================================

generate_markdown_report() {
    mkdir -p "$REPORTS_DIR"

    cat > "$REPORT_MD" << EOF
# Repository Audit Report
**Generated**: ${TIMESTAMP}
**Repository**: Verone2021/Verone-V1

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${CRITICAL_COUNT} |
| Major | ${MAJOR_COUNT} |
| Minor | ${MINOR_COUNT} |
| Info | ${INFO_COUNT} |

**Total Issues**: $((CRITICAL_COUNT + MAJOR_COUNT + MINOR_COUNT + INFO_COUNT))

---

## Findings

EOF

    for finding in "${FINDINGS[@]}"; do
        IFS='|' read -r severity id description file_a file_b recommendation <<< "$finding"

        local icon=""
        case $severity in
            CRITICAL) icon="🔴" ;;
            MAJOR) icon="🟠" ;;
            MINOR) icon="🟡" ;;
            INFO) icon="🔵" ;;
        esac

        cat >> "$REPORT_MD" << EOF
### ${icon} ${id}: ${description}

- **Severity**: ${severity}
- **File A**: \`${file_a}\`
- **File B**: \`${file_b}\`
- **Recommendation**: ${recommendation}

---

EOF
    done

    cat >> "$REPORT_MD" << EOF

## Canon Documents (Source of Truth)

1. \`docs/DEPLOYMENT.md\` - Deployment architecture
2. \`docs/BRANCHING.md\` - Branch strategy
3. \`docs/governance/GITHUB-RULESETS.md\` - GitHub rulesets

## Next Steps

1. Fix all CRITICAL issues before any deployment
2. Address MAJOR issues in next sprint
3. Review MINOR and INFO issues periodically

---

*Report generated by \`scripts/repo-audit.sh\`*
EOF

    log_success "Markdown report generated: ${REPORT_MD}"
}

generate_json_report() {
    if [[ "$JSON_OUTPUT" != "true" ]]; then
        return
    fi

    mkdir -p "$REPORTS_DIR"

    # Start JSON
    echo "{" > "$REPORT_JSON"
    echo "  \"timestamp\": \"${TIMESTAMP}\"," >> "$REPORT_JSON"
    echo "  \"summary\": {" >> "$REPORT_JSON"
    echo "    \"critical\": ${CRITICAL_COUNT}," >> "$REPORT_JSON"
    echo "    \"major\": ${MAJOR_COUNT}," >> "$REPORT_JSON"
    echo "    \"minor\": ${MINOR_COUNT}," >> "$REPORT_JSON"
    echo "    \"info\": ${INFO_COUNT}" >> "$REPORT_JSON"
    echo "  }," >> "$REPORT_JSON"
    echo "  \"findings\": [" >> "$REPORT_JSON"

    local first=true
    for finding in "${FINDINGS[@]}"; do
        IFS='|' read -r severity id description file_a file_b recommendation <<< "$finding"

        if [[ "$first" != "true" ]]; then
            echo "," >> "$REPORT_JSON"
        fi
        first=false

        # Escape quotes in strings
        description="${description//\"/\\\"}"
        recommendation="${recommendation//\"/\\\"}"

        cat >> "$REPORT_JSON" << EOF
    {
      "id": "${id}",
      "severity": "${severity}",
      "description": "${description}",
      "file_a": "${file_a}",
      "file_b": "${file_b}",
      "recommendation": "${recommendation}"
    }
EOF
    done

    echo "" >> "$REPORT_JSON"
    echo "  ]" >> "$REPORT_JSON"
    echo "}" >> "$REPORT_JSON"

    log_success "JSON report generated: ${REPORT_JSON}"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo ""
    echo "=============================================="
    echo "  Repository Audit - Verone Back Office"
    echo "  ${TIMESTAMP}"
    echo "=============================================="
    echo ""

    cd "$REPO_ROOT"

    # Run all checks
    check_canon_docs_exist
    check_coauthored_by_claude
    check_branch_strategy
    check_deployment_strategy
    check_vercel_status_checks
    check_obsolete_memories
    check_commit_workflow_consistency
    check_hardcoded_project_ids

    echo ""
    echo "=============================================="
    echo "  RESULTS"
    echo "=============================================="
    echo ""

    if [[ $CRITICAL_COUNT -gt 0 ]]; then
        log_error "Critical issues: ${CRITICAL_COUNT}"
    else
        log_success "No critical issues"
    fi

    if [[ $MAJOR_COUNT -gt 0 ]]; then
        log_warning "Major issues: ${MAJOR_COUNT}"
    fi

    if [[ $MINOR_COUNT -gt 0 ]]; then
        log_info "Minor issues: ${MINOR_COUNT}"
    fi

    if [[ $INFO_COUNT -gt 0 ]]; then
        log_info "Info items: ${INFO_COUNT}"
    fi

    echo ""
    echo "Total findings: $((CRITICAL_COUNT + MAJOR_COUNT + MINOR_COUNT + INFO_COUNT))"
    echo ""

    # Generate reports
    generate_markdown_report
    generate_json_report

    # Exit code based on critical issues
    if [[ $CRITICAL_COUNT -gt 0 ]]; then
        log_error "Audit FAILED: ${CRITICAL_COUNT} critical issue(s) found"
        echo ""
        echo "Run './scripts/repo-audit.sh --verbose' for details"
        echo "See reports/repo-audit-report.md for full report"
        exit 1
    else
        log_success "Audit PASSED: No critical issues"
        exit 0
    fi
}

main "$@"
