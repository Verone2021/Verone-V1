"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Share2, ImageIcon, Package, Tag, Truck, Boxes, DollarSign, Settings, Hash, Beaker, Clock, Info } from "lucide-react"
import { ButtonV2 } from "@/components/ui/button"
import { ProductImageGallery } from "@/components/business/product-image-gallery"
import { ProductPhotosModal } from "@/components/business/product-photos-modal"
import { ProductCharacteristicsModal } from "@/components/business/product-characteristics-modal"
import { ProductDescriptionsModal } from "@/components/business/product-descriptions-modal"
import { CategoryHierarchySelector } from "@/components/business/category-hierarchy-selector"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductDetailAccordion } from "@/components/business/product-detail-accordion"
import { ProductInfoSection } from "@/components/business/product-info-section"
import { ProductVariantsGrid } from "@/components/business/product-variants-grid"
import { SampleRequirementSection } from "@/components/business/sample-requirement-section"
import { SupplierVsPricingEditSection } from "@/components/business/supplier-vs-pricing-edit-section"
import { StockEditSection } from "@/components/business/stock-edit-section"
import { ProductFixedCharacteristics } from "@/components/business/product-fixed-characteristics"
import { SupplierEditSection } from "@/components/business/supplier-edit-section"
import { IdentifiersCompleteEditSection } from "@/components/business/identifiers-complete-edit-section"
import { ProductDescriptionsEditSection } from "@/components/business/product-descriptions-edit-section"
import { cn, checkSLOCompliance } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// Champs obligatoires pour un produit complet
const REQUIRED_PRODUCT_FIELDS = [
  'name',
  'sku',
  'supplier_id',
  'subcategory_id',
  'cost_price',
  'description'
] as const

// Mapping des champs avec leurs libellés
const PRODUCT_FIELD_LABELS: Record<string, string> = {
  name: 'Nom du produit',
  sku: 'Référence SKU',
  supplier_id: 'Fournisseur',
  subcategory_id: 'Sous-catégorie',
  cost_price: 'Prix d\'achat HT',
  description: 'Description'
}

/**
 * Calcule champs obligatoires manquants par section
 * Basé sur REQUIRED_PRODUCT_FIELDS
 */
function calculateMissingFields(product: any | null) {
  if (!product) return { infosGenerales: 0, descriptions: 0, categorisation: 0, fournisseur: 0, identifiants: 0 }

  return {
    // Informations Générales : name, cost_price, status
    infosGenerales: [
      !product.name || product.name.trim() === '',
      !product.cost_price || product.cost_price <= 0,
      !product.status
    ].filter(Boolean).length,

    // Descriptions : description (obligatoire seulement)
    descriptions: !product.description || product.description.trim() === '' ? 1 : 0,

    // Catégorisation : subcategory_id (hiérarchie complète)
    categorisation: !product.subcategory_id ? 1 : 0,

    // Fournisseur : supplier_id
    fournisseur: !product.supplier_id ? 1 : 0,

    // Identifiants : sku
    identifiants: !product.sku || product.sku.trim() === '' ? 1 : 0
  }
}

