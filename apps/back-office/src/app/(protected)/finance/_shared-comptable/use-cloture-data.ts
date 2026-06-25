'use client';

/**
 * Hook principal pour la page de clôture comptable [BO-COMPTA-001]
 *
 * Combine :
 * - useLibraryDocuments (pièces présentes depuis v_library_documents)
 * - useLibraryMissingDocuments (pièces manquantes depuis v_library_missing_documents)
 * - Enrichissement des lignes manquantes avec les colonnes bank_transactions
 *   (vat_rate, vat_source, category_pcg, ignored_at, transferred_to_accountant_at)
 *   pour construire les signaux de signalement.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useLibraryDocuments,
  useLibraryMissingDocuments,
} from '@verone/finance';
import type { LibraryDocument, LibraryMissingDocument } from '@verone/finance';
import { createClient } from '@verone/utils/supabase/client';

import type {
  ClotureCategory,
  ClotureCounters,
  ClotureRow,
  ClotureSignals,
} from './types';

// ── Types locaux pour l'enrichissement DB ────────────────────────────────────

interface BankTxEnrichment {
  id: string;
  vat_rate: number | null;
  vat_source: string | null;
  category_pcg: string | null;
  ignored_at: string | null;
  justification_optional: boolean | null;
  local_pdf_path: string | null;
  transaction_id: string;
}

// transferred_to_accountant_at n'est pas encore dans les types générés
// (migration 20260618101000). On le lit via un type étendu avec intersection.
type BankTxRow = BankTxEnrichment & {
  transferred_to_accountant_at?: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function directionToCategory(dir: string, docType: string): ClotureCategory {
  if (
    docType === 'supplier_credit_note' ||
    docType === 'customer_credit_note'
  ) {
    return 'avoirs';
  }
  return dir === 'inbound' ? 'achats' : 'ventes';
}

function buildSignals(params: {
  hasPiece: boolean;
  vatRate: number | null;
  vatSource: string | null;
  pcg: string | null;
  ignoredAt: string | null;
  transferredAt: string | null;
  justificationOptional: boolean | null;
}): ClotureSignals {
  return {
    missingPiece: !params.hasPiece && !params.justificationOptional,
    vatMissing:
      !params.ignoredAt &&
      (params.vatRate === null || params.vatSource === null),
    pcgMissing: !params.ignoredAt && params.pcg === null,
    ignored: params.ignoredAt !== null,
    transferredAt: params.transferredAt ?? null,
  };
}

function presentDocToRow(
  doc: LibraryDocument,
  enrichMap: Map<string, BankTxRow>
): ClotureRow {
  const enrich = enrichMap.get(doc.id);
  const transferredAt = enrich?.transferred_to_accountant_at ?? null;
  const ignoredAt = enrich?.ignored_at ?? null;
  const vatRate = enrich?.vat_rate ?? null;
  const vatSource = enrich?.vat_source ?? null;
  const pcg = enrich?.category_pcg ?? doc.pcg_code ?? null;

  return {
    id: doc.id,
    kind: 'present',
    category: directionToCategory(doc.document_direction, doc.document_type),
    document_type: doc.document_type,
    document_direction: doc.document_direction,
    document_number: doc.document_number,
    document_date: doc.document_date,
    partner_name: doc.partner_name,
    total_ht: doc.total_ht,
    total_ttc: doc.total_ttc,
    status: doc.status,
    local_pdf_path: enrich?.local_pdf_path ?? null,
    pdf_url: doc.pdf_url,
    transaction_id: enrich?.transaction_id ?? null,
    vat_rate: vatRate,
    vat_source: vatSource,
    category_pcg: pcg,
    justification_optional: enrich?.justification_optional ?? null,
    ignored_at: ignoredAt,
    signals: buildSignals({
      hasPiece: true,
      vatRate,
      vatSource,
      pcg,
      ignoredAt,
      transferredAt,
      justificationOptional: enrich?.justification_optional ?? null,
    }),
  };
}

function missingDocToRow(
  doc: LibraryMissingDocument,
  enrichMap: Map<string, BankTxRow>
): ClotureRow {
  const enrich = enrichMap.get(doc.id);
  const transferredAt = enrich?.transferred_to_accountant_at ?? null;
  const ignoredAt = enrich?.ignored_at ?? null;
  const vatRate = enrich?.vat_rate ?? null;
  const vatSource = enrich?.vat_source ?? null;
  const pcg = enrich?.category_pcg ?? doc.pcg_code ?? null;

  return {
    id: doc.id,
    kind: 'missing',
    category: directionToCategory(doc.document_direction, doc.document_type),
    document_type: doc.document_type,
    document_direction: doc.document_direction,
    document_number: doc.document_number,
    document_date: doc.document_date,
    partner_name: doc.partner_name,
    total_ht: doc.total_ht,
    total_ttc: doc.total_ttc,
    status: doc.status,
    local_pdf_path: enrich?.local_pdf_path ?? null,
    pdf_url: null,
    transaction_id: enrich?.transaction_id ?? null,
    vat_rate: vatRate,
    vat_source: vatSource,
    category_pcg: pcg,
    justification_optional: enrich?.justification_optional ?? null,
    ignored_at: ignoredAt,
    signals: buildSignals({
      hasPiece: false,
      vatRate,
      vatSource,
      pcg,
      ignoredAt,
      transferredAt,
      justificationOptional: enrich?.justification_optional ?? null,
    }),
  };
}

// ── Filtres ───────────────────────────────────────────────────────────────────

export interface ClotureFilters {
  year: number;
  month?: number;
  category?: ClotureCategory;
  search?: string;
  /** Si true, n'affiche que les non-transférées */
  onlyNotTransferred?: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useClotureData(filters: ClotureFilters): {
  /** Documents présents bruts (LibraryDocument), pour réutilisation côté Bibliothèque */
  documents: LibraryDocument[];
  rows: ClotureRow[];
  counters: ClotureCounters;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const libraryFilters = useMemo(
    () => ({
      year: filters.year,
      month: filters.month,
      category: filters.category,
      search: filters.search ?? undefined,
    }),
    [filters.year, filters.month, filters.category, filters.search]
  );

  const {
    documents,
    isLoading: loadingPresent,
    error,
    refetch: refetchPresent,
  } = useLibraryDocuments(libraryFilters);

  const { missingDocuments, isLoading: loadingMissing } =
    useLibraryMissingDocuments(libraryFilters);

  // Enrichissement bank_transactions pour les signaux (TVA, PCG, transferred, ignored)
  const [enrichMap, setEnrichMap] = useState<Map<string, BankTxRow>>(new Map());
  const [loadingEnrich, setLoadingEnrich] = useState(false);

  // Tous les IDs à enrichir (bank_transactions uniquement)
  const allIds = useMemo(() => {
    const ids = new Set<string>();
    for (const d of documents) {
      if (d.source_table === 'bank_transactions') ids.add(d.id);
    }
    for (const d of missingDocuments) {
      ids.add(d.id);
    }
    return Array.from(ids);
  }, [documents, missingDocuments]);

  // Ref pour éviter la boucle infinie sur fetchEnrich
  const allIdsRef = useRef<string[]>([]);

  const fetchEnrich = useCallback(async () => {
    const ids = allIdsRef.current;
    if (ids.length === 0) {
      setEnrichMap(new Map());
      return;
    }
    setLoadingEnrich(true);
    try {
      const supabase = createClient();
      // Requête principale (colonnes dans les types générés)
      const { data } = await supabase
        .from('bank_transactions')
        .select(
          'id, vat_rate, vat_source, category_pcg, ignored_at, justification_optional, local_pdf_path, transaction_id'
        )
        .in('id', ids)
        .limit(600);

      // transferred_to_accountant_at est absente des types générés (migration 20260618101000
      // non encore régénérée). On lit la colonne via l'URL PostgREST directement
      // (même pattern que send-to-accountant/route.ts qui utilise fetch() REST pour PATCH).
      // Pas de cast unsafe — on parse la réponse JSON brute.
      const transferMap = new Map<string, string | null>();
      try {
        const supabaseUrl =
          typeof window !== 'undefined'
            ? process.env.NEXT_PUBLIC_SUPABASE_URL
            : undefined;
        const supabaseKey =
          typeof window !== 'undefined'
            ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            : undefined;

        // RLS sur bank_transactions exige is_backoffice_user() : il faut donc
        // présenter le JWT de la session connectée (pas la clé anonyme, sinon
        // l'API renvoie 0 ligne et le statut « transféré » reste invisible).
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const accessToken = session?.access_token ?? supabaseKey;

        if (supabaseUrl && supabaseKey && ids.length > 0) {
          const idParam = ids.map(id => `"${id}"`).join(',');
          const transferResp = await fetch(
            `${supabaseUrl}/rest/v1/bank_transactions?select=id,transferred_to_accountant_at&id=in.(${idParam})&limit=600`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          if (transferResp.ok) {
            const transferRows = (await transferResp.json()) as Array<{
              id: string;
              transferred_to_accountant_at: string | null;
            }>;
            for (const r of transferRows) {
              transferMap.set(r.id, r.transferred_to_accountant_at ?? null);
            }
          }
        }
      } catch (transferErr) {
        // Non-bloquant : le champ transferred sera null, les signaux restent corrects
        console.warn('[useClotureData] transfer fetch fallback:', transferErr);
      }

      const map = new Map<string, BankTxRow>();
      for (const row of data ?? []) {
        const typedRow = row as BankTxEnrichment;
        map.set(typedRow.id, {
          ...typedRow,
          transferred_to_accountant_at: transferMap.get(typedRow.id) ?? null,
        });
      }
      setEnrichMap(map);
    } catch (err) {
      console.error('[useClotureData] enrichment fetch error:', err);
    } finally {
      setLoadingEnrich(false);
    }
  }, []);

  // Mettre à jour le ref et fetcher quand les IDs changent
  useEffect(() => {
    allIdsRef.current = allIds;
    void fetchEnrich();
  }, [allIds, fetchEnrich]);

  // Construire les lignes unifiées
  const rows = useMemo(() => {
    const presentRows: ClotureRow[] = documents.map(d =>
      presentDocToRow(d, enrichMap)
    );
    const missingRows: ClotureRow[] = missingDocuments.map(d =>
      missingDocToRow(d, enrichMap)
    );

    let combined = [...presentRows, ...missingRows].sort((a, b) => {
      const dateA = a.document_date ?? '';
      const dateB = b.document_date ?? '';
      return dateB.localeCompare(dateA);
    });

    // Filtre "non transférées" si demandé
    if (filters.onlyNotTransferred) {
      combined = combined.filter(r => r.signals.transferredAt === null);
    }

    return combined;
  }, [documents, missingDocuments, enrichMap, filters.onlyNotTransferred]);

  // Compteurs
  const counters = useMemo((): ClotureCounters => {
    // Base : uniquement les lignes correspondant aux filtres déjà appliqués
    const allRows = (() => {
      const presentRows = documents.map(d => presentDocToRow(d, enrichMap));
      const missingRows = missingDocuments.map(d =>
        missingDocToRow(d, enrichMap)
      );
      return [...presentRows, ...missingRows];
    })();

    return {
      total: allRows.length,
      present: allRows.filter(r => r.kind === 'present').length,
      missing: allRows.filter(r => r.kind === 'missing' && !r.signals.ignored)
        .length,
      toComplete: allRows.filter(
        r =>
          !r.signals.ignored && (r.signals.vatMissing || r.signals.pcgMissing)
      ).length,
      transferred: allRows.filter(r => r.signals.transferredAt !== null).length,
    };
  }, [documents, missingDocuments, enrichMap]);

  const refetch = useCallback(() => {
    void refetchPresent();
    // missingDocuments se re-fetch via useEffect de useLibraryMissingDocuments
  }, [refetchPresent]);

  return {
    documents,
    rows,
    counters,
    isLoading: loadingPresent || loadingMissing || loadingEnrich,
    error,
    refetch,
  };
}
