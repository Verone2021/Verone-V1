/**
 * 🔧 Server Actions - Sales Orders Mutations
 *
 * Solution au bug RLS 403 Forbidden:
 * - Utilise createServerClient pour accès cookies côté serveur
 * - JWT automatiquement transmis au contexte PostgreSQL RLS
 * - auth.uid() fonctionne correctement dans les policies
 *
 * Date: 2025-10-13
 * Bug résolu: Transmission JWT aux requêtes PostgreSQL RLS
 */

'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Type pour le statut d'une commande client
 */
export type SalesOrderStatus = 'draft' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled'

/**
 * Type pour le statut de paiement
 */
export type PaymentStatus = 'pending' | 'prepaid' | 'partial' | 'paid' | 'overdue' | 'cancelled'

/**
 * =============================================
 * SERVER ACTION: Mettre à jour le statut d'une commande client
 * =============================================
 * Utilise Server Client pour transmission JWT correcte vers RLS
 */
export async function updateSalesOrderStatus(
  orderId: string,
  newStatus: SalesOrderStatus
) {
  try {
    const supabase = await createServerClient()

    // Récupérer l'utilisateur authentifié (JWT dans cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Non authentifié - JWT manquant dans cookies',
      }
    }

    // ✨ NOUVEAU (2025-10-14): Validation RÈGLE ABSOLUE pour annulation
    // WORKFLOW: Dévalidation obligatoire (confirmed → draft → cancelled)
    if (newStatus === 'cancelled') {
      const { data: order, error: fetchError } = await supabase
        .from('sales_orders')
        .select('payment_status, order_number, status')
        .eq('id', orderId)
        .single()

      if (fetchError) {
        return {
          success: false,
          error: 'Commande non trouvée',
          code: fetchError.code,
        }
      }

      // RÈGLE ABSOLUE #1: Bloquer annulation si déjà payée
      if (order.payment_status === 'paid') {
        return {
          success: false,
          error: `Impossible d'annuler la commande ${order.order_number} : le paiement a déjà été reçu. Veuillez contacter un administrateur pour procéder à un remboursement.`,
          code: 'CANCELLATION_BLOCKED_PAID_ORDER',
        }
      }

      // RÈGLE ABSOLUE #2: Bloquer annulation si confirmed (doit dévalider d'abord)
      if (order.status === 'confirmed') {
        return {
          success: false,
          error: `Impossible d'annuler directement la commande ${order.order_number} validée. Veuillez d'abord la dévalider (passer en brouillon), puis l'annuler. Workflow requis : Validée → Brouillon → Annulée.`,
          code: 'CANCELLATION_BLOCKED_MUST_DECONFIRM',
        }
      }

      // Validation complémentaire: Bloquer si status inapproprié
      if (order.status === 'delivered') {
        return {
          success: false,
          error: `Impossible d'annuler la commande ${order.order_number} : elle a déjà été livrée. Veuillez créer un avoir ou contacter le service client.`,
          code: 'CANCELLATION_BLOCKED_DELIVERED',
        }
      }
    }

    // Préparer les données de mise à jour selon le statut
    const updateData: any = {
      status: newStatus,
    }

    switch (newStatus) {
      case 'confirmed':
        updateData.confirmed_at = new Date().toISOString()
        updateData.confirmed_by = user.id
        break
      case 'paid':
        updateData.paid_at = new Date().toISOString()
        updateData.payment_status = 'paid'
        break
      case 'shipped':
        updateData.shipped_at = new Date().toISOString()
        updateData.shipped_by = user.id
        break
      case 'delivered':
        updateData.delivered_at = new Date().toISOString()
        break
      case 'cancelled':
        updateData.cancelled_at = new Date().toISOString()
        updateData.cancelled_by = user.id
        break
    }

    // UPDATE avec JWT correctement transmis au contexte RLS
    const { data, error } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('[SERVER ACTION] Erreur UPDATE sales_order:', error)
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    // Revalider le cache Next.js pour la page commandes clients
    revalidatePath('/commandes/clients')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[SERVER ACTION] Exception updateSalesOrderStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * =============================================
 * SERVER ACTION: Mettre à jour le statut de paiement
 * =============================================
 */
export async function updateSalesOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  paidAmount?: number
) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Non authentifié',
      }
    }

    const updateData: any = {
      payment_status: paymentStatus,
    }

    if (paidAmount !== undefined) {
      updateData.paid_amount = paidAmount
    }

    if (paymentStatus === 'paid') {
      updateData.paid_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('sales_orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('[SERVER ACTION] Erreur UPDATE payment_status:', error)
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    revalidatePath('/commandes/clients')

    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[SERVER ACTION] Exception updatePaymentStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * =============================================
 * SERVER ACTION: Créer une nouvelle commande client
 * =============================================
 */
export async function createSalesOrder(orderData: {
  customer_id: string
  expected_delivery_date?: string
  billing_address?: any
  shipping_address?: any
  payment_terms?: string
  notes?: string
  items: Array<{
    product_id: string
    quantity: number
    unit_price: number
    discount_percent?: number
    tax_rate?: number
    notes?: string
  }>
}) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Non authentifié',
      }
    }

    const { items, ...salesOrderData } = orderData

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        ...salesOrderData,
        created_by: user.id,
        status: 'draft',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('[SERVER ACTION] Erreur CREATE sales_order:', orderError)
      return {
        success: false,
        error: orderError.message,
        code: orderError.code,
      }
    }

    // Créer les items
    const itemsToInsert = items.map((item) => ({
      ...item,
      sales_order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('[SERVER ACTION] Erreur CREATE items:', itemsError)
      // Rollback: supprimer la commande créée
      await supabase.from('sales_orders').delete().eq('id', order.id)
      return {
        success: false,
        error: itemsError.message,
        code: itemsError.code,
      }
    }

    revalidatePath('/commandes/clients')

    return {
      success: true,
      data: order,
    }
  } catch (error) {
    console.error('[SERVER ACTION] Exception createSalesOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * =============================================
 * SERVER ACTION: Supprimer une commande client (brouillon uniquement)
 * =============================================
 */
export async function deleteSalesOrder(orderId: string) {
  try {
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Non authentifié',
      }
    }

    // Vérifier que la commande est bien en brouillon ou annulée
    const { data: order, error: fetchError} = await supabase
      .from('sales_orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return {
        success: false,
        error: 'Commande non trouvée',
      }
    }

    // Seules les commandes draft ou cancelled peuvent être supprimées
    if (order.status !== 'draft' && order.status !== 'cancelled') {
      return {
        success: false,
        error: 'Seules les commandes en brouillon ou annulées peuvent être supprimées',
      }
    }

    // Supprimer la commande (CASCADE supprimera les items)
    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', orderId)

    if (error) {
      console.error('[SERVER ACTION] Erreur DELETE sales_order:', error)
      return {
        success: false,
        error: error.message,
        code: error.code,
      }
    }

    revalidatePath('/commandes/clients')

    return {
      success: true,
    }
  } catch (error) {
    console.error('[SERVER ACTION] Exception deleteSalesOrder:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
