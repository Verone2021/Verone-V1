'use client';

import { Card, CardContent } from '@verone/ui';
import { RefreshCw } from 'lucide-react';
import {
  Bar,
  Line,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from './finance-dashboard-utils';
import { KpiSideCard } from './FinanceDashboardKpiCard';

interface IEvolutionRow {
  monthLabel: string;
  credit: number;
  debit: number;
}

interface IFinanceDashboardActivityProps {
  chiffreAffaires: number;
  totalEncaissements: number;
  charges: number;
  resultat: number;
  hasUncategorizedCredit: boolean;
  uncategorizedCredit: number;
  evolution: IEvolutionRow[];
  loading: boolean;
}

export function FinanceDashboardActivity({
  chiffreAffaires,
  totalEncaissements,
  charges,
  resultat,
  hasUncategorizedCredit,
  uncategorizedCredit,
  evolution,
  loading,
}: IFinanceDashboardActivityProps): React.ReactNode {
  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Activite</h2>
      <div className="flex gap-6">
        <div className="w-56 flex-shrink-0 space-y-3">
          <KpiSideCard
            label="Chiffre d'affaires"
            value={chiffreAffaires}
            color="green"
            subtitle={
              hasUncategorizedCredit
                ? `${formatCurrency(uncategorizedCredit)} non catégorisé`
                : chiffreAffaires !== totalEncaissements
                  ? `Encaissements: ${formatCurrency(totalEncaissements)}`
                  : undefined
            }
          />
          <KpiSideCard
            label="Charges d'exploitation"
            value={charges}
            color="rose"
          />
          <KpiSideCard
            label="Resultat d'exploitation"
            value={resultat}
            color={resultat >= 0 ? 'green' : 'red'}
          />
        </div>

        <Card className="flex-1">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : evolution.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-gray-500">
                Aucune donnee disponible
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={evolution}>
                  <XAxis
                    dataKey="monthLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={v => `${(Number(v) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(value: number, name: string) => [
                      formatCurrency(value),
                      name === 'credit'
                        ? 'CA'
                        : name === 'debit'
                          ? 'Charges'
                          : name,
                    ]}
                  />
                  <Bar
                    dataKey="debit"
                    fill="#fda4af"
                    radius={[4, 4, 0, 0]}
                    name="debit"
                  />
                  <Line
                    type="monotone"
                    dataKey="credit"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#22c55e' }}
                    name="credit"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && evolution.length > 0 && (
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="grid grid-cols-3 gap-4 px-4 py-2.5 bg-gray-50 text-xs font-medium text-gray-500 border-b uppercase tracking-wide">
              <div>Mois</div>
              <div className="text-right">CA</div>
              <div className="text-right">Charges</div>
            </div>
            {evolution.slice(-12).map(row => (
              <div
                key={row.monthLabel}
                className="grid grid-cols-3 gap-4 px-4 py-2 border-b last:border-b-0 hover:bg-gray-50 text-sm"
              >
                <div className="capitalize text-gray-700">{row.monthLabel}</div>
                <div className="text-right text-green-600 font-medium">
                  {formatCurrency(row.credit)}
                </div>
                <div className="text-right text-rose-600 font-medium">
                  {formatCurrency(row.debit)}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4 px-4 py-2.5 bg-gray-100 font-bold text-sm border-t">
              <div>Total</div>
              <div className="text-right text-green-700">
                {formatCurrency(chiffreAffaires)}
              </div>
              <div className="text-right text-rose-700">
                {formatCurrency(charges)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
