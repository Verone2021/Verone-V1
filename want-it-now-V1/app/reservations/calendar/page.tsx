'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Lock,
  Unlock,
  Eye,
  Building2,
  Home,
  Users,
  Ban,
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isBefore, isAfter, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Types pour le calendrier
type CalendarEvent = {
  id: string;
  type: 'reservation' | 'blocked';
  startDate: Date;
  endDate: Date;
  title: string;
  guestName?: string;
  platform?: string;
  status?: string;
  color: string;
};

type PropertyWithUnits = {
  id: string;
  nom: string;
  type: string;
  unites?: Array<{
    id: string;
    nom: string;
    type: string;
  }>;
};

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');

  // Charger les propriétés
  useEffect(() => {
    loadProperties();
  }, []);

  // Charger les événements quand propriété/unité change
  useEffect(() => {
    if (selectedProperty !== 'all') {
      loadEvents();
    }
  }, [selectedProperty, selectedUnit, currentMonth]);

  const loadProperties = async () => {
    // Simuler le chargement des propriétés
    setProperties([
      {
        id: 'prop-1',
        nom: 'Villa Nice - Oceanview First Line',
        type: 'villa',
        unites: [
          { id: 'unit-1', nom: 'Studio RDC', type: 'studio' },
          { id: 'unit-2', nom: 'Appartement T2', type: 'appartement' },
          { id: 'unit-3', nom: 'Suite Penthouse', type: 'suite' }
        ]
      },
      {
        id: 'prop-2',
        nom: 'Appartement Paris - Tour Eiffel',
        type: 'appartement'
      },
      {
        id: 'prop-3',
        nom: 'Chalet Chamonix - Mont Blanc',
        type: 'chalet'
      }
    ]);
  };

  const loadEvents = async () => {
    setLoading(true);
    // Simuler le chargement des événements
    setTimeout(() => {
      const mockEvents: CalendarEvent[] = [
        {
          id: '1',
          type: 'reservation',
          startDate: new Date(2025, currentMonth.getMonth(), 5),
          endDate: new Date(2025, currentMonth.getMonth(), 10),
          title: 'Marie Dupont',
          guestName: 'Marie Dupont',
          platform: 'airbnb',
          status: 'confirmee',
          color: 'bg-green-500'
        },
        {
          id: '2',
          type: 'reservation',
          startDate: new Date(2025, currentMonth.getMonth(), 15),
          endDate: new Date(2025, currentMonth.getMonth(), 18),
          title: 'Jean Martin',
          guestName: 'Jean Martin',
          platform: 'booking',
          status: 'en_attente',
          color: 'bg-yellow-500'
        },
        {
          id: '3',
          type: 'blocked',
          startDate: new Date(2025, currentMonth.getMonth(), 20),
          endDate: new Date(2025, currentMonth.getMonth(), 22),
          title: 'Maintenance',
          color: 'bg-gray-500'
        }
      ];
      setEvents(mockEvents);
      setLoading(false);
    }, 500);
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return (isSameDay(day, eventStart) || isSameDay(day, eventEnd) || 
              (isAfter(day, eventStart) && isBefore(day, eventEnd)));
    });
  };

  const handleDayClick = (day: Date) => {
    const dayEvents = getEventsForDay(day);
    
    // Si jour a des réservations, ne pas permettre la sélection
    if (dayEvents.some(e => e.type === 'reservation')) {
      return;
    }

    // Toggle sélection
    const isSelected = selectedDates.some(d => isSameDay(d, day));
    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => !isSameDay(d, day)));
    } else {
      setSelectedDates([...selectedDates, day]);
    }
  };

  const handleBlockDates = async () => {
    if (selectedDates.length === 0) return;

    // Ici, appeler l'action serveur pour bloquer les dates
    console.log('Blocking dates:', selectedDates, 'Reason:', blockReason);
    
    // Ajouter les dates bloquées aux événements
    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const newBlockedEvent: CalendarEvent = {
      id: `blocked-${Date.now()}`,
      type: 'blocked',
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1],
      title: blockReason || 'Indisponible',
      color: 'bg-gray-500'
    };
    
    setEvents([...events, newBlockedEvent]);
    setSelectedDates([]);
    setBlockReason('');
    setBlockDialogOpen(false);
  };

  const handleUnblockEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendrier des Disponibilités</h1>
          <p className="text-gray-600 mt-1">
            Gérez les disponibilités et blocages de vos propriétés
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/reservations">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Retour
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

      {/* Filtres et contrôles */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-center space-x-4 flex-1">
              {/* Sélection propriété */}
              <div className="w-64">
                <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                  <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                    <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Sélectionner une propriété" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les propriétés</SelectItem>
                    {properties.map(prop => (
                      <SelectItem key={prop.id} value={prop.id}>
                        {prop.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sélection unité si propriété a des unités */}
              {selectedPropertyData?.unites && selectedPropertyData.unites.length > 0 && (
                <div className="w-48">
                  <Select value={selectedUnit || ''} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                      <Home className="w-4 h-4 mr-2 text-gray-400" />
                      <SelectValue placeholder="Toutes les unités" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les unités</SelectItem>
                      {selectedPropertyData.unites.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {selectedDates.length > 0 && (
                <>
                  <Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
                    {selectedDates.length} jour(s) sélectionné(s)
                  </Badge>
                  
                  <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                        <Ban className="w-4 h-4 mr-2" />
                        Bloquer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bloquer les dates sélectionnées</DialogTitle>
                        <DialogDescription>
                          {selectedDates.length} jour(s) seront marqués comme indisponibles
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="reason">Raison du blocage (optionnel)</Label>
                          <Input
                            id="reason"
                            value={blockReason}
                            onChange={(e) => setBlockReason(e.target.value)}
                            placeholder="Ex: Maintenance, Rénovation, Usage personnel..."
                            className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                          />
                        </div>
                        
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-700">
                              Les dates bloquées ne pourront pas recevoir de nouvelles réservations
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button 
                          onClick={handleBlockDates}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Confirmer le blocage
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setSelectedDates([])}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}

              <div className="flex items-center border rounded-lg">
                <Button
                  size="sm"
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  className={viewMode === 'month' ? 'bg-[#D4841A] hover:bg-[#B8741A]' : ''}
                  onClick={() => setViewMode('month')}
                >
                  <CalendarIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  className={viewMode === 'list' ? 'bg-[#D4841A] hover:bg-[#B8741A]' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendrier */}
      {selectedProperty !== 'all' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <h2 className="text-xl font-semibold capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </h2>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                >
                  Aujourd'hui
                </Button>
              </div>

              {/* Légende */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Confirmée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">En attente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span className="text-sm text-gray-600">Bloquée</span>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {viewMode === 'month' ? (
              <div>
                {/* En-têtes des jours */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grille du calendrier */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Jours vides au début */}
                  {Array.from({ length: (new Date(startOfMonth(currentMonth)).getDay() + 6) % 7 }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-24 bg-gray-50 rounded-lg"></div>
                  ))}
                  
                  {/* Jours du mois */}
                  {getDaysInMonth().map(day => {
                    const dayEvents = getEventsForDay(day);
                    const isSelected = selectedDates.some(d => isSameDay(d, day));
                    const hasReservation = dayEvents.some(e => e.type === 'reservation');
                    const isBlocked = dayEvents.some(e => e.type === 'blocked');
                    
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => !hasReservation && handleDayClick(day)}
                        className={cn(
                          "h-24 p-2 border rounded-lg transition-all cursor-pointer",
                          isToday(day) && "border-[#D4841A] border-2",
                          isSelected && "bg-[#D4841A]/10 border-[#D4841A]",
                          hasReservation && "cursor-not-allowed",
                          !hasReservation && !isSelected && "hover:bg-gray-50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-sm font-medium",
                            isToday(day) && "text-[#D4841A]",
                            !isSameMonth(day, currentMonth) && "text-gray-400"
                          )}>
                            {format(day, 'd')}
                          </span>
                          
                          {isBlocked && !hasReservation && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const blockedEvent = dayEvents.find(e => e.type === 'blocked');
                                if (blockedEvent) handleUnblockEvent(blockedEvent.id);
                              }}
                            >
                              <Unlock className="w-3 h-3 text-gray-500" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map(event => (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs p-1 rounded truncate",
                                event.type === 'reservation' ? event.color : 'bg-gray-200',
                                event.type === 'reservation' && 'text-white'
                              )}
                            >
                              {event.title}
                            </div>
                          ))}
                          
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{dayEvents.length - 2} plus
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // Vue liste
              <div className="space-y-4">
                {events.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={cn("w-2 h-12 rounded", event.color)}></div>
                      
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-gray-500">
                          {format(event.startDate, 'dd MMM', { locale: fr })} - {format(event.endDate, 'dd MMM yyyy', { locale: fr })}
                        </div>
                        {event.platform && (
                          <Badge variant="outline" className="mt-1">
                            {event.platform}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {event.type === 'blocked' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblockEvent(event.id)}
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Débloquer
                        </Button>
                      )}
                      
                      {event.type === 'reservation' && (
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/reservations/${event.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Détails
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {events.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Aucun événement pour cette période</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Sélectionnez une propriété pour voir le calendrier</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Cliquez sur un jour pour le sélectionner/désélectionner</p>
              <p>• Sélectionnez plusieurs jours puis cliquez sur "Bloquer" pour les rendre indisponibles</p>
              <p>• Les jours avec des réservations ne peuvent pas être bloqués</p>
              <p>• Cliquez sur l'icône cadenas pour débloquer un jour</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}