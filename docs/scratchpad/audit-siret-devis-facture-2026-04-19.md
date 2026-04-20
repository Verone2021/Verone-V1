# Audit — Problématique SIRET devis/facture + Rapport session 2026-04-19

## 1. Problématique métier (Romeo)

**Cas d'usage réel** :

- Pokawa Avignon (org commande, filiale) n'a **pas** de SIRET
- Pokawa SAS (siège, enseigne mère) a un SIRET
- Besoin urgent d'émettre un devis pour Pokawa Avignon
- Qonto refuse (HTTP 422) la création client B2B sans SIRET/VAT

## 2. Solution actuellement en place (BO-FIN-037)

Quand l'utilisateur choisit Pokawa Siège comme **facturation** dans le modal devis :

- ✅ Le devis Qonto est émis avec le SIRET de Pokawa Siège
- ✅ Le `partner_id` de `financial_documents` = Pokawa Siège
- ❌ **PROBLÈME** : la commande `sales_orders.customer_id` est propagée à Pokawa Siège → perte de la réalité "commande Pokawa Avignon"
- ❌ **BUG UI** : la livraison affiche "même que facturation" alors que `sales_orders.shipping_address` = Avignon (comparaison UI cassée, pas la donnée)

**Conséquence métier** : la commande ne reflète plus qui a commandé (la filiale), juste qui paie (le siège).

## 3. Proposition Romeo (option D)

> **Pour les DEVIS uniquement** : si l'org commande n'a pas de SIRET → proposer automatiquement la maison mère (enseigne) comme org facturation, avec l'org commande comme adresse de livraison. **Ne PAS toucher à `sales_orders.customer_id`** qui reste sur l'org commande originale.
>
> **Pour les FACTURES** : obligation stricte de SIRET sur l'org facturée — si absent, refus HTTP 400.

## 4. Analyse — 4 options possibles

| #   | Option                                         | sales_orders.customer_id  | financial_documents.partner_id   | Qonto client   | Avantages                      | Inconvénients                               |
| --- | ---------------------------------------------- | ------------------------- | -------------------------------- | -------------- | ------------------------------ | ------------------------------------------- |
| A   | Actuel BO-FIN-037 (Option B)                   | Propage à Pokawa Siège    | Pokawa Siège                     | Pokawa Siège   | Cohérence DB                   | Perd la réalité "Pokawa Avignon a commandé" |
| B   | **Devis only overlay** (Romeo)                 | Pokawa Avignon (inchangé) | Pokawa Siège (facturation devis) | Pokawa Siège   | Réalité préservée, devis émis  | Divergence volontaire commande vs devis     |
| C   | Laisser comme avant BO-FIN-037 (Option A)      | Pokawa Avignon            | Pokawa Avignon                   | Pokawa Avignon | Simple                         | Qonto 422 si pas de SIRET                   |
| D   | **Auto-resolve maison mère devis** (Romeo alt) | Pokawa Avignon            | Pokawa SAS (auto)                | Pokawa SAS     | UX fluide, aucune intervention | Logique cachée moins transparente           |

## 5. Recommandation : **Option B + UI d'alerte**

### Principe

- **Devis** : le devis peut être facturé à une org différente de l'org commande, SANS toucher la commande
  - Champ ajouté à `financial_documents` : `billing_org_id` (NOUVELLE colonne, distincte de `partner_id` = org commande)
  - `partner_id` reste l'org commande (Pokawa Avignon)
  - `billing_org_id` = org facturation choisie (Pokawa Siège)
  - Qonto utilise `billing_org_id` pour `tax_identification_number`
  - UI affiche les deux : "Commande : Pokawa Avignon / Facturation : Pokawa Siège"
- **Facture** : guard strict SIRET/VAT obligatoire sur l'org facturée (déjà en place côté `/api/qonto/invoices/service` via BO-FIN-025)
  - Si `billing_org_id` fourni → utilisé pour Qonto TIN
  - Sinon si org commande a SIRET → utilisé
  - Sinon → HTTP 400 "SIRET requis avant facturation"

### Annulation de BO-FIN-037 (propagation commande)

La propagation `customer_id` de la commande doit être **retirée** ou au minimum désactivée par défaut. Alternative : garder la propagation optionnelle via un flag explicite `propagateToOrder: true` dans le body POST si l'utilisateur veut vraiment changer l'org commande (cas rare).

### Migration DB

```sql
ALTER TABLE financial_documents
  ADD COLUMN billing_org_id uuid REFERENCES organisations(id);

-- Optionnel : index pour performance
CREATE INDEX idx_financial_documents_billing_org_id
  ON financial_documents(billing_org_id);
```

### Devis en sortie du système

Le devis Qonto affichera :

- Footer : "Adresse de livraison : [adresse org commande]" si différente de la facturation
- PDF client : facturé à Pokawa Siège (SIRET visible), livré à Pokawa Avignon

## 6. Règle SIRET consolidée (recommandation finale)

