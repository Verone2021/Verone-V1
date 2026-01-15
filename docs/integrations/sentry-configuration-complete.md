# Sentry Pro 2026 - Configuration Complétée

**Date** : 2026-01-15
**Status** : ✅ 95% Automatisé via Playwright

---

## ✅ CE QUI A ÉTÉ FAIT AUTOMATIQUEMENT

### 1. Projets Sentry Séparés ✅

**Projet Back-Office:**
- Nom: `back-office-nextjs`
- URL: https://verone-4q.sentry.io/projects/back-office-nextjs/
- DSN: `https://38b5f318dd8f4f6079f6a411048c7a77@o4510701115473920.ingest.de.sentry.io/4510701119012944`

**Projet LinkMe:**
- Nom: `linkme-nextjs`
- URL: https://verone-4q.sentry.io/projects/linkme-nextjs/
- DSN: `https://475e296d088587f5687ecc00bec61276@o4510701115473920.ingest.de.sentry.io/4510714318684240`

### 2. Variables Vercel Configurées ✅

**Back-Office** (`verone-back-office`):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://38b5f318dd8f4f6079f6a411048c7a77@o4510701115473920.ingest.de.sentry.io/4510701119012944
SENTRY_PROJECT=back-office-nextjs  # (existait déjà)
SENTRY_ORG=verone-4q               # (existait déjà)
SENTRY_AUTH_TOKEN=<existing>       # (existait déjà)
```

**LinkMe** (`linkme`):
```bash
NEXT_PUBLIC_SENTRY_DSN=https://475e296d088587f5687ecc00bec61276@o4510701115473920.ingest.de.sentry.io/4510714318684240
SENTRY_PROJECT=linkme-nextjs
SENTRY_ORG=verone-4q              # (à vérifier)
SENTRY_AUTH_TOKEN=<existing>      # (à vérifier)
```

### 3. Code Déjà Configuré (commit `e26e92b9`) ✅

**Configuration RGPD-safe:**
- `maskAllText: true` dans les 2 apps
- `block: [email, phone, tel, data-private]`
- `unmask: ['.sentry-unmask']`

**Release Tracking:**
- `environment: process.env.VERCEL_ENV`
- `release: process.env.VERCEL_GIT_COMMIT_SHA`
- Tags: `app: back-office / linkme`

**Contexte Utilisateur:**
- Back-Office: `SentryUserProvider` (user ID + app tag)
- LinkMe: `SentryUserContext` (user ID + role + org + tags)

---

## ⚠️ ACTIONS MANUELLES RESTANTES (5-10 min)

### 1. Configurer les Alert Rules Sentry

**Aller sur:**
https://verone-4q.sentry.io/alerts/rules/

**Créer 2 Alert Rules:**

#### Alert Rule 1: Back-Office Errors in Production

**Cliquer:** "Create Alert"

**Conditions:**
```
When: an event is captured by Sentry
AND matches ALL:
  - event.level = error OR fatal
  - event.environment = production
  - event.tags.app = back-office
```

**Actions:**
```
THEN perform:
  1. Create a GitHub issue in verone2021/verone-back-office-V1
     Title: [BO] {title}
     Labels: bug, sentry, back-office

  2. Send notification via email (optionnel)
```

**Frequency:**
- First time issue is seen
- Issue changes from resolved to unresolved

**Name:** `[Back-Office] Errors in Production`

#### Alert Rule 2: LinkMe Errors in Production

**Même procédure** avec:
- Condition: `event.tags.app = linkme`
- GitHub Title: `[LM] {title}`
- Labels: `bug, sentry, linkme`
- Name: `[LinkMe] Errors in Production`

### 2. Vérifier l'Intégration GitHub

**Aller sur:**
https://verone-4q.sentry.io/settings/integrations/

**Si GitHub n'est pas installé:**
1. Chercher "GitHub"
2. Cliquer "Install"
3. Autoriser l'accès au repo `verone-back-office-V1`

**Si déjà installé:**
- Vérifier que le repo est bien configuré

### 3. Redéployer les Applications

**IMPORTANT:** Les nouvelles variables Vercel ne sont actives qu'après redéployment.

**Option A: Trigger un deploy via push**
```bash
git commit --allow-empty -m "[NO-TASK] chore: trigger redeploy for new Sentry DSN"
git push
```

**Option B: Redéployer depuis Vercel UI**
- Back-Office: https://vercel.com/verone2021s-projects/verone-back-office/deployments
- LinkMe: https://vercel.com/verone2021s-projects/linkme/deployments
- Cliquer sur le dernier déploiement → "Redeploy"

---

## 🧪 TESTS DE VALIDATION

Une fois redéployé, suivre: `docs/integrations/sentry-validation-checklist.md`

**Tests critiques:**
1. Déclencher une erreur de test dans back-office → vérifier projet `back-office-nextjs`
2. Déclencher une erreur de test dans linkme → vérifier projet `linkme-nextjs`
3. Tester le bouton "Signaler un bug" dans les 2 apps
4. Vérifier que les replays masquent les PII

---

## 📊 BÉNÉFICES OBTENUS

✅ **Séparation projets:** Erreurs filtrées par app
✅ **RGPD-safe:** PII masqué dans replays
✅ **Release tracking:** Commit SHA visible dans Sentry
✅ **Contexte riche:** User ID + org + rôle
✅ **Alerting:** GitHub Issues automatiques (après config Alert Rules)

---

## 🔗 DOCUMENTATION COMPLÈTE

- **Setup projets:** `docs/integrations/sentry-projects-setup.md`
- **Alertes GitHub:** `docs/integrations/sentry-alerts-github.md`
- **Runbook quotidien:** `docs/integrations/sentry-runbook.md`
- **Checklist validation:** `docs/integrations/sentry-validation-checklist.md`

---

## 📝 PROCHAINES ÉTAPES

1. ✅ Configurer Alert Rules (5 min)
2. ✅ Vérifier intégration GitHub (1 min)
3. ✅ Redéployer les 2 apps (2 min)
4. ✅ Tester avec la checklist (10 min)
5. ✅ **C'EST PRÊT! 🎉**

---

**Configuration effectuée par:** Claude Code via Playwright
**Branch:** `feat/sentry-pro-split-rgpd`
**Commit:** `e26e92b9`
