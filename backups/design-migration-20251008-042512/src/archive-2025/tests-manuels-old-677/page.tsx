"use client"

import React, { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  PlayCircle,
  RotateCcw,
  Activity
} from "lucide-react"
import { useManualTests } from "@/hooks/use-manual-tests"
import { useTestPersistence } from "@/hooks/use-test-persistence"
import * as Sentry from "@sentry/nextjs"
import { mcpPlaywright, MCPTestContext } from "@/lib/mcp/playwright-integration"
import { ClaudeAutoFixSuggestions } from "@/components/monitoring/claude-autofix-suggestions"

// 🎯 Interface Tests Manuels Simplifiée avec Intégration Sentry MCP 2025
export default function TestsManuelsComplete() {
  // Hooks principaux (conservés)
  const {
    sections,
    globalMetrics,
    updateTestStatus,
    loading,
    error
  } = useManualTests({ enablePagination: false })

  const {
    executeTestWithValidation,
    isTestLocked,
    getTestStatus
  } = useTestPersistence()

  // État local simplifié
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("monitoring")
  const [isAutoTesting, setIsAutoTesting] = useState(false)
  const [currentAutoTest, setCurrentAutoTest] = useState<string | null>(null)

  // 🎯 Test automatique simplifié avec focus Sentry MCP
  const runQuickTest = useCallback(async (test: any) => {
    if (isTestLocked(test.id)) {
      console.log(`🔒 Test ${test.id} verrouillé - validation déjà effectuée`)
      return
    }

    setIsAutoTesting(true)
    setCurrentAutoTest(test.id)

    try {
      console.log(`🚀 [MCP] Test rapide: ${test.title}`)

      // Exécution avec MCP Playwright simplifié
      const result = await executeTestWithValidation(test.id, async () => {
        const testContext: MCPTestContext = {
          testId: test.id,
          testTitle: test.title,
          expectedElements: [],
          moduleType: determineModuleType(test)
        }

        const mcpResult = await mcpPlaywright.executeTest(testContext)

        return {
          success: mcpResult.success,
          execution_time_ms: mcpResult.duration,
          console_errors: mcpResult.consoleErrors,
          performance_metrics: mcpResult.performance
        }
      })

      if (result.success) {
        console.log(`✅ [Test OK] ${test.title} - ${result.execution_time_ms}ms`)
        await updateTestStatus(test.id, 'completed')

        Sentry.addBreadcrumb({
          message: `✅ Test réussi: ${test.title}`,
          category: 'test.success',
          level: 'info',
          data: { testId: test.id, duration: result.execution_time_ms }
        })
      } else {
        console.warn(`❌ [Test KO] ${test.title}: ${result.error}`)
        await updateTestStatus(test.id, 'failed')
      }

    } catch (error) {
      console.error('🚨 [Test Error]:', error)
      Sentry.captureException(error, {
        tags: { test_id: test.id, auto_test: 'simplified' }
      })
    } finally {
      setIsAutoTesting(false)
      setCurrentAutoTest(null)
    }
  }, [executeTestWithValidation, isTestLocked, updateTestStatus])

  // 🔄 Test tous les modules critiques
  const runCriticalTests = useCallback(async () => {
    const criticalModules = ['dashboard', 'catalogue', 'stock']
    setIsAutoTesting(true)

    try {
      for (const moduleId of criticalModules) {
        const moduleSection = sections.find(s => s.id === moduleId)
        if (moduleSection?.tests.length > 0) {
          const firstTest = moduleSection.tests[0]
          await runQuickTest(firstTest)
          // Pause entre tests
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } finally {
      setIsAutoTesting(false)
    }
  }, [sections, runQuickTest])

  // Filtrage simplifié des tests
  const getFilteredTests = (sectionTests: any[]) => {
    return sectionTests.filter(test => {
      const matchesSearch = searchTerm === "" ||
        test.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = selectedStatus === "all" || test.status === selectedStatus
      return matchesSearch && matchesStatus
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const determineModuleType = (test: any) => {
    const moduleId = test.id?.substring(0, test.id.indexOf('-'))
    switch (moduleId) {
      case 'dashboard': return 'dashboard'
      case 'catalogue': return 'catalogue'
      case 'stock': return 'stock'
      default: return 'generic'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RotateCcw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p>Chargement des tests...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Erreur: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header avec actions globales */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tests Manuels - Vérone</h1>
          <p className="text-sm text-gray-600 mt-1">
            Monitoring automatique avec Sentry MCP • {sections.length} modules
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={runCriticalTests}
            disabled={isAutoTesting}
            size="sm"
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            {isAutoTesting ? 'Tests en cours...' : 'Tests Critiques'}
          </Button>
        </div>
      </div>

      {/* Composant Sentry MCP Principal */}
      <ClaudeAutoFixSuggestions />

      {/* Onglets interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monitoring">🎯 Monitoring Auto</TabsTrigger>
          <TabsTrigger value="manual">🔧 Tests Manuels</TabsTrigger>
          <TabsTrigger value="metrics">📊 Métriques</TabsTrigger>
        </TabsList>

        {/* Tab Monitoring - Focus Sentry */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🚀 Monitoring Temps Réel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Le système Sentry MCP surveille automatiquement les erreurs console et propose des corrections en temps réel.
                Consultez l'indicateur ci-dessus pour l'état actuel.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-800">Auto-Détection</p>
                        <p className="text-xs text-green-600">Surveillance 24/7</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-800">Auto-Correction</p>
                        <p className="text-xs text-blue-600">Clic pour appliquer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-purple-800">Logs Sentry</p>
                        <p className="text-xs text-purple-600">Traçabilité complète</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Tests Manuels - Simplifié */}
        <TabsContent value="manual" className="space-y-4">
          {/* Filtres */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher tests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="completed">Terminés</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des modules (Version condensée) */}
          <div className="grid gap-4">
            {sections.slice(0, 6).map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {section.name}
                      <Badge variant="outline" className="ml-2">
                        {getFilteredTests(section.tests).length} tests
                      </Badge>
                    </CardTitle>
                    {section.tests.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => runQuickTest(section.tests[0])}
                        disabled={isAutoTesting}
                      >
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Test Rapide
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex gap-2 flex-wrap">
                    {getFilteredTests(section.tests).slice(0, 3).map((test) => (
                      <div key={test.id} className="flex items-center gap-1 text-xs">
                        {getStatusIcon(test.status)}
                        <span className="truncate max-w-[200px]">{test.title}</span>
                        {isTestLocked(test.id) && <Badge variant="secondary" className="text-xs">Verrouillé</Badge>}
                      </div>
                    ))}
                    {getFilteredTests(section.tests).length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{getFilteredTests(section.tests).length - 3} autres...
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab Métriques - Simplifié */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{globalMetrics.completed}</p>
                  <p className="text-xs text-gray-600">Tests Réussis</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{globalMetrics.failed}</p>
                  <p className="text-xs text-gray-600">Tests Échoués</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{globalMetrics.total}</p>
                  <p className="text-xs text-gray-600">Total Tests</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round((globalMetrics.completed / globalMetrics.total) * 100) || 0}%
                  </p>
                  <p className="text-xs text-gray-600">Progression</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}