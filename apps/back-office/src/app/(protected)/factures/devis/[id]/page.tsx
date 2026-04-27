'use client';

import { useState, useEffect, useCallback, use } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { QuoteStatusBadge } from '@verone/finance/components';
import { useDocumentEmails } from '@verone/finance/hooks';
import { Badge, Button } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Mail,
  Trash2,
} from 'lucide-react';

import type { QontoQuoteDetail, ApiResponse, StatusAction } from './types';
import { getStatusActions } from './status-actions';
import { DevisContent } from './DevisContent';
import { DevisDialogs } from './DevisDialogs';

interface QuoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function QuoteDetailPage({ params }: QuoteDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [quote, setQuote] = useState<QontoQuoteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<StatusAction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // Détecte si le devis est lié à une consultation (pour adapter le mail).
  const [fromConsultation, setFromConsultation] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('financial_documents')
          .select('consultation_id')
          .eq('qonto_invoice_id', id)
          .maybeSingle();
        setFromConsultation(Boolean(data?.consultation_id));
      } catch (err) {
        console.error('[QuoteDetail] consultation check failed:', err);
      }
    })();
  }, [id]);

  const {
    emails: documentEmails,
    loading: emailsLoading,
    fetchEmails,
  } = useDocumentEmails(id);

  const loadQuote = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/qonto/quotes/${id}`);
      const data = (await response.json()) as ApiResponse;
      if (!response.ok || !data.success || !data.quote) {
        throw new Error(data.error ?? 'Devis introuvable');
      }
      setQuote(data.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadQuote();
  }, [loadQuote]);

  const handleAction = useCallback(
    async (action: string) => {
      setActionLoading(true);
      try {
        const response = await fetch(`/api/qonto/quotes/${id}/${action}`, {
          method: 'POST',
        });
        const data = (await response.json()) as {
          success: boolean;
          error?: string;
        };
        if (!response.ok || !data.success)
          throw new Error(data.error ?? `Erreur: ${action}`);
        toast.success(
          action === 'finalize'
            ? 'Devis finalise'
            : action === 'accept'
              ? 'Devis accepte'
              : action === 'decline'
                ? 'Devis refuse'
                : action === 'convert'
                  ? 'Facture creee depuis le devis'
                  : 'Action effectuee'
        );
        await loadQuote();
      } catch (err) {
        console.error(`[QuoteDetail] ${action} error:`, err);
        toast.error(err instanceof Error ? err.message : 'Erreur');
      } finally {
        setActionLoading(false);
        setConfirmAction(null);
      }
    },
    [id, loadQuote]
  );

  const handleDelete = useCallback(async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/qonto/quotes/${id}`, {
        method: 'DELETE',
      });
      const data = (await response.json()) as {
        success: boolean;
        error?: string;
      };
      if (!response.ok || !data.success)
        throw new Error(data.error ?? 'Erreur de suppression');
      toast.success('Devis supprime');
      router.push('/factures?tab=devis');
    } catch (err) {
      console.error('[QuoteDetail] delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [id, router]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const response = await fetch(`/api/qonto/quotes/${id}/pdf`);
      if (!response.ok) throw new Error('Erreur telechargement PDF');
      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Le PDF est vide');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devis-${quote?.number ?? quote?.quote_number ?? id}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 1000);
    } catch (err) {
      console.error('[QuoteDetail] PDF download error:', err);
      toast.error(err instanceof Error ? err.message : 'Erreur PDF');
    }
  }, [id, quote?.number, quote?.quote_number]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <FileText className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{error ?? 'Devis introuvable'}</p>
        <Button variant="outline" asChild>
          <Link href="/factures?tab=devis">Retour aux devis</Link>
        </Button>
      </div>
    );
  }

  const statusActions = getStatusActions(quote.status);
  const canDelete = !quote.converted_to_invoice_id;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/factures?tab=devis">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {quote.number ?? quote.quote_number ?? '-'}
              </h1>
              <QuoteStatusBadge status={quote.status} />
              {quote.converted_to_invoice_id && (
                <Badge variant="outline" className="text-xs">
                  Converti
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Cree le{' '}
              {new Date(quote.created_at).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
              {quote.expiry_date &&
                ` — Valide jusqu'au ${new Date(quote.expiry_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusActions.map(action => (
            <Button
              key={action.action}
              variant={action.variant}
              onClick={() => setConfirmAction(action)}
              disabled={actionLoading}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              window.open(`/api/qonto/quotes/${quote.id}/pdf`, '_blank')
            }
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Voir PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              void handleDownloadPdf().catch(console.error);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Telecharger
          </Button>
          <Button variant="outline" onClick={() => setShowEmailModal(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Envoyer par email
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      <DevisContent quote={quote} />

      {/* DIALOGS */}
      <DevisDialogs
        quote={quote}
        id={id}
        confirmAction={confirmAction}
        onConfirmActionClose={() => setConfirmAction(null)}
        onConfirmAction={action => {
          void handleAction(action).catch(console.error);
        }}
        actionLoading={actionLoading}
        showEmailModal={showEmailModal}
        onEmailModalClose={() => setShowEmailModal(false)}
        onEmailSent={() => {
          void fetchEmails().catch(err => {
            console.error('[QuoteDetail] Refresh emails failed:', err);
          });
        }}
        fromConsultation={fromConsultation}
        showDeleteConfirm={showDeleteConfirm}
        onDeleteConfirmClose={setShowDeleteConfirm}
        onDelete={() => {
          void handleDelete().catch(console.error);
        }}
        documentEmails={documentEmails}
        emailsLoading={emailsLoading}
      />
    </div>
  );
}
