# 🚀 Guide Complet : Workflow Git/GitHub/Vercel - Vérone Back Office

**Guide pour débutants - Version 2025**
Déploiement continu Next.js + Supabase sur Vercel

---

## 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Stratégie GitHub Flow](#stratégie-github-flow)
3. [Configuration initiale](#configuration-initiale)
4. [Workflow quotidien](#workflow-quotidien)
5. [Commandes essentielles](#commandes-essentielles)
6. [Résolution de problèmes](#résolution-de-problèmes)

---

## 🎯 Vue d'Ensemble

### Pourquoi GitHub Flow ?

**GitHub Flow** est la stratégie recommandée pour Vérone Back Office car :

- ✅ **Simple** : Idéale pour débuter avec Git/GitHub
- ✅ **Déploiement continu** : Vercel déploie automatiquement
- ✅ **Pas de versions multiples** : Application web unique toujours à jour
- ✅ **Standard industrie** : Utilisé par GitHub, Vercel, Netlify

### Architecture de Déploiement

```
Code Local (Mac)
    ↓ git push
GitHub Repository (Cloud)
    ↓ webhook automatique
Vercel (Cloud)
    ↓ build & deploy
Production URL (verone-backoffice.vercel.app)
```

### Structure des Branches

```
main (production)              ← Toujours stable et déployable
├── feature/phase1-data        ← Insertion données Phase 1
├── feature/phase2-stocks      ← Développement Phase 2 Stocks
├── feature/dashboard-v2       ← Amélioration dashboard
└── hotfix/critical-bug        ← Corrections urgentes uniquement
```

**Règle d'or** : `main` = Production. Toujours fonctionnel, toujours testé.

---

## 🔧 Configuration Initiale

### Étape 1 : Protection Branche Main sur GitHub

**Action manuelle une seule fois :**

1. Aller sur https://github.com/Verone2021/Verone-backoffice
2. Cliquer sur **Settings** (en haut à droite)
3. Dans le menu gauche : **Branches**
4. Cliquer **Add branch protection rule**
5. **Branch name pattern** : `main`
6. Cocher les options :
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Do not allow bypassing the above settings**
7. Cliquer **Create** (ou **Save changes**)

**Résultat** : Impossible de push directement sur `main` → toujours passer par Pull Request (PR).

### Étape 2 : Configuration Vercel

**Vérifier configuration sur https://vercel.com/dashboard**

#### 2.1 Connexion GitHub

1. Projet Vercel → **Settings** → **Git**
2. Vérifier : **Connected Git Repository** = `Verone2021/Verone-backoffice`
3. **Production Branch** = `main`
4. **Preview Deployments** = `All branches` (activé)

#### 2.2 Variables d'Environnement

1. Projet Vercel → **Settings** → **Environment Variables**
2. Ajouter pour **Production** :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://aorroydfjsrygmosnzrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
BREVO_API_KEY=xkeysib-xxx
BREVO_WEBHOOK_SECRET=xxx
NODE_ENV=production
```

3. **Important** : Cocher **Production**, **Preview**, et **Development** pour chaque variable

**Pourquoi ?** Les variables doivent être disponibles sur tous les environnements Vercel.

### Étape 3 : Vérification Locale

```bash
# Vérifier configuration Git
git remote -v
# Doit afficher : origin https://github.com/Verone2021/Verone-backoffice.git

# Vérifier branche actuelle
git branch
# Doit afficher : * main

# Vérifier statut
git status
# Doit indiquer si des fichiers sont modifiés
```

---

## 🔄 Workflow Quotidien

### Scénario A : Sauvegarder Travail en Cours (Quick Save)

**Contexte** : Tu as modifié des fichiers et veux sauvegarder sans déployer.

```bash
# 1. Voir ce qui a changé
git status

# 2. Ajouter TOUS les fichiers modifiés
git add .

# 3. Commit avec message descriptif
git commit -m "🚧 WIP: Travail en cours dashboard"

# 4. Pousser vers GitHub (ne déploie PAS si sur feature branch)
git push origin nom-de-ta-branche
```

**Alternative** : Ajouter fichiers spécifiques uniquement

```bash
git add apps/back-office/src/app/dashboard/page.tsx
git add apps/back-office/src/hooks/use-dashboard.ts
git commit -m "✨ Amélioration dashboard: ajout KPIs"
git push origin main
```

### Scénario B : Déployer en Production (Main Branch)

**Contexte** : Travail terminé, testé, prêt pour production.

```bash
# 1. S'assurer d'être sur main
git checkout main

# 2. Voir les changements
git status

# 3. Ajouter fichiers modifiés
git add .

# 4. Commit avec message clair et émojis
git commit -m "✨ DASHBOARD CRM/ERP 2025: 8 KPIs + Organisation restaurée

- Dashboard principal transformé avec 8 KPIs professionnels
- Ajout métriques Phase 1 (réelles) + Phase 2 (mock intelligent)
- Hook useCompleteDashboardMetrics unifié
- Page Organisation restaurée depuis /contacts-organisations
- Sidebar simplifié : Organisation entrée unique sans sous-pages
- Tests MCP Playwright : Console 100% propre

Phase 1 prête pour déploiement production"

# 5. Pousser vers GitHub
git push origin main
```

**Résultat automatique** (sous 3 minutes) :

1. ✅ GitHub enregistre commit
2. ✅ Vercel détecte push sur `main`
3. ✅ Vercel build automatique (~2 min)
4. ✅ Déploiement production automatique
5. ✅ URL https://verone-backoffice.vercel.app mise à jour

**Vérifier déploiement** :

- Dashboard Vercel : https://vercel.com/verone2021/verone-backoffice
- Check status : ✅ "Ready" (vert) = succès
- Tester URL production dans navigateur

### Scénario C : Développer Nouvelle Fonctionnalité (Feature Branch)

**Contexte** : Travailler sur Phase 2 Stocks sans affecter production.

```bash
# 1. S'assurer main est à jour
git checkout main
git pull origin main

# 2. Créer nouvelle branche feature
git checkout -b feature/phase2-stocks

# 3. Développer... (modifications fichiers)

# 4. Commits réguliers
git add apps/back-office/src/app/stocks/
git commit -m "✨ Interface gestion stocks: Liste produits"

git add apps/back-office/src/hooks/use-stocks.ts
git commit -m "✨ Hook useStocks: Intégration Supabase"

# 5. Pousser branche vers GitHub
git push origin feature/phase2-stocks
```

**Résultat automatique** :

1. ✅ Vercel crée **Preview Deployment** automatique
2. ✅ URL Preview unique générée (ex: verone-backoffice-git-feature-phase2-stocks.vercel.app)
3. ✅ Tester sur URL Preview SANS affecter production
4. ✅ Production (`main`) reste inchangée

**Comment trouver URL Preview ?**

- GitHub → Pull Request → Vercel bot commente avec URL
- Vercel Dashboard → Deployments → Chercher branche `feature/phase2-stocks`

### Scénario D : Merger Feature Validée en Production

**Contexte** : Feature branch testée et validée → déployer en prod.

#### Option 1 : Via GitHub (RECOMMANDÉ pour débutants)

1. Aller sur https://github.com/Verone2021/Verone-backoffice
2. Onglet **Pull requests** → **New pull request**
3. **Base** : `main` ← **Compare** : `feature/phase2-stocks`
4. **Create pull request**
5. Remplir description :

   ```markdown
   ## 🎯 Objectif

   Implémentation module Stocks Phase 2

   ## ✅ Changements

   - Interface gestion inventaire
   - Hook useStocks intégration Supabase
   - Page liste produits avec quantités
   - Mouvements de stock (entrées/sorties)

   ## 🧪 Tests

   - [x] Console errors : 0 erreur
   - [x] MCP Playwright validation
   - [x] Preview deployment testé
   - [x] Supabase queries validées

   ## 📸 Screenshots

   [Ajouter screenshots validation]
   ```

6. **Merge pull request** (bouton vert)
7. **Confirm merge**
8. **Delete branch** (nettoyer après merge)

**Résultat** : Vercel déploie automatiquement en production sous 2-3 minutes.

#### Option 2 : En Ligne de Commande (AVANCÉ)

```bash
# 1. Revenir sur main
git checkout main

# 2. Mettre à jour main
git pull origin main

# 3. Merger feature branch
git merge feature/phase2-stocks

# 4. Pousser vers GitHub
git push origin main

# 5. Supprimer branche locale (optionnel)
git branch -d feature/phase2-stocks

# 6. Supprimer branche remote (optionnel)
git push origin --delete feature/phase2-stocks
```

### Scénario E : Rollback Urgence (Revenir Version Précédente)

**Contexte** : Bug critique en production → revenir version stable rapidement.

#### Option 1 : Vercel Rollback Instant (PLUS RAPIDE)

1. Dashboard Vercel → **Deployments**
2. Trouver dernier déploiement stable (avant bug)
3. Cliquer **︙** (trois points) → **Promote to Production**
4. Confirmer

**Résultat** : Production restaurée en ~30 secondes (sans rebuild).

#### Option 2 : Git Revert (Annuler Commit)

```bash
# 1. Voir historique commits
git log --oneline -10

# 2. Identifier commit problématique (ex: abc1234)
git revert abc1234

# 3. Pousser vers GitHub
git push origin main
```

**Résultat** : Vercel redéploie automatiquement avec commit d'annulation.

#### Option 3 : Revenir à Commit Spécifique (DANGEREUX)

```bash
# ⚠️ ATTENTION : Efface historique après le commit choisi

# 1. Identifier commit stable (ex: def5678)
git log --oneline -20

# 2. Reset HARD vers commit (⚠️ perte changements après)
git reset --hard def5678

# 3. Force push (⚠️ réécriture historique)
git push origin main --force
```

**À utiliser uniquement en dernier recours !**

---

## 🎓 Commandes Essentielles Git

### Commandes de Base (Usage Quotidien)

```bash
# ──────────────────────────────────────
# 📍 Où suis-je ? (Status & Info)
# ──────────────────────────────────────
git status                    # État actuel : fichiers modifiés, branche
git branch                    # Liste branches locales (* = actuelle)
git branch -a                 # Toutes branches (locales + remote)
git log --oneline -10         # 10 derniers commits

# ──────────────────────────────────────
# 💾 Sauvegarder Travail (Add & Commit)
# ──────────────────────────────────────
git add .                     # Ajouter TOUS changements
git add apps/back-office/src/app/dashboard/    # Ajouter dossier spécifique
git add *.tsx                 # Ajouter tous fichiers .tsx

git commit -m "Message"       # Commit avec message court
git commit -m "Titre

Description détaillée
sur plusieurs lignes"         # Commit avec titre + description

# ──────────────────────────────────────
# 🚀 Envoyer vers GitHub (Push)
# ──────────────────────────────────────
git push origin main          # Pousser branche main
git push origin feature/nom   # Pousser branche feature
git push                      # Pousser branche actuelle (raccourci)

# ──────────────────────────────────────
# 🔄 Récupérer Dernières Modifs (Pull)
# ──────────────────────────────────────
git pull origin main          # Télécharger + merger derniers changements main
git fetch origin              # Télécharger infos sans merger

# ──────────────────────────────────────
# 🌿 Gérer Branches (Create & Switch)
# ──────────────────────────────────────
git branch feature/nom        # Créer nouvelle branche (sans basculer)
git checkout -b feature/nom   # Créer + basculer nouvelle branche
git checkout main             # Basculer vers main
git checkout feature/nom      # Basculer vers feature existante

# ──────────────────────────────────────
# 🗑️ Nettoyer (Delete Branches)
# ──────────────────────────────────────
git branch -d feature/nom     # Supprimer branche locale (si mergée)
git branch -D feature/nom     # Forcer suppression (même si non mergée)
git push origin --delete feature/nom  # Supprimer branche remote
```

### Commandes Avancées (Usage Occasionnel)

```bash
# ──────────────────────────────────────
# 🔍 Inspection & Debug
# ──────────────────────────────────────
git diff                      # Voir modifications non commitées
git diff --cached             # Voir modifications staged (add)
git diff main feature/nom     # Comparer deux branches
git show abc1234              # Voir détails commit spécifique

git log --graph --oneline --all  # Historique visuel branches
git blame apps/back-office/src/app/page.tsx    # Qui a modifié chaque ligne

# ──────────────────────────────────────
# ⏪ Annuler Modifications
# ──────────────────────────────────────
git restore apps/back-office/src/app/page.tsx  # Annuler modifs fichier (avant add)
git restore --staged file.tsx # Retirer fichier de staging (après add)
git reset HEAD~1              # Annuler dernier commit (garder modifs)
git reset --hard HEAD~1       # Annuler dernier commit (⚠️ perte modifs)

# ──────────────────────────────────────
# 🏷️ Tags & Releases
# ──────────────────────────────────────
git tag v1.0.0-phase1         # Créer tag local
git push origin v1.0.0-phase1 # Pousser tag vers GitHub
git tag -l                    # Liste tous tags
```

### Émojis de Commit (Convention Vérone)

```bash
✨  Nouvelle fonctionnalité     git commit -m "✨ Ajout module stocks"
🐛  Correction bug              git commit -m "🐛 Fix erreur console dashboard"
📝  Documentation               git commit -m "📝 Ajout guide workflow Git"
🎨  Style/UI/Design             git commit -m "🎨 Amélioration design page produit"
♻️   Refactoring                git commit -m "♻️ Refonte hook use-products"
🚀  Déploiement                git commit -m "🚀 Déploiement Phase 1 production"
🧪  Tests                      git commit -m "🧪 Ajout tests MCP Browser catalogue"
📦  Données/Migration           git commit -m "📦 Insertion 50 produits catalogue"
🔧  Configuration              git commit -m "🔧 Config Vercel environment variables"
🚧  Work In Progress           git commit -m "🚧 WIP: Dashboard v2 en cours"
```

---

## 🚨 Résolution de Problèmes

### Problème 1 : "fatal: The current branch has no upstream branch"

**Erreur** :

```bash
$ git push
fatal: The current branch feature/test has no upstream branch.
```

**Solution** :

```bash
# Première fois qu'on push une nouvelle branche
git push -u origin feature/test
# Ou plus explicite
git push --set-upstream origin feature/test
```

**Explication** : Git ne sait pas où pousser la branche car elle n'existe pas encore sur GitHub.

### Problème 2 : "Your branch is behind 'origin/main'"

**Erreur** :

```bash
$ git status
Your branch is behind 'origin/main' by 5 commits, and can be fast-forwarded.
```

**Solution** :

```bash
# Mettre à jour la branche locale
git pull origin main

# Si pas de conflits → OK
# Si conflits → voir Problème 3
```

### Problème 3 : Conflits de Merge

**Erreur** :

```bash
$ git merge feature/test
CONFLICT (content): Merge conflict in apps/back-office/src/app/page.tsx
Automatic merge failed; fix conflicts and then commit the result.
```

**Solution détaillée** :

1. **Identifier fichiers en conflit** :

   ```bash
   git status
   # Chercher : "both modified:"
   ```

2. **Ouvrir fichier et chercher marqueurs** :

   ```tsx
   <<<<<<< HEAD
   Code version main (actuelle)
   =======
   Code version feature branch
   >>>>>>> feature/test
   ```

3. **Résoudre manuellement** :
   - Garder une version, ou
   - Combiner les deux, ou
   - Réécrire complètement

4. **Marquer comme résolu** :
   ```bash
   git add apps/back-office/src/app/page.tsx
   git commit -m "🔀 Merge feature/test: résolution conflits"
   git push origin main
   ```

### Problème 4 : "error: failed to push some refs"

**Erreur** :

```bash
$ git push origin main
error: failed to push some refs to 'https://github.com/Verone2021/Verone-backoffice.git'
hint: Updates were rejected because the remote contains work that you do not have locally.
```

**Solution** :

```bash
# 1. Récupérer changements remote
git pull origin main

# 2. Résoudre conflits si nécessaire (voir Problème 3)

# 3. Pousser à nouveau
git push origin main
```

**Explication** : Quelqu'un a pushé sur `main` avant toi → Git refuse d'écraser.

### Problème 5 : ".env.local committé par erreur"

**Erreur** : Fichier `.env.local` avec secrets committé sur GitHub.

**Solution URGENTE** :

```bash
# 1. Retirer du commit (avant push)
git rm --cached .env.local
git commit -m "🔥 Remove .env.local (secrets)"
git push origin main

# 2. Vérifier .gitignore contient
# .env.local
# .env

# 3. Régénérer TOUS les secrets exposés :
# - GitHub token
# - Supabase service role key
# - Brevo API key
```

**Prévention** : Toujours vérifier `git status` avant commit !

### Problème 6 : Vercel Build Failed

**Erreur Dashboard Vercel** : Build Status = ❌ "Failed"

**Solutions par type d'erreur** :

#### Build Error : Type Error

```bash
# Logs Vercel :
Type error: Property 'products' does not exist on type 'DashboardMetrics'
```

**Solution** :

1. Corriger erreur TypeScript localement
2. Tester `npm run build` en local
3. Commit + push fix

#### Build Error : Missing Environment Variable

```bash
# Logs Vercel :
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**Solution** :

1. Vercel Dashboard → Settings → Environment Variables
2. Ajouter variable manquante
3. Cocher Production + Preview + Development
4. Redéployer : Deployments → ⋯ → Redeploy

#### Build Error : Module Not Found

```bash
# Logs Vercel :
Module not found: Can't resolve '@/hooks/use-products'
```

**Solution** :

1. Vérifier chemin import en local
2. Vérifier fichier existe dans Git : `git ls-files | grep use-products`
3. Si manquant : `git add apps/back-office/src/hooks/use-products.ts` puis commit

---

## 📖 Glossaire

**Branch (Branche)** : Version parallèle du code permettant de travailler isolément.

**Commit** : Sauvegarde instantanée des modifications avec message descriptif.

**Push** : Envoyer commits locaux vers GitHub (cloud).

**Pull** : Télécharger commits de GitHub vers local.

**Merge** : Fusionner deux branches (ex: feature → main).

**Pull Request (PR)** : Demande de merge via interface GitHub (revue de code).

**Conflict (Conflit)** : Modifications contradictoires sur mêmes lignes → résolution manuelle.

**Staging Area** : Zone intermédiaire après `git add` avant `git commit`.

**HEAD** : Pointeur vers commit actuel (où tu es).

**Origin** : Nom par défaut du repository remote (GitHub).

**Main** : Branche principale (anciennement appelée `master`).

**Preview Deployment** : Déploiement Vercel temporaire pour tester branche feature.

**Production Deployment** : Déploiement Vercel officiel depuis branche `main`.

---

## ✅ Checklist Déploiement Phase 1

### Avant Push Main

- [ ] **Tests locaux** : `npm run dev` → Application fonctionne
- [ ] **Build local** : `npm run build` → Pas d'erreurs TypeScript
- [ ] **Console errors** : MCP Playwright Browser → 0 erreur console
- [ ] **Screenshots** : Preuves visuelles fonctionnalités OK
- [ ] **Données test** : 5 produits minimum insérés et validés
- [ ] **.env.local NON committé** : `git status` → pas de `.env.local` listé
- [ ] **Commit message descriptif** : Émojis + détails changements

### Après Push Main

- [ ] **Vercel build réussi** : Dashboard Vercel → ✅ Status "Ready"
- [ ] **URL production fonctionne** : https://verone-backoffice.vercel.app
- [ ] **Connexion Supabase OK** : Dashboard charge métriques
- [ ] **Dashboard 8 KPIs affichés** : Tous KPIs visibles avec données
- [ ] **Navigation fonctionnelle** : Sidebar + routes principales
- [ ] **Pas d'erreurs Sentry** : Monitoring production → 0 issue critique

### Post-Déploiement

- [ ] **Backup Supabase** : Export SQL via Supabase Dashboard
- [ ] **Tag Git version** : `git tag v1.0.0-phase1 && git push origin v1.0.0-phase1`
- [ ] **Documentation mise à jour** : Changelog, Release notes
- [ ] **Communication équipe** : Annoncer déploiement réussi

---

## 📚 Ressources Officielles

- **Git Documentation** : https://git-scm.com/doc
- **GitHub Docs** : https://docs.github.com
- **Vercel Docs** : https://vercel.com/docs
- **GitHub Flow Guide** : https://docs.github.com/en/get-started/using-github/github-flow
- **Next.js Deployment** : https://nextjs.org/docs/app/building-your-application/deploying

---

**🎯 Prochaine étape** : [Guide Insertion Données Produits](./data-insertion-process.md)

_Guide créé le 2025-10-01 - Vérone Back Office Phase 1_
