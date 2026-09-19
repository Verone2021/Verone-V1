# Trousseau des routes API — quelle porte, quelle serrure

**Source de vérité unique** pour la protection des routes API des trois applications.
À relire avant d'ajouter une route, avant d'en supprimer une, et avant tout audit de sécurité.

**Dernière mise à jour** : 2026-09-19 — sprint `[BO-SEC-MW-001]` (verrou général).
Sprint précédent : `[BO-SEC-GUARD-001]` (8 portes de lecture, 2026-09-18).
**Règle associée** : `.claude/rules/api-guards.md`. **Décision** : `.claude/DECISIONS.md`.

---

## 1. Pourquoi ce document existe

Le 18/09/2026, une vérification depuis Internet, **sans aucune connexion**, a renvoyé :

| Adresse appelée en production                      | Réponse                          | Contenu                                                                         |
| -------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `/api/qonto/invoices`                              | **200**                          | 41 factures : nom du client, e-mail de contact, montants, lien PDF              |
| `/api/qonto/quotes`                                | **200**                          | 27 Ko de devis                                                                  |
| `/api/packlink/shipments/pending`                  | **200**                          | expéditions en cours                                                            |
| `/api/sales-orders/<identifiant>/customer-address` | **404 « Commande introuvable »** | preuve qu'aucune authentification n'était demandée : la requête partait en base |

### La cause, en une phrase

**Le back-office n'a pas de `middleware.ts`.** Sa protection vient uniquement de
`apps/back-office/src/app/(protected)/layout.tsx`, qui couvre les **pages** — jamais
`src/app/api/**`. Les pages sont fermées à clé, les routes API ne le sont pas.

C'est la différence entre la porte d'entrée et la fenêtre de derrière : elles donnent sur
le même bureau, mais une seule était verrouillée.

LinkMe, lui, **a** un `middleware.ts` qui refuse par défaut et déclare une liste blanche
explicite. C'est le modèle à copier.

---

## 2. Les trois serrures disponibles

| Serrure                           | Quand                                        | Où                                                            |
| --------------------------------- | -------------------------------------------- | ------------------------------------------------------------- |
| `requireBackofficeAdmin(request)` | route appelée depuis un écran du back-office | `apps/back-office/src/lib/guards/require-backoffice-admin.ts` |
| Secret de tâche planifiée         | route appelée par un cron Vercel             | `CRON_SECRET` en en-tête `Authorization: Bearer`              |
| Signature de webhook              | route appelée par un service extérieur       | signature vérifiée **sans dégradation possible**              |

### `requireBackofficeAdmin` — le motif exact

```ts
const guardResult = await requireBackofficeAdmin(request);
if (guardResult instanceof NextResponse) {
  return guardResult;
}
```

Elle renvoie **401** sans session, **403** si le rôle n'est ni `owner` ni `admin`
(lecture de `user_app_roles` filtrée sur `user_id`, `app = 'back-office'`, `is_active = true`).

Quand la route déclare un type de réponse étroit, on renvoie le même code dans **sa** forme
plutôt que de propager la réponse de la garde — pour ne pas élargir son contrat de sortie :

```ts
if (guardResult instanceof NextResponse) {
  return NextResponse.json(
    { success: false, error: 'Acces refuse' },
    { status: guardResult.status }
  );
}
```

---

## 3. Comment lire l'inventaire ci-dessous

