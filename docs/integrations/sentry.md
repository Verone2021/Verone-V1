# Integration Sentry (Monitoring)

**Derniere mise a jour:** 2026-01-19

Service de monitoring erreurs frontend/backend.

---

## Status

| Element   | Valeur                                  |
| --------- | --------------------------------------- |
| Status    | **ACTIF**                               |
| Usage     | Erreurs frontend/backend, Performance   |
| Dashboard | https://sentry.io/organizations/verone/ |

---

## Configuration

### Applications Suivies

- **back-office** - CRM/ERP
- **linkme** - Plateforme affiliation
- **site-internet** - E-commerce (futur)

### next.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

---

## Variables Environnement

```bash
# Sentry DSN (public)
SENTRY_DSN=https://xxx@sentry.io/yyy

# Auth token (secret - CI/CD uniquement)
SENTRY_AUTH_TOKEN=<secret>
```

**Vercel:** Configurer dans Settings > Environment Variables

---

## Projets Sentry

| Projet                | DSN                                       | Usage             |
| --------------------- | ----------------------------------------- | ----------------- |
| verone-back-office    | `https://...@sentry.io/4507345897840640`  | Back-office       |
| verone-linkme         | `https://...@sentry.io/4507345897840641`  | LinkMe            |
| verone-site-internet  | `https://...@sentry.io/4507345897840642`  | Site (prevu)      |

---

## Alertes GitHub

Integration GitHub configuree:
- Issues Sentry → GitHub Issues (auto)
- Notifications Slack (optionnel)
- Email alertes critiques

### Configuration Alertes

1. Sentry Dashboard > Settings > Integrations
2. GitHub → Configure
3. Regles:
   - Erreurs > 10/min → Issue GitHub
   - Erreurs critiques → Notification immediate

---

## Verification

### Test Erreur Manuel

```typescript
// Dans une page Next.js
'use client'

export default function TestPage() {
  const throwError = () => {
    throw new Error('Test Sentry integration');
  }

  return <button onClick={throwError}>Test Sentry</button>
}
```

### Verifier Dashboard

1. Ouvrir: https://sentry.io/organizations/verone/issues/
2. Chercher erreur "Test Sentry integration"
3. Verifier stack trace complete

---

## Release Tracking

### Vercel Auto-Deploy

Sentry track automatiquement les releases Vercel:
- Release name: `${process.env.VERCEL_GIT_COMMIT_SHA}`
- Environment: `production` / `preview`

### Associer Commits

```bash
# Dans CI/CD
sentry-cli releases set-commits "$VERSION" --auto
```

---

## Performance Monitoring

### Metriques Suivies

- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)
- **TTFB** (Time To First Byte)

### Configuration

```typescript
// next.config.ts
Sentry.init({
  tracesSampleRate: 1.0, // 100% traces en dev
  // Production: 0.1 (10%) pour reduire volume
});
```

---

## Runbook Operations

### Nouvelle Erreur Critique

1. Notification Slack/Email reçue
2. Ouvrir issue Sentry
3. Analyser stack trace
4. Identifier commit coupable (via Release Tracking)
5. Fix + deploy
6. Marquer erreur "Resolved"

### Erreur Recurrente

1. Analyser pattern (frequence, users impactes)
2. Prioriser selon impact
3. Creer issue GitHub si necessaire
4. Fix dans sprint suivant

---

## Limites Plan

### Plan Actuel: Developer (Gratuit)

- 5,000 erreurs/mois
- 10,000 transactions/mois
- Retention: 30 jours
- 1 projet

### Upgrade Recommande: Team

- 50,000 erreurs/mois
- 100,000 transactions/mois
- Retention: 90 jours
- Projets illimites
- Cout: $26/mois

---

## Securite

- ⚠️ Ne jamais commiter `SENTRY_AUTH_TOKEN`
- ⚠️ Filtrer donnees sensibles (PII)
- ⚠️ Utiliser `beforeSend` hook pour sanitization

### Exemple Filtrage

```typescript
Sentry.init({
  beforeSend(event) {
    // Supprimer emails
    if (event.user?.email) {
      event.user.email = '[FILTERED]';
    }
    return event;
  }
});
```

---

## Reference

- Documentation: https://docs.sentry.io/
- SDK Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Dashboard: https://sentry.io/organizations/verone/
