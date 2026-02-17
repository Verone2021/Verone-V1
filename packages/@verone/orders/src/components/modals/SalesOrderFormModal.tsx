'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { AddressInput } from '@verone/common/components/address/AddressInput';
import { useToast } from '@verone/common/hooks';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { useStockMovements } from '@verone/stock/hooks';
import type { Database } from '@verone/types';
import { Alert, AlertDescription } from '@verone/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';
import { EcoTaxVatInput } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { cn, formatCurrency } from '@verone/utils';
import Image from 'next/image';
import { createClient } from '@verone/utils/supabase/client';
import {
  Plus,
  X,
  AlertTriangle,
  Trash2,
  Store,
  Globe,
  Users,
  ChevronRight,
  ArrowLeft,
  Eye,
  Building2,
  Loader2,
  Package,
} from 'lucide-react';

import type { CreateSalesOrderData } from '@verone/orders/hooks';
import { useSalesOrders } from '@verone/orders/hooks';

// Hooks LinkMe (depuis package local)
import {
  useLinkMeAffiliates,
  type AffiliateType,
} from '@verone/orders/hooks/linkme/use-linkme-affiliates';
import {
  useCreateLinkMeOrder,
  type CreateLinkMeOrderInput,
} from '@verone/orders/hooks/linkme/use-linkme-orders';
import {
  useLinkMeSelectionsByEnseigne,
  useLinkMeSelection,
  type SelectionItem,
} from '@verone/orders/hooks/linkme/use-linkme-selections';

import type { UnifiedCustomer } from './customer-selector';
import { CustomerSelector } from './customer-selector';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_ht: number;
  tax_rate: number; // Taux de TVA par ligne (0.20 = 20%)
  discount_percentage: number;
  eco_tax: number; // Éco-taxe par ligne (€)
  expected_delivery_date?: string;
  notes?: string;
  is_sample?: boolean; // Marquer comme échantillon envoyé au client
  product?: {
    id: string;
    name: string;
    sku: string;
    primary_image_url?: string;
    stock_quantity?: number;
    eco_tax_default?: number; // Éco-taxe indicative du produit
  };
  availableStock?: number;
  // Pricing V2 metadata
  pricing_source?:
    | 'customer_specific'
    | 'customer_group'
    | 'channel'
    | 'base_catalog';
  original_price_ht?: number;
  auto_calculated?: boolean; // Indique si le prix vient du pricing V2
}

// Types pour le wizard de création
type SalesChannelType = 'manual' | 'site-internet' | 'linkme';
type WizardStep = 'channel-selection' | 'form';

// Type pour le panier LinkMe
interface LinkMeCartItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price_ht: number; // Prix de vente affilié (168.75€)
  base_price_ht: number; // Prix de base pour calcul commission (135€)
  retrocession_rate: number; // Commission affilié (décimal 0.15 = 15%)
  linkme_selection_item_id: string;
  product_image_url?: string | null;
}

// Extended types for fields present in DB but not in SalesOrder/SalesOrderItem interfaces
interface SalesOrderExtended {
  payment_terms_type?: Database['public']['Enums']['payment_terms_type'] | null;
  payment_terms_notes?: string | null;
}

interface SalesOrderItemExtended {
  eco_tax?: number;
  is_sample?: boolean;
}

interface ProductExtended {
  eco_tax_default?: number;
}

// Type for pricing V2 RPC result
interface PricingV2Result {
  price_ht: number;
  discount_rate: number | null;
  price_source:
    | 'customer_specific'
    | 'customer_group'
    | 'channel'
    | 'base_catalog';
  original_price: number;
}

interface SalesOrderFormModalProps {
  mode?: 'create' | 'edit';
  orderId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  buttonLabel?: string;
}

