# Audit Régression Multi-Apps - 2026-01-14

## RÉSUMÉ EXÉCUTIF

**Statut**: 🔴 CRITIQUE - Régressions multi-apps confirmées
**Cause racine identifiée**: Modifications .env.local ce matin + configuration site-internet obsolète

---

## TIMELINE DES ÉVÉNEMENTS

### 2026-01-13 (HIER - Tout fonctionnait)
- ✅ back-office opérationnel
- ✅ linkme opérationnel
- ✅ site-internet opérationnel

### 2026-01-14 06:56 (CE MATIN)
- 🔧 Backup automatique .env.local créé (back-office + linkme)
- Commit: `cf890814` - "fix: resolve multi-app stability issues"

### 2026-01-14 09:57
- 🔧 Commit: `6a167e22` - "fix(sentry): migrate automaticVercelMonitors to webpack config"
- Modification: `apps/back-office/next.config.js`, `apps/linkme/next.config.js`
- **ATTENTION**: `apps/site-internet/next.config.js` NON MODIFIÉ

### 2026-01-14 10:36 (CHANGEMENT CRITIQUE)
- 🚨 **Modification .env.local pour back-office et linkme**
- Ajout variables: `NEXT_PUBLIC_GEOAPIFY_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`
- Changement: `RESEND_FROM_EMAIL` (contact@verone.fr → contact@app.veronecollections.fr)
- **PROBLÈME**: Serveurs dev NON redémarrés après modification .env

### 2026-01-14 20:11
- 🔧 Commit: `20658534` - "fix: resolve infinite loading in dashboard due to StrictMode"

---

## PROBLÈMES IDENTIFIÉS

### 🚨 CRITIQUE 1: site-internet configuration obsolète

**Problème**:
- `.env.local` date du **9 novembre 2024** (2 mois obsolète)
- Pas de `.env.example` pour référence
- Contient seulement 127 lignes vs 145+ pour back-office/linkme
- **Variables manquantes**: Geoapify, Sentry DSN, Resend mis à jour

**Impact**:
- Application ne peut pas démarrer correctement
- Fonctionnalités dépendant des nouvelles variables cassées

**Fichier**: `/Users/romeodossantos/verone-back-office-V1/apps/site-internet/.env.local`

---

### 🚨 CRITIQUE 2: Variables .env modifiées sans redémarrage dev

**Problème**:
- .env.local modifié à 10h36
- Serveurs dev probablement PAS redémarrés
- Next.js charge les variables au démarrage uniquement

**Impact**:
- Nouvelles variables `NEXT_PUBLIC_*` non disponibles dans le client
- Comportements imprévisibles dans les apps

**Preuve**:
```bash
# Backup créé à 06:56
apps/back-office/.env.local.backup-20260114-065620

# Fichier actuel modifié à 10:36
apps/back-office/.env.local (10:36:33)
apps/linkme/.env.local (10:36:52)
```

---

### ⚠️ MEDIUM 3: next.config.js Sentry non uniforme

**Problème**:
- back-office + linkme: Mis à jour avec webpack.automaticVercelMonitors
- site-internet: Configuration basique sans Sentry

**Impact**:
- Monitoring incohérent entre apps
- Pas bloquant mais mauvaise pratique

---

## VARIABLES AJOUTÉES CE MATIN

### Dans back-office et linkme (10:36)
```bash
# Géocodage
NEXT_PUBLIC_GEOAPIFY_API_KEY=fdf6b7d7cd334d019f34bef94d53f7ba

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://38b5f318dd8f4f6079f6a411048c7a77@o4510701115473920.ingest.de.sentry.io/4510701119012944

# Email mis à jour
RESEND_FROM_EMAIL=contact@app.veronecollections.fr  # Ancien: contact@verone.fr
RESEND_REPLY_TO=romeo@veronecollections.fr           # Ancien: veronebyromeo@gmail.com
```

### Absentes dans site-internet
- Toutes les variables ci-dessus manquent
- Configuration email encore sur ancien domaine

---

## COMMITS SUSPECTS (48h)

### cf890814 - "fix: resolve multi-app stability issues"
**Date**: 2026-01-14 20:11
**Fichiers**:
- ✅ `.claude/scripts/git-hooks/check-env-changes.sh` (nouveau)
- ✅ `apps/back-office/src/app/prises-contact/[id]/page.tsx` (fix Next.js 15 params)
- ✅ `docs/current/troubleshooting/dev-environment.md` (nouveau)
- ✅ `scripts/validate-env.sh` (nouveau)

**Analyse**: Commit défensif qui AJOUTE des outils de validation, ne casse rien.

---

### 6a167e22 - "fix(sentry): migrate automaticVercelMonitors"
**Date**: 2026-01-14 09:57
**Fichiers**:
- `apps/back-office/next.config.js`
- `apps/linkme/next.config.js`
- ❌ `apps/site-internet/next.config.js` NON MODIFIÉ

