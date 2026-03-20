# Architecture Devis (Quotes) - Source de Verite

**Version** : 1.0.0
**Date** : 2026-03-20
**Statut** : DOCUMENTATION CANONIQUE

---

## Regle Fondamentale

| Entite                                   | Source de verite | Table/API               |
| ---------------------------------------- | ---------------- | ----------------------- |
| **Factures de vente** (customer_invoice) | DB locale        | `financial_documents`   |
| **Factures d'achat** (supplier_invoice)  | DB locale        | `financial_documents`   |
| **Devis** (quotes)                       | **Qonto API**    | `GET /api/qonto/quotes` |

> **`financial_documents`** = factures UNIQUEMENT (vente + achat).
> Les devis ne sont JAMAIS stockes dans `financial_documents`.

---

## Flux Devis

### Creation

```
UI (QuoteFormModal) --> POST /api/qonto/quotes --> Qonto API (draft)
```

### Listing (onglet Devis)

```
UI (onglet Devis) --> GET /api/qonto/quotes --> Qonto API --> affichage tableau
```

### PDF

```
UI (bouton PDF) --> GET /api/qonto/quotes/:id/pdf --> Qonto API --> PDF binaire
```

### Finalisation

```
UI (bouton Finaliser) --> POST /api/qonto/quotes/:id/finalize --> Qonto API
```

---

## Endpoints API

| Methode | Endpoint                         | Description                                   |
| ------- | -------------------------------- | --------------------------------------------- |
| `GET`   | `/api/qonto/quotes`              | Liste tous les devis depuis Qonto             |
| `GET`   | `/api/qonto/quotes?status=draft` | Filtre par statut                             |
| `POST`  | `/api/qonto/quotes`              | Cree un devis (depuis commande ou standalone) |
| `POST`  | `/api/qonto/quotes/:id/finalize` | Finalise un devis brouillon                   |
| `GET`   | `/api/qonto/quotes/:id/pdf`      | Telecharge le PDF d'un devis                  |

---

## Mapping Champs Qonto -> UI

| Champ UI   | Champ Qonto API                                          |
| ---------- | -------------------------------------------------------- |
| N Devis    | `quote_number`                                           |
| Client     | `client.name`                                            |
| Date       | `issue_date`                                             |
| Expiration | `expiry_date`                                            |
| Statut     | `status` (draft, finalized, accepted, declined, expired) |
| Montant    | `total_amount` (en euros, pas en centimes)               |

---

## Flux Factures (pour comparaison)

```
1. Creation dans Qonto (POST /api/qonto/invoices)
2. Sync vers financial_documents (POST /api/qonto/sync-invoices)
3. Lecture depuis financial_documents + enrichissement Qonto (GET /api/qonto/invoices)
```

Les factures ont un workflow hybride : creees dans Qonto, synchronisees localement pour enrichissement (liaison commande, rapprochement bancaire, archivage).

Les devis n'ont PAS ce workflow hybride : ils vivent exclusivement dans Qonto.

---

## Pourquoi cette Architecture

1. **Qonto = source de verite pour les devis** : generation PDF, envoi client, suivi statut
2. **Pas de duplication** : evite la desynchronisation entre DB locale et Qonto
3. **Simplicite** : un seul endroit ou regarder pour les devis
4. **`financial_documents` reste propre** : uniquement les documents qui necessitent un enrichissement local (factures)

---

## Erreur a Eviter

> **JAMAIS** lire les devis depuis `financial_documents` avec `document_type = 'customer_quote'`.
> Cette approche a ete abandonnee car elle creait une source de verite dupliquee.
> Utiliser TOUJOURS `GET /api/qonto/quotes`.
