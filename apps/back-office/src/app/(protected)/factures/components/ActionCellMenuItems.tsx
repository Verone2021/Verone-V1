'use client';

import Link from 'next/link';

import { DropdownMenuItem, DropdownMenuSeparator } from '@verone/ui';
import {
  Eye,
  FileX,
  ArrowRightLeft,
  CreditCard,
  Mail,
  Send,
  FileCheck,
  CheckCircle,
  XCircle,
  Archive,
  ArchiveRestore,
  Loader2,
} from 'lucide-react';

type DocumentType = 'invoice' | 'quote' | 'credit_note';
type DocumentStatus = string;

interface MenuItemsProps {
  type: DocumentType;
  status: DocumentStatus;
  loading: string | null;
  linkedInvoiceId?: string;
  isDraft: boolean;
  isFinalized: boolean;
  canCreateCreditNote: boolean;
  isArchived?: boolean;
  workflowStatus?: string | null;
  handleAction: (
    action: (() => Promise<void>) | undefined,
    name: string
  ) => void;
  onFinalize?: () => Promise<void>;
  onTransformToInvoice?: () => Promise<void>;
  onTransformToQuote?: () => Promise<void>;
  onCreateCreditNote?: () => Promise<void>;
  onMarkPaid?: () => Promise<void>;
  onSendEmail?: () => Promise<void>;
  onReconcile?: () => Promise<void>;
  onAccept?: () => Promise<void>;
  onDecline?: () => Promise<void>;
  onArchive?: () => Promise<void>;
  onUnarchive?: () => Promise<void>;
}

function ActionMenuItem({
  key,
  actionName,
  loading,
  onClick,
  icon: Icon,
  label,
}: {
  key?: string;
  actionName: string;
  loading: string | null;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <DropdownMenuItem
      key={key}
      onClick={onClick}
      disabled={loading === actionName}
    >
      {loading === actionName ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Icon className="h-4 w-4 mr-2" />
      )}
      {label}
    </DropdownMenuItem>
  );
}

