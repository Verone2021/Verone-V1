'use client';

/**
 * PackagingPlaceholderCard — Bloc 4 du dashboard Caractéristiques.
 * Mockup amber "Bientôt disponible" — module logistique non encore développé.
 */

import { Package } from 'lucide-react';

export function PackagingPlaceholderCard() {
  return (
    <div className="bg-amber-50/40 rounded-lg border border-amber-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] uppercase tracking-wide text-amber-700 font-medium">
          Emballage & Expédition
        </h3>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-amber-300 bg-amber-100 text-[10px] text-amber-700">
          Bientôt disponible
        </span>
      </div>

      {/* Mockup low-opacity */}
      <div className="opacity-40 space-y-3 pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-600" />
          <div className="space-y-1">
            <p className="text-xs font-medium text-neutral-700">
              Dimensions colis
            </p>
            <p className="text-sm tabular-nums font-semibold text-neutral-900">
              45 × 45 × 12 cm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded border border-amber-100 p-2">
            <p className="text-[9px] uppercase tracking-wide text-neutral-400 mb-0.5">
              Unités / carton
            </p>
            <p className="text-sm font-semibold tabular-nums text-neutral-700">
              12 pcs
            </p>
          </div>
          <div className="bg-white rounded border border-amber-100 p-2">
            <p className="text-[9px] uppercase tracking-wide text-neutral-400 mb-0.5">
              Préset
            </p>
            <div className="flex gap-1">
              <span className="px-1.5 py-0.5 text-[10px] rounded border border-neutral-200 text-neutral-600">
                Standard
              </span>
              <span className="px-1.5 py-0.5 text-[10px] rounded border border-neutral-200 text-neutral-600">
                Fragile
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-3 text-[10px] italic text-amber-700">
        Synchronisation module Logistique — disponible prochainement.
      </p>
    </div>
  );
}
