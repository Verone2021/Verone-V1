#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# 📊 SESSION TOKEN REPORT - VÉRONE BACK OFFICE
# ═══════════════════════════════════════════════════════════════════════════
# Hook automatique fin de session Claude Code
# Génère rapport tokens/coûts et suggestions optimisation
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Couleurs
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPORTS_DIR="${SCRIPT_DIR}/../reports/tokens"
readonly SESSION_LOG="${REPORTS_DIR}/sessions.jsonl"

# Créer répertoire rapports si nécessaire
mkdir -p "$REPORTS_DIR"

# ═══════════════════════════════════════════════════════════════════════════
# FONCTIONS
# ═══════════════════════════════════════════════════════════════════════════

print_separator() {
    echo -e "${CYAN}─────────────────────────────────────────────────────────────────${NC}"
}

get_session_data() {
    # Récupère données session courante via ccusage
    npx --yes ccusage@latest session --json 2>/dev/null | head -1 || echo "{}"
}

get_daily_data() {
    # Récupère données journalières
    npx --yes ccusage@latest daily --json 2>/dev/null | head -1 || echo "{}"
}

generate_report() {
    local session_data="$1"
    local daily_data="$2"

    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  📊 RAPPORT FIN DE SESSION - $(date '+%Y-%m-%d %H:%M')${NC}"
    echo -e "${CYAN}${BOLD}═══════════════════════════════════════════════════════════════════${NC}\n"

    # Extract session stats
    local session_tokens=$(echo "$session_data" | grep -o '"totalTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local session_cost=$(echo "$session_data" | grep -o '"totalCost":[0-9.]*' | head -1 | cut -d':' -f2)

    # Extract daily stats
    local daily_tokens=$(echo "$daily_data" | grep -o '"totalTokens":[0-9]*' | head -1 | cut -d':' -f2)
    local daily_cost=$(echo "$daily_data" | grep -o '"totalCost":[0-9.]*' | head -1 | cut -d':' -f2)

    # Defaults
    session_tokens=${session_tokens:-0}
    session_cost=${session_cost:-0.0000}
    daily_tokens=${daily_tokens:-0}
    daily_cost=${daily_cost:-0.0000}

    echo -e "${WHITE}Session Courante:${NC}"
    echo -e "  Tokens:  $(printf "%'d" $session_tokens 2>/dev/null || echo $session_tokens)"
    echo -e "  Coût:    \$${session_cost}"

    print_separator

    echo -e "${WHITE}Aujourd'hui (Total):${NC}"
    echo -e "  Tokens:  $(printf "%'d" $daily_tokens 2>/dev/null || echo $daily_tokens)"
    echo -e "  Coût:    \$${daily_cost}"

    # Budget status
    local daily_budget=5.00
    if (( $(echo "$daily_cost >= $daily_budget * 0.9" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "  Status:  ${YELLOW}⚠ Budget journalier proche limite${NC}"
    else
        echo -e "  Status:  ${GREEN}✅ Budget OK${NC}"
    fi

    print_separator

    # Recommendations
    echo -e "\n${BLUE}${BOLD}💡 RECOMMANDATIONS:${NC}"

    if (( session_tokens > 10000 )); then
        echo -e "  ${YELLOW}▸${NC} Session longue détectée (${session_tokens} tokens)"
        echo -e "    ${WHITE}→${NC} Diviser en sessions plus courtes (<10k tokens)"
    fi

    if (( $(echo "$session_cost > 1.0" | bc -l 2>/dev/null || echo 0) )); then
        echo -e "  ${YELLOW}▸${NC} Coût session élevé (\$${session_cost})"
        echo -e "    ${WHITE}→${NC} Optimiser prompts et utiliser cache"
    fi

    echo -e "\n${CYAN}${BOLD}🎯 COMMANDES UTILES:${NC}"
    echo -e "  ${WHITE}claude-monitor${NC}              # Dashboard temps réel"
    echo -e "  ${WHITE}npx ccusage daily${NC}           # Rapport détaillé"
    echo -e "  ${WHITE}/token-stats --quick${NC}        # Résumé rapide"

    echo -e "\n${CYAN}${BOLD}═══════════════════════════════════════════════════════════════════${NC}\n"
}

log_session() {
    local session_data="$1"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Append to session log
    echo "{\"timestamp\":\"$timestamp\",\"data\":$session_data}" >> "$SESSION_LOG"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    # Récupération données
    local session_data=$(get_session_data)
    local daily_data=$(get_daily_data)

    # Génération rapport
    generate_report "$session_data" "$daily_data"

    # Logging session
    log_session "$session_data"

    # Export rapport journalier JSON
    local daily_report="${REPORTS_DIR}/daily-$(date +%Y-%m-%d).json"
    echo "$daily_data" > "$daily_report"
}

# Exécution silencieuse (pas d'erreur si outils manquants)
main 2>/dev/null || {
    echo -e "${YELLOW}⚠ Monitoring tokens non disponible (ccusage manquant?)${NC}" >&2
    echo -e "${CYAN}Installation: npx ccusage@latest${NC}" >&2
    exit 0
}
