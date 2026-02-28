'use client';

import { useState, useEffect } from 'react';

import { Badge, Button, Input, TableCell, TableRow } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
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
  /** Callback to open the margin detail modal (LinkMe items only) */
  onEditMargin?: (itemId: string) => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function EditableQuoteItemRow({
  item,
  isLinkMe,
  onUpdate,
  onDelete,
  onEditMargin,
}: EditableQuoteItemRowProps) {
  // Local string states for free-form input (parse/validate on blur)
  const [localQuantity, setLocalQuantity] = useState(String(item.quantity));
  const [localPrice, setLocalPrice] = useState(String(item.unit_price_ht));
  const [localTva, setLocalTva] = useState(String(item.tva_rate));
  const [localDiscount, setLocalDiscount] = useState(
    String(item.discount_percentage)
  );
  const [localDescription, setLocalDescription] = useState(item.description);

  // Sync if item changes externally
  useEffect(() => {
    setLocalQuantity(String(item.quantity));
    setLocalPrice(String(item.unit_price_ht));
    setLocalTva(String(item.tva_rate));
    setLocalDiscount(String(item.discount_percentage));
    setLocalDescription(item.description);
  }, [item.id]);

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

      {/* Column 6 & 7: LinkMe read-only columns (conditional) */}
      {isLinkMe && (
        <>
          <TableCell className="text-right text-sm text-muted-foreground">
            {item.base_price_ht !== null
              ? formatCurrency(item.base_price_ht)
              : '-'}
          </TableCell>
          <TableCell className="text-right text-sm">
            {onEditMargin && item.linkme_selection_item_id ? (
              <button
                type="button"
                onClick={() => onEditMargin(item.id)}
                className="group cursor-pointer text-right hover:bg-blue-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors"
                title="Modifier la marge (ouvrir le détail)"
              >
                <span className="text-blue-600 group-hover:text-blue-800 font-medium">
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
                <p className="text-[9px] text-blue-400 group-hover:text-blue-600">
                  Modifier
                </p>
              </button>
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
