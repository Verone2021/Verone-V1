# Audit — État du transfert comptable Welyb + flux 2025 (BO-COMPTA-001)

**Date** : 2026-06-26
**Branche** : `feat/BO-COMPTA-001-cloture-welyb`
**Type** : audit lecture seule (aucune modif code) — base + cockpit Finance/Bibliothèque & Clôture

---

## 0. Confirmation préalable : la chaîne d'envoi Welyb MARCHE

Vérifié côté portail `audamex.welyb.fr` (cf. addendum `dev-report-2026-06-25`). La facture test RESB
est bien arrivée et a été classée auto par Welyb dans **Dossiers comptables annuels → Exercice 2026
→ Ventes → Juin 2026**. Aucun bug d'envoi. La fausse alerte venait du délai OCR (~45 min) + du fait
que Welyb classe direct dans le dossier annuel, pas dans « À classer ».

---

## 1. Bilan chiffré 2025 (source : `bank_transactions`, settled_at 2025)

| Scope  | Total | Ignorées | Avec pièce (prêtes) | Manquantes | Dont dispo via sync Qonto | Dont à chercher main | À compléter (TVA/PCG) | Déjà transférées |
| ------ | ----- | -------- | ------------------- | ---------- | ------------------------- | -------------------- | --------------------- | ---------------- |
| Achats | 195   | 0        | **37**              | 153        | 8                         | 145                  | 3                     | 0                |
| Ventes | 72    | 6        | **0**               | 61         | 0                         | 61                   | 0                     | 0                |

- **Prêtes à envoyer aujourd'hui** : 37 pièces achats. 0 vente.
- **À collecter** : ~206 pièces (145 achats + 61 ventes à la main, 8 achats via 1 clic sync Qonto).
- **Aucune** des manquantes n'est auto-reliée à une facture Vérone existante (`matched_document_id` NULL partout) → pas d'auto-rapprochement depuis les factures déjà émises.

---

## 2. Ce qui EST implémenté ✅

| Capacité                                                                                     | Statut | Localisation                                                                                            |
| -------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| Sélecteur d'année (2023→courante), 2025 OK                                                   | ✅     | `finance/cloture/page.tsx:69-120` (défaut 2025) ; arbre `bibliotheque/page.tsx:63-86`                   |
| « Préparer Welyb Achats/Ventes » = TOUTES les pièces éligibles de l'année (pas de sélection) | ✅     | `_shared-comptable/cloture-global-actions` → `POST /api/finance/send-to-accountant {scope, year}`       |
| Filtrage serveur année + non-transférées + `local_pdf_path NOT NULL`                         | ✅     | `send-to-accountant/route.ts:212-236`                                                                   |
| Compteurs dynamiques par année (présentes/manquantes/à compléter/transférées)                | ✅     | `_shared-comptable/use-cloture-data.ts:340-362`                                                         |
| Liste pièces manquantes + dépôt                                                              | ✅     | `bibliotheque/_components/missing-documents-section.tsx`, `_shared-comptable/cloture-upload-dialog.tsx` |
| Correction TVA (route `vat_rate`, `vat_source='manual'`, `amount_ht/vat`)                    | ✅     | `cloture-vat-pcg-dialog.tsx` → `POST /api/transactions/update-vat`                                      |
| Correction code comptable PCG (`category_pcg`)                                               | ✅     | `cloture-vat-pcg-dialog.tsx` (update Supabase direct)                                                   |
| Suivi « transféré » + anti-double-envoi                                                      | ✅     | `transferred_to_accountant_at` + filtre route                                                           |
| Sync Qonto (bouton manuel + cron 5h) → écrit `local_pdf_path`                                | ✅     | `sync-qonto-attachments/*`                                                                              |
| Liste « manquantes » = vue `v_library_missing_documents WHERE has_attachment=false`          | ✅     | migration `20260401200000_restore_v_library_documents.sql`                                              |

---

## 3. GAPS à corriger pour le flux 2025 voulu par Roméo ❌

