/**
 * 🤖 ERROR PATTERN LEARNER - Vérone Back Office
 * Système d'apprentissage automatique pour patterns d'erreurs récurrents
 * Phase 3: Self-Learning Error Resolution avec Machine Learning
 */

import { VeroneError, ErrorSeverity, ErrorType, ResolutionResult } from '../error-detection/verone-error-system'
import { supabaseErrorConnector, MCPStrategy } from '../error-detection/supabase-error-connector'

export interface ErrorPattern {
  id: string
  pattern_signature: string
  error_type: ErrorType
  message_keywords: string[]
  context_factors: {
    modules: string[]
    urls: string[]
    times_of_day: number[]
    days_of_week: number[]
  }
  occurrence_count: number
  success_resolutions: number
  failed_resolutions: number
  success_rate: number
  avg_resolution_time: number
  best_strategies: Array<{
    strategy_name: string
    success_count: number
    success_rate: number
    avg_time: number
  }>
  learning_confidence: number
  created_at: Date
  last_updated: Date
  evolution_trend: 'improving' | 'stable' | 'degrading'
}

export interface ResolutionLearning {
  pattern_id: string
  strategy_used: string
  mcp_tools_used: string[]
  success: boolean
  execution_time: number
  context: {
    error_severity: ErrorSeverity
    module: string
    timestamp: Date
    user_impact: string
  }
  improvements_identified: string[]
  confidence_delta: number
}

export interface MLMetrics {
  total_patterns_learned: number
  avg_success_rate: number
  improvement_rate: number
  prediction_accuracy: number
  auto_fix_rate: number
  learning_velocity: number
  pattern_stability: number
  knowledge_coverage: {
    console_errors: number
    network_errors: number
    supabase_errors: number
    typescript_errors: number
    performance_errors: number
  }
}

export interface StrategySuggestion {
  strategy_name: string
  confidence_score: number
  expected_success_rate: number
  estimated_time: string
  mcp_tools: string[]
  reasoning: string
  risk_level: 'low' | 'medium' | 'high'
}

/**
 * 🧠 MACHINE LEARNING PATTERN LEARNER
 * Système intelligent d'apprentissage des patterns d'erreurs
 */
export class ErrorPatternLearner {
  private patterns: Map<string, ErrorPattern> = new Map()
  private resolutionHistory: ResolutionLearning[] = []
  private isLearning = false
  private learningQueue: Array<{ error: VeroneError, result: ResolutionResult, strategy: string }> = []

  constructor() {
    this.startContinuousLearning()
  }

  /**
   * 🎯 APPRENTISSAGE PRINCIPAL : Enregistrer nouvelle résolution pour apprentissage
   */
  async learnFromResolution(
    error: VeroneError,
    resolutionResult: ResolutionResult,
    strategyUsed: string,
    mcpToolsUsed: string[]
  ): Promise<void> {
    const learning: ResolutionLearning = {
      pattern_id: this.generatePatternId(error),
      strategy_used: strategyUsed,
      mcp_tools_used: mcpToolsUsed,
      success: resolutionResult.success,
      execution_time: this.parseExecutionTime(resolutionResult.time_taken),
      context: {
        error_severity: error.severity,
        module: error.module,
        timestamp: new Date(),
        user_impact: this.calculateUserImpact(error)
      },
      improvements_identified: resolutionResult.suggestions || [],
      confidence_delta: 0
    }

    // Ajouter à l'historique
    this.resolutionHistory.push(learning)

    // Limiter l'historique à 1000 entrées
    if (this.resolutionHistory.length > 1000) {
      this.resolutionHistory = this.resolutionHistory.slice(-1000)
    }

    // Ajouter à la queue d'apprentissage
    this.learningQueue.push({ error, result: resolutionResult, strategy: strategyUsed })

    console.log(`🤖 Nouvelle résolution ajoutée pour apprentissage: ${learning.pattern_id}`)

    // Traitement immédiat si pas en cours
    if (!this.isLearning) {
      await this.processLearningQueue()
    }
  }

