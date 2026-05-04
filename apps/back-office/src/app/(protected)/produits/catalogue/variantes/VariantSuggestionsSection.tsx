'use client';

import { useState } from 'react';

import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Plus,
  Loader2,
  Package,
} from 'lucide-react';

import { ButtonV2, CloudflareImage } from '@verone/ui';

import { VariantSuggestionApplyModal } from './VariantSuggestionApplyModal';
import {
  type VariantSuggestion,
  useVariantSuggestions,
  getStemAsTitle,
  getAxisLabel,
  getConfidenceLabel,
} from './use-variant-suggestions';

export function VariantSuggestionsSection() {
  const { data: suggestions = [], isLoading, error } = useVariantSuggestions();
  const [collapsed, setCollapsed] = useState(false);
  const [active, setActive] = useState<VariantSuggestion | null>(null);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4 flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Recherche de suggestions de variantes...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Erreur lors du chargement des suggestions : {error.message}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-slate-800">
            Suggestions de regroupements ({suggestions.length})
          </h3>
          <span className="text-xs text-slate-500">
            — produits aux noms similaires non encore regroupés
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {!collapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-0">
          {suggestions.map(s => (
            <SuggestionCard
              key={`${s.supplier_id}-${s.stem}`}
              suggestion={s}
              onCreate={() => setActive(s)}
            />
          ))}
        </div>
      )}

      <VariantSuggestionApplyModal
        suggestion={active}
        isOpen={active !== null}
        onClose={() => setActive(null)}
      />
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onCreate,
}: {
  suggestion: VariantSuggestion;
  onCreate: () => void;
}) {
  const conf = getConfidenceLabel(suggestion.confidence);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col gap-3 hover:border-amber-300 hover:shadow-sm transition">
      {/* Header : titre + fournisseur + badge confiance */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-sm text-slate-800 truncate">
            {getStemAsTitle(suggestion.stem)}
          </h4>
          <p className="text-xs text-slate-500 truncate">
            {suggestion.supplier_name ?? 'Fournisseur inconnu'} ·{' '}
            {suggestion.product_count} produits
          </p>
        </div>
        <span
          className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${conf.color}`}
        >
          {conf.label}
        </span>
      </div>

      {/* Axe + valeurs communes */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
          Axe :
        </span>
        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
          {getAxisLabel(suggestion.detected_axis)}
        </span>
        {suggestion.has_common_cost_price && (
          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
            Prix commun {suggestion.common_cost_price} €
          </span>
        )}
        {suggestion.has_common_weight && (
          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
            Poids commun
          </span>
        )}
      </div>

      {/* Vignette PAR PRODUIT (image + nom court) pour validation visuelle */}
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {suggestion.product_names.map((name, i) => {
          const cfId = suggestion.product_cloudflare_image_ids[i] ?? null;
          const url = suggestion.product_image_urls[i] ?? null;
          const productId = suggestion.product_ids[i] ?? `idx-${i}`;
          return (
            <li
              key={productId}
              className="rounded border border-slate-200 bg-slate-50/50 overflow-hidden"
            >
              <div className="relative w-full aspect-square bg-white">
                {cfId || url ? (
                  <CloudflareImage
                    cloudflareId={cfId}
                    fallbackSrc={url}
                    alt={name}
                    fill
                    className="object-contain p-1"
                    sizes="120px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-slate-300" />
                  </div>
                )}
              </div>
              <p
                className="px-1.5 py-1 text-[10px] text-slate-600 truncate text-center"
                title={name}
              >
                {name}
              </p>
            </li>
          );
        })}
      </ul>

      <ButtonV2 variant="primary" size="sm" icon={Plus} onClick={onCreate}>
        Créer le groupe
      </ButtonV2>
    </div>
  );
}
