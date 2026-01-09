# 🚀 Configuration Vercel - Vérone Back Office 2025

**Date :** 2 octobre 2025
**Statut :** ⚠️ **RECONFIGURATION REQUISE**
**Compte :** verone2021 (veronebyromeo@gmail.com)

---

## 📋 Résumé de la Situation

### ✅ **Connexion Vercel Vérifiée**

**Compte Vercel :**

- **Username :** verone2021
- **Email :** veronebyromeo@gmail.com
- **ID :** cHcpJ6XF7uveUTbeGxc9PsOQ
- **Team ID :** team_sYPhPzbeKMa8CB79SBRDGyji
- **Plan :** Hobby (Free)
- **Token API :** `uY53v0FVdu2GW3pPYgtbKcsk` ✅ Fonctionnel

### ⚠️ **Problème Identifié**

**Projet Vercel :** `verone-back-office`

- **ID :** `prj_X4eg9YtIF4qS2eTwIRLidsA9SB1d`
- **Framework :** Next.js
- **Repository GitHub lié :** `verone-back-office` (Public) ❌ **ANCIEN REPOSITORY**
- **Repository GitHub ID :** 1068188033
- **Statut déploiement :** ⚠️ **FAILED** (échec récent)

**Cause :** Le projet Vercel est toujours lié à l'ancien repository `verone-back-office` (Public) que nous sommes en train de supprimer, au lieu du nouveau repository `Verone-backoffice` (Private).

---

## 🔧 Configuration Actuelle

### **Variables d'Environnement Vercel**

Le projet contient les variables suivantes (chiffrées) :

```bash
GITHUB_TOKEN
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_ACCESS_TOKEN
SUPABASE_SERVICE_ROLE_KEY
```

### **Configuration Build**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "nextjs",
  "productionBranch": "main"
}
```

---

## 🎯 Actions Requises - Reconfiguration GitHub

### **Option 1 : Reconfigurer via Dashboard Vercel (RECOMMANDÉ)**

**Étapes à suivre manuellement :**

1. **Aller sur le dashboard Vercel**
   - URL : https://vercel.com/verone2021s-projects/verone-back-office/settings/git

2. **Déconnecter l'ancien repository**
   - Cliquer sur "Manage Login Connections" ou "Disconnect"
   - Confirmer la déconnexion de `verone-back-office`

3. **Reconnecter avec le nouveau repository**
   - Cliquer sur "Connect Git Repository"
   - Sélectionner GitHub
   - Choisir le repository **`Verone-backoffice`** (Private)
   - Confirmer la connexion

4. **Vérifier la configuration**
   - Production Branch : `main`
   - Auto-deployments : Activé
   - Pull Request Comments : Activé

5. **Déclencher un nouveau déploiement**
   - Aller sur : https://vercel.com/verone2021s-projects/verone-back-office
   - Cliquer sur "Redeploy" pour forcer un nouveau build

### **Option 2 : Recréer le Projet Vercel (Alternative)**

Si la reconfiguration échoue, tu peux créer un nouveau projet :

1. **Supprimer l'ancien projet** (optionnel, garde le nom)
   - Settings > Advanced > Delete Project

2. **Créer un nouveau projet**
   - Dashboard Vercel > "Add New..." > "Project"
   - Importer depuis GitHub : `Verone-backoffice`
   - Configuration automatique Next.js détectée
   - Garder le nom : `verone-back-office`

3. **Reconfigurer les variables d'environnement**
   - Copier toutes les variables depuis l'ancien projet
   - Ou les réimporter depuis `.env.local`

---

## 🔑 Configuration Token Vercel

### **Token Actuel**

```bash
VERCEL_TOKEN=uY53v0FVdu2GW3pPYgtbKcsk
```

**Localisation :**

- `.env.local` : Ligne 15
- Scope : Accès complet au compte verone2021

### **Test Connexion API**

```bash
# Vérifier le token
curl -s -H "Authorization: Bearer uY53v0FVdu2GW3pPYgtbKcsk" \
  https://api.vercel.com/v2/user

# Lister les projets
curl -s -H "Authorization: Bearer uY53v0FVdu2GW3pPYgtbKcsk" \
  https://api.vercel.com/v9/projects
