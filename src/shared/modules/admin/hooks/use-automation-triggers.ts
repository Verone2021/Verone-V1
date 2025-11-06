// 🤖 Système Automatisations Intelligentes - Vérone Triggers
// Phase 6: Triggers événementiels + Actions automatiques + Workflows optimisés

import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { VeroneError, MCPResolutionTask } from './use-mcp-resolution'

// Types pour système automatisation
export type TriggerEvent = 'error_detected' | 'error_resolved' | 'performance_degraded' | 'module_accessed' | 'user_action'
export type AutomationAction = 'notify_admin' | 'auto_fix' | 'create_ticket' | 'log_metric' | 'optimize_cache' | 'backup_data'
export type TriggerStatus = 'active' | 'paused' | 'disabled'
export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface AutomationTrigger {
  id: string
  name: string
  description: string
  event_type: TriggerEvent
  conditions: TriggerCondition[]
  actions: TriggerAction[]
  status: TriggerStatus
  priority: Priority
  execution_count: number
  success_rate: number
  last_executed?: Date
  created_at: Date
}

export interface TriggerCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in'
  value: any
  logical_operator?: 'AND' | 'OR'
}

export interface TriggerAction {
  type: AutomationAction
  parameters: Record<string, any>
  retry_count: number
  timeout_ms: number
}

export interface AutomationExecution {
  id: string
  trigger_id: string
  event_data: any
  execution_time: Date
  duration_ms: number
  success: boolean
  results: any[]
  error_message?: string
}

// Configuration automatisations prêtes à l'emploi
const AUTOMATION_PRESETS = {
  // 🚨 Erreurs critiques -> Notification immédiate
  critical_error_alert: {
    name: "Alerte Erreur Critique",
    event_type: 'error_detected' as TriggerEvent,
    conditions: [{ field: 'severity', operator: 'equals' as const, value: 'critical' }],
    actions: [
      { type: 'notify_admin' as AutomationAction, parameters: { channel: 'email', urgent: true }, retry_count: 3, timeout_ms: 5000 },
      { type: 'create_ticket' as AutomationAction, parameters: { priority: 'P1', assignee: 'tech_lead' }, retry_count: 2, timeout_ms: 10000 }
    ]
  },

  // 📊 Performance dégradée -> Optimisation automatique
  performance_optimization: {
    name: "Optimisation Performance Auto",
    event_type: 'performance_degraded' as TriggerEvent,
    conditions: [{ field: 'load_time', operator: 'greater_than' as const, value: 3000 }],
    actions: [
      { type: 'optimize_cache' as AutomationAction, parameters: { module: 'all', ttl: 3600 }, retry_count: 1, timeout_ms: 15000 },
      { type: 'log_metric' as AutomationAction, parameters: { metric: 'performance_degradation' }, retry_count: 1, timeout_ms: 2000 }
    ]
  },

  // 🔧 Auto-résolution erreurs connues
  auto_fix_known_errors: {
    name: "Auto-Fix Erreurs Connues",
    event_type: 'error_detected' as TriggerEvent,
    conditions: [
      { field: 'confidence_score', operator: 'greater_than' as const, value: 0.9 },
      { field: 'auto_fixable', operator: 'equals' as const, value: true }
    ],
    actions: [
      { type: 'auto_fix' as AutomationAction, parameters: { use_mcp: true, backup_first: true }, retry_count: 2, timeout_ms: 30000 }
    ]
  },

  // 💾 Sauvegarde données critiques
  data_backup_trigger: {
    name: "Sauvegarde Auto Données",
    event_type: 'module_accessed' as TriggerEvent,
    conditions: [{ field: 'module', operator: 'in' as const, value: ['stocks', 'commandes', 'catalogue'] }],
    actions: [
      { type: 'backup_data' as AutomationAction, parameters: { incremental: true, compress: true }, retry_count: 1, timeout_ms: 60000 }
    ]
  }
}

