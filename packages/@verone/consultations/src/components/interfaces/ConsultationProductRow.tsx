'use client';

import { Input } from '@verone/ui';
import { Plus, Minus, Package, Euro } from 'lucide-react';

import type { ConsultationItem } from '@verone/consultations/hooks';
import type { LineEconomics } from '../../lib/consultation-economics';
import { ConsultationSampleCell } from './ConsultationSampleCell';
import { ConsultationStatusCell } from './ConsultationStatusCell';
import { ConsultationRowActions } from './ConsultationRowActions';

// ── Helpers locaux ─────────────────────────────────────────────────

const fmt = (p: number | null) => (p === null ? 'À fixer' : `${p.toFixed(2)}€`);

// ── Props ──────────────────────────────────────────────────────────

export interface ConsultationProductRowProps {
  item: ConsultationItem;
  isEditing: boolean;
  /**
   * Calcul de la ligne, fait une seule fois pour toute la consultation par le
   * parent (réglages inclus : marge par défaut). null si la ligne n'a pas de
   * calcul possible — quantité ≤ 0.
   */
  econ: LineEconomics | null;
  /** Marge par défaut de la consultation, affichée en repère de saisie. */
  defaultMarginPercentage: number | null;
  editQuantity: number;
  editPrice: string;
  editNotes: string;
  editShippingCost: string;
  editSellingShippingCost: string;
  editCostPriceOverride: string;
  editIsSample: boolean;
  editMarginPercentage: string;
  onSetEditQuantity: (v: number) => void;
  onSetEditPrice: (v: string) => void;
  onSetEditNotes: (v: string) => void;
  onSetEditShippingCost: (v: string) => void;
  onSetEditSellingShippingCost: (v: string) => void;
  onSetEditCostPriceOverride: (v: string) => void;
  onSetEditMarginPercentage: (v: string) => void;
  onStartEdit: (item: ConsultationItem) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;
  onChangeQuantity: (itemId: string, delta: number) => void;
  onChangeStatus: (itemId: string, status: string) => void;
  onSampleChange: (itemId: string, priceStr: string) => void;
  onRemove: (itemId: string, productName: string) => void;
}

// ── Component ──────────────────────────────────────────────────────

