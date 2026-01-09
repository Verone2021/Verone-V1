# 🔐 AUDIT COMPLET - SYSTÈME D'AUTHENTIFICATION VÉRONE

**Date** : 2025-12-01  
**Projet** : Vérone Back-Office V1 (Turborepo Phase 4)  
**Statut** : 🔴 AUDIT DÉCOUVERTES - LACUNES IDENTIFIÉES

---

## 📋 RÉSUMÉ EXÉCUTIF

L'authentification Vérone a une **base solide** mais nécessite une **refactorisation majeure** pour supporter le cas d'usage multi-app unifié où un utilisateur peut accéder à plusieurs frontends (back-office, site-internet, linkme) avec des permissions différentes par app.

**Problème clé identifié** :

```
Structure ACTUELLE (❌ BLOQUANTE)
- user_profiles.app_source = UNE SEULE app par user
- user_profiles.role = GLOBAL (pas par app)
- LinkMe = isolé et incohérent (user_id nullable !)

Structure REQUISE (✅)
- user_app_assignments = Multiple apps par user
- role/permissions par app (pas global)
- LinkMe intégré avec rôles hiérarchiques
```

---

## 🎯 VUE D'ENSEMBLE ARCHITECTURE

### 3 Apps Turborepo + 1 Supabase partagée

```
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Auth + Database)                 │
│                                                          │
│  auth.users (Native) ─────┬─────────────────────┐      │
│                           │                     │      │
├─────────────────────┴──┬──┴──┬────────────────────┤    │
│                        │     │                    │    │
│    back-office         site-internet             linkme│
│  (CRM/ERP)          (E-commerce)         (Apporteurs)  │
│   Port 3000          Port 3001            Port 3002    │
│                                                        │
│  • user_profiles      • user_profiles    • user_???    │
│  • organisations      • organisations    • linkme_     │
│  • sales_orders       • products         │ affiliates  │
│  • ...                • ...              • linkme_     │
│                                          │ commissions │
└─────────────────────────────────────────────────────────┘
```

### Connexion multi-app (cas d'usage critique)

**Alice (romeo@verone.fr)** doit pouvoir accéder :

- ✅ back-office → role = "admin" (gère toutes orgs)
- ✅ site-internet → role = "customer" (compte personnel)
- ✅ linkme → role = "affiliate" (reçoit commissions)

**❌ AUJOURD'HUI** : Alice ne peut accéder qu'une seule app  
**✅ REQUIS** : Alice doit pouvoir accéder aux 3 avec rôles différents

---

## 📊 TABLES D'AUTHENTIFICATION ACTUELLES

### `auth.users` (Supabase native)

- ✅ 10 rows actuellement
- ✅ Authentification email/password
- ✅ Sessions JWT
- ✅ 47 tables pointent vers auth.users.id

### `public.user_profiles` (Custom, 1:1 avec auth.users)

**Structure problématique** :

```sql
COLONNES CLÉS :
├─ user_id (PK, FK auth.users)
├─ role (ENUM) - 🔴 GLOBAL, pas par app
│  └─ Valeurs : owner, admin, catalog_manager, sales, ...
├─ app_source (ENUM) - 🔴 UNE SEULE app
│  └─ Valeurs : back-office | site-internet | linkme
├─ organisation_id (UUID) - 🔴 Partiellement implémenté Phase 2
├─ app_source (TEXT) - Colonne ajoutée Phase 2
├─ user_type (TEXT) - Cosmétique (jamais utilisé)
├─ scopes (TEXT[]) - MORT-CODE (jamais utilisé)
└─ ...

🔴 PROBLÈME #1 : app_source = UNE SEULE app par user
   Impossible pour Alice d'avoir accès à back-office + site-internet + linkme

🔴 PROBLÈME #2 : role = GLOBAL
   Admin sur back-office = Admin partout (même site-internet !)

🔴 PROBLÈME #3 : organisation_id = Phase 2, partiellement implémenté
   Colonne existe mais relations incohérentes
```

