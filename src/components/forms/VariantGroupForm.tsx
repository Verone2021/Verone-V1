/**
 * 🎨 VariantGroupForm - Formulaire pour groupes de variantes
 *
 * Formulaire pour créer/modifier des groupes de variantes
 * Compatible Google Merchant Center 2024
 */

"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Save, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  sku: string
  price_ht: number
}

interface VariantGroup {
  id: string
  name: string
  description?: string
  base_product_id: string | null
  item_group_id: string
  variant_type: 'color' | 'size' | 'material' | 'pattern'
  is_active: boolean
  created_at: string
  updated_at: string
}

interface VariantGroupFormData {
  name: string
  description: string
  base_product_id: string
  variant_type: 'color' | 'size' | 'material' | 'pattern'
  is_active: boolean
}

interface VariantGroupFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (group: VariantGroup) => void
  initialData?: VariantGroup | null
  mode: 'create' | 'edit'
  availableProducts?: Product[]
}

export function VariantGroupForm({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  mode,
  availableProducts = []
}: VariantGroupFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>(availableProducts)

  // État du formulaire
  const [formData, setFormData] = useState<VariantGroupFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    base_product_id: initialData?.base_product_id || '',
    variant_type: initialData?.variant_type || 'color',
    is_active: initialData?.is_active ?? true
  })

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        description: initialData?.description || '',
        base_product_id: initialData?.base_product_id || '',
        variant_type: initialData?.variant_type || 'color',
        is_active: initialData?.is_active ?? true
      })
    }
  }, [isOpen, initialData])

  // Charger les produits disponibles si pas fournis
  useEffect(() => {
    const fetchProducts = async () => {
      if (availableProducts.length === 0 && isOpen) {
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('products')
            .select('id, name, sku, price_ht')
            .is('variant_group_id', null)
            .is('archived_at', null)
            .eq('status', 'in_stock')
            .neq('creation_mode', 'sourcing')
            .order('created_at', { ascending: false })
            .limit(5)

          if (error) throw error
          setProducts(data || [])
        } catch (error) {
          console.error('Error fetching products:', error)
        }
      }
    }

    fetchProducts()
  }, [isOpen, availableProducts])

  // Génération d'un item_group_id unique pour Google Merchant Center
  const generateItemGroupId = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `VG-${timestamp}-${random}`.toUpperCase()
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({
        title: "❌ Nom requis",
        description: "Le nom du groupe de variantes est obligatoire",
        variant: "destructive"
      })
      return
    }

    if (!formData.base_product_id) {
      toast({
        title: "❌ Produit de base requis",
        description: "Vous devez sélectionner un produit de base pour le groupe",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      const groupData = {
        ...formData,
        item_group_id: mode === 'create' ? generateItemGroupId() : initialData?.item_group_id
      }

      let result

      if (mode === 'create') {
        const { data, error } = await supabase
          .from('variant_groups')
          .insert([groupData])
          .select()
          .single()

        if (error) throw error
        result = data

        toast({
          title: "✅ Groupe de variantes créé",
          description: `Le groupe "${formData.name}" a été créé avec l'ID: ${result.item_group_id}`
        })
      } else {
        const { data, error } = await supabase
          .from('variant_groups')
          .update({
            ...groupData,
            updated_at: new Date().toISOString()
          })
          .eq('id', initialData!.id)
          .select()
          .single()

        if (error) throw error
        result = data

        toast({
          title: "✅ Groupe de variantes modifié",
          description: `Le groupe "${formData.name}" a été mis à jour`
        })
      }

      onSubmit(result as VariantGroup)
      onClose()

    } catch (error: any) {
      console.error('Form submission error:', error)
      toast({
        title: "❌ Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const title = mode === 'create' ? 'Nouveau groupe de variantes' : 'Modifier le groupe de variantes'
  const selectedProduct = products.find(p => p.id === formData.base_product_id)

  // Types de variantes supportés par Google Merchant Center 2024
  const variantTypes = [
    { value: 'color', label: 'Couleur', description: 'Variantes par couleur (rouge, bleu, vert...)' },
    { value: 'size', label: 'Taille', description: 'Variantes par taille (S, M, L, XL...)' },
    { value: 'material', label: 'Matériau', description: 'Variantes par matériau (cuir, tissu, métal...)' },
    { value: 'pattern', label: 'Motif', description: 'Variantes par motif (rayé, uni, fleuri...)' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-black">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nom du groupe */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">
              Nom du groupe de variantes*
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Chaise Scandinave, Table Bois Massif..."
              className="border-gray-300 focus:border-black"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-black">
              Description du groupe
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description de ce groupe de variantes..."
              className="border-gray-300 focus:border-black resize-none"
              rows={3}
            />
          </div>

          {/* Produit de base */}
          <div className="space-y-2">
            <Label className="text-black">
              Produit de base*
            </Label>
            {mode === 'edit' && selectedProduct ? (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-900">
                  {selectedProduct.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  SKU: {selectedProduct.sku} • Prix: {selectedProduct.price_ht}€ HT
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le produit de base ne peut pas être modifié après création pour préserver la cohérence du groupe.
                </p>
              </div>
            ) : (
              <Select
                value={formData.base_product_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, base_product_id: value }))}
                required
              >
                <SelectTrigger className="border-gray-300 focus:border-black">
                  <SelectValue placeholder="Sélectionnez un produit de base..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Type de variante */}
          <div className="space-y-2">
            <Label className="text-black">Type de variante*</Label>
            <Select
              value={formData.variant_type}
              onValueChange={(value: 'color' | 'size' | 'material' | 'pattern') =>
                setFormData(prev => ({ ...prev, variant_type: value }))}
              required
            >
              <SelectTrigger className="border-gray-300 focus:border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variantTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Types compatibles Google Merchant Center 2024 uniquement
            </p>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label className="text-black">Statut</Label>
            <Select
              value={formData.is_active ? 'active' : 'inactive'}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                is_active: value === 'active'
              }))}
            >
              <SelectTrigger className="border-gray-300 focus:border-black">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Informations Google Merchant Center */}
          {mode === 'edit' && initialData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Informations Google Merchant Center</h4>
              <div className="text-sm text-blue-700">
                <p><strong>Item Group ID:</strong> {initialData.item_group_id}</p>
                <p><strong>Type:</strong> {variantTypes.find(t => t.value === initialData.variant_type)?.label}</p>
                <p className="text-xs mt-2">Cet ID sera utilisé pour regrouper les variantes dans Google Merchant Center</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-300 hover:bg-gray-50"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {mode === 'create' ? 'Créer' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}