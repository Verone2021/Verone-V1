# Workflow Supabase - Méthode CORRECTE

## ❌ INTERDIT ABSOLU
- **JAMAIS utiliser Supabase Studio SQL Editor**
- **JAMAIS naviguer vers supabase.com/dashboard pour exécuter SQL**

## ✅ MÉTHODES AUTORISÉES UNIQUEMENT

### 1. Supabase CLI (Méthode Principale)
```bash
# Application migrations
npx supabase db push

# Connexion directe
npx supabase db remote
```

### 2. Connexion PostgreSQL Directe
```bash
# Via variables d'environnement (voir .env.local)
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "$SUPABASE_DB_URL"

# Ou avec paramètres explicites
PGPASSWORD="xxx" psql -h host -p port -U user -d database
```

### 3. Scripts Node.js
```javascript
// Utiliser pg ou postgres.js pour exécuter SQL
const { Client } = require('pg');
// Connexion et exécution queries
```

## Configuration
- Toutes les connexions configurées dans `.env.local`
- Migrations dans `supabase/migrations/`
- Toujours utiliser CLI ou connexions directes PostgreSQL

## RAPPEL CRITIQUE
**Supabase Studio = BANNI DÉFINITIVEMENT**
**CLI Supabase + psql = SEULES MÉTHODES AUTORISÉES**