export function ConsultationProductRow({
  item,
  isEditing,
  econ,
  defaultMarginPercentage,
  editQuantity,
  editPrice,
  editNotes,
  editShippingCost,
  editSellingShippingCost,
  editCostPriceOverride,
  editIsSample,
  editMarginPercentage,
  onSetEditQuantity,
  onSetEditPrice,
  onSetEditNotes,
  onSetEditShippingCost,
  onSetEditSellingShippingCost,
  onSetEditCostPriceOverride,
  onSetEditMarginPercentage,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeQuantity,
  onChangeStatus,
  onSampleChange,
  onRemove,
}: ConsultationProductRowProps) {
  const margin = econ?.margin ?? 0;
  const marginPct = econ?.marginPercent ?? 0;
  const stockReal = item.product?.stock_real ?? 0;
  // Prix produit par la marge (aucun prix saisi sur la ligne)
  const priceFromMargin =
    econ !== null && item.unit_price === null ? econ.defaultUnitPrice : null;
  const appliedMargin = item.margin_percentage ?? defaultMarginPercentage;

  const rowClass = [
    'h-10 hover:bg-zinc-50 transition-colors',
    item.status === 'approved'
      ? 'border-l-2 border-l-emerald-500 bg-emerald-50/10'
      : item.status === 'rejected'
        ? 'opacity-60'
        : item.status === 'ordered'
          ? 'border-l-2 border-l-blue-400 bg-blue-50/10'
          : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr className={rowClass}>
      {/* Produit */}
      <td className="pl-4 pr-3 py-0 h-10">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
            {item.product?.image_url ? (
              /* eslint-disable-next-line @next/next/no-img-element -- vignette 24 px d'une URL produit externe : next/image exigerait de déclarer chaque domaine distant */
              <img
                src={item.product.image_url}
                alt={item.product.name ?? ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-3 w-3 text-zinc-400" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <a
              href={`/produits/catalogue/${item.product_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-semibold text-zinc-900 hover:text-blue-600 truncate block max-w-[130px]"
              title={item.product?.name}
            >
              {item.product?.name ?? item.product_id}
            </a>
            <p className="text-[9px] text-zinc-400 truncate">
              {item.product?.sku}
              {item.product?.supplier_name &&
                ` · ${item.product.supplier_name}`}
            </p>
            {item.product?.archived_at && (
              <span
                className="mt-0.5 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-white"
                title="Produit retiré : non commandable, absent du PDF client"
              >
                Retiré
              </span>
            )}
            {isEditing && (
              <Input
                type="text"
                value={editNotes}
                onChange={e => onSetEditNotes(e.target.value)}
                placeholder="Note..."
                className="mt-0.5 h-5 text-[11px] px-1 py-0 w-full"
              />
            )}
            {!isEditing && item.notes && (
              <p className="text-[9px] text-blue-600 truncate">{item.notes}</p>
            )}
          </div>
        </div>
      </td>

      {/* Quantité */}
      <td className="px-3 py-0 h-10">
        {isEditing ? (
          <Input
            type="number"
            min="1"
            value={editQuantity}
            onChange={e => onSetEditQuantity(parseInt(e.target.value) || 1)}
            className="w-14 h-6 text-[11px] px-1 py-0"
          />
        ) : (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => onChangeQuantity(item.id, -1)}
              disabled={item.quantity <= 1}
              className="h-5 w-5 flex items-center justify-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30"
              aria-label="Diminuer quantité"
            >
              <Minus className="h-2.5 w-2.5" />
            </button>
            <span className="w-7 text-center text-[12px] font-medium">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onChangeQuantity(item.id, 1)}
              className="h-5 w-5 flex items-center justify-center rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-100"
              aria-label="Augmenter quantité"
            >
              <Plus className="h-2.5 w-2.5" />
            </button>
          </div>
        )}
      </td>

      {/* Achat */}
      <td className="px-3 py-0 h-10">
        {isEditing ? (
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={editCostPriceOverride}
              onChange={e => onSetEditCostPriceOverride(e.target.value)}
              placeholder={item.product?.cost_price?.toFixed(2) ?? '0'}
              className="w-20 h-6 text-[11px] px-1 pr-5 py-0"
            />
            <Euro className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400 pointer-events-none" />
          </div>
        ) : (
          <div className="flex flex-col leading-none">
            <span className="text-[12px] font-medium text-zinc-700">
              {(econ?.unitCost ?? 0).toFixed(2)}€
            </span>
            {/* Sous-total si plusieurs unités */}
            {item.quantity > 1 && econ !== null && (
              <span className="text-[9px] text-zinc-400 mt-0.5">
                × {item.quantity} = {econ.purchaseAmount.toFixed(2)}€
              </span>
            )}
            {/* Badge "Modifié" uniquement si une vraie valeur d'origine existait */}
            {item.cost_price_override != null &&
              item.product?.cost_price != null && (
                <span className="text-[8px] text-orange-600 font-bold uppercase">
                  Modifié
                </span>
              )}
          </div>
        )}
      </td>

      {/* Transport — total ligne (pas par unité) */}
      <td className="px-3 py-0 h-10">
        {isEditing ? (
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={editShippingCost}
              onChange={e => onSetEditShippingCost(e.target.value)}
              className="w-16 h-6 text-[11px] px-1 pr-5 py-0"
              disabled={editIsSample}
            />
            <Euro className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400 pointer-events-none" />
          </div>
        ) : item.is_sample ? (
          <span className="text-[12px] text-zinc-400">—</span>
        ) : (
          <div className="flex flex-col leading-none">
            <span className="text-[12px] text-zinc-700">
              {item.shipping_cost > 0
                ? `${item.shipping_cost.toFixed(2)}€`
                : '—'}
            </span>
            {item.shipping_cost > 0 && (
              <span className="text-[9px] text-zinc-400 mt-0.5">
                total ligne
              </span>
            )}
          </div>
        )}
      </td>

      {/* Transport vente — total ligne refacturé au client */}
      <td className="px-3 py-0 h-10 hidden lg:table-cell">
        {isEditing ? (
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={editSellingShippingCost}
              onChange={e => onSetEditSellingShippingCost(e.target.value)}
              className="w-16 h-6 text-[11px] px-1 pr-5 py-0"
              disabled={editIsSample}
            />
            <Euro className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400 pointer-events-none" />
          </div>
        ) : item.is_sample ? (
          <span className="text-[12px] text-zinc-400">—</span>
        ) : (
          <div className="flex flex-col leading-none">
            <span className="text-[12px] text-emerald-700">
              {item.selling_shipping_cost > 0
                ? `${item.selling_shipping_cost.toFixed(2)}€`
                : '—'}
            </span>
            {item.selling_shipping_cost > 0 && (
              <span className="text-[9px] text-zinc-400 mt-0.5">refacturé</span>
            )}
          </div>
        )}
      </td>

      {/* TVA — 20% par défaut */}
      <td className="px-3 py-0 h-10">
        <span className="text-[12px] text-zinc-600">20%</span>
      </td>

      {/* Vente */}
      <td className="px-3 py-0 h-10">
        {isEditing ? (
          <div className="flex flex-col gap-0.5">
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={e => onSetEditPrice(e.target.value)}
                className="w-20 h-6 text-[11px] px-1 pr-5 py-0"
                disabled={item.is_free}
              />
              <Euro className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400 pointer-events-none" />
            </div>
            {/* Marge de la ligne : vide = marge par défaut de la consultation */}
            <div className="relative">
              <Input
                type="number"
                step="1"
                value={editMarginPercentage}
                onChange={e => onSetEditMarginPercentage(e.target.value)}
                placeholder={
                  defaultMarginPercentage !== null
                    ? `${defaultMarginPercentage} %`
                    : 'marge %'
                }
                title="Marge de cette ligne en %. Vide : la marge par défaut de la consultation s'applique."
                className="w-20 h-6 text-[11px] px-1 pr-5 py-0"
                disabled={item.is_free}
              />
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-zinc-400 pointer-events-none">
                %
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col leading-none">
            <span
              className={`text-[12px] font-medium ${item.is_free ? 'text-zinc-400' : 'text-zinc-900'}`}
            >
              {item.is_free
                ? 'Gratuit'
                : fmt(econ?.unitPrice ?? item.unit_price)}
            </span>
            {/* Prix produit par la marge, aucun prix saisi sur la ligne */}
            {!item.is_free && priceFromMargin !== null && (
              <span
                className="text-[9px] text-blue-600 mt-0.5"
                title="Prix calculé à partir du prix de revient et de la marge. Saisir un prix ici le remplace."
              >
                calculé · marge {appliedMargin}%
              </span>
            )}
            {/* Sous-total vente si plusieurs unités et payant */}
            {!item.is_free &&
              item.quantity > 1 &&
              econ?.salesAmount != null && (
                <span className="text-[9px] text-zinc-400 mt-0.5">
                  × {item.quantity} = {econ.salesAmount.toFixed(2)}€
                </span>
              )}
          </div>
        )}
      </td>

      {/* Stock */}
      <td className="px-3 py-0 h-10 hidden md:table-cell">
        <span
          className={`text-[12px] font-bold ${stockReal > 0 ? 'text-emerald-600' : 'text-rose-500'}`}
        >
          {stockReal}
        </span>
      </td>

      {/* Échantillon */}
      <ConsultationSampleCell
        itemId={item.id}
        isSample={item.is_sample}
        isFree={item.is_free}
        unitPrice={item.unit_price}
        onSampleChange={onSampleChange}
      />

      {/* Marge */}
      <td className="px-3 py-0 h-10">
        {item.is_free || item.is_sample ? (
          <span className="text-[11px] text-red-500 font-medium">
            -{(econ?.cost ?? 0).toFixed(0)}€
          </span>
        ) : (
          <div className="flex items-center gap-1">
            <span
              className={`text-[12px] font-bold ${margin >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
            >
              {margin >= 0 ? '+' : ''}
              {margin.toFixed(0)}€
            </span>
            <span
              className={`text-[9px] font-bold ${marginPct >= 30 ? 'text-emerald-700' : marginPct >= 0 ? 'text-orange-600' : 'text-red-600'}`}
            >
              {marginPct.toFixed(0)}%
            </span>
          </div>
        )}
      </td>

      {/* Statut */}
      <ConsultationStatusCell
        itemId={item.id}
        status={item.status ?? 'pending'}
        onChangeStatus={onChangeStatus}
      />

      {/* Actions */}
      <ConsultationRowActions
        item={item}
        isEditing={isEditing}
        onStartEdit={onStartEdit}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onRemove={onRemove}
      />
    </tr>
  );
}
