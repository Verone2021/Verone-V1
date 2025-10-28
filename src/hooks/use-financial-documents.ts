/**
 * Hook: useFinancialDocuments
 * Description: Gestion documents financiers unifiés (Pattern STI)
 *
 * Support:
 * - Factures clients (customer_invoice)
 * - Factures fournisseurs (supplier_invoice)
 * - Dépenses (expense)
 * - Avoirs (credit_notes)
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

export type DocumentType =
  | 'customer_invoice'
  | 'customer_credit_note'
  | 'supplier_invoice'
  | 'supplier_credit_note'
  | 'expense'

export type DocumentDirection = 'inbound' | 'outbound'

export type DocumentStatus =
  | 'draft'
  | 'sent'
  | 'received'
  | 'paid'
  | 'partially_paid'
  | 'overdue'
  | 'cancelled'
  | 'refunded'

export interface FinancialDocument {
  id: string
  document_type: DocumentType
  document_direction: DocumentDirection
  partner_id: string
  partner_type: 'customer' | 'supplier'
  document_number: string
  document_date: string
  due_date: string | null
  total_ht: number
  total_ttc: number
  tva_amount: number
  amount_paid: number
  status: DocumentStatus

  // Intégrations
  abby_invoice_id: string | null
  abby_invoice_number: string | null
  abby_pdf_url: string | null
  uploaded_file_url: string | null

  // Relations
  sales_order_id: string | null
  purchase_order_id: string | null
  expense_category_id: string | null

  // Metadata
  description: string | null
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string

  // Relations chargées (avec expand)
  partner?: {
    id: string
    legal_name: string
    trade_name: string | null
    type: 'supplier' | 'customer' | 'partner' | 'internal' | null
  }
  expense_category?: {
    id: string
    name: string
    account_code: string
  }
}

export interface FinancialDocumentFilters {
  document_type?: DocumentType | DocumentType[]
  document_direction?: DocumentDirection
  status?: DocumentStatus | DocumentStatus[]
  partner_id?: string
  date_from?: string
  date_to?: string
  search?: string
}

// =====================================================================
// HOOK
// =====================================================================

export function useFinancialDocuments(filters?: FinancialDocumentFilters) {
  const [documents, setDocuments] = useState<FinancialDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // ===================================================================
  // FEATURE FLAG: FINANCE MODULE DISABLED (Phase 1)
  // ===================================================================

  if (!featureFlags.financeEnabled) {
    // Return mocks immédiatement
    return {
      documents: [],
      loading: false,
      error: 'Module Finance désactivé (Phase 1)',
      createDocument: async () => {},
      updateDocument: async () => {},
      deleteDocument: async () => {},
      refresh: () => {}
    }
  }

  // Fetch documents avec filtres
  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('financial_documents')
        .select(`
          *,
          partner:organisations!partner_id(id, legal_name, trade_name, type),
          expense_category:expense_categories(id, name, account_code)
        `)
        .is('deleted_at', null)
        .order('document_date', { ascending: false })

      // Appliquer filtres
      if (filters?.document_type) {
        if (Array.isArray(filters.document_type)) {
          query = query.in('document_type', filters.document_type)
        } else {
          query = query.eq('document_type', filters.document_type)
        }
      }

      if (filters?.document_direction) {
        query = query.eq('document_direction', filters.document_direction)
      }

      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          query = query.in('status', filters.status)
        } else {
          query = query.eq('status', filters.status)
        }
      }

      if (filters?.partner_id) {
        query = query.eq('partner_id', filters.partner_id)
      }

      if (filters?.date_from) {
        query = query.gte('document_date', filters.date_from)
      }

      if (filters?.date_to) {
        query = query.lte('document_date', filters.date_to)
      }

      if (filters?.search) {
        query = query.or(
          `document_number.ilike.%${filters.search}%,` +
          `description.ilike.%${filters.search}%,` +
          `notes.ilike.%${filters.search}%`
        )
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setDocuments(data as unknown as FinancialDocument[])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur chargement documents'
      setError(message)
      console.error('Fetch financial documents error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Créer facture client depuis commande
  const createCustomerInvoice = async (salesOrderId: string) => {
    try {
      const { data, error: rpcError } = await (supabase as any)
        .rpc('create_customer_invoice_from_order', {
          p_sales_order_id: salesOrderId
        })

      if (rpcError) throw rpcError

      toast.success('Facture client créée avec succès')
      await fetchDocuments() // Refresh liste

      return data as FinancialDocument
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur création facture'
      toast.error(message)
      throw err
    }
  }

  // Créer facture fournisseur
  const createSupplierInvoice = async (params: {
    supplier_id: string
    purchase_order_id: string | null
    invoice_number: string
    invoice_date: string
    due_date: string
    total_ht: number
    total_ttc: number
    tva_amount: number
    uploaded_file_url: string
    notes?: string
  }) => {
    try {
      const { data, error: rpcError } = await (supabase as any)
        .rpc('create_supplier_invoice', {
          p_supplier_id: params.supplier_id,
          p_purchase_order_id: params.purchase_order_id,
          p_invoice_number: params.invoice_number,
          p_invoice_date: params.invoice_date,
          p_due_date: params.due_date,
          p_total_ht: params.total_ht,
          p_total_ttc: params.total_ttc,
          p_tva_amount: params.tva_amount,
          p_uploaded_file_url: params.uploaded_file_url,
          p_notes: params.notes || null
        })

      if (rpcError) throw rpcError

      toast.success('Facture fournisseur créée avec succès')
      await fetchDocuments()

      return data as FinancialDocument
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur création facture fournisseur'
      toast.error(message)
      throw err
    }
  }

  // Créer dépense
  const createExpense = async (params: {
    supplier_id: string
    expense_category_id: string
    description: string
    amount_ht: number
    amount_ttc: number
    tva_amount: number
    expense_date: string
    uploaded_file_url?: string
    notes?: string
  }) => {
    try {
      const { data, error: rpcError } = await (supabase as any)
        .rpc('create_expense', {
          p_supplier_id: params.supplier_id,
          p_expense_category_id: params.expense_category_id,
          p_description: params.description,
          p_amount_ht: params.amount_ht,
          p_amount_ttc: params.amount_ttc,
          p_tva_amount: params.tva_amount,
          p_expense_date: params.expense_date,
          p_uploaded_file_url: params.uploaded_file_url || null,
          p_notes: params.notes || null
        })

      if (rpcError) throw rpcError

      toast.success('Dépense créée avec succès')
      await fetchDocuments()

      return data as FinancialDocument
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur création dépense'
      toast.error(message)
      throw err
    }
  }

  // Mettre à jour statut
  const updateStatus = async (documentId: string, newStatus: DocumentStatus) => {
    try {
      const { error: updateError } = await supabase
        .from('financial_documents')
        .update({ status: newStatus })
        .eq('id', documentId)

      if (updateError) throw updateError

      toast.success('Statut mis à jour')
      await fetchDocuments()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur mise à jour statut'
      toast.error(message)
      throw err
    }
  }

  // Soft delete
  const deleteDocument = async (documentId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('financial_documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', documentId)

      if (deleteError) throw deleteError

      toast.success('Document supprimé')
      await fetchDocuments()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur suppression document'
      toast.error(message)
      throw err
    }
  }

  // Stats pour dashboard
  const getStats = () => {
    const inbound = documents.filter(d => d.document_direction === 'inbound')
    const outbound = documents.filter(d => d.document_direction === 'outbound')

    return {
      total_documents: documents.length,

      inbound: {
        count: inbound.length,
        total_invoiced: inbound.reduce((sum, d) => sum + d.total_ttc, 0),
        total_paid: inbound.reduce((sum, d) => sum + d.amount_paid, 0),
        unpaid_count: inbound.filter(d => d.status !== 'paid').length
      },

      outbound: {
        count: outbound.length,
        total_invoiced: outbound.reduce((sum, d) => sum + d.total_ttc, 0),
        total_paid: outbound.reduce((sum, d) => sum + d.amount_paid, 0),
        unpaid_count: outbound.filter(d => d.status !== 'paid').length
      },

      net_cash_flow: inbound.reduce((sum, d) => sum + d.amount_paid, 0) -
                     outbound.reduce((sum, d) => sum + d.amount_paid, 0)
    }
  }

  // Auto-fetch au mount
  useEffect(() => {
    fetchDocuments()
  }, [JSON.stringify(filters)]) // Re-fetch si filtres changent

  return {
    documents,
    loading,
    error,
    stats: getStats(),

    // Actions
    refresh: fetchDocuments,
    createCustomerInvoice,
    createSupplierInvoice,
    createExpense,
    updateStatus,
    deleteDocument
  }
}
