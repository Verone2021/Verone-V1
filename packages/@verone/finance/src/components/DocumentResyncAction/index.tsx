'use client';

/**
 * DocumentResyncAction — Badge + bouton "Re-synchroniser" + modal confirmation.
 *
 * [BO-FIN-009 Phase 4 — R3 finance.md — Option A]
 * Affiche un badge orange "Non synchronisé" et un bouton "Re-synchroniser"
 * UNIQUEMENT si le document est en `draft` ET que la commande a été modifiée
 * après la création du document (out-of-sync).
 *
 * [BO-FIN-046 Étape 6.2] Cascade devis ↔ facture :
 * Si la commande a aussi un document du type opposé (draft), propose
 * "Régénérer les deux" comme option par défaut.
 *
 * Zéro modification du workflow existant — composant additif uniquement.
 */

import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { Button } from '@verone/ui';
import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import {
  DocumentOutOfSyncBadge,
  isDocumentOutOfSync,
} from '../DocumentOutOfSyncBadge';
import {
  RegenerateDocumentConfirmModal,
  type ICustomLineToPreserve,
} from '../RegenerateDocumentConfirmModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentResyncActionProps {
  /** 'quote' → devis, 'proforma' → facture brouillon (proforma) */
  documentType: 'quote' | 'proforma';
  /** ID de la commande liée (UUID sales_orders) */
  orderId: string;
  /** Statut du document (seul 'draft' affiche le bouton) */
  documentStatus: string;
  /** Timestamp de dernière modification commande (sales_orders.updated_at) */
  orderUpdatedAt: string | null | undefined;
  /** Timestamp de création du document (financial_documents.created_at ou issue_date) */
  documentCreatedAt: string | null | undefined;
  /** CustomLines existantes à proposer à la préservation dans le modal */
  existingCustomLines?: ICustomLineToPreserve[];
  /** Notes existantes à proposer à la préservation dans le modal */
  existingNotes?: string;
  /** Taille d'affichage badge+bouton (sm par défaut) */
  size?: 'sm' | 'md';
  /** Query keys à invalider après succès (par défaut : ['quotes-by-order', orderId] ou équivalent invoices) */
  invalidateQueryKeys?: string[][];
  /** Callback supplémentaire après succès régénération (fetch order detail, etc.) */
  onSuccess?: () => void;
  /** Masque le badge (mode bouton seul) */
  hideBadge?: boolean;
}

// ---------------------------------------------------------------------------
// Helper — appel API de régénération unitaire
// ---------------------------------------------------------------------------

