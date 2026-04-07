'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  Building2,
  Store,
  CheckCircle,
  XCircle,
  Briefcase,
  Archive,
} from 'lucide-react';

import type { OrganisationIndependante } from './types';

interface EnseignesStats {
  total: number;
  active: number;
  inactive: number;
  totalOrgs: number;
}

interface EnseignesStatsCardsProps {
  activeTab: 'enseignes' | 'organisations';
  stats: EnseignesStats;
  organisationsIndependantes: OrganisationIndependante[];
}

export function EnseignesStatsCards({
  activeTab,
  stats,
  organisationsIndependantes,
}: EnseignesStatsCardsProps) {
  if (activeTab === 'enseignes') {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">enseignes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.active}
            </div>
            <p className="text-xs text-muted-foreground">enseignes actives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactives</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.inactive}
            </div>
            <p className="text-xs text-muted-foreground">enseignes inactives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisations</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalOrgs}
            </div>
            <p className="text-xs text-muted-foreground">shops rattachés</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {organisationsIndependantes.length}
          </div>
          <p className="text-xs text-muted-foreground">organisations</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Actives</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {organisationsIndependantes.filter(o => o.is_linkme_active).length}
          </div>
          <p className="text-xs text-muted-foreground">organisations actives</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Archivées</CardTitle>
          <Archive className="h-4 w-4 text-gray-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-600">
            {organisationsIndependantes.filter(o => !o.is_linkme_active).length}
          </div>
          <p className="text-xs text-muted-foreground">
            organisations archivées
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
