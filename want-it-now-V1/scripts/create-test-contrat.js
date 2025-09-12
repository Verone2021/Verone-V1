#!/usr/bin/env node

// Utilisation de curl direct pour bypass RLS issues

const SUPABASE_URL = 'https://ptqwayandsfhciitjnhb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM4MDYyNDUsImV4cCI6MjAzOTM4MjI0NX0.YQ4hzpEtdFELIKoq0lkrIaKH5XvfmGcNgVTxCZOu3mQ'

async function createTestContrat() {
  console.log('🚀 Création contrat test avec curl...')
  
  // Données du contrat test
  const contratData = {
    organisation_id: '49deadc4-2b67-45d0-94ba-3971dbac31c5', // Want it Now LDA
    propriete_id: '70ec83e4-0f06-4aa5-96db-c6cf7e356b58',    // Baramares n°1
    type_contrat: 'variable',
    date_emission: '2025-01-15',  // Antérieure à date_debut
    date_debut: '2025-02-01',
    date_fin: '2025-12-31',
    meuble: true,
    autorisation_sous_location: true,
    besoin_renovation: false,
    commission_pourcentage: 10.00,
    usage_proprietaire_jours_max: 60,
    // Bailleur info
    bailleur_nom: 'Want it Now LDA',
    bailleur_adresse_siege: 'Porto, Portugal',
    bailleur_siren_siret: 'PT509433738',
    // Bien info
    bien_adresse_complete: 'Baramares, Porto, Portugal',
    bien_type: 'Appartement',
    bien_superficie: '85',
    bien_nombre_pieces: '3'
  }

  console.log('Données contrat:', JSON.stringify(contratData, null, 2))
  return contratData
}

createTestContrat()