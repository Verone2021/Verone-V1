# `ACTIVE.md` — file de tâches active

**Ce fichier est gitignored.** Il vit uniquement en local. Maintenance : `.claude/rules/active-md-maintenance.md`.

---

## ▶▶ FEUILLE DE ROUTE 2026-09-16 — source unique de l'ordre des sessions (écrite par Claude Cowork)

**Dossier** : `docs/scratchpad/feuille-de-route-2026-09-16/` — `README.md` (préambule V1→V9 + ordre) et un prompt par session.
**Remplace** `docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md` (périmé depuis le 14/09). L'état se tient ICI.
**Règle nouvelle (incident du 15/09 12:34-14:00 UTC, 194 erreurs 500, timeouts)** : aucune release, migration ni requête
lourde de statistiques entre 07 h et 17 h UTC un jour ouvré.

| #   | Session                                                                                                                    | Base                 | État                            |
| --- | -------------------------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------- |
| 00  | Mesure production du 16/09 + cause des timeouts `linkme_orders_enriched` + remise d'équerre                                | non                  | à faire le 16/09 après 17 h UTC |
| 01  | **AUDIT COMPLET** : performance à 100 %, sécurité, scalabilité — notes sur 100, plan chiffré                               | non                  | à faire, après 00               |
| —   | `[BO-SOURCING-VALIDATION-001]` (prompt `docs/scratchpad/prompt-2026-09-15-BO-SOURCING-VALIDATION-001.md`)                  | accord               | à faire                         |
| 02  | Corrections des requêtes lentes (`linkme_orders_enriched`, `get_site_internet_products`, alertes stock, Inventaire, index) | selon 01             | à faire                         |
| 03  | S4 — CI de dérive hors production, build < 20 min, secrets E2E                                                             | non                  | à faire                         |
| 04  | Temps réel Supabase : réduire ou couper (60 % du temps base)                                                               | accord (publication) | à faire                         |
| 06  | P11 écran consultation par fournisseur + P12 PDF et gel des prix                                                           | non                  | à faire                         |
| 05  | S2 — contrôle central des routes API en 3 temps (90/152 sans garde)                                                        | non                  | à faire                         |
| —   | Sessions A `SITE-CATALOGUE-FILTRES-001` et B `BO-PRODUCTS-LIST-MARGIN-001` (dev-plans du 16/09)                            | non                  | à faire                         |
| 07  | Sécurité : 98 tables encore SELECT anon, lots 8-11 régénérés, gardes affiliés                                              | accord par lot       | à faire                         |
| 08  | P14 notation fournisseur, 4 critères par événement                                                                         | accord               | à faire                         |
| 09  | P6 ménage sourcing (code mort, 13 fonctions, contraction des statuts, données)                                             | accord               | à faire, pas avant le 22/09     |
| 10  | Scalabilité : baseline SQL des 62 tables, types uniques, Sentry, rétention journaux                                        | accord               | à faire                         |
| —   | Want It Now : test local Roméo (3 produits) → push → PR → release ; puis WIN-002 (3 décisions v2.1)                        | —                    | en attente Roméo                |

**Décisions Roméo en attente** : données de test PRD-0314 / PO-2026-00039 (garder ou supprimer) · test WIN + 3 questions
v2.1 · port des commandes dans la marge (exclu ou réparti) · montée de gamme de l'instance (après 01) · Welyb envoi réel ·
Pokawa 5+5 · Black & White Burger · 2FA Supabase.

