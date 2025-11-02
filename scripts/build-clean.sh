#!/bin/bash
# Script de build propre sans warnings informatifs
# Filtre le message Edge Runtime qui est informatif et non-bloquant

# Exécuter le build Next.js et filtrer les warnings informatifs
npx next build 2>&1 | grep -v "Using edge runtime on a page currently disables static generation"

# Retourner le code de sortie du build
exit ${PIPESTATUS[0]}
