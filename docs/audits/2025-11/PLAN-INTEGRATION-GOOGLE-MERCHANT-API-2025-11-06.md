# 🎯 PLAN MASTER - Intégration Google Merchant API Officielle

**Date création** : 2025-11-06
**Statut** : EN ATTENTE VALIDATION UTILISATEUR
**Criticité** : HIGH - Production-ready requirement
**Durée estimée totale** : 14-20 heures (sur 3-5 jours)
**Tolérance erreurs** : **ZÉRO**

---

## 📋 ÉTAT ACTUEL (Baseline)

### ✅ Ce qui EXISTE et FONCTIONNE

**Database** (100% OK) :
- ✅ 3 tables créées (migrations 117, 118) : `google_merchant_syncs`, `channel_product_metadata`, `channel_product_pricing`
- ✅ Waterfall pricing implémenté (migration 120) : channel → base → calculated
- ✅ 8 RPCs fonctionnels : `batch_add`, `get_products`, `update_price`, `update_metadata`, etc.
- ✅ Indexes performance (11 indexes créés)
- ✅ RLS policies sécurité

**Frontend** (95% OK) :
- ✅ Page `/canaux-vente/google-merchant` avec design Table scalable
- ✅ 10 hooks React Query
- ✅ UI complète 3 onglets (Produits / Stats / Paramètres)

**API Routes** (70% OK - MOCK) :
- ✅ 7 routes créées
- ⚠️ **PROBLÈME** : Appels Google API actuellement MOCKÉS (pas de vraie sync)

**Credentials** :
- ✅ Google Merchant ID : `5495521926`
- ✅ Service Account email existe dans `.env.local`
- ⚠️ **À VÉRIFIER** : Clés valides et permissions OK

### ❌ Ce qui MANQUE (Gaps)

| Gap | Impact | Effort |
|-----|--------|--------|
| **Appels API Google réels** | HIGH - Produits pas vraiment synchronisés | 4h |
| **Cron job polling statuts** | MEDIUM - Statuts jamais refreshés | 2h |
| **Migration 121 (optionnelle)** | LOW - Optimisations mineures | 30min |

---

## 🗺️ PLAN EN 6 PHASES

### PHASE 0 : Nettoyage & Préparation 🧹
**Durée** : 1-2 heures
**Objectif** : Repartir sur base propre

#### Tâches
- [ ] **0.1** Audit état actuel (30 min)
  - SQL : Compter produits Google Merchant dans DB
  - Identifier métadonnées orphelines
  - Documenter état dans `/docs/audits/google-merchant-cleanup-2025-11-06.md`

- [ ] **0.2** Backup database (15 min)
  ```sql
  CREATE TABLE channel_product_metadata_backup_20251106 AS
  SELECT * FROM channel_product_metadata WHERE channel = 'google_merchant';

  CREATE TABLE channel_product_pricing_backup_20251106 AS
  SELECT * FROM channel_product_pricing WHERE channel = 'google_merchant';
  ```

- [ ] **0.3** Nettoyage Google Merchant Center (30 min)
  - Login https://merchants.google.com/mc/items?a=5495521926
  - Supprimer TOUS produits via batch delete
  - Vérifier liste produits = VIDE

- [ ] **0.4** Nettoyage Database Vérone (30 min)
  ```sql
  -- Vérifier AVANT (noter le COUNT)
  SELECT COUNT(*) FROM google_merchant_syncs;

  -- Supprimer TOUS (soft delete)
  UPDATE google_merchant_syncs SET sync_status = 'deleted', deleted_at = NOW();

  -- OU hard delete si demandé
  DELETE FROM google_merchant_syncs;

  -- Vérifier APRÈS = 0
  SELECT COUNT(*) FROM google_merchant_syncs;
  ```

#### Critères succès
✅ 0 produits dans Google Merchant Center
✅ 0 entrées actives `google_merchant_syncs`
✅ Backup créé et testé
✅ Rapport audit documenté

