# 🔄 Procédures de Rollback

**Responsable** : Romeo Dos Santos
**Dernière mise à jour** : 2025-10-21
**Version** : 1.0.0

---

## 📋 Vue d'ensemble

Ce document décrit les procédures de rollback pour tous les types de déploiements du projet Vérone Back Office.

**Principe fondamental** : Tout changement en production doit avoir une procédure de rollback documentée et testée.

---

## 🎯 Types de rollback

1. **Rollback Database** (migrations SQL)
2. **Rollback Code** (déploiement Vercel)
3. **Rollback Feature Flag** (désactivation fonctionnalité)
4. **Rollback Complet** (code + database)

---

## 🗄️ Rollback Database (Migrations SQL)

### Principe

Chaque migration SQL doit avoir un script `down` ou rollback correspondant.

### Template migration avec rollback

```sql
-- Migration : 20251021_001_add_tax_rate_column.sql
-- Rollback : 20251021_001_rollback_add_tax_rate_column.sql

-- ✅ Migration UP
ALTER TABLE sales_order_items
ADD COLUMN tax_rate DECIMAL(5,2) DEFAULT 0.20;

-- Commentaire
COMMENT ON COLUMN sales_order_items.tax_rate IS 'Taux de TVA appliqué (ex: 0.20 pour 20%)';

-- ❌ Migration DOWN (fichier séparé ou section commentée)
-- ALTER TABLE sales_order_items DROP COLUMN tax_rate;
```

### Procédure rollback migration

#### Option A : Supabase Dashboard (Recommandé si 1 migration)

1. **Connexion Supabase Dashboard**
   - URL : https://supabase.com/dashboard/project/[PROJECT_ID]
   - Onglet : SQL Editor

2. **Vérifier état actuel**

   ```sql
   SELECT * FROM pg_catalog.pg_tables
   WHERE tablename = 'sales_order_items';

   \d sales_order_items; -- Voir colonnes
   ```

3. **Exécuter rollback SQL**

   ```sql
   -- Copier script rollback depuis migration
   ALTER TABLE sales_order_items DROP COLUMN tax_rate;
   ```

4. **Validation**
   ```sql
   -- Vérifier colonne supprimée
   \d sales_order_items;
   ```

#### Option B : CLI Supabase (Recommandé si multiple migrations)

```bash
# 1. Vérifier migrations appliquées
supabase migration list

# 2. Rollback dernière migration
supabase db reset --version <previous_version>

# Exemple : rollback à la migration précédente
supabase db reset --version 20251020_010

# 3. Validation
supabase migration list
```

### Checklist rollback database

Avant rollback :

- [ ] **Backup database** effectué (mandatory !)
- [ ] Script rollback testé en local/staging
- [ ] Vérifier dépendances (foreign keys, triggers)
- [ ] Vérifier impact sur code frontend/backend
- [ ] Communication équipe (Slack, email)

Pendant rollback :

- [ ] Exécuter script rollback
- [ ] Vérifier résultat (queries test)
- [ ] Logs erreurs (si échec)

Après rollback :

- [ ] Validation complète (queries test)
- [ ] Tests E2E passent
- [ ] Monitoring metrics (erreurs, latence)
- [ ] Documentation incident (postmortem)

---

## 💻 Rollback Code (Déploiement Vercel)

### Principe

Vercel conserve tous les déploiements. Rollback = réactiver ancien déploiement.

### Procédure rollback Vercel

#### Option A : Vercel Dashboard (le plus simple)

1. **Connexion Vercel Dashboard**
   - URL : https://vercel.com/verone/back-office
   - Onglet : Deployments

2. **Identifier déploiement stable précédent**
   - Trier par date
   - Sélectionner déploiement avant incident
   - Vérifier status : "Ready"

3. **Promouvoir déploiement**
   - Clic sur déploiement
   - Bouton "Promote to Production"
   - Confirmer

4. **Validation**
   - Vérifier URL production : https://verone-back-office.vercel.app
   - Tests manuels rapides
   - Monitoring Vercel Analytics

**Durée** : ~30 secondes à 2 minutes

#### Option B : Vercel CLI

```bash
# 1. Lister déploiements récents
vercel list

# 2. Identifier déploiement stable (noter l'ID)
# Exemple : dpl_abc123xyz

# 3. Promouvoir déploiement
vercel promote dpl_abc123xyz

# 4. Validation
vercel inspect https://verone-back-office.vercel.app
```

**Durée** : ~30 secondes

#### Option C : Git revert + Redéploiement

```bash
# 1. Identifier commit problématique
git log --oneline -10

# 2. Revert commit
git revert <commit-hash>

# 3. Push (déclenche auto-deploy Vercel)
git push origin main

# 4. Monitoring déploiement
# Vercel Dashboard ou vercel --logs
```

**Durée** : ~2-5 minutes

### Checklist rollback code

Avant rollback :

- [ ] Identifier déploiement stable (noter ID/commit)
- [ ] Vérifier pas de migration DB active (risque incohérence)
- [ ] Communication équipe

Pendant rollback :

- [ ] Promouvoir ancien déploiement
- [ ] Surveiller logs déploiement

Après rollback :

- [ ] Tests manuels critiques
- [ ] Monitoring erreurs (Sentry, Vercel Analytics)
- [ ] Vérifier metrics (latence, taux erreur)
- [ ] Documentation incident

---

