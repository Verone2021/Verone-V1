# Écritures en base impossibles — 31 cas confirmés

**Date** : 2026-07-30 · **Lot** : découvert au 004, corrigé au 005
**Outil** : `scripts/validation/check-db-schema-usage.ts` (`pnpm validate:db-usage`)
**Vérification** : chacun des 31 cas a été confirmé contre la base de production
via `information_schema.columns` et `pg_enum`. **Zéro faux positif.**

---

## Ce que c'est

Du code qui écrit dans une colonne qui n'existe pas, ou une valeur d'enum qui
n'existe pas. Le code **compile**, passe ESLint, passe `next build`, se déploie
sur Vercel — et échoue au clic de l'utilisateur, avec une erreur PostgREST
`PGRST204` (colonne inconnue) ou `22P02` (valeur d'enum invalide).

Aucun des contrôles existants ne voit cette catégorie de défaut :

| Contrôle           | Le voit ?       | Pourquoi                                                                                                                                               |
| ------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `tsc` (type-check) | Non             | Le payload est presque toujours `as unknown as ...Insert` ou passé à un hook au type large. Le cast désarme le compilateur.                            |
| ESLint             | Non             | Rien d'anormal syntaxiquement.                                                                                                                         |
| `next build`       | Non             | Aucun appel réseau au build.                                                                                                                           |
| `validate:types`   | Non             | Son en-tête annonce cette détection. Exécuté le 2026-07-30 : 950 diagnostics émis, dont 273 « Query Supabase sans type », **zéro colonne, zéro enum**. |
| Advisors Supabase  | Non             | Analyse la base, pas le code.                                                                                                                          |
| E2E Playwright     | En principe oui | Désactivés en dur depuis le 2026-05-13.                                                                                                                |

C'est la définition de la cause racine nº2 de l'audit (« les erreurs ne
remontent jamais ») appliquée à l'écriture : la requête part, la base la
refuse, et selon le fichier l'erreur est affichée en message technique
incompréhensible, ou avalée en silence.

---

## Par impact utilisateur

### 1. Rapprochement bancaire — le bouton ne marchera jamais

`apps/back-office/src/app/actions/bank-matching.ts:137` et `:339`
→ écrit `financial_documents.payment_status`. La table a `status`,
`quote_status`, `upload_status`. **Pas `payment_status`.**

Déroulé réel du clic sur « rapprocher » (ligne 137) :

1. La facture est créée en base (étape 8) — succès.
2. Le code la met à jour avec `payment_status: 'paid'` et `status: 'paid'`.
3. PostgREST refuse : `PGRST204`.
4. Le code **supprime la facture qu'il vient de créer** et retourne
   `success: false, error: "Erreur enregistrement paiement: <message PostgREST>"`.

Vu de Roméo : le bouton ne fait rien. C'est exactement le symptôme nº1 qu'il a
signalé en ouvrant l'audit. **Reproductible à 100 %, depuis toujours.**

La ligne 339 est le même défaut dans le rapprochement **par lot**, avec une
conséquence pire : le `continue` laisse la facture en base au lieu de la
supprimer. Chaque tentative de rapprochement multiple génère des factures
orphelines non payées dans `financial_documents` — de la donnée fantôme
produite par l'application elle-même, ce que `.claude/rules/no-phantom-data.md`
interdit formellement.

**Correction** : retirer `payment_status: 'paid'`. La ligne suivante écrit déjà
`status: 'paid'`, qui est la bonne colonne. Deux lignes supprimées au total.

### 2. TVA sur les transactions bancaires

`apps/back-office/src/app/api/transactions/update-vat/route.ts:74`
→ écrit `bank_transactions.vat_amount`. La colonne s'appelle **`amount_vat`**
(la table a aussi `vat_rate`, `vat_source`, `vat_breakdown` — seul le montant
est inversé). Saisir une TVA sur une transaction échoue systématiquement.

### 3. Réception fournisseur — transporteur, suivi, bon de livraison

`packages/@verone/orders/src/actions/purchase-receptions.ts:115-117`
→ écrit `carrier_name`, `tracking_number`, `delivery_note` sur
`purchase_order_receptions`. Aucune des trois n'existe : la table a
`batch_number`, `notes`, `quantity_expected`, `quantity_received`,
`received_at`, `received_by`, `reference_type`, `status`.

Toute réception qui renseigne un transporteur ou un numéro de suivi est
rejetée en bloc — les quantités reçues ne sont pas enregistrées non plus,
puisque c'est le même INSERT.

### 4. Produits — colonne `status` qui n'existe pas, 7 emplacements

La table `products` n'a **pas** de colonne `status`. Elle a `product_status`,
`completion_status`, `sourcing_status`, `affiliate_approval_status`. Sept
endroits écrivent `status` :

| Fichier                                                            | Ligne    | Effet                                                                                                                                                                        |
| ------------------------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/@verone/products/src/hooks/use-products.ts`              | 241      | Création de produit : échoue **si** `status` est renseigné (une valeur `undefined` est retirée du JSON, donc l'échec est intermittent — le pire des cas pour diagnostiquer). |
| `packages/@verone/products/src/hooks/use-variant-group-archive.ts` | 75       | Archiver un groupe de variantes : `status: 'discontinued'` en dur → **échoue toujours**.                                                                                     |
| `packages/@verone/products/src/hooks/use-variant-group-archive.ts` | 136      | Restaurer un groupe archivé : `status: 'in_stock'` en dur → **échoue toujours**.                                                                                             |
| `packages/@verone/products/src/hooks/use-archived-products.ts`     | 137, 163 | Archiver / restaurer un produit → **échoue toujours**.                                                                                                                       |
| `apps/back-office/src/components/forms/use-quick-variant-form.ts`  | 122      | Création rapide de variante.                                                                                                                                                 |

`use-archived-products.ts:138` et `:164` écrivent en plus `archived_reason`,
qui n'existe pas non plus. `use-quick-variant-form.ts:120` écrit `price_ht`,
qui n'existe pas (les colonnes de prix sont `cost_price`,
`margin_percentage`).

Conséquence : **l'archivage de produits et de groupes de variantes n'a jamais
fonctionné.** Le symptôme « erreurs silencieuses dans la gestion produits »
signalé par Roméo.

### 5. Produits — `is_variant_parent`, 4 emplacements

Colonne inexistante. `packages/@verone/products/src/hooks/use-variant-products.ts:201`,
`:294`, `:302` et `use-quick-variant-form.ts:131`.

Le cas `:294` est le plus grave côté diagnostic : `await supabase.from(...)
.update(...)` **sans lire `error`**. L'échec est totalement invisible, y
compris dans la console. Détacher un produit de son groupe de variantes
paraît réussir et ne fait rien.

### 6. Images de variantes

`packages/@verone/products/src/hooks/use-variant-products-create.ts:138`
→ insère `product_images.image_url`. Les colonnes sont **`public_url`** et
`legacy_supabase_url`. L'INSERT est protégé par `if (data.image_url && ...)`,
donc il n'est tenté que quand une image est fournie — et échoue alors à chaque
fois. Le produit est créé, son image n'est jamais rattachée.

À noter : le payload porte un `as unknown as Database['public']['Tables']
['product_images']['Insert'][]`. Le cast a masqué l'erreur au compilateur,
qui l'aurait sinon signalée. C'est précisément l'anti-pattern décrit dans
`.claude/rules/code-standards.md` § ANTI-RACCOURCIS.

### 7. Échantillons — « marquer comme livré »

`packages/@verone/ui-business/src/components/validation/sample-order-validation.api.ts:25`
→ écrit `sample_orders.delivered_at`. La colonne est
**`actual_delivery_date`**. La fonction fait `if (error) throw error`, donc
l'erreur remonte — mais sous forme de message PostgREST brut.

### 8. Webhook Revolut LinkMe — 7 champs sur 8

`apps/linkme/src/app/api/webhook/revolut/route.ts:114-122`

| Ligne | Écrit                         | Réalité                                                                                                                                              |
| ----- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 114   | `sales_orders.source_channel` | inexistante (il y a `channel_id`)                                                                                                                    |
| 115   | `status: 'confirmed'`         | absent de l'enum `sales_order_status` (`pending_approval`, `draft`, `validated`, `partially_shipped`, `shipped`, `delivered`, `closed`, `cancelled`) |
| 116   | `customer_email`              | inexistante                                                                                                                                          |
| 119   | `payment_status`              | inexistante (il y a `payment_status_v2`)                                                                                                             |
| 120   | `payment_method`              | inexistante                                                                                                                                          |
| 121   | `payment_reference`           | inexistante                                                                                                                                          |
| 122   | `linkme_affiliate_id`         | inexistante (il y a `created_by_affiliate_id`)                                                                                                       |

Ce webhook ne peut structurellement rien enregistrer. Si un paiement Revolut
arrive, la commande n'est pas créée. À traiter avant toute mise en service du
paiement LinkMe.

### 9. Deux cas isolés

- `apps/back-office/src/app/api/qonto/sync-invoices/route.ts:166` → écrit
  `organisations.status`, la colonne est `approval_status`.
- `apps/back-office/src/app/api/ambassadors/create-auth/route.ts:145` → écrit
  `user_profiles.user_type = 'ambassador'`, absent de l'enum `user_type`
  (`staff`, `supplier`, `customer`, `partner`). La création d'un compte
  ambassadeur échoue.
- `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-page-config.ts:320`
  → écrit `linkme_globe_items.show_on_linkme_globe`, inexistante.

---

## Onze signalements heuristiques, à vérifier séparément

Le script les affiche dans une section distincte et **ne bloque pas** dessus.
Ils viennent de deux détections par ressemblance, dont la précision est
inférieure :

- 5 concernent des options de `<Select>` rattachées à une colonne par
  proximité dans le JSX. La détection se trompe quand un formulaire porte à la
  fois un champ `app` et un champ `role` — les valeurs `owner`, `admin`,
  `catalog_manager` sont des rôles, pas des applications. Faux positifs.
- 1 est en revanche un vrai défaut :
  `packages/@verone/products/src/components/wizards/sections/GeneralInfoSection.tsx:177`
  propose `backorder` dans un select rattaché à `availability_type`, dont
  l'enum vaut `normal | preorder | coming_soon | discontinued`. Choisir cette
  option fait échouer l'enregistrement.
- 4 sont des objets de formulaire qui contiennent des champs d'interface
  (`imageFiles`, `items`, `family_id`, `category_id`) et ressemblent à 80 % aux
  colonnes d'une table. Faux positifs.
- 1 est le payload du wizard « nouveau produit complet »
  (`useCompleteProductWizard.ts:203`, champ `status`) — même défaut que le
  point 4 ci-dessus, atteint par un autre chemin. À traiter avec lui.

---

## Ordre de correction proposé (Lot 005)

Une PR par bloc fonctionnel, avec le test de référence avant modification
imposé par `.claude/rules/non-regression.md`.

| PR  | Bloc                                                                    | Fichiers                                                    | Diff estimé                |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------- |
| 1   | Rapprochement bancaire                                                  | `bank-matching.ts`                                          | 2 lignes retirées          |
| 2   | Produits : `status`, `archived_reason`, `price_ht`, `is_variant_parent` | 5 fichiers `@verone/products` + `use-quick-variant-form.ts` | ~15 lignes                 |
| 3   | Images de variantes + retrait du cast `as unknown as`                   | `use-variant-products-create.ts`                            | ~5 lignes                  |
| 4   | Réception fournisseur                                                   | `purchase-receptions.ts`                                    | ~5 lignes                  |
| 5   | TVA transactions + `organisations.status` + ambassadeurs + globe LinkMe | 4 fichiers                                                  | ~8 lignes                  |
| 6   | Échantillons                                                            | `sample-order-validation.api.ts`                            | 1 ligne                    |
| 7   | Webhook Revolut                                                         | `revolut/route.ts`                                          | à repenser, pas à renommer |

Les six premières sont des renommages de colonne, sans effet de bord : la
requête échouait, elle réussira. La septième demande une décision sur ce que
le webhook doit réellement écrire — sept champs sur huit sont faux, ce n'est
plus un renommage mais une reprise.

**Une fois le compte à zéro** : passer
`Ecritures DB impossibles (informational)` en bloquant dans `quality.yml`
(retirer `continue-on-error: true`). Sans baseline — délibérément, pour ne pas
reproduire le défaut de `supabase-advisors-baseline.json`, qui accepte 719
anomalies dont 315 fonctions exécutables par `anon`.
