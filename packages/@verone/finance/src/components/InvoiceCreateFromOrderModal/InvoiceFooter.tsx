'use client';

import { Button, DialogFooter, Input } from '@verone/ui';
import { AlertTriangle, FileText, Loader2, Save } from 'lucide-react';

import type { CreateStatus } from './types';

interface IInvoiceFooterProps {
  status: CreateStatus;
  isMissingSiret: boolean;
  siretInput: string;
  setSiretInput: (v: string) => void;
  savingSiret: boolean;
  onSaveSiret: () => void;
  onClose: () => void;
  onCreateInvoice: () => void;
}

export function InvoiceFooter({
  status,
  isMissingSiret,
  siretInput,
  setSiretInput,
  savingSiret,
  onSaveSiret,
  onClose,
  onCreateInvoice,
}: IInvoiceFooterProps): React.ReactNode {
  return (
    <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
      {status === 'success' ? (
        <Button onClick={onClose}>Fermer</Button>
      ) : (
        <div className="flex flex-col gap-3 w-full">
          {/* SIRET guard banner */}
          {isMissingSiret && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-red-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                SIRET ou n° TVA requis pour facturer une organisation
              </div>
              <p className="text-xs text-red-600">
                L&apos;organisation n&apos;a pas de SIRET ni de numéro de TVA.
                Saisissez-le ci-dessous pour continuer.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={siretInput}
                  onChange={e => setSiretInput(e.target.value)}
                  placeholder="SIRET (14 chiffres) ou n° TVA (ex: FR12345678901)"
                  className="h-8 flex-1"
                />
                <Button
                  size="sm"
                  onClick={onSaveSiret}
                  disabled={savingSiret || !siretInput.trim()}
                >
                  {savingSiret ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              onClick={onCreateInvoice}
              disabled={status === 'creating' || isMissingSiret}
            >
              {status === 'creating' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Créer en brouillon
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </DialogFooter>
  );
}
