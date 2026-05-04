# Procédure : Intégration outputs claude.ai → @verone/themes

**Pour** : Romeo Dos Santos
**Contexte** : tu génères les brand guidelines sur claude.ai web → tu reçois un fichier TypeScript → tu l'intègres dans le repo.

---

## Vue d'ensemble

```
Tu (Romeo) sur claude.ai web
  → décris la marque + palette + typo + tone of voice
  → claude.ai retourne un objet TypeScript BrandTokens

Tu copie-colles dans le repo
  → packages/@verone/themes/src/themes/{slug}/tokens.ts

PR BO-DS-002 → merge → ThemeProvider injecte les vraies variables CSS
```

---

## Étape 1 : Générer les tokens sur claude.ai web

Lance un nouveau chat sur [claude.ai](https://claude.ai) avec ce prompt (adapte `{NOM_DE_LA_MARQUE}`) :

````
Je veux définir les design tokens pour la marque "{NOM_DE_LA_MARQUE}".

Génère un objet TypeScript au format exact suivant (aucune variation de nommage) :

```ts
import type { BrandTokens } from '../../types';

export const {slug}Tokens: BrandTokens = {
  colors: {
    primary: '#...',
    primaryForeground: '#...',   // couleur du texte sur fond primary
    secondary: '#...',
    secondaryForeground: '#...',
    accent: '#...',
    accentForeground: '#...',
    background: '#...',
    foreground: '#...',          // couleur texte principale
    muted: '#...',               // fond neutre secondaire
    mutedForeground: '#...',     // texte sur fond muted
    border: '#...',
    destructive: '#...',         // erreurs, suppressions
    destructiveForeground: '#...',
  },
  typography: {
    fontHeading: '"...", serif',    // ex: '"Playfair Display", serif'
    fontBody: '"...", sans-serif',  // ex: '"Inter", sans-serif'
    fontMono: '"...", monospace',   // ex: '"JetBrains Mono", monospace'
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
};
````

Voici les caractéristiques de la marque :

- Identité : [décris ici le feel, le style, la cible]
- Palette souhaitée : [couleurs principales]
- Typographie : [serif ? sans-serif ? moderne ? classique ?]

````

---

## Étape 2 : Copier le résultat dans le repo

Navigue vers le fichier de la marque concernée :

| Marque | Fichier |
|---|---|
| Vérone | `packages/@verone/themes/src/themes/verone/tokens.ts` |
| Boêmia | `packages/@verone/themes/src/themes/boemia/tokens.ts` |
| Solar | `packages/@verone/themes/src/themes/solar/tokens.ts` |
| Flos | `packages/@verone/themes/src/themes/flos/tokens.ts` |
| LinkMe | `packages/@verone/themes/src/themes/linkme/tokens.ts` |
| Office | `packages/@verone/themes/src/themes/office/tokens.ts` |

Remplace le contenu du fichier (actuellement `null`) par l'objet généré.

**Attention** : garde la ligne `import type { BrandTokens } from '../../types';` en haut du fichier.

---

## Étape 3 : Vérifier que ça compile

```bash
pnpm --filter @verone/themes type-check
````

Si une couleur est mal formatée (ex: valeur manquante ou type incorrect), TypeScript t'indiquera exactement quelle propriété corriger.

---

## Étape 4 : Créer la PR

```bash
git checkout -b feat/BO-DS-002-brand-{slug}-tokens
git add packages/@verone/themes/src/themes/{slug}/tokens.ts
git commit -m "[BO-DS-002] feat: add {slug} brand tokens"
git push -u origin feat/BO-DS-002-brand-{slug}-tokens
gh pr create --base staging --title "[BO-DS-002] feat: {Slug} brand tokens" --body "..."
```

Ou demande à Claude Code de faire les étapes 3+4 pour toi après avoir modifié le fichier.

---

## Convention des variables CSS

Une fois les tokens en place, ces variables CSS sont disponibles dans tous les composants enfants du `ThemeProvider` :

```css
/* Couleurs */
var(--color-primary)
var(--color-primary-foreground)
var(--color-secondary)
var(--color-accent)
var(--color-background)
var(--color-foreground)
var(--color-muted)
var(--color-muted-foreground)
var(--color-border)
var(--color-destructive)
var(--color-destructive-foreground)

/* Typographie */
var(--font-heading)
var(--font-body)
var(--font-mono)

/* Ombres */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)

/* Radius */
var(--radius-sm)
var(--radius-md)
var(--radius-lg)
var(--radius-full)
```

Ces variables CSS sont **en plus** des variables CSS de Tailwind. Elles s'appliquent via `style` inline dans les composants ou via `className` si Tailwind est configuré pour les lire.

---

## Intégration Tailwind (optionnel, futur)

Pour que Tailwind lise les variables CSS du ThemeProvider, ajouter dans `tailwind.config.ts` :

```ts
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      'primary-foreground': 'var(--color-primary-foreground)',
      // etc.
    },
    fontFamily: {
      heading: 'var(--font-heading)',
      body: 'var(--font-body)',
    },
  }
}
```

Cela permettra d'utiliser `className="text-primary bg-primary-foreground font-heading"` dans les composants.

---

## Identités visuelles prévues (pour référence)

| Marque | Ambiance                        | Palette de départ           | Typo                     |
| ------ | ------------------------------- | --------------------------- | ------------------------ |
| Vérone | Élégant, concept store parisien | Blanc/noir/or               | Serif + sans-serif épuré |
| Boêmia | Bohème, artisanal, chaleureux   | Terracotta/ocre/sable       | Serif avec âme           |
| Solar  | Énergétique, moderne, tech      | Jaune vif/anthracite        | Sans-serif géométrique   |
| Flos   | Floral, délicat, premium        | Rose poudré/crème/sauge     | Serif fin                |
| LinkMe | Professionnel B2B, confiance    | Bleu/blanc/gris neutre      | Sans-serif propre        |
| Office | Épuré, fonctionnel, sobre       | Monochrome/gris/blanc cassé | Sans-serif utilitaire    |

Ces descriptions sont des orientations pour la génération sur claude.ai. Romeo décide de la palette finale.

---

## Référence

- Types : `packages/@verone/themes/src/types.ts`
- ThemeProvider : `packages/@verone/themes/src/ThemeProvider.tsx`
- Architecture globale : `docs/architecture/DESIGN-SYSTEM-ARCHITECTURE.md`
- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
