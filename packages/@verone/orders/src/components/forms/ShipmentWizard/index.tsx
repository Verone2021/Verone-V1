'use client';

/**
 * ShipmentWizard — Modal expedition multi-etapes
 *
 * Etape 1 : Selection stock (produits + quantites)
 * Etape 2 : Mode de livraison (retrait / main propre / manuel / Packlink)
 * Etape 3 : Infos colis (Packlink — dimensions, poids, contenu, assurance)
 * Etape 4 : Choix transporteur (Packlink — services + prix, style Packlink PRO)
 * Etape 5 : Points relais (Packlink — si service relais)
 * Etape 6 : Resume + confirmation (Packlink)
 * Etape 7 : Success + lien Packlink PRO
 */

import { useState } from 'react';

import { InventoryAdjustmentModal } from '@verone/stock';
import type { ShipmentItem } from '@verone/types';

import type { ShipmentWizardProps } from './types';
import { useShipmentWizard } from './useShipmentWizard';
import { StepStepper } from './StepStepper';
import { StepStock } from './StepStock';
import { StepDeliveryMethod } from './StepDeliveryMethod';
import { StepPackageInfo } from './StepPackageInfo';
import { StepCarrierSelection } from './StepCarrierSelection';
import { StepDropoffs } from './StepDropoffs';
import { StepPayment } from './StepPayment';
import { StepSuccess } from './StepSuccess';

interface ShipmentWizardExtendedProps extends ShipmentWizardProps {
  onRefetch?: () => void;
}

