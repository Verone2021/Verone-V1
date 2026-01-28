'use client';

import { useState } from 'react';

import { Plus, X, FileText, List, Sparkles } from 'lucide-react';

import { Badge } from '@verone/ui';
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
import { Textarea } from '@verone/ui';
import type { WizardFormData } from '../complete-product-wizard';

interface DescriptionsSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function DescriptionsSection({
  formData,
  setFormData,
  onSave: _onSave,
}: DescriptionsSectionProps) {
  const [newSellingPoint, setNewSellingPoint] = useState('');

  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const addSellingPoint = () => {
    if (newSellingPoint.trim()) {
      updateField('selling_points', [
        ...formData.selling_points,
        newSellingPoint.trim(),
      ]);
      setNewSellingPoint('');
    }
  };

  const removeSellingPoint = (index: number) => {
    const updated = formData.selling_points.filter((_, i) => i !== index);
    updateField('selling_points', updated);
  };

  return (
    <div className="space-y-6">
      {/* Description caractéristique - Bleu Primary #3b86d1 */}
      <Card className="border-l-4" style={{ borderLeftColor: '#3b86d1' }}>
        <CardHeader style={{ backgroundColor: 'rgba(232, 244, 252, 0.3)' }}>
          <CardTitle className="flex items-center" style={{ color: '#1f4d7e' }}>
            <FileText className="h-5 w-5 mr-2" style={{ color: '#2868a8' }} />
            Description caractéristique
          </CardTitle>
          <CardDescription>
            Description commerciale et technique visible sur les catalogues et
            la page produit
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-medium">
              Description complète du produit
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="Décrivez le produit de manière détaillée...

Exemple pour un fauteuil :
• Fauteuil design scandinave en tissu premium
• Pieds en chêne massif naturel certifié FSC
• Assise haute densité 35kg/m³ pour un confort optimal
• Dimensions : H85 × L75 × P80 cm
• Entretien facile, tissu anti-taches traité Scotchgard
• Livré monté, prêt à l'emploi"
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500 flex items-center">
              <Sparkles className="h-3 w-3 mr-1" style={{ color: '#3b86d1' }} />
              Conseil : Combinez les aspects commerciaux (design, confort) et
              techniques (dimensions, matériaux)
            </p>
          </div>

          {/* Compteur de caractères */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formData.description.length} caractères</span>
            {formData.description.length > 500 && (
              <span className="font-medium" style={{ color: '#38ce3c' }}>
                ✓ Description complète
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Points de vente - Violet Accent #844fc1 */}
      <Card className="border-l-4" style={{ borderLeftColor: '#844fc1' }}>
        <CardHeader style={{ backgroundColor: 'rgba(242, 234, 249, 0.3)' }}>
          <CardTitle className="flex items-center" style={{ color: '#6a3f9a' }}>
            <List className="h-5 w-5 mr-2" style={{ color: '#844fc1' }} />
            Points de vente
          </CardTitle>
          <CardDescription>
            Arguments clés et avantages produit pour convaincre vos clients
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Liste des points existants */}
          {formData.selling_points.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Points ajoutés ({formData.selling_points.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {formData.selling_points.map((point, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-2 px-3 py-1.5 transition-colors"
                    style={{ backgroundColor: '#e5d5f3', color: '#35204d' }}
                  >
                    <span>{point}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeSellingPoint(index)}
                    >
                      <X className="h-3 w-3" style={{ color: '#6a3f9a' }} />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Ajouter un nouveau point */}
          <div className="space-y-2">
            <Label htmlFor="new-selling-point" className="text-sm font-medium">
              Ajouter un point de vente
            </Label>
            <div className="flex gap-2">
              <Input
                id="new-selling-point"
                value={newSellingPoint}
                onChange={e => setNewSellingPoint(e.target.value)}
                placeholder="Ex: Design nordique authentique, Garantie 5 ans..."
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSellingPoint();
                  }
                }}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addSellingPoint}
                disabled={!newSellingPoint.trim()}
                className="text-white"
                style={{ backgroundColor: '#844fc1' }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Appuyez sur{' '}
              <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                Entrée
              </kbd>{' '}
              pour ajouter rapidement
            </p>
          </div>

          {/* Suggestions de points de vente */}
          {formData.selling_points.length < 3 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-700 mb-2">
                💡 Suggestions de points de vente :
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Qualité premium garantie',
                  'Livraison rapide et soignée',
                  'Garantie constructeur étendue',
                  'Matériaux durables et écologiques',
                  'Design exclusif',
                  'Service client dédié',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!formData.selling_points.includes(suggestion)) {
                        updateField('selling_points', [
                          ...formData.selling_points,
                          suggestion,
                        ]);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:border-[#844fc1] transition-colors"
                    style={{
                      ...(formData.selling_points.includes(suggestion)
                        ? { opacity: 0.5, cursor: 'not-allowed' }
                        : {}),
                    }}
                    disabled={formData.selling_points.includes(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
