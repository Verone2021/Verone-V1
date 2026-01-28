'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Eye,
  FileText,
  Download,
  MoreHorizontal,
  Pencil,
  Send,
  FileCheck,
  FileX,
  CreditCard,
  Mail,
  ArrowRightLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Archive,
  ArchiveRestore,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type DocumentType = 'invoice' | 'quote' | 'credit_note';

type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'unpaid'
  | 'overdue'
  | 'canceled';
type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'finalized'
  | 'accepted'
  | 'declined'
  | 'expired';
type CreditNoteStatus = 'draft' | 'finalized' | 'canceled';

type DocumentStatus = InvoiceStatus | QuoteStatus | CreditNoteStatus;

interface IActionCellProps {
  type: DocumentType;
  status: DocumentStatus;
  detailPath: string;
  pdfPath: string;
  linkedInvoiceId?: string;
  onFinalize?: () => Promise<void>;
  onTransformToInvoice?: () => Promise<void>;
  onTransformToQuote?: () => Promise<void>;
  onCreateCreditNote?: () => Promise<void>;
  onMarkPaid?: () => Promise<void>;
  onSendEmail?: () => Promise<void>;
  onReconcile?: () => Promise<void>;
  onAccept?: () => Promise<void>;
  onDecline?: () => Promise<void>;
  onDownloadPdf?: () => Promise<void>;
  isArchived?: boolean;
  onArchive?: () => Promise<void>;
  onUnarchive?: () => Promise<void>;
  workflowStatus?: string | null;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function ActionCell({
  type,
  status,
  detailPath,
  pdfPath,
  linkedInvoiceId,
  onFinalize,
  onTransformToInvoice,
  onTransformToQuote,
  onCreateCreditNote,
  onMarkPaid,
  onSendEmail,
  onReconcile,
  onAccept,
  onDecline,
  onDownloadPdf,
  isArchived,
  onArchive,
  onUnarchive,
  workflowStatus,
}: IActionCellProps): React.ReactNode {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    action: (() => Promise<void>) | undefined,
    actionName: string
  ): Promise<void> => {
    if (!action) return;
    setLoading(actionName);
    try {
      await action();
    } finally {
      setLoading(null);
    }
  };

  const isDraft =
    status === 'draft' || (type === 'quote' && status === 'pending_approval');
  const isFinalized =
    status === 'finalized' ||
    status === 'paid' ||
    status === 'unpaid' ||
    status === 'overdue' ||
    status === 'pending';
  const canCreateCreditNote =
    type === 'invoice' &&
    (status === 'finalized' || status === 'paid' || status === 'unpaid');

