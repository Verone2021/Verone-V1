---
status: CURRENT
verified: 2025-12-17
code_pointers:
  - packages/@verone/integrations/
  - apps/back-office/src/app/api/integrations/
references:
  - docs/guides/03-integrations/
---

# Integrations Verone

APIs et services externes.

## Integrations actives

| Service | Usage | Status |
|---------|-------|--------|
| **Supabase** | Database, Auth, Storage | Actif |
| **Vercel** | Hosting, Deploy | Actif |
| **Abby** | Facturation | Actif |
| **Google OAuth** | Authentification | Actif |

## Integrations planifiees

| Service | Usage | Status |
|---------|-------|--------|
| **Google Merchant** | E-commerce feed | Planifie |
| **Qonto** | Rapprochement bancaire | Planifie |
| **Packlink** | Expeditions | Planifie |
| **Stripe** | Paiements | Planifie |

## Configuration Abby

```typescript
// apps/back-office/src/lib/abby.ts
const abby = new AbbyClient({
  apiKey: process.env.ABBY_API_KEY,
  environment: 'production'
});
```

### Endpoints Abby
- `/api/integrations/abby/invoices` - Sync factures
- `/api/webhooks/abby` - Webhooks

## Google Merchant (planifie)

Guide: [GOOGLE-MERCHANT-CONFIGURATION-COMPLETE.md](../guides/03-integrations/google-merchant/)

## Liens

- [API](./05-api.md) - Endpoints
- [Database](./03-database.md) - Tables integration

---

*Derniere verification: 2025-12-17*