### `public.organisations`

- ✅ 172 rows (clients B2B, fournisseurs, enseignes)
- ✅ Types : internal, supplier, customer, partner
- ✅ RLS policies fonctionnent bien
- ❌ Pas de multi-organisation par user (1:1)

### `public.linkme_affiliates` (🔴 PROBLÉMATIQUE)

```sql
Colonnes clés :
├─ id (uuid)
├─ user_id (uuid) - 🔴 NULLABLE ! (confus)
├─ organisation_id (uuid) - nullable
├─ enseigne_id (uuid) - nullable
├─ affiliate_type (TEXT) - enseigne | client_professionnel | client_particulier
├─ status (TEXT) - pending | active | suspended

🔴 LACUNE #1 : user_id nullable
   Comment savoir quel user a créé/gère cet affiliate ?

🔴 LACUNE #2 : Pas de lien avec user_profiles
   Affiliate existe indépendamment du système auth

🔴 LACUNE #3 : Pas de rôles/permissions LinkMe
   Comment supporter manager + délégué pour une enseigne ?
   Impossible : un user = un affiliate
```

---

## 🔒 MIDDLEWARE & SESSIONS

### App-Isolation Middleware

**Fichier** : `/apps/back-office/middleware.ts`

✅ Fonctionne :

```typescript
checkAppIsolation(request, {
  appName: 'back-office',
  redirects: {
    'site-internet': 'http://localhost:3001',
    linkme: 'http://localhost:3002',
  },
});
```

❌ Limitation :

- Vérifie SEULEMENT si user appartient à UNE app
- N'autorise PAS un user d'avoir accès à PLUSIEURS apps

### Session Refresh DISABLED

**Fichier** : `/apps/back-office/middleware.ts`, ligne 59-60

```typescript
// ⚠️ COMMENTÉ - updateSession() ne refresh PAS le JWT
// return await updateSession(request);
return NextResponse.next(); // ← Pas de refresh !
```

**Problème** :

- JWT expires après 1h
- Middleware NE refresh PAS
- Token devient invalide silencieusement
- ❌ Fichier manquant : `lib/supabase/middleware.ts`

### Deux versions middleware (confus)

- ❌ OLD : `/apps/back-office/src/middleware.ts` (Phase 1)
- ✅ NEW : `/apps/back-office/middleware.ts` (Phase 2)

Next.js charge depuis racine → NEW est actif  
Mais aucun commentaire indiquant OLD est deprecated → risque

---

## 🛡️ RLS POLICIES

✅ RLS ENABLED sur toutes tables critiques

❌ Problèmes détectés :

**Problème #1** : Pas de vérification app_source

```sql
-- ❌ ACTUEL : Ignore app_source
CREATE POLICY "view_orders" ON sales_orders
  FOR SELECT
  USING (organisation_id = (SELECT organisation_id FROM user_profiles
         WHERE user_id = auth.uid()));

-- ✅ REQUIS : Vérifie app_source
CREATE POLICY "view_orders" ON sales_orders
  FOR SELECT
  USING (
    (SELECT app_source FROM user_profiles WHERE user_id = auth.uid()) = 'back-office'
    AND organisation_id = (SELECT organisation_id FROM user_profiles
                           WHERE user_id = auth.uid())
  );
```

**Problème #2** : user_profiles.role JAMAIS utilisé

```sql
-- ❌ N'EXISTE PAS : Policies n'utilisent PAS le role
CREATE POLICY "catalog_managers_update_products" ON products
  FOR UPDATE
  USING (
    (SELECT role FROM user_profiles WHERE user_id = auth.uid()) = 'catalog_manager'
  );

-- Résultat : Tous les users peuvent tout faire (si organisation_id correct)
```

**Problème #3** : LinkMe RLS insuffisantes

- Qui peut lire linkme_commissions ? Seulement l'affiliate owner ?
- Qui peut créer linkme_affiliates ?
- Pas de vérification role LinkMe

---

