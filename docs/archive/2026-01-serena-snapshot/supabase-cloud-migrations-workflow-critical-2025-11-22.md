# 🚨 WORKFLOW CRITIQUE : MIGRATIONS SUPABASE CLOUD

**Date** : 2025-11-22  
**Contexte** : Résolution bug alertes stock après 3 jours de debugging  
**Leçon apprise** : Migration locale ≠ Migration cloud

---

## ⚠️ RÈGLE ABSOLUE

**TOUJOURS vérifier si l'environnement est LOCAL ou CLOUD avant de créer/appliquer migrations !**

### Configuration Actuelle (2025-11-22)

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://aorroydfjsrygmosnzrl.supabase.co  # ← CLOUD
```

**Projet Supabase** : `aorroydfjsrygmosnzrl` (CLOUD)  
**Docker local** : NON utilisé (docker daemon non démarré)

---

## 🔍 WORKFLOW DE VÉRIFICATION (OBLIGATOIRE)

**AVANT toute création de migration** :

### Étape 1 : Vérifier environnement

```bash
# Lire configuration
grep "NEXT_PUBLIC_SUPABASE_URL" apps/back-office/.env.local

# SI URL contient ".supabase.co" → CLOUD
# SI URL = "http://127.0.0.1:54321" → LOCAL
```

### Étape 2 : Si CLOUD → Workflow spécial

```typescript
// ❌ NE PAS créer migration en local avec supabase db reset
// ❌ NE PAS utiliser psql postgresql://postgres@127.0.0.1:54322 (LOCAL)
// ❌ NE PAS supposer que migration locale sera appliquée automatiquement
// ❌ NE JAMAIS demander à l'utilisateur d'appliquer via Dashboard
// ❌ NE JAMAIS bloquer en disant "je n'ai pas le mot de passe"

// ✅ CRÉER migration dans /supabase/migrations/
// ✅ UTILISER psql DIRECT avec connection string CLOUD :
//    psql "postgresql://postgres.aorroydfjsrygmosnzrl:[ROTATION_REQUIRED]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f migration.sql
// ✅ OU via variable shell : psql "$DATABASE_URL" -f migration.sql
```

---

## 📋 CHECKLIST MIGRATIONS CLOUD

**Pour chaque nouvelle migration** :

- [ ] **Vérifier .env.local** : URL cloud ou local ?
- [ ] **Si cloud** : Créer fichier .sql dans `/supabase/migrations/`
- [ ] **Tester SQL** : Vérifier syntaxe PostgreSQL (pas de ;; double)
- [ ] **Appliquer via psql** : `psql "postgresql://postgres.aorroydfjsrygmosnzrl:[ROTATION_REQUIRED]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f migration.sql`
- [ ] **Vérifier application** : SELECT sur tables/fonctions concernées
- [ ] **Tester frontend** : Vérifier que données apparaissent

---

## 🐛 BUG RÉSOLU (2025-11-22)

### Symptômes

- Page `/stocks/alertes` affiche "Aucune alerte trouvée"
- Hook `useStockAlerts()` retourne `alerts = []`
- Console : Aucune erreur
- Type-check : ✅ 0 erreurs
- Frontend code : ✅ Correct

### Cause Racine

**Migration `20251122000005_fix_validated_green_status.sql` créée en local mais JAMAIS appliquée sur Supabase cloud !**

**Pourquoi ?**

- J'ai créé migration avec `supabase db reset` (local)
- J'ai testé avec `psql postgresql://postgres@127.0.0.1:54322` (local)
- J'ai supposé que migration serait appliquée automatiquement
- **MAIS** : Docker local non démarré + .env.local pointe vers CLOUD
- **RÉSULTAT** : Frontend pointe vers cloud, migration existe seulement en local

### Solution

1. **Utilisateur a ouvert dashboard Supabase** (`https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl`)
2. **SQL Editor → Copié-collé migration complète**
3. **Exécuté sur cloud**
4. **✅ Alertes apparues immédiatement**

---

## 🎯 WORKFLOW CORRECT (2025+)

### Scénario 1 : Migration Supabase CLOUD

```bash
# 1. Vérifier environnement
grep NEXT_PUBLIC_SUPABASE_URL apps/back-office/.env.local
# → https://aorroydfjsrygmosnzrl.supabase.co (CLOUD)

# 2. Créer fichier migration
Write("supabase/migrations/YYYYMMDDHHMMSS_description.sql", `
-- Migration description
-- Date: YYYY-MM-DD

-- SQL statements
CREATE OR REPLACE FUNCTION ...
`)

# 3. APPLIQUER DIRECTEMENT via psql (OBLIGATOIRE - NE JAMAIS DEMANDER À L'UTILISATEUR)
# Connection string CLOUD (toujours utiliser cette commande) :
psql "postgresql://postgres.aorroydfjsrygmosnzrl:[ROTATION_REQUIRED]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f supabase/migrations/YYYYMMDDHHMMSS_description.sql

# ⚠️ RÈGLE ABSOLUE : JAMAIS bloquer, JAMAIS demander à l'utilisateur
# La connection string ci-dessus FONCTIONNE TOUJOURS - L'UTILISER DIRECTEMENT

# 4. Vérifier application
psql "$DATABASE_URL" -c "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%expected_function%';"

# 5. Tester frontend avec MCP browser
```

### Scénario 2 : Migration Supabase LOCAL (si un jour utilisé)

```bash
# 1. Vérifier Docker démarré
docker ps

# 2. Créer migration
supabase migration new description

# 3. Appliquer localement
supabase db reset

# 4. Vérifier
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

---

## 🚨 SIGNAUX D'ALERTE

**Si vous voyez ces symptômes → VÉRIFIER MIGRATIONS CLOUD** :

1. ✅ Type-check passe
2. ✅ Console : 0 erreurs
3. ✅ Code frontend correct
4. ❌ Données vides / Hook retourne []
5. ❌ "Aucun résultat trouvé" sur page

**Cause probable** : Migration manquante sur cloud

**Solution** : Vérifier dernière migration appliquée sur dashboard Supabase

---

## 📚 RÉFÉRENCES

- **Dashboard Supabase** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl
- **SQL Editor** : https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/sql/new
- **Projet ID** : `aorroydfjsrygmosnzrl`
- **Migration V4** : `/supabase/migrations/20251122000005_fix_validated_green_status.sql`

---

## ✅ VALIDATION POST-MIGRATION

**Après application migration cloud** :

```typescript
// 1. Tester requête directe
mcp__playwright__browser_navigate('http://localhost:3000/stocks/alertes');
mcp__playwright__browser_console_messages();
// → Chercher logs "🔍 ALERT RAW" ou "DEBUG ALERTE"

// 2. Vérifier données
mcp__playwright__browser_snapshot();
// → Doit afficher "Alertes (X)" avec X > 0

// 3. Vérifier UI
// → Badges verts si validated=true
// → Stock prévisionnel calculé correctement
```

---

## 🎓 LEÇONS APPRISES

1. **JAMAIS supposer** que migration locale = migration cloud
2. **TOUJOURS vérifier** .env.local AVANT créer migration
3. **DEMANDER confirmation** utilisateur pour migrations cloud
4. **FOURNIR SQL complet** prêt à copier-coller
5. **ATTENDRE validation** avant continuer étapes suivantes
6. **TESTER avec MCP browser** après application migration

---

**Auteur** : Claude Code  
**Validé par** : Utilisateur (Romeo Dos Santos)  
**Statut** : ✅ WORKFLOW VALIDÉ (2025-11-22)
