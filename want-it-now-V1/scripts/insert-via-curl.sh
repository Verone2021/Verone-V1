#!/bin/bash

# Script d'insertion via API pour données de test contrats

# Configuration avec service role key pour bypass RLS
PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"
ORG_ID="49deadc4-2b67-45d0-94ba-3971dbac31c5" # Organisation existante

echo "🚀 Insertion de 2 contrats de test directement..."
echo "🔑 Utilisation service role key pour bypass RLS..."

echo "🏠 Insertion propriétés..."

# Propriété 1: Villa Nice - pour contrat fixe
curl -X POST "$SUPABASE_URL/rest/v1/proprietes" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "organisation_id": "'$ORG_ID'",
    "nom": "Villa Les Palmiers Nice",
    "adresse": "15 Avenue des Palmiers",
    "code_postal": "06000",
    "ville": "Nice", 
    "pays": "FR",
    "type": "maison",
    "superficie_m2": 180,
    "nb_pieces": 6,
    "a_unites": false,
    "is_active": true
  }'

# Propriété 2: Studio Paris - pour contrat variable  
curl -X POST "$SUPABASE_URL/rest/v1/proprietes" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440002", 
    "organisation_id": "'$ORG_ID'",
    "nom": "Studio Trocadéro Paris",
    "adresse": "42 Avenue Kléber",
    "code_postal": "75016",
    "ville": "Paris",
    "pays": "FR", 
    "type": "appartement",
    "superficie_m2": 35,
    "nb_pieces": 1,
    "a_unites": false,
    "is_active": true
  }'

echo "✅ Propriétés créées"

echo "📑 Insertion contrats..."

# Contrat 1: Fixe - Villa Nice (minimal)
curl -X POST "$SUPABASE_URL/rest/v1/contrats" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440020",
    "organisation_id": "'$ORG_ID'",
    "propriete_id": "550e8400-e29b-41d4-a716-446655440001",
    "unite_id": null,
    "type_contrat": "fixe",
    "date_emission": "2025-01-15",
    "date_debut": "2025-03-01", 
    "date_fin": "2026-02-28"
  }'

# Contrat 2: Variable - Studio Paris (minimal) 
curl -X POST "$SUPABASE_URL/rest/v1/contrats" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "id": "550e8400-e29b-41d4-a716-446655440021",
    "organisation_id": "'$ORG_ID'",
    "propriete_id": "550e8400-e29b-41d4-a716-446655440002",
    "unite_id": null, 
    "type_contrat": "variable",
    "date_emission": "2025-01-10",
    "date_debut": "2025-02-01",
    "date_fin": "2026-01-31"
  }'

echo "✅ 2 contrats de test insérés avec succès !"
echo "🔗 Vérifiez : http://localhost:3000/contrats"