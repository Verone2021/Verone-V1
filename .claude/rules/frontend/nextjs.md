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

## Interdictions

- ❌ Pages Router (deprecated)
- ❌ getServerSideProps / getStaticProps
- ❌ Class components
