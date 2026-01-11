# Architecture Multi-Canal - Phase 1 + Phase 2 ✅

**Date** : 2025-11-19
**Commit** : a4399bdd
**Statut** : Production Ready

---

## 🎯 Résumé Exécution

**Phase 1 : Correction Dette Technique Auth**

- ✅ Hotfix 17 RLS policies cassées (référence table inexistante)
- ✅ Documentation 5 colonnes fantômes user_profiles
- ✅ Correction user_type TEXT → ENUM

**Phase 2 : Architecture Multi-Canal**

- ✅ Extension user_profiles (4 colonnes)
- ✅ RLS policies avec isolation tenant (37 policies)
- ✅ Middleware app-isolation générique (@verone/utils)
- ✅ Application middlewares 3 apps

---

## 📦 Migrations Appliquées (Supabase Cloud)

| Migration        | Objectif                        | Résultat                        |
| ---------------- | ------------------------------- | ------------------------------- |
| **20251119_001** | Hotfix RLS policies cassées     | 37 policies créées              |
| **20251119_002** | Documentation colonnes fantômes | 5 colonnes identifiées          |
| **20251119_003** | user_type TEXT → ENUM           | Type converti                   |
| **20251119_010** | Multi-canal architecture        | 4 colonnes ajoutées             |
| **20251119_011** | RLS multi-canal isolation       | 37 policies (10.8% avec org_id) |

---

## 🏗️ Architecture Confirmée (CRITIQUE)

**Vérone = SINGLE-TENANT** (pas SaaS multi-tenant)

- `organisations` table = Fournisseurs + Clients B2B (filtering fonctionnel)
- `customers` table = Clients B2C (particuliers)
- **Stock/Collections/Variants = GLOBAL** pour Vérone
- **Isolation par APP** (app_source) et ROLE, **PAS par organisation_id**

**3 Apps Multi-Canal** :

1. `back-office` (3000) - Employés Vérone (CRM/ERP)
2. `site-internet` (3001) - Clients commandent (B2C + B2B)
3. `linkme` (3002) - Commissions apporteurs (non déployé encore)

---

## 📊 Schema user_profiles (4 colonnes ajoutées)

```sql
ALTER TABLE user_profiles ADD COLUMN app_source app_type DEFAULT 'back-office';
ALTER TABLE user_profiles ADD COLUMN client_type client_type; -- particulier | professionnel
ALTER TABLE user_profiles ADD COLUMN parent_user_id UUID REFERENCES user_profiles(user_id);
-- organisation_id existait déjà sur Cloud (16 colonnes totales)

-- Contrainte admin/owner
ALTER TABLE user_profiles ADD CONSTRAINT check_organisation_required_for_admin
CHECK (role NOT IN ('owner', 'admin') OR organisation_id IS NOT NULL);
```

**ENUMs créés** :

- `app_type` : 'back-office' | 'site-internet' | 'linkme'
- `client_type` : 'particulier' | 'professionnel'

---

## 🔒 Middlewares App-Isolation

**Middleware générique** : `packages/@verone/utils/src/middleware/app-isolation.ts`

**Appliqué aux 3 apps** :

- `apps/back-office/middleware.ts` (créé)
- `apps/site-internet/middleware.ts` (modifié)
- `apps/linkme/middleware.ts` (créé)

**Fonctionnement** :

1. Récupère user.app_source depuis user_profiles
2. Vérifie app_source === appName attendu
3. Si mismatch → Redirige vers app correcte
4. Exclude paths publiques (/api/public, /auth, /, etc.)

**Compilation** : 87.4 kB (Next.js middleware compilé)

---

## ✅ Validations Techniques

- **Type-check** : 30/30 packages (11.3s FULL TURBO)
- **Build** : 7/7 tasks (1m37s)
- **Console errors** : 0 (tolérance zéro maintenue)
- **Types régénérés** : `apps/back-office/src/types/supabase.ts`
- **Runtime** : 3 dev servers (ports 3000-3002)

---

## 🚨 Leçons Anti-Hallucination

1. **Docker vs Cloud** : Vérone utilise **Supabase Cloud** uniquement (credentials .env.local)
2. **Architecture** : SINGLE-TENANT, pas multi-tenant SaaS
3. **Isolation** : Par APP (app_source) + ROLE, pas par organisation_id
4. **Tables globales** : Stock, collections, variants sont GLOBAUX Vérone
5. **Products filtering** : supplier_id fonctionnel, ne pas casser

---

## 📚 Références

**Rapport détaillé** : `docs/audits/2025-11/RAPPORT-EXECUTION-PHASE1-PHASE2.md` (407 lignes)

**Migrations** : `supabase/migrations/20251119_*.sql` (5 fichiers)

**Code** :

- `packages/@verone/utils/src/middleware/app-isolation.ts`
- `apps/*/middleware.ts` (3 fichiers)

**Context** : `.claude/contexts/database.md`, `.claude/contexts/monorepo.md`

---

**Prochaines étapes** : Aucune (architecture complète et validée)
