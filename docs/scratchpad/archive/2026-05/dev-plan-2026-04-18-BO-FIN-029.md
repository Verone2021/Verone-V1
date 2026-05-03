# Dev Plan — BO-FIN-029 — Sync Commande ↔ Devis/Proforma Drafts

_Date: 2026-04-18_

## Objectif

Permettre la régénération manuelle des devis/proformas drafts liés à une commande quand celle-ci a été modifiée après la création du document. Option A hybride : badge "out-of-sync" + modal confirmation + versionning devis + hard delete proforma.

## Décisions techniques prévalidées

- Périmètre : proforma + devis (R4 finance.md)
- Détection out-of-sync : `sales_orders.updated_at > financial_documents.created_at` (volatile, pas de trigger)
- Devis : soft delete (`quote_status = 'superseded'` + `deleted_at`) + révision (colonne `revision_number`)
- Proforma : hard delete Qonto + soft delete local + recréation
- CustomLines/notes : préservées par défaut, cases à cocher dans modal
- Protection R4 : HTTP 409 si status != 'draft'

## Vérification DB

Colonne `revision_number` absente de `financial_documents` (schéma lu) → migration nécessaire.
Colonne `quote_status` présente (TEXT, default 'draft') → utilisable pour 'superseded'.

## Structure des fichiers à créer

### Backend

1. `apps/back-office/src/app/api/qonto/quotes/by-order/[orderId]/regenerate/route.ts`
   - POST /api/qonto/quotes/by-order/[orderId]/regenerate
   - Zod validation body
   - Fetch financial_documents devis drafts liés
   - 409 si aucun draft OU si finalisé
   - deleteClientQuote + soft delete + créer nouveau via logique quotes existante
   - Retourner nouveau devis + ids superseded

2. `apps/back-office/src/app/api/qonto/invoices/by-order/[orderId]/regenerate-proforma/route.ts`
   - POST /api/qonto/invoices/by-order/[orderId]/regenerate-proforma
   - Zod validation body
   - Fetch proforma draft liée
   - 409 si aucune draft OU si finalisée
   - deleteClientInvoice + soft delete + recréer via flow from-order
   - Retourner nouvelle proforma + id supprimée

3. `apps/back-office/src/app/api/qonto/quotes/_lib/duplicate-guard.ts`
   - Symétrique à invoices/\_lib/duplicate-guard.ts
   - checkAndCleanExistingQuotes() pour usage future

### Migration DB

4. `supabase/migrations/20260427_financial_documents_revision_number.sql`
   - ADD COLUMN revision_number INTEGER NOT NULL DEFAULT 1

### UI (packages/@verone/finance)

5. `packages/@verone/finance/src/components/DocumentOutOfSyncBadge.tsx`
   - Props: orderUpdatedAt, documentCreatedAt, documentStatus
   - Affiche si status='draft' ET orderUpdatedAt > documentCreatedAt
   - Badge orange AlertTriangle

6. `packages/@verone/finance/src/components/RegenerateDocumentConfirmModal/index.tsx`
   - Props: open, onOpenChange, documentType, existingCustomLines, existingNotes, onConfirm
   - Liste customLines avec checkbox (toutes cochées par défaut)
   - Notes avec checkbox "Conserver"
   - Bouton orange "Re-synchroniser maintenant"

## Ordre d'implémentation

1. Migration DB revision_number
2. Backend route regenerate quote
3. Backend route regenerate proforma
4. Guard quotes symétrique
5. UI DocumentOutOfSyncBadge
6. UI RegenerateDocumentConfirmModal
7. Export dans index.ts
8. Type-check + build

## Contraintes

- Zero `any` → Zod + types DB
- Respect R1 : items tirés de la commande (jamais de l'ancien devis)
- Respect R2 : prix commande = source, jamais document
- Respect R4 : 409 si status != 'draft'
- Respect R6 : seulement sur commandes modifiables
- Fichiers < 400 lignes
- Pas de modif routes existantes
