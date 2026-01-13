# Workflow Claude Code - Verone

---

Status: CRITICAL
Last_verified_commit: 1fc9646c
Primary_sources:

- CLAUDE.md
- .claude/
  Owner: Romeo Dos Santos
  Created: 2025-12-19
  Updated: 2026-01-10

---

## Workflow Obligatoire

**Source de verite** : `CLAUDE.md`

### Etapes

1. **Explorer** - Lire fichiers AVANT de coder
2. **Planifier** - Expliquer approche AVANT d'implementer
3. **Coder** - Implementer en suivant patterns existants
4. **Verifier** - OBLIGATOIRE apres CHAQUE modification:
   - `npm run type-check` → 0 erreurs
   - `npm run build` → Build succeeded
   - `npm run test:e2e` → Si UI modifiee
5. **Commiter** - Demander autorisation explicite

---

## Definition Console Zero

**ERREURS (bloquantes):**

- `console.error()`
- Unhandled promise rejection
- React/Next.js error overlay

**OK (pas bloquant):**

- `console.log`, `console.warn`
- Deprecation warnings tiers

---

## Commandes Disponibles

| Commande     | Usage                                        |
| ------------ | -------------------------------------------- |
| `/implement` | Implementation feature (explore-code-verify) |
| `/explore`   | Exploration codebase                         |
| `/commit`    | Commit rapide avec message conventionnel     |
| `/pr`        | Creer PR                                     |
| `/db`        | Operations Supabase                          |

---

## Agents Disponibles

| Agent                       | Role                         |
| --------------------------- | ---------------------------- |
| `database-architect`        | Migrations, triggers, RLS    |
| `frontend-architect`        | Pages, composants, forms     |
| `verone-debug-investigator` | Investigation bugs           |
| `verone-orchestrator`       | Orchestration multi-domaines |
| `action`                    | Cleanup conditionnel         |

---

## Regles Absolues

1. **JAMAIS** dire "done" sans preuves de verification
2. **JAMAIS** commit sans autorisation explicite
3. **JAMAIS** sauter les smoke tests pour modifications UI
4. **1 seule** DB Supabase (pas de duplication)

---

## References

- `CLAUDE.md` - Source de verite workflow
- `.claude/commands/` - Commandes disponibles
- `.claude/agents/` - Agents disponibles
