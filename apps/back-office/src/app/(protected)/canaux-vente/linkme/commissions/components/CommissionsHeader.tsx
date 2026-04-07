'use client';

import { ButtonV2 } from '@verone/ui';
import { Download } from 'lucide-react';

interface CommissionsHeaderProps {
  onExportCSV: () => void;
}

export function CommissionsHeader({ onExportCSV }: CommissionsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Rémunération</h1>
        <p className="text-muted-foreground">
          Gestion des commissions affiliés LinkMe
        </p>
      </div>
      <ButtonV2 variant="outline" onClick={onExportCSV}>
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </ButtonV2>
    </div>
  );
}
