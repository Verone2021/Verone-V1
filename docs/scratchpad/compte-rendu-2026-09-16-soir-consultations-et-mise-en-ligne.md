# Compte rendu — 16/09/2026 au soir — Consultations livrées et mises en ligne

> **À coller tel quel au début d'une nouvelle conversation Claude Code.** Ce fichier se lit seul.
> Dossier : `/Users/romeodossantos/verone-back-office-V1`. Lire `CLAUDE.md` et `.claude/work/ACTIVE.md`.
> Le compte GitHub actif de la machine peut être `WantitNow` : basculer sur `Verone2021` avant toute
> commande GitHub.

---

## Ce qui est EN PRODUCTION depuis ce soir

`main` = `2c387bc9` (release #1170 fusionnée le 16/09 à 21 h 41 UTC, 5 commits, déploiement Vercel
`Ready`, back-office en ligne vérifié). `staging` et `main` sont alignés : **0 commit d'écart**.

| PR    | Contenu                                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------------------- |
| #1165 | `[INFRA-RULES-041]` fenêtre de mise en ligne hors 07-17 h UTC en semaine                                         |
| #1166 | `[BO-PERF-S3-003]` un seul comptage partagé pour les pastilles du menu                                           |
| #1167 | `[BO-SOURCING-COMPLETUDE-001]` blocages expliqués, échantillons groupés, 4 étapes opérantes, comparatif d'offres |
| #1168 | `[BO-SOURCING-COST-005]` répartition des frais fournisseurs réparée + prix de revient rendu affiché              |
| #1169 | `[BO-CONSULT-MULTI-001]` **le chantier consultations B1 → B5 (ci-dessous)**                                      |

### Le chantier consultations, en clair

Le lot du 13/09 (`BO-CONSULT-P9-001`) avait créé **deux tables, trois colonnes et tout un module de
calcul sans jamais les brancher**. Cette PR les a reliés aux écrans, dans cet ordre :

1. **La marge produit enfin un prix de vente.** L'adaptateur du calcul était recopié à l'identique
   dans **7 fichiers** et aucun ne passait les réglages. Module unique désormais :
   `packages/@verone/consultations/src/lib/consultation-economics-input.ts` (adaptateur,
   `computeItemsEconomics`, `withResolvedPrices`). Marge saisissable sur la consultation **et** sur
   chaque ligne. Une ligne dont le prix vient de la marge ne bloque plus le devis.
2. **La TVA n'est plus écrite en dur.** Elle l'était à 4 endroits (devis + commande) pendant que le
   PDF client lisait le vrai taux : les deux documents auraient divergé au premier taux ≠ 20.
   Résolution unique (`resolveConsultationTvaPercentage` / `...TaxRate`), taux modifiable.
3. **Frais par fournisseur et commande groupée.** Premier accès applicatif à
   `consultation_supplier_costs` (`useConsultationSupplierCosts`) : saisie port/douane/autres,
   répartition au prorata, alerte sur les frais non imputables, colonne « Revient » par ligne,
   tableau regroupé par fournisseur. **Commander crée une commande fournisseur PAR FOURNISSEUR**
   (avant : une fenêtre par produit) et marque les lignes commandées.
