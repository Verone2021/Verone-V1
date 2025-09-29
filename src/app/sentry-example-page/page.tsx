"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bug, AlertTriangle, Check, Zap } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

/**
 * 🧪 Page de Test Sentry - Vérone Back Office
 *
 * Page de démonstration pour valider l'intégration Sentry
 * Permet de tester différents types d'erreurs et événements
 */
export default function SentryExamplePage() {
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()} - ${result}`])
  }

  // Test 1: Erreur JavaScript simple
  const testJavaScriptError = () => {
    try {
      addTestResult("🔥 Test erreur JavaScript...")
      // @ts-ignore - Erreur intentionnelle pour test
      undefined.someMethod()
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'javascript_error',
          component: 'sentry_test_page'
        }
      })
      addTestResult("✅ Erreur JavaScript capturée et envoyée à Sentry")
    }
  }

  // Test 2: Erreur de réseau simulée
  const testNetworkError = async () => {
    try {
      addTestResult("🌐 Test erreur réseau...")
      const response = await fetch('/api/non-existent-endpoint')
      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status}`)
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          test_type: 'network_error',
          component: 'sentry_test_page'
        }
      })
      addTestResult("✅ Erreur réseau capturée et envoyée à Sentry")
    }
  }

  // Test 3: Message personnalisé
  const testCustomMessage = () => {
    addTestResult("📝 Test message personnalisé...")
    Sentry.captureMessage('Test message depuis Vérone Back Office', {
      level: 'info',
      tags: {
        test_type: 'custom_message',
        component: 'sentry_test_page',
        organization: 'verone'
      },
      extra: {
        timestamp: new Date().toISOString(),
        user_action: 'test_sentry_integration',
        page: '/sentry-example-page'
      }
    })
    addTestResult("✅ Message personnalisé envoyé à Sentry")
  }

  // Test 4: Performance tracking
  const testPerformanceTracking = () => {
    addTestResult("⚡ Test tracking performance...")

    // Utilisation de l'API moderne Sentry v8
    Sentry.startSpan({
      name: 'test_performance_tracking',
      op: 'navigation'
    }, (span) => {
      // Simulation d'une opération longue
      setTimeout(() => {
        span?.setStatus({ code: 1, message: 'Test terminé avec succès' })
        addTestResult("✅ Transaction de performance terminée")
      }, 1000)
    })
  }

  // Test 5: Contexte utilisateur
  const testUserContext = () => {
    addTestResult("👤 Test contexte utilisateur...")
    Sentry.setUser({
      id: 'test-user-123',
      email: 'test@verone.com',
      username: 'test-verone-user'
    })

    Sentry.captureMessage('Test avec contexte utilisateur', {
      level: 'info',
      tags: {
        test_type: 'user_context',
        component: 'sentry_test_page'
      }
    })
    addTestResult("✅ Contexte utilisateur configuré et message envoyé")
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🧪 Page de Test Sentry
        </h1>
        <p className="text-gray-600">
          Testez l'intégration Sentry avec l'organisation Vérone
        </p>
        <Badge variant="outline" className="mt-2">
          Organisation: verone
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Tests d'erreurs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Bug className="h-5 w-5 mr-2 text-red-500" />
            Tests d'Erreurs
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testJavaScriptError}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Test Erreur JavaScript
            </Button>
            <Button
              onClick={testNetworkError}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Test Erreur Réseau
            </Button>
          </div>
        </div>

        {/* Tests de messages */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
            Tests de Messages
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testCustomMessage}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Message Personnalisé
            </Button>
            <Button
              onClick={testUserContext}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Contexte Utilisateur
            </Button>
          </div>
        </div>

        {/* Tests de performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-blue-500" />
            Tests de Performance
          </h2>
          <div className="space-y-3">
            <Button
              onClick={testPerformanceTracking}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Tracking Performance
            </Button>
          </div>
        </div>

        {/* Résultats */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Check className="h-5 w-5 mr-2 text-green-500" />
            Résultats des Tests
          </h2>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun test effectué</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-xs font-mono bg-gray-50 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
          {testResults.length > 0 && (
            <Button
              onClick={clearResults}
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
            >
              Effacer les résultats
            </Button>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">🔧 Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>1. Configurez votre <code>NEXT_PUBLIC_SENTRY_DSN</code> dans le fichier .env</p>
          <p>2. Exécutez les tests ci-dessus pour générer des événements</p>
          <p>3. Vérifiez dans votre dashboard Sentry (organisation: verone)</p>
          <p>4. Validez que tous les événements apparaissent correctement</p>
        </div>
      </div>
    </div>
  )
}