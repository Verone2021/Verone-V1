# Prompt de démarrage — [BO-FABRICATION-001] du sourcing à la fabrication

> À coller tel quel dans une **nouvelle** discussion Claude Code (dossier `verone-back-office-V1`).
> Écrit le 2026-09-16 à la demande de Roméo, à la fin du chantier sourcing A1→A4.

---

## Préambule — vérifications d'ouverture, lecture seule

```
V1. `pwd` = ~/verone-back-office-V1 et `git remote -v` = Verone2021/Verone-V1. Sinon ARRÊTE-TOI.
V2. `git branch --show-current`, `git status --short | wc -l`, `git log --oneline -3 origin/main origin/staging`.
V3. `gh auth status` : le compte actif peut être celui de Want It Now. Préfixer chaque commande GitHub par
    GH_TOKEN="$(env -u GITHUB_TOKEN gh auth token -u Verone2021)".
V4. MCP Supabase : `get_project_url` = https://aorroydfjsrygmosnzrl.supabase.co. Sinon ARRÊTE-TOI.
V5. `date -u` AVANT toute migration : rien entre 07 h et 17 h UTC un jour ouvré.
V6. Base = PRODUCTION, deux salariés. Lecture seule sauf accord écrit de Roméo dans le chat.
V7. Réponses en français simple, sans jargon ni commande (`.claude/rules/communication-style.md`).
```

## Lecture obligatoire avant de répondre

