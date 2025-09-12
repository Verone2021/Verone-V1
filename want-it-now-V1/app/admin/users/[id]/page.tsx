import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { UserOrganisationsManager } from '@/components/admin/user-organisations-manager'
import { UserDetailPasswordManager } from '@/components/admin/user-detail-password-manager'
import { 
  ArrowLeft,
  Edit, 
  Key,
  Mail,
  Phone,
  Calendar,
  Clock,
  Building,
  User,
  Shield,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface UserDetailProps {
  params: Promise<{
    id: string
  }>
}

async function getUserDetailData(userId: string) {
  const supabase = await createClient()

  // Récupérer les données utilisateur complètes
  const { data: user, error: userError } = await supabase
    .from('utilisateurs')
    .select(`
      *,
      user_roles!fk_user_roles_user_id (
        user_id,
        organisation_id,
        role,
        created_at,
        updated_at,
        created_by,
        organisations (
          id,
          nom,
          pays,
          is_active
        )
      )
    `)
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return { user: null, authUser: null, error: userError?.message || 'Utilisateur non trouvé' }
  }

  // Récupérer les données Auth si disponibles
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)

  return {
    user,
    authUser: authUser.user,
    error: null
  }
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
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

async function UserDetailContent({ userId }: { userId: string }) {
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

  const { user, authUser, error } = await getUserDetailData(userId)

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

  // Obtenir les initiales
  const getUserInitials = () => {
    const prenom = user.prenom || ''
    const nom = user.nom || ''
    if (prenom && nom) return `${prenom[0]}${nom[0]}`.toUpperCase()
    if (prenom) return prenom.slice(0, 2).toUpperCase()
    if (nom) return nom.slice(0, 2).toUpperCase()
    return user.email.slice(0, 2).toUpperCase()
  }

  // Obtenir le rôle principal
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
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {getUserInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/admin/users/${user.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Informations utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Prénom</p>
                    <p className="text-sm">{user.prenom || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nom</p>
                    <p className="text-sm">{user.nom || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Téléphone</p>
                    <p className="text-sm">{user.telephone || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Créé le</p>
                    <p className="text-sm">
                      {format(new Date(user.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>

                {authUser?.last_sign_in_at && (
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Dernière connexion</p>
                      <p className="text-sm">
                        {format(new Date(authUser.last_sign_in_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statut Auth */}
            <Separator />
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Statut d'authentification</h3>
              <div className="flex items-center space-x-2">
                {authUser ? (
                  <>
                    <Badge variant="outline" className="text-green-600 border-green-300">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Compte Auth actif
                    </Badge>
                    {authUser.email_confirmed_at ? (
                      <Badge variant="outline" className="text-blue-600 border-blue-300">
                        Email confirmé
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        Email non confirmé
                      </Badge>
                    )}
                  </>
                ) : (
                  <Badge variant="outline" className="text-red-600 border-red-300">
                    <UserX className="h-3 w-3 mr-1" />
                    Aucun compte Auth
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rôles et organisations */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Rôles et accès
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Rôle principal</p>
                <Badge variant={getRoleBadgeVariant(primaryRole)} className="text-sm">
                  {primaryRole}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Gestion des organisations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2" />
                Organisations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UserOrganisationsManager user={user} currentUserId={currentUser.id} />
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href={`/admin/users/${user.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les informations
                </Link>
              </Button>
              
              <UserDetailPasswordManager user={user} />

              <Button variant="outline" size="sm" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Modifier les rôles
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default async function UserDetailPage({ params }: UserDetailProps) {
  const { id } = await params
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <UserDetailContent userId={id} />
    </Suspense>
  )
}

export const metadata = {
  title: 'Détails utilisateur - Administration',
  description: 'Vue détaillée d\'un utilisateur dans l\'interface d\'administration',
}