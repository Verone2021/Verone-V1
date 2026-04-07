/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import type { ProductFormData, Supplier } from './types';

const REQUIRED_FIELDS: Array<keyof ProductFormData> = [
  'name',
  'subcategory_id',
  'supplier_id',
  'base_cost',
  'selling_price',
  'sku',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useProductEditMode(product: any) {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<ProductFormData>({
    name: product.name ?? '',
    slug: product.slug ?? '',
    subcategory_id: product.subcategory_id ?? '',
    supplier_id: product.supplier_id ?? '',
    base_cost: product.base_cost ?? '',
    selling_price: product.selling_price ?? '',
    min_price: product.min_price ?? '',
    margin_percentage: product.margin_percentage ?? '',
    tax_rate: product.tax_rate ?? 20,
    status: product.status ?? 'draft',
    condition: product.condition ?? 'new',
    stock_quantity: product.stock_quantity ?? 0,
    min_stock: product.min_stock ?? 0,
    sku: product.sku ?? '',
    brand: product.brand ?? '',
    gtin: product.gtin ?? '',
    dimensions_length: product.dimensions_length ?? '',
    dimensions_width: product.dimensions_width ?? '',
    dimensions_height: product.dimensions_height ?? '',
    dimensions_unit: product.dimensions_unit ?? 'cm',
    weight: product.weight ?? '',
    weight_unit: product.weight_unit ?? 'kg',
    supplier_reference: product.supplier_reference ?? '',
    supplier_page_url: product.supplier_page_url ?? '',
  });

  const [showCategorizeModal, setShowCategorizeModal] = useState(false);
  const [showCharacteristicsModal, setShowCharacteristicsModal] =
    useState(false);
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from('organisations')
        .select('id, name')
        .eq('type', 'supplier')
        .order('name');
      if (data) setSuppliers(data as unknown as Supplier[]);
    };
    void fetchSuppliers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = (
    field: string,
    value: unknown,
    onUpdate: (u: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate({ [field]: value });
  };

  const completionPercentage = Math.round(
    (REQUIRED_FIELDS.filter(field => {
      const value = formData[field];
      return value !== null && value !== undefined && value !== '';
    }).length /
      REQUIRED_FIELDS.length) *
      100
  );

  const missingFields = REQUIRED_FIELDS.filter(field => {
    const value = formData[field];
    return value === null || value === undefined || value === '';
  });

  return {
    suppliers,
    formData,
    showCategorizeModal,
    setShowCategorizeModal,
    showCharacteristicsModal,
    setShowCharacteristicsModal,
    showDescriptionsModal,
    setShowDescriptionsModal,
    showImagesModal,
    setShowImagesModal,
    handleFieldChange,
    completionPercentage,
    missingFields,
  };
}
