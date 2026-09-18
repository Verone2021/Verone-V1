# Rapport — Sourcing produit, consultations clients, achat et canaux — 2026-09-11

Destinataire : Cowork (audit + recherche), puis sessions de développement Claude Code.
Auteur : Claude Code, lecture seule (code, base `aorroydfjsrygmosnzrl` en SELECT, logs, recherche web).
Aucune écriture en base, aucune modification de code applicatif pendant l'audit.

Complète : `RAPPORT-CLAUDE-CODE-2026-09-11.md` (performance) et `SESSIONS-2026-09-11.md` (ordre des sessions).

---

## 0. Vérifications et outils connectés

| Outil                                                                    | État                                                                                                                                                                                                       | Preuve                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Dossier / dépôt                                                          | `/Users/romeodossantos/verone-back-office-V1`, `Verone2021/Verone-V1` (privé)                                                                                                                              | `pwd`, `git remote -v`, `gh repo view`                         |
| MCP Supabase du projet (`.mcp.json`, `project_ref=aorroydfjsrygmosnzrl`) | ✅ base Vérone ; lecture SQL, advisors, logs ; écritures de migration bloquées par réglage (voulu)                                                                                                         | `get_project_url` = `https://aorroydfjsrygmosnzrl.supabase.co` |
| Connecteur Supabase claude.ai                                            | ✅ organisation Vérone seule : `verone-backoffice` (actif), `V0 - Verone` (inactif) ; aucun projet Want It Now                                                                                             | `list_projects`                                                |
| Supabase CLI 2.109.1                                                     | ✅ lié à `verone-backoffice`                                                                                                                                                                               | `supabase projects list`                                       |
| Playwright lane-1 / lane-2                                               | ✅ ; lane-2 connectée au back-office local (port **3000**)                                                                                                                                                 | navigation `/dashboard`                                        |
| Stitch                                                                   | ✅ 4 projets de maquettes Vérone                                                                                                                                                                           | `list_projects`                                                |
| Vercel CLI                                                               | ✅ `verone2021` ; projets `verone-back-office` (prod = `main`, déployée le 2026-07-23 = `de71f75f`), `veronecollections-fr`                                                                                | `vercel whoami`, `vercel ls --prod`, `vercel inspect`          |
| GitHub CLI                                                               | ⚠️ compte actif du poste = **WantitNow** ⇒ `git fetch`/`push` Vérone échouent (« Repository not found »). Contournement vérifié sans changer le compte : `GH_TOKEN="$(gh auth token -u Verone2021)" git …` | `gh api user`, `git ls-remote`                                 |
| MCP context7                                                             | ❌ absent de `.mcp.json` alors que `.claude/agents/dev-agent.md:15` et `perf-optimizer.md:17` le déclarent                                                                                                 | lecture                                                        |

Version locale vs production : local = production (`main` `de71f75f`) + 3 PR de `staging` (#1129 gardes CI, #1141 CSV clients,
#1140 `.gitignore` logs) + 6 commits Want It Now non poussés (écran canal, carte fiche produit, route du flux, module + tests,
types, plan). Aucun autre écart dans `apps/back-office` ni `packages`.

---

## 1. Want It Now — revue du connecteur

Rapport : `docs/scratchpad/review-report-2026-09-11-VER-CANAL-WIN-001.md` (reviewer-agent), constats revérifiés dans le code.

| Niveau   | Constat                                                                                                                  | Preuve                                                                                   | Correction                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | -------------------------------- |
| CRITICAL | cast interdit `feed.produits as unknown as Record<string, unknown>[]`                                                    | `apps/back-office/src/lib/canaux/want-it-now/__tests__/feed.test.ts:68`                  | retyper `acceptWantItNowProduct` |
| WARNING  | prix d'achat 0 € accepté par le flux (`toPurchasePrice` rejette seulement `< 0`) mais affiché « Incomplet / non envoyé » | `feed.ts:140-145` vs `use-want-it-now-channel.ts:42`, `want-it-now-products-list.tsx:41` | rejeter `<= 0` + test            |
| WARNING  | après bascule sur la fiche produit, l'écran canal peut rester périmé ≤ 60 s                                              | `use-product-detail.tsx:165`, `use-want-it-now-channel.ts:46`                            | invalider la requête du canal    |
| INFO     | un GET du flux écrit `feed_configs.last_export_at` ; route HTTP sans test                                                | `route.ts:87`                                                                            | documenter / test de route       |

