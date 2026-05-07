import { NextResponse } from 'next/server';
import type { QontoClient } from '@verone/integrations/qonto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@verone/types';
import type {
  ISalesOrderWithCustomer,
  Organisation,
  IndividualCustomer,
  IAddressData,
} from './types';

/**
 * [BO-FIN-FEES-002] Normalise billing_address quel que soit son format en base.
 *
 * Postgres stocke `billing_address` en JSONB qui accepte tout type. Plusieurs
 * formats anormaux ont été observés en production (incident 2026-05-07) :
 *   - `null`
 *   - `{ city, postal_code, address_line1, country }`         → format normal
 *   - `"{\"city\":\"...\",\"postal_code\":\"...\"}"` (string) → JSON double-encodé
 *   - `{ address: "texte libre" }`                            → wizard cassé
 *
 * Cette fonction retourne un objet plat `{ city, postal_code, ... }` ou null.
 * Le code appelant ajoute un fallback sur l'organisation customer en cas de null.
 */
function normalizeBillingAddress(
  raw: unknown
): Record<string, string | undefined> | null {
  if (raw === null || raw === undefined) return null;

  // Cas string JSON encodée
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      return normalizeBillingAddress(parsed);
    } catch {
      return null;
    }
  }

  if (typeof raw !== 'object' || Array.isArray(raw)) return null;

  const obj = raw as Record<string, unknown>;

  // Cas { address: ... } : descendre d'un niveau si address est un object
  if (
    'address' in obj &&
    typeof obj.address === 'object' &&
    obj.address !== null
  ) {
    return normalizeBillingAddress(obj.address);
  }

  // Cas object plat normal
  const result: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') result[k] = v;
  }
  return result;
}

export async function resolveQontoClient(
  qontoClient: QontoClient,
  typedOrder: ISalesOrderWithCustomer,
  bodyBillingAddress: IAddressData | undefined,
  billingOrgId?: string,
  supabase?: SupabaseClient<Database>
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

    // Override : si une org de facturation différente est choisie, utiliser son TIN
    const isDifferentBillingOrg =
      billingOrgId && supabase && billingOrgId !== typedOrder.customer_id;

    if (isDifferentBillingOrg) {
      const { data: billingOrg } = await supabase
        .from('organisations')
        .select('legal_name, trade_name, email, siret, vat_number')
        .eq('id', billingOrgId)
        .single();

      if (billingOrg) {
        // Surcharger TIN avec celui de l'org de facturation
        const billingVat =
          billingOrg.vat_number ?? billingOrg.siret ?? undefined;
        if (billingVat) {
          vatNumber = billingVat;
        } else {
          // [BO-FIN-039 W3] Guard anti-discordance : si l'org de facturation choisie
          // n'a pas de SIRET/VAT, refuser la facture plutôt que d'utiliser silencieusement
          // le TIN de l'org commande avec le nom de l'org de facturation.
          return {
            qontoClientId: '',
            error: NextResponse.json(
              {
                success: false,
                error:
                  "L'organisation de facturation choisie n'a pas de SIRET ni de numéro de TVA. Facturation interdite.",
              },
              { status: 400 }
            ),
          };
        }

        // Surcharger nom et email avec l'org de facturation
        const billingLegal =
          billingOrg.legal_name ?? billingOrg.trade_name ?? legalName;
        const billingTrade = billingOrg.trade_name;
        customerName =
          billingTrade && billingTrade !== billingLegal
            ? `${billingLegal} (${billingTrade})`
            : billingLegal;
        if (billingOrg.email) customerEmail = billingOrg.email;
      }
    }
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
  // Priorité 2: billing_address JSONB de la commande en DB (normalisée)
  // Priorité 3: [BO-FIN-FEES-002] Fallback sur l'organisation (defense in depth)
  //
  // [BO-FIN-FEES-002 — Defense in depth] Avant 2026-05-07, ce code lisait
  // `typedOrder.billing_address as Record<string, string>` directement, ce
  // qui plantait silencieusement quand billing_address était :
  //  - stocké comme STRING JSON encodée (jsonb_typeof = 'string')
  //  - structuré comme `{ address: "texte libre" }` (sans city/postal_code)
  // Le helper normalize ci-dessous parse ces formats anormaux pour récupérer
  // un objet plat. Si la commande a quand même billing_address vide, on fallback
  // sur les colonnes billing_* de l'organisation customer.
  const dbBillingAddress = normalizeBillingAddress(typedOrder.billing_address);

  const orgFallback =
    typedOrder.customer_type === 'organization' && typedOrder.customer
      ? (typedOrder.customer as Organisation)
      : null;

  const city =
    bodyBillingAddress?.city ??
    dbBillingAddress?.city ??
    orgFallback?.billing_city ??
    orgFallback?.city ??
    undefined;
  const zipCode =
    bodyBillingAddress?.postal_code ??
    dbBillingAddress?.postal_code ??
    orgFallback?.billing_postal_code ??
    orgFallback?.postal_code ??
    undefined;

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
            orgFallbackUsed: !!orgFallback,
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
    orgFallback?.billing_address_line1 ??
    orgFallback?.address_line1 ??
    '';
  const countryCode =
    bodyBillingAddress?.country ??
    dbBillingAddress?.country ??
    orgFallback?.billing_country ??
    orgFallback?.country ??
    'FR';

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
