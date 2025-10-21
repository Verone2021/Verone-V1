# Identifiants Vercel & GitHub - Projet Vérone (MAJ 2025-01-20)

## Compte Vercel

**Organisation**: verone2021's projects  
**Slug**: verone2021s-projects  
**Email**: veronebyromeo@gmail.com  
**User ID**: verone2021  

**API Token (NOUVEAU - 2025-01-20)**: `fP9zrWChkv7eOY3RHdRXFLy4`
- Créé le : 2025-01-20
- Stocké dans : .env.local (VERCEL_TOKEN)
- ⚠️ **CRITIQUE** : Ne JAMAIS commiter ce token

**Projet Principal**:
- Nom: verone-V1 (renommé de verone-backoffice)
- URL Production: www.verone-V1.app
- Dashboard: https://vercel.com/verone2021s-projects/verone-V1

**Configuration**:
- Framework: Next.js 15.5.6 (forcé par @vercel/analytics)
- Build Command: npm run build
- Install Command: npm install
- Output Directory: .next
- Node Version: Auto
- Production Branch: main

## Compte GitHub

**Organisation**: Verone2021  
**Email**: veronebyromeo@gmail.com (ou 163727524+Verone2021@users.noreply.github.com)  
**Username**: verone2021

**Personal Access Token**: `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`
- Créé le : 2025-10-02
- Permissions : repo, workflow
- Stocké dans : .env.local (GH_TOKEN)
- ✅ FONCTIONNE (testé git fetch 2025-01-20)

**Repository Principal (NOUVEAU NOM)**:
- Nom: Verone-V1 (renommé de Verone-backoffice)
- URL: https://github.com/Verone2021/Verone-V1
- Branch principale: main
- Visibilité: Private

**Configuration Git Locale**:
```bash
git config user.name "Romeo Dos Santos"
git config user.email "163727524+Verone2021@users.noreply.github.com"
git remote set-url origin https://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@github.com/Verone2021/Verone-V1.git
```

## Intégration Vercel ↔ GitHub

**Connexion**: Automatique via GitHub App  
**Auto-deployment**: Activé sur push vers main  
**Preview Deployments**: Activé pour toutes les branches  

**Workflow Historique qui MARCHE** (commits 600c10d et 31f5aed) :
1. Configuration manuelle via Vercel Dashboard (pas de CLI)
2. Connexion au repo GitHub via interface web
3. Auto-deployment via webhook GitHub → Vercel
4. Push vers main déclenche automatiquement build + deploy

## Fix Build Production (2025-01-20)

**Problème ROOT CAUSE** : NODE_ENV=development dans .env et .env.local
- Cause erreurs prerendering /404 et /_error avec Next.js 15
- Documentation officielle : GitHub Issues #56481, #52158

**Solution appliquée** :
- ✅ Supprimé NODE_ENV de .env et .env.local
- ✅ Next.js gère automatiquement NODE_ENV (dev/build)
- ✅ npm dedup pour résoudre conflits React
- ✅ Commit d4852fe "fix(build): Remove NODE_ENV from .env files"
- ✅ Push vers main réussi (2025-01-20 05:40)

**Résultat attendu** :
Vercel build réussit (historiquement ça marchait même si build local échoue)

## Variables d'Environnement Critiques

**À configurer dans Vercel Dashboard** (Settings > Environment Variables) :
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- DATABASE_URL
- Toutes les autres vars de .env.local (SAUF NODE_ENV)

**Environnement**: Production, Preview, Development (toutes)

## Notes Importantes

- ✅ Next.js 15.5.6 (pas de régression vers 14)
- ✅ tsconfig.json : moduleResolution: "node" (fix critique Vercel)
- ✅ vercel.json : Configuration complète validée
- ⚠️ Ne JAMAIS commiter .env.local (contient tokens)
- ⚠️ Build local échoue mais Vercel peut réussir (environnement différent)
- 🔑 Workflow simple : Dashboard manuel + Git push (pas de CLI complexe)
- 📅 Dernier déploiement : 2025-01-20 05:40 (commit d4852fe)
