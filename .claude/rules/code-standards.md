---
globs: apps/**/*.tsx, apps/**/*.ts, packages/**/*.tsx, packages/**/*.ts
---

# Code Standards

## REGLES IMPERATIVES

- Ne JAMAIS utiliser `any`, `as any`, `any[]`, `eslint-disable no-explicit-any` — utiliser `unknown` + Zod
- Ne JAMAIS modifier les routes API existantes (Qonto, adresses, emails, webhooks) — IMMUABLES
- Ne JAMAIS swapper un composant par un autre "equivalent" d'un autre package
- Ne JAMAIS remplacer un modal local par un modal de package
- Ne JAMAIS utiliser `router.push()` apres `signOut()` — utiliser `window.location.href`
- Ne JAMAIS laisser une promesse flottante (toujours `void` + `.catch()`)
- Ne JAMAIS passer un handler async a un event handler React (`onSubmit={handleSubmit}`)
- TOUJOURS valider les inputs avec Zod (API routes et Server Actions)
- TOUJOURS typer le client Supabase : `createClient<Database>()`
- TOUJOURS `await queryClient.invalidateQueries()` dans `onSuccess` de `useMutation`

## ANTI-RACCOURCIS — REFLEXE SENIOR (lecture obligatoire avant tout fix CI rouge)

**Citation Anthropic best-practices** (`code.claude.com/docs/en/best-practices`,
section « Give Claude a way to verify its work ») :

> _« the build fails with this error: [paste error]. fix it and verify the
> build succeeds. **Address the root cause, don't suppress the error.** »_

Quand une CI tourne rouge, un warning ESLint apparaît, un seuil
type-coverage ne passe pas, **on corrige la cause racine, on ne masque pas
le signal.** Ce n'est PAS du pragmatisme, c'est la cause #1 d'accumulation
de dette technique invisible.

### INTERDIT — réflexes junior à éliminer

- ❌ Baisser un seuil pour faire passer la CI (`--at-least 99.22 → 99.0`,
  `--max-warnings=0 → 5`, etc.) — la marge cache la dette
