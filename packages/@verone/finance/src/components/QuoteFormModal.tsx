'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { AddressInput } from '@verone/common/components/address/AddressInput';
import { useToast } from '@verone/common/hooks';
import type {
  CreateQuoteData,
  CreateQuoteItemData,
} from '@verone/finance/hooks';
import { useQuotes } from '@verone/finance/hooks';
import {
  CustomerSelector,
  type UnifiedCustomer,
} from '@verone/orders/components/modals/customer-selector';
import { AddProductToOrderModal } from '@verone/orders/components/modals/AddProductToOrderModal';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatCurrency } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Plus,
  X,
  Trash2,
  Store,
  Globe,
  Link2,
  Briefcase,
  ChevronRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type QuoteChannelType = 'manual' | 'site-internet' | 'linkme' | 'service';
type WizardStep = 'channel-selection' | 'form';

interface QuoteItemLocal {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage: number;
  eco_tax: number;
  is_service: boolean; // true for free-form service lines
  product?: {
    name: string;
    sku: string;
    primary_image_url?: string;
  };
}

interface QuoteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// =====================================================================
// COMPONENT
// =====================================================================

export function QuoteFormModal({
  open,
  onOpenChange,
  onSuccess,
}: QuoteFormModalProps): React.ReactNode {
  const { toast } = useToast();
  const { createQuote } = useQuotes();
  const supabase = createClient();

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('channel-selection');
  const [selectedChannel, setSelectedChannel] =
    useState<QuoteChannelType | null>(null);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [availableChannels, setAvailableChannels] = useState<
    Array<{ id: string; name: string; code: string }>
  >([]);

  // Customer
  const [selectedCustomer, setSelectedCustomer] =
    useState<UnifiedCustomer | null>(null);

  // Items
  const [items, setItems] = useState<QuoteItemLocal[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);

  // Quote options
  const [validityDays, setValidityDays] = useState('30');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Fees
  const [shippingCostHt, setShippingCostHt] = useState(0);
  const [handlingCostHt, setHandlingCostHt] = useState(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState(0);
  const [feesVatRate, setFeesVatRate] = useState(0.2);

  // Addresses
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -----------------------------------------------------------------
  // Load sales channels
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!open) return;

    const loadChannels = async () => {
      const { data, error } = await supabase
        .from('sales_channels')
        .select('id, name, code')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error(
          '[QuoteFormModal] Failed to load channels:',
          error.message
        );
        return;
      }
      setAvailableChannels(data ?? []);
    };

    void loadChannels().catch((err: unknown) => {
      console.error('[QuoteFormModal] loadChannels error:', err);
    });
  }, [open, supabase]);

  // -----------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------
  const resetForm = useCallback(() => {
    setWizardStep('channel-selection');
    setSelectedChannel(null);
    setChannelId(null);
    setSelectedCustomer(null);
    setItems([]);
    setValidityDays('30');
    setReference('');
    setNotes('');
    setShippingCostHt(0);
    setHandlingCostHt(0);
    setInsuranceCostHt(0);
    setFeesVatRate(0.2);
    setBillingAddress('');
    setShippingAddress('');
    setIsSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [resetForm, onOpenChange]);

  const handleChannelSelect = useCallback(
    (channel: QuoteChannelType) => {
      setSelectedChannel(channel);
      setWizardStep('form');

      // Set channel_id from available channels
      if (channel === 'manual') {
        const ch = availableChannels.find(
          c =>
            c.code === 'MANUEL' || c.code === 'manuel' || c.code === 'general'
        );
        if (ch) setChannelId(ch.id);
      } else if (channel === 'site-internet') {
        const ch = availableChannels.find(
          c => c.code === 'SITE_INTERNET' || c.code === 'site-internet'
        );
        if (ch) setChannelId(ch.id);
      } else if (channel === 'linkme') {
        const ch = availableChannels.find(
          c => c.code === 'LINKME' || c.code === 'linkme'
        );
        if (ch) setChannelId(ch.id);
      } else if (channel === 'service') {
        // Service quotes don't need a specific channel
        setChannelId(null);
      }

      // For service channel, add a default empty service line
      if (channel === 'service') {
        setItems([
          {
            id: generateId(),
            product_id: null,
            description: '',
            quantity: 1,
            unit_price_ht: 0,
            tva_rate: 20,
            discount_percentage: 0,
            eco_tax: 0,
            is_service: true,
          },
        ]);
      }
    },
    [availableChannels]
  );

  const handleBackToChannelSelection = useCallback(() => {
    setWizardStep('channel-selection');
    setSelectedChannel(null);
    setChannelId(null);
    setItems([]);
  }, []);

  // Add product from catalog (for manual/site-internet/linkme)
  const handleAddProduct = useCallback(
    (data: {
      product_id: string;
      quantity: number;
      unit_price_ht: number;
      tax_rate?: number;
      discount_percentage?: number;
      eco_tax_ht?: number;
      notes?: string;
      product_name?: string;
      product_sku?: string;
      product_image_url?: string;
    }) => {
      const newItem: QuoteItemLocal = {
        id: generateId(),
        product_id: data.product_id,
        description: data.product_name ?? '',
        quantity: data.quantity,
        unit_price_ht: data.unit_price_ht,
        tva_rate: (data.tax_rate ?? 0.2) * 100, // Convert from 0.2 to 20
        discount_percentage: data.discount_percentage ?? 0,
        eco_tax: data.eco_tax_ht ?? 0,
        is_service: false,
        product: {
          name: data.product_name ?? '',
          sku: data.product_sku ?? '',
          primary_image_url: data.product_image_url,
        },
      };
      setItems(prev => [...prev, newItem]);
      setShowAddProduct(false);
    },
    []
  );

  // Add service line (for service channel)
  const handleAddServiceLine = useCallback(() => {
    setItems(prev => [
      ...prev,
      {
        id: generateId(),
        product_id: null,
        description: '',
        quantity: 1,
        unit_price_ht: 0,
        tva_rate: 20,
        discount_percentage: 0,
        eco_tax: 0,
        is_service: true,
      },
    ]);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const handleItemChange = useCallback(
    (itemId: string, field: keyof QuoteItemLocal, value: string | number) => {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  // -----------------------------------------------------------------
  // Computed totals
  // -----------------------------------------------------------------
  const totals = useMemo(() => {
    let itemsTotalHt = 0;
    let itemsTva = 0;

    // Group TVA by rate
    const tvaByRate: Record<number, { base: number; tva: number }> = {};

    for (const item of items) {
      const discountMultiplier = 1 - (item.discount_percentage ?? 0) / 100;
      const lineHt =
        item.quantity * item.unit_price_ht * discountMultiplier +
        (item.eco_tax ?? 0) * item.quantity;
      const lineTva = lineHt * (item.tva_rate / 100);

      itemsTotalHt += lineHt;
      itemsTva += lineTva;

      const rate = item.tva_rate;
      if (!tvaByRate[rate]) tvaByRate[rate] = { base: 0, tva: 0 };
      tvaByRate[rate].base += lineHt;
      tvaByRate[rate].tva += lineTva;
    }

    const feesTotalHt = shippingCostHt + handlingCostHt + insuranceCostHt;
    const feesTva = feesTotalHt * feesVatRate;

    const totalHt = itemsTotalHt + feesTotalHt;
    const totalTva = itemsTva + feesTva;
    const totalTtc = totalHt + totalTva;

    return {
      itemsTotalHt,
      itemsTva,
      feesTotalHt,
      feesTva,
      totalHt,
      totalTva,
      totalTtc,
      tvaByRate,
    };
  }, [items, shippingCostHt, handlingCostHt, insuranceCostHt, feesVatRate]);

  // -----------------------------------------------------------------
  // Submit
  // -----------------------------------------------------------------
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!selectedCustomer) {
      toast({
        title: 'Client requis',
        description: 'Veuillez sélectionner un client',
        variant: 'destructive',
      });
      return;
    }

    const validItems = items.filter(
      i =>
        (i.is_service ? i.description.trim() : i.product_id) &&
        i.unit_price_ht > 0
    );

    if (validItems.length === 0) {
      toast({
        title: 'Articles requis',
        description: 'Ajoutez au moins un article ou une prestation',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const customerType: 'organization' | 'individual' =
        selectedCustomer.type === 'professional'
          ? 'organization'
          : 'individual';

      const quoteItems: CreateQuoteItemData[] = validItems.map(item => ({
        product_id: item.product_id,
        description: item.is_service
          ? item.description
          : (item.product?.name ?? item.description),
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        tva_rate: item.tva_rate,
        discount_percentage: item.discount_percentage,
        eco_tax: item.eco_tax,
      }));

      const quoteData: CreateQuoteData = {
        channel_id: channelId,
        customer_id: selectedCustomer.id,
        customer_type: customerType,
        individual_customer_id:
          customerType === 'individual' ? selectedCustomer.id : undefined,
        items: quoteItems,
        validity_days: Number(validityDays),
        notes: notes || undefined,
        reference: reference || undefined,
        billing_address: billingAddress
          ? { address: billingAddress }
          : undefined,
        shipping_address: shippingAddress
          ? { address: shippingAddress }
          : undefined,
        shipping_cost_ht: shippingCostHt,
        handling_cost_ht: handlingCostHt,
        insurance_cost_ht: insuranceCostHt,
        fees_vat_rate: feesVatRate,
      };

      const quoteId = await createQuote(quoteData);

      if (quoteId) {
        handleClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('[QuoteFormModal] Submit error:', err);
      toast({
        title: 'Erreur',
        description:
          err instanceof Error
            ? err.message
            : 'Erreur lors de la création du devis',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedCustomer,
    items,
    channelId,
    validityDays,
    notes,
    reference,
    billingAddress,
    shippingAddress,
    shippingCostHt,
    handlingCostHt,
    insuranceCostHt,
    feesVatRate,
    createQuote,
    handleClose,
    onSuccess,
    toast,
  ]);

  // -----------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------
  const channelLabel = useMemo(() => {
    switch (selectedChannel) {
      case 'manual':
        return 'Manuel';
      case 'site-internet':
        return 'Site Internet';
      case 'linkme':
        return 'LinkMe';
      case 'service':
        return 'Service';
      default:
        return '';
    }
  }, [selectedChannel]);

  const isServiceMode = selectedChannel === 'service';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {wizardStep === 'channel-selection'
              ? 'Nouveau Devis'
              : `Devis ${channelLabel}`}
          </DialogTitle>
          <DialogDescription>
            {wizardStep === 'channel-selection'
              ? 'Sélectionnez le type de devis à créer'
              : isServiceMode
                ? 'Créer un devis pour des prestations de service'
                : `Créer un devis ${channelLabel} avec produits du catalogue`}
          </DialogDescription>
        </DialogHeader>

        {/* ============================================================= */}
        {/* STEP 1: Channel Selection                                      */}
        {/* ============================================================= */}
        {wizardStep === 'channel-selection' && (
          <div className="py-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Manuel */}
              <button
                type="button"
                onClick={() => handleChannelSelect('manual')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
                  <Store className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Manuel</h3>
                  <p className="text-sm text-gray-500">
                    Produits du catalogue, prix modifiables librement
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
              </button>

              {/* Site Internet */}
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
                    Produits du catalogue, prix site internet
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-500" />
              </button>

              {/* LinkMe */}
              <button
                type="button"
                onClick={() => handleChannelSelect('linkme')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
                  <Link2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">LinkMe</h3>
                  <p className="text-sm text-gray-500">
                    Produits avec pricing affilié depuis sélections
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-500" />
              </button>

              {/* Service */}
              <button
                type="button"
                onClick={() => handleChannelSelect('service')}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:bg-amber-50 transition-all text-left group"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200">
                  <Briefcase className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Service</h3>
                  <p className="text-sm text-gray-500">
                    Lignes libres : titre, description, quantité, prix, TVA
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-amber-500" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* STEP 2: Quote Form                                             */}
        {/* ============================================================= */}
        {wizardStep === 'form' && (
          <>
            {/* Back button */}
            <div className="mb-4">
              <ButtonV2
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleBackToChannelSelection}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </ButtonV2>
            </div>

            <div className="space-y-6">
              {/* ----- Customer Selection ----- */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Client</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerSelector
                    selectedCustomer={selectedCustomer}
                    onCustomerChange={setSelectedCustomer}
                  />
                </CardContent>
              </Card>

              {/* ----- Items Section ----- */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {isServiceMode ? 'Prestations' : 'Produits'}
                    </CardTitle>
                    {isServiceMode ? (
                      <ButtonV2
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddServiceLine}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter une ligne
                      </ButtonV2>
                    ) : (
                      <ButtonV2
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddProduct(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un produit
                      </ButtonV2>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">
                        {isServiceMode
                          ? 'Aucune prestation ajoutée'
                          : 'Aucun produit ajouté'}
                      </p>
                    </div>
                  ) : isServiceMode ? (
                    /* Service items - editable rows */
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <div
                          key={item.id}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">
                              Ligne {index + 1}
                            </span>
                            {items.length > 1 && (
                              <ButtonV2
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </ButtonV2>
                            )}
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                placeholder="Description de la prestation"
                                value={item.description}
                                onChange={e =>
                                  handleItemChange(
                                    item.id,
                                    'description',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <Label className="text-xs">Quantité</Label>
                                <Input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={e =>
                                    handleItemChange(
                                      item.id,
                                      'quantity',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">
                                  Prix unitaire HT
                                </Label>
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  value={item.unit_price_ht}
                                  onChange={e =>
                                    handleItemChange(
                                      item.id,
                                      'unit_price_ht',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                              <div>
                                <Label className="text-xs">TVA %</Label>
                                <Select
                                  value={String(item.tva_rate)}
                                  onValueChange={v =>
                                    handleItemChange(
                                      item.id,
                                      'tva_rate',
                                      Number(v)
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="5.5">5,5%</SelectItem>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="20">20%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Total HT</Label>
                                <div className="h-10 flex items-center text-sm font-medium">
                                  {formatCurrency(
                                    item.quantity * item.unit_price_ht
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Product items - table */
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead className="w-20 text-right">Qté</TableHead>
                          <TableHead className="w-28 text-right">
                            Prix HT
                          </TableHead>
                          <TableHead className="w-20 text-right">
                            Remise %
                          </TableHead>
                          <TableHead className="w-20 text-right">
                            TVA %
                          </TableHead>
                          <TableHead className="w-28 text-right">
                            Total HT
                          </TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => {
                          const discountMultiplier =
                            1 - (item.discount_percentage ?? 0) / 100;
                          const lineHt =
                            item.quantity *
                              item.unit_price_ht *
                              discountMultiplier +
                            (item.eco_tax ?? 0) * item.quantity;
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="text-sm font-medium">
                                  {item.product?.name ?? item.description}
                                </div>
                                {item.product?.sku && (
                                  <div className="text-xs text-gray-500">
                                    SKU: {item.product.sku}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-20 text-right"
                                  value={item.quantity}
                                  onChange={e =>
                                    handleItemChange(
                                      item.id,
                                      'quantity',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  className="w-28 text-right"
                                  value={item.unit_price_ht}
                                  onChange={e =>
                                    handleItemChange(
                                      item.id,
                                      'unit_price_ht',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  className="w-20 text-right"
                                  value={item.discount_percentage}
                                  onChange={e =>
                                    handleItemChange(
                                      item.id,
                                      'discount_percentage',
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Select
                                  value={String(item.tva_rate)}
                                  onValueChange={v =>
                                    handleItemChange(
                                      item.id,
                                      'tva_rate',
                                      Number(v)
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="5.5">5,5%</SelectItem>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="20">20%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(lineHt)}
                              </TableCell>
                              <TableCell>
                                <ButtonV2
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </ButtonV2>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* ----- Options & Fees ----- */}
              <div className="grid grid-cols-2 gap-4">
                {/* Options */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Validité</Label>
                      <Select
                        value={validityDays}
                        onValueChange={setValidityDays}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 jours</SelectItem>
                          <SelectItem value="30">30 jours</SelectItem>
                          <SelectItem value="60">60 jours</SelectItem>
                          <SelectItem value="90">90 jours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Référence (optionnel)</Label>
                      <Input
                        placeholder="REF-..."
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Fees */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Frais additionnels
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">Livraison HT</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={shippingCostHt}
                          onChange={e =>
                            setShippingCostHt(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Manutention HT</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={handlingCostHt}
                          onChange={e =>
                            setHandlingCostHt(Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Assurance HT</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={insuranceCostHt}
                          onChange={e =>
                            setInsuranceCostHt(Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">TVA frais</Label>
                      <Select
                        value={String(feesVatRate)}
                        onValueChange={v => setFeesVatRate(Number(v))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="0.055">5,5%</SelectItem>
                          <SelectItem value="0.1">10%</SelectItem>
                          <SelectItem value="0.2">20%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* ----- Addresses ----- */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Adresses</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <AddressInput
                    label="Adresse de facturation"
                    value={billingAddress}
                    onChange={setBillingAddress}
                    placeholder="Adresse de facturation..."
                    selectedCustomer={selectedCustomer ?? undefined}
                    addressType="billing"
                  />
                  <AddressInput
                    label="Adresse de livraison"
                    value={shippingAddress}
                    onChange={setShippingAddress}
                    placeholder="Adresse de livraison..."
                    selectedCustomer={selectedCustomer ?? undefined}
                    addressType="shipping"
                  />
                </CardContent>
              </Card>

              {/* ----- Notes ----- */}
              <div>
                <Label className="text-xs">Notes (optionnel)</Label>
                <Textarea
                  placeholder="Notes internes ou conditions particulières..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* ----- Totals ----- */}
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total HT articles</span>
                      <span>{formatCurrency(totals.itemsTotalHt)}</span>
                    </div>
                    {totals.feesTotalHt > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frais HT</span>
                        <span>{formatCurrency(totals.feesTotalHt)}</span>
                      </div>
                    )}
                    {/* TVA by rate */}
                    {Object.entries(totals.tvaByRate).map(([rate, { tva }]) => (
                      <div key={rate} className="flex justify-between text-sm">
                        <span className="text-gray-600">TVA {rate}%</span>
                        <span>{formatCurrency(tva)}</span>
                      </div>
                    ))}
                    {totals.feesTva > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          TVA frais ({(feesVatRate * 100).toFixed(0)}%)
                        </span>
                        <span>{formatCurrency(totals.feesTva)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total TTC</span>
                      <span className="text-lg">
                        {formatCurrency(totals.totalTtc)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ----- Footer ----- */}
            <DialogFooter className="mt-6">
              <ButtonV2 type="button" variant="outline" onClick={handleClose}>
                Annuler
              </ButtonV2>
              <ButtonV2
                type="button"
                onClick={() => {
                  void handleSubmit().catch((err: unknown) => {
                    console.error('[QuoteFormModal] submit error:', err);
                  });
                }}
                disabled={
                  isSubmitting || !selectedCustomer || items.length === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Création...
                  </>
                ) : (
                  'Enregistrer le brouillon'
                )}
              </ButtonV2>
            </DialogFooter>
          </>
        )}

        {/* AddProductToOrderModal (for catalog channels) */}
        {!isServiceMode && (
          <AddProductToOrderModal
            open={showAddProduct}
            onClose={() => setShowAddProduct(false)}
            orderType="sales"
            onAdd={handleAddProduct}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
