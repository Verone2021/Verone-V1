'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ChevronLeft,
  Plus,
  Search,
  Calendar,
  User,
  Euro,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { getReservations } from '@/actions/reservations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type Reservation = {
  id: string;
  code_confirmation: string;
  voyageur_nom: string;
  voyageur_email?: string;
  voyageur_telephone?: string;
  date_arrivee: string;
  date_depart: string;
  nombre_adultes: number;
  nombre_enfants: number;
  nombre_bebes: number;
  nombre_nuits: number;
  statut: string;
  source_reservation: string;
  total_hote_net: number;
  commission_montant: number;
  created_at: string;
};

export default function PropertyReservationsListPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadReservations();
  }, [propertyId]);

  useEffect(() => {
    filterReservations();
  }, [searchTerm, statusFilter, reservations]);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const result = await getReservations({
        propriete_id: propertyId
      });
      
      if (result.success && result.data) {
        setReservations(result.data);
        setFilteredReservations(result.data);
      }
    } catch (error) {
      console.error('Erreur chargement réservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.voyageur_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code_confirmation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.voyageur_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.statut === statusFilter);
    }
    
    setFilteredReservations(filtered);
  };

  const getStatusBadge = (statut: string) => {
    switch(statut) {
      case 'confirmee':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Confirmée
          </Badge>
        );
      case 'en_cours':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            En cours
          </Badge>
        );
      case 'annulee':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Annulée
          </Badge>
        );
      case 'completee':
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Complétée
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {statut}
          </Badge>
        );
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      'airbnb': 'bg-red-100 text-red-800 border-red-200',
      'booking': 'bg-blue-100 text-blue-800 border-blue-200',
      'direct': 'bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20',
      'vrbo': 'bg-purple-100 text-purple-800 border-purple-200',
      'expedia': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    
    return (
      <Badge className={colors[source] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {source.charAt(0).toUpperCase() + source.slice(1)}
      </Badge>
    );
  };

  // Calculate stats
  const stats = {
    total: filteredReservations.length,
    confirmees: filteredReservations.filter(r => r.statut === 'confirmee').length,
    enCours: filteredReservations.filter(r => r.statut === 'en_cours').length,
    revenue: filteredReservations.reduce((sum, r) => sum + (r.total_hote_net || 0), 0)
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/reservations">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Réservations - Propriété
            </h1>
            <p className="text-gray-600">
              Gestion des réservations pour cette propriété
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Link href={`/reservations/${propertyId}/calendar`}>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Calendrier
            </Button>
          </Link>
          <Link href={`/reservations/new?property=${propertyId}`}>
            <Button size="sm" className="bg-[#D4841A] hover:bg-[#B8741A]">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle réservation
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total réservations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-[#D4841A]/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#D4841A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmées</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.confirmees}</p>
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
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.enCours}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus totaux</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{Math.round(stats.revenue)}€</p>
              </div>
              <div className="w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                <Euro className="w-6 h-6 text-[#2D5A27]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Rechercher par nom, email ou code confirmation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 border rounded-lg bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
            >
              <option value="all">Tous les statuts</option>
              <option value="confirmee">Confirmées</option>
              <option value="en_cours">En cours</option>
              <option value="completee">Complétées</option>
              <option value="annulee">Annulées</option>
            </select>
            
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredReservations.length === 0 ? (
            <div className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">Aucune réservation trouvée</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? "Aucune réservation ne correspond à vos critères"
                  : "Aucune réservation pour cette propriété"
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href={`/reservations/new?property=${propertyId}`}>
                  <Button className="mt-4 bg-[#D4841A] hover:bg-[#B8741A]">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer une réservation
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Voyageur</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Voyageurs</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-mono text-sm">
                      {reservation.code_confirmation}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.voyageur_nom}</div>
                        {reservation.voyageur_email && (
                          <div className="text-sm text-gray-600">{reservation.voyageur_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(reservation.date_arrivee), 'dd MMM', { locale: fr })}</div>
                        <div className="text-gray-600">
                          → {format(new Date(reservation.date_depart), 'dd MMM', { locale: fr })}
                        </div>
                        <div className="text-gray-500">{reservation.nombre_nuits} nuits</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <User className="w-3 h-3" />
                        <span>{reservation.nombre_adultes}</span>
                        {reservation.nombre_enfants > 0 && (
                          <>
                            <span>+</span>
                            <span>{reservation.nombre_enfants}e</span>
                          </>
                        )}
                        {reservation.nombre_bebes > 0 && (
                          <>
                            <span>+</span>
                            <span>{reservation.nombre_bebes}b</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSourceBadge(reservation.source_reservation)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(reservation.statut)}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {Math.round(reservation.total_hote_net)}€
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end space-x-1">
                        <Button size="sm" variant="ghost" className="hover:bg-blue-100">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-[#D4841A]/10">
                          <Edit className="w-4 h-4 text-[#D4841A]" />
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-red-100">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}