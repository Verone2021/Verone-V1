'use client';

import { Save } from 'lucide-react';

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

import type { WizardFormData } from '../CompleteProductWizard';

interface TechnicalSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function TechnicalSection({
  formData,
  setFormData,
  onSave,
}: TechnicalSectionProps) {
  const handleChange = (field: keyof WizardFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    handleChange('dimensions', {
      ...formData.dimensions,
      [dimension]: value,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Caractéristiques techniques</CardTitle>
        <CardDescription>
          Spécifications et informations techniques du produit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Marque */}
        <div className="space-y-2">
          <Label htmlFor="brand">Marque</Label>
          <Input
            id="brand"
            placeholder="Ex: Ikea, Maisons du Monde..."
            value={formData.brand}
            onChange={e => handleChange('brand', e.target.value)}
          />
        </div>

        {/* Dimensions */}
        <div className="space-y-4">
          <Label>Dimensions (cm)</Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length" className="text-sm text-muted-foreground">
                Longueur
              </Label>
              <Input
                id="length"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.dimensions?.length || ''}
                onChange={e => handleDimensionChange('length', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="width" className="text-sm text-muted-foreground">
                Largeur
              </Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.dimensions?.width || ''}
                onChange={e => handleDimensionChange('width', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height" className="text-sm text-muted-foreground">
                Hauteur
              </Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0"
                placeholder="0"
                value={formData.dimensions?.height || ''}
                onChange={e => handleDimensionChange('height', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Poids */}
        <div className="space-y-2">
          <Label htmlFor="weight">Poids (kg)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.weight}
            onChange={e => handleChange('weight', e.target.value)}
          />
        </div>

        {/* GTIN (Code-barres) */}
        <div className="space-y-2">
          <Label htmlFor="gtin">GTIN / EAN / UPC</Label>
          <Input
            id="gtin"
            placeholder="Ex: 3700123456789"
            value={formData.gtin}
            onChange={e => handleChange('gtin', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Code-barres international du produit (optionnel)
          </p>
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
