# Audit sourcing produits — back-office Vérone — 2026-09-12

Destinataires : Roméo et Cowork. Auteur : Claude Code, **lecture seule** (code du dépôt, base `aorroydfjsrygmosnzrl` en SELECT, recherche web).
Aucune écriture en base, aucune modification de code, aucun serveur lancé. Complète et vérifie
`docs/scratchpad/audit-2026-09-11/RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md` (appelé « rapport du 11/09 »), sans le recopier.

---

## 0. ÉTAT AU 13/09 SOIR (prévaut sur le reste du document pour l'avancement)

Le corps de l'audit (§ 1 à § 8) reste la photo du 12/09 et la référence du détail (`fichier:ligne`, SQL). Ce qui a
changé depuis :

**Fait**

| Phase     | Contenu                                                                                                                                                                                                                                                                                                                     | Où                                                       | État                                                                                                                                                                      |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3a       | B2 validation honnête · B4 une seule écriture · B5 fiche archivée lisible + « Restaurer » · B7 « Devis reçu » → `responded` · B14 lien fournisseur · B15 boucle suggestions · B24 textes                                                                                                                                    | PR #1143                                                 | **fusionnée dans staging** le 13/09 (`44b26614`) ; dans la release #1133                                                                                                  |
| P3b       | B1 : suppression d'un produit qui a servi **refusée par la base** (4 clés en RESTRICT) + boutons « Supprimer » remplacés                                                                                                                                                                                                    | migration `20260912050000` + PR #1144                    | **appliquée en production** le 12/09 ; PR **fusionnée dans staging** le 13/09 (`f33e797c`) ; dans la release #1133                                                        |
| P3        | Statuts sur-ensemble (+ `refused`, `validated`) · journal unique (`entry_type`, `from_status`, `to_status`) · fonction `apply_product_lifecycle_action` · **commande d'échantillon anti-doublon** `request_sample_order(p_product_id)` (D6, B3 côté base) · ancienne `request_sample_order` morte et ouverte à anon retirée | migrations `20260913190000` + `20260913190100`, PR #1150 | **appliquées en production** le 13/09 (« OK P3 ») ; PR #1150 ouverte, non fusionnée (contrôle FK drift rouge jusqu'à la fusion de #1149, puis mise à jour depuis staging) |
| Décisions | D1 = A · D2 = B · D3 = A · D4 = A · D5 = A · D6 = A · D7 = A · **D8 remplacée** par les grilles simplifiées                                                                                                                                                                                                                 | § 7, § Q4                                                | **toutes tranchées**                                                                                                                                                      |
| Grilles   | P4b produit : 3 critères + contrôle sécurité, moyenne simple · P14 fournisseur : 4 critères, délai calculé, moyenne 12 mois                                                                                                                                                                                                 | § Q4 (encadré)                                           | **actées le 13/09**, aucun code                                                                                                                                           |

**Défauts du § Q5 — état**

| État                                       | Défauts                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corrigés et fusionnés (P3a, P3b)           | B1, B2, B4, B5, B7, B14, B15, B24                                                                                                                             |
| Protégé en base, écran encore à faire (P4) | B3 (la base refuse un 2e échantillon ; le bouton actuel écrit encore directement et reste affiché)                                                            |
| Restent à faire                            | B6 (P7) · B8, B9, B10 (P4) · B11, B12 (P5) · B13, B18, B19 (P6) · B16 (P7/P8) · B17 (P4) · B20 (phase dédiée) · B21 (P4/P5) · B22 (P8) · B23 (P4b) · B25 (P6) |

**Reste à faire (ordre du programme)** : P4 fiche 4 étapes + pastille échantillon dérivée + bouton masqué (branché sur
les nouvelles fonctions) → P5 liste 4 colonnes → P4b grille produit simplifiée (**accord base**) → P7 règle « vendable »
(**accord**) → P8 Retirer / Restaurer avec motif → P6 contraction et ménage (**accord**, après mise en ligne P3-P5) →
B20 plateformes d'import. P14 notation fournisseur après P9-P12.

**À savoir** : la release #1133 (staging → main, avec P3a et P3b) attend la fusion de Roméo. Hors sourcing, le même
soir : fuite de 3 vues finance corrigée en urgence (PR #1148) et P9 consultation projet appliquée (PR #1149, 4 contrôles
requis verts). Détail : `~/Documents/Workspace/verone/_inbox/2026-09-13-compte-rendu-release-p9-p3.md`.

---

## 1. Résumé en 10 lignes

1. **Ce qu'on a** : une liste sourcing (3 vues, 4 compteurs, 5 filtres), une fiche en 3 onglets, un plugin Chrome qui fonctionne, un carnet (liens, fournisseurs candidats, prix, échanges) et un bouton « Commander échantillon » qui crée une vraie commande fournisseur de type échantillon.
2. **Données réelles quasi nulles** : 4 produits en sourcing, 0 commande échantillon, 0 échange, 0 prix négocié, 0 photo, 4 fournisseurs candidats (tous créés automatiquement par le plugin). Une refonte ne met presque rien en jeu.
3. **Ce qui ne va pas** : l'avancement est affiché 4 fois avec 2 systèmes de statut différents ; les statuts « échantillon » sont posés à la main sans aucune commande derrière (5 produits sur 7 concernés) ; rien ne relie la commande échantillon au produit.
4. Supprimer un produit **efface sans prévenir** ses lignes de consultation, de commandes fournisseurs/clients et ses mouvements de stock (règle de suppression en cascade dans la base).
5. Un produit sourcing archivé **ne s'ouvre plus** (« non trouvé ») et **ne peut pas être restauré** : la seule action proposée est « Supprimer », sans confirmation.
6. « Commander échantillon » reste proposé après commande : un 2e clic ajoute une 2e ligne identique.
7. Enregistrer une section de la fiche **écrit deux fois** en base, affiche 2 messages et recharge 2 fois la liste complète.
8. **Aucune notation qualité** d'un produit n'existe (seulement une note fournisseur sur 5, remplie pour 3 fournisseurs sur 20).
9. **5 priorités** : (a) interdire la suppression d'un produit qui a un historique, (b) corriger les 6 défauts rapides de la fiche (validation, double écriture, archivés, lien fournisseur, « Devis reçu », boucle suggestions), (c) échantillon suivi automatiquement + bouton masqué une fois commandé, (d) grille d'évaluation notée (offre puis échantillon), (e) Retirer / Restaurer avec motif sans casser les consultations.
10. 8 décisions fermées à prendre (§ 7) ; 4 phases touchent la base et attendent l'accord écrit de Roméo.

---

## 2. État actuel mesuré

### 2.1 Écrans

| Écran          | Adresse                              | Accès                                                                                 | Constat                                                   |
| -------------- | ------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Liste sourcing | `/produits/sourcing`                 | menu « Sourcing » (`sidebar-nav-items.ts:127-129`)                                    | onglets Produits / Archivés, vues Liste / Kanban / Cartes |
| Fiche sourcing | `/produits/sourcing/produits/[id]`   | depuis la liste, le plugin                                                            | barre 10 étapes + guide + 3 onglets                       |
| Création       | `/produits/sourcing/produits/create` | **aucun lien** (0 référence dans le code)                                             | doublon de la fenêtre « Nouveau Sourcing »                |
| Échantillons   | `/produits/sourcing/echantillons`    | **hors menu** ; seules 2 notifications y mènent (`notification-templates.ts:469,498`) | crée des commandes sans type échantillon                  |
| Plugin         | `/produits/sourcing/plugin`          | bouton « Plugin navigateur »                                                          | guide d'installation, sain                                |

