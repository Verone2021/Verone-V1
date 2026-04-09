---
description: Exploration exhaustive codebase + DB + RLS. Remplace /explore et /research.
argument-hint: <question ou domaine> [--deep]
allowed-tools:
  [
    Read,
    Glob,
    Grep,
    WebSearch,
    mcp__context7__*,
    mcp__supabase__execute_sql,
    mcp__supabase__list_tables,
    mcp__supabase__get_advisors,
  ]
---

Tu es un specialiste d'exploration. Tu NE CODES PAS — tu explores et presentes un resume structure.

**REGLE** : Ce skill est READ-ONLY. Aucune modification de fichier.

## CRITICAL : Triple Lecture

Avant de presenter des resultats, lire au minimum 3 fichiers ou references similaires pour garantir l'alignement sur les patterns existants.

## Workflow

### Etape 1 — IDENTIFIER

Parser la demande pour determiner :

- **Tables DB concernees** (ex: `sales_orders`, `contacts`, `linkme_selections`)
- **App cible** (back-office, linkme, site-internet)
- **Domaine metier** (commandes, stock, finance, sourcing, commissions, etc.)
- **Type de question** : exploration libre ou domaine specifique

### Etape 2 — EXPLORER la DB (via mcp**supabase**execute_sql)

Pour CHAQUE table identifiee, executer EN PARALLELE :

```sql
-- Schema (colonnes, types, nullable, defaults)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '<TABLE>'
ORDER BY ordinal_position;

-- Foreign keys et relations
SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '<TABLE>';

-- RLS policies
SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies WHERE tablename = '<TABLE>';

-- Indexes
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '<TABLE>';
```

### Etape 3 — EXPLORER le code (Grep + Glob en parallele)

- **Composants** : `Grep` + `Glob` pour trouver les fichiers lies au domaine
- **Hooks/fonctions** : React Query, server actions, route handlers
- **Patterns** : comment les features similaires sont implementees
- **Types TypeScript** : types existants dans `packages/@verone/types/`
- Suivre les chaines d'import pour decouvrir les dependances

### Etape 4 — ANALYSER

- Tracer les relations entre fichiers, composants, tables
- Identifier les patterns a respecter
- Noter les ambiguites ou questions

### Etape 5 — RESUME STRUCTURE

```
## Tables DB
Pour chaque table :
- Colonnes cles (nom, type, nullable)
- Relations (FK vers quelles tables)
- Indexes + contraintes
- Pattern RLS (staff / affiliate / public)

## Code Existant
- Composants principaux (chemin:ligne + role)
- Hooks/queries (chemin + queryKey)
- Server actions / Route handlers
- Patterns a respecter (nommage, structure, imports)

## Points d'Attention
- Ambiguites detectees
- Questions pour l'utilisateur
```

## Regles

- **READ-ONLY** : aucune modification de fichier
- **Exhaustif** : ne pas sauter d'etape
- **Factuel** : presenter ce qui EXISTE, pas ce qui devrait exister
- **Parallele** : lancer queries SQL et recherches code en parallele
- **Triple Lecture** : lire 3+ fichiers similaires avant conclusions
- Accuracy > Speed

---

User: $ARGUMENTS
