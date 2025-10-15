'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSourcingProducts } from '../../hooks/use-sourcing-products'
import { useToast } from '../../hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ButtonV2 } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { SupplierSelector } from './supplier-selector'
import {
  CheckCircle,
  ArrowLeft,
  Save,
  Eye,
  AlertCircle,
  Package,
  FileText,
  DollarSign,
  Settings,
  ImageIcon,
  Loader2
} from 'lucide-react'

interface DraftCompletionWizardProps {
  draftId: string
  onCancel?: () => void
  onSuccess?: (productId: string) => void
  onDraftUpdated?: () => void
}

export function DraftCompletionWizard({
  draftId,
  onCancel,
  onSuccess,
  onDraftUpdated
}: DraftCompletionWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const {
    getDraftForEdit,
    updateDraft,
    validateDraft,
    updateSampleRequirement
  } = useDrafts()

  // États
  const [draft, setDraft] = useState<DraftWithMeta | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('general')

  // États du formulaire
  const [formData, setFormData] = useState({
    // Informations générales
    name: '',
    description: '',
    technical_description: '',
    selling_points: [] as string[],

    // Pricing
    cost_price: null as number | null,
    target_margin_percentage: null as number | null,
    estimated_selling_price: null as number | null,

    // Caractéristiques
    subcategory_id: '',
    condition: 'new',
    dimensions: null as any,
    weight: null as number | null,
    variant_attributes: null as any,

    // Sourcing et échantillons
    requires_sample: false,
    supplier_id: '',
    supplier_reference: '',
    supplier_page_url: '',
    gtin: '',
    video_url: ''
  })

  // Charger le brouillon
  useEffect(() => {
    const loadDraft = async () => {
      try {
        setLoading(true)
        setError(null)

        const draftData = await getDraftForEdit(draftId)
        if (!draftData) {
          throw new Error('Brouillon non trouvé')
        }

        setDraft(draftData)

        // Pré-remplir le formulaire avec les données existantes
        setFormData({
          name: draftData.name || '',
          description: draftData.description || '',
          technical_description: draftData.technical_description || '',
          selling_points: draftData.selling_points || [],
          cost_price: draftData.cost_price || null,
          target_margin_percentage: draftData.target_margin_percentage || null,
          estimated_selling_price: draftData.estimated_selling_price || null,
          subcategory_id: draftData.subcategory_id || '',
          condition: draftData.condition || 'new',
          dimensions: draftData.dimensions || null,
          weight: draftData.weight || null,
          variant_attributes: draftData.variant_attributes || null,
          requires_sample: draftData.requires_sample || false,
          supplier_id: draftData.supplier_id || '',
          supplier_reference: draftData.supplier_reference || '',
          supplier_page_url: draftData.supplier_page_url || '',
          gtin: draftData.gtin || '',
          video_url: draftData.video_url || ''
        })

      } catch (error) {
        console.error('Erreur chargement brouillon:', error)
        setError(error instanceof Error ? error.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (draftId) {
      loadDraft()
    }
  }, [draftId, getDraftForEdit])

  // Sauvegarder les modifications
  const handleSave = async () => {
    if (!draft) return

    try {
      setSaving(true)

      await updateDraft(draft.id, formData)

      toast({
        title: "Brouillon sauvegardé",
        description: "Les modifications ont été enregistrées"
      })

      onDraftUpdated?.()

    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  // Valider et convertir en produit
  const handleValidate = async () => {
    if (!draft) return

    try {
      setValidating(true)

      // Sauvegarder d'abord
      await updateDraft(draft.id, formData)

      // Puis valider
      const newProduct = await validateDraft(draft.id)

      toast({
        title: "Produit validé",
        description: `Le brouillon a été converti en produit ${newProduct.sku}`
      })

      onSuccess?.(newProduct.id)

    } catch (error) {
      console.error('Erreur validation:', error)
      toast({
        title: "Erreur de validation",
        description: error instanceof Error ? error.message : "Impossible de valider le brouillon",
        variant: "destructive"
      })
    } finally {
      setValidating(false)
    }
  }

  // Gestion échantillonnage
  const handleSampleRequirementChange = async (requiresSample: boolean) => {
    if (!draft) return

    try {
      await updateSampleRequirement(draft.id, requiresSample)
      setFormData(prev => ({ ...prev, requires_sample: requiresSample }))

      toast({
        title: "Échantillonnage mis à jour",
        description: requiresSample ? "Échantillon requis" : "Échantillon non requis"
      })

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'exigence d'échantillonnage",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Chargement du brouillon...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !draft) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Erreur</h3>
            <p className="text-gray-600 mb-4">{error || 'Brouillon non trouvé'}</p>
            {onCancel && (
              <ButtonV2 onClick={onCancel} variant="outline">
                Retour
              </ButtonV2>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header avec informations du brouillon */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onCancel && (
                <ButtonV2 variant="ghost" size="sm" onClick={onCancel}>
                  <ArrowLeft className="h-4 w-4" />
                </ButtonV2>
              )}
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Complétion du brouillon
                </CardTitle>
                <p className="text-gray-600 mt-1">{draft.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Progression */}
              <div className="flex items-center space-x-2">
                <Progress value={draft.progressPercentage} className="w-24" />
                <span className="text-sm font-medium">{draft.progressPercentage}%</span>
              </div>

              {/* Badge état */}
              {draft.canFinalize ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Prêt à valider
                </Badge>
              ) : (
                <Badge variant="secondary">En cours</Badge>
              )}
            </div>
          </div>

          {/* Champs manquants */}
          {draft.missingFields && draft.missingFields.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-black mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Champs à compléter</h4>
                  <p className="text-sm text-gray-800 mt-1">
                    {draft.missingFields.join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Formulaire à onglets */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Général
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="characteristics" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Caractéristiques
              </TabsTrigger>
              <TabsTrigger value="sourcing" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Sourcing
              </TabsTrigger>
            </TabsList>

            {/* Onglet Général */}
            <TabsContent value="general" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nom du produit"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description du produit"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="technical_description">Description technique</Label>
                    <Textarea
                      id="technical_description"
                      value={formData.technical_description}
                      onChange={(e) => setFormData(prev => ({ ...prev, technical_description: e.target.value }))}
                      placeholder="Description technique interne"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Image principale */}
                  {draft.primary_image_url && (
                    <div>
                      <Label>Image principale</Label>
                      <div className="mt-2 border rounded-lg p-4">
                        <img
                          src={draft.primary_image_url}
                          alt={draft.name}
                          className="w-full h-48 object-cover rounded"
                        />
                      </div>
                    </div>
                  )}

                  {/* Échantillonnage */}
                  <div>
                    <Label>Gestion des échantillons</Label>
                    <div className="mt-2 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Nécessite un échantillon</h4>
                          <p className="text-sm text-gray-600">
                            Active la gestion d'échantillons pour ce produit
                          </p>
                        </div>
                        <Switch
                          checked={formData.requires_sample}
                          onCheckedChange={handleSampleRequirementChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Pricing */}
            <TabsContent value="pricing" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="cost_price">Prix d'achat HT * (€)</Label>
                  <Input
                    id="cost_price"
                    type="number"
                    step="0.01"
                    value={formData.cost_price || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      cost_price: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="margin">Marge cible (%)</Label>
                  <Input
                    id="margin"
                    type="number"
                    step="1"
                    value={formData.target_margin_percentage || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      target_margin_percentage: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    placeholder="30"
                  />
                </div>

                <div>
                  <Label htmlFor="selling_price">Prix de vente estimé HT (€)</Label>
                  <Input
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.estimated_selling_price || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      estimated_selling_price: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Onglet Caractéristiques */}
            <TabsContent value="characteristics" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="condition">État</Label>
                  <select
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="new">Neuf</option>
                    <option value="refurbished">Reconditionné</option>
                    <option value="used">Occasion</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="weight">Poids (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      weight: e.target.value ? parseFloat(e.target.value) : null
                    }))}
                    placeholder="0.0"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Onglet Sourcing */}
            <TabsContent value="sourcing" className="space-y-6 mt-6">
              <div className="space-y-4">
                {/* Sélection du fournisseur */}
                <SupplierSelector
                  selectedSupplierId={formData.supplier_id}
                  onSupplierChange={(supplierId) => setFormData(prev => ({ ...prev, supplier_id: supplierId || '' }))}
                  required={true}
                  label="Fournisseur *"
                  placeholder="Sélectionner le fournisseur de ce produit"
                />

                <div>
                  <Label htmlFor="supplier_page_url">URL page fournisseur</Label>
                  <Input
                    id="supplier_page_url"
                    type="url"
                    value={formData.supplier_page_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_page_url: e.target.value }))}
                    placeholder="https://fournisseur.com/produit"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supplier_reference">Référence fournisseur</Label>
                    <Input
                      id="supplier_reference"
                      value={formData.supplier_reference}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_reference: e.target.value }))}
                      placeholder="REF-FOURNISSEUR"
                    />
                  </div>

                  <div>
                    <Label htmlFor="gtin">Code GTIN/EAN</Label>
                    <Input
                      id="gtin"
                      value={formData.gtin}
                      onChange={(e) => setFormData(prev => ({ ...prev, gtin: e.target.value }))}
                      placeholder="1234567890123"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="video_url">URL vidéo produit</Label>
                  <Input
                    id="video_url"
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v="
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Dernière modification : {draft.lastModified}
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving || validating}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </ButtonV2>

              <Button
                onClick={handleValidate}
                disabled={!draft.canFinalize || saving || validating}
                className="bg-green-600 hover:bg-green-700"
              >
                {validating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Valider le produit
              </ButtonV2>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}