```

---

## 📊 Projets Vercel

### **Projet 1 : verone-back-office** ⚠️

```json
{
  "nom": "verone-back-office",
  "id": "prj_X4eg9YtIF4qS2eTwIRLidsA9SB1d",
  "framework": "nextjs",
  "github_repo": "verone-back-office",
  "github_org": "Verone2021",
  "production_branch": "main",
  "statut": "⚠️ FAILED - Repository lié incorrect",
  "url": "https://vercel.com/verone2021s-projects/verone-back-office"
}
```

**Action :** Reconfigurer pour pointer vers `Verone-backoffice` (Private)

### **Projet 2 : want-it-now-mvp** ✅

```json
{
  "nom": "want-it-now-mvp",
  "id": "prj_55Wd6eXdL2MsrwZDzKijgXnO2X2f",
  "framework": "nextjs",
  "github_repo": "want-it-now-mvp",
  "github_org": "Verone2021",
  "production_branch": "main",
  "statut": "✅ OK - Repository correct",
  "url": "https://vercel.com/verone2021s-projects/want-it-now-mvp"
}
```

**Action :** Aucune modification nécessaire

---

## 🔄 Workflow de Déploiement

### **Déploiement Automatique (après reconfiguration)**

1. **Push vers GitHub**

   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Vercel déclenche automatiquement**
   - Build Next.js
   - Tests (si configurés)
   - Déploiement Production

3. **Notifications**
   - Pull Request Comments : ✅ Activé
   - Commit Comments : ❌ Désactivé
   - Email notifications : Selon paramètres compte

### **Déploiement Manuel**

```bash
# Via Vercel CLI (si installé)
vercel --prod

# Via Dashboard
# Cliquer sur "Redeploy" dans l'interface
```

---

## 🛡️ Variables d'Environnement

### **Variables Critiques à Vérifier**

Après reconfiguration, s'assurer que ces variables sont bien présentes :

```bash
# GitHub
GH_TOKEN=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

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://aorroydfjsrygmosnzrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[voir .env.local]
SUPABASE_ACCESS_TOKEN=[voir .env.local]
SUPABASE_SERVICE_ROLE_KEY=[voir .env.local]

# Sentry
NEXT_PUBLIC_SENTRY_DSN=[voir .env.local]
SENTRY_AUTH_TOKEN=[voir .env.local]

# Google Merchant
GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL=[voir .env.local]
GOOGLE_MERCHANT_PRIVATE_KEY=[voir .env.local]

# Feature Flags
NEXT_PUBLIC_PHASE_1_ENABLED=true
NEXT_PUBLIC_DASHBOARD_ENABLED=true
NEXT_PUBLIC_PROFILES_ENABLED=true
NEXT_PUBLIC_CATALOGUE_ENABLED=true
```

### **Ajouter Variables Manquantes**

Si des variables sont manquantes dans Vercel :

1. Aller sur : https://vercel.com/verone2021s-projects/verone-back-office/settings/environment-variables
2. Copier les valeurs depuis `.env.local`
3. Sélectionner environnements : Production + Preview + Development
4. Sauvegarder

---

## ✅ Checklist de Validation

Après reconfiguration, vérifier :

- [ ] Repository GitHub lié : `Verone-backoffice` (Private)
- [ ] Production Branch : `main`
- [ ] Auto-deployments : Activé
- [ ] Variables d'environnement : Toutes présentes
- [ ] Build Command : `npm run build`
- [ ] Dev Command : `npm run dev`
- [ ] Framework : Next.js (auto-détecté)
- [ ] Premier déploiement : Réussi ✅
- [ ] URL de production : Accessible
- [ ] Pull Request Comments : Activé

---

## 🚨 Problèmes Courants

### **Erreur : "Repository not found"**

**Cause :** Repository GitHub supprimé ou permissions insuffisantes
**Solution :** Reconfigurer avec le nouveau repository `Verone-backoffice`

### **Erreur : "Build failed - Module not found"**

**Cause :** Variables d'environnement manquantes
**Solution :** Vérifier toutes les variables dans Settings > Environment Variables

### **Erreur : "Deployment failed - No commits"**

**Cause :** Repository vide ou aucun commit récent
**Solution :** Pousser un commit vers `main` dans `Verone-backoffice`

---

## 📚 Références

- **Dashboard Vercel :** https://vercel.com/verone2021s-projects
- **Projet actuel :** https://vercel.com/verone2021s-projects/verone-back-office
- **Documentation Vercel Git :** https://vercel.com/docs/deployments/git
- **API Vercel :** https://vercel.com/docs/rest-api
- **Support Vercel :** https://vercel.com/support

---

## ✅ Statut Final

**Configuration Vercel : VÉRIFICATION COMPLÉTÉE** ✅

- ✅ Token Vercel configuré et testé
- ✅ Connexion API fonctionnelle
- ✅ Projets listés (2 projets actifs)
- ⚠️ **ACTION REQUISE :** Reconfigurer le lien GitHub vers `Verone-backoffice`
- ⚠️ Déploiement en échec - À corriger après reconfiguration

**Prochaines Étapes :**

1. Finaliser suppression `verone-back-office` (Public) sur GitHub
2. Reconfigurer Vercel pour pointer vers `Verone-backoffice` (Private)
3. Déclencher nouveau déploiement
4. Valider que tout fonctionne en production

**URL Dashboard :** https://vercel.com/verone2021s-projects/verone-back-office

---

_Documentation générée le 2 octobre 2025_
_Vérone Back Office - Professional AI-Assisted Development Excellence_
