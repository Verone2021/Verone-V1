# Integration Qonto (Facturation)

**Derniere mise a jour:** 2026-01-19

Service de facturation, devis, avoirs et PDF.

---

## Status

| Element    | Valeur                                |
| ---------- | ------------------------------------- |
| Status     | **ACTIF**                             |
| Usage      | Factures, Avoirs, Devis, PDF          |
| Package    | `@verone/integrations/src/qonto/`     |
| API Routes | `apps/back-office/src/app/api/qonto/` |

---

## Endpoints API

- `/api/qonto/invoices` - CRUD factures
- `/api/qonto/invoices/[id]/pdf` - Telecharger PDF
- `/api/qonto/credit-notes` - Avoirs
- `/api/qonto/quotes` - Devis
- `/api/qonto/quotes/service` - Devis services
- `/api/qonto/balance` - Solde compte
- `/api/qonto/transactions` - Transactions
- `/api/qonto/status` - Health check

---

## Configuration Locale

```typescript
// packages/@verone/integrations/src/qonto/client.ts
const qontoClient = new QontoClient({
  apiKey: process.env.QONTO_API_KEY,
  organizationId: process.env.QONTO_ORGANIZATION_ID,
});
```

### Variables .env.local

```bash
QONTO_AUTH_MODE=api_key
QONTO_ORGANIZATION_ID=verone-4819
QONTO_API_KEY=<cle-api>
```

---

## Configuration Production (Vercel)

### URL Dashboard
```
https://vercel.com/verone2021s-projects/verone-back-office/settings/environment-variables
```

### Variables Requises

| Variable | Valeur | Description |
|----------|--------|-------------|
| `QONTO_AUTH_MODE` | `api_key` | Mode d'authentification |
| `QONTO_ORGANIZATION_ID` | `verone-4819` | ID organisation |
| `QONTO_API_KEY` | `<secret>` | Cle API Qonto |

**Environnements:** Production + Preview + Development

### Etapes Configuration

1. Vercel Dashboard → Settings → Environment Variables
2. Add New pour chaque variable
3. Cocher tous les environnements (Production, Preview, Development)
4. Save
5. Redeploy (commit vide ou manuel)

---

## Verification

### Test API Balance

```bash
curl https://verone-back-office.vercel.app/api/qonto/balance | jq
```

**Resultat attendu:**
```json
{
  "success": true,
  "accounts": [...],
  "totalBalance": 123.45,
  "currency": "EUR"
}
```

### Routes Impactees

- `/api/qonto/balance`
- `/api/qonto/transactions`
- `/api/qonto/invoices/**`
- `/api/qonto/quotes/**`
- `/api/qonto/credit-notes/**`
- `/api/qonto/status`

---

## Securite

- ⚠️ Ne jamais commiter `.env.local`
- ⚠️ Rotation cle API tous les 6 mois
- ⚠️ Utiliser Vercel Secrets en production

---

## Reference

- Qonto API: https://api-doc.qonto.com/
- Code: `packages/@verone/integrations/src/qonto/`
- Routes: `apps/back-office/src/app/api/qonto/`
