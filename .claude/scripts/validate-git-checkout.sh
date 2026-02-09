#!/bin/bash
# Bloque git checkout non autorisé pour éviter changements de branche intempestifs

COMMAND="$TOOL_INPUT"

# Extraire la branche cible du checkout
if echo "$COMMAND" | grep -qE "git checkout -b"; then
  # Création de nouvelle branche - BLOQUER
  echo "❌ BLOQUÉ: Création de branche NON AUTORISÉE"
  echo ""
  echo "**Problème** : Les agents ne doivent PAS créer de branches sans autorisation"
  echo ""
  echo "**Solution** :"
  echo "1. Demander EXPLICITEMENT à l'utilisateur : 'Dois-je créer une nouvelle branche ?'"
  echo "2. Attendre confirmation AVANT de créer"
  echo ""
  echo "**Workflow correct** :"
  echo "Agent: 'Je vais créer la branche feat/XXX pour cette tâche. Confirmation ?'"
  echo "User: 'Oui vas-y'"
  echo "Agent: git checkout -b feat/XXX"
  exit 1
elif echo "$COMMAND" | grep -qE "git checkout [^-]"; then
  # Changement de branche existante
  TARGET_BRANCH=$(echo "$COMMAND" | sed -E 's/.*git checkout ([^ ]+).*/\1/')

  # Autoriser checkout main uniquement
  if [ "$TARGET_BRANCH" = "main" ]; then
    echo "✅ Checkout main autorisé"
    exit 0
  fi

  # Bloquer tout autre checkout
  echo "❌ BLOQUÉ: Changement de branche NON AUTORISÉ"
  echo ""
  echo "**Branche cible** : $TARGET_BRANCH"
  echo ""
  echo "**Problème** : Les agents ne doivent PAS changer de branche sans autorisation"
  echo "Cela cause des conflits quand plusieurs agents travaillent en parallèle"
  echo ""
  echo "**Solution** :"
  echo "1. Rester sur la branche actuelle"
  echo "2. Si changement nécessaire : Demander EXPLICITEMENT à l'utilisateur"
  echo ""
  echo "**Note** : Seul checkout main est autorisé automatiquement"
  exit 1
fi

exit 0
