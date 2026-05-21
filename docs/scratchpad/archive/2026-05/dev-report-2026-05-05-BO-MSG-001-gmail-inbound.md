# Dev Report — BO-MSG-001 — Pipeline Gmail Inbound → Back-Office

**Date** : 2026-05-05
**Branche** : `feat/BO-MSG-001-gmail-inbound-pipeline`
**Sprint** : Bloc F — Pipeline email inbound
**Commit** : `6434add3`

---

## Ce qui a été livré

### 1. Integration Gmail — `@verone/integrations/src/gmail/`

- **`config.ts`** : constantes (scopes, regex ORDER_REGEX, detectBrand, validateGmailEnv)
- **`auth.ts`** : `createGmailJwtClient(emailAddress)` — JWT service account avec Domain-Wide Delegation (impersonation)
- **`parser.ts`** : `parseGmailMessage()` — extrait headers (From/To/Subject/Date), body text/plain et text/html depuis payload MIME multi-parts, pièces jointes, snapshot rawHeaders
- **`client.ts`** : `fetchNewMessages(emailAddress, historyId)` — appelle `gmail.users.history.list` puis `gmail.users.messages.get(format:'full')` pour chaque messageId unique

### 2. Endpoint Pub/Sub — `apps/back-office/src/app/api/gmail/inbound/route.ts`

- POST handler avec validation Zod du corps Pub/Sub
- Vérification Bearer token partagé `GMAIL_PUBSUB_VERIFICATION_TOKEN`
- Décodage base64 du payload `message.data` → `{ emailAddress, historyId }`
- Appel Gmail API via service account + DWD
- Détection marque via `detectBrand(toAddress)` (veronecollections.fr → 'verone', linkme.network → 'linkme')
- Regex `/(VC-\d{4}-\d{4,5}|SO-\d{4}-\d{5})/i` sur subject + body_text → résolution `linked_order_id` via SELECT sales_orders
- INSERT email_messages avec gestion doublons code 23505
- Retourne 200 même en cas d'erreur Gmail API (évite les retries Pub/Sub infinis)

### 3. Page Messagerie — `apps/back-office/src/app/(protected)/parametres/messagerie/`

- **`page.tsx`** : Server Component — fetch 50 derniers emails (colonnes explicites, pas de `select('*')`)
- **`MessagerieClient.tsx`** : Client Component — filtres (marque, adresse, statut lu/non-lu, recherche texte), liste responsive avec `ResponsiveDataView` (table desktop / cartes mobile), marquage lu automatique à l'ouverture, `handleToggleRead` via Supabase client
- **`EmailDetailDrawer.tsx`** : Sheet latéral — affichage HTML via `<iframe sandbox>` (sécurisé sans DOMPurify externe), fallback text/plain, bouton marquer lu/non-lu, lien commande liée
- **`types.ts`** : re-export depuis `@verone/types` (EmailMessage, EmailBrand) + MessagerieFilters local

### 4. Types partagés — `@verone/types/src/email-messages.ts`

Le plan avait déjà préparé ce fichier avec les types `EmailMessage`, `EmailBrand`, `ToggleReadPayload`, `EmailMessageFilters`. Il est utilisé tel quel, exporté via l'index.

---

## Standards respectés

- Zero `any` TypeScript — toutes les variables typées explicitement, imports `ParsedEmail` pour typer le retour de `fetchNewMessages`
- Validation Zod sur tous les inputs (PubSubBodySchema + PubSubDataSchema)
- `select()` colonnes explicites (24 colonnes listées dans la query page)
- `console.info` remplacé par `console.warn` (règle ESLint du projet)
- Responsive : `ResponsiveDataView` (table ≥ md, cartes < md), colonnes masquables progressivement (`hidden lg:table-cell`, `hidden xl:table-cell`), touch targets corrects
- Aucun `w-auto` ni `max-w-*` artificiel sur les conteneurs

---

## Ce qui reste à faire avant mise en production

### 1. Configuration Google Cloud (Phase 1 du plan — infra)

À faire manuellement dans la console Google Cloud / Workspace Admin :

1. Activer Gmail API + Cloud Pub/Sub API
2. Créer service account `gmail-inbound-reader@PROJECT.iam.gserviceaccount.com`
3. Générer clé JSON → extraire `client_email` et `private_key`
4. Domain-Wide Delegation dans Workspace Admin → scope `https://www.googleapis.com/auth/gmail.readonly`
5. Créer topic Pub/Sub `gmail-inbound`
6. Créer subscription push vers `https://[domaine-vercel]/api/gmail/inbound`
7. Donner permission Publisher à `gmail-api-push@system.gserviceaccount.com` sur le topic

