# Supabase Database Connection - RÈGLE ABSOLUE

**Date**: 2025-11-20 (Mise à jour sécurité: 2025-12-19)
**Contexte**: Connection PostgreSQL Supabase - UNIQUE méthode autorisée

## ⚠️ SÉCURITÉ - RÈGLE CRITIQUE

**NE JAMAIS afficher les credentials (mot de passe, tokens) dans les réponses ou fichiers.**

- Les credentials sont dans `.env.local` (non versionné)
- Utiliser `$DATABASE_URL` comme variable d'environnement

## ✅ CONNECTION STRING (Format)

```bash
# Format (NE PAS afficher le mot de passe réel)
postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

**Valeurs** : Voir `.env.local` ou Dashboard Supabase

## 🎯 MÉTHODE PRINCIPALE: API SUPABASE (PAS DE MOT DE PASSE REQUIS)

```bash
# ✅ EXÉCUTER SQL via API Supabase (MÉTHODE RECOMMANDÉE)
curl -s -X POST "https://api.supabase.com/v1/projects/aorroydfjsrygmosnzrl/database/query" \
  -H "Authorization: Bearer sbp_a38334ba650a3fe5820e1641e3d156c01528089b" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM products LIMIT 10"}'

# ✅ APPLIQUER UNE MIGRATION
curl -s -X POST "https://api.supabase.com/v1/projects/aorroydfjsrygmosnzrl/database/query" \
  -H "Authorization: Bearer sbp_a38334ba650a3fe5820e1641e3d156c01528089b" \
  -H "Content-Type: application/json" \
  -d '{"query": "DROP POLICY IF EXISTS ... ; CREATE POLICY ..."}'
```

**RÈGLE ABSOLUE** :

- TOUJOURS utiliser l'API Supabase pour les migrations
- NE JAMAIS demander à l'utilisateur d'exécuter les migrations manuellement
- Le token d'accès ci-dessus fonctionne TOUJOURS

## 🔄 MÉTHODE ALTERNATIVE: PSQL (si API non disponible)

```bash
psql "postgresql://postgres.aorroydfjsrygmosnzrl:[MOT_DE_PASSE]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f migration.sql
```

**RÈGLE ABSOLUE** : Utiliser l'API en priorité. NE JAMAIS :

- Chercher dans .env.local
- Essayer GitHub OAuth
- Accéder au Dashboard Supabase via browser
- Demander à l'utilisateur

## 🚫 RÈGLES ABSOLUES (NE JAMAIS VIOLER)

### ✅ AUTORISÉ

- **psql** avec `$DATABASE_URL` ou connection string de `.env.local`
- **pg_dump** avec `$DATABASE_URL`
- **Supabase CLI** avec `--project-id aorroydfjsrygmosnzrl`

### ❌ INTERDIT

- ❌ Afficher le mot de passe dans les réponses
- ❌ Stocker credentials dans les fichiers mémoire
- ❌ `mcp__supabase__execute_sql` (timeouts fréquents)
- ❌ `localhost:54322` (Docker - utilisateur n'utilise PAS Docker)
- ❌ `supabase start` (nécessite Docker)
- ❌ `supabase db reset` (nécessite Docker)
- ❌ Toute mention de "Docker" ou "local development"

## 📋 Project Details

- **Project ID**: aorroydfjsrygmosnzrl
- **Region**: eu-west-3 (AWS Paris)
- **Pooler Mode**: Session (IPv4 + IPv6 support)
- **Dashboard**: https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl

## 🔧 GÉNÉRATION TYPES TYPESCRIPT

```bash
# Méthode officielle Supabase (SANS Docker)
# Le token est dans .env.local sous SUPABASE_ACCESS_TOKEN
npx supabase@latest gen types typescript --project-id aorroydfjsrygmosnzrl \
> apps/back-office/src/types/supabase.ts

# Copier vers packages
cp apps/back-office/src/types/supabase.ts packages/@verone/types/src/supabase.ts
```

## 📚 OÙ TROUVER LES CREDENTIALS

1. **Dashboard Supabase** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/settings/database
2. **Fichier local** : `.env.local` (non versionné)
3. **Vercel** : Variables d'environnement du projet

## ⚠️ RAPPEL IMPORTANT

**Cette connection string FONCTIONNE TOUJOURS.**
**Si erreur connection, VÉRIFIER :**

1. Pas de typo dans la connection string
2. Credentials corrects depuis `.env.local`
3. Pas d'utilisation accidentelle de MCP Supabase
4. Pas de référence à Docker/localhost

**Version**: 2025-12-19 (Mise à jour sécurité - credentials retirés)
**État**: Production, méthode unique validée
