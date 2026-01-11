/**
 * Hook: useLinkMeOrderActions
 * Actions back-office pour commandes Enseigne LinkMe
 * =====================================================
 * Actions:
 * - approveOrder: approuve et génère token Étape 4
 * - requestInfo: demande compléments au demandeur
 * - rejectOrder: refuse la commande
 * =====================================================
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================
// TYPES
// ============================================

export interface ApproveOrderInput {
  orderId: string;
}

export interface RequestInfoInput {
  orderId: string;
  message: string;
}

export interface RejectOrderInput {
  orderId: string;
  reason: string;
}

export interface OrderActionResult {
  success: boolean;
  message: string;
  step4Token?: string;
}

// ============================================
// FETCH LINKME DETAILS
// ============================================

export interface LinkMeOrderDetails {
  id: string;
  sales_order_id: string;
  requester_type: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  requester_position: string | null;
  is_new_restaurant: boolean;
  owner_type: string | null;
  owner_contact_same_as_requester: boolean | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_company_legal_name: string | null;
  owner_company_trade_name: string | null;
  owner_kbis_url: string | null;
  billing_contact_source: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  delivery_terms_accepted: boolean | null;
  desired_delivery_date: string | null;
  mall_form_required: boolean | null;
  mall_form_email: string | null;
  step4_token: string | null;
  step4_token_expires_at: string | null;
  step4_completed_at: string | null;
  reception_contact_name: string | null;
  reception_contact_email: string | null;
  reception_contact_phone: string | null;
  confirmed_delivery_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Récupère les détails LinkMe d'une commande
 */
export async function fetchLinkMeOrderDetails(
  orderId: string
): Promise<LinkMeOrderDetails | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('sales_order_linkme_details')
    .select('*')
    .eq('sales_order_id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - pas de détails LinkMe
      return null;
    }
    console.error('Erreur fetch LinkMe details:', error);
    throw error;
  }

  return data as LinkMeOrderDetails;
}

// ============================================
// ACTION FUNCTIONS
// ============================================

/**
 * Approuve une commande Enseigne
 * - Vérifie que owner_email est présent (Étape 2 complète)
 * - Met à jour status = 'validated'
 * - Génère step4_token + expires_at
 * - TODO: Envoyer email au contact Étape 2
 */
async function approveOrder(
  input: ApproveOrderInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // 1. Récupérer les détails LinkMe
  const details = await fetchLinkMeOrderDetails(input.orderId);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  // 2. Vérifier que l'Étape 2 est complète (owner_email présent)
  const ownerEmail = details.owner_contact_same_as_requester
    ? details.requester_email
    : details.owner_email;

  if (!ownerEmail) {
    throw new Error(
      'Étape 2 incomplète: contact propriétaire requis pour approbation'
    );
  }

  // 3. Générer le token Étape 4 (UUID)
  const step4Token = crypto.randomUUID();
  const step4ExpiresAt = new Date();
  step4ExpiresAt.setDate(step4ExpiresAt.getDate() + 30); // Expire dans 30 jours

  // 4. Mettre à jour les détails LinkMe avec le token
  const { error: detailsError } = await supabase
    .from('sales_order_linkme_details')
    .update({
      step4_token: step4Token,
      step4_token_expires_at: step4ExpiresAt.toISOString(),
    })
    .eq('sales_order_id', input.orderId);

  if (detailsError) {
    console.error('Erreur update LinkMe details:', detailsError);
    throw new Error(`Erreur mise à jour détails: ${detailsError.message}`);
  }

  // 5. Mettre à jour le status de la commande
  const { error: orderError } = await supabase
    .from('sales_orders')
    .update({
      status: 'validated',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (orderError) {
    console.error('Erreur update sales_order:', orderError);
    throw new Error(`Erreur mise à jour commande: ${orderError.message}`);
  }

  // 6. Récupérer les infos et envoyer email
  const { data: orderData } = await supabase
    .from('sales_orders')
    .select(
      'order_number, total_ttc, organisations!sales_orders_customer_id_fkey(trade_name, legal_name)'
    )
    .eq('id', input.orderId)
    .single();
  const ownerName = details.owner_contact_same_as_requester
    ? details.requester_name
    : details.owner_name || details.requester_name;
  const organisationName =
    (orderData?.organisations as any)?.trade_name ||
    (orderData?.organisations as any)?.legal_name ||
    null;
  try {
    await fetch('/api/emails/linkme-order-approved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: orderData?.order_number,
        ownerEmail,
        ownerName,
        step4Token,
        organisationName,
        totalTtc: orderData?.total_ttc || 0,
      }),
    });
  } catch (emailError) {
    console.error('Erreur envoi email approbation:', emailError);
  }

  return {
    success: true,
    message: 'Commande approuvée. Email Étape 4 envoyé.',
    step4Token,
  };
}