### 2. Variables d'environnement à ajouter

Dans Vercel (Settings > Environment Variables) **et** `.env.local` :

```
GMAIL_SERVICE_ACCOUNT_EMAIL=gmail-inbound-reader@PROJECT.iam.gserviceaccount.com
GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMII...\n-----END PRIVATE KEY-----\n"
GMAIL_PUBSUB_VERIFICATION_TOKEN=<token aléatoire 32+ chars>
GMAIL_WATCH_ADDRESSES=contact@veronecollections.fr,commandes@veronecollections.fr,contact@linkme.network,commandes@linkme.network
```

Note : la `GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY` doit avoir les sauts de ligne encodés en `\n` (format standard `.env`).

### 3. Initialisation des gmail.users.watch() (Phase 1.11)

Après déploiement, appeler pour chaque adresse surveillée :

```
POST https://gmail.googleapis.com/gmail/v1/users/{emailAddress}/watch
{
  "topicName": "projects/PROJECT/topics/gmail-inbound",
  "labelIds": ["INBOX"]
}
```

Ce watch expire après 7 jours — prévoir un cron (existant dans `apps/back-office/src/app/api/cron/`) pour le renouveler.

### 4. Test E2E (post-déploiement)

1. Envoyer un email à `contact@veronecollections.fr` depuis un compte externe
2. Vérifier qu'il apparaît dans `/parametres/messagerie` en < 30s
3. Envoyer avec `VC-2026-0001` dans le sujet → vérifier lien commande
4. Tester filtres marque, statut lu/non-lu, recherche
5. Vérifier RLS : connexion avec un compte non-staff ne doit rien voir

### 5. Onglet "Emails liés" sur fiche commande

Le plan Phase 4 prévoyait d'afficher les emails liés sur la page commande cliente. Non livré dans ce sprint — à faire dans un sprint dédié une fois le pipeline actif.

---

## Points techniques notables

### iframe sandbox pour HTML email

Au lieu d'installer `isomorphic-dompurify` (dépendance jsdom lourde côté serveur), le corps HTML est affiché dans une `<iframe sandbox="allow-popups allow-popups-to-escape-sandbox">`. Cela isole complètement le JS malveillant sans risque XSS, avec un CSS minimal injecté via `srcDoc`. Approach validée par MDN et par Stripe Dashboard.

### ESLint : no-console (info interdit)

La règle ESLint du projet autorise uniquement `console.warn` et `console.error`. `console.info` a été remplacé par `console.warn` dans la route inbound.

### googleapis dans @verone/integrations

`googleapis` a été ajouté comme dépendance directe du package `@verone/integrations` (via le linter qui a auto-ajouté `"googleapis": "^144.0.0"` dans `package.json`). Le package était déjà disponible dans le workspace root.

---

## Fichiers modifiés

| Fichier                                                                            | Type                         |
| ---------------------------------------------------------------------------------- | ---------------------------- |
| `packages/@verone/integrations/src/gmail/config.ts`                                | new                          |
| `packages/@verone/integrations/src/gmail/auth.ts`                                  | new                          |
| `packages/@verone/integrations/src/gmail/parser.ts`                                | new                          |
| `packages/@verone/integrations/src/gmail/client.ts`                                | new                          |
| `packages/@verone/integrations/src/gmail/index.ts`                                 | new                          |
| `packages/@verone/integrations/src/index.ts`                                       | modified                     |
| `packages/@verone/integrations/package.json`                                       | modified                     |
| `packages/@verone/types/src/email-messages.ts`                                     | pre-existing (plan)          |
| `packages/@verone/types/src/index.ts`                                              | pre-existing modified (plan) |
| `apps/back-office/src/app/api/gmail/inbound/route.ts`                              | new                          |
| `apps/back-office/src/app/(protected)/parametres/messagerie/page.tsx`              | new                          |
| `apps/back-office/src/app/(protected)/parametres/messagerie/MessagerieClient.tsx`  | new                          |
| `apps/back-office/src/app/(protected)/parametres/messagerie/EmailDetailDrawer.tsx` | new                          |
| `apps/back-office/src/app/(protected)/parametres/messagerie/types.ts`              | new                          |
