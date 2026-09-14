# Stratégie de test back-office Vérone

Objectif : passer d'un filet qui vérifie « la page charge » à un filet qui vérifie « la fonctionnalité fait ce qu'elle prétend », sans jamais toucher aux données réelles.

---

## Avertissement — la place de ce document dans le plan

**Ce n'est pas le point de départ.** La première version de ce plan proposait 14-20 h de campagne Playwright en amont de tout. C'était une inversion de priorités, corrigée dans `PLAN-CORRECTION.md`. Deux raisons :

1. **L'audit a déjà trouvé les bugs.** Les ~90 findings de `FINDINGS.md` sont documentés avec `fichier:ligne`. Refaire 20 h de navigateur pour redécouvrir ce qu'on sait déjà n'apporte rien. Playwright sert à **prouver un correctif** et à **empêcher un retour**, donc il vient après le diagnostic, dans le lot où l'on corrige.

2. **Environ 70 des 90 findings se détectent sans navigateur**, et bien plus vite :

```
                    ┌─────────────────────────────┐
   le plus cher     │  E2E Playwright             │  8 parcours seulement
   ~30 s / test     │  (navigateur réel)          │  → ce qui exige un vrai clic
                    ├─────────────────────────────┤
   ~1 s / test      │  Test HTTP de route API     │  151 routes × 4 identités
                    │  (pas de navigateur)        │  → toute la sécurité
                    ├─────────────────────────────┤
   ~50 ms / test    │  Test unitaire de calcul    │  TVA, commission, marge, totaux
                    │  (fonction pure)            │  → toute la logique argent
                    ├─────────────────────────────┤
   au build         │  Type-check + gate DB↔TS    │  colonnes, enums, contrats
                    ├─────────────────────────────┤
   le moins cher    │  Lint / règle statique      │  erreurs avalées, select('*'),
   à l'écriture     │                             │  liens morts, requêtes sans borne
                    └─────────────────────────────┘
```

**Correspondance avec les lots de `PLAN-CORRECTION.md` :**

| Phase de ce document                     | Lot                                | Quand                                |
| ---------------------------------------- | ---------------------------------- | ------------------------------------ |
| Phase 0 — environnement isolé            | **Lot 6**                          | après les gates, la perf et les bugs |
| Phase 2 — sécurité des routes API        | **Lot 1**, critère de sortie       | tout de suite, sans navigateur       |
| Phase 4 — régression sur les bugs connus | **Lot 5**, un test par PR          | pendant les corrections              |
| Phase 6 — RLS et triggers (pgTAP)        | **Lot 2** partiellement, **Lot 6** | avec les gates puis le socle         |
| Phase 1 — smoke exhaustif                | **Lot 2**                          | en rebranchant `smoke-golden`        |
| Phase 3 — parcours fonctionnels          | **Lot 7**                          | 6 h, à la fin                        |
| Phase 5 — budgets de performance         | **Lot 4**, critère de sortie       | avec les correctifs de perf          |

Autrement dit : les phases restent valables, leur **ordre change**. Ne pas exécuter ce document de haut en bas — le suivre depuis `PLAN-CORRECTION.md`, lot par lot.

Chaque phase contient un prompt prêt à copier-coller, délimité par `---8<---`.

---

---

## Règles absolues pour toute l'exécution

À rappeler à Claude Code au début de chaque session :

1. **Jamais de test contre la base de production.** Toute suite s'exécute contre la branche Supabase de test. Si `NEXT_PUBLIC_SUPABASE_URL` pointe sur `aorroydfjsrygmosnzrl` sans suffixe de branche, la suite doit **refuser de démarrer**.
2. **Aucune écriture sur des données pré-existantes**, même en environnement de test. Chaque test crée ses propres entités avec un préfixe `TEST-<runId>-` et les supprime en `afterAll`.
3. **Aucun commit, aucune PR, aucun push** sans ordre explicite de Roméo.
4. **Aucune modification de code applicatif pendant la phase de test.** On observe et on documente. Les corrections viennent après, dans des PR séparées.
5. Chaque bug trouvé produit une entrée dans `docs/scratchpad/test-run-<date>/findings.md` au format : titre, `fichier:ligne` suspecté, étapes de reproduction, comportement observé, comportement attendu, sévérité, capture d'écran, extrait console/réseau.
6. **Aucun envoi d'e-mail réel.** Les routes `api/emails/*` sont interceptées par `page.route()` et mockées, ou la clé Resend de l'environnement de test est invalide volontairement.

---

## Phase 0 — Environnement isolé (2-3 h, bloquante)

