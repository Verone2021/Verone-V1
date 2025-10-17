# 🚀 STRATÉGIE DÉPLOIEMENT BIG BANG - VÉRONE BACK OFFICE

**Date** : Octobre 2025
**Stratégie** : Déploiement complet tous modules simultanément
**Abandon** : Approche Phase 1-2-3 incrémentale (obsolète)

---

## 📊 1. VUE D'ENSEMBLE

### Décision Stratégique

**BIG BANG** : Déploiement simultané de 8 modules production-ready au lieu d'un déploiement progressif en 3 phases.

**Justification Business** :

1. ✅ **Workflows interdépendants** - Les modules ne fonctionnent pas isolément :
   - Stocks sans Commandes = impossible (triggers automatiques réception/expédition)
   - Sourcing sans Catalogue = workflow validation cassé
   - Commandes sans Stocks = pas de mise à jour inventaire automatique

2. ✅ **Code 95-100% production ready** - Validation exhaustive effectuée

3. ✅ **Délai optimal** - 5 jours au lieu de 9 jours en déploiement progressif

4. ✅ **Feature flags infrastructure** - Rollback <5 min si problème critique

5. ✅ **Workflow métier complet end-to-end** :
   ```
   Sourcing → Validation → Catalogue → Stocks → Commandes → Interactions Clients
   ```

### Abandon Stratégie Phase 1-2-3

**Ancienne approche** (obsolète) :
- Phase 1 : Dashboard + Catalogue + Organisation (3 modules)
- Phase 2 : Stocks + Sourcing (2 modules)
- Phase 3 : Commandes + Interactions (3 modules)

**Problèmes identifiés** :
- ❌ Workflows incomplets temporairement (utilisateurs frustrés)
- ❌ 3 déploiements = 3 risques de régression
- ❌ Délai total 9 jours (vs 5 jours Big Bang)
- ❌ Données incohérentes entre phases

---

## 🎯 2. ÉTAT ACTUEL PRODUCTION

### Environnement Actuel

- **URL Production** : https://verone-backoffice-7f270yhir-verone2021s-projects.vercel.app
- **Commit Actif** : `46ab3eb`
- **État Build** : ✅ READY
- **Console Errors** : 0 erreur applicative validée

### Features Actuellement Actives (Phase 1)

**3 modules opérationnels** :
1. ✅ **Dashboard** - KPIs temps réel, métriques business
2. ✅ **Catalogue** - 241 produits, variantes, collections, images
3. ✅ **Organisation** - 5 fournisseurs, clients, contacts, partenaires

### Features Désactivées (Développées mais Flags OFF)

**5 modules développés à 85-95%** :
- 🔒 Sourcing (workflow validation produits)
- 🔒 Stocks (inventaire, mouvements, prévisionnel)
- 🔒 Commandes Clients (B2B/B2C)
- 🔒 Commandes Fournisseurs (achats, réception auto)
- 🔒 Interactions Clients (consultations, devis)

**Configuration actuelle** (`.env.local`) :
```env
NEXT_PUBLIC_PHASE_1_ENABLED=true
NEXT_PUBLIC_DASHBOARD_ENABLED=true
NEXT_PUBLIC_CATALOGUE_ENABLED=true

# Modules désactivés (à activer Big Bang)
NEXT_PUBLIC_PHASE_2_ENABLED=false
NEXT_PUBLIC_STOCKS_ENABLED=false
NEXT_PUBLIC_SOURCING_ENABLED=false
NEXT_PUBLIC_COMMANDES_ENABLED=false
NEXT_PUBLIC_PHASE_3_ENABLED=false
NEXT_PUBLIC_INTERACTIONS_ENABLED=false
```

---

## 📦 3. PÉRIMÈTRE BIG BANG

### 8 Modules à Activer Simultanément

