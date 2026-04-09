# Guide Complet API Qonto - Verone Back Office

**Version** : 1.0.0 (2026-02-19)
**Status** : SOURCE DE VERITE consolidee
**Sources** : Documentation officielle Qonto + audit interne + memoires Serena

---

## 1. Authentification

### Mode actuel : API Key

```bash
# .env.local (back-office)
QONTO_AUTH_MODE=api_key
QONTO_ORGANIZATION_ID=verone-4819
QONTO_API_KEY=<cle_api_qonto>
```

**Header HTTP** : `Authorization: verone-4819:<API_KEY>`
**Base URL** : `https://thirdparty.qonto.com`
**Rate limit** : 100 req/min

### Health Check

```
GET /api/qonto/health
```

Reponse attendue :

```json
{ "status": "healthy", "authMode": "api_key", "bankAccountsCount": 2 }
```

### Client

```typescript
import { QontoClient } from '@verone/integrations/qonto';

const client = new QontoClient({ authMode: 'api_key' });
// ou via singleton :
import { getQontoClient } from '@verone/integrations/qonto';
const client = getQontoClient();
```

---

## 2. Endpoints API Qonto (Officiels vs Notre Code)

### Endpoints Qonto OFFICIELS (source : docs.qonto.com)

| Resource                          | GET (liste) | GET (detail) |   POST (creer)    |       PATCH       |      DELETE       |
| --------------------------------- | :---------: | :----------: | :---------------: | :---------------: | :---------------: |
| Factures (`/v2/client_invoices`)  |     OK      |      OK      |        OK         |        OK         |        OK         |
| Devis (`/v2/quotes`)              |     OK      |      OK      |        OK         |        OK         |        OK         |
| **Avoirs (`/v2/credit_notes`)**   |   **OK**    |    **OK**    | **NON DOCUMENTE** | **NON DOCUMENTE** | **NON DOCUMENTE** |
| Clients (`/v2/clients`)           |     OK      |      OK      |        OK         |        OK         |         -         |
| Transactions (`/v2/transactions`) |     OK      |      OK      |         -         |         -         |         -         |
| Comptes (`/v2/bank_accounts`)     |     OK      |      -       |         -         |         -         |         -         |
| Attachments (`/v2/attachments`)   |     OK      |      -       |        OK         |         -         |        OK         |

### DECOUVERTE CRITIQUE (2026-02-19)

> L'API Qonto NE DOCUMENTE PAS les endpoints d'ecriture pour les credit notes.
> Seuls `GET /v2/credit_notes` et `GET /v2/credit_notes/:id` sont dans la doc officielle.
>
> Notre code appelle `POST /v2/credit_notes` (client.ts:1238) — cet endpoint
> n'est pas garanti de fonctionner. A tester en live.

### Nos Routes API Internes (44 routes)

#### Factures (19 routes)

| Methode   | Route                                        | Description               |
| --------- | -------------------------------------------- | ------------------------- |
| GET       | `/api/qonto/invoices`                        | Liste factures            |
| POST      | `/api/qonto/invoices`                        | Creation depuis commande  |
| GET/POST  | `/api/qonto/invoices/service`                | Factures service          |
| GET       | `/api/qonto/invoices/by-order/[orderId]`     | Par commande              |
| GET/PATCH | `/api/qonto/invoices/[id]`                   | Detail / Modification     |
| GET       | `/api/qonto/invoices/[id]/details`           | Details enrichis          |
| GET       | `/api/qonto/invoices/[id]/pdf`               | PDF                       |
| POST      | `/api/qonto/invoices/[id]/finalize`          | Finalisation IRREVERSIBLE |
| POST      | `/api/qonto/invoices/[id]/finalize-workflow` | Workflow 3 etapes         |
| POST      | `/api/qonto/invoices/[id]/validate-to-draft` | Validation brouillon      |
| POST      | `/api/qonto/invoices/[id]/mark-paid`         | Marquer payee             |
| POST      | `/api/qonto/invoices/[id]/reconcile`         | Rapprochement bancaire    |
| POST      | `/api/qonto/invoices/[id]/send`              | Envoi email               |
| POST      | `/api/qonto/invoices/[id]/cancel`            | Annulation                |
| DELETE    | `/api/qonto/invoices/[id]/delete`            | Suppression brouillon     |
| POST      | `/api/qonto/invoices/[id]/convert-to-quote`  | Conversion en devis       |
| POST      | `/api/qonto/invoices/[id]/sync-to-order`     | Sync vers commande        |

#### Devis (12 routes)

