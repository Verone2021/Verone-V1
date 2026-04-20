'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Plus,
  Minus,
  Trash2,
  Package,
  Euro,
  Edit,
  Check,
  X,
  MoreHorizontal,
} from 'lucide-react';

import type { ConsultationItem } from '@verone/consultations/hooks';

interface ConsultationProductsTableProps {
  items: ConsultationItem[];
  editingItem: string | null;
  editQuantity: number;
  editPrice: string;
  editNotes: string;
  editShippingCost: string;
  editCostPriceOverride: string;
  editIsSample: boolean;
  onSetEditQuantity: (v: number) => void;
  onSetEditPrice: (v: string) => void;
  onSetEditNotes: (v: string) => void;
  onSetEditShippingCost: (v: string) => void;
  onSetEditCostPriceOverride: (v: string) => void;
  onStartEdit: (item: ConsultationItem) => void;
  onSaveEdit: (itemId: string) => void;
  onCancelEdit: () => void;
  onChangeQuantity: (itemId: string, delta: number) => void;
  onChangeStatus: (itemId: string, status: string) => void;
  onSampleChange: (itemId: string, priceStr: string) => void;
  onRemove: (itemId: string, productName: string) => void;
  getItemCostPrice: (item: ConsultationItem) => number;
  getItemMargin: (item: ConsultationItem) => number;
  getItemMarginPercent: (item: ConsultationItem) => number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Attente',
  approved: 'OK',
  rejected: 'Refus',
  ordered: 'Cmdé',
};

