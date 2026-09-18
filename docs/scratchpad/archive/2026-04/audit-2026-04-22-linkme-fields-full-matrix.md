# Matrice EXHAUSTIVE — champs des 2 formulaires LinkMe vs back-office

**Date** : 2026-04-22
**Objectif** : garantir que le back-office peut afficher / éditer TOUS les champs que les 2 formulaires LinkMe peuvent renseigner, avant toute modif UX.
**Règle d'or** : back-office = source unique de vérité. Aucun champ formulaire ne doit être invisible/non-éditable en back-office.

---

## 1. UserOrderForm — 8 étapes

Schema source : `apps/linkme/src/components/orders/schemas/order-form-steps.schema.ts`

### Étape 1 — Restaurant

| Champ formulaire                        | Mode 'existing'         | Mode 'new'                                | Cible DB                           |
| --------------------------------------- | ----------------------- | ----------------------------------------- | ---------------------------------- |
| `existingId`                            | ✅ UUID                 | —                                         | `sales_orders.organisation_id`     |
| `existingOwnershipType`                 | ✅ succursale/franchise | —                                         | `organisations.ownership_type`     |
| `newRestaurant.tradeName`               | —                       | ✅ min 2 car                              | `organisations.trade_name`         |
| `newRestaurant.legalName`               | —                       | optionnel                                 | `organisations.legal_name`         |
| `newRestaurant.siret`                   | —                       | optionnel                                 | `organisations.siret`              |
| `newRestaurant.kbisFile`                | —                       | optionnel upload                          | (stockage uploaded file)           |
| `newRestaurant.city`                    | —                       | ✅                                        | `organisations.city`               |
| `newRestaurant.postalCode`              | —                       | optionnel                                 | `organisations.postal_code`        |
| `newRestaurant.address`                 | —                       | optionnel                                 | `organisations.address_line1`      |
| `newRestaurant.latitude/longitude`      | —                       | optionnel                                 | `organisations.latitude/longitude` |
| `newRestaurant.ownershipType`           | —                       | ✅                                        | `organisations.ownership_type`     |
| `newRestaurant.country`                 | —                       | default FR                                | `organisations.country`            |
| `newRestaurant.contactName/email/phone` | —                       | optionnel (contact restaurant par défaut) | `contacts.*` créé à la volée       |

### Étape 5 — Responsable

| Champ formulaire                     | Type         | Cible DB                                                            |
| ------------------------------------ | ------------ | ------------------------------------------------------------------- |
| `responsable.firstName` + `lastName` | ContactBase  | `contacts.first_name/last_name`                                     |
| `responsable.email`                  | string email | `contacts.email`                                                    |
| `responsable.phone`                  | string       | `contacts.phone`                                                    |
| `responsable.position`               | string       | `contacts.position`                                                 |
| `responsable.company`                | string       | `contacts.company` (si pertinent)                                   |
| `existingResponsableId`              | UUID         | `sales_orders.responsable_contact_id`                               |
| `franchiseInfo.companyLegalName`     | string       | `sales_order_linkme_details.owner_company_legal_name`               |
| `franchiseInfo.siret`                | string       | `sales_order_linkme_details.owner_company_trade_name` ou équivalent |

### Étape 6 — Facturation (3 sections)

#### `billingContact` — contact facturation

| Champ                   | Valeurs                                                       | Cible                             |
| ----------------------- | ------------------------------------------------------------- | --------------------------------- |
| `mode`                  | `existing \| new \| same_as_responsable`                      | logique création                  |
| `existingContactId`     | UUID si mode 'existing'                                       | `sales_orders.billing_contact_id` |
| `contact` (ContactBase) | firstName/lastName/email/phone/position/company si mode 'new' | `contacts.*` + FK                 |

#### `billingOrg` — organisation de facturation

| Champ                                        | Valeurs                                | Cible                                              |
| -------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| `mode`                                       | `restaurant \| parent_org \| other`    | logique                                            |
| `organisationId`                             | UUID pour 'restaurant' ou 'parent_org' | `sales_orders.billing_organisation_id` (si existe) |
| `customOrganisation.legalName`               | string (mode 'other')                  | `organisations.legal_name` nouvelle                |
| `customOrganisation.tradeName`               | string                                 | `organisations.trade_name`                         |
| `customOrganisation.siret`                   | string (si FR)                         | `organisations.siret`                              |
| `customOrganisation.vatNumber`               | string (si étranger)                   | `organisations.vat_number`                         |
| `customOrganisation.addressLine1/2`          | string                                 | `organisations.billing_address_line1/line2`        |
| `customOrganisation.postalCode/city/country` | string                                 | `organisations.billing_postal_code/city/country`   |
| `saveAsDefault`                              | boolean                                | flag pour persister sur `organisations`            |