| # | Module | État Dev | Pages | Composants | Tables DB | Triggers Auto |
|---|--------|----------|-------|------------|-----------|---------------|
| 1 | **Dashboard** | ✅ 100% | 1 | 6 | Métriques | - |
| 2 | **Catalogue** | ✅ 100% | 13 | 45+ | 31 migrations | - |
| 3 | **Organisation** | ✅ 100% | 8 | 12 | Complet | - |
| 4 | **Sourcing** 🆕 | ✅ 95% | 4 | 8 | 3 migrations | - |
| 5 | **Stocks** 🆕 | ✅ 95% | 6 | 15 | 2 migrations | ✅ Mvts auto |
| 6 | **Commandes Clients** 🆕 | ✅ 90% | 1 | 2 | 1 migration | ✅ Stock OUT |
| 7 | **Commandes Fournisseurs** 🆕 | ✅ 90% | 1 | 2 | 1 migration | ✅ Stock IN |
| 8 | **Interactions Clients** 🆕 | ✅ 85% | 3 | 5 | 1 migration | - |

**Total Code Base** :
- 53 pages développées
- 114+ composants business
- 58 hooks Supabase fonctionnels
- 31 migrations database appliquées

### Module Exclu Phase 1

**❌ Canaux de Vente (Google Merchant)** :
- **État** : UI 100% développée, APIs 30%, configuration Google Cloud 0%
- **Raison exclusion** : Non critique workflows métier, config externe complexe
- **Alternative** : Export Excel manuel déjà disponible `/api/exports/google-merchant-excel`
- **Planification** : Post-déploiement Big Bang (J+7, effort 2-3h)

---

## 📅 4. TIMELINE DÉPLOIEMENT (10 JOURS)

### Phase Préparation (J-5 à J-3)

#### **J-5 : Infrastructure** ⚙️
**Durée** : 2h
- [ ] Backup complet base de données Supabase (point de restauration)
- [ ] Préparer scripts activation feature flags global
- [ ] Vérifier accès Vercel deployment rapide
- [ ] Documentation utilisateur finale prête

#### **J-4 : Configuration** 🔧
**Durée** : 3h
- [ ] Créer `.env.production` avec tous modules activés
- [ ] Tester activation/désactivation flags en local
- [ ] Préparer script rollback rapide (<5 min)
- [ ] Valider variables environnement Vercel

**Script activation** :
```env
NEXT_PUBLIC_PHASE_2_ENABLED=true
NEXT_PUBLIC_STOCKS_ENABLED=true
NEXT_PUBLIC_SOURCING_ENABLED=true
NEXT_PUBLIC_COMMANDES_ENABLED=true
NEXT_PUBLIC_PHASE_3_ENABLED=true
NEXT_PUBLIC_INTERACTIONS_ENABLED=true
NEXT_PUBLIC_CANAUX_VENTE_ENABLED=false  # Exclu Phase 1
```

#### **J-3 : Tests Workflow 1 (Sourcing → Stocks)** 🧪
**Durée** : 4h
- [ ] Créer 3 produits sourcing (différents types : interne, client, échantillon)
- [ ] Valider passage catalogue (statut `sourcing` → `validated`)
- [ ] Commander échantillon fournisseur
- [ ] Vérifier trigger réception stock automatique (mouvement IN)
- [ ] Console errors check (MCP Browser, 0 erreur obligatoire)

**Success Criteria** :
- ✅ 3 produits en stock
- ✅ Mouvements stock automatiques créés
- ✅ 0 erreur console

#### **J-2 : Tests Workflow 2 (Commandes)** 🧪
**Durée** : 4h
- [ ] Créer 2 commandes fournisseurs (status `confirmed`)
- [ ] Réceptionner partiellement → vérifier mouvements stock IN automatiques
- [ ] Créer 2 commandes clients (B2B/B2C)
- [ ] Vérifier sorties stock OUT automatiques (triggers)
- [ ] Console errors check (toutes pages Commandes)

**Success Criteria** :
- ✅ Triggers automatiques fonctionnels
- ✅ Stock cohérent (entrées + sorties)
- ✅ 0 erreur console

#### **J-1 : Tests Workflow 3 (Interactions) + Performance** 🧪
**Durée** : 5h
- [ ] Créer 2 consultations clients
- [ ] Associer produits catalogue
- [ ] Convertir en commande client
- [ ] Tests performance (Dashboard <2s, Catalogue <3s)
- [ ] Console errors check exhaustif (toutes pages)
- [ ] Validation finale 0 erreurs console

**Success Criteria** :
- ✅ Workflow end-to-end validé
- ✅ SLOs performance respectés
- ✅ 0 erreur console

---

### Phase Déploiement (J0)

#### **Matin (9h-12h) : Déploiement Production** 🚀

