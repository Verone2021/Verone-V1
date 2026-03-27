# AUDIT COMPLET - Module Facturation Qonto

**Date**: 2026-01-09
**Version**: 1.0.0
**Auteur**: Audit automatique Claude Code
**Status**: PRODUCTION

---

## 1. RESUME EXECUTIF

### Scope

| Document  | API Qonto                     | Status |
| --------- | ----------------------------- | ------ |
| Factures  | `/v2/client_invoices`         | ACTIF  |
| Devis     | `/v2/quotes`                  | ACTIF  |
| Avoirs    | `/v2/credit_notes`            | ACTIF  |
| PDFs      | Tous documents                | ACTIF  |
| Paiements | Mark as paid + Reconciliation | ACTIF  |

### Architecture

- **Source de verite**: 100% API Qonto (pas de duplication en BD locale)
- **Client HTTP**: `@verone/integrations/src/qonto/client.ts`
- **39 routes API** dans `apps/back-office/src/app/api/qonto/`

### Regles Absolues

1. **JAMAIS** finaliser automatiquement une facture
2. **TOUJOURS** creer en brouillon (`autoFinalize: false`)
3. **SEUL L'UTILISATEUR** peut finaliser via l'UI
4. Finalisation = **IRREVERSIBLE**
5. Numero de facture = **SEQUENTIEL LEGAL** (brule si utilise)

---

## 2. ARCHITECTURE TECHNIQUE

### 2.1 Arborescence des fichiers critiques

```
packages/@verone/integrations/src/qonto/
├── client.ts          # Client HTTP principal (1606 lignes) [CRITIQUE]
├── types.ts           # Types TypeScript Qonto
├── errors.ts          # Gestion erreurs QontoError
└── index.ts           # Exports

apps/back-office/src/app/api/qonto/
├── invoices/
│   ├── route.ts                    # GET/POST factures
│   ├── service/route.ts            # Factures service
│   └── [id]/
│       ├── route.ts                # GET/PATCH/DELETE facture
│       ├── pdf/route.ts            # GET PDF [CRITIQUE]
│       ├── finalize/route.ts       # POST finalisation
│       ├── mark-paid/route.ts      # POST marquer payee
│       ├── reconcile/route.ts      # POST rapprochement
│       ├── send/route.ts           # POST envoi email
│       ├── cancel/route.ts         # POST annulation
│       └── delete/route.ts         # DELETE brouillon
├── quotes/
│   ├── route.ts                    # GET/POST devis
│   ├── service/route.ts            # Devis service
│   └── [id]/
│       ├── route.ts                # GET/PATCH/DELETE
│       ├── pdf/route.ts            # GET PDF
│       ├── finalize/route.ts       # POST finalisation (= send)
│       ├── convert/route.ts        # POST → facture
│       ├── accept/route.ts         # POST accepter
│       └── decline/route.ts        # POST refuser
├── credit-notes/
│   ├── route.ts                    # GET/POST avoirs
│   └── [id]/
│       ├── route.ts                # GET/PATCH/DELETE
│       ├── pdf/route.ts            # GET PDF
│       ├── finalize/route.ts       # POST finalisation
│       └── send/route.ts           # POST envoi
└── attachments/
    ├── upload/route.ts             # Upload pieces jointes
    └── cleanup-duplicates/route.ts # Nettoyage doublons

packages/@verone/finance/src/components/
├── InvoiceCreateFromOrderModal.tsx # Creation facture depuis commande
├── InvoiceCreateServiceModal.tsx   # Creation facture service
├── QuoteCreateFromOrderModal.tsx   # Creation devis depuis commande
├── QuoteCreateServiceModal.tsx     # Creation devis service
├── CreditNoteCreateModal.tsx       # Creation avoir
├── PaymentRecordModal.tsx          # Enregistrement paiement
├── ReconcileTransactionModal.tsx   # Rapprochement bancaire
└── OrderSelectModal.tsx            # Selection commande
```

