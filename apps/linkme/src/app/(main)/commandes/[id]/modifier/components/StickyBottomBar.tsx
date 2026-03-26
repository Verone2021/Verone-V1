'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from '@verone/ui';
import { LINKME_CONSTANTS } from '@verone/utils';
import { Loader2, Save } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface StickyBottomBarProps {
  totals: {
    totalHt: number;
    totalTtc: number;
    totalCommission: number;
  };
  canViewCommissions: boolean;
  hasChanges: boolean;
  isPending: boolean;
  showSaveConfirmation: boolean;
  formatPrice: (amount: number) => string;
  onCancel: () => void;
  onSaveClick: () => void;
  onSaveConfirmationChange: (open: boolean) => void;
  onConfirmSave: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StickyBottomBar({
  totals,
  canViewCommissions,
  hasChanges,
  isPending,
  showSaveConfirmation,
  formatPrice,
  onCancel,
  onSaveClick,
  onSaveConfirmationChange,
  onConfirmSave,
}: StickyBottomBarProps) {
  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Totaux */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">Total HT</p>
                <p className="text-lg font-semibold text-[#183559]">
                  {formatPrice(totals.totalHt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total TTC</p>
                <p className="text-lg font-bold text-[#183559]">
                  {formatPrice(totals.totalTtc)}
                </p>
              </div>
              {canViewCommissions && totals.totalCommission > 0 && (
                <div>
                  <p className="text-xs text-gray-500">Commission</p>
                  <p className="text-lg font-bold text-emerald-600">
                    +
                    {formatPrice(
                      totals.totalCommission *
                        (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Warning + Buttons */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="text-sm text-amber-600 font-medium">
                  Modifications non enregistrees
                </span>
              )}
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button
                onClick={onSaveClick}
                disabled={!hasChanges || isPending}
                className="bg-[#5DBEBB] hover:bg-[#4DAEAB] text-white"
              >
                {isPending ? (
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
          </div>
        </div>
      </div>

      {/* Save confirmation dialog */}
      <AlertDialog
        open={showSaveConfirmation}
        onOpenChange={onSaveConfirmationChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la sauvegarde</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de sauvegarder les modifications de cette
              commande brouillon.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmSave}>
              Enregistrer les modifications
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