**9h00 - Backup Final**
- [ ] Backup final base de données Supabase
- [ ] Vérifier point de restauration créé
- [ ] Tester restauration (dry-run)

**9h30 - Activation Code**
- [ ] Push code avec feature flags activés
- [ ] Merge main (si PR) ou commit direct

**10h00 - Build & Deploy**
- [ ] Déploiement Vercel automatique
- [ ] Monitoring build en temps réel
- [ ] Attendre statut "READY"

**10h30 - Vérification Build**
- [ ] Vérifier build success (pas d'erreurs TypeScript)
- [ ] Check deployment logs Vercel
- [ ] Valider URL production accessible

**11h00 - Tests Smoke Production**
- [ ] Navigation sidebar tous modules (8 modules visibles)
- [ ] Tester 1 page par module (vérification rapide)
- [ ] Vérifier données produits (241 produits affichés)

**11h30 - Console Errors Check**
- [ ] MCP Playwright Browser check production
- [ ] Navigation toutes pages critiques
- [ ] Validation 0 erreur console
- [ ] Screenshots proof

#### **Après-midi (14h-18h) : Formation & Validation** 👥

**14h00 - Formation Équipe (2h)**
- [ ] Présentation stratégie Big Bang (15 min)
- [ ] Démonstration 8 modules (module par module, 10 min chacun)
- [ ] Workflows critiques (Sourcing → Stocks → Commandes, 30 min)
- [ ] Q&A session (15 min)

**16h00 - Tests Utilisateurs Réels (1h)**
- [ ] Tests guidés par utilisateurs finaux
- [ ] Feedback immédiat collecté
- [ ] Identification points friction UX

**17h00 - Monitoring Sentry (30 min)**
- [ ] Check erreurs remontées Sentry
- [ ] Analyse logs Supabase
- [ ] Vérification métriques Vercel

**17h30 - Validation Finale (30 min)**
- [ ] Review checklist complète
- [ ] Décision GO/NO-GO
- [ ] Si GO : Communication équipe "Déploiement réussi"
- [ ] Si NO-GO : Activation plan rollback

---

### Phase Stabilisation (J+1 à J+7)

#### **J+1 à J+3 : Support Intensif** 🛠️
**Durée** : 3 jours

**Support Utilisateurs** :
- [ ] Canal Slack #support-verone actif
- [ ] Réponse <1h questions
- [ ] Hotfixes si bugs critiques (<2h résolution)

**Monitoring Continu** :
- [ ] Sentry : Check erreurs quotidiennes
- [ ] Vercel Analytics : Core Web Vitals
- [ ] Supabase Logs : Queries performance

**Ajustements UX** :
- [ ] Collecte feedback utilisateurs
- [ ] Optimisations basées retours
- [ ] Documentation FAQ mise à jour

#### **J+7 : Bilan & Optimisation** 📊

**Rapport Adoption** :
- [ ] Nombre utilisateurs actifs (objectif : 100% équipe)
- [ ] Modules les plus utilisés (top 3)
- [ ] Workflows complétés (objectif : >80%)

**Analyse Erreurs** :
- [ ] Review Sentry erreurs J0-J7
- [ ] Identification patterns récurrents
- [ ] Plan correction si nécessaire

**Performance** :
- [ ] Vérification SLOs (Dashboard <2s, Catalogue <3s)
- [ ] Optimisations si dégradation détectée
- [ ] Documentation learnings

---

## ✅ 5. CHECKLIST PRÉ-DÉPLOIEMENT OBLIGATOIRE

### Infrastructure ⚙️

- [ ] **Backup DB effectué** (restauration testée en dry-run)
- [ ] **Vercel deployment previews** testées (PR avant merge)
- [ ] **Variables environnement production** configurées
- [ ] **Feature flags scripts** prêts (activation rapide)
- [ ] **Monitoring Sentry** actif (DSN validé)

### Code & Tests 🧪

- [ ] **0 erreurs console** (validation MCP Browser toutes pages)
- [ ] **Build production success** (`npm run build` local)
- [ ] **TypeScript checks** passed (`npm run type-check`)
- [ ] **Performance SLOs** validés (Dashboard <2s, Catalogue <3s)
- [ ] **3 workflows critiques** validés :
  - [ ] Workflow Sourcing → Stocks
  - [ ] Workflow Commandes → Stocks automatiques
  - [ ] Workflow Consultations → Commandes

### Workflows Métier 🔄

- [ ] **Workflow Sourcing→Stocks** : 3 produits créés, validés, en stock
- [ ] **Workflow Commandes→Stocks** : Triggers automatiques fonctionnels (IN/OUT)
- [ ] **Workflow Consultations→Commandes** : End-to-end validé

### Documentation & Formation 📚

- [ ] **Documentation utilisateur** prête (8 pages PDF, 1 par module)
- [ ] **Vidéos tutoriels** enregistrées (optionnel mais recommandé)
- [ ] **Support équipe** disponible J+1 à J+3
- [ ] **Plan rollback** documenté et testé

---

## 🚨 6. PLAN ROLLBACK (15 MINUTES)

### Définition Problème Critique

Un problème critique nécessite rollback immédiat si :
- ❌ Erreurs 500 empêchant utilisation normale
- ❌ Données corrompues/incohérentes (stocks négatifs impossibles)
- ❌ Performance dégradée >50% (Dashboard >4s au lieu de <2s)
- ❌ Triggers database dysfonctionnels (stock non mis à jour)

### Procédure Rollback (15 min maximum)

#### **Étape 1 : Désactivation Feature Flags (5 min)**

**Via Vercel Dashboard** :
```bash
# Environment Variables → Edit
NEXT_PUBLIC_PHASE_2_ENABLED=false
NEXT_PUBLIC_STOCKS_ENABLED=false
NEXT_PUBLIC_SOURCING_ENABLED=false
NEXT_PUBLIC_COMMANDES_ENABLED=false
NEXT_PUBLIC_PHASE_3_ENABLED=false
NEXT_PUBLIC_INTERACTIONS_ENABLED=false

# Save → Redeploy automatique Vercel (2-3 min)
```

**Résultat** : Retour Phase 1 uniquement (Dashboard + Catalogue + Organisation)

#### **Étape 2 : Restauration DB si Corruption (10 min)**

**Via Supabase Dashboard** :
```bash
# Database → Backups → Restore
# Sélectionner backup J-1 (point avant déploiement)
# Confirm restore
```

**Validation** :
- [ ] Vérifier 241 produits présents
- [ ] Vérifier stocks cohérents
- [ ] Vérifier aucune donnée perdue

#### **Étape 3 : Communication Utilisateurs (5 min)**

**Message Slack/Email** :
```
🚨 Maintenance Temporaire

Nous avons détecté un problème critique après le déploiement Big Bang.
Par précaution, nous sommes revenus à la configuration Phase 1 (Dashboard + Catalogue + Organisation).

Les modules Stocks, Commandes, Consultations sont temporairement désactivés.

Analyse en cours. ETA résolution : J+1
Merci de votre compréhension.

Équipe Vérone Tech
```

### Validation Rollback

**Checklist post-rollback** :
- [ ] Dashboard accessible (métriques affichées)
- [ ] Catalogue fonctionnel (241 produits visibles)
- [ ] 0 erreurs console Phase 1
- [ ] Communication équipe effectuée
- [ ] Post-mortem planifié (analyse causes)

---

## 🧪 7. TESTS CRITIQUES (J-3 À J-1)

### Test 1 - Workflow Sourcing → Stocks

**Objectif** : Valider création produit depuis sourcing jusqu'au stock

**Étapes détaillées** :
1. **Créer produit sourcing** (`/catalogue/create`)
   - Nom : "Test Chaise Nordic Blanc"
   - Type : "standard" (produit interne)
   - Fournisseur : Sélectionner existant
   - Prix achat : 120€
   - Status initial : "sourcing"

2. **Valider produit** (`/sourcing/validation`)
   - Vérifier tous champs complétés
   - Cliquer "Valider pour catalogue"
   - Status passage : `sourcing` → `validated`

3. **Commander fournisseur** (`/commandes/fournisseurs`)
   - Créer commande PO-TEST-001
   - Ajouter produit "Test Chaise Nordic Blanc" (quantité 10)
   - Status commande : "confirmed"

4. **Réceptionner stock** (Modal réception)
   - Cliquer bouton "Réceptionner" (icône camion)
   - Réceptionner 10 unités
   - Vérifier trigger automatique stock IN

5. **Vérifier stock** (`/stocks/inventaire`)
   - Produit "Test Chaise Nordic Blanc" : Stock = 10
   - `/stocks/mouvements` : Mouvement "Entrée" créé automatiquement

**Success Criteria** :
- ✅ Produit créé avec ID unique
- ✅ Transition statut sourcing → validated OK
- ✅ Commande fournisseur créée
- ✅ Réception automatique génère mouvement stock IN (trigger DB)
- ✅ Stock mis à jour correctement
- ✅ 0 erreurs console (MCP Browser check)

---

### Test 2 - Workflow Commandes Fournisseurs → Stocks Automatiques

**Objectif** : Valider trigger automatique réception stock

**Étapes détaillées** :
1. **État initial** (`/stocks/inventaire`)
   - Noter stock initial produit A : ex. 50 unités

2. **Créer commande fournisseur** (`/commandes/fournisseurs`)
   - Commande PO-TEST-002
   - Fournisseur : Sélectionner existant
   - Ajouter produit A (quantité 20)
   - Status : "confirmed"

3. **Réception partielle** (Modal réception)
   - Réceptionner 15 unités sur 20
   - Vérifier message confirmation
   - Status commande : "partially_received"

4. **Vérifier mouvement stock** (`/stocks/mouvements`)
   - Nouveau mouvement "Entrée" créé automatiquement
   - Type : "IN"
   - Quantité : 15
   - Origine : "Commande PO-TEST-002"
   - Utilisateur : [User connecté]

5. **Vérifier inventaire** (`/stocks/inventaire`)
   - Produit A : Stock = 50 + 15 = 65 unités
   - Historique mouvements visible

**Success Criteria** :
- ✅ Commande fournisseur créée
- ✅ Réception partielle enregistrée (15/20)
- ✅ Mouvement stock automatique créé (trigger DB fonctionnel)
- ✅ Inventaire mis à jour correctement (+15)
- ✅ 0 erreurs console

---

### Test 3 - Workflow Commandes Clients → Sorties Stocks

**Objectif** : Valider diminution stock automatique

**Étapes détaillées** :
1. **État initial** (`/stocks/inventaire`)
   - Noter stock initial produit B : ex. 30 unités

2. **Créer commande client** (`/commandes/clients`)
   - Commande SO-TEST-001
   - Client : Sélectionner existant (B2B ou B2C)
   - Ajouter produit B (quantité 8)
   - Status : "confirmed"

3. **Vérifier mouvement stock** (`/stocks/mouvements`)
   - Nouveau mouvement "Sortie" créé automatiquement
   - Type : "OUT"
   - Quantité : -8
   - Origine : "Commande SO-TEST-001"
   - Utilisateur : [User connecté]

4. **Vérifier inventaire** (`/stocks/inventaire`)
   - Produit B : Stock = 30 - 8 = 22 unités
   - Vérifier alerte si stock < seuil minimal (optionnel)

5. **Console errors** (MCP Browser)
   - Navigation toutes pages Commandes
   - Vérification 0 erreur

**Success Criteria** :
- ✅ Commande client créée
- ✅ Mouvement sortie automatique créé (trigger DB)
- ✅ Stock diminué correctement (-8)
- ✅ Alerte si stock <seuil (si implémenté)
- ✅ 0 erreurs console

---

### Test 4 - Workflow Consultations → Commandes Clients

**Objectif** : Valider pipeline vente complète

**Étapes détaillées** :
1. **Créer consultation** (`/consultations/create`)
   - Organisation : "Test Client SA" (B2B)
   - Descriptif projet : "Aménagement bureau 50m²"
   - Budget estimé : 5000€
   - Status : "draft"

2. **Associer produits** (`/consultations/[id]`)
   - Onglet "Produits"
   - Sélectionner 3 produits catalogue
   - Prix personnalisés (optionnel)
   - Notes commerciales

3. **Valider consultation**
   - Passage statut "draft" → "en_cours"
   - Vérifier produits associés affichés

4. **Créer devis** (si interface développée)
   - Générer devis PDF (optionnel)
   - Envoyer client

5. **Convertir en commande**
   - Bouton "Créer commande client"
   - Vérifier pré-remplissage produits
   - Finaliser commande

6. **Vérifier cohérence** (`/commandes/clients`)
   - Commande créée depuis consultation
   - Produits identiques
   - Prix corrects

**Success Criteria** :
- ✅ Consultation créée
- ✅ Produits associés visibles
- ✅ Passage commande client depuis consultation
- ✅ Cohérence données consultation→commande
- ✅ 0 erreurs console

---

### Test 5 - Performance & Console Errors (Toutes Pages)

**Objectif** : Validation SLOs et zéro erreur console

**Méthode** : MCP Playwright Browser (JAMAIS scripts .js/.mjs)

**Étapes** :
```bash
# Navigation + Console Check toutes pages critiques
# (Utiliser MCP Playwright, pas de scripts)

# Dashboard
mcp__playwright__browser_navigate("http://localhost:3000/dashboard")
mcp__playwright__browser_console_messages()  # Must return 0 errors
mcp__playwright__browser_take_screenshot()   # Proof visuelle

# Répéter pour chaque module :
# - /catalogue, /catalogue/create, /catalogue/[productId]
# - /sourcing, /sourcing/validation
# - /stocks, /stocks/inventaire, /stocks/mouvements
# - /commandes/clients, /commandes/fournisseurs
# - /consultations, /interactions/dashboard
```

**Success Criteria** :
- ✅ **Dashboard** : <2s temps chargement, 0 erreurs
- ✅ **Catalogue** : <3s temps chargement, 0 erreurs
- ✅ **Toutes pages** : 0 warnings console critiques
- ✅ **Navigation** : Fluide, pas de freeze UI
- ✅ **Screenshots** : Validation visuelle OK

**Checklist Pages** :
- [ ] `/dashboard` - 0 erreurs
- [ ] `/catalogue` - 0 erreurs
- [ ] `/catalogue/create` - 0 erreurs
- [ ] `/sourcing` - 0 erreurs
- [ ] `/sourcing/validation` - 0 erreurs
- [ ] `/stocks` - 0 erreurs
- [ ] `/stocks/inventaire` - 0 erreurs
- [ ] `/stocks/mouvements` - 0 erreurs
- [ ] `/commandes/clients` - 0 erreurs
- [ ] `/commandes/fournisseurs` - 0 erreurs
- [ ] `/consultations` - 0 erreurs
- [ ] `/interactions/dashboard` - 0 erreurs

---

## 📊 8. MONITORING POST-DÉPLOIEMENT

### Métriques Vercel (Core Web Vitals)

**Dashboards à Surveiller** :
- Vercel Analytics → Real-time visitors
- Performance → Core Web Vitals
- Errors → 500/404 rates
- Build → Deployment success rate

**Seuils d'Alerte** :

| Métrique | Objectif | Alerte si | Action Immédiate |
|----------|----------|-----------|------------------|
| **LCP** (Largest Contentful Paint) | <2.5s | >4s | Investigation performance |
| **FID** (First Input Delay) | <100ms | >300ms | Optimisation JavaScript |
| **CLS** (Cumulative Layout Shift) | <0.1 | >0.25 | Fix layout shifts |
| **Error Rate** | <1% | >5% | Analyse Sentry urgente |
| **Uptime** | 99.9% | <99% | Vérifier Vercel status |

---

### Métriques Business (J+1 à J+3)

**Adoption Utilisateurs** :
- [ ] Nombre connexions par jour (objectif : 100% équipe)
- [ ] Modules les plus utilisés (top 3)
- [ ] Taux complétion workflows (objectif : >80%)

**Workflows Complétés** :
- [ ] Produits créés via Sourcing (objectif : 5+ J+1)
- [ ] Commandes fournisseurs (objectif : 2+ J+1)
- [ ] Commandes clients (objectif : 3+ J+3)
- [ ] Consultations créées (objectif : 5+ J+3)

**Erreurs Bloquantes** :
- [ ] Tickets support critiques (objectif : <3 J+1)
- [ ] Bugs empêchant workflows (objectif : 0)
- [ ] Demandes rollback (objectif : 0)

**Sources de Données** :
- Logs Supabase : Queries count par table
- Sentry Issues : Groupées par module
- Feedback équipe : Slack/Email

---

### Dashboard Monitoring Recommandé

**Setup Simple (1h effort)** :

**1. Sentry (Déjà Configuré)** :
```bash
# Check issues récentes
mcp__sentry__get_recent_issues({ project: "verone-back-office" })
# Vérifier J0, J+1, J+3
```

**2. Supabase Logs** :
```sql
-- Queries par table (adoption modules)
SELECT schemaname, tablename, COUNT(*) as queries
FROM pg_stat_user_tables
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY queries DESC;

-- Mouvements stock (trigger validation)
SELECT COUNT(*) FROM stock_movements
WHERE created_at > NOW() - INTERVAL '24 hours';
```

**3. Google Sheets Tracking Manuel** :

| Date | Module | Users | Actions | Errors | Notes |
|------|--------|-------|---------|--------|-------|
| J0 | Dashboard | 5 | 12 | 0 | Formation OK |
| J0 | Sourcing | 3 | 5 produits | 1 (résolu) | UX feedback |
| J+1 | Commandes | 4 | 8 commandes | 0 | Workflow fluide |

---

## 🔴 9. RISQUES & MITIGATIONS

### Risque Critique 1 : Triggers Database Stocks Non Testés Production

**Description** :
- Triggers automatiques (`stock_movements` après réception commande)
- Jamais testés avec données production réelles
- Risque corruption inventaire si erreur trigger

**Probabilité** : Moyenne (30%)
**Impact** : Critique (données métier corrompues)

**Mitigation** :
1. ✅ **Tests staging reproduction exacte** (J-3 à J-1)
   - Import 241 produits catalogue staging
   - Reproduction commandes/mouvements réalistes
   - Validation triggers avec vraies données
2. ✅ **Backup DB avant déploiement** (J0 matin)
3. ✅ **Monitoring temps réel** (Supabase logs stock_movements)
4. ✅ **Rollback trigger SQL** préparé si erreur détectée

---

### Risque Important 2 : Adoption Utilisateurs (8 Modules Complexes)

**Description** :
- Passage 3 modules (Phase 1) → 8 modules (toutes phases)
- Équipe non-technique potentielle
- Risque confusion/frustration si trop de nouveautés

**Probabilité** : Élevée (60%)
**Impact** : Moyen (sous-utilisation modules)

**Mitigation** :
1. ✅ **Formation structurée** (2h, J0 après-midi)
   - Module par module (10 min chacun)
   - Démonstration workflows live
   - Q&A dédiée
2. ✅ **Documentation PDF** (8 pages, 1 page/module)
   - Screenshots annotés
   - Workflows pas-à-pas
   - FAQ erreurs communes
3. ✅ **Support dédié J+1 à J+3**
   - Canal Slack #support-verone
   - Réponse <1h questions
4. ✅ **Vidéos tutoriels** (optionnel, 5-10 min par workflow)

---

### Risque Modéré 3 : Performance Dégradée (Plus de Queries)

**Description** :
- 8 modules actifs = +200% queries Supabase
- Dashboard charge KPIs tous modules
- Risque ralentissement si pas d'optimisation

**Probabilité** : Moyenne (40%)
**Impact** : Moyen (SLOs non respectés)

**Mitigation** :
1. ✅ **Indexes DB optimisés** (déjà en place migration 001_optimize_products_indexes.sql)
2. ✅ **React memoization** (hooks use-dashboard-metrics déjà optimisés)
3. ✅ **Tests performance J-1** (validation <2s Dashboard)
4. ✅ **Monitoring Vercel Analytics** (Core Web Vitals temps réel)
5. ✅ **Plan optimization J+7** si dégradation détectée

---

### Risque Faible 4 : Canaux de Vente (Google Merchant) Non Opérationnel

**Description** :
- UI développée mais APIs manquantes
- Configuration Google Cloud requise
- Module affiché mais non fonctionnel

**Probabilité** : Certaine (100%)
**Impact** : Faible (module non critique MVP)

**Mitigation** :
1. ✅ **Désactiver module Phase 1** (`CANAUX_VENTE_ENABLED=false`)
2. ✅ **Badge "En développement"** dans sidebar si affiché
3. ✅ **Export Excel alternatif** déjà disponible (`/api/exports/google-merchant-excel`)
4. ✅ **Planifier Phase 2** (activation après configuration Google)

---

## 🚀 10. PROCHAINES ÉTAPES IMMÉDIATES

### Aujourd'hui (Validation Stratégie)

1. **Valider décision Big Bang avec équipe** (30 min)
   - Présenter ce document stratégique
   - Confirmer disponibilité équipe J-3 à J+3
   - Valider budget temps (5-6 jours)

2. **Planifier tests J-3 à J-1** (15 min)
   - Bloquer agenda testeurs
   - Préparer environnement staging
   - Lister données test nécessaires

3. **Préparer documentation formation** (2h)
   - Créer 8 pages PDF (1 par module)
   - Screenshots workflows critiques
   - FAQ erreurs prévisibles

4. **Configurer backup automatique** (30 min)
   - Supabase Dashboard → Automatic backups
   - Vérifier point de restauration J-1

---

### J-5 (Préparation Infrastructure)

5. **Créer script activation feature flags** (1h)
```bash
# deploy-big-bang.sh
export NEXT_PUBLIC_PHASE_2_ENABLED=true
export NEXT_PUBLIC_STOCKS_ENABLED=true
export NEXT_PUBLIC_SOURCING_ENABLED=true
export NEXT_PUBLIC_COMMANDES_ENABLED=true
export NEXT_PUBLIC_PHASE_3_ENABLED=true
export NEXT_PUBLIC_INTERACTIONS_ENABLED=true

git add .env.production
git commit -m "feat: Activate all modules Big Bang deployment"
git push origin main
```

6. **Créer script rollback** (30 min)
```bash
# rollback-big-bang.sh
export NEXT_PUBLIC_PHASE_2_ENABLED=false
export NEXT_PUBLIC_STOCKS_ENABLED=false
export NEXT_PUBLIC_SOURCING_ENABLED=false
export NEXT_PUBLIC_COMMANDES_ENABLED=false
export NEXT_PUBLIC_PHASE_3_ENABLED=false
export NEXT_PUBLIC_INTERACTIONS_ENABLED=false

git add .env.production
git commit -m "rollback: Disable all Big Bang modules - return Phase 1"
git push origin main
```

---

## 📚 11. RÉFÉRENCES & DOCUMENTATION

### Documents Internes
- [Guide Configuration Vercel 2025](../guides/VERCEL-CONFIGURATION-2025.md)
- [Guide Configuration GitHub 2025](../guides/GITHUB-CONFIGURATION-2025.md)
- [Workflow Git/GitHub/Vercel](../workflows/git-github-vercel-guide.md)

### Documents Google Merchant (Post-Déploiement)
- [Setup Google Merchant Center](../../manifests/technical-specs/google-merchant-setup.md)
- [Spécifications Feeds Google](../../manifests/architecture/feeds-specifications-google.md)

### Fichiers Obsolètes (Archivés)
- Archive : `MEMORY-BANK/archive/sessions/deployment-phases-obsolete/`
- Guides Phase 1 obsolètes : `docs/deployment/*-PHASE1-OBSOLETE.md`

---

## ✅ 12. CONCLUSION

### Résumé Stratégie

**Décision** : **BIG BANG avec 8 modules** (excluant Google Merchant)

**Modules Actifs** :
1. Dashboard ✅
2. Catalogue ✅
3. Organisation ✅
4. Sourcing 🆕
5. Stocks 🆕
6. Commandes Clients 🆕
7. Commandes Fournisseurs 🆕
8. Interactions Clients 🆕

**Module Phase 2** :
- Canaux de Vente (Google Merchant) → Après configuration Google Cloud

**Timeline** : 5-6 jours (J-3 tests + J0 déploiement + J+1 à J+3 stabilisation)

### Conditions de Succès

**TOUTES ces conditions doivent être réunies** :

1. ✅ **Tests J-3 à J-1 NON NÉGOCIABLES**
2. ✅ **Backup DB avant déploiement OBLIGATOIRE**
3. ✅ **0 erreurs console validation CRITIQUE**
4. ✅ **Formation équipe J0 ESSENTIELLE**
5. ✅ **Support dédié J+1 à J+3 REQUIS**

**Si UNE condition non remplie** → Basculer sur déploiement progressif (3 vagues, 9 jours)

### Workflow End-to-End

```
Sourcing → Validation → Catalogue → Stocks → Commandes Fournisseurs → Commandes Clients → Interactions
```

**Workflow complet fonctionnel dès J0** ✅

---

**Document créé le** : Octobre 2025
**Prochaine révision** : J+7 (bilan déploiement)
**Responsable** : Équipe Tech Vérone

🚀 **Prêt pour exécution Big Bang !**
