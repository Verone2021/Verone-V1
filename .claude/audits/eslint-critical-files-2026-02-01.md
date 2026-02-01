# Audit ESLint - Fichiers Critiques (Top Warnings)

**Date** : 2026-02-01

Fichiers avec le plus de warnings ESLint, à prioriser pour refactoring.

---

## Top 50 Fichiers Problématiques

<<<<<<< Updated upstream
| Rang | Fichier | Warnings | Règles Principales |
|------|---------|----------|--------------------|
| 1 | `apps/back-office/src/app/(protected)/stocks/receptions/page.tsx` | 210 | `@typescript-eslint/no-unsafe-member-access` (122), `@typescript-eslint/no-explicit-any` (24), `@typescript-eslint/no-unsafe-assignment` (23) |
| 2 | `apps/back-office/src/app/(protected)/stocks/expeditions/page.tsx` | 165 | `@typescript-eslint/no-unsafe-member-access` (96), `@typescript-eslint/no-explicit-any` (19), `@typescript-eslint/no-unsafe-assignment` (16) |
| 3 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx` | 67 | `@typescript-eslint/no-unsafe-member-access` (31), `@typescript-eslint/no-explicit-any` (23), `prettier/prettier` (4) |
| 4 | `apps/back-office/src/app/(protected)/parametres/notifications/actions.ts` | 59 | `@typescript-eslint/no-unsafe-member-access` (23), `@typescript-eslint/no-unsafe-call` (19), `@typescript-eslint/no-unsafe-assignment` (12) |
| 5 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/EnseignesSection.tsx` | 58 | `@typescript-eslint/no-unsafe-member-access` (23), `@typescript-eslint/no-unsafe-assignment` (14), `@typescript-eslint/no-unsafe-call` (11) |
| 6 | `apps/back-office/src/app/(protected)/prises-contact/[id]/page.tsx` | 57 | `@typescript-eslint/no-unsafe-member-access` (21), `@typescript-eslint/no-unsafe-call` (17), `@typescript-eslint/no-explicit-any` (6) |
| 7 | `apps/back-office/src/app/api/google-merchant/test-connection/route.ts` | 57 | `@typescript-eslint/no-unsafe-member-access` (22), `@typescript-eslint/no-unsafe-assignment` (21), `@typescript-eslint/no-explicit-any` (9) |
| 8 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-storage.ts` | 55 | `@typescript-eslint/no-unsafe-member-access` (27), `@typescript-eslint/no-unsafe-call` (20), `@typescript-eslint/no-unsafe-assignment` (7) |
| 9 | `apps/back-office/src/app/api/google-merchant/sync-product/[id]/route.ts` | 55 | `@typescript-eslint/no-unsafe-member-access` (27), `@typescript-eslint/no-unsafe-assignment` (12), `@typescript-eslint/no-unsafe-call` (8) |
| 10 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/AffiliatesSection.tsx` | 52 | `@typescript-eslint/no-unsafe-member-access` (17), `@typescript-eslint/no-unsafe-call` (15), `@typescript-eslint/no-unsafe-assignment` (7) |
| 11 | `apps/back-office/src/app/(protected)/factures/[id]/page.tsx` | 52 | `@typescript-eslint/no-unsafe-member-access` (27), `@typescript-eslint/no-unsafe-assignment` (11), `@typescript-eslint/no-unsafe-argument` (11) |
| 12 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-orders.ts` | 45 | `@typescript-eslint/no-unsafe-member-access` (21), `@typescript-eslint/no-unsafe-assignment` (15), `@typescript-eslint/no-explicit-any` (5) |
| 13 | `apps/back-office/src/app/(protected)/finance/livres/page.tsx` | 42 | `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-explicit-any` (7) |
| 14 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/page.tsx` | 40 | `@typescript-eslint/no-unsafe-member-access` (20), `@typescript-eslint/no-unsafe-assignment` (15), `@typescript-eslint/no-explicit-any` (3) |
| 15 | `apps/back-office/src/app/(protected)/produits/catalogue/categories/[categoryId]/page.tsx` | 38 | `@typescript-eslint/no-unsafe-assignment` (17), `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-explicit-any` (5) |
| 16 | `apps/back-office/src/app/api/form-submissions/[id]/messages/route.ts` | 38 | `@typescript-eslint/no-unsafe-member-access` (18), `@typescript-eslint/no-unsafe-call` (11), `@typescript-eslint/no-unsafe-assignment` (6) |
| 17 | `apps/back-office/src/app/(protected)/admin/users/[id]/page.tsx` | 37 | `@typescript-eslint/no-unsafe-member-access` (18), `@typescript-eslint/no-unsafe-assignment` (13), `@typescript-eslint/no-explicit-any` (4) |
| 18 | `apps/back-office/src/app/(protected)/produits/catalogue/variantes/[groupId]/page.tsx` | 37 | `@typescript-eslint/no-unsafe-member-access` (19), `@typescript-eslint/no-explicit-any` (5), `@typescript-eslint/no-unsafe-assignment` (4) |
| 19 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts` | 36 | `@typescript-eslint/no-unsafe-assignment` (13), `@typescript-eslint/no-unsafe-member-access` (12), `@typescript-eslint/no-unsafe-call` (8) |
| 20 | `apps/back-office/src/app/(protected)/consultations/page.tsx` | 36 | `@typescript-eslint/no-unsafe-member-access` (24), `@typescript-eslint/no-explicit-any` (3), `@typescript-eslint/no-unsafe-return` (3) |
| 21 | `apps/back-office/src/app/(protected)/produits/catalogue/categories/page.tsx` | 36 | `@typescript-eslint/no-unsafe-argument` (9), `@typescript-eslint/no-unsafe-assignment` (8), `@typescript-eslint/no-explicit-any` (7) |
| 22 | `apps/back-office/src/app/(protected)/produits/catalogue/families/[familyId]/page.tsx` | 36 | `@typescript-eslint/no-unsafe-assignment` (16), `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-explicit-any` (4) |
| 23 | `apps/back-office/src/app/api/cron/google-merchant-poll/route.ts` | 35 | `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-unsafe-call` (7) |
| 24 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/CommissionsSection.tsx` | 33 | `@typescript-eslint/no-unsafe-call` (11), `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-unsafe-assignment` (4) |
| 25 | `apps/back-office/src/app/(protected)/admin/users/page.tsx` | 30 | `@typescript-eslint/no-unsafe-member-access` (12), `@typescript-eslint/no-unsafe-assignment` (11), `@typescript-eslint/no-explicit-any` (5) |
| 26 | `apps/back-office/src/app/(protected)/factures/[id]/edit/page.tsx` | 30 | `@typescript-eslint/no-unsafe-member-access` (17), `@typescript-eslint/no-unsafe-argument` (9), `@typescript-eslint/no-unsafe-assignment` (3) |
| 27 | `apps/back-office/src/app/(protected)/produits/catalogue/collections/[collectionId]/page.tsx` | 30 | `@typescript-eslint/no-unsafe-member-access` (13), `@typescript-eslint/no-explicit-any` (4), `@typescript-eslint/no-unsafe-assignment` (4) |
| 28 | `apps/back-office/src/hooks/use-archive-notifications.ts` | 29 | `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-unsafe-call` (10), `@typescript-eslint/no-unsafe-assignment` (3) |
| 29 | `apps/back-office/src/components/forms/variant-group-form.tsx` | 28 | `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-unsafe-member-access` (7), `@typescript-eslint/no-explicit-any` (6) |
| 30 | `apps/back-office/src/app/(protected)/finance/transactions/page.tsx` | 27 | `@typescript-eslint/prefer-nullish-coalescing` (12), `@typescript-eslint/no-unsafe-member-access` (7), `@typescript-eslint/no-unsafe-assignment` (3) |
| 31 | `apps/back-office/src/app/(protected)/devis/[id]/page.tsx` | 26 | `@typescript-eslint/no-unsafe-member-access` (13), `@typescript-eslint/no-unsafe-argument` (7), `@typescript-eslint/no-unsafe-assignment` (5) |
| 32 | `apps/back-office/src/app/(protected)/finance/depenses/[id]/page.tsx` | 24 | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-unsafe-call` (5), `@typescript-eslint/no-unsafe-assignment` (4) |
| 33 | `apps/back-office/src/app/(protected)/produits/catalogue/stocks/page.tsx` | 24 | `@typescript-eslint/no-explicit-any` (9), `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-unsafe-member-access` (3) |
| 34 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/enseignes/[id]/page.tsx` | 23 | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-unsafe-assignment` (8), `@typescript-eslint/no-explicit-any` (2) |
| 35 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-enseigne-details.ts` | 23 | `@typescript-eslint/no-unsafe-assignment` (12), `@typescript-eslint/no-unsafe-member-access` (11) |
| 36 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-page-config.ts` | 23 | `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-unsafe-call` (8), `@typescript-eslint/no-unsafe-assignment` (2) |
| 37 | `apps/back-office/src/app/(protected)/organisation/components/partners-tab.tsx` | 23 | `@typescript-eslint/no-unsafe-member-access` (8), `@typescript-eslint/no-unsafe-assignment` (6), `@typescript-eslint/no-explicit-any` (5) |
| 38 | `apps/back-office/src/app/api/catalogue/products/route.ts` | 23 | `@typescript-eslint/no-unsafe-member-access` (14), `@typescript-eslint/no-unsafe-assignment` (9) |
| 39 | `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/CategoriesSection.tsx` | 22 | `@typescript-eslint/no-unsafe-member-access` (14), `@typescript-eslint/no-unsafe-assignment` (4), `@typescript-eslint/no-explicit-any` (2) |
| 40 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/organisations/[id]/page.tsx` | 19 | `@typescript-eslint/no-unsafe-member-access` (7), `@typescript-eslint/no-unsafe-assignment` (5), `@typescript-eslint/prefer-nullish-coalescing` (3) |
| 41 | `apps/back-office/src/app/(protected)/contacts-organisations/contacts/page.tsx` | 19 | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/prefer-nullish-coalescing` (3), `@typescript-eslint/no-explicit-any` (3) |
| 42 | `apps/back-office/src/app/(protected)/factures/qonto/page.tsx` | 19 | `@typescript-eslint/no-unsafe-member-access` (9), `@typescript-eslint/no-unsafe-argument` (6), `@typescript-eslint/no-unsafe-assignment` (3) |
| 43 | `apps/back-office/src/app/(protected)/organisation/components/contacts-tab.tsx` | 19 | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/prefer-nullish-coalescing` (3), `@typescript-eslint/no-explicit-any` (3) |
| 44 | `apps/back-office/src/app/(protected)/prises-contact/page.tsx` | 19 | `@typescript-eslint/no-unsafe-call` (6), `@typescript-eslint/no-unsafe-member-access` (6), `@typescript-eslint/no-unsafe-assignment` (2) |
| 45 | `apps/back-office/src/app/test-purchase-order/page.tsx` | 19 | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-explicit-any` (4), `@typescript-eslint/no-unsafe-assignment` (4) |
| 46 | `apps/back-office/src/components/admin/user-management-table.tsx` | 19 | `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-explicit-any` (4), `@typescript-eslint/no-unsafe-return` (4) |
| 47 | `apps/back-office/src/app/(protected)/avoirs/[id]/page.tsx` | 18 | `@typescript-eslint/no-unsafe-member-access` (8), `@typescript-eslint/no-unsafe-argument` (5), `@typescript-eslint/no-unsafe-assignment` (3) |
| 48 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-affiliates-for-storage.ts` | 18 | `@typescript-eslint/no-unsafe-member-access` (9), `@typescript-eslint/no-unsafe-assignment` (8), `@typescript-eslint/no-unsafe-call` (1) |
| 49 | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-payment-requests-admin.ts` | 17 | `@typescript-eslint/no-unsafe-member-access` (8), `@typescript-eslint/no-unsafe-assignment` (4), `@typescript-eslint/no-unsafe-call` (3) |
| 50 | `apps/back-office/src/app/(protected)/admin/users/[id]/components/user-profile-tab.tsx` | 16 | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-explicit-any` (3), `@typescript-eslint/no-unsafe-return` (3) |
=======
| Rang | Fichier                                                                                               | Warnings | Règles Principales                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `apps/back-office/src/app/(protected)/stocks/receptions/page.tsx`                                     | 210      | `@typescript-eslint/no-unsafe-member-access` (122), `@typescript-eslint/no-explicit-any` (24), `@typescript-eslint/no-unsafe-assignment` (23)        |
| 2    | `apps/back-office/src/app/(protected)/stocks/expeditions/page.tsx`                                    | 165      | `@typescript-eslint/no-unsafe-member-access` (96), `@typescript-eslint/no-explicit-any` (19), `@typescript-eslint/no-unsafe-assignment` (16)         |
| 3    | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/CreateLinkMeOrderModal.tsx`      | 67       | `@typescript-eslint/no-unsafe-member-access` (31), `@typescript-eslint/no-explicit-any` (23), `prettier/prettier` (4)                                |
| 4    | `apps/back-office/src/app/(protected)/parametres/notifications/actions.ts`                            | 59       | `@typescript-eslint/no-unsafe-member-access` (23), `@typescript-eslint/no-unsafe-call` (19), `@typescript-eslint/no-unsafe-assignment` (12)          |
| 5    | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/EnseignesSection.tsx`            | 58       | `@typescript-eslint/no-unsafe-member-access` (23), `@typescript-eslint/no-unsafe-assignment` (14), `@typescript-eslint/no-unsafe-call` (11)          |
| 6    | `apps/back-office/src/app/(protected)/prises-contact/[id]/page.tsx`                                   | 57       | `@typescript-eslint/no-unsafe-member-access` (21), `@typescript-eslint/no-unsafe-call` (17), `@typescript-eslint/no-explicit-any` (6)                |
| 7    | `apps/back-office/src/app/api/google-merchant/test-connection/route.ts`                               | 57       | `@typescript-eslint/no-unsafe-member-access` (22), `@typescript-eslint/no-unsafe-assignment` (21), `@typescript-eslint/no-explicit-any` (9)          |
| 8    | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-storage.ts`                | 55       | `@typescript-eslint/no-unsafe-member-access` (27), `@typescript-eslint/no-unsafe-call` (20), `@typescript-eslint/no-unsafe-assignment` (7)           |
| 9    | `apps/back-office/src/app/api/google-merchant/sync-product/[id]/route.ts`                             | 55       | `@typescript-eslint/no-unsafe-member-access` (27), `@typescript-eslint/no-unsafe-assignment` (12), `@typescript-eslint/no-unsafe-call` (8)           |
| 10   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/AffiliatesSection.tsx`           | 52       | `@typescript-eslint/no-unsafe-member-access` (17), `@typescript-eslint/no-unsafe-call` (15), `@typescript-eslint/no-unsafe-assignment` (7)           |
| 11   | `apps/back-office/src/app/(protected)/factures/[id]/page.tsx`                                         | 52       | `@typescript-eslint/no-unsafe-member-access` (27), `@typescript-eslint/no-unsafe-assignment` (11), `@typescript-eslint/no-unsafe-argument` (11)      |
| 12   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-orders.ts`                 | 45       | `@typescript-eslint/no-unsafe-member-access` (21), `@typescript-eslint/no-unsafe-assignment` (15), `@typescript-eslint/no-explicit-any` (5)          |
| 13   | `apps/back-office/src/app/(protected)/finance/livres/page.tsx`                                        | 42       | `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-explicit-any` (7)           |
| 14   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/page.tsx`                         | 40       | `@typescript-eslint/no-unsafe-member-access` (20), `@typescript-eslint/no-unsafe-assignment` (15), `@typescript-eslint/no-explicit-any` (3)          |
| 15   | `apps/back-office/src/app/(protected)/produits/catalogue/categories/[categoryId]/page.tsx`            | 38       | `@typescript-eslint/no-unsafe-assignment` (17), `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-explicit-any` (5)          |
| 16   | `apps/back-office/src/app/api/form-submissions/[id]/messages/route.ts`                                | 38       | `@typescript-eslint/no-unsafe-member-access` (18), `@typescript-eslint/no-unsafe-call` (11), `@typescript-eslint/no-unsafe-assignment` (6)           |
| 17   | `apps/back-office/src/app/(protected)/admin/users/[id]/page.tsx`                                      | 37       | `@typescript-eslint/no-unsafe-member-access` (18), `@typescript-eslint/no-unsafe-assignment` (13), `@typescript-eslint/no-explicit-any` (4)          |
| 18   | `apps/back-office/src/app/(protected)/produits/catalogue/variantes/[groupId]/page.tsx`                | 37       | `@typescript-eslint/no-unsafe-member-access` (19), `@typescript-eslint/no-explicit-any` (5), `@typescript-eslint/no-unsafe-assignment` (4)           |
| 19   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-dashboard.ts`              | 36       | `@typescript-eslint/no-unsafe-assignment` (13), `@typescript-eslint/no-unsafe-member-access` (12), `@typescript-eslint/no-unsafe-call` (8)           |
| 20   | `apps/back-office/src/app/(protected)/consultations/page.tsx`                                         | 36       | `@typescript-eslint/no-unsafe-member-access` (24), `@typescript-eslint/no-explicit-any` (3), `@typescript-eslint/no-unsafe-return` (3)               |
| 21   | `apps/back-office/src/app/(protected)/produits/catalogue/categories/page.tsx`                         | 36       | `@typescript-eslint/no-unsafe-argument` (9), `@typescript-eslint/no-unsafe-assignment` (8), `@typescript-eslint/no-explicit-any` (7)                 |
| 22   | `apps/back-office/src/app/(protected)/produits/catalogue/families/[familyId]/page.tsx`                | 36       | `@typescript-eslint/no-unsafe-assignment` (16), `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-explicit-any` (4)          |
| 23   | `apps/back-office/src/app/api/cron/google-merchant-poll/route.ts`                                     | 35       | `@typescript-eslint/no-unsafe-member-access` (15), `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-unsafe-call` (7)            |
| 24   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/CommissionsSection.tsx`          | 33       | `@typescript-eslint/no-unsafe-call` (11), `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-unsafe-assignment` (4)           |
| 25   | `apps/back-office/src/app/(protected)/admin/users/page.tsx`                                           | 30       | `@typescript-eslint/no-unsafe-member-access` (12), `@typescript-eslint/no-unsafe-assignment` (11), `@typescript-eslint/no-explicit-any` (5)          |
| 26   | `apps/back-office/src/app/(protected)/factures/[id]/edit/page.tsx`                                    | 30       | `@typescript-eslint/no-unsafe-member-access` (17), `@typescript-eslint/no-unsafe-argument` (9), `@typescript-eslint/no-unsafe-assignment` (3)        |
| 27   | `apps/back-office/src/app/(protected)/produits/catalogue/collections/[collectionId]/page.tsx`         | 30       | `@typescript-eslint/no-unsafe-member-access` (13), `@typescript-eslint/no-explicit-any` (4), `@typescript-eslint/no-unsafe-assignment` (4)           |
| 28   | `apps/back-office/src/hooks/use-archive-notifications.ts`                                             | 29       | `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-unsafe-call` (10), `@typescript-eslint/no-unsafe-assignment` (3)           |
| 29   | `apps/back-office/src/components/forms/variant-group-form.tsx`                                        | 28       | `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-unsafe-member-access` (7), `@typescript-eslint/no-explicit-any` (6)            |
| 30   | `apps/back-office/src/app/(protected)/finance/transactions/page.tsx`                                  | 27       | `@typescript-eslint/prefer-nullish-coalescing` (12), `@typescript-eslint/no-unsafe-member-access` (7), `@typescript-eslint/no-unsafe-assignment` (3) |
| 31   | `apps/back-office/src/app/(protected)/devis/[id]/page.tsx`                                            | 26       | `@typescript-eslint/no-unsafe-member-access` (13), `@typescript-eslint/no-unsafe-argument` (7), `@typescript-eslint/no-unsafe-assignment` (5)        |
| 32   | `apps/back-office/src/app/(protected)/finance/depenses/[id]/page.tsx`                                 | 24       | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-unsafe-call` (5), `@typescript-eslint/no-unsafe-assignment` (4)            |
| 33   | `apps/back-office/src/app/(protected)/produits/catalogue/stocks/page.tsx`                             | 24       | `@typescript-eslint/no-explicit-any` (9), `@typescript-eslint/no-unsafe-assignment` (7), `@typescript-eslint/no-unsafe-member-access` (3)            |
| 34   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/enseignes/[id]/page.tsx`                    | 23       | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-unsafe-assignment` (8), `@typescript-eslint/no-explicit-any` (2)           |
| 35   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-enseigne-details.ts`              | 23       | `@typescript-eslint/no-unsafe-assignment` (12), `@typescript-eslint/no-unsafe-member-access` (11)                                                    |
| 36   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-page-config.ts`            | 23       | `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-unsafe-call` (8), `@typescript-eslint/no-unsafe-assignment` (2)            |
| 37   | `apps/back-office/src/app/(protected)/organisation/components/partners-tab.tsx`                       | 23       | `@typescript-eslint/no-unsafe-member-access` (8), `@typescript-eslint/no-unsafe-assignment` (6), `@typescript-eslint/no-explicit-any` (5)            |
| 38   | `apps/back-office/src/app/api/catalogue/products/route.ts`                                            | 23       | `@typescript-eslint/no-unsafe-member-access` (14), `@typescript-eslint/no-unsafe-assignment` (9)                                                     |
| 39   | `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/CategoriesSection.tsx`    | 22       | `@typescript-eslint/no-unsafe-member-access` (14), `@typescript-eslint/no-unsafe-assignment` (4), `@typescript-eslint/no-explicit-any` (2)           |
| 40   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/organisations/[id]/page.tsx`                | 19       | `@typescript-eslint/no-unsafe-member-access` (7), `@typescript-eslint/no-unsafe-assignment` (5), `@typescript-eslint/prefer-nullish-coalescing` (3)  |
| 41   | `apps/back-office/src/app/(protected)/contacts-organisations/contacts/page.tsx`                       | 19       | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/prefer-nullish-coalescing` (3), `@typescript-eslint/no-explicit-any` (3)      |
| 42   | `apps/back-office/src/app/(protected)/factures/qonto/page.tsx`                                        | 19       | `@typescript-eslint/no-unsafe-member-access` (9), `@typescript-eslint/no-unsafe-argument` (6), `@typescript-eslint/no-unsafe-assignment` (3)         |
| 43   | `apps/back-office/src/app/(protected)/organisation/components/contacts-tab.tsx`                       | 19       | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/prefer-nullish-coalescing` (3), `@typescript-eslint/no-explicit-any` (3)      |
| 44   | `apps/back-office/src/app/(protected)/prises-contact/page.tsx`                                        | 19       | `@typescript-eslint/no-unsafe-call` (6), `@typescript-eslint/no-unsafe-member-access` (6), `@typescript-eslint/no-unsafe-assignment` (2)             |
| 45   | `apps/back-office/src/app/test-purchase-order/page.tsx`                                               | 19       | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-explicit-any` (4), `@typescript-eslint/no-unsafe-assignment` (4)           |
| 46   | `apps/back-office/src/components/admin/user-management-table.tsx`                                     | 19       | `@typescript-eslint/no-unsafe-member-access` (11), `@typescript-eslint/no-explicit-any` (4), `@typescript-eslint/no-unsafe-return` (4)               |
| 47   | `apps/back-office/src/app/(protected)/avoirs/[id]/page.tsx`                                           | 18       | `@typescript-eslint/no-unsafe-member-access` (8), `@typescript-eslint/no-unsafe-argument` (5), `@typescript-eslint/no-unsafe-assignment` (3)         |
| 48   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-linkme-affiliates-for-storage.ts` | 18       | `@typescript-eslint/no-unsafe-member-access` (9), `@typescript-eslint/no-unsafe-assignment` (8), `@typescript-eslint/no-unsafe-call` (1)             |
| 49   | `apps/back-office/src/app/(protected)/canaux-vente/linkme/hooks/use-payment-requests-admin.ts`        | 17       | `@typescript-eslint/no-unsafe-member-access` (8), `@typescript-eslint/no-unsafe-assignment` (4), `@typescript-eslint/no-unsafe-call` (3)             |
| 50   | `apps/back-office/src/app/(protected)/admin/users/[id]/components/user-profile-tab.tsx`               | 16       | `@typescript-eslint/no-unsafe-member-access` (10), `@typescript-eslint/no-explicit-any` (3), `@typescript-eslint/no-unsafe-return` (3)               |
>>>>>>> Stashed changes

---

## Statistiques Globales

- **Total fichiers** : 177
- **Total warnings** : 2712
- **Moyenne warnings/fichier** : 15.3
- **Médiane warnings/fichier** : 7

### Distribution des Warnings

- **1-5 warnings** : 62 fichiers
- **6-10 warnings** : 46 fichiers
- **11-20 warnings** : 30 fichiers
- **21-50 warnings** : 28 fichiers
- **50+ warnings** : 11 fichiers
