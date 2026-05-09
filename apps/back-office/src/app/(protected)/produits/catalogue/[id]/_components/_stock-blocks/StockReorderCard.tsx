'use client';

/**
 * StockReorderCard — bloc Réapprovisionnement (col-span-6).
 * Sprint : BO-UI-PROD-STOCK-001
 *
 * Si draft_order_id existe → lien "Voir PO-DRAFT-XXX · N u"
 * Sinon → bouton "Commander au fournisseur · N u" (ouvre QuickPurchaseOrderModal)
 */

import { useState, useCallback } from 'react';

import { PackagePlus, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { QuickPurchaseOrderModal } from '@verone/orders';
import { cn } from '@verone/utils';

interface StockReorderCardProps {
  productId: string;
  alertPriority: number | null;
  shortageQuantity: number;
  suggestedQty: number;
  draftOrderId: string | null;
  draftOrderNumber: string | null;
  quantityInDraft: number | null;
  lastPurchaseDate: string | null;
  lastPurchaseQty: number | null;
  lastPurchasePrice: number | null;
  isAlertActive: boolean;
  onSuccess: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function StockReorderCard({
  productId,
  alertPriority,
  shortageQuantity,
  suggestedQty,
  draftOrderId,
  draftOrderNumber,
  quantityInDraft,
  lastPurchaseDate,
  lastPurchaseQty,
  lastPurchasePrice,
  isAlertActive,
  onSuccess,
}: StockReorderCardProps) {
  const [showPoModal, setShowPoModal] = useState(false);

  const handleOpenPo = useCallback(() => {
    setShowPoModal(true);
  }, []);

  const handleClosePo = useCallback(() => {
    setShowPoModal(false);
  }, []);

  const handlePoSuccess = useCallback(() => {
    setShowPoModal(false);
    onSuccess();
  }, [onSuccess]);

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-lg border h-full flex flex-col',
          isAlertActive
            ? 'bg-amber-50/30 border-amber-200'
            : 'border-neutral-200'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <PackagePlus
              className={cn(
                'h-4 w-4',
                isAlertActive ? 'text-amber-600' : 'text-neutral-500'
              )}
            />
            <h3 className="text-sm font-semibold text-neutral-900">
              Réapprovisionnement
            </h3>
          </div>
          {alertPriority != null && isAlertActive && (
            <span className="rounded px-1.5 py-0.5 text-[10px] border bg-amber-50 text-amber-700 border-amber-200 font-medium">
              Priorité {alertPriority}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Col gauche : Déficit + Suggestion */}
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-0.5">
                  Déficit
                </p>
                <p className="text-2xl font-bold tabular-nums text-red-600">
                  {shortageQuantity > 0 ? `-${shortageQuantity}` : '0'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  unités manquantes
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 mb-0.5">
                  Suggestion
                </p>
                <p className="text-xl font-semibold tabular-nums text-amber-700">
                  {suggestedQty}
                </p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  unités à commander
                </p>
              </div>
              {lastPurchaseDate && (
                <p className="text-[11px] italic text-neutral-500">
                  Dernier achat&nbsp;:&nbsp;{formatDate(lastPurchaseDate)}
                  {lastPurchaseQty != null && (
                    <>
                      &nbsp;·&nbsp;
                      <span className="tabular-nums">{lastPurchaseQty}</span>
                      &nbsp;u
                    </>
                  )}
                  {lastPurchasePrice != null && (
                    <>
                      &nbsp;@&nbsp;
                      <span className="tabular-nums">
                        {formatEur(lastPurchasePrice)}
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            {/* Col droite : CTA */}
            <div className="flex flex-col items-start justify-start gap-3">
              {draftOrderId ? (
                <Link
                  href={`/produits/sourcing/commandes/${draftOrderId}`}
                  className="flex items-center gap-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 underline"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Voir {draftOrderNumber ?? 'PO brouillon'}
                  {quantityInDraft != null && (
                    <>&nbsp;·&nbsp;{quantityInDraft}&nbsp;u</>
                  )}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenPo}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-2 rounded-md transition-colors"
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  Commander au fournisseur
                  {suggestedQty > 0 && <>&nbsp;·&nbsp;{suggestedQty}&nbsp;u</>}
                </button>
              )}

              {draftOrderId && (
                <span className="rounded px-1.5 py-0.5 text-[10px] border bg-amber-50 text-amber-700 border-amber-200">
                  en cours
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'px-4 py-2.5 border-t',
            isAlertActive ? 'border-amber-100' : 'border-neutral-100'
          )}
        >
          <p className="text-[10px] italic text-neutral-400">
            Le stock prévisionnel sera mis à jour automatiquement à la
            validation de la PO.
          </p>
        </div>
      </div>

      {/* Modal création PO rapide */}
      <QuickPurchaseOrderModal
        open={showPoModal}
        onClose={handleClosePo}
        productId={productId}
        shortageQuantity={suggestedQty}
        onSuccess={handlePoSuccess}
      />
    </>
  );
}
