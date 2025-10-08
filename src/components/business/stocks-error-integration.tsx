/**
 * 📦 STOCKS ERROR INTEGRATION - EXEMPLE CONCRET
 *
 * Composant d'intégration montrant comment utiliser le système Error Reporting
 * dans le module Stocks avec détection temps réel des mouvements
 *
 * @author Vérone System Orchestrator
 * @version 2.0 - Révolutionnaire
 */

'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Warehouse,
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  ArrowUpDown,
  Calculator
} from 'lucide-react'

import { useStocksErrorReporting } from '@/hooks/use-error-reporting-integration'

/**
 * 🎯 INTERFACES SPÉCIFIQUES STOCKS
 */
interface StockErrorStats {
  movement_errors: number
  calculation_errors: number
  reservation_errors: number
  sync_errors: number
  rls_policy_errors: number
}

interface StockMovementData {
  id: string
  product_id: string
  product_name: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  timestamp: Date
  processing_time: number
  success: boolean
  error_message?: string
}

interface StockPerformance {
  average_movement_time: number
  total_movements_tracked: number
  failed_movements: number
  slow_movements: StockMovementData[]
  critical_stock_levels: Array<{
    product_id: string
    current_stock: number
    minimum_stock: number
  }>
}

/**
 * 🎛️ COMPOSANT PRINCIPAL : Intégration Stocks Error Reporting
 */
