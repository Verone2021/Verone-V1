'use client';

/**
 * SampleFormDialog — modal for creating a new customer sample request.
 */

import Image from 'next/image';

import type { UnifiedCustomer } from '@verone/orders';
import { CustomerSelector } from '@verone/orders';
import type { SelectedProduct } from '@verone/products';
import { UniversalProductSelectorV2 } from '@verone/products';
import { Button } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Textarea } from '@verone/ui';
import { CheckCircle, Package } from 'lucide-react';

// ---------------------------------------------------------------------------
// SelectedProductCard
// ---------------------------------------------------------------------------

interface SelectedProductCardProps {
  product: SelectedProduct;
}

function SelectedProductCard({ product }: SelectedProductCardProps) {
  const primaryImage =
    product.product_images?.find(img => img.is_primary) ??
    product.product_images?.[0];

  return (
    <Card className="mt-3 bg-green-50 border-green-200">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          {primaryImage ? (
            <Image
              src={primaryImage.public_url}
              alt={product.name}
              width={48}
              height={48}
              className="object-cover rounded"
            />
          ) : (
            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
              <Package className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium text-green-900">{product.name}</p>
            {product.sku && (
              <p className="text-sm text-green-700">SKU: {product.sku}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CustomerSection
// ---------------------------------------------------------------------------

interface CustomerSectionProps {
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;
  submitting: boolean;
}

function CustomerSection({
  selectedCustomer,
  onCustomerChange,
  submitting,
}: CustomerSectionProps) {
  return (
    <>
      <div>
        <Label className="text-base font-semibold mb-4 block">
          Sélectionner le client *
        </Label>
        <CustomerSelector
          selectedCustomer={selectedCustomer}
          onCustomerChange={onCustomerChange}
          disabled={submitting}
        />
      </div>
      {selectedCustomer && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  Client sélectionné : {selectedCustomer.name}
                </p>
                <p className="text-sm text-green-700">
                  Type :{' '}
                  {selectedCustomer.type === 'professional'
                    ? 'Professionnel (B2B)'
                    : 'Particulier (B2C)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// ProductSection
// ---------------------------------------------------------------------------

interface ProductSectionProps {
  selectedProduct: SelectedProduct | null;
  onOpenProductModal: () => void;
  submitting: boolean;
}

function ProductSection({
  selectedProduct,
  onOpenProductModal,
  submitting,
}: ProductSectionProps) {
  return (
    <div>
      <Label>Produit *</Label>
      <Button
        type="button"
        variant="outline"
        onClick={onOpenProductModal}
        disabled={submitting}
        className="w-full justify-start text-left font-normal"
      >
        <Package className="h-4 w-4 mr-2" />
        {selectedProduct ? selectedProduct.name : 'Sélectionner un produit...'}
      </Button>
      {selectedProduct && <SelectedProductCard product={selectedProduct} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TextFields (quantity + delivery + notes + actions)
// ---------------------------------------------------------------------------

interface TextFieldsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  submitting: boolean;
  canSubmit: boolean;
  onCancel: () => void;
}

function TextFields({
  quantity,
  onQuantityChange,
  deliveryAddress,
  onDeliveryAddressChange,
  notes,
  onNotesChange,
  submitting,
  canSubmit,
  onCancel,
}: TextFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="quantity">Quantité</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max="10"
          value={quantity}
          onChange={e => onQuantityChange(parseInt(e.target.value) || 1)}
          disabled={submitting}
        />
        <p className="text-sm text-gray-500 mt-1">
          Maximum 10 échantillons par demande
        </p>
      </div>
      <div>
        <Label htmlFor="delivery">Adresse de livraison</Label>
        <Textarea
          id="delivery"
          value={deliveryAddress}
          onChange={e => onDeliveryAddressChange(e.target.value)}
          placeholder="Auto-remplie depuis la fiche client..."
          rows={3}
          disabled={submitting}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="Contexte, usage prévu, remarques particulières..."
          rows={3}
          disabled={submitting}
        />
      </div>
      <div className="flex justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={!canSubmit || submitting}
          className="bg-black hover:bg-gray-800"
        >
          {submitting ? 'Création...' : 'Créer la demande'}
        </Button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// SampleFormDialog
// ---------------------------------------------------------------------------

export interface SampleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCustomer: UnifiedCustomer | null;
  onCustomerChange: (customer: UnifiedCustomer | null) => void;
  selectedProduct: SelectedProduct | null;
  selectedProductId: string;
  showProductModal: boolean;
  onOpenProductModal: () => void;
  onProductSelect: (products: SelectedProduct[]) => void;
  onCloseProductModal: () => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (address: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function SampleFormDialog(p: SampleFormDialogProps) {
  return (
    <>
      <Dialog open={p.open} onOpenChange={p.onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle Demande d'Échantillon Client</DialogTitle>
            <DialogDescription>
              Créer une demande d'échantillon pour un client professionnel (B2B)
              ou particulier (B2C)
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={e => {
              void p.onSubmit(e).catch(err => {
                console.error('[EchantillonsPage] Form submit failed:', err);
              });
            }}
            className="space-y-6"
          >
            <CustomerSection
              selectedCustomer={p.selectedCustomer}
              onCustomerChange={p.onCustomerChange}
              submitting={p.submitting}
            />
            <ProductSection
              selectedProduct={p.selectedProduct}
              onOpenProductModal={p.onOpenProductModal}
              submitting={p.submitting}
            />
            <TextFields
              quantity={p.quantity}
              onQuantityChange={p.onQuantityChange}
              deliveryAddress={p.deliveryAddress}
              onDeliveryAddressChange={p.onDeliveryAddressChange}
              notes={p.notes}
              onNotesChange={p.onNotesChange}
              submitting={p.submitting}
              canSubmit={!!p.selectedCustomer && !!p.selectedProductId}
              onCancel={() => p.onOpenChange(false)}
            />
          </form>
        </DialogContent>
      </Dialog>
      <UniversalProductSelectorV2
        open={p.showProductModal}
        onClose={p.onCloseProductModal}
        onSelect={p.onProductSelect}
        mode="single"
        context="consultations"
        selectedProducts={p.selectedProduct ? [p.selectedProduct] : []}
        showQuantity={false}
        showImages
      />
    </>
  );
}
