# 🛡️ Protection Branche Main - Configuration GitHub

**Date de création**: 8 octobre 2025
**Contexte**: Sécurisation de la branche `main` après déploiement production
**Objectif**: Empêcher commits directs sur `main` et forcer les Pull Requests

---

## 🎯 POURQUOI PROTÉGER LA BRANCHE MAIN?

### Avant protection
```bash
# Danger: Push direct possible
git checkout main
git add .
git commit -m "Fix rapide"
git push origin main  # ✅ Accepté (DANGEREUX en production!)
```

**Risques:**
- ❌ Code non testé directement en production
- ❌ Pas de review, erreurs possibles
- ❌ Impossible de rollback facilement
- ❌ Historique pollué

### Après protection
```bash
# Protection active
git checkout main
git push origin main  # ❌ REFUSÉ par GitHub

# Workflow obligatoire
git checkout -b feature/ma-fonctionnalite
git push origin feature/ma-fonctionnalite
# → Créer PR → Review → Merge autorisé
```

**Avantages:**
- ✅ Toujours passer par Pull Request
- ✅ Review visuelle obligatoire
- ✅ Tests automatiques (si configurés)
- ✅ Historique propre et tracé

---

## 📋 CONFIGURATION ÉTAPE PAR ÉTAPE

### ÉTAPE 1: Accéder aux paramètres GitHub

1. Aller sur votre repository GitHub:
   ```
   https://github.com/Verone2021/Verone-backoffice
   ```

2. Cliquer sur **Settings** (⚙️ en haut à droite)

3. Menu latéral gauche → **Branches**

4. Section "Branch protection rules" → **Add rule**

### ÉTAPE 2: Configurer la règle de protection

#### Champ "Branch name pattern"
```
main
```
*(Nom exact de la branche à protéger)*

#### Options à cocher (RECOMMANDÉES)

##### 1. Require a pull request before merging
**☑ Cocher cette case**

Sous-options:
- **☑ Require approvals**: Nombre d'approbations requises
  - Mettre **1** (vous devez approuver votre propre PR)

- **☐ Dismiss stale pull request approvals when new commits are pushed**
  - Laisser décoché pour l'instant (solo developer)

- **☐ Require review from Code Owners**
  - Laisser décoché (pas de CODEOWNERS configuré)

##### 2. Require status checks to pass before merging
**☐ Laisser décoché pour l'instant**
*(Activer plus tard quand tests automatisés)*

Si vous activez plus tard:
- Rechercher "Vercel" dans la liste
- ☑ Cocher "Vercel deployment"

##### 3. Require conversation resolution before merging
**☑ Cocher cette case**
*(Force résolution de tous les commentaires avant merge)*

##### 4. Require signed commits
**☐ Laisser décoché**
*(Optionnel, setup complexe pour novice)*

##### 5. Require linear history
**☐ Laisser décoché**
*(Permet merge commits avec historique complet)*

##### 6. Require merge queue
**☐ Laisser décoché**
*(Utile seulement pour équipes multiples)*

##### 7. Require deployments to succeed before merging
**☐ Laisser décoché pour l'instant**
*(Activer quand CI/CD stable)*

##### 8. Lock branch
**☐ Laisser décoché**
*(Empêcherait toute modification, même via PR)*

