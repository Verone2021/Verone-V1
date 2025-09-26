"use client"

import { useState, useEffect } from 'react'
import { Settings, Save, Eye, AlertCircle, CheckCircle, FolderTree, FileText, Tags, Truck, Package, DollarSign, BarChart3 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { cn } from '../../lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useSubcategories } from '@/hooks/use-subcategories'

import { ProductImageGallery } from './product-image-gallery'
import { SampleRequirementSection } from './sample-requirement-section'
import { CategoryHierarchyModal } from './categorize-modal'
import { ProductCharacteristicsModal } from './product-characteristics-modal'
import { ProductDescriptionsModal } from './product-descriptions-modal'
import { ProductImagesModal } from './product-images-modal'

interface ProductEditModeProps {
  product: any
  onSwitchToView: () => void
  onUpdate: (updatedProduct: any) => void
  className?: string
}

export function ProductEditMode({ product, onSwitchToView, onUpdate, className }: ProductEditModeProps) {
  const supabase = createClient()
  const { subcategories } = useSubcategories()

  const [suppliers, setSuppliers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: product.name || '',
    slug: product.slug || '',
    subcategory_id: product.subcategory_id || '',
    supplier_id: product.supplier_id || '',
    cost_price: product.cost_price || '',
    selling_price: product.selling_price || '',
    margin_percentage: product.margin_percentage || '',
    tax_rate: product.tax_rate || 20,
    status: product.status || 'draft',
    condition: product.condition || 'new',
    stock_quantity: product.stock_quantity || 0,
    min_stock: product.min_stock || 0,
    sku: product.sku || '',
    brand: product.brand || '',
    gtin: product.gtin || '',
    dimensions_length: product.dimensions_length || '',
    dimensions_width: product.dimensions_width || '',
    dimensions_height: product.dimensions_height || '',
    dimensions_unit: product.dimensions_unit || 'cm',
    weight: product.weight || '',
    weight_unit: product.weight_unit || 'kg',
  })

  const [showCategorizeModal, setShowCategorizeModal] = useState(false)
  const [showCharacteristicsModal, setShowCharacteristicsModal] = useState(false)
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false)
  const [showImagesModal, setShowImagesModal] = useState(false)

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase
        .from('organisations')
        .select('id, name')
        .eq('type', 'supplier')
        .order('name')
      if (data) setSuppliers(data)
    }
    fetchSuppliers()
  }, [])

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    onUpdate({ [field]: value })
  }

  const getStockBadge = () => {
    const stockQty = product.stock_quantity || 0
    if (stockQty > 10) {
      return (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-2 py-1 rounded-md">
          <CheckCircle className="h-3 w-3" />
          <span className="font-semibold text-xs">En stock ({stockQty})</span>
        </div>
      )
    }
    if (stockQty > 0 && stockQty <= 10) {
      return (
        <div className="flex items-center gap-2 text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
          <AlertCircle className="h-3 w-3" />
          <span className="font-semibold text-xs">Stock limité ({stockQty})</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-red-700 bg-red-50 px-2 py-1 rounded-md">
        <AlertCircle className="h-3 w-3" />
        <span className="font-semibold text-xs">Rupture de stock</span>
      </div>
    )
  }

  const completionPercentage = Math.round((
    [product.name, product.description, product.subcategory_id, product.supplier_id,
     product.selling_price, product.dimensions_length, product.sku].filter(Boolean).length / 7
  ) * 100)

  return (
    <div className={cn("w-full", className)}>

      {/* Layout miroir du mode présentation: 40% gauche / 60% droite */}
      <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 max-w-7xl mx-auto">

        {/* COLONNE GAUCHE: Images + Stock + Échantillons + Données fixes */}
        <div className="space-y-4">

          {/* Galerie images */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              compact={false}
            />
          </div>

          {/* Stock badge */}
          <div className="flex justify-center">
            {getStockBadge()}
          </div>

          {/* Échantillons avec règle métier */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Échantillons
            </h3>
            {product.stock_quantity === 0 || product.stock_quantity === null ? (
              <div>
                <SampleRequirementSection
                  requiresSample={product.requires_sample || false}
                  isProduct={true}
                  productName={product.name}
                  onRequirementChange={(requiresSample) => {
                    onUpdate({ requires_sample: requiresSample })
                  }}
                />
                <div className="mt-2 p-1.5 bg-blue-50 border border-blue-200 rounded text-[10px]">
                  <p className="text-blue-800 font-medium">ℹ️ Phase sourcing</p>
                  <p className="text-blue-700 mt-0.5">Jamais en stock, échantillon disponible</p>
                </div>
              </div>
            ) : (
              <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                <p className="text-[10px] text-gray-600 font-medium">🚫 Échantillon non disponible</p>
                <p className="text-[10px] text-gray-500 mt-1">Produit déjà en stock (qty: {product.stock_quantity})</p>
              </div>
            )}
          </div>

          {/* Données fixes système */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm">
            <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide">
              Données système
            </h3>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-600">SKU:</span>
                <span className="font-mono text-gray-800">{product.sku || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono text-gray-800">{product.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créé:</span>
                <span className="text-gray-800">
                  {product.created_at ? new Date(product.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MAJ:</span>
                <span className="text-gray-800">
                  {product.updated_at ? new Date(product.updated_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: '2-digit', year: '2-digit'
                  }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE DROITE: Header + Formulaire unifié dense */}
        <div className="space-y-4">

          {/* Header compact */}
          <div className="bg-gradient-to-r from-gray-50 to-white border-l-4 border-black p-3 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <h1 className="text-base font-bold">Mode Administration</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                  {completionPercentage}% complet
                </Badge>
                <Button
                  variant="outline"
                  onClick={onSwitchToView}
                  className="h-7 text-xs px-2"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Présentation
                </Button>
              </div>
            </div>
          </div>

          {/* Formulaire unifié ultra-dense */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">

            {/* Section 1: Identité */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                <FileText className="h-3 w-3 mr-1" />
                Identité produit
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <Label className="text-[10px] text-gray-600">Nom</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Nom du produit"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Catégorie</Label>
                  <Select
                    value={formData.subcategory_id}
                    onValueChange={(value) => handleFieldChange('subcategory_id', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub.id} value={sub.id} className="text-xs">
                          {sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Fournisseur</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => handleFieldChange('supplier_id', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((sup) => (
                        <SelectItem key={sup.id} value={sup.id} className="text-xs">
                          {sup.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Section 2: Tarification */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                Tarification
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-600">Coût HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => handleFieldChange('cost_price', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Prix vente HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Marge %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.margin_percentage}
                    onChange={(e) => handleFieldChange('margin_percentage', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">TVA %</Label>
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => handleFieldChange('tax_rate', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Section 3: Stock */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                <BarChart3 className="h-3 w-3 mr-1" />
                Stock & Disponibilité
              </h3>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-600">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-xs">Brouillon</SelectItem>
                      <SelectItem value="active" className="text-xs">Actif</SelectItem>
                      <SelectItem value="archived" className="text-xs">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleFieldChange('condition', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-xs">Neuf</SelectItem>
                      <SelectItem value="used" className="text-xs">Occasion</SelectItem>
                      <SelectItem value="refurbished" className="text-xs">Reconditionné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Quantité</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleFieldChange('stock_quantity', parseInt(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Stock min</Label>
                  <Input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => handleFieldChange('min_stock', parseInt(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Section 4: Identifiants */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                <Tags className="h-3 w-3 mr-1" />
                Identifiants
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-600">SKU</Label>
                  <Input
                    value={formData.sku}
                    disabled
                    className="h-7 text-xs bg-gray-50"
                    placeholder="Auto"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Marque</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    className="h-7 text-xs"
                    placeholder="Marque"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">GTIN</Label>
                  <Input
                    value={formData.gtin}
                    onChange={(e) => handleFieldChange('gtin', e.target.value)}
                    className="h-7 text-xs"
                    placeholder="13 chiffres"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Section 5: Dimensions */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold text-gray-600 mb-2 uppercase tracking-wide flex items-center">
                <Package className="h-3 w-3 mr-1" />
                Dimensions & Poids
              </h3>
              <div className="grid grid-cols-4 gap-2 mb-2">
                <div>
                  <Label className="text-[10px] text-gray-600">Longueur</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions_length}
                    onChange={(e) => handleFieldChange('dimensions_length', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Largeur</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions_width}
                    onChange={(e) => handleFieldChange('dimensions_width', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Hauteur</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions_height}
                    onChange={(e) => handleFieldChange('dimensions_height', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Unité</Label>
                  <Select
                    value={formData.dimensions_unit}
                    onValueChange={(value) => handleFieldChange('dimensions_unit', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm" className="text-xs">cm</SelectItem>
                      <SelectItem value="m" className="text-xs">m</SelectItem>
                      <SelectItem value="in" className="text-xs">in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-600">Poids</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value))}
                    className="h-7 text-xs"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-600">Unité poids</Label>
                  <Select
                    value={formData.weight_unit}
                    onValueChange={(value) => handleFieldChange('weight_unit', value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg" className="text-xs">kg</SelectItem>
                      <SelectItem value="g" className="text-xs">g</SelectItem>
                      <SelectItem value="lb" className="text-xs">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 my-4" />

            {/* Actions rapides en ligne */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 justify-start text-xs h-7"
                onClick={() => setShowCategorizeModal(true)}
              >
                <FolderTree className="h-3 w-3 mr-1" />
                Catégorisation
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-start text-xs h-7"
                onClick={() => setShowDescriptionsModal(true)}
              >
                <FileText className="h-3 w-3 mr-1" />
                Descriptions
              </Button>
              <Button
                variant="outline"
                className="flex-1 justify-start text-xs h-7"
                onClick={() => setShowCharacteristicsModal(true)}
              >
                <Tags className="h-3 w-3 mr-1" />
                Caractéristiques
              </Button>
            </div>

            {/* Bouton publier si >80% */}
            {completionPercentage >= 80 && (
              <Button className="w-full bg-green-600 hover:bg-green-700 text-xs h-8 mt-3">
                <Save className="h-3 w-3 mr-1" />
                Publier le produit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modals conservés */}
      <CategoryHierarchyModal
        isOpen={showCategorizeModal}
        onClose={() => setShowCategorizeModal(false)}
        product={product}
        onUpdate={onUpdate}
      />

      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={() => setShowCharacteristicsModal(false)}
        productId={product.id}
        productName={product.name || "Produit"}
        initialData={{
          variant_attributes: product.variant_attributes,
          dimensions: product.dimensions,
          weight: product.weight
        }}
        onUpdate={onUpdate}
      />

      <ProductDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        productId={product.id}
        productName={product.name || "Produit"}
        initialData={{
          description: product.description,
          technical_description: product.technical_description,
          selling_points: product.selling_points
        }}
        onUpdate={onUpdate}
      />

      <ProductImagesModal
        isOpen={showImagesModal}
        onClose={() => setShowImagesModal(false)}
        product={product}
        onUpdate={onUpdate}
      />
    </div>
  )
}