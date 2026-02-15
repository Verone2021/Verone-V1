'use client';

/**
 * Page Creation Produit - LinkMe
 *
 * Formulaire pour creer un nouveau produit affilie
 *
 * @module NouveauProduitPage
 * @since 2025-12-20
 */

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import {
  Package,
  Loader2,
  ArrowLeft,
  Save,
  Send,
  Euro,
  Ruler,
  ImagePlus,
  Warehouse,
  Truck,
} from 'lucide-react';

import { useAuth, type LinkMeRole } from '../../../../contexts/AuthContext';
import {
  useCreateAffiliateProduct,
  useSubmitForApproval,
  type CreateAffiliateProductInput,
} from '../../../../lib/hooks/use-affiliate-products';

// Roles qui peuvent creer des produits
const CAN_CREATE_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

interface FormData {
  name: string;
  description: string;
  affiliate_payout_ht: string;
  store_at_verone: boolean;
  stock_units: string;
  length_cm: string;
  width_cm: string;
  height_cm: string;
}

export default function NouveauProduitPage() {
  const router = useRouter();
  const { user, linkMeRole, initializing: authLoading } = useAuth();
  const createProduct = useCreateAffiliateProduct();
  const submitForApproval = useSubmitForApproval();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    affiliate_payout_ht: '',
    store_at_verone: false,
    stock_units: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreate = linkMeRole && CAN_CREATE_ROLES.includes(linkMeRole.role);

  // Redirect if not authenticated or not authorized
  if (!authLoading && (!user || !canCreate)) {
    void router.push('/catalogue');
    return null;
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement...</p>
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

    // Dimensions et stock obligatoires si stockage chez Vérone
    if (formData.store_at_verone) {
      const length = parseFloat(formData.length_cm);
      const width = parseFloat(formData.width_cm);
      const height = parseFloat(formData.height_cm);
      const stockUnits = parseInt(formData.stock_units, 10);

      if (isNaN(length) || length <= 0) {
        newErrors.length_cm = 'Obligatoire pour le stockage';
      }
      if (isNaN(width) || width <= 0) {
        newErrors.width_cm = 'Obligatoire pour le stockage';
      }
      if (isNaN(height) || height <= 0) {
        newErrors.height_cm = 'Obligatoire pour le stockage';
      }
      if (isNaN(stockUnits) || stockUnits <= 0) {
        newErrors.stock_units = "Indiquez le nombre d'unites a stocker";
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
    // Clear error when user types
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const buildProductInput = (): CreateAffiliateProductInput => {
    const dimensions =
      formData.length_cm || formData.width_cm || formData.height_cm
        ? {
            length_cm: parseFloat(formData.length_cm) || undefined,
            width_cm: parseFloat(formData.width_cm) || undefined,
            height_cm: parseFloat(formData.height_cm) || undefined,
          }
        : undefined;

    const stockQuantity = formData.store_at_verone
      ? parseInt(formData.stock_units, 10) || undefined
      : undefined;

    return {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      affiliate_payout_ht: parseFloat(formData.affiliate_payout_ht),
      store_at_verone: formData.store_at_verone,
      stock_quantity: stockQuantity,
      dimensions,
    };
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const product = await createProduct.mutateAsync(buildProductInput());
      router.push(`/mes-produits/${product.id}`);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const product = await createProduct.mutateAsync(buildProductInput());
      await submitForApproval.mutateAsync(product.id);
      router.push('/mes-produits');
    } catch (error) {
      console.error('Error submitting for approval:', error);
      // Extraire le message d'erreur Supabase si disponible
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erreur lors de la soumission pour approbation';
      alert(`Erreur: ${errorMessage}`);
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Nouveau Produit
            </h1>
            <p className="text-gray-500">Creez votre produit a vendre</p>
          </div>
        </div>

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
                    placeholder="Ex: Table basse en chene"
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
                    placeholder="Decrivez votre produit..."
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre prix (payout HT) *
                </label>
                <div className="relative max-w-xs">
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
                    placeholder="100.00"
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
                  Ce que vous recevrez par vente (hors commission plateforme)
                </p>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong>Note :</strong> La commission plateforme sera definie
                  par notre equipe lors de la validation de votre produit.
                </p>
              </div>
            </div>

            {/* Stockage & Expedition */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-purple-600" />
                Stockage & Expedition
              </h2>

              {/* Toggle stockage */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({ ...prev, store_at_verone: true }))
                  }
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    formData.store_at_verone
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Warehouse
                      className={`h-6 w-6 ${formData.store_at_verone ? 'text-purple-600' : 'text-gray-400'}`}
                    />
                    <span className="font-medium">Stocker chez Verone</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Nous stockons et expedions vos produits pour vous
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormData(prev => ({ ...prev, store_at_verone: false }))
                  }
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    !formData.store_at_verone
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Truck
                      className={`h-6 w-6 ${!formData.store_at_verone ? 'text-blue-600' : 'text-gray-400'}`}
                    />
                    <span className="font-medium">Gerer moi-meme</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Je stocke et expedie mes produits moi-meme
                  </p>
                </button>
              </div>

              {/* Dimensions */}
              <div
                className={
                  formData.store_at_verone
                    ? ''
                    : 'opacity-50 pointer-events-none'
                }
              >
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Dimensions{' '}
                    {formData.store_at_verone ? (
                      <span className="text-red-500">*</span>
                    ) : (
                      '(optionnel)'
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        errors.length_cm ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.length_cm && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.length_cm}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">
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
                        errors.height_cm ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.height_cm && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.height_cm}
                      </p>
                    )}
                  </div>
                </div>

                {formData.store_at_verone && (
                  <p className="text-xs text-gray-500 mt-2">
                    Necessaire pour calculer les frais de stockage
                  </p>
                )}

                {/* Nombre d'unites a stocker */}
                {formData.store_at_verone && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Nombre d&apos;unites a stocker{' '}
                        <span className="text-red-500">*</span>
                      </span>
                    </div>
                    <div className="max-w-xs">
                      <input
                        type="number"
                        name="stock_units"
                        value={formData.stock_units}
                        onChange={handleChange}
                        min="1"
                        step="1"
                        placeholder="Ex: 10"
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                          errors.stock_units
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {errors.stock_units && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.stock_units}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Combien d&apos;unites allez-vous nous envoyer ?
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Images - Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-orange-600" />
                Images (max 5)
              </h2>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                <ImagePlus className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">
                  Sauvegardez d&apos;abord en brouillon
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Vous pourrez ajouter des images apres la sauvegarde initiale
                </p>
                <p className="text-xs text-gray-400 mt-3">
                  JPG, PNG ou WebP - Max 5MB par image
                </p>
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">Resume</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Votre payout</span>
                  <span className="font-semibold text-green-600">
                    {payout.toFixed(2)} EUR
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">Stockage</span>
                  <span
                    className={`font-medium ${formData.store_at_verone ? 'text-purple-600' : 'text-blue-600'}`}
                  >
                    {formData.store_at_verone ? 'Chez Verone' : 'Gere par vous'}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 text-center">
                    Le prix client final sera calcule apres validation par notre
                    equipe
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    void handleSaveDraft().catch(error => {
                      console.error(
                        '[NouveauProduitPage] Save draft failed:',
                        error
                      );
                      alert('Erreur lors de la sauvegarde');
                    });
                  }}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  Sauvegarder brouillon
                </button>

                <button
                  onClick={() => {
                    void handleSubmitForApproval().catch(error => {
                      console.error(
                        '[NouveauProduitPage] Submit failed:',
                        error
                      );
                      const errorMessage =
                        error instanceof Error
                          ? error.message
                          : 'Erreur lors de la soumission pour approbation';
                      alert(`Erreur: ${errorMessage}`);
                    });
                  }}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  Soumettre pour approbation
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Votre produit sera verifie avant d&apos;etre visible
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
