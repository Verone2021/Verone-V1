import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import ContratWizardWrapper from './contrat-wizard-wrapper'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewContratPage() {
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simplifié pour wizard */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/contrats">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Création de Contrat Simplifiée</h1>
              <p className="text-gray-600 text-sm">
                Wizard guidé en 3 étapes essentielles aligné avec la base de données
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard principal */}
      <ContratWizardWrapper />
    </div>
  )
}