'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { useToast } from '@verone/common/hooks';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { useStockMovements } from '@verone/stock/hooks';
import type { Database } from '@verone/types';
import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Plus, ArrowLeft } from 'lucide-react';

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
import { ChannelSelector } from './sales-order-form/ChannelSelector';
import { LinkMeWorkflow } from './sales-order-form/LinkMeWorkflow';
import { OrderConfirmationDialog } from './sales-order-form/OrderConfirmationDialog';
import type { OrderItem } from './sales-order-form/OrderItemsTable';
import { StandardOrderForm } from './sales-order-form/StandardOrderForm';
import type { LinkMeCartItem } from './sales-order-form/LinkMeCartTable';

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

// Types pour le wizard de création
type SalesChannelType = 'manual' | 'site-internet' | 'linkme';
type WizardStep = 'channel-selection' | 'form';

interface SalesOrderFormModalProps {
  mode?: 'create' | 'edit';
  orderId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  buttonLabel?: string;
  /** Callback quand l'utilisateur clique "LinkMe" dans le wizard canal (ex: redirection) */
  onLinkMeClick?: () => void;
}

export function SalesOrderFormModal({
  mode = 'create',
  orderId,
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  buttonLabel = 'Nouvelle commande',
  onLinkMeClick,
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
  const [orderDate, setOrderDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<
    string | null
  >(null);
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
    useLinkMeSelection(linkmeSelectionId);
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
        setOrderDate(
          order.order_date ?? new Date().toISOString().split('T')[0]
        );
        setExpectedDeliveryDate(order.expected_delivery_date ?? null);
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
  const totalHTProducts = items.reduce((sum, item) => {
    const itemSubtotal =
      item.quantity *
      item.unit_price_ht *
      (1 - (item.discount_percentage ?? 0) / 100);
    const itemEcoTax = (item.eco_tax ?? 0) * item.quantity;
    return sum + itemSubtotal + itemEcoTax;
  }, 0);

  // Total des frais additionnels
  const totalCharges = shippingCostHt + insuranceCostHt + handlingCostHt;

  // TVA calculée dynamiquement par ligne avec taux spécifique + TVA sur frais (20%)
  const totalTVA =
    items.reduce((sum, item) => {
      const lineHT =
        item.quantity *
        item.unit_price_ht *
        (1 - (item.discount_percentage ?? 0) / 100);
      const lineTVA = lineHT * (item.tax_rate ?? 0.2);
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
    setOrderDate(new Date().toISOString().split('T')[0]);
    setExpectedDeliveryDate(null);
    setShippingAddress('');
    setBillingAddress('');
    setNotes('');
    setEcoTaxVatRate(null);
    setPaymentTermsType(null);
    setPaymentTermsNotes('');
    setChannelId(null);
    setItems([]);
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
  };

  // ============================================
  // FONCTIONS LINKME (panier)
  // ============================================

  // Ajouter un produit au panier LinkMe
  const addLinkMeProduct = (item: SelectionItem) => {
    // Prix de vente = selling_price_ht (GENERATED column en DB, modele additif)
    // Fallback: base_price * (1 + margin_rate / 100)
    const sellingPrice =
      item.selling_price_ht ??
      item.base_price_ht * (1 + (item.margin_rate ?? 0) / 100);
    const marginRate = (item.margin_rate ?? 0) / 100;

    const newItem: LinkMeCartItem = {
      id: `${item.product_id}-${Date.now()}`,
      product_id: item.product_id,
      product_name: item.product?.name ?? 'Produit inconnu',
      sku: item.product?.sku ?? '',
      quantity: 1,
      unit_price_ht: Math.round(sellingPrice * 100) / 100,
      base_price_ht: item.base_price_ht,
      retrocession_rate: marginRate,
      commission_rate: (item.commission_rate ?? 0) / 100,
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

  // Calcul des totaux LinkMe (catalogue + produits utilisateur)
  const linkmeCartTotals = useMemo(() => {
    let totalHt = 0;
    let commissionAffilie = 0;
    let fraisLinkMe = 0;
    let redevanceAffilie = 0;

    for (const item of linkmeCart) {
      const lineTotal = item.quantity * item.unit_price_ht;
      totalHt += lineTotal;

      if (item.commission_rate > 0) {
        // Produit UTILISATEUR: Verone preleve commission_rate%
        const frais = item.unit_price_ht * item.commission_rate * item.quantity;
        fraisLinkMe += frais;
        redevanceAffilie += lineTotal - frais;
      } else {
        // Produit CATALOGUE: l'affilie gagne la marge
        commissionAffilie +=
          (item.unit_price_ht - item.base_price_ht) * item.quantity;
      }
    }

    return {
      totalHt: Math.round(totalHt * 100) / 100,
      totalTtc: Math.round(totalHt * 1.2 * 100) / 100,
      totalRetrocession: Math.round(commissionAffilie * 100) / 100,
      fraisLinkMe: Math.round(fraisLinkMe * 100) / 100,
      redevanceAffilie: Math.round(redevanceAffilie * 100) / 100,
      caNetVerone:
        Math.round((totalHt - commissionAffilie - redevanceAffilie) * 100) /
        100,
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
      return {
        unit_price_ht: 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    }

    try {
      const { data: rawData, error } = await supabase.rpc(
        'calculate_product_price_v2',
        {
          p_product_id: productId,
          p_quantity: quantity,
          p_channel_id: channelId ?? undefined,
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
        return {
          unit_price_ht: 0,
          discount_percentage: 0,
          pricing_source: 'base_catalog' as const,
          original_price_ht: 0,
          auto_calculated: false,
        };
      }

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

      return {
        unit_price_ht: 0,
        discount_percentage: 0,
        pricing_source: 'base_catalog' as const,
        original_price_ht: 0,
        auto_calculated: false,
      };
    } catch (err) {
      console.error('Exception calcul pricing:', err);
      return {
        unit_price_ht: 0,
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
          eco_tax: 0,
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
          base_price_ht: item.base_price_ht,
          retrocession_rate: item.retrocession_rate,
          linkme_selection_item_id: item.linkme_selection_item_id,
        })),
        order_date: orderDate,
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
        tax_rate: item.tax_rate,
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax ?? 0,
        expected_delivery_date: item.expected_delivery_date,
        notes: item.notes,
        is_sample: item.is_sample ?? false,
      }));

      if (mode === 'edit' && orderId) {
        // Mode édition : mettre à jour la commande existante
        const updateData = {
          order_date: orderDate,
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
          order_date: orderDate,
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

  // Wrapper for updateItem to handle the async call from synchronous child
  const handleUpdateItem = (
    itemId: string,
    field: keyof OrderItem,
    value: OrderItem[keyof OrderItem]
  ) => {
    void updateItem(itemId, field, value).catch(console.error);
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
              ? 'Back-office - Modifier la commande client'
              : wizardStep === 'channel-selection'
                ? 'Back-office - Nouvelle commande client'
                : `Back-office - Commande ${selectedSalesChannel === 'manual' ? 'Manuelle' : selectedSalesChannel === 'site-internet' ? 'Site Internet' : 'LinkMe'}`}
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

        {/* STEP 1: Channel selection (create mode only) */}
        {mode === 'create' && wizardStep === 'channel-selection' && (
          <ChannelSelector
            onChannelSelect={handleChannelSelect}
            onLinkMeClick={onLinkMeClick}
            onClose={() => setOpen(false)}
          />
        )}

        {/* STEP 2: Form (shown if mode=edit OR channel selected) */}
        {(mode === 'edit' || wizardStep === 'form') && (
          <>
            {loadingOrder && (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">
                  Chargement de la commande...
                </div>
              </div>
            )}

            {/* Back button (create mode only) */}
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

            {/* LINKME WORKFLOW */}
            {selectedSalesChannel === 'linkme' && mode === 'create' && (
              <LinkMeWorkflow
                affiliateType={linkmeAffiliateType}
                onAffiliateTypeChange={setLinkmeAffiliateType}
                affiliateId={linkmeAffiliateId}
                onAffiliateIdChange={setLinkmeAffiliateId}
                affiliates={linkmeAffiliates}
                loadingAffiliates={loadingAffiliates}
                selectionId={linkmeSelectionId}
                onSelectionIdChange={setLinkmeSelectionId}
                selections={linkmeSelections}
                loadingSelections={loadingSelections}
                selectionDetail={linkmeSelectionDetail}
                loadingSelectionDetail={loadingSelectionDetail}
                cart={linkmeCart}
                cartTotals={linkmeCartTotals}
                onAddProduct={addLinkMeProduct}
                onUpdateQuantity={updateLinkMeQuantity}
                onRemoveItem={removeLinkMeItem}
                onClearCart={() => setLinkmeCart([])}
                notes={notes}
                onNotesChange={setNotes}
                loading={loading}
                canSubmit={
                  !loading &&
                  !!selectedCustomer &&
                  linkmeCart.length > 0 &&
                  !!linkmeSelectionDetail?.affiliate_id
                }
                onSubmit={() => {
                  void handleLinkMeSubmit().catch(console.error);
                }}
                onCancel={() => setOpen(false)}
                previewSelection={previewSelection}
                previewLoading={previewLoading}
              />
            )}

            {/* STANDARD FORM (Manual + Site Internet) */}
            {(selectedSalesChannel !== 'linkme' || mode === 'edit') && (
              <StandardOrderForm
                mode={mode}
                loading={loading}
                loadingOrder={loadingOrder}
                selectedCustomer={selectedCustomer}
                onCustomerChange={handleCustomerChange}
                orderDate={orderDate}
                onOrderDateChange={setOrderDate}
                expectedDeliveryDate={expectedDeliveryDate}
                onExpectedDeliveryDateChange={setExpectedDeliveryDate}
                paymentTermsType={paymentTermsType}
                onPaymentTermsTypeChange={setPaymentTermsType}
                paymentTermsNotes={paymentTermsNotes}
                onPaymentTermsNotesChange={setPaymentTermsNotes}
                shippingAddress={shippingAddress}
                onShippingAddressChange={setShippingAddress}
                billingAddress={billingAddress}
                onBillingAddressChange={setBillingAddress}
                notes={notes}
                onNotesChange={setNotes}
                ecoTaxVatRate={ecoTaxVatRate}
                onEcoTaxVatRateChange={setEcoTaxVatRate}
                shippingCostHt={shippingCostHt}
                onShippingCostHtChange={setShippingCostHt}
                insuranceCostHt={insuranceCostHt}
                onInsuranceCostHtChange={setInsuranceCostHt}
                handlingCostHt={handlingCostHt}
                onHandlingCostHtChange={setHandlingCostHt}
                items={items}
                isPriceEditable={isPriceEditable}
                onUpdateItem={handleUpdateItem}
                onRemoveItem={removeItem}
                showProductSelector={showProductSelector}
                onShowProductSelectorChange={setShowProductSelector}
                onProductsSelect={handleProductsSelect}
                excludeProductIds={excludeProductIds}
                totalHTProducts={totalHTProducts}
                totalCharges={totalCharges}
                totalTVA={totalTVA}
                totalTTC={totalTTC}
                stockWarnings={stockWarnings}
                onSubmit={handleSubmit}
                onCancel={() => setOpen(false)}
              />
            )}
          </>
        )}
      </DialogContent>

      {/* Confirmation dialog */}
      <OrderConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        onConfirm={() => {
          void handleSubmitConfirmed().catch(console.error);
        }}
        loading={loading}
        mode={mode}
        customerName={selectedCustomer?.name}
        itemCount={items.length}
        totalTTC={totalTTC}
        stockWarnings={stockWarnings}
      />
    </Dialog>
  );
}
