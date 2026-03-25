'use client';

import { useState, useEffect, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { format } from 'date-fns';

import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  stock_quantity: number;
  stock_real: number;
}

export interface StockAdjustmentFormData {
  product_id: string;
  adjustment_type: 'increase' | 'decrease' | 'correction';
  quantity: number;
  reason:
    | 'inventory_count'
    | 'damage'
    | 'loss'
    | 'found'
    | 'correction'
    | 'other';
  notes: string;
  adjustment_date: string;
  reference_document?: string;
  uploaded_file_url?: string;
}

export interface StockAdjustmentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// =====================================================================
// UTILITAIRES PURS
// =====================================================================

export function calculateQuantityChange(
  formData: StockAdjustmentFormData,
  selectedProduct: Product | null
): number {
  const qty = Math.abs(formData.quantity);
  switch (formData.adjustment_type) {
    case 'increase':
      return qty;
    case 'decrease':
      return -qty;
    case 'correction':
      if (!selectedProduct) return 0;
      return formData.quantity - selectedProduct.stock_real;
    default:
      return 0;
  }
}

export function validateAdjustmentForm(
  formData: StockAdjustmentFormData,
  selectedProduct: Product | null
): string | null {
  if (!formData.product_id) return 'Veuillez sélectionner un produit';
  if (formData.quantity === 0) return 'La quantité doit être différente de 0';
  if (formData.adjustment_type !== 'correction' && formData.quantity < 0)
    return 'La quantité doit être positive';
  if (
    formData.adjustment_type === 'decrease' &&
    selectedProduct &&
    formData.quantity > selectedProduct.stock_real
  ) {
    return `Stock insuffisant (stock réel: ${selectedProduct.stock_real})`;
  }
  return null;
}

function buildInitialFormData(): StockAdjustmentFormData {
  return {
    product_id: '',
    adjustment_type: 'correction',
    quantity: 0,
    reason: 'inventory_count',
    notes: '',
    adjustment_date: format(new Date(), 'yyyy-MM-dd'),
    reference_document: '',
    uploaded_file_url: '',
  };
}

// =====================================================================
// SOUS-HOOK: chargement produits
// =====================================================================

function useProductsLoader(supabase: ReturnType<typeof createClient>) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('id, sku, name, stock_quantity, stock_real')
          .order('name');
        if (fetchError) throw fetchError;
        setProducts((data as Product[]) ?? []);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
        setLoadError('Impossible de charger la liste des produits');
      } finally {
        setLoadingProducts(false);
      }
    }
    void fetchProducts().catch(err => {
      console.error('[StockAdjustmentForm] fetchProducts failed:', err);
    });
  }, [supabase]);

  return { products, loadingProducts, loadError };
}

// =====================================================================
// HELPERS SUBMIT
// =====================================================================

type SupabaseClient = ReturnType<typeof createClient>;

interface SubmitParams {
  supabase: SupabaseClient;
  formData: StockAdjustmentFormData;
  selectedProduct: Product | null;
  onSuccess?: () => void;
  router: ReturnType<typeof useRouter>;
}

async function submitAdjustment({
  supabase,
  formData,
  selectedProduct,
  onSuccess,
  router,
}: SubmitParams): Promise<void> {
  const quantityChange = calculateQuantityChange(formData, selectedProduct);
  const quantityBefore =
    selectedProduct?.stock_real ?? selectedProduct?.stock_quantity ?? 0;
  const quantityAfter = quantityBefore + quantityChange;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  // ✅ FIX Phase 3.6: Définir explicitement affects_forecast et forecast_type
  const { error: insertError } = await supabase.from('stock_movements').insert({
    product_id: formData.product_id,
    movement_type: 'ADJUST',
    quantity_change: quantityChange,
    quantity_before: quantityBefore,
    quantity_after: quantityAfter,
    affects_forecast: false, // ✅ EXPLICITE: Ajustements manuels = mouvements réels
    forecast_type: null, // ✅ EXPLICITE: Pas de direction prévisionnel pour ajustements
    reference_type: 'manual_adjustment',
    reference_id: crypto.randomUUID(),
    notes: `${formData.reason}: ${formData.notes}`,
    performed_by: user.id,
    performed_at: new Date(formData.adjustment_date).toISOString(),
  });

  if (insertError) throw insertError;

  if (onSuccess) {
    onSuccess();
  } else {
    router.push('/stocks/ajustements');
    router.refresh();
  }
}

// =====================================================================
// HOOK PRINCIPAL
// =====================================================================

export function useStockAdjustmentForm({
  onSuccess,
}: Pick<StockAdjustmentFormProps, 'onSuccess'>) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [formData, setFormData] =
    useState<StockAdjustmentFormData>(buildInitialFormData);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { products, loadingProducts, loadError } = useProductsLoader(supabase);

  const combinedError = error ?? loadError;

  const handleProductChange = (productId: string) => {
    setSelectedProduct(products.find(p => p.id === productId) ?? null);
    setFormData(prev => ({ ...prev, product_id: productId }));
  };

  const handleFileUpload = (url: string, fileName: string) => {
    setFormData(prev => ({
      ...prev,
      uploaded_file_url: url,
      reference_document: fileName,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validationError = validateAdjustmentForm(formData, selectedProduct);
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    try {
      await submitAdjustment({
        supabase,
        formData,
        selectedProduct,
        onSuccess,
        router,
      });
    } catch (err) {
      console.error('Erreur création ajustement:', err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de la création de l'ajustement"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    products,
    selectedProduct,
    loading,
    loadingProducts,
    error: combinedError,
    handleProductChange,
    calculateQuantityChange: () =>
      calculateQuantityChange(formData, selectedProduct),
    handleSubmit,
    handleFileUpload,
  };
}
