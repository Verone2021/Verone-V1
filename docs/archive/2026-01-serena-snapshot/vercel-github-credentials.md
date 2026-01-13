# Credentials Vercel & GitHub - Vérone Back Office

## ⚠️ ROTATION SÉCURITÉ (2025-12-13)

**IMPORTANT** : Les anciens tokens ont été RÉVOQUÉS suite à leur exposition dans l'historique git.

### Tokens Révoqués (INUTILISABLES)

- ❌ `claude-deploy-token-2025-12` (Vercel) - Supprimé 2025-12-13
- ❌ `ghp_44alAX...` (GitHub PAT) - Révoqué antérieurement

### Nouveaux Tokens (2025-12-13)

- ✅ **Vercel** : `verone-deploy-2025-12`
  - Scope : `verone2021's projects` (minimal)
  - Expiration : 2026-03-13 (90 jours)
  - Valeur : **NON stockée ici** (voir .env.local)

- ✅ **GitHub PAT** : Aucun nouveau créé (non nécessaire - l'ancien était déjà révoqué)

## Projet Vercel

- **Projet** : verone-v1
- **Team** : verone2021
- **URL Production** : https://verone-backoffice.vercel.app
- **Dashboard** : https://vercel.com/verone2021s-projects/verone-v1

## GitHub Flow (Nouveau - 2025-12-13)

- `main` : **Production** (auto-deploy Vercel)
- `production` : Gelée (read-only)
- `production-stable` : Gelée (read-only)

## Workflow Déploiement

1. Développer sur feature branch
2. PR vers `main`
3. Merge → Auto-deploy Vercel Production

## Actions Sécurité Effectuées

1. ✅ `.serena/memories/` retiré du tracking git (commit d2061b73)
2. ✅ Token Vercel exposé supprimé
3. ✅ Nouveau token Vercel créé (scope minimal, expire 90j)
4. ✅ GitHub PAT déjà révoqué (confirmé)
5. ⏳ Push commit sécurité sur main
6. ⏳ Branch protection à configurer

## Notes

- **NE JAMAIS** stocker de credentials dans ce fichier
- Utiliser `.env.local` pour les valeurs sensibles
- `.serena/` est dans `.gitignore`
