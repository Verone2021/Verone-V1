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

> **`financial_documents`** = factures (vente + achat) + copie secondaire devis.
> Les devis dans `financial_documents` sont une copie NON-BLOQUANTE apres creation Qonto.
> La lecture des devis se fait TOUJOURS via Qonto API, JAMAIS depuis la DB locale.

---

## REGLE ABSOLUE : Qonto API = Source PRIMAIRE

```
Qonto API = source PRIMAIRE (TOUJOURS)
- Qonto genere les PDF, factures et devis
- La DB locale est une couche SECONDAIRE de stockage
- ON NE LIE JAMAIS directement a la DB sans passer par Qonto d'abord
- Flux : UI -> POST /api/qonto/quotes -> Qonto API -> (optionnel) INSERT financial_documents
- Lecture : UI -> GET /api/qonto/quotes -> Qonto API -> affichage
```

---

## Flux Devis

### Creation

```
UI (QuoteFormModal) --> POST /api/qonto/quotes --> Qonto API (draft) --> (secondary) INSERT financial_documents
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

Les devis ont un workflow SIMPLIFIE : crees dans Qonto, avec une copie secondaire non-bloquante en DB.
La lecture et les actions sur les devis passent TOUJOURS par Qonto API.

---

## Pourquoi cette Architecture

1. **Qonto = source de verite pour les devis** : generation PDF, envoi client, suivi statut
2. **Pas de duplication** : evite la desynchronisation entre DB locale et Qonto
3. **Simplicite** : un seul endroit ou regarder pour les devis
4. **`financial_documents` reste propre** : uniquement les documents qui necessitent un enrichissement local (factures)

---

## Erreur a Eviter

> **JAMAIS** lire les devis depuis `financial_documents` avec `document_type = 'customer_quote'`.
> Cette approche a ete tentee (commit 4d81a1e2) et a CASSE l'affichage des devis.
> Les devis crees via Qonto n'existaient pas dans la DB locale = page vide.
> Utiliser TOUJOURS `GET /api/qonto/quotes` pour la lecture.
