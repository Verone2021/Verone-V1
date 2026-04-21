'use client';

/**
 * GeneralRail — rail gauche 200px sticky du dashboard Général.
 * Contient : image + nom + SKU, completion circle, liste onglets complétude,
 * variantes miniatures, boutons Export PDF + Ouvrir Sourcing.
 */

import Image from 'next/image';
import Link from 'next/link';

import { ButtonUnified } from '@verone/ui';
import { FileDown, Compass } from 'lucide-react';

import { TabCompletionList } from './TabCompletionList';
import { VariantsRailMiniGrid } from './VariantsRailMiniGrid';

interface GeneralRailProps {
  productId: string;
  productName: string;
  sku: string;
  primaryImageUrl: string | null;
  completionPercentage: number;
  tabEntries: Array<{ id: string; label: string; percent: number }>;
  variantGroupId: string | null;
  variants: Array<{ id: string; name: string; imageUrl: string | null }>;
  onTabClick: (id: string) => void;
  onExportPdf?: () => void;
}

export function GeneralRail({
  productId,
  productName,
  sku,
  primaryImageUrl,
  completionPercentage,
  tabEntries,
  variantGroupId,
  variants,
  onTabClick,
  onExportPdf,
}: GeneralRailProps) {
  return (
    <aside className="w-full lg:w-[220px] lg:sticky lg:top-4 lg:self-start bg-white rounded-lg border border-neutral-200 p-4 space-y-4">
      {/* Header rail : image + nom + SKU */}
      <div className="space-y-2">
        <div className="relative aspect-square w-full max-w-[140px] mx-auto rounded overflow-hidden bg-neutral-100">
          {primaryImageUrl ? (
            <Image
              src={primaryImageUrl}
              alt={productName}
              fill
              sizes="140px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-neutral-200" />
          )}
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-900 truncate">
            {productName}
          </p>
          <p className="text-xs text-neutral-500 font-mono">{sku}</p>
        </div>
      </div>

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
        <Link
          href={`/produits/sourcing/produits/${productId}`}
          className="flex items-center justify-center gap-1.5 w-full text-xs text-neutral-600 hover:text-neutral-900 underline py-1.5"
        >
          <Compass className="h-3.5 w-3.5" />
          Ouvrir Sourcing
        </Link>
      </div>
    </aside>
  );
}
