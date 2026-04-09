# Hooks Actifs (settings.json)

## Bloquants (exit 1 = action annulee)

| Hook               | Declencheur                         | Ce qu'il bloque                                            |
| ------------------ | ----------------------------------- | ---------------------------------------------------------- |
| Write ops sur main | `Edit(*)`, `Write(*)`               | Toute modification de fichier sur main                     |
| `--no-verify`      | `Bash(git commit/push --no-verify)` | Bypass des hooks git                                       |
| Push sur main      | `Bash(git push*main)`               | Push direct sur main                                       |
| PR base main       | `Bash(gh pr create/merge)`          | PR sans `--base staging`                                   |
| Dev server         | `Bash(pnpm/npm/yarn dev/start)`     | Lancement serveurs par agents                              |
| TypeScript any     | `Edit(*)`, `Write(*)`               | `any`, `as any`, `any[]`, `eslint-disable no-explicit-any` |
| Format commit      | `Bash(git commit*)`                 | Commits sans `[APP-DOMAIN-NNN]` ou `[NO-TASK]`             |

## Avertissements (non-bloquants)

| Hook             | Declencheur                                         | Message                                                |
| ---------------- | --------------------------------------------------- | ------------------------------------------------------ |
| Anti-duplication | `Write(*Modal*\|*Form*)` dans orders/customers/apps | Verifier INDEX-COMPOSANTS avant de creer un formulaire |
| Middleware       | `Edit(*middleware*)`                                | Verifier patterns existants avant modification         |
| RLS policies     | `Edit(*_rls_*)`                                     | Approbation requise pour migrations RLS                |

## Validation

| Hook         | Declencheur                  | Action                                       |
| ------------ | ---------------------------- | -------------------------------------------- |
| Git checkout | `Bash(git checkout*)`        | Empeche changements de branche inattendus    |
| Screenshots  | `mcp__playwright*screenshot` | Valide chemin `.playwright-mcp/screenshots/` |