---

### PHASE 1 : Authentification Google API 🔐
**Durée** : 2-3 heures
**Objectif** : Valider connexion API réelle

#### Tâches
- [ ] **1.1** Vérifier Google Cloud Setup (45 min)
  - Console : https://console.cloud.google.com/apis/library/content.googleapis.com
  - ✅ Projet : `verone-merchant-api` (ou existant)
  - ✅ API "Content API for Shopping" ENABLED
  - ✅ Service Account : `verone-merchant-service@PROJECT_ID.iam.gserviceaccount.com`
  - ✅ Clé JSON téléchargée

- [ ] **1.2** Vérifier Merchant Center Access (30 min)
  - Login https://merchants.google.com
  - Paramètres → Utilisateurs
  - ✅ Service Account email ajouté comme ADMIN
  - ✅ Merchant ID confirmé : `5495521926`

- [ ] **1.3** Vérifier Credentials Stockés (30 min)
  - Vercel Dashboard → Environment Variables
  - ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - ✅ `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
  - ✅ `GOOGLE_MERCHANT_ID=5495521926`
  - `.env.local` sync avec Vercel

- [ ] **1.4** Implémenter Google Auth Client (45 min)
  - Fichier : `/src/lib/google-merchant/auth.ts`
  - JWT Service Account auth
  - Scopes : `['https://www.googleapis.com/auth/content']`

- [ ] **1.5** Test Connexion (30 min)
  - Route : `/src/app/api/google-merchant/test-connection/route.ts`
  - Test : `curl http://localhost:3000/api/google-merchant/test-connection`
  - Retour attendu : `{ success: true, merchantId: "5495521926", accountName: "..." }`

#### Critères succès
✅ Service Account avec rôle correct
✅ API enabled dans Google Cloud
✅ Test connexion retourne `success: true`
✅ Account name affiché

---

### PHASE 2 : Database Optimisations (Optionnel) 🗄️
**Durée** : 30 minutes
**Objectif** : Optimisations mineures

#### Tâches
- [ ] **2.1** Migration 121 (si recommandée)
  ```sql
  -- Ajouter colonne condition (requis Google)
  ALTER TABLE products
  ADD COLUMN IF NOT EXISTS condition TEXT
  CHECK (condition IN ('new', 'refurbished', 'used'))
  DEFAULT 'new';

  -- Index performance éligibilité
  CREATE INDEX IF NOT EXISTS idx_products_google_eligibility
  ON products(product_status, stock_status)
  WHERE product_status = 'active';
  ```

- [ ] **2.2** Générer Types TypeScript
  ```bash
  supabase gen types typescript --local > src/types/supabase.ts
  npm run type-check # Doit passer sans erreurs
  ```

#### Critères succès
✅ Migration appliquée sans erreurs
✅ Types générés
✅ Type-check = 0 erreurs

---

### PHASE 3 : API Routes - VRAIE Intégration Google 🔌
**Durée** : 4-5 heures
**Objectif** : Remplacer mocks par vrais appels API

#### Tâches
- [ ] **3.1** Product Transformer (1h)
  - Fichier : `/src/lib/google-merchant/transformer.ts`
  - Fonction : `transformToGoogleMerchantProduct()`
  - Mapping Vérone → Google Merchant format
  - Validation stricte (title max 150 chars, description max 5000, prix > 0)

- [ ] **3.2** Google API Service Layer (2h)
  - Fichier : `/src/lib/google-merchant/api-service.ts`
  - Classe : `GoogleMerchantAPIService`
  - Méthodes :
    - `createProduct(productId, variantId?)` → POST Google API
    - `updateProduct(productId, variantId?)` → PATCH Google API
    - `deleteProduct(productId, variantId?)` → DELETE Google API
    - `getProductStatus(googleProductId)` → GET Google API
  - Logging exhaustif chaque opération (success + failed)

