# Plan — Finir la mise en ligne + marge nette LinkMe sur les fiches produit

## En bref pour Roméo

1. **D'abord, je mets par écrit tout ce qui reste à faire** (compte rendu + liste de tâches). Si la session s'arrête,
   une autre session reprend sans rien perdre.
2. **Je passe en version live les 10 améliorations déjà validées** : sourcing en 4 étapes, liste sourcing, grille
   d'évaluation, règle « vendable », correctif de sécurité, Retirer / Restaurer. Je vérifie ensuite la version live.
3. **Marge nette LinkMe** : sur la fiche produit LinkMe du back-office, un bloc « Rentabilité LinkMe » affiche :
   - ton prix LinkMe fixé, le prix de revient et ta marge par pièce ;
   - les ventes réelles : quantités, ce que Vérone a encaissé, ta marge nette en € et en %. La commission des
     affiliés est **exclue**, elle est affichée à part pour information ;
   - le nombre d'affiliés qui proposent le produit et le nombre de ceux qui l'ont vendu, avec le détail par affilié.
4. **Fiche produit du catalogue, onglet Tarification** : le même bloc LinkMe, plus un tableau **par canal de vente**
   (Manuel, Site, LinkMe). Le bloc « Rentabilité » ancien est corrigé : il compte aussi les commandes validées, et il
   utilise le prix Vérone pour LinkMe. Le calcul est le même partout.
5. Je relis, je teste à l'écran, puis j'envoie. Ensuite, deuxième mise en ligne pour que ce soit en production.

Aucune modification de la base, des prix, des commissions ou de la mécanique LinkMe : c'est de la lecture seule.

---

## Context

Demande du 15/09 : finir ce qui est en cours (mise en ligne), sinon le laisser par écrit pour une autre session.
Nouvelle demande : afficher la marge nette LinkMe de Vérone et le nombre d'affiliés sur la fiche produit du
back-office LinkMe, puis la même chose dans la fiche produit du catalogue avec un détail par canal de vente.

Règle métier (mémoire `linkme-pricing-business-model`) :

- LinkMe est un business à part, qui vise le volume plutôt que la marge.
- Le prix LinkMe est fixé dans le back-office à partir du prix de revient.
- **Marge nette = prix LinkMe − prix de revient.** La commission de l'affilié n'en fait pas partie.

## État vérifié (15/09, lecture seule)

- **Branches** :
  - `staging` a 10 fusions d'avance sur `main` (#1148 → #1158) ; aucune PR de release n'est ouverte.
  - Branche locale `feat/BO-PRODUCTS-PROFIT-001-afficher-rentabilite` = staging `acf5548c` + `73a74198` + `aed9405e`.
    Elle n'a jamais été poussée.
- **GitHub** :
  - Dépôt privé sur Free, donc sans protection de branche. Pas de `--auto` : les 4 contrôles requis se vérifient
    à la main.
  - Préfixe obligatoire : `GH_TOKEN="$(gh auth token -u Verone2021)"`.
  - Le hook bloque toute commande qui contient `--base main`.
- **Base** :
  - Canal LinkMe : `93c68db1-5a30-4168-89ec-6383152be405`, constante `CHANNEL_IDS.linkme` dans
    `@verone/channels/src/constants/channel-ids.ts:16`.
  - Statuts de vente valables : `validated, partially_shipped, shipped, delivered, closed`.
- **Lignes LinkMe** :
  - Le prix Vérone figé est `base_price_ht_locked`, présent sur 100 % des lignes valables.
  - La commission affilié est `retrocession_amount`, égale à (vente − base) × qté sur 457 lignes sur 460.
  - Revenu Vérone = `COALESCE(base_price_ht_locked, unit_price_ht) × qty`.
  - Prix LinkMe actuel : `channel_pricing.custom_price_ht` (Plateau bois 20×30 = 18,50 €).
