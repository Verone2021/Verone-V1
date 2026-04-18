# Playbook — Handle CI failure

Procédure quand la CI GitHub Actions devient rouge sur une PR ou après un merge.

---

## Quand utiliser

- PR avec CI rouge sur `gh pr checks`
- Push sur staging qui casse Vercel
- Test flaky qui FAIL de manière intermittente

---

## Étapes

### 1. Identifier quel job a échoué

```bash
gh pr checks [PR-NUM]
# Ou pour un commit spécifique :
gh run list --branch [branch]
gh run view [RUN-ID] --log-failed
```

Jobs typiques :
- `type-check` — erreur TypeScript
- `lint` — erreur ESLint
- `build` — erreur de compilation Next.js
- `test` — test Playwright ou unit qui FAIL
- `deploy-preview` — Vercel preview échoue

### 2. Reproduire localement

**Avant de fixer** : reproduire en local pour être sûr que la correction marche.

```bash
# Exact commande que GitHub Actions exécute
pnpm install --frozen-lockfile
pnpm --filter @verone/[app] type-check
pnpm --filter @verone/[app] build
pnpm --filter @verone/[app] lint
```

Si ça passe localement mais pas en CI : voir section « CI passe localement, rouge en GitHub ».

### 3. Diagnostiquer

Par type d'erreur :

**Type-check FAIL** :
- Lire `.claude/guides/typescript-errors-debugging.md`
- Usuellement : types Supabase divergents après migration, interface locale incorrecte, champs manquants dans Insert

**Lint FAIL** :
- Usuellement : `any` non déclaré, `eslint-disable` interdit, promesses flottantes, hooks dans conditionnels
- Jamais corriger par `eslint-disable` ou `@ts-ignore`

**Build FAIL** :
- Imports cassés (paquet manquant, typo)
- Module non-trouvable (paquet monorepo non installé)
- Next.js config incompatible

**Test FAIL** :
- Si Playwright : peut être flaky (timing). Re-run une fois.
- Si reproductible : bug réel à fixer

**Deploy Vercel FAIL** :
- Souvent env vars manquantes en preview
- Vérifier `vercel env ls` (si accès)
- Escalade Romeo si env config

### 4. Fixer avec minimum

Même règle que `fix-bug.md` : correction minimale, pas de refactoring opportuniste.

### 5. Re-push et vérifier

```bash
git add [fichiers]
git commit -m "[APP-DOMAIN-NNN] fix: resoudre CI rouge - <cause>"
git push

# Attendre CI
gh pr checks [PR-NUM] --watch
```

### 6. Si plusieurs échecs consécutifs

Après 2 tentatives ratées → STOP.
- Rapport détaillé dans `docs/scratchpad/ci-failure-[date].md`
- Escalade à Romeo
- Ne pas essayer en aveugle à la 3e tentative

---

## Cas « CI passe localement, rouge en GitHub »

Causes classiques par fréquence :

1. **Versions différentes** : Node, pnpm, package versions
   - Vérifier `.nvmrc`, `packageManager` dans `package.json`, `engines`
2. **Cache CI corrompu**
   - Vider le cache : « Re-run all jobs » avec cache miss
3. **Variables d'environnement** manquantes en CI
   - Vérifier `.github/workflows/*.yml` env
4. **Tests dépendant de données DB** qui n'existent pas en CI
   - Tests E2E devraient utiliser fixtures ou comptes dédiés
5. **Fichier non tracké en local** (`.env.local`) dont le code dépend
   - Vérifier `.gitignore`, commiter un `.env.example`
6. **Ordre d'exécution** : parallélisme CI vs séquentiel local
   - Rare mais possible avec Turborepo cache

---

## Cas « Vercel staging casse après merge »

**Rollback immédiat** :

```bash
# Revert du commit de merge
git checkout staging
git pull
git revert -m 1 [MERGE-COMMIT-SHA]
git push

# Ou plus radical : re-pointer staging sur le commit précédent
# (FEU ROUGE — Romeo uniquement)
```

Puis :
- Créer `docs/scratchpad/incident-[date].md` avec timeline
- Fixer sur une nouvelle branche
- Re-tester sur preview Vercel avant re-merge
- Post-mortem si impact > 30 min

---

## Critères de succès

- [ ] Job CI identifié
- [ ] Erreur reproduite localement (ou diagnostiquée comme flaky)
- [ ] Fix minimal appliqué
- [ ] CI verte après re-push
- [ ] Si Vercel cassé : rollback effectué
- [ ] Rapport dans scratchpad si incident > 30 min

---

## Pièges courants

### « Le test est flaky, je rerun jusqu'à ce que ça passe »

**NON**. Un test flaky est un bug. Soit tu le corriges (timing, état partagé, données non déterministes), soit tu le désactives explicitement avec un commentaire et une tâche `[INFRA-TEST-NNN]` pour le réactiver.

### « J'utilise --no-verify pour push quand même »

**INTERDIT**. Bloqué par hook `settings.json`. Si tu y penses, tu as déjà dévié du process → retour à l'étape 2.

### « La CI marche pas, je supprime le test »

**INTERDIT**. Un test supprimé est un test qui ne trouve plus les régressions. Soit tu le fixes, soit tu le désactives explicitement avec un TODO et une tâche de suivi.

### « Le lockfile a changé, tout explose »

Vérifier que `pnpm-lock.yaml` est commité. Si conflits sur le lockfile : `pnpm install` en local, commit, push. Ne jamais résoudre les conflits de lockfile manuellement.
