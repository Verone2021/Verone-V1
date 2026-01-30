# Génération Types TypeScript Supabase

**Date** : 2026-01-30
**Version** : 1.0.0 (Workflow 100% Cloud)

---

## 🎯 Règle Absolue

**JAMAIS utiliser `--local` (Docker). TOUJOURS utiliser cloud (`--linked`).**

**Raison** :

- Docker Desktop non nécessaire (workflow Vercel + Supabase Cloud)
- Synchronisation automatique avec Supabase Cloud
- Pas de conflits Docker daemon
- Plus rapide (pas de conteneur à démarrer)

---

## ✅ Méthode 1 : Via MCP Supabase (Recommandée)

**Workflow complet** :

```bash
# 1. Créer migration
supabase migration new ma_migration

# 2. Écrire SQL
vim supabase/migrations/YYYYMMDDHHMMSS_ma_migration.sql

# 3. Appliquer en cloud via Claude Code
# Utiliser : mcp__supabase__apply_migration
# Paramètres :
# - name: "ma_migration"
# - query: <contenu SQL>

# 4. Générer types via Claude Code
# Utiliser : mcp__supabase__generate_typescript_types
# Output : packages/@verone/types/src/supabase.ts

# 5. Commit
git add .
git commit -m "[DB-001] feat: ma migration"
git push
```

**Avantages MCP** :

- ✅ Pas de Docker requis
- ✅ Validation automatique SQL
- ✅ Types générés dans bon répertoire
- ✅ Workflow traçable (logs Claude Code)
- ✅ Gestion erreurs intégrée

---

## ✅ Méthode 2 : Via CLI Cloud

**Workflow manuel** :

```bash
# 1. Créer migration
supabase migration new ma_migration

# 2. Écrire SQL
vim supabase/migrations/YYYYMMDDHHMMSS_ma_migration.sql

# 3. Appliquer en cloud
supabase db push

# 4. Générer types
pnpm generate:types
# OU directement :
# supabase gen types typescript --linked > packages/@verone/types/src/supabase.ts

# 5. Commit
git add .
git commit -m "[DB-001] feat: ma migration"
git push
```

**Note** : Le hook pre-commit ne régénère PLUS automatiquement les types (désactivé depuis 2026-01-30).

---

## ❌ Méthode INTERDITE (Docker Local)

```bash
# NE JAMAIS FAIRE
supabase gen types typescript --local  # ❌ INTERDIT
```

**Erreur typique si Docker non lancé** :

```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock.
Is the docker daemon running?
```

**Raison de l'interdiction** :

- Nécessite Docker Desktop (lourd, non aligné workflow Vercel)
- Peut générer types divergents du cloud
- Hook pre-commit bloqué si Docker non lancé

---

## 🔄 Hook Pre-Commit (Désactivé)

**Depuis 2026-01-30**, la génération automatique de types dans le hook pre-commit est **désactivée**.

**Avant (hook bloqué si Docker non lancé)** :

```bash
if git diff --cached --name-only | grep -q "supabase/migrations/"; then
  pnpm generate:types  # ❌ Bloquait commit si Docker arrêté
fi
```

**Après (génération manuelle)** :

```bash
# Hook ne génère PLUS automatiquement
# Raison : Types générés UNIQUEMENT après apply_migration (MCP)
# Régénérer manuellement : pnpm generate:types
```

**Pourquoi ce changement ?**

1. Évite dépendance Docker pour commits
2. Force workflow conscient (migration → apply → types)
3. Évite types générés avant migration appliquée en cloud

---

## 🛠️ Commandes Disponibles

### Script NPM

```bash
pnpm generate:types
# Exécute : supabase gen types typescript --linked > packages/@verone/types/src/supabase.ts
```

### CLI Direct

```bash
# Générer types depuis cloud
supabase gen types typescript --linked > packages/@verone/types/src/supabase.ts

# Vérifier types générés
cat packages/@verone/types/src/supabase.ts | grep "Database"
```

### MCP Supabase (Claude Code)

```typescript
// Appliquer migration
mcp__supabase__apply_migration({
  name: 'ma_migration',
  query: 'CREATE TABLE test (id UUID PRIMARY KEY);',
});

// Générer types
mcp__supabase__generate_typescript_types();
// Output : packages/@verone/types/src/supabase.ts
```

---

## 🧪 Validation

### Test 1 : Script generate:types fonctionne

```bash
pnpm generate:types

# ✅ Attendu :
# - Aucune erreur Docker
# - Types générés dans packages/@verone/types/src/supabase.ts
# - Taille fichier > 100 Ko (types complets)
```

### Test 2 : Commit avec migration passe

```bash
# 1. Créer migration test
supabase migration new test_cloud_types

# 2. Écrire SQL simple
echo "-- Test migration cloud" > supabase/migrations/*_test_cloud_types.sql

# 3. Appliquer via MCP
# mcp__supabase__apply_migration(...)

# 4. Générer types via MCP
# mcp__supabase__generate_typescript_types()

# 5. Commit
git add .
git commit -m "[TEST] feat: test cloud types"

# ✅ Attendu : Commit réussit SANS erreur Docker
```

### Test 3 : Types sont à jour

```bash
# Vérifier présence tables récentes
cat packages/@verone/types/src/supabase.ts | grep "linkme_selections"

# ✅ Attendu : Table présente dans types
```

---

## 📋 Checklist Migration Database

Avant **CHAQUE** migration :

- [ ] Créer migration : `supabase migration new nom`
- [ ] Écrire SQL avec TOUS les commentaires
- [ ] Appliquer cloud : `supabase db push` OU MCP
- [ ] Générer types : `pnpm generate:types` OU MCP
- [ ] Vérifier types : `cat packages/@verone/types/src/supabase.ts`
- [ ] Type-check passe : `pnpm --filter @verone/back-office type-check`
- [ ] Commit : `git commit -m "[DB-NNN] feat: migration"`

---

## 🚨 Troubleshooting

### Erreur "Cannot connect to Docker daemon"

**Cause** : Script utilise `--local` (obsolète)
**Solution** : Remplacer `--local` par `--linked`

### Types vides ou incomplets

**Cause** : Migration non appliquée en cloud
**Solution** :

```bash
# 1. Vérifier migration appliquée
supabase db diff  # Doit montrer "No schema changes"

# 2. Si drift détecté, pousser migration
supabase db push

# 3. Régénérer types
pnpm generate:types
```

### Types non reconnus par TypeScript

**Cause** : Import incorrect
**Solution** :

```typescript
// ✅ CORRECT
import { Database } from '@verone/types/supabase';

// ❌ INCORRECT
import { Database } from '@/types/supabase';
```

### Hook pre-commit bloqué

**Cause** : Anciennes versions utilisaient `--local`
**Solution** : Mettre à jour `.husky/pre-commit` (voir commit [DOCKER-001])

---

## 📚 Références

- **Supabase CLI** : https://supabase.com/docs/guides/cli
- **MCP Supabase** : `.claude/settings.json` (configuration)
- **Package @verone/types** : `packages/@verone/types/`
- **Migration 001 Fix Docker** : `fix/DOCKER-001-eliminate-local-flag`

---

**Version** : 1.0.0 (2026-01-30)
**Auteur** : Claude Code
**Status** : Documentation Canonique