### 2.2 Flux de donnees

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  UI Components  │────▶│  API Routes      │────▶│  Qonto API      │
│  (Modales)      │     │  /api/qonto/*    │     │  thirdparty.    │
│                 │◀────│                  │◀────│  qonto.com      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  QontoClient     │
                        │  (client.ts)     │
                        │  - Retry logic   │
                        │  - Auth handling │
                        │  - Error mapping │
                        └──────────────────┘
```

---

## 3. RECUPERATION PDFs [SECTION CRITIQUE]

### 3.1 Endpoint Principal

**Route**: `GET /api/qonto/invoices/[id]/pdf`
**Fichier**: `apps/back-office/src/app/api/qonto/invoices/[id]/pdf/route.ts`

### 3.2 Code Complet de la Route PDF Factures

```typescript
/**
 * API Route: GET /api/qonto/invoices/[id]/pdf
 * Telecharge le PDF de la facture depuis Qonto
 *
 * Utilise pdf_url en priorite,
 * avec fallback sur attachment_id si necessaire.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') || 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getQontoClient();

    // Recuperer la facture pour obtenir le pdf_url
    const invoice = await client.getClientInvoiceById(id);

    // DEBUG: Logger les champs disponibles pour le PDF
    console.log('[API Qonto Invoice PDF] Invoice data:', {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      status: invoice.status,
      pdf_url: invoice.pdf_url,
      public_url: invoice.public_url,
      attachment_id: invoice.attachment_id,
    });

    // Determiner l'URL du PDF (priorite: pdf_url > attachment_id)
    let pdfUrl: string | undefined = invoice.pdf_url;

    // Si pas de pdf_url, essayer avec attachment_id
    if (!pdfUrl && invoice.attachment_id) {
      console.log(
        '[API Qonto Invoice PDF] No pdf_url, trying attachment_id:',
        invoice.attachment_id
      );
      try {
        const attachment = await client.getAttachment(invoice.attachment_id);
        console.log('[API Qonto Invoice PDF] Attachment response:', attachment);
        pdfUrl = attachment.url;
      } catch (attachmentError) {
        console.error(
          '[API Qonto Invoice PDF] Attachment fetch failed:',
          attachmentError
        );
      }
    }

    // Si toujours pas d'URL, erreur
    if (!pdfUrl) {
      console.error(
        '[API Qonto Invoice PDF] No PDF URL found for invoice:',
        id
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'PDF non disponible. La facture doit etre finalisee pour generer un PDF.',
        },
        { status: 404 }
      );
    }

    console.log('[API Qonto Invoice PDF] Fetching PDF from:', pdfUrl);

    // Telecharger le PDF depuis Qonto
    const pdfResponse = await fetch(pdfUrl);

    console.log(
      '[API Qonto Invoice PDF] PDF response status:',
      pdfResponse.status
    );

    if (!pdfResponse.ok) {
      console.error(
        '[API Qonto Invoice PDF] Failed to fetch PDF:',
        pdfResponse.status,
        pdfResponse.statusText
      );
      return NextResponse.json(
        {
          success: false,
          error: `Echec du telechargement du PDF: ${pdfResponse.status} ${pdfResponse.statusText}`,
        },
        { status: 500 }
      );
    }

    const pdfBuffer = await pdfResponse.arrayBuffer();

    console.log(
      '[API Qonto Invoice PDF] PDF buffer size:',
      pdfBuffer.byteLength
    );

    // Verifier que le PDF n'est pas vide
    if (pdfBuffer.byteLength === 0) {
      console.error('[API Qonto Invoice PDF] PDF buffer is empty!');
      return NextResponse.json(
        {
          success: false,
          error: 'Le PDF telecharge est vide',
        },
        { status: 500 }
      );
    }

    // Retourner le PDF avec les bons headers pour VISUALISATION (inline)
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="facture-${invoice.invoice_number ?? id}.pdf"`,
        'Content-Length': String(pdfBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error('[API Qonto Invoice PDF] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### 3.3 Logique de Fallback PDF

```
1. Recuperer la facture via client.getClientInvoiceById(id)
2. Priorite 1: Utiliser invoice.pdf_url (URL directe Qonto)
3. Priorite 2: Si pas de pdf_url, utiliser invoice.attachment_id
   → Appeler client.getAttachment(attachment_id)
   → Recuperer attachment.url (valide 30 min)
4. Si aucun: Erreur 404 "PDF non disponible"
5. Telecharger le PDF via fetch(pdfUrl)
6. Verifier que le buffer n'est pas vide
7. Retourner avec Content-Type: application/pdf
```

### 3.4 Points critiques PDF

| Point                   | Detail                                                        |
| ----------------------- | ------------------------------------------------------------- |
| **pdf_url**             | Disponible uniquement APRES finalisation                      |
| **attachment_id**       | Fallback si pdf_url indisponible                              |
| **URL temporaire**      | L'URL attachment est valide 30 minutes                        |
| **Content-Disposition** | `inline` pour visualisation, `attachment` pour telechargement |

---

## 4. REGLES METIER ABSOLUES

### 4.1 Regle #1: JAMAIS auto-finaliser

```typescript
// BON - Defaut: brouillon
const { salesOrderId, autoFinalize = false, fees, customLines } = body;

// INTERDIT EN PRODUCTION AUTOMATIQUE
await client.finalizeClientInvoice(invoiceId); // NON!
```

**Raison**: Suite a un incident le 7 janvier 2026, une facture test a ete finalisee par erreur avec une TVA incorrecte. Impossible a supprimer, numero de facture "brule" definitivement.

### 4.2 Regle #2: Statuts Irreversibles

```
┌─────────┐     ┌───────────┐     ┌──────────┐
│  draft  │────▶│ finalized │────▶│   paid   │
└─────────┘     └───────────┘     └──────────┘
     │                │
     │                ▼
     │         ┌───────────┐
     │         │ cancelled │
     │         └───────────┘
     ▼
┌─────────┐
│ deleted │ (brouillon uniquement)
└─────────┘
```

### 4.3 Regle #3: Numerotation Sequentielle Legale

- Un numero de facture est **LEGALEMENT SEQUENTIEL**
- Un numero utilise ne peut **JAMAIS** etre reutilise
- Une facture finalisee entre dans la **comptabilite officielle**
- Toute erreur sur une facture finalisee necessite un **avoir**

### 4.4 Regle #4: Validation Humaine Obligatoire

```
UI → "Finaliser" → Dialog CONFIRMATION → "Cette action est IRREVERSIBLE"
                                      → Bouton "Je comprends, finaliser"
                                      → API /finalize
```

---

## 5. CREATION DE FACTURES

### 5.1 Facture depuis Commande

**Route**: `POST /api/qonto/invoices`
**Fichier**: `apps/back-office/src/app/api/qonto/invoices/route.ts`

### 5.2 Code Complet Creation Facture

```typescript
/**
 * POST /api/qonto/invoices
 * Cree une facture depuis une commande client
 *
 * Body:
 * - salesOrderId: UUID de la commande
 * - autoFinalize: boolean (defaut: false) ← JAMAIS true en auto
 * - fees: { shipping_cost_ht, handling_cost_ht, insurance_cost_ht }
 * - customLines: [{ title, description, quantity, unit_price_ht, vat_rate }]
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { salesOrderId, autoFinalize = false, fees, customLines } = body;

    if (!salesOrderId) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId is required' },
        { status: 400 }
      );
    }

    // Recuperer la commande avec ses lignes
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select(
        `
        *,
        sales_order_items (
          *,
          products:product_id (id, name, sku)
        )
      `
      )
      .eq('id', salesOrderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Fetch manuel du customer (pattern polymorphique)
    let customer = null;
    if (order.customer_id && order.customer_type) {
      if (order.customer_type === 'organisation') {
        const { data: org } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', order.customer_id)
          .single();
        customer = org;
      } else if (order.customer_type === 'individual') {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select('*')
          .eq('id', order.customer_id)
          .single();
        customer = indiv;
      }
    }

    const qontoClient = getQontoClient();

    // Creer/mettre a jour le client Qonto
    let qontoClientId: string;
    // ... (logique de creation client)

    // Mapper les lignes de commande vers items facture
    const items = order.sales_order_items.map(item => ({
      title: item.products?.name ?? 'Article',
      description: item.notes ?? undefined,
      quantity: String(item.quantity ?? 1),
      unit: 'piece',
      unitPrice: {
        value: String(item.unit_price_ht ?? 0),
        currency: 'EUR',
      },
      vatRate: String(item.tax_rate ?? 0.2), // Decimal (0.2 = 20%)
    }));

    // Ajouter frais de livraison, manutention, assurance
    if (fees?.shipping_cost_ht > 0) {
      items.push({
        title: 'Frais de livraison',
        quantity: '1',
        unit: 'forfait',
        unitPrice: { value: String(fees.shipping_cost_ht), currency: 'EUR' },
        vatRate: String(fees.fees_vat_rate ?? 0.2),
      });
    }

    // Ajouter lignes personnalisees
    if (customLines?.length > 0) {
      for (const line of customLines) {
        items.push({
          title: line.title,
          description: line.description,
          quantity: String(line.quantity),
          unit: 'piece',
          unitPrice: { value: String(line.unit_price_ht), currency: 'EUR' },
          vatRate: String(line.vat_rate),
        });
      }
    }

    // Creer la facture (TOUJOURS en brouillon)
    const invoice = await qontoClient.createClientInvoice({
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      dueDate,
      paymentMethods: { iban: mainAccount.iban },
      purchaseOrderNumber: order.order_number,
      items,
    });

    // Finaliser SEULEMENT si explicitement demande (jamais en auto)
    let finalizedInvoice = invoice;
    if (autoFinalize && invoice.status === 'draft') {
      finalizedInvoice = await qontoClient.finalizeClientInvoice(invoice.id);
    }

    return NextResponse.json({
      success: true,
      invoice: finalizedInvoice,
      message: autoFinalize
        ? 'Invoice created and finalized'
        : 'Invoice created as draft',
    });
  } catch (error) {
    // Error handling...
  }
}
```

### 5.3 Structure Item Qonto

```typescript
interface QontoInvoiceItem {
  title: string; // Nom du produit/service
  description?: string; // Description optionnelle
  quantity: string; // "1", "2.5", etc. (string!)
  unit: string; // "piece", "forfait", "heure", "jour"
  unitPrice: {
    value: string; // "100.00" (string!)
    currency: string; // "EUR"
  };
  vatRate: string; // "0.2" = 20% (string decimal!)
}
```

---

## 6. PAIEMENTS ET RAPPROCHEMENT BANCAIRE

### 6.1 Marquer une Facture Payee

**Route**: `POST /api/qonto/invoices/[id]/mark-paid`

```typescript
export async function POST(request, { params }) {
  const { id } = await params;
  const client = getQontoClient();

  // Verifier statut
  const invoice = await client.getClientInvoiceById(id);

  if (invoice.status === 'draft') {
    return NextResponse.json(
      {
        error: 'Impossible de marquer une facture brouillon comme payee',
      },
      { status: 400 }
    );
  }

  if (invoice.status === 'paid') {
    return NextResponse.json(
      {
        error: 'Cette facture est deja marquee comme payee',
      },
      { status: 400 }
    );
  }

  if (invoice.status === 'cancelled') {
    return NextResponse.json(
      {
        error: 'Impossible de marquer une facture annulee comme payee',
      },
      { status: 400 }
    );
  }

  // Marquer comme payee
  const updatedInvoice = await client.markClientInvoiceAsPaid(id);

  return NextResponse.json({
    success: true,
    invoice: updatedInvoice,
    message: 'Facture marquee comme payee',
  });
}
```

### 6.2 Rapprochement Bancaire

**Route**: `POST /api/qonto/invoices/[id]/reconcile`

```typescript
export async function POST(request, { params }) {
  const { id } = await params;
  const { transactionId } = await request.json();

  if (!transactionId) {
    return NextResponse.json(
      {
        error: 'transactionId est requis',
      },
      { status: 400 }
    );
  }

  const client = getQontoClient();

  // 1. Verifier la facture
  const invoice = await client.getClientInvoiceById(id);

  if (invoice.status === 'draft') {
    return NextResponse.json(
      {
        error: "Facture brouillon. Finalisez-la d'abord.",
      },
      { status: 400 }
    );
  }

  // 2. Verifier la transaction (credit uniquement)
  const transaction = await client.getTransactionById(transactionId);

  if (transaction.side !== 'credit') {
    return NextResponse.json(
      {
        error: 'Seules les transactions entrantes (credit) sont acceptees',
      },
      { status: 400 }
    );
  }

  // 3. Marquer facture payee
  const updatedInvoice = await client.markClientInvoiceAsPaid(id);

  return NextResponse.json({
    success: true,
    invoice: updatedInvoice,
    transaction: {
      id: transaction.transaction_id,
      amount: transaction.amount,
      label: transaction.label,
    },
    message: `Facture rapprochee avec la transaction`,
  });
}
```

---

## 7. CLIENT QONTO [CODE COMPLET CRITIQUE]

### 7.1 Initialisation et Authentification

```typescript
export class QontoClient {
  private config: QontoConfig;
  private baseUrl: string;
  private authMode: QontoAuthMode;

  constructor(config?: Partial<QontoConfig>) {
    // Determiner le mode d'auth
    this.authMode = config?.authMode || resolveAuthMode();

    this.config = {
      authMode: this.authMode,
      organizationId:
        config?.organizationId || process.env.QONTO_ORGANIZATION_ID,
      apiKey: config?.apiKey || process.env.QONTO_API_KEY,
      accessToken: config?.accessToken || process.env.QONTO_ACCESS_TOKEN,
      refreshToken: config?.refreshToken || process.env.QONTO_REFRESH_TOKEN,
      baseUrl: config?.baseUrl || 'https://thirdparty.qonto.com',
      timeout: config?.timeout || 30000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
    };

    this.baseUrl = this.config.baseUrl;
    this.validateCredentials();
  }

  /**
   * GUARDRAIL: Detecter conflit de configuration
   */
  private resolveAuthMode(): QontoAuthMode {
    const hasOAuthToken = !!process.env.QONTO_ACCESS_TOKEN;
    const hasApiKey =
      !!process.env.QONTO_ORGANIZATION_ID && !!process.env.QONTO_API_KEY;

    // ERREUR si les deux modes sont configures sans mode explicite
    if (hasOAuthToken && hasApiKey && !process.env.QONTO_AUTH_MODE) {
      throw new QontoError(
        'AUTH CONFLICT: Both OAuth and API Key configured. ' +
          'Set QONTO_AUTH_MODE=oauth OR QONTO_AUTH_MODE=api_key explicitly.',
        'AUTH_CONFIG_CONFLICT',
        0
      );
    }

    if (hasOAuthToken) return 'oauth';
    if (hasApiKey) return 'api_key';
    return 'oauth';
  }

  /**
   * Header Authorization selon le mode
   */
  private getAuthHeader(): string {
    if (this.authMode === 'oauth') {
      return `Bearer ${this.config.accessToken}`;
    }
    // api_key mode: orgId:apiKey
    return `${this.config.organizationId}:${this.config.apiKey}`;
  }
}
```

### 7.2 Methodes Factures

```typescript
// Creer une facture (TOUJOURS draft par defaut)
async createClientInvoice(params: CreateClientInvoiceParams): Promise<QontoClientInvoice> {
  const key = generateIdempotencyKey();
  const response = await this.requestWithIdempotency(
    'POST', '/v2/client_invoices',
    {
      client_id: params.clientId,
      currency: params.currency || 'EUR',
      issue_date: params.issueDate,
      due_date: params.dueDate,
      purchase_order_number: params.purchaseOrderNumber,
      header: params.header,
      footer: params.footer,
      payment_methods: params.paymentMethods ? {
        iban: params.paymentMethods.iban,
      } : undefined,
      items: params.items.map(item => ({
        title: item.title,
        description: item.description,
        quantity: String(item.quantity),
        unit: item.unit || 'unit',
        unit_price: {
          value: String(item.unitPrice.value),
          currency: item.unitPrice.currency,
        },
        vat_rate: String(item.vatRate),
      })),
    },
    key
  );
  return response.client_invoice;
}

