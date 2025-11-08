# Sourcing Produits

**Module** : Produits → Sourcing
**Status** : ✅ PRODUCTION READY
**Date Validation** : 2025-10-27

---

## 📊 Vue d'Ensemble

Le **Sourcing** est le module de recherche et validation de nouveaux produits. Il permet de :

- Créer rapidement des produits en mode "sourcing" (3 champs minimum)
- Gérer les sourcing internes (exploration catalogue)
- Gérer les sourcing clients (demandes spécifiques)
- Commander des échantillons
- Valider les produits au catalogue après tests

**Workflow complet** : Sourcing → Échantillon (optionnel) → Tests → Validation → Catalogue

---

## ✅ Features Validées

### Création Rapide

- ✅ **Formulaire simplifié** : 3 champs obligatoires uniquement
  - Nom produit
  - URL page fournisseur
  - Prix achat HT
- ✅ **Modal QuickSourcing** : Création depuis liste produits
- ✅ **Auto-completion** : completion_percentage = 30% auto
- ✅ **Status protection** : Trigger préserve status='sourcing'

### Types Sourcing

- ✅ **Sourcing Interne** : Exploration catalogue fournisseurs
- ✅ **Sourcing Client** : Demande client spécifique
  - assigned_client_id (FK organisations)
  - Lien direct avec consultation client

### Gestion Échantillons

- ✅ **Flag requires_sample** : Indique si échantillon nécessaire
- ✅ **Commande échantillon** : Génère PO draft automatique
  - Quantité : 1 unité
  - Livraison : Adresse back-office
  - Notes : "Échantillon sourcing"

### Validation

- ✅ **Validation au catalogue** : Bouton action
  - Met à jour status → 'in_stock'
  - Définit stock_real = 1
  - completion_percentage = 100
  - Crée mouvement stock (sourcing_validation)
- ✅ **Redirection automatique** : /produits/catalogue/[id]

---

## 📁 Pages & Routes

### `/produits/sourcing/produits` - Liste Sourcing

**Fichier** : `src/app/produits/sourcing/produits/page.tsx`

**Features** :

- Liste produits en sourcing (status='sourcing')
- Filtres : Type sourcing, Fournisseur, Client assigné
- Actions : Nouveau sourcing, Valider, Commander échantillon
- Statistiques : Total sourcing, Internes, Clients, Avec échantillon

**Composants** :

- `QuickSourcingModal` : Création rapide
- `SourcingProductCard` : Card produit sourcing
- `SourcingFilters` : Barre filtres

**Colonnes affichées** :

- Image
- Nom produit
- Fournisseur
- Type sourcing (interne/client)
- Client assigné (si applicable)
- Prix achat HT
- Échantillon requis ?
- Date création
- Actions (Valider, Échantillon, Éditer)

---

### `/produits/sourcing/produits/[id]` - Détail Sourcing

**Fichier** : `src/app/produits/sourcing/produits/[id]/page.tsx`

**Sections** :

1. **Informations Sourcing** :
   - Nom, SKU, Status
   - URL page fournisseur (lien externe)
   - Type sourcing (interne/client)
   - Client assigné (si applicable)
   - Date création

2. **Fournisseur** :
   - Nom fournisseur
   - URL page produit
   - Contact fournisseur

3. **Prix** :
   - Prix achat HT
   - Marge cible %
   - Prix vente estimé (calculé)

4. **Échantillon** :
   - Échantillon requis ? (checkbox)
   - Bouton "Commander échantillon"
   - Historique commandes échantillon

5. **Images** (Optionnel) :
   - Upload images
   - Captures écran page fournisseur

**Actions** :

- Modifier informations
- Commander échantillon
- Valider au catalogue
- Archiver sourcing

---

### `/produits/sourcing/produits/create` - Création Sourcing

**Fichier** : `src/app/produits/sourcing/produits/create/page.tsx`

**Formulaire Complet** (vs modal simplifiée) :

- Nom produit (REQUIRED)
- URL page fournisseur (REQUIRED)
- Prix achat HT (REQUIRED)
- Fournisseur (SupplierSelector)
- Type sourcing (radio: interne/client)
- Client assigné (si client)
- Échantillon requis ? (checkbox)
- Marge cible %
- Notes internes

---

## 🎯 Hooks Sourcing

### `useSourcingProducts(filters?)`

Hook principal CRUD sourcing avec filtres avancés.

**Signature** :

