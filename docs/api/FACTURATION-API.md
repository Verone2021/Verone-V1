# 📘 API Facturation Abby - Documentation Complète

**Version** : 1.0.0
**Date** : 2025-10-11

---

## 🎯 Vue d'ensemble

Système de facturation intégré avec Abby.fr, comprenant :

- Génération factures depuis commandes
- Webhooks temps réel (invoice.paid, invoice.sent, invoice.cancelled)
- Rapports BFA (Bonus Fin d'Année)
- Queue asynchrone avec retry logic

---

## 🔐 Authentification

### **Routes User** (POST /api/invoices/generate, GET /api/reports/bfa/:year)

```http
Cookie: sb-access-token=<supabase_session_token>
```

### **Webhooks** (POST /api/webhooks/abby)

```http
X-Abby-Signature: <hmac_sha256_signature>
```

### **Cron Jobs** (GET /api/cron/\*)

```http
Authorization: Bearer <CRON_SECRET>
```

---

## 📍 Endpoints

### **1. POST /api/invoices/generate**

Génère une facture depuis une commande (status: shipped/delivered)

#### Request

```http
POST /api/invoices/generate
Content-Type: application/json

{
  "salesOrderId": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Response Success (201)

```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "sales_order_id": "550e8400-e29b-41d4-a716-446655440000",
      "abby_invoice_id": "pending_sync_12345",
      "abby_invoice_number": "PENDING",
      "invoice_date": "2025-10-11",
      "due_date": "2025-11-10",
      "total_ht": 100.0,
      "total_ttc": 120.0,
      "tva_amount": 20.0,
      "status": "draft",
      "created_at": "2025-10-11T10:00:00Z"
    },
    "message": "Invoice created successfully and added to Abby sync queue"
  }
}
```

#### Response Errors

```json
// 400 - Missing salesOrderId
{
  "error": "Missing required field: salesOrderId"
}

// 400 - Invalid order status
{
  "error": "Invalid order status. Order must be shipped or delivered."
}

// 404 - Sales order not found
{
  "error": "Sales order not found"
}

// 409 - Invoice already exists
{
  "error": "Invoice already exists for this order"
}
```

#### Workflow Interne

1. ✅ Validation input (salesOrderId required)
2. ✅ Check authentication
3. ✅ Appel RPC `generate_invoice_from_order()`
   - Valide status commande (shipped/delivered)
   - Calcule totaux depuis sales_order_items
   - Crée invoice (status: draft)
   - Ajoute à abby_sync_queue (pending)
4. ✅ Return invoice créée

**Note** : Facture créée en local, synchronisation Abby via cron job (toutes les 5 minutes)

---

### **2. POST /api/webhooks/abby**

Reçoit événements webhooks d'Abby.fr (invoice.paid, invoice.sent, invoice.cancelled)

#### Request

```http
POST /api/webhooks/abby
Content-Type: application/json
X-Abby-Signature: e5d7f8c9a2b4d1e3f6g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7

{
  "id": "evt_abby_20251011_001",
  "type": "invoice.paid",
  "data": {
    "invoice": {
      "id": "abby_inv_f47ac10b",
      "invoiceNumber": "FAC-2024-001",
      "status": "paid",
      "totalTTC": 120.00
    },
    "payment": {
      "amount": 120.00,
      "paymentDate": "2025-10-11",
      "paymentMethod": "bank_transfer"
    }
  },
  "createdAt": "2025-10-11T10:00:00Z"
}
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "eventId": "evt_abby_20251011_001",
  "eventType": "invoice.paid",
  "data": {
    "invoice_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "invoice_number": "FAC-2024-001",
    "new_status": "paid",
    "total_paid": 120.0,
    "invoice_total": 120.0
  }
}
```

#### Response Idempotency (200)

```json
{
  "message": "Event already processed",
  "eventId": "evt_abby_20251011_001"
}
```

#### Response Errors

```json
// 401 - Invalid signature
{
  "error": "Invalid webhook signature"
}