// Finaliser une facture (IRREVERSIBLE)
async finalizeClientInvoice(invoiceId: string): Promise<QontoClientInvoice> {
  const response = await this.request(
    'POST', `/v2/client_invoices/${invoiceId}/finalize`
  );
  return response.client_invoice;
}

// Marquer comme payee
async markClientInvoiceAsPaid(invoiceId: string): Promise<QontoClientInvoice> {
  const response = await this.request(
    'POST', `/v2/client_invoices/${invoiceId}/mark_as_paid`
  );
  return response.client_invoice;
}

// Annuler une facture (unpaid → canceled)
async cancelClientInvoice(invoiceId: string): Promise<QontoClientInvoice> {
  const response = await this.request(
    'POST', `/v2/client_invoices/${invoiceId}/mark_as_canceled`
  );
  return response.client_invoice;
}

// Supprimer un brouillon
async deleteClientInvoice(invoiceId: string): Promise<void> {
  await this.request('DELETE', `/v2/client_invoices/${invoiceId}`);
}
```

### 7.3 Methodes Attachments (PDF Fallback)

```typescript
/**
 * Recupere les informations d'un attachment
 * Retourne une URL temporaire (valide 30 min)
 */
async getAttachment(attachmentId: string): Promise<{
  id: string;
  file_name: string;
  file_size: number;
  file_content_type: string;
  url: string;
  created_at: string;
}> {
  const response = await this.request(
    'GET', `/v2/attachments/${attachmentId}`
  );
  return response.attachment;
}

