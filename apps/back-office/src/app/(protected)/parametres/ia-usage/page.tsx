'use client';

import { useState } from 'react';

import {
  AlertTriangle,
  Clock,
  Coins,
  Cpu,
  TrendingUp,
  Users,
} from 'lucide-react';

import { useAiUsageStats, useAiUsageByEndpoint } from '@verone/marketing';
import { cn } from '@verone/utils';

const PERIODS = [
  { value: 7, label: '7 derniers jours' },
  { value: 30, label: '30 derniers jours' },
  { value: 90, label: '90 derniers jours' },
];

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

interface KpiCardProps {
  label: string;
  value: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
}

function KpiCard({
  label,
  value,
  Icon,
  iconBg,
  iconColor,
  subtitle,
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
          {label}
        </p>
        <p className="truncate text-lg font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function IaUsagePage() {
  const [period, setPeriod] = useState<number>(30);
  const stats = useAiUsageStats(period);
  const byEndpoint = useAiUsageByEndpoint(period);

  const s = stats.data;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Utilisation IA (Gemini)
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivi des appels Gemini, latence, coûts estimés et taux
            d&apos;erreur.
          </p>
        </div>
        <select
          value={period}
          onChange={e => setPeriod(Number(e.target.value))}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm"
        >
          {PERIODS.map(p => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {stats.isLoading ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Chargement…
        </p>
      ) : !s || s.total_calls === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <Cpu className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">
            Aucun appel IA sur cette période
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            Les appels apparaîtront ici dès la première génération de visuel,
            hashtags ou description via Gemini.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Total appels"
              value={formatNumber(s.total_calls)}
              Icon={Cpu}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <KpiCard
              label="Coût estimé"
              value={formatCents(s.total_cost_cents)}
              Icon={Coins}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
              subtitle={`${formatNumber(s.total_tokens_output)} tokens out`}
            />
            <KpiCard
              label="Latence moyenne"
              value={formatMs(s.avg_latency_ms)}
              Icon={Clock}
              iconBg="bg-violet-50"
              iconColor="text-violet-500"
            />
            <KpiCard
              label="Taux d'erreur"
              value={`${s.error_rate}%`}
              Icon={s.error_rate > 5 ? AlertTriangle : TrendingUp}
              iconBg={s.error_rate > 5 ? 'bg-red-50' : 'bg-orange-50'}
              iconColor={s.error_rate > 5 ? 'text-red-500' : 'text-orange-500'}
              subtitle={`${formatNumber(s.error_count)} erreurs`}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Répartition par endpoint
              </h3>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                {formatNumber(s.unique_users)} utilisateurs uniques
              </span>
            </div>
            {byEndpoint.isLoading ? (
              <p className="p-6 text-sm text-gray-400">Chargement…</p>
            ) : !byEndpoint.data || byEndpoint.data.length === 0 ? (
              <p className="p-6 text-sm text-gray-500">Aucun endpoint actif.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Endpoint</th>
                    <th className="px-4 py-2 text-right">Appels</th>
                    <th className="hidden px-4 py-2 text-right md:table-cell">
                      Coût
                    </th>
                    <th className="hidden px-4 py-2 text-right md:table-cell">
                      Latence moy.
                    </th>
                    <th className="px-4 py-2 text-right">Erreurs</th>
                  </tr>
                </thead>
                <tbody>
                  {byEndpoint.data.map(row => (
                    <tr
                      key={row.endpoint}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {row.endpoint}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatNumber(row.total_calls)}
                      </td>
                      <td className="hidden px-4 py-2 text-right tabular-nums md:table-cell">
                        {formatCents(row.total_cost_cents)}
                      </td>
                      <td className="hidden px-4 py-2 text-right tabular-nums md:table-cell">
                        {formatMs(row.avg_latency_ms)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-2 text-right tabular-nums',
                          row.error_count > 0 ? 'text-red-600' : 'text-gray-700'
                        )}
                      >
                        {formatNumber(row.error_count)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
