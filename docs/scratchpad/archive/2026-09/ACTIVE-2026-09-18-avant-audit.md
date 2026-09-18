# `ACTIVE.md` — file de tâches active

**Ce fichier est gitignored.** Il vit uniquement en local. Maintenance : `.claude/rules/active-md-maintenance.md`.

---

## ▶▶ FEUILLE DE ROUTE 2026-09-16 — source unique de l'ordre et de l'état des sessions (écrite par Claude Cowork)

**Dossier** : `docs/scratchpad/feuille-de-route-2026-09-16/` — `README.md` (préambule V1→V9 + ordre) et un prompt par session.
**Remplace** `docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md` (marqué PÉRIMÉ). L'état se tient ICI, nulle part ailleurs.
**Règle nouvelle (incident du 15/09 12:34-14:00 UTC, 194 erreurs 500, timeouts)** : aucune release, migration ni requête
lourde de statistiques entre 07 h et 17 h UTC un jour ouvré (PR de règle `[INFRA-RULES-041]`).
**Reprise par Claude Code le 15/09 soir** : écarts relevés dans
`~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-reprise-feuille-de-route.md` (E1-E15) ; fichiers de session
non modifiés (Roméo tranche). Copie intégrale d'ACTIVE.md avant reprise : `docs/scratchpad/archive/2026-09/ACTIVE-2026-09-16-avant-reprise.md`.

**2026-09-18 — URGENCE TRAITÉE `[BO-AUTH-SESSION-002]` + `[BO-SOURCING-FORM-006]`** (PR #1173 fusionnée
sur staging `b54b9ea9`, mise en ligne #1174). Des collaborateurs étaient enfermés sur « Erreur système
Vérone » depuis la mise en ligne du 17/09 ; la création d'un produit de sourcing ne s'enregistrait pas.
Rapport : `docs/scratchpad/dev-report-2026-09-18-BO-AUTH-SESSION-002.md`.

- **Retenu pour plus tard** : le renouvellement de session **côté serveur** (middleware) n'est PAS livré —
  le serveur de production n'arrive pas à charger son module (toutes les pages en 500 sur la sortie
  autonome), et l'aperçu Vercel est derrière l'authentification Vercel donc invérifiable. Le réveil de
  session se fait côté navigateur (`auth-wrapper.tsx`, `visibilitychange`). À reprendre hors urgence :
  soit comprendre l'empaquetage du middleware en sortie autonome (`outputFileTracingRoot` en monorepo),
  soit obtenir un moyen de vérifier un déploiement d'aperçu.
- **Acquis d'outillage** : les tests E2E lançaient le back-office avec `next start` alors que la config
  est `output: 'standalone'` — ils ne testaient pas le serveur réel. Corrigé (serveur autonome + build
  transféré en tar pour garder les liens). Le journal de démarrage est désormais affiché en cas d'échec.

**EN ATTENTE DE PR — `[BO-PRICING-GOV-001]`** branche `feat/BO-PRICING-GOV-001-prix-valide-coefficients`
(7 enregistrements, à rebaser sur staging). Écrans de réglage des coefficients sur Famille / Catégorie /
Sous-catégorie, 40 des 42 sous-catégories pré-remplies depuis leur catégorie (décision Roméo 17/09,
empreinte inchangée), code couleur prix/revient/marge sur la **liste du canal Site Internet** et sur les
**deux vues du catalogue**, tri « Marge » corrigé (il portait sur la marge cible, vide sur 206/209).
Reste du chantier : filtres, correction du prix depuis la ligne, rapport « Prix & marges », règle des 5 %
LinkMe, puis coupure des prix jamais décidés — 3 points d'arrêt Roméo (étude
`docs/scratchpad/dev-plan-2026-09-17-BO-PRICING-GOV-001-etude.md`).

