'use client';

import { Save } from 'lucide-react';

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
import { SupplierSelector } from '@verone/organisations/components/suppliers';

import type { WizardFormData } from '../CompleteProductWizard';

interface SupplierSectionProps {
  formData: WizardFormData;
  setFormData: (data: WizardFormData) => void;
  onSave: () => void;
}

export function SupplierSection({
  formData,
  setFormData,
  onSave,
}: SupplierSectionProps) {
  const handleChange = (field: keyof WizardFormData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fournisseur</CardTitle>
        <CardDescription>
          Informations sur le fournisseur et le sourcing du produit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sélecteur de fournisseur */}
        <div className="space-y-2">
          <Label>Fournisseur</Label>
          <SupplierSelector
            {...({
              value: formData.supplier_id,
              onChange: value => handleChange('supplier_id', value),
            } as any)}
          />
        </div>

        {/* Référence fournisseur */}
        <div className="space-y-2">
          <Label htmlFor="supplier_reference">Référence fournisseur</Label>
          <Input
            id="supplier_reference"
            placeholder="Ex: REF-12345"
            value={formData.supplier_reference}
            onChange={e => handleChange('supplier_reference', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Référence du produit chez le fournisseur
          </p>
        </div>

        {/* URL page fournisseur */}
        <div className="space-y-2">
          <Label htmlFor="supplier_page_url">URL page fournisseur</Label>
          <Input
            id="supplier_page_url"
            type="url"
            placeholder="https://fournisseur.com/produit/..."
            value={formData.supplier_page_url}
            onChange={e => handleChange('supplier_page_url', e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Lien vers la page produit sur le site du fournisseur
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
