# Décisions Non-Négociables - Vérone Project (Décembre 2025)

## 🔐 Credentials & Accès

- **Email unique GitHub/Vercel** : `veronebyromeo@gmail.com`
- **NE JAMAIS inventer d'autres emails**
- **GitHub Account** : Verone2021
- **Vercel Team** : verone2021s-projects

## 🗄️ Database Supabase - RÈGLE ABSOLUE

**1 SEULE DATABASE pour tout le projet**

- DEV = PREVIEW = PRODUCTION = même base Supabase
- Mêmes `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` partout
- **NE JAMAIS proposer de dupliquer/isoler la DB**
- **NE JAMAIS créer un 2ème projet Supabase**

## 📦 Stack Technique

- **Monorepo** : Turborepo + pnpm (`pnpm-lock.yaml`)
- **Package Manager** : pnpm (pas npm, pas yarn)
- **3 Apps** :
  - `apps/back-office` (Port 3000) - ✅ Déployé sur Vercel
  - `apps/linkme` (Port 3002) - 🎯 Objectif déploiement
  - `apps/site-internet` (Port 3001) - Future

## 🚀 Vercel Configuration

### Back-Office (✅ Fonctionnel)

- Projet : `verone-back-office`
- Root Directory : `apps/back-office`

### LinkMe (🎯 En cours)

- Projet : `linkme`
- Root Directory : `apps/linkme`
- Include files outside root directory : **ON**
- **Env Variables (Dev + Preview + Production)** :
  - `NEXT_PUBLIC_SUPABASE_URL` (même valeur partout)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (même valeur partout)
- **PAS de `SUPABASE_SERVICE_ROLE_KEY`** (Revolut OFF = pas de paiement)

## 🔄 Git Workflow

- **Branch principale** : `main` (production)
- **Stratégie** : GitHub Flow simple
- **Pas de branch `develop`**
- **1 PR max pour corrections**

## ❌ Règles Strictes

1. **Pas de refacto** - on corrige uniquement ce qui bloque
2. **Pas de cleanup** - pas de "pendant qu'on y est"
3. **Pas de duplication DB** - 1 seule Supabase
4. **Pas d'invention** - on modifie uniquement ce qu'on a vu/validé
5. **Logs obligatoires** - modifier un workflow CI uniquement avec preuve de l'erreur

## 📋 État Actuel (2025-12-14)

- PR #16 : Security fix Next.js CVE-2025-66478
- Workflows CI migrés de npm vers pnpm
- Push bloqué : problème d'auth Git (en cours de résolution)

## 🎯 Objectif Immédiat

1. Débloquer git push
2. Passer checks PR #16
3. Merge PR #16
4. Redeploy LinkMe sur Vercel depuis main
5. Prouver que title contient "LINKME"
