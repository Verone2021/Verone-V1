# dev-report — [BO-COMPTA-002] Test d'envoi réel Welyb (1 facture) + correctifs

**Date** : 2026-06-25
**Branche** : `feat/BO-COMPTA-001-cloture-welyb`
**Statut** : ✅ test réel réussi, anti-double-envoi confirmé, correctifs commités, type-check + lint verts

---

## Objectif

Valider la chaîne d'envoi réel d'UNE pièce au cabinet Welyb (sans envoi de masse), et
vérifier qu'une pièce déjà envoyée **ne peut pas repartir une 2ᵉ fois**.

## Pièce de test

S.A.R.L. RESB — vente 112,80 € du 30/01/2026 — `id 30869166-f843-498c-8b47-ae90487d57b5`.
Scope ventes → `ventes+verone@welyb.fr`. (Choix d'une vraie vente ; le crédit « Qonto 11,24 € »
écarté car c'est un remboursement, cas limite du mapping crédit=vente.)

## Bug corrigé AVANT le test — contrainte `document_emails`

Migration `supabase/migrations/20260625120000_bo_compta_002_document_emails_batch_type.sql` :
élargit le CHECK `document_type` pour inclure `'bank_transaction_batch'`. Sans ça, le journal
d'envoi échouait silencieusement (l'email partait mais aucune trace `document_emails`).
Appliquée + doc DB régénérée.

## Déroulé + résultats

| Étape                                                                      | Résultat                                                               |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Dry-run (sans confirmSend)                                                 | 1 pièce, 1 lot, dest. `ventes+verone@welyb.fr`, exp. Vérone ✓          |
| Envoi réel (`confirmSend:true`, `ACCOUNTANT_SEND_ENABLED=true` temporaire) | `piecesSent:1, errors:[]` ✓                                            |
| Livraison email (API Resend, id `d1461638-…`)                              | `last_event: delivered` vers `ventes+verone@welyb.fr` ✓                |
| Base — `bank_transactions.transferred_to_accountant_at`                    | rempli (2026-06-25 01:28) + `_by` user ✓                               |
| Base — `document_emails`                                                   | 1 ligne `bank_transaction_batch`, status `sent`, `resend_email_id` ✓   |
| **Anti-double-envoi** (2ᵉ appel même pièce, confirmSend:true)              | **0 pièce éligible — « Aucune pièce éligible à envoyer »** ✓           |
| UI Bibliothèque                                                            | pastille verte **« Envoyé le 25/06/26 »** + compteur Transférées = 1 ✓ |

## 2ᵉ bug corrigé — affichage du statut « transféré »

`_shared-comptable/use-cloture-data.ts` : la lecture de `transferred_to_accountant_at` (faite via
REST car la colonne est hors types générés) utilisait la **clé anonyme** → bloquée par la RLS
(`is_backoffice_user()`) → le statut « envoyé » restait invisible (compteur Transférées = 0, pas de
pastille). Corrigé : on présente désormais le **JWT de la session connectée**
(`supabase.auth.getSession()`) dans l'en-tête `Authorization`. Vérifié à l'écran (pastille + compteur OK).

`_shared-comptable/card-signal-badge.tsx` : priorité de la pastille dominante ajustée pour que
**« Envoyé le X » passe avant** « PCG manquant » / « TVA à vérifier » (statut milestone visible en premier).

## Garde-fou rétabli

`ACCOUNTANT_SEND_ENABLED` retiré de `apps/back-office/.env.local` (verrou réactivé après restart
back-office). Le bouton « Confirmer l'envoi » de l'UI reste désactivé de toute façon.

## Note Welyb

Email **livré** (preuve Resend). Vérification/suppression dans le portail `audamex.welyb.fr` non
faite : identifiants Welyb absents de `.claude/test-credentials.md`. À fournir si on veut que
l'agent gère le portail, sinon Roméo vérifie/supprime côté Welyb.

## Checks

- `pnpm --filter @verone/back-office type-check` : ✅
- `pnpm --filter @verone/back-office lint` : ✅

## Reste (chantier BO-COMPTA-001)

Régénération des types Supabase (drift CI, jeton à renouveler — couvre aussi
`transferred_to_accountant_at` hors types). Rien mis en ligne sans GO Roméo.
