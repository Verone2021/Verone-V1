'use client';

/**
 * UsePriceDialog — dialogue « Utiliser ce prix » depuis SalesByChannelCard.
 * Permet d'enregistrer le prix observé sur le site internet ou comme prix cible.
 *
 * Sprint : BO-PRODUCTS-PROFIT-004
 */

import React, { useState, useMemo, useId } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
} from '@verone/ui';
import { useChannelPricing, useUpdateChannelPrice } from '@verone/common';

import { useUpdateTargetPrice } from '../../../hooks/use-update-target-price';
import type { ResolvedCost } from '../../../utils/product-sales-margin';
import { fmtEur, fmtPct, fmtCoef, clrMargin } from './profitability-format';

interface Props {
  open: boolean;
  onClose: () => void;
  productId: string;
  /** Prix moyen observé du canal — valeur pré-remplie dans le champ */
  suggestedPrice: number | null;
  cost: ResolvedCost;
  currentTargetPrice: number | null;
}

type SaveTarget = 'site_internet' | 'target_price';

function marginPreview(
  price: number,
  cost: number | null
): { marginPct: number | null; coef: number | null } {
  if (cost == null || cost <= 0) return { marginPct: null, coef: null };
  return {
    marginPct: ((price - cost) / price) * 100,
    coef: price / cost,
  };
}

export function UsePriceDialog({
  open,
  onClose,
  productId,
  suggestedPrice,
  cost,
  currentTargetPrice,
}: Props): React.JSX.Element {
  const priceInputId = useId();
  const targetInputId = useId();

  const [rawPrice, setRawPrice] = useState<string>(
    suggestedPrice != null ? suggestedPrice.toFixed(2) : ''
  );
  const [target, setTarget] = useState<SaveTarget>('site_internet');
  const [confirming, setConfirming] = useState(false);

  const { data: channelPricingRows } = useChannelPricing(productId);
  const updateChannelPrice = useUpdateChannelPrice();
  const updateTargetPrice = useUpdateTargetPrice();

  const siteRow = useMemo(
    () => channelPricingRows?.find(r => r.channel_code === 'site_internet'),
    [channelPricingRows]
  );

  const parsedPrice = rawPrice ? parseFloat(rawPrice) : null;
  const priceValid =
    parsedPrice != null && !Number.isNaN(parsedPrice) && parsedPrice > 0;
  const preview = priceValid
    ? marginPreview(parsedPrice, cost.cost)
    : { marginPct: null, coef: null };

  const currentTargetValue =
    target === 'site_internet'
      ? (siteRow?.custom_price_ht ?? null)
      : currentTargetPrice;

  const isPending = updateChannelPrice.isPending || updateTargetPrice.isPending;
  // Site channel row not loaded yet: block saving instead of closing silently
  const targetReady = target === 'target_price' || siteRow != null;

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>): void {
    setRawPrice(e.target.value);
    setConfirming(false);
  }

  function handleTargetChange(e: React.ChangeEvent<HTMLSelectElement>): void {
    setTarget(e.target.value as SaveTarget);
    setConfirming(false);
  }

  function handleSubmitClick(): void {
    if (!priceValid || parsedPrice == null) return;
    if (currentTargetValue != null && !confirming) {
      setConfirming(true);
      return;
    }
    void doSave(parsedPrice).catch(() => undefined);
  }

  async function doSave(price: number): Promise<void> {
    if (target === 'site_internet' && siteRow != null) {
      await updateChannelPrice.mutateAsync({
        product_id: productId,
        channel_id: siteRow.channel_id,
        custom_price_ht: price,
        is_active: true,
        override_minimum: false,
      });
    } else if (target === 'target_price') {
      await updateTargetPrice.mutateAsync({ productId, targetPrice: price });
    }
    setConfirming(false);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v) onClose();
      }}
    >
      <DialogContent dialogSize="sm" className="h-screen md:h-auto">
        <div className="flex flex-1 flex-col overflow-y-auto md:max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Utiliser ce prix</DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Prix */}
            <div className="space-y-1">
              <Label htmlFor={priceInputId}>Prix HT observé (€)</Label>
              <Input
                id={priceInputId}
                type="number"
                step="0.01"
                min="0"
                value={rawPrice}
                onChange={handlePriceChange}
                className="h-11 md:h-9 w-full"
              />
            </div>

            {/* Aperçu marge */}
            {priceValid && (
              <div className="rounded-lg bg-neutral-50 px-3 py-2 text-sm">
                <span className="text-neutral-500">Coût actuel : </span>
                <span className="font-medium">{fmtEur(cost.cost)}</span>
                {preview.marginPct != null && (
                  <>
                    <span className="mx-2 text-neutral-300">·</span>
                    <span className={clrMargin(preview.marginPct)}>
                      {fmtPct(preview.marginPct)}
                    </span>
                    <span className="mx-1 text-neutral-300">·</span>
                    <span className={clrMargin(preview.marginPct)}>
                      {fmtCoef(preview.coef)}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Cible */}
            <div className="space-y-1">
              <Label htmlFor={targetInputId}>Enregistrer comme</Label>
              <select
                id={targetInputId}
                value={target}
                onChange={handleTargetChange}
                className="h-11 md:h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="site_internet">
                  Prix du site internet (canal)
                </option>
                <option value="target_price">Prix cible du produit</option>
              </select>
              {currentTargetValue != null && (
                <p className="text-xs text-neutral-500">
                  Valeur actuelle : {fmtEur(currentTargetValue)}
                </p>
              )}
            </div>

            {/* Confirmation si valeur existante */}
            {confirming && parsedPrice != null && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Remplacer {fmtEur(currentTargetValue)} par {fmtEur(parsedPrice)}{' '}
                ?
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2 md:flex-row md:justify-end">
            <Button
              variant="outline"
              className="h-11 w-full md:h-9 md:w-auto"
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              className="h-11 w-full md:h-9 md:w-auto"
              onClick={handleSubmitClick}
              disabled={!priceValid || !targetReady || isPending}
            >
              {confirming ? 'Confirmer le remplacement' : 'Valider'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
