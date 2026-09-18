# Boucles « une requête par élément » — liste complète (2026-09-11)

Format : `chemin:ligne | type de boucle | ce qui est itéré | requêtes par tour | client/serveur | page ou route`.
Chaque cas relu à la main. Aucune modification.

## A. Séquentielles, requête Supabase écrite dans la boucle (44)

```
apps/back-office/src/app/actions/bank-matching.ts:238 | for-of | orders to match | 6 (5 + generateInvoiceNumber count) | server action | NO IMPORTER (dead code)
apps/back-office/src/lib/orders/cascade-cancel-linked-docs.ts:376 | for-i | linked financial docs | 1 update | server lib | order cancel
apps/linkme/src/lib/hooks/use-update-draft-order.ts:122 | for-of | items to delete | 1 | client | linkme /commandes/[id]/modifier
apps/linkme/src/lib/hooks/use-update-draft-order.ts:129 | for-of | items to update/insert | 1 | client | same
packages/@verone/products/src/hooks/use-variant-group-add.ts:106 | for-of | products added to group | 2 | client | /produits/catalogue/variantes/[groupId]
packages/@verone/products/src/hooks/use-variant-group-products.ts:273 | for-i | remaining group products (reposition) | 1 | client | same
packages/@verone/products/src/hooks/utils/variant-group-propagation.ts:142 | for-of | group products (material) | 1 | client | variant group edit
packages/@verone/products/src/hooks/utils/variant-group-propagation.ts:177 | for-of | group products (color) | 1 | client | same
packages/@verone/products/src/hooks/utils/variant-group-propagation.ts:237 | for-of | group products (rename) | 1 | client | same
packages/@verone/products/src/hooks/sourcing/use-sourcing-create-update.ts:84 | for-i | image files | 1-2 (insert, cleanup) + upload | client | sourcing create
packages/@verone/utils/src/validation/order-status-validator.ts:423 | for-of | order items (stock check) | 1 | shared | exported, callers not traced
packages/@verone/orders/src/validators/order-status.ts:472 | for-of | order items (same function, copied) | 1 | shared | same
packages/@verone/stock/src/hooks/use-stock-dashboard.ts:369 | for-of | purchase orders (supplier name) | 1 | client | /stocks, /stocks/previsionnel
packages/@verone/stock/src/hooks/use-stock-dashboard.ts:402 | for-of | sales orders (customer name) | 1 | client | same
packages/@verone/consultations/src/hooks/use-consultations.ts:558 | for-of | linked quotes | 3 (API DELETE + 2 deletes) | client | /consultations
packages/@verone/consultations/src/hooks/use-consultations-list.ts:308 | for-of | linked quotes (copied logic) | 3 | client | /consultations
packages/@verone/orders/src/hooks/use-sales-orders-mutations.ts:210 | for-of | items to ship | 2 (read + update) | client | sales orders
packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts:141 | for-of | order items (forecast) | 2 | client | sales order create
packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts:176 | for-of | order items (reservation) | 1 | client | same
packages/@verone/orders/src/hooks/purchase-orders/purchase-order-mutations.ts:183 | for-of | items to receive | 2 | client | purchase orders
packages/@verone/orders/src/actions/purchase-receptions.ts:77 | for-of | items to receive | 2 | server action | receptions
packages/@verone/orders/src/actions/purchase-receptions.ts:250 | for-of | items with remainder | 2 | server action | same
packages/@verone/orders/src/actions/sales-shipments.ts:114 | for-of | items to ship | 3 | server action | /stocks/expeditions
packages/@verone/finance/src/components/RapprochementModal/use-rapprochement-data.ts:61 | for-of | existing transaction links | up to 3 (4 in theory) | client | RapprochementModal (/factures, /messages)
packages/@verone/finance/src/components/InvoiceReconciliationSuggestionsPanel/index.tsx:101 | for-of | "excellent" suggestions | 1 rpc | client | FacturesTab
apps/back-office/src/app/(protected)/produits/catalogue/use-bulk-actions.ts:128 | for-of | selected products | 1 update | client | /produits/catalogue
apps/back-office/src/app/(protected)/commandes/fournisseurs/use-fournisseurs-actions.ts:122 | for-of | shortage items | 1 | client | /commandes/fournisseurs
apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-orders.mutations.ts:76 | for-of | order items | 1 | client | linkme orders
apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/hooks.ts:121 | for-of | edited item ids | 1 | client | linkme commandes/[id]/details
apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/catalog/use-price-propagation.ts:157 | for-of | affected selection ids | 1 rpc | client | linkme catalogue
apps/site-internet/src/app/api/cron/validate-ambassador-primes/route.ts:59 | for-of | pending attributions | 1 | server | cron
apps/back-office/src/app/api/meta-commerce/sync-statuses/route.ts:101 | for-of | whole Meta catalog | 1 rpc | server | /api/meta-commerce/sync-statuses
apps/back-office/src/app/api/gmail/watch/refresh/route.ts:71 | for-of | gmail watches (few) | 1 upsert + Gmail API | server | cron
apps/back-office/src/app/api/finance/send-to-accountant/route.ts:330 | for-i | batches | 1 insert + 1 REST PATCH | server | send-to-accountant
apps/back-office/src/app/api/finance/send-to-accountant/route.ts:348 | for-of (nested) | transactions in batch | 1 storage download | server | same
apps/back-office/src/app/api/finance/export-justificatifs/route.ts:152 | for-of | documents | 1 storage download (+ API fetch fallback) | server | export
apps/back-office/src/app/api/finance/export-justificatifs/route.ts:314 | for-of | files | 1 storage download | server | same
apps/back-office/src/app/api/qonto/sync-invoices/route.ts:101 | for-of | all Qonto invoices | up to 7 | server | /api/qonto/sync-invoices
apps/back-office/src/app/api/qonto/invoices/consolidate/route.ts:136 | for-of | Qonto invoices | 2 | server | consolidate
apps/back-office/src/app/api/qonto/invoices/backfill-pdfs/route.ts:84 | for-of | documents | 2 (storage + update) + 3 external | server | backfill-pdfs
apps/back-office/src/app/api/qonto/invoices/_lib/duplicate-guard.ts:44 | for-of | existing proformas | 1 (+ Qonto delete) | server | invoice create
apps/back-office/src/app/api/qonto/quotes/_lib/duplicate-guard.ts:53 | for-of | existing quotes | 1 (+ Qonto delete) | server | quote create
apps/back-office/src/app/api/packlink/shipments/sync/route.ts:95 | for-of | candidate shipments | 1 DB + 1-2 Packlink | server | packlink sync
apps/back-office/src/app/api/sourcing/import/route.ts:476 | for-i | images (max 10) | 1 insert + fetch + Cloudflare | server | sourcing import
```

