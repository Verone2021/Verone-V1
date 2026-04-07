'use client';

import { Badge } from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { Building2, Briefcase } from 'lucide-react';

import type { EnseigneWithStats } from '../../hooks/use-linkme-enseignes';
import type { OrganisationIndependante } from './types';

interface EnseignesTabsProps {
  activeTab: 'enseignes' | 'organisations';
  onTabChange: (tab: 'enseignes' | 'organisations') => void;
  enseignes: EnseigneWithStats[] | undefined;
  organisationsIndependantes: OrganisationIndependante[];
}

export function EnseignesTabs({
  activeTab,
  onTabChange,
  enseignes,
  organisationsIndependantes,
}: EnseignesTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={v => onTabChange(v as 'enseignes' | 'organisations')}
    >
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="enseignes" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Enseignes
          {enseignes && (
            <Badge variant="secondary" className="ml-1">
              {enseignes.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="organisations" className="flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Organisations
          <Badge variant="secondary" className="ml-1">
            {organisationsIndependantes.length}
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
