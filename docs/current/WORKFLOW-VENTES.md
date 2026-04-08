# Workflow Ventes — Chaine complete

## Vue d'ensemble

```
Consultation → Commande (SO) → Devis → Facture → Paiement → Rapprochement
                    ↕              ↕         ↕
              Devis ↔ Commande   Facture → Avoir
```

## 1. Consultation → Commande

| Etape             | Page/Modal                  | Composant             | API                            |
| ----------------- | --------------------------- | --------------------- | ------------------------------ |
| Voir consultation | `/consultations/[id]`       | `ConsultationToolbar` | —                              |
| Creer commande    | Bouton "Creer une commande" | `handleCreateOrder()` | `useSalesOrders.createOrder()` |

- Necessite statut consultation = `terminee`
- Items consultation copies vers `sales_order_items`
- `sales_orders.consultation_id` lie a la consultation

## 2. Consultation → Devis

| Etape             | Page/Modal              | Composant                                         | API                      |
| ----------------- | ----------------------- | ------------------------------------------------- | ------------------------ |
| Voir consultation | `/consultations/[id]`   | `ConsultationToolbar`                             | —                        |
| Creer devis       | Bouton "Creer un devis" | `QuoteCreateFromOrderModal` (isConsultation=true) | `POST /api/qonto/quotes` |

- `financial_documents.consultation_id` lie a la consultation
- Devis cree dans Qonto (source de verite)

## 3. Commande → Devis

| Etape                   | Page/Modal | Composant                                        | API                      |
| ----------------------- | ---------- | ------------------------------------------------ | ------------------------ |
| Depuis `/devis/nouveau` | Page choix | `OrderSelectModal` → `QuoteCreateFromOrderModal` | `POST /api/qonto/quotes` |
| Depuis detail commande  | Modal      | `QuoteCreateFromOrderModal`                      | `POST /api/qonto/quotes` |

## 4. Commande → Facture

| Etape              | Page/Modal                | Composant                     | API                                      |
| ------------------ | ------------------------- | ----------------------------- | ---------------------------------------- |
| Depuis `/factures` | Bouton "Nouvelle facture" | `InvoiceCreateFromOrderModal` | `POST /api/qonto/invoices`               |
| Finaliser          | Modal detail facture      | `InvoiceDetailModal`          | `POST /api/qonto/invoices/[id]/finalize` |

- Facture creee dans Qonto (source de verite)
- `financial_documents` stocke le lien local

## 5. Devis → Facture (Conversion)

| Etape               | Page/Modal             | Composant                     | API                                   |
| ------------------- | ---------------------- | ----------------------------- | ------------------------------------- |
| Depuis detail devis | `/factures/devis/[id]` | Bouton "Convertir en facture" | `POST /api/qonto/quotes/[id]/convert` |

- Cree automatiquement une `sales_order` si pas liee
- Met a jour `financial_documents.converted_to_invoice_id`

## 6. Facture → Avoir

| Etape                 | Page/Modal | Composant               | API                            |
| --------------------- | ---------- | ----------------------- | ------------------------------ |
| Depuis detail facture | Modal      | `CreditNoteCreateModal` | `POST /api/qonto/credit-notes` |

---

## Navigation depuis /ventes

| Action       | Destination                                 | Type  | Retour vers /ventes        |
| ------------ | ------------------------------------------- | ----- | -------------------------- |
| Consultation | `/consultations/create`                     | Page  | `router.back()`            |
| Commande     | `/commandes/clients?action=new&from=ventes` | Modal | Automatique a la fermeture |
| Devis        | `/devis/nouveau`                            | Page  | Bouton retour              |

## Source de verite

| Document     | Source de verite | Stockage local                                               |
| ------------ | ---------------- | ------------------------------------------------------------ |
| Devis        | **Qonto API**    | `financial_documents` (document_type='customer_quote')       |
| Facture      | **Qonto API**    | `financial_documents` (document_type='customer_invoice')     |
| Avoir        | **Qonto API**    | `financial_documents` (document_type='customer_credit_note') |
| Commande     | **Supabase**     | `sales_orders` + `sales_order_items`                         |
| Consultation | **Supabase**     | `client_consultations` + `consultation_products`             |
