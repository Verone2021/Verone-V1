'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { Alert, AlertDescription } from '@verone/ui';
import { Button } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
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
import { Separator } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Loader2, Info, Package } from 'lucide-react';

import { useDraftPurchaseOrder } from '@verone/orders/hooks';

export interface QuickPurchaseOrderModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  shortageQuantity?: number; // Quantité minimale à commander (écart stock)
  onSuccess?: () => void;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  supplier_id: string;
  cost_price: number;
  supplier_moq: number; // ✅ Phase 2.5: Minimum Order Quantity fournisseur
  primary_image_url?: string;
  supplier?: {
    id: string;
    legal_name: string;
  };
}

interface DraftOrderInfo {
  exists: boolean;
  po_number?: string;
  order_id?: string;
}

export function QuickPurchaseOrderModal({
  open,
  onClose,
  productId,
  shortageQuantity,
  onSuccess,
}: QuickPurchaseOrderModalProps) {
  const supabase = createClient();
  const { addToDraftOrder, isLoading: isSubmitting } = useDraftPurchaseOrder();

  // États
  const [product, setProduct] = useState<ProductData | null>(null);
  const [draftOrderInfo, setDraftOrderInfo] = useState<DraftOrderInfo>({
    exists: false,
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement des données produit + vérification draft
  useEffect(() => {
    if (!open || !productId) return;

    async function loadData() {
      setIsLoadingData(true);
      setError(null);

      try {
        // 1. Charger produit avec fournisseur et image
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(
            `
            id,
            name,
            sku,
            supplier_id,
            cost_price,
            supplier_moq,
            product_images!left(public_url)
          `
          )
          .eq('product_images.is_primary', true)
          .limit(1, { foreignTable: 'product_images' })
          .eq('id', productId)
          .single();

        if (productError || !productData) {
          throw new Error('Produit non trouvé');
        }

        // 2. Charger fournisseur
        let supplierInfo: { id: string; legal_name: string } | undefined;
        if (productData.supplier_id) {
          const { data: supplierData } = await supabase
            .from('organisations')
            .select('id, legal_name')
            .eq('id', productData.supplier_id)
            .single();

          supplierInfo = supplierData || undefined;
        }

        // Extraire l'image principale
        const primaryImageUrl =
          (productData as any).product_images?.[0]?.public_url || null;

        const formattedProduct: ProductData = {
          id: productData.id,
          name: productData.name,
          sku: productData.sku,
          supplier_id: productData.supplier_id || '',
          cost_price: productData.cost_price || 0,
          supplier_moq: productData.supplier_moq || 1,
          primary_image_url: primaryImageUrl,
          supplier: supplierInfo,
        };

        setProduct(formattedProduct);
        setUnitPrice(formattedProduct.cost_price);

        // 3. Vérifier si commande draft existe pour ce fournisseur
        if (productData.supplier_id) {
          const { data: draftOrders } = await supabase
            .from('purchase_orders')
            .select('id, po_number')
            .eq('supplier_id', productData.supplier_id)
            .eq('status', 'draft')
            .order('created_at', { ascending: false })
            .limit(1);

          if (draftOrders && draftOrders.length > 0) {
            setDraftOrderInfo({
              exists: true,
              po_number: draftOrders[0].po_number,
              order_id: draftOrders[0].id,
            });
          }
        }
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(errorMsg);
      } finally {
        setIsLoadingData(false);
      }
    }

    loadData();
  }, [open, productId, supabase]);

  // ✅ Phase 2.5: Pré-remplir quantité avec MAX(shortage_quantity, MOQ)
  // Garantit que la quantité suggérée respecte le MOQ fournisseur
  useEffect(() => {
    if (product && shortageQuantity && shortageQuantity > 0) {
      const moq = product.supplier_moq || 1;
      const suggestedQty = Math.max(shortageQuantity, moq);
      setQuantity(suggestedQty);
    } else if (product) {
      // Si pas de shortage, utiliser MOQ comme défaut
      setQuantity(product.supplier_moq || 1);
    }
  }, [shortageQuantity, product]);

  // Validation + soumission
  async function handleSubmit() {
    if (!product) return;

    const minQuantity = shortageQuantity || 1;

    // Validation quantité >= shortage_quantity
    if (quantity < minQuantity) {
      setError(
        `La quantité doit être >= ${minQuantity} (stock minimum requis)`
      );
      return;
    }

    // Validation prix
    if (unitPrice <= 0) {
      setError('Le prix unitaire HT doit être supérieur à 0');
      return;
    }

    const result = await addToDraftOrder({
      productId: product.id,
      quantity,
      unitPrice,
      notes: `Commande ${product.name} (${product.sku})`,
    });

    if (result.success) {
      onSuccess?.();
      onClose();
      // Reset états
      setQuantity(1);
      setError(null);
    }
  }

  // Calcul total
  const lineTotal = quantity * unitPrice;
  const totalTTC = lineTotal * 1.2; // TVA 20%

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Commander un produit</DialogTitle>
          <DialogDescription>
            Ajouter ce produit à une commande fournisseur
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : error && !product ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : product ? (
          <div className="space-y-6">
            {/* Infos produit */}
            <div className="flex gap-4">
              <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg border overflow-hidden">
                {product.primary_image_url ? (
                  <Image
                    src={product.primary_image_url}
                    fill
                    className="object-cover"
                    alt={product.name}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                {product.supplier && (
                  <p className="text-sm text-gray-600">
                    Fournisseur: {product.supplier.legal_name}
                  </p>
                )}
              </div>
            </div>

            {/* Message contextuel draft */}
            {draftOrderInfo.exists && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Ce produit sera ajouté à la commande draft existante{' '}
                  <strong>{draftOrderInfo.po_number}</strong> pour ce
                  fournisseur.
                </AlertDescription>
              </Alert>
            )}

            {/* Formulaire */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Quantité */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">
                    Quantité <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Prix unitaire HT */}
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">
                    Prix unitaire HT <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={e => setUnitPrice(Number(e.target.value))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Aperçu calcul */}
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Quantité</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prix unitaire HT</span>
                      <span className="font-medium">
                        {formatCurrency(unitPrice)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total HT</span>
                      <span>{formatCurrency(lineTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>TVA 20%</span>
                      <span>{formatCurrency(lineTotal * 0.2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total TTC</span>
                      <span>{formatCurrency(totalTTC)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message erreur */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoadingData || isSubmitting || !product}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validation...
              </>
            ) : draftOrderInfo.exists ? (
              'Ajouter à la commande'
            ) : (
              'Créer commande'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
