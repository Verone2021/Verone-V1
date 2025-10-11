# ✅ Checklist Migration Table Critique - Vérone

**Date** : YYYY-MM-DD
**Table modifiée** : `user_profiles` (ou autre table critique)
**Auteur** : [Ton nom]
**Ticket/Issue** : [Lien si applicable]

---

## 🎯 OBJECTIF MIGRATION

**Décris en 1-2 phrases ce que tu veux faire** :

[Exemple : Ajouter colonne `organisation_id` pour lier utilisateurs aux organisations]

---

## ⚠️ CHECKLIST PRÉ-MIGRATION (10 Points Obligatoires)

**RÈGLE** : Tous les points doivent être ✅ AVANT d'exécuter la migration.

### **1. RLS restera activé après modification**

- [ ] ✅ **Vérifié** : Aucune commande `DISABLE ROW LEVEL SECURITY` dans migration
- [ ] ✅ **Vérifié** : Politique RLS testée après modification locale

**Comment vérifier** :
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'user_profiles';
-- Doit retourner: rowsecurity = true
```

**Si RLS désactivé par erreur** :
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
```

---

### **2. Pas de modification FK vers auth.users**

- [ ] ✅ **Vérifié** : Aucun `DROP CONSTRAINT user_profiles_id_fkey`
- [ ] ✅ **Vérifié** : Aucun `ALTER COLUMN id` (type, nullability, etc.)
- [ ] ✅ **Vérifié** : `ON DELETE CASCADE` toujours présent

**Comment vérifier** :
```sql
SELECT tc.constraint_name, kcu.column_name, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name = 'user_profiles' AND tc.constraint_type = 'FOREIGN KEY';
-- Doit inclure: id → auth.users avec delete_rule = CASCADE
```

**Pourquoi critique** :
Modifier FK = Casser authentification = Système DOWN

---

### **3. Nouvelles colonnes sont OPTIONNELLES**

- [ ] ✅ **Vérifié** : Toutes nouvelles colonnes ont `NULL` ou `DEFAULT value`
- [ ] ✅ **Vérifié** : Aucun `ADD COLUMN ... NOT NULL` sans default

**Exemple BON** ✅ :
```sql
ALTER TABLE user_profiles ADD COLUMN organisation_id UUID; -- NULL autorisé
ALTER TABLE user_profiles ADD COLUMN status TEXT DEFAULT 'active'; -- Default fourni
```

**Exemple MAUVAIS** ❌ :
```sql
ALTER TABLE user_profiles ADD COLUMN organisation_id UUID NOT NULL;
-- ❌ Bloque création nouveaux users (pas de valeur par défaut)
```

**Pourquoi critique** :
Colonne NOT NULL sans default = Impossible créer nouveaux utilisateurs = Auth cassé

---

### **4. Aucune suppression de colonne existante**

- [ ] ✅ **Vérifié** : Aucun `DROP COLUMN` dans migration
- [ ] ⚠️ **Documenté** : Si DROP nécessaire, raison expliquée + senior review validé

**Si vraiment besoin de supprimer** :
1. ✅ Vérifier colonne pas utilisée dans auth flow
2. ✅ Grep complet codebase pour références
3. ✅ Senior developer review + approval
4. ✅ Tester parcours utilisateur complet
5. ✅ Documenter rollback (ALTER TABLE ADD COLUMN)

**Pourquoi critique** :
DROP COLUMN peut casser auth flow si colonne utilisée par code existant

---

### **5. Contraintes CHECK non-breaking**

- [ ] ✅ **Vérifié** : Toutes contraintes CHECK utilisent pattern `IS NULL OR ...`
- [ ] ✅ **Vérifié** : Contraintes n'échouent PAS sur données existantes

**Exemple BON** ✅ :
```sql
ADD CONSTRAINT check_phone_format CHECK (
  phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$'
); -- NULL autorisé = non-breaking
```

**Exemple MAUVAIS** ❌ :
```sql
ADD CONSTRAINT check_phone_required CHECK (
  phone IS NOT NULL AND LENGTH(phone) > 0
); -- ❌ Échoue sur utilisateurs existants avec phone = NULL
```

**Comment tester** :
```sql
-- Test sur données existantes
SELECT COUNT(*) FROM user_profiles
WHERE NOT (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$');
-- Doit retourner: 0 (aucune violation)
```

---

### **6. Triggers SECURITY DEFINER si cross-schema**

- [ ] ✅ **Vérifié** : Aucun trigger dans migration OU
- [ ] ✅ **Vérifié** : Tous triggers ont `SECURITY DEFINER` si accès `auth.*`

**Exemple BON** ✅ :
```sql
CREATE FUNCTION private.sync_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- ✅ Requis pour accès auth.users
SET search_path = public, auth
AS $$ ... $$;
```

**Exemple MAUVAIS** ❌ :
```sql
CREATE FUNCTION sync_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
-- ❌ Manque SECURITY DEFINER
AS $$
BEGIN
  UPDATE auth.users ...; -- ❌ Échouera: insufficient privileges
END;
$$;
```

**Pourquoi critique** :
Sans SECURITY DEFINER = Trigger échoue = Auth flow cassé

---

### **7. Testé sur instance locale Supabase**

- [ ] ✅ **Vérifié** : Migration exécutée avec succès sur local
- [ ] ✅ **Vérifié** : Auth flow testé après migration :
  - [ ] Login fonctionne
  - [ ] Signup fonctionne
  - [ ] Profile edit fonctionne
  - [ ] Logout fonctionne

