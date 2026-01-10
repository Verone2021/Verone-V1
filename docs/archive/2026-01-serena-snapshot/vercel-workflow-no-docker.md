# ⚠️ WORKFLOW VERCEL - JAMAIS DOCKER

**RÈGLE ABSOLUE** : L'utilisateur travaille avec **Vercel**, PAS Docker !

## 🚫 NE JAMAIS MENTIONNER

- Docker
- Docker Desktop
- Conteneurs Docker
- `supabase start` (nécessite Docker)
- `supabase db push` (nécessite Docker local)
- Toute commande nécessitant Docker

## ✅ WORKFLOW CORRECT

### Migrations Supabase

**Méthode 1 : PostgreSQL direct (psql)**

```bash
# Connexion directe à la remote database
psql "postgresql://postgres.aorroydfjsrygmosnzrl:[ROTATION_REQUIRED]@aws-1-eu-west-3.pooler.supabase.com:5432/postgres" -f supabase/migrations/[migration-file].sql
```

**Méthode 2 : Dashboard Supabase**

- https://supabase.com/dashboard/project/dmwcnbcussoqychafcjg/sql
- Copier-coller le SQL et exécuter

### Génération Types TypeScript

**Sans Docker** : Utiliser le MCP Supabase ou connexion directe

```bash
# Via MCP Supabase (si disponible)
mcp__supabase__generate_typescript_types

# Si MCP timeout : Utiliser script custom ou demander alternatives
```

### Déploiement

**Vercel** : Auto-deploy sur push vers main/production-stable

- Pas de build local nécessaire
- Pas de Docker nécessaire
- CI/CD géré par Vercel

## 📝 Résumé

- **Infrastructure** : Vercel + Supabase Cloud
- **Base de données** : Supabase Cloud (PostgreSQL distant)
- **Déploiement** : Vercel auto-deploy
- **Pas de Docker** : Jamais, nulle part, pour rien

---

**Date création** : 2025-11-19
**Importance** : CRITIQUE - Ne jamais oublier
