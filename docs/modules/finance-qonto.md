# Module Finance & Qonto - Vérone Back Office

**Version**: 1.0.0
**Dernière mise à jour**: 2026-01-23
**Responsable**: Romeo Dos Santos

---

## Vue d'ensemble

Le module Finance gère la comptabilité, les transactions bancaires, la facturation et l'intégration avec Qonto au sein de Vérone CRM/ERP. Il permet un suivi en temps réel de la trésorerie et automatise la catégorisation des transactions.

### Scope fonctionnel

- Intégration bancaire Qonto (sync automatique)
- Gestion des transactions bancaires
- Rapprochement bancaire automatique et manuel
- Catégorisation des dépenses (PCG)
- Facturation clients (émission)
- Suivi factures fournisseurs
- Tableau de bord trésorerie
- Prévisionnel de trésorerie

---

## Architecture

### Tables Supabase principales

```
bank_accounts                 # Comptes bancaires
├── bank_transactions        # Transactions (1:N)
│   ├── transaction_attachments  # Justificatifs (1:N)
│   └── pcg_categories      # Catégorie comptable (N:1)
│
qonto_connections            # Connexions API Qonto
│
invoices                     # Factures émises
├── invoice_items           # Lignes facture (1:N)
│
expenses                     # Dépenses/Factures fournisseurs
├── expense_attachments     # Justificatifs (1:N)
```

#### Table `bank_transactions`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| bank_account_id | uuid | FK vers bank_accounts |
| external_id | text | ID Qonto (déduplication) |
| reference | text | Référence transaction |
| label | text | Libellé bancaire |
| amount | numeric | Montant (signé) |
| side | enum | 'credit' ou 'debit' |
| emitted_at | timestamptz | Date opération |
| settled_at | timestamptz | Date valeur |
| counterparty_name | text | Nom contrepartie |
| pcg_category_id | uuid | FK vers pcg_categories |
| is_reconciled | boolean | Rapprochement effectué |
| reconciled_with_type | text | Type document rapproché |
| reconciled_with_id | uuid | ID document rapproché |
| attachment_count | integer | Nombre justificatifs |
| created_at | timestamptz | Date création |

#### Table `qonto_connections`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| organisation_id | uuid | FK vers organisations |
| bank_account_id | uuid | FK vers bank_accounts |
| api_key | text | Clé API chiffrée |
| last_sync_at | timestamptz | Dernière sync |
| sync_status | enum | 'active', 'error', 'paused' |
| error_message | text | Dernier message erreur |

---

## Intégration Qonto

### Configuration

```typescript
// Variables d'environnement requises
QONTO_API_URL=https://thirdparty.qonto.com/v2
QONTO_LOGIN=xxx  // Login Qonto
QONTO_SECRET_KEY=xxx  // Clé secrète API
```

### Sync automatique

**Fréquence**: Toutes les 4 heures via Cron Vercel

```typescript
// app/api/cron/qonto-sync/route.ts

export async function GET(request: Request) {
  // Vérifier autorisation cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Récupérer connexions actives
  const connections = await getActiveQontoConnections();

  for (const connection of connections) {
    try {
      await syncQontoTransactions(connection);
      await updateSyncStatus(connection.id, 'active');
    } catch (error) {
      await updateSyncStatus(connection.id, 'error', error.message);
    }
  }

  return Response.json({ synced: connections.length });
}
```

### Fetch transactions Qonto

```typescript
async function fetchQontoTransactions(
  connection: QontoConnection,
  since?: Date
): Promise<QontoTransaction[]> {
  const client = new QontoClient({
    login: process.env.QONTO_LOGIN,
    secretKey: process.env.QONTO_SECRET_KEY,
  });

  const transactions = await client.transactions.list({
    bank_account_id: connection.qonto_account_id,
    settled_at_from: since?.toISOString(),
    status: ['completed'],
    includes: ['attachments'],
  });

  return transactions;
}
```

### Mapping Qonto → bank_transactions

```typescript
function mapQontoTransaction(qt: QontoTransaction): BankTransaction {
  return {
    external_id: qt.id,
    reference: qt.reference,
    label: qt.label,
    amount: Math.abs(qt.amount),
    side: qt.side, // 'credit' ou 'debit'
    emitted_at: qt.emitted_at,
    settled_at: qt.settled_at,
    counterparty_name: qt.counterparty_name,
    attachment_count: qt.attachment_ids?.length || 0,
    is_reconciled: false,
  };
}
```

---

## Catégorisation PCG

### Table `pcg_categories`

