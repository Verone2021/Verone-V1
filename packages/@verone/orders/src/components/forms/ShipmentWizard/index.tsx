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

import { parseShippingAddress } from './parse-address';
import type { ShipmentWizardProps } from './types';
import { useShipmentWizard } from './useShipmentWizard';
import { StepStepper } from './StepStepper';
import { StepAddresses } from './StepAddresses';
import { StepStock } from './StepStock';
import { StepDeliveryMethod } from './StepDeliveryMethod';
import { StepPackageInfo } from './StepPackageInfo';
import { StepCarrierSelection } from './StepCarrierSelection';
import { StepDropoffs } from './StepDropoffs';
import { StepPayment } from './StepPayment';
import { StepSuccess } from './StepSuccess';
import { StepError } from './StepError';

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

  const addr = parseShippingAddress(salesOrder.shipping_address);
  const customerName = salesOrder.customer_name ?? 'Client';

  return (
    <div className="space-y-4">
      <StepStepper
        step={state.step}
        stepLabels={state.stepLabels}
        maxStep={state.maxStep}
      />

      {/* STEP 1: Adresses (expediteur + contact destinataire) */}
      {state.step === 1 && (
        <StepAddresses
          salesOrder={salesOrder}
          allContacts={state.allContacts}
          contactsLoading={state.contactsLoading}
          selectedContact={state.selectedContact}
          setSelectedContact={state.setSelectedContact}
          onBack={onCancel}
          onNext={() => state.setStep(2)}
        />
      )}

      {/* STEP 2: Stock selection */}
      {state.step === 2 && (
        <StepStock
          items={state.items}
          totals={state.totals}
          previousShipments={state.previousShipments}
          handleQuantityChange={state.handleQuantityChange}
          handleShipAll={state.handleShipAll}
          onReusePackages={pkgs => state.setPackages(pkgs)}
          onOpenAdjustment={item => setAdjustmentItem(item)}
          onNext={() => state.setStep(3)}
          onCancel={onCancel}
        />
      )}

      {/* STEP 3: Delivery method */}
      {state.step === 3 && (
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
          onBack={() => state.setStep(2)}
          onNext={() => state.setStep(4)}
          onValidateSimple={() => {
            void state.handleSimpleValidation().catch(console.error);
          }}
        />
      )}

      {/* STEP 4: Package info (Packlink) */}
      {state.step === 4 && (
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
          onBack={() => state.setStep(3)}
          onNext={() => {
            void state
              .fetchServices()
              .then(() => state.setStep(5))
              .catch(console.error);
          }}
        />
      )}

      {/* STEP 5: Carrier selection */}
      {state.step === 5 && (
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
          onBack={() => state.setStep(4)}
          onNext={() => state.setStep(6)}
          fetchDropoffs={state.fetchDropoffs}
        />
      )}

      {/* STEP 6: Dropoff points */}
      {state.step === 6 && state.selectedService && (
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
          onBack={() => state.setStep(5)}
          onNext={() => state.setStep(7)}
        />
      )}

      {/* STEP 7: Payment */}
      {state.step === 7 && state.selectedService && (
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
          onBack={() => state.setStep(5)}
          onCreateDraft={() => {
            void state.handleCreateDraft().catch(console.error);
          }}
        />
      )}

      {/* STEP 8: Success */}
      {state.step === 8 && state.shipmentResult && (
        <StepSuccess
          shipmentResult={state.shipmentResult}
          onClose={onSuccess}
        />
      )}

      {/* STEP 9: Error recovery — Packlink created but DB save failed */}
      {state.step === 9 && (
        <StepError
          packlinkRef={state.pendingPacklinkRef}
          dbError={state.dbError}
          authError={null}
          retrying={state.pendingAction}
          onRetryDb={() => {
            void state.handleRetryDbSave().catch(console.error);
          }}
          onCancelPacklink={() => {
            void state.handleCancelPacklink().catch(console.error);
          }}
          onClose={onCancel}
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