  // Build menu items based on type and status
  const getMenuItems = (): React.ReactNode[] => {
    const items: React.ReactNode[] = [];

    // ===== INVOICE ACTIONS =====
    if (type === 'invoice') {
      if (isDraft) {
        if (onFinalize) {
          items.push(
            <DropdownMenuItem
              key="finalize"
              onClick={() => void handleAction(onFinalize, 'finalize')}
              disabled={loading === 'finalize'}
            >
              {loading === 'finalize' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4 mr-2" />
              )}
              Finaliser
            </DropdownMenuItem>
          );
        }
        if (onTransformToQuote) {
          items.push(
            <DropdownMenuItem
              key="toQuote"
              onClick={() => void handleAction(onTransformToQuote, 'toQuote')}
              disabled={loading === 'toQuote'}
            >
              {loading === 'toQuote' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Transformer en devis
            </DropdownMenuItem>
          );
        }
      }

      if (isFinalized && status !== 'paid') {
        if (onMarkPaid) {
          items.push(
            <DropdownMenuItem
              key="markPaid"
              onClick={() => void handleAction(onMarkPaid, 'markPaid')}
              disabled={loading === 'markPaid'}
            >
              {loading === 'markPaid' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Marquer payée
            </DropdownMenuItem>
          );
        }
        if (onSendEmail) {
          items.push(
            <DropdownMenuItem
              key="sendEmail"
              onClick={() => void handleAction(onSendEmail, 'sendEmail')}
              disabled={loading === 'sendEmail'}
            >
              {loading === 'sendEmail' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Envoyer par email
            </DropdownMenuItem>
          );
        }
        if (onReconcile) {
          items.push(
            <DropdownMenuItem
              key="reconcile"
              onClick={() => void handleAction(onReconcile, 'reconcile')}
              disabled={loading === 'reconcile'}
            >
              {loading === 'reconcile' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Réconcilier transaction
            </DropdownMenuItem>
          );
        }
      }

      if (canCreateCreditNote && onCreateCreditNote) {
        if (items.length > 0) {
          items.push(<DropdownMenuSeparator key="sep1" />);
        }
        items.push(
          <DropdownMenuItem
            key="createCreditNote"
            onClick={() =>
              void handleAction(onCreateCreditNote, 'createCreditNote')
            }
            disabled={loading === 'createCreditNote'}
          >
            {loading === 'createCreditNote' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileX className="h-4 w-4 mr-2" />
            )}
            Créer un avoir
          </DropdownMenuItem>
        );
      }

      // Archive (validated invoices only, not archived)
      if (
        !isArchived &&
        ['draft_validated', 'finalized', 'sent', 'paid'].includes(
          workflowStatus ?? ''
        ) &&
        onArchive
      ) {
        if (items.length > 0) {
          items.push(<DropdownMenuSeparator key="sep-archive" />);
        }
        items.push(
          <DropdownMenuItem
            key="archive"
            onClick={() => void handleAction(onArchive, 'archive')}
            disabled={loading === 'archive'}
          >
            {loading === 'archive' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archiver
          </DropdownMenuItem>
        );
      }

      // Unarchive (archived invoices only)
      if (isArchived && onUnarchive) {
        if (items.length > 0) {
          items.push(<DropdownMenuSeparator key="sep-unarchive" />);
        }
        items.push(
          <DropdownMenuItem
            key="unarchive"
            onClick={() => void handleAction(onUnarchive, 'unarchive')}
            disabled={loading === 'unarchive'}
          >
            {loading === 'unarchive' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArchiveRestore className="h-4 w-4 mr-2" />
            )}
            Désarchiver
          </DropdownMenuItem>
        );
      }
    }

    // ===== QUOTE ACTIONS =====
    if (type === 'quote') {
      if (isDraft) {
        if (onFinalize) {
          items.push(
            <DropdownMenuItem
              key="finalize"
              onClick={() => void handleAction(onFinalize, 'finalize')}
              disabled={loading === 'finalize'}
            >
              {loading === 'finalize' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer au client
            </DropdownMenuItem>
          );
        }
      }

      if (
        status === 'finalized' ||
        status === 'accepted' ||
        status === 'pending_approval'
      ) {
        if (onTransformToInvoice) {
          items.push(
            <DropdownMenuItem
              key="toInvoice"
              onClick={() =>
                void handleAction(onTransformToInvoice, 'toInvoice')
              }
              disabled={loading === 'toInvoice'}
            >
              {loading === 'toInvoice' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Transformer en facture
            </DropdownMenuItem>
          );
        }
        if (onSendEmail) {
          items.push(
            <DropdownMenuItem
              key="sendEmail"
              onClick={() => void handleAction(onSendEmail, 'sendEmail')}
              disabled={loading === 'sendEmail'}
            >
              {loading === 'sendEmail' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Envoyer par email
            </DropdownMenuItem>
          );
        }
      }

      if (status === 'finalized' || status === 'pending_approval') {
        if (items.length > 0) {
          items.push(<DropdownMenuSeparator key="sep2" />);
        }
        if (onAccept) {
          items.push(
            <DropdownMenuItem
              key="accept"
              onClick={() => void handleAction(onAccept, 'accept')}
              disabled={loading === 'accept'}
            >
              {loading === 'accept' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              )}
              Marquer accepté
            </DropdownMenuItem>
          );
        }
        if (onDecline) {
          items.push(
            <DropdownMenuItem
              key="decline"
              onClick={() => void handleAction(onDecline, 'decline')}
              disabled={loading === 'decline'}
            >
              {loading === 'decline' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
              )}
              Marquer refusé
            </DropdownMenuItem>
          );
        }
      }
    }

    // ===== CREDIT NOTE ACTIONS =====
    if (type === 'credit_note') {
      if (isDraft && onFinalize) {
        items.push(
          <DropdownMenuItem
            key="finalize"
            onClick={() => void handleAction(onFinalize, 'finalize')}
            disabled={loading === 'finalize'}
          >
            {loading === 'finalize' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Finaliser
          </DropdownMenuItem>
        );
      }

      if (status === 'finalized') {
        if (linkedInvoiceId) {
          items.push(
            <DropdownMenuItem key="viewInvoice" asChild>
              <Link href={`/factures/${linkedInvoiceId}`}>
                <Eye className="h-4 w-4 mr-2" />
                Voir facture liée
              </Link>
            </DropdownMenuItem>
          );
        }
        if (onSendEmail) {
          items.push(
            <DropdownMenuItem
              key="sendEmail"
              onClick={() => void handleAction(onSendEmail, 'sendEmail')}
              disabled={loading === 'sendEmail'}
            >
              {loading === 'sendEmail' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Envoyer par email
            </DropdownMenuItem>
          );
        }
      }
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex justify-end gap-1">
      {/* View detail button */}
      <Button variant="ghost" size="icon" asChild title="Voir détails">
        <Link href={detailPath}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>

      {/* View PDF inline button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.open(pdfPath, '_blank')}
        title="Voir PDF"
        className="text-primary hover:text-primary hover:bg-primary/10"
      >
        <FileText className="h-4 w-4" />
      </Button>

      {/* Download PDF button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => void handleAction(onDownloadPdf, 'download')}
        title="Télécharger PDF"
        disabled={loading === 'download'}
      >
        {loading === 'download' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>

      {/* Edit button (only for drafts) */}
      {isDraft && (
        <Button variant="ghost" size="icon" asChild title="Modifier">
          <Link href={`${detailPath}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}

      {/* Actions menu (3 dots) */}
      {menuItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" title="Plus d'actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{menuItems}</DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
