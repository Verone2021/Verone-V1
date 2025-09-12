'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { 
  Search, 
  X, 
  Filter,
  Calendar,
  Home,
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ReservationsFilters() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedStatus !== 'all') count++;
    if (selectedSource !== 'all') count++;
    if (selectedProperty !== 'all') count++;
    if (dateRange.from || dateRange.to) count++;
    return count;
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedProperty('all');
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Barre de recherche principale */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher par nom, code confirmation, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`border-gray-200 hover:border-[#D4841A] hover:bg-[#D4841A]/5 ${showFilters ? 'bg-[#D4841A]/5 border-[#D4841A]' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtres
          {activeFiltersCount() > 0 && (
            <Badge className="ml-2 bg-[#D4841A] text-white">
              {activeFiltersCount()}
            </Badge>
          )}
        </Button>

        {activeFiltersCount() > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="w-4 h-4 mr-1" />
            Effacer tout
          </Button>
        )}
      </div>

      {/* Panneau de filtres avancés */}
      {showFilters && (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtre par statut */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Statut</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="confirmee">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Confirmée
                    </div>
                  </SelectItem>
                  <SelectItem value="en_attente">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      En attente
                    </div>
                  </SelectItem>
                  <SelectItem value="en_cours">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      En cours
                    </div>
                  </SelectItem>
                  <SelectItem value="completee">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
                      Complétée
                    </div>
                  </SelectItem>
                  <SelectItem value="annulee">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      Annulée
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par source */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Source</Label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                  <SelectValue placeholder="Toutes les sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  <SelectItem value="airbnb">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#FF5A5F] rounded mr-2"></div>
                      Airbnb
                    </div>
                  </SelectItem>
                  <SelectItem value="booking">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#003580] rounded mr-2"></div>
                      Booking.com
                    </div>
                  </SelectItem>
                  <SelectItem value="direct">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-[#D4841A] rounded mr-2"></div>
                      Direct
                    </div>
                  </SelectItem>
                  <SelectItem value="autre">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                      Autre
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par propriété */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Propriété</Label>
              <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                  <Home className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Toutes les propriétés" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les propriétés</SelectItem>
                  <SelectItem value="villa-nice">Villa Nice - Oceanview First Line</SelectItem>
                  <SelectItem value="apt-paris">Appartement Paris - Tour Eiffel</SelectItem>
                  <SelectItem value="chalet-chamonix">Chalet Chamonix - Mont Blanc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtre par dates */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Période</Label>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border-gray-200 hover:border-[#D4841A] hover:bg-[#D4841A]/5 h-11"
              >
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-gray-600">
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${dateRange.from.toLocaleDateString('fr-FR')} - ${dateRange.to.toLocaleDateString('fr-FR')}`
                    ) : (
                      dateRange.from.toLocaleDateString('fr-FR')
                    )
                  ) : (
                    'Sélectionner une période'
                  )}
                </span>
              </Button>
            </div>
          </div>

          {/* Tags de filtres actifs */}
          {activeFiltersCount() > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-600 mr-2">Filtres actifs :</span>
              
              {searchTerm && (
                <Badge 
                  variant="outline" 
                  className="bg-white border-[#D4841A]/20 text-gray-700 hover:bg-[#D4841A]/10 cursor-pointer"
                  onClick={() => setSearchTerm('')}
                >
                  Recherche: {searchTerm}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {selectedStatus !== 'all' && (
                <Badge 
                  variant="outline" 
                  className="bg-white border-[#D4841A]/20 text-gray-700 hover:bg-[#D4841A]/10 cursor-pointer"
                  onClick={() => setSelectedStatus('all')}
                >
                  Statut: {selectedStatus}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {selectedSource !== 'all' && (
                <Badge 
                  variant="outline" 
                  className="bg-white border-[#D4841A]/20 text-gray-700 hover:bg-[#D4841A]/10 cursor-pointer"
                  onClick={() => setSelectedSource('all')}
                >
                  Source: {selectedSource}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {selectedProperty !== 'all' && (
                <Badge 
                  variant="outline" 
                  className="bg-white border-[#D4841A]/20 text-gray-700 hover:bg-[#D4841A]/10 cursor-pointer"
                  onClick={() => setSelectedProperty('all')}
                >
                  Propriété: {selectedProperty}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
              
              {(dateRange.from || dateRange.to) && (
                <Badge 
                  variant="outline" 
                  className="bg-white border-[#D4841A]/20 text-gray-700 hover:bg-[#D4841A]/10 cursor-pointer"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Période sélectionnée
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}