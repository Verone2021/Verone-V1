'use client';

/**
 * Page Edition Produit - LinkMe
 *
 * Permet de modifier un produit en statut draft ou de corriger un produit rejete
 *
 * @module EditProduitPage
 * @since 2025-12-20
 */

import { useState, useEffect } from 'react';

import { useRouter, useParams } from 'next/navigation';

import {
  Package,
  Loader2,
  ArrowLeft,
  Save,
  Send,
  Euro,
  Ruler,
  AlertCircle,
  RefreshCw,
  Warehouse,
  Truck,
  ImagePlus,
} from 'lucide-react';

import { ProductImageUpload } from '../../../components/forms/ProductImageUpload';
import { useAuth, type LinkMeRole } from '../../../contexts/AuthContext';
import {
  useAffiliateProduct,
  useUpdateAffiliateProduct,
  useSubmitForApproval,
  useRevertToDraft,
  type CreateAffiliateProductInput,
} from '../../../lib/hooks/use-affiliate-products';

// Seuls les enseigne_admin peuvent editer
const CAN_EDIT_ROLES: LinkMeRole[] = ['enseigne_admin'];

interface FormData {
  name: string;
  description: string;
  affiliate_payout_ht: string;
  store_at_verone: boolean;
  length_cm: string;
  width_cm: string;
  height_cm: string;
}

