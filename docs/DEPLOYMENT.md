# Deployment Guide - Verone Monorepo

**Date** : 2025-12-13
**Repository** : Verone2021/Verone-V1

---

## Architecture Déploiement

```
┌─────────────────────────────────────────────────────────┐
│                     GitHub                               │
│  main ─────────────────────────────────────────────────►│
│    │                                                     │
│    └── feature/* ──► PR ──► merge ──► main              │
└────────────────────────────┬────────────────────────────┘
                             │ webhook
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     Vercel                               │
│  Production ◄──── auto-deploy depuis main               │
│                                                          │
│  Preview ◄──── auto-deploy depuis PR (optionnel)        │
└─────────────────────────────────────────────────────────┘
```

---

## Flux GitHub → Vercel

### Déclenchement Automatique

| Événement       | Action Vercel              |
| --------------- | -------------------------- |
| Push sur `main` | Deploy Production          |
| Ouverture PR    | Deploy Preview (si activé) |
| Merge PR        | Deploy Production          |

### Status Check

- **Nom** : `Vercel – verone-back-office`
- **Requis** : Oui (bloque merge si échec)
- **Timeout** : ~5 minutes (build Turborepo)

---

## Variables d'Environnement

### Back-Office (Production)

> **Note** : Seuls les noms sont listés. Les valeurs sont dans Vercel Dashboard.

| Variable                        | Description                               |
| ------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL projet Supabase                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase (publique)           |
| `SUPABASE_SERVICE_ROLE_KEY`     | Clé service Supabase (serveur uniquement) |
| `NEXTAUTH_URL`                  | URL de l'application                      |
| `NEXTAUTH_SECRET`               | Secret NextAuth (généré)                  |
| `GOOGLE_CLIENT_ID`              | OAuth Google - Client ID                  |
| `GOOGLE_CLIENT_SECRET`          | OAuth Google - Secret                     |

### Site Internet (À configurer)

| Variable                        | Description          |
| ------------------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Même projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même clé anonyme     |
| `NEXT_PUBLIC_SITE_URL`          | URL du site public   |

### LinkMe (À configurer)

| Variable                        | Description          |
| ------------------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Même projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même clé anonyme     |
| `NEXT_PUBLIC_LINKME_URL`        | URL LinkMe           |

---

## Checklist Pré-Déploiement

### Avant chaque merge sur main

- [ ] Tests locaux passent (`npm run type-check`)
- [ ] Build local réussi (`npm run build`)
- [ ] Console errors = 0 (vérifier sur localhost)
- [ ] PR review approuvée (si configuré)
- [ ] Status check Vercel vert sur la PR

### Après déploiement

- [ ] Vérifier URL production accessible
- [ ] Vérifier login fonctionne
- [ ] Vérifier dashboard charge correctement
- [ ] Consulter logs Vercel si problème

---

## Procédure Rollback

### Via Vercel Dashboard

1. Aller sur [vercel.com/dashboard](https://vercel.com)
2. Sélectionner projet `verone-back-office`
3. Onglet "Deployments"
4. Trouver le déploiement précédent fonctionnel
5. Cliquer "..." → "Promote to Production"

### Via Git (revert)

```bash
# Identifier le commit problématique
git log --oneline -5

# Revert le commit
git revert <commit-sha>

# Push (déclenche redéploiement)
git push origin main
```

---

## Monitoring

### Logs Vercel

- **Runtime Logs** : Vercel Dashboard → Functions → Logs
- **Build Logs** : Vercel Dashboard → Deployments → [deployment] → Build Logs

### Alertes

- Échec build : Notification email Vercel
- Status check : Visible sur PR GitHub

---

## Configuration Vercel

### Fichier `vercel.json`

```json
{
  "version": 2,
  "name": "verone-back-office",
  "framework": "nextjs",
  "buildCommand": "turbo run build --filter=@verone/back-office",
  "outputDirectory": "apps/back-office/.next"
}
```

### Build Turborepo

Le build utilise Turborepo pour :

- Compiler uniquement le package modifié
- Cache des builds précédents
- Parallélisation des tâches

---

## Projets Vercel (Monorepo)

| App           | Projet Vercel        | État     |
| ------------- | -------------------- | -------- |
| back-office   | `verone-back-office` | Actif    |
| site-internet | (À créer)            | Planifié |
| linkme        | (À créer)            | Planifié |

### Créer un nouveau projet

1. Vercel Dashboard → "Add New Project"
2. Importer depuis GitHub `Verone2021/Verone-V1`
3. Configurer :
   - **Root Directory** : `apps/[app-name]`
   - **Build Command** : `turbo run build --filter=@verone/[app-name]`
   - **Output Directory** : `apps/[app-name]/.next`
4. Ajouter variables d'environnement
5. Deploy

---

## Troubleshooting

### Build échoue

1. Vérifier logs build Vercel
2. Reproduire localement : `npm run build`
3. Vérifier TypeScript : `npm run type-check`

### Déploiement ne se déclenche pas

1. Vérifier webhook GitHub → Vercel actif
2. Vérifier branche configurée dans Vercel
3. Consulter GitHub → Settings → Webhooks

### Variables d'environnement manquantes

1. Vercel Dashboard → Settings → Environment Variables
2. Vérifier scope (Production/Preview/Development)
3. Redéployer après modification

---

**Dernière mise à jour** : 2025-12-13
