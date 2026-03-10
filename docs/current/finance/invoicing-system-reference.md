# Invoicing System Reference

**Version** : 2026-03-10
**Status** : Documentation canonique du systeme de facturation

---

## Architecture Double Table

Verone utilise **deux tables de facturation** qui coexistent :

| Table                 | Role                           | Integration     | Documents                        |
| --------------------- | ------------------------------ | --------------- | -------------------------------- |
| `invoices`            | Factures Abby.fr (legacy 2025) | Abby.fr sync    | 23 factures (22 paid, 1 overdue) |
| `financial_documents` | STI pattern multi-type         | Qonto lifecycle | Factures, devis, avoirs          |

### Pourquoi deux tables ?

- `invoices` a ete creee pour la sync Abby.fr (factures historiques 2025)
- `financial_documents` a ete creee pour Qonto avec un pattern STI (Single Table Inheritance) supportant factures, devis, avoirs
- Les deux sont **ACTIVES** et ne doivent pas etre ignorees

---

## Table `invoices`

### Schema

| Colonne                    | Type        | Description                     |
| -------------------------- | ----------- | ------------------------------- |
| `id`                       | UUID        | PK                              |
| `sales_order_id`           | UUID        | FK vers sales_orders (NOT NULL) |
| `abby_invoice_id`          | TEXT        | ID Abby.fr                      |
| `abby_invoice_number`      | TEXT        | Numero facture Abby             |
| `invoice_date`             | DATE        | Date facture                    |
| `due_date`                 | DATE        | Date echeance                   |
| `total_ht`                 | NUMERIC     | Montant HT                      |
| `total_ttc`                | NUMERIC     | Montant TTC                     |
| `tva_amount`               | NUMERIC     | Montant TVA                     |
| `status`                   | TEXT        | paid, overdue, pending          |
| `abby_pdf_url`             | TEXT        | URL PDF sur Abby                |
| `abby_public_url`          | TEXT        | URL publique Abby               |
| `synced_to_abby_at`        | TIMESTAMPTZ | Derniere sync vers Abby         |
| `last_synced_from_abby_at` | TIMESTAMPTZ | Derniere sync depuis Abby       |
| `sync_errors`              | JSONB       | Erreurs de sync                 |
| `created_by`               | UUID        | Utilisateur createur            |

### Role

- Synchronisation bidirectionnelle avec Abby.fr
- Stockage des factures 2025 (historique)
- Lien direct 1:1 avec `sales_orders`

---

## Table `financial_documents`

### Schema (colonnes principales)

| Colonne              | Type        | Description                                         |
| -------------------- | ----------- | --------------------------------------------------- |
| `id`                 | UUID        | PK                                                  |
| `document_type`      | ENUM        | customer_invoice, customer_quote, credit_note, etc. |
| `document_direction` | ENUM        | income, expense                                     |
| `partner_id`         | UUID        | FK organisation ou individual_customer              |
| `partner_type`       | TEXT        | organization, individual                            |
| `document_number`    | TEXT        | Numero du document                                  |
| `document_date`      | DATE        | Date du document                                    |
| `due_date`           | DATE        | Date echeance                                       |
| `total_ht`           | NUMERIC     | Montant HT                                          |
| `total_ttc`          | NUMERIC     | Montant TTC                                         |
| `tva_amount`         | NUMERIC     | Montant TVA                                         |
| `amount_paid`        | NUMERIC     | Montant paye                                        |
| `status`             | ENUM        | draft, sent, paid, cancelled, etc.                  |
| `sales_order_id`     | UUID        | FK vers sales_orders (nullable)                     |
| `purchase_order_id`  | UUID        | FK vers purchase_orders (nullable)                  |
| `deleted_at`         | TIMESTAMPTZ | Soft delete                                         |

### Colonnes Qonto

| Colonne               | Type | Description           |
| --------------------- | ---- | --------------------- |
| `qonto_invoice_id`    | TEXT | ID Qonto              |
| `qonto_pdf_url`       | TEXT | URL PDF Qonto         |
| `qonto_public_url`    | TEXT | URL publique Qonto    |
| `qonto_attachment_id` | TEXT | ID piece jointe Qonto |

### Colonnes Abby (legacy)

| Colonne           | Type | Description                |
| ----------------- | ---- | -------------------------- |
| `abby_invoice_id` | TEXT | ID Abby (documents migres) |
| `abby_pdf_url`    | TEXT | URL PDF Abby               |

### Colonnes Upload PDF

| Colonne              | Type        | Description                  |
| -------------------- | ----------- | ---------------------------- |
| `uploaded_file_url`  | TEXT        | URL fichier uploade          |
| `uploaded_file_name` | TEXT        | Nom fichier                  |
| `upload_status`      | TEXT        | Statut upload                |
| `uploaded_at`        | TIMESTAMPTZ | Date upload                  |
| `uploaded_by`        | UUID        | Utilisateur                  |
| `invoice_source`     | TEXT        | Source (qonto, upload, abby) |

