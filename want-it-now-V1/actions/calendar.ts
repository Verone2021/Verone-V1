'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

const updatePricingSchema = z.object({
  propriete_id: z.string().uuid().nullable(),
  unite_id: z.string().uuid().nullable(),
  date_debut: z.string(),
  date_fin: z.string(),
  prix_nuit: z.number().positive(),
  prix_weekend: z.number().positive().optional(),
  prix_semaine: z.number().positive().optional(),
  prix_mois: z.number().positive().optional(),
  sejour_minimum: z.number().min(1).default(1),
  nom_periode: z.string().optional(),
  couleur_calendrier: z.string().default('#D4841A')
}).refine(
  data => (data.propriete_id !== null) !== (data.unite_id !== null),
  { message: "Doit spécifier soit propriete_id soit unite_id, pas les deux" }
);

const blockDatesSchema = z.object({
  propriete_id: z.string().uuid().nullable(),
  unite_id: z.string().uuid().nullable(),
  dates: z.array(z.string()),
  raison: z.string().optional(),
  statut: z.enum(['bloque', 'maintenance', 'indisponible']).default('bloque')
});

// ============================================================================
// RÉCUPÉRATION CALENDRIER
// ============================================================================

export async function getCalendarByProperty(
  propertyId: string,
  month: number,
  year: number
) {
  const supabase = await createClient();
  
  // Calculer les dates du mois
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  // Récupérer les disponibilités
  const { data: availability, error: availError } = await supabase
    .from('calendrier_disponibilites')
    .select('*')
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);
  
  if (availError) {
    console.error('Erreur récupération disponibilités:', availError);
    return { success: false, error: availError.message };
  }
  
  // Récupérer les réservations
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('*')
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .gte('date_depart', startDate.toISOString().split('T')[0])
    .lte('date_arrivee', endDate.toISOString().split('T')[0])
    .in('statut', ['confirmee', 'en_cours']);
  
  if (resError) {
    console.error('Erreur récupération réservations:', resError);
    return { success: false, error: resError.message };
  }
  
  // Récupérer les prix dynamiques
  const { data: pricing, error: priceError } = await supabase
    .from('prix_dynamiques')
    .select('*')
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .gte('date_fin', startDate.toISOString().split('T')[0])
    .lte('date_debut', endDate.toISOString().split('T')[0])
    .order('priorite', { ascending: false });
  
  if (priceError) {
    console.error('Erreur récupération prix:', priceError);
    return { success: false, error: priceError.message };
  }
  
  // Construire le calendrier jour par jour
  const calendar = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayOfWeek = current.getDay();
    
    // Trouver disponibilité
    const avail = availability?.find(a => a.date === dateStr);
    
    // Trouver réservations
    const dayReservations = reservations?.filter(r => {
      const arrival = new Date(r.date_arrivee);
      const departure = new Date(r.date_depart);
      const checkDate = new Date(dateStr);
      return checkDate >= arrival && checkDate < departure;
    });
    
    // Trouver prix applicable
    const applicablePrices = pricing?.filter(p => {
      const start = new Date(p.date_debut);
      const end = new Date(p.date_fin);
      const checkDate = new Date(dateStr);
      return checkDate >= start && checkDate <= end;
    });
    
    const bestPrice = applicablePrices?.[0]; // Déjà trié par priorité
    
    // Déterminer le prix du jour
    let dayPrice = bestPrice?.prix_nuit || 100;
    if (bestPrice) {
      // Prix weekend (vendredi/samedi)
      if ((dayOfWeek === 5 || dayOfWeek === 6) && bestPrice.prix_weekend) {
        dayPrice = bestPrice.prix_weekend;
      }
    }
    
    calendar.push({
      date: dateStr,
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      status: avail?.statut || (dayReservations?.length ? 'reserve' : 'disponible'),
      prix: dayPrice,
      prixPeriode: bestPrice,
      reservations: dayReservations,
      sejour_minimum: bestPrice?.sejour_minimum || 1,
      couleur: bestPrice?.couleur_calendrier
    });
    
    current.setDate(current.getDate() + 1);
  }
  
  return { success: true, data: calendar };
}

// ============================================================================
// MISE À JOUR PRIX
// ============================================================================

export async function updatePricing(data: z.infer<typeof updatePricingSchema>) {
  try {
    const supabase = await createClient();
    
    // Validation
    const validated = updatePricingSchema.parse(data);
    
    // Créer ou mettre à jour le prix dynamique
    const { error } = await supabase
      .from('prix_dynamiques')
      .insert(validated);
    
    if (error) {
      console.error('Erreur mise à jour prix:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/reservations');
    return { success: true };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Données invalides' };
    }
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la mise à jour des prix' };
  }
}

