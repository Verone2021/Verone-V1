# Dev Report — Responsive Forms Back-Office

**Date** : 2026-04-19
**Branche** : feat/responsive-final-cleanup
**Type** : feat (migration responsive)
**Checks** : type-check EXIT 0 | lint EXIT 0

---

## Mission

Audit et migration responsive de tous les formulaires locaux back-office.
Patterns cibles : grilles `grid-cols-N` sans prefix responsive, touch targets < 44px,
boutons submit non full-width sur mobile.

---

## Fichiers MODIFIES (14 fichiers)

### User Create/Edit — LinkMe

1. `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/user-create/NamePhoneSection.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (Prenom/Nom)

2. `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/user-create/RoleEnseigneSection.tsx`
   - `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (selecteur de role)

3. `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/user-edit/ProfileSection.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (Prenom/Nom)

4. `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/user-edit/PasswordSection.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (nouveauMDP/confirmer)

5. `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/user-edit/RoleSection.tsx`
   - `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (selecteur de role)

### Contacts/Adresses — LinkMe

6. `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/contacts/NewAddressForm.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (SIRET/TVA)
   - `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (CodePostal/Ville)

7. `apps/back-office/src/app/(protected)/canaux-vente/linkme/enseignes/[id]/components/EditContactDialog.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (Prenom/Nom)

8. `apps/back-office/src/app/(protected)/canaux-vente/linkme/enseignes/[id]/components/EnseigneContactsSection.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (Prenom/Nom dans dialog creation)

9. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/EditDeliveryAddressDialog.tsx`
   - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (CodePostal/Ville)

10. `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/components/EditDialogs.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (CodePostal/Ville)

11. `apps/back-office/src/app/(protected)/canaux-vente/linkme/messages/components/AddressEditDialog.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (CodePostal/Ville)

### Notifications / Messages

12. `apps/back-office/src/app/(protected)/canaux-vente/linkme/messages/components/NotificationsTab.tsx`
    - `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (selecteur priorite — PrioritySelector)
    - `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` (selecteur destinataires)
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (action label + URL)

### Parametres / Notifications

13. `apps/back-office/src/app/(protected)/parametres/notifications/components/EmailRecipientsSection.tsx`
    - `flex gap-3` → `flex flex-col sm:flex-row gap-3` (input + bouton Ajouter)
    - Bouton Ajouter : `w-full sm:w-auto` ajout
    - Bouton Trash : `p-2 md:p-1.5 h-11 w-11 md:h-9 md:w-9` (touch target 44px mobile)

### Site Internet — Promo Codes

14. `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/promo-codes-form.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (4 occurrences : code/nom, type/valeur, montant/plafond, dates)

### Site Internet — Shipping Config

15. `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/ShippingConfigCard.tsx`
    - `grid-cols-2 gap-4 pl-1` → `grid-cols-1 sm:grid-cols-2 gap-4 pl-1` (3 occurrences, champs prix/delai par mode livraison)

### CMS Section

16. `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/CMSSection.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (3 occurrences : titre/sous-titre, cta-text/cta-link, items reassurance)

### Consultations

17. `apps/back-office/src/app/(protected)/consultations/create/components/StepConfirmation.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (recap client email/telephone)

### Finance

18. `apps/back-office/src/app/(protected)/finance/immobilisations/ImmobilisationsComponents.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (4 occurrences dans form creation immobilisation)

19. `apps/back-office/src/app/(protected)/finance/bibliotheque/_components/classify-dialog.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (montants HT/TTC)

### LinkMe Catalogue

20. `apps/back-office/src/app/(protected)/canaux-vente/linkme/catalogue/modals/PricingConfigModal.tsx`
    - `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` (prix/taux retrocession)

---

## Fichiers SKIP (deja responsives ou hors scope)

- `parametres/webhooks/new/page.tsx` — deja `grid-cols-1 lg:grid-cols-3` ✓
- `parametres/webhooks/[id]/edit/page.tsx` — deja `grid-cols-1 lg:grid-cols-3` ✓
- `parametres/emails/[slug]/edit/page.tsx` — deja `grid-cols-1 lg:grid-cols-3` ✓
- `consultations/create/components/StepDemande.tsx` — deja `grid-cols-1 md:grid-cols-3` ✓
- `canaux-vente/linkme/components/UserCreateModal.tsx` — deja responsive mobile-first ✓
- `factures/[id]/edit/AddressSection.tsx` — grilles CodePostal/Ville maintenues a 2 cols (champs courts, acceptable)
- `canaux-vente/site-internet/components/EditSiteInternetProductModal/TabGeneral.tsx` — modal (hors scope)
- `canaux-vente/site-internet/components/EditSiteInternetProductModal/TabInformations.tsx` — modal (hors scope)
- `produits/sourcing/echantillons/echantillons-form.tsx` — c'est un `SampleFormDialog` (modal, hors scope)
- Toutes les grilles de KPI cards (grid-cols deja responsive ou affichage donnees)
- Grilles de 2 checkboxes cote a cote (roles, acceptables sur mobile)
- Tableaux financiers avec `grid-cols-2` pour label/valeur (affichage, pas saisie)

---

## Reste a faire (hors perimetre ou depasse la limite 30 fichiers)

- `canaux-vente/linkme/components/UserConfigModal.tsx` — form profil dans modal (non examine en detail)
- `canaux-vente/linkme/components/UserEditModal.tsx` — form edit dans modal (non examine en detail)
- `canaux-vente/linkme/components/LinkMeResetPasswordDialog.tsx` — dialog reset mot de passe (non examine)
- Pages analytics LinkMe avec `grid-cols-3/4` sans responsive (affichage, pas forms)

---

## Verification

```
pnpm --filter @verone/back-office type-check  ✓ EXIT 0
pnpm --filter @verone/back-office lint        ✓ EXIT 0
```