/**
 * Upload piece jointe sur une transaction
 */
async uploadAttachmentToTransaction(
  transactionId: string,
  file: Blob | File,
  filename: string,
  idempotencyKey?: string
): Promise<QontoAttachment> {
  const key = idempotencyKey || generateIdempotencyKey();
  const formData = new FormData();
  formData.append('file', file, filename);

  const url = `${this.baseUrl}/v2/transactions/${transactionId}/attachments`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: this.getAuthHeader(),
      'X-Qonto-Idempotency-Key': key,
    },
    body: formData,
  });

  // Gestion du cas 204 No Content
  if (response.status === 204 || !responseText) {
    const attachments = await this.getTransactionAttachments(transactionId);
    return attachments[attachments.length - 1];
  }

  return data.attachment;
}
```

---

## 8. DEVIS ET AVOIRS

### 8.1 Conversion Devis → Facture

```typescript
/**
 * Convertit un devis en facture
 * Le devis doit etre finalise pour etre converti
 * IMPORTANT: La facture creee est en brouillon (draft)
 */
async convertQuoteToInvoice(quoteId: string): Promise<QontoClientInvoice> {
  const response = await this.request(
    'POST', `/v2/quotes/${quoteId}/convert_to_invoice`
  );
  return response.client_invoice; // status: 'draft'
}
```

### 8.2 Creation Avoir depuis Facture

```typescript
/**
 * Cree un nouvel avoir client
 * IMPORTANT: Toujours cree en brouillon (draft)
 */
