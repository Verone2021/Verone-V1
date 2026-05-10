'use client';

import Image from 'next/image';
import Link from 'next/link';

import { TrendingUp } from 'lucide-react';

export interface ChannelTopProductRow {
  product_id: string;
  product_name: string;
  sku: string;
  primary_image_url: string | null;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue_ht: number;
}

interface Props {
  products: ChannelTopProductRow[];
  loading: boolean;
  channelLabel: string;
}

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

export function ChannelTopProductsTable({
  products,
  loading,
  channelLabel,
}: Props) {
  if (loading) {
    return <p className="p-6 text-sm text-gray-400">Chargement…</p>;
  }

  if (products.length === 0) {
    return (
      <div className="rounded-md bg-gray-50 p-6 text-center">
        <TrendingUp className="mx-auto h-8 w-8 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">
          Pas encore de revenu attribué sur {channelLabel}.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Les performances apparaîtront ici une fois que les premiers produits
          auront généré des conversions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="w-10 px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Produit</th>
            <th className="hidden px-3 py-2 text-right md:table-cell">Vues</th>
            <th className="hidden px-3 py-2 text-right md:table-cell">Clics</th>
            <th className="hidden px-3 py-2 text-right lg:table-cell">
              Conversions
            </th>
            <th className="px-3 py-2 text-right">Revenu HT</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
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
                    <p className="truncate text-xs text-gray-500">{p.sku}</p>
                  </div>
                </Link>
              </td>
              <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 md:table-cell">
                {formatNumber(p.impressions)}
              </td>
              <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 md:table-cell">
                {formatNumber(p.clicks)}
              </td>
              <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 lg:table-cell">
                {formatNumber(p.conversions)}
              </td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">
                {formatCurrency(p.revenue_ht)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
