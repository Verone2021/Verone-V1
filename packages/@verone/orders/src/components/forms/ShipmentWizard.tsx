'use client';

/**
 * ShipmentWizard — Modal expedition multi-etapes
 *
 * Etape 1 : Selection stock (produits + quantites)
 * Etape 2 : Mode de livraison (retrait / main propre / manuel / Packlink)
 * Etape 3 : Infos colis (Packlink — dimensions, poids, adresses)
 * Etape 4 : Choix transporteur (Packlink — services + prix)
 * Etape 5 : Points relais (Packlink — si service relais)
 * Etape 6 : Resume + confirmation (Packlink)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

import { ProductThumbnail } from '@verone/products';
import type { ShipmentItem } from '@verone/types';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  Package,
  CheckCircle2,
  Truck,
  AlertTriangle,
  MapPin,
  HandMetal,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Clock,
  Download,
} from 'lucide-react';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

// ── Types ──────────────────────────────────────────────────────

type DeliveryMethod = 'pickup' | 'hand_delivery' | 'manual' | 'packlink';

interface PacklinkService {
  id: number;
  name: string;
  carrier_name: string;
  price: { total_price: number; currency: string };
  transit_hours: string;
  delivery_to_parcelshop: boolean;
  first_estimated_delivery_date: string;
  dropoff: boolean;
}

interface PackageInfo {
  weight: number;
  width: number;
  height: number;
  length: number;
}

interface ShipmentWizardProps {
  salesOrder: SalesOrderForShipment;
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Component ──────────────────────────────────────────────────

export function ShipmentWizard({
  salesOrder,
  onSuccess,
  onCancel,
}: ShipmentWizardProps) {
  const supabase = createClient();
  const { prepareShipmentItems, validateShipment, validating } =
    useSalesShipments();

  // Wizard state
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod | null>(
    null
  );

  // Manual shipment fields
  const [manualCarrier, setManualCarrier] = useState('');
  const [manualTracking, setManualTracking] = useState('');
  const [notes, setNotes] = useState('');

  // Packlink fields
  const [packages, setPackages] = useState<PackageInfo[]>([
    { weight: 5, width: 30, height: 30, length: 30 },
  ]);
  const [services, setServices] = useState<PacklinkService[]>([]);
  const [selectedService, setSelectedService] =
    useState<PacklinkService | null>(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // Packlink result
  const [shipmentResult, setShipmentResult] = useState<{
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
  } | null>(null);
  const [creating, setCreating] = useState(false);

  // Init items
  useEffect(() => {
    setItems(prepareShipmentItems(salesOrder));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesOrder]);

  // Totals
  const totals = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + (i.quantity_to_ship ?? 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + (i.quantity_to_ship ?? 0) * i.unit_price_ht,
      0
    );
    const hasStockIssue = items.some(
      i => (i.quantity_to_ship ?? 0) > i.stock_available
    );
    return { totalQty, totalValue, hasStockIssue };
  }, [items]);

  // Destination zip from shipping_address
  const destinationZip = useMemo(() => {
    const addr = salesOrder.shipping_address as Record<string, string> | null;
    return addr?.postal_code ?? addr?.zip ?? '';
  }, [salesOrder.shipping_address]);

  // Handlers
  const handleQuantityChange = (itemId: string, value: string) => {
    const num = parseInt(value) ?? 0;
    setItems(prev =>
      prev.map(i =>
        i.sales_order_item_id === itemId
          ? {
              ...i,
              quantity_to_ship: Math.max(
                0,
                Math.min(num, i.quantity_remaining)
              ),
            }
          : i
      )
    );
  };

  const handleShipAll = () => {
    setItems(prev =>
      prev.map(i => ({
        ...i,
        quantity_to_ship: Math.min(i.quantity_remaining, i.stock_available),
      }))
    );
  };

  // Fetch Packlink services
  const fetchServices = useCallback(async () => {
    if (!destinationZip) return;
    setLoadingServices(true);
    setServicesError(null);
    try {
      const res = await fetch('/api/packlink/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toCountry: 'FR',
          toZip: destinationZip,
          packages,
        }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = (await res.json()) as { services: PacklinkService[] };
      setServices(data.services ?? []);
    } catch (err) {
      setServicesError(err instanceof Error ? err.message : 'Erreur Packlink');
    }
    setLoadingServices(false);
  }, [destinationZip, packages]);

  // Validate shipment (simple modes)
  const handleSimpleValidation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return;

    const itemsToShip = items
      .filter(i => (i.quantity_to_ship ?? 0) > 0)
      .map(i => ({
        sales_order_item_id: i.sales_order_item_id,
        product_id: i.product_id,
        quantity_to_ship: i.quantity_to_ship ?? 0,
      }));

    if (itemsToShip.length === 0) return;

    const result = await validateShipment({
      sales_order_id: salesOrder.id,
      items: itemsToShip,
      shipped_at: new Date().toISOString(),
      tracking_number: manualTracking || undefined,
      notes: notes || undefined,
      shipped_by: user.id,
    });

    if (result.success) onSuccess();
  };

  // Create Packlink shipment
  const handlePacklinkCreate = async () => {
    if (!selectedService) return;
    setCreating(true);

    const addr = salesOrder.shipping_address as Record<string, string> | null;
    const customerName =
      ((salesOrder as Record<string, unknown>).customer_name as string) ?? '';
    const nameParts = customerName.split(' ');

    try {
      const res = await fetch('/api/packlink/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          destination: {
            name: nameParts[0] ?? 'Client',
            surname: nameParts.slice(1).join(' ') ?? '',
            email:
              (salesOrder as Record<string, unknown>).customer_email ??
              'client@verone.fr',
            phone: '+33600000000',
            street1: addr?.line1 ?? '',
            city: addr?.city ?? '',
            zip_code: addr?.postal_code ?? '',
            country: addr?.country ?? 'FR',
          },
          packages,
          content: items
            .filter(i => (i.quantity_to_ship ?? 0) > 0)
            .map(i => i.product_name)
            .join(', '),
          contentValue: totals.totalValue,
          orderReference: salesOrder.order_number ?? salesOrder.id.slice(0, 8),
        }),
      });

      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = (await res.json()) as {
        success: boolean;
        trackingNumber: string | null;
        labelUrl: string | null;
        carrierName: string | null;
      };

      if (data.success) {
        setShipmentResult(data);

        // Now validate the shipment in our system
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.id) {
          const itemsToShip = items
            .filter(i => (i.quantity_to_ship ?? 0) > 0)
            .map(i => ({
              sales_order_item_id: i.sales_order_item_id,
              product_id: i.product_id,
              quantity_to_ship: i.quantity_to_ship ?? 0,
            }));

          await validateShipment({
            sales_order_id: salesOrder.id,
            items: itemsToShip,
            shipped_at: new Date().toISOString(),
            tracking_number: data.trackingNumber ?? undefined,
            notes: `Packlink: ${selectedService.carrier_name} - ${selectedService.name}`,
            shipped_by: user.id,
          });
        }

        setStep(7); // Success step
      }
    } catch (err) {
      setServicesError(err instanceof Error ? err.message : 'Erreur creation');
    }
    setCreating(false);
  };

  const formatTransit = (hours: string) => {
    const h = parseInt(hours, 10);
    if (h <= 24) return '1 jour';
    if (h <= 48) return '2 jours';
    return `${Math.ceil(h / 24)} jours`;
  };

  // ── STEPS ──────────────────────────────────────────────────

  const stepLabels = [
    'Stock',
    'Mode',
    'Colis',
    'Transport',
    'Relais',
    'Resume',
  ];
  const maxStep = deliveryMethod === 'packlink' ? 6 : 2;

  return (
    <div className="space-y-4">
      {/* Stepper */}
      {step <= 6 && (
        <div className="flex items-center gap-1 mb-4">
          {stepLabels.slice(0, maxStep).map((label, i) => (
            <div key={label} className="flex items-center">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  i + 1 === step
                    ? 'bg-blue-100 text-blue-800'
                    : i + 1 < step
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i + 1 < step ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <span>{i + 1}</span>
                )}
                {label}
              </div>
              {i < maxStep - 1 && (
                <ArrowRight className="h-3 w-3 text-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* STEP 1: Stock selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles a expedier
            </h3>
            <ButtonV2 variant="outline" size="sm" onClick={handleShipAll}>
              Tout expedier
            </ButtonV2>
          </div>

          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-center">Commande</TableHead>
                  <TableHead className="text-center">Deja exp.</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">A expedier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.sales_order_item_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProductThumbnail
                          productId={item.product_id}
                          size="sm"
                        />
                        <div>
                          <p className="font-medium text-sm">
                            {item.product_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.product_sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity_ordered}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity_already_shipped}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          item.stock_available < item.quantity_remaining
                            ? 'text-red-600 font-medium'
                            : ''
                        }
                      >
                        {item.stock_available}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min={0}
                        max={item.quantity_remaining}
                        value={item.quantity_to_ship ?? 0}
                        onChange={e =>
                          handleQuantityChange(
                            item.sales_order_item_id,
                            e.target.value
                          )
                        }
                        className="w-16 h-8 text-center mx-auto"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {totals.hasStockIssue && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              Stock insuffisant pour certains articles
            </div>
          )}

          <div className="flex justify-between">
            <ButtonV2 variant="outline" onClick={onCancel}>
              Annuler
            </ButtonV2>
            <ButtonV2
              onClick={() => setStep(2)}
              disabled={totals.totalQty === 0}
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-1" />
            </ButtonV2>
          </div>
        </div>
      )}

      {/* STEP 2: Delivery method */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Mode de livraison
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              {
                id: 'pickup' as const,
                label: 'Retrait client',
                desc: "Le client vient chercher a l'entrepot",
                icon: MapPin,
              },
              {
                id: 'hand_delivery' as const,
                label: 'Main propre',
                desc: 'Remise en main propre au client',
                icon: HandMetal,
              },
              {
                id: 'manual' as const,
                label: 'Expedition manuelle',
                desc: 'Autre transporteur (saisie manuelle)',
                icon: Package,
              },
              {
                id: 'packlink' as const,
                label: 'Packlink PRO',
                desc: 'Multi-transporteurs, meilleur prix auto',
                icon: Truck,
                recommended: true,
              },
            ].map(opt => {
              const Icon = opt.icon;
              const isSelected = deliveryMethod === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDeliveryMethod(opt.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{opt.label}</span>
                    {'recommended' in opt && opt.recommended && (
                      <Badge className="bg-green-100 text-green-700 text-xs">
                        Recommande
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          {/* Manual mode: extra fields */}
          {deliveryMethod === 'manual' && (
            <div className="space-y-3 border-t pt-3">
              <div>
                <Label>Transporteur</Label>
                <Input
                  value={manualCarrier}
                  onChange={e => setManualCarrier(e.target.value)}
                  placeholder="Ex: Colissimo, DHL..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Numero de suivi (optionnel)</Label>
                <Input
                  value={manualTracking}
                  onChange={e => setManualTracking(e.target.value)}
                  placeholder="Ex: 1Z999AA10123456784"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes..."
                  className="mt-1"
                  rows={2}
                />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <ButtonV2 variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </ButtonV2>
            <div className="flex gap-2">
              {(deliveryMethod === 'pickup' ||
                deliveryMethod === 'hand_delivery' ||
                deliveryMethod === 'manual') && (
                <ButtonV2
                  onClick={() => {
                    void handleSimpleValidation().catch(console.error);
                  }}
                  disabled={!deliveryMethod || validating}
                >
                  {validating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Valider expedition
                </ButtonV2>
              )}
              {deliveryMethod === 'packlink' && (
                <ButtonV2 onClick={() => setStep(3)}>
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-1" />
                </ButtonV2>
              )}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Package info (Packlink) */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Package className="h-4 w-4" />
            Informations colis
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">
                Expediteur
              </Label>
              <p className="text-sm font-medium mt-1">Verone Collections</p>
              <p className="text-xs text-muted-foreground">
                4 rue du Perou, 91300 Massy
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">
                Destinataire
              </Label>
              <p className="text-sm font-medium mt-1">
                {((salesOrder as Record<string, unknown>)
                  .customer_name as string) ?? 'Client'}
              </p>
              <p className="text-xs text-muted-foreground">
                {(() => {
                  const a = salesOrder.shipping_address as Record<
                    string,
                    string
                  > | null;
                  return a
                    ? `${a.line1 ?? ''}, ${a.postal_code ?? ''} ${a.city ?? ''}`
                    : '';
                })()}
              </p>
            </div>
          </div>

          <div>
            <Label>Dimensions et poids du colis</Label>
            {packages.map((pkg, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 mt-2">
                <div>
                  <Label className="text-xs">Longueur (cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.length}
                    onChange={e =>
                      setPackages(prev =>
                        prev.map((p, i) =>
                          i === idx
                            ? { ...p, length: parseFloat(e.target.value) ?? 0 }
                            : p
                        )
                      )
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Largeur (cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.width}
                    onChange={e =>
                      setPackages(prev =>
                        prev.map((p, i) =>
                          i === idx
                            ? { ...p, width: parseFloat(e.target.value) ?? 0 }
                            : p
                        )
                      )
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Hauteur (cm)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pkg.height}
                    onChange={e =>
                      setPackages(prev =>
                        prev.map((p, i) =>
                          i === idx
                            ? { ...p, height: parseFloat(e.target.value) ?? 0 }
                            : p
                        )
                      )
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs">Poids (kg)</Label>
                  <Input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={pkg.weight}
                    onChange={e =>
                      setPackages(prev =>
                        prev.map((p, i) =>
                          i === idx
                            ? { ...p, weight: parseFloat(e.target.value) ?? 0 }
                            : p
                        )
                      )
                    }
                    className="h-8"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <ButtonV2 variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void fetchServices()
                  .then(() => setStep(4))
                  .catch(console.error);
              }}
            >
              Rechercher les transporteurs
              <ArrowRight className="h-4 w-4 ml-1" />
            </ButtonV2>
          </div>
        </div>
      )}

      {/* STEP 4: Carrier selection (Packlink) */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Choix du transporteur
          </h3>

          {loadingServices && (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
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

          {!loadingServices && services.length > 0 && (
            <div className="max-h-[350px] overflow-y-auto space-y-2">
              {services.map(service => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {service.carrier_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {service.name}
                        </span>
                      </div>
                      <span className="font-bold text-sm">
                        {service.price.total_price.toFixed(2)} EUR
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTransit(service.transit_hours)}
                      </span>
                      {service.delivery_to_parcelshop ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Point relais
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Domicile
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between">
            <ButtonV2 variant="outline" onClick={() => setStep(3)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </ButtonV2>
            <ButtonV2 onClick={() => setStep(6)} disabled={!selectedService}>
              Suivant
              <ArrowRight className="h-4 w-4 ml-1" />
            </ButtonV2>
          </div>
        </div>
      )}

      {/* STEP 6: Summary + Confirmation (Packlink) */}
      {step === 6 && selectedService && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Resume expedition
          </h3>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">
                Transporteur
              </Label>
              <p className="font-medium">
                {selectedService.carrier_name} — {selectedService.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatTransit(selectedService.transit_hours)} •{' '}
                {selectedService.delivery_to_parcelshop
                  ? 'Point relais'
                  : 'Domicile'}
              </p>
            </div>

            <div className="border rounded-lg p-3">
              <Label className="text-xs text-muted-foreground">Articles</Label>
              {items
                .filter(i => (i.quantity_to_ship ?? 0) > 0)
                .map(i => (
                  <p key={i.sales_order_item_id} className="text-sm">
                    {i.product_name} x{i.quantity_to_ship}
                  </p>
                ))}
            </div>

            <div className="border rounded-lg p-3 bg-blue-50">
              <div className="flex justify-between items-center">
                <span className="font-medium">Cout expedition</span>
                <span className="font-bold text-lg">
                  {selectedService.price.total_price.toFixed(2)} EUR
                </span>
              </div>
            </div>
          </div>

          {servicesError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4" />
              {servicesError}
            </div>
          )}

          <div className="flex justify-between">
            <ButtonV2 variant="outline" onClick={() => setStep(4)}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </ButtonV2>
            <ButtonV2
              onClick={() => {
                void handlePacklinkCreate().catch(console.error);
              }}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Confirmer expedition
            </ButtonV2>
          </div>
        </div>
      )}

      {/* STEP 7: Success */}
      {step === 7 && shipmentResult && (
        <div className="text-center space-y-4 py-6">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="font-bold text-lg">Expedition creee</h3>

          {shipmentResult.trackingNumber && (
            <div className="border rounded-lg p-3 inline-block">
              <Label className="text-xs text-muted-foreground">
                Numero de suivi
              </Label>
              <p className="font-mono font-medium">
                {shipmentResult.trackingNumber}
              </p>
            </div>
          )}

          {shipmentResult.labelUrl && (
            <div>
              <ButtonV2
                variant="outline"
                onClick={() =>
                  window.open(shipmentResult.labelUrl ?? '', '_blank')
                }
              >
                <Download className="h-4 w-4 mr-1" />
                Telecharger etiquette
              </ButtonV2>
            </div>
          )}

          <ButtonV2 onClick={onSuccess}>Fermer</ButtonV2>
        </div>
      )}
    </div>
  );
}
