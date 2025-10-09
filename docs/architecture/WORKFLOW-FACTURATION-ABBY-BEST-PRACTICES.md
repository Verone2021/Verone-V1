# 🏗️ WORKFLOW FACTURATION ABBY - ARCHITECTURE & BEST PRACTICES

**Date** : 2025-10-11
**Contexte** : Intégration Vérone ↔ Abby.fr
**Objectif** : Système de facturation professionnel pour back-office interne

---

## 🎯 QUESTIONS CLÉS

### **Question 1 : Lien Client → Facture**
> Les factures doivent être liées directement au client pro (table `organisations`) et aux clients particuliers (table `individual_customers`).

### **Question 2 : Workflow Abby**
> Doit-on :
> 1. **Ouvrir Abby → Créer facture → Importer dans Vérone** ?
> 2. **Créer dans Vérone → Envoyer à Abby → Stocker retour** ?

---

## ✅ RÉPONSE : WORKFLOW RECOMMANDÉ (Option 2)

**🏆 Best Practice** : **Vérone = Source de vérité → Abby = Système externe**

### **Pourquoi Option 2 est meilleure ?**

| Critère | Option 1 (Abby → Vérone) | Option 2 (Vérone → Abby) |
|---------|--------------------------|--------------------------|
| **Source de vérité** | ❌ Abby (externe) | ✅ Vérone (interne) |
| **Contrôle workflow** | ❌ Manuel (admin ouvre Abby) | ✅ Automatique (API) |
| **Cohérence données** | ❌ Risque désynchronisation | ✅ Sync automatique |
| **Expérience utilisateur** | ❌ 2 interfaces (Vérone + Abby) | ✅ 1 interface (Vérone) |
| **Traçabilité** | ❌ Difficile (2 systèmes) | ✅ Facile (1 système) |
| **Scalabilité** | ❌ Lent (manuel) | ✅ Rapide (automatique) |

---

## 🔄 WORKFLOW COMPLET (OPTION 2 DÉTAILLÉE)

### **Phase 1 : Création Commande Vente (Vérone)**

```
Admin Vérone → Crée sales_order
  ├── Sélection client (organisation OU individual_customer)
  ├── Ajout produits + quantités
  ├── Calcul total HT, TVA, TTC
  ├── Status: draft → pending → shipped
  └── Stock decremented (trigger)
```

**Tables impliquées** :
```sql
sales_orders (
  id,
  customer_id UUID,          -- ✅ Lien flexible (voir ci-dessous)
  customer_type TEXT,         -- 'organisation' ou 'individual'
  order_number TEXT,
  total_ht DECIMAL,
  total_ttc DECIMAL,
  status TEXT                 -- 'pending', 'shipped', etc.
)
```

### **Phase 2 : Génération Facture (Vérone → Abby)**

```
Admin clique "Générer facture" (sales_order.status = 'shipped')
  ↓
POST /api/invoices/generate { salesOrderId }
  ↓
RPC generate_invoice_from_order()
  ├── 1. Créer invoice locale (Vérone DB)
  │   ├── INSERT INTO invoices (sales_order_id, total_ttc, status='draft')
  │   ├── customer_id hérité de sales_order
  │   └── Génération invoice_number local (FAC-2025-001)
  ↓
  ├── 2. Push vers Abby API
  │   ├── POST https://api.abby.fr/invoices
  │   ├── Body: { customer, items[], total, dueDate }
  │   └── Response: { abby_invoice_id, abby_invoice_number }
  ↓
  ├── 3. Update invoice locale avec IDs Abby
  │   ├── UPDATE invoices SET abby_invoice_id, abby_invoice_number
  │   └── INSERT INTO abby_sync_queue (operation='create_invoice', status='success')
  ↓
  └── 4. Return success to UI
      └── Toast: "Facture FAC-2025-001 créée et synchronisée avec Abby"
```

**Gestion erreurs** :
```sql
-- Si Abby API échoue
INSERT INTO abby_sync_queue (
  operation = 'create_invoice',
  status = 'pending',
  retry_count = 0,
  payload = { invoice_id, customer_data, items }
)

-- CRON job: /api/cron/sync-abby-queue (toutes les 5 min)
→ Retry avec exponential backoff (1min, 2min, 4min)
→ Max 3 retries → Dead Letter Queue
```

### **Phase 3 : Webhooks Abby → Vérone (Sync Status)**

