'use client';

import { useState, useCallback, useEffect } from 'react';

import { useToast } from '@verone/common/hooks';
import { createClient } from '@verone/utils/supabase/client';

import type {
  ConsultationItem,
  CreateConsultationItemData,
  UpdateConsultationItemData,
} from './consultations-types';

const supabase = createClient();

export function useConsultationItems(consultationId?: string) {
  const [consultationItems, setConsultationItems] = useState<
    ConsultationItem[]
  >([]);
  const [eligibleProducts, setEligibleProducts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConsultationItems = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('consultation_products')
        .select(
          `
          id,
          consultation_id,
          product_id,
          quantity,
          proposed_price,
          is_free,
          is_sample,
          notes,
          created_at,
          created_by,
          status,
          shipping_cost,
          shipping_cost_currency,
          selling_shipping_cost,
          cost_price_override,
          product:products(
            id,
            name,
            sku,
            requires_sample,
            cost_price,
            stock_real,
            stock_forecasted_in,
            stock_forecasted_out,
            supplier:organisations!products_supplier_id_fkey(id, legal_name, trade_name),
            product_images(public_url, is_primary)
          )
        `
        )
        .eq('consultation_id', id)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      const items = (data ?? []).map(item => {
        const productData = item.product as unknown as {
          id: string;
          name: string;
          sku: string;
          requires_sample: boolean;
          cost_price?: number;
          stock_real?: number;
          stock_forecasted_in?: number;
          stock_forecasted_out?: number;
          supplier?: {
            id: string;
            legal_name: string;
            trade_name: string | null;
          } | null;
          product_images?: Array<{ is_primary: boolean; public_url: string }>;
        } | null;

        return {
          id: item.id,
          consultation_id: item.consultation_id,
          product_id: item.product_id,
          quantity: item.quantity ?? 1,
          unit_price: item.proposed_price ?? productData?.cost_price,
          is_free: item.is_free ?? false,
          is_sample: item.is_sample ?? false,
          notes: item.notes ?? undefined,
          created_at: item.created_at,
          created_by: item.created_by,
          status: item.status ?? 'pending',
          shipping_cost: item.shipping_cost ?? 0,
          shipping_cost_currency: item.shipping_cost_currency ?? 'EUR',
          selling_shipping_cost: item.selling_shipping_cost ?? 0,
          cost_price_override: item.cost_price_override ?? undefined,
          product: productData
            ? {
                id: productData.id,
                name: productData.name,
                sku: productData.sku,
                requires_sample: productData.requires_sample,
                supplier_id: productData.supplier?.id ?? undefined,
                supplier_name:
                  productData.supplier?.trade_name ??
                  productData.supplier?.legal_name ??
                  undefined,
                cost_price: productData.cost_price,
                stock_real: productData.stock_real ?? 0,
                stock_forecasted_in: productData.stock_forecasted_in ?? 0,
                stock_forecasted_out: productData.stock_forecasted_out ?? 0,
                image_url:
                  productData.product_images?.find(img => img.is_primary)
                    ?.public_url ??
                  productData.product_images?.[0]?.public_url ??
                  null,
              }
            : undefined,
        };
      });

      setConsultationItems(items as ConsultationItem[]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du chargement des items';
      setError(message);
      console.error('Erreur fetchConsultationItems:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEligibleProducts = useCallback(
    async (targetConsultationId?: string) => {
      try {
        setError(null);

        const { data, error: rpcError } = await supabase.rpc(
          'get_consultation_eligible_products',
          { target_consultation_id: targetConsultationId ?? undefined }
        );

        if (rpcError) throw rpcError;

        setEligibleProducts(data ?? []);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Erreur lors du chargement des produits éligibles';
        setError(message);
        console.error('Erreur fetchEligibleProducts:', err);
      }
    },
    []
  );

  const addItem = async (
    data: CreateConsultationItemData
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/consultations/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultation_id: data.consultation_id,
          product_id: data.product_id,
          proposed_price: data.unit_price,
          quantity: data.quantity,
          is_free: data.is_free,
          notes: data.notes,
          is_primary_proposal: false,
        }),
      });

      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          result != null &&
          typeof result === 'object' &&
          'error' in result &&
          typeof (result as { error: unknown }).error === 'string'
            ? (result as { error: string }).error
            : "Erreur lors de l'ajout de l'item";
        throw new Error(errorMessage);
      }

      if (consultationId) {
        await fetchConsultationItems(consultationId);
      }

      toast({
        title: 'Item ajouté',
        description: 'Le produit a été ajouté à la consultation',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'ajout de l'item";
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const updateItem = async (
    itemId: string,
    updates: UpdateConsultationItemData
  ): Promise<boolean> => {
    try {
      setError(null);

      const updateData: Record<string, unknown> = {};
      if (updates.quantity !== undefined)
        updateData.quantity = updates.quantity;
      if (updates.unit_price !== undefined)
        updateData.proposed_price = updates.unit_price;
      if (updates.is_free !== undefined) updateData.is_free = updates.is_free;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.shipping_cost !== undefined)
        updateData.shipping_cost = updates.shipping_cost;
      if (updates.shipping_cost_currency !== undefined)
        updateData.shipping_cost_currency = updates.shipping_cost_currency;
      if (updates.selling_shipping_cost !== undefined)
        updateData.selling_shipping_cost = updates.selling_shipping_cost;
      if (updates.cost_price_override !== undefined)
        updateData.cost_price_override = updates.cost_price_override;
      if (updates.is_sample !== undefined)
        updateData.is_sample = updates.is_sample;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { error: updateError } = await supabase
        .from('consultation_products')
        .update(updateData)
        .eq('id', itemId);

      if (updateError) throw updateError;

      setConsultationItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? {
                ...item,
                quantity: updates.quantity ?? item.quantity,
                unit_price: updates.unit_price ?? item.unit_price,
                is_free: updates.is_free ?? item.is_free,
                is_sample: updates.is_sample ?? item.is_sample,
                notes: updates.notes ?? item.notes,
                shipping_cost: updates.shipping_cost ?? item.shipping_cost,
                shipping_cost_currency:
                  updates.shipping_cost_currency ?? item.shipping_cost_currency,
                selling_shipping_cost:
                  updates.selling_shipping_cost ?? item.selling_shipping_cost,
                cost_price_override:
                  updates.cost_price_override ?? item.cost_price_override,
                status: updates.status ?? item.status,
              }
            : item
        )
      );

      toast({
        title: 'Item mis à jour',
        description: 'Les modifications ont été enregistrées',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('consultation_products')
        .delete()
        .eq('id', itemId);

      if (deleteError) throw deleteError;

      setConsultationItems(prev => prev.filter(item => item.id !== itemId));

      toast({
        title: 'Item supprimé',
        description: 'Le produit a été retiré de la consultation',
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(message);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
      return false;
    }
  };

  const toggleFreeItem = async (itemId: string): Promise<boolean> => {
    const item = consultationItems.find(i => i.id === itemId);
    if (!item) return false;
    return updateItem(itemId, { is_free: !item.is_free });
  };

  const calculateTotal = () => {
    return consultationItems.reduce((total, item) => {
      if (item.is_free) return total;
      const price = item.unit_price ?? 0;
      return total + price * item.quantity;
    }, 0);
  };

  const getTotalItemsCount = () => {
    return consultationItems.reduce((total, item) => total + item.quantity, 0);
  };

  useEffect(() => {
    if (consultationId) {
      void fetchConsultationItems(consultationId);
      void fetchEligibleProducts(consultationId);
    }
  }, [consultationId, fetchConsultationItems, fetchEligibleProducts]);

  return {
    consultationItems,
    eligibleProducts,
    loading,
    error,
    fetchConsultationItems,
    fetchEligibleProducts,
    addItem,
    updateItem,
    removeItem,
    toggleFreeItem,
    calculateTotal,
    getTotalItemsCount,
    // Alias pour rétrocompatibilité
    consultationProducts: consultationItems,
    assignProduct: addItem,
    removeProduct: removeItem,
  };
}
