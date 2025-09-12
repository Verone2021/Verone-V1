'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  ChevronLeft,
  Edit,
  Trash2,
  User,
  Building2,
  Home,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Euro,
  CalendarDays,
  Users,
  MessageSquare,
  MapPin,
  ExternalLink,
  Star,
  Printer
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type ReservationDetail = {
  id: string;
  code_confirmation: string;
  statut: 'confirmee' | 'en_attente' | 'en_cours' | 'completee' | 'annulee';
  source: 'airbnb' | 'booking' | 'direct' | 'autre';
  
  // Dates
  date_debut: string;
  date_fin: string;
  nb_nuits: number;
  created_at: string;
  
  // Voyageur
  voyageur: {
    id: string;
    nom: string;
    email?: string;
    telephone?: string;
    nb_adultes: number;
    nb_enfants: number;
    nb_bebes: number;
    nombre_reservations: number;
    total_depense: number;
  };
  
  // Propriété/Unité
  propriete?: {
    id: string;
    nom: string;
    adresse: string;
    ville: string;
    code_postal: string;
  };
  unite?: {
    id: string;
    nom: string;
    type: string;
  };
  
  // Financier
  montant_total: number;
  montant_nuit: number;
  frais_service: number;
  frais_menage: number;
  taxes: number;
  commission_plateforme: number;
  montant_net: number;
  
  // Contrat
  contrat?: {
    id: string;
    type: string;
    commission_percentage?: number;
  };
  
  // Notes
  notes_internes?: string;
  instructions_checkin?: string;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'confirmee':
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Confirmée
        </Badge>
      );
    case 'en_attente':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          En attente
        </Badge>
      );
    case 'en_cours':
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Home className="w-3 h-3 mr-1" />
          En cours
        </Badge>
      );
    case 'completee':
      return (
        <Badge className="bg-gray-100 text-gray-800 border-gray-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Complétée
        </Badge>
      );
    case 'annulee':
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Annulée
        </Badge>
      );
    default:
      return null;
  }
};

const getSourceBadge = (source: string) => {
  switch (source) {
    case 'airbnb':
      return <Badge className="bg-[#FF5A5F] text-white">Airbnb</Badge>;
    case 'booking':
      return <Badge className="bg-[#003580] text-white">Booking.com</Badge>;
    case 'direct':
      return <Badge className="bg-[#D4841A] text-white">Direct</Badge>;
    default:
      return <Badge variant="outline">Autre</Badge>;
  }
};

