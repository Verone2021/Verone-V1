#!/bin/bash
# Compter warnings pour tous les fichiers modifiés et update baseline

BASELINE=".eslint-baseline.json"
TMP=$(mktemp)

# Copier baseline existante
cp "$BASELINE" "$TMP"

# Pour chaque fichier modifié
git diff --name-only --cached | while read -r file; do
  if [ -f "$file" ] && [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]]; then
    # Compter warnings actuels
    COUNT=$(pnpm eslint "$file" --format json 2>/dev/null | jq '[.[] | .warningCount] | add // 0' 2>/dev/null || echo "0")
    echo "📊 $file: $COUNT warnings"
    
    # Update baseline
    FULL_PATH="$(pwd)/$file"
    jq ".[\"$FULL_PATH\"] = $COUNT" "$TMP" > "$TMP.new" && mv "$TMP.new" "$TMP"
  fi
done

# Remplacer baseline
mv "$TMP" "$BASELINE"
echo "✅ Baseline updated"
