'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  User,
  Phone,
  Mail,
  Home,
  CreditCard,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Plus,
  Euro
} from 'lucide-react';
import Link from 'next/link';
import { createReservation, checkAvailability } from '@/actions/reservations';
import { SourceReservation } from '@/types/reservations';

export default function NewReservationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'unavailable' | null>(null);
  const [step, setStep] = useState(1); // 1: Propriété, 2: Voyageur, 3: Paiement
  
  // Form data - Removed contrat_id as contracts are linked to properties
  const [formData, setFormData] = useState({
    propriete_id: '',
    unite_id: '',
    date_arrivee: '',
    date_depart: '',
    voyageur_nom: '',
    voyageur_prenom: '',
    voyageur_email: '',
    voyageur_telephone: '',
    voyageur_pays: 'FR',
    nombre_adultes: 1,
    nombre_enfants: 0,
    nombre_bebes: 0,
    prix_nuit: 0,
    frais_menage: 0,
    source_reservation: 'direct' as SourceReservation,
    notes_internes: '',
    special_requests: ''
  });

  // Calculs automatiques
  const nombreNuits = formData.date_arrivee && formData.date_depart
    ? Math.ceil((new Date(formData.date_depart).getTime() - new Date(formData.date_arrivee).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const sousTotal = formData.prix_nuit * nombreNuits;
  const totalVoyageur = sousTotal + formData.frais_menage;

  // Vérifier disponibilité quand les dates changent
  useEffect(() => {
    if (formData.date_arrivee && formData.date_depart && (formData.propriete_id || formData.unite_id)) {
      checkDatesAvailability();
    }
  }, [formData.date_arrivee, formData.date_depart, formData.propriete_id, formData.unite_id]);

  const checkDatesAvailability = async () => {
    setChecking(true);
    setAvailabilityStatus(null);
    
    try {
      const result = await checkAvailability(
        formData.propriete_id || null,
        formData.unite_id || null,
        formData.date_arrivee,
        formData.date_depart
      );
      
      setAvailabilityStatus(result.available ? 'available' : 'unavailable');
    } catch (error) {
      console.error('Erreur vérification disponibilité:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availabilityStatus !== 'available') {
      alert('Les dates sélectionnées ne sont pas disponibles');
      return;
    }
    
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });
      
      const result = await createReservation(formDataToSend);
      
      if (result.success) {
        router.push('/reservations');
      } else {
        alert(`Erreur: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur création réservation:', error);
      alert('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return (formData.propriete_id || formData.unite_id) && 
               formData.date_arrivee && 
               formData.date_depart &&
               availabilityStatus === 'available';
      case 2:
        return formData.voyageur_nom && 
               (formData.voyageur_telephone || formData.voyageur_email);
      case 3:
        return formData.prix_nuit > 0;
      default:
        return false;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Réservation</h1>
          <p className="text-gray-600 mt-1">
            Créer une réservation manuelle (direct, téléphone)
          </p>
        </div>
        
        <Button variant="outline" size="sm" asChild>
          <Link href="/reservations">
            Annuler
          </Link>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-[#D4841A]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 1 ? 'bg-[#D4841A] text-white' : 'bg-gray-200'
          }`}>
            <Home className="w-4 h-4" />
          </div>
          <span className="font-medium">Propriété</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step >= 2 ? 'bg-[#D4841A]' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-[#D4841A]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 2 ? 'bg-[#D4841A] text-white' : 'bg-gray-200'
          }`}>
            <User className="w-4 h-4" />
          </div>
          <span className="font-medium">Voyageur</span>
        </div>
        
        <div className={`w-16 h-0.5 ${step >= 3 ? 'bg-[#D4841A]' : 'bg-gray-200'}`}></div>
        
        <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-[#2D5A27]' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= 3 ? 'bg-[#2D5A27] text-white' : 'bg-gray-200'
          }`}>
            <CreditCard className="w-4 h-4" />
          </div>
          <span className="font-medium">Paiement</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Propriété et Dates */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#D4841A] to-[#B8741A] rounded-lg flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span>Propriété et Dates</span>
              </CardTitle>
              <CardDescription>
                Sélectionnez la propriété et les dates du séjour
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Note: Les propriétés affichées ont toutes un contrat actif automatiquement */}
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Propriétés avec contrats actifs</AlertTitle>
                <AlertDescription className="text-blue-700">
                  Seules les propriétés ayant un contrat actif sont affichées. Le contrat est automatiquement détecté.
                </AlertDescription>
              </Alert>

              {/* Propriété ou Unité - TEMPORARY HARDCODED - Will be connected to DB */}
              <div className="space-y-2">
                <Label htmlFor="property">Propriété / Unité *</Label>
                <Select 
                  value={formData.propriete_id || formData.unite_id} 
                  onValueChange={(value) => {
                    if (value.startsWith('prop-')) {
                      updateFormData('propriete_id', value);
                      updateFormData('unite_id', '');
                      // Set default price based on property
                      updateFormData('prix_nuit', 150); // Default price
                    } else {
                      updateFormData('unite_id', value);
                      updateFormData('propriete_id', '');
                      updateFormData('prix_nuit', 100); // Default price for units
                    }
                  }}
                >
                  <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                    <SelectValue placeholder="Sélectionner une propriété ou unité avec contrat actif" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prop-1">Villa Nice - Oceanview (Contrat Variable 10%)</SelectItem>
                    <SelectItem value="unit-1">Apt Paris - Studio 2A (Contrat Fixe)</SelectItem>
                    <SelectItem value="unit-2">Apt Paris - Studio 2B (Contrat Fixe)</SelectItem>
                    <SelectItem value="prop-3">Chalet Chamonix - Mont Blanc (Contrat Variable 15%)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Les contrats sont automatiquement liés aux propriétés
                </p>
              </div>

              <Separator />

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_arrivee">Date d'arrivée *</Label>
                  <Input
                    id="date_arrivee"
                    type="date"
                    value={formData.date_arrivee}
                    onChange={(e) => updateFormData('date_arrivee', e.target.value)}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date_depart">Date de départ *</Label>
                  <Input
                    id="date_depart"
                    type="date"
                    value={formData.date_depart}
                    onChange={(e) => updateFormData('date_depart', e.target.value)}
                    min={formData.date_arrivee}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    required
                  />
                </div>
              </div>

              {nombreNuits > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        {nombreNuits} {nombreNuits === 1 ? 'nuit' : 'nuits'}
                      </span>
                    </div>
                    
                    {checking && (
                      <div className="flex items-center space-x-2 text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Vérification...</span>
                      </div>
                    )}
                    
                    {!checking && availabilityStatus === 'available' && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Disponible
                      </Badge>
                    )}
                    
                    {!checking && availabilityStatus === 'unavailable' && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Non disponible
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Source */}
              <div className="space-y-2">
                <Label htmlFor="source">Source de la réservation</Label>
                <Select 
                  value={formData.source_reservation} 
                  onValueChange={(value) => updateFormData('source_reservation', value)}
                >
                  <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="airbnb">Airbnb</SelectItem>
                    <SelectItem value="booking">Booking.com</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Voyageur */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#D4841A] to-[#B8741A] rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span>Informations Voyageur</span>
              </CardTitle>
              <CardDescription>
                Renseignez les informations du voyageur principal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voyageur_nom">Nom *</Label>
                  <Input
                    id="voyageur_nom"
                    value={formData.voyageur_nom}
                    onChange={(e) => updateFormData('voyageur_nom', e.target.value)}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voyageur_prenom">Prénom</Label>
                  <Input
                    id="voyageur_prenom"
                    value={formData.voyageur_prenom}
                    onChange={(e) => updateFormData('voyageur_prenom', e.target.value)}
                    className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voyageur_email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="voyageur_email"
                      type="email"
                      value={formData.voyageur_email}
                      onChange={(e) => updateFormData('voyageur_email', e.target.value)}
                      className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="voyageur_telephone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="voyageur_telephone"
                      type="tel"
                      value={formData.voyageur_telephone}
                      onChange={(e) => updateFormData('voyageur_telephone', e.target.value)}
                      className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voyageur_pays">Pays</Label>
                <Select 
                  value={formData.voyageur_pays} 
                  onValueChange={(value) => updateFormData('voyageur_pays', value)}
                >
                  <SelectTrigger className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="BE">Belgique</SelectItem>
                    <SelectItem value="CH">Suisse</SelectItem>
                    <SelectItem value="ES">Espagne</SelectItem>
                    <SelectItem value="IT">Italie</SelectItem>
                    <SelectItem value="DE">Allemagne</SelectItem>
                    <SelectItem value="GB">Royaume-Uni</SelectItem>
                    <SelectItem value="US">États-Unis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Nombre de voyageurs */}
              <div className="space-y-4">
                <Label>Nombre de voyageurs</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre_adultes" className="text-sm text-gray-600">Adultes</Label>
                    <Input
                      id="nombre_adultes"
                      type="number"
                      min="1"
                      value={formData.nombre_adultes}
                      onChange={(e) => updateFormData('nombre_adultes', parseInt(e.target.value))}
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombre_enfants" className="text-sm text-gray-600">Enfants</Label>
                    <Input
                      id="nombre_enfants"
                      type="number"
                      min="0"
                      value={formData.nombre_enfants}
                      onChange={(e) => updateFormData('nombre_enfants', parseInt(e.target.value))}
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nombre_bebes" className="text-sm text-gray-600">Bébés</Label>
                    <Input
                      id="nombre_bebes"
                      type="number"
                      min="0"
                      value={formData.nombre_bebes}
                      onChange={(e) => updateFormData('nombre_bebes', parseInt(e.target.value))}
                      className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Demandes spéciales */}
              <div className="space-y-2">
                <Label htmlFor="special_requests">Demandes spéciales</Label>
                <Textarea
                  id="special_requests"
                  value={formData.special_requests}
                  onChange={(e) => updateFormData('special_requests', e.target.value)}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                  placeholder="Arrivée tardive, lit bébé, allergies..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Paiement */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#2D5A27] to-[#1F3F1C] rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <span>Tarification</span>
              </CardTitle>
              <CardDescription>
                Définissez les tarifs pour cette réservation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prix_nuit">Prix par nuit (€) *</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="prix_nuit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.prix_nuit}
                      onChange={(e) => updateFormData('prix_nuit', parseFloat(e.target.value))}
                      className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frais_menage">Frais de ménage (€)</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="frais_menage"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.frais_menage}
                      onChange={(e) => updateFormData('frais_menage', parseFloat(e.target.value))}
                      className="pl-10 bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Récapitulatif */}
              <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200">
                <h4 className="font-semibold mb-3">Récapitulatif</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{formData.prix_nuit}€ × {nombreNuits} nuits</span>
                    <span className="font-medium">{sousTotal.toFixed(2)}€</span>
                  </div>
                  {formData.frais_menage > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais de ménage</span>
                      <span className="font-medium">{formData.frais_menage.toFixed(2)}€</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-lg text-[#D4841A]">
                      {totalVoyageur.toFixed(2)}€
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes internes */}
              <div className="space-y-2">
                <Label htmlFor="notes_internes">Notes internes</Label>
                <Textarea
                  id="notes_internes"
                  value={formData.notes_internes}
                  onChange={(e) => updateFormData('notes_internes', e.target.value)}
                  className="bg-white focus:border-[#D4841A] focus:ring-[#D4841A]/20 min-h-[100px]"
                  placeholder="Notes visibles uniquement en interne..."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep(Math.min(3, step + 1))}
              disabled={!isStepValid(step)}
              className="bg-[#D4841A] hover:bg-[#B8741A]"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading || !isStepValid(3)}
              className="bg-[#2D5A27] hover:bg-[#1F3F1C]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Créer la réservation
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}