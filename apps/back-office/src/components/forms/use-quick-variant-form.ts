/**
 * useQuickVariantForm — state, effects and handlers for QuickVariantForm
 */

'use client';

import { useState, useEffect } from 'react';

import { useToast } from '@verone/common';
import { createClient } from '@verone/utils/supabase/client';

export interface QuickVariantFormData {
  color: string;
  size: string;
  material: string;
  pattern: string;
  cost_price: number;
  image_url: string;
}

export interface CreatedProduct {
  id: string;
  name: string;
  sku?: string;
  [key: string]: unknown;
}

type ToastFn = ReturnType<typeof useToast>['toast'];

interface UseQuickVariantFormParams {
  isOpen: boolean;
  variantGroupId: string;
  baseProductId: string;
  groupName: string;
  onProductCreated: (product: CreatedProduct) => void;
  onClose: () => void;
}

const INITIAL_FORM_DATA: QuickVariantFormData = {
  color: '',
  size: '',
  material: '',
  pattern: '',
  cost_price: 0,
  image_url: '',
};

function buildProductName(
  groupName: string,
  formData: QuickVariantFormData
): string {
  const attributes = [
    formData.color,
    formData.size,
    formData.material,
    formData.pattern,
  ].filter(Boolean);
  return attributes.length > 0
    ? `${groupName} - ${attributes.join(' ')}`
    : groupName;
}

async function fetchBaseProduct(baseProductId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select(
      'sku, subcategory_id, supplier_id, manufacturer, description, technical_description'
    )
    .eq('id', baseProductId)
    .single();
  if (error ?? !data) throw new Error('Produit de base introuvable');
  return data;
}

async function resolveNextPosition(variantGroupId: string): Promise<number> {
  const supabase = createClient();
  const { data } = await supabase
    .from('products')
    .select('variant_position')
    .eq('variant_group_id', variantGroupId)
    .order('variant_position', { ascending: false })
    .limit(1);
  return (data?.[0]?.variant_position ?? 0) + 1;
}

interface InsertProductParams {
  baseProduct: Awaited<ReturnType<typeof fetchBaseProduct>>;
  formData: QuickVariantFormData;
  groupName: string;
  variantGroupId: string;
  nextPosition: number;
}

async function insertProduct({
  baseProduct,
  formData,
  groupName,
  variantGroupId,
  nextPosition,
}: InsertProductParams): Promise<CreatedProduct> {
  const supabase = createClient();
  const variantSuffix = [
    formData.color,
    formData.size,
    formData.material,
    formData.pattern,
  ]
    .filter(Boolean)
    .map(attr => attr.substring(0, 3).toUpperCase())
    .join('-');

  const productName = buildProductName(groupName, formData);
  const { data, error } = await supabase
    .from('products')
    .insert([
      {
        sku: `${baseProduct.sku}-${variantSuffix}`,
        name: productName,
        price_ht: formData.cost_price * 1.5,
        cost_price: formData.cost_price,
        status: 'in_stock',
        variant_attributes: {
          color: formData.color || null,
          size: formData.size || null,
          material: formData.material || null,
          pattern: formData.pattern || null,
        },
        variant_group_id: variantGroupId,
        variant_position: nextPosition,
        is_variant_parent: false,
        stock_quantity: 0,
        subcategory_id: baseProduct.subcategory_id,
        supplier_id: baseProduct.supplier_id,
        manufacturer: baseProduct.manufacturer,
        description: baseProduct.description,
        technical_description: baseProduct.technical_description,
      },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as CreatedProduct;
}

async function attachProductImage(
  productId: string,
  imageUrl: string
): Promise<void> {
  const supabase = createClient();
  await supabase.from('product_images').insert([
    {
      product_id: productId,
      storage_path: imageUrl,
      is_primary: true,
      display_order: 1,
    } as never,
  ]);
}

interface SubmitVariantParams {
  formData: QuickVariantFormData;
  groupName: string;
  variantGroupId: string;
  baseProductId: string;
  toast: ToastFn;
  onProductCreated: (product: CreatedProduct) => void;
  onClose: () => void;
}

async function submitVariant({
  formData,
  groupName,
  variantGroupId,
  baseProductId,
  toast,
  onProductCreated,
  onClose,
}: SubmitVariantParams): Promise<void> {
  const [baseProduct, nextPosition] = await Promise.all([
    fetchBaseProduct(baseProductId),
    resolveNextPosition(variantGroupId),
  ]);

  const newProduct = await insertProduct({
    baseProduct,
    formData,
    groupName,
    variantGroupId,
    nextPosition,
  });

  if (formData.image_url) {
    await attachProductImage(newProduct.id, formData.image_url);
  }

  const productName = buildProductName(groupName, formData);
  toast({
    title: '✅ Produit variante créé',
    description: `"${productName}" a été créé avec succès`,
  });

  onProductCreated(newProduct);
  onClose();
}

interface UploadImageParams {
  file: File;
  toast: ToastFn;
  onSuccess: (publicUrl: string) => void;
  onFinally: () => void;
}

async function uploadImage({
  file,
  toast,
  onSuccess,
  onFinally,
}: UploadImageParams): Promise<void> {
  try {
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const filePath = `variant-images/variant-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('family-images')
      .upload(filePath, file);
    if (uploadError) throw uploadError;
    const {
      data: { publicUrl },
    } = supabase.storage.from('family-images').getPublicUrl(filePath);
    onSuccess(publicUrl);
    toast({
      title: '✅ Image téléchargée',
      description: "L'image a été uploadée avec succès",
    });
  } catch (error) {
    console.error('Upload error:', error);
    toast({
      title: '❌ Erreur upload',
      description: "Impossible de télécharger l'image",
      variant: 'destructive',
    });
  } finally {
    onFinally();
  }
}

interface ValidationError {
  title: string;
  description: string;
}

function validateFormData(
  formData: QuickVariantFormData
): ValidationError | null {
  const hasVariantAttribute =
    formData.color || formData.size || formData.material || formData.pattern;
  if (!hasVariantAttribute) {
    return {
      title: '❌ Attribut requis',
      description: 'Vous devez renseigner au moins un attribut de variante',
    };
  }
  if (formData.cost_price <= 0) {
    return {
      title: '❌ Prix requis',
      description: "Le prix d'achat doit être supérieur à 0",
    };
  }
  return null;
}

export function useQuickVariantForm({
  isOpen,
  variantGroupId,
  baseProductId,
  groupName,
  onProductCreated,
  onClose,
}: UseQuickVariantFormParams) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] =
    useState<QuickVariantFormData>(INITIAL_FORM_DATA);

  useEffect(() => {
    if (isOpen) setFormData(INITIAL_FORM_DATA);
  }, [isOpen]);

  const generateProductName = () => buildProductName(groupName, formData);

  const handleImageUpload = async (file: File): Promise<void> => {
    setUploadingImage(true);
    await uploadImage({
      file,
      toast,
      onSuccess: publicUrl =>
        setFormData(prev => ({ ...prev, image_url: publicUrl })),
      onFinally: () => setUploadingImage(false),
    });
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const validationError = validateFormData(formData);
    if (validationError) {
      toast({ ...validationError, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await submitVariant({
        formData,
        groupName,
        variantGroupId,
        baseProductId,
        toast,
        onProductCreated,
        onClose,
      });
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    uploadingImage,
    formData,
    setFormData,
    generateProductName,
    handleImageUpload,
    handleRemoveImage,
    handleSubmit,
  };
}
