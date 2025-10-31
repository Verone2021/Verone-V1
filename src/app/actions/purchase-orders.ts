'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled'

interface UpdateStatusResult {
  success: boolean
  error?: string
}

/**
 * Server Action pour mettre à jour le statut d'une commande fournisseur
 * Utilisé pour contourner les problèmes RLS 403 lors des mises à jour
 *
 * @param orderId - L'ID de la commande à mettre à jour
 * @param newStatus - Le nouveau statut de la commande
 * @param userId - L'ID de l'utilisateur qui effectue l'action
 * @returns Résultat de l'opération avec success/error
 */
export async function updatePurchaseOrderStatus(
  orderId: string,
  newStatus: PurchaseOrderStatus,
  userId: string
): Promise<UpdateStatusResult> {
  try {
    // Créer le client Supabase ADMIN (bypasse RLS policies)
    const supabase = createAdminClient()

    // Log pour debug
    console.log(`🔍 [Server Action ADMIN] Tentative mise à jour PO ${orderId} vers ${newStatus} par user ${userId}`)

    // Stocker l'utilisateur courant en session PostgreSQL pour les triggers (notamment stock_movements)
    await supabase.rpc('set_current_user_id', { user_id: userId })

    // Vérifier d'abord que la commande existe et récupérer son statut actuel + timestamps
    const { data: existingOrder, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, status, validated_at, sent_at, received_at, cancelled_at')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('❌ [Server Action] Erreur fetch commande:', fetchError)
      return {
        success: false,
        error: `Impossible de récupérer la commande: ${fetchError.message}`
      }
    }

    if (!existingOrder) {
      console.error('❌ [Server Action] Commande non trouvée:', orderId)
      return {
        success: false,
        error: 'Commande non trouvée'
      }
    }

    console.log(`📊 [Server Action] Commande trouvée: ${existingOrder.po_number}, statut actuel: ${existingOrder.status}`)

    // Préparer les champs à mettre à jour selon le workflow
    const updateFields: any = { status: newStatus }

    // Gérer les timestamps selon les contraintes PostgreSQL
    if (newStatus === 'sent') {
      updateFields.sent_at = new Date().toISOString()
      updateFields.sent_by = userId
    } else if (newStatus === 'confirmed') {
      if (!existingOrder.sent_at) {
        updateFields.sent_at = new Date().toISOString()
        updateFields.sent_by = userId
      }
      updateFields.validated_at = new Date().toISOString()
      updateFields.validated_by = userId
    } else if (newStatus === 'received' || newStatus === 'partially_received') {
      if (!existingOrder.sent_at) {
        updateFields.sent_at = new Date().toISOString()
        updateFields.sent_by = userId
      }
      if (!existingOrder.validated_at) {
        updateFields.validated_at = new Date().toISOString()
        updateFields.validated_by = userId
      }
      if (newStatus === 'received') {
        updateFields.received_at = new Date().toISOString()
        updateFields.received_by = userId
      }
    } else if (newStatus === 'cancelled') {
      // ✅ Contrainte valid_workflow_timestamps: cancelled nécessite validated_at + sent_at
      if (!existingOrder.sent_at) {
        updateFields.sent_at = new Date().toISOString()
        updateFields.sent_by = userId
      }
      if (!existingOrder.validated_at) {
        updateFields.validated_at = new Date().toISOString()
        updateFields.validated_by = userId
      }
      updateFields.cancelled_at = new Date().toISOString()
    }

    console.log(`🔧 [Server Action] Champs à mettre à jour:`, updateFields)

    // Mettre à jour le statut de la commande
    const { data: updatedData, error: updateError } = await supabase
      .from('purchase_orders')
      .update(updateFields)
      .eq('id', orderId)
      .select()

    if (updateError) {
      console.error('❌ [Server Action] Erreur UPDATE:', updateError)
      return {
        success: false,
        error: updateError.message
      }
    }

    // Vérifier si l'UPDATE a affecté des lignes
    if (!updatedData || updatedData.length === 0) {
      console.error('❌ [Server Action] UPDATE n\'a affecté AUCUNE ligne (RLS policy bloque probablement)')
      return {
        success: false,
        error: 'Mise à jour bloquée (RLS policy)'
      }
    }

    console.log(`✅ [Server Action] Commande ${existingOrder.po_number} mise à jour avec succès: ${existingOrder.status} → ${newStatus}`)

    // Revalider le cache Next.js pour la page des commandes
    revalidatePath('/commandes/fournisseurs')

    return {
      success: true
    }
  } catch (err) {
    console.error('❌ [Server Action] Exception updatePurchaseOrderStatus:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue'
    }
  }
}
