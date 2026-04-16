# Workflow

## REGLES IMPERATIVES

- Ne JAMAIS commit/push sur `main` ou `master`
- Ne JAMAIS utiliser `--no-verify`
- Ne JAMAIS creer de PR avec `--base main` (toujours `--base staging`)
- Ne JAMAIS lancer de serveur (`pnpm dev`, `turbo dev`, `next dev`) — seul Romeo peut
- Ne JAMAIS coder sans avoir lu le CLAUDE.md de l'app concernee
- Ne JAMAIS coder sans avoir lu 3 fichiers similaires (Triple Lecture)
- Ne JAMAIS implementer sans verifier `git log` des tentatives precedentes
- Ne JAMAIS switcher de branche sans autorisation Romeo
- TOUJOURS verifier `git branch --show-current` AVANT chaque commit
- TOUJOURS filtrer build/type-check : `pnpm --filter @verone/[app] build`

## STANDARDS

### Feature Branch

```bash
git checkout staging && git pull
git checkout -b feat/APP-DOMAIN-NNN-description
# Travailler, commit, push
git push -u origin feat/APP-DOMAIN-NNN-description
# PR via /pr → gh pr create --base staging
```

### Format Commit

`[APP-DOMAIN-NNN] type: description` — ex: `[LM-ORD-009] feat: refonte workflow`

### Avant Chaque Commit

1. `git branch --show-current` — confirmer la branche
2. `git diff --staged` — verifier les fichiers
3. `pnpm --filter @verone/[app] type-check` — zero erreurs
4. Commit seulement si tout passe

### Build (TOUJOURS filtrer)

```bash
pnpm --filter @verone/back-office build       # back-office
pnpm --filter @verone/linkme build            # linkme
pnpm --filter @verone/site-internet build     # site-internet
```

`pnpm build` global INTERDIT sauf changement transversal (`@verone/types`, `@verone/ui`).

### Workflow PR

1. Type-check + build OK
2. Push sur feature branch
3. `gh pr create --base staging`
4. NE PAS merger sans validation Vercel

### Apres Merge staging → main

```bash
git checkout staging && git rebase origin/main && git push --force-with-lease
```

### Serveurs

| App           | Port |
| ------------- | ---- |
| back-office   | 3000 |
| site-internet | 3001 |
| linkme        | 3002 |

### Autonomie Agent

- **Autonome** : explorer, editer, commiter, pusher feature branch, creer PR
- **Bloque par hooks** : commit sur main, --no-verify, PR vers main, `any` TypeScript
- **Confirmer Romeo** : force push, supprimer branches, merger vers main, migrations irreversibles

### Contexte Avant Coder

1. Lire doc DB du domaine (`docs/current/database/schema/`)
2. Lire ACTIVE.md + CLAUDE.md de l'app
3. Consulter memoire persistante (feedbacks, decisions)
4. Lire 3 fichiers similaires
5. Verifier `git log` des tentatives precedentes

### Verification Post-Deploiement

Apres merge staging → main, tester avec Playwright :

| Page        | URL                     | Verifier                 |
| ----------- | ----------------------- | ------------------------ |
| Dashboard   | `/dashboard`            | KPIs charges, pas de NaN |
| Commandes   | `/commandes/clients`    | Table + 1 modal          |
| Factures    | `/factures`             | Onglets, montants, PDF   |
| Expeditions | `/stocks/expeditions`   | Statuts coherents        |
| Finance     | `/finance/transactions` | Transactions chargees    |

`browser_console_messages(level: "error")` → 0 erreur toleree.

### Tests E2E obligatoires

Tout sprint touchant a un workflow critique (voir `docs/current/WORKFLOWS-CRITIQUES.md`)
doit ajouter ou mettre a jour le test E2E correspondant.

Workflows critiques : Expedition, Chaine commerciale, Produits, LinkMe, Stock multi-mouvements.
Checklist des pages : `docs/current/TESTS-CHECKLIST-PAGES.md`
