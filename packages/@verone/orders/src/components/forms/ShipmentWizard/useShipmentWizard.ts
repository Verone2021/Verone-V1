'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import type { ShipmentItem } from '@verone/types';
import { createClient } from '@verone/utils/supabase/client';

import {
  useSalesShipments,
  type SalesOrderForShipment,
  type ShipmentRecipientContact,
} from '@verone/orders/hooks';

import {
  formatTransit,
  formatTransitLabel,
  formatEstimatedDate,
} from './formatters';
import { parseShippingAddress, extractPostalCode } from './parse-address';
import {
  makeQuantityChangeHandler,
  makeShipAllHandler,
  makeAddPackageHandler,
  makeRemovePackageHandler,
  makePackageChangeHandler,
} from './handlers';
import { useCreateDraftHandlers } from './handle-create-draft';
import { useFetchDropoffs } from './use-fetch-dropoffs';
import { usePreviousShipments } from './use-previous-shipments';
import type {
  DeliveryMethod,
  RecipientForm,
  RecipientSource,
  SortOption,
  PacklinkService,
  PackageInfo,
  DropoffPoint,
  ShipmentWizardState,
} from './types';

// Defaults Verone pour le destinataire Packlink. Packlink REJETTE l'API call
// si email ou mobile est vide. Quand un contact FK n'a ni email ni mobile
// renseigne, on injecte ces defaults — visiblement — dans le form (l'utilisateur
// peut toujours les corriger a la main avant Suivant). Plus de fallback
// silencieux comme l'ancien 'client@verone.fr' / '+33600000000'.
const DEFAULT_RECIPIENT_EMAIL = 'romeo@veronecollections.fr';
const DEFAULT_RECIPIENT_PHONE = '0656720702';

function firstNonEmpty(
  ...candidates: Array<string | null | undefined>
): string {
  for (const v of candidates) {
    const trimmed = v?.trim();
    if (trimmed && trimmed.length > 0) return trimmed;
  }
  return '';
}

function pickEmail(c: ShipmentRecipientContact): string {
  return firstNonEmpty(c.email) || DEFAULT_RECIPIENT_EMAIL;
}

function pickPhone(c: ShipmentRecipientContact): string {
  return firstNonEmpty(c.mobile, c.phone) || DEFAULT_RECIPIENT_PHONE;
}

