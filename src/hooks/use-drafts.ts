import { useState, useEffect } from 'react'
import { createClient } from '../lib/supabase/client'
import { ProductDraftData } from '../components/forms/product-creation-wizard'
import { SourcingFormData } from './use-products'

// Champs obligatoires selon le mode de création
const REQUIRED_FIELDS_SOURCING = [
  'name',
  'supplier_page_url'
  // image: géré séparément via upload
] as const

const REQUIRED_FIELDS_COMPLETE = [
  'name',
  'cost_price',
  'description',
  'subcategory_id'
] as const

// Mapping des champs avec leurs libellés pour l'utilisateur
const FIELD_LABELS: Record<string, string> = {
  name: 'Nom du produit',
  supplier_page_url: 'URL page fournisseur',
  cost_price: 'Prix d\'achat',
  description: 'Description',
  subcategory_id: 'Catégorie',
  assigned_client_id: 'Client assigné',
  // Anciens champs pour compatibilité
  sku: 'Référence SKU',
  supplier_id: 'Fournisseur',
  supplier_price: 'Prix fournisseur'
}

// Fonction pour calculer la progression réelle basée sur les champs remplis
function calculateRealProgress(draft: ProductDraftData): number {
  // Déterminer le mode de création (par défaut : complete pour compatibilité)
  const creationMode = (draft as any).creation_mode || 'complete'

  // Choisir les champs obligatoires selon le mode
  const requiredFields = creationMode === 'sourcing'
    ? REQUIRED_FIELDS_SOURCING
    : REQUIRED_FIELDS_COMPLETE

  // Ajouter validation client pour produits sur-mesure
  const productType = (draft as any).product_type || 'standard'
  const fieldsToCheck = [...requiredFields]
  if (productType === 'custom') {
    fieldsToCheck.push('assigned_client_id' as any)
  }

  const filledFields = fieldsToCheck.filter(field => {
    const value = draft[field as keyof ProductDraftData]
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined
  })

  return Math.round((filledFields.length / fieldsToCheck.length) * 100)
}

// Fonction pour identifier les champs manquants
function getMissingFields(draft: ProductDraftData): string[] {
  // Déterminer le mode de création (par défaut : complete pour compatibilité)
  const creationMode = (draft as any).creation_mode || 'complete'

  // Choisir les champs obligatoires selon le mode
  const requiredFields = creationMode === 'sourcing'
    ? REQUIRED_FIELDS_SOURCING
    : REQUIRED_FIELDS_COMPLETE

  // Ajouter validation client pour produits sur-mesure
  const productType = (draft as any).product_type || 'standard'
  const fieldsToCheck = [...requiredFields]
  if (productType === 'custom') {
    fieldsToCheck.push('assigned_client_id' as any)
  }

  const missingFields = fieldsToCheck.filter(field => {
    const value = draft[field as keyof ProductDraftData]
    if (typeof value === 'string') {
      return value.trim().length === 0
    }
    return value === null || value === undefined
  })

  return missingFields.map(field => FIELD_LABELS[field] || field)
}

export interface DraftWithMeta extends ProductDraftData {
  id: string
  created_at: string
  updated_at: string
  created_by: string
  // NOUVEAUX CHAMPS - Système sourcing et différenciation
  product_type?: 'standard' | 'custom'
  assigned_client_id?: string
  creation_mode?: 'sourcing' | 'complete'
  sourcing_type?: 'interne' | 'client' // Nouveau champ pour distinguer le type de sourcing
  requires_sample?: boolean // NOUVEAU - Exigence d'échantillonnage
  // Métadonnées calculées
  progressPercentage: number
  lastModified: string
  canFinalize: boolean
  missingFields: string[]
  // Image principale de la table normalisée
  primary_image_url?: string
  // Relations étendues
  assigned_client?: {
    id: string
    name: string
    type: string
  }
}

interface DraftsState {
  drafts: DraftWithMeta[]
  loading: boolean
  error: string | null
  total: number
}

