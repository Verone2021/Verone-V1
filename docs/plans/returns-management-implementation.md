# Plan d'Implémentation : Gestion Retours & Avoirs (Option B - Professionnelle)

**Version** : 1.0.0
**Date** : 2026-02-10
**Statut** : READY TO IMPLEMENT
**Durée estimée** : 10-12 jours

---

## 📋 Table des Matières

1. [Contexte & Problématique](#contexte--problématique)
2. [Best Practices ERP Recherchées](#best-practices-erp-recherchées)
3. [Architecture Proposée](#architecture-proposée)
4. [Workflow Complet](#workflow-complet)
5. [Plan d'Implémentation Phase par Phase](#plan-dimplémentation-phase-par-phase)
6. [Queries & Métriques](#queries--métriques)
7. [Migration Données Existantes](#migration-données-existantes)
8. [Checklist Validation](#checklist-validation)
9. [Références & Sources](#références--sources)

---

## 🎯 Contexte & Problématique

### Questions Métier Identifiées

Romeo a identifié 5 problématiques clés pour gérer les retours produits :

1. **Traçabilité** : Comment savoir qu'une facture/commande a eu des retours ?
2. **Gestion Stock** :
   - Produit retourné défectueux → Stock perdu (rebut)
   - Produit retourné en bon état → Réintégrer stock vendable
3. **Métriques** : Comment annuler les ventes dans les statistiques (CA, marges) ?
4. **Workflow** : Créer avoir depuis facture OU commande ?
5. **Comptabilité** : Impact sur CA, commissions affiliés, marges

### État Actuel Verone

**✅ Tables existantes** :

- `sales_orders` : Commandes clients
- `sales_order_items` : Lignes commandes
- `stock_movements` : Mouvements stock
- `financial_documents` : Factures/Avoirs
- 8 avoirs historiques créés (AV-25-001 à AV-25-008) avec montants négatifs

**❌ Manques identifiés** :

- Pas de table dédiée retours (RMA)
- Pas de workflow validation retour
- Pas de lien direct avoir ↔ commande origine
- Pas de distinction stock vendable/rebut
- Pas de traçabilité inspection qualité

---

## 📚 Best Practices ERP Recherchées

### Pattern Standard : 3 Entités Séparées

D'après les recherches web (Odoo, SAP, NetSuite, ERPNext), les ERP professionnels utilisent **3 flux distincts** :

| Flux                      | Entité               | Rôle                                                        |
| ------------------------- | -------------------- | ----------------------------------------------------------- |
| **1. Retour Marchandise** | `Return Order` (RMA) | Workflow physique : validation retour, inspection, décision |
| **2. Mouvement Stock**    | `Stock Movement`     | Traçabilité : produit entre en stock, change de statut      |
| **3. Avoir Financier**    | `Credit Note`        | Impact comptable : annule CA, rembourse client              |

### Workflow Odoo (Référence Industrie)

```
1. Client demande retour
   ↓
2. Création RMA (Return Merchandise Authorization)
   - Lien vers sales_order_id original
   - Motif retour : defect, wrong_item, customer_regret
   - État inspection : pending, approved, rejected
   ↓
3. SI approuvé → Reverse Transfer (mouvement stock)
   - Produit revient en stock avec statut (vendable/rebut)
   - Traçabilité : from sales_order X, reason Y
   ↓
4. Création Credit Note (avoir financier)
   - Lien vers invoice_id + RMA_id
   - Montant = montant ligne retournée
   - Impact comptable automatique
```

**Source principale** : [Odoo Returns Documentation](https://www.odoo.com/documentation/19.0/applications/sales/sales/products_prices/returns.html)

### Principes Clés Identifiés

1. **Séparation flux physique ≠ flux financier** : On peut recevoir le retour (physique) AVANT de créer l'avoir (financier)
2. **Validation multi-étapes** : requested → approved → received → inspected → completed
3. **Traçabilité totale** : Qui a fait quoi, quand, pourquoi (audit trail)
4. **Stock status** : sellable, damaged, expired, lost (pas juste quantité)
5. **Métriques** : Taux retour par produit, par motif, par client (optimisation fournisseurs)

**Sources complémentaires** :

- [NetSuite Returns Management](https://www.netsuite.com/portal/products/erp/order-management/returns-management.shtml)
- [ERPAG Credit Note Guide](https://www.erpag.com/news/understanding-erpag-credit-note-management-a-comprehensive-guide)
- [RMA with ERP - Datix](https://datixinc.com/blog/return-merchandise-authorization-with-erp/)

---

## 🏗️ Architecture Proposée

### Nouvelles Tables

#### Table `returns` (Retours Marchandise - RMA)

```sql
CREATE TABLE returns (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL, -- Format: RET-YYYY-NNNN (ex: RET-2026-0001)

  -- Référence commande/facture origine
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE RESTRICT,
  invoice_id UUID REFERENCES financial_documents(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,

  -- Workflow & Status
  status TEXT NOT NULL CHECK (status IN (
    'requested',   -- Client a demandé retour
    'approved',    -- Staff a validé la demande
    'rejected',    -- Staff a refusé la demande
    'received',    -- Produit physiquement reçu
    'inspected',   -- Qualité inspectée
    'completed',   -- Avoir créé, process terminé
    'cancelled'    -- Annulé (client ne retourne finalement pas)
  )) DEFAULT 'requested',

  -- Motif retour (customer-facing)
  return_reason TEXT NOT NULL CHECK (return_reason IN (
    'defective',          -- Produit défectueux
    'wrong_item',         -- Mauvais produit envoyé
    'not_as_described',   -- Pas conforme description
    'customer_regret',    -- Client change d'avis (satisfait ou remboursé)
    'damaged_shipping',   -- Endommagé pendant transport
    'other'
  )),
  return_reason_details TEXT, -- Détails additionnels

  -- Résultat inspection (staff-facing)
  inspection_result TEXT CHECK (inspection_result IN (
    'resellable',          -- Produit revendable (stock vendable)
    'damaged_repairable',  -- Endommagé mais réparable
    'damaged_scrap',       -- Endommagé, à jeter (stock perdu)
    'pending'              -- En attente inspection
  )) DEFAULT 'pending',
  inspection_notes TEXT,

  -- Remboursement
  refund_method TEXT CHECK (refund_method IN (
    'credit_note',      -- Avoir financier (défaut)
    'bank_transfer',    -- Virement bancaire
    'store_credit',     -- Crédit magasin (futur)
    'exchange'          -- Échange produit (futur)
  )) DEFAULT 'credit_note',
  credit_note_id UUID REFERENCES financial_documents(id) ON DELETE SET NULL,

  -- Logistique
  return_shipping_carrier TEXT,
  return_tracking_number TEXT,

  -- Traçabilité complète (qui, quand)
  requested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ,
  inspected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  inspected_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,

  -- Notes libres
  customer_notes TEXT,  -- Notes client (pourquoi retour)
  internal_notes TEXT,  -- Notes staff (inspection, décision)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes pour performance
  INDEX idx_returns_sales_order_id ON returns(sales_order_id),
  INDEX idx_returns_customer_id ON returns(customer_id),
  INDEX idx_returns_status ON returns(status),
  INDEX idx_returns_created_at ON returns(created_at)
);

-- Trigger auto-update updated_at
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaire table
COMMENT ON TABLE returns IS
  'Return Merchandise Authorization (RMA). ' ||
  'Workflow: requested → approved → received → inspected → completed. ' ||
  'Links to sales_orders (origin), financial_documents (credit note), stock_movements (restock).';
```

#### Table `return_items` (Lignes Retour)

```sql
CREATE TABLE return_items (
  -- Identifiant
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,

  -- Référence produit & ligne commande origine
  sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE RESTRICT,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  -- Quantités (workflow progressif)
  quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),  -- Client demande retour X unités
  quantity_approved INTEGER CHECK (quantity_approved >= 0),            -- Staff approuve Y unités (peut être < requested)
  quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),  -- Physiquement reçu Z unités
  quantity_restocked INTEGER DEFAULT 0 CHECK (quantity_restocked >= 0), -- Remis en stock W unités

  -- État produit à réception
  condition_on_return TEXT CHECK (condition_on_return IN (
    'new',        -- Neuf (jamais utilisé, emballage intact)
    'good',       -- Bon état (utilisé mais fonctionnel)
    'damaged',    -- Endommagé
    'unusable'    -- Inutilisable
  )),
  condition_notes TEXT,

  -- Lien mouvement stock créé
  stock_movement_id UUID REFERENCES stock_movements(id) ON DELETE SET NULL,

  -- Prix unitaire au moment de la vente (pour calcul avoir)
  unit_price_ht NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,4) DEFAULT 0.20,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints métier
  CONSTRAINT check_quantities CHECK (
    quantity_approved IS NULL OR quantity_approved <= quantity_requested
  ),
  CONSTRAINT check_received_approved CHECK (
    quantity_received <= COALESCE(quantity_approved, quantity_requested)
  ),

  -- Indexes
  INDEX idx_return_items_return_id ON return_items(return_id),
  INDEX idx_return_items_product_id ON return_items(product_id),
  INDEX idx_return_items_sales_order_item_id ON return_items(sales_order_item_id)
);

-- Trigger auto-update
CREATE TRIGGER update_return_items_updated_at
  BEFORE UPDATE ON return_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Commentaire
COMMENT ON TABLE return_items IS
  'Line items for returns. ' ||
  'Tracks quantities through workflow: requested → approved → received → restocked. ' ||
  'Links to sales_order_items (origin) and stock_movements (restock operation).';
```

### Modifications Tables Existantes

#### Table `financial_documents` (Avoirs)

```sql
-- Ajouter colonnes pour lien avoir ↔ commande/retour
ALTER TABLE financial_documents
  ADD COLUMN related_sales_order_id UUID REFERENCES sales_orders(id) ON DELETE SET NULL,
  ADD COLUMN related_invoice_id UUID REFERENCES financial_documents(id) ON DELETE SET NULL,
  ADD COLUMN related_return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  ADD COLUMN is_credit_note BOOLEAN DEFAULT false,
  ADD COLUMN credit_note_reason TEXT CHECK (credit_note_reason IN (
    'product_return',   -- Retour produit (lié à return_id)
    'shipping_refund',  -- Remboursement frais livraison
    'overcharge',       -- Surfacturation
    'discount',         -- Remise commerciale
    'other'
  ));

-- Index pour requêtes avoirs
CREATE INDEX idx_financial_documents_related_sales_order ON financial_documents(related_sales_order_id);
CREATE INDEX idx_financial_documents_related_return ON financial_documents(related_return_id);
CREATE INDEX idx_financial_documents_is_credit_note ON financial_documents(is_credit_note);

-- Commentaire
COMMENT ON COLUMN financial_documents.related_sales_order_id IS
  'Sales order this credit note is related to (for traceability).';
COMMENT ON COLUMN financial_documents.related_return_id IS
  'Return (RMA) this credit note was generated from.';
COMMENT ON COLUMN financial_documents.is_credit_note IS
  'True if this document is a credit note (avoir). Use for filtering CA net.';
```

#### Table `stock_movements` (Statut Stock)

```sql
-- Ajouter colonne statut stock
ALTER TABLE stock_movements
  ADD COLUMN stock_status TEXT CHECK (stock_status IN (
    'sellable',    -- Stock vendable (défaut)
    'damaged',     -- Endommagé, non vendable
    'expired',     -- Périmé (si applicable)
    'lost',        -- Perdu
    'quarantine',  -- Quarantaine (inspection en cours)
    'reserved'     -- Réservé pour commande
  )) DEFAULT 'sellable',
  ADD COLUMN quality_check_notes TEXT;

-- Index
CREATE INDEX idx_stock_movements_stock_status ON stock_movements(stock_status);

-- Commentaire
COMMENT ON COLUMN stock_movements.stock_status IS
  'Status of stock after this movement. Allows tracking sellable vs damaged/lost inventory.';
```

#### Table `sales_order_items` (Traçabilité Retours)

```sql
-- Ajouter colonnes pour tracker retours
ALTER TABLE sales_order_items
  ADD COLUMN returned_quantity INTEGER DEFAULT 0 CHECK (returned_quantity >= 0),
  ADD COLUMN last_return_id UUID REFERENCES returns(id) ON DELETE SET NULL,
  ADD COLUMN last_returned_at TIMESTAMPTZ;

-- Constraint : returned_quantity ne peut pas dépasser quantity
ALTER TABLE sales_order_items
  ADD CONSTRAINT check_returned_quantity_max CHECK (returned_quantity <= quantity);

-- Index
CREATE INDEX idx_sales_order_items_last_return_id ON sales_order_items(last_return_id);

-- Commentaire
COMMENT ON COLUMN sales_order_items.returned_quantity IS
  'Total quantity returned for this line item (cumulative if multiple returns).';
COMMENT ON COLUMN sales_order_items.last_return_id IS
  'Last return that affected this line item (for quick reference).';
```

### Schéma Relations

```
sales_orders (1) ──────────< (N) return
    │                           │
    │                           │ (1)
    │                           │
    └──< (N) sales_order_items ─┴─< (N) return_items
              │                           │
              │                           │
              │                           ↓
              │                      stock_movements (via stock_movement_id)
              │
              ↓
         financial_documents (invoices)
              ↑
              │ (related_return_id)
              │
         returns (via credit_note_id)
```

---

## 🔄 Workflow Complet

### Diagramme Workflow (États)

```
┌─────────────┐
│  requested  │  ← Client demande retour (UI ou email)
└──────┬──────┘
       │
       ↓ (Staff review)
┌─────────────┐
│  approved   │  ← Staff valide (quantity_approved peut être < requested)
└──────┬──────┘    SI refusé → rejected (terminal)
       │
       ↓ (Produit reçu physiquement)
┌─────────────┐
│  received   │  ← Warehouse confirme réception
└──────┬──────┘
       │
       ↓ (Inspection qualité)
┌─────────────┐
│  inspected  │  ← Inspection: resellable / damaged_scrap / damaged_repairable
└──────┬──────┘
       │
       ↓ (Mouvement stock + Avoir créé)
┌─────────────┐
│  completed  │  ← Process terminé
└─────────────┘
```

### Workflow Détaillé Étape par Étape

#### **Étape 1 : Client Demande Retour** (Status: `requested`)

**Déclencheur** :

- Client contacte support (email, téléphone)
- OU Interface LinkMe "Mes commandes" → Bouton "Demander retour"

**Actions Backend** :

```typescript
// app/actions/returns.ts
export async function createReturn({
  salesOrderId,
  items, // [{ salesOrderItemId, productId, quantity, reason }]
  returnReason,
  customerNotes
}: CreateReturnParams) {
  // 1. Vérifier commande existe et client a droit (RLS)
  const order = await getOrderById(salesOrderId);

  // 2. Créer retour
  const return = await db.insert(returns).values({
    return_number: await generateReturnNumber(), // RET-2026-0001
    sales_order_id: salesOrderId,
    customer_id: order.customer_id,
    invoice_id: order.invoice_id, // Si facturé
    status: 'requested',
    return_reason: returnReason,
    customer_notes: customerNotes,
    requested_by: await getAuthUserId(),
    requested_at: new Date()
  }).returning();

  // 3. Créer lignes retour
  for (const item of items) {
    await db.insert(return_items).values({
      return_id: return.id,
      sales_order_item_id: item.salesOrderItemId,
      product_id: item.productId,
      quantity_requested: item.quantity,
      unit_price_ht: item.unit_price_ht, // Depuis sales_order_items
      tax_rate: item.tax_rate
    });
  }

  // 4. Notification staff (email)
  await sendEmail({
    to: 'support@verone.com',
    subject: `Nouvelle demande retour ${return.return_number}`,
    template: 'return-requested',
    data: { return, items }
  });

  return return;
}
```

**UI** :

- Page `/commandes/[id]` : Bouton "Demander retour"
- Modal : Sélection produits + quantités + motif + notes
- Confirmation : "Demande envoyée, n° RET-2026-XXXX"

---

#### **Étape 2 : Staff Valide Retour** (Status: `approved` ou `rejected`)

**Déclencheur** :

- Staff ouvre `/retours/demandes`
- Clique sur retour → Détail → Bouton "Approuver" ou "Refuser"

**Actions Backend** :

```typescript
// app/actions/returns.ts
export async function approveReturn({
  returnId,
  approvedItems // [{ returnItemId, quantityApproved }]
}: ApproveReturnParams) {
  // 1. Update return status
  await db.update(returns)
    .set({
      status: 'approved',
      approved_by: await getAuthUserId(),
      approved_at: new Date()
    })
    .where(eq(returns.id, returnId));

  // 2. Update quantities approved
  for (const item of approvedItems) {
    await db.update(return_items)
      .set({ quantity_approved: item.quantityApproved })
      .where(eq(return_items.id, item.returnItemId));
  }

  // 3. Notification client
  await sendEmail({
    to: customer.email,
    subject: `Retour ${returnNumber} approuvé`,
    template: 'return-approved',
    data: { return, shipping_label_url }
  });

  return return;
}

export async function rejectReturn({
  returnId,
  rejectionReason
}: RejectReturnParams) {
  await db.update(returns)
    .set({
      status: 'rejected',
      rejected_by: await getAuthUserId(),
      rejected_at: new Date(),
      rejection_reason: rejectionReason
    })
    .where(eq(returns.id, returnId));

  // Notification client
  await sendEmail({
    to: customer.email,
    subject: `Retour ${returnNumber} refusé`,
    template: 'return-rejected',
    data: { return, rejectionReason }
  });
}
```

**UI** :

- `/retours/demandes` : Liste retours status=requested
- Détail retour : Tableau produits avec quantités demandées
- Actions : "Approuver tout" OU "Approuver partiellement" (ajuster quantités) OU "Refuser" (saisir motif)

---

#### **Étape 3 : Réception Physique** (Status: `received`)

**Déclencheur** :

- Colis arrive au warehouse
- Staff scanne étiquette retour ou cherche par n° RET-XXXX

**Actions Backend** :

```typescript
// app/actions/returns.ts
export async function receiveReturn({
  returnId,
  receivedItems, // [{ returnItemId, quantityReceived, conditionOnReturn, conditionNotes }]
  returnTrackingNumber,
  returnShippingCarrier
}: ReceiveReturnParams) {
  // 1. Update return status
  await db.update(returns)
    .set({
      status: 'received',
      received_by: await getAuthUserId(),
      received_at: new Date(),
      return_tracking_number: returnTrackingNumber,
      return_shipping_carrier: returnShippingCarrier
    })
    .where(eq(returns.id, returnId));

  // 2. Update items received
  for (const item of receivedItems) {
    await db.update(return_items)
      .set({
        quantity_received: item.quantityReceived,
        condition_on_return: item.conditionOnReturn,
        condition_notes: item.conditionNotes
      })
      .where(eq(return_items.id, item.returnItemId));
  }

  return return;
}
```

**UI** :

- `/retours/receptions` : Liste retours status=approved
- Scan étiquette → Ouvre détail retour
- Pour chaque produit : Saisir quantité reçue + état (new/good/damaged/unusable)
- Bouton "Valider réception" → Passe à inspected

---

#### **Étape 4 : Inspection Qualité** (Status: `inspected`)

**Déclencheur** :

- Après réception, équipe qualité inspecte produits
- Décision : resellable / damaged_repairable / damaged_scrap

**Actions Backend** :

```typescript
// app/actions/returns.ts
export async function inspectReturn({
  returnId,
  inspectionResult, // 'resellable' | 'damaged_repairable' | 'damaged_scrap'
  inspectionNotes,
  itemsDecisions // [{ returnItemId, stockStatus, restockQuantity }]
}: InspectReturnParams) {
  // 1. Update return
  await db.update(returns)
    .set({
      status: 'inspected',
      inspection_result: inspectionResult,
      inspection_notes: inspectionNotes,
      inspected_by: await getAuthUserId(),
      inspected_at: new Date()
    })
    .where(eq(returns.id, returnId));

  // 2. Créer mouvements stock pour chaque produit
  for (const decision of itemsDecisions) {
    const returnItem = await db.query.return_items.findFirst({
      where: eq(return_items.id, decision.returnItemId),
      with: { product: true }
    });

    // Mouvement stock : +X unités avec stock_status
    const stockMovement = await db.insert(stock_movements).values({
      product_id: returnItem.product_id,
      movement_type: 'return',
      quantity_change: decision.restockQuantity,
      stock_status: decision.stockStatus, // 'sellable' ou 'damaged'
      reference_type: 'return',
      reference_id: returnId,
      reason_code: `Return ${return.return_number}`,
      notes: `Inspection: ${decision.stockStatus}. ${inspectionNotes}`,
      performed_by: await getAuthUserId(),
      performed_at: new Date()
    }).returning();

    // Link stock movement to return_item
    await db.update(return_items)
      .set({
        quantity_restocked: decision.restockQuantity,
        stock_movement_id: stockMovement.id
      })
      .where(eq(return_items.id, decision.returnItemId));

    // Update sales_order_items.returned_quantity
    await db.execute(sql`
      UPDATE sales_order_items
      SET
        returned_quantity = returned_quantity + ${decision.restockQuantity},
        last_return_id = ${returnId},
        last_returned_at = NOW()
      WHERE id = ${returnItem.sales_order_item_id}
    `);
  }

  return return;
}
```

**UI** :

- `/retours/inspections` : Liste retours status=received
- Formulaire inspection :
  - Pour chaque produit : Dropdown "Décision" (Revendable / Réparable / Rebut)
  - Quantité à remettre en stock
  - Notes inspection
- Bouton "Finaliser inspection" → Crée mouvements stock + Passe à inspected

---

#### **Étape 5 : Génération Avoir** (Status: `completed`)

**Déclencheur** :

- Après inspection, staff clique "Générer avoir"
- OU Automatique si inspection_result='resellable' (configurable)

**Actions Backend** :

```typescript
// app/actions/returns.ts
export async function generateCreditNote({
  returnId
}: GenerateCreditNoteParams) {
  const return = await db.query.returns.findFirst({
    where: eq(returns.id, returnId),
    with: {
      items: { with: { product: true } },
      customer: true,
      sales_order: true
    }
  });

  if (return.status !== 'inspected') {
    throw new Error('Return must be inspected before generating credit note');
  }

  // 1. Calculer montants
  let totalHT = 0;
  let totalTTC = 0;
  const creditNoteLines = [];

  for (const item of return.items) {
    const qtyRefund = item.quantity_approved; // Quantité approuvée (peut être < reçue si différence)
    const lineHT = -(qtyRefund * item.unit_price_ht); // Montant négatif
    const lineTTC = lineHT * (1 + item.tax_rate);

    totalHT += lineHT;
    totalTTC += lineTTC;

    creditNoteLines.push({
      product_id: item.product_id,
      quantity: -qtyRefund,
      unit_price_ht: item.unit_price_ht,
      tax_rate: item.tax_rate,
      total_ht: lineHT,
      total_ttc: lineTTC,
      description: `Retour ${return.return_number} - ${item.product.name}`
    });
  }

  // 2. Créer avoir dans financial_documents
  const creditNote = await db.insert(financial_documents).values({
    document_type: 'credit_note',
    document_number: await generateCreditNoteNumber(), // AV-2026-0001
    document_date: new Date(),
    partner_id: return.customer_id,
    partner_type: 'organisation',
    related_sales_order_id: return.sales_order_id,
    related_invoice_id: return.invoice_id,
    related_return_id: returnId,
    is_credit_note: true,
    credit_note_reason: 'product_return',
    total_ht: totalHT,
    total_ttc: totalTTC,
    tva_amount: totalTTC - totalHT,
    status: 'draft', // Ou 'finalized' si validation auto
    created_by: await getAuthUserId(),
    notes: `Avoir pour retour ${return.return_number} - Motif: ${return.return_reason}`
  }).returning();

  // 3. Créer lignes avoir (si table financial_document_lines existe)
  for (const line of creditNoteLines) {
    await db.insert(financial_document_lines).values({
      financial_document_id: creditNote.id,
      ...line
    });
  }

  // 4. Update return → completed
  await db.update(returns)
    .set({
      status: 'completed',
      credit_note_id: creditNote.id,
      completed_by: await getAuthUserId(),
      completed_at: new Date()
    })
    .where(eq(returns.id, returnId));

  // 5. Notification client
  await sendEmail({
    to: return.customer.email,
    subject: `Avoir ${creditNote.document_number} créé`,
    template: 'credit-note-created',
    data: { return, creditNote, pdfUrl: creditNote.local_pdf_url }
  });

  return creditNote;
}
```

**UI** :

- `/retours/inspections/[id]` : Après inspection, bouton "Générer avoir"
- Prévisualisation montant avoir (calculé depuis items approved)
- Confirmation → Crée avoir + Email client + Passe retour à completed

---

### Workflow Alternatifs

#### Cas 1 : Retour Partiel (Client retourne 2 produits sur 5)

- `sales_order_items.quantity = 5`
- `return_items.quantity_requested = 2`
- `return_items.quantity_approved = 2`
- `sales_order_items.returned_quantity = 2` (après inspection)
- Avoir créé pour 2 unités uniquement

#### Cas 2 : Retour Refusé (Produit hors garantie)

- Status : requested → rejected
- `returns.rejection_reason = "Produit hors garantie (>30 jours)"`
- Pas de mouvement stock, pas d'avoir
- Email client avec motif refus

#### Cas 3 : Retour Endommagé (Stock perdu)

- Status : requested → approved → received → inspected → completed
- `inspection_result = 'damaged_scrap'`
- `stock_movements.stock_status = 'damaged'` (quantité entre en "stock perdu")
- Avoir créé quand même (client remboursé)
- Métriques : Perte stock = X€

---

## 📅 Plan d'Implémentation Phase par Phase

### **Phase 1 : Base de Données** (2 jours)

**Objectif** : Créer toutes les tables, colonnes, indexes, triggers.

#### Tâche 1.1 : Migration Créer Tables Returns

**Fichier** : `supabase/migrations/20260210000001_create_returns_tables.sql`

```sql
-- Voir section "Architecture Proposée" pour SQL complet
-- Créer :
-- - Table returns
-- - Table return_items
-- - Indexes
-- - Triggers updated_at
-- - Commentaires
```

#### Tâche 1.2 : Migration Modifier Tables Existantes

**Fichier** : `supabase/migrations/20260210000002_add_returns_columns_existing_tables.sql`

```sql
-- Modifier financial_documents (related_sales_order_id, related_return_id, is_credit_note, credit_note_reason)
-- Modifier stock_movements (stock_status, quality_check_notes)
-- Modifier sales_order_items (returned_quantity, last_return_id, last_returned_at)
-- Créer indexes
```

#### Tâche 1.3 : Migration RLS Policies

**Fichier** : `supabase/migrations/20260210000003_rls_returns.sql`

```sql
-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

-- Policy : Staff back-office voit tout
CREATE POLICY "staff_full_access_returns" ON returns
  FOR ALL TO authenticated
  USING (is_backoffice_user());

CREATE POLICY "staff_full_access_return_items" ON return_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM returns r
      WHERE r.id = return_items.return_id
        AND is_backoffice_user()
    )
  );

-- Policy : Affiliés LinkMe voient leurs retours
CREATE POLICY "affiliate_own_returns" ON returns
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      JOIN sales_orders so ON so.customer_id = uar.organisation_id
      WHERE so.id = returns.sales_order_id
        AND uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
    )
  );

-- Policy : Clients individuels voient leurs retours (si site-internet)
-- (À définir selon architecture auth site-internet)
```

#### Tâche 1.4 : Fonctions Helper

**Fichier** : `supabase/migrations/20260210000004_returns_helper_functions.sql`

```sql
-- Fonction génération numéro retour RET-YYYY-NNNN
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year TEXT := TO_CHAR(NOW(), 'YYYY');
  seq_name TEXT := 'returns_number_seq_' || year;
  next_num INTEGER;
  return_number TEXT;
BEGIN
  -- Créer séquence pour l'année si n'existe pas
  IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = seq_name) THEN
    EXECUTE format('CREATE SEQUENCE %I START WITH 1', seq_name);
  END IF;

  -- Get next number
  EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_num;

  -- Format RET-2026-0001
  return_number := 'RET-' || year || '-' || LPAD(next_num::TEXT, 4, '0');

  RETURN return_number;
END;
$$;

-- Fonction calcul montant avoir depuis retour
CREATE OR REPLACE FUNCTION calculate_credit_note_amount(p_return_id UUID)
RETURNS TABLE(total_ht NUMERIC, total_ttc NUMERIC, tva_amount NUMERIC)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(ri.quantity_approved * ri.unit_price_ht) AS total_ht,
    SUM(ri.quantity_approved * ri.unit_price_ht * (1 + ri.tax_rate)) AS total_ttc,
    SUM(ri.quantity_approved * ri.unit_price_ht * ri.tax_rate) AS tva_amount
  FROM return_items ri
  WHERE ri.return_id = p_return_id;
END;
$$;
```

#### Tâche 1.5 : Appliquer Migrations + Vérifier

```bash
# Appliquer via MCP Supabase
mcp__supabase__execute_sql(<migration_content>)

# Vérifier tables créées
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%return%';

# Vérifier RLS activé
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('returns', 'return_items');
```

**Livrable Phase 1** :

- ✅ 4 migrations appliquées
- ✅ Tables returns + return_items créées
- ✅ Colonnes ajoutées sur financial_documents, stock_movements, sales_order_items
- ✅ RLS policies actives
- ✅ Fonctions helper disponibles

---

### **Phase 2 : Backend API** (3 jours)

**Objectif** : Créer toutes les routes API et server actions.

#### Tâche 2.1 : Route API `/api/returns`

**Fichier** : `apps/back-office/src/app/api/returns/route.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema validation
const CreateReturnSchema = z.object({
  salesOrderId: z.string().uuid(),
  items: z.array(
    z.object({
      salesOrderItemId: z.string().uuid(),
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitPriceHt: z.number(),
      taxRate: z.number(),
    })
  ),
  returnReason: z.enum([
    'defective',
    'wrong_item',
    'not_as_described',
    'customer_regret',
    'damaged_shipping',
    'other',
  ]),
  customerNotes: z.string().optional(),
});

// GET /api/returns - Liste retours (filtres: status, customer_id, date_range)
export async function GET(request: NextRequest) {
  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const customerId = searchParams.get('customer_id');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  let query = supabase
    .from('returns')
    .select(
      `
      *,
      customer:organisations(id, legal_name),
      sales_order:sales_orders(id, order_number),
      items:return_items(
        *,
        product:products(id, sku, name),
        sales_order_item:sales_order_items(id, quantity, unit_price_ht)
      )
    `
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (customerId) query = query.eq('customer_id', customerId);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ returns: data });
}

// POST /api/returns - Créer retour
export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();

  const validated = CreateReturnSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Validation error', details: validated.error.flatten() },
      { status: 400 }
    );
  }

  const { salesOrderId, items, returnReason, customerNotes } = validated.data;

  // 1. Vérifier commande existe
  const { data: order, error: orderError } = await supabase
    .from('sales_orders')
    .select('id, customer_id, invoice_id')
    .eq('id', salesOrderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Sales order not found' },
      { status: 404 }
    );
  }

  // 2. Générer return_number
  const { data: returnNumberData } = await supabase.rpc(
    'generate_return_number'
  );
  const returnNumber = returnNumberData;

  // 3. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Créer retour
  const { data: newReturn, error: returnError } = await supabase
    .from('returns')
    .insert({
      return_number: returnNumber,
      sales_order_id: salesOrderId,
      customer_id: order.customer_id,
      invoice_id: order.invoice_id,
      status: 'requested',
      return_reason: returnReason,
      customer_notes: customerNotes,
      requested_by: user?.id,
      requested_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (returnError) {
    return NextResponse.json({ error: returnError.message }, { status: 500 });
  }

  // 5. Créer lignes retour
  const returnItems = items.map(item => ({
    return_id: newReturn.id,
    sales_order_item_id: item.salesOrderItemId,
    product_id: item.productId,
    quantity_requested: item.quantity,
    unit_price_ht: item.unitPriceHt,
    tax_rate: item.taxRate,
  }));

  const { error: itemsError } = await supabase
    .from('return_items')
    .insert(returnItems);

  if (itemsError) {
    // Rollback return if items fail
    await supabase.from('returns').delete().eq('id', newReturn.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // 6. TODO: Send notification email to staff

  return NextResponse.json({ return: newReturn }, { status: 201 });
}
```

#### Tâche 2.2 : Route API `/api/returns/[id]`

**Fichier** : `apps/back-office/src/app/api/returns/[id]/route.ts`

```typescript
// GET /api/returns/[id] - Détail retour
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('returns')
    .select(
      `
      *,
      customer:organisations(id, legal_name, email),
      sales_order:sales_orders(id, order_number, order_date),
      invoice:financial_documents!returns_invoice_id_fkey(id, document_number),
      credit_note:financial_documents!returns_credit_note_id_fkey(id, document_number, total_ttc),
      items:return_items(
        *,
        product:products(id, sku, name, image_url),
        sales_order_item:sales_order_items(id, quantity, unit_price_ht),
        stock_movement:stock_movements(id, quantity_change, stock_status, performed_at)
      ),
      requested_by_user:auth.users!returns_requested_by_fkey(id, email),
      approved_by_user:auth.users!returns_approved_by_fkey(id, email),
      inspected_by_user:auth.users!returns_inspected_by_fkey(id, email)
    `
    )
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  return NextResponse.json({ return: data });
}

// PATCH /api/returns/[id] - Update retour (status, notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const body = await request.json();

  // Validation selon action (approve, reject, receive, inspect, complete)
  // ...

  const { data, error } = await supabase
    .from('returns')
    .update(body)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ return: data });
}
```

#### Tâche 2.3 : Routes Actions Workflow

**Fichier** : `apps/back-office/src/app/api/returns/[id]/approve/route.ts`

```typescript
// POST /api/returns/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Voir "Workflow Détaillé Étape par Étape" → Étape 2
  // Implémentation complète de approveReturn()
}
```

**Fichiers similaires** :

- `apps/back-office/src/app/api/returns/[id]/reject/route.ts`
- `apps/back-office/src/app/api/returns/[id]/receive/route.ts`
- `apps/back-office/src/app/api/returns/[id]/inspect/route.ts`
- `apps/back-office/src/app/api/returns/[id]/credit-note/route.ts`

#### Tâche 2.4 : Server Actions (Alternative RSC)

**Fichier** : `apps/back-office/src/app/actions/returns.ts`

```typescript
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// Toutes les fonctions décrites dans "Workflow Détaillé"
export async function createReturn(...)
export async function approveReturn(...)
export async function rejectReturn(...)
export async function receiveReturn(...)
export async function inspectReturn(...)
export async function generateCreditNote(...)

// Validation Zod pour chaque fonction
// Revalidate cache après mutations
// Error handling standard
```

**Livrable Phase 2** :

- ✅ 6 routes API créées (GET list, POST create, GET detail, PATCH update, + 5 actions)
- ✅ Server actions créés (alternative pour RSC)
- ✅ Validation Zod sur tous les inputs
- ✅ Error handling standard (try/catch, logs)
- ✅ Tests manuels via Postman/Thunder Client

---

### **Phase 3 : UI Back-Office** (4 jours)

**Objectif** : Créer toutes les pages et composants UI.

#### Tâche 3.1 : Page Liste Retours

**Fichier** : `apps/back-office/src/app/(protected)/retours/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '@/components/ui/data-table';
import { ReturnStatusBadge } from '@/components/returns/return-status-badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RetoursPage() {
  const [activeTab, setActiveTab] = useState<'demandes' | 'receptions' | 'inspections' | 'historique'>('demandes');

  // Query retours selon tab active
  const { data, isLoading } = useQuery({
    queryKey: ['returns', activeTab],
    queryFn: async () => {
      const statusMap = {
        demandes: 'requested,approved',
        receptions: 'approved',
        inspections: 'received',
        historique: 'inspected,completed,rejected,cancelled'
      };
      const res = await fetch(`/api/returns?status=${statusMap[activeTab]}`);
      return res.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Retours & Avoirs</h1>
        <Button onClick={() => router.push('/retours/nouveau')}>
          Créer retour manuel
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="demandes">
            Demandes ({data?.returns?.filter(r => r.status === 'requested').length || 0})
          </TabsTrigger>
          <TabsTrigger value="receptions">
            Réceptions ({data?.returns?.filter(r => r.status === 'approved').length || 0})
          </TabsTrigger>
          <TabsTrigger value="inspections">
            Inspections ({data?.returns?.filter(r => r.status === 'received').length || 0})
          </TabsTrigger>
          <TabsTrigger value="historique">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <DataTable
            columns={[
              { accessorKey: 'return_number', header: 'N° Retour' },
              { accessorKey: 'sales_order.order_number', header: 'Commande' },
              { accessorKey: 'customer.legal_name', header: 'Client' },
              { accessorKey: 'return_reason', header: 'Motif' },
              {
                accessorKey: 'status',
                header: 'Statut',
                cell: ({ row }) => <ReturnStatusBadge status={row.original.status} />
              },
              { accessorKey: 'created_at', header: 'Date demande', cell: ({ row }) => formatDate(row.original.created_at) },
              {
                id: 'actions',
                cell: ({ row }) => (
                  <Button variant="ghost" onClick={() => router.push(`/retours/${row.original.id}`)}>
                    Voir détails
                  </Button>
                )
              }
            ]}
            data={data?.returns || []}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Tâche 3.2 : Page Détail Retour

**Fichier** : `apps/back-office/src/app/(protected)/retours/[id]/page.tsx`

```typescript
// Structure similaire à /commandes/[id]
// Sections :
// - Header : Return number, status, customer, sales order link
// - Timeline : requested → approved → received → inspected → completed
// - Items table : Products, quantities (requested/approved/received), condition
// - Actions buttons selon status :
//   - requested: Approuver / Refuser
//   - approved: Marquer reçu
//   - received: Inspecter
//   - inspected: Générer avoir
// - Notes : customer_notes, internal_notes, inspection_notes
// - Links : Commande origine, Facture, Avoir créé
```

#### Tâche 3.3 : Modal Créer Retour depuis Commande

**Fichier** : `apps/back-office/src/components/returns/create-return-modal.tsx`

```typescript
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField } from '@/components/ui/form';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export function CreateReturnModal({
  salesOrder,
  open,
  onOpenChange
}: {
  salesOrder: SalesOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<{
    salesOrderItemId: string;
    productId: string;
    quantity: number;
    unitPriceHt: number;
    taxRate: number;
  }[]>([]);

  const createReturnMutation = useMutation({
    mutationFn: async (data: CreateReturnInput) => {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create return');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders', salesOrder.id] });
      toast.success('Retour créé avec succès');
      onOpenChange(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Créer retour depuis commande {salesOrder.order_number}</DialogTitle>
        </DialogHeader>

        <Form onSubmit={(data) => createReturnMutation.mutate(data)}>
          {/* Table produits avec checkboxes + input quantité */}
          {/* Select motif retour */}
          {/* Textarea notes client */}

          <Button type="submit" loading={createReturnMutation.isPending}>
            Créer retour
          </Button>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

#### Tâche 3.4 : Composants Réutilisables

**Fichiers** :

- `components/returns/return-status-badge.tsx` : Badge coloré selon status
- `components/returns/return-timeline.tsx` : Timeline visuelle workflow
- `components/returns/approve-return-form.tsx` : Formulaire approbation (ajuster quantités)
- `components/returns/receive-return-form.tsx` : Formulaire réception (saisir quantités + état)
- `components/returns/inspect-return-form.tsx` : Formulaire inspection (décision par produit)
- `components/returns/credit-note-preview.tsx` : Prévisualisation montant avoir

#### Tâche 3.5 : Intégration Pages Existantes

**Modifier** :

- `apps/back-office/src/app/(protected)/commandes/[id]/page.tsx` :
  - Ajouter bouton "Créer retour" (si commande delivered/completed)
  - Ajouter section "Retours liés" (liste retours liés)
- `apps/back-office/src/app/(protected)/factures/[id]/page.tsx` :
  - Ajouter bouton "Créer retour" (si facture finalized)
  - Afficher lien vers retour si avoir créé depuis retour

**Livrable Phase 3** :

- ✅ 4 pages créées (/retours, /retours/[id], /retours/nouveau, integrations)
- ✅ 6+ composants créés (modals, forms, badges, timeline)
- ✅ Intégration dans pages commandes/factures existantes
- ✅ UI/UX cohérente avec design system shadcn/ui
- ✅ Tests manuels de tous les workflows

---

### **Phase 4 : Automatisations & Triggers** (2 jours)

**Objectif** : Automatiser tâches répétitives via triggers PostgreSQL.

#### Tâche 4.1 : Trigger Auto-Link Credit Note → Return

**Fichier** : `supabase/migrations/20260217000001_trigger_link_credit_note_to_return.sql`

```sql
-- Quand avoir créé avec related_return_id → Marquer return.status='completed'
CREATE OR REPLACE FUNCTION link_credit_note_to_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.is_credit_note = true AND NEW.related_return_id IS NOT NULL THEN
    -- Update return status et credit_note_id
    UPDATE returns
    SET
      status = 'completed',
      credit_note_id = NEW.id,
      completed_at = NOW(),
      completed_by = NEW.created_by
    WHERE id = NEW.related_return_id
      AND status = 'inspected'; -- Seulement si déjà inspecté
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_credit_note_created
  AFTER INSERT ON financial_documents
  FOR EACH ROW
  WHEN (NEW.is_credit_note = true AND NEW.related_return_id IS NOT NULL)
  EXECUTE FUNCTION link_credit_note_to_return();
```

#### Tâche 4.2 : Trigger Auto-Create Stock Movement après Inspection

**Fichier** : `supabase/migrations/20260217000002_trigger_auto_stock_movement_on_inspection.sql`

```sql
-- Option : Créer mouvement stock automatiquement après inspection
-- (Ou laisser manuel via UI, selon préférence métier)

CREATE OR REPLACE FUNCTION create_stock_movement_from_return()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
  stock_status_value TEXT;
BEGIN
  -- Seulement si status passe de 'received' à 'inspected'
  IF OLD.status = 'received' AND NEW.status = 'inspected' THEN

    -- Déterminer stock_status selon inspection_result
    stock_status_value := CASE NEW.inspection_result
      WHEN 'resellable' THEN 'sellable'
      WHEN 'damaged_repairable' THEN 'quarantine'
      WHEN 'damaged_scrap' THEN 'damaged'
      ELSE 'quarantine'
    END;

    -- Pour chaque item du retour, créer mouvement stock
    FOR item IN
      SELECT * FROM return_items WHERE return_id = NEW.id
    LOOP
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        stock_status,
        reference_type,
        reference_id,
        reason_code,
        notes,
        performed_by,
        performed_at
      ) VALUES (
        item.product_id,
        'return',
        item.quantity_received, -- Quantité physiquement reçue
        stock_status_value,
        'return',
        NEW.id,
        'Return ' || NEW.return_number,
        'Inspection: ' || NEW.inspection_result || '. ' || COALESCE(NEW.inspection_notes, ''),
        NEW.inspected_by,
        NOW()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_return_inspected
  AFTER UPDATE ON returns
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'inspected')
  EXECUTE FUNCTION create_stock_movement_from_return();
```

#### Tâche 4.3 : Trigger Update sales_order_items.returned_quantity

**Fichier** : `supabase/migrations/20260217000003_trigger_update_returned_quantity.sql`

```sql
-- Quand return_items.quantity_restocked change → Update sales_order_items.returned_quantity
CREATE OR REPLACE FUNCTION update_sales_order_item_returned_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Si quantity_restocked a changé
  IF NEW.quantity_restocked IS DISTINCT FROM OLD.quantity_restocked THEN
    UPDATE sales_order_items
    SET
      returned_quantity = returned_quantity + (NEW.quantity_restocked - COALESCE(OLD.quantity_restocked, 0)),
      last_return_id = NEW.return_id,
      last_returned_at = NOW()
    WHERE id = NEW.sales_order_item_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER after_return_item_restocked
  AFTER UPDATE ON return_items
  FOR EACH ROW
  WHEN (NEW.quantity_restocked IS DISTINCT FROM OLD.quantity_restocked)
  EXECUTE FUNCTION update_sales_order_item_returned_quantity();
```

**Livrable Phase 4** :

- ✅ 3 triggers créés et testés
- ✅ Documentation triggers (commentaires SQL)
- ✅ Tests scénarios complets (create return → approve → receive → inspect → credit note)
- ✅ Vérification cohérence données (returned_quantity, stock_movements, etc.)

---

### **Phase 5 : Métriques & Rapports** (1 jour)

**Objectif** : Créer queries analytiques pour tableaux de bord.

#### Tâche 5.1 : Query CA Net (après retours)

**Fichier** : `apps/back-office/src/lib/queries/analytics-revenue.ts`

```sql
-- CA Brut vs CA Net (après retours)
SELECT
  DATE_TRUNC('month', document_date) AS month,
  SUM(CASE WHEN is_credit_note = false THEN total_ttc ELSE 0 END) AS ca_brut,
  SUM(CASE WHEN is_credit_note = true THEN ABS(total_ttc) ELSE 0 END) AS montant_retours,
  SUM(CASE WHEN is_credit_note = false THEN total_ttc ELSE -total_ttc END) AS ca_net,
  ROUND(
    SUM(CASE WHEN is_credit_note = true THEN ABS(total_ttc) ELSE 0 END) /
    NULLIF(SUM(CASE WHEN is_credit_note = false THEN total_ttc ELSE 0 END), 0) * 100,
    2
  ) AS taux_retour_pct
FROM financial_documents
WHERE document_type IN ('invoice', 'credit_note')
  AND status = 'finalized'
  AND document_date >= '2026-01-01'
GROUP BY DATE_TRUNC('month', document_date)
ORDER BY month DESC;
```

#### Tâche 5.2 : Query Taux Retour par Produit

```sql
-- Top 10 produits avec le plus de retours
SELECT
  p.id,
  p.sku,
  p.name,
  COUNT(DISTINCT ri.return_id) AS nb_retours,
  SUM(ri.quantity_returned) AS qty_totale_retournee,
  SUM(soi.quantity) AS qty_totale_vendue,
  ROUND(
    SUM(ri.quantity_returned)::numeric / NULLIF(SUM(soi.quantity), 0) * 100,
    2
  ) AS taux_retour_pct,
  STRING_AGG(DISTINCT r.return_reason, ', ') AS motifs_retours
FROM return_items ri
JOIN returns r ON r.id = ri.return_id
JOIN products p ON p.id = ri.product_id
JOIN sales_order_items soi ON soi.id = ri.sales_order_item_id
WHERE r.status IN ('completed', 'inspected')
  AND r.created_at >= '2026-01-01'
GROUP BY p.id, p.sku, p.name
ORDER BY nb_retours DESC
LIMIT 10;
```

#### Tâche 5.3 : Query Répartition Motifs Retours

```sql
-- Répartition motifs retours (pour identifier problèmes qualité)
SELECT
  return_reason,
  COUNT(*) AS nb_retours,
  SUM(CASE WHEN inspection_result = 'resellable' THEN 1 ELSE 0 END) AS nb_resellable,
  SUM(CASE WHEN inspection_result = 'damaged_scrap' THEN 1 ELSE 0 END) AS nb_damaged,
  ROUND(
    SUM(CASE WHEN inspection_result = 'resellable' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100,
    2
  ) AS pct_resellable
FROM returns
WHERE status IN ('inspected', 'completed')
  AND created_at >= '2026-01-01'
GROUP BY return_reason
ORDER BY nb_retours DESC;
```

#### Tâche 5.4 : Query Délai Moyen Traitement Retour

```sql
-- KPI : Délai moyen entre demande et avoir créé
SELECT
  AVG(EXTRACT(EPOCH FROM (completed_at - requested_at)) / 86400) AS avg_days_to_complete,
  AVG(EXTRACT(EPOCH FROM (approved_at - requested_at)) / 86400) AS avg_days_to_approve,
  AVG(EXTRACT(EPOCH FROM (received_at - approved_at)) / 86400) AS avg_days_to_receive,
  AVG(EXTRACT(EPOCH FROM (inspected_at - received_at)) / 86400) AS avg_days_to_inspect,
  AVG(EXTRACT(EPOCH FROM (completed_at - inspected_at)) / 86400) AS avg_days_to_credit_note
FROM returns
WHERE status = 'completed'
  AND created_at >= '2026-01-01';
```

#### Tâche 5.5 : Dashboard Page

**Fichier** : `apps/back-office/src/app/(protected)/retours/analytics/page.tsx`

```typescript
// Page dashboard avec :
// - KPIs : Nb retours, Taux retour global, Délai moyen traitement
// - Chart : CA Brut vs CA Net (par mois)
// - Chart : Top 10 produits retournés
// - Chart : Répartition motifs retours (pie chart)
// - Table : Retours en cours par étape (requested, approved, received, inspected)
```

**Livrable Phase 5** :

- ✅ 4+ queries analytiques créées
- ✅ Dashboard page `/retours/analytics`
- ✅ Charts (Recharts ou Chart.js)
- ✅ Export CSV/Excel (optionnel)

---

## 📊 Queries & Métriques

### Queries Essentielles

#### 1. Lister retours avec détails complets

```sql
SELECT
  r.id,
  r.return_number,
  r.status,
  r.return_reason,
  r.inspection_result,
  r.created_at,
  o.legal_name AS customer_name,
  so.order_number AS sales_order_number,
  fn.document_number AS invoice_number,
  cn.document_number AS credit_note_number,
  cn.total_ttc AS credit_note_amount,
  COUNT(ri.id) AS nb_items,
  SUM(ri.quantity_requested) AS qty_requested,
  SUM(ri.quantity_approved) AS qty_approved,
  SUM(ri.quantity_received) AS qty_received,
  SUM(ri.quantity_restocked) AS qty_restocked
FROM returns r
JOIN organisations o ON o.id = r.customer_id
JOIN sales_orders so ON so.id = r.sales_order_id
LEFT JOIN financial_documents fn ON fn.id = r.invoice_id
LEFT JOIN financial_documents cn ON cn.id = r.credit_note_id
LEFT JOIN return_items ri ON ri.return_id = r.id
WHERE r.created_at >= '2026-01-01'
GROUP BY r.id, o.legal_name, so.order_number, fn.document_number, cn.document_number, cn.total_ttc
ORDER BY r.created_at DESC;
```

#### 2. Vérifier cohérence stock (sellable vs damaged)

```sql
-- Stock vendable vs endommagé par produit
SELECT
  p.sku,
  p.name,
  SUM(CASE WHEN sm.stock_status = 'sellable' THEN sm.quantity_change ELSE 0 END) AS stock_sellable,
  SUM(CASE WHEN sm.stock_status = 'damaged' THEN sm.quantity_change ELSE 0 END) AS stock_damaged,
  SUM(CASE WHEN sm.stock_status IN ('lost', 'expired') THEN sm.quantity_change ELSE 0 END) AS stock_lost,
  SUM(sm.quantity_change) AS stock_total
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
WHERE sm.movement_type = 'return'
  AND sm.performed_at >= '2026-01-01'
GROUP BY p.id, p.sku, p.name
HAVING SUM(sm.quantity_change) > 0
ORDER BY stock_damaged DESC;
```

#### 3. Retours sans avoir créé (anomalie)

```sql
-- Retours complétés mais sans avoir (vérification intégrité)
SELECT
  r.id,
  r.return_number,
  r.status,
  r.completed_at,
  r.credit_note_id
FROM returns r
WHERE r.status = 'completed'
  AND r.credit_note_id IS NULL
  AND r.completed_at >= '2026-01-01'
ORDER BY r.completed_at DESC;
```

#### 4. Clients avec taux retour élevé

```sql
-- Top 10 clients par taux de retour (pour identifier problèmes récurrents)
SELECT
  o.id,
  o.legal_name,
  COUNT(DISTINCT so.id) AS nb_commandes,
  COUNT(DISTINCT r.id) AS nb_retours,
  ROUND(COUNT(DISTINCT r.id)::numeric / NULLIF(COUNT(DISTINCT so.id), 0) * 100, 2) AS taux_retour_pct,
  STRING_AGG(DISTINCT r.return_reason, ', ') AS motifs_frequents
FROM organisations o
JOIN sales_orders so ON so.customer_id = o.id
LEFT JOIN returns r ON r.sales_order_id = so.id
WHERE so.created_at >= '2026-01-01'
GROUP BY o.id, o.legal_name
HAVING COUNT(DISTINCT r.id) > 0
ORDER BY taux_retour_pct DESC
LIMIT 10;
```

### KPIs Clés

| KPI                        | Query                                                          | Objectif                       |
| -------------------------- | -------------------------------------------------------------- | ------------------------------ |
| **Taux retour global**     | `COUNT(returns) / COUNT(sales_orders) * 100`                   | <5% (industrie e-commerce)     |
| **Taux resellable**        | `COUNT(inspection_result='resellable') / COUNT(returns) * 100` | >70% (minimiser pertes)        |
| **Délai moyen traitement** | `AVG(completed_at - requested_at)`                             | <7 jours (satisfaction client) |
| **CA Net / CA Brut**       | `SUM(invoices - credit_notes) / SUM(invoices)`                 | >95% (impact limité)           |
| **Coût retours / CA**      | `SUM(credit_notes + frais_transport) / SUM(invoices)`          | <3% (rentabilité)              |

---

## 🔄 Migration Données Existantes

### Étape 1 : Migrer 8 Avoirs Historiques (AV-25-001 à AV-25-008)

**Contexte** : 8 avoirs déjà créés dans `sales_orders` avec montants négatifs (voir début session).

**Actions** :

```sql
-- 1. Créer financial_documents (avoirs) depuis sales_orders négatifs
INSERT INTO financial_documents (
  document_type,
  document_number,
  document_date,
  partner_id,
  partner_type,
  related_sales_order_id, -- Lien vers commande origine (à trouver manuellement)
  is_credit_note,
  credit_note_reason,
  total_ht,
  total_ttc,
  tva_amount,
  status,
  notes,
  created_by
)
SELECT
  'credit_note',
  order_number, -- AV-25-001, etc.
  order_date,
  customer_id,
  customer_type,
  NULL, -- TODO: Retrouver commande origine via matching client + date
  true,
  CASE
    WHEN notes ILIKE '%retour produit%' THEN 'product_return'
    WHEN notes ILIKE '%frais%livraison%' THEN 'shipping_refund'
    ELSE 'other'
  END,
  total_ht,
  total_ttc,
  total_ttc - total_ht,
  'finalized', -- Déjà validés
  notes,
  created_by
FROM sales_orders
WHERE order_number LIKE 'AV-25-%'
  AND total_ht < 0;

-- 2. Créer returns (RMA) pour avoirs avec retour produit (AV-25-004, AV-25-006)
-- TODO: Créer manuellement ou via script si assez d'infos (voir notes)

-- 3. Supprimer anciens sales_orders négatifs (APRÈS vérification migration OK)
-- DELETE FROM sales_orders WHERE order_number LIKE 'AV-25-%' AND total_ht < 0;
```

**Attention** : Vérifier manuellement chaque avoir avant suppression sales_orders.

### Étape 2 : Identifier Commandes avec Retours Non Tracés

**Query détection** :

```sql
-- Détecter commandes avec probable retour (montant TTC facturé != montant payé)
SELECT
  so.id,
  so.order_number,
  so.total_ttc AS commande_ttc,
  fd.total_ttc AS facture_ttc,
  so.paid_amount,
  CASE
    WHEN so.paid_amount < so.total_ttc * 0.9 THEN 'POSSIBLE_RETURN'
    ELSE 'OK'
  END AS status_check
FROM sales_orders so
JOIN financial_documents fd ON fd.sales_order_id = so.id
WHERE fd.document_type = 'invoice'
  AND fd.status = 'finalized'
  AND so.paid_amount IS NOT NULL
  AND so.paid_amount < so.total_ttc * 0.9 -- 10% de différence
ORDER BY so.order_date DESC;
```

**Action** : Vérifier manuellement ces commandes et créer returns si nécessaire.

---

## ✅ Checklist Validation

### Pre-Implementation Checklist

- [ ] Romeo valide Option B (Professionnelle)
- [ ] Équipe formée sur nouveau workflow retours
- [ ] Templates emails créés (return requested, approved, credit note created)
- [ ] Tests unitaires définis pour toutes les routes API
- [ ] Design UI validé (wireframes/maquettes)

### Phase 1 : Base de Données

- [ ] Migrations SQL créées (4 fichiers)
- [ ] Tables `returns` + `return_items` créées
- [ ] Colonnes ajoutées sur tables existantes
- [ ] RLS policies actives et testées
- [ ] Fonctions helper testées (`generate_return_number`, `calculate_credit_note_amount`)
- [ ] Indexes créés pour performance
- [ ] Backup DB avant application migrations

### Phase 2 : Backend API

- [ ] Routes API créées et documentées (Swagger/OpenAPI)
- [ ] Validation Zod sur tous inputs
- [ ] Error handling standard (try/catch, logs)
- [ ] Tests Postman/Thunder Client pour toutes routes
- [ ] Server actions créés (alternative RSC)
- [ ] Notifications emails configurées (SendGrid, Resend, etc.)

### Phase 3 : UI Back-Office

- [ ] Page `/retours` avec tabs (demandes, réceptions, inspections, historique)
- [ ] Page `/retours/[id]` détail retour
- [ ] Modals créer retour (depuis commande, depuis facture)
- [ ] Forms workflow (approve, receive, inspect, credit note)
- [ ] Composants réutilisables (badges, timeline, etc.)
- [ ] Intégration pages commandes/factures
- [ ] Tests manuels tous workflows (end-to-end)
- [ ] Tests responsive (mobile, tablet)

### Phase 4 : Automatisations

- [ ] Trigger link credit note → return testé
- [ ] Trigger auto stock movement testé
- [ ] Trigger update returned_quantity testé
- [ ] Tests scénarios complets (création → completion)
- [ ] Vérification cohérence données (logs, audits)

### Phase 5 : Métriques

- [ ] Queries analytiques créées
- [ ] Dashboard `/retours/analytics` fonctionnel
- [ ] Charts affichés correctement
- [ ] Export CSV/Excel (optionnel)
- [ ] KPIs validés par Romeo

### Post-Implementation Checklist

- [ ] Migration 8 avoirs historiques complétée
- [ ] Documentation utilisateur créée (Wiki/Notion)
- [ ] Formation équipe (2h session)
- [ ] Tests en production (1 semaine pilote)
- [ ] Feedback équipe collecté + ajustements
- [ ] Monitoring erreurs (Sentry, logs)

---

## 📚 Références & Sources

### Documentation ERP (Best Practices)

1. **Odoo Returns & Refunds** : [https://www.odoo.com/documentation/19.0/applications/sales/sales/products_prices/returns.html](https://www.odoo.com/documentation/19.0/applications/sales/sales/products_prices/returns.html)
   - Workflow standard : Reverse Transfer + Credit Note
   - Pattern 3 entités : Return Order, Stock Movement, Credit Note

2. **NetSuite Returns Management** : [https://www.netsuite.com/portal/products/erp/order-management/returns-management.shtml](https://www.netsuite.com/portal/products/erp/order-management/returns-management.shtml)
   - RMA (Return Merchandise Authorization)
   - Inspection qualité + Restock automation

3. **ERPAG Credit Note Guide** : [https://www.erpag.com/news/understanding-erpag-credit-note-management-a-comprehensive-guide](https://www.erpag.com/news/understanding-erpag-credit-note-management-a-comprehensive-guide)
   - Lien avoir ↔ facture origine
   - Traçabilité comptable

4. **Datix RMA with ERP** : [https://datixinc.com/blog/return-merchandise-authorization-with-erp/](https://datixinc.com/blog/return-merchandise-authorization-with-erp/)
   - Workflow multi-étapes
   - Validation approvals

### Accounting & Inventory

5. **Sales Returns Accounting** : [https://www.patriotsoftware.com/blog/accounting/purchase-returns-and-allowances/](https://www.patriotsoftware.com/blog/accounting/purchase-returns-and-allowances/)
   - Impact comptable retours
   - Debit Inventory, Credit COGS

6. **Stock Adjustments Best Practices** : [https://www.fastercapital.com/content/Stock-Adjustments--Adjusting-Your-Way-to-Accuracy--The-Importance-of-Stock-Adjustments-in-Accounting.html](https://www.fastercapital.com/content/Stock-Adjustments--Adjusting-Your-Way-to-Accuracy--The-Importance-of-Stock-Adjustments-in-Accounting.html)
   - Traçabilité mouvements stock
   - Valuation inventory (FIFO, LIFO, Average Cost)

### ERP Features 2026

7. **Top ERP Features 2026** : [https://bizowie.com/top-erp-features-every-manufacturer-needs-in-2026](https://bizowie.com/top-erp-features-every-manufacturer-needs-in-2026)
   - Real-time inventory tracking
   - Automated workflows
   - Advanced analytics

8. **ERP Inventory Management** : [https://www.shopify.com/enterprise/blog/erp-inventory-management](https://www.shopify.com/enterprise/blog/erp-inventory-management)
   - Lot/Serial number traceability
   - Multi-location support
   - Cycle counting workflows

### Retailer Best Practices

9. **Manage Product Returns for Retailers** : [https://smallbiztrends.com/manage-returns/](https://smallbiztrends.com/manage-returns/)
   - Customer-friendly return policies
   - Data-driven return analysis
   - Reduce return rates through quality control

### Microsoft Dynamics (Reference)

10. **Dynamics 365 Sales Returns** : [https://learn.microsoft.com/en-us/dynamics365/supply-chain/sales-marketing/sales-returns](https://learn.microsoft.com/en-us/dynamics365/supply-chain/sales-marketing/sales-returns)
    - Return order creation
    - Credit note generation
    - Inventory reversal

---

## 📝 Notes Complémentaires

### Évolutions Futures (Phase 2)

1. **Échange Produit** (au lieu de remboursement)
   - `refund_method = 'exchange'`
   - Créer nouvelle commande liée au retour
   - Pas d'avoir, mais nouvelle facture

2. **Crédit Magasin** (Store Credit)
   - Table `customer_credits`
   - Créditer montant retour sur compte client
   - Déduire lors prochaine commande

3. **Retours Fournisseurs** (Return to Supplier)
   - Table `supplier_returns`
   - Workflow similaire mais inverse (client = nous, fournisseur = eux)
   - Lien vers `purchase_orders`

4. **Photos Retours** (Preuve Qualité)
   - Table `return_photos`
   - Upload photos lors réception
   - Preuve litige client/fournisseur

5. **Transporteur Retour** (Label Auto)
   - Intégration API transporteur (Colissimo, UPS, etc.)
   - Génération étiquette retour automatique
   - Tracking retour en temps réel

6. **Analytics Avancés**
   - ML : Prédiction taux retour par produit (avant achat fournisseur)
   - Clustering : Groupes clients à risque retours élevés
   - Alertes : Produit défectueux détecté (>10% retours)

### Questions Ouvertes (À Clarifier avec Romeo)

1. **Approbation retours** : Automatique (toujours approved) ou manuel (staff review) ?
2. **Frais retour** : Client paie transport retour ou Verone ?
3. **Délai retour** : Accepter retours jusqu'à combien de jours après livraison ? (14j, 30j, 60j ?)
4. **Produits non-retournables** : Certaines catégories exclues (ex: produits personnalisés) ?
5. **Restocking fee** : Frais de restockage (ex: 10% du montant) ou gratuit ?
6. **Partial returns** : Client peut retourner 1 produit sur 10 d'une commande ? (Oui selon Option B)
7. **Inspection** : Qui fait l'inspection ? Équipe dédiée ou warehouse staff ?
8. **Avoir automatique** : Générer avoir dès inspection OK, ou attendre validation comptable ?

---

**Fin du Plan**

Ce document sera mis à jour au fur et à mesure de l'implémentation. Toutes les décisions techniques et architecturales sont basées sur les best practices ERP 2026 et adaptées au contexte Verone.

**Prochaine étape** : Validation Romeo → Phase 1 (Migrations DB)
