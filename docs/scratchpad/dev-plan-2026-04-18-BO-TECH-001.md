# Dev Plan — BO-TECH-001 Refactor route.ts /api/qonto/invoices (2026-04-18)

## Contexte

Fichier : `apps/back-office/src/app/api/qonto/invoices/route.ts`
Taille actuelle : **926 lignes** (limite repo : 400).
Branche : `refactor/BO-TECH-001-route-qonto-invoices`

Ce refactor est un **PREREQUIS obligatoire avant BO-FIN-009** (alignement arrondi + verrouillages). Sans decoupage, BO-FIN-009 fera exploser le fichier.

**CONTRAINTE ABSOLUE** : refactor iso-fonctionnel. Zero changement :

- de l'URL `/api/qonto/invoices` (GET, POST)
- du body attendu (salesOrderId, fees, customLines, etc.)
- du JSON retourne (success, invoice, localDocumentId, message, error, details)
- des statuts HTTP (200, 400, 404, 409, 500)
- des side effects (INSERT financial_documents, INSERT financial_document_items, appels Qonto)
- des messages d'erreur textuels (copie exacte, meme la ponctuation)
- des logs console.error / console.warn

## Analyse actuelle du fichier (926 lignes)

### Structure

1. **Imports + types globaux** (L1-46) : imports, `ISalesOrderWithItems`, `ISalesOrderWithCustomer`
2. **Helper** (L47-54) : `getQontoClient()`
3. **GET handler** (L56-211, 155L) : liste factures + enrichissement local
4. **Interfaces POST** (L213-254) : `IFeesData`, `ICustomLine`, `IAddressData`, `_IPostRequestBody`
5. **POST handler** (L256-926, 670L) :
   - Rate limiting (L274-281)
   - Parse body + validation salesOrderId (L283-313)
   - Guard anti-doublon (L315-377) : check existing + refus 409 si finalized + soft-delete drafts
   - Fetch order + customer polymorphique (L379-432)
   - Resolve Qonto client (L434-562) : extraire email/name/vat, validate adresse billing, find/create
   - Get bank account (L564-572)
   - Build items (L574-691) : mapper sales_order_items + frais (shipping/handling/insurance) + customLines
   - Compute issueDate + dueDate (L693-722)
   - Create invoice + correction date + finalize (L724-757)
   - Compute totaux + partner_id + user (L759-786)
   - INSERT financial_documents (L787-851)
   - INSERT financial_document_items (L853-891)
   - Else branch (individual, L893-897)
   - Return success (L899-906)
   - Catch error (L907-925)

## Plan de decoupage

Creation dossier `apps/back-office/src/app/api/qonto/invoices/_lib/` (prefixe `_` = private Next.js, non exporte comme route).

### Fichiers a creer (9 modules)

1. **`_lib/types.ts`** (~70L)
   - `ISalesOrderWithItems`, `ISalesOrderWithCustomer`
   - `IFeesData`, `ICustomLine`, `IAddressData`
   - `IPostRequestBody`
   - `IInvoiceItem`
   - `ILocalDocData`
   - Type reexport de `Organisation`, `IndividualCustomer`, `SalesOrder`

2. **`_lib/qonto-client.ts`** (~15L)
   - `export function getQontoClient(): QontoClient`

3. **`_lib/enrich-invoices-list.ts`** (~110L)
   - `export async function enrichInvoicesList(result, supabase): Promise<EnrichedInvoices>`
   - Contient logique de fetch financial_documents + map + merge (L85-193)
   - Input : `result` (Qonto), `supabase` client
   - Output : `enrichedInvoices[]`

4. **`_lib/duplicate-guard.ts`** (~75L)
   - `export async function checkAndCleanExistingInvoices(supabase, qontoClient, salesOrderId): Promise<{ conflict: NextResponse | null }>`
   - Retourne `{ conflict: NextResponse }` si 409 (finalized) ou erreur soft-delete 500
   - Retourne `{ conflict: null }` si OK pour continuer (drafts supprimes avec succes ou pas de drafts)
   - Encapsule logique L315-377

5. **`_lib/fetch-order-with-customer.ts`** (~60L)
   - `export async function fetchOrderWithCustomer(supabase, salesOrderId): Promise<{ order: ISalesOrderWithCustomer | null, error: NextResponse | null }>`
   - Fait le fetch order + items + customer polymorphique
   - Retourne `{ error: NextResponse }` si 404

6. **`_lib/resolve-qonto-client.ts`** (~130L)
   - `export async function resolveQontoClient(qontoClient, order, bodyBillingAddress): Promise<{ qontoClientId: string, error: NextResponse | null }>`
   - Extract customerEmail/Name/vatNumber
   - Validate adresse (billing) + message erreur 400 "SIRET ou TVA" + 400 "Adresse incomplete"
   - find/create Qonto client

7. **`_lib/build-invoice-items.ts`** (~85L)
   - `export function buildInvoiceItems(order, fees, customLines): IInvoiceItem[]`
   - Mapper sales_order_items + frais shipping/handling/insurance + customLines
   - Calcul feesVatRate

8. **`_lib/compute-due-date.ts`** (~35L)
   - `export function computeDueDate(paymentTerms, issueDate): string`
   - Switch sur payment_terms (immediate, net_15, net_30, net_60, default)