### GAP 1 — Envoi réel IMPOSSIBLE depuis l'écran (bloquant #1)

`welyb-plan-dialog.tsx:110-116` : le bouton « Confirmer l'envoi » est `disabled` **en dur**.
Aujourd'hui l'UI ne fait que la **prévisualisation** (dry-run). L'envoi réel n'existe que via appel
API direct avec `ACCOUNTANT_SEND_ENABLED=true` (serveur) + `confirmSend:true` (body) — c'est ainsi
que le test RESB a été fait, pas depuis le bouton.
→ **À faire** : activer le bouton quand le flag serveur est ON (+ modale de confirmation claire),
et décider de la valeur de `ACCOUNTANT_SEND_ENABLED` en local/prod. Action financière sortante →
**décision Roméo**.

### GAP 2 — Le dépôt d'une pièce ne crée PAS le rapprochement immédiatement (bloquant #2)

`POST /api/qonto/attachments/upload/route.ts:170-180` met à jour **la colonne `attachment_ids`**
uniquement. Or :

- `has_attachment` est une colonne **GENERATED** calculée depuis **`raw_data->'attachments'` /
  `raw_data->'attachment_ids'`** (vérifié : `generation_expression`), PAS depuis la colonne
  `attachment_ids`. Le commentaire ligne 170-171 du code (« recalcule automatiquement ») est **faux**.
- `local_pdf_path` n'est **pas** écrit (alors que le fichier vient d'être sauvé dans le bucket
  `justificatifs` à `storagePath`, ligne 136 — il suffirait de le brancher).

Conséquences : après un dépôt manuel, la pièce **reste affichée « manquante »** (vue basée sur
`has_attachment`) ET **n'est pas envoyable Welyb** (`local_pdf_path` NULL). Elle ne se « rapproche »
qu'après la **prochaine synchro Qonto** (bouton « Pièces Qonto » ou cron 5h) qui re-tire `raw_data`
depuis Qonto + télécharge le PDF.

→ **À faire** : dans la route upload, écrire aussi `local_pdf_path = storagePath`, `pdf_stored_at`,
et propager dans `raw_data->'attachment_ids'` pour que `has_attachment` bascule → dépôt = rapprochement
instantané. ⚠️ Route sous `/api/qonto/*` marquée IMMUABLE (CLAUDE.md) → **décision Roméo** obligatoire.
**Workaround dispo aujourd'hui** : après dépôt, cliquer « Pièces Qonto » (sync) → les pièces déposées
deviennent présentes + envoyables.

### GAP 3 (amélioration) — Auto-rapprochement des ventes 2025 depuis les factures Vérone

Les 61 ventes 2025 sans pièce sont des factures émises par Vérone (`financial_documents`) mais non
reliées aux transactions bancaires. Un auto-match (transaction crédit ↔ facture Vérone du même
montant/date) éviterait de re-télécharger 61 PDF à la main. **Non implémenté** — à proposer si Roméo
veut accélérer les ventes.

---

## 4. Réponse directe « puis-je déjà tout envoyer 2025 depuis localhost ? »

- **Voir ce qui manque** : OUI, immédiatement (page Clôture/Bibliothèque, année 2025, compteurs + liste).
- **Corriger TVA / compte comptable** : OUI.
- **Déposer une pièce** : OUI, mais elle ne se rapproche/n'est envoyable qu'après une synchro Qonto
  (GAP 2). Pas « instantané » comme voulu.
- **Envoyer réellement à Welyb depuis le bouton** : NON aujourd'hui (GAP 1, bouton désactivé). Seules
  les 37 achats avec pièce seraient éligibles, et il faut lever le verrou + activer le bouton.

---

## 5. Reste de chantier déjà connu (rappel)

- Régénération types Supabase (drift CI, jeton à renouveler — couvre `transferred_to_accountant_at`).
- Redécoupage 2 fichiers > 400 l (`cloture-table.tsx`, `send-to-accountant/route.ts`).
