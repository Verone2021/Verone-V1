'use client';

/**
 * DocumentResyncAction — Badge + bouton "Re-synchroniser" + modal confirmation.
 *
 * [BO-FIN-009 Phase 4 — R3 finance.md — Option A]
 * Affiche un badge orange "Non synchronisé" et un bouton "Re-synchroniser"
 * UNIQUEMENT si le document est en `draft` ET que la commande a été modifiée
 * après la création du document (out-of-sync).
 *
 * Au clic, ouvre `RegenerateDocumentConfirmModal` qui laisse l'utilisateur
 * choisir quelles `customLines` et `notes` préserver, puis POST vers la route
 * de régénération existante (`/api/qonto/{quotes|invoices}/by-order/[id]/regenerate[-proforma]`).
 *
 * Zéro modification du workflow existant — composant additif uniquement.
 */

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';

import { Button } from '@verone/ui';
import { useToast } from '@verone/common/hooks';

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

  const handleConfirm = useCallback(
    async (
      preservedCustomLines: ICustomLineToPreserve[],
      preservedNotes: string
    ): Promise<void> => {
      setIsLoading(true);
      try {
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

        const data = (await response.json()) as {
          success?: boolean;
          error?: string;
          message?: string;
          newRevisionNumber?: number;
        };

        if (!response.ok || !data.success) {
          throw new Error(data.error ?? 'Echec de la re-synchronisation');
        }

        toast({
          title: 'Re-synchronise',
          description:
            data.message ??
            `${documentType === 'quote' ? 'Devis' : 'Proforma'} regenere avec succes.`,
        });

        // Invalider les query keys fournis + keys par défaut
        const defaultKeys =
          documentType === 'quote'
            ? [['quotes-by-order', orderId]]
            : [['invoices-by-order', orderId]];
        const allKeys = [...defaultKeys, ...(invalidateQueryKeys ?? [])];
        await Promise.all(
          allKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
        );

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
    [documentType, orderId, toast, queryClient, invalidateQueryKeys, onSuccess]
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
      <Button
        variant="outline"
        size={buttonSize}
        onClick={() => setModalOpen(true)}
        className="gap-1.5 border-orange-300 text-orange-700 hover:bg-orange-50"
        title="La commande a ete modifiee apres la creation de ce document. Cliquez pour regenerer avec les donnees actuelles."
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Re-synchroniser
      </Button>

      <RegenerateDocumentConfirmModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        documentType={documentType}
        existingCustomLines={existingCustomLines}
        existingNotes={existingNotes}
        onConfirm={(lines, notes) => {
          void handleConfirm(lines, notes);
        }}
        isLoading={isLoading}
      />
    </>
  );
}