#### `billingAddress` — adresse facturation

| Champ                                                | Valeurs                                                                   | Cible                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| `mode`                                               | `restaurant_address \| existing_billing \| new_billing \| parent_address` | logique                                |
| `existingAddressId`                                  | UUID (mode 'existing_billing')                                            | `organisations.billing_address_*`      |
| `customAddress.addressLine1/postalCode/city/country` | string (mode 'new_billing')                                               | `sales_orders.billing_address` (jsonb) |
| `setAsDefault` / `replaceExistingAddress`            | boolean                                                                   | flags                                  |

### Étape 7 — Livraison (2 sections)

#### `delivery` (ContactsStep — contact de livraison)

| Champ                      | Cible                                             |
| -------------------------- | ------------------------------------------------- |
| `sameAsResponsable`        | flag                                              |
| `contact` (ContactBase)    | `contacts.*` + `sales_orders.delivery_contact_id` |
| `existingContactId`        | UUID → `sales_orders.delivery_contact_id`         |
| `address` (PartialAddress) | `sales_orders.shipping_address` (jsonb)           |
| `saveAddressAsDefault`     | flag                                              |

#### `delivery` (DeliveryStep — infos livraison)

| Champ                              | Cible DB                                                              |
| ---------------------------------- | --------------------------------------------------------------------- |
| `address/postalCode/city`          | `sales_order_linkme_details.delivery_address/postal_code/city`        |
| `desiredDate` (YYYY-MM-DD)         | `sales_order_linkme_details.desired_delivery_date`                    |
| `deliveryAsap`                     | `sales_order_linkme_details.delivery_asap`                            |
| `isMallDelivery`                   | `sales_order_linkme_details.is_mall_delivery`                         |
| `mallEmail`                        | `sales_order_linkme_details.mall_email`                               |
| `semiTrailerAccessible`            | `sales_order_linkme_details.semi_trailer_accessible`                  |
| `accessFormUrl` / `accessFormFile` | `sales_order_linkme_details.access_form_url` / `access_form_required` |
| `notes`                            | `sales_order_linkme_details.delivery_notes`                           |
| `deliveryTermsAccepted`            | `sales_order_linkme_details.delivery_terms_accepted`                  |

---

## 2. ClientOrderForm — 6 étapes (à compléter après lecture `client-order-form.schema.ts`)

**Particularités** vs UserOrderForm (déjà documentées dans `formulaires-commande-comparaison.md`) :

- Étape 1 **Demandeur** (requester) — champs additionnels `requester_name/email/phone/position` dans `sales_order_linkme_details`
- `responsable.name` (1 champ unique) au lieu de `firstName` + `lastName` (2 champs)
- `responsable.siret` (requis si franchise) + `responsable.kbisFile` (upload)
- Facturation : 2 modes (`useParentOrganisation` boolean) au lieu de 4
- Status initial : `PENDING_APPROVAL` (vs `DRAFT`)

**Champs uniques ClientOrderForm** (non présents UserOrderForm) :

- `requester.type` : `'manager' | 'owner' | 'employee'` etc. → `sales_order_linkme_details.requester_type`
- `requester.name/email/phone/position` → `sales_order_linkme_details.requester_*`
- `owner_contact_same_as_requester` (flag)
- `owner_kbis_url` → URL uploaded

---

## 3. EditDialogs back-office actuels — ce qu'on peut éditer

Dossier : `apps/back-office/src/app/(protected)/canaux-vente/linkme/commandes/[id]/details/components/`

| Dialog                      | Couvre                                                                 | Manquant ?                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `ContactSelectionDialog`    | Choix/changement d'un contact (3 rôles : responsable/billing/delivery) | OK                                                                                                             |
| `EditResponsableDialog`     | Édition du responsable                                                 | Vérifier si `franchiseInfo.*` est éditable                                                                     |
| `EditBillingDialog`         | Édition facturation (org + adresse)                                    | Vérifier si `billingOrg.customOrganisation.*` (SIRET/VAT/adresse détaillée) est éditable, vérifier les 4 modes |
| `EditDeliveryAddressDialog` | Adresse livraison                                                      | À valider                                                                                                      |
| `EditDeliveryOptionsDialog` | Options livraison                                                      | À retirer `delivery_terms_accepted` et `reception_contact_*` (demande Romeo)                                   |

**Gap probable** :

- Pas de dialog pour éditer **les données Restaurant/Organisation** (city/siret/address après création)
- Pas de dialog pour éditer **requester** (info demandeur — uniquement ClientOrderForm)

