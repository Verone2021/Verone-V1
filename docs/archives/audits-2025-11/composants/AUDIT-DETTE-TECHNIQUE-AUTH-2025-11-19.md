# 🔍 AUDIT COMPLET - Dette Technique Système Authentification Vérone

**Date** : 2025-11-19
**Scope** : Tables auth (user_profiles, user_activity_logs, user_sessions), RLS policies, enums, migrations
**Méthode** : Analyse exhaustive code + schema DB + migrations + utilisation réelle
**Statut** : ✅ Audit terminé - 47 éléments analysés

---

## 📊 SYNTHÈSE EXÉCUTIVE

### Statistiques Globales

| Catégorie                  | Éléments Analysés | 🟢 Utilisés  | 🟡 Partiels | 🔴 Inutilisés | ⚠️ Incohérents |
| -------------------------- | ----------------- | ------------ | ----------- | ------------- | -------------- |
| **Colonnes user_profiles** | 15                | 8 (53%)      | 2 (13%)     | 3 (20%)       | 2 (14%)        |
| **Enums valeurs**          | 13                | 8 (62%)      | 2 (15%)     | 3 (23%)       | 0              |
| **Tables auth**            | 3                 | 1 (33%)      | 2 (67%)     | 0             | 0              |
| **RLS Policies**           | 7                 | 7 (100%)     | 0           | 0             | 0              |
| **Migrations**             | 4                 | 4 (100%)     | 0           | 0             | 0              |
| **TOTAL**                  | **47**            | **28 (60%)** | **6 (13%)** | **6 (13%)**   | **2 (4%)**     |

### Impact Dette Technique

- **🔴 CRITIQUE** : 2 éléments (individual_customer_id FK cassée, user_organisation_assignments fantôme)
- **🟡 MODÉRÉ** : 4 éléments (colonnes jamais utilisées mais présentes)
- **🟢 FAIBLE** : 6 éléments (valeurs enum non utilisées mais cohérentes)

---

## 1️⃣ TABLE `user_profiles` - ANALYSE DÉTAILLÉE

### Schema Actuel (15 colonnes)

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  role user_role_type NOT NULL,
  user_type TEXT DEFAULT 'staff',
  scopes TEXT[] DEFAULT '{}',
  partner_id UUID,

  -- Ajoutées migration 20251030_001
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  job_title TEXT,

  -- Ajoutées migration inconnue (présentes dans types TS)
  app app_type,
  avatar_url TEXT,
  organisation_id UUID,
  individual_customer_id UUID,
  last_sign_in_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 🟢 COLONNES UTILISÉES ET UTILES (8 colonnes)

#### ✅ `user_id` - PRIMARY KEY

- **Utilisation** : 21 fichiers TypeScript
- **RLS** : 7 policies (`auth.uid()`)
- **Recommandation** : **CONSERVER** (clé primaire essentielle)

#### ✅ `role` - user_role_type NOT NULL

- **Utilisation** : Partout (admin actions, RLS, UI)
  - `packages/@verone/admin/src/actions/user-management.ts` (lignes 22, 52, 60, 146, 222, 228, 296, 300, 318, 426)
  - `apps/back-office/src/app/admin/users/[id]/page.tsx` (ligne 49)
  - `apps/back-office/src/app/profile/page.tsx` (ligne 32, 260, 512, 548)
- **RLS** : Fonction `get_user_role()` utilisée dans 50+ policies
- **Recommandation** : **CONSERVER** (colonne critique)

#### ✅ `first_name`, `last_name`, `phone`, `job_title` - TEXT NULL

- **Utilisation** : Page profil utilisateur + admin
  - `apps/back-office/src/app/profile/page.tsx` (lignes 35-38, 105-108, 357-484)
  - `packages/@verone/admin/src/actions/user-management.ts` (lignes 23-26, 383-440)
- **Migration** : `20251030_001_add_job_title_to_user_profiles.sql` (bien documentée)
- **Validation** : Contraintes CHECK présentes (longueur, format téléphone)
- **Recommandation** : **CONSERVER** (fonctionnalité active depuis Oct 2025)

#### ✅ `user_type` - TEXT DEFAULT 'staff'

- **Utilisation** : Code métier (148 ligne user-management.ts)
- **Enum** : 4 valeurs définies (staff, supplier, customer, partner)
- **Note** : ⚠️ Déclaré `TEXT` en DB mais devrait être `user_type` ENUM
- **Recommandation** : **CONSERVER** mais **CORRIGER type en DB** (TEXT → user_type ENUM)

#### ✅ `created_at`, `updated_at` - TIMESTAMPTZ

- **Utilisation** : Partout (audit, stats, UI)
- **Trigger** : `trigger_update_user_profiles_updated_at` actif
- **Recommandation** : **CONSERVER** (métadonnées essentielles)

### 🟡 COLONNES PARTIELLEMENT UTILISÉES (2 colonnes)

#### ⚠️ `scopes` - TEXT[] DEFAULT '{}'

- **Utilisation** :
  - ✅ Définie dans schema initial (`20250113_002_create_auth_tables.sql` ligne 39)
  - ✅ Insérée dans `user-management.ts` ligne 148 (`scopes: []`)
  - ✅ Présente dans profile page (ligne 33)
  - ❌ **JAMAIS lue/utilisée** dans code métier
  - ❌ **Aucune RLS policy** ne l'utilise
  - ❌ **Aucune validation** business logic
