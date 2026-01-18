---
description: READ session with Playwright lane-1 - Observation only
argument-hint: TASK=<TASK-ID> [URL] [credentials]
allowed-tools: [mcp__playwright-lane-1__*, mcp__serena__*, Read, Glob, Grep]
---

# /read1 — READ lane-1 (Playwright) + écriture limitée à ACTIVE.md

## Rôle

Tu es en **mode READ1**.

- Tu utilises **uniquement** `playwright-lane-1` pour tester sur localhost.
- **ZÉRO** modification de code applicatif.
- **ZÉRO** git / commit / push.
- **ZÉRO** relance `pnpm dev`, **ZÉRO** migrations, **ZÉRO** changement de ports.
- Tu as le droit **d'écrire uniquement** dans : `.claude/work/ACTIVE.md`.

## Source de vérité

1. Lis `CLAUDE.md`
2. Lis `.claude/work/ACTIVE.md`

## Ce que tu dois faire

1. Comprendre la demande (URLs, user logins, scénario).
2. Tester avec `playwright-lane-1` (navigation, clicks, console errors, network errors).
3. Si `lane-1` est déjà utilisé :
   - tente de fermer les pages / réutiliser l'onglet existant,
   - sinon **bascule en mode observation sans navigateur** et note l'incident dans ACTIVE.md.

## Format d'écriture dans ACTIVE.md (obligatoire)

- Tu ajoutes (ou mets à jour) une **entrée de tâche** avec un **Task ID**.
- Si l'utilisateur fournit un Task ID (ex: `TASK=BO-BUG-001`) → utilise-le.
- Sinon → crée un Task ID cohérent selon format `[APP]-[DOMAIN]-[NNN]` où APP = BO | LM | WEB, en incrémentant au mieux à partir d'ACTIVE.md.
- Sous la tâche, écris exactement ces sections :

```markdown
## TASK: <TASK-ID> — <Titre descriptif>

### Contexte
[Description du problème ou feature à tester]

### Steps to Reproduce
1. Aller à [URL]
2. Cliquer sur [élément]
3. Observer [comportement]

### Expected vs Actual
- **Expected**: [Comportement attendu]
- **Actual**: [Comportement observé]

### Evidence
- Screenshot: `.claude/reports/screenshot-YYYY-MM-DD-HHmmss.png`
- Console errors: [liste des erreurs console]
- Network errors: [liste des erreurs réseau]

### Hypothèses (fichiers/causes probables)
- Fichier `apps/xxx/src/yyy.ts` ligne X : [hypothèse]
- Trigger/RLS `zzz` : [hypothèse]
- Component `ComponentName` : [hypothèse]

### Fix Proposé (haut niveau)
- **Approche**: [Description de l'approche recommandée]
- **Risques**: [Risques identifiés]

### Acceptance Criteria
- [ ] Critère 1
- [ ] Critère 2
- [ ] Console Zero (0 erreurs)
```

## Sortie attendue dans le chat

- Pas de "plan" ailleurs, pas de prompt à copier-coller.
- Tu réponds uniquement :
  - `✅ Observations ajoutées dans .claude/work/ACTIVE.md (Task ID: XXX-YYY-NNN)`
  - + 3 bullets max "points clés" résumant les findings

## Interdits (strict)

- Ne jamais utiliser `/plan` (ni écrire dans `~/.claude/plans`).
- Ne jamais écrire ailleurs que `.claude/work/ACTIVE.md`.
- Ne jamais modifier du code applicatif.
- Ne jamais commit/push.
- Ne jamais lancer `pnpm dev`.

---

User: $ARGUMENTS
