'use client'

import React, { useState } from 'react'
import { Plus, Package, AlertTriangle, RefreshCw } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useCatalogue } from '@/hooks/use-catalogue'
import { formatPrice } from '@/lib/utils'

interface ProductCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ProductCreationModal({ isOpen, onClose, onSuccess }: ProductCreationModalProps) {
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [priceHt, setPriceHt] = useState('')
  const [description, setDescription] = useState('')
  const [minStockLevel, setMinStockLevel] = useState('5')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { toast } = useToast()
  const { createProduct } = useCatalogue()

  // Validation en temps réel
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = 'Le nom du produit est obligatoire'
    }

    if (!sku.trim()) {
      newErrors.sku = 'Le SKU est obligatoire'
    } else if (sku.length < 3) {
      newErrors.sku = 'Le SKU doit contenir au moins 3 caractères'
    }

    if (!priceHt || parseFloat(priceHt) <= 0) {
      newErrors.priceHt = 'Le prix HT doit être supérieur à 0'
    }

    if (!minStockLevel || parseInt(minStockLevel) < 0) {
      newErrors.minStockLevel = 'Le seuil de stock doit être positif'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast({
        title: "Erreurs de validation",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Générer automatiquement le SKU si besoin
      const finalSku = sku.toUpperCase().replace(/\s+/g, '-')

      // Calculer le prix TTC (TVA 20%)
      const priceHtValue = parseFloat(priceHt)
      const priceTtc = priceHtValue * 1.2

      const productData = {
        name: name.trim(),
        sku: finalSku,
        description: description.trim() || undefined,
        price_ht: priceHtValue,
        price_ttc: priceTtc,
        min_stock: parseInt(minStockLevel),
        stock_real: 0, // Nouveau produit commence avec 0 stock
        category: 'general', // Catégorie par défaut
        status: 'active' as const,
        variant_attributes: {},
        dimensions: {},
        weight: null
      }

      console.log('Création produit:', productData)

      await createProduct(productData)

      // Réinitialiser le formulaire
      resetForm()
      onSuccess()
      onClose()

      toast({
        title: "✅ Produit créé",
        description: `${name} a été ajouté au catalogue avec succès`
      })

    } catch (error: any) {
      console.error('❌ Erreur création produit:', error)

      // Gestion des erreurs spécifiques
      let errorMessage = "Impossible de créer le produit"

      if (error.code === '23505') {
        errorMessage = "Ce SKU existe déjà. Veuillez en choisir un autre."
        setErrors({ sku: "SKU déjà existant" })
      } else if (error.message?.includes('sku_check')) {
        errorMessage = "Le SKU doit contenir au moins 3 caractères"
        setErrors({ sku: "SKU trop court" })
      }

      toast({
        title: "❌ Erreur",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setName('')
    setSku('')
    setPriceHt('')
    setDescription('')
    setMinStockLevel('5')
    setErrors({})
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  // Auto-génération SKU basé sur le nom
  const generateSku = () => {
    if (name && !sku) {
      const generatedSku = name
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 20)
      setSku(generatedSku)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Ajouter un nouveau produit
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du produit */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du produit <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErrors(prev => ({ ...prev, name: '' }))
              }}
              onBlur={generateSku}
              placeholder="Nom du produit..."
              className={errors.name ? 'border-red-500' : ''}
              required
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku">
              SKU (Code produit) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="sku"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value)
                  setErrors(prev => ({ ...prev, sku: '' }))
                }}
                placeholder="SKU-PRODUIT"
                className={errors.sku ? 'border-red-500' : ''}
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateSku}
                disabled={!name}
              >
                Auto
              </ButtonV2>
            </div>
            {errors.sku && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.sku}
              </p>
            )}
          </div>

          {/* Prix HT */}
          <div className="space-y-2">
            <Label htmlFor="priceHt">
              Prix HT <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="priceHt"
                type="number"
                step="0.01"
                min="0"
                value={priceHt}
                onChange={(e) => {
                  setPriceHt(e.target.value)
                  setErrors(prev => ({ ...prev, priceHt: '' }))
                }}
                placeholder="0.00"
                className={`pr-8 ${errors.priceHt ? 'border-red-500' : ''}`}
                required
              />
              <span className="absolute right-3 top-2.5 text-sm text-gray-500">€</span>
            </div>
            {priceHt && (
              <p className="text-sm text-gray-600">
                Prix TTC: {formatPrice(parseFloat(priceHt) * 1.2)}
              </p>
            )}
            {errors.priceHt && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.priceHt}
              </p>
            )}
          </div>

          {/* Description courte */}
          <div className="space-y-2">
            <Label htmlFor="description">Description courte (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description rapide du produit..."
              rows={2}
            />
          </div>

          {/* Seuil de stock */}
          <div className="space-y-2">
            <Label htmlFor="minStockLevel">Seuil de stock minimum</Label>
            <Input
              id="minStockLevel"
              type="number"
              min="0"
              value={minStockLevel}
              onChange={(e) => {
                setMinStockLevel(e.target.value)
                setErrors(prev => ({ ...prev, minStockLevel: '' }))
              }}
              className={errors.minStockLevel ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500">
              Alerte lorsque le stock descend sous ce seuil
            </p>
            {errors.minStockLevel && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {errors.minStockLevel}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Annuler
            </ButtonV2>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Créer le produit
            </ButtonV2>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}