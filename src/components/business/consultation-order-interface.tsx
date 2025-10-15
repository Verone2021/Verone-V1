'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Minus,
  Trash2,
  Package,
  Euro,
  Calculator,
  Edit,
  Check,
  X
} from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useConsultationItems, ConsultationItem, CreateConsultationItemData } from '../../hooks/use-consultations'
import { useToast } from '../../hooks/use-toast'

interface ConsultationOrderInterfaceProps {
  consultationId: string
  onItemsChanged?: () => void
}

export function ConsultationOrderInterface({
  consultationId,
  onItemsChanged
}: ConsultationOrderInterfaceProps) {
  const { toast } = useToast()
  const {
    consultationItems,
    eligibleProducts,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    toggleFreeItem,
    calculateTotal,
    getTotalItemsCount
  } = useConsultationItems(consultationId)

  // État pour l'ajout de nouveaux produits
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [newQuantity, setNewQuantity] = useState(1)
  const [newPrice, setNewPrice] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newIsFree, setNewIsFree] = useState(false)

  // État pour l'édition inline
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState(1)
  const [editPrice, setEditPrice] = useState('')
  const [editNotes, setEditNotes] = useState('')

  // Gérer le changement d'items
  useEffect(() => {
    onItemsChanged?.()
  }, [consultationItems, onItemsChanged])

  // Ajouter un nouvel item
  const handleAddItem = async () => {
    if (!selectedProductId) {
      toast({
        title: "Produit requis",
        description: "Veuillez sélectionner un produit",
        variant: "destructive"
      })
      return
    }

    const data: CreateConsultationItemData = {
      consultation_id: consultationId,
      product_id: selectedProductId,
      quantity: newQuantity,
      unit_price: newIsFree ? 0 : (newPrice ? parseFloat(newPrice) : undefined),
      is_free: newIsFree,
      notes: newNotes || undefined
    }

    const success = await addItem(data)
    if (success) {
      // Reset form
      setSelectedProductId('')
      setNewQuantity(1)
      setNewPrice('')
      setNewNotes('')
      setNewIsFree(false)
      setShowAddForm(false)
    }
  }

  // Commencer l'édition d'un item
  const startEditItem = (item: ConsultationItem) => {
    setEditingItem(item.id)
    setEditQuantity(item.quantity)
    setEditPrice(item.unit_price?.toString() || '')
    setEditNotes(item.notes || '')
  }

  // Sauvegarder l'édition d'un item
  const saveEditItem = async (itemId: string) => {
    const success = await updateItem(itemId, {
      quantity: editQuantity,
      unit_price: editPrice ? parseFloat(editPrice) : undefined,
      notes: editNotes || undefined
    })

    if (success) {
      setEditingItem(null)
    }
  }

  // Annuler l'édition
  const cancelEditItem = () => {
    setEditingItem(null)
  }

  // Supprimer un item avec confirmation
  const handleRemoveItem = async (itemId: string, productName: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir retirer "${productName}" de la consultation ?`)) {
      await removeItem(itemId)
    }
  }

  // Changer la quantité rapidement
  const changeQuantity = async (itemId: string, delta: number) => {
    const item = consultationItems.find(i => i.id === itemId)
    if (!item) return

    const newQuantity = Math.max(1, item.quantity + delta)
    await updateItem(itemId, { quantity: newQuantity })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
            <span>Chargement des produits...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const total = calculateTotal()
  const totalItems = getTotalItemsCount()

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Produits de la consultation
              </CardTitle>
              <CardDescription>
                {totalItems} article{totalItems > 1 ? 's' : ''} • Total: {total.toFixed(2)}€ HT
              </CardDescription>
            </div>
            <ButtonV2
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un produit
            </ButtonV2>
          </div>
        </CardHeader>

        {/* Formulaire d'ajout */}
        {showAddForm && (
          <CardContent className="border-t bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="md:col-span-2">
                <Label>Produit</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-gray-500">
                            {product.sku} • {product.supplier_name}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min="1"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div>
                <Label>Prix unitaire</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    disabled={newIsFree}
                    placeholder="Auto"
                  />
                  <Euro className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-free"
                  checked={newIsFree}
                  onCheckedChange={(checked) => setNewIsFree(checked as boolean)}
                />
                <Label htmlFor="new-free">Gratuit</Label>
              </div>

              <div className="flex items-center space-x-2">
                <ButtonV2
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Ajouter
                </ButtonV2>
                <ButtonV2
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </ButtonV2>
              </div>
            </div>

            {/* Notes optionnelles */}
            <div className="mt-4">
              <Label>Notes (optionnelles)</Label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Remarques particulières..."
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Liste des produits */}
      <Card>
        <CardContent className="p-0">
          {consultationItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun produit dans cette consultation</p>
              <p className="text-sm">Utilisez le bouton "Ajouter un produit" pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr className="text-left">
                    <th className="p-4 font-medium">Produit</th>
                    <th className="p-4 font-medium text-center">Quantité</th>
                    <th className="p-4 font-medium text-right">Prix unitaire</th>
                    <th className="p-4 font-medium text-center">Gratuit</th>
                    <th className="p-4 font-medium text-right">Total</th>
                    <th className="p-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {consultationItems.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      {/* Produit */}
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{item.product?.name}</p>
                          <p className="text-sm text-gray-500">
                            {item.product?.sku}
                            {item.product?.supplier_name && ` • ${item.product.supplier_name}`}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-blue-600 mt-1">{item.notes}</p>
                          )}
                        </div>
                      </td>

                      {/* Quantité */}
                      <td className="p-4 text-center">
                        {editingItem === item.id ? (
                          <Input
                            type="number"
                            min="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                            className="w-20 mx-auto"
                          />
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => changeQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </ButtonV2>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <ButtonV2
                              variant="outline"
                              size="sm"
                              onClick={() => changeQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        )}
                      </td>

                      {/* Prix unitaire */}
                      <td className="p-4 text-right">
                        {editingItem === item.id ? (
                          <div className="relative inline-block">
                            <Input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 pr-8"
                              disabled={item.is_free}
                            />
                            <Euro className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          </div>
                        ) : (
                          <span className={item.is_free ? 'text-gray-400' : 'font-medium'}>
                            {item.is_free ? '-' : `${item.unit_price?.toFixed(2) || '0.00'}€`}
                          </span>
                        )}
                      </td>

                      {/* Gratuit */}
                      <td className="p-4 text-center">
                        <Checkbox
                          checked={item.is_free}
                          onCheckedChange={() => toggleFreeItem(item.id)}
                          disabled={editingItem === item.id}
                        />
                      </td>

                      {/* Total */}
                      <td className="p-4 text-right">
                        <span className="font-medium">
                          {item.is_free
                            ? <Badge variant="outline" className="text-green-600 border-green-600">Gratuit</Badge>
                            : `${((item.unit_price || 0) * item.quantity).toFixed(2)}€`
                          }
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        {editingItem === item.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              size="sm"
                              onClick={() => saveEditItem(item.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Check className="h-3 w-3" />
                            </ButtonV2>
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={cancelEditItem}
                            >
                              <X className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1">
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={() => startEditItem(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </ButtonV2>
                            <ButtonV2
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveItem(item.id, item.product?.name || 'ce produit')}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {/* Footer avec total */}
        {consultationItems.length > 0 && (
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Calculator className="h-4 w-4 mr-1" />
                  {totalItems} article{totalItems > 1 ? 's' : ''}
                </div>
                <div className="text-sm text-gray-600">
                  {consultationItems.filter(i => i.is_free).length} gratuit{consultationItems.filter(i => i.is_free).length > 1 ? 's' : ''}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total HT</p>
                <p className="text-2xl font-bold">{total.toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}