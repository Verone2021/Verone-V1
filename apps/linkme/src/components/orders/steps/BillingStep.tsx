'use client';

/**
 * BillingStep - Etape 6 du formulaire de commande
 *
 * Formulaire simplifie pour contact et adresse de facturation:
 * - SECTION 1: Adresse de facturation (restaurant / maison mere / nouvelle)
 * - SECTION 2: Contact facturation (meme que responsable ou nouveau)
 *
 * @module BillingStep
 * @since 2026-01-24
 * @updated 2026-04-14 - Refactoring: extraction sous-composants + hook
 */

import { AlertCircle } from 'lucide-react';

import type {
  OrderFormData,
  ContactsStepData,
} from '../schemas/order-form.schema';
import { useBillingStep } from './billing/use-billing-step';
import { BillingAddressSection } from './billing/BillingAddressSection';
import { BillingContactSection } from './billing/BillingContactSection';

// ============================================================================
// TYPES
// ============================================================================

interface BillingStepProps {
  formData: OrderFormData;
  errors: string[];
  onUpdate: (data: Partial<ContactsStepData>) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BillingStep({
  formData,
  errors: _errors,
  onUpdate,
}: BillingStepProps) {
  const {
    showContactForm,
    isFranchise,
    isLoading,
    isSaving,
    restaurantInfo,
    parentOrg,
    parentPrimaryAddress,
    showParentAddress,
    hasUnsavedChanges,
    isBillingContactComplete,
    isBillingAddressComplete,
    isEditMode,
    handleBillingContactSameAsResponsable,
    handleBillingContactCreateNew,
    handleBillingContactChange,
    handleSelectRestaurantAddress,
    handleSelectParentAddress,
    handleCreateNewAddress,
    handleAddressChange,
    handleReplaceExistingChange,
    handleSetAsDefaultChange,
    handleSaveAddress,
  } = useBillingStep(formData, onUpdate);

  return (
    <div className="space-y-8">
      {/* SECTION 1: ADRESSE DE FACTURATION */}
      <BillingAddressSection
        billingAddress={formData.contacts.billingAddress}
        restaurantInfo={restaurantInfo}
        parentOrg={parentOrg}
        parentPrimaryAddress={parentPrimaryAddress}
        showParentAddress={showParentAddress}
        isLoading={isLoading}
        isEditMode={isEditMode}
        isBillingAddressComplete={isBillingAddressComplete}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSelectRestaurantAddress={handleSelectRestaurantAddress}
        onSelectParentAddress={handleSelectParentAddress}
        onCreateNewAddress={handleCreateNewAddress}
        onAddressChange={handleAddressChange}
        onReplaceExistingChange={handleReplaceExistingChange}
        onSetAsDefaultChange={handleSetAsDefaultChange}
        onSaveAddress={handleSaveAddress}
      />

      {/* SECTION 2: CONTACT FACTURATION */}
      <BillingContactSection
        billingContact={formData.contacts.billingContact}
        responsable={formData.contacts.responsable}
        isFranchise={isFranchise}
        showContactForm={showContactForm}
        isBillingContactComplete={isBillingContactComplete}
        onSameAsResponsable={handleBillingContactSameAsResponsable}
        onCreateNew={handleBillingContactCreateNew}
        onContactChange={handleBillingContactChange}
      />

      {/* INFO */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Information</p>
            <p className="mt-1">
              Le contact facturation recevra les factures et autres documents
              comptables. L&apos;adresse de facturation determine ou la facture
              sera envoyee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingStep;
