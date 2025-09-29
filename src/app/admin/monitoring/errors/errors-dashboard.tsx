'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Bug, Clock, ExternalLink, RefreshCw, Users } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SentryIssue {
  id: string
  shortId: string
  title: string
  level: string
  status: string
  culprit?: string
  permalink: string
  lastSeen: string
  count: number
  userCount: number
}

interface ErrorStats {
  totalIssues: number
  unresolvedCount: number
  criticalCount: number
  affectedUsers: number
}

export default function ErrorsDashboard() {
  const [issues, setIssues] = useState<SentryIssue[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monitoring/sentry-issues')
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }
      const data = await response.json()
      setIssues(data.issues || [])
      setStats(data.stats || null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIssues || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non Résolues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.unresolvedCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critiques</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.criticalCount || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Affectés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.affectedUsers || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des erreurs */}
      <Card>
        <CardHeader>
          <CardTitle>Issues Sentry ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <p>Aucune issue trouvée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {issues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{issue.level}</Badge>
                      <Badge variant={issue.status === 'unresolved' ? 'destructive' : 'secondary'}>
                        {issue.status}
                      </Badge>
                    </div>
                    <a
                      href={issue.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>

                  <h3 className="font-medium mb-1">{issue.title}</h3>
                  {issue.culprit && (
                    <p className="text-sm text-gray-600 mb-2">{issue.culprit}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{issue.count} occurrences</span>
                    <span>{issue.userCount} utilisateurs</span>
                    <span>
                      <Clock className="h-3 w-3 inline mr-1" />
                      {format(new Date(issue.lastSeen), 'dd/MM/yyyy HH:mm', { locale: fr })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}