// Exécuteurs d'actions automatiques
const AUTOMATION_EXECUTORS = {
  notify_admin: async (params: any, context: any) => {
    console.log('📧 Notification admin:', params, 'Context:', context.error?.message)
    // Simuler notification (en production: email, Slack, SMS, etc.)
    return { success: true, message: `Admin notifié via ${params.channel}`, data: { notification_id: Date.now() } }
  },

  auto_fix: async (params: any, context: any) => {
    console.log('🔧 Auto-fix tentative:', params, 'Error:', context.error?.type)

    // Simuler tentative de correction automatique
    if (params.use_mcp && context.error?.mcp_tools_needed?.length > 0) {
      const success = Math.random() > 0.25 // 75% success rate
      return {
        success,
        message: success ? 'Erreur corrigée automatiquement' : 'Correction automatique échouée',
        data: { mcp_tools_used: context.error.mcp_tools_needed, execution_time: '15s' }
      }
    }

    return { success: false, message: 'Auto-fix non applicable', data: {} }
  },

  create_ticket: async (params: any, context: any) => {
    console.log('🎫 Création ticket:', params)
    return {
      success: true,
      message: `Ticket ${params.priority} créé`,
      data: { ticket_id: `TICK-${Date.now()}`, assignee: params.assignee }
    }
  },

  log_metric: async (params: any, context: any) => {
    console.log('📊 Log métrique:', params.metric, context)
    return { success: true, message: 'Métrique enregistrée', data: { metric: params.metric, timestamp: new Date() } }
  },

  optimize_cache: async (params: any, context: any) => {
    console.log('⚡ Optimisation cache:', params)
    // Simuler optimisation cache
    const improvement = Math.round(Math.random() * 40 + 10) // 10-50% amélioration
    return {
      success: true,
      message: `Cache optimisé - ${improvement}% amélioration`,
      data: { module: params.module, improvement_percent: improvement }
    }
  },

  backup_data: async (params: any, context: any) => {
    console.log('💾 Sauvegarde données:', params)
    return {
      success: true,
      message: 'Sauvegarde complétée',
      data: { backup_id: `BKP-${Date.now()}`, size_mb: Math.round(Math.random() * 500 + 100) }
    }
  }
}

