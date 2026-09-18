# Dev report — 2026-09-14 — BO-SOURCING-P5-001 — Liste sourcing en 4 colonnes

Branche locale `feat/BO-SOURCING-P5-001-liste-4-colonnes`, **empilée sur la branche P4** (elle-même sur P3, #1150),
non poussée. Commits `5c3e74df` (fonctionnalité) + `53984f71` (correctif d'affichage). **Aucune écriture en base.**

Plan : `/Users/romeodossantos/.claude/plans/splendid-orbiting-comet.md` (section P5), approuvé le 13/09.

## Ce qui change pour l'utilisateur

- Onglets **En cours · En pause · Refusés · Retirés · Validés**, chacun avec son nombre (remplacent l'onglet « Archivés »).
- Vue **Étapes** : 4 colonnes Recherche / Contact / Évaluation / Négociation avec leur nombre (anciens statuts
  regroupés comme sur la fiche). Proposée seulement dans « En cours ».
- Supprimés : vue Cartes, 4 cartes de chiffres (dont la requête « complétés ce mois »), filtre « Statut » (brouillon /
  échantillon / catalogue), badge de statut produit. Filtre « Pipeline » à 14 valeurs → filtre **Étape** à 4 valeurs.
- Colonne **Étape** : étape, ou pastille En pause / Refusé / Validé, plus « Retiré ».
- Actions de ligne selon ce que la base acceptera : Valider (seulement avec fournisseur et prix, **avec confirmation**),
  Retirer (**motif obligatoire**), Restaurer / Supprimer pour les retirés. « Validés » ouvre la fiche catalogue.
- Tableau sur grand écran, **cartes sous 768 px** (ResponsiveDataView) ; colonnes Fournisseur / Type / Date masquées
  progressivement.
- Compteur du menu et centre de messages : « produits en sourcing » = produits **en cours** (même règle que l'onglet).

## Code

- **Logique pure** (`packages/@verone/products/src/utils/sourcing-stage.ts`) : `segmentOfProduct`, `segmentQuery`,
  `statusesOfStage`, libellés. Test `__tests__/sourcing-segments.test.ts` : pour toutes les combinaisons
  (2 `creation_mode` × retiré ou non × 16 statuts), la requête envoyée à la base et le classement à l'écran donnent
  **la même partition**, segment par segment et étape par étape. Ce test a trouvé un cas limite (produit en sourcing,
  statut « validé », puis retiré) → règle corrigée : un produit retiré pendant le sourcing est toujours dans « Retirés ».
- **Filtrage par la base** (`use-sourcing-fetch.ts`, filtres `segment`, `stage`, `priority`) : plus aucun filtrage
  dans le navigateur (le tri reste local). Ancien filtre `archived_view` conservé pour les autres appelants.
- **Nombres par segment** (`use-sourcing-segment-counts.ts`) : une lecture de 3 colonnes, regroupée avec
  `segmentOfProduct`, relue après chaque action.
- **Écran** (`apps/back-office/src/app/(protected)/produits/sourcing/`) : `page.tsx` 280 lignes,
  `SourcingSegmentTabs`, `SourcingKanbanView` (4 colonnes), `SourcingProductList` (ResponsiveDataView),
  `SourcingProductRow` + `SourcingProductCard` + `SourcingProductActions` (actions communes), `SourcingFilters`,
  `SourcingViewToggle` (Liste / Étapes). Supprimés : `SourcingKpiCards.tsx`, `SourcingCardView.tsx`, `getStatusBadge`.
- **Compteurs** : `use-sidebar-counts.ts` (liste de statuts recopiée, le package `notifications` ne dépend pas de
  `products`, commentaire en place) et `use-messages-items.ts` (importe `segmentQuery`).

## Vérifications

- Tests purs 4/4 (`sourcing-segments`, `sourcing-stage`, `derive-sample-state`, `sourcing-journal`) ;
  `@verone/products`, `@verone/notifications`, `@verone/back-office` : type-check OK, ESLint 0 avertissement.
- **Nombres contrôlés contre la base** (14/09, 00:30) : En cours 4 · En pause 0 · Refusés 0 · Retirés 0 · Validés 0 ;
  étapes Recherche 1 · Contact 0 · Évaluation 0 · Négociation 3. Écran identique (onglets, colonnes, lignes).
  Ancien compteur du menu = 4, nouveau = 4 (aucun changement de nombre aujourd'hui).
- **Playwright 1440** sur `localhost:3000` (serveur de Roméo, non relancé), lecture seule :
  liste « En cours » (4 lignes, bouton Valider seulement sur les 2 produits avec fournisseur et prix) ;
  vue Étapes (1 / 0 / 0 / 3) ; recherche « TEST » → 1 ligne, requête avec les deux filtres combinés
  (`or=(sourcing_status…)` et `or=(name.ilike…,sku.ilike…)`) ; bouton Réinitialiser → 4 lignes ;
  filtre Étape « Négociation » → 3 lignes, requête `sourcing_status=in.(negotiation, 5 anciens statuts)` ;
  onglet « Retirés » → liste vide avec message, filtre Étape et bascule Étapes masqués, requête
  `creation_mode=sourcing` + `archived_at` non nul (choix d'étape ignoré hors « En cours »).
  0 erreur console venant de la page. Captures `.playwright-mcp/screenshots/20260914/sourcing-p5-*.png`.
- **Défaut trouvé à l'écran puis corrigé** (`53984f71`) : icônes des boutons d'action invisibles (ButtonV2 impose
  hauteur, largeur et marges en style en ligne → icône poussée hors d'un carré de 36 px) → boutons natifs, 36 px sur
  ordinateur et 44 px sur téléphone, icône 16 px visible (mesuré) ; loupe de la recherche cachée par le fond du champ
  (défaut ancien) → emplacement d'icône prévu par le champ ; prix de la vue Étapes au format français.
- **Incident de test sans lien avec le code** : une fois « Application error » (React « Rendered more hooks »,
  entièrement dans le routeur de Next.js) juste après un rechargement à chaud déclenché par l'enregistrement de
  fichiers ; rechargement suivant normal, jamais reproduit.

## Non testé / écarts assumés

- **Cartes sous 768 px** non capturées : page d'administration, 1440 et 1920 seulement exigés ; 1920 non capturé
  (la règle Playwright interdit d'agrandir au-delà de 1440).
- **Actions depuis la liste** (valider, retirer, restaurer, supprimer) non cliquées : mêmes fonctions que la fiche,
  testées en P4 ; la validation attend l'application de la migration P4.
- **Cibles tactiles de P4** : la barre d'actions et le formulaire du journal de la fiche utilisent ButtonV2 avec
  `h-11 md:h-9` → la hauteur réelle reste 32 px (style en ligne). Fiche d'administration non exigée sur mobile ;
  à aligner si la fiche doit un jour servir sur téléphone.

## Revue

`docs/scratchpad/review-report-2026-09-14-BO-SOURCING-P5-001.md` — **PASS WITH WARNINGS**. Double filtre `or`
confirmé correct (combiné en ET par la base) ; compteurs du menu, du centre de messages et de l'onglet alignés ;
aucun appelant cassé. Suites : `type="button"` ajouté sur 3 boutons (nom en carte, nom et fournisseur en ligne) ;
plafond de 1 000 lignes du comptage par segment laissé (4 produits aujourd'hui), à reprendre en P6 par un comptage
côté base ; `eslint-disable` pré-existant de `use-sourcing-fetch.ts` hors périmètre.
