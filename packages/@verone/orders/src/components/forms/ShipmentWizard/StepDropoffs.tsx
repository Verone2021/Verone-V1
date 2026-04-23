'use client';

import type { ShipmentItem } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  MapPin,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Store,
  Home,
  CheckCircle2,
} from 'lucide-react';

import type { PacklinkService, PackageInfo, DropoffPoint } from './types';
import { WizardSummaryPanel } from './WizardSummaryPanel';
import type { SalesOrderForShipment } from '@verone/orders/hooks';

interface StepDropoffsProps {
  salesOrder: SalesOrderForShipment;
  packages: PackageInfo[];
  items: ShipmentItem[];
  contentDescription: string;
  declaredValue: number;
  wantsInsurance: boolean | null;
  selectedService: PacklinkService;
  destinationZip: string;
  senderDropoffs: DropoffPoint[];
  selectedSenderDropoff: string | null;
  setSelectedSenderDropoff: (id: string | null) => void;
  loadingSenderDropoffs: boolean;
  receiverDropoffs: DropoffPoint[];
  selectedReceiverDropoff: string | null;
  setSelectedReceiverDropoff: (id: string | null) => void;
  loadingReceiverDropoffs: boolean;
  collectionDate: string;
  setCollectionDate: (v: string) => void;
  collectionTime: string;
  setCollectionTime: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function StepDropoffs({
  salesOrder,
  packages,
  items,
  contentDescription,
  declaredValue,
  wantsInsurance,
  selectedService,
  destinationZip,
  senderDropoffs,
  selectedSenderDropoff,
  setSelectedSenderDropoff,
  loadingSenderDropoffs,
  receiverDropoffs,
  selectedReceiverDropoff,
  setSelectedReceiverDropoff,
  loadingReceiverDropoffs,
  collectionDate,
  setCollectionDate,
  collectionTime,
  setCollectionTime,
  onBack,
  onNext,
}: StepDropoffsProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {selectedService.delivery_to_parcelshop
            ? 'Points relais & date de depot'
            : 'Date de collecte'}
        </h3>

        {/* Collection/depot date — ALWAYS required by Packlink */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {selectedService.delivery_to_parcelshop
              ? 'Choisissez la date a laquelle vous deposerez le colis au relais.'
              : 'Le coursier viendra recuperer le colis a votre adresse. Choisissez la date et l heure de collecte.'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">Date de collecte</Label>
              <Input
                type="date"
                value={collectionDate}
                min={
                  new Date(Date.now() + 86400000).toISOString().split('T')[0]
                }
                onChange={e => setCollectionDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Heure de collecte</Label>
              <Input
                type="time"
                value={collectionTime}
                onChange={e => setCollectionTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="border rounded-lg p-3 bg-blue-50 text-sm text-blue-700">
            {collectionDate ? (
              <>
                Collecte prevue le{' '}
                {new Date(collectionDate + 'T00:00').toLocaleDateString(
                  'fr-FR',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  }
                )}{' '}
                a {collectionTime}
              </>
            ) : (
              'Veuillez selectionner une date de collecte'
            )}
          </div>
        </div>

        {/* SENDER dropoff (depot) — only for relay services */}
        {selectedService.delivery_to_parcelshop && (
          <div>
            <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
              <Store className="h-3.5 w-3.5" />
              Relais de depot (expediteur — Massy 91300)
            </h4>
            {loadingSenderDropoffs && (
              <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            )}
            {!loadingSenderDropoffs && senderDropoffs.length > 0 && (
              <div className="max-h-[180px] overflow-y-auto space-y-1">
                {senderDropoffs.map(dp => {
                  const isSelected = selectedSenderDropoff === dp.id;
                  return (
                    <button
                      key={dp.id}
                      type="button"
                      onClick={() => setSelectedSenderDropoff(dp.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors text-sm ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">
                            {dp.commerce_name}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            — {dp.address}, {dp.zip} {dp.city}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!loadingSenderDropoffs && senderDropoffs.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                Aucun point relais de depot disponible.
              </p>
            )}
          </div>
        )}

        {/* RECEIVER dropoff (retrait) — only for parcelshop delivery */}
        {selectedService.delivery_to_parcelshop && !loadingSenderDropoffs && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              Relais de retrait (destinataire — {destinationZip})
            </h4>
            {loadingReceiverDropoffs && (
              <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </div>
            )}
            {!loadingReceiverDropoffs && receiverDropoffs.length > 0 && (
              <div className="max-h-[180px] overflow-y-auto space-y-1">
                {receiverDropoffs.map(dp => {
                  const isSelected = selectedReceiverDropoff === dp.id;
                  return (
                    <button
                      key={dp.id}
                      type="button"
                      onClick={() => setSelectedReceiverDropoff(dp.id)}
                      className={`w-full text-left p-2.5 rounded-lg border transition-colors text-sm ${
                        isSelected
                          ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                          : 'border-border hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium">
                            {dp.commerce_name}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            — {dp.address}, {dp.zip} {dp.city}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!loadingReceiverDropoffs && receiverDropoffs.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">
                Aucun point relais de retrait disponible.
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between">
          <ButtonV2 variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </ButtonV2>
          <ButtonV2
            onClick={onNext}
            disabled={
              !collectionDate ||
              !collectionTime ||
              (selectedService.delivery_to_parcelshop &&
                (!selectedSenderDropoff || !selectedReceiverDropoff))
            }
          >
            Suivant
            <ArrowRight className="h-4 w-4 ml-1" />
          </ButtonV2>
        </div>
      </div>

      {/* Summary panel */}
      <WizardSummaryPanel
        salesOrder={salesOrder}
        packages={packages}
        items={items}
        contentDescription={contentDescription}
        declaredValue={declaredValue}
        selectedService={selectedService}
        wantsInsurance={wantsInsurance}
      />
    </div>
  );
}
