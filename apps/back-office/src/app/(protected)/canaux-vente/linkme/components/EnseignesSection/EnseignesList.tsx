'use client';

import { ButtonV2 } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Building2, Plus } from 'lucide-react';

import type { EnseigneWithStats } from '../../hooks/use-linkme-enseignes';
import { EnseigneCard } from './EnseigneCard';
import { EnseignesSearchBar } from './EnseignesSearchBar';

interface EnseignesListProps {
  enseignes: EnseigneWithStats[];
  isLoading: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  getLogoUrl: (logoPath: string | null) => string | null;
  onToggleActive: (enseigne: EnseigneWithStats) => void;
  onOpenCreate: () => void;
}

export function EnseignesList({
  enseignes,
  isLoading,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  getLogoUrl,
  onToggleActive,
  onOpenCreate,
}: EnseignesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des enseignes</CardTitle>
        <CardDescription>
          Recherchez et filtrez les enseignes de votre réseau
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EnseignesSearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          placeholder="Rechercher une enseigne..."
        />

        {/* Enseignes grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-16 w-16 rounded-lg mb-4" />
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : enseignes.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune enseigne</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Aucun résultat pour ces critères'
                : 'Créez votre première enseigne pour commencer'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <ButtonV2 className="mt-4" onClick={onOpenCreate} icon={Plus}>
                Créer une enseigne
              </ButtonV2>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enseignes.map(enseigne => (
              <EnseigneCard
                key={enseigne.id}
                enseigne={enseigne}
                getLogoUrl={getLogoUrl}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
