#!/bin/bash
# Analyser les erreurs async par fichier dans LinkMe

cd "$(dirname "$0")/.."

echo "Analyzing async errors per file..."
echo "===================================="
echo ""

# Pour chaque fichier unique avec erreurs
cat /tmp/linkme-files-with-errors.txt | while read file; do
  if [ -f "$file" ]; then
    # Compter erreurs async dans ce fichier
    error_count=$(pnpm --filter @verone/linkme lint "$file" 2>&1 | grep -c "error.*@typescript-eslint/no-\(floating-promises\|misused-promises\)" || echo "0")

    if [ "$error_count" != "0" ]; then
      echo "$error_count errors - $file"
    fi
  fi
done | sort -rn | head -30
