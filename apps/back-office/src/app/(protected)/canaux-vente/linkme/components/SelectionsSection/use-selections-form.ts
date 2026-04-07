'use client';

import { useState, useMemo } from 'react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

import type {
  CatalogProduct,
  SelectedProduct,
  SelectionFormData,
} from './types';

export function useSelectionsForm(
  catalogProducts: CatalogProduct[],
  fetchData: () => Promise<void>
) {
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<SelectionFormData>({
    affiliate_id: '',
    name: '',
    description: '',
  });
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [productSearch, setProductSearch] = useState('');

  const filteredCatalogProducts = useMemo(() => {
    if (!productSearch) return catalogProducts;
    const searchLower = productSearch.toLowerCase();
    return catalogProducts.filter(
      p =>
        p.product_name.toLowerCase().includes(searchLower) ||
        p.product_reference.toLowerCase().includes(searchLower)
    );
  }, [catalogProducts, productSearch]);

  const marginValidationErrors = useMemo(() => {
    const errors: string[] = [];
    for (const product of selectedProducts) {
      if (product.margin_rate < product.min_margin_rate) {
        errors.push(
          `${product.product_name}: marge ${product.margin_rate}% < min ${product.min_margin_rate}%`
        );
      }
      if (product.margin_rate > product.max_margin_rate) {
        errors.push(
          `${product.product_name}: marge ${product.margin_rate}% > max ${product.max_margin_rate}%`
        );
      }
    }
    return errors;
  }, [selectedProducts]);

  const hasValidationErrors = marginValidationErrors.length > 0;

  function resetForm() {
    setFormData({ affiliate_id: '', name: '', description: '' });
    setSelectedProducts([]);
    setProductSearch('');
  }

  function addProductToSelection(product: CatalogProduct) {
    if (selectedProducts.find(p => p.product_id === product.product_id)) {
      return;
    }
    const commissionRate = product.linkme_commission_rate ?? 5;
    setSelectedProducts(prev => [
      ...prev,
      {
        product_id: product.product_id,
        product_name: product.product_name,
        base_price_ht: product.product_price_ht,
        margin_rate: product.suggested_margin_rate,
        min_margin_rate: product.min_margin_rate,
        max_margin_rate: product.max_margin_rate,
        suggested_margin_rate: product.suggested_margin_rate,
        linkme_commission_rate: commissionRate,
      },
    ]);
  }

  function removeProductFromSelection(productId: string) {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  }

  function updateProductMargin(productId: string, marginRate: number) {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.product_id === productId ? { ...p, margin_rate: marginRate } : p
      )
    );
  }

  async function handleCreateSelection() {
    if (
      !formData.affiliate_id ||
      !formData.name.trim() ||
      selectedProducts.length === 0
    ) {
      toast({
        title: 'Erreur',
        description:
          'Veuillez remplir tous les champs et sélectionner au moins un produit',
        variant: 'destructive',
      });
      return;
    }

    const supabase = createClient();
    setSaving(true);

    try {
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const shareToken = crypto.randomUUID().slice(0, 8);

      const { data: selectionData, error: selectionError } = await supabase
        .from('linkme_selections')
        .insert({
          affiliate_id: formData.affiliate_id,
          name: formData.name.trim(),
          slug,
          description: formData.description ?? null,
          share_token: shareToken,
          products_count: selectedProducts.length,
          views_count: 0,
          orders_count: 0,
          archived_at: null,
          published_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (selectionError) throw selectionError;

      // Note: selling_price_ht est une colonne générée automatiquement par la DB
      const selectionItems = selectedProducts.map((product, index) => ({
        selection_id: selectionData.id,
        product_id: product.product_id,
        base_price_ht: product.base_price_ht,
        margin_rate: product.margin_rate,
        display_order: index,
        is_featured: index === 0,
      }));

      const { error: itemsError } = await supabase
        .from('linkme_selection_items')
        .insert(selectionItems);

      if (itemsError) throw itemsError;

      toast({
        title: 'Succès',
        description: `Sélection "${formData.name}" créée avec ${selectedProducts.length} produit(s)`,
      });

      setIsCreateModalOpen(false);
      resetForm();
      void fetchData().catch(error => {
        console.error('[SelectionsSection] Fetch after create failed:', error);
      });
    } catch (error) {
      console.error('Error creating selection:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la sélection',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    saving,
    formData,
    setFormData,
    selectedProducts,
    productSearch,
    setProductSearch,
    filteredCatalogProducts,
    marginValidationErrors,
    hasValidationErrors,
    resetForm,
    addProductToSelection,
    removeProductFromSelection,
    updateProductMargin,
    handleCreateSelection,
  };
}