##### 9. Do not allow bypassing the above settings
**☑ Cocher cette case**
*(Pas d'exception, même pour vous)*

##### 10. Restrict who can push to matching branches
**☐ Laisser décoché**
*(Vous êtes le seul développeur)*

##### 11. Allow force pushes
**☐ Laisser décoché**
*(Force push dangereux sur main)*

##### 12. Allow deletions
**☐ Laisser décoché**
*(Empêche suppression accidentelle de main)*

### ÉTAPE 3: Sauvegarder la règle

1. Scroll en bas de la page
2. Cliquer sur **Create** (bouton vert)
3. Confirmation: "Branch protection rule created"

---

## ✅ CONFIGURATION MINIMALE RECOMMANDÉE

Pour Vérone Back Office (développeur solo, début production):

```yaml
Règle de protection "main":
  ✅ Require a pull request before merging
     ✅ Require approvals: 1
  ✅ Require conversation resolution before merging
  ✅ Do not allow bypassing the above settings
  ☐ Allow force pushes: NON
  ☐ Allow deletions: NON
```

---

## 🧪 TESTER LA PROTECTION

### Test 1: Push direct refusé

```bash
# Essayer de pusher directement sur main
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "Test protection"
git push origin main
```

**Résultat attendu:**
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Changes must be made through a pull request.
```

✅ **Protection active!**

### Test 2: Pull Request acceptée

```bash
# Créer branche feature
git checkout -b test/verification-protection
echo "test PR" >> README.md
git add README.md
git commit -m "Test PR"
git push origin test/verification-protection

# Créer PR via GitHub Web
# → Compare & pull request
# → Create pull request
# → Approve (si 1 approbation requise)
# → Merge pull request

# Résultat: Merge réussi ✅
```

---

## 🔧 MODIFICATIONS ULTÉRIEURES

### Ajouter tests automatiques (plus tard)

Quand vous aurez configuré Playwright + GitHub Actions:

1. Retourner dans **Settings → Branches**
2. Éditer la règle "main" (⚙️ Edit)
3. **☑ Require status checks to pass before merging**
4. Rechercher et cocher:
   - `test` (nom du job GitHub Actions)
   - `Vercel – verone-backoffice` (déploiement preview)
5. Sauvegarder

### Ajouter protection contre force push

Si vous voulez empêcher complètement les force push:

```yaml
☐ Allow force pushes → Laisser DÉCOCHÉ
```

Déjà fait dans la configuration recommandée ✅

---

## 🚨 SITUATIONS D'URGENCE

### Hotfix critique en production

**Même avec protection, pas de raccourcis!**

```bash
# Créer branche hotfix
git checkout -b hotfix/critique-production
# Fix rapide
git add .
git commit -m "🚨 HOTFIX: Bug critique"
git push origin hotfix/critique-production

# PR accélérée
gh pr create --title "HOTFIX URGENT" --body "Bug bloquant clients"
# → Approve immédiatement
gh pr merge --merge

# Déploiement auto via Vercel (2-3 minutes)
```

**Note:** Même en urgence, ne jamais désactiver la protection!

### Désactiver temporairement (DÉCONSEILLÉ)

Si absolument nécessaire (cas extrême):

1. Settings → Branches → Règle "main" → ⚙️ Edit
2. Scroll en bas → **Delete**
3. Faire votre modification urgente
4. **IMMÉDIATEMENT recréer la règle** (même config)

**Danger:** Vous pourriez oublier de réactiver!

---

## 📊 MONITORING DES PROTECTIONS

### Vérifier si protection active

```bash
# Via GitHub CLI
gh api repos/Verone2021/Verone-backoffice/branches/main/protection
```

**Résultat si protégé:**
```json
{
  "required_pull_request_reviews": {
    "required_approving_review_count": 1
  },
  "enforce_admins": {
    "enabled": true
  }
}
```

### Via interface web

```
GitHub → Settings → Branches
```

Règle "main" visible avec icône 🛡️

---

## 🎯 WORKFLOW AVEC PROTECTION ACTIVE

### Schéma complet

```
Développement local
    ↓
Créer branche feature
    ↓
Commits sur feature
    ↓
Push branche feature
    ↓
Créer Pull Request
    ↓
Review + Approve (obligatoire)
    ↓
Tests passent (si configurés)
    ↓
Merge autorisé dans main
    ↓
Auto-déploiement Vercel
    ↓
Supprimer branche feature
```

### Différence avec workflow non protégé

#### AVANT (sans protection)
```bash
git checkout main
git commit -m "Fix rapide"
git push  # ✅ Direct en prod (DANGEREUX)
```

#### APRÈS (avec protection)
```bash
git checkout -b fix/bug
git commit -m "Fix rapide"
git push origin fix/bug
# PR → Review → Merge (SÉCURISÉ)
```

---

## 💡 BONNES PRATIQUES

### Règles d'or
1. **JAMAIS désactiver** la protection sauf urgence absolue
2. **TOUJOURS** passer par Pull Request, même pour petits fixes
3. **TOUJOURS** faire une review visuelle avant merge
4. **TOUJOURS** tester localement avant de créer la PR

### Exceptions acceptables
- ❌ "C'est juste un fix rapide" → **NON**, créer PR quand même
- ❌ "Il n'y a que moi sur le projet" → **NON**, protection contre vos propres erreurs
- ✅ "Hotfix critique clients bloqués" → **OUI**, mais via PR accélérée

---

## 🔗 RESSOURCES COMPLÉMENTAIRES

### Documentation GitHub officielle
- [About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)

### Guides Vérone connexes
- [Workflow GitHub post-production](../guides/GITHUB-WORKFLOW-POST-PRODUCTION.md)
- [Template Pull Request](../../.github/PULL_REQUEST_TEMPLATE.md)

---

## ✅ CHECKLIST ACTIVATION

Configuration finale à activer **APRÈS déploiement production**:

- [ ] Repository GitHub accessible
- [ ] Branche `main` déployée sur Vercel
- [ ] Settings → Branches → Add rule
- [ ] Pattern: `main`
- [ ] ☑ Require pull request (1 approval)
- [ ] ☑ Require conversation resolution
- [ ] ☑ Do not allow bypassing
- [ ] ☐ Allow force pushes (décoché)
- [ ] ☐ Allow deletions (décoché)
- [ ] Sauvegarder la règle
- [ ] Tester push direct (doit échouer)
- [ ] Tester PR (doit fonctionner)
- [ ] Documenter dans MEMORY-BANK

---

**Résumé ultra-simple:**
Protection active = Commits directs impossibles → Toujours créer PR → Review obligatoire → Production sécurisée

*Guide créé pour sécuriser la production Vérone - Configuration GitHub professionnelle 2025*
