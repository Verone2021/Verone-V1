'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package,
  Truck,
  MapPin,
  DollarSign,
  Calendar,
  FileText,
  ArrowLeft,
  Check,
} from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

export type ShippingMethod =
  | 'packlink'
  | 'mondial_relay'
  | 'chronotruck'
  | 'manual';
export type ShipmentType = 'parcel' | 'pallet';

export interface ShipmentRecapData {
  // Identifiants
  orderId: string;
  orderNumber: string;

  // Transporteur
  shippingMethod: ShippingMethod;
  carrierName?: string;
  serviceName?: string;

  // Type expédition
  shipmentType: ShipmentType;

  // Tracking
  trackingNumber?: string;
  trackingUrl?: string;

  // Colis/Palettes
  parcels: {
    number: number;
    type: ShipmentType;
    weight_kg: number;
    length_cm?: number;
    width_cm?: number;
    height_cm?: number;
  }[];

  // Coûts
  costPaid: number;
  costCharged: number;

  // Dates
  estimatedDelivery?: Date;

  // Notes
  notes?: string;

  // Métadonnées spécifiques transporteur
  metadata?: {
    // Packlink
    packlink_label_url?: string;
    packlink_service_id?: number;

    // Mondial Relay
    relay_point_id?: string;
    relay_point_name?: string;
    relay_point_address?: string;

    // Chronotruck
    chronotruck_reference?: string;
    chronotruck_palette_count?: number;
    chronotruck_url?: string;
  };
}

interface ShipmentRecapModalProps {
  open: boolean;
  data: ShipmentRecapData;
  onConfirm: () => void | Promise<void>;
  onBack: () => void;
  loading?: boolean;
}

const SHIPPING_METHOD_LABELS: Record<
  ShippingMethod,
  { name: string; icon: typeof Truck }
> = {
  packlink: { name: 'Packlink PRO', icon: Truck },
  mondial_relay: { name: 'Mondial Relay', icon: MapPin },
  chronotruck: { name: 'Chronotruck', icon: Package },
  manual: { name: 'Saisie manuelle', icon: FileText },
};

const SHIPMENT_TYPE_LABELS: Record<ShipmentType, string> = {
  parcel: 'Colis',
  pallet: 'Palette',
};