- `CLAUDE.md` racine, `.claude/rules/communication-style.md`, `.claude/rules/database-modeling-patterns.md`
  (**règle 1 : ne PAS créer une table par cas d'usage**), `.claude/rules/no-phantom-data.md`,
  `.claude/rules/stock-triggers-protected.md`, `.claude/rules/non-regression.md`
- `docs/scratchpad/audit-2026-09-11/RAPPORT-SOURCING-CONSULTATIONS-2026-09-11.md` § 8.1 (cycle de vie sourcing)
- `docs/scratchpad/dev-report-2026-09-16-BO-SOURCING-COMPLETUDE-001.md` (ce qui vient d'être livré)
- `packages/@verone/products/src/utils/sourcing-completeness.ts`, `sourcing-offer-cost.ts`,
  `sourcing-stage-playbook.ts` — les trois règles pures du sourcing actuel
- `supabase/migrations/20260209_001_ecotax_fee_allocation_system.sql` — la répartition des frais
  déjà en place sur les commandes fournisseurs

---

## Ce que veut Roméo (mots du 2026-09-16)

« À partir d'un produit importé dans le sourcing, manuellement ou par notre plugin, depuis un
fournisseur, je veux pouvoir le passer en **fabrication**. Il y a des produits qu'on va sourcer et
qu'on va décider de fabriquer nous-mêmes.

On aura besoin de plusieurs fournisseurs pour un seul produit : un pour les tissus, un pour le bois,
un pour les vis, etc.

Aujourd'hui, en achat-revente, on met le prix d'achat ; puis, avec la commande, on obtient le prix de
revient grâce à la livraison et aux taxes — le produit acheminé, tout compris.

Dans le cas de la fabrication, on doit pouvoir tout mettre à la main : les différents fournisseurs,
les différents composants, les différents prix. Ce qui change aussi, c'est qu'on passe sous **notre
propre marque** : c'est nous qui annonçons la marque, plus le fournisseur.

Le sourcing actuel est adapté à l'achat et à la revente de produits. Là, il faut quelque chose
d'adapté à la fabrication : constituer le prix d'achat, et savoir dans un produit quels composants
sont utilisés et de quels fournisseurs ils viennent.

Dans la fiche produit, ce sera une option : soit **sourcing fournisseur**, soit **fabrication
produit**. »

---

## Mission — AUDIT D'ABORD, aucune ligne de code

### 1. Recherche externe (obligatoire avant toute proposition de modèle)

Règle du dépôt : recherche web sur les pratiques 2026 avant toute proposition de nouvelle table ou de
refonte de schéma (mémoire `feedback-research-before-db-modeling`).

Chercher et **citer les sources** sur :

- Comment les **fabricants et les marques de mobilier / décoration** gèrent la composition d'un
  produit : nomenclature (bill of materials), composants, multi-fournisseurs par composant.
- Ce que font les outils du marché et **ce qu'ils appellent les choses** : ERP mobilier/ameublement,
  MRP légers (Katana, Odoo Manufacturing, Fulfil, Cin7, MRPeasy…), PIM avec composition (Akeneo),
  outils de sourcing/PLM textile et ameublement. Vocabulaire français attendu : nomenclature,
  composant, article acheté / article fabriqué, coût matière, main-d'œuvre, frais généraux.
- Comment ces outils **calculent un prix de revient de fabrication** : coût matière (somme des
  composants rendus) + main-d'œuvre + frais de fabrication + amortissement outillage/moule, et
  comment ils gèrent les pertes (chutes, taux de rebut).
- Comment ils traitent les **quantités par composant** (2 m de tissu, 8 vis, 1 plateau) et les
  **unités** (mètre, kilo, pièce) — c'est le point qui casse toujours les modèles trop simples.
- Comment ils articulent **marque propre** vs marque fournisseur (white label / private label),
  et ce qui change côté fiche produit publiée.
- Où s'arrête un ERP de fabrication utile pour une petite structure, et à partir d'où c'est de la
  sur-ingénierie (ordres de fabrication, ateliers, gammes opératoires, capacité).

Livrable : un § « comment font les professionnels », 5 à 8 points, chacun avec sa source.

### 2. Audit de l'existant Vérone (base + code + écran)

Points de départ vérifiés le 2026-09-16 — **à revérifier**, ils ont pu bouger :

- **Aucune structure de composition n'existe.** Aucune table `*component*`, `*bom*`, `*material*`,
  `*recipe*`, `*assembly*`, `*production*`, `*manufactur*` dans le schéma `public` (163 tables).
- **Marques** : table `brands` (4 lignes) et `products.brand_ids` — un **tableau** d'identifiants,
  220 produits en portent au moins une. Comprendre pourquoi c'est un tableau et ce que ça implique
  pour « notre marque » en fabrication.
- **Le produit est déjà une table unique** pour le catalogue et le sourcing, distingués par
  `products.creation_mode` (`sourcing` | `complete` | `duplication`). C'est le discriminateur qui
  existe : regarder s'il doit porter la fabrication, ou si c'est un autre axe.
- **Cycle de vie sourcing** : `apply_product_lifecycle_action` (4 étapes + pause/refus/validation/
  retrait), règle de complétude `sourcing_missing_fields`, comparatif d'offres au coût rendu
  (`sourcing_candidate_suppliers` + `sourcing-offer-cost.ts`), adoption d'une offre
  (`adopt_sourcing_offer`).
- **Prix de revient d'un produit acheté** : déjà calculé par la base, dès le brouillon de commande
  fournisseur — `allocate_po_fees_and_calculate_unit_cost()` répartit port, douane et assurance au
  prorata du montant de chaque ligne, puis écrit `unit_cost_net`. À la réception,
  `update_product_cost_price_pmp()` remonte `cost_price` et `cost_net_avg` sur le produit.
  **C'est la brique à réutiliser, pas à refaire.**
- **Fournisseurs** : `organisations` avec `type = 'supplier'` (21 lignes). `products.supplier_id`
  est **un seul** fournisseur — c'est exactement la limite que la fabrication fait sauter.
- **Déclencheurs de stock protégés** : `.claude/rules/stock-triggers-protected.md`. Un produit
  fabriqué consomme des composants : toute idée qui touche au stock doit être signalée, jamais
  appliquée sans arbitrage de Roméo.

À produire : un état des lieux factuel avec `fichier:ligne` et requêtes SQL, disant **ce qui se
réutilise tel quel**, **ce qui doit être étendu**, **ce qui manque complètement**.

### 3. Proposition de modèle — avec les 4 questions de la règle 1

`.claude/rules/database-modeling-patterns.md` impose, avant toute nouvelle table, de répondre à :

1. Cette « nouvelle entité » partage-t-elle la majorité de ses attributs avec une entité existante ?
2. Le workflow métier les traite-t-il de façon similaire ?
3. Aurait-on besoin de les joindre pour une question business courante ?
4. Les utilisateurs les perçoivent-ils comme une seule famille ?

Appliquer ces 4 questions **explicitement** à chacune de ces décisions :

- **Un composant est-il un produit ?** Un tissu, une planche, un sachet de vis : est-ce une ligne de
  `products` (avec un discriminateur du genre `product_kind = 'finished' | 'component'`), ou une
  entité différente ? Peser : les composants ont un fournisseur, un prix d'achat, un stock, des
  commandes fournisseurs — donc beaucoup d'attributs communs. Mais ils ne se vendent pas, n'ont pas
  de canal, pas de marge, pas de fiche publique.
- **La nomenclature** : une table de liaison (produit fini → composant, quantité, unité, perte) est
  très probablement inévitable — le justifier avec les 4 questions plutôt que de l'affirmer.
- **Le mode du produit** : `sourcing fournisseur` vs `fabrication produit`. Est-ce une valeur de plus
  sur `creation_mode`, une colonne dédiée, ou un état du cycle de vie ? Regarder l'impact sur les
  ~12 filtres qui lisent `creation_mode` et sur le contrat du plugin Chrome (qui ne doit **jamais**
  casser — rapport du 11/09 § 5).
- **La marque** : en fabrication c'est la nôtre. `products.brand_ids` étant un tableau, dire si ça
  suffit ou s'il faut une notion de marque « propriétaire ».
- **Les unités** : 2 m de tissu, 8 vis, 0,5 kg de mousse. Proposer soit une liste courte d'unités
  contrôlée par CHECK (règle 2 du fichier : CHECK sur TEXT > ENUM), soit la réutilisation d'un
  champ existant. Dire ce qui se passe quand on achète au rouleau et qu'on consomme au mètre.
- **Le prix de revient de fabrication** : où est-il calculé ? La réponse attendue est « comme pour
  l'achat : un calcul, jamais une donnée stockée en double » — chaque composant apporte son coût
  rendu (le `unit_cost_net` déjà calculé par la base), auquel s'ajoutent main-d'œuvre et frais.
  Dire précisément d'où viennent la main-d'œuvre et les frais, et qui les saisit.
- **Le stock** : un produit fabriqué consomme ses composants. **Ne rien proposer qui touche aux
  déclencheurs protégés.** Décrire l'impact, poser la question à Roméo, ne pas trancher.

### 4. Parcours à l'écran

Décrire, écran par écran, en réutilisant ce qui existe :

- Où se trouve l'option « sourcing fournisseur » / « fabrication produit » sur la fiche, et ce qui
  change quand on bascule (sections affichées, champs obligatoires, actions possibles).
- À quoi ressemble la section « Composition » : liste des composants, fournisseur de chacun,
  quantité, unité, coût rendu unitaire, sous-total, part dans le coût matière.
- Comment on ajoute un composant : depuis le catalogue existant, depuis le sourcing, ou en créant
  un composant neuf — et comment on lui trouve un fournisseur (le comparatif d'offres livré en
  A4 se réutilise-t-il tel quel ?).
- Ce que devient la règle de complétude (`sourcing_missing_fields`) pour un produit fabriqué :
  le fournisseur unique et le prix d'achat n'ont plus de sens, il faut au moins un composant.
  **C'est le point le plus important à ne pas rater** : sans ça, un produit fabriqué serait
  bloqué à la validation au catalogue par une règle écrite pour l'achat-revente.
- Ce que voit le client : jamais les fournisseurs, jamais les composants (même règle que les
  consultations).

### 5. Ce qu'on NE fait pas

Dire explicitement ce qui sort du périmètre pour une structure de la taille de Vérone : ordres de
fabrication, gammes opératoires, postes de charge, planification de capacité, traçabilité par lot.
Justifier, avec les sources du § 1.

---

## Méthode imposée

1. **Lecture seule d'abord.** Aucune migration, aucune écriture, aucun code tant que Roméo n'a pas
   tranché le modèle.
2. **Rapport dans** `docs/scratchpad/audit-2026-09-XX-BO-FABRICATION-001.md` : recherche externe,
   état des lieux, modèle proposé avec les 4 questions traitées, parcours écran, programme découpé
   en lots (1 lot = 1 branche = 1 PR), et ce qui est hors périmètre.
3. **Questions à Roméo** : une seule série, à la fin, en français simple, 2 choix maximum par
   question, ta recommandation en premier. Ne pas lui demander d'arbitrer ce qui est technique.
4. **Puis attendre.** Le développement ne commence qu'après son accord sur le modèle.

## Repères qui ne changent pas

- Le plugin Chrome de sourcing ne doit jamais casser (contrat : rapport du 11/09 § 5).
- Aucun déclencheur de stock modifié, aucune route Qonto modifiée.
- Fichiers < 400 lignes, zéro `any`, 5 techniques responsive, formulaires dans `packages/@verone/`.
- Migrations append-only via `execute_sql` après accord écrit, jamais `supabase db push`, types
  régénérés dans la même PR, jamais entre 07 h et 17 h UTC un jour ouvré.
- Pas de fusion automatique : dépôt privé sur GitHub Free, les 4 contrôles requis se vérifient à la
  main, fusion sur ordre de Roméo.
