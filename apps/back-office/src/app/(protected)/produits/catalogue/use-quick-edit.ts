'use client';

import { useState, useCallback } from 'react';

import type { Product } from '@verone/categories';
import type { QuickEditField } from '@verone/products';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

interface UseQuickEditOptions {
  subcategories: { id: string; name: string }[];
  allSuppliers: { id: string; trade_name: string | null; legal_name: string }[];
  onProductUpdated: () => Promise<void>;
}

export function useQuickEdit({
  subcategories,
  allSuppliers,
  onProductUpdated,
}: UseQuickEditOptions) {
  const [quickEditTarget, setQuickEditTarget] = useState<{
    product: Product;
    field: QuickEditField;
  } | null>(null);
  const [quickEditPrice, setQuickEditPrice] = useState('');
  const [quickEditSaving, setQuickEditSaving] = useState(false);
  const [quickEditWeight, setQuickEditWeight] = useState('');
  const [quickEditDimensions, setQuickEditDimensions] = useState({
    length: '',
    width: '',
    height: '',
  });

  const handleQuickEdit = useCallback(
    (product: Product, field: QuickEditField) => {
      setQuickEditTarget({ product, field });
      if (field === 'price') setQuickEditPrice('');
      if (field === 'weight') setQuickEditWeight('');
      if (field === 'dimensions')
        setQuickEditDimensions({ length: '', width: '', height: '' });
    },
    []
  );

  const handleQuickEditSupplier = useCallback(
    async (supplierId: string | null) => {
      if (!quickEditTarget || !supplierId) return;
      setQuickEditSaving(true);
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('products')
          .update({ supplier_id: supplierId })
          .eq('id', quickEditTarget.product.id);
        if (error) throw error;
        await onProductUpdated();
        const supplierName =
          allSuppliers.find(s => s.id === supplierId)?.trade_name ??
          allSuppliers.find(s => s.id === supplierId)?.legal_name ??
          'Fournisseur';
        toast.success('Fournisseur assigné', {
          description: `${supplierName} assigné à ${quickEditTarget.product.name ?? 'ce produit'}.`,
        });
      } catch (err) {
        console.error('[QuickEdit] Supplier save failed:', err);
        toast.error("Impossible d'assigner le fournisseur.");
      } finally {
        setQuickEditSaving(false);
      }
    },
    [quickEditTarget, onProductUpdated, allSuppliers]
  );

  const handleQuickEditPriceSave = useCallback(async () => {
    if (!quickEditTarget) return;
    if ((quickEditTarget.product.cost_price_count ?? 0) > 0) {
      toast.error('Prix verrouillé', {
        description:
          'Ce prix est calculé automatiquement depuis les commandes fournisseur (PMP).',
      });
      return;
    }
    const priceValue = parseFloat(quickEditPrice);
    if (isNaN(priceValue) || priceValue < 0) return;
    setQuickEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ cost_price: priceValue })
        .eq('id', quickEditTarget.product.id);
      if (error) throw error;
      await onProductUpdated();
      toast.success('Prix enregistré', {
        description: `Prix d'achat mis à jour pour ${quickEditTarget.product.name ?? 'ce produit'}.`,
      });
    } catch (err) {
      console.error('[QuickEdit] Price save failed:', err);
      toast.error("Impossible d'enregistrer le prix.");
    } finally {
      setQuickEditSaving(false);
    }
  }, [quickEditTarget, quickEditPrice, onProductUpdated]);

  const handleQuickEditWeightSave = useCallback(async () => {
    if (!quickEditTarget) return;
    const weightValue = parseFloat(quickEditWeight);
    if (isNaN(weightValue) || weightValue <= 0) return;
    setQuickEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ weight: weightValue })
        .eq('id', quickEditTarget.product.id);
      if (error) throw error;
      await onProductUpdated();
      toast.success('Poids enregistré', {
        description: `${weightValue} kg pour ${quickEditTarget.product.name ?? 'ce produit'}.`,
      });
    } catch (err) {
      console.error('[QuickEdit] Weight save failed:', err);
      toast.error("Impossible d'enregistrer le poids.");
    } finally {
      setQuickEditSaving(false);
    }
  }, [quickEditTarget, quickEditWeight, onProductUpdated]);

  const handleQuickEditDimensionsSave = useCallback(async () => {
    if (!quickEditTarget) return;
    const l = parseFloat(quickEditDimensions.length);
    const w = parseFloat(quickEditDimensions.width);
    const h = parseFloat(quickEditDimensions.height);
    if (isNaN(l) || isNaN(w) || isNaN(h) || l <= 0 || w <= 0 || h <= 0) return;
    setQuickEditSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('products')
        .update({ dimensions: { length_cm: l, width_cm: w, height_cm: h } })
        .eq('id', quickEditTarget.product.id);
      if (error) throw error;
      await onProductUpdated();
      const volume = ((l * w * h) / 1_000_000).toFixed(4);
      toast.success('Dimensions enregistrées', {
        description: `${l} × ${w} × ${h} cm (${volume} m³) pour ${quickEditTarget.product.name ?? 'ce produit'}.`,
      });
    } catch (err) {
      console.error('[QuickEdit] Dimensions save failed:', err);
      toast.error("Impossible d'enregistrer les dimensions.");
    } finally {
      setQuickEditSaving(false);
    }
  }, [quickEditTarget, quickEditDimensions, onProductUpdated]);

  const handleQuickEditSubcategory = useCallback(
    async (updatedProduct: Product) => {
      if (!updatedProduct.subcategory_id) return;
      setQuickEditSaving(true);
      try {
        const supabase = createClient();
        const { error: dbError } = await supabase
          .from('products')
          .update({ subcategory_id: updatedProduct.subcategory_id })
          .eq('id', updatedProduct.id);
        if (dbError) throw dbError;
        await onProductUpdated();
        const subcatName =
          subcategories.find(s => s.id === updatedProduct.subcategory_id)
            ?.name ?? 'Sous-catégorie';
        toast.success('Sous-catégorie assignée', {
          description: `${subcatName} assignée à ${updatedProduct.name ?? 'ce produit'}.`,
        });
      } catch (err) {
        console.error('[QuickEdit] Subcategory save failed:', err);
        toast.error("Impossible d'enregistrer la sous-catégorie.");
      } finally {
        setQuickEditSaving(false);
      }
    },
    [onProductUpdated, subcategories]
  );

  return {
    quickEditTarget,
    setQuickEditTarget,
    quickEditPrice,
    setQuickEditPrice,
    quickEditSaving,
    quickEditWeight,
    setQuickEditWeight,
    quickEditDimensions,
    setQuickEditDimensions,
    handleQuickEdit,
    handleQuickEditSupplier,
    handleQuickEditPriceSave,
    handleQuickEditWeightSave,
    handleQuickEditDimensionsSave,
    handleQuickEditSubcategory,
  };
}
