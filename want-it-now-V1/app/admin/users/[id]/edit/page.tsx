import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserEditForm } from '@/components/admin/user-edit-form'
import { UserEditPasswordManager } from '@/components/admin/user-edit-password-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  User,
  AlertTriangle,
  Shield,
  Key
} from 'lucide-react'
import Link from 'next/link'

interface UserEditProps {
  params: Promise<{
    id: string
  }>
}

async function getUserEditData(userId: string) {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('utilisateurs')
    .select(`
      *,
      user_roles!fk_user_roles_user_id (
        role,
        organisation_id,
        organisation:organisations (
          id,
          nom,
          pays
        )
      )
    `)
    .eq('id', userId)
    .single()

  if (error || !user) {
    return { user: null, error: error?.message || 'Utilisateur non trouvé' }
  }

  return { user, error: null }
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

async function UserEditContent({ userId }: { userId: string }) {
  // Vérifier les permissions
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  
  if (!currentUser) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est super admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', currentUser.id)
    .eq('role', 'super_admin')

  if (!userRoles || userRoles.length === 0) {
    redirect('/')
  }

  const { user, error } = await getUserEditData(userId)

  if (error || !user) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Utilisateur introuvable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex space-x-3">
              <Button asChild variant="outline">
                <Link href="/admin/users">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la liste
                </Link>
              </Button>
              <Button asChild>
                <Link href="/admin/users/new">
                  Créer un nouvel utilisateur
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Obtenir le rôle principal (lecture seule)
  const getPrimaryRole = () => {
    if (user.user_roles && user.user_roles.length > 0) {
      const roles = user.user_roles.map(ur => ur.role)
      if (roles.includes('super_admin')) return 'super_admin'
      if (roles.includes('admin')) return 'admin'
      return roles[0]
    }
    return user.role || 'utilisateur'
  }

  // Obtenir la couleur du badge de rôle
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive'
      case 'admin': return 'default'
      case 'proprietaire': return 'secondary'
      default: return 'outline'
    }
  }

  const primaryRole = getPrimaryRole()
  const userName = user.prenom && user.nom ? `${user.prenom} ${user.nom}` : user.email

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="ghost" size="sm">
            <Link href={`/admin/users/${user.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux détails
            </Link>
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Modifier l'utilisateur</h1>
            <p className="text-gray-600">{userName}</p>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users">
              Retour à la liste
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire d'édition */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserEditForm user={user} />
          </CardContent>
        </Card>

        {/* Informations de rôle et gestion avancée */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Rôles et accès
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-800">Information importante</p>
                    <p className="text-blue-700 mt-1">
                      Les rôles ne peuvent pas être modifiés depuis ce formulaire. 
                      Utilisez l'option "Changer rôle" dans la table de gestion des utilisateurs.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Rôle principal</p>
                <Badge variant={getRoleBadgeVariant(primaryRole)} className="text-sm">
                  {primaryRole}
                </Badge>
              </div>

              {user.user_roles && user.user_roles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-3">
                    Organisations assignées
                  </p>
                  <div className="space-y-2">
                    {user.user_roles.map((userRole, index) => (
                      <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium">{userRole.organisation.nom}</div>
                        <div className="text-xs text-gray-500">
                          {userRole.organisation.pays} • {userRole.role}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestion du mot de passe */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Gestion du mot de passe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Accès SuperAdmin requis</p>
                    <p className="text-yellow-700 mt-1">
                      Vous pouvez définir un mot de passe, générer un mot de passe temporaire ou envoyer un lien de récupération.
                    </p>
                  </div>
                </div>
              </div>

              <UserEditPasswordManager user={user} />
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/admin/users">
                Retour à la gestion des utilisateurs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function UserEditPage({ params }: UserEditProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UserEditContent userId={id} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Modifier utilisateur - Administration',
  description: 'Formulaire de modification des informations utilisateur',
}