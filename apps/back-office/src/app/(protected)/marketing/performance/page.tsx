'use client';

import { useMemo, useState } from 'react';

import {
  BarChart2,
  Download,
  Eye,
  Image as ImageIcon,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';

import {
  useMetaCommerceProducts,
  useGoogleMerchantProducts,
  useSiteTopProducts,
} from '@verone/channels';
import { useChannelStatsAggregated } from '@verone/marketing';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { cn } from '@verone/utils';
import { arrayToCSV, downloadCSV } from '@verone/utils/export/csv';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 derniers jours' },
  { value: 30, label: '30 derniers jours' },
  { value: 90, label: '90 derniers jours' },
];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
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

interface PivotRow extends Record<string, unknown> {
  product_id: string;
  product_name: string;
  sku: string;
  meta_revenue: number;
  google_revenue: number;
  site_revenue: number;
  total_revenue: number;
}

function exportPivotCsv(rows: PivotRow[]): void {
  const csv = arrayToCSV(rows, [
    { key: 'product_name', label: 'Produit' },
    { key: 'sku', label: 'SKU' },
    { key: 'meta_revenue', label: 'Meta HT' },
    { key: 'google_revenue', label: 'Google HT' },
    { key: 'site_revenue', label: 'Site HT' },
    { key: 'total_revenue', label: 'Total HT' },
  ]);
  downloadCSV(csv, `marketing-performance-${isoDate(new Date())}.csv`);
}

interface KpiCardProps {
  label: string;
  value: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  channel: string;
}

