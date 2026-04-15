'use client';

import { useInlineEdit, type EditableSection } from '@verone/common/hooks';

import { SupplierPricingDisplay } from './SupplierPricingDisplay';
import { SupplierPricingEditForm } from './SupplierPricingEditForm';
import type {
  PricingEditData,
  SupplierVsPricingEditSectionProps,
} from './supplier-pricing-types';
import { calculateMinSellingPrice } from './use-supplier-pricing-calc';

export function SupplierVsPricingEditSection({
  product,
  variantGroup,
  onUpdate,
  className,
  channelPricing,
}: SupplierVsPricingEditSectionProps) {
  const isCostPriceManagedByGroup = !!(
    variantGroup?.has_common_cost_price && product.variant_group_id
  );
  const isEcoTaxManagedByGroup = isCostPriceManagedByGroup;

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
      onUpdate(updatedData as Partial<typeof product>);
    },
    onError: error => {
      console.error('Erreur mise à jour pricing supplier/internal:', error);
    },
  });

  const section: EditableSection = 'pricing';
  const editData = getEditedData(section) as PricingEditData | null;
  const error = getError(section);

  const currentCostPrice = isCostPriceManagedByGroup
    ? (variantGroup?.common_cost_price ?? 0)
    : (product.cost_price ?? 0);
  const currentMarginPercentage = product.margin_percentage ?? 25;
  const currentEcoTax = isEcoTaxManagedByGroup
    ? (variantGroup?.common_eco_tax ?? 0)
    : (product.eco_tax_default ?? 0);
  const currentSellingPrice = calculateMinSellingPrice(
    currentCostPrice,
    currentEcoTax,
    currentMarginPercentage
  );

  const handleStartEdit = () => {
    startEdit(section, {
      cost_price: currentCostPrice,
      eco_tax_default: currentEcoTax,
      margin_percentage: currentMarginPercentage,
    });
  };

  const handleSave = async () => {
    if (editData?.cost_price && editData.cost_price <= 0) {
      alert("⚠️ Le prix d'achat doit être supérieur à 0");
      return;
    }
    if (editData?.margin_percentage && editData.margin_percentage < 5) {
      const confirmed = confirm(
        `⚠️ Marge très faible (${editData.margin_percentage}%). Continuer ?`
      );
      if (!confirmed) return;
    }
    const sellingPrice = editData?.cost_price
      ? calculateMinSellingPrice(
          editData.cost_price,
          editData.eco_tax_default ?? 0,
          editData.margin_percentage ?? 25
        )
      : 0;
    updateEditedData(section, {
      cost_price: editData?.cost_price,
      eco_tax_default: editData?.eco_tax_default ?? 0,
      margin_percentage: editData?.margin_percentage,
      selling_price: sellingPrice,
    });
    setTimeout(() => {
      void saveChanges(section).catch(console.error);
    }, 0);
  };

  const handlePriceChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateEditedData(section, { [field]: numValue });
  };

  const editSellingPrice = editData
    ? calculateMinSellingPrice(
        editData.cost_price ?? 0,
        editData.eco_tax_default ?? 0,
        editData.margin_percentage ?? 25
      )
    : currentSellingPrice;

  const editMarginAmount = editData
    ? editSellingPrice -
      ((editData.cost_price ?? 0) + (editData.eco_tax_default ?? 0))
    : currentSellingPrice - (currentCostPrice + currentEcoTax);

  if (isEditing(section)) {
    return (
      <SupplierPricingEditForm
        editData={editData}
        isCostPriceManagedByGroup={isCostPriceManagedByGroup}
        isEcoTaxManagedByGroup={isEcoTaxManagedByGroup}
        isSaving={isSaving(section)}
        hasChanges={hasChanges(section)}
        onPriceChange={handlePriceChange}
        onSave={() => {
          void handleSave().catch(console.error);
        }}
        onCancel={() => cancelEdit(section)}
        editSellingPrice={editSellingPrice}
        editMarginAmount={editMarginAmount}
        error={error}
        variantGroup={variantGroup}
        className={className}
      />
    );
  }

  return (
    <SupplierPricingDisplay
      product={product}
      currentCostPrice={currentCostPrice}
      currentEcoTax={currentEcoTax}
      currentMarginPercentage={currentMarginPercentage}
      currentSellingPrice={currentSellingPrice}
      isCostPriceManagedByGroup={isCostPriceManagedByGroup}
      channelPricing={channelPricing}
      onStartEdit={handleStartEdit}
      variantGroup={variantGroup}
      className={className}
    />
  );
}
