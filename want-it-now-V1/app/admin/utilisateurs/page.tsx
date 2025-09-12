import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, UserPlus, ArrowLeft, Shield, Settings, Filter, Download } from 'lucide-react'
import Link from 'next/link'
import { listUsersWithRoles } from '@/actions/utilisateurs'
import { AdminUsersTable } from '@/components/admin/admin-users-table'

export default async function SuperAdminUsersPage() {
  // Vérification auth côté serveur
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est super admin
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin')
  
  if (!isSuperAdmin) {
    // Rediriger les admins vers leur page filtrée
    redirect('/admin/utilisateurs/filtered')
  }

  // Charger la liste des utilisateurs avec leurs rôles
  const usersResult = await listUsersWithRoles()
  const allUsers = usersResult.success ? usersResult.data || [] : []

  // Définir les capacités du super admin
  const capabilities = {
    canCreateSuperAdmin: true,
    canCreateAdmin: true,
    canCreateProprietaire: true,
    canAssignOrganisations: true,
    canViewAllUsers: true,
    canDeleteUsers: true,
    canExportData: true,
    restrictedToOrganisations: null
  }

  // Compter les types d'utilisateurs (compteur simple)
  const userTypeCounts = {
    superAdmins: allUsers.filter(u => u.user_roles?.some(r => r.role === 'super_admin')).length,
    admins: allUsers.filter(u => u.user_roles?.some(r => r.role === 'admin')).length
  }

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title="Gestion des Utilisateurs"
          description="Administration complète des utilisateurs et permissions"
          actions={
            <div className="flex items-center gap-3">
              <Link href="/profile/super-admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Link href="/admin/utilisateurs/new">
                <Button className="gradient-copper text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer un utilisateur
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      {/* Header avec compteur simple et filtres */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Compteur simple et discret */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-lg font-semibold text-gray-900">
                {allUsers.length} utilisateur{allUsers.length > 1 ? 's' : ''}
              </span>
            </div>
            
            {/* Répartition discrète */}
            <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
              <span>{userTypeCounts.superAdmins} super admin{userTypeCounts.superAdmins > 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{userTypeCounts.admins} admin{userTypeCounts.admins > 1 ? 's' : ''}</span>
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
      {allUsers.length > 0 ? (
        <div className="flex-1 overflow-hidden">
          <AdminUsersTable 
            users={allUsers} 
            capabilities={capabilities}
            currentUserRole="super_admin"
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
                Aucun utilisateur
              </h3>
              <p className="text-gray-600 mb-6">
                Commencez par créer votre premier utilisateur pour structurer vos équipes.
              </p>
              <Link href="/admin/utilisateurs/new">
                <Button className="gradient-copper text-white">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer le premier utilisateur
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  )
}