import type { Dispatch, SetStateAction } from 'react';

import type { ShipmentItem } from '@verone/types';

import type { SalesOrderForShipment } from '@verone/orders/hooks';

// ── Delivery method ──────────────────────────────────────────────

export type DeliveryMethod = 'pickup' | 'hand_delivery' | 'manual' | 'packlink';

export type SortOption = 'default' | 'price_asc' | 'transit_asc';

// ── Packlink ─────────────────────────────────────────────────────

export interface PacklinkService {
  id: number;
  name: string;
  carrier_name: string;
  price: { total_price: number; currency: string };
  transit_hours: string;
  delivery_to_parcelshop: boolean;
  first_estimated_delivery_date: string;
  dropoff: boolean;
}

export interface PackageInfo {
  weight: number;
  width: number;
  height: number;
  length: number;
}

export interface DropoffPoint {
  id: string;
  commerce_name: string;
  address: string;
  city: string;
  zip: string;
  phone?: string;
  opening_times: Record<string, unknown>;
}

// ── Previous shipments ───────────────────────────────────────────

export interface PreviousShipmentGroup {
  shipped_at: string;
  delivery_method: string | null;
  carrier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  packlink_status: string | null;
  shipping_cost: number | null;
  packages_info: PackageInfo[];
  items: Array<{ product_name: string; quantity: number }>;
}

export interface ShipmentRow {
  shipped_at: string;
  quantity_shipped: number;
  delivery_method: string | null;
  carrier_name: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  packlink_status: string | null;
  shipping_cost: number | null;
  packages_info: unknown;
  products: { name: string } | null;
}

// ── Component props ───────────────────────────────────────────────

export interface ShipmentWizardProps {
  salesOrder: SalesOrderForShipment;
  onSuccess: () => void;
  onCancel: () => void;
}

export interface WizardSummaryPanelProps {
  salesOrder: SalesOrderForShipment;
  packages: PackageInfo[];
  items: ShipmentItem[];
  contentDescription: string;
  declaredValue: number;
  selectedService: PacklinkService | null;
  wantsInsurance: boolean;
}

// ── Wizard state (returned by useShipmentWizard) ─────────────────

export interface ShipmentWizardState {
  // Navigation
  step: number;
  setStep: (step: number) => void;

  // Items
  items: ShipmentItem[];
  setItems: Dispatch<SetStateAction<ShipmentItem[]>>;

  // Delivery method
  deliveryMethod: DeliveryMethod | null;
  setDeliveryMethod: (method: DeliveryMethod) => void;

  // Manual fields
  manualCarrier: string;
  setManualCarrier: (v: string) => void;
  manualTracking: string;
  setManualTracking: (v: string) => void;
  manualShippingCost: number | null;
  setManualShippingCost: (v: number | null) => void;
  notes: string;
  setNotes: (v: string) => void;

  // Packages
  packages: PackageInfo[];
  setPackages: Dispatch<SetStateAction<PackageInfo[]>>;

  // Packlink services
  services: PacklinkService[];
  selectedService: PacklinkService | null;
  setSelectedService: (service: PacklinkService | null) => void;
  loadingServices: boolean;
  servicesError: string | null;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;

  // Content & insurance
  contentDescription: string;
  setContentDescription: (v: string) => void;
  isSecondHand: boolean;
  setIsSecondHand: (v: boolean) => void;
  declaredValue: number;
  setDeclaredValue: (v: number) => void;
  wantsInsurance: boolean;
  setWantsInsurance: (v: boolean) => void;

  // Packlink result
  shipmentResult: {
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
    orderReference: string | null;
    totalPaid: number | null;
  } | null;
  paying: boolean;

  // Dropoffs
  senderDropoffs: DropoffPoint[];
  selectedSenderDropoff: string | null;
  setSelectedSenderDropoff: (id: string | null) => void;
  loadingSenderDropoffs: boolean;
  receiverDropoffs: DropoffPoint[];
  selectedReceiverDropoff: string | null;
  setSelectedReceiverDropoff: (id: string | null) => void;
  loadingReceiverDropoffs: boolean;

  // Collection date/time
  collectionDate: string;
  setCollectionDate: (v: string) => void;
  collectionTime: string;
  setCollectionTime: (v: string) => void;

  // Previous shipments
  previousShipments: PreviousShipmentGroup[];

  // Computed
  totals: { totalQty: number; totalValue: number; hasStockIssue: boolean };
  insurancePrice: number;
  destinationZip: string;
  sortedServices: PacklinkService[];
  stepLabels: string[];
  maxStep: number;
  validating: boolean;

  // Error recovery state (step 8)
  dbError: string | null;
  pendingPacklinkRef: string | null;
  pendingAction: boolean;

  // Handlers
  handleQuantityChange: (itemId: string, value: string) => void;
  handleShipAll: () => void;
  handleAddPackage: () => void;
  handleRemovePackage: (idx: number) => void;
  handlePackageChange: (
    idx: number,
    field: keyof PackageInfo,
    value: string
  ) => void;
  fetchServices: () => Promise<void>;
  fetchDropoffs: () => Promise<void>;
  handleSimpleValidation: () => Promise<void>;
  handleCreateDraft: () => Promise<void>;
  handleRetryDbSave: () => Promise<void>;
  handleCancelPacklink: () => Promise<void>;
  formatTransit: (hours: string) => string;
  formatTransitLabel: (hours: string) => string;
  formatEstimatedDate: (dateStr: string) => string;
}
