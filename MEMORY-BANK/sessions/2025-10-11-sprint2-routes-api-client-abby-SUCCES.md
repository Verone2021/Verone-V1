# ✅ Sprint 2 - Routes API + Client Abby - SUCCÈS COMPLET

**Date** : 2025-10-11
**Durée** : ~30 minutes
**Statut** : ✅ **TERMINÉ AVEC SUCCÈS**

---

## 🎯 Objectif Sprint 2

Implémenter routes API et client Abby pour intégration facturation :
- Client Abby type-safe avec retry logic
- Route génération factures (POST /api/invoices/generate)
- Route webhook handler (POST /api/webhooks/abby)
- Route rapport BFA (GET /api/reports/bfa/:year)
- Cron job sync queue processor

---

## 📦 Fichiers Créés (10/10)

### **1. Client Abby Core (3 fichiers)** ✅

#### **src/lib/abby/types.ts**
Types TypeScript complets pour API Abby :
```typescript
// Customers
export interface AbbyCustomer {
  id: string;
  name: string;
  email?: string;
  // ...
}

// Invoices
export interface AbbyInvoice {
  id: string;
  customerId: string;
  invoiceNumber: string;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  totalHT: number;
  totalTTC: number;
  lines?: AbbyInvoiceLine[];
}

// Invoice Lines
export interface AbbyInvoiceLine {
  description: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
}

// Webhooks
export interface AbbyWebhookEvent {
  id: string;
  type: 'invoice.paid' | 'invoice.sent' | 'invoice.cancelled';
  data: { invoice?: AbbyInvoice; payment?: AbbyPayment };
}
```

---

#### **src/lib/abby/errors.ts**
Custom errors hiérarchie :
```typescript
// Base error
export class AbbyError extends Error

// Errors spécifiques
export class AbbyAuthenticationError extends AbbyError      // 401
export class AbbyRateLimitError extends AbbyError          // 429
export class AbbyValidationError extends AbbyError         // 400
export class AbbyNotFoundError extends AbbyError           // 404
export class AbbyNetworkError extends AbbyError            // Network issues
export class AbbyTimeoutError extends AbbyError            // Timeout
export class AbbyRetryExhaustedError extends AbbyError     // Max retries

// Helpers
export function createAbbyErrorFromResponse(statusCode, data): AbbyError
export function shouldRetryError(error): boolean
```

**Features** :
- ✅ Mapping intelligent status codes → Errors
- ✅ Helper `shouldRetryError()` pour retry logic
- ✅ Stack trace correct (prototype chain)

---

#### **src/lib/abby/client.ts**
Client HTTP type-safe avec retry logic :
```typescript
export class AbbyClient {
  constructor(config: AbbyClientConfig)

  // Customers
  async getCustomers(): Promise<AbbyCustomer[]>
  async createCustomer(payload): Promise<AbbyCustomer>
  async getCustomer(customerId): Promise<AbbyCustomer>

  // Invoices
  async createInvoice(payload): Promise<AbbyInvoice>
  async addInvoiceLine(billingId, line): Promise<void>
  async finalizeInvoice(billingId): Promise<AbbyInvoice>
  async getInvoice(billingId): Promise<AbbyInvoice>
  async createCompleteInvoice(payload): Promise<AbbyInvoice>

  // Internal
  private async request<T>(method, endpoint, body): Promise<T>
  private calculateRetryDelay(retryCount): number
}

export function getAbbyClient(): AbbyClient // Singleton
```

**Features Retry Logic** :
- ✅ Exponential backoff : 1s → 2s → 4s → 8s
- ✅ Max 3 retries (configurable)
- ✅ Retry sur : Network errors, Timeouts, Rate limits, 5xx errors
- ✅ Abort controller pour timeout (10s par défaut)
- ✅ Singleton pattern (env variables)

**Workflow `createCompleteInvoice()`** :
```typescript
async createCompleteInvoice(payload) {
  // 1. Create draft invoice
  const invoice = await this.createInvoice(payload);

  // 2. Add lines
  for (const line of payload.lines) {
    await this.addInvoiceLine(invoice.id, line);
  }

  // 3. Finalize (status: sent)
  return await this.finalizeInvoice(invoice.id);
}
```

---

### **2. Routes API (4 fichiers)** ✅

#### **src/app/api/invoices/generate/route.ts**
**Endpoint** : `POST /api/invoices/generate`

**Request** :
```json
{
  "salesOrderId": "uuid"
}
```

**Response Success (201)** :
```json
{
  "success": true,
  "data": {
    "invoice": { /* invoice object */ },
    "message": "Invoice created and added to Abby sync queue"
  }
}
```

