# Plan: Enforcement du Workflow Professionnel 2026

**Date**: 2026-01-17
**Contexte**: Corriger les dérives de Claude Code (PRs multiples, pas de commits/push) et faire respecter CLAUDE.md v9.0.0
**Objectif**: Imposer le workflow Research-Plan-Execute avec commits fréquents et UNE PR par feature

---

## 🎯 Problèmes Identifiés

### 1. Claude Code créait des PRs anarchiques
- ❌ PRs créées AVANT les commits/push
- ❌ Plusieurs PRs pour une seule feature (ex: PR #56 ESLint, #57 docs, #55 Qonto)
- ❌ PRs créées sans plan ni workflow structuré
- ❌ Pas de commits intermédiaires (save points manquants)

### 2. Non-respect du workflow professionnel
- ❌ Pas de phase Research (code direct sans lire l'existant)
- ❌ Pas de phase Plan (EnterPlanMode jamais utilisé pour tasks complexes)
- ❌ Pas de TDD (tests après le code, pas avant)
- ❌ Commits rares ou absents (perte de travail possible)

### 3. Conséquences
- 🔴 Historique Git pollué
- 🔴 Difficulté à suivre le travail en cours
- 🔴 Pas de backup continu (risque de perte)
- 🔴 PRs difficiles à reviewer (trop de scope)

---

## 📋 Nouveau Workflow à Imposer (CLAUDE.md v9.0.0)

### Phase 1: RESEARCH (Obligatoire pour toute task)
```bash
# AVANT DE CODER: Explorer et comprendre
- Lire fichiers pertinents (Read, Glob, Grep, Serena)
- Identifier patterns existants
- Localiser fichiers critiques
- Documenter dépendances

# Outils: Read, Glob, Grep, Serena
# Durée: 2-5 minutes
# Output: Compréhension claire du contexte
```

### Phase 2: PLAN (EnterPlanMode pour tasks complexes)
```bash
# Créer plan détaillé AVANT de coder
- EnterPlanMode pour tasks multi-fichiers ou complexes
- Identifier au moins 2 approches possibles
- Lister edge cases
- Estimer impact (fichiers touchés, breaking changes)

# Outils: EnterPlanMode, AskUserQuestion
# Durée: 3-10 minutes
# Output: Plan approuvé par l'utilisateur
```

### Phase 3: TEST (TDD - Tests AVANT code)
```bash
# Écrire tests qui échouent d'abord (RED)
npm run test:e2e          # Tests E2E Playwright
npm run test:unit         # Tests unitaires
npm run type-check        # Validation TypeScript

# Pattern: RED → GREEN → REFACTOR
# Durée: 5-15 minutes
# Output: Tests qui définissent le comportement attendu
```

### Phase 4: EXECUTE (Implémentation par étapes)
```bash
# Coder solution minimale pour passer les tests (GREEN)
- Suivre patterns existants
- Code minimal nécessaire
- Pas de sur-engineering

# Durée: Variable selon complexité
# Output: Code qui passe les tests
```

### Phase 5: VERIFY (Validation qualité)
```bash
# À CHAQUE étape logique
npm run type-check        # TypeScript OK
npm run build             # Build production OK
npm run e2e:smoke         # Tests UI OK (si frontend modifié)

# Durée: 2-5 minutes
# Output: Tous les checks verts
```

### Phase 6: COMMIT (Save points fréquents)
```bash
# RÈGLE D'OR: Commit + Push à CHAQUE étape logique (toutes les 10-20 min max)

git checkout -b feat/APP-DOMAIN-NNN-description
git add .
git commit -m "[APP-DOMAIN-NNN] step 1: description"
git push  # ← OBLIGATOIRE: Backup sur GitHub + CI check

# Répéter pour chaque step:
git add .
git commit -m "[APP-DOMAIN-NNN] step 2: description"
git push

git add .
git commit -m "[APP-DOMAIN-NNN] step 3: description"
git push

# Avantages:
# - ✅ Backup continu (pas de perte si crash)
# - ✅ CI valide chaque étape
# - ✅ Historique clair des steps
# - ✅ Rollback facile si problème
```

### Phase 7: PR (UNE SEULE, à la fin)
```bash
# UNIQUEMENT quand feature 100% complète

gh pr create \
  --title "[APP-DOMAIN-NNN] feat: description complète" \
  --body "
## Summary
- Liste des changements principaux
- Résumé des commits (step 1, 2, 3...)

## Test Plan
- [x] Type-check passes
- [x] Build succeeds
- [x] E2E tests pass
- [x] Manual testing done

## Commits (tous inclus dans cette PR)
- step 1: ...
- step 2: ...
- step 3: ...
- step 4: ...
"

# ❌ INTERDIT: Créer plusieurs PRs pour une feature
# ✅ CORRECT: 1 feature = 1 branche = N commits = 1 PR
```

---

## 🛠️ Actions à Entreprendre

### Action 1: Nettoyer les PRs Anarchiques Actuelles

**Objectif**: Fermer/consolider les PRs créées sans respecter le workflow

```bash
# 1. Auditer les PRs ouvertes récentes
gh pr list --state open --limit 20

# 2. Identifier les PRs créées sans workflow (ex: #56, #57 mentionnées)
gh pr view 56
gh pr view 57

# 3. Décider pour chaque PR:
# - Si incomplète ou hors scope: FERMER
gh pr close 56 --comment "Fermée: créée hors workflow, travail à consolider dans PR principale"

# - Si utile mais fragmentée: CONSOLIDER dans branche principale
git checkout feat/branche-principale
git cherry-pick <commits-de-PR-56>
gh pr close 56 --comment "Commits consolidés dans PR #XXX"

# 4. Garder UNE SEULE PR par feature complète
```

**Critères de nettoyage**:
- ❌ PR sans commits: FERMER immédiatement
- ❌ PR créée avant d'avoir fini le travail: FERMER et consolider
- ❌ Plusieurs PRs pour même feature: CONSOLIDER en une seule
- ✅ Une PR complète avec tous les commits: GARDER

---

### Action 2: Créer Hook de Validation Git/PR

**Objectif**: Bloquer les anti-patterns automatiquement

#### Hook 1: Pre-Push (Valider commits fréquents)
```bash
# Créer .git/hooks/pre-push
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Vérifier qu'on n'essaie pas de push sans commits récents
LAST_COMMIT_TIME=$(git log -1 --format=%ct)
CURRENT_TIME=$(date +%s)
TIME_DIFF=$((CURRENT_TIME - LAST_COMMIT_TIME))

# Si dernier commit > 30 min, warning
if [ $TIME_DIFF -gt 1800 ]; then
  echo "⚠️  WARNING: Dernier commit il y a plus de 30 min"
  echo "💡 Best practice: Commits fréquents toutes les 10-20 min"
  echo "📦 Considérer faire un commit intermédiaire avant de push"
fi

exit 0
EOF

chmod +x .git/hooks/pre-push
```

#### Hook 2: Validation Format Commit (Déjà existant)
```bash
# S'assurer que le hook PreToolUse existe et valide le format
# Format requis: [APP-DOMAIN-NNN] type: description

# Ce hook est déjà mentionné dans CLAUDE.md:254
# "Validation automatique: Hook PreToolUse bloque si format invalide"
```

#### Hook 3: Bloquer PR prématurées (Script custom)
```bash
# Créer script .claude/scripts/validate-pr-ready.sh
mkdir -p .claude/scripts
cat > .claude/scripts/validate-pr-ready.sh << 'EOF'
#!/bin/bash

# Valider qu'une feature est prête pour PR

echo "🔍 Validation pre-PR..."

# 1. Vérifier que tous les tests passent
npm run type-check || { echo "❌ type-check failed"; exit 1; }
npm run build || { echo "❌ build failed"; exit 1; }

# 2. Vérifier qu'il y a au moins 2 commits (pas juste 1)
COMMIT_COUNT=$(git log origin/main..HEAD --oneline | wc -l)
if [ "$COMMIT_COUNT" -lt 2 ]; then
  echo "⚠️  Seulement $COMMIT_COUNT commit(s)"
  echo "💡 Best practice: Plusieurs commits atomiques par feature"
  read -p "Continuer quand même? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 3. Vérifier qu'on est sur une branche feature
BRANCH=$(git branch --show-current)
if [[ ! $BRANCH =~ ^(feat|fix|docs)/ ]]; then
  echo "❌ Branche doit commencer par feat/, fix/, ou docs/"
  exit 1
fi

echo "✅ Pre-PR validation passed"
EOF

chmod +x .claude/scripts/validate-pr-ready.sh
```

**Utilisation**:
```bash
# Avant de créer une PR, exécuter:
./.claude/scripts/validate-pr-ready.sh && gh pr create
```

---

### Action 3: Documenter le Workflow dans Checklist

**Objectif**: Aide-mémoire visuel pour Claude

```bash
# Créer .claude/WORKFLOW-CHECKLIST.md
cat > .claude/WORKFLOW-CHECKLIST.md << 'EOF'
# Workflow Checklist - À Suivre Pour CHAQUE Feature

## ✅ Phase 1: RESEARCH (2-5 min)
- [ ] Lire fichiers pertinents (Read, Glob, Grep)
- [ ] Comprendre architecture actuelle
- [ ] Identifier patterns existants
- [ ] Documenter dépendances

## ✅ Phase 2: PLAN (3-10 min)
- [ ] EnterPlanMode si task complexe (multi-fichiers)
- [ ] Identifier 2+ approches possibles
- [ ] Lister edge cases
- [ ] Obtenir approbation utilisateur

## ✅ Phase 3: TEST (5-15 min)
- [ ] Écrire tests qui échouent (RED)
- [ ] Valider que tests capturent bien le comportement attendu

## ✅ Phase 4-6: EXECUTE + VERIFY + COMMIT (Boucle)

Pour CHAQUE étape logique (toutes les 10-20 min):

- [ ] Écrire code minimal pour passer tests (GREEN)
- [ ] Refactorer si nécessaire (REFACTOR)
- [ ] Vérifier qualité:
  ```bash
  npm run type-check
  npm run build
  npm run e2e:smoke  # Si UI modifiée
  ```
- [ ] Commit atomique + push:
  ```bash
  git add .
  git commit -m "[APP-DOMAIN-NNN] step N: description"
  git push  # ← OBLIGATOIRE
  ```
- [ ] CI passe (vérifier GitHub Actions)

Répéter jusqu'à feature complète.

## ✅ Phase 7: PR (Une fois feature 100% complète)

- [ ] Tous les tests passent
- [ ] Build production OK
- [ ] Au moins 2-3 commits atomiques
- [ ] Branche à jour avec main
- [ ] Valider pre-PR:
  ```bash
  ./.claude/scripts/validate-pr-ready.sh
  ```
- [ ] Créer UNE SEULE PR:
  ```bash
  gh pr create \
    --title "[APP-DOMAIN-NNN] feat: description" \
    --body "Summary + Test Plan + Liste commits"
  ```

## ❌ Anti-Patterns à ÉVITER

- ❌ Coder sans avoir lu l'existant (skip RESEARCH)
- ❌ Pas de plan pour task complexe (skip PLAN)
- ❌ Tests après le code (pas de TDD)
- ❌ Commits rares ou absents (pas de backup)
- ❌ PR créée avant d'avoir fini (feature incomplète)
- ❌ Plusieurs PRs pour une feature (fragmenter le travail)

## 📚 Références

- CLAUDE.md v9.0.0 (sections "Workflow" et "Git/PR")
- Mémoire: workflow-professionnel-2026
EOF
```

---

### Action 4: Créer Mémoire de Rappel pour Claude

**Objectif**: Mémoire Serena que Claude lira automatiquement

```bash
# Cette mémoire sera ajoutée via Serena write_memory
# Contenu déjà créé dans workflow-professionnel-2026
# Mais ajouter un rappel spécifique anti-patterns
```

**Contenu mémoire supplémentaire** (à créer):
```markdown
# workflow-enforcement-rules (mémoire Serena)

## 🚨 RÈGLES ABSOLUES (Ne JAMAIS violer)

### 1. Commits Fréquents OBLIGATOIRES
- ⏰ Commit + push toutes les 10-20 minutes MAX
- 📦 Chaque étape logique = 1 commit
- ☁️ Chaque commit DOIT être pushé (backup GitHub)

### 2. UNE SEULE PR par Feature
- ❌ INTERDIT: Créer PR avant d'avoir fini
- ❌ INTERDIT: Créer plusieurs PRs pour même feature
- ✅ CORRECT: Feature 100% complète → 1 PR avec tous les commits

### 3. Workflow Obligatoire
- Research → Plan → Test → Execute → Verify → Commit → (Répéter) → PR
- EnterPlanMode pour tasks complexes (multi-fichiers, architecture)
- TDD: Tests AVANT code

### 4. Validation Avant PR
```bash
npm run type-check  # DOIT passer
npm run build       # DOIT passer
./.claude/scripts/validate-pr-ready.sh  # DOIT passer
```

## 🔴 Si Claude viole ces règles

L'utilisateur DOIT:
1. Stopper immédiatement
2. Rappeler CLAUDE.md v9.0.0
3. Demander à Claude de lire workflow-professionnel-2026
4. Redémarrer avec le bon workflow

## ✅ Workflow Correct Exemple

```bash
# Feature: Ajouter système notifications

# RESEARCH (5 min)
Read notifications existantes
Grep "notification" dans codebase
Identifier patterns

# PLAN (5 min)
EnterPlanMode → Plan approuvé

# TEST (10 min)
Créer notification.test.ts (tests qui échouent)
git commit -m "[BO-NOTIF-001] step 1: add failing tests"
git push

# EXECUTE Step 1 (15 min)
Créer composant NotificationBell
Tests passent (GREEN)
npm run type-check && npm run build
git commit -m "[BO-NOTIF-001] step 2: create NotificationBell component"
git push

# EXECUTE Step 2 (15 min)
Ajouter state management
Tests passent
npm run type-check && npm run build
git commit -m "[BO-NOTIF-001] step 3: add state management"
git push

# EXECUTE Step 3 (10 min)
Intégrer dans Layout
Tests passent
npm run type-check && npm run build
git commit -m "[BO-NOTIF-001] step 4: integrate in Layout"
git push

# PR (2 min)
./.claude/scripts/validate-pr-ready.sh
gh pr create --title "[BO-NOTIF-001] feat: add notification system" \
  --body "4 commits, all tests pass, ready for review"

# Total: ~60 min, 4 commits, 1 PR ✅
```
```

---

## 📊 Métriques de Succès

### Avant Enforcement (Problèmes)
- ❌ PRs multiples par feature (ex: 3 PRs pour Qonto)
- ❌ Commits rares (1 commit toutes les 2h)
- ❌ Pas de backup (risque perte travail)
- ❌ CI échoue souvent (pas de vérification avant push)

### Après Enforcement (Objectifs)
- ✅ 1 PR par feature (consolidation)
- ✅ Commits toutes les 10-20 min (backup continu)
- ✅ CI succès rate > 95%
- ✅ Pas de perte de travail
- ✅ Historique Git propre et lisible

---

## 🎯 Plan d'Implémentation

### Phase 1: Nettoyage (30 min)
1. ✅ Auditer PRs ouvertes (gh pr list)
2. ✅ Fermer PRs fragmentées (#56, #57 si existent)
3. ✅ Consolider commits dans branche principale
4. ✅ Merger UNE PR complète

### Phase 2: Setup Hooks (15 min)
1. ✅ Créer .git/hooks/pre-push (warning commits fréquents)
2. ✅ Créer .claude/scripts/validate-pr-ready.sh
3. ✅ Tester hooks localement

### Phase 3: Documentation (10 min)
1. ✅ Créer .claude/WORKFLOW-CHECKLIST.md
2. ✅ Créer mémoire workflow-enforcement-rules (Serena)
3. ✅ Ajouter lien dans CLAUDE.md si nécessaire

### Phase 4: Validation (10 min)
1. ✅ Lire CLAUDE.md v9.0.0 (vérifier cohérence)
2. ✅ Lire workflow-professionnel-2026 (mémoire)
3. ✅ Tester workflow sur petite feature test
4. ✅ Confirmer avec utilisateur

---

## 📚 Ressources et Références

### Documents à Lire (Ordre prioritaire)
1. **CLAUDE.md v9.0.0** (source de vérité)
   - Section "Workflow de Développement Professionnel"
   - Section "Autonomie de Claude" (90/10 autonome/validation)
   - Section "Stratégie Git & Pull Requests"

2. **Mémoire: workflow-professionnel-2026** (référence complète)
   - Recherches et sources
   - Workflow visuel complet
   - Exemples concrets

3. **WORKFLOW-CHECKLIST.md** (à créer, aide-mémoire)
   - Checklist phase par phase
   - Anti-patterns à éviter

### Scripts et Hooks
1. `.git/hooks/pre-push` (warning commits fréquents)
2. `.claude/scripts/validate-pr-ready.sh` (validation pre-PR)
3. Hook PreToolUse (validation format commit)

### Sources Externes
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [TDD with AI Agents - Kent Beck](https://newsletter.pragmaticengineer.com/p/tdd-ai-agents-and-coding-with-kent)
- [Trunk-based Development](https://trunkbaseddevelopment.com/)

---

## ✅ Checklist de Complétion

Avant de considérer ce plan comme implémenté:

- [ ] Toutes les PRs anarchiques nettoyées/consolidées
- [ ] Hooks Git créés et testés
- [ ] WORKFLOW-CHECKLIST.md créé
- [ ] Mémoire workflow-enforcement-rules créée (Serena)
- [ ] Test du workflow sur feature réelle
- [ ] Validation utilisateur
- [ ] Commit du plan: `[NO-TASK] docs: add workflow enforcement plan`

---

## 🚀 Prochaines Étapes (Post-Implémentation)

### Monitoring (Semaine 1)
- Vérifier que commits sont fréquents (toutes les 10-20 min)
- Compter nombre de PRs par feature (objectif: 1)
- Mesurer CI success rate (objectif: >95%)

### Ajustements (Semaine 2-4)
- Affiner hooks si faux positifs
- Améliorer scripts validation
- Documenter cas edge cases

### Amélioration Continue (Mois 2+)
- Automatiser plus de validations
- Intégrer métriques dans CI/CD
- Former utilisateurs sur workflow

---

**Créé le**: 2026-01-17
**Basé sur**: CLAUDE.md v9.0.0
**Statut**: Prêt pour implémentation
**Transférable**: Oui (autonome, complet)
