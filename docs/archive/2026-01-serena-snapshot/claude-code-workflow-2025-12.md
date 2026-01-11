# Workflow Claude Code - Verone (Decembre 2025)

## Workflow Unique Obligatoire

**Source de verite** : `CLAUDE.md` v6.0

### Etapes

1. **Explorer** - Lire fichiers AVANT de coder
2. **Planifier** - Expliquer approche AVANT d'implementer
3. **Coder** - Implementer en suivant patterns existants
4. **Verifier** - OBLIGATOIRE apres CHAQUE modification:
   - `npm run type-check` → 0 erreurs
   - `npm run build` → Build succeeded
   - `npm run e2e:smoke` → Si UI modifiee (toutes apps)
5. **Commiter** - Demander autorisation explicite

## Regles Absolues

1. **JAMAIS** dire "done" sans preuves de verification
2. **JAMAIS** commit sans autorisation explicite
3. **JAMAIS** sauter les smoke tests pour modifications UI
4. **1 seule** DB Supabase (pas de duplication)

## Definition Console Zero

**ERREURS (bloquantes):**

- `console.error()`
- Unhandled promise rejection
- React/Next.js error overlay

**OK (pas bloquant):**

- `console.log`, `console.warn`
- Deprecation warnings tiers

## Commandes Disponibles

| Commande     | Usage                                        |
| ------------ | -------------------------------------------- |
| `/implement` | Implementation feature (explore-code-verify) |
| `/explore`   | Exploration codebase                         |
| `/commit`    | Commit rapide avec message conventionnel     |
| `/pr`        | Creer PR                                     |
| `/db`        | Operations Supabase                          |

## Agents Disponibles

| Agent                       | Role                         |
| --------------------------- | ---------------------------- |
| `database-architect`        | Migrations, triggers, RLS    |
| `frontend-architect`        | Pages, composants, forms     |
| `verone-debug-investigator` | Investigation bugs           |
| `verone-orchestrator`       | Orchestration multi-domaines |
| `action`                    | Cleanup conditionnel         |

## Fichiers Supprimes (Dec 2025)

- `.claude/workflows/PDCA.md` → Fusionne dans CLAUDE.md
- `.claude/workflows/universal-workflow-checklist.md` → Fusionne dans CLAUDE.md
- `.claude/commands/epct.md` → Remplace par `/implement`
- `.claude/commands/oneshot.md` → Remplace par `/implement`
- `.claude/agents/explore-codebase.md` → Doublon avec `/explore`
- `.claude/contexts/database.md` → Doublon avec memory Serena
- `.claude/contexts/deployment.md` → Doublon avec memory Serena

## References

- `CLAUDE.md` : Source de verite workflow
- Memory `database-schema-critical-mappings-2025-12` : Schema DB
- Memory `vercel-workflow-no-docker` : Deployment
- Memory `task_completion_guidelines` : Guidelines completion

---

_Cree: 2025-12-19_
_Base sur: Anthropic Best Practices 2025_