---

## 4. Gaps identifiés — questions pour Romeo

### Question A — Contacts unifiés vs existants

Les EditDialogs actuels (`EditResponsableDialog`, `ContactSelectionDialog`) couvrent-ils **la totalité** de ce que les formulaires renseignent, ou y a-t-il des pertes ?

Exemple concret : le formulaire LinkMe peut renseigner `responsable.company` et `franchiseInfo.siret`. Est-ce que ton `EditResponsableDialog` actuel expose ces 2 champs ?

**Action proposée** : avant d'implémenter la section Contacts unifiée, je vérifie champ par champ que chaque EditDialog couvre bien tous les champs du formulaire. Si un gap existe, je le signale avant la refonte.

### Question B — Restaurant/Organisation

Les infos du restaurant (SIRET, adresse, kbis) sont saisies dans UserOrderForm step 1 si mode='new'. Après création, est-ce qu'il y a une interface back-office pour les modifier ?

Si non, ce n'est pas le scope de cette PR (c'est l'édition organisations dans `/contacts-organisations/`). Mais je te pose la question au cas où tu veuilles inclure.

### Question C — Requester (ClientOrderForm uniquement)

Le `requester_name/email/phone/position` est uniquement saisi dans ClientOrderForm. Est-ce que la page détail back-office l'affiche quelque part ? Est-ce qu'il est éditable ?

### Question D — Portée de la nouvelle section « Contacts unifiée »

**Option 1** : section unifiée qui remplace uniquement les 3 cards `fusedContacts` + la section `Contact livraison` de `DeliveryCard`. Les autres EditDialogs (Billing, DeliveryAddress, DeliveryOptions, Responsable) restent tels quels.

**Option 2** : section unifiée qui englobe tout (contacts + adresses + options). Refonte plus large, plus risquée.

**Je recommande Option 1** (scope resserré, ne touche pas aux EditDialogs existants → aucun champ formulaire ne perd son éditabilité).

### Question E — deliveryTermsAccepted

Tu m'as dit de le retirer. Je confirme :

- Retirer du `EditDeliveryOptionsDialog` (édition) — OK
- Laisser le champ DB intact (valeur reste true/false selon formulaire LinkMe)
- Afficher en lecture seule dans DeliveryCard **UNIQUEMENT** si commande créée depuis LinkMe public (=flag à détecter)

OU plus simple : ne plus l'afficher du tout côté back-office (aucune valeur ajoutée puisque déjà accepté côté LinkMe).

---

## 5. Ma proposition de scope PR 1 `BO-LM-CONTACTS-UNIFIED-001`

**In-scope** :

- Nouvelle section `<ContactsUnified>` qui remplace :
  - Les 3 cards de `fusedContacts` en haut de `RightColumn`
  - La section "Contact livraison" dans `DeliveryCard.tsx:57-79`
- Affichage unifié par contact avec badges cumulables (Resp./Fact./Livr.)
- Par rôle manquant : 2 boutons
  - [Assigner] → ouvre `ContactSelectionDialog` existant avec le rôle pré-sélectionné
  - [Demander] → ouvre nouveau modal qui appelle `POST /api/emails/linkme-info-request` avec juste ce champ
- Rétro-compat : tous les EditDialogs existants (Responsable / Billing / Delivery\*) restent accessibles via leurs boutons d'édition

**Out-of-scope** :

- Retrait de `delivery_terms_accepted` + `reception_contact_*` → PR 2 `BO-LM-DELIVERY-CLEANUP-001`
- Suppression section « Post-approbation » → PR 2 `BO-LM-DELIVERY-CLEANUP-001`
- Extension bouton « Demander compléments » sur status validated/partially_shipped → PR 3 `BO-LM-INFO-REQ-EXTEND-001`
- Refonte des EditDialogs (hors scope, risqué, à faire seulement si gaps avérés)

---

## 6. Checklist de sécurité avant implémentation

Avant d'écrire une seule ligne de code, je vérifie :

- [ ] Chaque EditDialog existant reste **accessible et fonctionnel** après la refonte
- [ ] Aucun champ actuellement éditable ne devient non-éditable
- [ ] Les 2 formulaires LinkMe continuent de remplir `sales_order_linkme_details` et les FK contacts exactement comme avant (aucune modif côté `apps/linkme/`)
- [ ] `updateLinkmeDetails` dans `use-linkme-order-actions.ts` continue de fonctionner avec les mêmes paramètres
- [ ] `ContactSelectionDialog` gère bien les 3 rôles `responsable / billing / delivery`
