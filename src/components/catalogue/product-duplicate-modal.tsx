"use client"

import { useState, useEffect } from 'react'
import { Copy, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProductDuplication } from '@/hooks/use-product-duplication'
import type { Database } from '@/lib/supabase/types'

type Product = Database['public']['Tables']['products']['Row']

interface ProductDuplicateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceProduct: Product | null
  variantType: string // "color", "material", "size", etc.
  onSuccess?: (newProduct: Product) => void
}

export function ProductDuplicateModal({
  open,
  onOpenChange,
  sourceProduct,
  variantType,
  onSuccess
}: ProductDuplicateModalProps) {
  const [variantValue, setVariantValue] = useState('')
  const [costPrice, setCostPrice] = useState<number | ''>('')
  const { duplicateProduct, duplicating, error } = useProductDuplication()

  // Reset form when modal opens
  useEffect(() => {
    if (open && sourceProduct) {
      setVariantValue('')
      setCostPrice(sourceProduct.supplier_cost_price || '')
    }
  }, [open, sourceProduct])

  const handleDuplicate = async () => {
    if (!sourceProduct || !variantValue.trim()) return

    const newProduct = await duplicateProduct(sourceProduct.id, {
      variantValue: variantValue.trim(),
      supplierCostPrice: costPrice === '' ? undefined : Number(costPrice)
    })

    if (newProduct) {
      onSuccess?.(newProduct)
      onOpenChange(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && variantValue.trim()) {
      e.preventDefault()
      handleDuplicate()
    }
  }

  if (!sourceProduct) return null

  // Déterminer le label selon le type de variante
  const getVariantLabel = () => {
    switch (variantType) {
      case 'color':
        return 'Couleur'
      case 'material':
        return 'Matériau'
      case 'size':
        return 'Taille'
      case 'capacity':
        return 'Capacité'
      default:
        return 'Variante'
    }
  }

  const getPlaceholder = () => {
    switch (variantType) {
      case 'color':
        return 'Ex: Bleu Ciel'
      case 'material':
        return 'Ex: Coton'
      case 'size':
        return 'Ex: L'
      case 'capacity':
        return 'Ex: 128 Go'
      default:
        return 'Ex: Nouvelle variante'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Dupliquer le produit
          </DialogTitle>
          <DialogDescription>
            Créer une nouvelle variante basée sur <strong>{sourceProduct.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Valeur de variante */}
          <div className="space-y-2">
            <Label htmlFor="variant-value">
              {getVariantLabel()} *
            </Label>
            <Input
              id="variant-value"
              placeholder={getPlaceholder()}
              value={variantValue}
              onChange={(e) => setVariantValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Le nom et le SKU seront générés automatiquement
            </p>
          </div>

          {/* Prix d'achat (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="cost-price">
              Prix d'achat HT (optionnel)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="cost-price"
                type="number"
                step="0.01"
                min="0"
                placeholder={sourceProduct.supplier_cost_price?.toString() || '0'}
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Laissez vide pour hériter du produit source ({sourceProduct.supplier_cost_price}€)
            </p>
          </div>

          {/* Aperçu du nom généré */}
          {variantValue.trim() && (
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <p className="text-sm font-medium">✨ Aperçu :</p>
              <p className="text-sm text-muted-foreground">
                Nom : <span className="font-medium text-foreground">
                  {sourceProduct.name.split(' - ')[0]} - {variantValue.trim()}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Statut : <span className="font-medium text-foreground">Prêt à commander</span>
              </p>
            </div>
          )}

          {/* Erreur */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={duplicating}
          >
            Annuler
          </Button>
          <Button
            onClick={handleDuplicate}
            disabled={!variantValue.trim() || duplicating}
          >
            {duplicating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Duplication...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer le produit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