## 🚩 Rollback Feature Flag

### Principe

Désactiver fonctionnalité via variable d'environnement sans redéploiement.

### Procédure rollback feature flag

#### Via Vercel Dashboard

1. **Connexion Vercel Dashboard**
   - URL : https://vercel.com/verone/back-office
   - Onglet : Settings → Environment Variables

2. **Modifier variable**
   - Rechercher : `FEATURE_XXX`
   - Modifier valeur : `true` → `false`
   - Sauvegarder

3. **Redéploiement (si nécessaire)**
   - Certaines variables nécessitent redéploiement
   - Vercel indiquera si besoin
   - Clic "Redeploy" si demandé

4. **Validation**
   - Vérifier feature désactivée
   - Fallback ancien code fonctionne

**Durée** : ~1-2 minutes (sans redéploiement), ~3-5 minutes (avec redéploiement)

#### Via .env local (dev/staging)

```bash
# .env.local ou .env.production
FEATURE_NEW_DASHBOARD=false  # Désactiver
FEATURE_BETA_SEARCH=false    # Désactiver

# Redémarrer serveur dev
npm run dev
```

### Checklist rollback feature flag

Avant rollback :

- [ ] Identifier feature flag concernée
- [ ] Vérifier fallback fonctionne (ancien code existe)
- [ ] Tests staging

Pendant rollback :

- [ ] Modifier variable environnement
- [ ] Redéployer si nécessaire

Après rollback :

- [ ] Validation manuelle
- [ ] Monitoring metrics
- [ ] Communication utilisateurs (si visible)

---

## 🔴 Rollback Complet (Code + Database)

### Principe

Incident majeur nécessitant rollback simultané code ET database.

### Procédure rollback complet

**⚠️ Procédure d'urgence - Suivre ordre strict**

#### Étape 1 : Évaluation (5 min max)

- [ ] Identifier type incident (code, DB, both)
- [ ] Vérifier logs (Sentry, Supabase, Vercel)
- [ ] Déterminer version stable (code + DB)
- [ ] Communication équipe urgente

#### Étape 2 : Rollback Database FIRST (10 min max)

```bash
# 1. Backup actuel (si pas déjà fait)
# Via Supabase Dashboard : Database → Backups → Create backup

# 2. Identifier migration stable
supabase migration list

# 3. Rollback database
supabase db reset --version <stable_version>

# 4. Validation rapide
psql $DATABASE_URL -c "SELECT version();"
```

#### Étape 3 : Rollback Code (2 min)

```bash
# Via Vercel Dashboard (plus rapide)
# Promote déploiement correspondant à version DB stable

# OU via Git
git revert <bad-commit>
git push origin main
```

#### Étape 4 : Validation (10 min)

- [ ] Tests manuels critiques (login, dashboard, create order)
- [ ] Zero console errors (Playwright check)
- [ ] Monitoring metrics (latence, erreurs)
- [ ] Tests E2E critiques passent

#### Étape 5 : Communication (ongoing)

- [ ] Status page (si existe)
- [ ] Email clients (si impact majeur)
- [ ] Postmortem interne (document incident)

**Durée totale** : 30-45 minutes

---

## 📊 Templates de communication

### Template incident majeur (Slack)

```
🚨 INCIDENT PRODUCTION - Rollback en cours

**Type** : [Code / Database / Complet]
**Impact** : [Nombre utilisateurs / Features affectées]
**Début incident** : [HH:MM]
**ETA résolution** : [HH:MM]

**Actions** :
- [ ] Backup database effectué
- [ ] Rollback database lancé
- [ ] Rollback code lancé
- [ ] Validation tests en cours

**Responsable** : @romeo
**Status updates** : Toutes les 15 min
```

### Template postmortem incident

Voir `docs/incidents/TEMPLATE-POSTMORTEM.md` (à créer)

---

## 🧪 Tests réguliers rollback

**Fréquence recommandée** : Mensuel

### Checklist test rollback

- [ ] Test rollback migration DB (staging)
- [ ] Test rollback code Vercel (staging)
- [ ] Test rollback feature flag (staging)
- [ ] Chronométrer durée rollback
- [ ] Documenter problèmes rencontrés
- [ ] Mettre à jour procédures si nécessaire

---

## 📚 Ressources

**Scripts** :

- `tools/scripts/rollback/rollback-database.sh`
- `tools/scripts/rollback/rollback-deployment.sh`
- `tools/scripts/rollback/test-rollback-staging.sh`

**Documentation** :

- [Supabase Migrations](https://supabase.com/docs/guides/cli/managing-environments)
- [Vercel Rollbacks](https://vercel.com/docs/deployments/rollbacks)
- [Feature Flags Best Practices](https://martinfowler.com/articles/feature-toggles.html)

**Contacts urgence** :

- Romeo Dos Santos : [email/phone]
- Supabase Support : support@supabase.com
- Vercel Support : support@vercel.com

---

## ⚠️ Règles d'or rollback

1. **Backup AVANT tout rollback database** (non négociable)
2. **Database AVANT code** (toujours dans cet ordre pour rollback complet)
3. **Tester rollback en staging** (avant production si possible)
4. **Documenter incident** (postmortem obligatoire)
5. **Communiquer** (équipe + clients si impact)

---

**Créé** : 2025-10-21
**Validé par** : Romeo Dos Santos
**Prochaine révision** : 2025-11-21
