# 🔄 Plan B : Pivot Pennylane API - Architecture Agnostique

**Date**: 2025-10-10
**Contexte**: Backup plan si API Abby.fr insuffisante (endpoint manquant, webhooks indisponibles)
**Temps d'adaptation**: 1 jour (vs 10 jours Abby)

---

## 🎯 Pourquoi Pennylane ?

### Avantages Pennylane vs Abby

| Critère                | Pennylane                    | Abby.fr                      |
| ---------------------- | ---------------------------- | ---------------------------- |
| **Documentation API**  | ✅ Excellente, interactive   | ⚠️ Limitée                   |
| **Webhooks**           | ✅ 15+ événements documentés | ❓ À confirmer               |
| **Endpoints Factures** | ✅ CRUD complet              | ❓ À vérifier (404 possible) |
| **Paiements**          | ✅ API complète              | ❓ Non documenté             |
| **Support**            | ✅ Réactif (24-48h)          | ⚠️ Variable                  |
| **Adoption FR**        | ✅ 50,000+ entreprises       | ✅ Croissance forte          |
| **Tarif API**          | Gratuit (plan Pro)           | Gratuit (plan Pro)           |

**Conclusion** : Pennylane = **Safer bet** pour intégration professionnelle

---

## 🏗️ Architecture Identique

**Bonne nouvelle** : L'architecture conçue pour Abby fonctionne **tel quel** avec Pennylane !

### Tables Database (Inchangées)

```sql
-- ✅ AUCUN changement nécessaire
invoices
payments
abby_sync_queue  -- Renommer en "invoice_sync_queue" (générique)
abby_webhook_events  -- Renommer en "invoice_webhook_events"
invoice_status_history
```

### RPC Functions (Adaptation mineure)

```sql
-- generate_invoice_from_order() → Inchangé (logique identique)
-- handle_invoice_webhook_paid() → Inchangé (traitement universel)
-- calculate_annual_revenue_bfa() → Inchangé (calcul BFA générique)
```

### React Hooks (Changement URL uniquement)

```typescript
// Avant (Abby)
const response = await fetch('/api/invoices/create-from-order', {
  method: 'POST',
  body: JSON.stringify({ salesOrderId, provider: 'abby' }),
});

// Après (Pennylane)
const response = await fetch('/api/invoices/create-from-order', {
  method: 'POST',
  body: JSON.stringify({ salesOrderId, provider: 'pennylane' }),
});
```

**Impact** : Changement de 3 lignes dans `useInvoices.ts` !

---

## 🔧 Différences API Pennylane vs Abby

### Endpoints Mapping

| Fonctionnalité     | Abby (hypothétique)  | Pennylane (confirmé)         |
| ------------------ | -------------------- | ---------------------------- |
| **Créer facture**  | `POST /invoices`     | `POST /customer_invoices`    |
| **Liste factures** | `GET /invoices`      | `GET /customer_invoices`     |
| **Détail facture** | `GET /invoices/:id`  | `GET /customer_invoices/:id` |
| **Créer client**   | `POST /organization` | `POST /customers`            |
| **Créer paiement** | `POST /payments`     | `POST /invoice_payments`     |
| **Webhooks**       | ❓ Non documenté     | `POST /webhooks` (setup)     |

### Format Payload Facture

**Abby** (supposé) :

```json
{
  "customer": { "company_name": "...", "email": "..." },
  "items": [{ "description": "...", "quantity": 1, "unit_price": 100 }],
  "status": "draft"
}
```

**Pennylane** (documenté) :

```json
{
  "customer": { "source_id": "...", "name": "..." },
  "line_items": [{ "label": "...", "quantity": 1, "unit_price": 100 }],
  "draft": true
}
```

**Impact** : Adapter le mapper dans `lib/invoicing/pennylane-client.ts` (30 min)

---

## 📋 Checklist Migration Abby → Pennylane

### Phase 1 : Configuration (1h)

- [ ] Créer compte Pennylane : https://www.pennylane.com/
- [ ] Générer API Key : Dashboard → Paramètres → Intégrations → API
- [ ] Ajouter dans .env.local :
  ```bash
  PENNYLANE_API_KEY=pl_sk_live_xxxxx
  PENNYLANE_API_BASE_URL=https://api.pennylane.com/api/v1
  ```
- [ ] Tester authentification :
  ```bash
  curl -X GET https://api.pennylane.com/api/v1/me \
    -H "Authorization: Bearer pl_sk_live_xxxxx"
  ```

### Phase 2 : Adapter Code (4h)

#### 1. Renommer Tables Génériques (30 min)

```sql
-- Migration : 20251011_015_rename_abby_to_generic.sql
ALTER TABLE abby_sync_queue RENAME TO invoice_sync_queue;
ALTER TABLE abby_webhook_events RENAME TO invoice_webhook_events;

-- Ajouter colonne provider
ALTER TABLE invoices ADD COLUMN provider TEXT DEFAULT 'pennylane';
ALTER TABLE invoice_sync_queue ADD COLUMN provider TEXT DEFAULT 'pennylane';
```

