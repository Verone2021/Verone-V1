'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common/hooks';

import type {
  ConvertApiResponse,
  DeleteApiResponse,
  ErrorResponse,
  Quote,
  QuoteApiResponse,
} from './quote-types';

export interface UseQuoteDetailReturn {
  quote: Quote | null;
  loading: boolean;
  error: string | null;
  actionLoading: boolean;
  showFinalizeWarning: boolean;
  showDeleteWarning: boolean;
  showConvertWarning: boolean;
  setShowFinalizeWarning: (v: boolean) => void;
  setShowDeleteWarning: (v: boolean) => void;
  setShowConvertWarning: (v: boolean) => void;
  handleFinalize: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleConvert: () => Promise<void>;
  handleDownloadPdf: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Extracted action helpers (keep useQuoteDetail under 75 lines)
// ---------------------------------------------------------------------------

interface ActionDeps {
  id: string;
  toast: ReturnType<typeof useToast>['toast'];
  setActionLoading: (v: boolean) => void;
}

async function runFinalize(
  deps: ActionDeps,
  setQuote: (q: Quote) => void,
  setWarning: (v: boolean) => void
): Promise<void> {
  setWarning(false);
  deps.setActionLoading(true);
  try {
    const response = await fetch(`/api/qonto/quotes/${deps.id}/finalize`, {
      method: 'POST',
    });
    const data = (await response.json()) as QuoteApiResponse;
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'Failed to finalize');
    }
    setQuote(data.quote);
    deps.toast({
      title: 'Devis finalisé',
      description: 'Devis finalisé avec succès',
    });
  } catch (err: unknown) {
    deps.toast({
      title: 'Erreur',
      description: err instanceof Error ? err.message : 'Erreur',
      variant: 'destructive',
    });
  } finally {
    deps.setActionLoading(false);
  }
}

async function runDelete(
  deps: ActionDeps,
  router: ReturnType<typeof useRouter>,
  setWarning: (v: boolean) => void
): Promise<void> {
  setWarning(false);
  deps.setActionLoading(true);
  try {
    const response = await fetch(`/api/qonto/quotes/${deps.id}`, {
      method: 'DELETE',
    });
    const data = (await response.json()) as DeleteApiResponse;
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'Failed to delete');
    }
    deps.toast({
      title: 'Devis supprimé',
      description: 'Devis supprimé avec succès',
    });
    router.push('/devis');
  } catch (err: unknown) {
    deps.toast({
      title: 'Erreur',
      description: err instanceof Error ? err.message : 'Erreur',
      variant: 'destructive',
    });
  } finally {
    deps.setActionLoading(false);
  }
}

async function runConvert(
  deps: ActionDeps,
  router: ReturnType<typeof useRouter>,
  setWarning: (v: boolean) => void
): Promise<void> {
  setWarning(false);
  deps.setActionLoading(true);
  try {
    const response = await fetch(`/api/qonto/quotes/${deps.id}/convert`, {
      method: 'POST',
    });
    const data = (await response.json()) as ConvertApiResponse;
    if (!response.ok || !data.success) {
      throw new Error(data.error ?? 'Failed to convert');
    }
    deps.toast({
      title: 'Devis converti',
      description: 'Facture créée en brouillon',
    });
    if (data.invoice?.id) {
      router.push(`/factures/${data.invoice.id}`);
    }
  } catch (err: unknown) {
    deps.toast({
      title: 'Erreur',
      description: err instanceof Error ? err.message : 'Erreur',
      variant: 'destructive',
    });
  } finally {
    deps.setActionLoading(false);
  }
}

async function runDownloadPdf(deps: ActionDeps, quote: Quote): Promise<void> {
  try {
    const response = await fetch(`/api/qonto/quotes/${deps.id}/pdf`);
    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as ErrorResponse;
      throw new Error(
        errorData.error ?? `Erreur ${response.status}: ${response.statusText}`
      );
    }
    const blob = await response.blob();
    if (blob.size === 0) {
      throw new Error('Le PDF est vide');
    }
    const filename = quote.quote_number ?? quote.number ?? deps.id;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devis-${filename}.pdf`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Délai avant de révoquer l'URL pour laisser le téléchargement démarrer
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 1000);
  } catch (err: unknown) {
    deps.toast({
      title: 'Erreur',
      description:
        err instanceof Error ? err.message : 'Impossible de télécharger le PDF',
      variant: 'destructive',
    });
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useQuoteDetail(id: string): UseQuoteDetailReturn {
  const router = useRouter();
  const { toast } = useToast();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFinalizeWarning, setShowFinalizeWarning] = useState(false);
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [showConvertWarning, setShowConvertWarning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchQuote = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/qonto/quotes/${id}`);
        const data = (await response.json()) as QuoteApiResponse;
        if (!response.ok || !data.success) {
          throw new Error(data.error ?? 'Failed to fetch quote');
        }
        setQuote(data.quote);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    void fetchQuote();
  }, [id]);

  const deps: ActionDeps = { id, toast, setActionLoading };

  return {
    quote,
    loading,
    error,
    actionLoading,
    showFinalizeWarning,
    showDeleteWarning,
    showConvertWarning,
    setShowFinalizeWarning,
    setShowDeleteWarning,
    setShowConvertWarning,
    handleFinalize: () =>
      runFinalize(deps, q => setQuote(q), setShowFinalizeWarning),
    handleDelete: () => runDelete(deps, router, setShowDeleteWarning),
    handleConvert: () => runConvert(deps, router, setShowConvertWarning),
    handleDownloadPdf: () =>
      quote ? runDownloadPdf(deps, quote) : Promise.resolve(),
  };
}
