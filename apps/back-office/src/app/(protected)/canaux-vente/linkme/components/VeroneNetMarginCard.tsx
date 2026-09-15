'use client';

import { AlertCircle, Loader2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Skeleton } from '@verone/ui';

import { useLinkMeVeroneMargin } from '../hooks/use-linkme-verone-margin';
import { VeroneMarginProductsTable } from './VeroneMarginProductsTable';

interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

function KpiTile({ label, value, sub, color = 'text-gray-900' }: KpiTileProps) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3 space-y-0.5">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

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

const fmtNum = (v: number): string => new Intl.NumberFormat('fr-FR').format(v);

interface Props {
  from: Date | null;
  to: Date | null;
}

export function VeroneNetMarginCard({ from, to }: Props): React.JSX.Element {
  const { data, isLoading, error } = useLinkMeVeroneMargin({ from, to });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Marge nette Vérone — ventes LinkMe
        </CardTitle>
        <p className="text-xs text-gray-500">
          Prix LinkMe figé − prix de revient figé à la vente. Les commissions
          des affiliés ne sont pas comptées.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              Impossible de charger les données de marge.
            </p>
          </div>
        ) : isLoading || !data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-neutral-100 bg-neutral-50 p-3"
                >
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Calcul en cours…</span>
            </div>
          </div>
        ) : (
          <>
            {/* KPIs principaux */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiTile
                label="Encaissé par Vérone"
                value={fmtEur(data.totals.covered_revenue)}
                sub={`${fmtNum(data.totals.lines)} lignes`}
              />
              <KpiTile
                label="Prix de revient total"
                value={fmtEur(data.totals.cost_total)}
                sub={`${fmtNum(data.totals.covered_lines)} lignes couvertes`}
              />
              <KpiTile
                label="Marge nette"
                value={fmtEur(data.totals.margin_total)}
                sub={fmtPct(data.totals.margin_percent)}
                color={
                  data.totals.margin_total >= 0
                    ? 'text-green-700'
                    : 'text-red-700'
                }
              />
              <KpiTile
                label="Coefficient"
                value={fmtCoef(data.totals.coefficient)}
                sub={`${fmtNum(data.totals.quantity)} pièces · ${fmtNum(data.totals.orders)} cmd`}
              />
            </div>

            {/* KPIs secondaires */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <KpiTile
                label="Commissions affiliés (exclues)"
                value={fmtEur(data.totals.affiliate_commission_total)}
              />
              <KpiTile
                label="Payé par les clients finaux"
                value={fmtEur(data.totals.client_revenue)}
              />
              <KpiTile
                label="Commission Vérone (produits affiliés)"
                value={fmtEur(data.totals.verone_commission_total)}
              />
            </div>

            {/* Notes couverture */}
            <div className="text-xs text-neutral-400 space-y-0.5 pl-1">
              {data.totals.without_fees_lines > 0 && (
                <p className="text-amber-600">
                  ⚠ {fmtNum(data.totals.without_fees_lines)} ligne
                  {data.totals.without_fees_lines > 1 ? 's' : ''} au prix
                  d&apos;achat seul (frais d&apos;approche non inclus, marge
                  surestimée).
                </p>
              )}
              {data.totals.missing_cost_lines > 0 && (
                <p>
                  {fmtNum(data.totals.missing_cost_lines)} ligne
                  {data.totals.missing_cost_lines > 1 ? 's' : ''} sans prix de
                  revient (non comptées dans la marge).
                </p>
              )}
              {data.totals.affiliate_product_lines > 0 && (
                <p>
                  {fmtNum(data.totals.affiliate_product_lines)} ligne
                  {data.totals.affiliate_product_lines > 1 ? 's' : ''} produits
                  affiliés (commission Vérone{' '}
                  {fmtEur(data.totals.verone_commission_total)}).
                </p>
              )}
            </div>

            {/* Top produits */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                Par produit (classés par marge décroissante)
              </p>
              <VeroneMarginProductsTable products={data.products} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
