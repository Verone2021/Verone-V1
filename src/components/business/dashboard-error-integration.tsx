/**
 * 🎯 DASHBOARD ERROR INTEGRATION - EXEMPLE CONCRET
 *
 * Composant d'intégration montrant comment utiliser le système Error Reporting
 * dans le module Dashboard avec détection automatique et alertes temps réel
 *
 * @author Vérone System Orchestrator
 * @version 2.0 - Révolutionnaire
 */

'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertTriangle,
  CheckCircle,
  Activity,
  Eye,
  RefreshCw,
  Shield,
  Zap
} from 'lucide-react'

import { useDashboardErrorReporting } from '@/hooks/use-error-reporting-integration'

/**
 * 🎛️ COMPOSANT PRINCIPAL : Intégration Dashboard Error Reporting
 */
export const DashboardErrorIntegration: React.FC = () => {
  const {
    isActive,
    metrics,
    criticalErrorsCount,
    lastDetectionTime,
    getModuleErrorStats,
    getCriticalAlerts,
    reportDashboardLoadError,
    detectAndReportModuleErrors
  } = useDashboardErrorReporting()

  const [dashboardStats, setDashboardStats] = useState(getModuleErrorStats('dashboard'))
  const [alerts, setAlerts] = useState(getCriticalAlerts())
  const [isDetecting, setIsDetecting] = useState(false)

  // 🔄 Mise à jour périodique des stats
  useEffect(() => {
    const updateStats = () => {
      setDashboardStats(getModuleErrorStats('dashboard'))
      setAlerts(getCriticalAlerts())
    }

    const interval = setInterval(updateStats, 3000) // Update every 3s
    updateStats() // Initial update

    return () => clearInterval(interval)
  }, [getModuleErrorStats, getCriticalAlerts])

  // 📊 Simulation tracking performance Dashboard
  useEffect(() => {
    const startTime = Date.now()

    // Simuler le chargement du dashboard
    const dashboardLoadTime = Math.random() * 4000 + 1000 // 1-5s

    const timer = setTimeout(() => {
      const loadTime = Date.now() - startTime

      // 🚨 Auto-report si SLO Dashboard dépassé (>3s)
      if (reportDashboardLoadError) {
        reportDashboardLoadError(loadTime)
      }
    }, dashboardLoadTime)

    return () => clearTimeout(timer)
  }, [reportDashboardLoadError])

  // 🔍 Détection manuelle
  const handleManualDetection = async () => {
    setIsDetecting(true)
    try {
      await detectAndReportModuleErrors('dashboard')
    } finally {
      setIsDetecting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 🎯 HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-black flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Dashboard Error Protection
          </h2>
          <p className="text-sm text-gray-600">
            Surveillance intelligente avec auto-résolution 85%+
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SystemStatusBadge isActive={isActive} criticalErrors={criticalErrorsCount} />
          <Button
            onClick={handleManualDetection}
            disabled={isDetecting}
            variant="outline"
            size="sm"
          >
            {isDetecting ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-2" />
            )}
            Scan Maintenant
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
                <strong>{alert.module.toUpperCase()}:</strong> {alert.message}
                <div className="text-xs text-red-600 mt-1">
                  {alert.timestamp.toLocaleString()}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* 📊 MÉTRIQUES DASHBOARD */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricsCard
          title="Erreurs Détectées"
          value={dashboardStats.total_errors}
          subValue={`${dashboardStats.resolved_errors} résolues`}
          icon={AlertTriangle}
          color={dashboardStats.total_errors > 0 ? 'text-gray-700' : 'text-green-600'}
          bgColor={dashboardStats.total_errors > 0 ? 'bg-gray-100' : 'bg-green-100'}
        />

        <MetricsCard
          title="Taux de Succès"
          value={`${dashboardStats.success_rate}%`}
          subValue={`${dashboardStats.pending_errors} en cours`}
          icon={CheckCircle}
          color={dashboardStats.success_rate >= 85 ? 'text-green-600' : 'text-red-600'}
          bgColor={dashboardStats.success_rate >= 85 ? 'bg-green-100' : 'bg-red-100'}
        />

        <MetricsCard
          title="Système Global"
          value={`${metrics.success_rate}%`}
          subValue={`${metrics.throughput_per_minute}/min`}
          icon={Activity}
          color="text-blue-600"
          bgColor="bg-blue-100"
        />
      </div>

      {/* 📈 DÉTAILS INTÉGRATION */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intégration Dashboard</CardTitle>
          <CardDescription>
            Détails de l'intégration Error Reporting pour ce module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 🔄 Status système */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-black">Auto-Détection</div>
                <div className="text-sm text-gray-600">
                  Surveillance continue toutes les 30s
                </div>
              </div>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>

            {/* ⏰ Dernière détection */}
            {lastDetectionTime && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-black">Dernière Détection</div>
                  <div className="text-sm text-gray-600">
                    {lastDetectionTime.toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline">
                  {Math.round((Date.now() - lastDetectionTime.getTime()) / 1000)}s
                </Badge>
              </div>
            )}

            {/* 🎯 Métriques système */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-900">Workers Actifs</div>
                <div className="text-2xl font-bold text-blue-800">
                  {metrics.workers_active}/{metrics.workers_total}
                </div>
              </div>

              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-900">Temps Moyen</div>
                <div className="text-2xl font-bold text-green-800">
                  {metrics.average_processing_time}ms
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 💡 EXEMPLE D'UTILISATION */}
      <ExampleUsageCard />
    </div>
  )
}

/**
 * 🚦 STATUS BADGE : Badge de statut système
 */
const SystemStatusBadge: React.FC<{
  isActive: boolean
  criticalErrors: number
}> = ({ isActive, criticalErrors }) => {
  if (!isActive) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <div className="w-2 h-2 bg-gray-500 rounded-full" />
        Désactivé
      </Badge>
    )
  }

  if (criticalErrors > 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {criticalErrors} Critique{criticalErrors > 1 ? 's' : ''}
      </Badge>
    )
  }

  return (
    <Badge variant="default" className="flex items-center gap-1 bg-green-600">
      <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
      Actif
    </Badge>
  )
}

