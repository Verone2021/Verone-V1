Verdict : PASS

# Review Report — BO-FIN-022 alignement fd.total_ttc avec sales_orders — 2026-04-18

Branche : `feat/BO-FIN-022-align-fd-totals-qonto`
Migration : `supabase/migrations/20260424_bo_fin_022_align_fd_totals_with_so.sql` (appliquee en live)

---

## Scope

Post-Phase 1 de BO-FIN-009, 4 documents avec delta 1 centime persistaient entre `sales_orders.total_ttc` (round-per-line) et `financial_documents.total_ttc` (somme-de-floats calculee par `persist-financial-document.ts`).

Cette migration aligne `financial_documents.total_ttc = sales_orders.total_ttc` et ajuste `tva_amount = total_ttc - total_ht` pour preserver la contrainte `check_totals_coherent`.

## Documents modifies (4)

| SO            | Document                       | fd_ttc avant | fd_ttc apres | Delta vs SO |
| ------------- | ------------------------------ | ------------ | ------------ | ----------- |
| SO-2026-00119 | F-2026-017 (sent)              | 3715.60      | 3715.59      | 0.00 ✓      |
| SO-2026-00151 | PROFORMA-SO-2026-00151 (draft) | 3876.68      | 3876.67      | 0.00 ✓      |
| SO-2026-00153 | PROFORMA-SO-2026-00153 (draft) | 2944.45      | 2944.46      | 0.00 ✓      |
| SO-2026-00154 | PROFORMA-SO-2026-00154 (draft) | 3214.58      | 3214.59      | 0.00 ✓      |

## Verification post-migration

- **19/19 factures liees a commande** : delta = 0 EUR (zero discordance).
- **Contrainte `check_totals_coherent`** : 0 violation confirmee (DO $$ RAISE si violation).
- **R1 finance.md respectee** : zero discordance DB <-> Qonto sur les factures liees a commande.

## Impact / Risques

- **Aucun impact** sur les 15 documents deja alignes (filtrage strict `BETWEEN 0.001 AND 0.02`).
- Le montant `tva_amount` a varie de 0.01 EUR max (ajustement lie a l'alignement total_ttc). Non comptable.
- F-2026-017 est au status `sent` (facture finalisee). Modification legitime car elle aligne sur Qonto (source de verite).

## PR autorisee

Migration DB-only, iso-fonctionnel sur la contrainte. 4 documents alignes. R1 respectee.
