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
