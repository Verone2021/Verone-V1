# Audit back-office Vérone — 30 juillet 2026

> **Note de révision (même jour).** Trois points de ce rapport ont été corrigés après vérification directe de la CI et du code, dans la version qui suit :
>
> 1. Les trois jobs E2E ne sont pas seulement non-bloquants : ils sont **désactivés en dur** par `if: false &&` (`quality.yml` lignes 283, 327, 552). Ils ne tournent pas du tout.
> 2. Le gate `supabase-advisors-security` tourne, mais sa baseline (`scripts/supabase-advisors-baseline.json`) **accepte déjà comme normal** 315 fonctions exposées à `anon`, 48 policies `always-true`, 14 vues SECURITY DEFINER, `auth_users_exposed` et `public_bucket_allows_listing`. Le gate valide l'état vulnérable.
> 3. Sentry n'est **pas configuré** : `NEXT_PUBLIC_SENTRY_DSN` existe dans `.env.local`, il n'y a aucune ligne de code Sentry dans le back-office. Le rapport initial disait « déjà configuré », c'était faux.
>
> Conséquence méthodologique, développée dans `PLAN-CORRECTION.md` : l'outillage de détection existe déjà et il est débranché. Rebrancher les gates passe **avant** de corriger les bugs.

Périmètre : `apps/back-office` + les 26 packages `@verone/*` qu'il consomme, la base Supabase `verone-backoffice` (`aorroydfjsrygmosnzrl`, lecture seule), les 770 migrations SQL et le dispositif de tests.

Méthode : analyse statique du monorepo (3 169 fichiers TS/TSX, 588 068 lignes), lecture de code ciblée sur 6 axes en parallèle, mesures réelles sur la base de production (`pg_stat_user_tables`, `EXPLAIN ANALYZE`, advisors Supabase), aucune écriture nulle part.

---

## 1. Verdict

### **22 / 100**

| Axe                        | Poids | Note   | Ce qui plombe                                                                                                    |
| -------------------------- | ----- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| Sécurité                   | 25 %  | **17** | 86 routes API sur 151 ouvertes sans authentification, dont les endpoints bancaires Qonto                         |
| Stabilité fonctionnelle    | 25 %  | **24** | Fonctionnalités qui échouent en silence : création produit, devise fournisseur, rapprochement, contacts commande |
| Performance                | 20 %  | **22** | 256 millions de scans séquentiels sur une table de 9 lignes ; `force-dynamic` sur le layout racine               |
| Scalabilité / architecture | 15 %  | **28** | 4 copies divergentes des types DB, 13 cycles entre packages, schéma non reconstructible                          |
| Qualité de code & tests    | 15 %  | **20** | 1 % du code est du test, les E2E ne bloquent pas le merge, auto-merge activé                                     |

Référentiel de notation : ce qu'un CTO exigerait d'une application qui manipule de l'argent (rapprochement bancaire, TVA, commissions) et des données personnelles de clients. Pas ce qu'on attend d'un prototype.

### Le diagnostic en une phrase

Le back-office est **fonctionnellement ambitieux et structurellement solide en apparence** — monorepo propre, 26 packages, Turborepo, documentation générée, ADR, règles écrites — mais il repose sur **trois défauts de fond** qui expliquent l'essentiel de ce que tu as ressenti hier :

1. **Il n'y a aucune barrière d'entrée sur l'API.** Il n'existe pas de `middleware.ts` dans le back-office. Chaque route doit se protéger elle-même ; 86 ne le font pas. Tes soldes bancaires, tes transactions, tes marges et les adresses de tes clients sont accessibles par une simple requête HTTP depuis Internet. Ce n'est pas un risque théorique, c'est l'état actuel.

2. **Les erreurs ne remontent jamais à l'écran.** Le motif `const { data } = await supabase...` sans lire `error` apparaît partout, ainsi que `catch { console.error }` sans toast. Résultat : quand une écriture échoue, l'interface affiche « Succès », la valeur revient à l'ancienne, et tu conclus « ça ne marche pas » sans jamais savoir pourquoi. C'est exactement le symptôme « erreurs silencieuses » que tu as décrit.

3. **La vérification des droits se fait en base, à chaque ligne lue.** `is_backoffice_user()` est appelée sans wrapper `(SELECT ...)` dans 216 policies RLS. Postgres la réévalue **une fois par ligne examinée**. Mesure sur ta prod : `user_app_roles`, 9 lignes, **255 941 505 scans séquentiels** et 1,3 milliard de tuples lus. C'est la cause première de la lenteur généralisée.

### Ce qui est bien fait, et qu'il ne faut pas casser

- RLS activée sur les **133 tables sur 133**. La discipline existe, c'est son réglage qui est faux.
- Aucune fuite de la service role key côté client, zéro `dangerouslySetInnerHTML`, zéro secret en dur dans le code.
- `tsc --noEmit` passe sur tout le monorepo, zéro `@ts-ignore`, seulement 96 `any` pour 588 000 lignes.
- Un outillage d'audit déjà en place (`knip`, `madge`, `jscpd`, `type-coverage`, cspell, husky, lint-staged) — il n'est simplement pas branché sur la CI de façon bloquante.
- Le fichier `finance-totals/__tests__/compute.test.ts` (598 lignes) prouve que le projet sait écrire de bons tests. Il y en a 6.

---

## 2. Les 12 choses à corriger cette semaine

Classées par ratio dégât évité / effort. Les 5 premières sont des urgences absolues.

