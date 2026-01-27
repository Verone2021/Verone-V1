#!/bin/bash
# Script d'analyse des warnings async safety

echo "=== ANALYSE ASYNC SAFETY WARNINGS ==="
echo ""

# Total par type
echo "1. Distribution par type de warning:"
echo "   no-floating-promises: $(pnpm eslint "src/**/*.{ts,tsx}" --max-warnings=999999 2>&1 | grep "no-floating-promises" | wc -l | xargs)"
echo "   no-misused-promises: $(pnpm eslint "src/**/*.{ts,tsx}" --max-warnings=999999 2>&1 | grep "no-misused-promises" | wc -l | xargs)"
echo ""

# Top fichiers problématiques
echo "2. Top 10 fichiers avec le plus de warnings async:"
pnpm eslint "src/**/*.{ts,tsx}" --max-warnings=999999 2>&1 | \
  grep -E "^/Users.*\.tsx?$" | \
  while read file; do
    count=$(pnpm eslint "$file" --max-warnings=999999 2>&1 | grep -E "(no-floating-promises|no-misused-promises)" | wc -l | xargs)
    if [ "$count" -gt 0 ]; then
      echo "$count|$file"
    fi
  done | sort -rn -t'|' -k1 | head -10 | column -t -s'|'
echo ""

# Exemples de patterns par catégorie
echo "3. Patterns identifiés:"
echo ""
echo "   A) React Query invalidateQueries (non-awaited):"
pnpm eslint "src/**/*.{ts,tsx}" --max-warnings=999999 2>&1 | \
  grep -B 2 "invalidateQueries" | grep "no-floating-promises" | wc -l | xargs
echo ""
echo "   B) Event handlers (onClick, onSubmit, etc.):"
pnpm eslint "src/**/*.{ts,tsx}" --max-warnings=999999 2>&1 | \
  grep "no-misused-promises" | wc -l | xargs
echo ""

echo "=== FIN ANALYSE ==="
