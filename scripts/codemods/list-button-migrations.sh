#!/bin/bash

# Liste tous les fichiers utilisant les anciens composants Button
# Pour migration manuelle vers ButtonUnified

echo "=== Fichiers utilisant ActionButton ==="
grep -r "import.*ActionButton" src/ --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq | wc -l
echo "fichiers trouvés"
echo ""

echo "=== Fichiers utilisant ModernActionButton ==="
grep -r "import.*ModernActionButton" src/ --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq | wc -l
echo "fichiers trouvés"
echo ""

echo "=== Fichiers utilisant StandardModifyButton ==="
grep -r "import.*StandardModifyButton" src/ --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq | wc -l
echo "fichiers trouvés"
echo ""

echo "=== Fichiers utilisant ButtonV2 ==="
grep -r "import.*ButtonV2" src/ --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq | wc -l
echo "fichiers trouvés"
echo ""

echo "=== TOTAL estimation ==="
echo "~62 fichiers à migrer (selon rapport audit)"
