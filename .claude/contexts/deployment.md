# 🚀 DEPLOYMENT CONTEXT - Vérone Back Office

**Chargement** : Uniquement si travail CI/CD, Vercel, rollback, PR

---

## ⚙️ ARCHITECTURE DÉPLOIEMENT (Phase 4 Turborepo)

### Workflow Production

```
main branch → Vercel auto-deploy (2 apps)
                    ↓
            ┌─────────────────┐
            │ Vercel Webhook  │
            └────────┬────────┘
                     ├─→ back-office build → verone-backoffice.vercel.app
                     └─→ linkme build → linkme.vercel.app
```

### Status Checks Requis (GitHub Ruleset)

| Check                         | App         | Obligatoire |
| ----------------------------- | ----------- | ----------- |
| `Vercel – verone-back-office` | back-office | ✅ OUI      |
| `Vercel – linkme`             | linkme      | ✅ OUI      |

**Aucune PR ne peut être mergée si un check échoue.**

---

## 🔀 BRANCH STRATEGY

```bash
main                    # Production (protected, auto-deploy)
├── feature/*          # Feature branches
└── hotfix/*           # Emergency fixes

# Règles branches protégées (main) :
- Require status checks (2 Vercel checks)
- No force push
- No direct commits
```

---

## 🔙 ROLLBACK PROCEDURES

### Via Vercel Dashboard (Recommandé)

1. Vercel Dashboard → Projet → Deployments
2. Sélectionner déploiement fonctionnel précédent
3. "..." → "Promote to Production"

### Via Git (Revert)

```bash
git log --oneline -5
git revert <commit-sha>
git push origin main  # Auto-redéploiement via webhook
```

---

## 🌐 APPS DÉPLOYÉES

| App           | URL Production                       | Build Command                                    |
| ------------- | ------------------------------------ | ------------------------------------------------ |
| back-office   | https://verone-backoffice.vercel.app | `turbo run build --filter=@verone/back-office`   |
| linkme        | https://linkme.vercel.app            | `turbo run build --filter=@verone/linkme`        |
| site-internet | (À déployer)                         | `turbo run build --filter=@verone/site-internet` |

---

## 📚 RÉFÉRENCES

- **Source de vérité** : `docs/audit/DEPLOYMENT_TRUTH.md`
- **GitHub Rulesets** : `docs/governance/GITHUB-RULESETS.md`
- **Workflows CI** : `.github/workflows/pr-validation.yml`

---

**Dernière mise à jour** : 2025-12-17
**Mainteneur** : Romeo Dos Santos
