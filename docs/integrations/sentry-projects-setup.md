# Configuration Projets Sentry - Back-Office & LinkMe

**Date** : 2026-01-15
**Objectif** : Séparer les erreurs des 2 applications dans des projets Sentry distincts

---

## 🎯 Pourquoi Séparer ?

**Problème actuel** : Les erreurs back-office et linkme sont mélangées dans le même projet Sentry.

**Conséquences** :
- ❌ Impossible de filtrer par app
- ❌ Alertes non ciblées
- ❌ Metrics polluées
- ❌ Budget quota partagé

**Solution** : 2 projets Sentry distincts avec DSN séparés.

---

## 📋 Procédure Création Projets (À faire manuellement)

### Étape 1 : Renommer le Projet Existant

1. Aller sur https://verone-4q.sentry.io/settings/projects/
2. Trouver projet actuel : `javascript-nextjs`
3. Cliquer sur le projet → Settings → General
4. **Project Name** : Renommer en `back-office-nextjs`
5. **Project Slug** : `back-office-nextjs`
6. Sauvegarder

**📝 Copier le DSN** :
```
Settings → Client Keys (DSN)
DSN = https://[KEY]@o4510701115473920.ingest.de.sentry.io/[PROJECT_ID]
```

**Sauvegarder dans** : `.env.local` du back-office
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[KEY]@o4510701115473920.ingest.de.sentry.io/[PROJECT_ID]
```

---

### Étape 2 : Créer Projet LinkMe

1. Aller sur https://verone-4q.sentry.io/projects/new/
2. **Platform** : Next.js
3. **Project Name** : `linkme-nextjs`
4. **Team** : Default (ou créer team "LinkMe" si nécessaire)
5. Cliquer **Create Project**

**📝 Copier le nouveau DSN** :
```
Le DSN s'affiche immédiatement après création
DSN = https://[NEW_KEY]@o4510701115473920.ingest.de.sentry.io/[NEW_PROJECT_ID]
```

**Sauvegarder dans** : `.env.local` de linkme
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[NEW_KEY]@o4510701115473920.ingest.de.sentry.io/[NEW_PROJECT_ID]
```

---

## ⚙️ Configuration Vercel Environment Variables

**CRITIQUE** : Chaque projet Vercel doit avoir son propre DSN !

### Back-Office Project (Vercel)

1. Aller sur https://vercel.com/verone2021s-projects/verone-back-office
2. Settings → Environment Variables
3. Trouver `NEXT_PUBLIC_SENTRY_DSN`
4. **Modifier** avec le DSN back-office
5. Cocher **Production + Preview + Development**

**Variables Sentry requises** :
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[BACK_OFFICE_KEY]@...
SENTRY_AUTH_TOKEN=[TOKEN] # Générer dans Sentry → Settings → Auth Tokens
SENTRY_ORG=verone-4q
SENTRY_PROJECT=back-office-nextjs
```

### LinkMe Project (Vercel)

1. Aller sur https://vercel.com/verone2021s-projects/linkme
2. Settings → Environment Variables
3. Trouver `NEXT_PUBLIC_SENTRY_DSN`
4. **Modifier** avec le DSN linkme
5. Cocher **Production + Preview + Development**

**Variables Sentry requises** :
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[LINKME_KEY]@...
SENTRY_AUTH_TOKEN=[TOKEN] # Même token OK
SENTRY_ORG=verone-4q
SENTRY_PROJECT=linkme-nextjs
```

---

## 🔑 Générer SENTRY_AUTH_TOKEN

Si pas encore fait :

1. Aller sur https://verone-4q.sentry.io/settings/account/api/auth-tokens/
2. Cliquer **Create New Token**
3. **Name** : `Vercel Deployments`
4. **Scopes** :
   - `project:read`
   - `project:releases`
   - `project:write`
   - `org:read`
5. Copier le token (affiché une seule fois !)
6. Ajouter dans les env vars Vercel des 2 projets

---

## ✅ Vérification

Après configuration :

1. **Déployer une PR** sur chaque app
2. **Déclencher une erreur** (route debug ou console.error())
3. **Vérifier dans Sentry** :
   - Erreurs back-office → projet `back-office-nextjs`
   - Erreurs linkme → projet `linkme-nextjs`

---

## 📊 Configuration Alerts (Optionnel)

Une fois les projets séparés, configurer des alertes spécifiques :

### Back-Office Alerts

- Erreur niveau "error" en production → Email + Slack
- Plus de 10 erreurs/min → Incident majeur
- Release déployée → Notification

### LinkMe Alerts

- Erreur niveau "error" en production → Email + Slack
- Erreur sur parcours commande → Alert critique
- Release déployée → Notification

---

## 🔗 Liens Utiles

- [Sentry Projects](https://verone-4q.sentry.io/settings/projects/)
- [Auth Tokens](https://verone-4q.sentry.io/settings/account/api/auth-tokens/)
- [Vercel Back-Office](https://vercel.com/verone2021s-projects/verone-back-office)
- [Vercel LinkMe](https://vercel.com/verone2021s-projects/linkme)

---

**Prochaines étapes** : Une fois les DSN configurés, redéployer les 2 apps pour activer la séparation.
