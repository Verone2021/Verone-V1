# Workflow Vercel - Jamais Docker

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- vercel.json
- .mcp.env
  Owner: Romeo Dos Santos
  Created: 2025-11-19
  Updated: 2026-01-10

---

## Regle Absolue

L'utilisateur travaille avec **Vercel**, PAS Docker !

---

## Ne Jamais Mentionner

- Docker
- Docker Desktop
- Conteneurs Docker
- `supabase start` (necessite Docker)
- `supabase db push` (necessite Docker local)
- Toute commande necessitant Docker

---

## Workflow Correct

### Migrations Supabase

**Methode 1 : PostgreSQL direct (psql)**

```bash
# Connexion directe a la remote database
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/[migration-file].sql
```

**Methode 2 : Dashboard Supabase**

- https://supabase.com/dashboard/project/aorroydfjsrygmosnzrl/sql
- Copier-coller le SQL et executer

### Generation Types TypeScript

```bash
# Via MCP Supabase (si disponible)
# Ou script custom avec DATABASE_URL
```

### Deploiement

**Vercel** : Auto-deploy sur push vers main

- Pas de build local necessaire
- Pas de Docker necessaire
- CI/CD gere par Vercel

---

## Resume

- **Infrastructure** : Vercel + Supabase Cloud
- **Base de donnees** : Supabase Cloud (PostgreSQL distant)
- **Deploiement** : Vercel auto-deploy
- **Pas de Docker** : Jamais, nulle part, pour rien

---

## Regles Absolues

1. **JAMAIS** mentionner Docker
2. **TOUJOURS** utiliser psql pour migrations
3. **JAMAIS** utiliser supabase start/db push

---

## References

- `docs/current/serena/migrations-workflow.md` - Workflow migrations
- `.mcp.env` - Variables environnement