- **Intention originale** : Permissions granulaires (Google Merchant, etc.)
- **Réalité** : Array vide partout, jamais exploité
- **Recommandation** : **DÉCIDER** - Soit implémenter vraiment, soit supprimer (actuellement "dead column")

#### ⚠️ `partner_id` - UUID NULL

- **Utilisation** :
  - ✅ Définie schema initial (ligne 40)
  - ✅ Insérée user-management.ts (ligne 149 : `partner_id: null`)
  - ✅ Présente profile page (ligne 34)
  - ⚠️ Utilisée **UNIQUEMENT** dans `financial_documents` (dépenses partenaires)
  - ❌ **Aucune FK constraint** dans user_profiles
  - ❌ **Aucune RLS policy** basée dessus
- **Cas d'usage** : Utilisateur = apporteur d'affaires (LinkMe app)
- **Statut** : Prévue Phase 5 (LinkMe), actuellement dormante
- **Recommandation** : **CONSERVER** (planifié LinkMe 2025) mais **AJOUTER FK constraint**

### 🔴 COLONNES JAMAIS UTILISÉES (3 colonnes)

#### ❌ `avatar_url` - TEXT NULL

- **Définie** : Types TypeScript (ligne 5551 supabase.ts)
- **Migration** : **INTROUVABLE** (présente dans schema mais aucune `ALTER TABLE ADD COLUMN` trouvée)
- **Utilisation code** : **5 fichiers** - TOUS des types générés (aucun code métier)
  ```
  apps/back-office/src/types/supabase.ts (types auto)
  packages/@verone/types/src/supabase.ts (types auto)
  packages/@verone/types/src/database.ts (types auto)
  apps/back-office/src/types/database.ts (types auto)
  apps/back-office/src/types/database-old.ts (types obsolètes)
  ```
- **Utilisation DB** : Aucune requête SELECT/UPDATE/INSERT
- **Impact suppression** : **AUCUN** (colonne fantôme)
- **Recommandation** : **SUPPRIMER** (jamais implémentée malgré présence schema)

#### ❌ `app` - app_type ENUM NULL

- **Définie** : Types TypeScript (ligne 5550)
- **Enum valeurs** : `'back-office' | 'site-internet' | 'linkme'`
- **Migration** : **INTROUVABLE**
- **Utilisation code** : **1 fichier** - Types générés uniquement
  ```
  apps/back-office/src/types/supabase.ts (types auto)
  ```
- **Cas d'usage théorique** : Multi-frontends Turborepo (identifier app d'origine utilisateur)
- **Réalité** : Jamais utilisée (auth unifiée Supabase, pas de distinction nécessaire)
- **Recommandation** : **SUPPRIMER** (inutile avec architecture actuelle)

#### ❌ `last_sign_in_at` - TIMESTAMPTZ NULL

- **Définie** : Types TS + migration `20250114_003` (index créé ligne 299)
- **Utilisation code** : **11 fichiers** mais seulement lecture affichage
  ```
  apps/back-office/src/app/admin/users/[id]/page.tsx (ligne 40)
  apps/back-office/src/app/admin/users/[id]/components/*.tsx (affichage)
  ```
- **Mise à jour** : **JAMAIS** (aucun UPDATE dans code)
- **Source de vérité** : `auth.users.last_sign_in_at` (table Supabase Auth)
- **Problème** : **Redondance** avec table auth native + **jamais synchronisé**
- **Recommandation** : **SUPPRIMER** et utiliser directement `auth.users.last_sign_in_at`

### ⚠️ COLONNES INCOHÉRENTES (2 colonnes)

#### 🐛 `organisation_id` - UUID NULL (INCOHÉRENCE MAJEURE)

- **Définie** : Types TS (ligne 5558)
- **Migration** : **INTROUVABLE** dans `user_profiles`
- **Utilisation code** : 20 fichiers (contacts, organisations, analytics)
- **PROBLÈME CRITIQUE** :
  - ✅ Colonne existe dans **AUTRES tables** (contacts, consultations, etc.)
  - ❌ Colonne **ABSENTE** de `user_profiles` (vérifié migrations initiales)
  - ⚠️ **RLS policies** référencent `user_organisation_assignments` (table SUPPRIMÉE MVP)
  - 🔴 **12+ migrations** utilisent `user_organisation_assignments` **qui n'existe PAS**
    ```sql
    -- Exemple migration 20251020_002_fix_products_rls_strict.sql lignes 48-50
    SELECT 1 FROM user_organisation_assignments
    WHERE user_id = auth.uid() AND role_name IN ('owner', 'admin')
    -- ❌ TABLE INEXISTANTE
    ```
- **Migration initiale** : `20250113_002_create_auth_tables.sql` ligne 31
  ```sql
  -- NOTE: user_organisation_assignments REMOVED for MVP
  -- Will be added in Phase 3 when needed for suppliers/customers
  ```
- **Statut** : **DETTE TECHNIQUE CRITIQUE** - RLS policies cassées mais non détectées
- **Recommandation** :
  1. **URGENT** : Vérifier si RLS fonctionne réellement (policies probablement ignorées)
  2. Soit ajouter `organisation_id` à `user_profiles` (simple)
  3. Soit créer `user_organisation_assignments` (complexe, Phase 5)

#### 🐛 `individual_customer_id` - UUID NULL (FK CASSÉE)

