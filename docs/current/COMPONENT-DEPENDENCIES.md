# Dependances Composants — Ventes, Devis, Factures

## Modals et leurs dependances

### Devis (Quotes)

| Composant                   | Package           | Depend de                                                                    | Utilise par                                          |
| --------------------------- | ----------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| `QuoteFormModal`            | `@verone/finance` | `QuoteChannelStep`, `QuoteCustomerCard`, `QuoteItemsCard`, `QuoteTotalsCard` | `/devis/nouveau`, `/factures`                        |
| `QuoteCreateFromOrderModal` | `@verone/finance` | `IOrderForDocument`                                                          | `/devis/nouveau`, `/consultations/[id]`, `/factures` |
| `OrderSelectModal`          | `@verone/finance` | Supabase `sales_orders` query                                                | `/devis/nouveau`, `/factures`                        |

### Factures (Invoices)

| Composant                     | Package           | Depend de                                                   | Utilise par          |
| ----------------------------- | ----------------- | ----------------------------------------------------------- | -------------------- |
| `InvoiceCreateFromOrderModal` | `@verone/finance` | `IOrderForDocument`, `useInvoiceActions`                    | `/factures/nouvelle` |
| `InvoiceCreateServiceModal`   | `@verone/finance` | —                                                           | `/factures/nouvelle` |
| `InvoiceDetailModal`          | `@verone/finance` | `InvoiceInfoCard`, `InvoiceItemsTable`, `InvoiceTotalsCard` | `/factures`          |
| `CreditNoteCreateModal`       | `@verone/finance` | Invoice parent                                              | `/factures`          |

### Commandes (Orders)

| Composant             | Package          | Depend de                                         | Utilise par                                            |
| --------------------- | ---------------- | ------------------------------------------------- | ------------------------------------------------------ |
| `SalesOrderFormModal` | `@verone/orders` | `customer-selector`, channel config               | `/commandes/clients`, `/ventes`                        |
| `SalesOrdersTable`    | `@verone/orders` | `useSalesOrdersFetchList`, `useSalesOrdersModals` | `/commandes/clients`, `/canaux-vente/linkme/commandes` |
| `OrderDetailModal`    | `@verone/orders` | `useOrderDetailData`                              | `/commandes/clients` (via SalesOrdersTable)            |

### Consultations

| Composant               | Package                 | Depend de                                        | Utilise par           |
| ----------------------- | ----------------------- | ------------------------------------------------ | --------------------- |
| `EditConsultationModal` | `@verone/consultations` | `useConsultationDetail`                          | `/consultations/[id]` |
| `ConsultationToolbar`   | app local               | `QuoteCreateFromOrderModal`, `handleCreateOrder` | `/consultations/[id]` |

## Hooks partages

| Hook                         | Package                 | Utilise par                            |
| ---------------------------- | ----------------------- | -------------------------------------- |
| `useSalesOrdersFetchList`    | `@verone/orders`        | `SalesOrdersTable`, `OrderSelectModal` |
| `useConsultationQuotes`      | `@verone/consultations` | `/consultations/[id]`                  |
| `useConsultationSalesOrders` | `@verone/consultations` | `/consultations/[id]`                  |
| `useQuotes`                  | `@verone/finance`       | `/factures` DevisTab                   |
| `useInvoiceActions`          | `@verone/finance`       | `InvoiceCreateFromOrderModal`          |

## Types partages

| Type                | Defini dans                        | Utilise par                                                                  |
| ------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `IOrderForDocument` | `@verone/finance/OrderSelectModal` | `QuoteCreateFromOrderModal`, `InvoiceCreateFromOrderModal`, `/devis/nouveau` |
| `ICustomLine`       | `@verone/finance/OrderSelectModal` | `QuoteCreateFromOrderModal`, `InvoiceCreateFromOrderModal`                   |

## Conversions (API Routes)

| Conversion              | Route API                                        | Composant declencheur                        |
| ----------------------- | ------------------------------------------------ | -------------------------------------------- |
| Commande → Devis        | `POST /api/qonto/quotes`                         | `QuoteCreateFromOrderModal`                  |
| Commande → Facture      | `POST /api/qonto/invoices`                       | `InvoiceCreateFromOrderModal`                |
| Devis → Facture         | `POST /api/qonto/quotes/[id]/convert`            | Bouton dans `/factures/devis/[id]`           |
| Facture → Devis         | `POST /api/qonto/invoices/[id]/convert-to-quote` | `InvoiceDetailModal` (draft only)            |
| Facture → Avoir         | `POST /api/qonto/credit-notes`                   | `CreditNoteCreateModal`                      |
| Consultation → Commande | `useSalesOrders.createOrder()`                   | `ConsultationToolbar`                        |
| Consultation → Devis    | `POST /api/qonto/quotes`                         | `QuoteCreateFromOrderModal` (isConsultation) |
