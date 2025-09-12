import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { getContrats } from '@/actions/contrats'
import { ContratsTable } from '@/components/contrats/contrats-table'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function ContratsPage() {
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Récupérer tous les contrats pour l'utilisateur connecté
  const contratsResult = await getContrats()
  
  if (!contratsResult.success) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
          <p className="text-red-700">{contratsResult.error}</p>
        </div>
      </div>
    )
  }

  const contrats = contratsResult.data || []

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contrats</h1>
          <p className="text-gray-600 mt-1">
            Gestion des contrats de location
          </p>
        </div>
        <Link href="/contrats/new">
          <Button className="bg-[#D4841A] hover:bg-[#B8731A] text-white">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau contrat
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <ContratsTable contrats={contrats} />
      </div>
    </div>
  )
}