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
- Nom: verone-backoffice
- ID: prj_Dbd1BIWbakNaJFPFACoj79OgAFyz
- URL Production: https://verone-backoffice.vercel.app
- Dashboard: https://vercel.com/verone2021s-projects/verone-backoffice

**Configuration**:
- Framework: Next.js 15.5.6
- Build Command: npm run build
- Install Command: npm install
- Output Directory: .next
- Node Version: Auto
- Production Branch: main

## Compte GitHub

**Organisation**: Verone2021  
**Email**: veronebyromeo@gmail.com (ou 163727524+Verone2021@users.noreply.github.com)  
**Username**: verone2021

**Personal Access Token**: `À FOURNIR PAR L'UTILISATEUR`
- Permissions requises: repo, workflow
- Stocké dans : .env.local (GH_TOKEN)

**Repository Principal**:
- Nom: Verone-backoffice
- ID: 1056163415
- URL: https://github.com/Verone2021/Verone-backoffice
- Branch principale: main
- Visibilité: Private

**Configuration Git Locale**:
```bash
git config user.name "Romeo Dos Santos"
git config user.email "163727524+Verone2021@users.noreply.github.com"
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

## Variables d'Environnement Critiques

**À configurer dans Vercel Dashboard** (Settings > Environment Variables) :
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- DATABASE_URL
- Toutes les autres vars de .env.local

**Environnement**: Production, Preview, Development (toutes)

## Notes Importantes

- ✅ Next.js 15.5.6 (pas de régression vers 14)
- ✅ tsconfig.json : moduleResolution: "node" (fix critique Vercel)
- ✅ vercel.json : Configuration complète validée
- ⚠️ Ne JAMAIS commiter .env.local (contient tokens)
- ⚠️ Tokens régénérés le 2025-01-20 (Vercel) - GitHub token à venir
- 🔑 Workflow simple : Dashboard manuel + Git push (pas de CLI complexe)
