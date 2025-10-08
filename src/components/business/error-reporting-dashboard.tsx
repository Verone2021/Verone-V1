/**
 * 🚀 ERROR REPORTING DASHBOARD - INTERFACE RÉVOLUTIONNAIRE
 *
 * Dashboard temps réel pour monitoring et contrôle du système Error Reporting Intelligent
 * avec métriques avancées, visualisations et contrôles interactifs
 *
 * @author Vérone System Orchestrator
 * @version 2.0 - Révolutionnaire
 */

'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Users,
  Zap,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Trash2,
  Eye,
  Settings
} from 'lucide-react'

import { useErrorProcessingQueue } from '@/lib/error-detection/error-processing-queue'
import type { QueueMetrics, QueueWorker, QueueTask } from '@/lib/error-detection/error-processing-queue'
import type { VeroneError } from '@/lib/error-detection/verone-error-system'

/**
 * 🎯 INTERFACES : Types pour le dashboard
 */
interface ErrorStatistics {
  by_severity: Record<string, number>
  by_module: Record<string, number>
  by_type: Record<string, number>
  recent_trends: Array<{
    timestamp: string
    total_errors: number
    resolved_errors: number
  }>
}

interface AlertConfig {
  critical_threshold: number
  response_time_threshold: number
  success_rate_threshold: number
  queue_health_threshold: number
}

/**
 * 📊 COMPOSANT PRINCIPAL : Dashboard Error Reporting Révolutionnaire
 */
