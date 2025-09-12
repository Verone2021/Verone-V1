import { redirect } from 'next/navigation'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Home,
  Ruler,
  Euro,
  Users,
  Bed,
  Bath,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench
} from 'lucide-react'
import Link from 'next/link'
import { getProprieteById } from '@/actions/proprietes'
import { getUniteById, deleteUnite } from '@/actions/proprietes-unites'
import { UniteDeleteButton } from '@/components/proprietes/unite-delete-button'
import { UnitePhotosSection } from '@/components/proprietes/unite-photos-section'

interface UniteDetailPageProps {
  params: Promise<{
    id: string
    uniteId: string
  }>
}

export default async function UniteDetailPage({ params }: UniteDetailPageProps) {
  const resolvedParams = await params
  
  // Server-side authentication check
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  const canEdit = isSuperAdmin || isAdmin

  // Fetch the property and unit
  const [propertyResult, uniteResult] = await Promise.all([
    getProprieteById(resolvedParams.id),
    getUniteById(resolvedParams.uniteId)
  ])
  
  if (!propertyResult.success || !propertyResult.data) {
    redirect('/proprietes')
  }

  if (!uniteResult.success || !uniteResult.data) {
    redirect(`/proprietes/${resolvedParams.id}`)
  }

  const property = propertyResult.data
  const unite = uniteResult.data

  // Get status badge configuration
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'disponible':
        return {
          variant: 'success' as const,
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Disponible'
        }
      case 'louee':
        return {
          variant: 'default' as const,
          icon: <Home className="w-3 h-3" />,
          label: 'Louée'
        }
      case 'renovation':
        return {
          variant: 'warning' as const,
          icon: <Wrench className="w-3 h-3" />,
          label: 'En rénovation'
        }
      case 'indisponible':
        return {
          variant: 'destructive' as const,
          icon: <XCircle className="w-3 h-3" />,
          label: 'Indisponible'
        }
      default:
        return {
          variant: 'outline' as const,
          icon: <AlertCircle className="w-3 h-3" />,
          label: statut
        }
    }
  }

  const statusConfig = getStatusBadge(unite.statut)

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <PageHeader
          title={unite.nom}
          description={`Unité ${unite.numero || ''} - ${property.nom}`}
          actions={
            <div className="flex items-center gap-3">
              <Link href={`/proprietes/${resolvedParams.id}`}>
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour à la propriété
                </Button>
              </Link>
              {canEdit && (
                <>
                  <Link href={`/proprietes/${resolvedParams.id}/unites/${resolvedParams.uniteId}/edit`}>
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                  </Link>
                  <UniteDeleteButton
                    uniteId={resolvedParams.uniteId}
                    uniteName={unite.nom}
                    proprieteId={resolvedParams.id}
                  />
                </>
              )}
            </div>
          }
        />
      }
    >
      <div className="grid gap-6">
        {/* Status and quick info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informations générales</CardTitle>
              <Badge variant={statusConfig.variant}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Numéro d'unité</p>
                  <p className="font-medium">{unite.numero || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{unite.type || 'Non défini'}</p>
                </div>
                {unite.description && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm">{unite.description}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {unite.est_louee && (
                  <div>
                    <Badge variant="default">
                      <Home className="w-3 h-3 mr-1" />
                      Actuellement louée
                    </Badge>
                  </div>
                )}
                {unite.date_disponibilite && (
                  <div>
                    <p className="text-sm text-gray-500">Date de disponibilité</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(unite.date_disponibilite).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Caractéristiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unite.surface_m2 && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Surface</p>
                  <p className="font-semibold">{unite.surface_m2} m²</p>
                </div>
              )}
              {unite.nombre_pieces && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Pièces</p>
                  <p className="font-semibold">{unite.nombre_pieces}</p>
                </div>
              )}
              {unite.nb_chambres !== undefined && unite.nb_chambres !== null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    Chambres
                  </p>
                  <p className="font-semibold">{unite.nb_chambres}</p>
                </div>
              )}
              {unite.nb_sdb !== undefined && unite.nb_sdb !== null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Bath className="w-3 h-3" />
                    Salles de bain
                  </p>
                  <p className="font-semibold">{unite.nb_sdb}</p>
                </div>
              )}
              {unite.etage !== undefined && unite.etage !== null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Étage</p>
                  <p className="font-semibold">{unite.etage}</p>
                </div>
              )}
              {unite.capacite_max && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Capacité max
                  </p>
                  <p className="font-semibold">{unite.capacite_max} pers.</p>
                </div>
              )}
              {unite.nb_lits !== undefined && unite.nb_lits !== null && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Bed className="w-3 h-3" />
                    Lits
                  </p>
                  <p className="font-semibold">{unite.nb_lits}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tarification */}
        {(unite.loyer || unite.charges || unite.depot_garantie) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="w-5 h-5" />
                Tarification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {unite.loyer && (
                  <div>
                    <p className="text-sm text-gray-500">Loyer mensuel</p>
                    <p className="text-2xl font-bold text-copper">{unite.loyer} €</p>
                  </div>
                )}
                {unite.charges && (
                  <div>
                    <p className="text-sm text-gray-500">Charges mensuelles</p>
                    <p className="text-2xl font-bold">{unite.charges} €</p>
                  </div>
                )}
                {unite.depot_garantie && (
                  <div>
                    <p className="text-sm text-gray-500">Dépôt de garantie</p>
                    <p className="text-2xl font-bold">{unite.depot_garantie} €</p>
                  </div>
                )}
              </div>
              
              {unite.loyer && unite.charges && (
                <div className="mt-6 p-4 bg-copper/5 rounded-lg border border-copper/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total mensuel (loyer + charges)</span>
                    <span className="text-xl font-bold text-copper">
                      {(unite.loyer + unite.charges).toFixed(2)} €
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Photos Section */}
        <UnitePhotosSection 
          uniteId={resolvedParams.uniteId}
          proprieteId={resolvedParams.id}
          canEdit={canEdit}
        />

        {/* Metadata */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Créée le</p>
                <p className="font-medium">
                  {new Date(unite.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Dernière modification</p>
                <p className="font-medium">
                  {new Date(unite.updated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