// 400 - Missing fields
{
  "error": "Missing required webhook fields"
}
```

#### Event Types Supportés

##### **invoice.paid**

```json
{
  "type": "invoice.paid",
  "data": {
    "invoice": {
      "id": "abby_inv_123",
      "invoiceNumber": "FAC-2024-001",
      "status": "paid"
    },
    "payment": {
      "amount": 120.0,
      "paymentDate": "2025-10-11",
      "paymentMethod": "bank_transfer"
    }
  }
}
```

**Action** : Appel RPC `handle_abby_webhook_invoice_paid()`

- Crée payment record
- Met à jour invoice status (paid/partially_paid)

##### **invoice.sent**

```json
{
  "type": "invoice.sent",
  "data": {
    "invoice": {
      "id": "abby_inv_123",
      "invoiceNumber": "FAC-2024-001",
      "status": "sent"
    }
  }
}
```

**Action** : Update invoice status → 'sent'

##### **invoice.cancelled**

```json
{
  "type": "invoice.cancelled",
  "data": {
    "invoice": {
      "id": "abby_inv_123",
      "invoiceNumber": "FAC-2024-001",
      "status": "cancelled"
    }
  }
}
```

**Action** : Update invoice status → 'cancelled'

#### Signature Validation (HMAC-SHA256)

```typescript
// Génération signature (Abby)
const signature = crypto
  .createHmac('sha256', ABBY_WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

// Header
X-Abby-Signature: <signature>
```

#### Idempotency Protection

- Event ID unique stocké dans `abby_webhook_events`
- TTL 7 jours (cleanup automatique)
- Duplicate event → Return 200 (already processed)

---

### **3. GET /api/reports/bfa/:year**

Génère rapport BFA (Bonus Fin d'Année) pour année fiscale

#### Request

```http
GET /api/reports/bfa/2024
Cookie: sb-access-token=<admin_session_token>
```

#### Response Success (200)

```json
{
  "success": true,
  "data": {
    "fiscalYear": 2024,
    "generatedAt": "2025-10-11T10:00:00Z",
    "summary": {
      "totalCustomers": 15,
      "totalRevenue": 750000.0,
      "totalBFA": 42500.0
    },
    "customers": [
      {
        "organisation_id": "org_123",
        "organisation_name": "Customer A",
        "total_revenue_ht": 100000.0,
        "bfa_rate": 7.0,
        "bfa_amount": 7000.0
      },
      {
        "organisation_id": "org_456",
        "organisation_name": "Customer B",
        "total_revenue_ht": 30000.0,
        "bfa_rate": 5.0,
        "bfa_amount": 1500.0
      }
    ]
  }
}
```

#### Response Errors

```json
// 400 - Invalid year
{
  "error": "Invalid year parameter. Must be between 2000 and 2100."
}

// 401 - Not authenticated
{
  "error": "Unauthorized"
}

// 403 - Not admin
{
  "error": "Forbidden. Admin role required."
}
```

#### Taux BFA (Paliers)

| CA Annuel HT      | Taux BFA |
| ----------------- | -------- |
| < 10 000 €        | 0%       |
| 10 000 - 24 999 € | 3%       |
| 25 000 - 49 999 € | 5%       |
| ≥ 50 000 €        | 7%       |

#### Workflow Interne

1. ✅ Validation année (2000-2100)
2. ✅ Check authentication
3. ✅ Check role admin
4. ✅ Appel RPC `generate_bfa_report_all_customers(p_fiscal_year)`
   - Calcule CA annuel facturé (invoices paid)
   - Applique taux BFA selon paliers
   - Filtre clients BFA > 0
5. ✅ Calcul totaux agrégés
6. ✅ Return rapport complet

---

### **4. GET /api/cron/sync-abby-queue**

Cron job: Traite queue sync Abby (batch 50, retry logic)

#### Request

```http
GET /api/cron/sync-abby-queue
Authorization: Bearer <CRON_SECRET>
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Sync queue processed successfully",
  "data": {
    "processed": 15,
    "succeeded": 12,
    "failed": 3,
    "errors": [
      {
        "id": "queue_item_123",
        "error": "Rate limit exceeded"
      },
      {
        "id": "queue_item_456",
        "error": "Customer not found on Abby"
      }
    ],
    "timestamp": "2025-10-11T10:00:00Z"
  }
}
```

#### Response Errors

```json
// 401 - Invalid CRON_SECRET
{
  "error": "Unauthorized"
}