| #   | Problème                                                                                                                                                                                                                       | Où                                                                                 | Effort |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- | ------ |
| 1   | Tes données bancaires sont publiques : `GET /api/qonto/balance`, `/api/qonto/transactions`, `/api/qonto/clients` répondent sans aucun cookie                                                                                   | `api/qonto/balance/route.ts:53`, `transactions/route.ts:27`, `clients/route.ts:55` | 1 h    |
| 2   | Un anonyme peut détruire ta compta : `reset_finance_auto_data(p_dry_run=false)` est une RPC `SECURITY DEFINER` exécutable par le rôle `anon` — elle supprime des organisations et désactive toutes les règles de rapprochement | `20260430_sec_sdf_funcs_006...sql:126`                                             | 30 min |
| 3   | Un anonyme peut marquer une commande payée et valider les commissions LinkMe : `mark_payment_received` exposée à `anon` sans garde. 36 RPC dans ce cas                                                                         | même migration, whitelist                                                          | 2 h    |
| 4   | Relais mail ouvert : `POST /api/emails/form-reply` envoie un HTML arbitraire depuis `contact@veronecollections.fr`, SPF/DKIM valides. Phishing prêt à l'emploi, et blacklist de ton domaine à la clé                           | `api/emails/form-reply/route.ts:70,128`                                            | 1 h    |
| 5   | `.env.local` n'est pas dans `.gitignore` (celui du back-office contient 8 octets : `.vercel`). Il contient en clair la service role key, la clé Qonto, Packlink, Cloudflare, Resend, Gemini                                    | `apps/back-office/.gitignore`                                                      | 15 min |
| 6   | Webhook Packlink en fail-open : le secret n'est vérifié que s'il est défini, et il n'est pas défini. Un POST anonyme déclenche le trigger stock et décrémente ton inventaire réel                                              | `api/webhooks/packlink/route.ts:24-33`                                             | 30 min |
| 7   | Les affiliés LinkMe peuvent lire `cost_price`, `margin_percentage`, `supplier_reference` et `supplier_page_url` de **tout** ton catalogue avec leur propre compte                                                              | `20260314220000_fix_products_rls_collaborateur_read.sql:6`                         | 3 h    |
| 8   | Le wizard « Nouveau produit complet » ne peut **rien** enregistrer : il envoie une colonne `status` qui n'existe pas dans `products`, et des chaînes vides sur des colonnes `uuid`                                             | `useCompleteProductWizard.ts:156,181,203,253`                                      | 2 h    |
| 9   | Le bouton « Rapprocher » de la fiche facture ne crée aucun lien en base : il marque seulement la facture payée chez Qonto. Tu cliques, tu vois « Rapprochement effectué », la page recharge, rien n'a changé                   | `api/qonto/invoices/[id]/reconcile/route.ts:112-124`                               | 4 h    |
| 10  | Toute classification comptable automatique tombe en 707 (ventes), y compris sur les débits fournisseurs : le code teste `amount > 0` alors que Qonto renvoie toujours un montant positif avec la direction dans `side`         | `use-rapprochement-actions.ts:80-85`                                               | 1 h    |
| 11  | Le bilan, la TVA et le grand livre sont calculés sur les **1 000 premières** transactions (limite implicite Supabase, aucun `.range()`). Au-delà, les totaux sont faux sans aucun avertissement                                | `use-bank-reconciliation.ts:108-128`                                               | 3 h    |
| 12  | Aucune commande client standard ne se voit attribuer de contact : les 3 colonnes FK ne sont même pas dans l'INSERT. C'est la cause racine de ton bug « le contact ne s'affiche pas »                                           | `use-sales-orders-mutations-write.ts:82-110`                                       | 3 h    |

---

## 3. Sécurité — 17 / 100

### Mesures

| Métrique                                                    | Valeur                                    |
| ----------------------------------------------------------- | ----------------------------------------- |
| Routes API totales                                          | 151                                       |
| Routes avec une vérification d'auth quelconque              | 59 (39 %)                                 |
| Routes avec vérification de **rôle**                        | 14 (9,3 %)                                |
| Routes **sans aucune** vérification                         | **86 (57 %)**                             |
| Routes de mutation (POST/PUT/PATCH/DELETE)                  | 115                                       |
| Routes de mutation sans aucune vérification                 | **62 (54 %)**                             |
| Routes avec schéma Zod                                      | 36 (24 %)                                 |
| `middleware.ts` dans `apps/back-office`                     | **0**                                     |
| Fichiers utilisant la service role key                      | 13 en direct + 48 via `createAdminClient` |
| Routes service-role **sans auth**                           | **31**                                    |
| Vues SQL sans `security_invoker`                            | **19 / 32**                               |
| RPC `SECURITY DEFINER` exécutables par `anon`               | **332** (advisor Supabase)                |
| Policies RLS avec `WITH CHECK` toujours vrai                | 6                                         |
| Écritures applicatives dans `audit_logs`                    | **0**                                     |
| `withApiSecurity` (le middleware maison) réellement branché | **1 route sur 151**                       |

### Le problème de structure

`src/app/api/**` est un frère de `src/app/(protected)/**`. Le layout `(protected)/layout.tsx` qui vérifie le rôle **ne s'applique donc jamais aux routes API**. Sans middleware global, la sécurité est une convention par fichier. Elle n'est pas tenue.

Aggravant : les trois apps partagent le même cookie Supabase (`sb-<ref>-auth-token`), documenté noir sur blanc dans `packages/@verone/utils/src/supabase/server.ts:6-8`. Les 45 routes qui font `getUser()` **sans** vérifier `user_app_roles.app='back-office'` sont donc atteignables par un affilié LinkMe légitime qui repose son cookie sur le domaine du back-office. Exemple concret : `POST /api/exports/products` lui rend un Excel avec `cost_price` et `margin` de tout le catalogue.

### Exploits vérifiés dans le code

Chacun a été confirmé par lecture du fichier, pas déduit.

**Exfiltration de facture vers une adresse choisie** — `api/qonto/invoices/[id]/send/route.ts:30,48,66` : pas de Zod, pas de `getUser()`, `emails` vient du body et part chez Qonto tel quel. Les UUID de factures sont énumérables via `GET /api/qonto/invoices`, également ouvert.

**PII clients par UUID de commande** — `api/sales-orders/[id]/customer-address/route.ts:35` : `createAdminClient()` (RLS contournée), pas de validation de l'UUID, pas d'auth. Renvoie nom, e-mail, téléphone, adresse postale. Violation RGPD directe.

**Export catalogue complet** — `api/exports/google-merchant-excel/route.ts:178` : la seule « garde » est le feature flag `NEXT_PUBLIC_GOOGLE_MERCHANT_SYNC_ENABLED`, donc public par définition. `select('*')` sur `products` en service role = 99 colonnes dont tous les coûts.

**Cron fail-open** — `api/cron/sync-comptabilite/route.ts:42` et `meta-commerce-sync/route.ts:37` : `if (cronSecret) { ... }` avec `CRON_SECRET` absent de `.env.local`. `google-merchant-poll/route.ts:72` fait l'inverse (fail-closed) — l'incohérence prouve l'oubli, pas le choix.

