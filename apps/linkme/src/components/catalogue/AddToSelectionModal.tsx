'use client';

/**
 * Modal: Ajouter un produit à une sélection avec configuration de marge
 *
 * @module AddToSelectionModal
 * @since 2025-12-04
 * @updated 2026-04-14 - Refactoring: extraction sous-composants
 */

import { useState, useMemo, useEffect } from 'react';

import {
  calculateMargin,
  LINKME_CONSTANTS,
  PUBLIC_PRICE_ESTIMATION_FACTOR,
} from '@verone/utils';
import { X, Plus, Loader2, AlertCircle } from 'lucide-react';

import { CloudflareImage } from '@verone/ui';

import type { LinkMeCatalogProduct } from '../../lib/hooks/use-linkme-catalog';
import { useCatalogProduct } from '../../lib/hooks/use-linkme-catalog';
import {
  useUserSelections,
  useCreateSelection,
  useAddToSelectionWithMargin,
  useUserAffiliate,
} from '../../lib/hooks/use-user-selection';
import { MarginConfigSection } from './add-to-selection/MarginConfigSection';
import { SelectionPickerSection } from './add-to-selection/SelectionPickerSection';

interface AddToSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: LinkMeCatalogProduct | null;
  preselectedSelectionId?: string | null;
}

const { MIN_MARGIN, BUFFER_RATE, PLATFORM_COMMISSION_RATE } = LINKME_CONSTANTS;