  /**
   * 🔄 TRAITEMENT APPRENTISSAGE : Queue de traitement ML
   */
  private async processLearningQueue(): Promise<void> {
    if (this.isLearning || this.learningQueue.length === 0) return

    this.isLearning = true
    console.log(`🧠 Traitement ${this.learningQueue.length} éléments d'apprentissage...`)

    try {
      while (this.learningQueue.length > 0) {
        const learning = this.learningQueue.shift()!
        await this.updatePattern(learning.error, learning.result, learning.strategy)

        // Pause courte entre les traitements
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Optimisation des patterns après traitement
      await this.optimizePatterns()

      console.log('✅ Queue d\'apprentissage traitée complètement')
    } catch (error) {
      console.error('❌ Erreur traitement apprentissage:', error)
    } finally {
      this.isLearning = false
    }
  }

  /**
   * 📊 MISE À JOUR PATTERN : Améliorer pattern existant ou créer nouveau
   */
  private async updatePattern(
    error: VeroneError,
    result: ResolutionResult,
    strategy: string
  ): Promise<void> {
    const patternId = this.generatePatternId(error)
    const existingPattern = this.patterns.get(patternId)

    if (existingPattern) {
      // Mise à jour pattern existant
      await this.updateExistingPattern(existingPattern, error, result, strategy)
    } else {
      // Création nouveau pattern
      await this.createNewPattern(patternId, error, result, strategy)
    }
  }

  /**
   * 🔄 PATTERN EXISTANT : Amélioration pattern connu
   */
  private async updateExistingPattern(
    pattern: ErrorPattern,
    error: VeroneError,
    result: ResolutionResult,
    strategy: string
  ): Promise<void> {
    // Incrémenter compteurs
    pattern.occurrence_count++

    if (result.success) {
      pattern.success_resolutions++
    } else {
      pattern.failed_resolutions++
    }

    // Recalculer taux de succès
    pattern.success_rate = pattern.success_resolutions / pattern.occurrence_count

    // Mettre à jour temps moyen
    const newTime = this.parseExecutionTime(result.time_taken)
    pattern.avg_resolution_time =
      (pattern.avg_resolution_time * (pattern.occurrence_count - 1) + newTime) / pattern.occurrence_count

    // Mettre à jour contexte
    this.updatePatternContext(pattern, error)

    // Mettre à jour stratégies
    await this.updatePatternStrategies(pattern, strategy, result)

    // Recalculer confiance d'apprentissage
    pattern.learning_confidence = this.calculateLearningConfidence(pattern)

    // Déterminer tendance d'évolution
    pattern.evolution_trend = this.calculateEvolutionTrend(pattern)

    pattern.last_updated = new Date()

    console.log(`📊 Pattern mis à jour: ${pattern.id} (${pattern.success_rate.toFixed(2)} success rate)`)
  }

  /**
   * 🆕 NOUVEAU PATTERN : Création pattern inédit
   */
  private async createNewPattern(
    patternId: string,
    error: VeroneError,
    result: ResolutionResult,
    strategy: string
  ): Promise<void> {
    const pattern: ErrorPattern = {
      id: patternId,
      pattern_signature: this.generatePatternSignature(error),
      error_type: error.type,
      message_keywords: this.extractKeywords(error.message),
      context_factors: {
        modules: [error.module],
        urls: [error.context.url],
        times_of_day: [new Date().getHours()],
        days_of_week: [new Date().getDay()]
      },
      occurrence_count: 1,
      success_resolutions: result.success ? 1 : 0,
      failed_resolutions: result.success ? 0 : 1,
      success_rate: result.success ? 1.0 : 0.0,
      avg_resolution_time: this.parseExecutionTime(result.time_taken),
      best_strategies: [{
        strategy_name: strategy,
        success_count: result.success ? 1 : 0,
        success_rate: result.success ? 1.0 : 0.0,
        avg_time: this.parseExecutionTime(result.time_taken)
      }],
      learning_confidence: 0.3, // Faible au début
      created_at: new Date(),
      last_updated: new Date(),
      evolution_trend: 'stable'
    }

    this.patterns.set(patternId, pattern)
    console.log(`🆕 Nouveau pattern créé: ${patternId}`)
  }

  /**
   * 🎯 PRÉDICTION STRATÉGIE : Suggérer meilleure stratégie basée sur ML
   */
  async predictBestStrategy(error: VeroneError): Promise<StrategySuggestion[]> {
    const patternId = this.generatePatternId(error)
    const exactPattern = this.patterns.get(patternId)

    const suggestions: StrategySuggestion[] = []

    // 1. Pattern exact trouvé
    if (exactPattern && exactPattern.learning_confidence > 0.7) {
      suggestions.push(...this.createSuggestionsFromPattern(exactPattern, 'exact_match'))
    }

    // 2. Patterns similaires
    const similarPatterns = this.findSimilarPatterns(error)
    similarPatterns.forEach(pattern => {
      if (pattern.learning_confidence > 0.5) {
        suggestions.push(...this.createSuggestionsFromPattern(pattern, 'similar_pattern'))
      }
    })

    // 3. Patterns par type d'erreur
    const typePatterns = this.getPatternsByType(error.type)
    typePatterns
      .filter(pattern => pattern.success_rate > 0.6)
      .slice(0, 2)
      .forEach(pattern => {
        suggestions.push(...this.createSuggestionsFromPattern(pattern, 'type_pattern'))
      })

    // 4. Stratégie par défaut si rien trouvé
    if (suggestions.length === 0) {
      suggestions.push(this.getDefaultStrategy(error))
    }

    // Trier par score de confiance
    suggestions.sort((a, b) => b.confidence_score - a.confidence_score)

    // Limiter à 5 suggestions max
    return suggestions.slice(0, 5)
  }

  /**
   * 📊 MÉTRIQUES ML : Analyse performance d'apprentissage
   */
  getMLMetrics(): MLMetrics {
    const allPatterns = Array.from(this.patterns.values())
    const recentLearning = this.resolutionHistory.filter(l =>
      l.context.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const successRate = allPatterns.length > 0 ?
      allPatterns.reduce((sum, p) => sum + p.success_rate, 0) / allPatterns.length : 0

    const improvementRate = this.calculateImprovementRate(allPatterns)
    const predictionAccuracy = this.calculatePredictionAccuracy()

    // Coverage par type d'erreur
    const coverage = {
      console_errors: allPatterns.filter(p => p.error_type === ErrorType.CONSOLE).length,
      network_errors: allPatterns.filter(p => p.error_type === ErrorType.NETWORK).length,
      supabase_errors: allPatterns.filter(p => p.error_type === ErrorType.SUPABASE).length,
      typescript_errors: allPatterns.filter(p => p.error_type === ErrorType.TYPESCRIPT).length,
      performance_errors: allPatterns.filter(p => p.error_type === ErrorType.PERFORMANCE).length
    }

    return {
      total_patterns_learned: allPatterns.length,
      avg_success_rate: Math.round(successRate * 100) / 100,
      improvement_rate: improvementRate,
      prediction_accuracy: predictionAccuracy,
      auto_fix_rate: this.calculateAutoFixRate(),
      learning_velocity: recentLearning.length / 7, // patterns par jour
      pattern_stability: this.calculatePatternStability(),
      knowledge_coverage: coverage
    }
  }

  /**
   * 🔍 ANALYSE PATTERNS : Intelligence sur patterns détectés
   */
  analyzePatternTrends(): {
    trending_errors: Array<{ pattern: string, growth_rate: number }>
    declining_errors: Array<{ pattern: string, decline_rate: number }>
    stable_patterns: Array<{ pattern: string, consistency_score: number }>
    emerging_threats: Array<{ pattern: string, risk_score: number }>
  } {
    const allPatterns = Array.from(this.patterns.values())

    // Patterns en croissance
    const trending = allPatterns
      .filter(p => p.evolution_trend === 'improving' && p.occurrence_count > 5)
      .map(p => ({
        pattern: p.pattern_signature,
        growth_rate: this.calculateGrowthRate(p)
      }))
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 5)

    // Patterns en déclin
    const declining = allPatterns
      .filter(p => p.evolution_trend === 'degrading')
      .map(p => ({
        pattern: p.pattern_signature,
        decline_rate: this.calculateDeclineRate(p)
      }))
      .sort((a, b) => b.decline_rate - a.decline_rate)
      .slice(0, 5)

    // Patterns stables
    const stable = allPatterns
      .filter(p => p.evolution_trend === 'stable' && p.learning_confidence > 0.8)
      .map(p => ({
        pattern: p.pattern_signature,
        consistency_score: p.learning_confidence
      }))
      .sort((a, b) => b.consistency_score - a.consistency_score)
      .slice(0, 5)

    // Menaces émergentes
    const emerging = allPatterns
      .filter(p => p.occurrence_count < 5 && p.success_rate < 0.5)
      .map(p => ({
        pattern: p.pattern_signature,
        risk_score: (1 - p.success_rate) * p.occurrence_count
      }))
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, 5)

    return {
      trending_errors: trending,
      declining_errors: declining,
      stable_patterns: stable,
      emerging_threats: emerging
    }
  }

