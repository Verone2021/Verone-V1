import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getServerAuthData } from '@/lib/auth/server-auth'
import { PageLayout } from '@/components/layout/page-layout'
import { PageHeader } from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  MapPin, 
  Home,
  Euro,
  Camera,
  Grid3x3,
  Percent,
  FileText,
  AlertTriangle,
  Building2,
  Users,
  Bed,
  Bath,
  Square
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { 
  getProprieteById, 
  getProprieteStats, 
  getProprieteProprietaires 
} from '@/actions/proprietes'
import { getQuotitesStats } from '@/actions/proprietes-quotites'
import { getPhotosByPropriete, getPhotoCategories } from '@/actions/proprietes-photos'
import { getUnitesByPropriete, getUnitesStats } from '@/actions/proprietes-unites'

import { ProprieteBreadcrumb } from '@/components/proprietes/propriete-breadcrumb'
import { QuotitesManager } from '@/components/proprietes/quotites-manager'
import { PhotosManager } from '@/components/proprietes/photos-manager'
import { UnitesManager } from '@/components/proprietes/unites-manager'

import { formatCurrency, cn } from '@/lib/utils'
import { formatCountryName, formatFullAddress } from '@/lib/formatters/country-formatter'
import type { UniteWithDetails } from '@/actions/proprietes-unites'

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
  const result = await getProprieteById(id)
  
  if (!result.success || !result.data) {
    return {
      title: 'Propriété non trouvée | Want It Now',
    }
  }

  const propriete = result.data
  
  return {
    title: `${propriete.nom} | Multi-unités | Want It Now`,
    description: `Propriété multi-unités ${propriete.nom} - ${propriete.ville}`,
  }
}

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

function getStatutBadgeVariant(statut?: string) {
  switch(statut) {
    case 'brouillon': return 'secondary'
    case 'sourcing': return 'outline'
    case 'evaluation': return 'outline'
    case 'negociation': return 'outline'
    case 'achetee': return 'default'
    case 'disponible': return 'success'
    case 'louee': return 'destructive'
    case 'vendue': return 'secondary'
    case 'archive': return 'outline'
    default: return 'outline'
  }
}

function getStatutLabel(statut?: string) {
  switch(statut) {
    case 'brouillon': return '📝 Brouillon'
    case 'sourcing': return '🔍 Sourcing'
    case 'evaluation': return '📊 Évaluation'
    case 'negociation': return '🤝 Négociation'
    case 'achetee': return '🏠 Achetée'
    case 'disponible': return '✅ Disponible'
    case 'louee': return '🔴 Louée'
    case 'vendue': return '💰 Vendue'
    case 'archive': return '📦 Archivée'
    default: return statut || 'Non défini'
  }
}

function getTypeProprieteLabel(type?: string) {
  switch(type) {
    case 'appartement': return 'Appartement'
    case 'maison': return 'Maison'
    case 'studio': return 'Studio'
    case 'loft': return 'Loft'
    case 'duplex': return 'Duplex'
    case 'penthouse': return 'Penthouse'
    case 'villa': return 'Villa'
    case 'chalet': return 'Chalet'
    case 'terrain': return 'Terrain'
    case 'parking': return 'Parking'
    case 'local_commercial': return 'Local Commercial'
    case 'bureau': return 'Bureau'
    case 'immeuble': return 'Immeuble'
    case 'residence': return 'Résidence'
    case 'complex_hotelier': return 'Complexe Hôtelier'
    case 'autre': return 'Autre'
    default: return type || 'Non défini'
  }
}

function getUniteStatutBadge(statut: string) {
  switch(statut) {
    case 'disponible':
      return <Badge className="bg-green-100 text-green-800 border-green-200">✅ Disponible</Badge>
    case 'louee':
      return <Badge className="bg-red-100 text-red-800 border-red-200">🔴 Louée</Badge>
    case 'renovation':
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">🔨 Rénovation</Badge>
    case 'indisponible':
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">❌ Indisponible</Badge>
    default:
      return <Badge variant="outline">{statut}</Badge>
  }
}

// ==============================================================================
// COMPONENTS
// ==============================================================================

interface UniteCardProps {
  unite: UniteWithDetails
  proprieteId: string
  isAdmin: boolean
  isSuperAdmin: boolean
}

