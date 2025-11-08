# 🚀 GitHub Workflow Post-Production - Guide Complet

**Date de création**: 8 octobre 2025
**Contexte**: Transition du workflow trunk-based vers GitHub Flow après déploiement production
**Auteur**: Guide pour Romeo Dos Santos (développeur Vérone)

---

## 🎯 POURQUOI CE CHANGEMENT?

### Situation avant production

- Développement direct sur `main`
- Commits immédiats sans review
- 1 seul développeur (Romeo)
- Pas de risque (pas de clients)

### Situation après production

- `main` = code en production chez les clients
- Besoin de stabilité absolue
- Tester avant de déployer
- Possibilité de rollback facile

---

## 📊 WORKFLOW ACTUEL VS FUTUR

### ACTUEL (Trunk-Based - Avant Production)

```bash
Modification code
    ↓
git add .
    ↓
git commit -m "Message"
    ↓
git push origin main
    ↓
Fin (pas de validation)
```

### FUTUR (GitHub Flow - Après Production)

```bash
Créer branche feature
    ↓
Développement + commits
    ↓
Push branche feature
    ↓
Pull Request (PR)
    ↓
Review visuelle des changements
    ↓
Merge dans main
    ↓
Auto-déploiement Vercel
    ↓
Nettoyage branche
```

---

## 🛠️ WORKFLOW GITHUB FLOW DÉTAILLÉ

### ÉTAPE 1: Créer une branche feature

```bash
# Toujours partir de main à jour
git checkout main
git pull origin main

# Créer branche feature (nom descriptif)
git checkout -b feature/nom-fonctionnalite

# Exemples de noms de branches
git checkout -b feature/filtres-catalogue
git checkout -b feature/dashboard-metrics
git checkout -b fix/bug-upload-images
git checkout -b refactor/optimisation-queries
```

**Convention de nommage:**

- `feature/` = nouvelle fonctionnalité
- `fix/` = correction bug
- `refactor/` = refactoring code
- `docs/` = documentation uniquement

### ÉTAPE 2: Développer sur la branche

```bash
# Travailler normalement
# Modifier fichiers avec VSCode/Claude Code

# Faire des commits réguliers (plusieurs commits OK!)
git add .
git commit -m "✨ FEAT: Composant filtres produits"

# Continuer développement
git add .
git commit -m "✨ FEAT: Logique filtrage par catégorie"

# Corriger un bug découvert
git add .
git commit -m "🐛 FIX: Bug tri alphabétique"
```

**Bonnes pratiques:**

- Faire des commits atomiques (1 fonctionnalité = 1 commit)
- Messages clairs avec emojis (comme actuellement)
- Tester localement avant de pousser

### ÉTAPE 3: Pousser la branche sur GitHub

```bash
# Push de la branche feature vers GitHub
git push origin feature/nom-fonctionnalite

# Si c'est le premier push de cette branche
git push -u origin feature/nom-fonctionnalite
```

**Résultat:** Branche visible sur GitHub (pas encore fusionnée dans main)

### ÉTAPE 4: Créer une Pull Request (PR)

#### Via GitHub Web (Recommandé pour novices)

1. Aller sur https://github.com/Verone2021/Verone-backoffice
2. Cliquer sur bouton jaune "Compare & pull request"
3. Vérifier:
   - Base: `main` (destination)
   - Compare: `feature/nom-fonctionnalite` (source)
4. Titre: Reprendre le nom de la fonctionnalité
5. Description: Résumé des changements
6. Cliquer "Create pull request"

#### Via GitHub CLI (Avancé)

```bash
gh pr create --title "Filtres catalogue produits" --body "Ajout système filtres avec catégories"
```

### ÉTAPE 5: Review de la Pull Request

**Même si vous êtes seul, faites une review!**

Sur GitHub, dans la PR:

1. Onglet "Files changed" → Voir tous les changements
2. Vérifier:
   - ✅ Pas de code debug oublié
   - ✅ Pas de console.log inutiles
   - ✅ Pas de secrets/tokens exposés
   - ✅ Code cohérent avec le reste
3. Si OK → "Approve" (si protection activée)

### ÉTAPE 6: Merger la Pull Request

```bash
# Option 1: Via GitHub Web (Recommandé)
Bouton "Merge pull request" → "Confirm merge"

# Option 2: Via GitHub CLI
gh pr merge --merge
```

**Types de merge:**

- **Merge commit** (Recommandé): Garde tout l'historique
- **Squash and merge**: Combine tous les commits en 1
- **Rebase and merge**: Linéarise l'historique

**Pour Vérone:** Utiliser **Merge commit** (garde traçabilité)

### ÉTAPE 7: Mise à jour locale + Nettoyage

```bash
# Revenir sur main
git checkout main

# Récupérer les changements mergés
git pull origin main

# Supprimer branche feature locale (nettoyage)
git branch -d feature/nom-fonctionnalite

# Supprimer branche feature remote (optionnel)
git push origin --delete feature/nom-fonctionnalite
```

**Note:** GitHub peut supprimer automatiquement la branche après merge (configuration)

---

## 🔥 EXEMPLE COMPLET - WORKFLOW RÉEL

### Scénario: Ajouter filtres de recherche dans le catalogue

