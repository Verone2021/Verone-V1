# Plan — Cascade commande ↔ documents financiers

**Date** : 2026-04-21
**Task ID** : `[BO-FIN-023]` (next finance ticket dispo)
**Périmètre** : annulation commande + acceptation devis
**Contrainte** : 1 PR = 1 bloc cohérent (règle `workflow.md`)

---

## 1. Règles métier validées par Romeo

### 1.1. Annulation d'une commande (status = draft → cancelled)

Matrice selon les documents liés actifs (`financial_documents` où `sales_order_id = orderId AND deleted_at IS NULL`) :

| Cas | Docs liés                                                                                                     | Comportement attendu                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | aucun                                                                                                         | Annulation simple (comportement actuel)                                                                                                                             |
| B   | `customer_quote` Qonto `draft/pending/finalized` (non accepté) OU `customer_invoice` Qonto `draft` (proforma) | **Cascade auto** : DELETE côté Qonto + soft-delete local + toast info                                                                                               |
| C   | `customer_quote` Qonto `accepted`                                                                             | **Modal garde-fou** : « Le devis DEV-XXX a été accepté. Voulez-vous vraiment annuler la commande et détruire ce devis ? » → si confirm → DELETE Qonto + soft-delete |
| D   | `customer_invoice` Qonto `finalized` / `unpaid` / `paid`                                                      | **REFUS absolu**, toast rouge : « Facture FAC-XXX émise. Créez un avoir d'abord. »                                                                                  |

Note : le cas C est discutable (Qonto permet-il `DELETE` sur un devis accepted non converti ? à tester — sinon on bascule sur refus). Voir section 6.

### 1.2. Acceptation devis côté client (statut Qonto `accepted`)

Quand un devis Qonto passe à `accepted` via `POST /api/qonto/quotes/[id]/accept` :

- Si la commande liée (`financial_documents.sales_order_id`) est en status `draft` → la passer automatiquement en `validated`
- Toutes les cascades de validation existantes s'appliquent (lock prices, stock prévisionnel, commission LinkMe, etc.)
- Modal AVANT l'appel `/accept` : « Ceci validera aussi la commande CMD-XXX. Continuer ? »

### 1.3. Pas de cascade inverse

Valider une commande ne touche PAS au devis draft lié côté Qonto.

---

## 2. Fichiers impactés (lignes précises)

### 2.1. Nouveau helper côté back-office

**Nouveau fichier** : `apps/back-office/src/lib/orders/cascade-cancel-linked-docs.ts`

Responsabilités :

1. Lister les `financial_documents` actifs liés à `orderId`
2. Pour chaque doc : interroger Qonto (`getClientQuoteById` / `getClientInvoiceById`) pour connaître le status réel
3. Retourner un verdict : `{ action: 'proceed', docsToDelete: [] }` | `{ action: 'confirm', reason: string, docsToDelete: [] }` | `{ action: 'refuse', reason: string }`
4. Fonction séparée `executeCascade(docsToDelete)` : appelle les routes DELETE Qonto + soft-delete `financial_documents`

Signature :

```ts
type CascadeVerdict =
  | { action: 'proceed'; docsToDelete: LinkedDoc[] }
  | { action: 'confirm'; reason: string; docsToDelete: LinkedDoc[] }
  | { action: 'refuse'; reason: string };

export async function planCascadeCancel(
  orderId: string
): Promise<CascadeVerdict>;
export async function executeCascade(docs: LinkedDoc[]): Promise<void>;
```

### 2.2. Nouvelle route API orchestratrice

**Nouveau fichier** : `apps/back-office/src/app/api/sales-orders/[id]/cancel/route.ts`

- `POST /api/sales-orders/[id]/cancel` body `{ force?: boolean }`
- Appelle `planCascadeCancel`, applique :
  - `proceed` → `executeCascade` + update status = cancelled
  - `confirm` + `!force` → retourne HTTP 409 avec `{ requireConfirm: true, reason, docsToDelete }`
  - `confirm` + `force` → `executeCascade` + update status
  - `refuse` → HTTP 400 avec `{ error, reason }`

Pourquoi côté serveur : isoler les secrets Qonto + garantir atomicité (cascade suppression puis update status dans une seule transaction logique).

### 2.3. Modif hook côté front

**Fichier** : `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-order-actions.ts`

Dans `handleCancelConfirmed` (lignes 303-361), remplacer l'appel `updateStatusAction(cancelled)` par :

1. Premier appel `POST /api/sales-orders/{id}/cancel` (force=false)
2. Si HTTP 409 `requireConfirm` → ouvrir un second modal garde-fou avec la raison et la liste des docs
3. Sur confirmation du modal garde-fou → second appel `POST /api/sales-orders/{id}/cancel` (force=true)
4. Si HTTP 400 `refuse` → toast rouge avec la raison
5. Si HTTP 200 → toast succès + refresh list + `onOrderUpdated`

### 2.4. Nouveau modal garde-fou

**Fichier enrichi** : `packages/@verone/orders/src/components/sales-orders-table/SalesOrderConfirmDialogs.tsx`

Ajouter un nouvel `AlertDialog` :

- `showCancelGuardDialog`, `onCancelGuardChange`, `onCancelGuardConfirmed`
- Props : `guardReason: string`, `docsToDelete: LinkedDoc[]`
- Contenu : titre rouge « Attention — action critique », texte explicite listant les documents, bouton rouge « Annuler quand même »

Props ajoutées à `SalesOrdersTable` → `SalesOrderModals` → `SalesOrderConfirmDialogs`.

### 2.5. Modif route acceptation devis

