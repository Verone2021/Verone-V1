---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - .github/workflows/
  - vercel.json (si existe)
  - apps/*/next.config.ts
merged_from:
  - docs/DEPLOYMENT.md
  - docs/guides/04-deployment/*.md
---

# Deployment Verone

GitHub + Vercel (auto-deploy).

## Architecture

```
GitHub (main)
    │
    ├── Push/Merge → Vercel Production (auto)
    └── PR → Vercel Preview (optionnel)
```

## Flux

| Evenement | Action |
|-----------|--------|
| Push sur `main` | Deploy Production |
| Ouverture PR | Deploy Preview |
| Merge PR | Deploy Production |

## Projets Vercel

| App | Projet Vercel | Etat | Port local |
|-----|---------------|------|------------|
| back-office | `verone-back-office` | Actif | 3000 |
| site-internet | (a creer) | Planifie | 3001 |
| linkme | (a creer) | Planifie | 3002 |

## Variables d'environnement

### Back-Office (Production)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cle anonyme (publique) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service (serveur) |
| `GOOGLE_CLIENT_ID` | OAuth Google |
| `GOOGLE_CLIENT_SECRET` | OAuth Google |

**Valeurs**: Vercel Dashboard > Settings > Environment Variables

## GitHub Actions

| Workflow | Declencheur | Action |
|----------|-------------|--------|
| `pr-validation.yml` | PR | Type-check, lint, build |
| `deploy-production.yml` | Push main | Deploy Vercel |
| `deploy-safety.yml` | Push main | Verifications pre-deploy |
| `typescript-quality.yml` | PR | Quality checks |
| `audit.yml` | Schedule | Audits securite |
| `database-audit.yml` | Schedule | Audit DB |

## Checklist pre-deploiement

### Avant merge sur main

```bash
npm run type-check    # 0 erreurs
npm run build         # Build reussi
# Console errors = 0 sur localhost
```

### Apres deploiement

- [ ] URL production accessible
- [ ] Login fonctionne
- [ ] Dashboard charge
- [ ] Console Vercel: pas d'erreurs

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

## Creer nouveau projet Vercel (monorepo)

1. Vercel Dashboard > "Add New Project"
2. Importer `Verone2021/Verone-V1`
3. Configurer:
   - **Root Directory**: `apps/[app-name]`
   - **Build Command**: `turbo run build --filter=@verone/[app-name]`
   - **Output Directory**: `apps/[app-name]/.next`
4. Ajouter variables d'environnement
5. Deploy

## Troubleshooting

| Probleme | Solution |
|----------|----------|
| Build echoue | `npm run build` local, verifier logs Vercel |
| Deploy ne se declenche pas | Verifier webhook GitHub > Vercel |
| Env vars manquantes | Vercel > Settings > Environment Variables |

## Liens

- [Architecture](./02-architecture.md) - Structure Turborepo
- [GitHub Workflows](./.github/workflows/) - CI/CD configs

---

*Derniere verification: 2025-12-17*
