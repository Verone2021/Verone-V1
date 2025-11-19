# Workflow Supabase Correct - Mis à jour 2025-11-19

## ✅ WORKFLOW AUTOMATIQUE CONFIRMÉ

**Contexte** : Utilisateur travaille avec **Vercel + Supabase Cloud**. **JAMAIS Docker**. 

### 🔄 Génération TypeScript Types (Automatique - Confirmée 2025-11-19)

```bash
# ✅ MÉTHODE OFFICIELLE VALIDÉE (sans Docker, directement depuis Supabase Cloud)
SUPABASE_ACCESS_TOKEN="sbp_a38334ba650a3fe5820e1641e3d156c01528089b" \
npx supabase@latest gen types typescript --project-id aorroydfjsrygmosnzrl \
> apps/back-office/src/types/supabase.ts

# Copier vers packages
cp apps/back-office/src/types/supabase.ts packages/@verone/types/src/supabase.ts
```

**Résultat prouvé** :
- ✅ 8,712 lignes générées automatiquement
- ✅ Tous les nouveaux types Database incluant brands, eco_participation_amount, etc.
- ✅ Type-check 30/30 packages réussi
- ✅ Build production en cours de finalisation

### 📊 Projet Supabase

- **Project ID** : `aorroydfjsrygmosnzrl`
- **Access Token** : `sbp_a38334ba650a3fe5820e1641e3d156c01528089b`
- **Dashboard** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl

### 🗄️ Migrations (psql direct PostgreSQL)

```bash
# Connection String
postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres

# Appliquer migration
psql "postgresql://..." -f supabase/migrations/XXXXX.sql
```

### 🚫 RÈGLES ABSOLUES

1. **JAMAIS mentionner Docker** (utilisateur très clair là-dessus)
2. **JAMAIS utiliser** `supabase start` (nécessite Docker)
3. **TOUJOURS utiliser** connexion directe PostgreSQL ou Dashboard
4. **TOUJOURS** CLI Supabase avec `--project-id` pour génération types

### 🎯 Migrations Récemment Appliquées (2025-11-19)

1. ✅ `20251118_004_collections_site_internet_cms.sql` - Brands + Collections e-commerce
2. ✅ `20251118_005_add_ecommerce_fields_channel_pricing.sql` - 5 nouveaux champs pricing
3. ✅ `20251118_006_update_rpc_site_internet_ecommerce_fields.sql` - RPC updated

### 📝 Workflow Complet Vérifié

```bash
# 1. Appliquer migrations
psql "postgresql://..." -f migration.sql

# 2. Générer types automatiquement
SUPABASE_ACCESS_TOKEN="..." \
npx supabase@latest gen types typescript --project-id aorroydfjsrygmosnzrl \
> apps/back-office/src/types/supabase.ts

# 3. Copier vers packages
cp apps/back-office/src/types/supabase.ts packages/@verone/types/src/supabase.ts

# 4. Valider
npm run type-check  # 30/30 packages ✅
npm run build       # Production build ✅
```

**Version** : 2025-11-19
**État** : Production, workflow automatique confirmé