**Journal d'audit falsifiable** — `api/analytics/events/route.ts:57` : `request.json()` casté sans Zod, `action`, `table_name`, `record_id`, `old_data`, `severity` sont libres. N'importe quel utilisateur connecté peut fabriquer une fausse piste d'audit. En parallèle, `audit_logs` n'est écrite **par aucun code applicatif** : aucune action sensible n'est traçable.

**Route `/api/logs`** — `route.ts:98` : le GET renvoie à un anonyme tous les logs d'erreurs du jour (chemins internes, messages Supabase). Le POST écrit sur le disque de la fonction serverless.

**Injection de filtre PostgREST** — `use-supplier-search.ts:37`, `ActivateExistingForm.tsx:69` : `.or(\`trade_name.ilike.%${q}%\`)`avec`q`non échappé. Saisir`x,archived_at.not.is.null`ajoute une clause OR arbitraire. Borné par la RLS aujourd'hui, critique dès que le motif est copié dans une route service-role. Le bon motif existe déjà dans`use-media-assets.ts:120`.

### Correctifs

**Immédiat (aujourd'hui)** : ajouter `.env*` au `.gitignore` racine ; vérifier `git log --all -- '*.env.local'` et faire tourner les 8 secrets si une trace existe.

**Cette semaine** : créer `apps/back-office/src/middleware.ts` avec `matcher: ['/api/:path*']`, qui rejette **401 par défaut** et n'autorise que ce qui est explicitement en allow-list (`/api/health`, `/api/webhooks/*`, `/api/cron/*`, `/api/csp-report`). C'est le correctif à plus fort levier de tout cet audit : il ferme 86 trous d'un seul fichier. Y brancher aussi les en-têtes de sécurité de `src/lib/security/headers.ts` (aujourd'hui inutilisés) et le rate limiting.

**Ce mois** : `REVOKE EXECUTE ... FROM anon` sur les 36 RPC de la whitelist + `IF NOT is_backoffice_user() THEN RAISE EXCEPTION` en tête de chaque RPC staff ; `ALTER VIEW ... SET (security_invoker = true)` sur les 19 vues ; vue `linkme_catalog_products_safe` pour couper l'accès des affiliés aux colonnes de coût ; helper `logAudit()` appelé dans chaque route de mutation, ou triggers `AFTER` en base (seule source non falsifiable).

**Test CI à ajouter** : échouer si une fonction `prosecdef` est exécutable par `anon` sans garde interne, et si une vue `public` n'a pas `security_invoker = true`.

---

## 4. Stabilité fonctionnelle — 24 / 100

C'est la section qui répond directement à « beaucoup d'éléments ne fonctionnaient pas ou fonctionnaient mal ». Tes intuitions étaient toutes justes, et les causes sont plus profondes que ce que tu voyais.

### Le motif transversal : l'erreur avalée

Trois formes, présentes partout :

```ts
const { data } = await supabase.from('x')...   // `error` jamais lu (33 occurrences)
if (data) { ... }                              // sur erreur → on saute, l'UI affiche "vide"
```

```ts
catch (e) { console.error(e); }                 // 2 417 console.error, aucun toast
```

```ts
void doSomething().catch(() => undefined); // échec effacé
```

Conséquence systématique : **une erreur ressemble à un résultat vide**. « Aucun produit associé à ce fournisseur » et « la requête a échoué » produisent le même écran. Tu ne peux structurellement pas diagnostiquer quoi que ce soit.

### Rapprochement bancaire — le module le plus abîmé

**Le bouton ne rapproche pas.** `api/qonto/invoices/[id]/reconcile/route.ts:112` appelle `markClientInvoiceAsPaid(id)` chez Qonto et s'arrête là. Aucune ligne dans `transaction_document_links`, aucun `matching_status`, aucun `amount_paid`. Le modal affiche « Rapprochement effectué » puis `window.location.reload()`. Côté back-office : rien n'a bougé. Le commentaire du code dit « verify it exists and has matching amount » — il n'y a aucun contrôle de montant.

**Un rapprochement partiel fait disparaître la transaction.** Le RPC passe `matching_status = 'manual_matched'` dès le premier lien, la vue calcule `unified_status = 'matched'`, et **tous** les écrans de candidats filtrent sur `['to_process','classified']`. Un virement groupé de 5 000 € affecté à une facture de 1 200 € n'apparaît plus jamais : les 3 800 € restants sont inaccessibles. C'est pourtant le cas d'usage documenté de la table.

**Le panneau de suggestions alloue le montant total du virement**, sans regarder le reste dû, alors que le hook calcule `remaining` juste au-dessus. Et le scoring court-circuite à `score 100 / excellent` dès que le numéro de facture apparaît dans le libellé, **sans contrôle de montant** — or « Tout valider » ne traite que les `excellent`. Un virement de 9 000 € portant la référence d'une facture de 500 € part à 9 000 €, la commande passe `overpaid`, le reste devient inutilisable.

**La synchro Qonto ignore toute mise à jour après le premier import.** `qonto-sync-upsert.ts:48` écrase `updated_at` avec `Date.now()`, puis la ligne 71 compare `updated_at` Qonto à cette valeur locale toujours plus récente → `skipped`, toujours. Les justificatifs, libellés corrigés et TVA OCR ne redescendent jamais. C'est pourquoi « Transactions sans facture » reste peuplé même après avoir attaché le PDF côté Qonto.

**Toute dépense est classée en 707 (ventes).** `amount > 0 ? '707' : '607'` — mais Qonto renvoie toujours un montant positif, la direction est dans `side`. Le code d'affichage reconstruit d'ailleurs le signe lui-même (`TransactionList.tsx:284`). Ton grand livre et ta TVA sont faux, et l'échec est dans un `void ... .catch(console.warn)`.

Même cause pour l'onglet par défaut du modal : `if (amount < 0) setActiveTab('purchase_orders')` n'est jamais vrai, donc rapprocher un débit fournisseur ouvre l'onglet « Clients », où rien ne correspond.

**La TVA écrite sur la transaction ignore le montant alloué.** Un acompte de 500 € sur une facture de 1 000 € inscrit 833,33 € de HT et 166,67 € de TVA sur un mouvement de 500 €. Et `Math.round(rate)` transforme 5,5 % en 6 % et 2,1 % en 2 %. Ta déclaration de TVA, construite depuis `bank_transactions.amount_vat`, est fausse.

