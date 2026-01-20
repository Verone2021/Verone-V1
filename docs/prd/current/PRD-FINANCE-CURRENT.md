# PRD Finance & Rapprochement Bancaire Current — État Actuel Implémenté

> **Version**: Production 2025-10-11
> **Statut**: ✅ COMPLET - EN PRODUCTION
> **Fichier Source**: `src/app/finance/rapprochement/page.tsx`
> **SLO Performance**: <3s chargement

---

## 🎯 Vue d'Ensemble

### Description Actuelle

Système complet de gestion financière avec synchronisation bancaire Qonto, génération factures Abby, rapprochement automatique transactions ↔ factures, et suivi trésorerie temps réel. Architecture Vérone = source de vérité.

### Scope Implémenté

- ✅ **Intégration Qonto** : Sync transactions bancaires automatique
- ✅ **Intégration Abby** : Génération factures clients/fournisseurs
- ✅ **Rapprochement Bancaire** : Matching automatique + manuel transactions ↔ factures
- ✅ **Treasury Dashboard** : KPIs financiers temps réel
- ✅ **Webhooks** : Qonto + Abby temps réel
- ✅ **Documents Financiers** : Factures, avoirs, devis (table unifiée)
- ✅ **Paiements** : Traçabilité complète paiements clients

---

## 📊 Features Implémentées

### 1. Intégration Qonto (Synchronisation Bancaire)

```typescript
// API Routes
POST / api / finance / qonto / sync - transactions; // Sync manuelle
POST / api / finance / qonto / webhook; // Webhook temps réel

// Types transactions
type TransactionSide = 'credit' | 'debit';
type MatchingStatus = 'matched' | 'unmatched' | 'pending_review';
```

**Features** :

- ✅ Synchronisation automatique transactions bancaires
- ✅ Webhook temps réel (nouvelle transaction Qonto)
- ✅ Détection doublons (transaction_id unique)
- ✅ Catégorisation transactions (type, label, counterparty)
- ✅ Support multi-comptes bancaires

**Table** : `bank_transactions`

```sql
Colonnes clés:
- transaction_id (unique Qonto)
- bank_account_id (FK bank_accounts)
- amount, currency (EUR)
- side ('credit' | 'debit')
- settled_at (date transaction)
- matching_status ('matched' | 'unmatched')
- matched_invoice_id (FK financial_documents)
- counterparty_name, counterparty_iban
- operation_type, label_text
```

### 2. Intégration Abby (Facturation)

```typescript
// API Routes
POST /api/finance/abby/generate-invoice     // Créer facture
POST /api/finance/abby/webhook              // Webhook Abby
GET  /api/finance/abby/invoices/:id         // Récupérer facture

// Workflow
Vérone (Source de vérité) → Abby (Système externe)
```

**Workflow Facturation** :

1. **Vérone** : Commande validée (`sales_orders.status = 'confirmed'`)
2. **Vérone** : Création `financial_documents` (type: customer_invoice, status: draft)
3. **API Abby** : POST invoice avec items/client/totaux
4. **Abby** : Retour `abby_invoice_id` + PDF URL
5. **Vérone** : Update `financial_documents.abby_invoice_id` + status: sent
6. **Abby** : Envoi email client avec PDF

**Table** : `financial_documents`

```sql
Colonnes clés:
- document_type ('customer_invoice' | 'supplier_invoice' | 'credit_note' | 'quote')
- document_number (FAC-2025-001 auto-généré)
- partner_id (FK polymorphique organisations/individual_customers)
- partner_type ('organisation' | 'individual')
- total_ht, total_tva, total_ttc
- amount_paid, amount_remaining
- status ('draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled')
- abby_invoice_id (unique Abby)
- abby_pdf_url
- document_date, due_date, paid_at
- sales_order_id (FK sales_orders - pour factures clients)
```

### 3. Rapprochement Bancaire Automatique

**Algorithme Matching** :

```typescript
// Critères matching automatique
1. Montant exact (transaction.amount === invoice.amount_remaining)
2. Date proche (±7 jours transaction.settled_at ≈ invoice.due_date)
3. Nom client (fuzzy match counterparty_name ≈ customer_name)
4. Référence facture (label_text contains invoice_number)

// Scoring confiance
confidence =
  (amount_match ? 40 : 0) +
  (date_match ? 20 : 0) +
  (name_match ? 30 : 0) +
  (reference_match ? 10 : 0)

// Auto-match si confidence >= 80%
```