Solide : jeton comparé à temps constant, 401 sans fuite, `Cache-Control: no-store`, aucun champ sensible, 15/15 tests,
migration additive, 5 techniques responsive, type-check et ESLint verts.

---

## 2. Sourcing produit — état actuel

### 2.1 Volumes réels

4 produits en sourcing (`creation_mode='sourcing'`), 0 commande échantillon (`purchase_orders.po_type='sample'`),
`sample_orders`/`sample_order_items` vides, 0 communication, 4 fournisseurs candidats, 4 URLs, 0 photo sourcing.
⇒ Toute refonte met presque aucune donnée en jeu.

### 2.2 Colonnes d'état qui se chevauchent (`products`)

`product_status` (enum active|preorder|discontinued|draft, **défaut active**), `sourcing_status` (TEXT+CHECK, 13 valeurs,
défaut `need_identified` posé aussi sur les 227 produits du catalogue), `creation_mode` (sert de drapeau « au catalogue »),
`completion_status` (dérivé par trigger), `requires_sample` (jamais mis à jour par le flux échantillon), `sourcing_type`
(redondant avec `assigned_client_id`), `rejection_reason` (mort), `archived_at`, `supplier_availability_status`.
Types énumérés morts : `sourcing_status_type`, `sample_status_type`, `sample_request_status_type`.
Données incohérentes réelles : (draft, order_placed), (preorder, received) ; 2 produits du catalogue en `sample_requested`.

### 2.3 Défauts de la fiche et de la liste (`apps/back-office/src/app/(protected)/produits/sourcing/`)

1. **Même avancement affiché 3 fois** : `SourcingPipelineBar` (10 étapes, `produits/[id]/page.tsx:280`), `SourcingStageGuide`
   (`:312`), onglets 1/2/3 auto-choisis (`:56-75`, `:315-342`) ; la liste Kanban en fait une 4e version (8 colonnes).
2. Barre : « Échantillon reçu » puis plus loin « Reçu » (commande) — libellés ambigus (`SourcingPipelineBar.tsx:5-16`) ;
   guide sans accents (`SourcingStageGuide.tsx:30-156`) ; page Échantillons « Recu », « Commande », « Archive »
   (`echantillons/echantillons-badges.tsx:37-66`).
3. **Deux systèmes de statut** : liste = `product_status` (`sourcing-page.helpers.tsx:22-55`, `SourcingFilters.tsx:118-128`),
   fiche = `sourcing_status`. Libellés définis 6 fois.
4. Onglet auto-sélectionné jamais correct (`useState` initialisé pendant le chargement, `page.tsx:111-119` avant `:195`).
5. **Pas de « Refuser »** : Annuler (reste visible), Archiver (sans motif ni confirmation, `SourcingProductRow.tsx:171`),
   Supprimer (définitif sans confirmation, `:176`) ; vraie logique de refus morte (`use-sourcing-mutations.ts:178-223`).
6. **« Valider » annonce un succès même en échec** (hook renvoie `false`, `use-sourcing-mutations.ts:36-54` ; page `:175-182`) ;
   écrit des colonnes de stock (`stock_status`, `stock_forecasted_in=0`) ; après validation l'historique sourcing est
   inaccessible (`use-sourcing-fetch.ts:81`).
7. **Échantillon non relié** : aucun bouton reçu/validé ; la réception de la commande ne met rien à jour ; double commande
   possible (`use-sourcing-sample-order.ts:123-157`) ; double toast (`:186` + `page.tsx:125`).
8. **Valeurs refusées par la base** : bouton « Devis reçu » écrit `quoted` (`SourcingCandidateSuppliers.tsx:389`, CHECK
   identified|contacted|responded|shortlisted|selected|rejected) ; `sample_rejected` proposé (`SourcingPipelineBar.tsx:19`,
   `SourcingFilters.tsx:26`) absent du CHECK.
