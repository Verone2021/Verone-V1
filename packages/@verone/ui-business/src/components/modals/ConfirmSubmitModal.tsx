'use client';

import { useState } from 'react';

import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { cn } from '@verone/utils';

interface SummaryItem {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
  isImportant?: boolean;
}

interface ConfirmSubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  summaryData: SummaryItem[];
  onConfirm: () => Promise<void>;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

/**
 * Modal de confirmation avant soumission de formulaire
 * Affiche un récapitulatif complet des données saisies
 * Pattern UX 2025 : preview + validation explicite
 */
export function ConfirmSubmitModal({
  open,
  onOpenChange,
  title,
  description,
  summaryData,
  onConfirm,
  confirmLabel = 'Confirmer',
  isSubmitting = false,
}: ConfirmSubmitModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
      // Modal fermé par le parent après succès
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setError(null);
      onOpenChange(false);
    }
  };

  // Filtrer les données vides
  const visibleData = summaryData.filter(item => {
    const value = item.value;
    return (
      value !== null &&
      value !== undefined &&
      value !== '' &&
      value !== 'Non renseigné'
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-gray-600">
          {description}
        </DialogDescription>

        {/* Récapitulatif des données */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Récapitulatif des informations
          </h4>

          {visibleData.length > 0 ? (
            <div className="space-y-2">
              {visibleData.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex justify-between items-start py-2 border-b border-gray-200 last:border-0',
                    item.isImportant &&
                      'bg-blue-50 px-3 py-2 rounded border-blue-200'
                  )}
                >
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    {item.icon && (
                      <span className="flex-shrink-0">{item.icon}</span>
                    )}
                    <span
                      className={cn(
                        item.isImportant && 'font-medium text-blue-800'
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'text-sm text-right max-w-md',
                      item.isImportant
                        ? 'font-semibold text-blue-900'
                        : 'text-gray-900'
                    )}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm italic">
              Aucune donnée à afficher
            </div>
          )}
        </div>

        {/* Box info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              Vérifiez attentivement les informations ci-dessus avant de
              confirmer. Vous pourrez les modifier ultérieurement.
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex space-x-2">
          <ButtonV2
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {confirmLabel}
              </>
            )}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
