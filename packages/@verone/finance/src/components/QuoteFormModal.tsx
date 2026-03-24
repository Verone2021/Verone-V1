'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { AddressInput } from '@verone/common/components/address/AddressInput';
import { useToast } from '@verone/common/hooks';
import type {
  CreateQuoteData,
  CreateQuoteItemData,
} from '@verone/finance/hooks';
import { useQuotes } from '@verone/finance/hooks';
import { type UnifiedCustomer } from '@verone/orders/components/modals/customer-selector';
import { AddProductToOrderModal } from '@verone/orders/components/modals/AddProductToOrderModal';
import {
  useLinkMeAffiliates,
  useLinkMeSelectionsByAffiliate,
  useLinkMeSelection,
  type SelectionItem,
} from '@verone/orders/hooks';
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
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { ChannelSelectionStep } from './quote-form/ChannelSelectionStep';
import { CustomerSection } from './quote-form/CustomerSection';
import { ItemsSection } from './quote-form/ItemsSection';
import { LinkMeAffiliateStep } from './quote-form/LinkMeAffiliateStep';
import { LinkMeProductsSection } from './quote-form/LinkMeProductsSection';
import { LinkMeSelectionStep } from './quote-form/LinkMeSelectionStep';
import { OptionsFeesSection } from './quote-form/OptionsFeesSection';
import { TotalsSection } from './quote-form/TotalsSection';
import type {
  QuoteChannelType,
  WizardStep,
  QuoteItemLocal,
  QuoteFormModalProps,
} from './quote-form/types';
import { generateId } from './quote-form/types';