function UniteCard({ unite, proprieteId, isAdmin, isSuperAdmin }: UniteCardProps) {
  const canEdit = isAdmin || isSuperAdmin

  return (
    <Card className="hover:shadow-md transition-shadow">
      {/* Photo Header */}
      {unite.cover_photo_url ? (
        <div className="aspect-[16/9] relative overflow-hidden rounded-t-lg">
          <img 
            src={unite.cover_photo_url} 
            alt={unite.nom}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] relative overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
          <Camera className="h-8 w-8 text-gray-400" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{unite.nom}</CardTitle>
            <CardDescription>
              {unite.numero && `N° ${unite.numero} • `}
              {unite.type || 'Type non défini'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getUniteStatutBadge(unite.statut)}
            {canEdit && (
              <div className="flex gap-1">
                <Link href={`/proprietes/${proprieteId}/unites/${unite.id}`}>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <Home className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href={`/proprietes/${proprieteId}/unites/${unite.id}/edit`}>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Caractéristiques de l'unité */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <Square className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {unite.surface_m2 ? `${unite.surface_m2} m²` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Home className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {unite.nombre_pieces ? `${unite.nombre_pieces} pièces` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Bed className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {unite.nb_chambres ? `${unite.nb_chambres} ch.` : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Bath className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">
              {unite.nb_sdb ? `${unite.nb_sdb} sdb` : '-'}
            </span>
          </div>
        </div>

        {/* Informations financières */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-gray-500">Loyer:</span>
            <span className="ml-2 font-medium">
              {unite.loyer ? formatCurrency(unite.loyer) : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Charges:</span>
            <span className="ml-2 font-medium">
              {unite.charges ? formatCurrency(unite.charges) : '-'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Capacité:</span>
            <span className="ml-2 font-medium">
              {unite.capacite_max ? `${unite.capacite_max} pers.` : '-'}
            </span>
          </div>
        </div>

        {/* Description si disponible */}
        {unite.description && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-600 line-clamp-2">
              {unite.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default async function ProprieteMultiUnitesPage({ params }: PageProps) {
  const resolvedParams = await params
  
  // Server-side authentication check
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  
  const hasAccess = isSuperAdmin || isAdmin
  
  if (!hasAccess) {
    redirect('/dashboard')
  }

  // Fetch all property data in parallel
  const [
    proprieteResult,
    statsResult,
    quotitesResult,
    quotitesStatsResult,
    photosResult,
    categoriesResult,
    unitesResult,
    unitesStatsResult
  ] = await Promise.all([
    getProprieteById(resolvedParams.id),
    getProprieteStats(resolvedParams.id),
    getProprieteProprietaires(resolvedParams.id),
    getQuotitesStats(resolvedParams.id),
    getPhotosByPropriete(resolvedParams.id),
    getPhotoCategories(),
    getUnitesByPropriete(resolvedParams.id),
    getUnitesStats(resolvedParams.id)
  ])

  if (!proprieteResult.success || !proprieteResult.data) {
    notFound()
  }

  const propriete = proprieteResult.data

  // Redirection si ce n'est pas une propriété multi-unités
  if (!propriete.a_unites) {
    redirect(`/proprietes/${resolvedParams.id}`)
  }

  const stats = statsResult.data || {
    quotites_count: 0,
    quotites_total: 0,
    photos_count: 0,
    unites_count: 0,
    unites_louees: 0
  }
  const quotites = quotitesResult.data || []
  const quotitesStats = quotitesStatsResult.success ? quotitesStatsResult.data : null
  const photos = photosResult.success ? photosResult.data : []
  const categories = categoriesResult.success ? categoriesResult.data : []
  const unites = unitesResult.success ? unitesResult.data : []
  const unitesStats = unitesStatsResult.success ? unitesStatsResult.data : null

  const isBrouillon = propriete.is_brouillon || propriete.statut === 'brouillon'

  // Build page actions
  const pageActions = (
    <div className="flex gap-2">
      <Link href="/proprietes">
        <Button variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </Link>
      
      {(isAdmin || isSuperAdmin) && (
        <>
          <Link href={`/proprietes/${resolvedParams.id}/unites/new`}>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une unité
            </Button>
          </Link>
          
          <Link href={`/proprietes/${resolvedParams.id}/edit`}>
            <Button 
              className={propriete.statut === 'brouillon' ? "bg-[#D4841A] hover:bg-[#B8741A] text-white" : ""} 
              variant={propriete.statut === 'brouillon' ? undefined : "outline"}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </Link>
        </>
      )}
    </div>
  )

  return (
    <PageLayout 
      usePageShell={true}
      header={
        <>
          <ProprieteBreadcrumb propriete={propriete} />
          <PageHeader
            title={propriete.nom}
            description={`${getTypeProprieteLabel(propriete.type)} Multi-unités - ${propriete.reference || 'Sans référence'} - ${getStatutLabel(propriete.statut)}${isBrouillon ? ' (Brouillon)' : ''}`}
            actions={pageActions}
          />
        </>
      }
    >
      <div className="space-y-6">
        {/* Badge de statut */}
        <div className="flex gap-2">
          <Badge 
            variant={getStatutBadgeVariant(propriete.statut)}
            className={propriete.statut === 'archive' ? 'bg-red-50 text-red-700 border-red-200' : ''}
          >
            {getStatutLabel(propriete.statut)}
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Grid3x3 className="h-3 w-3 mr-1" />
            Propriété multi-unités
          </Badge>
          {isBrouillon && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              📝 Brouillon
            </Badge>
          )}
        </div>

        {/* Alert si brouillon */}
        {isBrouillon && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Cette propriété est en mode brouillon. Complétez toutes les informations requises pour la publier.
            </AlertDescription>
          </Alert>
        )}

        {/* Statistiques rapides */}
        {unitesStats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total unités</p>
                  <p className="text-2xl font-bold">{unitesStats.total}</p>
                </div>
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{unitesStats.disponibles}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Louées</p>
                  <p className="text-2xl font-bold text-red-600">{unitesStats.louees}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En rénovation</p>
                  <p className="text-2xl font-bold text-orange-600">{unitesStats.renovation}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Revenus totaux</p>
                  <p className="text-xl font-bold text-blue-600">
                    {unitesStats.loyer_total ? formatCurrency(unitesStats.loyer_total) : '-'}
                  </p>
                </div>
                <Euro className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
          </div>
        )}

        {/* Informations générales - Layout simplifié pour multi-unités */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte Localisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Localisation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">
                  {propriete.adresse || 'Adresse non renseignée'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Code postal</p>
                  <p className="font-medium">{propriete.code_postal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ville</p>
                  <p className="font-medium">{propriete.ville}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pays</p>
                <p className="font-medium" data-testid="property-country-display">
                  {formatCountryName(propriete.pays || 'FR')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Carte Financier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-gray-500" />
                Informations financières globales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Prix d'achat</p>
                <p className="font-medium text-lg">
                  {propriete.prix_achat ? formatCurrency(propriete.prix_achat) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus locatifs totaux</p>
                <p className="font-medium text-lg text-green-600">
                  {unitesStats?.loyer_total ? formatCurrency(unitesStats.loyer_total) : '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Loyer moyen par unité</p>
                <p className="font-medium">
                  {unitesStats?.loyer_moyen ? formatCurrency(unitesStats.loyer_moyen) : '-'}
                </p>
              </div>
              {propriete.taxe_fonciere && (
                <div>
                  <p className="text-sm text-muted-foreground">Taxe foncière</p>
                  <p className="font-medium">{formatCurrency(propriete.taxe_fonciere)}/an</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs pour les sections détaillées */}
        <Tabs defaultValue="unites" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="unites" className="flex items-center gap-2">
              <Grid3x3 className="h-4 w-4" />
              Unités
              {unitesStats && (
                <Badge variant="secondary" className="ml-1">
                  {unitesStats.total || 0}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotites" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Quotités
              {quotitesStats && quotitesStats.nombre_proprietaires > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {quotitesStats.nombre_proprietaires}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos
              <Badge variant="secondary" className="ml-1">
                {photos?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Section Unités - Premier onglet et principal */}
          <TabsContent value="unites" className="mt-6">
            <div className="space-y-6">
              {/* Liste des unités en cards */}
              {unites && unites.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {unites.map((unite) => (
                    <UniteCard
                      key={unite.id}
                      unite={unite}
                      proprieteId={resolvedParams.id}
                      isAdmin={isAdmin}
                      isSuperAdmin={isSuperAdmin}
                    />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucune unité créée</h3>
                    <p className="text-gray-500 mb-4">
                      Commencez par créer votre première unité pour cette propriété
                    </p>
                    {(isAdmin || isSuperAdmin) && (
                      <Button asChild>
                        <Link href={`/proprietes/${resolvedParams.id}/unites/new`}>
                          <Plus className="w-4 h-4 mr-2" />
                          Créer une unité
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Gestionnaire d'unités avancé */}
              <Card>
                <CardHeader>
                  <CardTitle>Gestion avancée des unités</CardTitle>
                  <CardDescription>
                    Outils avancés de gestion pour toutes les unités de cette propriété
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div>Chargement...</div>}>
                    <UnitesManager
                      proprieteId={resolvedParams.id}
                      initialUnites={unites || []}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Section Quotités */}
          <TabsContent value="quotites" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestion des quotités</CardTitle>
                <CardDescription>
                  Gérez les propriétaires et leurs parts de détention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Chargement...</div>}>
                  <QuotitesManager
                    proprieteId={resolvedParams.id}
                    initialQuotites={quotites || []}
                    initialStats={quotitesStats || null}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Photos */}
          <TabsContent value="photos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Galerie photos</CardTitle>
                <CardDescription>
                  Gérez les photos de la propriété et de ses unités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<div>Chargement...</div>}>
                  <PhotosManager
                    proprieteId={resolvedParams.id}
                    initialPhotos={photos?.map((photo: any) => ({
                      id: photo.id,
                      titre: photo.titre || '',
                      description: photo.description,
                      categorie: photo.categorie,
                      piece_nom: photo.piece_nom,
                      storage_path: photo.storage_path,
                      url_small: photo.url_small,
                      url_medium: photo.url_medium,
                      url_large: photo.url_large,
                      url_original: photo.url_original,
                      is_cover: photo.is_cover || false,
                      ordre: photo.display_order || 0,
                      tags: photo.tags,
                      metadata: photo.metadata,
                      created_at: photo.created_at
                    })) || []}
                    categories={categories?.map((cat: any) => cat.categorie || cat) || []}
                  />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Section Documents */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Documents et pièces jointes liés à la propriété et ses unités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    La gestion des documents sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Description */}
        {propriete.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{propriete.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Notes internes */}
        {propriete.notes_internes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes internes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{propriete.notes_internes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  )
}