async createClientCreditNote(
  params: CreateClientCreditNoteParams,
  idempotencyKey?: string
): Promise<QontoClientCreditNote> {
  const key = idempotencyKey || generateIdempotencyKey();

  const response = await this.requestWithIdempotency(
    'POST', '/v2/credit_notes',
    {
      client_id: params.clientId,
      currency: params.currency || 'EUR',
      issue_date: params.issueDate,
      invoice_id: params.invoiceId,  // Reference facture originale
      reason: params.reason,
      items: params.items.map(item => ({
        title: item.title,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'unit',
        unit_price: {
          value: item.unitPrice.value,
          currency: item.unitPrice.currency,
        },
        vat_rate: item.vatRate,
      })),
    },
    key
  );

  return response.credit_note;
}
```

---

## 9. CONFIGURATION AUTHENTIFICATION

### 9.1 Variables d'Environnement

```bash
# Mode d'authentification (oauth | api_key)
QONTO_AUTH_MODE=api_key

# Credentials API Key
QONTO_ORGANIZATION_ID=qonto_org_xxx
QONTO_API_KEY=sk_live_xxx

# Credentials OAuth (alternative)
QONTO_ACCESS_TOKEN=xxx
QONTO_REFRESH_TOKEN=xxx

# Endpoint (defaut: https://thirdparty.qonto.com)
QONTO_API_BASE_URL=https://thirdparty.qonto.com
```

### 9.2 GUARDRAIL Conflit Auth

Si les deux modes sont configures sans `QONTO_AUTH_MODE` explicite:

```
Error: AUTH CONFLICT: Both OAuth and API Key configured.
Set QONTO_AUTH_MODE=oauth OR QONTO_AUTH_MODE=api_key explicitly.
```

---

## 10. TROUBLESHOOTING

### 10.1 Erreurs Courantes

| Erreur                 | Cause                   | Solution                |
| ---------------------- | ----------------------- | ----------------------- |
| "PDF non disponible"   | Facture en brouillon    | Finaliser la facture    |
| "AUTH_CONFIG_CONFLICT" | 2 modes auth configures | Definir QONTO_AUTH_MODE |
| "Invalid credentials"  | Cles API invalides      | Verifier .env           |
| "Rate limit exceeded"  | Trop de requetes        | Attendre, retry auto    |
| "Facture deja payee"   | Double marquage         | Ignorer                 |

### 10.2 Logs Recommandes

```typescript
// Activer pour debug PDF
console.log('[API Qonto Invoice PDF] Invoice data:', {
  id,
  invoice_number,
  status,
  pdf_url,
  public_url,
  attachment_id,
});