| Methode          | Route                                        | Description              |
| ---------------- | -------------------------------------------- | ------------------------ |
| GET              | `/api/qonto/quotes`                          | Liste devis              |
| POST             | `/api/qonto/quotes`                          | Creation depuis commande |
| GET/POST         | `/api/qonto/quotes/service`                  | Devis service            |
| POST             | `/api/qonto/quotes/from-invoice/[invoiceId]` | Depuis facture           |
| GET/PATCH/DELETE | `/api/qonto/quotes/[id]`                     | CRUD                     |
| GET              | `/api/qonto/quotes/[id]/pdf`                 | PDF                      |
| GET              | `/api/qonto/quotes/[id]/view`                | Vue publique             |
| POST             | `/api/qonto/quotes/[id]/finalize`            | Finalisation (= envoi)   |
| POST             | `/api/qonto/quotes/[id]/convert`             | Conversion en facture    |
| POST             | `/api/qonto/quotes/[id]/accept`              | Accepter                 |
| POST             | `/api/qonto/quotes/[id]/decline`             | Refuser                  |
| POST             | `/api/qonto/quotes/[id]/send`                | Envoi email              |

#### Avoirs (7 routes)

| Methode          | Route                                   | Description             |
| ---------------- | --------------------------------------- | ----------------------- |
| GET              | `/api/qonto/credit-notes`               | Liste avoirs            |
| POST             | `/api/qonto/credit-notes`               | Creation depuis facture |
| GET/PATCH/DELETE | `/api/qonto/credit-notes/[id]`          | CRUD                    |
| GET              | `/api/qonto/credit-notes/[id]/pdf`      | PDF                     |
| POST             | `/api/qonto/credit-notes/[id]/finalize` | Finalisation            |
| POST             | `/api/qonto/credit-notes/[id]/send`     | Envoi email             |

#### Infrastructure (6+ routes)

| Methode  | Route                      | Description                 |
| -------- | -------------------------- | --------------------------- |
| GET      | `/api/qonto/health`        | Health check                |
| GET      | `/api/qonto/status`        | Statut integration          |
| GET      | `/api/qonto/balance`       | Solde comptes               |
| GET      | `/api/qonto/transactions`  | Transactions bancaires      |
| GET/POST | `/api/qonto/clients`       | Clients Qonto               |
| POST     | `/api/qonto/sync`          | Sync transactions           |
| POST     | `/api/qonto/sync-invoices` | Sync factures               |
| \*       | `/api/qonto/attachments/*` | Upload, cleanup, GET/DELETE |
| GET      | `/api/qonto/debug*`        | Debug endpoints             |

---

## 3. Workflows Metier

### Facture depuis commande

1. Modal `InvoiceCreateFromOrderModal` → selectionne commande
2. `POST /api/qonto/invoices` : fetch order + items + customer → findOrCreate client Qonto → facture brouillon
3. INSERT `financial_documents` + `financial_document_items`
4. Retour avec `localDocumentId`

### Facture de service

1. Modal `InvoiceCreateServiceModal` → saisie manuelle
2. `POST /api/qonto/invoices/service` → facture brouillon
3. **BUG CONNU** : pas d'INSERT dans `financial_documents`

### Creation avoir

1. Page detail facture finalisee → "Creer un avoir"
2. `POST /api/qonto/credit-notes` avec `invoiceId` → copie items si non fournis
3. **ATTENTION** : endpoint POST non documente par Qonto (voir section 2)

### Creation devis

1. Modal `QuoteCreateFromOrderModal` ou `QuoteCreateServiceModal`
2. `POST /api/qonto/quotes` ou `/quotes/service`

### Conversion devis → facture

1. Page detail devis finalise/accepte → "Convertir en facture"
2. `POST /api/qonto/quotes/[id]/convert`

---

## 4. Les 5 Regles Absolues (NON NEGOCIABLES)

> Ces regles ont ete etablies suite a l'incident F-2026-001 du 7 janvier 2026.

### Regle 1 : JAMAIS `autoFinalize: true`

Toujours creer en **brouillon**. La finalisation est une action utilisateur explicite.

### Regle 2 : Finalisation = IRREVERSIBLE

Le numero de facture est **brule** apres finalisation. Il ne peut jamais etre reutilise.

### Regle 3 : SEUL L'UTILISATEUR finalise

Via UI avec dialog de confirmation. JAMAIS de finalisation automatique.

### Regle 4 : PDF disponible APRES finalisation uniquement

Avant finalisation, pas de PDF genere par Qonto.

### Regle 5 : Fallback PDF

Ordre : `pdf_url` → `attachment_id` (URL valide 30 min seulement).

---

