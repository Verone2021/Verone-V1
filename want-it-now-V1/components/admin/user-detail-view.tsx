'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PageLayout } from '@/components/layout/page-layout'
import { PageShell, PageHeader, GridLayouts } from '@/components/layout/page-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Building,
  Settings,
  Clock,
  UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { UserOrganisationsManager } from './user-organisations-manager'
import { UserEditModal } from './user-edit-modal'

interface UserWithRoles {
  id: string
  nom: string | null
  prenom: string | null
  email: string
  telephone: string | null
  role: string
  created_at: string
  updated_at: string
  last_sign_in_at?: string | null
  user_roles: Array<{
    user_id: string
    organisation_id: string
    role: string
    created_at: string
    updated_at: string
    created_by: string
    organisations: {
      id: string
      nom: string
      pays: string
      is_active: boolean
    }
  }>
}

interface UserDetailViewProps {
  user: UserWithRoles
  currentUserId: string
}

export function UserDetailView({ user, currentUserId }: UserDetailViewProps) {
  const router = useRouter()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [userDisplayData, setUserDisplayData] = useState(user)

  // Fonction pour gérer la mise à jour réussie du profil
  const handleProfileUpdateSuccess = () => {
    // Forcer le rafraîchissement de la page pour obtenir les données mises à jour
    router.refresh()
  }

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Fonction pour formater la dernière connexion
  const formatLastConnection = (lastSignIn: string | null | undefined) => {
    if (!lastSignIn) return { text: 'Jamais connecté', color: 'text-gray-500' }
    
    const lastConnection = new Date(lastSignIn)
    const now = new Date()
    const diffMs = now.getTime() - lastConnection.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 60) {
      return { text: `Il y a ${diffMinutes}min`, color: 'text-green-600' }
    } else if (diffHours < 24) {
      return { text: `Il y a ${diffHours}h`, color: 'text-green-600' }
    } else if (diffDays < 7) {
      return { text: `Il y a ${diffDays}j`, color: 'text-yellow-600' }
    } else if (diffDays < 30) {
      return { text: `Il y a ${diffDays}j`, color: 'text-orange-600' }
    } else {
      return { text: `Il y a ${diffDays}j`, color: 'text-red-600' }
    }
  }

  const connectionStatus = formatLastConnection(userDisplayData.last_sign_in_at)

  // Déterminer le type d'utilisateur principal
  const primaryRole = userDisplayData.user_roles.find(r => r.role === 'super_admin')?.role || 
                     userDisplayData.user_roles.find(r => r.role === 'admin')?.role ||
                     userDisplayData.role

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return Shield
      case 'admin': return Settings
      default: return User
    }
  }

  const RoleIcon = getRoleIcon(primaryRole)

  return (
    <PageLayout>
      <PageShell
        header={
          <PageHeader
            title={`${userDisplayData.prenom} ${userDisplayData.nom}`}
            description={`Détail utilisateur - ${userDisplayData.email}`}
            actions={
              <div className="flex items-center gap-3">
                <Link href="/admin/utilisateurs">
                  <Button variant="ghost">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour à la liste
                  </Button>
                </Link>
                <Button 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(true)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            }
          />
        }
      >
        <div className={GridLayouts.contentGrid}>
          {/* Colonne gauche - Informations utilisateur */}
          <div className={cn(GridLayouts.contentMain, "space-y-6")}>
            {/* Card informations personnelles */}
            <Card className="modern-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-copper" />
                  Informations Personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nom complet */}
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-semibold text-lg text-gray-900">
                      {userDisplayData.prenom} {userDisplayData.nom}
                    </div>
                    <div className="text-sm text-gray-500">Nom complet</div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">{userDisplayData.email}</div>
                    <div className="text-sm text-gray-500">Adresse email</div>
                  </div>
                </div>

                {/* Téléphone */}
                {userDisplayData.telephone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{userDisplayData.telephone}</div>
                      <div className="text-sm text-gray-500">Téléphone</div>
                    </div>
                  </div>
                )}

                {/* Rôle principal */}
                <div className="flex items-center gap-3">
                  <RoleIcon className="w-5 h-5 text-gray-400" />
                  <div>
                    <Badge className={getRoleBadgeColor(primaryRole)}>
                      {primaryRole === 'super_admin' ? 'Super Administrateur' :
                       primaryRole === 'admin' ? 'Administrateur' :
                       primaryRole}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">Rôle principal</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card informations système */}
            <Card className="modern-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-copper" />
                  Informations Système
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date de création */}
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatDate(userDisplayData.created_at)}
                    </div>
                    <div className="text-sm text-gray-500">Date de création</div>
                  </div>
                </div>

                {/* Dernière connexion */}
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className={`font-medium ${connectionStatus.color}`}>
                      {connectionStatus.text}
                    </div>
                    <div className="text-sm text-gray-500">Dernière connexion</div>
                  </div>
                </div>

                {/* ID utilisateur (pour debug) */}
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-mono text-sm text-gray-700">{userDisplayData.id}</div>
                    <div className="text-sm text-gray-500">Identifiant unique</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite - Gestion des organisations */}
          <div className={GridLayouts.contentSidebar}>
            <Card className="modern-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-brand-copper" />
                  Organisations Assignées
                </CardTitle>
                <CardDescription>
                  Gérez les organisations auxquelles cet administrateur a accès
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserOrganisationsManager 
                  user={userDisplayData}
                  currentUserId={currentUserId}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>

      {/* Modal d'édition utilisateur */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={{
          id: userDisplayData.id,
          nom: userDisplayData.nom,
          prenom: userDisplayData.prenom,
          email: userDisplayData.email,
          telephone: userDisplayData.telephone,
        }}
        onSuccess={handleProfileUpdateSuccess}
      />
    </PageLayout>
  )
}