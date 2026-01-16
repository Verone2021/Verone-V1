#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 📊 TOKEN COST CALCULATOR - VÉRONE BACK OFFICE
# ═══════════════════════════════════════════════════════════════════════════
# Script de calcul coûts tokens Claude Code en temps réel
# Usage: .claude/scripts/token-cost-calculator.sh [--today|--week|--month|--session]
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Couleurs pour output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Pricing Claude Sonnet 4.5 (2025) - par million de tokens
readonly PRICE_INPUT=3.00
readonly PRICE_OUTPUT=15.00
readonly PRICE_CACHE_READ=0.30
readonly PRICE_CACHE_WRITE=3.75

# Budgets configurables
readonly BUDGET_DAILY=5.00
readonly BUDGET_WEEKLY=30.00
readonly BUDGET_MONTHLY=100.00

# ═══════════════════════════════════════════════════════════════════════════
# FONCTIONS UTILITAIRES
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "═══════════════════════════════════════════════════════════════════"
    echo "  📊 CLAUDE CODE TOKEN DASHBOARD - VÉRONE PROFESSIONAL"
    echo "═══════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${PURPLE}${BOLD}▶ $1${NC}"
    echo -e "${PURPLE}─────────────────────────────────────────────────────────────────${NC}"
}

format_number() {
    local num=$1
    printf "%'d" "$num" 2>/dev/null || echo "$num"
}

format_cost() {
    local cost=$1
    printf "\$%.4f" "$cost"
}

calculate_cost() {
    local input_tokens=$1
    local output_tokens=$2
    local cache_creation=${3:-0}
    local cache_read=${4:-0}

    local input_cost=$(echo "scale=6; $input_tokens / 1000000 * $PRICE_INPUT" | bc)
    local output_cost=$(echo "scale=6; $output_tokens / 1000000 * $PRICE_OUTPUT" | bc)
    local cache_creation_cost=$(echo "scale=6; $cache_creation / 1000000 * $PRICE_CACHE_WRITE" | bc)
    local cache_read_cost=$(echo "scale=6; $cache_read / 1000000 * $PRICE_CACHE_READ" | bc)

    local total=$(echo "scale=6; $input_cost + $output_cost + $cache_creation_cost + $cache_read_cost" | bc)
    echo "$total"
}

get_budget_status() {
    local cost=$1
    local budget=$2
    local percentage=$(echo "scale=2; $cost / $budget * 100" | bc)

    if (( $(echo "$percentage >= 90" | bc -l) )); then
        echo -e "${RED}🔴 CRITIQUE${NC} (${percentage}%)"
    elif (( $(echo "$percentage >= 70" | bc -l) )); then
        echo -e "${YELLOW}🟡 ATTENTION${NC} (${percentage}%)"
    else
        echo -e "${GREEN}🟢 OK${NC} (${percentage}%)"
    fi
}

get_efficiency_score() {
    local input=$1
    local output=$2
    local cache_read=$3

    # Score basé sur ratio cache/total et output/input
    local total_input=$(echo "$input + $cache_read" | bc)
    if (( $(echo "$total_input > 0" | bc -l) )); then
        local cache_ratio=$(echo "scale=2; $cache_read / $total_input * 100" | bc)
    else
        local cache_ratio=0
    fi

    if (( $(echo "$input > 0" | bc -l) )); then
        local output_ratio=$(echo "scale=2; $output / $input" | bc)
    else
        local output_ratio=0
    fi

    # Score: cache élevé = bon, output/input raisonnable = bon
    local efficiency=50
    if (( $(echo "$cache_ratio >= 70" | bc -l) )); then
        efficiency=$((efficiency + 30))
    elif (( $(echo "$cache_ratio >= 50" | bc -l) )); then
        efficiency=$((efficiency + 20))
    elif (( $(echo "$cache_ratio >= 30" | bc -l) )); then
        efficiency=$((efficiency + 10))
    fi

    if (( $(echo "$output_ratio <= 2" | bc -l) )); then
        efficiency=$((efficiency + 20))
    elif (( $(echo "$output_ratio <= 3" | bc -l) )); then
        efficiency=$((efficiency + 10))
    fi

    echo "$efficiency"
}

# ═══════════════════════════════════════════════════════════════════════════
# RÉCUPÉRATION DONNÉES CCUSAGE
# ═══════════════════════════════════════════════════════════════════════════

get_daily_stats() {
    npx --yes ccusage@latest daily --json 2>/dev/null | head -1000
}

get_weekly_stats() {
    # Calcul depuis 7 jours
    local since_date=$(date -v-7d +%Y%m%d 2>/dev/null || date -d '7 days ago' +%Y%m%d)
    npx --yes ccusage@latest daily --since "$since_date" --json 2>/dev/null | head -1000
}

get_session_stats() {
    npx --yes ccusage@latest session --json 2>/dev/null | head -1000
}

# ═══════════════════════════════════════════════════════════════════════════
# AFFICHAGE RAPPORTS
# ═══════════════════════════════════════════════════════════════════════════

