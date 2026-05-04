'use client';

import { useState, useMemo } from 'react';

import { useToast } from '@verone/common/hooks';

import {
  useCreateLinkMeOrder,
  type CreateLinkMeOrderInput,
} from '@verone/orders/hooks/linkme/use-linkme-orders';
import {
  useLinkMeAffiliates,
  type AffiliateType,
} from '@verone/orders/hooks/linkme/use-linkme-affiliates';
import {
  useLinkMeSelectionsByEnseigne,
  useLinkMeSelection,
  type SelectionItem,
} from '@verone/orders/hooks/linkme/use-linkme-selections';

import type { UnifiedCustomer } from '../../../modals/customer-selector';
import type { LinkMeCartItem } from '../LinkMeCartTable';

interface UseLinkMeCartOptions {
  selectedCustomer: UnifiedCustomer | null;
  orderDate: string;
  notes: string;
  setLoading: (v: boolean) => void;
  resetForm: () => void;
  setOpen: (v: boolean) => void;
  onSuccess?: () => void;
}

export function useLinkMeCart({
  selectedCustomer,
  orderDate,
  notes,
  setLoading,
  resetForm,
  setOpen,
  onSuccess,
}: UseLinkMeCartOptions) {
  const { toast } = useToast();

  const [linkmeAffiliateType, setLinkmeAffiliateType] =
    useState<AffiliateType | null>(null);
  const [linkmeAffiliateId, setLinkmeAffiliateId] = useState<string | null>(
    null
  );
  const [linkmeSelectionId, setLinkmeSelectionId] = useState<string | null>(
    null
  );
  const [linkmeCart, setLinkmeCart] = useState<LinkMeCartItem[]>([]);

  const { data: linkmeAffiliates, isLoading: loadingAffiliates } =
    useLinkMeAffiliates(linkmeAffiliateType ?? undefined);

  const selectedLinkmeAffiliate = useMemo(() => {
    return linkmeAffiliates?.find(a => a.id === linkmeAffiliateId);
  }, [linkmeAffiliates, linkmeAffiliateId]);

  const effectiveEnseigneId = selectedLinkmeAffiliate?.enseigne_id ?? null;
  const { data: linkmeSelections, isLoading: loadingSelections } =
    useLinkMeSelectionsByEnseigne(effectiveEnseigneId);
  const { data: linkmeSelectionDetail, isLoading: loadingSelectionDetail } =
    useLinkMeSelection(linkmeSelectionId);
  const { data: previewSelection, isLoading: previewLoading } =
    useLinkMeSelection(linkmeSelectionId);

  const createLinkMeOrderMutation = useCreateLinkMeOrder();

  const addLinkMeProduct = (item: SelectionItem) => {
    const sellingPrice =
      item.selling_price_ht ??
      item.base_price_ht * (1 + (item.margin_rate ?? 0) / 100);
    const marginRate = (item.margin_rate ?? 0) / 100;

    const newItem: LinkMeCartItem = {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name ?? 'Produit inconnu',
      sku: item.product?.sku ?? '',
      quantity: 1,
      unit_price_ht: Math.round(sellingPrice * 100) / 100,
      base_price_ht: item.base_price_ht,
      retrocession_rate: marginRate,
      commission_rate: (item.commission_rate ?? 0) / 100,
      linkme_selection_item_id: item.id,
      product_image_url: item.product_image_url,
      product_image_cloudflare_id: item.product_image_cloudflare_id,
    };

    setLinkmeCart(prev => {
      const existingIndex = prev.findIndex(
        p => p.product_id === item.product_id
      );
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const updateLinkMeQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setLinkmeCart(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const removeLinkMeItem = (itemId: string) => {
    setLinkmeCart(prev => prev.filter(item => item.id !== itemId));
  };

  const linkmeCartTotals = useMemo(() => {
    let totalHt = 0;
    let commissionAffilie = 0;
    let fraisLinkMe = 0;
    let redevanceAffilie = 0;

    for (const item of linkmeCart) {
      const lineTotal = item.quantity * item.unit_price_ht;
      totalHt += lineTotal;

      if (item.commission_rate > 0) {
        const frais = item.unit_price_ht * item.commission_rate * item.quantity;
        fraisLinkMe += frais;
        redevanceAffilie += lineTotal - frais;
      } else {
        commissionAffilie +=
          (item.unit_price_ht - item.base_price_ht) * item.quantity;
      }
    }

    return {
      totalHt: Math.round(totalHt * 100) / 100,
      totalTtc: Math.round(totalHt * 1.2 * 100) / 100,
      totalRetrocession: Math.round(commissionAffilie * 100) / 100,
      fraisLinkMe: Math.round(fraisLinkMe * 100) / 100,
      redevanceAffilie: Math.round(redevanceAffilie * 100) / 100,
      caNetVerone:
        Math.round((totalHt - commissionAffilie - redevanceAffilie) * 100) /
        100,
    };
  }, [linkmeCart]);

  const resetLinkMeCart = () => {
    setLinkmeAffiliateType(null);
    setLinkmeAffiliateId(null);
    setLinkmeSelectionId(null);
    setLinkmeCart([]);
  };

  const handleLinkMeSubmit = async () => {
    if (
      !selectedCustomer ||
      linkmeCart.length === 0 ||
      !linkmeSelectionDetail?.affiliate_id
    ) {
      toast({
        title: 'Erreur',
        description:
          'Veuillez sélectionner un client et ajouter des produits au panier',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const input: CreateLinkMeOrderInput = {
        customer_type:
          selectedCustomer.type === 'professional'
            ? 'organization'
            : 'individual',
        customer_organisation_id:
          selectedCustomer.type === 'professional' ? selectedCustomer.id : null,
        individual_customer_id:
          selectedCustomer.type === 'individual' ? selectedCustomer.id : null,
        affiliate_id: linkmeSelectionDetail.affiliate_id,
        items: linkmeCart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          base_price_ht: item.base_price_ht,
          retrocession_rate: item.retrocession_rate,
          linkme_selection_item_id: item.linkme_selection_item_id,
        })),
        order_date: orderDate,
        internal_notes: notes || undefined,
      };

      await createLinkMeOrderMutation.mutateAsync(input);

      toast({
        title: 'Commande LinkMe créée',
        description: 'La commande a été créée avec succès.',
      });

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur création commande LinkMe:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande LinkMe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    linkmeAffiliateType,
    setLinkmeAffiliateType,
    linkmeAffiliateId,
    setLinkmeAffiliateId,
    linkmeSelectionId,
    setLinkmeSelectionId,
    linkmeCart,
    setLinkmeCart,
    linkmeAffiliates,
    loadingAffiliates,
    linkmeSelections,
    loadingSelections,
    linkmeSelectionDetail,
    loadingSelectionDetail,
    previewSelection,
    previewLoading,
    linkmeCartTotals,
    addLinkMeProduct,
    updateLinkMeQuantity,
    removeLinkMeItem,
    resetLinkMeCart,
    handleLinkMeSubmit,
  };
}