- ❌ `// @ts-ignore` sans justification — utiliser `// @ts-expect-error: <raison ≥ 20 caractères>`
  qui se nettoie automatiquement quand le bug sous-jacent est corrigé
  ([typescript-eslint.io/rules/prefer-ts-expect-error](https://typescript-eslint.io/rules/prefer-ts-expect-error/))
- ❌ `// eslint-disable-next-line` sans commentaire explicatif sur la même ligne
- ❌ `as any` ou `as unknown as X` — utiliser un type guard ou Zod
- ❌ `!` (non-null assertion) sauf si vraiment nécessaire ET commentée
- ❌ `.skip` / `xfail` sur un test qui flake — corriger la cause du flake

### OBLIGATOIRE — réflexe senior

1. **Investiguer** : `gh run view <id> --log-failed | tail -50` pour lire l'erreur réelle
2. **Localiser** : identifier les fichiers + lignes fautifs
3. **Corriger** la cause racine (typer correctement, fixer la logique, etc.)
4. **Vérifier en local** : le check qui a fail doit passer en local (`pnpm --filter <app> lint`,
   `pnpm --filter <app> type-check`, `pnpm --filter <app> type-coverage`)
5. **Pousser** seulement quand vert localement

### Outils de référence

- **Skill `/fix-warnings`** (`.claude/commands/fix-warnings.md`) — workflow 6 phases pour les warnings ESLint
- **Skill `/simplify`** — revue qualité après modification
- **Type guards + Zod** plutôt que `as`
- **Types `Database` de `@verone/types`** plutôt que `any` sur retours Supabase

### Référence externe

- Limite reconnue des règles markdown : adhérence d'environ 60-70 % avec
  un CLAUDE.md long, déclin linéaire avec le nombre d'instructions
  ([GitHub anthropics/claude-code#32163](https://github.com/anthropics/claude-code/issues/32163)).
  C'est pourquoi cette règle est doublée par des règles ESLint déterministes
  (`@typescript-eslint/ban-ts-comment` strict, `reportUnusedDisableDirectives: 'error'`)
  qui s'exécutent dans la CI (jamais en hook bloquant pre-commit).

### Incident référence

2026-05-09 PR #985 (Type Coverage Gate) : 45 `any` implicites dans 5
fichiers `consultations/[consultationId]/`. Coordinateur a proposé
« je baisse le seuil de 99.22 à 99.0 ». Roméo a refusé : « je veux tout
corriger ». Délégué à dev-agent → 5 fichiers typés proprement avec types
`Database`, coverage passé de 99.22 → 99.24 %. Voir ADR-033.

## STANDARDS

### Limites de Taille

- Fichier > 400 lignes → decomposer en sous-composants/modules
- Fonction > 75 lignes → extraire
- Composant React > 200 lignes → extraire en sous-composants

### Component Safety

1. Fixer le MINIMUM necessaire (> 30 lignes changees → demander Romeo)
2. Identifier le parent avant d'editer un enfant — le parent est READ-ONLY
3. Screenshot AVANT + APRES chaque fix UI (Playwright)
4. Ne PAS ajouter d'imports `@verone/` sans necessite stricte

### API Routes (Next.js 15)

- Un `route.ts` par ressource dans `app/api/`
- Server Actions dans `app/actions/` avec `"use server"`
- `createServerClient` de `@supabase/ssr` pour auth
- `revalidatePath` apres mutation

## USEEFFECT — PIEGE #1 PRODUCTION

**JAMAIS ajouter une fonction aux deps d'un `useEffect` pour faire taire ESLint sans verifier sa stabilite.**

Avant d'ajouter une dep a `useEffect` :

1. Est-ce un setter de `useState` ? → OK (stable par garantie React)
2. Est-ce une fonction wrappee dans `useCallback` ? → OK
3. Est-ce une ref `.current` ? → OK
4. **Sinon → wrapper avec `useCallback` AVANT de l'ajouter aux deps**

```typescript
// INTERDIT — fonction recreee a chaque render = boucle infinie
const reset = () => {
  setState('');
};
useEffect(() => {
  if (open) reset();
}, [open, reset]); // ← CRASH

// OBLIGATOIRE — stabiliser AVANT
const reset = useCallback(() => {
  setState('');
}, []);
useEffect(() => {
  if (open) reset();
}, [open, reset]); // ← OK
```

**Contexte** : Le 16 avril 2026, un agent a ajoute `resetNewCustomerForm` aux deps d'un `useEffect` sans `useCallback`. Resultat : boucle infinie de resets, impossible de creer une commande LinkMe pendant 48h en production.

## FICHIERS PROTEGES — NE PAS MODIFIER SANS APPROBATION

Les fichiers marques `@protected` dans leur en-tete sont valides et testes en production.
Toute modification necessite l'approbation explicite de Romeo.
Voir aussi : `stock-triggers-protected.md` pour les triggers DB.

## PATTERNS (pieges reels)

### Promesses Flottantes

```typescript
// INTERDIT — erreur silencieuse
onClick={() => { createOrder(data); }}

// OBLIGATOIRE
onClick={() => {
  void createOrder(data).catch(err => {
    console.error('[Component] Failed:', err);
    toast.error('Erreur');
  });
}}
```

### Async Event Handlers

```typescript
// INTERDIT — handleSubmit est async
<form onSubmit={handleSubmit}>

// OBLIGATOIRE — wrapper synchrone
<form onSubmit={(e) => {
  void handleSubmit(e).catch(err => console.error('[Form]:', err));
}}>
```

### React Query Invalidation

```typescript
// INTERDIT — UI avant invalidation cache
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['x'] });
};

// OBLIGATOIRE — await
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ['x'] });
};
```

### Logout (piege AuthSessionMissingError)

```typescript
// OBLIGATOIRE — hard navigation, pas router.push()
void supabase.auth
  .signOut()
  .then(() => {
    if (typeof window !== 'undefined') window.location.href = '/login';
  })
  .catch(() => {
    if (typeof window !== 'undefined') window.location.href = '/login';
  });
```

### Client Supabase Type

```typescript
import type { Database } from '@verone/types';
const supabase = createClient<Database>(); // TOUJOURS typer
// Resultat : inference automatique, zero any, zero warning ESLint
```
