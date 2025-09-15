"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Plus, Trash2, Upload, X, Package, AlertCircle } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { cn, generateSKU, validateSKU, formatPrice } from "../../../lib/utils"

// Types selon ERD et business rules
interface ProductAttributes {
  color?: string
  material?: string
  size?: string
  finish?: string
}

interface ProductDimensions {
  length?: number
  width?: number
  height?: number
  unit: string
}

interface ProductVariant {
  id: string
  sku: string
  name: string
  price_ht: number
  status: 'draft' | 'active' | 'inactive' | 'discontinued' | 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon'
  condition: 'new' | 'refurbished' | 'used'
  primary_image_url: string
  gallery_images: string[]
  attributes: ProductAttributes
  stock_quantity: number
  weight?: number
  dimensions?: ProductDimensions
  description?: string
}

interface ProductPackage {
  id: string
  name: string
  type: 'single' | 'pack' | 'bulk' | 'custom'
  base_quantity: number
  unit_price_ht?: number
  discount_rate?: number
  min_order_quantity: number
  is_default: boolean
  is_active: boolean
  description?: string
}

interface ProductForm {
  name: string
  description: string
  category: string
  subcategory: string
  brand: string
  supplier_id?: string
  variants: ProductVariant[]
  packages: ProductPackage[]
}

// Options métier selon manifests
const CATEGORIES = [
  'Mobilier',
  'Décoration',
  'Éclairage',
  'Textile',
  'Rangement',
  'Accessoires'
]

const SUBCATEGORIES: Record<string, string[]> = {
  'Mobilier': ['Canapés', 'Fauteuils', 'Chaises', 'Tables', 'Lits', 'Bureaux'],
  'Décoration': ['Vases', 'Sculptures', 'Tableaux', 'Miroirs', 'Coussins'],
  'Éclairage': ['Suspensions', 'Lampadaires', 'Appliques', 'Spots', 'Bougies'],
  'Textile': ['Rideaux', 'Plaids', 'Tapis', 'Coussins', 'Linges'],
  'Rangement': ['Étagères', 'Commodes', 'Bibliothèques', 'Boîtes'],
  'Accessoires': ['Horloges', 'Cadres', 'Plateaux', 'Paniers']
}

const COLORS = ['Blanc', 'Noir', 'Gris', 'Beige', 'Marron', 'Rouge', 'Bleu', 'Vert', 'Jaune', 'Rose', 'Violet', 'Orange', 'Terracotta', 'Doré', 'Argenté']

const MATERIALS = ['Céramique', 'Verre', 'Métal', 'Bois', 'Plastique', 'Tissu', 'Cuir', 'Pierre', 'Marbre', 'Rotin', 'Osier', 'Résine']

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const STATUSES = [
  { value: 'draft', label: 'Brouillon', icon: '📝' },
  { value: 'active', label: 'Actif', icon: '✅' },
  { value: 'in_stock', label: 'En stock', icon: '📦' },
  { value: 'preorder', label: 'Précommande', icon: '📅' },
  { value: 'coming_soon', label: 'Bientôt disponible', icon: '⏳' },
  { value: 'out_of_stock', label: 'Rupture de stock', icon: '❌' },
  { value: 'inactive', label: 'Inactif', icon: '⏸️' },
  { value: 'discontinued', label: 'Arrêté', icon: '🚫' }
]