export function buildMenuItems({
  type,
  status,
  loading,
  linkedInvoiceId,
  isDraft,
  isFinalized,
  canCreateCreditNote,
  isArchived,
  workflowStatus,
  handleAction,
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
}: MenuItemsProps): React.ReactNode[] {
  const items: React.ReactNode[] = [];

  if (type === 'invoice') {
    if (isDraft) {
      if (onFinalize)
        items.push(
          <ActionMenuItem
            key="finalize"
            actionName="finalize"
            loading={loading}
            onClick={() => handleAction(onFinalize, 'finalize')}
            icon={FileCheck}
            label="Finaliser"
          />
        );
      if (onTransformToQuote)
        items.push(
          <ActionMenuItem
            key="toQuote"
            actionName="toQuote"
            loading={loading}
            onClick={() => handleAction(onTransformToQuote, 'toQuote')}
            icon={ArrowRightLeft}
            label="Transformer en devis"
          />
        );
    }
    if (isFinalized && status !== 'paid') {
      if (onMarkPaid)
        items.push(
          <ActionMenuItem
            key="markPaid"
            actionName="markPaid"
            loading={loading}
            onClick={() => handleAction(onMarkPaid, 'markPaid')}
            icon={CreditCard}
            label="Marquer payee"
          />
        );
      if (onSendEmail)
        items.push(
          <ActionMenuItem
            key="sendEmail"
            actionName="sendEmail"
            loading={loading}
            onClick={() => handleAction(onSendEmail, 'sendEmail')}
            icon={Mail}
            label="Envoyer par email"
          />
        );
      if (onReconcile)
        items.push(
          <ActionMenuItem
            key="reconcile"
            actionName="reconcile"
            loading={loading}
            onClick={() => handleAction(onReconcile, 'reconcile')}
            icon={ArrowRightLeft}
            label="Reconcilier transaction"
          />
        );
    }
    if (canCreateCreditNote && onCreateCreditNote) {
      if (items.length > 0) items.push(<DropdownMenuSeparator key="sep1" />);
      items.push(
        <ActionMenuItem
          key="createCreditNote"
          actionName="createCreditNote"
          loading={loading}
          onClick={() => handleAction(onCreateCreditNote, 'createCreditNote')}
          icon={FileX}
          label="Creer un avoir"
        />
      );
    }
    if (
      !isArchived &&
      ['draft_validated', 'finalized', 'sent', 'paid'].includes(
        workflowStatus ?? ''
      ) &&
      onArchive
    ) {
      if (items.length > 0)
        items.push(<DropdownMenuSeparator key="sep-archive" />);
      items.push(
        <ActionMenuItem
          key="archive"
          actionName="archive"
          loading={loading}
          onClick={() => handleAction(onArchive, 'archive')}
          icon={Archive}
          label="Archiver"
        />
      );
    }
    if (isArchived && onUnarchive) {
      if (items.length > 0)
        items.push(<DropdownMenuSeparator key="sep-unarchive" />);
      items.push(
        <ActionMenuItem
          key="unarchive"
          actionName="unarchive"
          loading={loading}
          onClick={() => handleAction(onUnarchive, 'unarchive')}
          icon={ArchiveRestore}
          label="Desarchiver"
        />
      );
    }
  }

  if (type === 'quote') {
    if (isDraft && onFinalize)
      items.push(
        <ActionMenuItem
          key="finalize"
          actionName="finalize"
          loading={loading}
          onClick={() => handleAction(onFinalize, 'finalize')}
          icon={Send}
          label="Envoyer au client"
        />
      );
    if (
      status === 'finalized' ||
      status === 'accepted' ||
      status === 'pending_approval'
    ) {
      if (onTransformToInvoice)
        items.push(
          <ActionMenuItem
            key="toInvoice"
            actionName="toInvoice"
            loading={loading}
            onClick={() => handleAction(onTransformToInvoice, 'toInvoice')}
            icon={ArrowRightLeft}
            label="Transformer en facture"
          />
        );
      if (onSendEmail)
        items.push(
          <ActionMenuItem
            key="sendEmail"
            actionName="sendEmail"
            loading={loading}
            onClick={() => handleAction(onSendEmail, 'sendEmail')}
            icon={Mail}
            label="Envoyer par email"
          />
        );
    }
    if (status === 'finalized' || status === 'pending_approval') {
      if (items.length > 0) items.push(<DropdownMenuSeparator key="sep2" />);
      if (onAccept)
        items.push(
          <DropdownMenuItem
            key="accept"
            onClick={() => handleAction(onAccept, 'accept')}
            disabled={loading === 'accept'}
          >
            {loading === 'accept' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            )}
            Marquer accepte
          </DropdownMenuItem>
        );
      if (onDecline)
        items.push(
          <DropdownMenuItem
            key="decline"
            onClick={() => handleAction(onDecline, 'decline')}
            disabled={loading === 'decline'}
          >
            {loading === 'decline' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2 text-red-600" />
            )}
            Marquer refuse
          </DropdownMenuItem>
        );
    }
  }

  if (type === 'credit_note') {
    if (isDraft && onFinalize)
      items.push(
        <ActionMenuItem
          key="finalize"
          actionName="finalize"
          loading={loading}
          onClick={() => handleAction(onFinalize, 'finalize')}
          icon={FileCheck}
          label="Finaliser"
        />
      );
    if (status === 'finalized') {
      if (linkedInvoiceId)
        items.push(
          <DropdownMenuItem key="viewInvoice" asChild>
            <Link href={`/factures/${linkedInvoiceId}`}>
              <Eye className="h-4 w-4 mr-2" />
              Voir facture liee
            </Link>
          </DropdownMenuItem>
        );
      if (onSendEmail)
        items.push(
          <ActionMenuItem
            key="sendEmail"
            actionName="sendEmail"
            loading={loading}
            onClick={() => handleAction(onSendEmail, 'sendEmail')}
            icon={Mail}
            label="Envoyer par email"
          />
        );
    }
  }

  return items;
}
