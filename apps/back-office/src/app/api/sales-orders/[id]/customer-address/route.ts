/**
 * API Route: Customer Address for Packlink Shipment
 * GET /api/sales-orders/[id]/customer-address
 *
 * Récupère et formate l'adresse client pour pré-remplir le formulaire Packlink
 *
 * Logique:
 * - Si customer_type = 'organisation' → Décompose nom en "Entreprise" + nom_org
 * - Si customer_type = 'individual' → Utilise first_name + last_name directement
 * - Champs manquants (phone, email) → Retourne chaîne vide
 *
 * @since 2026-09-18 - [BO-SEC-GUARD-001] cette route répondait à n'importe
 *   quel appel anonyme, avec la clé service_role. Elle rendait le nom, l'e-mail,
 *   le téléphone et l'adresse postale d'un client à qui devinait un identifiant
 *   de commande. Garde ajoutée, et retour au client normal : les trois tables
 *   lues ont une règle RLS `is_backoffice_user()`, la clé service_role n'était
 *   pas nécessaire.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerClient } from '@verone/utils/supabase/server';

import { requireBackofficeAdmin } from '@/lib/guards';

interface CustomerAddress {
  name: string;
  surname: string;
  email: string;
  phone: string;
  street1: string;
  city: string;
  zip_code: string;
  country: string;
  company?: string;
}

const OrderIdSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Garde : back-office connecte (owner/admin) uniquement.
  // [BO-SEC-GUARD-001] cette route lisait des donnees clients sans aucune
  // authentification, avec la cle service_role qui contourne la RLS.
  const guardResult = await requireBackofficeAdmin(request);
  if (guardResult instanceof NextResponse) {
    return guardResult;
  }

  try {
    const { id } = await context.params;

    if (!OrderIdSchema.safeParse(id).success) {
      return NextResponse.json(
        { error: 'Identifiant de commande invalide', code: 'INVALID_ORDER_ID' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // 1. Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('customer_id, individual_customer_id, customer_type')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Commande introuvable', code: 'ORDER_NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!order.customer_id) {
      return NextResponse.json(
        { error: 'Commande sans client associé', code: 'NO_CUSTOMER' },
        { status: 400 }
      );
    }

    let address: CustomerAddress;

    // 2. Si customer_type = 'organization'
    if (order.customer_type === 'organization') {
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .select(
          'legal_name, email, phone, address_line1, city, postal_code, country'
        )
        .eq('id', order.customer_id)
        .single();

      if (orgError || !org) {
        return NextResponse.json(
          { error: 'Organisation introuvable', code: 'ORGANISATION_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Décomposition nom entreprise
      address = {
        name: 'Entreprise', // Prénom = "Entreprise"
        surname: org.legal_name, // Nom = Nom entreprise
        email: org.email ?? '',
        phone: org.phone ?? '',
        street1: org.address_line1 ?? '',
        city: org.city ?? '',
        zip_code: org.postal_code ?? '',
        country: org.country ?? 'FR',
        company: org.legal_name, // Champ company
      };
    }
    // 3. Si customer_type = 'individual'
    else if (order.customer_type === 'individual') {
      const { data: customer, error: customerError } = await supabase
        .from('individual_customers')
        .select(
          'first_name, last_name, email, phone, address_line1, city, postal_code, country'
        )
        .eq('id', order.customer_id)
        .single();

      if (customerError || !customer) {
        return NextResponse.json(
          { error: 'Client introuvable', code: 'CUSTOMER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Mapping direct
      address = {
        name: customer.first_name,
        surname: customer.last_name,
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        street1: customer.address_line1 ?? '',
        city: customer.city ?? '',
        zip_code: customer.postal_code ?? '',
        country: customer.country ?? 'FR',
      };
    }
    // 4. Type client non supporté
    else {
      return NextResponse.json(
        {
          error: 'Type de client non supporté',
          code: 'UNSUPPORTED_CUSTOMER_TYPE',
        },
        { status: 400 }
      );
    }

    // 5. Retour succès
    return NextResponse.json({
      success: true,
      address,
    });
  } catch (error) {
    console.error('[API] Customer address error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
