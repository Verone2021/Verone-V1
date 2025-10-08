'use client'

/**
 * 🤖 AI INSIGHTS PANEL - Vérone Back Office
 * Interface avancée de visualisation des insights IA et Machine Learning
 * Phase 3: Advanced AI Visualization & Business Intelligence Dashboard
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  LineChart,
  PieChart,
  Zap,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  Trophy,
  Gauge,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Imports des modules IA
import { useSequentialThinking } from '@/lib/ai/sequential-thinking-processor'
import { useErrorPatternLearning } from '@/lib/ai/error-pattern-learner'
import { useBusinessPredictions, BusinessPrediction, BusinessInsight, OperationalMetrics } from '@/lib/ai/business-predictions'

interface AIInsightsPanelProps {
  className?: string
  refreshInterval?: number
}

/**
 * 🎯 COMPOSANT PRINCIPAL : AI Insights Dashboard
 */
export function AIInsightsPanel({ className, refreshInterval = 30000 }: AIInsightsPanelProps) {
  // États locaux
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [selectedPredictionType, setSelectedPredictionType] = useState<string>('all')

  // Hooks IA
  const {
    isProcessing: stProcessing,
    mlMetrics: stMetrics,
    recentAnalyses,
    generatePredictions: stGeneratePredictions,
    clearHistory: stClearHistory
  } = useSequentialThinking()

  const {
    mlMetrics: plMetrics,
    patterns,
    isLearning,
    analyzePatternTrends,
    getAllPatterns,
    clearAllPatterns
  } = useErrorPatternLearning()

  const {
    predictions,
    insights,
    operationalMetrics,
    isGenerating: bpGenerating,
    generatePredictions: bpGeneratePredictions,
    generateInsights,
    getPredictionsByType
  } = useBusinessPredictions()

  /**
   * 🔄 RAFRAÎCHISSEMENT COMPLET : Régénération données IA
   */
  const handleFullRefresh = async () => {
    setIsRefreshing(true)
    console.log('🤖 Rafraîchissement complet AI Insights...')

    try {
      // Génération prédictions business
      console.log('🔮 Génération prédictions business...')
      await bpGeneratePredictions()

      // Génération insights business
      console.log('💡 Génération insights business...')
      await generateInsights()

      // Analyse patterns trends
      console.log('📊 Analyse trends patterns...')
      const trends = await analyzePatternTrends()
      console.log(`📈 ${Object.keys(trends).length} catégories de trends analysées`)

      setLastRefresh(new Date())
      console.log('✅ Rafraîchissement AI complet terminé')

    } catch (error) {
      console.error('❌ Erreur rafraîchissement AI:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh périodique
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        handleFullRefresh()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  // Calculs métriques combinées
  const combinedMetrics = {
    total_patterns: plMetrics.total_patterns_learned,
    avg_success_rate: plMetrics.avg_success_rate,
    learning_velocity: plMetrics.learning_velocity,
    prediction_accuracy: plMetrics.prediction_accuracy,
    auto_fix_rate: plMetrics.auto_fix_rate,
    total_analyses: stMetrics.total_analyses,
    confidence_score: stMetrics.avg_confidence_score
  }

  const isAnyProcessing = stProcessing || isLearning || bpGenerating || isRefreshing

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header avec actions principales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Brain className="w-6 h-6 text-blue-600" />
                {isAnyProcessing && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                )}
              </div>
              <div>
                <CardTitle className="text-xl">AI Insights Dashboard</CardTitle>
                <CardDescription>
                  Intelligence Artificielle avancée • Machine Learning • Prédictions Business
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleFullRefresh}
                disabled={isRefreshing}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Refresh AI
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {/* Export logic */}}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        {lastRefresh && (
          <CardContent className="pt-0">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">AI System Updated</AlertTitle>
              <AlertDescription className="text-green-700">
                Dernière mise à jour: {lastRefresh.toLocaleString()} •
                {predictions.length} prédictions • {insights.length} insights générés
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Métriques ML globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Brain className="w-6 h-6 text-blue-600" />}
          title="AI Learning"
          value={`${combinedMetrics.total_patterns}`}
          subtitle="Patterns appris"
          trend={plMetrics.improvement_rate > 0.1 ? 'up' : 'stable'}
          color="blue"
        />
        <MetricCard
          icon={<Target className="w-6 h-6 text-green-600" />}
          title="Précision IA"
          value={`${Math.round(combinedMetrics.prediction_accuracy * 100)}%`}
          subtitle="Accuracy prédictions"
          trend="up"
          color="green"
        />
        <MetricCard
          icon={<Zap className="w-6 h-6 text-purple-600" />}
          title="Auto-Fix"
          value={`${Math.round(combinedMetrics.auto_fix_rate * 100)}%`}
          subtitle="Résolution automatique"
          trend={combinedMetrics.auto_fix_rate > 0.7 ? 'up' : 'stable'}
          color="purple"
        />
        <MetricCard
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          title="Learning Rate"
          value={`${combinedMetrics.learning_velocity.toFixed(1)}`}
          subtitle="Patterns/jour"
          trend="up"
          color="orange"
        />
      </div>

      {/* Métriques opérationnelles */}
      {operationalMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Métriques Opérationnelles Temps Réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {operationalMetrics.system_health_score}%
                </div>
                <div className="text-sm text-muted-foreground">System Health</div>
                <Progress
                  value={operationalMetrics.system_health_score}
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {operationalMetrics.team_productivity_index}%
                </div>
                <div className="text-sm text-muted-foreground">Team Productivity</div>
                <Progress
                  value={operationalMetrics.team_productivity_index}
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {operationalMetrics.error_resolution_efficiency}%
                </div>
                <div className="text-sm text-muted-foreground">Resolution Efficiency</div>
                <Progress
                  value={operationalMetrics.error_resolution_efficiency}
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {operationalMetrics.predicted_downtime}min
                </div>
                <div className="text-sm text-muted-foreground">Predicted Downtime/Day</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onglets principaux */}
      <Tabs defaultValue="predictions" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Prédictions
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Patterns ML
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            System AI
          </TabsTrigger>
        </TabsList>

        {/* Prédictions Business */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Prédictions Business IA</h3>
            <div className="flex gap-2">
              {['all', 'performance', 'stability', 'revenue'].map(type => (
                <Button
                  key={type}
                  variant={selectedPredictionType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPredictionType(type)}
                >
                  {type === 'all' ? 'Toutes' : type}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-96">
            <div className="space-y-4">
              {predictions
                .filter(p => selectedPredictionType === 'all' || p.prediction_type === selectedPredictionType)
                .map(prediction => (
                  <PredictionCard key={prediction.id} prediction={prediction} />
                ))}

              {predictions.length === 0 && (
                <Card className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune prédiction disponible</p>
                  <Button
                    onClick={bpGeneratePredictions}
                    className="mt-4"
                    disabled={bpGenerating}
                  >
                    {bpGenerating ? 'Génération...' : 'Générer Prédictions'}
                  </Button>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Insights Business */}
        <TabsContent value="insights" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Insights Business Actionables</h3>
            <Button
              onClick={generateInsights}
              disabled={bpGenerating}
              size="sm"
              variant="outline"
            >
              <Brain className="w-4 h-4 mr-2" />
              Régénérer Insights
            </Button>
          </div>

          <div className="grid gap-4">
            {insights.map(insight => (
              <InsightCard key={insight.id} insight={insight} />
            ))}

            {insights.length === 0 && (
              <Card className="p-8 text-center">
                <Lightbulb className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Aucun insight disponible</p>
                <Button
                  onClick={generateInsights}
                  className="mt-4"
                  disabled={bpGenerating}
                >
                  Générer Insights
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Patterns Machine Learning */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Patterns Machine Learning</h3>
            <div className="flex gap-2">
              <Badge variant="secondary">
                {patterns.length} patterns actifs
              </Badge>
              <Button
                onClick={clearAllPatterns}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
              >
                Clear Patterns
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {patterns.slice(0, 10).map(pattern => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        </TabsContent>

        {/* Analytics Avancées */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsPanel
            stMetrics={stMetrics}
            plMetrics={plMetrics}
            recentAnalyses={recentAnalyses}
          />
        </TabsContent>

        {/* Système IA */}
        <TabsContent value="system" className="space-y-4">
          <SystemAIPanel
            stMetrics={stMetrics}
            plMetrics={plMetrics}
            isProcessing={isAnyProcessing}
            onClearHistory={stClearHistory}
            onClearPatterns={clearAllPatterns}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/**
 * 📊 METRIC CARD : Carte métrique avec tendance
 */
interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string
  subtitle: string
  trend: 'up' | 'down' | 'stable'
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

function MetricCard({ icon, title, value, subtitle, trend, color }: MetricCardProps) {
  const colorMap = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    purple: 'border-purple-200 bg-purple-50',
    orange: 'border-orange-200 bg-orange-50',
    red: 'border-red-200 bg-red-50'
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity

  return (
    <Card className={cn('relative overflow-hidden', colorMap[color])}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            {icon}
            <TrendIcon className={cn(
              'w-4 h-4',
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 🔮 PREDICTION CARD : Carte prédiction business
 */
interface PredictionCardProps {
  prediction: BusinessPrediction
}

function PredictionCard({ prediction }: PredictionCardProps) {
  const impactColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-gray-500 bg-gray-50'
  }

  const ImpactIcon = prediction.impact_level === 'critical' ? AlertTriangle :
                   prediction.impact_level === 'high' ? AlertCircle :
                   prediction.impact_level === 'medium' ? Eye : CheckCircle

  return (
    <Card className={cn('border-l-4', impactColors[prediction.impact_level])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <ImpactIcon className="w-5 h-5" />
              {prediction.title}
            </CardTitle>
            <CardDescription>{prediction.description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {Math.round(prediction.confidence_score * 100)}% confiance
            </Badge>
            <Badge variant="outline">
              {prediction.time_horizon}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Prédiction</p>
            <p className="text-lg font-semibold">{prediction.predicted_value}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Baseline</p>
            <p className="text-sm">{prediction.current_baseline}</p>
          </div>
        </div>

        {prediction.recommended_actions.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Actions Recommandées:</p>
            <ul className="space-y-1">
              {prediction.recommended_actions.slice(0, 3).map((action, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 shrink-0" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Impact: {prediction.business_context.revenue_impact_estimate} •
          Modules: {prediction.business_context.affected_modules.join(', ')}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 💡 INSIGHT CARD : Carte insight business
 */
interface InsightCardProps {
  insight: BusinessInsight
}

function InsightCard({ insight }: InsightCardProps) {
  const categoryColors = {
    cost_optimization: 'border-green-500 bg-green-50',
    performance_improvement: 'border-blue-500 bg-blue-50',
    risk_mitigation: 'border-red-500 bg-red-50',
    growth_opportunity: 'border-purple-500 bg-purple-50'
  }

  const CategoryIcon = {
    cost_optimization: Trophy,
    performance_improvement: Zap,
    risk_mitigation: AlertTriangle,
    growth_opportunity: TrendingUp
  }[insight.category]

  return (
    <Card className={cn('border-l-4', categoryColors[insight.category])}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <CategoryIcon className="w-5 h-5" />
              {insight.category.replace('_', ' ').toUpperCase()}
            </CardTitle>
            <CardDescription className="text-base">
              {insight.insight}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary">
              Priorité {insight.priority_level}/10
            </Badge>
            <Badge variant={insight.implementation_effort === 'low' ? 'default' :
                          insight.implementation_effort === 'medium' ? 'secondary' : 'destructive'}>
              {insight.implementation_effort} effort
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Impact Estimé:</p>
          <p className="text-lg font-semibold text-green-600">{insight.estimated_impact}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Score Actionabilité:</p>
          <div className="flex items-center gap-2">
            <Progress value={insight.actionability_score * 100} className="flex-1 h-2" />
            <span className="text-sm">{Math.round(insight.actionability_score * 100)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 🧩 PATTERN CARD : Carte pattern ML
 */
interface PatternCardProps {
  pattern: any // ErrorPattern type
}

function PatternCard({ pattern }: PatternCardProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{pattern.pattern_signature}</CardTitle>
            <CardDescription>
              {pattern.occurrence_count} occurrences • {Math.round(pattern.success_rate * 100)}% succès
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant={pattern.learning_confidence > 0.8 ? 'default' : 'secondary'}>
              {Math.round(pattern.learning_confidence * 100)}% confiance
            </Badge>
            <Badge variant="outline">
              {pattern.evolution_trend}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Taux de succès:</span>
            <span className="font-medium">{Math.round(pattern.success_rate * 100)}%</span>
          </div>
          <Progress value={pattern.success_rate * 100} className="h-2" />

          <div className="text-xs text-muted-foreground">
            Modules: {pattern.context_factors.modules.join(', ')} •
            Mots-clés: {pattern.message_keywords.slice(0, 3).join(', ')}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 📊 ANALYTICS PANEL : Panel analytics avancées
 */
interface AnalyticsPanelProps {
  stMetrics: any
  plMetrics: any
  recentAnalyses: any[]
}

function AnalyticsPanel({ stMetrics, plMetrics, recentAnalyses }: AnalyticsPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Analytics ML</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{stMetrics.total_analyses}</div>
              <div className="text-sm text-muted-foreground">Analyses Total</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{Math.round(stMetrics.avg_confidence_score * 100)}%</div>
              <div className="text-sm text-muted-foreground">Confiance Moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{plMetrics.total_patterns_learned}</div>
              <div className="text-sm text-muted-foreground">Patterns Appris</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analyses Récentes Sequential Thinking</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((analysis, index) => (
                <div key={index} className="border-l-4 border-l-blue-500 pl-4">
                  <p className="text-sm font-medium">
                    {analysis.error.type} • {analysis.error.module}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Confiance: {Math.round(analysis.root_cause_analysis.confidence_score * 100)}% •
                    {analysis.generated_at.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * ⚙️ SYSTEM AI PANEL : Panel système IA
 */
interface SystemAIPanelProps {
  stMetrics: any
  plMetrics: any
  isProcessing: boolean
  onClearHistory: () => void
  onClearPatterns: () => void
}

function SystemAIPanel({
  stMetrics,
  plMetrics,
  isProcessing,
  onClearHistory,
  onClearPatterns
}: SystemAIPanelProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>État Système IA</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <Badge variant={isProcessing ? 'default' : 'secondary'}>
                {isProcessing ? 'Processing' : 'Idle'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Learning Velocity:</span>
              <span>{plMetrics.learning_velocity.toFixed(1)} patterns/jour</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Coverage:</span>
              <span>{Object.values(plMetrics.knowledge_coverage).reduce((a: number, b: number) => a + b, 0)} types couverts</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button
              onClick={onClearHistory}
              variant="outline"
              className="w-full text-orange-600 hover:text-orange-700"
            >
              Clear Analysis History
            </Button>
            <Button
              onClick={onClearPatterns}
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
            >
              Clear All Patterns
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}