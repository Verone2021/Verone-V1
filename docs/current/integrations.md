# Integrations Verone

**Derniere mise a jour:** 2026-01-09

APIs et services externes.

---

## Integrations Actives

### Qonto (Facturation)

| Element    | Valeur                                |
| ---------- | ------------------------------------- |
| Status     | **ACTIF**                             |
| Usage      | Factures, Avoirs, Devis, PDF          |
| Package    | `@verone/integrations/src/qonto/`     |
| API Routes | `apps/back-office/src/app/api/qonto/` |

#### Endpoints API

- `/api/qonto/invoices` - CRUD factures
- `/api/qonto/invoices/[id]/pdf` - Telecharger PDF
- `/api/qonto/credit-notes` - Avoirs
- `/api/qonto/quotes` - Devis
- `/api/qonto/quotes/service` - Devis services

#### Configuration

```typescript
// packages/@verone/integrations/src/qonto/client.ts
const qontoClient = new QontoClient({
  apiKey: process.env.QONTO_API_KEY,
  organizationId: process.env.QONTO_ORGANIZATION_ID,
});
```

---

### Sentry (Monitoring)

| Element   | Valeur                                  |
| --------- | --------------------------------------- |
| Status    | **ACTIF**                               |
| Usage     | Erreurs frontend/backend                |
| Dashboard | https://sentry.io/organizations/verone/ |

#### Configuration

```typescript
// next.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

### Google OAuth

| Element | Valeur                                |
| ------- | ------------------------------------- |
| Status  | **ACTIF**                             |
| Usage   | Login Google                          |
| Config  | Supabase Dashboard > Auth > Providers |

---

### Supabase

| Element    | Valeur                  |
| ---------- | ----------------------- |
| Status     | **ACTIF**               |
| Usage      | Database, Auth, Storage |
| Project ID | `aorroydfjsrygmosnzrl`  |

---

## Integrations Planifiees

| Service         | Usage                | Priorite |
| --------------- | -------------------- | -------- |
| Google Merchant | Feed e-commerce      | MOYENNE  |
| Stripe          | Paiements            | BASSE    |
| Packlink        | Expeditions          | BASSE    |
| Revolut         | Paiements B2C LinkMe | BASSE    |

---

## Integration Obsolete

| Service | Remplace Par | Date    |
| ------- | ------------ | ------- |
| Abby    | Qonto        | 2025-12 |

**Note:** Les fichiers docs sur Abby sont archives dans `docs/archive/2026-01/`.

---

## Variables d'Environnement

```bash
# Qonto
QONTO_API_KEY=
QONTO_ORGANIZATION_ID=

# Sentry
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Ajouter une Integration

1. Creer client dans `packages/@verone/integrations/src/[nom]/`
2. Ajouter types dans le meme dossier
3. Creer API routes si necessaire
4. Documenter dans ce fichier
5. Ajouter variables d'environnement

---

_Voir [deploy-runbooks.md](./deploy-runbooks.md) pour les variables Vercel_
