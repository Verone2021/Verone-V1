import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, UserPlus, ArrowLeft, Settings, Filter, Building } from 'lucide-react'
import Link from 'next/link'
import { listUsersWithRoles } from '@/actions/utilisateurs'
import { AdminUsersTable } from '@/components/admin/admin-users-table'

export default async function AdminUsersFilteredPage() {
  // Vérification auth côté serveur
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est admin (pas super admin)
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin')
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin')
  
  if (isSuperAdmin) {
    // Rediriger les super admins vers leur page complète
    redirect('/admin/utilisateurs')
  }
  
  if (!isAdmin) {
    redirect('/dashboard')
  }

  // Charger la liste des utilisateurs avec leurs rôles
  const usersResult = await listUsersWithRoles()
  const allUsers = usersResult.success ? usersResult.data || [] : []

  // Filtrer les utilisateurs selon les organisations de l'admin
  const userOrganisations = authData.userRoles
    ?.filter(role => role.role === 'admin')
    .map(role => role.organisation_id) || []

  const filteredUsers = allUsers.filter(user => {
    // Afficher les utilisateurs qui ont des rôles dans les organisations de l'admin
    return user.user_roles?.some(role => 
      userOrganisations.includes(role.organisation_id)
    ) || 
    // Ou les utilisateurs sans organisation
    !user.user_roles?.length
  })

  // Définir les capacités de l'admin
  const capabilities = {
    canCreateSuperAdmin: false,
    canCreateAdmin: false,
    canCreateProprietaire: true,
    canAssignOrganisations: false,
    canViewAllUsers: false,
    canDeleteUsers: true, // Peut supprimer dans ses organisations
    canExportData: false,
    restrictedToOrganisations: userOrganisations
  }

  // Compter les types d'utilisateurs visibles (compteur simple)
  const userTypeCounts = {
    admins: filteredUsers.filter(u => u.user_roles?.some(r => r.role === 'admin')).length
  }

  // Obtenir les noms des organisations
  const organisationsNames = authData.userRoles
    ?.filter(role => role.role === 'admin')
    .map(role => 'Organisation') || []

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Gestion des Utilisateurs"
          description={`Administration des utilisateurs pour ${organisationsNames.join(', ')}`}
          actions={
            <div className="flex items-center gap-3">
              <Link href="/profile/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Link href="/admin/utilisateurs/new">
                <Button className="gradient-copper text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un propriétaire
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      {/* Header avec compteur simple et organisations */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Compteur simple et organisations */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-lg font-semibold text-gray-900">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Répartition et organisations */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <span>{userTypeCounts.admins} admin{userTypeCounts.admins > 1 ? 's' : ''}</span>
              {organisationsNames.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Building className="w-3 h-3" />
                    <span>{organisationsNames.length} organisation{organisationsNames.length > 1 ? 's' : ''}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick filters */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hidden lg:flex">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Table principale moderne */}
      {filteredUsers.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <AdminUsersTable 
            users={filteredUsers} 
            capabilities={capabilities}
            currentUserRole="admin"
            currentUserId={authData.user.id}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Card className="modern-shadow max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun utilisateur visible
              </h3>
              <p className="text-gray-600 mb-6">
                Aucun utilisateur trouvé dans vos organisations. Créez votre premier propriétaire.
              </p>
              <Link href="/admin/utilisateurs/new">
                <Button className="gradient-copper text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un propriétaire
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}