Plan Comptable Général (PCG) pour catégorisation automatique.

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| code | text | Code PCG (ex: 606, 613) |
| label | text | Libellé catégorie |
| parent_id | uuid | FK parent (hiérarchie) |
| keywords | text[] | Mots-clés auto-matching |

### Auto-catégorisation

```sql
-- Trigger: trigger_auto_classify_transaction
-- Événement: INSERT bank_transactions
-- Action: Tente de catégoriser automatiquement

CREATE OR REPLACE FUNCTION auto_classify_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  matched_category_id uuid;
BEGIN
  -- Rechercher catégorie par mots-clés dans label
  SELECT id INTO matched_category_id
  FROM pcg_categories
  WHERE EXISTS (
    SELECT 1 FROM unnest(keywords) kw
    WHERE NEW.label ILIKE '%' || kw || '%'
  )
  LIMIT 1;

  IF matched_category_id IS NOT NULL THEN
    NEW.pcg_category_id := matched_category_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Catégories courantes

| Code PCG | Label | Mots-clés |
|----------|-------|-----------|
| 606 | Achats non stockés | électricité, gaz, eau |
| 613 | Locations | loyer, bail |
| 616 | Assurances | assurance, axa, maif |
| 622 | Honoraires | comptable, avocat |
| 626 | Frais postaux | la poste, chronopost |
| 627 | Télécommunications | orange, sfr, free |
| 641 | Salaires | paie, salaire |

---

## Rapprochement Bancaire

### Types de rapprochement

| Type | Description | Automatique |
|------|-------------|-------------|
| `invoice` | Rapproché avec facture émise | Oui (par montant) |
| `expense` | Rapproché avec dépense | Oui (par montant) |
| `sales_order` | Rapproché avec commande | Oui (par ref) |
| `manual` | Rapprochement manuel | Non |

### Rapprochement automatique

```typescript
async function autoReconcile(transaction: BankTransaction) {
  const supabase = createServerClient(/* ... */);

  // 1. Chercher facture émise correspondante
  if (transaction.side === 'credit') {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('total_ttc', transaction.amount)
      .eq('status', 'sent')
      .is('paid_at', null)
      .single();

    if (invoice) {
      await reconcileWithInvoice(transaction.id, invoice.id);
      return;
    }
  }

  // 2. Chercher dépense correspondante
  if (transaction.side === 'debit') {
    const { data: expense } = await supabase
      .from('expenses')
      .select('id')
      .eq('amount', transaction.amount)
      .is('reconciled_at', null)
      .single();

    if (expense) {
      await reconcileWithExpense(transaction.id, expense.id);
      return;
    }
  }

  // 3. Pas de match → reste non rapproché
}
```

### Interface rapprochement manuel

```typescript
// Composant de rapprochement
function ReconciliationDialog({ transaction }) {
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleReconcile = async () => {
    await supabase
      .from('bank_transactions')
      .update({
        is_reconciled: true,
        reconciled_with_type: selectedDoc.type,
        reconciled_with_id: selectedDoc.id,
      })
      .eq('id', transaction.id);
  };

  return (
    <Dialog>
      <DialogContent>
        <h2>Rapprocher transaction</h2>
        <DocumentSearch onSelect={setSelectedDoc} />
        <Button onClick={handleReconcile}>Valider</Button>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Facturation

### Workflow facture

```
DRAFT → SENT → PAID
  │       │
  v       v
CANCELLED  OVERDUE (auto si date dépassée)
```

### Numérotation

```typescript
// Format: FAC-YYYY-NNNNN
// Exemple: FAC-2026-00042

async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `FAC-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  const lastNum = data?.[0]?.invoice_number
    ? parseInt(data[0].invoice_number.split('-')[2])
    : 0;

  return `FAC-${year}-${String(lastNum + 1).padStart(5, '0')}`;
}
```

### Création facture depuis commande

```typescript
async function createInvoiceFromOrder(orderId: string) {
  const order = await getOrderWithItems(orderId);

  const invoiceNumber = await generateInvoiceNumber();

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      invoice_number: invoiceNumber,
      sales_order_id: orderId,
      organisation_id: order.organisation_id,
      total_ht: order.total_ht,
      total_vat: order.total_vat,
      total_ttc: order.total_ttc,
      due_date: addDays(new Date(), 30), // Échéance 30 jours
      status: 'draft',
    })
    .select()
    .single();

  // Créer lignes facture
  for (const item of order.items) {
    await supabase.from('invoice_items').insert({
      invoice_id: invoice.id,
      product_id: item.product_id,
      description: item.product_name,
      quantity: item.quantity,
      unit_price_ht: item.unit_price_ht,
      vat_rate: item.vat_rate,
    });
  }

  return invoice;
}
```

---

## Dépenses

### Table `expenses`

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| reference | text | Référence facture fournisseur |
| supplier_id | uuid | FK vers suppliers |
| amount | numeric | Montant TTC |
| amount_ht | numeric | Montant HT |
| vat_amount | numeric | TVA |
| expense_date | date | Date dépense |
| due_date | date | Date échéance |
| pcg_category_id | uuid | Catégorie PCG |
| status | enum | 'pending', 'paid', 'cancelled' |
| reconciled_at | timestamptz | Date rapprochement |

### Auto-classification dépenses

```sql
-- Trigger: trg_expense_auto_classify
-- Événement: INSERT expenses
-- Action: Catégorise selon fournisseur