**La recherche de transaction ne regarde que 50 mouvements.** `api/qonto/transactions/route.ts:38` applique le filtre de montant **après** la pagination, sur une seule page de 50. Pour une facture payée il y a plus de 50 mouvements, le modal affiche « Aucune transaction trouvée » alors que le virement existe. C'est le symptôme direct de ce que tu as vécu.

**380 lignes de code mort qui divergent.** `app/actions/bank-matching.ts` implémente un rapprochement complet, incompatible avec le RPC réel, et n'est appelé par personne. `use-bank-reconciliation.ts:456` expose un `matchTransaction` qui retourne `{ success: true }` sans rien faire. Deux pièges armés.

**Aucune traçabilité.** `transaction_document_links.created_by` existe et n'est jamais renseignée par le RPC. Ses policies RLS sont `USING (true)` pour tout `authenticated`.

### Produits et fournisseurs

**Le wizard de création complète ne peut rien enregistrer.** Il envoie `status: 'coming_soon'` — cette colonne n'existe pas dans `products` (il y a `product_status`, `stock_status`, `sourcing_status`, `completion_status`). Et `x ?? undefined` ne filtre pas `''`, donc `subcategory_id: ''` part vers une colonne `uuid` → `22P02`. Deux toasts contradictoires s'affichent (l'erreur Postgres brute, puis « Brouillon sauvegardé »), la navigation avale l'échec, tu remplis les 6 étapes et tu reçois « Aucun produit à finaliser ». Tout est perdu.

**Deux options du select de segment fournisseur sont invalides.** L'UI propose `TACTICAL` et `OPERATIONAL` ; l'enum Postgres ne les connaît pas. L'enregistrement complet échoue avec un `alert('Erreur lors de la sauvegarde. Veuillez réessayer.')` qui ne dit pas pourquoi. Symétriquement, le badge de segment n'affiche rien pour 5 valeurs valides de la base (`preferred`, `artisan`, `approved`…) : tu crois la classification perdue.

**La devise et l'adresse du fournisseur ne sont jamais enregistrées.** `use-organisations-crud.ts` : ni `currency`, ni `address_line1/2`, `postal_code`, `city`, `region` ne figurent dans l'objet `insert` ni dans `allowedFields`. Le select « Devise » est bien affiché, les colonnes existent en base. Tu choisis CNY pour un fournisseur chinois, tu valides, tout paraît normal — ça reste EUR. Même sort pour `delivery_time_days`, `minimum_order_amount`, `preferred_supplier`, `rating`.

**Le sélecteur de fournisseur du wizard crashe au clic.** `SupplierSection.tsx:47` passe `value`/`onChange` là où le composant attend `selectedSupplierId`/`onSupplierChange`, avec un `as any` qui masque l'erreur de type. `onSupplierChange is not a function`.

**Environ 40 liens produit mènent à un 404.** `/catalogue/${id}` au lieu de `/produits/catalogue/${id}` — depuis les fiches fournisseur, l'inventaire, les mouvements de stock, les alertes, les variantes, les collections.

**La page détail produit existe en deux exemplaires de 66 fichiers.** Le catalogue mène à la version amputée : pas de contrôle de visibilité LinkMe, pas de section Disponibilité fournisseur. 6 fichiers ont déjà divergé.

**Le compteur « Produits » de la fiche fournisseur est calculé sur les 50 derniers produits du catalogue entier**, puis filtré en mémoire. Un fournisseur avec 200 produits anciens affiche « 0 » sur un onglet qui en liste 200.

**La propagation des propriétés communes d'un groupe de variantes échoue en silence.** Tu définis un fournisseur ou un prix d'achat commun à 12 variantes, tu vois « Succès », les 12 produits ne sont pas modifiés. Idem pour le réordonnancement des images : `Promise.all` sur des builders Supabase ne rejette jamais, donc l'ordre revient en arrière sans message.

**Quatre filtres déclarés ne sont jamais appliqués** : `category_id`, `family_id`, `min_price`, `max_price`. La liste s'affiche non filtrée, sans erreur.

**La vignette du catalogue ignore `is_primary`.** Le champ est sélectionné puis `[0]` est pris tel quel. Tu repositionnes l'image principale, la liste ne change pas. Le bon code existe dans `use-product.ts:87`.

### Commandes, contacts, e-mails

Ton bug précis, décortiqué. Trois causes empilées :

1. **Aucune commande client standard n'a de contact.** `use-sales-orders-mutations-write.ts:82` n'insère ni `billing_contact_id`, ni `delivery_contact_id`, ni `responsable_contact_id` — le type d'entrée ne les déclare même pas, et le formulaire n'a aucun sélecteur de contact. Seul le parcours LinkMe les renseigne.
2. **Le modal ne cherche jamais les contacts de l'organisation.** `useOrderDetailData.ts:251` lit 2 FK sur 3 (`responsable_contact` est joint mais ignoré) et retombe sur `organisations.email`, colonne le plus souvent vide en B2B puisque les e-mails vivent dans la table `contacts`. Aucune requête `contacts WHERE organisation_id = ...`. Le bon modèle existe dans `factures/[id]/use-document-detail.ts:111`.
3. **La liste déroulante ne s'affiche que s'il y a strictement plus d'un contact.** `SendOrderDocumentsModal.tsx:104` : `contacts.length > 1 ? <Select> : <Input>`. Avec un seul contact, aucune liste n'apparaît — « on ne peut pas le sélectionner même s'il est déjà dans la commande », mot pour mot.

Et 4 autres points d'envoi (`QuotesSection`, `InvoicesSection`, `DevisDialogs`) ne passent pas la prop `contacts`, donc les puces de destinataires sont invisibles.

Autres défauts de la chaîne e-mail : le modal liste les devis **supprimés ou périmés** (aucun filtre `deleted_at`/`quote_status`, contrairement au reste du code) ; `sentBy` n'est jamais transmis donc tous les envois sont anonymes en base ; l'insertion de la trace n'est jamais vérifiée ; sur 3 destinataires dont 1 en échec, le modal se ferme et tu ne sais pas lequel a échoué, sans possibilité de relance ; on peut envoyer un e-mail « Veuillez trouver ci-joint les documents » sans aucune pièce jointe ; aucune borne sur la taille cumulée des pièces en base64 (échec 413 opaque) ; les e-mails de suivi d'expédition sont écrits dans une promesse flottante juste avant le `return` d'une fonction serverless, et leur `event_type` n'est pas dans la table de correspondance de l'historique — donc invisible même quand l'insert réussit.

### Marketing — « très bafouée » est exact

**Le cross-posting n'est branché nulle part.** `CrossPostModal.tsx` (286 lignes, mutation fonctionnelle) est exporté et n'a **aucun consommateur**. La page Calendrier affiche pourtant : « Programme une publication depuis la bibliothèque images via le bouton "Publier" ». Ce bouton n'existe pas. Le Calendrier est structurellement vide.

**La publication automatique est morte.** Une migration programme deux cron jobs qui appellent `invoke_edge_function('run-scheduled-publications')`. Il n'y a **aucun dossier `supabase/functions/`** dans le dépôt. Une publication « programmée » garde son badge bleu indéfiniment, sans timeout, sans passage en `failed`. L'UI l'admet — mais seulement dans l'état vide, l'avertissement disparaît dès qu'une ligne existe.

**Cliquer « Sauvegarder » après un aperçu relance une génération Gemini.** Le schéma de requête n'a aucun champ pour transmettre l'image déjà générée, et la route appelle Gemini avant de brancher sur `saveImmediately`. L'image enregistrée n'est donc pas celle que tu as validée (Gemini est non déterministe), et chaque sauvegarde est facturée deux fois.

**Les marques sont en dur dans le package.** `type BrandSlug = 'verone' | 'bohemia' | 'solar' | 'flos' | 'linkme'`, palettes et mots-clés dans `data/brands.ts`, et le Zod côté API rejette tout autre slug. Or la table `brands` est éditable via `/parametres/marques` et le menu Marketing y renvoie. Une 6ᵉ marque créée là est invisible dans le Studio, sans aucun message.

**La page Performance ignore le sélecteur de période pour Meta et Google.** `useMetaCommerceProducts()` et `useGoogleMerchantProducts()` ne prennent aucun paramètre de période : ce sont des cumuls depuis toujours. Sur « 7 derniers jours », les colonnes Meta et Google affichent l'historique complet, seule la colonne Site change. Le « Total HT » et l'export CSV sont donc faux — alors que les 4 cartes KPI juste au-dessus sont, elles, correctement filtrées. Deux chiffres contradictoires sur le même écran. Le hook qui aurait résolu ça (`useChannelStatsProductHistory`) existe et n'est appelé par personne.

---

## 5. Performance — 22 / 100

### Mesures sur ta prod

| Mesure                                                  | Valeur                                                     |
| ------------------------------------------------------- | ---------------------------------------------------------- |
| `user_app_roles` (9 lignes) — scans séquentiels         | **255 941 505** / 1 318 222 852 tuples lus                 |
| `user_profiles` (8 lignes) — scans séquentiels          | **32 893 282**                                             |
| Policies appelant `is_backoffice_user()` **non wrappé** | **216** (0 wrappé)                                         |
| Planning time d'un simple `count(*)`                    | 5,2 ms, 1 972 buffers de planification                     |
| RPC `get_site_internet_products()`                      | **243 ms**, 12 709 buffers, 177 lignes, **497 kB de JSON** |
| Index sur 133 tables                                    | 911, dont **243 jamais utilisés**                          |
| Clés étrangères sans index                              | 27                                                         |
| Policies « multiples permissives » (évaluées en série)  | 251                                                        |
| Pages `'use client'`                                    | **154 / 168 (92 %)**                                       |
| `loading.tsx` dans tout l'App Router                    | **0**                                                      |
| `unstable_cache` / `revalidateTag`                      | **0**                                                      |
| `export const dynamic = 'force-dynamic'`                | 18 fichiers, **dont le layout racine**                     |
| `.range()` (pagination serveur)                         | **0** dans 3 169 fichiers                                  |
| `await supabase` séquentiels / `Promise.all`            | **805 / 60**                                               |
| Fichiers ≥ 4 `await supabase` sans aucun `Promise.all`  | **66**                                                     |
| Boucles contenant un `await supabase` (N+1)             | 45                                                         |
| `React.memo` pour ~2 000 composants                     | **11**                                                     |
| Librairie de virtualisation                             | **0**                                                      |
| `optimizePackageImports` dans `next.config.js`          | **absent**                                                 |
| Imports depuis le barrel `@verone/ui` (160 composants)  | 1 131                                                      |

### La cause n°1 : la RLS relue à chaque ligne

`is_backoffice_user()` est une fonction `STABLE SECURITY DEFINER` qui fait `SELECT EXISTS (SELECT 1 FROM user_app_roles WHERE user_id = auth.uid() ...)`. Sans wrapper `(SELECT is_backoffice_user())`, Postgres ne peut pas la sortir de la boucle : **elle est réévaluée pour chaque ligne examinée**. `sales_orders` a 6 policies qui l'appellent, `linkme_payment_requests` en a 7. Un `SELECT` de 180 commandes peut déclencher jusqu'à 1 080 exécutions, chacune scannant la table.

Un wrapping global a déjà été tenté et **rollbacké le 2026-05-08** (`20260508060000_rollback_bo_rls_perf_002_003.sql`) après incident. Ne recommence pas par là.

Le correctif sans risque est de **sortir le rôle de la base** : mettre l'appartenance back-office dans `raw_app_meta_data` de l'utilisateur (via un trigger sur `user_app_roles`), puis réécrire la fonction en lecture pure du JWT, sans aucune I/O :

```sql
CREATE OR REPLACE FUNCTION is_backoffice_user() RETURNS boolean
  LANGUAGE sql STABLE PARALLEL SAFE AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'bo_active')::boolean, false);
$$;
```

La signature ne change pas, donc **aucune des 216 policies n'est à modifier** — zéro risque de replanification massive. Gain attendu : suppression de 100 % des 256 millions de scans. C'est le plus gros gain de perf du projet, pour une migration de 20 lignes.

### La cause n°2 : Next.js configuré pour ne rien mettre en cache

`export const dynamic = 'force-dynamic'` sur `src/app/layout.tsx:23` est **hérité par les 168 pages**. Combiné à **zéro `loading.tsx`** et deux `Suspense` dans tout le repo, cela produit exactement ton ressenti « je clique et rien ne se passe pendant 1-2 s » :

- Le prefetch automatique des `<Link>` ne peut prefetcher qu'un shell `loading.tsx` — il n'y en a aucun, donc les 361 liens de navigation ne prefetchent rien.
- `staleTimes.dynamic` vaut 0 par défaut en Next 15 et n'est pas configuré : le Router Cache client ne réutilise jamais un payload, même au bouton retour.
- Sans `Suspense`, l'écran reste figé sur la page précédente pendant tout l'aller-retour.

À quoi s'ajoute que **154 pages sur 168 sont `'use client'`** : le serveur ne renvoie qu'un squelette et toutes les données partent du navigateur après hydratation. La chaîne minimale d'un chargement est : aller-retour RSC non prefetché → hydratation du bundle → `getSession()` d'`AuthWrapper` (composant client monté au-dessus de tout, qui **bloque l'arbre entier** derrière un splash « VÉRONE ») → 13 requêtes sidebar/header → requêtes de la page → chunk lazy de l'onglet → requêtes de l'onglet. Chaque maillon ajoute un aller-retour réseau complet, plus 5 ms de planning RLS.

### Pourquoi la configuration du site internet est lente, précisément

Tu as pointé cette page en particulier. Voici la mécanique exacte, sur `ConfigurationSection` → `ProductShippingCard` :

1. La RPC `get_site_internet_products()` coûte **243 ms de base et 12 709 buffers pour 177 lignes**. Elle recalcule **9 fois par ligne** la même sous-requête de prix (`price_list_items ⋈ price_lists`), plus 3 sous-requêtes sur `product_images`, et n'a aucun `LIMIT`.
2. Elle renvoie **497 kB de JSON** (44 colonnes dont `description`, `technical_description`, `image_urls[]`) alors que la carte n'utilise que **6 champs**.
3. Le composant monte ensuite 177 lignes × (un `Select` Radix à 5 items + un `Input` contrôlé) ≈ **1 000 composants Radix**, soit 300-600 ms de thread principal.
4. L'état d'édition vit dans le parent et les callbacks sont des flèches inline : **chaque frappe re-render les 177 lignes et leurs 177 Select**. La saisie est inutilisable.
5. Cette même RPC est appelée par 5 endroits, dont un pour récupérer **un seul** produit (`.rpc(...).eq('product_id', id).single()` — PostgREST filtre après exécution complète : 243 ms pour une ligne).
6. Et `refetchOnWindowFocus: true` est réactivé localement sur cette requête, alors que le défaut global est `false` : chaque retour d'onglet navigateur relance les 243 ms et les 497 kB.

Rien de tout cela n'est mystérieux, et tout est corrigeable.

### Le bundle

`@verone/utils/src/index.ts:36` réexporte `excel-utils.ts`, qui importe **`exceljs`** (~940 kB minifié). Aucun package `@verone/*` n'a `"sideEffects": false`, donc Webpack ne peut rien élaguer : un simple `import { cn } from '@verone/utils'` (213 occurrences) fait entrer `exceljs` dans le graphe client. Même schéma pour `@verone/orders/src/index.ts:9` qui réexporte `./components/charts` → **recharts** (~450 kB) : `OrdersSection.tsx` importe une table depuis le barrel et embarque recharts sans jamais l'afficher.

### Le reste

La sidebar exécute **11 `count(*)` + 2 `auth.getUser()`** par montage, sans React Query, et **rejoue les 11 à chaque événement Realtime de 7 tables**, sans debounce. Le rôle utilisateur est relu **trois fois** par requête HTTP (layout serveur, `AuthWrapper`, `AppHeader`). `useUnreadMailsCount` fait un `count: 'exact'` toutes les 30 s sur toutes les pages et tous les onglets. Le tracker d'activité écrit un `INSERT` par navigation avec un `getSession()` supplémentaire.

### Plan de perf, par ordre de gain

1. Rôle dans le JWT (migration 20 lignes) → supprime 256 M de scans
2. Retirer `force-dynamic` du layout racine + ajouter des `loading.tsx` par groupe de routes + `staleTimes: { dynamic: 30 }` → supprime le ressenti « rien ne se passe »
3. `"sideEffects": false` sur les 24 packages + `optimizePackageImports` + sortir les charts et Excel des barrels → bundle et temps de dev
4. Réécrire `get_site_internet_products` (LATERAL unique, `p_limit`, variante « liste » sans les colonnes lourdes) + paginer + `memo` sur la ligne → la page config redevient utilisable
5. Une seule RPC `get_sidebar_counts()` en `useQuery` avec `staleTime` + debounce Realtime
6. `Promise.all` sur les 66 fichiers à cascades, requêtes ensemblistes sur les 45 boucles N+1
7. `.range()` sur les 6 listes principales, virtualisation sur les 4 tables > 100 lignes

---

## 6. Scalabilité et architecture — 28 / 100

### Mesures

| Métrique                                                    | Valeur                                                             |
| ----------------------------------------------------------- | ------------------------------------------------------------------ |
| LOC TS/TSX                                                  | 588 068 (3 169 fichiers)                                           |
| Copies des types Supabase générés                           | **4** — 133 / 123 / 83 / 83 tables                                 |
| LOC de ces copies                                           | 51 892 (8,8 % du repo)                                             |
| Types écrits à la main                                      | 4 928 ; dérivés de la DB : **291 (5,9 %)**                         |
| `Product` redéclaré                                         | **34 fois** ; `Organisation` 27 ; `ProductImage` 29                |
| Cycles mutuels entre packages                               | **13** ; cycles élémentaires ≤ 4 : **105**                         |
| Arêtes inter-packages non déclarées dans `package.json`     | **41 / 101 (41 %)**                                                |
| Imports de sous-chemins profonds contournant l'API publique | **1 063**                                                          |
| Façons distinctes de créer un client Supabase               | **9**                                                              |
| Appels `.from(...)` dispersés                               | 2 103 sur 136 tables                                               |
| Racines de `queryKey` distinctes (aucune key factory)       | 187                                                                |
| Systèmes de toast concurrents                               | **3** (`useToast` 139 fichiers, `sonner` 82, `react-hot-toast` 18) |
| Migrations                                                  | 770 fichiers, 85 285 LOC                                           |
| Conventions de nommage concurrentes                         | 2 (418 vs 352 fichiers)                                            |
| Préfixes de version en collision                            | 76 préfixes / 415 fichiers                                         |
| Migrations avec `fix` dans le nom                           | **227 (29,5 %)**                                                   |
| Migrations nommées d'après un client précis                 | 26 (`pokawa`, `opjet`, `link_230009`…)                             |
| Tables `ALTER`ées mais jamais `CREATE`ées                   | **59**, dont `products`, `organisations`, `sales_orders`           |
| Baseline SQL / dump de schéma / `config.toml`               | **absent**                                                         |
| Fichiers byte-identiques                                    | 66 groupes / 132 fichiers                                          |
| Fichiers > 400 lignes (règle CLAUDE.md)                     | **222**                                                            |
| Alias `tsconfig` vers des packages inexistants              | 5                                                                  |

### Les quatre dettes qui vont te bloquer

**Il n'existe pas de source unique de vérité pour les types.** Quatre copies de `supabase.ts` cohabitent, dont deux dans des répertoires imbriqués absurdes (`packages/@verone/types/packages/@verone/types/src/`). Elles ont 133, 123, 83 et 83 tables. 25 entités présentes dans la copie de référence sont absentes de celle du back-office (`articles`, `linkme_payments`, `scheduled_publications`…). Selon le chemin d'import, une table est visible ou non. À deux développeurs, deux PR régénèrent deux copies différentes → conflit de 15 000 lignes résolu au hasard. Et chaque copie s'ajoute au programme TypeScript de chaque `tsc --noEmit`.

**Le schéma n'est pas reconstructible.** 59 tables cœur — `products`, `organisations`, `sales_orders`, `stock_movements`, `contacts` — sont `ALTER`ées par les migrations mais n'ont **aucun `CREATE TABLE`**. Il n'y a ni baseline SQL, ni dump, ni `config.toml`. Conséquence directe et immédiate : **tu ne peux pas créer d'environnement de test à partir des migrations**. C'est ce qui bloque tout dispositif de test sérieux aujourd'hui, et c'est pourquoi la Phase 0 du plan de tests commence par là.

**Les frontières entre packages n'existent pas.** 13 cycles mutuels, dont `common ↔ finance`, `common ↔ orders`, `common ↔ products`. `common`, censé être la couche basse, importe `finance`, `orders`, `organisations` et `products`. Ces quatre packages forment un bloc indivisible de 146 399 lignes : impossible d'en extraire un, de le tester isolément, ou de faire travailler deux personnes en parallèle dessus. 41 % des dépendances ne sont pas déclarées et se résolvent par hoisting pnpm — elles casseront à la première montée de version. Un import ESM circulaire produit par ailleurs des `undefined` non déterministes à l'initialisation.

**Les migrations racontent une histoire de correctifs, pas d'évolution.** 227 migrations sur 770 ont `fix` dans le nom. `create_affiliate_order` a été recréée 16 fois, `get_public_selection` 13 fois. 26 migrations portent le nom d'un client — signe que chaque problème client se résout par une écriture SQL manuelle plutôt que par une correction de logique. Deux conventions de nommage coexistent, avec 415 fichiers en collision de préfixe : l'ordre d'application n'est pas déterministe.

Un point à surveiller de près : une route API exécute du DDL via un RPC `exec_sql` arbitraire. C'est un chemin d'écriture au schéma **en dehors des migrations**. Il faut le fermer.

---

## 7. Qualité de code et tests — 20 / 100

| Métrique                                                         | Valeur                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| Fichiers de test                                                 | 35 (**1,1 %** des fichiers source)                      |
| LOC de test                                                      | 5 931 (**1,0 %**)                                       |
| Tests qui n'assertent que « la page charge sans erreur console » | **16 / 35**                                             |
| Tests sur les 151 route handlers                                 | **0**                                                   |
| Tests unitaires purs                                             | 6 (et aucun `vitest.config`/`jest.config` committé)     |
| Pages couvertes par le smoke `smoke-147-pages.spec.ts`           | 106 sur **168** (37 % hors filet)                       |
| `eslint-disable`                                                 | 354, dont `exhaustive-deps` 100, `no-explicit-any` 56   |
| `any`                                                            | 96                                                      |
| `@ts-ignore`                                                     | **0**                                                   |
| `tsc --noEmit`                                                   | **passe**                                               |
| Fichiers > 400 lignes                                            | 222 (la règle ESLint réelle est à 500, en `warn`)       |
| Dernier ADR                                                      | ADR-033, 2026-05-09 → 2,7 mois de décisions non tracées |

### Le problème structurel de la CI

État réel vérifié dans `.github/workflows/quality.yml` :

| Job CI                                           | Tourne ?                           | Bloquant le merge ?       |
| ------------------------------------------------ | ---------------------------------- | ------------------------- |
| `quality` (lint + typecheck + build), 8 min 25 s | oui                                | **OUI**                   |
| `db-drift-check`                                 | oui                                | **OUI**                   |
| `supabase-types-drift`                           | oui                                | **OUI**                   |
| `smoke-golden` (E2E niveau 1, ~30 s)             | **non — `if: false &&` ligne 327** | non                       |
| `smoke-domaine` ×4 shards                        | **non — `if: false &&` ligne 283** | non                       |
| `e2e-full`                                       | **non — `if: false &&` ligne 552** | non                       |
| `supabase-advisors-security`                     | oui                                | non (`continue-on-error`) |
| `validate:types` (`check-db-type-alignment.ts`)  | **non — absent de la CI**          | non                       |
| `check:console` (`check-console-errors.ts`)      | **non — absent de la CI**          | non                       |

Et la baseline du gate advisors accepte comme référence normale : 315 `anon_security_definer_function_executable`, 315 `authenticated_security_definer_function_executable`, 48 `rls_policy_always_true`, 14 `security_definer_view`, 24 `function_search_path_mutable`, 1 `auth_users_exposed`, 1 `public_bucket_allows_listing`.

Et l'ADR-032 active l'auto-merge par défaut : « Toute PR créée par l'agent est immédiatement assortie de `gh pr merge --auto --squash`. Roméo ne touche à rien. »

Mets les deux ensemble : **les seuls garde-fous du merge sont ESLint, `tsc` et `next build`**. Or l'ADR-016 note lui-même « 30+ régressions concrètes en production alors que la CI était verte ». Ces régressions sont précisément des erreurs runtime que ces trois-là ne voient pas. L'ADR-019 a créé le filet smoke en réponse — il est non bloquant, donc personne ne regarde son résultat rouge.

C'est le mécanisme qui produit ce que tu as constaté hier. Ce n'est pas de la malchance.

Correctif : rendre `smoke-golden` **required** immédiatement (30 s à 2 min, meilleur ratio du repo), conditionner l'auto-merge à sa verdeur, puis fiabiliser et rendre required les 4 shards de domaine. Garder `e2e-full` en nightly.

### Ce qui n'est couvert par aucun test fonctionnel

`finance/tva`, `finance/bilan`, `finance/grand-livre`, `finance/echeancier`, `finance/immobilisations`, `finance/tresorerie`, `finance/cloture`, le moteur `apply_matching_rule` (recréé 6× en migration), `finance/depenses`, **l'intégration Qonto** (`qonto/client.ts`, 1 654 lignes, le plus gros fichier écrit à la main du repo), Revolut, Packlink + webhook, Gmail inbound, la messagerie, Pinterest, Meta, Google Merchant, le journal, les marques, `admin/users` et les rôles, les notifications, la roadmap, **le calcul de commission et de rétrocession LinkMe** (39 migrations correctives), les **496 policies RLS**, les 18 server actions, les 30 routes service-role.

Autrement dit : tout ce qui touche à l'argent est vérifié à la main.

Un détail qui compte : `tests/database/stock-alerts-migrations.spec.ts` et les fixtures **écrivent dans la base pointée par `NEXT_PUBLIC_SUPABASE_URL`**, et `turbo.json` expose `SUPABASE_SERVICE_ROLE_KEY` à la tâche `test:e2e`. Aujourd'hui, lancer les tests peut écrire dans ta production. C'est la première chose que la Phase 0 du plan de tests neutralise.

---

## 8. Plan de remédiation

### Vague 0 — Aujourd'hui (2 h)

- `.gitignore` racine avec `.env*`, `!.env.example`
- `git log --all -- '*.env.local'` ; si trace → rotation des 8 secrets
- `requireBackofficeAdmin` sur les 3 routes Qonto de lecture (`balance`, `transactions`, `clients`)
- `REVOKE EXECUTE ON FUNCTION reset_finance_auto_data FROM anon, authenticated`

### Vague 1 — Semaine 1 : fermer la maison (3-4 jours)

- `apps/back-office/src/middleware.ts` : 401 par défaut sur `/api/*`, allow-list explicite. Ferme 86 trous d'un fichier.
- Y brancher les en-têtes de sécurité existants et un rate limiting (Upstash, pas un `Map` en mémoire)
- Rendre le secret obligatoire (fail-closed) sur le webhook Packlink et les 2 crons
- `requireBackofficeAdmin` sur les 15 routes `api/emails/*`, échappement HTML de `form-reply`
- Supprimer la route `/api/logs` et brancher Sentry (le DSN existe dans `.env.local`, il n'y a aucun code Sentry dans le repo)

### Vague 2 — Semaine 2 : la perf (3 jours)

- Rôle back-office dans le JWT, `is_backoffice_user()` sans I/O (migration de 20 lignes, signature inchangée)
- Retirer `force-dynamic` du layout racine, ajouter les `loading.tsx`, configurer `staleTimes`
- `"sideEffects": false` partout + `optimizePackageImports` + sortir charts et Excel des barrels
- RPC `get_sidebar_counts()` unique en `useQuery`, debounce Realtime, supprimer les lectures de rôle redondantes

### Vague 3 — Semaine 3 : rendre les erreurs visibles (4 jours)

C'est la vague qui change ton quotidien. Sans elle, tu continueras à ne pas savoir pourquoi ça échoue.

- Règle ESLint custom : interdire `const { data } = await supabase` sans lecture de `error` (ratchet sur l'existant)
- Un seul système de toast (garder `sonner`, migrer les 157 autres fichiers), avec un helper `handleSupabaseError` qui affiche le message Postgres en développement et un libellé métier en production
- Traiter les 33 occurrences connues du motif, en priorité dans finance, products, organisations
- Corriger les 12 bugs bloquants de la section 2

### Vague 4 — Semaine 4-5 : le socle de test (5 jours)

- Baseline SQL : `pg_dump --schema-only` de la prod, committé comme migration 0. Sans ça, aucun environnement de test n'est reproductible.
- Branche Supabase dédiée + jeu de données de seed (voir le plan de tests)
- `smoke-golden` required, auto-merge conditionné
- Régénérer la liste des pages du smoke depuis `find` en CI, échouer si elle diverge
- Extraire les calculs purs (commission, rétrocession, TVA, marge, totaux) dans `@verone/domain` et les couvrir à 80 % de branches

### Vague 5 — Mois 2-3 : l'architecture

- Supprimer les 3 copies de types et les répertoires imbriqués, un seul générateur, check CI bloquant
- Casser les 13 cycles (règle `dependency-cruiser` bloquante, déjà en dépendance)
- Déduplication de l'arbre `catalogue/[id]` vs `catalogue/detail/[id]` (66 fichiers, ~21 900 lignes)
- Couche d'accès aux données unique, key factory React Query
- Aligner CLAUDE.md et ESLint sur un seul seuil de lignes, en `error`, avec ratchet

---

## 9. Ce que je te recommande de ne pas faire

**Ne re-tente pas le wrapping global des policies RLS.** Il a été rollbacké le 2026-05-08 après incident. Passe par le JWT.

**Ne lance pas de tests contre ta base de production.** C'est aujourd'hui possible — `turbo.json` expose la service role key à `test:e2e` et les fixtures écrivent dans `NEXT_PUBLIC_SUPABASE_URL`. Fais la Phase 0 du plan de tests avant tout le reste.

**Ne corrige pas les 222 fichiers > 400 lignes maintenant.** C'est du cosmétique tant que 86 routes API sont ouvertes. Mets un ratchet et avance.

**Ne réécris pas le back-office.** Rien dans ce que j'ai lu ne le justifie. Les problèmes sont nombreux mais localisés et documentés ; le plus gros d'entre eux se corrige en un fichier de middleware et une migration de 20 lignes.

---

_Audit réalisé le 2026-07-30. Aucune écriture effectuée sur la base de production, aucun fichier du dépôt modifié._