**Workflow** :
1. ✅ Validation input (salesOrderId required)
2. ✅ Check authentication (supabase.auth.getUser())
3. ✅ Appel RPC `generate_invoice_from_order(p_sales_order_id)`
4. ✅ Error handling user-friendly :
   - 404: Sales order not found
   - 400: Invalid status / No items
   - 409: Invoice already exists
5. ✅ Return invoice créée

**Error Mapping** :
```typescript
if (rpcError.message.includes('introuvable')) → 404
if (rpcError.message.includes('Statut commande invalide')) → 400
if (rpcError.message.includes('Facture déjà créée')) → 409
if (rpcError.message.includes('sans items')) → 400
```

---

#### **src/app/api/webhooks/abby/route.ts**
**Endpoint** : `POST /api/webhooks/abby`

**Request** :
```json
{
  "id": "event_123",
  "type": "invoice.paid",
  "data": {
    "invoice": { "id": "inv_123", ... },
    "payment": { "amount": 100.50, "paymentDate": "2025-10-11", ... }
  },
  "createdAt": "2025-10-11T10:00:00Z"
}
```

**Response Success (200)** :
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "eventId": "event_123",
  "eventType": "invoice.paid"
}
```

**Workflow Idempotency** :
1. ✅ Check event déjà traité (`abby_webhook_events.event_id`)
2. ✅ Si déjà traité → Return 200 (idempotent)
3. ✅ Sinon → Insert event record
4. ✅ Router événement selon `type`
5. ✅ Traiter événement
6. ✅ Return success

**Event Handlers** :
```typescript
switch (eventType) {
  case 'invoice.paid':
    await handleInvoicePaid(supabase, data);
    // → Appel RPC handle_abby_webhook_invoice_paid()
    break;

  case 'invoice.sent':
    await handleInvoiceSent(supabase, data);
    // → Update status local 'sent'
    break;

  case 'invoice.cancelled':
    await handleInvoiceCancelled(supabase, data);
    // → Update status local 'cancelled'
    break;

  default:
    // Log + Skip
}
```

---

#### **src/app/api/reports/bfa/[year]/route.ts**
**Endpoint** : `GET /api/reports/bfa/[year]`

**Response Success (200)** :
```json
{
  "success": true,
  "data": {
    "fiscalYear": 2024,
    "generatedAt": "2025-10-11T10:00:00Z",
    "summary": {
      "totalCustomers": 15,
      "totalRevenue": 750000.00,
      "totalBFA": 42500.00
    },
    "customers": [
      {
        "organisation_id": "uuid",
        "organisation_name": "Customer A",
        "total_revenue_ht": 100000.00,
        "bfa_rate": 7.00,
        "bfa_amount": 7000.00
      },
      // ...
    ]
  }
}
```

**Workflow** :
1. ✅ Validation année (2000-2100)
2. ✅ Check authentication
3. ✅ Check role admin (BFA = données sensibles)
4. ✅ Appel RPC `generate_bfa_report_all_customers(p_fiscal_year)`
5. ✅ Calcul totaux agrégés
6. ✅ Return rapport complet

**Security** :
- ✅ Admin only (forbidden 403 si non-admin)
- ✅ Données sensibles CA clients

---

#### **src/app/api/cron/sync-abby-queue/route.ts**
**Endpoint** : `GET /api/cron/sync-abby-queue`

**Headers Required** :
```
Authorization: Bearer {CRON_SECRET}
```

**Response Success (200)** :
```json
{
  "success": true,
  "message": "Sync queue processed successfully",
  "data": {
    "processed": 15,
    "succeeded": 12,
    "failed": 3,
    "errors": [
      { "id": "uuid", "error": "Rate limit exceeded" }
    ],
    "timestamp": "2025-10-11T10:00:00Z"
  }
}
```

**Workflow** :
1. ✅ Validation CRON_SECRET (Authorization header)
2. ✅ Appel `processSyncQueue()`
3. ✅ Return résultats détaillés

**Security** :
- ✅ CRON_SECRET protection (401 si invalide)
- ✅ Logs détaillés pour monitoring

---

#### **src/app/api/cron/cleanup-abby-data/route.ts**
**Endpoint** : `GET /api/cron/cleanup-abby-data`

**Response Success (200)** :
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "data": {
    "syncOperations": 45,
    "webhookEvents": 128,
    "statusHistory": 312,
    "timestamp": "2025-10-11T10:00:00Z"
  }
}
```

**Workflow** :
1. ✅ Validation CRON_SECRET
2. ✅ Cleanup sync operations (>30 jours)
3. ✅ Cleanup webhook events (>7 jours via `expires_at`)
4. ✅ Cleanup invoice status history (>1 an)
5. ✅ Return statistiques nettoyage

