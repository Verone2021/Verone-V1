'use client';

/**
 * NewOrderForm - Formulaire de commande en 8 étapes
 *
 * Composant orchestrateur qui :
 * - Affiche le stepper sidebar
 * - Rend l'étape courante
 * - Gère la navigation et validation
 *
 * @module NewOrderForm
 * @since 2026-01-20
 * @updated 2026-01-24 - Refonte 7→8 étapes
 */

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { cn } from '@verone/ui';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { useOrderForm } from '../../lib/hooks/use-order-form';
import { OrderStepper, ORDER_STEPS } from './OrderStepper';

// Steps components
import { RestaurantStep } from './steps/RestaurantStep';
import { SelectionStep } from './steps/SelectionStep';
import { ProductsStep } from './steps/ProductsStep';
import { CartStep } from './steps/CartStep';
import { ResponsableStep } from './steps/ResponsableStep';
import { BillingStep } from './steps/BillingStep';
import { ShippingStep } from './steps/ShippingStep';
import { ValidationStep } from './steps/ValidationStep';

// ============================================================================
// COMPONENT
// ============================================================================

export function NewOrderForm() {
  const router = useRouter();
  const orderForm = useOrderForm();

  const {
    currentStep,
    completedSteps,
    formData,
    errors,
    isSubmitting,
    goToStep,
    nextStep,
    prevStep,
    canGoNext,
    canGoPrev,
    cartTotals,
    // Updates
    updateRestaurant,
    updateSelection,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    updateContacts,
    updateDelivery,
    // Actions
    submit,
  } = orderForm;

  // Handler de soumission finale
  const handleSubmit = useCallback(async () => {
    const orderId = await submit();
    if (orderId) {
      toast.success('Commande créée avec succès !', {
        description: 'Vous allez être redirigé vers la liste des commandes.',
      });
      router.push('/commandes');
    }
  }, [submit, router]);

  // Rendu de l'étape courante
  const renderStep = () => {
    const commonProps = {
      formData,
      errors,
      cartTotals,
    };

    switch (currentStep) {
      case 1:
        return (
          <RestaurantStep
            {...commonProps}
            onUpdate={updateRestaurant}
          />
        );
      case 2:
        return (
          <SelectionStep
            {...commonProps}
            onUpdate={updateSelection}
            onClearCart={clearCart}
          />
        );
      case 3:
        return (
          <ProductsStep
            {...commonProps}
            onAddToCart={addToCart}
            onUpdateQuantity={updateCartQuantity}
          />
        );
      case 4:
        return (
          <CartStep
            {...commonProps}
            onRemove={removeFromCart}
            onUpdateQuantity={updateCartQuantity}
          />
        );
      case 5:
        return (
          <ResponsableStep
            {...commonProps}
            onUpdate={updateContacts}
          />
        );
      case 6:
        return (
          <BillingStep
            {...commonProps}
            onUpdate={updateContacts}
          />
        );
      case 7:
        return (
          <ShippingStep
            {...commonProps}
            onUpdate={updateContacts}
            onUpdateDelivery={updateDelivery}
          />
        );
      case 8:
        return (
          <ValidationStep
            {...commonProps}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  const currentStepInfo = ORDER_STEPS.find((s) => s.id === currentStep);

  return (
    <div className="flex min-h-[calc(100vh-120px)]">
      {/* Sidebar Stepper */}
      <aside className="w-72 bg-white border-r p-4 flex-shrink-0">
        <OrderStepper
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={goToStep}
        />
      </aside>

      {/* Zone principale */}
      <main className="flex-1 flex flex-col">
        {/* Header de l'étape avec navigation */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Gauche : Icône + Titre */}
            <div className="flex items-center gap-3">
              {currentStepInfo && (
                <>
                  <div className="w-10 h-10 rounded-full bg-linkme-turquoise/10 flex items-center justify-center">
                    <currentStepInfo.icon className="h-5 w-5 text-linkme-turquoise" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Étape {currentStep} : {currentStepInfo.label}
                    </h2>
                    {currentStepInfo.description && (
                      <p className="text-sm text-gray-500">
                        {currentStepInfo.description}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Droite : Boutons navigation */}
            <div className="flex items-center gap-3">
              {/* Bouton Précédent */}
              <button
                type="button"
                onClick={prevStep}
                disabled={!canGoPrev || isSubmitting}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                  canGoPrev && !isSubmitting
                    ? 'text-gray-700 hover:bg-gray-100 border'
                    : 'text-gray-300 cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>

              {/* Bouton Suivant / Confirmer */}
              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canGoNext || isSubmitting}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                    canGoNext && !isSubmitting
                      ? 'bg-linkme-turquoise text-white hover:bg-linkme-turquoise/90'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    'flex items-center gap-1.5 px-5 py-2 rounded-lg font-medium text-sm transition-colors',
                    !isSubmitting
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-green-300 text-white cursor-not-allowed'
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Confirmer la commande'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenu de l'étape */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-800">
                    Veuillez corriger les erreurs suivantes :
                  </h4>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Étape */}
          {renderStep()}
        </div>

        {/* Footer avec info panier */}
        {currentStep >= 3 && cartTotals.itemsCount > 0 && (
          <div className="bg-white border-t px-6 py-3">
            <div className="flex items-center justify-center text-sm text-gray-600">
              <span className="font-medium">{cartTotals.itemsCount}</span>&nbsp;produit
              {cartTotals.itemsCount > 1 ? 's' : ''}&nbsp;•&nbsp;
              <span className="font-semibold text-gray-900 ml-1">
                {cartTotals.totalTTC.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                € TTC
              </span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default NewOrderForm;
