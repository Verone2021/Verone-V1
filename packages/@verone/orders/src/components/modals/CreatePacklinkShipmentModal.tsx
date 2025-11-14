/**
 * Create Packlink Shipment Modal
 * Modal multi-étapes pour créer une expédition Packlink
 * Étapes : Formulaire → Services → Draft → Paiement → PDF
 */

'use client';

import React, { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Button } from '@verone/ui';
import { Card } from '@verone/ui';
import { Download, Check, MapPin, AlertCircle } from 'lucide-react';

import { PacklinkShipmentForm } from '../forms/PacklinkShipmentForm';
import type { PacklinkDropoffPoint } from '../shipments/PickupPointSelector';
import { PickupPointSelector } from '../shipments/PickupPointSelector';
import { ServiceSelector } from '../shipments/ServiceSelector';

type ModalStep =
  | 'form'
  | 'services'
  | 'dropoff_selection'
  | 'draft_created'
  | 'paid'
  | 'error';

interface CreatePacklinkShipmentModalProps {
  salesOrderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePacklinkShipmentModal({
  salesOrderId,
  open,
  onOpenChange,
  onSuccess,
}: CreatePacklinkShipmentModalProps) {
  const [step, setStep] = useState<ModalStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDropoffPoint, setSelectedDropoffPoint] =
    useState<PacklinkDropoffPoint | null>(null);
  const [draftShipment, setDraftShipment] = useState<any>(null);
  const [paidOrder, setPaidOrder] = useState<any>(null);

