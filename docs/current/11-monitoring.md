---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - .github/workflows/monitoring-2025.yml
references:
  - docs/monitoring/
  - docs/troubleshooting/
---

# Monitoring Verone

Observabilite et debugging.

## Outils

| Outil | Usage | Status |
|-------|-------|--------|
| **Vercel Analytics** | Performance, Web Vitals | Actif |
| **Vercel Logs** | Runtime logs | Actif |
| **Sentry** | Error tracking | Planifie |

## Console errors policy

**Zero tolerance** - Aucune erreur console acceptee.

```bash
# Verifier localement
npm run dev
# Ouvrir console navigateur
# 0 erreurs = OK
```

## Logs Vercel

- **Build Logs**: Vercel > Deployments > [deploy] > Build
- **Runtime Logs**: Vercel > Functions > Logs

## Alertes

| Type | Notification |
|------|--------------|
| Build fail | Email Vercel |
| Console errors | CI (GitHub Actions) |

## GitHub Actions monitoring

- `.github/workflows/monitoring-2025.yml` - Checks automatiques
- `.github/workflows/audit.yml` - Audits securite

## Troubleshooting commun

| Probleme | Solution |
|----------|----------|
| Page blanche | Verifier console, logs Vercel |
| 500 error | Logs Vercel Functions |
| Auth fail | Verifier env vars Supabase |
| Build fail | `npm run build` local |

## Liens

- [Deployment](./07-deployment.md) - CI/CD
- [Troubleshooting](../troubleshooting/) - Guides debug

---

*Derniere verification: 2025-12-17*