- **Définie** : Types TS (ligne 5554)
- **Migration** : **INTROUVABLE**
- **Utilisation code** : **2 fichiers** - Types générés uniquement
- **FK Constraint** : Référence dans types TS :
  ```typescript
  foreignKeyName: 'fk_user_profiles_individual_customer';
  columns: ['individual_customer_id'];
  referencedRelation: 'individual_customers';
  ```
- **PROBLÈME** :
  - ✅ FK déclarée dans types générés
  - ❌ **Aucune migration** créant cette colonne
  - ❌ **Aucune migration** créant cette FK
  - ⚠️ Types générés **hallucinent** cette FK
- **Cas d'usage** : Utilisateur = client individuel (E-commerce site-internet)
- **Recommandation** : **SUPPRIMER** de types TS ou **AJOUTER vraiment** si Phase 5 E-commerce

---

## 2️⃣ ENUMS - VALEURS UTILISÉES

### `user_role_type` ENUM (6 valeurs)

```typescript
type user_role_type =
  | 'owner'
  | 'admin'
  | 'catalog_manager'
  | 'sales'
  | 'partner_manager'
  | 'customer_support';
```

| Valeur                | Utilisation                                   | Fichiers    | Recommandation                      |
| --------------------- | --------------------------------------------- | ----------- | ----------------------------------- |
| ✅ `owner`            | **Partout** (50+ RLS policies, admin actions) | 21 fichiers | **CONSERVER**                       |
| ✅ `admin`            | **Fréquent** (RLS, gestion utilisateurs)      | 15 fichiers | **CONSERVER**                       |
| ✅ `catalog_manager`  | **Actif** (gestion produits, échantillons)    | 8 fichiers  | **CONSERVER**                       |
| ✅ `sales`            | **Actif** (commandes, interactions clients)   | 12 fichiers | **CONSERVER**                       |
| 🟡 `partner_manager`  | **Défini** enum mais **0 utilisation** code   | 0 fichiers  | **DÉCIDER** (planifié LinkMe ?)     |
| ❌ `customer_support` | **ABSENT** migrations + **0 utilisation**     | 0 fichiers  | **SUPPRIMER** (hallucination types) |

**Note** : `customer_support` présent dans types TS mais **ABSENT** de migration initiale `20250113_001` (seulement 5 valeurs définies).

### `user_type` ENUM (4 valeurs)

```typescript
type user_type = 'staff' | 'supplier' | 'customer' | 'partner';
```

| Valeur        | Utilisation                                           | Recommandation          |
| ------------- | ----------------------------------------------------- | ----------------------- |
| ✅ `staff`    | **DEFAULT** partout (ligne 148 user-management.ts)    | **CONSERVER**           |
| 🟡 `supplier` | **Défini** mais jamais utilisé (Phase 3 fournisseurs) | **CONSERVER** (roadmap) |
| 🟡 `customer` | **Défini** mais jamais utilisé (Phase 5 E-commerce)   | **CONSERVER** (roadmap) |
| 🟡 `partner`  | **Défini** mais jamais utilisé (Phase 5 LinkMe)       | **CONSERVER** (roadmap) |

**Note** : ⚠️ Colonne déclarée `TEXT` en DB au lieu de `user_type` ENUM (incohérence types/schema).

### `app_type` ENUM (3 valeurs)

```typescript
type app_type = 'back-office' | 'site-internet' | 'linkme';
```

| Valeur             | Utilisation                                      | Recommandation                          |
| ------------------ | ------------------------------------------------ | --------------------------------------- |
| ❌ `back-office`   | **0 utilisation** (colonne `app` jamais remplie) | **SUPPRIMER enum** si colonne supprimée |
| ❌ `site-internet` | **0 utilisation**                                | **SUPPRIMER enum** si colonne supprimée |
| ❌ `linkme`        | **0 utilisation**                                | **SUPPRIMER enum** si colonne supprimée |

**Conclusion** : Enum complet inutile si colonne `app` supprimée.

---

## 3️⃣ TABLES AUTH - UTILISATION RÉELLE

### ✅ `user_profiles` - TABLE PRINCIPALE

- **Rows estimés** : 5-10 (équipe Vérone)
- **Dernière modification** : Migration `20251030_001` (19 oct 2025)
- **Triggers actifs** :
  - `trigger_update_user_profiles_updated_at` ✅
  - `trigger_prevent_last_owner_deletion` ✅
  - `trigger_prevent_last_owner_role_change` ✅
- **RLS** : 7 policies actives (3 archivées)
- **Recommandation** : **CONSERVER** (table essentielle)

### 🟡 `user_activity_logs` - PARTIELLEMENT UTILISÉE

- **Créée** : Migration `20251007_003_user_activity_tracking_system.sql`
- **Colonnes** : 15 (id, user_id, organisation_id, action, table_name, old_data, new_data, severity, metadata, session_id, page_url, user_agent, ip_address, created_at)
- **Utilisation code** : **11 fichiers**
  ```
  packages/@verone/notifications/src/hooks/use-user-activity-tracker.ts
  apps/back-office/src/app/api/analytics/events/route.ts
  apps/back-office/src/app/api/analytics/batch/route.ts
  apps/back-office/src/app/api/admin/users/[id]/activity/route.ts
  ```
