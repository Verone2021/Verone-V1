# Plan — BO-MSG-017 : Suppression des doublons mail + révocation scope Gmail.send

**Date** : 2026-05-06
**Branche** : `fix/BO-MSG-017-suppression-doublons-mail` (depuis staging à jour après merge #929)
**PR cible** : staging
**Phase du plan global** : Phase 1 (cf. audit `audit-2026-05-06-bo-msg-refonte-erreurs.md`)

## Objectif

Retirer le code introduit par la session BO-MSG-010A/B + BO-MSG-014 phase 2 qui duplique des modals d'envoi déjà existants (SendDocumentEmailModal, SendConsultationEmailModal, SendInfoRequestDialog) et qui n'est utilisé par aucun workflow réel.

Ne rien casser des fonctions Gmail inbound (BO-MSG-001 à 011) ni des routes Resend existantes.

## Scope

### Fichiers à supprimer entièrement (4)

1. `apps/back-office/src/app/(protected)/parametres/messagerie/ComposeMailModal.tsx` (494 lignes)
2. `apps/back-office/src/app/(protected)/parametres/messagerie/compose-helpers.ts` (62 lignes)
3. `apps/back-office/src/app/api/gmail/send/route.ts` (146 lignes)
4. `apps/back-office/src/app/(protected)/parametres/emails/nouveau/page.tsx` (365 lignes)
   → supprimer aussi le dossier `nouveau/`

### Fichiers à modifier (6)

5. `apps/back-office/src/app/(protected)/parametres/messagerie/MessagerieClient.tsx`
   - Retirer `import { ComposeMailModal }`
   - Retirer state `composeOpen`, `composeReplyTo`
   - Retirer handlers `handleOpenCompose`, `handleReply`, `handleCloseCompose`
   - Retirer `primaryAction` (bouton « Composer ») dans `<ResponsiveToolbar>`
   - Retirer `<ComposeMailModal />` à la fin du return
   - Retirer `onReply={handleReply}` du `<EmailDetailDrawer>`
   - Retirer `Mail` de l'import lucide si plus utilisé

6. `apps/back-office/src/app/(protected)/parametres/messagerie/EmailDetailDrawer.tsx`
   - Retirer prop `onReply`
   - Retirer handler `handleReply`
   - Retirer le bloc `{onReply && (<button>...Répondre)}` (lignes 146-154)
   - Retirer `Mail` de l'import lucide si plus utilisé

7. `packages/@verone/integrations/src/gmail/client.ts`
   - Retirer import `createGmailSendJwtClient`
   - Retirer fonctions `encodeMimeHeader`, `toBase64Url`, `buildMimeMessage`, `stripHtml`
   - Retirer types `SendMessageOptions`, `SendMessageResult`
   - Retirer fonction `sendMessage`
   - Garder `startWatch`, `startWatchAll`, `fetchNewMessages` (utilisés par inbound + cron)

8. `packages/@verone/integrations/src/gmail/auth.ts`
   - Retirer import `GMAIL_SEND_SCOPES`
   - Retirer fonction `createGmailSendJwtClient`
   - Garder `createGmailJwtClient` (utilisé par inbound)

9. `packages/@verone/integrations/src/gmail/config.ts`
   - Retirer export `GMAIL_SEND_SCOPES`
   - Garder `GMAIL_SCOPES`, helpers env vars, `detectBrand`, `ORDER_REGEX`

10. `apps/back-office/src/app/(protected)/parametres/emails/page.tsx`
    - Retirer le bouton « Nouveau template » qui pointe vers `/parametres/emails/nouveau` (route supprimée)
    - Garder le reste : liste, recherche, filtres, boutons Aperçu/Éditer/Supprimer (CRUD lecture/édition restent valides)

### Fichiers à NE PAS toucher

- `apps/back-office/src/app/(protected)/parametres/emails/[slug]/edit/page.tsx` — fichier préexistant enrichi par BO-MSG-014 phase 2. Risque de casse en revertant. Laisser tel quel ; les colonnes ajoutées (`brand`, `default_alias`, `body_text`, `tags`) restent en DB et le code les lit/écrit correctement.
- Migration `20260506_002_bo_msg_014_email_templates.sql` — append-only, pas modifiable. Colonnes restent dormantes en DB.
- Tout le pipeline Gmail inbound (BO-MSG-001/007/008/011) — fonctionne, ne pas y toucher.
- Cron `vercel.json` BO-MSG-011 — utile, garder.

## Action externe (après merge PR)

- **Révoquer le scope `gmail.send`** côté Google Workspace admin :
  - admin.google.com → Sécurité → API controls → Domain-Wide Delegation
  - Modifier la ligne du client_id `109800338304327983410` (Vérone Collections)
  - Retirer `https://www.googleapis.com/auth/gmail.send` des scopes autorisés
  - Garder `https://www.googleapis.com/auth/gmail.readonly`
  - Autoriser

À faire **après** merge de la PR (sinon route `/api/gmail/send` plante avec 401 sur staging si quelqu'un teste).

## Vérification post-changement

1. `pnpm --filter @verone/back-office type-check` doit passer
2. `pnpm --filter @verone/integrations build` doit passer
3. Recherche `grep -r "ComposeMailModal\|/api/gmail/send\|createGmailSendJwtClient\|GMAIL_SEND_SCOPES\|sendMessage" apps packages` — 0 résultat hors `dist/` et `node_modules`
4. Page `/parametres/messagerie` charge sans erreur, plus de bouton Composer ni Répondre
5. Page `/parametres/emails` charge, plus de bouton « Nouveau template »
6. Pipeline Gmail inbound continue (test : envoyer un mail vers `contact@veronecollections.fr`, vérifier qu'il apparaît)

## Ordre d'exécution

1. Créer branche `fix/BO-MSG-017-suppression-doublons-mail`
2. Suppression fichiers entiers (1-4)
3. Modifications fichiers (5-10)
4. Type-check local
5. Commit + push (1 seul commit)
6. PR vers staging
7. CI verte → merge --squash auto
8. Révocation scope Gmail.send côté Workspace via Playwright MCP

## Dépendances

- Bloque par : merge PR #929 (Phase 0) — sinon merge conflict garantis sur `MessagerieClient.tsx`

## Risques

- **Faible** : code introduit la veille, jamais utilisé en prod (main n'a pas reçu le merge).
- Risque type-check si une référence orpheline traîne — détectée par CI.
- Aucune migration DB. Aucun trigger touché. Aucune route Qonto touchée.
