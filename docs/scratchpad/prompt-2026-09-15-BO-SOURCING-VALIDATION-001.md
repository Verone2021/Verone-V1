# Prompt de reprise — [BO-SOURCING-VALIDATION-001] règles de validation du sourcing

> À coller tel quel dans une nouvelle discussion Claude Code (dossier `verone-back-office-V1`).

---

Lis d'abord `CLAUDE.md`, `.claude/rules/communication-style.md`, `.claude/work/ACTIVE.md` (section
« [BO-SOURCING-VALIDATION-001] »), `.claude/rules/no-phantom-data.md`, `.claude/rules/database.md`,
`.claude/rules/stock-triggers-protected.md`, puis la mémoire `sourcing-consultation-decisions-2026-09-11` et le
programme `docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md`. Réponds-moi en français simple.

## Ce que je veux (Roméo, 15/09/2026)

« Dans le sourcing, il faut que je puisse valider des produits. Il y a des produits que je ne peux même pas valider,
et pourtant je peux continuer à mettre des informations. Je ne peux pas valider des produits où le fournisseur n'est
pas renseigné. Explique-moi comment c'est possible qu'on ait des produits sans fournisseur qui soient validés. Il y a
d'autres produits qui ne sont pas validés : on ne devrait pas pouvoir les valider. Il faut dévalider tous les
produits qui sont en sourcing et exiger certains champs, comme le fournisseur et d'autres champs obligatoires, pour
que ce soit validé. Sinon, on ne peut pas valider, on ne peut pas commander d'échantillons. »

Objectifs : 0. **Audit complet du sourcing d'abord** (lecture seule) : reprendre le programme P3 → P8 du 12/09
(`docs/scratchpad/audit-2026-09-12/PROGRAMME-2026-09-12.md` et `AUDIT-SOURCING-2026-09-12.md`) et me dire, point
par point, **ce qui est vraiment fait et en ligne, ce qui est à moitié fait, ce qui manque**, puis **ce qu'on peut
faire de mieux** (parcours, champs, blocages, échantillons, validation, écrans en trop), avec ta recommandation et
un ordre de travail. Preuves à l'écran (Playwright, sans enregistrer) et en base. Je décide ensuite.

1. **M'expliquer** avec des preuves (base + code) pourquoi des produits sans fournisseur apparaissent validés et
   pourquoi d'autres ne peuvent pas être validés alors qu'on peut encore les modifier.
2. **Une seule règle de complétude** pour un produit en sourcing (liste des champs obligatoires à me proposer, je
   tranche) : si elle n'est pas remplie → pas de « Valider au catalogue », pas de « Commander l'échantillon », avec la
   liste des champs manquants affichée sur l'écran. Règle appliquée **à la fois** dans la base (fonctions
   `apply_product_lifecycle_action` action `validate` et `request_sample_order`) **et** à l'écran (mêmes champs,
   même message) — jamais seulement à l'écran.
3. **Remettre « en cours »** les produits de sourcing validés à tort, **après** m'avoir montré la liste exacte.

## Faits relevés le 15/09 (lecture seule, à revérifier au début)

- `products.creation_mode = 'sourcing'` (non archivés) : **6 produits** — `need_identified` 1 (PRD-0313 Plateaux
  Pokawa, sans fournisseur), `supplier_search` 2 (dont SRC-MU2QFJ2R Sofá Modular Lounge sans fournisseur),
  `negotiation` 1 (SRC-MU2QM3SE Canapé, sans fournisseur), `order_placed` 1, `received` 1 (statut produit
  `preorder`) ; aucun des 6 n'a de sous-catégorie.
- **Piège majeur** : 232 produits du catalogue (`creation_mode = 'complete'`, dont 207 actifs vendus) portent
  `sourcing_status = 'need_identified'` — valeur par défaut de la colonne, **pas** du sourcing réel. Ne jamais les
  traiter comme « en sourcing ». 20 produits du catalogue n'ont pas de fournisseur (ex. POU-0001, VAS-0034,
  MEU-0001, APP-0001, VAS-0006, SET-0003, SET-0004, LAM-0001).
- Un seul produit `sourcing_status = 'validated'` : PRD-0314 (produit TEST, a un fournisseur, pas de sous-catégorie).
  2 produits catalogue `sample_requested` actifs (SRC-MS6H8J2N, SRC-MPY8ROXI).
