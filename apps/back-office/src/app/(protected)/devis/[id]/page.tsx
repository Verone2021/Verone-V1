'use client';

import { useParams, useRouter } from 'next/navigation';

import { Skeleton } from '@verone/ui';

import { QuoteDialogs } from './quote-dialogs';
import {
  QuoteActions,
  QuoteAmounts,
  QuoteHeader,
  QuoteInfo,
  QuoteItemsTable,
  QuoteNotices,
} from './quote-sections';
import type { UseQuoteDetailReturn } from './use-quote-detail';
import { useQuoteDetail } from './use-quote-detail';

// ---------------------------------------------------------------------------
// Inner content (rendered only when quote is loaded)
// ---------------------------------------------------------------------------

function QuotePageContent({
  detail,
  id,
  onBack,
  onNavigate,
}: {
  detail: UseQuoteDetailReturn;
  id: string;
  onBack: () => void;
  onNavigate: (path: string) => void;
}): React.ReactNode {
  const { quote } = detail;
  if (!quote) return null;

  // Qonto uses 'pending_approval' for drafts, we also handle 'draft' for compatibility
  const isDraft =
    quote.status === 'draft' || quote.status === 'pending_approval';
  const isFinalized = ['finalized', 'accepted', 'declined', 'expired'].includes(
    quote.status
  );
  const canFinalize = isDraft;
  const canDelete = isDraft;
  const canConvert =
    quote.status === 'finalized' && !quote.converted_to_invoice_id;

  return (
    <div className="container mx-auto space-y-6 py-6">
      <QuoteHeader quote={quote} onBack={onBack} />
      <QuoteActions
        quoteId={id}
        quote={quote}
        canFinalize={canFinalize}
        canDelete={canDelete}
        canConvert={canConvert}
        actionLoading={detail.actionLoading}
        onFinalizeClick={() => detail.setShowFinalizeWarning(true)}
        onDeleteClick={() => detail.setShowDeleteWarning(true)}
        onConvertClick={() => detail.setShowConvertWarning(true)}
        onDownloadPdf={() => void detail.handleDownloadPdf()}
      />
      <QuoteNotices
        quote={quote}
        isDraft={isDraft}
        isFinalized={isFinalized}
        onNavigateToInvoice={invoiceId => onNavigate(`/factures/${invoiceId}`)}
      />
      <QuoteItemsTable quote={quote} />
      <div className="grid gap-6 md:grid-cols-2">
        <QuoteInfo quote={quote} />
        <QuoteAmounts quote={quote} />
      </div>
      <QuoteDialogs
        quote={quote}
        showFinalizeWarning={detail.showFinalizeWarning}
        showDeleteWarning={detail.showDeleteWarning}
        showConvertWarning={detail.showConvertWarning}
        onFinalizeOpenChange={detail.setShowFinalizeWarning}
        onDeleteOpenChange={detail.setShowDeleteWarning}
        onConvertOpenChange={detail.setShowConvertWarning}
        onFinalizeConfirm={() => void detail.handleFinalize()}
        onDeleteConfirm={() => void detail.handleDelete()}
        onConvertConfirm={() => void detail.handleConvert()}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page entry point
// ---------------------------------------------------------------------------

export default function QuoteDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const detail = useQuoteDetail(id);

  if (detail.loading) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (detail.error || !detail.quote) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
          {detail.error ?? 'Devis non trouvé'}
        </div>
      </div>
    );
  }

  return (
    <QuotePageContent
      detail={detail}
      id={id}
      onBack={() => router.back()}
      onNavigate={path => router.push(path)}
    />
  );
}
