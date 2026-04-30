# Theme : Vérone

**Slug technique** : `verone`
**Label humain** : Vérone
**Statut** : placeholder — tokens à définir dans BO-DS-002

## Quand ces tokens seront remplis

1. Romeo génère les brand guidelines + palette sur claude.ai web
2. Claude.ai retourne un fichier `tokens.ts` avec l'objet `veroneTokens`
3. Romeo copie/intègre le contenu dans ce dossier
4. PR BO-DS-002 pour valider et pusher

## Structure attendue (interface `BrandTokens`)

```ts
export const veroneTokens: BrandTokens = {
  colors: {
    primary: '#...',
    primaryForeground: '#...',
    // ... voir packages/@verone/themes/src/types.ts
  },
  typography: {
    fontHeading: '"...", serif',
    fontBody: '"...", sans-serif',
    fontMono: '"...", monospace',
  },
  shadows: { sm: '...', md: '...', lg: '...' },
  radius: { sm: '4px', md: '8px', lg: '12px', full: '9999px' },
};
```

## Variables CSS injectées par ThemeProvider

Quand `brand="verone"`, les variables suivantes sont injectées :
`--color-primary`, `--color-secondary`, `--color-accent`, `--font-heading`,
`--font-body`, `--shadow-md`, `--radius-lg`, etc.

Voir `packages/@verone/themes/src/ThemeProvider.tsx` pour la liste complète.
