# Credentials Vercel & GitHub - Vérone Back Office

## Vercel API Token (ACTIF - 2025-12-11)

**Token** : `EliSO2dFdhECtqx1Fe6HX3rM`
- **Nom** : `claude-deploy-token-2025-12`
- **Scope** : Full Account
- **Expiration** : Never expires
- **Créé le** : 2025-12-11
- **Usage CLI** : `vercel --prod --token=EliSO2dFdhECtqx1Fe6HX3rM`

## GitHub Personal Access Token

**Token** : `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`
- Créé pour intégration GitHub/Vercel

## Projet Vercel

- **Projet** : verone-v1
- **Team** : verone2021
- **URL Production** : https://verone-v1.vercel.app
- **Dashboard** : https://vercel.com/verone2021s-projects/verone-v1

## Branches Git

- `main` : Développement/Staging
- `production-stable` : Production (auto-deploy Vercel)

## Workflow Déploiement

1. Développer sur `main`
2. Merger `main` → `production-stable`
3. Push `production-stable` → Auto-deploy Vercel

## Notes

- Tokens précédents supprimés le 2025-12-11 (4 tokens obsolètes)
- Token unique sans expiration pour déploiements CLI
