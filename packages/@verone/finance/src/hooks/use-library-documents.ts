'use client';

import { useCallback, useEffect, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface LibraryDocument {
  id: string;
  source_table: 'financial_documents' | 'invoices' | 'bank_transactions';
  document_type: string;
  document_direction: string;
  document_number: string | null;
  document_date: string | null;
  partner_name: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  status: string | null;
  pdf_url: string | null;
  pcg_code: string | null;
  created_at: string;
}

export interface UseLibraryDocumentsReturn {
  documents: LibraryDocument[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Returns the PDF URL for a library document.
 * - financial_documents: Qonto invoice proxy (with store-on-read)
 * - bank_transactions: Qonto attachment proxy (with store-on-read)
 * - invoices: direct Abby URL
 */
export function getPdfUrl(doc: LibraryDocument): string | null {
  if (doc.source_table === 'financial_documents') {
    return `/api/qonto/invoices/${doc.id}/pdf`;
  }
  if (doc.source_table === 'bank_transactions') {
    if (!doc.pdf_url) return null;
    // pdf_url contains either local_pdf_path (e.g. "justificatifs/2024/xxx.pdf")
    // or attachment_id from Qonto. Both are served via the attachments route.
    if (doc.pdf_url.startsWith('justificatifs/')) {
      // Local PDF stored — extract attachment_id from filename
      const filename = doc.pdf_url.split('/').pop()?.replace('.pdf', '') ?? '';
      return `/api/qonto/attachments/${filename}`;
    }
    // Qonto attachment_id — proxy + store-on-read
    return `/api/qonto/attachments/${doc.pdf_url}`;
  }
  return doc.pdf_url ?? null;
}

/**
 * Hook to fetch documents from v_library_documents view.
 * Supports filtering by year, month, category, and search term.
 */
export function useLibraryDocuments(filters?: {
  year?: number;
  month?: number;
  category?: 'achats' | 'ventes' | 'avoirs';
  search?: string;
}): UseLibraryDocumentsReturn {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      let query = (supabase as { from: CallableFunction })
        .from('v_library_documents')
        .select(
          'id, source_table, document_type, document_direction, document_number, document_date, partner_name, total_ht, total_ttc, status, pdf_url, pcg_code, created_at'
        )
        .order('document_date', { ascending: false })
        .limit(200);

      // Filter by month (includes year) or year only
      if (filters?.month && filters?.year) {
        const month = String(filters.month).padStart(2, '0');
        const startDate = `${filters.year}-${month}-01`;
        const lastDay = new Date(filters.year, filters.month, 0).getDate();
        const endDate = `${filters.year}-${month}-${lastDay}`;
        query = query
          .gte('document_date', startDate)
          .lte('document_date', endDate);
      } else if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query
          .gte('document_date', startDate)
          .lte('document_date', endDate);
      }

      // Filter by category
      if (filters?.category === 'achats') {
        query = query.eq('document_direction', 'inbound');
      } else if (filters?.category === 'ventes') {
        query = query.eq('document_direction', 'outbound');
      } else if (filters?.category === 'avoirs') {
        query = query.eq('document_type', 'credit_note');
      }

      // Search
      if (filters?.search) {
        query = query.ilike('partner_name', `%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setDocuments((data ?? []) as LibraryDocument[]);
    } catch (err) {
      console.error('[useLibraryDocuments] Error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [filters?.year, filters?.month, filters?.category, filters?.search]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    isLoading,
    error,
    refetch: fetchDocuments,
  };
}
