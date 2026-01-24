# Serena Memories - Index CRITICAL

> **Source de vérité** : Ce dossier contient les memories Serena CRITIQUES versionnées.
> Les memories REFERENCE/TEMP restent dans `.serena/memories/` (gitignored).

---

## 15 Memories CRITICAL

Ces memories sont **stables, transverses, et essentielles** pour le bon fonctionnement de Claude Code.

| #   | Memory                        | Domaine     | Description                            | Status |
| --- | ----------------------------- | ----------- | -------------------------------------- | ------ |
| 1   | `project-overview.md`         | Business    | Vue d'ensemble projet Verone           | OK     |
| 2   | `business-context.md`         | Business    | Contexte metier, SLOs, modules         | OK     |
| 3   | `database-schema-mappings.md` | DB          | Anti-hallucination colonnes DB         | OK     |
| 4   | `database-implementation.md`  | DB          | Architecture 78 tables, RLS, triggers  | OK     |
| 5   | `linkme-architecture.md`      | LinkMe      | Architecture 2 tables, roles, triggers | OK     |
| 6   | `linkme-commissions.md`       | LinkMe      | Formules commissions, sources verite   | OK     |
| 7   | `products-architecture.md`    | Products    | Architecture centrale produits         | OK     |
| 8   | `stock-orders-logic.md`       | Stock       | Logique stock/commandes/alertes        | OK     |
| 9   | `migrations-workflow.md`      | Deploy      | Workflow migrations Supabase           | OK     |
| 10  | `claude-code-workflow.md`     | Tooling     | Workflow 5 etapes obligatoire          | OK     |
| 11  | `project-decisions.md`        | Business    | Decisions non-negociables              | OK     |
| 12  | `turborepo-paths.md`          | Tooling     | Chemins corrects Turborepo             | OK     |
| 13  | `vercel-workflow.md`          | Deploy      | Workflow Vercel + Supabase Cloud       | OK     |
| 14  | `qonto-never-finalize.md`     | Back-office | JAMAIS finaliser factures              | OK     |
| 15  | `user-expectations.md`        | Tooling     | Pas d'options, resoudre directement    | OK     |

---

## Structure Header Obligatoire

Chaque memory dans ce dossier DOIT avoir ce header :

```yaml
---
Status: CRITICAL
Last_verified_commit: <sha>
Primary_sources:
  - <chemin fichier 1>
  - <chemin fichier 2>
Owner: Romeo Dos Santos
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
---
```

---

## Mapping Source → Destination

| Source (.serena/memories/)                          | Destination (docs/current/serena/) |
| --------------------------------------------------- | ---------------------------------- |
| `project_overview.md`                               | `project-overview.md`              |
| `business_context.md`                               | `business-context.md`              |
| `database-schema-critical-mappings-2025-12.md`      | `database-schema-mappings.md`      |
| `verone-db-implementation-complete.md`              | `database-implementation.md`       |
| `linkme-architecture-final-2025-12.md`              | `linkme-architecture.md`           |
| `linkme-commission-sources-of-truth-2026-01.md`     | `linkme-commissions.md`            |
| `products-central-architecture-2025-12.md`          | `products-architecture.md`         |
| `sales-orders-stock-logic-complete-2025-11-27.md`   | `stock-orders-logic.md`            |
| `supabase-migrations-workflow-mandatory-2025-12.md` | `migrations-workflow.md`           |
| `claude-code-workflow-2025-12.md`                   | `claude-code-workflow.md`          |
| `project-decisions-non-negotiable-2025-12.md`       | `project-decisions.md`             |
| `turborepo-paths-reference-2025-11-20.md`           | `turborepo-paths.md`               |
| `vercel-workflow.md`                                | `vercel-workflow.md`               |
| `qonto-invoices-never-finalize-2026-01-07.md`       | `qonto-never-finalize.md`          |
| `user-expectations-no-options.md`                   | `user-expectations.md`             |

---

## Workflow Mise à Jour

### Quand mettre à jour une memory CRITICAL ?

1. **Changement architectural majeur** (nouvelle table, nouveau workflow)
2. **Bug critique résolu** qui change une règle
3. **Décision business** qui invalide l'ancienne règle

### Comment mettre à jour ?

1. Modifier le fichier dans `docs/current/serena/`
2. Mettre à jour `Last_verified_commit` avec le SHA actuel
3. Mettre à jour `Updated` avec la date
4. Commit avec message `docs(serena): update <memory-name>`

---

## Memories NON versionnées (.serena/memories/)

Les memories suivantes restent dans `.serena/memories/` (gitignored) :

### REFERENCE (26) - Utiles mais rarement consultées

- Détails techniques spécifiques
- Explorations de code
- Patterns secondaires

### TEMP (5) - Debug et incidents

- Credentials (tokens, secrets)
- Audits spécifiques
- Roadmaps temporaires

### STALE (5) - À archiver

- Tasks terminées
- Bugs résolus
- Données test

---

_Créé : 2026-01-10_
_Dernière mise à jour : 2026-01-10_