## 5. Types Critiques

### Attention : types reponse ≠ types creation

**Types REPONSE** (ce que Qonto renvoie) :

```typescript
// QontoClientInvoice.items
{
  quantity: number,      // NUMBER
  unit_price: number,    // NUMBER
  vat_rate: number       // NUMBER
}
```

**Types CREATION** (ce qu'on envoie a Qonto) :

```typescript
// CreateInvoiceItemParams
{
  quantity: string,              // STRING
  unitPrice: QontoAmount,        // OBJET {value, currency}
  vatRate: string                // STRING
}
```

---

## 6. Table `financial_documents`

Table pivot pour documents Qonto en local :

| Colonne          | Type    | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| `id`             | UUID PK | ID local                                  |
| `qonto_id`       | VARCHAR | ID Qonto externe                          |
| `document_type`  | VARCHAR | 'invoice', 'credit_note', 'quote'         |
| `status`         | VARCHAR | 'draft', 'finalized', 'paid', 'cancelled' |
| `number`         | VARCHAR | Numero document (NULL en draft)           |
| `customer_name`  | VARCHAR | Nom client                                |
| `total_amount`   | DECIMAL | Montant total TTC                         |
| `total_vat`      | DECIMAL | Montant TVA                               |
| `sales_order_id` | UUID FK | Lien vers commande (optionnel)            |
| `pdf_url`        | VARCHAR | URL temporaire PDF (30 min)               |

**IMPORTANT** : `invoices` = table LEGACY. Facturation via Qonto = `financial_documents`.

---

## 7. Dette Technique Connue

1. **3x `as any`** dans `client.ts` (cast PATCH method, lignes ~686, ~1325, ~1470)
2. **`details?: any`** dans `errors.ts` (lignes 24, 32)
3. **`data: any`** dans `client.ts` (createErrorFromResponse, ligne 1545)
4. **`responseData?: any`** dans `errors.ts` (ligne 130)
5. **`created_by = '00000000-...'`** hardcode dans financial_documents
6. **Factures service** : pas d'INSERT dans `financial_documents`
7. **`getQontoClient()`** duplique dans les routes API (singleton existe dans client.ts)
8. **Types locaux** dans `factures/qonto/page.tsx` divergent du package `@verone/integrations`

---

## 8. Troubleshooting

### Connexion KO

1. Verifier `.env.local` : `QONTO_AUTH_MODE`, `QONTO_ORGANIZATION_ID`, `QONTO_API_KEY`
2. Tester : `GET /api/qonto/health`
3. Si 401 : cle API revoquee → regenerer sur dashboard Qonto
4. Si timeout : verifier reseau

### PDF indisponible

1. Verifier que la facture est finalisee (`status !== 'draft'`)
2. Verifier `pdf_url` existe
3. Sinon utiliser `attachment_id` + `getAttachment()`
4. URL attachment valide 30 min seulement

### Creation avoir echoue

1. Verifier que `POST /v2/credit_notes` est supporte (non documente par Qonto)
2. Si 404 : endpoint n'existe pas, creer l'avoir directement via dashboard Qonto
3. Si 401/403 : verifier permissions cle API

---

## 9. Fichiers Cles

| Fichier                                                        | Description                      |
| -------------------------------------------------------------- | -------------------------------- |
| `packages/@verone/integrations/src/qonto/client.ts`            | Client HTTP (1621 lignes)        |
| `packages/@verone/integrations/src/qonto/types.ts`             | Types TypeScript                 |
| `packages/@verone/integrations/src/qonto/errors.ts`            | Gestion erreurs                  |
| `apps/back-office/src/app/api/qonto/`                          | 44 routes API                    |
| `packages/@verone/finance/src/components/`                     | Modales CRUD                     |
| `apps/back-office/src/app/(protected)/factures/qonto/page.tsx` | Page liste documents             |
| `docs/integrations/qonto/archive/`                             | Documentation archivee restauree |
| `docs/current/AUDIT-FACTURATION-QONTO-2026-01.md`              | Audit complet (995 lignes)       |

---

## 10. Documentation Archivee

Restauree le 2026-02-19 depuis l'historique git (supprimee commit `2701d206` du 23 janvier) :

- `docs/integrations/qonto/archive/INDEX.md` — Index complet
- `docs/integrations/qonto/archive/finance-v2/` — 9 fichiers Finance V2
- `docs/integrations/qonto/archive/serena-snapshots/` — 3 snapshots
- `docs/integrations/qonto/archive/guides/` — Guide configuration API
- `docs/integrations/qonto/archive/linkme-invoice-verification-workflow.md`
