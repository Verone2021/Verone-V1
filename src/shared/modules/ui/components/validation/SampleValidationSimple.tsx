"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle,
  X,
  Eye,
  AlertTriangle,
  Loader2,
  Package,
  Building,
  Euro,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSourcingProducts } from '@/shared/modules/products/hooks'
import { useToast } from '@/shared/modules/common/hooks'

export function SampleValidationSimple() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    products,
    loading,
    approveSample,
    rejectSample
  } = useSourcingProducts({
    status: 'echantillon_commande' // Filtre produits échantillon commandés
  })

  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false)

  // Approuver échantillon
  const handleApprove = async (productId: string) => {
    const success = await approveSample(productId)
    if (success) {
      toast({
        title: "Échantillon approuvé",
        description: "Le produit a été transféré au catalogue"
      })
    }
  }

  // Rejeter échantillon
  const handleReject = async () => {
    if (!selectedProduct) return

    const success = await rejectSample(selectedProduct.id, rejectionReason)
    if (success) {
      setRejectionDialogOpen(false)
      setSelectedProduct(null)
      setRejectionReason('')
    }
  }

  // Badge statut
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'echantillon_commande':
        return <Badge variant="outline" className="border-blue-300 text-blue-600">Échantillon commandé</Badge>
      case 'in_stock':
        return <Badge variant="outline" className="border-green-300 text-green-600">En stock</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-black">
        <CardHeader>
          <CardTitle className="text-black">Validation Échantillons ({products.length})</CardTitle>
          <CardDescription>
            Échantillons commandés en attente de validation physique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun échantillon en attente de validation</p>
                <p className="text-sm text-gray-500">Les échantillons commandés apparaîtront ici</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                  {/* En-tête produit */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-black text-lg">{product.name}</h3>
                        {getStatusBadge(product.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        SKU: {product.sku} • Créé le {new Date(product.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/catalogue/${product.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </ButtonV2>
                    </div>
                  </div>

                  {/* Informations produit */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {product.supplier && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Fournisseur:</span>
                        <span className="font-medium text-black">{product.supplier.name}</span>
                      </div>
                    )}
                    {product.cost_price && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Euro className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Prix achat:</span>
                        <span className="font-medium text-black">{product.cost_price}€ HT</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">Échantillon requis:</span>
                      <span className={product.requires_sample ? "text-black font-medium" : "text-gray-500"}>
                        {product.requires_sample ? "Oui" : "Non"}
                      </span>
                    </div>
                  </div>

                  {/* Actions validation */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Échantillon reçu - Validation qualité requise
                    </div>
                    <div className="flex space-x-2">
                      <ButtonV2
                        variant="outline"
                        size="sm"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setSelectedProduct(product)
                          setRejectionDialogOpen(true)
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Rejeter
                      </ButtonV2>
                      <ButtonV2
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApprove(product.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approuver
                      </ButtonV2>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog rejet échantillon */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter l'échantillon</DialogTitle>
            <DialogDescription>
              Le produit sera archivé automatiquement et ne pourra pas être désarchivé.
              Vous pourrez uniquement le supprimer ou le dupliquer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Action irréversible</p>
                  <p>Le produit sera définitivement archivé avec la mention "Échantillon rejeté"</p>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Raison du rejet (optionnel)
              </label>
              <Textarea
                placeholder="Qualité insuffisante, dimensions incorrectes, couleur non conforme..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="border-gray-300 focus:ring-red-500 focus:border-red-500"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => {
                setRejectionDialogOpen(false)
                setSelectedProduct(null)
                setRejectionReason('')
              }}
            >
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="destructive"
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirmer le rejet
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
