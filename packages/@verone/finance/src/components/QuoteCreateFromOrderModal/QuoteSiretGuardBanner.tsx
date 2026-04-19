'use client';

import { AlertTriangle, Loader2, Save } from 'lucide-react';

import { Button, Input } from '@verone/ui';

interface QuoteSiretGuardBannerProps {
  siretInput: string;
  setSiretInput: (v: string) => void;
  savingSiret: boolean;
  onSaveSiret: () => void;
}

export function QuoteSiretGuardBanner({
  siretInput,
  setSiretInput,
  savingSiret,
  onSaveSiret,
}: QuoteSiretGuardBannerProps): React.ReactNode {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-red-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        SIRET ou n° TVA requis pour créer un devis organisation
      </div>
      <p className="text-xs text-red-600">
        L&apos;organisation n&apos;a pas de SIRET ni de numéro de TVA. Qonto
        exige l&apos;un des deux pour les clients B2B. Saisissez-le ci-dessous
        pour continuer.
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
  );
}
