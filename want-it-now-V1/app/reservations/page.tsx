'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Calendar,
  Plus,
  Search,
  Building2,
  Home,
  Euro,
  Users,
  TrendingUp,
  Upload,
  Eye,
  MapPin,
  Bed,
  Bath,
  Square,
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { getProprietesAvecContratsActifs } from '@/actions/reservations';
import Image from 'next/image';
import { AuthenticatedAppShell } from '@/components/layout/app-shell';

type PropertyWithContract = {
  propriete_id: string;
  propriete_nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  propriete_type: string;
  superficie_m2: number;
  nb_pieces: number;
  a_unites: boolean;
  organisation_id: string;
  organisation_nom: string;
  contrat_id: string;
  type_contrat: string;
  contrat_date_debut: string;
  contrat_date_fin: string;
  commission_pourcentage: number;
  prix_nuit_defaut: number;
  photo_cover: string | null;
  nb_reservations_actives: number;
  disponible_aujourdhui: boolean;
};

export default function ReservationsPage() {
  const [properties, setProperties] = useState<PropertyWithContract[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<PropertyWithContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalReservations: 0,
    availableToday: 0,
    averageOccupancy: 0
  });

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [searchTerm, properties]);

  const loadProperties = async () => {
    setLoading(true);
    const result = await getProprietesAvecContratsActifs();
    
    if (result.success && result.data) {
      setProperties(result.data);
      setFilteredProperties(result.data);
      
      // Calculer les statistiques
      const availableCount = result.data.filter((p: PropertyWithContract) => p.disponible_aujourdhui).length;
      const totalReservations = result.data.reduce((sum: number, p: PropertyWithContract) => sum + p.nb_reservations_actives, 0);
      
      setStats({
        totalProperties: result.data.length,
        totalReservations,
        availableToday: availableCount,
        averageOccupancy: result.data.length > 0 
          ? Math.round(((result.data.length - availableCount) / result.data.length) * 100)
          : 0
      });
    }
    setLoading(false);
  };

  const filterProperties = () => {
    if (!searchTerm) {
      setFilteredProperties(properties);
      return;
    }
    
    const filtered = properties.filter(p => 
      p.propriete_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.adresse.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProperties(filtered);
  };

  const getPropertyTypeIcon = (type: string) => {
    switch(type) {
      case 'appartement':
      case 'studio':
        return <Building2 className="w-4 h-4" />;
      case 'maison':
      case 'villa':
      case 'chalet':
        return <Home className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const getPropertyTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'appartement': 'bg-blue-100 text-blue-800 border-blue-200',
      'maison': 'bg-green-100 text-green-800 border-green-200',
      'villa': 'bg-purple-100 text-purple-800 border-purple-200',
      'studio': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'chalet': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {getPropertyTypeIcon(type)}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <AuthenticatedAppShell>
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AuthenticatedAppShell>
    );
  }

  return (
    <AuthenticatedAppShell>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Réservations</h1>
            <p className="text-gray-600 mt-1">
              Channel Manager - Propriétés avec contrats actifs
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/reservations/import">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Link>
            </Button>
            
            <Button size="sm" className="bg-[#D4841A] hover:bg-[#B8741A]" asChild>
              <Link href="/reservations/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Réservation
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Propriétés Actives</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProperties}</p>
                </div>
                <div className="w-12 h-12 bg-[#D4841A]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[#D4841A]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Réservations Actives</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReservations}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disponibles Aujourd'hui</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.availableToday}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux d'Occupation</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.averageOccupancy}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher une propriété par nom, ville ou adresse..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
              />
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Aucune propriété trouvée</h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Aucune propriété ne correspond à votre recherche"
                  : "Aucune propriété avec contrat actif disponible"
                }
              </p>
              {!searchTerm && (
                <Button className="mt-4 bg-[#D4841A] hover:bg-[#B8741A]" asChild>
                  <Link href="/contrats/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer un Contrat
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card key={property.propriete_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-gray-100">
                  {property.photo_cover ? (
                    <Image
                      src={property.photo_cover}
                      alt={property.propriete_nom}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Building2 className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    {property.disponible_aujourdhui ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Disponible
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Occupé
                      </Badge>
                    )}
                  </div>
                  
                  {/* Price Badge */}
                  <div className="absolute bottom-3 left-3">
                    <Badge className="bg-white/90 text-gray-800 border-white">
                      <Euro className="w-3 h-3 mr-1" />
                      {Math.round(property.prix_nuit_defaut)}€/nuit
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-1">
                        {property.propriete_nom}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {property.ville}, {property.pays}
                      </CardDescription>
                    </div>
                    {getPropertyTypeBadge(property.propriete_type)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Property Details */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Square className="w-4 h-4 mr-1" />
                      {property.superficie_m2}m²
                    </div>
                    <div className="flex items-center">
                      <Bed className="w-4 h-4 mr-1" />
                      {property.nb_pieces} pièces
                    </div>
                    {property.nb_reservations_actives > 0 && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {property.nb_reservations_actives}
                      </div>
                    )}
                  </div>
                  
                  {/* Contract Info */}
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Contrat {property.type_contrat}</span>
                      <Badge variant="outline" className="text-xs">
                        {property.commission_pourcentage}% commission
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Organisation: {property.organisation_nom}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2 pt-3">
                    <Button 
                      size="sm" 
                      className="flex-1 bg-[#D4841A] hover:bg-[#B8741A]"
                      asChild
                    >
                      <Link href={`/reservations/property/${property.propriete_id}/calendar`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Calendrier
                      </Link>
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={`/reservations/property/${property.propriete_id}/list`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedAppShell>
  );
}