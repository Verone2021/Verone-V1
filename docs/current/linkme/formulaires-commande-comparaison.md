# Formulaires Commande LinkMe — Comparaison

**Version** : 1.0.0 (2026-03-11)
**Status** : DOCUMENTATION CANONIQUE

## Nomenclature Officielle

| Formulaire         | Nom Officiel                        | Nom Court         | Fichier Principal                    | Hook                          |
| ------------------ | ----------------------------------- | ----------------- | ------------------------------------ | ----------------------------- |
| Dashboard (auth)   | **Formulaire Commande Utilisateur** | `UserOrderForm`   | `components/orders/NewOrderForm.tsx` | `use-order-form.ts`           |
| Public (sans auth) | **Formulaire Commande Client**      | `ClientOrderForm` | `components/OrderFormUnified.tsx`    | `use-submit-unified-order.ts` |

---

## Architecture

| Critere                | UserOrderForm (auth)                 | ClientOrderForm (public)                                                              |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------- |
| **Architecture**       | Modulaire (8 sous-composants step)   | Monolithique (tout dans 1 fichier)                                                    |
| **Validation**         | Zod (`order-form.schema.ts`)         | Manuelle (`validateStep*` functions) + Zod soumission (`client-order-form.schema.ts`) |
| **RPC submission**     | `create_affiliate_order`             | `create_public_linkme_order` (nouveau) / `create_affiliate_order` (existant)          |
| **Acces**              | `/commandes/nouvelle` (auth requise) | `/s/[id]/catalogue` → modal panier                                                    |
| **Layout**             | Page full avec stepper lateral       | Modal splitview (recap + form)                                                        |
| **Cache localStorage** | Non                                  | Oui (requester info, 7 jours)                                                         |

---

## Etapes Comparees

| Etape fonctionnelle | UserOrderForm                                               | ClientOrderForm                                                           | Aligne ?                        |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------- |
| **Demandeur**       | — (user connecte)                                           | Etape 1 (name, email, phone, position, notes)                             | **EXTRA** — par design          |
| **Restaurant**      | Etape 1 (mode, type, nom, ville, adresse)                   | Etape 2 (type, tradeName, address, contact optionnel)                     | OK                              |
| **Selection**       | Etape 2                                                     | Implicite (page publique)                                                 | OK par design                   |
| **Produits**        | Etape 3                                                     | Recap gauche modal                                                        | OK par design                   |
| **Panier**          | Etape 4                                                     | Recap gauche modal                                                        | OK par design                   |
| **Responsable**     | Etape 5 (`firstName`+`lastName`, email, phone, position)    | Etape 3 (`name`, email, phone + franchise: companyLegalName, siret, kbis) | **Note** : format nom different |
| **Facturation**     | Etape 6 (4 modes adresse, contact billing separe)           | Etape 4 (useParentOrg, contactSource, adresse simple)                     | Modes differents                |
| **Livraison**       | Etape 7 (contact, adresse, `string` ISO, mall, semi, notes) | Etape 5 (contact, adresse, `string` ISO, mall, semi, notes)               | **Aligne**                      |
| **Validation**      | Etape 8 (recap + deliveryTermsAccepted + submit)            | Etape 6 (deliveryTermsAccepted, finalNotes, submit)                       | **Aligne**                      |

---

## Divergences Documentees

### Format Nom Contact

|             | UserOrderForm                                                                            | ClientOrderForm                                       |
| ----------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Champs      | `firstName` + `lastName` (2 champs)                                                      | `name` (1 champ unique)                               |
| Stockage DB | Contacts crees avec `firstName`/`lastName` separes                                       | RPC `create_public_linkme_order` recoit `name` unique |
| Resolution  | Le RPC `create_public_linkme_order` split le `name` en `first_name`/`last_name` cote SQL |

### Type Date Livraison

|              | UserOrderForm                                     | ClientOrderForm                         |
| ------------ | ------------------------------------------------- | --------------------------------------- |
| Type interne | `string` ISO (YYYY-MM-DD)                         | `string` ISO (YYYY-MM-DD)               |
| Schema Zod   | `z.string().nullable()` dans `deliveryStepSchema` | Pas de schema Zod (validation manuelle) |
| Soumission   | Envoye tel quel comme `desired_delivery_date`     | Envoye tel quel comme `delivery_date`   |

### Conditions Livraison (`deliveryTermsAccepted`)

Present dans les **deux** formulaires :

- **UserOrderForm** : Checkbox dans `ValidationStep` (etape 8), stocke dans `delivery.deliveryTermsAccepted`
- **ClientOrderForm** : Checkbox dans `OpeningStep6Validation` + modal confirmation. Force a `true` avant soumission.

### Modes Facturation

| UserOrderForm                                                                       | ClientOrderForm                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 4 modes : `restaurant_address`, `existing_billing`, `new_billing`, `parent_address` | 2 modes : `useParentOrganisation` (boolean) + adresse custom |

### SIRET/KBis

|                   | UserOrderForm                            | ClientOrderForm                                                           |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| SIRET responsable | Dans `franchiseInfo.siret` (optionnel)   | Dans `responsable.siret` (requis si franchise, maxLength 17 avec espaces) |
| KBis              | Absent                                   | `responsable.kbisFile` (File upload, mais pas envoye au RPC)              |
| SIRET facturation | Via `billingAddress.customAddress.siret` | `billing.siret` (strip non-digits, max 14)                                |

### Status Initial Commande

| UserOrderForm                          | ClientOrderForm                                                                                                       |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DRAFT` (via `create_affiliate_order`) | `PENDING_APPROVAL` (via `create_public_linkme_order`) / `DRAFT` (via `create_affiliate_order` si restaurant existant) |

---

## Fichiers Critiques

| Fichier                                                 | Role                                    |
| ------------------------------------------------------- | --------------------------------------- |
| `components/orders/NewOrderForm.tsx`                    | UserOrderForm - orchestrateur           |
| `components/orders/schemas/order-form.schema.ts`        | Schemas Zod (UserOrderForm)             |
| `components/orders/schemas/client-order-form.schema.ts` | Schemas Zod (ClientOrderForm)           |
| `lib/hooks/use-order-form.ts`                           | Hook state + submission (UserOrderForm) |
| `components/OrderFormUnified.tsx`                       | ClientOrderForm - monolithique          |
| `lib/hooks/use-submit-unified-order.ts`                 | Hook submission (ClientOrderForm)       |
| `components/orders/steps/*.tsx`                         | Sous-composants etapes (UserOrderForm)  |
| `app/(public)/s/[id]/selection-context.tsx`             | Context panier public                   |

---

## Historique

- **2026-03-11** : Creation du document, audit initial, corrections P0 (date type, validation Zod client)
