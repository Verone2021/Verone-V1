'use client';

import type { ShipmentItem } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import {
  Truck,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  Store,
  Home,
  MapPin,
  ChevronDown,
} from 'lucide-react';

import type { PacklinkService, PackageInfo, SortOption } from './types';
import { WizardSummaryPanel } from './WizardSummaryPanel';
import type { SalesOrderForShipment } from '@verone/orders/hooks';

interface StepCarrierSelectionProps {
  salesOrder: SalesOrderForShipment;
  packages: PackageInfo[];
  items: ShipmentItem[];
  contentDescription: string;
  declaredValue: number;
  wantsInsurance: boolean;
  services: PacklinkService[];
  sortedServices: PacklinkService[];
  selectedService: PacklinkService | null;
  setSelectedService: (service: PacklinkService | null) => void;
  loadingServices: boolean;
  servicesError: string | null;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  formatTransitLabel: (hours: string) => string;
  formatEstimatedDate: (dateStr: string) => string;
  onBack: () => void;
  onNext: () => void;
  fetchDropoffs: () => Promise<void>;
}

export function StepCarrierSelection({
  salesOrder,
  packages,
  items,
  contentDescription,
  declaredValue,
  wantsInsurance,
  services,
  sortedServices,
  selectedService,
  setSelectedService,
  loadingServices,
  servicesError,
  sortOption,
  setSortOption,
  formatTransitLabel,
  formatEstimatedDate,
  onBack,
  onNext,
  fetchDropoffs,
}: StepCarrierSelectionProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Choix du transporteur
          </h3>

          {/* Sort dropdown */}
          {services.length > 0 && (
            <div className="relative">
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as SortOption)}
                className="appearance-none text-xs border border-border rounded px-3 py-1.5 pr-7 bg-background cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="default">Par défaut</option>
                <option value="price_asc">Prix croissant</option>
                <option value="transit_asc">Délai croissant</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        {loadingServices && (
          <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Recherche des meilleurs tarifs...
          </div>
        )}

        {servicesError && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            {servicesError}
          </div>
        )}

        {!loadingServices && sortedServices.length > 0 && (
          <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
            {sortedServices.map(service => {
              const isSelected = selectedService?.id === service.id;
              const transitLabel = formatTransitLabel(service.transit_hours);
              const estimatedDate = formatEstimatedDate(
                service.first_estimated_delivery_date
              );

              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => setSelectedService(service)}
                  className={`w-full text-left rounded-lg border transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-0 p-3">
                    {/* Transit badge */}
                    <div className="flex-shrink-0 mr-3">
                      <span className="inline-flex items-center justify-center bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded min-w-[70px] text-center leading-tight">
                        {transitLabel}
                      </span>
                    </div>

                    {/* Carrier + service name */}
                    <div className="flex-shrink-0 mr-4 min-w-[120px]">
                      <p className="font-bold text-sm">
                        {service.carrier_name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-tight">
                        {service.name}
                      </p>
                    </div>

                    {/* Delivery mode info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {service.dropoff ? (
                          <>
                            <Store className="h-3 w-3" />
                            <span>Dépôt en Relais</span>
                          </>
                        ) : (
                          <>
                            <Home className="h-3 w-3" />
                            <span>Collecte à domicile</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {service.delivery_to_parcelshop ? (
                          <>
                            <MapPin className="h-3 w-3" />
                            <span>Retrait en Relais</span>
                          </>
                        ) : (
                          <>
                            <Home className="h-3 w-3" />
                            <span>Livraison à Domicile</span>
                          </>
                        )}
                        {estimatedDate && (
                          <span className="ml-1 text-muted-foreground/70">
                            · {estimatedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2 ml-3">
                      <span className="font-bold text-base">
                        {service.price.total_price.toFixed(2)} €
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isSelected ? 'Sélectionné' : 'Réserver'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {!loadingServices && services.length === 0 && !servicesError && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
            <Clock className="h-4 w-4" />
            Aucun service disponible pour cette destination.
          </div>
        )}

        <div className="flex justify-between">
          <ButtonV2 variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </ButtonV2>
          <ButtonV2
            onClick={() => {
              if (selectedService?.delivery_to_parcelshop) {
                void fetchDropoffs().catch(console.error);
              }
              onNext();
            }}
            disabled={!selectedService}
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