```typescript
interface SourcingFilters {
  search?: string;
  status?: string;
  sourcing_type?: 'interne' | 'client';
  supplier_id?: string;
  assigned_client_id?: string;
  has_supplier?: boolean;
  requires_sample?: boolean;
}

function useSourcingProducts(filters?: SourcingFilters): {
  products: SourcingProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createSourcingProduct: (
    data: SourcingFormData
  ) => Promise<SourcingProduct | null>;
  validateSourcing: (id: string) => Promise<boolean>;
  orderSample: (id: string) => Promise<PurchaseOrder | null>;
};
```

**Tables accédées** :

- products (WHERE status='sourcing')
- organisations (JOIN supplier + assigned_client)
- product_images (LEFT JOIN)

---

## 🧩 Composants Sourcing

### `QuickSourcingModal`

Modal **création rapide** depuis liste sourcing.

**Props** :

```typescript
interface QuickSourcingModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

**Utilise** : `SourcingQuickForm` interne

---

### `SourcingQuickForm`

Formulaire **3 champs minimum** pour sourcing rapide.

**Props** :

```typescript
interface SourcingQuickFormProps {
  onSuccess?: (productId: string) => void;
  onCancel?: () => void;
  showHeader?: boolean;
}
```

**Champs** :

- Nom produit (input text)
- URL page fournisseur (input url)
- Prix achat HT (input number)

**Validation** :

- Nom : min 3 caractères
- URL : format URL valide
- Prix : > 0

**Soumission** :

```typescript
const productData = {
  name,
  supplier_page_url: url,
  cost_price: parseFloat(price),
  creation_mode: 'sourcing',
  status: 'sourcing',
  requires_sample: false,
};

await createSourcingProduct(productData);
```

---

### `EditSourcingProductModal`

Modal **édition produit sourcing** avec tous champs.

**Props** :

```typescript
interface EditSourcingProductModalProps {
  open: boolean;
  onClose: () => void;
  product: SourcingProduct;
  onUpdate?: () => void;
}
```

**Champs éditables** :

- Nom
- URL fournisseur
- Prix achat HT
- Fournisseur
- Type sourcing
- Client assigné
- Marge cible %
- Échantillon requis ?

---

## 🔄 Workflows Sourcing

### Workflow 1 : Création Sourcing Rapide

```
[/produits/sourcing/produits]
         │
         ├─ Clic "Nouveau Sourcing"
         │
         ▼
┌─────────────────────┐
│ QuickSourcingModal │
└─────────────────────┘
    │ 3 champs :
    │ • Nom
    │ • URL fournisseur
    │ • Prix HT
    │
    ▼
┌─────────────────────┐
│ INSERT products    │
└─────────────────────┘
    creation_mode = 'sourcing'
    status = 'sourcing'
    completion_percentage = 30
    │
    └─ Refresh liste sourcing
```

### Workflow 2 : Commande Échantillon

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
    │
    ▼
┌─────────────────────┐
│ Créer PO Draft     │
└─────────────────────┘
    INSERT purchase_orders (
      supplier_id,
      status = 'draft',
      delivery_address = 'Back-office',
      notes = 'Échantillon sourcing'
    )
    │
    INSERT purchase_order_items (
      product_id,
      quantity = 1,
      unit_price = cost_price
    )
    │
    └─ Redirect /achats/commandes/[po_id]
```

### Workflow 3 : Validation au Catalogue

```
[/produits/sourcing/produits/[id]]
         │
         ├─ Clic "Valider au catalogue"
         │
         ▼
┌─────────────────────┐
│ Confirmation       │
└─────────────────────┘
    │ "Valider ce produit au catalogue ?"
    │
    ▼
┌─────────────────────┐
│ UPDATE products    │
└─────────────────────┘
    status = 'in_stock'
    stock_real = 1
    completion_percentage = 100
    creation_mode = 'complete'
    │
    INSERT stock_movements (
      movement_type = 'sourcing_validation',
      quantity_change = 1
    )
    │
    └─ Redirect /produits/catalogue/[id]
       └─ Toast "✅ Produit validé au catalogue"
```

---

## 🗄️ Database

### Colonnes Spécifiques Sourcing

```sql
-- Table products - Colonnes sourcing
creation_mode VARCHAR       -- 'sourcing' | 'complete' | 'quick'
sourcing_type VARCHAR       -- 'interne' | 'client'
requires_sample BOOLEAN     -- Échantillon nécessaire ?
assigned_client_id UUID     -- FK organisations (si sourcing client)
supplier_page_url TEXT      -- URL page fournisseur
```

