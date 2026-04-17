# Fix proforma orphelines — 2026-04-16

**Branche** : `fix/BO-FIN-005-audit-regressions-devis-facture`
**Etat** : code modifie (non-commit), script de rattrapage propose (non-execute).

---

## Cause racine confirmee

**Contrainte DB** : `unique_document_number_per_type ON (document_type, document_number)`.

**Format casse introduit par `5739cc0c8` (9 avril)** :

```ts
document_number: `PROFORMA-${customerName.split(' ').pop()?.toUpperCase()}-${YYYY}-${MM}`;
```

Tous les clients Pokawa du meme mois produisent le meme suffixe (`CERGY)`, `BASTIA)`, `)`, …). La 1ere proforma reussit l'INSERT, les suivantes sont rejetees. La route `/api/qonto/invoices` retourne alors 500, **mais la facture Qonto a deja ete creee** → proforma orpheline cote Qonto, aucune ligne locale, aucun lien `sales_order_id`.

Versions anterieures (`73f16fbb2`) utilisaient `finalizedInvoice.invoice_number` = null pour les drafts → meme probleme. Aucune version n'a jamais ete robuste pour les drafts multi-clients d'un meme mois.

---

## Fix code (1 ligne)

`apps/back-office/src/app/api/qonto/invoices/route.ts:754`

**Avant** :

```ts
document_number: autoFinalize
  ? (finalizedInvoice.invoice_number ?? (finalizedInvoice as unknown as Record<string, unknown>).number as string)
  : `PROFORMA-${(customerName ?? 'CLIENT').split(' ').pop()?.toUpperCase() ?? 'CLIENT'}-${issueDate.slice(0, 4)}-${issueDate.slice(5, 7)}`,
```

**Apres** :

```ts
document_number: autoFinalize
  ? (finalizedInvoice.invoice_number ?? (finalizedInvoice as unknown as Record<string, unknown>).number as string)
  : `PROFORMA-${typedOrder.order_number}`,
```

Resultat : `PROFORMA-SO-2026-00155`, unique par commande, pas de collision possible.

Type-check : PASS.

---

## Rattrapage — 5 proformas orphelines

Verification croisee `api/qonto/invoices?status=draft` ↔ `sales_orders` (via `client_name + total_ttc + issue_date`) :

| Commande      | Qonto ID                               | document_date | total_ttc | Client Qonto                | Correspondance      |
| ------------- | -------------------------------------- | ------------- | --------- | --------------------------- | ------------------- |
| SO-2026-00150 | `019d728a-e37e-7cd6-b870-13fed80e361c` | 2026-04-09    | 1134.00   | Black & White Burger Nantes | Exacte              |
| SO-2026-00151 | `019d77e7-e1fa-753d-96c1-2a30fe396860` | 2026-04-10    | 3876.67   | Pokona (Pokawa Valvert)     | 1 cent (3876.68 SO) |
| SO-2026-00152 | `019d77e6-bd42-79df-8508-47d2ef80589a` | 2026-04-10    | 3913.56   | Poke Sud (Pokawa Narbonne)  | Exacte              |
| SO-2026-00154 | `019d77e8-b2b9-7e34-8597-63b88b00b32f` | 2026-04-10    | 3214.59   | Poke Bastia (Pokawa Bastia) | 1 cent (3214.58 SO) |
| SO-2026-00155 | `019d77e8-e885-7f3a-8980-114790b8cb4b` | 2026-04-10    | 2075.69   | Poka Bron (Pokawa Bron)     | Exacte              |

**Arbitrage a decider — SO-2026-00153** :

- Proforma deja liee localement : `019d8705-c901-7f0e-a058-d6bae3b6bbcc` (document_number `PROFORMA-)-2026-04`)
- Deuxieme proforma orpheline cote Qonto : `019d77e8-64d5-7102-96ee-f6f5028a74dd` (ALOHA VICTOIRE, 2944.46, 2026-04-10) — vraisemblablement une tentative doublon de Romeo

**Pas inclus dans le rattrapage** :

- SO-2026-00158, 00133, 00132 : pas de draft Qonto correspondant actuellement
- F-2026-017-PROFORMA (Pokawa Limoges 3639.40 / POKAWA BENSANCON 283.92), F-2026-018-PROFORMA (HNL POKA EXPRESS -579.46) : vieilles proformas, pas dans la liste des commandes demandees

