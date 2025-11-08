'use client';

import { useMemo } from 'react';

import { Save, Info } from 'lucide-react';

import { Alert, AlertDescription } from '@verone/ui';
import { Button } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';

import type { WizardFormData } from '../CompleteProductWizard';

interface PricingSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function PricingSection({
  formData,
  setFormData,
  onSave,
}: PricingSectionProps) {
  const handleChange = (field: keyof WizardFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  // Calculs automatiques
  const calculatedPrice = useMemo(() => {
    const cost = parseFloat(formData.cost_price) || 0;
    const marginPercent = parseFloat(formData.margin_percentage) || 0;

    if (cost > 0 && marginPercent > 0) {
      return (cost * (1 + marginPercent / 100)).toFixed(2);
    }
    return '0.00';
  }, [formData.cost_price, formData.margin_percentage]);

  const calculatedMargin = useMemo(() => {
    const cost = parseFloat(formData.cost_price) || 0;
    const price = parseFloat(calculatedPrice) || 0;

    if (cost > 0 && price > cost) {
      return (((price - cost) / price) * 100).toFixed(2);
    }
    return '0.00';
  }, [formData.cost_price, calculatedPrice]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tarification</CardTitle>
        <CardDescription>
          Définissez les prix et marges du produit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prix de revient */}
        <div className="space-y-2">
          <Label htmlFor="cost_price">Prix de revient (€) *</Label>
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.cost_price}
            onChange={e => handleChange('cost_price', e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Prix d'achat HT auprès du fournisseur
          </p>
        </div>

        {/* Marge cible */}
        <div className="space-y-2">
          <Label htmlFor="target_margin_percentage">Marge cible (%)</Label>
          <Input
            id="target_margin_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="0.0"
            value={formData.target_margin_percentage}
            onChange={e =>
              handleChange('target_margin_percentage', e.target.value)
            }
          />
          <p className="text-sm text-muted-foreground">
            Marge souhaitée pour ce produit (objectif)
          </p>
        </div>

        {/* Marge appliquée */}
        <div className="space-y-2">
          <Label htmlFor="margin_percentage">Marge appliquée (%) *</Label>
          <Input
            id="margin_percentage"
            type="number"
            step="0.1"
            min="0"
            max="100"
            placeholder="0.0"
            value={formData.margin_percentage}
            onChange={e => handleChange('margin_percentage', e.target.value)}
            required
          />
          <p className="text-sm text-muted-foreground">
            Marge réellement appliquée sur ce produit
          </p>
        </div>

        {/* Calculs automatiques */}
        {formData.cost_price && formData.margin_percentage && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>Prix de vente calculé :</strong> {calculatedPrice} €
                  HT
                </p>
                <p>
                  <strong>Marge réelle :</strong> {calculatedMargin}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Formule : Prix de vente = Prix de revient × (1 + Marge %)
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
