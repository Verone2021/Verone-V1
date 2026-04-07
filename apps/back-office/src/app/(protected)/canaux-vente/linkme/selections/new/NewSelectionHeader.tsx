'use client';

import Link from 'next/link';

import { ButtonV2 } from '@verone/ui';
import { ArrowLeft, Check } from 'lucide-react';

interface NewSelectionHeaderProps {
  isCreating: boolean;
  canCreate: boolean;
  onCreateClick: () => void;
}

export function NewSelectionHeader({
  isCreating,
  canCreate,
  onCreateClick,
}: NewSelectionHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/canaux-vente/linkme/selections"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Créer une sélection</h1>
            <p className="text-sm text-gray-500">
              Configurez une nouvelle sélection de produits pour un utilisateur
              LinkMe
            </p>
          </div>
        </div>

        <ButtonV2
          variant="primary"
          icon={Check}
          onClick={onCreateClick}
          loading={isCreating}
          disabled={!canCreate}
        >
          Créer la sélection
        </ButtonV2>
      </div>
    </div>
  );
}
