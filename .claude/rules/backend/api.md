---
globs: apps/**/api/**/*.ts, apps/**/actions/**/*.ts
---

# Backend API (Next.js 15 Route Handlers)

## Conventions

- Un `route.ts` par ressource dans `app/api/`
- Server Actions dans `app/actions/` avec `"use server"`
- Validation Zod OBLIGATOIRE sur tous les inputs
- Retourner objets types (pas throw)
- `revalidatePath` apres mutation

## Authentification

- `createServerClient` de `@supabase/ssr` pour Supabase
- Middleware `/middleware.ts` pour protection routes
- RLS Supabase comme 2eme couche de securite

## INTERDIT

- Modifier les routes API existantes (Qonto, adresses, Packlink, emails, webhooks)
- Exposer credentials dans response
- SQL brut (utiliser Supabase client)
- try/catch sans logging
- Inputs non valides
