# `[BO-SEC-MW-001]` — le verrou général des routes API du back-office

Branche `feat/BO-SEC-MW-001-verrou-api-back-office`. Aucune migration, aucune
écriture en base conservée. **Aucune ligne de logique Qonto ou Packlink modifiée.**

---

## Ce qui n'allait pas

Le back-office n'avait **aucun `middleware.ts`**. `(protected)/layout.tsx` protège
les pages, jamais `src/app/api/**`. Conséquence : toute route API naissait ouverte.

Le 18/09, huit portes de **lecture** ont été fermées une par une. Restaient
ouvertes 17 portes qui **écrivent** — et, en réalité, bien plus : l'inventaire du
18/09 ne listait que les routes portant la clé `service_role`. Le relevé complet
mené ce 19/09 sur les **151 routes** du back-office en trouve une soixantaine sans
aucun contrôle, dont `qonto/transactions`, `qonto/credit-notes/[id]` (DELETE et
PATCH), `qonto/invoices/[id]/send`, `stock-movements/[id]` (DELETE),
`transactions/update-vat`, `channel-pricing/upsert`, tout `google-merchant/*` et
tout `meta-commerce/*`.

Fermer 60 portes une par une aurait demandé 60 occasions de casser quelque chose.
**Le middleware les ferme toutes d'un geste, sans toucher à leur contenu.**

---

## Temps 1 — qui frappe à la porte (avant de verrouiller)

ADR-036 : réparer avant de durcir. Relevé des appelants de chaque route, puis
lecture de chaque appelant. Quatre découvertes qui auraient cassé en silence :

| Appelant                         | Appelée                       | Problème                        | Correction             |
| -------------------------------- | ----------------------------- | ------------------------------- | ---------------------- |
| `form-submissions/[id]/messages` | `emails/form-reply`           | appel serveur, sans cookie      | transmet la session    |
| `qonto/invoices/[id]` PATCH      | `.../sync-to-order`           | appel serveur, sans cookie      | transmet la session    |
| `cron/sync-comptabilite`         | `qonto/sync`                  | tâche planifiée, aucune session | présente `CRON_SECRET` |
| `cron/meta-commerce-sync`        | `meta-commerce/sync-statuses` | tâche planifiée, aucune session | présente `CRON_SECRET` |

Le dernier était **déjà cassé avant ce sprint** : `sync-statuses` exige une session
et une tâche planifiée n'a pas de cookie. La synchronisation Meta de 4 h renvoyait
401 tous les jours, dans un `catch` silencieux. Réparée.

Découverte complémentaire : l'extension Chrome du sourcing s'authentifie par
**jeton porteur**, pas par cookie. Le middleware accepte les deux, donc
`/api/sourcing/*` et `/api/brands` **n'ont pas besoin d'exemption de chemin** —
deux portes de moins que ce qui était prévu.

---

## Temps 2 — le verrou

`apps/back-office/src/middleware.ts`, `matcher: ['/api/:path*']` : les **pages ne
sont pas touchées**. Quatre façons de passer : `OPTIONS` (contrôle préalable CORS),
liste blanche, secret des tâches planifiées, session valide (cookie ou jeton porteur).

La liste blanche vit dans `src/lib/security/public-api-routes.ts` — séparée du
middleware pour être **testable**, chaque entrée portant sa justification écrite.

Raccourci de coût : sans cookie `sb-*` ni jeton porteur, refus immédiat, sans
aller-retour vers Supabase. Seules les requêtes déjà porteuses d'une preuve
coûtent une vérification.

---

## Temps 3 — les gardes qui mentaient

| Route                       | Avant                                                  | Après                                              |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| `qonto/invoices/[id]`       | garde sur le `GET` seulement, `PATCH` ouvert           | garde sur le `PATCH`                               |
| `qonto/quotes/[id]/convert` | `getUser()` appelé, résultat jamais testé              | `requireBackofficeAdmin` en tête                   |
| `cron/meta-commerce-sync`   | `if (cronSecret)` — pas de secret, pas de contrôle     | variable absente = **503**                         |
| `cron/sync-comptabilite`    | idem                                                   | variable absente = **503**                         |
| `linkme` `webhook/revolut`  | vérification sautée si secret **ou** signature absents | 503 / 401 / 401                                    |
| `gmail/inbound`             | jeton accepté dans l'adresse                           | inchangé, **impossible autrement** (voir plus bas) |
| `webhooks/packlink`         | dégradable                                             | **inchangé volontairement** (voir plus bas)        |

Plus les 17 routes nommées, qui portent désormais `requireBackofficeAdmin`
(défense en profondeur : le middleware vérifie qu'une session existe, la garde
vérifie le **rôle**).