**Interface Rapprochement** :

- ✅ Liste transactions non rapprochées (`matching_status: 'unmatched'`)
- ✅ Suggestions matching avec score confiance
- ✅ Validation manuelle admin
- ✅ Création paiement (`financial_payments` table)
- ✅ Update statut facture (paid / partially_paid)

**Table** : `financial_payments`

```sql
Colonnes:
- financial_document_id (FK financial_documents)
- bank_transaction_id (FK bank_transactions)
- amount
- payment_date
- payment_method ('bank_transfer' | 'card' | 'cash' | 'check')
- notes
- created_by (FK user_profiles)
```

### 4. Treasury Dashboard (KPIs Trésorerie)

**Métriques Temps Réel** :

```typescript
interface TreasuryStats {
  total_unmatched: number; // Transactions non rapprochées
  total_amount_pending: number; // Montant factures impayées
  auto_match_rate: number; // % matching automatique
  manual_review_count: number; // Transactions à revoir
  current_balance: number; // Solde comptes bancaires
  monthly_revenue: number; // CA mensuel
  monthly_expenses: number; // Dépenses mensuelles
  cash_flow: number; // Flux trésorerie
}
```

**Affichage** :

- ✅ Stats cards (4 KPIs principaux)
- ✅ Liste transactions unmatched avec suggestions
- ✅ Liste factures impayées
- ✅ Actions rapides (valider match, créer paiement manuel)

### 5. Webhooks Temps Réel

**Qonto Webhook** :

```typescript
POST /api/finance/qonto/webhook
// Événements:
- transaction.created → Sync nouvelle transaction
- transaction.updated → Update existante
- account.balance_updated → Refresh solde
```

**Abby Webhook** :

```typescript
POST /api/finance/abby/webhook
// Événements:
- invoice.sent → Update status financial_document
- invoice.paid → Créer payment + update status
- invoice.cancelled → Update status cancelled
```

---

## 🎨 Design System Appliqué

### Composants UI

- **Stats Cards** : KPIs trésorerie
- **Table Transactions** : Dense, filtres, tri
- **Badge Suggestions** : Score confiance (couleur conditionnelle)
- **Modal Détails** : Transaction + facture + historique

### Icons Lucide

- `Wallet` - Trésorerie
- `CreditCard` - Transactions
- `FileText` - Factures
- `CheckCircle` - Match validé
- `AlertCircle` - Review manuel
- `TrendingUp` - CA
- `TrendingDown` - Dépenses

### Couleurs Statuts

```typescript
documentStatusColors = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  partially_paid: 'yellow',
  overdue: 'red',
  cancelled: 'gray',
};

matchingStatusColors = {
  matched: 'green',
  unmatched: 'yellow',
  pending_review: 'orange',
};
```

---

## 🔧 Implémentation Technique

### Hook Principal

```typescript
const {
  unmatchedTransactions, // BankTransaction[] non rapprochées
  unpaidInvoices, // Financial_documents[] impayées
  stats, // TreasuryStats
  loading,
  error,
  validateMatch, // (transactionId, invoiceId) => Promise
  createManualPayment, // (invoiceId, amount, method) => Promise
  refreshData, // () => Promise
} = useBankReconciliation();
```

### APIs Clés

```typescript
// Qonto Sync
POST /api/finance/qonto/sync-transactions
→ Fetch Qonto API /transactions
→ Insert/Update bank_transactions
→ Return { synced_count, new_count }

// Abby Invoice Generation
POST /api/finance/abby/generate-invoice
Body: { salesOrderId }
→ Create financial_documents (draft)
→ POST Abby API /invoices
→ Update abby_invoice_id + abby_pdf_url
→ Return { invoice_id, pdf_url }

// Bank Reconciliation Match
POST /api/finance/reconciliation/match
Body: { transactionId, invoiceId }
→ Create financial_payments
→ Update bank_transactions.matching_status = 'matched'
→ Update financial_documents.amount_paid += amount
→ If amount_paid >= total_ttc: status = 'paid'
→ Return { payment_id }
```

### Tables BDD Complètes

**financial_documents** (52 colonnes - table unifiée) :

- Types : customer_invoice, supplier_invoice, credit_note, quote
- Polymorphisme client : partner_id + partner_type
- Intégration Abby : abby_invoice_id, abby_pdf_url
- Paiements : amount_paid, amount_remaining, paid_at

**bank_transactions** :

