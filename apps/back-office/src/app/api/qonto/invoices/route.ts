/**
 * API Route: /api/qonto/invoices
 * Gestion des factures clients via Qonto API
 *
 * GET  - Liste les factures (query params: status)
 * POST - Crée une facture depuis une commande
 *
 * Security:
 * - Rate limited (60 req/min)
 * - Input validation with Zod
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { QontoClient } from '@verone/integrations/qonto';
import type { CreateClientInvoiceParams } from '@verone/integrations/qonto';
import type { Database, Json } from '@verone/types';
import { withRateLimit, RATE_LIMIT_PRESETS } from '@verone/utils/security';
import { createAdminClient } from '@verone/utils/supabase/server';

type SalesOrder = Database['public']['Tables']['sales_orders']['Row'];
type Organisation = Database['public']['Tables']['organisations']['Row'];
type IndividualCustomer =
  Database['public']['Tables']['individual_customers']['Row'];

// Interface pour la commande avec items (relations polymorphiques gérées manuellement)
interface ISalesOrderWithItems extends SalesOrder {
  sales_order_items: Array<{
    id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate: number | null;
    notes: string | null;
    products: { id: string; name: string; sku: string | null } | null;
  }>;
}

// Interface enrichie avec customer (après fetch manuel)
interface ISalesOrderWithCustomer extends ISalesOrderWithItems {
  customer: Organisation | IndividualCustomer | null;
}

function getQontoClient(): QontoClient {
  return new QontoClient({
    authMode: (process.env.QONTO_AUTH_MODE as 'oauth' | 'api_key') ?? 'oauth',
    organizationId: process.env.QONTO_ORGANIZATION_ID,
    apiKey: process.env.QONTO_API_KEY,
    accessToken: process.env.QONTO_ACCESS_TOKEN,
  });
}

/**
 * GET /api/qonto/invoices
 * Liste les factures avec filtre optionnel par status
 * Enrichit les factures Qonto avec les données locales (workflow_status, local_pdf_path)
 */
export async function GET(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    invoices?: unknown[];
    count?: number;
    meta?: unknown;
    error?: string;
  }>
> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as
      | 'draft'
      | 'unpaid'
      | 'paid'
      | 'overdue'
      | 'cancelled'
      | null;

    const client = getQontoClient();
    const result = await client.getClientInvoices(
      status ? { status } : undefined
    );

    // Enrichir avec les données locales de financial_documents
    const supabase = createAdminClient();
    const qontoInvoiceIds = result.client_invoices.map(
      (inv: { id: string }) => inv.id
    );

    // Type pour les données locales enrichies
    interface ILocalDocData {
      workflow_status: string | null;
      local_pdf_path: string | null;
      local_document_id: string;
      deleted_at: string | null;
    }

    let localDataMap: Record<string, ILocalDocData> = {};

    if (qontoInvoiceIds.length > 0) {
      // Note: local_pdf_path sera disponible après migration 20260122_005
      const { data: localDocs } = await supabase
        .from('financial_documents')
        .select('id, qonto_invoice_id, workflow_status, deleted_at')
        .in('qonto_invoice_id', qontoInvoiceIds);

      if (localDocs) {
        // Cast pour accéder aux colonnes (certaines ajoutées par migration)
        type DocWithExtras = {
          id: string;
          qonto_invoice_id: string | null;
          workflow_status: string | null;
          local_pdf_path?: string | null;
          deleted_at: string | null;
        };

        localDataMap = (localDocs as DocWithExtras[]).reduce(
          (acc, doc) => {
            if (doc.qonto_invoice_id) {
              acc[doc.qonto_invoice_id] = {
                workflow_status: doc.workflow_status,
                local_pdf_path: doc.local_pdf_path ?? null,
                local_document_id: doc.id,
                deleted_at: doc.deleted_at,
              };
            }
            return acc;
          },
          {} as Record<string, ILocalDocData>
        );
      }
    }

    // Fusionner les données
    const enrichedInvoices = result.client_invoices.map(
      (invoice: { id: string }) => ({
        ...invoice,
        // Données locales
        workflow_status: localDataMap[invoice.id]?.workflow_status ?? null,
        local_pdf_path: localDataMap[invoice.id]?.local_pdf_path ?? null,
        local_document_id: localDataMap[invoice.id]?.local_document_id ?? null,
        has_local_pdf: !!localDataMap[invoice.id]?.local_pdf_path,
        deleted_at: localDataMap[invoice.id]?.deleted_at ?? null,
      })
    );

    return NextResponse.json({
      success: true,
      invoices: enrichedInvoices,
      count: enrichedInvoices.length,
      meta: result.meta,
    });
  } catch (error) {
    console.error('[API Qonto Invoices] GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Interface pour les frais de service
 */
interface IFeesData {
  shipping_cost_ht?: number;
  handling_cost_ht?: number;
  insurance_cost_ht?: number;
  fees_vat_rate?: number;
}

/**
 * Interface pour les lignes personnalisées
 */
interface ICustomLine {
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

/**
 * Interface pour les adresses envoyées depuis le modal
 */
interface IAddressData {
  address_line1?: string;
  address_line2?: string;
  postal_code: string;
  city: string;
  country?: string;
}

interface _IPostRequestBody {
  salesOrderId: string;
  autoFinalize?: boolean;
  issueDate?: string;
  label?: string;
  billingAddress?: IAddressData;
  shippingAddress?: IAddressData;
  fees?: IFeesData;
  customLines?: ICustomLine[];
}

/**
 * POST /api/qonto/invoices
 * Crée une facture depuis une commande client
 *
 * Body:
 * - salesOrderId: UUID de la commande
 * - autoFinalize: boolean (défaut: false)
 * - fees: optional fee overrides
 * - customLines: optional additional invoice lines
 */
export async function POST(request: NextRequest): Promise<
  NextResponse<{
    success: boolean;
    invoice?: unknown;
    message?: string;
    error?: string;
  }>
> {
  // Rate limiting
  const rateLimitResult = withRateLimit(request, RATE_LIMIT_PRESETS.api);
  if (!rateLimitResult.success) {
    return rateLimitResult.response as NextResponse<{
      success: boolean;
      error?: string;
    }>;
  }

  try {
    // Parse request body (simple validation, no DOMPurify to avoid ERR_REQUIRE_ESM)
    const body = (await request.json()) as {
      salesOrderId: string;
      autoFinalize?: boolean;
      issueDate?: string;
      label?: string;
      billingAddress?: IAddressData;
      shippingAddress?: IAddressData;
      fees?: IFeesData;
      customLines?: ICustomLine[];
    };

    const {
      salesOrderId,
      autoFinalize = false,
      issueDate: customIssueDate,
      label,
      billingAddress: bodyBillingAddress,
      shippingAddress: bodyShippingAddress,
      fees,
      customLines,
    } = body;

    // Basic validation
    if (!salesOrderId) {
      return NextResponse.json(
        { success: false, error: 'salesOrderId is required' },
        { status: 400 }
      );
    }

    // Utilise createAdminClient pour bypasser RLS (API route sans contexte user)
    const supabase = createAdminClient();

    // Guard anti-doublon : vérifier si une facture active existe déjà pour cette commande
    const { data: existingInvoices, error: checkError } = await supabase
      .from('financial_documents')
      .select('id, document_number, workflow_status')
      .eq('sales_order_id', salesOrderId)
      .eq('document_type', 'customer_invoice')
      .is('deleted_at', null)
      .not('workflow_status', 'eq', 'cancelled');

    if (checkError) {
      console.error('[API Qonto Invoices] Duplicate check failed:', checkError);
      // Continue anyway - Qonto will be the fallback guard
    } else if (existingInvoices && existingInvoices.length > 0) {
      const existing = existingInvoices[0];
      return NextResponse.json(
        {
          success: false,
          error: `Une facture existe déjà pour cette commande : ${existing.document_number ?? existing.id}. Annulez-la d'abord si vous souhaitez en créer une nouvelle.`,
          existingInvoiceId: existing.id,
        },
        { status: 409 }
      );
    }

    // Récupérer la commande avec ses lignes (sans jointures polymorphiques)
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
      console.error('[API Qonto Invoices] Order fetch error:', orderError);
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Cast to typed order
    const orderWithItems = order as ISalesOrderWithItems;

    // Fetch manuel du customer selon customer_type (pattern polymorphique)
    let customer: Organisation | IndividualCustomer | null = null;

    if (orderWithItems.customer_id && orderWithItems.customer_type) {
      if (orderWithItems.customer_type === 'organization') {
        const { data: org } = await supabase
          .from('organisations')
          .select('*')
          .eq('id', orderWithItems.customer_id)
          .single();
        customer = org;
      } else if (orderWithItems.customer_type === 'individual') {
        const { data: indiv } = await supabase
          .from('individual_customers')
          .select('*')
          .eq('id', orderWithItems.customer_id)
          .single();
        customer = indiv;
      }
    }

    const typedOrder: ISalesOrderWithCustomer = {
      ...orderWithItems,
      customer,
    };

    const qontoClient = getQontoClient();

    // Récupérer ou créer le client Qonto
    let qontoClientId: string;

    // Extraire email et nom selon le type de customer
    let customerEmail: string | null = null;
    let customerName = 'Client';

    // Tax identification number (SIRET/TVA) for Qonto client creation
    let vatNumber: string | undefined;

    if (typedOrder.customer_type === 'organization' && typedOrder.customer) {
      const org = typedOrder.customer as Organisation;
      customerEmail = org.email ?? null;
      customerName = org.trade_name ?? org.legal_name ?? 'Client';
      // Priority: vat_number (TVA intra-communautaire), then siret
      vatNumber = org.vat_number ?? org.siret ?? undefined;
    } else if (
      typedOrder.customer_type === 'individual' &&
      typedOrder.customer
    ) {
      const indiv = typedOrder.customer as IndividualCustomer;
      customerEmail = indiv.email ?? null;
      customerName =
        `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
    }

    // Validate: organisations MUST have a tax identification number for invoicing
    if (typedOrder.customer_type === 'organization' && !vatNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le SIRET ou numéro de TVA de l'organisation est requis pour créer une facture. Veuillez le renseigner dans la fiche organisation.",
        },
        { status: 400 }
      );
    }

    // Résoudre l'adresse de facturation :
    // Priorité 1: adresse envoyée depuis le modal (body)
    // Priorité 2: billing_address JSONB de la commande en DB
    const dbBillingAddress = typedOrder.billing_address as Record<
      string,
      string
    > | null;

    const city = bodyBillingAddress?.city ?? dbBillingAddress?.city;
    const zipCode =
      bodyBillingAddress?.postal_code ?? dbBillingAddress?.postal_code;

    if (!city || !zipCode) {
      console.warn(
        '[API Qonto Invoices] Missing billing address for order:',
        salesOrderId
      );
      return NextResponse.json(
        {
          success: false,
          error:
            'Adresse de facturation incomplète. Ville et code postal requis.',
          details: {
            hasCity: !!city,
            hasZipCode: !!zipCode,
            bodyBillingAddress,
            dbBillingAddress,
          },
        },
        { status: 400 }
      );
    }

    const streetAddress =
      bodyBillingAddress?.address_line1 ??
      dbBillingAddress?.street ??
      dbBillingAddress?.address ??
      dbBillingAddress?.address_line1 ??
      '';
    const countryCode =
      bodyBillingAddress?.country ?? dbBillingAddress?.country ?? 'FR';

    const qontoAddress = {
      streetAddress,
      city,
      zipCode,
      countryCode,
    };

    // Mapper customer_type vers type Qonto
    const qontoClientType =
      typedOrder.customer_type === 'organization' ? 'company' : 'individual';

    // Trouver ou créer le client Qonto
    // Stratégie : chercher par email SI disponible, sinon par nom
    let existingClient = customerEmail
      ? await qontoClient.findClientByEmail(customerEmail)
      : null;

    existingClient ??= await qontoClient.findClientByName(customerName);

    if (existingClient) {
      // Client existant - mettre à jour son adresse
      await qontoClient.updateClient(existingClient.id, {
        name: customerName ?? existingClient.name,
        type: qontoClientType,
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = existingClient.id;
    } else {
      // Créer un nouveau client (email optionnel)
      const newClient = await qontoClient.createClient({
        name: customerName ?? 'Client',
        type: qontoClientType,
        email: customerEmail ?? undefined,
        currency: 'EUR',
        address: qontoAddress,
        vatNumber,
      });
      qontoClientId = newClient.id;
    }

    // Récupérer l'IBAN Qonto pour les méthodes de paiement
    const bankAccounts = await qontoClient.getBankAccounts();
    const mainAccount = bankAccounts.find(a => a.status === 'active');
    if (!mainAccount) {
      return NextResponse.json(
        { success: false, error: 'No active Qonto bank account found' },
        { status: 500 }
      );
    }

    // Mapper les lignes de commande vers items facture
    // Et préparer les données pour l'INSERT dans financial_document_items
    interface IInvoiceItem {
      title: string;
      description?: string;
      quantity: string;
      unit: string;
      unitPrice: { value: string; currency: string };
      vatRate: string;
      // Pour stockage local
      product_id?: string;
      unit_price_ht: number;
      quantity_num: number;
      vat_rate_num: number;
    }

    const items: IInvoiceItem[] = (typedOrder.sales_order_items ?? []).map(
      item => ({
        title: item.products?.name ?? 'Article',

        description: item.notes ?? undefined,
        quantity: String(item.quantity ?? 1),
        unit: 'pièce',
        unitPrice: {
          value: String(item.unit_price_ht ?? 0),
          currency: 'EUR',
        },
        vatRate: String(item.tax_rate ?? 0.2), // tax_rate est déjà en decimal (0.2 = 20%)
        // Pour stockage local
        product_id: item.products?.id,
        unit_price_ht: item.unit_price_ht ?? 0,
        quantity_num: item.quantity ?? 1,
        vat_rate_num: item.tax_rate ?? 0.2,
      })
    );

    // Déterminer la TVA des frais (priorité: body > commande > défaut 20%)
    const feesVatRate = fees?.fees_vat_rate ?? typedOrder.fees_vat_rate ?? 0.2;

    // Ajouter les frais de livraison
    const shippingCost =
      fees?.shipping_cost_ht ?? typedOrder.shipping_cost_ht ?? 0;
    if (shippingCost > 0) {
      items.push({
        title: 'Frais de livraison',
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(shippingCost),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
        unit_price_ht: shippingCost,
        quantity_num: 1,
        vat_rate_num: feesVatRate,
      });
    }

    // Ajouter les frais de manutention
    const handlingCost =
      fees?.handling_cost_ht ?? typedOrder.handling_cost_ht ?? 0;
    if (handlingCost > 0) {
      items.push({
        title: 'Frais de manutention',
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(handlingCost),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
        unit_price_ht: handlingCost,
        quantity_num: 1,
        vat_rate_num: feesVatRate,
      });
    }

    // Ajouter les frais d'assurance
    const insuranceCost =
      fees?.insurance_cost_ht ?? typedOrder.insurance_cost_ht ?? 0;
    if (insuranceCost > 0) {
      items.push({
        title: "Frais d'assurance",
        description: undefined,
        quantity: '1',
        unit: 'forfait',
        unitPrice: {
          value: String(insuranceCost),
          currency: 'EUR',
        },
        vatRate: String(feesVatRate),
        unit_price_ht: insuranceCost,
        quantity_num: 1,
        vat_rate_num: feesVatRate,
      });
    }

    // Ajouter les lignes personnalisées (custom lines)
    if (customLines && customLines.length > 0) {
      for (const line of customLines) {
        items.push({
          title: line.title,
          description: line.description,
          quantity: String(line.quantity),
          unit: 'pièce',
          unitPrice: {
            value: String(line.unit_price_ht),
            currency: 'EUR',
          },
          vatRate: String(line.vat_rate),
          unit_price_ht: line.unit_price_ht,
          quantity_num: line.quantity,
          vat_rate_num: line.vat_rate,
        });
      }
    }

    // Utiliser la date du body ou la date du jour
    const issueDate = customIssueDate ?? new Date().toISOString().split('T')[0];
    const issueDateMs = new Date(issueDate).getTime();

    // Calculer la date d'échéance selon les termes de paiement
    let dueDate: string;
    switch (typedOrder.payment_terms) {
      case 'immediate':
        dueDate = issueDate;
        break;
      case 'net_15':
        dueDate = new Date(issueDateMs + 15 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      case 'net_30':
        dueDate = new Date(issueDateMs + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      case 'net_60':
        dueDate = new Date(issueDateMs + 60 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        break;
      default:
        dueDate = new Date(issueDateMs + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
    }

    // Créer la facture
    const invoiceParams: CreateClientInvoiceParams = {
      clientId: qontoClientId,
      currency: 'EUR',
      issueDate,
      dueDate,
      paymentMethods: {
        iban: mainAccount.iban,
      },
      header: label ?? undefined,
      purchaseOrderNumber: typedOrder.order_number ?? undefined,
      items,
    };

    let invoice = await qontoClient.createClientInvoice(invoiceParams);

    // Vérifier que Qonto a respecté la date envoyée
    // Si Qonto a overridé la date (ex: lors de la création), on corrige via update
    const qontoIssueDate = (invoice as { issue_date?: string }).issue_date;
    if (qontoIssueDate && qontoIssueDate !== issueDate) {
      console.warn(
        `[API Qonto Invoices] Date mismatch: sent ${issueDate}, got ${qontoIssueDate}. Correcting...`
      );
      invoice = await qontoClient.updateClientInvoice(invoice.id, {
        issueDate,
      });
      console.warn(`[API Qonto Invoices] Date corrected to ${issueDate}`);
    }

    // Finaliser automatiquement si demandé
    let finalizedInvoice = invoice;
    if (autoFinalize && invoice.status === 'draft') {
      finalizedInvoice = await qontoClient.finalizeClientInvoice(invoice.id);
    }

    // ========================================
    // STOCKAGE LOCAL DANS FINANCIAL_DOCUMENTS
    // ========================================

    // Calculer les totaux
    let totalHt = 0;
    let totalVat = 0;
    for (const item of items) {
      const lineHt = (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1);
      const lineVat = lineHt * (item.vat_rate_num ?? 0.2);
      totalHt += lineHt;
      totalVat += lineVat;
    }
    const totalTtc = totalHt + totalVat;

    // Déterminer le partner_id (organisation uniquement pour l'instant)
    let partnerId: string | null = null;
    if (typedOrder.customer_type === 'organization' && typedOrder.customer_id) {
      partnerId = typedOrder.customer_id;
    }

    // Récupérer l'utilisateur connecté (via cookies, si disponible)
    // Dans une API route, on n'a pas toujours l'auth - utiliser un ID système
    const systemUserId = '00000000-0000-0000-0000-000000000000'; // TODO: remplacer par vraie auth

    // INSERT dans financial_documents (avec données sync de la commande)
    let localDocumentId: string | null = null;
    if (partnerId) {
      const insertPayload: Database['public']['Tables']['financial_documents']['Insert'] =
        {
          document_type: 'customer_invoice',
          document_direction: 'inbound',
          document_number: finalizedInvoice.invoice_number,
          partner_id: partnerId,
          partner_type: 'customer',
          document_date: issueDate,
          due_date: dueDate,
          total_ht: totalHt,
          total_ttc: totalTtc,
          tva_amount: totalVat,
          amount_paid: 0,
          status: autoFinalize ? 'sent' : 'draft',
          sales_order_id: salesOrderId,
          qonto_invoice_id: finalizedInvoice.id,
          qonto_pdf_url: finalizedInvoice.pdf_url ?? null,
          qonto_public_url: finalizedInvoice.public_url ?? null,
          workflow_status: autoFinalize ? 'finalized' : 'synchronized',
          synchronized_at: new Date().toISOString(),
          created_by: systemUserId,
          // Données synchronisées : body (édité par l'utilisateur) > commande DB
          billing_address: (bodyBillingAddress ??
            typedOrder.billing_address) as Json,
          shipping_address: (bodyShippingAddress ??
            typedOrder.shipping_address) as Json,
          shipping_cost_ht: shippingCost,
          handling_cost_ht: handlingCost,
          insurance_cost_ht: insuranceCost,
          fees_vat_rate: feesVatRate,
          billing_contact_id: typedOrder.billing_contact_id ?? null,
          delivery_contact_id: typedOrder.delivery_contact_id ?? null,
          responsable_contact_id: typedOrder.responsable_contact_id ?? null,
        };
      const { data: insertedDoc, error: insertDocError } = await supabase
        .from('financial_documents')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertDocError) {
        console.error(
          '[API Qonto Invoices] Failed to insert financial_document:',
          insertDocError
        );
        // Ne pas échouer la requête - la facture Qonto est créée
      } else if (insertedDoc) {
        localDocumentId = insertedDoc.id;

        // INSERT dans financial_document_items
        // Note: Cette table existe dans la DB mais peut ne pas être dans les types générés
        const documentItems = items.map((item, index) => ({
          document_id: localDocumentId,
          product_id: item.product_id ?? null,
          description:
            item.title + (item.description ? ` - ${item.description}` : ''),
          quantity: item.quantity_num ?? 1,
          unit_price_ht: item.unit_price_ht ?? 0,
          total_ht: (item.unit_price_ht ?? 0) * (item.quantity_num ?? 1),
          tva_rate: (item.vat_rate_num ?? 0.2) * 100, // Stocké en % (20.00)
          tva_amount:
            (item.unit_price_ht ?? 0) *
            (item.quantity_num ?? 1) *
            (item.vat_rate_num ?? 0.2),
          total_ttc:
            (item.unit_price_ht ?? 0) *
            (item.quantity_num ?? 1) *
            (1 + (item.vat_rate_num ?? 0.2)),
          sort_order: index,
        }));

        // Table financial_document_items existe dans la DB mais pas dans les types générés
        const { error: insertItemsError } = await (
          supabase as unknown as {
            from: (table: string) => {
              insert: (data: unknown[]) => Promise<{ error: unknown }>;
            };
          }
        )
          .from('financial_document_items')
          .insert(documentItems);

        if (insertItemsError) {
          console.error(
            '[API Qonto Invoices] Failed to insert document items:',
            insertItemsError
          );
        }
      }
    } else {
      console.warn(
        '[API Qonto Invoices] Skipping local storage - no organisation partner_id (individual customer)'
      );
    }

    return NextResponse.json({
      success: true,
      invoice: finalizedInvoice,
      localDocumentId,
      message: autoFinalize
        ? 'Invoice created and finalized'
        : 'Invoice created as draft',
    });
  } catch (error) {
    // Log avec détails complets pour QontoError
    const errorDetails =
      error && typeof error === 'object' && 'details' in error
        ? JSON.stringify((error as { details: unknown }).details, null, 2)
        : undefined;
    console.error('[API Qonto Invoices] POST error:', error);
    if (errorDetails) {
      console.error('[API Qonto Invoices] Error details:', errorDetails);
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
