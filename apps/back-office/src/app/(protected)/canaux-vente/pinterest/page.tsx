'use client';

import { useQuery } from '@tanstack/react-query';

import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

import { createClient } from '@verone/utils/supabase/client';
import { cn } from '@verone/utils';

interface PinterestStats {
  total_products: number;
  active_products: number;
  total_impressions: number;
  total_saves: number;
  total_pin_clicks: number;
  total_outbound_clicks: number;
  total_conversions: number;
  total_revenue_ht: number;
  save_rate: number;
  conversion_rate: number;
  last_sync_at: string | null;
}

function usePinterestStats() {
  return useQuery<PinterestStats | null>({
    queryKey: ['pinterest-pin-stats'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc(
        'get_pinterest_pin_stats' as never
      );
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as PinterestStats[];
      return rows[0] ?? null;
    },
    staleTime: 60_000,
    gcTime: 300_000,
  });
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

interface KpiBoxProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function KpiBox({ label, value, highlight }: KpiBoxProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        highlight ? 'border-rose-200 bg-rose-50' : 'border-gray-200 bg-white'
      )}
    >
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-xl font-semibold',
          highlight ? 'text-rose-700' : 'text-gray-900'
        )}
      >
        {value}
      </p>
    </div>
  );
}

export default function PinterestChannelPage() {
  const { data: stats, isLoading } = usePinterestStats();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/canaux-vente"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
            aria-label="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Pinterest
            </h1>
            <p className="text-sm text-gray-500">
              Pinterest Business Account · Pin Analytics · Trends
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-900">
              Configuration en attente
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Le canal Pinterest est branché côté DB (table{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">
                pinterest_pin_syncs
              </code>
              , RPCs{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">
                get_pinterest_pin_*
              </code>
              ) et l&apos;Edge Function squelette{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">
                sync-pinterest-pins
              </code>{' '}
              est prête. Pour activer le pull réel, il faut configurer{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 text-[10px]">
                PINTEREST_ACCESS_TOKEN
              </code>{' '}
              + branding board ID dans Supabase Edge Function secrets.
            </p>
            <p className="mt-2 text-[11px] text-amber-700">
              Garde-fou ToS Pinterest : ne PAS stocker les analytics au-delà de
              90 jours côté Verone (purge automatique à mettre en place).
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          Chargement…
        </p>
      ) : !stats || stats.total_products === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
          <h3 className="text-sm font-medium text-gray-900">
            Aucun produit synchronisé sur Pinterest
          </h3>
          <p className="mt-2 text-xs text-gray-500">
            Les premiers produits apparaîtront ici une fois la synchronisation
            activée.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiBox
            label="Produits synchronisés"
            value={formatNumber(stats.total_products)}
          />
          <KpiBox
            label="Saves (signal d'intent)"
            value={formatNumber(stats.total_saves)}
            highlight
          />
          <KpiBox
            label="Outbound clicks"
            value={formatNumber(stats.total_outbound_clicks)}
          />
          <KpiBox
            label="Revenu HT"
            value={formatCurrency(stats.total_revenue_ht)}
          />
          <KpiBox
            label="Impressions"
            value={formatNumber(stats.total_impressions)}
          />
          <KpiBox
            label="Pin clicks"
            value={formatNumber(stats.total_pin_clicks)}
          />
          <KpiBox label="Save rate" value={`${stats.save_rate}%`} />
          <KpiBox label="Conversion rate" value={`${stats.conversion_rate}%`} />
        </div>
      )}
    </div>
  );
}
