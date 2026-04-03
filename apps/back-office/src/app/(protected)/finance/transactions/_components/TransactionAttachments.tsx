'use client';

import type { UnifiedTransaction } from '@verone/finance/hooks';
import { Separator } from '@verone/ui';
import {
  AlertCircle,
  ExternalLink,
  Paperclip,
  FileX,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type { ApiErrorResponse } from './transaction-helpers';

interface TransactionAttachmentsProps {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  onOpenUploadModal: (tx: UnifiedTransaction) => void;
}

export function TransactionAttachments({
  transaction,
  onRefresh,
  onOpenUploadModal,
}: TransactionAttachmentsProps) {
  const handleDeleteAttachment = async (attachmentId: string) => {
    if (
      !confirm('Supprimer ce justificatif ? Cette action est irréversible.')
    ) {
      return;
    }
    try {
      const res = await fetch(
        `/api/qonto/attachments/${attachmentId}?transactionId=${transaction.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const err = (await res.json()) as ApiErrorResponse;
        throw new Error(err.error ?? 'Erreur lors de la suppression');
      }
      toast.success('Justificatif supprimé');
      void onRefresh().catch(err => {
        console.error('[Transactions] Refresh after delete attachment:', err);
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
    }
  };

  const attachmentIds = transaction.attachment_ids ?? [];
  const reconciliationLabels = (transaction.reconciliation_links ?? []).map(
    link => link.label
  );
  const attachments = attachmentIds.map((id, idx) => ({
    id,
    file_name: reconciliationLabels[idx] ?? `Pièce jointe ${idx + 1}`,
  }));
  const hasAttachment = attachments.length > 0;

  return (
    <>
      <Separator className="my-0.5" />
      <div className="space-y-0.5">
        <p className="text-muted-foreground text-[10px]">Justificatif</p>
        {hasAttachment ? (
          <div className="space-y-0.5">
            {attachments.map((att, idx) => (
              <div
                key={att.id ?? idx}
                className="flex items-center gap-1.5 group"
              >
                <button
                  onClick={() =>
                    window.open(`/api/qonto/attachments/${att.id}`, '_blank')
                  }
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline flex-1 text-left"
                >
                  <Paperclip className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">
                    {att.file_name || `Pièce jointe ${idx + 1}`}
                  </span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => {
                    void handleDeleteAttachment(att.id).catch(error => {
                      console.error(
                        '[Transactions] Delete attachment failed:',
                        error
                      );
                    });
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-opacity"
                  title="Supprimer ce justificatif"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1 text-[10px] text-green-600 mt-0.5">
              <CheckCircle className="h-3 w-3" />
              <span>{attachments.length} justificatif(s) déposé(s)</span>
            </div>
          </div>
        ) : transaction.justification_optional ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <FileX className="h-3 w-3" />
            <span>Non requis</span>
          </div>
        ) : (
          <button
            onClick={() => onOpenUploadModal(transaction)}
            className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800"
          >
            <AlertCircle className="h-3 w-3" />
            <span>Manquant - Cliquer pour déposer</span>
          </button>
        )}
      </div>
    </>
  );
}
