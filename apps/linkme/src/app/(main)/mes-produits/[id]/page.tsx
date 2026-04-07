'use client';

import {
  Package,
  Loader2,
  ArrowLeft,
  Euro,
  Ruler,
  AlertCircle,
  RefreshCw,
  ImagePlus,
  Eye,
  Clock,
  CheckCircle,
} from 'lucide-react';

import Link from 'next/link';

import { ProductImageUpload } from '../../../../components/forms/ProductImageUpload';

import { useEditProduit } from './use-edit-produit';
import { ProduitInfoForm } from './ProduitInfoForm';
import { ProduitPricingForm } from './ProduitPricingForm';
import { ProduitPreviewSidebar } from './ProduitPreviewSidebar';
import { ProduitStockageForm } from './ProduitStockageForm';

export default function EditProduitPage() {
  const {
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
    navigateToEdit,
  } = useEditProduit();

  if (!authLoading && !user) return null;

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
          <Link
            href="/mes-produits"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Retour a mes produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/mes-produits"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {viewOnly ? (
                <>
                  <Eye className="h-6 w-6 text-gray-400" />
                  Détail du produit
                </>
              ) : (
                'Modifier le produit'
              )}
            </h1>
            <p className="text-gray-500">{product.sku}</p>
          </div>
          {isDraft && (
            <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
              Brouillon
            </span>
          )}
          {isPending && (
            <span className="px-3 py-1 text-sm bg-amber-50 text-amber-600 rounded-full flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> En attente
            </span>
          )}
          {isApproved && (
            <span className="px-3 py-1 text-sm bg-green-50 text-green-600 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Approuvé
            </span>
          )}
          {isRejected && (
            <span className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-full">
              Rejeté
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
                  onClick={() => {
                    void handleRevertAndEdit().catch(error => {
                      console.error('[EditProduitPage] Revert failed:', error);
                    });
                  }}
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
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" /> Informations
              </h2>
              <ProduitInfoForm
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                viewOnly={viewOnly}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-green-600" /> Tarification
              </h2>
              <ProduitPricingForm
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                viewOnly={viewOnly}
                isApproved={isApproved}
                affiliateCommissionRate={product.affiliate_commission_rate}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ruler className="h-5 w-5 text-purple-600" /> Stockage &
                Expedition
              </h2>
              <ProduitStockageForm
                formData={formData}
                errors={errors}
                handleChange={handleChange}
                setStoreAtVerone={setStoreAtVerone}
                viewOnly={viewOnly}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-orange-600" />
                Images {!viewOnly && '(max 5)'}
              </h2>
              <ProductImageUpload
                productId={productId}
                maxImages={5}
                disabled={isSubmitting || viewOnly}
              />
              {viewOnly && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Mode consultation - les images ne peuvent pas être modifiées
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <ProduitPreviewSidebar
              payout={payout}
              viewOnly={viewOnly}
              canModify={canModify}
              isDraft={isDraft}
              isRejected={isRejected}
              isSubmitting={isSubmitting}
              productId={productId}
              onNavigateEdit={navigateToEdit}
              onSave={handleSave}
              onSubmitForApproval={handleSubmitForApproval}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
