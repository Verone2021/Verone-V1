#!/usr/bin/env bash
# ==============================================================================
# repo-control.sh - Unified Repository Management Tool
# ==============================================================================
# Purpose: One tool for all repository health, audit, hygiene, and documentation
# Replaces: repo-audit.sh + repo-doctor.sh + repo-hygiene.sh
# New: Classification system for documentation + combined health reports
#
# Commands:
#   audit       Detect documentation contradictions (READ-ONLY)
#   doctor      Diagnose repository health (git, auth, secrets) (READ-ONLY)
#   hygiene     Clean repository structure (TRANSFORMATIVE)
#   classify    Classify documentation + generate index (READ-ONLY)
#   health      Combined audit + doctor HTML report (READ-ONLY)
#
# ==============================================================================

set -euo pipefail

# ==============================================================================
# SECTION 1: CONSTANTS & CONFIG
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPORTS_DIR="${REPO_ROOT}/scripts/reports"
DOCS_INDEX_FILE="${REPORTS_DIR}/docs-index.json"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TIMESTAMP_FILE=$(date '+%Y-%m-%d_%H-%M-%S')

# ANSI Colors (factored from all 3 scripts)
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Exit codes
EXIT_OK=0
EXIT_ERROR=1
EXIT_SCRIPT_ERROR=2

# Global options
OPT_NO_COLOR=false
OPT_VERBOSE=false
OPT_OUTPUT_DIR="$REPORTS_DIR"

# ==============================================================================
# SECTION 2: UTILITY FUNCTIONS
# ==============================================================================

log_info() {
    if [[ "$OPT_NO_COLOR" == "true" ]]; then
        echo "[INFO] $*"
    else
        echo -e "${BLUE}ℹ${NC} $*"
    fi
}

log_success() {
    if [[ "$OPT_NO_COLOR" == "true" ]]; then
        echo "[OK] $*"
    else
        echo -e "${GREEN}✓${NC} $*"
    fi
}

log_warning() {
    if [[ "$OPT_NO_COLOR" == "true" ]]; then
        echo "[WARN] $*"
    else
        echo -e "${YELLOW}⚠${NC} $*"
    fi
}

log_error() {
    if [[ "$OPT_NO_COLOR" == "true" ]]; then
        echo "[ERROR] $*" >&2
    else
        echo -e "${RED}✗${NC} $*" >&2
    fi
}

ensure_reports_dir() {
    mkdir -p "${REPORTS_DIR}"
}

generate_timestamp() {
    date +"%Y-%m-%d_%H-%M-%S"
}

# ==============================================================================
# SECTION 3: AUDIT MODULE (ported from repo-audit.sh)
# ==============================================================================

# Counters for audit findings
AUDIT_CRITICAL_COUNT=0
AUDIT_MAJOR_COUNT=0
AUDIT_MINOR_COUNT=0
AUDIT_INFO_COUNT=0
declare -a AUDIT_FINDINGS=()

add_audit_finding() {
    local severity="$1"
    local id="$2"
    local description="$3"
    local file_a="$4"
    local file_b="$5"
    local recommendation="$6"

    AUDIT_FINDINGS+=("${severity}|${id}|${description}|${file_a}|${file_b}|${recommendation}")

    case $severity in
        CRITICAL) ((AUDIT_CRITICAL_COUNT++)) ;;
        MAJOR) ((AUDIT_MAJOR_COUNT++)) ;;
        MINOR) ((AUDIT_MINOR_COUNT++)) ;;
        INFO) ((AUDIT_INFO_COUNT++)) ;;
    esac
}

check_coauthored_by_claude() {
    log_info "Checking for Co-Authored-By Claude patterns..."

    if grep -q "Co-Authored-By.*Claude" "${REPO_ROOT}/CLAUDE.md" 2>/dev/null; then
        add_audit_finding "CRITICAL" "C-01" \
            "CLAUDE.md contains Co-Authored-By Claude (blocks Vercel)" \
            "CLAUDE.md" \
            ".serena/memories/git-commits-no-coauthor-claude.md" \
            "Remove Co-Authored-By Claude from CLAUDE.md"
        log_error "C-01: Co-Authored-By Claude found in CLAUDE.md"
    else
        log_success "No Co-Authored-By Claude in CLAUDE.md"
    fi

    if grep -rq "Co-Authored-By.*Claude" "${REPO_ROOT}/.claude/commands/" 2>/dev/null; then
        local files=$(grep -rl "Co-Authored-By.*Claude" "${REPO_ROOT}/.claude/commands/" 2>/dev/null | xargs -n1 basename)
        add_audit_finding "MAJOR" "C-01b" \
            "Co-Authored-By Claude found in commands: ${files}" \
            ".claude/commands/*.md" \
            "N/A" \
            "Remove Co-Authored-By patterns from command files"
        log_warning "C-01b: Co-Authored-By found in commands"
    fi
}

