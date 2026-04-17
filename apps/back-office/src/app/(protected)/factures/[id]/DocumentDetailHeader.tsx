'use client';

import Link from 'next/link';

import { Badge, Button } from '@verone/ui';
import { StatusPill, qontoInvoiceStatusConfig } from '@verone/ui-business';
import { DocumentSourceBadge } from '@verone/finance/components';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Clock,
  Loader2,
  MinusCircle,
  Send,
  Trash2,
  Mail,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Pencil,
  Landmark,
  Archive,
} from 'lucide-react';

import {
  type DocumentType,
  type QontoDocument,
  getDocumentTypeLabel,
} from './types';

interface DocumentDetailHeaderProps {
  id: string;
  document: QontoDocument;
  documentType: DocumentType;
  docNumber: string;
  isDraft: boolean;
  isFinalized: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  isOverdue: string | boolean | null | undefined;
  salesOrderId?: string | null;
  actionLoading: string | null;
  onDownloadPdf: () => void;
  onSendEmail: () => void;
  onShowFinalize: () => void;
  onShowDelete: () => void;
  onShowConvert: () => void;
  onShowAccept: () => void;
  onShowDecline: () => void;
  onShowCreditNote: () => void;
  onShowPayment: () => void;
  onShowReconcile: () => void;
  onShowArchive: () => void;
}

export function DocumentDetailHeader({
  id,
  document,
  documentType,
  docNumber,
  isDraft,
  isFinalized,
  isPaid,
  isCancelled,
  isOverdue,
  salesOrderId,
  actionLoading,
  onDownloadPdf,
  onSendEmail,
  onShowFinalize,
  onShowDelete,
  onShowConvert,
  onShowAccept,
  onShowDecline,
  onShowCreditNote,
  onShowPayment,
  onShowReconcile,
  onShowArchive,
}: DocumentDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/factures">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{docNumber}</h1>
            <StatusPill
              status={document.status}
              config={qontoInvoiceStatusConfig}
              size="md"
            />
            <DocumentSourceBadge hasOrderLink={!!salesOrderId} />
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                En retard
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {getDocumentTypeLabel(documentType)} Qonto
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* PDF */}
        <Button variant="outline" onClick={onDownloadPdf}>
          <FileText className="h-4 w-4 mr-2" />
          Voir PDF
        </Button>

        {/* Edit (drafts only) */}
        {isDraft && (
          <Button variant="outline" asChild>
            <Link href={`/factures/${id}/edit?type=${documentType}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
        )}

        {/* Finalize (drafts only) */}
        {isDraft && (
          <Button
            variant="outline"
            onClick={onShowFinalize}
            disabled={actionLoading === 'finalize'}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            {actionLoading === 'finalize' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Finaliser
          </Button>
        )}

        {/* Send email (draft or finalized) */}
        {(isDraft || isFinalized) && (
          <Button
            variant="outline"
            onClick={onSendEmail}
            disabled={actionLoading === 'email'}
          >
            {actionLoading === 'email' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Mail className="h-4 w-4 mr-2" />
            )}
            Envoyer par email
          </Button>
        )}

        {/* Payment actions (invoices, finalized, not paid) */}
        {documentType === 'invoice' && isFinalized && !isPaid && (
          <>
            <Button variant="outline" onClick={onShowPayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Enregistrer paiement
            </Button>
            <Button variant="outline" onClick={onShowReconcile}>
              <Landmark className="h-4 w-4 mr-2" />
              Rapprochement bancaire
            </Button>
          </>
        )}

        {/* Convert to invoice (quotes) */}
        {documentType === 'quote' &&
          (document.status === 'finalized' ||
            document.status === 'accepted') && (
            <Button
              variant="outline"
              onClick={onShowConvert}
              disabled={actionLoading === 'convert'}
            >
              {actionLoading === 'convert' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Convertir en facture
            </Button>
          )}

        {/* Accept/Decline (quotes, finalized) */}
        {documentType === 'quote' && document.status === 'finalized' && (
          <>
            <Button
              variant="outline"
              onClick={onShowAccept}
              disabled={actionLoading === 'accept'}
              className="border-green-300 text-green-700 hover:bg-green-50"
            >
              {actionLoading === 'accept' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Accepter
            </Button>
            <Button
              variant="outline"
              onClick={onShowDecline}
              disabled={actionLoading === 'decline'}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              {actionLoading === 'decline' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Refuser
            </Button>
          </>
        )}

        {/* Create credit note (invoices, finalized) */}
        {documentType === 'invoice' && isFinalized && (
          <Button variant="outline" onClick={onShowCreditNote}>
            <MinusCircle className="h-4 w-4 mr-2" />
            Créer un avoir
          </Button>
        )}

        {/* Archive (validated invoices only) */}
        {documentType === 'invoice' &&
          !isCancelled &&
          document?.status !== 'draft' && (
            <Button
              variant="outline"
              onClick={onShowArchive}
              disabled={actionLoading === 'archive'}
            >
              {actionLoading === 'archive' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              Archiver
            </Button>
          )}

        {/* Delete (drafts only) */}
        {isDraft && (
          <Button
            variant="outline"
            onClick={onShowDelete}
            disabled={actionLoading === 'delete'}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            {actionLoading === 'delete' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
