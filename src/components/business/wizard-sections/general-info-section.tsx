"use client"

import { useState } from 'react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { Plus, X, Info } from 'lucide-react'
import { CategorySelector } from '../category-selector'
import { WizardFormData } from '../complete-product-wizard'

interface GeneralInfoSectionProps {
  formData: WizardFormData
  setFormData: (data: WizardFormData) => void
  onSave: () => void
}

export function GeneralInfoSection({
  formData,
  setFormData,
  onSave
}: GeneralInfoSectionProps) {
  const [newSellingPoint, setNewSellingPoint] = useState('')

  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const addSellingPoint = () => {
    if (newSellingPoint.trim()) {
      updateField('selling_points', [...formData.selling_points, newSellingPoint.trim()])
      setNewSellingPoint('')
    }
  }

  const removeSellingPoint = (index: number) => {
    const updated = formData.selling_points.filter((_, i) => i !== index)
    updateField('selling_points', updated)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            Informations générales
          </CardTitle>
          <CardDescription>
            Informations de base du produit. Aucun champ n'est obligatoire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Nom et SKU */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du produit
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Ex: Fauteuil design scandinave..."
              />
              <p className="text-xs text-gray-500">
                Nom commercial du produit visible aux clients
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug URL (optionnel)
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => updateField('slug', e.target.value)}
                placeholder="fauteuil-design-scandinave"
              />
              <p className="text-xs text-gray-500">
                URL conviviale pour le produit (généré automatiquement si vide)
              </p>
            </div>
          </div>

          {/* Description principale */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description principale
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Description commerciale du produit visible aux clients..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Description marketing principale visible sur les catalogues
            </p>
          </div>

          {/* Description technique */}
          <div className="space-y-2">
            <Label htmlFor="technical_description">
              Description technique
            </Label>
            <Textarea
              id="technical_description"
              value={formData.technical_description}
              onChange={(e) => updateField('technical_description', e.target.value)}
              placeholder="Spécifications techniques détaillées..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Informations techniques et spécifications détaillées
            </p>
          </div>

          {/* URL Vidéo */}
          <div className="space-y-2">
            <Label htmlFor="video_url">
              URL Vidéo (optionnel)
            </Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) => updateField('video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500">
              Lien vers une vidéo de présentation du produit
            </p>
          </div>

          {/* Points de vente */}
          <div className="space-y-3">
            <Label>Arguments de vente</Label>

            {/* Liste des points existants */}
            {formData.selling_points.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.selling_points.map((point, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {point}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeSellingPoint(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Ajouter un nouveau point */}
            <div className="flex gap-2">
              <Input
                value={newSellingPoint}
                onChange={(e) => setNewSellingPoint(e.target.value)}
                placeholder="Ex: Design contemporain, Matériaux durables..."
                onKeyPress={(e) => e.key === 'Enter' && addSellingPoint()}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addSellingPoint}
                disabled={!newSellingPoint.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Points forts et avantages du produit pour la vente
            </p>
          </div>

          {/* État du produit */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">
                État du produit
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => updateField('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner l'état" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Neuf</SelectItem>
                  <SelectItem value="refurbished">Reconditionné</SelectItem>
                  <SelectItem value="used">Occasion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability_type">
                Type de disponibilité
              </Label>
              <Select
                value={formData.availability_type || 'normal'}
                onValueChange={(value) => updateField('availability_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type de disponibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="preorder">Précommande</SelectItem>
                  <SelectItem value="coming_soon">Bientôt disponible</SelectItem>
                  <SelectItem value="discontinued">Arrêté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type de produit et client assigné */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type">
                Type de produit
              </Label>
              <Select
                value={formData.product_type}
                onValueChange={(value: 'standard' | 'custom') => updateField('product_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (catalogue général)</SelectItem>
                  <SelectItem value="custom">Sur-mesure (client spécifique)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.product_type === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="assigned_client_id">
                  Client assigné
                </Label>
                <Input
                  id="assigned_client_id"
                  value={formData.assigned_client_id}
                  onChange={(e) => updateField('assigned_client_id', e.target.value)}
                  placeholder="Sélectionner un client..."
                />
                <p className="text-xs text-gray-500">
                  Client pour qui ce produit sur-mesure est destiné
                </p>
              </div>
            )}
          </div>

          {/* Échantillonnage */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.requires_sample}
                onChange={(e) => updateField('requires_sample', e.target.checked)}
                className="mr-2"
              />
              Nécessite un échantillon avant commande
            </Label>
            <p className="text-xs text-gray-500">
              Cochez si ce produit doit passer par la phase d'échantillonnage
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Catégorisation */}
      <Card>
        <CardHeader>
          <CardTitle>Catégorisation</CardTitle>
          <CardDescription>
            Classification du produit dans le catalogue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategorySelector
            selectedFamilyId={formData.family_id}
            selectedCategoryId={formData.category_id}
            selectedSubcategoryId={formData.subcategory_id}
            onFamilyChange={(familyId) => updateField('family_id', familyId)}
            onCategoryChange={(categoryId) => updateField('category_id', categoryId)}
            onSubcategoryChange={(subcategoryId) => updateField('subcategory_id', subcategoryId)}
            required={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}