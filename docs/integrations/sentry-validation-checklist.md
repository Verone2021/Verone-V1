# Checklist de Validation Sentry

**Date** : 2026-01-15
**Objectif** : Valider que la configuration Sentry Pro fonctionne correctement

---

## ⚙️ Pré-requis

Avant de commencer les tests, s'assurer que:

- [ ] Les projets Sentry `back-office-nextjs` et `linkme-nextjs` sont créés
- [ ] Les DSN sont configurés dans `.env.local` des 2 apps
- [ ] Les variables Vercel sont configurées (NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, etc.)
- [ ] Le code est déployé en **preview** (pas production pour les tests!)

---

## 🧪 Phase 6.1: Tests Séparation des Projets

### Back-Office

1. [ ] **Déclencher une erreur de test:**
   - Créer un fichier `/app/test-sentry/page.tsx`:
     ```typescript
     'use client';
     import * as Sentry from '@sentry/nextjs';

     export default function TestSentryPage() {
       const triggerError = () => {
         Sentry.captureException(new Error('[TEST] Back-Office Error'));
       };

       return (
         <div className="p-8">
           <button
             onClick={triggerError}
             className="px-4 py-2 bg-red-500 text-white rounded"
           >
             Test Sentry
           </button>
         </div>
       );
     }
     ```
   - Naviguer vers `/test-sentry`
   - Cliquer sur le bouton

2. [ ] **Vérifier dans Sentry:**
   - Aller sur https://verone-4q.sentry.io/projects/back-office-nextjs/
   - L'erreur `[TEST] Back-Office Error` apparaît
   - Tag `app: back-office` présent
   - Tag `environment: preview` (ou `production` selon où vous testez)
   - Release avec commit SHA présent

3. [ ] **Capture d'écran:**
   - Prendre une capture de l'erreur dans Sentry
   - Sauvegarder dans `.claude/work/screenshots/sentry-test-back-office.png`

### LinkMe

1. [ ] **Déclencher une erreur de test:**
   - Créer un fichier `/app/test-sentry/page.tsx` dans linkme
   - Même code que ci-dessus, mais message: `[TEST] LinkMe Error`
   - Naviguer vers `/test-sentry`
   - Cliquer sur le bouton

2. [ ] **Vérifier dans Sentry:**
   - Aller sur https://verone-4q.sentry.io/projects/linkme-nextjs/
   - L'erreur `[TEST] LinkMe Error` apparaît
   - Tag `app: linkme` présent
   - Tag `environment: preview`
   - Release avec commit SHA présent

3. [ ] **Capture d'écran:**
   - Prendre une capture de l'erreur dans Sentry
   - Sauvegarder dans `.claude/work/screenshots/sentry-test-linkme.png`

### Validation Séparation

- [ ] Les 2 erreurs sont dans des **projets séparés** (pas de mélange)
- [ ] Chaque erreur a le bon tag `app`
- [ ] Les releases sont trackées avec commit SHA

---

## 🧪 Phase 6.2: Tests RGPD (Replay)

### Back-Office

1. [ ] **Déclencher une erreur avec données sensibles:**
   - Créer une page de test avec un formulaire:
     ```typescript
     'use client';
     import * as Sentry from '@sentry/nextjs';

     export default function TestReplayPage() {
       const triggerError = () => {
         Sentry.captureException(new Error('[TEST] Form Error'));
       };

       return (
         <form className="p-8 space-y-4">
           <input
             type="email"
             name="email"
             placeholder="email@test.com"
             className="border p-2"
           />
           <input
             type="tel"
             name="phone"
             placeholder="+33612345678"
             className="border p-2"
           />
           <input
             type="text"
             value="Données sensibles: Nom Prénom"
             className="border p-2"
           />
           <button
             type="button"
             onClick={triggerError}
             className="px-4 py-2 bg-red-500 text-white rounded"
           >
             Trigger Error
           </button>
         </form>
       );
     }
     ```
   - Remplir le formulaire avec des données fictives
   - Cliquer sur "Trigger Error"

2. [ ] **Vérifier le Replay dans Sentry:**
   - Ouvrir l'erreur dans Sentry
   - Cliquer sur "Replay" dans la sidebar
   - Lancer la vidéo

3. [ ] **Validation RGPD:**
   - [ ] Email est **masqué** (****)
   - [ ] Téléphone est **masqué** (****)
   - [ ] Texte "Données sensibles" est **masqué** (****)
   - [ ] Structure de la page est **visible**
   - [ ] Bouton "Trigger Error" est **visible**

4. [ ] **Capture d'écran:**
   - Prendre une capture du Replay avec texte masqué
   - Sauvegarder dans `.claude/work/screenshots/sentry-replay-rgpd.png`

### LinkMe

- [ ] Répéter les mêmes tests sur LinkMe
- [ ] Vérifier que les replays sont RGPD-safe

---

## 🧪 Phase 6.3: Tests Releases & Sourcemaps

