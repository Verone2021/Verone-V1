import type { LinkMeCatalogProduct } from '../../hooks/use-linkme-catalog';

import type { SelectedProduct } from './new-selection.types';
import {
  DEFAULT_COMMISSION_RATE,
  DEFAULT_MARGIN_RATE,
  MIN_MARGIN_RATE,
} from './new-selection.types';

export function buildNewSelectedProduct(
  product: LinkMeCatalogProduct,
  defaultMarginRate?: number | null
): SelectedProduct {
  const basePriceHT = Number(product.product_price_ht);
  const commissionRate = product.channel_commission_rate
    ? Number(product.channel_commission_rate) / 100
    : DEFAULT_COMMISSION_RATE;

  const minMarginRate = product.min_margin_rate
    ? Number(product.min_margin_rate) / 100
    : MIN_MARGIN_RATE;
  const maxMarginRate = product.max_margin_rate
    ? Number(product.max_margin_rate) / 100
    : 0.4;
  const suggestedMarginRate = product.suggested_margin_rate
    ? Number(product.suggested_margin_rate) / 100
    : maxMarginRate / 3;

  const defaultMargin = defaultMarginRate
    ? defaultMarginRate / 100
    : suggestedMarginRate || DEFAULT_MARGIN_RATE;

  const marginRate = Math.min(
    Math.max(defaultMargin, minMarginRate),
    maxMarginRate
  );

  return {
    product_id: product.product_id,
    name: product.product_name,
    sku: product.product_reference,
    image_url: product.product_image_url,
    base_price_ht: basePriceHT,
    linkme_price_ht: basePriceHT * (1 + commissionRate),
    public_price_ht: null,
    commission_rate: commissionRate,
    margin_rate: marginRate,
    max_margin_rate: maxMarginRate,
    suggested_margin_rate: suggestedMarginRate,
  };
}
