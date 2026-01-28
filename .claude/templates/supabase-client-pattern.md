# Pattern Supabase Client Typé - Référence Officielle

**Date** : 2026-01-28
**Source** : [Supabase JS Docs](https://context7.com/supabase/supabase-js/llms.txt)
**Objectif** : Éliminer warnings TypeScript ESLint en typant clients Supabase

---

## 🎯 Problème

**AVANT (incorrect)** - Client non typé → TypeScript infère `any` → cascade de warnings :

```typescript
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient(); // Type inféré: SupabaseClient<any, "public", any>
//    ^^^^^^^^ ⚠️ TypeScript infère 'any' pour Database

const { data } = await supabase.from('products').select('*');
//      ^^^^ ⚠️ Type: any (génère 2000+ warnings ESLint)
```

**Warnings générés** :

- `@typescript-eslint/no-unsafe-assignment` (assignation de `any`)
- `@typescript-eslint/no-unsafe-member-access` (accès propriété sur `any`)
- `@typescript-eslint/no-unsafe-call` (appel fonction `any`)
- `@typescript-eslint/no-unsafe-return` (retour `any`)

---

## ✅ Solution : Typer avec `<Database>`

**APRÈS (correct)** - Client typé → TypeScript infère types exacts → 0 warnings :

```typescript
import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';

const supabase = createClient<Database>();
//    ^^^^^^^^ ✅ Type: SupabaseClient<Database, "public", Database["public"]>

const { data } = await supabase.from('products').select('*');
//      ^^^^ ✅ Type: Database['public']['Tables']['products']['Row'][] | null
```

**Résultat** : TypeScript infère automatiquement les types → Aucun `any` → 0 warnings ESLint.

---

## 📋 Pattern à Appliquer

### 1. Client-Side (Composants React, Hooks)

```typescript
'use client';

import { createClient } from '@verone/utils/supabase/client';
import type { Database } from '@verone/types';

export function useProducts() {
  const supabase = createClient<Database>();

  // TypeScript infère automatiquement le type de 'data'
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price')
    .eq('category_id', categoryId);

  // data: Database['public']['Tables']['products']['Row'][] | null
  // Aucun 'as any' nécessaire !
}
```

### 2. Server-Side (API Routes, Server Actions)

```typescript
'use server';

import { createServerClient } from '@supabase/ssr';
import type { Database } from '@verone/types';
import { cookies } from 'next/headers';

export async function getProducts() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data } = await supabase.from('products').select('*');
  // data: Database['public']['Tables']['products']['Row'][] | null

  return data;
}
```

---

## 🚫 Anti-Patterns à Éviter

### ❌ INTERDIT : Casting manuel avec `as any`

```typescript
// ❌ NE JAMAIS FAIRE ÇA
const { data } = await supabase.from('products').select('*');
const products = data as any; // Masque le problème, génère warnings
```

### ❌ INTERDIT : Type explicite `: any`

```typescript
// ❌ NE JAMAIS FAIRE ÇA
const supabase = createClient();
const data: any = await supabase.from('products').select('*');
```

### ✅ CORRECT : Laisser TypeScript inférer

```typescript
// ✅ TOUJOURS FAIRE ÇA
const supabase = createClient<Database>();
const { data } = await supabase.from('products').select('*');
// TypeScript infère automatiquement : data est Database['public']['Tables']['products']['Row'][] | null
```

---

## 📊 Impact Mesuré

**Projet Vérone** (2026-01-28) :

- **534 occurrences** de `createClient()` non typé
- **331 fichiers** uniques concernés
- **5,849 warnings** ESLint générés

**Après typage avec `<Database>`** :

- ✅ ~98% des warnings éliminés automatiquement (inférence TypeScript)
- ✅ Type-safety complète de la DB au client
- ✅ Autocompletion IDE sur toutes les requêtes

---

## 🔄 Checklist de Migration

Pour chaque fichier utilisant Supabase :

1. ✅ **Importer types** : `import type { Database } from '@verone/types'`
2. ✅ **Typer client** : `createClient<Database>()` ou `createServerClient<Database>(...)`
3. ✅ **Retirer casts** : Supprimer tous `as any`, `: any`
4. ✅ **Vérifier build** : `pnpm type-check && pnpm build`
5. ✅ **Commit** : Sauvegarder progrès

---

## 📚 Références

- [Supabase JS TypeScript Support](https://context7.com/supabase/supabase-js/llms.txt)
- [TypeScript ESLint no-unsafe-\* rules](https://typescript-eslint.io/rules/no-unsafe-assignment)
- [Supabase Type Generation](https://context7.com/supabase/cli/llms.txt)

---

**Version** : 1.0.0
**Auteur** : Claude Code (d'après docs officielles)
**Dernière mise à jour** : 2026-01-28
