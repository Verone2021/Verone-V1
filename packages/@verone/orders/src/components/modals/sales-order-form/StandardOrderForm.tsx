'use client';

import { AddressInput } from '@verone/common/components/address/AddressInput';
import type { SelectedProduct } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import { UniversalProductSelectorV2 } from '@verone/products/components/selectors/UniversalProductSelectorV2';
import type { Database } from '@verone/types';
import { Alert, AlertDescription } from '@verone/ui';
import { EcoTaxVatInput } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Textarea } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { AlertTriangle } from 'lucide-react';

import type { UnifiedCustomer } from '../customer-selector';
import { CustomerSelector } from '../customer-selector';

import type { OrderItem } from './OrderItemsTable';
import { OrderItemsTable } from './OrderItemsTable';

interface StandardOrderFormProps {
  mode: 'create' | 'edit';
  loading: boolean;
  loadingOrder: boolean;

  // Customer
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;

  // Dates
  orderDate: string;
  onOrderDateChange: (date: string) => void;
  expectedDeliveryDate: string | null;
  onExpectedDeliveryDateChange: (date: string | null) => void;

  // Payment terms
  paymentTermsType: Database['public']['Enums']['payment_terms_type'] | null;
  onPaymentTermsTypeChange: (
    type: Database['public']['Enums']['payment_terms_type']
  ) => void;
  paymentTermsNotes: string;
  onPaymentTermsNotesChange: (notes: string) => void;

  // Addresses
  shippingAddress: string;
  onShippingAddressChange: (address: string) => void;
  billingAddress: string;
  onBillingAddressChange: (address: string) => void;

  // Notes & eco-tax
  notes: string;
  onNotesChange: (notes: string) => void;
  ecoTaxVatRate: number | null;
  onEcoTaxVatRateChange: (rate: number | null) => void;

  // Charges
  shippingCostHt: number;
  onShippingCostHtChange: (cost: number) => void;
  insuranceCostHt: number;
  onInsuranceCostHtChange: (cost: number) => void;
  handlingCostHt: number;
  onHandlingCostHtChange: (cost: number) => void;

  // Items
  items: OrderItem[];
  isPriceEditable: boolean;
  onUpdateItem: (
    itemId: string,
    field: keyof OrderItem,
    value: OrderItem[keyof OrderItem]
  ) => void;
  onRemoveItem: (itemId: string) => void;

  // Product selector
  showProductSelector: boolean;
  onShowProductSelectorChange: (show: boolean) => void;
  onProductsSelect: (products: SelectedProduct[]) => void | Promise<void>;
  excludeProductIds: string[];

  // Totals
  totalHTProducts: number;
  totalCharges: number;
  totalTVA: number;
  totalTTC: number;

  // Stock warnings
  stockWarnings: string[];