console.log('[API Qonto Invoice PDF] Fetching PDF from:', pdfUrl);
console.log('[API Qonto Invoice PDF] PDF buffer size:', pdfBuffer.byteLength);
```

---

## 11. FICHIERS PROTEGES - NE JAMAIS MODIFIER

| Fichier                                                              | Raison                                   |
| -------------------------------------------------------------------- | ---------------------------------------- |
| `packages/@verone/integrations/src/qonto/client.ts`                  | Coeur du systeme, retry logic, auth      |
| `apps/back-office/src/app/api/qonto/invoices/[id]/pdf/route.ts`      | Recuperation PDF critique                |
| `apps/back-office/src/app/api/qonto/invoices/route.ts`               | Creation factures, `autoFinalize: false` |
| `apps/back-office/src/app/api/qonto/invoices/[id]/finalize/route.ts` | Finalisation irreversible                |

**Si modification necessaire**: Creer une copie de sauvegarde AVANT.

---

## 12. TESTS DE NON-REGRESSION

### Checklist avant deploiement

- [ ] Creer une facture → status = 'draft'
- [ ] Finaliser la facture → status = 'unpaid' ou 'finalized'
- [ ] Telecharger le PDF → Buffer non vide
- [ ] Marquer comme payee → status = 'paid'
- [ ] Creer un avoir → status = 'draft'
- [ ] Creer un devis → status = 'draft'
- [ ] Convertir devis → facture en draft

### Scenarios critiques

1. **Test PDF**: Creer facture → Finaliser → GET /pdf → Verifier Content-Type
2. **Test Brouillon**: Creer facture → Verifier autoFinalize = false par defaut
3. **Test Rapprochement**: Facture finalisee + Transaction credit → Reconcile

---

## 13. HISTORIQUE DES INCIDENTS

### Incident 2026-01-07 - Facture finalisee par erreur

- **Cause**: Test automatique avec `autoFinalize: true`
- **Impact**: Facture F-2026-001 avec TVA incorrecte (0.2% au lieu de 20%)
- **Resolution**: Impossible a supprimer, numero brule
- **Action**: Defaut `autoFinalize = false` dans tout le code

---

## 14. CONTACTS ET RESSOURCES

### Documentation Qonto

- API Reference: https://api-doc.qonto.com/
- Webhooks: https://api-doc.qonto.com/docs/business-api/webhooks

### Support

- Email: api-support@qonto.com
- Chat: App Qonto (en bas a droite)

---

_Rapport genere automatiquement - Version 1.0.0 - 2026-01-09_
_Ce document est la source de verite pour le module facturation_
