# Protection Authentification Back-Office (2026-01-07)

## Contexte

Faille de sécurité critique corrigée : les 121 pages du back-office étaient accessibles sans authentification.

## Solution implémentée

### Fichiers créés

1. `apps/back-office/src/lib/supabase-middleware.ts` - Helpers Supabase pour middleware
2. `apps/back-office/src/middleware.ts` - Protection de TOUTES les routes

### Fichiers supprimés

- `apps/back-office/src/middleware.disabled.ts` (ancien middleware inactif)

## Comportement

### Routes protégées (120 pages)

Toutes les routes SAUF `/login` nécessitent une authentification.
Si non authentifié → Redirect 307 vers `/login?redirect=<original_path>`

### Routes publiques (whitelist)

```typescript
const PUBLIC_PAGES = ['/login'];
const PUBLIC_API_PREFIXES = [
  '/api/auth', // Callbacks OAuth
  '/api/health', // Monitoring
  '/api/cron', // Cron jobs Vercel
  '/api/emails', // Webhooks
];
```

## Tests validés

- `/dashboard` → 307 redirect ✅
- `/factures` → 307 redirect ✅
- `/commandes` → 307 redirect ✅
- `/produits` → 307 redirect ✅
- `/stocks` → 307 redirect ✅
- `/admin/users` → 307 redirect ✅
- `/login` → 200 OK ✅

## Impact Turborepo

Aucun. Chaque app a son propre middleware isolé :

- back-office: `apps/back-office/src/middleware.ts`
- linkme: `apps/linkme/src/middleware.ts`
- site-internet: `apps/site-internet/middleware.ts`
