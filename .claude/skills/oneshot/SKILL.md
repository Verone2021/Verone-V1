---
name: oneshot
description: Correctif rapide sans exploration profonde. Pour bugs isoles, typos, ajustements CSS, renommages. Ne pas utiliser pour features ou refactoring.
---

# Oneshot — Correctif Rapide

**Quand utiliser** : Bug isole, typo, ajustement CSS/style, renommage, ajout d'un champ simple.
**Ne PAS utiliser si** : La modification touche plus de 3 fichiers ou necessite une comprehension du schema DB.

## Workflow

### 1. LOCALISER (30 secondes max)

- Identifier le fichier exact avec Grep/Glob
- Lire le fichier concerne (pas besoin de lire 3 fichiers similaires pour un fix trivial)

### 2. CORRIGER

- Modifier uniquement ce qui est necessaire
- Zero changement cosmétique autour du fix
- Respecter le style du fichier (indentation, nommage, imports)

### 3. VERIFIER

```bash
pnpm --filter @verone/[app] type-check
```

Si le fix est visuel (CSS, layout, texte) → verification Playwright recommandee.

## Regles

- **1 fix = 1 fichier** (idealement). Si plus de 3 fichiers → basculer sur `/implement`
- **Pas de refactoring opportuniste** — corriger le bug, pas le code autour
- **Toujours verifier la branche** avant commit : `git branch --show-current`
- **Ne jamais toucher** aux routes API existantes (Qonto, adresses, emails, webhooks)