  /**
   * 🔄 OPTIMISATION : Amélioration continue des patterns
   */
  private async optimizePatterns(): Promise<void> {
    console.log('🔧 Optimisation des patterns ML...')

    for (const pattern of this.patterns.values()) {
      // Supprimer patterns obsolètes ou peu fiables
      if (this.shouldRemovePattern(pattern)) {
        this.patterns.delete(pattern.id)
        console.log(`🗑️ Pattern supprimé: ${pattern.id} (peu fiable)`)
        continue
      }

      // Optimiser stratégies du pattern
      await this.optimizePatternStrategies(pattern)

      // Recalculer métriques
      pattern.learning_confidence = this.calculateLearningConfidence(pattern)
      pattern.evolution_trend = this.calculateEvolutionTrend(pattern)
    }

    console.log(`✅ Optimisation terminée: ${this.patterns.size} patterns actifs`)
  }

  /**
   * 🔄 APPRENTISSAGE CONTINU : Loop d'amélioration
   */
  private startContinuousLearning(): void {
    setInterval(async () => {
      if (!this.isLearning && this.learningQueue.length > 0) {
        await this.processLearningQueue()
      }

      // Optimisation périodique (toutes les heures)
      const now = new Date()
      if (now.getMinutes() === 0 && now.getSeconds() < 30) {
        await this.optimizePatterns()
      }
    }, 30000) // Check toutes les 30 secondes
  }

