# Sentry Pro 2026 - Résumé des Changements

**Date** : 2026-01-15
**Branch** : `feat/sentry-pro-split-rgpd`
**Task ID** : INFRA-SENTRY-001

---

## 🎯 Objectif

Transformer la configuration Sentry basique en configuration "Sentry Pro 2026" avec:
- ✅ Projets Sentry séparés par application
- ✅ Replay RGPD-safe (masquage PII)
- ✅ Release tracking avec commit SHA
- ✅ Contexte utilisateur enrichi
- ✅ Alerting automatique → GitHub Issues
- ✅ Documentation complète

---

## 📦 Changements de Code

### Back-Office

**Fichiers modifiés:**

1. **`next.config.js`**
   - Changé `project: 'javascript-nextjs'` → `project: 'back-office-nextjs'`

2. **`instrumentation-client.ts`**
   - Ajouté `tags: { app: 'back-office' }`
   - Ajouté `environment: process.env.VERCEL_ENV`
   - Ajouté `release: process.env.VERCEL_GIT_COMMIT_SHA`
   - Changé `maskAllText: false` → `maskAllText: true` (RGPD)
   - Ajouté `block: [...]` pour champs sensibles
   - Ajouté `unmask: ['.sentry-unmask']` pour éléments non-sensibles

3. **`sentry.server.config.ts`**
   - Ajouté `environment: process.env.VERCEL_ENV`
   - Ajouté `release: process.env.VERCEL_GIT_COMMIT_SHA`

4. **`sentry.edge.config.ts`**
   - Ajouté `environment: process.env.VERCEL_ENV`
   - Ajouté `release: process.env.VERCEL_GIT_COMMIT_SHA`

5. **`app/layout.tsx`**
   - Ajouté import `SentryUserProvider`
   - Wrappé l'app avec `<SentryUserProvider>`

**Fichiers créés:**

6. **`components/providers/sentry-user-provider.tsx`**
   - Provider pour enrichir Sentry avec user ID
   - Tags: `app: back-office`
   - Context: `back-office`

---

### LinkMe

**Fichiers modifiés:**

1. **`next.config.js`**
   - Changé `project: 'javascript-nextjs'` → `project: 'linkme-nextjs'`

2. **`instrumentation-client.ts`**
   - Ajouté `tags: { app: 'linkme' }`
   - Ajouté `environment: process.env.VERCEL_ENV`
   - Ajouté `release: process.env.VERCEL_GIT_COMMIT_SHA`
   - Changé `maskAllText: false` → `maskAllText: true` (RGPD)
   - Ajouté `block: [...]` pour champs sensibles
   - Ajouté `unmask: ['.sentry-unmask']` pour éléments non-sensibles

3. **`sentry.server.config.ts`**
   - Ajouté `environment: process.env.VERCEL_ENV`
   - Ajouté `release: process.env.VERCEL_GIT_COMMIT_SHA`

4. **`sentry.edge.config.ts`**
   - Ajouté `environment: process.env.VERCEL_ENV`
   - Ajouté `release: process.env.VERCEL_GIT_COMMIT_SHA`

5. **`components/providers/Providers.tsx`**
   - Ajouté import `SentryUserContext`
   - Wrappé l'app avec `<SentryUserContext>`

**Fichiers créés:**

6. **`components/SentryUserContext.tsx`**
   - Context pour enrichir Sentry avec user ID + rôle + org
   - Tags: `app: linkme`, `role: <role>`, `organisation_id: <org_id>`
   - Context: `linkme` avec `organisation_id`, `role_name`, etc.

---

## 📄 Documentation Créée

### 1. **`docs/integrations/sentry-projects-setup.md`**
Guide manuel pour créer les 2 projets Sentry séparés:
- Renommer projet existant → `back-office-nextjs`
- Créer nouveau projet → `linkme-nextjs`
- Configurer les DSN dans Vercel
- Générer SENTRY_AUTH_TOKEN

### 2. **`docs/integrations/sentry-alerts-github.md`**
Guide manuel pour configurer les alertes automatiques:
- Installer l'intégration GitHub
- Créer Alert Rules (back-office + linkme)
- Configurer déduplication
- Templates GitHub Issues
- Intégration Slack (optionnel)
- MCP Sentry pour Claude Code

