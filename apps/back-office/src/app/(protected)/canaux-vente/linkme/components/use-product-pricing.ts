'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  useCalculateLinkMeMargins,
  LINKME_MARGIN_DEFAULTS,
} from '../hooks/use-linkme-margin-calculator';
import type { LinkMeProductDetail, LinkMePricingUpdate } from '../types';

import {
  htToTtc,
  ttcToHt,
  calculatePricingCompleteness,
} from './product-pricing-card.helpers';

export function useProductPricing(
  product: LinkMeProductDetail,
  onSave: (data: LinkMePricingUpdate) => Promise<void>
) {
  const [formData, setFormData] = useState<LinkMePricingUpdate>({
    min_margin_rate: product.min_margin_rate,
    max_margin_rate: product.max_margin_rate,
    suggested_margin_rate: product.suggested_margin_rate,
    channel_commission_rate: product.linkme_commission_rate ?? undefined,
    custom_price_ht: product.selling_price_ht,
    public_price_ht: product.public_price_ht,
    buffer_rate: product.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate,
  });

  const [isDirty, setIsDirty] = useState(false);

  const [publicPriceTtc, setPublicPriceTtc] = useState<number | null>(() => {
    const ht = product.public_price_ht;
    return ht !== null && ht !== undefined ? htToTtc(ht) : null;
  });

  const marginResult = useCalculateLinkMeMargins(
    formData.custom_price_ht ?? product.selling_price_ht,
    formData.public_price_ht,
    formData.channel_commission_rate,
    formData.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate
  );

  useEffect(() => {
    if (marginResult?.isProductSellable) {
      const minMarginPercent = Math.round(marginResult.minRate * 100 * 10) / 10;
      const maxMarginPercent = Math.round(marginResult.maxRate * 100 * 10) / 10;
      const suggestedMarginPercent =
        Math.round(marginResult.suggestedRate * 100 * 10) / 10;

      setFormData(prev => ({
        ...prev,
        min_margin_rate: minMarginPercent,
        max_margin_rate: maxMarginPercent,
        suggested_margin_rate: suggestedMarginPercent,
      }));
      setIsDirty(true);
    }
  }, [marginResult]);

  useEffect(() => {
    setFormData({
      min_margin_rate: product.min_margin_rate,
      max_margin_rate: product.max_margin_rate,
      suggested_margin_rate: product.suggested_margin_rate,
      channel_commission_rate: product.linkme_commission_rate ?? undefined,
      custom_price_ht: product.selling_price_ht,
      public_price_ht: product.public_price_ht,
      buffer_rate: product.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate,
    });
    setPublicPriceTtc(
      product.public_price_ht !== null && product.public_price_ht !== undefined
        ? htToTtc(product.public_price_ht)
        : null
    );
    setIsDirty(false);
  }, [product]);

  const completeness = useMemo(
    () => calculatePricingCompleteness(formData),
    [formData]
  );

  const isAffiliateProduct = !!product.created_by_affiliate;

  const customerPriceHT = useMemo(() => {
    const sellingPrice = formData.custom_price_ht;
    const commissionRate = formData.channel_commission_rate;

    if (!sellingPrice || sellingPrice <= 0) return null;
    if (isAffiliateProduct) return sellingPrice;

    const commissionDecimal =
      commissionRate !== null && commissionRate !== undefined
        ? commissionRate / 100
        : 0;
    return sellingPrice * (1 + commissionDecimal);
  }, [
    formData.custom_price_ht,
    formData.channel_commission_rate,
    isAffiliateProduct,
  ]);

  const handleChange = (field: keyof LinkMePricingUpdate, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    setIsDirty(true);
  };

  const handlePublicPriceTtcChange = (ttcValue: string) => {
    const ttc = ttcValue === '' ? null : parseFloat(ttcValue);
    setPublicPriceTtc(ttc);
    const htValue = ttc !== null && !isNaN(ttc) ? ttcToHt(ttc) : null;
    setFormData(prev => ({ ...prev, public_price_ht: htValue }));
    setIsDirty(true);
  };

  const handlePublicPriceHtChange = (htValue: string) => {
    const ht = htValue === '' ? null : parseFloat(htValue);
    setFormData(prev => ({ ...prev, public_price_ht: ht }));
    setPublicPriceTtc(ht !== null && !isNaN(ht) ? htToTtc(ht) : null);
    setIsDirty(true);
  };

  const handleBufferChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value) / 100;
    setFormData(prev => ({ ...prev, buffer_rate: numValue }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsDirty(false);
  };

  const handleCopyMinPrice = () => {
    if (product.min_selling_price_ht !== null) {
      setFormData(prev => ({
        ...prev,
        custom_price_ht: product.min_selling_price_ht,
      }));
      setIsDirty(true);
    }
  };

  return {
    formData,
    isDirty,
    publicPriceTtc,
    marginResult,
    completeness,
    isAffiliateProduct,
    customerPriceHT,
    bufferDisplayValue:
      formData.buffer_rate !== null && formData.buffer_rate !== undefined
        ? Math.round(formData.buffer_rate * 100 * 10) / 10
        : '',
    formattedMinPrice:
      product.min_selling_price_ht !== null
        ? product.min_selling_price_ht.toFixed(2)
        : null,
    handleChange,
    handlePublicPriceTtcChange,
    handlePublicPriceHtChange,
    handleBufferChange,
    handleSave,
    handleCopyMinPrice,
  };
}
