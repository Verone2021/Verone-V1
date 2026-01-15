# Vercel Deploy Hook - Production (2025-12-12)

## Configuration Finale Validée

### Projet Vercel

- **Nom** : `verone-back-office`
- **URL Dashboard** : https://vercel.com/verone2021s-projects/verone-back-office
- **URL Production** : https://verone-back-office.vercel.app

### Repository GitHub

- **Repository** : `Verone2021/Verone-V1`
- **Branche Production** : `production`
- **Connexion** : Confirmée (Connected 11h ago au 2025-12-12)

### Deploy Hook (CRÉÉ 2025-12-12)

- **Nom** : `Production-Deploy`
- **Branche** : `production`
- **URL** : `https://api.vercel.com/v1/integrations/deploy/prj_QgEq7BYRJCeiw7rDrxumSgToPtkW/j6kuExaKNS`

### Comment Déclencher un Déploiement

```bash
curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_QgEq7BYRJCeiw7rDrxumSgToPtkW/j6kuExaKNS"
```

### Avantages du Deploy Hook

- Contourne les problèmes d'authentification Git ("Deployment request did not have a git author with access")
- Déploie toujours le HEAD de la branche `production`
- Pas besoin de mapping email commit/Vercel
- Simple POST HTTP suffit

### Variables d'Environnement

Toutes configurées sur Vercel (confirmé par utilisateur) :

- Supabase (4 variables)
- Feature Flags (12 variables NEXT*PUBLIC*\*)
- APIs Externes (Google Merchant, Abby, Qonto, Packlink)
- CRON_SECRET

### Build Configuration

- **Build Command** : `turbo run build --filter=@verone/back-office`
- **Output Directory** : `apps/back-office/.next`
- **Framework** : Next.js

### Historique Problèmes Résolus

1. ❌ Anciens commits déployés au lieu des nouveaux → ✅ Deploy Hook contourne ce problème
2. ❌ "Deployment request did not have a git author with access" → ✅ Deploy Hook ne vérifie pas l'auteur
3. ❌ Aucun Deploy Hook n'existait → ✅ Créé "Production-Deploy" sur branche "production"

---

Créé par Claude Code - 2025-12-12
