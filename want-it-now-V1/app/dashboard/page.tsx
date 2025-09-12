'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useDashboardStats } from '@/hooks/use-dashboard-stats'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Loader2, 
  Users, 
  Building, 
  Home, 
  Settings,
  Shield,
  User,
  PlusCircle,
  BarChart3
} from 'lucide-react'
import Link from 'next/link'
import { getRoleColor, getRoleLabel } from '@/lib/validations/utilisateurs'
import { PageLayout } from '@/components/layout/page-layout'

export default function DashboardPage() {
  const router = useRouter()
  const { 
    user, 
    profile, 
    loading, 
    isAuthenticated, 
    isSuperAdmin, 
    isAdmin, 
    canAccessAdmin,
    error
  } = useAuth()
  
  const { 
    totalUsers, 
    totalOrganisations, 
    myOrganisationsCount, 
    loading: statsLoading 
  } = useDashboardStats()

  // 🔧 Fix: Anti-hydration pattern - évite le rendu prématuré côté client
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 🔧 Fix: Callback stable pour éviter les re-renders infinies
  const handleRedirectToLogin = useCallback(() => {
    router.replace('/login')
  }, [router])

  // 🔧 Fix: useEffect stabilisé avec dépendances contrôlées
  useEffect(() => {
    // Ne faire la redirection que si le composant est hydraté côté client
    // et que nous sommes certains que l'utilisateur n'est pas authentifié
    if (isClient && !loading && !isAuthenticated && !error) {
      console.log('🔄 [DASHBOARD] Redirection vers login - utilisateur non authentifié')
      handleRedirectToLogin()
    }
  }, [isClient, loading, isAuthenticated, error, handleRedirectToLogin])

  // 🔧 Fix: Attendre l'hydratation côté client avant tout rendu interactif
  if (!isClient) {
    return (
      <PageLayout className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-copper mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Initialisation de l'application
            </h2>
            <p className="text-gray-600">
              Préparation de votre tableau de bord...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Enhanced loading state with better UX
  if (loading) {
    return (
      <PageLayout className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-brand-copper mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Chargement de votre tableau de bord
            </h2>
            <p className="text-gray-600">
              Récupération de vos données...
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  // Handle authentication error states
  if (error) {
    return (
      <PageLayout className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="modern-shadow max-w-md">
            <CardContent className="py-10 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Erreur d'authentification
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={() => router.replace('/login')}
                variant="outline"
              >
                Se reconnecter
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  // Handle missing profile (but authenticated user)
  if (!profile && isAuthenticated) {
    return (
      <PageLayout className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="modern-shadow max-w-md">
            <CardContent className="py-10 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Profil incomplet
              </h3>
              <p className="text-gray-600 mb-4">
                Votre profil n'est pas encore configuré.
              </p>
              <Button 
                onClick={() => router.push('/profile')}
                className="bg-gradient-to-br from-brand-copper to-secondary-copper text-white"
              >
                Configurer mon profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  // Only render dashboard if we have both authentication and profile
  if (!isAuthenticated || !profile) {
    return null // Will be handled by middleware redirect or loading state above
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const getDashboardActions = () => {
    const baseActions = [
      {
        title: 'Mon Profil',
        description: 'Gérer mes informations personnelles',
        href: '/profile',
        icon: User,
        color: 'from-brand-copper to-secondary-copper'
      }
    ]

    if (isSuperAdmin) {
      return [
        ...baseActions,
        {
          title: 'Gestion des utilisateurs',
          description: 'Administrer tous les utilisateurs',
          href: '/utilisateurs',
          icon: Users,
          color: 'from-brand-green to-secondary-green'
        },
        {
          title: 'Gestion des organisations',
          description: 'Administrer les organisations',
          href: '/organisations',
          icon: Building,
          color: 'from-purple-500 to-purple-600'
        },
        {
          title: 'Paramètres système',
          description: 'Configuration globale de la plateforme',
          href: '/admin/settings',
          icon: Settings,
          color: 'from-gray-500 to-gray-600'
        }
      ]
    }

    if (isAdmin) {
      return [
        ...baseActions,
        {
          title: 'Utilisateurs',
          description: 'Gérer les utilisateurs de mon organisation',
          href: '/utilisateurs',
          icon: Users,
          color: 'from-brand-green to-secondary-green'
        },
        {
          title: 'Organisation',
          description: 'Gérer mon organisation',
          href: '/organisations',
          icon: Building,
          color: 'from-purple-500 to-purple-600'
        }
      ]
    }


    if ((profile as any).role === 'locataire') {
      return [
        ...baseActions,
        {
          title: 'Mes Demandes',
          description: 'Demandes de maintenance et réclamations',
          href: '/demandes',
          icon: PlusCircle,
          color: 'from-orange-500 to-orange-600'
        },
        {
          title: 'Mon Logement',
          description: 'Informations sur mon logement',
          href: '/logement',
          icon: Home,
          color: 'from-blue-500 to-blue-600'
        }
      ]
    }

    if ((profile as any).role === 'prestataire') {
      return [
        ...baseActions,
        {
          title: 'Mes Interventions',
          description: 'Planifier et suivre mes interventions',
          href: '/interventions',
          icon: BarChart3,
          color: 'from-indigo-500 to-indigo-600'
        }
      ]
    }

    return baseActions
  }

  return (
    <PageLayout className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {getWelcomeMessage()}, {profile.prenom} !
            </h2>
            <p className="text-gray-600">
              Voici votre tableau de bord Want It Now - 
              {(profile as any).role === 'super_admin' && ' Vous avez tous les droits administrateur.'}
              {(profile as any).role === 'admin' && ' Vous pouvez gérer votre organisation.'}
              {(profile as any).role === 'locataire' && ' Accédez à vos informations de logement.'}
              {(profile as any).role === 'prestataire' && ' Gérez vos interventions.'}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="modern-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 gradient-copper rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : totalUsers}
                    </p>
                    <p className="text-sm text-gray-600">
                      {totalUsers === 1 ? 'Utilisateur' : 'Utilisateurs'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 gradient-green rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {getRoleLabel((profile as any).role)}
                    </p>
                    <p className="text-sm text-gray-600">Votre rôle</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? '...' : 
                        isSuperAdmin ? totalOrganisations : myOrganisationsCount
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {isSuperAdmin ? 'Organisation' + (totalOrganisations === 1 ? '' : 's') 
                                   : 'Mon organisation' + (myOrganisationsCount === 1 ? '' : 's')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="modern-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {new Date(profile.created_at).toLocaleDateString('fr-FR', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">Membre depuis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <Card className="modern-shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Actions disponibles</CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités selon votre rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getDashboardActions().map((action, index) => {
                  const IconComponent = action.icon
                  return (
                    <Link key={index} href={action.href}>
                      <div className="group p-6 bg-gradient-to-br hover:shadow-lg transition-all duration-200 rounded-xl border border-gray-200 hover:border-gray-300 hover:-translate-y-1 cursor-pointer">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center group-hover:shadow-md transition-all`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                              {action.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Debug Info for Development */}
          <Card className="mt-8 modern-shadow border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-sm text-yellow-800">
                🛠️ Informations de débogage (mode développement)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>User ID:</strong> {user?.id}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Authentifié:</strong> {isAuthenticated ? '✅' : '❌'}</p>
                </div>
                <div>
                  <p><strong>Super Admin:</strong> {isSuperAdmin ? '✅' : '❌'}</p>
                  <p><strong>Admin:</strong> {isAdmin ? '✅' : '❌'}</p>
                  <p><strong>Accès admin:</strong> {canAccessAdmin ? '✅' : '❌'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
    </PageLayout>
  )
}