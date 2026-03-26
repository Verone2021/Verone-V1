---
name: safe-refactoring
description: Workflow de refactoring sécurisé — diagnostiquer, modifier minimum, vérifier toujours. Empêche les régressions.
autoApply: true
---

# Refactoring sécurisé

## Règle d'or

> Diagnostiquer d'abord, modifier le minimum, vérifier toujours.

## Workflow obligatoire

### Étape 1 : Diagnostiquer

- Lire le fichier entier
- Identifier EXACTEMENT ce qui doit changer
- Lister les fonctions/composants exportés (contrat public)
- Identifier qui importe ce fichier : `Grep` pour le nom du module

### Étape 2 : Modifier le minimum

- Ne PAS réécrire un fichier entier si seules 5 lignes changent
- Garder les mêmes exports (noms, types, signatures)
- Si tu extrais des sous-composants : même nom de fichier principal, nouveaux fichiers pour les extractions
- Ne JAMAIS changer la logique métier pendant un refactoring de structure

### Étape 3 : Vérifier

Après CHAQUE fichier modifié :

```bash
pnpm eslint --max-warnings=0 <fichier>       # ESLint OK
pnpm --filter @verone/[package] type-check    # TypeScript OK
```

### Étape 4 : Tester visuellement

Si le fichier est un composant visible :

- Ouvrir la page avec Playwright MCP
- Vérifier que la page charge correctement
- Vérifier console : 0 erreurs

## Anti-patterns de refactoring

❌ Réécrire un fichier de 500 lignes d'un coup
❌ Changer les noms d'exports (casse les imports)
❌ Modifier la logique métier en même temps que la structure
❌ Ne pas vérifier ESLint/TypeScript avant de passer au fichier suivant
❌ Supposer que "ça compile donc ça marche" — tester visuellement