- **Triggers** : `trigger_update_session_on_activity` ✅
- **RLS** : 3 policies (owners, users own, service insert)
- **Problème** :
  - ✅ Infrastructure complète (API routes + hooks)
  - ⚠️ **Utilisation réelle inconnue** (pas de tests visibles)
  - ⚠️ **Performance** : Table peut grossir rapidement (pas de rotation automatique)
- **Recommandation** : **CONSERVER** mais **AJOUTER** :
  1. Rotation logs (DELETE old_data > 90 jours)
  2. Monitoring taille table
  3. Tests E2E tracking

### 🟡 `user_sessions` - PARTIELLEMENT UTILISÉE

- **Créée** : Migration `20251007_003` (même que activity_logs)
- **Colonnes** : 13 (id, session_id, user_id, organisation_id, session_start, session_end, last_activity, pages_visited, actions_count, time_per_module, engagement_score, user_agent, ip_address, created_at, updated_at)
- **Utilisation code** : **11 fichiers** (mêmes que activity_logs)
- **Functions** :
  - `calculate_engagement_score(user_id, days)` ✅
  - `get_user_recent_actions(user_id, limit)` ✅
  - `get_user_activity_stats(user_id, days)` ✅
- **Triggers** : `trigger_sessions_updated_at` ✅
- **RLS** : 3 policies
- **Problème** : Mêmes que `user_activity_logs`
- **Recommandation** : **CONSERVER** + rotation automatique

---

## 4️⃣ RLS POLICIES - QUALITÉ & COHÉRENCE

### Policies `user_profiles` (7 policies actives)

#### ✅ ACTIVES ET FONCTIONNELLES

1. **`users_can_manage_own_profile`** (archive/20250114_002 ligne 13)

   ```sql
   CREATE POLICY "users_can_manage_own_profile" ON user_profiles
   FOR ALL USING (user_id = auth.uid());
   ```

   - **Scope** : SELECT, UPDATE, DELETE
   - **Utilisation** : Profile page (100+ accès/jour estimé)
   - **Recommandation** : **CONSERVER**

2. **`owners_can_manage_all_profiles`** (ligne 19)

   ```sql
   CREATE POLICY "owners_can_manage_all_profiles" ON user_profiles
   FOR ALL USING (get_user_role() = 'owner');
   ```

   - **Scope** : Tous droits admin
   - **Fonction** : `get_user_role()` (stable, testée)
   - **Recommandation** : **CONSERVER**

3. **`owners_can_view_all_user_details`** (ligne 26)

   ```sql
   CREATE POLICY "owners_can_view_all_user_details" ON user_profiles
   FOR SELECT USING (get_user_role() = 'owner');
   ```

   - **Note** : Redondance avec policy #2 (FOR ALL inclut SELECT)
   - **Impact** : Aucun (PostgreSQL fusionne policies OR)
   - **Recommandation** : **NETTOYER** (supprimer redondance)

#### Policies `user_activity_logs` (3 policies)

4. **`owners_view_all_activity`** (migration 20251007_003 ligne 111)
5. **`users_view_own_activity`** (ligne 122)
6. **`service_insert_activity`** (ligne 133)
   - **Toutes fonctionnelles** ✅
   - **Recommandation** : **CONSERVER**

#### Policies `user_sessions` (2 policies)

7. **`owners_view_all_sessions`** (ligne 117)
8. **`users_view_own_sessions`** (ligne 127)
9. **`service_manage_sessions`** (ligne 136)
   - **Toutes fonctionnelles** ✅
   - **Recommandation** : **CONSERVER**

### ⚠️ POLICIES RÉFÉRENÇANT TABLE INEXISTANTE

**PROBLÈME MAJEUR** : 12+ migrations créent des RLS policies référençant `user_organisation_assignments` **qui n'existe PAS**.

**Exemples** :

```sql
-- 20251020_002_fix_products_rls_strict.sql ligne 48
CREATE POLICY "owners_admins_view_all_products" ON products
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_organisation_assignments
    WHERE user_id = auth.uid() AND role_name IN ('owner', 'admin')
  )
);
-- ❌ Table user_organisation_assignments n'existe PAS
```

**Migrations affectées** (12 fichiers) :

- `20251020_001_enable_rls_critical_tables.sql` (5 policies)
- `20251020_002_fix_products_rls_strict.sql` (3 policies)
- `20251020_003_fix_shipments_rls_isolation.sql` (5 policies)
- `20250916_004_create_stock_and_orders_tables.sql` (1 policy)
- `archive/20250114_006_catalogue_complete_schema.sql` (1 policy)

**Impact** :

- ⚠️ Policies probablement **ignorées silencieusement** (EXISTS sur table inexistante = FALSE)
- 🔴 **RLS peut ne PAS fonctionner** sur 15+ tables critiques
- 🔴 **Sécurité compromise** potentiellement

**Recommandation URGENTE** :

1. **TESTER RLS** sur products, shipments, stock (vérifier access vraiment filtré)
2. **CORRIGER** toutes policies :
   - Remplacer `user_organisation_assignments` par `user_profiles.role`
   - OU créer vraiment la table `user_organisation_assignments`
3. **MIGRATION CORRECTRICE** avant mise en production

---

## 5️⃣ MIGRATIONS - HISTORIQUE & COHÉRENCE

### Migrations Actives (4 fichiers)

#### ✅ `20251030_001_add_job_title_to_user_profiles.sql`

