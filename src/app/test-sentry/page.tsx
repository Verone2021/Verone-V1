/**
 * 🧪 Page de Test Sentry - Validation Intégration
 *
 * Cette page permet de tester l'intégration Sentry
 * et de vérifier que les erreurs sont bien capturées
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as Sentry from '@sentry/nextjs'
import {
  Bug,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Send,
  Zap,
  Database,
  Globe,
  Code,
  RefreshCw
} from 'lucide-react'

export default function TestSentryPage() {
  const [testResults, setTestResults] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<string | null>(null)

  // Test 1: Erreur JavaScript Client
  const testClientError = () => {
    setLoading('client')
    try {
      // Générer une erreur volontaire
      throw new Error('🧪 [TEST] Erreur Client JavaScript - ' + new Date().toISOString())
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'client_error',
          source: 'test_page',
          verone_module: 'test_sentry'
        }
      })
      setTestResults(prev => ({ ...prev, client: true }))
    } finally {
      setLoading(null)
    }
  }

  // Test 2: Message Warning
  const testWarningMessage = () => {
    setLoading('warning')
    Sentry.captureMessage('⚠️ [TEST] Message Warning - ' + new Date().toISOString(), 'warning')
    setTestResults(prev => ({ ...prev, warning: true }))
    setLoading(null)
  }

  // Test 3: Erreur Critique
  const testCriticalError = () => {
    setLoading('critical')
    Sentry.captureException(new Error('🔴 [TEST] Erreur Critique Système'), {
      level: 'fatal',
      tags: {
        test_type: 'critical_error',
        priority: 'high'
      }
    })
    setTestResults(prev => ({ ...prev, critical: true }))
    setLoading(null)
  }

  // Test 4: Erreur API via Route Handler
  const testApiError = async () => {
    setLoading('api')
    try {
      const response = await fetch('/api/test-sentry-error')
      const data = await response.json()
      setTestResults(prev => ({ ...prev, api: data.success }))
    } catch (error) {
      console.error('Erreur test API:', error)
    } finally {
      setLoading(null)
    }
  }

  // Test 5: Performance Monitoring
  const testPerformance = () => {
    setLoading('performance')

    // Utiliser les méthodes de performance disponibles dans Next.js
    Sentry.captureMessage('📊 [TEST] Performance Transaction Simulée', {
      level: 'info',
      tags: {
        test_type: 'performance',
        duration_ms: 1000,
        operation: 'test_transaction'
      },
      extra: {
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 1000).toISOString()
      }
    })

    setTimeout(() => {
      setTestResults(prev => ({ ...prev, performance: true }))
      setLoading(null)
    }, 1000)
  }

  // Test 6: User Context
  const testUserContext = () => {
    setLoading('user')
    Sentry.setUser({
      id: 'test-user-001',
      email: 'test@verone.fr',
      username: 'TestVérone'
    })
    Sentry.captureMessage('📧 [TEST] Test avec contexte utilisateur', 'info')
    setTestResults(prev => ({ ...prev, user: true }))
    setLoading(null)
  }

  // Réinitialiser localStorage
  const resetErrorCount = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentry-error-count', '0')
      window.location.reload()
    }
  }

  const allTestsPassed = Object.keys(testResults).length === 6 &&
                         Object.values(testResults).every(v => v === true)

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Page de Test Sentry</h1>
        <p className="text-muted-foreground">
          Validation de l'intégration et de la capture des erreurs
        </p>
      </div>

      {/* Instructions */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cette page génère volontairement des erreurs pour tester Sentry.
          Vérifiez ensuite dans le dashboard que les erreurs sont bien capturées.
        </AlertDescription>
      </Alert>

      {/* Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Test 1: Client Error */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Erreur JavaScript Client
            </CardTitle>
            <CardDescription>
              Génère une exception JavaScript côté client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testClientError}
              disabled={loading === 'client'}
              className="w-full"
            >
              {loading === 'client' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testResults.client ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Générer Erreur Client
            </Button>
          </CardContent>
        </Card>

        {/* Test 2: Warning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Message Warning
            </CardTitle>
            <CardDescription>
              Envoie un message de niveau warning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testWarningMessage}
              disabled={loading === 'warning'}
              className="w-full"
              variant="outline"
            >
              {loading === 'warning' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testResults.warning ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer Warning
            </Button>
          </CardContent>
        </Card>

        {/* Test 3: Critical */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Erreur Critique
            </CardTitle>
            <CardDescription>
              Simule une erreur système critique (fatal)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testCriticalError}
              disabled={loading === 'critical'}
              className="w-full"
              variant="destructive"
            >
              {loading === 'critical' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testResults.critical ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Déclencher Erreur Critique
            </Button>
          </CardContent>
        </Card>

        {/* Test 4: API Error */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Erreur API Server
            </CardTitle>
            <CardDescription>
              Teste la capture d'erreur côté serveur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testApiError}
              disabled={loading === 'api'}
              className="w-full"
              variant="secondary"
            >
              {loading === 'api' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testResults.api ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Tester Route API
            </Button>
          </CardContent>
        </Card>

        {/* Test 5: Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Transaction Performance
            </CardTitle>
            <CardDescription>
              Crée une transaction de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testPerformance}
              disabled={loading === 'performance'}
              className="w-full"
              variant="outline"
            >
              {loading === 'performance' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testResults.performance ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Code className="h-4 w-4 mr-2" />
              )}
              Mesurer Performance
            </Button>
          </CardContent>
        </Card>

        {/* Test 6: User Context */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Contexte Utilisateur
            </CardTitle>
            <CardDescription>
              Ajoute un contexte utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={testUserContext}
              disabled={loading === 'user'}
              className="w-full"
              variant="outline"
            >
              {loading === 'user' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testResults.user ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Définir Utilisateur
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Résultats */}
      {allTestsPassed && (
        <Alert className="mb-6 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700">
            ✅ Tous les tests ont été exécutés avec succès !
            Vérifiez maintenant dans le dashboard Sentry et le dashboard interne.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          onClick={() => window.open('/admin/monitoring/errors', '_blank')}
          className="flex-1"
        >
          Ouvrir Dashboard Interne
        </Button>
        <Button
          onClick={() => window.open('https://verone.sentry.io/issues/', '_blank')}
          variant="outline"
          className="flex-1"
        >
          Ouvrir Sentry Issues
        </Button>
        <Button
          onClick={resetErrorCount}
          variant="secondary"
        >
          Réinitialiser Compteur
        </Button>
      </div>
    </div>
  )
}