  // Actions
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function StandardOrderForm({
  mode,
  loading,
  loadingOrder,
  selectedCustomer,
  onCustomerChange,
  orderDate,
  onOrderDateChange,
  expectedDeliveryDate,
  onExpectedDeliveryDateChange,
  paymentTermsType,
  onPaymentTermsTypeChange,
  paymentTermsNotes,
  onPaymentTermsNotesChange,
  shippingAddress,
  onShippingAddressChange,
  billingAddress,
  onBillingAddressChange,
  notes,
  onNotesChange,
  ecoTaxVatRate,
  onEcoTaxVatRateChange,
  shippingCostHt,
  onShippingCostHtChange,
  insuranceCostHt,
  onInsuranceCostHtChange,
  handlingCostHt,
  onHandlingCostHtChange,
  items,
  isPriceEditable,
  onUpdateItem,
  onRemoveItem,
  showProductSelector,
  onShowProductSelectorChange,
  onProductsSelect,
  excludeProductIds,
  totalHTProducts,
  totalCharges,
  totalTVA,
  totalTTC,
  stockWarnings,
  onSubmit,
  onCancel,
}: StandardOrderFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Stock alerts */}
      {stockWarnings.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Problèmes de stock détectés :</p>
              {stockWarnings.map((warning, index) => (
                <p key={index} className="text-sm">
                  &#8226; {warning}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* General information */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CustomerSelector
            selectedCustomer={selectedCustomer}
            onCustomerChange={onCustomerChange}
            disabled={loading}
          />
          {mode === 'edit' && (
            <p className="text-sm text-gray-500 italic">
              Le client ne peut pas être modifié pour une commande existante
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderDate">Date de commande *</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={e => onOrderDateChange(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Date de livraison prévue</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={expectedDeliveryDate ?? ''}
                onChange={e =>
                  onExpectedDeliveryDateChange(e.target.value || null)
                }
                disabled={loading}
              />
            </div>

            {/* Payment terms */}
            <div className="space-y-2">
              <Label htmlFor="paymentTermsType">Conditions de paiement</Label>
              <Select
                value={paymentTermsType ?? undefined}
                onValueChange={value =>
                  onPaymentTermsTypeChange(
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

              {/* Custom notes */}
              {paymentTermsType === 'CUSTOM' && (
                <Textarea
                  placeholder="Décrivez les conditions personnalisées..."
                  value={paymentTermsNotes}
                  onChange={e => onPaymentTermsNotesChange(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <AddressInput
              label="Adresse de livraison"
              value={shippingAddress}
              onChange={onShippingAddressChange}
              selectedCustomer={selectedCustomer}
              addressType="shipping"
              placeholder="Adresse complète de livraison"
              disabled={loading}
            />

            <AddressInput
              label="Adresse de facturation"
              value={billingAddress}
              onChange={onBillingAddressChange}
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
              onChange={e => onNotesChange(e.target.value)}
              placeholder="Notes sur la commande"
              disabled={loading}
            />
          </div>

          <div>
            <EcoTaxVatInput
              value={ecoTaxVatRate}
              onChange={onEcoTaxVatRateChange}
              defaultTaxRate={20}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional charges */}
      <Card>
        <CardHeader>
          <CardTitle>Frais additionnels</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shippingCostHt">
              Frais de livraison HT (&euro;)
            </Label>
            <Input
              id="shippingCostHt"
              type="number"
              min="0"
              step="0.01"
              value={shippingCostHt || ''}
              onChange={e =>
                onShippingCostHtChange(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="insuranceCostHt">
              Frais d&apos;assurance HT (&euro;)
            </Label>
            <Input
              id="insuranceCostHt"
              type="number"
              min="0"
              step="0.01"
              value={insuranceCostHt || ''}
              onChange={e =>
                onInsuranceCostHtChange(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handlingCostHt">
              Frais de manutention HT (&euro;)
            </Label>
            <Input
              id="handlingCostHt"
              type="number"
              min="0"
              step="0.01"
              value={handlingCostHt || ''}
              onChange={e =>
                onHandlingCostHtChange(parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Items table */}
      <OrderItemsTable
        items={items}
        loading={loading}
        isPriceEditable={isPriceEditable}
        onUpdateItem={onUpdateItem}
        onRemoveItem={onRemoveItem}
        onAddProducts={() => onShowProductSelectorChange(true)}
      />

      {/* Totals */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end space-y-2">
              <div className="text-right space-y-1">
                <p className="text-lg">
                  <span className="font-medium">Total HT produits:</span>{' '}
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
          onClick={onCancel}
          disabled={loading}
        >
          Annuler
        </ButtonV2>
        <ButtonV2
          type="submit"
          disabled={
            loading || loadingOrder || !selectedCustomer || items.length === 0
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

      {/* Product selector modal */}
      {showProductSelector && (
        <UniversalProductSelectorV2
          open={showProductSelector}
          onClose={() => onShowProductSelectorChange(false)}
          onSelect={onProductsSelect}
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
    </form>
  );
}