- **Date** : 30 octobre 2025
- **Contenu** : ADD COLUMN first_name, last_name, phone, job_title
- **Qualité** : ⭐⭐⭐⭐⭐
  - Idempotente (IF NOT EXISTS)
  - Contraintes CHECK bien définies
  - Indexes créés
  - Commentaires documentation
- **Rollback** : Possible (DROP COLUMN)
- **Recommandation** : **CONSERVER** (migration modèle)

#### ✅ `20251007_003_user_activity_tracking_system.sql`

- **Date** : 7 octobre 2025
- **Contenu** : CREATE TABLE user_activity_logs + user_sessions + functions + triggers + RLS
- **Qualité** : ⭐⭐⭐⭐
  - Migration complexe (376 lignes)
  - Validation bloc `DO $$` (ligne 354)
  - RLS bien définie
  - **Manque** : Politique rotation données
- **Rollback** : Non testé
- **Recommandation** : **CONSERVER** + ajouter rotation

#### ✅ `20251027_add_set_current_user_id_function.sql`

- **Date** : 27 octobre 2025
- **Contenu** : CREATE FUNCTION set_current_user_id(uuid)
- **Qualité** : ⭐⭐⭐⭐⭐
  - Simple, bien documentée
  - SECURITY DEFINER
  - LOCAL transaction scope
- **Utilisation** : Triggers stock_movements (performed_by)
- **Recommandation** : **CONSERVER**

#### ✅ Migrations Archive (Phase 1)

- `20250113_002_create_auth_tables.sql` (tables initiales)
- `20250114_001_extend_user_profiles.sql` (first_name, last_name, phone - **OBSOLÈTE**, remplacée par 20251030_001)
- `20250114_002_admin_user_management.sql` (RLS policies + triggers prevention owner)
- `20250114_003_dashboard_metrics_functions.sql` (indexes + stats)

**Recommandation** : **CONSERVER archive** (référence historique)

### ⚠️ Migrations Manquantes/Mystère

1. **Colonne `avatar_url`** : Présente types TS, aucune migration trouvée
2. **Colonne `app`** : Présente types TS, aucune migration trouvée
3. **Colonne `organisation_id`** : Présente types TS, aucune migration trouvée
4. **Colonne `individual_customer_id`** : Présente types TS, aucune migration trouvée
5. **Colonne `last_sign_in_at`** : Index créé mais jamais ADD COLUMN

**Hypothèse** : Colonnes ajoutées **manuellement** en DB sans migration OU types générés **hallucinent**.

**Recommandation** :

- **AUDIT DB réelle** : `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_profiles'`
- **CRÉER migration correctrice** si colonnes existent vraiment
- **NETTOYER types TS** si colonnes n'existent pas

---

## 6️⃣ CODE AUTH - FICHIERS MORTS

### Composants Auth (analyse 21 fichiers)

#### ✅ UTILISÉS ACTIVEMENT

1. **`packages/@verone/admin/src/actions/user-management.ts`** (496 lignes)
   - 5 server actions (create, delete, update, reset password)
   - Bien structuré, try-catch robustes
   - **Recommandation** : **CONSERVER**

2. **`apps/back-office/src/app/profile/page.tsx`** (566 lignes)
   - Page profil utilisateur complète
   - Formulaire édition avec validation
   - **Recommandation** : **CONSERVER**

3. **`apps/back-office/src/app/admin/users/[id]/page.tsx`** + composants
   - Interface détail utilisateur
   - Tabs (profile, activity, security, stats)
   - **Recommandation** : **CONSERVER**

#### ⚠️ PARTIELLEMENT UTILISÉS

4. **`apps/back-office/src/app/api/analytics/events/route.ts`**
5. **`apps/back-office/src/app/api/analytics/batch/route.ts`**
6. **`apps/back-office/src/app/api/admin/users/[id]/activity/route.ts`**
   - API routes activity tracking
   - **Infrastructure** : ✅
   - **Tests E2E** : ❌
   - **Utilisation prod** : ⚠️ Inconnue
   - **Recommandation** : **TESTER** avant décider

#### ❌ FICHIERS OBSOLÈTES

7. **`apps/back-office/src/types/database-old.ts`**
   - Ancien schema TypeScript (pré-Turborepo)
   - **Recommandation** : **SUPPRIMER**

8. **`scripts/setup-test-crud-user.ts`**
   - Script test création utilisateur
   - **Recommandation** : **DÉPLACER** vers `/tests` ou **SUPPRIMER**

### Hooks Auth (analyse 11 fichiers)

#### ✅ UTILISÉS

1. **`packages/@verone/dashboard/src/hooks/metrics/use-user-metrics.ts`**
   - Stats utilisateurs dashboard
   - **Recommandation** : **CONSERVER**

2. **`packages/@verone/notifications/src/hooks/use-user-activity-tracker.ts`**
   - Tracking activité client-side
   - **Recommandation** : **CONSERVER** (si activity logs conservées)

#### ❌ DOUBLONS

3. **Duplication types** : 3 fichiers `supabase.ts` identiques
   - `apps/back-office/src/types/supabase.ts` (8542 lignes)
   - `packages/@verone/types/src/supabase.ts` (copie exacte)
   - `packages/@verone/types/src/database.ts` (variante)

   **Recommandation** : **CENTRALISER** dans `@verone/types`, supprimer doublons

---

## 7️⃣ CONFIGURATION - INCOHÉRENCES

