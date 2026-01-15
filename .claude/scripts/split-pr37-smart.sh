#!/bin/bash
# Script intelligent pour découper PR #37 en 3-4 GROSSES PRs
# Avec résolution automatique des conflits sur ACTIVE.md, package.json, CLAUDE.md

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Configuration
BASE_BRANCH="main"
SOURCE_BRANCH="fix/multi-bugs-2026-01"
AUTO_RESOLVE_SCRIPT=".claude/scripts/auto-resolve-conflicts.sh"

# Fonction pour cherry-pick intelligent avec auto-résolution
smart_cherry_pick() {
    local commits=("$@")
    local success_count=0
    local conflict_count=0

    for commit in "${commits[@]}"; do
        log_info "Cherry-pick $commit..."

        if git cherry-pick "$commit" 2>/dev/null; then
            log_success "✓ $commit OK"
            ((success_count++))
        else
            log_warning "Conflit sur $commit - résolution automatique..."

            # Tenter résolution automatique
            if bash "$AUTO_RESOLVE_SCRIPT"; then
                # Ajouter les fichiers résolus
                git add -u

                # Continuer le cherry-pick
                if git cherry-pick --continue; then
                    log_success "✓ $commit OK (après résolution auto)"
                    ((success_count++))
                else
                    log_error "Échec résolution automatique sur $commit"
                    log_info "Résolution manuelle requise. Commandes :"
                    echo "  1. Résolvez les conflits manuellement"
                    echo "  2. git add <fichiers>"
                    echo "  3. git cherry-pick --continue"
                    echo "  4. Relancez ce script avec --continue"
                    exit 1
                fi
            else
                log_error "Échec résolution automatique"
                exit 1
            fi
            ((conflict_count++))
        fi
    done

    log_success "$success_count/$((success_count + conflict_count)) commits appliqués (${conflict_count} conflits résolus auto)"
}

# Fonction pour tester la branche
test_branch() {
    local branch_name=$1

    log_info "Tests de la branche $branch_name..."

    # Type-check
    log_info "Type-check..."
    if npm run type-check 2>&1 | tee /tmp/type-check.log; then
        log_success "✓ Type-check OK"
    else
        log_error "Type-check échoué - voir /tmp/type-check.log"
        return 1
    fi

    # Build (seulement si type-check OK)
    log_info "Build..."
    if npm run build 2>&1 | tee /tmp/build.log; then
        log_success "✓ Build OK"
    else
        log_error "Build échoué - voir /tmp/build.log"
        return 1
    fi

    log_success "Tous les tests passent ✓"
    return 0
}

# Fonction pour créer et pousser une PR
create_and_push_pr() {
    local branch_name=$1
    local pr_title=$2
    local pr_body=$3

    log_info "Push de la branche $branch_name..."
    if git push origin "$branch_name"; then
        log_success "✓ Branche poussée"
    else
        log_error "Échec du push"
        return 1
    fi

    log_info "Création de la PR..."
    if gh pr create \
        --base "$BASE_BRANCH" \
        --head "$branch_name" \
        --title "$pr_title" \
        --body "$pr_body"; then
        log_success "✓ PR créée"
    else
        log_error "Échec création PR"
        return 1
    fi
}

# === GROSSE PR #1 : Infrastructure & Backend ===
create_pr1_infrastructure() {
    log_info "=========================================="
    log_info "GROSSE PR #1: Infrastructure & Backend"
    log_info "=========================================="

    local branch_name="feat/infrastructure-backend-batch"

    git checkout "$BASE_BRANCH"
    git pull origin "$BASE_BRANCH"
    git checkout -b "$branch_name"

    # Commits BO-WORK (5), BO-FORM (8), BO-SENTRY (1), Sentry fixes (4)
    # Total: ~18 commits
    local commits=(
        # BO-WORK-001 à 005 (Infrastructure)
        "738dcc67" "df2bbf09" "ff74fdaa" "d695ad88" "b447c5ef" "9afe8fb2"

        # BO-SENTRY-001 + NO-TASK sentry
        "0368aeca" "eb313d50" "6a167e22" "8184e314" "125f3ee8"

        # BO-FORM-001 (Form submission system)
        "84b9216b" "0a18fcba" "d9d4c604" "655cf546"
        "a5be00fe" "4d8d64a6" "c1f00f4a" "cc9f6930"

        # NO-TASK fixes infrastructure
        "cf890814" "58363dd0"
    )

    smart_cherry_pick "${commits[@]}"

    if test_branch "$branch_name"; then
        create_and_push_pr "$branch_name" \
            "feat: infrastructure, backend & monitoring improvements" \
            "## Summary

Batch regroupant améliorations infrastructure, backend et monitoring :

### Infrastructure & Workflow (BO-WORK-001 à 005)
- Mise en place workflow Claude Code avec ACTIVE.md
- Task ID enforcement
- Hooks de validation
- Handoff READ→WRITE
- Multi-agent workflow

### Monitoring (BO-SENTRY-001)
- Setup Sentry complet avec Replay & Feedback
- Migration Next.js 15 instrumentation
- Configuration organisation verone-4q
- Navigation tracking

### Forms System (BO-FORM-001)
- Système extensible de soumission formulaires
- Intégration Resend (emails)
- Back-office UI pour submissions
- Conversion server actions
- Configuration emails optionnelle

### Fixes
- Stabilité multi-app
- Scripts dev:stop et dev:clean

## Task IDs
BO-WORK-001 à 005, BO-FORM-001, BO-SENTRY-001 + NO-TASK fixes

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify workflow hooks work
- [ ] Test form submissions
- [ ] Verify Sentry captures errors

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
    else
        log_error "Tests échoués sur $branch_name"
        return 1
    fi
}