```
Abby Event: invoice.sent
  ↓
POST /api/webhooks/abby
  Headers: X-Abby-Signature (HMAC-SHA256)
  Body: {
    id: 'evt_123',
    type: 'invoice.sent',
    data: {
      invoice: { id: 'abby_inv_456', status: 'sent' }
    }
  }
  ↓
1. Validate signature (security)
2. Check idempotency (evt_123 déjà traité ?)
3. Update invoice locale
   UPDATE invoices SET status='sent' WHERE abby_invoice_id='abby_inv_456'
4. Insert webhook history
   INSERT INTO abby_webhook_events (event_id, event_type, processed_at)
```

**Events supportés** :
- `invoice.sent` → Status: draft → sent
- `invoice.paid` → Status: sent → paid + INSERT payment
- `invoice.cancelled` → Status: * → cancelled
- `invoice.overdue` → Status: sent → overdue

### **Phase 4 : Enregistrement Paiement**

**Cas 1 : Webhook Abby (paiement externe)**
```
Abby Event: invoice.paid
  ↓
POST /api/webhooks/abby
  Body: {
    type: 'invoice.paid',
    data: {
      invoice: { id: 'abby_inv_456' },
      payment: { amount: 120.00, date: '2025-10-11', method: 'bank_transfer' }
    }
  }
  ↓
RPC handle_abby_webhook_invoice_paid()
  ├── INSERT INTO payments (invoice_id, amount, payment_date, payment_method)
  ├── UPDATE invoices SET amount_paid += amount, status='paid'
  └── Trigger: validate_payment_coherence()
```

**Cas 2 : Saisie manuelle Vérone (paiement interne)**
```
Admin Vérone → /factures/[id] → PaymentForm
  ↓
Submit formulaire
  ↓
INSERT INTO payments (invoice_id, amount, payment_date, method='check', reference='CHQ-123')
  ↓
UPDATE invoices SET amount_paid += amount
  ↓
IF amount_paid >= total_ttc THEN status='paid'
ELSE status='partially_paid'
  ↓
(Optionnel) Push update vers Abby API
  POST https://api.abby.fr/invoices/{id}/payments
```

---

## 🏛️ ARCHITECTURE DONNÉES : CLIENT FLEXIBLE

### **Problème : 2 types de clients**
- **Organisations** (`organisations` table) : Clients B2B, fournisseurs, partenaires
- **Particuliers** (`individual_customers` table) : Clients B2C

### **Solution 1 : Polymorphic Association (RECOMMANDÉE)**

```sql
-- Table sales_orders
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL,              -- ID générique
  customer_type TEXT NOT NULL             -- 'organisation' | 'individual'
    CHECK (customer_type IN ('organisation', 'individual')),

  -- Autres colonnes
  order_number TEXT UNIQUE,
  total_ht DECIMAL(12,2),
  total_ttc DECIMAL(12,2),
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table invoices (même logique)
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  sales_order_id UUID REFERENCES sales_orders(id),

  -- Hérité de sales_order
  customer_id UUID NOT NULL,
  customer_type TEXT NOT NULL,

  abby_invoice_id TEXT UNIQUE,
  abby_invoice_number TEXT UNIQUE,
  total_ttc DECIMAL(12,2),
  amount_paid DECIMAL(12,2) DEFAULT 0,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour jointures
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id, customer_type);
CREATE INDEX idx_invoices_customer ON invoices(customer_id, customer_type);
```

**Query exemples** :
```sql
-- Récupérer factures avec client (organisation)
SELECT
  i.*,
  o.name AS customer_name,
  o.siret,
  o.billing_address
FROM invoices i
JOIN organisations o ON i.customer_id = o.id
WHERE i.customer_type = 'organisation';

-- Récupérer factures avec client (particulier)
SELECT
  i.*,
  ic.first_name || ' ' || ic.last_name AS customer_name,
  ic.email,
  ic.phone
FROM invoices i
JOIN individual_customers ic ON i.customer_id = ic.id
WHERE i.customer_type = 'individual';

-- RPC function helper
CREATE OR REPLACE FUNCTION get_invoice_with_customer(p_invoice_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_invoice invoices;
  v_customer JSONB;
BEGIN
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id;

  IF v_invoice.customer_type = 'organisation' THEN
    SELECT jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'type', 'organisation',
      'siret', o.siret,
      'billing_address', o.billing_address
    ) INTO v_customer
    FROM organisations o
    WHERE o.id = v_invoice.customer_id;
  ELSE
    SELECT jsonb_build_object(
      'id', ic.id,
      'name', ic.first_name || ' ' || ic.last_name,
      'type', 'individual',
      'email', ic.email,
      'phone', ic.phone
    ) INTO v_customer
    FROM individual_customers ic
    WHERE ic.id = v_invoice.customer_id;
  END IF;

  RETURN jsonb_build_object(
    'invoice', row_to_json(v_invoice),
    'customer', v_customer
  );
END;
$$;
```

