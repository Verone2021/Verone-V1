'use client';

import { useState } from 'react';

import { Card } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Truck,
  Clock,
  Euro,
  Check,
  Home,
  Package as PackageIcon,
  Lock,
} from 'lucide-react';

export interface PacklinkService {
  id: number;
  carrier_name: string;
  service_name: string;
  price: {
    amount: number;
    currency: string;
  };
  delivery_time: {
    min_days: number;
    max_days: number;
  };
  description?: string;
  collection_type?: 'home' | 'dropoff';
  collection_date?: string; // ✅ FIX: Date collecte
  delivery_type?: 'home' | 'locker' | 'dropoff';
  delivery_date?: string; // ✅ FIX: Date livraison
  dropoff?: boolean;
}

interface ServiceSelectorProps {
  services: PacklinkService[];
  selectedServiceId?: number;
  onSelect: (serviceId: number) => void;
  loading?: boolean;
}

export function ServiceSelector({
  services,
  selectedServiceId,
  onSelect,
  loading = false,
}: ServiceSelectorProps) {
  // Helper: Formater date en français (jeu., novembre 13)
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
      };
      return new Intl.DateTimeFormat('fr-FR', options).format(date);
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Sélectionner un service</h3>
        </div>
        <div className="flex justify-center items-center py-8 border rounded-lg">
          <p className="text-muted-foreground">
            Chargement des services disponibles...
          </p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Sélectionner un service</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/20">
          <Truck className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground font-medium mb-1">
            Aucun service disponible
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Vérifiez les informations du destinataire et des colis, puis
            recherchez les services disponibles.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Truck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Sélectionner un service ({services.length})
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map(service => {
          const isSelected = selectedServiceId === service.id;

          return (
            <Card
              key={service.id}
              className={`
                relative p-4 cursor-pointer transition-all hover:shadow-md
                ${isSelected ? 'border-primary border-2 bg-primary/5' : 'border hover:border-primary/50'}
              `}
              onClick={() => onSelect(service.id)}
            >
              {/* Badge sélectionné */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {/* Transporteur */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-muted rounded-md">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {service.carrier_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {service.service_name}
                  </p>
                </div>
              </div>

              {/* Badges Type Collecte/Livraison avec dates */}
              <div className="flex flex-col gap-2 mb-3">
                {/* Badge Collecte */}
                {service.collection_type && (
                  <div className="flex flex-col gap-0.5 p-2 rounded-md bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-1.5 text-blue-700">
                      {service.collection_type === 'home' ? (
                        <>
                          <Home className="h-3.5 w-3.5" />
                          <span className="font-medium text-xs">
                            Collecte à domicile
                          </span>
                        </>
                      ) : (
                        <>
                          <PackageIcon className="h-3.5 w-3.5" />
                          <span className="font-medium text-xs">
                            Dépôt en relais
                          </span>
                        </>
                      )}
                    </div>
                    {service.collection_date && (
                      <span className="text-xs text-blue-600 ml-5">
                        {formatDate(service.collection_date)}
                      </span>
                    )}
                  </div>
                )}

                {/* Badge Livraison */}
                {service.delivery_type && (
                  <div className="flex flex-col gap-0.5 p-2 rounded-md bg-green-50 border border-green-200">
                    <div className="flex items-center gap-1.5 text-green-700">
                      {service.delivery_type === 'home' ? (
                        <>
                          <Home className="h-3.5 w-3.5" />
                          <span className="font-medium text-xs">
                            Livraison à domicile
                          </span>
                        </>
                      ) : service.delivery_type === 'locker' ? (
                        <>
                          <Lock className="h-3.5 w-3.5" />
                          <span className="font-medium text-xs">
                            Livraison en locker
                          </span>
                        </>
                      ) : (
                        <>
                          <PackageIcon className="h-3.5 w-3.5" />
                          <span className="font-medium text-xs">
                            Retrait en relais
                          </span>
                        </>
                      )}
                    </div>
                    {service.delivery_date && (
                      <span className="text-xs text-green-600 ml-5">
                        {formatDate(service.delivery_date)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Détails */}
              <div className="space-y-2">
                {/* Prix */}
                <div className="flex items-center gap-2 text-sm">
                  <Euro className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-primary">
                    {service.price.amount.toFixed(2)} {service.price.currency}
                  </span>
                </div>

                {/* Délai */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    {service.delivery_time.min_days ===
                    service.delivery_time.max_days
                      ? `${service.delivery_time.min_days} jour${service.delivery_time.min_days > 1 ? 's' : ''}`
                      : `${service.delivery_time.min_days}-${service.delivery_time.max_days} jours`}
                  </span>
                </div>
              </div>

              {/* Description optionnelle */}
              {service.description && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  {service.description}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Message si aucun service sélectionné */}
      {!selectedServiceId && services.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Sélectionnez un service pour continuer
        </p>
      )}
    </div>
  );
}