// 500 - Cron execution failed
{
  "error": "Cron job failed",
  "details": "Database connection error"
}
```

#### Workflow Interne

1. ✅ Validation CRON_SECRET
2. ✅ Fetch opérations pending (batch 50)
3. ✅ Pour chaque opération :
   - Marquer `status = 'processing'`
   - Router selon `operation` (create_invoice, sync_customer, ...)
   - Appeler Abby API via AbbyClient
   - Si success → `status = 'success'`
   - Si échec → `status = 'failed'`, `retry_count++`
4. ✅ Trigger exponential backoff automatique
5. ✅ Return statistiques

#### Operations Supportées

- `create_invoice` : Création facture complète sur Abby
- `sync_customer` : Synchronisation client Vérone → Abby
- `update_invoice` : Mise à jour facture (Phase 2)
- `cancel_invoice` : Annulation facture (Phase 2)

#### Retry Logic (Exponential Backoff)

| Tentative         | Délai         |
| ----------------- | ------------- |
| 1                 | Immédiat      |
| 2                 | +1 min        |
| 3                 | +2 min        |
| 4                 | +4 min        |
| Dead Letter Queue | Max 3 retries |

---

### **5. GET /api/cron/cleanup-abby-data**

Cron job: Nettoyage données Abby anciennes (quotidien)

#### Request

```http
GET /api/cron/cleanup-abby-data
Authorization: Bearer <CRON_SECRET>
```

#### Response Success (200)

```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "data": {
    "syncOperations": 45,
    "webhookEvents": 128,
    "statusHistory": 312,
    "timestamp": "2025-10-11T02:00:00Z"
  }
}
```

#### Cleanup Effectué

- **Sync Operations** : >30 jours (success only)
- **Webhook Events** : >7 jours (via expires_at)
- **Invoice Status History** : >1 an

---

## 🔄 Architecture Workflow

```
┌────────────────────────────────────────────────────────────┐
│                   GÉNÉRATION FACTURE                        │
└────────────────────────────────────────────────────────────┘

1. POST /api/invoices/generate { salesOrderId }
   ↓
2. RPC: generate_invoice_from_order()
   ├─ Validate order status (shipped/delivered)
   ├─ Calculate totals from sales_order_items
   ├─ INSERT invoices (status: draft)
   └─ INSERT abby_sync_queue (operation: create_invoice, status: pending)
   ↓
3. Cron Job (*/5 min): GET /api/cron/sync-abby-queue
   ├─ Fetch pending operations (batch 50)
   ├─ AbbyClient.createCompleteInvoice()
   │  ├─ POST /v2/billing/invoice/{customerId}
   │  ├─ POST /v2/billing/{billingId}/lines (x N lignes)
   │  └─ PUT /v2/billing/{billingId} (finalize → status: sent)
   ├─ UPDATE invoices (abby_invoice_id, abby_invoice_number, status: sent)
   └─ UPDATE abby_sync_queue (status: success)

┌────────────────────────────────────────────────────────────┐
│                   WEBHOOK PAYMENT                           │
└────────────────────────────────────────────────────────────┘

1. Abby → POST /api/webhooks/abby { type: invoice.paid, ... }
   ├─ Validate signature (HMAC-SHA256)
   └─ Check idempotency (event_id)
   ↓
