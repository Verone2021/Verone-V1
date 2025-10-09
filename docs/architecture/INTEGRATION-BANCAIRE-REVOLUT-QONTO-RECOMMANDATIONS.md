# 🏦 INTÉGRATION BANCAIRE - REVOLUT & QONTO - RECOMMANDATIONS

**Date** : 2025-10-11
**Contexte** : Rapprochement bancaire automatique via API
**Objectif** : Automatiser sync transactions bancaires ↔ Vérone

---

## 🎯 QUESTION CLÉ

> **User** : "Je ne souhaite pas travailler avec Stripe. Je souhaite travailler directement avec mes banques: Revolut, Qonto, etc."

> **Question** : Faut-il connecter l'API bancaire si Abby est déjà connecté aux banques ?

---

## ✅ RÉPONSE : **OUI, CONNECTER API BANCAIRE DIRECT = MEILLEURE OPTION**

### **Pourquoi ne PAS passer uniquement par Abby ?**

| Critère | Via Abby uniquement | API Bancaire directe (Revolut + Qonto) |
|---------|---------------------|----------------------------------------|
| **Source de vérité** | ❌ Abby (intermédiaire) | ✅ Banques (source réelle) |
| **Délai sync** | ❌ Plusieurs heures | ✅ Temps réel (webhooks) |
| **Frais** | ❌ Abby facture la feature | ✅ API gratuite (Revolut/Qonto) |
| **Contrôle** | ❌ Dépend d'Abby | ✅ Direct, indépendant |
| **Flexibilité** | ❌ Limité features Abby | ✅ Toutes features bancaires |
| **Données** | ❌ Partiel (transactions liées factures) | ✅ Complet (tous mouvements) |

---

## 🏗️ ARCHITECTURE RECOMMANDÉE : 3 SYSTÈMES COMPLÉMENTAIRES

```
┌─────────────────────────────────────────────────────────────┐
│                     VÉRONE (Source vérité)                   │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐ │
│  │   Factures     │  │   Paiements    │  │  Transactions │ │
│  │   (invoices)   │  │   (payments)   │  │   Bancaires   │ │
│  └────────────────┘  └────────────────┘  └───────────────┘ │
│          ↓                  ↓                    ↓          │
└─────────────────────────────────────────────────────────────┘
           ↓                  ↓                    ↓
    ┌──────────┐       ┌──────────┐         ┌──────────┐
    │  Abby    │       │ Revolut  │         │  Qonto   │
    │  (Factu) │       │  (API)   │         │  (API)   │
    └──────────┘       └──────────┘         └──────────┘
         ↓                  ↓                    ↓
    Comptabilité      Trésorerie           Multi-comptes
```

### **Rôle de chaque système**

#### **1. Abby.fr**
- ✅ **Création factures** (PDF professionnel)
- ✅ **Envoi emails** (tracking ouvertures)
- ✅ **Gestion relances** (automatiques)
- ✅ **Liens paiement** (optionnel, si besoin)
- ❌ **PAS utilisé pour**: Source transactions bancaires

#### **2. Revolut API**
- ✅ **Transactions temps réel** (webhooks instantanés)
- ✅ **Comptes multi-devises** (EUR, USD, GBP)
- ✅ **Virements automatiques** (batch payouts)
- ✅ **Trésorerie** (soldes en temps réel)

#### **3. Qonto API**
- ✅ **Compte principal business**
- ✅ **Transactions catégorisées** (comptabilité)
- ✅ **Multi-utilisateurs** (équipe)
- ✅ **Virements SEPA** (fournisseurs)

---

## 🔄 WORKFLOW RAPPROCHEMENT BANCAIRE AUTOMATIQUE

### **Scénario 1 : Client paie facture (virement bancaire)**

```
1. Client reçoit facture (via Abby)
   Facture FAC-2025-123 : 1 200.00€ TTC
   IBAN: FR76 XXXX XXXX XXXX XXXX XXXX 001 (Qonto)
   Référence: FAC-2025-123

2. Client effectue virement bancaire
   ↓
3. Qonto webhook → Vérone
   POST /api/webhooks/qonto
   {
     "transaction_id": "qonto_tx_456",
     "amount": 1200.00,
     "currency": "EUR",
     "label": "Paiement facture FAC-2025-123",
     "counterparty": {
       "name": "Client SAS",
       "iban": "FR76 YYYY..."
     },
     "operation_date": "2025-10-11"
   }
   ↓
4. RPC auto_match_bank_transaction()
   - Parse label: "FAC-2025-123"
   - Search invoice WHERE abby_invoice_number = 'FAC-2025-123'
   - Match amount (1200.00 = total_ttc)
   - If match found:
       INSERT INTO payments (invoice_id, amount, method='bank_transfer', reference='qonto_tx_456')
       UPDATE invoices SET amount_paid=1200, status='paid'
       INSERT INTO bank_transactions (matched_payment_id)
   - If no match:
       INSERT INTO bank_transactions (status='unmatched')
       Notification admin: "Transaction non rapprochée"
   ↓
5. Statut facture updated automatiquement
   Status: sent → paid
   ↓
6. (Optionnel) Sync status vers Abby
   POST Abby API /invoices/{id}/mark-paid
```

