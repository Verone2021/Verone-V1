'use client';

/**
 * En-tête de la Bibliothèque comptable [BO-COMPTA-001]
 * Titre + description + actions globales (synchro Qonto + préparation Welyb).
 */

import { FolderArchive } from 'lucide-react';

import { ClotureGlobalActions } from '../../_shared-comptable/cloture-global-actions';

interface LibraryHeaderProps {
  /** Année de la sélection courante (scope des actions Qonto / Welyb) */
  year: number;
  onSyncComplete: () => void;
}

export function LibraryHeader({ year, onSyncComplete }: LibraryHeaderProps) {
  return (
    <div className="px-6 py-4 border-b flex items-start justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <FolderArchive className="h-5 w-5" />
          Bibliotheque comptable
        </h1>
        <p className="text-sm text-muted-foreground">
          Tous vos justificatifs (factures, recus) classes par annee et type
          (Achats/Ventes/Avoirs). La pastille de couleur indique le statut de
          chaque piece. Synchronisez avec Qonto, completez les pieces manquantes
          et preparez l&apos;envoi au comptable directement d&apos;ici.
        </p>
      </div>
      <div className="flex-shrink-0">
        <ClotureGlobalActions year={year} onSyncComplete={onSyncComplete} />
      </div>
    </div>
  );
}