export function ConsultationProductsTable({
  items,
  editingItem,
  editQuantity,
  editPrice,
  editNotes,
  editShippingCost,
  editCostPriceOverride,
  editIsSample,
  onSetEditQuantity,
  onSetEditPrice,
  onSetEditNotes,
  onSetEditShippingCost,
  onSetEditCostPriceOverride,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onChangeQuantity,
  onChangeStatus,
  onSampleChange,
  onRemove,
  getItemCostPrice,
  getItemMargin,
  getItemMarginPercent,
}: ConsultationProductsTableProps) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-400">
        <Package className="h-10 w-10 mx-auto mb-3 text-zinc-200" />
        <p className="text-sm font-medium">Aucun produit</p>
        <p className="text-xs mt-1">
          Utilisez &quot;Ajouter&quot; pour commencer
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/50">
            <th className="pl-4 pr-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 min-w-[160px]">
              Produit
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[70px]">
              Qté
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[90px]">
              Achat
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[80px]">
              Transport
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[55px]">
              TVA
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[90px]">
              Vente
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[55px] hidden md:table-cell">
              Stock
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[100px]">
              Échantillon
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[90px]">
              Marge
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[100px]">
              Statut
            </th>
            <th className="pr-4 pl-3 py-2 w-[40px]" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {items.map(item => {
            const isEditing = editingItem === item.id;
            const costPrice = getItemCostPrice(item);
            const margin = getItemMargin(item);
            const marginPct = getItemMarginPercent(item);
            const stockReal = item.product?.stock_real ?? 0;

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
              <tr key={item.id} className={rowClass}>
                {/* Produit */}
                <td className="pl-4 pr-3 py-0 h-10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-zinc-100 rounded overflow-hidden flex-shrink-0">
                      {item.product?.image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
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
                        <p className="text-[9px] text-blue-600 truncate">
                          {item.notes}
                        </p>
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
                      onChange={e =>
                        onSetEditQuantity(parseInt(e.target.value) || 1)
                      }
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
                        onChange={e =>
                          onSetEditCostPriceOverride(e.target.value)
                        }
                        placeholder={
                          item.product?.cost_price?.toFixed(2) ?? '0'
                        }
                        className="w-20 h-6 text-[11px] px-1 pr-5 py-0"
                      />
                      <Euro className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="flex flex-col leading-none">
                      <span className="text-[12px] font-medium text-zinc-700">
                        {costPrice.toFixed(2)}€
                      </span>
                      {item.cost_price_override != null && (
                        <span className="text-[8px] text-orange-600 font-bold uppercase">
                          Modifié
                        </span>
                      )}
                    </div>
                  )}
                </td>

                {/* Transport */}
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
                    <span className="text-[12px] text-zinc-700">
                      {item.shipping_cost > 0
                        ? `${item.shipping_cost.toFixed(2)}€`
                        : '—'}
                    </span>
                  )}
                </td>

                {/* TVA — 20% par défaut */}
                <td className="px-3 py-0 h-10">
                  <span className="text-[12px] text-zinc-600">20%</span>
                </td>

                {/* Vente */}
                <td className="px-3 py-0 h-10">
                  {isEditing ? (
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
                  ) : (
                    <span
                      className={`text-[12px] font-medium ${item.is_free ? 'text-zinc-400' : 'text-zinc-900'}`}
                    >
                      {item.is_free
                        ? 'Gratuit'
                        : `${item.unit_price?.toFixed(2) ?? '0.00'}€`}
                    </span>
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

                {/* Échantillon — prix (vide=non-sample, 0=gratuit, >0=payant) */}
                <td className="px-3 py-0 h-10">
                  {item.is_sample && item.is_free ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value="0"
                        placeholder="—"
                        onChange={e => onSampleChange(item.id, e.target.value)}
                        className="w-14 h-6 text-[11px] px-1 py-0"
                        aria-label="Prix échantillon"
                      />
                      <span className="text-[9px] text-emerald-600 font-bold uppercase">
                        Offert
                      </span>
                    </div>
                  ) : item.is_sample ? (
                    <div className="relative w-16">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price?.toString() ?? ''}
                        placeholder="—"
                        onChange={e => onSampleChange(item.id, e.target.value)}
                        className="w-full h-6 text-[11px] px-1 pr-4 py-0"
                        aria-label="Prix échantillon"
                      />
                      <Euro className="absolute right-1 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-zinc-400 pointer-events-none" />
                    </div>
                  ) : (
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value=""
                      placeholder="—"
                      onChange={e => onSampleChange(item.id, e.target.value)}
                      className="w-16 h-6 text-[11px] px-1 py-0 text-zinc-400"
                      aria-label="Prix échantillon"
                    />
                  )}
                </td>

                {/* Marge */}
                <td className="px-3 py-0 h-10">
                  {item.is_free || item.is_sample ? (
                    <span className="text-[11px] text-red-500 font-medium">
                      -{(costPrice * item.quantity).toFixed(0)}€
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

                {/* Statut segmented + toggle echantillon (si accepte) */}
                <td className="px-3 py-0 h-10">
                  {item.status === 'ordered' ? (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold uppercase rounded">
                      {STATUS_LABELS['ordered']}
                    </span>
                  ) : (
                    <div className="flex bg-zinc-100 p-0.5 rounded text-[9px] font-bold gap-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          void onChangeStatus(
                            item.id,
                            item.status === 'pending' ? 'approved' : 'pending'
                          )
                        }
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          item.status === 'approved'
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void onChangeStatus(
                            item.id,
                            item.status === 'pending' ? 'rejected' : 'pending'
                          )
                        }
                        className={`px-1.5 py-0.5 rounded transition-all ${
                          item.status === 'rejected'
                            ? 'bg-red-500 text-white shadow-sm'
                            : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        Non
                      </button>
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="pr-4 pl-3 py-0 h-10 text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onSaveEdit(item.id)}
                        className="h-6 w-6 flex items-center justify-center rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                        aria-label="Sauvegarder"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        className="h-6 w-6 flex items-center justify-center rounded border border-zinc-200 hover:bg-zinc-100 text-zinc-600"
                        aria-label="Annuler"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-7 w-7 flex items-center justify-center rounded text-zinc-300 hover:text-zinc-700 hover:bg-zinc-100"
                          aria-label="Plus d'actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onStartEdit(item)}>
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() =>
                            onRemove(
                              item.id,
                              item.product?.name ?? 'ce produit'
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
