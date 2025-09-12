import { redirect, notFound } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { getUserDetailWithOrganisations } from '@/actions/utilisateurs'
import { UserDetailView } from '@/components/admin/user-detail-view'

interface UserDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  // Attendre params pour Next.js 15
  const resolvedParams = await params
  
  // Vérification auth côté serveur
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Vérifier que l'utilisateur est super admin
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin')
  
  if (!isSuperAdmin) {
    redirect('/admin/utilisateurs/filtered')
  }

  // Récupérer les détails de l'utilisateur
  const userResult = await getUserDetailWithOrganisations(resolvedParams.id)
  
  if (!userResult.success || !userResult.data) {
    notFound()
  }

  const user = userResult.data

  return (
    <UserDetailView
      user={user}
      currentUserId={authData.user.id}
    />
  )
}