## B. Séquentielles, appel d'une route `/api` interne (4)

```
apps/site-internet/src/app/api/cron/win-back-check/route.ts:98 | for-of | eligible customers | 1 fetch /api/emails/win-back | server | cron
apps/site-internet/src/app/api/cron/review-request-check/route.ts:54 | for-of | orders (max 50) | 1 fetch /api/emails/review-request | server | cron
packages/@verone/consultations/src/components/modals/use-consultation-email.ts:117 | for-of | linked quotes | 1 fetch PDF | client | consultation email modal
packages/@verone/orders/src/components/modals/use-order-documents-email.ts:85 | for-of | linked docs | 1 fetch PDF | client | order email modal
```

## C. Séquentielles, requête via un helper (19)

```
apps/back-office/src/app/(protected)/contacts-organisations/enseignes/[id]/hooks/use-enseigne-detail.ts:212 | for-of | orgs to add | 2 (update + full fetchEnseignes reload) | client | /contacts-organisations/enseignes/[id]
apps/back-office/src/app/(protected)/contacts-organisations/enseignes/[id]/hooks/use-enseigne-detail.ts:217 | for-of | orgs to remove | 2 | client | same
apps/back-office/src/components/forms/product-selector.tsx:120 | for-of | selected products | ~5 (addProductToVariantGroup) | client | variant groups
apps/back-office/src/app/(protected)/produits/catalogue/collections/hooks.ts:92 | for-of | selected collections | 1 update + reload (1 query + 5 in parallel) | client | /produits/catalogue/collections
apps/back-office/src/app/(protected)/messages/components/payment-notifications-tab.tsx:90 | for-of | unread notifications | 1 (markAsRead) | client | /messages
apps/back-office/src/app/(protected)/parametres/webhooks/use-webhook-management.ts:132 | for-of | webhooks | 1 (logs) | client | /parametres/webhooks
apps/back-office/src/app/api/gmail/inbound/route.ts:291 | for-of | emails | 1-2 | server | /api/gmail/inbound
apps/back-office/src/app/api/emails/linkme-info-request/route.ts:270 | for-of | recipients | 2 inserts + Resend | server | same route
apps/back-office/src/app/api/finance/sync-qonto-attachments/_lib/sync-attachments.ts:170 | for-of | transactions | 2 (storage + update) + Qonto | server | sync-qonto-attachments, cron sync-comptabilite
packages/@verone/finance/src/services/qonto-sync.ts:230 | for-of | Qonto transactions per page | 2 | server | Qonto sync
packages/@verone/finance/src/services/supplier-invoice-sync.ts:110 | for-of | supplier invoices | 2-3 | server | supplier sync
packages/@verone/orders/src/hooks/use-sales-orders-stock.ts:46 | for-of | items | 1 rpc | client | sales orders
packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts:310 | for-of | items | 1 rpc | client | sales order update
packages/@verone/orders/src/components/modals/sales-order-form/hooks/use-sales-order-pricing.ts:42 | for-of | form items | 1 rpc | client | sales order form
packages/@verone/orders/src/components/modals/sales-order-form/hooks/use-sales-order-pricing.ts:133 | for-of | selected products | 2 rpc | client | same
packages/@verone/consultations/src/components/interfaces/ConsultationOrderInterface.tsx:350 | for-of | selected products | fetch /api/consultations/associations + reload | client | consultation detail
packages/@verone/orders/src/components/modals/PurchaseOrderFormModal/hooks.ts:204 | for-of | selected products (edit mode) | insert + reload | client | PO form
packages/@verone/marketing/src/components/CrossPostModal/CrossPostModal.tsx:103 | for-of | channels (few) | 1-2 | client | marketing
apps/back-office/src/app/(protected)/canaux-vente/linkme/catalogue/configuration/hooks.ts:152 | for-of | changed products | 1+ (update, then parallel follow-ups) | client | linkme catalogue config
```

