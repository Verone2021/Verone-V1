# 👥 Gestion Utilisateurs - Règles Métier

**Module** : Administration
**Date création** : 2025-10-30
**Dernière mise à jour** : 2025-10-30

---

## 📋 Vue d'Ensemble

Système de gestion des utilisateurs Vérone avec rôles, permissions et profils complets.

**Pages concernées** :

- `/admin/users` - Liste utilisateurs
- `/admin/users/[id]` - Détail utilisateur
- `/profile` - Profil personnel

**Tables database** :

- `auth.users` (Supabase Auth)
- `user_profiles` (17 colonnes)

---

## 🔐 Rôles Système

### Types de Rôles

| Rôle                | Code              | Permissions                          | Cas d'usage            |
| ------------------- | ----------------- | ------------------------------------ | ---------------------- |
| **Owner**           | `owner`           | Tous droits                          | Fondateur, accès total |
| **Admin**           | `admin`           | Gestion utilisateurs, config système | Responsable IT/Admin   |
| **Catalog Manager** | `catalog_manager` | Catalogue, stocks, commandes         | Gestionnaire catalogue |

**Enum** : `user_role_type` dans `docs/database/enums.md`

---

## 👤 Profil Utilisateur Complet

### Champs Obligatoires

- ✅ **Email** (unique, validé Supabase Auth)
- ✅ **Rôle système** (owner/admin/catalog_manager)

### Champs Optionnels (Migration 20251030_001)

| Champ        | Type | Validation       | Max Length |
| ------------ | ---- | ---------------- | ---------- |
| `first_name` | TEXT | Trim, length > 0 | 50 chars   |
| `last_name`  | TEXT | Trim, length > 0 | 50 chars   |
| `phone`      | TEXT | Format français  | -          |
| `job_title`  | TEXT | Trim, length > 0 | 100 chars  |

### Validation Téléphone

**Formats acceptés** :

```
0123456789              # Standard français
+33123456789            # International
+33 1 23 45 67 89       # Avec espaces
```

**Regex PostgreSQL** :

```sql
phone ~ '^(\+33|0)[1-9][0-9]{8}$' OR
phone ~ '^\+33\s?[1-9](\s?[0-9]{2}){4}$'
```

**Contrainte** : `check_phone_format` dans `user_profiles`

---

## ✏️ Modification Profil

### Workflow Edit User

**Page** : `/admin/users` → Modal `EditUserDialog`

**Étapes** :

1. **Affichage** :
   - Récupération valeurs depuis `user_profiles` (first_name, last_name, job_title)
   - Fallback temporaire : Extraction depuis email si colonnes vides
   - Email non modifiable (disabled)

2. **Validation** :
   - Prénom requis (minimum)
   - Job title optionnel (max 100 chars)
   - Téléphone optionnel (validation format si fourni)

3. **Sauvegarde** :
   - Update `user_profiles` colonnes (via `updateUserProfile` action)
   - Update `auth.users.user_metadata` (sync pour compatibilité)
   - Revalidation `/admin/users` page

**Code** :

- Composant : `src/components/admin/edit-user-dialog.tsx`
- Action : `src/lib/actions/user-management.ts::updateUserProfile()`

---

## 🔄 Synchronisation user_metadata

### Compatibilité Auth Supabase

Pour garantir compatibilité avec Auth Supabase, les modifications profil sont dupliquées dans `auth.users.user_metadata` :

```typescript
user_metadata: {
  name: "Prénom Nom",      // Concaténation display
  first_name: "Prénom",
  last_name: "Nom",
  job_title: "CEO"
}
```

**Note** : `user_profiles` est la source de vérité, `user_metadata` est synchronisé pour compatibilité.

---

## 🛡️ Sécurité & RLS

### Policies user_profiles

**Lecture** :

- ✅ Owner/Admin : Tous profils
- ✅ Utilisateur standard : Son propre profil uniquement

**Écriture** :

- ✅ Owner/Admin : Modification tous profils
- ✅ Utilisateur standard : Modification son propre profil (champs limités)

**RLS Policies** : Voir `docs/database/rls-policies.md`

---

## 📊 Contraintes Database

### Contraintes CHECK

```sql
-- Prénom
CHECK (first_name IS NULL OR
       (LENGTH(TRIM(first_name)) > 0 AND LENGTH(first_name) <= 50))

-- Nom
CHECK (last_name IS NULL OR
       (LENGTH(TRIM(last_name)) > 0 AND LENGTH(last_name) <= 50))

-- Job Title
CHECK (job_title IS NULL OR
       (LENGTH(TRIM(job_title)) > 0 AND LENGTH(job_title) <= 100))

-- Téléphone
CHECK (phone IS NULL OR
       phone ~ '^(\+33|0)[1-9][0-9]{8}$' OR
       phone ~ '^\+33\s?[1-9](\s?[0-9]{2}){4}$')
```

### Index Performance

```sql
-- Index nom complet
CREATE INDEX idx_user_profiles_name
ON user_profiles(last_name, first_name)
WHERE last_name IS NOT NULL OR first_name IS NOT NULL;

-- Index téléphone
CREATE INDEX idx_user_profiles_phone
ON user_profiles(phone)
WHERE phone IS NOT NULL;
```

---

## 🔍 Recherche Utilisateurs

### Critères de Recherche

**Page liste** : `/admin/users`

**Champs recherchables** :

- Email
- Prénom
- Nom
- Rôle
- Organisation (si associé)

**Tri** :

- Par défaut : Date création DESC (nouveaux en premier)
- Options : Nom, Email, Rôle

---

## 📅 Audit & Traçabilité

### Colonnes Audit

Toutes modifications profil sont tracées :

```typescript
{
  created_at: "2025-10-30T10:00:00Z",  // Création profil
  updated_at: "2025-10-30T15:30:00Z",  // Dernière modif
}
```

### Logs Activité

**Table** : `user_activity_logs`

**Events tracés** :

- `user_profile_updated` - Modification profil
- `user_role_changed` - Changement rôle
- `user_created` - Création utilisateur
- `user_deactivated` - Désactivation compte

---

## 🧪 Tests Critiques

### Scénarios à Tester

1. **Création utilisateur** :
   - Email unique validé
   - Rôle assigné correctement
   - Profil créé automatiquement

2. **Modification profil** :
   - Job title sauvegardé en DB
   - Téléphone validé (format FR)
   - user_metadata synchronisé

3. **Validation contraintes** :
   - Téléphone invalide rejeté
   - Job title > 100 chars rejeté
   - Prénom vide accepté (optionnel)

4. **Sécurité RLS** :
   - Admin voit tous profils
   - User standard voit uniquement son profil
   - Modification cross-user bloquée

---

## 📚 Références

**Documentation liée** :

- Database : `docs/database/SCHEMA-REFERENCE.md` (user_profiles ligne 474)
- RLS Policies : `docs/database/rls-policies.md`
- Enums : `docs/database/enums.md` (user_role_type)
- Migration : `supabase/migrations/20251030_001_add_job_title_to_user_profiles.sql`

**Code source** :

- Page liste : `src/app/admin/users/page.tsx`
- Composant modal : `src/components/admin/edit-user-dialog.tsx`
- Actions : `src/lib/actions/user-management.ts`
- Types : `src/types/supabase.ts` (user_profiles)

---

**Version** : 1.0.0
**Statut** : ✅ Production-ready (Phase 1)
