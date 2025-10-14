/**
 * 📈 Purchase Orders Chart - Commandes Fournisseurs par Semaine
 *
 * LineChart Recharts affichant le montant des commandes fournisseurs par semaine
 * Design Vérone : Ligne grise, points noirs, tooltip formatté €
 *
 * Date: 2025-10-14
 */

'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import type { PurchaseOrderDataPoint } from '@/hooks/use-dashboard-analytics'

interface PurchaseOrdersChartProps {
  data: PurchaseOrderDataPoint[]
  isLoading?: boolean
}

// Custom Tooltip avec formatage €
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null

  const amount = payload[0].value || 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600 mb-1">{payload[0].payload.week}</p>
      <p className="text-base font-semibold text-black">
        {new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(amount as number)}
      </p>
    </div>
  )
}

export function PurchaseOrdersChart({ data, isLoading = false }: PurchaseOrdersChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg animate-pulse">
        <div className="text-sm text-gray-400">Chargement des données...</div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-500">Aucune donnée disponible</div>
      </div>
    )
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
            tickFormatter={(value) =>
              `${(value / 1000).toFixed(0)}k€`
            }
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#666666"
            strokeWidth={2}
            dot={{ fill: '#000000', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
