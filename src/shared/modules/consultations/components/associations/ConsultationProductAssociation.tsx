'use client'

import { useState } from 'react'
import { Link, Euro, FileText, Star, Save, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '../../hooks/use-toast'
import { ProductSelector } from './product-selector'

interface Product {
  id: string
  name: string
  sku: string
  status: string
  creation_mode: string
  requires_sample: boolean
  supplier_name?: string
  product_type: string
  assigned_client_id?: string
}

interface ConsultationProductAssociationProps {
  consultationId: string
  consultationName: string
  onAssociationCreated?: () => void
  onCancel?: () => void
  className?: string
}

export function ConsultationProductAssociation({
  consultationId,
  consultationName,
  onAssociationCreated,
  onCancel,
  className
}: ConsultationProductAssociationProps) {
  const { toast } = useToast()
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [proposedPrice, setProposedPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [isPrimaryProposal, setIsPrimaryProposal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedProduct) {
      newErrors.product = 'Veuillez sélectionner un produit'
    }

    if (proposedPrice && (isNaN(parseFloat(proposedPrice)) || parseFloat(proposedPrice) <= 0)) {
      newErrors.proposedPrice = 'Le prix doit être un nombre positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Créer l'association
  const handleCreateAssociation = async () => {
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/consultations/associations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          consultation_id: consultationId,
          product_id: selectedProduct!.id,
          proposed_price: proposedPrice ? parseFloat(proposedPrice) : null,
          notes: notes.trim() || null,
          is_primary_proposal: isPrimaryProposal
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de l\'association')
      }

      toast({
        title: "Association créée",
        description: `${selectedProduct!.name} a été ajouté à la consultation ${consultationName}`
      })

      // Reset form
      setSelectedProduct(null)
      setProposedPrice('')
      setNotes('')
      setIsPrimaryProposal(false)
      setErrors({})

      onAssociationCreated?.()

    } catch (error) {
      console.error('Erreur création association:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'association",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Link className="h-5 w-5 mr-2" />
            Associer un produit à la consultation
          </CardTitle>
          <CardDescription>
            Consultation : <strong>{consultationName}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Sélecteur de produit */}
        <ProductSelector
          consultationId={consultationId}
          onProductSelect={setSelectedProduct}
          selectedProductId={selectedProduct?.id}
        />

        {/* Détails de l'association */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Détails de la proposition
            </CardTitle>
            <CardDescription>
              Configurez les conditions de cette association
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Produit sélectionné */}
            {selectedProduct ? (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Produit sélectionné :</div>
                    <div className="text-sm">
                      <div><strong>{selectedProduct.name}</strong></div>
                      <div className="text-gray-600">SKU: {selectedProduct.sku}</div>
                      <div className="text-gray-600">Statut: {selectedProduct.status}</div>
                      {selectedProduct.supplier_name && (
                        <div className="text-gray-600">Fournisseur: {selectedProduct.supplier_name}</div>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  <div className="text-gray-600">
                    👈 Sélectionnez un produit pour commencer
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {errors.product && (
              <Alert variant="destructive">
                <AlertDescription>{errors.product}</AlertDescription>
              </Alert>
            )}

            {/* Prix proposé */}
            <div className="space-y-2">
              <Label htmlFor="proposedPrice" className="flex items-center">
                <Euro className="h-4 w-4 mr-1" />
                Prix proposé (€ HT) - Optionnel
              </Label>
              <Input
                id="proposedPrice"
                type="number"
                step="0.01"
                min="0"
                value={proposedPrice}
                onChange={(e) => {
                  setProposedPrice(e.target.value)
                  if (errors.proposedPrice) {
                    setErrors(prev => ({ ...prev, proposedPrice: '' }))
                  }
                }}
                placeholder="Prix personnalisé pour cette consultation..."
                className={`border-black ${errors.proposedPrice ? 'border-red-500' : ''}`}
                disabled={!selectedProduct}
              />
              {errors.proposedPrice && (
                <p className="text-sm text-red-500">{errors.proposedPrice}</p>
              )}
              <p className="text-xs text-gray-600">
                Laissez vide pour utiliser le prix standard du produit
              </p>
            </div>

            {/* Notes commerciales */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes commerciales - Optionnel</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajustements, conditions spéciales, remarques pour le client..."
                rows={3}
                className="border-black resize-none"
                disabled={!selectedProduct}
              />
              <p className="text-xs text-gray-600">
                Ces notes seront visibles lors de la génération du devis
              </p>
            </div>

            {/* Proposition principale */}
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="space-y-1">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2 text-gray-900" />
                  <Label htmlFor="isPrimary">Proposition principale</Label>
                </div>
                <p className="text-xs text-gray-600">
                  Une seule proposition principale par consultation
                </p>
              </div>
              <Switch
                id="isPrimary"
                checked={isPrimaryProposal}
                onCheckedChange={setIsPrimaryProposal}
                disabled={!selectedProduct}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              {onCancel && (
                <ButtonV2
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 border-black text-black hover:bg-black hover:text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </ButtonV2>
              )}

              <ButtonV2
                onClick={handleCreateAssociation}
                disabled={loading || !selectedProduct}
                className="flex-1 bg-black hover:bg-gray-800 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer l'association
                  </>
                )}
              </ButtonV2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations workflow */}
      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium">ℹ️ Règles d'association :</div>
            <div className="text-sm space-y-1">
              <p>• <strong>Produits catalogue</strong> : Disponibles pour toutes les consultations</p>
              <p>• <strong>Produits sourcing interne</strong> : Disponibles pour toutes les consultations</p>
              <p>• <strong>Produits sourcing client</strong> : Disponibles uniquement pour ce client</p>
              <p>• <strong>Prix personnalisé</strong> : Remplace le prix standard pour cette consultation</p>
              <p>• <strong>Échantillons</strong> : Recommandés mais non bloquants pour l'association</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}