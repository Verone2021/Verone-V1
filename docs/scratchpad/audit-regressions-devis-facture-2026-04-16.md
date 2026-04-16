# Audit regressions Devis / Facture — 2026-04-16

**Branche** : `fix/BO-FIN-005-audit-regressions-devis-facture`
**Mode** : read-only strict, aucun fix applique.
**Scope** : FLOW A (lien commande), FLOW B (libelle/service), FLOW C (MAJ auto), refactorings BO-PROD-001 du 14 avril.

---

## Synthese executive

| Flow                                    | Statut             | Bugs confirmes                                                                                     | Commits coupables                            |
| --------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **FLOW A** — lien commande              | **PARTIEL**        | Pre-remplissage adresses casse (4→16 avril, fix partiel aujourd'hui) + format `PROFORMA-)-YYYY-MM` | `0f12f87b1` (4 avril), `5739cc0c8` (9 avril) |
| **FLOW B** — libelle/service            | **CASSE**          | Factures de service jamais sauvees en DB locale (FK violation silencieuse) depuis le 9 avril       | `2b7fc3920` (9 avril)                        |
| **FLOW C** — MAJ auto commande→document | **N'EXISTE PAS**   | Aucun code trouve ; seul le sens inverse `invoice→order` existe                                    | —                                            |
| Refactorings BO-PROD-001 14 avril       | **1 CASSE / 5 OK** | `InvoiceCreateServiceModal` (deja revert `bdf666a81`)                                              | voir section dediee                          |
| Bug format `PROFORMA-)-YYYY-MM`         | **CONFIRME**       | `.split(' ').pop()` casse sur trade_name parenthese/espaces                                        | `5739cc0c8` (9 avril)                        |

**Prio de fix** :

1. **FLOW B — route service** (facture de service perdue en silence chaque jour) — 15 min
2. **FLOW A — colonnes shipping manquantes en list fetch** — 10 min
3. **FLOW A — format PROFORMA** (slug propre) — 15 min
4. **FLOW C** — sprint a planifier (decision Romeo)

---

## FLOW B — Devis / Facture libelle (CRITIQUE)

### 1. InvoiceCreateServiceModal — modal : OK / route : **CASSEE**

**Modal** `packages/@verone/finance/src/components/InvoiceCreateServiceModal.tsx`

- Fichier marque `@protected`. 573 lignes. Compile, se mount, preleve bien `clientId`/`items` puis POST `/api/qonto/invoices/service`.
- Restore par `bdf666a81` (16 avril 15:38), apres revert du refactoring `1f42c677a` (14 avril 02:35, 562→246 lignes) qui avait casse le pre-remplissage adresses.
- **Aucun refactoring depuis le revert**. Verifie via `git log` sur le fichier : pas de commit apres `bdf666a81`.

**Route** `apps/back-office/src/app/api/qonto/invoices/service/route.ts:329`

```ts
const systemUserId = '00000000-0000-0000-0000-000000000000'; // system user
// ...
created_by: systemUserId,
```

**Bug verifie** en DB :

```sql
SELECT id FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000000';
-- [] (aucun utilisateur)
```

FK `financial_documents_created_by_fkey` → `auth.users(id)` echoue donc systematiquement. L'erreur est attrapee et loggee (ligne 369-375) mais **n'interrompt pas la reponse** :

```ts
if (insertDocError) {
  console.error(
    '[API Qonto Invoices Service] Failed to insert financial_document:',
    insertDocError
  );
  // Ne pas échouer la requête - la facture Qonto est créée
}
```

Resultat reel :

- Facture Qonto creee ✓
- Ligne `financial_documents` NON creee ✗
- Facture invisible dans `/factures` (le fetcher utilise `financial_documents`)
- Aucune trace dans l'UI — cote Qonto uniquement

**Commit coupable** : `2b7fc3920 [BO-FIN-005] fix: service invoices now create local financial_documents record` (9 avril). Introduit le fake UUID, suppose qu'un system user existe en DB — ce n'est pas le cas.

**Preuve impact** : DB query sur `financial_documents` :

```sql
SELECT COUNT(*) FROM financial_documents
WHERE document_type='customer_invoice' AND status='draft';
-- 1 (uniquement celle creee via /api/qonto/invoices standard, route `invoice-from-order`)
```

**Fix propose** (pour plus tard, apres accord) :

- Recuperer l'utilisateur authentifie via `createServerClient()` comme dans la route standard (`route.ts:737-741`)
- OU creer reellement un user `system@verone.local` en `auth.users` et utiliser son id
- Meme pattern deja applique dans la route principale `/api/qonto/invoices/route.ts`

---

### 2. QuoteFormModal — "Devis de service" : OK (avec fragilite)

**Modal** `packages/@verone/finance/src/components/QuoteFormModal/index.tsx` (94 lignes)

- Compile, mount, titre "Devis de service" ligne 29.
- Delegue a `useQuoteForm` (orchestrator) → `useQuoteSubmit.handleSubmit` → `useQuotes().createQuote`.

**Route/hook utilise** : `packages/@verone/finance/src/hooks/quotes/use-quotes-mutations.ts:32-152`

- Utilise `supabase.auth.getUser()` (line 45) — PAS de fake UUID ici → pas de bug FK.
- Contourne la contrainte `check_sales_order_only_customer` via `document_type='customer_quote'` (qui autorise `sales_order_id NULL`). Contrainte verifiee en DB :
  ```
  CHECK ((sales_order_id IS NULL) OR (document_type = 'customer_invoice'))
  ```
  → `customer_quote` avec `sales_order_id=NULL` est autorise.
- Pattern : INSERT financial_documents → push-to-qonto → si push echoue, **rollback local** (lignes 116-140). C'est fragile : si Qonto rejette (ex : VAT manquant), le devis local est supprime.

**Refactorings impactants** :

- `950931fd8` (12 avril) `simplify QuoteFormModal to service-only mode` : suppression de 1860 lignes (wizard multi-canal). La version actuelle est coherente avec l'intention "service only".
- `c3030bdde` (14 avril) `use-quotes 932→49 lines` : API surface preservee (createQuote, updateQuote, changeQuoteStatus, deleteQuote, fetchQuotes).

**Verdict** : fonctionne a condition que le client ait un VAT/SIRET + adresse. Pas de regression confirmee.

---

## FLOW A — Devis / Facture depuis une commande

### 1. InvoiceCreateFromOrderModal

**Composant** : `packages/@verone/finance/src/components/InvoiceCreateFromOrderModal/*` (13 sous-fichiers, refacto par `9d6b69479` le 5 avril).

**Pre-remplissage adresses** — logique dans `useInvoiceCreateState.resolveBillingAddress`/`resolveShippingAddress` :

- Priorite 1 : `order.billing_address` JSONB
- Priorite 2 : `org.billing_*` (billing_address_line1, billing_city, billing_postal_code, billing_country)
- Priorite 3 : `org.address_line1`, `org.city`, `org.postal_code`, `org.country`

**Bug confirme** : le fetcher `packages/@verone/orders/src/hooks/use-sales-orders-fetch.ts` (utilise pour OUVRIR la modal depuis la page detail commande) ne ramenait PAS les colonnes `billing_*` entre le 4 et le 16 avril.

Fix applique aujourd'hui (16 avril 15:40) dans `e4f06cb8a` : colonnes ajoutees dont `billing_address_line1`, `billing_city`, `billing_postal_code`, `billing_country`, `shipping_address_line1`, `shipping_city`, `shipping_postal_code`, `shipping_country`, `has_different_shipping_address`.

**Bug persistant** : le fetcher de LISTE `packages/@verone/orders/src/hooks/use-sales-orders-fetch-list.ts:288` (utilise pour OUVRIR la modal depuis `/commandes/clients`) ne fetch PAS les colonnes `shipping_*` :

```
.select('id, legal_name, trade_name, email, phone, website, address_line1, address_line2,
        postal_code, city, region, enseigne_id, siret, vat_number,
        billing_address_line1, billing_address_line2, billing_city, billing_postal_code, billing_country')
```

Pas de `shipping_*`, pas de `has_different_shipping_address`. Donc `resolveShippingAddress()` retourne `null` systematiquement quand ouvert depuis la liste.

**Commit coupable initial** : `0f12f87b1 [BO-MAXLINES-008]` (4 avril 02:57, split `use-sales-orders` 1878→7 modules). La version avant split fetchait `billing_*` (ligne 293 historique). Les `shipping_*` n'ont jamais ete fetche ici.

**Format PROFORMA** — bug connu : `apps/back-office/src/app/api/qonto/invoices/route.ts:754`

```ts
document_number: autoFinalize
  ? finalizedInvoice.invoice_number
  : `PROFORMA-${(customerName ?? 'CLIENT').split(' ').pop()?.toUpperCase() ?? 'CLIENT'}-YYYY-MM`,
```

`.split(' ').pop()` casse sur :

- Trade name avec espace final → last word = `")"`
- Exemple reel confirme en DB : SO-2026-00153 client "ALOHA VICTOIRE (Pokawa Cergy )" → `PROFORMA-)-2026-04`.

**Commit coupable** : `5739cc0c8 [BO-FIN-004]` (9 avril), qui a introduit cette formule naive.

---

### 2. QuoteCreateFromOrderModal

**Composant** : `packages/@verone/finance/src/components/QuoteCreateFromOrderModal/*` (10 sous-fichiers, refacto par `4f060e570` le 14 avril).

**Compile, mount, flux** :

- POST `/api/qonto/quotes` avec `salesOrderId` (ligne 149)
- Route appelle `linkQuoteToOrder(supabase, body.salesOrderId, quote.id, quote.quote_number)` (`route.ts:225-231` → `route.context.ts:225-245`)
- → UPDATE sales_orders.quote_qonto_id + quote_number ✓
- → INSERT financial_documents via `saveQuoteToLocalDb` ✓ (utilise user authentifie, pas de fake UUID)

**Q-A conservation** : fonction `linkQuoteToOrder` presente, meme SQL. ✓
**Q-B conditions** : identiques. ✓
**Q-C appels API** : `supabase.from('sales_orders').update({quote_qonto_id, quote_number}).eq('id', salesOrderId)` preserve. ✓
**Q-D imports** : pas de perte de fonctionnalite detectee dans la transition 1007→376.

**Pre-remplissage adresses** : utilise la meme logique `resolveBillingAddress` — meme bug dormant via fetcher liste (`shipping_*` jamais fetche).

**Verdict** : API fonctionnelle, pre-remplissage partiellement casse (cf. fetcher liste).

---

### 3. SalesOrderTableRow — affichage devis/proforma sous commande

**Composant** : `packages/@verone/orders/src/components/sales-orders-table/SalesOrderTableRow.tsx:126-141`

```tsx
{order.quote_number &&
  (!order.invoice_number || order.invoice_status === 'draft') && (
    <Link href={order.quote_qonto_id ? `/factures/devis/${order.quote_qonto_id}` : '#'} ...>
      {order.quote_number}
    </Link>
  )}
```

**Q-B conditions identiques** a l'avant-refactor `b11febd3b` : compare ligne par ligne, condition strictement preservee (diff exact des lignes 315-345 avant / 108-141 apres).

**Affichage OK**. Ce qui manque c'est les DONNEES :

- `quote_number` dans `sales_orders` : mis a jour uniquement via `linkQuoteToOrder` (FLOW A via `/api/qonto/quotes` POST). Si devis cree autrement → non lie.
- `invoice_number` via `financial_documents` : n'apparait que si FLOW A (invoice from order) OU FLOW B reussi. FLOW B etant casse depuis le 9 avril, les proformas de service ne remontent pas.

---

## FLOW C — Mise a jour auto commande → devis/facture

**Recherche exhaustive** :

```
grep -r "UpdateInvoiceFromOrder|SyncInvoiceWithOrder|sync.*invoice.*order" — apps/ packages/
```

**Resultats** :

- `apps/back-office/src/app/api/qonto/invoices/[id]/sync-to-order/route.ts` → sens **INVERSE** (invoice → order) uniquement
- Aucun code qui detecte un UPDATE sur `sales_orders` pour propager vers `financial_documents` ou Qonto
- Aucun trigger DB dans `information_schema.triggers WHERE event_object_table='sales_orders'` (verifie) qui touche `financial_documents` ou Qonto
- Aucun modal `UpdateInvoiceFromOrderModal`, `SyncInvoiceWithOrderModal`, ni equivalent

**Verdict** : **FONCTIONNALITE NON IMPLEMENTEE**. Romeo a peut-etre demande cette feature mais elle n'existe pas dans le code.

**Recommandation** : sprint dedie `BO-FIN-00X`, apres validation Romeo. Design a discuter :

- Webhook Qonto-side ou polling ?
- Trigger DB vs action manuelle (modal "MAJ les documents Qonto") ?
- Gestion des factures finalisees vs brouillons (les finalisees ne peuvent pas etre modifiees sur Qonto) ?

---

## Refactorings BO-PROD-001 du 14 avril — audit detaille

| Commit                    | Fichier                            | Verdict                                                       | Preuve                                                                                                                                                                                          |
| ------------------------- | ---------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `b11febd3b`               | SalesOrderDataTable 631→211        | **OK**                                                        | Logique d'affichage devis/proforma preservee a l'identique (diff ligne 315-345 vs TableRow 108-141)                                                                                             |
| `4f060e570`               | QuoteCreateFromOrderModal 1007→376 | **OK**                                                        | API `POST /api/qonto/quotes` intacte ; `linkQuoteToOrder` preserve cote route                                                                                                                   |
| `c3030bdde`               | use-quotes 932→49                  | **OK**                                                        | API surface preservee (createQuote, updateQuote, changeQuoteStatus, deleteQuote, fetchQuotes, fetchQuote)                                                                                       |
| `5c7337f9b` + `50db5eeba` | qonto-sync 631→390                 | **OK** (non critique)                                         | Utilise pour sync de reconciliation, pas pour FLOW A/B. Pas de regression visible dans `/commandes/clients`.                                                                                    |
| `2003949ea`               | factures pages 976/974/883         | **SUSPECT** (a verifier si Romeo constate un bug d'affichage) | Refactor de pages d'affichage uniquement ; pas de mutation de donnees. Extractions en hooks/sous-composants. Risque modere si une condition ou un `useMemo` a ete laisse dans le mauvais scope. |
| `1f42c677a`               | InvoiceCreateServiceModal 562→246  | **CASSE** (deja revert)                                       | Revert `bdf666a81` le 16 avril a 15:38                                                                                                                                                          |

**Autres refactorings 14 avril non couverts par la mission** :

- `bcde467ce` SalesOrderShipmentForm 616→233 — affecte FLOW expeditions, non FLOW devis/facture
- `df48686e1` PurchaseOrderReceptionForm 709→290 — affecte FLOW fournisseurs
- `7a80d8e45` OrderSelectModal 599→169 — fournit les types `IOrderForDocument`, `ICustomLine`, `IDocumentAddress` utilises par les 2 modals FLOW A. A verifier que les interfaces exportees n'ont pas change.
- `88c639ddc` use-pricing 607→37 — si utilise par QuoteCreateFromOrderModal ou InvoiceCreateFromOrderModal, risque.

**NOTE** : `72520ab3e` (11 avril) `remove dead auto-create sales_order code from quote convert` est **INTENTIONNEL** (Romeo confirme, reverse flow supprime volontairement). NON listee comme regression.

---

## Plan d'action propose (ordre de fix)

| Priorite        | Cible                                                                                                                                              | Temps      | Impact utilisateur                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------- |
| **P0**          | FLOW B route `/api/qonto/invoices/service` — remplacer fake UUID par `createServerClient().auth.getUser()`                                         | 15 min     | Factures de service apparaitront dans `/factures`    |
| **P1**          | FLOW A fetcher liste `use-sales-orders-fetch-list.ts` — ajouter colonnes `shipping_*` + `has_different_shipping_address`                           | 10 min     | Pre-remplissage shipping depuis `/commandes/clients` |
| **P2**          | Format `PROFORMA-XXX` — remplacer `.split(' ').pop()` par slug de `trade_name` ou `legal_name` (kebab-case, lowercase ASCII)                       | 15 min     | Numeros proforma lisibles et coherents               |
| **P3**          | Factures de service orphelines en Qonto (depuis 9 avril) — script de re-sync ou creation manuelle des lignes `financial_documents` correspondantes | 30-60 min  | Historique complet                                   |
| **P4** (sprint) | FLOW C — MAJ auto commande → documents                                                                                                             | A chiffrer | Coherence donnees                                    |

**Aucun fix applique**. Attente ordre de Romeo.

---

## Annexes

### Contrainte DB verifiee

```sql
-- check_sales_order_only_customer
CHECK ((sales_order_id IS NULL) OR (sales_order_id IS NOT NULL AND document_type = 'customer_invoice'))
-- → sales_order_id peut etre NULL pour tout document_type
-- → NON : sales_order_id=NOT NULL implique document_type='customer_invoice'
```

### Colonnes financial_documents (nullable critiques)

- `partner_id` : NOT NULL (uuid, FK organisations ou individual_customers)
- `sales_order_id` : NULLABLE (uuid)
- `created_by` : NOT NULL (uuid, FK auth.users) ← **cause du bug FLOW B**
- `qonto_invoice_id` : NULLABLE mais requis si `document_type='customer_invoice'` (contrainte `check_qonto_required_for_customer_invoices`)

### Etat actuel DB (sample)

```
SO-2026-00153 → invoice_number = "PROFORMA-)-2026-04" (format casse confirme)
SO-2026-00157 → quote D-2026-043 lie correctement
SO-2026-00131 → quote D-2026-020 lie correctement
Autres SO recentes → pas de document local
```