# === GROSSE PR #2 : LinkMe Features ===
create_pr2_linkme_features() {
    log_info "=========================================="
    log_info "GROSSE PR #2: LinkMe Features Batch"
    log_info "=========================================="

    local branch_name="feat/linkme-features-batch"

    git checkout "$BASE_BRANCH"
    git pull origin "$BASE_BRANCH"
    git checkout -b "$branch_name"

    # Commits LM-ORG (3), LM-SEL (3), LM-ADDR (3), LM-ORD (11)
    # Total: ~20 commits
    local commits=(
        # LM-ORG-001 à 003 (Organisations)
        "e3930d65" "7a48a74d" "8a44b70f"

        # LM-SEL-001, 003 (Sélections publiques)
        "ae83cc67" "8e482ddb" "abaae16a"

        # LM-ADDR-001 (Géolocalisation)
        "3d7cdbc6" "2e6fe258" "45da14be"

        # LM-ORD-004, 005, 006, 007 (Orders workflow)
        "53b5809c" "880af835" "9329ba7e"
        "8ef01629" "67b776e7" "55225ab2"
        "59b9d2c9" "df39f4a8"
        "363d8ac7" "e8463feb"
    )

    smart_cherry_pick "${commits[@]}"

    if test_branch "$branch_name"; then
        create_and_push_pr "$branch_name" \
            "feat(linkme): organisations, selections & orders improvements" \
            "## Summary

Batch regroupant améliorations LinkMe organisations, sélections et commandes :

### Organisations (LM-ORG-001 à 003)
- Migration /reseau → /organisations
- Restauration features map
- Amélioration popup design

### Sélections Publiques (LM-SEL-001, 003)
- Pagination et navigation par onglets
- Barre catégories + dropdown
- Optimisation UX

### Géolocalisation (LM-ADDR-001)
- AddressAutocomplete avec géolocalisation
- Intégration CreateOrderModal
- Intégration OrderFormUnified

### Orders Workflow (LM-ORD-004 à 007)
- Auto-fill données contacts
- Cache localStorage requester
- Workflow complet avec labels conditionnels
- Auto-création contacts CRM
- Refonte UX sélection produits (2 colonnes)
- Fix owner_type constraint (succursale)
- Fix RLS anonymous order creation

## Task IDs
LM-ORG-001/002/003, LM-SEL-001/003, LM-ADDR-001, LM-ORD-004/005/006/007

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Test organisations map view
- [ ] Test public selections pagination
- [ ] Test order workflow with address autocomplete
- [ ] Test order creation as anonymous

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
    else
        log_error "Tests échoués sur $branch_name"
        return 1
    fi
}

