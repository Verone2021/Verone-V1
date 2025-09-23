"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Package,
  AlertCircle,
  Eye,
  ExternalLink,
  User,
  Building,
  Clock,
  DollarSign
} from 'lucide-react'
import { Button } from '../../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card'
import { Badge } from '../../../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../../../components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../components/ui/tabs'
import { useDrafts } from '../../../../../hooks/use-drafts'
import { useToast } from '../../../../../hooks/use-toast'

export default function SourcingProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { drafts, loading, loadDrafts, updateSampleRequirement, validateDraft, finalizeToProduct } = useDrafts()

  const productId = params.productId as string
  const [product, setProduct] = useState<any>(null)

  useEffect(() => {
    loadDrafts()
  }, [])

  useEffect(() => {
    if (drafts && drafts.length > 0) {
      const foundProduct = drafts.find(d => d.id === productId && d.creation_mode === 'sourcing')
      setProduct(foundProduct || null)
    }
  }, [drafts, productId])

  const handleToggleSample = async (currentState: boolean) => {
    try {
      await updateSampleRequirement(productId, !currentState)
      toast({
        title: "Échantillonnage mis à jour",
        description: `Le produit ${!currentState ? 'nécessite maintenant' : 'ne nécessite plus'} d'échantillon`
      })
      // Reload product data
      loadDrafts()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'exigence d'échantillonnage",
        variant: "destructive"
      })
    }
  }

  const handleValidateToSample = async () => {
    try {
      await updateSampleRequirement(productId, true)
      toast({
        title: "Produit envoyé vers échantillons",
        description: "Le produit a été marqué comme nécessitant un échantillon et sera disponible dans la section échantillons"
      })
      // Redirect to samples section after validation
      router.push('/catalogue/echantillons')
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de valider vers échantillons",
        variant: "destructive"
      })
    }
  }

  const handleValidateToCatalog = async () => {
    try {
      await finalizeToProduct(productId)
      toast({
        title: "Produit finalisé et ajouté au catalogue",
        description: "Le produit sourcing a été transféré avec succès vers le catalogue principal"
      })
      // Redirect to catalog after finalization
      router.push('/catalogue')
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de finaliser le produit sourcing",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du produit sourcing...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Produit sourcing non trouvé</h3>
            <p className="text-gray-600 mb-4">
              Ce produit n'existe pas ou n'est plus en mode sourcing.
            </p>
            <Button onClick={() => router.push('/catalogue/sourcing')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au sourcing
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/catalogue/sourcing')}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au sourcing
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Détail Sourcing</h1>
                <p className="text-gray-600">Validation et gestion du produit en sourcing</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/catalogue/edit/${productId}`)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Product Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{product.name || 'Produit sans nom'}</CardTitle>
                <CardDescription className="mt-1">
                  SKU: {product.sku || 'Non défini'} • Créé le {new Date(product.created_at).toLocaleDateString('fr-FR')}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={product.sourcing_type === 'interne' ? 'default' : 'secondary'}>
                  {product.sourcing_type === 'interne' ? (
                    <>
                      <Building className="h-3 w-3 mr-1" />
                      Sourcing interne
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3 mr-1" />
                      Sourcing client
                    </>
                  )}
                </Badge>
                {product.requires_sample && (
                  <Badge variant="outline" className="border-purple-200 text-purple-700">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Échantillon requis
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {product.description && (
              <p className="text-gray-700 mb-4">{product.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.supplier_price && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Prix fournisseur</p>
                    <p className="font-medium">{product.supplier_price}€</p>
                  </div>
                </div>
              )}

              {product.estimated_selling_price && (
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Prix estimé vente</p>
                    <p className="font-medium">{product.estimated_selling_price}€</p>
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-600 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Dernière modification</p>
                  <p className="font-medium">{new Date(product.updated_at).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
            </div>

            {product.supplier_page_url && (
              <div className="mt-4">
                <a
                  href={product.supplier_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Voir chez le fournisseur
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Validation Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Actions de validation
            </CardTitle>
            <CardDescription>
              Choisissez la prochaine étape selon le workflow de validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sample requirement toggle */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Échantillon requis</h4>
                  <p className="text-sm text-gray-600">
                    Ce produit nécessite-t-il un échantillon pour validation ?
                  </p>
                </div>
                <Button
                  variant={product.requires_sample ? "default" : "outline"}
                  onClick={() => handleToggleSample(product.requires_sample)}
                >
                  {product.requires_sample ? 'Échantillon requis' : 'Pas d\'échantillon'}
                </Button>
              </div>

              {/* Validation options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <Package className="h-5 w-5 text-orange-600 mr-2" />
                      <h4 className="font-medium">Valider vers échantillons</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Marquer ce produit comme nécessitant un échantillon et l'envoyer vers la section échantillons.
                    </p>
                    <Button
                      onClick={handleValidateToSample}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      → Échantillons à commander
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-medium">Valider vers catalogue</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Valider directement ce produit et l'ajouter au catalogue principal.
                    </p>
                    <Button
                      onClick={handleValidateToCatalog}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      → Catalogue principal
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Workflow sourcing :</strong> Les produits en sourcing doivent être validés avant d'apparaître dans le catalogue.
            Si un échantillon est requis, le produit passera par la section échantillons avant validation finale.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}