2. INSERT abby_webhook_events (idempotency record, TTL 7 days)
   ↓
3. RPC: handle_abby_webhook_invoice_paid()
   ├─ INSERT payments (amount, payment_date, synced_from_abby_at)
   └─ Trigger: update_invoice_status_on_payment()
      └─ UPDATE invoices (status: paid/partially_paid)
```

---

## 🛡️ Sécurité

### **Authentification Routes User**

- Supabase Auth session cookie
- Check `auth.getUser()` (401 si non authentifié)
- Role admin pour BFA reports (403 si non-admin)

### **Signature Webhooks**

- HMAC-SHA256 avec ABBY_WEBHOOK_SECRET
- Header `X-Abby-Signature`
- Timing-safe comparison (crypto.timingSafeEqual)

### **CRON_SECRET**

- Bearer token sécurisé (32 bytes random)
- Validation sur toutes routes cron
- 401 si invalide ou manquant

### **RLS Policies**

- Admin uniquement (Phase 1)
- Isolation multi-tenant (Phase 2 avec organisation_members)

---

## 📊 Monitoring & Logs

### **Logs Importants**

```typescript
// Succès génération facture
console.log(
  'Invoice created (ID: uuid) for order order_number - Sync queue pending'
);

// Webhook traité
console.log(
  'Webhook invoice.paid traité: Invoice FAC-2024-001 - Montant 120.00€ - Nouveau statut: paid'
);

// Retry sync queue
console.warn('Abby API: Retry 2/3 after 2000ms. Error: Rate limit exceeded');

// Dead Letter Queue
console.error(
  '❌ Sync queue item uuid (create_invoice) failed (retry 3/3): Customer not found'
);
```

### **Sentry Integration**

- Errors sync queue (Dead Letter Queue)
- Webhook validation failures
- Cron job failures
- Performance metrics API routes

---

## 🧪 Tests E2E

Voir `tests/e2e/api-facturation.spec.ts`

```bash
# Run tests
npx playwright test tests/e2e/api-facturation.spec.ts

# Tests Coverage
- POST /api/invoices/generate (4 tests)
- POST /api/webhooks/abby (4 tests, idempotency)
- GET /api/reports/bfa/:year (3 tests)
- GET /api/cron/sync-abby-queue (3 tests)
- GET /api/cron/cleanup-abby-data (2 tests)

Total: 16 tests E2E
```

---

## 📝 Configuration Vercel

`vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-abby-queue",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-abby-data",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Fréquences** :

- Sync queue : Toutes les 5 minutes
- Cleanup : Quotidien à 2h du matin

---

## 🚀 Configuration Webhooks Abby

### **1. Enregistrer Endpoint dans Abby.fr**

```
URL: https://verone.com/api/webhooks/abby
Events: invoice.paid, invoice.sent, invoice.cancelled
```

### **2. Récupérer ABBY_WEBHOOK_SECRET**

Copier secret depuis dashboard Abby → Ajouter dans `.env.local`

### **3. Tester Signature**

```bash
# Générer test signature
curl -X POST https://localhost:3000/api/webhooks/abby \
  -H "Content-Type: application/json" \
  -H "X-Abby-Signature: <generate_with_test_helper>" \
  -d '{"id":"evt_test","type":"invoice.sent","data":{"invoice":{"id":"test"}}}'
```

---

## 📚 Références

- **Abby API Docs** : https://docs.abby.fr/
- **Repository** : github.com/your-org/verone-back-office
- **Supabase RPC Functions** : `supabase/migrations/20251011_006_*.sql`
- **Client Abby** : `src/lib/abby/client.ts`
- **Tests E2E** : `tests/e2e/api-facturation.spec.ts`

---

**Version** : 1.0.0
**Dernière mise à jour** : 2025-10-11
**Contact** : dev@verone.com
