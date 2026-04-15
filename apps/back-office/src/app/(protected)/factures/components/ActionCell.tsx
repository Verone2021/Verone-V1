'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Eye,
  FileText,
  Download,
  MoreHorizontal,
  Pencil,
  Loader2,
} from 'lucide-react';

import { buildMenuItems } from './ActionCellMenuItems';

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

  const menuItems = buildMenuItems({
    type,
    status,
    loading,
    linkedInvoiceId,
    isDraft,
    isFinalized,
    canCreateCreditNote,
    isArchived,
    workflowStatus,
    handleAction: (action, name) => {
      void handleAction(action, name);
    },
    onFinalize,
    onTransformToInvoice,
    onTransformToQuote,
    onCreateCreditNote,
    onMarkPaid,
    onSendEmail,
    onReconcile,
    onAccept,
    onDecline,
    onArchive,
    onUnarchive,
  });

  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" asChild title="Voir details">
        <Link href={detailPath}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.open(pdfPath, '_blank')}
        title="Voir PDF"
        className="text-primary hover:text-primary hover:bg-primary/10"
      >
        <FileText className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => void handleAction(onDownloadPdf, 'download')}
        title="Telecharger PDF"
        disabled={loading === 'download'}
      >
        {loading === 'download' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
      {isDraft && (
        <Button variant="ghost" size="icon" asChild title="Modifier">
          <Link href={`${detailPath}/edit`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
      )}
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