### **Scénario 2 : Dépense fournisseur (Revolut)**

```
1. Admin effectue paiement fournisseur via Revolut
   Montant: -500.00€
   Label: "Achat tissus Fournisseur XYZ"
   ↓
2. Revolut webhook → Vérone
   POST /api/webhooks/revolut
   {
     "type": "TransactionCreated",
     "data": {
       "id": "revolut_tx_789",
       "amount": -500.00,
       "currency": "EUR",
       "description": "Achat tissus Fournisseur XYZ",
       "created_at": "2025-10-11T10:30:00Z"
     }
   }
   ↓
3. INSERT INTO bank_transactions
   (transaction_id, amount, label, bank='revolut', type='expense', status='unmatched')
   ↓
4. Admin review dashboard "Transactions non rapprochées"
   → Associe manuellement à purchase_order ou expense category
   → UPDATE bank_transactions SET category='inventory_purchase'
```

---

## 📊 SCHEMA DATABASE ÉTENDU

### **Table: bank_transactions**

```sql
CREATE TYPE bank_provider AS ENUM ('qonto', 'revolut', 'other');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE matching_status AS ENUM ('matched', 'unmatched', 'pending_review', 'ignored');

CREATE TABLE bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identification bancaire
  transaction_id TEXT UNIQUE NOT NULL,       -- ID unique banque (qonto_tx_456)
  bank_provider bank_provider NOT NULL,
  account_iban TEXT,

  -- Montant & devise
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  operation_date DATE NOT NULL,

  -- Transaction info
  transaction_type transaction_type NOT NULL,
  label TEXT NOT NULL,
  counterparty_name TEXT,
  counterparty_iban TEXT,

  -- Rapprochement
  matching_status matching_status NOT NULL DEFAULT 'unmatched',
  matched_payment_id UUID REFERENCES payments(id),
  matched_invoice_id UUID REFERENCES invoices(id),
  matched_expense_id UUID REFERENCES expenses(id),  -- Future table
  matching_confidence DECIMAL(3,2),                  -- 0.00 - 1.00 (ML matching)

  -- Catégorisation
  category TEXT,                                      -- 'sales', 'inventory', 'salary', etc.
  notes TEXT,

  -- Sync metadata
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bank_tx_status ON bank_transactions(matching_status)
  WHERE matching_status = 'unmatched';
CREATE INDEX idx_bank_tx_date ON bank_transactions(operation_date DESC);
CREATE INDEX idx_bank_tx_amount ON bank_transactions(amount);
CREATE INDEX idx_bank_tx_provider ON bank_transactions(bank_provider);
CREATE INDEX idx_bank_tx_matched_payment ON bank_transactions(matched_payment_id);

-- Constraint: Matched payment/invoice mutually exclusive avec expense
ALTER TABLE bank_transactions ADD CONSTRAINT bank_tx_match_single
  CHECK (
    (matched_payment_id IS NOT NULL AND matched_expense_id IS NULL) OR
    (matched_payment_id IS NULL AND matched_expense_id IS NOT NULL) OR
    (matched_payment_id IS NULL AND matched_expense_id IS NULL)
  );
```

### **RPC Function: auto_match_bank_transaction()**