export function ShipmentRecapModal({
  open,
  data,
  onConfirm,
  onBack,
  loading,
}: ShipmentRecapModalProps) {
  const methodInfo = SHIPPING_METHOD_LABELS[data.shippingMethod];
  const margin = data.costCharged - data.costPaid;
  const totalWeight = data.parcels.reduce((sum, p) => sum + p.weight_kg, 0);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Récapitulatif Expédition
          </DialogTitle>
          <p className="text-sm text-gray-600">Commande {data.orderNumber}</p>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {/* Transporteur */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <methodInfo.icon className="h-5 w-5 text-gray-700" />
                <h3 className="font-semibold text-lg">Transporteur</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Méthode d'expédition</p>
                  <p className="font-medium">{methodInfo.name}</p>
                </div>

                {data.carrierName && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Transporteur effectif
                    </p>
                    <p className="font-medium">{data.carrierName}</p>
                  </div>
                )}

                {data.serviceName && (
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium">{data.serviceName}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <Badge variant="outline" className="font-medium">
                    {SHIPMENT_TYPE_LABELS[data.shipmentType]}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking */}
          {data.trackingNumber && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="h-5 w-5 text-gray-700" />
                  <h3 className="font-semibold text-lg">Suivi</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro de suivi</p>
                    <p className="font-medium font-mono">
                      {data.trackingNumber}
                    </p>
                  </div>

                  {data.trackingUrl && (
                    <div>
                      <p className="text-sm text-gray-600">Lien de suivi</p>
                      <a
                        href={data.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Suivre l'expédition →
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Colis/Palettes */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-gray-700" />
                <h3 className="font-semibold text-lg">
                  {data.shipmentType === 'parcel' ? 'Colis' : 'Palettes'} (
                  {data.parcels.length})
                </h3>
              </div>

              <div className="space-y-3">
                {data.parcels.map((parcel, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-gray-300">
                        <span className="font-semibold text-sm">{idx + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {SHIPMENT_TYPE_LABELS[parcel.type]} #{idx + 1}
                        </p>
                        {parcel.length_cm &&
                        parcel.width_cm &&
                        parcel.height_cm ? (
                          <p className="text-sm text-gray-600">
                            {parcel.length_cm} × {parcel.width_cm} ×{' '}
                            {parcel.height_cm} cm
                          </p>
                        ) : data.shipmentType === 'pallet' ? (
                          <p className="text-sm text-gray-600">
                            Palette standard 120 × 80 cm
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{parcel.weight_kg} kg</p>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Poids total</span>
                    <span className="font-semibold">
                      {totalWeight.toFixed(2)} kg
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coûts */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="h-5 w-5 text-gray-700" />
                <h3 className="font-semibold text-lg">Coûts</h3>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Coût réel payé</span>
                  <span className="font-medium">
                    {data.costPaid.toFixed(2)} €
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Montant facturé client</span>
                  <span className="font-medium">
                    {data.costCharged.toFixed(2)} €
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Marge</span>
                  <span
                    className={`font-semibold ${
                      margin > 0
                        ? 'text-green-600'
                        : margin < 0
                          ? 'text-red-600'
                          : 'text-gray-900'
                    }`}
                  >
                    {margin > 0 ? '+' : ''}
                    {margin.toFixed(2)} €
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dates */}
          {data.estimatedDelivery && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="h-5 w-5 text-gray-700" />
                  <h3 className="font-semibold text-lg">Livraison estimée</h3>
                </div>

                <p className="font-medium">
                  {format(data.estimatedDelivery, 'EEEE d MMMM yyyy', {
                    locale: fr,
                  })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Informations spécifiques Mondial Relay */}
          {data.shippingMethod === 'mondial_relay' &&
            data.metadata?.relay_point_name && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-gray-700" />
                    <h3 className="font-semibold text-lg">Point Relais</h3>
                  </div>

                  <div className="space-y-2">
                    <p className="font-medium">
                      {data.metadata.relay_point_name}
                    </p>
                    {data.metadata.relay_point_address && (
                      <p className="text-sm text-gray-600">
                        {data.metadata.relay_point_address}
                      </p>
                    )}
                    {data.metadata.relay_point_id && (
                      <p className="text-xs text-gray-500">
                        ID: {data.metadata.relay_point_id}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Informations spécifiques Chronotruck */}
          {data.shippingMethod === 'chronotruck' &&
            data.metadata?.chronotruck_reference && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Truck className="h-5 w-5 text-gray-700" />
                    <h3 className="font-semibold text-lg">Chronotruck</h3>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Référence</p>
                      <p className="font-medium font-mono">
                        {data.metadata.chronotruck_reference}
                      </p>
                    </div>

                    {data.metadata.chronotruck_palette_count && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Nombre de palettes
                        </p>
                        <p className="font-medium">
                          {data.metadata.chronotruck_palette_count}
                        </p>
                      </div>
                    )}

                    {data.metadata.chronotruck_url && (
                      <div>
                        <a
                          href={data.metadata.chronotruck_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Voir sur Chronotruck →
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Notes */}
          {data.notes && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="h-5 w-5 text-gray-700" />
                  <h3 className="font-semibold text-lg">Notes</h3>
                </div>

                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {data.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3 pt-6 border-t mt-6">
          <ButtonV2 variant="outline" onClick={onBack} disabled={loading}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </ButtonV2>

          <ButtonV2
            onClick={onConfirm}
            disabled={loading}
            size="lg"
            className="min-w-[200px]"
          >
            {loading ? (
              'Enregistrement...'
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Valider l'expédition
              </>
            )}
          </ButtonV2>
        </div>
      </DialogContent>
    </Dialog>
  );
}
