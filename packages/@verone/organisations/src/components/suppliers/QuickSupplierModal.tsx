'use client';

import { useState } from 'react';

import { useOrganisations } from '@verone/organisations/hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Checkbox,
  CountrySelect,
} from '@verone/ui';
import { Loader2 } from 'lucide-react';

interface QuickSupplierModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (supplierId: string, supplierName: string) => void;
}

export function QuickSupplierModal({
  open,
  onClose,
  onCreated,
}: QuickSupplierModalProps) {
  const { createOrganisation } = useOrganisations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    legal_name: '',
    has_different_trade_name: false,
    trade_name: '',
    website: '',
    country: 'FR',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.legal_name.trim()) {
      newErrors.legal_name = 'La dénomination sociale est obligatoire';
    }
    if (formData.has_different_trade_name && !formData.trade_name.trim()) {
      newErrors.trade_name = 'Le nom commercial est obligatoire si coché';
    }
    if (!formData.website.trim()) {
      newErrors.website = "L'URL du site est obligatoire";
    } else {
      try {
        new URL(formData.website);
      } catch {
        newErrors.website = "Format d'URL invalide";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newOrg = await createOrganisation({
        legal_name: formData.legal_name,
        trade_name: formData.has_different_trade_name
          ? formData.trade_name
          : null,
        has_different_trade_name: formData.has_different_trade_name,
        type: 'supplier',
        is_active: true,
        website: formData.website || null,
        country: formData.country || 'FR',
      });

      if (newOrg) {
        onCreated(newOrg.id, formData.legal_name);
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('[QuickSupplierModal] Creation failed:', error);
      setErrors({ legal_name: 'Erreur lors de la création du fournisseur' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      legal_name: '',
      has_different_trade_name: false,
      trade_name: '',
      website: '',
      country: 'FR',
    });
    setErrors({});
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau fournisseur</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={e => {
            void handleSubmit(e).catch(error => {
              console.error('[QuickSupplierModal] Submit error:', error);
            });
          }}
          className="space-y-4 mt-4"
        >
          {/* Dénomination sociale */}
          <div className="space-y-1">
            <Label htmlFor="qs_legal_name" className="text-sm font-medium">
              Dénomination sociale *
            </Label>
            <Input
              id="qs_legal_name"
              value={formData.legal_name}
              onChange={e => {
                setFormData(prev => ({ ...prev, legal_name: e.target.value }));
                if (errors.legal_name)
                  setErrors(prev => ({ ...prev, legal_name: '' }));
              }}
              placeholder="Ex: Zentrada GmbH, Maisons du Monde SAS..."
              className={errors.legal_name ? 'border-red-300' : ''}
              autoFocus
            />
            {errors.legal_name && (
              <p className="text-sm text-red-600">{errors.legal_name}</p>
            )}
          </div>

          {/* Checkbox nom commercial différent */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="qs_has_different_trade_name"
              checked={formData.has_different_trade_name}
              onCheckedChange={(checked: boolean) => {
                setFormData(prev => ({
                  ...prev,
                  has_different_trade_name: checked,
                  trade_name: checked ? prev.trade_name : '',
                }));
                if (!checked && errors.trade_name) {
                  setErrors(prev => ({ ...prev, trade_name: '' }));
                }
              }}
            />
            <Label
              htmlFor="qs_has_different_trade_name"
              className="text-sm cursor-pointer"
            >
              Le nom commercial est différent
            </Label>
          </div>

          {/* Nom commercial (conditionnel) */}
          {formData.has_different_trade_name && (
            <div className="space-y-1">
              <Label htmlFor="qs_trade_name" className="text-sm font-medium">
                Nom commercial *
              </Label>
              <Input
                id="qs_trade_name"
                value={formData.trade_name}
                onChange={e => {
                  setFormData(prev => ({
                    ...prev,
                    trade_name: e.target.value,
                  }));
                  if (errors.trade_name)
                    setErrors(prev => ({ ...prev, trade_name: '' }));
                }}
                placeholder="Ex: Zentrada, MdM..."
                className={errors.trade_name ? 'border-red-300' : ''}
              />
              {errors.trade_name && (
                <p className="text-sm text-red-600">{errors.trade_name}</p>
              )}
            </div>
          )}

          {/* Site web */}
          <div className="space-y-1">
            <Label htmlFor="qs_website" className="text-sm font-medium">
              Site web *
            </Label>
            <Input
              id="qs_website"
              type="url"
              value={formData.website}
              onChange={e => {
                setFormData(prev => ({ ...prev, website: e.target.value }));
                if (errors.website)
                  setErrors(prev => ({ ...prev, website: '' }));
              }}
              placeholder="https://www.fournisseur.com"
              className={errors.website ? 'border-red-300' : ''}
            />
            {errors.website && (
              <p className="text-sm text-red-600">{errors.website}</p>
            )}
          </div>

          {/* Pays */}
          <div className="space-y-1">
            <Label className="text-sm font-medium">Pays</Label>
            <CountrySelect
              value={formData.country}
              onChange={value => {
                setFormData(prev => ({ ...prev, country: value || 'FR' }));
              }}
              placeholder="Sélectionner un pays"
              className="w-full"
            />
          </div>

          <p className="text-xs text-gray-500">
            La fiche fournisseur pourra être complétée plus tard (adresse,
            contacts, conditions commerciales...).
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
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
                  Création...
                </>
              ) : (
                'Créer le fournisseur'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
