# 🔧 DIAGNOSTIC RAPIDE - ERREURS POSSIBLES GROUPE 2

**Créé**: 2025-10-16 | **Version**: 1.0
**Support Debugger**: Temps réel pendant tests manuels

---

## ✅ ÉTAT ACTUEL BASE DE DONNÉES

### Validation Schéma (Vérifiée 2025-10-16)

```sql
-- ✅ CONFIRMÉ: Les 4 tables ont display_order
families      | display_order ✅
categories    | display_order ✅
subcategories | display_order ✅
collections   | display_order ✅
```

**Conclusion**: Schéma DB 100% correct, erreur #8 DEVRAIT être résolue.

⚠️ **ATTENTION**: Migration non enregistrée dans `supabase_migrations.schema_migrations`
→ **Impact**: Aucun sur fonctionnement, seulement sur tracking historique

---

## 🚨 ERREUR #1 - Serveur Dev Non Démarré

### Symptôme
```bash
# Navigateur affiche
"This site can't be reached"
"localhost refused to connect"
```

### Diagnostic Express

**Cause**: `npm run dev` non lancé
**Impact**: ❌ BLOQUANT - Aucun test possible
**Probabilité**: 🔴 ÉLEVÉE (serveur OFF détecté)

### Fix Immédiat (<30s)

```bash
cd /Users/romeodossantos/verone-back-office-V1
npm run dev
```

**Résultat attendu**:
```
✓ Ready in 2.5s
- Local:        http://localhost:3000
- Environments: .env.local
```

**Validation**:
```bash
curl http://localhost:3000
# ✅ HTML retourné = serveur actif
# ❌ Erreur connexion = serveur KO
```

---

## 🚨 ERREUR #2 - PGRST204 Display_order (Peu Probable)

### Symptôme
```javascript
// Console Browser (F12)
[Error] PGRST204
Column 'display_order' not found in table 'families'
```

### Diagnostic Express

**Cause Possible**: Cache Supabase client côté navigateur
**Impact**: ❌ BLOQUANT Test 2.1 (création famille)
**Probabilité**: 🟡 FAIBLE (schéma DB validé)

### Vérification Rapide

**Étape 1 - Confirmer schéma DB**:
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "\d families"
```

**Résultat attendu**:
```sql
Column         | Type    | Modifiers
---------------+---------+-----------
id             | uuid    | not null
name           | text    | not null
slug           | text    | not null
description    | text    |
is_active      | boolean | default true
display_order  | integer | default 0  ✅ Présent
created_at     | timestamp |
updated_at     | timestamp |
```

**Étape 2 - Test création directe SQL**:
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "
INSERT INTO families (name, description, display_order, slug)
VALUES ('test-debug-sql', 'Test diagnostic debugger', 99, 'test-debug-sql')
RETURNING id, name, display_order;"
```

**Interprétation**:
- ✅ Succès → DB OK, problème cache/code → Hard refresh (Ctrl+Shift+R)
- ❌ Erreur PGRST204 → DB KO, migration non appliquée → Voir Fix ci-dessous

### Fix Immédiat (Si DB KO - <2 min)

```bash
cd /Users/romeodossantos/verone-back-office-V1

# Réappliquer migration
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -f supabase/migrations/20251016_fix_display_order_columns.sql

# Vérifier application
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'families' AND column_name = 'display_order';"
```

**Résultat attendu**: `display_order` (1 ligne)

### Fix Alternatif (Cache Browser - <10s)

```bash
# Si DB OK mais erreur persiste
1. Ouvrir DevTools (F12)
2. Application → Storage → Clear site data
3. Fermer DevTools
4. Hard Refresh (Ctrl+Shift+R ou Cmd+Shift+R)
5. Retester création famille
```

---

## 🟠 ERREUR #3 - Duplicate Key 23505 (ATTENDUE)

### Symptôme
```javascript
// Console Browser
[Error] 409 Conflict
error: { code: "23505" }

// Toast UI
"Une famille avec ce nom existe déjà. Veuillez choisir un nom différent."
```

### Diagnostic

**Nature**: ✅ VALIDATION BUSINESS RULE (PostgreSQL constraint unique)
**Impact**: ✅ ATTENDU - Erreur #6 validée avec succès
**Probabilité**: 🟢 MOYENNE (si nom famille déjà utilisé)

### Action Recommandée

**Stratégie Tests**:
```javascript
// Utiliser noms uniques avec timestamp/compteur
Famille 1: "test-famille-2025-01"
Famille 2: "test-famille-2025-02"
Famille 3: "test-famille-2025-03"

// ❌ ÉVITER noms génériques
"Test", "Famille", "Example" → Risque duplicate élevé
```