9. Faits répétés : client ×3, prix d'achat ×3, fournisseur ×2, « Fournisseur requis » ×3, relances ×2.
10. Page Échantillons cachée (hors menu) qui crée des commandes sans `po_type` (`echantillons/use-echantillons.ts:81-91`) ;
    ~1 700 lignes de code échantillon mort ; 8 fonctions SQL mortes.

---

## 3. Consultations clients — état actuel

Pages `apps/back-office/src/app/(protected)/consultations/**`, package `packages/@verone/consultations/src/**`.

- **Structure** : `client_consultations` = 1 client (`organisation_id`/`enseigne_id`), statut en_attente|en_cours|terminee|annulee
  - `validated_at` parallèle ; `consultation_products` = lignes (produit, quantité, `proposed_price`, `cost_price_override`,
    `shipping_cost` total ligne, `selling_shipping_cost`, `is_free`, `is_sample`, statut pending|approved|rejected|revision_needed|ordered,
    `UNIQUE(consultation_id, product_id)`). Le fournisseur vient de `products.supplier_id` ⇒ **plusieurs fournisseurs par
    consultation déjà possibles** (1 consultation sur 6 le fait). Manque : regrouper plusieurs offres d'un même besoin, douane,
    prix de vente par défaut, produits similaires.
- **Bug majeur (données périmées)** : lignes chargées 2 fois (`use-consultation-detail.ts:69` + `ConsultationOrderInterface.tsx:28`),
  resynchronisées seulement si le nombre change (`:53-57`) ⇒ devis, PDF client, PDF marges et « Commander » utilisent des
  valeurs périmées après modification.
- **Deux « Commander »** aux règles différentes, tous deux incluant les lignes **refusées** (`use-consultation-detail.ts:259-268`,
  `page.tsx:350-355`) ; TVA figée 0,2 (`:265`, règle finance R8) ; commande fournisseur ouverte par produit, pas par fournisseur.
- **Prix** : sans prix proposé, le prix d'achat devient prix de vente (`use-consultations.ts:796`) ⇒ marge 0 et PDF client au
  prix d'achat (3 lignes sur 6 aujourd'hui) ; transport multiplié par la quantité dans le dialogue de commande
  (`ConsultationOrderDialog.tsx:82-89`) alors qu'ailleurs il est total de ligne.
- **PDF** : client (`ConsultationSummaryPdf.tsx`) n'expose jamais le fournisseur mais inclut les lignes refusées et ignore
  `selling_shipping_cost` ; interne (`ConsultationMarginReportPdf.tsx`) inclut les refusées, pas de douane ni d'assurance ;
  numérotation `PROP-`/`MARGES-` + 8 caractères d'identifiant.
- **Affichages répétés** : statut ×3 (dont pastille illisible sur la photo), montant total ×2, compteurs ×2, OK/Refus passe par
  « attente » (2 clics).
- **Lien sourcing** : même POST d'association copié 6 fois ; `products.consultation_id` jamais écrit ; suggestions de
  consultations en boucle de rechargement (`ConsultationSuggestions.tsx:41-85`) ; les produits en sourcing ne peuvent pas être
  ajoutés (`get_consultation_eligible_products` exige `active`).
- **Code** : ~2 400 lignes mortes (hooks dupliqués, composants non importés) ; `use-consultations.ts` 1 098 lignes.

---

## 4. Achat, catalogue et canaux de vente

### 4.1 Parcours réel de bout en bout

1. Import plugin ou création manuelle → `creation_mode=sourcing`, `product_status=draft`, `sourcing_status=supplier_search`
   (plugin) ou défaut `need_identified` (manuel).
2. Statut sourcing changé à la main, sans ordre imposé.
3. Échantillon = commande fournisseur `po_type='sample'` (brouillon → validée → reçue) ; la réception ajoute du stock comme
   une commande normale et **n'informe pas le produit**.
4. « Valider » → `active` + `complete`, sans regarder l'échantillon ; `sourcing_status` reste où il était.
5. Chaque canal activé séparément avec **sa propre règle** d'éligibilité.
6. Retrait : archiver (`discontinued` + `archived_at`) ≠ archiver en groupe (`archived_at` seul) ; restaurer laisse `discontinued` ;
   archiver ne dépublie pas.

### 4.2 Règles d'éligibilité divergentes

