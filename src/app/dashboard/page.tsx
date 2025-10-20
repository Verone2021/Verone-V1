'use client'

/**
 * 🏠 Dashboard Vérone - Version Minimale Authentification-Only
 *
 * Version simplifiée sans données pour déploiement stable module par module.
 * Pas d'appel API, pas de métriques, juste un message de bienvenue.
 */

export default function DashboardV2Page() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        {/* Logo stylisé */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-black tracking-wide">
            VÉRONE
          </h1>
        </div>

        {/* Message principal */}
        <div className="space-y-3">
          <h2 className="text-2xl font-medium text-slate-900">
            Bienvenue sur le Back Office
          </h2>
          <p className="text-slate-600 text-lg">
            Version authentification • Modules en cours de déploiement
          </p>
        </div>

        {/* Informations */}
        <div className="pt-6 border-t border-slate-200 mt-8">
          <p className="text-sm text-slate-500">
            Système de gestion CRM/ERP • Décoration et mobilier d'intérieur
          </p>
        </div>
      </div>
    </div>
  )
}
