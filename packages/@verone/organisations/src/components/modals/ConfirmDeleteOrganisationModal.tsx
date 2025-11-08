'use client';

import { useState } from 'react';

import { AlertTriangle, Loader2, Trash2, Building2 } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { getOrganisationDisplayName } from '@/lib/utils/organisation-helpers';
import type { Organisation } from '@verone/organisations/hooks';

interface ConfirmDeleteOrganisationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisation: Organisation | null;
  organisationType: 'supplier' | 'customer' | 'partner';
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

/**
 * Modal de confirmation de suppression d'organisation
 * Pattern UX 2025 : Avertissement clair + détails + action explicite
 * Inspiré de DeleteUserDialog (/admin/users)
 */
export function ConfirmDeleteOrganisationModal({
  open,
  onOpenChange,
  organisation,
  organisationType,
  onConfirm,
  isDeleting = false,
}: ConfirmDeleteOrganisationModalProps) {
  const [error, setError] = useState<string | null>(null);

  if (!organisation) return null;

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      // Modal fermé par le parent après succès
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors de la suppression'
      );
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setError(null);
      onOpenChange(false);
    }
  };

  const getTypeLabel = () => {
    switch (organisationType) {
      case 'supplier':
        return 'fournisseur';
      case 'customer':
        return 'client';
      case 'partner':
        return 'prestataire';
      default:
        return 'organisation';
    }
  };

  const getDisplayName = () => {
    return getOrganisationDisplayName(organisation as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg text-red-600">
            <Trash2 className="h-5 w-5 mr-2" />
            Supprimer {getTypeLabel()}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-gray-600">
          Cette action est irréversible. Toutes les données associées seront
          supprimées.
        </DialogDescription>

        {/* Informations organisation */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-start space-x-3">
            <Building2 className="h-10 w-10 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {getDisplayName()}
              </h4>
              {organisation.email && (
                <p className="text-xs text-gray-600 mt-1">
                  {organisation.email}
                </p>
              )}
              {organisation.phone && (
                <p className="text-xs text-gray-600">{organisation.phone}</p>
              )}
              {organisation.city && (
                <p className="text-xs text-gray-500 mt-1">
                  {organisation.city}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Avertissement */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-800 mb-2">
                Attention : Action irréversible
              </h4>
              <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                <li>
                  Les informations de {getTypeLabel()} seront définitivement
                  supprimées
                </li>
                <li>Les contacts associés pourraient être perdus</li>
                <li>L'historique des commandes restera pour référence</li>
                <li>Cette action ne peut pas être annulée</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex space-x-2">
          <ButtonV2
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