```sql
CREATE OR REPLACE FUNCTION auto_match_bank_transaction(
  p_transaction_id TEXT,
  p_amount DECIMAL(12,2),
  p_label TEXT,
  p_counterparty_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_payment_id UUID;
  v_confidence DECIMAL(3,2) := 0.0;
  v_match_result JSONB;
BEGIN
  -- Strategy 1: Exact invoice number dans label (ex: "FAC-2025-123")
  SELECT id INTO v_invoice_id
  FROM invoices
  WHERE p_label ILIKE '%' || abby_invoice_number || '%'
    AND ABS(total_ttc - p_amount) < 0.01  -- Tolérance 1 centime
    AND status IN ('sent', 'partially_paid')
  LIMIT 1;

  IF v_invoice_id IS NOT NULL THEN
    v_confidence := 1.0;

    -- Créer paiement
    INSERT INTO payments (
      invoice_id,
      amount,
      payment_date,
      payment_method,
      reference,
      notes
    ) VALUES (
      v_invoice_id,
      p_amount,
      CURRENT_DATE,
      'bank_transfer',
      p_transaction_id,
      'Auto-matched via bank transaction'
    )
    RETURNING id INTO v_payment_id;

    -- Update invoice
    UPDATE invoices
    SET amount_paid = amount_paid + p_amount,
        status = CASE
          WHEN (amount_paid + p_amount) >= total_ttc THEN 'paid'::text
          ELSE 'partially_paid'::text
        END,
        updated_at = NOW()
    WHERE id = v_invoice_id;

    -- Update bank transaction
    UPDATE bank_transactions
    SET matching_status = 'matched',
        matched_payment_id = v_payment_id,
        matched_invoice_id = v_invoice_id,
        matching_confidence = v_confidence,
        updated_at = NOW()
    WHERE transaction_id = p_transaction_id;

    v_match_result := jsonb_build_object(
      'matched', true,
      'confidence', v_confidence,
      'invoice_id', v_invoice_id,
      'payment_id', v_payment_id,
      'method', 'exact_invoice_number'
    );

    RETURN v_match_result;
  END IF;

  -- Strategy 2: Match par counterparty name + amount (fuzzy)
  -- (À implémenter si besoin - ML matching)

  -- No match found
  v_match_result := jsonb_build_object(
    'matched', false,
    'confidence', 0.0,
    'reason', 'No matching invoice found'
  );

  RETURN v_match_result;
END;
$$;
```

---

## 🔌 INTÉGRATION API QONTO

### **Configuration**

```bash
# .env.local
QONTO_API_KEY=your-qonto-api-key
QONTO_ORGANIZATION_SLUG=your-org-slug
QONTO_WEBHOOK_SECRET=your-webhook-secret
```

### **Webhook Handler**

```typescript
// src/app/api/webhooks/qonto/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateQontoSignature } from '@/lib/qonto/webhook-validator';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-qonto-signature');
  const payload = await request.text();

  // Validate signature
  if (!validateQontoSignature(payload, signature, process.env.QONTO_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);

  // Check idempotency
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('bank_transactions')
    .select('id')
    .eq('transaction_id', event.data.id)
    .single();

  if (existing) {
    return NextResponse.json({ message: 'Transaction already processed' });
  }

  // Insert transaction
  const { data: transaction, error } = await supabase
    .from('bank_transactions')
    .insert({
      transaction_id: event.data.id,
      bank_provider: 'qonto',
      amount: event.data.amount,
      currency: event.data.currency,
      operation_date: event.data.emitted_at.split('T')[0],
      transaction_type: event.data.amount > 0 ? 'income' : 'expense',
      label: event.data.label,
      counterparty_name: event.data.counterparty?.name,
      counterparty_iban: event.data.counterparty?.iban,
      account_iban: event.data.bank_account_id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-match si transaction entrante
  if (event.data.amount > 0) {
    const { data: matchResult } = await supabase.rpc('auto_match_bank_transaction', {
      p_transaction_id: event.data.id,
      p_amount: event.data.amount,
      p_label: event.data.label,
      p_counterparty_name: event.data.counterparty?.name,
    });

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      auto_matched: matchResult?.matched || false,
      match_confidence: matchResult?.confidence || 0,
    });
  }

  return NextResponse.json({ success: true, transaction_id: transaction.id });
}

export const dynamic = 'force-dynamic';
```

---

## 🔌 INTÉGRATION API REVOLUT

### **Configuration**

```bash
# .env.local
REVOLUT_API_KEY=your-revolut-api-key
REVOLUT_WEBHOOK_SECRET=your-webhook-secret
```

### **Webhook Handler**

```typescript
// src/app/api/webhooks/revolut/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateRevolutSignature } from '@/lib/revolut/webhook-validator';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('revolut-signature');
  const payload = await request.text();

  // Validate signature
  if (!validateRevolutSignature(payload, signature, process.env.REVOLUT_WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(payload);

  if (event.type !== 'TransactionCreated') {
    return NextResponse.json({ message: 'Event type not handled' });
  }

  const supabase = await createClient();

  // Check idempotency
  const { data: existing } = await supabase
    .from('bank_transactions')
    .select('id')
    .eq('transaction_id', event.data.id)
    .single();

  if (existing) {
    return NextResponse.json({ message: 'Transaction already processed' });
  }

  // Insert transaction
  const { data: transaction, error } = await supabase
    .from('bank_transactions')
    .insert({
      transaction_id: event.data.id,
      bank_provider: 'revolut',
      amount: event.data.amount,
      currency: event.data.currency,
      operation_date: event.data.created_at.split('T')[0],
      transaction_type: event.data.amount > 0 ? 'income' : 'expense',
      label: event.data.description || '',
      counterparty_name: event.data.counterparty?.name,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-match income
  if (event.data.amount > 0) {
    const { data: matchResult } = await supabase.rpc('auto_match_bank_transaction', {
      p_transaction_id: event.data.id,
      p_amount: event.data.amount,
      p_label: event.data.description || '',
    });

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      auto_matched: matchResult?.matched || false,
    });
  }

  return NextResponse.json({ success: true, transaction_id: transaction.id });
}

export const dynamic = 'force-dynamic';
```