| Contexte                                        | SIRET requis sur                                 | Comportement                                                               |
| ----------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Devis from-order (`/api/qonto/quotes`)          | `billing_org_id` OU org commande (l'un des deux) | HTTP 200 si l'un a SIRET. HTTP 400 sinon avec CTA "Choisir la maison mère" |
| Devis service (`/api/qonto/quotes/service`)     | customer (si org)                                | HTTP 200 même sans SIRET (devis souple)                                    |
| Facture from-order (`/api/qonto/invoices`)      | `billing_org_id` OU org commande                 | **STRICT** : HTTP 400 si aucune SIRET                                      |
| Facture service (`/api/qonto/invoices/service`) | customer (si org)                                | **STRICT** : HTTP 400 si aucune SIRET — déjà en place BO-FIN-025           |

## 7. Décisions produit à trancher

1. **Annule-t-on BO-FIN-037** (propagation customer_id) ?
   - OUI si Option B adoptée (recommandé)
   - NON si on garde BO-FIN-037 comme comportement actif par défaut
2. **Ajoute-t-on `billing_org_id` dans `financial_documents`** ?
   - OUI si Option B
   - NON si on garde Option A actuelle
3. **Auto-resolve maison mère** dans modal devis quand org sans SIRET ?
   - Suggérer automatiquement avec toast "Organisation sans SIRET — facturation à l'enseigne mère Pokawa SAS ?"
   - L'utilisateur peut accepter ou choisir manuellement une autre org
4. **UI page détail commande** :
   - Afficher 2 orgs distinctes "Client commande" vs "Client facturation devis" si Option B
5. **Migration data existante** : les devis créés pendant BO-FIN-037 ont déjà changé les `sales_orders.customer_id` — faut-il un rollback ?

---

## 8. Rapport session 2026-04-19 (complet)

### Sprints terminés et pushés sur `feat/BO-FIN-031-org-picker-modal`

| Sprint     | Commit      | Fonctionnalité                                                                                                               |
| ---------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------- |
| BO-FIN-031 | initial     | OrganisationAddressPickerModal (cards + badges + search + pagination, sans limite) extrait de LinkMe RestaurantSelectorModal |
| BO-FIN-033 | `dae8bd8a8` | Bouton "Créer facture" sur page détail LinkMe + QuotesSection + symétrie modal facture                                       |
| BO-FIN-034 | `a78ebc87c` | Auto-overwrite devis drafts (plus de HTTP 409) + migration `superseded` quote_status                                         |
| BO-FIN-035 | `d74b8aeaf` | Retrait checkbox "save-to-org" shipping (adresse livraison = temporaire)                                                     |
| BO-FIN-025 | `3ebad1d4d` | Guard TIN backend sur `/api/qonto/invoices/service`                                                                          |
| BO-FIN-036 | `9e1c52fb0` | Bouton "+ Nouveau client" dans pickers standalone + fix auto-select                                                          |
| BO-FIN-037 | `f3be01249` | Propagation `billingOrgId` vers `sales_orders` (draft only) — **À RECONSIDÉRER**                                             |

### Migrations DB appliquées en prod

1. `20260427_financial_documents_revision_number.sql` — `revision_number` sur `financial_documents`
2. `20260428_allow_customer_quote_sales_order_link.sql` — contrainte `check_sales_order_only_customer` étend à `customer_quote`
3. `20260429_allow_superseded_quote_status.sql` — étend `financial_documents_quote_status_check` avec `superseded`

### Sprints en cours (background)

| Agent      | Sprint                                                                               | État     |
| ---------- | ------------------------------------------------------------------------------------ | -------- |
| `a23f6b86` | BO-FIN-038 — Contact selector enseigne + org (Responsable / Facturation / Livraison) | En cours |

### Points en attente de décision Romeo

1. **Option B adoptée ?** (voir §4) → déclenche BO-FIN-039 rollback propagation + ajout `billing_org_id`
2. **Auto-resolve maison mère devis** si org sans SIRET → BO-FIN-040
3. **Affichage 2 orgs distinctes dans page détail** si Option B → BO-FIN-041
4. **Rollback data** : devis BO-FIN-037 ont changé `sales_orders.customer_id` — à restaurer ?

### Bugs UI connus (backlog)

1. Page détail LinkMe — "Livraison : même que facturation" affiché alors que `shipping_address` diffère de `billing_address` (comparaison UI cassée dans `OrganisationCard.tsx:272-277`)
2. Warnings reviewer backlog BO-FIN-018 non adressés (non bloquants)

### État prod

Aucun merge sur staging/main. Tout est sur la feature branch `feat/BO-FIN-031-org-picker-modal`. La prod tourne encore sur les derniers merges documentés précédemment (BO-FIN-029/030 les plus récents).

### Ce qui reste à faire pour clore la feature branch

1. Trancher décisions produit §7
2. Appliquer Option B (si choisie) via BO-FIN-039
3. Finir BO-FIN-038 (contact picker)
4. Tests Playwright end-to-end sur tous les flows
5. Review finale par reviewer-agent
6. Merge sur staging
7. Merge staging → main

---

## 9. Prochaine session — entrée rapide

**Lire** :

- Ce document
- `.claude/work/ACTIVE.md` (tâches en cours)
- `docs/scratchpad/audit-devis-commande-2026-04-18.md` (audit initial)
- `docs/scratchpad/audit-sync-commande-documents-2026-04-18.md` (audit régénération)

**Commencer par** :

1. Demander à Romeo si Option B validée
2. Si OUI → lancer BO-FIN-039 (rollback BO-FIN-037 + ajout `billing_org_id`)
3. Finir BO-FIN-038 (contact picker) s'il n'est pas terminé
4. Fix bug UI affichage livraison

**Branche active** : `feat/BO-FIN-031-org-picker-modal`
