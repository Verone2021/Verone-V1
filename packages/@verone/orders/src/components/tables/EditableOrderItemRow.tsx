'use client';

import { useState, useEffect } from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { TableCell, TableRow } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Trash2, Package, FlaskConical, Building2, User } from 'lucide-react';

import type { OrderItem, OrderType } from '@verone/orders/hooks';

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
  // États locaux en string pour permettre la saisie libre (effacer, taper librement)
  // Parse/validation uniquement sur onBlur
  const [localPrice, setLocalPrice] = useState(String(item.unit_price_ht));
  const [localDiscount, setLocalDiscount] = useState(
    String(item.discount_percentage || 0)
  );
  const [localEcoTax, setLocalEcoTax] = useState(String(item.eco_tax || 0));
  const [localTaxRate, setLocalTaxRate] = useState(
    String((item.tax_rate || 0.2) * 100)
  );
  const [localQuantity, setLocalQuantity] = useState(String(item.quantity));

  // Synchroniser si item change de l'extérieur (changement d'item sélectionné)
  useEffect(() => {
    setLocalPrice(String(item.unit_price_ht));
    setLocalDiscount(String(item.discount_percentage || 0));
    setLocalEcoTax(String(item.eco_tax || 0));
    setLocalTaxRate(String((item.tax_rate || 0.2) * 100));
    setLocalQuantity(String(item.quantity));
  }, [item.id]);

  // Calculer total ligne HT
  // L'écotaxe est TOUJOURS par unité, donc on multiplie par la quantité
  const calculateTotal = (): number => {
    const subtotal =
      item.quantity *
      item.unit_price_ht *
      (1 - (item.discount_percentage || 0) / 100);
    return subtotal + (item.eco_tax || 0) * item.quantity;
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

  // ========== HANDLERS QUANTITÉ (état local string + onBlur) ==========
  const handleQuantityInputChange = (value: string) => {
    setLocalQuantity(value);
  };

  const handleQuantityBlur = () => {
    const parsed = parseInt(localQuantity);
    const validQuantity = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setLocalQuantity(String(validQuantity));
    if (validQuantity !== item.quantity && onUpdate && !readonly) {
      onUpdate(item.id, { quantity: validQuantity });
    }
  };

  // ========== HANDLERS PRIX (état local string + onBlur) ==========
  const handlePriceChange = (value: string) => {
    setLocalPrice(value);
  };

  const handlePriceBlur = () => {
    const parsed = parseFloat(localPrice);
    const validPrice = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setLocalPrice(String(validPrice));
    if (validPrice !== item.unit_price_ht && onUpdate && !readonly) {
      onUpdate(item.id, { unit_price_ht: validPrice });
    }
  };

  // ========== HANDLERS REMISE (état local string + onBlur) ==========
  const handleDiscountChange = (value: string) => {
    setLocalDiscount(value);
  };

  const handleDiscountBlur = () => {
    const parsed = parseFloat(localDiscount);
    const validDiscount = isNaN(parsed)
      ? 0
      : Math.min(100, Math.max(0, parsed));
    setLocalDiscount(String(validDiscount));
    if (
      validDiscount !== (item.discount_percentage || 0) &&
      onUpdate &&
      !readonly
    ) {
      onUpdate(item.id, { discount_percentage: validDiscount });
    }
  };

  // ========== HANDLERS ÉCO-TAXE (état local string + onBlur) ==========
  const handleEcoTaxChange = (value: string) => {
    setLocalEcoTax(value);
  };

  const handleEcoTaxBlur = () => {
    const parsed = parseFloat(localEcoTax);
    const validEcoTax = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setLocalEcoTax(String(validEcoTax));
    if (validEcoTax !== (item.eco_tax || 0) && onUpdate && !readonly) {
      onUpdate(item.id, { eco_tax: validEcoTax });
    }
  };

  // ========== HANDLERS TVA (ventes uniquement, état local string + onBlur) ==========
  const handleTaxRateChange = (value: string) => {
    setLocalTaxRate(value);
  };

  const handleTaxRateBlur = () => {
    const parsed = parseFloat(localTaxRate);
    const validTaxRate = (isNaN(parsed) || parsed < 0 ? 20 : parsed) / 100;
    setLocalTaxRate(String(validTaxRate * 100));
    if (
      validTaxRate !== (item.tax_rate || 0.2) &&
      onUpdate &&
      !readonly &&
      orderType === 'sales'
    ) {
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

            {/* Badge échantillon */}
            {item.sample_type && (
              <Badge variant="info" className="mt-1 text-xs">
                <FlaskConical className="h-3 w-3 mr-1" />
                Échantillon
              </Badge>
            )}

            {/* Badge client assigné (traçabilité échantillon) */}
            {(item.customer_organisation || item.customer_individual) && (
              <Badge variant="warning" className="mt-1 text-xs">
                {item.customer_individual ? (
                  <User className="h-3 w-3 mr-1" />
                ) : (
                  <Building2 className="h-3 w-3 mr-1" />
                )}
                {item.customer_organisation?.trade_name ||
                  item.customer_organisation?.legal_name ||
                  (item.customer_individual &&
                    `${item.customer_individual.first_name} ${item.customer_individual.last_name}`)}
              </Badge>
            )}
          </div>
        </div>
      </TableCell>

      {/* Colonne 2: Quantité */}
      <TableCell>
        {readonly ? (
          <span className="text-sm font-medium">{item.quantity}</span>
        ) : (
          <Input
            type="number"
            value={localQuantity}
            onChange={e => handleQuantityInputChange(e.target.value)}
            onBlur={handleQuantityBlur}
            className="w-20"
            min="1"
          />
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
            value={localPrice}
            onChange={e => handlePriceChange(e.target.value)}
            onBlur={handlePriceBlur}
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
            value={localDiscount}
            onChange={e => handleDiscountChange(e.target.value)}
            onBlur={handleDiscountBlur}
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
            value={localEcoTax}
            onChange={e => handleEcoTaxChange(e.target.value)}
            onBlur={handleEcoTaxBlur}
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
              value={localTaxRate}
              onChange={e => handleTaxRateChange(e.target.value)}
              onBlur={handleTaxRateBlur}
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