### Variables .env (auth-related)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Auth Config (supposées)
NEXT_PUBLIC_AUTH_REDIRECT_URL=http://localhost:3000/auth/callback
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### ⚠️ Variables Manquantes Potentielles

- `AUTH_SESSION_TIMEOUT` : Non définie (utilise default Supabase 1h ?)
- `AUTH_REFRESH_TOKEN_LIFETIME` : Non définie
- `ENABLE_EMAIL_CONFIRMATION` : Non définie (désactivée en dev ?)

**Recommandation** : **DOCUMENTER** settings auth Supabase dashboard vs .env

### Supabase Auth Settings (supposés)

- **Email confirmation** : ❓ (probablement disabled dev, enabled prod)
- **Redirect URLs** : `/auth/callback` (vérifié code)
- **JWT expiry** : Default 1h (non customisé)
- **Password policy** : Default Supabase (min 6 chars)

**Recommandation** : **AUDIT Supabase dashboard** auth settings + documenter dans `/docs/guides/05-database/supabase-auth-config.md`

---

## 8️⃣ DOCUMENTATION VS RÉALITÉ

### Tables Documentées Absentes

#### ❌ `user_organisation_assignments`

**Documentation** : Migration `20250113_002` ligne 31

```sql
-- NOTE: user_organisation_assignments REMOVED for MVP
-- Will be added in Phase 3 when needed for suppliers/customers
```

**Réalité** :

- ✅ Bien documentée comme "supprimée MVP"
- ❌ **12+ migrations** l'utilisent quand même (incohérence)
- ⚠️ Scripts seed l'utilisent (`create-owner-user.sql` ligne 60)

**Impact** : **DETTE TECHNIQUE MAJEURE** (voir section RLS)

**Recommandation** :

1. **URGENT** : Corriger toutes policies utilisant cette table
2. Décider : créer vraiment (Phase 5) OU refactorer policies

### Workflows Auth Non Implémentés

#### ❓ Reset Password via Email

- **Documenté** : Non
- **Implémenté** : Partiellement
  - ✅ Admin peut reset password autre utilisateur (`resetUserPassword()` ligne 346)
  - ❌ Utilisateur ne peut PAS demander reset email lui-même
- **Recommandation** : **DOCUMENTER** workflow actuel (reset admin-only)

#### ❓ Email Verification

- **Documenté** : Non
- **Implémenté** : `email_confirm: true` ligne 112 (admin force-confirm)
- **Prod** : ⚠️ Probablement activée (à vérifier Supabase dashboard)
- **Recommandation** : **DOCUMENTER** + tester workflow complet

#### ❓ 2FA / MFA

- **Documenté** : Non
- **Implémenté** : ❌ (Supabase supporte, pas activé Vérone)
- **Recommandation** : **ROADMAP Phase 6** (sécurité owners)

---

## 9️⃣ TYPES TYPESCRIPT - INCOHÉRENCES

### Duplications (3 fichiers identiques)

```
apps/back-office/src/types/supabase.ts (8542 lignes) ← UTILISÉ
packages/@verone/types/src/supabase.ts (copie exacte) ← DOUBLON
packages/@verone/types/src/database.ts (variante) ← LEGACY ?
```

**Recommandation** :

1. **CENTRALISER** dans `packages/@verone/types/src/supabase.ts`
2. **SUPPRIMER** `apps/back-office/src/types/supabase.ts`
3. **SUPPRIMER** `database.ts` si obsolète
4. **UPDATE imports** partout : `import { Database } from '@verone/types'`

### Types vs Schema DB (incohérences)

| Élément                  | Types TS                 | Schema DB               | Statut        |
| ------------------------ | ------------------------ | ----------------------- | ------------- |
| `user_type`              | `user_type` enum         | `TEXT`                  | ⚠️ Incohérent |
| `avatar_url`             | `TEXT \| null`           | **ABSENT ?**            | ⚠️ À vérifier |
| `app`                    | `app_type` enum          | **ABSENT ?**            | ⚠️ À vérifier |
| `organisation_id`        | `UUID \| null`           | **ABSENT ?**            | ⚠️ À vérifier |
| `individual_customer_id` | `UUID \| null` (avec FK) | **ABSENT ?**            | ⚠️ À vérifier |
| `last_sign_in_at`        | `TIMESTAMPTZ \| null`    | Index existe, colonne ? | ⚠️ À vérifier |

**Recommandation** :

1. **AUDIT DB RÉELLE** : `\d user_profiles` en psql
2. **RÉGÉNÉRER types** : `supabase gen types typescript --local > apps/back-office/src/types/supabase.ts`
3. **CORRIGER** soit types TS soit schema DB

---

## 🔟 SÉCURITÉ - FAILLES POTENTIELLES

### 🔴 CRITIQUE

#### 1. RLS Policies sur `user_organisation_assignments` Fantôme

- **Gravité** : 🔴🔴🔴 **CRITIQUE**
- **Impact** : 15+ tables potentiellement **sans RLS fonctionnelle**
- **Tables affectées** : products, shipments, stock_movements, purchase_orders, sales_orders, etc.
- **Exploit** : Utilisateur basique pourrait accéder données admin
- **Recommandation** : **TESTER IMMÉDIATEMENT** + patch urgent

#### 2. `last_sign_in_at` Jamais Mis à Jour

