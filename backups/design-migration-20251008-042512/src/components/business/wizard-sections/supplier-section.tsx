"use client"

import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Textarea } from '../../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card'
import { Truck, ExternalLink } from 'lucide-react'
import { WizardFormData } from '../complete-product-wizard'
import { SupplierSelector } from '../supplier-selector'

interface SupplierSectionProps {
  formData: WizardFormData
  setFormData: (data: WizardFormData) => void
  onSave: () => void
}

export function SupplierSection({
  formData,
  setFormData,
  onSave
}: SupplierSectionProps) {

  const updateField = (field: keyof WizardFormData, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="h-5 w-5 mr-2" />
            Informations fournisseur
          </CardTitle>
          <CardDescription>
            Informations sur le fournisseur et l'approvisionnement du produit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélection du fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier_id">
              Fournisseur
            </Label>
            <SupplierSelector
              value={formData.supplier_id}
              onChange={(supplierId) => updateField('supplier_id', supplierId)}
              placeholder="Sélectionner un fournisseur..."
              required={false}
            />
            <p className="text-xs text-gray-500">
              Organisation fournisseur de ce produit
            </p>
          </div>

          {/* URL page fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier_page_url">
              URL page fournisseur
            </Label>
            <div className="relative">
              <Input
                id="supplier_page_url"
                type="url"
                value={formData.supplier_page_url}
                onChange={(e) => updateField('supplier_page_url', e.target.value)}
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

          {/* Référence fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="supplier_reference">
              Référence fournisseur
            </Label>
            <Input
              id="supplier_reference"
              value={formData.supplier_reference}
              onChange={(e) => updateField('supplier_reference', e.target.value)}
              placeholder="REF-FOURNISSEUR-123"
            />
            <p className="text-xs text-gray-500">
              Référence ou code produit chez le fournisseur
            </p>
          </div>

          {/* Marque */}
          <div className="space-y-2">
            <Label htmlFor="brand">
              Marque
            </Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => updateField('brand', e.target.value)}
              placeholder="Ex: IKEA, Kartell, Hay..."
            />
            <p className="text-xs text-gray-500">
              Marque ou fabricant du produit
            </p>
          </div>

          {/* GTIN / Code-barres */}
          <div className="space-y-2">
            <Label htmlFor="gtin">
              GTIN / Code-barres
            </Label>
            <Input
              id="gtin"
              value={formData.gtin}
              onChange={(e) => updateField('gtin', e.target.value)}
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
  )
}