/**
 * Demande des compléments d'information
 * - Envoie email au demandeur avec le message
 * - Log l'action
 */
async function requestInfo(
  input: RequestInfoInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // Paralléliser les requêtes pour éviter séquentiel (fix perf)
  const [details, orderResult] = await Promise.all([
    // 1. Récupérer les détails LinkMe
    fetchLinkMeOrderDetails(input.orderId),
    // 2. Récupérer la commande avec jointure organisation
    supabase
      .from('sales_orders')
      .select(
        'order_number, notes, customer_id, customer_type, organisations!sales_orders_customer_id_fkey(trade_name, legal_name)'
      )
      .eq('id', input.orderId)
      .single(),
  ]);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  if (orderResult.error) {
    throw new Error(
      `Erreur récupération commande: ${orderResult.error.message}`
    );
  }

  const order = orderResult.data;

  // Organisation récupérée via jointure (peut être array ou objet selon Supabase)
  const orgRaw = order.organisations as any;
  const orgData = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
  const organisationName = orgData?.trade_name || orgData?.legal_name || null;

  const timestamp = new Date().toLocaleString('fr-FR');
  const newNote = `[${timestamp}] DEMANDE COMPLEMENTS: ${input.message}`;
  const updatedNotes = order.notes ? `${order.notes}\n\n${newNote}` : newNote;

  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (updateError) {
    throw new Error(`Erreur mise à jour notes: ${updateError.message}`);
  }

  // 4. Envoyer email au demandeur
  try {
    await fetch('/api/emails/linkme-order-request-info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order.order_number,
        requesterEmail: details.requester_email,
        requesterName: details.requester_name,
        message: input.message,
        organisationName,
      }),
    });
  } catch (emailError) {
    console.error('Erreur envoi email request-info:', emailError);
    // On ne bloque pas si l'email échoue
  }

  return {
    success: true,
    message: `Demande de compléments envoyée à ${details.requester_email}`,
  };
}

/**
 * Refuse une commande
 * - Met à jour status = 'cancelled'
 * - Envoie email au demandeur avec la raison
 */
async function rejectOrder(
  input: RejectOrderInput
): Promise<OrderActionResult> {
  const supabase = createClient();

  // Paralléliser les requêtes pour éviter séquentiel (fix perf)
  const [details, orderResult] = await Promise.all([
    // 1. Récupérer les détails LinkMe
    fetchLinkMeOrderDetails(input.orderId),
    // 2. Récupérer la commande avec jointure organisation
    supabase
      .from('sales_orders')
      .select(
        'order_number, notes, customer_id, customer_type, organisations!sales_orders_customer_id_fkey(trade_name, legal_name)'
      )
      .eq('id', input.orderId)
      .single(),
  ]);

  if (!details) {
    throw new Error('Détails LinkMe non trouvés pour cette commande');
  }

  if (orderResult.error) {
    throw new Error(
      `Erreur récupération commande: ${orderResult.error.message}`
    );
  }

  const order = orderResult.data;

  // Organisation récupérée via jointure (peut être array ou objet selon Supabase)
  const orgRaw = order.organisations as any;
  const orgData = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
  const organisationName = orgData?.trade_name || orgData?.legal_name || null;

  const timestamp = new Date().toLocaleString('fr-FR');
  const newNote = `[${timestamp}] COMMANDE REFUSEE: ${input.reason}`;
  const updatedNotes = order.notes ? `${order.notes}\n\n${newNote}` : newNote;

  // 4. Mettre à jour la commande
  const { error: updateError } = await supabase
    .from('sales_orders')
    .update({
      status: 'cancelled',
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.orderId);

  if (updateError) {
    throw new Error(`Erreur mise à jour commande: ${updateError.message}`);
  }

  // 5. Envoyer email au demandeur
  try {
    await fetch('/api/emails/linkme-order-rejected', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderNumber: order.order_number,
        requesterEmail: details.requester_email,
        requesterName: details.requester_name,
        reason: input.reason,
        organisationName,
      }),
    });
  } catch (emailError) {
    console.error('Erreur envoi email rejection:', emailError);
    // On ne bloque pas si l'email échoue
  }

  return {
    success: true,
    message: `Commande refusée. Notification envoyée à ${details.requester_email}`,
  };
}

// ============================================
// HOOKS REACT-QUERY
// ============================================

/**
 * Hook: approuver une commande Enseigne
 */
export function useApproveOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-orders-to-process'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}

/**
 * Hook: demander des compléments
 */
export function useRequestInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-orders-to-process'] });
    },
  });
}

/**
 * Hook: refuser une commande
 */
export function useRejectOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['linkme-orders-to-process'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders-count'] });
    },
  });
}