### 2.2 Parcours réel mesuré dans le code

1. **Entrée** : plugin → `sourcing_status='supplier_search'`, `product_status='draft'` (`api/sourcing/import/route.ts:407-433`) ; fenêtre « Nouveau Sourcing » → statut sourcing laissé au défaut base `need_identified` (`use-sourcing-create-update.ts:47-69`).
2. **Avancement** : clic libre sur la barre 10 étapes, sans ordre ni journal (`page.tsx:280-295` → `use-sourcing-notebook.ts:270-287`).
3. **Échantillon** : commande fournisseur `po_type='sample'` + statut sourcing → `sample_requested` (`use-sourcing-sample-order.ts:108-300`). Ensuite plus rien n'est mis à jour.
4. **Validation** : `product_status='active'`, `creation_mode='complete'` + colonnes de stock (`use-sourcing-mutations.ts:58-66`) ; le statut sourcing reste figé (2 produits catalogue actifs sont encore « Échantillon demandé »).
5. **Abandon** : « Annuler » (statut `cancelled`, produit toujours dans la liste active) ou « Archiver » (date d'archivage seule) puis « Supprimer » définitif.

### 2.3 Volumes (SQL en annexe)

| Donnée                                                                                            | Volume                                                                                                  |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Produits (total)                                                                                  | 236                                                                                                     |
| … en mode sourcing                                                                                | 4 : 3 brouillons (`need_identified`, `sample_requested`, `order_placed`) + 1 précommande `received`     |
| … au catalogue avec un statut sourcing « échantillon »                                            | 3 (2 actifs + 1 copie archivée)                                                                         |
| … au catalogue avec le statut par défaut `need_identified`                                        | 229 sur 232                                                                                             |
| Commandes fournisseurs échantillon (`po_type='sample'`)                                           | **0** (24 commandes, toutes standard reçues)                                                            |
| Lignes de commande avec type d'échantillon                                                        | 0 sur 194                                                                                               |
| `sample_orders` / `sample_order_items`                                                            | 0 / 0                                                                                                   |
| `sourcing_urls` / `sourcing_candidate_suppliers`                                                  | 4 / 4 (tous « identifié », créés par le plugin)                                                         |
| `sourcing_communications` / `sourcing_price_history` / `sourcing_photos`                          | 0 / 0 / 0                                                                                               |
| `target_price`, `sourcing_notes`, `sourcing_tags`, `rejection_reason`, `products.consultation_id` | 0 produit renseigné pour chacun                                                                         |
| Consultations                                                                                     | 6 (toutes « en attente »), 6 lignes ; 1 ligne porte un produit sourcing brouillon (« Plateaux Pokawa ») |
| Produits sourcing déjà activés sur LinkMe                                                         | 1 (« Plateaux Pokawa », brouillon, `channel_pricing.is_active=true`)                                    |
| Fournisseurs notés (`organisations.rating`)                                                       | 3 sur 20                                                                                                |

**Statuts sans preuve** : « Table basse … TEST » (`sample_requested`, aucun fournisseur), « Monture de lunettes » (`order_placed`), « Feuille LED » (`received`, précommande), « Banc » et « Sac de voyage » (`sample_requested`) : **0 ligne de commande fournisseur** pour chacun.

---

## 3. Réponses aux 5 questions de Roméo

### Q1 — Onglets et sections inutiles

**Liste `/produits/sourcing`**

| Élément                                           | Ce qu'il affiche                                           | Données réelles                                         | Verdict                                                        |
| ------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| Onglet « Produits » (`page.tsx:231-234`)          | produits sourcing non archivés                             | 4                                                       | **Garder** (devient le kanban 4 étapes)                        |
| Onglet « Archivés » (`page.tsx:235-238`)          | produits sourcing archivés                                 | 0 ; « Voir » ouvre « non trouvé », pas de « Restaurer » | **Fusionner** en filtres Pause / Refusés / Validés             |
| 4 compteurs (`SourcingKpiCards.tsx`)              | Brouillons, En validation, Échantillons, Complétés ce mois | calculs faux (Q5 B11)                                   | **Supprimer**, remplacer par les nombres par colonne du kanban |
| Vue Liste (`SourcingProductList.tsx`)             | tableau 7 colonnes                                         | 4                                                       | **Garder**                                                     |
| Vue Kanban (`SourcingKanbanView.tsx:9-58`)        | 8 colonnes + « Autre »                                     | 2 colonnes utilisées sur 9                              | **Garder réduite à 4 colonnes**                                |
| Vue Cartes (`SourcingCardView.tsx`)               | grandes photos                                             | mêmes 4                                                 | **Supprimer** (doublon)                                        |
| Filtre « Statut » (`SourcingFilters.tsx:118-128`) | statut catalogue (brouillon / précommande / actif)         | trompeur (« Échantillon » = précommande)                | **Supprimer**                                                  |
| Filtre « Pipeline » (`SourcingFilters.tsx:16-31`) | 13 statuts dont 1 refusé par la base                       | —                                                       | **Remplacer** par les 4 étapes + Pause / Refusé / Validé       |
| Filtres Type, Priorité, Fournisseur               | client/interne, priorité, fournisseur                      | priorité « moyenne » partout                            | **Garder**                                                     |

**Fiche `/produits/sourcing/produits/[id]`**

| Élément                                                                                               | Ce qu'il affiche                             | Données réelles                                              | Verdict                                                         |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| Barre 10 étapes + Pause / Annuler (`SourcingPipelineBar.tsx:5-22`)                                    | avancement cliquable                         | statuts posés à la main, sans preuve                         | **Supprimer** → 4 étapes                                        |
| Guide de l'étape (`SourcingStageGuide.tsx:28-197`)                                                    | conseils, sans accents                       | texte fixe                                                   | **Supprimer**                                                   |
| 3 onglets auto-choisis (`page.tsx:315-342`)                                                           | découpe en 3                                 | onglet initial faux (`page.tsx:115-119`)                     | **Supprimer** : une page à sections                             |
| Onglet 1 — Tarification / Fournisseur / Détails / Notes (`SourcingProductEditCard/index.tsx:272-377`) | fiche produit                                | 4 produits                                                   | **Garder** (section « Fiche produit »)                          |
| Onglet 1 — Liens (`SourcingUrls`)                                                                     | URLs sources                                 | 4                                                            | **Garder**, dans « Fiche produit »                              |
| Onglet 1 — Consultations + encadré « Workflow » (`SourcingConsultationsSection.tsx:56-157`)           | consultations liées + suggestions            | 1 lien ; encadré au texte faux (« Demander un échantillon ») | **Garder** la liste, **supprimer** l'encadré                    |
| Onglet 2 — Fournisseurs candidats (`SourcingCandidateSuppliers.tsx`)                                  | offres prix / MOQ / délai                    | 4, tous « identifié »                                        | **Garder** → comparatif d'offres + note d'offre                 |
| Onglet 2 — Historique prix (`SourcingPriceHistory.tsx`)                                               | prix proposés, devise USD par défaut (`:33`) | 0                                                            | **Fusionner** dans le comparatif d'offres                       |
| Onglet 2 — Communications (`SourcingCommunications.tsx`)                                              | échanges + relances                          | 0                                                            | **Garder** → « Journal »                                        |
| Onglet 3 — 2 cartes « Commander échantillon » / « Valider » (`page.tsx:421-518`)                      | actions                                      | 0 commande                                                   | **Remplacer** par une barre d'actions unique                    |
| Photos sourcing (`use-sourcing-notebook.ts:125-131`)                                                  | chargées, **jamais affichées ni ajoutables** | 0                                                            | **Réutiliser** pour les photos d'échantillon et de défauts (Q4) |

**Pages cachées** : « Création » (184 lignes, 0 lien) → **supprimer** ; « Échantillons » (1 715 lignes) → **supprimer** au ménage P6 ; « Plugin » → **garder**.

### Q2 — Commander un échantillon

**Aujourd'hui, de bout en bout**

1. Bouton « Commander échantillon », onglet 3 (`page.tsx:452-468`), désactivé **seulement** si aucun fournisseur.
2. Le hook relit le produit, exige fournisseur et prix d'achat (`use-sourcing-sample-order.ts:56-97`).
3. Il cherche une commande fournisseur **brouillon de type échantillon** du même fournisseur (`:108-117`) :
   - trouvée → ajoute une ligne quantité 1 (`:140-155`) puis recalcule le total dans le navigateur avec **TVA 20 % en dur** (`:160-184`) ;
   - sinon → crée la commande (`generate_po_number`, `po_type='sample'`, `:193-223`) et sa ligne (`:244-259`).
4. Ligne marquée `sample_type` interne/client et note « Échantillon pour validation » (`:149-154`).
5. Statut sourcing → `sample_requested` si le produit était avant (`:277-300`).
6. **Deux messages** : celui du hook (`:186` ou `:263`) et celui de la page (`page.tsx:125-128`).
7. La commande suit ensuite le circuit normal (validation → réception) : la réception ajoute l'unité au stock et met à jour le prix moyen d'achat (déclencheurs protégés, non touchés). **Le produit n'en est jamais informé.**

**Le bouton reste-t-il proposé ?** Oui. Aucune vérification d'une commande existante, et aucune règle d'unicité en base sur (commande, produit) : seule la clé primaire existe sur `purchase_order_items`. Un 2e clic ajoute une **2e ligne identique** dans la même commande brouillon ; si la 1re commande est déjà validée, une **2e commande** est créée.

**Comment le suivi est calculé** : nulle part sur la fiche. Une vue base `customer_samples_view` calcule déjà un état dérivé (brouillon → à envoyer, validée → commandé, partiellement reçue / reçue → reçu, annulée ou ligne archivée → archivé), mais elle n'est lue que par la page cachée « Échantillons », et ne filtre pas le type de commande.

**Ce qu'il faut pour « commandé une fois = plus proposé »** (décision Roméo : suivi automatique depuis la commande fournisseur)

1. Fonction pure (TypeScript) `deriveSampleState(lignes)` sur `purchase_order_items ⋈ purchase_orders (po_type='sample')`, lignes non archivées, **même logique que `customer_samples_view`** : aucun · à envoyer · commandé · reçu · annulé. Aucun déclencheur.
2. Fiche : pastille échantillon dérivée ; bouton « Commander échantillon » **masqué** si l'état est à envoyer / commandé / reçu, remplacé par « Voir la commande PO-xxxx » ; « Recommander » visible seulement si toutes les commandes échantillon sont annulées.
3. Garde côté serveur (accord base) : commande d'échantillon via une fonction SQL avec verrou sur le produit, qui refuse s'il existe déjà une ligne échantillon active ; `REVOKE EXECUTE … FROM PUBLIC, anon`.
4. Ne plus écrire `sample_requested` ni recalculer le total dans le navigateur : un déclencheur de recalcul existe déjà (`recalculate_purchase_order_totals_trigger` sur `purchase_order_items`, hors liste protégée — à vérifier par test avant retrait).
5. À « reçu » : mettre en avant « Évaluer l'échantillon » puis « Valider au catalogue » / « Refuser » (§ 5).

### Q3 — Retirer un produit sans casser la consultation

**Aujourd'hui**

| Action                                    | Effet mesuré                                                                                                                                                                                                                                                                     | Preuve                                                                                           |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Supprimer** (catalogue)                 | simple fenêtre de confirmation du navigateur, puis suppression                                                                                                                                                                                                                   | `use-catalogue-page.ts:459-471` → `use-products.ts:316-318`                                      |
| **Supprimer** (sourcing, produit archivé) | **sans confirmation**                                                                                                                                                                                                                                                            | `SourcingProductRow.tsx:176` → `use-sourcing-mutations.ts:260-316`                               |
| Effet base d'une suppression              | **efface en cascade** : lignes de consultation, lignes de commandes fournisseurs **et clients**, mouvements de stock, prix canaux, sélections LinkMe, liens sourcing ; lignes de facture → produit vidé (SET NULL) ; bloquée seulement si une réception ou une expédition existe | SQL « règles de suppression » (annexe)                                                           |
| **Archiver** (catalogue)                  | statut « arrêté » + date d'archivage                                                                                                                                                                                                                                             | `use-catalogue-mutations.ts:48-64`                                                               |
| Désarchiver (catalogue)                   | date effacée, **statut reste « arrêté »**                                                                                                                                                                                                                                        | `use-catalogue-mutations.ts:66-79`                                                               |
| **Archiver** (sourcing)                   | date seule, sans motif                                                                                                                                                                                                                                                           | `use-sourcing-mutations.ts:226-257`                                                              |
| Restaurer (sourcing)                      | **inexistant** ; fiche archivée = « non trouvé »                                                                                                                                                                                                                                 | `SourcingProductRow.tsx:170-180`, `page.tsx:81-92`, `use-sourcing-fetch.ts:84-89`                |
| Consultation d'un produit archivé         | ligne toujours chargée, affichée, dans les 2 PDF et **commandable**, sans aucun signe                                                                                                                                                                                            | `use-consultation-items.ts:30-64` (ni date d'archivage lue, ni filtre)                           |
| Ajouter à une consultation                | la route accepte n'importe quel produit (brouillon, archivé) ; la liste de choix n'accepte que les produits actifs                                                                                                                                                               | `api/consultations/associations/route.ts:67-79` vs fonction `get_consultation_eligible_products` |