export function SalesOrderFormModal({
  mode = 'create',
  orderId,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  buttonLabel = 'Nouvelle commande',
}: SalesOrderFormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // État du wizard (étape courante et canal sélectionné)
  const [wizardStep, setWizardStep] = useState<WizardStep>('channel-selection');
  const [selectedSalesChannel, setSelectedSalesChannel] =
    useState<SalesChannelType | null>(null);

  // Utiliser l'état contrôlé si fourni, sinon l'état interne
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen !== undefined) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };
  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const supabase = createClient();

  // Form data
  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [ecoTaxVatRate, setEcoTaxVatRate] = useState<number | null>(null);

  // Conditions de paiement (enum + notes)
  const [paymentTermsType, setPaymentTermsType] = useState<
    Database['public']['Enums']['payment_terms_type'] | null
  >(null);
  const [paymentTermsNotes, setPaymentTermsNotes] = useState('');

  // Canal de vente
  const [channelId, setChannelId] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);

  // Frais additionnels clients
  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);

  // RFA supprimé - Migration 003

  // Items management
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<string[]>([]);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ============================================
  // ÉTATS LINKME (workflow complet)
  // ============================================
  const [linkmeAffiliateType, setLinkmeAffiliateType] =
    useState<AffiliateType | null>(null);
  const [linkmeAffiliateId, setLinkmeAffiliateId] = useState<string | null>(
    null
  );
  const [linkmeSelectionId, setLinkmeSelectionId] = useState<string | null>(
    null
  );
  const [linkmeCart, setLinkmeCart] = useState<LinkMeCartItem[]>([]);
  const [previewSelectionId, setPreviewSelectionId] = useState<string | null>(
    null
  );

  // Hooks LinkMe
  const { data: linkmeAffiliates, isLoading: loadingAffiliates } =
    useLinkMeAffiliates(linkmeAffiliateType ?? undefined);

  // Récupérer l'affilié sélectionné pour obtenir enseigne_id
  const selectedLinkmeAffiliate = useMemo(() => {
    return linkmeAffiliates?.find(a => a.id === linkmeAffiliateId);
  }, [linkmeAffiliates, linkmeAffiliateId]);

  // Sélections par enseigne (via l'affilié)
  const effectiveEnseigneId = selectedLinkmeAffiliate?.enseigne_id ?? null;
  const { data: linkmeSelections, isLoading: loadingSelections } =
    useLinkMeSelectionsByEnseigne(effectiveEnseigneId);
  const { data: linkmeSelectionDetail, isLoading: loadingSelectionDetail } =
    useLinkMeSelection(linkmeSelectionId);
  const { data: previewSelection, isLoading: previewLoading } =
    useLinkMeSelection(previewSelectionId);
  const createLinkMeOrderMutation = useCreateLinkMeOrder();

  // Hooks
  const { createOrder, updateOrderWithItems, fetchOrder } = useSalesOrders();
  const { getAvailableStock } = useStockMovements();
  const { toast } = useToast();

  // Charger les canaux de vente disponibles
  useEffect(() => {
    const loadChannels = async () => {
      const { data, error } = await supabase
        .from('sales_channels')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Erreur chargement canaux:', error);
        return;
      }

      setAvailableChannels(data ?? []);
    };

    void loadChannels().catch(console.error);
  }, [supabase]);

  // Vérifier la disponibilité du stock pour tous les items
  const checkAllStockAvailability = useCallback(
    async (currentItems: OrderItem[]) => {
      const warnings: string[] = [];

      for (const item of currentItems) {
        const stockData = await getAvailableStock(item.product_id);
        const availableStock = stockData?.stock_available ?? 0;
        if (availableStock < item.quantity) {
          warnings.push(
            `${item.product?.name} : Stock insuffisant (Disponible: ${availableStock}, Demandé: ${item.quantity})`
          );
        }
      }

      setStockWarnings(warnings);
    },
    [getAvailableStock]
  );

  // Charger la commande existante en mode édition
  const loadExistingOrder = useCallback(
    async (orderIdToLoad: string) => {
      setLoadingOrder(true);
      try {
        const order = await fetchOrder(orderIdToLoad);
        if (!order) throw new Error('Commande non trouvée');

        // Cast order pour accéder aux champs non typés dans SalesOrder
        const orderExt = order as typeof order & SalesOrderExtended;

        // Helper pour extraire l'adresse string d'un champ shipping/billing_address (typed as any)
        const extractAddress = (addr: unknown): string => {
          if (!addr) return '';
          if (typeof addr === 'string') return addr;
          if (typeof addr === 'object' && addr !== null && 'address' in addr) {
            const val = (addr as { address: unknown }).address;
            return typeof val === 'string' ? val : '';
          }
          return '';
        };

        // Construire l'objet customer unifié
        const customer: UnifiedCustomer =
          order.customer_type === 'organization'
            ? {
                id: order.customer_id,
                type: 'professional' as const,
                name:
                  order.organisations?.trade_name ??
                  order.organisations?.legal_name ??
                  '',
                payment_terms: null,
                prepayment_required: false,
              }
            : {
                id: order.customer_id,
                type: 'individual' as const,
                name: `${order.individual_customers?.first_name ?? ''} ${order.individual_customers?.last_name ?? ''}`.trim(),
                payment_terms: null,
                prepayment_required: false,
              };

        setSelectedCustomer(customer);

        // Charger les données de la commande
        setExpectedDeliveryDate(order.expected_delivery_date ?? '');
        setShippingAddress(extractAddress(order.shipping_address));
        setBillingAddress(extractAddress(order.billing_address));
        setNotes(order.notes ?? '');
        setEcoTaxVatRate(order.eco_tax_vat_rate ?? null);
        setPaymentTermsType(orderExt.payment_terms_type ?? null);
        setPaymentTermsNotes(orderExt.payment_terms_notes ?? '');
        setChannelId(order.channel_id ?? null);
        // Charger frais additionnels
        setShippingCostHt(order.shipping_cost_ht ?? 0);
        setInsuranceCostHt(order.insurance_cost_ht ?? 0);
        setHandlingCostHt(order.handling_cost_ht ?? 0);

        // Transformer les items de la commande en OrderItem[]
        const loadedItems: OrderItem[] = await Promise.all(
          (order.sales_order_items ?? []).map(async item => {
            const stockData = await getAvailableStock(item.product_id);
            // Cast item pour accéder aux champs non typés dans SalesOrderItem
            const itemExt = item as typeof item & SalesOrderItemExtended;
            const prodExt = item.products as
              | (typeof item.products & ProductExtended)
              | undefined;

            return {
              id: item.id,
              product_id: item.product_id,
              quantity: item.quantity,
              unit_price_ht: item.unit_price_ht,
              tax_rate: item.tax_rate ?? 0.2, // Charger TVA ou 20% par défaut
              discount_percentage: item.discount_percentage,
              eco_tax: itemExt.eco_tax ?? 0, // Éco-taxe (champ non encore typé dans SalesOrderItem)
              expected_delivery_date: item.expected_delivery_date,
              notes: item.notes,
              is_sample: itemExt.is_sample ?? false, // Échantillon
              product: item.products
                ? {
                    id: item.products.id,
                    name: item.products.name,
                    sku: item.products.sku,
                    primary_image_url: undefined,
                    stock_quantity: item.products.stock_quantity,
                    eco_tax_default: prodExt?.eco_tax_default ?? 0, // Champ non encore typé
                  }
                : undefined,
              availableStock: stockData?.stock_available ?? 0,
              pricing_source: 'base_catalog' as const,
              original_price_ht: item.unit_price_ht,
              auto_calculated: false,
            };
          })
        );

        setItems(loadedItems);
        await checkAllStockAvailability(loadedItems);
      } catch (error) {
        console.error('Erreur lors du chargement de la commande:', error);
      } finally {
        setLoadingOrder(false);
      }
    },
    [fetchOrder, getAvailableStock, checkAllStockAvailability]
  );

  // Effet : charger la commande en mode édition quand la modal s'ouvre
  useEffect(() => {
    if (open && mode === 'edit' && orderId) {
      void loadExistingOrder(orderId).catch(console.error);
    }
  }, [open, mode, orderId, loadExistingOrder]);

  // Calculs totaux (inclut eco_tax - Migration eco_tax 2025-10-31)
  // ✅ FIX: L'écotaxe est PAR UNITÉ, donc multipliée par la quantité
  const totalHTProducts = items.reduce((sum, item) => {
    const itemSubtotal =
      item.quantity *
      item.unit_price_ht *
      (1 - (item.discount_percentage ?? 0) / 100);
    const itemEcoTax = (item.eco_tax ?? 0) * item.quantity; // Écotaxe × quantité
    return sum + itemSubtotal + itemEcoTax;
  }, 0);

  // Total des frais additionnels
  const totalCharges = shippingCostHt + insuranceCostHt + handlingCostHt;

  // Total HT global (produits + frais)
  const _totalHT = totalHTProducts + totalCharges;

  // TVA calculée dynamiquement par ligne avec taux spécifique + TVA sur frais (20%)
  // ✅ FIX: Inclure TVA sur écotaxe (écotaxe × quantité × taux TVA écotaxe)
  const totalTVA =
    items.reduce((sum, item) => {
      const lineHT =
        item.quantity *
        item.unit_price_ht *
        (1 - (item.discount_percentage ?? 0) / 100);
      const lineTVA = lineHT * (item.tax_rate ?? 0.2);
      // TVA sur écotaxe: ecoTaxVatRate est en % (ex: 20), item.tax_rate est en décimal (ex: 0.2)
      const ecoTaxHT = (item.eco_tax ?? 0) * item.quantity;
      const ecoTaxTvaRate =
        ecoTaxVatRate !== null ? ecoTaxVatRate / 100 : item.tax_rate || 0.2;
      const ecoTaxTVA = ecoTaxHT * ecoTaxTvaRate;
      return sum + lineTVA + ecoTaxTVA;
    }, 0) +
    totalCharges * 0.2; // TVA 20% sur les frais

  const totalTTC = totalHTProducts + totalCharges + totalTVA;

  // Memoize excludeProductIds pour éviter re-renders infinis
  const excludeProductIds = useMemo(
    () => items.map(item => item.product_id),
    [items]
  );

  // Gérer le changement de client
  const handleCustomerChange = (customer: UnifiedCustomer | null) => {
    setSelectedCustomer(customer);

    // Pré-remplir automatiquement les conditions de paiement
    if (customer) {
      // Pour les clients particuliers : IMMEDIATE par défaut
      if (customer.type === 'individual') {
        setPaymentTermsType('IMMEDIATE');
        setPaymentTermsNotes('Client particulier - Paiement immédiat requis');
      }
      // Pour les clients professionnels : récupérer depuis organisation
      else if (customer.payment_terms_type) {
        setPaymentTermsType(
          customer.payment_terms_type as Database['public']['Enums']['payment_terms_type']
        );
        setPaymentTermsNotes(customer.payment_terms_notes ?? '');
      } else {
        // Fallback: essayer de déduire depuis l'ancien champ texte
        if (customer.prepayment_required) {
          setPaymentTermsType('IMMEDIATE');
          setPaymentTermsNotes(
            customer.payment_terms
              ? `Prépaiement requis + ${customer.payment_terms} jours`
              : 'Prépaiement requis'
          );
        } else {
          setPaymentTermsType('NET_30'); // Défaut B2B
          setPaymentTermsNotes('');
        }
      }

      // Auto-remplir le canal si disponible
      if (customer.default_channel_id) {
        setChannelId(customer.default_channel_id);
      }
    } else {
      setPaymentTermsType(null);
      setPaymentTermsNotes('');
      setChannelId(null);
    }

    // Pré-remplir automatiquement les adresses quand un client est sélectionné
    if (customer) {
      // Formater l'adresse de livraison
      if (customer.type === 'professional') {
        // Client B2B - Utiliser adresse de livraison ou facturation
        const useShipping =
          (customer.shipping_address_line1 != null &&
            customer.shipping_address_line1 !== '') ||
          (customer.shipping_city != null && customer.shipping_city !== '');
        const shippingParts = [
          customer.name,
          useShipping
            ? customer.shipping_address_line1
            : customer.billing_address_line1,
          useShipping
            ? customer.shipping_address_line2
            : customer.billing_address_line2,
          useShipping
            ? [customer.shipping_postal_code, customer.shipping_city]
                .filter(Boolean)
                .join(' ')
            : [customer.billing_postal_code, customer.billing_city]
                .filter(Boolean)
                .join(' '),
          useShipping ? customer.shipping_region : customer.billing_region,
          useShipping ? customer.shipping_country : customer.billing_country,
        ]
          .filter(Boolean)
          .join('\n');
        setShippingAddress(shippingParts);

        // Adresse de facturation
        const billingParts = [
          customer.name,
          customer.billing_address_line1,
          customer.billing_address_line2,
          [customer.billing_postal_code, customer.billing_city]
            .filter(Boolean)
            .join(' '),
          customer.billing_region,
          customer.billing_country,
        ]
          .filter(Boolean)
          .join('\n');
        setBillingAddress(billingParts);
      } else {
        // Client B2C - Utiliser adresse principale pour livraison
        const shippingParts = [
          customer.name,
          customer.address_line1,
          customer.address_line2,
          [customer.postal_code, customer.city].filter(Boolean).join(' '),
          customer.region,
          customer.country,
        ]
          .filter(Boolean)
          .join('\n');
        setShippingAddress(shippingParts);

        // Adresse de facturation (spécifique ou principale)
        const useSpecificBilling =
          (customer.billing_address_line1_individual != null &&
            customer.billing_address_line1_individual !== '') ||
          (customer.billing_city_individual != null &&
            customer.billing_city_individual !== '');
        const billingParts = [
          customer.name,
          useSpecificBilling
            ? customer.billing_address_line1_individual
            : customer.address_line1,
          useSpecificBilling
            ? customer.billing_address_line2_individual
            : customer.address_line2,
          useSpecificBilling
            ? [
                customer.billing_postal_code_individual,
                customer.billing_city_individual,
              ]
                .filter(Boolean)
                .join(' ')
            : [customer.postal_code, customer.city].filter(Boolean).join(' '),
          useSpecificBilling
            ? customer.billing_region_individual
            : customer.region,
          useSpecificBilling
            ? customer.billing_country_individual
            : customer.country,
        ]
          .filter(Boolean)
          .join('\n');
        setBillingAddress(billingParts);
      }
    } else {
      // Réinitialiser les adresses si pas de client
      setShippingAddress('');
      setBillingAddress('');
    }
  };

  const resetForm = () => {
    // Reset wizard
    setWizardStep('channel-selection');
    setSelectedSalesChannel(null);
    // Reset form data
    setSelectedCustomer(null);
    setExpectedDeliveryDate('');
    setShippingAddress('');
    setBillingAddress('');
    setNotes('');
    setEcoTaxVatRate(null);
    setPaymentTermsType(null);
    setPaymentTermsNotes('');
    setChannelId(null);
    // RFA supprimé - Migration 003
    setItems([]);
    // setProductSearchTerm(''); // DEPRECATED - Migration 003
    setStockWarnings([]);
    // Réinitialiser frais additionnels
    setShippingCostHt(0);
    setInsuranceCostHt(0);
    setHandlingCostHt(0);
    // Reset LinkMe
    setLinkmeAffiliateType(null);
    setLinkmeAffiliateId(null);
    setLinkmeSelectionId(null);
    setLinkmeCart([]);
    setPreviewSelectionId(null);
  };

  // ============================================
  // FONCTIONS LINKME (panier)
  // ============================================

  // Ajouter un produit au panier LinkMe
  const addLinkMeProduct = (item: SelectionItem) => {
    // Calculer le prix affilie HT avec TAUX DE MARQUE
    // Formule: base_price / (1 - marginRate) × (1 + commissionRate)
    // Exemple: 100 / (1 - 0.15) × (1 + 0.10) = 117.65 × 1.10 = 129.41EUR
    const commissionRate = (item.commission_rate ?? 0) / 100;
    const marginRate = (item.margin_rate ?? 0) / 100;
    const sellingPrice =
      (item.base_price_ht / (1 - marginRate)) * (1 + commissionRate);

    const newItem: LinkMeCartItem = {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name ?? 'Produit inconnu',
      sku: item.product?.sku ?? '',
      quantity: 1,
      unit_price_ht: Math.round(sellingPrice * 100) / 100, // 168.75€
      base_price_ht: item.base_price_ht, // 135€ pour calcul commission
      retrocession_rate: marginRate, // 0.15 (15%)
      linkme_selection_item_id: item.id,
      product_image_url: item.product_image_url,
    };

    setLinkmeCart(prev => {
      // Vérifier si le produit est déjà dans le panier
      const existingIndex = prev.findIndex(
        p => p.product_id === item.product_id
      );
      if (existingIndex >= 0) {
        // Augmenter la quantité
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }
      return [...prev, newItem];
    });
  };

  // Mettre à jour la quantité d'un item du panier LinkMe
  const updateLinkMeQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setLinkmeCart(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  // Supprimer un item du panier LinkMe
  const removeLinkMeItem = (itemId: string) => {
    setLinkmeCart(prev => prev.filter(item => item.id !== itemId));
  };

  // Calcul des totaux LinkMe
  const linkmeCartTotals = useMemo(() => {
    let totalHt = 0;
    let totalRetrocession = 0;

    for (const item of linkmeCart) {
      const lineTotal = item.quantity * item.unit_price_ht;
      totalHt += lineTotal;
      // Commission = marge par unité × quantité (SSOT: selling - base)
      totalRetrocession +=
        (item.unit_price_ht - item.base_price_ht) * item.quantity;
    }

    return {
      totalHt: Math.round(totalHt * 100) / 100,
      totalTtc: Math.round(totalHt * 1.2 * 100) / 100, // TVA 20%
      totalRetrocession: Math.round(totalRetrocession * 100) / 100,
      beneficeNet: totalHt - totalRetrocession,
    };
  }, [linkmeCart]);

  // Handler pour la sélection du canal de vente
  const handleChannelSelect = (channel: SalesChannelType) => {
    setSelectedSalesChannel(channel);
    setWizardStep('form');

    // Pré-remplir le canal_id selon le type choisi
    if (channel === 'manual') {
      const manualChannel = availableChannels.find(
        c =>
          c.code === 'MANUEL' ||
          c.code === 'manuel' ||
          c.code === 'general' ||
          c.code === 'GENERAL'
      );
      if (manualChannel) setChannelId(manualChannel.id);
    } else if (channel === 'site-internet') {
      const siteChannel = availableChannels.find(
        c => c.code === 'SITE_INTERNET' || c.code === 'site-internet'
      );
      if (siteChannel) setChannelId(siteChannel.id);
    } else if (channel === 'linkme') {
      const linkmeChannel = availableChannels.find(
        c => c.code === 'LINKME' || c.code === 'linkme'
      );
      if (linkmeChannel) setChannelId(linkmeChannel.id);
    }
  };

  // Handler pour revenir à l'étape précédente
  const handleBackToChannelSelection = () => {
    setWizardStep('channel-selection');
    setSelectedSalesChannel(null);
    setChannelId(null);
  };

  // Détermine si les prix sont modifiables selon le canal
  const isPriceEditable = selectedSalesChannel === 'manual';

  // Calculer le prix d'un produit avec pricing V2
  const calculateProductPrice = async (
    productId: string,
    quantity: number = 1
  ) => {
    if (!selectedCustomer) {
      // Pas de client sélectionné, utiliser prix catalogue de base
      // const product = products.find(p => p.id === productId); // DEPRECATED - no products array
      return {
        unit_price_ht: 0, // TODO: Fetch from catalogue
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    }

    try {
      // Appel Supabase RPC calculate_product_price_v2
      // RPC non typée dans Database types - utiliser helper pour appel non typé
      const rpcCall = supabase.rpc as unknown as (
        fn: string,
        params: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>;

      const { data: rawData, error } = await rpcCall(
        'calculate_product_price_v2',
        {
          p_product_id: productId,
          p_quantity: quantity,
          p_channel_id: channelId, // Canal sélectionné dans le formulaire
          p_customer_id: selectedCustomer.id,
          p_customer_type:
            selectedCustomer.type === 'professional'
              ? 'organization'
              : 'individual',
          p_date: new Date().toISOString().split('T')[0],
        }
      );

      if (error) {
        console.error('Erreur calcul pricing V2:', error);
        // Fallback sur prix catalogue
        return {
          unit_price_ht: 0, // TODO: Fetch from catalogue
          discount_percentage: 0,
          pricing_source: 'base_catalog' as const,
          original_price_ht: 0,
          auto_calculated: false,
        };
      }

      // Cast le résultat brut vers le type attendu
      const pricingResults = rawData as PricingV2Result[] | null;
      const pricingResult = pricingResults?.[0];
      if (pricingResult) {
        return {
          unit_price_ht: pricingResult.price_ht,
          discount_percentage: (pricingResult.discount_rate ?? 0) * 100,
          pricing_source: pricingResult.price_source,
          original_price_ht: pricingResult.original_price,
          auto_calculated: true,
        };
      }

      // Fallback
      // const product = products.find(p => p.id === productId); // DEPRECATED
      return {
        unit_price_ht: 0, // TODO: Fetch from catalogue
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    } catch (err) {
      console.error('Exception calcul pricing:', err);
      // const product = products.find(p => p.id === productId); // DEPRECATED
      return {
        unit_price_ht: 0, // TODO: Fetch from catalogue
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    }
  };

  // Handler sélection produits depuis UniversalProductSelectorV2
  const handleProductsSelect = async (selectedProducts: SelectedProduct[]) => {
    try {
      const newItems: OrderItem[] = [];

      for (const product of selectedProducts) {
        // Vérifier si produit déjà dans la liste
        const existingItem = items.find(item => item.product_id === product.id);

        if (existingItem) {
          // Ignorer si déjà présent (UniversalProductSelectorV2 exclut déjà via excludeProductIds)
          continue;
        }

        // Charger stock disponible
        const stockData = await getAvailableStock(product.id);

        // Calculer pricing V2 avec quantité du modal
        const quantity = product.quantity ?? 1;
        const pricing = await calculateProductPrice(product.id, quantity);

        // Fallback sur prix catalogue si pricing V2 échoue
        const finalPrice =
          pricing.unit_price_ht > 0
            ? pricing.unit_price_ht
            : (product.unit_price ?? 0);

        const finalOriginalPrice =
          pricing.original_price_ht > 0
            ? pricing.original_price_ht
            : (product.unit_price ?? 0);

        const newItem: OrderItem = {
          id: `temp-${Date.now()}-${product.id}`,
          product_id: product.id,
          quantity: quantity,
          unit_price_ht: finalPrice,
          tax_rate: 0.2,
          discount_percentage:
            product.discount_percentage ?? pricing.discount_percentage,
          eco_tax: 0, // TODO: Récupérer eco_tax du produit
          notes: product.notes ?? '',
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku ?? '',
            primary_image_url: product.product_images?.[0]?.public_url,
            stock_quantity: product.stock_real,
            eco_tax_default: 0,
          },
          availableStock: stockData?.stock_available ?? 0,
          pricing_source: pricing.pricing_source,
          original_price_ht: finalOriginalPrice,
          auto_calculated:
            pricing.auto_calculated || finalPrice === (product.unit_price ?? 0),
        };
        newItems.push(newItem);
      }

      // Ajouter tous les nouveaux items
      const updatedItems = [...items, ...newItems];
      setItems(updatedItems);
      await checkAllStockAvailability(updatedItems);

      setShowProductSelector(false);

      toast({
        title: 'Produits ajoutés',
        description: `${newItems.length} produit(s) ajouté(s) à la commande`,
      });
    } catch (error) {
      console.error('Erreur ajout produits:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajouter les produits",
        variant: 'destructive',
      });
    }
  };

  const updateItem = async (
    itemId: string,
    field: keyof OrderItem,
    value: OrderItem[keyof OrderItem]
  ) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    );
    setItems(updatedItems);

    // Revérifier le stock si la quantité a changé
    if (field === 'quantity') {
      await checkAllStockAvailability(updatedItems);
    }
  };

  const removeItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    setItems(updatedItems);
    void checkAllStockAvailability(updatedItems).catch(console.error);
  };

  // ============================================
  // SOUMISSION COMMANDE LINKME
  // ============================================
  const handleLinkMeSubmit = async () => {
    if (
      !selectedCustomer ||
      linkmeCart.length === 0 ||
      !linkmeSelectionDetail?.affiliate_id
    ) {
      toast({
        title: 'Erreur',
        description:
          'Veuillez sélectionner un client et ajouter des produits au panier',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const input: CreateLinkMeOrderInput = {
        customer_type:
          selectedCustomer.type === 'professional'
            ? 'organization'
            : 'individual',
        customer_organisation_id:
          selectedCustomer.type === 'professional' ? selectedCustomer.id : null,
        individual_customer_id:
          selectedCustomer.type === 'individual' ? selectedCustomer.id : null,
        affiliate_id: linkmeSelectionDetail.affiliate_id,
        items: linkmeCart.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          sku: item.sku,
          quantity: item.quantity,
          unit_price_ht: item.unit_price_ht,
          tax_rate: 0.2,
          base_price_ht: item.base_price_ht,
          retrocession_rate: item.retrocession_rate,
          linkme_selection_item_id: item.linkme_selection_item_id,
        })),
        internal_notes: notes || undefined,
      };

      await createLinkMeOrderMutation.mutateAsync(input);

      toast({
        title: 'Commande LinkMe créée',
        description: 'La commande a été créée avec succès.',
      });

      resetForm();
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erreur création commande LinkMe:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande LinkMe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitConfirmed = async () => {
    if (!selectedCustomer || items.length === 0) return;

    setLoading(true);
    try {
      const itemsData = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tax_rate: item.tax_rate, // TVA personnalisée par ligne
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax ?? 0, // Éco-taxe par ligne
        expected_delivery_date: item.expected_delivery_date,
        notes: item.notes,
        is_sample: item.is_sample ?? false, // Marquer comme échantillon
      }));

      if (mode === 'edit' && orderId) {
        // Mode édition : mettre à jour la commande existante
        const updateData = {
          expected_delivery_date: expectedDeliveryDate ?? undefined,
          shipping_address: shippingAddress
            ? { address: shippingAddress }
            : undefined,
          billing_address: billingAddress
            ? { address: billingAddress }
            : undefined,
          payment_terms_type: paymentTermsType ?? undefined,
          payment_terms_notes: paymentTermsNotes ?? undefined,
          channel_id: channelId ?? undefined,
          notes: notes ?? undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          // Frais additionnels clients
          shipping_cost_ht: shippingCostHt ?? 0,
          insurance_cost_ht: insuranceCostHt ?? 0,
          handling_cost_ht: handlingCostHt ?? 0,
        };

        await updateOrderWithItems(orderId, updateData, itemsData);
      } else {
        // Mode création : créer une nouvelle commande
        const orderData: CreateSalesOrderData = {
          customer_id: selectedCustomer.id,
          customer_type:
            selectedCustomer.type === 'professional'
              ? 'organization'
              : 'individual',
          expected_delivery_date: expectedDeliveryDate ?? undefined,
          shipping_address: shippingAddress
            ? { address: shippingAddress }
            : undefined,
          billing_address: billingAddress
            ? { address: billingAddress }
            : undefined,
          payment_terms_type: paymentTermsType ?? undefined,
          payment_terms_notes: paymentTermsNotes ?? undefined,
          channel_id: channelId ?? undefined,
          notes: notes ?? undefined,
          eco_tax_vat_rate: ecoTaxVatRate,
          // Frais additionnels clients
          shipping_cost_ht: shippingCostHt ?? 0,
          insurance_cost_ht: insuranceCostHt ?? 0,
          handling_cost_ht: handlingCostHt ?? 0,
          items: itemsData,
        };

        await createOrder(orderData);
      }

      resetForm();
      setOpen(false);
      setShowConfirmation(false);
      onSuccess?.();
    } catch (error) {
      console.error(
        `Erreur lors de ${mode === 'edit' ? 'la mise à jour' : 'la création'}:`,
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || items.length === 0) return;

    // Ouvrir modal de confirmation
    setShowConfirmation(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonV2 className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </ButtonV2>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit'
              ? 'Modifier la Commande Client'
              : wizardStep === 'channel-selection'
                ? 'Nouvelle Commande Client'
                : `Commande ${selectedSalesChannel === 'manual' ? 'Manuelle' : selectedSalesChannel === 'site-internet' ? 'Site Internet' : 'LinkMe'}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Modifier la commande existante (items, quantités, adresses, dates)'
              : wizardStep === 'channel-selection'
                ? 'Sélectionnez le type de commande à créer'
                : selectedSalesChannel === 'manual'
                  ? 'Créer une commande manuelle avec prix libres'
                  : selectedSalesChannel === 'site-internet'
                    ? 'Créer une commande Site Internet (prix catalogue)'
                    : 'Créer une commande LinkMe (prix sélection)'}
          </DialogDescription>
        </DialogHeader>

        {/* ÉTAPE 1: Sélection du canal de vente (uniquement en mode création) */}
        {mode === 'create' && wizardStep === 'channel-selection' && (
          <div className="py-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Option: Commande Manuelle */}
              <button
                type="button"
                onClick={() => handleChannelSelect('manual')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    Commande Manuelle
                  </h3>
                  <p className="text-sm text-gray-500">
                    Saisie directe avec prix modifiables librement
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
              </button>

              {/* Option: Site Internet */}
              <button
                type="button"
                onClick={() => handleChannelSelect('site-internet')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Site Internet</h3>
                  <p className="text-sm text-gray-500">
                    Commande e-commerce (prix catalogue, remises uniquement)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500" />
              </button>

              {/* Option: LinkMe */}
              <button
                type="button"
                onClick={() => handleChannelSelect('linkme')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">LinkMe</h3>
                  <p className="text-sm text-gray-500">
                    Commande réseau apporteurs (prix sélection, remises
                    uniquement)
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500" />
              </button>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>💡 Note :</strong> Seules les commandes manuelles
                permettent de modifier librement les prix. Les commandes Site
                Internet et LinkMe utilisent les prix définis dans le catalogue
                ou les sélections.
              </p>
            </div>
          </div>
        )}

        {/* ÉTAPE 2: Formulaire (affiché si mode=edit OU si canal sélectionné) */}
        {(mode === 'edit' || wizardStep === 'form') && (
          <>
            {loadingOrder && (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">
                  Chargement de la commande...
                </div>
              </div>
            )}

            {/* Bouton retour (uniquement en mode création) */}
            {mode === 'create' && (
              <div className="mb-4">
                <ButtonV2
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToChannelSelection}
                  className="text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Changer le type de commande
                </ButtonV2>
              </div>
            )}

            {/* ============================================ */}
            {/* WORKFLOW LINKME COMPLET */}
            {/* ============================================ */}
            {selectedSalesChannel === 'linkme' && mode === 'create' && (
              <div className="space-y-6">
                {/* ÉTAPE 1: Type d'affilié */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      Type d&apos;affilié
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setLinkmeAffiliateType('enseigne');
                          setLinkmeAffiliateId(null);
                          setLinkmeSelectionId(null);
                          setLinkmeCart([]);
                        }}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                          linkmeAffiliateType === 'enseigne'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Store
                          className={cn(
                            'h-5 w-5',
                            linkmeAffiliateType === 'enseigne'
                              ? 'text-purple-600'
                              : 'text-gray-400'
                          )}
                        />
                        <div>
                          <p className="font-medium">Enseigne</p>
                          <p className="text-xs text-gray-500">
                            Chaîne de magasins affiliée
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLinkmeAffiliateType('org_independante');
                          setLinkmeAffiliateId(null);
                          setLinkmeSelectionId(null);
                          setLinkmeCart([]);
                        }}
                        className={cn(
                          'flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
                          linkmeAffiliateType === 'org_independante'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <Building2
                          className={cn(
                            'h-5 w-5',
                            linkmeAffiliateType === 'org_independante'
                              ? 'text-purple-600'
                              : 'text-gray-400'
                          )}
                        />
                        <div>
                          <p className="font-medium">
                            Organisation indépendante
                          </p>
                          <p className="text-xs text-gray-500">
                            Entreprise affiliée autonome
                          </p>
                        </div>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                {/* ÉTAPE 2: Sélection Affilié */}
                {linkmeAffiliateType && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-purple-600" />
                        Affilié
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="linkme-affiliate">
                          Sélectionner l&apos;affilié *
                        </Label>
                        {loadingAffiliates ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-sm text-gray-500">
                              Chargement des affiliés...
                            </span>
                          </div>
                        ) : (linkmeAffiliates ?? []).length > 0 ? (
                          <Select
                            value={linkmeAffiliateId ?? ''}
                            onValueChange={value => {
                              setLinkmeAffiliateId(value ?? null);
                              setLinkmeSelectionId(null);
                              setLinkmeCart([]);
                            }}
                            disabled={loading}
                          >
                            <SelectTrigger id="linkme-affiliate">
                              <SelectValue placeholder="Choisir un affilié" />
                            </SelectTrigger>
                            <SelectContent>
                              {(linkmeAffiliates ?? []).map(affiliate => (
                                <SelectItem
                                  key={affiliate.id}
                                  value={affiliate.id}
                                >
                                  {affiliate.display_name}{' '}
                                  <span className="text-muted-foreground">
                                    ({affiliate.selections_count} sélection
                                    {affiliate.selections_count > 1 ? 's' : ''})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-amber-600 py-2">
                            Aucun affilié de ce type disponible
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ÉTAPE 3: Sélection Mini-Boutique */}
                {linkmeAffiliateId && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-purple-600" />
                        Sélection (Mini-boutique)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Label>Sélectionner la sélection *</Label>
                        {loadingSelections ? (
                          <div className="flex items-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                            <span className="text-sm text-gray-500">
                              Chargement des sélections...
                            </span>
                          </div>
                        ) : (linkmeSelections ?? []).length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            Aucune sélection disponible pour cet affilié
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {(linkmeSelections ?? []).map(selection => (
                              <div
                                key={selection.id}
                                className="flex items-center gap-2"
                              >
                                {/* Bouton sélection */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLinkmeSelectionId(selection.id);
                                    setLinkmeCart([]);
                                  }}
                                  disabled={loading}
                                  className={cn(
                                    'flex-1 flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all',
                                    linkmeSelectionId === selection.id
                                      ? 'border-purple-500 bg-purple-50'
                                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                  )}
                                >
                                  <div>
                                    <p className="font-medium">
                                      {selection.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {selection.products_count ?? 0} produit
                                      {(selection.products_count ?? 0) > 1
                                        ? 's'
                                        : ''}{' '}
                                      - {selection.affiliate_name}
                                    </p>
                                  </div>
                                  {linkmeSelectionId === selection.id && (
                                    <ChevronRight className="h-5 w-5 text-purple-600" />
                                  )}
                                </button>
                                {/* Bouton preview */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewSelectionId(selection.id)
                                  }
                                  className="p-3 hover:bg-purple-100 rounded-lg transition-colors border border-gray-200"
                                  title="Aperçu des produits"
                                >
                                  <Eye className="h-4 w-4 text-gray-500 hover:text-purple-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* ÉTAPE 4: Produits de la Sélection */}
                {linkmeSelectionId && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Produits disponibles</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loadingSelectionDetail ? (
                        <div className="flex justify-center py-8">
                          <div className="text-gray-500">
                            Chargement des produits...
                          </div>
                        </div>
                      ) : (linkmeSelectionDetail?.items ?? []).length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Aucun produit dans cette sélection
                        </div>
                      ) : (
                        <div className="grid gap-3 max-h-80 overflow-y-auto pr-2">
                          {(linkmeSelectionDetail?.items ?? []).map(item => {
                            // Prix affilie avec TAUX DE MARQUE
                            // Formule: base_price / (1 - marginRate) × (1 + commissionRate)
                            // commission_rate et margin_rate sont en POURCENTAGE (10 = 10%)
                            const commissionRate =
                              (item.commission_rate ?? 0) / 100;
                            const marginRate = (item.margin_rate ?? 0) / 100;
                            const sellingPrice =
                              (item.base_price_ht / (1 - marginRate)) *
                              (1 + commissionRate);
                            const marginPercent = (
                              item.margin_rate ?? 0
                            ).toFixed(0);
                            const isInCart = linkmeCart.some(
                              c => c.product_id === item.product_id
                            );

                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  'flex items-center justify-between p-3 border rounded-lg',
                                  isInCart
                                    ? 'bg-purple-50 border-purple-200'
                                    : 'hover:bg-gray-50'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {item.product_image_url ? (
                                    <Image
                                      src={item.product_image_url}
                                      alt={item.product?.name ?? 'Produit'}
                                      width={48}
                                      height={48}
                                      className="w-12 h-12 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                      <Store className="h-6 w-6 text-gray-400" />
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-medium">
                                      {item.product?.name ?? 'Produit inconnu'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.product?.sku ?? 'N/A'}
                                    </p>
                                    <p className="text-sm">
                                      <span className="font-semibold text-purple-700">
                                        {formatCurrency(sellingPrice)}
                                      </span>
                                      <span className="text-muted-foreground ml-2">
                                        (marge {marginPercent}%)
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <ButtonV2
                                  type="button"
                                  size="sm"
                                  variant={isInCart ? 'secondary' : 'default'}
                                  onClick={() => addLinkMeProduct(item)}
                                  disabled={loading}
                                >
                                  <Plus className="h-4 w-4" />
                                  {isInCart ? 'Ajouter +1' : 'Ajouter'}
                                </ButtonV2>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* ÉTAPE 5: Panier LinkMe */}
                {linkmeCart.length > 0 && (
                  <Card className="border-purple-200 bg-purple-50/30">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        🛒 Panier ({linkmeCart.length} article
                        {linkmeCart.length > 1 ? 's' : ''})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produit</TableHead>
                            <TableHead className="w-24">Qté</TableHead>
                            <TableHead className="w-28">Prix</TableHead>
                            <TableHead className="w-28">Total</TableHead>
                            <TableHead className="w-16" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {linkmeCart.map(item => (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {item.product_image_url && (
                                    <Image
                                      src={item.product_image_url}
                                      alt={item.product_name}
                                      width={32}
                                      height={32}
                                      className="w-8 h-8 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <p className="font-medium text-sm">
                                      {item.product_name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.sku}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={e =>
                                    updateLinkMeQuantity(
                                      item.id,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-16 h-8 text-sm"
                                  disabled={loading}
                                />
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatCurrency(item.unit_price_ht)}
                              </TableCell>
                              <TableCell className="font-medium text-sm">
                                {formatCurrency(
                                  item.quantity * item.unit_price_ht
                                )}
                              </TableCell>
                              <TableCell>
                                <ButtonV2
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLinkMeItem(item.id)}
                                  disabled={loading}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </ButtonV2>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Totaux */}
                      <div className="mt-4 pt-4 border-t border-purple-200 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Total HT :</span>
                          <span className="font-semibold">
                            {formatCurrency(linkmeCartTotals.totalHt)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total TTC (TVA 20%) :</span>
                          <span className="font-semibold">
                            {formatCurrency(linkmeCartTotals.totalTtc)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-purple-700">
                          <span>Commission affilié :</span>
                          <span className="font-semibold">
                            {formatCurrency(linkmeCartTotals.totalRetrocession)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-green-700">
                          <span>Bénéfice net :</span>
                          <span className="font-semibold">
                            {formatCurrency(linkmeCartTotals.beneficeNet)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Notes (optionnel)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Notes internes sur la commande..."
                      disabled={loading}
                    />
                  </CardContent>
                </Card>

                {/* Actions LinkMe */}
                <div className="flex justify-end gap-4">
                  <ButtonV2
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Annuler
                  </ButtonV2>
                  <ButtonV2
                    type="button"
                    onClick={() => {
                      void handleLinkMeSubmit().catch(console.error);
                    }}
                    disabled={
                      loading ||
                      !selectedCustomer ||
                      linkmeCart.length === 0 ||
                      !linkmeSelectionDetail?.affiliate_id
                    }
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? 'Création...' : 'Créer la commande LinkMe'}
                  </ButtonV2>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* FORMULAIRE STANDARD (Manual + Site Internet) */}
            {/* ============================================ */}
            {(selectedSalesChannel !== 'linkme' || mode === 'edit') && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Alertes de stock */}
                {stockWarnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium">
                          Problèmes de stock détectés :
                        </p>
                        {stockWarnings.map((warning, index) => (
                          <p key={index} className="text-sm">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <CustomerSelector
                      selectedCustomer={selectedCustomer}
                      onCustomerChange={handleCustomerChange}
                      disabled={loading}
                    />
                    {mode === 'edit' && (
                      <p className="text-sm text-gray-500 italic">
                        Le client ne peut pas être modifié pour une commande
                        existante
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deliveryDate">
                          Date de livraison prévue
                        </Label>
                        <Input
                          id="deliveryDate"
                          type="date"
                          value={expectedDeliveryDate}
                          onChange={e =>
                            setExpectedDeliveryDate(e.target.value)
                          }
                          disabled={loading}
                        />
                      </div>

                      {/* Conditions de paiement (enum + notes) */}
                      <div className="space-y-2">
                        <Label htmlFor="paymentTermsType">
                          Conditions de paiement
                        </Label>
                        <Select
                          value={paymentTermsType ?? undefined}
                          onValueChange={value =>
                            setPaymentTermsType(
                              value as Database['public']['Enums']['payment_terms_type']
                            )
                          }
                          disabled={loading || !selectedCustomer}
                        >
                          <SelectTrigger id="paymentTermsType">
                            <SelectValue placeholder="Sélectionnez les conditions" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IMMEDIATE">
                              Paiement immédiat (comptant)
                            </SelectItem>
                            <SelectItem value="NET_15">Net 15 jours</SelectItem>
                            <SelectItem value="NET_30">Net 30 jours</SelectItem>
                            <SelectItem value="NET_45">Net 45 jours</SelectItem>
                            <SelectItem value="NET_60">Net 60 jours</SelectItem>
                            <SelectItem value="NET_90">Net 90 jours</SelectItem>
                            <SelectItem value="CUSTOM">
                              Conditions personnalisées
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Notes complémentaires si CUSTOM */}
                        {paymentTermsType === 'CUSTOM' && (
                          <Textarea
                            placeholder="Décrivez les conditions personnalisées..."
                            value={paymentTermsNotes}
                            onChange={e => setPaymentTermsNotes(e.target.value)}
                            rows={2}
                            disabled={loading}
                          />
                        )}

                        {selectedCustomer && (
                          <p className="text-xs text-gray-500">
                            {selectedCustomer.type === 'individual'
                              ? 'Paiement immédiat requis pour les clients particuliers'
                              : 'Auto-rempli depuis la fiche client. Modifiable si nécessaire.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Canal de vente */}
                    <div className="space-y-2">
                      <Label htmlFor="channelId">Canal de vente</Label>
                      <Select
                        value={channelId ?? ''}
                        onValueChange={value => setChannelId(value ?? null)}
                        disabled={loading || !selectedCustomer}
                      >
                        <SelectTrigger id="channelId">
                          <SelectValue placeholder="Sélectionnez un canal" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableChannels.map(channel => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCustomer && (
                        <p className="text-xs text-gray-500">
                          Canal utilisé pour cette commande (affecte les prix et
                          le suivi)
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <AddressInput
                        label="Adresse de livraison"
                        value={shippingAddress}
                        onChange={setShippingAddress}
                        selectedCustomer={selectedCustomer}
                        addressType="shipping"
                        placeholder="Adresse complète de livraison"
                        disabled={loading}
                      />

                      <AddressInput
                        label="Adresse de facturation"
                        value={billingAddress}
                        onChange={setBillingAddress}
                        selectedCustomer={selectedCustomer}
                        addressType="billing"
                        placeholder="Adresse complète de facturation"
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notes sur la commande"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <EcoTaxVatInput
                        value={ecoTaxVatRate}
                        onChange={setEcoTaxVatRate}
                        defaultTaxRate={20}
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Frais additionnels clients */}
                <Card>
                  <CardHeader>
                    <CardTitle>Frais additionnels</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCostHt">
                        Frais de livraison HT (€)
                      </Label>
                      <Input
                        id="shippingCostHt"
                        type="number"
                        min="0"
                        step="0.01"
                        value={shippingCostHt || ''}
                        onChange={e =>
                          setShippingCostHt(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="insuranceCostHt">
                        Frais d'assurance HT (€)
                      </Label>
                      <Input
                        id="insuranceCostHt"
                        type="number"
                        min="0"
                        step="0.01"
                        value={insuranceCostHt || ''}
                        onChange={e =>
                          setInsuranceCostHt(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="handlingCostHt">
                        Frais de manutention HT (€)
                      </Label>
                      <Input
                        id="handlingCostHt"
                        type="number"
                        min="0"
                        step="0.01"
                        value={handlingCostHt || ''}
                        onChange={e =>
                          setHandlingCostHt(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        disabled={loading}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Articles */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Articles</CardTitle>
                    <ButtonV2
                      type="button"
                      variant="outline"
                      onClick={() => setShowProductSelector(true)}
                      disabled={loading}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter des produits
                    </ButtonV2>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Aucun produit ajouté
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Produit</TableHead>
                              <TableHead className="w-20">Quantité</TableHead>
                              <TableHead className="w-28">
                                Prix unitaire HT
                              </TableHead>
                              <TableHead className="w-24">Remise (%)</TableHead>
                              <TableHead className="w-24">
                                Éco-taxe (€)
                              </TableHead>
                              <TableHead className="w-28">Total HT</TableHead>
                              <TableHead className="w-20">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.map(item => {
                              const itemSubtotal =
                                item.quantity *
                                item.unit_price_ht *
                                (1 - (item.discount_percentage ?? 0) / 100);
                              // ✅ FIX: Écotaxe × quantité
                              const itemTotal =
                                itemSubtotal +
                                (item.eco_tax ?? 0) * item.quantity;

                              return (
                                <TableRow key={item.id}>
                                  {/* Produit avec image */}
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {item.product?.primary_image_url && (
                                        <Image
                                          src={item.product.primary_image_url}
                                          alt={item.product.name}
                                          width={32}
                                          height={32}
                                          className="w-8 h-8 object-cover rounded"
                                        />
                                      )}
                                      <span className="font-medium text-sm truncate max-w-[180px]">
                                        {item.product?.name}
                                      </span>
                                    </div>
                                  </TableCell>
                                  {/* Quantité */}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={item.quantity}
                                      onChange={e => {
                                        void updateItem(
                                          item.id,
                                          'quantity',
                                          parseInt(e.target.value) || 1
                                        ).catch(console.error);
                                      }}
                                      className="w-16 h-8 text-sm"
                                      disabled={loading}
                                    />
                                  </TableCell>
                                  {/* Prix unitaire HT */}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={item.unit_price_ht}
                                      onChange={e => {
                                        void updateItem(
                                          item.id,
                                          'unit_price_ht',
                                          parseFloat(e.target.value) || 0
                                        ).catch(console.error);
                                      }}
                                      className={cn(
                                        'w-24 h-8 text-sm',
                                        !isPriceEditable &&
                                          'bg-muted cursor-not-allowed'
                                      )}
                                      disabled={loading || !isPriceEditable}
                                      title={
                                        !isPriceEditable
                                          ? 'Prix non modifiable pour ce canal'
                                          : undefined
                                      }
                                    />
                                  </TableCell>
                                  {/* Remise (%) */}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      value={item.discount_percentage ?? 0}
                                      onChange={e => {
                                        void updateItem(
                                          item.id,
                                          'discount_percentage',
                                          parseFloat(e.target.value) || 0
                                        ).catch(console.error);
                                      }}
                                      className="w-20 h-8 text-sm"
                                      disabled={loading}
                                    />
                                  </TableCell>
                                  {/* Éco-taxe (€) */}
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={(item.eco_tax ?? 0).toFixed(2)}
                                      onChange={e => {
                                        void updateItem(
                                          item.id,
                                          'eco_tax',
                                          parseFloat(e.target.value) || 0
                                        ).catch(console.error);
                                      }}
                                      className="w-20 h-8 text-sm"
                                      disabled={loading}
                                    />
                                  </TableCell>
                                  {/* Total HT */}
                                  <TableCell className="font-medium text-sm whitespace-nowrap">
                                    {formatCurrency(itemTotal)}
                                  </TableCell>
                                  {/* Actions */}
                                  <TableCell>
                                    <ButtonV2
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeItem(item.id)}
                                      disabled={loading}
                                      title="Supprimer"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </ButtonV2>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* RFA supprimé - Migration 003 */}

                {/* Totaux */}
                {items.length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-end space-y-2">
                        <div className="text-right space-y-1">
                          <p className="text-lg">
                            <span className="font-medium">
                              Total HT produits:
                            </span>{' '}
                            {formatCurrency(totalHTProducts)}
                          </p>
                          {totalCharges > 0 && (
                            <p className="text-sm text-gray-600">
                              Frais additionnels: {formatCurrency(totalCharges)}
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            TVA: {formatCurrency(totalTVA)}
                          </p>
                          <p className="text-xl font-bold">
                            Total TTC: {formatCurrency(totalTTC)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-4">
                  <ButtonV2
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                  >
                    Annuler
                  </ButtonV2>
                  <ButtonV2
                    type="submit"
                    disabled={
                      loading ||
                      loadingOrder ||
                      !selectedCustomer ||
                      items.length === 0
                    }
                  >
                    {loading
                      ? mode === 'edit'
                        ? 'Mise à jour...'
                        : 'Création...'
                      : mode === 'edit'
                        ? 'Mettre à jour la commande'
                        : 'Créer la commande'}
                  </ButtonV2>
                </div>
              </form>
            )}
          </>
        )}

        {/* Modal UniversalProductSelectorV2 */}
        {showProductSelector && (
          <UniversalProductSelectorV2
            open={showProductSelector}
            onClose={() => setShowProductSelector(false)}
            onSelect={handleProductsSelect}
            mode="multi"
            context="orders"
            title="Sélectionner des produits pour la commande"
            description="Choisissez les produits à ajouter. Vous pourrez ajuster quantités et prix après sélection."
            excludeProductIds={excludeProductIds}
            showImages
            showQuantity
            showPricing={false}
          />
        )}
      </DialogContent>

      {/* AlertDialog de confirmation */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {mode === 'edit'
                ? 'Confirmer la mise à jour'
                : 'Confirmer la création de la commande'}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {mode === 'edit' ? (
                  <span>
                    Vous êtes sur le point de mettre à jour la commande avec{' '}
                    {items.length} article(s).
                  </span>
                ) : (
                  <span>
                    Vous êtes sur le point de créer une commande client pour{' '}
                    <span className="font-semibold">
                      {selectedCustomer?.name}
                    </span>{' '}
                    avec {items.length} article(s) pour un montant total de{' '}
                    <span className="font-semibold">
                      {formatCurrency(totalTTC)}
                    </span>
                    .
                  </span>
                )}
                {stockWarnings.length > 0 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm font-medium text-amber-800">
                      ⚠️ Attention : Stock insuffisant
                    </p>
                    <ul className="mt-1 text-xs text-amber-700 space-y-1">
                      {stockWarnings.slice(0, 3).map((warning, i) => (
                        <li key={i}>• {warning}</li>
                      ))}
                      {stockWarnings.length > 3 && (
                        <li>... et {stockWarnings.length - 3} autres</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleSubmitConfirmed().catch(console.error);
              }}
              disabled={loading}
            >
              {loading
                ? mode === 'edit'
                  ? 'Mise à jour...'
                  : 'Création...'
                : mode === 'edit'
                  ? 'Mettre à jour'
                  : 'Créer la commande'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Preview Sélection */}
      {previewSelectionId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                Aperçu : {previewSelection?.name ?? 'Chargement...'}
              </h3>
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {previewLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                </div>
              ) : !previewSelection?.items?.length ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun produit dans cette sélection
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {previewSelection.items.map(item => {
                    // Prix affilie avec TAUX DE MARQUE
                    // Formule: base_price / (1 - marginRate) × (1 + commissionRate)
                    // commission_rate et margin_rate sont en POURCENTAGE (10 = 10%)
                    const commissionRate = (item.commission_rate ?? 0) / 100;
                    const marginRate = (item.margin_rate ?? 0) / 100;
                    const sellingPrice =
                      (item.base_price_ht / (1 - marginRate)) *
                      (1 + commissionRate);
                    return (
                      <div
                        key={item.id}
                        className="border rounded-lg p-2 bg-gray-50"
                      >
                        <div className="w-16 h-16 mx-auto mb-2 overflow-hidden rounded">
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.product?.name ?? 'Produit'}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-center truncate">
                          {item.product?.name ?? 'Produit'}
                        </p>
                        <p className="text-xs text-gray-500 text-center">
                          {formatCurrency(sellingPrice)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setPreviewSelectionId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