**En production au 15/09 (main `24126ca9`, release #1164 `de02d181`)** : sécurité lots 1-7 + SEC-005/006/007 · S3 menu +
RPC `get_sidebar_counts` · sourcing P3a/P3b/P3/P4/P4b/P5/P7/P8 · consultations P2/P9/P10 (base) · PROFIT-001/002/003 ·
E2E réels réparés · auto-merge suspendu. Mesure 15/09 après bascule (14-16 h UTC) : comptages ÷ 20, p50 21-122 ms, 0 erreur.

---

## Priorités immédiates

### ▶ ORDRE PROPOSÉ (2026-09-16, à valider par Roméo) — détail : `~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-mise-en-ligne-et-reste-a-faire.md` § 5

1. **Sécurité Internet** (vérifié dans `main` le 16/09) : `api/qonto/{balance,transactions,clients}`, `api/logs`,
   `api/emails/form-reply` sans contrôle de connexion ; webhook Revolut LinkMe accepte un appel sans signature
   (`route.ts:38`) ; `api/admin/run-migration` → `exec_sql` ; pas de `middleware.ts`. Qonto = accord Roméo (BO-AUDIT-003 temps 1).
2. `[BO-SOURCING-VALIDATION-001]` (priorité annoncée par Roméo).
3. **Comptabilité** : `reconcile/route.ts:113` n'écrit rien, sync Qonto sans mises à jour, code 707 partout, rapports
   limités à 1 000 transactions, TVA 20 % en dur en consultation ; numérotation des factures par comptage à revérifier.
4. Session A `[SITE-CATALOGUE-FILTRES-001]` puis session B `[BO-PRODUCTS-LIST-MARGIN-001]` (plans du 16/09).
5. Bugs du quotidien (commandes sans contacts, `backorder`, segments / devise / adresse fournisseur, notifications du
   tableau de bord), puis bloc S et performance.

> **Session 2026-07-23 — tout en production** : catalogue public LinkMe (release #1120),
> correctif PR-documentation + logos allégés ~11 Mo (release #1123). Pages légales OK.
> 3 rapprochements Pokawa faits. **Sécurité base durcie + carnet migrations réaligné**
> (BO-SEC-001, release #1125). Toutes les demandes en attente fermées. Détails en Git. main = staging.

### ▶ PRIORITÉ SUIVANTE (demande Roméo 2026-09-15 soir) — [BO-SOURCING-VALIDATION-001] règles de validation du sourcing

- **Prompt de reprise prêt** : `docs/scratchpad/prompt-2026-09-15-BO-SOURCING-VALIDATION-001.md` (nouvelle
  discussion, celle du 15/09 étant trop lourde).
- Demande : expliquer pourquoi des produits sans fournisseur apparaissent validés et pourquoi d'autres ne peuvent
  pas l'être ; **une règle unique de champs obligatoires** (fournisseur au minimum) appliquée en base
  (`apply_product_lifecycle_action` validate + `request_sample_order`) **et** à l'écran, sinon ni validation ni
  commande d'échantillon ; **remettre « en cours »** les produits de sourcing validés à tort, liste montrée à Roméo
  avant toute écriture.
- Piège relevé 15/09 : 232 produits catalogue (`creation_mode='complete'`) ont `sourcing_status='need_identified'`
  par défaut de colonne → ne jamais les traiter comme sourcing. 6 vrais produits en sourcing, 3 sans fournisseur ;
  1 seul `validated` (PRD-0314 TEST). Contrôle fournisseur + prix en base seulement depuis le 13/09 (P4).
- #1160 / #1161 en production depuis le 15/09 (release #1162, main `24126ca9`) : partir de `staging` à jour.

### À reprendre (2026-09-16)

- Bloc S sécurité lots 8-11 reporté (`docs/scratchpad/bloc-S-drafts-2026-09-15/`, détail `reste-a-faire-2026-09-15.md`).
- Compte rendu Cowork du 16/09 : `~/Documents/Workspace/verone/_inbox/2026-09-16-compte-rendu-mise-en-ligne-et-reste-a-faire.md`.

### ▶ SESSIONS PLANIFIÉES (2026-09-16) — prompts Claude Cowork du 15/09, jamais commencés

Ordre : `[BO-SOURCING-VALIDATION-001]` (priorité Roméo, ci-dessus) → session A → session B. Chaque plan prévaut sur son
prompt (écarts vérifiés dans le code `staging` `be9bbcf3` et en base le 16/09).

- **Session A — `[SITE-CATALOGUE-FILTRES-001]`** filtres catégorie du catalogue public (familles jamais filtrées, second
  clic sans effet, URL qui perd la catégorie). Plan : `docs/scratchpad/dev-plan-2026-09-16-SITE-CATALOGUE-FILTRES-001.md`
  (§ 7 = texte de lancement). Site seul, aucune base.
- **Session B — `[BO-PRODUCTS-LIST-MARGIN-001]`** liste produits : chips par segment, recherche, marge réelle, prix site
  modifiable dans la ligne. Plan : `docs/scratchpad/dev-plan-2026-09-16-BO-PRODUCTS-LIST-MARGIN-001.md` (§ 7). Aucune
  migration ; réutilise l'écriture de prix site existante ; essai d'édition sur un produit montré à Roméo avant.

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

### 0. [BO-AUDIT] Chantier de remise à niveau — PRIORITÉ ABSOLUE

#### ÉTAT RÉEL AU 2026-09-11 — remesuré, prévaut sur la table historique plus bas

**Plan à jour : `docs/scratchpad/audit-2026-09-11/PLAN-CORRECTION-2026-09-11.md`.
Prompts d'origine : `docs/scratchpad/audit-2026-09-11/PROMPTS-2026-09-11.md`.**

#### ▶ PROGRAMME — ORDRE ET ÉTAT : `docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md`

**Source unique de l'ordre et de l'état depuis le 2026-09-12** (remplace l'ancien tableau « SESSIONS À FAIRE »,
`SESSIONS-2026-09-11.md`, le § 10 du rapport sourcing du 11/09 et le § 6 de l'audit sourcing du 12/09 — ces fichiers
restent la référence du détail). Ordre : A1 fermeture Want It Now → A2 #1142 + lots 7-8 → A3 S3 menu de gauche →
A4 P3a → A5 P3b → A6 P2a-c → A7 P9 révisé → A8 P10-P12 → A9 P3-P8 + B20 → A10 P14 notation fournisseur → A11 S2, S4,
S6, P13, VER-CANAL-WIN-002 → A12 reste. Décisions métier : mémoire `sourcing-consultation-decisions-2026-09-11`
(dont le complément du 11/09 soir : frais par fournisseur, P14). Consigne Roméo : au moindre doute, poser la question.

**GitHub** : le compte actif du poste est WantitNow ⇒ préfixer tout accès au dépôt Vérone par
`GH_TOKEN="$(gh auth token -u Verone2021)"` (vérifié, ne change pas le compte actif).

**Les 3 causes mesurées de la lenteur intermittente** (rapport § 2) : (1) le temps réel Supabase occupe
**63 %** du temps de la base ; (2) le menu de gauche et l'en-tête interrogent la base **toutes les ~32 s**
parce que 5 canaux temps réel visent des tables non publiées et 1 vise une vue — **90 % du trafic** de
travail et **92 % des appels > 2 s** ; (3) le contrôle CI de dérive lit le catalogue de la production
(**5,5 s et 4,2 millions de blocs par passage**, à chaque PR). Instance minuscule (224 Mo de cache) : des
instructions triviales montent à 6-12 s par moments.

| Axe         | Note       | Mesure qui la fixe                                                                                                                                                                                                                                                          |
| ----------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sécurité    | **19/100** | 90 routes sur 152 sans contrôle ; 332 fonctions SECURITY DEFINER exécutables par `anon` ; `reset_finance_auto_data` ouverte                                                                                                                                                 |
| Performance | **22/100** | compteurs du menu toutes les ~32 s = 90 % du trafic, 11,7 % des appels > 2 s ; temps réel = 63 % du temps base ; Inventaire à 222 requêtes. ~~107 ms ajoutés à chaque page par `user_activity_logs`~~ **infirmé** (envoi groupé par minute, hors rendu, ~1 000 lignes/mois) |
| Scalabilité | **26/100** | 7 fichiers de types sur disque, 4 suivis par git dont 3 morts ; 13 cycles entre packages + 7 fichier à fichier ; **61 tables sur 133** sans `CREATE TABLE` (et non 6)                                                                                                       |
| **Global**  | **24/100** | 22 le 2026-07-30, 24 le 2026-07-31. Cible 80.                                                                                                                                                                                                                               |

**Lots soldés depuis juillet** : `BO-AUDIT-001` (dépôt privé, PAT révoqué, mot de passe changé),
`BO-AUDIT-002` (.gitignore en globs), `BO-AUDIT-004` (gates CI rebranchées, PR #1129 mergée).
La table historique plus bas ne le reflète pas — s'y fier conduit à refaire du travail fait.

**Trois conclusions de l'audit de juillet INFIRMÉES par les mesures du 2026-09-11** :

- le rôle dans le JWT gagne ×2 à ×3, pas ×36, et un droit retiré resterait actif jusqu'à
  l'expiration du jeton (~1 h) → **écarté** ;
- retirer `force-dynamic` du layout racine est sans effet sur 165 pages sur 169 → **écarté** ;
- il y a 67 boucles requête-par-élément en série et 21 en parallèle, pas 25.

**Ordre d'attaque au 2026-09-11** (détail et gains chiffrés dans le plan) :

| Bloc | Objet                                                                                                                                                                                  | Durée     | Gain                                                |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------- |
| A    | Journal de navigation `user_activity_logs` — **déjà hors rendu** (mesuré) ; reste : alléger ou arrêter, rétention = décision Roméo                                                     | 1-2 h     | faible (~1 000 lignes/mois aujourd'hui) — session 6 |
| B    | Statistiques Postgres — **aucun effet mesurable** (estimations exactes ; 174/185 anciennes par la date, mais 1 à 30 lignes modifiées sur les tables chaudes)                           | 30 min    | ≈ 0 — session 7 facultative                         |
| C    | Menu de gauche + en-tête : **supprimer l'interrogation toutes les 30 s** (canaux sur tables non publiées), puis 11 compteurs → 1 appel                                                 | 3-4 h     | 90 % du trafic de travail — session 3               |
| D    | Compteur d'alertes stock : ~10 ms de **re-préparation à chaque appel** (pas les statistiques)                                                                                          | 2 h       | 141 ms → < 10 ms — à programmer                     |
| E    | ~~`TO authenticated` + index sur colonnes de policy~~ — **contredit par les mesures** (37 policies `TO public`, 4 back-office ; coût dû aux salariés connectés) et touche aux policies | —         | ≈ 0 — **non programmé**                             |
| F    | Page Inventaire : 222 requêtes → 2                                                                                                                                                     | 3 h       | chargement de la page                               |
| G    | Contrôle central d'accès — **le code existe, commit `cc10edae` jamais poussé**                                                                                                         | 1 h + 2 j | 90 routes fermées                                   |
| H    | `REVOKE` sur les fonctions exposées à `anon` + garde-fou anti-régression                                                                                                               | 2 h       | la faille la plus grave                             |

**Méthode d'audit appliquée** : OWASP API Security Top 10 (2023) pour la sécurité — API2
Broken Authentication et API5 Broken Function Level Authorization ; guide officiel Supabase
« RLS Performance and Best Practices » pour la base. Ce guide classe l'indexation des colonnes
de policy en **premier** (jusqu'à 100×) et la clause `TO authenticated` en deuxième — le
wrapping `(select ...)` vient après, avec la mise en garde qui explique l'incident du 8 mai.

**Interdit, définitivement** : envelopper `is_backoffice_user()` en `(select is_backoffice_user())`
dans les policies. Appliqué le 2026-05-07, a mis la production à terre le 2026-05-08 à 03:00
(`auth.users` à 3 955 ms, GoTrue en 504, connexion impossible). Rollback
`20260508060000_rollback_bo_rls_perf_002_003.sql`.

---

#### Table historique (audit 2026-07-30) — conservée pour les références `fichier:ligne`

**Lire `docs/audit-2026-07-30/README.md` puis `PLAN-CORRECTION.md` avant toute session de
correction.** Note au 2026-07-30 : **22/100** (voir l'état remesuré ci-dessus). ~90 défauts documentés avec
`fichier:ligne` dans `docs/audit-2026-07-30/FINDINGS.md`, groupés par lot.

**Diagnostic qui commande l'ordre des travaux** : tout l'outillage de détection existe déjà
et est débranché. Les 3 jobs E2E sont désactivés en dur (`quality.yml` lignes 283, 327, 552 :
`if: false &&`), la baseline advisors (`scripts/supabase-advisors-baseline.json`) accepte
315 fonctions exposées à `anon` comme normal, et `validate:types` /
`check-db-type-alignment.ts` — qui aurait attrapé 3 des 12 bugs bloquants — ne tourne nulle
part. Avec l'auto-merge (ADR-032), les seuls garde-fous d'un merge sont ESLint, `tsc` et
`next build`. C'est le mécanisme des « 30+ régressions en production avec CI verte » de
l'ADR-016.

**Séquence imposée. Un lot par session, jamais deux.**

| Lot              | Objet                                                                                                                                                                                                                        | Durée    | État                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| `[BO-AUDIT-001]` | **Changer le mot de passe back-office** (en clair dans un fichier VERSIONNÉ, cf. ci-dessous) + repo GitHub en **privé** + révoquer le PAT Supabase. Aucune coupure                                                           | 30 min   | **soldé** (dépôt privé et PAT révoqué le 2026-09-11) |
| `[BO-AUDIT-002]` | `.gitignore` racine en globs (`.env*`, `*.backup`) + `git rm --cached` sur les 3 fichiers d'identifiants versionnés                                                                                                          | 20 min   | **soldé** (`45ee8751`)                               |
| `[BO-AUDIT-003]` | Le mur, en **3 temps** : (1) auth sur les 3 routes Qonto seules, (2) middleware en **mode observation** 2-3 j, (3) activation. Voir la note ci-dessous — un middleware activé d'un coup casse l'extension Chrome de sourcing | 4-5 j    | à faire                                              |
| `[BO-AUDIT-004]` | Rebrancher les gates CI (retirer les `if: false`, `validate:types` bloquant, purge baseline advisors, 2 nouveaux checks). **AVANT toute correction de bug**                                                                  | 1-2 j    | **soldé** (PR #1129, `e6e0e31c`)                     |
| `[BO-AUDIT-006]` | Rendre les erreurs visibles : brancher Sentry (DSN présent, zéro code), toast unique, helper `handleSupabaseError`                                                                                                           | 2-3 j    | à faire                                              |
| `[BO-AUDIT-007]` | Perf : rôle dans le JWT (256 M de seq_scan sur `user_app_roles`), retirer `force-dynamic` du layout racine, `sideEffects: false`                                                                                             | 2-3 j    | à faire                                              |
| `[BO-AUDIT-008]` | Les 12 bugs bloquants, 1 PR par bug, test de régression écrit avant                                                                                                                                                          | 1 sem    | à faire                                              |
| `[BO-AUDIT-009]` | Socle de test : baseline SQL (**61 tables sur 133 sans `CREATE TABLE`**, remesuré 2026-09-11), branche Supabase, seed, garde anti-prod                                                                                       | 1 sem    | à faire                                              |
| `[BO-AUDIT-010]` | Playwright ciblé : les 8 parcours qui exigent un vrai clic                                                                                                                                                                   | 6 h      | à faire                                              |
| `[BO-AUDIT-011]` | Architecture : 4 copies de types, 13 cycles, arbre produit dupliqué                                                                                                                                                          | mois 2-3 | à faire                                              |
| `[BO-AUDIT-013]` | **Rotation des clés + purge d'historique + gitleaks. EN DERNIER** — seul lot qui peut couper le travail des salariés, et il n'apporte rien fonctionnellement. Arbitrage Roméo 2026-07-30                                     | 1 soirée | **repoussé, volontairement**                         |

**Deux lots ajoutés après lecture complète du système de travail** (voir
`docs/audit-2026-07-30/SYSTEME.md`) :

| Lot              | Objet                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Durée |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `[BO-AUDIT-005]` | **Purge documentaire.** 4 documents causent activement des erreurs, dont `docs/current/security-auth.md:86-92` qui affirme l'existence d'un `middleware.ts` vérifiant la session sur chaque requête — **c'est l'explication des 86 routes ouvertes** : un agent lit ça, croit l'auth centralisée, écrit une route sans `getUser()`. Aussi : `stack.md:43` dit « Repo : Private » (c'est ce qui a masqué la fuite 6 mois), `triggers-stock-reference.md` annonce 48 triggers contre **243** réels sur le domaine déclaré immuable, `MAPPING-PAGES-TABLES.md` invente 9 noms de tables, `deploy-runbooks.md` donne une procédure de rollback interdite et bloquée. Sur 106 fichiers de `docs/current/`, ~75 devraient disparaître. Aucun risque, gros gain | 1 j   |
| `[BO-AUDIT-012]` | **Créer les 3 agents manquants** : sécurité (personne ne porte auth/RLS/routes API — le seul filet est l'axe 2 du reviewer, 5 puces contre 39 lignes de responsive), migration DB (`database-architect` supprimé ADR-001, personne ne porte les migrations), test (1 % du code en tests, aucun agent n'a cette mission)                                                                                                                                                                                                                                                                                                                                                                                                                                  | 2 j   |

#### 🔴 Identifiants en clair dans des fichiers VERSIONNÉS (donc sur GitHub public)

- `.claude/rules/agent-autonomy-external.md:73` — e-mail **et mot de passe** du compte back-office,
  en clair, dans un tableau de credentials. **Tracké par git.** Plus grave qu'une clé API :
  combiné aux 86 routes ouvertes, c'est l'accès owner complet par la porte d'entrée.
- `.claude/test-credentials.md` — **tracké**.
- `.claude/commands/review-references/security-rules.md` — **tracké**.
- `.claude/local/CREDENTIALS-VAULT.md:37` — token Cloudflare DNS en clair (`cfut_…`) + 2 identifiants
  de zone. Ce fichier est gitignored donc non exposé, mais un `.md` n'est pas un coffre.

→ Changer le mot de passe du compte back-office, `git rm --cached` sur les 3 fichiers trackés,
repo en privé, `gitleaks` en pre-commit (`.husky/pre-push:8-9` annonce déjà l'emplacement prévu).

#### ⚠️ Deux points à vérifier avant le Lot 2 — ils changent sa portée

**1. Le check E2E requis est un tampon vert permanent.** `quality.yml:893-914` définit un job nommé
« E2E Smoke (Playwright — back-office) » — le nom exact du check requis par la branch protection
(ADR-020). Son commentaire l'assume : « Alias retro-compat […] pour ne pas avoir à modifier la
protection ». Il ne échoue que si un job E2E vaut `failure` ; or les jobs sont `skipped` depuis le
2026-05-13, donc **il sort en succès sur 100 % des PR**. Retirer les `if: false` ne suffira pas :
il faut supprimer l'alias et mettre à jour la branch protection, sinon un skip continuera de
passer pour un succès. À noter : il y a **4** occurrences de `if: false &&` (lignes 283, 327, 430,
552), pas 3.

**2. Les hooks Claude Code sont peut-être à moitié morts.** Deux conventions incompatibles
cohabitent : les scripts dédiés lisent le JSON sur **stdin** (`INPUT=$(cat)` dans
`check-component-creation.sh:4`), les hooks inline de `settings.json` lisent
**`$TOOL_INPUT`** (lignes 88, 101, 119, 128, 173, 211). Si `$TOOL_INPUT` n'est pas peuplé :
fail-open silencieux sur le blocage des `any`, des `eslint-disable`, du push sur `main`, du
`pnpm dev` et du type-check automatique — **et fail-closed sur le contrôle Task-ID, qui bloquerait
tous les commits**. Les deux ne peuvent pas être vrais en même temps. Un
`echo "$TOOL_INPUT" >> /tmp/hook-debug.log` dans un hook tranche en une minute et conditionne la
valeur réelle de tout le dispositif.

#### ⚠️ Le Lot 1 ne touche PAS à la configuration Qonto — à relire avant toute session

Malentendu à ne pas reproduire. Il y a **deux** authentifications distinctes, et une seule est
en cause :

1. **Back-office → Qonto** : la clé `QONTO_API_KEY`, côté serveur. **Aucune ligne modifiée par le
   Lot 1.** Les mois de configuration de l'intégration Qonto ne sont pas touchés. La clé ne change
   qu'au Lot 9, et seulement en valeur.
2. **Salarié → back-office** : le cookie de session Supabase, déjà présent dans son navigateur.
   C'est celui-là qui n'est pas vérifié sur `/api/qonto/*`. Le correctif lit un cookie qui existe
   déjà → **aucun écran de connexion supplémentaire, aucune friction pour les salariés, aucune
   reconfiguration**. Le motif exact est déjà en place et fonctionne dans
   `api/sourcing/import/route.ts:173-178`.

**Risques de casse réels identifiés — c'est pourquoi le Lot 1 se fait en 3 temps et non d'un coup :**

- L'**extension Chrome de sourcing** s'authentifie par `Authorization: Bearer` et **omet
  volontairement les cookies** (`chrome-extension/popup.js:585` : « credentials omis pour eviter
  CORS strict »). Elle appelle `/api/brands`, `/api/sourcing/auth`, `/api/sourcing/import`,
  `/api/sourcing/import-supplier`. Un middleware qui teste « pas de cookie → 401 » **casse le
  sourcing**. Il faut accepter cookie **OU** Bearer.
- Deux webhooks entrants : `api/webhooks/packlink`, `api/gmail/inbound`.
- Trois routes `api/cron/*` (`google-merchant-poll`, `meta-commerce-sync`, `sync-comptabilite`)
  **absentes de tout `vercel.json`** — les seuls `crons` Vercel du monorepo sont sur
  `site-internet`. Identifier qui les déclenche (pg_cron Supabase ? manuel ?) **avant** de les
  protéger, sinon on coupe une automatisation sans savoir laquelle.

**Méthode imposée** : temps 1 = les 3 routes Qonto seules (réversible par un `git revert`) ;
temps 2 = middleware en **mode observation** qui journalise sans jamais bloquer, 2-3 jours pendant
que les salariés travaillent + un passage manuel par tous les outils, pour obtenir l'allow-list
**mesurée** au lieu de devinée ; temps 3 = activation, avec un interrupteur
`API_GUARD_MODE=observe|enforce` en variable d'environnement Vercel pour revenir en arrière en
30 secondes sans redéploiement.

#### 🔴 INCIDENT SECRETS — repo public, clés dans l'historique depuis le 2026-01-15

> **Section historique.** Le dépôt est **privé depuis le 2026-09-11** et le PAT Supabase révoqué. La
> rotation des autres clés reste au `[BO-AUDIT-013]`, en dernier.

Le repo `https://github.com/Verone2021/Verone-V1.git` est **PUBLIC** (`gh repo view` →
`"visibility":"PUBLIC"`). Son historique contient trois fichiers de sauvegarde d'environnement
committés le 2026-01-15 (commit `170aecf0`, PR #37, 419 lignes) et supprimés le 2026-01-20
(commit `b07283b7`, PR #82 — dont le message dit lui-même « Remove 3 .env.local.backup files
(GitHub PAT + Supabase service_role keys) ») :
`apps/back-office/.env.local.backup-20260114-065620`,
`apps/linkme/.env.local.backup-20260114-065620`,
`apps/site-internet/.env.local.backup-20260114-234029`.

**Supprimer un fichier ne le retire pas de l'historique** : les blobs sont lisibles publiquement
depuis six mois (1 566 commits). Cause technique : le `.gitignore` racine couvre bien `.env.local`
(lignes 26-30, vérifié) mais **aucun de ses motifs exacts ne correspond à `.env.local.backup-*`**.

Variables concernées (noms) : `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`,
`DATABASE_URL`, `QONTO_API_KEY`, `QONTO_WEBHOOK_SECRET`, `QONTO_ORGANIZATION_ID`,
`PACKLINK_API_KEY`, `RESEND_API_KEY`, `GH_TOKEN`, `VERCEL_TOKEN`, `VERCEL_DEPLOY_HOOK_URL`,
`VERCEL_PROJECT_ID`, `GOOGLE_MERCHANT_PRIVATE_KEY`, `GOOGLE_MERCHANT_PRIVATE_KEY_ID`,
`GOOGLE_MERCHANT_SERVICE_ACCOUNT_EMAIL`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `ABBY_API_KEY`,
`ABBY_WEBHOOK_SECRET`, `CRON_SECRET`, `REF_API_KEY`.

**Réponse retenue (arbitrage Roméo 2026-07-30)** : passer le repo en **privé** ferme le vecteur en
un clic, sans rien couper — c'est le Lot 0, et c'est la seule action non négociable. La **rotation
des clés est repoussée au Lot 9**, en fin de parcours : c'est le seul lot qui peut interrompre le
travail des deux salariés, et il n'apporte aucune amélioration fonctionnelle. Une fois le repo
privé, l'urgence retombe.

L'argument « personne ne connaît notre site » ne s'applique pas au repo public : les scanners de
secrets ne cherchent pas Vérone, ils indexent GitHub en continu et alertent sur les préfixes connus
(`sbp_`, `ghp_`, JWT Supabase). En revanche, **une fois le repo privé, cet argument devient
valable** — c'est ce qui rend le report du Lot 9 défendable.

Reste au Lot 9 : rotation des 20 variables (chevauchement obligatoire — créer la nouvelle, déployer
partout, vérifier, puis révoquer l'ancienne), `gitleaks` en pre-commit et CI, purge de l'historique
**après** la rotation jamais à la place (un fork ou un cache GitHub peut conserver les blobs
indéfiniment). Point technique : la `service_role` exige de **migrer d'abord vers les nouvelles
clés** Supabase, sinon régénérer le JWT secret invalide `anon` et `service_role` d'un coup et coupe
les 3 apps.

Aggravation croisée : repo public **plus** 86 routes API sans auth = l'absence de `getUser()`
dans `api/qonto/balance/route.ts` était lisible par n'importe qui.

**2ᵉ fuite — le PAT Supabase de `.mcp.json` — ✅ RÉSOLUE le 2026-09-11** (jeton révoqué et vérifié
refusé, `.mcp.json` lit `${SUPABASE_ACCESS_TOKEN}` depuis le Trousseau ; voir « EN COURS » en tête). Historique :
`.mcp.json` est bien ignoré
aujourd'hui (`.gitignore:33`, non tracké dans HEAD) mais il a été committé dans 6 commits
(`c5639550`, `c2352fe3`, `f3f6d41f`, `ebdb136b`, `175189d7`, `c11af897`), et **le token `sbp_…`
qui y figure est celui encore en service** (vérifié par comparaison). C'est un PAT de management
Supabase : portée compte entier — lister tous les projets, lire leurs clés API, exécuter du SQL,
créer/supprimer des branches. Il couvrira aussi « back-office Affect » et « back-office Want It
Now ». → **Révoquer et régénérer : Dashboard → Account → Access Tokens. Un clic, aucune coupure,
aucun redéploiement.** Puis externaliser les secrets de `.mcp.json` vers `.mcp.env` (déjà
gitignoré, `.gitignore:34`) via `"Bearer ${SUPABASE_ACCESS_TOKEN}"`.

**Contrainte technique sur la rotation Supabase** : le projet `aorroydfjsrygmosnzrl` est encore en
**clés legacy** (`get_publishable_keys` → une seule clé, `"type":"legacy"`). `anon` et
`service_role` sont deux JWT signés par le même JWT secret, et la rotation directe d'une clé legacy
n'est plus proposée. Régénérer le JWT secret invaliderait les deux et couperait tout jusqu'au
redéploiement des 3 apps. → Voie sans coupure : **migrer vers les nouvelles clés**
(`sb_publishable_` / `sb_secret_`, Settings → API Keys), révocables indépendamment, puis désactiver
la `service_role` legacy. Tâche à part entière, pas un clic.

**Faux positifs écartés — ne pas y passer de temps** : le JWT présent dans
`chrome-extension/popup.html` et `docs/restored/google-merchant-2025-11/google-merchant-setup.md`
est `role: anon` (payload décodé), donc public par conception. Aucune `service_role` dans les
fichiers trackés (vérifié sur tout `git ls-files`). La `GOOGLE_MERCHANT_PRIVATE_KEY` du même `.md`
est un placeholder de documentation.

**Autres urgences du Lot 0** — vérifiées par lecture du code, pas déduites :

- `api/qonto/balance/route.ts:53`, `transactions/route.ts:27`, `clients/route.ts:55` : aucune
  authentification. Soldes et transactions bancaires accessibles depuis Internet.
- `reset_finance_auto_data(boolean)` est `SECURITY DEFINER` sans contrôle et exécutable par `anon`
  (whitelist `20260430_sec_sdf_funcs_006...sql:126`). Elle supprime des organisations et désactive
  toutes les règles de rapprochement.
- `api/emails/form-reply/route.ts:70` : relais mail ouvert, HTML arbitraire depuis
  `contact@veronecollections.fr` avec SPF/DKIM valides.

**Point de vigilance DB** : ne PAS re-tenter le wrapping global des policies RLS — rollbacké le
2026-05-08 (`20260508060000_rollback_bo_rls_perf_002_003.sql`). Passer par
`raw_app_meta_data` + réécriture de `is_backoffice_user()` en lecture JWT, signature inchangée,
aucune policy modifiée.

**Point de vigilance tests** : aujourd'hui `turbo.json` expose `SUPABASE_SERVICE_ROLE_KEY` à
`test:e2e` et les fixtures écrivent dans `NEXT_PUBLIC_SUPABASE_URL`. **Lancer les tests peut
écrire en production.** Le Lot 6 neutralise ça en premier (`assertTestEnvironment()`).

Trajectoire de note attendue : 22 → 29 (L0+L1) → 37 (L2) → 42 (L3) → 51 (L4) → 62 (L5) →
71 (L6+L7) → 80 (L8). Détail dans `PLAN-CORRECTION.md` § 6.

---

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
- _(optionnel)_ Cas limite : accès direct à `/produits/sourcing/*` **sans être connecté** →
  « Application error » (React #310) au lieu de rediriger vers `/login`. Pré-existant.

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
