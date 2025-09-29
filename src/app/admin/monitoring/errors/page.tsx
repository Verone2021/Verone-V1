/**
 * 📊 Dashboard Erreurs Sentry - Vérone Back Office
 *
 * Page hybride : Vue d'ensemble interne + Liens directs vers Sentry
 * Utilise l'API Sentry officielle pour synchronisation temps réel
 */

import { Suspense } from 'react'
import ErrorsDashboard from './errors-dashboard'
import { Shield } from 'lucide-react'

export const metadata = {
  title: 'Dashboard Erreurs - Monitoring Sentry',
  description: 'Vue d\'ensemble des erreurs et monitoring Sentry'
}

export default function ErrorsMonitoringPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Dashboard Erreurs Sentry
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitoring temps réel des erreurs front-end et back-end
          </p>
        </div>

        {/* Liens rapides Sentry */}
        <div className="flex gap-2">
          <a
            href="https://verone.sentry.io/issues/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ouvrir Sentry Issues →
          </a>
          <a
            href="https://verone.sentry.io/dashboards/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors"
          >
            Dashboards Sentry →
          </a>
        </div>
      </div>

      {/* Dashboard principal */}
      <Suspense fallback={<DashboardSkeleton />}>
        <ErrorsDashboard />
      </Suspense>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
    </div>
  )
}