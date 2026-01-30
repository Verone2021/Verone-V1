#!/bin/bash
# Statusline statique léger (< 10ms)
# Évite memory leak ccusage

# Calculs système natifs macOS
CPU=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
RAM=$(vm_stat | perl -ne '/Pages active.*?(\d+)/ and $a=$1; /page size of (\d+)/ and printf "%.1f", $a * $2 / 1073741824; END{print}')

# Affichage compact
echo "⚡ Claude | CPU: ${CPU}% | RAM: ${RAM}GB/16GB"
