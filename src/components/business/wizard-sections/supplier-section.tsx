'use client';

import { Building2, ExternalLink } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import type { WizardFormData } from '../complete-product-wizard';
import { SupplierSelector } from '../supplier-selector';

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
  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Fournisseur principal */}
      <Card className="border-l-4" style={{ borderLeftColor: '#3b86d1' }}>
        <CardHeader style={{ backgroundColor: 'rgba(232, 244, 252, 0.3)' }}>
          <CardTitle className="flex items-center" style={{ color: '#1f4d7e' }}>
            <Building2 className="h-5 w-5 mr-2" style={{ color: '#2868a8' }} />
            Fournisseur
          </CardTitle>
          <CardDescription>
            Sélectionnez le fournisseur principal pour ce produit
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier" className="text-base font-medium">
              Fournisseur principal
            </Label>
            <SupplierSelector
              selectedSupplierId={formData.supplier_id}
              onSupplierChange={supplierId =>
                updateField('supplier_id', supplierId)
              }
              required={false}
            />
            <p className="text-xs text-gray-500">
              Le fournisseur auprès duquel ce produit est sourcé
            </p>
          </div>

          {/* Référence fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier_reference">Référence fournisseur</Label>
            <Input
              id="supplier_reference"
              value={formData.supplier_reference}
              onChange={e => updateField('supplier_reference', e.target.value)}
              placeholder="REF-FOURNISSEUR-123"
            />
            <p className="text-xs text-gray-500">
              Référence ou code produit chez le fournisseur
            </p>
          </div>

          {/* URL page fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier_page_url">URL page fournisseur</Label>
            <div className="relative">
              <Input
                id="supplier_page_url"
                type="url"
                value={formData.supplier_page_url}
                onChange={e => updateField('supplier_page_url', e.target.value)}
                placeholder="https://fournisseur.com/produit/123"
                className="pr-10"
              />
              {formData.supplier_page_url && (
                <a
                  href={formData.supplier_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Lien direct vers la fiche produit chez le fournisseur
            </p>
          </div>

          {/* Marque */}
          <div className="space-y-2">
            <Label htmlFor="brand">Marque</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={e => updateField('brand', e.target.value)}
              placeholder="Ex: IKEA, Kartell, Hay..."
            />
            <p className="text-xs text-gray-500">
              Marque ou fabricant du produit
            </p>
          </div>

          {/* GTIN / Code-barres */}
          <div className="space-y-2">
            <Label htmlFor="gtin">GTIN / Code-barres</Label>
            <Input
              id="gtin"
              value={formData.gtin}
              onChange={e => updateField('gtin', e.target.value)}
              placeholder="1234567890123"
              pattern="[0-9]*"
            />
            <p className="text-xs text-gray-500">
              Code GTIN, EAN ou UPC du produit (Global Trade Item Number)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
