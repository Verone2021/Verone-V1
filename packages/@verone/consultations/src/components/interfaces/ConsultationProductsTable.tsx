'use client';

import { Package } from 'lucide-react';

import type { ConsultationItem } from '@verone/consultations/hooks';
import type { LineEconomics } from '../../lib/consultation-economics';
import {
  ConsultationProductRow,
  type ConsultationProductRowProps,
} from './ConsultationProductRow';

// ── Props ──────────────────────────────────────────────────────────

interface ConsultationProductsTableProps
  extends Omit<ConsultationProductRowProps, 'item' | 'isEditing' | 'econ'> {
  items: ConsultationItem[];
  editingItem: string | null;
  /** Calcul de chaque ligne, fait une seule fois pour la consultation. */
  economicsByItemId: Map<string, LineEconomics>;
  /** Fournisseurs dont la livraison est saisie globalement : transport de ligne verrouillé. */
  suppliersWithShipping?: ReadonlySet<string>;
}

/** Lignes regroupées par fournisseur, dans l'ordre d'apparition. */
interface SupplierBlock {
  supplierId: string | null;
  supplierName: string;
  items: ConsultationItem[];
}

function groupBySupplier(items: ConsultationItem[]): SupplierBlock[] {
  const blocks: SupplierBlock[] = [];
  for (const item of items) {
    const supplierId = item.product?.supplier_id ?? null;
    const block = blocks.find(b => b.supplierId === supplierId);
    if (block) {
      block.items.push(item);
    } else {
      blocks.push({
        supplierId,
        supplierName: item.product?.supplier_name ?? 'Sans fournisseur',
        items: [item],
      });
    }
  }
  return blocks;
}

// ── Component ──────────────────────────────────────────────────────

export function ConsultationProductsTable({
  items,
  editingItem,
  economicsByItemId,
  suppliersWithShipping,
  ...rowProps
}: ConsultationProductsTableProps) {
  // Un seul fournisseur : pas d'en-tête de groupe, ce serait du bruit
  const showSupplierGroups = groupBySupplier(items).length > 1;

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
            <th
              className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[80px]"
              title="Frais propres à cette ligne seulement. La livraison facturée une fois par le fournisseur se saisit dans le bloc « Frais par fournisseur »."
            >
              Transport ligne
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[90px] hidden lg:table-cell">
              Revient
            </th>
            <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400 w-[80px] hidden lg:table-cell">
              Transp. vente
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
            <th
              className="sticky right-0 z-10 bg-zinc-50 pr-4 pl-3 py-2 w-[40px]"
              aria-label="Actions"
            />
          </tr>
        </thead>
        {/* Un bloc par fournisseur : la commande fournisseur suit ce découpage */}
        {groupBySupplier(items).map(block => {
          const blockFees = block.items.reduce(
            (sum, item) =>
              sum + (economicsByItemId.get(item.id)?.supplierFees ?? 0),
            0
          );
          return (
            <tbody
              key={block.supplierId ?? 'sans-fournisseur'}
              className="divide-y divide-zinc-50"
            >
              {showSupplierGroups && (
                <tr className="bg-zinc-50/70 border-t border-zinc-100">
                  <td colSpan={13} className="pl-4 pr-3 py-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      {block.supplierName}
                    </span>
                    <span className="ml-2 text-[10px] text-zinc-400">
                      {block.items.length} ligne
                      {block.items.length > 1 ? 's' : ''}
                      {blockFees > 0 &&
                        ` · ${blockFees.toFixed(2)}€ de frais répartis`}
                    </span>
                  </td>
                </tr>
              )}
              {block.items.map(item => (
                <ConsultationProductRow
                  key={item.id}
                  item={item}
                  isEditing={editingItem === item.id}
                  econ={economicsByItemId.get(item.id) ?? null}
                  supplierShippingEntered={
                    item.product?.supplier_id
                      ? (suppliersWithShipping?.has(item.product.supplier_id) ??
                        false)
                      : false
                  }
                  {...rowProps}
                />
              ))}
            </tbody>
          );
        })}
      </table>
    </div>
  );
}
