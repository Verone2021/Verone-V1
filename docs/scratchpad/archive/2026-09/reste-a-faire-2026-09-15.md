> **PÉRIMÉ le 2026-09-18** — le reste à faire encore valable a été reporté dans `.claude/work/ACTIVE.md`
> (sections « Backlog » et « Décisions en attente de Roméo »). Ce fichier est conservé pour le détail
> du chantier du 15/09 et ses valeurs de référence. Ne plus s'en servir comme source d'état.

# Reste à faire — état au 2026-09-15

Fichier de reprise : si une session s'arrête, la suivante lit ce fichier puis
`docs/scratchpad/dev-plan-2026-09-15-BO-PRODUCTS-PROFIT-001.md` (plan approuvé par Roméo le 15/09).

Accès dépôt : préfixer `gh` par `GH_TOKEN="$(gh auth token -u Verone2021)"` et passer `-R Verone2021/Verone-V1`.
Dépôt privé sur GitHub Free : aucune protection de branche, jamais `--auto`, vérifier les 4 contrôles requis à la main.

---

## A. Chantier du 15/09 (ordre approuvé par Roméo)

| #   | Étape                                                                                                                                                                     | État                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | Filet écrit (ce fichier + plan + ACTIVE.md)                                                                                                                               | fait                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1   | Release E1 staging → main (#1148 → #1158 : BO-SEC-005/006/007, P9, P3, P4, P5, P4b, P7, P8)                                                                               | **fait** : #1159 fusionnée 12:34 UTC, Vercel prêt 12:47 ; site / linkme.network / login 200 ; edge logs après 12:40 : 0 réponse 5xx, 31 requêtes 200 de l'équipe sur la nouvelle version. Écrans connectés non vérifiés par l'agent : `E2E_TEST_PASSWORD` absent de `apps/back-office/.env.local` (mot de passe changé le 30/07) ; `/produits/sourcing` sans session → React #310 (défaut connu pré-existant)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | Calcul unique `product-sales-margin.ts` + tests                                                                                                                           | **fait** (non commité) : 8/8 tests, rapport `dev-report-2026-09-15-BO-PRODUCTS-PROFIT-001.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3   | Hook `use-product-sales-margin.ts`, cartes `LinkMeNetMarginCard` + `SalesByChannelCard`, refonte `ProductProfitabilitySection`, fiche LinkMe + fiche catalogue (2 copies) | **fait** (non commité) ; retouche coordinateur : pourcentages et coefficient au format français, « 1 propose / 1 a vendu »                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 4   | Vérifications : tests, types, lint, valeurs SQL, Playwright, revue                                                                                                        | **en grande partie fait** : tsc products + back-office 0, eslint 0, écran local 1440 conforme aux valeurs SQL (Plateau bois : 1 880 pcs, 64 cmd, 37 129,10 €, marge 16 449,10 € 44,3 %, commissions exclues 6 552,63 € ; Sac jute PM : Manuel 300, 1 077 €, 438 €, 40,7 %, « Aucune vente LinkMe »), 0 erreur console. Relecture reviewer-agent 13:00 UTC (`review-report-2026-09-15-BO-PRODUCTS-PROFIT-001.md`) : A PASS WITH WARNINGS, B PASS, C PASS, 0 CRITICAL. Corrigé après relecture : `LinkMeNetMarginCard` 213 → 140 lignes (`LinkMeRealSalesSection` + `ProfitabilityTile`), clés stables `SalesByChannelCard` ; historiques achats / ventes passés en `ResponsiveDataView` (tableaux encore visibles à 375 px avant correctif, relevé à l'écran). Écran après refactor : valeurs identiques, « 40,5 % », « ×1,68 », « 1 propose · 1 a vendu ». Reste : capture 375 après correctif |
| 5   | Un push, PR vers staging, fusion squash, release E2, vérification live                                                                                                    | **en attente du go de Roméo** (consigne 15/09 : compte rendu d'abord). Commits locaux prêts : `ac667037` marge, `b511fb8d` création produit, `087b6332` tableau de bord, commit CI E2E. Découpage conseillé : PR création produit (urgente), PR marge, PR tableau de bord + CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6   | Clôture ACTIVE.md + ce fichier + compte rendu Roméo                                                                                                                       | compte rendu envoyé 15/09 ~13:20 UTC                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Release : workflow `auto-release-staging-to-main.yml` (lancement manuel), PR du robot → sortir du brouillon →
fermer / rouvrir (sinon pas de CI) → 4 contrôles verts → fusion **merge commit sans supprimer staging** →
Vercel prêt, pages publiques 200, écrans connectés en lecture seule.

Valeurs de référence (base de prod, 15/09) :

- Plateau bois 20 × 30 (LinkMe, produit enseigne) : 1 880 pièces, encaissé Vérone 37 129,10 €, commissions affiliés
  6 552,63 € (exclues), CA client 43 677,80 €, coût 11 € (prix d'achat seul → avertissement), marge nette
  16 449,10 € ≈ 44,3 %, 1 affilié propose / 1 a vendu.
- Sac jute PM (Manuel) : 300 pièces, 1 077 €, revient 2,13 €, marge 438 € (40,7 %), aucune vente LinkMe.
  64 commandes.
- Produits créés par un affilié (ex. Poubelle à POKAWA) : commission Vérone = prix × qté × taux / 100, pas de marge.
  Poubelle à POKAWA : 5 pièces, 4 commandes, taux 15 % → commission Vérone 729,32 €, 1 affilié.
- Release E1 = PR #1159 (fermée / rouverte 15/09 12:16 UTC pour lancer les contrôles). 4 contrôles requis verts
  (types drift relancé une fois : téléchargement Supabase CLI en HTTP 500). E2E « smoke-golden » et « smoke-domaine »
  rouges : « E2E_TEST_EMAIL absente » alors que le secret existe dans le dépôt (créé 2026-04-24) → le job ne le reçoit pas
  (câblage `quality.yml` ou portée du secret) ; ces jobs sont « skipping » sur les PR vers staging et ne tournent que
  vers main ; non requis. Configuration CI à corriger (§ D).

## A0. Plan approuvé 15/09 (suite) — exécution

- Bloc 0 (ménage liste) : fait.
- **Bloc M — base** : migration `supabase/migrations/20260915140000_bo_products_profit_002_sales_item_cost_snapshot.sql`
  écrite (table 1:1 `sales_order_item_costs`, déclencheur `trg_snapshot_item_costs_on_validation`, reprise
  historique, RPC `get_linkme_verone_margin`). **Essai annulé n°1 (15/09 ~13:50 UTC) OK** : 493 instantanés =
  493 lignes valables ; sources purchase_history 88 · current_cost_net_avg 39 · current_cost_price 360 · missing 6 ;
  LinkMe : encaissé Vérone (hors produits affiliés) 167 198,83 €, marge 56 600,49 €, commissions exclues 24 936,36 € ;
  PLA-0001 1 880 pcs marge 16 449,10 € ; 0 commande modifiée, 0 ligne `audit_logs`. **Essai annulé n°2 OK** :
  validation de SO-2026-00203 → instantané `validation` 11,00 € sans frais ; retour brouillon → 0 instantané ;
  RPC en rôle back-office (compte Roméo) : 470 lignes, 140 commandes, 4 218 pcs, encaissé Vérone 167 198,83 €, coût
  110 598,34 €, marge 56 600,49 € (33,9 %), coefficient 1,51, commissions exclues 24 936,36 €, CA client
  203 475,05 €, 356 lignes sans frais, 10 lignes produits affiliés (commission Vérone 1 708,92 €) ; 2025 : marge
  17 798,68 € (33,2 %). **APPLIQUÉE en production 15/09 ~14:00 UTC** : 493 instantanés (mêmes sources que l'essai), déclencheur
  présent, RLS activée, anon sans accès (table, RPC, fonction de déclencheur), authenticated sans INSERT,
  0 commande modifiée, 0 ligne `audit_logs` ; carnet `20260915140000 bo_products_profit_002_sales_item_cost_snapshot` ;
  advisors sécurité : aucune alerte sur les nouveaux objets ; site / linkme.network / login 200 ; types régénérés
  (`--linked` + prettier, bloc `__InternalSupabase` retiré pour rester aligné sur la sortie CI). Reste : code
  (cartes, RPC dans la page analytics LinkMe, % + coefficient partout).

- **Bloc P — base** : migration `20260915150000_bo_perf_s3_002_get_sidebar_counts.sql` (filtres du hook actuel, dont
  sourcing « en cours » par `sourcing_status`). Essai annulé en rôle back-office : 11 valeurs **identiques** aux
  comptages actuels (stock 2, consultations 2, LinkMe 23, produits incomplets 199, sourcing 6, brouillons 18,
  expéditions 9, transactions 107, approbations LinkMe 18, formulaires 0, infos LinkMe 0), 366 ms, anon sans droit.
  **APPLIQUÉE 15/09 ~14:20 UTC**, carnet `20260915150000 bo_perf_s3_002_get_sidebar_counts`, SECURITY INVOKER,
  anon sans droit ; types régénérés (+1 ligne ; la CLI ajoute une ligne d'erreur PostHog en fin de fichier et le bloc
  `__InternalSupabase` : retirés avant prettier). Hook `useSidebarCounts` (non commité) : 1 appel RPC au lieu de 11,
  lecture défensive du JSON, `retry: 1` + `retryDelay` exponentiel (5 s → 30 s max). Reste : mesure avant / après en
  production après mise en ligne.
- **Bloc A + L — code** (non commité) : `auth-wrapper.tsx` (redirection `/login` sans rendre la page, `/module-inactive`
  public, `min-w-0` + padding `p-4 md:p-6`), `tabs-navigation.tsx` (`gap-4 md:gap-8 overflow-x-auto`).
- **Bloc D — règle workflow** (non commité) : section auto-merge suspendue dans `.claude/rules/workflow.md` + ADR-040.
- **Bloc N — code mort** (non commité, `git rm` fait) : dossier `ui-business/src/components/validation/` (10 fichiers,
  export retiré de `ui-business/src/index.ts`), 4 réexports `apps/back-office/src/components/business/*sourcing*` +
  `sample-validation-simple.tsx`, `client-assignment-selector.tsx`, `ProductCreationWizard.tsx` (+ export),
  `use-top-products.ts` (+ export), `approveSample` / `rejectSample` retirés de `use-sourcing-mutations.ts` et
  `hooks/sourcing/index.ts` (paramètre `products` devenu inutile retiré). Liens cassés corrigés dans la copie servie
  `detail/[id]` : `StockAlertBanner` et `StockReorderCard` → `/commandes/fournisseurs?id=…` et `/commandes/fournisseurs`.
  Aucune référence restante (grep). tsc ui-business 0.
- **Bloc D — fonctions SQL mortes** : `get_product_margin_analysis(uuid,date,date)` et
  `get_product_cost_price_details(uuid)` — 0 appelant code, 0 dépendance / vue / cron, 0 appel
  (pg_stat_statements), déjà fermées à anon et authenticated. Migration
  `20260915160000_bo_products_profit_003_drop_unused_margin_functions.sql` (définitions complètes gardées en retour
  arrière). Essai annulé OK (0 restante) ; application lancée 15/09 ~14:35 UTC.
- **Bloc S — lot 7 + 4 bis** : migration `20260915170000_bo_sec_004_lot7_close_unused_anon_functions.sql`
  (remplace la proposition non appliquée `20260912040000`, supprimée) : 4 fonctions sans appelant fermées à tous
  (`check_linkme_access_by_email`, `get_linkme_public_stats`, `get_public_selection(text,text)`,
  `get_best_mcp_strategy`), 3 fermées à anon seulement (`get_activity_stats`, `get_pending_approvals_count`,
  `get_categories_with_real_counts`). Inventaire : 0 appel anon sur 72 h pour les 7. **Essai annulé OK** : anon →
  `get_site_internet_products('verone')` 125 produits, `get_public_selection(uuid)` et `_by_slug` (B&W) OK, fonctions
  fermées 42501 ; back-office connecté → approbations 0, catégories 12. **APPLIQUÉ** (carnet `20260915170000`), droits vérifiés (7 fermées comme prévu ; publiques
  `get_site_internet_products`, `get_public_selection(uuid)`, `_by_slug`, `track_selection_view`,
  `create_public_linkme_order`, `product_is_sellable` toujours ouvertes) ; sans session : veronecollections.fr,
  `/catalogue`, linkme.network, `/s/selection-black-white-burger`, `/s/<uuid>` → 200 ; aucune erreur RPC ≥ 400 dans les
  journaux depuis. Advisors : anon SD **19 → 13**, authenticated SD **144 → 141**, security_definer_view 4 → **1**
  → `scripts/supabase-advisors-baseline.json` abaissé aux valeurs mesurées (13 / 141 / 7 / 1 / 1), non commité.
- **Bloc S — suite (décisions Roméo 15/09 ~15:00 UTC)** : gardes finance owner / admin ; stock non touché
  (5 fonctions du stock prévisionnel, `mark_warehouse_exit` exclus) ; 5 règles RLS cassées supprimées avec retour
  arrière exact ; `/s/` gardé ouvert ; protocole « zéro casse stock » (instantané + empreinte du circuit stock avant /
  après dans une transaction annulée : SO-2026-00192 valider / dévalider, SO-2026-00131 expédier, PO-2026-00039
  valider / réceptionner, lecture des 2 vues d'alertes). Inventaire : garde stricte sur 9 fonctions finance ; retrait
  du droit `authenticated` sans garde sur `recalculate_order_paid_amount`, `create_notification_for_owners`
  (déclencheurs), `increment_promo_usage` (webhook Stripe), `auto_match_bank_transaction` ×2 ;
  `decrement_selection_products_count` → back-office ; `update_user_contact` → sa propre fiche ou back-office ;
  seul `catalog-manager-test@verone.test` perd l'accès. Lot 8 : 120 fonctions de déclencheur, 21 écritures,
  62 lectures (35 exclues dont tout le stock). Supabase offre **free** : pas de sauvegarde restaurable.
- **Bloc D — commit `cc10edae` [BO-AUDIT-005] : RETIRÉ DU LOT (décision agent, à signaler à Roméo)**. Branche
  `fix/BO-AUDIT-005-ecritures-db-impossibles` (base `e6e0e31c`, #1129). Ce n'est **pas** une purge documentaire :
  instantané « wip » en `--no-verify` qui mélange `apps/back-office/src/middleware.ts` (+115, garde centrale déjà
  retirée 5 fois), **4 routes Qonto** (`balance`, `clients`, `sync-invoices`, `transactions` — routes protégées,
  validation Roméo obligatoire), `api/logs`, `api/emails/form-reply`, le webhook Revolut LinkMe (−238), des docs
  d'audit, des archives scratchpad et un logo. Relève du chantier **BO-AUDIT-003** (mur API en 3 temps : Qonto seules,
  observation, activation) → à reprendre séparément, jamais en bloc.
- **Bloc C — fiche catalogue unique** (non commité) : contrôles #1022 reportés dans la copie servie
  `detail/[id]` (`product-publication-dashboard.tsx` : poids + dimensions requis, méta requise ;
  `product-publication-tab.tsx` : 7 critères), puis `git rm -r produits/catalogue/[id]` (66 fichiers) ; réécriture
  `next.config.js` conservée. Reste : type-check, écran onglet Publication + fiche uuid.
- **Tests écran 15/09 ~15:45-15:55 UTC (Playwright local, 0 enregistrement)** :
  - Catalogue liste `/produits/catalogue` 375 / 768 / 1024 / 1440 / 1920 : `scrollWidth` = largeur à chaque taille,
    cartes (0 tableau), vues rapides et onglets défilent dans leur bandeau ; 1 seule erreur console = délai de
    connexion temps réel passager. Captures `.playwright-mcp/screenshots/20260915/catalogue-liste-{375,768,1024,1920}-*`.
  - Page analytics LinkMe, carte « Marge nette Vérone » (Tout) : 167 199 € encaissé, 110 598 € coût, 56 600 € marge,
    33,9 %, ×1,51, 4 218 pcs / 140 cmd, commissions exclues 24 936 €, 356 lignes sans frais, 10 lignes affiliés
    (1 709 €) → conforme à la RPC. 1 seul appel `get_linkme_verone_margin`.
  - Compteurs du menu : 1 seul appel `get_sidebar_counts` (les HEAD restants = en-tête : messages, notifications,
    médias, formulaires, demandes d'infos LinkMe).
  - Sans session (contexte navigateur vierge) : `/produits/sourcing`, `/produits/catalogue`, `/dashboard` → `/login`,
    0 erreur console, 0 React #310.
  - Fiche catalogue Sac jute PM, onglet Publication : liste « Prêt à publier — 5/10 critères requis » avec Poids,
    Dimensions, Méta description SEO requis (seul « Publié en ligne » optionnel), interrupteur LinkMe présent.
  - Fiche LinkMe Plateau bois (PLA-0001) : 1 880 pcs, 64 cmd, encaissé 37 129,10 €, marge 16 449,10 € (44,3 %),
    ×1,80, commissions exclues 6 552,63 €, marge par pièce 7,50 € (40,5 %, ×1,68), 1 affilié (Pokawa).
  - Formulaire nouveau produit (sans enregistrer : démarrer + onglet ne sauvegardent pas, vérifié dans le code) :
    onglet Fournisseur → liste de 21 fournisseurs → choix « AFFECT BUILDING CONSULTING » affiché dans le sélecteur ;
    `products` créés sur 20 min = 0.
  - Bloc D livré (`dev-report-2026-09-15-BO-PRODUCTS-PROFIT-004.md`) : « Utiliser ce prix » (site via
    `useUpdateChannelPrice` → `/api/channel-pricing/upsert` existante, garde prix minimum ; prix cible via
    `useUpdateTargetPrice`), confirmation avant remplacement ; filtres période / client / canal + colonne Client.
    Relecture coordinateur : `useChannelPricing` renvoie tous les canaux (même sans prix) et la route fait un upsert
    → les 194 produits sans ligne site sont couverts ; ajout `targetReady` (bouton Valider bloqué tant que la ligne
    site n'est pas chargée) + `aria-label` sur les boutons icône ; tsc products 0, ESLint 0.
    Écran Sac jute PM (Tarification) : filtres présents (périodes, client DSA, canaux), ligne SO-2026-00096 DSA
    300 pcs 3,59 € coût 2,13 € « Coût actuel » 40,7 % ×1,69.
  - Fiche produit 375 : `scrollWidth` document 375 mais `main` 461 (rangée Retirer / Dupliquer / Partager) +
    2 tableaux visibles (« Prix par canal — détail », « Tous les achats fournisseurs ») → correction confiée
    (`dev-report-2026-09-15-BO-PRODUCT-SHEET-MOBILE-001.md`), puis captures 375 / 768 / 1024 / 1440 / 1920.
- **Correctif mobile fiche produit (dev-agent, 15/09 ~16:12 UTC)** : `product-detail-header.tsx` (actions sur une
  2e ligne sous md, `md:contents`), `ChannelPricingDetailed.tsx` + nouveau `ChannelPricingCard.tsx`,
  `PurchaseOrdersTable.tsx` → `ResponsiveDataView` (tableau inchangé ≥ md) ; tsc back-office 0, ESLint 0.
  **Captures fiche Sac jute PM 375 / 768 / 1024 / 1440 / 1920** (en-tête + onglet Tarification,
  `fiche-produit-{entete,tarification}-<taille>-161500.jpeg`) : `main.scrollWidth` = largeur visible à chaque
  taille, 0 tableau à 375 (5 à partir de 768), 2 boutons « Utiliser ce prix », 0 erreur de page. 1 erreur console :
  `get_sidebar_counts` 500 / 57014 (délai dépassé) pendant les 5 rechargements rapprochés.
  **Analyse (16:25 UTC)** : délai `authenticated` = 8 s ; appel isolé en rôle salarié 414 ms (compteur alertes stock
  13 ms, `linkme_orders_enriched` 32 ms + 103 ms de planification) ; `pg_stat_statements` : `get_sidebar_counts`
  13 appels, moyenne 854 ms, max 1 890 ms ; ancien `get_stock_alerts_count` seul : 184 304 appels, moyenne 143 ms,
  **max 7 737 ms** ; délais dépassés sur 24 h : 30 (12 h) + 167 (13 h, épisode de lenteur, ancien hook) + 1 (16:10,
  le nôtre) ; aucune requête lourde en cours, seul autre événement à 16:09:40 = essai de l'agent bloc S (erreur
  d'énumération `movement_type`). Hook : garde les chiffres précédents sur erreur, relance unique après 5 s. **Pas
  une régression mesurable → pas de changement** ; risque connu : un compteur lent fait échouer les 11 d'un coup →
  à suivre dans la mesure avant / après mise en ligne (chantier D « compteur alertes stock »). Consigne envoyée à
  l'agent bloc S : `lock_timeout 2s` + `statement_timeout 20s` dans chaque essai annulé, transactions courtes.
- **Décision Roméo 15/09 ~16:45 UTC : bloc S (lots 8 / 9 / 10 / 11) reporté à une session dédiée** (« Oui,
  reporter »). Brouillons déplacés dans `docs/scratchpad/bloc-S-drafts-2026-09-15/` (hors `supabase/migrations`,
  non suivis). Pour la reprise : lot 9 à régénérer depuis `pg_get_functiondef` avec contrôle md5 ; empreinte stock
  à refaire en rôle salarié (`SET LOCAL ROLE authenticated` + claims) en rejouant SO-2026-00192 valider /
  dévalider, SO-2026-00131 expédier, PO-2026-00039 valider / réceptionner, lecture des 2 vues d'alertes ;
  `lock_timeout 2s` ; lot 10 hors heures d'activité. Plan d'envoi mis à jour : commits 8 (bloc S) et 9 (règles
  RLS) retirés ; lot 7 (170000, déjà appliqué) + baseline restent.
- **Bloc S — contrôle coordinateur des brouillons de l'agent (15/09 ~16:40 UTC) : NON APPLICABLE EN L'ÉTAT**
  (`dev-report-2026-09-15-BO-SEC-BLOC-S.md`, 4 migrations `2026091518xxxx`, rien appliqué) :
  - **Lot 8** (214 signatures, 128 « PUBLIC, anon, authenticated » + 86 « PUBLIC, anon ») : vérifié OK — 214
    signatures existent, 0 SECURITY DEFINER, les 128 sont toutes `RETURNS trigger` ; aucune n'est utilisée par une
    règle RLS, une vue, un défaut ou une contrainte ; 7 appelées par l'app (`generate_so_number`,
    `get_linkme_orders`…) gardent `authenticated` ; aucune appelée par le site / pages publiques. Écart 214 vs
    203 non détaillé fonction par fonction.
  - **Lot 9 (gardes finance) : DANGEREUX** — comparaison corps migration vs instantané (= production, md5
    identiques) : `apply_matching_rule_confirm`, `delete_order_payment`, `decrement_selection_products_count`,
    `update_user_contact` 5 arg. = garde ajoutée seulement (0 ligne retirée) ; mais
    `create_customer_invoice_from_order` −87 lignes, `create_supplier_invoice` −51,
    `link_linkme_payment_to_bank_transaction` −59, `link_transaction_to_document` −100,
    `toggle_ignore_transaction` −42, `unlink_transaction_document` −32 → **corps tronqués/réécrits, casserait
    factures et rapprochement bancaire**. `auto_classify_all_unmatched` à revérifier (corps sur une ligne). À
    régénérer mécaniquement depuis `pg_get_functiondef` (garde insérée après le premier `BEGIN`, contrôle md5 du
    corps sans garde = production). Appelants vérifiés : écrans back-office uniquement ; LinkMe profil = 5 arg.
    avec son propre e-mail (garde OK) ; webhook Stripe = clé serveur (`increment_promo_usage` garde service_role).
  - **Lot 10** : retour arrière recréait les règles `TO authenticated` alors qu'elles sont `TO public` en
    production → **corrigé** (clause retirée). Verrou ACCESS EXCLUSIVE sur `purchase_orders` / `stock_movements`.
  - **Lot 11** : `REVOKE SELECT … FROM anon` sur les 2 vues d'alertes, retour arrière exact.
  - **Empreinte stock de l'agent insuffisante** : simples comptages exécutés en rôle administrateur (ignore droits et
    RLS), scénarios S1–S4 non rejoués → protocole « zéro casse stock » **non respecté**. Données de scénario
    relevées : SO-2026-00192 brouillon (PLA-0001 ×20, réel 594, prév. sortant 55), SO-2026-00131 validée
    (SEP-0002 ×1, réel 8, prév. sortant 1), PO-2026-00039 brouillon (PRD-0314 ×1). Déclencheurs du circuit listés
    (sales_orders 26, purchase_orders 17, receptions 5, shipments 5, stock_movements 5, products 17).
  - **Incident probable** : essai annulé du lot 10 (~16:08) → 1 appel compteurs du menu en échec (16:10:18,
    57014), aucune donnée modifiée.
- **Relecture PROFIT-002 / 004 (reviewer-agent, 15/09 ~16:15 UTC)** : **PASS WITH WARNINGS**, 0 critique
  (`review-report-2026-09-15-BO-PRODUCTS-PROFIT-002-004.md`). Calculs vérifiés (marge %, coefficient, commission
  exclue, lignes couvertes, coût figé prioritaire), dialogue sans écrasement silencieux, garde prix minimum
  conservée. Remarques : `Date.now()` hors `useMemo` dans `SalesHistoryTable` → **corrigé** (déplacé dans le
  calcul) ; `'use client'` manquant dans `SalesHistoryFiltersBar` → **faux, déjà présent** ligne 1.
- **Surveillance production après lot 7 (14:40 → 16:10 UTC)** : carnet = 140000 / 150000 / 160000 / 170000 ;
  site, `/catalogue`, linkme.network, `/s/selection-black-white-burger` → 200 (< 2 s) ; journaux web : **0 réponse 5xx,
  0 refus 401/403 sur les fonctions**, 1 seule erreur (image produit 400) ; journaux Postgres : uniquement nos essais
  annulés / requêtes d'inventaire (colonnes inexistantes, messages ESSAI_ANNULE) et `get_user_role()` absente (14:11,
  anciennes règles RLS cassées, traitées au bloc S) → aucun refus pour un vrai utilisateur. Types non commités :
  −`get_product_cost_price_details`, −`get_product_margin_analysis`, +`get_sidebar_counts` (conforme).
- **Envoi fait (15/09 ~17:00 UTC)** : commits `0631e525` [BO-PERF-S3-002], `5ec778f3` [BO-PRODUCTS-PROFIT-004],
  `833c3c91` [BO-PRODUCTS-CATALOGUE-001], `78dcb298` [BO-REFACTOR-RL-001] (identifiant « R-L » refusé par le
  contrôle du message), `1bb70771` [BO-CLEANUP-001], `1a602b61` [BO-SEC-004], `02dc2e6a` docs, `31b3e892`
  [BO-AUTH-310-001] (regroupé dans la même PR : le `min-w-0` conditionne l'affichage mobile). Branche poussée
  (0 en retard sur staging) → **PR #1160**. Règle workflow + ADR-040 → **PR #1161** (branche créée par l'API
  GitHub depuis staging `acf5548c`, 2 fichiers, pour ne pas basculer le dossier local sous le serveur de Roméo).
  Aucune fusion. Plan initial à 10 commits / 6 PR remplacé par ce découpage (bloc S reporté).
- **CI 15/09 ~17:10 UTC — « DB FK drift check » rouge** : #1160 = 1 écart
  (`sales_order_item_costs.sales_order_item_id` CASCADE « non déclarée ») ; #1161 = 2 écarts (la migration 140000
  n'est pas encore sur staging → se résout après fusion de #1160 puis relance). Cause #1160 : le motif
  `FK_INLINE_PATTERN` de `scripts/db-drift-check.py` ne connaissait pas `uuid PRIMARY KEY REFERENCES …` et capturait
  « primary » comme colonne. Correctif du lecteur (pas de la base, pas de la migration appliquée, aucun seuil
  touché) : déclarations 235 → 235, seule `…primary` remplacée par `…sales_order_item_id` (CASCADE). Commit
  [INFRA-CI-FKDRIFT-001] poussé sur #1160. Autres contrôles déjà verts : types, advisors sécurité, Vercel.
- **CI 15/09 ~20:40 UTC** : « ESLint + Type-Check + Build » annulé à 20 min (limite `timeout-minutes: 20` du job ;
  lint + types 6 min 30, build des 3 applis réussi en 11 min 42, coupure pendant l'étape informative « Alignement
  types DB ») → relancé, **vert** (20:35). Les tests E2E se sont alors lancés : **smoke-golden rouge** — connexion
  refusée « Email ou mot de passe incorrect » (secret CI `E2E_TEST_PASSWORD` = ancien mot de passe, changé par Roméo
  le 30/07 ; sujet « mot de passe de test » abandonné par Roméo). Déjà rouge sur staging 12:17 et sur les PR P4 /
  P4b / P7 (avant ce lot). Job `continue-on-error: true` ; le rapport Playwright contient l'ancien mot de passe en
  clair (dépôt privé, mot de passe périmé). Le parcours « connexion réussie → tableau de bord » avec le nouvel
  `auth-wrapper` n'est donc pas couvert par la CI → vérification par lecture du code : `login/page.tsx` appelle
  `signInWithPassword` puis `router.push('/dashboard')` (navigation client, même `AuthWrapper` monté) ;
  `@supabase/auth-js` 2.80.0 fait `await _saveSession` puis `await _notifyAllSubscribers('SIGNED_IN')` **avant** de
  rendre la main → `onAuthStateChange` a déjà posé `user` quand `/dashboard` s'affiche, `mustRedirect` reste faux,
  pas de retour vers `/login`. À contrôler aussi en production après mise en ligne (session salarié existante).
  Suite possible (hors lot) : remplacer le secret CI `E2E_TEST_PASSWORD` si Roméo le souhaite.
- **CI #1160 terminée (15/09 ~20:50 UTC)** : 4 contrôles requis **verts** (ESLint + Type-Check + Build, DB FK drift,
  Supabase TS types drift, E2E Smoke alias) + advisors sécurité + Vercel. Jobs E2E non bloquants rouges
  (smoke-golden + smoke-domaine 1-4) : tous arrêtés à `tests/auth.setup.ts:55` (connexion refusée, ancien mot de
  passe), « 18 did not run » par shard → **les parcours E2E n'ont pas été exécutés** ; la couverture écran de ce lot
  repose sur les tests Playwright locaux du 15/09. #1161 : seul « DB FK drift » rouge (migration 140000 absente de
  staging) → relancer après fusion de #1160.
- **Plan d'envoi (relevé 15/09 ~16:05 UTC)** : `origin/main` = `origin/staging` + merge #1159 (release E1) ; branche
  `feat/BO-PRODUCTS-PROFIT-001-afficher-rentabilite` : 0 en retard, 7 commits d'avance (`73a74198`, `aed9405e`,
  `ac667037`, `b511fb8d`, `087b6332`, `f75bfd55`, `c0182513`). Non commité : 32 M, 89 ??, 98 D (66 fiche `[id]`
  en double, 17 code mort, 15 notes scratchpad déplacées par le script d'archivage → **exclues des commits**).
  PR ouvertes vers staging : uniquement nettoyages scratchpad / dependabot / #1128 (aucune sur ce sujet).
  Commits à faire quand plus aucun agent n'édite (lint-staged met de côté le non-indexé) :
  1. `[BO-PRODUCTS-PROFIT-003]` migration 160000 + types (−2 fonctions) ;
  2. `[BO-PRODUCTS-PROFIT-004]` écrans marges (% / coef, coût figé, carte analytics LinkMe, « Utiliser ce prix »,
     filtres) ;
  3. `[BO-PRODUCTS-CATALOGUE-001]` fiche catalogue unique (#1022 porté, `[id]` supprimé) + liens stock ;
  4. `[BO-REFACTOR-R-L-001]` découpages > 400 lignes + mobile catalogue / fiche (dont correctif en cours) ;
  5. `[BO-CLEANUP-001]` code mort ;
  6. `[BO-PERF-S3-002]` migration 150000 + types (+`get_sidebar_counts`) + hook compteurs ;
  7. `[BO-AUTH-310-001]` `auth-wrapper` + `tabs-navigation` ;
  8. `[BO-SEC-004]` lot 7 (170000) + baseline advisors ; puis bloc S (lot 8, gardes, vues) après essais ;
  9. `[BO-SEC-010]` règles RLS anciennes (PR dédiée) ;
  10. `[INFRA-RULES-001]` `.claude/rules/workflow.md` + ADR-040 (PR dédiée).
- **Agents 15/09 ~15:48 UTC** : les 2 agents (bloc D et rédaction bloc S) se sont bloqués (délai sans progrès) et ont
  été relancés. Instantané bloc S incomplet (corps de fonctions tronqués, comptages 110/20/60 ≠ 120/21/62) → correction
  demandée avant toute migration.

## A bis. BUG PRIORITAIRE signalé par Roméo le 15/09 — création de produit, fournisseur impossible à ajouter

- En **production** (`verone-back-office.vercel.app`, poste Windows) : `POST /rest/v1/products` refusé en **400** le
  15/09 à 12:26:14 UTC, sans erreur Postgres (rejet PostgREST → clé de la requête inconnue ou forme invalide
  probable). Aucun produit créé par le formulaire complet depuis le 29/07. Rien d'écrit en base.
- Besoin métier : nouveau produit « packaging bouteille de champagne » (modèle : « Packaging bouteille vin » PAC-0001,
  fournisseur Yichun Enten Science And Technology) + sac, pour une nouvelle commande.
- **Causes trouvées (15/09)** — tunnel `/produits/catalogue/nouveau` (`CompleteProductWizard`), cassé depuis longtemps :
  1. `wizards/sections/SupplierSection.tsx` passait `value`/`onChange` (masqués par `as any`) au lieu de
     `selectedSupplierId`/`onSupplierChange` → clic sur un fournisseur = exception, rien sélectionné ;
  2. `use-products.ts` `createProduct` insérait `status` (colonne absente de `products`) → **400 PGRST** ;
  3. aucun sélecteur de sous-catégorie dans le tunnel → SKU jamais généré (trigger `generate_product_sku` exige la
     sous-catégorie ; `sku` NOT NULL + CHECK `sku_format`) ;
  4. `''` envoyé pour les uuid, finalisation sur un identifiant de brouillon périmé, `status: 'in_stock'` à la finalisation.
- **Correctif codé (non commité)** : `SupplierSection.tsx` (bons props, sans `any`), `GeneralInfoSection.tsx`
  (`CategoryHierarchySelector` obligatoire), `useCompleteProductWizard.ts` (`optionalId`, sans `status`, contrôle nom +
  sous-catégorie, id renvoyé par la sauvegarde), `use-products.ts` (sans `status`), `WizardNavigationCard.tsx` +
  `CompleteProductWizard.tsx` (`canFinalize`). tsc products + back-office 0 erreur, eslint 0.
- **Preuves** : essai annulé en base (DO … RAISE) avec sous-catégorie + fournisseur Enten → SKU `TBS-0006` généré,
  finalisation OK, 0 ligne restante ; écran local : fournisseur « Enten Science » sélectionné, 0 erreur console
  (`.playwright-mcp/screenshots/20260915/nouveau-produit-fournisseur-selectionne-124600.jpeg`).
- Écran local 12:50 UTC : sous-catégorie « Maison et décoration › Art de table › Plateaux & Supports » choisie →
  « Finaliser le produit » actif, 0 erreur console ; rien sauvegardé
  (`.playwright-mcp/screenshots/20260915/nouveau-produit-sous-categorie-choisie-125000.jpeg`).
- **Consigne Roméo 15/09 (en cours de session)** : finir les tâches en cours, puis réaliser toutes les tâches restantes
  faisables, puis compte rendu + liste de ce qui reste **AVANT** toute fusion staging / release main (il donne le go).
- **Reste** : commit sur branche dédiée `fix/BO-PRODUCTS-CREATE-001-fournisseur-sous-categorie` depuis staging (le
  dossier contient aussi le travail PROFIT-001 non commité : préparer fichier par fichier), PR, contrôles, fusion,
  release, puis Roméo crée « Packaging bouteille champagne » (aucune sous-catégorie « packaging » n'existe : il choisit
  la plus proche ou en crée une).

## A ter. Tâches restantes traitées dans la session du 15/09 (consigne Roméo : tout faire, puis compte rendu)

- **Tableau de bord `get-dashboard-metrics.ts`** (code seul) : 4 requêtes en erreur 400 permanente (vues dans les
  journaux toutes les visites) → compteurs « Produits », « Organisations », « Rupture » et « Consultations actives »
  toujours à 0. Corrigé : `products.deleted_at` → `archived_at`, `organisations.deleted_at` → `archived_at`,
  `current_stock_real` → `stock_real`, statuts consultations `pending/in_progress` → `en_attente/en_cours` (+
  `deleted_at` nul). Valeurs attendues au 15/09 : produits 222 (1 nouveau sur 30 j), organisations 221, rupture 36,
  consultations actives 2.
- **CI E2E** : `quality.yml` passe `E2E_USER_EMAIL/PASSWORD` alors que `tests/auth.setup.ts` lit
  `E2E_TEST_EMAIL/PASSWORD` → « variable absente ». Câblage corrigé (`f75bfd55`). Mot de passe de test : **abandonné
  sur décision de Roméo (15/09)**, rien à traiter.
- **Pages protégées sans session → React #310** (analysé 15/09, **non corrigé volontairement**) : pas propre au
  sourcing (`/dashboard`, `/produits/catalogue` idem). `(protected)/layout.tsx:19-27` fait `redirect('/login')`
  côté serveur mais la réponse est un 200 avec `NEXT_REDIRECT` ; `components/layout/auth-wrapper.tsx:63-80` rend
  `children` quand il n'y a pas d'utilisateur → le routeur Next suspend (`useActionQueue` → `use()`) et React lève
  #310 (bugs connus next.js #63121 / #78396, react #33556). Correctif recommandé : `useEffect` dans `AuthWrapper`
  (avant le `if (isLoading)`) → `window.location.replace('/login')` quand `!isLoading && !user` hors pages publiques,
  et splash au lieu de `children` dans ce cas. **Touche l'écran d'entrée de tout le back-office** (incident splash
  bloqué #952 du 08/05) → PR dédiée, test connexion / déconnexion / pages publiques / extension Chrome avant fusion.
  Aucun impact pour l'équipe (toujours connectée).
- **Mesure S3** (15/09, 07:00 → 12:40 UTC, en-tête back-office) : ~3 600 appels HEAD de comptage en 5 h 40
  (sales_orders 868, products 589, form_submissions 575, puis ~300 chacun) → projection ~5 700 sur 07 h-16 h contre
  13 004 avant S3 ; objectif < 1 500 **non atteint** → étape suivante = RPC unique `get_sidebar_counts()` (base,
  accord Roméo, proposition `docs/scratchpad/proposition-2026-09-12-get-sidebar-counts.sql`).

- **Épisode de lenteur base 15/09 12:52 → 12:55 UTC** : 25 « canceling statement due to statement timeout »,
  réponses 500 sur `HEAD linkme_orders_enriched` (12), `rpc/get_site_internet_products` (3), `products` (1),
  `user_activity_logs` (1). Aucune requête bloquée ensuite (`pg_stat_activity` vide), sites 200. Coïncide avec :
  type-check local, chargement du tableau de bord local (16 requêtes), relecture SQL en cours. Même symptôme que la
  lenteur intermittente mesurée le 11/09 (instance minuscule) → suivi perf (A3 / RPC compteurs), pas de correctif
  improvisé.

- **INCIDENT LENTEUR BASE 15/09 à partir de 12:50 UTC (en cours d'analyse, rien modifié)** : appels
  `HEAD linkme_orders_enriched` (compteur du menu LinkMe) passés de ~7 / 5 min à 34-69 / 5 min, erreurs 500
  (statement timeout) 16/34 (12:50), 32/69 (13:00), 35/38 (13:05) ; `rpc/get_site_internet_products` de ~1-2 à 16-18
  / 5 min avec erreurs. Appels venant de la production (3 IP de l'équipe, domaines `verone-back-office.vercel.app`
  et `verone-backoffice.vercel.app` = **même projet Vercel**, pas deux versions) et du local de l'agent. Temps de
  préparation : `select 1` 12 ms, compte de `linkme_orders_enriched` 1 à 4 s de planification pour 0,4 s
  d'exécution. Coïncide avec le déploiement E1 (12:47) et les tests locaux de l'agent (fermés à 13:08). Les échecs
  sont relancés automatiquement → effet boule de neige. Hypothèses à vérifier : code E1 qui appelle plus souvent ces
  compteurs, relances TanStack sur erreur, instance saturée. **Décision Roméo si un retour arrière est envisagé.**

  → **Fin de l'épisode : 0 erreur 5xx à 13:10 et 13:11 UTC** (activité normale 25-76 appels / min), juste après la
  fermeture des onglets de test de l'agent (13:08). Cause exacte non établie ; à surveiller.

## A quater. Sourcing — remarque de Roméo 15/09 (« il fallait modifier l'existant, pas refaire »)

- Faits : P4 (`e3b5fce7`) et P5 (`a5ece1b2`) ont modifié **les mêmes routes** `/produits/sourcing` et
  `/produits/sourcing/produits/[id]` (aucune seconde route), mais **ont supprimé les anciens blocs** (P5 : onglets
  Produits / Archivés, cartes KPI, vue Cartes ; P4 : barre de pipeline, guide d'étape, 3 onglets Sourcing / Évaluation /
  Échantillon, communications) et créé de nouveaux composants (`SourcingSegmentTabs`, `SourcingStageHeader`,
  `SourcingActionBar`, `SourcingJournal`, `SourcingOffersSection`…). `SourcingProductEditCard`, `SourcingUrls`,
  `SourcingCandidateSuppliers`, `SourcingPriceHistory` ont été réutilisés.
- Production = même code que le local : déploiement Vercel `dpl_36m9TVCfg51jxHRF7HoPfztenJF8` prêt 12:47 UTC,
  `4e5fbe42` contient `acf5548c`. Avant 12:47 UTC la production montrait encore l'ancienne page (onglets, KPI,
  pipeline) → c'est très probablement la différence vue par Roméo (ou un onglet ouvert avant la mise à jour).
- Restes morts repérés (antérieurs à P3) : 3 réexports `apps/back-office/src/components/business/*sourcing*`,
  `client-assignment-selector.tsx`, `ProductCreationWizard.tsx` (lien vers route inexistante),
  `SampleOrderValidation*` (lien `/produits/sourcing/validation` inexistant), liens `StockAlertBanner` /
  `StockReorderCard` vers `/produits/sourcing/nouveau` et `/commandes/:id` inexistants.
- **Décision Roméo attendue** : garder la nouvelle fiche / liste, ou revenir à l'ancienne présentation en y ajoutant
  seulement les nouveautés (étapes, motifs, grille d'évaluation). Mémoire `feedback-modify-existing-screens`.

## B. Décisions attendues de Roméo (compte rendu `~/Documents/Workspace/verone/_inbox/2026-09-15-historique-ventes-marges-tarification.md` § 7)

1. Marge affichée en % du prix de vente, en coefficient, ou les deux (l'écran du 15/09 affiche les deux).
2. Prix de revient du passé : actuel (retenu à l'écran) ou reconstitué à la date de la vente.
3. Frais de port des commandes : exclus de la marge produit (retenu) ou répartis.
4. ~~Marge nette LinkMe tout de suite~~ → **tranché 15/09 : oui, prix LinkMe − revient, commission exclue**.
5. Figer le prix de revient à la validation des futures commandes (changement de base, accord écrit).

## C. Suites du chantier marges / tarification (après le 15/09)

- « Utiliser ce prix » : pré-remplir le prix du canal site ou `products.target_price` depuis la synthèse (confirmation).
- Client par ligne de vente, filtres période / canal / client.
- Colonne « prix de revient figé » sur les lignes de vente (base, accord Roméo, sans toucher aux déclencheurs stock).
- Ménage : fiche catalogue en double (`produits/catalogue/[id]` vs `detail/[id]`, réécriture `next.config.js:96-101`),
  fonctions SQL `get_product_margin_analysis` / `get_product_cost_price_details` et hook `use-top-products` non utilisés.
- Fichiers au-dessus de 400 lignes : `ChannelPricingDetailed.tsx` (511), `use-product-detail.tsx` (437),
  `use-performance-analytics.ts` (411).
- 29 produits vendus n'ont qu'un prix d'achat, sans frais d'approche → marge affichée trop belle tant que non complété.

## D. Autres suites déjà listées dans `.claude/work/ACTIVE.md`

- Sécurité : lot « 4 bis » (5 fonctions ouvertes à anon), lot 8 « invoker », BO-SEC-004 lot 7 **attend l'accord écrit**.
- Programme sourcing : P6 (après mise en ligne P3 → P8).
- Mesure S3 (menu de gauche) à relancer un jour ouvré entre 07 h et 16 h UTC.
- Test Want It Now de bout en bout (Roméo), puis envoi de la branche VER-CANAL-WIN-001.
- Vue `stock_alerts_view` cassée (`get_user_role()` absente).
- Tableau de bord : case « Consultations actives » toujours 0 (`get-dashboard-metrics.ts:77`, statuts en anglais).
- Mobile 375 / 768 : colonne principale du back-office à 900 px (défilement horizontal).
- Commit local `cc10edae` BO-AUDIT-005 jamais poussé (corriger `middleware.ts:87` `console.log`).
- Rapprochements bancaires Pokawa restants (Roméo, en ligne).
- `.claude/rules/workflow.md` : retirer l'auto-merge par défaut tant que le dépôt est privé sur Free (PR dédiée + ADR).