check_branch_strategy() {
    log_info "Checking branch strategy consistency..."

    if grep -q "production-stable.*Production" "${REPO_ROOT}/CLAUDE.md" 2>/dev/null; then
        if grep -q "main.*Production" "${REPO_ROOT}/docs/BRANCHING.md" 2>/dev/null; then
            add_audit_finding "MAJOR" "C-03" \
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

    local manual_memory="${REPO_ROOT}/.serena/memories/vercel-manual-deployment-only.md"
    if [[ -f "$manual_memory" ]]; then
        if grep -q "auto-deploy" "${REPO_ROOT}/docs/DEPLOYMENT.md" 2>/dev/null; then
            add_audit_finding "MAJOR" "C-02" \
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

    local rulesets_file="${REPO_ROOT}/docs/governance/GITHUB-RULESETS.md"
    if [[ -f "$rulesets_file" ]]; then
        local has_backoffice=$(grep -c "Vercel – verone-back-office" "$rulesets_file" 2>/dev/null || echo "0")
        local has_linkme=$(grep -c "Vercel – linkme" "$rulesets_file" 2>/dev/null || echo "0")

        if [[ "$has_backoffice" -gt 0 ]] && [[ "$has_linkme" -gt 0 ]]; then
            log_success "Both Vercel status checks documented"
        else
            add_audit_finding "INFO" "I-01" \
                "Status checks may be incomplete in GITHUB-RULESETS.md" \
                "docs/governance/GITHUB-RULESETS.md" \
                "N/A" \
                "Verify all deployed apps have status checks documented"
            log_info "I-01: Status checks documentation incomplete"
        fi
    else
        add_audit_finding "MINOR" "M-01" \
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
        local old_memories=$(find "$memories_dir" -name "*2025-10*" -type f 2>/dev/null | wc -l)
        if [[ "$old_memories" -gt 0 ]]; then
            add_audit_finding "MINOR" "M-02" \
                "Found ${old_memories} memories from Oct 2025 (may be obsolete)" \
                ".serena/memories/*2025-10*" \
                "N/A" \
                "Review and archive old memories"
            log_warning "M-02: Old memories found"
        fi

        local total_memories=$(find "$memories_dir" -name "*.md" -type f 2>/dev/null | wc -l)
        log_info "Total Serena memories: ${total_memories}"
    fi
}

check_commit_workflow_consistency() {
    log_info "Checking commit workflow consistency..."

    local commit_cmd="${REPO_ROOT}/.claude/commands/commit.md"
    local claude_md="${REPO_ROOT}/CLAUDE.md"

    if [[ -f "$commit_cmd" ]] && [[ -f "$claude_md" ]]; then
        local no_signatures=$(grep -c "NO.*signature" "$commit_cmd" 2>/dev/null || echo "0")
        local has_signatures=$(grep -c "Generated with" "$claude_md" 2>/dev/null || echo "0")

        if [[ "$no_signatures" -gt 0 ]] && [[ "$has_signatures" -gt 0 ]]; then
            add_audit_finding "MINOR" "M-03" \
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
            add_audit_finding "CRITICAL" "C-CANON" \
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

    local project_id="aorroydfjsrygmosnzrl"
    local count=$(grep -r "$project_id" "${REPO_ROOT}/.claude/" "${REPO_ROOT}/docs/" 2>/dev/null | wc -l | tr -d ' \n' || echo "0")

    if [[ "$count" -gt 0 ]]; then
        add_audit_finding "INFO" "I-02" \
            "Hardcoded Supabase project ID found in ${count} locations (not portable for forks)" \
            "Various files" \
            "N/A" \
            "Consider using environment variables for project ID"
        log_info "I-02: Hardcoded project IDs found (not critical)"
    fi
}

check_docs_placement() {
    log_info "Checking documentation placement..."

    # Check if docs index exists
    if [[ -f "$DOCS_INDEX_FILE" ]]; then
        # Validate docs are in correct locations using index
        local misplaced=$(jq -r '.files[] | select(.pattern == "unknown") | .path' "$DOCS_INDEX_FILE" 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$misplaced" -gt 0 ]]; then
            add_audit_finding "INFO" "I-03" \
                "Found ${misplaced} documentation files with unknown placement pattern" \
                "docs/" \
                "N/A" \
                "Run './scripts/repo-control.sh classify --validate' for details"
            log_info "I-03: ${misplaced} docs with unknown pattern"
        else
            log_success "All documentation properly placed"
        fi
    else
        log_info "Docs index not found (run 'classify --generate-index' first)"
    fi
}

generate_audit_report_md() {
    local report_file="${OPT_OUTPUT_DIR}/repo-audit-report.md"

    cat > "$report_file" << EOF
# Repository Audit Report
**Generated**: ${TIMESTAMP}
**Repository**: Verone2021/Verone-V1

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | ${AUDIT_CRITICAL_COUNT} |
| Major | ${AUDIT_MAJOR_COUNT} |
| Minor | ${AUDIT_MINOR_COUNT} |
| Info | ${AUDIT_INFO_COUNT} |

**Total Issues**: $((AUDIT_CRITICAL_COUNT + AUDIT_MAJOR_COUNT + AUDIT_MINOR_COUNT + AUDIT_INFO_COUNT))

---

## Findings

EOF

    for finding in "${AUDIT_FINDINGS[@]}"; do
        IFS='|' read -r severity id description file_a file_b recommendation <<< "$finding"

        local icon=""
        case $severity in
            CRITICAL) icon="🔴" ;;
            MAJOR) icon="🟠" ;;
            MINOR) icon="🟡" ;;
            INFO) icon="🔵" ;;
        esac

        cat >> "$report_file" << EOF
