'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';

import type { EnrichedOrderItem } from '../types';

interface CommissionVersementCardProps {
  enrichedItems: EnrichedOrderItem[];
}

export function CommissionVersementCard({
  enrichedItems,
}: CommissionVersementCardProps) {
  if (enrichedItems.length === 0) return null;

  const catalogueItems = enrichedItems.filter(i => !i.created_by_affiliate);
  const affiliateProductItems = enrichedItems.filter(
    i => !!i.created_by_affiliate
  );

  // Catalogue: retrocession (what we pay the affiliate as commission)
  const catalogueCommissionHT = catalogueItems.reduce(
    (sum, item) => sum + (item.affiliate_margin ?? 0),
    0
  );
  const catalogueCommissionTTC = catalogueCommissionHT * 1.2;

  // Affiliate products: Verone takes a commission, reverses the rest
  const affiliateProductsTotalHT = affiliateProductItems.reduce(
    (sum, item) => sum + item.total_ht,
    0
  );
  const affiliateProductsTotalTTC = affiliateProductsTotalHT * 1.2;
  const affiliateProductsCommissionHT = affiliateProductItems.reduce(
    (sum, item) => sum + (item.affiliate_margin ?? 0),
    0
  );
  const affiliateProductsCommissionTTC = affiliateProductsCommissionHT * 1.2;
  const affiliateVersementHT =
    affiliateProductsTotalHT - affiliateProductsCommissionHT;
  const affiliateVersementTTC =
    affiliateProductsTotalTTC - affiliateProductsCommissionTTC;

  // Grand total to pay the affiliate
  const totalPayoutHT = catalogueCommissionHT + affiliateVersementHT;
  const totalPayoutTTC = catalogueCommissionTTC + affiliateVersementTTC;

  return (
    <Card className="border-emerald-200">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-700 font-bold">
            $
          </span>
          Commission & Versement
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Catalogue products commission */}
        {catalogueItems.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">
              Produits catalogue ({catalogueItems.length} ligne
              {catalogueItems.length > 1 ? 's' : ''})
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Commission affilié</span>
              <span className="font-medium text-teal-600">
                {formatCurrency(catalogueCommissionHT)} HT /{' '}
                {formatCurrency(catalogueCommissionTTC)} TTC
              </span>
            </div>
          </div>
        )}

        {/* Affiliate products: commission LinkMe + versement */}
        {affiliateProductItems.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-orange-500 mb-1">
              Produits affilié ({affiliateProductItems.length} ligne
              {affiliateProductItems.length > 1 ? 's' : ''})
            </p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CA produits affilié</span>
                <span className="text-gray-900">
                  {formatCurrency(affiliateProductsTotalHT)} HT /{' '}
                  {formatCurrency(affiliateProductsTotalTTC)} TTC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Commission LinkMe (Verone garde)
                </span>
                <span className="font-medium text-orange-500">
                  {formatCurrency(affiliateProductsCommissionHT)} HT /{' '}
                  {formatCurrency(affiliateProductsCommissionTTC)} TTC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Versement affilié (à reverser)
                </span>
                <span className="font-medium text-emerald-600">
                  {formatCurrency(affiliateVersementHT)} HT /{' '}
                  {formatCurrency(affiliateVersementTTC)} TTC
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Grand total */}
        <div className="pt-3 border-t-2 border-emerald-200">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">
              Total à verser à l&apos;affilié
            </span>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-700">
                {formatCurrency(totalPayoutTTC)} TTC
              </p>
              <p className="text-xs text-gray-500">
                {formatCurrency(totalPayoutHT)} HT
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