// Interface pour un produit
interface Product {
  id: string
  name: string
  sku: string | null
  description: string | null
  technical_description: string | null
  selling_points: string | null
  price_ht: number | null
  cost_price: number | null
  tax_rate: number | null
  selling_price: number | null
  margin_percentage: number | null
  brand: string | null
  status: 'in_stock' | 'out_of_stock' | 'preorder' | 'coming_soon' | 'discontinued'
  condition: 'new' | 'used' | 'refurbished'
  stock_quantity: number | null
  min_stock: number | null
  supplier_id: string | null
  supplier_reference: string | null
  subcategory_id: string | null
  family_id: string | null
  dimensions: string | null
  weight: number | null
  variant_attributes: Record<string, any> | null
  variant_group_id: string | null
  gtin: string | null
  slug: string | null
  images: any[]
  requires_sample: boolean | null
  created_at: string
  updated_at: string
  organisation_id: string
  supplier?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    is_active: boolean
  } | null
  subcategory?: {
    id: string
    name: string
    slug: string
    category?: {
      id: string
      name: string
      slug: string
      family?: {
        id: string
        name: string
        slug: string
      }
    }
  } | null
  variant_group?: {
    id: string
    name: string
    dimensions_length: number | null
    dimensions_width: number | null
    dimensions_height: number | null
    dimensions_unit: string | null
    has_common_supplier: boolean | null
    supplier_id: string | null
  } | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.productId as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPhotosModal, setShowPhotosModal] = useState(false)
  const [showCharacteristicsModal, setShowCharacteristicsModal] = useState(false)
  const [showDescriptionsModal, setShowDescriptionsModal] = useState(false)
  const [isCategorizeModalOpen, setIsCategorizeModalOpen] = useState(false)

  const startTime = Date.now()

  // Charger le produit
  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          supplier:organisations!products_supplier_id_fkey(
            id,
            legal_name,
            trade_name,
            email,
            phone,
            is_active
          ),
          subcategory:subcategories(
            id,
            name,
            slug,
            category:categories(
              id,
              name,
              slug,
              family:families(
                id,
                name,
                slug
              )
            )
          ),
          variant_group:variant_groups(
            id,
            name,
            dimensions_length,
            dimensions_width,
            dimensions_height,
            dimensions_unit,
            has_common_supplier,
            supplier_id
          )
        `)
        .eq('id', productId)
        .single()

      if (error) {
        throw new Error(error.message)
      }

      if (!data) {
        throw new Error('Produit non trouvé')
      }

      setProduct(data)

    } catch (err) {
      console.error('Erreur lors du chargement du produit:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du produit')
    } finally {
      setLoading(false)
      checkSLOCompliance(startTime, 'dashboard')
    }
  }

  // Handler pour mettre à jour le produit avec persistance en base
  const handleProductUpdate = async (updatedData: Partial<Product>) => {
    if (!product) return

    try {
      const supabase = createClient()

      // Mettre à jour en base de données
      const { data, error } = await supabase
        .from('products')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur lors de la mise à jour du produit:', error)
        throw error
      }

      // Mettre à jour l'état local avec les données retournées de la base
      setProduct({ ...product, ...data })
      console.log('✅ Produit mis à jour avec succès:', data)
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error)
    }
  }

  // Handler pour naviguer vers la page de partage
  const handleShare = () => {
    if (product?.slug) {
      const shareUrl = `/share/product/${product.slug}`
      router.push(shareUrl)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [productId])

  // État de chargement
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p>Chargement du produit...</p>
          </div>
        </div>
      </div>
    )
  }

  // État d'erreur
  if (error || !product) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">
            {error || 'Produit non trouvé'}
          </p>
          <ButtonV2
            onClick={() => router.push('/produits/catalogue')}
            className="mt-4"
          >
            Retour au catalogue
          </ButtonV2>
        </div>
      </div>
    )
  }

  // Breadcrumb
  const breadcrumbParts: string[] = []
  if (product.subcategory?.category?.family) {
    breadcrumbParts.push(product.subcategory.category.family.name)
  }
  if (product.subcategory?.category) {
    breadcrumbParts.push(product.subcategory.category.name)
  }
  if (product.subcategory) {
    breadcrumbParts.push(product.subcategory.name)
  }
  breadcrumbParts.push(product.name)

  // Calcul complétude accordéons
  const missingFields = calculateMissingFields(product)

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Header fixe avec navigation */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => router.push('/produits/catalogue')}
                className="inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </ButtonV2>
              <div className="h-6 w-px bg-neutral-200" />
              <nav className="text-sm text-neutral-600">
                {breadcrumbParts.join(' › ')}
              </nav>
            </div>
            <ButtonV2
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="inline-flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </ButtonV2>
          </div>
        </div>
      </div>

      {/* Layout Grid 2 colonnes */}
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 p-4">

        {/* SIDEBAR FIXE - Galerie Images */}
        <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] space-y-3">
          {/* Galerie principale */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
            <ProductImageGallery
              productId={product.id}
              productName={product.name}
              productStatus={product.status}
              compact={false}
            />
          </div>

          {/* Actions sous galerie */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-3 space-y-2">
            <ButtonV2
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => setShowPhotosModal(true)}
            >
              <ImageIcon className="h-4 w-4" />
              Gérer photos ({product.images?.length || 0})
            </ButtonV2>
            <ButtonV2
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Partager
            </ButtonV2>
          </div>
        </aside>

        {/* CONTENT AREA - Accordions scrollables */}
        <main className="space-y-3 max-w-6xl">

          {/* Accordion 1: Informations Générales */}
          <ProductDetailAccordion
            title="Informations Générales"
            icon={Info}
            defaultOpen={true}
            badge={missingFields.infosGenerales > 0 ? missingFields.infosGenerales : undefined}
          >
            <ProductInfoSection
              product={{
                id: product.id,
                name: product.name,
                sku: product.sku,
                cost_price: product.cost_price,
                status: product.status,
                supplier_id: product.supplier_id,
                subcategory_id: product.subcategory_id,
                variant_group_id: product.variant_group_id,
              }}
              onUpdate={handleProductUpdate}
            />
          </ProductDetailAccordion>

          {/* Accordion 2: Descriptions */}
          <ProductDetailAccordion
            title="Descriptions"
            icon={Beaker}
            defaultOpen={false}
            badge={missingFields.descriptions > 0 ? missingFields.descriptions : undefined}
          >
            <ProductDescriptionsEditSection
              product={{
                id: product.id,
                description: product.description,
                technical_description: product.technical_description,
                selling_points: product.selling_points,
              }}
              onUpdate={handleProductUpdate}
            />
          </ProductDetailAccordion>

          {/* Accordion 3: Catégorisation */}
          <ProductDetailAccordion
            title="Catégorisation"
            icon={Tag}
            defaultOpen={false}
            badge={missingFields.categorisation > 0 ? missingFields.categorisation : undefined}
          >
            <div className="space-y-3">
              {/* Hiérarchie actuelle */}
              {breadcrumbParts.length > 1 && (
                <div className="bg-neutral-50 rounded-md p-3 text-sm">
                  <p className="text-neutral-600 mb-1">Classification actuelle:</p>
                  <p className="font-medium text-neutral-900">{breadcrumbParts.slice(0, -1).join(' › ')}</p>
                </div>
              )}

              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setIsCategorizeModalOpen(true)}
              >
                Modifier la catégorisation
              </ButtonV2>
            </div>
          </ProductDetailAccordion>

          {/* Accordion 3: Fournisseur & Références */}
          <ProductDetailAccordion
            title="Fournisseur & Références"
            icon={Truck}
            defaultOpen={false}
            badge={missingFields.fournisseur > 0 ? missingFields.fournisseur : undefined}
          >
            <SupplierEditSection
              product={product}
              variantGroup={product.variant_group || undefined}
              onUpdate={handleProductUpdate}
            />
          </ProductDetailAccordion>

          {/* Accordion 4: Variantes Produit (conditionnel) */}
          {product.variant_group_id && (
            <ProductDetailAccordion
              title="Variantes Produit"
              icon={Package}
              defaultOpen={true}
            >
              <ProductVariantsGrid
                productId={product.id}
                currentProductId={product.id}
              />
            </ProductDetailAccordion>
          )}

          {/* Accordion 5: Stock & Disponibilité */}
          <ProductDetailAccordion
            title="Stock & Disponibilité"
            icon={Boxes}
            defaultOpen={false}
          >
            <StockEditSection
              product={{
                id: product.id,
                status: product.status,
                condition: product.condition,
                stock_quantity: product.stock_quantity,
                min_stock: product.min_stock
              }}
              onUpdate={handleProductUpdate}
            />
          </ProductDetailAccordion>

          {/* Accordion 6: Tarification */}
          <ProductDetailAccordion
            title="Tarification"
            icon={DollarSign}
            defaultOpen={false}
          >
            <SupplierVsPricingEditSection
              product={{
                id: product.id,
                cost_price: product.cost_price,
                margin_percentage: product.margin_percentage,
                selling_price: product.selling_price
              }}
              onUpdate={handleProductUpdate}
            />
          </ProductDetailAccordion>

          {/* Accordion 7: Caractéristiques */}
          <ProductDetailAccordion
            title="Caractéristiques"
            icon={Settings}
            defaultOpen={false}
          >
            {product.variant_group_id && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                ℹ️ Les caractéristiques sont gérées au niveau du groupe de variantes.{' '}
                <a
                  href={`/produits/catalogue/variantes/${product.variant_group_id}`}
                  className="underline font-medium hover:text-blue-900"
                >
                  Voir le groupe
                </a>
              </div>
            )}
            <ProductFixedCharacteristics product={product} />

            <div className="mt-4">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={() => setShowCharacteristicsModal(true)}
              >
                Éditer caractéristiques
              </ButtonV2>
            </div>
          </ProductDetailAccordion>

          {/* Accordion 8: Identifiants */}
          <ProductDetailAccordion
            title="Identifiants"
            icon={Hash}
            defaultOpen={false}
            badge={missingFields.identifiants > 0 ? missingFields.identifiants : undefined}
          >
            <IdentifiersCompleteEditSection
              product={{
                id: product.id,
                sku: product.sku,
                brand: product.brand,
                gtin: product.gtin,
                condition: product.condition
              }}
              onUpdate={handleProductUpdate}
            />
          </ProductDetailAccordion>

          {/* Accordion 9: Échantillons */}
          <ProductDetailAccordion
            title="Gestion Échantillons"
            icon={Beaker}
            defaultOpen={false}
          >
            <SampleRequirementSection
              requiresSample={product.requires_sample || false}
              isProduct={true}
              productName={product.name}
              disabled={product.stock_quantity >= 1}
              onRequirementChange={(requiresSample) => {
                handleProductUpdate({ requires_sample: requiresSample })
              }}
            />
          </ProductDetailAccordion>

          {/* Accordion 10: Métadonnées & Audit */}
          <ProductDetailAccordion
            title="Métadonnées & Audit"
            icon={Clock}
            defaultOpen={false}
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600">ID:</span>
                <span className="font-mono text-neutral-900">{product.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Créé le:</span>
                <span className="text-neutral-900">
                  {new Date(product.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100">
                <span className="text-neutral-600">Modifié le:</span>
                <span className="text-neutral-900">
                  {new Date(product.updated_at).toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-neutral-600">Organisation ID:</span>
                <span className="font-mono text-neutral-900">
                  {product.organisation_id ? product.organisation_id.slice(0, 8) + '...' : 'N/A'}
                </span>
              </div>
            </div>
          </ProductDetailAccordion>

        </main>
      </div>

      {/* Modal de gestion des photos */}
      <ProductPhotosModal
        isOpen={showPhotosModal}
        onClose={() => setShowPhotosModal(false)}
        productId={product.id}
        productName={product.name}
        productType="product"
        maxImages={20}
        onImagesUpdated={fetchProduct}
      />

      {/* Modal de gestion des caractéristiques */}
      <ProductCharacteristicsModal
        isOpen={showCharacteristicsModal}
        onClose={() => setShowCharacteristicsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          variant_attributes: product.variant_attributes,
          dimensions: product.dimensions,
          weight: product.weight
        }}
        onUpdate={handleProductUpdate}
      />

      {/* Modal de gestion des descriptions */}
      <ProductDescriptionsModal
        isOpen={showDescriptionsModal}
        onClose={() => setShowDescriptionsModal(false)}
        productId={product.id}
        productName={product.name}
        initialData={{
          description: product.description,
          technical_description: product.technical_description,
          selling_points: product.selling_points
        }}
        onUpdate={handleProductUpdate}
      />

      {/* Modal de modification de la catégorisation */}
      <Dialog open={isCategorizeModalOpen} onOpenChange={setIsCategorizeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Modifier la catégorisation
            </DialogTitle>
            <DialogDescription>
              Sélectionnez une nouvelle sous-catégorie pour ce produit. La famille et la catégorie seront automatiquement mises à jour.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <CategoryHierarchySelector
              value={product.subcategory_id || ''}
              onChange={(subcategoryId, hierarchyInfo) => {
                if (subcategoryId && hierarchyInfo) {
                  handleProductUpdate({
                    subcategory_id: subcategoryId
                  })
                  setIsCategorizeModalOpen(false)
                }
              }}
              placeholder="Sélectionner une sous-catégorie"
              className="w-full"
            />
          </div>

          <DialogFooter>
            <ButtonV2
              variant="outline"
              onClick={() => setIsCategorizeModalOpen(false)}
            >
              Annuler
            </ButtonV2>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