export default function CreateProductPage() {
  const router = useRouter()

  // Formulaire principal
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    category: '',
    subcategory: '',
    brand: '',
    supplier_id: '',
    variants: [],
    packages: [
      {
        id: 'default-single',
        name: 'Unité',
        type: 'single',
        base_quantity: 1,
        min_order_quantity: 1,
        is_default: true,
        is_active: true,
        description: 'Vente à l\'unité'
      }
    ]
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentVariant, setCurrentVariant] = useState<ProductVariant>({
    id: 'temp-variant',
    sku: '',
    name: '',
    price_ht: 0,
    status: 'draft',
    condition: 'new',
    primary_image_url: '',
    gallery_images: [],
    attributes: {},
    stock_quantity: 0,
    dimensions: { unit: 'cm' }
  })

  // Gestion variante courante
  const updateVariant = (field: keyof ProductVariant, value: any) => {
    setCurrentVariant(prev => ({ ...prev, [field]: value }))

    // Auto-génération SKU si changement d'attributs importants
    if (field === 'attributes' && form.category) {
      const newSKU = generateSKU(form.category, form.brand || 'GEN')
      setCurrentVariant(prev => ({ ...prev, sku: newSKU }))
    }

    // Auto-génération nom variante selon R022
    if (field === 'attributes') {
      const baseProductName = form.name
      const attrs = value as ProductAttributes
      let variantName = baseProductName

      if (attrs.color || attrs.material || attrs.size) {
        const parts = [baseProductName]
        if (attrs.color) parts.push(attrs.color)
        if (attrs.material) parts.push(attrs.material)
        if (attrs.size) parts.push(attrs.size)
        variantName = parts.join(' - ')
      }

      setCurrentVariant(prev => ({ ...prev, name: variantName }))
    }
  }

  const addVariant = () => {
    if (!currentVariant.name || !currentVariant.sku || currentVariant.price_ht <= 0) {
      setErrors(prev => ({ ...prev, variant: 'Nom, SKU et prix sont obligatoires' }))
      return
    }

    const newVariant = {
      ...currentVariant,
      id: `variant-${Date.now()}`
    }

    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, newVariant]
    }))

    // Reset variant form
    setCurrentVariant({
      id: `temp-variant-${Date.now()}`,
      sku: '',
      name: '',
      price_ht: 0,
      status: 'draft',
      condition: 'new',
      primary_image_url: '',
      gallery_images: [],
      attributes: {},
      stock_quantity: 0,
      dimensions: { unit: 'cm' }
    })

    setErrors(prev => ({ ...prev, variant: '' }))
  }

  const removeVariant = (index: number) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }))
  }

  // Gestion packages selon business rules R004-R006
  const addPackage = () => {
    const newPackage: ProductPackage = {
      id: `package-${Date.now()}`,
      name: '',
      type: 'pack',
      base_quantity: 2,
      discount_rate: 0.05, // 5% par défaut
      min_order_quantity: 1,
      is_default: false,
      is_active: true
    }

    setForm(prev => ({
      ...prev,
      packages: [...prev.packages, newPackage]
    }))
  }

  const updatePackage = (index: number, field: keyof ProductPackage, value: any) => {
    setForm(prev => ({
      ...prev,
      packages: prev.packages.map((pkg, i) =>
        i === index ? { ...pkg, [field]: value } : pkg
      )
    }))
  }

  const removePackage = (index: number) => {
    setForm(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }))
  }

  // Validation formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name) newErrors.name = 'Nom du produit obligatoire'
    if (!form.category) newErrors.category = 'Catégorie obligatoire'
    if (!form.subcategory) newErrors.subcategory = 'Sous-catégorie obligatoire'
    if (form.variants.length === 0) newErrors.variants = 'Au moins une variante requise'

    // Validation business rules
    form.packages.forEach((pkg, index) => {
      if (pkg.discount_rate && pkg.discount_rate > 0.4) {
        newErrors[`package_${index}`] = 'Remise supérieure à 40% non autorisée (R005)'
      }
      if (pkg.type === 'bulk' && pkg.min_order_quantity < 2) {
        newErrors[`package_${index}_moq`] = 'Package Bulk nécessite MOQ minimum 2 (business rules)'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    try {
      // Ici on appellerait l'API Supabase pour créer le produit
      console.log('Création produit:', form)
      router.push('/catalogue')
    } catch (error) {
      console.error('Erreur création produit:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="pl-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au catalogue
          </Button>
          <h1 className="text-3xl font-light text-black">Nouveau Produit</h1>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="secondary" onClick={() => router.push('/catalogue')}>
            Annuler
          </Button>
          <Button variant="default" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Formulaire principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Informations générales */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-verone p-6">
            <h2 className="text-xl font-medium text-black mb-4">Informations générales</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Ex: Vase Côme"
                />
                {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name}</div>}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  rows={3}
                  placeholder="Description du produit pour les clients..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Catégorie *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      setForm(prev => ({ ...prev, category: e.target.value, subcategory: '' }))
                    }}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <div className="text-red-600 text-sm mt-1">{errors.category}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Sous-catégorie *
                  </label>
                  <select
                    value={form.subcategory}
                    onChange={(e) => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
                    disabled={!form.category}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                  >
                    <option value="">Sélectionner une sous-catégorie</option>
                    {form.category && SUBCATEGORIES[form.category]?.map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                  {errors.subcategory && <div className="text-red-600 text-sm mt-1">{errors.subcategory}</div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Marque
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Ex: Vérone Collection"
                />
              </div>
            </div>
          </div>

          {/* Création variante */}
          <div className="card-verone p-6">
            <h2 className="text-xl font-medium text-black mb-4">Ajouter une variante</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">SKU *</label>
                  <input
                    type="text"
                    value={currentVariant.sku}
                    onChange={(e) => updateVariant('sku', e.target.value)}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="VER-XXX-XXX-XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Prix HT (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentVariant.price_ht / 100}
                    onChange={(e) => updateVariant('price_ht', parseFloat(e.target.value) * 100 || 0)}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="45.00"
                  />
                </div>
              </div>

              {/* Attributs variante (R001 - Critères autorisés) */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Couleur</label>
                  <select
                    value={currentVariant.attributes.color || ''}
                    onChange={(e) => updateVariant('attributes', {
                      ...currentVariant.attributes,
                      color: e.target.value || undefined
                    })}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Sélectionner</option>
                    {COLORS.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Matière</label>
                  <select
                    value={currentVariant.attributes.material || ''}
                    onChange={(e) => updateVariant('attributes', {
                      ...currentVariant.attributes,
                      material: e.target.value || undefined
                    })}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Sélectionner</option>
                    {MATERIALS.map(material => (
                      <option key={material} value={material}>{material}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Taille</label>
                  <select
                    value={currentVariant.attributes.size || ''}
                    onChange={(e) => updateVariant('attributes', {
                      ...currentVariant.attributes,
                      size: e.target.value || undefined
                    })}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Sélectionner</option>
                    {SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Statut</label>
                  <select
                    value={currentVariant.status}
                    onChange={(e) => updateVariant('status', e.target.value)}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {STATUSES.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.icon} {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Stock initial</label>
                  <input
                    type="number"
                    min="0"
                    value={currentVariant.stock_quantity}
                    onChange={(e) => updateVariant('stock_quantity', parseInt(e.target.value) || 0)}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">Poids (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={currentVariant.weight || ''}
                    onChange={(e) => updateVariant('weight', parseFloat(e.target.value) || undefined)}
                    className="w-full border border-black p-2 text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Nom variante généré automatiquement (R022) */}
              {currentVariant.name && (
                <div className="bg-gray-50 p-3 border border-gray-200">
                  <div className="text-sm text-black opacity-70">Nom généré automatiquement:</div>
                  <div className="font-medium text-black">{currentVariant.name}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                {errors.variant && (
                  <div className="flex items-center text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.variant}
                  </div>
                )}
                <div className="ml-auto">
                  <Button onClick={addVariant} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter cette variante
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Liste variantes ajoutées */}
          {form.variants.length > 0 && (
            <div className="card-verone p-6">
              <h2 className="text-xl font-medium text-black mb-4">
                Variantes créées ({form.variants.length})
              </h2>

              <div className="space-y-3">
                {form.variants.map((variant, index) => (
                  <div key={variant.id} className="flex items-center justify-between p-4 border border-gray-200 bg-gray-50">
                    <div className="flex-1">
                      <div className="font-medium text-black">{variant.name}</div>
                      <div className="text-sm text-black opacity-70">
                        SKU: {variant.sku} • {formatPrice(variant.price_ht)} HT
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        {variant.attributes.color && (
                          <Badge variant="outline">{variant.attributes.color}</Badge>
                        )}
                        {variant.attributes.material && (
                          <Badge variant="outline">{variant.attributes.material}</Badge>
                        )}
                        {variant.attributes.size && (
                          <Badge variant="outline">{variant.attributes.size}</Badge>
                        )}
                        <Badge className={cn(
                          variant.status === 'in_stock' && "bg-green-600 text-white",
                          variant.status === 'draft' && "bg-gray-600 text-white"
                        )}>
                          {STATUSES.find(s => s.value === variant.status)?.label}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {errors.variants && (
                <div className="text-red-600 text-sm mt-2">{errors.variants}</div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Conditionnements */}
        <div className="space-y-6">
          <div className="card-verone p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-medium text-black">Conditionnements</h2>
              <Button variant="secondary" size="sm" onClick={addPackage}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-4">
              {form.packages.map((pkg, index) => (
                <div key={pkg.id} className="border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={pkg.name}
                      onChange={(e) => updatePackage(index, 'name', e.target.value)}
                      className="flex-1 border border-gray-300 p-1 text-sm text-black focus:outline-none focus:ring-1 focus:ring-black"
                      placeholder="Nom du package"
                    />
                    {!pkg.is_default && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePackage(index)}
                        className="ml-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-black opacity-70 mb-1">Type</label>
                      <select
                        value={pkg.type}
                        onChange={(e) => updatePackage(index, 'type', e.target.value)}
                        disabled={pkg.is_default}
                        className="w-full border border-gray-300 p-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50"
                      >
                        <option value="single">Unité</option>
                        <option value="pack">Pack</option>
                        <option value="bulk">Vrac</option>
                        <option value="custom">Sur mesure</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-black opacity-70 mb-1">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        value={pkg.base_quantity}
                        onChange={(e) => updatePackage(index, 'base_quantity', parseInt(e.target.value) || 1)}
                        disabled={pkg.is_default}
                        className="w-full border border-gray-300 p-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {pkg.type !== 'single' && (
                    <div>
                      <label className="block text-xs text-black opacity-70 mb-1">
                        Remise (%) - Max 40% selon R005
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        step="1"
                        value={Math.round((pkg.discount_rate || 0) * 100)}
                        onChange={(e) => updatePackage(index, 'discount_rate', (parseFloat(e.target.value) || 0) / 100)}
                        className="w-full border border-gray-300 p-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs text-black opacity-70 mb-1">MOQ</label>
                    <input
                      type="number"
                      min="1"
                      value={pkg.min_order_quantity}
                      onChange={(e) => updatePackage(index, 'min_order_quantity', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 p-1 text-xs text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {pkg.is_default && (
                    <div className="text-xs text-black opacity-50">
                      <Package className="inline h-3 w-3 mr-1" />
                      Conditionnement par défaut
                    </div>
                  )}

                  {errors[`package_${index}`] && (
                    <div className="text-red-600 text-xs">{errors[`package_${index}`]}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu pricing */}
          {form.variants.length > 0 && (
            <div className="card-verone p-6">
              <h3 className="text-lg font-medium text-black mb-3">Aperçu tarification</h3>
              <div className="space-y-2 text-sm">
                {form.packages.map((pkg) => {
                  const basePrice = form.variants[0]?.price_ht || 0
                  const packagePrice = pkg.unit_price_ht || (pkg.discount_rate ?
                    Math.round(basePrice * pkg.base_quantity * (1 - pkg.discount_rate)) :
                    basePrice * pkg.base_quantity
                  )

                  return (
                    <div key={pkg.id} className="flex justify-between">
                      <span className="text-black opacity-70">{pkg.name}:</span>
                      <span className="font-medium text-black">{formatPrice(packagePrice)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}