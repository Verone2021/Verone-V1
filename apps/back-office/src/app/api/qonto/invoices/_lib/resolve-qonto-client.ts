import { NextResponse } from 'next/server';
import type { QontoClient } from '@verone/integrations/qonto';
import type {
  ISalesOrderWithCustomer,
  Organisation,
  IndividualCustomer,
  IAddressData,
} from './types';

export async function resolveQontoClient(
  qontoClient: QontoClient,
  typedOrder: ISalesOrderWithCustomer,
  bodyBillingAddress: IAddressData | undefined
): Promise<{ qontoClientId: string; error: NextResponse | null }> {
  // Extraire email et nom selon le type de customer
  let customerEmail: string | null = null;
  let customerName = 'Client';

  // Tax identification number (SIRET/TVA) for Qonto client creation
  let vatNumber: string | undefined;

  if (typedOrder.customer_type === 'organization' && typedOrder.customer) {
    const org = typedOrder.customer as Organisation;
    customerEmail = org.email ?? null;
    // Legal name first (raison sociale obligatoire sur factures)
    const legalName = org.legal_name ?? org.trade_name ?? 'Client';
    const tradeName = org.trade_name;
    // Concatenate if trade_name is different from legal_name
    customerName =
      tradeName && tradeName !== legalName
        ? `${legalName} (${tradeName})`
        : legalName;
    // Priority: vat_number (TVA intra-communautaire), then siret
    vatNumber = org.vat_number ?? org.siret ?? undefined;
  } else if (typedOrder.customer_type === 'individual' && typedOrder.customer) {
    const indiv = typedOrder.customer as IndividualCustomer;
    customerEmail = indiv.email ?? null;
    customerName =
      `${indiv.first_name ?? ''} ${indiv.last_name ?? ''}`.trim() || 'Client';
  }

  // Validate: organisations MUST have a tax identification number for invoicing
  if (typedOrder.customer_type === 'organization' && !vatNumber) {
    return {
      qontoClientId: '',
      error: NextResponse.json(
        {
          success: false,
          error:
            "Le SIRET ou numéro de TVA de l'organisation est requis pour créer une facture. Veuillez le renseigner dans la fiche organisation.",
        },
        { status: 400 }
      ),
    };
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
      typedOrder.id
    );
    return {
      qontoClientId: '',
      error: NextResponse.json(
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
      ),
    };
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

  let qontoClientId: string;

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

  return { qontoClientId, error: null };
}
