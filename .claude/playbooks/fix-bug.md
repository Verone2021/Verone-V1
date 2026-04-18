# Playbook — Fix bug

Procédure pour corriger un bug identifié. Le mot d'ordre : **reproduire avant de fixer**, **tester runtime avant de commit**.

---

## Quand utiliser

- Bug reporté par Romeo ou via scratchpad
- Régression détectée par tests / Playwright / production
- Issue GitHub avec reproduction

**Ne pas utiliser pour** :
- Refactoring proactif (pas de bug → pas de fix)
- « Amélioration » qui n'est pas liée à un comportement cassé

---

## Étapes

### 1. Reproduire AVANT de coder

Si tu ne peux pas reproduire, tu ne peux pas fixer.

- Obtenir les étapes exactes (page, action, rôle utilisateur, données)
- Obtenir le message d'erreur exact (console, toast, logs Vercel)
- Si le bug est visuel : screenshot avant
- Si le bug est runtime : stack trace via `browser_console_messages`

Si rien n'est reproductible → STOP, demander à Romeo des précisions. Pas d'« amélioration préventive ».

### 2. Localiser la cause racine

- **Triple lecture** : lire au moins 3 fichiers similaires dans le code avant de modifier
- `git log --follow [fichier]` pour voir les derniers changements (peut-être régression récente)
- Vérifier si un fichier a été touché dans une PR récente qui cadre avec la date du bug
- Lire les règles de domaine pertinentes : `.claude/rules/domain/[finance|stock|responsive].md`

**Exemples de causes racines fréquentes** :
- Hook React conditionnel → « Rendered more hooks »
- Promesse flottante → erreur silencieuse en console
- Handler async passé à `onSubmit` → form submit cassé
- `router.push()` après `signOut()` → AuthSessionMissingError
- `useEffect` avec fonction non stable dans deps → boucle infinie (voir incident 2026-04-16)

### 3. Minimiser le changement

**Règle** : fixer LE bug, pas repenser le module.

- Modifier le MINIMUM nécessaire (< 30 lignes idéalement)
- Ne JAMAIS ajouter une feature dans un bug fix
- Ne JAMAIS refactorer un module entier pour un bug localisé
- Ne JAMAIS « tant qu'on y est » (sauf si explicitement demandé par Romeo)

### 4. Tester runtime

```bash
# Type-check + build local
pnpm --filter @verone/[app] type-check
pnpm --filter @verone/[app] build

# Playwright runtime sur la page concernée
# (demander à Romeo de démarrer le dev server d'abord)
```

Via Playwright MCP :
- `browser_navigate` vers la page reproduisant le bug
- Reproduire les étapes exactes
- `browser_console_messages` → 0 erreur après le fix
- Screenshot avant/après si visuel

### 5. Test de non-régression

Avant de commit : vérifier qu'une **autre** page utilisant le même composant ou pattern n'est pas cassée.

Exemple : si tu fixes un bug dans `useSalesOrder`, tester au moins 2 autres pages qui l'utilisent.

### 6. Commit et push

```bash
git add [fichiers minimaux]
git commit -m "[APP-DOMAIN-NNN] fix: description courte du bug"
git push
```

### 7. Rapport

Créer `docs/scratchpad/dev-report-[date]-[task-id]-fix.md` avec :
- Bug reproduit (étapes exactes)
- Cause racine identifiée
- Fix appliqué (diff résumé)
- Test de non-régression effectué
- Screenshot avant/après (si visuel)

---

## Critères de succès

- [ ] Bug reproductible avant fix, non reproductible après
- [ ] Cause racine documentée (pas juste « ça remarche »)
- [ ] Fix minimal (< 30 lignes idéalement)
- [ ] Type-check + build PASS
- [ ] Playwright runtime : 0 erreur console
- [ ] Au moins 1 page de non-régression testée
- [ ] Dev-report dans scratchpad

---

## Pièges courants

### « Je ne peux pas reproduire le bug »

STOP. Demander à Romeo :
- Quelle page exacte ?
- Quel rôle utilisateur ?
- Quelles données (vide, avec contenu, cas limite) ?

Ne pas coder « au feeling » parce que ça « semble être la cause ». Souvent faux.

### « Le fix casse une autre page »

Tu n'as pas testé assez large. Identifier tous les consommateurs du composant modifié via `grep -r [ComposantName]` et tester au moins 2 autres cas d'usage.

### « La cause racine est dans un fichier @protected »

Voir `.claude/rules/code-standards.md` section FICHIERS PROTEGES. Ne PAS modifier sans approbation Romeo. Proposer un fix alternatif (ex : ajouter une couche au-dessus, fixer le consommateur) et documenter pourquoi le fichier @protected ne peut pas être touché.

### « Le bug vient de la DB (RLS, trigger, contrainte) »

Voir `.claude/rules/database.md` et `.claude/rules/stock-triggers-protected.md`. Toute modification DB passe par Romeo → FEU ROUGE dans `autonomy-boundaries.md`.
