# Dev Report — [BO-LINKME-PR-004] Bloc A — Paiements partiels (back-office)

**Date** : 2026-05-21
**Branche** : `feat/BO-LINKME-PR-004-workflow-paiements`
**Commit** : `de6371f4`

---

## Périmètre livré

Bloc A complet : paiements partiels des demandes de paiement LinkMe côté back-office.
Zéro migration SQL (la table `linkme_payments` et le trigger `recompute_payment_request_status` sont déjà en prod depuis les PR-002/PR-003).

---

## Fichiers créés

### `hooks/use-payment-requests-admin.ts` (nouveau)

Deux hooks TanStack Query :

- `usePaymentHistory(requestId)` — SELECT colonnes explicites sur `linkme_payments`, trié par `payment_date ASC`. Type de retour : `PaymentHistoryItem[]`.
- `useAddPayment()` — INSERT dans `linkme_payments` (auth user récupéré pour `paid_by`), suivi d'un appel best-effort au RPC `link_linkme_payment_to_bank_transaction`. `onSuccess` invalide les queryKeys `admin-payment-requests`, `admin-payment-request-detail`, `linkme-payment-history`. Aucun UPDATE sur `linkme_payment_requests.status` — le trigger DB le fait seul.

### `_components/ProcessPaymentModal.tsx` (nouveau)

Modal « Traiter le paiement » :

- Récapitulatif : total dû / déjà payé / restant dû (prop `alreadyPaidTTC`).
- Case à cocher « Paiement de la totalité » : montant = restant dû auto.
- Montant partiel : input number, validé ≤ restant dû + 0.005 (tolérance float).
- Champs : référence obligatoire, date (défaut aujourd'hui), notes optionnel.
- Bouton submit : `void handleSubmit().catch()` — erreur affichée dans le composant, pas avalée.
- Upload justificatif : non traité (prévu Bloc C), commentaire en place.

### `_components/PaymentHistory.tsx` (nouveau)

Tableau des virements d'une demande avec bande récapitulative « Total dû / Versé / Restant ». Bouton « Traiter le paiement » visible uniquement si `remaining > 0.005`. Colonnes Notes masquées sous `lg:`.

### `_components/CommissionsTable.tsx` (nouveau)

Extraction du tableau des commissions incluses, séparé pour respecter la limite `max-lines` sur `[id]/page.tsx`. Calcule ses propres totaux.

---

## Fichiers modifiés

### `_components/types.ts`

- `PaymentRequestStatus` : ajout de `'partially_paid'`.
- `STATUS_LABELS` : `partially_paid → 'Partiellement payée'`.
- `STATUS_CONFIG` : `partially_paid` avec `CircleDollarSign`, `text-amber-600`, `bg-amber-100`.

### `_components/PaymentRequestsTable.tsx`

- Prop renommée `onMarkAsPaid → onProcessPayment`.
- Bouton paiement visible pour `status === 'pending'` **et** `status === 'partially_paid'` (variable `canProcessPayment`).
- Colonne Date masquée sous `lg:` (responsive).

### `_components/PaymentRequestsStats.tsx`

- Grille passée de 4 à 5 colonnes.
- Nouveau compteur « Partiellement payée » (ambre).

### `page.tsx` (liste)

- Import `ProcessPaymentModal` + `usePaymentHistory`, suppression `MarkAsPaidModal`.
- `PaymentModalWrapper` : charge `usePaymentHistory` pour calculer `alreadyPaidTTC` avant d'ouvrir le modal.
- Filtre `<select>` : option `partially_paid` ajoutée.

### `[id]/page.tsx` (détail)

- Bouton « Traiter le paiement » dans l'en-tête (visible si `pending | partially_paid`).
- Section « Historique des virements » via `<PaymentHistory>`.
- `usePaymentHistory` chargé dans la page pour `alreadyPaidTTC → ProcessPaymentModal`.
- Tableau commissions délégué à `<CommissionsTable>`.
- Fichier : 466 lignes (sous la limite 500).

---

## Fichier supprimé

`_components/MarkAsPaidModal.tsx` — remplacé intégralement par `ProcessPaymentModal`.

---

## Vérifications

- `pnpm --filter @verone/back-office type-check` → **0 erreur**
- `pnpm --filter @verone/back-office lint` → **0 erreur, 0 warning**
- Pre-commit hook → **OK**

---

## Notes architecture

- Le trigger DB `recompute_payment_request_status` est le seul à écrire `linkme_payment_requests.status`. Le code n'y touche jamais directement. Si ce trigger est corrigé (Bloc 0 à venir), l'UI s'adapte sans modification.
- `hooks.ts` (ancien fichier dans `_components/`) conserve `useMarkAsPaid`, `usePaymentRequestsAdmin`, `useUploadInvoiceAdmin`. Il n'est PAS supprimé car `UploadInvoiceBackOfficeModal` l'importe encore. Le nettoyage final de `useMarkAsPaid` (devenu orphelin) pourra être fait en Bloc D.

---

## Scope non traité (délibéré)

- Upload justificatif de paiement (Bloc C)
- Email affilié à la clôture (Bloc C)
- Historique côté affilié (Bloc B)