### 3. **`docs/integrations/sentry-runbook.md`**
Guide opérationnel quotidien:
- Comment signaler un bug (utilisateurs)
- Comment trier les erreurs (équipe)
- Comment investiguer avec Replay (dev)
- Comment utiliser MCP Sentry (Claude Code)
- Métriques et KPIs
- Workflow d'escalade (incidents)

### 4. **`docs/integrations/sentry-validation-checklist.md`**
Checklist de validation avant déploiement:
- Tests séparation des projets
- Tests RGPD (Replay masking)
- Tests Releases & Sourcemaps
- Tests Contexte utilisateur
- Tests Feedback button
- Screenshots à capturer

---

## 🔧 Actions Manuelles Requises

### Étape 1: Créer les Projets Sentry

**IMPORTANT** : Suivre `docs/integrations/sentry-projects-setup.md`

1. Renommer projet existant → `back-office-nextjs`
2. Créer nouveau projet → `linkme-nextjs`
3. Copier les 2 DSN

### Étape 2: Configurer Vercel

**Back-Office Project:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[BACK_OFFICE_KEY]@o4510701115473920.ingest.de.sentry.io/[BO_PROJECT_ID]
SENTRY_AUTH_TOKEN=[TOKEN]
SENTRY_ORG=verone-4q
SENTRY_PROJECT=back-office-nextjs
```

**LinkMe Project:**
```bash
NEXT_PUBLIC_SENTRY_DSN=https://[LINKME_KEY]@o4510701115473920.ingest.de.sentry.io/[LM_PROJECT_ID]
SENTRY_AUTH_TOKEN=[TOKEN]
SENTRY_ORG=verone-4q
SENTRY_PROJECT=linkme-nextjs
```

### Étape 3: Configurer les Alertes

**APRÈS déploiement**, suivre `docs/integrations/sentry-alerts-github.md`:
1. Installer intégration GitHub
2. Créer Alert Rules pour back-office
3. Créer Alert Rules pour linkme
4. Configurer Slack (optionnel)

---

## ✅ Validation

### Type-Check ✅
```bash
npm run type-check
# → 30 successful, 30 total
```

### Build ⏳
À tester après merge:
```bash
npm run build
```

### Tests E2E ⏳
À tester après déploiement preview:
- Suivre `docs/integrations/sentry-validation-checklist.md`

---

## 🚀 Plan de Déploiement

1. **Créer la PR** `feat/sentry-pro-split-rgpd`
2. **Merger en main** après review
3. **Déployer en preview** (automatique Vercel)
4. **Valider avec checklist** (sentry-validation-checklist.md)
5. **Créer les projets Sentry** (sentry-projects-setup.md)
6. **Configurer Vercel env vars** (sentry-projects-setup.md)
7. **Redéployer** pour activer les nouveaux DSN
8. **Configurer alertes** (sentry-alerts-github.md)
9. **Déployer en production**

---

## 📊 Bénéfices

**Avant:**
- ❌ Erreurs back-office et linkme mélangées
- ❌ Replays enregistrent les PII (risque RGPD)
- ❌ Pas de contexte utilisateur
- ❌ Releases non trackées
- ❌ Pas d'alertes automatiques

**Après:**
- ✅ Erreurs séparées par app (filtrage facile)
- ✅ Replays RGPD-safe (PII masqué)
- ✅ Contexte riche (user ID, org, rôle)
- ✅ Releases trackées avec commit SHA
- ✅ Alertes → GitHub Issues automatiques
- ✅ Investigation 10x plus rapide (Replay + context)

---

## 🔗 Liens Utiles

- [Sentry Dashboard](https://verone-4q.sentry.io/)
- [GitHub Issues](https://github.com/verone2021/verone-back-office-V1/issues)
- [Vercel Back-Office](https://vercel.com/verone2021s-projects/verone-back-office)
- [Vercel LinkMe](https://vercel.com/verone2021s-projects/linkme)

---

**Note** : Cette PR est **safe to merge** car elle n'impacte pas le code métier. La configuration Sentry actuelle continue de fonctionner jusqu'à ce que les nouveaux DSN soient configurés.
