# Audit Sentry - Configuration Actuelle

**Date** : 2026-01-15
**Analysé par** : Claude Code
**Apps** : back-office, linkme

---

## 📋 Réponses aux 5 Questions

### ❓ Question 1 : Back-office - Sentry câblé avec instrumentation.ts conforme Next.js 15 ?

**Réponse** : ✅ **OUI - Configuration conforme**

#### Instrumentation Server-Side (`instrumentation.ts`)

**Fichier** : `apps/back-office/instrumentation.ts`

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export async function onRequestError(err: unknown, request: { path: string; method: string; headers: Headers }) {
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

**✅ Conforme Next.js 15** :
- `register()` : Hook Next.js 15 pour initialization ✅
- `onRequestError()` : Capture erreurs RSC (React Server Components) ✅
- Séparation nodejs/edge runtime ✅

#### Instrumentation Client-Side (`instrumentation-client.ts`)

**Fichier** : `apps/back-office/instrumentation-client.ts`

```typescript
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    Sentry.feedbackIntegration({ /* config */ }),
  ],
  enabled: process.env.NODE_ENV === 'production',
});
```

**✅ Conforme Next.js 15** :
- `onRouterTransitionStart` : Hook navigation App Router ✅
- Replay intégration ✅
- User Feedback intégration ✅

#### Build Configuration

**Fichier** : `apps/back-office/next.config.js`

```javascript
const sentryWebpackPluginOptions = {
  org: 'verone-4q',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  hideSourceMaps: true,
  tunnelRoute: '/monitoring',
  webpack: {
    automaticVercelMonitors: true,
  },
};

module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
```

**✅ Build OK** :
- Webpack plugin configuré ✅
- Sourcemaps upload automatique ✅
- hideSourceMaps: true (sécurité) ✅
- automaticVercelMonitors: true (Sentry v8+) ✅

**Verdict** : ✅ **CONFORME - Aucun problème détecté**

---

### ❓ Question 2 : LinkMe - Même configuration + DSN/vars Vercel séparées du back-office ?

**Réponse** : ✅ **Configuration conforme** | ⚠️ **DSN IDENTIQUE (problème à corriger)**

#### Configuration LinkMe

**Fichiers identiques** :
- `apps/linkme/instrumentation.ts` ✅ Conforme Next.js 15
- `apps/linkme/instrumentation-client.ts` ✅ Replay + Feedback
- `apps/linkme/next.config.js` ✅ Webpack plugin

**Configuration identique à back-office** : ✅ Cohérence parfaite

#### ⚠️ PROBLÈME CRITIQUE : DSN Identique

**Fichiers `.env.local`** :

```bash
# apps/back-office/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://38b5f318dd8f4f6079f6a411048c7a77@o4510701115473920.ingest.de.sentry.io/4510701119012944

# apps/linkme/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://38b5f318dd8f4f6079f6a411048c7a77@o4510701115473920.ingest.de.sentry.io/4510701119012944
```

**Même DSN = Même projet Sentry** → Les erreurs de back-office et linkme sont **mélangées** dans le même projet !

**Impact** :
- ❌ Impossible de filtrer erreurs par app
- ❌ Metrics polluées (volumes cumulés)
- ❌ Alertes non ciblées
- ❌ Impossible de voir "LinkMe produit 80% des erreurs"

#### Configuration `next.config.js`

**Même projet Sentry** :

```javascript
// apps/back-office/next.config.js
const sentryWebpackPluginOptions = {
  org: 'verone-4q',
  project: 'javascript-nextjs', // ⚠️ MÊME PROJET
};

// apps/linkme/next.config.js
const sentryWebpackPluginOptions = {
  org: 'verone-4q',
  project: 'javascript-nextjs', // ⚠️ MÊME PROJET
};
```

**Verdict** : ⚠️ **SÉPARER EN 2 PROJETS SENTRY**

---

### ❓ Question 3 : Sourcemaps uploadés + Release créée avec commit SHA ?

**Réponse** : ✅ **Sourcemaps uploadés** | ❓ **Release automatique via Vercel (à vérifier)**

#### Sourcemaps Upload

**Configuration** :

```javascript
// next.config.js (les 2 apps)
const sentryWebpackPluginOptions = {
  org: 'verone-4q',
  project: 'javascript-nextjs',
  hideSourceMaps: true, // ✅ Upload mais masqué côté client
  silent: !process.env.CI, // ✅ Logs uniquement en CI
};
```

**✅ Sourcemaps uploadés automatiquement** :
- Via `withSentryConfig()` wrapping
- Lors de `next build` en production
- Upload via SENTRY_AUTH_TOKEN (doit être dans Vercel env vars)

#### Release Tracking

**Méthode 1 : Intégration Vercel** (Automatique)

Si Vercel + Sentry sont intégrés via :
- https://vercel.com/integrations/sentry
- Alors Vercel crée automatiquement une release avec `VERCEL_GIT_COMMIT_SHA`

**Méthode 2 : Manuelle** (Non configurée actuellement)

```javascript
// Non trouvé dans next.config.js
{
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
}
```

**Vérification nécessaire** :
1. Aller sur Sentry Dashboard → Releases
2. Vérifier si les releases apparaissent avec commit SHA
3. Si NON → Ajouter l'intégration Vercel ou config manuelle

**Sources** :
- [Vercel Integration](https://docs.sentry.io/organization/integrations/deployment/vercel/)
- [Releases Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/releases/)

**Verdict** : ✅ **Sourcemaps OK** | ❓ **Release à vérifier sur Sentry Dashboard**

---

### ❓ Question 4 : User Feedback button existe déjà ? Où l'ajouter ?

**Réponse** : ✅ **OUI - Feedback configuré dans les 2 apps**

#### Configuration Actuelle

**Fichier** : `instrumentation-client.ts` (back-office + linkme)

```typescript
Sentry.feedbackIntegration({
  colorScheme: 'system',
  buttonLabel: 'Signaler un bug',
  submitButtonLabel: 'Envoyer',
  formTitle: 'Signaler un problème',
  messagePlaceholder: 'Décrivez le problème rencontré...',
  successMessageText: 'Merci pour votre retour !',
})
```

**✅ Feedback intégration activée** :
- Bouton **flottant automatique** (coin bas-droit par défaut)
- Formulaire français personnalisé ✅
- Active uniquement en production (`enabled: NODE_ENV === 'production'`)

#### Où le Bouton Apparaît

**Par défaut** :
- Bouton flottant violet en bas à droite
- Toujours visible (position: fixed)
- Sur toutes les pages (intégration globale)

#### Options d'Emplacement

Si vous voulez **personnaliser l'emplacement** :

**Option 1 : Layout Global** (Recommandé)

```typescript
// apps/back-office/src/app/layout.tsx
'use client';
import * as Sentry from '@sentry/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}

        {/* Trigger custom feedback button */}
        <button
          onClick={() => Sentry.showReportDialog()}
          className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
        >
          🐛 Signaler un bug
        </button>
      </body>
    </html>
  );
}
```

**Option 2 : Header/Sidebar**

```typescript
// apps/back-office/src/components/layout/app-header.tsx
'use client';
import * as Sentry from '@sentry/nextjs';

export function AppHeader() {
  return (
    <header>
      <button onClick={() => Sentry.showReportDialog()}>
        Signaler un problème
      </button>
    </header>
  );
}
```

**Option 3 : Désactiver bouton auto, custom uniquement**

```typescript
// instrumentation-client.ts
Sentry.feedbackIntegration({
  autoInject: false, // ⚠️ Désactive bouton automatique
  // Vous devez appeler Sentry.showReportDialog() manuellement
})
```

**Verdict** : ✅ **DÉJÀ CONFIGURÉ - Bouton automatique actif en production**

---

### ❓ Question 5 : Replay activé ? (sampling, masquage PII)

**Réponse** : ✅ **OUI - Replay activé avec sampling optimal**

#### Configuration Replay

**Fichier** : `instrumentation-client.ts` (back-office + linkme)

```typescript
Sentry.init({
  // Session Replay Sampling
  replaysSessionSampleRate: 0.1,     // 10% des sessions normales
  replaysOnErrorSampleRate: 1.0,     // 100% des sessions avec erreur

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,              // ⚠️ Texte NON masqué
      blockAllMedia: false,            // ⚠️ Media NON bloquée
    }),
  ],
});
```

#### ✅ Sampling Optimal

**10% sessions normales** :
- Suffisant pour comprendre comportement utilisateur
- Économise quota Sentry
- Coût raisonnable

**100% sessions avec erreur** :
- **Critique** : Permet de voir EXACTEMENT ce que l'utilisateur a fait avant l'erreur
- Replay automatiquement attaché à chaque erreur
- Debuggage ultra-rapide

#### ⚠️ Masquage PII (Données Personnelles)

**Configuration actuelle** :
```typescript
maskAllText: false,        // ⚠️ Texte visible
blockAllMedia: false,      // ⚠️ Images/vidéos visibles
```

**Risques RGPD** :
- ❌ Noms clients visibles dans les tableaux
- ❌ Emails visibles dans les formulaires
- ❌ Adresses visibles
- ❌ Numéros de téléphone visibles

**⚠️ RECOMMANDATION : Activer masquage sélectif**

```typescript
Sentry.replayIntegration({
  // Option 1 : Masquage automatique (conservateur)
  maskAllText: true,
  blockAllMedia: true,

  // Option 2 : Masquage sélectif (recommandé)
  maskAllText: false,
  blockAllMedia: false,

  // Masquer spécifiquement les champs sensibles
  block: ['.sensitive', '[data-private]'],
  mask: ['[data-email]', '[data-phone]', '[data-address]'],

  // OU utiliser classes CSS
  // Ajouter class="sentry-block" sur éléments sensibles
})
```

**Classes CSS à ajouter** :

```typescript
// Exemples d'éléments à masquer
<input type="email" className="sentry-mask" />
<div className="sentry-block">{customerName}</div>
<span data-email>{user.email}</span> {/* Auto-masqué */}
```

#### ✅ Replay Attaché aux Erreurs

**Automatique** : Quand une erreur se produit :
1. Sentry capture l'erreur
2. Si un replay est en cours → **attaché automatiquement**
3. Dans Sentry Dashboard → Bouton "View Replay" sur chaque erreur
4. Vous voyez les 30 secondes avant l'erreur

**Verdict** : ✅ **Replay activé et fonctionnel** | ⚠️ **Activer masquage PII pour RGPD**

---

## 📊 Résumé Configuration Actuelle

| Aspect | Back-Office | LinkMe | Statut |
|--------|-------------|---------|---------|
| instrumentation.ts | ✅ Conforme Next.js 15 | ✅ Conforme Next.js 15 | ✅ OK |
| instrumentation-client.ts | ✅ Replay + Feedback | ✅ Replay + Feedback | ✅ OK |
| DSN séparé | ❌ Même DSN | ❌ Même DSN | ⚠️ À corriger |
| Projet Sentry | ❌ javascript-nextjs | ❌ javascript-nextjs | ⚠️ À séparer |
| Sourcemaps upload | ✅ Automatique | ✅ Automatique | ✅ OK |
| Release tracking | ❓ À vérifier | ❓ À vérifier | ❓ Vérifier intégration Vercel |
| User Feedback | ✅ Bouton auto | ✅ Bouton auto | ✅ OK |
| Replay enabled | ✅ 10%/100% | ✅ 10%/100% | ✅ OK |
| Masquage PII | ⚠️ maskAllText: false | ⚠️ maskAllText: false | ⚠️ À activer |

---

## 🚨 Actions Prioritaires

### 🔴 HAUTE PRIORITÉ

#### 1. Séparer les Projets Sentry (30 min)

**Pourquoi** : Actuellement les erreurs back-office et linkme sont mélangées

**Action** :

1. **Créer projet LinkMe sur Sentry** :
   - Aller sur https://sentry.io/organizations/verone-4q/projects/
   - Create Project → Next.js → Nom : `linkme-nextjs`
   - Copier le nouveau DSN

2. **Mettre à jour LinkMe** :

```bash
# apps/linkme/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://[NEW_DSN]@o4510701115473920.ingest.de.sentry.io/[NEW_PROJECT_ID]
```

```javascript
// apps/linkme/next.config.js
const sentryWebpackPluginOptions = {
  org: 'verone-4q',
  project: 'linkme-nextjs', // ✅ Projet séparé
};
```

3. **Mettre à jour Back-Office** (renommer pour clarté) :

```javascript
// apps/back-office/next.config.js
const sentryWebpackPluginOptions = {
  org: 'verone-4q',
  project: 'back-office-nextjs', // ✅ Nom explicite
};
```

4. **Configurer Vercel Environment Variables** :
   - Vercel Dashboard → back-office project → Settings → Environment Variables
   - `NEXT_PUBLIC_SENTRY_DSN` = DSN back-office
   - Vercel Dashboard → linkme project → Settings → Environment Variables
   - `NEXT_PUBLIC_SENTRY_DSN` = DSN linkme

**Bénéfices** :
- ✅ Erreurs séparées par app
- ✅ Metrics précises
- ✅ Alertes ciblées
- ✅ Budgets de quota séparés

---

### 🟡 MOYENNE PRIORITÉ

#### 2. Activer Masquage PII (15 min)

**Pourquoi** : Conformité RGPD

**Action** :

```typescript
// apps/back-office/instrumentation-client.ts
// apps/linkme/instrumentation-client.ts

Sentry.replayIntegration({
  maskAllText: true,              // ✅ Masquer tout par défaut
  blockAllMedia: false,           // Images OK (pas de PII)

  // Démasquer éléments non-sensibles
  unmask: ['.btn', '.nav', '.sidebar'],
})
```

**Ou approche sélective** :

```typescript
Sentry.replayIntegration({
  maskAllText: false,
  blockAllMedia: false,

  // Masquer éléments sensibles spécifiquement
  mask: [
    '[data-email]',
    '[data-phone]',
    '[data-address]',
    '.customer-name',
    '.organisation-name',
  ],
})
```

**Puis ajouter data-attributes** :

```tsx
// Exemple : apps/back-office/src/components/CustomerCard.tsx
<div>
  <span data-email>{customer.email}</span>
  <span data-phone>{customer.phone}</span>
</div>
```

---

#### 3. Vérifier Release Tracking (10 min)

**Action** :

1. **Aller sur Sentry Dashboard** :
   - https://verone-4q.sentry.io/projects/javascript-nextjs/releases/

2. **Vérifier si releases apparaissent** :
   - Si OUI ✅ → L'intégration Vercel fonctionne
   - Si NON ⚠️ → Installer intégration Vercel ou config manuelle

3. **Si NON, installer intégration Vercel** :
   - https://vercel.com/integrations/sentry
   - Connecter organisation Sentry
   - Sélectionner projets Vercel
   - Auto-config de SENTRY_AUTH_TOKEN

4. **OU config manuelle** :

```javascript
// next.config.js
Sentry.init({
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  environment: process.env.VERCEL_ENV || 'development',
});
```

---

### 🟢 BASSE PRIORITÉ

#### 4. Personnaliser Feedback Button (Optionnel)

Si vous voulez déplacer le bouton :

```typescript
// apps/back-office/src/app/layout.tsx
'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function RootLayout({ children }) {
  useEffect(() => {
    // Désactiver bouton auto si intégré manuellement ailleurs
    // Ou garder tel quel (bouton flottant automatique)
  }, []);

  return (
    <html>
      <body>
        {children}
        {/* Bouton custom optionnel */}
        <button
          onClick={() => Sentry.showReportDialog()}
          className="feedback-btn"
        >
          🐛 Signaler un bug
        </button>
      </body>
    </html>
  );
}
```

---

## ✅ Points Forts Configuration Actuelle

1. ✅ **Next.js 15 conforme** : instrumentation.ts avec `register()` et `onRequestError()`
2. ✅ **Replay activé** : 10% sessions normales, 100% sessions avec erreur
3. ✅ **User Feedback** : Bouton automatique français
4. ✅ **Sourcemaps** : Upload automatique + masquage client
5. ✅ **Navigation tracking** : `onRouterTransitionStart` hook
6. ✅ **Performance monitoring** : 10% tracesSampleRate
7. ✅ **Filtrage erreurs** : ResizeObserver, ChunkLoadError ignorés
8. ✅ **Production only** : Désactivé en dev local

---

## 📚 Sources & Documentation

- [Vercel Integration](https://docs.sentry.io/organization/integrations/deployment/vercel/)
- [Next.js Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Releases Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/releases/)
- [Session Replay](https://docs.sentry.io/platforms/javascript/session-replay/)
- [User Feedback](https://docs.sentry.io/platforms/javascript/user-feedback/)
- [Deploy with Vercel & Sentry](https://sentry.io/resources/deploy-and-monitor-with-vercel-and-sentry/)

---

## 🎯 Checklist Post-Correction

- [ ] Créer projet `linkme-nextjs` sur Sentry
- [ ] Créer projet `back-office-nextjs` sur Sentry (renommer l'existant)
- [ ] Mettre à jour DSN dans `.env.local` (les 2 apps)
- [ ] Mettre à jour `project:` dans `next.config.js` (les 2 apps)
- [ ] Configurer Vercel env vars (DSN séparés)
- [ ] Activer masquage PII (`maskAllText: true` ou sélectif)
- [ ] Vérifier releases sur Sentry Dashboard
- [ ] Installer intégration Vercel si nécessaire
- [ ] Tester feedback button en production
- [ ] Tester replay en production (créer erreur volontaire)

---

**Rapport généré le** : 2026-01-15
**Prochaine révision** : Après corrections + premier déploiement
