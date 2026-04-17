# Audit consommateurs tva_amount — 2026-04-17

## Contexte

Prépare la **Phase 1 de BO-FIN-009** : changement de formule de calcul TVA dans le trigger
`recalc_sales_order_on_charges_change` (table `sales_orders`), passant de :

- **Actuel** (`round-per-total`) : `ROUND(sum_items_ttc + charges_ttc, 2)` — arrondi global sur le total TTC
- **Cible** (`round-per-line`) : arrondi par ligne avant sommation

Ce changement peut produire une variation de ±1 centime sur `tva_amount` des documents
`financial_documents` dérivés de commandes. L'objectif de cet audit est de recenser tous les
consommateurs de `tva_amount` avant de valider le changement.

---

## 1. Colonnes tva_amount en DB

| Table                      | Colonne      | Type    | Nullable | Note                     |
| -------------------------- | ------------ | ------- | -------- | ------------------------ |
| `financial_documents`      | `tva_amount` | numeric | NO       | Colonne centrale auditée |
| `financial_document_items` | `tva_amount` | numeric | NO       | TVA par ligne d'article  |

**Confirmation : `sales_orders.tva_amount` n'existe PAS.** La colonne est absente de la table
`sales_orders`. Les champs disponibles sont `total_ht`, `total_ttc`, `eco_tax_total`, `paid_amount`.
La TVA sur une commande est toujours déduite en JS/SQL par `(total_ttc - total_ht)`, jamais stockée.

---

## 2. Producteurs (WRITE)

### 2a. Triggers DB — écriture dans `financial_documents.tva_amount`

| Fonction trigger                       | Table cible           | Formule tva_amount                              | Déclencheur                                                |
| -------------------------------------- | --------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `sync_vat_breakdown_to_document_lines` | `financial_documents` | `SUM(tva_amount) FROM financial_document_lines` | AFTER UPDATE ON `bank_transactions` (vat_breakdown change) |
| `create_customer_invoice_from_order`   | `financial_documents` | `ROUND(total_ht * 0.20, 2)` (taux fixe 20%)     | RPC manuelle                                               |
| `create_supplier_invoice`              | `financial_documents` | passé en paramètre `p_tva_amount`               | RPC manuelle                                               |

#### `recalc_sales_order_on_charges_change` (trigger cible de BO-FIN-009 P1)

- **Table** : `sales_orders` (BEFORE UPDATE)
- **Déclencheur** : `trig_so_charges_recalc` — update sur `shipping_cost_ht`, `insurance_cost_ht`, `handling_cost_ht`, `fees_vat_rate`
- **Ce qu'il fait** : recalcule `sales_orders.total_ttc` uniquement. **Il ne touche pas à `financial_documents.tva_amount`**.
- **Formule actuelle** :
  ```sql
  NEW.total_ttc := ROUND(
    v_items_ttc
    + (v_eco_tax_total * (1 + v_fees_vat_rate))
    + (v_total_charges_ht * (1 + v_fees_vat_rate)),
    2
  );
  ```
- **Lacune** : `tva_amount` n'est PAS recalculé par ce trigger. Il ne figure pas dans le `UPDATE sales_orders SET ...`. De même, `total_ht` n'est pas mis à jour.

**Observation critique** : Le trigger `recalc_sales_order_on_charges_change` ne produit pas de
`tva_amount` directement. En revanche, les **producteurs applicatifs** ci-dessous lisent
`sales_orders.total_ttc - sales_orders.total_ht` pour dériver `tva_amount` lors de la création de
`financial_documents`.

### 2a.bis Fonctions DB référençant tva_amount sur des tables tierces

| Fonction                | Table cible       | Formule tva_amount                            | Statut colonne                                                             |
| ----------------------- | ----------------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| `create_purchase_order` | `purchase_orders` | `ROUND(v_total_ht * 0.20, 2)` (taux fixe 20%) | **CRITIQUE** — colonne `purchase_orders.tva_amount` **n'existe pas** en DB |

**Bug latent confirmé** : la fonction PL/pgSQL `create_purchase_order` effectue un `INSERT INTO purchase_orders (..., tva_amount, ...)` mais la colonne `tva_amount` est absente de la table `purchase_orders` (requête `information_schema.columns` retourne 0 résultat). Tout appel à cette fonction en production provoquerait une erreur PostgreSQL `column "tva_amount" of relation "purchase_orders" does not exist`.

