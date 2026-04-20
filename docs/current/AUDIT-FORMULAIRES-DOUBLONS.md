# Audit formulaires dupliqués — Verone Back-Office

**Date** : 2026-04-20
**Task ID** : BO-AUDIT-001
**Scope** : tous les formulaires dans `packages/@verone/*` et `apps/back-office/src/`
**Méthode** : inventaire par pattern Glob + diff sur fichiers suspects + analyse des imports

---

## 🔴 Duplications critiques (à consolider en priorité)

### 1. `NewContactForm` — 100% dupliqué

| Fichier                                                                                           | Lignes | Statut             |
| ------------------------------------------------------------------------------------------------- | ------ | ------------------ |
| `packages/@verone/orders/src/components/linkme-contacts/NewContactForm.tsx`                       | 179    | Source             |
| `packages/@verone/orders/src/components/contacts/NewContactForm.tsx`                              | 179    | **Doublon strict** |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/contacts/NewContactForm.tsx` | 10     | Ré-export          |

**Diagnostic** : `diff` = 0 ligne différente entre les 2 fichiers du package. Le 3e fichier (app) est un simple wrapper.

**Action recommandée** :

1. Supprimer `packages/@verone/orders/src/components/contacts/NewContactForm.tsx`
2. Migrer tous les imports vers `@verone/orders/components/linkme-contacts/NewContactForm`
3. OU renommer vers un chemin plus neutre : `@verone/orders/components/contacts/NewContactForm` et supprimer le duplicata linkme

**Effort** : 30 min. **Risque** : faible (wrapper grep + replace).

---

### 2. `NewAddressForm` — 99% dupliqué

| Fichier                                                                                           | Lignes | Statut                   |
| ------------------------------------------------------------------------------------------------- | ------ | ------------------------ |
| `packages/@verone/orders/src/components/linkme-contacts/NewAddressForm.tsx`                       | 251    | Source                   |
| `apps/back-office/src/app/(protected)/canaux-vente/linkme/components/contacts/NewAddressForm.tsx` | 251    | **Doublon quasi-strict** |

**Diagnostic** : seules 2 lignes diffèrent (classes responsive `grid-cols-1 sm:grid-cols-2` vs `grid-cols-2` — la version `apps/` est plus récente avec mobile first).

**Action recommandée** :

1. Conserver la version responsive (`apps/`) comme source
2. Promouvoir vers `@verone/organisations` ou `@verone/common/address`
3. Remplacer l'import côté `@verone/orders/linkme-contacts`
4. Supprimer le fichier app (devient wrapper)

**Effort** : 45 min. **Risque** : moyen (2 appelants à vérifier).

---

### 3. Composants adresse — 3 implémentations parallèles

| Fichier                                                                     | Lignes | Rôle                                   |
| --------------------------------------------------------------------------- | ------ | -------------------------------------- |
| `packages/@verone/ui/src/components/ui/AddressManualForm.tsx`               | 214    | Formulaire adresse low-level UI        |
| `packages/@verone/common/src/components/address/AddressFormFields.tsx`      | 123    | Champs adresse avec autocomplete       |
| `packages/@verone/orders/src/components/linkme-contacts/NewAddressForm.tsx` | 251    | Formulaire adresse avec logique métier |

**Diagnostic** : 3 composants couvrent des responsabilités qui se recouvrent partiellement (tous rendent les champs address_line1/postal_code/city/country). Aucun n'est un vrai wrapper de l'autre.

**Action recommandée** :

1. **Source de vérité** : `AddressFormFields` dans `@verone/common/address` (le plus propre, avec autocomplete Google)
2. Dépréciation `AddressManualForm` → supprimer après migration des consommateurs
3. Refactor `NewAddressForm` → utiliser `AddressFormFields` en interne + ajouter sa couche métier (sauvegarde contact, etc.)

**Effort** : 2-3h. **Risque** : moyen-élevé (composants partagés dans plusieurs apps, tester chaque surface).

---

## 🟠 Duplications potentielles (à valider métier)

### 4. Organisation forms — 4 modals spécialisés

| Fichier                                                                                       | Lignes | Usage                               |
| --------------------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| `packages/@verone/organisations/src/components/forms/GenericOrganisationFormModal.tsx`        | 212    | Générique (restaurant LinkMe, etc.) |
| `packages/@verone/organisations/src/components/forms/CustomerOrganisationFormModal.tsx`       | 218    | Client B2B                          |
| `packages/@verone/organisations/src/components/forms/SupplierFormModal.tsx`                   | 239    | Fournisseur                         |
| `packages/@verone/organisations/src/components/forms/PartnerFormModal.tsx`                    | 184    | Prestataire                         |
| `packages/@verone/orders/src/components/modals/CreateLinkMeOrderModal/CustomerCreateForm.tsx` | 215    | **Redondant** avec Customer/Generic |

**Diagnostic** :

- Les 4 modals `organisations/*` sont **probablement légitimes** : chaque rôle (client / fournisseur / prestataire / générique) a ses champs spécifiques (SIRET requis ou non, segment fournisseur, performance partner, etc.). À valider avec Romeo.
- `CustomerCreateForm` dans `@verone/orders/CreateLinkMeOrderModal` est **suspect** : 215 lignes qui probablement dupliquent Customer/Generic form. Selon `CLAUDE.md` de `@verone/orders` : _"JAMAIS créer de CustomerCreateForm ou CreateOrganisationModal local → utiliser les hooks de @verone/organisations"_.

**Action recommandée** :

1. ✅ Conserver les 4 modals de `@verone/organisations` (spécialisation légitime)
2. ⚠️ Auditer `CustomerCreateForm` dans `CreateLinkMeOrderModal` — probablement à remplacer par `GenericOrganisationFormModal` ou `CustomerOrganisationFormModal`

**Effort** : 1h audit + 2h refactor. **Risque** : moyen (flow LinkMe critique).

---

### 5. Contact forms — 3 variantes à cartographier

| Fichier                                                                            | Lignes | Rôle                              |
| ---------------------------------------------------------------------------------- | ------ | --------------------------------- |
| `packages/@verone/customers/src/components/modals/contact-form-modal.tsx`          | 158    | Contact individuel (particulier)  |
| `packages/@verone/organisations/src/components/modals/ContactFormModalWrapper.tsx` | ?      | Contact d'une organisation        |
| `packages/@verone/orders/src/components/linkme-contacts/NewContactForm.tsx`        | 179    | Contact LinkMe (commande terrain) |

**Diagnostic** : chaque form est spécialisé pour un usage métier différent, mais les champs (prénom, nom, email, téléphone, fonction) sont identiques.

**Action recommandée** :

1. Extraire un composant bas-niveau `ContactFormFields` dans `@verone/common/contacts/`
2. Les 3 modals deviennent des wrappers minces qui ajoutent la couche métier (save dans `customer_contacts` / `organisation_contacts` / `sales_order_contacts`)

**Effort** : 3-4h. **Risque** : moyen.

---

## 🟢 Pas de duplication (formulaires spécialisés légitimes)

### 6. Form Produit

| Fichier                                                                                                    | Rôle                   |
| ---------------------------------------------------------------------------------------------------------- | ---------------------- |
| `packages/@verone/products/src/components/modals/product-characteristics/ProductCustomAttributesForm.tsx`  | Attributs custom       |
| `packages/@verone/products/src/components/modals/product-characteristics/ProductVariantAttributesForm.tsx` | Variants               |
| `packages/@verone/products/src/components/sections/CharacteristicsEditForm.tsx`                            | Édition détail produit |
| `packages/@verone/products/src/components/sourcing/SourcingQuickForm/SourcingQuickForm.tsx`                | Ajout rapide sourcing  |

**Diagnostic** : spécialisations légitimes pour différents contextes (sourcing, variants, attrs).

---

### 7. Form Commande / Facture / Devis

| Fichier                                                                       | Rôle                            |
| ----------------------------------------------------------------------------- | ------------------------------- |
| `packages/@verone/orders/src/components/modals/SalesOrderFormModal.tsx`       | Wizard création commande client |
| `packages/@verone/orders/src/components/modals/PurchaseOrderFormModal/*`      | Wizard création PO              |
| `packages/@verone/finance/src/components/QuoteFormModal/QuoteFormContent.tsx` | Devis service                   |
| `packages/@verone/finance/src/components/invoice-detail/InvoiceEditForm.tsx`  | Édition facture                 |

**Diagnostic** : chaque domaine (achat/vente/devis/facture) a ses propres champs et règles métier. Pas de duplication.

---

### 8. Form Expédition / Réception

| Fichier                                                                       | Rôle                                |
| ----------------------------------------------------------------------------- | ----------------------------------- |
| `packages/@verone/orders/src/components/forms/SalesOrderShipmentForm.tsx`     | Expédition SO                       |
| `packages/@verone/orders/src/components/forms/PurchaseOrderReceptionForm.tsx` | Réception PO                        |
| `packages/@verone/logistics/src/components/shipment-forms/*`                  | Packlink, Chronotruck, MondialRelay |

**Diagnostic** : spécialisations carrier-specific légitimes.

---

## 📊 Synthèse quantitative

| Catégorie                              | Nombre  | Duplication                      |
| -------------------------------------- | ------- | -------------------------------- |
| Formulaires totaux identifiés          | **~55** | —                                |
| Duplications strictes (100% identique) | **1**   | NewContactForm × 2               |
| Duplications quasi-strictes (>95%)     | **1**   | NewAddressForm × 2               |
| Composants chevauchants                | **2**   | AddressForm × 3, ContactForm × 3 |
| Redondances suspectes à auditer        | **1**   | CustomerCreateForm LinkMe        |
| Formulaires spécialisés légitimes      | **~48** | —                                |

**Taux de duplication réel** : ~5% (faible, mais critiques à éliminer).

---

## 🎯 Plan d'action recommandé

### Priorité P0 (quick wins, effort < 1h par item)

1. Supprimer `@verone/orders/components/contacts/NewContactForm.tsx` (doublon 100%)
2. Consolider les deux `NewAddressForm.tsx` (app + package)

### Priorité P1 (1-3h)

3. Auditer et migrer `CustomerCreateForm` LinkMe → `@verone/organisations` form modals

### Priorité P2 (2-4h, refactor plus profond)

4. Extraire `AddressFormFields` comme source unique + migrer `AddressManualForm` + `NewAddressForm`
5. Extraire `ContactFormFields` bas-niveau + refactor les 3 modals contact

### Priorité P3 (hors scope audit)

- Tests Playwright régression sur chaque surface touchée (LinkMe wizard, page contacts, modal commande)

---

## Références

- Règle CLAUDE.md racine : `JAMAIS créer de formulaire dans apps/ → toujours dans packages/@verone/`
- Règle `@verone/orders/CLAUDE.md` : `JAMAIS créer CustomerCreateForm local → utiliser @verone/organisations`
- Index composants : `docs/current/INDEX-COMPOSANTS-FORMULAIRES.md` (553 composants catalogués)

---

**Livrable terminé. Prêt pour validation Romeo avant d'attaquer la phase de consolidation.**