### Trigger Protection Statut

```sql
-- Trigger : update_product_stock_status()
-- Exception pour produits sourcing

CREATE OR REPLACE FUNCTION update_product_stock_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Exception : Produits en sourcing ne sont PAS soumis au calcul automatique
  IF NEW.creation_mode = 'sourcing' AND NEW.status = 'sourcing' THEN
    RETURN NEW; -- Ne pas modifier le statut
  END IF;

  -- Pour tous les autres : calculer statut basé sur stock_real
  NEW.status := calculate_stock_status(COALESCE(NEW.stock_real, 0));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Queries Sourcing

```sql
-- Liste produits en sourcing
SELECT
  p.id, p.sku, p.name, p.supplier_page_url,
  p.cost_price, p.margin_percentage,
  p.sourcing_type, p.requires_sample,
  s.trade_name as supplier_name,
  c.trade_name as client_name
FROM products p
LEFT JOIN organisations s ON p.supplier_id = s.id
LEFT JOIN organisations c ON p.assigned_client_id = c.id
WHERE p.status = 'sourcing'
  AND p.creation_mode = 'sourcing'
ORDER BY p.created_at DESC;

-- Sourcing internes uniquement
WHERE p.sourcing_type = 'interne';

-- Sourcing clients uniquement
WHERE p.sourcing_type = 'client';

-- Sourcing nécessitant échantillon
WHERE p.requires_sample = true;
```

---

## 📊 Statistiques Sourcing

### KPIs Affichés

- **Total sourcing** : COUNT(status='sourcing')
- **Sourcing internes** : COUNT(sourcing_type='interne')
- **Sourcing clients** : COUNT(sourcing_type='client')
- **Avec échantillon** : COUNT(requires_sample=true)
- **Échantillons commandés** : COUNT(POs liés)
- **En attente validation** : Produits > 7 jours

### Rapports

- Liste sourcing par fournisseur
- Liste sourcing par client
- Temps moyen sourcing → validation
- Taux conversion échantillon → catalogue

---

## 🧪 Tests Sourcing

### Test E2E Création Sourcing

```typescript
test('Créer produit sourcing via modal rapide', async ({ page }) => {
  await page.goto('/produits/sourcing/produits');

  // Ouvrir modal
  await page.click('button:has-text("Nouveau Sourcing")');

  // Remplir formulaire
  await page.fill('input[name="name"]', 'Test Sourcing Fauteuil');
  await page.fill(
    'input[name="supplier_page_url"]',
    'https://supplier.com/product'
  );
  await page.fill('input[name="cost_price"]', '150');

  // Soumettre
  await page.click('button:has-text("Créer")');

  // Vérifier
  await expect(page.locator('text=Test Sourcing Fauteuil')).toBeVisible();
});
```

### Test Validation Catalogue

```typescript
test('Valider produit sourcing au catalogue', async ({
  page,
  sourcingProductId,
}) => {
  await page.goto(`/produits/sourcing/produits/${sourcingProductId}`);

  // Clic valider
  await page.click('button:has-text("Valider au catalogue")');

  // Confirmation
  await page.click('button:has-text("Confirmer")');

  // Vérifier redirection
  await expect(page).toHaveURL(`/produits/catalogue/${sourcingProductId}`);

  // Vérifier toast
  await expect(page.locator('text=Produit validé au catalogue')).toBeVisible();
});
```

---

## 📊 Performance

**SLOs** :

- ✅ Liste sourcing : <2s
- ✅ Création sourcing rapide : <1.5s
- ✅ Validation catalogue : <2s
- ✅ Commande échantillon : <3s

---

## 🔗 Intégrations

### Avec Catalogue

- Validation sourcing → Création produit catalogue
- Transfert données (nom, prix, images, fournisseur)
- Préservation SKU et ID

### Avec Achats

- Commande échantillon → Création PO draft
- Lien PO ↔ Produit sourcing
- Suivi réception échantillon

### Avec CRM (Clients)

- Sourcing client → Lien consultation
- assigned_client_id → Organisations
- Notifications client (validation)

---

## 🔗 Liens Utiles

- [Hooks Documentation](./hooks.md)
- [Composants](./components.md)
- [Workflows](./workflows.md)
- [Catalogue Module](../catalogue/README.md)

---

**Dernière Mise à Jour** : 2025-10-27
**Mainteneur** : Vérone Dev Team