**Vérification activité** : `SELECT COUNT(*) FROM purchase_orders WHERE created_at > NOW() - INTERVAL '90 days'` retourne **24 lignes**. Les PO récentes ont donc été créées via un autre chemin (UI directe ou autre RPC), pas via `create_purchase_order` — sans quoi la fonction aurait déjà échoué. La fonction est probablement un artefact d'une migration ancienne jamais nettoyée.

**Action requise** : corriger ou supprimer `create_purchase_order` dans un sprint dédié. Non bloquant pour BO-FIN-009 Phase 1.

### 2b. Code applicatif — écriture dans `financial_documents.tva_amount`

| Fichier                                   | Opération                            | Formule tva_amount                                                                                                                                                                                              | Commentaire                                                                                                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `persist-financial-document.ts`           | INSERT                               | `sum(lineHt * vat_rate_num)` per item                                                                                                                                                                           | Facture client depuis order — calcul round-per-total côté JS                                                                                                                                                                                                    |
| `bank-matching.ts` (ligne 111)            | INSERT                               | `typedOrder.total_ttc - typedOrder.total_ht`                                                                                                                                                                    | Rapprochement bancaire — lit SO puis déduit la TVA                                                                                                                                                                                                              |
| `bank-matching.ts` (ligne 314)            | INSERT                               | `typedOrder.total_ttc - typedOrder.total_ht`                                                                                                                                                                    | Multi-match bancaire — idem                                                                                                                                                                                                                                     |
| `service/route.ts`                        | INSERT                               | `sum(item.unitPrice * quantity * vatRate)` per item                                                                                                                                                             | Facture service directe — round-per-total JS                                                                                                                                                                                                                    |
| `consolidate/route.ts`                    | INSERT                               | `invoice.total_vat_amount_cents / 100`                                                                                                                                                                          | Import Qonto historique — valeur Qonto                                                                                                                                                                                                                          |
| `sync-invoices/route.ts`                  | UPDATE                               | `(vat_amount_cents ?? 0) / 100`                                                                                                                                                                                 | Sync Qonto → local — valeur Qonto                                                                                                                                                                                                                               |
| `supplier-invoice-sync.ts`                | INSERT/UPDATE                        | `vatAmount` depuis Qonto                                                                                                                                                                                        | Sync factures fournisseurs Qonto                                                                                                                                                                                                                                |
| `quotes/[id]/convert/route.ts`            | INSERT                               | `invoice.total_vat_amount ?? invoice.total_vat_amount_cents / 100`                                                                                                                                              | Conversion devis → facture Qonto                                                                                                                                                                                                                                |
| `use-financial-documents.ts`              | INSERT direct                        | `params.tva_amount` (passé en paramètre)                                                                                                                                                                        | RPC `create_supplier_invoice`                                                                                                                                                                                                                                   |
| `use-financial-documents.ts`              | INSERT direct                        | `params.tva_amount` (passé en paramètre)                                                                                                                                                                        | Dépense directe (`createExpense`)                                                                                                                                                                                                                               |
| `classify-dialog.tsx`                     | INSERT                               | `ttc - ht`                                                                                                                                                                                                      | Classification manuelle document uploadé                                                                                                                                                                                                                        |
| `route.context.ts` (`saveQuoteToLocalDb`) | INSERT                               | `avgVat = sum(vatRate) / items.length` ; `tva = totalHt * avgVat` (sans ROUND)                                                                                                                                  | **CRITIQUE** — Devis sauvegardé en local. Formule de moyenne des taux invalide pour paniers multi-taux (ex : 5,5% + 20%) : produit un `tva_amount` faux. Peut violer la contrainte `check_totals_coherent`. Bug préexistant, indépendant de BO-FIN-009 Phase 1. |
| `use-expense-form.ts`                     | INSERT (via `insertExpenseDocument`) | Simple : `tva_amount = total_ht * tva_rate / 100`, puis `parseFloat(...toFixed(2))` ; Ventilé : `(vatLineXHt * X) / 100`, puis `parseFloat(...toFixed(2))` via `buildSimpleVatItem` / `buildVentilatedVatItems` | Cohérent avec la contrainte CHECK. Path indépendant du trigger `recalc_sales_order_on_charges_change` (pas d'impact Phase 1).                                                                                                                                   |

#### Écriture dans `financial_document_items.tva_amount`

| Fichier                                   | Formule tva_amount                                          |
| ----------------------------------------- | ----------------------------------------------------------- |
| `persist-financial-document.ts`           | `unit_price_ht * quantity * vat_rate_num` (round-per-total) |
| `[id]/route.ts` PATCH                     | `unit_price_ht * quantity * (tva_rate / 100)`               |
| `[id]/sync-to-order/route.ts`             | lu depuis `financial_document_items`, non recalculé         |
| `use-quotes-mutations.ts`                 | via `computeItemTotals()` = `total_ht * (tva_rate/100)`     |
| `quotes/helpers.ts` (`computeItemTotals`) | `total_ht * (tva_rate / 100)` — pas de ROUND                |

---

## 3. Consommateurs (READ)

### 3a. Routes API — lecture `tva_amount`

| Fichier                                    | Usage                                                                       | Nature                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------- |
| `[id]/details/route.ts`                    | SELECT `tva_amount` dans `financial_documents` + `financial_document_items` | Affichage brut — retourné dans JSON                      |
| `[id]/route.ts` GET                        | Lecture `tva_amount` via `InvoiceWithOrder` interface                       | Lecture pour enrichissement adresses, pas recalcul       |
| `[id]/sync-to-order/route.ts`              | Lit `tva_amount` des items via SELECT                                       | Non utilisé dans le calcul de la mise à jour SO (ignoré) |
| `quotes/from-invoice/[invoiceId]/route.ts` | Potentiellement via select `*`                                              | A vérifier                                               |

### 3b. Composants UI — affichage `tva_amount`

| Fichier                               | Usage                                                             | Nature                                                                           |
| ------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `ExpenseAmounts.tsx`                  | `document.tva_amount.toFixed(2)`                                  | Affichage brut — champ TVA en euros                                              |
| `InvoiceTotalsCard.tsx`               | `item.tva_amount` par ligne pour ventilation TVA par taux         | Somme agrégée par taux — affichage comptable                                     |
| `TransactionDetailExpandedLayout.tsx` | `item.tva_amount` via `vat_breakdown` de `bank_transactions`      | Affichage brut ventilation — pas de `financial_documents.tva_amount` directement |
| `TransactionDetailCompactLayout.tsx`  | Idem — `vat_breakdown[].tva_amount`                               | Affichage brut                                                                   |
| `InvoiceDetailModal.tsx`              | `invoice.tva_amount` dans `invoiceForCreditNote.total_vat_amount` | Passé à `CreditNoteCreateModal` pour initialiser un avoir                        |

### 3c. Hooks — lecture `tva_amount`

| Fichier                                     | Usage                                                                               | Nature                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `use-financial-documents.ts`                | SELECT `tva_amount` dans liste documents                                            | Lecture pour affichage liste                                      |
| `use-consultation-quotes.ts`                | SELECT `tva_amount` dans SELECT fields                                              | Affichage quote dans contexte consultation                        |
| `use-rapprochement-vat.ts`                  | Ne lit pas `tva_amount` directement — calcule `(total_ttc - total_ht)` depuis SO/FD | Calcul VAT auto pour rapprochement bancaire                       |
| `quotes/helpers.ts` (`QUOTE_SELECT_FIELDS`) | SELECT inclut `tva_amount`                                                          | Lecture pour affichage devis                                      |
| `quotes/types.ts`                           | Déclaration type `Quote.tva_amount`                                                 | Typage uniquement                                                 |
| `unified-transactions/types.ts`             | `vat_breakdown[].tva_amount` (bank_transactions)                                    | Différent — champ JSON bank_transactions, pas financial_documents |

### 3d. Templates PDF

| Fichier               | Usage                                 | Nature                                                            |
| --------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `QuoteSummaryPdf.tsx` | `formatCurrency(quote.tva_amount, 2)` | **Affichage PDF officiel** — montant TVA imprimé sur devis client |

### 3e. Services de classification / VAT

| Fichier                              | Usage                                                                                                                      | Nature                                                                                                                          |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `use-quick-classification-submit.ts` | `vat_breakdown[].tva_amount` — champ de `bank_transactions`, pas `financial_documents`                                     | Pas de lecture directe de `financial_documents.tva_amount`                                                                      |
| `qonto-sync-types.ts`                | `TransactionDbData.vat_breakdown[].tva_amount` — bank_transactions uniquement                                              | Pas concerné                                                                                                                    |
| `qonto-sync-upsert.ts`               | **Producteur effectif** de `bank_transactions.vat_breakdown[].tva_amount` (JSONB) : `item.amount_cents / 100` depuis Qonto | Champ JSONB dans `bank_transactions` — **distinct** de `financial_documents.tva_amount`. Non affecté par le changement Phase 1. |

---

## 4. Vues SQL dépendantes

Requête `pg_views WHERE definition ILIKE '%tva_amount%'` : **aucun résultat**.

Il n'existe aucune vue SQL publique qui dépende de `financial_documents.tva_amount` ou
`financial_document_items.tva_amount`.

---

## 5. Exports comptables / Rapports TVA

### 5a. Routes export

Deux routes d'export ont été identifiées dans le codebase :

- **`apps/back-office/src/app/api/finance/export-fec/route.ts`** — Export FEC officiel au format DGFIP. Source : table `bank_transactions` (colonnes `amount`, `settled_at`, `label`, `category_pcg`, `reference`, etc.) avec jointure `financial_documents!matched_document_id` pour `document_date` et `document_number` uniquement. **`financial_documents.tva_amount` n'est pas lu. Non affecté par Phase 1.**

- **`apps/back-office/src/app/api/finance/export-justificatifs/route.ts`** — Export ZIP de PDFs justificatifs. Sources : bucket Supabase Storage "justificatifs" (mode legacy) et table `financial_documents` (mode bibliothèque, champs `uploaded_file_url` et métadonnées). Aucun montant `tva_amount` lu ou calculé. **Non affecté par Phase 1.**

Il n'existe pas de route dédiée export CSV/Excel de `tva_amount`.

### 5b. Tableau de bord finance

- Les stats de `useFinancialDocuments.getStats()` ne somment que `total_ttc` et `amount_paid`. `tva_amount` n'est pas agrégé dans les KPIs de dashboard.
- Le hook `use-expenses.ts` (`v_expenses_with_details`) ne fait pas de somme de `tva_amount`.

### 5c. PDF devis

`QuoteSummaryPdf.tsx` imprime `quote.tva_amount` en clair sur le PDF remis au client. C'est le seul
document à caractère commercial remis à l'extérieur qui contient `tva_amount`.

### 5d. Avoir (CreditNote)

`InvoiceDetailModal.tsx` passe `invoice.tva_amount` comme `total_vat_amount` à `CreditNoteCreateModal`.
Ce montant initialise le formulaire de création d'avoir Qonto. Un avoir créé avec un `tva_amount`
décalé de 1 centime peut générer une divergence sur l'avoir Qonto.

---

## 6. Impact estimé du changement round-per-total → round-per-line

### Sans impact — affichage brut

Ces consommateurs affichent `tva_amount` tel quel, sans logique métier dépendante de la valeur
exacte. Un delta de ±1 centime n'y est pas visible ou sans conséquence :

- `ExpenseAmounts.tsx` — affichage `document.tva_amount.toFixed(2)` en euros
- `InvoiceTotalsCard.tsx` — somme de `item.tva_amount` par taux pour affichage ; la ventilation
  reste cohérente car c'est une somme d'affichage
- `TransactionDetailExpandedLayout.tsx` / `TransactionDetailCompactLayout.tsx` — affichage
  `vat_breakdown[].tva_amount` de `bank_transactions` (non lié au changement)
- `use-financial-documents.ts` SELECT — affichage liste, pas de logique sensible
- `use-consultation-quotes.ts` — affichage consultation, pas de calcul dérivé
- `[id]/details/route.ts` — JSON d'affichage, pas de calcul

### Impact mineur — somme agrégée

Ces consommateurs agrègent plusieurs `tva_amount`. Un delta de ±1 centime par document peut
s'accumuler sur un agrégat de N documents :

- `use-rapprochement-vat.ts` : calcule la TVA de la transaction rapprochée par
  `(total_ttc - total_ht)` depuis sales_orders et financial_documents. Si `total_ttc` de la
  commande varie de 1 centime suite au changement de trigger, le `amount_vat` calculé dans
  `bank_transactions` sera décalé de 1 centime. **Impact : possible divergence de 1 ct sur la TVA
  déductible enregistrée dans `bank_transactions.amount_vat`.**
- `bank-matching.ts` (deux producteurs) : calcule `tva_amount = total_ttc - total_ht` de la
  commande pour créer `financial_documents`. Si `sales_orders.total_ttc` change de 1 centime,
  `financial_documents.tva_amount` créé sera décalé.

### Impact fort — logique métier dépendante de la valeur exacte

Ces consommateurs utilisent `tva_amount` dans une logique où un delta de ±1 centime a une
conséquence fonctionnelle :

| Fichier                                            | Risque                     | Détail                                                                                                                                                                |
| -------------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `QuoteSummaryPdf.tsx`                              | **Document légal**         | TVA imprimée sur le PDF remis au client. Une différence de 1 ct entre la TVA affichée sur le PDF et la TVA réelle peut générer un litige ou un refus de déductibilité |
| `InvoiceDetailModal.tsx` → `CreditNoteCreateModal` | **Avoir Qonto**            | `invoice.tva_amount` initialise `total_vat_amount` de l'avoir. Un avoir créé avec 1 ct d'écart est refusé ou produit une discordance dans Qonto                       |
| `consolidate/route.ts`                             | **Import historique**      | Utilise la valeur Qonto directement — non affecté par le changement de trigger                                                                                        |
| `sync-invoices/route.ts`                           | **Sync Qonto**             | Valeur Qonto directe — non affecté                                                                                                                                    |
| `create_customer_invoice_from_order` RPC           | **Facture client générée** | Taux fixe 20% hardcodé — non affecté par le changement de trigger                                                                                                     |

#### Contrainte DB CHECK

La table `financial_documents` a une contrainte :

```
abs(total_ttc - (total_ht + tva_amount)) < 0.01
```

(mentionnée dans les commentaires du code `consolidate/route.ts`). Tout producteur qui calcule
`tva_amount` de façon indépendante de `total_ttc` peut violer cette contrainte si le delta
d'arrondi dépasse 0.01. **Le changement round-per-line doit garantir que cette contrainte reste
satisfaite.**

---

## 7. Recommandations pour BO-FIN-009 Phase 1

### 7a. Périmètre du trigger `recalc_sales_order_on_charges_change`

Le trigger **ne met à jour que `sales_orders.total_ttc`**. Il ne touche pas à `financial_documents`.
Le risque direct de BO-FIN-009 Phase 1 sur `financial_documents.tva_amount` est donc **indirect**
uniquement : les producteurs applicatifs qui lisent `(sales_orders.total_ttc - sales_orders.total_ht)`
pour calculer `tva_amount` lors de la création d'un document.

### 7b. Actions requises avant livraison

1. **`bank-matching.ts` (2 occurrences)** : La formule `tva_amount = total_ttc - total_ht` lue sur
   la commande est affectée si `total_ttc` change de formule. Vérifier que la contrainte
   `abs(total_ttc - (total_ht + tva_amount)) < 0.01` reste satisfaite après le changement.

2. **`persist-financial-document.ts`** : Calcule `tva_amount` en JS par sommation per-item sans
   `ROUND` intermédiaire. Le résultat peut différer de Qonto. Ce n'est pas affecté par le trigger,
   mais la formule est déjà incohérente avec Qonto.

3. **Contrainte `abs(total_ttc - (total_ht + tva_amount)) < 0.01`** : Valider en staging que le
   nouveau total_ttc produit par round-per-line reste dans la tolérance pour tous les cas de prix
   avec frais.

4. **`QuoteSummaryPdf.tsx`** : Le `tva_amount` affiché sur le PDF vient de `financial_documents`
   (un devis), pas de `sales_orders`. Ce devis est créé via `use-quotes-mutations.ts` →
   `computeDocumentTotals()` → somme des `computeItemTotals()`. Ce calcul est entièrement
   applicatif et **n'est pas affecté par le trigger**.

5. **`InvoiceDetailModal → CreditNoteCreateModal`** : Idem, la source est `financial_documents`,
   pas `sales_orders`. Non affecté directement.

### 7c. Ce qui est réellement affecté par le changement de formule dans le trigger

Le trigger `recalc_sales_order_on_charges_change` opère sur `sales_orders`. Les `financial_documents`
liés à une commande **ne sont pas recalculés automatiquement** quand `sales_orders.total_ttc` change.
La seule propagation se fait lors de la **création** du `financial_document` (via `bank-matching.ts`
ou les RPCs). Si les documents existent déjà, ils conservent leur `tva_amount` d'origine.

**Conclusion** : Le risque de BO-FIN-009 Phase 1 sur les consommateurs `tva_amount` est **faible à
moyen**. Aucun rapport TVA officiel ni export comptable ne consomme directement cette colonne. Le
risque principal est la création de nouveaux documents financiers post-changement avec un
`tva_amount` différent de 1 centime.

---

## 8. Plan de backfill proposé

Pas de backfill immédiat requis pour Phase 1 car :

1. Les `financial_documents` existants **ne sont pas recalculés** par le trigger — ils gardent leur
   valeur historique.
2. Les nouveaux documents créés après le changement utiliseront la nouvelle formule.
3. Il n'existe pas de rapport TVA officiel agrégeant ces montants en production (pas de route export
   identifiée).