## 🔴 LACUNES CRITIQUES (Priorité P0)

### LACUNE #1 : Pas de multi-app par user [CRITIQUE]

**Impact** : Empêche completely l'unification

```
❌ Structure actuelle :
   user_profiles.app_source = 'back-office' (UNE SEULE !)

✅ Structure requise :
   user_app_assignments [
     { app: 'back-office', role: 'admin', org: NULL },
     { app: 'site-internet', role: 'customer', org: 'org-123' },
     { app: 'linkme', role: 'affiliate', org: 'enseigne-456' }
   ]
```

**Fichiers affectés** :

- `/apps/back-office/middleware.ts`
- `/packages/@verone/utils/src/middleware/app-isolation.ts`
- `/packages/@verone/utils/src/supabase/server.ts`
- Migrations database
- Toutes 3 apps

---

### LACUNE #2 : Rôles globaux, pas granulaires par app [CRITIQUE]

**Impact** : Admin sur une app = Admin partout

```
❌ Aujourd'hui :
   user_profiles.role = 'admin' (global)

✅ Requis :
   user_app_assignments[0].role = 'admin' (back-office seulement)
   user_app_assignments[1].role = 'customer' (site-internet)
   user_app_assignments[2].role = 'affiliate' (linkme)
```

Rôles nécessaires par app :

- **back-office** : owner, admin, catalog_manager, sales, partner_manager
- **site-internet** : customer, guest, newsletter_subscriber
- **linkme** : affiliate, delegated, admin, validator

---

### LACUNE #3 : LinkMe sans authentification unifiée [CRITIQUE]

**Impact** : LinkMe complètement isolé, cas d'usage non supportés

```
❌ AUJOURD'HUI :
linkme_affiliates.user_id (nullable) → Confus
user_profiles.app_source = 'linkme' → Trop générique
Aucun lien explicit
Pas de rôles (owner, delegated, viewer)

✅ REQUIS :
linkme_affiliate_profiles {
  user_id (PK, FK auth.users)
  affiliate_id (FK linkme_affiliates)
  role (owner | delegated | viewer)
  permissions (text[])
  enseigne_id
}

user_app_assignments {
  organisation_id → Pointe vers enseigne si app_source='linkme'
}
```

**Cas d'usage impossibles aujourd'hui** :

