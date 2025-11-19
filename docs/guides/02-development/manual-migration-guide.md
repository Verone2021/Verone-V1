# Guide de Migration Manuelle - Vérone Database

## ⚠️ Instructions Critiques

Le MCP Supabase est en mode lecture seule. Vous devez appliquer les migrations manuellement via **Supabase Dashboard > SQL Editor**.

### 🔗 Connexion Database

```
URL: postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres
```

## 📋 Étapes à Suivre

### 1. Accès Supabase Dashboard

1. Connectez-vous à [Supabase Dashboard](https://supabase.com/dashboard)
2. Naviguez vers votre projet Vérone
3. Allez dans **SQL Editor**

### 2. Exécuter les Migrations (DANS CET ORDRE)

#### **Migration 1**: Tables Catalogue de Base

```sql
-- Copier-coller le contenu de: scripts/apply-migrations.sql
-- OU le contenu de: supabase/migrations/20250113_001_create_catalogue_tables.sql
```

#### **Migration 2**: Organisations et Auth (REQUIS AVANT OWNER)

```sql
-- Copier-coller le contenu de: supabase/migrations/20250113_002_create_auth_tables.sql
```

#### **Migration 3**: RLS Policies

```sql
-- Copier-coller le contenu de: supabase/migrations/20250113_003_create_rls_policies.sql
```

#### **Migration 4**: Feeds System

```sql
-- Copier-coller le contenu de: supabase/migrations/20250113_004_create_feeds_tables.sql
```

#### **Migration 5**: Validation & Seed

```sql
-- Copier-coller le contenu de: supabase/migrations/20250113_005_validation_and_seed.sql
```

### 3. Créer l'Utilisateur Owner

#### **Méthode A: Via Supabase Auth Dashboard**

1. Allez dans **Authentication > Users**
2. Cliquez **"Add user"**
3. Email: `veronebyromeo@gmail.com`
4. Mot de passe: `Abc123456`
5. Confirmez l'email
6. **IMPORTANT**: Notez l'UUID généré

#### **Méthode B: Via SQL**

```sql
-- Après avoir noté l'UUID de auth.users, exécuter:
-- scripts/create-owner-user.sql
```

### 4. Validation Post-Migration

Exécutez cette requête pour vérifier:

```sql
-- Vérification des tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('categories', 'product_groups', 'products', 'user_profiles', 'collections', 'organisations', 'user_organisation_assignments', 'feed_configs')
ORDER BY table_name;

-- Vérification RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Vérification owner user
SELECT u.email, up.role, o.name as organisation
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN user_organisation_assignments uoa ON u.id = uoa.user_id
LEFT JOIN organisations o ON uoa.organisation_id = o.id
WHERE u.email = 'veronebyromeo@gmail.com';
```

## ✅ Résultats Attendus

Après migration complète:

- ✅ 15+ tables créées
- ✅ RLS activé sur tables sensibles
- ✅ Organisation "Vérone" créée
- ✅ Catégories de base créées
- ✅ Utilisateur owner configuré
- ✅ Permissions complètes pour veronebyromeo@gmail.com

## 🚨 En Cas d'Erreur

Si erreur "relation does not exist":

1. Vérifiez l'ordre des migrations
2. Tables `organisations` et `auth.users` doivent exister AVANT user_profiles
3. Exécutez une migration à la fois
4. Vérifiez les contraintes FK

## 🔄 Configuration MCP Post-Migration

Une fois les migrations appliquées, nous configurerons automatiquement:

1. Variables d'environnement
2. Types TypeScript générés
3. Clients Supabase
4. Tests de connexion

---

**📞 Support**: Si problème, partagez l'erreur exacte pour assistance.
