"use client"

import { useState, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Package,
  FileText,
  Tag,
  Palette,
  DollarSign,
  Truck,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  Upload,
  X,
  Star,
  Trash2
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Progress } from "../ui/progress"
import { Badge } from "../ui/badge"
import { cn } from "../../lib/utils"
import { PrimaryImageUpload } from "../business/primary-image-upload"
import { useProductImages } from "../../hooks/use-product-images"
import { createClient } from "../../lib/supabase/client"
import { SubcategorySearchSelector } from "../business/subcategory-search-selector"
import { ColorMaterialSelector } from "../business/color-material-selector"
import { useSuppliers } from "../../hooks/use-organisations"

// Types pour le wizard
export interface ProductDraftData {
  id?: string

  // Étape 1: Informations de base
  name: string
  sku?: string                 // SKU/Référence interne
  supplier_reference?: string  // Référence fournisseur
  status: 'draft' | 'active' | 'inactive'
  supplier_id?: string         // Fournisseur lié
  supplier_page_url?: string   // URL page produit chez fournisseur
  // Images gérées dans la table product_images séparée

  // Étape 2: Catégorisation
  subcategory_id?: string

  // Étape 3: Caractéristiques et descriptions
  color?: string
  material?: string
  dimensions?: {
    width?: number
    height?: number
    depth?: number
  }
  weight?: number
  description?: string          // Description unique pour products et principale pour drafts
  supplier_description?: string // Description fournisseur (drafts uniquement)
  generated_description?: string // Description générée IA (drafts uniquement)

  // Étape 4: Tarification
  cost_price?: number          // Prix d'achat HT (cost_price dans DB)
  supplier_price?: number      // Prix d'achat HT fournisseur (compatibilité)
  margin_percentage?: number   // Marge en pourcentage
  estimated_selling_price?: number  // Prix vente calculé

  // Étape 5: Images complémentaires
  // gallery_images géré dans product_images

  // Métadonnées wizard
  wizard_step_completed: number
  created_at?: string
  updated_at?: string
}

export interface ProductCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Partial<ProductDraftData>
  draftId?: string  // Pour charger un brouillon existant
  onSuccess?: (productId: string) => void
  onDraftSaved?: (draftId: string) => void
}

interface WizardStep {
  id: number
  title: string
  description: string
  icon: React.ElementType
  required: boolean
}

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Informations de base",
    description: "Nom, fournisseur, image principale",
    icon: FileText,
    required: false
  },
  {
    id: 2,
    title: "Catégorisation",
    description: "Sous-catégorie du produit",
    icon: Tag,
    required: false
  },
  {
    id: 3,
    title: "Caractéristiques",
    description: "Propriétés, descriptions",
    icon: Palette,
    required: false
  },
  {
    id: 4,
    title: "Tarification",
    description: "Prix d'achat et marge",
    icon: DollarSign,
    required: false
  },
  {
    id: 5,
    title: "Images",
    description: "Galerie d'images complémentaires",
    icon: ImageIcon,
    required: false
  },
  {
    id: 6,
    title: "Validation finale",
    description: "Vérification et création",
    icon: CheckCircle,
    required: false
  }
]

