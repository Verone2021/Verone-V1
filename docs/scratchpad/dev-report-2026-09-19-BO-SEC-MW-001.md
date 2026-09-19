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

## Deuxième passe — sur ordre de Roméo (19/09)

Roméo a tranché : supprimer la route morte, et fermer le rappel Packlink
« comme le ferait un développeur senior ».

### Le rappel Packlink — fermé sans secret

**Ce que Packlink permet, vérifié dans le code du client** : son API n'accepte
**qu'une URL** (`POST /v1/shipments/callback`, corps `{ url }`). Ni en-tête
personnalisé, ni signature. Le seul support pour un secret serait l'adresse
elle-même, qui finit dans les journaux du serveur et chez le fournisseur — ce que
`.claude/rules/api-guards.md` interdit, et à raison.

**Ce qui était réellement en jeu**, en relisant chaque branche :

| Événement         | Ce qu'il croyait           | Conséquence d'un faux message                                             |
| ----------------- | -------------------------- | ------------------------------------------------------------------------- |
| `carrier.success` | le message                 | passage à « payé » → **sortie de stock réel** + e-mail au client          |
| `tracking.update` | **entièrement** le message | numéro et **adresse de suivi choisis par l'appelant**, affichés au client |
| `delivered`       | le message                 | commande marquée livrée                                                   |
| `carrier.fail`    | le message                 | expédition marquée en incident                                            |

**La correction** : le rappel a cessé d'être une source de vérité pour devenir un
**signal de relecture**. Avant toute écriture :

1. la référence doit exister dans **nos** expéditions — sinon **404**, et on
   s'arrête avant même d'appeler Packlink, ce qui borne le coût d'un envoi en
   rafale sur des références inventées ;
2. Packlink doit confirmer la référence — sinon **502** ;
3. l'état appliqué et les données de suivi viennent de **la réponse de Packlink**,
   jamais du corps reçu.

Deux conditions ajoutées, toutes deux appuyées sur des valeurs **constatées en
réel** ce 19/09 sur les deux expéditions du compte, pas devinées :

- `carrier.success` n'écrit que si Packlink expose un **numéro de suivi**
  (`packages[0].carrier_tracking_number`) — c'est exactement ce que veut dire
  « le transporteur a accepté » ;
- `delivered` n'écrit que si Packlink répond `state = "DELIVERED"`.

`PACKLINK_WEBHOOK_SECRET` reste géré : configuré un jour, il devient un deuxième
verrou. Son absence ne fait plus tomber la protection, puisque la protection ne
repose plus sur lui.

**Essais réels, sans connexion, serveur local :**

| Message envoyé                                                                     | Réponse                                               |
| ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `delivered` sur `REFERENCE-INVENTEE-999`                                           | **404** avant tout appel à Packlink                   |
| `tracking.update` sur `FR9999PRO0009999999`, avec un faux numéro et un lien pirate | **404**, rien n'est écrit                             |
| `carrier.success` sur une référence inconnue                                       | **404**                                               |
| `label.fail` sur une vraie référence                                               | **200** — les deux contrôles passent, aucune écriture |

Empreinte des deux expéditions réelles **avant et après** : `packlink_status`,
`tracking_number` et `updated_at` **strictement identiques** (`2026-04-28 22:57`).

### La route morte est supprimée

`emails/linkme-step4-confirmed` : aucun appelant dans `apps/`, `packages/`,
`scripts/` ni la CI. L'application LinkMe a sa route jumelle
`emails/step4-confirmed`. Supprimée, et retirée du test.

### La dernière porte interne, fermée sans fenêtre de casse

`/api/emails/linkme-info-completed` reste dans la liste blanche (l'appelant est un
serveur, il n'a pas de session), mais elle porte maintenant un secret partagé
`INTERNAL_NOTIFY_SECRET` : LinkMe l'envoie en en-tête `x-verone-internal`, le
back-office l'**exige dès qu'il est configuré**, l'ignore tant qu'il ne l'est pas.

Ce sens-là, et pas l'inverse : le code se livre d'abord, la variable s'ajoute aux
deux projets Vercel ensuite. À aucun moment la notification ne tombe.

Vérifié en local : sans la variable, la route répond comme avant (400 de sa propre
validation). L'exigence du secret n'est pas testable sur le serveur local sans le
redémarrer — elle tient en deux lignes lues et relues.

**Reste à faire une fois cette demande en ligne** : ajouter
`INTERNAL_NOTIFY_SECRET` (même valeur) aux projets Vercel `verone-back-office` et
`linkme`.

---

## Un seul point encore ouvert

### Le jeton Gmail dans l'adresse

Google Pub/Sub **n'accepte pas d'en-tête personnalisé** sur un abonnement push :
soit OIDC, soit un jeton dans l'adresse. Le retirer couperait la réception des
messages. Une trace signale désormais chaque usage de la forme en adresse, pour
pouvoir la retirer le jour du passage à OIDC — réglage côté Google, hors dépôt.

## Ce qui n'a pas changé

- Les **pages** : le middleware ne vise que `/api/`.
- La **logique Qonto et Packlink** : gardes en tête de handler, rien d'autre.
- Les routes déjà fermées le 18/09.