| Canal                                            | Statut                            | `archived_at` vérifié | Autre                                    |
| ------------------------------------------------ | --------------------------------- | --------------------- | ---------------------------------------- |
| Site internet (`get_site_internet_products`)     | active                            | non                   | publié, slug, prix, image                |
| Google (`get_google_merchant_eligible_products`) | active                            | non                   | routes exigent publié                    |
| Meta (`get_meta_eligible_products`)              | **cassé** (`p.status` inexistant) | non                   | publié                                   |
| Marketing                                        | active, preorder                  | oui                   | publié ou Meta                           |
| Appli LinkMe (`use-linkme-catalog.ts:147-149`)   | **aucun**                         | non                   | `channel_pricing.is_active` + visibilité |
| Vue publique LinkMe                              | active                            | non                   | vitrine                                  |
| Want It Now                                      | active, preorder                  | oui                   | drapeau                                  |
| Liste catalogue                                  | aucun                             | oui                   | —                                        |

Trigger `auto_add_sourcing_product_to_linkme` : produit sourcé pour un client actif sur LinkMe **dès sa création**.
5 définitions de « produit complet » ; garde de publication du site contournée par 5 chemins (`use-bulk-actions.ts:36-39`, …).

### 4.3 Coût de revient déjà modélisé (à réutiliser comme logique, triggers protégés)

`purchase_orders.shipping_cost_ht/customs_cost_ht/insurance_cost_ht` répartis au prorata de la valeur de ligne en
`purchase_order_items.allocated_*` ; `unit_cost_net = unit_price_ht + eco_tax + allocations/qty`
(`allocate_po_fees_and_calculate_unit_cost`, `supabase/migrations/20260209_001_ecotax_fee_allocation_system.sql:136-209`) ;
`products.cost_price` = PMP brut ; `cost_net_avg/min/max/last` = coût net ; `product_purchase_history` 194 lignes.

### 4.4 Marges par défaut — contradictoires aujourd'hui

25 % (constante LinkMe), 30 % (mapper Google), 50 % (sourcing + liste de prix de base : 207 lignes `margin_rate=0,5`, prix = coût × 1,5,
repli du site), 0 % (consultations). Aucun réglage global. Unités mélangées (pourcentage vs fraction). Convention du code :
**majoration sur coût** `prix = (coût + éco-taxe) × (1 + m/100)`.

### 4.5 Produits similaires

Aucune notion. `product_groups` (group_type variant|bundle|related, 0 ligne) est **à exclure** : lecture publique (RLS),
écriture pour tout authentifié (y compris LinkMe), et alimente l'export Google `item_group_id`. `variant_groups` (8) = variantes identiques.

---

## 5. Contrat du plugin Chrome (à ne pas casser)

- `GET /api/sourcing/auth` (cookies) → `200 {access_token, user_email, expires_at}` / `401 {error:'Non connecte'}`.
- `GET /api/brands` (Bearer) → `{brands:[{id,name,slug,brand_color,logo_url}]}`.
- `POST /api/sourcing/import` (Bearer, JSON : name, description, technical*description, supplier_reference, brand_ids, source_url,
  source_platform, images, cost_price, eco_tax, weight, dim*\*, material, color, style, condition, moq, lead_days, supplier{…}).
  - Doublon sur `supplier_page_url` → `409 {error, existing_product_id, existing_product_name, redirect_url}`.
  - Écrit : `organisations` (fournisseur), `products` (`product_status='draft'`, `creation_mode='sourcing'`,
    **`sourcing_status='supplier_search'`**, `sourcing_priority='medium'`, `cost_price`, `eco_tax_default`, `weight`, `dimensions`,
    `style`, `brand_ids`, `supplier_id`, `supplier_moq`, `supplier_page_url`, `sourcing_channel`, `internal_notes`, sku `SRC-…`),
    `sourcing_urls`, `product_images` (Cloudflare), `sourcing_candidate_suppliers` (upsert `product_id,supplier_id`, `identified`).
  - Réponse lue : `200 {success, redirect_url:'/produits/sourcing/produits/<id>', product{id,name,sku,cost_price,images_count},
supplier{name,country,created}}` — `sourcing_status` de la réponse non lu.
  - Erreurs : `{error, details}`.
