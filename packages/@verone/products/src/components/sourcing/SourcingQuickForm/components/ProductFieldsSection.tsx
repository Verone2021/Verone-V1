'use client';

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { Euro, Link } from 'lucide-react';

import type { ProductFormData } from '../types';

interface ProductFieldsSectionProps {
  formData: ProductFormData;
  errors: Record<string, string>;
  onFieldChange: (updates: Partial<ProductFormData>) => void;
  onClearError: (key: string) => void;
}

export function ProductFieldsSection({
  formData,
  errors,
  onFieldChange,
  onClearError,
}: ProductFieldsSectionProps) {
  return (
    <>
      {/* Nom produit */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          Nom du produit *
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => {
            onFieldChange({ name: e.target.value });
            if (errors.name) onClearError('name');
          }}
          placeholder="Ex: Fauteuil design scandinave..."
          className={cn(
            'transition-colors',
            errors.name && 'border-red-300 focus:border-red-500'
          )}
        />
        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
      </div>

      {/* URL fournisseur */}
      <div className="space-y-2">
        <Label htmlFor="supplier_url" className="text-sm font-medium">
          URL de la page fournisseur *
        </Label>
        <div className="relative">
          <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="supplier_url"
            type="url"
            value={formData.supplier_page_url}
            onChange={e => {
              onFieldChange({ supplier_page_url: e.target.value });
              if (errors.supplier_page_url) onClearError('supplier_page_url');
            }}
            placeholder="https://fournisseur.com/produit/123"
            className={cn(
              'pl-10 transition-colors',
              errors.supplier_page_url && 'border-red-300 focus:border-red-500'
            )}
          />
        </div>
        {errors.supplier_page_url && (
          <p className="text-sm text-red-600">{errors.supplier_page_url}</p>
        )}
        <p className="text-xs text-gray-500">
          Lien vers la fiche produit chez le fournisseur
        </p>
      </div>

      {/* Prix d'achat */}
      <div className="space-y-2">
        <Label htmlFor="cost_price" className="text-sm font-medium">
          Prix d&apos;achat fournisseur HT (€) *
        </Label>
        <div className="relative">
          <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="cost_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_price ?? ''}
            onChange={e => {
              const value = parseFloat(e.target.value) || 0;
              onFieldChange({ cost_price: value });
              if (errors.cost_price) onClearError('cost_price');
            }}
            placeholder="250.00"
            className={cn(
              'pl-10 transition-colors',
              errors.cost_price && 'border-red-300 focus:border-red-500'
            )}
          />
        </div>
        {errors.cost_price && (
          <p className="text-sm text-red-600">{errors.cost_price}</p>
        )}
        <p className="text-xs text-gray-500">
          Prix d&apos;achat HT chez le fournisseur
        </p>
      </div>

      {/* Référence fournisseur */}
      <div className="space-y-2">
        <Label htmlFor="supplier_reference" className="text-sm font-medium">
          Réf. fournisseur (facultatif)
        </Label>
        <Input
          id="supplier_reference"
          value={formData.supplier_reference}
          onChange={e => {
            onFieldChange({ supplier_reference: e.target.value });
          }}
          placeholder="Ex: ART-12345, SKU-FOURN-001..."
          className="transition-colors"
        />
        <p className="text-xs text-gray-500">
          Référence du produit chez le fournisseur
        </p>
      </div>

      {/* Marque */}
      <div className="space-y-2">
        <Label htmlFor="brand" className="text-sm font-medium">
          Marque (facultatif)
        </Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={e => {
            onFieldChange({ brand: e.target.value });
          }}
          placeholder="Ex: HAY, Fermob, Kartell..."
          className="transition-colors"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          Description (facultatif)
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={e => {
            onFieldChange({ description: e.target.value });
          }}
          placeholder="Description courte du produit..."
          rows={3}
          className="transition-colors resize-none"
        />
      </div>

      {/* MOQ */}
      <div className="space-y-2">
        <Label htmlFor="supplier_moq" className="text-sm font-medium">
          Quantité min. de commande (MOQ) (facultatif)
        </Label>
        <Input
          id="supplier_moq"
          type="number"
          min="1"
          value={formData.supplier_moq ?? ''}
          onChange={e => {
            const value = parseInt(e.target.value) || 0;
            onFieldChange({ supplier_moq: value });
          }}
          placeholder="Ex: 10"
          className="transition-colors"
        />
      </div>

      {/* Canal de sourcing */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Canal de sourcing (facultatif)
        </Label>
        <Select
          value={formData.sourcing_channel || 'none'}
          onValueChange={value => {
            onFieldChange({
              sourcing_channel: value === 'none' ? '' : value,
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner le canal..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <span className="text-gray-500">Non spécifié</span>
            </SelectItem>
            <SelectItem value="online">En ligne</SelectItem>
            <SelectItem value="trade_show">Salon professionnel</SelectItem>
            <SelectItem value="referral">Recommandation</SelectItem>
            <SelectItem value="visit">Visite fournisseur</SelectItem>
            <SelectItem value="other">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
