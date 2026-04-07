'use client';

import { createClient } from '@verone/utils/supabase/client';
import toast from 'react-hot-toast';

import type {
  FinancialDocument,
  SalesOrder,
  PurchaseOrder,
  LinkSuccessState,
} from './types';

interface UseActionsParams {
  transactionId: string | undefined;
  remainingAmount: number;
  allocatedAmount: string;
  selectedDocumentId: string | null;
  selectedOrderId: string | null;
  selectedPurchaseOrderId: string | null;
  documents: FinancialDocument[];
  orders: SalesOrder[];
  purchaseOrders: PurchaseOrder[];
  setIsLinking: (v: boolean) => void;
  setLinkSuccess: (v: LinkSuccessState | null) => void;
  fetchAvailableItems: () => Promise<void>;
  autoAttachPDF: (documentId: string) => Promise<void>;
  autoCalculateVAT: () => Promise<void>;
  onSuccess?: () => void;
}

export function useRapprochementActions({
  transactionId,
  remainingAmount,
  allocatedAmount,
  selectedDocumentId,
  selectedOrderId,
  selectedPurchaseOrderId,
  documents,
  orders,
  purchaseOrders,
  setIsLinking,
  setLinkSuccess,
  fetchAvailableItems,
  autoAttachPDF,
  autoCalculateVAT,
  onSuccess,
}: UseActionsParams) {
  // Lier à un document
  const handleLinkDocument = async () => {
    if (!transactionId || !selectedDocumentId) return;

    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const { error } = (await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_document_id: selectedDocumentId,
          p_allocated_amount: amountToAllocate,
        }
      )) as { data: unknown; error: { message: string } | null };

      if (error) throw new Error(error.message);

      // Auto-attach PDF comme justificatif Qonto (non-bloquant)
      void autoAttachPDF(selectedDocumentId);

      const linkedDoc = documents.find(d => d.id === selectedDocumentId);
      setLinkSuccess({
        type: 'document',
        label: linkedDoc?.document_number ?? 'Document',
        amount: amountToAllocate,
      });
      // Auto-calcul TVA depuis rapprochement + rafraîchir la page
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Lier à une commande
  const handleLinkOrder = async () => {
    if (!transactionId || !selectedOrderId) return;

    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const { error } = (await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_sales_order_id: selectedOrderId,
          p_allocated_amount: amountToAllocate,
        }
      )) as { data: unknown; error: { message: string } | null };

      if (error) throw new Error(error.message);

      // Auto-attach: résoudre la facture liée à la commande et attacher son PDF
      const { data: linkedDoc } = await supabase
        .from('financial_documents')
        .select('id')
        .eq('sales_order_id', selectedOrderId)
        .eq('document_type', 'customer_invoice')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (linkedDoc) {
        void autoAttachPDF(linkedDoc.id);
      }

      const linkedOrder = orders.find(o => o.id === selectedOrderId);
      setLinkSuccess({
        type: 'sales_order',
        label: `Commande #${linkedOrder?.order_number ?? ''}`,
        amount: amountToAllocate,
      });
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Lier à une commande fournisseur
  const handleLinkPurchaseOrder = async () => {
    if (!transactionId || !selectedPurchaseOrderId) return;

    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const { error } = (await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_purchase_order_id: selectedPurchaseOrderId,
          p_allocated_amount: amountToAllocate,
        }
      )) as { data: unknown; error: { message: string } | null };

      if (error) throw new Error(error.message);

      // Auto-attach: résoudre la facture fournisseur liée et attacher son PDF
      const { data: linkedSupplierDoc } = await supabase
        .from('financial_documents')
        .select('id')
        .eq('purchase_order_id', selectedPurchaseOrderId)
        .eq('document_type', 'supplier_invoice')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (linkedSupplierDoc) {
        void autoAttachPDF(linkedSupplierDoc.id);
      }

      const linkedPO = purchaseOrders.find(
        po => po.id === selectedPurchaseOrderId
      );
      setLinkSuccess({
        type: 'purchase_order',
        label: `Commande #${linkedPO?.po_number ?? ''}`,
        amount: amountToAllocate,
      });
      void autoCalculateVAT();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Link purchase order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Supprimer un rapprochement existant (dérapprocher)
  const handleUnlink = async (linkId: string) => {
    if (!transactionId) return;

    if (
      !confirm(
        'Supprimer ce rapprochement ? La facture/commande sera remise en attente de paiement.'
      )
    ) {
      return;
    }

    try {
      const supabase = createClient();

      // 1. Récupérer le document_id du lien AVANT suppression (pour retirer l'attachment)
      const { data: linkData } = await supabase
        .from('transaction_document_links')
        .select('document_id')
        .eq('id', linkId)
        .single();

      // 2. Supprimer le lien — les triggers DB mettent à jour automatiquement :
      // - payment_status_v2 de la commande (sales_order / purchase_order)
      // - amount_paid du financial_document
      const { error } = await supabase
        .from('transaction_document_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      // 3. Retirer l'attachment Qonto associé (non-bloquant)
      if (linkData?.document_id) {
        const { data: doc } = await supabase
          .from('financial_documents')
          .select('qonto_attachment_id')
          .eq('id', linkData.document_id)
          .single();

        if (doc?.qonto_attachment_id) {
          // Supprimer l'attachment via la route API existante
          void fetch(
            `/api/qonto/attachments/${doc.qonto_attachment_id}?transactionId=${transactionId}`,
            { method: 'DELETE' }
          ).catch(err => {
            console.warn(
              '[RapprochementModal] Auto-detach failed (non-blocking):',
              err
            );
          });
        }
      }

      // 4. Vérifier s'il reste des liens pour cette transaction
      const { data: remainingLinks } = await supabase
        .from('transaction_document_links')
        .select('id')
        .eq('transaction_id', transactionId);

      // Si plus aucun lien, remettre matching_status à 'unmatched'
      if (!remainingLinks || remainingLinks.length === 0) {
        await supabase
          .from('bank_transactions')
          .update({
            matching_status: 'unmatched',
            matched_document_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', transactionId);
      }

      toast.success('Rapprochement supprime');
      // Recalculer TVA + rafraîchir modal + page
      void autoCalculateVAT();
      void fetchAvailableItems();
      onSuccess?.();
    } catch (err) {
      console.error('[RapprochementModal] Unlink error:', err);
      toast.error('Erreur lors de la suppression du rapprochement');
    }
  };

  return {
    handleLinkDocument,
    handleLinkOrder,
    handleLinkPurchaseOrder,
    handleUnlink,
  };
}
