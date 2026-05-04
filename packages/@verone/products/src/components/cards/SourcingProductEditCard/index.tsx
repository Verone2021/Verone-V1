'use client';

import { useInlineEdit, type EditableSection } from '@verone/common/hooks';
import { Card, CardContent, CardHeader } from '@verone/ui';
import { cn } from '@verone/utils';

import { SourcingProductDetailsSection } from './SourcingProductDetailsSection';
import { SourcingProductImageBlock } from './SourcingProductImageBlock';
import { SourcingProductInfoSection } from './SourcingProductInfoSection';
import { SourcingProductNotesSection } from './SourcingProductNotesSection';
import { SourcingProductPricingSection } from './SourcingProductPricingSection';
import { SourcingProductSupplierSection } from './SourcingProductSupplierSection';
import type {
  DetailsSectionData,
  InfoSectionData,
  NotesSectionData,
  PricingSectionData,
  SupplierSectionData,
  SourcingProductEditCardProps,
} from './types';

export function SourcingProductEditCard({
  product,
  primaryImage,
  images = [],
  imagesLoading = false,
  onProductUpdate,
  onOpenPhotosModal,
  className,
}: SourcingProductEditCardProps) {
  const {
    isEditing,
    isSaving,
    getError,
    getEditedData,
    startEdit,
    cancelEdit,
    updateEditedData,
    saveChanges,
    hasChanges,
  } = useInlineEdit({
    productId: product.id,
    onUpdate: updatedData => {
      void onProductUpdate(updatedData);
    },
    onError: (error: unknown) => {
      console.error('Erreur mise à jour sourcing:', error);
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // ── INFO SECTION ────────────────────────────────────────────────────────────
  const infoSection: EditableSection = 'general';
  const infoData = getEditedData(infoSection) as InfoSectionData | null;

  const handleStartInfoEdit = () => {
    startEdit(infoSection, {
      name: product.name,
      supplier_page_url: product.supplier_page_url ?? '',
      supplier_reference: product.supplier_reference ?? '',
    });
  };

  const handleSaveInfo = async () => {
    if (!infoData?.name?.trim()) {
      alert('Le nom du produit est obligatoire');
      return;
    }
    if (infoData?.supplier_page_url?.trim()) {
      try {
        new URL(infoData.supplier_page_url);
      } catch {
        alert("Format d'URL invalide");
        return;
      }
    }
    const success = await saveChanges(infoSection);
    if (success) {
      console.warn('Informations mises à jour');
    }
  };

  // ── PRICING SECTION ─────────────────────────────────────────────────────────
  const pricingSection: EditableSection = 'pricing';
  const pricingData = getEditedData(
    pricingSection
  ) as PricingSectionData | null;

  const handleStartPricingEdit = () => {
    startEdit(pricingSection, {
      cost_price: product.cost_price ?? 0,
      eco_tax_default: product.eco_tax_default ?? 0,
    });
  };

  const handleSavePricing = async () => {
    if (pricingData?.cost_price !== undefined && pricingData.cost_price <= 0) {
      alert("Le prix d'achat doit être supérieur à 0");
      return;
    }
    const success = await saveChanges(pricingSection);
    if (success) {
      console.warn('Tarification mise à jour');
    }
  };

  // ── SUPPLIER SECTION ────────────────────────────────────────────────────────
  const supplierSection: EditableSection = 'supplier';
  const supplierData = getEditedData(
    supplierSection
  ) as SupplierSectionData | null;

  const handleStartSupplierEdit = () => {
    startEdit(supplierSection, {
      supplier_id: product.supplier_id ?? null,
    });
  };

  const handleSaveSupplier = async () => {
    const success = await saveChanges(supplierSection);
    if (success) {
      console.warn('Fournisseur mis à jour');
    }
  };

  // ── DETAILS SECTION ─────────────────────────────────────────────────────────
  const detailsSection: EditableSection = 'details';
  const detailsData = getEditedData(
    detailsSection
  ) as DetailsSectionData | null;

  const handleStartDetailsEdit = () => {
    startEdit(detailsSection, {
      manufacturer: product.manufacturer ?? '',
      description: product.description ?? '',
      supplier_moq: product.supplier_moq ?? 0,
      dimensions_length: product.dimensions?.length ?? 0,
      dimensions_width: product.dimensions?.width ?? 0,
      dimensions_height: product.dimensions?.height ?? 0,
      weight: product.weight ?? 0,
    });
  };

  const handleSaveDetails = async () => {
    const dims =
      (detailsData?.dimensions_length ??
      detailsData?.dimensions_width ??
      detailsData?.dimensions_height)
        ? {
            length: detailsData.dimensions_length ?? 0,
            width: detailsData.dimensions_width ?? 0,
            height: detailsData.dimensions_height ?? 0,
          }
        : null;

    const toSave = {
      manufacturer: detailsData?.manufacturer ?? null,
      description: detailsData?.description ?? null,
      supplier_moq: detailsData?.supplier_moq ?? null,
      dimensions: dims,
      weight: detailsData?.weight ?? null,
    };

    updateEditedData(detailsSection, toSave);

    const success = await saveChanges(detailsSection);
    if (success) {
      console.warn('Détails produit mis à jour');
    }
  };

  // ── NOTES SECTION ───────────────────────────────────────────────────────────
  const notesSection: EditableSection = 'notes';
  const notesData = getEditedData(notesSection) as NotesSectionData | null;

  const handleStartNotesEdit = () => {
    startEdit(notesSection, {
      internal_notes: product.internal_notes ?? '',
    });
  };

  const handleSaveNotes = async () => {
    const success = await saveChanges(notesSection);
    if (success) {
      console.warn('Notes mises à jour');
    }
  };

  return (
    <Card className={cn('border-black', className)}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <SourcingProductImageBlock
            product={product}
            primaryImage={primaryImage}
            images={images}
            imagesLoading={imagesLoading}
            onOpenPhotosModal={onOpenPhotosModal}
          />

          <div className="flex-1 min-w-0">
            <SourcingProductInfoSection
              product={product}
              isEditing={isEditing(infoSection)}
              isSaving={isSaving(infoSection)}
              editedData={infoData}
              error={getError(infoSection)}
              hasChanges={hasChanges(infoSection)}
              onStartEdit={handleStartInfoEdit}
              onCancelEdit={() => cancelEdit(infoSection)}
              onUpdateData={patch => updateEditedData(infoSection, patch)}
              onSave={handleSaveInfo}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="border-t border-gray-200 pt-4">
          <SourcingProductPricingSection
            product={product}
            isEditing={isEditing(pricingSection)}
            isSaving={isSaving(pricingSection)}
            editedData={pricingData}
            error={getError(pricingSection)}
            hasChanges={hasChanges(pricingSection)}
            onStartEdit={handleStartPricingEdit}
            onCancelEdit={() => cancelEdit(pricingSection)}
            onUpdateData={patch => updateEditedData(pricingSection, patch)}
            onSave={handleSavePricing}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <SourcingProductSupplierSection
            product={product}
            isEditing={isEditing(supplierSection)}
            isSaving={isSaving(supplierSection)}
            editedData={supplierData}
            error={getError(supplierSection)}
            hasChanges={hasChanges(supplierSection)}
            onStartEdit={handleStartSupplierEdit}
            onCancelEdit={() => cancelEdit(supplierSection)}
            onUpdateData={patch => updateEditedData(supplierSection, patch)}
            onSave={handleSaveSupplier}
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <SourcingProductDetailsSection
            product={product}
            isEditing={isEditing(detailsSection)}
            isSaving={isSaving(detailsSection)}
            editedData={detailsData}
            error={getError(detailsSection)}
            hasChanges={hasChanges(detailsSection)}
            onStartEdit={handleStartDetailsEdit}
            onCancelEdit={() => cancelEdit(detailsSection)}
            onUpdateData={patch => updateEditedData(detailsSection, patch)}
            onSave={handleSaveDetails}
          />
        </div>

        <SourcingProductNotesSection
          product={product}
          isEditing={isEditing(notesSection)}
          isSaving={isSaving(notesSection)}
          editedData={notesData}
          error={getError(notesSection)}
          hasChanges={hasChanges(notesSection)}
          onStartEdit={handleStartNotesEdit}
          onCancelEdit={() => cancelEdit(notesSection)}
          onUpdateData={patch => updateEditedData(notesSection, patch)}
          onSave={handleSaveNotes}
          formatDate={formatDate}
        />
      </CardContent>
    </Card>
  );
}
