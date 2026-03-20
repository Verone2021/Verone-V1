# Architecture Devis (Quotes) - Source de Verite

**Version** : 2.0.0
**Date** : 2026-03-20
**Statut** : DOCUMENTATION CANONIQUE

---

## Regle Fondamentale

| Entite                                   | Source de verite | Table/API             |
| ---------------------------------------- | ---------------- | --------------------- |
| **Factures de vente** (customer_invoice) | DB locale        | `financial_documents` |
| **Factures d'achat** (supplier_invoice)  | DB locale        | `financial_documents` |
| **Devis** (customer_quote)               | **DB locale**    | `financial_documents` |

> **`financial_documents`** = factures ET devis (vente + achat).
> Les devis sont stockes dans `financial_documents` avec `document_type = 'customer_quote'`.
> Qonto est utilise en background pour la generation PDF et l'envoi client.

---

## Flux Devis (Pattern Hybride — meme pattern que factures)

### Creation

```
UI (QuoteFormModal / QuoteCreateFromOrderModal)
  --> POST /api/qonto/quotes
    --> Qonto API (draft) --> creation devis sur Qonto
    --> INSERT financial_documents (source de verite locale)
```

### Listing (onglet Devis)

```
UI (onglet Devis) --> useQuotes() hook --> SELECT financial_documents WHERE document_type = 'customer_quote'
```

### Detail

```
UI (/factures/devis/:id) --> useQuotes().fetchQuote(id) --> financial_documents (local DB)
```

### PDF (via Qonto)

```
UI (bouton PDF) --> GET /api/qonto/quotes/:qonto_id/pdf --> Qonto API --> PDF binaire
```

### Liaison commande (by-order)

```
OrderDetailModal --> GET /api/qonto/quotes/by-order/:orderId --> financial_documents WHERE sales_order_id = :orderId
```

---

## Endpoints API

| Methode | Endpoint                              | Source     | Description                                |
| ------- | ------------------------------------- | ---------- | ------------------------------------------ |
| `GET`   | `/api/qonto/quotes`                   | Qonto API  | Liste depuis Qonto (sync/legacy)           |
| `POST`  | `/api/qonto/quotes`                   | Qonto + DB | Cree un devis (Qonto draft + INSERT local) |
| `GET`   | `/api/qonto/quotes/by-order/:orderId` | DB locale  | Devis lies a une commande                  |
| `POST`  | `/api/qonto/quotes/:id/finalize`      | Qonto API  | Finalise un devis brouillon                |
| `GET`   | `/api/qonto/quotes/:id/pdf`           | Qonto API  | Telecharge le PDF d'un devis               |

---

## Hook useQuotes (Source de verite)

Le hook `useQuotes` dans `@verone/finance/hooks` gere le CRUD complet des devis :

- **Lecture** : `financial_documents` avec `document_type = 'customer_quote'`
- **Creation** : INSERT dans `financial_documents` + push vers Qonto (non-bloquant)
- **Mise a jour** : UPDATE `financial_documents` (items, totaux, notes)
- **Transitions statut** : `draft -> validated -> sent -> accepted/declined/expired -> converted`
- **Suppression** : soft delete (`deleted_at`)
- **Stats** : comptage par statut

---

## Mapping Champs DB -> UI

| Champ UI   | Champ DB                      |
| ---------- | ----------------------------- |
| N Devis    | `document_number`             |
| Client     | `partner.trade_name`          |
| Date       | `document_date`               |
| Expiration | `validity_date`               |
| Statut     | `quote_status`                |
| Montant    | `total_ttc` (en euros)        |
| Lien Qonto | `qonto_invoice_id` (pour PDF) |

---

## Guard Anti-Doublon

La route `POST /api/qonto/quotes` verifie dans `financial_documents` :

- `sales_order_id` = commande cible
- `document_type = 'customer_quote'`
- `deleted_at IS NULL`
- `quote_status NOT IN ('declined', 'expired')`

Si un devis existe deja → reponse `409 Conflict`.

---

## Pourquoi cette Architecture (v2)

1. **DB locale = source de verite** : memes avantages que les factures (liaison commande, `purchase_order_number` fiable)
2. **Qonto en background** : generation PDF, envoi client, suivi comptable
3. **Pas de dependance Qonto** : si l'API Qonto est lente ou indisponible, les devis restent accessibles
4. **Guard anti-doublon fiable** : basee sur la DB locale, pas sur un listing Qonto qui peut ne pas retourner le `purchase_order_number`
5. **Coherence** : meme pattern pour factures et devis → moins de code a maintenir

---

## Historique

- **v1.0** (2026-03-20) : Architecture full-Qonto (devis = Qonto API seulement)
- **v2.0** (2026-03-20) : Retour au pattern hybride (DB locale + Qonto sync), alignement avec les factures