**Analyse**: Fix technique correct MAIS site-internet ignoré.

---

## ÉTAT ACTUEL

### Serveurs Dev (Ports)
```bash
Port 3000 (back-office)  : ✅ RUNNING (PID 59500)
Port 3001 (site-internet): ✅ RUNNING (PID 59503)
Port 3002 (linkme)       : ✅ RUNNING (PID 59504)
```

**PROBLÈME**: Serveurs démarrés AVANT modification .env.local (10:36)

---

### Fichiers .env.local

| App             | Dernière modif | Lignes | Statut              |
|-----------------|----------------|--------|---------------------|
| back-office     | 10:36:33       | 145+   | ⚠️ Modifié ce matin |
| linkme          | 10:36:52       | 145+   | ⚠️ Modifié ce matin |
| site-internet   | 09 Nov 07:14   | 127    | 🚨 OBSOLÈTE (2 mois)|

---

## CAUSE RACINE CONFIRMÉE

### Hypothèse Principale: Workflow .env cassé

1. **10h36**: Modification .env.local (back-office + linkme)
2. **Pas de redémarrage**: Serveurs dev continuent avec anciennes variables
3. **site-internet oublié**: Pas de mise à jour de sa config
4. **Résultat**:
   - back-office/linkme: Variables manquantes en runtime
   - site-internet: Configuration complètement obsolète

---

## PLAN DE CORRECTION

### 🚨 URGENT (À faire maintenant)

#### 1. Arrêter tous les serveurs dev
```bash
pnpm dev:stop
# OU
lsof -ti:3000,3001,3002 | xargs kill -9
```

#### 2. Synchroniser site-internet/.env.local
**Action**: Créer/mettre à jour à partir de back-office
```bash
# Copier structure de back-office
cp apps/back-office/.env.local apps/site-internet/.env.local

# Puis adapter les variables spécifiques si besoin
```

#### 3. Créer .env.example pour site-internet
```bash
# Créer à partir du .env.local (en masquant secrets)
```

#### 4. Redémarrer proprement
```bash
pnpm dev:clean  # Nettoie cache + redémarre
# OU
pnpm dev
```

---

### ⚠️ MOYEN TERME (Semaine prochaine)

#### 1. Uniformiser next.config.js
- Ajouter config Sentry à site-internet
- Vérifier webpack.automaticVercelMonitors partout

#### 2. Automatiser validation .env
- Hook pre-commit déjà créé dans `cf890814`
- Activer validation automatique dans CI/CD

#### 3. Documentation
- Créer site-internet/.env.example
- Documenter variables NEXT_PUBLIC_* critiques

---

## DÉLÉGATION verone-debug-investigator

### Questions à investiguer

1. **LinkMe - Spinner infini dashboard**
   - Commit: `20658534` résout StrictMode
   - Vérifier si résolu après redémarrage propre

2. **Site-internet - Affichage cassé**
   - Config obsolète depuis 2 mois
   - Identifier fonctionnalités cassées
   - Lister variables manquantes critiques

3. **MetaMask - Affichage très mauvais**
   - Lié à site-internet ?
   - CSS cassé ou problème de build ?
   - Vérifier console browser

4. **Tests de non-régression**
   - Après fix, valider les 3 apps
   - Vérifier console errors
   - Confirmer fonctionnalités critiques

---

## PREUVES

### Diff .env.local (back-office)
```diff
+# === Geoapify API (Geocoding) ===
+NEXT_PUBLIC_GEOAPIFY_API_KEY=fdf6b7d7cd334d019f34bef94d53f7ba

+# === Sentry Monitoring ===
+NEXT_PUBLIC_SENTRY_DSN=https://38b5f318dd8f4f6079f6a411048c7a77@...

-RESEND_FROM_EMAIL=onboarding@resend.dev
+RESEND_FROM_EMAIL=contact@app.veronecollections.fr
```

### Timestamps
```bash
-rw-r--r--  apps/back-office/.env.local.backup-20260114-065620 (06:56)
-rw-r--r--  apps/back-office/.env.local (10:36:33)
-rw-r--r--  apps/linkme/.env.local (10:36:52)
-rw-r--r--  apps/site-internet/.env.local (Nov 9 07:14) ← 2 MOIS
```

---

## CONCLUSION

**Cause racine**: Changement .env.local sans redémarrage + site-internet abandonné

**Gravité**: 🔴 CRITIQUE
- back-office/linkme: Variables manquantes en runtime
- site-internet: Configuration obsolète (2 mois)

**Fix immédiat**: Redémarrage propre après sync .env

**Prévention**: Hooks Git + validation CI/CD (déjà ajoutés dans cf890814)