# === GROSSE PR #3 : Fixes & Dashboard ===
create_pr3_fixes_dashboard() {
    log_info "=========================================="
    log_info "GROSSE PR #3: Fixes & Dashboard Batch"
    log_info "=========================================="

    local branch_name="feat/fixes-dashboard-batch"

    git checkout "$BASE_BRANCH"
    git pull origin "$BASE_BRANCH"
    git checkout -b "$branch_name"

    # Commits LM-AUTH (1), WEB-DEV (1), Dashboard (~15)
    # Total: ~17 commits
    local commits=(
        # LM-AUTH-001 (Fix critique)
        "20658534"

        # WEB-DEV-001 (Fix symlinks)
        "25f97a3d"

        # Dashboard improvements (sélection des principaux)
        "af615d90" "eeab3cf2" "55bf8878" "11071703"
        "81bb5e70" "d33c6c8c" "3f7b7b79" "3326652a"
        "c10ad941" "c2cb04a8" "dd99b005" "8671f359"
        "631db0de" "f370534e" "a6abfccd" "2e210996"
        "62b421b7"
    )

    smart_cherry_pick "${commits[@]}"

    if test_branch "$branch_name"; then
        create_and_push_pr "$branch_name" \
            "fix: critical fixes & dashboard improvements batch" \
            "## Summary

Batch regroupant fixes critiques et améliorations dashboard :

### Fixes Critiques
- **LM-AUTH-001**: Fix infinite loading LinkMe dashboard (StrictMode)
- **WEB-DEV-001**: Fix Next.js symlinks site-internet

### Dashboard Improvements
- GPS coordinates pour organisations
- Migration MapLibre GL
- KPIs connectés données réelles
- OrganisationDetailSheet
- Layout 6 colonnes
- Dashboard V2 avec widgets
- Charts Recharts
- Fix 10+ bugs dashboard
- Amélioration contacts display
- Quick edit modals
- Notifications system

## Task IDs
LM-AUTH-001, WEB-DEV-001 + Dashboard improvements

## Test plan
- [x] Type-check passes
- [x] Build succeeds
- [ ] Verify LinkMe dashboard loads without spinner
- [ ] Test site-internet build
- [ ] Verify dashboard displays all KPIs
- [ ] Test map with GPS coordinates

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
    else
        log_error "Tests échoués sur $branch_name"
        return 1
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "============================================"
    echo "  Découpage Smart PR #37 en 3 GROSSES PRs"
    echo "============================================"
    echo ""
    echo "Avec résolution automatique des conflits sur :"
    echo "  - .claude/work/ACTIVE.md (59 modifs)"
    echo "  - package.json (40 modifs)"
    echo "  - CLAUDE.md (53 modifs)"
    echo ""
    echo "Sélectionnez une PR à créer :"
    echo ""
    echo "  1) PR #1: Infrastructure & Backend (~18 commits, 30 min)"
    echo "  2) PR #2: LinkMe Features (~20 commits, 40 min)"
    echo "  3) PR #3: Fixes & Dashboard (~17 commits, 30 min)"
    echo ""
    echo "  0) Créer LES 3 PRs d'un coup (2-3h)"
    echo "  q) Quitter"
    echo ""
    echo -n "Votre choix: "
}

# Main
main() {
    # Vérifier que le script de résolution existe
    if [ ! -f "$AUTO_RESOLVE_SCRIPT" ]; then
        log_error "Script de résolution automatique introuvable : $AUTO_RESOLVE_SCRIPT"
        exit 1
    fi

    chmod +x "$AUTO_RESOLVE_SCRIPT"

    # Vérifier prérequis
    log_info "Vérification des prérequis..."

    if ! git diff-index --quiet HEAD --; then
        log_error "Modifications non commitées détectées. Commitez ou stash d'abord."
        exit 1
    fi

    git fetch origin
    log_success "Prérequis OK"
    echo ""

    if [ $# -eq 0 ]; then
        # Mode interactif
        while true; do
            show_menu
            read choice

            case $choice in
                1) create_pr1_infrastructure && break ;;
                2) create_pr2_linkme_features && break ;;
                3) create_pr3_fixes_dashboard && break ;;
                0)
                    log_warning "Création de TOUTES les PRs (2-3h)..."
                    log_info "Appuyez sur Ctrl+C pour annuler, ou Entrée pour continuer"
                    read
                    create_pr1_infrastructure
                    create_pr2_linkme_features
                    create_pr3_fixes_dashboard

                    log_success ""
                    log_success "=========================================="
                    log_success "✅ LES 3 PRs ONT ÉTÉ CRÉÉES AVEC SUCCÈS !"
                    log_success "=========================================="
                    log_info ""
                    log_info "Prochaines étapes :"
                    log_info "1. Vérifier les PRs sur GitHub"
                    log_info "2. Attendre que les checks CI/CD passent"
                    log_info "3. Merger dans l'ordre : PR#1 → PR#2 → PR#3"
                    log_info "4. Fermer PR #37"
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
            1) create_pr1_infrastructure ;;
            2) create_pr2_linkme_features ;;
            3) create_pr3_fixes_dashboard ;;
            all)
                create_pr1_infrastructure
                create_pr2_linkme_features
                create_pr3_fixes_dashboard
                ;;
            *)
                log_error "Argument invalide: $1"
                log_info "Usage: $0 [1|2|3|all]"
                exit 1
                ;;
        esac
    fi
}

main "$@"
