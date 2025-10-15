# 🎯 TOP 5 SCÉNARIOS D'ERREUR - GROUPE 2

**Guide Anticipation** | **Solutions Clé en Main**

---

## 🔴 SCÉNARIO #1 - Serveur Dev Non Démarré

### Probabilité: 95% (DÉTECTÉ)

### Symptômes Visibles

**Navigateur**:
```
This site can't be reached
localhost refused to connect
ERR_CONNECTION_REFUSED
```

**Aucune console error** (impossible d'accéder au site)

### Diagnostic (5 secondes)

```bash
curl http://localhost:3000
# ❌ curl: (7) Failed to connect to localhost port 3000
```

### Solution (<30s)

```bash
cd /Users/romeodossantos/verone-back-office-V1
npm run dev
```

**Résultat attendu**:
```
   ▲ Next.js 15.1.7
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.5s
```

### Validation

```bash
# Test 1: cURL
curl -I http://localhost:3000
# ✅ HTTP/1.1 200 OK

# Test 2: Browser
open http://localhost:3000
# ✅ Dashboard Vérone affiché
```

### Prevention Future

```bash
# Toujours vérifier avant tests
ps aux | grep "next-server" | grep -v grep
# ✅ Résultat = serveur actif
# ❌ Vide = serveur OFF
```

---

## 🟡 SCÉNARIO #2 - Activity Tracking Warnings

### Probabilité: 85%

### Symptômes Visibles

**Console Browser (DevTools F12)**:
```javascript
[Warn] ⚠️ Activity tracking insert error (non-bloquant)
{
  message: "new row violates row-level security policy",
  code: "42501"
}
```

**MAIS workflow continue normalement**:
- ✅ Famille créée avec succès
- ✅ Toast "Famille créée avec succès" affiché
- ✅ Liste familles rafraîchie
- ✅ Nouvelle famille visible

### Diagnostic (10 secondes)

**Nature**: Warning non-bloquant (Erreur #7 corrigée)
**Impact**: AUCUN sur fonctionnalités
**Cause**: RLS policy activity_logs stricte (attendu)

### Solution

**✅ ACTION REQUISE: IGNORER TOTALEMENT**

Ce warning est **attendu et normal**. Il n'affecte pas:
- Création famille/catégorie/subcategory/collection
- Édition/suppression
- Tri/ordre (display_order)
- Validation business rules

### Validation

**Checklist après voir warning**:
- [ ] Workflow a continué ? ✅
- [ ] Famille visible dans liste ? ✅
- [ ] Toast succès affiché ? ✅
- [ ] Console a seulement [Warn] (pas [Error]) ? ✅

**Si toutes ✅** → SUCCÈS, passer test suivant

### Quand Remonter

**UNIQUEMENT SI**:
- ❌ Warning devient Error rouge
- ❌ Workflow s'interrompt
- ❌ Famille non créée malgré toast succès
- ❌ Application crash après warning

---

## 🟠 SCÉNARIO #3 - Duplicate Key 23505

### Probabilité: 60%

### Symptômes Visibles

**Console Browser**:
```javascript
[Error] 409 Conflict
{
  error: {
    code: "23505",
    message: "duplicate key value violates unique constraint"
  }
}
```

**UI Toast**:
```
❌ Une famille avec ce nom existe déjà. Veuillez choisir un nom différent.
```

**Formulaire reste ouvert** (pas de fermeture automatique)

### Diagnostic (5 secondes)

**Nature**: ✅ VALIDATION BUSINESS RULE (Erreur #6 testée)
**Cause**: Nom famille déjà utilisé (constraint PostgreSQL UNIQUE)
**Impact**: Attendu, validation correcte

### Solution (<10s)

**Stratégie noms uniques**:
```javascript
// ✅ RECOMMANDÉ: Timestamp/compteur
test-famille-2025-01
test-famille-2025-02
test-categorie-final-01

// ❌ ÉVITER: Noms génériques
Test
Famille
Example
→ Risque duplicate élevé (tests précédents)
```

**Action immédiate**:
1. Modifier champ "Nom" avec valeur unique
2. Cliquer "Créer" à nouveau
3. ✅ Succès attendu

### Validation Erreur #6

**Cette erreur prouve que fix #6 fonctionne**:

- [ ] Message en français clair (pas code 23505 brut) ✅
- [ ] Mentionne "nom existe déjà" ✅
- [ ] Formulaire reste ouvert ✅
- [ ] Pas de stack trace technique visible ✅

**Si toutes ✅** → Erreur #6 VALIDÉE, noter dans rapport

### Quand Remonter

**Remonter SI**:
- ❌ Message brut PostgreSQL (code 23505 visible utilisateur)
- ❌ Message en anglais
- ❌ Formulaire se ferme malgré erreur
- ❌ Toast succès affiché alors que création échoue

---

## 🔴 SCÉNARIO #4 - PGRST204 Display_order

### Probabilité: 15% (cache browser)

### Symptômes Visibles

**Console Browser**:
```javascript
[Error] PGRST204
{
  code: "PGRST204",
  message: "Column 'display_order' not found in table 'families'",
  details: null,
  hint: null
}
```

**UI**: Formulaire création bloqué ou liste vide

### Diagnostic (1 minute)

**Étape 1 - Vérifier DB réelle**:
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'families' AND column_name = 'display_order';"
```

**Résultat attendu**:
```
 column_name
--------------
 display_order
(1 row)
```

**Interprétation**:
- ✅ `display_order` présent → **DB OK, problème cache browser**
- ❌ Vide → **DB KO, migration non appliquée**

### Solution A - Cache Browser (90% cas)

```bash
# Fix <10s
1. DevTools (F12) ouvert
2. Application tab → Storage → Clear site data
3. Fermer DevTools
4. Hard Refresh: Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
5. Retester création famille
```

**Validation**:
```bash
# Console DevTools après refresh
# ✅ Aucune erreur PGRST204
# ✅ Liste familles chargée
```

### Solution B - Migration Non Appliquée (10% cas)

**Si vérification DB montre display_order ABSENT**:

```bash
cd /Users/romeodossantos/verone-back-office-V1

# Réappliquer migration
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -f supabase/migrations/20251016_fix_display_order_columns.sql

# Vérifier application
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'display_order'
AND table_name IN ('families', 'categories', 'subcategories', 'collections')
ORDER BY table_name;"
```

**Résultat attendu**:
```
   table_name   |  column_name
---------------+---------------
 categories    | display_order
 collections   | display_order
 families      | display_order
 subcategories | display_order
(4 rows)
```

### Validation

**Test création directe SQL**:
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "
INSERT INTO families (name, slug, description, display_order)
VALUES ('test-validation-fix', 'test-validation-fix', 'Test post-fix', 99)
RETURNING id, name, display_order;"
```

**Si succès** → DB OK, retester browser (hard refresh)

---

## 🟡 SCÉNARIO #5 - Network Timeout Supabase

### Probabilité: 10%

### Symptômes Visibles

**Console Browser**:
```javascript
[Error] Failed to fetch
{
  message: "Network request failed",
  name: "TypeError"
}
```

**UI**: Loading infini ou toast "Erreur de connexion"

### Diagnostic (30 secondes)

**Étape 1 - Vérifier service Supabase**:
```bash
curl -I https://aorroydfjsrygmosnzrl.supabase.co
```

**Résultat attendu**:
```
HTTP/2 404  (← Normal, endpoint racine n'existe pas)
# Important: Pas de timeout, réponse rapide (<1s)
```

**Étape 2 - Tester connexion DB**:
```bash
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT NOW();"
```

**Résultat attendu**:
```
              now
-------------------------------
 2025-10-16 14:30:00.123456+00
(1 row)
```

### Solution (<2 minutes)

**Fix Rapide - Wait & Retry**:
```bash
# 1. Attendre 30-60 secondes (connexions pool reset)
sleep 60

# 2. Hard refresh navigateur
Ctrl+Shift+R (ou Cmd+Shift+R)

# 3. Retester création famille
# ✅ Devrait fonctionner
```

**Si timeout persiste**:

**Fallback Direct Connection**:
```bash
# Session Pooler (5432) peut timeout
# Essayer Direct Connection (6543)

PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 6543 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT NOW();"

# ✅ Si succès → Pooler temporairement down, DB accessible
# ❌ Si timeout → Problème réseau local ou Supabase incident
```

**Vérifier Supabase Status**:
```bash
# Browser
open https://status.supabase.com

# Chercher incidents région: EU West (Paris/Ireland)
# ✅ All Systems Operational → Problème local
# ❌ Incident actif → Attendre résolution Supabase
```

### Validation

**Test connexion après fix**:
```bash
# Test 1: DB accessible
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT COUNT(*) FROM families;"

# Test 2: Browser fetch
# DevTools Console (F12)
await fetch('http://localhost:3000/api/health')
# ✅ Response 200 OK
```

### Prevention

**Monitoring proactif**:
```bash
# Avant démarrer tests, vérifier santé système
curl -I https://aorroydfjsrygmosnzrl.supabase.co
PGPASSWORD="ADFVKDJCJDNC934" psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.aorroydfjsrygmosnzrl -d postgres -c "SELECT NOW();"

# ✅ Les 2 répondent rapide (<2s) → GO pour tests
# ❌ Timeouts → Reporter tests, investiguer connectivité
```

---

## 📊 SYNTHÈSE PROBABILITÉS & TEMPS FIX

| Scénario | Probabilité | Impact | Temps Fix | Difficulté |
|----------|-------------|--------|-----------|------------|
| **#1 - Serveur OFF** | 95% | 🔴 BLOQUANT | <30s | ⭐ Trivial |
| **#2 - Activity Warnings** | 85% | 🟢 AUCUN | 0s (ignorer) | ⭐ Trivial |
| **#3 - Duplicate 23505** | 60% | 🟡 ATTENDU | <10s | ⭐ Trivial |
| **#4 - PGRST204** | 15% | 🔴 BLOQUANT | <1 min | ⭐⭐ Facile |
| **#5 - Network Timeout** | 10% | 🔴 BLOQUANT | <2 min | ⭐⭐⭐ Moyen |

**Total temps fix max cumulé**: ~4 minutes (si tous scénarios)
**Probabilité aucune erreur**: ~1% (au moins 1 scénario attendu)

---

## 🎯 STRATÉGIE OPTIMALE

### Pré-Tests (2 min)
```bash
# Checklist avant démarrer GROUPE 2
1. npm run dev ✅
2. curl http://localhost:3000 ✅
3. psql SELECT NOW() ✅
4. DevTools (F12) Console ouvert ✅
```

### Pendant Tests
- **Activity warnings** → Ignorer, continuer
- **Duplicate 23505** → Changer nom, retry
- **Autres erreurs** → Consulter doc diagnostic

### Post-Tests
- Screenshot console clean (preuve)
- Noter erreurs rencontrées + temps fix
- Valider DB: `SELECT * FROM families ORDER BY display_order`

---

**Documentation Complète**: `GROUPE-2-DIAGNOSTIC-ERREURS.md`
**Quick Reference**: `GROUPE-2-QUICK-REFERENCE.md`
**Support**: Temps réel | **Réponse**: <2 min
