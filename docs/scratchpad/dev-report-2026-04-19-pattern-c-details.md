# dev-report — Pattern C Details Responsive Migration

**Date** : 2026-04-19
**Branche** : feat/responsive-details
**Task** : Migration responsive Pattern C (detail pages back-office)
**Type-check** : PASS (exit 0)

---

## Perimetre

36 pages detail (`[param]/page.tsx`) auditees.
11 fichiers modifies, 25 deja conformes ou exclus selon regles.

---

## Modifications appliquees

### 1. Remplacement `container mx-auto` → `w-full`

| Fichier                                                     | Occurrences                                    |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `contacts-organisations/customers/[customerId]/page.tsx`    | 3 (loading, error, main)                       |
| `contacts-organisations/suppliers/[supplierId]/page.tsx`    | 3 (loading, error, main)                       |
| `contacts-organisations/contacts/[contactId]/page.tsx`      | 3 (loading, error, main)                       |
| `contacts-organisations/partners/[partnerId]/page.tsx`      | 3 (loading, error, main)                       |
| `contacts-organisations/[id]/page.tsx`                      | 2 (loading, not-found)                         |
| `contacts-organisations/enseignes/[id]/page.tsx`            | 4 (loading, error, not-found + `px-6` wrapper) |
| `produits/catalogue/families/[familyId]/page.tsx`           | 3 (loading, not-found, main)                   |
| `produits/catalogue/categories/[categoryId]/page.tsx`       | 3 (loading, not-found, main)                   |
| `produits/catalogue/subcategories/[subcategoryId]/page.tsx` | 3 (loading, not-found, main)                   |
| `produits/catalogue/collections/[collectionId]/page.tsx`    | 3 (loading, error, main)                       |
| `produits/catalogue/variantes/[groupId]/page.tsx`           | 3 (loading, error, main)                       |
| `messages/[categorie]/page.tsx`                             | 1 (main)                                       |

### 2. Remplacement `grid grid-cols-2` → `grid grid-cols-1 lg:grid-cols-2`

| Fichier                                                            | Detail                                                                           |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `canaux-vente/linkme/analytics/performance/[affiliateId]/page.tsx` | Top Products + Selections 2-col layout                                           |
| `canaux-vente/linkme/catalogue/[id]/page.tsx`                      | Layout principal `md:grid-cols-[3fr_2fr]` → `grid-cols-1 lg:grid-cols-[3fr_2fr]` |

### 3. Remplacement `grid grid-cols-4` → `grid grid-cols-2 lg:grid-cols-4`

| Fichier                                                                          | Detail        |
| -------------------------------------------------------------------------------- | ------------- |
| `canaux-vente/linkme/analytics/performance/[affiliateId]/[selectionId]/page.tsx` | KPI cards row |
| `canaux-vente/linkme/analytics/performance/[affiliateId]/page.tsx`               | KPI cards row |

---

## Fichiers audites sans modification (deja conformes ou hors perimetre)

| Fichier                                                             | Raison                                                    |
| ------------------------------------------------------------------- | --------------------------------------------------------- |
| `canaux-vente/linkme/commandes/[id]/details/page.tsx`               | Deja `grid-cols-1 lg:grid-cols-3`                         |
| `canaux-vente/linkme/commandes/[id]/page.tsx`                       | Deja `grid-cols-1 lg:grid-cols-3`                         |
| `canaux-vente/linkme/enseignes/[id]/page.tsx`                       | Redirect page, pas de layout                              |
| `canaux-vente/linkme/organisations/[id]/page.tsx`                   | Redirect page, pas de layout                              |
| `canaux-vente/linkme/utilisateurs/[id]/page.tsx`                    | Pas de container ni max-w problematique                   |
| `canaux-vente/linkme/stockage/[id]/page.tsx`                        | Pas de container ni max-w problematique                   |
| `canaux-vente/linkme/stockage/[id]/produit/[allocationId]/page.tsx` | `max-w-3xl` intentionnel (regle scope)                    |
| `produits/catalogue/[productId]/page.tsx`                           | `max-w-[1800px]` tres large, non restrictif               |
| `produits/sourcing/produits/[id]/page.tsx`                          | Deja `w-full px-4`                                        |
| `factures/[id]/page.tsx`                                            | Pas de container ni max-w                                 |
| `factures/devis/[id]/page.tsx`                                      | Pas de container ni max-w                                 |
| `factures/[id]/edit/page.tsx`                                       | `max-w-4xl` sur form, intentionnel (regle form max-width) |
| `consultations/[consultationId]/page.tsx`                           | Deja `w-full px-4`                                        |
| `finance/depenses/[id]/page.tsx`                                    | `flex flex-col gap-6`, pas de container                   |
| `admin/users/[id]/page.tsx`                                         | Pas de container ni max-w                                 |
| `parametres/emails/[slug]/edit/page.tsx`                            | Deja `grid-cols-1 lg:grid-cols-3`                         |
| `parametres/emails/[slug]/preview/page.tsx`                         | Deja `grid-cols-1 lg:grid-cols-4`                         |
| `parametres/webhooks/[id]/edit/page.tsx`                            | Deja `grid-cols-1 lg:grid-cols-3`                         |

---

## Cas speciaux notes

- `prises-contact/[id]/page.tsx` : utilise `style={{ maxWidth: '1200px' }}` inline (pas un className), hors perimetre de ce sprint (pattern different). A traiter separement si necessaire.
- Les `page.tsx` de liste (`contacts-organisations/customers/page.tsx`, etc.) conservent `container mx-auto` — ils sont Pattern A, hors perimetre Pattern C.

---

## Validation

- `pnpm --filter @verone/back-office type-check` : **PASS** (exit 0)
- Aucun `any` introduit
- Aucune logique metier modifiee
- Aucun composant cree ou modifie (uniquement wrappers div dans page.tsx)
- Responsive : toutes les pages modifiees utilisent maintenant `w-full` (pleine largeur viewport disponible)
