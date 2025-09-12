'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Euro,
  Lock,
  Unlock,
  Save,
  X,
  Home,
  AlertCircle,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { getCalendarByProperty, updatePricing, blockDates, unblockDates } from '@/actions/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type CalendarDay = {
  date: string;
  dayOfWeek: number;
  isWeekend: boolean;
  status: 'disponible' | 'reserve' | 'bloque' | 'maintenance' | 'indisponible';
  prix: number;
  prixPeriode?: any;
  reservations?: any[];
  sejour_minimum: number;
  couleur?: string;
};

type PropertyInfo = {
  propriete_nom: string;
  ville: string;
  pays: string;
  prix_nuit_defaut: number;
};

export default function PropertyCalendarPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  
  // Modals
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  
  // Form states
  const [priceForm, setPriceForm] = useState({
    prix_nuit: 100,
    prix_weekend: null as number | null,
    prix_semaine: null as number | null,
    prix_mois: null as number | null,
    sejour_minimum: 1,
    nom_periode: '',
    couleur_calendrier: '#D4841A'
  });
  
  const [blockForm, setBlockForm] = useState({
    raison: '',
    statut: 'bloque' as 'bloque' | 'maintenance' | 'indisponible'
  });

  // Load calendar data
  const loadCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCalendarByProperty(
        propertyId,
        currentMonth.getMonth(),
        currentMonth.getFullYear()
      );
      
      if (result.success && result.data) {
        setCalendarDays(result.data);
        
        // Extract property info from first day if available
        if (result.data.length > 0 && !propertyInfo) {
          // In a real app, we'd get this from a separate API call
          setPropertyInfo({
            propriete_nom: 'Propriété',
            ville: 'Ville',
            pays: 'France',
            prix_nuit_defaut: result.data[0].prix || 100
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement calendrier:', error);
      toast.error('Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  }, [propertyId, currentMonth, propertyInfo]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  // Handle date selection
  const handleDateClick = (date: Date) => {
    if (isDragging) return;
    
    const isSelected = selectedDates.some(d => isSameDay(d, date));
    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleDragStart = (date: Date) => {
    setIsDragging(true);
    setDragStart(date);
    setSelectedDates([date]);
  };

  const handleDragEnter = (date: Date) => {
    if (!isDragging || !dragStart) return;
    
    const start = dragStart < date ? dragStart : date;
    const end = dragStart < date ? date : dragStart;
    
    const dates = eachDayOfInterval({ start, end });
    setSelectedDates(dates);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Update pricing for selected dates
  const handleUpdatePricing = async () => {
    if (selectedDates.length === 0) {
      toast.error('Veuillez sélectionner au moins une date');
      return;
    }

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
    const dateDebut = format(sortedDates[0], 'yyyy-MM-dd');
    const dateFin = format(sortedDates[sortedDates.length - 1], 'yyyy-MM-dd');

    try {
      const result = await updatePricing({
        propriete_id: propertyId,
        unite_id: null,
        date_debut: dateDebut,
        date_fin: dateFin,
        ...priceForm
      });

      if (result.success) {
        toast.success('Prix mis à jour avec succès');
        setPricingModalOpen(false);
        setSelectedDates([]);
        loadCalendar();
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour des prix');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la mise à jour des prix');
    }
  };

  // Block/unblock dates
  const handleBlockDates = async () => {
    if (selectedDates.length === 0) {
      toast.error('Veuillez sélectionner au moins une date');
      return;
    }

    const dates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));

    try {
      const result = await blockDates({
        propriete_id: propertyId,
        unite_id: null,
        dates,
        raison: blockForm.raison,
        statut: blockForm.statut
      });

      if (result.success) {
        toast.success('Dates bloquées avec succès');
        setBlockModalOpen(false);
        setSelectedDates([]);
        loadCalendar();
      } else {
        toast.error(result.error || 'Erreur lors du blocage des dates');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du blocage des dates');
    }
  };

  const handleUnblockDates = async () => {
    if (selectedDates.length === 0) {
      toast.error('Veuillez sélectionner au moins une date');
      return;
    }

    const dates = selectedDates.map(d => format(d, 'yyyy-MM-dd'));

    try {
      const result = await unblockDates(propertyId, dates);

      if (result.success) {
        toast.success('Dates débloquées avec succès');
        setSelectedDates([]);
        loadCalendar();
      } else {
        toast.error(result.error || 'Erreur lors du déblocage des dates');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du déblocage des dates');
    }
  };

  // Calendar rendering
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Add padding days for calendar grid
    const startPadding = monthStart.getDay();
    const paddedDays = [
      ...Array(startPadding).fill(null),
      ...days
    ];

    return (
      <div className="grid grid-cols-7 gap-1" onMouseUp={handleDragEnd}>
        {/* Headers */}
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
            {day}
          </div>
        ))}
        
        {/* Days */}
        {paddedDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-24" />;
          }

          const dayData = calendarDays.find(d => d.date === format(day, 'yyyy-MM-dd'));
          const isSelected = selectedDates.some(d => isSameDay(d, day));
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={format(day, 'yyyy-MM-dd')}
              className={cn(
                'h-24 border rounded-lg p-2 cursor-pointer transition-all select-none',
                'hover:shadow-md hover:border-[#D4841A]',
                {
                  'bg-white': dayData?.status === 'disponible',
                  'bg-red-50 border-red-200': dayData?.status === 'reserve',
                  'bg-gray-100 border-gray-300': dayData?.status === 'bloque',
                  'bg-orange-50 border-orange-200': dayData?.status === 'maintenance',
                  'bg-[#D4841A]/10 border-[#D4841A] shadow-md': isSelected,
                  'ring-2 ring-blue-500': isToday
                }
              )}
              onMouseDown={() => handleDragStart(day)}
              onMouseEnter={() => handleDragEnter(day)}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex flex-col h-full justify-between">
                <div className="text-sm font-medium">
                  {format(day, 'd')}
                </div>
                
                {dayData && (
                  <>
                    <div className="text-xs text-gray-600">
                      {dayData.status === 'reserve' && (
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs px-1 py-0">
                          Réservé
                        </Badge>
                      )}
                      {dayData.status === 'bloque' && (
                        <Lock className="w-3 h-3 text-gray-500" />
                      )}
                      {dayData.status === 'maintenance' && (
                        <AlertCircle className="w-3 h-3 text-orange-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {dayData.prix}€
                      </span>
                      {dayData.isWeekend && (
                        <span className="text-xs text-gray-500">WE</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
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
              Calendrier - {propertyInfo?.propriete_nom || 'Propriété'}
            </h1>
            <p className="text-gray-600">
              {propertyInfo?.ville}, {propertyInfo?.pays} • Prix par défaut: {propertyInfo?.prix_nuit_defaut}€/nuit
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import iCal
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {format(currentMonth, 'MMMM yyyy', { locale: fr })}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedDates.length > 0 && (
                <>
                  <Badge className="bg-[#D4841A]/10 text-[#D4841A] border-[#D4841A]/20">
                    {selectedDates.length} jour(s) sélectionné(s)
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedDates([])}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#D4841A] hover:bg-[#B8741A]"
                    onClick={() => setPricingModalOpen(true)}
                  >
                    <Euro className="w-4 h-4 mr-2" />
                    Modifier prix
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setBlockModalOpen(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Bloquer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-200 text-green-600 hover:bg-green-50"
                    onClick={handleUnblockDates}
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Débloquer
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderCalendar()}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-around">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border rounded"></div>
              <span className="text-sm text-gray-600">Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-50 border-red-200 border rounded"></div>
              <span className="text-sm text-gray-600">Réservé</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border-gray-300 border rounded"></div>
              <span className="text-sm text-gray-600">Bloqué</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-50 border-orange-200 border rounded"></div>
              <span className="text-sm text-gray-600">Maintenance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-[#D4841A]/10 border-[#D4841A] border rounded"></div>
              <span className="text-sm text-gray-600">Sélectionné</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pricing Modal */}
      <Dialog open={pricingModalOpen} onOpenChange={setPricingModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier les prix</DialogTitle>
            <DialogDescription>
              Définir les prix pour les {selectedDates.length} jour(s) sélectionné(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prix_nuit">Prix par nuit *</Label>
                <Input
                  id="prix_nuit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceForm.prix_nuit}
                  onChange={(e) => setPriceForm({...priceForm, prix_nuit: parseFloat(e.target.value)})}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prix_weekend">Prix weekend</Label>
                <Input
                  id="prix_weekend"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceForm.prix_weekend || ''}
                  onChange={(e) => setPriceForm({...priceForm, prix_weekend: e.target.value ? parseFloat(e.target.value) : null})}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                  placeholder="Optionnel"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prix_semaine">Prix semaine (7+ nuits)</Label>
                <Input
                  id="prix_semaine"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceForm.prix_semaine || ''}
                  onChange={(e) => setPriceForm({...priceForm, prix_semaine: e.target.value ? parseFloat(e.target.value) : null})}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                  placeholder="Optionnel"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prix_mois">Prix mois (28+ nuits)</Label>
                <Input
                  id="prix_mois"
                  type="number"
                  min="0"
                  step="0.01"
                  value={priceForm.prix_mois || ''}
                  onChange={(e) => setPriceForm({...priceForm, prix_mois: e.target.value ? parseFloat(e.target.value) : null})}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                  placeholder="Optionnel"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sejour_minimum">Séjour minimum (nuits)</Label>
              <Input
                id="sejour_minimum"
                type="number"
                min="1"
                value={priceForm.sejour_minimum}
                onChange={(e) => setPriceForm({...priceForm, sejour_minimum: parseInt(e.target.value)})}
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nom_periode">Nom de la période</Label>
              <Input
                id="nom_periode"
                value={priceForm.nom_periode}
                onChange={(e) => setPriceForm({...priceForm, nom_periode: e.target.value})}
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                placeholder="Ex: Haute saison, Vacances Noël..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPricingModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-[#D4841A] hover:bg-[#B8741A]"
              onClick={handleUpdatePricing}
            >
              <Save className="w-4 h-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Modal */}
      <Dialog open={blockModalOpen} onOpenChange={setBlockModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Bloquer les dates</DialogTitle>
            <DialogDescription>
              Bloquer les {selectedDates.length} jour(s) sélectionné(s)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statut">Type de blocage</Label>
              <Select
                value={blockForm.statut}
                onValueChange={(value) => setBlockForm({...blockForm, statut: value as any})}
              >
                <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bloque">Bloqué</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="indisponible">Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="raison">Raison (optionnel)</Label>
              <Input
                id="raison"
                value={blockForm.raison}
                onChange={(e) => setBlockForm({...blockForm, raison: e.target.value})}
                className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20"
                placeholder="Ex: Travaux, Usage personnel..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleBlockDates}
            >
              <Lock className="w-4 h-4 mr-2" />
              Bloquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}