  const handleFormSubmit = async (data: any) => {
    setFormData(data);
    setIsLoading(true);

    try {
      // Rechercher services disponibles
      const response = await fetch('/api/packlink/search-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Erreur recherche services');
      }

      setServices(result.services || []);
      setStep('services');
    } catch (error) {
      console.error('[Modal] Search services error:', error);
      alert(
        `Erreur : ${error instanceof Error ? error.message : 'Erreur recherche services'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceSelect = async (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    setSelectedService(service);

    // Vérifier si le service nécessite un dropoff
    const needsDropoff =
      service.collection_type === 'dropoff' ||
      service.delivery_type === 'locker' ||
      service.delivery_type === 'dropoff' ||
      service.dropoff === true;

    if (needsDropoff) {
      // Afficher sélecteur dropoff
      setStep('dropoff_selection');
    } else {
      // Créer draft directement
      await createDraft(serviceId, null);
    }
  };

  const createDraft = async (
    serviceId: number,
    dropoffPointId: string | null
  ) => {
    setIsLoading(true);

    try {
      // Créer draft Packlink
      const response = await fetch('/api/packlink/draft/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_order_id: salesOrderId,
          ...formData,
          service_id: serviceId,
          dropoff_point_id: dropoffPointId,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Erreur création draft');
      }

      setDraftShipment(result.shipment);
      setStep('draft_created');
    } catch (error) {
      console.error('[Modal] Create draft error:', error);
      alert(
        `Erreur : ${error instanceof Error ? error.message : 'Erreur création draft'}`
      );
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropoffSelect = (dropoffPoint: PacklinkDropoffPoint) => {
    setSelectedDropoffPoint(dropoffPoint);
  };

  const handleConfirmDropoff = () => {
    if (selectedService && selectedDropoffPoint) {
      createDraft(selectedService.id, selectedDropoffPoint.id);
    }
  };

  const handlePay = async () => {
    if (!draftShipment) return;

    setIsLoading(true);

    try {
      // Finaliser paiement
      const response = await fetch('/api/packlink/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_id: draftShipment.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.message || 'Erreur paiement');
      }

      setPaidOrder(result.order);
      setStep('paid');
    } catch (error) {
      console.error('[Modal] Payment error:', error);
      alert(
        `Erreur : ${error instanceof Error ? error.message : 'Erreur paiement'}`
      );
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (paidOrder?.label_url) {
      window.open(paidOrder.label_url, '_blank');
    }
  };

  const handleClose = () => {
    setStep('form');
    setFormData(null);
    setServices([]);
    setSelectedService(null);
    setSelectedDropoffPoint(null);
    setDraftShipment(null);
    setPaidOrder(null);
    onOpenChange(false);
    if (step === 'paid') {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une expédition Packlink</DialogTitle>
          <DialogDescription>
            {step === 'form' && "Remplissez les informations d'expédition"}
            {step === 'services' && 'Sélectionnez un service de transport'}
            {step === 'dropoff_selection' && 'Sélectionnez un point de dépôt'}
            {step === 'draft_created' &&
              'Brouillon créé - Procéder au paiement'}
            {step === 'paid' && 'Expédition payée - Télécharger le bordereau'}
            {step === 'error' && 'Une erreur est survenue'}
          </DialogDescription>
        </DialogHeader>

        {/* Étape 1 : Formulaire */}
        {step === 'form' && (
          <PacklinkShipmentForm
            salesOrderId={salesOrderId}
            onSubmit={handleFormSubmit}
            isLoading={isLoading}
          />
        )}

        {/* Étape 2 : Sélection service */}
        {step === 'services' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {services.length} service(s) disponible(s) pour cet itinéraire
            </div>
            <ServiceSelector
              services={services}
              onSelect={handleServiceSelect}
              loading={isLoading}
            />
          </div>
        )}

        {/* Étape 2.5 : Sélection dropoff point */}
        {step === 'dropoff_selection' && selectedService && formData && (
          <div className="space-y-4">
            {/* Info service sélectionné */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Point de dépôt requis
                </h3>
              </div>
              <p className="text-sm text-blue-800">
                Le service <strong>{selectedService.carrier_name}</strong>{' '}
                nécessite le dépôt du colis dans un point relais. Sélectionnez
                le point le plus proche de votre adresse.
              </p>
            </Card>

            {/* Sélecteur de points de dépôt */}
            <PickupPointSelector
              serviceId={selectedService.id}
              country={formData.from.country}
              zipCode={formData.from.zip_code}
              selectedPointId={selectedDropoffPoint?.id}
              onSelect={handleDropoffSelect}
              label="Point de dépôt"
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('services')}
                disabled={isLoading}
              >
                Retour aux services
              </Button>
              <Button
                onClick={handleConfirmDropoff}
                disabled={!selectedDropoffPoint || isLoading}
              >
                {isLoading
                  ? 'Création du brouillon...'
                  : 'Confirmer et créer le brouillon'}
              </Button>
            </div>
          </div>
        )}

        {/* Étape 3 : Draft créé - Confirmation avant paiement */}
        {step === 'draft_created' && draftShipment && (
          <div className="space-y-4">
            {/* Success Banner */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">
                  Brouillon créé avec succès
                </h3>
              </div>
              <p className="text-sm text-green-800">
                Référence :{' '}
                <span className="font-mono font-medium">
                  {draftShipment.packlink_draft_reference}
                </span>
              </p>
            </Card>

            {/* Service Details */}
            {selectedService && (
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Détails du service
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Transporteur :
                    </span>
                    <span className="font-medium">
                      {selectedService.carrier_name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service :</span>
                    <span className="font-medium">
                      {selectedService.name || 'Standard'}
                    </span>
                  </div>
                  {selectedService.price && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-muted-foreground font-medium">
                        Prix total :
                      </span>
                      <span className="font-bold text-lg">
                        {selectedService.price.total_price}{' '}
                        {selectedService.price.currency}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Dropoff Point Details (if applicable) */}
            {selectedDropoffPoint && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-900">
                  <MapPin className="h-4 w-4" />
                  Point de dépôt sélectionné
                </h4>
                <div className="space-y-1 text-sm text-blue-900">
                  <div className="font-medium">
                    {selectedDropoffPoint.commerce_name}
                  </div>
                  <div>
                    {selectedDropoffPoint.address}, {selectedDropoffPoint.city}
                  </div>
                  <div>{selectedDropoffPoint.zip}</div>
                </div>
              </Card>
            )}

            {/* Confirmation Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button onClick={handlePay} disabled={isLoading} size="lg">
                {isLoading ? 'Paiement en cours...' : 'Confirmer et payer'}
              </Button>
            </div>
          </div>
        )}

        {/* Étape 4 : Payé */}
        {step === 'paid' && paidOrder && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-green-50 dark:bg-green-950 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  Expédition payée avec succès
                </h3>
              </div>
              <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                {paidOrder.tracking_number && (
                  <div>
                    <span className="font-medium">Suivi :</span>{' '}
                    <span className="font-mono">
                      {paidOrder.tracking_number}
                    </span>
                  </div>
                )}
                {paidOrder.carrier_name && (
                  <div>
                    <span className="font-medium">Transporteur :</span>{' '}
                    {paidOrder.carrier_name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {paidOrder.label_url && (
                <Button onClick={handleDownloadPDF}>
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger le bordereau PDF
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}

        {/* Erreur */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-red-50 dark:bg-red-950 p-4">
              <p className="text-sm text-red-900 dark:text-red-100">
                Une erreur est survenue. Veuillez réessayer.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
