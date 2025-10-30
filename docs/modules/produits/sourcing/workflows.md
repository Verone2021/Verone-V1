# Workflows Sourcing - Documentation

**Module** : Produits → Sourcing
**Date** : 2025-10-27

---

## 📋 Workflows Disponibles

1. Création Sourcing Rapide (3 champs)
2. Commande Échantillon
3. Validation au Catalogue
4. Sourcing Client (avec assignation)

---

## 1️⃣ Workflow Création Sourcing Rapide

### Diagramme

```
[/produits/sourcing/produits]
         │
         ├─ Clic "Nouveau Sourcing"
         │
         ▼
┌─────────────────────┐
│ QuickSourcingModal │
└─────────────────────┘
    │ Formulaire 3 champs :
    │ • Nom produit (REQUIRED)
    │ • URL fournisseur (REQUIRED)
    │ • Prix HT (REQUIRED)
    │
    ├─ Validation :
    │  ✓ Nom min 3 caractères
    │  ✓ URL format valide
    │  ✓ Prix > 0
    │
    ▼
┌─────────────────────┐
│ INSERT products    │
└─────────────────────┘
    INSERT products (
      name,
      supplier_page_url,
      cost_price,
      creation_mode = 'sourcing',
      status = 'sourcing',
      completion_percentage = 30
    )
    │
    ├─ Trigger : generate_product_sku()
    │  └─ SKU auto = PRD-XXXX
    │
    └─ Refresh liste
       └─ Toast "✅ Produit en sourcing créé"
```

### Code Exemple

```typescript
const handleCreateSourcing = async () => {
  const data = {
    name: 'Fauteuil Vintage Bleu',
    supplier_page_url: 'https://supplier.com/product/123',
    cost_price: 150
  }

  const product = await createSourcingProduct(data)

  if (product) {
    toast.success('✅ Produit en sourcing créé')
    refetch()
  }
}
```

---

## 2️⃣ Workflow Commande Échantillon

### Diagramme

```
[/produits/sourcing/produits/[id]]
         │
         ├─ Clic "Commander échantillon"
         │
         ▼
┌─────────────────────┐
│ Confirmation       │
└─────────────────────┘
    │ "Commander 1 échantillon ?"
    │ • Fournisseur : {supplier_name}
    │ • Prix : {cost_price}€ HT
    │
    ├─ Si "Confirmer" ▼
    │
┌─────────────────────┐
│ Créer PO Draft     │
└─────────────────────┘
    INSERT purchase_orders (
      supplier_id,
      status = 'draft',
      notes = 'Échantillon sourcing',
      delivery_address = 'Back-office'
    )
    │
    INSERT purchase_order_items (
      purchase_order_id,
      product_id,
      quantity = 1,
      unit_price = cost_price
    )
    │
    └─ Redirect /achats/commandes/[po_id]
       └─ Toast "✅ Échantillon commandé"
```

### Code Exemple

```typescript
const handleOrderSample = async (productId: string) => {
  if (!confirm('Commander 1 échantillon ?')) return

  const po = await orderSample(productId)

  if (po) {
    toast.success('✅ Échantillon commandé')
    router.push(`/achats/commandes/${po.id}`)
  }
}
```

---

## 3️⃣ Workflow Validation au Catalogue

### Diagramme

```
[/produits/sourcing/produits/[id]]
         │
         ├─ Tests échantillon OK
         │
         ├─ Clic "Valider au catalogue"
         │
         ▼
┌─────────────────────┐
│ Confirmation       │
└─────────────────────┘
    │ "Valider ce produit au catalogue ?"
    │ • Définira stock = 1
    │ • Statut = in_stock
    │
    ├─ Si "Confirmer" ▼
    │
┌─────────────────────┐
│ UPDATE products    │
└─────────────────────┘
    UPDATE products SET
      status = 'in_stock',
      stock_real = 1,
      completion_percentage = 100,
      creation_mode = 'complete'
    WHERE id = $1
    │
    ├─ Trigger : update_product_stock_status()
    │  └─ Confirme status = 'in_stock'
    │
    ▼
┌─────────────────────┐
│ INSERT movement    │
└─────────────────────┘
    INSERT stock_movements (
      product_id,
      movement_type = 'sourcing_validation',
      quantity_change = 1,
      quantity_before = 0,
      quantity_after = 1,
      reason_code = 'sourcing_completed'
    )
    │
    └─ Redirect /produits/catalogue/[id]
       └─ Toast "✅ Produit validé au catalogue"
```

### Code Exemple

```typescript
const handleValidate = async (productId: string) => {
  if (!confirm('Valider ce produit au catalogue ?')) return

  const success = await validateSourcing(productId)

  if (success) {
    toast.success('✅ Produit validé au catalogue')
    router.push(`/produits/catalogue/${productId}`)
  }
}
```

---

## 4️⃣ Workflow Sourcing Client

### Diagramme

```
[/consultations/[id]] (Consultation client)
         │
         ├─ Clic "Créer sourcing depuis consultation"
         │
         ▼
┌─────────────────────┐
│ Pre-remplissage    │
└─────────────────────┘
    Formulaire avec :
    • sourcing_type = 'client'
    • assigned_client_id = consultation.client_id
    • name = consultation.product_name
    • notes = consultation.description
    │
    ▼
┌─────────────────────┐
│ INSERT products    │
└─────────────────────┘
    INSERT products (
      ...,
      sourcing_type = 'client',
      assigned_client_id = uuid
    )
    │
    └─ Lien consultation ↔ produit
       └─ Notification client
```

---

## 📊 États Produit Sourcing

### Cycle de Vie

```
┌─────────┐
│ SOURCING│ (status='sourcing')
└────┬────┘
     │
     ├─ Échantillon requis ? → Commander PO
     │
     ├─ Tests échantillon
     │
     ├─ Validation
     │
     ▼
┌─────────┐
│CATALOGUE│ (status='in_stock', stock_real=1)
└─────────┘
```

### Statut Transitions

```sql
-- Création
status = 'sourcing'
creation_mode = 'sourcing'

-- Validation
UPDATE products SET
  status = 'in_stock',
  stock_real = 1,
  creation_mode = 'complete'
WHERE id = $1
```

---

## 📚 Ressources

- **README Sourcing** : `./README.md`
- **Hooks** : `./hooks.md`
- **Composants** : `./components.md`

---

**Dernière Mise à Jour** : 2025-10-27
