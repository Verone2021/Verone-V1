'use client'

/**
 * 🎯 VÉRONE - Modal Gestion Descriptions Produit
 *
 * Modal dédié pour la gestion complète des descriptions produit
 * - Description principale avec formatage riche
 * - Description technique détaillée
 * - Points de vente clés (bullet points)
 * - Aperçu en temps réel
 * - Compteur de caractères et SEO-friendly
 */

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ButtonV2 } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Save,
  Eye,
  Plus,
  X,
  AlertCircle,
  CheckCircle,
  Hash,
  Type,
  List,
  Edit
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { createClient } from '@/lib/supabase/client'

interface ProductDescriptionsModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  productName: string
  initialData?: {
    description?: string
    technical_description?: string
    selling_points?: string[]
  }
  onUpdate: (data: any) => void
}

// Suggestions de points de vente par type de produit
const SELLING_POINTS_SUGGESTIONS = [
  'Qualité premium garantie',
  'Livraison rapide et soignée',
  'Garantie constructeur étendue',
  'Finition artisanale',
  'Matériaux durables et écologiques',
  'Design exclusif',
  'Excellent rapport qualité-prix',
  'Service client dédié',
  'Installation possible',
  'Personnalisation disponible'
]

export function ProductDescriptionsModal({
  isOpen,
  onClose,
  productId,
  productName,
  initialData,
  onUpdate
}: ProductDescriptionsModalProps) {
  const supabase = createClient()

  // États locaux pour les formulaires
  const [description, setDescription] = useState('')
  const [technicalDescription, setTechnicalDescription] = useState('')
  const [sellingPoints, setSellingPoints] = useState<string[]>([])
  const [newSellingPoint, setNewSellingPoint] = useState('')

  // États UI
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [previewMode, setPreviewMode] = useState(false)

  // Initialiser les données
  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description || '')
      setTechnicalDescription(initialData.technical_description || '')
      setSellingPoints(initialData.selling_points || [])
    }
  }, [initialData])

  /**
   * 💾 Sauvegarde des descriptions
   */
  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      const updateData = {
        description: description.trim() || null,
        technical_description: technicalDescription.trim() || null,
        selling_points: sellingPoints.length > 0 ? sellingPoints : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', productId)

      if (error) throw error

      setSuccess(true)
      onUpdate(updateData)

      // Fermer le modal après 1.5s
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 1500)

    } catch (err) {
      // Amélioration de la gestion d'erreur pour éviter les objets vides
      let errorMessage = 'Erreur lors de la sauvegarde des descriptions'

      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = (err as any).message || errorMessage
      }

      console.error('❌ Erreur sauvegarde descriptions:', {
        error: err,
        message: errorMessage,
        productId,
        updateData: { description: description.trim(), technical_description: technicalDescription.trim() }
      })

      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  /**
   * ➕ Ajouter point de vente
   */
  const handleAddSellingPoint = () => {
    if (newSellingPoint.trim() && !sellingPoints.includes(newSellingPoint.trim())) {
      setSellingPoints(prev => [...prev, newSellingPoint.trim()])
      setNewSellingPoint('')
    }
  }

  /**
   * 🗑️ Supprimer point de vente
   */
  const handleRemoveSellingPoint = (index: number) => {
    setSellingPoints(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * 📊 Statistiques texte
   */
  const getTextStats = (text: string) => {
    const chars = text.length
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const lines = text.split('\n').length

    return {
      chars,
      words,
      lines,
      charColor: chars < 50 ? 'text-red-600' : chars > 500 ? 'text-black' : 'text-green-600'
    }
  }

  const mainStats = getTextStats(description)
  const techStats = getTextStats(technicalDescription)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-black" />
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-black">Descriptions produit</span>
              <span className="text-sm text-gray-600 font-normal">{productName}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {previewMode ? 'Éditer' : 'Aperçu'}
              </ButtonV2>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-6">

          {/* Messages d'état */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 mb-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ Descriptions mises à jour avec succès !
              </AlertDescription>
            </Alert>
          )}

          {/* Mode Aperçu Global */}
          {previewMode ? (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-black mb-4">Aperçu Final - {productName}</h3>

                {/* Description principale */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Description</h4>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {description || "Aucune description générale."}
                  </div>
                </div>

                {/* Description technique */}
                {technicalDescription && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Spécifications techniques</h4>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {technicalDescription}
                    </div>
                  </div>
                )}

                {/* Points de vente */}
                {sellingPoints.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-800 mb-2">Points forts</h4>
                    <ul className="space-y-1">
                      {sellingPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <div className="w-1.5 h-1.5 bg-black rounded-full flex-shrink-0 mt-2"></div>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Message si tout est vide */}
                {!description && !technicalDescription && sellingPoints.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <div className="text-sm">Aucune description disponible</div>
                    <div className="text-xs text-gray-400 mt-1">Commencez par remplir la description générale</div>
                  </div>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(false)}
                  className="text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Retour à l'édition
                </ButtonV2>
              </div>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main" className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Description principale
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Technique
              </TabsTrigger>
              <TabsTrigger value="selling" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Points de vente
              </TabsTrigger>
            </TabsList>

            {/* Description principale */}
            <TabsContent value="main" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description générale du produit
                  </Label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("font-medium", mainStats.charColor)}>
                      {mainStats.chars} caractères
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{mainStats.words} mots</span>
                  </div>
                </div>

                {previewMode ? (
                  <div className="min-h-[120px] p-4 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-wrap text-sm">
                    {description || "Aucune description"}
                  </div>
                ) : (
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez ce produit de manière attractive pour vos clients..."
                    className="min-h-[120px] text-sm"
                    rows={6}
                  />
                )}

                <div className="text-xs text-gray-500">
                  💡 Cette description sera visible par vos clients. Restez concis et mettez en avant les bénéfices.
                </div>
              </div>
            </TabsContent>

            {/* Description technique */}
            <TabsContent value="technical" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="technical_description" className="text-sm font-medium">
                    Description technique détaillée
                  </Label>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("font-medium", techStats.charColor)}>
                      {techStats.chars} caractères
                    </span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-600">{techStats.words} mots</span>
                  </div>
                </div>

                {previewMode ? (
                  <div className="min-h-[120px] p-4 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-wrap text-sm">
                    {technicalDescription || "Aucune description technique"}
                  </div>
                ) : (
                  <Textarea
                    id="technical_description"
                    value={technicalDescription}
                    onChange={(e) => setTechnicalDescription(e.target.value)}
                    placeholder="Spécifications techniques, matériaux, instructions d'entretien, etc..."
                    className="min-h-[120px] text-sm"
                    rows={6}
                  />
                )}

                <div className="text-xs text-gray-500">
                  🔧 Informations techniques détaillées pour les professionnels et clients avertis.
                </div>
              </div>
            </TabsContent>

            {/* Points de vente */}
            <TabsContent value="selling" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Points de vente clés</Label>
                  <Badge variant="outline" className="text-xs">
                    {sellingPoints.length} point{sellingPoints.length > 1 ? 's' : ''}
                  </Badge>
                </div>

                {/* Liste des points existants */}
                {sellingPoints.length > 0 && (
                  <div className="space-y-2">
                    {sellingPoints.map((point, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-black rounded-full flex-shrink-0"></div>
                        <span className="flex-1 text-sm">{point}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSellingPoint(index)}
                          className="text-red-600 hover:text-red-800 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </ButtonV2>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ajouter nouveau point */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={newSellingPoint}
                      onChange={(e) => setNewSellingPoint(e.target.value)}
                      placeholder="Nouveau point de vente attractif..."
                      className="flex-1 text-sm"
                      rows={2}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddSellingPoint}
                      disabled={!newSellingPoint.trim()}
                      className="h-fit mt-auto"
                    >
                      <Plus className="h-4 w-4" />
                    </ButtonV2>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 font-medium">Suggestions :</div>
                    <div className="flex flex-wrap gap-1">
                      {SELLING_POINTS_SUGGESTIONS.slice(0, 6).map(suggestion => (
                        <Badge
                          key={suggestion}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            if (!sellingPoints.includes(suggestion)) {
                              setSellingPoints(prev => [...prev, suggestion])
                            }
                          }}
                        >
                          + {suggestion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  🎯 Utilisez des phrases courtes et impactantes qui mettent en avant les bénéfices clients.
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </div>

        {/* Footer avec statistiques et actions */}
        <div className="border-t pt-4 bg-gray-50 -mx-6 -mb-6 px-6 pb-6 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>{mainStats.chars + techStats.chars} caractères total</span>
              <span>{sellingPoints.length} point{sellingPoints.length > 1 ? 's' : ''} de vente</span>
              {(description.trim() && technicalDescription.trim() && sellingPoints.length > 0) && (
                <span className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complet
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <ButtonV2 variant="outline" onClick={onClose} disabled={saving}>
                Annuler
              </ButtonV2>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {saving ? (
                  <>Sauvegarde...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </ButtonV2>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}