"use client"

import { useState, useEffect } from 'react'
import { Settings, Eye, FolderTree, FileText, Tags, Truck, Package, DollarSign, BarChart3 } from 'lucide-react'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '../../lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useSubcategories } from '@/hooks/use-subcategories'

import { ProductImageGallery } from '@/shared/modules/products/components/images'
import { SampleRequirementSection } from './sample-requirement-section'
import { CategoryHierarchyModal } from './categorize-modal'
import { ProductCharacteristicsModal } from '@/shared/modules/products/components/forms'
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
    base_cost: product.base_cost || '', // CORRECTION: base_cost au lieu de cost_price
    selling_price: product.selling_price || '',
    min_price: product.min_price || '', // AJOUT: prix minimum manquant
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
    supplier_reference: product.supplier_reference || '',
    supplier_page_url: product.supplier_page_url || '',
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

  // Calculer la progression (amélioré selon les vrais requis)
  const REQUIRED_FIELDS = ['name', 'subcategory_id', 'supplier_id', 'base_cost', 'selling_price', 'sku']
  const completionPercentage = Math.round((
    REQUIRED_FIELDS.filter(field => {
      const value = formData[field as keyof typeof formData]
      return value !== null && value !== undefined && value !== ''
    }).length / REQUIRED_FIELDS.length
  ) * 100)

  const missingFields = REQUIRED_FIELDS.filter(field => {
    const value = formData[field as keyof typeof formData]
    return value === null || value === undefined || value === ''
  })

  return (
    <div className={cn("w-full", className)}>
      {/* Header compact avec navigation retour */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <ButtonV2 variant="ghost" size="sm" onClick={onSwitchToView} className="h-6 text-[10px] px-2">
            <Eye className="h-3 w-3 mr-1" />
            Présentation
          </ButtonV2>
          <nav className="text-[10px] text-gray-600">
            Administration › {product.name}
          </nav>
        </div>
        <div className="flex items-center space-x-1">
          <Badge variant="outline" className="text-[9px] px-1 py-0">
            {completionPercentage}% complet
          </Badge>
        </div>
      </div>

      {/* Layout 3 colonnes ultra-dense restauré */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">

        {/* COLONNE 1: Images & Métadonnées (25% - xl:col-span-3) */}
        <div className="xl:col-span-3 space-y-2">

          {/* Galerie d'images compacte */}
          <div className="bg-white border border-black">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              compact={true}
            />
          </div>

          {/* Actions sous l'image */}
          <div className="bg-white border border-black p-2">
            <h3 className="font-medium mb-2 text-[10px]">Actions</h3>
            <div className="space-y-1">
              <ButtonV2
                variant="outline"
                size="sm"
                className="w-full justify-start text-[9px] h-5"
                onClick={() => setShowImagesModal(true)}
              >
                <Settings className="h-2 w-2 mr-1" />
                Photos ({product.images?.length || 0})
              </ButtonV2>
            </div>
          </div>

          {/* Métadonnées système ultra-compact */}
          <div className="bg-white border border-black p-2">
            <h3 className="font-medium mb-2 flex items-center text-[10px]">
              <Package className="h-3 w-3 mr-1" />
              Métadonnées
            </h3>
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between">
                <span className="text-gray-600">ID:</span>
                <span className="font-mono">{product.id.slice(0, 6)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Créé:</span>
                <span>{new Date(product.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">MAJ:</span>
                <span>{new Date(product.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
              </div>
            </div>
          </div>

          {/* Status et progression compact */}
          <div className="bg-white border border-black p-2">
            <div className="space-y-2">
              <Badge className={cn(
                "text-[9px] px-1 py-0",
                product.status === 'active' ? "bg-green-600 text-white" :
                product.status === 'draft' ? "bg-gray-100 text-white" :
                "bg-gray-600 text-white"
              )}>
                {product.status === 'active' ? 'Actif' :
                 product.status === 'draft' ? 'Brouillon' :
                 'Archivé'}
              </Badge>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] text-gray-600">Complétude</span>
                  <span className="text-[9px] font-medium">{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-black h-1 rounded-full transition-all"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                {missingFields.length > 0 && (
                  <p className="text-[8px] text-red-600 mt-1">
                    Manque: {missingFields.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* COLONNE 2: Informations Principales (45% - xl:col-span-5) */}
        <div className="xl:col-span-5 space-y-2">

          {/* Header produit avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <Label className="text-[9px] text-gray-600 mb-1 block">Nom du produit</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="text-sm font-bold border-0 p-0 h-auto bg-transparent"
                  placeholder="Nom du produit"
                />
                <div className="text-[9px] text-gray-600 mt-1">
                  SKU: {product.sku || 'Auto-généré'}
                </div>
              </div>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
          </div>

          {/* Informations générales avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <FileText className="h-3 w-3 mr-1" />
                Informations générales
              </h3>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-[9px] text-gray-600">Slug URL</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => handleFieldChange('slug', e.target.value)}
                  className="h-6 text-[10px]"
                  placeholder="url-produit"
                />
              </div>
            </div>
          </div>

          {/* Catégorisation avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <FolderTree className="h-3 w-3 mr-1" />
                Catégorisation
              </h3>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setShowCategorizeModal(true)}
                className="h-5 text-[9px] px-1"
              >
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>

            {/* Affichage hiérarchie actuelle compact */}
            {product.subcategory?.category?.family || product.subcategory?.category || product.subcategory ? (
              <div className="bg-gray-50 p-2 rounded border">
                <div className="flex items-center space-x-1 flex-wrap text-[9px]">
                  {product.subcategory?.category?.family && (
                    <>
                      <div className="flex items-center space-x-1 bg-green-100 px-1 py-0.5 rounded">
                        <span className="text-green-800 font-medium">
                          {product.subcategory.category.family.name}
                        </span>
                      </div>
                      <span className="text-gray-400">›</span>
                    </>
                  )}
                  {product.subcategory?.category && (
                    <>
                      <div className="flex items-center space-x-1 bg-blue-100 px-1 py-0.5 rounded">
                        <span className="text-blue-800 font-medium">
                          {product.subcategory.category.name}
                        </span>
                      </div>
                      <span className="text-gray-400">›</span>
                    </>
                  )}
                  {product.subcategory && (
                    <div className="flex items-center space-x-1 bg-purple-100 px-1 py-0.5 rounded">
                      <span className="text-purple-800 font-medium">
                        {product.subcategory.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-red-50 p-2 rounded border border-red-200">
                <p className="text-red-700 text-[9px]">
                  Aucune catégorisation définie
                </p>
              </div>
            )}
          </div>

          {/* Fournisseur avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <Truck className="h-3 w-3 mr-1" />
                Fournisseur & Références
              </h3>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-[9px] text-gray-600">Fournisseur</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => handleFieldChange('supplier_id', value)}
                >
                  <SelectTrigger className="h-6 text-[10px]">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id} className="text-[10px]">
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Référence fournisseur</Label>
                  <Input
                    value={formData.supplier_reference}
                    onChange={(e) => handleFieldChange('supplier_reference', e.target.value)}
                    className="h-6 text-[10px]"
                    placeholder="REF-SUPP"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">Page fournisseur</Label>
                  <Input
                    value={formData.supplier_page_url}
                    onChange={(e) => handleFieldChange('supplier_page_url', e.target.value)}
                    className="h-6 text-[10px]"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Description avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[10px]">Description</h3>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => setShowDescriptionsModal(true)}
                className="h-5 text-[9px] px-1"
              >
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <p className="text-[10px] text-gray-700 line-clamp-2">
              {product.description || 'Aucune description disponible'}
            </p>
          </div>

          {/* Caractéristiques avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-[10px]">Caractéristiques</h3>
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => setShowCharacteristicsModal(true)}
                className="h-5 text-[9px] px-1"
              >
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-1 text-[10px]">
              {product.color && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Couleur:</span>
                  <span>{product.color}</span>
                </div>
              )}
              {product.material && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Matière:</span>
                  <span>{product.material}</span>
                </div>
              )}
              {(!product.color && !product.material) && (
                <p className="text-gray-400 italic text-[9px]">Aucune caractéristique définie</p>
              )}
            </div>
          </div>
        </div>

        {/* COLONNE 3: Gestion (30% - xl:col-span-4) */}
        <div className="xl:col-span-4 space-y-2">

          {/* Stock & Gestion avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <BarChart3 className="h-3 w-3 mr-1" />
                Stock & Disponibilité
              </h3>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleFieldChange('status', value)}
                  >
                    <SelectTrigger className="h-6 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft" className="text-[10px]">Brouillon</SelectItem>
                      <SelectItem value="active" className="text-[10px]">Actif</SelectItem>
                      <SelectItem value="archived" className="text-[10px]">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">Condition</Label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value) => handleFieldChange('condition', value)}
                  >
                    <SelectTrigger className="h-6 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new" className="text-[10px]">Neuf</SelectItem>
                      <SelectItem value="used" className="text-[10px]">Occasion</SelectItem>
                      <SelectItem value="refurbished" className="text-[10px]">Reconditionné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Quantité stock</Label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => handleFieldChange('stock_quantity', parseInt(e.target.value))}
                    className="h-6 text-[10px]"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">Stock minimum</Label>
                  <Input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => handleFieldChange('min_stock', parseInt(e.target.value))}
                    className="h-6 text-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tarification corrigée avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <DollarSign className="h-3 w-3 mr-1" />
                Tarification
              </h3>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-[9px] text-gray-600">Coût fournisseur HT</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.base_cost}
                  onChange={(e) => handleFieldChange('base_cost', parseFloat(e.target.value))}
                  className="h-6 text-[10px]"
                  placeholder="0.00"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Prix vente HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => handleFieldChange('selling_price', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">Prix minimum HT</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_price}
                    onChange={(e) => handleFieldChange('min_price', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Marge %</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.margin_percentage}
                    onChange={(e) => handleFieldChange('margin_percentage', parseFloat(e.target.value))}
                    className="h-6 text-[10px] bg-gray-50"
                    placeholder="0"
                    disabled
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">TVA %</Label>
                  <Input
                    type="number"
                    value={formData.tax_rate}
                    onChange={(e) => handleFieldChange('tax_rate', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="20"
                  />
                </div>
              </div>
              {formData.base_cost && formData.selling_price && (
                <div className="text-[9px] text-gray-600 bg-gray-50 p-1 rounded">
                  <div className="flex justify-between">
                    <span>Marge brute:</span>
                    <span className="font-medium">
                      {((parseFloat(formData.selling_price) - parseFloat(formData.base_cost)) / parseFloat(formData.base_cost) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Prix TTC:</span>
                    <span className="font-medium">
                      {(parseFloat(formData.selling_price) * (1 + parseFloat(formData.tax_rate) / 100)).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Identifiants avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <Tags className="h-3 w-3 mr-1" />
                Identifiants
              </h3>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-[9px] text-gray-600">SKU (auto-généré)</Label>
                <Input
                  value={formData.sku}
                  disabled
                  className="h-6 bg-gray-50 text-[10px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Marque</Label>
                  <Input
                    value={formData.brand}
                    onChange={(e) => handleFieldChange('brand', e.target.value)}
                    className="h-6 text-[10px]"
                    placeholder="Marque"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">GTIN/EAN</Label>
                  <Input
                    value={formData.gtin}
                    onChange={(e) => handleFieldChange('gtin', e.target.value)}
                    className="h-6 text-[10px]"
                    placeholder="13 chiffres"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dimensions avec bouton modifier */}
          <div className="bg-white border border-black p-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center text-[10px]">
                <Package className="h-3 w-3 mr-1" />
                Dimensions & Poids
              </h3>
              <ButtonV2 variant="outline" size="sm" className="h-5 text-[9px] px-1">
                <Settings className="h-2 w-2 mr-1" />
                Modifier
              </ButtonV2>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1">
                <div>
                  <Label className="text-[9px] text-gray-600">L</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions_length}
                    onChange={(e) => handleFieldChange('dimensions_length', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">l</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions_width}
                    onChange={(e) => handleFieldChange('dimensions_width', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">H</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.dimensions_height}
                    onChange={(e) => handleFieldChange('dimensions_height', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[9px] text-gray-600">Poids</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleFieldChange('weight', parseFloat(e.target.value))}
                    className="h-6 text-[10px]"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-[9px] text-gray-600">Unité</Label>
                  <Select
                    value={formData.weight_unit}
                    onValueChange={(value) => handleFieldChange('weight_unit', value)}
                  >
                    <SelectTrigger className="h-6 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg" className="text-[10px]">kg</SelectItem>
                      <SelectItem value="g" className="text-[10px]">g</SelectItem>
                      <SelectItem value="lb" className="text-[10px]">lb</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Section échantillon */}
          <div className="bg-white border border-black p-2">
            <h3 className="font-medium mb-2 text-[10px]">Gestion Échantillons</h3>
            <SampleRequirementSection
              requiresSample={product.requires_sample || false}
              isProduct={true}
              productName={product.name}
              onRequirementChange={(requiresSample) => {
                onUpdate({ requires_sample: requiresSample })
              }}
            />
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