- Règle actuelle en base (`supabase/migrations/20260913220000_bo_sourcing_p4_validate_to_catalogue.sql`, depuis le
  13/09) : `validate` accepté depuis 10 statuts « en cours » (`need_identified` … `order_placed`, `received`), refusé
  sans `supplier_id` ou sans `cost_price > 0` (erreur VL004) ; passe `creation_mode` à `complete`. Avant le 13/09
  aucune contrôle → validations anciennes possibles sans fournisseur.
- Écran : `packages/@verone/products/src/components/sourcing/product-page/SourcingActionBar.tsx` — boutons
  « Commander l'échantillon » (l. ~109) et « Valider au catalogue » (l. ~139) désactivés quand `missing` est
  renseigné ; à comparer avec la règle base (écarts probables). Autres fichiers : `use-sourcing-lifecycle.ts`,
  `sourcing-rpc-error.ts`, `sourcing-stage.ts`, `SourcingLifecycleDialogs.tsx`, `sourcing/page.tsx`,
  `request_sample_order` dans `20260913190100_bo_sourcing_p3_sample_order_guard.sql`.
- Ce que Roméo appelle « validé » à l'écran peut être l'onglet « Validés » de la liste sourcing ou un badge : **le
  vérifier à l'écran (Playwright, lecture seule) avant toute conclusion**.

## Méthode imposée

1. **Audit lecture seule** (base + code + écran) : qui est « validé » selon l'écran, selon la base, depuis quand,
   par quelle action (journal sourcing), avec quels champs manquants. Rapport court en français + tableau produit par
   produit dans `docs/scratchpad/audit-2026-09-XX-BO-SOURCING-VALIDATION-001.md`.
2. **Me proposer la liste des champs obligatoires** (au minimum fournisseur, prix d'achat ; à discuter :
   sous-catégorie, référence fournisseur, nom, image…) séparément pour « Commander l'échantillon » et « Valider au
   catalogue ». Une seule question, ta recommandation en premier.
3. **Base** (après mon accord) : migration qui ajoute les contrôles dans `apply_product_lifecycle_action` (validate)
   et `request_sample_order`, corps recopié à l'identique depuis `pg_get_functiondef` + contrôle ajouté, vérification
   ligne à ligne (aucune ligne retirée), essai dans une transaction annulée avec `SET LOCAL lock_timeout = '2s'`,
   types régénérés. Ne jamais toucher aux déclencheurs stock ni aux commandes fournisseurs existantes.
4. **Données** (après mon accord sur la liste exacte) : remettre « en cours » uniquement les produits de sourcing
   validés à tort, par le chemin normal (action du cycle de vie / journal), sans note technique dans les champs
   visibles ; jamais les 232 produits du catalogue au statut par défaut.
5. **Écran** : mêmes champs obligatoires, liste des champs manquants visible, boutons bloqués ; tests Playwright à
   1440 et 375 sans enregistrer ; formulaires dans `packages/@verone/`.
6. Relecture reviewer-agent, PR vers staging, **fusion seulement sur mon accord**.

## État de la mise en ligne précédente (15/09 soir)

- **Tout est en production depuis le 15/09 ~23h30** : #1160 (marges, fiche produit, mobile, connexion, compteurs)
  et #1161 (règle workflow) fusionnées dans staging, release **#1162** fusionnée dans main (`24126ca9`), 3 sites
  vérifiés en ligne (site, LinkMe, back-office `verone-backoffice.vercel.app`, redirection vers la connexion sans
  erreur). Partir de `staging` à jour pour la branche sourcing.
- E2E réels rouges à la connexion = secret de mot de passe de test périmé (pas une régression) ; en attente de
  décision Roméo, ne pas bloquer le sourcing dessus.
- Accès GitHub : le compte actif de `gh` peut être celui de Want It Now (dépôt introuvable). Utiliser le compte
  Verone2021 pour chaque commande (`GH_TOKEN="$(gh auth token --user Verone2021)"`), sans changer le compte actif.
- Bloc sécurité de la base (lots 8 à 11) reporté à une autre session (brouillons dans
  `docs/scratchpad/bloc-S-drafts-2026-09-15/`).
