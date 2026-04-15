'use client';

/**
 * OrderFormStepper - Stepper commun pour les workflows nouveau et existant
 *
 * Gère l'affichage des steps 1-6 et la confirmation inline.
 *
 * @module OrderFormStepper
 * @since 2026-04-14
 */

import { ChevronLeft } from 'lucide-react';

import type { CartItem, Organisation } from './types';
import { Header } from './Header';
import { Footer } from './Footer';
import { InlineConfirmation } from './InlineConfirmation';
import { OpeningStep1Requester } from './RequesterStep';
import {
  OpeningStep2Restaurant,
  ExistingStep2Restaurant,
} from './RestaurantStep';
import {
  OpeningStep3Responsable,
  ExistingStep3Responsable,
} from './ResponsableStep';
import { OpeningStep4Billing } from './BillingStep';
import { OpeningStep5Delivery } from './DeliveryStep';
import { OpeningStep6Validation } from './ValidationStep';
import type { OrderFormUnifiedData, StepConfig } from './types';

interface CartTotals {
  totalHt: number;
  totalTtc: number;
  totalTva: number;
  totalItems: number;
}

interface OrderFormStepperProps {
  isNewRestaurant: boolean;
  data: OrderFormUnifiedData;
  errors: Record<string, string>;
  updateData: (updates: Partial<OrderFormUnifiedData>) => void;
  affiliateId: string;
  steps: StepConfig[];
  currentStep: number;
  showConfirmation: boolean;
  confirmTermsAccepted: boolean;
  isSubmitting: boolean;
  cart: CartItem[];
  cartTotals: CartTotals;
  formatPrice: (price: number) => string;
  organisations: Organisation[];
  isLoadingOrganisations?: boolean;
  selectionName: string;
  selectionSlug?: string;
  onUpdateQuantity?: (id: string, qty: number) => void;
  onRemoveItem?: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  onSetShowConfirmation: (v: boolean) => void;
  onSetConfirmTermsAccepted: (v: boolean) => void;
  onOpenConfirmation: () => void;
  onConfirmOrder: () => Promise<void>;
}

export function OrderFormStepper({
  isNewRestaurant,
  data,
  errors,
  updateData,
  affiliateId,
  steps,
  currentStep,
  showConfirmation,
  confirmTermsAccepted,
  isSubmitting,
  cart,
  cartTotals,
  formatPrice,
  organisations,
  isLoadingOrganisations = false,
  selectionName,
  selectionSlug,
  onUpdateQuantity,
  onRemoveItem,
  onBack,
  onNext,
  onClose,
  onSetShowConfirmation,
  onSetConfirmTermsAccepted,
  onOpenConfirmation,
  onConfirmOrder,
}: OrderFormStepperProps) {
  const restaurantName = isNewRestaurant
    ? data.newRestaurant.tradeName || 'Nouveau restaurant'
    : (organisations.find(o => o.id === data.existingOrganisationId)
        ?.trade_name ?? 'Restaurant existant');

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Header
        title={
          showConfirmation
            ? 'Confirmer votre commande'
            : `${currentStep}. ${steps[currentStep - 1]?.title ?? ''}`
        }
        subtitle={
          showConfirmation ? undefined : `Étape ${currentStep}/${steps.length}`
        }
        steps={showConfirmation ? undefined : steps}
        currentStep={showConfirmation ? undefined : currentStep}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {showConfirmation ? (
          <InlineConfirmation
            onBack={() => onSetShowConfirmation(false)}
            onConfirm={() => void onConfirmOrder()}
            isSubmitting={isSubmitting}
            termsAccepted={confirmTermsAccepted}
            onTermsChange={onSetConfirmTermsAccepted}
            requesterName={data.requester.name}
            requesterEmail={data.requester.email}
            restaurantName={restaurantName}
            isNewRestaurant={isNewRestaurant}
            responsableName={data.responsable.name}
            cart={cart}
            itemsCount={cartTotals.totalItems}
            totalHT={cartTotals.totalHt}
            totalTVA={cartTotals.totalTva}
            totalTTC={cartTotals.totalTtc}
            hasDeliveryDate={!!data.delivery.deliveryDate}
            deliveryAsap={data.delivery.deliveryAsap}
            deliveryAddress={
              data.delivery.address
                ? `${data.delivery.address}, ${data.delivery.postalCode} ${data.delivery.city}`
                : ''
            }
            selectionName={selectionName}
            faqUrl={selectionSlug ? `/s/${selectionSlug}/faq` : '#'}
          />
        ) : (
          <>
            {currentStep === 1 && (
              <OpeningStep1Requester
                data={data}
                errors={errors}
                updateData={updateData}
                affiliateId={affiliateId}
              />
            )}
            {currentStep === 2 &&
              (isNewRestaurant ? (
                <OpeningStep2Restaurant
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              ) : (
                <ExistingStep2Restaurant
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  organisations={organisations}
                  isLoadingOrganisations={isLoadingOrganisations}
                />
              ))}
            {currentStep === 3 &&
              (isNewRestaurant ? (
                <OpeningStep3Responsable
                  data={data}
                  errors={errors}
                  updateData={updateData}
                  affiliateId={affiliateId}
                />
              ) : (
                <ExistingStep3Responsable
                  data={data}
                  errors={errors}
                  updateData={updateData}
                />
              ))}
            {currentStep === 4 && (
              <OpeningStep4Billing
                data={data}
                errors={errors}
                updateData={updateData}
                affiliateId={affiliateId}
              />
            )}
            {currentStep === 5 && (
              <OpeningStep5Delivery
                data={data}
                errors={errors}
                updateData={updateData}
                affiliateId={affiliateId}
              />
            )}
            {currentStep === 6 && (
              <OpeningStep6Validation
                data={data}
                errors={errors}
                updateData={updateData}
                affiliateId={affiliateId}
                cart={cart}
                cartTotals={cartTotals}
                formatPrice={formatPrice}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onOpenConfirmation={onOpenConfirmation}
              />
            )}
          </>
        )}
      </div>

      {/* Footer - masqué en step 6 et confirmation */}
      {!showConfirmation && currentStep < 6 && (
        <Footer
          onBack={onBack}
          onNext={onNext}
          nextLabel="Suivant"
          isSubmitting={isSubmitting}
          cartTotals={cartTotals}
          formatPrice={formatPrice}
          showBackButton
        />
      )}

      {/* Footer simplifié pour step 4 */}
      {!showConfirmation && currentStep === 4 && (
        <div className="flex-shrink-0 border-t bg-gray-50 px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            className="py-2 px-4 border border-gray-300 rounded font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      )}
    </div>
  );
}
