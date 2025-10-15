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
  ExternalLink,
  User,
  Building,
  Clock,
  Euro,
  Globe
} from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSourcingProducts } from '@/hooks/use-sourcing-products'
import { useToast } from '@/hooks/use-toast'
import { EditSourcingProductModal } from '@/components/business/edit-sourcing-product-modal'
import { SupplierSelector } from '@/components/business/supplier-selector'

export default function SourcingProductDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { products, loading, validateSourcing, orderSample, updateSourcingProduct, refetch } = useSourcingProducts()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const productId = params.id as string
  const product = products.find(p => p.id === productId)

  const formatPrice = (price: number | null) => {
    if (!price) return 'Non défini'
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleOrderSample = async () => {
    try {
      await orderSample(productId)
      toast({
        title: "Échantillon commandé",
        description: "La demande d'échantillon a été enregistrée avec succès"
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de commander l'échantillon",
        variant: "destructive"
      })
    }
  }

  const handleValidateSourcing = async () => {
    try {
      await validateSourcing(productId)
      toast({
        title: "Sourcing validé",
        description: "Le produit a été validé et ajouté au catalogue"
      })
      router.push('/catalogue')
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de valider le sourcing",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Chargement du produit sourcing...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md border-black">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">Produit sourcing non trouvé</h3>
            <p className="text-gray-600 mb-4">
              Ce produit n'existe pas ou n'est plus en mode sourcing.
            </p>
            <Button
              onClick={() => router.push('/sourcing/produits')}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au sourcing
            </ButtonV2>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/sourcing/produits')}
                className="text-gray-600 hover:text-black"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au sourcing
              </ButtonV2>
              <div>
                <h1 className="text-3xl font-bold text-black">Détail Sourcing</h1>
                <p className="text-gray-600 mt-1">Validation et gestion du produit en sourcing</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(true)}
                className="border-black text-black hover:bg-black hover:text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Product Info Card */}
        <Card className="border-black">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl text-black">{product.name}</CardTitle>
                <CardDescription className="mt-2 text-base">
                  <span className="font-medium">SKU:</span> {product.sku} •
                  <span className="ml-2">Créé le {formatDate(product.created_at)}</span>
                </CardDescription>
              </div>
              <div className="flex flex-col items-end space-y-2">
                {product.sourcing_type === 'client' && (
                  <Badge variant="outline" className="border-blue-300 text-blue-600">
                    <User className="h-3 w-3 mr-1" />
                    Sourcing Client
                  </Badge>
                )}
                {product.sourcing_type === 'interne' && (
                  <Badge variant="outline" className="border-black text-black">
                    <Building className="h-3 w-3 mr-1" />
                    Sourcing Interne
                  </Badge>
                )}
                {product.requires_sample && (
                  <Badge variant="outline" className="border-gray-300 text-black">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Échantillon requis
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prix et informations financières */}
            {product.cost_price && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center mb-2">
                    <Euro className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-black">Prix d'achat fournisseur</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(product.cost_price)}</p>
                </div>

                {product.margin_percentage && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Euro className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium text-black">Marge configurée</h4>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{product.margin_percentage}%</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Prix de vente calculé: {formatPrice(product.cost_price * (1 + product.margin_percentage / 100))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Informations fournisseur */}
            {product.supplier && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-3">
                  <Building className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-black">Fournisseur</h4>
                </div>
                <p className="text-lg font-semibold text-blue-900 mb-3">{product.supplier.name}</p>

                <div className="flex flex-col space-y-2">
                  {/* Lien vers page détails fournisseur (navigation interne) */}
                  <a
                    href={`/contacts-organisations/suppliers/${product.supplier.id}`}
                    className="inline-flex items-center text-blue-600 hover:underline text-sm"
                  >
                    <Building className="h-4 w-4 mr-2" />
                    Voir la fiche fournisseur
                  </a>

                  {/* Site web général du fournisseur */}
                  {product.supplier.website && (
                    <a
                      href={product.supplier.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Site web du fournisseur
                    </a>
                  )}

                  {/* Lien vers URL externe fournisseur (page produit spécifique) */}
                  {product.supplier_page_url && (
                    <a
                      href={product.supplier_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:underline text-sm"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Page du produit chez le fournisseur
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Client assigné */}
            {product.assigned_client && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="font-medium text-black">Client assigné</h4>
                </div>
                <p className="text-lg font-semibold text-purple-900">
                  {product.assigned_client.name}
                  {product.assigned_client.type === 'client' ? ' (Client)' : ` (${product.assigned_client.type})`}
                </p>
              </div>
            )}

            {/* Métadonnées */}
            <div className="flex items-center text-sm text-gray-600 space-x-4 pt-4 border-t border-gray-200">
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>Dernière modification: {formatDate(product.updated_at)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validation Actions */}
        <Card className="border-black">
          <CardHeader>
            <CardTitle className="flex items-center text-black">
              <CheckCircle className="h-5 w-5 mr-2" />
              Actions de validation
            </CardTitle>
            <CardDescription>
              Choisissez la prochaine étape selon le workflow de validation sourcing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Commander échantillon */}
              <Card className="border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <Package className="h-6 w-6 text-black mr-2" />
                    <h4 className="font-semibold text-black">Demander un échantillon</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Marquer ce produit comme nécessitant un échantillon et créer une demande de commande.
                  </p>
                  <Button
                    onClick={handleOrderSample}
                    className="w-full bg-gray-100 hover:bg-gray-800 text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Commander échantillon
                  </ButtonV2>
                </CardContent>
              </Card>

              {/* Valider vers catalogue */}
              <Card className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                    <h4 className="font-semibold text-black">Valider le sourcing</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Valider ce produit sourcing et l'ajouter au catalogue principal.
                  </p>
                  <Button
                    onClick={handleValidateSourcing}
                    disabled={!product.supplier_id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {product.supplier_id ? 'Valider et ajouter au catalogue' : 'Fournisseur requis'}
                  </ButtonV2>
                </CardContent>
              </Card>
            </div>

            {/* Warning si pas de fournisseur */}
            {!product.supplier_id && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Fournisseur obligatoire :</strong> Vous devez lier un fournisseur à ce produit avant de pouvoir le valider vers le catalogue.
                </AlertDescription>
              </Alert>
            )}

            {/* Sélection fournisseur inline si absent */}
            {!product.supplier_id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <SupplierSelector
                  selectedSupplierId={null}
                  onSupplierChange={async (supplierId) => {
                    if (supplierId) {
                      await updateSourcingProduct(productId, { supplier_id: supplierId })
                    }
                  }}
                  label="Sélectionner un fournisseur pour activer la validation"
                  placeholder="Choisir un fournisseur..."
                  required={false}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Workflow sourcing :</strong> Les produits en sourcing doivent être validés avant d'apparaître dans le catalogue.
            Si un échantillon est requis, utilisez d'abord l'action "Demander un échantillon" avant la validation finale.
          </AlertDescription>
        </Alert>
      </div>

      {/* Modal d'édition */}
      {product && (
        <EditSourcingProductModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={product}
          onUpdate={updateSourcingProduct}
        />
      )}
    </div>
  )
}
