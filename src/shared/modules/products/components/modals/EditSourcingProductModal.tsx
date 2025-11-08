'use client';

import { useState, useEffect } from 'react';

import { X, Save, Loader2, Euro, Link } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@verone/utils';
import { SupplierSelector } from '@/shared/modules/suppliers/components/selectors/SupplierSelector';

interface SourcingProduct {
  id: string;
  name: string;
  supplier_page_url: string | null;
  cost_price: number | null;
  margin_percentage: number | null;
  supplier_id: string | null;
}

interface EditSourcingProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: SourcingProduct;
  onUpdate: (
    productId: string,
    data: {
      name?: string;
      supplier_page_url?: string;
      cost_price?: number;
      supplier_id?: string | null;
      margin_percentage?: number;
    }
  ) => Promise<boolean>;
}

export function EditSourcingProductModal({
  isOpen,
  onClose,
  product,
  onUpdate,
}: EditSourcingProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // États du formulaire
  const [formData, setFormData] = useState({
    name: product.name,
    supplier_page_url: product.supplier_page_url || '',
    cost_price: product.cost_price || 0,
    margin_percentage: product.margin_percentage || 50,
    supplier_id: product.supplier_id || '',
  });

  // Réinitialiser le formulaire quand le produit change
  useEffect(() => {
    setFormData({
      name: product.name,
      supplier_page_url: product.supplier_page_url || '',
      cost_price: product.cost_price || 0,
      margin_percentage: product.margin_percentage || 50,
      supplier_id: product.supplier_id || '',
    });
    setErrors({});
  }, [product]);

  // Validation formulaire
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom du produit est obligatoire';
    }

    if (formData.supplier_page_url && formData.supplier_page_url.trim()) {
      try {
        new URL(formData.supplier_page_url);
      } catch {
        newErrors.supplier_page_url = "Format d'URL invalide";
      }
    }

    if (formData.cost_price <= 0) {
      newErrors.cost_price = "Le prix d'achat doit être > 0€";
    }

    if (formData.margin_percentage < 0 || formData.margin_percentage > 1000) {
      newErrors.margin_percentage = 'La marge doit être entre 0% et 1000%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onUpdate(product.id, {
        name: formData.name,
        supplier_page_url: formData.supplier_page_url || undefined,
        cost_price: formData.cost_price,
        margin_percentage: formData.margin_percentage,
        supplier_id: formData.supplier_id || undefined,
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-black">
            Modifier le produit sourcing
          </DialogTitle>
          <DialogDescription>
            Modifiez les informations du produit en sourcing. Les champs marqués
            d'une * sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Nom du produit */}
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-sm font-medium">
              Nom du produit *
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={e => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="Ex: Fauteuil design scandinave..."
              className={cn(
                'transition-colors',
                errors.name && 'border-red-300 focus:border-red-500'
              )}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* URL fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="edit-supplier-url" className="text-sm font-medium">
              URL de la page fournisseur
            </Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="edit-supplier-url"
                type="url"
                value={formData.supplier_page_url}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    supplier_page_url: e.target.value,
                  }));
                  if (errors.supplier_page_url)
                    setErrors(prev => ({ ...prev, supplier_page_url: '' }));
                }}
                placeholder="https://fournisseur.com/produit/123"
                className={cn(
                  'pl-10 transition-colors',
                  errors.supplier_page_url &&
                    'border-red-300 focus:border-red-500'
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
            <Label htmlFor="edit-cost-price" className="text-sm font-medium">
              Prix d'achat fournisseur HT (€) *
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="edit-cost-price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cost_price || ''}
                onChange={e => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, cost_price: value }));
                  if (errors.cost_price)
                    setErrors(prev => ({ ...prev, cost_price: '' }));
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
              Prix d'achat HT chez le fournisseur
            </p>
          </div>

          {/* Marge */}
          <div className="space-y-2">
            <Label htmlFor="edit-margin" className="text-sm font-medium">
              Marge (%)
            </Label>
            <div className="relative">
              <Input
                id="edit-margin"
                type="number"
                step="1"
                min="0"
                max="1000"
                value={formData.margin_percentage || ''}
                onChange={e => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({ ...prev, margin_percentage: value }));
                  if (errors.margin_percentage)
                    setErrors(prev => ({ ...prev, margin_percentage: '' }));
                }}
                placeholder="50"
                className={cn(
                  'transition-colors',
                  errors.margin_percentage &&
                    'border-red-300 focus:border-red-500'
                )}
              />
            </div>
            {errors.margin_percentage && (
              <p className="text-sm text-red-600">{errors.margin_percentage}</p>
            )}
            {formData.cost_price > 0 && formData.margin_percentage > 0 && (
              <p className="text-xs text-gray-500">
                Prix de vente calculé:{' '}
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                }).format(
                  formData.cost_price * (1 + formData.margin_percentage / 100)
                )}
              </p>
            )}
          </div>

          {/* Fournisseur */}
          <div className="space-y-2">
            <SupplierSelector
              selectedSupplierId={formData.supplier_id || null}
              onSupplierChange={supplierId => {
                setFormData(prev => ({
                  ...prev,
                  supplier_id: supplierId || '',
                }));
              }}
              label="Fournisseur"
              placeholder="Sélectionner un fournisseur..."
              required={false}
            />
            <p className="text-xs text-gray-500">
              Assignez un fournisseur pour activer les liens fournisseur et
              permettre la validation
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black hover:bg-gray-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
