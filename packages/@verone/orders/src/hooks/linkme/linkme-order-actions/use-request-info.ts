'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import type { RequestInfoInput, OrderActionResult } from './types';
import { fetchLinkMeOrderDetails } from './fetch-linkme-details';

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
  const [details, orderResult, userResult] = await Promise.all([
    // 1. Récupérer les détails LinkMe
    fetchLinkMeOrderDetails(input.orderId),
    // 2. Récupérer la commande
    supabase
      .from('sales_orders')
      .select('order_number, notes, total_ttc, customer_id, customer_type')
      .eq('id', input.orderId)
      .single(),
    // 3. Récupérer l'utilisateur courant (sentBy)
    supabase.auth.getUser(),
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
  const currentUserId = userResult.data.user?.id;

  if (!currentUserId) {
    throw new Error('Utilisateur non authentifié');
  }

  // Requête séparée pour l'organisation (pas de FK car customer_id est polymorphique)
  let organisationName: string | null = null;
  if (order.customer_type === 'organization' && order.customer_id) {
    const { data: org } = await supabase
      .from('organisations')
      .select('trade_name, legal_name')
      .eq('id', order.customer_id)
      .single();
    organisationName = org?.trade_name ?? org?.legal_name ?? null;
  }

  // Déterminer les destinataires
  const emails: string[] = input.recipientEmails?.length
    ? input.recipientEmails
    : (() => {
        const recipientType = input.recipientType ?? 'requester';
        const email =
          recipientType === 'owner' && details.owner_email
            ? details.owner_email
            : details.requester_email;
        return email ? [email] : [];
      })();

  if (emails.length === 0) {
    throw new Error(
      'Aucun email destinataire. Veuillez sélectionner au moins un destinataire.'
    );
  }

  const recipientName =
    details.requester_name ?? details.owner_name ?? 'Destinataire';

  // Logger la demande dans les notes de la commande
  const timestamp = new Date().toLocaleString('fr-FR');
  const noteMessage = input.customMessage ?? 'Formulaire interactif envoyé';
  const fieldsSummary = input.missingFields.map(f => f.label).join(', ');
  const emailsList = emails.join(', ');
  const newNote = `[${timestamp}] DEMANDE COMPLEMENTS → ${emailsList}\n${noteMessage}\n[Champs: ${fieldsSummary}]`;
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

  // Envoyer à chaque destinataire
  const recipientEmail = emails.join(',');
  const emailResponse = await fetch('/api/emails/linkme-info-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      salesOrderId: input.orderId,
      orderNumber: order.order_number,
      recipientEmail,
      recipientName,
      recipientType: 'manual',
      organisationName,
      totalTtc: order.total_ttc ?? 0,
      requestedFields: input.missingFields,
      customMessage: input.customMessage,
      sentBy: currentUserId,
    }),
  });

  if (!emailResponse.ok) {
    const errorData = (await emailResponse.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(
      `Erreur envoi formulaire: ${errorData?.error ?? `HTTP ${emailResponse.status}`}`
    );
  }

  return {
    success: true,
    message: `Formulaire de compléments envoyé à ${emailsList}`,
  };
}

/**
 * Hook: demander des compléments
 */
export function useRequestInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestInfo,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['linkme-orders'] }),
        queryClient.invalidateQueries({
          queryKey: ['linkme-orders-to-process'],
        }),
      ]);
    },
  });
}
