'use client';

import Link from 'next/link';

import { ProductThumbnail } from '@verone/products';
import {
  Badge,
  Button,
  TableCell,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import {
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  Loader2,
  BookOpen,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';

import { type SelectionItem } from '../../hooks/use-linkme-selections';
import {
  getMarginIndicatorColor,
  MARGIN_INDICATOR_COLORS,
  MARGIN_INDICATOR_TOOLTIPS,
} from './selection-types';

// ─────────────────────────────────────────────
// Price computation
// ─────────────────────────────────────────────

export type ItemPrices = {
  catalogPriceHT: number;
  selectionPriceHT: number;
  prixVenteFinalHT: number;
  marginEuros: number;
  prixAffilieHT: number;
  displayMarginRate: number;
  isAffiliateProduct: boolean;
  hasDiscount: boolean;
  discountPercent: number;
};

export function computeItemPrices(item: SelectionItem): ItemPrices {
  const marginRate = item.margin_rate;
  const commissionRate = (item.commission_rate ?? 0) / 100;
  const isAffiliateProduct =
    item.product?.created_by_affiliate !== null &&
    item.product?.created_by_affiliate !== undefined;
  const catalogPriceHT = item.catalog_price_ht ?? item.base_price_ht;
  const selectionPriceHT = item.base_price_ht;
  let prixVenteFinalHT: number;
  let marginEuros: number;
  let prixAffilieHT: number;
  let displayMarginRate: number;
  if (isAffiliateProduct) {
    const rate = item.product?.affiliate_commission_rate ?? 0;
    displayMarginRate = rate;
    prixVenteFinalHT = selectionPriceHT;
    marginEuros = selectionPriceHT * (rate / 100);
    prixAffilieHT = selectionPriceHT - marginEuros;
  } else {
    displayMarginRate = marginRate;
    prixVenteFinalHT = selectionPriceHT * (1 + commissionRate);
    const withMargin = selectionPriceHT * (1 + marginRate / 100);
    marginEuros = withMargin - selectionPriceHT;
    prixAffilieHT = withMargin * (1 + commissionRate);
  }
  const hasDiscount = selectionPriceHT < catalogPriceHT && catalogPriceHT > 0;
  const discountPercent = hasDiscount
    ? ((catalogPriceHT - selectionPriceHT) / catalogPriceHT) * 100
    : 0;
  return {
    catalogPriceHT,
    selectionPriceHT,
    prixVenteFinalHT,
    marginEuros,
    prixAffilieHT,
    displayMarginRate,
    isAffiliateProduct,
    hasDiscount,
    discountPercent,
  };
}

export function getStockBadgeClass(stock: number): string {
  if (stock > 10) return 'bg-green-100 text-green-700';
  if (stock > 0) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
}

// ─────────────────────────────────────────────
// Sub-cells
// ─────────────────────────────────────────────

type ItemProductCellProps = {
  item: SelectionItem;
  isAffiliateProduct: boolean;
};

export function ItemProductCell({
  item,
  isAffiliateProduct,
}: ItemProductCellProps) {
  return (
    <TableCell>
      <div>
        <div className="flex items-center gap-2">
          {item.channel_pricing_id ? (
            <Link
              href={`/canaux-vente/linkme/catalogue/${item.channel_pricing_id}`}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {item.product?.name}
            </Link>
          ) : (
            <span className="font-medium">{item.product?.name}</span>
          )}
          {isAffiliateProduct && (
            <Badge
              variant="outline"
              className="text-xs bg-purple-100 text-purple-700 border-purple-200"
            >
              Revendeur
            </Badge>
          )}
          {item.is_hidden_by_staff && (
            <Badge
              variant="outline"
              className="text-xs bg-orange-100 text-orange-700 border-orange-200"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              Masqué
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{item.product?.sku}</p>
      </div>
    </TableCell>
  );
}

export function ItemPriceCells({ prices }: { prices: ItemPrices }) {
  const {
    catalogPriceHT,
    selectionPriceHT,
    prixVenteFinalHT,
    marginEuros,
    prixAffilieHT,
    displayMarginRate,
    isAffiliateProduct,
    hasDiscount,
    discountPercent,
  } = prices;
  const indicatorColor = getMarginIndicatorColor(displayMarginRate);
  return (
    <>
      <TableCell className="text-right font-mono text-muted-foreground">
        {catalogPriceHT.toFixed(2)} €
      </TableCell>
      <TableCell className="text-right font-mono">
        <div className="flex items-center justify-end gap-1.5">
          <span className="font-medium">{selectionPriceHT.toFixed(2)} €</span>
          {hasDiscount && (
            <Badge
              variant="secondary"
              className="text-xs bg-green-100 text-green-700 border-green-200"
            >
              -{discountPercent.toFixed(1)}%
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-mono font-medium text-primary">
        {prixVenteFinalHT.toFixed(2)} €
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center gap-1.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${MARGIN_INDICATOR_COLORS[indicatorColor]} shrink-0`}
            title={
              isAffiliateProduct
                ? 'Frais LinkMe (produit revendeur)'
                : MARGIN_INDICATOR_TOOLTIPS[indicatorColor]
            }
          />
          <span className="font-mono text-sm">
            {displayMarginRate.toFixed(2)} %
          </span>
        </div>
      </TableCell>
      <TableCell
        className={`text-right font-mono ${isAffiliateProduct ? 'text-orange-600' : 'text-green-600'}`}
      >
        {marginEuros.toFixed(2)} €
      </TableCell>
      <TableCell
        className={`text-right font-mono font-semibold ${isAffiliateProduct ? 'text-green-600' : 'text-blue-600'}`}
        title={
          isAffiliateProduct
            ? 'Payout affilié (prix vente - frais)'
            : 'Prix affilié HT'
        }
      >
        {prixAffilieHT.toFixed(2)} €
      </TableCell>
    </>
  );
}

// ─────────────────────────────────────────────
// Actions menu
// ─────────────────────────────────────────────

type VisibilityItemProps = {
  item: SelectionItem;
  removeProductPending: boolean;
  toggleVisibilityPending: boolean;
  onToggleVisibility: (item: SelectionItem) => void;
  onDeleteItem: (itemId: string) => void;
};

function VisibilityItems({
  item,
  removeProductPending,
  toggleVisibilityPending,
  onToggleVisibility,
  onDeleteItem,
}: VisibilityItemProps) {
  return (
    <>
      <DropdownMenuItem
        onClick={() => onToggleVisibility(item)}
        disabled={toggleVisibilityPending}
        className="text-gray-600 focus:text-gray-600"
      >
        {item.is_hidden_by_staff ? (
          <>
            <Eye className="h-4 w-4 mr-2" />
            Rendre visible
          </>
        ) : (
          <>
            <EyeOff className="h-4 w-4 mr-2" />
            Masquer le produit
          </>
        )}
      </DropdownMenuItem>
      {item.is_hidden_by_staff && (
        <DropdownMenuItem
          onClick={() => onDeleteItem(item.id)}
          disabled={removeProductPending}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </DropdownMenuItem>
      )}
    </>
  );
}

export type ItemActionsMenuProps = {
  item: SelectionItem;
  syncingItemIds: Set<string>;
  toggleVisibilityPending: boolean;
  removeProductPending: boolean;
  onSyncItem: (item: SelectionItem) => void;
  onToggleVisibility: (item: SelectionItem) => void;
  onOpenViewModal: (item: SelectionItem) => void;
  onOpenEditModal: (item: SelectionItem) => void;
  onDeleteItem: (itemId: string) => void;
};

export function ItemActionsMenu({
  item,
  syncingItemIds,
  toggleVisibilityPending,
  removeProductPending,
  onSyncItem,
  onToggleVisibility,
  onOpenViewModal,
  onOpenEditModal,
  onDeleteItem,
}: ItemActionsMenuProps) {
  const isSyncing = syncingItemIds.has(item.id);
  const hasDivergence =
    item.catalog_price_ht !== null &&
    item.catalog_price_ht !== item.base_price_ht;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpenViewModal(item)}>
          <BookOpen className="h-4 w-4 mr-2" />
          Voir la fiche
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpenEditModal(item)}>
          <Pencil className="h-4 w-4 mr-2" />
          Modifier
        </DropdownMenuItem>
        {hasDivergence && (
          <DropdownMenuItem
            onClick={() => onSyncItem(item)}
            disabled={isSyncing}
            className="text-orange-600 focus:text-orange-600"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Synchroniser prix ({item.base_price_ht}€ → {item.catalog_price_ht}€)
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <VisibilityItems
          item={item}
          removeProductPending={removeProductPending}
          toggleVisibilityPending={toggleVisibilityPending}
          onToggleVisibility={onToggleVisibility}
          onDeleteItem={onDeleteItem}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────────────────────────────
// Full row
// ─────────────────────────────────────────────

export type ItemRowProps = {
  item: SelectionItem;
  selectionId: string;
  syncingItemIds: Set<string>;
  toggleVisibilityPending: boolean;
  removeProductPending: boolean;
  onSyncItem: (item: SelectionItem) => void;
  onToggleVisibility: (item: SelectionItem) => void;
  onOpenViewModal: (item: SelectionItem) => void;
  onOpenEditModal: (item: SelectionItem) => void;
  onDeleteItem: (itemId: string) => void;
};

export function ItemRow({
  item,
  selectionId: _selectionId,
  syncingItemIds,
  toggleVisibilityPending,
  removeProductPending,
  onSyncItem,
  onToggleVisibility,
  onOpenViewModal,
  onOpenEditModal,
  onDeleteItem,
}: ItemRowProps) {
  const prices = computeItemPrices(item);
  const stock = item.product?.stock_real ?? 0;
  return (
    <TableRow
      className={
        item.is_hidden_by_staff ? 'opacity-50 bg-orange-50/50' : undefined
      }
    >
      <TableCell>
        <ProductThumbnail
          src={item.product_image_url}
          alt={item.product?.name ?? 'Produit'}
          size="sm"
        />
      </TableCell>
      <ItemProductCell
        item={item}
        isAffiliateProduct={prices.isAffiliateProduct}
      />
      <TableCell className="text-center">
        <Badge variant="outline" className={getStockBadgeClass(stock)}>
          {stock}
        </Badge>
      </TableCell>
      <ItemPriceCells prices={prices} />
      <TableCell className="text-right">
        <ItemActionsMenu
          item={item}
          syncingItemIds={syncingItemIds}
          toggleVisibilityPending={toggleVisibilityPending}
          removeProductPending={removeProductPending}
          onSyncItem={onSyncItem}
          onToggleVisibility={onToggleVisibility}
          onOpenViewModal={onOpenViewModal}
          onOpenEditModal={onOpenEditModal}
          onDeleteItem={onDeleteItem}
        />
      </TableCell>
    </TableRow>
  );
}