async function regenerateDocument(
  documentType: 'quote' | 'proforma',
  orderId: string,
  preservedCustomLines: ICustomLineToPreserve[],
  preservedNotes: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  const path =
    documentType === 'quote'
      ? `/api/qonto/quotes/by-order/${orderId}/regenerate`
      : `/api/qonto/invoices/by-order/${orderId}/regenerate-proforma`;

  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      preservedCustomLines,
      preservedNotes: preservedNotes || undefined,
    }),
  });
  return response.json() as Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function DocumentResyncAction({
  documentType,
  orderId,
  documentStatus,
  orderUpdatedAt,
  documentCreatedAt,
  existingCustomLines = [],
  existingNotes = '',
  size = 'sm',
  invalidateQueryKeys,
  onSuccess,
  hideBadge = false,
}: DocumentResyncActionProps): React.ReactNode {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Affichage conditionnel : seulement si draft + out-of-sync
  const outOfSync =
    documentStatus === 'draft' &&
    isDocumentOutOfSync(orderUpdatedAt, documentCreatedAt);

  // [BO-FIN-046 Étape 6.2] Détection document compagnon (type opposé, draft)
  const companionType =
    documentType === 'quote' ? 'customer_invoice' : 'customer_quote';
  const { data: hasCompanion = false } = useQuery({
    queryKey: ['document-companion-draft', orderId, documentType],
    queryFn: async (): Promise<boolean> => {
      if (!orderId || !outOfSync) return false;
      const supabase = createClient();
      const { count } = await supabase
        .from('financial_documents')
        .select('id', { count: 'exact', head: true })
        .eq('sales_order_id', orderId)
        .eq('document_type', companionType)
        .eq('status', 'draft')
        .is('deleted_at', null);
      return (count ?? 0) > 0;
    },
    staleTime: 30_000,
    enabled: outOfSync && !!orderId,
  });

  const invalidateAll = useCallback(async () => {
    const defaultKeys =
      documentType === 'quote'
        ? [['quotes-by-order', orderId]]
        : [['invoices-by-order', orderId]];
    const allKeys = [...defaultKeys, ...(invalidateQueryKeys ?? [])];
    await Promise.all(
      allKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
    );
  }, [documentType, orderId, invalidateQueryKeys, queryClient]);

  const handleConfirm = useCallback(
    async (
      preservedCustomLines: ICustomLineToPreserve[],
      preservedNotes: string,
      cascade = false
    ): Promise<void> => {
      setIsLoading(true);
      try {
        const data = await regenerateDocument(
          documentType,
          orderId,
          preservedCustomLines,
          preservedNotes
        );
        if (!data.success)
          throw new Error(data.error ?? 'Echec de la re-synchronisation');

        // Cascade : régénérer aussi le document compagnon
        if (cascade && hasCompanion) {
          const companionDocType =
            documentType === 'quote' ? 'proforma' : 'quote';
          const cascadeData = await regenerateDocument(
            companionDocType,
            orderId,
            [],
            ''
          );
          if (!cascadeData.success) {
            toast({
              title: 'Attention',
              description:
                "Le document principal a été régénéré, mais l'autre document n'a pas pu être mis à jour : " +
                (cascadeData.error ?? 'erreur inconnue'),
              variant: 'default',
            });
          }
        }

        toast({
          title: 'Re-synchronise',
          description:
            data.message ??
            `${documentType === 'quote' ? 'Devis' : 'Proforma'} regenere avec succes${cascade && hasCompanion ? ' (les deux documents)' : ''}.`,
        });

        await invalidateAll();
        setModalOpen(false);
        onSuccess?.();
      } catch (error) {
        console.error(
          `[DocumentResyncAction] Regenerate ${documentType} failed:`,
          error
        );
        toast({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : 'Echec de la re-synchronisation',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [documentType, orderId, hasCompanion, toast, invalidateAll, onSuccess]
  );

  if (!outOfSync) return null;

  const buttonSize = size === 'sm' ? 'sm' : 'default';

  return (
    <>
      {!hideBadge && (
        <DocumentOutOfSyncBadge
          orderUpdatedAt={orderUpdatedAt}
          documentCreatedAt={documentCreatedAt}
          documentStatus={documentStatus}
        />
      )}
      {/* [BO-FIN-046 6.2] Bouton cascade si document compagnon détecté */}
      {hasCompanion && (
        <Button
          variant="outline"
          size={buttonSize}
          onClick={() => {
            void handleConfirm([], existingNotes, true);
          }}
          className="gap-1.5 border-orange-400 text-orange-800 hover:bg-orange-50 font-medium"
          title="Régénérer ce document ET le document lié (devis/proforma) en une seule action."
          disabled={isLoading}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Régénérer les deux
        </Button>
      )}
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => setModalOpen(true)}
        className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
        title="La commande a ete modifiee apres la creation de ce document. Cliquez pour regenerer avec les donnees actuelles."
      >
        <RefreshCw className="h-3.5 w-3.5" />
        {hasCompanion ? 'Régénérer celui-ci' : 'Re-synchroniser'}
      </Button>

      <RegenerateDocumentConfirmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        documentType={documentType}
        existingCustomLines={existingCustomLines}
        existingNotes={existingNotes}
        onConfirm={(lines, notes) => {
          void handleConfirm(lines, notes, false);
        }}
        isLoading={isLoading}
      />
    </>
  );
}