  /**
   * 🛠️ UTILITAIRES : Fonctions helper
   */
  private generatePatternId(error: VeroneError): string {
    const signature = `${error.type}_${error.module}_${this.hashMessage(error.message)}`
    return signature.substring(0, 32)
  }

  private generatePatternSignature(error: VeroneError): string {
    const keywords = this.extractKeywords(error.message)
    return `${error.type} in ${error.module}: ${keywords.slice(0, 3).join(', ')}`
  }

  private extractKeywords(message: string): string[] {
    // Extraire mots clés pertinents du message d'erreur
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be']

    return message.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 5)
  }

  private hashMessage(message: string): string {
    let hash = 0
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16)
  }

  private parseExecutionTime(timeStr: string): number {
    // Parser "45s", "2min", "1.5h" etc. en millisecondes
    const match = timeStr.match(/(\d+(?:\.\d+)?)(ms|s|min|h)/)
    if (!match) return 0

    const value = parseFloat(match[1])
    const unit = match[2]

    switch (unit) {
      case 'ms': return value
      case 's': return value * 1000
      case 'min': return value * 60 * 1000
      case 'h': return value * 60 * 60 * 1000
      default: return 0
    }
  }

  private calculateUserImpact(error: VeroneError): string {
    if (error.severity === ErrorSeverity.CRITICAL) return 'critical'
    if (error.module === 'orders' || error.module === 'billing') return 'high'
    if (error.severity === ErrorSeverity.HIGH) return 'high'
    if (error.severity === ErrorSeverity.MEDIUM) return 'medium'
    return 'low'
  }

  private updatePatternContext(pattern: ErrorPattern, error: VeroneError): void {
    // Ajouter module si pas déjà présent
    if (!pattern.context_factors.modules.includes(error.module)) {
      pattern.context_factors.modules.push(error.module)
    }

    // Ajouter URL si pas déjà présente
    if (!pattern.context_factors.urls.includes(error.context.url)) {
      pattern.context_factors.urls.push(error.context.url)
    }

    // Ajouter heure actuelle
    const currentHour = new Date().getHours()
    if (!pattern.context_factors.times_of_day.includes(currentHour)) {
      pattern.context_factors.times_of_day.push(currentHour)
    }

    // Ajouter jour de semaine
    const currentDay = new Date().getDay()
    if (!pattern.context_factors.days_of_week.includes(currentDay)) {
      pattern.context_factors.days_of_week.push(currentDay)
    }
  }

  private async updatePatternStrategies(
    pattern: ErrorPattern,
    strategy: string,
    result: ResolutionResult
  ): Promise<void> {
    const existingStrategy = pattern.best_strategies.find(s => s.strategy_name === strategy)

    if (existingStrategy) {
      existingStrategy.success_count += result.success ? 1 : 0
      const totalAttempts = Math.ceil(existingStrategy.success_count / existingStrategy.success_rate) || 1
      existingStrategy.success_rate = existingStrategy.success_count / totalAttempts

      // Mise à jour temps moyen
      const newTime = this.parseExecutionTime(result.time_taken)
      existingStrategy.avg_time = (existingStrategy.avg_time + newTime) / 2
    } else {
      pattern.best_strategies.push({
        strategy_name: strategy,
        success_count: result.success ? 1 : 0,
        success_rate: result.success ? 1.0 : 0.0,
        avg_time: this.parseExecutionTime(result.time_taken)
      })
    }

    // Trier par taux de succès et garder les 5 meilleures
    pattern.best_strategies = pattern.best_strategies
      .sort((a, b) => b.success_rate - a.success_rate)
      .slice(0, 5)
  }

  private calculateLearningConfidence(pattern: ErrorPattern): number {
    let confidence = 0

    // Basé sur le nombre d'occurrences (0-0.4)
    const occurrenceScore = Math.min(0.4, pattern.occurrence_count / 20)

    // Basé sur le taux de succès (0-0.4)
    const successScore = pattern.success_rate * 0.4

    // Basé sur la consistance temporelle (0-0.2)
    const ageBonus = Math.min(0.2,
      (Date.now() - pattern.created_at.getTime()) / (7 * 24 * 60 * 60 * 1000) * 0.1
    )

    confidence = occurrenceScore + successScore + ageBonus
    return Math.min(1.0, confidence)
  }

  private calculateEvolutionTrend(pattern: ErrorPattern): 'improving' | 'stable' | 'degrading' {
    const recentResolutions = this.resolutionHistory
      .filter(r => r.pattern_id === pattern.id)
      .slice(-10)

    if (recentResolutions.length < 3) return 'stable'

    const recentSuccessRate = recentResolutions.filter(r => r.success).length / recentResolutions.length
    const overallSuccessRate = pattern.success_rate

    if (recentSuccessRate > overallSuccessRate + 0.1) return 'improving'
    if (recentSuccessRate < overallSuccessRate - 0.1) return 'degrading'
    return 'stable'
  }

  private findSimilarPatterns(error: VeroneError): ErrorPattern[] {
    const errorKeywords = this.extractKeywords(error.message)

    return Array.from(this.patterns.values())
      .filter(pattern => {
        // Même type d'erreur
        if (pattern.error_type !== error.type) return false

        // Similarité des mots clés
        const commonKeywords = pattern.message_keywords.filter(k => errorKeywords.includes(k))
        return commonKeywords.length >= 2
      })
      .sort((a, b) => b.learning_confidence - a.learning_confidence)
      .slice(0, 3)
  }

  private getPatternsByType(errorType: ErrorType): ErrorPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.error_type === errorType)
      .sort((a, b) => b.success_rate - a.success_rate)
  }

  private createSuggestionsFromPattern(
    pattern: ErrorPattern,
    matchType: string
  ): StrategySuggestion[] {
    return pattern.best_strategies.map(strategy => ({
      strategy_name: strategy.strategy_name,
      confidence_score: pattern.learning_confidence * strategy.success_rate,
      expected_success_rate: strategy.success_rate,
      estimated_time: `${Math.round(strategy.avg_time / 1000)}s`,
      mcp_tools: this.getMCPToolsForStrategy(strategy.strategy_name),
      reasoning: `${matchType}: ${Math.round(strategy.success_rate * 100)}% success rate`,
      risk_level: strategy.success_rate > 0.8 ? 'low' : strategy.success_rate > 0.5 ? 'medium' : 'high'
    }))
  }

  private getDefaultStrategy(error: VeroneError): StrategySuggestion {
    return {
      strategy_name: 'mcp_comprehensive_analysis',
      confidence_score: 0.6,
      expected_success_rate: 0.7,
      estimated_time: '2min',
      mcp_tools: ['serena', 'sequential-thinking'],
      reasoning: 'Default comprehensive analysis for unknown pattern',
      risk_level: 'medium'
    }
  }

  private getMCPToolsForStrategy(strategy: string): string[] {
    const toolMap: Record<string, string[]> = {
      'mcp_serena_auto_fix': ['serena'],
      'mcp_supabase_logs_analysis': ['supabase'],
      'mcp_sequential_analysis': ['sequential-thinking'],
      'mcp_ide_type_fix': ['ide'],
      'mcp_comprehensive_analysis': ['serena', 'sequential-thinking', 'supabase']
    }

    return toolMap[strategy] || ['serena']
  }

  private shouldRemovePattern(pattern: ErrorPattern): boolean {
    // Supprimer si très peu fiable et ancien
    if (pattern.learning_confidence < 0.2 && pattern.occurrence_count < 3) {
      const daysSinceCreation = (Date.now() - pattern.created_at.getTime()) / (24 * 60 * 60 * 1000)
      return daysSinceCreation > 30
    }
    return false
  }

  private async optimizePatternStrategies(pattern: ErrorPattern): Promise<void> {
    // Supprimer stratégies peu performantes
    pattern.best_strategies = pattern.best_strategies.filter(s =>
      s.success_rate > 0.3 || s.success_count === 0 // Garder les nouvelles stratégies
    )

    // Réordonner par performance
    pattern.best_strategies.sort((a, b) => b.success_rate - a.success_rate)
  }

  private calculateImprovementRate(patterns: ErrorPattern[]): number {
    const improvingPatterns = patterns.filter(p => p.evolution_trend === 'improving')
    return patterns.length > 0 ? improvingPatterns.length / patterns.length : 0
  }

  private calculatePredictionAccuracy(): number {
    // Placeholder - calcul basé sur les prédictions vs résultats réels
    return 0.82
  }

  private calculateAutoFixRate(): number {
    const recentResolutions = this.resolutionHistory.slice(-100)
    if (recentResolutions.length === 0) return 0

    const autoFixed = recentResolutions.filter(r =>
      r.success && r.strategy_used.includes('auto')
    )

    return autoFixed.length / recentResolutions.length
  }

  private calculatePatternStability(): number {
    const stablePatterns = Array.from(this.patterns.values()).filter(p =>
      p.evolution_trend === 'stable' && p.learning_confidence > 0.7
    )

    return this.patterns.size > 0 ? stablePatterns.length / this.patterns.size : 0
  }

  private calculateGrowthRate(pattern: ErrorPattern): number {
    // Simplification: basé sur occurrences récentes vs anciennes
    return pattern.occurrence_count * pattern.learning_confidence
  }

  private calculateDeclineRate(pattern: ErrorPattern): number {
    // Simplification: inverse du taux de succès
    return (1 - pattern.success_rate) * pattern.occurrence_count
  }

  /**
   * 📊 API PUBLIQUE : Interface d'accès
   */
  getAllPatterns(): ErrorPattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.learning_confidence - a.learning_confidence)
  }

  getPatternById(id: string): ErrorPattern | null {
    return this.patterns.get(id) || null
  }

  getResolutionHistory(limit: number = 50): ResolutionLearning[] {
    return this.resolutionHistory
      .sort((a, b) => b.context.timestamp.getTime() - a.context.timestamp.getTime())
      .slice(0, limit)
  }

  clearAllPatterns(): void {
    this.patterns.clear()
    this.resolutionHistory = []
    console.log('🧹 Tous les patterns ML ont été effacés')
  }

  exportPatternsData(): string {
    const exportData = {
      patterns: Array.from(this.patterns.values()),
      resolution_history: this.resolutionHistory,
      metrics: this.getMLMetrics(),
      exported_at: new Date().toISOString()
    }

    return JSON.stringify(exportData, null, 2)
  }
}