9. **`_lib/persist-financial-document.ts`** (~120L)
   - `export async function persistFinancialDocument(supabase, ctx): Promise<{ localDocumentId: string | null, error: NextResponse | null }>`
   - Calcul totaux (totalHt, totalVat, totalTtc)
   - Determine partnerId
   - Recup currentUserId via createServerClient
   - INSERT financial_documents + catch error 500 avec message detail exact
   - INSERT financial_document_items (cast unknown) + warn sur echec
   - Gere la branche individual (warn log skip)

### Fichier final : `route.ts` (~180L)

Structure cible :

```ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { Json } from '@verone/types';
import { withRateLimit, RATE_LIMIT_PRESETS } from '@verone/utils/security';
import { createAdminClient } from '@verone/utils/supabase/server';

import { getQontoClient } from './_lib/qonto-client';
import { enrichInvoicesList } from './_lib/enrich-invoices-list';
import { checkAndCleanExistingInvoices } from './_lib/duplicate-guard';
import { fetchOrderWithCustomer } from './_lib/fetch-order-with-customer';
import { resolveQontoClient } from './_lib/resolve-qonto-client';
import { buildInvoiceItems } from './_lib/build-invoice-items';
import { computeDueDate } from './_lib/compute-due-date';
import { persistFinancialDocument } from './_lib/persist-financial-document';
import type { IPostRequestBody } from './_lib/types';

export async function GET(request) {
  try {
    // parse status
    // getQontoClient + getClientInvoices
    // enrichInvoicesList
    // return
  } catch (error) {
    // return 500
  }
}

export async function POST(request) {
  // rate limit
  try {
    // parse body + validate salesOrderId
    // checkAndCleanExistingInvoices → si conflict return
    // fetchOrderWithCustomer → si error return
    // resolveQontoClient → si error return
    // getBankAccounts
    // buildInvoiceItems
    // computeDueDate
    // createClientInvoice + correction date + finalize
    // persistFinancialDocument
    // return success
  } catch (error) {
    // return 500 avec details
  }
}
```

## Regles d'implementation strictes

1. **Zero changement de logique** : chaque fonction extraite doit reproduire _exactement_ le code actuel. Aucune optimisation, aucun renommage de variable locale non necessaire.

2. **Messages d'erreur** : copier a la virgule pres. Ex :
   - `"salesOrderId is required"` (400)
   - `"Le SIRET ou numéro de TVA de l'organisation est requis pour créer une facture. Veuillez le renseigner dans la fiche organisation."` (400)
   - `"Adresse de facturation incomplète. Ville et code postal requis."` (400)
   - `"No active Qonto bank account found"` (500)
   - `"Order not found"` (404)
   - `"Une facture finalisée existe déjà pour cette commande : ${num}. Impossible de la remplacer."` (409)
   - `"Impossible de supprimer la proforma existante (${num ?? id}). Veuillez reessayer."` (500)
   - `"Erreur creation document local: ${err}"` (500)

3. **Logs** : copier chaque `console.error` / `console.warn` a l'identique (prefixe `[API Qonto Invoices]`).

4. **Types** : pas de `any`, pas de `@ts-ignore`. Garder les casts existants (`as unknown as ...`). Les nouveaux parametres de fonctions doivent etre explicitement types.

5. **Pattern auth** : garder `createServerClient()` dans `persist-financial-document.ts` (utilise pour `created_by`). GET et POST utilisent `createAdminClient()`.

6. **Parametres de fonctions** : passer `supabase`, `qontoClient` en arguments plutot que les instancier dans les helpers. Facilite le test unitaire futur.

7. **Pas de nouveaux imports externes** : uniquement les imports deja presents dans route.ts. Pas d'ajout de lib tierce.

8. **Inputs des helpers POST** : passer les objets tels quels. Ex : `buildInvoiceItems(order, fees, customLines)`, pas `buildInvoiceItems({ order, fees, customLines })`. Homogene avec le code actuel.

9. **Retours des helpers** : utiliser le pattern `{ value, error: NextResponse | null }` pour les helpers qui peuvent court-circuiter avec une reponse HTTP. Evite les exceptions custom.

## Verification

1. `pnpm --filter @verone/back-office type-check` : 0 erreur.
2. `pnpm --filter @verone/back-office build` : 65 pages OK.
3. `wc -l apps/back-office/src/app/api/qonto/invoices/route.ts` : < 200.
4. Le reviewer fera un diff git smart pour verifier que l'ordre d'execution, les messages d'erreur, les status HTTP et les side effects sont identiques.

## Risques

- **R1** : Un cast mal retranscrit casse un INSERT (notamment `financial_document_items` qui utilise `as unknown as` pour contourner les types generes). Mitigation : copie exacte du cast dans le helper.
- **R2** : Un helper oubliant d'emettre un log warn modifie l'observabilite. Mitigation : checker chaque console.error/warn dans le diff final.
- **R3** : La logique de resolution billing address (body > DB) a plusieurs fallbacks (`address_line1 ?? dbBillingAddress?.street ?? address ?? address_line1`). Mitigation : copie litterale.
- **R4** : Le payload INSERT financial_documents a 25+ champs. Un champ oublie = regression comptable. Mitigation : comparaison champ par champ apres extraction.

## Commit target

`[BO-TECH-001] refactor: split /api/qonto/invoices/route.ts into 9 modules (926L -> 180L)`
