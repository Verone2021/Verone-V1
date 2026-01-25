# Environment Variables & Credentials

## 🔑 Supabase Credentials (ALWAYS USE THESE)

### Database Connection
```bash
# Location: .mcp.env (line 1)
DATABASE_URL="postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"
```

**Usage automatique par Claude:**
```bash
# Pour TOUTE requête SQL ou migration
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -c "SELECT ..."

# Pour appliquer une migration
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f supabase/migrations/XXXXX.sql
```

### Supabase Project Info
- **Project ID**: `aorroydfjsrygmosnzrl`
- **Region**: `eu-west-3` (AWS Paris)
- **Connection Type**: Session Pooler (port 5432)
- **Database**: `postgres`

---

## 📍 Credentials Locations (READ THIS FIRST)

| Credential | File | Line | Usage |
|------------|------|------|-------|
| DATABASE_URL | `.mcp.env` | 1 | psql direct connection |
| NEXT_PUBLIC_SUPABASE_URL | `.env.local` | 2 | Frontend client |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | `.env.local` | 3 | Frontend auth |

---

## 🚀 Migrations Workflow (MANDATORY)

### RÈGLE ABSOLUE
**TOUJOURS appliquer les migrations via psql + DATABASE_URL**

### Workflow Standard
```bash
# 1. Créer migration
echo "-- Migration SQL" > supabase/migrations/$(date +%Y%m%d)_NNN_description.sql

# 2. Appliquer IMMÉDIATEMENT via psql
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/$(date +%Y%m%d)_NNN_description.sql

# 3. Vérifier application
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" \
  -c "SELECT COUNT(*) FROM _supabase_migrations;"

# 4. Commit
git add supabase/migrations/
git commit -m "[APP-DOMAIN-NNN] feat(db): description"
```

### Vérification Rapide
```bash
# Tester connexion
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -c "SELECT version();"

# Lister tables
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -c "\dt"

# Compter commandes LinkMe
psql "postgresql://postgres.aorroydfjsrygmosnzrl:ADFVKDJCJDNC934@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -c "SELECT COUNT(*) FROM sales_orders WHERE created_by_affiliate_id IS NOT NULL;"
```

---

## ❌ ERREURS FRÉQUENTES À ÉVITER

### 1. Ne JAMAIS demander à l'utilisateur de fournir credentials
```bash
# ❌ WRONG
"Pouvez-vous me fournir le DATABASE_URL?"
"Avez-vous un token Supabase?"

# ✅ CORRECT
# Lire .mcp.env automatiquement
DATABASE_URL=$(grep DATABASE_URL .mcp.env | cut -d'=' -f2 | tr -d '"')
psql "$DATABASE_URL" -c "SELECT ..."
```

### 2. Ne JAMAIS utiliser des commandes obsolètes
```bash
# ❌ WRONG
npx supabase db push --project-ref aorroydfjsrygmosnzrl  # Flag n'existe pas

# ✅ CORRECT
psql "postgresql://postgres.aorroydfjsrygmosnzrl:..." -f migration.sql
```

### 3. Ne JAMAIS créer migration sans l'appliquer
```bash
# ❌ WRONG - Créer le fichier et dire "Appliquez manuellement"

# ✅ CORRECT - TOUJOURS appliquer immédiatement
Write(file_path="supabase/migrations/20260125_XXX.sql", content="...")
Bash(command='psql "postgresql://..." -f supabase/migrations/20260125_XXX.sql')
```

---

## 🧠 Checklist Mémoire (READ AT SESSION START)

- [ ] Lire `.mcp.env` pour DATABASE_URL (TOUJOURS ligne 1)
- [ ] Utiliser psql direct avec connection string complète
- [ ] Appliquer migrations immédiatement après création
- [ ] Vérifier avec `SELECT COUNT(*) FROM _supabase_migrations`
- [ ] Ne JAMAIS demander credentials à l'utilisateur

---

## 📚 Documentation Liée

- **CLAUDE.md**: Instructions principales (référence ce fichier)
- **.mcp.env**: Credentials réels (gitignored)
- **.claude/commands/db.md**: Commandes shortcuts `/db`
- **.claude/agents/database-architect.md**: Agent DB spécialisé
