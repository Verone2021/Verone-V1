# DEPLOYMENT TRUTH - Single Source of Truth

**Date** : 2025-12-15
**Status** : CANON (cette doc est la vérité)

---

## ARCHITECTURE DÉPLOIEMENT ACTUELLE

```
┌─────────────────────────────────────────────────────────────┐
│                         GitHub                               │
│  Repository: Verone2021/Verone-V1                           │
│                                                              │
│  main ──────────────────────────────────────────────────►   │
│    │                                                         │
│    └── feature/* ──► PR ──► status checks ──► merge         │
└──────────────────────────────┬──────────────────────────────┘
                               │ webhook automatique
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│                                                              │
│  verone-back-office ◄──── auto-deploy depuis main           │
│  linkme            ◄──── auto-deploy depuis main           │
│  (site-internet)   ◄──── À configurer                       │
└─────────────────────────────────────────────────────────────┘
```

---

## TRUTH TABLE - PROJETS VERCEL

| App           | Projet Vercel        | Root Directory       | Build Command                                    | Output                     | Status      |
| ------------- | -------------------- | -------------------- | ------------------------------------------------ | -------------------------- | ----------- |
| back-office   | `verone-back-office` | `apps/back-office`   | `turbo run build --filter=@verone/back-office`   | `apps/back-office/.next`   | ✅ ACTIF    |
| linkme        | `linkme`             | `apps/linkme`        | `turbo run build --filter=@verone/linkme`        | `apps/linkme/.next`        | ✅ ACTIF    |
| site-internet | (À créer)            | `apps/site-internet` | `turbo run build --filter=@verone/site-internet` | `apps/site-internet/.next` | 🔜 PLANIFIÉ |

**Preuve** : `/vercel.json` (lignes 1-10)

---

## ENV VARS PAR APP

### Back-Office (Production)

| Variable                        | Requis | Scope                    |
| ------------------------------- | ------ | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅     | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅     | Production, Preview, Dev |
| `SUPABASE_SERVICE_ROLE_KEY`     | ✅     | Production uniquement    |
| `NEXTAUTH_URL`                  | ✅     | Production               |
| `NEXTAUTH_SECRET`               | ✅     | Production               |
| `GOOGLE_CLIENT_ID`              | ✅     | Production               |
| `GOOGLE_CLIENT_SECRET`          | ✅     | Production               |

### LinkMe (Production)

| Variable                        | Requis | Scope                    |
| ------------------------------- | ------ | ------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅     | Production, Preview, Dev |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅     | Production, Preview, Dev |
| `NEXT_PUBLIC_LINKME_URL`        | ✅     | Production               |

**Note** : Pas de `SUPABASE_SERVICE_ROLE_KEY` pour LinkMe (Revolut OFF)

**Preuve** : `docs/DEPLOYMENT.md` (lignes 54-82)

---

## WORKFLOW GIT

### Branches

| Branche      | Rôle                            | Protection                  |
| ------------ | ------------------------------- | --------------------------- |
| `main`       | Production (auto-deploy Vercel) | Ruleset "Protect main"      |
| `production` | Legacy (gelée, lecture seule)   | Ruleset "Freeze production" |
| `feature/*`  | Développement                   | Aucune                      |

**Preuve** : `docs/BRANCHING.md` (lignes 10-14)

### Workflow PR

```bash
# 1. Créer branche depuis main à jour
git checkout main && git pull origin main
git checkout -b feature/ma-feature

# 2. Développer et committer
git add . && git commit -m "feat: description"

# 3. Pousser et créer PR
git push -u origin feature/ma-feature
gh pr create --base main --title "feat: Ma feature"

# 4. Attendre status checks Vercel (automatiques)
# 5. Merge via GitHub UI (squash recommandé)
```

---

## STATUS CHECKS REQUIS

| Check                         | Projet        | Requis         |
| ----------------------------- | ------------- | -------------- |
| `Vercel – verone-back-office` | back-office   | ✅             |
| `Vercel – linkme`             | linkme        | ✅             |
| `Vercel – site-internet`      | site-internet | 🔜 (à ajouter) |

**Preuve** : `docs/governance/GITHUB-RULESETS.md` (lignes 20-25)

---

## ROLLBACK

### Via Vercel Dashboard (Recommandé)

1. Vercel Dashboard → Projet → Deployments
2. Trouver déploiement fonctionnel précédent
3. "..." → "Promote to Production"

### Via Git

```bash
git log --oneline -5
git revert <commit-sha>
git push origin main
# Auto-redéploiement via webhook
```

**Preuve** : `docs/DEPLOYMENT.md` (lignes 104-125)

---

## CE QUI EST FAUX / OBSOLÈTE

| Source                  | Affirmation                      | Vérité                 |
| ----------------------- | -------------------------------- | ---------------------- |
| Ancienne mémoire Serena | "Manual deployment only"         | ❌ Auto-deploy activé  |
| CLAUDE.md (actuel)      | "production-stable = Production" | ❌ `main` = Production |
| Vieilles docs Oct 2025  | "Single Vercel check"            | ❌ 2 checks requis     |

---

## URLS PRODUCTION

| App         | URL                                     |
| ----------- | --------------------------------------- |
| back-office | https://verone-backoffice.vercel.app    |
| linkme      | https://linkme.vercel.app (à confirmer) |

---

**Dernière mise à jour** : 2025-12-15
**Validé par** : Audit automatique `scripts/repo-audit.sh`
