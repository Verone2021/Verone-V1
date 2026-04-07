'use client';

import { Button } from '@verone/ui';
import { cn } from '@verone/utils';
import { Package, ArrowRight, Loader2 } from 'lucide-react';

import { useSourcingQuickForm } from './hooks';
import type { SourcingQuickFormProps } from './types';
import { ClientSection } from './components/ClientSection';
import { ImageUploadSection } from './components/ImageUploadSection';
import { ProductFieldsSection } from './components/ProductFieldsSection';
import { SupplierSection } from './components/SupplierSection';

export function SourcingQuickForm({
  onSuccess,
  onCancel,
  className,
  showHeader = true,
}: SourcingQuickFormProps) {
  const {
    supplierMode,
    setSupplierMode,
    newSupplier,
    setNewSupplier,
    formData,
    setFormData,
    selectedImages,
    imagePreviews,
    isSubmitting,
    errors,
    setErrors,
    linkedConsultationId,
    setLinkedConsultationId,
    handleImagesSelect,
    removeImage,
    handleSubmit,
  } = useSourcingQuickForm(onSuccess);

  const clearError = (key: string) => {
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  return (
    <div className={cn('bg-white', className)}>
      {showHeader && (
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">Sourcing Rapide</h1>
              <p className="text-gray-600 mt-1">
                Ajoutez rapidement un produit à sourcer pour le catalogue
                général ou pour un client spécifique
              </p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Package className="h-4 w-4 mr-2" />
              Mode Sourcing
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={e => {
          void handleSubmit(e).catch(error => {
            console.error('[SourcingQuickForm] Submit error:', error);
          });
        }}
        className="p-6 space-y-6"
      >
        <SupplierSection
          supplierMode={supplierMode}
          onSupplierModeChange={setSupplierMode}
          supplierId={formData.supplier_id}
          onSupplierIdChange={id =>
            setFormData(prev => ({ ...prev, supplier_id: id }))
          }
          newSupplier={newSupplier}
          onNewSupplierChange={updates =>
            setNewSupplier(prev => ({ ...prev, ...updates }))
          }
          errors={errors}
          onClearError={clearError}
        />

        <ImageUploadSection
          selectedImages={selectedImages}
          imagePreviews={imagePreviews}
          errors={errors}
          onImagesSelect={handleImagesSelect}
          onRemoveImage={removeImage}
        />

        <ProductFieldsSection
          formData={formData}
          errors={errors}
          onFieldChange={updates =>
            setFormData(prev => ({ ...prev, ...updates }))
          }
          onClearError={clearError}
        />

        <ClientSection
          formData={formData}
          linkedConsultationId={linkedConsultationId}
          onFieldChange={updates =>
            setFormData(prev => ({ ...prev, ...updates }))
          }
          onLinkedConsultationChange={setLinkedConsultationId}
        />

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">* Champs obligatoires</div>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  Valider
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
