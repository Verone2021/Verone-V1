# Comptabilité — Bibliothèque, pièces manquantes, récupération Qonto & transfert au comptable

**Source de vérité fonctionnelle** du chantier `BO-COMPTA-001`. Décrit comment les pièces
comptables sont rangées, comment on détecte ce qui manque, comment les pièces Qonto sont
récupérées (manuellement + automatiquement), et comment on transfère au cabinet comptable
(Audamex / portail Welyb).

Complémentaire de `.claude/rules/finance.md` (règles métier R1–R8) et de
`docs/current/finance/finance-reference.md` (PCG, matching rules, rapprochement).

---

## 1. Rangement Achats / Ventes / Avoirs

La Bibliothèque comptable (`/finance/bibliotheque` + écran de clôture `/finance/cloture`)
s'appuie sur la vue `v_library_documents` qui unifie 3 sources :

| Source                                              | Devient               | Sens                  |
| --------------------------------------------------- | --------------------- | --------------------- |
| `financial_documents` (factures/avoirs Qonto 2026+) | selon `document_type` | inbound / outbound    |
| `bank_transactions` `side='debit'` AVEC pièce       | `supplier_invoice`    | **inbound = Achats**  |
| `bank_transactions` `side='credit'` AVEC pièce      | `customer_invoice`    | **outbound = Ventes** |

- **Achats** = `document_direction = 'inbound'` ; **Ventes** = `'outbound'`.
- **Avoirs** = `document_type IN ('supplier_credit_note','customer_credit_note')`
  (corrigé `BO-COMPTA-001` : le filtre cherchait l'ancien littéral `'credit_note'` → 0 résultat).
- **Homogénéité achats/ventes** (corrigé `BO-COMPTA-001`) : les deux côtés n'affichent que les
  mouvements AVEC pièce. Les mouvements sans pièce vivent dans `v_library_missing_documents`.

## 2. Détection des pièces manquantes

Vue `v_library_missing_documents` = mouvements bancaires **sans pièce**, c.-à-d.
`has_attachment = false`, **hors** :

- virements internes sans contrepartie (`operation_type='transfer' AND counterparty_organisation_id IS NULL`),
- mouvements ignorés (`ignored_at IS NOT NULL`),
- mouvements à justificatif optionnel (`justification_optional = true`, ex. compte courant associé PCG 455).

La détection « pièce présente » repose **uniquement sur `has_attachment` / `local_pdf_path`**,
jamais sur `matching_status` (un mouvement « classé par règle » n'a pas forcément de justificatif).

## 3. Récupération des pièces Qonto (2 niveaux)

1. **À l'ouverture (store-on-read)** — existant : `api/qonto/attachments/[id]` télécharge la pièce
   depuis Qonto et la stocke dans le bucket `justificatifs/YYYY/MM/`, en posant `local_pdf_path` +
   `pdf_stored_at` sur la transaction.
2. **En masse, à la demande** — `POST /api/finance/sync-qonto-attachments` (`{year?, transactionIds?}`) :
   rapatrie toutes les pièces `has_attachment=true AND local_pdf_path IS NULL`. Bouton « Pièces Qonto »
   dans l'écran de clôture. Logique partagée : `sync-qonto-attachments/_lib/sync-attachments.ts`.
3. **Automatique chaque nuit** — `GET /api/cron/sync-comptabilite` (cron Vercel `0 5 * * *`,
   protégé `CRON_SECRET`) : sync des transactions Qonto (`/api/qonto/sync`) + rapatriement des pièces
   (année courante + précédente). **Aucun envoi au comptable.** Coût nul (cron déjà en place).

> Important : une pièce ne peut être récupérée que si elle existe sur Qonto. Les mouvements
> « manquants » qui n'ont aucune pièce sur Qonto doivent être fournis manuellement (dépôt).

## 4. Correction TVA / code comptable

- `POST /api/transactions/update-vat` pose `vat_source = 'manual'` à chaque correction.
- Signalements calculés dans l'écran de clôture : « TVA à vérifier » (`vat_rate` ou `vat_source` nuls),
  « PCG manquant » (`category_pcg` nul). Au 2026-06-18 : 159 mouvements 2025 avaient une TVA sans source.

## 5. Suivi « transféré au comptable »

- Colonnes `transferred_to_accountant_at` / `_by` sur `bank_transactions` et `financial_documents`
  (migration `20260618101000`). NULL = non transféré.
- Renseignées **uniquement** lors d'un envoi manuel réussi. Badge « Transféré le … » + filtre
  « non transférés » dans l'écran de clôture. Historique des envois dans `document_emails`.

## 6. Transfert au comptable — Welyb (Audamex)

Dépôt **par email** (collecte Welyb), une adresse par catégorie :

| Catégorie              | Adresse                   |
| ---------------------- | ------------------------- |
| Factures de **ventes** | `ventes+verone@welyb.fr`  |
| Factures d'**achats**  | `compta+verone@welyb.com` |

- `POST /api/finance/send-to-accountant` (`{scope:'achats'|'ventes', year, transactionIds?, confirmSend?}`).
- **PDF joints un par un**, **lots de 35 max**, email **sobre** (texte brut, sans logo/signature —
  contrainte OCR Welyb), expéditeur `ACCOUNTANT_FROM_EMAIL` (no-reply), via Resend.
- **Double garde-fou (aucun envoi accidentel)** : un envoi réel n'a lieu que si
  `confirmSend === true` **ET** `ACCOUNTANT_SEND_ENABLED === 'true'`. Sinon → **prévisualisation**
  (plan d'envoi retourné, rien envoyé, rien écrit). Le bouton « Confirmer » de l'UI est désactivé
  tant que la configuration n'est pas validée par Roméo.

### Variables d'environnement (Vercel)

`WELYB_VENTES_EMAIL`, `WELYB_ACHATS_EMAIL`, `ACCOUNTANT_FROM_EMAIL`, `ACCOUNTANT_SEND_ENABLED`
(laisser `false` jusqu'à validation), `CRON_SECRET` (déjà utilisé par les autres crons).

## 7. Écran unique de clôture (`/finance/cloture`)

Tout au même endroit, par année (def. 2025) : liste unifiée présentes + manquantes, onglets
Achats/Ventes/Avoirs, filtre « non transférés », pastilles de signalement, compteurs globaux ;
actions ligne (voir / déposer / corriger TVA+PCG / ignorer) et globales (récupérer Qonto /
préparer l'envoi Welyb en prévisualisation).

## Références

- Migrations `BO-COMPTA-001` : `20260618100000` (cohérence vues), `20260618101000` (tracking transfert),
  `20260618102000` (cohérence rapprochement).
- Découverte Welyb : `docs/scratchpad/dev-report-2026-06-17-BO-COMPTA-WELYB-001-decouverte-depot.md`.
- Mémoire : `compta-welyb-depot`.
