'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  User,
  Clock,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CheckCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserActivityStats {
  user_id: string
  email: string
  full_name: string | null
  role: string
  total_sessions: number
  total_actions: number
  last_activity: string | null
  engagement_score: number
  most_used_module: string | null
  is_active_now: boolean
}

interface ApiResponse {
  success: boolean
  users: UserActivityStats[]
  total: number
  error?: string
}

export default function ActiviteUtilisateursPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserActivityStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users')
      const data: ApiResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement')
      }

      setUsers(data.users)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  // Vérifier accès owner
  useEffect(() => {
    const checkAccess = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single() as { data: { role: string } | null }

      if (profile?.role !== 'owner') {
        router.push('/dashboard')
        return
      }

      setUserRole(profile.role)
      setIsCheckingAccess(false)
    }

    checkAccess()
  }, [router])

  useEffect(() => {
    if (!isCheckingAccess && userRole === 'owner') {
      fetchUsers()
    }
  }, [isCheckingAccess, userRole])

  // Auto-refresh toutes les 60 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const formatLastActivity = (lastActivity: string | null): string => {
    if (!lastActivity) return 'Jamais'

    const date = new Date(lastActivity)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMinutes < 1) return 'À l\'instant'
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffDays === 1) return 'Hier'
    if (diffDays < 30) return `Il y a ${diffDays} jours`

    return date.toLocaleDateString('fr-FR')
  }

  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'employee': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getEngagementColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-blue-600'
    if (score >= 20) return 'text-black'
    return 'text-gray-600'
  }

  const getModuleIcon = (module: string | null): string => {
    const icons: Record<string, string> = {
      'dashboard': '📊',
      'catalogue': '📦',
      'stocks': '📈',
      'sourcing': '🔍',
      'commandes': '🛒',
      'interactions': '💬',
      'organisation': '🏢',
      'admin': '⚙️'
    }
    return module ? icons[module] || '📄' : '—'
  }

  if (isLoading && users.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Activité Utilisateurs</h1>
              <p className="text-gray-600">Monitoring temps réel de l'équipe</p>
            </div>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-8 w-8 text-black" />
            <div>
              <h1 className="text-2xl font-bold text-black">Activité Utilisateurs</h1>
              <p className="text-gray-600">Monitoring temps réel de l'équipe</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500">
              Dernière mise à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
            </div>
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erreur de chargement</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Utilisateurs Actifs</p>
              <p className="text-2xl font-bold text-black">
                {users.filter(u => u.is_active_now).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">En ligne maintenant</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
              <p className="text-2xl font-bold text-black">{users.length}</p>
              <p className="text-sm text-gray-500 mt-1">Équipe complète</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Engagement Moyen</p>
              <p className="text-2xl font-bold text-black">
                {users.length > 0
                  ? Math.round(users.reduce((sum, u) => sum + u.engagement_score, 0) / users.length)
                  : 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">Score sur 100</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière Activité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions (30j)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions (30j)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module Préféré
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-black">
                          {user.full_name || 'Sans nom'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.is_active_now && (
                        <span className="flex h-2 w-2 mr-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      )}
                      <div>
                        <div className="text-sm text-black">{formatLastActivity(user.last_activity)}</div>
                        {user.is_active_now && (
                          <div className="text-xs text-green-600 font-medium">En ligne</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.total_sessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.total_actions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="mr-2">{getModuleIcon(user.most_used_module)}</span>
                      <span className="capitalize">{user.most_used_module || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm font-medium ${getEngagementColor(user.engagement_score)}`}>
                        {user.engagement_score}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/100</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/users/${user.user_id}`}
                      className="text-black hover:text-gray-700 inline-flex items-center group"
                    >
                      <span>Voir détails</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
              <p className="mt-1 text-sm text-gray-500">Aucun utilisateur trouvé dans le système.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
