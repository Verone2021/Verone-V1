'use client';

import { ButtonV2 } from '@verone/ui';
import { Plus } from 'lucide-react';

interface EnseignesHeaderProps {
  activeTab: 'enseignes' | 'organisations';
  onNewEnseigne: () => void;
}

export function EnseignesHeader({
  activeTab,
  onNewEnseigne,
}: EnseignesHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Enseignes & Organisations
        </h2>
        <p className="text-muted-foreground">
          Gérez les enseignes (réseaux) et les organisations affiliées LinkMe
        </p>
      </div>
      {activeTab === 'enseignes' && (
        <ButtonV2 onClick={onNewEnseigne} icon={Plus}>
          Nouvelle enseigne
        </ButtonV2>
      )}
    </div>
  );
}
