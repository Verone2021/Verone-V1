# Règles Backend API (Next.js 15 Route Handlers)

## Route Handlers

### Structure
```typescript
// app/api/[resource]/route.ts
export async function GET(request: Request) { }
export async function POST(request: Request) { }
export async function PUT(request: Request) { }
export async function DELETE(request: Request) { }
```

### Conventions
- Un fichier route.ts par ressource
- Zod pour validation des inputs
- Retourner NextResponse avec status approprié
- Utiliser `createServerClient` pour Supabase

## Server Actions

### Structure
```typescript
// app/actions/[domain].ts
"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"

const schema = z.object({ ... })

export async function createResource(formData: FormData) {
  const validated = schema.safeParse(Object.fromEntries(formData))
  if (!validated.success) {
    return { error: validated.error.flatten() }
  }
  // ...
  revalidatePath("/path")
  return { success: true }
}
```

### Conventions
- "use server" en haut de fichier
- Validation Zod OBLIGATOIRE
- Retourner objets typés (pas throw)
- revalidatePath après mutation

## Authentification

### Pattern standard
```typescript
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function getUser() {
  const supabase = createServerClient(/* ... */)
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### Middleware
- `/middleware.ts` pour protection routes
- Refresh session automatique
- Redirect vers /login si non authentifié

## Error Handling

### Codes HTTP
- 200: Success (GET, PUT)
- 201: Created (POST)
- 204: No Content (DELETE)
- 400: Validation Error
- 401: Unauthorized
- 403: Forbidden (RLS)
- 404: Not Found
- 500: Internal Error

### Format erreur standard
```typescript
return NextResponse.json(
  { error: { code: "VALIDATION_ERROR", message: "...", details: {} } },
  { status: 400 }
)
```

## Interdictions

- ❌ Exposer credentials dans response
- ❌ SQL brut (utiliser Supabase client)
- ❌ try/catch sans logging
- ❌ Inputs non validés (Zod obligatoire)
- ❌ Secrets dans code (utiliser env vars)

## Sécurité

- TOUJOURS vérifier authentification
- TOUJOURS valider inputs avec Zod
- RLS Supabase comme 2ème couche
- Rate limiting si API publique
- CORS configuré dans next.config.js
