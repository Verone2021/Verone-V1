# Decisions Non-Negociables Verone

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- CLAUDE.md
- .env files
  Owner: Romeo Dos Santos
  Created: 2025-12-01
  Updated: 2026-01-10

---

## Credentials & Acces

- **Email unique GitHub/Vercel** : `veronebyromeo@gmail.com`
- **NE JAMAIS inventer d'autres emails**
- **GitHub Account** : Verone2021
- **Vercel Team** : verone2021s-projects

---

## Database Supabase - Regle Absolue

**1 SEULE DATABASE pour tout le projet**

- DEV = PREVIEW = PRODUCTION = meme base Supabase
- Memes `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` partout
- **NE JAMAIS proposer de dupliquer/isoler la DB**
- **NE JAMAIS creer un 2eme projet Supabase**

---

## Stack Technique

- **Monorepo** : Turborepo + pnpm (`pnpm-lock.yaml`)
- **Package Manager** : pnpm (pas npm, pas yarn)
- **3 Apps** :
  - `apps/back-office` (Port 3000) - Deploye sur Vercel
  - `apps/linkme` (Port 3002) - Deploye sur Vercel
  - `apps/site-internet` (Port 3001) - Future

---

## Vercel Configuration

### Back-Office

- Projet : `verone-back-office`
- Root Directory : `apps/back-office`

### LinkMe

- Projet : `linkme`
- Root Directory : `apps/linkme`
- Include files outside root directory : **ON**

---

## Git Workflow

- **Branch principale** : `main` (production)
- **Strategie** : GitHub Flow simple
- **Pas de branch `develop`**
- **1 PR max pour corrections**

---

## Regles Strictes

1. **Pas de refacto** - on corrige uniquement ce qui bloque
2. **Pas de cleanup** - pas de "pendant qu'on y est"
3. **Pas de duplication DB** - 1 seule Supabase
4. **Pas d'invention** - on modifie uniquement ce qu'on a vu/valide
5. **Logs obligatoires** - modifier un workflow CI uniquement avec preuve de l'erreur

---

## Regles Absolues

1. **JAMAIS** creer un 2eme projet Supabase
2. **TOUJOURS** utiliser pnpm (pas npm/yarn)
3. **JAMAIS** inventer des credentials

---

## References

- `CLAUDE.md` - Instructions projet
- `.env.local` - Variables locales
- `docs/current/serena/vercel-no-docker.md` - Deployment