## D. Éventails parallèles `Promise.all(liste.map(...))` (21)

```
packages/@verone/stock/src/hooks/use-stock-inventory.ts:103 | Promise.all map | ALL products | 1 stock_movements select | client | /stocks/inventaire (worst: 1 + 221)
apps/back-office/src/app/api/admin/users/route.ts:76 | Promise.all map | all profiles | 3 (auth admin + role + rpc) | server | /admin/activite-utilisateurs
packages/@verone/categories/src/hooks/use-categories.ts:54 | Promise.all map | all categories | 1 count | client | /produits/catalogue
packages/@verone/stock/src/hooks/use-stock.ts:56 | Promise.all map (via helper) | products | 1 rpc | client | stock movement modals
packages/@verone/stock/src/hooks/use-stock.ts:309 | same | products | 1 rpc | client | same
packages/@verone/products/src/hooks/use-top-products.ts:137 | Promise.all map | top products | 1 | client | no consumer
packages/@verone/products/src/hooks/use-product-variants.ts:119 | Promise.all map | variant siblings | 1 | client | ProductVariantsGrid
apps/back-office/src/app/api/packlink/shipments/pending/route.ts:78 | Promise.all map | shipment groups | 2 | server | packlink pending
apps/back-office/src/app/api/emails/_shared/shipping-tracking-data.ts:175 | map (via helper) | shipments | Packlink + 1 update | server | shipping emails
apps/back-office/src/app/api/qonto/quotes/by-order/[orderId]/route.ts:186 | map (via helper) | matching quotes | 1 | server | same route
packages/@verone/orders/src/components/modals/sales-order-form/hooks/use-sales-order-submit.ts:172 | map (via helper) | items (edit load) | 1 rpc | client | sales order form
packages/@verone/collections/src/hooks/use-collections.ts:65 | map (via helper) | first 5 collections | 1 | client | collections
packages/@verone/finance/src/hooks/pricing/use-product-price.ts:94 | map | batch items | 1 rpc | client | useBatchPricing
packages/@verone/finance/src/components/send-document-helpers.ts:77 | allSettled map | recipients | 1 fetch /api/emails/send-document | client | send document
packages/@verone/finance/src/hooks/unified-transactions/use-transaction-enrichment.ts:309 | nested for with unawaited `void fetch` | tx x doc | 1 fetch auto-attach | client | transactions list
apps/linkme/src/lib/hooks/use-selection-items.ts:446 | map then Promise.all | reorder items | 1 update | client | linkme selection
packages/@verone/products/src/hooks/use-product-images.ts:298 | same | reorder images | 1 | client
packages/@verone/products/src/hooks/use-variant-products.ts:243 | same | reorder variants | 1 | client
packages/@verone/collections/src/hooks/use-collection-images.ts:307 | same | reorder images | 1 | client
apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/use-fetch-order.ts:115 | map | contacts (max 3) | 1 | client
apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/utils/fetch-order.ts:313 | map (via helper) | contacts (max 3) | 1 | client
```

## Vus mais non comptés

- Recherche de slug/SKU libre en boucle : `produits/actions/duplicate-product.ts:65,88` (max 50 essais), `api/linkme/selections/create/route.ts:187` et `canaux-vente/linkme/hooks/use-linkme-selections.mutations.ts:41` (**sans limite**).
- Boucles de reprise ou de pagination : `@verone/utils/src/upload/supabase-utils.ts:247`, `meta-commerce/sync-statuses:59`, `qonto/invoices/consolidate:121`.
- Replis limités à 3 essais : `factures/[id]/use-document-detail.ts:42`, `factures/[id]/edit/page.tsx:83`.
- 2 tours seulement : `cron/sync-comptabilite:78`.
- Un envoi de fichier par fichier (inévitable ; plusieurs rechargent la liste après chaque fichier) : `use-product-images.ts:211`, `use-media-asset-mutations.ts:136`, `use-collection-images.ts:218`, `ProductImageManagement.tsx:91`, `ProductPhotosModal.tsx:74`, `product-images-dashboard.tsx:51` (×2), `ConsultationImageGallery.tsx:131`, `ConsultationPhotosModal.tsx:99`, `UploadAssetModal.tsx:228`, linkme `ProductImageUpload.tsx:65`.
- Faux positifs écartés : 3 `forEach` cookies du middleware, `use-sidebar-counts.ts:496`, `getPublicUrl` (`use-archived-products.ts:85`, `use-consultation-images.ts:96`), `ProductOrVariantPicker.tsx:92`, boucles d'affichage JSX, boucles n'appelant que des API externes.
