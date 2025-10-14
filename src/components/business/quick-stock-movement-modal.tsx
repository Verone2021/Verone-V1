'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Minus, Settings, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useStockMovements } from '@/hooks/use-stock-movements'
import { useToast } from '@/hooks/use-toast'

interface QuickStockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  productId?: string
  productName?: string
  currentStock?: number
}

export function QuickStockMovementModal({
  isOpen,
  onClose,
  onSuccess,
  productId: initialProductId,
  productName: initialProductName,
  currentStock: initialCurrentStock
}: QuickStockMovementModalProps) {
  const [movementType, setMovementType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN')
  const [productId, setProductId] = useState(initialProductId || '')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [reasonCode, setReasonCode] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { addStock, removeStock, adjustStock, getReasonsByCategory } = useStockMovements()
  const { toast } = useToast()
  const reasons = getReasonsByCategory()

  useEffect(() => {
    if (initialProductId) {
      setProductId(initialProductId)
    }
  }, [initialProductId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!productId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un produit",
        variant: "destructive"
      })
      return
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Erreur",
        description: "La quantité doit être supérieure à 0",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      const qty = parseFloat(quantity)

      switch (movementType) {
        case 'IN':
          await addStock(productId, qty, undefined, notes || undefined)
          break
        case 'OUT':
          await removeStock(productId, qty, reasonCode || 'manual_entry', undefined, notes || undefined)
          break
        case 'ADJUST':
          await adjustStock(productId, qty, notes || undefined)
          break
      }

      toast({
        title: "Succès",
        description: `Mouvement de stock enregistré avec succès${initialCurrentStock !== undefined ? `. Stock actuel : ${initialCurrentStock}` : ''}`,
      })

      // Reset form
      setQuantity('')
      setNotes('')
      setReasonCode('')

      onSuccess()
      onClose()
    } catch (error: any) {
      // L'erreur est déjà gérée par le hook avec un toast
      console.error('Erreur mouvement stock:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getReasonOptions = () => {
    switch (movementType) {
      case 'OUT':
        return [
          ...reasons.sorties_normales,
          ...reasons.pertes_degradations,
          ...reasons.usage_commercial
        ]
      case 'IN':
        return reasons.entrees_speciales
      case 'ADJUST':
        return reasons.ajustements
      default:
        return []
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Mouvement de Stock Rapide
          </DialogTitle>
          <DialogDescription>
            {initialProductName ? (
              <span className="font-medium">
                Produit : {initialProductName}
                {initialCurrentStock !== undefined && (
                  <span className="text-black ml-2">
                    (Stock actuel : {initialCurrentStock} unités)
                  </span>
                )}
              </span>
            ) : (
              "Ajoutez, retirez ou ajustez rapidement le stock d'un produit"
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs value={movementType} onValueChange={(v) => setMovementType(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="IN" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </TabsTrigger>
              <TabsTrigger value="OUT" className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Retirer
              </TabsTrigger>
              <TabsTrigger value="ADJUST" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Ajuster
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 space-y-4">
              <TabsContent value="IN" className="space-y-4 m-0">
                <div>
                  <Label htmlFor="quantity-in">Quantité à ajouter *</Label>
                  <Input
                    id="quantity-in"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 10"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ajoutez du stock lors d'une réception fournisseur ou retour client
                  </p>
                </div>

                <div>
                  <Label htmlFor="reason-in">Motif (optionnel)</Label>
                  <Select value={reasonCode} onValueChange={setReasonCode}>
                    <SelectTrigger id="reason-in" className="mt-1">
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {getReasonOptions().map((reason) => (
                        <SelectItem key={reason.code} value={reason.code}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="OUT" className="space-y-4 m-0">
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-900">
                    ⚠️ Vous ne pouvez pas retirer plus que la quantité disponible en stock
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity-out">Quantité à retirer *</Label>
                  <Input
                    id="quantity-out"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 5"
                    required
                    className="mt-1"
                  />
                  {initialCurrentStock !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum disponible : {initialCurrentStock} unités
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reason-out">Motif de sortie (optionnel)</Label>
                  <Select value={reasonCode} onValueChange={setReasonCode}>
                    <SelectTrigger id="reason-out" className="mt-1">
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {getReasonOptions().map((reason) => (
                        <SelectItem key={reason.code} value={reason.code}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="ADJUST" className="space-y-4 m-0">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    ℹ️ L'ajustement définit la nouvelle quantité totale en stock (pas une différence)
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity-adjust">Nouvelle quantité totale *</Label>
                  <Input
                    id="quantity-adjust"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Ex: 15"
                    required
                    className="mt-1"
                  />
                  {initialCurrentStock !== undefined && (
                    <p className="text-xs text-gray-500 mt-1">
                      Stock actuel : {initialCurrentStock} unités → Nouvelle quantité : {quantity || '0'} unités
                      {quantity && (
                        <span className={`ml-2 font-medium ${
                          parseFloat(quantity) > initialCurrentStock ? 'text-green-600' :
                          parseFloat(quantity) < initialCurrentStock ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          ({parseFloat(quantity) > initialCurrentStock ? '+' : ''}
                          {parseFloat(quantity) - initialCurrentStock})
                        </span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="reason-adjust">Motif d'ajustement (optionnel)</Label>
                  <Select value={reasonCode} onValueChange={setReasonCode}>
                    <SelectTrigger id="reason-adjust" className="mt-1">
                      <SelectValue placeholder="Sélectionner un motif" />
                    </SelectTrigger>
                    <SelectContent>
                      {getReasonOptions().map((reason) => (
                        <SelectItem key={reason.code} value={reason.code}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <div>
                <Label htmlFor="notes">Notes (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des détails sur ce mouvement..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="border-black text-black hover:bg-gray-100"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-black text-white hover:bg-gray-800"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer le mouvement'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
