# Environment Variables & Credentials

---

## LIRE CE FICHIER EN PREMIER - CHAQUE SESSION

**REGLE ABSOLUE** : Si vous demandez des credentials a l'utilisateur, vous avez ECHOUE.

Tout est dans `.mcp.env` (gitignored). NE JAMAIS demander :
- DATABASE_URL
- SUPABASE_URL
- Tokens ou API keys

---

## Credentials - JAMAIS EN CLAIR

Les credentials sont dans `.mcp.env` (ligne 1 pour DATABASE_URL).

### Pour lire DATABASE_URL :
```bash
grep DATABASE_URL .mcp.env | cut -d'=' -f2 | tr -d '"'
```

### Pour executer une requete SQL :
```bash
source .mcp.env && psql "$DATABASE_URL" -c "SELECT ..."
```

### Pour appliquer une migration :
```bash
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/XXXXX.sql
```

---

## Supabase Project Info

| Info | Valeur |
|------|--------|
| Project ID | `aorroydfjsrygmosnzrl` |
| Region | `eu-west-3` (AWS Paris) |
| Connection Type | Session Pooler (port 5432) |
| Database | `postgres` |

---

## Credentials Locations

| Credential | File | Usage |
|------------|------|-------|
| DATABASE_URL | `.mcp.env` (ligne 1) | psql direct connection |
| NEXT_PUBLIC_SUPABASE_URL | `.env.local` | Frontend client |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | `.env.local` | Frontend auth |

---

## Migrations Workflow (MANDATORY)

### REGLE ABSOLUE
**TOUJOURS appliquer les migrations via psql + DATABASE_URL**

### Workflow Standard
```bash
# 1. Creer migration
echo "-- Migration SQL" > supabase/migrations/$(date +%Y%m%d)_NNN_description.sql

# 2. Appliquer IMMEDIATEMENT via psql
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/XXXXX.sql

# 3. Verifier application
source .mcp.env && psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM _supabase_migrations;"

# 4. Commit
git add supabase/migrations/ && git commit -m "[APP-DOMAIN-NNN] feat(db): description"
```

---

## Erreurs Frequentes a Eviter

### 1. Ne JAMAIS demander credentials
```bash
# WRONG: "Pouvez-vous me fournir le DATABASE_URL?"
# CORRECT: source .mcp.env && psql "$DATABASE_URL" ...
```

### 2. Ne JAMAIS creer migration sans l'appliquer
```bash
# WRONG: Creer fichier et dire "Appliquez manuellement"
# CORRECT: Write(...) puis Bash(source .mcp.env && psql...)
```

---

## Checklist Memoire (READ AT SESSION START)

- [ ] Utiliser `source .mcp.env` pour charger DATABASE_URL
- [ ] Appliquer migrations immediatement apres creation
- [ ] Verifier avec `SELECT COUNT(*) FROM _supabase_migrations`
- [ ] Ne JAMAIS demander credentials a l'utilisateur

---

## Documentation Liee

- **CLAUDE.md**: Instructions principales
- **.mcp.env**: Credentials reels (gitignored)
- **.claude/commands/db.md**: Commandes shortcuts `/db`
- **.claude/agents/database-architect.md**: Agent DB specialise
