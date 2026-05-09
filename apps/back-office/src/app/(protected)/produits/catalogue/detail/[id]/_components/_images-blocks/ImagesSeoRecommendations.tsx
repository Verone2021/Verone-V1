'use client';

/**
 * ImagesSeoRecommendations — card bleue avec checklist SEO & Performance.
 * Calculs basés sur les données réelles product_images.
 *
 * Sprint : BO-UI-PROD-IMG-001
 */

import { Check, X, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';

import type { Database } from '@verone/types';
import { cn } from '@verone/utils';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ImagesSeoRecommendationsProps {
  images: ProductImage[];
}

interface CheckItem {
  ok: boolean;
  warning?: boolean;
  label: string;
}

interface Suggestion {
  label: string;
}

export function ImagesSeoRecommendations({
  images,
}: ImagesSeoRecommendationsProps) {
  const primaryImage = images.find(i => i.is_primary);
  const altMissingCount = images.filter(i => !i.alt_text?.trim()).length;
  const oversizedCount = images.filter(
    i => (i.file_size ?? 0) > 500_000
  ).length;
  const nonWebpCount = images.filter(
    i => i.format?.toLowerCase() !== 'webp'
  ).length;

  const checkItems: CheckItem[] = [
    {
      ok: Boolean(primaryImage),
      label: primaryImage
        ? 'Image principale définie'
        : 'Aucune image principale définie',
    },
    {
      ok: altMissingCount === 0,
      label:
        altMissingCount === 0
          ? 'Toutes les images ont un alt text'
          : `${altMissingCount} image${altMissingCount > 1 ? 's' : ''} sans texte alternatif (SEO)`,
    },
    {
      ok: oversizedCount === 0,
      warning: oversizedCount > 0,
      label:
        oversizedCount === 0
          ? 'Toutes les images < 500 KB'
          : `${oversizedCount} image${oversizedCount > 1 ? 's' : ''} > 500 KB (ralentit le chargement)`,
    },
  ];

  const suggestions: Suggestion[] = [];
  if (nonWebpCount > 0) {
    suggestions.push({
      label: `Convertir ${nonWebpCount} image${nonWebpCount > 1 ? 's' : ''} en WebP pour réduire 30–50%`,
    });
  }
  if (altMissingCount > 0) {
    suggestions.push({
      label: `Ajouter un alt text descriptif aux ${altMissingCount} image${altMissingCount > 1 ? 's' : ''}`,
    });
  }
  if (oversizedCount > 0) {
    suggestions.push({
      label: `Optimiser les ${oversizedCount} image${oversizedCount > 1 ? 's' : ''} > 500 KB`,
    });
  }

  return (
    <div className="bg-blue-50/30 rounded-lg border border-blue-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <Lightbulb className="h-4 w-4 text-blue-600" />
        <p className="text-sm font-semibold text-blue-900">
          Recommandations SEO &amp; Performance
        </p>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-blue-700/70">
          Ajoutez des images pour voir les recommandations.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Col gauche — checklist */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-2">
              Checklist
            </p>
            {checkItems.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={cn(
                    'mt-0.5 flex-shrink-0 h-4 w-4 flex items-center justify-center rounded-full',
                    item.warning
                      ? 'bg-amber-100 text-amber-600'
                      : item.ok
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                  )}
                >
                  {item.warning ? (
                    <AlertTriangle className="h-2.5 w-2.5" />
                  ) : item.ok ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <X className="h-2.5 w-2.5" />
                  )}
                </span>
                <p
                  className={cn(
                    'text-xs',
                    item.warning
                      ? 'text-amber-800'
                      : item.ok
                        ? 'text-green-800'
                        : 'text-red-800'
                  )}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          {/* Col droite — suggestions */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-2">
              Suggestions
            </p>
            {suggestions.length === 0 ? (
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-green-500" />
                <p className="text-xs text-green-700 font-medium">
                  Tout est optimisé !
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-1 rounded-full border border-blue-200 bg-white text-xs text-blue-800 font-medium"
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