- **Prix de revient** : `products.cost_net_avg` (frais inclus), à défaut `cost_price` (prix d'achat seul). Dans ce
  second cas, l'écran affiche un avertissement « frais d'approche non inclus ».
- **Produits créés par l'affilié** (`products.created_by_affiliate`, 10 lignes) :
  - La logique est inversée : Vérone touche `unit_price_ht × qty × affiliate_commission_rate / 100` (déclencheur
    `create_linkme_commission_on_order_update`).
  - Pas de prix de revient : l'écran affiche « Commission Vérone », jamais de marge.
- **Affiliés** :
  - Qui proposent le produit : `linkme_selection_items.product_id` → `linkme_selections.affiliate_id`, sélections non
    archivées.
  - Qui l'ont vendu : `soi.linkme_selection_item_id` → `lsi.selection_id` → `ls.affiliate_id`.
- **Fiche LinkMe** `canaux-vente/linkme/catalogue/[id]/page.tsx` :
  - 441 lignes, au-dessus de la limite de 400.
  - L'identifiant de route est `channel_pricing.id` ; `product.product_id` est disponible.
  - La carte « Commission Vérone » est écrite en ligne dans la page (L280-343).
- **Fiche catalogue** :
  - `detail/[id]` est la page réellement servie (réécriture `next.config.js:96-101`) ; `[id]` en est une copie.
  - Zone 5 de `product-pricing-dashboard.tsx` (200 lignes) = `ProductProfitabilitySection`.
- **Bloc existant** `@verone/products` :
  - `ProductProfitabilitySection.tsx` fait 457 lignes.
  - `use-product-profitability.ts` ne compte que shipped/delivered/closed, prend `unit_price_ht` (prix client LinkMe)
    et `cost_net_avg` seul. Ce bloc n'a jamais été mis en ligne, donc le corriger ne casse rien en production.

---

## Étape 0 — Filet de sécurité écrit (en premier)

- Créer `docs/scratchpad/dev-plan-2026-09-15-BO-PRODUCTS-PROFIT-001.md` (ce plan, partie technique).
- Créer `docs/scratchpad/reste-a-faire-2026-09-15.md`, qui consolide tout ce qui reste, avec pointeurs :
  - release E1 et vérifications live ;
  - chantier marge nette LinkMe (étapes 2 à 5 ci-dessous) ;
  - décisions Roméo du compte rendu `_inbox/2026-09-15-historique-ventes-marges-tarification.md` § 7 : définition de
    la marge, prix de revient du passé, frais de port, figer le prix de revient à la validation ;
  - suites de ce compte rendu : « Utiliser ce prix », client et période par ligne, doublon `catalogue/[id]` vs
    `detail/[id]`, fonctions SQL inutilisées ;
  - suites sécurité : lot 4 bis, lot 8 « invoker », BO-SEC-004 lot 7 qui attend l'accord ;
  - autres suites : P6, mesure S3, test Want It Now, `stock_alerts_view` cassée, défaut mobile 900 px, case
    « Consultations actives » à 0, commit BO-AUDIT-005 ;
  - données de test PO-2026-00039 et produit TEST, à supprimer par Roméo.
- Ajouter en tête de `.claude/work/ACTIVE.md` une section « EN COURS 15/09 » qui pointe vers ces deux fichiers.

## Étape 1 — Release E1 : staging → version live

1. Lancer le workflow `auto-release-staging-to-main.yml` (workflow_dispatch). Récupérer la PR ouverte par le robot,
   la sortir du brouillon, puis la fermer et la rouvrir pour déclencher la CI (mémoire `auto-release-pr-ci-gotcha`).
2. Attendre les 4 contrôles requis au vert : `ESLint + Type-Check + Build`, `DB FK drift`, `E2E Smoke`,
   `Supabase TS types drift`. L'échec de « advisors informational » ne bloque pas. Si un contrôle est rouge, lire le
   journal et corriger la cause, jamais le masquer.
3. Fusionner en merge commit, **sans supprimer la branche** (incident du 14/09 où staging a été supprimée).
4. Vérifier la version live :
   - le déploiement Vercel du back-office est prêt (`vercel ls`) ;
   - le site, linkme.network et la vitrine répondent 200 ;
   - écrans connectés, via Playwright en lecture seule : liste sourcing en onglets, fiche sourcing en 4 étapes, badge
     « Retiré » sur la fiche produit, consultation.
5. Retirer la liste « Fusionnées dans staging, en attente de la release E1 » de ACTIVE.md et noter le numéro de la
   release.

## Étape 2 — Calcul unique (pur, testé), dans `packages/@verone/products`

- **Nouveau** `src/utils/product-sales-margin.ts`, fonctions pures sans accès réseau :
  - **Entrées** : lignes `{ orderId, orderNumber, orderDate, channelId, status, quantity, unitPriceHt, totalHt,
basePriceLocked, sellingPriceLocked, retrocessionAmount, affiliateId, affiliateName }` et produit
    `{ costNetAvg, costPrice, createdByAffiliate, affiliateCommissionRate, linkmePriceHt }`.
  - **Coût retenu** : `costNetAvg ?? costPrice`, avec `costIncludesFees` et `costMissing`.
  - **Par ligne, cas LinkMe (catalogue ou enseigne)** :
    - `veroneUnit = basePriceLocked ?? unitPriceHt` ;
    - `veroneRevenue = veroneUnit × qty` ;
    - `affiliateCommission = retrocessionAmount ?? (sellingLocked − veroneUnit) × qty` ;
    - `clientRevenue = totalHt`.
  - **Par ligne, autres canaux** : `veroneRevenue = totalHt`, commission 0.
  - **Par ligne, produit créé par l'affilié** : `veroneCommission = unitPriceHt × qty × rate / 100` et `margin = null`.
  - **Marge** : `veroneRevenue − cost × qty`, en € et en % du revenu Vérone, plus le coefficient `veroneUnit / cost`.
  - **Synthèses** :
    - `summarizeByChannel` : qté, revenu Vérone, prix moyen pondéré, marge € et %, nombre de commandes ;
    - `summarizeLinkMe` : synthèse + total des commissions exclues + CA client, liste par affilié (qté, revenu Vérone,
      marge) ;
    - `theoreticalUnitMargin` : prix LinkMe actuel − coût.
- **Nouveau** `src/utils/__tests__/product-sales-margin.test.ts`, lancé avec `npx tsx` comme les tests voisins :
  - Sac jute PM : Manuel, 300 × 3,59, coût 2,13 → 438 € et 40,7 %.
  - Une ligne LinkMe base 18,50, vente 21,77, coût 11 : marge 7,50 €/pièce, commission exclue.
  - Un produit créé par un affilié.
  - Un coût manquant, un `cost_price` sans frais, un statut hors liste ignoré.

## Étape 3 — Lecture des données et écrans

- **Nouveau hook** `src/hooks/use-product-sales-margin.ts` :
  - TanStack Query, clé `['product-sales-margin', productId]`, `staleTime` 30 s.
  - Deux lectures en parallèle, colonnes explicites :
    - `sales_order_items` avec `sales_orders!inner(id, order_number, order_date, status, channel_id)` et
      `linkme_selection_items(selection_id, linkme_selections(affiliate_id, linkme_affiliates(display_name)))`,
      filtrée sur le produit et les statuts valables, `.limit(2000)` ;
    - `products` (coûts, `created_by_affiliate`, `affiliate_commission_rate`) avec le `channel_pricing` LinkMe
      (`custom_price_ht`) et les affiliés qui proposent le produit (sélections non archivées).
  - Calcul fait avec les fonctions de l'étape 2. Client typé `Database`, aucun `any`, aucun `as unknown as` : type
    guard ou Zod pour les jointures.
  - Exporté dans `src/hooks/index.ts`.
- **Nouveau** `src/components/sections/profitability/LinkMeNetMarginCard.tsx` (moins de 200 lignes, découpé si besoin) :
  - Tuiles : prix LinkMe fixé, prix de revient avec avertissement, marge nette par pièce (€, %, coefficient).
  - Ventes réelles : quantité, encaissé Vérone, **marge nette Vérone**, commissions affiliés « exclues, pour
    information », CA client final.
  - Affiliés : « X proposent / Y ont vendu », puis liste par affilié en cartes empilées sur téléphone.
  - Variante « produit de l'affilié » : commission Vérone, sans marge. État vide : « Aucune vente LinkMe ».
  - Grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- **Nouveau** `src/components/sections/profitability/SalesByChannelCard.tsx` : `ResponsiveDataView`, tableau à partir
  de md et cartes en dessous. Colonnes : canal, qté, encaissé Vérone, prix moyen, marge €, marge %. LinkMe est libellé
  « LinkMe (hors commission affiliés) ».
- **Refonte** de `ProductProfitabilitySection.tsx`, qui doit passer sous 400 lignes :
  - l'historique des ventes vient de `useProductSalesMargin`, avec une colonne Canal et la marge calculée sur le prix
    Vérone ;
  - l'historique des achats reste dans `use-product-profitability.ts`, sans la partie ventes ;
  - découpage en `PurchaseHistoryTable.tsx` et `SalesHistoryTable.tsx` sous `sections/profitability/` ;
  - accents corrigés.
- Exporter les deux cartes dans `src/components/sections/index.ts`.
- **Fiche LinkMe** `canaux-vente/linkme/catalogue/[id]/page.tsx` :
  - extraire la carte en ligne « Commission Vérone » (L280-343, avec son état et `useUpdateAffiliateCommission`) vers
    `canaux-vente/linkme/components/AffiliateCommissionCard.tsx`, exporté dans `components/index.ts` ;
  - ajouter `<LinkMeNetMarginCard productId={product.product_id} />` après `ProductSelectionsCard` ;
  - la page passe sous 400 lignes.
- **Fiche catalogue**, zone 5 de `product-pricing-dashboard.tsx` dans **les deux copies** (`[id]` et `detail/[id]`),
  qui doivent rester identiques : `SalesByChannelCard`, puis `LinkMeNetMarginCard`, puis `ProductProfitabilitySection`.

Délégation : dev-agent avec ces instructions précises (fichiers, lignes, formules, valeurs attendues). Le coordinateur
relit tout le diff et lance lui-même les vérifications.

## Étape 4 — Vérifications (avant tout envoi)

- Tests purs : `npx tsx packages/@verone/products/src/utils/__tests__/product-sales-margin.test.ts`.
- `pnpm --filter @verone/products type-check` + `pnpm --filter @verone/back-office type-check` et `lint`, à 0.
  Pas de `next build` : le serveur de Roméo tourne.
- Valeurs de référence recalculées en SQL lecture seule, puis comparées à l'écran :
  - **Plateau bois 20×30** (LinkMe) : 1 880 pièces ; encaissé Vérone 37 129,10 € ; commissions exclues 6 552,63 € ;
    CA client 43 677,80 € ; coût 11 € sans frais, donc avertissement ; marge nette 16 449,10 € ≈ 44,3 % ; 1 affiliate
    qui propose, 1 qui a vendu.
  - **Sac jute PM** : Manuel, 300 pièces, 1 077 €, marge 438 € (40,7 %) ; carte LinkMe « Aucune vente LinkMe ».
  - Un produit créé par un affilié (Poubelle à POKAWA) : commission Vérone affichée, aucune marge.
- Playwright en local (port 3000, lane-2 connectée), en lecture seule, captures dans
  `.playwright-mcp/screenshots/20260915/` :
  - fiche LinkMe de Plateau bois à 1440 et 1920 ;
  - fiche catalogue (page mobile obligatoire) à 375, 768, 1024, 1440 et 1920. Le défaut préexistant de colonne à
    900 px est seulement noté ;
  - 0 erreur console et ≤ 5 requêtes par 5 s au repos.
- reviewer-agent, rapport `docs/scratchpad/review-report-2026-09-15-BO-PRODUCTS-PROFIT-001.md`. Tout CRITICAL est
  corrigé avant l'envoi.
- Rapport `docs/scratchpad/dev-report-2026-09-15-BO-PRODUCTS-PROFIT-001.md`.

## Étape 5 — Envoi et deuxième mise en ligne

- Commits `[BO-PRODUCTS-PROFIT-001]` préparés fichier par fichier, sans les rapports archivés du hook post-merge.
  **Un seul push**, puis une PR vers staging.
- Contrôles requis vérifiés au vert à la main, fusion squash **sans supprimer staging** (la branche feature seule).
- Release E2 staging → main : même procédure qu'à l'étape 1, puis vérification de la version live. Contrôle à l'écran
  en production de la fiche LinkMe de Plateau bois et de la fiche catalogue de Sac jute PM.

## Étape 6 — Clôture écrite

- ACTIVE.md : retirer E1, E2 et PROFIT-001 une fois en ligne ; garder seulement ce qui reste.
- Mettre à jour `docs/scratchpad/reste-a-faire-2026-09-15.md` : ce qui est fait et ce qui reste, dont les décisions
  Roméo 1 à 5 et « Utiliser ce prix ».
- Si la session s'arrête avant la fin, l'étape en cours et la suivante sont notées dans ces deux fichiers.
- Compte rendu final à Roméo en français simple, 5 lignes.

## Hors périmètre (explicitement non touché)

- Déclencheurs, prix, commissions et fonctions LinkMe ; déclencheurs stock ; routes Qonto.
- Toute écriture en base, et la colonne « prix de revient figé à la validation », qui demande l'accord de Roméo.
- Suppression de PO-2026-00039 et du produit TEST (à faire par Roméo).
