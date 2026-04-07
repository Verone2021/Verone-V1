/**
 * Async handlers extracted from useConsultationDetail to keep the hook
 * under 400 lines. These are pure async functions receiving all deps
 * as parameters — no React hooks called inside.
 */

import type {
  ClientConsultation,
  ConsultationItem,
} from '@verone/consultations';
import type { IOrderForDocument } from '@verone/finance/components';
import { createClient } from '@verone/utils/supabase/client';

// ── resolvePartnerForOrder ────────────────────────────────────────────

interface PartnerResult {
  partnerId: string;
  billingAddress?: Record<string, unknown>;
}

export async function resolvePartnerForOrder(
  consultation: ClientConsultation
): Promise<PartnerResult | null> {
  const supabase = createClient();

  if (consultation.enseigne_id) {
    const { data: parentOrg } = await supabase
      .from('organisations')
      .select('id, legal_name, address_line1, city, postal_code, country')
      .eq('enseigne_id', consultation.enseigne_id)
      .eq('is_enseigne_parent', true)
      .single();

    const org =
      parentOrg ??
      (await (async () => {
        const { data: firstOrg } = await supabase
          .from('organisations')
          .select('id, legal_name, address_line1, city, postal_code, country')
          .eq('enseigne_id', consultation.enseigne_id!)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        return firstOrg;
      })());

    if (!org) return null;

    return {
      partnerId: org.id,
      billingAddress: org.address_line1
        ? {
            street: org.address_line1,
            city: org.city ?? '',
            postal_code: org.postal_code ?? '',
            country: org.country ?? 'FR',
          }
        : undefined,
    };
  }

  if (consultation.organisation_id) {
    const { data: directOrg } = await supabase
      .from('organisations')
      .select('address_line1, city, postal_code, country')
      .eq('id', consultation.organisation_id)
      .single();

    return {
      partnerId: consultation.organisation_id,
      billingAddress: directOrg?.address_line1
        ? {
            street: directOrg.address_line1,
            city: directOrg.city ?? '',
            postal_code: directOrg.postal_code ?? '',
            country: directOrg.country ?? 'FR',
          }
        : undefined,
    };
  }

  return null;
}

// ── resolvePartnerForQuote ────────────────────────────────────────────

interface QuotePartnerResult {
  partnerId: string;
  partnerOrg: Record<string, string | null | boolean | number>;
}

export async function resolvePartnerForQuote(
  consultation: ClientConsultation
): Promise<QuotePartnerResult | null> {
  const supabase = createClient();
  const fields =
    'id, trade_name, legal_name, email, address_line1, postal_code, city, country, siret, vat_number';

  if (consultation.enseigne_id) {
    const { data: parentOrg } = await supabase
      .from('organisations')
      .select(fields)
      .eq('enseigne_id', consultation.enseigne_id)
      .eq('is_enseigne_parent', true)
      .single();

    const org =
      parentOrg ??
      (await (async () => {
        const { data: firstOrg } = await supabase
          .from('organisations')
          .select(fields)
          .eq('enseigne_id', consultation.enseigne_id!)
          .order('created_at', { ascending: true })
          .limit(1)
          .single();
        return firstOrg;
      })());

    if (!org) return null;
    return {
      partnerId: org.id,
      partnerOrg: org as Record<string, string | null | boolean | number>,
    };
  }

  if (consultation.organisation_id) {
    const { data: directOrg } = await supabase
      .from('organisations')
      .select(fields)
      .eq('id', consultation.organisation_id)
      .single();

    if (!directOrg) return null;
    return {
      partnerId: directOrg.id,
      partnerOrg: directOrg as Record<string, string | null | boolean | number>,
    };
  }

  return null;
}

// ── buildOrderForDocument ─────────────────────────────────────────────

export function buildOrderForDocument(
  consultationId: string,
  consultation: ClientConsultation,
  consultationItems: ConsultationItem[],
  partnerId: string,
  org: Record<string, string | null | boolean | number>
): IOrderForDocument {
  return {
    id: consultationId,
    order_number: `CONSULT-${consultationId.slice(0, 8).toUpperCase()}`,
    total_ht: consultationItems.reduce(
      (sum, item) => sum + (item.unit_price ?? 0) * item.quantity,
      0
    ),
    total_ttc: consultationItems.reduce(
      (sum, item) => sum + (item.unit_price ?? 0) * item.quantity * 1.2,
      0
    ),
    tax_rate: 0.2,
    currency: 'EUR',
    customer_id: partnerId,
    customer_type: 'organization',
    billing_address: org.address_line1
      ? {
          address_line1: (org.address_line1 as string) ?? '',
          postal_code: (org.postal_code as string) ?? '',
          city: (org.city as string) ?? '',
          country: (org.country as string) ?? 'FR',
        }
      : null,
    organisations: {
      name:
        (org.trade_name as string) ?? (org.legal_name as string) ?? 'Client',
      trade_name: org.trade_name as string | null,
      legal_name: org.legal_name as string | null,
      email: consultation.client_email ?? (org.email as string | null),
      address_line1: org.address_line1 as string | null,
      city: org.city as string | null,
      postal_code: org.postal_code as string | null,
      country: org.country as string | null,
      siret: org.siret as string | null,
      vat_number: org.vat_number as string | null,
    },
    sales_order_items: consultationItems
      .filter(item => !item.is_free)
      .map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price ?? 0,
        tax_rate: 0.2,
        products: item.product ? { name: item.product.name } : null,
      })),
  };
}