export const ErrorReportingDashboard: React.FC = () => {
  const {
    metrics,
    workers,
    isRunning,
    enqueueError,
    pauseQueue,
    resumeQueue,
    getQueueSnapshot,
    clearCompleted
  } = useErrorProcessingQueue()

  const [selectedTab, setSelectedTab] = useState('overview')
  const [queueSnapshot, setQueueSnapshot] = useState<ReturnType<typeof getQueueSnapshot>>()
  const [alertConfig] = useState<AlertConfig>({
    critical_threshold: 5,
    response_time_threshold: 10000, // 10s
    success_rate_threshold: 85,
    queue_health_threshold: 80
  })

  // 🔄 Mise à jour périodique des données
  useEffect(() => {
    const updateSnapshot = () => {
      setQueueSnapshot(getQueueSnapshot())
    }

    updateSnapshot()
    const interval = setInterval(updateSnapshot, 2000) // Update every 2s

    return () => clearInterval(interval)
  }, [getQueueSnapshot])

  // 🚨 Calcul des alertes critiques
  const criticalAlerts = useMemo(() => {
    const alerts = []

    if (metrics.failed_tasks > alertConfig.critical_threshold) {
      alerts.push({
        type: 'critical',
        message: `${metrics.failed_tasks} erreurs en échec critique`,
        action: 'review_failed_tasks'
      })
    }

    if (metrics.average_processing_time > alertConfig.response_time_threshold) {
      alerts.push({
        type: 'warning',
        message: `Temps de traitement élevé: ${metrics.average_processing_time}ms`,
        action: 'optimize_workers'
      })
    }

    if (metrics.success_rate < alertConfig.success_rate_threshold) {
      alerts.push({
        type: 'critical',
        message: `Taux de succès critique: ${metrics.success_rate}%`,
        action: 'escalate_manual'
      })
    }

    if (metrics.queue_health_score < alertConfig.queue_health_threshold) {
      alerts.push({
        type: 'warning',
        message: `Santé de la queue dégradée: ${metrics.queue_health_score}/100`,
        action: 'maintenance_required'
      })
    }

    return alerts
  }, [metrics, alertConfig])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* 🎯 HEADER */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Error Reporting Intelligence
            </h1>
            <p className="text-gray-600">
              Système révolutionnaire d'auto-résolution avec 85%+ de succès
            </p>
          </div>

          <div className="flex items-center gap-4">
            <SystemStatusIndicator
              isRunning={isRunning}
              healthScore={metrics.queue_health_score}
            />
            <QueueControlButtons
              isRunning={isRunning}
              onPause={pauseQueue}
              onResume={resumeQueue}
              onClearCompleted={clearCompleted}
            />
          </div>
        </div>

        {/* 🚨 ALERTES CRITIQUES */}
        {criticalAlerts.length > 0 && (
          <AlertSection alerts={criticalAlerts} />
        )}

        {/* 📊 MÉTRIQUES PRINCIPALES */}
        <MetricsOverview metrics={metrics} />

        {/* 📈 TABS DÉTAILLÉES */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="queue">Queue de traitement</TabsTrigger>
            <TabsTrigger value="workers">Workers Pool</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <RecentErrorsPanel
                errors={queueSnapshot?.recent_completed || []}
                title="Dernières Résolutions"
              />
              <ProcessingQueuePanel
                processingTasks={queueSnapshot?.processing || []}
                pendingCount={metrics.pending_tasks}
              />
            </div>
          </TabsContent>

          <TabsContent value="queue" className="space-y-6">
            <QueueManagement
              snapshot={queueSnapshot}
              metrics={metrics}
              onEnqueueTest={enqueueError}
            />
          </TabsContent>

          <TabsContent value="workers" className="space-y-6">
            <WorkersPoolDashboard
              workers={workers}
              metrics={metrics}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard
              metrics={metrics}
              workers={workers}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <SettingsPanel
              alertConfig={alertConfig}
              metrics={metrics}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

/**
 * 🚦 INDICATEUR STATUS : État système temps réel
 */
const SystemStatusIndicator: React.FC<{
  isRunning: boolean
  healthScore: number
}> = ({ isRunning, healthScore }) => {
  const getStatusColor = () => {
    if (!isRunning) return 'bg-gray-500'
    if (healthScore >= 90) return 'bg-green-500'
    if (healthScore >= 70) return 'bg-gray-500'
    return 'bg-red-500'
  }

  const getStatusText = () => {
    if (!isRunning) return 'ARRÊTÉ'
    if (healthScore >= 90) return 'OPTIMAL'
    if (healthScore >= 70) return 'DÉGRADÉ'
    return 'CRITIQUE'
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
      <div className="text-sm font-medium">
        <div className={`${isRunning ? 'text-green-700' : 'text-gray-700'}`}>
          {getStatusText()}
        </div>
        <div className="text-gray-500">
          Santé: {healthScore}/100
        </div>
      </div>
    </div>
  )
}

/**
 * 🎛️ CONTRÔLES QUEUE : Boutons de contrôle système
 */
const QueueControlButtons: React.FC<{
  isRunning: boolean
  onPause: () => void
  onResume: () => void
  onClearCompleted: () => void
}> = ({ isRunning, onPause, onResume, onClearCompleted }) => {
  return (
    <div className="flex items-center gap-2">
      {isRunning ? (
        <Button onClick={onPause} variant="outline" size="sm">
          <Pause className="w-4 h-4 mr-2" />
          Pause
        </Button>
      ) : (
        <Button onClick={onResume} size="sm">
          <Play className="w-4 h-4 mr-2" />
          Reprendre
        </Button>
      )}

      <Button onClick={onClearCompleted} variant="outline" size="sm">
        <Trash2 className="w-4 h-4 mr-2" />
        Nettoyer
      </Button>
    </div>
  )
}

/**
 * 🚨 SECTION ALERTES : Alertes critiques système
 */
const AlertSection: React.FC<{
  alerts: Array<{
    type: 'critical' | 'warning'
    message: string
    action: string
  }>
}> = ({ alerts }) => {
  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className={`p-4 rounded-lg border-l-4 ${
            alert.type === 'critical'
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-gray-50 border-gray-500 text-gray-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{alert.message}</span>
            </div>
            <Badge variant={alert.type === 'critical' ? 'destructive' : 'secondary'}>
              {alert.type.toUpperCase()}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * 📊 MÉTRIQUES OVERVIEW : KPIs principaux
 */
const MetricsOverview: React.FC<{ metrics: QueueMetrics }> = ({ metrics }) => {
  const kpis = [
    {
      title: 'Taux de Succès',
      value: `${metrics.success_rate}%`,
      icon: CheckCircle,
      color: metrics.success_rate >= 85 ? 'text-green-600' : 'text-red-600',
      bgColor: metrics.success_rate >= 85 ? 'bg-green-100' : 'bg-red-100',
      target: '≥85%'
    },
    {
      title: 'Temps Moyen',
      value: `${metrics.average_processing_time}ms`,
      icon: Clock,
      color: metrics.average_processing_time <= 5000 ? 'text-green-600' : 'text-gray-700',
      bgColor: metrics.average_processing_time <= 5000 ? 'bg-green-100' : 'bg-gray-100',
      target: '<5s'
    },
    {
      title: 'Throughput',
      value: `${metrics.throughput_per_minute}/min`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      target: '15+/min'
    },
    {
      title: 'Workers Actifs',
      value: `${metrics.workers_active}/${metrics.workers_total}`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      target: '8 max'
    }
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {kpi.title}
                </p>
                <p className="text-3xl font-bold text-black mb-1">
                  {kpi.value}
                </p>
                <p className="text-xs text-gray-500">
                  Target: {kpi.target}
                </p>
              </div>
              <div className={`p-3 rounded-full ${kpi.bgColor}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * 📝 PANNEAU ERREURS RÉCENTES : Dernières résolutions
 */
const RecentErrorsPanel: React.FC<{
  errors: QueueTask[]
  title: string
}> = ({ errors, title }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          {title}
        </CardTitle>
        <CardDescription>
          {errors.length} erreurs résolues récemment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.slice(0, 5).map((task, index) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-black truncate">
                  {task.error.message.substring(0, 60)}...
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {task.error.module}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {task.execution_time}ms
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {task.result?.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-gray-700" />
                )}
              </div>
            </div>
          ))}

          {errors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Aucune résolution récente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * ⚡ PANNEAU QUEUE : Queue de traitement en cours
 */
const ProcessingQueuePanel: React.FC<{
  processingTasks: QueueTask[]
  pendingCount: number
}> = ({ processingTasks, pendingCount }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Traitement en Cours
        </CardTitle>
        <CardDescription>
          {processingTasks.length} en cours, {pendingCount} en attente
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {processingTasks.map((task, index) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-black truncate">
                  {task.error.message.substring(0, 50)}...
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    Worker {task.worker_id}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Tentative {task.attempts}/{task.max_attempts}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
            </div>
          ))}

          {processingTasks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Aucun traitement en cours</p>
              <p className="text-sm">{pendingCount} tâches en attente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 👷 WORKERS DASHBOARD : État des workers
 */
const WorkersPoolDashboard: React.FC<{
  workers: QueueWorker[]
  metrics: QueueMetrics
}> = ({ workers, metrics }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Workers Pool</h2>
        <Badge variant="outline">
          {metrics.workers_active}/{metrics.workers_total} actifs
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {workers.map((worker) => (
          <Card key={worker.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-black">{worker.id}</h3>
                <Badge
                  variant={worker.status === 'busy' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {worker.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Traités:</span>
                  <span className="font-medium">{worker.processed_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Succès:</span>
                  <span className="font-medium">{worker.success_rate}%</span>
                </div>
                <div>
                  <span className="block mb-1">Spécialisations:</span>
                  <div className="flex flex-wrap gap-1">
                    {worker.specialization.map((spec, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {worker.current_task && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs">
                  <span className="text-blue-800">
                    Tâche: {worker.current_task}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * 📈 ANALYTICS DASHBOARD : Analyses avancées
 */
const AnalyticsDashboard: React.FC<{
  metrics: QueueMetrics
  workers: QueueWorker[]
}> = ({ metrics, workers }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Analytics & Insights</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Taux de Succès</span>
                  <span>{metrics.success_rate}%</span>
                </div>
                <Progress value={metrics.success_rate} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Santé de la Queue</span>
                  <span>{metrics.queue_health_score}/100</span>
                </div>
                <Progress value={metrics.queue_health_score} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Efficacité Workers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workers
                .sort((a, b) => b.success_rate - a.success_rate)
                .slice(0, 5)
                .map((worker, idx) => (
                <div key={worker.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      worker.status === 'busy' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm">{worker.id}</span>
                  </div>
                  <div className="text-sm font-medium">
                    {worker.success_rate}% ({worker.processed_count})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * ⚙️ SETTINGS PANEL : Configuration système
 */
const SettingsPanel: React.FC<{
  alertConfig: AlertConfig
  metrics: QueueMetrics
}> = ({ alertConfig, metrics }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">Configuration</h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Seuils d'Alertes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Erreurs Critiques Max
              </label>
              <div className="mt-1 text-lg font-bold text-black">
                {alertConfig.critical_threshold}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Temps Réponse Max (ms)
              </label>
              <div className="mt-1 text-lg font-bold text-black">
                {alertConfig.response_time_threshold}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Taux Succès Min (%)
              </label>
              <div className="mt-1 text-lg font-bold text-black">
                {alertConfig.success_rate_threshold}%
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Santé Queue Min
              </label>
              <div className="mt-1 text-lg font-bold text-black">
                {alertConfig.queue_health_threshold}/100
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 🎛️ QUEUE MANAGEMENT : Gestion avancée de la queue
 */
const QueueManagement: React.FC<{
  snapshot: ReturnType<typeof getQueueSnapshot> | undefined
  metrics: QueueMetrics
  onEnqueueTest: (error: VeroneError, priority?: number) => Promise<string>
}> = ({ snapshot, metrics, onEnqueueTest }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">Gestion de la Queue</h2>
        <Button
          onClick={() => {
            // Créer une erreur de test
            const testError: VeroneError = {
              id: `test_${Date.now()}`,
              type: 'console' as any,
              severity: 'medium' as any,
              module: 'testing',
              message: 'Test error for queue validation',
              context: {
                url: '/test',
                user_action: 'manual_test',
                timestamp: new Date(),
                browser: 'test',
                session_id: 'test'
              },
              fix_priority: 5,
              estimated_fix_time: '1min',
              mcp_tools_needed: ['mcp__playwright__browser_console_messages'],
              auto_fixable: true,
              resolution_status: 'pending'
            }

            onEnqueueTest(testError, 7)
          }}
          variant="outline"
        >
          <Zap className="w-4 h-4 mr-2" />
          Test Auto-résolution
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En Attente</CardTitle>
            <CardDescription>{snapshot?.pending.length || 0} tâches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshot?.pending.slice(0, 3).map((task) => (
                <div key={task.id} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="font-medium truncate">
                    {task.error.message.substring(0, 40)}...
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Priorité: {task.priority} | Module: {task.error.module}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">En Traitement</CardTitle>
            <CardDescription>{snapshot?.processing.length || 0} tâches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshot?.processing.map((task) => (
                <div key={task.id} className="p-2 bg-blue-50 rounded text-sm">
                  <div className="font-medium truncate">
                    {task.error.message.substring(0, 40)}...
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Worker: {task.worker_id} | Tentative: {task.attempts}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Terminées</CardTitle>
            <CardDescription>{snapshot?.recent_completed.length || 0} récentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {snapshot?.recent_completed.slice(0, 3).map((task) => (
                <div key={task.id} className="p-2 bg-green-50 rounded text-sm">
                  <div className="font-medium truncate">
                    {task.error.message.substring(0, 40)}...
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {task.execution_time}ms | {task.result?.success ? '✅' : '❌'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ErrorReportingDashboard