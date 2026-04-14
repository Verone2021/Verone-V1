'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import { useToast } from '@verone/common/hooks';
import { useProducts } from '../../../hooks/use-products';

import { WizardFormData, DEFAULT_FORM_DATA, WIZARD_SECTIONS } from './types';

interface UseCompleteProductWizardOptions {
  editMode?: boolean;
  draftId?: string;
  onSuccess?: (productId: string) => void;
}

export function useCompleteProductWizard({
  editMode = false,
  draftId,
  onSuccess,
}: UseCompleteProductWizardOptions) {
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProducts();

  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>(DEFAULT_FORM_DATA);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftIdState, setDraftIdState] = useState<string | null>(
    draftId ?? null
  );

  const getDraftForEdit = async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('products')
      .select(
        'id, name, slug, description, selling_points, condition, availability_type, video_url, subcategory_id, supplier_id, supplier_page_url, supplier_reference, cost_price, target_margin_percentage, margin_percentage, brand, variant_attributes, dimensions, weight, gtin, product_type, assigned_client_id, creation_mode, requires_sample, stock_quantity, stock_real, stock_forecasted_in, stock_forecasted_out, min_stock, reorder_point'
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  };

  useEffect(() => {
    if (editMode && draftId) {
      void loadDraftForEdit(draftId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, draftId]);

  const loadDraftForEdit = async (id: string) => {
    try {
      setIsLoading(true);
      const draft = await getDraftForEdit(id);

      if (draft) {
        setFormData({
          name: draft.name ?? '',
          slug: draft.slug ?? '',
          description: draft.description ?? '',
          selling_points: (Array.isArray(draft.selling_points)
            ? draft.selling_points
            : []) as string[],
          condition: draft.condition ?? 'new',
          availability_type: draft.availability_type ?? 'normal',
          video_url: draft.video_url ?? '',
          family_id: '',
          category_id: '',
          subcategory_id: draft.subcategory_id ?? '',
          supplier_id: draft.supplier_id ?? '',
          supplier_page_url: draft.supplier_page_url ?? '',
          supplier_reference: draft.supplier_reference ?? '',
          cost_price: draft.cost_price?.toString() ?? '',
          target_margin_percentage:
            draft.target_margin_percentage?.toString() ?? '',
          margin_percentage: draft.margin_percentage?.toString() ?? '',
          brand: draft.brand ?? '',
          variant_attributes: (draft.variant_attributes ?? {}) as Record<
            string,
            unknown
          >,
          dimensions: (draft.dimensions ?? {}) as Record<string, unknown>,
          weight: draft.weight?.toString() ?? '',
          gtin: draft.gtin ?? '',
          product_type: (draft.product_type ?? 'standard') as
            | 'custom'
            | 'standard',
          assigned_client_id: draft.assigned_client_id ?? '',
          creation_mode: (draft.creation_mode ?? 'complete') as
            | 'sourcing'
            | 'complete',
          requires_sample: draft.requires_sample ?? false,
          stock_quantity: draft.stock_quantity?.toString() ?? '',
          stock_real: draft.stock_real?.toString() ?? '',
          stock_forecasted_in: draft.stock_forecasted_in?.toString() ?? '',
          stock_forecasted_out: draft.stock_forecasted_out?.toString() ?? '',
          min_stock: draft.min_stock?.toString() ?? '',
          reorder_point: draft.reorder_point?.toString() ?? '',
        });
      }
    } catch (error) {
      console.error('Erreur chargement brouillon:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le brouillon',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    const allFields = Object.entries(formData);
    const filledFields = allFields.filter(([, value]) => {
      if (typeof value === 'string') return value.trim() !== '';
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null)
        return Object.keys(value).length > 0;
      return value !== null && value !== undefined;
    });

    const imageProgress = selectedImages.length > 0 ? 1 : 0;
    const totalProgress = filledFields.length + imageProgress;
    const totalFields = allFields.length + 1;

    return Math.round((totalProgress / totalFields) * 100);
  };

  const saveDraft = async (showToast = true) => {
    try {
      setIsSaving(true);

      const productData = {
        name: formData.name || 'Produit sans nom',
        slug:
          formData.slug ||
          formData.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-') ||
          `product-${Date.now()}`,
        description: formData.description,
        selling_points:
          formData.selling_points.length > 0
            ? formData.selling_points
            : undefined,
        condition: formData.condition || 'new',
        availability_type: formData.availability_type || 'normal',
        video_url: formData.video_url ?? undefined,
        subcategory_id: formData.subcategory_id ?? undefined,
        supplier_id: formData.supplier_id ?? undefined,
        supplier_page_url: formData.supplier_page_url ?? undefined,
        supplier_reference: formData.supplier_reference ?? undefined,
        cost_price: formData.cost_price
          ? parseFloat(formData.cost_price)
          : undefined,
        target_margin_percentage: formData.target_margin_percentage
          ? parseFloat(formData.target_margin_percentage)
          : undefined,
        margin_percentage: formData.margin_percentage
          ? parseFloat(formData.margin_percentage)
          : undefined,
        brand: formData.brand ?? undefined,
        variant_attributes:
          Object.keys(formData.variant_attributes).length > 0
            ? formData.variant_attributes
            : undefined,
        dimensions:
          Object.keys(formData.dimensions).length > 0
            ? formData.dimensions
            : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        gtin: formData.gtin ?? undefined,
        product_type: formData.product_type || 'standard',
        assigned_client_id: formData.assigned_client_id ?? undefined,
        creation_mode: 'complete' as const,
        requires_sample: formData.requires_sample ?? false,
        stock_quantity: formData.stock_quantity
          ? parseInt(formData.stock_quantity)
          : undefined,
        stock_real: formData.stock_real
          ? parseInt(formData.stock_real)
          : undefined,
        stock_forecasted_in: formData.stock_forecasted_in
          ? parseInt(formData.stock_forecasted_in)
          : undefined,
        stock_forecasted_out: formData.stock_forecasted_out
          ? parseInt(formData.stock_forecasted_out)
          : undefined,
        min_stock: formData.min_stock
          ? parseInt(formData.min_stock)
          : undefined,
        reorder_point: formData.reorder_point
          ? parseInt(formData.reorder_point)
          : undefined,
        completion_status: 'draft' as const,
        status: 'coming_soon' as const,
      };

      let result;
      if (draftIdState) {
        result = await updateProduct(draftIdState, productData);
      } else {
        result = await createProduct(productData);
        if (result?.id) {
          setDraftIdState(result.id);
        }
      }

      if (showToast) {
        toast({
          title: 'Brouillon sauvegardé',
          description: 'Vos modifications ont été enregistrées',
        });
      }

      return result;
    } catch (error) {
      console.error('Erreur sauvegarde brouillon:', error);
      if (showToast) {
        toast({
          title: 'Erreur de sauvegarde',
          description:
            error instanceof Error
              ? error.message
              : 'Impossible de sauvegarder le brouillon',
          variant: 'destructive',
        });
      }
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const finalizeDraft = async () => {
    try {
      setIsLoading(true);
      await saveDraft(false);

      if (!draftIdState) {
        throw new Error('Aucun produit à finaliser');
      }

      const finalizedProduct = await updateProduct(draftIdState, {
        completion_status: 'active' as const,
        status: 'in_stock' as const,
        completion_percentage: 100,
      });

      if (!finalizedProduct) {
        throw new Error('Impossible de finaliser le produit');
      }

      toast({
        title: 'Produit créé',
        description: 'Le produit a été ajouté au catalogue',
      });

      if (onSuccess) {
        onSuccess(finalizedProduct.id);
      }
    } catch (error) {
      console.error('Erreur finalisation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de finaliser le produit',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextSection = () => {
    if (currentSection < WIZARD_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
      void saveDraft(false).catch(() => undefined);
    }
  };

  const prevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const progress = calculateProgress();

  return {
    currentSection,
    setCurrentSection,
    formData,
    setFormData,
    selectedImages,
    setSelectedImages,
    isLoading,
    isSaving,
    draftIdState,
    progress,
    saveDraft,
    finalizeDraft,
    nextSection,
    prevSection,
  };
}