| #   | Session                                                                                                                                                                                                                | Base                    | État                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00  | Mesure production du 16/09 + cause des timeouts `linkme_orders_enriched` + remise d'équerre                                                                                                                            | non                     | **partiel le 15/09 soir** : B fait (164 des timeouts = comptage LinkMe `use-linkme-pending-count.ts:67-70`, préparation 127-166 ms dominée par les règles de sécurité, pas par la vue ; pic 11 h = session locale, 1 106 appels `product_images`), B4 PR #1165 **fusionnée le 16/09 18:06 UTC** (`b99a4edc`), C1 déjà fait par Cowork, C2 fait ; **A (mesure du 16/09) à relancer ≥ 17 h UTC**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 01  | **AUDIT COMPLET** : performance à 100 %, sécurité, scalabilité — notes sur 100, plan chiffré                                                                                                                           | non                     | à faire, après 00 A ; `pg_stat_statements_reset()` = décision Roméo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| —   | `[BO-SOURCING-VALIDATION-001]` — prompt `docs/scratchpad/prompt-2026-09-15-BO-SOURCING-VALIDATION-001.md`                                                                                                              | accord                  | **traité le 16/09 par les lots A1/A2 ci-dessous** ; 6 produits en sourcing ouverts, seul `validated` = PRD-0314 (TEST) ; **229** produits catalogue en `need_identified` par défaut de colonne (jamais les traiter comme sourcing)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| —   | **CHANTIER SOURCING — PARTIE A : TERMINÉE** (plan `~/.claude/plans/streamed-skipping-quill.md`)                                                                                                                        | 3 migrations appliquées | **A1 → A5 FAITS et livrés le 16/09 au soir.** PR **#1167 fusionnée** 19:12 UTC (`ee534241`) : blocages expliqués, sous-catégorie saisissable, échantillons groupés, 4 étapes opérantes, comparatif d'offres au coût rendu, « Retenir cette offre » / « Adopter ce prix ». PR **#1168** (`[BO-SOURCING-COST-005]`) : répartition des frais réparée + prix de revient rendu affiché — détail dans le bloc A5 plus bas. Migrations en production : `20260916020000`, `20260916190000`, `20260916210000`, `20260916220000`. **Reste de la partie A : A6 (kanban glisser-déposer, filtres, pagination) et A7 (ménage du code mort, à faire une semaine après la mise en ligne).** **Suite immédiate décidée par Roméo le 16/09 : la PARTIE B — consultations multi-produits / multi-fournisseurs.** Prompt de reprise : `docs/scratchpad/prompt-2026-09-16-BO-CONSULT-MULTI-001.md`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 02  | Corrections des requêtes lentes (`linkme_orders_enriched`, `get_site_internet_products`, alertes stock, Inventaire, index)                                                                                             | selon 01                | **doublons de compteurs traités le 15/09 soir** (PR **#1166** `[BO-PERF-S3-003]`, **fusionnée le 16/09 18:06 UTC** `29272f49` ; compte rendu `_inbox/2026-09-16-compte-rendu-compteurs-menu.md`) : les 9 pastilles lisent l'appel unique, 10 comptages et 5 canaux en moins par page, comptage LinkMe supprimé, ancien compteur stock (30 s) retiré. Reste : comptage alertes stock encore appelé hors menu : `get_stock_alerts_count` encore appelé hors RPC (`dashboard/src/hooks/use-dashboard-additional-data.ts:125`, `messages/hooks/use-messages-items.ts:339`, `useStockAlertsCount` du menu et de `roadmap/src/hooks/use-auto-roadmap.ts`) ; LinkMe compté hors RPC (`notifications/src/hooks/use-linkme-pending-count.ts:67-70`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 03  | S4 — CI de dérive hors production, build < 20 min, secrets E2E                                                                                                                                                         | non                     | à faire ; **S4.4 fait le 15/09** (compte `veronebyromeo+e2e@gmail.com` rôle admin, Trousseau `verone-e2e-test-password`, E2E réels verts #1163/#1164) ; S4.5 alias `e2e-smoke-aggregate` toujours là (`quality.yml:987`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 04  | Temps réel Supabase : réduire ou couper                                                                                                                                                                                | accord (publication)    | à faire ; 2 tables publiées (`products`, `sales_orders`), 7 `.channel(` dans 6 hooks `@verone/notifications`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 06  | **CONSULTATIONS — partie B (B1→B5)**. Prompt de reprise prêt : `docs/scratchpad/prompt-2026-09-16-BO-CONSULT-MULTI-001.md`                                                                                             | selon lot               | **Audit complet fait le 16/09 au soir.** **Le multi-produits / multi-fournisseurs FONCTIONNE DÉJÀ** : 6 consultations, 6 lignes, 2 consultations à 2 lignes dont une à **2 fournisseurs**, fournisseur affiché sous le SKU (`ConsultationProductRow.tsx:139-140`), regroupement par fournisseur déjà calculé (`ConsultationOrderDialog.tsx:70-87`). **Découverte centrale : le lot P9 (#1149, migration `20260913180000` appliquée) est du CODE MORT à 100 %** — tables `consultation_needs` et `consultation_supplier_costs` (**0 ligne, 0 appelant**), colonnes `default_margin_percentage` / `margin_percentage` / `need_id` (**NULL partout, absentes des types ET des `select`**), statut `candidate` ingérable à l'écran, module `consultation-supplier-costs.ts` (202 l. + tests) **jamais appelé**. Il n'y a donc presque rien à construire : **il y a à brancher.** **3 risques identifiés** : 1) le statut `candidate` est un piège armé — il serait compté dans le CA (`consultation-economics.ts:144`), mis au devis (`consultation-order-guards.ts:43-48`) et bloquerait la création du devis (`:60-63`) ; 2) **TVA écrite en dur à 20 % à 4 endroits** du devis (`consultation-async-handlers.ts:297,298,327`, `use-consultation-detail.ts:216`) alors que le PDF client lit `tva_rate` → divergence dès qu'un taux ≠ 20 (invisible aujourd'hui, les 6 sont à 20) ; 3) **la commande fournisseur est aplatie** — `page.tsx:286-295` détruit le regroupement et ouvre une fenêtre par produit. **Autres défauts** : ligne à quantité 0 → `RangeError` et page plantée (`ConsultationProductRow.tsx:90`) · `get_consultation_eligible_products` encore exécutable par `anon` et `PUBLIC` (hors R-GRANT) · `use-consultation-detail.ts:104-117` charge TOUTES les consultations pour en afficher une · adaptateur de calcul **recopié 7 fois** (créer `consultation-economics-input.ts` en premier) · liste sans pagination serveur · code mort `packages/@verone/products/src/components/wizards/consultation-manager/` (3 composants sans référence) · le wizard de création ne permet pas d'ajouter des produits. **Ordre conseillé : B1 (adaptateur unique + marge) → B4 (TVA) → B2 (frais et regroupement) → B3 (besoins, après neutralisation de `candidate`) → B5 (rapports).** |
| 05  | S2 — contrôle central des routes API en 3 temps                                                                                                                                                                        | non                     | à faire ; **écart E4** : failles vérifiées dans `main` (3 routes Qonto, `api/logs`, `api/emails/form-reply`, webhook Revolut sans signature, `api/admin/run-migration`) → temps 1 à avancer ? ; 193 `route.ts` dans les 3 apps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| —   | Session A `SITE-CATALOGUE-FILTRES-001` (`docs/scratchpad/dev-plan-2026-09-16-SITE-CATALOGUE-FILTRES-001.md`) et B `BO-PRODUCTS-LIST-MARGIN-001` (`docs/scratchpad/dev-plan-2026-09-16-BO-PRODUCTS-LIST-MARGIN-001.md`) | non                     | à faire ; plans vérifiés le 16/09, § 7 = texte de lancement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 07  | Sécurité : tables encore lisibles par anon, lots 8-11 régénérés, gardes affiliés                                                                                                                                       | accord par lot          | à faire ; au 15/09 22:5x UTC : **76 tables + 22 vues** en SELECT anon, **238** INVOKER et 13 DEFINER exécutables par anon ; brouillons `docs/scratchpad/bloc-S-drafts-2026-09-15/` **non applicables** (lot 9 tronqué, empreinte stock à refaire, lot 10 en heure creuse)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 08  | P14 notation fournisseur, 4 critères par événement                                                                                                                                                                     | accord                  | à faire ; colonnes vérifiées (`purchase_orders.expected_delivery_date`, `received_at`, `purchase_order_receptions.received_at`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 09  | P6 ménage sourcing (code mort, 13 fonctions, contraction des statuts, données)                                                                                                                                         | accord                  | à faire, pas avant le 22/09 ; M1 **en partie fait par #1160** (restent `produits/sourcing/echantillons`, lecture `sample_orders`, orphelins) ; `sample_requested` catalogue : 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 10  | Scalabilité : baseline SQL, types uniques, Sentry, rétention journaux                                                                                                                                                  | accord                  | à faire ; types : 5 fichiers `export type Database` (2 copies imbriquées mortes) ; 10b « `page.tsx` 406 l. » = site → déjà session A                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| —   | Want It Now : test local Roméo (3 produits) → push → PR → release ; puis WIN-002 (3 décisions v2.1)                                                                                                                    | —                       | en attente Roméo ; détail : « Détails par chantier » ci-dessous                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**Décision produit Roméo 2026-09-16 — modèle produit ↔ fournisseur (provisoire, assumée)** : « un
produit peut avoir plusieurs fournisseurs, car au catalogue on peut avoir une référence, et imaginons
qu'on ait trois ou quatre références de spots : on va devoir les vendre séparément. S'ils sont très
ressemblants, on laisse comme ça pour l'instant, après on verra comment on fait évoluer la chose. Mais
dans une consultation, il faut qu'on puisse mettre plusieurs produits, et donc on aura un produit par
fournisseur pour le même produit. » → **une fiche produit = un fournisseur** ; trois spots ressemblants
de trois fournisseurs = trois fiches vendues séparément ; la consultation accueille autant de produits
qu'on veut (déjà le cas) ; la mise en concurrence se joue **en amont dans le sourcing**. Conséquence :
**ne PAS ajouter `supplier_id` sur `consultation_products`, ne PAS toucher au
`UNIQUE (consultation_id, product_id)`**. Choix explicitement provisoire — ne rien anticiper, cela se
redécidera avec de vrais cas en main.

**Écarts à trancher par Roméo (15/09 soir, détail dans le compte rendu de reprise)** :

- E4 — avancer le temps 1 de la session 05 (routes ouvertes sur Internet) juste après 00 ; routes Qonto = accord.
- E5 — ajouter une session « comptabilité » (« Rapprocher » n'écrit rien, sync Qonto, code 707, 1 000 transactions, TVA 20 % en consultation).
- E6 — ajouter une session « bugs du quotidien » (commandes sans contacts, `backorder`, fournisseurs, notifications, consultation).
- E14 — 01 (audit) avant ou après `[BO-SOURCING-VALIDATION-001]` : indépendants.

**Suite du chantier sourcing (lots A5 → A7, puis partie B)** — tout est décrit dans le plan
`~/.claude/plans/streamed-skipping-quill.md` :

- **A5 — FUSIONNÉ le 16/09** (PR #1168, `1b426c73`) : répartition des frais fournisseurs réparée
  (total du prorata juste en modification comme en ajout, ré-allocation à l'ajout/retrait de ligne,
  coût parti du prix remisé, arrondi par télescopage), prix de revient rendu affiché sur les
  échantillons, refus d'une offre hors euro, droits R-GRANT fermés. Migrations **20260916210000** et
  **20260916220000** en production. 10 lignes réécrites sans changer de valeur (déclencheurs officiels),
  empreinte avant = après, écart frais/répartis 0,00 €.
  - **Reste à traiter, sans urgence** : « Coût rendu » du comparatif affiché en euros même pour une
    offre libellée dans une autre monnaie · `recalculate_purchase_order_totals` et le ratio SQL ne
    filtrent pas `archived_at` (0 ligne archivée aujourd'hui) · éco-participation non reportée sur les
    lignes d'échantillon · `useSampleDraftOrder` ne lit que la commande échantillon brouillon la plus
    récente et ignore les commandes standard.
- **A6** kanban avec glisser-déposer, filtres « sans fournisseur / sans prix », pagination ;
- **A7** ménage du code mort (2 pages orphelines, 13 fonctions SQL cassées, 2 tables vides) —
  à faire une semaine après la mise en production de A1-A6 ;
- **Partie B consultations B1 → B5 — FAITE le 16/09 au soir**, branche
  `feat/BO-CONSULT-MULTI-001-brancher-marge-tva-frais`, **PR #1169 FUSIONNÉE sur staging le 16/09 21:31 UTC** (`74cd0f05`), puis **release #1170 fusionnée en main le 16/09 21:41 UTC** (`2c387bc9`, 5 commits : #1165 à #1169)
  (6 commits, aucune migration — tout existait en base depuis le 13/09 sans être branché).
  Marge par défaut qui produit un prix de vente (adaptateur unique
  `consultation-economics-input.ts`, il était recopié 7 fois sans jamais passer les réglages) ·
  TVA prise sur la consultation au lieu de 20 % en dur à 4 endroits · frais par fournisseur
  saisissables, répartis, et **une commande fournisseur par fournisseur** au lieu d'une fenêtre
  par produit · statut « option » neutralisé (`consultation-line-status.ts`) puis besoins du
  client exposés · rapports : date de validité réelle, ventilation par fournisseur, écart au
  budget client. 45 tests unitaires. Essai à l'écran sur une vraie consultation, état d'origine
  rétabli et vérifié en base.
  - **Vérifié à l'écran le 16/09 au soir** (navigateur, 0 erreur console) : liste sourcing et ses
    5 onglets · vue Étapes (Recherche 4 / Contact 0 / Évaluation 0 / Négociation 2) · fiche produit
    avec blocages explicités, validation au catalogue bloquée et motivée, comparatif d'offres au coût
    rendu · page Échantillons · page Plugin · création rapide · liste consultations · fiche
    consultation complète. **Défaut de donnée trouvé** : les photos des 2 consultations pointent vers
    des fichiers absents du stockage (400 côté Supabase, pas un bug de code) — décision Roméo.
  - **Reste ouvert, non traité volontairement** : remise globale et ventilation TVA par taux sur
    la proposition (demandent une colonne en base + une décision Roméo) · `UNIQUE
(consultation_id, product_id)` empêche toujours qu'un même produit soit option de deux
    besoins (décision Roméo du 16/09 : on n'y touche pas) · ~~effacer un prix de vente déjà saisi
    reste impossible~~ **réglé le 17/09 (voir bloc ci-dessous)** ·
    `get_consultation_eligible_products` encore exécutable par `anon` et `PUBLIC` ·
    `use-consultation-detail` charge toutes les consultations pour en afficher une · liste des
    consultations sans pagination serveur · code mort
    `packages/@verone/products/src/components/wizards/consultation-manager/`.

- **`[BO-CONSULT-SOURCING-001]` — consultations utilisables au quotidien — LIVRÉ le 17/09**,
  **PR #1171 fusionnée sur staging le 17/09 16:44 UTC** (`68888f88`), **release #1172 vers main
  lancée dans la foulée sur ordre de Roméo** (hors fenêtre 07-17 h UTC, ADR-041 — exception
  « correctif d'urgence décidé par Roméo », il voulait tester le soir même avec un ami).
  Rapports : `docs/scratchpad/dev-report-2026-09-17-BO-CONSULT-SOURCING-001.md` (nuit) et
  `docs/scratchpad/dev-report-2026-09-17-BO-CONSULT-IMG-CURRENCY.md` (après-midi).
  11 commits, **4 migrations déjà appliquées en production** : `20260917000000`
  (`carries_supplier_fees`), `20260917010000` (`selling_shipping_cost_ht`), `20260917220000`
  (URL des photos de consultation), `20260917230000` (monnaie du prix d'achat). Types Supabase
  régénérés dans la PR (fichier repris de l'artefact CI : la CLI locale est plus récente que
  celle de la CI et ajoute un bloc `__InternalSupabase` qui faisait échouer le contrôle).
  Empreinte stock / mouvements / alertes identique avant et après.
  Ce qui a été livré :
  1. **Produits en sourcing sélectionnables dans une consultation** — le sélecteur filtrait
     `product_status = 'active'` en dur, donc les 6 produits en sourcing (tous en brouillon)
     étaient invisibles, pastille « Sourcing » comprise. Il applique désormais la règle partagée
     `isProductProposableInConsultation`. Effet de bord assumé : les produits en précommande
     deviennent proposables (alignement sur la règle « vendable » du 13/09).
  2. **Prix modifiables et effaçables** — les cellules Achat, Transport ligne, Transport vente,
     Vente et la quantité ouvrent la ligne en modification d'un clic (la colonne Actions sortait
     du cadre : plus personne ne trouvait « Modifier »). Colonne Actions **collée au bord droit**.
     Un champ vidé **efface** vraiment la valeur (vente vide → prix issu de la marge).
     Sélection au focus sur les 6 champs chiffrés : saisir « 1000 » remplace la valeur.
  3. **Frais par fournisseur** — intitulé libre des « autres frais » (colonne `other_cost_label`
     existait depuis le 13/09, jamais remplie) · produits sans fournisseur **nommés** dans le bloc ·
     **cases « Cette livraison concerne »** pour choisir les produits qui portent les frais quand
     le fournisseur a plusieurs lignes (un seul produit = case cochée et verrouillée).
  4. **Transport : l'un OU l'autre** — un fournisseur qui porte une livraison verrouille le
     transport de ses lignes, et inversement. Côté vente, **livraison globale** saisie dans
     « Modifier » (comptée une fois dans le CA, jamais imputée à une ligne) qui verrouille le
     transport de vente des lignes, et inversement.
  5. **Raccourci « Nouveau produit en sourcing »** dans le sélecteur (et « Sourcer ce produit »
     quand la recherche ne donne rien) : crée le produit **et l'ajoute à la consultation**.
     **Deux bugs bloquants découverts et corrigés à cette occasion : le formulaire rapide de
     sourcing ne pouvait RIEN créer**, ni depuis une consultation ni depuis la page Sourcing
     (`sku_format` — `sku: ''` envoyé alors que le déclencheur exige une sous-catégorie ;
     `chk_supplier_moq_positive` — MOQ facultative envoyée à 0 alors que la base exige ≥ 1).
     Le SKU est maintenant produit côté application au format `SRC-…`. Corrigé aussi :
     `supplier_id` / `assigned_client_id` / `enseigne_id` envoyés en chaîne vide.
  6. **Achat en euros ou en dollars** (`[BO-CONSULT-CURRENCY-001]`, après-midi du 17/09) —
     sélecteur € / $ sur le prix d'achat du formulaire de sourcing, des lignes de consultation et
     des frais fournisseur, équivalent en euros affiché. **Taux figé sur la ligne à la saisie**
     (1 USD = 0,87 €, constante `USD_TO_EUR_DEFAULT`) : une consultation ancienne ne bouge plus
     quand le dollar bouge. Vente, marge et CA restent **toujours** en euros. Conversion faite
     dans le seul adaptateur `itemToEconomicsInput`.
  7. **URL de la page fournisseur devenue facultative** au formulaire de sourcing (le format
     reste vérifié si le champ est rempli).
  8. **DÉPÔT D'IMAGES RÉPARÉ PARTOUT** (`[BO-CONSULT-IMG-001]`) — depuis le 08/05 (`BO-IMG-CF-002`),
     `smartUploadImage` exigeait `CLOUDFLARE_IMAGES_API_TOKEN`, clé **serveur**, alors que les
     8 hooks de dépôt tournent dans le navigateur : **aucun écran ne pouvait déposer une image**
     (consultations, fiches produit, logos, collections, LinkMe). Preuve : sur 40 photos produit
     depuis le 08/05, 39 viennent de l'import du plugin (serveur), 0 d'un écran. Conséquence non
     reliée : **valider un produit sourcé au catalogue était impossible** (photo exigée).
     Correction : routes serveur `POST /api/images/upload` (back-office + LinkMe) et
     `smartUploadImage` qui les emprunte depuis le navigateur.
  9. **Affichage des photos de consultation** — `consultation_images` n'avait pas l'équivalent du
     déclencheur `generate_product_image_url` et le code écrasait `public_url` par une adresse
     du seau **privé** `product-images` → 400. Migration + hook corrigés.
  10. **La proposition client en PDF ne se générait plus du tout** — `fontStyle: 'italic'` sur
      Montserrat, fonte non enregistrée ; `@react-pdf` refuse tout le document. Italique retiré.
  11. **Déconnexions intempestives** (`[BO-AUTH-SESSION-001]`) — `(protected)/layout.tsx` est
      `force-dynamic` et renvoyait vers `/login` sur **toute** erreur de `getUser()`, y compris un
      « Failed to fetch » passager ; idem pour la lecture du rôle dont l'erreur n'était jamais lue.
      Désormais : échec passager retenté une fois, échec d'authentification traité comme avant
      (fail-closed), erreur de rôle levée au lieu de déconnecter. Ajout d'un `(protected)/error.tsx`
      pour qu'une erreur d'écran ne remonte plus à `global-error.tsx`, qui démontait toute
      l'application (écran « Erreur système Vérone » vu par Roméo).
  12. **Lien mort retiré** — « Gérer dans Site Internet Vérone » pointait vers
      `/canaux-vente/site-internet/commandes`, page inexistante (404 constaté).
      68 tests unitaires verts (20 répartition des frais, 13 monnaie, 35 économie des consultations).
      Type-check et lint verts sur back-office, LinkMe et site-internet. Toutes les données de test
      créées pendant les essais ont été retirées et l'état des consultations revérifié en base.
  - **Reste ouvert sur les consultations** (rien d'urgent) : monnaies autres que EUR/USD (yuan) ·
    pas de récupération automatique du taux de change · pas de remise globale ni de ventilation
    TVA par taux sur la proposition (colonne en base + décision Roméo) · budget client affiché au
    niveau consultation et besoin, pas comme objectif par ligne · pas de point mort dans le
    rapport interne · sélecteur limité à 100 produits sans pagination · les 3 anciennes photos de
    consultation pointent un fichier d'un seau privé, à redéposer (décision Roméo) · données de
    test PRD-0314 / PO-2026-00039 à garder ou supprimer (décision Roméo).

**Nouveau chantier demandé par Roméo le 16/09 — fabrication de produits** : prompt prêt à coller
dans une nouvelle discussion : `docs/scratchpad/prompt-2026-09-16-BO-FABRICATION-001-audit.md`.
Passer un produit sourcé en « fabrication », plusieurs fournisseurs pour un même produit (tissu,
bois, vis…), prix de revient construit à partir des composants, notre propre marque. Fait vérifié
le 16/09 : **aucune structure de composition n'existe en base** et `products.supplier_id` n'accepte
qu'un seul fournisseur. Le prompt demande un audit (marché + existant) avant toute ligne de code.

**Écart de procédure du 16/09 à signaler à Roméo** : la migration `20260916020000`
(`sourcing_missing_fields` + 2 fonctions du cycle de vie) a été appliquée à ~14 h 20 UTC, **dans**
la fenêtre interdite 07-17 h UTC. Trois `CREATE OR REPLACE FUNCTION`, aucun verrou de table,
aucune donnée modifiée. Seul effet en production avant déploiement de l'écran : la validation au
catalogue exige aussi sous-catégorie + photo + référence fournisseur (refus avec message clair).
Retour arrière possible (rejouer `20260913220000` et `20260913190100`) — décision Roméo.

**Décisions Roméo en attente** : données de test PRD-0314 / PO-2026-00039 (garder ou supprimer) · test WIN + 3 questions
v2.1 · port des commandes dans la marge (exclu ou réparti) · montée de gamme de l'instance (après 01) · Welyb envoi réel ·
Pokawa 5+5 · Black & White Burger · 2FA Supabase · **accord routes Qonto** · articles gratuits / échantillons facturés en
consultation · rétention du journal d'activité · `pg_stat_statements_reset()` (01).

**En production au 15/09 (main `de02d181`, release #1164)** : sécurité lots 1-7 + SEC-005/006/007 · S3 menu +
RPC `get_sidebar_counts` · sourcing P3a/P3b/P3/P4/P4b/P5/P7/P8 · consultations P2/P9/P10 (base) · PROFIT-001/002/003 ·
E2E réels réparés + mot de passe masqué (#1163) · auto-merge suspendu. Mesure 15/09 après bascule (14-16 h UTC) :
comptages ÷ 20, p50 21-122 ms, 0 erreur.

---

## Priorités immédiates

Voir la **feuille de route** ci-dessus (seule liste d'ordre et d'état). Les anciennes sections « ORDRE PROPOSÉ »,
« PRIORITÉ SUIVANTE », « À reprendre » et « SESSIONS PLANIFIÉES » (15-16/09) sont reportées dans le tableau et les écarts
E4-E6 ; texte complet dans `docs/scratchpad/archive/2026-09/ACTIVE-2026-09-16-avant-reprise.md`.

## Vigilance permanente

- **Jamais** envelopper `is_backoffice_user()` en `(select …)` dans les policies (production à terre le 08/05, rollback `20260508060000`).
- Garde des routes API : l'extension Chrome du sourcing passe en `Authorization: Bearer` (`/api/brands`, `/api/sourcing/*`) ;
  2 webhooks (`api/webhooks/packlink`, `api/gmail/inbound`) et 3 `api/cron/*` hors `vercel.json` à identifier avant toute garde.
- Les tests E2E peuvent écrire en production (`turbo.json` expose la clé serveur à `test:e2e`) : garde anti-prod à poser (10a).
- Rotation des clés, `gitleaks`, purge d'historique : **en dernier** (`BO-AUDIT-013`) ; clés Supabase legacy → migrer vers les
  nouvelles clés avant toute rotation (sinon coupure des 3 apps).
- `supabase db push` déconseillé (418 fichiers ancien format) : migrations via `execute_sql` après accord.
- Les 6 règles système `always-true` (dont `stock_movements`) restent par conception.
- Dépôt privé sur GitHub Free : aucune protection de branche, jamais `--auto` ; compte `gh` actif = WantitNow → `GH_TOKEN` Verone2021.
- Rangement automatique `.husky/post-merge` : ~15 suppressions de vieux rapports après `git pull` sur staging = normal, jamais dans un commit.
- « Vitrine publique » LinkMe ≠ « sélections partagées `/s/` » : jamais dans la même modification.
- Vérification en deux étapes du compte Supabase désactivée (Roméo, téléphone).

---

## Détails par chantier

### EN COURS (2026-09-11) — [VER-CANAL-WIN-001] flux JSON protégé pour Want It Now

- Plan approuvé : `~/.claude/plans/encapsulated-shimmying-pearl.md`. Branche `feat/VER-CANAL-WIN-001-flux-want-it-now`
  (sur staging `3a39703a`), **7 commits locaux non poussés** (`e7ab8ca4` migration, `dfbe354c` types, `5fb336dd`
  module + tests, `1d063c2b` route + réglages, `131c3edb` plan, `f50b4db3` écrans, `f20c73d4` corrections de revue).
- **Migration APPLIQUÉE en prod** (2026-09-11, `20260911012000`, inscrite au carnet) : `products.is_published_want_it_now`
  (0 coché), CHECK style + 4 `style_options`, `feed_configs.access_token` facultatif + ligne « Want It Now » (jeton NULL).
- Jeton du flux : Trousseau `verone-canal-want-it-now-jeton` + Vercel `CANAL_WANT_IT_NOW_JETON` (sensible, prod+preview).
- Preuves faites : test 15/15, type-check back-office 0 erreur, route locale 500/401/401/401 `no-store`, flux réel vide
  (0 coché), simulation 224 produits (sku uniques, 0 photo invalide, 342 Ko, clés du contrat seulement).
  Images : sans `Accept` → jpeg/png ≤ 440 Ko ; avec `Accept: image/avif` → avif (parade testée : `…/format=jpeg`).
- Le back-office Vercel ne fait **aucun aperçu** (production `main` seulement) → preuve HTTPS réelle seulement après release.
- Écrans back-office (case fiche produit, écran canal, hub, menu) **relus, corrigés, testés à l'écran en local,
  commités** `f50b4db3` (2026-09-11, rapport `docs/scratchpad/dev-report-2026-09-11-VER-CANAL-WIN-001-ui.md`).
  Base remise à l'état d'origine (0 coché, `last_export_at` NULL). **Revue du 2026-09-11 : FAIL sur 1 point**
  (`docs/scratchpad/review-report-2026-09-11-VER-CANAL-WIN-001.md`) : cast `as unknown as` dans `feed.test.ts:68`,
  prix 0 € accepté par le flux mais « Incomplet » à l'écran, écran canal non rafraîchi après bascule → **corrigé**
  (`f20c73d4`, 16/16 tests, re-revue PASS). Reste : un seul push, PR vers staging **sans fusion auto** (go Roméo),
  release par Roméo, preuves HTTPS, Roméo coche les produits, remise des 3 valeurs à Want It Now, compte rendu final.
- **Consigne Roméo 2026-09-11 soir** : AUCUN push / PR tant que le test de bout en bout n'est pas fait **en local**
  (Vérone port 3000 + Want It Now local sur un autre port). Préparé : `CANAL_WANT_IT_NOW_JETON` ajouté à
  `apps/back-office/.env.local` (flux local 401 sans clé / 401 fausse clé / 200 bonne clé, 0 produit) ; les 3
  réglages `FOURNISSEUR_*` (vides) remplis dans `~/want-it-now-V1/apps/back-office/.env.local` (URL locale, jeton,
  `imagedelivery.net`) — Want It Now local branché sur la base `sdqfkbwiftympksuwcdj`. Reste : Roméo coche 10-20
  produits, lance Want It Now, clique « Importer » ; agent vérifie le flux + `last_export_at`.
- **Audit sourcing complet FAIT 2026-09-12** → `docs/scratchpad/audit-2026-09-12/AUDIT-SOURCING-2026-09-12.md` (non suivi).
  Vérifié par le coordinateur : FK CASCADE `consultation_products` / `purchase_order_items` / `sales_order_items` /
  `stock_movements` → `products` ; bouton échantillon désactivé seulement sans fournisseur (`page.tsx:461`) ; « Sourcing
  validé » affiché même en échec (`page.tsx:175-181`) ; « Plateaux Pokawa » brouillon actif sur LinkMe. 25 défauts,
  ≈ 4 000 lignes mortes, aucune notation qualité. Programme : **P3a** correctifs rapides → **P3b** suppression interdite
  si historique (accord) → P3 (+ commande échantillon anti-doublon) → P4 → **P4b** grille d'évaluation (accord) → P5 →
  P6 → P7 → P8. **Tranché 2026-09-12** : D1 suppression refusée si historique (seulement Retirer) · D5 badge « Retiré »
  en consultation, non commandable, hors PDF client · D6 échantillon bloqué si commande en cours · D7 LinkMe après
  validation · D3 colonnes par critère (agent) · **D2 grille une seule fois, à réception de l'échantillon** · D4 le score
  propose, Roméo décide · D8 poids 20/20/15/15/10/10/10 + sécurité. Toutes les décisions sourcing sont prises.
  Sécurité relevée : fonctions SECURITY INVOKER encore exécutables par anon (`create_sample_order`, `request_sample_order`,
  `approve_sample_request`, `mark_sample_*`, `validate_sourcing_draft` 6 args, `get_consultation_eligible_products`,
  `cleanup_old_product_drafts`) — hors lots S1 (SD seulement), soumises aux règles RLS ; lot suivant « invoker ».
- **2026-09-12 — programme consolidé** (`docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md`) ; analyse #1142 :
  5 F2 à fermer en lot 7, 239 INVOKER exécutables par anon (131 déclencheurs, 24 écritures, 84 lectures) en lot 8,
  3 appels 401 du 11/09 = tests `curl` de l'agent ; build #1142 relancé (dépassement du délai de 20 min, pas une erreur).
  `get_stock_alerts_count` ~186 700 appels authenticated → A3.
- **Compte rendu pour Cowork** : `~/Documents/Workspace/verone/_inbox/2026-09-12-compte-rendu-claude-code-verone.md`
  (Roméo attend de Cowork les prochains points de développement). Roméo repousse son test Want It Now.
- **Décision Roméo 2026-09-11** : fiches produits « Vérone décide, Want It Now propose » (mémoire
  `verone-win-product-data-ownership`). Synchro des fiches = chantier **`[VER-CANAL-WIN-002]`** après envoi du canal actuel.
- Test local : depuis le 2026-09-11 soir, le back-office Vérone tourne sur le **port 3000** (LinkMe 3002, site 3001).
  Connexion active dans la fenêtre Playwright lane-2. Local = production (`main` `de71f75f`, 2026-07-23) + 3 PR de
  staging + les 6 commits Want It Now.
- **Prompt de reprise** : `docs/scratchpad/prompt-prochaine-session-2026-09-11-VER-CANAL-WIN-001.md`.
- Accès remis en ordre le 2026-09-11 : PAT Supabase publié **révoqué** ; 2 jetons Vérone à portée projet
  (`verone-claude-code` écriture base, `verone-github-ci` lecture, expirent le **10/12/2026**, Trousseau) ;
  secret CI `SUPABASE_ACCESS_TOKEN` remplacé ; jeton « Want-It-Now MCP Server » + org Supabase **WIN-TEST**
  (projet en pause `dmwcnbcussoqychafcjg`) **supprimés** sur ordre Roméo ; `~/.zshrc` charge les jetons par dossier.
  Sauvegardes : `~/verone-backups/2026-09-10-avant-ver-canal-win-001.bundle`, `~/verone-backups/secrets-bak-2026-09-11/`.
- **Dépôt GitHub passé en PRIVÉ le 2026-09-11** (décision Roméo, offre GitHub **Free**) : historique (anciennes clés,
  liste clients) plus lisible sans connexion (404 vérifié). Conséquence : **protection des branches main/staging
  non appliquée** (checks requis, interdiction force-push) et 2 000 min d'Actions/mois. Ne plus compter sur l'auto-merge.
- **[BO-AUDIT-005] mis à l'abri** : commit local `cc10edae`, **jamais poussé**, fait en `--no-verify` sur ordre
  explicite Roméo. **À corriger à la reprise** : `apps/back-office/src/middleware.ts:87` utilise `console.log`
  (règle no-console). Prettier a pu reformater quelques fichiers de ce commit (espaces seulement).
- Rangement automatique : `.husky/post-merge` déplace les vieux rapports `docs/scratchpad/*.md` vers
  `archive/AAAA-MM/` à chaque `git pull` sur staging → 15 suppressions + 1 dossier non suivi apparaissent dans
  l'arbre. Normal, rien de perdu ; ne jamais les inclure dans un commit de chantier (préparer fichier par fichier).
- Sécurité compte Supabase : vérification en deux étapes **désactivée** (à activer par Roméo, téléphone requis).

### 0. [BO-AUDIT] — résumé (détail complet : archive du 16/09 + audits de référence)

Références : `docs/audit-2026-07-30/` (README, FINDINGS, PLAN-CORRECTION, SYSTEME), `docs/scratchpad/audit-2026-09-11/`
(PLAN-CORRECTION, SESSIONS, RAPPORT-SOURCING-CONSULTATIONS), `docs/scratchpad/audit-2026-09-12/` (AUDIT-SOURCING ;
PROGRAMME périmé). Notes du 11/09 : sécurité 19, performance 22, scalabilité 26, global 24/100 ; estimation Cowork 15/09 :
~45 / ~40 / ~30.

| Lot                                                                                            | État au 16/09 → où il vit maintenant                                                                |
| ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `BO-AUDIT-001` dépôt privé, PAT révoqué, mot de passe                                          | soldé                                                                                               |
| `BO-AUDIT-002` identifiants hors du code                                                       | soldé (`45ee8751`) ; demande #1128 encore ouverte à vérifier                                        |
| `BO-AUDIT-003` mur des routes API en 3 temps                                                   | session 05 (écart E4) ; le lot 1 ne touche pas la configuration Qonto (cookie de session seulement) |
| `BO-AUDIT-004` gates CI                                                                        | soldé (#1129) ; alias `e2e-smoke-aggregate` → session 03 S4.5                                       |
| `BO-AUDIT-005` purge documentaire + commit local `cc10edae` (`console.log` `middleware.ts:87`) | à reprendre dans 05, jamais en bloc                                                                 |
| `BO-AUDIT-006` Sentry, erreurs visibles                                                        | session 10c                                                                                         |
| `BO-AUDIT-007` rôle dans le JWT, `force-dynamic`                                               | **écartés** par les mesures du 11/09 ; `sideEffects` → 01                                           |
| `BO-AUDIT-008` 12 bugs bloquants                                                               | écart E6 (bugs du quotidien)                                                                        |
| `BO-AUDIT-009` socle de test / baseline SQL                                                    | session 10a                                                                                         |
| `BO-AUDIT-010` 8 parcours Playwright                                                           | non programmé                                                                                       |
| `BO-AUDIT-011` architecture (types, cycles)                                                    | session 10b (cycles mesurés à 0 par Cowork)                                                         |
| `BO-AUDIT-012` 3 agents manquants (fichiers dans `cc10edae`)                                   | non programmé                                                                                       |
| `BO-AUDIT-013` rotation des clés, purge d'historique                                           | en dernier, volontairement                                                                          |

Point encore ouvert du 30/07 : hooks Claude Code `$TOOL_INPUT` vs stdin (fail-open possible) — à trancher par un test d'une minute.
Incident secrets : historique Git avec 3 sauvegardes `.env.local.backup-*` (15/01) → dépôt privé, rotation au lot 013.

### 1. Rapprochements bancaires Pokawa — Roméo à la main, EN LIGNE

3 faits le 2026-07-23 (montants uniques, cf. section « Rapprochement bancaire Pokawa » plus bas).
**Restent à trancher par Roméo lui-même, en ligne** : 5 montants récurrents (415,92 € ×3,
630,48 €, 180 €) où plusieurs virements collent → Roméo choisit la paire. + 5 sans virement au
montant exact (non rapprochables en l'état). Liste complète dans la section dédiée ci-dessous.

### 2. Dette et vigilance (à planifier)

- ⚠️ **`supabase db push` reste déconseillé** — carnet de migrations réaligné le 2026-07-23
  (14→435, base saine), mais 418 fichiers à l'ancien format `AAAAMMJJ_NNN` empêchent un `push`
  propre. Appliquer les migrations via `execute_sql`, jamais `push`. Détail :
  `dev-report-2026-07-23-migrations-realign.md`.
- **Sécurité base durcie et en ligne** (BO-SEC-001, release #1125, 2026-07-23). Les 6 règles
  système `always-true` (dont `stock_movements`, protégé) restent **par conception** — ne pas
  les durcir. Protection « mots de passe piratés » : **non activée** — réservée au plan Supabase
  payant, décision Roméo : on reste en gratuit (non nécessaire au lancement).
- ✅ **Toutes les demandes en attente fermées (2026-07-23)** : #923 (migration déjà en base),
  #1110/#1063/#1062 (mises à jour de dépendances non nécessaires). Plus aucune demande ouverte.
- **VOCABULAIRE — ne plus confondre** : « vitrine publique » = page d'accueil linkme.network
  pour visiteur sans compte. « pages de sélection partagées » = liens `/s/…` qu'un affilié
  envoie à ses propres clients. Deux sujets séparés, **jamais** dans la même modification
  (incident 2026-07-22 : la sélection Black & White Burger vidée à 0 produit, restaurée).

### 3. Suites LinkMe (non urgent)

- Textes légaux : relecture avocat le moment venu (contenu standard, non validé).
- **Blog** : lien masqué du menu et du pied de page, infrastructure intacte. Roméo fournira
  des études de cas → il suffira de remettre l'entrée dans `Header.tsx` et `Footer.tsx`.
- _(optionnel)_ « Ciel de bar » coché en vitrine mais fiche incomplète (pas de description,
  image de vases) → décision éditoriale Roméo : compléter ou décocher.
- ~~Accès sans connexion → « Application error » (React #310)~~ **corrigé** (#1160, vérifié en ligne le 15/09 : `/dashboard` → `/login`, 0 erreur).

### 4. Comptabilité Welyb

**[BO-COMPTA] Comptabilité Welyb — CHANTIER PRINCIPAL MERGÉ EN LIGNE (main) le 2026-06-30**
(PR #1096 staging + release #1093 main). Cockpit Finance/Bibliothèque complet : statuts, synchro
Qonto, dépôt = rapprochement immédiat, TVA/PCG, envoi au comptable depuis l'écran. 46 achats 2025
envoyés + reçus chez Welyb. NE PAS réinitialiser `transferred_to_accountant_at`.
**Suites à faire :**

- **Collecte 2025** (surtout Roméo) : ~145 achats + 61 ventes manquants à récupérer et déposer
  dans la Bibliothèque (le dépôt rapproche tout seul). Puis « Préparer Welyb » + confirmer.
- **Activer l'envoi réel en PROD** : `ACCOUNTANT_SEND_ENABLED` non défini sur Vercel → le bouton
  d'envoi reste inactif en ligne. À activer côté serveur quand Roméo le décide (action financière).
- **Test dépôt** (1% restant) : Roméo dépose 1 vraie pièce → vérifier qu'elle passe « présente »
  direct (validé par construction, voir `dev-plan-2026-06-27-BO-COMPTA-003-flux-2025-fixes.md`).
- GAP 3 (option, + tard) : auto-relier les 61 ventes 2025 aux factures Vérone (`financial_documents`).
- Phase 2 (demande 2026-06-18, + tard) : ajout MANUEL de pièces hors Qonto (remboursements,
  factures payées sur un autre compte).
- Hygiène code (+ tard) : redécouper 2 fichiers > 400 l (`cloture-table.tsx`, `send-to-accountant/route.ts`).

---

## Défauts relevés en production, à programmer

- Générateur PDF : un module bloqué par `connect-src` (sans effet visible, relevé 14/09).
- Demande #1128 `[BO-AUDIT-001/002/005]` ouverte depuis le 14/09 : ses 3 commits ne sont pas dans main alors que
  le retrait des identifiants semble fait autrement → vérifier puis fermer ou fusionner.
- Données de test à décider par Roméo : produit TEST PRD-0314 (validé, catalogue, brouillon, fournisseur de test) et
  commande échantillon PO-2026-00039 « commande test » (brouillon).
- **Commandes du site internet : le « payé » était faux** (réglé 17/09). Les 3 commandes du Lampadaire Zigmo chromé
  (VER-SI-1002 / 1008 / 1009) ont été annulées — prévisionnel revenu à 1, alerte disparue. Roméo a confirmé que les
  paiements « payé » venaient de **comptes de test Stripe** : `paid_amount = 0`, `paid_at` NULL, aucun
  `stripe_payment_intent_id`. `VER-SI-1002`, `VER-SI-1004` et `VER-SI-1009` remises en `pending` (la vérité), plutôt
  que d'inventer un statut « remboursé » pour un remboursement inexistant. **Un statut « remboursé » reste à créer le
  jour d'un vrai remboursement** (avec montant et date réels).
- **`VER-SI-1004` est encore `validated`** (99,30 €, commande de test) et **bloque du stock prévisionnel** —
  l'annuler ou non = décision Roméo (question posée le 17/09).
- **Stripe ou Revolut** : Roméo envisage Revolut. Avis donné le 17/09 — garder Stripe pour l'encaissement en ligne
  (branchement existant, moyens de paiement, litiges et remboursements bien mieux couverts), Revolut Business
  éventuellement pour le compte pro. Décision non prise.
- **Le menu d'une commande n'expose « Annuler » qu'en brouillon** : une commande site internet validée doit être
  dévalidée d'abord, alors que le garde-fou `prevent_so_direct_cancellation` autorise l'annulation directe pour ce
  canal. Incohérence mineure, à corriger un jour.

---

## Récemment livré (rappel — historique complet dans Git)

- **Améliorations PDF (BO-PDF-IMPROVE-002)** : filtre date Valorisation, habillage stock or/charbon, message « consultation supprimée le X » — déjà en prod (couvert par #1051/#1052/#1056).
- **Sourcing + Consultations** (audit 2026-06-03 : 5 bugs + UX, 17 corrections PRs #1043 → #1076) : livré et **validé en local le 2026-06-04** (sourcing, fiche produit, tarification/notes, wizard consultation, PDF). Reste optionnel : test manuel multi-comptes du plugin Chrome sourcing (à faire par Roméo).

---

## Backlog / En attente décision Roméo

- **Black & White Burger sans organisation parente** — `get_affiliate_partner_organisation_id` retourne NULL, dépôt de facture bloqué tant qu'une organisation `is_enseigne_parent = true` rattachée à l'enseigne n'est pas créée (back-office `/contacts-organisations/organisations`).
- **Rapprochement bancaire des 13 commandes Pokawa** — cf. section ci-dessous.
- **[SITE-RECTIF-001] Reste à finir sur le site (images)** :
  - ✅ **Mentions légales** : COMPLÈTES et EN LIGNE (2026-07-08, source societe.com — VERONE SAS,
    capital 1 000 €, 229 rue Saint-Honoré 75001 Paris, SIRET 914 588 785 00016, RCS Paris 914 588 785,
    TVA FR20914588785).
  - **Journal RÉINITIALISÉ** (2026-07-08) : les 5 articles de lancement supprimés (liés à une
    sélection produits non figée). Sauvegarde restaurable + modèle de format dans
    `docs/content/articles/` ([SITE-JOURNAL-001], PR #1105). À réécrire une fois la sélection
    produits stabilisée, en gardant le même format. Page /journal = état vide « Le journal arrive ».
  - **Image de collection** : 1 collection sans image — Roméo : « on verra plus tard » (2026-07-08).
  - **Fiches produit** (non bloquant) : ~21 sans description, ~58 sans dimensions → saisie en masse
    back-office plus tard.
- _(mineur)_ Quelques vignettes de photos produits ne se chargent pas sur les pages consultation (erreur 400 sur l'optimisation d'images de quelques fichiers Supabase). Cosmétique, pré-existant.

---

## LinkMe — Rapprochement bancaire demande Pokawa PR-2026-000001

Sur les 91 commandes liées à la demande de paiement Pokawa (30 471,84 €) :

- **65** : payées proprement, RAS.
- **13** : payées mais donnée incomplète (8 sans date de paiement, 5 avec 1 centime d'écart d'arrondi — bug R1 connu de `finance.md`). Pas des impayés, nettoyage cosmétique éventuel.
- **13** : paiement NON enregistré dans le système → rapprochement à faire. Roméo confirme qu'elles ont été payées dans la vraie vie.

**Avancement 2026-07-23** (règle Roméo : montant unique → valider ; montant récurrent → en suspens ;
tiers = franchisés Pokawa, libellés parfois au nom d'une holding) :

- ✅ **3 rapprochés** (montant unique, via `link_transaction_to_document`, commandes passées « payé ») :
  `F-25-024` (360 € ← POKAWA LEBON 18/09/2025), `F-25-031` (540 € ← POKAWA TOULOUSE 11/06/2025),
  `F-25-025` (6 582,04 € ← SARL DRAVIL 11/06/2025).
- 🟠 **En suspens** (montant récurrent, plusieurs virements candidats — décision Roméo pour la paire) :
  `F-25-012`/`F-25-015`/`F-25-026` (415,92 € ↔ ANAVIR 22/04, LAGARDÈRE 06/05, LAGARDÈRE 16/06),
  `F-25-029` (630,48 € ↔ POKEMOX 26/06 ou SARL DRAVIL 22/07), `F-25-005` (180 € ↔ POKAWA MAZARINE,
  virement déjà marqué rapproché ailleurs → à vérifier).
- ❌ **Aucun virement au montant exact** (pas rapprochables en l'état) : `F-25-027` (1 483,80 €),
  `LINK-240005` (2 037,90 €), `LINK-240025` (1 198,80 €), `LINK-240039` (327,62 €), solde `LINK-240028`
  (reste 3 827,45 € sur 4 827,45 €, 1 000 € déjà rapproché).
- ⚠️ Ces 13 commandes n'ont pas de facture → rapprochement commande↔virement par montant. Dates de
  commande = dates de saisie (2026), non fiables ; seules les dates de virement (2025) le sont.

---

## Brand Foundation Vérone

- `docs/brand/BRAND-FOUNDATION-VERONE.md` — SOURCE DE VÉRITÉ textes/ton
- `docs/brand/DESIGN-SYSTEM-VERONE.md` — couleurs, typos, règles visuelles
- Or #C9A961 · Charbon #1d1d1b · Blanc #FFFFFF
- Bodoni Moda 900 (titres) · Montserrat 400/500 (body) · DM Sans Light UPPERCASE (eyebrows)
- Tutoiement strict · border-radius: 0 sauf pills

---

## LinkMe — Site public : chantier CLÔTURÉ le 2026-06-17

Tout est livré. Plus rien en cours. Détail historique dans Git + mémoire
`linkme-site-public-pending`. Récap des dernières finitions :

- **Responsive** (PR — audit 2026-06-17) : 5 pages publiques × 5 tailles propres, aucune
  correction nécessaire.
- **Formulaire de contact Vérone** (PR #1090) : notif email équipe ajoutée.
- **Calendly** : RDV « 30 Minute Meeting » supprimé, restent les 3 RDV LinkMe.
- **WhatsApp** : **ABANDONNÉ** (PR #1091, retrait du code en veille). L'email suffit ;
  finaliser Meta exigeait numéro dédié + moyen de paiement + vérif entreprise pour un
  canal qui ne fait que doubler l'email. Décision Roméo.
