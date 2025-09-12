'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp,
  TrendingDown,
  Euro,
  Calendar,
  Calculator,
  PiggyBank,
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import type { ProprieteListItem } from '@/lib/validations/proprietes'

interface PropertyFinancialOverviewProps {
  property: ProprieteListItem
  className?: string
}

export function PropertyFinancialOverview({ 
  property, 
  className 
}: PropertyFinancialOverviewProps) {
  
  // Calculate financial metrics
  const acquisitionPrice = property.prix_acquisition || 0
  const currentValue = property.valeur_actuelle || acquisitionPrice
  const monthlyIncome = property.loyer_mensuel || 0
  const monthlyCharges = property.charges_mensuelles || 0
  const yearlyIncome = monthlyIncome * 12
  const yearlyCharges = monthlyCharges * 12
  const netMonthlyIncome = monthlyIncome - monthlyCharges
  const netYearlyIncome = netMonthlyIncome * 12
  
  // Calculate returns
  const valueAppreciation = acquisitionPrice > 0 
    ? ((currentValue - acquisitionPrice) / acquisitionPrice) * 100 
    : 0
  
  const grossYield = acquisitionPrice > 0 && yearlyIncome > 0
    ? (yearlyIncome / acquisitionPrice) * 100
    : 0
  
  const netYield = acquisitionPrice > 0 && netYearlyIncome > 0
    ? (netYearlyIncome / acquisitionPrice) * 100
    : 0
  
  const monthlyROI = acquisitionPrice > 0 && netMonthlyIncome > 0
    ? (netMonthlyIncome / acquisitionPrice) * 100
    : 0
  
  // Calculate payback period in years
  const paybackPeriod = netYearlyIncome > 0 
    ? acquisitionPrice / netYearlyIncome
    : 0

  // Expense breakdown (simulated)
  const expenseBreakdown = [
    { category: 'Taxes foncières', amount: (monthlyCharges * 0.3), percentage: 30 },
    { category: 'Entretien', amount: (monthlyCharges * 0.25), percentage: 25 },
    { category: 'Assurance', amount: (monthlyCharges * 0.15), percentage: 15 },
    { category: 'Gestion', amount: (monthlyCharges * 0.2), percentage: 20 },
    { category: 'Autres', amount: (monthlyCharges * 0.1), percentage: 10 },
  ]

  const getYieldColor = (yieldValue: number) => {
    if (yieldValue >= 8) return 'text-green-600'
    if (yieldValue >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getYieldBadgeVariant = (yieldValue: number): "default" | "secondary" | "destructive" => {
    if (yieldValue >= 8) return 'default'
    if (yieldValue >= 5) return 'secondary'
    return 'destructive'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Investment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Prix d'acquisition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(acquisitionPrice)}
              </p>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            {property.date_acquisition && (
              <p className="text-xs text-gray-500 mt-1">
                Acquis le {new Date(property.date_acquisition).toLocaleDateString('fr-FR')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Valeur actuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-brand-copper">
                {formatCurrency(currentValue)}
              </p>
              {valueAppreciation > 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-500" />
              ) : valueAppreciation < 0 ? (
                <ArrowDownRight className="w-4 h-4 text-red-500" />
              ) : null}
            </div>
            <Badge 
              variant={valueAppreciation > 0 ? 'default' : valueAppreciation < 0 ? 'destructive' : 'secondary'}
              className="mt-2"
            >
              {valueAppreciation > 0 ? '+' : ''}{valueAppreciation.toFixed(1)}%
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Revenus nets mensuels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-brand-green">
                {formatCurrency(netMonthlyIncome)}
              </p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(monthlyIncome)} - {formatCurrency(monthlyCharges)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              Période de récupération
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-gray-900">
                {paybackPeriod > 0 ? paybackPeriod.toFixed(1) : '-'} ans
              </p>
              <Calculator className="w-4 h-4 text-gray-400" />
            </div>
            <Progress 
              value={paybackPeriod > 0 ? Math.min((1 / paybackPeriod) * 100, 100) : 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Yield Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-copper" />
            Analyse de rentabilité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Rendement brut annuel</p>
                <div className="flex items-baseline gap-2">
                  <p className={cn("text-2xl font-bold", getYieldColor(grossYield))}>
                    {grossYield.toFixed(2)}%
                  </p>
                  <Badge variant={getYieldBadgeVariant(grossYield)}>
                    {grossYield >= 8 ? 'Excellent' : grossYield >= 5 ? 'Bon' : 'Faible'}
                  </Badge>
                </div>
              </div>
              <Progress value={Math.min(grossYield * 10, 100)} className="h-2" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Rendement net annuel</p>
                <div className="flex items-baseline gap-2">
                  <p className={cn("text-2xl font-bold", getYieldColor(netYield))}>
                    {netYield.toFixed(2)}%
                  </p>
                  <Badge variant={getYieldBadgeVariant(netYield)}>
                    {netYield >= 8 ? 'Excellent' : netYield >= 5 ? 'Bon' : 'Faible'}
                  </Badge>
                </div>
              </div>
              <Progress value={Math.min(netYield * 10, 100)} className="h-2" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">ROI mensuel</p>
                <div className="flex items-baseline gap-2">
                  <p className={cn("text-2xl font-bold", getYieldColor(monthlyROI * 12))}>
                    {monthlyROI.toFixed(3)}%
                  </p>
                  <Badge variant={getYieldBadgeVariant(monthlyROI * 12)}>
                    Par mois
                  </Badge>
                </div>
              </div>
              <Progress value={Math.min(monthlyROI * 100, 100)} className="h-2" />
            </div>
          </div>

          <Separator className="my-6" />

          {/* Cash Flow Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Revenus</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Loyer mensuel</span>
                  <span className="font-semibold text-green-700">
                    +{formatCurrency(monthlyIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-700">Revenus annuels</span>
                  <span className="font-semibold text-green-700">
                    +{formatCurrency(yearlyIncome)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Charges</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">Charges mensuelles</span>
                  <span className="font-semibold text-red-700">
                    -{formatCurrency(monthlyCharges)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded-lg">
                  <span className="text-sm text-gray-700">Charges annuelles</span>
                  <span className="font-semibold text-red-700">
                    -{formatCurrency(yearlyCharges)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expense Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-copper" />
            Répartition des charges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseBreakdown.map((expense, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">
                    {expense.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {expense.percentage}%
                    </span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={expense.percentage} 
                  className="h-2"
                />
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700">Total des charges</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(monthlyCharges)}/mois
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <LineChart className="w-5 h-5 text-brand-copper" />
            Indicateurs de performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Cash-flow annuel</p>
              <p className="text-xl font-bold text-brand-green">
                {formatCurrency(netYearlyIncome)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Taux d'occupation</p>
              <p className="text-xl font-bold text-blue-600">
                {property.taux_occupation || 0}%
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Plus-value latente</p>
              <p className="text-xl font-bold text-brand-copper">
                {formatCurrency(currentValue - acquisitionPrice)}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Marge nette</p>
              <p className="text-xl font-bold text-gray-900">
                {monthlyIncome > 0 ? ((netMonthlyIncome / monthlyIncome) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}