**Validation Erreur #6**:
- [ ] Toast affiché avec message clair français ✅
- [ ] Message mentionne "nom existe déjà" ✅
- [ ] Formulaire reste ouvert (pas de fermeture) ✅
- [ ] Pas de code d'erreur brut (23505 masqué) ✅

**Si message technique visible** → Erreur #6 NON corrigée → Remonter

---

## 🟡 ERREUR #4 - Activity Tracking Warnings (NON-BLOQUANT)

### Symptôme
```javascript
// Console Browser
[Warn] ⚠️ Activity tracking insert error (non-bloquant)
Message: "RLS policy prevents insert"
```

### Diagnostic

**Nature**: Warning non-bloquant (Erreur #7 corrigée)
**Impact**: ✅ AUCUN sur workflow création famille/catégorie/etc.
**Probabilité**: 🟢 ÉLEVÉE (comportement attendu)

### Action Recommandée

**✅ IGNORER TOTALEMENT**

- Workflow création continue normalement
- Famille/catégorie créée avec succès
- Toast succès affiché
- Liste rafraîchie automatiquement

**⚠️ Remonter UNIQUEMENT SI**:
- Warning bloque création (impossible)
- Erreur au lieu de warning (régression)
- Workflow interrompu (pas de création)

---

## 🟠 ERREUR #5 - CORS Policy Images (Test 2.4 Uniquement)

### Symptôme
```javascript
// Console Browser (si upload image)
[Error] CORS policy: No 'Access-Control-Allow-Origin' header
Context: Upload image produit
URL: https://aorroydfjsrygmosnzrl.supabase.co/storage/v1/object/product-images/...
```

### Diagnostic

**Cause**: Supabase Storage bucket policy
**Impact**: ❌ BLOQUANT Upload images (Test 2.4 Produit avec image)
**Probabilité**: 🔴 POSSIBLE (selon config bucket)

### Fix Supabase Dashboard (<3 min)

**Accès Dashboard**:
```bash
1. Ouvrir https://supabase.com/dashboard
2. Login avec compte Vérone
3. Project: aorroydfjsrygmosnzrl
```

**Configuration CORS**:
```
Storage → Buckets → product-images → Settings

CORS Policy:
[
  {
    "origin": ["http://localhost:3000", "https://*.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "header": ["*"]
  }
]
```

**Validation**:
```bash
# Tester upload via cURL
curl -X POST \
  -H "Authorization: Bearer [ANON_KEY]" \
  -F "file=@test.jpg" \
  http://localhost:3000/api/upload

# ✅ Succès = CORS OK
# ❌ 403/CORS = Config KO
```

### Workaround Temporaire

**Si fix CORS impossible immédiatement**:
- ✅ Test 2.4 avec produit SANS image (optionnel)
- ✅ Valider workflow création/champs/validation
- ⏸️ Upload image différé à fix CORS

---

## 🔴 ERREUR #6 - Network Timeout Supabase

### Symptôme
```javascript
// Console Browser
[Error] Failed to fetch
Message: "Network request failed"
Context: Toute requête Supabase (fetch families, create, etc.)
```

### Diagnostic

**Causes Possibles**:
1. Session Pooler timeout (connexion DB)
2. Network local instable
3. Firewall bloque Supabase
4. Supabase service degradation (rare)

**Impact**: ❌ BLOQUANT - Aucune opération DB possible
**Probabilité**: 🟡 FAIBLE (service généralement stable)

### Fix Rapide (<2 min)

**Étape 1 - Vérifier connexion locale**:
```bash
# Ping Supabase
curl -I https://aorroydfjsrygmosnzrl.supabase.co

# ✅ Réponse HTTP = Service OK
# ❌ Timeout = Network/Firewall issue
```

**Étape 2 - Tester connexion DB directe**:
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT NOW();"

# ✅ Timestamp retourné = DB accessible
# ❌ Timeout = Pooler down
```

**Étape 3 - Fallback Direct Connection**:
```bash
# Si Session Pooler (5432) timeout
# Essayer Direct Connection (6543)

PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 6543 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT NOW();"
```

**Étape 4 - Wait & Retry**:
```bash
# Si tous échouent
1. Wait 30-60 secondes (connexions pool reset)
2. Hard refresh navigateur (Ctrl+Shift+R)
3. Retester création famille
4. Si persistant → Vérifier Supabase Status (status.supabase.com)
```

---

## 🟢 ERREUR #7 - TypeScript Types Obsolètes (Peu Probable)

### Symptôme
```javascript
// Console Browser
[Error] Type error: Property 'display_order' does not exist on type 'Family'
Context: Code TypeScript hooks/use-families.ts
```

### Diagnostic

**Cause**: Types Supabase générés avant migration display_order
**Impact**: ⚠️ SEMI-BLOQUANT (compile error possible)
**Probabilité**: 🟡 TRÈS FAIBLE (types générés post-migration)

### Fix (<1 min)

```bash
cd /Users/romeodossantos/verone-back-office-V1

# Régénérer types Supabase
npm run supabase:types

# OU commande directe
npx supabase gen types typescript --project-id aorroydfjsrygmosnzrl > src/lib/supabase/types.ts
```

**Validation**:
```bash
# Vérifier display_order présent
grep -A 5 "families.*Row" src/lib/supabase/types.ts | grep display_order

# ✅ display_order: number | null → Type OK
# ❌ Rien → Types obsolètes, relancer commande
```

---

## ⚡ ERREUR #8 - RLS Policy Denial (Rare)

### Symptôme
```javascript
// Console Browser
[Error] 403 Forbidden
Message: "new row violates row-level security policy"
Context: INSERT INTO families
```

### Diagnostic

**Cause**: Policy RLS bloque insertion (user_id/organisation manquant)
**Impact**: ❌ BLOQUANT Création famille
**Probabilité**: 🟢 TRÈS FAIBLE (policies testées)

### Vérification Rapide

**Check user context**:
```bash
# Ouvrir Console Browser (F12)
# Taper:
await supabase.auth.getUser()

# ✅ Résultat attendu:
{
  user: {
    id: "xxx-xxx-xxx",
    email: "user@verone.com",
    user_metadata: { organisation_id: "xxx" }
  }
}

# ❌ user: null → Pas authentifié → Login requis
```

**Test policy direct**:
```sql
-- Vérifier policy families
PGPASSWORD="ADFVKDJCJDNC934" psql ... -c "
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'families';"

-- ✅ Attendu: Policies INSERT pour authenticated users
```

### Fix

**Si user null**:
```
1. Naviguer http://localhost:3000/login
2. Authentifier (email/password ou OAuth)
3. Retourner catalogue
4. Retester création famille
```

**Si policy stricte**:
→ Remonter à orchestrateur (fix RLS requis)

---

## 📊 CHECKLIST PRÉ-TESTS (5 min)

Avant de démarrer tests GROUPE 2, valider:

### Environnement
- [ ] Serveur dev actif (`npm run dev` → Ready)
- [ ] http://localhost:3000 accessible (cURL 200)
- [ ] Console DevTools ouverte (F12)
- [ ] Network tab active (monitoring requêtes)

### Base de Données
- [ ] Schéma validé (display_order présent 4 tables)
- [ ] Connexion Supabase testée (psql SELECT NOW())
- [ ] Aucune migration pending (check supabase status)

### Authentification
- [ ] User logged in (supabase.auth.getUser() → user object)
- [ ] Organisation définie (user_metadata.organisation_id)
- [ ] Session valide (pas de 401 errors)

### Données Test
- [ ] Noms familles uniques préparés (test-2025-XX)
- [ ] Descriptions variées (short/long/empty)
- [ ] Display_order valeurs (0, 1, 5, 99, -1)

---

## 🧪 COMMANDES DIAGNOSTIC UTILES

### Connexion DB Rapide
```bash
# Alias pratique
alias psql-verone='PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres'

# Usage
psql-verone -c "SELECT * FROM families ORDER BY display_order LIMIT 5;"
```

### Vérifier Migrations Appliquées
```bash
psql-verone -c "
SELECT version, name, inserted_at
FROM supabase_migrations.schema_migrations
WHERE version >= '20251016'
ORDER BY version DESC
LIMIT 10;"
```

### Tester Création Famille Direct SQL
```bash
psql-verone -c "
INSERT INTO families (name, slug, description, display_order)
VALUES (
  'test-diagnostic-$(date +%s)',
  'test-diagnostic-$(date +%s)',
  'Test automatique debugger',
  999
)
RETURNING id, name, display_order, created_at;"
```

**Interprétation**:
- ✅ Succès → DB 100% opérationnelle
- ❌ Erreur column → Migration KO
- ❌ Erreur RLS → Policy bloque

### Nettoyer Données Test
```bash
# Supprimer toutes familles test-*
psql-verone -c "
DELETE FROM families
WHERE name LIKE 'test-%'
RETURNING id, name;"
```

### Vérifier Logs Supabase Realtime
```bash
# Monitoring live des requêtes
# Dashboard Supabase → Logs → API Logs
# Filter: "families" OR "categories"
# Time: Last 15 minutes
```

---

## 🚀 ACTIONS CORRECTIVES URGENTES

### Si Migration Display_order Non Appliquée
```bash
cd /Users/romeodossantos/verone-back-office-V1
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -f supabase/migrations/20251016_fix_display_order_columns.sql

# Validation immédiate
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'display_order'
AND table_name IN ('families', 'categories', 'subcategories', 'collections')
ORDER BY table_name;"

# ✅ Attendu: 4 lignes (1 par table)
```

### Si Code Contient sort_order Résiduel
```bash
# Scan exhaustif
grep -r "sort_order" src/ --include="*.ts" --include="*.tsx"

# ✅ Attendu: 0 résultat
# ❌ Si matches → Fichiers à corriger:
# - src/hooks/use-families.ts
# - src/hooks/use-categories.ts
# - src/hooks/use-subcategories.ts
# - src/hooks/use-collections.ts
# - src/components/forms/*-form.tsx
```

### Si Serveur Dev Crash
```bash
# Kill process zombie
lsof -ti:3000 | xargs kill -9

# Restart propre
cd /Users/romeodossantos/verone-back-office-V1
npm run dev

# Vérifier démarrage
curl -I http://localhost:3000
# ✅ HTTP/1.1 200 OK
```

### Si Cache Browser Corrompu
```bash
# Chrome/Edge DevTools (F12)
1. Application → Storage → Clear site data ✅
2. Network → Disable cache ✅
3. Hard Refresh (Cmd+Shift+R) ✅

# Firefox DevTools
1. Storage → Clear All ✅
2. Network → Settings → Disable cache ✅
3. Hard Refresh (Cmd+Shift+R) ✅
```

---

## 📞 ESCALATION & SUPPORT

### Temps Réponse Garantis

| Priorité | Délai | Exemple |
|----------|-------|---------|
| 🔴 P0 - BLOQUANT | <2 min | Serveur crash, DB down |
| 🟠 P1 - CRITIQUE | <5 min | PGRST204, RLS denial |
| 🟡 P2 - MAJEUR | <10 min | CORS, timeout intermittent |
| 🟢 P3 - MINEUR | <15 min | Warning logs, types obsolètes |

### Informations Requises

**Pour signaler erreur**:
```markdown
## Erreur Détectée

**Test**: GROUPE 2 - Test 2.X (spécifier)
**Symptôme**: [Copier message exact console]
**Stack Trace**: [Copier trace complète si dispo]
**Screenshot**: [Capture DevTools console]

**Actions Déjà Tentées**:
- [ ] Hard refresh
- [ ] Clear cache
- [ ] Vérification DB (psql)
- [ ] Autre: _______

**Comportement Attendu**: [Ce qui devrait se passer]
**Comportement Réel**: [Ce qui se passe vraiment]
```

### Contact Debugger

**Disponibilité**: Pendant toute exécution GROUPE 2
**Réponse**: Temps réel (<2 min pour P0/P1)
**Mode**: Claude Code conversation active

---

## 🎯 RÉSUMÉ ERREURS PAR PROBABILITÉ

### 🔴 ÉLEVÉE (>60% chance)
1. **Serveur Dev Non Démarré** → npm run dev
2. **Activity Tracking Warnings** → IGNORER (non-bloquant)

### 🟡 MOYENNE (20-60% chance)
3. **Duplicate Key 23505** → Noms uniques (test-2025-XX)
4. **CORS Images** → Fix Supabase Dashboard (si upload)

### 🟢 FAIBLE (<20% chance)
5. **PGRST204 Display_order** → Cache browser (hard refresh)
6. **Network Timeout** → Wait 30s + retry
7. **TypeScript Types** → Régénérer (npm run supabase:types)
8. **RLS Policy** → Vérifier auth user

---

## ✅ VALIDATION POST-FIX

Après chaque fix appliqué:

### Vérification Technique
- [ ] Console browser 100% clean (0 errors)
- [ ] Network tab: requêtes 200/201 (success)
- [ ] Database: INSERT confirmé (SELECT * FROM families)
- [ ] UI: Toast succès affiché

### Vérification Fonctionnelle
- [ ] Famille créée visible dans liste
- [ ] Display_order respecté (tri correct)
- [ ] Édition/suppression fonctionnelles
- [ ] Navigation fluide (pas de freeze)

### Documentation
- [ ] Screenshot console clean (preuve)
- [ ] Commandes fix documentées (si custom)
- [ ] Temps résolution noté (<X min)
- [ ] Mise à jour session report

---

**FIN DU DOCUMENT DIAGNOSTIC**

**Version**: 1.0 | **Dernière MAJ**: 2025-10-16
**Support**: Debugger Vérone | **Disponibilité**: Temps réel GROUPE 2

Bon courage pour les tests ! 🚀