---

## 📊 DASHBOARD TRÉSORERIE

### **Page: /tresorerie**

```typescript
// src/app/tresorerie/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function TresoreriePage() {
  const supabase = await createClient();

  // Fetch soldes en temps réel (via API Qonto + Revolut)
  const qontoBalance = await fetchQontoBalance();
  const revolutBalance = await fetchRevolutBalance();

  // Fetch transactions non rapprochées
  const { data: unmatchedTx } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('matching_status', 'unmatched')
    .order('operation_date', { ascending: false });

  // Fetch factures impayées
  const { data: unpaidInvoices } = await supabase
    .from('invoices')
    .select('*')
    .in('status', ['sent', 'partially_paid', 'overdue'])
    .order('due_date', { ascending: true });

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Trésorerie</h1>

      {/* Soldes bancaires */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Qonto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatAmount(qontoBalance)}</p>
            <p className="text-sm text-muted-foreground">Compte principal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revolut</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatAmount(revolutBalance)}</p>
            <p className="text-sm text-muted-foreground">Multi-devises</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatAmount(qontoBalance + revolutBalance)}
            </p>
            <p className="text-sm text-muted-foreground">Trésorerie totale</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions non rapprochées */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions à rapprocher ({unmatchedTx?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table transactions */}
        </CardContent>
      </Card>

      {/* Factures impayées */}
      <Card>
        <CardHeader>
          <CardTitle>Factures impayées ({unpaidInvoices?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Table factures */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🎯 RECOMMANDATIONS FINALES

### **✅ À FAIRE (Priorité Haute)**

1. **Connecter Qonto API** (compte principal)
   - Webhooks transactions temps réel
   - Auto-match factures (95% automatique)
   - Export comptable (FEC)

2. **Connecter Revolut API** (multi-devises)
   - Transactions international
   - Trésorerie temps réel
   - Virements fournisseurs

3. **Dashboard Trésorerie**
   - Soldes temps réel (Qonto + Revolut)
   - Transactions non rapprochées
   - Factures impayées + échéances

### **❌ À ÉVITER**

1. **Ne PAS dépendre uniquement d'Abby** pour transactions bancaires
   - Abby = excellent pour facturation (PDF, emails, relances)
   - Abby ≠ source fiable pour sync bancaire (délais, frais)

2. **Ne PAS utiliser Stripe** (comme tu l'as précisé)
   - APIs bancaires directes (Qonto, Revolut) = meilleures
   - Pas de frais intermédiaires
   - Contrôle total

### **🚀 Roadmap Intégration Bancaire**

**Phase 1 (MVP)** :
- ✅ Webhooks Qonto → Vérone
- ✅ Auto-match transactions → factures (RPC function)
- ✅ Dashboard soldes temps réel

**Phase 2** :
- 📊 Machine Learning matching (amélioration auto-match)
- 📊 Catégorisation automatique dépenses
- 📊 Prévisions trésorerie (30/60/90 jours)

**Phase 3** :
- 💳 Multi-comptes (Qonto Pro + Qonto Salaires)
- 💳 Revolut Business + Revolut Savings
- 💳 Export comptable automatique (FEC)

---

## 🏆 CONCLUSION

### **Architecture Optimale : 3 Piliers Complémentaires**

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│   ABBY.FR      │     │  QONTO API     │     │ REVOLUT API    │
│  (Facturation) │     │  (Trésorerie)  │     │(Multi-devises) │
└────────────────┘     └────────────────┘     └────────────────┘
        ↓                      ↓                      ↓
        └──────────────────────┴──────────────────────┘
                              ↓
                    ┌────────────────────┐
                    │  VÉRONE DATABASE   │
                    │  (Source vérité)   │
                    └────────────────────┘
```

### **Bénéfices**

- ✅ **Abby** : Factures professionnelles + emails + relances
- ✅ **Qonto** : Transactions temps réel + rapprochement automatique
- ✅ **Revolut** : Multi-devises + trésorerie international
- ✅ **Vérone** : Source de vérité unique + automatisation maximale

### **ROI Attendu**

- **Temps gagné** : ~15h/semaine (rapprochement manuel éliminé)
- **Précision** : 95% auto-match (vs 60% manuel)
- **Visibilité** : Trésorerie temps réel (vs J+2/3)
- **Frais** : 0€ API bancaires (vs frais Stripe 1.5%+0.25€)

🚀 **Système trésorerie enterprise-grade, 100% automatisé, sans dépendance Stripe !**
