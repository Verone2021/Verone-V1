'use client';

import { Info, Tag, FolderTree } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import { CategorySelector } from '../category-selector';
import type { WizardFormData } from '../complete-product-wizard';

interface GeneralInfoSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function GeneralInfoSection({
  formData,
  setFormData,
  onSave,
}: GeneralInfoSectionProps) {
  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

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
          {/* NOM DU PRODUIT - EN PREMIER */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-base font-medium">
              Nom du produit
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Ex: Fauteuil design scandinave..."
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Nom commercial du produit visible aux clients
            </p>
          </div>

          {/* URL Vidéo */}
          <div className="space-y-2">
            <Label htmlFor="video_url">URL Vidéo (optionnel)</Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={e => updateField('video_url', e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
            <p className="text-xs text-gray-500">
              Lien vers une vidéo de présentation du produit
            </p>
          </div>

          {/* SECTION IDENTIFIANTS & RÉFÉRENCES - Bleu Design V2 #3b86d1 */}
          <Card className="border-l-4" style={{ borderLeftColor: '#3b86d1' }}>
            <CardHeader style={{ backgroundColor: 'rgba(232, 244, 252, 0.3)' }}>
              <CardTitle
                className="flex items-center text-base"
                style={{ color: '#1f4d7e' }}
              >
                <Tag className="h-4 w-4 mr-2" style={{ color: '#2868a8' }} />
                Identifiants & Références
              </CardTitle>
              <CardDescription>
                Identifiants uniques et références du produit
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL (optionnel)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={e => updateField('slug', e.target.value)}
                  placeholder="fauteuil-design-scandinave"
                />
                <p className="text-xs text-gray-500">
                  URL conviviale pour le produit (généré automatiquement si
                  vide)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* État du produit */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="condition">État du produit</Label>
              <Select
                value={formData.condition}
                onValueChange={value => updateField('condition', value)}
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
              <Label htmlFor="availability_type">Type de disponibilité</Label>
              <Select
                value={formData.availability_type || 'normal'}
                onValueChange={value => updateField('availability_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type de disponibilité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="preorder">Précommande</SelectItem>
                  <SelectItem value="coming_soon">
                    Bientôt disponible
                  </SelectItem>
                  <SelectItem value="discontinued">Arrêté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Type de produit et client assigné */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_type">Type de produit</Label>
              <Select
                value={formData.product_type}
                onValueChange={(value: 'standard' | 'custom') =>
                  updateField('product_type', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    Standard (catalogue général)
                  </SelectItem>
                  <SelectItem value="custom">
                    Sur-mesure (client spécifique)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.product_type === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="assigned_client_id">Client assigné</Label>
                <Input
                  id="assigned_client_id"
                  value={formData.assigned_client_id}
                  onChange={e =>
                    updateField('assigned_client_id', e.target.value)
                  }
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
                onChange={e => updateField('requires_sample', e.target.checked)}
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

      {/* Catégorisation - Vert Design V2 #38ce3c */}
      <Card className="border-l-4" style={{ borderLeftColor: '#38ce3c' }}>
        <CardHeader style={{ backgroundColor: 'rgba(232, 249, 232, 0.3)' }}>
          <CardTitle className="flex items-center" style={{ color: '#1f6221' }}>
            <FolderTree className="h-5 w-5 mr-2" style={{ color: '#2ca530' }} />
            Catégorisation
          </CardTitle>
          <CardDescription>
            Classification du produit dans le catalogue
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <CategorySelector
            {...({
              value: formData.subcategory_id,
              onChange: (subcategoryId: any, hierarchy: any) => {
                updateField('subcategory_id', subcategoryId);
                updateField('family_id', hierarchy.family.id);
                updateField('category_id', hierarchy.category.id);
              },
              placeholder: 'Sélectionner une sous-catégorie...',
              required: false,
            } as any)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
