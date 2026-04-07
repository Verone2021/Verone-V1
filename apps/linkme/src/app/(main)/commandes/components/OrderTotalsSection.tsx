'use client';

import { LINKME_CONSTANTS } from '@verone/utils';

import type { LinkMeOrder } from '../../../../hooks/use-linkme-orders';
import { formatPrice } from './order-detail.helpers';

interface OrderTotalsSectionProps {
  order: LinkMeOrder;
  canViewCommissions: boolean;
}

export function OrderTotalsSection({
  order,
  canViewCommissions,
}: OrderTotalsSectionProps) {
  const catalogueItems = order.items.filter(i => !i.is_affiliate_product);
  const affiliateItems = order.items.filter(i => i.is_affiliate_product);

  const catalogueCommissionHT = catalogueItems.reduce(
    (sum, i) => sum + i.affiliate_margin,
    0
  );

  const affiliateRevenueHT = affiliateItems.reduce(
    (sum, i) => sum + i.total_ht,
    0
  );
  const affiliateCommissionLinkMeHT = affiliateItems.reduce(
    (sum, i) => sum + i.total_ht * (i.affiliate_commission_rate / 100),
    0
  );
  const affiliateVersementHT = affiliateRevenueHT - affiliateCommissionLinkMeHT;

  const totalPayoutHT = catalogueCommissionHT + affiliateVersementHT;
  const totalPayoutTTC =
    totalPayoutHT * (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE);

  const hasAffiliateProducts = affiliateItems.length > 0;

  return (
    <section>
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total HT</p>
            <p className="text-lg font-semibold text-[#183559]">
              {formatPrice(order.total_ht)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Frais livraison HT</p>
            <p className="text-lg font-semibold text-[#183559]">
              {formatPrice(order.shipping_cost_ht)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total TTC</p>
            <p className="text-lg font-bold text-[#183559]">
              {formatPrice(order.total_ttc)}
            </p>
          </div>
          {canViewCommissions && (
            <div className="bg-emerald-50 rounded-lg p-3 -m-1">
              <p className="text-xs text-emerald-600 mb-1">
                Total a percevoir TTC
              </p>
              <p className="text-lg font-bold text-emerald-600">
                +{formatPrice(totalPayoutTTC)}
              </p>
              {hasAffiliateProducts && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] text-emerald-500">
                    Commission catalogue : +
                    {formatPrice(
                      catalogueCommissionHT *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </p>
                  <p className="text-[10px] text-emerald-500">
                    Vos produits : +
                    {formatPrice(
                      affiliateVersementHT *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