function KpiCard({
  label,
  value,
  Icon,
  iconBg,
  iconColor,
  channel,
}: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4">
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          iconBg
        )}
      >
        <Icon className={cn('h-5 w-5', iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs uppercase tracking-wide text-gray-500">
          {label} · {channel}
        </p>
        <p className="truncate text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function MarketingPerformancePage() {
  const [period, setPeriod] = useState<number>(30);

  const endDate = useMemo(() => isoDate(new Date()), []);
  const startDate = useMemo(
    () => isoDate(new Date(Date.now() - period * 24 * 60 * 60 * 1000)),
    [period]
  );

  const metaHistory = useChannelStatsAggregated({
    channelCode: 'meta_commerce',
    startDate,
    endDate,
  });
  const googleHistory = useChannelStatsAggregated({
    channelCode: 'google_merchant',
    startDate,
    endDate,
  });

  const metaTotals = useMemo(() => {
    const rows = metaHistory.data ?? [];
    return rows.reduce(
      (acc, r) => ({
        impressions: acc.impressions + r.total_impressions,
        clicks: acc.clicks + r.total_clicks,
        conversions: acc.conversions + r.total_conversions,
        revenue: acc.revenue + Number(r.total_revenue_ht),
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );
  }, [metaHistory.data]);

  const googleTotals = useMemo(() => {
    const rows = googleHistory.data ?? [];
    return rows.reduce(
      (acc, r) => ({
        impressions: acc.impressions + r.total_impressions,
        clicks: acc.clicks + r.total_clicks,
        conversions: acc.conversions + r.total_conversions,
        revenue: acc.revenue + Number(r.total_revenue_ht),
      }),
      { impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
    );
  }, [googleHistory.data]);

  const metaProducts = useMetaCommerceProducts();
  const googleProducts = useGoogleMerchantProducts();
  const siteTopProducts = useSiteTopProducts({
    channelCode: 'site_internet',
    periodDays: period,
    limit: 100,
  });

  const pivotRows = useMemo<PivotRow[]>(() => {
    const map = new Map<string, PivotRow>();
    const add = (
      key: string,
      product_name: string,
      sku: string,
      channelKey: 'meta_revenue' | 'google_revenue' | 'site_revenue',
      revenue: number
    ) => {
      const existing = map.get(key);
      if (existing) {
        existing[channelKey] += revenue;
        existing.total_revenue += revenue;
      } else {
        map.set(key, {
          product_id: key,
          product_name,
          sku,
          meta_revenue: channelKey === 'meta_revenue' ? revenue : 0,
          google_revenue: channelKey === 'google_revenue' ? revenue : 0,
          site_revenue: channelKey === 'site_revenue' ? revenue : 0,
          total_revenue: revenue,
        });
      }
    };

    (metaProducts.data ?? []).forEach(p => {
      if (p.sync_status !== 'deleted') {
        add(
          p.product_id,
          p.product_name,
          p.sku,
          'meta_revenue',
          Number(p.revenue_ht)
        );
      }
    });
    (googleProducts.data ?? []).forEach(p => {
      add(
        p.product_id,
        p.product_name,
        p.sku,
        'google_revenue',
        Number(p.revenue_ht)
      );
    });
    (siteTopProducts.data ?? []).forEach(p => {
      add(
        p.product_id,
        p.product_name,
        p.sku,
        'site_revenue',
        Number(p.total_revenue_ht)
      );
    });

    return Array.from(map.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 50);
  }, [metaProducts.data, googleProducts.data, siteTopProducts.data]);

  const isLoading =
    metaHistory.isLoading ||
    googleHistory.isLoading ||
    metaProducts.isLoading ||
    googleProducts.isLoading ||
    siteTopProducts.isLoading;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Performance marketing
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Vue agrégée de tous les canaux : Meta Commerce, Google Merchant,
            Site Internet Vérone.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            type="button"
            onClick={() => exportPivotCsv(pivotRows)}
            disabled={pivotRows.length === 0}
            className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      <Tabs defaultValue="produits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="produits" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Top produits ({pivotRows.length})
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Top images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="produits" className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Vues"
              value={formatNumber(
                metaTotals.impressions + googleTotals.impressions
              )}
              Icon={Eye}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              channel="Meta + Google"
            />
            <KpiCard
              label="Clics"
              value={formatNumber(metaTotals.clicks + googleTotals.clicks)}
              Icon={MousePointerClick}
              iconBg="bg-violet-50"
              iconColor="text-violet-500"
              channel="Meta + Google"
            />
            <KpiCard
              label="Conversions"
              value={formatNumber(
                metaTotals.conversions + googleTotals.conversions
              )}
              Icon={ShoppingCart}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              channel="Meta + Google"
            />
            <KpiCard
              label="Revenu HT"
              value={formatCurrency(metaTotals.revenue + googleTotals.revenue)}
              Icon={TrendingUp}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
              channel="Meta + Google"
            />
          </div>

          {isLoading ? (
            <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
              Chargement…
            </p>
          ) : pivotRows.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
              <BarChart2 className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Pas encore de données sur la période sélectionnée.
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
                      Meta HT
                    </th>
                    <th className="hidden px-3 py-2 text-right md:table-cell">
                      Google HT
                    </th>
                    <th className="hidden px-3 py-2 text-right lg:table-cell">
                      Site HT
                    </th>
                    <th className="px-3 py-2 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotRows.map((r, i) => (
                    <tr
                      key={r.product_id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">
                        <p className="truncate font-medium text-gray-900">
                          {r.product_name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {r.sku}
                        </p>
                      </td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 md:table-cell">
                        {formatCurrency(r.meta_revenue)}
                      </td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 md:table-cell">
                        {formatCurrency(r.google_revenue)}
                      </td>
                      <td className="hidden px-3 py-2 text-right tabular-nums text-gray-700 lg:table-cell">
                        {formatCurrency(r.site_revenue)}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums text-gray-900">
                        {formatCurrency(r.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-6">
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-3 text-sm font-medium text-gray-900">
              Top images — bientôt disponible
            </h3>
            <p className="mt-2 text-xs text-gray-500">
              Le suivi des vues par image nécessite l&apos;activation du Pixel
              Meta + Conversions API (sprint à venir).
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
