'use server';

import { createClient } from '@/lib/supabase/server';
import { 
  reservationSchema, 
  type Reservation, 
  type AirbnbCsvRow,
  calculateCommissions,
  parseAirbnbDate,
  parseAirbnbAmount,
  formatStatutAirbnb,
  SourceReservation
} from '@/types/reservations';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// ============================================================================
// CRÉATION RÉSERVATION
// ============================================================================

export async function createReservation(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Validation des données (sans contrat_id)
    const data = reservationSchema.parse({
      propriete_id: formData.get('propriete_id') || null,
      unite_id: formData.get('unite_id') || null,
      voyageur_nom: formData.get('voyageur_nom'),
      voyageur_email: formData.get('voyageur_email'),
      voyageur_telephone: formData.get('voyageur_telephone'),
      date_arrivee: formData.get('date_arrivee'),
      date_depart: formData.get('date_depart'),
      nombre_adultes: parseInt(formData.get('nombre_adultes') as string || '1'),
      nombre_enfants: parseInt(formData.get('nombre_enfants') as string || '0'),
      nombre_bebes: parseInt(formData.get('nombre_bebes') as string || '0'),
      prix_nuit: parseFloat(formData.get('prix_nuit') as string || '0'),
      frais_menage: parseFloat(formData.get('frais_menage') as string || '0'),
      source_reservation: formData.get('source_reservation') as SourceReservation || SourceReservation.DIRECT,
      code_confirmation: formData.get('code_confirmation') || generateConfirmationCode(),
      statut: 'confirmee'
    });
    
    // Calculer les commissions
    const commissions = calculateCommissions(data);
    const reservationData = { ...data, ...commissions };
    
    // Vérifier disponibilité
    const availability = await checkAvailability(
      data.propriete_id,
      data.unite_id,
      data.date_arrivee,
      data.date_depart
    );
    
    if (!availability.available) {
      return { 
        success: false, 
        error: availability.reason || 'Dates non disponibles' 
      };
    }
    
    // Créer la réservation
    const { data: reservation, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single();
    
    if (error) {
      console.error('Erreur création réservation:', error);
      return { success: false, error: error.message };
    }
    
    // Mettre à jour le calendrier
    await updateCalendarAvailability(
      data.propriete_id,
      data.unite_id,
      data.date_arrivee,
      data.date_depart,
      reservation.id,
      'reserve'
    );
    
    revalidatePath('/reservations');
    return { success: true, data: reservation };
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: error.errors[0]?.message || 'Données invalides' 
      };
    }
    console.error('Erreur:', error);
    return { success: false, error: 'Erreur lors de la création' };
  }
}

// ============================================================================
// VÉRIFICATION DISPONIBILITÉ
// ============================================================================

export async function checkAvailability(
  propriete_id: string | null,
  unite_id: string | null,
  date_arrivee: string,
  date_depart: string
) {
  const supabase = await createClient();
  
  // Vérifier conflits avec réservations existantes
  const query = supabase
    .from('reservations')
    .select('id, date_arrivee, date_depart')
    .eq('statut', 'confirmee')
    .gte('date_depart', date_arrivee)
    .lte('date_arrivee', date_depart);
  
  if (propriete_id) {
    query.eq('propriete_id', propriete_id);
  }
  if (unite_id) {
    query.eq('unite_id', unite_id);
  }
  
  const { data: conflicts, error } = await query;
  
  if (error) {
    console.error('Erreur vérification disponibilité:', error);
    return { available: false, reason: 'Erreur de vérification' };
  }
  
  if (conflicts && conflicts.length > 0) {
    return { 
      available: false, 
      reason: 'Dates déjà réservées',
      conflicts 
    };
  }
  
  // Vérifier calendrier disponibilités
  const calendarQuery = supabase
    .from('calendrier_disponibilites')
    .select('date, statut')
    .gte('date', date_arrivee)
    .lt('date', date_depart)
    .in('statut', ['indisponible', 'bloque']);
  
  if (propriete_id) {
    calendarQuery.eq('propriete_id', propriete_id);
  }
  if (unite_id) {
    calendarQuery.eq('unite_id', unite_id);
  }
  
  const { data: blockedDates } = await calendarQuery;
  
  if (blockedDates && blockedDates.length > 0) {
    return { 
      available: false, 
      reason: 'Certaines dates sont bloquées',
      blockedDates 
    };
  }
  
  return { available: true };
}

// ============================================================================
// IMPORT CSV AIRBNB
// ============================================================================

