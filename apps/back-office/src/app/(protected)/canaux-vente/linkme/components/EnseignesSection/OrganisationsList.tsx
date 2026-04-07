'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Briefcase } from 'lucide-react';

import { EnseignesSearchBar } from './EnseignesSearchBar';
import { OrganisationCard } from './OrganisationCard';
import type { OrganisationIndependante } from './types';

interface OrganisationsListProps {
  organisations: OrganisationIndependante[];
  loadingOrgs: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
  getLogoUrl: (logoPath: string | null) => string | null;
}

export function OrganisationsList({
  organisations,
  loadingOrgs,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  getLogoUrl,
}: OrganisationsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des organisations</CardTitle>
        <CardDescription>
          Organisations affiliées LinkMe (entreprises individuelles)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EnseignesSearchBar
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={onStatusFilterChange}
          placeholder="Rechercher une organisation..."
        />

        {/* Organisations grid */}
        {loadingOrgs ? (
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
        ) : organisations.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune organisation</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Aucun résultat pour ces critères'
                : "Aucun affilié de type organisation n'est encore enregistré"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organisations.map(org => (
              <OrganisationCard
                key={org.id}
                org={org}
                getLogoUrl={getLogoUrl}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
