'use client';

import { useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { ResponsiveDataView } from '@verone/ui';

import type { LinkMeVeroneMarginProduct } from '../hooks/use-linkme-verone-margin';

const TOP = 10;

const fmtEur = (v: number): string =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

const fmtPct = (v: number): string =>
  `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v)} %`;

const fmtCoef = (v: number): string =>
  `×${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;

const fmtQty = (v: number): string => new Intl.NumberFormat('fr-FR').format(v);

const clr = (v: number): string => (v >= 0 ? 'text-green-600' : 'text-red-600');

interface Props {
  products: LinkMeVeroneMarginProduct[];
}

export function VeroneMarginProductsTable({
  products,
}: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? products : products.slice(0, TOP);

  if (products.length === 0) {
    return (
      <p className="text-sm text-neutral-400 italic">
        Aucun produit vendu sur la période.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <ResponsiveDataView
        data={visible}
        emptyMessage="Aucun produit."
        breakpoint="md"
        renderTable={rows => (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-medium text-neutral-500 uppercase">
                <tr>
                  <th className="px-3 py-2 min-w-[180px]">Produit</th>
                  <th className="px-3 py-2 text-right w-[80px]">Pièces</th>
                  <th className="px-3 py-2 text-right w-[110px]">Encaissé</th>
                  <th className="px-3 py-2 text-right w-[110px] hidden lg:table-cell">
                    Marge €
                  </th>
                  <th className="px-3 py-2 text-right w-[80px] hidden xl:table-cell">
                    Marge %
                  </th>
                  <th className="px-3 py-2 text-right w-[70px] hidden lg:table-cell">
                    Coef.
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map(p => (
                  <tr key={p.product_id} className="hover:bg-neutral-50">
                    <td className="px-3 py-2">
                      <p className="font-medium text-neutral-900 truncate max-w-[240px]">
                        {p.name}
                      </p>
                      {p.sku && (
                        <p className="text-xs text-neutral-400">{p.sku}</p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtQty(p.quantity)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtEur(p.verone_revenue)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      <span className={clr(p.margin_total)}>
                        {fmtEur(p.margin_total)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden xl:table-cell">
                      <span className={clr(p.margin_percent)}>
                        {fmtPct(p.margin_percent)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums hidden lg:table-cell">
                      {fmtCoef(p.coefficient)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        renderCard={p => (
          <div
            key={p.product_id}
            className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 space-y-1"
          >
            <p className="text-sm font-medium text-neutral-900">{p.name}</p>
            {p.sku && <p className="text-xs text-neutral-400">{p.sku}</p>}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-neutral-600">
              <span>{fmtQty(p.quantity)} pièces</span>
              <span>Encaissé : {fmtEur(p.verone_revenue)}</span>
              <span className={clr(p.margin_total)}>
                Marge : {fmtEur(p.margin_total)} · {fmtPct(p.margin_percent)} ·{' '}
                {fmtCoef(p.coefficient)}
              </span>
            </div>
          </div>
        )}
      />
      {products.length > TOP && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="flex h-11 items-center gap-1 text-xs text-blue-600 hover:text-blue-800 md:h-auto"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Afficher le top {TOP} seulement
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Voir tous les{' '}
              {products.length} produits
            </>
          )}
        </button>
      )}
    </div>
  );
}
