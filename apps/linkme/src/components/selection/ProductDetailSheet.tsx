'use client';

/**
 * ProductDetailSheet - Modal lecture seule detail produit avec feu tricolore
 * Affiche le breakdown prix/marge/commission pour un produit de selection.
 * L'affilie peut voir mais pas modifier (modification via page configuration).
 *
 * @module ProductDetailSheet
 * @since 2026-02
 */

import { useState, useEffect, useMemo } from 'react';

import Image from 'next/image';

import { Dialog, DialogContent, DialogTitle } from '@verone/ui';

import {
  Package,
  X,
  Euro,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Settings,
  Loader2,
} from 'lucide-react';

import type { Database } from '@verone/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@verone/utils/supabase/client';

import type { SelectionItem } from '../../lib/hooks/use-user-selection';
import {
  calculateLinkMeMargins,
  getMarginColor,
  type MarginCalculationResult,
} from '../../lib/utils/margin-calculator';

interface ProductDetailSheetProps {
  item: SelectionItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Lien vers la page configuration de la selection */
  configureHref: string;
  /** Taux de commission LinkMe de l'affilie (ex: 5 = 5%) */
  commissionRate: number;
}

/** Donnees supplementaires du channel_pricing */
interface ChannelPricingData {
  public_price_ht: number | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

/** Barre de feu tricolore compacte read-only */
function MarginTrafficLight({
  marginResult,
  marginRate,
}: {
  marginResult: MarginCalculationResult;
  marginRate: number;
}) {
  const { maxRate, suggestedRate, orangeZoneEnd, isProductSellable } =
    marginResult;
  const color = getMarginColor(marginRate, marginResult);

  if (!isProductSellable) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
        Donnees de marge non disponibles
      </div>
    );
  }

  const greenWidth = maxRate > 0 ? (suggestedRate / maxRate) * 100 : 33.33;
  const orangeWidth = greenWidth;

  const suggestedPercent = Math.round(suggestedRate * 100 * 10) / 10;
  const orangeEndPercent =
    Math.round((orangeZoneEnd || suggestedRate * 2) * 100 * 10) / 10;
  const maxPercent = Math.round(maxRate * 100 * 10) / 10;

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-gray-400">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-2.5 w-2.5 text-green-600" />
          <span>Competitif</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-2.5 w-2.5 text-orange-500" />
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-2.5 w-2.5 text-red-500" />
          <span>Proche public</span>
        </div>
      </div>

      {/* Traffic light bar */}
      <div className="relative">
        <div className="flex h-2.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${greenWidth}%` }}
          />
          <div
            className="bg-orange-500 transition-all"
            style={{ width: `${orangeWidth}%` }}
          />
          <div className="flex-1 bg-red-500 transition-all" />
        </div>

        {/* Current value marker */}
        {maxRate > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all"
            style={{
              left: `${Math.min((marginRate / maxRate) * 100, 100)}%`,
            }}
          >
            <div
              className={`h-4 w-4 -ml-2 rounded-full border-2 border-white shadow-md ${
                color === 'green'
                  ? 'bg-green-600'
                  : color === 'orange'
                    ? 'bg-orange-600'
                    : 'bg-red-600'
              }`}
            />
          </div>
        )}

        {/* Zone markers */}
        {suggestedRate > 0 && maxRate > 0 && (
          <div
            className="absolute top-0 h-2.5 border-l border-dashed border-green-800/40"
            style={{ left: `${(suggestedRate / maxRate) * 100}%` }}
          />
        )}
        {orangeZoneEnd > 0 && maxRate > 0 && (
          <div
            className="absolute top-0 h-2.5 border-l border-dashed border-orange-700/40"
            style={{ left: `${(orangeZoneEnd / maxRate) * 100}%` }}
          />
        )}
      </div>

      {/* Percentages */}
      <div className="flex justify-between text-[10px]">
        <span className="text-gray-400">1%</span>
        <span className="font-medium text-green-600">{suggestedPercent}%</span>
        <span className="font-medium text-orange-500">{orangeEndPercent}%</span>
        <span className="text-gray-400">{maxPercent}%</span>
      </div>

      {/* Current value badge */}
      <div
        className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium ${
          color === 'green'
            ? 'bg-green-50 text-green-700'
            : color === 'orange'
              ? 'bg-orange-50 text-orange-700'
              : 'bg-red-50 text-red-700'
        }`}
      >
        {color === 'green' && <TrendingUp className="h-3 w-3" />}
        {color === 'orange' && <AlertTriangle className="h-3 w-3" />}
        {color === 'red' && <AlertCircle className="h-3 w-3" />}
        <span>Marge actuelle : {(marginRate * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
}

export function ProductDetailSheet({
  item,
  isOpen,
  onClose,
  configureHref,
  commissionRate,
}: ProductDetailSheetProps): React.JSX.Element | null {
  const [publicPriceHT, setPublicPriceHT] = useState<number | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  // Fetch public_price_ht from channel_pricing when modal opens
  useEffect(() => {
    if (!isOpen || !item) {
      setPublicPriceHT(null);
      return;
    }

    let cancelled = false;
    setLoadingPrice(true);

    const fetchPublicPrice = async () => {
      const supabase: SupabaseClient<Database> = createClient();
      const { data } = await supabase
        .from('channel_pricing')
        .select('public_price_ht')
        .eq('product_id', item.product_id)
        .eq('channel', 'linkme')
        .maybeSingle<ChannelPricingData>();

      if (!cancelled) {
        setPublicPriceHT(data?.public_price_ht ?? null);
        setLoadingPrice(false);
      }
    };

    void fetchPublicPrice().catch(error => {
      console.error('[ProductDetailSheet] fetch public price failed:', error);
      if (!cancelled) setLoadingPrice(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, item]);

  // Margin calculation
  const marginRateDecimal = (item?.margin_rate ?? 0) / 100;
  const platformFeeRate = commissionRate / 100;

  const marginResult = useMemo(() => {
    if (!item || !publicPriceHT || publicPriceHT <= 0) return null;
    return calculateLinkMeMargins({
      basePriceHT: item.base_price_ht,
      publicPriceHT,
      platformFeeRate,
    });
  }, [item, publicPriceHT, platformFeeRate]);

  // Price calculations
  const basePrice = item?.base_price_ht ?? 0;
  const isAffiliateProduct = item?.is_affiliate_product ?? false;

  // Prix client = base * (1 + commission) for catalog products
  const prixClientLinkMe = isAffiliateProduct
    ? basePrice
    : basePrice * (1 + platformFeeRate);

  // Selling price with margin (taux de marque)
  const sellingPriceWithMargin =
    marginRateDecimal < 1 ? basePrice / (1 - marginRateDecimal) : basePrice;

  // Final price for client
  const finalPrice = isAffiliateProduct
    ? basePrice
    : sellingPriceWithMargin * (1 + platformFeeRate);

  // Margin amount in euros
  const marginAmountEuro = sellingPriceWithMargin - basePrice;

  // Commission amount
  const commissionAmountEuro = isAffiliateProduct
    ? basePrice * ((item?.affiliate_commission_rate ?? 0) / 100)
    : basePrice * platformFeeRate;

  if (!item) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        hideCloseButton
        className="max-w-lg max-h-[85vh] overflow-y-auto p-0 rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
          <DialogTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Euro className="h-4 w-4 text-linkme-turquoise" />
            Detail produit
          </DialogTitle>

          <div className="flex items-center gap-1.5">
            <a
              href={configureHref}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-linkme-turquoise border border-linkme-turquoise/30 rounded-lg hover:bg-linkme-turquoise/5 transition-colors"
            >
              <Settings className="h-3 w-3" />
              Configurer
            </a>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
              aria-label="Fermer"
            >
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Product info */}
          <div className="flex gap-3">
            <div className="relative h-20 w-20 flex-shrink-0 rounded-xl bg-gray-50 overflow-hidden border border-gray-100">
              {item.product_image_url ? (
                <Image
                  src={item.product_image_url}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-8 w-8 text-gray-200" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-mono">
                {item.product_reference}
              </p>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                {item.product_name}
              </h3>
              {item.subcategory_name && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.category_name ? `${item.category_name} > ` : ''}
                  {item.subcategory_name}
                </p>
              )}
              {isAffiliateProduct && (
                <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">
                  Produit affilie
                </span>
              )}
            </div>
          </div>

          {/* Pricing section */}
          <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4 space-y-3">
            <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5 text-linkme-turquoise" />
              Tarification
            </h4>

            {/* Price grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-gray-400">Prix de vente HT</p>
                <p className="text-lg font-bold font-mono text-gray-900">
                  {formatPrice(basePrice)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-linkme-turquoise">
                  {isAffiliateProduct ? 'Prix client' : 'Prix client LinkMe'}
                </p>
                <p className="text-lg font-bold font-mono text-linkme-turquoise">
                  {formatPrice(prixClientLinkMe)}
                </p>
                {!isAffiliateProduct && (
                  <p className="text-[10px] text-gray-400">
                    (x{((1 + platformFeeRate) * 100).toFixed(0)}%)
                  </p>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* Margin with traffic light */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">
                  Marge affilie
                </p>
                {marginResult ? (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                      getMarginColor(marginRateDecimal, marginResult) ===
                      'green'
                        ? 'border-green-400 text-green-600 bg-green-50'
                        : getMarginColor(marginRateDecimal, marginResult) ===
                            'orange'
                          ? 'border-orange-400 text-orange-600 bg-orange-50'
                          : 'border-red-400 text-red-600 bg-red-50'
                    }`}
                  >
                    {(marginRateDecimal * 100).toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-xs font-mono text-gray-500">
                    {(marginRateDecimal * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              {loadingPrice ? (
                <div className="flex items-center justify-center py-3">
                  <Loader2 className="h-4 w-4 text-linkme-turquoise animate-spin" />
                </div>
              ) : marginResult ? (
                <MarginTrafficLight
                  marginResult={marginResult}
                  marginRate={marginRateDecimal}
                />
              ) : (
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 text-[11px] text-gray-500">
                  Feu tricolore non disponible (prix public manquant)
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            {/* Final price */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">
                  Prix final client HT
                </p>
                <p className="text-[10px] text-gray-400">
                  {isAffiliateProduct
                    ? '(prix affilie)'
                    : '(base + marge + commission)'}
                </p>
              </div>
              <p className="text-xl font-bold text-linkme-turquoise">
                {formatPrice(finalPrice)}
              </p>
            </div>
          </div>

          {/* Calculation breakdown */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-2">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Detail des calculs
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <span className="text-gray-400">Prix de vente HT</span>
              <span className="font-mono text-right text-gray-700">
                {formatPrice(basePrice)}
              </span>

              {isAffiliateProduct ? (
                <>
                  <span className="text-gray-400">
                    Commission Verone ({item.affiliate_commission_rate ?? 0}%)
                  </span>
                  <span className="font-mono text-right text-amber-600">
                    -{formatPrice(commissionAmountEuro)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-gray-400">
                    Commission LinkMe ({commissionRate.toFixed(0)}%)
                  </span>
                  <span className="font-mono text-right text-gray-500">
                    +{formatPrice(commissionAmountEuro)}
                  </span>

                  <span className="text-gray-400">
                    Marge affilie ({(marginRateDecimal * 100).toFixed(1)}%)
                  </span>
                  <span className="font-mono text-right text-gray-500">
                    +{formatPrice(marginAmountEuro)}
                  </span>
                </>
              )}

              <div className="col-span-2 h-px bg-gray-100 my-1" />

              <span className="font-medium text-gray-700">
                Prix final client
              </span>
              <span className="font-mono text-right font-bold text-linkme-turquoise">
                {formatPrice(finalPrice)}
              </span>

              {publicPriceHT && publicPriceHT > 0 && (
                <>
                  <span className="text-gray-400">Prix public HT</span>
                  <span className="font-mono text-right text-gray-500">
                    {formatPrice(publicPriceHT)}
                  </span>

                  <span className="text-gray-400">Ecart vs public</span>
                  <span
                    className={`font-mono text-right ${
                      finalPrice <= publicPriceHT
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {finalPrice <= publicPriceHT ? '-' : '+'}
                    {formatPrice(Math.abs(publicPriceHT - finalPrice))} (
                    {(
                      ((publicPriceHT - finalPrice) / publicPriceHT) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
