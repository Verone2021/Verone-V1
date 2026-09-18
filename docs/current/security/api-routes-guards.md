# Trousseau des routes API — quelle porte, quelle serrure

**Source de vérité unique** pour la protection des routes API des trois applications.
À relire avant d'ajouter une route, avant d'en supprimer une, et avant tout audit de sécurité.

**Dernière mise à jour** : 2026-09-18 — sprint `[BO-SEC-GUARD-001]`.
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

## 5. Gardes présentes mais jamais vérifiées

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

## 6. Ce qui reste ouvert, et dans quel ordre le traiter

Décision de Roméo le 18/09 : **fermer d'abord les portes de lecture**, sans toucher à la
mécanique Qonto et Packlink, qui est fragile et doit continuer de fonctionner.

| Priorité | Sujet                                                                                                                                                                                                                                | Pourquoi                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| 1        | **Un `middleware.ts` sur le back-office** : refus par défaut sur `/api/*`, liste blanche explicite pour les crons, les webhooks et l'extension Chrome du sourcing                                                                    | C'est la seule réponse systémique. Tant qu'il manque, chaque route ajoutée est ouverte par défaut |
| 2        | Les routes Qonto qui **écrivent** (factures, devis) sans garde                                                                                                                                                                       | Un inconnu peut créer, modifier ou supprimer une facture                                          |
| 3        | Les 7 routes `emails/*` sans garde                                                                                                                                                                                                   | Relais d'envoi de messages depuis le domaine Vérone (hameçonnage)                                 |
| 4        | `qonto/quotes/[id]/convert` : brancher la garde déjà présente                                                                                                                                                                        | Correction d'une ligne                                                                            |
| 5        | Gardes qui se dégradent en silence : `webhooks/packlink` et `webhook/revolut` sautent la vérification **si la variable d'environnement est absente** ; `gmail/inbound` accepte son jeton **dans l'adresse** (donc dans les journaux) | Une garde qui s'efface toute seule n'est pas une garde                                            |

---

## 7. Règle pour toute nouvelle route

1. Une route qui sert un écran du back-office porte `requireBackofficeAdmin`. Sans exception.
2. Une route qui n'a **aucun appelant** dans le code **se supprime**. On ne garde pas une
   porte dont personne ne se sert : on la mure.
3. La clé `service_role` ne s'utilise que si la RLS empêche une lecture légitime, et
   **toujours derrière une garde**. Le réflexe par défaut est `createServerClient`.
4. Une garde de cron ou de webhook ne doit **jamais** pouvoir être sautée parce qu'une
   variable manque. Variable absente = la route refuse.

Détail et justification : `.claude/rules/api-guards.md`.
