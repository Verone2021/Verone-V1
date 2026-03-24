'use client';

import { Button } from '@verone/ui';
import {
  Download,
  Edit,
  ExternalLink,
  FileSignature,
  FileX,
  Loader2,
  Save,
  Send,
  X,
} from 'lucide-react';

import type { InvoiceDetail } from './types';

interface InvoiceFooterActionsProps {
  invoice: InvoiceDetail;
  isEditing: boolean;
  isEditable: boolean;
  isSaving: boolean;
  isActionLoading: boolean;
  isCreatingQuote: boolean;
  quoteData: {
    id: string;
    quote_number: string;
    pdf_url: string | null;
  } | null;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onClose: () => void;
  onFinalize?: (invoiceId: string) => void;
  onCreateQuote: () => void;
  onDownloadPdf: () => void;
  onOpenQonto: () => void;
  onCreateCreditNote: () => void;
}

export function InvoiceFooterActions({
  invoice,
  isEditing,
  isEditable,
  isSaving,
  isActionLoading,
  isCreatingQuote,
  quoteData,
  onStartEdit,
  onCancelEdit,
  onSave,
  onClose,
  onFinalize,
  onCreateQuote,
  onDownloadPdf,
  onOpenQonto,
  onCreateCreditNote,
}: InvoiceFooterActionsProps): React.ReactNode {
  return (
    <>
      {/* Mode affichage */}
      {!isEditing && (
        <>
          {/* Bouton Modifier - visible si editable */}
          {isEditable && (
            <Button variant="outline" onClick={onStartEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          )}

          {/* Bouton Finaliser - visible si brouillon */}
          {invoice.status === 'draft' && onFinalize && (
            <Button
              onClick={() => onFinalize(invoice.id)}
              disabled={isActionLoading}
            >
              {isActionLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Finaliser (PDF)
            </Button>
          )}

          {/* Bouton Creer devis - visible si brouillon */}
          {invoice.status === 'draft' && (
            <Button
              variant="outline"
              onClick={onCreateQuote}
              disabled={isCreatingQuote}
            >
              {isCreatingQuote ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSignature className="mr-2 h-4 w-4" />
              )}
              Creer un devis
            </Button>
          )}

          {/* Afficher les actions du devis si cree */}
          {quoteData?.pdf_url && (
            <Button
              variant="outline"
              onClick={() => window.open(quoteData.pdf_url!, '_blank')}
            >
              <Download className="mr-2 h-4 w-4" />
              Telecharger devis ({quoteData.quote_number})
            </Button>
          )}

          {/* Bouton Creer un avoir - visible si finalisee/envoyee/payee */}
          {invoice.status !== 'draft' && invoice.status !== 'cancelled' && (
            <Button variant="outline" onClick={onCreateCreditNote}>
              <FileX className="mr-2 h-4 w-4" />
              Creer un avoir
            </Button>
          )}

          {/* Bouton Telecharger PDF - visible si finalise */}
          {invoice.status !== 'draft' &&
            invoice.status !== 'cancelled' &&
            invoice.qonto_pdf_url && (
              <Button variant="outline" onClick={onDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Telecharger PDF
              </Button>
            )}

          {/* Bouton Voir sur Qonto - visible si finalise et URL publique */}
          {invoice.qonto_public_url && (
            <Button variant="outline" onClick={onOpenQonto}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Voir sur Qonto
            </Button>
          )}
        </>
      )}

      {/* Mode edition */}
      {isEditing && (
        <>
          <Button variant="outline" onClick={onCancelEdit} disabled={isSaving}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Sauvegarder et synchroniser
          </Button>
        </>
      )}

      {!isEditing && (
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
      )}
    </>
  );
}