Sans cette phase, rien d'autre n'est faisable sans risque. Elle est plus longue que prévu à cause d'un défaut identifié à l'audit : **59 tables cœur n'ont aucun `CREATE TABLE` dans les 770 migrations** (`products`, `organisations`, `sales_orders`, `stock_movements`, `contacts`…) et il n'existe aucun baseline SQL. Le schéma n'est donc pas reconstructible depuis le dépôt — c'est ce qu'il faut réparer d'abord.

### Ce que la phase produit

- `supabase/migrations/00000000000000_baseline.sql` — dump schéma-seul de la prod, committé
- `supabase/config.toml`
- Une branche Supabase `test` sur le projet `aorroydfjsrygmosnzrl`
- `tests/fixtures/seed.ts` — jeu de données de test déterministe
- `tests/fixtures/guard.ts` — refus de démarrage si l'URL pointe sur la prod
- `.env.test.local` — pointant sur la branche
- `tests/auth.setup.ts` mis à jour : un `storageState` par rôle (owner, admin, collaborateur, affilié LinkMe)

### Jeu de données de seed minimal

| Entité                       | Volume                                                                    | Pourquoi                                                           |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Utilisateurs                 | 4 (owner BO, admin BO, collaborateur BO, affilié LinkMe)                  | tester les cloisonnements de rôle                                  |
| Organisations                | 6 (3 fournisseurs dont 1 en CNY, 2 clients B2B, 1 enseigne)               | devise, segments, adresses                                         |
| Contacts                     | 8, dont **1 seul** sur un client B2B et **3** sur un autre                | reproduire le bug `contacts.length > 1`                            |
| Catégories / sous-catégories | 3 / 6                                                                     | filtres                                                            |
| Produits                     | **1 200** dont 60 avec variantes, 40 avec 3+ images                       | dépasser la limite implicite de 1 000 lignes et la pagination à 50 |
| Commandes clients            | **1 100** à des stades variés                                             | dépasser 1 000, tester le bilan                                    |
| Transactions bancaires       | **1 100**, dont 20 crédits et 20 débits sans facture, 3 virements groupés | rapprochement partiel, limite 1 000, signe/`side`                  |
| Documents financiers         | 300 factures/devis, dont 10 `deleted_at` et 5 `superseded`                | filtre des documents supprimés                                     |
| Mouvements de stock          | 500                                                                       | perf des listes                                                    |

Les volumes à 1 100+ sont délibérés : plusieurs bugs de l'audit (bilan tronqué, `fetchLinkedIds` sans limite, compteur fournisseur) **ne se manifestent pas** sous 1 000 lignes. Un seed de 20 lignes ne les verra jamais.

### Prompt

```
---8<---
Contexte : monorepo Vérone, /Users/romeodossantos/verone-back-office-V1. Je veux mettre en place
un environnement de test isolé avant toute campagne de tests. Interdiction absolue de toucher à
la base de production.

Mission Phase 0, dans cet ordre :

1. Crée un baseline SQL du schéma de production :
   - `supabase db dump --schema-only --linked > supabase/migrations/00000000000000_baseline.sql`
   - Vérifie que le fichier contient bien un CREATE TABLE pour products, organisations,
     sales_orders, stock_movements, contacts, bank_transactions, financial_documents.
     Si l'une manque, arrête-toi et dis-le-moi.
   - Crée `supabase/config.toml` s'il n'existe pas.
   - NE COMMITTE PAS. Montre-moi le diff et attends mon accord.

2. Crée une branche Supabase de test sur le projet aorroydfjsrygmosnzrl, nommée `test-audit`.
   Utilise le MCP Supabase. Confirme-moi le coût avant de créer.

3. Écris `tests/fixtures/guard.ts` qui exporte `assertTestEnvironment()` :
   - lit process.env.NEXT_PUBLIC_SUPABASE_URL
   - throw immédiatement si l'URL ne contient pas le ref de la branche de test
   - throw si SUPABASE_SERVICE_ROLE_KEY correspond à celle de production
   Appelle cette fonction dans `globalSetup` de playwright.config.ts.

4. Écris `tests/fixtures/seed.ts` : un seed déterministe (seed aléatoire fixe, aucun Date.now
   dans les données), idempotent, avec tous les identifiants préfixés `TEST-`. Volumes :
   4 utilisateurs (owner BO, admin BO, collaborateur BO, affilié LinkMe), 6 organisations
   dont 1 fournisseur en CNY, 8 contacts dont un client B2B avec exactement 1 contact et un
   autre avec 3, 3 catégories / 6 sous-catégories, 1200 produits dont 60 avec variantes et
   40 avec 3+ images, 1100 commandes clients à des stades variés, 1100 transactions bancaires
   dont 20 crédits et 20 débits sans facture et 3 virements groupés couvrant plusieurs
   factures, 300 documents financiers dont 10 avec deleted_at et 5 en quote_status superseded,
   500 mouvements de stock.
   Les volumes > 1000 sont volontaires : plusieurs bugs ne se manifestent qu'au-delà de la
   limite implicite Supabase de 1000 lignes. Écris aussi `teardown.ts` qui supprime tout
   ce qui est préfixé TEST-.

5. Mets à jour `tests/auth.setup.ts` pour produire 4 storageState distincts, un par rôle,
   dans `tests/.auth/<role>.json`.

6. Crée `.env.test.local` pointant sur la branche de test. Ajoute-le au .gitignore.

7. Vérifie que le seed passe : lance-le, compte les lignes créées, lance le teardown,
   vérifie qu'il ne reste rien de préfixé TEST-.

Rends-moi un rapport : ce qui a marché, ce qui a bloqué, et les commandes exactes pour
lancer/arrêter l'environnement de test.
---8<---
```