export function useDrafts() {
  const [state, setState] = useState<DraftsState>({
    drafts: [],
    loading: true,
    error: null,
    total: 0
  })

  const supabase = createClient()

  // Charger tous les brouillons de l'utilisateur connecté
  const loadDrafts = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Utilisateur non authentifié')
      }

      const { data, error, count } = await supabase
        .from('product_drafts')
        .select(`
          *,
          product_draft_images!product_draft_images_product_draft_id_fkey(
            storage_path,
            is_primary
          )
        `, { count: 'exact' })
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Enrichir les données avec des métadonnées calculées - OPTIMISÉ
      const enrichedDrafts: DraftWithMeta[] = (data || []).map(draft => {
        // L'image principale est déjà récupérée via JOIN
        let primaryImageUrl: string | undefined = undefined

        if (draft.product_draft_images && draft.product_draft_images.length > 0) {
          // Chercher d'abord l'image primaire
          const primaryImage = draft.product_draft_images.find(img => img.is_primary) || draft.product_draft_images[0]
          if (primaryImage?.storage_path) {
            primaryImageUrl = supabase.storage
              .from('product-images')
              .getPublicUrl(primaryImage.storage_path).data.publicUrl
          }
        }

        return {
          ...draft,
          // Calculer le pourcentage de progression basé sur la complétude réelle des champs
          progressPercentage: calculateRealProgress(draft),

          // Format de date lisible
          lastModified: new Date(draft.updated_at).toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),

          // Peut être finalisé si tous les champs obligatoires sont remplis (100%)
          canFinalize: calculateRealProgress(draft) === 100,

          // Liste des champs manquants pour l'utilisateur
          missingFields: getMissingFields(draft),

          // URL de l'image principale depuis la table normalisée
          primary_image_url: primaryImageUrl
        }
      });

      setState(prev => ({
        ...prev,
        drafts: enrichedDrafts,
        total: count || 0,
        loading: false
      }))

    } catch (error) {
      console.error('Erreur chargement brouillons:', error)
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        loading: false
      }))
    }
  }

  // Supprimer un brouillon
  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('product_drafts')
        .delete()
        .eq('id', draftId)

      if (error) throw error

      // Mise à jour optimiste
      setState(prev => ({
        ...prev,
        drafts: prev.drafts.filter(d => d.id !== draftId),
        total: prev.total - 1
      }))

      console.log('✅ Brouillon supprimé avec succès')
      return true

    } catch (error) {
      console.error('❌ Erreur suppression brouillon:', error)
      throw error
    }
  }

  // Dupliquer un brouillon
  const duplicateDraft = async (draftId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Récupérer le brouillon source
      const { data: sourceDraft, error: fetchError } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('id', draftId)
        .single()

      if (fetchError) throw fetchError

      // Créer une copie avec un nouveau nom
      const duplicateData = {
        ...sourceDraft,
        id: undefined, // Laisser Supabase générer un nouvel ID
        name: `${sourceDraft.name} (Copie)`,
        wizard_step_completed: 0, // Remettre à zéro la progression
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newDraft, error: createError } = await supabase
        .from('product_drafts')
        .insert(duplicateData)
        .select()
        .single()

      if (createError) throw createError

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Brouillon dupliqué avec succès')
      return newDraft

    } catch (error) {
      console.error('❌ Erreur duplication brouillon:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Créer un brouillon sourcing rapide
  const createSourcingDraft = async (data: SourcingFormData & { imageFile?: File }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Validation des 3 champs obligatoires pour sourcing
      if (!data.name || !data.supplier_page_url) {
        throw new Error('Nom et URL fournisseur sont obligatoires pour le sourcing')
      }

      // Calculer le type de sourcing automatiquement
      const sourcingType = data.assigned_client_id ? 'client' : 'interne'

      const draftData = {
        name: data.name,
        supplier_page_url: data.supplier_page_url,
        creation_mode: 'sourcing',
        sourcing_type: sourcingType,
        product_type: 'standard', // Par défaut
        assigned_client_id: data.assigned_client_id || null,
        wizard_step_completed: 1, // Étape 1 completée pour sourcing
        created_by: user.id
      }

      const { data: newDraft, error } = await supabase
        .from('product_drafts')
        .insert(draftData)
        .select()
        .single()

      if (error) throw error

      // Si une image est fournie, l'uploader CORRECTEMENT
      if (data.imageFile && newDraft) {
        try {
          // 1. Générer nom de fichier avec extension
          const fileExt = data.imageFile.name.split('.').pop()?.toLowerCase()
          const fileName = `draft-${newDraft.id}-${Date.now()}.${fileExt}`

          // 2. Upload vers Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, data.imageFile, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('❌ Erreur upload image:', uploadError)
            throw uploadError
          }

          // 3. Créer l'entrée dans product_draft_images avec TOUS les champs requis
          const { error: dbError } = await supabase
            .from('product_draft_images')
            .insert({
              product_draft_id: newDraft.id,
              storage_path: uploadData.path,
              is_primary: true,
              image_type: 'primary',
              alt_text: data.name,
              file_size: data.imageFile.size,
              format: fileExt || 'jpg',
              display_order: 0
            })

          if (dbError) {
            // Nettoyer le fichier uploadé en cas d'erreur DB
            await supabase.storage.from('product-images').remove([uploadData.path])
            console.error('❌ Erreur insertion DB image:', dbError)
            throw dbError
          }

          console.log('✅ Image sourcing uploadée avec succès:', uploadData.path)

        } catch (imageError) {
          console.error('⚠️ Erreur upload image sourcing:', imageError)
          // Ne pas faire échouer tout le processus si l'image échoue
          // Le brouillon est créé, mais sans image
        }
      }

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Brouillon sourcing créé avec succès')
      return newDraft

    } catch (error) {
      console.error('❌ Erreur création brouillon sourcing:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Assigner un client à un produit sur-mesure
  const assignClientToProduct = async (draftId: string, clientId: string) => {
    try {
      const { error } = await supabase
        .from('product_drafts')
        .update({
          product_type: 'custom',
          assigned_client_id: clientId
        })
        .eq('id', draftId)

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Client assigné avec succès')
      return true

    } catch (error) {
      console.error('❌ Erreur assignation client:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Filtrer par type de produit
  const filterByType = (type: 'standard' | 'custom') => {
    return state.drafts.filter(d => (d.product_type || 'standard') === type)
  }

  // NOUVELLE FONCTION : Filtrer par mode de création
  const filterByCreationMode = (mode: 'sourcing' | 'complete') => {
    return state.drafts.filter(d => (d.creation_mode || 'complete') === mode)
  }

  // NOUVELLE FONCTION : Récupérer un brouillon pour édition
  const getDraftForEdit = async (draftId: string): Promise<DraftWithMeta | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data: draft, error } = await supabase
        .from('product_drafts')
        .select(`
          *,
          assigned_client:organisations!assigned_client_id (
            id,
            name,
            type
          )
        `)
        .eq('id', draftId)
        .eq('created_by', user.id)
        .single()

      if (error) throw error

      // Enrichir avec métadonnées comme dans loadDrafts
      let primaryImageUrl: string | undefined = undefined

      try {
        const { data: primaryImage } = await supabase
          .from('product_draft_images')
          .select('storage_path')
          .eq('product_draft_id', draft.id)
          .eq('is_primary', true)
          .maybeSingle()

        if (primaryImage && primaryImage.storage_path) {
          primaryImageUrl = supabase.storage
            .from('product-images')
            .getPublicUrl(primaryImage.storage_path).data.publicUrl
        }
      } catch (imageError) {
        console.error('⚠️ Erreur récupération image pour édition:', imageError)
      }

      const enrichedDraft: DraftWithMeta = {
        ...draft,
        progressPercentage: calculateRealProgress(draft),
        lastModified: new Date(draft.updated_at).toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        canFinalize: calculateRealProgress(draft) === 100,
        missingFields: getMissingFields(draft),
        primary_image_url: primaryImageUrl
      }

      console.log('✅ Brouillon récupéré pour édition:', enrichedDraft.name)
      return enrichedDraft

    } catch (error) {
      console.error('❌ Erreur récupération brouillon pour édition:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Mettre à jour un brouillon
  const updateDraft = async (draftId: string, updates: Partial<ProductDraftData & { requires_sample?: boolean }>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      const { data: updatedDraft, error } = await supabase
        .from('product_drafts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)
        .eq('created_by', user.id)
        .select()
        .single()

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Brouillon mis à jour avec succès')
      return updatedDraft

    } catch (error) {
      console.error('❌ Erreur mise à jour brouillon:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Valider un brouillon et le convertir en produit
  const validateDraft = async (draftId: string): Promise<any> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // 1. Récupérer le brouillon complet
      const { data: draft, error: draftError } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('created_by', user.id)
        .single()

      if (draftError) throw draftError

      // 2. Vérifier si c'est un produit sourcing - workflow différent
      if (draft.creation_mode === 'sourcing') {
        // ✅ WORKFLOW SOURCING CORRIGÉ : Ne pas transférer automatiquement vers products
        // Vérifier les validations requises pour sourcing
        if (!draft.supplier_id) {
          throw new Error('Fournisseur obligatoire pour valider un produit sourcing')
        }

        // Si échantillon requis, on ne peut pas valider directement vers catalogue
        if (draft.requires_sample) {
          throw new Error('Les produits nécessitant un échantillon doivent d\'abord passer par la validation échantillons')
        }

        // Mettre à jour le statut pour marquer comme "prêt pour catalogue"
        const { data: updatedDraft, error: updateError } = await supabase
          .from('product_drafts')
          .update({
            status: 'ready_for_catalog',
            validated_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', draftId)
          .select()
          .single()

        if (updateError) throw updateError

        // Recharger la liste
        await loadDrafts()

        console.log('✅ Produit sourcing marqué comme prêt pour catalogue')
        return updatedDraft
      }

      // 3. Pour les produits non-sourcing : workflow classique
      // Vérifier que le brouillon est finalisable
      const progress = calculateRealProgress(draft)
      if (progress < 100) {
        throw new Error(`Brouillon incomplet (${progress}%). Complétez tous les champs obligatoires.`)
      }

      // 4. Récupérer les images du brouillon
      const { data: draftImages } = await supabase
        .from('product_draft_images')
        .select('*')
        .eq('product_draft_id', draftId)

      // 5. Créer le produit dans la table products (workflow classique uniquement)
      const productData = {
        sku: `VER-${Date.now()}`, // SKU obligatoire
        name: draft.name,
        price_ht: draft.estimated_selling_price || draft.cost_price * 1.5, // Prix HT obligatoire
        description: draft.description,
        technical_description: draft.technical_description,
        selling_points: draft.selling_points || [],
        cost_price: draft.cost_price,
        supplier_page_url: draft.supplier_page_url,
        product_type: draft.product_type || 'standard',
        assigned_client_id: draft.assigned_client_id,
        creation_mode: draft.creation_mode || 'complete',
        requires_sample: draft.requires_sample || false,
        subcategory_id: draft.subcategory_id,
        supplier_id: draft.supplier_id,
        supplier_reference: draft.supplier_reference,
        condition: draft.condition || 'new',
        variant_attributes: draft.variant_attributes,
        dimensions: draft.dimensions,
        weight: draft.weight,
        video_url: draft.video_url,
        gtin: draft.gtin,
        availability_type: draft.availability_type || 'normal',
        target_margin_percentage: draft.target_margin_percentage
      }

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (productError) throw productError

      // 5. Migrer les images vers product_images
      if (draftImages && draftImages.length > 0) {
        const productImages = draftImages.map(img => ({
          product_id: newProduct.id,
          storage_path: img.storage_path,
          is_primary: img.is_primary,
          image_type: img.image_type,
          alt_text: img.alt_text,
          file_size: img.file_size,
          format: img.format,
          display_order: img.display_order
        }))

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(productImages)

        if (imagesError) {
          console.error('⚠️ Erreur migration images:', imagesError)
          // Ne pas faire échouer la validation pour les images
        }
      }

      // 6. Supprimer le brouillon et ses images
      await supabase.from('product_draft_images').delete().eq('product_draft_id', draftId)
      await supabase.from('product_drafts').delete().eq('id', draftId)

      // 7. Recharger la liste des brouillons
      await loadDrafts()

      console.log('✅ Brouillon validé et converti en produit:', newProduct.sku)
      return newProduct

    } catch (error) {
      console.error('❌ Erreur validation brouillon:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Finaliser un produit sourcing vers le catalogue
  const finalizeToProduct = async (draftId: string): Promise<any> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // 1. Récupérer le brouillon sourcing
      const { data: draft, error: draftError } = await supabase
        .from('product_drafts')
        .select('*')
        .eq('id', draftId)
        .eq('creation_mode', 'sourcing')
        .single()

      if (draftError) throw draftError

      // 2. Validations business rules sourcing
      if (!draft.supplier_id) {
        throw new Error('Fournisseur obligatoire pour finaliser un produit sourcing')
      }

      if (draft.requires_sample) {
        throw new Error('Les produits nécessitant un échantillon doivent d\'abord être validés via échantillons')
      }

      if (!draft.cost_price || draft.cost_price <= 0) {
        throw new Error('Prix d\'achat obligatoire pour finaliser un produit sourcing')
      }

      // 3. Récupérer les images du brouillon
      const { data: draftImages } = await supabase
        .from('product_draft_images')
        .select('*')
        .eq('product_draft_id', draftId)

      // 4. Créer le produit final dans la table products
      const productData = {
        sku: `VER-${Date.now()}`, // SKU obligatoire généré automatiquement
        name: draft.name,
        price_ht: draft.estimated_selling_price || draft.cost_price * 1.5, // Prix HT obligatoire
        description: draft.description,
        technical_description: draft.technical_description,
        selling_points: draft.selling_points || [],
        cost_price: draft.cost_price,
        supplier_page_url: draft.supplier_page_url,
        product_type: draft.product_type || 'standard',
        assigned_client_id: draft.assigned_client_id,
        creation_mode: draft.creation_mode,
        requires_sample: false, // Déjà validé
        subcategory_id: draft.subcategory_id,
        supplier_id: draft.supplier_id,
        supplier_reference: draft.supplier_reference,
        condition: draft.condition || 'new',
        variant_attributes: draft.variant_attributes,
        dimensions: draft.dimensions,
        weight: draft.weight,
        video_url: draft.video_url,
        gtin: draft.gtin,
        availability_type: draft.availability_type || 'normal',
        target_margin_percentage: draft.target_margin_percentage,
        estimated_selling_price: draft.estimated_selling_price,
        status: 'in_stock' // Produit actif dans le catalogue
      }

      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single()

      if (productError) throw productError

      // 5. Migrer les images vers product_images
      if (draftImages && draftImages.length > 0) {
        const productImages = draftImages.map(img => ({
          product_id: newProduct.id,
          storage_path: img.storage_path,
          is_primary: img.is_primary,
          image_type: img.image_type,
          alt_text: img.alt_text,
          file_size: img.file_size,
          format: img.format,
          display_order: img.display_order
        }))

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(productImages)

        if (imagesError) {
          console.error('⚠️ Erreur migration images:', imagesError)
        }
      }

      // 6. Supprimer le brouillon sourcing et ses images
      await supabase.from('product_draft_images').delete().eq('product_draft_id', draftId)
      await supabase.from('product_drafts').delete().eq('id', draftId)

      // 7. Recharger la liste des brouillons
      await loadDrafts()

      console.log('✅ Produit sourcing finalisé et ajouté au catalogue:', newProduct.sku)
      return newProduct

    } catch (error) {
      console.error('❌ Erreur finalisation produit sourcing:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Mettre à jour l'exigence d'échantillonnage
  const updateSampleRequirement = async (draftId: string, requiresSample: boolean) => {
    try {
      const { error } = await supabase
        .from('product_drafts')
        .update({
          requires_sample: requiresSample,
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Exigence échantillonnage mise à jour')
      return true

    } catch (error) {
      console.error('❌ Erreur mise à jour échantillonnage:', error)
      throw error
    }
  }

  // ===== WORKFLOW SOURCING AVANCÉ 2025 - IMPLÉMENTATION COMPLÈTE =====

  // NOUVELLE FONCTION : Valider un brouillon sourcing avec workflow conditionnel
  const validateSourcingDraft = async (draftId: string, validationData: {
    supplier_id: string
    cost_price: number
    requires_sample: boolean
    estimated_selling_price?: number
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Appel fonction RPC pour validation avec business rules
      const { data: result, error } = await supabase.rpc('validate_sourcing_draft', {
        p_draft_id: draftId,
        p_supplier_id: validationData.supplier_id,
        p_cost_price: validationData.cost_price,
        p_requires_sample: validationData.requires_sample,
        p_estimated_selling_price: validationData.estimated_selling_price,
        p_validated_by: user.id
      })

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Brouillon sourcing validé avec succès')
      return result
    } catch (error) {
      console.error('❌ Erreur validation sourcing:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Ajouter un échantillon à une commande groupée
  const addSampleToOrder = async (
    draftId: string,
    orderId: string | null,
    sampleData: {
      description: string
      estimated_cost: number
      delivery_time_days: number
      supplier_id: string
    }
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Si pas d'ordre existant, créer un nouveau
      let actualOrderId = orderId
      if (!actualOrderId) {
        const { data: newOrder, error: orderError } = await supabase
          .from('sample_orders')
          .insert({
            supplier_id: sampleData.supplier_id,
            status: 'draft',
            created_by: user.id,
            estimated_total_cost: sampleData.estimated_cost,
            expected_delivery_days: sampleData.delivery_time_days
          })
          .select()
          .single()

        if (orderError) throw orderError
        actualOrderId = newOrder.id
      }

      // Ajouter l'item à la commande
      const { data: orderItem, error: itemError } = await supabase
        .from('sample_order_items')
        .insert({
          sample_order_id: actualOrderId,
          product_draft_id: draftId,
          description: sampleData.description,
          estimated_cost: sampleData.estimated_cost,
          delivery_time_days: sampleData.delivery_time_days,
          status: 'pending'
        })
        .select()
        .single()

      if (itemError) throw itemError

      // Mettre à jour le brouillon avec les infos échantillon
      await supabase
        .from('product_drafts')
        .update({
          sample_status: 'request_pending',
          sample_description: sampleData.description,
          sample_estimated_cost: sampleData.estimated_cost,
          sample_delivery_time_days: sampleData.delivery_time_days,
          sample_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', draftId)

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Échantillon ajouté à la commande groupée')
      return { orderId: actualOrderId, itemId: orderItem.id }
    } catch (error) {
      console.error('❌ Erreur ajout échantillon à commande:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Soumettre une commande d'échantillons pour approbation
  const submitSampleOrderForApproval = async (orderId: string) => {
    try {
      // Appel fonction RPC pour soumission avec validation
      const { data: result, error } = await supabase.rpc('submit_sample_order_for_approval', {
        p_order_id: orderId
      })

      if (error) throw error

      // Recharger la liste pour mettre à jour les statuts
      await loadDrafts()

      console.log('✅ Commande d\'échantillons soumise pour approbation')
      return result
    } catch (error) {
      console.error('❌ Erreur soumission commande échantillons:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Approuver une commande d'échantillons
  const approveSampleOrder = async (orderId: string, approvalNotes?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Appel fonction RPC pour approbation
      const { data: result, error } = await supabase.rpc('approve_sample_order', {
        p_order_id: orderId,
        p_approved_by: user.id,
        p_approval_notes: approvalNotes
      })

      if (error) throw result

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Commande d\'échantillons approuvée')
      return result
    } catch (error) {
      console.error('❌ Erreur approbation commande échantillons:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Marquer une commande comme livrée
  const markSampleOrderDelivered = async (orderId: string) => {
    try {
      // Appel fonction RPC pour marquage livraison
      const { data: result, error } = await supabase.rpc('mark_sample_order_delivered', {
        p_order_id: orderId
      })

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Commande marquée comme livrée')
      return result
    } catch (error) {
      console.error('❌ Erreur marquage livraison:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Valider des échantillons
  const validateSamples = async (
    draftIds: string[],
    validationResult: 'approved' | 'rejected',
    validationNotes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non authentifié')

      // Appel fonction RPC pour validation échantillons
      const { data: result, error } = await supabase.rpc('validate_samples', {
        p_draft_ids: draftIds,
        p_validation_result: validationResult,
        p_validation_notes: validationNotes,
        p_validated_by: user.id
      })

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log(`✅ Échantillons ${validationResult === 'approved' ? 'validés' : 'rejetés'}`)
      return result
    } catch (error) {
      console.error('❌ Erreur validation échantillons:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Transférer vers catalogue après validation échantillons
  const transferToProductCatalog = async (draftId: string) => {
    try {
      // Appel fonction RPC pour transfert sécurisé avec business rules
      const { data: result, error } = await supabase.rpc('transfer_to_product_catalog', {
        p_draft_id: draftId
      })

      if (error) throw error

      // Recharger la liste
      await loadDrafts()

      console.log('✅ Produit transféré au catalogue avec succès')
      return result
    } catch (error) {
      console.error('❌ Erreur transfert vers catalogue:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Obtenir les commandes d'échantillons groupées
  const getSampleOrdersForSupplier = async (supplierId: string) => {
    try {
      const { data: orders, error } = await supabase
        .from('sample_orders')
        .select(`
          *,
          sample_order_items (
            *,
            product_drafts (
              id,
              name,
              supplier_page_url
            )
          ),
          suppliers (
            id,
            name,
            contact_email,
            contact_phone
          )
        `)
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`✅ Commandes échantillons récupérées pour fournisseur ${supplierId}`)
      return orders || []
    } catch (error) {
      console.error('❌ Erreur récupération commandes échantillons:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Obtenir les métriques de workflow sourcing
  const getSourcingWorkflowMetrics = async () => {
    try {
      const { data: metrics, error } = await supabase
        .from('sourcing_workflow_metrics')
        .select('*')
        .single()

      if (error) throw error

      console.log('✅ Métriques workflow sourcing récupérées')
      return metrics
    } catch (error) {
      console.error('❌ Erreur récupération métriques sourcing:', error)
      throw error
    }
  }

  // NOUVELLE FONCTION : Filtrer les brouillons par statut workflow
  const filterByWorkflowStatus = (status: string) => {
    return state.drafts.filter(d => {
      const sourcingStatus = (d as any).sourcing_status || 'draft'
      return sourcingStatus === status
    })
  }

  // NOUVELLE FONCTION : Obtenir les brouillons nécessitant des échantillons
  const getDraftsRequiringSamples = () => {
    return state.drafts.filter(d =>
      d.creation_mode === 'sourcing' &&
      d.requires_sample === true &&
      (d as any).sample_status !== 'approved'
    )
  }

  // NOUVELLE FONCTION : Obtenir les brouillons prêts pour le catalogue
  const getDraftsReadyForCatalog = () => {
    return state.drafts.filter(d => {
      if (d.creation_mode !== 'sourcing') return false

      // Cas 1: Pas d'échantillon requis ET sourcing validé
      if (d.requires_sample === false && (d as any).sourcing_status === 'sourcing_validated') {
        return true
      }

      // Cas 2: Échantillon requis ET échantillon validé
      if (d.requires_sample === true && (d as any).sample_status === 'approved') {
        return true
      }

      return false
    })
  }

  // Charger les données au montage
  useEffect(() => {
    loadDrafts()
  }, [])

  // Statistiques calculées étendues
  const stats = {
    total: state.drafts.length,
    recent: state.drafts.filter(d => {
      const dayAgo = new Date()
      dayAgo.setDate(dayAgo.getDate() - 1)
      return new Date(d.updated_at) > dayAgo
    }).length,
    readyToFinalize: state.drafts.filter(d => d.canFinalize).length,
    inProgress: state.drafts.filter(d => d.wizard_step_completed > 0 && !d.canFinalize).length,
    // NOUVELLES STATS
    sourcing: state.drafts.filter(d => d.creation_mode === 'sourcing').length,
    complete: state.drafts.filter(d => (d.creation_mode || 'complete') === 'complete').length,
    standard: state.drafts.filter(d => (d.product_type || 'standard') === 'standard').length,
    custom: state.drafts.filter(d => d.product_type === 'custom').length
  }

  return {
    ...state,
    loadDrafts,
    deleteDraft,
    duplicateDraft,
    // NOUVELLES FONCTIONS
    createSourcingDraft,
    assignClientToProduct,
    filterByType,
    filterByCreationMode,
    // FONCTIONS DE GESTION ET VALIDATION
    getDraftForEdit,
    updateDraft,
    validateDraft,
    finalizeToProduct,
    updateSampleRequirement,
    // WORKFLOW SOURCING AVANCÉ 2025
    validateSourcingDraft,
    addSampleToOrder,
    submitSampleOrderForApproval,
    approveSampleOrder,
    markSampleOrderDelivered,
    validateSamples,
    transferToProductCatalog,
    getSampleOrdersForSupplier,
    getSourcingWorkflowMetrics,
    filterByWorkflowStatus,
    getDraftsRequiringSamples,
    getDraftsReadyForCatalog,
    stats
  }
}