show_today_report() {
    print_section "📅 RAPPORT JOURNALIER - $(date +%Y-%m-%d)"

    local data=$(get_daily_stats)

    if [ -z "$data" ] || [ "$data" = "null" ]; then
        echo -e "${YELLOW}⚠ Aucune donnée disponible pour aujourd'hui${NC}"
        return
    fi

    # Parse JSON (extraction premier élément du tableau daily)
    local input_tokens=$(echo "$data" | grep -o '"inputTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local output_tokens=$(echo "$data" | grep -o '"outputTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local cache_creation=$(echo "$data" | grep -o '"cacheCreationTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local cache_read=$(echo "$data" | grep -o '"cacheReadTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local total_cost=$(echo "$data" | grep -o '"totalCost":[0-9.]*' | head -1 | cut -d':' -f2)

    # Valeurs par défaut si vides
    input_tokens=${input_tokens:-0}
    output_tokens=${output_tokens:-0}
    cache_creation=${cache_creation:-0}
    cache_read=${cache_read:-0}
    total_cost=${total_cost:-0}

    local total_tokens=$(echo "$input_tokens + $output_tokens + $cache_creation + $cache_read" | bc)

    # Calcul métriques
    local efficiency=$(get_efficiency_score "$input_tokens" "$output_tokens" "$cache_read")
    local budget_status=$(get_budget_status "$total_cost" "$BUDGET_DAILY")

    # Affichage
    echo -e "${WHITE}Tokens Consommés:${NC}"
    echo -e "  Input:          $(format_number $input_tokens) tokens"
    echo -e "  Output:         $(format_number $output_tokens) tokens"
    echo -e "  Cache Write:    $(format_number $cache_creation) tokens"
    echo -e "  Cache Read:     $(format_number $cache_read) tokens"
    echo -e "  ${BOLD}Total:          $(format_number $total_tokens) tokens${NC}"

    echo -e "\n${WHITE}Coûts:${NC}"
    echo -e "  Input:          $(format_cost $(echo "scale=6; $input_tokens / 1000000 * $PRICE_INPUT" | bc))"
    echo -e "  Output:         $(format_cost $(echo "scale=6; $output_tokens / 1000000 * $PRICE_OUTPUT" | bc))"
    echo -e "  Cache Write:    $(format_cost $(echo "scale=6; $cache_creation / 1000000 * $PRICE_CACHE_WRITE" | bc))"
    echo -e "  Cache Read:     $(format_cost $(echo "scale=6; $cache_read / 1000000 * $PRICE_CACHE_READ" | bc))"
    echo -e "  ${BOLD}Total:          \$${total_cost}${NC}"

    echo -e "\n${WHITE}Métriques:${NC}"
    echo -e "  Efficiency:     ${efficiency}%"
    echo -e "  Budget Daily:   ${budget_status} / $(format_cost $BUDGET_DAILY)"

    # Recommandations
    if (( $(echo "$total_cost >= $BUDGET_DAILY * 0.9" | bc -l) )); then
        echo -e "\n${RED}⚠ ALERTE: Budget journalier presque atteint!${NC}"
        echo -e "${YELLOW}💡 Conseil: Réduire sessions ou optimiser prompts${NC}"
    fi
}

show_week_report() {
    print_section "📊 RAPPORT HEBDOMADAIRE - Derniers 7 jours"

    local data=$(get_weekly_stats)

    if [ -z "$data" ] || [ "$data" = "null" ]; then
        echo -e "${YELLOW}⚠ Aucune donnée disponible${NC}"
        return
    fi

    # Agrégation des données (somme des daily)
    local total_input=0
    local total_output=0
    local total_cache_creation=0
    local total_cache_read=0
    local total_cost=0.0

    # Parse chaque ligne du JSON array
    while IFS= read -r line; do
        local input=$(echo "$line" | grep -o '"inputTokens":[0-9]*' | cut -d':' -f2)
        local output=$(echo "$line" | grep -o '"outputTokens":[0-9]*' | cut -d':' -f2)
        local cache_c=$(echo "$line" | grep -o '"cacheCreationTokens":[0-9]*' | cut -d':' -f2)
        local cache_r=$(echo "$line" | grep -o '"cacheReadTokens":[0-9]*' | cut -d':' -f2)
        local cost=$(echo "$line" | grep -o '"totalCost":[0-9.]*' | cut -d':' -f2)

        total_input=$((total_input + ${input:-0}))
        total_output=$((total_output + ${output:-0}))
        total_cache_creation=$((total_cache_creation + ${cache_c:-0}))
        total_cache_read=$((total_cache_read + ${cache_r:-0}))
        total_cost=$(echo "$total_cost + ${cost:-0}" | bc)
    done < <(echo "$data" | grep -o '{[^}]*}')

    local total_tokens=$(echo "$total_input + $total_output + $total_cache_creation + $total_cache_read" | bc)
    local daily_avg=$(echo "scale=4; $total_cost / 7" | bc)
    local budget_status=$(get_budget_status "$total_cost" "$BUDGET_WEEKLY")

    echo -e "${WHITE}Tokens Consommés (7 jours):${NC}"
    echo -e "  ${BOLD}Total:          $(format_number $total_tokens) tokens${NC}"
    echo -e "  Moyenne/jour:   $(format_number $((total_tokens / 7))) tokens"

    echo -e "\n${WHITE}Coûts (7 jours):${NC}"
    echo -e "  ${BOLD}Total:          \$${total_cost}${NC}"
    echo -e "  Moyenne/jour:   $(format_cost $daily_avg)"
    echo -e "  Budget Weekly:  ${budget_status} / $(format_cost $BUDGET_WEEKLY)"

    # Projection mensuelle
    local monthly_projection=$(echo "scale=2; $total_cost / 7 * 30" | bc)
    echo -e "\n${WHITE}Projection:${NC}"
    echo -e "  Mensuel:        $(format_cost $monthly_projection)"
    if (( $(echo "$monthly_projection > $BUDGET_MONTHLY" | bc -l) )); then
        echo -e "  ${RED}⚠ Dépassement budget mensuel projeté!${NC}"
    else
        echo -e "  ${GREEN}✅ Budget mensuel respecté${NC}"
    fi
}

show_session_report() {
    print_section "🎯 SESSIONS ACTIVES"

    local data=$(get_session_stats)

    if [ -z "$data" ] || [ "$data" = "null" ]; then
        echo -e "${YELLOW}⚠ Aucune session active détectée${NC}"
        return
    fi

    # Affichage top 5 sessions
    echo -e "${WHITE}Top 5 Sessions (par coût):${NC}\n"

    local count=0
    while IFS= read -r session && [ $count -lt 5 ]; do
        local session_id=$(echo "$session" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
        local cost=$(echo "$session" | grep -o '"totalCost":[0-9.]*' | cut -d':' -f2)
        local tokens=$(echo "$session" | grep -o '"totalTokens":[0-9]*' | cut -d':' -f2)

        if [ -n "$session_id" ]; then
            echo -e "  ${CYAN}Session:${NC} ${session_id:0:12}..."
            echo -e "  ${WHITE}Tokens:${NC}  $(format_number ${tokens:-0})"
            echo -e "  ${WHITE}Coût:${NC}    \$${cost:-0.0000}"
            echo ""
            count=$((count + 1))
        fi
    done < <(echo "$data" | grep -o '{[^}]*}')
}

show_quick_stats() {
    print_header

    local data=$(get_daily_stats)
    local total_cost=$(echo "$data" | grep -o '"totalCost":[0-9.]*' | head -1 | cut -d':' -f2)
    total_cost=${total_cost:-0}

    local input_tokens=$(echo "$data" | grep -o '"inputTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local output_tokens=$(echo "$data" | grep -o '"outputTokens":[0-9]*' | head -1 | cut -d':' -f2)
    input_tokens=${input_tokens:-0}
    output_tokens=${output_tokens:-0}

    echo -e "${BOLD}📊 Aujourd'hui:${NC}"
    echo -e "  Tokens: $(format_number $((input_tokens + output_tokens)))"
    echo -e "  Coût:   \$${total_cost}"
    echo -e "  Budget: $(get_budget_status "$total_cost" "$BUDGET_DAILY")"

    echo -e "\n${BOLD}🎯 Commandes Disponibles:${NC}"
    echo -e "  ${CYAN}claude-monitor${NC}              # Dashboard temps réel"
    echo -e "  ${CYAN}npx ccusage daily${NC}           # Rapport détaillé aujourd'hui"
    echo -e "  ${CYAN}npx ccusage blocks --live${NC}   # Monitoring live sessions"
    echo -e "  ${CYAN}/token-stats --today${NC}        # Ce script (aujourd'hui)"
    echo -e "  ${CYAN}/token-stats --week${NC}         # Ce script (hebdo)"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    local mode="${1:---today}"

    case "$mode" in
        --today)
            print_header
            show_today_report
            ;;
        --week)
            print_header
            show_week_report
            ;;
        --session)
            print_header
            show_session_report
            ;;
        --quick)
            show_quick_stats
            ;;
        --all)
            print_header
            show_today_report
            show_week_report
            show_session_report
            ;;
        --help|-h)
            print_header
            echo -e "${WHITE}Usage:${NC}"
            echo -e "  $0 [--today|--week|--session|--quick|--all]"
            echo ""
            echo -e "${WHITE}Options:${NC}"
            echo -e "  --today     Rapport journalier détaillé"
            echo -e "  --week      Rapport hebdomadaire (7 jours)"
            echo -e "  --session   Sessions actives"
            echo -e "  --quick     Résumé rapide"
            echo -e "  --all       Tous les rapports"
            ;;
        *)
            echo -e "${RED}Option invalide: $mode${NC}"
            echo -e "Utiliser --help pour voir les options disponibles"
            exit 1
            ;;
    esac

    echo ""
}

# Exécution
main "$@"