---

## Phase 1 — Smoke exhaustif des 168 pages (1-2 h)

Le smoke actuel (`tests/e2e/smoke/smoke-147-pages.spec.ts`) annonce 147 pages, en liste 106, alors que 168 `page.tsx` existent. 62 pages (37 %) sont hors filet. Et il n'assert que « pas de redirection vers /login, pas d'erreur console ».

On garde le principe — c'est un bon filet à coût nul — mais on le rend exhaustif et on l'enrichit.

### Ce qui est ajouté aux assertions

Pour chaque page :

- Aucune erreur console (existant)
- Aucune requête réseau en 4xx/5xx (nouveau — attrape les routes API cassées)
- Aucun texte d'erreur visible : « Une erreur est survenue », « Something went wrong », « undefined », « NaN », « [object Object] » (nouveau — attrape les erreurs affichées mais non loggées)
- La page contient au moins un élément interactif activé (nouveau — attrape les écrans entièrement grisés)
- Temps jusqu'à `networkidle` enregistré dans un CSV (nouveau — donne la liste des pages lentes, matière de la phase 5)
- Capture d'écran systématique

### Prompt

```
---8<---
Phase 1 — smoke exhaustif. Environnement de test de la Phase 0 obligatoire, vérifie
assertTestEnvironment() avant de lancer.

1. Régénère la liste des pages depuis le système de fichiers :
   `find apps/back-office/src/app -name "page.tsx"` → convertis chaque chemin en route,
   en résolvant les segments dynamiques [id], [slug] etc. avec les entités TEST- du seed.
   Écris cette liste dans `tests/e2e/smoke/routes.generated.ts`, généré par un script
   `scripts/generate-smoke-routes.ts` que tu écris aussi.

2. Réécris `tests/e2e/smoke/smoke-all-pages.spec.ts` pour boucler sur cette liste.
   Pour chaque page, assert :
   - zéro erreur console (utilise le helper consoleErrors existant)
   - zéro réponse réseau en 4xx ou 5xx (page.on('response')), en listant les URL fautives
   - aucun texte visible parmi : "Une erreur est survenue", "Something went wrong",
     "undefined", "NaN", "[object Object]", "Erreur lors de"
   - au moins un bouton ou lien activé (non disabled) présent
   - enregistre le temps jusqu'à networkidle
   - capture d'écran dans test-results/smoke/<route>.png
   Utilise 4 workers en parallèle, storageState du rôle owner.

3. Écris les résultats dans `docs/scratchpad/test-run-<date>/smoke-results.csv` :
   route, statut, ms, nb erreurs console, nb requêtes en échec, textes d'erreur trouvés.

4. Rends-moi :
   - le nombre de pages testées vs 168
   - la liste des pages en échec, avec la cause
   - le top 20 des pages les plus lentes, avec leur temps
   - les routes API qui ont répondu en 4xx/5xx, avec le compte d'occurrences

Ne corrige rien. Documente.
---8<---
```

---

## Phase 2 — Sécurité des 151 routes API (2 h, le meilleur rapport effort/valeur)

Cette phase ne demande pas de navigateur : ce sont des requêtes HTTP. Elle est rapide et elle valide (ou infirme) les findings les plus graves de l'audit. **À faire avant tout test fonctionnel.**

### Matrice à produire

Pour chacune des 151 routes, tester 4 identités :

| Identité                     | Attendu sur une route back-office |
| ---------------------------- | --------------------------------- |
| Aucun cookie                 | **401**                           |
| Cookie d'un affilié LinkMe   | **403**                           |
| Cookie d'un collaborateur BO | 200 ou 403 selon la route         |
| Cookie owner BO              | 200                               |

Toute case qui renvoie 200 là où on attend 401/403 est un finding critique.

### Cas nominatifs à vérifier en priorité

Ceux que l'audit désigne comme ouverts. Chacun doit être testé **sans aucun cookie** :

