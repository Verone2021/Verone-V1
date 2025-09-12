'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  analyzeSupabaseAuthState, 
  clearSupabaseCache, 
  diagnoseSupabaseIssues, 
  runSupabaseHealthCheck 
} from '@/lib/utils/supabase-debug'
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2, Stethoscope } from 'lucide-react'

interface SupabaseDebugPanelProps {
  show?: boolean
}

/**
 * Panneau de debugging pour Supabase - visible uniquement en développement
 */
export function SupabaseDebugPanel({ show = process.env.NODE_ENV === 'development' }: SupabaseDebugPanelProps) {
  const [authState, setAuthState] = useState<any>(null)
  const [issues, setIssues] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fonction pour rafraîchir les données de diagnostic
  const refreshDiagnostic = async () => {
    setIsLoading(true)
    try {
      const newAuthState = analyzeSupabaseAuthState()
      const newIssues = diagnoseSupabaseIssues()
      
      setAuthState(newAuthState)
      setIssues(newIssues)
      setLastUpdated(new Date().toLocaleTimeString('fr-FR'))
    } catch (error) {
      console.error('Erreur diagnostic Supabase:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh au montage
  useEffect(() => {
    if (show) {
      refreshDiagnostic()
    }
  }, [show])

  // Fonction pour nettoyer le cache
  const handleClearCache = () => {
    clearSupabaseCache()
    refreshDiagnostic()
  }

  // Fonction pour exécuter le health check complet
  const handleHealthCheck = () => {
    runSupabaseHealthCheck()
    refreshDiagnostic()
  }

  if (!show) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            Debug Supabase
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={refreshDiagnostic}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant={issues.length === 0 ? 'default' : 'destructive'} className="text-xs">
              {issues.length === 0 ? 'OK' : `${issues.length} issues`}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-xs">
          {lastUpdated && `Dernière mise à jour: ${lastUpdated}`}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* État d'authentification */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">État Auth</h4>
          {authState ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Token:</span>
                <Badge variant={authState.token ? 'default' : 'secondary'} className="text-xs">
                  {authState.token ? 'Présent' : 'Absent'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Expiré:</span>
                <Badge variant={authState.isExpired ? 'destructive' : 'default'} className="text-xs">
                  {authState.isExpired ? 'Oui' : 'Non'}
                </Badge>
              </div>
              {authState.error && (
                <Alert className="py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{authState.error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs">Chargement...</Badge>
          )}
        </div>

        {/* Issues détectées */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">Problèmes Détectés</h4>
            <div className="space-y-1">
              {issues.map((issue, index) => (
                <Alert key={index} className="py-2">
                  <AlertTriangle className="h-3 w-3" />
                  <AlertDescription className="text-xs">{issue}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Pas de problèmes */}
        {issues.length === 0 && authState && (
          <Alert className="py-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <AlertDescription className="text-xs text-green-800">
              Aucun problème détecté
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearCache}
            className="text-xs"
          >
            <Trash2 className="h-3 w-3 mr-2" />
            Nettoyer Cache
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleHealthCheck}
            className="text-xs"
          >
            <Stethoscope className="h-3 w-3 mr-2" />
            Health Check Complet
          </Button>
        </div>

        {/* Variables d'environnement */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Config</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>URL:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'default' : 'destructive'} className="text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Key:</span>
              <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'default' : 'destructive'} className="text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Online:</span>
              <Badge variant={typeof window !== 'undefined' && navigator.onLine ? 'default' : 'destructive'} className="text-xs">
                {typeof window !== 'undefined' && navigator.onLine ? 'Oui' : 'Non'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}