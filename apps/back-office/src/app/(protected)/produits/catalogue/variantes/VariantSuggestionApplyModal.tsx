'use client';

import { useEffect, useState } from 'react';

import { Loader2, Sparkles } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';

import {
  type VariantSuggestion,
  getStemAsTitle,
  getAxisLabel,
  useApplyVariantSuggestion,
} from './use-variant-suggestions';

interface Props {
  suggestion: VariantSuggestion | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VariantSuggestionApplyModal({
  suggestion,
  isOpen,
  onClose,
}: Props) {
  const supabase = createClient();
  const apply = useApplyVariantSuggestion();

  const [name, setName] = useState('');
  const [baseSku, setBaseSku] = useState('');
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [resolvingSubcat, setResolvingSubcat] = useState(false);

  useEffect(() => {
    if (!suggestion) return;
    setName(getStemAsTitle(suggestion.stem));
    setBaseSku(
      suggestion.stem
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 24)
    );

    setResolvingSubcat(true);
    void supabase
      .from('products')
      .select('subcategory_id')
      .in('id', suggestion.product_ids)
      .not('subcategory_id', 'is', null)
      .limit(1)
      .single()
      .then(({ data }) => {
        setSubcategoryId(data?.subcategory_id ?? null);
        setResolvingSubcat(false);
      });
  }, [suggestion, supabase]);

  if (!suggestion) return null;

  const canSubmit =
    name.trim().length >= 2 &&
    baseSku.trim().length >= 2 &&
    subcategoryId !== null &&
    !apply.isPending;

  const handleSubmit = () => {
    if (!canSubmit || !subcategoryId) return;
    apply.mutate(
      {
        name: name.trim(),
        base_sku: baseSku.trim(),
        subcategory_id: subcategoryId,
        supplier_id: suggestion.supplier_id,
        variant_type: suggestion.detected_axis,
        product_ids: suggestion.product_ids,
        has_common_cost_price: suggestion.has_common_cost_price,
        common_cost_price: suggestion.common_cost_price,
        has_common_weight: suggestion.has_common_weight,
        common_weight: suggestion.common_weight,
      },
      { onSuccess: () => onClose() }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Créer le groupe variante
          </DialogTitle>
          <DialogDescription>
            {suggestion.product_count} produits du fournisseur{' '}
            <strong>{suggestion.supplier_name ?? 'inconnu'}</strong> seront
            regroupés. Variation détectée :{' '}
            <strong>{getAxisLabel(suggestion.detected_axis)}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nom du groupe
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Lampe Solène spirale"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              SKU de base
            </label>
            <input
              type="text"
              value={baseSku}
              onChange={e => setBaseSku(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono uppercase"
              placeholder="Ex: LAMPE-SOLENE-SPIRALE"
            />
          </div>

          <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-medium text-slate-600 mb-2">
              Produits qui seront rattachés ({suggestion.product_count})
            </p>
            <ul className="text-sm text-slate-700 space-y-1 max-h-40 overflow-y-auto">
              {suggestion.product_names.map((n, i) => (
                <li
                  key={`${suggestion.product_ids[i]}-${i}`}
                  className="truncate"
                >
                  • {n}
                </li>
              ))}
            </ul>
          </div>

          {(suggestion.has_common_cost_price ||
            suggestion.has_common_weight) && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">Valeurs communes détectées :</p>
              <ul className="space-y-0.5">
                {suggestion.has_common_cost_price && (
                  <li>• Prix d'achat : {suggestion.common_cost_price} €</li>
                )}
                {suggestion.has_common_weight && (
                  <li>• Poids : {suggestion.common_weight} kg</li>
                )}
              </ul>
            </div>
          )}

          {resolvingSubcat && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Détection de la
              sous-catégorie...
            </p>
          )}

          {!resolvingSubcat && !subcategoryId && (
            <p className="text-xs text-red-600">
              Aucune sous-catégorie détectée parmi les produits. Renseigne-la
              sur au moins un produit avant d'appliquer.
            </p>
          )}
        </div>

        <DialogFooter>
          <ButtonV2
            variant="ghost"
            onClick={onClose}
            disabled={apply.isPending}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
            icon={apply.isPending ? Loader2 : Sparkles}
          >
            {apply.isPending ? 'Création...' : 'Créer le groupe'}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
