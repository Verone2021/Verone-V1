/**
 * 📊 Stock Movements Chart - Entrées/Sorties de Stock
 *
 * BarChart Recharts affichant les mouvements de stock (in/out) par jour
 * Design Vérone : Noir pour entrées, gris pour sorties, tooltip détaillé
 *
 * Date: 2025-10-14
 */

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts'
import type { StockMovementDataPoint } from '@/hooks/use-dashboard-analytics'

interface StockMovementsChartProps {
  data: StockMovementDataPoint[]
  isLoading?: boolean
}

// Custom Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null

  const entrees = payload[0]?.value || 0
  const sorties = payload[1]?.value || 0
  const dataPoint = payload[0]?.payload as StockMovementDataPoint

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="text-sm text-gray-600 mb-2">{dataPoint.date}</p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-black font-medium">Entrées</span>
          <span className="text-sm font-semibold text-black">{entrees}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-600 font-medium">Sorties</span>
          <span className="text-sm font-semibold text-gray-600">{sorties}</span>
        </div>
      </div>
    </div>
  )
}

// Custom Legend
const CustomLegend = () => {
  return (
    <div className="flex items-center justify-center gap-4 mt-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-black rounded"></div>
        <span className="text-xs text-gray-600">Entrées</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-gray-400 rounded"></div>
        <span className="text-xs text-gray-600">Sorties</span>
      </div>
    </div>
  )
}

export function StockMovementsChart({ data, isLoading = false }: StockMovementsChartProps) {
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
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#666666' }}
            tickLine={{ stroke: '#E5E5E5' }}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="entrees" fill="#000000" radius={[4, 4, 0, 0]} />
          <Bar dataKey="sorties" fill="#999999" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