---

## Script SQL de rattrapage (a valider)

`created_by` = `100d2439-0f52-46b1-9c30-ad7934b44719` (veronebyromeo@gmail.com).

```sql
INSERT INTO financial_documents (
  document_type, document_direction, document_number,
  partner_id, partner_type,
  document_date, due_date,
  total_ht, total_ttc, tva_amount, amount_paid,
  status, sales_order_id, qonto_invoice_id,
  invoice_source, customer_type, created_by
) VALUES
  ('customer_invoice','inbound','PROFORMA-SO-2026-00150',
   '7f7de4b2-2cf1-4f2c-9bb9-61ca466c27d9','customer',
   '2026-04-09','2026-05-09',
   495.00, 1134.00, 639.00, 0,
   'draft','b31eb467-e6fd-48c6-92df-0bf9bc2b211f','019d728a-e37e-7cd6-b870-13fed80e361c',
   'crm','organization','100d2439-0f52-46b1-9c30-ad7934b44719'),
  ('customer_invoice','inbound','PROFORMA-SO-2026-00151',
   '7fd898e4-4265-432b-9cdc-05822f895f1f','customer',
   '2026-04-10','2026-05-10',
   2780.57, 3876.68, 1096.11, 0,
   'draft','e190783e-8bf8-48c0-8e3d-29e21e51c64a','019d77e7-e1fa-753d-96c1-2a30fe396860',
   'crm','organization','100d2439-0f52-46b1-9c30-ad7934b44719'),
  ('customer_invoice','inbound','PROFORMA-SO-2026-00152',
   '17a6deda-bc51-411b-8cf5-93f077afefd8','customer',
   '2026-04-10','2026-05-10',
   2811.30, 3913.56, 1102.26, 0,
   'draft','a1fa7cf3-6955-42f0-b19e-4ab49581f945','019d77e6-bd42-79df-8508-47d2ef80589a',
   'crm','organization','100d2439-0f52-46b1-9c30-ad7934b44719'),
  ('customer_invoice','inbound','PROFORMA-SO-2026-00154',
   'a56b61ee-c61f-45ba-9239-65c897bdbae0','customer',
   '2026-04-10','2026-05-10',
   2078.82, 3214.58, 1135.76, 0,
   'draft','6c686991-3ace-43ce-9630-a7f0e6a19b22','019d77e8-b2b9-7e34-8597-63b88b00b32f',
   'crm','organization','100d2439-0f52-46b1-9c30-ad7934b44719'),
  ('customer_invoice','inbound','PROFORMA-SO-2026-00155',
   '27e321ed-d72d-4483-bba0-6a442565d5fa','customer',
   '2026-04-10','2026-05-10',
   1379.74, 2075.69, 695.95, 0,
   'draft','fcdae8d8-e3ff-4b21-9a9a-bd147613ad4e','019d77e8-e885-7f3a-8980-114790b8cb4b',
   'crm','organization','100d2439-0f52-46b1-9c30-ad7934b44719');
-- 5 rows
```

**Coherence contrainte `check_totals_coherent`** : verifiee pour les 5 lignes (`total_ttc - (total_ht + tva_amount) = 0`).

**Contraintes respectees** :

- `document_number` unique (`PROFORMA-SO-2026-XXXXX`)
- `sales_order_id` renseigne
- `qonto_invoice_id` renseigne (requis par `check_qonto_required_for_customer_invoices`)
- `partner_id` NOT NULL (organisation client)
- `created_by` = user reel (Romeo)

**Note** : les `financial_document_items` ne sont PAS inseres (page detail facture affichera "aucun item"). Si Romeo veut les items, il faudra reconstruire depuis `sales_order_items` ou depuis Qonto.

---

## Questions avant commit / execution

**Q1.** Valide-tu le script SQL ci-dessus (5 INSERT) ?

**Q2.** SO-2026-00153 cas du doublon Qonto :

- (a) Je laisse tel quel (garde `PROFORMA-)-2026-04`, doublon Qonto reste orphelin)
- (b) Je rename la ligne actuelle `PROFORMA-)-2026-04` → `PROFORMA-SO-2026-00153` pour coherence, doublon reste orphelin
- (c) Je rename + rattrape aussi le doublon avec un `PROFORMA-SO-2026-00153-BIS`

**Q3.** Inserer aussi les items dans `financial_document_items` ou non ?
