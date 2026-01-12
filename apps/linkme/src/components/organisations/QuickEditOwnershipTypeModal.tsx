'use client';

/**
 * QuickEditOwnershipTypeModal
 *
 * Modal dédié pour modifier le type de propriété d'une organisation
 * (Propre / Franchise)
 *
 * @module QuickEditOwnershipTypeModal
 * @since 2026-01-12
 */

import { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// TYPES
// ============================================

interface QuickEditOwnershipTypeModalProps {
  organisationId: string;
  organisationName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type OwnershipType = 'succursale' | 'franchise';

// ============================================
// COMPONENT
// ============================================

export function QuickEditOwnershipTypeModal({
  organisationId,
  organisationName,
  isOpen,
  onClose,
  onSuccess,
}: QuickEditOwnershipTypeModalProps) {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<OwnershipType | null>(null);

  // Mutation pour mise à jour
  const updateMutation = useMutation({
    mutationFn: async (ownershipType: OwnershipType) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('organisations')
        .update({ ownership_type: ownershipType })
        .eq('id', organisationId);

      if (error) throw error;
      return ownershipType;
    },
    onSuccess: ownershipType => {
      queryClient.invalidateQueries({ queryKey: ['enseigne-organisations'] });
      toast.success(
        `Type défini : ${ownershipType === 'succursale' ? 'Restaurant propre' : 'Franchise'}`
      );
      onSuccess?.();
      handleClose();
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const handleClose = () => {
    setSelectedType(null);
    onClose();
  };

  const handleSave = () => {
    if (selectedType) {
      updateMutation.mutate(selectedType);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle>Type de propriété</DialogTitle>
              <DialogDescription className="text-sm">
                {organisationName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Ce restaurant est-il une succursale propre ou une franchise ?
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSelectedType('succursale')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg border-2 transition-colors ${
                selectedType === 'succursale'
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Restaurant propre
            </button>
            <button
              type="button"
              onClick={() => setSelectedType('franchise')}
              className={`flex-1 py-3 px-4 text-sm font-medium rounded-lg border-2 transition-colors ${
                selectedType === 'franchise'
                  ? 'bg-amber-50 border-amber-500 text-amber-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              Franchise
            </button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedType || updateMutation.isPending}
            className="bg-linkme-turquoise hover:bg-linkme-turquoise/90"
          >
            {updateMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