### **Solution 2 : Table Pivot (Alternative)**

```sql
-- Table intermédiaire (si complexité augmente)
CREATE TABLE customers_unified (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_table TEXT NOT NULL CHECK (source_table IN ('organisations', 'individual_customers')),
  source_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  billing_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_table, source_id)
);

-- sales_orders référence customers_unified
CREATE TABLE sales_orders (
  id UUID PRIMARY KEY,
  customer_unified_id UUID REFERENCES customers_unified(id),
  -- ...
);
```

**Avantages** :
- ✅ Queries simplifiées (1 seul JOIN)
- ✅ Foreign key constraints propres
- ✅ Facilite reporting/analytics

**Inconvénients** :
- ❌ Table supplémentaire à maintenir
- ❌ Sync nécessaire (trigger ou app logic)

---

## 📊 COMPARAISON BEST PRACTICES INDUSTRIE

### **1. Stripe (Payment SaaS)**
```
Workflow: Local → Stripe
- Créer PaymentIntent local
- Push vers Stripe API
- Webhook Stripe → Update local status
- Source de vérité: Application locale
```

### **2. Salesforce (CRM/ERP)**
```
Workflow: Salesforce → Intégrations
- Créer Order/Invoice dans Salesforce
- Sync vers systèmes externes (comptabilité, etc.)
- Webhooks externes → Update Salesforce
- Source de vérité: Salesforce
```

### **3. Odoo (ERP Open Source)**
```
Workflow: Odoo → QuickBooks/Xero
- Créer facture Odoo
- Push vers logiciel comptable
- Sync bidirectionnelle (paiements)
- Source de vérité: Odoo
```

### **🏆 Consensus Industrie : Application interne = Source de vérité**

**Pourquoi ?**
1. **Contrôle total** : Logique métier dans votre code
2. **Audit trail** : Toutes modifications tracées localement
3. **Offline resilience** : Continue de fonctionner si service externe down
4. **Flexibilité** : Changer de provider externe sans refonte complète
5. **Performance** : Pas de round-trip vers externe pour chaque query

---

## 🚀 WORKFLOW RECOMMANDÉ FINAL

### **Étape par étape (UX Admin)**

#### **1. Création Commande**
```
Admin → Menu "Commandes" → "Nouvelle commande"
  ↓
Formulaire:
  - [ ] Client: [Dropdown Organisations + Particuliers]     ← ✅ UNIFIED
  - [ ] Produits: [Sélection multiple + quantités]
  - [ ] Notes: [Textarea optionnel]
  ↓
Clic "Créer commande"
  ↓
Status: draft → Admin modifie si besoin
  ↓
Clic "Confirmer commande"
  ↓
Status: pending → Préparation
  ↓
Clic "Marquer comme expédiée"
  ↓
Status: shipped → ✅ Prêt pour facturation
```

#### **2. Génération Facture**
```
Admin → Page "Commandes" → Filtre "Expédiées"
  ↓
Liste commandes avec bouton "Générer facture"
  ↓
Clic bouton
  ↓
<GenerateInvoiceButton salesOrderId={order.id} />
  ↓
Loading spinner...
  ↓
API Call: POST /api/invoices/generate
  ├── Créer invoice locale (Vérone DB)
  ├── Push vers Abby API
  └── Update avec abby_invoice_id
  ↓
Toast success: "Facture FAC-2025-123 créée"
  ↓
Redirect: /factures/[id]
```

#### **3. Consultation Facture**
```
Admin → Menu "Factures" → /factures
  ↓
Liste factures avec filtres:
  - Status (draft, sent, paid, overdue)
  - Recherche (numéro facture)
  - Client (dropdown organisations + particuliers)    ← ✅ UNIFIED
  ↓
Clic sur facture → /factures/[id]
  ↓
Page détail:
  - Infos client (organisation OU particulier)
  - Montants (HT, TVA, TTC)
  - Status + Badge
  - Historique paiements
  - Formulaire paiement (si restant dû > 0)
```