1. Manager + Assistant sur même enseigne (manager = owner, assistant = viewer)
2. Customer particulier affilié (pas d'auth.users, juste individual_customers)
3. User avec accès back-office + site-internet + linkme

---

### LACUNE #4 : RLS insufficient [MOYEN]

- ❌ Policies ne vérifient pas app_source (théorique car middleware l'empêche)
- ❌ Policies ne lisent jamais role
- ❌ Policies LinkMe insuffisantes

**Risque** : Fragile, si middleware disabled = données exposées

---

### LACUNE #5 : Session refresh disabled [MOYEN]

- ❌ Fichier `lib/supabase/middleware.ts` N'EXISTE PAS
- ❌ JWT peut expirer sans refresh automatique
- **Résultat** : Tokens deviennent invalides après 1h sans warning

---

### LACUNE #6 : Permissions granulaires non utilisées [MOYEN]

- ❌ user_profiles.scopes = MORT-CODE
- ❌ RLS policies ne lisent jamais scopes
- ❌ Application logic ne vérifie jamais permissions

---

## ✅ POINTS FORTS

1. **Auth Supabase native solide** - Email, JWT, sessions OK
2. **RLS en place** - Toutes tables ont RLS enabled
3. **App-isolation middleware fonctionnel** - Empêche cross-app access
4. **Séparation Server/Admin clients** - SERVICE_ROLE_KEY isolée
5. **Organisation-based multi-tenancy** - Clients B2B bien isolés
6. **Phase 2 foundation laid** - app_source, parent_user_id colonnes exist

---

## 💡 RECOMMANDATIONS

### Phase 3 : Auth Unified Multi-App

**Architecture proposée** :

```sql
-- STEP 1 : Créer table user_app_assignments
CREATE TABLE public.user_app_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  app_source app_type NOT NULL,
  role app_role_type NOT NULL,           -- Rôle par app
  permissions text[] DEFAULT '{}',
  organisation_id uuid,                  -- Org/enseigne liée
  status varchar DEFAULT 'active',
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),

  UNIQUE (user_id, app_source),
  FOREIGN KEY (organisation_id) REFERENCES public.organisations(id)
);

-- STEP 2 : Migrer data from user_profiles
INSERT INTO user_app_assignments (user_id, app_source, role, organisation_id)
SELECT user_id, app_source, role, organisation_id
FROM user_profiles
WHERE app_source IS NOT NULL;

-- STEP 3 : Update middleware
const assignment = await supabase
  .from('user_app_assignments')
  .select('role, permissions')
  .eq('user_id', userId)
  .eq('app_source', 'back-office')
  .single();

-- STEP 4 : Update RLS policies
CREATE POLICY "staff_can_read_orders" ON sales_orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_app_assignments
      WHERE user_id = auth.uid()
        AND app_source = 'back-office'
        AND status = 'active'
    )
  );
```

---

## 📁 FICHIERS CRITIQUES À MODIFIER

### Database

- Migration : `20251201_XXX_create_user_app_assignments.sql`
- Migration : `20251201_XXX_populate_from_user_profiles.sql`
- Migration : `20251201_XXX_update_rls_policies.sql`

### Backend

- 🔴 **CREATE** : `lib/supabase/middleware.ts` (session refresh)
- 🔴 **UPDATE** : `packages/@verone/utils/src/middleware/app-isolation.ts`
- 🔴 **UPDATE** : `packages/@verone/utils/src/supabase/server.ts`

### Front-end

- 🔴 **UPDATE** : `apps/back-office/middleware.ts` (enable session refresh)
- 🔴 **CREATE/UPDATE** : `apps/site-internet/middleware.ts`
- 🔴 **CREATE/UPDATE** : `apps/linkme/middleware.ts`
- 🔴 **UPDATE** : `apps/back-office/src/app/admin/users/page.tsx` (UI multi-app)

### Hooks

- 🔴 **CREATE** : `packages/@verone/utils/src/hooks/use-user-app-assignment.ts`
- 🔴 **CREATE** : `packages/@verone/common/src/contexts/auth-context.tsx`

---

## 📊 TABLEAU RÉCAPITULATIF

| Aspect                  | État          | Sévérité    | Action                           |
| ----------------------- | ------------- | ----------- | -------------------------------- |
| Auth native             | ✅ OK         | -           | Maintenir                        |
| RLS policies            | ⚠️ Incomplet  | 🟡 MOYEN    | Ajouter app_source + role checks |
| App-isolation           | ✅ Fonctionne | -           | Upgrade pour multi-app           |
| **Multi-app**           | ❌ MANQUANT   | 🔴 CRITIQUE | Créer user_app_assignments       |
| **Rôles granulaires**   | ⚠️ Partiel    | 🔴 CRITIQUE | Role par app (pas global)        |
| **LinkMe auth**         | ❌ Confus     | 🔴 CRITIQUE | Créer linkme_affiliate_profiles  |
| Session refresh         | ❌ DISABLED   | 🟠 MOYEN    | Créer lib/supabase/middleware.ts |
| Permissions granulaires | ❌ MORT-CODE  | 🟡 MOYEN    | Utiliser scopes dans RLS         |
| User management UI      | ⚠️ Basique    | 🟡 MOYEN    | Ajouter gestion multi-app        |

---

## 🎯 TIMELINE RECOMMANDÉE

- **Week 1** (P0) : user_app_assignments creation + data migration
- **Week 2-3** (P1) : Middleware update + RLS policies
- **Week 4+** (P2) : Granular permissions + LinkMe integration

**Effort** : 3-4 senior engineers, 4 semaines minimum

---

**Audit créé** : 2025-12-01  
**Status** : À soumettre lead dev