export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadReservation();
  }, [params.id]);

  const loadReservation = async () => {
    // Simuler le chargement des données
    setTimeout(() => {
      setReservation({
        id: params.id as string,
        code_confirmation: 'HM8X9RQZY2',
        statut: 'confirmee',
        source: 'airbnb',
        date_debut: '2025-06-15',
        date_fin: '2025-06-22',
        nb_nuits: 7,
        created_at: '2025-01-08T10:30:00',
        voyageur: {
          id: 'voy-001',
          nom: 'Marie Dupont',
          email: 'marie.dupont@email.com',
          telephone: '+33 6 12 34 56 78',
          nb_adultes: 2,
          nb_enfants: 1,
          nb_bebes: 0,
          nombre_reservations: 3,
          total_depense: 4500
        },
        propriete: {
          id: 'prop-001',
          nom: 'Villa Nice - Oceanview First Line',
          adresse: '123 Promenade des Anglais',
          ville: 'Nice',
          code_postal: '06000'
        },
        montant_total: 2100,
        montant_nuit: 300,
        frais_service: 100,
        frais_menage: 80,
        taxes: 120,
        commission_plateforme: 315,
        montant_net: 1785,
        contrat: {
          id: 'contrat-001',
          type: 'Variable',
          commission_percentage: 10
        },
        notes_internes: 'Client régulier, très soigneux. Demande spéciale pour lit bébé.',
        instructions_checkin: 'Code boîte à clés: 4729. Parking place n°12.'
      });
      setLoading(false);
    }, 500);
  };

  const handleCancelReservation = async () => {
    console.log('Annulation de la réservation:', cancelReason);
    setCancelDialogOpen(false);
    // Ici, appeler l'action serveur pour annuler
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Export PDF ou CSV
    console.log('Export de la réservation');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Réservation introuvable</h2>
            <p className="text-gray-600 mb-4">La réservation demandée n'existe pas</p>
            <Button asChild>
              <Link href="/reservations">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour aux réservations
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reservations">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Réservation #{reservation.code_confirmation}
            </h1>
            <div className="flex items-center space-x-3 mt-2">
              {getStatusBadge(reservation.statut)}
              {getSourceBadge(reservation.source)}
              <span className="text-gray-500">
                Créée le {format(new Date(reservation.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <Link href={`/reservations/${reservation.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Link>
          </Button>
          
          {reservation.statut !== 'annulee' && reservation.statut !== 'completee' && (
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Info principale */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails séjour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="w-5 h-5 text-[#D4841A]" />
                <span>Détails du séjour</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Arrivée</Label>
                  <p className="font-semibold text-lg">
                    {format(new Date(reservation.date_debut), 'EEEE dd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-500">Check-in : 15h00</p>
                </div>
                
                <div>
                  <Label className="text-gray-600">Départ</Label>
                  <p className="font-semibold text-lg">
                    {format(new Date(reservation.date_fin), 'EEEE dd MMMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-sm text-gray-500">Check-out : 11h00</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-600">Durée du séjour</Label>
                    <p className="font-semibold">{reservation.nb_nuits} nuits</p>
                  </div>
                  
                  <div>
                    <Label className="text-gray-600">Nombre de voyageurs</Label>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {reservation.voyageur.nb_adultes} adulte(s)
                      </Badge>
                      {reservation.voyageur.nb_enfants > 0 && (
                        <Badge variant="outline">
                          {reservation.voyageur.nb_enfants} enfant(s)
                        </Badge>
                      )}
                      {reservation.voyageur.nb_bebes > 0 && (
                        <Badge variant="outline">
                          {reservation.voyageur.nb_bebes} bébé(s)
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Instructions check-in */}
              {reservation.instructions_checkin && (
                <div className="pt-4 border-t">
                  <Label className="text-gray-600 mb-2">Instructions check-in</Label>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">{reservation.instructions_checkin}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Propriété */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-[#D4841A]" />
                <span>Propriété</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{reservation.propriete?.nom}</h3>
                  <div className="flex items-center space-x-2 text-gray-600 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{reservation.propriete?.adresse}</span>
                  </div>
                  <p className="text-gray-600">
                    {reservation.propriete?.code_postal} {reservation.propriete?.ville}
                  </p>
                </div>
                
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/proprietes/${reservation.propriete?.id}`}>
                    Voir la propriété
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
              
              {reservation.unite && (
                <div className="pt-4 border-t">
                  <Label className="text-gray-600">Unité réservée</Label>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Home className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{reservation.unite.nom}</span>
                      <Badge variant="outline">{reservation.unite.type}</Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {reservation.contrat && (
                <div className="pt-4 border-t">
                  <Label className="text-gray-600">Contrat associé</Label>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        Contrat {reservation.contrat.type}
                      </Badge>
                      {reservation.contrat.commission_percentage && (
                        <span className="ml-2 text-sm text-gray-600">
                          Commission : {reservation.contrat.commission_percentage}%
                        </span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/contrats/${reservation.contrat.id}`}>
                        Voir le contrat
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes internes */}
          {reservation.notes_internes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5 text-[#D4841A]" />
                  <span>Notes internes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{reservation.notes_internes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne droite - 1/3 */}
        <div className="space-y-6">
          {/* Voyageur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-[#D4841A]" />
                <span>Voyageur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{reservation.voyageur.nom}</h3>
                
                {reservation.voyageur.email && (
                  <div className="flex items-center space-x-2 text-gray-600 mt-2">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${reservation.voyageur.email}`} className="hover:text-[#D4841A]">
                      {reservation.voyageur.email}
                    </a>
                  </div>
                )}
                
                {reservation.voyageur.telephone && (
                  <div className="flex items-center space-x-2 text-gray-600 mt-1">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${reservation.voyageur.telephone}`} className="hover:text-[#D4841A]">
                      {reservation.voyageur.telephone}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Réservations totales</span>
                  <Badge variant="outline">{reservation.voyageur.nombre_reservations}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Dépense totale</span>
                  <span className="font-semibold">{reservation.voyageur.total_depense}€</span>
                </div>
                
                {reservation.voyageur.nombre_reservations >= 3 && (
                  <div className="pt-2">
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 w-full justify-center">
                      <Star className="w-3 h-3 mr-1" />
                      Client fidèle
                    </Badge>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/voyageurs/${reservation.voyageur.id}`}>
                    Voir le profil complet
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Détails financiers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Euro className="w-5 h-5 text-[#D4841A]" />
                <span>Détails financiers</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{reservation.nb_nuits} nuits × {reservation.montant_nuit}€</span>
                  <span>{reservation.nb_nuits * reservation.montant_nuit}€</span>
                </div>
                
                {reservation.frais_service > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Frais de service</span>
                    <span>{reservation.frais_service}€</span>
                  </div>
                )}
                
                {reservation.frais_menage > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Frais de ménage</span>
                    <span>{reservation.frais_menage}€</span>
                  </div>
                )}
                
                {reservation.taxes > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Taxes</span>
                    <span>{reservation.taxes}€</span>
                  </div>
                )}
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between font-semibold">
                  <span>Montant total</span>
                  <span className="text-lg">{reservation.montant_total}€</span>
                </div>
              </div>
              
              <div className="pt-3 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Commission plateforme</span>
                  <span className="text-red-600">-{reservation.commission_plateforme}€</span>
                </div>
                
                <div className="flex items-center justify-between font-semibold">
                  <span>Montant net</span>
                  <span className="text-lg text-[#2D5A27]">{reservation.montant_net}€</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog d'annulation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Le voyageur sera notifié de l'annulation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="cancel-reason">Raison de l'annulation</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Expliquez la raison de l'annulation..."
              className="mt-2"
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Conserver la réservation
            </Button>
            <Button 
              onClick={handleCancelReservation}
              className="bg-red-600 hover:bg-red-700"
              disabled={!cancelReason.trim()}
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}