// ============================================
// UPDATE LINKME DETAILS (ÉDITION BACK-OFFICE)
// ============================================

export interface UpdateLinkMeDetailsInput {
  orderId: string;
  updates: Partial<{
    // Étape 1: Demandeur
    requester_type: string;
    requester_name: string;
    requester_email: string;
    requester_phone: string | null;
    requester_position: string | null;
    is_new_restaurant: boolean;
    // Étape 2: Propriétaire
    owner_type: string | null;
    owner_contact_same_as_requester: boolean | null;
    owner_name: string | null;
    owner_email: string | null;
    owner_phone: string | null;
    owner_company_legal_name: string | null;
    owner_company_trade_name: string | null;
    owner_kbis_url: string | null;
    // Étape 3: Facturation
    billing_contact_source: string | null;
    billing_name: string | null;
    billing_email: string | null;
    billing_phone: string | null;
    delivery_terms_accepted: boolean | null;
    desired_delivery_date: string | null;
    mall_form_required: boolean | null;
    mall_form_email: string | null;
  }>;
}

/**
 * Mise à jour des détails LinkMe d'une commande
 * Utilisé par l'admin pour compléter/modifier les infos des Étapes 1-3
 */
async function updateLinkMeDetails(
  input: UpdateLinkMeDetailsInput
): Promise<{ success: boolean }> {
  const supabase = createClient();

  // Convertir les valeurs undefined en conservant null uniquement où autorisé
  const cleanedUpdates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input.updates)) {
    if (value !== undefined) {
      cleanedUpdates[key] = value;
    }
  }

  const { error } = await supabase
    .from('sales_order_linkme_details')
    .update({
      ...cleanedUpdates,
      updated_at: new Date().toISOString(),
    } as Record<string, unknown>)
    .eq('sales_order_id', input.orderId);

  if (error) {
    console.error('Erreur update LinkMe details:', error);
    throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
  }

  return { success: true };
}

/**
 * Hook: useUpdateLinkMeDetails
 * Permet à l'admin de modifier les détails LinkMe d'une commande
 */
export function useUpdateLinkMeDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLinkMeDetails,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkme-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
}

// ============================================
// PENDING ORDERS FOR APPROBATIONS
// ============================================

export interface PendingOrderItem {
  id: string;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  products: {
    id: string;
    name: string;
    sku: string;
    primary_image_url: string | null;
  } | null;
}

export interface PendingOrderLinkMeDetails {
  is_new_restaurant: boolean;
  requester_type: string | null;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  requester_position: string | null;
  owner_type: string | null;
  owner_contact_same_as_requester: boolean | null;
  owner_name: string | null;
  owner_email: string | null;
  owner_phone: string | null;
  owner_company_legal_name: string | null;
  owner_company_trade_name: string | null;
  billing_contact_source: string | null;
  billing_name: string | null;
  billing_email: string | null;
  billing_phone: string | null;
  desired_delivery_date: string | null;
  mall_form_required: boolean | null;
}

export interface PendingOrder {
  id: string;
  order_number: string;
  status: string;
  total_ht: number;
  total_ttc: number;
  created_at: string;
  // LinkMe details (simple)
  requester_name: string | null;
  requester_email: string | null;
  requester_type: string | null;
  // Organisation
  organisation_name: string | null;
  enseigne_name: string | null;
  // Enriched data for detail view
  linkme_details: PendingOrderLinkMeDetails | null;
  items: PendingOrderItem[];
}

/**
 * Hook: compte le nombre de commandes en attente de validation
 */