- `GET /api/qonto/balance` — soldes bancaires
- `GET /api/qonto/transactions?perPage=100` — transactions
- `GET /api/qonto/clients` — clients
- `GET /api/sales-orders/<uuid TEST>/customer-address` — PII client
- `GET /api/exports/google-merchant-excel?limit=99999` — catalogue avec coûts
- `POST /api/exports/products` — Excel avec `cost_price` et marges
- `GET /api/logs` — logs du jour
- `POST /api/emails/form-reply` — relais mail (mocké, pas d'envoi réel)
- `POST /api/qonto/invoices/<id>/send` avec `{"emails":["test@example.invalid"]}` — exfiltration
- `POST /api/webhooks/packlink` sans en-tête de secret
- `GET /api/cron/sync-comptabilite` et `/api/cron/meta-commerce-sync` sans `Authorization`
- `DELETE /api/stock-movements/<uuid TEST>`
- `DELETE /api/qonto/invoices/<id>/delete`
- `POST /api/analytics/events` avec un payload d'audit falsifié

### Côté base, avec la clé anon uniquement

- `POST /rest/v1/rpc/reset_finance_auto_data {"p_dry_run":true}` — doit être refusé. **`p_dry_run` à `true` obligatoirement**, jamais `false`, même en environnement de test.
- `POST /rest/v1/rpc/mark_payment_received` sur une commande TEST- — doit être refusé
- `POST /rest/v1/rpc/delete_organisation_safe` sur une organisation TEST- — doit être refusé
- `GET /rest/v1/products?select=cost_price,margin_percentage,supplier_reference` avec la clé anon
- Le même avec le JWT de l'affilié LinkMe du seed
- `GET /rest/v1/v_transactions_unified?select=*` avec le JWT de l'affilié — teste les 19 vues sans `security_invoker`

### Prompt

```
---8<---
Phase 2 — audit de sécurité des routes API, par requêtes HTTP. Environnement de test
uniquement. Aucune requête vers la production, vérifie assertTestEnvironment().

1. Énumère les 151 route.ts sous apps/back-office/src/app/api et déduis pour chacune :
   le chemin, les méthodes exportées, les paramètres dynamiques.
   Écris `tests/security/routes.generated.json`.

2. Écris `tests/security/api-authz.spec.ts` : pour chaque route et chaque méthode,
   envoie une requête avec 4 identités — aucun cookie, cookie affilié LinkMe, cookie
   collaborateur BO, cookie owner BO — en utilisant des UUID d'entités TEST- pour les
   paramètres dynamiques et un body minimal valide pour les mutations.
   Attendu : 401 sans cookie, 403 pour l'affilié LinkMe. Consigne le code réel obtenu.
   Pour les mutations, vérifie APRÈS coup si l'effet de bord s'est produit en base
   (une route qui renvoie 401 mais a écrit quand même est un finding).

3. Traite en priorité et nominativement cette liste, sans aucun cookie :
   GET /api/qonto/balance, /api/qonto/transactions?perPage=100, /api/qonto/clients,
   GET /api/sales-orders/<uuid TEST>/customer-address,
   GET /api/exports/google-merchant-excel?limit=99999, POST /api/exports/products,
   GET /api/logs, POST /api/emails/form-reply, POST /api/qonto/invoices/<id>/send,
   POST /api/webhooks/packlink sans secret, GET /api/cron/sync-comptabilite,
   GET /api/cron/meta-commerce-sync, DELETE /api/stock-movements/<uuid TEST>,
   POST /api/analytics/events avec un payload d'audit falsifié.
   Mocke toute route d'envoi d'e-mail : aucun e-mail réel ne doit partir.

4. Écris `tests/security/rls-anon.spec.ts` avec la clé anon de la branche de test :
   - rpc reset_finance_auto_data avec p_dry_run TRUE UNIQUEMENT (jamais false)
   - rpc mark_payment_received sur une commande TEST-
   - rpc delete_organisation_safe sur une organisation TEST-
   - GET /rest/v1/products?select=cost_price,margin_percentage,supplier_reference
   Puis les mêmes avec le JWT de l'affilié LinkMe du seed, plus
   GET /rest/v1/v_transactions_unified?select=* et order_margin_summary.
   Attendu : refus partout. Consigne ce qui passe.

5. Rends-moi une matrice markdown : route × identité × code attendu × code obtenu,
   et en tête la liste des cases où un accès non autorisé a réussi, triée par gravité
   (données bancaires > PII > coûts/marges > mutations > lecture).

Ne corrige rien.
---8<---
```

---

## Phase 3 — Parcours fonctionnels (5-7 h)

Le cœur de la campagne. 8 parcours, chacun testé de bout en bout avec vérification en base après chaque action. **La vérification en base est le point clé** : l'audit a montré que l'UI affiche « Succès » sur des écritures qui n'ont pas eu lieu. Un test qui se contente de chercher le toast de succès passera sur du code cassé.

### Règle de conception pour chaque test

```
1. Action UI (clic, saisie, soumission)
2. Assert sur le retour visuel (toast, badge, valeur affichée)
3. Assert sur la BASE — la ligne existe-t-elle vraiment, avec les bonnes valeurs
4. Rechargement de la page (F5)
5. Assert que la valeur a survécu au rechargement
```

L'étape 3 attrape les mutations fantômes. L'étape 5 attrape les optimistic updates sans rollback.

### Les 8 parcours

**P1 — Produit, cycle complet.** Créer via le wizard « Nouveau produit complet » les 6 étapes ; vérifier en base après chaque étape. Tester chaque option de chaque select (l'audit a trouvé `backorder` et `status` qui n'existent pas en base). Uploader 3 images, définir la principale, vérifier que la vignette du catalogue affiche bien celle-là. Réordonner les images, recharger, vérifier l'ordre. Créer un groupe de 3 variantes, définir un fournisseur et un prix d'achat communs, vérifier **en base** que les 3 produits ont été mis à jour. Vider un champ texte, vérifier qu'il vaut `NULL` et non `''`. Cliquer chaque lien de la fiche et de la liste, vérifier qu'aucun ne mène à un 404.

**P2 — Fournisseur, cycle complet.** Créer un fournisseur avec **chacune** des options de segment, une devise non-EUR (CNY), une adresse complète, un délai de livraison et un montant minimum de commande. Vérifier **en base** que les 4 champs sont persistés. Créer via la modale rapide avec un SIREN dupliqué et vérifier qu'un message d'erreur explicite apparaît. Ouvrir la fiche d'un fournisseur ayant plus de 50 produits, comparer le badge de l'onglet Produits au nombre réellement listé. Vérifier que le lien « Site internet fournisseur » s'affiche quand `organisations.website` est rempli.

**P3 — Rapprochement bancaire.** Le parcours le plus important. Pour chaque chemin d'accès au rapprochement (fiche facture, panneau de suggestions, modale depuis la commande, modale depuis le bon d'achat, page transactions) : rapprocher une transaction avec une facture, puis vérifier **en base** qu'une ligne existe dans `transaction_document_links`, que `bank_transactions.matching_status` a changé, que `financial_documents.amount_paid` est correct, et que `created_by` est renseigné. Rapprocher un virement de 5 000 € sur une facture de 1 200 €, puis vérifier que la transaction **réapparaît** dans la liste des candidats avec 3 800 € restants. Rapprocher un **débit** fournisseur et vérifier que `category_pcg` vaut 607 et non 707, et que l'onglet par défaut est « Fournisseurs ». Saisir un montant d'allocation de `0`, puis `abc`, puis un montant supérieur au reste dû : les trois doivent être refusés avec un message. Dérapprocher, vérifier le retour à l'état initial. Rechercher une transaction datant de plus de 50 mouvements et vérifier qu'elle est trouvée.