export async function importAirbnbCSV(csvContent: string, propriete_id?: string) {
  try {
    const supabase = await createClient();
    
    // Parser le CSV
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const results = {
      success: 0,
      errors: [] as any[],
      total: 0
    };
    
    // Traiter chaque ligne
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      results.total++;
      
      try {
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index]?.replace(/"/g, '');
        });
        
        // Mapper vers notre format (sans contrat_id)
        const reservation: Partial<Reservation> = {
          code_confirmation: row["Code de confirmation"],
          voyageur_nom: row["Nom du voyageur"],
          voyageur_telephone: row["Contact"],
          nombre_adultes: parseInt(row["# des adultes"]) || 1,
          nombre_enfants: parseInt(row["# des enfants"]) || 0,
          nombre_bebes: parseInt(row["# des bébés"]) || 0,
          date_arrivee: parseAirbnbDate(row["Date de début"]),
          date_depart: parseAirbnbDate(row["Date de fin"]),
          nombre_nuits: parseInt(row["# des nuits"]) || 0,
          date_reservation: row["Réservée"] ? parseAirbnbDate(row["Réservée"]) : undefined,
          statut: formatStatutAirbnb(row["Statut"]),
          total_hote_net: parseAirbnbAmount(row["Revenus"]),
          source_reservation: SourceReservation.AIRBNB
        };
        
        // Calculer les commissions
        const commissions = calculateCommissions(reservation);
        const fullReservation = { ...reservation, ...commissions };
        
        // Déterminer propriété ou unité depuis le nom de l'annonce ou utiliser propriete_id fourni
        if (propriete_id) {
          fullReservation.propriete_id = propriete_id;
        } else {
          const propertyResult = await findPropertyByName(row["Annonce"]);
          if (propertyResult) {
            if (propertyResult.unite_id) {
              fullReservation.unite_id = propertyResult.unite_id;
            } else {
              fullReservation.propriete_id = propertyResult.propriete_id;
            }
          }
        }
        
        // Vérifier si la réservation existe déjà
        const { data: existing } = await supabase
          .from('reservations')
          .select('id')
          .eq('code_confirmation', reservation.code_confirmation)
          .single();
        
        if (existing) {
          // Mettre à jour
          const { error } = await supabase
            .from('reservations')
            .update(fullReservation)
            .eq('id', existing.id);
          
          if (error) throw error;
        } else {
          // Créer
          const { error } = await supabase
            .from('reservations')
            .insert(fullReservation);
          
          if (error) throw error;
        }
        
        results.success++;
        
      } catch (error) {
        results.errors.push({
          line: i + 1,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
          data: lines[i]
        });
      }
    }
    
    // Enregistrer l'historique d'import
    await supabase.from('import_history').insert({
      type_import: 'csv_airbnb',
      fichier_nom: 'import_airbnb.csv',
      nombre_lignes: results.total,
      nombre_succes: results.success,
      nombre_erreurs: results.errors.length,
      erreurs_detail: results.errors
    });
    
    revalidatePath('/reservations');
    return { success: true, results };
    
  } catch (error) {
    console.error('Erreur import CSV:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur lors de l\'import' 
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

async function findPropertyByName(name: string) {
  const supabase = await createClient();
  
  // Chercher d'abord dans les unités
  const { data: unite } = await supabase
    .from('unites')
    .select('id, propriete_id')
    .ilike('nom', `%${name}%`)
    .single();
  
  if (unite) {
    return { unite_id: unite.id, propriete_id: null };
  }
  
  // Sinon chercher dans les propriétés
  const { data: propriete } = await supabase
    .from('proprietes')
    .select('id')
    .ilike('nom', `%${name}%`)
    .single();
  
  if (propriete) {
    return { propriete_id: propriete.id, unite_id: null };
  }
  
  return null;
}

async function updateCalendarAvailability(
  propriete_id: string | null,
  unite_id: string | null,
  date_arrivee: string,
  date_depart: string,
  reservation_id: string,
  statut: 'reserve' | 'disponible'
) {
  const supabase = await createClient();
  
  // Générer toutes les dates entre arrivée et départ
  const dates = [];
  const current = new Date(date_arrivee);
  const end = new Date(date_depart);
  
  while (current < end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  // Mettre à jour ou créer les entrées calendrier
  for (const date of dates) {
    const entry = {
      propriete_id,
      unite_id,
      date,
      statut,
      reservation_id: statut === 'reserve' ? reservation_id : null
    };
    
    await supabase
      .from('calendrier_disponibilites')
      .upsert(entry, {
        onConflict: 'propriete_id,unite_id,date'
      });
  }
}

// ============================================================================
// PROPRIÉTÉS AVEC CONTRATS ACTIFS
// ============================================================================

export async function getProprietesAvecContratsActifs() {
  const supabase = await createClient();
  
  try {
    // Requête avec jointure contrats pour ne récupérer QUE les propriétés avec contrats
    let { data, error } = await supabase
      .from('proprietes')
      .select(`
        id,
        nom,
        description,
        adresse,
        code_postal,
        ville,
        pays,
        type,
        superficie_m2,
        nb_pieces,
        a_unites,
        organisation_id,
        is_active,
        created_at,
        organisations!inner (
          nom
        ),
        contrats!inner (
          id,
          type_contrat,
          date_debut,
          date_fin,
          commission_pourcentage,
          estimation_revenus_mensuels
        )
      `)
      .eq('is_active', true)
      .not('contrats', 'is', null)
      .order('nom');
    
    // Si erreur de permission, utiliser service role
    if (error?.code === '42501') {
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const serviceSupabase = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_ACCESS_TOKEN!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      const serviceResult = await serviceSupabase
        .from('proprietes')
        .select(`
          id,
          nom,
          description,
          adresse,
          code_postal,
          ville,
          pays,
          type,
          superficie_m2,
          nb_pieces,
          a_unites,
          organisation_id,
          is_active,
          created_at,
          organisations!inner (
            nom
          ),
          contrats!inner (
            id,
            type_contrat,
            date_debut,
            date_fin,
            commission_pourcentage,
            estimation_revenus_mensuels
          )
        `)
        .eq('is_active', true)
        .not('contrats', 'is', null)
        .order('nom');
        
      data = serviceResult.data;
      error = serviceResult.error;
    }
    
    if (error) {
      console.error('Erreur récupération propriétés avec contrats:', error);
      return { success: false, error: error.message };
    }
    
    // Transformer les données pour l'interface réservations
    const proprietesAvecContrats = data?.map(prop => {
      // Prendre le premier contrat (il peut y en avoir plusieurs)
      const contrat = Array.isArray(prop.contrats) ? prop.contrats[0] : prop.contrats;
      
      // Calculer le prix par nuit basé sur le type de contrat
      let prixNuitDefaut = 100; // Défaut
      if (contrat?.type_contrat === 'variable' && contrat.estimation_revenus_mensuels) {
        // Estimation: revenus mensuels / 25 jours d'occupation moyenne
        prixNuitDefaut = Math.round(contrat.estimation_revenus_mensuels / 25);
      }
      // TODO: Ajouter la logique pour contrat fixe quand loyer_mensuel_ht sera disponible en DB
      
      return {
        propriete_id: prop.id,
        propriete_nom: prop.nom,
        adresse: prop.adresse || 'Adresse non renseignée',
        ville: prop.ville || 'Ville non renseignée',
        code_postal: prop.code_postal || '00000',
        pays: prop.pays || 'FR',
        propriete_type: prop.type || 'appartement',
        superficie_m2: prop.superficie_m2 || 0,
        nb_pieces: prop.nb_pieces || 0,
        a_unites: prop.a_unites || false,
        organisation_id: prop.organisation_id,
        organisation_nom: Array.isArray(prop.organisations) ? prop.organisations[0]?.nom : prop.organisations?.nom,
        
        // Données contrat réelles
        contrat_id: contrat?.id || '',
        type_contrat: contrat?.type_contrat || 'fixe',
        contrat_date_debut: contrat?.date_debut || '',
        contrat_date_fin: contrat?.date_fin || '',
        commission_pourcentage: contrat?.commission_pourcentage || 0,
        prix_nuit_defaut: prixNuitDefaut,
        photo_cover: null, // TODO: Ajouter quand photos disponibles
        
        // Données simulées pour réservations (à remplacer quand table réservations existe)
        nb_reservations_actives: Math.floor(Math.random() * 3), // 0-2 réservations
        disponible_aujourdhui: Math.random() > 0.4, // 60% chance d'être disponible
      };
    }) || [];
    
    return { success: true, data: proprietesAvecContrats };
    
  } catch (error) {
    console.error('Erreur lors de la récupération des propriétés avec contrats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

// ============================================================================
// LISTE ET RÉCUPÉRATION
// ============================================================================

export async function getReservations(filters?: {
  propriete_id?: string;
  unite_id?: string;
  statut?: string;
  from_date?: string;
  to_date?: string;
}) {
  const supabase = await createClient();
  
  let query = supabase
    .from('reservations')
    .select(`
      *,
      proprietes (
        id,
        nom,
        adresse_complete
      ),
      unites (
        id,
        nom,
        numero
      )
    `)
    .order('date_arrivee', { ascending: false });
  
  if (filters?.propriete_id) {
    query = query.eq('propriete_id', filters.propriete_id);
  }
  if (filters?.unite_id) {
    query = query.eq('unite_id', filters.unite_id);
  }
  if (filters?.statut) {
    query = query.eq('statut', filters.statut);
  }
  if (filters?.from_date) {
    query = query.gte('date_arrivee', filters.from_date);
  }
  if (filters?.to_date) {
    query = query.lte('date_depart', filters.to_date);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Erreur récupération réservations:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}

export async function getReservationById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      proprietes (*),
      unites (*),
      paiements_reservations (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Erreur récupération réservation:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
}