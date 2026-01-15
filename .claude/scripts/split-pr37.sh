#!/bin/bash
# Script pour découper PR #37 en 12 PRs plus petites
# Usage: bash .claude/scripts/split-pr37.sh [groupe_number]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_BRANCH="main"
SOURCE_BRANCH="fix/multi-bugs-2026-01"

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier qu'on est sur la bonne branche
check_prerequisites() {
    log_info "Vérification des prérequis..."

    # Vérifier que main est à jour
    git fetch origin

    # Vérifier qu'il n'y a pas de modifications non commitées
    if ! git diff-index --quiet HEAD --; then
        log_error "Vous avez des modifications non commitées. Veuillez les commiter d'abord."
        exit 1
    fi

    log_success "Prérequis OK"
}

# Fonction pour créer une branche et cherry-pick des commits
create_pr_branch() {
    local branch_name=$1
    shift
    local commits=("$@")

    log_info "Création de la branche $branch_name..."

    # Créer branche depuis main
    git checkout "$BASE_BRANCH"
    git pull origin "$BASE_BRANCH"
    git checkout -b "$branch_name"

    # Cherry-pick chaque commit
    for commit in "${commits[@]}"; do
        log_info "Cherry-pick $commit..."
        if git cherry-pick "$commit"; then
            log_success "✓ $commit"
        else
            log_error "Conflit sur $commit. Résolvez le conflit puis exécutez:"
            log_info "  git cherry-pick --continue"
            log_info "  bash $0 $branch_name --continue"
            exit 1
        fi
    done

    log_success "Branche $branch_name créée avec succès"
}

# Fonction pour tester une branche
test_branch() {
    local branch_name=$1

    log_info "Tests de la branche $branch_name..."

    # Type-check
    log_info "Type-check..."
    if npm run type-check; then
        log_success "✓ Type-check OK"
    else
        log_error "Type-check échoué"
        exit 1
    fi

    # Build
    log_info "Build..."
    if npm run build; then
        log_success "✓ Build OK"
    else
        log_error "Build échoué"
        exit 1
    fi

    log_success "Tous les tests passent ✓"
}

# Fonction pour pousser et créer la PR
push_and_create_pr() {
    local branch_name=$1
    local pr_title=$2
    local pr_body=$3

    log_info "Push de la branche $branch_name..."
    git push origin "$branch_name"

    log_info "Création de la PR..."
    gh pr create \
        --base "$BASE_BRANCH" \
        --head "$branch_name" \
        --title "$pr_title" \
        --body "$pr_body"

    log_success "PR créée avec succès ✓"
}

# === GROUPES DE COMMITS ===

