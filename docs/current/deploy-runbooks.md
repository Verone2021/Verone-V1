# Deploiement Verone

**Derniere mise a jour:** 2026-01-09

GitHub + Vercel (auto-deploy).

---

## Architecture

```
GitHub (main)
    │
    ├── Push/Merge → Vercel Production (auto)
    └── PR → Vercel Preview (optionnel)
```

---

## Projets Vercel

| App           | Projet Vercel        | Status   | Port Local |
| ------------- | -------------------- | -------- | ---------- |
| back-office   | `verone-back-office` | ACTIF    | 3000       |
| site-internet | (a creer)            | PLANIFIE | 3001       |
| linkme        | (a creer)            | PLANIFIE | 3002       |

---

## Flux Deploiement

| Evenement       | Action            |
| --------------- | ----------------- |
| Push sur `main` | Deploy Production |
| Ouverture PR    | Deploy Preview    |
| Merge PR        | Deploy Production |

---

## GitHub Actions

| Workflow                 | Declencheur | Action                   |
| ------------------------ | ----------- | ------------------------ |
| `pr-validation.yml`      | PR          | Type-check, lint, build  |
| `deploy-production.yml`  | Push main   | Deploy Vercel            |
| `deploy-safety.yml`      | Push main   | Verifications pre-deploy |
| `typescript-quality.yml` | PR          | Quality checks           |

---

## Checklist Pre-Deploiement

### Avant Merge sur Main

```bash
npm run type-check    # 0 erreurs
npm run build         # Build reussi
# Console errors = 0 sur localhost
```

### Apres Deploiement

- [ ] URL production accessible
- [ ] Login fonctionne
- [ ] Dashboard charge
- [ ] Console Vercel: pas d'erreurs

---

## Variables d'Environnement Vercel

| Variable                        | Description  | Ou               |
| ------------------------------- | ------------ | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL Supabase | Vercel Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cle anonyme  | Vercel Dashboard |
| `SUPABASE_SERVICE_ROLE_KEY`     | Cle service  | Vercel Dashboard |
| `QONTO_API_KEY`                 | API Qonto    | Vercel Dashboard |
| `SENTRY_DSN`                    | Sentry DSN   | Vercel Dashboard |

**Acces:** Vercel Dashboard > Settings > Environment Variables

---

## Rollback

### Via Vercel Dashboard

1. Vercel > Deployments
2. Trouver deploiement precedent OK
3. "..." > "Promote to Production"

### Via Git

```bash
git log --oneline -5
git revert <commit-sha>
git push origin main
```

---

## Creer Nouveau Projet Vercel (Monorepo)

1. Vercel Dashboard > "Add New Project"
2. Importer `Verone2021/Verone-V1`
3. Configurer:
   - **Root Directory:** `apps/[app-name]`
   - **Build Command:** `turbo run build --filter=@verone/[app-name]`
   - **Output Directory:** `apps/[app-name]/.next`
4. Ajouter variables d'environnement
5. Deploy

---

## Troubleshooting

| Probleme                   | Solution                                    |
| -------------------------- | ------------------------------------------- |
| Build echoue               | `npm run build` local, verifier logs Vercel |
| Deploy ne se declenche pas | Verifier webhook GitHub > Vercel            |
| Env vars manquantes        | Vercel > Settings > Environment Variables   |
| 500 en production          | Verifier logs Vercel Functions              |

---

## Monitoring Post-Deploy

- **Vercel Dashboard:** Logs, Functions, Analytics
- **Sentry:** Erreurs runtime
- **Supabase Dashboard:** Queries, RLS errors

---

_Voir [architecture.md](./architecture.md) pour la structure Turborepo_