---

## Vérifications

`type-check` ✅ · `lint` ✅ · `type-coverage` **99,35 %** (seuil 99,22) ✅
`type-check` + `lint` LinkMe ✅

### Tests unitaires — 16 cas

```
npx tsx apps/back-office/src/lib/__tests__/public-api-routes.test.ts   → 8/8
npx tsx apps/back-office/src/lib/__tests__/require-cron-secret.test.ts → 8/8
```

Le premier **parcourt les fichiers de routes réels du dépôt** et vérifie que
l'ensemble des portes ouvertes est exactement la liste justifiée. Ajouter une
route la ferme ; l'ouvrir fait échouer le test tant qu'on ne l'écrit pas.
Le second verrouille la règle « variable absente = la route refuse ».

### Essais réels — serveur local, base de production

**Sans connexion** — toutes en `401 {"error":"Non authentifie"}` :
`qonto/invoices`, `qonto/sync-invoices`, `qonto/invoices/*/cancel`,
`qonto/invoices/*/delete`, `qonto/quotes/service`, `quotes/*/push-to-qonto`,
`packlink/shipments/sync`, `emails/send-document`, `emails/linkme-order-approved`,
`qonto/transactions`, `stock-movements/*` (DELETE), `channel-pricing/upsert`.

**Toujours joignables** : `health` (réponse de la route), `csp-report` (400 de sa
propre validation), `cron/sync-comptabilite` (503 de **sa** garde, pas du verrou —
`CRON_SECRET` n'est pas dans l'environnement local), `OPTIONS` sur
`sourcing/import` → **204**.

**Connecté** (session réelle créée par lien magique, aucune donnée modifiée) :

| Écran / route                                                                          | Résultat                                                                     |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `/factures`, `/devis`, `/ventes`, `/finance`, `/dashboard`, `/stocks`, `/canaux-vente` | **7 pages en 200**, compteurs du menu servis                                 |
| `GET qonto/invoices`, `qonto/quotes`, `packlink/shipments/pending`, `qonto/status`     | **200**, données réelles                                                     |
| Les 17 portes fermées, appelées avec un corps vide ou un identifiant inexistant        | **400 / 404 de leur propre validation** — jamais 401 ni 403                  |
| `qonto/invoices/*/cancel`, `/delete`, `PATCH`, `quotes/*/convert`                      | réponse **de Qonto** (« Resource not found ») : la liaison Qonto est intacte |
| `GET brands` avec jeton porteur, sans cookie (extension Chrome)                        | **200**                                                                      |
| `GET brands` sans rien                                                                 | **401**                                                                      |

**Erreurs console nouvelles : aucune.** La seule requête en échec sur les 7 écrans
est une vignette de photo de consultation absente — défaut connu, antérieur.

Captures : `.playwright-mcp/screenshots/20260919/bo-sec-mw-*.png`.

---

## Deux points laissés ouverts, volontairement

### 1. Le rappel Packlink

`PACKLINK_WEBHOOK_SECRET` **n'est pas configuré** en production (vérifié le 19/09
sur le projet Vercel). La vérification est donc sautée à chaque appel. Sur
l'événement `shipment.carrier.success`, la route passe `packlink_status` à `paye`,
ce qui **déclenche la décrémentation du stock réel** et l'envoi d'un e-mail client.

Rendre le secret obligatoire **couperait les mises à jour d'expédition** : Packlink
ne sait pas envoyer d'en-tête personnalisé. Le comportement est donc **inchangé**,
avec une ligne d'alerte dans les journaux à chaque appel non vérifié.
**Décision Roméo attendue.**

### 2. Le jeton Gmail dans l'adresse

Google Pub/Sub **n'accepte pas d'en-tête personnalisé** sur un abonnement push :
soit OIDC, soit un jeton dans l'adresse. Le retirer couperait la réception des
messages. Une trace signale désormais chaque usage de la forme en adresse, pour
pouvoir la retirer le jour du passage à OIDC (réglage côté Google, hors dépôt).

---

## Route sans aucun appelant — à trancher

`emails/linkme-step4-confirmed` : **aucun appelant** dans `apps/` ni `packages/`.
L'application LinkMe a sa propre route jumelle `emails/step4-confirmed`. La règle
dit qu'une porte dont personne ne se sert se mure. Elle est fermée par une garde
pour l'instant. **À supprimer sur accord de Roméo.**

---

## Ce qui n'a pas changé

- Les **pages** : le middleware ne vise que `/api/`.
- La **logique Qonto et Packlink** : gardes en tête de handler, rien d'autre.
- Les routes déjà fermées le 18/09.
