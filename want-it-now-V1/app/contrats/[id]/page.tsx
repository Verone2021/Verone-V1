import { redirect, notFound } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { getContratById } from '@/actions/contrats'
import { ContratDetail } from '@/components/contrats/contrat-detail'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { AuthenticatedAppShell } from '@/components/layout/app-shell'

interface ContratPageProps {
  params: Promise<{ id: string }>
}

export default async function ContratPage({ params }: ContratPageProps) {
  const resolvedParams = await params
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  const contratResult = await getContratById(resolvedParams.id)
  
  if (!contratResult.success) {
    if (contratResult.error === 'Contrat non trouvé') {
      notFound()
    }
    return (
      <AuthenticatedAppShell>
        <div className="container mx-auto py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Erreur</h2>
            <p className="text-red-700">{contratResult.error}</p>
          </div>
        </div>
      </AuthenticatedAppShell>
    )
  }

  const contrat = contratResult.data!

  return (
    <AuthenticatedAppShell>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/contrats">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux contrats
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Contrat {contrat.type_contrat}
              </h1>
              <p className="text-gray-600 mt-1">
                Du {new Date(contrat.date_debut).toLocaleDateString('fr-FR')} au{' '}
                {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
          
          <Link href={`/contrats/${contrat.id}/edit`}>
            <Button className="bg-[#D4841A] hover:bg-[#B8731A] text-white">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <ContratDetail contrat={contrat} />
        </div>
      </div>
    </AuthenticatedAppShell>
  )
}