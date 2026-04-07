'use client';

import type { ApiErrorResponse } from './types';
import type { UnifiedTransaction } from '../../hooks/use-unified-transactions';
import {
  AlertCircle,
  ExternalLink,
  Paperclip,
  CheckCircle,
  FileX,
  Trash2,
} from 'lucide-react';
import { cn } from '@verone/utils';
import { toast } from 'sonner';

// =====================================================================
// COMPONENT — Attachments section (contains Qonto API routes INTACT)
// =====================================================================

interface TransactionDetailAttachmentsProps {
  transaction: UnifiedTransaction;
  onRefresh: () => Promise<void>;
  compact: boolean;
  setShowUploadModal: (open: boolean) => void;
}

export function TransactionDetailAttachments({
  transaction,
  onRefresh,
  compact,
  setShowUploadModal,
}: TransactionDetailAttachmentsProps) {
  const attachmentIds = transaction.attachment_ids ?? [];
  const attachments = attachmentIds.map((id, idx) => ({
    id,
    file_name: `Pièce jointe ${idx + 1}`,
  }));
  const hasAttachment = attachments.length > 0;

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Supprimer ce justificatif ? Cette action est irréversible.'))
      return;
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
      void onRefresh().catch(error => {
        console.error(
          '[TransactionDetailContent] Refresh after delete failed:',
          error
        );
      });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
    }
  };

  if (hasAttachment) {
    return (
      <div className="space-y-1">
        {attachments.map((att, idx) => (
          <div key={att.id ?? idx} className="flex items-center gap-1.5 group">
            <button
              onClick={() =>
                window.open(`/api/qonto/attachments/${att.id}`, '_blank')
              }
              className={cn(
                'flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline flex-1 text-left',
                compact ? 'text-xs' : 'text-sm'
              )}
            >
              <Paperclip
                className={cn(
                  compact ? 'h-3 w-3' : 'h-3.5 w-3.5',
                  'flex-shrink-0'
                )}
              />
              <span className="truncate">
                {att.file_name || `Pièce jointe ${idx + 1}`}
              </span>
              <ExternalLink className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={() => {
                void handleDeleteAttachment(att.id).catch(error => {
                  console.error(
                    '[TransactionDetailContent] Delete attachment failed:',
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
        <div
          className={cn(
            'flex items-center gap-1 text-green-600',
            compact ? 'text-[10px]' : 'text-xs'
          )}
        >
          <CheckCircle className="h-3 w-3" />
          <span>{attachments.length} justificatif(s) déposé(s)</span>
        </div>
      </div>
    );
  }

  if (transaction.justification_optional) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 text-slate-500',
          compact ? 'text-xs' : 'text-sm'
        )}
      >
        <FileX className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
        <span>Non requis</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowUploadModal(true)}
      className={cn(
        'flex items-center gap-1.5 text-amber-600 hover:text-amber-800',
        compact ? 'text-xs' : 'text-sm'
      )}
    >
      <AlertCircle className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
      <span>Manquant - Cliquer pour déposer</span>
    </button>
  );
}