/**
 * 📊 METRICS CARD : Carte de métriques réutilisable
 */
const MetricsCard: React.FC<{
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
 * 💡 EXEMPLE D'UTILISATION : Documentation d'usage
 */
const ExampleUsageCard: React.FC = () => {
  const [showCode, setShowCode] = useState(false)

  const exampleCode = `
// 🎯 INTÉGRATION DASHBOARD - Exemple d'usage
import { useDashboardErrorReporting } from '@/hooks/use-error-reporting-integration'

export function MyDashboardComponent() {
  const {
    isActive,
    reportDashboardLoadError,
    detectAndReportModuleErrors,
    getModuleErrorStats
  } = useDashboardErrorReporting()

  // 📊 Tracking automatique performance
  useEffect(() => {
    const startTime = performance.now()

    // Votre logique de chargement dashboard...

    const loadTime = performance.now() - startTime

    // 🚨 Auto-report si SLO dépassé
    if (loadTime > 3000) {
      reportDashboardLoadError(loadTime)
    }
  }, [])

  // 🔍 Détection manuelle
  const handleScanErrors = async () => {
    const errors = await detectAndReportModuleErrors('dashboard')
    console.log(\`Détecté \${errors.length} erreurs\`)
  }

  // 📊 Stats module
  const stats = getModuleErrorStats('dashboard')

  return (
    <div>
      <h1>Dashboard avec Error Protection</h1>
      <p>Taux de succès: {stats.success_rate}%</p>
      {/* Votre composant dashboard... */}
    </div>
  )
}`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          Exemple d'Intégration
        </CardTitle>
        <CardDescription>
          Comment intégrer Error Reporting dans vos composants Dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Code d'exemple pour l'intégration Dashboard
            </p>
            <Button
              onClick={() => setShowCode(!showCode)}
              variant="outline"
              size="sm"
            >
              {showCode ? 'Masquer' : 'Voir le Code'}
            </Button>
          </div>

          {showCode && (
            <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto">
              <pre className="whitespace-pre-wrap">{exampleCode.trim()}</pre>
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-3">
            <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
              <div className="text-sm font-medium text-green-800">Auto-Détection</div>
              <div className="text-xs text-green-600">Surveillance continue 24/7</div>
            </div>

            <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
              <div className="text-sm font-medium text-blue-800">Performance SLO</div>
              <div className="text-xs text-blue-600">Dashboard {'<'} 3s target</div>
            </div>

            <div className="p-3 bg-purple-50 rounded border-l-4 border-purple-500">
              <div className="text-sm font-medium text-purple-800">Auto-Résolution</div>
              <div className="text-xs text-purple-600">85%+ succès rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default DashboardErrorIntegration