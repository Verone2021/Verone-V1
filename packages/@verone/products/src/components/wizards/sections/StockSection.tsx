'use client';

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

interface StockSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function StockSection({
  formData,
  setFormData,
  onSave,
}: StockSectionProps) {
  const handleChange = (field: keyof WizardFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock et inventaire</CardTitle>
        <CardDescription>
          Gérez les quantités en stock et les seuils d'alerte
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stock réel */}
        <div className="space-y-2">
          <Label htmlFor="stock_real">Stock réel</Label>
          <Input
            id="stock_real"
            type="number"
            min="0"
            placeholder="0"
            value={formData.stock_real}
            onChange={e => handleChange('stock_real', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Quantité physique actuellement en stock
          </p>
        </div>

        {/* Stock disponible */}
        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Stock disponible (calculé)</Label>
          <Input
            id="stock_quantity"
            type="number"
            min="0"
            placeholder="0"
            value={formData.stock_quantity}
            onChange={e => handleChange('stock_quantity', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Stock disponible pour la vente (stock réel - réservations)
          </p>
        </div>

        {/* Prévisions */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock_forecasted_in">Entrées prévues</Label>
            <Input
              id="stock_forecasted_in"
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock_forecasted_in}
              onChange={e =>
                handleChange('stock_forecasted_in', e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Quantité en commande fournisseur
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_forecasted_out">Sorties prévues</Label>
            <Input
              id="stock_forecasted_out"
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock_forecasted_out}
              onChange={e =>
                handleChange('stock_forecasted_out', e.target.value)
              }
            />
            <p className="text-xs text-muted-foreground">
              Quantité réservée (commandes clients)
            </p>
          </div>
        </div>

        {/* Seuils d'alerte */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Seuils d'alerte</h4>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_stock">Stock minimum</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                placeholder="0"
                value={formData.min_stock}
                onChange={e => handleChange('min_stock', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Alerte si stock &lt; minimum
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">Point de commande</Label>
              <Input
                id="reorder_point"
                type="number"
                min="0"
                placeholder="0"
                value={formData.reorder_point}
                onChange={e => handleChange('reorder_point', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Déclencher une commande fournisseur
              </p>
            </div>
          </div>
        </div>

        {/* Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Les seuils d'alerte vous aideront à anticiper les ruptures de stock.
            Le point de commande déclenche une notification pour commander chez
            le fournisseur.
          </AlertDescription>
        </Alert>

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
