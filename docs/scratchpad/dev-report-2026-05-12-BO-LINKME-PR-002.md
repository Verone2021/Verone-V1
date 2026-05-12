# Rapport de développement — BO-LINKME-PR-002

# Système demandes de paiement LinkMe — Finalisation complète

**Date :** 2026-05-12  
**Branche :** `fix/BO-LINKME-PR-002`  
**Statut :** ✅ Terminé

---

## Résumé des corrections

6 sprints exécutés. Système opérationnel après 8 mois de blocage.

### S1 — Migration DB (blocker principal) ✅

**Fichier :** `supabase/migrations/20260512140000_add_order_date_linkme_commissions.sql`

Colonne `order_date date` ajoutée à `linkme_commissions`, backfillée depuis `sales_orders.order_date` via `order_id` FK. 130 lignes mises à jour. Index créé pour tri chronologique.

**Vérification :** `SELECT order_date FROM linkme_commissions LIMIT 5` → dates non-nulles ✅

**Cause racine résolue :** erreur PostgreSQL `42703 — column linkme_commissions_1.order_date does not exist` qui bloquait toute la page détail depuis la création du système (déc 2025).

### S2 — Bouton œil dans PaymentRequestsTable ✅

**Fichier :** `apps/back-office/src/app/(protected)/canaux-vente/linkme/demandes-paiement/_components/PaymentRequestsTable.tsx`

Bouton Eye ajouté en première action dans la colonne Actions. `Eye` importé depuis lucide-react.

### S3 — Bouton "Annuler demande" ✅

**Fichiers modifiés :**

- `_components/hooks.ts` : mutation `useAdminCancelPaymentRequest()` ajoutée
- `[id]/page.tsx` : bouton "Annuler la demande" visible uniquement sur `pending` / `invoice_received`. Confirmation dialog avant action. La page se rafraîchit après annulation via `fetchData()`.

### S4 — Bucket Storage `linkme-invoices` ✅

Bucket créé via MCP Supabase (`execute_sql`) car inexistant en production.

**Bucket :** `linkme-invoices`, privé, limite 10 Mo, PDF/images.

**4 politiques RLS Storage créées :**

- `affiliates_upload_invoice` — affilié peut uploader dans son propre dossier
- `affiliates_read_own_invoice` — affilié peut lire ses fichiers
- `affiliates_delete_own_invoice` — affilié peut supprimer (re-upload)
- `staff_read_invoices` — back-office lit tout via `is_backoffice_user()`

### S5 — Page détail LinkMe affilié ✅

**Fichier créé :** `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`

Utilise `usePaymentRequestDetail(id)`. Affiche :

- N° demande + badge statut
- Montant TTC, nombre de commandes
- Si `paid` : date + référence paiement
- Si `pending` : bouton upload facture → modal inline
- Lien vers facture uploadée si disponible
- Liste des commissions avec N° commande, date, rémunération TTC

**Hook mis à jour :** `use-payment-requests.ts` — `order_date` ajouté dans le select et utilisé dans le mapping (au lieu de `created_at`).

**Liste mise à jour :** bouton "Voir le détail" ajouté dans `PaymentRequestRow`.

### S6 — Nettoyage TypeScript casts ✅

Types Supabase régénérés via `mcp__supabase__generate_typescript_types` (le fichier `supabase.ts` était vide — 0 octets, cause des errors TS2306 pré-existantes).

**Casts supprimés :**

- `hooks.ts` : 3 occurrences de `as 'linkme_affiliates'`
- `[id]/page.tsx` : 2 occurrences de `as 'linkme_affiliates'`

**Résultat :** `pnpm --filter @verone/back-office type-check` → 0 erreur  
**Résultat :** `pnpm --filter @verone/linkme type-check` → 0 erreur

---

## Vérification Playwright

Page détail back-office (`/canaux-vente/linkme/demandes-paiement/e949f90c-e4d1-445b-86bd-861031561795`) :

- ✅ PR-2026-000001 affichée
- ✅ Statut "Payée", affilié "Pokawa", montant 29 721,33 € TTC
- ✅ 91 commandes avec dates correctes (mai 2023 → juil 2025)
- ✅ 0 erreur console

Page liste back-office :

- ✅ Bouton œil visible dans Actions
- ✅ 0 erreur console

---

## Fichiers modifiés / créés

| Fichier                                                                       | Action   |
| ----------------------------------------------------------------------------- | -------- |
| `supabase/migrations/20260512140000_add_order_date_linkme_commissions.sql`    | CRÉÉ     |
| `packages/@verone/types/src/supabase.ts`                                      | RÉGÉNÉRÉ |
| `apps/back-office/.../demandes-paiement/_components/PaymentRequestsTable.tsx` | MODIFIÉ  |
| `apps/back-office/.../demandes-paiement/_components/hooks.ts`                 | MODIFIÉ  |
| `apps/back-office/.../demandes-paiement/[id]/page.tsx`                        | MODIFIÉ  |
| `apps/linkme/src/lib/hooks/use-payment-requests.ts`                           | MODIFIÉ  |
| `apps/linkme/src/app/(main)/commissions/demandes/[id]/page.tsx`               | CRÉÉ     |
| `apps/linkme/src/app/(main)/commissions/demandes/page.tsx`                    | MODIFIÉ  |
| `docs/current/database/schema/06-linkme.md`                                   | RÉGÉNÉRÉ |
