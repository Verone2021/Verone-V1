# 🚀 Guide Déploiement Vercel - Vérone Back Office

**Date**: 2025-10-20
**Phase**: Phase 1 (Auth + Profil)
**Branche**: `production-stable`

---

## 📋 Prérequis

- ✅ Compte Vercel connecté au repository GitHub
- ✅ Repository GitHub: `verone-back-office-V1`
- ✅ Branche production: `production-stable`
- ✅ Supabase Project configuré
- ✅ Variables d'environnement disponibles (`.env.local`)

---

## 🎯 Configuration Vercel

### 1. Paramètres Projet

```json
{
  "name": "verone-back-office",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

### 2. Branche de Production

**IMPORTANT**: Configurer la branche de déploiement automatique

```
Production Branch: production-stable
```

**Pourquoi ?**
- `production-stable` = Code validé, testé, sans erreurs console
- `main` = Development branch (peut contenir WIP)
- `refonte-design-system-2025` = Feature branch active

**Configuration dans Vercel Dashboard**:
1. Aller dans **Settings** → **Git**
2. Section **Production Branch**: Sélectionner `production-stable`
3. ✅ Enable Automatic Deployments
4. ✅ Enable Preview Deployments (pour feature branches)

---

## 🔐 Variables d'Environnement

**À configurer dans Vercel Dashboard → Settings → Environment Variables**

### Supabase (Obligatoire)

```bash
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=https://aorroydfjsrygmosnzrl.supabase.co

# Supabase Anon Key (Public)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL (Supabase Pooler - Vercel recommandé)
DATABASE_URL=postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres

# (Optionnel) Direct Connection fallback
DIRECT_URL=postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:6543/postgres
```

### Next.js (Obligatoire)

```bash
# Next.js Base URL (sera remplacé par Vercel automatiquement)
NEXT_PUBLIC_BASE_URL=https://verone-backoffice.vercel.app

# Node Environment
NODE_ENV=production
```

### Feature Flags (Phase 1)

```bash
# Phases déploiement
NEXT_PUBLIC_PHASE_1_ENABLED=true
NEXT_PUBLIC_PHASE_2_ENABLED=false
NEXT_PUBLIC_PHASE_3_ENABLED=false
```

**Note**: Feature flags sont hardcodés dans `src/lib/feature-flags.ts` (Phase 1 uniquement), donc ces variables sont optionnelles.

---

## 🛠️ Déploiement Manuel (Première Fois)

### Option 1: Via Vercel CLI

```bash
# Installer Vercel CLI globalement
npm i -g vercel

# Se connecter à Vercel
vercel login

# Déployer en production
vercel --prod

