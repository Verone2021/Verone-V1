"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  ShoppingCart,
  Eye,
  Edit,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  User,
  Building,
  Plus
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { useToast } from '../../../hooks/use-toast'
import { useProducts } from '../../../hooks/use-products'
import { useDrafts } from '../../../hooks/use-drafts'
import { PurchaseOrderFormModal } from '../../../components/business/purchase-order-form-modal'

export default function EchantillonsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { products, loading: productsLoading, loadProducts } = useProducts()
  const { drafts, loading: draftsLoading, loadDrafts, updateSampleRequirement, validateDraft } = useDrafts()

  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)

  useEffect(() => {
    loadProducts()
    loadDrafts()
  }, [])

  // Produits nécessitant des échantillons
  const sampleProducts = [
    // Produits finalisés avec requires_sample = true
    ...products.filter(p => p.requires_sample && !p.archived_at),
    // Brouillons avec requires_sample = true
    ...drafts.filter(d => d.requires_sample)
  ]

  // Séparer par statut
  const sampleDrafts = drafts.filter(d => d.requires_sample)
  const sampleFinalProducts = products.filter(p => p.requires_sample && !p.archived_at)

  // Actions
  const handleViewProduct = (product: any) => {
    if (product.creation_mode === 'sourcing') {
      router.push(`/catalogue/sourcing/products/${product.id}`)
    } else {
      router.push(`/catalogue/${product.id}`)
    }
  }

  const handleEditProduct = (product: any) => {
    if (product.status === 'draft' || product.wizard_step_completed !== undefined) {
      router.push(`/catalogue/edit/${product.id}`)
    } else {
      router.push(`/catalogue/${product.id}/edit`)
    }
  }

  const handleCreateOrder = (product: any) => {
    setSelectedProduct(product)
    setShowOrderModal(true)
  }

  const handleOrderSuccess = () => {
    toast({
      title: "Commande créée",
      description: "La commande fournisseur a été créée avec succès"
    })
    setShowOrderModal(false)
    setSelectedProduct(null)
  }

  const handleRemoveSampleRequirement = async (productId: string, isDraft: boolean) => {
    try {
      if (isDraft) {
        await updateSampleRequirement(productId, false)
      } else {
        // TODO: Implémenter updateProductSampleRequirement pour les produits finalisés
        toast({
          title: "Non implémenté",
          description: "La modification des produits finalisés n'est pas encore disponible",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Échantillonnage retiré",
        description: "Le produit ne nécessite plus d'échantillon"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'exigence d'échantillonnage",
        variant: "destructive"
      })
    }
  }

  const handleValidateToCatalog = async (productId: string) => {
    try {
      await validateDraft(productId)
      toast({
        title: "Produit validé",
        description: "Le produit a été ajouté au catalogue principal"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de valider le produit",
        variant: "destructive"
      })
    }
  }

  if (productsLoading || draftsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des échantillons...</p>
        </div>
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
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Échantillons à commander</h1>
                <p className="text-gray-600">Produits nécessitant un échantillon avant commande</p>
              </div>
            </div>

            <Button
              onClick={() => router.push('/catalogue/create')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total échantillons</p>
                  <p className="text-2xl font-bold">{sampleProducts.length}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En sourcing</p>
                  <p className="text-2xl font-bold">{sampleDrafts.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produits validés</p>
                  <p className="text-2xl font-bold">{sampleFinalProducts.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Commandes possibles</p>
                  <p className="text-2xl font-bold">
                    {sampleProducts.filter(p => p.supplier_id || p.supplier_page_url).length}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information sur le workflow */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Workflow échantillonnage :</div>
              <div className="text-sm space-y-1">
                <p>• <strong>Échantillon à commander :</strong> Produits marqués comme nécessitant un échantillon</p>
                <p>• <strong>Créer commande :</strong> Générer une commande fournisseur pré-remplie pour l'échantillon</p>
                <p>• <strong>Après réception :</strong> Valider le produit vers le catalogue principal ou ajuster</p>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Liste des produits */}
        {sampleProducts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucun échantillon à commander
              </h3>
              <p className="text-gray-600 mb-4">
                Tous vos produits sont soit validés, soit ne nécessitent pas d'échantillonnage.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/catalogue/sourcing')}
                >
                  Voir le sourcing
                </Button>
                <Button
                  onClick={() => router.push('/catalogue/create')}
                  className="bg-black hover:bg-gray-800 text-white"
                >
                  Nouveau produit
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sampleProducts.map((product) => {
              const isDraft = product.wizard_step_completed !== undefined || product.status === 'draft'
              const canCreateOrder = product.supplier_id || product.supplier_page_url

              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        {/* En-tête produit */}
                        <div className="flex items-start space-x-4">
                          {product.primary_image_url && (
                            <img
                              src={product.primary_image_url}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-black">
                              {product.name || 'Sans nom'}
                            </h3>
                            {product.supplier_page_url && (
                              <a
                                href={product.supplier_page_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm"
                              >
                                Voir chez le fournisseur →
                              </a>
                            )}
                            {product.cost_price && (
                              <p className="text-sm text-gray-600">
                                Prix d'achat : {product.cost_price}€ HT
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Badges et statut */}
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="border-purple-200 text-purple-700">
                            <Package className="h-3 w-3 mr-1" />
                            Échantillon requis
                          </Badge>

                          {isDraft ? (
                            <Badge variant="outline" className="border-orange-200 text-orange-700">
                              En sourcing
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-200 text-green-700">
                              Produit validé
                            </Badge>
                          )}

                          {product.assigned_client_id && (
                            <Badge variant="outline" className="border-blue-200 text-blue-700">
                              <User className="h-3 w-3 mr-1" />
                              Client spécifique
                            </Badge>
                          )}

                          {product.sourcing_type === 'interne' && (
                            <Badge variant="default">
                              <Building className="h-3 w-3 mr-1" />
                              Catalogue général
                            </Badge>
                          )}
                        </div>

                        {/* Métadonnées */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {product.lastModified || new Date(product.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          {!canCreateOrder && (
                            <div className="flex items-center text-orange-600">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Fournisseur manquant
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Éditer
                        </Button>

                        {canCreateOrder && (
                          <Button
                            size="sm"
                            onClick={() => handleCreateOrder(product)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Commander
                          </Button>
                        )}

                        {isDraft && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleValidateToCatalog(product.id)}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSampleRequirement(product.id, isDraft)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Retirer échantillon
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de création de commande */}
      {showOrderModal && selectedProduct && (
        <PurchaseOrderFormModal
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false)
            setSelectedProduct(null)
          }}
          onSuccess={handleOrderSuccess}
          prefilledProduct={selectedProduct}
          prefilledSupplier={selectedProduct.supplier_id}
        />
      )}
    </div>
  )
}