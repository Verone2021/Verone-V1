# HANDOVER — Sprint BO-MSG-001 (Bloc F Pipeline Gmail Inbound)

**Date** : 2026-05-05 04h
**Branche** : `feat/BO-MSG-001-gmail-inbound-pipeline` (depuis staging)
**Pour** : Prochaine session Claude Code
**Plan complet** : `docs/scratchpad/dev-plan-2026-05-05-BO-MSG-001-gmail-inbound.md`

---

## CONTEXTE PROJET (à coller en début de discussion)

```
Bloc F du plan email infrastructure Verone : pipeline Gmail Inbound vers back-office.

Objectif : afficher dans /parametres/messagerie les emails reçus sur :
- contact@veronecollections.fr
- commandes@veronecollections.fr
- contact@linkme.network
- commandes@linkme.network

Architecture : Gmail watch → Pub/Sub → POST /api/gmail/inbound → INSERT email_messages → page back-office

Contexte précédent (session 2026-05-05) :
- Tous les blocs A/B/C/D/E sont DONE (groupes, send-as, DKIM/SPF/DMARC, Vercel, Resend, Postmaster Tools)
- Les redéploiements Vercel des 3 projets sont lancés à 03h36 — vérifier avant de tester

Continue la branche feat/BO-MSG-001-gmail-inbound-pipeline.
```

---

## ÉTAT D'AVANCEMENT À LA REPRISE

### ✅ Fait dans la session précédente

- Branche `feat/BO-MSG-001-gmail-inbound-pipeline` créée depuis `staging`
- Plan technique : `docs/scratchpad/dev-plan-2026-05-05-BO-MSG-001-gmail-inbound.md`
- Migration SQL : `supabase/migrations/20260505_bo_msg_001_email_messages.sql` (table `email_messages` + RLS staff)
- Sub-agent dev-agent lancé en background pour : endpoint, page UI, doc INFRA-GMAIL-INBOUND.md (vérifier le dev-report)

### ❓ À vérifier en début de session

1. État du dev-report : `docs/scratchpad/dev-report-2026-05-05-BO-MSG-001-gmail-inbound.md`
2. Commits sur la branche : `git log --oneline staging..HEAD`
3. État Pub/Sub API dans projet `make-gmail-integration-428317` (activation lancée à 04h01)
4. Type-check : `pnpm --filter @verone/back-office type-check`

### 🚧 Setup Google Cloud (à finir manuellement par Romeo dans la console)

