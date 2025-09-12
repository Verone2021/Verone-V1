import { redirect, notFound } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { getContratById } from '@/actions/contrats'
import { ContratForm } from '@/components/contrats/contrat-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { AuthenticatedAppShell } from '@/components/layout/app-shell'

interface EditContratPageProps {
  params: Promise<{ id: string }>
}

export default async function EditContratPage({ params }: EditContratPageProps) {
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
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/contrats/${contrat.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au contrat
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Modifier le contrat {contrat.type_contrat}
            </h1>
            <p className="text-gray-600 mt-1">
              Du {new Date(contrat.date_debut).toLocaleDateString('fr-FR')} au{' '}
              {new Date(contrat.date_fin).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <ContratForm contrat={contrat} isEdit />
        </div>
      </div>
    </AuthenticatedAppShell>
  )
}