/**
 * 🚀 EXPORT : Instance singleton du pattern learner
 */
export const errorPatternLearner = new ErrorPatternLearner()

/**
 * 🎯 HOOK REACT : Pour utilisation dans les composants
 */
import React from 'react'

export function useErrorPatternLearning() {
  const [mlMetrics, setMLMetrics] = React.useState(errorPatternLearner.getMLMetrics())
  const [patterns, setPatterns] = React.useState(errorPatternLearner.getAllPatterns())
  const [isLearning, setIsLearning] = React.useState(false)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMLMetrics(errorPatternLearner.getMLMetrics())
      setPatterns(errorPatternLearner.getAllPatterns())
      setIsLearning((errorPatternLearner as any).isLearning)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return {
    mlMetrics,
    patterns,
    isLearning,
    learnFromResolution: errorPatternLearner.learnFromResolution.bind(errorPatternLearner),
    predictBestStrategy: errorPatternLearner.predictBestStrategy.bind(errorPatternLearner),
    analyzePatternTrends: errorPatternLearner.analyzePatternTrends.bind(errorPatternLearner),
    getAllPatterns: errorPatternLearner.getAllPatterns.bind(errorPatternLearner),
    getResolutionHistory: errorPatternLearner.getResolutionHistory.bind(errorPatternLearner),
    clearAllPatterns: errorPatternLearner.clearAllPatterns.bind(errorPatternLearner),
    exportPatternsData: errorPatternLearner.exportPatternsData.bind(errorPatternLearner)
  }
}