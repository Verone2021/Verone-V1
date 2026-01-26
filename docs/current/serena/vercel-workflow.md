# Workflow Vercel - Vérone Back Office

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Owner: Romeo Dos Santos
Created: 2025-11-19
Updated: 2026-01-24

---

## Infrastructure

- **Hébergement** : Vercel
- **Base de données** : Supabase Cloud (PostgreSQL distant)
- **Déploiement** : Auto-deploy sur push vers main

---

## Workflow Correct

### Migrations Supabase

**Méthode 1 : API Supabase**

```bash
curl -s -X POST "https://api.supabase.com/v1/projects/aorroydfjsrygmosnzrl/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "VOTRE SQL"}'
```

**Méthode 2 : psql**

```bash
source .mcp.env && psql "$DATABASE_URL" -f supabase/migrations/[migration-file].sql
```

### Génération Types TypeScript

```bash
SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" \
npx supabase@latest gen types typescript --project-id aorroydfjsrygmosnzrl \
> apps/back-office/src/types/supabase.ts
```

### Déploiement

- Push vers main → Vercel deploy automatique
- Pas de build local nécessaire

---

## Références

- `docs/current/serena/migrations-workflow.md` - Workflow migrations
- `.mcp.env` - Variables environnement
