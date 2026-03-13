/**
 * Hook: useLibraryDocuments
 * Description: Hook pour la bibliotheque comptable — recupere les documents
 * financiers avec colonnes PDF et les organise en arborescence
 * Annee > Categorie (Ventes/Achats/Avoirs) > Mois
 *
 * NOTE: Ne depend PAS du feature flag financeEnabled (acces direct)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export type LibraryDocumentType =
  | 'customer_invoice'
  | 'customer_credit_note'
  | 'supplier_invoice'
  | 'supplier_credit_note'
  | 'expense';

export type LibraryCategory = 'ventes' | 'achats' | 'avoirs';

export interface LibraryDocument {
  id: string;
  document_type: LibraryDocumentType;
  document_direction: string;
  document_number: string | null;
  document_date: string | null;
  partner_id: string | null;
  total_ht: number | null;
  total_ttc: number | null;
  status: string | null;
  local_pdf_path: string | null;
  qonto_pdf_url: string | null;
  qonto_attachment_id: string | null;
  uploaded_file_url: string | null;
  pcg_code: string | null;
  created_at: string;
  partner: {
    id: string;
    legal_name: string;
    trade_name: string | null;
    type: string | null;
  } | null;
}

export interface LibraryTreeMonth {
  month: number;
  label: string;
  count: number;
  documents: LibraryDocument[];
}

export interface LibraryTreeCategory {
  category: LibraryCategory;
  label: string;
  count: number;
  months: LibraryTreeMonth[];
}

export interface LibraryTreeYear {
  year: number;
  count: number;
  categories: LibraryTreeCategory[];
}

export interface LibraryFilters {
  year?: number;
  month?: number;
  category?: LibraryCategory;
  search?: string;
  status?: string[];
  documentTypes?: LibraryDocumentType[];
}

// =====================================================================
// HELPERS
// =====================================================================

const MONTH_LABELS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

const CATEGORY_CONFIG: Record<
  LibraryCategory,
  { label: string; types: LibraryDocumentType[] }
> = {
  ventes: {
    label: 'Ventes',
    types: ['customer_invoice'],
  },
  achats: {
    label: 'Achats',
    types: ['supplier_invoice', 'expense'],
  },
  avoirs: {
    label: 'Avoirs',
    types: ['customer_credit_note', 'supplier_credit_note'],
  },
};

function getCategory(docType: LibraryDocumentType): LibraryCategory {
  for (const [cat, config] of Object.entries(CATEGORY_CONFIG)) {
    if (config.types.includes(docType)) {
      return cat as LibraryCategory;
    }
  }
  return 'achats';
}

function buildTree(documents: LibraryDocument[]): LibraryTreeYear[] {
  const yearMap = new Map<
    number,
    Map<LibraryCategory, Map<number, LibraryDocument[]>>
  >();

  for (const doc of documents) {
    const date = doc.document_date
      ? new Date(doc.document_date)
      : new Date(doc.created_at);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    const category = getCategory(doc.document_type);

    if (!yearMap.has(year)) yearMap.set(year, new Map());
    const catMap = yearMap.get(year)!;
    if (!catMap.has(category)) catMap.set(category, new Map());
    const monthMap = catMap.get(category)!;
    if (!monthMap.has(month)) monthMap.set(month, []);
    monthMap.get(month)!.push(doc);
  }

  const tree: LibraryTreeYear[] = [];
  const sortedYears = Array.from(yearMap.keys()).sort((a, b) => b - a);

  for (const year of sortedYears) {
    const catMap = yearMap.get(year)!;
    const categories: LibraryTreeCategory[] = [];
    let yearCount = 0;

    for (const cat of ['ventes', 'achats', 'avoirs'] as LibraryCategory[]) {
      const monthMap = catMap.get(cat);
      if (!monthMap) continue;

      const months: LibraryTreeMonth[] = [];
      let catCount = 0;

      const sortedMonths = Array.from(monthMap.keys()).sort((a, b) => a - b);
      for (const m of sortedMonths) {
        const docs = monthMap.get(m)!;
        months.push({
          month: m,
          label: MONTH_LABELS[m],
          count: docs.length,
          documents: docs,
        });
        catCount += docs.length;
      }

      categories.push({
        category: cat,
        label: CATEGORY_CONFIG[cat].label,
        count: catCount,
        months,
      });
      yearCount += catCount;
    }

    tree.push({ year, count: yearCount, categories });
  }

  return tree;
}

// =====================================================================
// HOOK
// =====================================================================

const SELECT_COLUMNS = `
  id,
  document_type,
  document_direction,
  document_number,
  document_date,
  partner_id,
  total_ht,
  total_ttc,
  status,
  local_pdf_path,
  qonto_pdf_url,
  qonto_attachment_id,
  uploaded_file_url,
  pcg_code,
  created_at,
  partner:organisations!fk_partner(id, legal_name, trade_name, type)
`;

export function useLibraryDocuments(filters?: LibraryFilters) {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('financial_documents')
        .select(SELECT_COLUMNS)
        .is('deleted_at', null)
        .order('document_date', { ascending: false });

      // Filter by year
      if (filters?.year) {
        const startDate = `${filters.year}-01-01`;
        const endDate = `${filters.year}-12-31`;
        query = query
          .gte('document_date', startDate)
          .lte('document_date', endDate);
      }

      // Filter by document types (from category or explicit)
      if (filters?.documentTypes && filters.documentTypes.length > 0) {
        query = query.in('document_type', filters.documentTypes);
      } else if (filters?.category) {
        const types = CATEGORY_CONFIG[filters.category].types;
        query = query.in('document_type', types);
      }

      // Filter by status
      if (filters?.status && filters.status.length > 0) {
        query = query.in(
          'status',
          filters.status as unknown as readonly (
            | 'draft'
            | 'sent'
            | 'received'
            | 'paid'
            | 'partially_paid'
            | 'overdue'
            | 'cancelled'
            | 'refunded'
          )[]
        );
      }

      // Search
      if (filters?.search) {
        query = query.or(`document_number.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setDocuments((data as unknown as LibraryDocument[]) || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur chargement documents';
      setError(message);
      console.error('[useLibraryDocuments] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [
    supabase,
    filters?.year,
    filters?.category,
    filters?.documentTypes,
    filters?.status,
    filters?.search,
  ]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  // Build tree from all documents (client-side grouping)
  const tree = useMemo(() => buildTree(documents), [documents]);

  // Filter documents for the list view (by month if selected)
  const filteredDocuments = useMemo(() => {
    if (filters?.month !== undefined && filters?.month !== null) {
      return documents.filter(doc => {
        const date = doc.document_date
          ? new Date(doc.document_date)
          : new Date(doc.created_at);
        return date.getMonth() === filters.month;
      });
    }
    return documents;
  }, [documents, filters?.month]);

  // Stats
  const stats = useMemo(() => {
    const ventesTotal = documents
      .filter(d => getCategory(d.document_type) === 'ventes')
      .reduce((sum, d) => sum + (d.total_ht ?? 0), 0);
    const achatsTotal = documents
      .filter(d => getCategory(d.document_type) === 'achats')
      .reduce((sum, d) => sum + (d.total_ht ?? 0), 0);
    const sansPdf = documents.filter(
      d => !d.local_pdf_path && !d.qonto_pdf_url && !d.uploaded_file_url
    ).length;

    return {
      totalDocuments: documents.length,
      ventesTotal,
      achatsTotal,
      sansPdf,
    };
  }, [documents]);

  return {
    documents: filteredDocuments,
    allDocuments: documents,
    tree,
    stats,
    loading,
    error,
    refresh: fetchDocuments,
  };
}

export { CATEGORY_CONFIG, MONTH_LABELS, getCategory };
