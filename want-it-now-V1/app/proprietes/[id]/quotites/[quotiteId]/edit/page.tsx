import { notFound } from 'next/navigation'
import { getQuotiteById } from '@/actions/proprietes-quotites'
import { QuotiteEditForm } from '@/components/proprietes/quotites/quotite-edit-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface QuotiteEditPageProps {
  params: {
    id: string
    quotiteId: string
  }
}

export default async function QuotiteEditPage({ params }: QuotiteEditPageProps) {
  const { id: proprieteId, quotiteId } = params
  
  // Récupérer la quotité
  const result = await getQuotiteById(quotiteId)
  
  if (!result.success || !result.data) {
    notFound()
  }
  
  const quotite = result.data
  
  // Vérifier que la quotité appartient bien à cette propriété
  if (quotite.propriete_id !== proprieteId) {
    notFound()
  }
  
  const formatProprietaire = (proprietaire: typeof quotite.proprietaire) => {
    if (proprietaire?.type === 'physique') {
      return `${proprietaire.prenom || ''} ${proprietaire.nom}`.trim()
    }
    return proprietaire?.nom || 'Propriétaire non trouvé'
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb et navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/proprietes/${proprieteId}`}>
            <Button variant="outline" size="sm" className="hover:bg-gray-100">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à la propriété
            </Button>
          </Link>
          <div className="text-sm text-gray-500">
            Modification de la quotité
          </div>
        </div>
      </div>

      {/* Header de la page */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#D4841A] to-[#B8741A] rounded-lg flex items-center justify-center">
              <Edit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Modifier la quotité
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Propriétaire : {formatProprietaire(quotite.proprietaire)}
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Quotité actuelle :</span>
              <div className="font-semibold text-[#D4841A]">{quotite.pourcentage}%</div>
            </div>
            {quotite.date_acquisition && (
              <div>
                <span className="text-gray-500">Date d'acquisition :</span>
                <div className="font-medium">
                  {new Date(quotite.date_acquisition).toLocaleDateString('fr-FR')}
                </div>
              </div>
            )}
            {quotite.prix_acquisition && (
              <div>
                <span className="text-gray-500">Prix d'acquisition :</span>
                <div className="font-medium">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(quotite.prix_acquisition)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire d'édition */}
      <QuotiteEditForm 
        quotite={quotite}
        proprieteId={proprieteId}
      />
    </div>
  )
}

// Metadata pour la page
export async function generateMetadata({ params }: QuotiteEditPageProps) {
  const result = await getQuotiteById(params.quotiteId)
  
  if (!result.success || !result.data) {
    return {
      title: 'Quotité non trouvée - Want It Now',
    }
  }
  
  const quotite = result.data
  const proprietaireName = quotite.proprietaire?.type === 'physique' 
    ? `${quotite.proprietaire.prenom || ''} ${quotite.proprietaire.nom}`.trim()
    : quotite.proprietaire?.nom || 'Propriétaire'
  
  return {
    title: `Modifier la quotité de ${proprietaireName} - Want It Now`,
    description: `Modification de la quotité de ${quotite.pourcentage}% pour ${proprietaireName}`,
  }
}