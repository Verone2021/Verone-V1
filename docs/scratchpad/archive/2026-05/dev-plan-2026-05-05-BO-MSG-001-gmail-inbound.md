# Dev Plan — BO-MSG-001 — Pipeline Gmail Inbound → Back-Office

**Date** : 2026-05-05
**Branche** : `feat/BO-MSG-001-gmail-inbound-pipeline`
**Sprint** : Bloc F du plan email infrastructure
**Estimation** : ~6h (gros sprint)

---

## Objectif

Stocker et consulter dans le back-office tous les emails reçus sur les groupes
`contact@veronecollections.fr`, `commandes@veronecollections.fr`,
`contact@linkme.network`, `commandes@linkme.network`.

Romeo et Imane doivent pouvoir consulter l'historique des emails depuis
l'interface back-office, avec filtres (marque, adresse, statut lu/non-lu,
date) et lien automatique vers la fiche commande quand un numéro de
commande est détecté dans le sujet ou le corps.

---

## Architecture

```
Email reçu (Gmail)
  ↓
Google Pub/Sub topic (gmail-inbound)
  ↓ push notification
POST /api/gmail/inbound (Next.js, back-office)
  ↓
Récupère le message via Gmail API (OAuth2 service account + délégation domaine)
  ↓
Parse subject/body, détecte numéro commande (regex VC-YYYY-NNNN ou SO-YYYY-NNNNN)
  ↓
INSERT email_messages (Supabase)
  ↓
Page /parametres/messagerie (back-office) — liste + filtres + détail
```

---

## Étapes (ordre d'exécution)

### Phase 1 — Setup Google Cloud (infra, sans code)

1. Créer ou réutiliser projet Google Cloud (lié à veronecollections.fr Workspace)
2. Activer **Gmail API**
3. Activer **Cloud Pub/Sub API**
4. Créer **Service Account** `gmail-inbound-reader@PROJECT.iam.gserviceaccount.com`
5. Générer clé JSON pour ce service account
6. Activer **Domain-Wide Delegation** sur ce service account
7. Dans Workspace Admin → Security → API Controls → Domain-wide Delegation,
   autoriser le client_id du service account avec scope
   `https://www.googleapis.com/auth/gmail.readonly`
8. Créer un **Pub/Sub Topic** `gmail-inbound`
9. Créer une **Pub/Sub Subscription** type push vers
   `https://verone-back-office.vercel.app/api/gmail/inbound`
10. Donner permission `gmail-api-push@system.gserviceaccount.com` →
    Publisher sur le topic
11. Pour chaque adresse à surveiller (4 groupes), faire un `users.watch()`
    qui pointe vers le topic Pub/Sub (à faire via le code une fois déployé)

### Phase 2 — Migration Supabase

Créer table `email_messages` :

```sql
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id TEXT UNIQUE NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('verone', 'linkme')),
  to_address TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT,
  subject TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMPTZ NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  linked_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  linked_order_number TEXT,
  has_attachments BOOLEAN NOT NULL DEFAULT false,
  raw_headers JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_messages_received_at ON email_messages(received_at DESC);
CREATE INDEX idx_email_messages_to_address ON email_messages(to_address);
CREATE INDEX idx_email_messages_linked_order ON email_messages(linked_order_id);
CREATE INDEX idx_email_messages_is_read ON email_messages(is_read) WHERE is_read = false;

ALTER TABLE email_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access" ON email_messages
  FOR ALL TO authenticated
  USING (is_backoffice_user());
```

Régénérer types Supabase après migration.

### Phase 3 — Endpoint Next.js

Créer `apps/back-office/src/app/api/gmail/inbound/route.ts` :

- POST handler
- Vérifier signature JWT du message Pub/Sub (token Google signé)
- Décoder payload : `{ emailAddress, historyId }`
- Appeler `users.history.list({ startHistoryId, historyTypes: ['messageAdded'] })`
- Pour chaque nouveau messageId : `users.messages.get(id, format: 'full')`
- Parser headers (From, To, Subject, Date)
- Détecter brand (verone vs linkme) selon `to_address`
- Extraire body text/html (parts MIME)
- Détecter numéro commande via regex
- Si trouvé → SELECT id FROM sales_orders WHERE order_number = ?
- INSERT email_messages
- Retour 200 OK

### Phase 4 — UI back-office

Créer `apps/back-office/src/app/(protected)/parametres/messagerie/page.tsx` :

- Pattern A (liste avec filtres toolbar)
- Colonnes : marque (badge), de, sujet, reçu le, lié à commande
- Filtres : marque, adresse destinataire, statut lu/non-lu, date range
- Click ligne → ouvrir détail (modal ou drawer) avec body html sanitized
- Bouton "Marquer lu/non-lu"
- Si `linked_order_id` → lien vers `/commandes/clients/[id]`

Server Component pour le fetch initial (50 derniers emails), client component
pour les filtres + interactions.

### Phase 5 — Lien automatique commandes

Regex dans l'endpoint :

```ts
const ORDER_REGEX = /(VC-\d{4}-\d{4,5}|SO-\d{4}-\d{5})/i;
const match = subject?.match(ORDER_REGEX) || body_text?.match(ORDER_REGEX);
```

Si match :

```sql
SELECT id FROM sales_orders WHERE order_number = ?
```

Stocker `linked_order_id` + `linked_order_number`.

Sur la fiche commande, afficher tab "Emails liés" qui liste les emails de
cette commande.

---

## Variables d'environnement à ajouter

Dans `apps/back-office/.env.local` (et Vercel) :

```
GMAIL_SERVICE_ACCOUNT_EMAIL=gmail-inbound-reader@PROJECT.iam.gserviceaccount.com
GMAIL_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GMAIL_PUBSUB_TOPIC=projects/PROJECT/topics/gmail-inbound
GMAIL_PUBSUB_VERIFICATION_TOKEN=<random secret>
GMAIL_WATCH_ADDRESSES=contact@veronecollections.fr,commandes@veronecollections.fr,contact@linkme.network,commandes@linkme.network
```

---

## Sécurité

- Endpoint `/api/gmail/inbound` doit vérifier la signature JWT Google
- Service account avec scope minimum `gmail.readonly`
- `body_html` doit être sanitized avant affichage (DOMPurify côté client)
- RLS : seul le staff back-office peut lire `email_messages`

---

## Tests à faire

1. Envoyer un email à `contact@veronecollections.fr` depuis Gmail externe
2. Vérifier qu'il apparaît dans `/parametres/messagerie` < 30s
3. Envoyer un email avec `VC-2026-0123` dans le sujet → vérifier lien commande
4. Tester filtres marque, lu/non-lu, date
5. Vérifier RLS : un user non-staff ne peut rien voir

---

## Sortie attendue

- Branche `feat/BO-MSG-001-gmail-inbound-pipeline` avec commits :
  - `[BO-MSG-001] feat: migration table email_messages`
  - `[BO-MSG-001] feat: endpoint Gmail inbound /api/gmail/inbound`
  - `[BO-MSG-001] feat: page back-office /parametres/messagerie`
  - `[BO-MSG-001] feat: lien automatique emails ↔ commandes`
- PR vers staging
- Documentation Google Cloud setup dans `docs/current/INFRA-GMAIL-INBOUND.md`
