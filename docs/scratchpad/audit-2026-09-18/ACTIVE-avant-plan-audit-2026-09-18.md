# `ACTIVE.md` — file de tâches active

**Ce fichier est gitignored.** Il vit uniquement en local. Maintenance : `.claude/rules/active-md-maintenance.md`.
**Remis d'équerre le 2026-09-18** après audit croisé code / `git log` / demandes ouvertes.
Copie de la version précédente : `docs/scratchpad/archive/2026-09/ACTIVE-2026-09-18-avant-audit.md`.

**État du dépôt au 2026-09-18** : `staging` et `main` sont **identiques** (release #1174).
Tout ce qui est fusionné est en ligne. Aucun travail coincé en route.

**Demandes ouvertes** : **#1175** (chantier prix, en cours) et **#1176** (ménage du scratchpad, prête).
Les 8 demandes de ménage jumelles et la #1128 de juillet ont été fermées le 18/09 — voir ADR-042.

**Règle de fenêtre (ADR-041)** : aucune release, migration ni requête lourde de statistiques
entre 07 h et 17 h UTC un jour ouvré. Le soir ou le week-end.

---

## EN COURS — `[BO-PRICING-GOV-001]` gouvernance des prix

Branche `feat/BO-PRICING-GOV-001-prix-valide-coefficients`, 7 enregistrements, à jour sur staging.
**Demande #1175 ouverte**, contrôles verts.
Étude complète : `docs/scratchpad/dev-plan-2026-09-17-BO-PRICING-GOV-001-etude.md`.

**Fait** : prix de revient saisi à la main, coefficients conseillés par famille / catégorie /
sous-catégorie (42 sous-catégories pré-remplies), trace d'un prix validé par un humain,
code couleur prix / revient / marge sur la liste Site Internet et les deux vues du catalogue,
tri « Marge » corrigé. **6 migrations déjà appliquées en production** (`20260917235000` →
`20260917240000`) : la base est en avance sur `main` tant que #1175 n'est pas fusionnée.

**Reste, dans cet ordre** :

| Étape                                         | Nature                     | Point d'arrêt                                                  |
| --------------------------------------------- | -------------------------- | -------------------------------------------------------------- |
| B — filtres et tri sur les nouvelles colonnes | additif                    | non, j'avance                                                  |
| E — rapport « Prix & marges »                 | additif, lecture seule     | non, j'avance                                                  |
| C — correction d'un prix depuis la ligne      | écriture, une à la fois    | **GO Roméo** (choix du produit d'essai)                        |
| F — règle des 5 % LinkMe sous le site         | changement de comportement | non, j'avance (5 cas d'essai)                                  |
| D — reprise groupée des 96 prix de repli      | écriture en masse          | **GO Roméo**, par lots de 10                                   |
| G — plus aucun prix public non décidé         | changement de comportement | **GO Roméo**, le soir (la boutique passe de 125 à 30 produits) |

---

## FEUILLE DE ROUTE — sessions 00 → 10

**Source de l'ordre** : `docs/scratchpad/feuille-de-route-2026-09-16/README.md` (un fichier par session).
**L'état se tient ICI, nulle part ailleurs.** Ordre conseillé du README :
`00 → 01 → 02 → 03 → 04 → 06 → 05 → A/B → 07 → 08 → 09 → 10`.