### ${icon} ${id}: ${description}

- **Severity**: ${severity}
- **File A**: \`${file_a}\`
- **File B**: \`${file_b}\`
- **Recommendation**: ${recommendation}

---

EOF
    done

    cat >> "$report_file" << EOF

## Canon Documents (Source of Truth)

1. \`docs/DEPLOYMENT.md\` - Deployment architecture
2. \`docs/BRANCHING.md\` - Branch strategy
3. \`docs/governance/GITHUB-RULESETS.md\` - GitHub rulesets

## Next Steps

1. Fix all CRITICAL issues before any deployment
2. Address MAJOR issues in next sprint
3. Review MINOR and INFO issues periodically

---

*Report generated by \`scripts/repo-control.sh audit\`*
EOF

    log_success "Markdown report: ${report_file}"
}

generate_audit_report_json() {
    local report_file="${OPT_OUTPUT_DIR}/repo-audit-report.json"

    echo "{" > "$report_file"
    echo "  \"timestamp\": \"${TIMESTAMP}\"," >> "$report_file"
    echo "  \"summary\": {" >> "$report_file"
    echo "    \"critical\": ${AUDIT_CRITICAL_COUNT}," >> "$report_file"
    echo "    \"major\": ${AUDIT_MAJOR_COUNT}," >> "$report_file"
    echo "    \"minor\": ${AUDIT_MINOR_COUNT}," >> "$report_file"
    echo "    \"info\": ${AUDIT_INFO_COUNT}" >> "$report_file"
    echo "  }," >> "$report_file"
    echo "  \"findings\": [" >> "$report_file"

    local first=true
    for finding in "${AUDIT_FINDINGS[@]}"; do
        IFS='|' read -r severity id description file_a file_b recommendation <<< "$finding"

        if [[ "$first" != "true" ]]; then
            echo "," >> "$report_file"
        fi
        first=false

        description="${description//\"/\\\"}"
        recommendation="${recommendation//\"/\\\"}"

        cat >> "$report_file" << EOF
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

    echo "" >> "$report_file"
    echo "  ]" >> "$report_file"
    echo "}" >> "$report_file"

    log_success "JSON report: ${report_file}"
}

cmd_audit() {
    local json_output=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            --json) json_output=true; shift ;;
            --verbose) OPT_VERBOSE=true; shift ;;
            *) shift ;;
        esac
    done

    echo ""
    echo "=============================================="
    echo "  Repository Audit"
    echo "  ${TIMESTAMP}"
    echo "=============================================="
    echo ""

    cd "$REPO_ROOT"

    check_canon_docs_exist
    check_coauthored_by_claude
    check_branch_strategy
    check_deployment_strategy
    check_vercel_status_checks
    check_obsolete_memories
    check_commit_workflow_consistency
    check_hardcoded_project_ids
    check_docs_placement

    echo ""
    echo "=============================================="
    echo "  RESULTS"
    echo "=============================================="
    echo ""

    if [[ $AUDIT_CRITICAL_COUNT -gt 0 ]]; then
        log_error "Critical issues: ${AUDIT_CRITICAL_COUNT}"
    else
        log_success "No critical issues"
    fi

    [[ $AUDIT_MAJOR_COUNT -gt 0 ]] && log_warning "Major issues: ${AUDIT_MAJOR_COUNT}"
    [[ $AUDIT_MINOR_COUNT -gt 0 ]] && log_info "Minor issues: ${AUDIT_MINOR_COUNT}"
    [[ $AUDIT_INFO_COUNT -gt 0 ]] && log_info "Info items: ${AUDIT_INFO_COUNT}"

    echo ""
    echo "Total findings: $((AUDIT_CRITICAL_COUNT + AUDIT_MAJOR_COUNT + AUDIT_MINOR_COUNT + AUDIT_INFO_COUNT))"
    echo ""

    generate_audit_report_md
    if [[ "$json_output" == true ]]; then
        generate_audit_report_json
    fi

    if [[ $AUDIT_CRITICAL_COUNT -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

# ==============================================================================
# SECTION 4: DOCTOR MODULE (ported from repo-doctor.sh + report generation)
# ==============================================================================

DOCTOR_WARNINGS=0
DOCTOR_ERRORS=0
declare -a DOCTOR_FINDINGS=()

add_doctor_finding() {
    local severity="$1"  # ERROR, WARNING, INFO
    local check_name="$2"
    local message="$3"

    DOCTOR_FINDINGS+=("${severity}|${check_name}|${message}")

    case $severity in
        ERROR) ((DOCTOR_ERRORS++)) ;;
        WARNING) ((DOCTOR_WARNINGS++)) ;;
    esac
}

check_token_leak() {
    log_info "[1/9] Checking environment tokens..."

    local leak=false
    if [ -n "${GH_TOKEN:-}" ]; then
        log_error "GH_TOKEN is set (use OAuth keychain instead)"
        add_doctor_finding "ERROR" "Token Leak" "GH_TOKEN environment variable is set"
        leak=true
    fi

    if [ -n "${GITHUB_TOKEN:-}" ]; then
        log_error "GITHUB_TOKEN is set (use OAuth keychain instead)"
        add_doctor_finding "ERROR" "Token Leak" "GITHUB_TOKEN environment variable is set"
        leak=true
    fi

    if [[ "$leak" == false ]]; then
        log_success "No tokens in environment (OAuth keychain active)"
    fi
}

check_github_auth() {
    log_info "[2/9] Checking GitHub authentication..."

    if gh auth status &>/dev/null; then
        local account=$(gh auth status 2>&1 | grep "Logged in" | head -1 | sed 's/.*account //' | sed 's/ .*//')
        log_success "Authenticated as: $account"
    else
        log_error "Not authenticated with GitHub CLI"
        add_doctor_finding "ERROR" "GitHub Auth" "Not authenticated (run: gh auth login --web)"
    fi
}

check_current_branch() {
    log_info "[3/9] Checking current branch..."

    local branch=$(git branch --show-current)
    if [ "$branch" = "main" ]; then
        log_success "On main branch"
    elif [[ "$branch" == feature/* ]] || [[ "$branch" == fix/* ]] || [[ "$branch" == chore/* ]]; then
        log_success "Valid feature branch: $branch"
    else
        log_warning "Non-standard branch: $branch"
        add_doctor_finding "WARNING" "Branch Name" "Branch does not follow naming convention"
    fi
}

check_unpushed_commits() {
    log_info "[4/9] Checking unpushed commits..."

    if git rev-parse --abbrev-ref "@{u}" &>/dev/null; then
        local unpushed=$(git log "@{u}".."HEAD" --oneline 2>/dev/null | wc -l | tr -d ' ')

        if [[ "$unpushed" -eq 0 ]]; then
            log_success "All commits pushed"
        else
            log_warning "${unpushed} unpushed commit(s)"
            add_doctor_finding "WARNING" "Unpushed Commits" "${unpushed} commits not pushed to remote"
        fi
    else
        log_info "No upstream configured (skip check)"
    fi
}

check_uncommitted_changes() {
    log_info "[5/9] Checking uncommitted changes..."

    local staged=$(git diff --cached --name-only | wc -l | tr -d ' ')
    local unstaged=$(git diff --name-only | wc -l | tr -d ' ')

    if [[ "$staged" -eq 0 ]] && [[ "$unstaged" -eq 0 ]]; then
        log_success "Working directory clean"
    else
        [[ "$staged" -gt 0 ]] && log_warning "${staged} staged file(s)"
        [[ "$unstaged" -gt 0 ]] && log_warning "${unstaged} unstaged file(s)"
        add_doctor_finding "WARNING" "Uncommitted Changes" "${staged} staged, ${unstaged} unstaged"
    fi
}

check_local_branches() {
    log_info "[6/9] Checking local branches..."

    local total=$(git branch | wc -l | tr -d ' ')
    local merged=$(git branch --merged main 2>/dev/null | grep -v "main" | grep -v "production" | wc -l | tr -d ' ')

    if [[ "$merged" -gt 0 ]]; then
        log_warning "${merged} merged branch(es) to cleanup"
        add_doctor_finding "WARNING" "Merged Branches" "${merged} branches already merged into main"
    else
        log_success "No merged branches to cleanup"
    fi
}

check_remote_branches() {
    log_info "[7/9] Checking remote branches..."

    git fetch --prune &>/dev/null || true
    local total=$(git branch -r | grep -v HEAD | wc -l | tr -d ' ')

    log_info "Remote branches: ${total}"
}

check_anti_secrets_scan() {
    log_info "[8/9] Scanning for secrets in tracked files..."

    local patterns=(
        "ghp_[a-zA-Z0-9]{36}"
        "gho_[a-zA-Z0-9]{36}"
        "github_pat_[a-zA-Z0-9_]{82}"
        "sk_live_[a-zA-Z0-9]{24,}"
        "eyJhbGciOiJ[a-zA-Z0-9_-]{100,}"
    )

    local found=false
    local exclude="\.env\.example|\.md$|repo-doctor\.sh|repo-control\.sh|node_modules"

    for pattern in "${patterns[@]}"; do
        local matches=$(git ls-files -- '*.ts' '*.tsx' '*.js' '*.json' '*.env*' '*.sh' 2>/dev/null | \
                        grep -vE "$exclude" | \
                        xargs grep -lE "$pattern" 2>/dev/null | head -5)
        if [ -n "$matches" ]; then
            log_error "Secret pattern detected: ${pattern:0:20}..."
            add_doctor_finding "ERROR" "Secret Detected" "Pattern ${pattern:0:20}... found in tracked files"
            found=true
        fi
    done

    if [[ "$found" == false ]]; then
        log_success "No secrets detected in tracked files"
    fi
}

check_env_example_validation() {
    log_info "[9/9] Validating .env.example..."

    if [[ -f "${REPO_ROOT}/.env.example" ]]; then
        local real_values=$(grep -E "^[A-Z_]+=.{20,}" "${REPO_ROOT}/.env.example" 2>/dev/null | \
            grep -v "your" | grep -v "_here" | grep -v "placeholder" | \
            grep -v "example" | grep -v "password" | grep -v "secret" | \
            grep -v "YOUR_" | grep -v "xxx" | grep -v "\.\.\." | head -3)

        if [ -n "$real_values" ]; then
            log_warning "Suspicious values in .env.example"
            add_doctor_finding "WARNING" "Env Example" "Potential real secrets in .env.example"
        else
            log_success ".env.example contains only placeholders"
        fi
    else
        log_info "No .env.example found"
    fi
}

generate_doctor_report_md() {
    local report_file="${OPT_OUTPUT_DIR}/repo-doctor-report.md"

    cat > "$report_file" << EOF
# Repository Doctor Report
**Generated**: ${TIMESTAMP}
**Repository**: Verone2021/Verone-V1

---

## Summary

| Type | Count |
|------|-------|
| Errors | ${DOCTOR_ERRORS} |
| Warnings | ${DOCTOR_WARNINGS} |

**Total Issues**: $((DOCTOR_ERRORS + DOCTOR_WARNINGS))

---

## Findings

EOF

    for finding in "${DOCTOR_FINDINGS[@]}"; do
        IFS='|' read -r severity check message <<< "$finding"

        local icon=""
        case $severity in
            ERROR) icon="🔴" ;;
            WARNING) icon="🟡" ;;
            INFO) icon="🔵" ;;
        esac

        cat >> "$report_file" << EOF
### ${icon} ${check}

- **Severity**: ${severity}
- **Details**: ${message}

---

EOF
    done

    cat >> "$report_file" << EOF

## Health Status

EOF

    if [[ $DOCTOR_ERRORS -eq 0 ]] && [[ $DOCTOR_WARNINGS -eq 0 ]]; then
        echo "✅ Repository is healthy (no issues found)" >> "$report_file"
    elif [[ $DOCTOR_ERRORS -eq 0 ]]; then
        echo "⚠️ Repository has warnings but no critical errors" >> "$report_file"
    else
        echo "❌ Repository requires attention (${DOCTOR_ERRORS} error(s))" >> "$report_file"
    fi

    cat >> "$report_file" << EOF

---

*Report generated by \`scripts/repo-control.sh doctor\`*
EOF

    log_success "Doctor report: ${report_file}"
}

cmd_doctor() {
    local generate_report=true

    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose) OPT_VERBOSE=true; shift ;;
            --no-report) generate_report=false; shift ;;
            *) shift ;;
        esac
    done

    echo ""
    echo "=============================================="
    echo "  Repository Doctor"
    echo "  ${TIMESTAMP}"
    echo "=============================================="
    echo ""

    cd "$REPO_ROOT"

    check_token_leak
    check_github_auth
    check_current_branch
    check_unpushed_commits
    check_uncommitted_changes
    check_local_branches
    check_remote_branches
    check_anti_secrets_scan
    check_env_example_validation

    echo ""
    echo "=============================================="
    echo "  SUMMARY"
    echo "=============================================="
    echo ""

    if [[ $DOCTOR_ERRORS -eq 0 ]] && [[ $DOCTOR_WARNINGS -eq 0 ]]; then
        log_success "Repository is healthy"
    elif [[ $DOCTOR_ERRORS -eq 0 ]]; then
        log_warning "Repository OK with ${DOCTOR_WARNINGS} warning(s)"
    else
        log_error "Repository requires attention: ${DOCTOR_ERRORS} error(s), ${DOCTOR_WARNINGS} warning(s)"
    fi

    if [[ "$generate_report" == true ]]; then
        echo ""
        generate_doctor_report_md
    fi

    if [[ $DOCTOR_ERRORS -gt 0 ]]; then
        return 1
    else
        return 0
    fi
}

# ==============================================================================
# SECTION 5: HYGIENE MODULE (ported from repo-hygiene.sh)
# ==============================================================================

cmd_hygiene() {
    local dry_run=false
    local archive_to="archive/$(date +%Y-%m)/claude"

    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run) dry_run=true; shift ;;
            --archive-to) archive_to="$2"; shift 2 ;;
            *) shift ;;
        esac
    done

    echo ""
    echo "=============================================="
    echo "  Repository Hygiene"
    echo "  Archive to: ${archive_to}"
    if [[ "$dry_run" == true ]]; then
        echo "  MODE: DRY RUN (no changes)"
    fi
    echo "=============================================="
    echo ""

    cd "$REPO_ROOT"

    if [[ "$dry_run" == true ]]; then
        log_info "DRY RUN: Would create directories:"
        echo "  - ${archive_to}/agents"
        echo "  - ${archive_to}/commands"
        echo "  - ${archive_to}/memories"
        echo "  - ${archive_to}/plans"
        echo "  - docs/claude"
        echo "  - .tasks/plans"
        echo "  - scripts/claude"
    else
        mkdir -p "${archive_to}/agents" "${archive_to}/commands" "${archive_to}/memories" "${archive_to}/plans"
        mkdir -p docs/claude docs/runbooks docs/architecture scripts/claude .tasks/plans scripts/maintenance
        log_success "Created target directories"
    fi

    # Move repo-specific docs out of .claude
    if [[ -f ".claude/WORKFLOW-CHECKLIST.md" ]]; then
        if [[ "$dry_run" == true ]]; then
            log_info "Would move: .claude/WORKFLOW-CHECKLIST.md → docs/claude/"
        else
            git mv ".claude/WORKFLOW-CHECKLIST.md" "docs/claude/WORKFLOW-CHECKLIST.md" || true
            log_success "Moved WORKFLOW-CHECKLIST.md"
        fi
    fi

    # Move plans
    if [[ -d ".claude/plans" ]] && [[ -n "$(ls -A .claude/plans 2>/dev/null)" ]]; then
        if [[ "$dry_run" == true ]]; then
            log_info "Would move: .claude/plans/* → .tasks/plans/"
        else
            for f in .claude/plans/*; do
                [[ -f "$f" ]] && git mv "$f" ".tasks/plans/" || true
            done
            log_success "Moved plans"
        fi
    fi

    # Archive memories
    if [[ -d ".claude/memories" ]] && [[ -n "$(ls -A .claude/memories 2>/dev/null)" ]]; then
        if [[ "$dry_run" == true ]]; then
            log_info "Would archive: .claude/memories/* → ${archive_to}/memories/"
        else
            for f in .claude/memories/*; do
                [[ -f "$f" ]] && git mv "$f" "${archive_to}/memories/" || true
            done
            log_success "Archived memories"
        fi
    fi

    # Cleanup empty directories
    for dir in .claude/memories .claude/plans; do
        if [[ -d "$dir" ]] && [[ -z "$(ls -A "$dir" 2>/dev/null)" ]]; then
            if [[ "$dry_run" == true ]]; then
                log_info "Would remove empty: $dir"
            else
                rmdir "$dir" 2>/dev/null || true
                log_success "Removed empty: $dir"
            fi
        fi
    done

    echo ""
    if [[ "$dry_run" == true ]]; then
        log_info "DRY RUN complete. Run without --dry-run to apply changes."
    else
        log_success "Hygiene complete. Review with 'git status'"
    fi
}

# ==============================================================================
# SECTION 6: CLASSIFY MODULE (NEW - documentation classification)
# ==============================================================================

# Documentation pattern detection
detect_doc_pattern() {
    local filename="$1"

    # Audit snapshots
    if [[ "$filename" =~ ^AUDIT-[A-Z-]+-[0-9]{4}-[0-9]{2}-[0-9]{2}\.md$ ]]; then
        echo "audit"
        return 0
    fi

    # Architecture Decision Records
    if [[ "$filename" =~ ^ADR-[0-9]{3}-.+\.md$ ]]; then
        echo "adr"
        return 0
    fi

    # Business rules (numbered)
    if [[ "$filename" =~ ^[0-9]{2}-.+\.md$ ]]; then
        echo "business_rule"
        return 0
    fi

    # Workflows
    if [[ "$filename" =~ -workflow\.md$ ]]; then
        echo "workflow"
        return 0
    fi

    # Runbooks
    if [[ "$filename" =~ -(recovery|incident|playbook)\.md$ ]]; then
        echo "runbook"
        return 0
    fi

    # Serena memories (lowercase with dashes, no numbers at start)
    if [[ "$filename" =~ ^[a-z][a-z0-9-]*\.md$ ]]; then
        echo "serena_memory"
        return 0
    fi

    echo "unknown"
    return 0
}

classify_single_file() {
    local filename="$1"

    local pattern=$(detect_doc_pattern "$filename")

    case "$pattern" in
        audit)
            echo "docs/audit/${filename}"
            echo "Reason: AUDIT-{DOMAIN}-{DATE} pattern detected"
            ;;
        business_rule)
            echo "docs/archive/$(date +%Y-%m)/business-rules/${filename}"
            echo "Reason: Business rule with NN- prefix"
            ;;
        serena_memory)
            echo ".serena/memories/${filename}"
            echo "Reason: Serena memory pattern (lowercase with dashes)"
            ;;
        adr)
            echo "docs/adr/${filename}"
            echo "Reason: Architecture Decision Record"
            ;;
        workflow)
            echo "docs/workflows/${filename}"
            echo "Reason: Workflow documentation"
            ;;
        runbook)
            echo "docs/runbooks/${filename}"
            echo "Reason: Runbook/incident documentation"
            ;;
        *)
            echo "docs/archive/$(date +%Y-%m)/uncategorized/${filename}"
            echo "Reason: No matching pattern, needs manual classification"
            ;;
    esac
}

generate_docs_index() {
    log_info "Generating documentation index..."

    local temp_file=$(mktemp)

    cat > "$temp_file" << 'EOF'
{
  "metadata": {
    "generated": "",
    "total_files": 0,
    "version": "1.0.0"
  },
  "files": []
}
EOF

    # Update metadata
    local total=$(find "${REPO_ROOT}/docs" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
    jq --arg ts "$(date -Iseconds)" --arg count "$total" \
        '.metadata.generated = $ts | .metadata.total_files = ($count | tonumber)' \
        "$temp_file" > "${temp_file}.tmp" && mv "${temp_file}.tmp" "$temp_file"

    # Scan files
    while IFS= read -r filepath; do
        local filename=$(basename "$filepath")
        local relative_path="${filepath#${REPO_ROOT}/}"
        local pattern=$(detect_doc_pattern "$filename")

        local file_entry=$(jq -n \
            --arg path "$relative_path" \
            --arg name "$filename" \
            --arg pattern "$pattern" \
            '{path: $path, filename: $name, pattern: $pattern}')

        jq --argjson entry "$file_entry" '.files += [$entry]' \
            "$temp_file" > "${temp_file}.tmp" && mv "${temp_file}.tmp" "$temp_file"
    done < <(find "${REPO_ROOT}/docs" -type f -name "*.md" 2>/dev/null)

    mv "$temp_file" "$DOCS_INDEX_FILE"
    log_success "Index generated: ${DOCS_INDEX_FILE}"
    log_info "Total files indexed: ${total}"
}

search_docs_index() {
    local query="$1"

    if [[ ! -f "$DOCS_INDEX_FILE" ]]; then
        log_error "Index not found. Run 'classify --generate-index' first."
        return 1
    fi

    log_info "Searching for: ${query}"
    echo ""

    jq -r --arg q "$query" '.files[] | select(.path | test($q; "i")) |
        "  \(.filename)\n    Path: \(.path)\n    Pattern: \(.pattern)\n"' \
        "$DOCS_INDEX_FILE"
}

validate_docs_structure() {
    log_info "Validating documentation structure..."

    if [[ ! -f "$DOCS_INDEX_FILE" ]]; then
        log_error "Index not found. Run 'classify --generate-index' first."
        return 1
    fi

    local unknown=$(jq -r '.files[] | select(.pattern == "unknown") | .path' "$DOCS_INDEX_FILE" | wc -l | tr -d ' ')
    local total=$(jq -r '.metadata.total_files' "$DOCS_INDEX_FILE")

    echo ""
    echo "Documentation Structure Validation"
    echo "-----------------------------------"
    echo "Total files: ${total}"
    echo "Unknown pattern: ${unknown}"
    echo "Classified: $((total - unknown))"
    echo ""

    if [[ "$unknown" -gt 0 ]]; then
        log_warning "${unknown} files need manual classification:"
        jq -r '.files[] | select(.pattern == "unknown") | "  - \(.path)"' "$DOCS_INDEX_FILE"
    else
        log_success "All files properly classified"
    fi
}

cmd_classify() {
    local mode="classify"
    local filename=""
    local query=""

    while [[ $# -gt 0 ]]; do
        case $1 in
            --generate-index) mode="generate_index"; shift ;;
            --search) mode="search"; query="$2"; shift 2 ;;
            --validate) mode="validate"; shift ;;
            *) filename="$1"; shift ;;
        esac
    done

    case "$mode" in
        classify)
            if [[ -z "$filename" ]]; then
                log_error "Usage: classify <filename>"
                return 1
            fi
            classify_single_file "$filename"
            ;;
        generate_index)
            generate_docs_index
            ;;
        search)
            if [[ -z "$query" ]]; then
                log_error "Usage: classify --search <query>"
                return 1
            fi
            search_docs_index "$query"
            ;;
        validate)
            validate_docs_structure
            ;;
    esac
}

# ==============================================================================
# SECTION 7: HEALTH MODULE (NEW - combined HTML report)
# ==============================================================================

cmd_health() {
    echo ""
    echo "=============================================="
    echo "  Repository Health Check"
    echo "  ${TIMESTAMP}"
    echo "=============================================="
    echo ""

    log_info "Running comprehensive health check..."

    # Run audit silently
    log_info "Running audit checks..."
    cmd_audit --json > /dev/null 2>&1 || true

    # Run doctor silently
    log_info "Running doctor checks..."
    cmd_doctor > /dev/null 2>&1 || true

    # Generate combined HTML report
    local report_file="${OPT_OUTPUT_DIR}/health-report.html"

    cat > "$report_file" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Repository Health Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; }
        h1 { color: #333; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .card { background: #f5f5f5; padding: 20px; border-radius: 8px; flex: 1; }
        .card h2 { margin-top: 0; font-size: 18px; }
        .metric { font-size: 32px; font-weight: bold; }
        .critical { color: #dc3545; }
        .warning { color: #ffc107; }
        .success { color: #28a745; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
EOF

    echo "    <h1>Repository Health Report</h1>" >> "$report_file"
    echo "    <p>Generated: ${TIMESTAMP}</p>" >> "$report_file"

    # Summary cards
    echo "    <div class='summary'>" >> "$report_file"

    # Audit summary
    local audit_class="success"
    [[ $AUDIT_CRITICAL_COUNT -gt 0 ]] && audit_class="critical"
    [[ $AUDIT_MAJOR_COUNT -gt 0 ]] && [[ $AUDIT_CRITICAL_COUNT -eq 0 ]] && audit_class="warning"

    echo "        <div class='card'>" >> "$report_file"
    echo "            <h2>Audit Status</h2>" >> "$report_file"
    echo "            <div class='metric ${audit_class}'>${AUDIT_CRITICAL_COUNT} Critical</div>" >> "$report_file"
    echo "            <p>${AUDIT_MAJOR_COUNT} major, ${AUDIT_MINOR_COUNT} minor, ${AUDIT_INFO_COUNT} info</p>" >> "$report_file"
    echo "        </div>" >> "$report_file"

    # Doctor summary
    local doctor_class="success"
    [[ $DOCTOR_ERRORS -gt 0 ]] && doctor_class="critical"
    [[ $DOCTOR_WARNINGS -gt 0 ]] && [[ $DOCTOR_ERRORS -eq 0 ]] && doctor_class="warning"

    echo "        <div class='card'>" >> "$report_file"
    echo "            <h2>Doctor Status</h2>" >> "$report_file"
    echo "            <div class='metric ${doctor_class}'>${DOCTOR_ERRORS} Errors</div>" >> "$report_file"
    echo "            <p>${DOCTOR_WARNINGS} warnings</p>" >> "$report_file"
    echo "        </div>" >> "$report_file"

    echo "    </div>" >> "$report_file"

    # Links to detailed reports
    echo "    <h2>Detailed Reports</h2>" >> "$report_file"
    echo "    <ul>" >> "$report_file"
    echo "        <li><a href='repo-audit-report.md'>Audit Report (Markdown)</a></li>" >> "$report_file"
    echo "        <li><a href='repo-audit-report.json'>Audit Report (JSON)</a></li>" >> "$report_file"
    echo "        <li><a href='repo-doctor-report.md'>Doctor Report (Markdown)</a></li>" >> "$report_file"
    echo "    </ul>" >> "$report_file"

    cat >> "$report_file" << 'EOF'
</body>
</html>
EOF

    log_success "Health report generated: ${report_file}"
    echo ""
    log_info "View with: open ${report_file}"
}

# ==============================================================================
# SECTION 8: CLI ROUTER
# ==============================================================================

show_help() {
    cat << 'EOF'
Usage: repo-control.sh <COMMAND> [OPTIONS]

COMMANDS:
  audit       Detect documentation contradictions (READ-ONLY)
  doctor      Diagnose repository health (git, auth, secrets) (READ-ONLY)
  hygiene     Clean repository structure (TRANSFORMATIVE)
  classify    Classify documentation + generate index (READ-ONLY)
  health      Combined audit + doctor HTML report (READ-ONLY)

AUDIT OPTIONS:
  --json              Export JSON report in addition to Markdown
  --verbose           Show detailed check output

DOCTOR OPTIONS:
  --verbose           Show detailed check output
  --no-report         Console output only (no report file)

HYGIENE OPTIONS:
  --dry-run           Show actions without executing
  --archive-to PATH   Archive destination (default: archive/YYYY-MM/claude)

CLASSIFY OPTIONS:
  <filename>              Classify a single file
  --generate-index        Generate documentation index (scan docs/)
  --search <query>        Search documentation index
  --validate              Validate documentation structure

GLOBAL OPTIONS:
  --output-dir PATH   Report output directory (default: scripts/reports)
  --no-color          Disable ANSI colors
  --help, -h          Show this help

EXAMPLES:
  # Full audit with JSON export
  ./scripts/repo-control.sh audit --json

  # Health diagnostic
  ./scripts/repo-control.sh doctor

  # Repository cleanup (dry-run first)
  ./scripts/repo-control.sh hygiene --dry-run
  ./scripts/repo-control.sh hygiene

  # Classify a document
  ./scripts/repo-control.sh classify "qonto-integration.md"

  # Generate documentation index
  ./scripts/repo-control.sh classify --generate-index

  # Search documentation
  ./scripts/repo-control.sh classify --search "sentry"

  # Combined health report
  ./scripts/repo-control.sh health

EOF
}

main() {
    ensure_reports_dir

    local command="${1:-}"
    shift || true

    case "$command" in
        audit) cmd_audit "$@" ;;
        doctor) cmd_doctor "$@" ;;
        hygiene) cmd_hygiene "$@" ;;
        classify) cmd_classify "$@" ;;
        health) cmd_health "$@" ;;
        --help|-h|help|"") show_help; exit 0 ;;
        *) log_error "Unknown command: $command"; show_help; exit 1 ;;
    esac
}

main "$@"