export function AddToSelectionModal({
  isOpen,
  onClose,
  product,
  preselectedSelectionId,
}: AddToSelectionModalProps) {
  const { data: affiliate, isLoading: affiliateLoading } = useUserAffiliate();
  const { data: selections, isLoading: selectionsLoading } =
    useUserSelections();
  const createSelection = useCreateSelection();
  const addToSelection = useAddToSelectionWithMargin();
  const { data: productDetails, isLoading: productLoading } = useCatalogProduct(
    product?.id ?? null
  );

  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newSelectionName, setNewSelectionName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [marginRate, setMarginRate] = useState<number>(15);

  const marginLimits = useMemo(() => {
    if (!product)
      return {
        min: MIN_MARGIN,
        max: 50,
        suggested: 15,
        greenEnd: 15,
        orangeEnd: 30,
      };

    const basePriceHt = product.selling_price_ht;
    const publicPriceHt =
      product.public_price_ht ?? basePriceHt * PUBLIC_PRICE_ESTIMATION_FACTOR;
    const commissionRate =
      affiliate?.linkme_commission_rate ?? PLATFORM_COMMISSION_RATE;

    const prixLinkMe = basePriceHt * (1 + commissionRate / 100);
    const prixPlafondSecurite = publicPriceHt * (1 - BUFFER_RATE / 100);
    const maxMargin = Math.max(
      MIN_MARGIN,
      ((prixPlafondSecurite - prixLinkMe) / prixLinkMe) * 100
    );
    const suggestedMargin = Math.max(MIN_MARGIN, maxMargin / 3);
    const greenEnd = suggestedMargin;
    const orangeEnd = Math.min(suggestedMargin * 2, maxMargin);

    const min: number =
      (productDetails?.min_margin_rate as number | undefined) ?? MIN_MARGIN;
    const max: number =
      (productDetails?.max_margin_rate as number | undefined) ??
      Math.round(maxMargin * 10) / 10;
    const suggested: number =
      (productDetails?.suggested_margin_rate as number | undefined) ??
      Math.round(suggestedMargin * 10) / 10;

    return {
      min,
      max,
      suggested,
      greenEnd: Math.round(greenEnd * 10) / 10,
      orangeEnd: Math.round(orangeEnd * 10) / 10,
    };
  }, [product, productDetails, affiliate]);

  useEffect(() => {
    if (marginLimits.suggested) {
      setMarginRate(affiliate?.default_margin_rate ?? marginLimits.suggested);
    }
  }, [marginLimits.suggested, affiliate]);

  useEffect(() => {
    if (preselectedSelectionId && isOpen && !selectionsLoading) {
      const exists = selections?.some(s => s.id === preselectedSelectionId);
      if (exists) setSelectedSelectionId(preselectedSelectionId);
    }
  }, [preselectedSelectionId, isOpen, selections, selectionsLoading]);

  const calculations = useMemo(() => {
    if (!product) return { gain: 0, finalPrice: 0, prixLinkMe: 0 };
    const basePriceHt = product.selling_price_ht;
    const commissionRate =
      affiliate?.linkme_commission_rate ?? PLATFORM_COMMISSION_RATE;
    const { sellingPriceHt, gainEuros } = calculateMargin({
      basePriceHt,
      marginRate,
    });
    const prixLinkMe = sellingPriceHt * (1 + commissionRate / 100);
    return {
      gain: gainEuros,
      finalPrice: Math.round(prixLinkMe * 100) / 100,
      prixLinkMe: Math.round(prixLinkMe * 100) / 100,
    };
  }, [product, marginRate, affiliate]);

  const getMarginZone = (rate: number): 'green' | 'orange' | 'red' => {
    if (rate <= marginLimits.greenEnd) return 'green';
    if (rate <= marginLimits.orangeEnd) return 'orange';
    return 'red';
  };
  const currentZone = getMarginZone(marginRate);
  const zoneWidths = useMemo(
    () => ({ greenWidth: 33.33, orangeWidth: 33.33 }),
    []
  );

  if (!isOpen || !product) return null;

  const isLoading = affiliateLoading || selectionsLoading || productLoading;
  const hasNoAffiliate = !affiliateLoading && !affiliate;

  const handleCreateSelection = async () => {
    if (!newSelectionName.trim()) {
      setError('Veuillez entrer un nom pour la sélection');
      return;
    }
    setError(null);
    try {
      const newSel = (await createSelection.mutateAsync({
        name: newSelectionName.trim(),
      })) as { id: string };
      setSelectedSelectionId(newSel.id);
      setIsCreatingNew(false);
      setNewSelectionName('');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la création';
      setError(message);
    }
  };

  const handleAddToSelection = async () => {
    if (!selectedSelectionId) {
      setError('Veuillez sélectionner une sélection');
      return;
    }
    if (marginRate < marginLimits.min || marginRate > marginLimits.max) {
      setError(
        `La marge doit être entre ${marginLimits.min}% et ${marginLimits.max}%`
      );
      return;
    }
    setError(null);
    try {
      await addToSelection.mutateAsync({
        selectionId: selectedSelectionId,
        productId: product.product_id,
        catalogProductId: product.id,
        marginRate,
      });
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'ajout";
      setError(message);
    }
  };

  const handleClose = () => {
    setSelectedSelectionId(null);
    setIsCreatingNew(false);
    setNewSelectionName('');
    setError(null);
    setMarginRate(affiliate?.default_margin_rate ?? 15);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Ajouter à ma sélection
          </h2>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Produit */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0 border">
              <CloudflareImage
                cloudflareId={product.cloudflare_image_id ?? null}
                fallbackSrc={product.image_url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {product.custom_title ?? product.name}
              </p>
              <p className="text-sm text-gray-500 font-mono">
                {product.reference}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {product.selling_price_ht.toFixed(2)} € HT
                </span>
                {product.public_price_ht && (
                  <span className="text-xs text-gray-400 line-through">
                    {product.public_price_ht.toFixed(2)} €
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          ) : hasNoAffiliate ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">
                Compte affilié non configuré
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Contactez l&apos;administrateur pour activer votre compte.
              </p>
            </div>
          ) : (
            <>
              {selectedSelectionId && !isCreatingNew && (
                <MarginConfigSection
                  marginRate={marginRate}
                  marginLimits={marginLimits}
                  calculations={calculations}
                  currentZone={currentZone}
                  zoneWidths={zoneWidths}
                  onMarginChange={setMarginRate}
                />
              )}

              <SelectionPickerSection
                selections={selections}
                selectedSelectionId={selectedSelectionId}
                isCreatingNew={isCreatingNew}
                newSelectionName={newSelectionName}
                isCreatingPending={createSelection.isPending}
                onSelectSelection={setSelectedSelectionId}
                onStartCreate={() => setIsCreatingNew(true)}
                onCancelCreate={() => {
                  setIsCreatingNew(false);
                  setNewSelectionName('');
                }}
                onNewSelectionNameChange={setNewSelectionName}
                onCreateSelection={() => {
                  void handleCreateSelection().catch(err => {
                    console.error('[AddToSelectionModal] Create failed:', err);
                    setError('Erreur lors de la création de la sélection');
                  });
                }}
              />

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !hasNoAffiliate && !isCreatingNew && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <button
              onClick={() => {
                void handleAddToSelection().catch(err => {
                  console.error('[AddToSelectionModal] Add failed:', err);
                  setError("Erreur lors de l'ajout à la sélection");
                });
              }}
              disabled={!selectedSelectionId || addToSelection.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addToSelection.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              Ajouter à la sélection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
