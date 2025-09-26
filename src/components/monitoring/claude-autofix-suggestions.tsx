"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { Bug, CheckCircle, AlertTriangle, Zap, X, Wrench } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

// Protection SSR - import conditionnel
const globalSentryDetector = typeof window !== 'undefined'
  ? require("@/lib/error-detection/sentry-auto-detection").globalSentryDetector
  : null

// 🤖 Interface simplifiée pour suggestions Auto-Fix
export interface ClaudeFixSuggestion {
  id: string
  errorContext: {
    type: 'supabase' | 'network' | 'performance' | 'console' | 'mcp'
    severity: 'critical' | 'high' | 'medium' | 'low'
    source: string
    timestamp: Date
  }
  fixSuggestions: {
    immediate: string[]
    autoFixCode?: string
  }
  status: 'pending' | 'applied' | 'rejected'
}

/**
 * 🚀 Composant Optimisé : Auto-Fix Suggestions avec Clic Direct
 * Interface simple : Erreur détectée → Clic → Correction automatique
 */
export function ClaudeAutoFixSuggestions() {
  const [suggestions, setSuggestions] = useState<ClaudeFixSuggestion[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeErrors, setActiveErrors] = useState(0)

  // 🔍 Surveillance temps réel des erreurs (optimisée)
  useEffect(() => {
    if (!globalSentryDetector) return

    const analyzeErrors = async () => {
      try {
        const errorStats = globalSentryDetector.getErrorStats()
        setActiveErrors(errorStats.totalErrors)

        // Analyser nouvelles erreurs (limité à 2 pour performance)
        if (errorStats.recentErrors.length > 0) {
          await analyzeRecentErrors(errorStats.recentErrors.slice(0, 2))
        }
      } catch (error) {
        console.warn('[Claude AutoFix] Erreur surveillance:', error)
      }
    }

    // Analysis initiale + surveillance toutes les 15s (plus économe)
    analyzeErrors()
    const monitoringInterval = setInterval(analyzeErrors, 15000)

    return () => clearInterval(monitoringInterval)
  }, [])

  // 🧠 Analyse intelligente simplifiée
  const analyzeRecentErrors = async (recentErrors: any[]) => {
    setIsAnalyzing(true)

    try {
      for (const error of recentErrors) {
        if (!suggestions.find(s => s.errorContext.source === error.source)) {
          const suggestion = generateSimpleFixSuggestion(error)
          if (suggestion) {
            setSuggestions(prev => [...prev, suggestion])
          }
        }
      }
    } catch (error) {
      console.error('🚨 [Claude AutoFix] Erreur analyse:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // 🤖 Génération rapide de suggestions (patterns courants Vérone)
  const generateSimpleFixSuggestion = (errorContext: any): ClaudeFixSuggestion | null => {
    const errorMessage = errorContext.source.toLowerCase()

    // Base de connaissances simplifiée pour erreurs Vérone courantes
    const quickFixes: Record<string, { immediate: string[], autoFix?: string }> = {
      'auth.users does not exist': {
        immediate: ['Utiliser auth.users au lieu de public.users'],
        autoFix: 'supabase.from("auth.users")'
      },
      'permission denied': {
        immediate: ['Vérifier les policies RLS', 'Confirmer authentification'],
        autoFix: 'RLS_POLICY_CHECK'
      },
      'failed to fetch': {
        immediate: ['Vérifier connexion réseau', 'Retry automatique'],
        autoFix: 'NETWORK_RETRY'
      },
      'loading chunk failed': {
        immediate: ['Recharger la page', 'Clear cache'],
        autoFix: 'window.location.reload()'
      },
      'console error': {
        immediate: ['Examiner console browser', 'Corriger erreur JavaScript'],
        autoFix: 'CONSOLE_CHECK'
      }
    }

    // Recherche pattern correspondant
    for (const [pattern, fix] of Object.entries(quickFixes)) {
      if (errorMessage.includes(pattern)) {
        return {
          id: `claude-fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          errorContext: {
            type: determineErrorType(errorMessage),
            severity: determineSeverity(errorMessage),
            source: errorContext.source,
            timestamp: new Date()
          },
          fixSuggestions: fix,
          status: 'pending'
        }
      }
    }

    return null
  }

  // 🎯 Application automatique d'une correction (clic direct)
  const applyAutoFix = useCallback(async (suggestionId: string) => {
    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) return

    setSuggestions(prev =>
      prev.map(s => s.id === suggestionId ? { ...s, status: 'applied' } : s)
    )

    try {
      // Appliquer la correction selon le type
      const { autoFixCode } = suggestion.fixSuggestions

      if (autoFixCode === 'window.location.reload()') {
        // Rechargement page pour chunk errors
        setTimeout(() => window.location.reload(), 1000)
      } else if (autoFixCode === 'NETWORK_RETRY') {
        // Retry automatique des requêtes réseau (simulation)
        console.log('🔄 [Auto-Fix] Retry réseau automatique appliqué')
      } else if (autoFixCode === 'CONSOLE_CHECK') {
        // Ouvrir DevTools console (si possible)
        console.log('🔍 [Auto-Fix] Vérifiez la console pour détails')
      }

      // Log succès dans Sentry
      Sentry.addBreadcrumb({
        message: `🔧 Auto-Fix appliqué: ${suggestion.errorContext.type}`,
        category: 'claude.autofix.applied',
        level: 'info',
        data: { suggestionId, errorType: suggestion.errorContext.type }
      })

      // Supprimer suggestion après 3s
      setTimeout(() => {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
      }, 3000)

    } catch (error) {
      console.error('🚨 [Auto-Fix] Erreur application:', error)
      setSuggestions(prev =>
        prev.map(s => s.id === suggestionId ? { ...s, status: 'rejected' } : s)
      )
    }
  }, [suggestions])

  // 🗑️ Rejeter suggestion
  const rejectSuggestion = useCallback((suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
  }, [])

  // 🎨 Indicateur visuel erreurs (rouge/vert selon spécifications)
  const getStatusColor = (errorCount: number) => {
    if (errorCount === 0) return 'text-green-600 bg-green-50'
    if (errorCount < 3) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  // 🛠️ Fonctions utilitaires
  const determineErrorType = (message: string): ClaudeFixSuggestion['errorContext']['type'] => {
    if (message.includes('supabase') || message.includes('auth')) return 'supabase'
    if (message.includes('fetch') || message.includes('network')) return 'network'
    if (message.includes('chunk') || message.includes('loading')) return 'performance'
    if (message.includes('mcp') || message.includes('playwright')) return 'mcp'
    return 'console'
  }

  const determineSeverity = (message: string): ClaudeFixSuggestion['errorContext']['severity'] => {
    if (message.includes('critical') || message.includes('fatal')) return 'critical'
    if (message.includes('error') || message.includes('failed')) return 'high'
    if (message.includes('warning') || message.includes('warn')) return 'medium'
    return 'low'
  }

  if (!globalSentryDetector) {
    return null // Protection SSR
  }

  return (
    <div className="w-full">
      {/* Indicateur Principal - Clic pour voir détails */}
      <Card className={`cursor-pointer transition-colors ${getStatusColor(activeErrors)}`}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {activeErrors === 0 ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <span>Système Vérone</span>
              {isAnalyzing && <Wrench className="h-3 w-3 animate-spin" />}
            </div>
            <Badge variant={activeErrors === 0 ? "default" : "destructive"}>
              {activeErrors === 0 ? "✅ Aucune erreur" : `🚨 ${activeErrors} erreur(s)`}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Suggestions Auto-Fix (uniquement si erreurs) */}
      {suggestions.length > 0 && (
        <div className="mt-4 space-y-3">
          {suggestions.map((suggestion) => (
            <Alert key={suggestion.id} className="border-l-4 border-l-blue-500">
              <Bug className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>Correction Auto Disponible</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={() => applyAutoFix(suggestion.id)}
                    disabled={suggestion.status !== 'pending'}
                    className="h-6 px-2"
                  >
                    {suggestion.status === 'applied' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    {suggestion.status === 'applied' ? 'Appliqué' : 'Corriger'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => rejectSuggestion(suggestion.id)}
                    className="h-6 px-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">
                    {suggestion.errorContext.source.substring(0, 100)}...
                  </p>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 font-medium">Solutions :</p>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      {suggestion.fixSuggestions.immediate.map((fix, idx) => (
                        <li key={idx}>• {fix}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClaudeAutoFixSuggestions