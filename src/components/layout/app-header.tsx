"use client"

import { Bell, Search, User, LogOut, Settings, Users, Bug, AlertTriangle, XCircle, RefreshCw } from "lucide-react"
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
// 🚀 RÉVOLUTIONNAIRE: Hook Sentry Unifié - Source de vérité unique
import { useSentryUnified } from "../../hooks/use-sentry-unified"
// 🔔 Hook notifications intelligent
import { useNotifications } from "../../hooks/use-notifications"

interface AppHeaderProps {
  className?: string
}

export function AppHeader({ className }: AppHeaderProps) {
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)

  // 🚀 RÉVOLUTIONNAIRE: Hook Sentry Unifié - Remplace les deux systèmes précédents
  const {
    totalErrorCount,
    stats,
    isConnected,
    isHealthy,
    loading: sentryLoading,
    refresh: refreshSentry
  } = useSentryUnified({
    pollingInterval: 30000, // Polling intelligent toutes les 30s
    enableLocalDetection: true, // Garder l'auto-détection locale
    autoRefresh: true
  })

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


  // 🎯 Logique Sentry simplifiée grâce au hook unifié - FINI les systèmes doubles !


  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  // 🚀 RÉVOLUTIONNAIRE: Accès Dashboard Sentry Unifié - Simple et efficace
  const handleSentryReport = () => {
    // Rapport complet avec les vraies données unifiées
    Sentry.captureMessage('Dashboard Sentry - Accès depuis Header', {
      level: stats.status === 'critical' ? 'error' : stats.status === 'warning' ? 'warning' : 'info',
      tags: {
        source: 'header_dashboard_unified',
        total_error_count: totalErrorCount,
        status: stats.status,
        connection_status: isConnected ? 'connected' : 'disconnected',
        api_health: stats.apiHealth
      },
      contexts: {
        unified_sentry_stats: {
          total_errors: totalErrorCount,
          unresolved_api: stats.unresolvedCount,
          local_errors: stats.localErrorsDetected,
          critical_errors: stats.criticalCount,
          affected_users: stats.affectedUsers,
          last_sync: stats.lastSync?.toISOString(),
          is_connected: isConnected,
          api_health: stats.apiHealth
        }
      }
    })

    console.log('🚀 [Header Unifié] Accès dashboard:', {
      totalErrors: totalErrorCount,
      status: stats.status,
      connected: isConnected
    })

    // Rediriger vers le dashboard des erreurs Sentry
    router.push('/admin/monitoring/errors')
  }


  // 🚀 RÉVOLUTIONNAIRE: Icône et couleur Sentry unifiée avec indicateur de connexion
  const getSentryIconAndColor = () => {
    // Mode loading avec spinner
    if (sentryLoading) {
      return { icon: RefreshCw, color: 'text-blue-500 bg-blue-100 animate-spin' }
    }

    // Mode déconnecté
    if (!isConnected) {
      return { icon: XCircle, color: 'text-gray-500 bg-gray-100' }
    }

    // Status basé sur les vraies données unifiées
    switch (stats.status) {
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


        {/* 🚀 RÉVOLUTIONNAIRE: Sentry Report Unifié - Données synchronisées */}
        <Button
          variant="ghost"
          size="icon"
          className={`relative transition-all duration-200 ${getSentryIconAndColor().color}`}
          onClick={handleSentryReport}
          title={`Sentry Report - ${stats.status.toUpperCase()} (${totalErrorCount} erreurs) - ${isConnected ? 'Connecté' : 'Déconnecté'}`}
          disabled={sentryLoading}
        >
          {(() => {
            const { icon: Icon } = getSentryIconAndColor()
            return <Icon className="h-5 w-5" />
          })()}
          {totalErrorCount > 0 && !sentryLoading && (
            <span className="absolute -top-1 -right-1 h-4 w-auto min-w-[16px] px-1 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium">
              {totalErrorCount > 99 ? '99+' : totalErrorCount}
            </span>
          )}
          {!isConnected && !sentryLoading && (
            <span className="absolute -bottom-1 -right-1 h-2 w-2 bg-gray-400 rounded-full border border-white"></span>
          )}
          <span className="sr-only">Sentry Error Report - {totalErrorCount} erreurs</span>
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