- `POST /api/sourcing/import-supplier` (Bearer) → `{success, supplier_id, supplier_name, created, redirect_url}`.
- Risques déjà présents : nom < 5 caractères accepté par Zod mais refusé par la base ; `condition` perdu ; plateformes 1688 et
  AliExpress absentes de l'énumération ; 2 recherches de fournisseur sans filtre de type.

---

## 6. Recherche — comment font les professionnels

1. **Outils de sourcing / demande de prix (RFQ)** : un projet regroupe des besoins ; chaque besoin reçoit plusieurs offres
   fournisseurs comparées côte à côte (prix, MOQ, délai, échantillon, certifications) avec **coût de revient complet**
   (transport, douane, change). Sources : [TradeBeyond](https://www.tradebeyond.com/platform/supply-chain-cost),
   [AuraVMS](https://www.auravms.com/blogs/manage-multiple-supplier-quotes-procurement-guide),
   [QuoteWerks](https://quotewerks.com/features/vendor-rfq-software/), [SourcingGPT](https://sourcinggpt.ai/).
2. **Logiciels d'achat pour décorateurs** (Studio Designer, Design Manager, Programa, Houzz Pro, Ivy) : deux prix par article
   (achat / vente), **majoration appliquée ligne par ligne**, proposition client qui ne montre que le prix de vente, capture
   de produits depuis le navigateur, conversion de la proposition en facture. Sources :
   [Studio Designer](https://www.studiodesigner.com/features/interior-design-procurement/),
   [Knowlix](https://knowlix.ai/blog/manage-interior-design-clients-vendors-markups).
3. **Échantillons** : validation écrite d'un « échantillon de référence » avant la commande de production. Sources :
   [DDPexpert](https://www.ddpexpertblogs.com/news/sample-approval-process/),
   [Sourcing Playground](https://blog.sourcingplayground.com/the-role-of-samples-during-the-product-development-phases/).
4. **Produits similaires (PIM)** : associations typées entre produits (substitution, vente croisée, montée en gamme, pack)
   dans un seul modèle à discriminant. Sources : [Akeneo](https://help.akeneo.com/serenity-take-the-power-over-your-products/serenity-associations-of-products),
   [Webkul](https://webkul.com/blog/product-association-types-in-akeneo/).
5. **Cycle de vie** : un seul statut + liste explicite des passages autorisés + journal append-only des passages, jamais des
   drapeaux multiples. Sources : [DEV](https://dev.to/dannstorm/model-the-lifecycle-as-a-state-machine-not-a-bag-of-booleans-2a62),
   [Single source of truth](https://en.wikipedia.org/wiki/Single_source_of_truth).

---

## 7. Décisions de Roméo (2026-09-11)

- 4 étapes en haut de la **fiche produit sourcing** : Recherche, Contact, Évaluation, Négociation.
- Échantillon suivi **automatiquement** depuis la commande fournisseur échantillon ; reçu → « Valider au catalogue » ou « Refuser ».
- Refus après catalogue = **Retirer avec motif** : hors de tous les canaux, archivé, historique consultable, restaurable.
- Consultation = **projet** : 1 client, plusieurs fournisseurs, plusieurs produits ; **plusieurs options présentées au client**
  par besoin ; fournisseurs jamais montrés au client.
- **Marge réglable par consultation** = coefficient sur le **prix de revient** (achat + livraison + douane) : 40 % ⇒ × 1,40 ;
  chaque prix reste ajustable.
- Transport et douane **saisis une fois par projet**, **répartis au prorata**.
- « Validé au catalogue » ⇒ non publié tant que les canaux ne sont pas cochés ; restauration ⇒ retour sur les canaux d'avant.
- Ordre : Want It Now → sécurité (2 sessions) → consultations → sourcing → projet + similaires.
- Ménage autorisé à prévoir (remontré avant exécution) : tables échantillons vides, 5 fonctions SQL mortes, produit « TEST ».
- Le plugin Chrome ne doit pas casser.
- **Fiches produits Vérone ↔ Want It Now** (ajout 2026-09-11 soir) : propriété par champ. Champs factuels (dimensions,
  poids, matériaux, photos d'origine, GTIN) et fournisseur = **Vérone décide**, transmis à chaque import ; champs
  commerciaux Want It Now (nom commercial, traductions, prix public, pièce/style WIN) = Want It Now, sans effet sur
  Vérone ni ses autres canaux ; complément factuel saisi chez Want It Now = **proposition** vers Vérone (appliquée si le
  champ Vérone est vide, sinon validée). Chantier `[VER-CANAL-WIN-002]`, après envoi de `[VER-CANAL-WIN-001]`.

---

## 8. Modèle cible

### 8.1 Cycle de vie sourcing (réutiliser les codes existants ⇒ plugin inchangé)

| Écran               | `sourcing_status`     |
| ------------------- | --------------------- |
| Recherche           | `supplier_search`     |
| Contact             | `initial_contact`     |
| Évaluation          | `evaluation`          |
| Négociation         | `negotiation`         |
| Pause               | `on_hold`             |
| Refusé              | `refused` (nouveau)   |
| Validé au catalogue | `validated` (nouveau) |
| Jamais sourcé       | `NULL`                |

- **Expansion puis contraction** (staging et production partagent la base) : migration A = CHECK sur-ensemble ; release ;
  migration B = rattrapage (`need_identified` → `supplier_search` ; `sample_*`/`order_placed`/`received` → `negotiation` ;
  produits catalogue avec historique sourcing → `validated` ; autres → `NULL`), CHECK resserré, défaut `NULL`, cohérence
  `creation_mode`/`sourcing_status`.
- **Journal** = `sourcing_communications` + `entry_type` (exchange|note|status_change), `from_status`, `to_status` ;
  motif de refus/retrait dans `summary` (obligatoire) ; `rejection_reason` déprécié. Justification règle 1 : mêmes attributs,
  même frise, joints, perçus comme un seul journal.
- **RPC** `apply_product_lifecycle_action(p_product_id, p_action, p_to_stage, p_reason)` : SECURITY INVOKER + `is_backoffice_user()`,
  verrou de ligne, transitions autorisées, journal dans la même transaction, actions set_stage|pause|resume|refuse|reopen|validate|withdraw|restore ;
  `validate` n'écrit plus aucune colonne de stock ; **REVOKE EXECUTE FROM PUBLIC, anon**.
- **État échantillon dérivé** (fonction TS pure) depuis `purchase_order_items` ⋈ `purchase_orders(po_type='sample')` :
  brouillon → « à valider », validée/partielle → « commandé », reçue → « reçu », annulée seule → « annulé ». Aucun trigger.
- Historique toujours accessible : `creation_mode` garde son sens « au catalogue » (≈12 filtres) ; la liste/fiche sourcing
  filtre sur `sourcing_status IS NOT NULL`.

### 8.2 Retrait du catalogue et règle unique de vente

- Retirer = `archived_at = now()` + entrée de journal avec motif ; `product_status` et drapeaux de canal conservés ⇒ restaurer
  (`archived_at = NULL`) remet le produit sur ses canaux d'avant. Les 15 archives existantes sont `discontinued` : la
  restauration propose « remettre en vente ».
- Archivage unitaire, groupé et par groupe de variantes unifiés sur la RPC.
- `is_sellable(p products) RETURNS boolean STABLE` = non archivé ∧ statut active|preorder ∧ hors sourcing, branché sur site,
  vue publique LinkMe, appli LinkMe, Want It Now (miroir TS + test de parité), Google, Meta (répare `p.status`). Dépublication
  Google/Meta via les routes existantes, non modifiées.

### 8.3 Consultation projet

```
consultation_needs(id, consultation_id FK CASCADE, label TEXT NOT NULL, quantity INT CHECK>0,
  target_unit_price_ht NUMERIC NULL, notes TEXT, sort_order INT DEFAULT 0, created_by, created_at, updated_at)   -- RLS staff
consultation_products + need_id UUID NULL FK SET NULL, margin_percentage NUMERIC NULL CHECK 0..1000
  status : candidate (comparaison interne) | pending (option proposée au client) | approved (choisie) | rejected
  -- plusieurs options choisies par besoin autorisées
client_consultations + default_margin_percentage NUMERIC NULL, shipping_cost_ht NUMERIC DEFAULT 0, customs_cost_ht NUMERIC DEFAULT 0
```

- Justification règle 1 pour la table besoin : attributs différents (pas de produit, fournisseur ni coût), jamais commandé ni
  facturé, perçu comme « besoin » et non « option ».
- Rattrapage : `shipping_cost` de ligne → `shipping_cost_ht` projet (sans perte : les 2 consultations vivantes ont 1 ligne).
- `get_consultation_eligible_products` inclut les produits sourcing non refusés.
- **Économie** (une fonction pure partagée par tableau, KPI, commande, 2 PDF) :
  `coût = cost_price_override ?? products.cost_price` ; part des frais au prorata de la valeur de ligne (logique des commandes
  fournisseurs réimplémentée ; avant choix du client, chaque option porte sa part comme si elle était retenue) ;
  `prix de revient = coût + éco-taxe + (transport + douane)/quantité` ;
  `prix par défaut = prix de revient × (1 + marge/100)` avec `marge = marge de ligne ?? marge du projet` ;
  prix manuel prioritaire ; pas de marge ⇒ pas de prix par défaut (jamais le prix d'achat).
- **Figé** : « Envoyer la proposition » / « Créer le devis » écrivent les prix ; devis = lignes choisies seulement, TVA par ligne
  (règle R8) ; devis non brouillon ⇒ prix, quantités, statuts, frais et marge verrouillés ; devis brouillon ⇒ avertissement
  « régénérer ». Routes Qonto non modifiées.

### 8.4 Produits similaires

```
product_links(id, product_a_id FK CASCADE, product_b_id FK CASCADE,
  link_type TEXT CHECK IN ('same_product_other_supplier','close_series','competitor_alternative'),
  note TEXT, created_by DEFAULT auth.uid(), created_at,
  CHECK (product_a_id < product_b_id), UNIQUE (product_a_id, product_b_id))   -- RLS is_backoffice_user() seulement
VIEW product_similar (security_invoker) : les deux sens → (product_id, similar_product_id, link_type, note)
```

Jamais exporté vers un canal. Affiché sur la fiche catalogue, la fiche sourcing et en suggestions de consultation.

---

## 9. Écrans cibles

- **Fiche sourcing** : en-tête 4 étapes cliquables + pastille Pause/Refusé/Validé + pastille échantillon dérivée ; une barre
  d'actions (Annoter, Commander échantillon, Refuser avec motif, Valider au catalogue, Pause/Reprendre ; Valider/Refuser mis en
  avant quand l'échantillon est reçu) ; sections Fiche produit, Fournisseurs candidats, Prix, Journal, Consultations liées,
  Produits similaires. Supprimés : barre 13 statuts, guide, 3 onglets, cartes répétées.
- **Liste sourcing** : kanban 4 colonnes + filtres Pause / Refusés / Validés ; un seul système de statut.
- **Consultation** : en-tête client, marge par défaut, transport, douane ; besoins en accordéon, chacun avec un tableau
  comparatif des offres (photo, fournisseur, coût, frais répartis, prix de revient, prix par défaut, prix, marge € et %, MOQ,
  délai) ; statut par option ; suggestions de produits similaires ; 2 PDF.
- **Fiche catalogue** : « Retirer du catalogue » (motif obligatoire) ; bandeau « Retiré » + « Restaurer » + lien vers le journal
  et l'historique sourcing ; bloc « Produits similaires ».

---

## 10. Programme de développement

Une phase = une session = une PR vers `staging`, sans fusion automatique, 4 contrôles requis vérifiés à la main.
« Accord » = accord écrit de Roméo avant la migration.

| #   | Objet                                                                                                                | Base   | Tests clés                                               |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------- |
| P1  | Want It Now : cast de test, prix 0, rafraîchissement canal                                                           | non    | tests flux + test prix 0, type-check, lint, reviewer     |
| S1  | Fonctions exposées à `anon` (dont `reset_finance_auto_data`) — `sessions/session-1-fonctions-exposees-anon.md`       | accord | advisors, test site/LinkMe                               |
| S2  | Contrôle central d'accès en observation — `sessions/session-2-controle-central-acces.md`                             | non    | plugin Bearer, webhooks, cron                            |
| P2a | Consultations : données périmées, lignes refusées commandées, prix d'achat comme prix de vente, transport × quantité | non    | valeurs PDF avant/après sur les 2 consultations vivantes |
| P2b | Une fonction d'économie + un helper d'association                                                                    | non    | tests unitaires, totaux = P2a                            |
| P2c | Code mort consultations                                                                                              | non    | type-check, pages                                        |
| P3  | Sourcing : CHECK sur-ensemble, journal, RPC cycle de vie                                                             | accord | `BEGIN…ROLLBACK` import plugin exact, transitions        |
| P4  | Fiche sourcing simplifiée + échantillon dérivé                                                                       | non    | Playwright 4 produits, test statique contrat plugin      |
| P5  | Liste sourcing kanban 4 colonnes                                                                                     | non    | comptes identiques                                       |
| P6  | Contraction : rattrapage, CHECK resserré, ménage autorisé — **après mise en ligne P3-P5**                            | accord | import plugin, comptes catalogue/menu                    |
| P7  | `is_sellable` sur tous les canaux                                                                                    | accord | comptes par canal avant/après                            |
| P8  | Retirer / Restaurer du catalogue                                                                                     | non    | retrait → absent de 5 canaux → restauration              |
| P9  | Consultation projet : tables et colonnes                                                                             | accord | SQL, types régénérés                                     |
| P10 | Calcul frais répartis + prix par défaut                                                                              | non    | parité avec une commande fournisseur type                |
| P11 | Écran consultation projet                                                                                            | non    | Playwright                                               |
| P12 | 2 PDF + gel des prix                                                                                                 | non    | aucun fournisseur/coût dans le PDF client                |
| P13 | Produits similaires                                                                                                  | accord | accès refusé hors back-office, Playwright                |

**Garde-fous permanents** : à chaque migration touchant `products`, insertion exacte du plugin en `BEGIN…ROLLBACK`, test statique
des valeurs écrites par `apps/back-office/src/app/api/sourcing/import/route.ts`, appel local 200 puis 409 ; aucun trigger stock
touché ; aucune route Qonto modifiée ; `supabase db push` interdit ; types régénérés avec chaque migration ; toute nouvelle
fonction SQL termine par `REVOKE EXECUTE … FROM PUBLIC, anon`.

**Risques** : P7 masque sur LinkMe les produits sourcés activés trop tôt par le trigger (voulu, à annoncer aux affiliés) ;
filtre PostgREST sur champ calculé dans une ressource imbriquée à vérifier ; P6 strictement après la release ;
TVA 20 % codée en dur sur les commandes échantillon (`use-sourcing-sample-order.ts:176,199`) à traiter plus tard.

---

## 11. Prompt de démarrage d'une phase (modèle)

```
Dossier : ~/verone-back-office-V1

## Vérifications d'ouverture, lecture seule
1. `pwd` et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
2. MCP Supabase `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
3. `git status` et `git branch --show-current` : dis-moi l'état, ne touche à rien.
4. GitHub : le compte actif du poste peut être WantitNow ; pour tout accès au dépôt, préfixer
   GH_TOKEN="$(gh auth token -u Verone2021)".

## Lecture
  docs/scratchpad/audit-2026-09-11/RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md (§ concernés)
  .claude/rules/database-modeling-patterns.md, database.md, finance.md, non-regression.md,
  stock-triggers-protected.md, workflow.md
Shell : /usr/bin/grep (le grep du poste ignore les fichiers gitignorés).

## Mission : Phase <Pn> — <objet> (voir § 10), et rien d'autre

ÉTAPE 1 — lecture seule : relis les fichiers cités, confirme ou infirme chaque constat du rapport
sur ta phase, mesure l'état « avant » (valeurs, captures, comptes).
ÉTAPE 2 — propose le changement exact (SQL montré avant, fichiers touchés, retour arrière).
Si la phase touche la base : ATTENDS MON ACCORD ÉCRIT.
ÉTAPE 3 — implémente, vérifie (type-check, lint, tests, Playwright), mesure « après », rapport
docs/scratchpad/dev-report-<date>-<phase>.md, reviewer-agent.
ÉTAPE 4 — un seul push, PR vers staging sans fusion automatique, 4 contrôles vérifiés à la main.

INTERDITS : aucun trigger stock touché, aucune route Qonto modifiée, aucune donnée de test,
aucune suppression de ligne sans mon accord, `supabase db push` interdit, ne jamais casser le
contrat du plugin Chrome (§ 5).
```