Projet : `make-gmail-integration-428317` (nom : "Make Gmail Integration", déjà existant — vérifier qu'il est OK pour Romeo de le réutiliser)

Statut au moment du handover :

- ✅ Gmail API activée
- ✅ Pub/Sub API activée (vérifié à 04h02)
- ❌ Tout le reste à faire

**Pourquoi pas automatisé** : Google Cloud Console utilise des Material Web Components avec shadow DOM, Playwright n'arrive pas à interagir proprement avec les champs. gcloud CLI n'est pas installé. La console à la main est plus rapide.

### Étapes manuelles Google Cloud (10 min)

1. **Créer Service Account**
   - URL : https://console.cloud.google.com/iam-admin/serviceaccounts/create?project=make-gmail-integration-428317
   - Nom : `Gmail Inbound Reader`
   - ID : `gmail-inbound-reader`
   - Description : `Lecture des emails reçus sur les groupes contact@/commandes@ pour le pipeline back-office (BO-MSG-001)`
   - Cliquer "Créer et continuer"
   - Étape 2 (Autorisations) : aucun rôle nécessaire ici, cliquer "Continuer"
   - Étape 3 (Principaux avec accès) : laisser vide, cliquer "OK"

2. **Générer la clé JSON**
   - Cliquer sur le service account créé
   - Onglet "Clés" → "Ajouter une clé" → "Créer une clé"
   - Type : JSON → Créer
   - Le fichier `make-gmail-integration-428317-XXX.json` se télécharge
   - **Copier les valeurs `client_email` et `private_key` du JSON** dans Vercel env vars (back-office) :
     - `GMAIL_SERVICE_ACCOUNT_EMAIL` = client_email
     - `GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY` = private_key (avec les `\n` littéraux, pas réels)
   - **Récupérer aussi le `client_id`** du JSON, il sera nécessaire pour l'étape 4 (Domain-Wide Delegation)

3. **Activer Domain-Wide Delegation**
   - Sur le service account, onglet "Détails"
   - Section "Identifiants avancés" → cocher "Activer la délégation au niveau du domaine Google Workspace"
   - Saisir un nom OAuth : `Verone Gmail Inbound`
   - Sauvegarder

4. **Autoriser le client dans Workspace Admin**
   - URL : https://admin.google.com/ac/owl/domainwidedelegation
   - Cliquer "Ajouter" → coller le `client_id` du service account
   - Scopes OAuth : `https://www.googleapis.com/auth/gmail.readonly`
   - Autoriser

5. **Créer le Topic Pub/Sub**
   - URL : https://console.cloud.google.com/cloudpubsub/topic/list?project=make-gmail-integration-428317
   - Cliquer "Créer un sujet"
   - ID : `gmail-inbound`
   - Cocher "Ajouter un abonnement par défaut" : DÉCOCHER (on en crée un personnalisé après)
   - Créer

6. **Donner permission au compte Gmail Push**
   - Sur le topic `gmail-inbound` → Onglet "Autorisations" (ou bouton "Ajouter un compte principal")
   - Compte principal : `serviceAccount:gmail-api-push@system.gserviceaccount.com`
   - Rôle : `Pub/Sub Publisher` (Éditeur Pub/Sub)
   - Sauvegarder

7. **Créer la Subscription push**
   - Sur le topic `gmail-inbound` → "Créer un abonnement"
   - ID : `gmail-inbound-push`
   - Type de livraison : **Push**
   - URL endpoint : `https://verone-back-office.vercel.app/api/gmail/inbound`
   - Authentication : "Activer l'authentification" → service account dédié
   - Audience : laisser vide ou l'URL endpoint
   - Délai d'accusé de réception : 60s
   - Stratégie de retry : exponentiel (10s → 600s)
   - Créer

8. **Variables Vercel à ajouter** (back-office uniquement)
   - URL : https://vercel.com/verone2021s-projects/verone-back-office/settings/environment-variables
   - `GMAIL_SERVICE_ACCOUNT_EMAIL` = client_email du JSON
   - `GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY` = private_key du JSON (mettre les `\n` en littéral)
   - `GMAIL_PUBSUB_TOPIC` = `projects/make-gmail-integration-428317/topics/gmail-inbound`
   - `GMAIL_PUBSUB_VERIFICATION_TOKEN` = générer 32 caractères random (ex: `openssl rand -hex 16`)
   - `GMAIL_WATCH_ADDRESSES` = `contact@veronecollections.fr,commandes@veronecollections.fr,contact@linkme.network,commandes@linkme.network`
   - Redéployer le projet

9. **Lancer les `users.watch()` initiaux**
   - Une fois l'endpoint déployé, créer un script one-shot `scripts/gmail-watch-setup.ts` (ou route admin temporaire)
   - Pour chaque adresse cible, appeler :
     ```ts
     gmail.users.watch({
       userId: address,
       requestBody: {
         topicName:
           'projects/make-gmail-integration-428317/topics/gmail-inbound',
         labelIds: ['INBOX'],
       },
     });
     ```
   - Ces `watch()` expirent au bout de 7 jours → refresh via cron Vercel (à créer plus tard)

### 📋 Variables d'env à ajouter (back-office uniquement)

À ajouter dans `apps/back-office/.env.local` ET dans Vercel projet `verone-back-office` :

```
GMAIL_SERVICE_ACCOUNT_EMAIL=gmail-inbound-reader@make-gmail-integration-428317.iam.gserviceaccount.com
GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
GMAIL_PUBSUB_TOPIC=projects/make-gmail-integration-428317/topics/gmail-inbound
GMAIL_PUBSUB_VERIFICATION_TOKEN=<générer un random 32 chars>
GMAIL_WATCH_ADDRESSES=contact@veronecollections.fr,commandes@veronecollections.fr,contact@linkme.network,commandes@linkme.network
```

---

## CHECKLIST AVANT MERGE

- [ ] Migration appliquée sur Supabase prod (Roméo doit confirmer)
- [ ] `pnpm run generate:types` après migration
- [ ] Type-check vert
- [ ] Build vert
- [ ] Service account créé + clé téléchargée
- [ ] Domain-Wide Delegation OK avec scope `https://www.googleapis.com/auth/gmail.readonly`
- [ ] Topic Pub/Sub créé + permission donnée à gmail-api-push
- [ ] Subscription push créée vers prod
- [ ] Watch lancé pour les 4 adresses
- [ ] Test E2E : envoyer email à contact@veronecollections.fr depuis Gmail externe → apparaît dans /parametres/messagerie en moins de 30s
- [ ] Test détection commande : sujet contenant `VC-2026-0123` → email lié à la commande
- [ ] Reviewer-agent PASS
- [ ] PR vers staging (pas main)

---

## RAPPELS RÈGLES IMPORTANTES (à garder en tête)

- **Branche** : on est sur `feat/BO-MSG-001-gmail-inbound-pipeline`, on PR vers staging (jamais main)
- **Workflow solo** : pas de worktree, juste `git checkout` (cf. `.claude/rules/no-worktree-solo.md`)
- **Code standards** : zero `any`, fichier > 400 lignes décompose, RLS staff via `is_backoffice_user()`
- **Communication** : Romeo travaille de nuit, ne JAMAIS proposer "va dormir" / "à demain" / "on s'arrête"
- **Auth credentials** : Romeo saisit lui-même TOUS les passwords dans le navigateur, ne PAS lui demander de coller en chat
- **Re-auth Google** : Admin Console et GCP demandent re-auth régulièrement → ouvrir la page, attendre la saisie

---

## SI BLOQUÉ

Lire d'abord :

1. `docs/scratchpad/dev-plan-2026-05-05-BO-MSG-001-gmail-inbound.md` — plan complet
2. `docs/scratchpad/dev-report-2026-05-05-BO-MSG-001-gmail-inbound.md` — ce que le sub-agent a fait (si présent)
3. `docs/current/INFRA-GMAIL-INBOUND.md` — guide Google Cloud (si créé par sub-agent)

Ensuite demander à Romeo le contexte spécifique manquant.
