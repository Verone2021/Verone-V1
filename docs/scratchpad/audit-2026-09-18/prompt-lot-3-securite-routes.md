# Prompt Claude Code — LOT 3 : fermer la porte d'entrée

`[BO-SEC-API-001]` — à découper en 3 PR vers `staging` (3.1 seule, puis 3.2, puis 3.3). Accord base pour 3.3.

## Constat mesuré le 18/09

| Application   | Routes |                   Sans aucune garde | Sans garde **et** qui écrivent |
| ------------- | -----: | ----------------------------------: | -----------------------------: |
| back-office   |    152 |                                  85 |                             32 |
| linkme        |     17 | 12 (middleware rattrape la plupart) |                              4 |
| site-internet |     25 |                                  20 |                              3 |

- Le back-office n'a **aucun** `middleware.ts`. LinkMe en a un qui refuse par défaut : c'est le modèle à copier.
- Le helper `requireBackofficeAdmin` existe et n'est utilisé que par **13 routes sur 152**.
- Le helper `verifyAuth` de `@verone/utils` n'est utilisé par **aucune** route : outil mort.

## 3.1 — Urgence, à traiter en premier et seul (1 h)

`apps/back-office/src/app/api/sales-orders/[id]/customer-address/route.ts` : ligne 16 `createAdminClient()`
(clé `service_role`, contourne toutes les règles de sécurité), **aucune** authentification. Nom, e-mail,
téléphone et adresse d'un client accessibles à qui devine un identifiant de commande. Donnée personnelle, RGPD.

- Ajoute `requireBackofficeAdmin` et repasse au client normal si le `service_role` n'est pas indispensable.
- Puis produis la liste **nominative** des 39 routes qui utilisent `createAdminClient()` : pour chacune,
  garde présente oui/non. Rends la liste à Roméo avant de corriger les autres.

## 3.2 — Middleware back-office, refus par défaut

Copie le modèle de `apps/linkme/src/middleware.ts` : liste blanche explicite, tout le reste exige une session
valide **et** un rôle actif `app='back-office'`.

Pièges connus, à prévoir dans la liste blanche :

- extension Chrome de sourcing, en `Authorization: Bearer` : `/api/brands`, `/api/sourcing/*` ;
- webhooks entrants : `/api/webhooks/packlink`, `/api/gmail/inbound` ;
- routes `cron` appelées par Vercel ;
- `/api/health`, `/login`, `/unauthorized`, les fichiers statiques.

**Avertissement issu de la tentative du 18/09** : un middleware a déjà été écrit puis retiré parce que le
serveur de production (`output: standalone`) ne chargeait pas son module — toutes les pages en 500. Cause
probable : `outputFileTracingRoot` dans un monorepo. Règle ce point **avant** de livrer, et prouve-le en
démarrant `node .next/standalone/.../server.js` en local, pas `next start`.

Corrige aussi les 6 routes `cron` sur 7 et le webhook Packlink qui **sautent la vérification du secret quand la
variable d'environnement est absente** (fail-open). Le modèle correct est `api/cron/google-merchant-poll` :
absence de secret = 500, jamais « laisse passer ».

## 3.3 — Base : 39 fonctions d'écriture ouvertes à tout compte connecté (accord écrit, heure creuse)

141 fonctions `SECURITY DEFINER` sont exécutables par le rôle `authenticated` ; **39 d'entre elles écrivent et
n'ont aucun contrôle interne**. Un affilié LinkMe connecté est un compte `authenticated` : son jeton est
cryptographiquement valide pour la même base.

Liste mesurée le 18/09 : `delete_order_payment`, `update_google_merchant_price`, `update_meta_commerce_price`,
`toggle_google_merchant_visibility`, `toggle_meta_commerce_visibility`, `remove_from_google_merchant`,
`remove_from_meta_commerce`, `batch_add_google_merchant_products`, `batch_add_meta_commerce_products`,
`auto_classify_all_unmatched`, `link_transaction_to_document`, `unlink_transaction_document`,
`apply_matching_rule_confirm`, `auto_match_bank_transaction`, `recalculate_order_paid_amount`,
`update_user_contact`, `validate_sourcing_draft`, `increment_promo_usage`, `archive_address`, et les fonctions
de mouvements prévisionnels et de verrous de synchronisation.

Pour chacune : soit une garde interne (`is_backoffice_user()` ou équivalent en tête de fonction), soit un
`REVOKE EXECUTE FROM authenticated`. Les fonctions qui ne servent que de déclencheur n'ont rien à faire dans
l'API REST : révoque-les.

Traite aussi : la vue `linkme_public_products` en `SECURITY DEFINER` (seule erreur des advisors), les 7 fonctions
au `search_path` modifiable, et la fonction `get_user_role()` appelée par `user_has_access_to_organisation()`
mais **inexistante** — toute requête `anon` sur `purchase_orders`, `purchase_order_items` ou `stock_movements`
part en erreur à cause d'elle.

## 3.4 — Secrets dans l'historique git — **REPORTÉ par Roméo le 18/09, ne rien entreprendre**

Commit `170aecf0`, ancêtre de `main` : 3 fichiers `.env.local.backup-*` contenant `SUPABASE_SERVICE_ROLE_KEY`,
`GH_TOKEN`, `VERCEL_TOKEN`, `QONTO_API_KEY`. Supprimés du répertoire par `b07283b7`, **toujours récupérables**.

Ordre impératif : migrer d'abord vers les nouvelles clés Supabase, vérifier les 3 applications, **puis**
révoquer les anciennes, **puis** purger l'historique. Dans l'autre ordre, les 3 applications tombent.
Prépare le plan, Roméo choisit le créneau.

## Vérification

Après 3.2 : rejoue le test d'accès en rôle `anon` et avec un jeton LinkMe sur 10 routes back-office
représentatives. Attendu : 401 ou 403 partout, sauf la liste blanche. Preuve dans le rapport.
