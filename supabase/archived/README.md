# 📦 Fichiers Archivés Supabase

Ce dossier contient les fichiers de configuration Supabase **non utilisés** dans le workflow actuel.

## Fichiers Archivés

### `config.toml.docker-unused` (2025-11-20)

**Raison archivage** : Configuration Docker locale non utilisée

**Contexte** :

- Le projet utilise **uniquement** la base de données Supabase distante (production)
- Connexion via Pooler Session (eu-west-3)
- **Pas de Docker local** installé ou nécessaire

**Workflow actuel** :

- Production : `postgresql://postgres.aorroydfjsrygmosnzrl:***@aws-1-eu-west-3.pooler.supabase.com:5432/postgres`
- Types TypeScript : Dashboard Supabase API (sans CLI locale)
- Migrations : Dashboard Supabase SQL Editor

**Si besoin de restaurer** :

```bash
# Restaurer config Docker (si jamais nécessaire)
cp supabase/archived/config.toml.docker-unused supabase/config.toml

# Puis démarrer instance locale
supabase start
```

**⚠️ Note** : La configuration Docker n'est **pas compatible** avec le workflow Vercel actuel.

---

**Date archivage** : 2025-11-20
**Archivé par** : Cleanup configuration MCP Supabase (Phase 3)
