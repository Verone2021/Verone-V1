import { redirect } from 'next/navigation'
import { ContratsPageClient } from '@/components/contrats/contrats-page-client'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { getContrats } from '@/actions/contrats'
import { AuthenticatedAppShell } from '@/components/layout/app-shell'

export default async function ContratsPage() {
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Récupérer tous les contrats pour l'utilisateur connecté
  const contratsResult = await getContrats()
  
  const contrats = contratsResult.success ? (contratsResult.data || []) : []
  const error = contratsResult.success ? undefined : contratsResult.error

  return (
    <AuthenticatedAppShell>
      <div className="container mx-auto py-8">
        <ContratsPageClient 
          initialContrats={contrats}
          error={error}
        />
      </div>
    </AuthenticatedAppShell>
  )
}