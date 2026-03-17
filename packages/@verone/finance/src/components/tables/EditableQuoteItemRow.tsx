'use client';

import { useState, useEffect } from 'react';

import { Badge, Button, Input, TableCell, TableRow } from '@verone/ui';
import {
  calculateMargin,
  calculateMarginRateFromPrices,
  formatCurrency,
} from '@verone/utils';
import { Package, Trash2 } from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

/** Product info for UI display (never persisted to DB) */
interface EditableItemProduct {
  name: string;
  sku: string | null;
  image_url: string | null;
}

export interface EditableQuoteItem {
  id: string;
  product_id: string | null;
  product: EditableItemProduct | null;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  discount_percentage: number;
  eco_tax: number;
  // LinkMe metadata
  linkme_selection_item_id: string | null;
  base_price_ht: number | null;
  retrocession_rate: number | null;
}

interface EditableQuoteItemRowProps {
  item: EditableQuoteItem;
  isLinkMe: boolean;
  onUpdate: (itemId: string, field: string, value: string | number) => void;
  onDelete: (itemId: string) => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function EditableQuoteItemRow({
  item,
  isLinkMe,
  onUpdate,
  onDelete,
}: EditableQuoteItemRowProps) {
  // Is this a LinkMe item with margin editing capability?
  const isLinkMeItem = isLinkMe && !!item.linkme_selection_item_id;

  // Local string states for free-form input (parse/validate on blur)
  const [localQuantity, setLocalQuantity] = useState(String(item.quantity));
  const [localPrice, setLocalPrice] = useState(String(item.unit_price_ht));
  const [localTva, setLocalTva] = useState(String(item.tva_rate));
  const [localDiscount, setLocalDiscount] = useState(
    String(item.discount_percentage)
  );
  const [localDescription, setLocalDescription] = useState(item.description);
  const [localMarginRate, setLocalMarginRate] = useState(
    item.retrocession_rate !== null
      ? String((item.retrocession_rate * 100).toFixed(1))
      : ''
  );

  // Sync if item changes externally
  useEffect(() => {
    setLocalQuantity(String(item.quantity));
    setLocalPrice(String(item.unit_price_ht));
    setLocalTva(String(item.tva_rate));
    setLocalDiscount(String(item.discount_percentage));
    setLocalDescription(item.description);
    setLocalMarginRate(
      item.retrocession_rate !== null
        ? String((item.retrocession_rate * 100).toFixed(1))
        : ''
    );
  }, [
    item.id,
    item.retrocession_rate,
    item.quantity,
    item.unit_price_ht,
    item.tva_rate,
    item.discount_percentage,
    item.description,
  ]);

  // Is this a catalogue item (linked to a product)?
  const isCatalogue = item.product_id !== null;
  // Fallback: product_id exists but product was deleted
  const hasProduct = isCatalogue && item.product !== null;

  // Calculate line total HT
  const discount = 1 - item.discount_percentage / 100;
  const lineHt =
    item.quantity * item.unit_price_ht * discount +
    item.eco_tax * item.quantity;

  // ========== BLUR HANDLERS ==========
  const handleQuantityBlur = () => {
    const parsed = parseInt(localQuantity);
    const valid = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setLocalQuantity(String(valid));
    if (valid !== item.quantity) {
      onUpdate(item.id, 'quantity', valid);
    }
  };

  const handlePriceBlur = () => {
    const parsed = parseFloat(localPrice);
    const valid = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setLocalPrice(String(valid));
    if (valid !== item.unit_price_ht) {
      onUpdate(item.id, 'unit_price_ht', valid);
      // LinkMe: recalculate margin rate from the new price
      if (
        isLinkMeItem &&
        item.base_price_ht !== null &&
        item.base_price_ht > 0 &&
        valid > 0
      ) {
        const newMarginRate = calculateMarginRateFromPrices(
          item.base_price_ht,
          valid
        );
        setLocalMarginRate(String(newMarginRate.toFixed(1)));
        onUpdate(item.id, 'retrocession_rate', newMarginRate / 100);
      }
    }
  };

  const handleMarginBlur = () => {
    if (!isLinkMeItem || item.base_price_ht === null) return;
    const parsed = parseFloat(localMarginRate);
    const valid = isNaN(parsed) ? 0 : Math.min(99, Math.max(0, parsed));
    setLocalMarginRate(String(valid.toFixed(1)));

    const currentRate =
      item.retrocession_rate !== null ? item.retrocession_rate * 100 : 0;
    if (Math.abs(valid - currentRate) > 0.01) {
      // Recalculate selling price from margin
      const { sellingPriceHt } = calculateMargin({
        basePriceHt: item.base_price_ht,
        marginRate: valid,
      });
      setLocalPrice(String(sellingPriceHt));
      onUpdate(item.id, 'unit_price_ht', sellingPriceHt);
      onUpdate(item.id, 'retrocession_rate', valid / 100);
    }
  };

  const handleTvaBlur = () => {
    const parsed = parseFloat(localTva);
    const valid = isNaN(parsed) || parsed < 0 ? 20 : parsed;
    setLocalTva(String(valid));
    if (valid !== item.tva_rate) {
      onUpdate(item.id, 'tva_rate', valid);
    }
  };

  const handleDiscountBlur = () => {
    const parsed = parseFloat(localDiscount);
    const valid = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setLocalDiscount(String(valid));
    if (valid !== item.discount_percentage) {
      onUpdate(item.id, 'discount_percentage', valid);
    }
  };

  const handleDescriptionBlur = () => {
    if (localDescription !== item.description) {
      onUpdate(item.id, 'description', localDescription);
    }
  };

  return (
    <TableRow>
      {/* Column 1: Product / Description */}
      <TableCell>
        {hasProduct ? (
          /* Catalogue item: image + name + SKU (read-only) */
          <div className="flex gap-3 items-center">
            <div className="flex-shrink-0">
              {item.product!.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.product!.image_url}
                  alt={item.product!.name}
                  className="w-10 h-10 object-cover rounded border"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded border flex items-center justify-center">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm line-clamp-2">
                {item.product!.name}
              </p>
              {item.product!.sku && (
                <p className="text-xs text-muted-foreground">
                  {item.product!.sku}
                </p>
              )}
              <Badge variant="secondary" className="mt-1 text-[10px]">
                Catalogue
              </Badge>
            </div>
          </div>
        ) : (
          /* Free-form item: editable description */
          <div className="space-y-1">
            <Input
              value={localDescription}
              onChange={e => setLocalDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              className="h-8"
              placeholder="Description de la ligne..."
            />
            <Badge variant="outline" className="text-[10px]">
              Libre
            </Badge>
          </div>
        )}
      </TableCell>

      {/* Column 2: Quantity */}
      <TableCell>
        <Input
          type="number"
          value={localQuantity}
          onChange={e => setLocalQuantity(e.target.value)}
          onBlur={handleQuantityBlur}
          className="h-8 w-20 text-right"
          min={1}
        />
      </TableCell>

      {/* Column 3: Unit price HT */}
      <TableCell>
        <Input
          type="number"
          value={localPrice}
          onChange={e => setLocalPrice(e.target.value)}
          onBlur={handlePriceBlur}
          className="h-8 w-28 text-right"
          step={0.01}
          min={0}
        />
      </TableCell>

      {/* Column 4: TVA % */}
      <TableCell>
        <Input
          type="number"
          value={localTva}
          onChange={e => setLocalTva(e.target.value)}
          onBlur={handleTvaBlur}
          className="h-8 w-20 text-right"
          step={0.1}
          min={0}
        />
      </TableCell>

      {/* Column 5: Discount % */}
      <TableCell>
        <Input
          type="number"
          value={localDiscount}
          onChange={e => setLocalDiscount(e.target.value)}
          onBlur={handleDiscountBlur}
          className="h-8 w-20 text-right"
          min={0}
          max={100}
        />
      </TableCell>

      {/* Column 6 & 7: LinkMe columns — Prix base HT (read-only) + Marge (editable) */}
      {isLinkMe && (
        <>
          <TableCell className="text-right text-sm text-muted-foreground">
            {item.base_price_ht !== null
              ? formatCurrency(item.base_price_ht)
              : '-'}
          </TableCell>
          <TableCell className="text-right text-sm">
            {isLinkMeItem ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-end gap-1">
                  <Input
                    type="number"
                    value={localMarginRate}
                    onChange={e => setLocalMarginRate(e.target.value)}
                    onBlur={handleMarginBlur}
                    className="h-7 w-16 text-right text-xs"
                    step={0.1}
                    min={0}
                    max={99}
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                {item.retrocession_rate !== null &&
                  item.retrocession_rate > 0 && (
                    <p className="text-[10px] text-emerald-600 text-right">
                      {formatCurrency(
                        item.unit_price_ht *
                          item.quantity *
                          item.retrocession_rate
                      )}
                    </p>
                  )}
              </div>
            ) : (
              <div>
                <span className="text-muted-foreground">
                  {item.retrocession_rate !== null
                    ? `${(item.retrocession_rate * 100).toFixed(0)}%`
                    : '-'}
                </span>
                {item.retrocession_rate !== null &&
                  item.retrocession_rate > 0 && (
                    <p className="text-[10px] text-emerald-600">
                      {formatCurrency(
                        item.unit_price_ht *
                          item.quantity *
                          item.retrocession_rate
                      )}
                    </p>
                  )}
              </div>
            )}
          </TableCell>
        </>
      )}

      {/* Total HT (calculated) */}
      <TableCell className="text-right font-medium">
        {formatCurrency(lineHt)}
      </TableCell>

      {/* Delete button */}
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
