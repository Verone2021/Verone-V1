"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  PlayCircle,
  X,
  RotateCcw
} from "lucide-react"
import { useManualTests } from "@/hooks/use-manual-tests"
import * as Sentry from "@sentry/nextjs"
import { mcpPlaywright, MCPTestContext, MCPTestResult } from "@/lib/mcp/playwright-integration"
import { ClaudeAutoFixSuggestions } from "@/components/monitoring/claude-autofix-suggestions"

// 🎯 SENTRY ALREADY INITIALIZED GLOBALLY - Just use it!
// Note: Sentry is already initialized in sentry.client.config.ts


export default function TestsManuelsComplete() {
  const {
    sections,
    globalMetrics,
    getSectionMetrics,
    updateTestStatus,
    loading,
    error
  } = useManualTests({
    enablePagination: false // Désactiver la pagination pour voir tous les 11 modules
  })

  // État local pour la gestion de l'interface
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("dashboard")
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  // 🚀 État pour tests automatiques et erreurs
  const [isAutoTesting, setIsAutoTesting] = useState(false)
  const [testErrors, setTestErrors] = useState<Array<{id: string, error: string, timestamp: Date}>>([])
  const [currentAutoTest, setCurrentAutoTest] = useState<string | null>(null)


  // Filtrage des tests selon la recherche et le statut
  const getFilteredTests = (sectionTests: any[]) => {
    return sectionTests.filter(test => {
      const matchesSearch = searchTerm === "" ||
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.description.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = selectedStatus === "all" || test.status === selectedStatus

      return matchesSearch && matchesStatus
    })
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // 🚀 RÉVOLUTIONNAIRE: TEST AUTOMATIQUE avec VRAIE Intégration MCP Playwright
  const runAutoTest = useCallback(async (test: any) => {
    setIsAutoTesting(true)
    setCurrentAutoTest(test.id)

    try {
      console.log(`🤖 [MCP] Démarrage test automatique RÉEL: ${test.title}`)

      // 🎯 Configuration du contexte de test MCP
      const testContext: MCPTestContext = {
        testId: test.id,
        testTitle: test.title,
        testDescription: test.description || '',
        expectedElements: getExpectedElementsForTest(test),
        successCriteria: getSuccessCriteriaForTest(test),
        moduleType: determineModuleType(test)
      }

      // 🚀 RÉVOLUTIONNAIRE: Exécution avec VRAIE bibliothèque MCP Playwright
      const mcpResult: MCPTestResult = await mcpPlaywright.executeTest(testContext)

      // 📊 Traitement des résultats MCP
      if (mcpResult.success) {
        console.log(`✅ [MCP] Test réussi en ${mcpResult.duration}ms`)

        await updateTestStatus(test.id, 'completed')

        // Log succès détaillé dans Sentry avec métriques MCP réelles
        Sentry.addBreadcrumb({
          message: `✅ MCP Test automatique réussi: ${test.title}`,
          category: 'test.mcp.success',
          level: 'info',
          data: {
            testId: test.id,
            duration: mcpResult.duration,
            moduleType: testContext.moduleType,
            performance: mcpResult.performance,
            screenshots: mcpResult.screenshots.length,
            consoleErrors: mcpResult.consoleErrors.length,
            networkErrors: mcpResult.networkErrors.length
          }
        })

      } else {
        console.warn(`⚠️ [MCP] Test échoué: ${mcpResult.errors.join(', ')}`)

        await updateTestStatus(test.id, 'failed')

        // Ajouter les erreurs MCP à la liste
        mcpResult.errors.forEach(error => {
          setTestErrors(prev => [...prev, {
            id: test.id,
            error: error,
            timestamp: new Date(),
            mcpResult: mcpResult
          }])
        })

        // Capturer échec dans Sentry avec détails MCP
        if (mcpResult.sentryEventId) {
          Sentry.addBreadcrumb({
            message: `❌ MCP Test échoué: ${test.title}`,
            category: 'test.mcp.failure',
            level: 'error',
            data: {
              testId: test.id,
              errors: mcpResult.errors,
              warnings: mcpResult.warnings,
              duration: mcpResult.duration,
              sentryEventId: mcpResult.sentryEventId
            }
          })
        }
      }

      // 📈 Mise à jour des métriques console si erreurs détectées
      if (mcpResult.consoleErrors.length > 0) {
        console.warn(`🔍 [MCP] ${mcpResult.consoleErrors.length} erreurs console détectées:`, mcpResult.consoleErrors)
      }

    } catch (error) {
      console.error('🚨 [MCP] Erreur critique lors du test:', error)

      // Capturer erreur critique avec contexte maximum pour Sentry
      const sentryEventId = Sentry.captureException(error, {
        tags: {
          test_id: test.id,
          test_title: test.title,
          auto_test: 'mcp.playwright.real',
          error_type: 'mcp_execution_failure'
        },
        level: 'error',
        contexts: {
          test: {
            id: test.id,
            title: test.title,
            timestamp: new Date().toISOString()
          },
          mcp: {
            integration_version: '1.0.0',
            execution_mode: 'real'
          }
        }
      })

      // Ajouter à la liste des erreurs avec contexte Sentry
      setTestErrors(prev => [...prev, {
        id: test.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        sentryEventId,
        critical: true
      }])

      await updateTestStatus(test.id, 'failed')
    } finally {
      setIsAutoTesting(false)
      setCurrentAutoTest(null)
    }
  }, [updateTestStatus])

  // 🎯 Fonctions utilitaires pour configuration des tests MCP
  const getExpectedElementsForTest = (test: any): string[] => {
    const title = test.title.toLowerCase()

    if (title.includes('dashboard')) {
      return ['[data-testid="metrics-card"]', '.dashboard-stats', '[data-testid="chart-container"]']
    } else if (title.includes('catalogue')) {
      return ['.product-grid', '.product-card', '[data-testid="product-list"]']
    } else if (title.includes('stock')) {
      return ['.stock-table', '[data-testid="stock-item"]', '.inventory-summary']
    } else if (title.includes('navigation')) {
      return ['nav', '.sidebar', '.app-header']
    }

    return ['body', 'main', '.content']
  }

  const getSuccessCriteriaForTest = (test: any): string[] => {
    return [
      'Page charge sans erreur 404/500',
      'Éléments principaux visibles',
      'Aucune erreur console critique',
      'Performance acceptable (<3s)'
    ]
  }

  const determineModuleType = (test: any): MCPTestContext['moduleType'] => {
    const title = test.title.toLowerCase()

    if (title.includes('dashboard')) return 'dashboard'
    if (title.includes('catalogue')) return 'catalogue'
    if (title.includes('stock')) return 'stock'
    if (title.includes('navigation')) return 'navigation'

    return 'generic'
  }

  // ✅ NETTOYAGE COMPLET: Anciennes simulations supprimées - Utilisation MCP Playwright réelle uniquement

  // 🧹 Nettoyer une erreur
  const clearError = useCallback((errorId: string) => {
    setTestErrors(prev => prev.filter(e => e.id !== errorId))
  }, [])

  // 🧹 Nettoyer toutes les erreurs
  const clearAllErrors = useCallback(() => {
    setTestErrors([])
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Affichage état de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <PlayCircle className="h-8 w-8 animate-spin mx-auto mb-4 text-black" />
          <p className="text-lg font-medium text-black">🚀 Chargement MCP Playwright Integration...</p>
          <p className="text-sm text-gray-600 mt-2">Initialisation des 677 tests sur 11 modules avec système automatique</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-black">Tests Manuels Vérone - Complets</h1>
              <p className="text-gray-600 mt-1">
                Interface complète pour gérer les {globalMetrics.total} tests manuels sur 11 modules + workflows
              </p>
            </div>
            <div className="flex gap-3">
              {/* 🚀 RÉVOLUTIONNAIRE: Interface simplifiée - Plus de boutons inutiles */}
              <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                ✅ Interface optimisée 2025 - Sentry Report disponible dans le header global
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Métriques globales */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{globalMetrics.total}</p>
                  <p className="text-sm text-gray-600">Tests Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{globalMetrics.completed}</p>
                  <p className="text-sm text-gray-600">Validés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-600">{globalMetrics.pending}</p>
                  <p className="text-sm text-gray-600">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{globalMetrics.failed}</p>
                  <p className="text-sm text-gray-600">Échoués</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {globalMetrics.progressPercent}%
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-black">{globalMetrics.progressPercent}%</p>
                  <p className="text-sm text-gray-600">Progression</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-300"
                      style={{ width: `${globalMetrics.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🚀 RÉVOLUTIONNAIRE: Claude Auto-Fix Monitor avec Suggestions Intelligentes */}
        <div className="mb-6">
          <ClaudeAutoFixSuggestions />
        </div>

        {/* Zone d'erreurs de test legacy (conservée pour compatibilité) */}
        {testErrors.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertTitle className="text-orange-800">
              {testErrors.length} erreur(s) de test détectée(s)
            </AlertTitle>
            <AlertDescription>
              <div className="mt-3 space-y-2">
                {testErrors.slice(0, 3).map((error, idx) => (
                  <div key={idx} className="flex items-start justify-between p-2 bg-white rounded border border-orange-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-800">{error.error}</p>
                      <p className="text-xs text-gray-600">
                        Test ID: {error.id} • {error.timestamp.toLocaleTimeString()}
                        {error.critical && <span className="ml-2 text-red-600 font-bold">CRITIQUE</span>}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => clearError(error.id)}
                      className="ml-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {testErrors.length > 3 && (
                  <p className="text-sm text-gray-600 text-center py-2">
                    ... et {testErrors.length - 3} autres erreurs (consultez Claude Auto-Fix pour l'analyse complète)
                  </p>
                )}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAllErrors}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  Effacer erreurs de test
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Contrôles de recherche et filtrage */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="completed">Validés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="failed">Échoués</SelectItem>
              <SelectItem value="warning">Attention</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setSelectedStatus("all")
            }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Interface principale avec onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 lg:grid-cols-12 mb-6">
            {sections.map((section) => (
              <TabsTrigger
                key={section.id}
                value={section.id}
                className="text-xs data-[state=active]:bg-black data-[state=active]:text-white"
              >
                <span className="mr-1">{section.icon}</span>
                <span className="hidden sm:inline">{section.title.split(' ')[1] || section.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {sections.map((section) => {
            const filteredTests = getFilteredTests(section.tests)
            const sectionMetrics = getSectionMetrics(section.id)

            return (
              <TabsContent key={section.id} value={section.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <span className="text-2xl">{section.icon}</span>
                          {section.title}
                        </CardTitle>
                        <p className="text-gray-600 mt-1">{section.description}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-black">
                            {sectionMetrics.completed}/{sectionMetrics.total}
                          </p>
                          <p className="text-sm text-gray-600">
                            {sectionMetrics.progressPercent}% validé
                          </p>
                        </div>

                        <div className="w-16 h-16 relative">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              d="m18,2.0845a 15.9155,15.9155 0 0,1 0,31.831a 15.9155,15.9155 0 0,1 0,-31.831"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="2"
                            />
                            <path
                              d="m18,2.0845a 15.9155,15.9155 0 0,1 0,31.831a 15.9155,15.9155 0 0,1 0,-31.831"
                              fill="none"
                              stroke="#000000"
                              strokeWidth="2"
                              strokeDasharray={`${sectionMetrics.progressPercent}, 100`}
                              className="transition-all duration-500"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-semibold text-black">
                              {sectionMetrics.progressPercent}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      {filteredTests.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucun test trouvé pour les critères sélectionnés</p>
                        </div>
                      ) : (
                        filteredTests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {getStatusIcon(test.status)}
                              <Badge
                                variant="outline"
                                className={getStatusColor(test.status)}
                              >
                                {test.status}
                              </Badge>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-black truncate">{test.title}</h4>
                              <p className="text-sm text-gray-600 truncate">{test.description}</p>
                            </div>

                            <div className="flex gap-2">
                              {/* 🚀 RÉVOLUTIONNAIRE: Validation automatique via Sentry uniquement */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => runAutoTest(test)}
                                disabled={isAutoTesting}
                                className="gap-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <PlayCircle className={`h-3 w-3 ${currentAutoTest === test.id ? 'animate-spin' : ''}`} />
                                {currentAutoTest === test.id ? 'Testing...' : 'Auto Test'}
                              </Button>

                              {/* Status automatique - Pas de boutons manuels */}
                              <div className="text-xs text-gray-500 px-2 py-1 bg-gray-50 rounded">
                                {test.status === 'completed' ? '✅ Auto-validé' :
                                 test.status === 'failed' ? '❌ Sentry détecté' :
                                 '⏳ En attente'}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {filteredTests.length > 0 && (
                      <div className="mt-6 text-center text-sm text-gray-500">
                        {filteredTests.length} test(s) affiché(s) sur {section.tests.length} total
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )
          })}
        </Tabs>
      </div>
    </div>
  )
}