**P4 — Documents financiers et cohérence comptable.** Avec 1 100 transactions en base, ouvrir bilan, TVA, grand livre, compte de résultat, recettes, achats, annexe, clôture. Pour chacun, comparer le total affiché à une requête SQL de contrôle écrite indépendamment. Tout écart est un finding. Vérifier que la TVA inscrite sur une transaction partiellement allouée est bien au prorata. Vérifier qu'un taux de 5,5 % n'est pas arrondi à 6 %.

**P5 — Commande et envoi de documents.** Créer une commande pour le client B2B qui a **1 seul contact** : vérifier que la liste de destinataires est affichée et pré-remplie avec ce contact (c'est ton bug). Refaire avec le client qui en a 3. Créer une commande, vérifier **en base** que `billing_contact_id`, `delivery_contact_id` et `responsable_contact_id` sont renseignés. Ouvrir le modal d'envoi et vérifier qu'aucun document `deleted_at` ou `superseded` n'apparaît. Tenter un envoi sans pièce jointe cochée. Vérifier qu'après envoi, l'événement apparaît dans l'historique de la commande **standard** (pas seulement LinkMe) et que `sent_by` est renseigné. Tester les 4 autres points d'envoi (`QuotesSection`, `InvoicesSection`, page détail devis) et vérifier que les puces de contacts s'affichent. Tous les envois mockés.

**P6 — Marketing.** Chercher le bouton « Publier » que le Calendrier mentionne dans son texte d'aide ; documenter s'il existe. Générer un visuel, cliquer « Sauvegarder », vérifier que l'image enregistrée en bibliothèque est **identique** à celle affichée dans l'aperçu (comparaison de hash). Créer une 6ᵉ marque via `/parametres/marques` et vérifier si elle apparaît dans le Studio. Programmer une publication et vérifier son statut après 10 minutes. Sur la page Performance, sélectionner « 7 derniers jours » puis « 90 jours » et vérifier que les colonnes Meta et Google **changent** ; comparer le total du tableau à la somme des cartes KPI.

**P7 — Configuration du site internet.** Ouvrir l'onglet Configuration, mesurer le temps jusqu'à interactivité. Dans la carte des frais de port, taper une valeur et mesurer le délai avant que le caractère apparaisse. Enregistrer, recharger, vérifier la persistance. Vérifier le nombre de requêtes réseau et le poids total transféré. Changer d'onglet et revenir, mesurer si les données sont rechargées.

**P8 — Stock et cloisonnement des rôles.** Chaque parcours ci-dessus rejoué avec le `storageState` du collaborateur BO puis de l'affilié LinkMe : documenter tout accès qui ne devrait pas être possible. Créer un mouvement de stock et vérifier que les triggers ont bien mis à jour `products.stock_quantity` (sans jamais modifier les triggers).

### Prompt

```
---8<---
Phase 3 — parcours fonctionnels. Environnement de test uniquement, assertTestEnvironment().
Aucune modification de code applicatif. Aucun envoi d'e-mail réel : intercepte toutes les
routes api/emails/* avec page.route().

RÈGLE DE CONCEPTION OBLIGATOIRE pour chaque test. L'UI de ce back-office affiche "Succès"
sur des écritures qui n'ont pas lieu. Un test qui vérifie seulement le toast est inutile.
Chaque scénario doit donc faire, dans cet ordre :
  1. l'action UI
  2. assert sur le retour visuel
  3. assert EN BASE via le client Supabase de test : la ligne existe-t-elle, avec quelles valeurs
  4. rechargement de la page
  5. assert que la valeur a survécu au rechargement
L'étape 3 attrape les mutations fantômes, l'étape 5 les optimistic updates sans rollback.

Écris une suite par parcours dans tests/e2e/functional/ :

P1 produit-cycle-complet.spec.ts
P2 fournisseur-cycle-complet.spec.ts
P3 rapprochement-bancaire.spec.ts
P4 documents-comptables.spec.ts
P5 commande-envoi-documents.spec.ts
P6 marketing.spec.ts
P7 config-site-internet.spec.ts
P8 stock-et-roles.spec.ts

[Coller ici le détail du parcours concerné depuis la section "Les 8 parcours" du
plan-tests-playwright-2026-07-30.md]

Contraintes :
- une entité TEST-<runId>- par test, teardown en afterAll
- pour chaque select du formulaire, itère sur TOUTES les options et vérifie que
  l'enregistrement réussit — plusieurs options du back-office envoient des valeurs
  que l'enum Postgres refuse
- capture d'écran + trace Playwright sur chaque échec
- log des requêtes réseau en 4xx/5xx pendant chaque scénario
- ne t'arrête pas au premier échec d'un parcours, continue et collecte tout

À la fin, écris docs/scratchpad/test-run-<date>/findings-P<n>.md : un bloc par bug avec
titre, fichier:ligne suspecté (va lire le code pour le trouver), étapes de reproduction,
observé, attendu, sévérité CRITIQUE/MAJEUR/MINEUR, chemin de la capture.

Ne corrige rien.
---8<---
```

---

## Phase 4 — Régression sur les 12 bugs connus (2 h)

Un test par bug de la section 2 de l'audit. Ces tests doivent **échouer** aujourd'hui — c'est leur raison d'être. Ils deviennent la définition de « corrigé » et empêchent le retour du bug.

| #   | Bug                                      | Assertion qui doit échouer aujourd'hui                                |
| --- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1   | Endpoints Qonto ouverts                  | `GET /api/qonto/balance` sans cookie renvoie 401                      |
| 2   | `reset_finance_auto_data` exposée à anon | l'appel avec la clé anon (`p_dry_run: true`) est refusé               |
| 3   | `mark_payment_received` exposée à anon   | idem                                                                  |
| 4   | Relais mail ouvert                       | `POST /api/emails/form-reply` sans cookie renvoie 401                 |
| 6   | Webhook Packlink fail-open               | `POST /api/webhooks/packlink` sans secret renvoie 401                 |
| 7   | Affiliés lisent les coûts                | requête `cost_price` avec le JWT affilié renvoie 0 ligne ou 403       |
| 8   | Wizard produit                           | les 6 étapes aboutissent à un produit en base                         |
| 9   | Bouton Rapprocher                        | après clic, une ligne existe dans `transaction_document_links`        |
| 10  | PCG toujours 707                         | un débit rapproché a `category_pcg = '607'`                           |
| 11  | Bilan tronqué à 1 000                    | avec 1 100 transactions, le total du bilan = le total SQL de contrôle |
| 12  | Contacts commande                        | après création, `billing_contact_id` n'est pas NULL                   |

Plus les 3 bugs UX les plus visibles : liste de destinataires affichée avec 1 seul contact ; devise fournisseur persistée ; les ~40 liens `/catalogue/` ne renvoient pas 404.

### Prompt

```
---8<---
Phase 4 — tests de régression. Environnement de test, assertTestEnvironment().

Écris tests/e2e/regression/known-bugs.spec.ts. Un test par entrée du tableau
"Phase 4" du plan-tests-playwright-2026-07-30.md, plus les 3 bugs UX listés en dessous.

IMPORTANT : ces tests DOIVENT échouer aujourd'hui. C'est leur but. Chaque test porte
en commentaire le fichier:ligne de la cause identifiée à l'audit, pour que la personne
qui corrige sache où aller. Ne les marque pas test.skip, ne les rends pas passants
en adaptant l'assertion à la réalité actuelle : l'assertion décrit le comportement
ATTENDU.

Lance la suite et rends-moi le tableau : bug, test, échoue comme prévu OUI/NON.
Un "NON" signifie soit que le bug est déjà corrigé, soit que mon test ne le reproduit
pas — dis-moi lequel des deux et pourquoi.

Ne corrige aucun code applicatif.
---8<---
```

---

## Phase 5 — Budgets de performance (2 h)

Transformer « c'est lent » en chiffres qui régressent ou non.

### Budgets à poser

| Métrique                                                   | Budget     | Aujourd'hui (mesuré à l'audit)            |
| ---------------------------------------------------------- | ---------- | ----------------------------------------- |
| Time to interactive, page liste                            | < 1 500 ms | à mesurer                                 |
| Requêtes réseau par chargement de page                     | < 15       | sidebar seule : 13                        |
| Poids transféré par page                                   | < 800 kB   | config site : 497 kB pour une seule carte |
| Requêtes Supabase par chargement                           | < 8        | jusqu'à 22-33 en rafale Realtime          |
| Latence de frappe dans un champ de liste                   | < 50 ms    | inutilisable sur la carte frais de port   |
| `EXPLAIN ANALYZE` d'une RPC de liste                       | < 50 ms    | `get_site_internet_products` : 243 ms     |
| Scans séquentiels sur `user_app_roles` pour 20 navigations | < 200      | extrapolé : plusieurs milliers            |

