'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { SalesOrder } from '@/hooks/use-sales-orders'
import { CarrierSelector } from './carrier-selector'
import { ShipmentRecapModal, type ShipmentRecapData, type ShippingMethod } from './shipment-recap-modal'
import { PacklinkShipmentForm } from './packlink-shipment-form'
import { MondialRelayShipmentForm } from './mondial-relay-shipment-form'
import { ChronotruckShipmentForm } from './chronotruck-shipment-form'
import { ManualShipmentForm } from './manual-shipment-form'
import { useShipments } from '@/hooks/use-shipments'

interface ShippingManagerModalProps {
  order: SalesOrder
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

type WorkflowStep = 'select' | 'form' | 'recap'

export function ShippingManagerModal({ order, open, onClose, onSuccess }: ShippingManagerModalProps) {
  // État workflow
  const [step, setStep] = useState<WorkflowStep>('select')
  const [selectedCarrier, setSelectedCarrier] = useState<ShippingMethod | null>(null)
  const [recapData, setRecapData] = useState<ShipmentRecapData | null>(null)

  const {
    loading: shipmentsLoading,
    createPacklinkShipment,
    createManualShipment
  } = useShipments()

  const [finalLoading, setFinalLoading] = useState(false)

  // Reset tout à l'ouverture
  useEffect(() => {
    if (open) {
      setStep('select')
      setSelectedCarrier(null)
      setRecapData(null)
    }
  }, [open])

  // Sélection transporteur
  const handleCarrierSelect = (carrier: ShippingMethod) => {
    setSelectedCarrier(carrier)
    setStep('form')
  }

  // Retour en arrière
  const handleBack = () => {
    if (step === 'recap') {
      setStep('form')
      setRecapData(null)
    } else if (step === 'form') {
      setStep('select')
      setSelectedCarrier(null)
    }
  }

  // Passage au récapitulatif (callback depuis formulaires)
  const handleFormComplete = (data: ShipmentRecapData) => {
    setRecapData(data)
    setStep('recap')
  }

  // Validation finale et enregistrement
  const handleFinalConfirm = async () => {
    if (!recapData || !selectedCarrier) return

    setFinalLoading(true)
    try {
      // Préparer request générique
      const request = {
        salesOrderId: order.id,
        shippingMethod: selectedCarrier,
        parcels: recapData.parcels.map(p => ({
          weight_kg: p.weight_kg,
          length_cm: p.length_cm || 0,
          width_cm: p.width_cm || 0,
          height_cm: p.height_cm || 0,
          items: [] // TODO: affectation produits si besoin
        })),
        costPaid: recapData.costPaid,
        costCharged: recapData.costCharged,
        carrierName: recapData.carrierName,
        tracking: recapData.trackingNumber,
        notes: recapData.notes,
        metadata: recapData.metadata
      }

      let result

      if (selectedCarrier === 'packlink') {
        result = await createPacklinkShipment(request)
        if (result.success && result.labelUrl) {
          window.open(result.labelUrl, '_blank')
        }
      } else {
        // Mondial Relay, Chronotruck, Manual utilisent createManualShipment
        // TODO: Créer createMondialRelayShipment et createChronotruckShipment spécifiques
        result = await createManualShipment(request)
      }

      if (result.success) {
        onSuccess?.()
        onClose()
      }
    } catch (error) {
      console.error('Erreur création expédition:', error)
    } finally {
      setFinalLoading(false)
    }
  }

  // Rendu selon l'étape
  const renderContent = () => {
    // Étape 1: Sélection transporteur
    if (step === 'select') {
      return (
        <div className="space-y-6">
          <CarrierSelector
            selected={selectedCarrier}
            onSelect={handleCarrierSelect}
          />
        </div>
      )
    }

    // Étape 2: Formulaire spécifique transporteur
    if (step === 'form' && selectedCarrier) {
      switch (selectedCarrier) {
        case 'packlink':
          return (
            <PacklinkShipmentForm
              order={order}
              onComplete={handleFormComplete}
              onBack={handleBack}
            />
          )

        case 'mondial_relay':
          return (
            <MondialRelayShipmentForm
              order={order}
              onComplete={handleFormComplete}
              onBack={handleBack}
            />
          )

        case 'chronotruck':
          return (
            <ChronotruckShipmentForm
              order={order}
              onComplete={handleFormComplete}
              onBack={handleBack}
            />
          )

        case 'manual':
          return (
            <ManualShipmentForm
              order={order}
              onComplete={handleFormComplete}
              onBack={handleBack}
            />
          )

        default:
          return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-semibold">
                ❌ Transporteur non supporté : {selectedCarrier}
              </p>
            </div>
          )
      }
    }

    return null
  }

  const getCarrierName = (): string => {
    switch (selectedCarrier) {
      case 'packlink':
        return 'Packlink PRO'
      case 'mondial_relay':
        return 'Mondial Relay'
      case 'chronotruck':
        return 'Chronotruck'
      case 'manual':
        return 'Saisie manuelle'
      default:
        return ''
    }
  }

  return (
    <>
      {/* Modal principal (étapes select + form) */}
      <Dialog open={open && step !== 'recap'} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">
                  Gérer l'expédition
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Commande {order.order_number}
                  {step === 'form' && selectedCarrier && (
                    <span className="ml-2 text-gray-800 font-medium">
                      • {getCarrierName()}
                    </span>
                  )}
                </p>
              </div>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </ButtonV2>
            </div>
          </DialogHeader>

          <div className="mt-6">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal récapitulatif (étape recap) */}
      {recapData && (
        <ShipmentRecapModal
          open={step === 'recap'}
          data={recapData}
          onConfirm={handleFinalConfirm}
          onBack={handleBack}
          loading={finalLoading}
        />
      )}
    </>
  )
}