### Vérifier Upload Sourcemaps

1. [ ] **Déclencher une build:**
   ```bash
   cd apps/back-office
   npm run build
   ```

2. [ ] **Vérifier les logs:**
   - Chercher `[Sentry Webpack Plugin]` dans les logs
   - Doit afficher: `Uploading sourcemaps...`
   - Doit afficher: `✓ Sourcemaps uploaded successfully`

3. [ ] **Vérifier dans Sentry:**
   - Aller sur https://verone-4q.sentry.io/settings/projects/back-office-nextjs/source-maps/
   - Les sourcemaps de la dernière release sont présents
   - Release name = commit SHA

4. [ ] **Capture d'écran:**
   - Prendre une capture de la liste des sourcemaps
   - Sauvegarder dans `.claude/work/screenshots/sentry-sourcemaps.png`

### Vérifier Stack Traces

1. [ ] **Déclencher une erreur:**
   - Utiliser la page de test `/test-sentry`
   - Cliquer sur "Test Sentry"

2. [ ] **Vérifier la stack trace:**
   - Ouvrir l'erreur dans Sentry
   - La stack trace doit afficher:
     - Noms de fichiers **LISIBLES** (pas minifiés)
     - Numéros de lignes **CORRECTS**
     - Code source autour de l'erreur

3. [ ] **Validation:**
   - [ ] Stack trace est **lisible**
   - [ ] Fichiers sont **identifiés**
   - [ ] Lignes de code sont **affichées**

---

## 🧪 Phase 6.4: Tests Contexte Utilisateur

### Back-Office

1. [ ] **Se connecter** à l'application back-office
2. [ ] **Déclencher une erreur** (page de test)
3. [ ] **Vérifier dans Sentry:**
   - [ ] `user.id` est présent
   - [ ] Tag `app: back-office` présent
   - [ ] Context `back-office` présent

### LinkMe

1. [ ] **Se connecter** à LinkMe
2. [ ] **Déclencher une erreur** (page de test)
3. [ ] **Vérifier dans Sentry:**
   - [ ] `user.id` est présent
   - [ ] Tag `app: linkme` présent
   - [ ] Tag `role: <role>` présent
   - [ ] Tag `organisation_id: <org_id>` présent (si applicable)
   - [ ] Context `linkme` avec `organisation_id`, `role_name`, etc.

4. [ ] **Capture d'écran:**
   - Prendre une capture du contexte utilisateur dans Sentry
   - Sauvegarder dans `.claude/work/screenshots/sentry-user-context.png`

---

## 🧪 Phase 6.5: Tests Feedback Button

### Back-Office

1. [ ] **Vérifier présence du bouton:**
   - Naviguer vers n'importe quelle page
   - Le bouton "Signaler un bug" doit être visible en bas à droite

2. [ ] **Tester le formulaire:**
   - Cliquer sur "Signaler un bug"
   - Formulaire s'ouvre avec:
     - [ ] Titre: "Signaler un problème"
     - [ ] Placeholder: "Décrivez le problème rencontré..."
     - [ ] Bouton: "Envoyer"
   - Remplir le formulaire
   - Cliquer "Envoyer"

3. [ ] **Vérifier dans Sentry:**
   - Aller sur https://verone-4q.sentry.io/feedback/
   - Le feedback est présent
   - Message est visible
   - User ID est attaché
   - Replay link est attaché

4. [ ] **Capture d'écran:**
   - Prendre une capture du formulaire feedback
   - Sauvegarder dans `.claude/work/screenshots/sentry-feedback-form.png`

### LinkMe

- [ ] Répéter les mêmes tests sur LinkMe

---

## ✅ Résumé de Validation

### Checklist Globale

- [ ] **Séparation projets:** Back-Office et LinkMe ont des projets Sentry distincts
- [ ] **RGPD:** Tous les replays masquent les PII (email, phone, text)
- [ ] **Releases:** Sourcemaps uploadés et stack traces lisibles
- [ ] **Contexte:** User ID + tags app/role/org_id présents
- [ ] **Feedback:** Bouton visible et fonctionnel dans les 2 apps

### Screenshots Collectés

- [ ] `sentry-test-back-office.png` - Erreur dans projet back-office
- [ ] `sentry-test-linkme.png` - Erreur dans projet linkme
- [ ] `sentry-replay-rgpd.png` - Replay avec PII masqué
- [ ] `sentry-sourcemaps.png` - Liste des sourcemaps
- [ ] `sentry-user-context.png` - Contexte utilisateur dans Sentry
- [ ] `sentry-feedback-form.png` - Formulaire feedback

### Prochaines Étapes

Si tous les tests passent:
1. [ ] Supprimer les pages de test `/test-sentry`
2. [ ] Créer la PR avec les screenshots
3. [ ] Déployer en production
4. [ ] Configurer les Alert Rules (docs/integrations/sentry-alerts-github.md)

---

**Note** : Ces tests doivent être effectués en **preview** avant de merger en production.
