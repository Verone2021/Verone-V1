'use client';

/**
 * EditOrganisationModal
 *
 * Modal d'édition d'une organisation
 * Permet de modifier : trade_name, adresse de livraison
 *
 * @module EditOrganisationModal
 * @since 2026-01-10
 */

import { useState, useEffect } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import type { EnseigneOrganisation } from '../../lib/hooks/use-enseigne-organisations';

// =====================================================================
// TYPES
// =====================================================================

interface EditOrganisationModalProps {
  organisation: EnseigneOrganisation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  trade_name: string;
  shipping_address_line1: string;
  shipping_city: string;
  shipping_postal_code: string;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function EditOrganisationModal({
  organisation,
  open,
  onOpenChange,
}: EditOrganisationModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    trade_name: '',
    shipping_address_line1: '',
    shipping_city: '',
    shipping_postal_code: '',
  });

  // Reset form when organisation changes
  useEffect(() => {
    if (organisation) {
      setFormData({
        trade_name: organisation.trade_name || '',
        shipping_address_line1: organisation.shipping_address_line1 || '',
        shipping_city: organisation.shipping_city || '',
        shipping_postal_code: organisation.shipping_postal_code || '',
      });
    }
  }, [organisation]);

  // Mutation for updating
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!organisation) throw new Error('No organisation');

      const supabase = createClient();
      const { error } = await supabase
        .from('organisations')
        .update({
          trade_name: data.trade_name || null,
          shipping_address_line1: data.shipping_address_line1 || null,
          shipping_city: data.shipping_city || null,
          shipping_postal_code: data.shipping_postal_code || null,
        })
        .eq('id', organisation.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enseigne-organisations'] });
      toast.success('Organisation mise à jour');
      onOpenChange(false);
    },
    onError: (error: Error) => {
      console.error('Update error:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  if (!organisation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dialogSize="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Modifier l&apos;organisation</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nom commercial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom commercial
            </label>
            <input
              type="text"
              value={formData.trade_name}
              onChange={handleChange('trade_name')}
              placeholder={organisation.legal_name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Laissez vide pour utiliser le nom légal :{' '}
              {organisation.legal_name}
            </p>
          </div>

          {/* Adresse de livraison */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              Adresse de livraison
            </p>

            <input
              type="text"
              value={formData.shipping_address_line1}
              onChange={handleChange('shipping_address_line1')}
              placeholder="Adresse (rue, numéro)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <div className="grid grid-cols-3 gap-3">
              <input
                type="text"
                value={formData.shipping_postal_code}
                onChange={handleChange('shipping_postal_code')}
                placeholder="Code postal"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                value={formData.shipping_city}
                onChange={handleChange('shipping_city')}
                placeholder="Ville"
                className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Enregistrer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditOrganisationModal;
