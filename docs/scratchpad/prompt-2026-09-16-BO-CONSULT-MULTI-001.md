# Prompt de reprise — Consultations : brancher ce qui existe déjà

> **À coller tel quel dans une nouvelle discussion Claude Code.** Ce fichier se lit seul : il ne
> renvoie à aucune conversation précédente.

---

## Contexte

Dossier : `/Users/romeodossantos/verone-back-office-V1`. Lis d'abord `CLAUDE.md` racine et
`.claude/work/ACTIVE.md`. Le compte GitHub actif de la machine est `WantitNow` : bascule sur
`Verone2021` (`gh auth switch --user Verone2021`) avant toute commande GitHub.

Le chantier **sourcing produit est terminé** (partie A, livrée le 16/09) : blocages expliqués à
l'écran, sous-catégorie saisissable, commande groupée d'échantillons, 4 étapes opérantes, comparatif
d'offres au coût rendu, « Retenir cette offre » / « Adopter ce prix », et réparation du calcul de
répartition des frais fournisseurs. Restent A6 (kanban glisser-déposer, filtres, pagination) et A7
(ménage du code mort, une semaine après la mise en ligne).

**Ce chantier-ci porte sur les CONSULTATIONS.** Un audit complet a été fait le 16/09 au soir ; ses
conclusions sont reprises ci-dessous. **Vérifie-les contre le code avant d'agir** — la mémoire est un
indice, le code est la vérité.

---

## Décision produit déjà prise par Roméo (16/09) — ne pas la rouvrir

Mots de Roméo, le 16/09 au soir :

> « Un produit peut avoir plusieurs fournisseurs, car au catalogue on peut avoir une référence, et
> imaginons qu'on ait trois ou quatre références de spots : on va devoir les vendre séparément. S'ils
> sont très ressemblants, on laisse comme ça pour l'instant, après on verra comment on fait évoluer la
> chose. Mais dans une consultation, il faut qu'on puisse mettre plusieurs produits, et donc on aura
> un produit par fournisseur pour le même produit. Ça fait sens pour l'instant, on verra par la
> suite. »

Autrement dit, la règle en vigueur :

- **Une fiche produit = un fournisseur.** Trois spots ressemblants venant de trois fournisseurs = trois
  fiches produit, vendues séparément au catalogue.
- **Une consultation accueille autant de produits qu'on veut**, donc de fait autant de fournisseurs.
  C'est déjà le cas (voir plus bas), il n'y a rien à changer pour ça.
- La mise en concurrence de deux fournisseurs sur un même article se joue **en amont, dans le
  sourcing** — c'est ce que le comparatif d'offres au coût rendu vient de livrer.

Conséquence directe pour ce chantier : **aucune modification de structure n'est nécessaire.** On
n'ajoute PAS de `supplier_id` sur `consultation_products`, on ne touche PAS à la contrainte
`UNIQUE (consultation_id, product_id)`.

**C'est un choix assumé comme provisoire** (« on verra comment on fait évoluer »). Ce qu'il coûtera le
jour où Roméo voudra en sortir, pour information et sans rien préparer aujourd'hui : regrouper des
fiches quasi identiques demanderait soit une notion de « variante fournisseur » sur le produit, soit
`supplier_id` porté par la ligne de consultation et la levée du `UNIQUE`. Ne rien anticiper : cela se
décidera avec de vrais cas en main.

---

## Ce qui est DÉJÀ FAIT (vérifié en base et dans le code le 16/09)

### Le multi-produits / multi-fournisseurs fonctionne déjà

- `consultation_products` est une table de lignes : une consultation porte autant de produits qu'on
  veut. En production : 6 consultations, 6 lignes, dont 2 consultations à 2 lignes — et l'une d'elles
  a **2 fournisseurs différents**.
- Le fournisseur d'une ligne est déduit de `products.supplier_id` et **déjà affiché** sous le SKU
  (`ConsultationProductRow.tsx:139-140`).
- `ConsultationOrderDialog.tsx:70-87` **groupe déjà les lignes par fournisseur** et affiche une
  colonne « Fournisseur ».

### Livré et en production