// Re-export props type for backward compatibility
export type { QuoteFormModalProps } from './quote-form/types';

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

  // LinkMe state
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string | null>(
    null
  );
  const [selectedSelectionId, setSelectedSelectionId] = useState<string | null>(
    null
  );
  const [affiliateSearch, setAffiliateSearch] = useState('');

  // LinkMe hooks
  const { data: linkmeAffiliates } = useLinkMeAffiliates();
  const { data: linkmeSelections } =
    useLinkMeSelectionsByAffiliate(selectedAffiliateId);
  const { data: linkmeSelectionDetails } =
    useLinkMeSelection(selectedSelectionId);

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
    setSelectedAffiliateId(null);
    setSelectedSelectionId(null);
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

  // Auto-fill addresses when customer is selected
  const handleCustomerChange = useCallback(
    (customer: UnifiedCustomer | null) => {
      setSelectedCustomer(customer);

      if (!customer) {
        setBillingAddress('');
        setShippingAddress('');
        return;
      }

      if (customer.type === 'professional') {
        // B2B: billing address
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

        // B2B: shipping address (use shipping if available, else billing)
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
      } else {
        // B2C: primary address for shipping
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

        // B2C: billing (specific individual billing or fallback to primary)
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
    },
    []
  );

  const handleChannelSelect = useCallback(
    (channel: QuoteChannelType) => {
      setSelectedChannel(channel);

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

      // LinkMe goes through affiliate/selection steps first
      if (channel === 'linkme') {
        setWizardStep('linkme-affiliate');
        return;
      }

      setWizardStep('form');

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
    setSelectedAffiliateId(null);
    setSelectedSelectionId(null);
    setItems([]);
  }, []);

  const handleBackFromLinkmeSelection = useCallback(() => {
    setWizardStep('linkme-affiliate');
    setSelectedSelectionId(null);
    setItems([]);
    setAffiliateSearch('');
  }, []);

  const handleBackFromForm = useCallback(() => {
    if (selectedChannel === 'linkme') {
      setWizardStep('linkme-selection');
      setItems([]);
    } else {
      handleBackToChannelSelection();
    }
  }, [selectedChannel, handleBackToChannelSelection]);

  // Add product from catalog (for manual/site-internet/linkme)
  const handleAddProduct = useCallback(
    (data: {
      product_id: string;
      quantity: number;
      unit_price_ht: number;
      tax_rate?: number;
      discount_percentage?: number;
      eco_tax?: number;
      notes?: string;
      product_name?: string;
      product_sku?: string;
      product_image_url?: string;
      product_description?: string;
    }) => {
      const newItem: QuoteItemLocal = {
        id: generateId(),
        product_id: data.product_id,
        description: data.product_description ?? data.product_name ?? '',
        quantity: data.quantity,
        unit_price_ht: data.unit_price_ht,
        tva_rate: (data.tax_rate ?? 0.2) * 100, // Convert from 0.2 to 20
        discount_percentage: data.discount_percentage ?? 0,
        eco_tax: data.eco_tax ?? 0,
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

  // Add product from LinkMe selection
  const handleAddLinkMeProduct = useCallback(
    (item: SelectionItem) => {
      const roundMoney = (value: number): number =>
        Math.round(value * 100) / 100;

      // Check if already in items -> increment quantity
      const existing = items.find(i => i.product_id === item.product_id);
      if (existing) {
        setItems(prev =>
          prev.map(i =>
            i.product_id === item.product_id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        );
        return;
      }

      // Price formula: selling_price = base_price * (1 + marginRate) * (1 + commissionRate)
      const commissionRate = (item.commission_rate ?? 0) / 100;
      const marginRate = item.margin_rate / 100;
      const sellingPrice = roundMoney(
        item.base_price_ht * (1 + marginRate) * (1 + commissionRate)
      );

      const newItem: QuoteItemLocal = {
        id: generateId(),
        product_id: item.product_id,
        description:
          item.custom_description ??
          item.product?.description ??
          item.product?.name ??
          '',
        quantity: 1,
        unit_price_ht: sellingPrice,
        tva_rate: 20,
        discount_percentage: 0,
        eco_tax: 0,
        is_service: false,
        product: {
          name: item.product?.name ?? '',
          sku: item.product?.sku ?? '',
          primary_image_url: item.product_image_url ?? undefined,
        },
        linkme_selection_item_id: item.id,
        base_price_ht: item.base_price_ht,
        retrocession_rate: marginRate,
      };
      setItems(prev => [...prev, newItem]);
    },
    [items]
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
        linkme_selection_item_id: item.linkme_selection_item_id ?? null,
        base_price_ht: item.base_price_ht ?? null,
        retrocession_rate: item.retrocession_rate ?? null,
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
        linkme_selection_id: selectedSelectionId ?? null,
        linkme_affiliate_id: selectedAffiliateId ?? null,
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
    selectedSelectionId,
    selectedAffiliateId,
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
  const isLinkMeMode = selectedChannel === 'linkme';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {wizardStep === 'channel-selection'
              ? 'Nouveau Devis'
              : wizardStep === 'linkme-affiliate'
                ? "Devis LinkMe — Choix de l'affilié"
                : wizardStep === 'linkme-selection'
                  ? 'Devis LinkMe — Choix de la sélection'
                  : `Devis ${channelLabel}`}
          </DialogTitle>
          <DialogDescription>
            {wizardStep === 'channel-selection'
              ? 'Sélectionnez le type de devis à créer'
              : wizardStep === 'linkme-affiliate'
                ? "Sélectionnez l'affilié LinkMe pour ce devis"
                : wizardStep === 'linkme-selection'
                  ? 'Sélectionnez la sélection de produits'
                  : isServiceMode
                    ? 'Créer un devis pour des prestations de service'
                    : `Créer un devis ${channelLabel} avec produits du catalogue`}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Channel Selection */}
        {wizardStep === 'channel-selection' && (
          <ChannelSelectionStep onSelect={handleChannelSelect} />
        )}

        {/* STEP 1b: LinkMe Affiliate Selection */}
        {wizardStep === 'linkme-affiliate' && (
          <LinkMeAffiliateStep
            affiliates={linkmeAffiliates}
            affiliateSearch={affiliateSearch}
            onAffiliateSearchChange={setAffiliateSearch}
            onSelectAffiliate={affiliateId => {
              setSelectedAffiliateId(affiliateId);
              setWizardStep('linkme-selection');
            }}
            onBack={handleBackToChannelSelection}
          />
        )}

        {/* STEP 1c: LinkMe Selection Choice */}
        {wizardStep === 'linkme-selection' && (
          <LinkMeSelectionStep
            selections={linkmeSelections}
            onSelectSelection={selectionId => {
              setSelectedSelectionId(selectionId);
              setWizardStep('form');
            }}
            onBack={handleBackFromLinkmeSelection}
          />
        )}

        {/* STEP 2: Quote Form */}
        {wizardStep === 'form' && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Back button */}
              <div className="mb-4">
                <ButtonV2
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleBackFromForm}
                  className="text-gray-600"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Retour
                </ButtonV2>
              </div>

              <div className="space-y-6">
                {/* Customer Selection */}
                <CustomerSection
                  selectedCustomer={selectedCustomer}
                  onCustomerChange={handleCustomerChange}
                  isLinkMeMode={isLinkMeMode}
                  linkMeEnseigneId={
                    linkmeAffiliates?.find(a => a.id === selectedAffiliateId)
                      ?.enseigne_id ?? undefined
                  }
                />

                {/* LinkMe Selection Products */}
                {isLinkMeMode && linkmeSelectionDetails && (
                  <LinkMeProductsSection
                    selectionDetails={linkmeSelectionDetails}
                    currentItems={items}
                    onAddProduct={handleAddLinkMeProduct}
                  />
                )}

                {/* Items Section */}
                <ItemsSection
                  items={items}
                  isServiceMode={isServiceMode}
                  isLinkMeMode={isLinkMeMode}
                  onAddServiceLine={handleAddServiceLine}
                  onAddProduct={() => setShowAddProduct(true)}
                  onRemoveItem={handleRemoveItem}
                  onItemChange={handleItemChange}
                />

                {/* Options & Fees */}
                <OptionsFeesSection
                  validityDays={validityDays}
                  onValidityDaysChange={setValidityDays}
                  reference={reference}
                  onReferenceChange={setReference}
                  shippingCostHt={shippingCostHt}
                  onShippingCostHtChange={setShippingCostHt}
                  handlingCostHt={handlingCostHt}
                  onHandlingCostHtChange={setHandlingCostHt}
                  insuranceCostHt={insuranceCostHt}
                  onInsuranceCostHtChange={setInsuranceCostHt}
                  feesVatRate={feesVatRate}
                  onFeesVatRateChange={setFeesVatRate}
                />

                {/* Addresses */}
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

                {/* Notes */}
                <div>
                  <Label className="text-xs">Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Notes internes ou conditions particulières..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Totals */}
                <TotalsSection totals={totals} feesVatRate={feesVatRate} />
              </div>
            </div>

            {/* Footer */}
            <DialogFooter className="mt-6 flex-shrink-0">
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

        {/* AddProductToOrderModal (for catalog channels, not LinkMe) */}
        {!isServiceMode && !isLinkMeMode && (
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