Le dernier budget est le plus révélateur : mesurer `pg_stat_user_tables.seq_scan` avant et après un parcours de 20 pages donne un chiffre direct du coût de la RLS, et prouvera l'effet du correctif JWT.

### Prompt

```
---8<---
Phase 5 — budgets de performance. Environnement de test, assertTestEnvironment().

1. Écris tests/perf/budgets.spec.ts avec les budgets du tableau "Phase 5" du plan.
   Pour chaque page du top 20 des plus lentes remonté par la Phase 1, mesure :
   - time to interactive
   - nombre de requêtes réseau et poids total (page.on('response'))
   - nombre de requêtes vers /rest/v1/ ou /rpc/
   - pour les pages avec un champ de saisie dans une liste : latence entre keypress
     et apparition du caractère, sur 10 frappes, en médiane
   Écris les résultats dans docs/scratchpad/test-run-<date>/perf-baseline.json.
   Marque en échec ce qui dépasse le budget, mais continue.

2. Écris tests/perf/rls-cost.spec.ts :
   - lis pg_stat_user_tables.seq_scan pour user_app_roles et user_profiles
   - fais un parcours de 20 pages du back-office
   - relis les compteurs, calcule le delta
   - assert delta < 200 sur user_app_roles
   C'est la mesure directe du coût de la RLS. Conserve le chiffre : il servira à
   prouver l'effet du correctif.

3. Lance EXPLAIN (ANALYZE, BUFFERS) sur les 10 RPC les plus appelées par le
   back-office (trouve-les en grepant .rpc( dans apps/back-office et packages).
   Écris les plans dans perf-baseline.json.

4. Rends-moi un tableau : métrique, budget, valeur mesurée, écart, page/RPC concernée,
   trié par écart décroissant.

Ne corrige rien.
---8<---
```