export function useShipmentWizard(
  salesOrder: SalesOrderForShipment,
  onSuccess: () => void
): ShipmentWizardState {
  // Stabilise the Supabase client so it doesn't trigger useEffect re-runs.
  // createClient() is cache-backed but TypeScript can't guarantee ref stability
  // across renders without useMemo.
  const supabase = useMemo(() => createClient(), []);
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
  // null = aucun choix encore fait — le wizard bloque "Suivant" dans StepPackageInfo
  // tant que l'utilisateur n'a pas explicitement choisi OUI ou NON. Romeo a demandé
  // ce comportement après l'incident du 2026-04-23 où l'assurance était appliquée
  // silencieusement sans choix utilisateur.
  const [wantsInsurance, setWantsInsurance] = useState<boolean | null>(null);

  // Packlink result
  const [shipmentResult, setShipmentResult] = useState<{
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
    orderReference: string | null;
    totalPaid: number | null;
  } | null>(null);
  const [paying, setPaying] = useState(false);

  // Error recovery state (step 8)
  const [dbError, setDbError] = useState<string | null>(null);
  const [pendingPacklinkRef, setPendingPacklinkRef] = useState<string | null>(
    null
  );
  const [pendingAction, setPendingAction] = useState(false);

  // Dropoffs — sender + receiver
  const [senderDropoffs, setSenderDropoffs] = useState<DropoffPoint[]>([]);
  const [selectedSenderDropoff, setSelectedSenderDropoff] = useState<
    string | null
  >(null);
  const [loadingSenderDropoffs, setLoadingSenderDropoffs] = useState(false);
  const [receiverDropoffs, setReceiverDropoffs] = useState<DropoffPoint[]>([]);
  const [selectedReceiverDropoff, setSelectedReceiverDropoff] = useState<
    string | null
  >(null);
  const [loadingReceiverDropoffs, setLoadingReceiverDropoffs] = useState(false);

  // Collection date/time
  // Date d'enlevement : VIDE par defaut — l'utilisateur DOIT la selectionner
  // (Packlink PRO exige une confirmation explicite de la date pour passer en "Pret pour le paiement")
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('09:00');

  // ── Destinataire Packlink (etape Destinataire si deliveryMethod === 'packlink') ──
  // Source de verite des coordonnees envoyees a Packlink.
  // Initialise depuis les contacts FK joints (delivery > responsable > billing)
  // et editable manuellement.
  const [recipientForm, setRecipientForm] = useState<RecipientForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [recipientSource, setRecipientSource] =
    useState<RecipientSource>('manual');

  // Pre-remplissage initial : delivery_contact > responsable_contact > billing_contact
  // Si aucun, source='manual' avec champs vides (l'utilisateur saisit).
  // Re-execute si la commande change (reload).
  useEffect(() => {
    const candidates: Array<{
      source: Exclude<RecipientSource, 'manual'>;
      contact: ShipmentRecipientContact | null | undefined;
    }> = [
      { source: 'delivery', contact: salesOrder.delivery_contact },
      { source: 'responsable', contact: salesOrder.responsable_contact },
      { source: 'billing', contact: salesOrder.billing_contact },
    ];
    const first = candidates.find(c => c.contact?.id);
    if (first?.contact) {
      const c = first.contact;
      setRecipientSource(first.source);
      setRecipientForm({
        firstName: c.first_name ?? '',
        lastName: c.last_name ?? '',
        email: pickEmail(c),
        phone: pickPhone(c),
      });
    } else {
      setRecipientSource('manual');
      setRecipientForm({ firstName: '', lastName: '', email: '', phone: '' });
    }
  }, [
    salesOrder.delivery_contact,
    salesOrder.responsable_contact,
    salesOrder.billing_contact,
  ]);

  const setRecipientField = useCallback(
    (key: keyof RecipientForm, value: string) => {
      setRecipientForm(prev => ({ ...prev, [key]: value }));
      // Editer un champ = bascule en saisie manuelle (le user a pris la main).
      setRecipientSource('manual');
    },
    []
  );

  const selectRecipientContact = useCallback(
    (source: RecipientSource) => {
      setRecipientSource(source);
      if (source === 'manual') {
        setRecipientForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
        return;
      }
      const map: Record<
        Exclude<RecipientSource, 'manual'>,
        ShipmentRecipientContact | null | undefined
      > = {
        delivery: salesOrder.delivery_contact,
        responsable: salesOrder.responsable_contact,
        billing: salesOrder.billing_contact,
      };
      const c = map[source];
      if (!c) return;
      setRecipientForm({
        firstName: c.first_name ?? '',
        lastName: c.last_name ?? '',
        email: pickEmail(c),
        phone: pickPhone(c),
      });
    },
    [
      salesOrder.delivery_contact,
      salesOrder.responsable_contact,
      salesOrder.billing_contact,
    ]
  );

  // Previous shipments — extracted to use-previous-shipments.ts
  const { previousShipments } = usePreviousShipments(
    salesOrder.id,
    salesOrder.status,
    supabase
  );

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

  // Destination zip from shipping_address (tolerates string or object payload)
  const destinationZip = useMemo(() => {
    return extractPostalCode(parseShippingAddress(salesOrder.shipping_address));
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

  // Step constants — Packlink ajoute une etape "Destinataire" entre Mode et Colis.
  const stepLabels = useMemo(
    () =>
      deliveryMethod === 'packlink'
        ? [
            'Stock',
            'Mode',
            'Destinataire',
            'Colis',
            'Transport',
            'Relais',
            'Resume',
          ]
        : ['Stock', 'Mode'],
    [deliveryMethod]
  );
  const maxStep = deliveryMethod === 'packlink' ? 7 : 2;

  // Handlers — items & packages (sync, extracted to handlers.ts)
  const handleQuantityChange = makeQuantityChangeHandler(setItems);
  const handleShipAll = makeShipAllHandler(setItems);
  const handleAddPackage = makeAddPackageHandler(setPackages);
  const handleRemovePackage = makeRemovePackageHandler(setPackages);
  const handlePackageChange = makePackageChangeHandler(setPackages);

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

  // Validate shipment (simple modes: pickup / hand_delivery / manual)
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

  // Build destination object from recipientForm (saisi a l'etape Destinataire)
  // + adresse de la commande. Pas de fallback hardcode ici : l'etape
  // Destinataire bloque "Suivant" tant que les 4 champs ne sont pas remplis.
  const buildDestination = useCallback(() => {
    const addr = parseShippingAddress(salesOrder.shipping_address);
    return {
      name: recipientForm.firstName.trim(),
      surname: recipientForm.lastName.trim(),
      email: recipientForm.email.trim(),
      phone: recipientForm.phone.trim(),
      street1: addr?.address_line1 ?? addr?.line1 ?? '',
      city: addr?.city ?? '',
      zip_code: addr?.postal_code ?? '',
      country: addr?.country ?? 'FR',
    };
  }, [salesOrder, recipientForm]);

  // Fetch dropoff points for relay services — extracted to use-fetch-dropoffs.ts
  const fetchDropoffs = useFetchDropoffs({
    selectedService,
    destinationZip,
    setSenderDropoffs,
    setLoadingSenderDropoffs,
    setReceiverDropoffs,
    setLoadingReceiverDropoffs,
  });

  // Create Packlink draft shipment + DB save — extracted to handle-create-draft.ts
  const { handleCreateDraft, handleRetryDbSave, handleCancelPacklink } =
    useCreateDraftHandlers({
      salesOrderId: salesOrder.id,
      salesOrderNumber: salesOrder.order_number ?? null,
      items,
      packages,
      selectedService,
      contentDescription,
      declaredValue,
      isSecondHand,
      wantsInsurance,
      collectionDate,
      collectionTime,
      selectedSenderDropoff,
      pendingPacklinkRef,
      supabase,
      validateShipment,
      buildDestination,
      setStep,
      setPaying,
      setServicesError,
      setDbError,
      setPendingPacklinkRef,
      setPendingAction,
      setShipmentResult,
    });

  return {
    step,
    setStep,
    items,
    setItems,
    deliveryMethod,
    setDeliveryMethod,
    manualCarrier,
    setManualCarrier,
    manualTracking,
    setManualTracking,
    manualShippingCost,
    setManualShippingCost,
    notes,
    setNotes,
    packages,
    setPackages,
    services,
    selectedService,
    setSelectedService,
    loadingServices,
    servicesError,
    sortOption,
    setSortOption,
    contentDescription,
    setContentDescription,
    isSecondHand,
    setIsSecondHand,
    declaredValue,
    setDeclaredValue,
    wantsInsurance,
    setWantsInsurance,
    shipmentResult,
    paying,
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
    previousShipments,
    totals,
    insurancePrice,
    destinationZip,
    sortedServices,
    stepLabels,
    maxStep,
    validating,
    dbError,
    pendingPacklinkRef,
    pendingAction,
    handleQuantityChange,
    handleShipAll,
    handleAddPackage,
    handleRemovePackage,
    handlePackageChange,
    fetchServices,
    fetchDropoffs,
    handleSimpleValidation,
    handleCreateDraft,
    handleRetryDbSave,
    handleCancelPacklink,
    formatTransit,
    formatTransitLabel,
    formatEstimatedDate,
    recipientForm,
    recipientSource,
    setRecipientField,
    selectRecipientContact,
  };
}
