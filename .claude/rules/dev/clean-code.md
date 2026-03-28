# Clean Code (OBLIGATOIRE)

## CRITICAL : Limite de taille des fichiers

Tout fichier depassant **400 lignes** doit etre refactorise avant d'etre considere comme termine.

### Regles

- Fichier > 400 lignes → STOP, decomposer en sous-composants/modules
- Fonction > 75 lignes → extraire en fonctions plus petites
- Composant React > 200 lignes → extraire en sous-composants

### Pattern de decomposition

```
// AVANT : MonGrosComposant.tsx (600 lignes)
// APRES :
MonComposant/
├── index.tsx          (50 lignes — orchestration)
├── MonComposantHeader.tsx
├── MonComposantContent.tsx
├── MonComposantActions.tsx
├── hooks.ts           (logique metier)
└── types.ts           (types locaux)
```

### Verification

Apres chaque modification de composant UI :
1. Verifier le nombre de lignes du fichier
2. Si > 400 lignes → refactoriser immediatement
3. Type-check apres refactoring
4. Verification visuelle Playwright si composant UI