- [ ] **3.3** Remplacer Routes Actuelles (1h)
  - `/api/google-merchant/products/batch-add/route.ts`
    - Actuellement : appelle RPC mock
    - **NOUVEAU** : appeler `googleMerchantAPI.createProduct()` RÉEL
  - Autres routes à mettre à jour selon besoin

- [ ] **3.4** Tests Manuels API (30 min)
  - Postman/curl : tester CREATE, UPDATE, DELETE
  - Vérifier logs dans `google_merchant_syncs` table
  - Vérifier produit apparaît dans Google Merchant Center

#### Critères succès
✅ Transformer implémenté avec validation stricte
✅ API Service avec CRUD complet
✅ Routes mises à jour (vraie API Google, pas mock)
✅ Tests manuels : 1 produit créé/mis à jour/supprimé avec succès
✅ Produit visible dans Google Merchant Center UI

---

### PHASE 4 : Hooks & UI Updates 🎨
**Durée** : 2-3 heures
**Objectif** : Intégrer vraie API dans UI existante

#### Tâches
- [ ] **4.1** Vérifier Hooks Actuels (30 min)
  - Hook `useGoogleMerchantSync` existe déjà
  - **VÉRIFIER** : appelle-t-il le bon endpoint ?
  - **SI BESOIN** : mettre à jour pour utiliser nouvelles routes

- [ ] **4.2** Update Composants UI (1h)
  - Page : `/src/app/canaux-vente/google-merchant/page.tsx`
  - **VÉRIFIER** : workflow utilisateur (sélection → sync → affichage statut)
  - **VÉRIFIER** : gestion erreurs + loading states
  - **VÉRIFIER** : toasts informatifs

- [ ] **4.3** Logs & Statuts Display (1h)
  - Affichage statuts sync (pending, synced, failed)
  - Table logs synchronisation
  - Rafraîchissement auto toutes les 30s

#### Critères succès
✅ Hooks utilisent vraie API Google
✅ UI affiche statuts corrects
✅ Logs synchronisation visibles
✅ UX fluide (loading, toasts, erreurs claires)

---

### PHASE 5 : Tests & Validation ✅
**Durée** : 2-3 heures
**Objectif** : Validation complète end-to-end

#### Tâches
- [ ] **5.1** Tests Fonctionnels Manuels (1h)
  - [ ] **Test 1** : Créer 1 produit
    - Sélectionner produit actif Vérone
    - Click "Synchroniser"
    - Vérifier toast succès
    - Vérifier badge = "Synchronisé"
    - **VÉRIFIER dans Google Merchant Center** : produit visible

  - [ ] **Test 2** : Mettre à jour produit
    - Modifier titre/description/prix dans Vérone
    - Click "Mettre à jour"
    - **VÉRIFIER dans Google Merchant Center** : données mises à jour

  - [ ] **Test 3** : Supprimer produit
    - Click "Supprimer"
    - Confirmer
    - **VÉRIFIER dans Google Merchant Center** : produit supprimé

  - [ ] **Test 4** : Batch sync
    - Sélectionner 5 produits
    - Synchroniser
    - **VÉRIFIER** : 5 produits dans Google Merchant Center

  - [ ] **Test 5** : Gestion erreurs
    - Sync produit avec données invalides (prix = 0)
    - Vérifier erreur affichée clairement
    - Vérifier log table montre erreur

- [ ] **5.2** Console Errors Check (30 min) - **RÈGLE SACRÉE**
  - Ouvrir DevTools Console
  - Parcourir TOUTES pages Google Merchant
  - **VÉRIFIER** : 0 console errors (TOLÉRANCE ZÉRO)

- [ ] **5.3** Build & Type-Check (15 min)
  ```bash
  npm run type-check  # Doit retourner 0 erreurs
  npm run build       # Doit réussir
  ```

- [ ] **5.4** Performance Tests (15 min)
  - Sync 1 produit : < 3s
  - Batch sync 10 produits : < 30s
  - Page load : < 2s

