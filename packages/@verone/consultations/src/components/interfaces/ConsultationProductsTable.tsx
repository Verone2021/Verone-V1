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
}

// ── Component ──────────────────────────────────────────────────────

export function ConsultationProductsTable({
  items,
  editingItem,
  economicsByItemId,
  ...rowProps
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
            <th className="pr-4 pl-3 py-2 w-[40px]" aria-label="Actions" />
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {items.map(item => (
            <ConsultationProductRow
              key={item.id}
              item={item}
              isEditing={editingItem === item.id}
              econ={economicsByItemId.get(item.id) ?? null}
              {...rowProps}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