export function ProductCreationWizard({
  isOpen,
  onClose,
  initialData,
  draftId,
  onSuccess,
  onDraftSaved
}: ProductCreationWizardProps) {
  const supabase = createClient()

  // États du wizard
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProductDraftData>({
    name: '',
    sku: '',  // Ajout du champ SKU
    supplier_reference: '',  // Ajout de la référence fournisseur
    status: 'draft',
    wizard_step_completed: 0,
    dimensions: {},
    ...initialData
  })

  // États de l'interface
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // États pour les options de sélection
  const [subcategories, setSubcategories] = useState<Array<{
    id: string,
    name: string,
    categories?: {
      name: string,
      families?: {
        name: string
      }
    }
  }>>([])

  // Hook pour charger les fournisseurs
  const { organisations: suppliers, loading: suppliersLoading } = useSuppliers()

  // Hook pour gérer les images du draft
  const {
    images: draftImages,
    primaryImage,
    loading: imagesLoading,
    uploading: uploadingImages,
    error: imagesError,
    fetchImages,
    uploadMultipleImages,
    deleteImage,
    setPrimaryImage,
    hasImages
  } = useProductImages({
    productId: formData.id || '', // Garder vide si pas de brouillon
    productType: 'draft'
  })

  // Handlers pour PrimaryImageUpload (utilise useProductImages)
  const handlePrimaryImageUpload = (imageId: string, publicUrl: string) => {
    console.log('✅ Image principale uploadée:', { imageId, publicUrl })
    // Le hook useProductImages se met à jour automatiquement
  }

  const handlePrimaryImageRemove = () => {
    console.log('✅ Image principale supprimée')
    // Le hook useProductImages se met à jour automatiquement
  }

  // Fonction pour calculer le prix de vente estimatif
  const calculateSellingPrice = (purchasePrice: number, margin: number): number => {
    if (!purchasePrice || !margin) return 0
    return purchasePrice * (1 + margin / 100)
  }

  // Fonction pour mettre à jour les prix automatiquement
  const updatePricing = (updates: { cost_price?: number, margin_percentage?: number }) => {
    const newCostPrice = updates.cost_price ?? formData.cost_price ?? formData.supplier_price ?? 0
    const newMargin = updates.margin_percentage ?? formData.margin_percentage ?? 0

    const estimatedPrice = newCostPrice && newMargin
      ? calculateSellingPrice(newCostPrice, newMargin)
      : undefined

    updateFormData({
      ...updates,
      cost_price: newCostPrice,  // Stocker aussi cost_price
      supplier_price: newCostPrice,  // Dupliquer pour compatibilité
      estimated_selling_price: estimatedPrice
    })
  }

  // Fonction pour générer automatiquement le SKU séquentiel
  const generateSKU = async (subcategoryId: string): Promise<string> => {
    try {
      // 1. Récupérer le nom de la sous-catégorie pour le préfixe
      const { data: subcategory, error: subcategoryError } = await supabase
        .from('subcategories')
        .select('name')
        .eq('id', subcategoryId)
        .single()

      if (subcategoryError || !subcategory) {
        console.error('Erreur récupération sous-catégorie:', subcategoryError)
        return 'GEN-0001' // Fallback générique
      }

      // 2. Générer le préfixe à partir du nom de la sous-catégorie (3 premières lettres)
      const prefix = subcategory.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')

      // 3. Récupérer le prochain numéro séquentiel global
      const { data: lastProduct, error: sequenceError } = await supabase
        .from('products')
        .select('sku')
        .order('created_at', { ascending: false })
        .limit(1)

      let nextNumber = 1

      if (!sequenceError && lastProduct && lastProduct.length > 0 && lastProduct[0].sku) {
        // Extraire le numéro de la fin du SKU (format: XXX-NNNN)
        const match = lastProduct[0].sku.match(/-(\d+)$/)
        if (match) {
          nextNumber = parseInt(match[1]) + 1
        }
      }

      // 4. Formater le numéro sur 4 chiffres
      const formattedNumber = nextNumber.toString().padStart(4, '0')

      return `${prefix}-${formattedNumber}`
    } catch (error) {
      console.error('Erreur génération SKU:', error)
      return 'ERR-0001' // Fallback en cas d'erreur
    }
  }

  // Chargement des sous-catégories avec hiérarchie
  const loadSubcategoriesWithHierarchy = async () => {
    try {
      const { data } = await supabase
        .from('subcategories')
        .select(`
          id,
          name,
          categories (
            name,
            families (
              name
            )
          )
        `)
        .eq('is_active', true)
        .order('name')

      if (data) setSubcategories(data)
    } catch (error) {
      console.error('Erreur chargement sous-catégories:', error)
    }
  }

  // Fonction pour charger un brouillon existant
  const loadDraft = async (id: string) => {
    try {
      const { data: draft, error } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Erreur chargement brouillon:', error)
        return
      }

      if (draft) {
        // Mapper les données du brouillon vers le formulaire
        const draftData: ProductDraftData = {
          id: draft.id,
          name: draft.name || '',
          sku: draft.sku || '',  // Ajout du SKU
          supplier_reference: draft.supplier_reference || '',  // Ajout référence fournisseur
          status: draft.status || 'draft',
          supplier_id: draft.supplier_id,
          supplier_page_url: draft.supplier_page_url,
          // primary_image_url géré dans product_images,
          subcategory_id: draft.subcategory_id,
          color: draft.color,
          material: draft.material,
          dimensions: draft.dimensions || {},
          weight: draft.weight,
          description: draft.description,  // Description principale
          supplier_description: draft.supplier_description,
          generated_description: draft.generated_description,
          cost_price: draft.cost_price || draft.supplier_price,  // Utiliser cost_price ou supplier_price
          supplier_price: draft.supplier_price || draft.cost_price,  // Compatibilité
          margin_percentage: draft.margin_percentage,
          estimated_selling_price: draft.estimated_selling_price,
          // gallery_images géré dans product_images,
          wizard_step_completed: draft.wizard_step_completed || 0
        }

        setFormData(draftData)
        setCurrentStep(Math.max(1, draft.wizard_step_completed || 1))
        console.log('✅ Brouillon chargé avec succès:', draft.id)
      }
    } catch (error) {
      console.error('❌ Erreur lors du chargement du brouillon:', error)
    }
  }

  // Chargement des données de référence
  useEffect(() => {
    loadSubcategoriesWithHierarchy()
  }, [])

  // Charger le brouillon si draftId est fourni
  useEffect(() => {
    if (draftId && isOpen) {
      loadDraft(draftId)
    } else if (isOpen && !draftId) {
      // Reset pour nouveau produit
      setFormData({
        name: '',
        sku: '',
        supplier_reference: '',
        status: 'draft',
        wizard_step_completed: 0,
        dimensions: {},
        ...initialData
      })
      setCurrentStep(1)
    }
  }, [draftId, isOpen, initialData])

  // Charger les images du draft quand l'ID est disponible
  useEffect(() => {
    if (formData.id && isOpen) {
      fetchImages()
    }
  }, [formData.id, isOpen, fetchImages])

  // Auto-save supprimé - sauvegarde manuelle uniquement

  const loadReferenceData = async () => {
    try {
      // Charger directement toutes les sous-catégories avec leur hiérarchie
      await loadSubcategoriesWithHierarchy()

    } catch (error) {
      console.error('Erreur chargement données de référence:', error)
    }
  }


  // Gestion des changements de formulaire
  const updateFormData = (updates: Partial<ProductDraftData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(updates).forEach(key => delete newErrors[key])
      return newErrors
    })
  }

  // Validation par étape (assouplies pour permettre sauvegarde brouillons)
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    // Validation finale uniquement pour la création du produit (étape 6)
    if (step === 6) {
      console.log('🔍 Validation étape 6 - Données du formulaire complètes:', {
        name: formData.name,
        supplier_id: formData.supplier_id,
        subcategory_id: formData.subcategory_id,
        cost_price: formData.cost_price,
        supplier_price: formData.supplier_price,
        step: step,
        currentStep: currentStep,
        allFormData: formData
      })

      if (!formData.name?.trim()) {
        newErrors.name = 'Le nom est requis pour créer le produit'
        console.log('❌ Validation échouée: nom manquant')
      }
      if (!formData.supplier_id) {
        newErrors.supplier_id = 'Le fournisseur est requis pour créer le produit'
        console.log('❌ Validation échouée: supplier_id manquant')
      }
      if (!formData.subcategory_id) {
        newErrors.subcategory_id = 'La sous-catégorie est requise pour créer le produit'
        console.log('❌ Validation échouée: subcategory_id manquant')
      }
      // ✅ Validation flexible pour les prix (cost_price OU supplier_price)
      const hasValidPrice = (formData.cost_price && formData.cost_price > 0) ||
                           (formData.supplier_price && formData.supplier_price > 0)

      if (!hasValidPrice) {
        newErrors.cost_price = 'Le prix d\'achat est requis pour créer le produit'
        console.log('❌ Validation échouée: aucun prix valide', {
          cost_price: formData.cost_price,
          supplier_price: formData.supplier_price
        })
      }

      console.log('🔍 Erreurs de validation:', newErrors)
      console.log('✅ Validation réussie:', Object.keys(newErrors).length === 0)
    }

    // Pour les autres étapes, permettre la navigation libre (pas de validation bloquante)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Navigation entre étapes
  const goToStep = (step: number) => {
    // ✅ Navigation libre - permettre de revenir en arrière ou avancer
    // La validation n'est requise que pour la création finale (étape 6)
    setCurrentStep(step)
    updateFormData({ wizard_step_completed: Math.max(formData.wizard_step_completed, Math.max(currentStep, step - 1)) })
  }

  const nextStep = () => {
    // ✅ Navigation libre pour toutes les étapes sauf la dernière (étape 6)
    // La validation stricte n'a lieu que pour la création finale du produit
    const newStep = Math.min(currentStep + 1, WIZARD_STEPS.length)
    setCurrentStep(newStep)
    // Progression locale uniquement (pas de sauvegarde automatique)
    updateFormData({ wizard_step_completed: Math.max(formData.wizard_step_completed, currentStep) })
  }

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1))
  }

  // Sauvegarde brouillon simplifiée
  const saveDraft = async (shouldClose = false) => {
    setIsSavingDraft(true)

    try {
      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Vous devez être connecté pour sauvegarder un brouillon')
      }

      // Préparer les données de base (nettoyer les valeurs vides)
      const cleanData: any = {
        wizard_step_completed: Math.max(formData.wizard_step_completed, currentStep),
        updated_at: new Date().toISOString()
      }

      // Ajouter seulement les champs qui ont des valeurs
      if (formData.name?.trim()) cleanData.name = formData.name.trim()
      if (formData.sku?.trim()) cleanData.sku = formData.sku.trim()
      if (formData.supplier_reference?.trim()) cleanData.supplier_reference = formData.supplier_reference.trim()
      if (formData.supplier_id) cleanData.supplier_id = formData.supplier_id
      if (formData.supplier_page_url?.trim()) cleanData.supplier_page_url = formData.supplier_page_url.trim()
      // Images gérées séparément dans product_images
      if (formData.subcategory_id) cleanData.subcategory_id = formData.subcategory_id
      if (formData.color?.trim()) cleanData.color = formData.color.trim()
      if (formData.material?.trim()) cleanData.material = formData.material.trim()
      if (formData.weight && formData.weight > 0) cleanData.weight = formData.weight
      if (formData.dimensions && Object.keys(formData.dimensions).length > 0) {
        cleanData.dimensions = formData.dimensions
      }

      // Gérer les prix (cost_price et supplier_price)
      if (formData.cost_price && formData.cost_price > 0) {
        cleanData.cost_price = formData.cost_price
        cleanData.supplier_price = formData.cost_price  // Pour compatibilité
      } else if (formData.supplier_price && formData.supplier_price > 0) {
        cleanData.cost_price = formData.supplier_price
        cleanData.supplier_price = formData.supplier_price
      }

      // Validation robuste pour margin_percentage (0-1000%, NULL autorisé)
      if (formData.margin_percentage !== null && formData.margin_percentage !== undefined && !isNaN(formData.margin_percentage)) {
        const margin = Number(formData.margin_percentage)
        if (margin >= 0 && margin <= 1000) {
          cleanData.margin_percentage = margin
        }
      }
      if (formData.estimated_selling_price && formData.estimated_selling_price > 0) cleanData.estimated_selling_price = formData.estimated_selling_price

      // Gérer la description principale
      if (formData.description?.trim()) cleanData.description = formData.description.trim()

      // Champs additionnels pour drafts seulement
      if (formData.supplier_description?.trim()) cleanData.supplier_description = formData.supplier_description.trim()
      if (formData.generated_description?.trim()) cleanData.generated_description = formData.generated_description.trim()

      let result
      if (formData.id) {
        // Mise à jour brouillon existant
        result = await supabase
          .from('product_drafts')
          .update(cleanData)
          .eq('id', formData.id)
          .select()
          .single()
      } else {
        // Création nouveau brouillon
        result = await supabase
          .from('product_drafts')
          .insert({
            ...cleanData,
            created_by: user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
      }

      if (result.error) {
        console.error('❌ Erreur Supabase:', result.error)
        throw new Error(`Erreur base de données: ${result.error.message}`)
      }

      if (!formData.id && result.data) {
        updateFormData({
          id: result.data.id,
          wizard_step_completed: Math.max(formData.wizard_step_completed, currentStep)
        })
        onDraftSaved?.(result.data.id)
      } else if (result.data) {
        // Mettre à jour la progression locale après sauvegarde
        updateFormData({
          wizard_step_completed: Math.max(formData.wizard_step_completed, currentStep)
        })
      }

      console.log('✅ Brouillon sauvegardé avec succès')
      alert('Brouillon sauvegardé avec succès !')

      // Fermer le wizard si demandé
      if (shouldClose) {
        onClose()
      }

    } catch (error) {
      console.error('❌ Erreur sauvegarde brouillon:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`Erreur lors de la sauvegarde: ${errorMessage}`)
    } finally {
      setIsSavingDraft(false)
    }
  }

  // Création finale du produit
  const createProduct = async () => {
    console.log('🚀 Tentative de création produit - currentStep:', currentStep)

    // Forcer la validation pour l'étape 6 même si on n'est pas sur cette étape
    if (!validateStep(6)) {
      console.log('❌ Création échouée: validation étape 6 failed')
      return
    }

    setIsSubmitting(true)

    try {
      // Obtenir l'utilisateur actuel
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Vous devez être connecté pour créer un produit')
      }

      // Vérifier qu'une sous-catégorie est sélectionnée pour la génération du SKU
      if (!formData.subcategory_id) {
        throw new Error('Une sous-catégorie doit être sélectionnée pour générer le SKU')
      }

      // ✅ Suppression logique product_groups - table inexistante

      // Préparer les données produit finales avec SKU
      const finalSKU = formData.sku?.trim() || await generateSKU(formData.subcategory_id)
      const productData = {
        name: formData.name,
        sku: finalSKU,
        supplier_reference: formData.supplier_reference || null,
        // ✅ product_group_id supprimé - colonne inexistante

        // Caractéristiques (JSON)
        variant_attributes: {
          color: formData.color,
          material: formData.material
        },
        dimensions: formData.dimensions,
        weight: formData.weight,

        // Prix en euros avec 2 décimales - NUMERIC(10,2)
        price_ht: formData.estimated_selling_price || formData.cost_price || formData.supplier_price || 0, // Prix de vente HT en euros
        cost_price: formData.cost_price || formData.supplier_price || null, // Prix d'achat/coût en euros
        tax_rate: 0.20, // 20% par défaut

        // Champs selon schéma réel
        supplier_id: formData.supplier_id,
        margin_percentage: formData.margin_percentage,
        estimated_selling_price: formData.estimated_selling_price || null, // Prix en euros
        subcategory_id: formData.subcategory_id, // ✅ Existe dans schéma

        // Status selon enum Supabase
        status: 'in_stock', // availability_status_type par défaut
        condition: 'new',

        // URLs
        supplier_page_url: formData.supplier_page_url,

        // Images
        // Images gérées dans product_images table

        // Slug généré
        slug: formData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),

        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Créer le produit
      const { data: product, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (error) throw error

      // Migrer les images du brouillon vers le produit final si nécessaire
      if (formData.id && draftImages.length > 0) {
        console.log('🔄 Migration des images vers le produit final:', product.id)

        // Mettre à jour toutes les images du brouillon pour les associer au produit final
        const { error: imageUpdateError } = await supabase
          .from('product_images')
          .update({
            product_id: product.id,
            product_type: 'product',
            updated_at: new Date().toISOString()
          })
          .eq('product_id', formData.id)
          .eq('product_type', 'draft')

        if (imageUpdateError) {
          console.warn('⚠️ Erreur migration images:', imageUpdateError)
        } else {
          console.log('✅ Images migrées avec succès vers le produit final')
        }
      }

      // Supprimer le brouillon si il existe
      if (formData.id) {
        await supabase
          .from('product_drafts')
          .delete()
          .eq('id', formData.id)
      }

      console.log('✅ Produit créé avec succès:', product.id)
      onSuccess?.(product.id)
      onClose()

    } catch (error) {
      console.error('❌ Erreur création produit:', error)
      setErrors({ submit: 'Erreur lors de la création du produit' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcul du pourcentage de progression
  const progressPercentage = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Création de produit</span>
            <Badge variant="outline" className="ml-2">
              Étape {currentStep}/{WIZARD_STEPS.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Barre de progression */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progression du wizard</span>
            <span>{Math.round(progressPercentage)}% complété</span>
          </div>
        </div>

        {/* Navigation par onglets */}
        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {WIZARD_STEPS.map((step) => {
              const Icon = step.icon
              const isCompleted = step.id <= formData.wizard_step_completed
              const isCurrent = step.id === currentStep

              return (
                <TabsTrigger
                  key={step.id}
                  value={step.id.toString()}
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex flex-col items-center p-2 text-xs",
                    isCompleted && "text-green-600",
                    isCurrent && "ring-2 ring-black"
                  )}
                  disabled={step.id > formData.wizard_step_completed + 1}
                >
                  <Icon className={cn(
                    "h-4 w-4 mb-1",
                    isCompleted && "text-green-600"
                  )} />
                  <span className="hidden sm:block">{step.title.split(' ')[0]}</span>
                  {isCompleted && <Check className="h-3 w-3 text-green-600" />}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {/* Contenu des étapes */}
          <div className="mt-6 space-y-6">
            {/* Étape 1: Informations de base */}
            <TabsContent value="1" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Informations de base du produit</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="Ex: Canapé d'angle en cuir..."
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="supplier_id">Fournisseur *</Label>
                    <Select
                      value={formData.supplier_id || ""}
                      onValueChange={(value) => updateFormData({ supplier_id: value })}
                    >
                      <SelectTrigger className={errors.supplier_id ? "border-red-500" : ""}>
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliersLoading ? (
                          <SelectItem value="loading" disabled>Chargement...</SelectItem>
                        ) : (
                          suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {errors.supplier_id && <p className="text-sm text-red-600 mt-1">{errors.supplier_id}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="sku">Référence SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku || ""}
                      onChange={(e) => updateFormData({ sku: e.target.value })}
                      placeholder="Ex: CAP-001 (optionnel, généré automatiquement)"
                      className={errors.sku ? "border-red-500" : ""}
                    />
                    {errors.sku && <p className="text-sm text-red-600 mt-1">{errors.sku}</p>}
                    <p className="text-xs text-gray-500 mt-1">Laissez vide pour génération automatique</p>
                  </div>

                  <div>
                    <Label htmlFor="supplier_reference">Référence fournisseur</Label>
                    <Input
                      id="supplier_reference"
                      value={formData.supplier_reference || ""}
                      onChange={(e) => updateFormData({ supplier_reference: e.target.value })}
                      placeholder="Ex: REF-FOURNISSEUR-12345"
                      className={errors.supplier_reference ? "border-red-500" : ""}
                    />
                    {errors.supplier_reference && <p className="text-sm text-red-600 mt-1">{errors.supplier_reference}</p>}
                    <p className="text-xs text-gray-500 mt-1">Référence du produit chez le fournisseur</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="supplier_page_url">Lien produit chez le fournisseur</Label>
                  <Input
                    id="supplier_page_url"
                    type="url"
                    value={formData.supplier_page_url || ""}
                    onChange={(e) => updateFormData({ supplier_page_url: e.target.value })}
                    placeholder="https://fournisseur.com/produit..."
                    className={errors.supplier_page_url ? "border-red-500" : ""}
                  />
                  {errors.supplier_page_url && <p className="text-sm text-red-600 mt-1">{errors.supplier_page_url}</p>}
                  <p className="text-xs text-gray-500 mt-1">URL vers la page produit chez le fournisseur (optionnel)</p>
                </div>

                <div className="mt-4">
                  <Label>Image principale</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    🎯 <strong>Système unifié :</strong> Cette image sera automatiquement ajoutée à votre galerie.
                    À l'étape 5, vous pourrez ajouter d'autres images et changer l'image principale si nécessaire.
                  </p>
                  <PrimaryImageUpload
                    productId={formData.id || ''}
                    productType="draft"
                    onImageUpload={handlePrimaryImageUpload}
                    onImageRemove={handlePrimaryImageRemove}
                    className="mt-2"
                  />
                </div>

                {/* Description supprimée de l'étape 1 - déplacée vers étape 3 */}

              </div>
            </TabsContent>

            {/* Étape 2: Catégorisation */}
            <TabsContent value="2" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Catégorisation du produit</h3>
                <SubcategorySearchSelector
                  value={formData.subcategory_id}
                  onChange={(subcategoryId) => {
                    updateFormData({ subcategory_id: subcategoryId })
                    setErrors({ ...errors, subcategory_id: '' })
                  }}
                  subcategories={subcategories}
                  placeholder="Rechercher une sous-catégorie..."
                  className={errors.subcategory_id ? "border-red-500" : ""}
                />
                {errors.subcategory_id && <p className="text-sm text-red-600 mt-1">{errors.subcategory_id}</p>}
              </div>
            </TabsContent>

            {/* Étape 3: Caractéristiques */}
            <TabsContent value="3" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Caractéristiques et descriptions</h3>

                {/* Couleur et matière avec listes déroulantes */}
                <ColorMaterialSelector
                  colorValue={formData.color}
                  materialValue={formData.material}
                  onColorChange={(color) => updateFormData({ color })}
                  onMaterialChange={(material) => updateFormData({ material })}
                  disabled={isSubmitting}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="weight">Poids (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight || ""}
                      onChange={(e) => updateFormData({ weight: parseFloat(e.target.value) })}
                      placeholder="Ex: 15.5"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label>Dimensions (cm)</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="width" className="text-sm">Largeur</Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.dimensions?.width || ""}
                        onChange={(e) => updateFormData({
                          dimensions: {
                            ...formData.dimensions,
                            width: parseFloat(e.target.value)
                          }
                        })}
                        placeholder="Largeur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-sm">Hauteur</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.dimensions?.height || ""}
                        onChange={(e) => updateFormData({
                          dimensions: {
                            ...formData.dimensions,
                            height: parseFloat(e.target.value)
                          }
                        })}
                        placeholder="Hauteur"
                      />
                    </div>
                    <div>
                      <Label htmlFor="depth" className="text-sm">Profondeur</Label>
                      <Input
                        id="depth"
                        type="number"
                        value={formData.dimensions?.depth || ""}
                        onChange={(e) => updateFormData({
                          dimensions: {
                            ...formData.dimensions,
                            depth: parseFloat(e.target.value)
                          }
                        })}
                        placeholder="Profondeur"
                      />
                    </div>
                  </div>
                </div>

                {/* Section Description */}
                <div className="mt-6 space-y-4">
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium mb-3">Description du produit</h4>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={formData.description || ""}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Description complète du produit..."
                          rows={4}
                          className="resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Description détaillée du produit pour le catalogue
                        </p>
                      </div>

                      {/* Champs additionnels pour drafts uniquement - afficher seulement s'ils existent */}
                      {(formData.supplier_description || formData.generated_description) && (
                        <div className="space-y-4">
                          <div className="text-xs text-gray-500 font-medium">Informations additionnelles (brouillons uniquement) :</div>

                          {formData.supplier_description && (
                            <div>
                              <Label htmlFor="supplier_description">Description fournisseur (brouillon)</Label>
                              <Textarea
                                id="supplier_description"
                                value={formData.supplier_description}
                                onChange={(e) => updateFormData({ supplier_description: e.target.value })}
                                placeholder="Description fournie par le fournisseur..."
                                rows={3}
                                className="resize-none bg-gray-50"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Note interne - non utilisée dans le produit final
                              </p>
                            </div>
                          )}

                          {formData.generated_description && (
                            <div>
                              <Label htmlFor="generated_description">Description générée (brouillon)</Label>
                              <Textarea
                                id="generated_description"
                                value={formData.generated_description}
                                onChange={(e) => updateFormData({ generated_description: e.target.value })}
                                placeholder="Description générée par IA..."
                                rows={3}
                                className="resize-none bg-gray-50"
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Note interne - non utilisée dans le produit final
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Étape 4: Tarification */}
            <TabsContent value="4" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Tarification du produit</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cost_price">Prix d'achat HT (€) *</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        updatePricing({ cost_price: value })
                      }}
                      placeholder="Ex: 150.00"
                      className={errors.cost_price ? "border-red-500" : ""}
                    />
                    {errors.cost_price && <p className="text-sm text-red-600 mt-1">{errors.cost_price}</p>}
                  </div>

                  <div>
                    <Label htmlFor="margin_percentage">Marge (%)</Label>
                    <Input
                      id="margin_percentage"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1000"
                      value={formData.margin_percentage || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        // Validation frontend : éviter NaN et valeurs hors limites
                        if (!isNaN(value) && value >= 0 && value <= 1000) {
                          updatePricing({ margin_percentage: value })
                        } else if (e.target.value === '') {
                          // Permettre la suppression (NULL)
                          updatePricing({ margin_percentage: undefined })
                        }
                      }}
                      placeholder="Ex: 100.0"
                      className={errors.margin_percentage ? "border-red-500" : ""}
                    />
                    {errors.margin_percentage && <p className="text-sm text-red-600 mt-1">{errors.margin_percentage}</p>}
                    <p className="text-xs text-gray-500 mt-1">Marge appliquée sur le prix d'achat (optionnel)</p>
                  </div>

                  <div>
                    <Label htmlFor="estimated_selling_price">Prix minimum de vente (estimation)</Label>
                    <Input
                      id="estimated_selling_price"
                      type="number"
                      step="0.01"
                      value={formData.estimated_selling_price?.toFixed(2) || ""}
                      placeholder="Calculé automatiquement"
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.supplier_price && formData.margin_percentage
                        ? `${formData.supplier_price}€ + ${formData.margin_percentage}% = ${formData.estimated_selling_price?.toFixed(2)}€`
                        : "Renseignez le prix d'achat et la marge"
                      }
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>


            {/* Étape 5: Galerie d'images complète */}
            <TabsContent value="5" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Galerie d'images</h3>
                <p className="text-sm text-gray-600 mb-4">
                  📸 <strong>Gestion unifiée :</strong> Toutes vos images sont ici, y compris celle de l'étape 1.
                  Ajoutez des images supplémentaires et définissez l'image principale avec l'étoile ⭐
                </p>

                {formData.id ? (
                  <div className="space-y-4">
                    {/* Upload zone */}
                    <div>
                      <Label>Ajouter des images supplémentaires</Label>
                      <p className="text-xs text-gray-500 mb-2">
                        Les images ajoutées ici rejoindront automatiquement votre galerie
                      </p>
                      <div
                        className="mt-2 p-6 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-400 transition-colors cursor-pointer"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.multiple = true
                          input.accept = 'image/*'
                          input.onchange = async (e) => {
                            const files = Array.from((e.target as HTMLInputElement).files || [])
                            if (files.length > 0) {
                              try {
                                await uploadMultipleImages(files, {
                                  imageType: 'gallery',
                                  altTextPrefix: formData.name || 'Image produit'
                                })
                              } catch (error) {
                                console.error('Erreur upload:', error)
                              }
                            }
                          }
                          input.click()
                        }}
                      >
                        {uploadingImages ? (
                          <div className="flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mr-2" />
                            <span className="text-gray-600">Upload en cours...</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-gray-600">Cliquez pour ajouter des images</p>
                            <p className="text-xs text-gray-400 mt-2">Ou glissez-déposez vos fichiers ici</p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Error display */}
                    {imagesError && (
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <p className="text-red-600 text-sm">{imagesError}</p>
                      </div>
                    )}

                    {/* Images grid */}
                    {hasImages ? (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Images uploadées ({draftImages.length})</Label>
                          <div className="text-xs text-gray-500">
                            Cliquez sur l'étoile pour définir l'image principale
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {draftImages.map((image, index) => (
                            <div
                              key={image.id}
                              className={`relative group border-2 rounded-lg overflow-hidden ${
                                image.is_primary ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              {/* Image */}
                              <div className="aspect-square">
                                {image.public_url ? (
                                  <img
                                    src={image.public_url}
                                    alt={image.alt_text || `Image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Overlay controls */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                                  {/* Set as primary button */}
                                  <Button
                                    size="sm"
                                    variant={image.is_primary ? "default" : "secondary"}
                                    onClick={() => {
                                      if (!image.is_primary) {
                                        setPrimaryImage(image.id)
                                      }
                                    }}
                                    disabled={image.is_primary}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Star className={`h-4 w-4 ${image.is_primary ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                  </Button>

                                  {/* Delete button */}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteImage(image.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Primary badge */}
                              {image.is_primary && (
                                <div className="absolute top-2 left-2">
                                  <Badge className="bg-blue-500 text-white text-xs">
                                    Principale
                                  </Badge>
                                </div>
                              )}

                              {/* Image info */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                                <p className="text-xs truncate">
                                  {image.file_name || `Image ${index + 1}`}
                                </p>
                                {image.file_size && (
                                  <p className="text-xs text-gray-300">
                                    {Math.round(image.file_size / 1024)} KB
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Aucune image dans la galerie</p>
                        <p className="text-sm">
                          {primaryImage
                            ? "Votre image principale est configurée. Ajoutez des images supplémentaires si nécessaire."
                            : "Commencez par ajouter votre première image à l'étape 1, ou ajoutez des images ici."
                          }
                        </p>
                      </div>
                    )}

                    {/* Information sur le système unifié */}
                    {primaryImage && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <p className="text-blue-800 text-sm">
                          <strong>✅ Image principale configurée :</strong> L'image ajoutée à l'étape 1 est automatiquement dans cette galerie.
                          Vous pouvez définir une autre image comme principale en cliquant sur l'étoile.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                    <p className="text-blue-800 text-sm">
                      Sauvegardez d'abord votre brouillon pour pouvoir ajouter des images
                    </p>
                    <Button
                      size="sm"
                      onClick={() => saveDraft(false)}
                      disabled={isSavingDraft}
                      className="mt-2"
                    >
                      {isSavingDraft ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder le brouillon'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Étape 6: Validation finale */}
            <TabsContent value="6" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Récapitulatif et validation</h3>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>✨ Création directe :</strong> Vous pouvez créer votre produit immédiatement ou sauvegarder comme brouillon pour continuer plus tard.
                    {formData.id && " (Brouillon existant sera converti en produit final)"}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Nom:</span> {formData.name}
                    </div>
                    <div>
                      <span className="font-medium">SKU:</span> {formData.sku || (formData.subcategory_id ? 'Généré automatiquement' : 'Sélectionnez une sous-catégorie')}
                    </div>
                    <div>
                      <span className="font-medium">Référence fournisseur:</span> {formData.supplier_reference || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Prix d'achat:</span> {(formData.cost_price || formData.supplier_price)?.toFixed(2) || 'N/A'}€
                    </div>
                    <div>
                      <span className="font-medium">Prix de vente estimé:</span> {formData.estimated_selling_price?.toFixed(2) || 'N/A'}€
                    </div>
                    <div>
                      <span className="font-medium">Statut:</span> {formData.status}
                    </div>
                    <div>
                      <span className="font-medium">État:</span> {formData.condition}
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-600 text-sm">{errors.submit}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Actions en bas */}
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveDraft(true)}
              disabled={isSavingDraft}
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder et fermer
                </>
              )}
            </Button>

            <span className="text-xs text-gray-500 ml-2">
              Sauvegarde manuelle du brouillon
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>
            )}

            {currentStep < WIZARD_STEPS.length ? (
              <Button onClick={nextStep}>
                Suivant
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={createProduct} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Créer le produit
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}