export default function EditProduitPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: product, isLoading: productLoading } =
    useAffiliateProduct(productId);

  const updateProduct = useUpdateAffiliateProduct();
  const submitForApproval = useSubmitForApproval();
  const revertToDraft = useRevertToDraft();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    affiliate_payout_ht: '',
    store_at_verone: false,
    length_cm: '',
    width_cm: '',
    height_cm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when product loads
  useEffect(() => {
    if (product) {
      // Determine store_at_verone from dimensions presence
      const hasAllDimensions =
        product.dimensions?.length_cm &&
        product.dimensions?.width_cm &&
        product.dimensions?.height_cm;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        affiliate_payout_ht: product.affiliate_payout_ht?.toString() || '',
        store_at_verone: !!hasAllDimensions,
        length_cm: product.dimensions?.length_cm?.toString() || '',
        width_cm: product.dimensions?.width_cm?.toString() || '',
        height_cm: product.dimensions?.height_cm?.toString() || '',
      });
    }
  }, [product]);

  const canEdit = linkMeRole && CAN_EDIT_ROLES.includes(linkMeRole.role);
  const isDraft = product?.affiliate_approval_status === 'draft';
  const isRejected = product?.affiliate_approval_status === 'rejected';
  const canModify = isDraft || isRejected;

  // Redirect if not authenticated or not authorized
  if (!authLoading && !productLoading && (!user || !canEdit || !canModify)) {
    router.push('/mes-produits');
    return null;
  }

  // Loading state
  if (authLoading || productLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Produit non trouve</h2>
          <button
            onClick={() => router.push('/mes-produits')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Retour a mes produits
          </button>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est obligatoire';
    }

    const payout = parseFloat(formData.affiliate_payout_ht);
    if (isNaN(payout) || payout <= 0) {
      newErrors.affiliate_payout_ht = 'Le prix doit etre superieur a 0';
    }

    // Dimensions obligatoires si stockage chez Vérone
    if (formData.store_at_verone) {
      const length = parseFloat(formData.length_cm);
      const width = parseFloat(formData.width_cm);
      const height = parseFloat(formData.height_cm);

      if (isNaN(length) || length <= 0) {
        newErrors.length_cm = 'Obligatoire pour le stockage';
      }
      if (isNaN(width) || width <= 0) {
        newErrors.width_cm = 'Obligatoire pour le stockage';
      }
      if (isNaN(height) || height <= 0) {
        newErrors.height_cm = 'Obligatoire pour le stockage';
      }
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
      // Refresh page to get updated status
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
      // If rejected, first revert to draft
      if (isRejected) {
        await revertToDraft.mutateAsync(productId);
      }

      // Update product
      await updateProduct.mutateAsync({
        productId,
        updates: buildProductInput(),
      });

      // Submit for approval
      await submitForApproval.mutateAsync(productId);
      router.push('/mes-produits');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate preview price (commission fixée par le back-office)
  const payout = parseFloat(formData.affiliate_payout_ht) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Modifier le produit
            </h1>
            <p className="text-gray-500">{product.sku}</p>
          </div>
          {isDraft && (
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
              Brouillon
            </span>
          )}
          {isRejected && (
            <span className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-full">
              Rejete
            </span>
          )}
        </div>

        {/* Rejection Reason Alert */}
        {isRejected && product.affiliate_rejection_reason && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">Motif du rejet</h3>
                <p className="text-red-700 mt-1">
                  {product.affiliate_rejection_reason}
                </p>
                <button
                  onClick={handleRevertAndEdit}
                  disabled={isSubmitting}
                  className="mt-3 inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Corriger et resoumettre
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Informations
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" />
                Tarification
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Votre prix (payout HT) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="affiliate_payout_ht"
                      value={formData.affiliate_payout_ht}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.affiliate_payout_ht
                          ? 'border-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                      EUR
                    </span>
                  </div>
                  {errors.affiliate_payout_ht && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.affiliate_payout_ht}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Montant que vous recevrez pour chaque vente
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    La commission plateforme sera definie par Verone lors de
                    l&apos;approbation du produit.
                  </p>
                </div>
              </div>
            </div>

            {/* Stockage & Expedition */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-purple-600" />
                Stockage & Expedition
              </h2>

              {/* Toggle stockage */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Comment souhaitez-vous gerer le stockage ?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({ ...prev, store_at_verone: true }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.store_at_verone
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Warehouse
                      className={`h-6 w-6 mx-auto mb-2 ${formData.store_at_verone ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <p
                      className={`font-medium ${formData.store_at_verone ? 'text-blue-700' : 'text-gray-700'}`}
                    >
                      Stocker chez Verone
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Nous gerons le stock et les envois
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData(prev => ({ ...prev, store_at_verone: false }))
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !formData.store_at_verone
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck
                      className={`h-6 w-6 mx-auto mb-2 ${!formData.store_at_verone ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <p
                      className={`font-medium ${!formData.store_at_verone ? 'text-blue-700' : 'text-gray-700'}`}
                    >
                      Gerer moi-meme
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Vous envoyez directement au client
                    </p>
                  </button>
                </div>
              </div>

              {/* Dimensions - obligatoires si stockage Verone */}
              {formData.store_at_verone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dimensions du produit (obligatoires pour le stockage) *
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Longueur (cm)
                      </label>
                      <input
                        type="number"
                        name="length_cm"
                        value={formData.length_cm}
                        onChange={handleChange}
                        step="0.1"
                        min="0"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.length_cm
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {errors.length_cm && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.length_cm}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Largeur (cm)
                      </label>
                      <input
                        type="number"
                        name="width_cm"
                        value={formData.width_cm}
                        onChange={handleChange}
                        step="0.1"
                        min="0"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.width_cm ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.width_cm && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.width_cm}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Hauteur (cm)
                      </label>
                      <input
                        type="number"
                        name="height_cm"
                        value={formData.height_cm}
                        onChange={handleChange}
                        step="0.1"
                        min="0"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.height_cm
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {errors.height_cm && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.height_cm}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Images */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-orange-600" />
                Images (max 5)
              </h2>

              <ProductImageUpload
                productId={productId}
                maxImages={5}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Apercu prix</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Votre payout</span>
                  <span className="font-semibold text-green-600">
                    {payout.toFixed(2)} EUR
                  </span>
                </div>
                <div className="py-2 text-center">
                  <p className="text-sm text-gray-500">
                    Le prix client final sera calcule apres approbation
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {isDraft && (
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    Sauvegarder
                  </button>
                )}

                <button
                  onClick={handleSubmitForApproval}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  {isRejected
                    ? 'Resoumettre pour approbation'
                    : 'Soumettre pour approbation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