```bash
# 1. Partir de main à jour
git checkout main
git pull origin main

# 2. Créer branche feature
git checkout -b feature/filtres-recherche-catalogue

# 3. Développement (plusieurs sessions)
# Session 1: Composant UI
git add src/components/business/catalogue-filters.tsx
git commit -m "✨ FEAT: Composant filtres catalogue (UI)"

# Session 2: Logique filtrage
git add src/hooks/use-catalogue-filters.ts
git commit -m "✨ FEAT: Hook filtrage produits (logique)"

# Session 3: Intégration
git add src/app/catalogue/page.tsx
git commit -m "✨ FEAT: Intégration filtres dans page catalogue"

# Session 4: Bug fix
git add src/hooks/use-catalogue-filters.ts
git commit -m "🐛 FIX: Correction reset filtres"

# 4. Push vers GitHub
git push -u origin feature/filtres-recherche-catalogue

# 5. Créer PR (GitHub Web)
# → Aller sur GitHub
# → "Compare & pull request"
# → Titre: "Filtres de recherche catalogue"
# → Description: "Ajout système filtres par catégorie, prix, stock"
# → "Create pull request"

# 6. Review (GitHub Web)
# → Onglet "Files changed"
# → Vérifier 4 fichiers modifiés
# → Tout est OK → "Approve"

# 7. Merge (GitHub Web)
# → "Merge pull request"
# → "Confirm merge"

# 8. Nettoyage local
git checkout main
git pull origin main
git branch -d feature/filtres-recherche-catalogue

# 9. Vérifier déploiement Vercel
# → Vercel auto-déploie main
# → Attendre 2-3 minutes
# → Vérifier https://verone-backoffice.vercel.app
```

---

## 🛡️ SITUATIONS SPÉCIALES

### Hotfix urgent en production

```bash
# Créer branche hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/bug-critique-paiements

# Fix rapide
git add src/lib/payments.ts
git commit -m "🚨 HOTFIX: Bug calcul TVA paiements"

# Push + PR accélérée
git push -u origin hotfix/bug-critique-paiements
gh pr create --title "HOTFIX: Bug critique paiements" --body "Bug bloquant production"

# Merge immédiat sans attendre
gh pr merge --merge

# Retour sur main
git checkout main
git pull origin main
git branch -d hotfix/bug-critique-paiements
```

### Plusieurs features en parallèle

```bash
# Feature 1: Dashboard
git checkout -b feature/dashboard-metrics
# Développement...
git push -u origin feature/dashboard-metrics

# Revenir sur main pour feature 2
git checkout main
git checkout -b feature/export-pdf
# Développement...
git push -u origin feature/export-pdf

# Créer 2 PR séparées
# Merger dans l'ordre souhaité
```

### Annuler une branche avant merge

```bash
# Supprimer branche locale
git checkout main
git branch -D feature/mauvaise-idee

# Supprimer branche remote
git push origin --delete feature/mauvaise-idee

# Fermer la PR sur GitHub
# → "Close pull request" (sans merger)
```

---

## ✅ CHECKLIST AVANT MERGE

Avant de merger une PR, vérifier:

- [ ] Tous les tests passent (quand implémentés)
- [ ] Pas d'erreur console (MCP Playwright)
- [ ] Code review fait (même si solo)
- [ ] Pas de console.log debug oublié
- [ ] Pas de secrets exposés
- [ ] Documentation à jour si nécessaire
- [ ] Migrations DB appliquées si nécessaire

---

## 📊 DASHBOARD GITHUB (Suivi)

### Où voir vos branches et PR?

**Branches actives:**

```
GitHub → Code → Branches
```

**Pull Requests:**

```
GitHub → Pull requests
```

**Historique commits:**

```
GitHub → Code → Commits
```

---

## 🎯 TIMELINE DE TRANSITION

### PHASE 1: MAINTENANT (Avant production)

- ✅ Continuer commits directs sur `main`
- ✅ Pas de branches
- ✅ Pas de PR

### PHASE 2: DÉPLOIEMENT

- ✅ Dernier commit sur `main`
- ✅ Configuration Vercel
- ✅ Vérification production

### PHASE 3: POST-PRODUCTION (Ce guide)

- 🔄 Protection branche `main`
- 🔄 Branches feature obligatoires
- 🔄 Pull Requests systématiques
- 🔄 Review avant merge

---

## 💡 CONSEILS PRATIQUES

### Pour débutant Git

1. **Toujours vérifier sur quelle branche vous êtes**

   ```bash
   git branch  # Affiche branche actuelle (*)
   ```

2. **Toujours partir de main à jour**

   ```bash
   git checkout main && git pull
   ```

3. **Un doute? Vérifier le statut**

   ```bash
   git status  # Montre fichiers modifiés
   ```

4. **Visualiser l'historique**
   ```bash
   git log --oneline --graph --all -10
   ```

### Organisation branches

- 1 branche = 1 fonctionnalité complète
- Pas de branches "fourre-tout"
- Supprimer branches mergées (nettoyage)
- Maximum 2-3 branches actives simultanées

---

## 🔗 RESSOURCES COMPLÉMENTAIRES

- [Guide protection branche main](./PROTECTION-BRANCHE-MAIN.md)
- [Template Pull Request](../../.github/PULL_REQUEST_TEMPLATE.md)
- [Convention commits Vérone](../../CLAUDE.md#commits)

---

**Résumé ultra-simple:**

1. Créer branche → 2. Développer → 3. Push → 4. PR → 5. Review → 6. Merge → 7. Nettoyage

_Guide créé pour faciliter la transition vers GitHub Flow post-production - Vérone Back Office 2025_