**Si une déclaration TVA est prévue** (module comptable futur), un backfill devra :

- Recalculer `tva_amount` sur tous les `financial_documents` de type `customer_invoice` liés à une
  commande créée après la date de déploiement de BO-FIN-009.
- Vérifier la contrainte `abs(total_ttc - (total_ht + tva_amount)) < 0.01` sur chaque ligne.

**Script de vérification post-déploiement :**

```sql
SELECT id, document_number, total_ht, tva_amount, total_ttc,
       abs(total_ttc - (total_ht + tva_amount)) AS delta
FROM financial_documents
WHERE abs(total_ttc - (total_ht + tva_amount)) >= 0.01
ORDER BY delta DESC;
```

---

## Synthèse finale

**Colonnes auditées** : `financial_documents.tva_amount` (NOT NULL, numeric) et
`financial_document_items.tva_amount` (NOT NULL, numeric). La colonne `sales_orders.tva_amount`
n'existe pas.

**Producteurs** : 13 points d'écriture applicatifs + 3 fonctions DB + 1 bug latent (`create_purchase_order` sur colonne inexistante `purchase_orders.tva_amount`). Le trigger `recalc_sales_order_on_charges_change` ne produit pas de `tva_amount` directement.

**Consommateurs READ** : 14 fichiers identifiés. Deux routes export identifiées (`export-fec`, `export-justificatifs`) — ni l'une ni l'autre ne consomme `financial_documents.tva_amount`, non affectées. Le seul document externe est `QuoteSummaryPdf.tsx` (devis PDF client) — non affecté par le trigger.

