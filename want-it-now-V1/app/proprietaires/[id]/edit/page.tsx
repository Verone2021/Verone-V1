import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Edit } from 'lucide-react'

import { getProprietaireById } from '@/actions/proprietaires'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'

import { ProprietaireForm } from '@/components/proprietaires/proprietaire-form'
import { formatProprietaireNomComplet } from '@/lib/utils/proprietaires'

// ==============================================================================
// TYPES & INTERFACES
// ==============================================================================

interface PageProps {
  params: Promise<{
    id: string
  }>
}

// ==============================================================================
// METADATA
// ==============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const proprietaire = await getProprietaireById(id)
  
  if (!proprietaire) {
    return {
      title: 'Propriétaire non trouvé | Want It Now',
    }
  }

  const nomComplet = formatProprietaireNomComplet(proprietaire)
  
  return {
    title: `Modifier ${nomComplet} | Propriétaires | Want It Now`,
    description: `Modification du propriétaire ${nomComplet}`,
  }
}

// ==============================================================================
// LOADING COMPONENT
// ==============================================================================

function ProprietaireEditSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-6">
          {/* Type selection */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="flex space-x-4">
              <div className="h-10 bg-gray-200 rounded w-48"></div>
              <div className="h-10 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          
          {/* Form fields */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
          
          {/* Actions */}
          <div className="flex space-x-2">
            <div className="h-10 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==============================================================================
// MAIN PAGE COMPONENT
// ==============================================================================

export default async function EditProprietairePage({ params }: PageProps) {
  // Récupérer les données du propriétaire
  const { id } = await params
  const proprietaire = await getProprietaireById(id)
  
  if (!proprietaire) {
    notFound()
  }

  const nomComplet = formatProprietaireNomComplet(proprietaire)

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title={`Modifier ${nomComplet}`}
          description="Modification des informations du propriétaire"
          actions={
            <div className="flex items-center gap-3">
              <Link href={`/proprietaires/${proprietaire.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux détails
                </Button>
              </Link>
              <div className="flex items-center space-x-2 text-sm text-gray-500 px-3 py-1 border rounded-md bg-white">
                <Edit className="h-4 w-4" />
                <span>Mode édition</span>
              </div>
            </div>
          }
        />
      }
    >
      <div className="space-y-6">
        {/* Form Card */}
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<ProprietaireEditSkeleton />}>
            <ProprietaireForm mode="edit" proprietaire={proprietaire} />
          </Suspense>
        </div>

        {/* Help Text */}
        <Card className="max-w-4xl mx-auto bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <h3 className="font-medium text-amber-900 mb-2">
              ⚠️ Attention lors de la modification
            </h3>
            <div className="text-sm text-amber-800 space-y-2">
              <p>
                <strong>Type de propriétaire :</strong> Le type (physique/morale) ne peut pas être modifié après création.
              </p>
              <p>
                <strong>Associés :</strong> Pour les personnes morales, la modification du capital social ou du nombre de parts peut affecter les quotités des associés existants.
              </p>
              <p>
                <strong>Propriétés liées :</strong> Ce propriétaire peut être lié à des propriétés. Les modifications importantes doivent être coordonnées.
              </p>
              <p>
                <strong>Brouillon :</strong> Passer en mode brouillon désactivera temporairement ce propriétaire dans les listes actives.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}