Risque réel aujourd'hui : 1 ligne de consultation (« Plateaux Pokawa ») disparaîtrait si ce produit sourcing était archivé puis supprimé ; 0 ligne sur produit archivé.

**Ce qu'il faut pour « Retirer avec motif, restaurable »**

1. **Interdire la suppression** d'un produit qui a un historique : règle de suppression `consultation_products.product_id` (et lignes de commandes) passée de CASCADE à RESTRICT → la base refuse (accord Roméo, migration dédiée) ; retirer les boutons « Supprimer » des deux listes.
2. « Retirer » = date d'archivage + entrée de journal avec motif obligatoire, statut et canaux conservés (§ 8.2 du rapport du 11/09, confirmé).
3. « Restaurer » disponible dans la liste sourcing et le catalogue ; fiche d'un produit retiré **lisible** (charger le produit par identifiant, pas via la liste active).
4. Consultation : lire la date d'archivage des produits ; badge « Retiré du catalogue » ; ligne exclue de « Commander » et du PDF client (décision D5) ; historique intact.

### Q4 — Mesurer la qualité d'un produit sur plusieurs critères

**Existant** : aucune notation de produit.

- Étape « Évaluation » = texte du guide uniquement (`SourcingStageGuide.tsx:71-84`) et comparatif des fournisseurs candidats (prix, MOQ, délai).
- `organisations.rating` (note fournisseur sur 5, écran `PerformanceEditSection.tsx:123-183`) : 3 fournisseurs sur 20 ; `supplier_reliability_score` recopié d'Alibaba par le plugin (`import/route.ts:310,354-357`) : 5 sur 20.
- `product_reviews` = avis clients du site (0 ligne), hors sujet.
- `sourcing_photos.photo_type` prévoit déjà `sample_received` et `sample_defect` (0 ligne, aucun écran).
- Statuts candidats `responded` / `shortlisted` prévus en base, jamais utilisés.

