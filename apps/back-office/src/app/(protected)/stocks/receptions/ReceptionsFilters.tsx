'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Package, Building2, Users, Filter, Search } from 'lucide-react';

interface ReceptionsFiltersProps {
  sourceFilter: 'all' | 'suppliers' | 'affiliates';
  affiliateReceptionsCount: number;
  searchTerm: string;
  statusFilter: string;
  urgencyFilter: string;
  onSourceFilterChange: (filter: 'all' | 'suppliers' | 'affiliates') => void;
  onSearchTermChange: (term: string) => void;
  onStatusFilterChange: (filter: string) => void;
  onUrgencyFilterChange: (filter: string) => void;
}

export function ReceptionsFilters({
  sourceFilter,
  affiliateReceptionsCount,
  searchTerm,
  statusFilter,
  urgencyFilter,
  onSourceFilterChange,
  onSearchTermChange,
  onStatusFilterChange,
  onUrgencyFilterChange,
}: ReceptionsFiltersProps) {
  return (
    <>
      {/* Sélecteur Source: Toutes / Fournisseurs / Affiliés */}
      <div className="flex gap-2">
        <ButtonV2
          variant={sourceFilter === 'all' ? 'default' : 'outline'}
          onClick={() => onSourceFilterChange('all')}
          className="flex items-center gap-2"
        >
          <Package className="h-4 w-4" />
          Toutes
        </ButtonV2>
        <ButtonV2
          variant={sourceFilter === 'suppliers' ? 'default' : 'outline'}
          onClick={() => onSourceFilterChange('suppliers')}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          Commandes
        </ButtonV2>
        <ButtonV2
          variant={sourceFilter === 'affiliates' ? 'default' : 'outline'}
          onClick={() => onSourceFilterChange('affiliates')}
          className="flex items-center gap-2"
        >
          <Users className="h-4 w-4" />
          Affilies
          {affiliateReceptionsCount > 0 && (
            <Badge className="ml-1 bg-purple-500">
              {affiliateReceptionsCount}
            </Badge>
          )}
        </ButtonV2>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={
                    sourceFilter === 'suppliers'
                      ? 'Rechercher par numéro de commande ou fournisseur...'
                      : 'Rechercher par produit ou affilié...'
                  }
                  value={searchTerm}
                  onChange={e => onSearchTermChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            {(sourceFilter === 'suppliers' || sourceFilter === 'all') && (
              <>
                <Select
                  value={statusFilter}
                  onValueChange={onStatusFilterChange}
                >
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="validated">Validee</SelectItem>
                    <SelectItem value="partially_received">
                      Partielle
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={urgencyFilter}
                  onValueChange={onUrgencyFilterChange}
                >
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgent (&lt; 3j)</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
