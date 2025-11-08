'use client';

import { Plus, Minus, Trash2, Package } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@verone/utils';
import type { OrderItem, OrderType } from '@/shared/modules/orders/hooks';

/**
 * Composant Universel Ligne Item Éditable
 *
 * Ligne de tableau réutilisable pour afficher/éditer un item de commande.
 * Supporte achats ET ventes avec affichage conditionnel TVA (ventes).
 *
 * @example
 * // Commandes Achats
 * <EditableOrderItemRow
 *   item={item}
 *   orderType="purchase"
 *   onUpdate={(id, data) => updateItem(id, data)}
 *   onDelete={(id) => removeItem(id)}
 * />
 *
 * @example
 * // Commandes Ventes (avec TVA)
 * <EditableOrderItemRow
 *   item={item}
 *   orderType="sales"
 *   onUpdate={(id, data) => updateItem(id, data)}
 *   onDelete={(id) => removeItem(id)}
 * />
 *
 * @example
 * // Mode Read-Only (visualisation)
 * <EditableOrderItemRow
 *   item={item}
 *   orderType="purchase"
 *   readonly={true}
 * />
 */

interface ProductImage {
  public_url: string;
  is_primary: boolean;
  display_order?: number;
}

interface EditableOrderItemRowProps {
  item: OrderItem;
  orderType: OrderType;
  onUpdate?: (itemId: string, data: Partial<OrderItem>) => void;
  onDelete?: (itemId: string) => void;
  readonly?: boolean;
}

