# Scripts Outils Verone

Scripts d'automatisation pour le projet Verone Back Office.

---

## audit-database.js

**Objectif** : Audit complet du schema Supabase — drift detection, RLS, triggers.

### Utilisation

```bash
# Rapport HTML
pnpm audit:database

# Rapport JSON
pnpm audit:database:json
```

### Fonctionnement

1. Se connecte a Supabase via DATABASE_URL (.mcp.env)
2. Compare le schema reel avec la documentation
3. Detecte les drifts (tables/colonnes manquantes ou non documentees)
4. Verifie les policies RLS
5. Genere un rapport detaille (HTML ou JSON)

---

**Cree** : 2025-10-21
**Mis a jour** : 2026-03-27