CREATE OR REPLACE FUNCTION expense_auto_classify()
RETURNS TRIGGER AS $$
BEGIN
  -- Récupérer catégorie par défaut du fournisseur
  SELECT default_pcg_category_id INTO NEW.pcg_category_id
  FROM suppliers
  WHERE id = NEW.supplier_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Tableau de Bord Trésorerie

### KPIs principaux

| KPI | Calcul | Description |
|-----|--------|-------------|
| Solde actuel | SUM(bank_accounts.balance) | Trésorerie disponible |
| Encaissements M | SUM(credits ce mois) | Entrées mois en cours |
| Décaissements M | SUM(debits ce mois) | Sorties mois en cours |
| Non rapproché | COUNT(is_reconciled=false) | Transactions à traiter |
| Factures dues | SUM(invoices.overdue) | CA à encaisser |

### Prévisionnel trésorerie

```typescript
interface TreasuryForecast {
  date: Date;
  balance: number;
  inflows: number;  // Encaissements prévus
  outflows: number; // Décaissements prévus
}

async function getForecast(days: number): Promise<TreasuryForecast[]> {
  const forecast: TreasuryForecast[] = [];
  let balance = await getCurrentBalance();

  for (let i = 0; i < days; i++) {
    const date = addDays(new Date(), i);

    // Encaissements prévus (factures échues)
    const inflows = await getExpectedInflows(date);

    // Décaissements prévus (dépenses échues)
    const outflows = await getExpectedOutflows(date);

    balance = balance + inflows - outflows;

    forecast.push({ date, balance, inflows, outflows });
  }

  return forecast;
}
```

---

## Règles Métier

### Factures

1. **Numérotation séquentielle**: Obligatoire, sans trou
2. **Échéance par défaut**: 30 jours
3. **Relance automatique**: J+7, J+15, J+30 après échéance
4. **Statut overdue**: Automatique si date dépassée et non payée

### Transactions

1. **Déduplication**: Via `external_id` Qonto
2. **Catégorisation**: Automatique si mots-clés matchent
3. **Rapprochement**: Suggéré si montant exact trouvé
4. **Justificatif**: Obligatoire pour dépenses > 150€

### Qonto

1. **Sync**: Minimum toutes les 4h
2. **Retry**: 3 tentatives si erreur
3. **Alerte**: Si sync échoue > 24h
4. **Rate limit**: Max 100 req/min

---

## Sécurité

### Chiffrement clés API

```typescript
// Chiffrement AES-256 pour stockage clés Qonto
import { createCipheriv, createDecipheriv } from 'crypto';

const ENCRYPTION_KEY = process.env.QONTO_ENCRYPTION_KEY!;

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decryptApiKey(ciphertext: string): string {
  const [ivHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### RLS Policies

```sql
-- Seuls les admins finance peuvent voir les transactions
CREATE POLICY "finance_transactions_select"
ON bank_transactions FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'finance_admin'
  )
);
```

---

## Fichiers de référence

| Type | Chemin |
|------|--------|
| Types | `packages/@verone/types/src/finance.ts` |
| Hooks | `packages/@verone/finance/src/hooks/` |
| Composants | `apps/back-office/src/components/finance/` |
| API Qonto | `apps/back-office/app/api/qonto/` |
| Cron sync | `apps/back-office/app/api/cron/qonto-sync/` |
| Migrations | `supabase/migrations/*_bank_*.sql` |

---

## Monitoring

### Métriques clés

| Métrique | Description | Alerte si |
|----------|-------------|-----------|
| `qonto.sync.last_success` | Dernière sync réussie | > 24h |
| `transactions.unreconciled` | Non rapprochées | > 50 |
| `invoices.overdue.amount` | Montant factures échues | > 10000€ |
| `treasury.forecast.negative` | Prévision négative J+30 | true |

---

**Changelog**:
- 2026-01-23: Création documentation module
- Source: Intégration Qonto 2025-12, audit finance 2026-01