// ============================================================================
// BLOCAGE/DÉBLOCAGE DATES
// ============================================================================

export async function blockDates(data: z.infer<typeof blockDatesSchema>) {
  try {
    const supabase = await createClient();
    
    // Validation
    const validated = blockDatesSchema.parse(data);
    
    // Créer les entrées de blocage pour chaque date
    const entries = validated.dates.map(date => ({
      propriete_id: validated.propriete_id,
      unite_id: validated.unite_id,
      date,
      statut: validated.statut,
      notes: validated.raison
    }));
    
    const { error } = await supabase
      .from('calendrier_disponibilites')
      .upsert(entries, {
        onConflict: 'propriete_id,unite_id,date'
      });
    
    if (error) {
      console.error('Erreur blocage dates:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/reservations');
    return { success: true };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Données invalides' };
    }
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors du blocage des dates' };
  }
}

export async function unblockDates(
  propertyId: string,
  dates: string[]
) {
  const supabase = await createClient();
  
  // Supprimer les blocages
  const { error } = await supabase
    .from('calendrier_disponibilites')
    .delete()
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .in('date', dates)
    .in('statut', ['bloque', 'maintenance', 'indisponible']);
  
  if (error) {
    console.error('Erreur déblocage dates:', error);
    return { success: false, error: error.message };
  }
  
  revalidatePath('/reservations');
  return { success: true };
}

// ============================================================================
// DISPONIBILITÉ
// ============================================================================

export async function getPropertyAvailability(
  propertyId: string,
  startDate: string,
  endDate: string
) {
  const supabase = await createClient();
  
  // Vérifier les réservations existantes
  const { data: reservations, error: resError } = await supabase
    .from('reservations')
    .select('date_arrivee, date_depart')
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .gte('date_depart', startDate)
    .lte('date_arrivee', endDate)
    .in('statut', ['confirmee', 'en_cours']);
  
  if (resError) {
    console.error('Erreur vérification disponibilité:', resError);
    return { success: false, error: resError.message };
  }
  
  // Vérifier les blocages
  const { data: blocked, error: blockError } = await supabase
    .from('calendrier_disponibilites')
    .select('date, statut')
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .gte('date', startDate)
    .lte('date', endDate)
    .in('statut', ['bloque', 'maintenance', 'indisponible']);
  
  if (blockError) {
    console.error('Erreur vérification blocages:', blockError);
    return { success: false, error: blockError.message };
  }
  
  const isAvailable = !reservations?.length && !blocked?.length;
  
  return {
    success: true,
    data: {
      available: isAvailable,
      reservations,
      blockedDates: blocked
    }
  };
}

// ============================================================================
// STATISTIQUES CALENDRIER
// ============================================================================

export async function getCalendarStats(propertyId: string, year: number) {
  const supabase = await createClient();
  
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Récupérer toutes les réservations de l'année
  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('date_arrivee, date_depart, total_hote_net, statut')
    .or(`propriete_id.eq.${propertyId},unite_id.eq.${propertyId}`)
    .gte('date_arrivee', startDate)
    .lte('date_arrivee', endDate)
    .in('statut', ['confirmee', 'completee']);
  
  if (error) {
    console.error('Erreur récupération stats:', error);
    return { success: false, error: error.message };
  }
  
  // Calculer les statistiques
  let totalNights = 0;
  let totalRevenue = 0;
  const monthlyStats: Record<number, { nights: number; revenue: number }> = {};
  
  reservations?.forEach(res => {
    const arrival = new Date(res.date_arrivee);
    const departure = new Date(res.date_depart);
    const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
    const month = arrival.getMonth();
    
    totalNights += nights;
    totalRevenue += res.total_hote_net || 0;
    
    if (!monthlyStats[month]) {
      monthlyStats[month] = { nights: 0, revenue: 0 };
    }
    monthlyStats[month].nights += nights;
    monthlyStats[month].revenue += res.total_hote_net || 0;
  });
  
  // Taux d'occupation
  const totalDaysInYear = 365;
  const occupancyRate = (totalNights / totalDaysInYear) * 100;
  
  // RevPAR (Revenue Per Available Room)
  const revpar = totalRevenue / totalDaysInYear;
  
  return {
    success: true,
    data: {
      totalNights,
      totalRevenue,
      occupancyRate: Math.round(occupancyRate * 10) / 10,
      revpar: Math.round(revpar * 100) / 100,
      monthlyStats,
      totalReservations: reservations?.length || 0
    }
  };
}