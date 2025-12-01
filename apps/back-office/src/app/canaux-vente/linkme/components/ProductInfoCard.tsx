'use client';

import { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Label,
  Button,
  Badge,
} from '@verone/ui';
import { FileText, X, Plus, Save, Loader2 } from 'lucide-react';

import type { LinkMeProductDetail, LinkMeMetadataUpdate } from '../types';

interface ProductInfoCardProps {
  product: LinkMeProductDetail;
  onSave: (data: LinkMeMetadataUpdate) => Promise<void>;
  isSaving?: boolean;
}

export function ProductInfoCard({
  product,
  onSave,
  isSaving = false,
}: ProductInfoCardProps) {
  const [formData, setFormData] = useState<LinkMeMetadataUpdate>({
    custom_title: product.custom_title,
    custom_description: product.custom_description,
    custom_selling_points: product.custom_selling_points,
  });

  const [newPoint, setNewPoint] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Reset form when product changes
  useEffect(() => {
    setFormData({
      custom_title: product.custom_title,
      custom_description: product.custom_description,
      custom_selling_points: product.custom_selling_points,
    });
    setIsDirty(false);
  }, [product]);

  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    const currentPoints = formData.custom_selling_points || [];
    setFormData(prev => ({
      ...prev,
      custom_selling_points: [...currentPoints, newPoint.trim()],
    }));
    setNewPoint('');
    setIsDirty(true);
  };

  const handleRemovePoint = (index: number) => {
    const currentPoints = formData.custom_selling_points || [];
    setFormData(prev => ({
      ...prev,
      custom_selling_points: currentPoints.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsDirty(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informations personnalisées
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Titre custom */}
        <div className="space-y-2">
          <Label htmlFor="custom-title">Titre personnalisé</Label>
          <Input
            id="custom-title"
            value={formData.custom_title ?? ''}
            onChange={e => {
              setFormData(prev => ({
                ...prev,
                custom_title: e.target.value || null,
              }));
              setIsDirty(true);
            }}
            placeholder={product.name}
          />
          <p className="text-xs text-muted-foreground">
            Laissez vide pour utiliser le nom du produit
          </p>
        </div>

        {/* Description custom */}
        <div className="space-y-2">
          <Label htmlFor="custom-description">Description personnalisée</Label>
          <Textarea
            id="custom-description"
            value={formData.custom_description ?? ''}
            onChange={e => {
              setFormData(prev => ({
                ...prev,
                custom_description: e.target.value || null,
              }));
              setIsDirty(true);
            }}
            placeholder="Description spécifique pour LinkMe..."
            rows={4}
          />
        </div>

        {/* Points de vente */}
        <div className="space-y-2">
          <Label>Arguments de vente</Label>
          <div className="space-y-2">
            {(formData.custom_selling_points || []).map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
              >
                <span className="flex-1 text-sm">{point}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleRemovePoint(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Ajouter un point */}
          <div className="flex gap-2">
            <Input
              value={newPoint}
              onChange={e => setNewPoint(e.target.value)}
              placeholder="Nouvel argument de vente..."
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPoint();
                }
              }}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddPoint}
              disabled={!newPoint.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bouton sauvegarde */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les informations
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
