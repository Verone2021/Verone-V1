# Règles Next.js 15

## Stack

- Next.js 15 App Router (RSC)
- shadcn/ui + Tailwind CSS
- Zod pour validation
- TypeScript strict

## Conventions

- Composants serveur par défaut
- "use client" uniquement si nécessaire (hooks, events)
- Pas de barrel exports (`index.ts`)
- Préférer composition over configuration

## Organisation Composants

```
app/
├── (auth)/           # Routes authentification
├── (dashboard)/      # Routes dashboard
├── api/              # Route handlers
├── actions/          # Server actions
└── layout.tsx        # Layout racine

components/
├── ui/               # Composants shadcn/ui
├── forms/            # Formulaires réutilisables
└── [feature]/        # Composants par feature
```

## Performance

- **Images** : Utiliser `next/image` avec sizes
- **Fonts** : Utiliser `next/font`
- **Loading** : Fichiers `loading.tsx` pour suspense
- **Streaming** : RSC avec `Suspense` pour données lentes
- **Caching** : `unstable_cache` ou fetch cache

## Data Fetching

```typescript
// ✅ Server Component (défaut)
async function Page() {
  const data = await getData() // Direct fetch
  return <div>{data}</div>
}

// ✅ Server Action (mutations)
"use server"
export async function createItem(formData: FormData) {
  // ...
  revalidatePath("/items")
}

// ❌ Client-side fetch (éviter sauf nécessaire)
```

## Testing

- Playwright pour E2E
- `npm run e2e:smoke` après changements UI
- Data-testid pour sélecteurs stables

## Interdictions

- ❌ Pages Router (deprecated)
- ❌ getServerSideProps / getStaticProps
- ❌ Class components
- ❌ useEffect pour fetch initial (utiliser RSC)
- ❌ Import relatifs profonds (`../../..`)
