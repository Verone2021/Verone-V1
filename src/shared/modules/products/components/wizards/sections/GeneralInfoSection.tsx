'use client';

import { useState } from 'react';

import { X, Plus, Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import type { WizardFormData } from '../CompleteProductWizard';

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
  const [newSellingPoint, setNewSellingPoint] = useState('');

  const handleChange = (field: keyof WizardFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const addSellingPoint = () => {
    if (newSellingPoint.trim()) {
      handleChange('selling_points', [
        ...formData.selling_points,
        newSellingPoint.trim(),
      ]);
      setNewSellingPoint('');
    }
  };

  const removeSellingPoint = (index: number) => {
    const updated = formData.selling_points.filter((_, i) => i !== index);
    handleChange('selling_points', updated);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
        <CardDescription>
          Définissez les informations de base du produit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nom du produit */}
        <div className="space-y-2">
          <Label htmlFor="name">Nom du produit *</Label>
          <Input
            id="name"
            placeholder="Ex: Canapé en velours bleu"
            value={formData.name}
            onChange={e => handleChange('name', e.target.value)}
            required
          />
        </div>

        {/* Slug (URL) */}
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            placeholder="canape-velours-bleu"
            value={formData.slug}
            onChange={e => handleChange('slug', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Laissez vide pour génération automatique depuis le nom
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Description détaillée du produit..."
            value={formData.description}
            onChange={e => handleChange('description', e.target.value)}
            rows={5}
          />
        </div>

        {/* Points de vente */}
        <div className="space-y-2">
          <Label>Points de vente</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ajouter un point de vente..."
              value={newSellingPoint}
              onChange={e => setNewSellingPoint(e.target.value)}
              onKeyDown={e =>
                e.key === 'Enter' && (e.preventDefault(), addSellingPoint())
              }
            />
            <Button
              type="button"
              size="sm"
              onClick={addSellingPoint}
              className="px-2"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.selling_points.map((point, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {point}
                <button
                  type="button"
                  onClick={() => removeSellingPoint(index)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* État du produit */}
        <div className="space-y-2">
          <Label htmlFor="condition">État</Label>
          <Select
            value={formData.condition}
            onValueChange={value => handleChange('condition', value)}
          >
            <SelectTrigger id="condition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Neuf</SelectItem>
              <SelectItem value="refurbished">Reconditionné</SelectItem>
              <SelectItem value="used">Occasion</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type de disponibilité */}
        <div className="space-y-2">
          <Label htmlFor="availability_type">Disponibilité</Label>
          <Select
            value={formData.availability_type}
            onValueChange={value => handleChange('availability_type', value)}
          >
            <SelectTrigger id="availability_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Disponible</SelectItem>
              <SelectItem value="preorder">Précommande</SelectItem>
              <SelectItem value="backorder">Rupture temporaire</SelectItem>
              <SelectItem value="discontinued">Arrêt de production</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* URL vidéo */}
        <div className="space-y-2">
          <Label htmlFor="video_url">URL Vidéo (optionnel)</Label>
          <Input
            id="video_url"
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={formData.video_url}
            onChange={e => handleChange('video_url', e.target.value)}
          />
        </div>

        {/* Bouton sauvegarder brouillon */}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Sauvegarder le brouillon
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
