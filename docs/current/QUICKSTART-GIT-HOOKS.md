# Quick Start : Workflow Git Optimisé

**TL;DR** : Pre-push hook optimisé → Push 5-8 min → **30-60s** ✨

---

## Ce Qui a Changé

### Avant (Lent 😤)

```bash
git push
# 🏗️ Validation build avant push...
# ⏳ Type-check... (30s)
# ⏳ Build complet... (5-8 min)
# ✅ Push autorisé
```

**Temps** : 5-8 minutes d'attente à chaque push

### Après (Rapide 🚀)

```bash
git push
# 🔍 Type-check avant push...
# ⏳ Type-check... (30-60s)
# ✅ Type-check réussi, push autorisé
# ℹ️  Le build complet sera validé par GitHub Actions
```

**Temps** : 30-60 secondes → Continuer à coder immédiatement

---

## Workflow Quotidien

### 1. Développer Normalement

```bash
# Créer feature branch
git checkout -b feat/BO-CUST-112-add-badge

# Coder
code...
```

### 2. Commit Fréquent (5-10s)

```bash
git add .
git commit -m "[BO-CUST-112] step 1: add icon"
# ✅ Pre-commit : ESLint + Prettier (5-10s)
```

### 3. Push Rapide (30-60s)

```bash
git push
# ✅ Pre-push : Type-check (30-60s)
# ℹ️  GitHub Actions démarre le build en arrière-plan
```

### 4. Continuer à Travailler

```bash
# Pendant que CI valide (10-15 min en parallèle)
code...
git commit -m "[BO-CUST-112] step 2: add logic"
git push  # 30-60s encore
```

### 5. Créer PR (Quand Feature Complète)

```bash
gh pr create --title "[BO-CUST-112] feat: add customer badge"
# ✅ CI a déjà validé → PR mergeable immédiatement
```

---

## Gains de Temps

| Scénario           | Avant   | Après  | Gain           |
| ------------------ | ------- | ------ | -------------- |
| 1 push             | 5-8 min | 30-60s | **-5 à 7 min** |
| 3 pushs (feature)  | 24 min  | 3 min  | **-21 min**    |
| 15 pushs (semaine) | 120 min | 15 min | **-1h45**      |

**Par mois** : Économie de **~5 heures** d'attente ⏱️

---

## FAQ Rapide

### Q: Et si mon code ne build pas ?

**R** : CI le détectera en 10-15 min et bloquera la PR.

```bash
# 1. Push (type-check OK)
git push  # 30s ✅

# 2. CI détecte erreur build (10-15 min)
# ❌ GitHub Actions : Build failed

# 3. Notification GitHub
# Email + Commentaire automatique sur PR

# 4. Correction rapide
git commit -m "fix: correct build error"
git push  # 30s
# ✅ CI valide
```

**Impact** : Détecté rapidement, correction 1 commit

### Q: Dois-je builder localement avant push ?

**R** : Non, sauf si vous voulez.

**Optionnel** (si vous voulez tester) :

```bash
# Build package spécifique (1-2 min)
pnpm --filter @verone/back-office build

# Build complet (5-8 min) - RAREMENT NÉCESSAIRE
pnpm build
```

**Recommandé** : Laisser CI valider (workflow optimisé)

### Q: Type-check suffit ?

**R** : Oui, 95% du temps.

- ✅ Type-check attrape 95% erreurs compilation
- ✅ Build errors rares en pratique
- ✅ CI valide toujours le build complet
- ✅ PR bloquée si build échoue (branch protection)

---

## Vérification

### Test 1 : Push Normal

```bash
echo "// test" >> apps/back-office/src/app/page.tsx
git add .
git commit -m "[TEST] verify pre-push optimization"
time git push

# Attendu : < 1 minute (vs 5-8 min avant)
```

### Test 2 : Vérifier CI

```bash
# Aller sur GitHub
open https://github.com/[votre-repo]/actions

# Workflow "Quality Checks" doit démarrer automatiquement
# Status : ✅ All checks passed (10-15 min)
```

---

## Commandes Utiles

```bash
# Type-check rapide (local)
pnpm type-check  # 30-60s

# Build package spécifique (optionnel)
pnpm --filter @verone/back-office build  # 1-2 min

# Voir statut CI
gh pr checks  # Depuis feature branch

# Voir logs CI
gh run view  # Dernière exécution GitHub Actions
```

---

## Documentation Complète

**Pour en savoir plus** :

- 📖 **Guide Développeur** : `docs/claude/git-workflow-optimized.md`
- 📊 **Rapport Détaillé** : `docs/current/git-hooks-optimization-report.md`
- 📋 **Règles Git** : `.claude/rules/dev/git-workflow.md`

---

## Support

**Problème ?** Vérifier que hooks sont installés :

```bash
# Réinstaller hooks si nécessaire
pnpm prepare

# Vérifier pre-push hook
cat .husky/pre-push
# Doit afficher "Type-check avant push..." (pas "Validation build...")
```

---

**Version** : 1.0.0 (2026-01-30)

**Enjoy the speed! 🚀**