- [ ] **5.5** Playwright Tests (30 min)
  - Créer test E2E workflow complet
  - Console errors = 0
  - Sync produit successful

#### Critères succès
✅ Tests manuels 1-5 TOUS passés
✅ Console errors = 0 (TOUTES pages)
✅ Build SUCCESS
✅ Type-check = 0 erreurs
✅ Performance validée
✅ Playwright tests passent

---

### PHASE 6 : Documentation & Cleanup 📚
**Durée** : 1-2 heures
**Objectif** : Documenter et finaliser

#### Tâches
- [ ] **6.1** Documentation Technique (1h)
  - Créer `/docs/integrations/google-merchant/README.md`
  - Sections :
    - Setup authentification
    - API endpoints
    - Data mapping Vérone → Google
    - Business rules validation
    - Troubleshooting erreurs courantes

- [ ] **6.2** Update Database Docs (15 min)
  - Mettre à jour `docs/database/functions-rpc.md` (ajouter 8 RPCs Google)
  - Mettre à jour `docs/database/enums.md` (ajouter types condition, channel)

- [ ] **6.3** Serena Memory (15 min)
  - Documenter décisions architecturales
  - Edge cases résolus
  - Learnings clés

- [ ] **6.4** Cleanup (15 min)
  - Supprimer fichiers temporaires
  - Supprimer backups si validation OK
  - Vérifier aucun secret committé

#### Critères succès
✅ Documentation complète créée
✅ Database docs à jour
✅ Serena memory écrite
✅ Cleanup effectué

---

## 📊 SUIVI PROGRESSION

### Checklist Globale

#### Setup Initial
- [ ] Plan validé par utilisateur
- [ ] Credentials Google vérifiés
- [ ] Environment staging disponible

#### Phase 0 : Nettoyage ✅
- [ ] Audit complet effectué
- [ ] Backups créés
- [ ] Google Merchant Center vide
- [ ] Database Vérone nettoyée

#### Phase 1 : Auth ✅
- [ ] Google Cloud setup vérifié
- [ ] Merchant Center access vérifié
- [ ] Credentials stockés
- [ ] Test connexion SUCCESS

#### Phase 2 : Database ✅
- [ ] Migration 121 appliquée (si nécessaire)
- [ ] Types TypeScript générés
- [ ] Type-check passé

#### Phase 3 : API Routes ✅
- [ ] Transformer implémenté
- [ ] API Service créé
- [ ] Routes mises à jour
- [ ] Tests manuels réussis

#### Phase 4 : UI ✅
- [ ] Hooks mis à jour
- [ ] Composants UI vérifiés
- [ ] Logs & statuts affichés

#### Phase 5 : Tests ✅
- [ ] Tests manuels 1-5 passés
- [ ] Console errors = 0
- [ ] Build SUCCESS
- [ ] Performance OK
- [ ] Playwright tests OK

#### Phase 6 : Docs ✅
- [ ] Documentation créée
- [ ] Database docs à jour
- [ ] Serena memory
- [ ] Cleanup

---

## 🚨 RÈGLES D'OR

### 1. Workflow CLAUDE.md OBLIGATOIRE

**PHASE 1 : THINK** (Analyse complète)
- Sequential Thinking si >3 étapes
- Consulter documentation officielle AVANT coder
- Identifier edge cases

**PHASE 2 : TEST** (Valider existant)
- Console = 0 errors AVANT modifications
- Build passe
- Screenshot "before"

**PHASE 3 : CODE** (Modifications minimales)
- Code minimal fonctionnel
- Types TypeScript stricts
- Commentaires business logic

**PHASE 4 : RE-TEST** (Validation finale)
- Type-check = 0 erreurs
- Build successful
- Console = 0 errors (TOUTES pages)
- Feature fonctionne
- Screenshot "after"

**PHASE 5 : DOCUMENT** (Préservation context)
- Serena memory avec décisions
- Documentation à jour