export function ShipmentWizard({
  salesOrder,
  onSuccess,
  onCancel,
  onRefetch,
}: ShipmentWizardExtendedProps) {
  const state = useShipmentWizard(salesOrder, onSuccess);
  const [adjustmentItem, setAdjustmentItem] = useState<ShipmentItem | null>(
    null
  );

  const adjustmentProduct = adjustmentItem
    ? {
        id: adjustmentItem.product_id,
        name: adjustmentItem.product_name,
        sku: adjustmentItem.product_sku,
        stock_quantity: adjustmentItem.stock_available,
      }
    : null;

  const addr = (salesOrder.shipping_address ?? null) as Record<
    string,
    string
  > | null;
  const customerName = salesOrder.customer_name ?? 'Client';

  return (
    <div className="space-y-4">
      <StepStepper
        step={state.step}
        stepLabels={state.stepLabels}
        maxStep={state.maxStep}
      />

      {/* STEP 1: Stock selection */}
      {state.step === 1 && (
        <StepStock
          items={state.items}
          totals={state.totals}
          previousShipments={state.previousShipments}
          showPreviousShipments={state.showPreviousShipments}
          setShowPreviousShipments={state.setShowPreviousShipments}
          handleQuantityChange={state.handleQuantityChange}
          handleShipAll={state.handleShipAll}
          onOpenAdjustment={item => setAdjustmentItem(item)}
          onNext={() => state.setStep(2)}
          onCancel={onCancel}
        />
      )}

      {/* STEP 2: Delivery method */}
      {state.step === 2 && (
        <StepDeliveryMethod
          deliveryMethod={state.deliveryMethod}
          setDeliveryMethod={state.setDeliveryMethod}
          manualCarrier={state.manualCarrier}
          setManualCarrier={state.setManualCarrier}
          manualTracking={state.manualTracking}
          setManualTracking={state.setManualTracking}
          manualShippingCost={state.manualShippingCost}
          setManualShippingCost={state.setManualShippingCost}
          notes={state.notes}
          setNotes={state.setNotes}
          validating={state.validating}
          onBack={() => state.setStep(1)}
          onNext={() => state.setStep(3)}
          onValidateSimple={() => {
            void state.handleSimpleValidation().catch(console.error);
          }}
        />
      )}

      {/* STEP 3: Package info (Packlink) */}
      {state.step === 3 && (
        <StepPackageInfo
          salesOrder={salesOrder}
          packages={state.packages}
          items={state.items}
          contentDescription={state.contentDescription}
          setContentDescription={state.setContentDescription}
          isSecondHand={state.isSecondHand}
          setIsSecondHand={state.setIsSecondHand}
          declaredValue={state.declaredValue}
          setDeclaredValue={state.setDeclaredValue}
          wantsInsurance={state.wantsInsurance}
          setWantsInsurance={state.setWantsInsurance}
          insurancePrice={state.insurancePrice}
          selectedService={state.selectedService}
          customerName={customerName}
          addr={addr}
          handleAddPackage={state.handleAddPackage}
          handleRemovePackage={state.handleRemovePackage}
          handlePackageChange={state.handlePackageChange}
          onBack={() => state.setStep(2)}
          onNext={() => {
            void state
              .fetchServices()
              .then(() => state.setStep(4))
              .catch(console.error);
          }}
        />
      )}

      {/* STEP 4: Carrier selection */}
      {state.step === 4 && (
        <StepCarrierSelection
          salesOrder={salesOrder}
          packages={state.packages}
          items={state.items}
          contentDescription={state.contentDescription}
          declaredValue={state.declaredValue}
          wantsInsurance={state.wantsInsurance}
          services={state.services}
          sortedServices={state.sortedServices}
          selectedService={state.selectedService}
          setSelectedService={state.setSelectedService}
          loadingServices={state.loadingServices}
          servicesError={state.servicesError}
          sortOption={state.sortOption}
          setSortOption={state.setSortOption}
          formatTransitLabel={state.formatTransitLabel}
          formatEstimatedDate={state.formatEstimatedDate}
          onBack={() => state.setStep(3)}
          onNext={() => state.setStep(5)}
          fetchDropoffs={state.fetchDropoffs}
        />
      )}

      {/* STEP 5: Dropoff points */}
      {state.step === 5 && state.selectedService && (
        <StepDropoffs
          salesOrder={salesOrder}
          packages={state.packages}
          items={state.items}
          contentDescription={state.contentDescription}
          declaredValue={state.declaredValue}
          wantsInsurance={state.wantsInsurance}
          selectedService={state.selectedService}
          destinationZip={state.destinationZip}
          senderDropoffs={state.senderDropoffs}
          selectedSenderDropoff={state.selectedSenderDropoff}
          setSelectedSenderDropoff={state.setSelectedSenderDropoff}
          loadingSenderDropoffs={state.loadingSenderDropoffs}
          receiverDropoffs={state.receiverDropoffs}
          selectedReceiverDropoff={state.selectedReceiverDropoff}
          setSelectedReceiverDropoff={state.setSelectedReceiverDropoff}
          loadingReceiverDropoffs={state.loadingReceiverDropoffs}
          collectionDate={state.collectionDate}
          setCollectionDate={state.setCollectionDate}
          collectionTime={state.collectionTime}
          setCollectionTime={state.setCollectionTime}
          onBack={() => state.setStep(4)}
          onNext={() => state.setStep(6)}
        />
      )}

      {/* STEP 6: Payment */}
      {state.step === 6 && state.selectedService && (
        <StepPayment
          salesOrder={salesOrder}
          packages={state.packages}
          items={state.items}
          contentDescription={state.contentDescription}
          declaredValue={state.declaredValue}
          wantsInsurance={state.wantsInsurance}
          insurancePrice={state.insurancePrice}
          selectedService={state.selectedService}
          senderDropoffs={state.senderDropoffs}
          selectedSenderDropoff={state.selectedSenderDropoff}
          receiverDropoffs={state.receiverDropoffs}
          selectedReceiverDropoff={state.selectedReceiverDropoff}
          customerName={customerName}
          addr={addr}
          paying={state.paying}
          servicesError={state.servicesError}
          formatTransit={state.formatTransit}
          formatEstimatedDate={state.formatEstimatedDate}
          onBack={() => state.setStep(4)}
          onCreateDraft={() => {
            void state.handleCreateDraft().catch(console.error);
          }}
        />
      )}

      {/* STEP 7: Success */}
      {state.step === 7 && state.shipmentResult && (
        <StepSuccess
          shipmentResult={state.shipmentResult}
          onClose={onSuccess}
        />
      )}

      <InventoryAdjustmentModal
        isOpen={adjustmentItem !== null}
        onClose={() => setAdjustmentItem(null)}
        onSuccess={() => {
          setAdjustmentItem(null);
          onRefetch?.();
        }}
        product={adjustmentProduct}
      />
    </div>
  );
}