**Commandes test local** :
```bash
# Appliquer migration
supabase db reset
supabase migration up

# Tester auth flow
npm run dev
# → Tester login/signup/profile edit manuellement

# Vérifier logs
supabase logs
# → Aucune erreur auth
```

**Si erreur locale** :
❌ NE PAS déployer en production
✅ Corriger d'abord, re-tester, puis déployer

---

### **8. Plan rollback documenté**

- [ ] ✅ **Vérifié** : Section ROLLBACK PLAN remplie dans template
- [ ] ✅ **Vérifié** : Commandes rollback testées localement
- [ ] ✅ **Vérifié** : Contact senior dev noté si urgence

**Exemple plan rollback** :
```markdown
## ROLLBACK PLAN

1. Supprimer colonne ajoutée :
   ALTER TABLE user_profiles DROP COLUMN IF EXISTS organisation_id;

2. Supprimer contrainte ajoutée :
   ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS check_organisation_valid;

3. Vérifier auth intact :
   SELECT * FROM auth.users LIMIT 1; -- Doit réussir

4. Tester login frontend :
   → User doit pouvoir se connecter

Contact urgence : senior-dev@verone.com
```

---

### **9. Pas de référence colonnes non-PK auth.users**

- [ ] ✅ **Vérifié** : Seulement `auth.users(id)` référencé
- [ ] ✅ **Vérifié** : Aucune référence `auth.users.email`, `.created_at`, etc.

**Pourquoi** :
Supabase peut modifier colonnes non-PK lors updates → Casse références

**Exemple BON** ✅ :
```sql
ALTER TABLE user_profiles
ADD CONSTRAINT fk_user
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- ✅ Référence PRIMARY KEY = stable
```

**Exemple MAUVAIS** ❌ :
```sql
CREATE TRIGGER sync_email
AFTER UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_auth_email();
-- Fonction utilise auth.users.email directement
-- ❌ Supabase peut changer structure email → Casse trigger
```

**Comment vérifier** :
```bash
grep -r "auth\.users\." supabase/migrations/VOTRE_MIGRATION.sql
# Doit retourner: Seulement auth.users(id)
```

---

### **10. Senior developer review (si modification majeure)**

- [ ] ✅ **Vérifié** : Modification mineure (ADD COLUMN optionnel) OU
- [ ] ✅ **Vérifié** : Senior review complété + approuvé

**Modifications mineures** (pas besoin senior) :
- ADD COLUMN optionnel (NULL ou DEFAULT)
- CREATE INDEX performance
- ADD CHECK non-breaking (IS NULL OR ...)

**Modifications majeures** (senior REQUIS) :
- ALTER COLUMN type ou nullability
- DROP COLUMN
- MODIFY foreign key auth.users
- ALTER TYPE enum (add/remove values)
- DISABLE RLS

**Process review** :
1. Créer PR avec migration
2. Tag senior dev dans review
3. Expliquer raison modification
4. Attendre approval explicite
5. Merger seulement après approval

---

## 📋 RÉSUMÉ PRÉ-EXÉCUTION

**Avant d'exécuter migration, vérifie** :

- [ ] ✅ Les 10 points ci-dessus sont tous cochés
- [ ] ✅ Template migration utilisé (validations auto intégrées)
- [ ] ✅ Rollback plan documenté et testé
- [ ] ✅ Migration testée localement avec succès
- [ ] ✅ Auth flow fonctionne après migration locale
- [ ] ✅ Senior review complété (si modification majeure)

**Si UN SEUL point manque** : ❌ NE PAS EXÉCUTER migration
**Si TOUS points validés** : ✅ OK pour exécuter

---

## 🚀 POST-MIGRATION

**Après exécution migration en production** :

- [ ] ✅ Tester auth flow manuellement (login/signup/profile)
- [ ] ✅ Monitorer Sentry pendant 30min (aucune erreur auth)
- [ ] ✅ Vérifier logs Supabase (aucune erreur RLS)
- [ ] ✅ Update documentation si schéma changé
- [ ] ✅ Commit migration avec message descriptif

**Template commit message** :
```
🔧 DATABASE: Add organisation_id to user_profiles

Changes:
- Added optional organisation_id column (UUID, nullable)
- Added FK to organisations(id) with ON DELETE SET NULL
- Added index for performance
- Tested auth flow: ✅ All working

Safety:
- RLS remains enabled ✅
- FK auth.users intact ✅
- 10-point checklist validated ✅
- Rollback plan documented ✅

Related: #TICKET_NUMBER
```

---

## 📚 RÉFÉRENCES

**Documentation** :
- Règles complètes : `manifests/database-standards/CRITICAL-TABLES-PROTECTION.md`
- Template migration : `supabase/migrations/_TEMPLATE_modify_critical_table.sql`
- Pattern réutilisable : `MEMORY-BANK/patterns/critical-table-protection-pattern.md`

**Supabase Officiel** :
- Managing User Data : https://supabase.com/docs/guides/auth/managing-user-data
- Row Level Security : https://supabase.com/docs/guides/database/postgres/row-level-security

**Support** :
- Senior Dev : [Email/Slack]
- Supabase Support : https://supabase.com/support

---

**Checklist créée** : 2025-10-12
**Framework** : Critical Table Protection 2025
**Maintainer** : Vérone Dev Team

*Suivre cette checklist = Éviter 99% des erreurs auth*
