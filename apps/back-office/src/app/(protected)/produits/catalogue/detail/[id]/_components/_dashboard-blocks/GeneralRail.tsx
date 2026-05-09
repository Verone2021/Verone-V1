'use client';

/**
 * GeneralRail — rail gauche 200px sticky du dashboard Général.
 * Contient : image + nom + SKU, completion circle, liste onglets complétude,
 * variantes miniatures, bouton Export PDF.
 */

import { BrandBadgeList } from '@verone/products';
import { ButtonUnified } from '@verone/ui';
import { FileDown } from 'lucide-react';

import { TabCompletionList } from './TabCompletionList';
import { VariantsRailMiniGrid } from './VariantsRailMiniGrid';

interface GeneralRailProps {
  productName: string;
  sku: string;
  /** UUIDs des marques internes assignées au produit (BO-BRAND-002). */
  brandIds?: string[] | null;
  completionPercentage: number;
  tabEntries: Array<{ id: string; label: string; percent: number }>;
  variantGroupId: string | null;
  variants: Array<{ id: string; name: string; imageUrl: string | null }>;
  onTabClick: (id: string) => void;
  onExportPdf?: () => void;
}

export function GeneralRail({
  productName,
  sku,
  brandIds,
  completionPercentage,
  tabEntries,
  variantGroupId,
  variants,
  onTabClick,
  onExportPdf,
}: GeneralRailProps) {
  return (
    <aside className="w-full lg:w-[220px] lg:sticky lg:top-4 lg:self-start bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
      {/* Header rail : nom + SKU (photo retirée — déjà dans le header produit global) */}
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-900 truncate">
          {productName}
        </p>
        <p className="text-xs text-neutral-500 font-mono">{sku}</p>
      </div>

      {/* Marques internes Vérone Group (lecture seule, BO-BRAND-004) */}
      {brandIds && brandIds.length > 0 && (
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">
            Marques
          </div>
          <BrandBadgeList brandIds={brandIds} size="xs" />
        </div>
      )}

      {/* Completion global */}
      <div className="flex items-center justify-center gap-2 py-2 border-y border-neutral-100">
        <div className="relative w-12 h-12">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke="#E5E5E5"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15"
              fill="none"
              stroke={completionPercentage === 100 ? '#16a34a' : '#f97316'}
              strokeWidth="3"
              strokeDasharray={`${(completionPercentage / 100) * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums">
            {completionPercentage}%
          </div>
        </div>
        <div className="text-xs text-neutral-500">
          Fiche
          <br />
          produit
        </div>
      </div>

      {/* Complétude par onglet */}
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-2">
          Onglets
        </div>
        <TabCompletionList entries={tabEntries} onTabClick={onTabClick} />
      </div>

      {/* Variantes */}
      <VariantsRailMiniGrid
        variantGroupId={variantGroupId}
        variants={variants}
      />

      {/* Actions bottom */}
      <div className="space-y-2 pt-2 border-t border-neutral-100">
        <ButtonUnified
          variant="default"
          size="sm"
          className="w-full"
          onClick={onExportPdf}
          disabled={!onExportPdf}
          title={!onExportPdf ? 'Bientôt disponible' : undefined}
        >
          <FileDown className="h-3.5 w-3.5 mr-1.5" />
          Export PDF
        </ButtonUnified>
      </div>
    </aside>
  );
}
