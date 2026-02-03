'use client';

import { useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// Interfaces basées sur schémas Supabase réels
interface Supplier {
  id: string;
  legal_name: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  cost_price: number | null;
}

interface SelectedProduct extends Product {
  quantity: number;
}

export default function TestPurchaseOrderPage() {
  const [supplierId, setSupplierId] = useState<string>('');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [showProducts, setShowProducts] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const supabase = createClient();

  const log = (msg: string) => {
    console.warn(msg);
    setLogs(prev => [
      ...prev,
      `${new Date().toISOString().slice(11, 19)} - ${msg}`,
    ]);
  };

  // Charger fournisseurs
  const loadSuppliers = async () => {
    log('📦 Chargement fournisseurs...');
    const { data, error } = await supabase
      .from('organisations')
      .select('id, legal_name')
      .eq('type', 'supplier')
      .eq('is_active', true)
      .order('legal_name')
      .limit(50)
      .returns<Supplier[]>();

    if (error) {
      log(`❌ Erreur: ${error.message}`);
    } else {
      log(`✅ ${data?.length ?? 0} fournisseurs chargés`);
      setSuppliers(data ?? []);
    }
  };

  // Charger produits du fournisseur
  const loadProducts = async () => {
    if (!supplierId) {
      log('⚠️ Pas de fournisseur sélectionné');
      return;
    }
    log(`📦 Chargement produits pour fournisseur ${supplierId}...`);
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('id, name, sku, cost_price')
      .eq('supplier_id', supplierId)
      .limit(20)
      .returns<Product[]>();

    setLoading(false);
    if (error) {
      log(`❌ Erreur produits: ${error.message}`);
    } else {
      log(`✅ ${data?.length ?? 0} produits chargés`);
      setProducts(data ?? []);
    }
  };

  // Toggle modal produits
  const handleShowProducts = () => {
    log(`🔘 Clic bouton - showProducts était: ${showProducts}`);
    setShowProducts(!showProducts);
    if (!showProducts) {
      void loadProducts().catch(error => {
        console.error('[TestPurchaseOrderPage] loadProducts failed:', error);
      });
    }
  };

  // Ajouter produit
  const addProduct = (product: Product) => {
    log(`➕ Ajout produit: ${product.name}`);
    setSelectedProducts(prev => [...prev, { ...product, quantity: 1 }]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        🧪 Test Commande Fournisseur (Minimaliste)
      </h1>

      {/* Logs */}
      <div className="bg-black text-green-400 p-4 rounded mb-6 h-40 overflow-y-auto font-mono text-xs">
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        {logs.length === 0 && (
          <div className="text-gray-500">Logs apparaîtront ici...</div>
        )}
      </div>

      {/* Étape 1: Charger fournisseurs */}
      <div className="border p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Étape 1: Fournisseurs</h2>
        <button
          onClick={() => {
            void loadSuppliers().catch(error => {
              console.error(
                '[TestPurchaseOrderPage] loadSuppliers failed:',
                error
              );
            });
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Charger fournisseurs
        </button>
        <select
          value={supplierId}
          onChange={e => {
            log(`🔄 Fournisseur changé: ${e.target.value}`);
            setSupplierId(e.target.value);
            setSelectedProducts([]); // Reset produits
          }}
          className="border p-2 rounded"
        >
          <option value="">-- Sélectionner --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>
              {s.legal_name}
            </option>
          ))}
        </select>
        <span className="ml-2 text-sm text-gray-500">
          ID: {supplierId ?? 'aucun'}
        </span>
      </div>

      {/* Étape 2: Ajouter produits */}
      <div className="border p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Étape 2: Produits</h2>
        <button
          onClick={handleShowProducts}
          disabled={!supplierId}
          className={`px-4 py-2 rounded mr-2 ${
            supplierId
              ? 'bg-green-500 text-white cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {showProducts ? 'Masquer produits' : 'Afficher produits'}
        </button>
        <span className="text-sm">
          (bouton {supplierId ? 'ACTIF' : 'DÉSACTIVÉ'})
        </span>

        {showProducts && (
          <div className="mt-4 border-t pt-4">
            {loading ? (
              <div>Chargement...</div>
            ) : products.length === 0 ? (
              <div className="text-gray-500">
                Aucun produit pour ce fournisseur
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {products.map(p => (
                  <div
                    key={p.id}
                    className="border p-2 rounded flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">
                        {p.sku} - {p.cost_price}€
                      </div>
                    </div>
                    <button
                      onClick={() => addProduct(p)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                    >
                      +
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Étape 3: Produits sélectionnés */}
      <div className="border p-4 rounded">
        <h2 className="font-bold mb-2">
          Étape 3: Panier ({selectedProducts.length})
        </h2>
        {selectedProducts.length === 0 ? (
          <div className="text-gray-500">Aucun produit sélectionné</div>
        ) : (
          <ul className="space-y-1">
            {selectedProducts.map((p, i) => (
              <li
                key={i}
                className="flex justify-between bg-gray-100 p-2 rounded"
              >
                <span>{p.name}</span>
                <span>{p.cost_price}€</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
