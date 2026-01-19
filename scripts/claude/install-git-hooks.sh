#!/bin/bash

# Script d'installation des Git hooks pour workflow professionnel
# Basé sur enforce-professional-workflow-2026.md et CLAUDE.md v9.0.0

set -e

echo "🔧 Installation des Git hooks pour Verone Back Office..."
echo ""

# Hook pre-push (warning commits fréquents)
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Hook pre-push - Rappeler best practices commits fréquents
# Basé sur CLAUDE.md v9.0.0 et enforce-professional-workflow-2026.md

# Vérifier qu'on n'essaie pas de push sans commits récents
LAST_COMMIT_TIME=$(git log -1 --format=%ct 2>/dev/null || echo "0")
CURRENT_TIME=$(date +%s)
TIME_DIFF=$((CURRENT_TIME - LAST_COMMIT_TIME))

# Si dernier commit > 30 min, warning (1800 secondes)
if [ "$TIME_DIFF" -gt 1800 ] && [ "$LAST_COMMIT_TIME" != "0" ]; then
  echo ""
  echo "⚠️  WARNING: Dernier commit il y a plus de 30 minutes"
  echo "💡 Best practice: Commits fréquents toutes les 10-20 min"
  echo "📦 Considérer faire un commit intermédiaire avant de push"
  echo ""
  echo "   Dernier commit il y a: $((TIME_DIFF / 60)) minutes"
  echo ""
  # Ne pas bloquer, juste avertir
fi

# Compter nombre de commits dans ce push
COMMITS_TO_PUSH=$(git log @{u}.. --oneline 2>/dev/null | wc -l | tr -d ' ')

if [ "$COMMITS_TO_PUSH" -gt 10 ]; then
  echo ""
  echo "⚠️  WARNING: Vous pushez $COMMITS_TO_PUSH commits d'un coup"
  echo "💡 Best practice: Push fréquents (après chaque commit ou tous les 2-3 commits)"
  echo "📦 Cela garantit backup continu et CI checks réguliers"
  echo ""
fi

# Toujours autoriser le push
exit 0
EOF

chmod +x .git/hooks/pre-push
echo "✅ Hook pre-push installé"

# Vérifier que pre-commit existe déjà
if [ -f .git/hooks/pre-commit ]; then
  echo "✅ Hook pre-commit déjà présent"
else
  echo "⚠️  Hook pre-commit non trouvé (devrait exister)"
fi

echo ""
echo "🎉 Git hooks installés avec succès!"
echo ""
echo "Les hooks suivants sont maintenant actifs:"
echo "  - pre-push: Rappel commits fréquents (10-20 min)"
echo "  - pre-commit: Validation env changes (déjà existant)"
echo ""
echo "📚 Pour plus d'infos:"
echo "  - .claude/plans/enforce-professional-workflow-2026.md"
echo "  - CLAUDE.md v9.0.0"
echo ""
