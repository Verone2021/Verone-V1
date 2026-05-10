'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { TrendingUp } from 'lucide-react';

import { useSiteTopProducts } from '@verone/channels';

interface Props {
  /** Code canal Verone : site_internet | site_boemia | site_solar | site_flos */
  channelCode?: string;
}

const PERIOD_OPTIONS = [
  { value: 7, label: '7 derniers jours' },
  { value: 30, label: '30 derniers jours' },
  { value: 90, label: '90 derniers jours' },
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function SiteTopProductsSection({
  channelCode = 'site_internet',
}: Props) {
  const [period, setPeriod] = useState<number>(90);
  const { data, isLoading, error } = useSiteTopProducts({
    channelCode,
    periodDays: period,
    limit: 20,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Top 20 produits par revenu
        </h3>
        <select
          value={period}
          onChange={e => setPeriod(Number(e.target.value))}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"
        >
          {PERIOD_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-xs text-red-600">Erreur : {error.message}</p>
      )}

      {isLoading ? (
        <p className="p-6 text-sm text-gray-400">Chargement…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-md bg-gray-50 p-6 text-center">
          <TrendingUp className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            Aucune commande sur cette période.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="w-10 px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Produit</th>
                <th className="hidden px-3 py-2 text-right md:table-cell">
                  Quantité
                </th>
                <th className="hidden px-3 py-2 text-right lg:table-cell">
                  Commandes
                </th>
                <th className="px-3 py-2 text-right">Revenu HT</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p, i) => (
                <tr
                  key={p.product_id}
                  className="border-t border-gray-100 hover:bg-gray-50"
                >
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/produits/catalogue/detail/${p.product_id}`}
                      className="flex items-center gap-3"
                    >
                      {p.primary_image_url ? (
                        <Image
                          src={p.primary_image_url}
                          alt={p.product_name}
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded bg-gray-100" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {p.product_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {p.sku}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 md:table-cell">
                    {formatNumber(p.total_quantity)}
                  </td>
                  <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 lg:table-cell">
                    {formatNumber(p.order_count)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">
                    {formatCurrency(p.total_revenue_ht)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
