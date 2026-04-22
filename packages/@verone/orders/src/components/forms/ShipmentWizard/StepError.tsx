'use client';

import { ButtonV2 } from '@verone/ui';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export interface StepErrorProps {
  packlinkRef: string | null;
  dbError: string | null;
  authError: string | null;
  retrying: boolean;
  onRetryDb: () => void;
  onCancelPacklink: () => void;
  onClose: () => void;
}

export function StepError({
  packlinkRef,
  dbError,
  authError,
  retrying,
  onRetryDb,
  onCancelPacklink,
  onClose,
}: StepErrorProps) {
  return (
    <div className="space-y-4 py-4">
      <div className="flex items-start gap-3 p-4 border border-red-200 bg-red-50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-red-900">
            L&apos;expédition Packlink a été créée mais l&apos;enregistrement
            interne a échoué
          </p>
          {packlinkRef && (
            <p className="text-sm text-red-800">
              Référence Packlink :{' '}
              <code className="font-mono bg-red-100 px-1">{packlinkRef}</code>
            </p>
          )}
          {(dbError ?? authError) && (
            <p className="text-sm text-red-700">{dbError ?? authError}</p>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-700">
        Deux actions possibles pour résoudre :
      </p>

      <div className="space-y-2">
        <ButtonV2
          variant="default"
          className="w-full justify-start h-11 md:h-9"
          onClick={onRetryDb}
          disabled={retrying || !!authError}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`}
          />
          Réessayer l&apos;enregistrement
        </ButtonV2>
        <ButtonV2
          variant="outline"
          className="w-full justify-start h-11 md:h-9 text-red-600 hover:text-red-700"
          onClick={onCancelPacklink}
          disabled={retrying || !packlinkRef}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Annuler côté Packlink
        </ButtonV2>
        <ButtonV2
          variant="ghost"
          className="w-full h-11 md:h-9"
          onClick={onClose}
        >
          Fermer (traiter plus tard)
        </ButtonV2>
      </div>

      <p className="text-xs text-gray-500">
        Si vous fermez, notez la référence Packlink ci-dessus. Le shipment
        restera créé sur Packlink PRO mais pas dans notre système.
      </p>
    </div>
  );
}
