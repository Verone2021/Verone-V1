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
import { formatCurrency } from '@verone/utils';
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
  Plus,
  Trash2,
  Shield,
  Store,
  Home,
  ChevronDown,
} from 'lucide-react';

import {
  useSalesShipments,
  type SalesOrderForShipment,
} from '@verone/orders/hooks';

// ── Types ──────────────────────────────────────────────────────

type DeliveryMethod = 'pickup' | 'hand_delivery' | 'manual' | 'packlink';
type SortOption = 'default' | 'price_asc' | 'transit_asc';

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

// ── WizardSummaryPanel ──────────────────────────────────────────

interface WizardSummaryPanelProps {
  salesOrder: SalesOrderForShipment;
  packages: PackageInfo[];
  items: ShipmentItem[];
  contentDescription: string;
  declaredValue: number;
  selectedService: PacklinkService | null;
  wantsInsurance: boolean;
}

function WizardSummaryPanel({
  salesOrder,
  packages,
  items,
  contentDescription,
  declaredValue,
  selectedService,
  wantsInsurance,
}: WizardSummaryPanelProps) {
  const addr = (salesOrder.shipping_address ?? null) as Record<
    string,
    string
  > | null;
  const customerName = salesOrder.customer_name ?? 'Client';

  const insurancePrice = Math.max(2, declaredValue * 0.03);

  return (
    <div className="w-64 flex-shrink-0">
      <Card className="p-4 space-y-4 text-sm sticky top-4">
        <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">
          Résumé
        </p>

        {/* From */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">DE</p>
          <p className="font-medium">Verone Collections</p>
          <p className="text-xs text-muted-foreground">
            4 rue du Perou, 91300 Massy
          </p>
        </div>

        {/* To */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">À</p>
          <p className="font-medium">{customerName}</p>
          {addr && (
            <p className="text-xs text-muted-foreground">
              {addr.line1 ?? ''}, {addr.postal_code ?? ''} {addr.city ?? ''}
            </p>
          )}
        </div>

        {/* Packages */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">COLIS</p>
          {packages.map((pkg, idx) => (
            <p key={idx} className="text-xs text-muted-foreground">
              Colis {idx + 1} : {pkg.length}×{pkg.width}×{pkg.height} cm —{' '}
              {pkg.weight} kg
            </p>
          ))}
        </div>

        {/* Content */}
        {contentDescription && (
          <div>
            <p className="text-xs text-muted-foreground font-medium">CONTENU</p>
            <p className="text-xs">{contentDescription}</p>
            <p className="text-xs text-muted-foreground">
              Valeur : {declaredValue.toFixed(2)} €
            </p>
          </div>
        )}

        {/* Service */}
        {selectedService && (
          <div>
            <p className="text-xs text-muted-foreground font-medium">SERVICE</p>
            <p className="font-medium">{selectedService.carrier_name}</p>
            <p className="text-xs text-muted-foreground">
              {selectedService.name}
            </p>
          </div>
        )}

        {/* Price */}
        {selectedService && (
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground font-medium">PRIX</p>
            <p className="font-bold text-base">
              {(
                selectedService.price.total_price +
                (wantsInsurance ? insurancePrice : 0)
              ).toFixed(2)}{' '}
              €
            </p>
            {wantsInsurance && (
              <p className="text-xs text-muted-foreground">
                dont {insurancePrice.toFixed(2)} € protection
              </p>
            )}
          </div>
        )}

        {/* Items */}
        <div>
          <p className="text-xs text-muted-foreground font-medium">ARTICLES</p>
          {items
            .filter(i => (i.quantity_to_ship ?? 0) > 0)
            .map(i => (
              <p
                key={i.sales_order_item_id}
                className="text-xs text-muted-foreground"
              >
                {i.product_name} ×{i.quantity_to_ship}
              </p>
            ))}
        </div>
      </Card>
    </div>
  );
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
  const [manualShippingCost, setManualShippingCost] = useState<number | null>(
    null
  );
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
  const [sortOption, setSortOption] = useState<SortOption>('default');

  // Content & insurance (Step 3)
  const [contentDescription, setContentDescription] = useState('');
  const [isSecondHand, setIsSecondHand] = useState(false);
  const [declaredValue, setDeclaredValue] = useState(0);
  const [wantsInsurance, setWantsInsurance] = useState(false);

  // Packlink result
  const [shipmentResult, setShipmentResult] = useState<{
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
    orderReference: string | null;
    totalPaid: number | null;
  } | null>(null);
  const [paying, setPaying] = useState(false);

  // Dropoffs (relay points) — sender + receiver
  interface DropoffPoint {
    id: string;
    commerce_name: string;
    address: string;
    city: string;
    zip: string;
    phone?: string;
    opening_times: Record<string, unknown>;
  }
  // Sender dropoffs (around 91300 Massy)
  const [senderDropoffs, setSenderDropoffs] = useState<DropoffPoint[]>([]);
  const [selectedSenderDropoff, setSelectedSenderDropoff] = useState<
    string | null
  >(null);
  const [loadingSenderDropoffs, setLoadingSenderDropoffs] = useState(false);
  // Receiver dropoffs (around destination zip)
  const [receiverDropoffs, setReceiverDropoffs] = useState<DropoffPoint[]>([]);
  const [selectedReceiverDropoff, setSelectedReceiverDropoff] = useState<
    string | null
  >(null);
  const [loadingReceiverDropoffs, setLoadingReceiverDropoffs] = useState(false);

  // Collection date/time (for home pickup services)
  const [collectionDate, setCollectionDate] = useState(
    // Default to tomorrow
    (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    })()
  );
  const [collectionTime, setCollectionTime] = useState('09:00');

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

  // Initialize content description and declared value when items change
  useEffect(() => {
    const names = items
      .filter(i => (i.quantity_to_ship ?? 0) > 0)
      .map(i => i.product_name)
      .join(', ');
    setContentDescription(names);
    setDeclaredValue(totals.totalValue);
  }, [items, totals.totalValue]);

  // Insurance price: 3% of declared value, min 2€
  const insurancePrice = Math.max(2, declaredValue * 0.03);

  // Destination zip from shipping_address
  const destinationZip = useMemo(() => {
    const addr = salesOrder.shipping_address as Record<string, string> | null;
    return addr?.postal_code ?? addr?.zip ?? '';
  }, [salesOrder.shipping_address]);

  // Sorted services
  const sortedServices = useMemo(() => {
    const copy = [...services];
    if (sortOption === 'price_asc') {
      copy.sort((a, b) => a.price.total_price - b.price.total_price);
    } else if (sortOption === 'transit_asc') {
      copy.sort(
        (a, b) => parseInt(a.transit_hours, 10) - parseInt(b.transit_hours, 10)
      );
    }
    return copy;
  }, [services, sortOption]);

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

  // Package handlers
  const handleAddPackage = () => {
    setPackages(prev => [
      ...prev,
      { weight: 5, width: 30, height: 30, length: 30 },
    ]);
  };

  const handleRemovePackage = (idx: number) => {
    setPackages(prev => prev.filter((_, i) => i !== idx));
  };

  const handlePackageChange = (
    idx: number,
    field: keyof PackageInfo,
    value: string
  ) => {
    setPackages(prev =>
      prev.map((p, i) =>
        i === idx ? { ...p, [field]: parseFloat(value) || 0 } : p
      )
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
      delivery_method: deliveryMethod ?? undefined,
      carrier_name: manualCarrier || undefined,
      shipping_cost: manualShippingCost ?? undefined,
    });

    if (result.success) onSuccess();
  };

  // Build destination object from order data
  const buildDestination = useCallback(() => {
    const addr = (salesOrder.shipping_address ?? null) as Record<
      string,
      string
    > | null;
    const name = salesOrder.customer_name ?? '';
    const nameParts = name.split(' ');
    const email = salesOrder.organisations?.email ?? 'client@verone.fr';

    return {
      name: nameParts[0] ?? 'Client',
      surname: nameParts.slice(1).join(' ') || 'Client',
      email,
      phone: addr?.phone ?? '+33600000000',
      street1: addr?.line1 ?? '',
      city: addr?.city ?? '',
      zip_code: addr?.postal_code ?? '',
      country: addr?.country ?? 'FR',
    };
  }, [salesOrder]);

  // Fetch dropoff points for relay services — sender (91300) + receiver (destination)
  const fetchDropoffs = useCallback(async () => {
    if (!selectedService || !destinationZip) return;

    // Fetch sender dropoffs (around Massy 91300)
    setLoadingSenderDropoffs(true);
    try {
      const res = await fetch(
        `/api/packlink/dropoffs?service_id=${selectedService.id}&country=FR&zip=91300`
      );
      if (res.ok) {
        const data = (await res.json()) as { dropoffs: DropoffPoint[] };
        setSenderDropoffs(data.dropoffs ?? []);
      }
    } catch (err) {
      console.error('[Dropoffs sender]', err);
      setSenderDropoffs([]);
    }
    setLoadingSenderDropoffs(false);

    // Fetch receiver dropoffs (around destination)
    if (selectedService.delivery_to_parcelshop) {
      setLoadingReceiverDropoffs(true);
      try {
        const res = await fetch(
          `/api/packlink/dropoffs?service_id=${selectedService.id}&country=FR&zip=${destinationZip}`
        );
        if (res.ok) {
          const data = (await res.json()) as { dropoffs: DropoffPoint[] };
          setReceiverDropoffs(data.dropoffs ?? []);
        }
      } catch (err) {
        console.error('[Dropoffs receiver]', err);
        setReceiverDropoffs([]);
      }
      setLoadingReceiverDropoffs(false);
    }
  }, [selectedService, destinationZip]);

  // Create Packlink draft shipment (POST /shipments)
  // Payment is done manually on Packlink PRO website after draft creation
  const handleCreateDraft = async () => {
    if (!selectedService) return;
    setPaying(true);
    setServicesError(null);

    const destination = buildDestination();

    try {
      const res = await fetch('/api/packlink/shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedService.id,
          destination,
          packages,
          content: contentDescription,
          contentValue: declaredValue,
          contentSecondHand: isSecondHand,
          orderReference: salesOrder.order_number ?? salesOrder.id.slice(0, 8),
          ...(selectedSenderDropoff
            ? { dropoffPointId: selectedSenderDropoff }
            : {}),
          ...(collectionDate
            ? {
                collectionDate: collectionDate.split('-').join('/'),
                collectionTime: `${collectionTime}-18:00`,
              }
            : {}),
        }),
      });

      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: string;
          details?: string;
        };
        throw new Error(
          errData.details ?? errData.error ?? `Erreur ${res.status}`
        );
      }

      const data = (await res.json()) as {
        success: boolean;
        shipmentReference: string;
      };

      if (data.success) {
        // Enregistrer l'expédition dans notre DB (packlink_status = 'a_payer')
        // Le trigger INSERT ne décrémente PAS le stock pour les expéditions Packlink
        // Le stock sera décrémenté quand Verone paie le transport (webhook → 'paye')
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

          if (itemsToShip.length > 0) {
            const dbResult = await validateShipment({
              sales_order_id: salesOrder.id,
              items: itemsToShip,
              shipped_at: new Date().toISOString(),
              shipped_by: user.id,
              delivery_method: 'packlink',
              carrier_name: selectedService.carrier_name,
              carrier_service: selectedService.name,
              shipping_cost: selectedService.price.total_price,
              estimated_delivery_at:
                selectedService.first_estimated_delivery_date ?? undefined,
              packlink_shipment_id: data.shipmentReference,
              packlink_status: 'a_payer',
              notes: `Transport Packlink à payer par Verone — ${selectedService.carrier_name}`,
            });

            if (!dbResult.success) {
              console.error('[ShipmentWizard] DB save failed:', dbResult.error);
            }
          }
        }

        setShipmentResult({
          trackingNumber: null,
          labelUrl: null,
          carrierName: selectedService.carrier_name,
          orderReference: data.shipmentReference,
          totalPaid: selectedService.price.total_price,
        });
        setStep(7); // Success — show link to Packlink PRO for payment
      }
    } catch (err) {
      setServicesError(
        err instanceof Error ? err.message : 'Erreur creation expedition'
      );
    }
    setPaying(false);
  };

  const formatTransit = (hours: string) => {
    const h = parseInt(hours, 10);
    if (h <= 24) return '24H';
    if (h <= 48) return '48H';
    return `${Math.ceil(h / 24)} JOURS`;
  };

  const formatTransitLabel = (hours: string) => {
    const h = parseInt(hours, 10);
    if (h <= 24) return '24H PRÉVU';
    if (h <= 48) return '48H PRÉVU';
    return `${Math.ceil(h / 24)} JOURS PRÉVU`;
  };

  const formatEstimatedDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
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

  // Address helper
  const addr = (salesOrder.shipping_address ?? null) as Record<
    string,
    string
  > | null;
  const customerName = salesOrder.customer_name ?? 'Client';

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="w-5 h-5 text-verone-primary" />
                Articles a expedier
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Selectionnez les quantites a expedier
              </p>
            </div>
            <ButtonV2 variant="outline" size="sm" onClick={handleShipAll}>
              Tout expedier
            </ButtonV2>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 border-l-4 border-l-blue-500">
              <div className="text-xs font-medium text-gray-500">
                A expedier
              </div>
              <div className="text-xl font-bold mt-1 text-blue-600">
                {totals.totalQty}
              </div>
              <div className="text-xs text-gray-400">unites</div>
            </Card>
            <Card className="p-3 border-l-4 border-l-emerald-500">
              <div className="text-xs font-medium text-gray-500">Valeur</div>
              <div className="text-xl font-bold mt-1 text-emerald-600">
                {formatCurrency(totals.totalValue)}
              </div>
              <div className="text-xs text-gray-400">HT</div>
            </Card>
            <Card className="p-3 border-l-4 border-l-amber-500">
              <div className="text-xs font-medium text-gray-500">Stock</div>
              <Badge
                className={`mt-1 ${totals.hasStockIssue ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                {totals.hasStockIssue ? 'Insuffisant' : 'Disponible'}
              </Badge>
            </Card>
          </div>

          {/* Table Items */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Produit</TableHead>
                  <TableHead className="text-center font-semibold text-blue-700">
                    Commandee
                  </TableHead>
                  <TableHead className="text-center font-semibold text-green-700">
                    Deja exp.
                  </TableHead>
                  <TableHead className="text-center font-semibold text-amber-700">
                    Stock
                  </TableHead>
                  <TableHead className="text-center font-semibold text-indigo-700">
                    A expedier
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => {
                  const progressPercent =
                    item.quantity_ordered > 0
                      ? Math.round(
                          (item.quantity_already_shipped /
                            item.quantity_ordered) *
                            100
                        )
                      : 0;

                  return (
                    <TableRow
                      key={item.sales_order_item_id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumbnail
                            src={item.primary_image_url}
                            alt={item.product_name}
                            size="sm"
                          />
                          <div>
                            <p className="font-medium text-sm">
                              {item.product_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.product_sku}
                            </p>
                            {progressPercent > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-gray-400">
                                  {progressPercent}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {item.quantity_ordered}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            item.quantity_already_shipped > 0
                              ? 'text-green-600 font-medium'
                              : 'text-gray-400'
                          }
                        >
                          {item.quantity_already_shipped}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={
                            item.stock_available < item.quantity_remaining
                              ? 'text-red-600 font-bold'
                              : 'text-emerald-600 font-medium'
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
                          className="w-16 h-8 text-center mx-auto border-indigo-200 focus:border-indigo-500"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {totals.hasStockIssue && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              Stock insuffisant pour certains articles. Les quantites seront
              ajustees automatiquement.
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
                <Label>Cout transport HT (achat Verone)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={manualShippingCost ?? ''}
                  onChange={e =>
                    setManualShippingCost(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="Ex: 12.50"
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Cout paye par Verone au transporteur (jamais visible par le
                  client)
                </p>
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

      {/* STEP 3: Package info (Packlink) — multi-colis + contenu + assurance */}
      {step === 3 && (
        <div className="flex gap-4">
          <div className="flex-1 space-y-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Informations colis
            </h3>

            {/* Addresses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">
                  Expéditeur
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
                <p className="text-sm font-medium mt-1">{customerName}</p>
                <p className="text-xs text-muted-foreground">
                  {addr
                    ? `${addr.line1 ?? ''}, ${addr.postal_code ?? ''} ${addr.city ?? ''}`
                    : ''}
                </p>
              </div>
            </div>

            {/* Multi-colis */}
            <div className="space-y-3">
              {packages.map((pkg, idx) => (
                <Card key={idx} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-sm">Colis {idx + 1}</p>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(idx)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Supprimer
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <Label className="text-xs">Poids (kg)</Label>
                      <Input
                        type="number"
                        min={0.1}
                        step={0.1}
                        value={pkg.weight}
                        onChange={e =>
                          handlePackageChange(idx, 'weight', e.target.value)
                        }
                        className="h-8 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Longueur (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.length}
                        onChange={e =>
                          handlePackageChange(idx, 'length', e.target.value)
                        }
                        className="h-8 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Largeur (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.width}
                        onChange={e =>
                          handlePackageChange(idx, 'width', e.target.value)
                        }
                        className="h-8 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Hauteur (cm)</Label>
                      <Input
                        type="number"
                        min={1}
                        value={pkg.height}
                        onChange={e =>
                          handlePackageChange(idx, 'height', e.target.value)
                        }
                        className="h-8 mt-1"
                      />
                    </div>
                  </div>
                </Card>
              ))}

              <button
                type="button"
                onClick={handleAddPackage}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus className="h-4 w-4" />
                Ajouter un colis
              </button>
            </div>

            {/* Contenu envoyé */}
            <Card className="p-4 space-y-3">
              <p className="font-medium text-sm">Contenu envoyé</p>
              <div>
                <Label className="text-xs">Contenu</Label>
                <Input
                  value={contentDescription}
                  onChange={e => setContentDescription(e.target.value)}
                  placeholder="Ex: Mobilier, tableau..."
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-second-hand"
                  checked={isSecondHand}
                  onChange={e => setIsSecondHand(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label
                  htmlFor="is-second-hand"
                  className="text-sm cursor-pointer"
                >
                  Occasion
                </Label>
              </div>
              <div>
                <Label className="text-xs">Valeur déclarée (EUR)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={declaredValue}
                  onChange={e =>
                    setDeclaredValue(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1"
                />
              </div>
            </Card>

            {/* Protection d'expédition */}
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Protégez votre colis</p>
                  <p className="text-xs text-muted-foreground">
                    Obtenez un remboursement intégral en cas de perte ou de
                    dommage.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="insurance"
                    checked={wantsInsurance}
                    onChange={() => setWantsInsurance(true)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="text-sm">
                    Ajouter une protection d&apos;expédition —{' '}
                    <span className="font-semibold">
                      {insurancePrice.toFixed(2)} €
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="insurance"
                    checked={!wantsInsurance}
                    onChange={() => setWantsInsurance(false)}
                    className="mt-0.5 h-4 w-4"
                  />
                  <span className="text-sm text-muted-foreground">
                    Je suis prêt(e) à prendre le risque.
                  </span>
                </label>
              </div>
            </Card>

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
      )}

      {/* STEP 4: Carrier selection (Packlink PRO style) */}
      {step === 4 && (
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
                  const transitLabel = formatTransitLabel(
                    service.transit_hours
                  );
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
              <ButtonV2 variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </ButtonV2>
              <ButtonV2
                onClick={() => {
                  if (selectedService?.delivery_to_parcelshop) {
                    void fetchDropoffs().catch(console.error);
                  }
                  setStep(5);
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
      )}

      {/* STEP 5: Dropoff points — SENDER + RECEIVER */}
      {step === 5 && selectedService && (
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
                  <Label className="text-sm font-medium">
                    Date de collecte
                  </Label>
                  <Input
                    type="date"
                    value={collectionDate}
                    min={
                      new Date(Date.now() + 86400000)
                        .toISOString()
                        .split('T')[0]
                    }
                    onChange={e => setCollectionDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">
                    Heure de collecte
                  </Label>
                  <Input
                    type="time"
                    value={collectionTime}
                    onChange={e => setCollectionTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="border rounded-lg p-3 bg-blue-50 text-sm text-blue-700">
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
            {selectedService.delivery_to_parcelshop &&
              !loadingSenderDropoffs && (
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
                  {!loadingReceiverDropoffs &&
                    receiverDropoffs.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">
                        Aucun point relais de retrait disponible.
                      </p>
                    )}
                </div>
              )}

            <div className="flex justify-between">
              <ButtonV2 variant="outline" onClick={() => setStep(4)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </ButtonV2>
              <ButtonV2
                onClick={() => setStep(6)}
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
      )}

      {/* STEP 6: Payment page (Packlink) */}
      {step === 6 && selectedService && (
        <div className="flex gap-4">
          <div className="flex-1 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Paiement expedition
            </h3>

            <div className="space-y-3">
              {/* Expediteur */}
              <div className="border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">
                  Expediteur
                </Label>
                <p className="font-medium text-sm mt-1">Verone Collections</p>
                <p className="text-xs text-muted-foreground">
                  4 rue du Perou, 91300 Massy
                </p>
              </div>

              {/* Destinataire */}
              <div className="border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">
                  Destinataire
                </Label>
                <p className="font-medium text-sm mt-1">{customerName}</p>
                {addr && (
                  <p className="text-xs text-muted-foreground">
                    {addr.line1 ?? ''}, {addr.postal_code ?? ''}{' '}
                    {addr.city ?? ''}
                  </p>
                )}
              </div>

              {/* Relais depot (expediteur) */}
              {selectedSenderDropoff && (
                <div className="border rounded-lg p-3 border-l-4 border-l-blue-500">
                  <Label className="text-xs text-blue-700 font-semibold">
                    Relais de depot (expediteur)
                  </Label>
                  <p className="font-medium text-sm mt-1">
                    {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                      ?.commerce_name ?? 'Relais selectionne'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                      ?.address ?? ''}
                    ,{' '}
                    {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                      ?.zip ?? ''}{' '}
                    {senderDropoffs.find(d => d.id === selectedSenderDropoff)
                      ?.city ?? ''}
                  </p>
                </div>
              )}

              {/* Relais retrait (destinataire) */}
              {selectedReceiverDropoff && (
                <div className="border rounded-lg p-3 border-l-4 border-l-green-500">
                  <Label className="text-xs text-green-700 font-semibold">
                    Relais de retrait (destinataire)
                  </Label>
                  <p className="font-medium text-sm mt-1">
                    {receiverDropoffs.find(
                      d => d.id === selectedReceiverDropoff
                    )?.commerce_name ?? 'Relais selectionne'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {receiverDropoffs.find(
                      d => d.id === selectedReceiverDropoff
                    )?.address ?? ''}
                    ,{' '}
                    {receiverDropoffs.find(
                      d => d.id === selectedReceiverDropoff
                    )?.zip ?? ''}{' '}
                    {receiverDropoffs.find(
                      d => d.id === selectedReceiverDropoff
                    )?.city ?? ''}
                  </p>
                </div>
              )}

              {/* Colis */}
              <div className="border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">Colis</Label>
                {packages.map((pkg, idx) => (
                  <p key={idx} className="text-sm mt-1">
                    Colis {idx + 1} : {pkg.length} x {pkg.width} x {pkg.height}{' '}
                    cm — {pkg.weight} kg
                  </p>
                ))}
              </div>

              {/* Transporteur */}
              <div className="border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">
                  Transporteur
                </Label>
                <p className="font-medium text-sm mt-1">
                  {selectedService.carrier_name} — {selectedService.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatTransit(selectedService.transit_hours)} ·{' '}
                  {selectedService.delivery_to_parcelshop
                    ? 'Point relais'
                    : 'Domicile'}
                  {selectedService.first_estimated_delivery_date &&
                    ` · Livraison prevue le ${formatEstimatedDate(selectedService.first_estimated_delivery_date)}`}
                </p>
              </div>

              {/* Articles */}
              <div className="border rounded-lg p-3">
                <Label className="text-xs text-muted-foreground">
                  Articles
                </Label>
                {items
                  .filter(i => (i.quantity_to_ship ?? 0) > 0)
                  .map(i => (
                    <p key={i.sales_order_item_id} className="text-sm mt-0.5">
                      {i.product_name} x{i.quantity_to_ship}
                    </p>
                  ))}
              </div>

              {/* Total cost — payment highlight */}
              <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-800">
                    Montant a payer
                  </span>
                  <span className="font-bold text-2xl text-blue-700">
                    {(
                      selectedService.price.total_price +
                      (wantsInsurance ? insurancePrice : 0)
                    ).toFixed(2)}{' '}
                    EUR
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Debite sur le compte Packlink PRO
                  {wantsInsurance &&
                    ` · dont ${insurancePrice.toFixed(2)} EUR de protection`}
                </p>
              </div>
            </div>

            {servicesError && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-red-50 p-3 rounded-lg">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
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
                  void handleCreateDraft().catch(console.error);
                }}
                disabled={paying}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {paying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Truck className="h-4 w-4 mr-1" />
                )}
                Creer l expedition —{' '}
                {(
                  selectedService.price.total_price +
                  (wantsInsurance ? insurancePrice : 0)
                ).toFixed(2)}{' '}
                EUR
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
      )}

      {/* STEP 7: Draft created — pay on Packlink PRO */}
      {step === 7 && shipmentResult && (
        <div className="text-center space-y-4 py-6">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="font-bold text-lg">Expedition creee sur Packlink</h3>

          <div className="border rounded-lg p-3 inline-block">
            <Label className="text-xs text-muted-foreground">
              Reference Packlink
            </Label>
            <p className="font-mono font-medium text-sm">
              {shipmentResult.orderReference}
            </p>
          </div>

          <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 max-w-md mx-auto">
            <p className="text-sm text-blue-800 font-medium">
              Finalisez le paiement sur Packlink PRO
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Montant : {shipmentResult.totalPaid?.toFixed(2)} EUR —{' '}
              {shipmentResult.carrierName}
            </p>
            <ButtonV2
              className="mt-3 bg-blue-600 hover:bg-blue-700 w-full"
              onClick={() =>
                window.open(
                  'https://pro.packlink.fr/private/shipments/ready-to-purchase',
                  '_blank'
                )
              }
            >
              <Truck className="h-4 w-4 mr-1" />
              Ouvrir Packlink PRO pour payer
            </ButtonV2>
          </div>

          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Apres le paiement sur Packlink PRO, le numero de suivi et l
            etiquette seront automatiquement synchronises dans votre back-office
            via webhook.
          </p>

          <ButtonV2 variant="outline" onClick={onSuccess}>
            Fermer
          </ButtonV2>
        </div>
      )}
    </div>
  );
}