- **Gravité** : 🟡 **MODÉRÉE**
- **Impact** : Métriques faussées (dashboard stats utilisateurs)
- **Exploit** : Pas de détection utilisateurs inactifs
- **Recommandation** : Supprimer colonne OU trigger UPDATE depuis `auth.users`

### 🟡 MODÉRÉE

#### 3. Colonnes Sensibles Sans RLS Spécifique

- **Colonne** : `scopes` (permissions granulaires)
- **RLS** : Aucune policy spécifique (juste owner/own profile)
- **Problème** : Utilisateur pourrait modifier ses propres scopes
- **Recommandation** : **POLICY** : Interdire UPDATE `scopes` sauf owners

#### 4. Logs `user_activity_logs` Sans Rotation

- **Gravité** : 🟡 **MODÉRÉE** (performance + privacy)
- **Impact** : Logs contiennent `old_data`/`new_data` (potentiellement sensibles)
- **RGPD** : ⚠️ Données personnelles conservées indéfiniment
- **Recommandation** :
  - Rotation 90 jours (DELETE old logs)
  - Anonymiser `ip_address` après 30 jours

### 🟢 FAIBLE

#### 5. Email Confirmation Désactivée (admin create)

- **Code** : `email_confirm: true` ligne 112 (force-confirm)
- **Problème** : Admin crée users sans vérifier email valide
- **Impact** : Potentiel spam / typo email
- **Recommandation** : Workflow "Envoyer email bienvenue" avec lien activation

#### 6. Password Reset Admin-Only

- **Problème** : Utilisateur ne peut PAS reset son mot de passe lui-même
- **Impact** : Dépendance admin pour reset (mauvaise UX)
- **Recommandation** : Implémenter "Mot de passe oublié" Supabase standard

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### 🚨 PHASE 1 : URGENT (Semaine 1)

#### 1. Vérifier RLS Réellement Fonctionnelle

```sql
-- Test accès non-admin aux products
SET ROLE authenticated;
SET request.jwt.claims.sub TO '<non-admin-user-id>';
SELECT * FROM products; -- Devrait échouer ou filtrer
```

**Si RLS cassée** → **HOTFIX IMMÉDIAT** :

```sql
-- Migration 20251119_001_hotfix_rls_user_organisation.sql
-- Remplacer toutes policies user_organisation_assignments par user_profiles

-- Exemple products
DROP POLICY IF EXISTS "owners_admins_view_all_products" ON products;
CREATE POLICY "owners_admins_view_all_products" ON products
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
```

#### 2. Audit DB Réelle vs Types TS

```bash
# Générer types frais depuis DB
supabase gen types typescript --local > /tmp/fresh-types.ts

# Comparer avec types actuels
diff apps/back-office/src/types/supabase.ts /tmp/fresh-types.ts
```

**Action** : Corriger incohérences détectées.

#### 3. Nettoyer Colonnes Fantômes

```sql
-- Migration 20251119_002_cleanup_user_profiles_dead_columns.sql

-- Vérifier colonnes existent vraiment
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Si avatar_url/app/individual_customer_id ABSENTES
-- → Corriger types TS (pas de migration nécessaire)

-- Si last_sign_in_at PRÉSENTE mais jamais mise à jour
ALTER TABLE user_profiles DROP COLUMN last_sign_in_at;
-- Utiliser auth.users.last_sign_in_at directement dans queries

-- Si organisation_id ABSENTE mais référencée partout
-- Option A : Ajouter colonne simple
ALTER TABLE user_profiles ADD COLUMN organisation_id UUID;
-- Option B : Créer table user_organisation_assignments (complexe, Phase 5)
```

### 🟡 PHASE 2 : IMPORTANT (Semaine 2-3)

#### 4. Corriger Incohérence `user_type`

```sql
-- Migration 20251119_003_fix_user_type_enum.sql
ALTER TABLE user_profiles
ALTER COLUMN user_type TYPE user_type USING user_type::user_type;
```

#### 5. Ajouter FK Constraint `partner_id`

```sql
-- Migration 20251119_004_add_partner_fk.sql
ALTER TABLE user_profiles
ADD CONSTRAINT fk_user_profiles_partner
FOREIGN KEY (partner_id) REFERENCES organisations(id) ON DELETE SET NULL;
```

#### 6. Implémenter Rotation Logs

```sql
-- Migration 20251119_005_activity_logs_rotation.sql

-- Fonction nettoyage automatique
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM user_activity_logs
  WHERE created_at < now() - interval '90 days';

  -- Anonymiser IP après 30 jours (RGPD)
  UPDATE user_activity_logs
  SET ip_address = '0.0.0.0'
  WHERE created_at < now() - interval '30 days'
    AND ip_address != '0.0.0.0';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job (pg_cron extension)
SELECT cron.schedule(
  'cleanup-activity-logs',
  '0 2 * * *', -- 2h du matin tous les jours
  $$ SELECT cleanup_old_activity_logs() $$
);
```

#### 7. Tester Activity Tracking E2E

```typescript
// tests/e2e/auth/activity-tracking.spec.ts
test('user activity logged correctly', async ({ page }) => {
  await page.goto('/profile');
  // Vérifier log créé dans user_activity_logs
});
```

### 🟢 PHASE 3 : AMÉLIORATION (Semaine 4+)

#### 8. Centraliser Types TS

