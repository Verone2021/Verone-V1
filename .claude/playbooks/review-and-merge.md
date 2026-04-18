# Playbook — Review and merge

Workflow standard de l'étape « PR prête → mergée » par ops-agent, avec les gates obligatoires.

---

## Quand utiliser

- Un bloc de travail est fonctionnellement complet sur une feature branch
- Reviewer-agent a PASS sur le verdict du bloc
- CI verte sur la dernière commit
- Romeo a validé explicitement

**Ne pas utiliser pour** :

- PR draft (pas encore prête)
- PR intermédiaire par sprint (voir `.claude/rules/workflow.md` → 1 PR = 1 bloc cohérent)

---

## Étapes

### 1. Pré-conditions (toutes DOIVENT être OK)

```bash
# 1.1 Vérifier qu'on est sur la bonne branche
git branch --show-current
# Doit être la feature branch du bloc

# 1.2 Vérifier que tout est commité
git status --porcelain
# Doit être vide

# 1.3 Vérifier qu'on n'est pas en retard sur staging
git fetch origin staging
BEHIND=$(git rev-list --count HEAD..origin/staging)
echo "Behind staging: $BEHIND commits"
# Si > 0 : rebase obligatoire avant PR

# 1.4 Si besoin : rebase
git rebase origin/staging
# Résoudre les conflits si présents (FEU ROUGE → demander Romeo)
```

### 2. Gates de qualité locale

```bash
# 2.1 Type-check (toutes les apps touchées)
pnpm --filter @verone/[app] type-check
# Exit 0 requis

# 2.2 Build
pnpm --filter @verone/[app] build
# Exit 0 requis

# 2.3 Lint
pnpm --filter @verone/[app] lint
# Exit 0 requis

# 2.4 Tests (si applicable)
npx playwright test
# Pass requis
```

### 3. Lancer reviewer-agent (OBLIGATOIRE avant création PR)

Invoquer `reviewer-agent` avec :

- Référence au dernier `dev-report-*.md`
- Consigne : scanner tous les axes (Clean Code + Sécurité + Performance + Responsive si UI)

Attendre le verdict dans `docs/scratchpad/review-report-[date].md`.

**Si FAIL** :

- STOP, pas de PR
- Logger les CRITICAL dans un nouveau dev-plan
- Déléguer dev-agent pour corriger
- Reboucler sur étape 3

**Si PASS_WITH_WARNINGS** :

- Lire chaque warning, décider si on fixe maintenant ou on crée une tâche dans ACTIVE.md
- Continuer si les warnings sont documentés et acceptés par Romeo

**Si PASS** :

- Continuer étape 4

### 4. Créer la PR (DRAFT ou ready selon autonomy)

```bash
# 4.1 PR DRAFT par défaut (FEU VERT agent)
gh pr create --draft --base staging \
  --title "[BLOC-NAME] description courte du bloc" \
  --body "$(cat << 'EOF'
## Résumé

<Résumé du bloc : quels sprints inclus, quel scope>

## Commits inclus

- [Task-ID-1] description
- [Task-ID-2] description
...

## Tests

- Type-check : PASS
- Build : PASS
- Playwright runtime : PASS (screenshots joints)
- Reviewer-agent : PASS (ref: review-report-YYYY-MM-DD.md)

## Hors scope

<Ce qui N'EST PAS dans cette PR>

## Checklist merge

- [ ] CI verte
- [ ] Validation Romeo
- [ ] Reviewer-agent PASS (fait)
EOF
)"
```

**Note** : promotion DRAFT → ready est FEU ORANGE. Demander confirmation Romeo.

### 5. Attendre CI + validation Romeo

```bash
# Watch CI
gh pr checks [PR-NUM] --watch
```

Si CI rouge → voir playbook `handle-ci-failure.md`.

Si CI verte et Romeo a validé → étape 6.

### 6. Merge squash

```bash
gh pr merge [PR-NUM] --squash --delete-branch
```

**Pourquoi squash** : historique propre sur staging. 1 PR = 1 commit squashé, pas N commits intermédiaires.

**Pourquoi --delete-branch** : nettoyage automatique, évite l'accumulation de branches fantômes.

### 7. Post-merge

```bash
# 7.1 Retourner sur staging et pull
git checkout staging
git pull

# 7.2 Mettre à jour ACTIVE.md
# Marquer la tâche comme [x] FAIT (ou la déplacer en section "Fait recent")
# Mentionner le PR number et la date de merge

# 7.3 Rapport deploy
# Créer docs/scratchpad/deploy-report-[date]-[task-id].md
```

### 8. Vérification Vercel (FEU VERT)

Attendre ~2-3 minutes que Vercel déploie sur staging. Puis :

- Ouvrir la preview URL
- Valider rapidement les pages critiques (authentification, dashboard, pages migrées)
- Si régression visible → hotfix immédiat ou revert (voir `handle-ci-failure.md`)

### 9. Mise à jour DECISIONS.md (si structurel)

Si la PR modifiait `.claude/` (config, rules, agents, playbooks), vérifier que l'ADR correspondant est dans `.claude/DECISIONS.md`. Si absent, l'ajouter en rétro-actif.

---

## Critères de succès

- [ ] Toutes les gates qualité PASS avant PR
- [ ] Reviewer-agent verdict PASS documenté
- [ ] PR créée avec body structuré
- [ ] CI verte
- [ ] Validation Romeo
- [ ] Merge squash
- [ ] Branche supprimée
- [ ] Tâche marquée [x] FAIT dans ACTIVE.md
- [ ] Vercel preview OK
- [ ] DECISIONS.md à jour si applicable

---

## Pièges courants

### « La PR est prête mais Romeo n'est pas dispo pour valider »

Attendre. Pas de merge automatique sans validation explicite (FEU ROUGE).

### « CI passe localement mais rouge sur GitHub Actions »

Diff environnement (versions, cache, Node). Voir `handle-ci-failure.md`. Ne JAMAIS utiliser `--no-verify` pour contourner.

### « Reviewer-agent PASS mais je vois un CRITICAL évident »

Ne pas ignorer. Reviewer-agent peut manquer un cas. Re-déléguer avec un brief plus précis ou escalader à Romeo. En dernier recours, logger comme WARNING accepté dans le dev-report.

### « La PR est mergée mais Vercel casse en production »

Hotfix immédiat. Voir `handle-ci-failure.md` pour rollback. Ajouter une tâche post-mortem dans `.claude/work/ACTIVE.md` (`[INFRA-POSTMORTEM-NNN]`).
