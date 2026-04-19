'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  ScrollArea,
  Textarea,
} from '@verone/ui';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ICustomLineToPreserve {
  title: string;
  description?: string;
  quantity: number;
  unit_price_ht: number;
  vat_rate: number;
}

interface RegenerateDocumentConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: 'quote' | 'proforma';
  existingCustomLines: ICustomLineToPreserve[];
  existingNotes: string;
  onConfirm: (
    customLinesToPreserve: ICustomLineToPreserve[],
    notesToPreserve: string
  ) => void;
  isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAmount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

/**
 * Modal de confirmation avant régénération d'un devis ou proforma.
 *
 * Permet à l'utilisateur de :
 * - Choisir quelles lignes libres (customLines) préserver
 * - Choisir si les notes doivent être préservées
 * - Confirmer ou annuler la régénération
 *
 * Les items issus de la commande sont toujours inclus (R2 — readonly).
 */
export function RegenerateDocumentConfirmModal({
  open,
  onOpenChange,
  documentType,
  existingCustomLines,
  existingNotes,
  onConfirm,
  isLoading = false,
}: RegenerateDocumentConfirmModalProps): React.ReactNode {
  // Toutes les customLines cochées par défaut
  const [checkedLines, setCheckedLines] = useState<boolean[]>(() =>
    existingCustomLines.map(() => true)
  );
  const [preserveNotes, setPreserveNotes] = useState(existingNotes.length > 0);

  const docLabel = documentType === 'quote' ? 'devis' : 'proforma';
  const deleteAction =
    documentType === 'quote'
      ? "marque comme supersede (consultable dans l'historique)"
      : 'supprime definitivement';

  const handleConfirm = (): void => {
    const linesToPreserve = existingCustomLines.filter(
      (_, i) => checkedLines[i]
    );
    const notes = preserveNotes ? existingNotes : '';
    onConfirm(linesToPreserve, notes);
  };

  const handleLineToggle = (index: number): void => {
    setCheckedLines(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const hasCustomLines = existingCustomLines.length > 0;
  const hasNotes = existingNotes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Re-synchroniser avec la commande
          </DialogTitle>
          <DialogDescription>
            Le {docLabel} sera regenere avec les donnees actuelles de la
            commande. L&apos;ancien {docLabel} sera {deleteAction}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Section lignes libres */}
          {hasCustomLines ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Lignes libres a preserver</p>
              <p className="text-xs text-muted-foreground">
                Ces lignes ne sont pas issues de la commande. Selectionnez
                celles que vous souhaitez conserver dans le nouveau {docLabel}.
              </p>
              <ScrollArea className="max-h-48 border rounded-md p-3">
                <div className="space-y-2">
                  {existingCustomLines.map((line, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Checkbox
                        id={`line-${i}`}
                        checked={checkedLines[i]}
                        onCheckedChange={() => handleLineToggle(i)}
                      />
                      <Label
                        htmlFor={`line-${i}`}
                        className="flex-1 cursor-pointer space-y-0.5"
                      >
                        <span className="text-sm font-normal">
                          {line.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {line.quantity} x {formatAmount(line.unit_price_ht)}{' '}
                          HT — {Math.round(line.vat_rate * 100)}% TVA
                        </span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground rounded-md border border-dashed p-3 text-center">
              Aucune ligne libre dans ce {docLabel}.
            </div>
          )}

          {/* Section notes */}
          {hasNotes && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="preserve-notes"
                  checked={preserveNotes}
                  onCheckedChange={checked =>
                    setPreserveNotes(checked === true)
                  }
                />
                <Label htmlFor="preserve-notes" className="cursor-pointer">
                  Conserver les notes
                </Label>
              </div>
              {preserveNotes && (
                <Textarea
                  value={existingNotes}
                  readOnly
                  rows={3}
                  className="text-xs bg-muted resize-none"
                />
              )}
            </div>
          )}

          {/* Avertissement */}
          <div className="rounded-md bg-orange-50 border border-orange-200 p-3">
            <p className="text-xs text-orange-700">
              Les articles issus de la commande seront toujours recalcules
              depuis les donnees actuelles de la commande (R2 — prix readonly).
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-synchroniser maintenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
