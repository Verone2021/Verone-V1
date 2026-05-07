'use client';

import Link from 'next/link';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { StatusPill, qontoInvoiceStatusConfig } from '@verone/ui-business';
import { DocumentSourceBadge } from '@verone/finance/components';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Clock,
  Loader2,
  MinusCircle,
  MoreHorizontal,
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

import { type DocumentType, type QontoDocument } from './types';

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
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <Link href="/factures">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            {/* [BO-RLS-PERF-002] Numéro de facture jamais tronqué (whitespace-nowrap)
                + sous-titre "Facture Qonto" supprimé (demande Roméo 2026-05-07) */}
            <h1 className="text-2xl font-bold whitespace-nowrap">
              {docNumber}
            </h1>
            <StatusPill
              status={document.status}
              config={qontoInvoiceStatusConfig}
              size="md"
            />
            {documentType === 'invoice' && (
              <DocumentSourceBadge hasOrderLink={!!salesOrderId} />
            )}
            {isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <Clock className="h-3 w-3" />
                En retard
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* [BO-RLS-PERF-002] Actions regroupées (demande Roméo 2026-05-07):
          - Visibles toujours : Voir PDF + bouton principal contextuel
          - Menu "..." : email, paiement, rapprochement, convertir, etc.
      */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Voir PDF — toujours visible */}
        <Button variant="outline" onClick={onDownloadPdf}>
          <FileText className="h-4 w-4 mr-2" />
          Voir PDF
        </Button>

        {/* Bouton principal contextuel selon état */}
        {isDraft && documentType === 'invoice' && salesOrderId && (
          <Button variant="outline" asChild>
            <Link href={`/commandes/clients?orderId=${salesOrderId}`}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier la commande source
            </Link>
          </Button>
        )}
        {isDraft && documentType === 'invoice' && !salesOrderId && (
          <Button variant="outline" asChild>
            <Link href={`/factures/${id}/edit?type=invoice`}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
        )}
        {isDraft && documentType === 'quote' && (
          <Button variant="outline" asChild>
            <Link href={`/factures/${id}/edit?type=quote`}>
              <Pencil className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
        )}

        {/* Finaliser — bouton mis en valeur si brouillon */}
        {isDraft && (
          <Button
            onClick={onShowFinalize}
            disabled={actionLoading === 'finalize'}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {actionLoading === 'finalize' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Finaliser
          </Button>
        )}

        {/* Convertir devis → facture (visible si pertinent) */}
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

        {/* Menu "..." pour les actions secondaires */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Plus d'actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {(isDraft || isFinalized) && (
              <DropdownMenuItem
                onClick={onSendEmail}
                disabled={actionLoading === 'email'}
              >
                {actionLoading === 'email' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Envoyer par email
              </DropdownMenuItem>
            )}

            {documentType === 'invoice' && isFinalized && !isPaid && (
              <>
                <DropdownMenuItem onClick={onShowPayment}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Enregistrer paiement
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onShowReconcile}>
                  <Landmark className="h-4 w-4 mr-2" />
                  Rapprochement bancaire
                </DropdownMenuItem>
              </>
            )}

            {documentType === 'quote' && document.status === 'finalized' && (
              <>
                <DropdownMenuItem
                  onClick={onShowAccept}
                  disabled={actionLoading === 'accept'}
                  className="text-green-700 focus:text-green-800"
                >
                  {actionLoading === 'accept' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Accepter le devis
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={onShowDecline}
                  disabled={actionLoading === 'decline'}
                  className="text-red-700 focus:text-red-800"
                >
                  {actionLoading === 'decline' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Refuser le devis
                </DropdownMenuItem>
              </>
            )}

            {documentType === 'invoice' && isFinalized && (
              <DropdownMenuItem onClick={onShowCreditNote}>
                <MinusCircle className="h-4 w-4 mr-2" />
                Créer un avoir
              </DropdownMenuItem>
            )}

            {documentType === 'invoice' &&
              !isCancelled &&
              document?.status !== 'draft' && (
                <DropdownMenuItem
                  onClick={onShowArchive}
                  disabled={actionLoading === 'archive'}
                >
                  {actionLoading === 'archive' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4 mr-2" />
                  )}
                  Archiver
                </DropdownMenuItem>
              )}

            {isDraft && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onShowDelete}
                  disabled={actionLoading === 'delete'}
                  className="text-red-700 focus:text-red-800"
                >
                  {actionLoading === 'delete' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Supprimer le brouillon
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