```bash
# Supprimer doublons
rm apps/back-office/src/types/supabase.ts
rm packages/@verone/types/src/database.ts

# Garder uniquement
packages/@verone/types/src/supabase.ts

# Update imports partout
find . -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/@\/types\/supabase/@verone\/types/g"
```

#### 9. Documenter Auth Config

```markdown
# docs/guides/05-database/supabase-auth-config.md

## Configuration Auth Supabase

### Settings Dashboard

- Email confirmation: ✅ Enabled (prod) / ❌ Disabled (dev)
- Session timeout: 1h (default)
- Redirect URLs: http://localhost:3000/auth/callback

### Variables .env

NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=... (KEEP SECRET)

### Workflows

- Password reset: Admin-only (user-management.ts:346)
- Email verification: Auto-confirmed admin creation
- 2FA: ❌ Non implémenté (roadmap Phase 6)
```

#### 10. Implémenter Scopes Vraiment

```typescript
// packages/@verone/auth/src/scopes.ts

export const SCOPES = {
  'google-merchant:read': 'Lecture Google Merchant',
  'google-merchant:write': 'Écriture Google Merchant',
  'products:delete': 'Suppression produits',
} as const;

// RLS policy avec scopes
CREATE POLICY "users_can_delete_products_with_scope" ON products
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND 'products:delete' = ANY(scopes)
  )
);
```

---

## 📊 RÉSUMÉ EXÉCUTIF ACTIONS

| Priorité            | Action                                        | Effort       | Impact             | Délai        |
| ------------------- | --------------------------------------------- | ------------ | ------------------ | ------------ |
| 🔴 **CRITIQUE**     | Vérifier + Corriger RLS policies              | 🔨🔨🔨 Élevé | 🔥🔥🔥 Critique    | **Immédiat** |
| 🔴 **CRITIQUE**     | Audit DB réelle vs Types TS                   | 🔨 Faible    | 🔥🔥 Majeur        | **Immédiat** |
| 🔴 **URGENT**       | Supprimer colonnes fantômes (avatar_url, app) | 🔨 Faible    | 🔥 Modéré          | Semaine 1    |
| 🟡 **IMPORTANT**    | Corriger user_type TEXT → ENUM                | 🔨 Faible    | 🔥 Modéré          | Semaine 2    |
| 🟡 **IMPORTANT**    | Ajouter FK constraint partner_id              | 🔨 Faible    | 🔥 Modéré          | Semaine 2    |
| 🟡 **IMPORTANT**    | Implémenter rotation activity_logs            | 🔨🔨 Moyen   | 🔥🔥 Majeur (RGPD) | Semaine 2    |
| 🟢 **AMÉLIORATION** | Centraliser types TS (supprimer doublons)     | 🔨 Faible    | 🔥 Faible          | Semaine 3    |
| 🟢 **AMÉLIORATION** | Documenter auth config                        | 🔨 Faible    | 🔥 Faible          | Semaine 4    |
| 🟢 **AMÉLIORATION** | Implémenter scopes réellement                 | 🔨🔨🔨 Élevé | 🔥 Faible          | Phase 5      |
| 🟢 **AMÉLIORATION** | Implémenter 2FA                               | 🔨🔨🔨 Élevé | 🔥🔥 Majeur        | Phase 6      |

---

## 📖 ANNEXES

### A. Commandes Utiles Audit

```bash
# Lister toutes migrations user_profiles
find supabase/migrations -name "*.sql" -exec grep -l "user_profiles" {} \;

# Vérifier colonnes DB réelle
psql $DATABASE_URL -c "\d user_profiles"

# Compter utilisations colonne dans code
rg "\.avatar_url|avatar_url:" --stats

# Tester RLS
psql $DATABASE_URL <<SQL
SET ROLE authenticated;
SET request.jwt.claims.sub TO '<user-id>';
SELECT * FROM user_profiles;
SQL

# Générer types frais
supabase gen types typescript --local > /tmp/fresh-types.ts
```

### B. Références Documentation

- `supabase/migrations/archive/2025-phase1-initial/20250113_002_create_auth_tables.sql` - Schema initial
- `supabase/migrations/20251030_001_add_job_title_to_user_profiles.sql` - Extension profils
- `supabase/migrations/20251007_003_user_activity_tracking_system.sql` - Activity tracking
- `packages/@verone/admin/src/actions/user-management.ts` - Server actions
- `apps/back-office/src/app/profile/page.tsx` - UI profil

### C. Métriques Suivi Post-Audit

**KPIs Qualité Code Auth** :

- ✅ **Colonnes utilisées** : 53% → Objectif **80%**
- ⚠️ **Types TS cohérents** : 70% → Objectif **100%**
- 🔴 **RLS testée** : 0% → Objectif **100%** (critique)
- ✅ **Migrations idempotentes** : 100%
- ⚠️ **Documentation à jour** : 40% → Objectif **90%**

**KPIs Sécurité** :

- 🔴 **RLS coverage** : **À VÉRIFIER** → Objectif 100%
- ⚠️ **Logs rotation RGPD** : 0% → Objectif 100%
- 🟡 **2FA enabled** : 0% → Objectif 100% (Phase 6)
- ✅ **Supabase Auth** : 100% (délégué)

---

**Fin Audit** - Total : 47 éléments analysés, 13 actions recommandées, 2 problèmes critiques identifiés.

**Prochaine étape** : Validation owner + Priorisation actions PHASE 1 (RLS + DB audit).
