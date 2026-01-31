# Decision : Suppression Variables Sentry

**Date** : 2026-01-30
**Status** : Action utilisateur requise

## Context

Variables SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT configurées sur Vercel mais :

- 0 occurrences dans le codebase
- Non utilisées (grep -r "SENTRY\_" retourne 0 résultats)
- Causent warnings Turborepo inutiles

## Action Requise (Utilisateur)

Supprimer de Vercel Dashboard → Environment Variables :

1. back-office : SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
2. linkme : SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
3. site-internet : SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

## Vérification

Après suppression, `turbo build` ne doit plus afficher :

```
[WARN] SENTRY_AUTH_TOKEN is configured but not in allowlist
```

## Rollback

Si Sentry est réimplémenté :

1. Re-ajouter vars sur Vercel
2. Ajouter à turbo.json → globalEnv