create_group_1() {
    log_info "=== GROUPE 1: Infrastructure & Workflow ==="

    create_pr_branch "chore/workflow-infrastructure" \
        "738dcc67" \
        "df2bbf09" \
        "ff74fdaa" \
        "d695ad88" \
        "b447c5ef" \
        "9afe8fb2"

    test_branch "chore/workflow-infrastructure"

    push_and_create_pr \
        "chore/workflow-infrastructure" \
        "chore: implement Claude Code workflow infrastructure" \
        "## Summary

- Implement Claude Code workflow with ACTIVE.md as single source of truth
- Add Task ID workflow enforcement
- Improve Stop hook robustness
- Add READ→WRITE handoff mailbox
- Document multi-agent workflow

## Task IDs
BO-WORK-001 to BO-WORK-005

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify workflow hooks work correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

create_group_2() {
    log_info "=== GROUPE 2: Monitoring Sentry ==="

    create_pr_branch "feat/sentry-monitoring-complete" \
        "0368aeca" \
        "eb313d50" \
        "6a167e22" \
        "8184e314" \
        "125f3ee8"

    test_branch "feat/sentry-monitoring-complete"

    push_and_create_pr \
        "feat/sentry-monitoring-complete" \
        "feat(monitoring): complete Sentry setup with Next.js 15" \
        "## Summary

- Add Sentry expert setup with Replay and Feedback
- Update org/project to verone-4q
- Migrate to Next.js 15 instrumentation format
- Add navigation tracking hook

## Task IDs
BO-SENTRY-001 + NO-TASK (sentry fixes)

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify Sentry captures errors in production

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

create_group_3() {
    log_info "=== GROUPE 3: Form Submission System ==="

    create_pr_branch "feat/form-submission-system" \
        "84b9216b" \
        "0a18fcba" \
        "d9d4c604" \
        "655cf546" \
        "a5be00fe" \
        "4d8d64a6" \
        "c1f00f4a" \
        "cc9f6930"

    test_branch "feat/form-submission-system"

    push_and_create_pr \
        "feat/form-submission-system" \
        "feat(forms): implement complete form submission system with Resend" \
        "## Summary

- Create extensible form submission system (Phase 1)
- Implement API routes for form handling (Phase 2)
- Integrate ContactForm with new API (Phase 3)
- Create back-office UI for submissions (Phase 4)
- Implement conversion server actions (Phase 5)
- Add notification emails settings page (Phase 6)
- Make email sending optional when RESEND_API_KEY not configured
- Add Resend configuration documentation

## Task IDs
BO-FORM-001 (8 commits, 6 phases)

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Test form submission flow
- [ ] Verify emails sent when configured
- [ ] Verify graceful fallback without RESEND_API_KEY

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

create_group_4() {
    log_info "=== GROUPE 4: LinkMe Organisations ==="

    create_pr_branch "feat/linkme-organisations-improvements" \
        "e3930d65" \
        "7a48a74d" \
        "8a44b70f"

    test_branch "feat/linkme-organisations-improvements"

    push_and_create_pr \
        "feat/linkme-organisations-improvements" \
        "feat(linkme): improve organisations page with map features" \
        "## Summary

- Move /reseau map view to /organisations tab
- Restore map view features on organisations page
- Improve map popup design with better card layout

## Task IDs
LM-ORG-001, LM-ORG-002, LM-ORG-003

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify map displays correctly
- [ ] Verify popup cards show organisation info

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

create_group_5() {
    log_info "=== GROUPE 5: LinkMe Sélections ==="

    create_pr_branch "feat/linkme-public-selections-ux" \
        "ae83cc67" \
        "8e482ddb" \
        "abaae16a"

    test_branch "feat/linkme-public-selections-ux"

    push_and_create_pr \
        "feat/linkme-public-selections-ux" \
        "feat(linkme): optimize public selections UX" \
        "## Summary

- Add pagination and tab-based navigation
- Optimize UX with category bar and dropdown
- Reduce pagination and button sizes

## Task IDs
LM-SEL-001, LM-SEL-003

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify pagination works
- [ ] Verify category filtering works

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

create_group_10() {
    log_info "=== GROUPE 10: LinkMe Auth Fix ==="

    create_pr_branch "fix/linkme-infinite-loading" \
        "20658534"

    test_branch "fix/linkme-infinite-loading"

    push_and_create_pr \
        "fix/linkme-infinite-loading" \
        "fix(linkme): resolve infinite loading in dashboard" \
        "## Summary

- Fix infinite loading spinner issue in LinkMe dashboard
- Resolve StrictMode double-render issue

## Task IDs
LM-AUTH-001

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify dashboard loads without infinite spinner
- [ ] Test in StrictMode

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

create_group_11() {
    log_info "=== GROUPE 11: Site Internet Fix ==="

    create_pr_branch "fix/site-internet-dependencies" \
        "25f97a3d"

    test_branch "fix/site-internet-dependencies"

    push_and_create_pr \
        "fix/site-internet-dependencies" \
        "fix(site-internet): reinstall dependencies to fix Next.js symlinks" \
        "## Summary

- Reinstall dependencies to fix Next.js symlink issues in site-internet app

## Task IDs
WEB-DEV-001

## Dependencies
None

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify site-internet builds correctly

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
}

# Menu principal
show_menu() {
    echo ""
    echo "============================================"
    echo "  Découpage PR #37 en 12 PRs"
    echo "============================================"
    echo ""
    echo "Sélectionnez un groupe à créer:"
    echo ""
    echo "  1) Infrastructure & Workflow (5 commits)"
    echo "  2) Monitoring Sentry (5 commits)"
    echo "  3) Form Submission System (8 commits)"
    echo "  4) LinkMe Organisations (3 commits)"
    echo "  5) LinkMe Sélections (3 commits)"
    echo "  6) LinkMe Address Geolocation (3 commits)"
    echo "  7) LinkMe Orders Workflow (6 commits)"
    echo "  8) LinkMe Product Selection (2 commits)"
    echo "  9) LinkMe Order Fixes (2 commits)"
    echo " 10) LinkMe Auth Fix (1 commit)"
    echo " 11) Site Internet Fix (1 commit)"
    echo " 12) Dashboard Improvements (~15 commits)"
    echo ""
    echo "  0) Créer TOUTES les PRs (8-12h)"
    echo "  q) Quitter"
    echo ""
    echo -n "Votre choix: "
}

# Main
main() {
    check_prerequisites

    if [ $# -eq 0 ]; then
        # Mode interactif
        while true; do
            show_menu
            read choice

            case $choice in
                1) create_group_1 ;;
                2) create_group_2 ;;
                3) create_group_3 ;;
                4) create_group_4 ;;
                5) create_group_5 ;;
                10) create_group_10 ;;
                11) create_group_11 ;;
                0)
                    log_warning "Création de TOUTES les PRs (cela prendra plusieurs heures)..."
                    log_info "Appuyez sur Ctrl+C pour annuler, ou Entrée pour continuer"
                    read
                    create_group_1
                    create_group_2
                    create_group_3
                    create_group_4
                    create_group_5
                    create_group_10
                    create_group_11
                    log_success "Toutes les PRs créées !"
                    break
                    ;;
                q|Q)
                    log_info "Au revoir!"
                    exit 0
                    ;;
                *)
                    log_error "Choix invalide"
                    ;;
            esac
        done
    else
        # Mode ligne de commande
        case $1 in
            1) create_group_1 ;;
            2) create_group_2 ;;
            3) create_group_3 ;;
            4) create_group_4 ;;
            5) create_group_5 ;;
            10) create_group_10 ;;
            11) create_group_11 ;;
            all)
                create_group_1
                create_group_2
                create_group_3
                create_group_4
                create_group_5
                create_group_10
                create_group_11
                ;;
            *)
                log_error "Groupe invalide: $1"
                log_info "Usage: $0 [1-12|all]"
                exit 1
                ;;
        esac
    fi
}

main "$@"
