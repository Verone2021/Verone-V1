import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Users, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Settings,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { UserManagementTable } from '@/components/admin/user-management-table'
import { PendingOperationsAlert } from '@/components/admin/pending-operations-alert'
import { listUsersWithRoles } from '@/actions/utilisateurs'
import { getPendingAuthOperations } from '@/actions/auth-admin'

async function getUsersData() {
  const [usersResult, pendingOpsResult] = await Promise.all([
    listUsersWithRoles(),
    getPendingAuthOperations()
  ])

  return {
    users: usersResult.data || [],
    pendingOps: pendingOpsResult.data || [],
    usersError: usersResult.success ? null : usersResult.error,
    pendingError: pendingOpsResult.success ? null : pendingOpsResult.error
  }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

async function AdminUsersContent() {
  // Vérifier les permissions
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est super admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'super_admin')

  if (!userRoles || userRoles.length === 0) {
    redirect('/')
  }

  const { users, pendingOps, usersError, pendingError } = await getUsersData()

  // Calculer les statistiques
  const stats = {
    total: users.length,
    active: users.filter(u => u.user_roles && u.user_roles.length > 0).length,
    inactive: users.filter(u => !u.user_roles || u.user_roles.length === 0).length,
    pending: pendingOps.length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">
            Administration complète des utilisateurs et de leurs rôles
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/users/new">
              <Plus className="h-4 w-4 mr-2" />
              Nouvel utilisateur
            </Link>
          </Button>
        </div>
      </div>

      {/* Alertes pour opérations en attente */}
      {pendingOps.length > 0 && (
        <PendingOperationsAlert operations={pendingOps} />
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              utilisateurs au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              avec rôles assignés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactifs</CardTitle>
            <UserX className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              sans rôles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              opérations Auth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gestion des erreurs */}
      {(usersError || pendingError) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Erreurs de chargement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersError && (
              <p className="text-red-700 mb-2">
                <strong>Utilisateurs:</strong> {usersError}
              </p>
            )}
            {pendingError && (
              <p className="text-red-700">
                <strong>Opérations en attente:</strong> {pendingError}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table de gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Utilisateurs</span>
            <Badge variant="secondary" className="ml-2">
              {stats.total} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <UserManagementTable 
            users={users} 
            pendingOperations={pendingOps}
          />
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <AdminUsersContent />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'Gestion des utilisateurs - Administration',
  description: 'Interface d\'administration pour la gestion complète des utilisateurs',
}