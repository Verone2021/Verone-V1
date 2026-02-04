# Configuration Branch Protection GitHub

**Objectif** : Protéger la branche `main` contre les push directs et forcer validation CI/CD.

---

## ⚠️ ACTION MANUELLE REQUISE

Cette configuration doit être effectuée **manuellement** sur GitHub par un administrateur du repo.

---

## Étapes de Configuration

### 1. Accéder aux Paramètres

1. Aller sur le repo GitHub
2. **Settings** → **Branches** (menu gauche)
3. Section **Branch protection rules**
4. Cliquer **Add rule** ou **Add branch protection rule**

### 2. Configurer la Protection pour `main`

#### Champ "Branch name pattern"

```
main
```

#### Status Checks (CRITIQUE)

**☑️ Require status checks to pass before merging**

- Cocher cette option
- Sélectionner les checks obligatoires :
  - ✅ `build` (quality.yml)
  - ✅ `lint` (quality.yml)
  - ✅ `type-check` (quality.yml)
  - ✅ `linkme-validation` (linkme-validation.yml)

**☑️ Require branches to be up to date before merging**

- Force rebase/merge avec main avant validation

#### Pull Request Rules

**☑️ Require a pull request before merging**

- Interdit push direct sur `main`
- **Required approvals** : `1` (minimum)

**☑️ Require review from Code Owners**

- Optionnel (nécessite fichier `.github/CODEOWNERS`)

**☑️ Dismiss stale pull request approvals when new commits are pushed**

- Force re-review après nouveau push

#### Additional Restrictions (IMPORTANT)

**☑️ Do not allow bypassing the above settings**

- **Même les administrateurs** ne peuvent pas bypasser

**☑️ Include administrators**

- Les admins sont soumis aux mêmes règles

**☑️ Restrict who can push to matching branches**

- Optionnel : Limiter aux équipes spécifiques

**☑️ Allow force pushes → Everyone**

- **DÉCOCHER** cette option (interdire force push)

**☑️ Allow deletions**

- **DÉCOCHER** cette option (interdire suppression branche)

### 3. Sauvegarder

Cliquer **Create** ou **Save changes** en bas de page.

---

## Résultat Attendu

Une fois configuré :

### ❌ Actions IMPOSSIBLES

- Push direct sur `main` (même avec `--no-verify`)
- Force push sur `main` (protège historique)
- Merge PR sans CI passing
- Merge PR sans review
- Suppression branche `main`
- Bypasser règles (même admins)

### ✅ Actions OBLIGATOIRES

- Créer feature branch (`feat/`, `fix/`)
- Passer CI/CD (ESLint + Type-Check + Build)
- Obtenir 1 review minimum
- Merge via Pull Request uniquement

---

## Vérification Post-Configuration

### Test 1 : Push Direct (doit FAIL)

```bash
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test"
git push origin main
# → remote: error: GH006: Protected branch update failed
```

### Test 2 : PR sans CI (doit FAIL)

1. Créer branche avec erreur TypeScript volontaire
2. Push branche
3. Créer PR
4. CI va FAIL
5. **Merge button sera désactivé** avec message "Required checks failed"

### Test 3 : Force Push (doit FAIL)

```bash
git push --force origin main
# → remote: error: GH006: Protected branch update failed
```

---

## Workflows CI/CD Associés

### `.github/workflows/quality.yml`

**Déclencheurs** :

- Pull requests vers `main`
- Push sur `main`

**Jobs** :

- `lint` : ESLint sur tout le monorepo
- `type-check` : TypeScript strict validation
- `build` : Build complet monorepo

**Durée** : ~3-5 minutes

### `.github/workflows/linkme-validation.yml`

**Déclencheurs** :

- Pull requests (chemins LinkMe uniquement)
- Push sur `main`

**Jobs** :

- `linkme-validation` : Type-check + Build LinkMe

**Durée** : ~1-2 minutes

---

## Maintenance

### Ajouter un nouveau check obligatoire

1. Settings → Branches → Règle `main` → **Edit**
2. Section "Require status checks"
3. Rechercher le nom du job (ex: `new-check`)
4. Cocher la case
5. **Save changes**

### Modifier nombre reviews requises

1. Settings → Branches → Règle `main` → **Edit**
2. Section "Required approvals"
3. Changer le nombre
4. **Save changes**

---

## Dépannage

### "Merge button disabled but CI passed"

**Causes possibles** :

- Branche pas à jour avec `main` → Rebase/merge main
- Check obligatoire manquant → Vérifier liste checks
- Review manquante → Demander review

### "Cannot enable rule: no checks available"

**Solution** :

- Déclencher CI au moins 1 fois (créer PR test)
- Attendre que CI termine
- Retourner dans settings (checks apparaîtront)

### "Administrator bypass warning"

**Si message** : "Administrators can still push to this branch"

**Solution** :

- ☑️ Cocher **Include administrators**
- ☑️ Cocher **Do not allow bypassing**

---

## Références

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Status Checks Configuration](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)

---

**Version** : 1.0.0 (2026-02-04)
