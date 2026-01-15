---
description: WRITE mode - Implementation from ACTIVE.md with commits
argument-hint: [TASK=<TASK-ID>]
allowed-tools: [Read, Write, Edit, Bash, mcp__serena__*, Grep, Glob, mcp__ide__getDiagnostics, NotebookEdit]
---

# /write — WRITE (implémentation) + commits + plan:sync

## Rôle

Tu es en **mode WRITE**.

- Tu peux modifier le code + commit/push.
- Tu ne lances **JAMAIS** `pnpm dev`, aucune migration directe, aucun changement de ports.
- Tu suis **uniquement** `.claude/work/ACTIVE.md` comme source de vérité.

## Source de vérité

1. Lis `CLAUDE.md`
2. Lis `.claude/work/ACTIVE.md`

## Sélection de travail

- Si l'utilisateur fournit un **Task ID** (ex: `TASK=BO-BUG-001`) → tu exécutes **uniquement** les tâches de ce Task ID.
- Sinon → tu prends **la tâche non-cochée la plus récente** dans ACTIVE.md et tu l'annonces à l'utilisateur.

## Exécution (obligatoire)

1. **Implémenter** strictement ce qui est dans ACTIVE.md (pas de scope creep).

2. **Vérifications minimales adaptées** :
   - `pnpm -w type-check` (si TypeScript modifié)
   - `pnpm -w lint --filter <app>` (si pertinent)
   - `pnpm -w build --filter <app>` (si UI modifiée ou pour vérifier build production)

3. **Commit obligatoire** :
   ```bash
   git commit -m "[TASK-ID] <type>: <résumé>"
   ```
   Format type: `feat|fix|refactor|chore|docs|test`

4. **Synchronisation plan obligatoire** (automatique) :
   - Le hook PostToolUse dans `.claude/settings.json` exécute automatiquement `pnpm plan:sync` après chaque commit contenant un Task ID
   - Un commit `chore(plan): sync` est créé automatiquement
   - Tu n'as **pas besoin** de lancer `pnpm plan:sync` manuellement

5. **Mettre à jour `.claude/work/ACTIVE.md`** :
   - Cocher la/les tâches terminées : `- [x] TASK-ID Description (commit_sha)`
   - Laisser non cochées ce qui reste

## Sortie attendue dans le chat

- Un résumé court :
  - Ce qui a été changé (fichiers)
  - Commandes exécutées (type-check, build, lint)
  - SHAs des commits
  - Checklist "done" vs "remaining"

## Interdits (strict)

- Ne jamais lancer `pnpm dev` → si besoin de tester, demander à l'utilisateur de lancer une session `/dev` en parallèle
- Ne jamais créer de migrations SQL directement → utiliser l'agent `database-architect`
- Ne jamais skip les vérifications (type-check, build) si pertinentes

## Notes importantes

- **Hook PostToolUse** : Le workflow de synchronisation du plan est déjà automatisé via le hook dans `.claude/settings.json`. Après chaque commit avec Task ID, le hook exécute automatiquement :
  1. `node .claude/scripts/plan-sync.js` (marque les tâches comme faites dans ACTIVE.md)
  2. Crée un commit `chore(plan): sync`

- **Format Task ID** : Doit respecter le format `[APP]-[DOMAIN]-[NNN]` où :
  - APP = `BO` (back-office) | `LM` (linkme) | `WEB` (site-internet)
  - DOMAIN = 2+ caractères alphanumériques majuscules
  - NNN = 3 chiffres (001, 002, etc.)

---

User: $ARGUMENTS
