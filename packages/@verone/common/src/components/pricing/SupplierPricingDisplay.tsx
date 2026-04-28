'use client';

import { ButtonV2 } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import { DollarSign, Edit, TrendingUp } from 'lucide-react';

import type {
  Product,
  VariantGroup,
  ChannelPricingRow,
} from './supplier-pricing-types';

interface SupplierPricingDisplayProps {
  product: Product;
  currentCostPrice: number;
  currentEcoTax: number;
  currentMarginPercentage: number;
  currentSellingPrice: number;
  isCostPriceManagedByGroup: boolean;
  channelPricing?: ChannelPricingRow[];
  onStartEdit: () => void;
  variantGroup?: VariantGroup | null;
  className?: string;
}

export function SupplierPricingDisplay({
  product,
  currentCostPrice,
  currentEcoTax,
  currentMarginPercentage,
  currentSellingPrice,
  isCostPriceManagedByGroup,
  channelPricing,
  onStartEdit,
  variantGroup,
  className,
}: SupplierPricingDisplayProps) {
  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Tarification
        </h3>
        <ButtonV2 variant="outline" size="sm" onClick={onStartEdit}>
          <Edit className="h-3 w-3 mr-1" />
          Modifier
        </ButtonV2>
      </div>

      {/* Banner si cost_price géré par groupe */}
      {isCostPriceManagedByGroup && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          ℹ️ Le prix d'achat et l'éco-taxe sont communs à toutes les variantes
          du groupe "{variantGroup?.name}".{' '}
          <a
            href={`/produits/catalogue/variantes/${variantGroup?.id}`}
            className="underline font-medium hover:text-blue-900"
          >
            Modifier depuis la page du groupe
          </a>
        </div>
      )}

      <div className="space-y-4">
        {/* Prix d'achat */}
        {currentCostPrice > 0 && (
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-xs text-red-600 font-medium mb-1">
              📦 PRIX D'ACHAT FOURNISSEUR
            </div>
            <div className="flex justify-between items-center">
              <span className="text-red-700 font-medium">Coût HT:</span>
              <span className="text-lg font-bold text-red-800">
                {formatPrice(currentCostPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Éco-taxe */}
        {currentEcoTax > 0 && (
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-xs text-orange-600 font-medium mb-1">
              🌿 TAXE ÉCO-RESPONSABLE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-orange-700 font-medium">
                Éco-participation:
              </span>
              <span className="text-lg font-bold text-orange-800">
                {formatPrice(currentEcoTax)}
              </span>
            </div>
          </div>
        )}

        {/* Taux de marge */}
        {currentMarginPercentage > 0 && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-600 font-medium mb-1">
              📈 TAUX DE MARGE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-blue-700 font-medium">Pourcentage:</span>
              <span
                className={cn(
                  'text-lg font-bold',
                  currentMarginPercentage > 20
                    ? 'text-green-600'
                    : currentMarginPercentage > 5
                      ? 'text-black'
                      : 'text-red-600'
                )}
              >
                {currentMarginPercentage}%
              </span>
            </div>
          </div>
        )}

        {/* Prix de vente calculé */}
        {currentCostPrice > 0 && currentMarginPercentage > 0 && (
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-xs text-green-600 font-medium mb-1">
              💰 PRIX MINIMUM DE VENTE
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-700 font-medium">Prix HT:</span>
              <span className="text-xl font-bold text-green-800">
                {formatPrice(currentSellingPrice)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-700">Marge brute:</span>
              <span className="font-semibold text-green-700">
                {formatPrice(currentSellingPrice - currentCostPrice)}
              </span>
            </div>
          </div>
        )}

        {/* Message si pas de données */}
        {(!currentCostPrice || !currentMarginPercentage) && (
          <div className="text-center text-gray-400 text-xs italic py-2">
            {!currentCostPrice && !currentMarginPercentage
              ? "Prix d'achat et taux de marge non renseignés"
              : !currentCostPrice
                ? "Prix d'achat non renseigné"
                : 'Taux de marge non renseigné'}
          </div>
        )}

        {/* Historique prix d'achat */}
        {currentCostPrice > 0 &&
          (product.cost_price_avg != null ||
            product.cost_price_min != null ||
            product.cost_price_last != null) && (
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <div className="text-xs text-neutral-600 font-medium mb-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                HISTORIQUE PRIX D'ACHAT
              </div>
              <div className="space-y-1.5 text-sm">
                {product.cost_price_avg != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-neutral-500 text-xs whitespace-nowrap">
                      Prix moyen
                    </span>
                    <span className="font-medium text-neutral-800">
                      {formatPrice(product.cost_price_avg)}
                      {product.cost_net_avg != null && (
                        <span className="text-neutral-500 font-normal text-xs ml-1">
                          ({formatPrice(product.cost_net_avg)} net)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {product.cost_price_last != null && (
                  <div className="flex items-baseline gap-2">
                    <span className="text-neutral-500 text-xs whitespace-nowrap">
                      Dernier prix
                    </span>
                    <span className="font-medium text-neutral-800">
                      {formatPrice(product.cost_price_last)}
                      {product.cost_net_last != null && (
                        <span className="text-neutral-500 font-normal text-xs ml-1">
                          ({formatPrice(product.cost_net_last)} net)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {product.cost_price_min != null &&
                  product.cost_price_max != null && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-neutral-500 text-xs whitespace-nowrap">
                        Min / Max
                      </span>
                      <span className="font-medium text-neutral-800">
                        {formatPrice(product.cost_price_min)}
                        {product.cost_net_min != null && (
                          <span className="text-neutral-500 font-normal text-xs ml-1">
                            ({formatPrice(product.cost_net_min)})
                          </span>
                        )}
                        {' / '}
                        {formatPrice(product.cost_price_max)}
                        {product.cost_net_max != null && (
                          <span className="text-neutral-500 font-normal text-xs ml-1">
                            ({formatPrice(product.cost_net_max)})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                {product.cost_price_count != null &&
                  product.cost_price_count > 0 && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-neutral-500 text-xs whitespace-nowrap">
                        Nb achats
                      </span>
                      <span className="font-medium text-neutral-800">
                        {product.cost_price_count}
                      </span>
                    </div>
                  )}
                {product.target_margin_percentage != null &&
                  product.target_margin_percentage !==
                    product.margin_percentage && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-neutral-500 text-xs whitespace-nowrap">
                        Marge minimum
                      </span>
                      <span className="font-medium text-neutral-800">
                        {product.target_margin_percentage}%
                      </span>
                    </div>
                  )}
              </div>
            </div>
          )}

        {/* Prix par canal de vente */}
        {channelPricing && channelPricing.length > 0 && (
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
            <div className="text-xs text-neutral-600 font-medium mb-2">
              <DollarSign className="h-3 w-3 inline mr-1" />
              PRIX PAR CANAL DE VENTE
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-neutral-500 border-b border-neutral-200">
                    <th className="text-left py-1.5 pr-3 font-medium">Canal</th>
                    <th className="text-right py-1.5 px-2 font-medium">
                      Prix HT
                    </th>
                    <th className="text-right py-1.5 px-2 font-medium">
                      Remise
                    </th>
                    <th className="text-right py-1.5 pl-2 font-medium">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {channelPricing.map(ch => {
                    const price = ch.custom_price_ht ?? ch.public_price_ht;
                    const hasPrice = price != null && price > 0;
                    return (
                      <tr
                        key={ch.channel_id}
                        className="border-b border-neutral-100 last:border-0"
                      >
                        <td className="py-1.5 pr-3 text-neutral-800">
                          {ch.channel_name}
                        </td>
                        <td className="py-1.5 px-2 text-right text-neutral-700">
                          {hasPrice ? formatPrice(price) : '--'}
                        </td>
                        <td className="py-1.5 px-2 text-right text-neutral-700">
                          {ch.discount_rate != null
                            ? `${ch.discount_rate}%`
                            : '--'}
                        </td>
                        <td className="py-1.5 pl-2 text-right">
                          {ch.is_active && hasPrice ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                              Actif
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-500">
                              Non configure
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
