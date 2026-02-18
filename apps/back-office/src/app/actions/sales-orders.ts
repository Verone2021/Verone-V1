'use server';

import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@verone/utils/supabase/server';

export type SalesOrderStatus =
  | 'pending_approval'
  | 'draft'
  | 'validated'
  | 'partially_shipped'
  | 'shipped'
  | 'cancelled';

interface UpdateStatusResult {
  success: boolean;
  error?: string;
}

interface SalesOrderUpdateFields {
  status: SalesOrderStatus;
  confirmed_at?: string;
  confirmed_by?: string;
  shipped_at?: string;
  cancelled_at?: string;
  cancelled_by?: string;
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

    // Préparer les champs à mettre à jour selon le workflow
    const updateFields: SalesOrderUpdateFields = { status: newStatus };

    // Gérer les timestamps selon les contraintes PostgreSQL
    if (newStatus === 'validated') {
      updateFields.confirmed_at = new Date().toISOString();
      updateFields.confirmed_by = userId;
    } else if (newStatus === 'shipped' || newStatus === 'partially_shipped') {
      if (!existingOrder.confirmed_at) {
        updateFields.confirmed_at = new Date().toISOString();
        updateFields.confirmed_by = userId;
      }
      updateFields.shipped_at = new Date().toISOString();
    } else if (newStatus === 'cancelled') {
      updateFields.cancelled_at = new Date().toISOString();
      updateFields.cancelled_by = userId;
    }

    console.warn(`🔧 [Server Action] Champs à mettre à jour:`, updateFields);

    // Mettre à jour le statut de la commande
    const { data: updatedData, error: updateError } = await supabase
      .from('sales_orders')
      .update(updateFields)
      .eq('id', orderId)
      .select();

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

    // Revalider le cache Next.js pour la page des commandes
    revalidatePath('/commandes/clients');

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
