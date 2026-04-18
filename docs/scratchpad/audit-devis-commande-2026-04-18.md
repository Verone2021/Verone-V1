# Audit — Devis liés à une commande (3 besoins Romeo)

**Date** : 2026-04-18
**Branche** : `fix/BO-FIN-014-fix-proforma-format` (audit only, no code change)
**Scope** : `QuoteCreateFromOrderModal` + `/api/qonto/quotes` + `financial_documents`

---

## Besoins exprimés

1. **Livraison** : pouvoir choisir une organisation DIFFÉRENTE de celle de la commande pour l'adresse de livraison. Cette org peut ne pas avoir de SIRET.
2. **Facturation** : l'adresse de facturation doit être auto-remplie avec l'organisation qui a le SIRET (la "maison mère" de la commande), pas celle de livraison.
3. **Commentaire** : ajouter un champ commentaire libre sur les devis (devis commande ET devis service).

---

## 1) Où se gère la création de devis depuis une commande ?

### UI

- **Modal racine** : `packages/@verone/finance/src/components/QuoteCreateFromOrderModal/index.tsx:36` (`QuoteCreateFromOrderModal`)
- Sous-composants :
  - `QuoteClientCard.tsx` — affiche client + adresses facturation / livraison de la commande (READ-ONLY)
  - `QuoteItemsTable.tsx` — items commande (prix readonly, cf. règle finance R2)
  - `QuoteFeesSection.tsx` — frais de livraison / manutention / assurance
  - `QuoteCustomLinesSection.tsx` — lignes libres (editable)
  - `QuoteTotalsSection.tsx` — calcul totaux
- **Props type** : `packages/@verone/finance/src/components/QuoteCreateFromOrderModal/types.ts:17`
- **Type commande partagé** : `packages/@verone/finance/src/components/order-select/types.ts:9` (`IOrderForDocument`)

### API

- **Route** : `apps/back-office/src/app/api/qonto/quotes/route.ts` (POST)
- **Helpers purs** : `.../quotes/route.helpers.ts` (`resolveBillingAddress`, `buildQuoteItems`, `resolveCustomerInfo`, `resolveQontoClient`)
- **Contexte + persistence** : `.../quotes/route.context.ts` (`resolveRequestContext`, `saveQuoteToLocalDb`, `linkQuoteToOrder`)
- **Contrat requête** (`IPostRequestBody`) : `salesOrderId`, `consultationId`, `userId`, `supersededQuoteIds`, `customer`, `customerEmail`, `expiryDays`, `billingAddress`, `fees`, `customLines`
  - **Pas** de `shippingAddress`
  - **Pas** de `notes` / `reference`
  - **Pas** de `shippingOrganisationId` / `billingOrganisationId`

### Persistence locale

- `saveQuoteToLocalDb` (route.context.ts:281) insère dans `financial_documents` :
  - Stocke : `document_number`, `document_date`, `due_date`, `validity_date`, totaux, `qonto_invoice_id`, `sales_order_id`, `fees`
  - **Ne stocke PAS** : `billing_address`, `shipping_address`, `notes`, `description`
- **Conséquence** : si on veut persister la livraison sélectionnée et le commentaire côté DB pour un devis commande, on doit étendre ce payload.

### Flux Qonto

- `qontoClient.createClientQuote` — params : `CreateClientQuoteParams` (`packages/@verone/integrations/src/qonto/types.ts:678`) :
  - `clientId`, `currency`, `issueDate`, `expiryDate`, `purchaseOrderNumber`, `header`, `footer`, `termsAndConditions`, `items`
  - **Qonto ne gère qu'UNE adresse** attachée au client (via `resolveQontoClient`). **Aucun champ shipping_address sur le quote.**
  - Pour imprimer une "adresse de livraison" sur le PDF Qonto, **seule option** : utiliser `header` ou `footer` (texte libre).
  - Idem pour un commentaire : canal natif = `termsAndConditions` ou `footer`.

---

## 2) Le modal permet-il déjà de choisir une adresse livraison différente ?

**NON.**

- `QuoteClientCard.tsx:71-81` affiche l'adresse de livraison **lue depuis** `order.shipping_address` ou l'org commande (`shipping_address_line1`) en mode **read-only**.
- `index.tsx:80-103` : `resolvedBillingAddress` est calculée à partir de la commande uniquement (pas de sélection utilisateur).
- Le body POST envoie **uniquement** `billingAddress`. Pas de `shippingAddress` ni d'ID d'org livraison.
- Aucun combobox / modal selector d'organisation dans le flux devis-from-order.