---

## Phase 6 — Base de données : RLS et triggers (2 h)

Les 496 policies RLS et les 252 triggers ne sont couverts par aucun test. C'est là que vivent les règles métier les plus critiques (stock, commissions) et ce qui protège le cloisonnement entre le back-office, LinkMe et le site public.

### Prompt

```
---8<---
Phase 6 — tests de base de données sur la branche de test. Aucune requête vers la prod.

1. Installe pgTAP sur la branche de test. Écris supabase/tests/rls/ avec un fichier
   par table sensible : products, organisations, contacts, sales_orders,
   bank_transactions, financial_documents, transaction_document_links,
   linkme_commissions, user_app_roles, audit_logs.
   Pour chaque table et chaque rôle (anon, affilié LinkMe, collaborateur BO, owner BO),
   teste SELECT / INSERT / UPDATE / DELETE et assert le résultat attendu.
   Attendu : anon ne lit rien de sensible ; l'affilié LinkMe ne voit ni cost_price,
   ni margin_percentage, ni supplier_reference, ni aucune donnée financière.

2. Écris supabase/tests/views/security-invoker.sql : assert que TOUTE vue du schéma
   public a security_invoker = true. Ce test doit échouer aujourd'hui (19 vues sur 32
   ne l'ont pas) et lister nominativement les fautives.

3. Écris supabase/tests/functions/anon-exposure.sql : assert qu'aucune fonction
   prosecdef = true n'est exécutable par anon sans contenir dans son corps un appel
   à is_backoffice_user(), is_back_office_admin() ou auth.uid() utilisé comme contrôle.
   Doit échouer aujourd'hui et lister les fonctions.

4. Écris supabase/tests/triggers/stock.sql : teste le comportement des triggers stock
   (insertion d'un mouvement → stock_quantity mis à jour, alerte déclenchée au seuil,
   confirmation d'expédition Packlink → décrément). NE MODIFIE JAMAIS ces triggers,
   ils sont protégés par rules/stock-triggers-protected.md. Tu les testes, tu ne les
   touches pas.

5. Écris supabase/tests/functions/finance.sql : teste link_transaction_to_document
   et unlink_transaction_document — allocation partielle, allocation supérieure au
   reste dû, allocation de 0, double allocation, created_by renseigné.

6. Rends-moi le rapport pgTAP complet et, en tête, la liste des cloisonnements
   qui ne tiennent pas.
---8<---
```

