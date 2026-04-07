'use client';

import { useState, useEffect } from 'react';

import { useRouter, useParams, useSearchParams } from 'next/navigation';

import { useAuth } from '../../../../contexts/AuthContext';
import {
  useAffiliateProduct,
  useUpdateAffiliateProduct,
  useSubmitForApproval,
  useRevertToDraft,
  type CreateAffiliateProductInput,
} from '../../../../lib/hooks/use-affiliate-products';

import { CAN_EDIT_ROLES, type FormData } from './mes-produits-id.types';

const INITIAL_FORM: FormData = {
  name: '',
  description: '',
  affiliate_payout_ht: '',
  store_at_verone: false,
  length_cm: '',
  width_cm: '',
  height_cm: '',
};

export function useEditProduit() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;
  const isEditMode = searchParams.get('edit') === 'true';

  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const { data: product, isLoading: productLoading } =
    useAffiliateProduct(productId);

  const updateProduct = useUpdateAffiliateProduct();
  const submitForApproval = useSubmitForApproval();
  const revertToDraft = useRevertToDraft();

  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      const hasAllDimensions =
        product.dimensions?.length_cm &&
        product.dimensions?.width_cm &&
        product.dimensions?.height_cm;

      setFormData({
        name: product.name || '',
        description: product.description ?? '',
        affiliate_payout_ht: product.affiliate_payout_ht?.toString() || '',
        store_at_verone: !!hasAllDimensions,
        length_cm: product.dimensions?.length_cm?.toString() ?? '',
        width_cm: product.dimensions?.width_cm?.toString() ?? '',
        height_cm: product.dimensions?.height_cm?.toString() ?? '',
      });
    }
  }, [product]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  const _canEdit = linkMeRole && CAN_EDIT_ROLES.includes(linkMeRole.role);
  const isDraft = product?.affiliate_approval_status === 'draft';
  const isRejected = product?.affiliate_approval_status === 'rejected';
  const isPending = product?.affiliate_approval_status === 'pending_approval';
  const isApproved = product?.affiliate_approval_status === 'approved';
  const canModify = isDraft || isRejected;
  const viewOnly = !canModify || !isEditMode;
  const payout = parseFloat(formData.affiliate_payout_ht) || 0;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    const payoutVal = parseFloat(formData.affiliate_payout_ht);
    if (isNaN(payoutVal) || payoutVal <= 0) {
      newErrors.affiliate_payout_ht = 'Le prix doit etre superieur a 0';
    }

    if (formData.store_at_verone) {
      const length = parseFloat(formData.length_cm);
      const width = parseFloat(formData.width_cm);
      const height = parseFloat(formData.height_cm);

      if (isNaN(length) || length <= 0)
        newErrors.length_cm = 'Obligatoire pour le stockage';
      if (isNaN(width) || width <= 0)
        newErrors.width_cm = 'Obligatoire pour le stockage';
      if (isNaN(height) || height <= 0)
        newErrors.height_cm = 'Obligatoire pour le stockage';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const setStoreAtVerone = (value: boolean) => {
    setFormData(prev => ({ ...prev, store_at_verone: value }));
  };

  const buildProductInput = (): Partial<CreateAffiliateProductInput> => {
    const dimensions =
      formData.length_cm || formData.width_cm || formData.height_cm
        ? {
            length_cm: parseFloat(formData.length_cm) || undefined,
            width_cm: parseFloat(formData.width_cm) || undefined,
            height_cm: parseFloat(formData.height_cm) || undefined,
          }
        : undefined;

    return {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      affiliate_payout_ht: parseFloat(formData.affiliate_payout_ht),
      store_at_verone: formData.store_at_verone,
      dimensions,
    };
  };

  const handleRevertAndEdit = async () => {
    if (!isRejected) return;
    setIsSubmitting(true);
    try {
      await revertToDraft.mutateAsync(productId);
      router.refresh();
    } catch (error) {
      console.error('Error reverting to draft:', error);
      alert('Erreur lors de la modification du statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await updateProduct.mutateAsync({
        productId,
        updates: buildProductInput(),
      });
      alert('Modifications sauvegardees');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      if (isRejected) {
        await revertToDraft.mutateAsync(productId);
      }
      await updateProduct.mutateAsync({
        productId,
        updates: buildProductInput(),
      });
      await submitForApproval.mutateAsync(productId);
      router.push('/mes-produits');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user,
    authLoading,
    productLoading,
    product,
    productId,
    formData,
    errors,
    isSubmitting,
    isDraft,
    isRejected,
    isPending,
    isApproved,
    canModify,
    viewOnly,
    payout,
    handleChange,
    setStoreAtVerone,
    handleRevertAndEdit,
    handleSave,
    handleSubmitForApproval,
    navigateToEdit: () => {
      router.push(`/mes-produits/${productId}?edit=true`);
    },
  };
}