- Sync Qonto : transaction_id (unique), settled_at, amount
- Matching : matching_status, matched_invoice_id
- Détails : counterparty_name, counterparty_iban, label_text

**financial_payments** :

- Lien transaction ↔ facture
- Traçabilité : payment_date, created_by
- Méthode : bank_transfer, card, cash, check

**bank_accounts** :

- Comptes bancaires Qonto
- Soldes : current_balance, available_balance
- API : qonto_account_id, qonto_org_id

---

## 📋 Business Rules Appliquées

### Règle 1 : Vérone = Source de Vérité

- ✅ Toute création facture commence dans Vérone
- ✅ Abby est système externe (sync outbound uniquement)
- ✅ financial_documents.id = primary key (pas abby_invoice_id)

### Règle 2 : Matching Automatique Conditions

```typescript
auto_match_enabled = true IF:
  - confidence >= 80%
  - amount_match === true (exact)
  - no existing match on transaction
  - no existing match on invoice
```

### Règle 3 : Paiements Partiels

```typescript
// Autoriser acomptes multiples
financial_documents.amount_paid += payment.amount
financial_documents.amount_remaining = total_ttc - amount_paid

status =
  amount_paid === 0 ? 'sent' :
  amount_paid < total_ttc ? 'partially_paid' :
  amount_paid >= total_ttc ? 'paid'
```

### Règle 4 : Webhooks Idempotence

- ✅ Transaction Qonto : unique par transaction_id
- ✅ Facture Abby : unique par abby_invoice_id
- ✅ Doublons ignorés (INSERT ON CONFLICT DO NOTHING)

**Business Rules File** : `docs/architecture/WORKFLOW-FACTURATION-ABBY-BEST-PRACTICES.md`

---

## 🚧 Limitations Connues & Roadmap

### Limitations Actuelles

- ❌ Pas de prévisions trésorerie (forecasting)
- ❌ Pas d'export comptable (FEC)
- ❌ Pas de relances automatiques impayés
- ❌ Pas de gestion lettrage comptable

### Roadmap 2025-Q4

**Priorité 1** (2 semaines) :

- [ ] Relances automatiques factures impayées
- [ ] Export comptable FEC (normes DGFiP)
- [ ] Rapports trésorerie PDF

**Priorité 2** (1 mois) :

- [ ] Prévisions trésorerie (30/60/90 jours)
- [ ] Dashboard analytics financières
- [ ] Lettrage comptable complet

**Priorité 3** (3 mois) :

- [ ] Intégration comptable (Pennylane, QuickBooks)
- [ ] Gestion budgets/prévisions
- [ ] Reporting fiscal automatisé

---

## 🔗 Dépendances & Relations

### Modules Liés

- **Commandes** (`/commandes/clients`) - Génération factures depuis commandes
- **Organisations** (`/contacts-organisations`) - Clients facturés
- **Stocks** (`/stocks/mouvements`) - Valorisation stock

### Intégrations Externes

- **Qonto API** : Synchronisation transactions bancaires
- **Abby API** : Génération + envoi factures PDF
- **Email** (future) : Relances impayés

---

## 🧪 Tests & Validation

### Tests Actuels

- ✅ Sync Qonto manuelle validée
- ✅ Génération facture Abby testée
- ✅ Matching automatique fonctionnel
- ✅ Webhooks testés (Qonto + Abby)

### Tests Manquants

- ⏳ Tests E2E workflow complet
- ⏳ Tests performance (10 000+ transactions)
- ⏳ Tests edge cases matching (montants proches, doublons)

---

## 📚 Documentation Associée

### Fichiers Clés

- **Page** : `src/app/finance/rapprochement/page.tsx`
- **Hook** : `src/hooks/use-bank-reconciliation.ts`
- **APIs** : `src/app/api/finance/qonto/*`, `src/app/api/finance/abby/*`
- **Docs** :
  - `docs/architecture/WORKFLOW-FACTURATION-ABBY-BEST-PRACTICES.md`
  - `docs/integration-facturation/ABBY-API-SETUP-GUIDE.md`

### Sessions

- `MEMORY-BANK/sessions/2025-10-11-SYSTEME-FACTURATION-COMPLET-SUCCESS.md` - Implémentation complète
- `2025-10-10-migration-invoices-financial-documents.md` - Migration table unifiée

---

**Dernière Mise à Jour** : 2025-10-11
**Maintenu Par** : Équipe Vérone
**Next Review** : 2025-10-25 (relances automatiques + export FEC)
