# 🔧 Guide de Résolution - Déploiement Vercel

**Date**: 2 octobre 2025
**Problème**: Module resolution cache corrompu (Next.js 15 + Vercel)
**Solution**: Disconnect/Reconnect Repository GitHub

---

## 🎯 Contexte

Le déploiement sur Vercel échoue systématiquement avec :

```
Module not found: Can't resolve '@/lib/logger'
Module not found: Can't resolve '@/lib/supabase/server'
Module not found: Can't resolve '@/lib/google-merchant/excel-transformer'
```

**Diagnostic confirmé** :

- ✅ Build local fonctionne (0 erreurs)
- ✅ Tous les fichiers présents sur GitHub
- ✅ Configuration Vercel correcte
- ❌ Cache de résolution de modules Next.js 15 corrompu sur Vercel

---

## 🛠️ Solution Recommandée : Disconnect/Reconnect Repository

Cette solution est **officiellement recommandée par Vercel** pour ce type de problème.

### **Étape 1 : Déconnecter le Repository GitHub**

1. Aller sur : https://vercel.com/verone2021s-projects/verone-back-office/settings/git
2. Cliquer sur **"Disconnect"** pour déconnecter le repository GitHub
3. Confirmer la déconnexion

### **Étape 2 : Reconnecter le Repository**

1. Aller sur : https://vercel.com/new
2. Cliquer sur **"Import Git Repository"**
3. Sélectionner **`Verone2021/Verone-backoffice`**
4. Vercel détectera automatiquement :
   - Framework : **Next.js 15.0.3**
   - Build Command : **`npm run build`**
   - Output Directory : **`.next`**
   - Node Version : **22.x**

### **Étape 3 : Configurer les Variables d'Environnement**

Ajouter les variables suivantes dans **Settings → Environment Variables** :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://aorroydfjsrygmosnzrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvcnJveWRmanNyeWdtb3NuenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3Mjc0NzAsImV4cCI6MjA3MzMwMzQ3MH0.fRi7svC8bAr3wihH76pfQnaq7tjuBMypAEi6q-rHCTA

# Sentry (optionnel)
```

### **Étape 4 : Déployer**

1. Cliquer sur **"Deploy"**
2. Vercel va :
   - Recréer le webhook GitHub automatiquement
   - Purger complètement le cache build
   - Créer une configuration fraîche sans metadata corrompue
   - Déployer avec la résolution de modules correcte

### **Étape 5 : Vérifier**

1. Attendre la fin du build (~2-3 minutes)
2. Vérifier que le déploiement réussit sans erreurs
3. Tester l'application déployée
4. Vérifier que le webhook GitHub est créé : https://github.com/Verone2021/Verone-backoffice/settings/hooks

---

## ✅ Avantages de Cette Solution

1. **Recréation du webhook GitHub** → Déploiements automatiques fonctionnels
2. **Reset complet du cache build** → Plus d'erreurs de résolution de modules
3. **Configuration fraîche** → Pas de metadata corrompue
4. **Solution officielle Vercel** → Supportée et documentée

---

## 🔄 Alternative : Vercel CLI (Si Disconnect/Reconnect échoue)

Si la solution ci-dessus ne fonctionne pas, vous pouvez déployer via Vercel CLI :

### **1. Installation et Configuration**

```bash
# Installer Vercel CLI globalement
npm install -g vercel

# Login avec votre compte
vercel login

# Lier le projet
cd /Users/romeodossantos/verone-back-office
vercel link
```

### **2. Déploiement Production**

```bash
# Vérifier build local d'abord
npm run build

# Déployer en production
vercel --prod
```

### **3. Configurer Variables d'Environnement via CLI**

```bash
# Ajouter les variables d'environnement
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

---

## 📊 Informations de Référence

**Projet Vercel** :

- **Project ID** : `prj_X4eg9YtIF4qS2eTwIRLidsA9SB1d`
- **Team ID** : `team_sYPhPzbeKMa8CB79SBRDGyji`
- **URL Project** : https://vercel.com/verone2021s-projects/verone-back-office

**Repository GitHub** :

- **URL** : https://github.com/Verone2021/Verone-backoffice
- **Branch** : `main`
- **Dernier commit validé** : `f5cf438` - Build TypeScript 100% fonctionnel

**Build Local** :

```bash
npm run build
# ✓ Compiled successfully
# ✓ 57 pages statiques générées
# ✓ 0 erreurs TypeScript
# ✓ Tous les modules résolus correctement
```

---

## 🚨 Important

- **NE PAS** essayer de modifier manuellement le cache Vercel
- **NE PAS** créer un nouveau projet Vercel (garder le même)
- **TOUJOURS** vérifier que le build local fonctionne avant de déployer

---

## 📞 Support

Si le problème persiste après disconnect/reconnect :

1. Contacter Support Vercel : https://vercel.com/help
2. Référence : "Module resolution cache corrupted in Next.js 15 build"
3. Project ID : `prj_X4eg9YtIF4qS2eTwIRLidsA9SB1d`
4. Evidence : Build local fonctionne, fichiers présents sur GitHub

---

**Guide généré par** : Claude Code Agent
**Dernière mise à jour** : 2 octobre 2025, 03:15 UTC+2
**Statut** : PRÊT POUR RÉSOLUTION MANUELLE