export const StocksErrorIntegration: React.FC = () => {
  const {
    isActive,
    metrics,
    criticalErrorsCount,
    lastDetectionTime,
    getModuleErrorStats,
    getCriticalAlerts,
    reportStockMovementError,
    detectAndReportModuleErrors,
    reportError
  } = useStocksErrorReporting()

  const [stocksStats, setStocksStats] = useState(getModuleErrorStats('stocks'))
  const [stockErrors, setStockErrors] = useState<StockErrorStats>({
    movement_errors: 0,
    calculation_errors: 0,
    reservation_errors: 0,
    sync_errors: 0,
    rls_policy_errors: 0
  })
  const [performance, setPerformance] = useState<StockPerformance>({
    average_movement_time: 0,
    total_movements_tracked: 0,
    failed_movements: 0,
    slow_movements: [],
    critical_stock_levels: []
  })
  const [recentMovements, setRecentMovements] = useState<StockMovementData[]>([])
  const [isSimulating, setIsSimulating] = useState(false)

  // 🔄 Mise à jour stats périodique
  useEffect(() => {
    const updateStats = () => {
      setStocksStats(getModuleErrorStats('stocks'))
    }

    const interval = setInterval(updateStats, 2000) // Update every 2s for real-time feel
    updateStats()

    return () => clearInterval(interval)
  }, [getModuleErrorStats])

  // 📦 Simulation mouvements de stock temps réel
  const simulateStockMovements = useCallback(async () => {
    setIsSimulating(true)

    try {
      console.log('📦 Démarrage simulation mouvements stock...')

      // Simuler 25 mouvements de stock avec différents scénarios
      const movements: StockMovementData[] = []
      const movementTypes = ['in', 'out', 'adjustment'] as const

      for (let i = 0; i < 25; i++) {
        const startTime = Date.now()
        const processingTime = Math.random() * 3000 + 200 // 200ms-3.2s
        const hasError = Math.random() < 0.15 // 15% chance d'erreur (stocks critiques)

        const movement: StockMovementData = {
          id: `mov_${Date.now()}_${i}`,
          product_id: `product_${Math.floor(Math.random() * 100) + 1}`,
          product_name: `Produit Stock ${Math.floor(Math.random() * 100) + 1}`,
          type: movementTypes[Math.floor(Math.random() * movementTypes.length)],
          quantity: Math.floor(Math.random() * 50) + 1,
          timestamp: new Date(),
          processing_time: processingTime,
          success: !hasError,
          error_message: hasError ? getRandomStockError() : undefined
        }

        movements.push(movement)

        // 🚨 Traitement des erreurs par type
        if (hasError && movement.error_message) {
          // 📊 Incrémenter compteurs par type d'erreur
          const errorType = categorizeStockError(movement.error_message)
          setStockErrors(prev => ({
            ...prev,
            [errorType]: prev[errorType] + 1
          }))

          // 📝 Reporter l'erreur avec contexte stocks
          const movementData = {
            movement_id: movement.id,
            product_id: movement.product_id,
            movement_type: movement.type,
            quantity: movement.quantity,
            processing_time: movement.processing_time
          }

          if (reportStockMovementError) {
            await reportStockMovementError(movementData, new Error(movement.error_message))
          }
        }

        // 🐌 Mouvement lent (>2s considéré comme lent pour stocks temps réel)
        if (processingTime > 2000) {
          const slowMovementError = {
            id: `stock_slow_${movement.id}`,
            type: 'performance' as any,
            severity: 'high' as any, // Performance stocks = critique business
            module: 'stocks',
            message: `Slow stock movement: ${movement.type} for ${movement.product_name} took ${Math.round(processingTime)}ms`,
            context: {
              url: '/stocks',
              user_action: 'stock_movement',
              timestamp: new Date(),
              browser: navigator.userAgent,
              session_id: `stocks_sim_${Date.now()}`,
              movement_context: movementData
            },
            fix_priority: 8, // Stocks = priorité élevée
            estimated_fix_time: '30min',
            mcp_tools_needed: ['mcp__supabase__get_advisors', 'mcp__supabase__execute_sql'],
            auto_fixable: false,
            resolution_status: 'pending'
          }

          await reportError(slowMovementError)
        }

        // Petit délai pour simuler le processing temps réel
        await new Promise(resolve => setTimeout(resolve, Math.min(processingTime, 100)))
      }

      // 📊 Calcul métriques performance
      const totalTime = movements.reduce((sum, mov) => sum + mov.processing_time, 0)
      const failedMovements = movements.filter(mov => !mov.success)
      const slowMovements = movements
        .filter(mov => mov.processing_time > 2000)
        .sort((a, b) => b.processing_time - a.processing_time)
        .slice(0, 5)

      setPerformance({
        average_movement_time: Math.round(totalTime / movements.length),
        total_movements_tracked: movements.length,
        failed_movements: failedMovements.length,
        slow_movements: slowMovements,
        critical_stock_levels: generateCriticalStockLevels()
      })

      setRecentMovements(movements.reverse().slice(0, 10)) // 10 plus récents

      console.log(`✅ Simulation terminée: ${movements.length} mouvements, ${failedMovements.length} erreurs`)

    } finally {
      setIsSimulating(false)
    }
  }, [reportStockMovementError, reportError])

  // 🔍 Détection manuelle globale
  const handleGlobalDetection = async () => {
    setIsSimulating(true)
    try {
      await detectAndReportModuleErrors('stocks')
    } finally {
      setIsSimulating(false)
    }
  }

  const alerts = getCriticalAlerts()

  return (
    <div className="space-y-6">
      {/* 🎯 HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-purple-600" />
            Stocks Error Protection
          </h2>
          <p className="text-sm text-gray-600">
            Surveillance temps réel des mouvements et cohérence stock
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StocksStatusBadge
            isActive={isActive}
            criticalErrors={criticalErrorsCount}
            totalMovements={performance.total_movements_tracked}
            failedMovements={performance.failed_movements}
          />
          <Button
            onClick={simulateStockMovements}
            disabled={isSimulating}
            variant="outline"
            size="sm"
          >
            {isSimulating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowUpDown className="w-4 h-4 mr-2" />
            )}
            Simuler Mouvements
          </Button>
          <Button
            onClick={handleGlobalDetection}
            disabled={isSimulating}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Scan Global
          </Button>
        </div>
      </div>

      {/* 🚨 ALERTES CRITIQUES */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>STOCKS CRITIQUE:</strong> {alert.message}
                <div className="text-xs text-red-600 mt-1">
                  {alert.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 📊 MÉTRIQUES PRINCIPALES */}
      <div className="grid gap-4 md:grid-cols-4">
        <StocksMetricsCard
          title="Erreurs Mouvements"
          value={stocksStats.total_errors}
          subValue={`${stocksStats.resolved_errors} corrigées`}
          icon={AlertTriangle}
          color={stocksStats.total_errors > 0 ? 'text-red-600' : 'text-green-600'}
          bgColor={stocksStats.total_errors > 0 ? 'bg-red-100' : 'bg-green-100'}
        />

        <StocksMetricsCard
          title="Temps Traitement"
          value={`${performance.average_movement_time}ms`}
          subValue="moyenne"
          icon={Clock}
          color={performance.average_movement_time > 2000 ? 'text-red-600' : 'text-green-600'}
          bgColor={performance.average_movement_time > 2000 ? 'bg-red-100' : 'bg-green-100'}
        />

        <StocksMetricsCard
          title="Taux Succès"
          value={`${stocksStats.success_rate}%`}
          subValue="mouvements"
          icon={CheckCircle}
          color={stocksStats.success_rate >= 95 ? 'text-green-600' : 'text-red-600'}
          bgColor={stocksStats.success_rate >= 95 ? 'bg-green-100' : 'bg-red-100'}
        />

        <StocksMetricsCard
          title="Mouvements"
          value={performance.total_movements_tracked}
          subValue={`${performance.failed_movements} échecs`}
          icon={ArrowUpDown}
          color="text-purple-600"
          bgColor="bg-purple-100"
        />
      </div>

      {/* 📈 ANALYSE DÉTAILLÉE */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 🔍 Erreurs par type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Erreurs Stocks par Type</CardTitle>
            <CardDescription>Répartition des erreurs de gestion stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StockErrorTypeRow
                type="Mouvements"
                count={stockErrors.movement_errors}
                icon={ArrowUpDown}
                color="text-red-600"
                description="Erreurs lors des entrées/sorties"
              />
              <StockErrorTypeRow
                type="Calculs Stock"
                count={stockErrors.calculation_errors}
                icon={Calculator}
                color="text-black"
                description="Erreurs de calcul stock réel"
              />
              <StockErrorTypeRow
                type="Réservations"
                count={stockErrors.reservation_errors}
                icon={Clock}
                color="text-purple-600"
                description="Erreurs réservations stock"
              />
              <StockErrorTypeRow
                type="Synchronisation"
                count={stockErrors.sync_errors}
                icon={RefreshCw}
                color="text-blue-600"
                description="Erreurs sync temps réel"
              />
              <StockErrorTypeRow
                type="Sécurité RLS"
                count={stockErrors.rls_policy_errors}
                icon={Database}
                color="text-gray-600"
                description="Violations politiques accès"
              />
            </div>
          </CardContent>
        </Card>

        {/* ⚡ Mouvements récents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mouvements Récents</CardTitle>
            <CardDescription>Derniers mouvements de stock surveillés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentMovements.length > 0 ? (
                recentMovements.map((movement) => (
                  <div
                    key={movement.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      movement.success
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getMovementIcon(movement.type)}
                        <span className="font-medium text-sm text-black truncate">
                          {movement.product_name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {movement.type} {movement.quantity}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.timestamp.toLocaleTimeString()} • {movement.processing_time}ms
                        {movement.error_message && (
                          <div className="text-red-600 mt-1">{movement.error_message}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      {movement.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <ArrowUpDown className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>Aucun mouvement récent</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🚨 Niveaux critiques */}
      {performance.critical_stock_levels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-700">
              Niveaux de Stock Critiques
            </CardTitle>
            <CardDescription>
              Produits avec stock inférieur au minimum recommandé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {performance.critical_stock_levels.map((item, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-red-900 text-sm">
                    Produit {item.product_id}
                  </div>
                  <div className="text-xs text-red-700 mt-1">
                    Stock: {item.current_stock} / Min: {item.minimum_stock}
                  </div>
                  <Progress
                    value={(item.current_stock / item.minimum_stock) * 100}
                    className="h-1 mt-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 💡 GUIDE INTÉGRATION */}
      <StocksIntegrationGuide />
    </div>
  )
}

/**
 * 🚦 STATUS BADGE : Badge statut stocks
 */
const StocksStatusBadge: React.FC<{
  isActive: boolean
  criticalErrors: number
  totalMovements: number
  failedMovements: number
}> = ({ isActive, criticalErrors, totalMovements, failedMovements }) => {
  if (!isActive) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Warehouse className="w-3 h-3" />
        Protection Désactivée
      </Badge>
    )
  }

  if (criticalErrors > 0 || failedMovements > 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {criticalErrors + failedMovements} Erreur{criticalErrors + failedMovements > 1 ? 's' : ''}
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="flex items-center gap-1 bg-purple-600">
      <CheckCircle className="w-3 h-3" />
      {totalMovements} Mouvements OK
    </Badge>
  )
}

/**
 * 📊 METRICS CARD : Carte métriques stocks
 */
const StocksMetricsCard: React.FC<{
  title: string
  value: string | number
  subValue: string
  icon: React.ElementType
  color: string
  bgColor: string
}> = ({ title, value, subValue, icon: Icon, color, bgColor }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-black">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{subValue}</p>
          </div>
          <div className={`p-2 rounded-lg ${bgColor}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 📝 STOCK ERROR TYPE ROW : Ligne d'erreur par type stocks
 */
const StockErrorTypeRow: React.FC<{
  type: string
  count: number
  icon: React.ElementType
  color: string
  description: string
}> = ({ type, count, icon: Icon, color, description }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <div>
          <div className="text-sm font-medium text-black">{type}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <Badge variant={count > 0 ? 'destructive' : 'secondary'}>
        {count}
      </Badge>
    </div>
  )
}

/**
 * 📖 GUIDE D'INTÉGRATION : Documentation stocks
 */
const StocksIntegrationGuide: React.FC = () => {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Guide d'Intégration Stocks</CardTitle>
        <CardDescription>
          Comment intégrer Error Reporting dans vos opérations de stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Patterns d'intégration pour le module Stocks temps réel
            </p>
            <Button
              onClick={() => setShowGuide(!showGuide)}
              variant="outline"
              size="sm"
            >
              {showGuide ? 'Masquer' : 'Voir le Guide'}
            </Button>
          </div>

          {showGuide && (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-medium text-purple-900 mb-2">Détection Temps Réel</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Mouvements stock échoués</li>
                    <li>• Calculs stock incorrects</li>
                    <li>• Réservations impossibles</li>
                    <li>• Sync temps réel</li>
                  </ul>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <h4 className="font-medium text-red-900 mb-2">Critères Critiques</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    <li>• Stocks négatifs</li>
                    <li>• Incohérences calculs</li>
                    <li>• RLS violations</li>
                    <li>• Performances {'>'}2s</li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-900 mb-2">Auto-Résolution</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Recalculs automatiques</li>
                    <li>• Corrections RLS</li>
                    <li>• Retry mouvements</li>
                    <li>• Optimisations DB</li>
                  </ul>
                </div>
              </div>

              <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs">
                <pre className="whitespace-pre-wrap">{`
// 📦 EXEMPLE INTÉGRATION MOUVEMENT STOCK
import { useStocksErrorReporting } from '@/hooks/use-error-reporting-integration'

export function StockMovementForm() {
  const { reportStockMovementError } = useStocksErrorReporting()

  const handleStockMovement = async (movementData) => {
    const startTime = performance.now()

    try {
      const result = await processStockMovement(movementData)
      const processingTime = performance.now() - startTime

      // 🚨 Auto-report si lent (>2s critique pour stocks)
      if (processingTime > 2000) {
        await reportStockMovementError(movementData,
          new Error(\`Slow movement: \${processingTime}ms\`)
        )
      }

      return result
    } catch (error) {
      // 📝 Report erreur mouvement (priorité élevée)
      await reportStockMovementError(movementData, error)
      throw error
    }
  }

  return <form onSubmit={handleStockMovement}>...</form>
}`}</pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 🛠️ HELPERS : Fonctions utilitaires
 */

function getRandomStockError(): string {
  const errors = [
    'Stock calculation mismatch detected',
    'RLS policy violation on stock_movements table',
    'Concurrent modification conflict on stock update',
    'Product reservation failed - insufficient stock',
    'Database timeout during stock synchronization',
    'Foreign key constraint violation on movement',
    'Negative stock level after movement calculation'
  ]
  return errors[Math.floor(Math.random() * errors.length)]
}

function categorizeStockError(message: string): keyof StockErrorStats {
  if (message.includes('movement') || message.includes('concurrent')) return 'movement_errors'
  if (message.includes('calculation') || message.includes('mismatch')) return 'calculation_errors'
  if (message.includes('reservation') || message.includes('insufficient')) return 'reservation_errors'
  if (message.includes('sync') || message.includes('timeout')) return 'sync_errors'
  if (message.includes('RLS') || message.includes('constraint')) return 'rls_policy_errors'
  return 'movement_errors' // default
}

function getMovementIcon(type: 'in' | 'out' | 'adjustment') {
  switch (type) {
    case 'in':
      return <TrendingUp className="w-4 h-4 text-green-600" />
    case 'out':
      return <TrendingDown className="w-4 h-4 text-red-600" />
    case 'adjustment':
      return <RefreshCw className="w-4 h-4 text-blue-600" />
  }
}

function generateCriticalStockLevels() {
  // Simuler quelques produits avec stock critique
  return Array.from({ length: Math.floor(Math.random() * 4) }, (_, i) => ({
    product_id: `PROD_${100 + i}`,
    current_stock: Math.floor(Math.random() * 3) + 1, // 1-3
    minimum_stock: Math.floor(Math.random() * 5) + 5   // 5-9
  }))
}

export default StocksErrorIntegration