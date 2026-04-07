'use client';

import { useState, useEffect } from 'react';

import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

import { useStockUI } from '../../hooks';
import { useStockMovements, type StockReasonCode } from '../../hooks';
import type {
  AdjustmentFormData,
  AdjustmentType,
} from './inventory-adjustment.types';
import {
  INCREASE_REASONS,
  DECREASE_REASONS,
  CORRECTION_REASONS,
} from './inventory-adjustment.types';

const INITIAL_FORM: AdjustmentFormData = {
  adjustmentType: 'increase',
  quantity: '',
  reasonCode: '',
  notes: '',
  uploadedFile: null,
  uploadedFileUrl: '',
};

interface Product {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
}

export function useInventoryAdjustment(
  isOpen: boolean,
  product: Product | null,
  onSuccess: () => void,
  onClose: () => void
) {
  const supabase = createClient();
  const stock = useStockUI({ autoLoad: false });
  const { getReasonDescription } = useStockMovements();

  const [formData, setFormData] = useState<AdjustmentFormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && product) {
      setFormData(INITIAL_FORM);
      setFormError(null);
    }
  }, [isOpen, product]);

  const calculateQuantityChange = (): number => {
    if (!product || !formData.quantity) return 0;
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty)) return 0;
    switch (formData.adjustmentType) {
      case 'increase':
        return Math.abs(qty);
      case 'decrease':
        return -Math.abs(qty);
      case 'correction':
        return qty - product.stock_quantity;
      default:
        return 0;
    }
  };

  const calculateNewStock = (): number => {
    if (!product) return 0;
    return product.stock_quantity + calculateQuantityChange();
  };

  const getReasonOptions = (): { code: StockReasonCode; label: string }[] => {
    switch (formData.adjustmentType) {
      case 'increase':
        return INCREASE_REASONS;
      case 'decrease':
        return DECREASE_REASONS;
      case 'correction':
        return CORRECTION_REASONS;
      default:
        return [];
    }
  };

  const validateForm = (): { valid: boolean; error?: string } => {
    if (!product) return { valid: false, error: 'Aucun produit sélectionné' };
    if (!formData.quantity || formData.quantity === '0')
      return { valid: false, error: 'Veuillez saisir une quantité' };
    const qty = parseFloat(formData.quantity);
    if (isNaN(qty) || qty < 0)
      return { valid: false, error: 'Quantité invalide' };
    if (formData.adjustmentType === 'decrease' && qty > product.stock_quantity)
      return {
        valid: false,
        error: `Stock insuffisant (stock actuel: ${product.stock_quantity})`,
      };
    if (formData.adjustmentType === 'correction' && calculateNewStock() < 0)
      return {
        valid: false,
        error: 'La nouvelle quantité ne peut pas être négative',
      };
    if (!formData.reasonCode)
      return { valid: false, error: 'Veuillez sélectionner un motif' };
    return { valid: true };
  };

  const handleFileUpload = async (file: File) => {
    if (!product) return;
    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${product.sku}_adjustment_${timestamp}.${fileExt}`;
      const filePath = `adjustments/${new Date().getFullYear()}/${String(
        new Date().getMonth() + 1
      ).padStart(2, '0')}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('stock-adjustments')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('stock-adjustments')
        .getPublicUrl(data.path);

      setFormData(prev => ({
        ...prev,
        uploadedFile: file,
        uploadedFileUrl: publicUrlData.publicUrl,
      }));
      toast.success(`${file.name} a été téléchargé avec succès`);
    } catch (err) {
      console.error('Erreur upload fichier:', err);
      toast.error(
        err instanceof Error ? err.message : "Impossible d'uploader le fichier"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!product) return;

    const validation = validateForm();
    if (!validation.valid) {
      setFormError(validation.error ?? 'Erreur de validation');
      return;
    }

    const quantityChange = calculateQuantityChange();
    if (quantityChange === 0) {
      setFormError(
        'Aucun changement de stock détecté. La quantité doit être différente du stock actuel.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const movement = await stock.createMovement({
        product_id: product.id,
        movement_type: 'ADJUST',
        quantity_change: quantityChange,
        reason_code: formData.reasonCode as StockReasonCode,
        notes: `[${getReasonDescription(formData.reasonCode as StockReasonCode)}] ${formData.notes}`,
        reference_type: 'manual_adjustment',
        reference_id: crypto.randomUUID(),
        affects_forecast: false,
      });

      if (movement) {
        onSuccess();
        onClose();
        setFormData(INITIAL_FORM);
      } else {
        setFormError(
          "L'ajustement a échoué. Vérifiez les détails et réessayez."
        );
      }
    } catch (err) {
      console.error('Erreur création ajustement:', err);
      setFormError(
        err instanceof Error
          ? err.message
          : "Erreur inattendue lors de la création de l'ajustement"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentTypeChange = (type: AdjustmentType) => {
    setFormData(prev => ({ ...prev, adjustmentType: type, reasonCode: '' }));
  };

  const clearUploadedFile = () => {
    setFormData(prev => ({ ...prev, uploadedFile: null, uploadedFileUrl: '' }));
  };

  return {
    formData,
    setFormData,
    submitting,
    uploading,
    formError,
    calculateQuantityChange,
    calculateNewStock,
    getReasonOptions,
    handleFileUpload,
    handleSubmit,
    handleAdjustmentTypeChange,
    clearUploadedFile,
  };
}