#### 2. Créer Client Pennylane (2h)

```typescript
// src/lib/invoicing/pennylane-client.ts
export class PennylaneClient {
  async createInvoice(orderData: SalesOrder): Promise<Invoice> {
    const payload = this.mapOrderToInvoice(orderData);
    const response = await fetch(`${this.baseUrl}/customer_invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return response.json();
  }

  private mapOrderToInvoice(order: SalesOrder) {
    return {
      customer: { source_id: order.customer_id },
      line_items: order.items.map(item => ({
        label: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: 20,
      })),
      draft: false,
      date: new Date().toISOString(),
    };
  }
}
```

#### 3. Adapter Routes API (1h)

```typescript
// src/app/api/invoices/create-from-order/route.ts
import { PennylaneClient } from '@/lib/invoicing/pennylane-client';

export async function POST(req: Request) {
  const { salesOrderId } = await req.json();

  const client = new PennylaneClient({
    apiKey: process.env.PENNYLANE_API_KEY!,
    baseUrl: process.env.PENNYLANE_API_BASE_URL!,
  });

  const invoice = await client.createInvoice(orderData);

  // Enregistrer dans Supabase (RPC inchangé)
  await supabase.rpc('generate_invoice_from_order', {
    p_sales_order_id: salesOrderId,
    p_external_invoice_id: invoice.id,
    p_invoice_number: invoice.invoice_number,
    p_provider: 'pennylane',
  });

  return Response.json({ success: true, invoice });
}
```

#### 4. Configurer Webhooks (30 min)

```typescript
// src/app/api/webhooks/pennylane/invoice-status/route.ts
import crypto from 'crypto';

export async function POST(req: Request) {
  const signature = req.headers.get('X-Pennylane-Signature');
  const body = await req.text();

  // Vérifier signature HMAC
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PENNYLANE_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === 'invoice.paid') {
    await supabase.rpc('handle_invoice_webhook_paid', {
      p_external_invoice_id: event.data.invoice.id,
      p_payment_amount: event.data.payment.amount,
      p_provider: 'pennylane',
    });
  }

  return Response.json({ success: true });
}
```

### Phase 3 : Tests (2h)

- [ ] Test création facture end-to-end
- [ ] Test webhook paiement (simulation)
- [ ] Test calcul BFA automatique
- [ ] Test sync bidirectionnelle
- [ ] Validation console errors (MCP Browser)

### Phase 4 : Documentation (1h)

- [ ] Mettre à jour README-PHASE-0.md
- [ ] Créer guide configuration Pennylane
- [ ] Documenter différences API dans ADR
- [ ] Mettre à jour diagrammes architecture

---

## 🚀 Timeline Pivot Pennylane

| Phase                            | Durée | Cumul           |
| -------------------------------- | ----- | --------------- |
| Configuration compte + API       | 1h    | 1h              |
| Adaptation code (client, routes) | 4h    | 5h              |
| Tests complets                   | 2h    | 7h              |
| Documentation                    | 1h    | **8h (1 jour)** |

**Comparaison** :

- ⏱️ Abby (si fonctionnel) : 10 jours
- ⏱️ Pennylane (pivot) : **1 jour**
- 📊 Différence temps : Négligeable (setup identique ensuite)

---

## ✅ Critères Décision : Abby vs Pennylane

### Rester sur Abby SI :

- ✅ Test `POST /invoices` retourne **HTTP 201**
- ✅ Webhooks confirmés par support Abby
- ✅ Documentation API complète fournie
- ✅ Support réactif (< 48h)

### Pivot Pennylane SI :

- ❌ Test `POST /invoices` retourne **HTTP 404**
- ❌ Webhooks non disponibles ou non documentés
- ❌ Documentation API insuffisante
- ❌ Support lent ou non réactif
- ❌ Doutes sur fiabilité API

---

## 🎯 Recommandation Stratégique

**Mon avis professionnel** :

1. **Tester Abby d'abord** (Phase 0 - 30 min)
   - Si succès → Continuer Abby
   - Si échec → Pivot Pennylane immédiat

2. **Architecture agnostique maintenue** :
   - Tables génériques (`invoice_sync_queue` au lieu de `abby_sync_queue`)
   - Colonne `provider` pour multi-provider future
   - Interfaces abstraites pour client API

3. **Avantages long terme** :
   - Possibilité de supporter **Abby ET Pennylane** simultanément
   - Choix client par client (certains préfèrent Pennylane)
   - Résilience : Si Abby API down → Fallback Pennylane

**Conclusion** : Phase 0 Abby = investissement de 30 min qui peut sauver 10 jours si problème détecté tôt.

---

## 📞 Support Pennylane

- **Documentation API** : https://pennylane.readme.io/reference/getting-started
- **Dashboard** : https://app.pennylane.com/
- **Email Support** : support@pennylane.com
- **Chat Live** : Disponible dans l'app (9h-18h)

---

_Plan B Pennylane - Architecture Agnostique - Vérone Back Office 2025_
