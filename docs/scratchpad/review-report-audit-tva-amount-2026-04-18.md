Verdict : PASS

# Review Report — Audit tva_amount (revalidation) — 2026-04-18

Sprint : BO-FIN-009 (Phase 1 prerequis)
Branche : `audit/BO-FIN-009-prerequis-tva-amount`
Fichier audite : `docs/scratchpad/audit-consommateurs-tva-amount.md`

---

## Contexte

Premier audit FAIL avec 4 CRITICAL + 2 WARNING. Dev-agent a applique les 6 corrections. Revalidation point par point ci-dessous.

## Verification des 6 fixes

### CRITICAL 1 — route.context.ts : saveQuoteToLocalDb (section 2b) — INTEGRE

Ligne 88 du document. Formule `avgVat = sum(vatRate) / items.length` documentee, flag **CRITIQUE** present, risque paniers multi-taux explicite. Bug preexistant independant de Phase 1.

### CRITICAL 2 — Fonctions DB section 2a.bis — INTEGRE

Section `2a.bis` creee. `create_purchase_order` documente comme bug latent avec confirmation DB (`purchase_orders.tva_amount` inexistante). 24 PO recentes prouvent que la fonction n'est pas le chemin actif. Non bloquant Phase 1.

### CRITICAL 3 — Section 5a export-fec et export-justificatifs — INTEGRE

Les deux routes ont une confirmation explicite "Non affecte par Phase 1." avec detail des colonnes reellement lues (aucune n'est `tva_amount`).

### CRITICAL 4 — use-expense-form.ts en section 2b — INTEGRE

Ligne 89. Formule Simple (`total_ht * tva_rate / 100`) et Ventilee documentees, `parseFloat(...toFixed(2))` present, coherence avec la contrainte CHECK notee, independance du trigger confirmee.

### WARNING 5 — qonto-sync-upsert.ts producteur JSONB — INTEGRE

Section 3e, ligne 147. Qualifie "Producteur effectif", champ JSONB `bank_transactions.vat_breakdown[].tva_amount` distingue explicitement de `financial_documents.tva_amount`.

### WARNING 6 — 3e condition feu vert multi-taux — INTEGRE

Condition 3 de la section "Feu vert conditionnel" (lignes 344-350). Reference `saveQuoteToLocalDb`, contrainte `check_totals_coherent`, formule erronee `avgVat`, sprint cible BO-FIN-009 Phase 2.

---

## Observations residuelles (INFO, non bloquantes)

### INFO — Position saveQuoteToLocalDb dans le tableau 2b

La ligne est positionnee en fin de tableau section 2b. Si la priorite visuelle est importante, la placer avant les lignes `use-financial-documents.ts` serait plus lisible. Non bloquant.

### INFO — Double nature de qonto-sync-upsert.ts

Le fichier est liste en section 3e comme "Producteur effectif". La categorisation est correcte contextuellement mais un renvoi croise ("voir aussi section 3e") en section 2b eviterait la confusion. Non bloquant.

---

## PR autorisee

Le document est techniquement correct, complet, et les 4 CRITICAL qui auraient pu invalider la base de la Phase 1 sont tous traites. PR `chore` autorisee pour merger l'audit dans staging avant de demarrer Phase 1.

**Feu vert Phase 1 conditionnel a 3 items** :

1. Contrainte CHECK `check_totals_coherent` satisfaite en staging apres migration.
2. `bank-matching.ts` reste coherent (2 occurrences `total_ttc - total_ht`).
3. `saveQuoteToLocalDb` ne viole pas la contrainte sur paniers multi-taux (bug preexistant a corriger Phase 2).
