/**
 * Hook: useFinancialPayments
 * Description: Gestion paiements unifiés (AR + AP)
 *
 * Support:
 * - Paiements factures clients
 * - Paiements factures fournisseurs
 * - Paiements dépenses
 *
 * STATUS: DÉSACTIVÉ Phase 1 (returns mocks uniquement)
 */

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { featureFlags } from '@/lib/feature-flags'

// =====================================================================
// TYPES
// =====================================================================

export type PaymentMethod = 'virement' | 'carte' | 'cheque' | 'especes' | 'prelevement' | 'other'

export interface FinancialPayment {
  id: string
  document_id: string
  amount_paid: number
  payment_date: string
  payment_method: PaymentMethod | null
  transaction_reference: string | null
  bank_transaction_id: string | null
  notes: string | null
  synced_from_abby_at: string | null
  abby_payment_id: string | null
  created_at: string
  created_by: string | null

  // Relations chargées
  document?: {
    id: string
    document_type: string
    document_number: string
    partner_id: string
  }
}

// =====================================================================
// HOOK
// =====================================================================

export function useFinancialPayments(documentId?: string) {
  const [payments, setPayments] = useState<FinancialPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // ===================================================================
  // FEATURE FLAG: FINANCE MODULE DISABLED (Phase 1)
  // ===================================================================

  if (!featureFlags.financeEnabled) {
    // Return mocks immédiatement
    return {
      payments: [],
      loading: false,
      error: 'Module Finance désactivé (Phase 1)',
      createPayment: async () => {},
      deletePayment: async () => {},
      refresh: () => {}
    }
  }

  // Fetch paiements
  const fetchPayments = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('financial_payments')
        .select(`
          *,
          document:financial_documents!document_id(
            id,
            document_type,
            document_number,
            partner_id
          )
        `)
        .order('payment_date', { ascending: false })

      // Filtrer par document si fourni
      if (documentId) {
        query = query.eq('document_id', documentId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setPayments(data as FinancialPayment[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur chargement paiements'
      setError(message)
      console.error('Fetch payments error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Enregistrer paiement
  const recordPayment = async (params: {
    document_id: string
    amount_paid: number
    payment_date: string
    payment_method: PaymentMethod
    transaction_reference?: string
    bank_transaction_id?: string
    notes?: string
  }) => {
    try {
      const { data, error: rpcError } = await supabase
        .rpc('record_payment', {
          p_document_id: params.document_id,
          p_amount_paid: params.amount_paid,
          p_payment_date: params.payment_date,
          p_payment_method: params.payment_method,
          p_transaction_reference: params.transaction_reference || null,
          p_bank_transaction_id: params.bank_transaction_id || null,
          p_notes: params.notes || null
        }) as any

      if (rpcError) throw rpcError

      toast.success('Paiement enregistré avec succès')
      await fetchPayments() // Refresh liste

      return data as FinancialPayment
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur enregistrement paiement'
      toast.error(message)
      throw err
    }
  }

  // Supprimer paiement
  const deletePayment = async (paymentId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('financial_payments')
        .delete()
        .eq('id', paymentId)

      if (deleteError) throw deleteError

      toast.success('Paiement supprimé')
      await fetchPayments()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur suppression paiement'
      toast.error(message)
      throw err
    }
  }

  // Stats paiements
  const getStats = () => {
    return {
      total_payments: payments.length,
      total_amount: payments.reduce((sum, p) => sum + p.amount_paid, 0),
      by_method: payments.reduce((acc, p) => {
        const method = p.payment_method || 'unknown'
        acc[method] = (acc[method] || 0) + p.amount_paid
        return acc
      }, {} as Record<string, number>)
    }
  }

  // Auto-fetch au mount
  useEffect(() => {
    fetchPayments()
  }, [documentId])

  return {
    payments,
    loading,
    error,
    stats: getStats(),

    // Actions
    refresh: fetchPayments,
    recordPayment,
    deletePayment
  }
}
