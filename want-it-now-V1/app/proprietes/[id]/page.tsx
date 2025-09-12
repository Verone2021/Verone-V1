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
  Percent,
  FileText,
  AlertTriangle
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

import { 
  getProprieteById, 
  getProprieteStats, 
  getProprieteProprietaires,
} from '@/actions/proprietes'
import { getQuotitesStats } from '@/actions/proprietes-quotites'
import { getPhotosByPropriete, getPhotoCategories } from '@/actions/proprietes-photos'

import { ProprieteBreadcrumb } from '@/components/proprietes/propriete-breadcrumb'
import { ProprieteStatusControls } from '@/components/proprietes/propriete-status-controls'
import { QuotitesManagerV2 } from '@/components/proprietes/quotites/quotites-manager-v2'
import { PhotosManager } from '@/components/proprietes/photos-manager'

import { formatCurrency } from '@/lib/utils'
import { formatCountryName, formatFullAddress } from '@/lib/formatters/country-formatter'

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
    title: `${propriete.nom} | Propriétés | Want It Now`,
    description: `Détail de la propriété ${propriete.nom} - ${propriete.ville}`,
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

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================

export default async function ProprietePage({ params }: PageProps) {
  const resolvedParams = await params
  
  // Server-side authentication check using the project pattern
  const authData = await getServerAuthData()
  
  if (!authData.user) {
    redirect('/login')
  }

  // Check user permissions using the same pattern as admin pages
  const isSuperAdmin = authData.userRoles?.some(role => role.role === 'super_admin') || false
  const isAdmin = authData.userRoles?.some(role => role.role === 'admin') || false
  
  // Allow access to super admins and admins only
  const hasAccess = isSuperAdmin || isAdmin
  
  if (!hasAccess) {
    redirect('/dashboard')
  }

  // Fetch all property data in parallel for better performance
  const [
    proprieteResult,
    statsResult,
    quotitesResult,
    quotitesStatsResult,
    photosResult,
    categoriesResult
  ] = await Promise.all([
    getProprieteById(resolvedParams.id),
    getProprieteStats(resolvedParams.id),
    getProprieteProprietaires(resolvedParams.id),
    getQuotitesStats(resolvedParams.id),
    getPhotosByPropriete(resolvedParams.id),
    getPhotoCategories()
  ])

  if (!proprieteResult.success || !proprieteResult.data) {
    notFound()
  }

  const propriete = proprieteResult.data
  
  // Redirection conditionnelle : si la propriété a des unités, 
  // rediriger vers la page spécialisée multi-unités
  if (propriete.a_unites) {
    redirect(`/proprietes/${resolvedParams.id}/with-units`)
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

  const isBrouillon = propriete.is_brouillon || propriete.statut === 'brouillon'

  // Build page actions based on permissions
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
          {propriete.a_unites && (
            <Link href={`/proprietes/${resolvedParams.id}/unites/new`}>
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une unité
              </Button>
            </Link>
          )}
          
          <Link href={`/proprietes/${resolvedParams.id}/edit`}>
            <Button 
              className={propriete.statut === 'brouillon' ? "bg-[#D4841A] hover:bg-[#B8741A] text-white" : ""} 
              variant={propriete.statut === 'brouillon' ? undefined : "outline"}
            >
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </Link>

          {/* Boutons contrôle statut manuel */}
          <ProprieteStatusControls 
            proprieteId={resolvedParams.id}
            currentStatut={propriete.statut}
            isBrouillon={isBrouillon}
          />
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
            description={`${getTypeProprieteLabel(propriete.type)} - ${propriete.reference || 'Sans référence'} - ${getStatutLabel(propriete.statut)}${isBrouillon ? ' (Brouillon)' : ''}`}
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

        {/* Informations principales - 3-column grid like detail page */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <p className="font-medium" data-testid="property-address-display">
                  {propriete.adresse || 'Adresse non renseignée'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Code postal</p>
                  <p className="font-medium" data-testid="property-postal-code-display">{propriete.code_postal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ville</p>
                  <p className="font-medium" data-testid="property-city-display">{propriete.ville}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pays</p>
                <p className="font-medium" data-testid="property-country-display">
                  {formatCountryName(propriete.pays || 'FR')}
                </p>
              </div>
              {/* Adresse complète pour tests */}
              <div className="sr-only" data-testid="property-full-address">
                {formatFullAddress(propriete.adresse, propriete.code_postal, propriete.ville, propriete.pays)}
              </div>
            </CardContent>
          </Card>

          {/* Carte Caractéristiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-gray-500" />
                Caractéristiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Surface</p>
                  <p className="font-medium" data-testid="property-surface-display">
                    {propriete.surface_m2 ? `${propriete.surface_m2} m²` : 'Non spécifié'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pièces</p>
                  <p className="font-medium" data-testid="property-rooms-display">
                    {propriete.nombre_pieces || 'Non spécifié'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Chambres</p>
                  <p className="font-medium">
                    {propriete.nb_chambres || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SDB</p>
                  <p className="font-medium">
                    {propriete.nb_sdb || '-'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Étage</p>
                  <p className="font-medium">
                    {propriete.etage !== null && propriete.etage !== undefined ? propriete.etage : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Année</p>
                  <p className="font-medium">
                    {propriete.annee_construction || '-'}
                  </p>
                </div>
              </div>
              
              {/* Terrain et surfaces additionnelles */}
              {propriete.surface_terrain_m2 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Surface terrain</p>
                    <p className="font-medium">
                      {propriete.surface_terrain_m2} m²
                    </p>
                  </div>
                  {propriete.surface_totale && (
                    <div>
                      <p className="text-sm text-muted-foreground">Surface totale</p>
                      <p className="font-medium">
                        {propriete.surface_totale} m²
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Orientation et vue */}
              {(propriete.orientation || propriete.vue) && (
                <div className="grid grid-cols-2 gap-4">
                  {propriete.orientation && (
                    <div>
                      <p className="text-sm text-muted-foreground">Orientation</p>
                      <p className="font-medium">{propriete.orientation}</p>
                    </div>
                  )}
                  {propriete.vue && (
                    <div>
                      <p className="text-sm text-muted-foreground">Vue</p>
                      <p className="font-medium">{propriete.vue}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Luminosité */}
              {propriete.luminosite && (
                <div>
                  <p className="text-sm text-muted-foreground">Luminosité</p>
                  <p className="font-medium">{propriete.luminosite}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Carte Financier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-gray-500" />
                Informations financières
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Prix d'achat</p>
                <p className="font-medium text-lg" data-testid="property-purchase-price-display">
                  {propriete.prix_achat ? formatCurrency(propriete.prix_achat) : 'Non spécifié'}
                </p>
              </div>
              
              {propriete.frais_notaire && (
                <div>
                  <p className="text-sm text-muted-foreground">Frais de notaire</p>
                  <p className="font-medium" data-testid="property-frais-notaire-display">
                    {formatCurrency(propriete.frais_notaire)}
                  </p>
                </div>
              )}
              
              {propriete.frais_annexes && (
                <div>
                  <p className="text-sm text-muted-foreground">Frais annexes</p>
                  <p className="font-medium" data-testid="property-frais-annexes-display">
                    {formatCurrency(propriete.frais_annexes)}
                  </p>
                </div>
              )}
              
              {(propriete.prix_achat || propriete.frais_notaire || propriete.frais_annexes) && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm text-muted-foreground">Total investissement</p>
                  <p className="font-bold text-lg text-[#D4841A]" data-testid="property-total-investment-display">
                    {formatCurrency((propriete.prix_achat || 0) + (propriete.frais_notaire || 0) + (propriete.frais_annexes || 0))}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Loyer mensuel</p>
                <p className="font-medium" data-testid="property-rent-display">
                  {propriete.loyer ? formatCurrency(propriete.loyer) : 'Non spécifié'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Charges</p>
                <p className="font-medium" data-testid="property-charges-display">
                  {propriete.charges ? formatCurrency(propriete.charges) : 'Non spécifié'}
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
        <Tabs defaultValue="quotites" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
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

          {/* Section Quotités */}
          <TabsContent value="quotites" className="mt-6">
            <Suspense fallback={<div>Chargement...</div>}>
              <QuotitesManagerV2
                proprieteId={resolvedParams.id}
                initialQuotites={quotites || []}
                initialStats={quotitesStats || null}
                proprieteFinancials={{
                  prix_achat: propriete.prix_achat,
                  frais_notaire: propriete.frais_notaire,
                  frais_annexes: propriete.frais_annexes
                }}
              />
            </Suspense>
          </TabsContent>

          {/* Section Photos */}
          <TabsContent value="photos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Galerie photos</CardTitle>
                <CardDescription>
                  Gérez les photos de la propriété par catégorie
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
                  Documents et pièces jointes liés à la propriété
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
              <p className="text-gray-700 whitespace-pre-wrap" data-testid="property-description-display">
                {propriete.description}
              </p>
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