- **Serrure** = présence d'un appel de garde **dans le fichier**, relevée automatiquement
  (`scripts` de l'audit du 18/09). Cette colonne dit qu'une garde est **présente**.
  Elle ne prouve pas qu'elle est **branchée** : voir le § 5.
- **Écrit en base** = le fichier contient un `insert`, `update`, `delete`, `upsert` ou `rpc`.
- Seules les routes portant la clé `service_role` sont listées : ce sont celles qui
  **contournent les règles de sécurité de la base**. Une route sans cette clé reste protégée
  par la RLS même sans garde.

---

## 4. Inventaire au 2026-09-18

### back-office

50 routes portent la clé `service_role` sur 152 routes au total.

#### Fermées — 33

| Route                                                   | Méthodes      | Serrure                | Écrit en base |
| ------------------------------------------------------- | ------------- | ---------------------- | ------------- |
| `admin/run-migration`                                   | POST          | requireBackofficeAdmin | oui           |
| `ambassadors/create-auth`                               | POST          | getUser                | oui           |
| `consultations/associations`                            | POST          | requireBackofficeAdmin | oui           |
| `cron/sync-comptabilite`                                | GET           | CRON_SECRET            | non           |
| `exports/google-merchant-excel`                         | GET, POST     | requireBackofficeAdmin | non           |
| `finance/send-to-accountant`                            | POST          | getUser                | oui           |
| `gmail/inbound`                                         | POST          | signature/secret       | oui           |
| `gmail/watch/init`                                      | POST          | requireBackofficeAdmin | oui           |
| `gmail/watch/refresh`                                   | GET           | CRON_SECRET            | oui           |
| `linkme/selections/add-item`                            | OPTIONS, POST | requireBackofficeAdmin | oui           |
| `linkme/selections/create`                              | POST          | requireBackofficeAdmin | oui           |
| `linkme/selections/delete`                              | POST          | requireBackofficeAdmin | oui           |
| `linkme/selections/toggle-item-visibility`              | POST          | requireBackofficeAdmin | oui           |
| `linkme/users/create`                                   | POST          | requireBackofficeAdmin | oui           |
| `linkme/users/hard-delete`                              | POST          | requireBackofficeAdmin | oui           |
| `linkme/users/reset-password`                           | POST          | requireBackofficeAdmin | non           |
| `linkme/users/update-email`                             | POST          | requireBackofficeAdmin | non           |
| `organisations/[id]/shipping-address`                   | PATCH         | getUser                | oui           |
| `packlink/shipments/pending`                            | GET           | requireBackofficeAdmin | non           |
| `qonto/debug-counts`                                    | GET           | requireBackofficeAdmin | non           |
| `qonto/invoices`                                        | GET, POST     | requireBackofficeAdmin | non           |
| `qonto/invoices/[id]`                                   | GET, PATCH    | requireBackofficeAdmin | oui           |
| `qonto/invoices/[id]/finalize`                          | POST          | getUser                | oui           |
| `qonto/invoices/by-order/[orderId]/regenerate-proforma` | POST          | getUser                | oui           |
| `qonto/invoices/consolidate`                            | POST          | getUser                | oui           |
| `qonto/invoices/service`                                | POST          | getUser                | oui           |
| `qonto/quotes`                                          | GET, POST     | requireBackofficeAdmin | non           |
| `qonto/quotes/[id]/accept`                              | POST          | getUser                | oui           |
| `qonto/quotes/[id]/convert`                             | POST          | getUser                | oui           |
| `qonto/quotes/by-order/[orderId]`                       | GET           | requireBackofficeAdmin | non           |
| `qonto/quotes/by-order/[orderId]/regenerate`            | POST          | getUser                | oui           |
| `sales-orders/[id]/cancel`                              | POST          | getUser                | oui           |
| `webhooks/packlink`                                     | POST          | signature/secret       | oui           |

#### Encore ouvertes — 17

| Route                                   | Méthodes  | Serrure    | Écrit en base |
| --------------------------------------- | --------- | ---------- | ------------- |
| `emails/linkme-info-request`            | POST      | **aucune** | oui           |
| `emails/linkme-order-approved`          | POST      | **aucune** | oui           |
| `emails/linkme-order-rejected`          | POST      | **aucune** | oui           |
| `emails/linkme-step4-confirmed`         | POST      | **aucune** | oui           |
| `emails/send-consultation`              | POST      | **aucune** | oui           |
| `emails/send-document`                  | POST      | **aucune** | oui           |
| `emails/send-order-documents`           | POST      | **aucune** | oui           |
| `packlink/shipments/sync`               | POST      | **aucune** | oui           |
| `qonto/invoices/[id]/cancel`            | POST      | **aucune** | oui           |
| `qonto/invoices/[id]/delete`            | DELETE    | **aucune** | oui           |
| `qonto/invoices/[id]/sync-to-order`     | POST      | **aucune** | oui           |
| `qonto/quotes/from-invoice/[invoiceId]` | POST      | **aucune** | non           |
| `qonto/quotes/service`                  | POST      | **aucune** | non           |
| `qonto/sync-invoices`                   | GET, POST | **aucune** | oui           |
| `quotes/[id]/finalize`                  | POST      | **aucune** | oui           |
| `quotes/[id]/link-qonto`                | POST      | **aucune** | oui           |
| `quotes/[id]/push-to-qonto`             | POST      | **aucune** | oui           |

### linkme

5 routes portent la clé `service_role` sur 17 routes au total.

#### Fermées — 1

| Route             | Méthodes | Serrure          | Écrit en base |
| ----------------- | -------- | ---------------- | ------------- |
| `webhook/revolut` | POST     | signature/secret | oui           |

#### Encore ouvertes — 4

| Route                          | Méthodes | Serrure    | Écrit en base |
| ------------------------------ | -------- | ---------- | ------------- |
| `complete-info/[token]`        | GET      | **aucune** | non           |
| `complete-info/[token]/submit` | POST     | **aucune** | oui           |
| `emails/order-confirmation`    | POST     | **aucune** | oui           |
| `emails/step4-confirmed`       | POST     | **aucune** | oui           |

### site-internet

10 routes portent la clé `service_role` sur 25 routes au total.

#### Fermées — 6

| Route                             | Méthodes | Serrure          | Écrit en base |
| --------------------------------- | -------- | ---------------- | ------------- |
| `account/export`                  | GET      | getUser          | non           |
| `cron/abandoned-cart-check`       | GET      | CRON_SECRET      | oui           |
| `cron/review-request-check`       | GET      | CRON_SECRET      | non           |
| `cron/validate-ambassador-primes` | GET      | CRON_SECRET      | oui           |
| `cron/win-back-check`             | GET      | CRON_SECRET      | non           |
| `webhooks/stripe`                 | POST     | signature/secret | oui           |

#### Encore ouvertes — 4

| Route                | Méthodes | Serrure    | Écrit en base |
| -------------------- | -------- | ---------- | ------------- |
| `checkout`           | POST     | **aucune** | non           |
| `contact`            | POST     | **aucune** | oui           |
| `feeds/products.xml` | GET      | **aucune** | oui           |
| `shipping-config`    | GET      | **aucune** | non           |

---

## 4 bis. État au 2026-09-19 — le verrou général est posé

`apps/back-office/src/middleware.ts` existe désormais. **Sous `/api/`, le défaut
est le refus.** Une route nouvellement ajoutée naît fermée ; l'ouvrir demande de
toucher `apps/back-office/src/lib/security/public-api-routes.ts`, donc de l'écrire
et de le justifier. Un test parcourt les fichiers de routes réels et échoue si
l'ensemble des portes ouvertes ne correspond plus à cette liste.

Le middleware ne vise QUE `/api/:path*`. La protection des **pages** reste
`(protected)/layout.tsx`, inchangée.

### Les quatre façons de passer

| #   | Condition                                             | Pourquoi                                                                                                          |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | requête `OPTIONS`                                     | contrôle préalable CORS : aucune donnée, aucun cookie. Le bloquer casserait l'extension Chrome sans rien protéger |
| 2   | chemin de la liste blanche                            | la route porte sa propre serrure (tableau ci-dessous)                                                             |
| 3   | `Authorization: Bearer <CRON_SECRET>`                 | appel machine ; la route appelée revérifie                                                                        |
| 4   | session Supabase valide — cookie **ou** jeton porteur | écrans du back-office, et extension Chrome du sourcing                                                            |

Le cas 4 accepte le jeton porteur : c'est ainsi que l'extension Chrome appelle
depuis une autre origine, où les cookies ne voyagent pas. Conséquence :
**`/api/sourcing/*` et `/api/brands` n'ont PAS besoin d'exemption de chemin**.
Deux portes de moins à surveiller que ce qui était prévu.

### Liste blanche — 9 chemins, chacun justifié

| Chemin                              | Qui appelle               | Sa serrure à elle                            |
| ----------------------------------- | ------------------------- | -------------------------------------------- |
| `/api/csp-report`                   | le navigateur             | aucune possible par nature                   |
| `/api/health`                       | supervision               | aucune donnée métier renvoyée                |
| `/api/cron/google-merchant-poll`    | tâche planifiée           | `CRON_SECRET` obligatoire (l'était déjà)     |
| `/api/cron/meta-commerce-sync`      | tâche planifiée           | `CRON_SECRET` **rendu obligatoire**          |
| `/api/cron/sync-comptabilite`       | tâche planifiée           | `CRON_SECRET` **rendu obligatoire**          |
| `/api/gmail/watch/refresh`          | tâche planifiée           | `CRON_SECRET` obligatoire (l'était déjà)     |
| `/api/gmail/inbound`                | Google Pub/Sub            | jeton partagé obligatoire — voir § 5 bis     |
| `/api/webhooks/packlink`            | Packlink                  | secret partagé — **non configuré, voir § 6** |
| `/api/emails/linkme-info-completed` | LinkMe, serveur à serveur | aucune — destinataire fixe interne, voir § 6 |

### Gardes ajoutées route par route (défense en profondeur)

Le middleware vérifie qu'une session existe ; `requireBackofficeAdmin` vérifie en
plus le **rôle** (401 → 403). Les 17 routes signalées ouvertes le 18/09 la portent
désormais :

```
POST   qonto/invoices/[id]/cancel          POST  emails/linkme-info-request
DELETE qonto/invoices/[id]/delete          POST  emails/linkme-order-approved
POST   qonto/invoices/[id]/sync-to-order   POST  emails/linkme-order-rejected
POST   qonto/sync-invoices                 POST  emails/linkme-step4-confirmed
POST   quotes/[id]/finalize                POST  emails/send-consultation
POST   quotes/[id]/link-qonto              POST  emails/send-document
POST   quotes/[id]/push-to-qonto           POST  emails/send-order-documents
POST   qonto/quotes/service
POST   qonto/quotes/from-invoice/[invoiceId]
POST   packlink/shipments/sync
```

Plus `POST qonto/sync`, qui n'était pas dans la liste du 18/09 et n'avait aucune
garde : elle accepte une session **ou** le secret des tâches planifiées.

**Aucune ligne de logique Qonto ou Packlink n'a été modifiée.** Les gardes sont
posées en tête de handler, rien d'autre.

### Appels internes trouvés en chemin — le verrou les aurait cassés en silence

Quatre routes en appellent une autre par HTTP, sans session. Sans correction,
elles seraient tombées en 401 **sans erreur visible** (toutes en `try/catch`).

| Appelant                         | Appelée                             | Correction                        |
| -------------------------------- | ----------------------------------- | --------------------------------- |
| `form-submissions/[id]/messages` | `emails/form-reply`                 | transmet le cookie de session     |
| `qonto/invoices/[id]` (PATCH)    | `qonto/invoices/[id]/sync-to-order` | transmet le cookie de session     |
| `cron/sync-comptabilite`         | `qonto/sync`                        | présente `CRON_SECRET` en en-tête |
| `cron/meta-commerce-sync`        | `meta-commerce/sync-statuses`       | présente `CRON_SECRET` en en-tête |

Le dernier cas était **déjà cassé avant ce sprint** : `sync-statuses` exigeait une
session, et une tâche planifiée n'a pas de cookie. La synchronisation Meta de 4 h
renvoyait 401 tous les jours. Réparée au passage.

---

## 5 bis. Gardes qui se dégradaient — état après correction

| Route                       | Avant                                                            | Après                                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cron/meta-commerce-sync`   | `if (cronSecret)` — pas de secret, pas de contrôle               | variable absente = **503**                                                                                                                                                                                          |
| `cron/sync-comptabilite`    | idem                                                             | variable absente = **503**                                                                                                                                                                                          |
| `linkme` `webhook/revolut`  | signature vérifiée **seulement si** secret ET signature présents | secret absent = **503**, signature absente = **401**, signature fausse = **401**                                                                                                                                    |
| `qonto/quotes/[id]/convert` | `getUser()` appelé, résultat jamais testé                        | `requireBackofficeAdmin` en tête                                                                                                                                                                                    |
| `qonto/invoices/[id]`       | garde sur le `GET` seulement, `PATCH` ouvert                     | garde sur le `PATCH` aussi                                                                                                                                                                                          |
| `gmail/inbound`             | jeton accepté dans l'adresse                                     | inchangé — **impossible autrement** : Pub/Sub n'accepte pas d'en-tête personnalisé sur un abonnement push. Une trace signale chaque usage de la forme en adresse, pour pouvoir la retirer le jour du passage à OIDC |
| `webhooks/packlink`         | dégradable                                                       | **inchangé volontairement** — voir § 6                                                                                                                                                                              |

Revolut pouvait être durci sans risque : **aucune variable `REVOLUT_*` n'existe
dans le projet Vercel `linkme`** (vérifié le 19/09). L'intégration n'est pas
branchée ; la fermer ne casse rien.

---

## 5. Gardes présentes mais jamais vérifiées (constat du 18/09)

Une garde peut exister dans le fichier et ne rien bloquer : l'appel est fait, son résultat
n'est jamais testé. Vérifié à la main, ligne par ligne :

| Route                       | Constat                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `qonto/quotes/[id]/convert` | `auth.getUser()` appelé ligne 111, **le résultat n'est jamais testé**. La route écrit (création de facture depuis un devis) et reste ouverte. |

Les autres routes en `getUser()` de l'inventaire ont été vérifiées : elles testent bien
le résultat et renvoient 401.

**Leçon** : la détection automatique par motif ne suffit pas pour cette question. Toute
affirmation « cette route est protégée » se vérifie en lisant le code, ou par un appel réel
sans session.

---

## 6. Ce qui reste ouvert — deux décisions pour Roméo

### 6.1 Le rappel Packlink accepte n'importe qui

`PACKLINK_WEBHOOK_SECRET` **n'est pas configuré** dans le projet Vercel
`verone-back-office` (vérifié le 19/09). La vérification est donc sautée à chaque
appel. Or sur l'événement `shipment.carrier.success`, la route passe
`packlink_status` à `paye`, ce qui **déclenche le trigger de décrémentation du
stock réel** et envoie un e-mail de suivi au client.

Rendre le secret obligatoire **couperait les mises à jour d'expédition** :
Packlink ne sait pas envoyer d'en-tête personnalisé sur ses rappels. Le seul
support disponible serait un secret dans l'adresse du rappel — ce que la règle
interdit par ailleurs, faute de mieux.

**Décision attendue** : garder tel quel, ou accepter un secret dans l'adresse du
rappel (à enregistrer côté Packlink via `packlink/callback/register`).
En attendant, la route écrit une ligne d'alerte dans les journaux à chaque appel
non vérifié.

### 6.2 La notification LinkMe entre sans serrure

`/api/emails/linkme-info-completed` est appelée par l'application LinkMe, de
serveur à serveur, quand un client a complété ses informations. Elle est dans la
liste blanche parce qu'elle n'a aucune serrure possible aujourd'hui : les deux
projets Vercel ne partagent aucun secret.

Le risque est faible et borné : le destinataire est **fixe et interne**
(`backoffice@verone.fr`), aucun paramètre d'adresse n'est accepté — ce n'est pas
un relais d'envoi exploitable, contrairement aux sept routes fermées par ce sprint.

**Décision attendue** : ajouter une variable partagée aux deux projets Vercel pour
la fermer comme les autres.

### 6.3 Ce qui n'est plus un sujet

- Les 17 routes signalées ouvertes le 18/09 : **fermées**.
- Les ~40 autres routes sans garde (Qonto, Packlink, Google Merchant, Meta,
  mouvements de stock, tarification par canal…) : **fermées par le middleware**,
  sans qu'une ligne de leur logique ait été touchée.
- `qonto/quotes/[id]/convert` et le `PATCH` de `qonto/invoices/[id]` : **branchés**.

## 7. Règle pour toute nouvelle route

1. Une route qui sert un écran du back-office porte `requireBackofficeAdmin`. Sans exception.
2. Une route qui n'a **aucun appelant** dans le code **se supprime**. On ne garde pas une
   porte dont personne ne se sert : on la mure.
3. La clé `service_role` ne s'utilise que si la RLS empêche une lecture légitime, et
   **toujours derrière une garde**. Le réflexe par défaut est `createServerClient`.
4. Une garde de cron ou de webhook ne doit **jamais** pouvoir être sautée parce qu'une
   variable manque. Variable absente = la route refuse.

Détail et justification : `.claude/rules/api-guards.md`.
