/**
 * Page: Créer une nouvelle sélection LinkMe
 *
 * Workflow:
 * 1. Sélectionner un utilisateur LinkMe → affiche son organisation/enseigne
 * 2. Définir nom et description de la sélection
 * 3. Sélectionner des produits depuis le catalogue général LinkMe
 * 4. Configurer la marge pour chaque produit (jauge tricolore)
 * 5. Créer la sélection
 */

'use client';

import { useState, useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Check, Package } from 'lucide-react';

import {
  useLinkMeCatalogProducts,
  type LinkMeCatalogProduct,
} from '../../hooks/use-linkme-catalog';
import { useLinkMeUsers } from '../../hooks/use-linkme-users';

import { buildNewSelectedProduct } from './new-selection.helpers';
import type { SelectedProduct } from './new-selection.types';
import { NewSelectionCatalog } from './NewSelectionCatalog';
import { NewSelectionHeader } from './NewSelectionHeader';
import { NewSelectionStep1 } from './NewSelectionStep1';
import { ProductConfigCard } from './ProductConfigCard';

export default function NewSelectionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectionName, setSelectionName] = useState('');
  const [selectionDescription, setSelectionDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'active'>('draft');
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: users, isLoading: usersLoading } = useLinkMeUsers();
  const { data: catalogProducts, isLoading: catalogLoading } =
    useLinkMeCatalogProducts();

  const selectedUser = useMemo(() => {
    if (!selectedUserId || !users) return null;
    return users.find(u => u.user_id === selectedUserId) ?? null;
  }, [selectedUserId, users]);

  const eligibleUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(
      u =>
        u.linkme_role === 'organisation_admin' ||
        u.linkme_role === 'enseigne_admin'
    );
  }, [users]);

  const filteredCatalog = useMemo(() => {
    if (!catalogProducts || !selectedUser) return [];
    const orgFiltered = catalogProducts.filter(p => {
      if (!p.is_sourced) return true;
      if (p.enseigne_id && selectedUser.enseigne_id)
        return p.enseigne_id === selectedUser.enseigne_id;
      if (p.assigned_client_id && selectedUser.organisation_id)
        return p.assigned_client_id === selectedUser.organisation_id;
      return false;
    });
    if (!searchQuery.trim()) return orgFiltered;
    const query = searchQuery.toLowerCase();
    return orgFiltered.filter(
      p =>
        p.product_name.toLowerCase().includes(query) ||
        p.product_reference.toLowerCase().includes(query)
    );
  }, [catalogProducts, searchQuery, selectedUser]);

  const selectedProductIds = useMemo(
    () => new Set(selectedProducts.map(p => p.product_id)),
    [selectedProducts]
  );

  const handleAddProduct = (product: LinkMeCatalogProduct) => {
    setSelectedProducts(prev => [
      ...prev,
      buildNewSelectedProduct(product, selectedUser?.default_margin_rate),
    ]);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(p => p.product_id !== productId));
  };

  const handleMarginChange = (productId: string, marginRate: number) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.product_id === productId ? { ...p, margin_rate: marginRate } : p
      )
    );
  };

  const handleCreate = async () => {
    if (!selectedUserId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un utilisateur.',
        variant: 'destructive',
      });
      return;
    }
    if (!selectionName.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez entrer un nom pour la sélection.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedProducts.length === 0) {
      toast({
        title: 'Erreur',
        description: 'Veuillez ajouter au moins un produit.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsCreating(true);
      const response = await fetch('/api/linkme/selections/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          name: selectionName,
          description: selectionDescription ?? null,
          status,
          products: selectedProducts.map(p => ({
            product_id: p.product_id,
            base_price_ht: p.base_price_ht,
            margin_rate: p.margin_rate * 100,
          })),
        }),
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(error.message ?? 'Erreur lors de la création');
      }
      const result = (await response.json()) as { selection: { id: string } };
      toast({
        title: 'Sélection créée',
        description: `La sélection "${selectionName}" a été créée avec succès.`,
      });
      router.push(`/canaux-vente/linkme/selections/${result.selection.id}`);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Impossible de créer la sélection.';
      console.error('Erreur création sélection:', error);
      toast({ title: 'Erreur', description: message, variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NewSelectionHeader
        isCreating={isCreating}
        canCreate={
          !isCreating &&
          !!selectedUserId &&
          !!selectionName &&
          selectedProducts.length > 0
        }
        onCreateClick={() => {
          void handleCreate().catch(error => {
            console.error('[NewSelectionPage] handleCreate failed:', error);
          });
        }}
      />

      <div className="p-6 space-y-6">
        <NewSelectionStep1
          selectedUserId={selectedUserId}
          onUserChange={setSelectedUserId}
          selectionName={selectionName}
          onNameChange={setSelectionName}
          selectionDescription={selectionDescription}
          onDescriptionChange={setSelectionDescription}
          status={status}
          onStatusChange={setStatus}
          usersLoading={usersLoading}
          eligibleUsers={eligibleUsers}
          selectedUser={selectedUser}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewSelectionCatalog
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            catalogLoading={catalogLoading}
            filteredCatalog={filteredCatalog}
            selectedProductIds={selectedProductIds}
            selectedUser={selectedUser}
            onAddProduct={handleAddProduct}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Étape 3 : Configuration des marges
                </span>
                <span className="text-sm font-normal text-gray-500">
                  {selectedProducts.length} produit(s)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedProducts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun produit sélectionné</p>
                  <p className="text-sm">
                    Ajoutez des produits depuis le catalogue pour configurer
                    leurs marges
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {selectedProducts.map(product => (
                    <ProductConfigCard
                      key={product.product_id}
                      product={product}
                      onMarginChange={rate =>
                        handleMarginChange(product.product_id, rate)
                      }
                      onRemove={() => handleRemoveProduct(product.product_id)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