### Colonnes Workflow

| Colonne                 | Type        | Description                                          |
| ----------------------- | ----------- | ---------------------------------------------------- |
| `workflow_status`       | TEXT        | synchronized, draft_validated, finalized, sent, paid |
| `synchronized_at`       | TIMESTAMPTZ | Date sync                                            |
| `validated_to_draft_at` | TIMESTAMPTZ | Date validation brouillon                            |
| `finalized_at`          | TIMESTAMPTZ | Date finalisation                                    |
| `sent_at`               | TIMESTAMPTZ | Date envoi                                           |
| `validated_by`          | UUID        | Valideur                                             |
| `finalized_by`          | UUID        | Finaliseur                                           |

### Colonnes Metier (devis, LinkMe, etc.)

| Colonne                   | Type    | Description               |
| ------------------------- | ------- | ------------------------- |
| `billing_address`         | JSONB   | Adresse facturation       |
| `shipping_address`        | JSONB   | Adresse livraison         |
| `shipping_cost_ht`        | NUMERIC | Frais livraison HT        |
| `handling_cost_ht`        | NUMERIC | Frais manutention HT      |
| `insurance_cost_ht`       | NUMERIC | Frais assurance HT        |
| `fees_vat_rate`           | NUMERIC | TVA sur frais             |
| `validity_date`           | DATE    | Date validite (devis)     |
| `quote_status`            | TEXT    | Statut devis              |
| `converted_to_invoice_id` | UUID    | Devis converti en facture |
| `channel_id`              | UUID    | Canal de vente            |
| `linkme_selection_id`     | UUID    | Selection LinkMe          |
| `linkme_affiliate_id`     | UUID    | Affilie LinkMe            |
| `consultation_id`         | UUID    | Consultation liee         |

---

## Workflow Facturation (financial_documents)

```
1. SYNCHRONISE (synchronized)
   | [Bouton "Valider brouillon"]
   v
2. BROUILLON (draft_validated)
   | [Bouton "Finaliser (PDF)"]
   v
3. DEFINITIF (finalized) -- PDF disponible
   | [Envoi auto/manuel]
   v
4. ENVOYE (sent)
   | [Paiement recu]
   v
5. PAYE (paid)
```

### Regles

- Modification autorisee : statuts 1 et 2 (synchronized, draft_validated)
- Modification bloquee : statut 3+ (finalized)
- PDF genere uniquement au statut 3 (finalized)
- Qonto reste "draft" pour statuts 1-2, passe "finalized" au statut 3

---

## Bucket Storage `invoices` (Supabase Storage)

- **Role** : Stockage local des PDF de factures (backup)
- **Colonnes liees** dans `financial_documents` :
  - `local_pdf_path` : Chemin dans le bucket
  - `local_pdf_url` : URL signee
  - `pdf_stored_at` : Date de stockage

---

## Page /factures (Back-Office)

### Route

`/finance/factures` (ou `/factures`)

### Fonctionnalites

- Liste des factures clients (`customer_invoice`)
- Liste des devis (`customer_quote`)
- Liste des avoirs (`credit_note`)
- Onglet "Factures manquantes" (commandes sans facture)
- Creation, validation, finalisation, envoi
- Telechargement PDF

### Source de donnees

La page `/factures` lit principalement la table `financial_documents`.

---

## Routes API

### Qonto Invoice Endpoints

| Route                                        | Methode | Description                            |
| -------------------------------------------- | ------- | -------------------------------------- |
| `/api/qonto/invoices/[id]`                   | GET     | Detail facture                         |
| `/api/qonto/invoices/[id]`                   | PATCH   | Modifier facture (bloque si finalized) |
| `/api/qonto/invoices/[id]/validate-to-draft` | POST    | synchronized → draft_validated         |
| `/api/qonto/invoices/[id]/finalize-workflow` | POST    | draft_validated → finalized (+ PDF)    |
| `/api/qonto/invoices/by-order/[orderId]`     | GET     | Factures d'une commande                |

---

## Composants Frontend Cles

| Composant            | Package         | Role                                  |
| -------------------- | --------------- | ------------------------------------- |
| `InvoicesSection`    | back-office     | Section factures dans detail commande |
| `RapprochementModal` | @verone/finance | Rapprochement bancaire multi-doc      |

---

## Regles Importantes

1. **TOUJOURS verifier /factures** avant de dire qu'une commande n'a pas de facture
2. Les commandes 2026 ont des factures gerees via le back-office
3. `invoices` (Abby) et `financial_documents` (Qonto) sont TOUTES DEUX actives
4. Ne jamais confondre les deux tables -- elles servent des roles differents
5. Le bucket `invoices` est un backup local, pas la source principale des PDF

---

## References

- `docs/current/finance/finance-reference.md` -- Regles matching, rapprochement, PCG
- `docs/current/finance/invoice-workflow-implementation.md` -- Implementation workflow 3 statuts
- Serena memory `sales-invoices-processing-rules` -- Regles traitement factures de vente