**PHASE 6 : COMMIT** (Autorisation OBLIGATOIRE)
- JAMAIS commit sans autorisation EXPLICITE
- "Voulez-vous que je commit maintenant ?"
- Attendre réponse OUI explicite

### 2. Console Zero Tolerance

**RÈGLE ABSOLUE** : 1 erreur console = ÉCHEC COMPLET

Avant CHAQUE commit :
```bash
# Test TOUTES pages impactées
# DevTools Console DOIT être à 0 errors
```

### 3. Tests Avant Commit

```bash
npm run type-check  # = 0 erreurs
npm run build       # SUCCESS
# Console errors = 0 (manuel DevTools)
```

### 4. Documentation AVANT Modifications

**TOUJOURS consulter** :
- Documentation Google Merchant API officielle
- Exemples GitHub : https://github.com/google/merchant-api-samples
- CLAUDE.md workflow

### 5. Demander AVANT Inventer

**JAMAIS** :
- Modifier UI sans demander
- Créer composants sans vérifier existant
- Changer architecture sans justification

**TOUJOURS** :
- Proposer 2-3 options avec trade-offs
- Demander validation utilisateur
- Expliquer décisions

---

## 📁 FICHIERS CLÉS

### À Créer/Modifier

```
src/lib/google-merchant/
├── auth.ts                     # JWT Service Account (NOUVEAU si manquant)
├── client.ts                   # Google API client (VÉRIFIER existant)
├── transformer.ts              # Vérone → Google format (NOUVEAU)
└── api-service.ts              # CRUD service (NOUVEAU)

src/app/api/google-merchant/
├── test-connection/route.ts    # Test auth (NOUVEAU)
└── products/
    └── batch-add/route.ts      # METTRE À JOUR (remplacer mock par vraie API)

docs/integrations/google-merchant/
├── README.md                   # Documentation complète (NOUVEAU)
├── auth.md                     # Setup guide (NOUVEAU)
└── troubleshooting.md          # Erreurs courantes (NOUVEAU)

supabase/migrations/
└── 20251106_121_google_merchant_optimizations.sql  # Migration optionnelle

docs/audits/
└── google-merchant-cleanup-2025-11-06.md  # Rapport Phase 0
```

### À Consulter

```
docs/database/SCHEMA-REFERENCE.md          # Schema 78 tables
docs/database/functions-rpc.md             # 256 fonctions PostgreSQL
docs/business-rules/13-canaux-vente/       # Règles métier
CLAUDE.md                                  # Workflow obligatoire
```

---

## 🎯 QUESTIONS AVANT DÉMARRAGE

### 1. Credentials Google
- [ ] Avez-vous accès Google Cloud Console ?
- [ ] Service Account déjà créé ou à créer ?
- [ ] Merchant ID confirmé : `5495521926` ?
- [ ] Clé JSON disponible ?

### 2. Priorités
- [ ] TOUTES les phases nécessaires ou seulement certaines ?
- [ ] Besoin batch sync ou seulement manuel ?
- [ ] Tests automatisés (Playwright) requis ?

### 3. Environnement
- [ ] Staging disponible pour tests AVANT production ?
- [ ] Timeline : 3-5 jours OK ou plus urgent ?

### 4. Validation
- [ ] Qui valide les tests finaux ?
- [ ] Critères d'acceptation spécifiques ?

---

## ✅ VALIDATION PLAN

**Statut** : ⏸️ EN ATTENTE VALIDATION UTILISATEUR

**Questions** :
1. Ce plan vous convient-il ?
2. Faut-il ajuster certaines phases ?
3. Voulez-vous commencer par Phase 0 (nettoyage) ?

**Prochaine étape** : Attendre validation utilisateur AVANT exécution

---

**Plan créé le** : 2025-11-06
**Par** : Claude Code (Sonnet 4.5)
**Basé sur** : Analyses 3 agents (Explore, Database Architect, Orchestrator)
**Durée totale estimée** : 14-20 heures (sur 3-5 jours)
**Tolérance erreurs** : **ZÉRO**
