# Backend API (Next.js 15 Route Handlers)

## CRITICAL : Ne JAMAIS modifier les routes API existantes

Les routes API suivantes sont IMMUABLES. Toute modification casse systematiquement la production :
- Routes Qonto (devis, factures, clients)
- Routes adresses (autocomplete, geocoding)
- Routes emails (confirmation, notification, info-request)
- Routes webhooks (Revolut, Stripe)

## Conventions

- Un `route.ts` par ressource dans `app/api/`
- Server Actions dans `app/actions/` avec `"use server"`
- Validation Zod OBLIGATOIRE sur tous les inputs
- Retourner objets types (pas throw)
- `revalidatePath` apres mutation

## Pattern Route Handler

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@/lib/supabase-server';

const RequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = RequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Logique metier...
  return NextResponse.json({ success: true });
}
```

## Authentification

- `createServerClient` de `@supabase/ssr` pour Supabase
- Middleware `/middleware.ts` pour protection routes
- RLS Supabase comme 2eme couche de securite

## INTERDIT

- Modifier les routes API existantes (Qonto, adresses, emails, webhooks)
- Exposer credentials dans response
- SQL brut (utiliser Supabase client)
- try/catch sans logging
- Inputs non valides (pas de Zod = pas de merge)
- `select("*")` sans limit
