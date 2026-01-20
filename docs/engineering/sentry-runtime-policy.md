# Sentry Runtime Policy - Vérone Monorepo

**Date**: 2026-01-20
**Status**: CANON (source de vérité)
**Owner**: Engineering Team

---

## 🎯 Objectif

Définir **où et comment** utiliser Sentry dans le monorepo Next.js, en respectant les contraintes des différents runtimes (Node.js, Edge, Browser).

**Principe**: Instrumentation maximale **SANS casser** les apps en production.

---

## ✅ Où Sentry EST Autorisé

### 1. Server Components / API Routes (Node.js Runtime)

**Runtime**: Node.js
**Config**: `sentry.server.config.ts`

**Autorisé**:
```typescript
// ✅ Server Components (app/*)
import * as Sentry from '@sentry/nextjs';

export default function ServerComponent() {
  try {
    // ...
  } catch (error) {
    Sentry.captureException(error);
  }
}

// ✅ API Routes (app/api/*)
import * as Sentry from '@sentry/nextjs';

export async function POST(request: Request) {
  try {
    // ...
  } catch (error) {
    Sentry.captureException(error);
    return new Response('Error', { status: 500 });
  }
}
```

---

### 2. Client Components (Browser Runtime)

**Runtime**: Browser
**Config**: `sentry.client.config.ts`

**Autorisé**:
```typescript
// ✅ Client Components
'use client';
import * as Sentry from '@sentry/nextjs';

export function ClientComponent() {
  const handleClick = () => {
    try {
      // ...
    } catch (error) {
      Sentry.captureException(error);
    }
  };
}
```

---

### 3. Edge Runtime via Instrumentation (Recommandé)

**Runtime**: Edge
**Config**: `sentry.edge.config.ts` + `instrumentation.ts`

**Autorisé** (via instrumentation automatique):
```typescript
// ✅ instrumentation.ts (Next.js 15+)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(err, request) {
  Sentry.captureException(err);
}
```

**Résultat**: Sentry Edge capture automatiquement les erreurs **sans import dans middleware**.

---

## ❌ Où Sentry EST INTERDIT

### 1. Middleware Edge (Import Direct)

**Runtime**: Edge
**Fichier**: `middleware.ts`

**❌ INTERDIT**:
```typescript
// ❌ NE JAMAIS FAIRE ÇA
import * as Sentry from '@sentry/nextjs';  // CRASH Edge Runtime

export async function middleware(request) {
  try {
    // ...
  } catch (error) {
    Sentry.captureException(error);  // ❌ Causera 500 prod
  }
}
```

**Raison**:
- `@sentry/nextjs` utilise des APIs Node.js incompatibles avec Edge Runtime
- Import Sentry → TypeError → MIDDLEWARE_INVOCATION_FAILED → 500

**✅ Alternative**:
```typescript
// ✅ Middleware sans Sentry direct
export async function middleware(request) {
  try {
    // ...
  } catch (error) {
    // Logs → Vercel Runtime Logs (visible Dashboard)
    console.error('[Middleware Error]', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      url: request.url,
    });

    // Sentry capturera via instrumentation.ts → onRequestError()
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 🛠️ Configuration Requise (Apps Next.js)

### Structure Fichiers

```
apps/back-office/
├── instrumentation.ts          # ✅ Charge config selon runtime
├── sentry.client.config.ts     # ✅ Browser
├── sentry.server.config.ts     # ✅ Node.js
├── sentry.edge.config.ts       # ✅ Edge (via instrumentation)
└── src/
    └── middleware.ts           # ❌ PAS D'IMPORT SENTRY ICI
```

### instrumentation.ts (Obligatoire)

```typescript
import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Node.js Runtime (Server Components, API Routes)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  // Edge Runtime (Middleware, Edge API Routes)
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Next.js 15: Capture erreurs RSC + Edge
export async function onRequestError(err, request) {
  Sentry.captureException(err, {
    contexts: {
      nextjs: {
        request: {
          path: request.path,
          method: request.method,
        },
      },
    },
  });
}
```

### sentry.edge.config.ts

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enabled: process.env.NODE_ENV === 'production',
});
```

---

## 📊 Logs & Monitoring

### Middleware Errors

**Où les voir**:
1. **Vercel Dashboard** → Logs → Filter: "Middleware Error"
2. **Sentry** → via `onRequestError()` (Next.js 15+)

**Format logs console.error**:
```typescript
console.error('[Middleware Error] TypeError: ...", {
  pathname: '/dashboard',
  url: 'https://...',
  stack: 'TypeError: ...\n    at ...',
  isPublic: false,
});
```

### Server/Client Errors

**Où les voir**:
1. **Sentry Dashboard** → Issues
2. **Vercel Dashboard** → Logs (fallback)

---

## 🧪 Testing Policy

### Tests Locaux

**Avant commit**:
```bash
# 1. Vérifier que middleware ne contient PAS d'import Sentry
grep -n "import.*Sentry" apps/*/src/middleware.ts
# Résultat attendu: vide (ou erreur "No such file")

# 2. Type-check
npm run type-check

# 3. Build
npm run build
```

### Tests Production

**Après déploiement**:
1. Tester `/login` → 200 (pas 500)
2. Vérifier Sentry Dashboard → erreurs captées (si applicable)
3. Vérifier Vercel Logs → console.error visible

---

## 🔄 Rollback Plan

**Si middleware crash en prod**:

```bash
# Option 1: Revert commit
git revert <commit-sha>
git push origin main

# Option 2: Hotfix (supprimer import Sentry)
# Éditer middleware.ts
# - Supprimer: import * as Sentry from '@sentry/nextjs';
# - Supprimer: Sentry.captureException(...)
# - Garder: console.error(...)
git commit -m "[HOTFIX] Remove Sentry from middleware"
git push origin main
```

**Vercel redéploie automatiquement** depuis `main` (~2min).

---

## 📚 Références

- [Sentry Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Next.js Edge Runtime](https://nextjs.org/docs/app/api-reference/edge)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)
- Incident: PR #79 (Hotfix middleware 500 - 2026-01-20)

---

## ✅ Checklist Nouvelle App

Lors de l'ajout d'une nouvelle app Next.js au monorepo:

- [ ] Créer `instrumentation.ts` avec register() + onRequestError()
- [ ] Créer `sentry.client.config.ts`
- [ ] Créer `sentry.server.config.ts`
- [ ] Créer `sentry.edge.config.ts`
- [ ] ❌ **NE PAS** importer Sentry dans `middleware.ts`
- [ ] Ajouter env vars Vercel:
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
- [ ] Tester localement (build + type-check)
- [ ] Déployer preview → vérifier pas de 500
- [ ] Merge → vérifier prod accessible

---

**Version**: 1.0.0
**Last Updated**: 2026-01-20
