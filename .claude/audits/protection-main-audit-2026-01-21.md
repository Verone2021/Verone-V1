# Audit Protection Branche Main - 2026-01-21

## État Actuel des Protections

### ✅ Protections ACTIVES

#### 1. Hook PreToolUse - Commit sur main (`.claude/settings.json`)
```bash
# Bloque automatiquement git commit sur main/master
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "❌ INTERDIT de commit sur main. Créer une feature branch: git checkout -b feat/XXX"
  exit 1
fi
```
**Status** : ✅ ACTIF
**Effet** : Claude ne peut PAS commit directement sur main

#### 2. Validation Format Commit (`.claude/settings.json`)
```bash
# Vérifie format [APP-XXX-001] ou [NO-TASK]
if ! echo "$TOOL_INPUT" | grep -qE "\[(BO|LM|WEB)-[A-Z0-9]+-[0-9]{3}\]|\[NO-TASK\]"; then
  echo "❌ Task ID manquant. Format: [APP-XXX-001] ou [NO-TASK]"
  exit 1
fi
```
**Status** : ✅ ACTIF

#### 3. GitHub Branch Protection
```json
{
  "enforce_admins": true,           // ✅ Admins respectent les règles
  "allow_force_pushes": false,      // ✅ Pas de force push
  "allow_deletions": false,         // ✅ Pas de suppression
  "required_status_checks": {...}   // ✅ CI doit passer
}
```
**Status** : ✅ ACTIF (partiel, voir lacunes)

#### 4. MANUAL_MODE.md - Documentation
**Rules** :
- Claude DOIT DEMANDER avant `gh pr create`
- Claude DOIT DEMANDER avant `gh pr merge`
- Claude DOIT DEMANDER avant toute action critique

**Status** : ✅ DOCUMENTÉ (mais pas appliqué par hooks)

---

## ❌ LACUNES CRITIQUES

### 1. Pas de Protection Required PR Reviews (GitHub)
```json
"required_pull_request_reviews": null  // ❌ MANQUANT
```

**Problème** :
- Un utilisateur avec droits push peut `git push origin main` directement
- Pas de review obligatoire avant merge

**Recommandation** : Activer sur GitHub
```bash
gh api repos/Verone2021/Verone-V1/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true
```

### 2. Pas de Hook PreToolUse pour `gh pr create`

**Problème** :
- Claude peut techniquement exécuter `gh pr create` sans confirmation
- Seulement bloqué par instructions (MANUAL_MODE.md)
- Pas de protection technique

**Recommandation** : Ajouter hook PreToolUse
```json
{
  "matcher": "Bash(gh pr create*)",
  "hooks": [{
    "type": "command",
    "command": "echo '⚠️ ATTENTION: Tu vas créer une PR. Confirme avec l'utilisateur d'abord.' && exit 1"
  }]
}
```

### 3. Pas de Hook PreToolUse pour `gh pr merge`

**Problème** :
- Claude peut techniquement merger une PR sans confirmation
- Seulement bloqué par instructions

**Recommandation** : Ajouter hook PreToolUse
```json
{
  "matcher": "Bash(gh pr merge*)",
  "hooks": [{
    "type": "command",
    "command": "echo '⚠️ ATTENTION: Tu vas merger une PR. Confirme avec l'utilisateur d'abord.' && exit 1"
  }]
}
```

### 4. Pas de Hook PreToolUse pour `git push origin main`

**Problème** :
- Le hook bloque `git commit` sur main
- Mais Claude pourrait faire `git push origin main` depuis une feature branch
  (ex: `git checkout feat/xxx && git push origin feat/xxx:main`)

**Recommandation** : Ajouter hook PreToolUse
```json
{
  "matcher": "Bash(git push*main*)",
  "hooks": [{
    "type": "command",
    "command": "bash -c 'if echo \"$TOOL_INPUT\" | grep -qE \"(origin|upstream) (main|master)\"; then echo \"❌ INTERDIT de push sur main directement. Créer une PR.\"; exit 1; fi'"
  }]
}
```

---

## 📋 Recommandations par Priorité

### 🔴 PRIORITÉ 1 (Critique - Sécurité)

#### A. Activer Required PR Reviews sur GitHub
```bash
gh api repos/Verone2021/Verone-V1/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field required_pull_request_reviews[require_code_owner_reviews]=false
```

**Effet** :
- ✅ EMPÊCHE push direct sur main (même avec droits)
- ✅ FORCE passage par PR
- ✅ REQUIERT 1 approbation minimum

#### B. Ajouter Hook pour `git push *main*`
**Fichier** : `.claude/settings.json`
```json
{
  "matcher": "Bash(git push*main*)",
  "hooks": [{
    "type": "command",
    "command": "bash -c 'if echo \"$TOOL_INPUT\" | grep -qE \"origin (main|master)\"; then echo \"❌ INTERDIT: push direct sur main. Utilise une PR.\"; exit 1; fi'"
  }]
}
```

### 🟠 PRIORITÉ 2 (Important - Workflow)

#### C. Ajouter Hook pour `gh pr create`
```json
{
  "matcher": "Bash(gh pr create*)",
  "hooks": [{
    "type": "command",
    "command": "echo '⚠️ STOP: Demander confirmation utilisateur avant gh pr create' && exit 1"
  }]
}
```