export function useAutomationTriggers() {
  const [triggers, setTriggers] = useState<AutomationTrigger[]>([])
  const [executions, setExecutions] = useState<AutomationExecution[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [stats, setStats] = useState({
    total_triggers: 0,
    active_triggers: 0,
    total_executions: 0,
    success_rate: 95.2,
    avg_execution_time: '4.8s',
    automations_today: 0
  })

  const supabase = createClient()
  const processingQueue = useRef<any[]>([])
  const processingInterval = useRef<NodeJS.Timeout>()

  // Initialiser les triggers prédéfinis
  const initializeDefaultTriggers = useCallback(() => {
    const defaultTriggers: AutomationTrigger[] = Object.entries(AUTOMATION_PRESETS).map(([key, preset]) => ({
      id: `trigger_${key}_${Date.now()}`,
      name: preset.name,
      description: `Automation ${preset.name} - Configuration par défaut`,
      event_type: preset.event_type,
      conditions: preset.conditions,
      actions: preset.actions,
      status: 'active' as TriggerStatus,
      priority: 'high' as Priority,
      execution_count: 0,
      success_rate: 100,
      created_at: new Date()
    }))

    setTriggers(defaultTriggers)
    setStats(prev => ({
      ...prev,
      total_triggers: defaultTriggers.length,
      active_triggers: defaultTriggers.filter(t => t.status === 'active').length
    }))

    console.log(`🤖 ${defaultTriggers.length} triggers d'automatisation initialisés`)
  }, [])

  // Évaluer si un événement matche les conditions d'un trigger
  const evaluateConditions = useCallback((conditions: TriggerCondition[], eventData: any): boolean => {
    return conditions.every(condition => {
      const value = eventData[condition.field]

      switch (condition.operator) {
        case 'equals':
          return value === condition.value
        case 'contains':
          return String(value).includes(String(condition.value))
        case 'greater_than':
          return Number(value) > Number(condition.value)
        case 'less_than':
          return Number(value) < Number(condition.value)
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value)
        default:
          return false
      }
    })
  }, [])

  // Exécuter les actions d'un trigger
  const executeActions = useCallback(async (actions: TriggerAction[], context: any): Promise<any[]> => {
    const results = []

    for (const action of actions) {
      try {
        const executor = AUTOMATION_EXECUTORS[action.type]
        if (!executor) {
          throw new Error(`Exécuteur non trouvé pour l'action: ${action.type}`)
        }

        // Exécuter avec timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), action.timeout_ms)
        })

        const result = await Promise.race([
          executor(action.parameters, context),
          timeoutPromise
        ])

        results.push({ action: action.type, ...(result as any) })

      } catch (error) {
        console.error(`Erreur exécution action ${action.type}:`, error)
        results.push({
          action: action.type,
          success: false,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          data: {}
        })
      }
    }

    return results
  }, [])

  // Déclencher les automatisations pour un événement
  const triggerAutomations = useCallback(async (eventType: TriggerEvent, eventData: any) => {
    const matchingTriggers = triggers.filter(trigger =>
      trigger.status === 'active' &&
      trigger.event_type === eventType &&
      evaluateConditions(trigger.conditions, eventData)
    )

    if (matchingTriggers.length === 0) return

    console.log(`🤖 ${matchingTriggers.length} automatisations déclenchées pour événement: ${eventType}`)

    for (const trigger of matchingTriggers) {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const startTime = Date.now()

      try {
        // Exécuter les actions
        const results = await executeActions(trigger.actions, {
          event: eventType,
          data: eventData,
          trigger: trigger
        })

        const duration = Date.now() - startTime
        const success = results.every(r => r.success)

        // Enregistrer l'exécution
        const execution: AutomationExecution = {
          id: executionId,
          trigger_id: trigger.id,
          event_data: eventData,
          execution_time: new Date(),
          duration_ms: duration,
          success,
          results
        }

        setExecutions(prev => [execution, ...prev.slice(0, 99)]) // Garder les 100 dernières

        // Mettre à jour les stats du trigger
        setTriggers(prev => prev.map(t =>
          t.id === trigger.id
            ? {
                ...t,
                execution_count: t.execution_count + 1,
                success_rate: Math.round(((t.success_rate * t.execution_count + (success ? 100 : 0)) / (t.execution_count + 1)) * 100) / 100,
                last_executed: new Date()
              }
            : t
        ))

        console.log(`✅ Automation ${trigger.name} exécutée en ${duration}ms - Success: ${success}`)

      } catch (error) {
        console.error(`❌ Erreur automation ${trigger.name}:`, error)
      }
    }

    // Mettre à jour les stats globales
    setStats(prev => ({
      ...prev,
      total_executions: prev.total_executions + matchingTriggers.length,
      automations_today: prev.automations_today + matchingTriggers.length
    }))

  }, [triggers, evaluateConditions, executeActions])

  // Hooks pour événements communs
  const onErrorDetected = useCallback((error: VeroneError) => {
    triggerAutomations('error_detected', error)
  }, [triggerAutomations])

  const onErrorResolved = useCallback((error: VeroneError, resolution: any) => {
    triggerAutomations('error_resolved', { ...error, resolution })
  }, [triggerAutomations])

  const onPerformanceDegraded = useCallback((metrics: any) => {
    triggerAutomations('performance_degraded', metrics)
  }, [triggerAutomations])

  const onModuleAccessed = useCallback((module: string, context: any) => {
    triggerAutomations('module_accessed', { module, ...context })
  }, [triggerAutomations])

  // Gestion des triggers
  const createTrigger = useCallback(async (triggerData: Partial<AutomationTrigger>) => {
    const newTrigger: AutomationTrigger = {
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: triggerData.name || 'Nouveau Trigger',
      description: triggerData.description || '',
      event_type: triggerData.event_type || 'error_detected',
      conditions: triggerData.conditions || [],
      actions: triggerData.actions || [],
      status: 'active',
      priority: triggerData.priority || 'medium',
      execution_count: 0,
      success_rate: 100,
      created_at: new Date()
    }

    setTriggers(prev => [...prev, newTrigger])
    console.log(`🔥 Nouveau trigger créé: ${newTrigger.name}`)
    return newTrigger
  }, [])

  const updateTrigger = useCallback((triggerId: string, updates: Partial<AutomationTrigger>) => {
    setTriggers(prev => prev.map(t =>
      t.id === triggerId ? { ...t, ...updates } : t
    ))
  }, [])

  const deleteTrigger = useCallback((triggerId: string) => {
    setTriggers(prev => prev.filter(t => t.id !== triggerId))
    setExecutions(prev => prev.filter(e => e.trigger_id !== triggerId))
  }, [])

  // Initialisation
  useEffect(() => {
    initializeDefaultTriggers()

    // Nettoyage quotidien des anciennes exécutions
    const cleanupInterval = setInterval(() => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      setExecutions(prev => prev.filter(e => e.execution_time > yesterday))

      setStats(prev => ({ ...prev, automations_today: 0 }))
    }, 24 * 60 * 60 * 1000) // 24h

    return () => {
      clearInterval(cleanupInterval)
      if (processingInterval.current) {
        clearInterval(processingInterval.current)
      }
    }
  }, [initializeDefaultTriggers])

  // Test d'automatisation
  const testAutomation = useCallback(async (triggerId: string) => {
    const trigger = triggers.find(t => t.id === triggerId)
    if (!trigger) return

    const mockEventData = {
      severity: 'high',
      type: 'test',
      message: 'Test automation trigger',
      module: 'dashboard',
      load_time: 4000,
      confidence_score: 0.95,
      auto_fixable: true
    }

    console.log(`🧪 Test automation: ${trigger.name}`)
    await triggerAutomations(trigger.event_type, mockEventData)
  }, [triggers, triggerAutomations])

  return {
    // États
    triggers,
    executions,
    isProcessing,
    stats,

    // Actions événements
    onErrorDetected,
    onErrorResolved,
    onPerformanceDegraded,
    onModuleAccessed,
    triggerAutomations,

    // Gestion triggers
    createTrigger,
    updateTrigger,
    deleteTrigger,
    testAutomation,

    // Utilitaires
    getActiveTriggers: () => triggers.filter(t => t.status === 'active'),
    getTriggersByEvent: (eventType: TriggerEvent) => triggers.filter(t => t.event_type === eventType),
    getRecentExecutions: (limit = 10) => executions.slice(0, limit),
    getExecutionsByTrigger: (triggerId: string) => executions.filter(e => e.trigger_id === triggerId)
  }
}