export function usePendingOrdersCount() {
  return useQuery({
    queryKey: ['pending-orders-count'],
    queryFn: async (): Promise<number> => {
      const supabase = createClient();

      const { count, error } = await supabase
        .from('sales_orders')
        .select('*', { count: 'exact', head: true })
        .eq('pending_admin_validation', true);

      if (error) {
        console.error('Error fetching pending orders count:', error);
        throw error;
      }

      return count || 0;
    },
    staleTime: 120000, // 2 minutes
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
}

/**
 * Hook: récupère les commandes en attente de validation
 * Enrichi avec les détails LinkMe et les items pour la vue détail
 */
export function usePendingOrders() {
  return useQuery({
    queryKey: ['pending-orders'],
    queryFn: async (): Promise<PendingOrder[]> => {
      const supabase = createClient();

      // Fetch orders with pending_admin_validation = true
      const { data: orders, error } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          status,
          total_ht,
          total_ttc,
          created_at,
          customer_id,
          customer_type,
          sales_order_linkme_details (
            is_new_restaurant,
            requester_type,
            requester_name,
            requester_email,
            requester_phone,
            requester_position,
            owner_type,
            owner_contact_same_as_requester,
            owner_name,
            owner_email,
            owner_phone,
            owner_company_legal_name,
            owner_company_trade_name,
            billing_contact_source,
            billing_name,
            billing_email,
            billing_phone,
            desired_delivery_date,
            mall_form_required
          ),
          sales_order_items (
            id,
            quantity,
            unit_price_ht,
            total_ht,
            products (
              id,
              name,
              sku,
              product_images!left(public_url, is_primary)
            )
          )
        `
        )
        .eq('pending_admin_validation', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending orders:', error);
        throw error;
      }

      // BATCH: Récupérer toutes les organisations en UNE SEULE requête (fix N+1)
      const organisationIds = (orders || [])
        .filter(o => o.customer_type === 'organization' && o.customer_id)
        .map(o => o.customer_id);

      const organisationsMap = new Map<
        string,
        {
          trade_name: string | null;
          legal_name: string | null;
          enseigne_name: string | null;
        }
      >();

      if (organisationIds.length > 0) {
        const { data: orgsData } = await supabase
          .from('organisations')
          .select('id, trade_name, legal_name, enseigne:enseigne_id(name)')
          .in('id', organisationIds);

        if (orgsData) {
          for (const org of orgsData) {
            organisationsMap.set(org.id, {
              trade_name: org.trade_name,
              legal_name: org.legal_name,
              enseigne_name: (org.enseigne as any)?.name || null,
            });
          }
        }
      }

      // Map orders with organisation data from the batch
      const enrichedOrders: PendingOrder[] = [];

      for (const order of orders || []) {
        // Get organisation name from cached map (no additional query)
        let organisationName: string | null = null;
        let enseigneName: string | null = null;

        if (order.customer_type === 'organization' && order.customer_id) {
          const orgData = organisationsMap.get(order.customer_id);
          if (orgData) {
            organisationName = orgData.trade_name || orgData.legal_name;
            enseigneName = orgData.enseigne_name;
          }
        }

        // Extract linkme details (can be single object or array depending on Supabase query)
        const linkmeDetailsRaw = order.sales_order_linkme_details as any;
        const linkmeDetails = Array.isArray(linkmeDetailsRaw)
          ? linkmeDetailsRaw[0] || null
          : linkmeDetailsRaw || null;

        // Map items with proper typing and extract primary image
        const items: PendingOrderItem[] = (
          (order.sales_order_items as any[]) ?? []
        ).map((item: any) => {
          // Extract primary image from product_images array
          const productImages = item.products?.product_images as
            | Array<{ public_url: string; is_primary: boolean }>
            | undefined;
          const primaryImage =
            productImages?.find(img => img.is_primary)?.public_url ??
            productImages?.[0]?.public_url ??
            null;

          return {
            id: item.id as string,
            quantity: item.quantity as number,
            unit_price_ht: item.unit_price_ht as number,
            total_ht: item.total_ht as number,
            products: item.products
              ? {
                  id: item.products.id as string,
                  name: item.products.name as string,
                  sku: item.products.sku as string,
                  primary_image_url: primaryImage,
                }
              : null,
          };
        });

        enrichedOrders.push({
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total_ht: order.total_ht,
          total_ttc: order.total_ttc,
          created_at: order.created_at,
          requester_name: linkmeDetails?.requester_name || null,
          requester_email: linkmeDetails?.requester_email || null,
          requester_type: linkmeDetails?.requester_type || null,
          organisation_name: organisationName,
          enseigne_name: enseigneName,
          linkme_details: linkmeDetails
            ? {
                is_new_restaurant: linkmeDetails.is_new_restaurant ?? false,
                requester_type: linkmeDetails.requester_type,
                requester_name: linkmeDetails.requester_name,
                requester_email: linkmeDetails.requester_email,
                requester_phone: linkmeDetails.requester_phone,
                requester_position: linkmeDetails.requester_position,
                owner_type: linkmeDetails.owner_type,
                owner_contact_same_as_requester:
                  linkmeDetails.owner_contact_same_as_requester,
                owner_name: linkmeDetails.owner_name,
                owner_email: linkmeDetails.owner_email,
                owner_phone: linkmeDetails.owner_phone,
                owner_company_legal_name:
                  linkmeDetails.owner_company_legal_name,
                owner_company_trade_name:
                  linkmeDetails.owner_company_trade_name,
                billing_contact_source: linkmeDetails.billing_contact_source,
                billing_name: linkmeDetails.billing_name,
                billing_email: linkmeDetails.billing_email,
                billing_phone: linkmeDetails.billing_phone,
                desired_delivery_date: linkmeDetails.desired_delivery_date,
                mall_form_required: linkmeDetails.mall_form_required,
              }
            : null,
          items,
        });
      }

      return enrichedOrders;
    },
    staleTime: 30000,
  });
}