4. **Besoins du client et options.** Le statut `candidate` était un piège armé (il aurait compté dans
   le chiffre d'affaires et bloqué le devis) : neutralisé d'abord dans
   `consultation-line-status.ts`, puis exposé — besoins avec quantité et budget visé, options
   rattachées, dépassement de budget signalé.
5. **Les deux rapports.** Date de validité réelle sur la proposition. Rapport interne : ventilation
   par fournisseur, part des frais par ligne, repérage des options, écart au budget client
   (`tarif_maximum`, jusque-là inutilisé). Les frais atteignent maintenant le devis, la commande et
   les deux PDF — sinon un prix issu de la marge aurait été plus bas sur les documents que sur l'écran.

**45 tests unitaires** (32 sur le nouveau module, 13 sur l'absence de fuite de données internes dans
le PDF client). Aucune migration : tout existait déjà en base.

**Vérifié à l'écran**, sur la consultation réelle « Black & White Burger » : ligne sans prix + marge
40 % → 7,14 € (5,10 € de revient × 1,4) ; 20 € de port répartis 10/10 sur deux lignes de même
valeur ; rapport interne avec sa nouvelle section fournisseur. **Consultation remise exactement dans
son état d'origine, vérifié en base** (1 ligne, 0 frais, marge NULL, prix 15,00 €, statut approved).

### Revue d'écran du sourcing (16/09 au soir, 0 erreur console)

Liste et ses 5 onglets · vue Étapes (Recherche 4 / Contact 0 / Évaluation 0 / Négociation 2) · fiche
produit (blocages explicités, validation au catalogue bloquée **et motivée**, comparatif d'offres au
coût rendu) · page Échantillons · page Plugin · création rapide · liste et fiche consultations.

---

## CE QUI RESTE — par ordre de valeur

### 1. Sourcing A6 — le confort au quotidien (jamais commencé)

- Déplacer un produit d'une étape à l'autre **en le glissant à la souris** dans la vue Étapes.
  Aujourd'hui il faut ouvrir la fiche pour changer d'étape.
- Filtres « sans fournisseur » et « sans prix ».
- Pagination de la liste (6 produits aujourd'hui, donc pas urgent).

### 2. Sourcing A7 — ménage (à faire une semaine après la mise en ligne, soit après le 23/09)

2 pages orphelines, 13 fonctions SQL cassées, 2 tables vides. **Ne pas le faire avant** : on veut
d'abord voir tourner A1-A5 en vrai.

### 3. Décisions produit en attente de Roméo (aucune n'est technique)

- **Photos de consultation cassées** : les 2 consultations pointent vers des fichiers **absents du
  stockage Supabase** (400 renvoyé par Supabase lui-même, ce n'est pas un bug de code). Soit on
  retire la référence morte, soit Roméo réimporte les photos.
- **Remise globale et ventilation TVA par taux** sur la proposition client : demandent une colonne en
  base + une décision de Roméo. Non faits.
- **Effacer un prix de vente déjà saisi est impossible depuis l'écran** (un champ vide veut dire « ne
  pas toucher »). Gênant si un prix a été saisi par erreur.
- **`UNIQUE (consultation_id, product_id)`** empêche toujours qu'un même produit soit option de deux
  besoins. Choix assumé de Roméo le 16/09, à rouvrir avec de vrais cas en main.
- **Données de test** PRD-0314 / PO-2026-00039 (visibles dans la page Échantillons) : garder ou
  supprimer ?

### 4. Dettes techniques repérées, sans urgence

- `get_consultation_eligible_products` encore exécutable par `anon` et `PUBLIC` (hors règle R-GRANT).
- `use-consultation-detail.ts` charge **toutes** les consultations pour en afficher une seule.
- Liste des consultations sans pagination serveur.
- Code mort : `packages/@verone/products/src/components/wizards/consultation-manager/` (3 composants
  sans aucune référence dans le dépôt).
- Comparatif d'offres : la colonne « Coût rendu » affiche des euros même pour une offre libellée dans
  une autre monnaie (le refus `VO002` limite le danger).
- `useSampleDraftOrder` ne lit que la commande échantillon brouillon la plus récente.

---

## Règles de travail (rappel court)

- **Roméo n'est pas développeur.** Français simple, aucune commande shell dans les messages, rapports
  courts. **Mais il connaît « staging » et « main »** : employer ces deux mots tels quels, ne pas les
  traduire par « version d'équipe ».
- Il décide seulement sur : base de données, action irréversible, choix produit/business, argent.
  Tout le reste, l'agent tranche seul.
- **Aucune release, migration ou requête lourde entre 07 h et 17 h UTC** un jour ouvré (ADR-041).
- **Pas de fusion automatique** (dépôt privé sur GitHub Free) : vérifier les 4 contrôles requis à la
  main, fusionner en `--squash` vers staging **sans `--delete-branch`**.
- **Mise en ligne vers main** : un garde-fou local bloque toute commande contenant `--base main`.
  Passer par le workflow `auto-release-staging-to-main.yml` (`gh workflow run`), puis
  **fermer/rouvrir la PR** pour déclencher ses contrôles (sinon elle n'en a aucun), puis fusionner en
  merge commit.
- **Ne jamais lancer le serveur de développement** : Roméo le lance lui-même (port 3000).
- Toute donnée de test écrite est relevée avant, signalée, puis remise à l'identique et vérifiée.
