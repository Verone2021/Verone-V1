"use client"

import { Bell, Search, User, LogOut, Settings, Users, Bug, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "../../lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Badge } from "../ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import * as Sentry from "@sentry/nextjs"
// Import conditionnel Sentry - CLIENT ONLY
import type { SentryAutoDetector } from "@/lib/error-detection/sentry-auto-detection"
// 🔔 Hook notifications intelligent
import { useNotifications } from "../../hooks/use-notifications"

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [sentryErrors, setSentryErrors] = useState<number>(0)
  const [sentryStatus, setSentryStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy')
  const [sentryDetector, setSentryDetector] = useState<SentryAutoDetector | null>(null)

  // 🔔 Hook notifications intelligent pour remplacer mock-up
  const { unreadCount, loading: notificationsLoading } = useNotifications()

  // Récupérer le rôle de l'utilisateur au chargement
  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single()

        setUserRole(profile?.role || null)
      }
    }

    fetchUserRole()
  }, [])


  // 🚀 RÉVOLUTIONNAIRE: Auto-détection Sentry intelligente avec patterns avancés (CLIENT ONLY)
  useEffect(() => {
    // Import dynamique côté client seulement
    if (typeof window !== 'undefined') {
      import('@/lib/error-detection/sentry-auto-detection').then((module) => {
        setSentryDetector(module.globalSentryDetector)
      })
    }
  }, [])

  useEffect(() => {
    if (!sentryDetector || typeof window === 'undefined') return

    // Initialisation du monitoring automatique
    const updateSentryStatus = () => {
      try {
        const errorCount = parseInt(localStorage.getItem('sentry-error-count') || '0')
        setSentryErrors(errorCount)

        // Statut intelligent basé sur sévérité des erreurs
        const errorStats = sentryDetector.getErrorStats()

        if (errorStats.criticalErrors > 0) {
          setSentryStatus('critical')
        } else if (errorCount > 5) {
          setSentryStatus('warning')
        } else if (errorCount > 0) {
          setSentryStatus('warning')
        } else {
          setSentryStatus('healthy')
        }
      } catch (error) {
        console.error('Error updating Sentry status:', error)
      }
    }

    updateSentryStatus()

    // Écouter les événements d'erreur du système de détection automatique
    const handleAutoDetectedError = (event: CustomEvent) => {
      setSentryErrors(event.detail.count)
      updateSentryStatus()

      console.log('🤖 [Header] Auto-erreur détectée:', event.detail)
    }

    window.addEventListener('sentry-error-detected', handleAutoDetectedError as EventListener)

    // Actualisation périodique des stats
    const statsInterval = setInterval(updateSentryStatus, 5000)

    // Cleanup
    return () => {
      window.removeEventListener('sentry-error-detected', handleAutoDetectedError as EventListener)
      clearInterval(statsInterval)
    }
  }, [sentryDetector])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // 🎯 Rapport Sentry Intelligent avec Auto-Détection Avancée
  const handleSentryReport = () => {
    if (!sentryDetector || typeof window === 'undefined') {
      console.warn('Sentry detector not available')
      return
    }

    // Récupération des statistiques avancées du détecteur automatique
    const errorStats = sentryDetector.getErrorStats()

    // Rapport complet avec analyse intelligente
    Sentry.captureMessage('Rapport Global Sentry - Détection Automatique', {
      level: sentryStatus === 'critical' ? 'error' : sentryStatus === 'warning' ? 'warning' : 'info',
      tags: {
        source: 'header_global_auto',
        error_count: sentryErrors,
        status: sentryStatus,
        auto_detection: 'enabled',
        critical_errors: errorStats.criticalErrors
      },
      contexts: {
        application: {
          total_errors: sentryErrors,
          critical_errors: errorStats.criticalErrors,
          recent_errors_1h: errorStats.recentErrors.length,
          auto_corrections_available: errorStats.autoCorrectionsAvailable,
          health_status: sentryStatus,
        },
        auto_detection_stats: {
          total_detected: errorStats.totalErrors,
          critical_detected: errorStats.criticalErrors,
          auto_fix_suggestions: errorStats.autoCorrectionsAvailable,
          recent_activity: errorStats.recentErrors.slice(0, 5).map(e => ({
            type: e.errorType,
            severity: e.severity,
            timestamp: e.timestamp
          }))
        }
      }
    })

    // Feedback intelligent avec stats détaillées
    const criticalInfo = errorStats.criticalErrors > 0 ?
      `\n⚠️ CRITIQUE: ${errorStats.criticalErrors} erreurs critiques détectées` : ''

    const autoFixInfo = errorStats.autoCorrectionsAvailable > 0 ?
      `\n🔧 ${errorStats.autoCorrectionsAvailable} corrections automatiques disponibles` : ''

    alert(`🚀 Rapport Sentry Intelligent envoyé !

📊 Statut: ${sentryStatus.toUpperCase()}
🔢 Total erreurs: ${sentryErrors}${criticalInfo}${autoFixInfo}

✅ Analyse automatique Sentry complète !`)

    // Reset intelligent du compteur
    sentryDetector.resetErrorCounter()
    setSentryErrors(0)
    setSentryStatus('healthy')
  }


  // 🎨 Fonction pour obtenir l'icône et couleur Sentry selon le statut
  const getSentryIconAndColor = () => {
    switch (sentryStatus) {
      case 'critical':
        return { icon: XCircle, color: 'text-red-500 bg-red-100' }
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-100' }
      default:
        return { icon: Bug, color: 'text-green-500 bg-green-100' }
    }
  }

  return (
    <header className={cn(
      "flex h-16 items-center justify-between border-b border-black bg-white px-6",
      className
    )}>
      {/* Zone de recherche */}
      <div className="flex flex-1 items-center space-x-4">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
          <input
            type="search"
            placeholder="Rechercher produits, collections..."
            className="w-full border border-black bg-white py-2 pl-10 pr-4 text-sm text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
        </div>
      </div>

      {/* Actions utilisateur */}
      <div className="flex items-center space-x-2">
        {/* Notifications - Compteur intelligent */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          title={notificationsLoading ? 'Chargement...' : `${unreadCount} notifications non lues`}
        >
          <Bell className="h-5 w-5" />
          {!notificationsLoading && unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-auto min-w-[16px] px-1 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">{unreadCount} Notifications</span>
        </Button>


        {/* 🚀 RÉVOLUTIONNAIRE: Sentry Report Global Button */}
        <Button
          variant="ghost"
          size="icon"
          className={`relative ${getSentryIconAndColor().color}`}
          onClick={handleSentryReport}
          title={`Sentry Report - ${sentryStatus.toUpperCase()} (${sentryErrors} erreurs)`}
        >
          {(() => {
            const { icon: Icon } = getSentryIconAndColor()
            return <Icon className="h-5 w-5" />
          })()}
          {sentryErrors > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-auto min-w-[16px] px-1 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium">
              {sentryErrors}
            </span>
          )}
          <span className="sr-only">Sentry Error Report</span>
        </Button>

        {/* Menu Profil utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Menu profil</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Mon Profil</span>
            </DropdownMenuItem>

            {/* Lien Administration - Visible uniquement pour les owners */}
            {userRole === 'owner' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => router.push('/admin/users')}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span>Administration</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-verone-black font-medium hover:bg-gray-100 focus:bg-gray-100"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Se déconnecter</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}