export function EditableOrderItemRow({
  item,
  orderType,
  onUpdate,
  onDelete,
  readonly = false,
}: EditableOrderItemRowProps) {
  // Calculer total ligne HT
  const calculateTotal = (): number => {
    const subtotal =
      item.quantity *
      item.unit_price_ht *
      (1 - (item.discount_percentage || 0) / 100);
    return subtotal + (item.eco_tax || 0);
  };

  // Récupérer image primaire produit
  const getPrimaryImage = (): string | null => {
    const images = item.products?.product_images as ProductImage[] | undefined;
    return (
      images?.find(img => img.is_primary)?.public_url ||
      images?.[0]?.public_url ||
      null
    );
  };

  // Handler modification quantité
  const handleQuantityChange = (newQuantity: number) => {
    const validQuantity = Math.max(1, newQuantity);
    if (onUpdate && !readonly) {
      onUpdate(item.id, { quantity: validQuantity });
    }
  };

  // Handler modification prix
  const handlePriceChange = (newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    if (onUpdate && !readonly) {
      onUpdate(item.id, { unit_price_ht: validPrice });
    }
  };

  // Handler modification remise
  const handleDiscountChange = (newDiscount: number) => {
    const validDiscount = Math.min(100, Math.max(0, newDiscount));
    if (onUpdate && !readonly) {
      onUpdate(item.id, { discount_percentage: validDiscount });
    }
  };

  // Handler modification éco-taxe
  const handleEcoTaxChange = (newEcoTax: number) => {
    const validEcoTax = Math.max(0, newEcoTax);
    if (onUpdate && !readonly) {
      onUpdate(item.id, { eco_tax: validEcoTax });
    }
  };

  // Handler modification TVA (ventes uniquement)
  const handleTaxRateChange = (newTaxRate: number) => {
    const validTaxRate = Math.max(0, newTaxRate) / 100;
    if (onUpdate && !readonly && orderType === 'sales') {
      onUpdate(item.id, { tax_rate: validTaxRate });
    }
  };

  // Handler suppression
  const handleDelete = () => {
    if (onDelete && !readonly) {
      if (
        confirm(
          'Êtes-vous sûr de vouloir supprimer ce produit de la commande ?'
        )
      ) {
        onDelete(item.id);
      }
    }
  };

  const primaryImage = getPrimaryImage();

  return (
    <TableRow>
      {/* Colonne 1: Image + Nom produit (READ-ONLY) */}
      <TableCell>
        <div className="flex gap-3 items-center">
          {/* Image produit */}
          <div className="flex-shrink-0">
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={item.products?.name ?? 'Produit'}
                className="w-12 h-12 object-cover rounded border"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Info produit */}
          <div className="min-w-0">
            <p className="font-medium text-sm line-clamp-2">
              {item.products?.name ?? 'Produit inconnu'}
            </p>
            <p className="text-xs text-gray-500">
              {item.products?.sku ?? 'SKU inconnu'}
            </p>

            {/* Badge quantité reçue/expédiée (info) */}
            {orderType === 'purchase' && item.quantity_received! > 0 && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Reçu: {item.quantity_received}/{item.quantity}
              </Badge>
            )}
            {orderType === 'sales' && item.quantity_shipped! > 0 && (
              <Badge variant="secondary" className="mt-1 text-xs">
                Expédié: {item.quantity_shipped}/{item.quantity}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      {/* Colonne 2: Quantité avec +/- */}
      <TableCell>
        {readonly ? (
          <span className="text-sm font-medium">{item.quantity}</span>
        ) : (
          <div className="flex gap-1 items-center">
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </ButtonV2>
            <Input
              type="number"
              value={item.quantity}
              onChange={e =>
                handleQuantityChange(parseInt(e.target.value) || 1)
              }
              className="w-16 text-center"
              min="1"
            />
            <ButtonV2
              size="sm"
              variant="outline"
              onClick={() => handleQuantityChange(item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </ButtonV2>
          </div>
        )}
      </TableCell>

      {/* Colonne 3: Prix unitaire HT */}
      <TableCell>
        {readonly ? (
          <span className="text-sm">{formatCurrency(item.unit_price_ht)}</span>
        ) : (
          <Input
            type="number"
            step="0.01"
            value={item.unit_price_ht}
            onChange={e => handlePriceChange(parseFloat(e.target.value) || 0)}
            className="w-24"
            min="0"
          />
        )}
      </TableCell>

      {/* Colonne 4: Remise % */}
      <TableCell>
        {readonly ? (
          <span className="text-sm">{item.discount_percentage || 0}%</span>
        ) : (
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={item.discount_percentage || 0}
            onChange={e =>
              handleDiscountChange(parseFloat(e.target.value) || 0)
            }
            className="w-20"
          />
        )}
      </TableCell>

      {/* Colonne 5: Éco-taxe € */}
      <TableCell>
        {readonly ? (
          <span className="text-sm">{formatCurrency(item.eco_tax || 0)}</span>
        ) : (
          <Input
            type="number"
            step="0.01"
            value={item.eco_tax || 0}
            onChange={e => handleEcoTaxChange(parseFloat(e.target.value) || 0)}
            className="w-20"
            min="0"
          />
        )}
      </TableCell>

      {/* Colonne 6: TVA % (VENTES UNIQUEMENT) */}
      {orderType === 'sales' && (
        <TableCell>
          {readonly ? (
            <span className="text-sm">
              {((item.tax_rate || 0.2) * 100).toFixed(1)}%
            </span>
          ) : (
            <Input
              type="number"
              step="0.1"
              value={((item.tax_rate || 0.2) * 100).toFixed(1)}
              onChange={e =>
                handleTaxRateChange(parseFloat(e.target.value) || 20)
              }
              className="w-20"
              min="0"
            />
          )}
        </TableCell>
      )}

      {/* Colonne 7: Total ligne HT */}
      <TableCell>
        <span className="font-medium">{formatCurrency(calculateTotal())}</span>
      </TableCell>

      {/* Colonne 8: Actions */}
      <TableCell>
        {!readonly && onDelete && (
          <ButtonV2
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            title="Supprimer ce produit"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </ButtonV2>
        )}
      </TableCell>
    </TableRow>
  );
}
