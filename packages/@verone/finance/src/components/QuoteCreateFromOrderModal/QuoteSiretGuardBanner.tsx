'use client';

import { AlertTriangle, Building2, Loader2, Save } from 'lucide-react';

import { Button, Input } from '@verone/ui';

import type { IParentOrgSuggestion } from '../../hooks/use-parent-org-for-billing';

interface QuoteSiretGuardBannerProps {
  siretInput: string;
  setSiretInput: (v: string) => void;
  savingSiret: boolean;
  onSaveSiret: () => void;
  /** [BO-FIN-040] Maison mère détectée pour auto-facturation, ou null */
  parentOrg?: IParentOrgSuggestion | null;
  /** [BO-FIN-040] Callback au clic "Utiliser la maison mère" */
  onUseParentOrg?: () => void;
  /** [BO-FIN-040] Nom de l'org commande courante pour le texte UX */
  currentOrgName?: string | null;
}

export function QuoteSiretGuardBanner({
  siretInput,
  setSiretInput,
  savingSiret,
  onSaveSiret,
  parentOrg,
  onUseParentOrg,
  currentOrgName,
}: QuoteSiretGuardBannerProps): React.ReactNode {
  const parentName = parentOrg?.trade_name ?? parentOrg?.legal_name ?? null;
  const parentTin = parentOrg?.siret ?? parentOrg?.vat_number ?? null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-red-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        SIRET ou n° TVA requis pour créer un devis organisation
      </div>
      <p className="text-xs text-red-600">
        L&apos;organisation n&apos;a pas de SIRET ni de numéro de TVA. Qonto
        exige l&apos;un des deux pour les clients B2B.
      </p>

      {parentOrg && onUseParentOrg && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-2 space-y-2">
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 flex-shrink-0 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-medium">
                Maison mère disponible — {parentName}
              </p>
              <p className="text-blue-700">
                Facturer le devis à la maison mère (SIRET :{' '}
                <span className="font-mono">{parentTin}</span>). Livraison à
                {currentOrgName
                  ? ` ${currentOrgName}`
                  : " l'organisation de la commande"}
                . La commande reste inchangée.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="default"
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700"
            onClick={onUseParentOrg}
          >
            <Building2 className="h-4 w-4 mr-1" />
            Utiliser la maison mère pour la facturation
          </Button>
        </div>
      )}

      <p className="text-xs text-red-600">
        Ou saisissez un SIRET / n° TVA manuellement :
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
