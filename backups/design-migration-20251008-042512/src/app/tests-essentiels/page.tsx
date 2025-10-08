/**
 * 🚀 TESTS ESSENTIELS 2025 - Page Révolutionnaire
 *
 * Remplace tests-manuels complexe (677 tests, parser, hooks lourds...)
 * Architecture simple : 20 tests ciblés, UI minimaliste, performance optimale
 * Temps exécution : 5 minutes vs 2+ heures
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Clock, Play, AlertTriangle, Zap } from "lucide-react"

import { useCriticalTesting } from "@/hooks/use-critical-testing"
import { TestModule } from "@/lib/testing/critical-tests-2025"

export default function TestsEssentielsPage() {
  const {
    isRunning,
    currentTest,
    results,
    summary,
    lastRun,
    error,
    runCriticalTests,
    runConsoleErrorCheck,
    runPerformanceCheck,
    clearResults,
    getTestingMetrics,
    testsByModule
  } = useCriticalTesting()

  const [selectedModule, setSelectedModule] = useState<TestModule | null>(null)

  const handleRunTests = async (module?: TestModule, priorityOnly: boolean = false) => {
    // CONSOLE ERROR CHECK MANDATORY (Règle Sacrée 2025)
    const consoleCheck = await runConsoleErrorCheck()
    if (!consoleCheck?.success) {
      return // Block tests si console errors présents
    }

    await runCriticalTests(module, priorityOnly)
  }

  const metrics = getTestingMetrics()

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header Révolutionnaire */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-verone-primary">
            🚀 Tests Essentiels 2025
          </h1>
          <p className="text-verone-accent mt-2">
            {metrics.TOTAL_TESTS} tests ciblés (vs {metrics.OLD_SYSTEM_TESTS} précédemment)
          </p>
          <p className="text-sm text-verone-accent">
            ⚡ Gain temps: {metrics.TIME_SAVINGS} • Réduction tests: {metrics.REDUCTION_PERCENTAGE}%
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          RÉVOLUTION 2025
        </Badge>
      </div>

      {/* Console Error Alert (Priorité Absolue) */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>ERREURS CONSOLE DÉTECTÉES</strong> - {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Global */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Status Système Tests
          </CardTitle>
          <CardDescription>
            Tests critiques système • Console Error Checking prioritaire
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.passed}
              </div>
              <div className="text-sm text-verone-accent">Réussis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {summary.failed}
              </div>
              <div className="text-sm text-verone-accent">Échecs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {summary.pending}
              </div>
              <div className="text-sm text-verone-accent">En attente</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-verone-primary">
                {metrics.success_rate}%
              </div>
              <div className="text-sm text-verone-accent">Taux succès</div>
            </div>
          </div>

          {summary.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span>{summary.progress}%</span>
              </div>
              <Progress value={summary.progress} className="h-2" />
            </div>
          )}

          {lastRun && (
            <p className="text-sm text-verone-accent mt-4">
              Dernière exécution: {lastRun.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Console Error Check - Priorité Absolue */}
        <Card className="border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Console Error Check
            </CardTitle>
            <CardDescription className="text-sm">
              RÈGLE SACRÉE 2025 - Zero tolerance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => runConsoleErrorCheck()}
              disabled={isRunning}
              className="w-full"
              variant="destructive"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Check Console Errors
            </Button>
          </CardContent>
        </Card>

        {/* Tests Critiques Seulement */}
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              Tests Critiques
            </CardTitle>
            <CardDescription className="text-sm">
              Tests bloquants uniquement (priorité critical)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleRunTests(undefined, true)}
              disabled={isRunning}
              className="w-full"
              variant="outline"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Critical Only
            </Button>
          </CardContent>
        </Card>

        {/* Tous Tests Essentiels */}
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Tous Tests Essentiels
            </CardTitle>
            <CardDescription className="text-sm">
              {metrics.TOTAL_TESTS} tests • ~{metrics.ESTIMATED_EXECUTION_TIME}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => handleRunTests()}
              disabled={isRunning}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Run All Tests
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tests par Module */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tests par Module</CardTitle>
          <CardDescription>
            Tests ciblés par fonctionnalité critique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(testsByModule).map(([module, tests]) => (
              <div key={module} className="space-y-2">
                <h3 className="font-semibold capitalize flex items-center gap-2">
                  {module === 'dashboard' && '🏠'}
                  {module === 'catalogue' && '📚'}
                  {module === 'stocks' && '📦'}
                  {module === 'commandes' && '📋'}
                  {module} ({tests.length})
                </h3>
                <Button
                  onClick={() => handleRunTests(module as TestModule)}
                  disabled={isRunning}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Play className="h-3 w-3 mr-2" />
                  Test {module}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test en Cours */}
      {currentTest && (
        <Card className="mb-6 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Test en Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="font-medium">{currentTest.title}</div>
              <div className="text-sm text-verone-accent">
                {currentTest.description}
              </div>
              <Badge variant="outline">
                {currentTest.module} • {currentTest.priority}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Résultats */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Résultats Tests</CardTitle>
              <CardDescription>
                Détails des {results.length} tests exécutés
              </CardDescription>
            </div>
            <Button
              onClick={clearResults}
              variant="ghost"
              size="sm"
            >
              Effacer
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <div
                  key={result.test_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'passed' && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    {result.status === 'failed' && (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    {result.status === 'pending' && (
                      <Clock className="h-4 w-4 text-gray-400" />
                    )}

                    <div>
                      <div className="font-medium text-sm">
                        {result.test_id.replace(/^.*_\d+_/, '').replace(/_/g, ' ')}
                      </div>
                      {result.error_message && (
                        <div className="text-xs text-red-600 mt-1">
                          {result.error_message}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    {result.duration_ms && (
                      <div className="text-verone-accent">
                        {result.duration_ms}ms
                      </div>
                    )}
                    <Badge
                      variant={
                        result.status === 'passed' ? 'default' :
                        result.status === 'failed' ? 'destructive' : 'outline'
                      }
                      className="text-xs"
                    >
                      {result.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revolution Message */}
      <div className="mt-8 text-center text-sm text-verone-accent">
        <p>
          🎉 <strong>Révolution Testing 2025</strong> •
          De 677 tests "usine à gaz" vers {metrics.TOTAL_TESTS} tests ciblés •
          Gain {metrics.TIME_SAVINGS} temps d'exécution
        </p>
      </div>
    </div>
  )
}