#### D. Ajouter Hook pour `gh pr merge`
```json
{
  "matcher": "Bash(gh pr merge*)",
  "hooks": [{
    "type": "command",
    "command": "echo '⚠️ STOP: Demander confirmation utilisateur avant gh pr merge' && exit 1"
  }]
}
```

### 🟡 PRIORITÉ 3 (Nice to have - Documentation)

#### E. Mettre à jour MANUAL_MODE.md
Ajouter section "Protections Techniques" expliquant les hooks

#### F. Créer script de vérification
`.claude/scripts/check-protections.sh` :
```bash
#!/bin/bash
echo "🔍 Vérification protections main..."
# Vérifier GitHub branch protection
# Vérifier hooks PreToolUse
# Afficher statut
```

---

## 🎯 Plan d'Action Recommandé

### Option 1 : Protection Maximale (Recommandée)
1. ✅ Activer Required PR Reviews sur GitHub
2. ✅ Ajouter les 3 hooks PreToolUse (push, pr create, pr merge)
3. ✅ Tester avec un agent de test
4. ✅ Documenter dans MANUAL_MODE.md

**Avantages** :
- Protection multi-couches
- Impossible pour Claude de bypass
- Force workflow professionnel

**Inconvénients** :
- Claude devra TOUJOURS demander pour PR (même si trivial)
- Peut ralentir workflow sur petits changements

### Option 2 : Protection Modérée (Compromis)
1. ✅ Activer Required PR Reviews sur GitHub
2. ✅ Ajouter hook pour `git push *main*`
3. ⚠️ Garder confiance pour `gh pr create/merge` (docs seulement)

**Avantages** :
- Empêche accidents graves (push direct main)
- Garde flexibilité pour PR (confiance + docs)

**Inconvénients** :
- Claude pourrait techniquement créer PR sans demander
- Dépend de l'obéissance aux docs

---

## 🧪 Tests de Validation

### Test 1 : Tentative Commit sur Main
```bash
git checkout main
git commit -m "[NO-TASK] test"
# Attendu : ❌ BLOQUÉ par hook
```

### Test 2 : Tentative Push sur Main
```bash
git checkout feat/test
git push origin feat/test:main
# Attendu : ❌ BLOQUÉ par hook (si ajouté)
```

### Test 3 : Tentative PR Create
```bash
gh pr create --title "test"
# Attendu : ⚠️ AVERTISSEMENT (si hook ajouté)
```

### Test 4 : Workflow Normal
```bash
git checkout -b feat/test
git commit -m "[NO-TASK] test"
git push origin feat/test
# Puis demander approbation utilisateur
gh pr create --title "test"  # Après confirmation
```

---

## 📊 Matrice de Protection Actuelle vs Recommandée

| Action | Protection Actuelle | Protection Recommandée | Gap |
|--------|---------------------|------------------------|-----|
| `git commit` sur main | ✅ BLOQUÉ (hook) | ✅ BLOQUÉ (hook) | ✅ OK |
| `git push origin main` | ❌ POSSIBLE | ✅ BLOQUÉ (hook + GitHub) | 🔴 CRITIQUE |
| `gh pr create` | ⚠️ Docs seulement | ✅ BLOQUÉ (hook) | 🟠 IMPORTANT |
| `gh pr merge` | ⚠️ Docs seulement | ✅ BLOQUÉ (hook) | 🟠 IMPORTANT |
| Push via GitHub UI | ❌ POSSIBLE | ✅ BLOQUÉ (Required Reviews) | 🔴 CRITIQUE |
| Force push | ✅ BLOQUÉ (GitHub) | ✅ BLOQUÉ (GitHub) | ✅ OK |

---

## 🚀 Implémentation Rapide (5 min)

### Étape 1 : GitHub Protection (1 min)
```bash
gh api repos/Verone2021/Verone-V1/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true
```

### Étape 2 : Ajouter Hooks (2 min)
Éditer `.claude/settings.json` - ajouter dans `PreToolUse` :
```json
{
  "matcher": "Bash(git push*main*)",
  "hooks": [{"type": "command", "command": "bash -c 'if echo \"$TOOL_INPUT\" | grep -qE \"origin (main|master)\"; then echo \"❌ Push direct sur main interdit\"; exit 1; fi'"}]
},
{
  "matcher": "Bash(gh pr create*)",
  "hooks": [{"type": "command", "command": "echo '⚠️ Demander confirmation avant gh pr create' && exit 1"}]
},
{
  "matcher": "Bash(gh pr merge*)",
  "hooks": [{"type": "command", "command": "echo '⚠️ Demander confirmation avant gh pr merge' && exit 1"}]
}
```

### Étape 3 : Test (2 min)
```bash
# Test 1
git checkout main && git commit -m "test" 2>&1 | grep "INTERDIT"

# Test 2
git push origin main 2>&1 | grep "interdit"

# Test 3
gh pr create 2>&1 | grep "confirmation"
```

---

## 📌 Conclusion

**État actuel** : 🟡 Protection PARTIELLE
- ✅ Commits sur main bloqués
- ❌ Push direct sur main possible (lacune critique)
- ⚠️ PR create/merge basé sur docs (pas technique)

**État recommandé** : 🟢 Protection COMPLÈTE
- ✅ Multi-couches (hooks + GitHub)
- ✅ Impossible pour Claude de bypass
- ✅ Force workflow professionnel

**Action immédiate** : Implémenter PRIORITÉ 1 (GitHub + hook push)

---

**Audit par** : Claude Sonnet 4.5
**Date** : 2026-01-21
**Version** : 1.0.0
