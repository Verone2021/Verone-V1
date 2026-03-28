# Git Workflow

## Autonomie et Protections

### Actions AUTONOMES (Claude fait seul)
- Explorer le codebase (Glob, Grep, Read, Serena)
- Ecrire/modifier code (Edit, Write)
- Creer commits locaux (format convention)
- Pousser sur feature branch (`git push origin feature-branch`)
- Creer tests, verifier qualite (type-check, build, lint)
- Proposer une PR apres implementation

### Actions BLOQUEES par hooks (impossible techniquement)
- Commit/push sur `main` ou `master`
- `--no-verify` sur commit/push
- PR avec `--base main` (doit etre `--base staging`)
- TypeScript `any`

### Actions DESTRUCTRICES (STOP + confirmer)
- Force push (`git push --force`)
- Supprimer branches distantes
- Merger vers main/production
- Modifier schema DB production
- Executer migrations irreversibles

## Feature Branch (OBLIGATOIRE)

```bash
git checkout staging && git pull
git checkout -b feat/APP-DOMAIN-NNN-description
# Travailler, commit, push
git push -u origin feat/APP-DOMAIN-NNN-description
# PR via /pr
```

## Format Commit

`[APP-DOMAIN-NNN] type: description` — ex: `[LM-ORD-009] feat: refonte workflow`

## CRITICAL : Verifier la branche

Verifier `git branch --show-current` AVANT chaque commit. Ne JAMAIS supposer etre sur la bonne branche.

## Avant Chaque Commit

1. `git branch --show-current` — confirmer la branche
2. `git diff --staged` — verifier les fichiers
3. `pnpm --filter @verone/[app] type-check` — zero erreurs
4. ESLint sur fichiers modifies — zero erreurs sur nouveau code
5. Commit seulement si tout passe

## Workflow PR

1. Implementation terminee + type-check + build OK
2. Commit + push sur feature branch
3. Creer PR vers staging : `gh pr create --base staging`
4. Attendre validation Vercel + review
5. NE PAS merger sans validation Vercel

## Apres Merge staging → main

Rebase staging sur main immediatement :

```bash
git checkout staging && git rebase origin/main && git push --force-with-lease
```

## GitHub Actions

- Aucune PR automatique (workflow_dispatch uniquement)
- Pas de schedule pour creation de PR
