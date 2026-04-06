import { Filter, Search } from 'lucide-react';

import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

interface FiltersState {
  severity: string;
  category: string;
  acknowledged: boolean;
  limit: number;
}

interface AlertesFiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  showFilters: boolean;
  toggleShowFilters: () => void;
  setFilters: (fn: (prev: FiltersState) => FiltersState) => void;
}

export function AlertesFilters({
  searchTerm,
  setSearchTerm,
  showFilters,
  toggleShowFilters,
  setFilters,
}: AlertesFiltersProps) {
  return (
    <Card className="border-black">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtres et recherche
          </span>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={toggleShowFilters}
            className="border-black text-black hover:bg-black hover:text-white"
          >
            {showFilters ? 'Masquer' : 'Afficher'} filtres
          </ButtonV2>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recherche globale */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher alertes, produits, SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 border-black"
              />
            </div>
          </div>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Sévérité</Label>
              <Select
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, severity: value }))
                }
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Toutes les sévérités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les sévérités</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="info">Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les catégories</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="movement">Mouvement</SelectItem>
                  <SelectItem value="forecast">Prévision</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>État</Label>
              <Select
                onValueChange={value =>
                  setFilters(prev => ({
                    ...prev,
                    acknowledged: value === 'true',
                  }))
                }
              >
                <SelectTrigger className="border-black">
                  <SelectValue placeholder="Toutes les alertes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes les alertes</SelectItem>
                  <SelectItem value="false">Non acquittées</SelectItem>
                  <SelectItem value="true">Acquittées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <ButtonV2
                variant="outline"
                onClick={() => {
                  setFilters(() => ({
                    severity: '',
                    category: '',
                    acknowledged: false,
                    limit: 100,
                  }));
                  setSearchTerm('');
                }}
                className="w-full border-black text-black hover:bg-black hover:text-white"
              >
                Réinitialiser
              </ButtonV2>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