| #   | Session                                                                                                   | Base           | État au 18/09                                                                                                                                                                                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 00  | Mesure de production + cause des dépassements de délai                                                    | non            | **partiel** : cause trouvée et corrigée (#1165, #1166) ; **il reste la mesure d'une vraie journée ouvrée, à lancer après 17 h UTC**                                                                                                                                                |
| 01  | **AUDIT COMPLET** performance / sécurité / scalabilité, notes sur 100, plan chiffré                       | non            | à faire, après 00 ; remise à zéro des statistiques = décision Roméo                                                                                                                                                                                                                |
| 02  | Correction des requêtes lentes                                                                            | selon 01       | **presque soldée** : compteurs du menu unifiés (#1166). Reste **2** appels directs au comptage des alertes de stock (`use-dashboard-additional-data.ts:125`, `use-messages-items.ts:339`). Le comptage LinkMe et `useStockAlertsCount` sont **déjà passés** par le compteur unique |
| 03  | CI de dérive hors production, temps de construction, secrets de test                                      | non            | à faire ; secrets de test **faits** le 15/09. Reste le faux contrôle `e2e-smoke-aggregate` (`.github/workflows/quality.yml:1108`)                                                                                                                                                  |
| 04  | Temps réel Supabase : réduire ou couper                                                                   | accord         | **quasi soldée** : il ne reste que **2 canaux dans 1 seul fichier** (`use-sidebar-counts.ts:73,86`), contre 7 dans 6 fichiers annoncés. 2 tables publiées. À reclasser en petite tâche                                                                                             |
| 05  | Contrôle central des routes API en 3 temps                                                                | non            | à faire ; **écart E4** : failles vérifiées en ligne (3 routes Qonto, `api/logs`, `api/emails/form-reply`, webhook Revolut sans signature, `api/admin/run-migration`) → temps 1 à avancer ; 193 routes dans les 3 apps                                                              |
| 06  | Consultations P11 / P12                                                                                   | non            | **PÉRIMÉE** : le travail décrit est livré (#1169 le 16/09, #1171 le 17/09). Ce qui reste est passé en backlog ci-dessous                                                                                                                                                           |
| 07  | Sécurité : tables encore lisibles sans connexion, lots 8-11, gardes affiliés                              | accord par lot | à faire ; au 15/09 : **76 tables + 22 vues** en lecture anonyme, **238** fonctions « invoker » et 13 « definer » ouvertes ; brouillons `docs/scratchpad/bloc-S-drafts-2026-09-15/` **non applicables**                                                                             |
| 08  | Notation fournisseur, 4 critères par événement                                                            | accord         | à faire ; colonnes vérifiées                                                                                                                                                                                                                                                       |
| 09  | Ménage sourcing (code mort, 13 fonctions, contraction des statuts)                                        | accord         | à faire, **pas avant le 22/09** ; en partie fait par #1160 ; reste la page `produits/sourcing/echantillons` et les orphelins (la lecture de `sample_orders` est **déjà** supprimée)                                                                                                |
| 10  | Scalabilité : baseline SQL, types uniques, Sentry, rétention des journaux                                 | accord         | à faire ; 5 fichiers de types dont 2 copies mortes                                                                                                                                                                                                                                 |
| A   | Filtres catégorie du catalogue public (`dev-plan-2026-09-16-SITE-CATALOGUE-FILTRES-001.md`)               | non            | à faire, plan prêt                                                                                                                                                                                                                                                                 |
| B   | Liste produits : segments, recherche, marge réelle (`dev-plan-2026-09-16-BO-PRODUCTS-LIST-MARGIN-001.md`) | non            | à faire, plan prêt                                                                                                                                                                                                                                                                 |
| —   | Want It Now : test local Roméo (3 produits) → envoi → demande → mise en ligne ; puis WIN-002              | —              | **en attente Roméo** (détail plus bas)                                                                                                                                                                                                                                             |

### Écarts encore à trancher par Roméo

- **E4** — avancer le temps 1 de la session 05 (routes ouvertes sur Internet) juste après la 00. Routes Qonto : accord déjà donné.
- **E5** — ouvrir une session « comptabilité » (« Rapprocher » n'écrit rien, synchro Qonto, code 707, rapports limités à 1 000 transactions).
- **E6** — ouvrir une session « bugs du quotidien » (commandes sans contacts, réassort, fournisseurs, notifications).
- **E14** — l'audit 01 avant ou après le reste : les deux sont indépendants.

### Décision produit Roméo du 2026-09-16 (provisoire, assumée)

**Une fiche produit = un fournisseur.** Trois spots ressemblants de trois fournisseurs = trois fiches
vendues séparément. La consultation accueille autant de produits qu'on veut. La mise en concurrence se
joue **en amont, dans le sourcing**. Conséquence : ne **pas** ajouter de fournisseur sur les lignes de
consultation, ne **pas** toucher à la contrainte d'unicité produit/consultation.

---

## Décisions en attente de Roméo

| Depuis | Sujet                                                                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 17/09  | Stripe ou Revolut pour l'encaissement (avis donné : garder Stripe, Revolut éventuellement pour le compte pro)                                                     |
| 17/09  | Les 3 anciennes photos de consultation pointent un fichier absent : à redéposer ou à laisser                                                                      |
| 16/09  | Données de test à garder ou supprimer : produit `PRD-0314` et commande échantillon `PO-2026-00039`                                                                |
| 16/09  | Remise globale et ventilation TVA par taux sur la proposition client (demande une colonne en base)                                                                |
| 16/09  | Articles gratuits / échantillons facturés en consultation                                                                                                         |
| 16/09  | Rétention du journal d'activité · remise à zéro des statistiques (session 01)                                                                                     |
| 15/09  | Port des commandes dans la marge : exclu (retenu aujourd'hui) ou réparti                                                                                          |
| 15/09  | Figer le prix de revient à la validation des futures commandes                                                                                                    |
| 11/09  | Test Want It Now de bout en bout + 3 questions de la version 2.1                                                                                                  |
| —      | Montée de gamme de l'hébergement de la base (après l'audit 01) · envoi réel au comptable · rapprochements Pokawa · vérification en deux étapes du compte Supabase |

---

## Vigilance permanente

- **Jamais** envelopper `is_backoffice_user()` en `(select …)` dans les règles de sécurité (production à terre le 08/05).
- Garde des routes API : l'extension Chrome du sourcing passe par un jeton ; 2 webhooks et 3 tâches planifiées hors configuration à identifier avant toute garde.
- Les tests automatisés peuvent écrire en production : garde anti-production à poser (session 10a).
- Rotation des clés et purge d'historique : **en dernier** ; migrer vers les nouvelles clés Supabase avant toute rotation.
- Les 6 règles système « toujours vrai » (dont les mouvements de stock) restent **par conception**.
- `supabase db push` déconseillé (418 fichiers ancien format) : migrations appliquées une par une, après accord.
- Dépôt privé sur offre gratuite : **aucune protection de branche**, jamais de fusion automatique, contrôles vérifiés à la main.
- Le rangement automatique déplace de vieux rapports à chaque récupération sur staging : normal, jamais dans un commit de chantier.
- « Vitrine publique » LinkMe ≠ « sélections partagées » : jamais dans la même modification.

---

## Backlog — vérifié dans le code le 2026-09-18

### Argent et données (prioritaire)

- **Le site ne revérifie pas le prix au moment du paiement** : le prix vient du navigateur du client
  et sert tel quel pour Stripe et pour la commande enregistrée
  (`apps/site-internet/src/app/api/checkout/helpers/create-order.ts:156`). **Sujet argent, demande dédiée.**
- Le flux Google par API calcule un prix à partir d'une colonne **qui n'existe pas** (`product.price_ht`).
  Sans effet aujourd'hui (Google et Meta lisent le flux du site, qui est juste), mais prêt à diverger.
- 29 produits vendus n'ont qu'un prix d'achat, sans frais d'approche → la marge affichée est trop belle.
- **Le menu d'une commande n'expose « Annuler » qu'en brouillon** — constaté à l'écran le 18/09 : sur une
  commande site internet validée, le menu ne propose que « Dévalider / Expédier / Lier transaction », alors
  que le garde-fou `prevent_so_direct_cancellation` autorise explicitement l'annulation directe pour ce
  canal. Deux clics au lieu d'un, sans raison. À corriger un jour.
- Un statut « remboursé » reste à créer le jour d'un vrai remboursement (avec montant et date réels).

### Fait le 18/09

- **`VER-SI-1004` annulée** (commande de test site internet, 99,30 €, Lampe boule GM naturelle × 2, jamais
  payée). Chemin utilisateur normal à l'écran : dévalider, puis annuler. Empreinte avant / après : prévisionnel
  sortant du produit 2 → **0**, stock réel 4 → 4 inchangé, mouvement prévisionnel de la commande retiré, total
  du prévisionnel sortant 147 → 145 (exactement les 2 lampes), alertes inchangées, 0 erreur à l'écran.
  **Plus aucune commande site internet validée ne bloque de stock.** C'est la dévalidation qui libère le
  prévisionnel ; une commande en brouillon n'en réserve pas (vérifié).

### Défauts fonctionnels

- Vue des alertes de stock cassée (`stock_alerts_view`, fonction `get_user_role()` absente).
- Tableau de bord : « Consultations actives » affiche toujours 0 (`get-dashboard-metrics.ts:77`, statuts en anglais).
- Mobile 375 / 768 : la colonne principale du back-office reste figée à 900 px (défilement horizontal).
- Générateur PDF : un module bloqué par la politique de sécurité du navigateur (sans effet visible).
- Quelques vignettes de photos produit ne se chargent pas sur les pages consultation (cosmétique, ancien).

### Consultations (reste de la partie B, rien d'urgent)

- `get_consultation_eligible_products` encore exécutable **sans connexion** — créée sans droits explicites
  dans `20260914020300`, et appelée depuis le navigateur. À fermer avec le lot sécurité.
- `use-consultation-detail.ts:122-134` charge **toutes** les consultations pour en afficher une seule.
- Liste des consultations sans pagination côté serveur ; sélecteur limité à 100 produits.
- Code mort : `packages/@verone/products/src/components/wizards/consultation-manager/` (3 composants, 0 import).
- Monnaies autres que euro et dollar · pas de récupération automatique du taux de change ·
  budget client pas exprimé comme objectif par ligne · pas de point mort dans le rapport interne.

### Sourcing (reste de la partie A)

- **A6** : tableau à colonnes avec glisser-déposer, filtres « sans fournisseur / sans prix », pagination.
- **A7** : ménage du code mort (2 pages orphelines, 13 fonctions cassées, 2 tables vides) — **après le 22/09**.
- « Coût rendu » du comparatif affiché en euros même pour une offre dans une autre monnaie.
- Le recalcul des totaux d'une commande fournisseur ne filtre pas les lignes archivées (0 ligne archivée aujourd'hui).
- Éco-participation non reportée sur les lignes d'échantillon.
- `useSampleDraftOrder` ne lit que la commande échantillon brouillon la plus récente.

### Dette technique

- Faux contrôle `e2e-smoke-aggregate` (`.github/workflows/quality.yml:1108`) — à retirer avec la session 03.
- Fiche catalogue en double (`produits/catalogue/[id]` vs `detail/[id]`).
- 3 fichiers au-dessus de 400 lignes : `ChannelPricingDetailed.tsx` (511), `use-product-detail.tsx` (437),
  `use-performance-analytics.ts` (411).
- ~~Demande #1128 (`[BO-AUDIT-002]`)~~ **fermée le 18/09** après vérification : la partie identifiants est déjà
  faite autrement dans `main` (aucun mot de passe en dur, `.claude/test-credentials.md` retiré du dépôt).
  Le retrait des documents périmés (`docs/current/security-auth.md`) est repris dans la session 05, temps 3.
- Commit isolé `cc10edae` jamais envoyé : à réévaluer ou abandonner (le défaut de journalisation qu'il corrigeait
  concernait un fichier **qui n'existe plus**).
- Hooks Claude Code : passage de paramètres à trancher par un test d'une minute.

---

## Chantiers en sommeil

### `[VER-CANAL-WIN-001]` — flux protégé pour Want It Now

**7 enregistrements locaux jamais envoyés** sur `feat/VER-CANAL-WIN-001-flux-want-it-now`.
Migration **déjà appliquée en production** le 11/09 (`20260911012000`, 0 produit coché).
Jeton en place côté Vérone et côté Vercel. Tests 16/16, relecture PASS.

**Consigne Roméo du 11/09** : aucun envoi tant que le test de bout en bout n'est pas fait **en local**
(Vérone sur le port 3000, Want It Now sur un autre port). Tout est préparé de mon côté.
**Reste à faire par Roméo** : cocher 10-20 produits, lancer Want It Now, cliquer « Importer ».
Ensuite : un envoi, une demande vers staging sans fusion automatique, mise en ligne, preuves.

Suite prévue : **`[VER-CANAL-WIN-002]`** — synchronisation des fiches (« Vérone décide, Want It Now propose »).

### `[BO-FABRICATION-001]` — du sourcing à la fabrication

Demandé par Roméo le 16/09. Prompt prêt : `docs/scratchpad/prompt-2026-09-16-BO-FABRICATION-001-audit.md`.
Passer un produit sourcé en « fabrication », plusieurs fournisseurs pour un même produit (tissu, bois, vis),
prix de revient construit à partir des composants, notre propre marque.
**Fait vérifié** : aucune structure de composition n'existe en base aujourd'hui. Le prompt demande un audit
(marché + existant) **avant toute ligne de code**.

### `[BO-COMPTA]` — comptabilité Welyb

Chantier principal **en ligne depuis le 30/06**. Ne pas réinitialiser la trace d'envoi au comptable.
Reste :

- **Collecte 2025** (surtout Roméo) : environ 145 achats et 61 ventes à récupérer et déposer dans la Bibliothèque.
- **Activer l'envoi réel** : le réglage n'est pas défini côté serveur, le bouton reste inactif en ligne (action financière).
- Test de dépôt d'une vraie pièce par Roméo (1 % restant).
- Plus tard : relier automatiquement les 61 ventes 2025 aux factures Vérone · ajout manuel de pièces hors Qonto ·
  redécouper 2 fichiers de plus de 400 lignes.

### Rapprochements bancaires Pokawa — Roméo à la main

Sur 91 commandes liées à la demande Pokawa (30 471,84 €) : 65 payées proprement, 13 avec une donnée
incomplète (cosmétique), 13 sans paiement enregistré. **3 rapprochées** le 23/07 (montant unique).

**Restent à trancher par Roméo** :

- **5 montants récurrents** où plusieurs virements collent : `F-25-012` / `F-25-015` / `F-25-026` (415,92 €),
  `F-25-029` (630,48 €), `F-25-005` (180 €).
- **5 sans virement au montant exact** : `F-25-027` (1 483,80 €), `LINK-240005` (2 037,90 €),
  `LINK-240025` (1 198,80 €), `LINK-240039` (327,62 €), solde `LINK-240028` (3 827,45 € restants).

### Suites LinkMe et site (non urgent)

- **Black & White Burger** sans organisation parente : dépôt de facture bloqué tant que l'organisation n'est pas créée.
- Textes légaux : relecture avocat le moment venu. Mentions légales complètes et en ligne.
- **Journal** : réinitialisé le 08/07, à réécrire une fois la sélection produits stabilisée (modèle dans `docs/content/articles/`).
- **Blog LinkMe** : lien masqué, infrastructure intacte. Roméo fournira des études de cas.
- 1 collection sans image · environ 21 fiches sans description · environ 58 sans dimensions.
- « Ciel de bar » coché en vitrine mais fiche incomplète : compléter ou décocher.

---

## Brand Foundation Vérone

- `docs/brand/BRAND-FOUNDATION-VERONE.md` — source de vérité textes et ton
- `docs/brand/DESIGN-SYSTEM-VERONE.md` — couleurs, typographies, règles visuelles
- Or #C9A961 · Charbon #1d1d1b · Blanc #FFFFFF
- Bodoni Moda 900 (titres) · Montserrat 400/500 (corps) · DM Sans Light en capitales (sur-titres)
- Tutoiement strict · angles droits sauf pastilles
