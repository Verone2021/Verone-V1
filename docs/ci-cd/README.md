# 🚀 CI/CD - Vérone Back Office

Documentation des processus d'intégration continue et de déploiement continu pour le projet Vérone.

---

## 📁 Structure

```
docs/ci-cd/
├── README.md                          # Ce fichier
└── vercel-deployment-fix-2025-10.md   # Fix déploiement Vercel octobre 2025
```

---

## 📚 Documentation Disponible

### Déploiements Vercel

- **[Fix Déploiement Vercel - Octobre 2025](./vercel-deployment-fix-2025-10.md)**
  - **Date** : 24 octobre 2025
  - **Statut** : ✅ Résolu
  - **Problème** : Vercel ne détectait pas nouveaux commits GitHub
  - **Cause** : Webhook obsolète + GitHub non connecté
  - **Solution** : Branche `production-stable` + reconnexion GitHub + commit manuel via UI
  - **Résultat** : Déploiement réussi en 1m 41s, zero console errors

---

## 🔄 Workflow Déploiement Actuel

### Production

- **Branch** : `production-stable`
- **Auto-deploy** : ✅ Activé
- **URL** : https://verone-v1.vercel.app
- **Environnement** : Production
- **Vercel Project** : verone-v1

### Staging (Preview)

- **Branch** : `main`
- **Auto-deploy** : ✅ Activé (preview deployments)
- **URL** : `https://verone-v1-git-{branch}-verone2021s-projects.vercel.app`
- **Environnement** : Preview

---

## 🛠️ Commandes Utiles

### Vérifier État Production

```bash
# Vercel
export VERCEL_TOKEN="uY53v0FVdu2GW3pPYgtbKcsk"
export PROJECT_ID="prj_X4eg9YtIF4qS2eTwIRLidsA9SB1d"

# Dernier déploiement
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=1" \
  | jq '.deployments[0] | {state, url, createdAt, target}'

# Connexion GitHub
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/$PROJECT_ID" \
  | jq '.link, .productionBranch'
```

### Trigger Déploiement Manuel

```bash
# Option 1 : Via Git
git checkout production-stable
git commit --allow-empty -m "trigger: Manual deployment"
git push origin production-stable

# Option 2 : Via GitHub UI (si permissions issues)
# Créer fichier .vercel-deploy-trigger-YYYYMMDD via interface GitHub
```

### Build Local

```bash
# Development
npm run dev

# Production build (test)
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 🚨 Troubleshooting

### Vercel Ne Détecte Pas Commits

1. **Vérifier connexion GitHub**

   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v9/projects/$PROJECT_ID" | jq '.link'
   ```

   Si `null` → Déconnecter/reconnecter GitHub

2. **Vérifier webhooks GitHub**

   ```bash
   gh api repos/Verone2021/Verone-V1/hooks
   ```

   Chercher `api.vercel.com` avec `last_response.code = 200`

3. **Vérifier production branch**
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v9/projects/$PROJECT_ID" | jq '.productionBranch'
   ```
   Doit être `"production-stable"`

### Build Failures

1. **Check build logs** : https://vercel.com/verone2021s-projects/verone-v1/deployments
2. **Vérifier variables d'environnement** : Settings > Environment Variables
3. **Test build local** : `npm run build`

### Console Errors Production

```javascript
// Via MCP Playwright
await page.goto('https://verone-v1.vercel.app');
const errors = await page.console_messages({ onlyErrors: true });
// Doit retourner [] (zero tolerance)
```

---

## 📊 Métriques & Monitoring

### SLOs Production

- **Build Time** : < 2 minutes
- **Deployment Frequency** : Multiple/jour
- **Console Errors** : 0 (zero tolerance)
- **Uptime** : 99.9%

### URLs Monitoring

- **Production** : https://verone-v1.vercel.app
- **Vercel Dashboard** : https://vercel.com/verone2021s-projects/verone-v1
- **Analytics** : https://vercel.com/verone2021s-projects/verone-v1/analytics

---

## 🔗 Références

### Documentation Externe

- [Vercel Deployments](https://vercel.com/docs/deployments)
- [Vercel Git Integration](https://vercel.com/docs/deployments/git)
- [Vercel API](https://vercel.com/docs/rest-api)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

### Documentation Interne

- [Configuration Vercel](../guides/VERCEL-CONFIGURATION-2025.md)
- [Architecture Système](../../CLAUDE.md)

---

**Dernière mise à jour** : 24 octobre 2025
**Mainteneur** : Romeo Dos Santos
