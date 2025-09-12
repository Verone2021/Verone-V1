#!/bin/bash

# Application directe via requêtes SQL séquentielles

PROJECT_REF="ptqwayandsfhciitjnhb"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cXdheWFuZHNmaGNpaXRqbmhiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQyNTM2OSwiZXhwIjoyMDY5MDAxMzY5fQ.f7WUYy-7nem5e4Xeq_pcWR4KapvnTyNLhds2qImc32M"
SUPABASE_URL="https://ptqwayandsfhciitjnhb.supabase.co"

echo "🚀 Application migration SQL directe..."

# Fonction pour exécuter SQL
execute_sql() {
  echo "📋 Exécution: $2"
  curl -X POST "$SUPABASE_URL/rest/v1/rpc/execute_sql" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"sql_query\": \"$1\"}"
  echo ""
}

# 1. Ajouter champs bancaires minimaux
execute_sql "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS iban VARCHAR(34);" "Ajout IBAN"
execute_sql "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255);" "Ajout nom titulaire"
execute_sql "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);" "Ajout nom banque"
execute_sql "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS swift_bic VARCHAR(11);" "Ajout BIC"

# 2. Ajouter champs internationaux
execute_sql "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS nipc_numero VARCHAR(20);" "Ajout NIPC"
execute_sql "ALTER TABLE proprietaires ADD COLUMN IF NOT EXISTS pays_constitution VARCHAR(10);" "Ajout pays constitution"

# 3. Insérer données JARDIM PRÓSPERO avec vraies coordonnées
execute_sql "INSERT INTO proprietaires (type, nom, pays, pays_constitution, forme_juridique, nipc_numero, capital_social, nombre_parts_total, iban, account_holder_name, bank_name, swift_bic, risk_profile, kyc_status, is_brouillon) VALUES ('morale', 'JARDIM PRÓSPERO, LDA', 'PT', 'PT', 'SCI', '123456789', 5000.00, 5000, 'LT32325005050627932', 'JARDIM PRÓSPERO, LDA', 'Revolut Bank UAB', 'REVOLT21', 'medium', 'pending', true) ON CONFLICT (id) DO UPDATE SET iban = EXCLUDED.iban, account_holder_name = EXCLUDED.account_holder_name, bank_name = EXCLUDED.bank_name, swift_bic = EXCLUDED.swift_bic;" "Insertion JARDIM PRÓSPERO"

echo "✅ Migration terminée !"