**RPC Functions Called** :
- `cleanup_old_sync_operations()` (migration 003)
- `cleanup_expired_webhook_events()` (migration 004)
- `cleanup_old_status_history()` (migration 008)

---

### **3. Sync Queue Processor (1 fichier)** ✅

#### **src/lib/abby/sync-processor.ts**
Core logic traitement queue asynchrone :

```typescript
export async function processSyncQueue(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}>
```

**Workflow** :
1. ✅ Fetch opérations pending (batch 50 max)
2. ✅ Filter: `status = 'pending'` AND `(next_retry_at IS NULL OR next_retry_at <= NOW())`
3. ✅ Pour chaque opération :
   - Marquer `status = 'processing'`
   - Router selon `operation`
   - Si success → Update `status = 'success'`, `processed_at = NOW()`
   - Si échec → Update `status = 'failed'`, `retry_count++`, `last_error`
4. ✅ Trigger `calculate_next_retry()` automatique (migration 003)

**Operation Handlers** :

```typescript
switch (operation) {
  case 'create_invoice':
    await processCreateInvoice(abbyClient, supabase, item);
    // 1. Create complete invoice on Abby
    // 2. Update local invoice (abby_invoice_id, abby_invoice_number, status: 'sent')
    break;

  case 'sync_customer':
    await processSyncCustomer(abbyClient, supabase, item);
    // 1. Create customer on Abby
    // 2. Update local organisation (abby_customer_id)
    break;

  case 'update_invoice':
  case 'cancel_invoice':
    throw new Error('Phase 2 not implemented yet');
}
```

**Features** :
- ✅ Batch processing (50 items max)
- ✅ Error handling granulaire (par opération)
- ✅ Exponential backoff automatique (trigger DB)
- ✅ Dead Letter Queue après 3 retries
- ✅ Logging détaillé pour monitoring

---

### **4. Configuration (2 fichiers)** ✅

#### **src/lib/abby/index.ts**
Exports centralisés :
```typescript
// Client
export { AbbyClient, getAbbyClient } from './client';

// Types
export type { AbbyCustomer, AbbyInvoice, AbbyWebhookEvent, ... } from './types';

// Errors
export {
  AbbyError,
  AbbyAuthenticationError,
  AbbyRateLimitError,
  // ...
} from './errors';
```

---

#### **.env.local**
Ajout variable cron :
```bash
# Cron job secret (auto-généré)
CRON_SECRET=q3nN/UUgpeTu+8kPd0UM4LI9QUGR+oO6C9Afy+ZWEM0=
```

---

## 📊 Statistiques Sprint 2

- **Fichiers créés** : 10
  - Client Abby : 4 fichiers (client, types, errors, index)
  - Routes API : 4 fichiers (generate, webhook, bfa, cron)
  - Sync Processor : 1 fichier
  - Configuration : 1 fichier (.env.local update)

- **Lignes de code** : ~1,200 lignes
  - Client Abby : ~400 lignes
  - Routes API : ~600 lignes
  - Sync Processor : ~200 lignes

- **Features implémentées** :
  - ✅ Client HTTP type-safe avec retry logic
  - ✅ 4 routes API (generate, webhook, bfa, cron)
  - ✅ Sync queue processor (batch 50, exponential backoff)
  - ✅ Idempotency webhooks (event_id unique)
  - ✅ Error handling hiérarchie
  - ✅ Security (auth, admin, cron secret)

**Durée totale** : ~30 minutes
**Statut** : ✅ **SPRINT 2 TERMINÉ AVEC SUCCÈS**

---

