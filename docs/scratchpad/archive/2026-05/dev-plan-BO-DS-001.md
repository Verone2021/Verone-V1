# [BO-DS-001] Pré-work design system multi-marques — Plan de découpage

**Date** : 2026-04-30
**Branche** : `feat/BO-DS-001-pre-work`
**Worktree** : `/Users/romeodossantos/verone-bo-ds-001`
**Statut** : 🚧 Plan validé (Option B minimal), en attente du GO de Romeo pour attaquer le code.

---

## Décisions verrouillées (Romeo, 2026-04-30)

1. **Orthographe**
   - Libellés humains : `Boêmia` (avec ê)
   - Slugs techniques : `boemia` (sans h, sans accent)
2. **Scope = Option B minimal** : 3 packages isolés + ThemeProvider + doc. **PAS** de réorg `@verone/ui` (trop risqué pendant que l'agent BO-VAR-FORM-002 travaille sur `@verone/products`).
3. **Worktree depuis `origin/staging` propre**, on ignore le travail untracked du main working dir.
4. **Parallèle à BO-BRAND-001** (pas encore lancé). Aucune dépendance technique entre les deux.

---

## Découverte préalable importante

`packages/@verone/ui/src/design-system/` existe déjà sur staging :

- `tokens/` : `colors.ts`, `shadows.ts`, `spacing.ts`, `typography.ts`
- `themes/` : `light.ts`, `dark.ts` (modes, pas marques)
- `utils/`
- Export public : `import { colors, spacing, theme, cn } from '@verone/ui/design-system'`

Et `packages/@verone/ui/src/theme-v2.ts` exporte un objet `themeV2` (palette Vérone Modern 2025).

**Décision d'architecture proposée** : les 3 nouveaux packages cohabitent avec l'existant.

- `@verone/tokens` = source W3C Design Tokens (référence cross-tool : Figma, Storybook, build)
- `@verone/themes` = thèmes par marque interne (verone, boemia, solar, flos, linkme, office) — couche que `@verone/ui/design-system` light/dark n'adresse pas
- `@verone/storybook` = playground pour valider visuellement chaque thème
- `@verone/ui/design-system` (existant) reste en place. Migration future = sprint séparé.

Si Romeo veut fusionner ou supprimer l'ancien `@verone/ui/design-system`, c'est un autre sprint (BO-DS-003+), hors de cette PR.

---

## Hors scope (rappel)

- ❌ Réorganisation `@verone/ui` en atomic design (atoms/molecules/organisms)
- ❌ Sortie de `ImageUploadZone` / `RoomMultiSelect` de `@verone/ui`
- ❌ Création d'alias rétrocompat (50-100 fichiers de réexport)
- ❌ Stories Storybook complètes (juste setup + décorateur ThemeProvider)
- ❌ Tokens approfondis par marque (Romeo génère sur claude.ai web → BO-DS-002)
- ❌ Migration `@verone/ui/design-system` actuel vers `@verone/tokens` (sprint futur)

---

## Plan de commits (5 commits sur la même branche, 1 PR)

### Commit 1 — Scaffold plan (ce commit)

```
[BO-DS-001] chore: scaffold design system pre-work plan
```

**Fichiers** :

- `docs/scratchpad/dev-plan-BO-DS-001.md` (ce fichier)

**But** : permettre le push draft immédiat avec visibilité multi-agents.

---

### Commit 2 — Package `@verone/tokens` (W3C Design Tokens)

```
[BO-DS-001] feat(tokens): create @verone/tokens package skeleton
```

**Fichiers nouveaux** :

- `packages/@verone/tokens/package.json` (nom : `@verone/tokens`, workspace pnpm)
- `packages/@verone/tokens/src/tokens.json` (format W3C Design Tokens : `spacing`, `breakpoints`, `motion.duration`, `motion.easing`, `z-index`)
- `packages/@verone/tokens/src/tokens.ts` (export TS dérivé du JSON, types stricts)
- `packages/@verone/tokens/src/index.ts` (API publique)
- `packages/@verone/tokens/tsconfig.json`
- `packages/@verone/tokens/README.md`

**Contenu tokens.json (scaffolding minimal)** :

- `spacing` : scale 0/0.5/1/1.5/2/3/4/6/8/12/16/24/32 (rem)
- `breakpoints` : `sm:640`, `md:768`, `lg:1024`, `xl:1280`, `2xl:1536` (alignés sur `responsive.md`)
- `motion.duration` : `instant:0ms`, `fast:150ms`, `normal:250ms`, `slow:400ms`
- `motion.easing` : `linear`, `easeIn`, `easeOut`, `easeInOut`, `bounce`
- `zIndex` : `dropdown:10`, `sticky:20`, `modal:50`, `toast:60`

**PAS dans tokens.json** (laissé à `@verone/themes` par marque) : couleurs, typo, ombres, radius (varient par marque).

---

### Commit 3 — Package `@verone/themes` + ThemeProvider

```
[BO-DS-001] feat(themes): create @verone/themes package + ThemeProvider
```

**Fichiers nouveaux** :

- `packages/@verone/themes/package.json`
- `packages/@verone/themes/src/types.ts` :
  ```ts
  export type BrandSlug =
    | 'verone'
    | 'boemia'
    | 'solar'
    | 'flos'
    | 'linkme'
    | 'office';
  export const BRAND_LABELS: Record<BrandSlug, string> = {
    verone: 'Vérone',
    boemia: 'Boêmia',
    solar: 'Solar',
    flos: 'Flos',
    linkme: 'LinkMe',
    office: 'Office',
  };
  ```
- `packages/@verone/themes/src/ThemeProvider.tsx` (API : `<ThemeProvider brand="verone | boemia | ...">`, injecte les variables CSS `--color-primary`, `--font-heading`, `--shadow-md`, etc. sur le `<html>` ou un wrapper `<div>`)
- `packages/@verone/themes/src/useTheme.ts` (hook `useTheme()` retourne `{ brand, setBrand }`)
- `packages/@verone/themes/src/themes/index.ts` (registry des 6 thèmes)
- `packages/@verone/themes/src/themes/{verone,boemia,solar,flos,linkme,office}/tokens.ts` (placeholder : objet vide ou tokens minimaux, à remplir dans BO-DS-002)
- `packages/@verone/themes/src/themes/{verone,boemia,solar,flos,linkme,office}/README.md` (placeholder docs : quand Romeo génère sur claude.ai, intégrer ici)
- `packages/@verone/themes/src/index.ts` (API publique)
- `packages/@verone/themes/tsconfig.json`
- `packages/@verone/themes/README.md`

**Architecture** : `ThemeProvider` ne dépend QUE de `@verone/tokens` + un thème de `@verone/themes`. Aucun lien à `@verone/ui` (pas de modif sur le design-system existant).

---

### Commit 4 — Package `@verone/storybook` (setup minimal)

```
[BO-DS-001] feat(storybook): create @verone/storybook minimal setup
```

**Fichiers nouveaux** :

- `packages/@verone/storybook/package.json` (Storybook 8, scripts `dev` + `build`)
- `packages/@verone/storybook/.storybook/main.ts` (config minimaliste — pas de stories à ce stade)
- `packages/@verone/storybook/.storybook/preview.tsx` (décorateur global `<ThemeProvider brand={...}>` + toolbar Storybook pour switcher de marque)
- `packages/@verone/storybook/tsconfig.json`
- `packages/@verone/storybook/README.md` (commande `pnpm --filter @verone/storybook dev`)

**Validation** : `pnpm --filter @verone/storybook dev` doit lancer Storybook localement. Pas de stories pour l'instant — juste vérifier que le décorateur ThemeProvider charge bien les 6 thèmes.

---

### Commit 5 — Documentation

```
[BO-DS-001] docs: design system architecture + handoff Claude AI
```

**Fichiers nouveaux** :

- `docs/architecture/DESIGN-SYSTEM-ARCHITECTURE.md` :
  - Vue d'ensemble 4 couches : tokens (W3C) → themes (par marque) → @verone/ui (composants neutres) → apps
  - Pourquoi 3 packages séparés (vs tout dans @verone/ui) : multi-marques, isolation, build indépendant, possibilité future de publier `@verone/tokens` sur npm pour Figma/design tools
  - Cohabitation avec `@verone/ui/design-system` actuel (light/dark) : pas de migration immédiate
- `docs/architecture/HANDOFF-CLAUDE-AI.md` :
  - Procédure pour Romeo : quand claude.ai web génère un fichier `boemia/tokens.ts`, où le déposer
  - Convention de nommage CSS variables (`--color-primary-{50..900}`, `--font-heading`, `--shadow-md`)
  - Format attendu pour brand guidelines (logo, palette, typo, voice)

---

## Workflow obligatoire (rappel)

- ✅ Push draft IMMÉDIAT après commit 1
- 🔁 `git fetch origin staging && git rebase origin/staging` AVANT chaque push (toutes les 1-2h)
- 🔒 `git push --force-with-lease` (jamais `--force` nu)
- 🚫 `gh pr merge --admin` interdit absolu (FEU ROUGE)
- 🛡️ Worktree isolé `/Users/romeodossantos/verone-bo-ds-001` (autre agent BO-VAR-FORM-002 actif)

---

## Acceptance criteria

- [ ] 3 packages créés et reconnus par pnpm workspace (`pnpm install` sans erreur)
- [ ] `pnpm --filter @verone/tokens type-check` PASS
- [ ] `pnpm --filter @verone/themes type-check` PASS
- [ ] `pnpm --filter @verone/storybook dev` lance Storybook sans erreur
- [ ] `pnpm --filter @verone/back-office build` reste PASS (zéro régression sur l'app existante — on ne touche à rien d'existant)
- [ ] Documentation lisible et complète
- [ ] Reviewer-agent PASS

---

## Hors scope confirmé (pour clarté)

| Élément                                                 | Sprint                 |
| ------------------------------------------------------- | ---------------------- |
| Tokens approfondis par marque (couleurs, typo)          | BO-DS-002 (claude.ai)  |
| Réorg `@verone/ui` atomic design                        | BO-DS-003+ (futur)     |
| Migration `@verone/ui/design-system` → `@verone/tokens` | BO-DS-003+ (futur)     |
| Sortie ImageUploadZone / RoomMultiSelect                | BO-DS-004+ (futur)     |
| Stories Storybook complètes                             | BO-DS-002 ou BO-DS-005 |
| Création apps `bohemia`/`solar`/`flos`                  | BO-BRAND-005/006/007   |

---

## Estimation

- Commit 1 : 2 min (déjà fait)
- Commit 2 : 30 min (tokens W3C + types)
- Commit 3 : 1h30 (themes + ThemeProvider, le plus délicat)
- Commit 4 : 1h (Storybook setup minimal)
- Commit 5 : 45 min (documentation)
- Validation type-check + build + Storybook lance : 30 min
- **Total estimé** : ~4h de travail

---

## Référence

- Audit factuel marques + canaux : `docs/scratchpad/audit-marques-canaux-2026-04-30.md`
- Roadmap globale : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
- Règles : `.claude/rules/multi-agent-workflow.md`, `branch-strategy.md`, `responsive.md`, `code-standards.md`
