'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import {
  useCalculateLinkMeMargins,
  LINKME_MARGIN_DEFAULTS,
} from '../hooks/use-linkme-margin-calculator';
import type { SelectionItem } from '../hooks/use-linkme-selections';

interface UseSelectionProductDetailProps {
  item: SelectionItem | null;
  mode: 'view' | 'edit';
  onSave?: (
    itemId: string,
    updates: { marginRate?: number; customPriceHT?: number }
  ) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

export function useSelectionProductDetail({
  item,
  mode,
  onSave,
  onOpenChange,
}: UseSelectionProductDetailProps) {
  const [localMarginRate, setLocalMarginRate] = useState<number>(0);
  const [localCustomPriceHT, setLocalCustomPriceHT] = useState<number>(0);
  const [hasChanges, setHasChanges] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (item) {
      setLocalMarginRate(item.margin_rate / 100);
      setLocalCustomPriceHT(item.base_price_ht ?? 0);
      setHasChanges(false);
    }
  }, [item]);

  const marginResult = useCalculateLinkMeMargins(
    mode === 'edit' ? localCustomPriceHT : item?.base_price_ht,
    item?.public_price_ht,
    item?.commission_rate,
    item?.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate
  );

  const basePrice =
    mode === 'edit' ? localCustomPriceHT : (item?.base_price_ht ?? 0);
  const commissionRate = (item?.commission_rate ?? 0) / 100;
  const isAffiliateProduct = !!item?.product?.created_by_affiliate;
  const sellingPriceWithMargin = basePrice * (1 + localMarginRate);

  const finalPriceWithCommission = isAffiliateProduct
    ? basePrice
    : basePrice * (1 + localMarginRate) * (1 + commissionRate);

  const prixClientLinkMe = isAffiliateProduct
    ? basePrice
    : basePrice * (1 + commissionRate);

  const affiliateCommissionRate = item?.product?.affiliate_commission_rate ?? 0;
  const affiliateCommissionAmount = isAffiliateProduct
    ? basePrice * (affiliateCommissionRate / 100)
    : 0;
  const affiliateNetRevenue = isAffiliateProduct
    ? basePrice - affiliateCommissionAmount
    : 0;

  const prixCatalogueLinkMe = item?.catalog_price_ht
    ? item.catalog_price_ht * (1 + commissionRate)
    : null;

  const remiseVsCatalogue =
    prixCatalogueLinkMe && prixClientLinkMe
      ? ((prixClientLinkMe - prixCatalogueLinkMe) / prixCatalogueLinkMe) * 100
      : null;

  const bufferRate = item?.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate;

  const handleMarginChange = useCallback((newRate: number) => {
    setLocalMarginRate(newRate);
    setHasChanges(true);
  }, []);

  const handlePriceChange = useCallback((newPrice: number) => {
    setLocalCustomPriceHT(newPrice);
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    if (!item || !hasChanges || !onSave) return;

    if (item.public_price_ht && item.public_price_ht > 0) {
      const commRate = (item.commission_rate ?? 0) / 100;
      const marginRateDecimal = localMarginRate;
      const bufRate = item.buffer_rate ?? 0.05;

      const finalPrice =
        localCustomPriceHT * (1 + marginRateDecimal) * (1 + commRate);
      const maxAllowedPrice = item.public_price_ht * (1 - bufRate);

      if (finalPrice > maxAllowedPrice) {
        alert(
          `Le prix de vente final (${finalPrice.toFixed(2)} €) dépasse le prix public autorisé (${maxAllowedPrice.toFixed(2)} €).\n\n` +
            `Veuillez réduire la marge ou le prix de vente HT.`
        );
        return;
      }
    }

    await onSave(item.id, {
      marginRate: localMarginRate * 100,
      customPriceHT: localCustomPriceHT,
    });
    setHasChanges(false);
    onOpenChange(false);
  };

  const handleCancel = () => {
    if (item) {
      setLocalMarginRate(item.margin_rate / 100);
      setLocalCustomPriceHT(item.base_price_ht ?? 0);
      setHasChanges(false);
    }
    onOpenChange(false);
  };

  const handleDownloadPdf = async (showMargin: boolean) => {
    if (!item || !pdfContentRef.current) return;

    setIsGeneratingPdf(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const marginSection =
        pdfContentRef.current.querySelector('.margin-section');
      if (marginSection && !showMargin) {
        (marginSection as HTMLElement).style.display = 'none';
      }

      const canvas = await html2canvas(pdfContentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });

      if (marginSection && !showMargin) {
        (marginSection as HTMLElement).style.display = '';
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

      const filename = `fiche-produit-${item.product?.sku ?? item.id}${showMargin ? '' : '-sans-marge'}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return {
    localMarginRate,
    localCustomPriceHT,
    hasChanges,
    isGeneratingPdf,
    pdfContentRef,
    marginResult,
    basePrice,
    commissionRate,
    isAffiliateProduct,
    sellingPriceWithMargin,
    finalPriceWithCommission,
    prixClientLinkMe,
    affiliateCommissionRate,
    affiliateCommissionAmount,
    affiliateNetRevenue,
    prixCatalogueLinkMe,
    remiseVsCatalogue,
    bufferRate,
    handleMarginChange,
    handlePriceChange,
    handleSave,
    handleCancel,
    handleDownloadPdf,
  };
}
