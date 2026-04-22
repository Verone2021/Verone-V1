'use server';

import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@verone/utils/supabase/server';

import type { SalesOrderStatus } from '@verone/orders/hooks';

export type { SalesOrderStatus };

interface UpdateStatusResult {
  success: boolean;
  error?: string;
}

interface SalesOrderUpdateFields {
  status: SalesOrderStatus;
  confirmed_at?: string | null;
  confirmed_by?: string | null;
  shipped_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  pending_admin_validation?: boolean;
}

/**
 * Server Action pour mettre à jour le statut d'une commande client
 * Utilisé pour contourner les problèmes RLS 403 lors des mises à jour
 *
 * @param orderId - L'ID de la commande à mettre à jour
 * @param newStatus - Le nouveau statut de la commande
 * @param userId - L'ID de l'utilisateur qui effectue l'action (pour les triggers stock_movements)
 * @returns Résultat de l'opération avec success/error
 */
function buildUpdateFields(
  newStatus: SalesOrderStatus,
  userId: string,
  existingOrder: { confirmed_at: string | null }
): SalesOrderUpdateFields {
  const fields: SalesOrderUpdateFields = { status: newStatus };
  const now = new Date().toISOString();

  if (newStatus === 'validated') {
    fields.confirmed_at = now;
    fields.confirmed_by = userId;
  } else if (newStatus === 'shipped' || newStatus === 'partially_shipped') {
    if (!existingOrder.confirmed_at) {
      fields.confirmed_at = now;
      fields.confirmed_by = userId;
    }
    fields.shipped_at = now;
  } else if (newStatus === 'cancelled') {
    fields.cancelled_at = now;
    fields.cancelled_by = userId;
    fields.pending_admin_validation = false;
  } else if (newStatus === 'draft') {
    fields.confirmed_at = null;
    fields.confirmed_by = null;
    fields.pending_admin_validation = false;
  }
  return fields;
}

export async function updateSalesOrderStatus(
  orderId: string,
  newStatus: SalesOrderStatus,
  userId: string
): Promise<UpdateStatusResult> {
  try {
    // Créer le client Supabase ADMIN (bypasse RLS policies)
    const supabase = createAdminClient();

    // Log pour debug
    console.warn(
      `🔍 [Server Action ADMIN] Tentative mise à jour commande ${orderId} vers ${newStatus} par user ${userId}`
    );

    // Stocker l'utilisateur courant en session PostgreSQL pour les triggers (notamment stock_movements)
    await supabase.rpc('set_current_user_id', { user_id: userId });

    // Vérifier d'abord que la commande existe et récupérer son statut actuel + timestamps
    const { data: existingOrder, error: fetchError } = await supabase
      .from('sales_orders')
      .select(
        'id, order_number, status, confirmed_at, shipped_at, delivered_at, cancelled_at'
      )
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('❌ [Server Action] Erreur fetch commande:', fetchError);
      return {
        success: false,
        error: `Impossible de récupérer la commande: ${fetchError.message}`,
      };
    }

    if (!existingOrder) {
      console.error('❌ [Server Action] Commande non trouvée:', orderId);
      return {
        success: false,
        error: 'Commande non trouvée',
      };
    }

    console.warn(
      `📊 [Server Action] Commande trouvée: ${existingOrder.order_number}, statut actuel: ${existingOrder.status}`
    );

    const updateFields = buildUpdateFields(newStatus, userId, existingOrder);

    console.warn(`🔧 [Server Action] Champs à mettre à jour:`, updateFields);

    // Mettre à jour le statut de la commande
    const { data: updatedData, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateFields)
      .eq('id', orderId)
      .select('id');

    if (updateError) {
      console.error('❌ [Server Action] Erreur UPDATE:', updateError);
      return {
        success: false,
        error: updateError.message,
      };
    }

    // Vérifier si l'UPDATE a affecté des lignes
    if (!updatedData || updatedData.length === 0) {
      console.error(
        "❌ [Server Action] UPDATE n'a affecté AUCUNE ligne (RLS policy bloque probablement)"
      );
      return {
        success: false,
        error: 'Mise à jour bloquée (RLS policy)',
      };
    }

    console.warn(
      `✅ [Server Action] Commande ${existingOrder.order_number} mise à jour avec succès: ${existingOrder.status} → ${newStatus}`
    );

    // Revalider le cache Next.js pour toutes les pages commandes
    revalidatePath('/commandes/clients');
    revalidatePath('/canaux-vente/linkme/commandes');
    revalidatePath('/canaux-vente/linkme/commissions');

    return {
      success: true,
    };
  } catch (err) {
    console.error('❌ [Server Action] Exception updateSalesOrderStatus:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    };
  }
}