**Vues SQL** : Aucune.

**Impact BO-FIN-009 Phase 1** : Faible. Le changement round-per-line dans
`recalc_sales_order_on_charges_change` modifie `sales_orders.total_ttc`, pas directement
`financial_documents.tva_amount`. Les seuls consommateurs exposés sont les producteurs qui
dérivent `tva_amount` de `(total_ttc - total_ht)` lors d'une nouvelle création de document
(bank-matching). Risque maîtrisable par validation de la contrainte CHECK en staging.

**Feu vert conditionnel** pour BO-FIN-009 Phase 1, sous réserve de :

1. Tester la contrainte `abs(total_ttc - (total_ht + tva_amount)) < 0.01` en staging sur des
   commandes avec frais (shipping/handling/insurance).
2. Vérifier `bank-matching.ts` : la formule `tva_amount = total_ttc - total_ht` reste cohérente
   avec la nouvelle `total_ttc`.
3. **Valider que `saveQuoteToLocalDb` (`route.context.ts`) ne viole pas la contrainte
   `check_totals_coherent` sur des paniers multi-taux** (ex : 1 item à 5,5% + 1 item à 20%). La
   formule actuelle `avgVat = sum(vatRate) / items.length` produit un taux moyen erroné (12,75% au
   lieu de calculer la TVA ligne par ligne), ce qui peut générer un `tva_amount` incohérent avec
   `total_ttc`. Ce bug préexistant est indépendant du trigger modifié mais doit être corrigé dans
   **BO-FIN-009 Phase 2** ou un sprint dédié avant tout passage en production multi-taux.
