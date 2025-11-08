# Hooks Sourcing - Documentation

**Module** : Produits → Sourcing
**Date** : 2025-10-27

---

## 📋 Hook Principal

### `useSourcingProducts(filters?)`

Hook CRUD pour gestion produits en sourcing avec filtres avancés.

#### Signature TypeScript

```typescript
interface SourcingFilters {
  search?: string; // Recherche nom/SKU
  status?: string; // Statut (défaut: 'sourcing')
  sourcing_type?: 'interne' | 'client'; // Type sourcing
  supplier_id?: string; // Filtrer par fournisseur
  assigned_client_id?: string; // Filtrer par client assigné
  has_supplier?: boolean; // Fournisseur défini ?
  requires_sample?: boolean; // Échantillon requis ?
}

interface SourcingProduct {
  id: string;
  sku: string;
  name: string;
  supplier_page_url: string | null;
  cost_price: number | null;
  margin_percentage?: number;
  status: string;
  supplier_id: string | null;
  supplier?: Organisation;
  creation_mode: string;
  sourcing_type?: 'interne' | 'client';
  requires_sample: boolean;
  assigned_client_id: string | null;
  assigned_client?: Organisation;
  created_at: string;
  updated_at: string;
  estimated_selling_price?: number;
  main_image_url?: string;
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

#### Tables Accédées

```sql
-- Query principale
SELECT
  p.*,
  s.id, s.legal_name, s.trade_name, s.type, s.website,
  c.id, c.legal_name, c.trade_name, c.type,
  pi.public_url, pi.is_primary
FROM products p
LEFT JOIN organisations s ON p.supplier_id = s.id
LEFT JOIN organisations c ON p.assigned_client_id = c.id
LEFT JOIN product_images pi ON pi.product_id = p.id
WHERE p.status = 'sourcing'
  AND p.creation_mode = 'sourcing'
ORDER BY p.created_at DESC
```

#### Actions

##### `createSourcingProduct(data)`

Crée un nouveau produit en mode sourcing.

```typescript
const createSourcingProduct = async (data: SourcingFormData) => {
  const productData = {
    name: data.name,
    supplier_page_url: data.supplier_page_url,
    cost_price: data.cost_price,
    creation_mode: 'sourcing',
    status: 'sourcing',
    sourcing_type: data.sourcing_type || 'interne',
    requires_sample: data.requires_sample || false,
    assigned_client_id: data.assigned_client_id,
    margin_percentage: data.margin_percentage,
    completion_percentage: 30, // Auto calculé
  };

  const { data: product, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) throw error;

  toast.success('✅ Produit en sourcing créé');
  refetch();
  return product;
};
```

##### `validateSourcing(id)`

Valide un produit sourcing au catalogue.

```typescript
const validateSourcing = async (productId: string) => {
  // 1. Mettre à jour produit
  const { error: updateError } = await supabase
    .from('products')
    .update({
      status: 'in_stock',
      stock_real: 1,
      completion_percentage: 100,
      creation_mode: 'complete',
    })
    .eq('id', productId);

  if (updateError) throw updateError;

  // 2. Créer mouvement stock
  await supabase.from('stock_movements').insert([
    {
      product_id: productId,
      movement_type: 'sourcing_validation',
      quantity_change: 1,
      quantity_before: 0,
      quantity_after: 1,
      affects_forecast: false,
      reason_code: 'sourcing_completed',
      notes: 'Produit validé du sourcing au catalogue',
    },
  ]);

  toast.success('✅ Produit validé au catalogue');
  router.push(`/produits/catalogue/${productId}`);
  return true;
};
```

##### `orderSample(id)`

Commande un échantillon pour produit sourcing.

```typescript
const orderSample = async (productId: string) => {
  const product = products.find(p => p.id === productId);
  if (!product) return null;

  // Créer PO draft pour échantillon
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .insert([
      {
        supplier_id: product.supplier_id,
        status: 'draft',
        notes: `Échantillon sourcing - ${product.name}`,
        delivery_address: 'Back-office Vérone',
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Créer ligne PO
  await supabase.from('purchase_order_items').insert([
    {
      purchase_order_id: po.id,
      product_id: productId,
      quantity: 1,
      unit_price: product.cost_price,
    },
  ]);

  toast.success('✅ Échantillon commandé');
  router.push(`/achats/commandes/${po.id}`);
  return po;
};
```

#### Exemple d'Utilisation

```typescript
import { useSourcingProducts } from '@/hooks/use-sourcing-products'

export default function SourcingProductsPage() {
  const [filters, setFilters] = useState<SourcingFilters>({
    sourcing_type: undefined,
    requires_sample: undefined
  })

  const {
    products,
    loading,
    error,
    refetch,
    createSourcingProduct,
    validateSourcing,
    orderSample
  } = useSourcingProducts(filters)

  // Créer sourcing rapide
  const handleCreate = async () => {
    await createSourcingProduct({
      name: 'Fauteuil Sourcing Test',
      supplier_page_url: 'https://supplier.com/product',
      cost_price: 150,
      sourcing_type: 'interne'
    })
  }

  // Valider au catalogue
  const handleValidate = async (productId: string) => {
    if (!confirm('Valider ce produit au catalogue ?')) return
    await validateSourcing(productId)
  }

  // Commander échantillon
  const handleOrderSample = async (productId: string) => {
    await orderSample(productId)
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div>
      <h1>Produits en Sourcing ({products.length})</h1>

      <SourcingFilters filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-3 gap-4">
        {products.map(product => (
          <SourcingProductCard
            key={product.id}
            product={product}
            onValidate={() => handleValidate(product.id)}
            onOrderSample={() => handleOrderSample(product.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 📚 Ressources

- **README Sourcing** : `./README.md`
- **Composants** : `./components.md`
- **Workflows** : `./workflows.md`

---

**Dernière Mise à Jour** : 2025-10-27