**Pratique professionnelle 2026 (recherche web)**

- Grille pondérée de **4 à 7 critères**, poids par pas de 5 %, note sur une échelle courte, révisée périodiquement ; éviter trop de critères subjectifs (SupplyAutomate, Ramp, AuraVMS).
- Qualité 20-40 %, coût 25 %, délai tenu 25 %, communication 10 % sont les poids types d'une grille fournisseur (SupplyAutomate, Precoro).
- Pour le mobilier et la déco, l'**approbation d'échantillon** vérifie : dimensions, matériaux, finitions (teinte, brillance, texture), quincaillerie et mécanismes, fonction (stabilité), **emballage** ; résultat noté conforme / non conforme / à revoir, photos à l'appui, un « échantillon de référence » gardé, **un seul décideur** côté acheteur (Minden Sourcing, QCAdvisor, ProQC).
- Critères éliminatoires : non-conformité sécurité ou étiquetage bloque, quel que soit le score (pratique d'inspection, ProQC / TestCoo).

> **REMPLACÉ LE 13/09 — décision Roméo** : la grille ci-dessous (7 critères pondérés, score /100) et la grille
> fournisseur à 5 critères du complément du 11/09 sont **abandonnées** au profit de deux grilles simples :
>
> - **P4b grille PRODUIT**, remplie **une fois, à réception de l'échantillon** : `score_conformity`,
>   `score_build_finish`, `score_packaging` (SMALLINT 1-5, NULL = non noté) + `safety_check` (`ok` | `ko` |
>   `to_check` ; `ko` ⇒ « Refuser » proposé). Score = **moyenne simple** des critères notés ; suggestion
>   ≥ 4 « Valider », 3 à 3,9 « À revoir », < 3 « Refuser ». **Roméo décide.**
> - **P14 grille FOURNISSEUR** par événement (réception / option acceptée / échantillon) : `score_quality`,
>   `score_delay` (**calculé** : ≤ 0 j de retard = 5 ; 1-3 j = 4 ; 4-7 j = 3 ; 8-14 j = 2 ; > 14 j = 1),
>   `score_communication`, `score_pricing` ; commentaire obligatoire dès qu'une note ≤ 2 ; note fournisseur =
>   moyenne glissante sur 12 mois ; `organisations.rating` calculé.
>   Le texte qui suit reste pour l'historique (recherche, modélisation) ; il ne fait plus foi pour les critères.

**Modèle proposé pour Vérone (simple)** — _historique, remplacé le 13/09 (voir encadré ci-dessus)_

Une seule grille, remplie à 2 moments (décision D2) : **offre** (à distance, à l'étape Évaluation) et **échantillon** (à réception). Note 1 à 5 par critère, critère non noté = ignoré et poids redistribué.

| #   | Critère                                                                                                  | Poids | Offre  | Échantillon |
| --- | -------------------------------------------------------------------------------------------------------- | ----- | ------ | ----------- |
| 1   | Fabrication et solidité                                                                                  | 20    | —      | ✓           |
| 2   | Finitions et aspect (teinte, texture, défauts)                                                           | 20    | photos | ✓           |
| 3   | Conformité à l'annonce (dimensions, matière, couleur) — **éliminatoire si 1**                            | 15    | fiche  | ✓           |
| 4   | Style Vérone / potentiel de vente                                                                        | 15    | ✓      | ✓           |
| 5   | Emballage et état à l'arrivée                                                                            | 10    | —      | ✓           |
| 6   | Prix de revient et marge possible                                                                        | 10    | ✓      | ✓           |
| 7   | Fournisseur : réactivité, délai tenu                                                                     | 10    | ✓      | ✓           |
| —   | Sécurité / normes / étiquetage : conforme · non conforme · à vérifier — **non conforme ⇒ refus proposé** | —     | ✓      | ✓           |

Score /100 = Σ (note/5 × poids) sur les critères notés. Proposition affichée : ≥ 70 « Valider », 50-69 « À revoir / négocier », < 50 ou éliminatoire « Refuser ». **Roméo décide toujours** (D4).

**Modélisation (règles `database-modeling-patterns.md`)** — les 4 questions pour une table dédiée :

1. Mêmes attributs qu'une entité existante ? Non : ni `products` (plusieurs évaluations par produit, par fournisseur, par moment), ni `sourcing_communications` (notes, verdict, contrôle sécurité).
2. Même traitement métier ? Non : ni message, ni commande.
3. Jointure courante ? Oui, avec le journal (frise de la fiche).
4. Perçu comme la même famille ? En partie (« journal »).
   ⇒ 1,5 oui sur 4 : **table dédiée justifiée**, avec un discriminant `stage` pour les 2 moments (pas 2 tables).

```
product_evaluations(
  id uuid PK, product_id uuid FK products ON DELETE RESTRICT, supplier_id uuid FK organisations,
  purchase_order_item_id uuid NULL FK purchase_order_items ON DELETE SET NULL,   -- échantillon évalué
  stage TEXT NOT NULL CHECK (stage IN ('offer','sample')),
  grid_version TEXT NOT NULL,                                                   -- poids en code, versionnés
  score_build, score_finish, score_conformity, score_style, score_packaging, score_price, score_supplier
    SMALLINT NULL CHECK (… BETWEEN 1 AND 5),
  safety_check TEXT NOT NULL DEFAULT 'to_check' CHECK (safety_check IN ('ok','ko','to_check')),
  total_score NUMERIC(5,2) NULL CHECK (total_score BETWEEN 0 AND 100),
  suggested_verdict TEXT NULL CHECK (suggested_verdict IN ('validate','review','refuse')),
  notes TEXT, evaluated_by uuid DEFAULT auth.uid(), evaluated_at timestamptz DEFAULT now())
-- RLS : is_backoffice_user() seulement ; photos → sourcing_photos (sample_received / sample_defect) ;
-- une entrée de journal « Évaluation » pointe vers la ligne.
```

- **Colonnes par critère plutôt qu'un bloc JSON** (D3) : la base contrôle chaque note (1-5), tri et moyennes simples ; ajouter un critère = une colonne nullable, instantané. La recherche confirme que les colonnes typées gardent l'intégrité que le JSON perd. Alternative si Roméo veut modifier les critères sans migration : `scores JSONB NOT NULL CHECK (jsonb_typeof(scores)='object')` + schéma Zod par `grid_version`.
- Statuts en TEXT + CHECK, jamais ENUM ; nouvelle fonction SQL éventuelle terminée par `REVOKE EXECUTE … FROM PUBLIC, anon`.

### Q5 — Tout ce qui ne marche pas

Gravité : **Haute** = perte de données ou action trompeuse ; **Moyenne** = résultat faux ou friction réelle ; **Faible** = cosmétique.

| #   | Gravité | Constat                                                                                                                                                                                                                                 | Preuve                                                                                                                                              |
| --- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| B1  | Haute   | Supprimer un produit efface en cascade consultations, lignes de commandes fournisseurs **et clients**, mouvements de stock                                                                                                              | SQL règles de suppression ; `use-catalogue-page.ts:459-471`, `use-sourcing-mutations.ts:260-316`                                                    |
| B2  | Haute   | « Valider » affiche « Sourcing validé » et quitte la page même quand la validation est refusée (prix ou fournisseur manquant)                                                                                                           | `page.tsx:175-183` ; le hook renvoie `false` sans erreur (`use-sourcing-mutations.ts:26-54`)                                                        |
| B3  | Haute   | Double commande d'échantillon possible (bouton toujours actif, aucune unicité)                                                                                                                                                          | `page.tsx:452-468`, `use-sourcing-sample-order.ts:108-157` ; SQL index uniques                                                                      |
| B4  | Haute   | Enregistrer une section de la fiche : 2 écritures en base, 2 messages, 2 rechargements de toute la liste                                                                                                                                | `use-inline-edit.ts:241-244` puis `:436` → `SourcingProductEditCard/index.tsx:51-53` → `page.tsx:355-363` → `use-sourcing-create-update.ts:227-246` |
| B5  | Haute   | Produit sourcing archivé : fiche « non trouvé », aucun « Restaurer », seule action « Supprimer » sans confirmation                                                                                                                      | `page.tsx:81-92`, `use-sourcing-fetch.ts:84-89`, `SourcingProductRow.tsx:170-180`                                                                   |
| B6  | Haute   | Produit sourcing brouillon pour un client activé sur LinkMe **dès sa création** (mesuré : « Plateaux Pokawa »)                                                                                                                          | déclencheur `trigger_auto_add_sourcing_to_linkme` ; SQL `channel_pricing`                                                                           |
| B7  | Moyenne | « Devis reçu » écrit `quoted`, refusé par la base ; « meilleur prix » et « devis reçus » ne peuvent donc jamais s'afficher                                                                                                              | `SourcingCandidateSuppliers.tsx:387-393`, `:116-125` ; CHECK `sourcing_candidate_suppliers_status_check`                                            |
| B8  | Moyenne | `sample_rejected` proposé mais refusé par la base ; `archived` accepté par la base mais jamais proposé                                                                                                                                  | `SourcingPipelineBar.tsx:19`, `SourcingFilters.tsx:26`, `SourcingCardView.tsx:30` ; CHECK `products_sourcing_status_check`                          |
| B9  | Moyenne | « Annuler » laisse le produit dans la liste active (le guide annonce l'inverse) ; « Reprendre » renvoie à l'étape 1                                                                                                                     | `SourcingPipelineBar.tsx:123-137` vs `SourcingStageGuide.tsx:183-191`                                                                               |
| B10 | Moyenne | Onglet initial calculé avant le chargement, donc toujours « Sourcing »                                                                                                                                                                  | `page.tsx:111-119`                                                                                                                                  |
| B11 | Moyenne | Compteurs faux : « En validation » / « Échantillons » lisent précommande et `requires_sample`, jamais écrits par le flux ; « Complétés ce mois » compte tout produit catalogue créé ce mois                                             | `page.tsx:84-90`, `:152-164`                                                                                                                        |
| B12 | Moyenne | Colonne « Statut » : « Échantillon commandé » = précommande, alors que commander un échantillon n'écrit jamais précommande                                                                                                              | `sourcing-page.helpers.tsx:30-35`                                                                                                                   |
| B13 | Moyenne | 5 produits portent un statut échantillon / commande sans aucune ligne de commande                                                                                                                                                       | SQL produits sourcing (annexe)                                                                                                                      |
| B14 | Moyenne | Lien fournisseur `/organisations/<id>` inexistant (404) : « Voir fournisseur » de la liste et lien de résultat du plugin après import fournisseur                                                                                       | `page.tsx:279,337` ; `import-supplier/route.ts:236` lu par `popup.js:618` ; aucune route ni redirection                                             |
| B15 | Moyenne | Suggestions de consultations rechargées en boucle, filtrées sur une liste périmée                                                                                                                                                       | `ConsultationSuggestions.tsx:41-85` (dépendance `consultations`)                                                                                    |
| B16 | Moyenne | Ajout à une consultation sans contrôle d'état ; la liste de choix exige « actif » : deux règles                                                                                                                                         | `associations/route.ts:67-79` ; `get_consultation_eligible_products`                                                                                |
| B17 | Moyenne | Total de commande échantillon recalculé dans le navigateur, TVA 20 % en dur, alors qu'un déclencheur recalcule déjà                                                                                                                     | `use-sourcing-sample-order.ts:159-184,198-199`                                                                                                      |
| B18 | Moyenne | Page « Échantillons » : commandes sans type échantillon, numéro `SAMPLE-<horodatage>` hors séquence, réinsertion dans une commande brouillon **standard**                                                                               | `use-echantillons.ts:81-91` ; `use-customer-samples.ts:265-272`                                                                                     |
| B19 | Moyenne | Le tableau de bord lit `sample_orders` (table morte, vide) à chaque chargement                                                                                                                                                          | `dashboard-notifications.fetchers-activity.ts:196-221`, `use-dashboard-notifications.ts:102`                                                        |
| B20 | Moyenne | Import : plateformes `zentrada`, `faire`, `ankorstore` acceptées par la validation mais refusées par la base sur `sourcing_urls` → lien source perdu en silence (le plugin n'envoie aujourd'hui qu'`alibaba` / `other` : risque latent) | `import/route.ts:124-126`, `:453-465` ; CHECK `sourcing_urls_platform_check` ; `content-script.js:14,250`                                           |
| B21 | Moyenne | La fiche charge toute la liste sourcing avec images pour afficher 1 produit ; le formulaire rapide aussi                                                                                                                                | `page.tsx:81-92`, `SourcingQuickForm/hooks.ts:17`                                                                                                   |
| B22 | Moyenne | Désarchiver au catalogue laisse « arrêté » ; hook mort qui écrit des colonnes inexistantes (`status`, `archived_reason`)                                                                                                                | `use-catalogue-mutations.ts:66-79` ; `use-archived-products.ts:158-168` ; SQL colonnes                                                              |
| B23 | Faible  | Photos sourcing chargées, jamais affichées                                                                                                                                                                                              | `use-sourcing-notebook.ts:125-131`                                                                                                                  |
| B24 | Faible  | Textes : encadré « Demander un échantillon » (bouton réel : « Commander échantillon ») ; guide et candidats sans accents ; historique prix en USD par défaut ; prix de vente estimé à 50 % de marge en dur                              | `SourcingConsultationsSection.tsx:152-155`, `SourcingStageGuide.tsx:30-196`, `SourcingPriceHistory.tsx:33`, `use-sourcing-fetch.ts:149-151`         |
| B25 | Faible  | Dupliquer un produit recopie son statut sourcing (copie archivée « Sac de voyage » en `sample_requested`)                                                                                                                               | SQL produits                                                                                                                                        |

**Code mort (≈ 4 000 lignes)**

| Élément                                                                                                                    | Lignes | Preuve                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page « Échantillons » (`produits/sourcing/echantillons/`)                                                                  | 1 715  | hors menu                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Validation échantillons `packages/@verone/ui-business/src/components/validation/` (lit `sample_orders` / `product_drafts`) | 1 171  | seul export via index, 0 import                                                                                                                                                                                                                                                                                                                                                                                                          |
| Page « Création » sourcing                                                                                                 | 184    | 0 lien                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `use-archived-products.ts`                                                                                                 | 249    | 0 import                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `ProductConsultationManager.tsx`                                                                                           | 389    | exporté, 0 import                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `SourcingProductModal.tsx` + `edit-sourcing-product-modal.tsx`                                                             | 126    | 0 import de la réexportation                                                                                                                                                                                                                                                                                                                                                                                                             |
| `getSectionsForStatus`                                                                                                     | ≈ 95   | `SourcingStageGuide.tsx:247-342`, 0 appel                                                                                                                                                                                                                                                                                                                                                                                                |
| `approveSample`, `rejectSample`, `_hasProductBeenOrdered`                                                                  | ≈ 155  | `use-sourcing-mutations.ts:95-223`, `use-sourcing-sample-order.ts:26-50`                                                                                                                                                                                                                                                                                                                                                                 |
| Fonctions SQL sans appel dans le code                                                                                      | 13     | `approve_sample_request`, `create_sample_order`, `mark_sample_delivered`, `mark_sample_ordered`, `request_sample_order`, `validate_sample`, `validate_sourcing_draft` (×2), `finalize_sourcing_to_catalog`, `mark_sample_required`, `get_sample_statistics`, `cleanup_old_product_drafts`, `update_product_drafts_updated_at` — plusieurs exécutables par `anon` : **déjà traité par la session sécurité S1 en cours, ne pas dupliquer** |

---

## 4. Écarts avec le rapport du 11/09

### Confirmé (vérifié dans le code ou la base)

- Volumes § 2.1 : 4 produits sourcing, 0 commande échantillon, tables échantillons vides, 0 échange, 4 candidats, 4 liens, 0 photo.
- § 2.3 : avancement affiché plusieurs fois (barre, guide, onglets, kanban) ; onglet auto faux ; pas de « Refuser » ; archiver sans motif ; supprimer sans confirmation ; « Valider » annonce un succès en échec ; valeurs `quoted` et `sample_rejected` refusées ; double commande et double message ; page Échantillons sans type ; statut liste ≠ statut fiche.
- § 3 : suggestions de consultations en boucle ; produits sourcing exclus de la liste de choix des consultations.
- § 4.2 : déclencheur d'ajout automatique à LinkMe (1 cas réel mesuré).
- § 5 contrat du plugin : champs écrits, réponses 200 / 409, `sourcing_status='supplier_search'`, `1688` et AliExpress absents de la validation.
- § 8.1 : état échantillon dérivé sans déclencheur — compatible, et la vue `customer_samples_view` contient déjà cette logique.

### Précisé ou infirmé

- « 227 produits du catalogue en `need_identified` » → **229 sur 232** aujourd'hui.
- « 2 produits du catalogue en `sample_requested` » → **3** (2 actifs + 1 copie archivée).
- « Après validation, historique inaccessible » → **plus large** : tout produit sourcing archivé est aussi inaccessible, et **non restaurable** (B5).
- « 8 fonctions SQL mortes » → **13** sans aucun appel dans le code.
- « ~1 700 lignes de code échantillon mort » → **≈ 2 900** (page 1 715 + composants de validation 1 171), ≈ 4 000 avec le reste du sourcing mort.
- « Données incohérentes (draft, order_placed), (preorder, received) » → confirmé, et **aucune ligne de commande** derrière ces statuts (B13).

### Nouveau (absent du rapport du 11/09)

- B1 suppression en cascade des consultations et commandes ; B4 double écriture ; B11 compteurs faux ; B14 lien fournisseur 404 (touche aussi le lien de résultat du plugin, sans casser le contrat d'import) ; B17 total et TVA recalculés dans le navigateur ; B19 tableau de bord sur table morte ; B20 plateformes refusées par `sourcing_urls` ; B21 chargement de toute la liste pour 1 fiche ; B22 désarchivage incomplet ; B23 photos invisibles.
- Aucune règle d'unicité (commande, produit) sur les lignes de commande fournisseur.
- Aucune notation qualité produit (Q4).

---

## 5. Parcours cible

Compatible avec les décisions du 11/09 (§ 7) et le plugin (codes de statut existants conservés).

| Étape                                 | Code base                                | Ce que fait Roméo                                                                                | Écran                    |
| ------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------ |
| 1. Recherche                          | `supplier_search`                        | import plugin ou création ; fiche, liens, fournisseurs candidats                                 | en-tête 4 étapes         |
| 2. Contact                            | `initial_contact`                        | échanges et relances dans le journal                                                             | journal                  |
| 3. Évaluation notée                   | `evaluation`                             | comparatif des offres (prix, MOQ, délai) + **grille « offre »** ; score indicatif                | comparatif + grille      |
| 4. Négociation                        | `negotiation`                            | prix négociés ; « Sélectionner » fixe le fournisseur du produit                                  | comparatif               |
| Échantillon (pastille, pas une étape) | dérivé de la commande `po_type='sample'` | « Commander échantillon » (une fois) → à envoyer → commandé → reçu                               | pastille + lien commande |
| À réception                           | —                                        | « Évaluer l'échantillon » (grille complète + photos échantillon / défauts)                       | grille                   |
| Décision                              | `validated` / `refused` / `on_hold`      | **Valider au catalogue** (non publié, canaux à cocher) · **Refuser** (motif obligatoire) · Pause | barre d'actions          |
| Après catalogue                       | `archived_at` + journal                  | **Retirer** (motif), consultations gardées avec badge ; **Restaurer** → canaux d'avant           | fiche catalogue          |

Règles : aucun statut échantillon saisi à la main ; aucune suppression d'un produit qui a un historique ; toute transition passe par une seule fonction qui écrit le journal ; le plugin continue d'écrire `supplier_search` (= Recherche).

---

## 6. Programme de développement mis à jour

Une phase = une session = une PR vers `staging`, sans fusion automatique. « Accord » = accord écrit de Roméo avant toute migration. Numérotation P3-P8 reprise ; phases nouvelles en lettres.

| #                           | Objet                                                                                                                                                                                                                                                   | Fichiers principaux                                                                                                                                        | Base                               | Test de vérification                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **P3a** (nouveau, avant P3) | Correctifs rapides sans changement de modèle : B2 validation, B4 double écriture, B5 fiche chargée par identifiant + « Restaurer », B7 « Devis reçu » → `responded`, B14 lien fournisseur, B15 boucle suggestions, B24 textes                           | `produits/sourcing/produits/[id]/page.tsx`, `SourcingProductRow.tsx`, `use-sourcing-*.ts`, `SourcingCandidateSuppliers.tsx`, `ConsultationSuggestions.tsx` | non                                | Playwright sur les 4 produits ; 1 seule écriture réseau par enregistrement ; import plugin 200 puis 409 inchangé ; type-check, lint |
| **P3b** (nouveau)           | Interdire la suppression d'un produit avec historique : `consultation_products`, `purchase_order_items`, `sales_order_items` → RESTRICT ; retirer les boutons « Supprimer »                                                                             | migration + `use-products.ts`, `use-catalogue-mutations.ts`, `use-sourcing-mutations.ts`, listes                                                           | **accord** (D1)                    | `BEGIN…ROLLBACK` : suppression refusée si ligne de consultation ; comptes de lignes identiques avant / après                        |
| P3                          | CHECK sur-ensemble, journal, fonction de cycle de vie (rapport du 11/09 § 8.1) **+ commande d'échantillon avec verrou anti-doublon**                                                                                                                    | migration, types régénérés                                                                                                                                 | **accord**                         | `BEGIN…ROLLBACK` import plugin exact ; 2e commande d'échantillon refusée ; `REVOKE … anon` vérifié                                  |
| P4                          | Fiche 4 étapes + pastille échantillon dérivée (fonction pure calquée sur `customer_samples_view`) + bouton masqué une fois commandé ; retrait total/TVA côté navigateur (B17)                                                                           | fiche, `use-sourcing-sample-order.ts`, nouveau `derive-sample-state.ts` + test unitaire                                                                    | non                                | test unitaire des 5 états ; Playwright : commander → bouton remplacé par « Voir la commande »                                       |
| **P4b** (nouveau)           | Grille d'évaluation : table `product_evaluations`, écran offre / échantillon, photos échantillon (`sourcing_photos`)                                                                                                                                    | migration, types, composant dans `packages/@verone/products`                                                                                               | **accord** (D2, D3, D4, D8)        | calcul du score testé ; critère éliminatoire → « Refuser » proposé ; accès refusé hors back-office                                  |
| P5                          | Liste : kanban 4 colonnes + filtres Pause / Refusés / Validés ; suppression vue Cartes, filtre « Statut » et compteurs faux (B11, B12)                                                                                                                  | `produits/sourcing/*.tsx`                                                                                                                                  | non                                | comptes par colonne = SQL                                                                                                           |
| P6                          | Contraction + ménage (après mise en ligne P3-P5) : rattrapage des statuts sans preuve (B13), code mort ≈ 4 000 lignes, page Échantillons et Création, 13 fonctions SQL, lecture `sample_orders` du tableau de bord (B19), notifications vers page morte | migration + suppressions                                                                                                                                   | **accord**                         | import plugin ; comptes catalogue / menu ; tableau de bord sans erreur                                                              |
| P7                          | Règle unique `is_sellable` sur tous les canaux, **dont LinkMe pour les produits sourcing non validés** (B6)                                                                                                                                             | fonction SQL + requêtes canaux                                                                                                                             | **accord** (D7)                    | « Plateaux Pokawa » absent de LinkMe tant que non validé ; comptes par canal avant / après                                          |
| P8                          | Retirer / Restaurer avec motif + badge « Retiré » en consultation, exclusion de « Commander » et du PDF client (D5) ; désarchivage complet (B22)                                                                                                        | fiche catalogue, `use-consultation-items.ts`, PDF                                                                                                          | non                                | retrait → absent des canaux → consultation affiche le badge → restauration                                                          |
| —                           | B20 : aligner la validation d'import sur les plateformes acceptées par `sourcing_urls` (sans changer les champs lus par le plugin)                                                                                                                      | `api/sourcing/import/route.ts`                                                                                                                             | non (ou élargir le CHECK : accord) | test statique du contrat § 5 ; import `faire` crée bien le lien                                                                     |

Garde-fous inchangés : aucun déclencheur stock touché, aucune route Qonto modifiée, `supabase db push` interdit, types régénérés avec chaque migration, contrat du plugin (§ 5 du 11/09) testé à chaque migration sur `products`.

---

## 7. Décisions à demander à Roméo

| #   | Question                                                                                                                   | Choix A (recommandé)                                                                               | Choix B                                                     |
| --- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| D1  | Un produit qui a déjà servi (consultation, commande) peut-il être supprimé définitivement ?                                | **Non** : seul « Retirer » reste, la base refuse la suppression                                    | Oui, avec double confirmation                               |
| D2  | Quand noter un produit ?                                                                                                   | **Deux fois avec la même grille** : à l'étape Évaluation (offre) puis à réception de l'échantillon | Une seule fois, à réception de l'échantillon                |
| D3  | Comment ranger les notes ?                                                                                                 | **Une colonne par critère** (7 critères fixes, contrôlés par la base)                              | Un bloc libre (critères modifiables sans migration)         |
| D4  | Le score décide-t-il ?                                                                                                     | **Non, il propose** (Valider / À revoir / Refuser) ; Roméo tranche                                 | Oui : refus automatique sous 50/100 ou critère éliminatoire |
| D5  | Produit retiré présent dans une consultation en cours ?                                                                    | **Visible avec badge « Retiré »**, exclu de « Commander » et du PDF client                         | Reste commandable normalement                               |
| D6  | Deuxième échantillon du même produit ?                                                                                     | **Impossible tant qu'une commande échantillon est en cours** ; possible si annulée                 | Toujours possible, avec avertissement                       |
| D7  | Produit sourcé pour un client ajouté à LinkMe ?                                                                            | **Seulement après « Valider au catalogue »**                                                       | Dès la création (comme aujourd'hui)                         |
| D8  | Poids de la grille : fabrication 20, finitions 20, conformité 15, style Vérone 15, emballage 10, prix 10, fournisseur 10 ? | **Adopter tels quels** (ajustables plus tard)                                                      | Roméo les modifie avant développement                       |

**Tranché par Roméo le 2026-09-12** : D1 = A (suppression refusée, seulement « Retirer ») · D5 = A (badge « Retiré »,
non commandable, absent du PDF client) · D6 = A (échantillon bloqué si commande en cours) · D7 = A (LinkMe après
validation). D3 = A, décidé par l'agent (choix technique). **D2 = B** (grille remplie une seule fois, à la réception de
l'échantillon ⇒ pas de colonne `stage` ; l'étape Évaluation garde seulement le comparatif des offres) · D4 = A (le score
propose, Roméo décide) · D8 = A (poids adoptés).

---

## 8. Annexe technique

### 8.1 Vérifications d'ouverture

- `get_project_url` = `https://aorroydfjsrygmosnzrl.supabase.co` ✅
- Branche du dossier : `fix/BO-AUDIT-SEC-S1-fonctions-anon` (autre agent) — aucun fichier touché hors de ce rapport.

### 8.2 Requêtes SQL (lecture seule) et résultats

1. **Répartition des produits**
   `SELECT creation_mode, product_status::text, sourcing_status, (archived_at IS NOT NULL), requires_sample, sourcing_type, count(*) FROM products GROUP BY 1,2,3,4,5,6`
   → complete/active/need_identified 207 · complete/active/sample_requested 2 · complete/discontinued/need_identified 1 (non archivé) + 14 (archivés) · complete/discontinued/sample_requested 1 (archivé) · complete/draft 1 · complete/preorder 6 · sourcing/draft/need_identified (client) 1 · sourcing/draft/order_placed 1 · sourcing/draft/sample_requested (interne) 1 · sourcing/preorder/received (requires_sample=true) 1. Total 236.
2. **Contraintes CHECK** (`pg_constraint` sur products, purchase*orders, purchase_order_items, sourcing*\_, consultations, sample\_\_)
   → `products_sourcing_status_check` : 13 valeurs dont `archived`, sans `sample_rejected` · `sourcing_candidate_suppliers_status_check` : identified, contacted, responded, shortlisted, selected, rejected (sans `quoted`) · `purchase_orders_po_type_check` : standard, sample · `sourcing_urls_platform_check` : alibaba, global_sources, 1688, made_in_china, website, instagram, pinterest, other · `sourcing_photos_photo_type_check` inclut sample_received, sample_defect · `products.name_length` ≥ 5 · `consultation_products_status_check` : pending, approved, rejected, revision_needed, ordered.
3. **Règles de suppression vers `products`** (`pg_constraint` contype='f', confrelid=products)
   → CASCADE (34) dont `consultation_products`, `purchase_order_items`, `sales_order_items`, `stock_movements`, `stock_reservations`, `channel_pricing`, `linkme_selection_items`, `price_list_items`, `product_images`, `sourcing_*` · NO ACTION : `purchase_order_receptions`, `sales_order_shipments` · SET NULL : `financial_document_items`, `media_assets`, `product_groups.primary_product_id`, `sample_order_items`.
4. **Volumes** (union de `count(*)`)
   → purchase_orders standard/received 24 ; lignes avec `sample_type` : 0/194 ; sample_orders 0 ; sample_order_items 0 ; sourcing_urls 4 ; sourcing_photos 0 ; sourcing_communications 0 ; sourcing_price_history 0 ; candidats `identified` 4 ; consultations `en_attente` 6 ; lignes consultation pending 4, approved 2.
5. **Fonctions** (`pg_proc` noms sourcing / sample / consultation / draft) → 23 fonctions ; 13 sans appel dans le code (§ 3 Q5) ; `anon` peut exécuter notamment `approve_sample_request`, `create_sample_order`, `mark_sample_*`, `request_sample_order`, `validate_sourcing_draft(p_…)`, `get_consultation_eligible_products` (sujet de S1).
6. **Définitions** : `customer_samples_view` (état dérivé du statut de commande, filtre `sample_type IS NOT NULL`, sans `po_type`) ; `get_consultation_eligible_products` (actif et non archivé) ; `auto_add_sourcing_product_to_linkme` (insère `channel_pricing` LinkMe `is_active=true` si client ou enseigne) ; `check_sample_archive_allowed` (archivage d'une ligne seulement si commande brouillon, TVA 1,20 en dur).
7. **Déclencheurs** sur products, purchase_orders, purchase_order_items, consultations, sourcing → dont `trigger_auto_add_sourcing_to_linkme`, `trigger_log_sample_requirement_changes_products`, `recalculate_purchase_order_totals_trigger`, `trigger_allocate_po_fees`, `trigger_update_cost_price_pmp`, `trg_po_validation_forecasted_stock` (protégé), `trigger_rollback_validated_to_draft` (protégé).
8. **Produits sourcing et statuts non standard, avec leurs liens** (sous-requêtes lignes de commande, consultations, candidats, liens, images, prix canaux)
   → 7 produits ; **0 ligne de commande fournisseur pour chacun** ; « Plateaux Pokawa » : 1 ligne de consultation, 1 prix canal LinkMe ; « Table basse … TEST » : sans fournisseur ; copie « SRC-MS6H8J2N-COPIE » archivée en `sample_requested`.
9. **Consultations et produits liés** → 6 consultations, 2 sans ligne ; aucune ligne sur un produit archivé ; 1 ligne sur produit sourcing brouillon.
10. **Colonnes** (`information_schema.columns`) → `sourcing_status` défaut `need_identified` ; `product_status` défaut `active` ; `po_type` défaut `standard` ; `products.status` et `products.archived_reason` **inexistantes**.
11. **Remplissage** → `organisations.rating` 3/20 fournisseurs ; `supplier_reliability_score` 5/20 ; `product_reviews` 0 ; `rejection_reason`, `consultation_id`, `sourcing_notes`, `target_price`, `sourcing_tags` : 0 produit.
12. **Index uniques `purchase_order_items`** → clé primaire seule. **`channel_pricing` des produits sourcing** → 1 ligne LinkMe active. **Règles d'accès** `consultation_products`, `sourcing_candidate_suppliers`, `sourcing_urls` → `is_backoffice_user()` pour tout.

### 8.3 Fichiers lus

- Rapports et règles : `RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md`, `SESSIONS-2026-09-11.md`, mémoires `sourcing-consultation-decisions-2026-09-11`, `feedback-no-table-per-use-case`, `feedback-research-before-db-modeling`, règles `database-modeling-patterns`, `stock-triggers-protected`, `no-phantom-data`.
- `apps/back-office/src/app/(protected)/produits/sourcing/` : `page.tsx`, `sourcing-page.helpers.tsx`, `SourcingProductRow.tsx`, `SourcingProductList.tsx`, `SourcingFilters.tsx`, `SourcingKanbanView.tsx`, `SourcingCardView.tsx`, `SourcingKpiCards.tsx`, `plugin/page.tsx`, `produits/[id]/page.tsx`, `produits/[id]/SourcingConsultationsSection.tsx`, `produits/[id]/SourcingProductHeaderActions.tsx`, `produits/create/page.tsx`, `echantillons/page.tsx`, `echantillons/use-echantillons.ts`.
- `packages/@verone/products` : `hooks/sourcing/{index,types,use-sourcing-fetch,use-sourcing-mutations,use-sourcing-sample-order,use-sourcing-create-update,use-sourcing-notebook}.ts`, `components/sourcing/notebook/{SourcingPipelineBar,SourcingStageGuide,SourcingCandidateSuppliers,SourcingCommunications,SourcingPriceHistory}.tsx`, `components/cards/SourcingProductEditCard/index.tsx`, `hooks/use-products.ts`, `hooks/use-archived-products.ts`.
- Autres packages : `@verone/common/src/hooks/use-inline-edit.ts`, `@verone/customers/src/hooks/use-customer-samples.ts`, `@verone/consultations/src/hooks/{use-product-consultations,use-consultation-items}.ts`, `@verone/consultations/src/components/suggestions/ConsultationSuggestions.tsx`, `@verone/categories/src/hooks/use-catalogue-mutations.ts`.
- Back-office : `api/sourcing/import/route.ts`, `api/sourcing/import-supplier/route.ts` (réponses), `api/consultations/associations/route.ts`, `components/business/sourcing-report/use-sourcing-report.ts`, `produits/catalogue/use-catalogue-page.ts`, `next.config.js`, `components/layout/app-sidebar/sidebar-nav-items.ts`.
- Plugin (lecture) : `chrome-extension/popup.js`, `chrome-extension/content-script.js` (appels et plateformes).
- Recherches ciblées : notifications `notification-templates.ts`, tableau de bord `dashboard-notifications.fetchers-activity.ts`, composants `ui-business/components/validation/`.

---

## Sources web

- [SupplyAutomate — Supplier Evaluation Matrix](https://www.supplyautomate.com/blog/supplier-evaluation-matrix-guide)
- [Ramp — Vendor scorecard](https://ramp.com/blog/what-is-a-vendor-scorecard)
- [AuraVMS — Supplier evaluation scorecard](https://www.auravms.com/blogs/supplier-evaluation-scorecard-template)
- [Precoro — Vendor scorecard 101](https://precoro.com/blog/vendor-scorecard-definition-benefits-examples-free-template/)
- [SourceDay — Supplier evaluation](https://sourceday.com/blog/supplier-evaluation/)
- [Zapro — Supplier evaluation criteria](https://zapro.ai/vendor-management/what-is-supplier-evaluation/)
- [Minden Sourcing — Custom furniture approval checklist](https://mindensourcing.com/custom-furniture-approval-checklist)
- [Minden Sourcing — Furniture quality control checklist](https://mindensourcing.com/furniture-quality-control-checklist/)
- [ProQC — Furniture inspection checklist](https://proqc.com/blog/furniture-inspection-quality-control-method-checklist/)
- [QCAdvisor — Furniture inspection checklist](https://www.qcadvisor.com/inspection-checklist/furniture/)
- [TestCoo — Furniture quality inspection standards](https://www.testcoo.com/en/blog/furniture-quality-inspection-standards-and-checklists)
- [Wirekat — Practical guide to JSONB in PostgreSQL](https://www.wirekat.com/a-practical-guide-to-using-the-jsonb-type-in-postgres/)
- [Medium — JSONB vs join queries in PostgreSQL](https://medium.com/@sruthiganesh/part-2-comparing-normalised-query-performance-in-postgresql-jsonb-vs-join-queries-ed63ef2da7cd)