#### **4. Enregistrement Paiement**
```
Admin → /factures/[id] → PaymentForm
  ↓
Formulaire:
  - [ ] Montant: [Input number] (max: restant dû)
  - [ ] Date: [Date picker]
  - [ ] Méthode: [Select: virement, chèque, espèces, carte]
  - [ ] Référence: [Input text optionnel]
  - [ ] Notes: [Textarea optionnel]
  ↓
Validation Zod (montant ≤ restant)
  ↓
Submit
  ↓
INSERT INTO payments
UPDATE invoices SET amount_paid, status
  ↓
Toast success: "Paiement de 120.00€ enregistré"
  ↓
Refresh page (montant restant updated)
```

---

## 🛡️ SÉCURITÉ & BEST PRACTICES

### **1. Webhooks Abby**
```typescript
// Validation signature HMAC-SHA256
const computedSignature = crypto
  .createHmac('sha256', ABBY_WEBHOOK_SECRET)
  .update(payloadString)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(computedSignature),
  Buffer.from(receivedSignature)
);

// Idempotency (event_id unique)
const { data: existingEvent } = await supabase
  .from('abby_webhook_events')
  .select('id')
  .eq('event_id', webhookEventId)
  .single();

if (existingEvent) {
  return { message: 'Event already processed', status: 200 };
}
```

### **2. Retry Logic**
```sql
-- Trigger exponential backoff
CREATE OR REPLACE FUNCTION update_sync_queue_retry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.retry_count < 3 THEN
    -- Calculate next retry: 2^retry_count minutes
    NEW.next_retry_at = NOW() + INTERVAL '1 minute' * POWER(2, NEW.retry_count);
    NEW.status = 'pending';
  ELSIF NEW.retry_count >= 3 THEN
    -- Dead Letter Queue
    NEW.status = 'dead_letter';
  END IF;
  RETURN NEW;
END;
$$;
```

### **3. Data Coherence**
```sql
-- Constraint: amount_paid ≤ total_ttc
ALTER TABLE invoices ADD CONSTRAINT invoice_payment_coherent
  CHECK (amount_paid <= total_ttc);

-- Constraint: total_ttc = total_ht + tva_amount
ALTER TABLE invoices ADD CONSTRAINT invoice_totals_coherent
  CHECK (ABS(total_ttc - (total_ht + tva_amount)) < 0.01);
```

---

## 📝 RECOMMANDATIONS FINALES

### **✅ À FAIRE**
1. **Vérone = Source de vérité** : Toutes créations/modifications partent de Vérone
2. **Abby = Système externe** : Synchronisation unidirectionnelle (Vérone → Abby)
3. **Webhooks Abby → Vérone** : Pour status updates (sent, paid, overdue)
4. **Polymorphic association** : `customer_id` + `customer_type` dans `sales_orders` et `invoices`
5. **Retry mechanism** : Queue async avec exponential backoff
6. **Idempotency** : Toutes opérations API/webhooks doivent être idempotentes

### **❌ À ÉVITER**
1. **Ne PAS créer factures manuellement dans Abby** : Désynchronisation garantie
2. **Ne PAS dupliquer logique métier** : 1 seul endroit (Vérone RPC functions)
3. **Ne PAS sync bidirectionnelle sans contrôle** : Risque conflits
4. **Ne PAS oublier idempotency webhooks** : Doublons paiements = catastrophe

### **🎯 Phase MVP vs Phase 2**

**MVP (Phase 1 - ACTUELLE)** :
- ✅ Créer facture Vérone → Push Abby
- ✅ Webhooks Abby → Update status Vérone
- ✅ Enregistrement paiement manuel Vérone
- ⏸️ Push paiement vers Abby (optionnel)

**Phase 2 (Future)** :
- 🔄 Sync bidirectionnelle paiements (Vérone ↔ Abby)
- 📄 Export PDF via Abby API
- 📧 Envoi email facture via Abby
- 📊 Reporting avancé (CA, BFA, aging)

---

## 🎉 CONCLUSION

**Workflow optimal** : **Vérone → Abby (unidirectionnel)**

**Customer unified** : **Polymorphic association** (`customer_id` + `customer_type`)

**Best practices respectées** :
- ✅ Single source of truth (Vérone)
- ✅ External system as slave (Abby)
- ✅ Async queue + retries
- ✅ Webhooks + idempotency
- ✅ Data coherence (constraints)

🚀 **Système production-ready, scalable, et conforme aux standards industrie !**