---

## Phase 7 — Synthèse et remise en état (1 h)

```
---8<---
Phase 7 — synthèse.

1. Agrège tous les findings des phases 1 à 6 dans
   docs/scratchpad/test-run-<date>/RAPPORT-FINAL.md :
   - tableau de bord : nb de tests, passés, échoués, par phase
   - tous les findings dédupliqués, triés par sévérité, avec fichier:ligne
   - les findings qui contredisent l'audit du 2026-07-30 (bug non reproduit, ou
     bug plus grave que décrit) — signale-les explicitement, c'est important
   - les bugs NOUVEAUX que l'audit statique n'avait pas vus
   - perf-baseline.json commenté

2. Vérifie la remise en état : lance le teardown, puis compte en base tout ce qui
   est préfixé TEST-. Doit valoir 0. Vérifie qu'aucune écriture n'a eu lieu sur le
   projet de production (compare les compteurs pg_stat_user_tables.n_tup_ins avant/après
   si tu les as relevés au début).

3. Propose-moi un ordre de correction en 5 lots, chaque lot étant une PR vers staging
   de taille raisonnable, avec les tests de la Phase 4 correspondants comme critère
   de sortie. Ne crée aucune PR, ne committe rien : propose.

4. Dis-moi ce que tu recommandes de rendre bloquant en CI dès maintenant, et le coût
   en minutes de CI par PR.
---8<---
```

---

## Comment lancer tout ça

Deux options.

**En une seule session longue** (Claude Code tourne plusieurs heures) : donne-lui les 8 prompts d'affilée en lui demandant de ne passer à la phase suivante qu'après t'avoir rendu le rapport de la précédente. Avantage : contexte continu. Inconvénient : si une phase dérape, tout attend.

**En 8 sessions séparées** (recommandé) : une session par phase, chacune commençant par relire `docs/scratchpad/test-run-<date>/`. Avantage : tu valides entre chaque, et le contexte reste net. C'est aussi plus économe.

Dans les deux cas, mets ceci en tête de session :

```
Avant toute chose : lis .claude/work/ACTIVE.md, CLAUDE.md racine et
apps/back-office/CLAUDE.md. Puis lis docs/scratchpad/test-run-<date>/ pour savoir
où on en est. Tu es en phase de TEST : tu n'écris aucun code applicatif, tu ne
committes rien, tu ne crées aucune PR. Environnement de test exclusivement.
```

## Ordre de priorité si tu n'as que quelques heures

1. **Phase 0** — non négociable, sinon tu risques ta prod
2. **Phase 2** — 2 h, valide les findings de sécurité les plus graves, aucun navigateur nécessaire
3. **Phase 4** — 2 h, transforme les 12 bugs en tests qui empêchent leur retour
4. **Phase 1** — 1 h, filet large à coût nul
5. Le reste ensuite

Les phases 3, 5 et 6 sont celles qui apportent le plus de valeur à long terme, mais elles supposent que l'environnement de la Phase 0 est solide.