- `[BO-CONSULT-001]`, `[BO-CONSULT-FIX-001/002]` : workflow devis, emails, gabarits PDF, totaux.
- `[BO-CONSULT-PDF-DUAL-001]` (#1052) : **deux PDF** — proposition client (sans coûts) et rapport
  interne (avec marges), charte Vérone.
- `[BO-CONSULT-P2-001]` (#1146, 17 commits) : le lot structurant. `consultation-economics.ts` (calcul
  pur, testé), `consultation-order-guards.ts`, exclusion des lignes refusées des PDF/devis/commandes,
  source unique pour les lignes, fichiers redécoupés sous 400 lignes, ~1 400 lignes de tests.
- `[BO-CHANNELS-P7-001]` (#1156) : règle « vendable » unique appliquée aux consultations.
- `[BO-PRODUCTS-P8-001]` (#1158) : lignes de produits retirés visibles dans les consultations.

### ⚠️ Le point central de l'audit : le lot P9 est du code mort à 100 %

`[BO-CONSULT-P9-001]` (#1149, migration `20260913180000_bo_consult_p9_projet.sql`, **appliquée en
production**) a créé, et **personne ne s'en sert** :

| Objet créé le 13/09                                         | État réel                                                 |
| ----------------------------------------------------------- | --------------------------------------------------------- |
| Table `consultation_needs` (besoins du client)              | **0 ligne**, **0 référence dans le code applicatif**      |
| Table `consultation_supplier_costs` (frais par fournisseur) | **0 ligne**, **0 référence** (hors types générés)         |
| `client_consultations.default_margin_percentage`            | **NULL sur les 6 lignes**, absente du type et du `select` |
| `consultation_products.margin_percentage`                   | **NULL sur les 6 lignes**, absente du type et du `select` |
| `consultation_products.need_id`                             | **NULL partout**, jamais lue ni écrite                    |
| Statut de ligne `candidate`                                 | Accepté par le CHECK, **ingérable à l'écran**             |
| `consultation-supplier-costs.ts` (202 l. + tests)           | Complet, correct, **aucun appelant**                      |

**Il n'y a donc presque rien à construire : il y a à brancher.**

---

## Ce qui RESTE À FAIRE — 5 lots, dans cet ordre

Chaque lot ci-dessous indique ce qui existe et ce qui manque **exactement**. Les numéros de ligne
datent du 16/09 : revérifie-les.

### B1 — La marge par défaut doit enfin produire un prix de vente

**Existe** : le calcul est complet et testé. `consultation-economics.ts:157-167` résout
`line.marginPercentage ?? settings.defaultMarginPercentage ?? null` puis
`defaultUnitPrice = coût × (1 + marge/100)`.

**Manque** :

1. **Personne ne passe jamais `settings`.** Les 7 appels à `computeConsultationEconomics` /
   `computeLineEconomics` se font **sans second argument** : `ConsultationProductRow.tsx:90`,
   `ConsultationOrderInterface.tsx:181-196`, `ConsultationOrderDialog.tsx:65-67`,
   `use-consultation-items.ts:322-337`, `consultation-async-handlers.ts:276-290`,
   `ConsultationSummaryPdf.tsx:82-98`, `ConsultationMarginReportPdf.tsx:37-53`. La marge est donc
   toujours `null`.
2. **L'adaptateur est recopié 7 fois**, à l'identique (deux copies portent même le nom
   `itemToEconInput` : `ConsultationOrderDialog.tsx:20-36`, `ConsultationProductRow.tsx:17-33`).
   → créer `consultation-economics-input.ts` et l'utiliser partout. **Sans ça, chaque réglage futur
   (marge, frais, TVA) devra être ajouté 7 fois.**
3. **Les colonnes ne remontent même pas du serveur** : le `select` de `use-consultation-items.ts:38-70`
   ne demande ni `margin_percentage` ni `need_id` ; `use-consultations.ts:47` ne demande pas
   `default_margin_percentage`. Les types `consultations-types.ts:1-32` et `:56-91` les ignorent aussi.
   ⚠️ Un plan antérieur affirmait « les colonnes arrivent déjà du serveur » — **c'est faux**.
4. **Les gardes bloqueraient quand même le devis** : `consultation-order-guards.ts:40-49` et `:57-64`
   testent `item.unit_price === null`, le prix _saisi_. Avec une marge par défaut, `unit_price` reste
   NULL → « Prix de vente à fixer » et devis bloqué (`use-consultation-detail.ts:213`).
5. **4 endroits écrivent le prix brut** au lieu du prix calculé :
   `consultation-async-handlers.ts:327`, `use-consultation-detail.ts:214`,
   `ConsultationSummaryPdf.tsx:223`, `ConsultationMarginReportPdf.tsx:263`.
6. Aucune saisie : ni champ « marge par défaut » dans `EditConsultationSections.tsx`, ni colonne
   « marge » dans `ConsultationProductsTable.tsx`.

### B2 — Frais par fournisseur et écran groupé par fournisseur

**Existe** : la table, et `consultation-supplier-costs.ts` (répartition au prorata coût × quantité,
repli sur les quantités, frais non imputables comptés à part), testé. `computeConsultationEconomics`
retourne déjà `totals.supplierFees`, `totals.unallocatedSupplierFees` et `suppliers[]`.

**Manque** :

1. **Aucun accès applicatif à `consultation_supplier_costs`** : pas de hook, pas de requête, pas
   d'écran. `suppliers[]` est calculé puis **jeté**.
2. L'écran reste une liste plate : `ConsultationProductsTable.tsx:41-77` n'a ni colonne
   « Fournisseur », ni « Part des frais », ni « Revient », ni regroupement.
3. **La commande fournisseur est aplatie** : `page.tsx:286-295` fait
   `supplierGroups.flatMap(...)` puis ouvre **une fenêtre par produit**. Le regroupement calculé
   200 lignes plus haut est détruit. `usePurchaseOrders().createOrder` n'est jamais appelé.
   → c'est le défaut le plus visible pour Roméo au quotidien.
4. Une ligne **déjà commandée est re-proposée** à la commande
   (`ConsultationOrderInterface.tsx:172-177` inclut `status === 'ordered'`).
5. Pas d'alerte sur les frais non imputables (`unallocatedSupplierFees`).

### B3 — Besoins du client et options comparées

**Existe** : la table `consultation_needs`, la colonne `need_id`, le statut `candidate`.

**Manque** — et **attention, c'est un piège armé** :

1. `consultation_needs` n'est référencée **nulle part** dans le code applicatif.
2. **Le statut `candidate` fausserait les chiffres aujourd'hui** : `consultation-economics.ts:144`
   fait `included = line.status !== 'rejected'` → une option candidate serait comptée dans le chiffre
   d'affaires et la marge ; `consultation-order-guards.ts:43-48` la mettrait dans le devis ;
   `:60-63` la compterait comme « prix à fixer » et **bloquerait la création du devis**.
   `ConsultationStatusCell.tsx:3-8` ne connaît que 4 libellés et ne peut pas produire `candidate`.
   **Traiter ce point AVANT d'exposer les besoins à l'écran**, sinon on arme la bombe.
3. Limite connue, **volontairement non traitée** (décision Roméo du 16/09) :
   `UNIQUE (consultation_id, product_id)` empêche qu'un même produit soit option de deux besoins.

### B4 — Gel des prix et TVA par ligne

**Existe** : `client_consultations.tva_rate` (défaut 20), déjà lu par le PDF client
(`ConsultationSummaryPdf.tsx:101-103`).

**Manque** :

1. **La TVA est écrite en dur à 20 % à 4 endroits** du devis et de la commande :
   `consultation-async-handlers.ts:297`, `:298`, `:327`, `use-consultation-detail.ts:216`. Le PDF
   client, lui, lit la vraie valeur. **Les deux documents divergeront dès qu'un taux ≠ 20 sera
   utilisé** — invisible aujourd'hui car les 6 consultations sont à 20 %.
2. Cellule « 20% » en dur dans le tableau : `ConsultationProductRow.tsx:300-302`.
3. `tva_rate` **n'est modifiable nulle part** (absent d'`EditConsultationSections.tsx`).
4. Pas de TVA par ligne en base (seule migration du lot, si Roméo la valide).
5. Aucun gel : « Créer le devis » lit `item.unit_price` sans jamais le réécrire, aucun verrou une
   fois le devis envoyé.

### B5 — Les deux rapports

**Existe** : les deux PDF fonctionnent, générés côté navigateur (`@react-pdf/renderer`, pas de route
serveur). Le rapport interne a déjà une colonne « Fournisseur ».

**Manque** :

1. Validité **« 30 jours » en dur** (`ConsultationSummaryPdf.tsx:326`), référence `PROP-…` dérivée de
   l'identifiant et **jamais versionnée** (`:76`).
2. Pas de remise globale, pas de ventilation TVA par taux.
3. Rapport interne : **pas de ventilation par fournisseur** (alors que `suppliers[]` est calculé),
   pas de colonne douane distincte, pas d'écart au budget client (`tarif_maximum` inutilisé).
4. `ConsultationMarginReportPdf.tsx:263` affiche le **prix brut** → afficherait 0 € là où le PDF
   client afficherait le prix calculé par la marge.
5. Aucun test n'vérifie que le PDF client ne laisse fuiter ni « fournisseur », ni « marge », ni
   « revient ».

---

## Défauts à corriger au passage (trouvés le 16/09, hors lots)

- **Une ligne à quantité 0 fait planter la page.** `ConsultationProductRow.tsx:90` appelle
  `computeLineEconomics` sans filtrer, et celui-ci lève `RangeError` si `quantity <= 0`
  (`consultation-economics.ts:130-134`). Tous les autres appelants filtrent. La contrainte DB protège
  l'insertion normale, donc le risque vient d'un import ou d'une écriture directe.
- **`get_consultation_eligible_products` reste exécutable par `anon` et `PUBLIC`**, hors règle
  R-GRANT (`.claude/rules/database.md`). Elle est `SECURITY INVOKER` donc l'exposition est théorique,
  mais le droit est à fermer comme l'ont été les autres en `[BO-SEC-003/004/005]`.
- **`use-consultation-detail.ts:104-117` charge TOUTES les consultations** puis fait un `.find()` pour
  en afficher une seule.
- **La liste des consultations n'a pas de pagination serveur** (filtrage en mémoire). Acceptable à
  6 lignes, pas au-delà.
- **Code mort** : `packages/@verone/products/src/components/wizards/consultation-manager/`
  (`ConsultationProductsView.tsx`, `ProductConsultationView.tsx`, `ConsultationOverviewStats.tsx`) —
  aucune référence dans tout le dépôt.
- **Le wizard de création ne permet pas d'ajouter des produits** : on ne peut le faire qu'après
  création, depuis la fiche (sauf arrivée depuis une fiche produit, `use-create-consultation.ts:298-300`).
  À signaler à Roméo comme choix produit, pas à corriger d'office.

---

## Ordre de travail conseillé

1. **B1 d'abord**, en commençant par `consultation-economics-input.ts` : tant que l'adaptateur est
   recopié 7 fois, chaque lot suivant coûte 7 fois plus cher.
2. **B4 ensuite** (TVA en dur) : c'est le seul défaut qui produira des documents faux, et il est
   petit.
3. **B2** : c'est celui qui se voit le plus au quotidien (une fenêtre par produit au lieu d'une
   commande par fournisseur).
4. **B3** seulement après avoir neutralisé le statut `candidate` dans le calcul et les gardes.
5. **B5** en dernier, une fois que les chiffres sont justes partout.

---

## Règles de travail à respecter (extraits de `.claude/rules/`)

- **Roméo n'est pas développeur.** Français simple, aucune commande shell dans les messages, rapports
  courts. `.claude/rules/communication-style.md`, règle 6 : tu décides seul sur tout ce qui est
  technique. Tu ne le sollicites QUE sur : base de données, action irréversible, choix
  produit/business, argent.
- **Aucune migration, release ou requête lourde entre 07 h et 17 h UTC** un jour ouvré (ADR-041).
- **Avant toute écriture en base** : empreinte avant, opération rejouée en transaction annulée,
  empreinte après, retour arrière prêt. Un accès direct à la base est disponible : `DATABASE_URL`
  dans `.env.local` à la racine, utilisable avec `psql` — c'est le bon outil pour un essai annulé.
- **Jamais de donnée fantôme** (`.claude/rules/no-phantom-data.md`). Pour corriger un calcul, on
  réécrit les lignes **sans changer leur valeur** et on laisse les déclencheurs officiels recalculer :
  on n'écrit jamais un montant à la main.
- **Déclencheurs de stock protégés** : `.claude/rules/stock-triggers-protected.md`.
- **Pas de fusion automatique** (dépôt privé sur GitHub Free) : vérifier à la main les 4 contrôles
  requis, puis fusionner en `--squash` **sans `--delete-branch`**, sur ordre de Roméo.
- **Le gros contrôle de construction dépasse ses 20 minutes au premier passage** (cache froid) et
  passe en ~13 minutes au second. Le relancer est normal, ce n'est pas une erreur de code.
- **Zéro `any`**, pas de `@ts-ignore`, jamais baisser un seuil pour faire passer un contrôle
  (`.claude/rules/code-standards.md`, ADR-033).
- **Ne jamais lancer le serveur de développement** : Roméo le lance lui-même (port 3000).

---

## Première action attendue

Ouvre une branche depuis `staging` à jour, puis **vérifie les affirmations de ce document** :
les 7 appels sans `settings`, les 4 TVA en dur, les 2 tables vides, l'aplatissement de la commande
fournisseur. Rapporte à Roméo, en français simple, ce que tu confirmes et ce qui a changé depuis le
16/09 — puis attaque B1.
