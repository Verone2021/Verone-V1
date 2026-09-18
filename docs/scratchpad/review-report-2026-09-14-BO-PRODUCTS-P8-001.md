# Review Report — 2026-09-14 — BO-PRODUCTS-P8-001

Revue du commit 15e9cfa2 (`git diff 14d4ddb5 15e9cfa2`, 27 fichiers lus intégralement) par reviewer-agent.

## Verdict : FAIL (1 CRITICAL, corrigé ensuite — voir « Suite donnée »)

## Ce qui fonctionne

- Anti-raccourcis : zéro `@ts-ignore`, `as any`, `eslint-disable`, seuil abaissé.
- Appels `apply_product_lifecycle_action` corrects (signature vérifiée en base) : `withdraw` avec `p_reason`, `restore` sans.
- Chaîne de facturation consultation : `filterBillableItems` / `countUnpricedLines` excluent les lignes retirées ;
  `buildOrderForDocument` (`consultation-async-handlers.ts:273`) passe par `filterBillableItems` → devis et commandes
  client sans produit retiré ; `filterClientVisibleItems` dans `ConsultationSummaryPdf.tsx`.
- Tests : 5 nouveaux cas (isWithdrawnItem, facturation, lignes sans prix, PDF client, rapport interne).
- Ordre des hooks : `useCatalogueWithdraw` déclaré avant les retours anticipés de `page.tsx`.
- Promesses : `onConfirm` attendu dans `SourcingReasonDialog` ; handlers de liste en `void … .catch()`.
- `use-variant-group-archive.ts` : suppression de l'écriture `status` (colonne inexistante) correcte.
- Nouveaux fichiers < 400 lignes ; `use-catalogue-page.ts` réduit (571 → 545).

## CRITICAL — captures 5 tailles absentes pour `/produits/catalogue`

La page fait partie des exceptions back-office à tester en 375 / 768 / 1024 / 1440 / 1920 ; P8 y ajoute badge
« Retiré », bouton Retirer, fenêtre de motif. Aucune capture fournie → FAIL automatique.

## WARNING — `SourcingReasonDialog.tsx:64` — fenêtre sans `h-screen md:h-auto`

Sur mobile, le clavier virtuel peut masquer la fenêtre ou faire défiler la page entière.

## INFO — groupes de variantes hors cycle de vie

Archivage / restauration d'un groupe écrit encore `archived_at` directement (sans motif ni journal) : asymétrie avec
le retrait d'un produit seul, à traiter dans un chantier dédié.

## Suite donnée (coordinateur, 14/09)

- **Fenêtre de motif** (`56786751`) : `flex h-screen flex-col md:h-auto md:max-w-lg`, zone de saisie défilante
  `md:max-h-[70vh]` ; boutons Annuler / Retirer en 44 px (`9ad0394f`).
- **Carte produit** (`56786751`) : boutons Restaurer / Retirer / Supprimer `h-11 w-11 md:h-8 md:w-8` (32 px avant).
- **Captures** `.playwright-mcp/screenshots/20260914/` :
  - 375 : `catalogue-p8-retires-375-112900.png`, fenêtre de motif `catalogue-p8-fenetre-motif-375-114000.png`
    (plein écran 375×667, titre, champ, Annuler et Retirer visibles sans défilement, Retirer grisé sans motif ;
    fermée par Annuler, base inchangée : 15 produits retirés, 0 ligne de journal) ; bouton Retirer de carte mesuré 44×44.
  - 768 : `catalogue-p8-retires-768-113400.png` (15 badges « Retiré », boutons Restaurer / Supprimer).
  - 1024 : `catalogue-p8-retires-1024-113600.png` (15 badges, pas de défilement horizontal, 0 erreur).
  - 1440 : `catalogue-p8-retires-1440-114400.png` (15 badges, pas de défilement horizontal, 0 erreur).
  - 1920 : non capturé — `.claude/rules/playwright.md` interdit d'agrandir la fenêtre au-delà de 1440.
- **Défaut pré-existant constaté (hors P8)** : en 375 et 768, la colonne principale du back-office
  (`div.flex.flex-1.flex-col.min-h-0`, en-tête compris) mesure 900 px → défilement horizontal de toute la page,
  titre / filtres / cartes coupés, bouton de carte hors écran à droite en 375. Présent sur toute la mise en page, non
  introduit par P8 ; signalé à Roméo pour un chantier responsive dédié.
- Groupes de variantes hors cycle de vie : noté pour un chantier dédié.