**Contraste** : `InvoiceCreateFromOrderModal` (sibling facture) est plus avancé — `useInvoiceActions.ts:147-148` envoie déjà `shippingAddress` et `hasDifferentShipping` à `/api/qonto/invoices`. Le modal facture a la structure à dupliquer côté devis (mais SANS édition prix, cf. R2).

---

## 3) Colonne `comment` dans `financial_documents` ?

**Strictement "comment" : non.** Mais deux colonnes existantes remplissent ce rôle :

Source : `docs/current/database/schema/05-finance.md` (table `financial_documents`, 64 colonnes)

| Colonne       | Type | Usage actuel                                                      |
| ------------- | ---- | ----------------------------------------------------------------- |
| `notes`       | text | Déjà alimenté par `QuoteFormModal` (service) via `useQuotes` hook |
| `description` | text | Non utilisé dans les flux devis actuels                           |

**Recommandation** : réutiliser `notes` (déjà branché côté service, déjà muté par `use-quotes-mutations.ts:207`). **Aucune migration SQL nécessaire.**

État actuel par flux :

| Flux                        | Champ `notes` saisi ?                                    | Persisté dans `financial_documents.notes` ? | Envoyé à Qonto ?                                                                                 |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `QuoteFormModal` (service)  | **OUI** (textarea existante, `QuoteFormContent.tsx:136`) | **OUI** (via `useQuotes.createQuote`)       | **NON** (route `/api/qonto/quotes/service` n'utilise pas `header`/`footer`/`termsAndConditions`) |
| `QuoteCreateFromOrderModal` | **NON** (aucun champ)                                    | **NON** (payload n'a pas `notes`)           | **NON**                                                                                          |

---

## 4) Impact pour ajouter les 3 besoins

### Besoin 1 — Sélection org différente pour la livraison

**Surface (ordre d'exécution) :**

1. **Type partagé** (`order-select/types.ts`) : ajouter champs `enseigne_id`, `is_enseigne_parent` sur `organisations` pour exposer la hiérarchie (besoin 2 aussi).
2. **UI** (`QuoteCreateFromOrderModal/index.tsx`) :
   - Nouveau state `shippingOrganisationId`, `shippingAddress`.
   - Réutiliser un selector d'organisation. **Règle `@verone/organisations/CLAUDE.md`** : interdit de dupliquer un selecteur. Candidats :
     - `OrganisationSelectorModal` (dual-pane enseignes — trop lourd pour ce cas)
     - Pattern `Combobox` minimaliste inspiré de `CustomerSelector` (à discuter)
   - Décision à prendre avant implémentation : créer un `OrganisationPickerSimple` dans `@verone/organisations` et l'importer ici, vs inliner un combobox local (risque de duplication).
   - `QuoteClientCard.tsx` : afficher l'org livraison sélectionnée.
3. **API** (`route.ts` + `route.helpers.ts` + `route.context.ts`) :
   - `IPostRequestBody` : ajouter `shippingAddress?: IDocumentAddress`, `shippingOrganisationId?: string`.
   - `saveQuoteToLocalDb` : persister `shipping_address` jsonb + éventuellement référence org (champ libre dans `notes` ou nouvelle colonne — à voir).
   - Qonto : **décision produit** : le PDF Qonto doit-il afficher la livraison ? Si oui → injecter "Livrer à : …" dans `footer` ou `header` (CreateClientQuoteParams).
4. **Pas d'impact règle finance R1** (pas de changement items / totaux). **R2 préservé** (prix toujours verrouillés).

**Nouveautés DB** : aucune (réutilise `financial_documents.shipping_address` jsonb déjà existant).

### Besoin 2 — Auto-fill facturation depuis l'org avec SIRET (maison mère)

**Contexte DB** : `organisations.enseigne_id` (FK) + `organisations.is_enseigne_parent` (bool) existent déjà (`docs/current/database/schema/01-organisations.md`). Permet de remonter filiale → maison mère.

**Surface :**

1. **Chargement commande** :
   - `QuoteCreateFromOrderModal` charge actuellement `order.organisations` (flat). À étendre pour remonter `enseigne_id → organisations parent` ET déduire l'org porteuse du SIRET.
   - Deux stratégies possibles :
     - **A** (simple, serveur) : `resolveRequestContext` (route.context.ts) résout l'org "facturation SIRET" automatiquement (si org commande sans SIRET → remonter via `enseigne_id`).
     - **B** (explicite, UI) : permettre à l'utilisateur de choisir explicitement l'org facturation parmi la commande + la maison mère.
   - **Recommandation** : stratégie A par défaut + override UI si discordance (aligné sur la philosophie finance R5 : commande = source de vérité, mais l'org porteuse SIRET peut varier).
2. **API `resolveCustomerInfo`** (`route.helpers.ts:220`) :
   - Actuellement lit SIRET / VAT depuis l'org commande directement.
   - À modifier pour pivoter sur l'org facturation résolue.
3. **Qonto `resolveQontoClient`** (`route.helpers.ts:346`) :
   - Le nom envoyé à Qonto devient celui de l'org facturation (maison mère avec SIRET).
   - **Piège** : un client Qonto existant "filiale" pourrait être recréé sous le nom "maison mère" → risque de doublons côté Qonto. À cadrer.
4. **UI `QuoteClientCard.tsx`** :
   - Différencier visuellement "Facturation (SIRET XXX)" et "Livraison (org choisie)".
   - Logique actuelle de `billingLine1` (lignes 19-24) à repenser.

**Ambiguïté produit à clarifier avec Romeo** :

- Cas commande référence directement une org avec SIRET (cas standard) → pas de changement.
- Cas commande référence une filiale sans SIRET → chercher automatiquement la maison mère via `enseigne_id` ? Que faire si plusieurs parents candidats ou aucun ?
- Cas aucune org du couple (filiale, parent) n'a de SIRET → bloquer / avertir / laisser passer ?

### Besoin 3 — Commentaire libre sur devis

**Surface (minimal pour les 2 flux)** :

| Étape                               | Service                                                                                                     | From-order                                                        |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| UI : textarea commentaire           | **Déjà OK** (`QuoteFormContent.tsx:136`)                                                                    | **À ajouter** dans `QuoteCreateFromOrderModal/index.tsx`          |
| Body POST → API                     | **Déjà OK** (passe via `useQuotes.createQuote`)                                                             | **À ajouter** : `notes` dans `IPostRequestBody`                   |
| Persist `financial_documents.notes` | **Déjà OK** (`use-quotes-mutations.ts:207`)                                                                 | **À ajouter** dans `saveQuoteToLocalDb` payload                   |
| Envoi Qonto (PDF visible)           | **À ajouter** : mapper `notes` → `termsAndConditions` ou `footer` dans `/api/qonto/quotes/service/route.ts` | **À ajouter** : idem dans `route.ts` → `buildAndCreateQontoQuote` |

**Pas de migration DB** (colonne `notes` existe déjà).

**Décision produit à prendre** : quel champ Qonto pour le commentaire ?

- `footer` : texte sous le total (classique)
- `termsAndConditions` : bloc CGV (moins intuitif)
- `header` : en-tête

---

## 5) Règles finance impactées

| Règle | Statut                                                                                                                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1    | OK — aucun changement items/totaux                                                                                                                    |
| R2    | OK — prix des items commande restent readonly                                                                                                         |
| R3    | À vérifier — si la commande est modifiée après création devis, la livraison org choisie doit-elle être regénérée aussi ? Probablement non (choix UI). |
| R4    | OK — pas d'interaction guard régénération proforma (scope BO-FIN-014)                                                                                 |
| R5    | OK — devis from-order reste `sales_order_id NOT NULL`                                                                                                 |
| R6    | À respecter — si commande `status != draft`, le devis ne doit pas être modifié (déjà prévu)                                                           |

---

## 6) Points ouverts / décisions produit à prendre avec Romeo

1. **Qonto PDF** : afficher la livraison sur le PDF Qonto (via `footer`) ou laisser côté local DB uniquement ?
2. **Stratégie maison mère** : auto-résolution via `enseigne_id` (A) ou sélection explicite utilisateur (B) ?
3. **Champ Qonto pour le commentaire** : `footer` / `termsAndConditions` / `header` ?
4. **Selector d'organisation** : créer un `OrganisationPickerSimple` dans `@verone/organisations` (vs combobox inline) ?
5. **SIRET manquant** : comportement quand ni la filiale ni aucun parent n'a de SIRET ?
6. **Tests E2E** : à prévoir sur `tests/e2e/` (devis from-order avec livraison différente).

---

## 7) Résumé

- **Pas de migration DB nécessaire** — tout est supporté par `financial_documents` (`notes`, `shipping_address`, `billing_address`) et `organisations` (`enseigne_id`, `is_enseigne_parent`).
- **Gros du travail = côté UI** (`QuoteCreateFromOrderModal`) + **API** (route.ts / route.helpers.ts / route.context.ts) + **Qonto mapping** (footer/termsAndConditions).
- Le flow **service** est déjà partiellement prêt pour le besoin 3 (il manque juste l'envoi à Qonto).
- Le flow **from-order** est en retard vs le flow **facture** sibling (`InvoiceCreateFromOrderModal` gère déjà une shipping address distincte — pattern à dupliquer côté devis SANS les champs prix editable).
- 6 décisions produit à trancher avant implémentation (voir section 6).

**STOP** — attente retour Romeo.