**Fichier** : `apps/back-office/src/app/api/qonto/quotes/[id]/accept/route.ts` (lignes 68-94)

Après l'appel Qonto `POST /v2/quotes/${id}/accept` et avant `return`, ajouter :

1. Lire `financial_documents` WHERE `qonto_invoice_id = id` (ou `qonto_quote_id` selon le schéma — vérifier) pour obtenir `sales_order_id`
2. Si `sales_order_id` non null, lire `sales_orders` pour vérifier `status = 'draft'`
3. Si oui : `UPDATE sales_orders SET status = 'validated', confirmed_at = now(), confirmed_by = userId`
4. Les triggers DB existants (`trg_lock_prices_on_validation`, `trigger_so_update_forecasted_out`, etc.) s'appliquent automatiquement
5. Retourner dans la réponse `{ validatedOrder: { id, number } | null }` pour le front

### 2.6. Modif UI acceptation devis

**Fichier** : `apps/back-office/src/app/(protected)/factures/[id]/use-document-actions.ts` (ligne 123 : `handleAccept`)

1. Avant l'appel `/accept`, vérifier si le devis a un `sales_order_id` lié avec une commande en `draft`
2. Si oui, ouvrir un modal de confirmation : « Accepter ce devis validera aussi la commande CMD-XXX. Continuer ? »
3. Si non OU si confirmé, appeler `/accept`
4. Si la réponse contient `validatedOrder`, toast : « Devis accepté + commande CMD-XXX validée »

**Fichier** : `apps/back-office/src/app/(protected)/factures/[id]/DocumentDetailDialogs.tsx`

Ajouter un nouveau `AlertDialog` `AcceptQuoteGuardDialog` : même pattern que les autres dialogs du fichier.

---

## 3. Schéma DB — rien à modifier

Pas de migration nécessaire :

- `financial_documents.sales_order_id` reste en `ON DELETE RESTRICT` (protection comptable)
- Le soft-delete via `deleted_at` suffit pour notre cascade — le DELETE DB reste bloqué sur les docs non soft-deleted (sécurité en profondeur)
- Les cascades existantes (triggers lock prices, stock prévisionnel) continuent de fonctionner à la validation auto

---

## 4. Tests Playwright obligatoires

Nouveau fichier : `tests/e2e/orders-cancel-cascade.spec.ts`

5 cas à couvrir :

1. **Cas A** — annuler commande draft sans docs → status `cancelled`, pas de modal garde-fou
2. **Cas B** — annuler commande draft + devis draft → cascade auto, devis disparu de Qonto, `financial_documents.deleted_at` posé, toast info
3. **Cas C** — annuler commande draft + devis accepted → modal garde-fou, confirm → cascade, toast succès
4. **Cas D** — annuler commande draft + facture unpaid → toast rouge, commande reste en draft
5. **Cas E (validation auto)** — accepter devis finalized lié à commande draft → modal confirmation, confirm → devis accepted + commande validée + stock prévisionnel à jour

Tailles obligatoires : 375 / 768 / 1024 / 1440 / 1920 (règle `responsive.md`).

---

## 5. Sprints de ce bloc (1 PR)

1. **Sprint 1** — helper `planCascadeCancel` + `executeCascade` + tests unitaires
2. **Sprint 2** — route `POST /api/sales-orders/[id]/cancel`
3. **Sprint 3** — modal garde-fou `SalesOrderConfirmDialogs` + branchement `handleCancelConfirmed`
4. **Sprint 4** — modif `/api/qonto/quotes/[id]/accept` + validation auto commande
5. **Sprint 5** — modal confirm acceptation devis côté UI détail devis
6. **Sprint 6** — tests Playwright 5 cas + reviewer-agent PASS + ops-agent merge

Commit + push après chaque sprint. PR draft créée après sprint 3 (pour voir la cascade annulation), promue ready après sprint 6.

Titre PR : `[BO-FIN-023] feat: cascade order cancellation ↔ qonto docs + auto-validate on quote accept`

---

## 6. Points à vérifier pendant l'implémentation

1. **Peut-on DELETE un devis Qonto `accepted` non converti ?** → tester sur un devis de dev ; si non, le cas C bascule en REFUS
2. **Schéma exact de `financial_documents` pour les devis** : colonne `qonto_invoice_id` ou `qonto_quote_id` ? (à grep avant sprint 1)
3. **Webhook Qonto acceptance** : si le client accepte un devis via le lien Qonto directement (pas via notre UI), on rate la cascade. À mettre dans un ticket séparé (sync webhook devis → valide commande) — **hors scope de cette PR**, mais documenter
4. **Race condition** entre deux annulations concurrentes de la même commande → le `ON DELETE RESTRICT` + check status `draft` font office de verrou. OK.

---

## 7. Règles respectées

- `workflow.md` : 1 PR = 1 bloc cohérent ✅
- `code-standards.md` : zero `any`, Zod sur inputs, `createClient<Database>()` typé ✅
- `finance.md` R6 : protection facture émise = refus absolu ✅
- `database.md` : pas de migration destructive, RLS préservée ✅
- `responsive.md` : modals garde-fou responsives (scroll interne mobile) ✅
- `autonomy-boundaries.md` : FEU ORANGE respecté (plan + ok Romeo AVANT code) ✅

---

## 8. Feu vert attendu

Avant d'attaquer les 6 sprints, je demande un simple « ok » à Romeo sur ce plan.

Si des points du plan ne vont pas (ex: préfère le cas C en REFUS plutôt que modal garde-fou, ou veut un webhook Qonto inclus dans ce bloc), il corrige en une phrase et je réajuste le plan AVANT code.