## 🎯 Architecture Complète Sprint 1 + 2

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT VÉRONE (NEXT.JS)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📄 Routes API                                              │
│  ├─ POST /api/invoices/generate                            │
│  │  └─ RPC: generate_invoice_from_order()                  │
│  │     └─ INSERT abby_sync_queue (pending)                 │
│  │                                                          │
│  ├─ POST /api/webhooks/abby                                │
│  │  ├─ Check idempotency (abby_webhook_events)            │
│  │  └─ RPC: handle_abby_webhook_invoice_paid()            │
│  │     └─ UPDATE invoices (status: paid)                  │
│  │                                                          │
│  ├─ GET /api/reports/bfa/:year                            │
│  │  └─ RPC: generate_bfa_report_all_customers()           │
│  │                                                          │
│  └─ GET /api/cron/sync-abby-queue ⏰                        │
│     └─ processSyncQueue()                                  │
│        └─ Fetch pending operations → Abby API             │
│                                                             │
│  🔧 Client Abby                                             │
│  ├─ AbbyClient (retry logic, exponential backoff)          │
│  ├─ createCompleteInvoice() → Abby API                     │
│  ├─ createCustomer() → Abby API                            │
│  └─ Error hierarchy (AbbyError, AbbyNetworkError, ...)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                       ABBY API                               │
│                   (api.app-abby.com)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📥 Webhook Events (Abby → Vérone)                          │
│  ├─ invoice.paid → POST /webhooks/abby                     │
│  ├─ invoice.sent → POST /webhooks/abby                     │
│  └─ invoice.cancelled → POST /webhooks/abby                │
│                                                             │
│  📤 API Calls (Vérone → Abby)                               │
│  ├─ POST /v2/billing/invoice/{customerId}                  │
│  ├─ POST /v2/billing/{billingId}/lines                     │
│  ├─ PUT /v2/billing/{billingId} (finalize)                 │
│  └─ POST /customers (create customer)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRESQL                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 Tables                                                  │
│  ├─ invoices (factures locales)                            │
│  ├─ payments (paiements)                                    │
│  ├─ abby_sync_queue (queue async + retry logic)            │
│  ├─ abby_webhook_events (idempotency)                       │
│  └─ invoice_status_history (audit trail)                    │
│                                                             │
│  ⚙️ RPC Functions                                           │
│  ├─ generate_invoice_from_order()                          │
│  ├─ handle_abby_webhook_invoice_paid()                     │
│  ├─ calculate_annual_revenue_bfa()                          │
│  ├─ generate_bfa_report_all_customers()                     │
│  ├─ cleanup_old_sync_operations()                           │
│  ├─ cleanup_expired_webhook_events()                        │
│  └─ cleanup_old_status_history()                            │
│                                                             │
│  🔒 RLS Policies (13 policies admin-only Phase 1)           │
│  🚀 Indexes (~40 composite, partiel, GIN)                   │
│  🔔 Triggers (5 automatic: retry, overdue, audit, payment) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines Étapes (Sprint 3)

**Sprint 3 : Configuration Webhooks + Tests E2E**

1. **Configurer webhooks Abby** :
   - Enregistrer endpoint `https://verone.com/api/webhooks/abby` dans Abby.fr
   - Obtenir `ABBY_WEBHOOK_SECRET`
   - Implémenter signature validation (HMAC)

2. **Tests E2E API Routes** :
   - Test génération facture (commande shipped → invoice draft → sync queue)
   - Test webhook invoice.paid (idempotency, payment record, status update)
   - Test rapport BFA (calcul paliers 0%, 3%, 5%, 7%)
   - Test cron sync queue (retry logic, exponential backoff)

3. **Monitoring Sentry** :
   - Logs erreurs sync queue
   - Alerts Dead Letter Queue (retry exhausted)
   - Performance metrics API routes

4. **Documentation API** :
   - OpenAPI spec pour routes
   - Exemples payloads webhook
   - Guide configuration cron jobs Vercel

---

## 📝 Notes Techniques

### **Retry Logic Design**

**Exponential Backoff** :
```
Attempt 1: Immediate (0ms)
Attempt 2: +1s delay
Attempt 3: +2s delay
Attempt 4: +4s delay
Dead Letter Queue: Failed after 3 retries
```

**Retryable Errors** :
- Network errors (fetch failed)
- Timeout errors (>10s)
- Rate limit errors (429)
- Server errors (5xx)

**Non-retryable Errors** :
- Authentication errors (401)
- Validation errors (400)
- Not found errors (404)
- Conflict errors (409)

---

### **Idempotency Pattern**

**Webhook Deduplication** :
1. Receive webhook event (event_id unique)
2. Check `abby_webhook_events.event_id` EXISTS
3. If exists → Return 200 (already processed)
4. If not exists → Insert event record + Process
5. TTL 7 jours (cleanup automatique)

**Benefits** :
- ✅ Protection double traitement
- ✅ Safe retry webhooks Abby
- ✅ Automatic cleanup (storage efficient)

---

### **Cron Jobs Vercel**

**Configuration vercel.json** (à créer Phase 3) :
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
- Sync queue : **5 minutes** (*/5 * * * *)
- Cleanup : **Quotidien 2h** (0 2 * * *)

---

## 🎯 Conclusion

**Sprint 2 : Routes API + Client Abby** ✅ **SUCCÈS COMPLET**

- ✅ 10 fichiers créés
- ✅ Client Abby type-safe avec retry logic
- ✅ 4 routes API (generate, webhook, bfa, cron)
- ✅ Sync queue processor automatique
- ✅ Idempotency webhooks
- ✅ Error handling professionnel
- ✅ Security (auth, admin, cron secret)

**Foundation complète pour facturation Abby.fr prête !** 🚀

**Prochaine étape** : Sprint 3 (Webhooks + Tests E2E) ou Sprint 4 (Composants UI) ?