# Suivre les prompts:
# - Project name: verone-back-office
# - Framework: Next.js
# - Build command: npm run build
# - Output directory: .next
```

### Option 2: Via Vercel Dashboard

1. **Importer le projet**:
   - Aller sur [vercel.com/new](https://vercel.com/new)
   - Sélectionner repository `verone-back-office-V1`
   - Cliquer **Import**

2. **Configurer le projet**:
   - Framework Preset: **Next.js** (auto-détecté)
   - Root Directory: `./` (racine du projet)
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Ajouter variables d'environnement**:
   - Copier toutes les variables de `.env.local`
   - Coller dans **Environment Variables**
   - Appliquer à: **Production, Preview, Development**

4. **Déployer**:
   - Cliquer **Deploy**
   - Attendre build (~2-3 minutes)
   - ✅ Vérifier déploiement sur URL Vercel

---

## 🔄 Déploiements Automatiques

### Workflow Git → Vercel

```
1. Push sur production-stable → Déploiement PRODUCTION
2. Push sur feature/* → Déploiement PREVIEW
3. Pull Request → Déploiement PREVIEW (avec commentaire GitHub)
```

### Exemple Workflow Complet

```bash
# 1. Développer sur feature branch
git checkout -b feature/add-dashboard-stats
# ... code changes ...
git add .
git commit -m "feat: Add dashboard statistics"
git push origin feature/add-dashboard-stats

# 2. Créer Pull Request GitHub
# → Vercel créera automatiquement un déploiement Preview
# → URL Preview: https://verone-backoffice-git-feature-add-dashboard-stats.vercel.app

# 3. Merger PR dans production-stable
git checkout production-stable
git merge feature/add-dashboard-stats
git push origin production-stable

# 4. Vercel déploie automatiquement en PRODUCTION
# → URL Production: https://verone-backoffice.vercel.app
```

---

## ✅ Checklist Post-Déploiement

### Tests Critiques

```bash
# 1. Vérifier authentification
- [ ] Login fonctionne (email/password)
- [ ] Logout fonctionne
- [ ] Redirection après login OK

# 2. Vérifier profil utilisateur
- [ ] Page /profile accessible
- [ ] Données utilisateur affichées
- [ ] Modification profil fonctionne

# 3. Vérifier admin (Owner uniquement)
- [ ] Page /admin/users accessible (Owner)
- [ ] Liste utilisateurs affichée
- [ ] Création/modification utilisateurs OK
- [ ] Page /admin/activite-utilisateurs accessible

# 4. Vérifier dashboard
- [ ] Page /dashboard accessible
- [ ] Pas d'erreurs console
- [ ] Données affichées (si disponibles)

# 5. Vérifier sidebar vide
- [ ] Logo VÉRONE affiché
- [ ] Barre de recherche affichée
- [ ] Zone utilisateur affichée
- [ ] Aucun élément de navigation (sidebar vide)

# 6. Vérifier console browser (CRITIQUE)
- [ ] 0 erreurs JavaScript
- [ ] 0 erreurs React
- [ ] 0 warnings critiques
```

### Console Error Checking (OBLIGATOIRE)

```bash
# Ouvrir Chrome DevTools (F12)
# Onglet Console
# Rafraîchir la page
# ✅ AUCUNE erreur rouge
# ✅ AUCUN warning critique

# Erreurs acceptables (temporaires Phase 1):
# - Warnings Next.js Image optimization
# - Info logs Supabase
```

---

## 🚨 Rollback d'Urgence

### Via Vercel Dashboard

1. Aller dans **Deployments**
2. Trouver le dernier déploiement stable
3. Cliquer sur **⋯** (menu)
4. Sélectionner **Promote to Production**
5. Confirmer

**Durée**: ~30 secondes

### Via Git (si corruption)

```bash
# Revenir au commit stable précédent
git checkout production-stable
git log --oneline # Trouver le commit stable
git reset --hard <commit-hash>
git push origin production-stable --force

# Vercel redéploiera automatiquement
```

**⚠️ ATTENTION**: `--force` écrase l'historique, utiliser uniquement en urgence.

---

## 📊 Monitoring Post-Déploiement

### Vercel Analytics (Inclus)

- **Performance**: Core Web Vitals (LCP, FID, CLS)
- **Traffic**: Visites, pages vues, sessions
- **Errors**: Erreurs runtime, build failures

**Accès**: Vercel Dashboard → Analytics

### Supabase Logs (Database)

```bash
# Vérifier logs database
- Aller sur Supabase Dashboard
- Section Logs
- Filtrer par erreurs (status 500, 400)
```

### Custom Monitoring (MCP Browser)

```bash
# Tests automatisés via MCP Playwright
mcp__playwright__browser_navigate("https://verone-backoffice.vercel.app")
mcp__playwright__browser_console_messages()
mcp__playwright__browser_take_screenshot()
```

---

## 🔗 URLs Importantes

### Production

- **URL Production**: `https://verone-backoffice.vercel.app`
- **Vercel Dashboard**: `https://vercel.com/romeodossantos/verone-back-office`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl`

### Development

- **Local Dev**: `http://localhost:3000`
- **Supabase Local**: `http://localhost:54323`

---

## 🐛 Troubleshooting

### Build Failed

**Symptôme**: "Build failed" dans Vercel

**Solutions**:
1. Vérifier logs build dans Vercel Dashboard
2. Tester build local: `npm run build`
3. Vérifier TypeScript errors: `npx tsc --noEmit`
4. Vérifier ESLint: `npm run lint`

### Variables d'Environnement Manquantes

**Symptôme**: "NEXT_PUBLIC_SUPABASE_URL is not defined"

**Solutions**:
1. Vérifier variables dans Vercel Dashboard → Environment Variables
2. Redéployer après ajout: Deployments → Redeploy
3. Vérifier scope: Production/Preview/Development

### Erreurs Runtime (500)

**Symptôme**: Page blanche, erreur 500

**Solutions**:
1. Vérifier Vercel Dashboard → Functions → Logs
2. Vérifier Supabase Logs
3. Vérifier RLS policies (permissions database)
4. Tester en local avec mêmes variables env

### Authentification Ne Fonctionne Pas

**Symptôme**: Login échoue, redirection infinie

**Solutions**:
1. Vérifier `NEXT_PUBLIC_SUPABASE_URL` dans Vercel
2. Vérifier Supabase Authentication → Providers → Email activé
3. Vérifier callback URL dans Supabase: `https://verone-backoffice.vercel.app/auth/callback`
4. Ajouter domain Vercel dans Supabase Auth → URL Configuration

---

## 📚 Ressources

- [Vercel Next.js Deployment Guide](https://vercel.com/docs/frameworks/nextjs)
- [Supabase + Vercel Integration](https://supabase.com/docs/guides/integrations/vercel)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Dernière mise à jour**: 2025-10-20
**Maintenu par**: Romeo Dos Santos
**Support**: GitHub Issues
